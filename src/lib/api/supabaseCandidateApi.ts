import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mapState, mapWorkspace } from './mapping';
import type { ApiResult, CallTiming, CandidateApi, CandidateErrorCode, SyncPayload } from './types';

const REQUEST_TIMEOUT_MS = 20_000;

type Raw = Record<string, unknown>;

/**
 * Candidate calls go through a dedicated Supabase client with NO auth session: requests always run
 * as the `anon` role, even if a staff member is signed in to the admin portal in the same browser.
 */
export function createSupabaseCandidateApi(url: string, anonKey: string): CandidateApi {
  const client: SupabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'codearena-candidate-noauth',
    },
  });

  async function call(
    fn: string,
    args: Record<string, unknown>,
  ): Promise<{ raw: Raw | null; timing: CallTiming; networkError: boolean }> {
    const sentAtPerf = performance.now();
    try {
      const { data, error } = await client.rpc(fn, args).abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS));
      const timing = { sentAtPerf, receivedAtPerf: performance.now() };
      if (error) {
        // PostgREST errors (4xx/5xx) vs. transport failures (no response at all).
        const transport =
          !('code' in error) || !error.code || /fetch|network|abort|timeout/i.test(error.message);
        return { raw: null, timing, networkError: transport };
      }
      return { raw: (data ?? null) as Raw | null, timing, networkError: false };
    } catch {
      return { raw: null, timing: { sentAtPerf, receivedAtPerf: performance.now() }, networkError: true };
    }
  }

  function fail<T>(raw: Raw | null, timing: CallTiming, networkError: boolean): ApiResult<T> {
    if (networkError || !raw) return { ok: false, error: networkError ? 'NETWORK' : 'UNKNOWN', timing };
    return {
      ok: false,
      error: (typeof raw.error === 'string' ? raw.error : 'UNKNOWN') as CandidateErrorCode,
      state: raw.state ? mapState(raw.state) : undefined,
      retryAfterSeconds: typeof raw.retry_after_seconds === 'number' ? raw.retry_after_seconds : undefined,
      opensAtMs: typeof raw.opens_at_ms === 'number' ? raw.opens_at_ms : undefined,
      timing,
    };
  }

  const isOk = (raw: Raw | null): raw is Raw => !!raw && raw.ok === true;

  return {
    kind: 'supabase',

    async ping() {
      const { raw, timing, networkError } = await call('ping', {});
      if (!isOk(raw)) return fail(raw, timing, networkError);
      return { ok: true, timing, serverNowMs: Number(raw.server_now_ms) };
    },

    async login(email, accessCode, clientInfo) {
      const { raw, timing, networkError } = await call('candidate_login', {
        p_email: email,
        p_code: accessCode,
        p_client: clientInfo,
      });
      if (!isOk(raw)) return fail(raw, timing, networkError);
      return { ok: true, timing, token: String(raw.token), state: mapState(raw.state) };
    },

    async getState(token) {
      const { raw, timing, networkError } = await call('candidate_get_state', { p_token: token });
      if (!isOk(raw)) return fail(raw, timing, networkError);
      return { ok: true, timing, state: mapState(raw.state) };
    },

    async acceptConsent(token, version, sha256, clientInfo) {
      const { raw, timing, networkError } = await call('candidate_accept_consent', {
        p_token: token,
        p_consent_version: version,
        p_consent_sha256: sha256,
        p_client: clientInfo,
      });
      if (!isOk(raw)) return fail(raw, timing, networkError);
      return { ok: true, timing, state: mapState(raw.state) };
    },

    async start(token, clientInfo) {
      const { raw, timing, networkError } = await call('candidate_start', {
        p_token: token,
        p_client: clientInfo,
      });
      if (!isOk(raw)) return fail(raw, timing, networkError);
      return { ok: true, timing, state: mapState(raw.state) };
    },

    async getWorkspace(token) {
      const { raw, timing, networkError } = await call('candidate_get_workspace', { p_token: token });
      if (!isOk(raw)) return fail(raw, timing, networkError);
      return { ok: true, timing, workspace: mapWorkspace(raw) };
    },

    async sync(token, payload: SyncPayload) {
      const { raw, timing, networkError } = await call('candidate_sync', {
        p_token: token,
        p_payload: payload,
      });
      if (!isOk(raw)) return fail(raw, timing, networkError);
      const a = (raw.accepted ?? {}) as Raw;
      return {
        ok: true,
        timing,
        state: mapState(raw.state),
        accepted: {
          files: Number(a.files ?? 0),
          responses: Number(a.responses ?? 0),
          events: Number(a.events ?? 0),
          editorChunks: Number(a.editor_chunks ?? 0),
        },
      };
    },

    async submit(token, payload: SyncPayload) {
      const { raw, timing, networkError } = await call('candidate_submit', {
        p_token: token,
        p_payload: payload,
      });
      if (!isOk(raw)) return fail(raw, timing, networkError);
      return { ok: true, timing, state: mapState(raw.state) };
    },

    async uploadSnapshot(token, s) {
      const { raw, timing, networkError } = await call('candidate_upload_snapshot', {
        p_token: token,
        p_snapshot: {
          client_snapshot_id: s.clientSnapshotId,
          reason: s.reason,
          face_count: s.faceCount,
          width: s.width,
          height: s.height,
          jpeg_b64: s.jpegB64,
        },
      });
      if (!isOk(raw)) return fail(raw, timing, networkError);
      return { ok: true, timing, snapshotId: String(raw.snapshot_id) };
    },
  };
}
