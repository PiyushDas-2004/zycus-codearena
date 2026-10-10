/**
 * Row Level Security and privilege tests: who can read and write what, for every staff role and
 * for people who must get nothing (non-staff Zycus employees, wrong domain, inactive, spoofed email).
 */
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asUser, createTestDb, expectError, type Claims } from './helpers/db';
import { ids, Q_EXTRA, Q_RN, seedFixtures, users } from './helpers/fixtures';

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  await seedFixtures(db);
});
afterAll(async () => db?.close());

const count = (claims: Claims, sql: string, params: unknown[] = []) =>
  asUser(db, claims, async () => (await db.query(sql, params)).rows.length);

const TABLES_WITH_DATA = [
  'app_settings',
  'staff_users',
  'questions',
  'question_files',
  'question_rubric_items',
  'question_solutions',
  'test_templates',
  'test_template_questions',
  'candidates',
  'invitations',
  'sessions',
  'session_questions',
  'workspace_files',
  'question_responses',
  'editor_event_chunks',
  'snapshots',
  'snapshot_blobs',
  'proctor_events',
  'proctor_event_types',
  'audit_log',
];

describe('people who must see nothing', () => {
  for (const who of ['outsider', 'gmailStaff', 'inactive'] as const) {
    it(`${who}: every table returns zero rows (except their own staff row)`, async () => {
      for (const t of TABLES_WITH_DATA) {
        const n = await count(users[who], `select 1 from public.${t}`);
        const expected = t === 'staff_users' && who !== 'outsider' ? 1 : 0; // may read own allow-list row
        expect(n, `${who} → ${t}`).toBe(expected);
      }
    });
  }

  it('a JWT whose email does not match the allow-list row gets nothing', async () => {
    const spoofed: Claims = { sub: ids.superAdmin, email: 'attacker@zycus.com' };
    expect(await count(spoofed, 'select 1 from public.candidates')).toBe(0);
    expect(await count(spoofed, 'select 1 from public.question_solutions')).toBe(0);
  });

  it('a JWT with the right email but another user id gets nothing', async () => {
    const wrongSub: Claims = { sub: ids.outsider, email: users.superAdmin.email };
    expect(await count(wrongSub, 'select 1 from public.candidates')).toBe(0);
  });
});

describe('super admin', () => {
  const sa = users.superAdmin;
  it('sees the whole question bank including solutions and rubrics', async () => {
    expect(await count(sa, 'select 1 from public.questions')).toBe(5);
    expect(await count(sa, 'select 1 from public.question_solutions')).toBe(5);
    expect(await count(sa, 'select 1 from public.question_rubric_items')).toBeGreaterThan(0);
  });
  it('sees every candidate, session, code file and the audit log', async () => {
    expect(await count(sa, 'select 1 from public.candidates')).toBe(2);
    expect(await count(sa, 'select 1 from public.sessions')).toBe(2);
    expect(await count(sa, 'select 1 from public.workspace_files')).toBe(2);
    expect(await count(sa, 'select 1 from public.audit_log')).toBeGreaterThan(0);
  });
});

describe('recruiter (Zycus subdomain account)', () => {
  const rec = users.recruiter;
  it('is recognised as staff despite the corpteam.zycus.com subdomain', async () => {
    expect(await count(rec, 'select 1 from public.candidates')).toBe(2);
  });
  it('can monitor sessions, events and snapshots', async () => {
    expect(await count(rec, 'select 1 from public.sessions')).toBe(2);
    expect(await count(rec, 'select 1 from public.invitations')).toBe(2);
    expect(await count(rec, 'select 1 from public.proctor_events')).toBe(2);
    expect(await count(rec, 'select 1 from public.snapshot_blobs')).toBe(2);
  });
  it('cannot read reference solutions, rubrics, candidate code, notes, replay or the audit log', async () => {
    for (const t of [
      'question_solutions',
      'question_rubric_items',
      'workspace_files',
      'question_responses',
      'editor_event_chunks',
      'audit_log',
    ]) {
      expect(await count(rec, `select 1 from public.${t}`), t).toBe(0);
    }
  });
  it('can add candidates but cannot change questions', async () => {
    await asUser(db, rec, () =>
      db.query(
        `insert into public.candidates (full_name, email) values ('New Person', 'new.person@example.com')`,
      ),
    );
    const res = await asUser(db, rec, () => db.query(`update public.questions set title = 'hacked'`));
    expect(res.affectedRows).toBe(0);
    expect(
      await expectError(
        asUser(db, rec, () =>
          db.query(`insert into public.questions (slug, title, category) values ('x', 'x', 'x')`),
        ),
      ),
    ).toMatch(/row-level security/i);
  });
});

describe('reviewers see only their assigned candidates', () => {
  it('reviewer A sees candidate A only', async () => {
    const a = users.reviewerA;
    const rows = await asUser(
      db,
      a,
      async () => (await db.query<{ id: string }>('select id from public.candidates')).rows,
    );
    expect(rows.map((r) => r.id)).toEqual([ids.candA]);
    expect(await count(a, 'select 1 from public.sessions where id = $1', [ids.sessB])).toBe(0);
    expect(await count(a, 'select 1 from public.workspace_files where session_id = $1', [ids.sessB])).toBe(0);
    expect(await count(a, 'select 1 from public.snapshot_blobs where snapshot_id = $1', [ids.snapB])).toBe(0);
    expect(await count(a, 'select 1 from public.proctor_events where session_id = $1', [ids.sessB])).toBe(0);
    expect(await count(a, 'select 1 from public.workspace_files where session_id = $1', [ids.sessA])).toBe(1);
  });

  it('solutions are scoped to questions in assigned sessions', async () => {
    expect(
      await count(users.reviewerA, 'select 1 from public.question_solutions where question_id = $1', [
        Q_EXTRA,
      ]),
    ).toBe(0);
    expect(
      await count(users.reviewerB, 'select 1 from public.question_solutions where question_id = $1', [
        Q_EXTRA,
      ]),
    ).toBe(1);
    expect(
      await count(users.reviewerA, 'select 1 from public.question_solutions where question_id = $1', [Q_RN]),
    ).toBe(1);
  });

  it('reviewers cannot write candidates', async () => {
    expect(
      await expectError(
        asUser(db, users.reviewerA, () =>
          db.query(`insert into public.candidates (full_name, email) values ('X', 'x@example.com')`),
        ),
      ),
    ).toMatch(/row-level security/i);
  });
});

describe('nobody writes candidate data directly', () => {
  const directWrites = [
    `insert into public.sessions (invitation_id, candidate_id, template_id, duration_seconds) values ('${ids.invA}', '${ids.candA}', '704cf1f2-2916-4eb4-a7b6-cc9894509b41', 600)`,
    `update public.sessions set extension_seconds = 999`,
    `insert into public.workspace_files (session_id, question_id, path, content) values ('${ids.sessA}', '${Q_RN}', 'x.ts', '')`,
    `insert into public.proctor_events (session_id, type, severity) values ('${ids.sessA}', 'tab_switch', 'violation')`,
    `delete from public.proctor_events`,
    `insert into public.invitations (candidate_id, template_id, valid_from, valid_until, code_hint) values ('${ids.candA}', '704cf1f2-2916-4eb4-a7b6-cc9894509b41', now(), now() + interval '1 day', 'ZZZZ')`,
    `insert into public.audit_log (action, entity_type) values ('forged', 'x')`,
    `select * from private.session_secrets`,
    `select * from private.invitation_secrets`,
  ];
  for (const sql of directWrites) {
    it(`super admin is denied: ${sql.slice(0, 60)}…`, async () => {
      expect(await expectError(asUser(db, users.superAdmin, () => db.query(sql)))).toMatch(
        /permission denied/i,
      );
    });
  }
});

describe('reviews', () => {
  it('reviewer A can score their own session within the rubric limits, then submit', async () => {
    const a = users.reviewerA;
    const reviewId = await asUser(db, a, async () => {
      const { rows } = await db.query<{ id: string }>(
        `insert into public.reviews (session_id, reviewer_id) values ($1, (select private.staff_id())) returning id`,
        [ids.sessA],
      );
      return rows[0]?.id as string;
    });
    await asUser(db, a, () =>
      db.query(
        `insert into public.review_scores (review_id, question_id, rubric_key, score) values ($1, $2, 'single_flight_refresh', 4)`,
        [reviewId, Q_RN],
      ),
    );
    expect(
      await expectError(
        asUser(db, a, () =>
          db.query(
            `insert into public.review_scores (review_id, question_id, rubric_key, score) values ($1, $2, 'abort_per_request', 6)`,
            [reviewId, Q_RN],
          ),
        ),
      ),
    ).toMatch(/exceeds max_points/);
    expect(
      await expectError(
        asUser(db, a, () =>
          db.query(
            `insert into public.review_scores (review_id, question_id, rubric_key, score) values ($1, $2, 'made_up', 1)`,
            [reviewId, Q_RN],
          ),
        ),
      ),
    ).toMatch(/Unknown rubric item/);

    // Recruiters can't see a draft…
    expect(await count(users.recruiter, 'select 1 from public.reviews where id = $1', [reviewId])).toBe(0);
    await asUser(db, a, () =>
      db.query(`update public.reviews set status = 'submitted', recommendation = 'hire' where id = $1`, [
        reviewId,
      ]),
    );
    // …but can see it once submitted, and the reviewer can no longer change it.
    expect(await count(users.recruiter, 'select 1 from public.reviews where id = $1', [reviewId])).toBe(1);
    const res = await asUser(db, a, () =>
      db.query(`update public.reviews set recommendation = 'strong_hire' where id = $1`, [reviewId]),
    );
    expect(res.affectedRows).toBe(0);
  });

  it('reviewer A cannot review candidate B', async () => {
    expect(
      await expectError(
        asUser(db, users.reviewerA, () =>
          db.query(
            `insert into public.reviews (session_id, reviewer_id) values ($1, (select private.staff_id()))`,
            [ids.sessB],
          ),
        ),
      ),
    ).toMatch(/row-level security/i);
  });
});

describe('audit trail', () => {
  it('records who changed what, with large values summarised', async () => {
    await asUser(db, users.superAdmin, () =>
      db.query(
        `update public.questions set title = 'Renamed sample', statement_md = repeat('x', 5000) where id = $1`,
        [Q_RN],
      ),
    );
    const { rows } = await db.query<{
      actor_email: string;
      actor_role: string;
      details: { changed: Record<string, { new: unknown }> };
    }>(
      `select actor_email, actor_role, details from public.audit_log
       where entity_type = 'questions' and entity_id = $1 and action = 'update' order by id desc limit 1`,
      [Q_RN],
    );
    expect(rows[0]?.actor_email).toBe(users.superAdmin.email);
    expect(rows[0]?.actor_role).toBe('super_admin');
    expect(rows[0]?.details.changed.title?.new).toBe('Renamed sample');
    expect(rows[0]?.details.changed.statement_md?.new).toBe('[5000 chars]');
  });
});
