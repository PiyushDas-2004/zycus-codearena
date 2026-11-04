import { mapState, mapWorkspace } from './mapping';
import type { ApiResult, CallTiming, CandidateApi, CandidateErrorCode, SyncPayload } from './types';

const REQUEST_TIMEOUT_MS = 20_000;
/** How long the browser waits for the assistant's reply (the server gives up after 45 s). */
const ASSISTANT_WAIT_MS = 50_000;
const ASSISTANT_POLL_MS = 1_000;

/** Gateway, overload and timeout statuses: retried like a network failure. */
const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524]);

type Raw = Record<string, unknown>;

/**
 * Candidate calls are plain HTTPS POSTs to PostgREST's RPC endpoint (`/rest/v1/rpc/<fn>`) with the
 * public key: no Supabase client library (keeps the candidate pages small and fast) and no auth
 * session, so requests always run as `anon` even if a staff member is signed in to the admin portal
 * in the same browser.
 */
export function createSupabaseCandidateApi(url: string, anonKey: string): CandidateApi {
  async function call(
    fn: string,
    args: Record<string, unknown>,
  ): Promise<{ raw: Raw | null; timing: CallTiming; networkError: boolean }> {
    const sentAtPerf = performance.now();
    try {
      const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(args),
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const timing = { sentAtPerf, receivedAtPerf: performance.now() };
      if (!res.ok) return { raw: null, timing, networkError: TRANSIENT_STATUS.has(res.status) };
      return { raw: ((await res.json()) ?? null) as Raw | null, timing, networkError: false };
    } catch {
      // No response at all (offline, DNS, timeout, connection reset).
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

    /**
     * Reserves a question, then polls for the reply: the assistant worker (on a laptop inside the
     * Zycus network) picks questions up from the database and posts the answers back.
     */
    async askAssistant(token, r) {
      const sentAtPerf = performance.now();
      const asked = await call('candidate_ai_ask', {
        p_token: token,
        p_question_id: r.questionId,
        p_prompt: r.message,
        p_file_path: r.filePath ?? '',
        p_code: r.code ?? '',
      });
      if (!isOk(asked.raw)) return fail(asked.raw, asked.timing, asked.networkError);
      const requestId = Number(asked.raw.request_id);
      const cooldownSeconds = Number(asked.raw.cooldown_seconds ?? 0);
      let remaining = Number(asked.raw.remaining ?? 0);
      const giveUpAt = performance.now() + ASSISTANT_WAIT_MS;
      while (performance.now() < giveUpAt) {
        await new Promise((resolve) => setTimeout(resolve, ASSISTANT_POLL_MS));
        const res = await call('candidate_ai_result', { p_token: token, p_request_id: requestId });
        if (res.networkError) continue; // keep waiting through a blip
        if (!isOk(res.raw)) return fail(res.raw, res.timing, false);
        if (res.raw.status === 'answered') {
          remaining = Number(res.raw.remaining ?? remaining);
          return {
            ok: true,
            timing: { sentAtPerf, receivedAtPerf: res.timing.receivedAtPerf },
            reply: String(res.raw.reply ?? ''),
            remaining,
            cooldownSeconds,
          };
        }
      }
      return {
        ok: false,
        error: 'ASSISTANT_UNAVAILABLE',
        timing: { sentAtPerf, receivedAtPerf: performance.now() },
      };
    },
  };
}
