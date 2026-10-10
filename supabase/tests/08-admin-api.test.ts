/**
 * Admin portal API (0012): who may do what, every validation, and the flows staff rely on —
 * inviting a candidate (the code is shown once and never stored), resetting or cancelling a code,
 * changing its window, extending time, messaging, force-submitting, and reopening a submitted test
 * with fresh warnings so the candidate continues where they left off.
 */
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asAnon, asUser, createTestDb, expectError, type Claims } from './helpers/db';
import { ids, seedFixtures, TEMPLATE_ID, users } from './helpers/fixtures';

let db: PGlite;
beforeAll(async () => {
  db = await createTestDb({ seed: true });
  await seedFixtures(db);
  await db.query('update public.app_settings set max_concurrent_sessions = 50');
});
afterAll(async () => db?.close());

type Json = Record<string, unknown> & { ok: boolean; error?: string };

async function call(who: Claims | 'anon', fn: string, ...args: unknown[]): Promise<Json> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
  const run = async () => {
    const { rows } = await db.query<{ r: Json }>(`select public.${fn}(${placeholders}) as r`, args);
    return rows[0]?.r as Json;
  };
  return who === 'anon' ? asAnon(db, run) : asUser(db, who, run);
}

const { superAdmin: sa, recruiter: rec, reviewerA: revA, outsider, gmailStaff, inactive } = users;
const HOUR = 3_600_000;
let n = 0;

async function invite(over: Record<string, unknown> = {}, who: Claims = rec) {
  const email = `cand${++n}@example.com`;
  return call(who, 'admin_create_invitation', {
    full_name: `Candidate ${n}`,
    email,
    template_id: TEMPLATE_ID,
    valid_until_ms: Date.now() + 24 * HOUR,
    ...over,
  });
}

/** Signs in with the code, accepts consent and starts: as a candidate's browser does. */
async function startTest(email: string, code: string) {
  const login = await call('anon', 'candidate_login', email, code, '{}');
  expect(login.ok, JSON.stringify(login)).toBe(true);
  const token = login.token as string;
  await call('anon', 'candidate_accept_consent', token, '2026-10-10.1', 'a'.repeat(64), '{}');
  const started = await call('anon', 'candidate_start', token, '{}');
  expect(started.ok, JSON.stringify(started)).toBe(true);
  return { token, sessionId: (started.state as { session_id: string }).session_id };
}

let ev = 0;
const sync = (token: string, events: { type: string; elapsed?: number }[]) =>
  call('anon', 'candidate_sync', token, {
    events: events.map((e) => ({
      type: e.type,
      client_event_id: `ev-${++ev}`,
      client_elapsed_ms: e.elapsed ?? 60_000,
      details: {},
    })),
  });

const state = async (token: string) =>
  (await call('anon', 'candidate_get_state', token)).state as {
    status: string;
    deadline_ms: number;
    server_now_ms: number;
    violation_count: number;
    violation_counts: Record<string, number>;
    violations_reset_count: number;
    submit_reason: string | null;
    messages: { body: string }[];
  };

async function invited(over: Record<string, unknown> = {}) {
  const res = await invite(over);
  expect(res.ok, JSON.stringify(res)).toBe(true);
  return {
    email: (res.candidate as { email: string }).email,
    code: res.access_code as string,
    invitationId: res.invitation_id as string,
  };
}

/** A started test, auto-submitted by leaving full screen too often (3 warnings, then submit). */
async function autoSubmitted() {
  const c = await invited();
  const t = await startTest(c.email, c.code);
  for (let i = 0; i < 4; i++) await sync(t.token, [{ type: 'fullscreen_exit' }]);
  const s = await state(t.token);
  expect(s.status).toBe('submitted');
  expect(s.submit_reason).toBe('violation_limit');
  return { ...c, ...t };
}

describe('who may use the admin API', () => {
  it('knows signed-in staff, and nobody else', async () => {
    expect(await call(sa, 'admin_me')).toMatchObject({
      ok: true,
      staff: { email: 'super.admin@zycus.com', role: 'super_admin' },
    });
    for (const who of [outsider, gmailStaff, inactive]) {
      expect((await call(who, 'admin_me')).error).toBe('NOT_STAFF');
    }
    const spoofed: Claims = { sub: users.superAdmin.sub, email: 'attacker@zycus.com' };
    expect((await call(spoofed, 'admin_me')).error).toBe('NOT_STAFF');
  });

  it('is not callable at all without signing in', async () => {
    for (const fn of [
      'admin_me()',
      'admin_overview()',
      `admin_reopen_session('${ids.sessA}', 10, true, 'x')`,
    ]) {
      expect(await expectError(asAnon(db, () => db.query(`select public.${fn}`)))).toMatch(
        /permission denied/i,
      );
    }
  });

  it('refuses every action to people who are not staff', async () => {
    const res = await call(outsider, 'admin_create_invitation', {
      full_name: 'X',
      email: 'x@example.com',
      template_id: TEMPLATE_ID,
      valid_until_ms: Date.now() + HOUR,
    });
    expect(res.error).toBe('NOT_STAFF');
    expect((await call(outsider, 'admin_list_candidates')).error).toBe('NOT_STAFF');
    expect((await call(outsider, 'admin_session_detail', ids.invA)).error).toBe('NOT_STAFF');
  });

  it('keeps reviewers read-only and limited to their assigned candidates', async () => {
    const list = await call(revA, 'admin_list_candidates');
    expect((list.rows as { invitation_id: string }[]).map((r) => r.invitation_id)).toEqual([ids.invA]);
    expect((await call(revA, 'admin_session_detail', ids.invB)).error).toBe('NOT_FOUND');
    const mine = await call(revA, 'admin_session_detail', ids.invA);
    expect((mine.files as unknown[]).length).toBeGreaterThan(0); // assigned: may see the code
    expect((await invite({}, revA)).error).toBe('FORBIDDEN');
    expect((await call(revA, 'admin_reopen_session', ids.sessA, 10, true, 'x')).error).toBe('FORBIDDEN');
    expect((await call(revA, 'admin_overview')).error).toBe('FORBIDDEN');
  });

  it('lets recruiters run assessments but not see code, staff or settings', async () => {
    const detail = await call(rec, 'admin_session_detail', ids.invA);
    expect(detail.ok).toBe(true);
    expect(detail.files).toEqual([]);
    expect((detail.questions as { rubric: unknown[] }[]).every((q) => q.rubric.length === 0)).toBe(true);
    expect((detail.snapshots as unknown[]).length).toBe(1); // monitoring is theirs
    expect((await call(rec, 'admin_list_staff')).error).toBe('FORBIDDEN');
    expect((await call(rec, 'admin_save_staff', 'new@zycus.com', 'New', 'recruiter', true)).error).toBe(
      'FORBIDDEN',
    );
    expect((await call(rec, 'admin_update_settings', { max_concurrent_sessions: 10 })).error).toBe(
      'FORBIDDEN',
    );
  });
});

describe('invitations', () => {
  it('creates a code that works once, shown once and never stored in plain text', async () => {
    const res = await invite({ role_applied: 'Lead RN', requisition_id: 'REQ-1', experience_years: '7.5' });
    expect(res).toMatchObject({ ok: true, template: { duration_minutes: 150 } });
    const code = res.access_code as string;
    expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(res.code_hint).toBe(code.slice(-4));

    const plain = code.replace(/-/g, '');
    const leaks = await db.query(
      `select 1 from public.audit_log where details::text like $1 or details::text like $2
       union all select 1 from public.invitations where code_hint <> $3 and (id::text like $1)`,
      [`%${plain}%`, `%${code}%`, code.slice(-4)],
    );
    expect(leaks.rows).toEqual([]);

    const email = (res.candidate as { email: string }).email;
    expect((await call('anon', 'candidate_login', email, code, '{}')).ok).toBe(true);
    expect((await call('anon', 'candidate_login', email, 'AAAA-BBBB-CCCC', '{}')).error).toBe(
      'INVALID_CREDENTIALS',
    );
  });

  it('validates every field', async () => {
    const bad = async (over: Record<string, unknown>) => (await invite(over)) as Json & { field?: string };
    expect((await bad({ full_name: '  ' })).field).toBe('full_name');
    expect((await bad({ email: 'not-an-email' })).field).toBe('email');
    expect((await bad({ template_id: '11111111-2222-4333-8444-000000000000' })).field).toBe('template_id');
    expect((await bad({ valid_until_ms: Date.now() - HOUR })).field).toBe('valid_until_ms');
    expect((await bad({ valid_until_ms: Date.now() + 5 * 60_000 })).field).toBe('valid_until_ms');
    expect((await bad({ valid_until_ms: Date.now() + 61 * 24 * HOUR })).field).toBe('valid_until_ms');
    expect((await bad({ valid_until_ms: 'soon' })).field).toBe('valid_until_ms');
    expect(
      (await bad({ valid_from_ms: Date.now() + 3 * HOUR, valid_until_ms: Date.now() + 2 * HOUR })).field,
    ).toBe('valid_until_ms');
    expect((await bad({ experience_years: '99' })).field).toBe('experience_years');
    expect((await bad({ experience_years: '-1' })).field).toBe('experience_years');
    expect((await bad({ notes: 'x'.repeat(5001) })).field).toBe('notes');
    expect((await bad({ assigned_reviewer_id: ids.outsider })).field).toBe('assigned_reviewer_id');
    expect((await call(rec, 'admin_create_invitation', null)).error).toBe('INVALID_PAYLOAD');
  });

  it('opens at a chosen time: "not yet open" until then', async () => {
    const c = await invited({ valid_from_ms: Date.now() + 2 * HOUR, valid_until_ms: Date.now() + 26 * HOUR });
    expect((await call('anon', 'candidate_login', c.email, c.code, '{}')).error).toBe('NOT_YET_OPEN');
  });

  it('refuses an inactive assessment', async () => {
    await db.query(`update public.test_templates set is_active = false where id = $1`, [TEMPLATE_ID]);
    try {
      expect((await invite()).error).toBe('TEMPLATE_INACTIVE');
    } finally {
      await db.query(`update public.test_templates set is_active = true where id = $1`, [TEMPLATE_ID]);
    }
  });

  it('does not issue a second working code for the same person, unless asked', async () => {
    const first = await invite({ email: 'twice@example.com' });
    expect(first.ok).toBe(true);
    const again = await invite({ email: 'Twice@Example.com ' });
    expect(again).toMatchObject({ ok: false, error: 'DUPLICATE_ACTIVE', invitation_id: first.invitation_id });
    const forced = await invite({ email: 'twice@example.com', allow_duplicate: true });
    expect(forced.ok).toBe(true);
    // Same person, same candidate record (the name is updated).
    expect(forced.candidate_id).toBe(first.candidate_id);
  });

  it('allows a new invitation once the earlier test is submitted', async () => {
    const c = await autoSubmitted();
    const again = await invite({ email: c.email });
    expect(again.ok).toBe(true);
  });

  it('resets a lost code: the old one stops working, the new one works', async () => {
    const c = await invited();
    const reset = await call(rec, 'admin_reset_code', c.invitationId);
    expect(reset.ok).toBe(true);
    expect((await call('anon', 'candidate_login', c.email, c.code, '{}')).error).toBe('INVALID_CREDENTIALS');
    expect((await call('anon', 'candidate_login', c.email, reset.access_code, '{}')).ok).toBe(true);
    const audit = await db.query<{ details: { new_hint: string } }>(
      `select details from public.audit_log where action = 'access_code_reset' and entity_id = $1`,
      [c.invitationId],
    );
    expect(audit.rows[0]?.details.new_hint).toBe((reset.access_code as string).slice(-4));
    expect(JSON.stringify(audit.rows)).not.toContain((reset.access_code as string).replace(/-/g, ''));
  });

  it("doesn't reset or reopen the window of a finished test", async () => {
    const c = await autoSubmitted();
    expect((await call(rec, 'admin_reset_code', c.invitationId)).error).toBe('ALREADY_FINISHED');
    const w = await call(
      rec,
      'admin_update_invitation_window',
      c.invitationId,
      Date.now(),
      Date.now() + HOUR,
    );
    expect(w.error).toBe('ALREADY_STARTED');
    expect((await call(rec, 'admin_reset_code', '11111111-2222-4333-8444-000000000000')).error).toBe(
      'NOT_FOUND',
    );
  });

  it('extends an expired code so the candidate can start', async () => {
    const c = await invited();
    await db.query(
      `update public.invitations set valid_from = now() - interval '3 days', valid_until = now() - interval '1 day' where id = $1`,
      [c.invitationId],
    );
    expect((await call('anon', 'candidate_login', c.email, c.code, '{}')).error).toBe('EXPIRED');
    const bad = await call(
      rec,
      'admin_update_invitation_window',
      c.invitationId,
      Date.now(),
      Date.now() - HOUR,
    );
    expect(bad.error).toBe('INVALID_PAYLOAD');
    const ok = await call(
      rec,
      'admin_update_invitation_window',
      c.invitationId,
      Date.now() - 60_000,
      Date.now() + 2 * HOUR,
    );
    expect(ok.ok).toBe(true);
    await startTest(c.email, c.code);
  });

  it('cancels a code before the test starts, and not after', async () => {
    const c = await invited();
    expect((await call(rec, 'admin_revoke_invitation', c.invitationId, 'Withdrew')).ok).toBe(true);
    expect((await call('anon', 'candidate_login', c.email, c.code, '{}')).error).toBe('REVOKED');
    expect((await call(rec, 'admin_revoke_invitation', c.invitationId, '')).ok).toBe(true); // idempotent

    const d = await invited();
    await startTest(d.email, d.code);
    expect((await call(rec, 'admin_revoke_invitation', d.invitationId, '')).error).toBe('ALREADY_STARTED');
  });

  it('lists candidates with their state, newest first, searchable and filterable', async () => {
    const c = await invited({ full_name: 'Zebra Findme', requisition_id: 'REQ-777' });
    const signedIn = await invited();
    await call('anon', 'candidate_login', signedIn.email, signedIn.code, '{}');

    const all = await call(rec, 'admin_list_candidates');
    const rows = all.rows as { invitation_id: string; state: string; created_at_ms: number }[];
    expect(rows.length).toBe(all.total);
    expect(rows.map((r) => r.created_at_ms)).toEqual(
      [...rows.map((r) => r.created_at_ms)].sort((a, b) => b - a),
    );
    expect(rows.find((r) => r.invitation_id === c.invitationId)?.state).toBe('invited');
    expect(rows.find((r) => r.invitation_id === signedIn.invitationId)?.state).toBe('signed_in');
    expect(rows.find((r) => r.invitation_id === ids.invA)?.state).toBe('submitted');

    for (const q of ['zebra', 'FINDME', 'req-777', c.email, c.code.slice(-4)]) {
      const found = await call(rec, 'admin_list_candidates', q);
      expect(
        (found.rows as { invitation_id: string }[]).map((r) => r.invitation_id),
        q,
      ).toContain(c.invitationId);
    }
    const submitted = await call(rec, 'admin_list_candidates', null, 'submitted');
    expect((submitted.rows as { state: string }[]).every((r) => r.state === 'submitted')).toBe(true);
    const page = await call(rec, 'admin_list_candidates', null, null, 1, 1);
    expect((page.rows as unknown[]).length).toBe(1);
    expect((await call(rec, 'admin_list_candidates', 'x'.repeat(201))).error).toBe('INVALID_PAYLOAD');
    // A search is text, never SQL.
    const sneaky = await call(rec, 'admin_list_candidates', `%' or 1=1 --`);
    expect(sneaky).toMatchObject({ ok: true, total: 0 });
  });
});

describe('a test in progress', () => {
  it('extends the time, up to 4 hours in total', async () => {
    const c = await invited();
    const t = await startTest(c.email, c.code);
    const before = (await state(t.token)).deadline_ms;
    const res = await call(rec, 'admin_extend_time', t.sessionId, 15, 'Power cut');
    expect(res.ok).toBe(true);
    expect((await state(t.token)).deadline_ms - before).toBe(15 * 60_000);
    expect((await call(rec, 'admin_extend_time', t.sessionId, 0, '')).error).toBe('INVALID_PAYLOAD');
    expect((await call(rec, 'admin_extend_time', t.sessionId, 240, '')).error).toBe('EXTENSION_LIMIT');
    const events = await db.query(
      `select 1 from public.proctor_events where session_id = $1 and type = 'admin_time_extension'`,
      [t.sessionId],
    );
    expect(events.rows).toHaveLength(1);
  });

  it('sends a message the candidate sees', async () => {
    const c = await invited();
    const t = await startTest(c.email, c.code);
    expect((await call(rec, 'admin_send_message', t.sessionId, '  ')).error).toBe('INVALID_PAYLOAD');
    expect((await call(rec, 'admin_send_message', t.sessionId, 'Please face the camera.')).ok).toBe(true);
    expect((await state(t.token)).messages.map((m) => m.body)).toEqual(['Please face the camera.']);
  });

  it('force-submits, after which the code no longer signs in', async () => {
    const c = await invited();
    const t = await startTest(c.email, c.code);
    expect((await call(rec, 'admin_force_submit', t.sessionId, 'Suspected help')).ok).toBe(true);
    expect((await state(t.token)).submit_reason).toBe('admin_force');
    expect((await call('anon', 'candidate_login', c.email, c.code, '{}')).error).toBe('ALREADY_SUBMITTED');
    expect((await call(rec, 'admin_force_submit', t.sessionId, '')).error).toBe('NOT_IN_PROGRESS');
    expect((await call(rec, 'admin_extend_time', t.sessionId, 5, '')).error).toBe('NOT_IN_PROGRESS');
    expect((await call(rec, 'admin_send_message', t.sessionId, 'hi')).error).toBe('NOT_IN_PROGRESS');
  });
});

describe('reopening a submitted test', () => {
  it('continues where they left off, with the time they had left and fresh warnings', async () => {
    const c = await autoSubmitted();
    const ended = await state(c.token);
    const left = ended.deadline_ms - ended.server_now_ms; // ≈ the full 150 minutes
    expect((await call('anon', 'candidate_login', c.email, c.code, '{}')).error).toBe('ALREADY_SUBMITTED');

    const res = await call(
      rec,
      'admin_reopen_session',
      c.sessionId,
      0,
      true,
      'Face detector false positives',
    );
    expect(res).toMatchObject({ ok: true, violations_uncounted: 4 });

    // Signing in again is expected now: no "new sign-in" violation.
    const login = await call('anon', 'candidate_login', c.email, c.code, '{}');
    expect(login.ok).toBe(true);
    const token = login.token as string;
    const s = await state(token);
    expect(s.status).toBe('in_progress');
    expect(s.violation_count).toBe(0);
    expect(s.violation_counts).toEqual({});
    expect(s.violations_reset_count).toBe(1);
    expect(Math.abs(s.deadline_ms - s.server_now_ms - left)).toBeLessThan(5_000);

    // The earlier events stay for reviewers, marked as reset.
    const kept = await db.query<{ counted: boolean; details: Record<string, unknown> }>(
      `select counted, details from public.proctor_events where session_id = $1 and type = 'fullscreen_exit'`,
      [c.sessionId],
    );
    expect(kept.rows).toHaveLength(4);
    expect(kept.rows.every((r) => !r.counted && r.details.reset_by_reopen === 1)).toBe(true);

    // Fresh warnings: 3 more full-screen exits are warnings again; the 4th submits.
    for (let i = 0; i < 3; i++) await sync(token, [{ type: 'fullscreen_exit', elapsed: 9_000_000 }]);
    expect((await state(token)).status).toBe('in_progress');
    await sync(token, [{ type: 'fullscreen_exit', elapsed: 9_000_000 }]);
    expect((await state(token)).submit_reason).toBe('violation_limit');
  });

  it("doesn't count late events from before the reopen that the device sends afterwards", async () => {
    const c = await autoSubmitted();
    // The test started an hour before it was reopened.
    await db.query(`update public.sessions set started_at = started_at - interval '1 hour' where id = $1`, [
      c.sessionId,
    ]);
    await call(rec, 'admin_reopen_session', c.sessionId, 0, true, 'Retry');
    const token = (await call('anon', 'candidate_login', c.email, c.code, '{}')).token as string;
    await sync(token, [{ type: 'tab_switch', elapsed: 1_000 }]); // happened before the reopen
    const s = await state(token);
    expect(s.violation_count).toBe(0);
    const ev2 = await db.query<{ severity: string; details: Record<string, unknown> }>(
      `select severity, details from public.proctor_events where session_id = $1 and type = 'tab_switch'`,
      [c.sessionId],
    );
    expect(ev2.rows).toEqual([{ severity: 'flag', details: { before_reset: true } }]);
  });

  it('still counts a second sign-in elsewhere after the expected one', async () => {
    const c = await autoSubmitted();
    await call(rec, 'admin_reopen_session', c.sessionId, 0, true, 'Retry');
    await call('anon', 'candidate_login', c.email, c.code, '{}');
    const second = await call('anon', 'candidate_login', c.email, c.code, '{}');
    expect((await state(second.token as string)).violation_counts).toEqual({ session_takeover: 1 });
  });

  it('can keep the earlier warnings', async () => {
    const c = await autoSubmitted();
    // With the count kept, the next full-screen exit submits again at once.
    expect((await call(rec, 'admin_reopen_session', c.sessionId, 5, false, 'Network drop')).ok).toBe(true);
    const token = (await call('anon', 'candidate_login', c.email, c.code, '{}')).token as string;
    expect((await state(token)).violation_counts).toEqual({ fullscreen_exit: 4 });
  });

  it('needs extra minutes when no time was left (time-up)', async () => {
    const c = await invited();
    const t = await startTest(c.email, c.code);
    await db.query(
      `update public.sessions set started_at = now() - interval '3 hours', deadline = now() - interval '1 minute' where id = $1`,
      [t.sessionId],
    );
    expect((await state(t.token)).submit_reason).toBe('time_up');

    expect(await call(rec, 'admin_reopen_session', t.sessionId, 0, true, 'Late start')).toMatchObject({
      ok: false,
      error: 'NO_TIME_LEFT',
      remaining_seconds: 0,
    });
    const res = await call(rec, 'admin_reopen_session', t.sessionId, 10, true, 'Late start');
    expect(res.ok).toBe(true);
    const s = await state((await call('anon', 'candidate_login', c.email, c.code, '{}')).token as string);
    expect(Math.abs(s.deadline_ms - s.server_now_ms - 10 * 60_000)).toBeLessThan(5_000);

    // When the new time runs out, it ends again.
    await db.query(
      `update public.sessions set started_at = now() - interval '3 hours', deadline = now() - interval '1 minute' where id = $1`,
      [t.sessionId],
    );
    expect((await call('anon', 'candidate_login', c.email, c.code, '{}')).error).toBe('ALREADY_SUBMITTED');
  });

  it('requires a reason and a submitted test, and is audited', async () => {
    const c = await autoSubmitted();
    expect((await call(rec, 'admin_reopen_session', c.sessionId, 0, true, '  ')).error).toBe(
      'INVALID_PAYLOAD',
    );
    expect((await call(rec, 'admin_reopen_session', c.sessionId, 999, true, 'x')).error).toBe(
      'INVALID_PAYLOAD',
    );
    expect((await call(rec, 'admin_reopen_session', c.sessionId, 0, true, 'First')).ok).toBe(true);
    expect((await call(rec, 'admin_reopen_session', c.sessionId, 0, true, 'Again')).error).toBe(
      'NOT_SUBMITTED',
    );
    expect(
      (await call(rec, 'admin_reopen_session', '11111111-2222-4333-8444-000000000000', 0, true, 'x')).error,
    ).toBe('NOT_FOUND');

    // Reopened twice: both visible to reviewers.
    const token = (await call('anon', 'candidate_login', c.email, c.code, '{}')).token as string;
    await call('anon', 'candidate_submit', token, {});
    expect((await call(sa, 'admin_reopen_session', c.sessionId, 0, true, 'Second time')).ok).toBe(true);
    const audit = await db.query<{ actor_email: string; details: { note: string } }>(
      `select actor_email, details from public.audit_log where action = 'session_reopened' and entity_id = $1 order by id`,
      [c.sessionId],
    );
    expect(audit.rows.map((r) => [r.actor_email, r.details.note])).toEqual([
      [rec.email, 'First'],
      [sa.email, 'Second time'],
    ]);
    const detail = await call(sa, 'admin_session_detail', c.invitationId);
    expect((detail.session as { reopen_count: number }).reopen_count).toBe(2);
    const reopens = (detail.events as { type: string; details: { note: string } }[]).filter(
      (e) => e.type === 'admin_reopen',
    );
    expect(reopens.map((e) => e.details.note)).toEqual(['First', 'Second time']);
  });
});

describe('the candidate page', () => {
  it('shows everything about the test to a super admin', async () => {
    const detail = await call(sa, 'admin_session_detail', ids.invA);
    expect(detail).toMatchObject({
      ok: true,
      state: 'submitted',
      candidate: { email: 'cand.a@example.com' },
    });
    expect((detail.questions as unknown[]).length).toBe(4);
    expect(detail.files).toEqual([
      expect.objectContaining({ path: 'App.tsx', content: '// candidate A code' }),
    ]);
    expect(detail.events).toEqual([
      expect.objectContaining({
        type: 'tab_switch',
        label: 'Tab switch',
        counted: true,
        severity: 'violation',
      }),
    ]);
    const snap = (detail.snapshots as { id: string }[])[0]!;
    expect(await call(sa, 'admin_snapshot_image', snap.id)).toEqual({ ok: true, jpeg_b64: '/9g=' });
    expect((await call(revA, 'admin_snapshot_image', ids.snapB)).error).toBe('NOT_FOUND');
    expect((await call(sa, 'admin_session_detail', '11111111-2222-4333-8444-000000000000')).error).toBe(
      'NOT_FOUND',
    );
  });

  it('works for a candidate who has not signed in yet', async () => {
    const c = await invited();
    const detail = await call(rec, 'admin_session_detail', c.invitationId);
    expect(detail).toMatchObject({ ok: true, state: 'invited', session: null, questions: [], events: [] });
  });
});

describe('overview, staff and settings', () => {
  it('summarises the platform for the dashboard', async () => {
    const o = await call(rec, 'admin_overview');
    expect(o.ok).toBe(true);
    const counts = o.counts as Record<string, number>;
    expect(counts.submitted).toBeGreaterThanOrEqual(2);
    expect(o.worker).toMatchObject({ online: false, configured: false });
    expect(o.budget).toMatchObject({ cap_usd: 5 });
    expect(o.templates).toEqual([
      expect.objectContaining({ id: TEMPLATE_ID, question_count: 4, duration_minutes: 150, is_active: true }),
    ]);
  });

  it('lets super admins add, change and deactivate staff, keeping one super admin', async () => {
    expect((await call(sa, 'admin_save_staff', 'new.recruiter@zycus.com', 'New', 'recruiter', true)).ok).toBe(
      true,
    );
    const list = (await call(sa, 'admin_list_staff')).staff as {
      email: string;
      role: string;
      is_active: boolean;
    }[];
    expect(list.find((s) => s.email === 'new.recruiter@zycus.com')).toMatchObject({
      role: 'recruiter',
      is_active: true,
    });
    expect((await call(sa, 'admin_save_staff', 'NEW.recruiter@zycus.com', 'New', 'reviewer', false)).ok).toBe(
      true,
    );
    expect(
      ((await call(sa, 'admin_list_staff')).staff as { email: string; role: string }[]).find(
        (s) => s.email === 'new.recruiter@zycus.com',
      ),
    ).toMatchObject({ role: 'reviewer', is_active: false });

    expect((await call(sa, 'admin_save_staff', 'someone@gmail.com', 'X', 'recruiter', true)).error).toBe(
      'INVALID_PAYLOAD',
    );
    expect((await call(sa, 'admin_save_staff', 'a@zycus.com', 'X', 'owner', true)).error).toBe(
      'INVALID_PAYLOAD',
    );
    // The only active super admin can't demote themselves.
    const demote = await call(sa, 'admin_save_staff', sa.email, 'Super Admin', 'recruiter', true);
    expect(demote).toMatchObject({ ok: false, error: 'FORBIDDEN' });
    expect((await call(sa, 'admin_me')).staff).toMatchObject({ role: 'super_admin' });
  });

  it('changes how many tests may run at the same time', async () => {
    expect((await call(sa, 'admin_update_settings', { max_concurrent_sessions: 0 })).error).toBe(
      'INVALID_PAYLOAD',
    );
    expect(
      (
        await call(sa, 'admin_update_settings', {
          max_concurrent_sessions: 20,
          grievance_contact_email: 'bad',
        })
      ).error,
    ).toBe('INVALID_PAYLOAD');
    expect(
      (
        await call(sa, 'admin_update_settings', {
          max_concurrent_sessions: 20,
          grievance_contact_email: 'privacy@zycus.com',
        })
      ).ok,
    ).toBe(true);
    const o = await call(sa, 'admin_overview');
    expect(o.settings).toMatchObject({
      max_concurrent_sessions: 20,
      grievance_contact_email: 'privacy@zycus.com',
    });
    await db.query('update public.app_settings set max_concurrent_sessions = 50');
  });
});
