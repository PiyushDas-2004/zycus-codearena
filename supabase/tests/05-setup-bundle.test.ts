/**
 * The single script admins paste into the Supabase SQL Editor must install CodeArena on an empty
 * project, upgrade an existing one (applying only what is missing), and be safe to run twice.
 * pg_cron migrations are excluded here: PGlite has no pg_cron.
 */
import type { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildDatabaseScript, LEGACY_BASELINE, listMigrations } from '../../scripts/lib/bundle.ts';
import { createTestDb } from './helpers/db';

const pgliteScript = () => buildDatabaseScript({ exclude: (m) => m.pgliteSkip });

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
    await db.exec(pgliteScript());
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
    await db.exec(pgliteScript());
    await db.exec(
      `update public.questions set title = 'Edited by an admin' where slug = 'rn-catalogue-debugging'`,
    );
    await db.exec(`delete from public.test_template_questions where position = 4`);
    await db.exec(pgliteScript());
    const { rows } = await db.query<{ title: string }>(
      `select title from public.questions where slug = 'rn-catalogue-debugging'`,
    );
    expect(rows[0]?.title).toBe('Edited by an admin');
    expect(await templateQuestionCounts(db)).toEqual([
      { name: 'Lead React Native Developer – Hands-On', n: 3 },
    ]);
  });

  it('upgrades a database installed by the Phase 2 script (no migration records) in place', async () => {
    // Phase 2 state: migrations up to the baseline applied directly, sample data loaded, no records.
    db = await createTestDb({ migrations: false });
    for (const m of listMigrations().filter((x) => x.version <= LEGACY_BASELINE && !x.pgliteSkip)) {
      await db.exec(m.sql);
    }
    await db.exec(readFileSync(join(import.meta.dirname, '..', 'seed', 'seed.sql'), 'utf8'));
    const before = await db.query<{ n: number }>('select count(*)::int as n from public.questions');
    await db.exec(pgliteScript());

    const versions = await recorded(db);
    for (const m of listMigrations()) {
      if (m.version <= LEGACY_BASELINE || !m.pgliteSkip) expect(versions).toContain(m.version);
    }
    const fn = await db.query(`select 1 from pg_proc where proname = 'candidate_upload_snapshot'`);
    expect(fn.rows).toHaveLength(1);
    const after = await db.query<{ n: number }>('select count(*)::int as n from public.questions');
    expect(after.rows[0]?.n).toBe(before.rows[0]?.n);
  });

  it('includes the scheduled jobs for real Supabase projects', () => {
    const script = buildDatabaseScript();
    expect(script).toContain("cron.schedule('codearena-finalize-overdue'");
    expect(script).toContain("cron.schedule('codearena-purge-snapshots'");
  });
});
