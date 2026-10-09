/**
 * Webcam snapshots (candidate_upload_snapshot), their links to proctoring events, and retention.
 */
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asAnon, asUser, createTestDb } from './helpers/db';
import { seedFixtures, users } from './helpers/fixtures';

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  await db.query('update public.app_settings set max_concurrent_sessions = 50');
  await seedFixtures(db);
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
async function session(start = true) {
  n++;
  const email = `snap-${n}@example.com`;
  const { rows } = await db.query<{ access_code: string }>(
    `select access_code from private.create_test_invitation($1, $2)`,
    [`Snap ${n}`, email],
  );
  const token = (await rpc('candidate_login', email, rows[0]?.access_code, '{}')).token as string;
  await rpc('candidate_accept_consent', token, 'v1', 'a'.repeat(64), '{}');
  let sessionId = '';
  if (start)
    sessionId = ((await rpc('candidate_start', token, '{}')).state as { session_id: string }).session_id;
  return { token, sessionId };
}

const jpeg = (size = 2000) => {
  const b = Buffer.alloc(size, 7);
  b.set([0xff, 0xd8, 0xff, 0xe0]);
  return b.toString('base64');
};

const snap = (id: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    client_snapshot_id: id,
    reason: 'periodic',
    face_count: 1,
    width: 320,
    height: 240,
    jpeg_b64: jpeg(),
    ...extra,
  });

/** Moves a session's snapshots back in time so the 3-second spacing rule doesn't interfere. */
const age = (sessionId: string, seconds: number) =>
  db.query(
    `update public.snapshots set captured_at = captured_at - make_interval(secs => $2) where session_id = $1`,
    [sessionId, seconds],
  );

describe('candidate_upload_snapshot', () => {
  it('stores a JPEG for an in-progress session, separately from its metadata', async () => {
    const { token, sessionId } = await session();
    const res = await rpc('candidate_upload_snapshot', token, snap('snap-ok-0001'));
    expect(res).toMatchObject({ ok: true });
    const { rows } = await db.query<{ reason: string; bytes: number; face_count: number; blob: number }>(
      `select s.reason, s.bytes, s.face_count, octet_length(b.jpeg) as blob
       from public.snapshots s join public.snapshot_blobs b on b.snapshot_id = s.id where s.session_id = $1`,
      [sessionId],
    );
    expect(rows).toEqual([{ reason: 'periodic', bytes: 2000, face_count: 1, blob: 2000 }]);
  });

  it('is idempotent for retries of the same snapshot', async () => {
    const { token, sessionId } = await session();
    const first = await rpc('candidate_upload_snapshot', token, snap('snap-retry-01'));
    const again = await rpc('candidate_upload_snapshot', token, snap('snap-retry-01'));
    expect(again).toMatchObject({ ok: true, duplicate: true, snapshot_id: first.snapshot_id });
    const { rows } = await db.query('select 1 from public.snapshots where session_id = $1', [sessionId]);
    expect(rows).toHaveLength(1);
  });

  it('rejects anything that is not a small JPEG with a valid id and reason', async () => {
    const { token } = await session();
    const bad = [
      snap('short'),
      snap('snap-bad-reason', { reason: 'DROP TABLE' }),
      snap('snap-not-jpeg', { jpeg_b64: Buffer.alloc(2000, 1).toString('base64') }),
      snap('snap-too-big', { jpeg_b64: jpeg(270_000) }),
      snap('snap-not-b64', { jpeg_b64: 'not base64!' }),
      snap('snap-tiny-01', { jpeg_b64: jpeg(50) }),
      '[]',
    ];
    for (const payload of bad) {
      expect((await rpc('candidate_upload_snapshot', token, payload)).error, payload.slice(0, 60)).toBe(
        'INVALID_PAYLOAD',
      );
    }
  });

  it('spaces uploads at least 3 seconds apart and caps them per session', async () => {
    const { token, sessionId } = await session();
    expect((await rpc('candidate_upload_snapshot', token, snap('snap-rate-001'))).ok).toBe(true);
    expect(await rpc('candidate_upload_snapshot', token, snap('snap-rate-002'))).toMatchObject({
      ok: false,
      error: 'RATE_LIMITED',
      retry_after_seconds: 3,
    });
    await age(sessionId, 5);
    expect((await rpc('candidate_upload_snapshot', token, snap('snap-rate-002'))).ok).toBe(true);

    await db.query(
      `insert into public.snapshots (session_id, captured_at, reason, bytes, client_snapshot_id)
       select $1, now() - interval '1 hour', 'periodic', 1, 'filler-' || g from generate_series(1, 398) g`,
      [sessionId],
    );
    expect((await rpc('candidate_upload_snapshot', token, snap('snap-rate-401'))).error).toBe('RATE_LIMITED');
  });

  it('only accepts uploads while the test is running', async () => {
    const pending = await session(false);
    expect((await rpc('candidate_upload_snapshot', pending.token, snap('snap-pending'))).error).toBe(
      'NOT_STARTED',
    );
    const done = await session();
    await rpc('candidate_submit', done.token, '{}');
    expect((await rpc('candidate_upload_snapshot', done.token, snap('snap-after-submit'))).error).toBe(
      'SUBMITTED',
    );
    expect((await rpc('candidate_upload_snapshot', 'x'.repeat(43), snap('snap-no-token'))).error).toBe(
      'INVALID_SESSION',
    );
  });

  it('links snapshots and events whichever arrives first', async () => {
    const { token, sessionId } = await session();
    // Event first, snapshot later.
    await rpc(
      'candidate_sync',
      token,
      JSON.stringify({
        events: [
          { client_event_id: 'ev-1', type: 'tab_switch', details: { snapshot_client_id: 'snap-link-0001' } },
        ],
      }),
    );
    await rpc('candidate_upload_snapshot', token, snap('snap-link-0001', { reason: 'violation' }));
    // Snapshot first, event later.
    await age(sessionId, 5);
    await rpc('candidate_upload_snapshot', token, snap('snap-link-0002', { reason: 'violation' }));
    await rpc(
      'candidate_sync',
      token,
      JSON.stringify({
        events: [
          { client_event_id: 'ev-2', type: 'no_face', details: { snapshot_client_id: 'snap-link-0002' } },
        ],
      }),
    );
    const { rows } = await db.query<{ client_event_id: string; snap: string }>(
      `select e.client_event_id, s.client_snapshot_id as snap from public.proctor_events e
       join public.snapshots s on s.id = e.snapshot_id where e.session_id = $1 order by 1`,
      [sessionId],
    );
    expect(rows).toEqual([
      { client_event_id: 'ev-1', snap: 'snap-link-0001' },
      { client_event_id: 'ev-2', snap: 'snap-link-0002' },
    ]);
  });
});

describe('snapshot access and retention', () => {
  it('lets monitoring staff see snapshots, but not unassigned reviewers', async () => {
    const { token, sessionId } = await session();
    await rpc('candidate_upload_snapshot', token, snap('snap-staff-01'));
    const asRecruiter = await asUser(db, users.recruiter, () =>
      db.query(
        'select octet_length(b.jpeg) as n from public.snapshot_blobs b join public.snapshots s on s.id = b.snapshot_id where s.session_id = $1',
        [sessionId],
      ),
    );
    expect(asRecruiter.rows).toHaveLength(1);
    const asReviewer = await asUser(db, users.reviewerA, () =>
      db.query('select 1 from public.snapshots where session_id = $1', [sessionId]),
    );
    expect(asReviewer.rows).toHaveLength(0);
  });

  it('purges snapshots (and their images) older than the retention period', async () => {
    const { token, sessionId } = await session();
    await rpc('candidate_upload_snapshot', token, snap('snap-old-0001'));
    await age(sessionId, 91 * 86400);
    await rpc('candidate_upload_snapshot', token, snap('snap-new-0001'));
    const { rows } = await db.query<{ n: number }>('select private.purge_expired_snapshots() as n');
    expect(rows[0]?.n).toBeGreaterThanOrEqual(1);
    const left = await db.query<{ id: string }>(
      `select s.client_snapshot_id as id from public.snapshots s join public.snapshot_blobs b on b.snapshot_id = s.id
       where s.session_id = $1`,
      [sessionId],
    );
    expect(left.rows).toEqual([{ id: 'snap-new-0001' }]);
  });
});
