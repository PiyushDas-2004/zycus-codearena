/**
 * Candidate API: everything a candidate's browser can do, called exactly as PostgREST would (role
 * `anon`). Covers sign-in and rate limiting, token rotation, consent, the server-side clock,
 * autosave ordering, violation policy, time-up, submission and capacity.
 */
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asAnon, createTestDb, expectError } from './helpers/db';
import { Q_RN } from './helpers/fixtures';

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  // Most tests run several candidates side by side; the one-at-a-time rule has its own test below.
  await db.query('update public.app_settings set max_concurrent_sessions = 50');
});
afterAll(async () => db?.close());

type Json = Record<string, unknown> & { ok: boolean; error?: string };
type State = {
  session_id: string;
  status: string;
  deadline_ms: number | null;
  started_at_ms: number | null;
  server_now_ms: number;
  submit_reason: string | null;
  submitted_at_ms: number | null;
  violation_count: number;
  consent_accepted: boolean;
};

async function rpc(fn: string, ...args: unknown[]): Promise<Json> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
  return asAnon(db, async () => {
    const { rows } = await db.query<{ r: Json }>(`select public.${fn}(${placeholders}) as r`, args);
    return rows[0]?.r as Json;
  });
}

async function invite(
  name: string,
  email: string,
  validHours = 24,
): Promise<{ code: string; candidateId: string }> {
  const { rows } = await db.query<{ access_code: string; candidate_id: string }>(
    `select * from private.create_test_invitation($1, $2, 'lead-react-native-hands-on', $3)`,
    [name, email, validHours],
  );
  return { code: rows[0]?.access_code as string, candidateId: rows[0]?.candidate_id as string };
}

const CONSENT_SHA = 'a'.repeat(64);

async function startedSession(name: string, email: string) {
  const { code } = await invite(name, email);
  const login = await rpc('candidate_login', email, code, '{}');
  const token = login.token as string;
  await rpc('candidate_accept_consent', token, '2026-10-09.1', CONSENT_SHA, '{}');
  const started = await rpc('candidate_start', token, '{}');
  return { code, token, started };
}

const stateOf = (r: Json) => r.state as State;
const setHeaders = (h: Record<string, string> | null) =>
  db.query(`select set_config('request.headers', $1, false)`, [h ? JSON.stringify(h) : '']);

describe('sign-in', () => {
  it('rejects a wrong code or a wrong email with the same generic error', async () => {
    const { code } = await invite('Generic', 'generic@example.com');
    expect((await rpc('candidate_login', 'generic@example.com', 'ZZZZ-ZZZZ-ZZZZ', '{}')).error).toBe(
      'INVALID_CREDENTIALS',
    );
    expect((await rpc('candidate_login', 'someone.else@example.com', code, '{}')).error).toBe(
      'INVALID_CREDENTIALS',
    );
  });

  it('accepts the code in any case/format and returns a pending session without secrets', async () => {
    const { code } = await invite('Ana', 'Ana.Candidate@Example.com');
    const res = await rpc(
      'candidate_login',
      '  ana.candidate@example.com ',
      code.toLowerCase().replaceAll('-', ' '),
      '{}',
    );
    expect(res.ok).toBe(true);
    expect(res.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(stateOf(res).status).toBe('pending');
    const text = JSON.stringify(res);
    for (const forbidden of ['rubric', 'max_points', 'notes_md', 'reference', 'backup_key', 'token_hash']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });

  it('locks an email after 5 failures, without affecting other candidates', async () => {
    const { code } = await invite('Locked', 'locked@example.com');
    for (let i = 0; i < 5; i++) await rpc('candidate_login', 'locked@example.com', 'AAAA-AAAA-AAAA', '{}');
    const res = await rpc('candidate_login', 'locked@example.com', code, '{}');
    expect(res.error).toBe('RATE_LIMITED');
    expect(res.retry_after_seconds).toBe(900);
    const other = await invite('Unaffected', 'unaffected@example.com');
    expect((await rpc('candidate_login', 'unaffected@example.com', other.code, '{}')).ok).toBe(true);
  });

  it('limits failures per IP across many emails (hashed with a secret pepper)', async () => {
    await setHeaders({ 'cf-connecting-ip': '203.0.113.9' });
    try {
      for (let i = 0; i < 10; i++)
        await rpc('candidate_login', `ip-probe-${i}@example.com`, 'AAAA-AAAA-AAAA', '{}');
      expect((await rpc('candidate_login', 'ip-probe-final@example.com', 'AAAA-AAAA-AAAA', '{}')).error).toBe(
        'RATE_LIMITED',
      );
      const { rows } = await db.query<{ n: number }>(
        `select count(distinct ip_hash)::int as n from private.login_attempts where ip_hash is not null`,
      );
      expect(rows[0]?.n).toBe(1);
      const raw = await db.query(
        `select 1 from private.login_attempts where ip_hash = convert_to('203.0.113.9','UTF8')`,
      );
      expect(raw.rows).toHaveLength(0); // never stored in clear
    } finally {
      await setHeaders(null);
    }
  });

  it('refuses invitations outside their window, and revoked ones', async () => {
    const early = await invite('Early', 'early@example.com');
    await db.query(
      `update public.invitations set valid_from = now() + interval '1 day', valid_until = now() + interval '2 days'
                    where candidate_id = $1`,
      [early.candidateId],
    );
    expect((await rpc('candidate_login', 'early@example.com', early.code, '{}')).error).toBe('NOT_YET_OPEN');

    const late = await invite('Late', 'late@example.com');
    await db.query(
      `update public.invitations set valid_from = now() - interval '2 days', valid_until = now() - interval '1 day'
                    where candidate_id = $1`,
      [late.candidateId],
    );
    expect((await rpc('candidate_login', 'late@example.com', late.code, '{}')).error).toBe('EXPIRED');

    const revoked = await invite('Revoked', 'revoked@example.com');
    await db.query(`update public.invitations set status = 'revoked' where candidate_id = $1`, [
      revoked.candidateId,
    ]);
    expect((await rpc('candidate_login', 'revoked@example.com', revoked.code, '{}')).error).toBe('REVOKED');
  });

  it('does not let anon call internal helpers', async () => {
    expect(
      await expectError(
        asAnon(db, () => db.query(`select * from private.create_test_invitation('x', 'x@example.com')`)),
      ),
    ).toMatch(/permission denied/i);
  });
});

describe('consent, start and the server clock', () => {
  let token = '';

  it('requires consent before starting and rejects work before the start', async () => {
    const { code } = await invite('Ravi', 'ravi@example.com');
    token = (await rpc('candidate_login', 'ravi@example.com', code, '{}')).token as string;
    expect((await rpc('candidate_start', token, '{}')).error).toBe('CONSENT_REQUIRED');
    expect((await rpc('candidate_sync', token, '{}')).error).toBe('NOT_STARTED');
    expect((await rpc('candidate_get_workspace', token)).error).toBe('NOT_STARTED');
    expect((await rpc('candidate_accept_consent', token, 'v1', 'not-a-hash', '{}')).error).toBe(
      'INVALID_PAYLOAD',
    );
    expect(
      stateOf(await rpc('candidate_accept_consent', token, '2026-10-09.1', CONSENT_SHA, '{}'))
        .consent_accepted,
    ).toBe(true);
  });

  it('starts a 150-minute timer on the server, idempotently', async () => {
    const first = stateOf(await rpc('candidate_start', token, '{"screen":{"width":1920}}'));
    expect(first.status).toBe('in_progress');
    expect((first.deadline_ms as number) - (first.started_at_ms as number)).toBe(150 * 60 * 1000);
    expect(Math.abs(first.server_now_ms - Date.now())).toBeLessThan(5000);
    const again = stateOf(await rpc('candidate_start', token, '{}'));
    expect(again.deadline_ms).toBe(first.deadline_ms);
  });

  it('returns the frozen questions with starter files, but never the rubric or solution', async () => {
    const ws = await rpc('candidate_get_workspace', token);
    expect(ws.ok).toBe(true);
    const questions = ws.questions as { title: string; files: { path: string; readonly: boolean }[] }[];
    expect(questions.map((q) => q.title)).toHaveLength(4);
    expect(questions[0]?.files.map((f) => f.path)).toContain('src/hooks/useProducts.ts');
    expect((ws.files as unknown[]).length).toBeGreaterThan(10);
    expect(ws.backup_key_b64).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    const text = JSON.stringify(ws);
    for (const forbidden of ['rubric', 'max_points', 'race_condition', 'notes_md', 'Reference solution']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('autosave and proctoring events', () => {
  let token = '';
  beforeAll(async () => {
    token = (await startedSession('Meera', 'meera@example.com')).token;
  });

  const file = (path: string, content: string, seq: number) => ({
    question_id: Q_RN,
    path,
    content,
    client_seq: seq,
  });
  const content = async (path: string) =>
    (
      await db.query<{ content: string }>(
        `select w.content from public.workspace_files w join public.sessions s on s.id = w.session_id
         join public.candidates c on c.id = s.candidate_id where c.email = 'meera@example.com' and w.path = $1`,
        [path],
      )
    ).rows[0]?.content;

  it('applies newer edits and ignores stale, read-only, unknown or malformed ones', async () => {
    const res = await rpc('candidate_sync', token, {
      files: [
        file('src/hooks/useProducts.ts', 'v5', 5),
        file('src/api/catalogue.ts', 'tampered', 6), // read-only
        file('src/new-file.ts', 'x', 7), // not a starter path
        { question_id: Q_RN, path: 'App.tsx', client_seq: 8 }, // no content
        { question_id: 'not-a-uuid', path: 'App.tsx', content: 'x', client_seq: 9 },
      ],
    });
    expect(res.ok).toBe(true);
    expect((res.accepted as { files: number }).files).toBe(1);
    await rpc('candidate_sync', token, { files: [file('src/hooks/useProducts.ts', 'stale v3', 3)] });
    expect(await content('src/hooks/useProducts.ts')).toBe('v5');
    expect(await content('src/api/catalogue.ts')).toContain('Read-only');
  });

  it('saves notes and statuses with the same ordering rule', async () => {
    await rpc('candidate_sync', token, {
      responses: [
        { question_id: Q_RN, status: 'marked_for_review', notes: 'Root cause: deps', client_seq: 10 },
      ],
    });
    await rpc('candidate_sync', token, {
      responses: [{ question_id: Q_RN, status: 'in_progress', notes: 'old', client_seq: 4 }],
    });
    const { rows } = await db.query<{ status: string; notes: string }>(
      `select qr.status, qr.notes from public.question_responses qr join public.sessions s on s.id = qr.session_id
       join public.candidates c on c.id = s.candidate_id where c.email = 'meera@example.com' and qr.question_id = $1`,
      [Q_RN],
    );
    expect(rows[0]).toEqual({ status: 'marked_for_review', notes: 'Root cause: deps' });
  });

  it('counts violations per the frozen policy, de-duplicates retries, ignores unknown types', async () => {
    const res = await rpc('candidate_sync', token, {
      events: [
        { client_event_id: 'e1', type: 'tab_switch', duration_ms: 4200, details: { away: true } },
        { client_event_id: 'e1', type: 'tab_switch' }, // retry of the same event
        { client_event_id: 'e2', type: 'paste_attempt', details: { source: 'editor' } },
        { client_event_id: 'e3', type: 'definitely_not_a_type' },
      ],
    });
    expect((res.accepted as { events: number }).events).toBe(2);
    expect(stateOf(res).violation_count).toBe(1);
    const { rows } = await db.query<{ type: string; severity: string; counted: boolean }>(
      `select e.type, e.severity, e.counted from public.proctor_events e join public.sessions s on s.id = e.session_id
       join public.candidates c on c.id = s.candidate_id where c.email = 'meera@example.com' order by e.id`,
    );
    expect(rows).toEqual([
      { type: 'tab_switch', severity: 'violation', counted: true },
      { type: 'paste_attempt', severity: 'flag', counted: false },
    ]);
  });

  it('stores keystroke-replay chunks once per sequence number', async () => {
    const chunk = {
      seq: 0,
      client_start_ms: 0,
      client_end_ms: 9000,
      event_count: 12,
      payload_b64: 'H4sIAAAAAAAAA6uuBQBDv6ajAgAAAA==',
    };
    expect(
      ((await rpc('candidate_sync', token, { editor_chunks: [chunk] })).accepted as { editor_chunks: number })
        .editor_chunks,
    ).toBe(1);
    expect(
      ((await rpc('candidate_sync', token, { editor_chunks: [chunk] })).accepted as { editor_chunks: number })
        .editor_chunks,
    ).toBe(0);
    expect((await rpc('candidate_get_workspace', token)).next_chunk_seq).toBe(1);
  });

  it('a second sign-in locks the old token and is logged as a violation', async () => {
    const { code, token: t1 } = await startedSession('Meera Two', 'meera2@example.com');
    const t2 = (await rpc('candidate_login', 'meera2@example.com', code, '{}')).token as string;
    expect(t2).not.toBe(t1);
    expect((await rpc('candidate_sync', t1, {})).error).toBe('SESSION_SUPERSEDED');
    const now = await rpc('candidate_sync', t2, {});
    expect(now.ok).toBe(true);
    expect(stateOf(now).violation_count).toBe(1);
    const { rows } = await db.query<{ type: string }>(
      'select type from public.proctor_events where session_id = $1',
      [stateOf(now).session_id],
    );
    expect(rows.map((r) => r.type)).toEqual(['session_takeover']);
  });
});

describe('violation limit, time-up, submission and capacity', () => {
  it('auto-submits on the 5th counted violation', async () => {
    const { token } = await startedSession('Vik', 'vik@example.com');
    const events = [
      'tab_switch',
      'window_blur',
      'fullscreen_exit',
      'multiple_faces',
      'no_face',
      'camera_off',
    ].map((type, i) => ({ client_event_id: `v${i}`, type }));
    const res = await rpc('candidate_sync', token, { events });
    const s = stateOf(res);
    expect(s.status).toBe('submitted');
    expect(s.submit_reason).toBe('violation_limit');
    expect(s.violation_count).toBe(5); // processing stops at the limit
    expect((await rpc('candidate_sync', token, {})).error).toBe('SUBMITTED');
  });

  it('accepts saves within the grace period but rejects them after it, stamping the exact deadline', async () => {
    const { token, started } = await startedSession('Tara', 'tara@example.com');
    const id = stateOf(started).session_id;
    await db.query(
      `update public.sessions set started_at = now() - interval '3 hours', deadline = now() - interval '5 seconds' where id = $1`,
      [id],
    );
    expect(
      (
        await rpc('candidate_sync', token, {
          files: [{ question_id: Q_RN, path: 'App.tsx', content: 'in grace', client_seq: 1 }],
        })
      ).ok,
    ).toBe(true);

    await db.query(
      `update public.sessions set started_at = now() - interval '3 hours', deadline = now() - interval '20 seconds' where id = $1`,
      [id],
    );
    const late = await rpc('candidate_sync', token, {
      files: [{ question_id: Q_RN, path: 'App.tsx', content: 'too late', client_seq: 2 }],
    });
    expect(late.error).toBe('SUBMITTED');
    const s = stateOf(late);
    expect(s.submit_reason).toBe('time_up');
    expect(s.submitted_at_ms).toBe(s.deadline_ms);
    const { rows } = await db.query<{ content: string }>(
      `select content from public.workspace_files where session_id = $1 and path = 'App.tsx'`,
      [id],
    );
    expect(rows[0]?.content).toBe('in grace');
  });

  it('finalizes overdue sessions from the scheduled job even if the browser is gone', async () => {
    const { started } = await startedSession('Gone', 'gone@example.com');
    const id = stateOf(started).session_id;
    await db.query(
      `update public.sessions set started_at = now() - interval '3 hours', deadline = now() - interval '1 minute' where id = $1`,
      [id],
    );
    const { rows } = await db.query<{ n: number }>(`select private.finalize_overdue_sessions() as n`);
    expect(rows[0]?.n).toBe(1);
    const s = await db.query<{ status: string; reason: string; ok: boolean }>(
      `select status, submit_reason as reason, submitted_at = deadline as ok from public.sessions where id = $1`,
      [id],
    );
    expect(s.rows[0]).toEqual({ status: 'submitted', reason: 'time_up', ok: true });
  });

  it('submits idempotently, consumes the code, and lets the next candidate start', async () => {
    // Finish every test session still running, then enforce the production default of one at a time.
    await db.query(
      "update public.sessions set started_at = now() - interval '4 hours', deadline = now() - interval '1 hour' where status = 'in_progress'",
    );
    await db.query('select private.finalize_overdue_sessions()');
    await db.query('update public.app_settings set max_concurrent_sessions = 1');
    const { token, code } = await startedSession('Sam', 'sam@example.com');
    const next = await invite('Neha', 'neha@example.com');
    const nToken = (await rpc('candidate_login', 'neha@example.com', next.code, '{}')).token as string;
    await rpc('candidate_accept_consent', nToken, '2026-10-09.1', CONSENT_SHA, '{}');
    expect((await rpc('candidate_start', nToken, '{}')).error).toBe('CAPACITY');

    const first = await rpc('candidate_submit', token, {
      files: [{ question_id: Q_RN, path: 'App.tsx', content: 'final', client_seq: 99 }],
    });
    expect(stateOf(first)).toMatchObject({ status: 'submitted', submit_reason: 'candidate' });
    const again = await rpc('candidate_submit', token, {});
    expect(again.ok).toBe(true);
    expect(stateOf(again).submitted_at_ms).toBe(stateOf(first).submitted_at_ms);
    expect((await rpc('candidate_login', 'sam@example.com', code, '{}')).error).toBe('ALREADY_SUBMITTED');

    expect((await rpc('candidate_start', nToken, '{}')).ok).toBe(true);
    await rpc('candidate_submit', nToken, {});
    await db.query('update public.app_settings set max_concurrent_sessions = 50');
  });

  it('lets an in-progress candidate resume after the invitation window closes', async () => {
    const { code, started } = await startedSession('Resume', 'resume@example.com');
    await db.query(
      `update public.invitations set valid_until = now() - interval '1 minute', valid_from = now() - interval '2 hours'
       where id = (select invitation_id from public.sessions where id = $1)`,
      [stateOf(started).session_id],
    );
    const res = await rpc('candidate_login', 'resume@example.com', code, '{}');
    expect(res.ok).toBe(true);
    expect(stateOf(res).status).toBe('in_progress');
  });
});

describe('time-up submission reason', () => {
  it('records the client auto-submit at 00:00 as time_up, but only near the real deadline', async () => {
    const early = await startedSession('Early Bird', 'early.bird@example.com');
    const claimed = await rpc('candidate_submit', early.token, { reason: 'time_up' });
    expect(stateOf(claimed).submit_reason).toBe('candidate'); // 150 minutes still left: not believed

    const onTime = await startedSession('On Time', 'on.time@example.com');
    await db.query(
      `update public.sessions set started_at = now() - interval '3 hours', deadline = now() + interval '2 seconds'
       where id = $1`,
      [stateOf(onTime.started).session_id],
    );
    const res = await rpc('candidate_submit', onTime.token, { reason: 'time_up' });
    expect(stateOf(res).submit_reason).toBe('time_up');
    expect(stateOf(res).submitted_at_ms).toBe(stateOf(res).deadline_ms);
  });
});
