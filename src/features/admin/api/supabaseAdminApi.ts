/**
 * The admin API over Supabase: Supabase Auth for staff sign-in (email + password, or Microsoft
 * when enabled), and the admin functions (POST /rest/v1/rpc/admin_*) with the staff member's token.
 * The database checks the role on every call; this client never decides what someone may do.
 *
 * Only the admin pages load this module (and the Supabase client library); candidate pages never do.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as map from './mapping';
import type { AdminApi, AdminFailure, AdminResult, Staff } from './types';

type Raw = Record<string, unknown>;

/** Session storage key, apart from anything the candidate pages store. */
export const ADMIN_AUTH_STORAGE_KEY = 'codearena.admin.auth';

export function createSupabaseAdminApi(url: string, anonKey: string): AdminApi {
  const client: SupabaseClient = createClient(url, anonKey, {
    auth: {
      storageKey: ADMIN_AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // Microsoft sign-in returns here with a code
      flowType: 'pkce',
    },
  });

  async function call(fn: string, args: Raw = {}): Promise<{ raw: Raw } | AdminFailure> {
    let res;
    try {
      res = await client.rpc(fn, args);
    } catch {
      return { ok: false, error: 'NETWORK' };
    }
    if (res.error) {
      // 42501: permission denied, i.e. the request ran without a staff session (signed out/expired).
      if (res.error.code === '42501' || res.status === 401) return { ok: false, error: 'SIGNED_OUT' };
      if (!res.status || res.status >= 500 || /fetch|network/i.test(res.error.message)) {
        return { ok: false, error: 'NETWORK' };
      }
      return { ok: false, error: 'UNKNOWN', message: res.error.message };
    }
    const raw = (res.data ?? {}) as Raw;
    if (raw.ok !== true) return map.failure(raw);
    return { raw };
  }

  const me = async (): Promise<AdminResult<{ staff: Staff }>> => {
    const r = await call('admin_me');
    return 'raw' in r ? { ok: true, staff: map.staff(r.raw.staff) } : r;
  };

  return {
    kind: 'supabase',

    async restore() {
      const { data } = await client.auth.getSession();
      if (!data.session) return { ok: true, staff: null };
      const r = await me();
      if (r.ok) return r;
      if (r.error === 'NOT_STAFF' || r.error === 'SIGNED_OUT') {
        if (r.error === 'NOT_STAFF') await client.auth.signOut({ scope: 'local' });
        return r.error === 'NOT_STAFF' ? r : { ok: true, staff: null };
      }
      return r;
    },

    async signIn(email, password) {
      let result;
      try {
        result = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      } catch {
        return { ok: false, error: 'NETWORK' };
      }
      if (result.error) {
        const status = (result.error as { status?: number }).status ?? 0;
        if (!status || status >= 500) return { ok: false, error: 'NETWORK' };
        return {
          ok: false,
          error: 'INVALID_PAYLOAD',
          field: 'password',
          message: 'Wrong email or password.',
        };
      }
      const r = await me();
      if (!r.ok) await client.auth.signOut({ scope: 'local' });
      return r;
    },

    async signInWithMicrosoft() {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'azure',
        options: { scopes: 'openid profile email', redirectTo: `${window.location.origin}/admin` },
      });
      return error ? { ok: false, error: 'NETWORK', message: error.message } : { ok: true };
    },

    async signOut() {
      await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
    },

    onSignedOut(listener) {
      const { data } = client.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') listener();
      });
      return () => data.subscription.unsubscribe();
    },

    async overview() {
      const r = await call('admin_overview');
      return 'raw' in r ? { ok: true, ...map.overview(r.raw) } : r;
    },

    async listCandidates({ search = '', state = '', limit = 200, offset = 0 }) {
      const r = await call('admin_list_candidates', {
        p_search: search || null,
        p_state: state || null,
        p_limit: limit,
        p_offset: offset,
      });
      if (!('raw' in r)) return r;
      return {
        ok: true,
        total: Number(r.raw.total ?? 0),
        serverNowMs: Number(r.raw.server_now_ms ?? Date.now()),
        rows: (Array.isArray(r.raw.rows) ? r.raw.rows : []).map((x) => map.candidateRow(x as Raw)),
      };
    },

    async createInvitation(input) {
      const r = await call('admin_create_invitation', {
        p: {
          full_name: input.fullName,
          email: input.email,
          template_id: input.templateId,
          valid_from_ms: input.validFromMs,
          valid_until_ms: input.validUntilMs,
          role_applied: input.roleApplied,
          experience_years: input.experienceYears,
          requisition_id: input.requisitionId,
          notes: input.notes,
          assigned_reviewer_id: input.assignedReviewerId || null,
          allow_duplicate: input.allowDuplicate === true,
        },
      });
      if (!('raw' in r)) return r;
      const c = (r.raw.candidate ?? {}) as Raw;
      const t = (r.raw.template ?? {}) as Raw;
      return {
        ok: true,
        invitationId: String(r.raw.invitation_id),
        candidateId: String(r.raw.candidate_id),
        accessCode: String(r.raw.access_code),
        codeHint: String(r.raw.code_hint),
        validFromMs: Number(r.raw.valid_from_ms),
        validUntilMs: Number(r.raw.valid_until_ms),
        candidate: { fullName: String(c.full_name ?? ''), email: String(c.email ?? '') },
        template: { name: String(t.name ?? ''), durationMinutes: Number(t.duration_minutes ?? 0) },
      };
    },

    async resetCode(invitationId) {
      const r = await call('admin_reset_code', { p_invitation_id: invitationId });
      return 'raw' in r
        ? { ok: true, accessCode: String(r.raw.access_code), codeHint: String(r.raw.code_hint) }
        : r;
    },

    async updateWindow(invitationId, validFromMs, validUntilMs) {
      const r = await call('admin_update_invitation_window', {
        p_invitation_id: invitationId,
        p_valid_from_ms: validFromMs,
        p_valid_until_ms: validUntilMs,
      });
      return 'raw' in r
        ? { ok: true, validFromMs: Number(r.raw.valid_from_ms), validUntilMs: Number(r.raw.valid_until_ms) }
        : r;
    },

    async revokeInvitation(invitationId, note) {
      const r = await call('admin_revoke_invitation', { p_invitation_id: invitationId, p_note: note });
      return 'raw' in r ? { ok: true } : r;
    },

    async candidateDetail(invitationId) {
      const r = await call('admin_session_detail', { p_invitation_id: invitationId });
      return 'raw' in r ? { ok: true, ...map.candidateDetail(r.raw) } : r;
    },

    async snapshotImage(snapshotId) {
      const r = await call('admin_snapshot_image', { p_snapshot_id: snapshotId });
      return 'raw' in r ? { ok: true, jpegB64: String(r.raw.jpeg_b64 ?? '') } : r;
    },

    async extendTime(sessionId, minutes, note) {
      const r = await call('admin_extend_time', {
        p_session_id: sessionId,
        p_minutes: minutes,
        p_note: note,
      });
      return 'raw' in r ? { ok: true, deadlineMs: Number(r.raw.deadline_ms) } : r;
    },

    async forceSubmit(sessionId, note) {
      const r = await call('admin_force_submit', { p_session_id: sessionId, p_note: note });
      return 'raw' in r ? { ok: true } : r;
    },

    async sendMessage(sessionId, body) {
      const r = await call('admin_send_message', { p_session_id: sessionId, p_body: body });
      return 'raw' in r ? { ok: true, messageId: String(r.raw.message_id) } : r;
    },

    async reopen(sessionId, extraMinutes, resetViolations, note) {
      const r = await call('admin_reopen_session', {
        p_session_id: sessionId,
        p_extra_minutes: extraMinutes,
        p_reset_violations: resetViolations,
        p_note: note,
      });
      return 'raw' in r
        ? {
            ok: true,
            deadlineMs: Number(r.raw.deadline_ms),
            remainingSeconds: Number(r.raw.remaining_seconds),
            violationsUncounted: Number(r.raw.violations_uncounted ?? 0),
          }
        : r;
    },

    async listStaff() {
      const r = await call('admin_list_staff');
      return 'raw' in r
        ? { ok: true, staff: (Array.isArray(r.raw.staff) ? r.raw.staff : []).map(map.staffMember) }
        : r;
    },

    async saveStaff(email, fullName, role, isActive) {
      const r = await call('admin_save_staff', {
        p_email: email,
        p_full_name: fullName,
        p_role: role,
        p_is_active: isActive,
      });
      return 'raw' in r ? { ok: true, id: String(r.raw.id) } : r;
    },

    async updateSettings(s) {
      const r = await call('admin_update_settings', {
        p: {
          max_concurrent_sessions: s.maxConcurrentSessions,
          grievance_contact_email: s.grievanceContactEmail,
        },
      });
      return 'raw' in r ? { ok: true } : r;
    },
  };
}
