/**
 * The scripts admins paste into the Supabase SQL Editor (schema, then each question, then the
 * template) must install CodeArena on an empty project, upgrade an existing one (applying only what
 * is missing), and be safe to run twice. Each must stay small: the SQL Editor fails on big scripts.
 * pg_cron migrations are excluded here: PGlite has no pg_cron.
 */
import type { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildDatabaseParts,
  buildDatabaseScript,
  LEGACY_BASELINE,
  listMigrations,
} from '../../scripts/lib/bundle.ts';
import { createTestDb } from './helpers/db';

/** Runs the SQL Editor scripts one by one, in order, as an admin does. */
async function runScripts(d: PGlite) {
  for (const part of buildDatabaseParts({ exclude: (m) => m.pgliteSkip })) await d.exec(part.sql);
}

let db: PGlite | undefined;
afterEach(async () => {
  await db?.close();
  db = undefined;
});

async function templateQuestionCounts(d: PGlite) {
  const { rows } = await d.query<{ name: string; n: number }>(
    `select t.name, count(tq.*)::int as n from public.test_templates t
     join public.test_template_questions tq on tq.template_id = t.id group by t.name`,
  );
  return rows;
}

async function recorded(d: PGlite) {
  const { rows } = await d.query<{ version: string }>(
    'select version from supabase_migrations.schema_migrations order by version',
  );
  return rows.map((r) => r.version);
}

describe('SQL Editor database script', () => {
  it('installs on an empty project, records every migration and seeds the template', async () => {
    db = await createTestDb({ migrations: false });
    await runScripts(db);
    expect(await templateQuestionCounts(db)).toEqual([
      { name: 'Lead React Native Developer – Hands-On', n: 4 },
    ]);
    expect(await recorded(db)).toEqual(
      listMigrations()
        .filter((m) => !m.pgliteSkip)
        .map((m) => m.version),
    );
  });

  it('is safe to run again and never reloads sample data', async () => {
    db = await createTestDb({ migrations: false });
    await runScripts(db);
    await db.exec(
      `update public.questions set title = 'Edited by an admin' where slug = 'rn-approvals-inbox'`,
    );
    await db.exec(`delete from public.test_template_questions where position = 4`);
    await runScripts(db);
    const { rows } = await db.query<{ title: string }>(
      `select title from public.questions where slug = 'rn-approvals-inbox'`,
    );
    expect(rows[0]?.title).toBe('Edited by an admin');
    expect(await templateQuestionCounts(db)).toEqual([
      { name: 'Lead React Native Developer – Hands-On', n: 3 },
    ]);
  });

  it('switches the seeded template from the earlier sample questions to the current ones', async () => {
    const TEMPLATE = '704cf1f2-2916-4eb4-a7b6-cc9894509b41';
    const LEGACY = [
      'f50a2b49-3263-4569-bd97-ff8835a45436',
      'c32fe8c1-9276-4190-9b2c-3c9b6509809f',
      '1ddcb8b2-aade-4a1f-a449-f31014cceaf7',
      'ad17df1c-902d-4b7f-9054-8f0bec4873e2',
    ];
    db = await createTestDb({ migrations: false });
    await runScripts(db);
    // The earlier release: the same template with its four sample questions, and an admin who
    // rewrote the instructions (but not the description).
    await db.exec(`delete from public.test_template_questions; delete from public.questions`);
    for (const [i, id] of LEGACY.entries()) {
      await db.exec(
        `insert into public.questions (id, slug, title, category, difficulty, time_suggestion_minutes, statement_md)
         values ('${id}', 'legacy-${i + 1}', 'Legacy ${i + 1}', 'Sample', 'medium', 30, 'Old sample');
         insert into public.test_template_questions (template_id, question_id, position) values ('${TEMPLATE}', '${id}', ${i + 1});`,
      );
    }
    await db.exec(
      `update public.test_templates set instructions_md = 'Our own instructions',
         description = 'Four debugging tasks across a React Native app and a Spring Boot service. Questions 3 and 4 are placeholders until Zycus adds the final tasks.'
       where id = '${TEMPLATE}'`,
    );

    await runScripts(db);

    const slugs = await db.query<{ slug: string }>(
      `select q.slug from public.test_template_questions tq join public.questions q on q.id = tq.question_id
       where tq.template_id = '${TEMPLATE}' order by tq.position`,
    );
    expect(slugs.rows.map((r) => r.slug)).toEqual([
      'rn-approvals-inbox',
      'rn-live-auction',
      'spring-po-approvals',
      'web-invoice-builder',
    ]);
    const files = await db.query<{ n: number }>(
      `select count(*)::int as n from public.question_files where question_id = '04a206ea-655a-40fd-9651-b01088d59d98'`,
    );
    expect(files.rows[0]?.n).toBeGreaterThan(10);
    const t = await db.query<{ description: string; instructions_md: string }>(
      `select description, instructions_md from public.test_templates where id = '${TEMPLATE}'`,
    );
    expect(t.rows[0]?.description).toMatch(/^Four hard debugging tasks/);
    expect(t.rows[0]?.instructions_md).toBe('Our own instructions');
    // The old questions stay in the bank: finished sessions refer to them.
    const legacy = await db.query<{ n: number }>(
      `select count(*)::int as n from public.questions where slug like 'legacy-%'`,
    );
    expect(legacy.rows[0]?.n).toBe(4);

    // Running it again changes nothing.
    await db.exec(
      `delete from public.test_template_questions where template_id = '${TEMPLATE}' and position = 4`,
    );
    await runScripts(db);
    expect(await templateQuestionCounts(db)).toEqual([
      { name: 'Lead React Native Developer – Hands-On', n: 3 },
    ]);
  });

  it('updates a question installed at an older version, and leaves the same version alone', async () => {
    const Q = '9249d0ed-6c2c-4ea4-80f9-48645dbf737a'; // rn-approvals-inbox, seeded at version 2
    db = await createTestDb({ migrations: false });
    await runScripts(db);
    const files = async () =>
      (
        await db!.query<{ path: string; content: string }>(
          `select path, content from public.question_files where question_id = $1 order by path`,
          [Q],
        )
      ).rows;
    const current = await files();

    // As installed by the previous release: version 1, older content, a file since removed.
    await db.exec(`
      update public.questions set version = 1, title = 'Old title' where id = '${Q}';
      update public.question_files set content = 'old' where question_id = '${Q}' and path = 'src/types.ts';
      insert into public.question_files (question_id, path, language, content) values ('${Q}', 'src/gone.ts', 'typescript', '');
      update public.question_solutions set notes_md = 'old notes' where question_id = '${Q}';
      delete from public.question_rubric_items where question_id = '${Q}' and key = 'hydration';`);
    await runScripts(db);
    expect(await files()).toEqual(current);
    const q = await db.query<{ version: number; title: string; notes: string; rubric: number }>(
      `select q.version, q.title, s.notes_md as notes,
              (select count(*)::int from public.question_rubric_items r where r.question_id = q.id) as rubric
         from public.questions q join public.question_solutions s on s.question_id = q.id where q.id = $1`,
      [Q],
    );
    expect(q.rows[0]).toMatchObject({ version: 2, title: expect.not.stringMatching(/Old/), rubric: 6 });
    expect(q.rows[0]?.notes).not.toBe('old notes');

    // Same version: an edit made since stays.
    await db.exec(
      `update public.question_files set content = 'edited' where question_id = '${Q}' and path = 'src/types.ts'`,
    );
    await runScripts(db);
    expect((await files()).find((f) => f.path === 'src/types.ts')?.content).toBe('edited');
  });

  it('upgrades a database installed by the Phase 2 script (no migration records) in place', async () => {
    // Phase 2 state: migrations up to the baseline applied directly, sample data loaded, no records.
    db = await createTestDb({ migrations: false });
    for (const m of listMigrations().filter((x) => x.version <= LEGACY_BASELINE && !x.pgliteSkip)) {
      await db.exec(m.sql);
    }
    await db.exec(readFileSync(join(import.meta.dirname, '..', 'seed', 'seed.sql'), 'utf8'));
    const before = await db.query<{ n: number }>('select count(*)::int as n from public.questions');
    await runScripts(db);

    const versions = await recorded(db);
    for (const m of listMigrations()) {
      if (m.version <= LEGACY_BASELINE || !m.pgliteSkip) expect(versions).toContain(m.version);
    }
    const fn = await db.query(`select 1 from pg_proc where proname = 'candidate_upload_snapshot'`);
    expect(fn.rows).toHaveLength(1);
    const after = await db.query<{ n: number }>('select count(*)::int as n from public.questions');
    expect(after.rows[0]?.n).toBe(before.rows[0]?.n);
  });

  it('keeps every script small enough for the SQL Editor, in a fixed order', () => {
    const parts = buildDatabaseParts();
    expect(parts[0]?.file).toBe('01-schema-1.sql');
    expect(parts.filter((p) => /^\d\d-schema-\d+\.sql$/.test(p.file)).length).toBeGreaterThan(1);
    expect(parts.at(-1)?.file).toMatch(/^\d\d-template-/);
    expect(parts.map((p) => p.file)).toEqual([...parts.map((p) => p.file)].sort());
    for (const p of parts) expect(p.sql.length, p.file).toBeLessThan(160_000);
  });

  it('refuses to run a later schema script before the earlier one, and changes nothing', async () => {
    db = await createTestDb({ migrations: false });
    const parts = buildDatabaseParts({ exclude: (m) => m.pgliteSkip });
    const second = parts.find((p) => p.file.startsWith('02-schema-'));
    expect(second).toBeDefined();
    await expect(db.exec(second!.sql)).rejects.toThrow(/Run 01-schema-1\.sql first/);
    await db.exec('rollback'); // the editor's transaction ended with the error
    expect(await db.query(`select to_regclass('public.sessions') as t`)).toMatchObject({
      rows: [{ t: null }],
    });
  });

  it('includes the scheduled jobs for real Supabase projects', () => {
    const script = buildDatabaseScript();
    expect(script).toContain("cron.schedule('codearena-finalize-overdue'");
    expect(script).toContain("cron.schedule('codearena-purge-snapshots'");
  });
});
