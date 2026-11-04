/**
 * Coding assistant (0010): the browser reserves a question (budget, cooldown, size caps, worker
 * online), the worker on the admin's laptop claims it with its secret and answers, and the browser
 * reads the reply. Questions nobody answers in time are given up and refunded. History comes from
 * the server's log, never from the browser. The spending cap (0011) reserves each question's worst
 * case and charges the real cost.
 */
import type { PGlite } from '@electric-sql/pglite';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { asAnon, createTestDb, expectError } from './helpers/db';
import { Q_RN } from './helpers/fixtures';

let db: PGlite;
const SECRET = 'w'.repeat(48);

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  await db.query('update public.app_settings set max_concurrent_sessions = 50');
  const hash = createHash('sha256').update(SECRET).digest('hex');
  await db.query('select private.set_assistant_worker_secret($1)', [hash]);
});
afterAll(async () => db?.close());

type Json = Record<string, unknown> & { ok: boolean; error?: string };

async function rpc(fn: string, ...args: unknown[]): Promise<Json> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
  return asAnon(db, async () => {
    const { rows } = await db.query<{ r: Json }>(`select public.${fn}(${placeholders}) as r`, args);
    return rows[0]?.r as Json;
  });
}

let n = 0;
async function startedSession() {
  const email = `assist${++n}@example.com`;
  const { rows } = await db.query<{ access_code: string }>(
    `select * from private.create_test_invitation($1, $2, 'lead-react-native-hands-on', 24)`,
    [`Candidate ${n}`, email],
  );
  const login = await rpc('candidate_login', email, rows[0]?.access_code, '{}');
  const token = login.token as string;
  await rpc('candidate_accept_consent', token, '2026-10-10.1', 'a'.repeat(64), '{}');
  const started = await rpc('candidate_start', token, '{}');
  return { token, sessionId: (started.state as { session_id: string }).session_id };
}

const ask = (token: string, prompt = 'Why does my refresh run twice?', code = 'let isRefreshing = false;') =>
  rpc('candidate_ai_ask', token, Q_RN, prompt, 'src/api/httpClient.ts', code);
const next = (secret = SECRET) => rpc('assistant_worker_next', secret, 'test-worker');
const finish = (
  id: unknown,
  status = 'answered',
  reply = 'Look at what happens when two requests get 401.',
) => rpc('assistant_worker_finish', SECRET, id, status, reply, 'qwen-cursor', 1200, 300, 40);
const result = (token: string, id: unknown) => rpc('candidate_ai_result', token, id);
const endCooldown = (sessionId: string) =>
  db.query(`update public.sessions set ai_last_at = now() - interval '1 hour' where id = $1`, [sessionId]);
type Job = {
  request_id: number;
  prompt: string;
  code: string;
  question: { title: string };
  history: unknown[];
};

beforeEach(async () => {
  // A worker that asked for work just now (most tests).
  await db.query(`update private.assistant_worker set last_seen_at = now()`);
  // Questions left open by an earlier test would be claimed first.
  await db.query(
    `update public.ai_interactions set status = 'failed' where status in ('pending', 'processing')`,
  );
  await db.query(`update private.assistant_budget set spent_usd = 0, cap_usd = 5`);
});

const budget = async () =>
  (
    await db.query<{ spent: string; cap: string }>(
      `select spent_usd as spent, cap_usd as cap from private.assistant_budget`,
    )
  ).rows[0]!;
const costOf = async (id: unknown) =>
  Number(
    (await db.query<{ c: string }>(`select cost_usd as c from public.ai_interactions where id = $1`, [id]))
      .rows[0]?.c,
  );
/** 16,000 input + 300 output tokens at $0.53 / $2.12 per million. */
const WORST = (16000 * 0.53 + 300 * 2.12) / 1e6;

describe('coding assistant', () => {
  it('asks, lets the worker answer, and returns the reply with what is left', async () => {
    const { token } = await startedSession();
    const asked = await ask(token);
    expect(asked).toMatchObject({ ok: true, remaining: 9, cooldown_seconds: 20 });
    expect(await result(token, asked.request_id)).toEqual({ ok: true, status: 'pending' });

    const job = (await next()).job as Job;
    expect(job.request_id).toBe(asked.request_id);
    expect(job.prompt).toBe('Why does my refresh run twice?');
    expect(job.code).toBe('let isRefreshing = false;');
    expect(job.question.title).toMatch(/Approvals Inbox/);
    expect(job.history).toEqual([]);
    expect((await next()).job).toBeNull(); // claimed once only

    expect((await finish(job.request_id)).ok).toBe(true);
    expect(await result(token, asked.request_id)).toEqual({
      ok: true,
      status: 'answered',
      reply: 'Look at what happens when two requests get 401.',
      remaining: 9,
    });
    const state = await rpc('candidate_get_state', token);
    expect((state.state as { ai_used: number }).ai_used).toBe(1);
  });

  it('logs an event and feeds earlier answers back as history', async () => {
    const { token, sessionId } = await startedSession();
    const first = await ask(token, 'First question');
    await finish(((await next()).job as Job).request_id);
    const events = await db.query<{ counted: boolean }>(
      `select counted from public.proctor_events where session_id = $1 and type = 'ai_assist'`,
      [sessionId],
    );
    expect(events.rows).toEqual([{ counted: false }]);

    await endCooldown(sessionId);
    await ask(token, 'Second question');
    const job = (await next()).job as Job;
    expect(job.history).toEqual([
      { prompt: 'First question', reply: 'Look at what happens when two requests get 401.' },
    ]);
    // A finished question can't be answered again (or rewritten).
    expect((await finish(first.request_id, 'answered', 'changed')).error).toBe('INVALID_PAYLOAD');
  });

  it('says "unavailable" at once, without using a question, when no worker is running', async () => {
    const { token } = await startedSession();
    await db.query(`update private.assistant_worker set last_seen_at = now() - interval '1 minute'`);
    expect((await ask(token)).error).toBe('ASSISTANT_UNAVAILABLE');
    const state = await rpc('candidate_get_state', token);
    expect((state.state as { ai_used: number }).ai_used).toBe(0);
  });

  it('gives up on a question nobody answers in time, and refunds it', async () => {
    const { token } = await startedSession();
    const asked = await ask(token);
    await db.query(
      `update public.ai_interactions set created_at = now() - interval '1 minute' where id = $1`,
      [asked.request_id],
    );
    expect((await result(token, asked.request_id)).error).toBe('ASSISTANT_UNAVAILABLE');
    const again = await ask(token); // refunded, and no cooldown
    expect(again).toMatchObject({ ok: true, remaining: 9 });
  });

  it('refunds a question the worker could not answer', async () => {
    const { token } = await startedSession();
    await ask(token);
    const job = (await next()).job as Job;
    await finish(job.request_id, 'failed', '');
    expect((await result(token, job.request_id)).error).toBe('ASSISTANT_UNAVAILABLE');
    expect(await ask(token)).toMatchObject({ ok: true, remaining: 9 });
  });

  it('enforces the cooldown and the budget', async () => {
    const { token, sessionId } = await startedSession();
    expect((await ask(token)).ok).toBe(true);
    const again = await ask(token);
    expect(again.error).toBe('ASSISTANT_COOLDOWN');
    expect(again.retry_after_seconds).toBeGreaterThan(15);
    await db.query(`update public.sessions set ai_used = 10, ai_last_at = null where id = $1`, [sessionId]);
    expect((await ask(token)).error).toBe('ASSISTANT_LIMIT');
  });

  it('respects a template that switches the assistant off', async () => {
    const { token, sessionId } = await startedSession();
    await db.query(
      `update public.sessions set proctoring = jsonb_set(proctoring, '{aiAssistant,enabled}', 'false') where id = $1`,
      [sessionId],
    );
    expect((await ask(token)).error).toBe('ASSISTANT_DISABLED');
  });

  it('rejects oversized input, other questions, and other sessions', async () => {
    const { token } = await startedSession();
    expect((await ask(token, 'x'.repeat(501))).error).toBe('INVALID_PAYLOAD');
    expect((await ask(token, '   ')).error).toBe('INVALID_PAYLOAD');
    expect((await ask(token, 'ok', 'y'.repeat(4001))).error).toBe('INVALID_PAYLOAD');
    const other = await rpc('candidate_ai_ask', token, '11111111-2222-4333-8444-555555555555', 'hi', '', '');
    expect(other.error).toBe('INVALID_PAYLOAD');

    const mine = await ask(token);
    const someoneElse = await startedSession();
    expect((await result(someoneElse.token, mine.request_id)).error).toBe('INVALID_PAYLOAD');
  });

  it('refuses unknown tokens and submitted sessions', async () => {
    expect((await ask('x'.repeat(43))).error).toBe('INVALID_SESSION');
    const { token } = await startedSession();
    await rpc('candidate_submit', token, '{}');
    expect((await ask(token)).error).toBe('SUBMITTED');
  });

  it('only the worker with the secret can claim or answer questions', async () => {
    const { token } = await startedSession();
    const asked = await ask(token);
    expect((await next('z'.repeat(48))).error).toBe('FORBIDDEN');
    expect((await next('')).error).toBe('FORBIDDEN');
    expect(
      (await rpc('assistant_worker_finish', 'z'.repeat(48), asked.request_id, 'answered', 'x', 'm', 1, 1, 1))
        .error,
    ).toBe('FORBIDDEN');
    expect(await result(token, asked.request_id)).toEqual({ ok: true, status: 'pending' });
  });

  it('keeps the log and the worker table away from the browser', async () => {
    expect(await expectError(asAnon(db, () => db.query('select * from public.ai_interactions')))).toMatch(
      /permission denied/i,
    );
    expect(await expectError(asAnon(db, () => db.query('select * from private.assistant_worker')))).toMatch(
      /permission denied/i,
    );
    expect(
      await expectError(
        asAnon(db, () => db.query(`select private.set_assistant_worker_secret('${'0'.repeat(64)}')`)),
      ),
    ).toMatch(/permission denied/i);
  });

  it('gives the seeded template the assistant setting explicitly', async () => {
    const { rows } = await db.query<{ cfg: unknown }>(
      `select proctoring -> 'aiAssistant' as cfg from public.test_templates where slug = 'lead-react-native-hands-on'`,
    );
    expect(rows[0]?.cfg).toEqual({ enabled: true, maxRequests: 10, cooldownSec: 20 });
  });

  describe('spending cap', () => {
    it('charges each answer its real cost, and a failure the worker took its worst case', async () => {
      const { token, sessionId } = await startedSession();
      await ask(token);
      const answered = await finish(((await next()).job as Job).request_id); // 300 + 40 tokens
      const first = (300 * 0.53 + 40 * 2.12) / 1e6;
      expect(answered).toEqual({
        ok: true,
        budget: { spent_usd: 0.0002, cap_usd: 5, worst_case_usd: 0.0091 },
      });

      await endCooldown(sessionId);
      await ask(token);
      const failed = ((await next()).job as Job).request_id;
      await finish(failed, 'failed', '');
      expect(await costOf(failed)).toBeCloseTo(WORST, 6);
      expect(Number((await budget()).spent)).toBeCloseTo(first + WORST, 6);
    });

    it('charges nothing for a question that never reached the worker', async () => {
      const { token } = await startedSession();
      const asked = await ask(token);
      await db.query(
        `update public.ai_interactions set created_at = now() - interval '1 minute' where id = $1`,
        [asked.request_id],
      );
      await result(token, asked.request_id); // gives up on it
      expect(await costOf(asked.request_id)).toBe(0);
      expect(Number((await budget()).spent)).toBe(0);
    });

    it('charges the worst case when the gateway did not report tokens', async () => {
      const { token } = await startedSession();
      await ask(token);
      const id = ((await next()).job as Job).request_id;
      await rpc('assistant_worker_finish', SECRET, id, 'answered', 'A hint.', 'qwen-cursor', 900, 0, 0);
      expect(await costOf(id)).toBeCloseTo(WORST, 6);
    });

    it('refuses questions that could pass the cap, without using them up', async () => {
      const a = await startedSession();
      const b = await startedSession();
      // Room for one worst case, not two.
      await db.query(`update private.assistant_budget set spent_usd = 5 - $1::numeric`, [WORST * 1.5]);
      const first = await ask(a.token);
      expect(first.ok).toBe(true);
      // The open question holds its reservation, so a second one at the same time is refused.
      expect(await ask(b.token)).toEqual({ ok: false, error: 'ASSISTANT_DISABLED', reason: 'spending_cap' });
      const state = await rpc('candidate_get_state', b.token);
      expect((state.state as { ai_used: number }).ai_used).toBe(0);

      // Once it is answered (real cost far below the worst case), there is room again.
      await finish(((await next()).job as Job).request_id);
      expect((await ask(b.token)).ok).toBe(true);

      await db.query(`update private.assistant_budget set spent_usd = cap_usd`);
      await endCooldown(a.sessionId);
      expect((await ask(a.token)).reason).toBe('spending_cap');
    });

    it('reports what was spent and what is left', async () => {
      const { token } = await startedSession();
      await db.query(`update private.assistant_budget set spent_usd = 1.25`);
      await ask(token);
      const { rows } = await db.query<Record<string, string>>(`select * from private.assistant_spend()`);
      expect(Number(rows[0]?.cap_usd)).toBe(5);
      expect(Number(rows[0]?.spent_usd)).toBe(1.25);
      expect(Number(rows[0]?.reserved_usd)).toBeCloseTo(WORST, 4);
      expect(Number(rows[0]?.left_usd)).toBeCloseTo(5 - 1.25 - WORST, 4);
    });

    it('keeps the budget away from the browser', async () => {
      expect(await expectError(asAnon(db, () => db.query('select * from private.assistant_budget')))).toMatch(
        /permission denied/i,
      );
      expect(
        await expectError(asAnon(db, () => db.query('select * from private.assistant_spend()'))),
      ).toMatch(/permission denied/i);
    });
  });
});
