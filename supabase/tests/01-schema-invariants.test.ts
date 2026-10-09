/**
 * Structural security invariants. These fail loudly if a future migration forgets RLS, leaks a
 * grant to `anon`, or adds an unsafe SECURITY DEFINER function.
 */
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, expectError } from './helpers/db';

let db: PGlite;
beforeAll(async () => {
  db = await createTestDb();
});
afterAll(async () => db?.close());

/** Functions anon may call: the candidate API. Anything else callable by anon fails the suite. */
const ANON_CALLABLE = new Set<string>([
  'public.ping',
  'public.candidate_login',
  'public.candidate_get_state',
  'public.candidate_accept_consent',
  'public.candidate_start',
  'public.candidate_get_workspace',
  'public.candidate_sync',
  'public.candidate_submit',
  'public.candidate_upload_snapshot',
]);

describe('schema invariants', () => {
  it('applies every migration and creates exactly the expected tables', async () => {
    const { rows } = await db.query<{ t: string }>(
      `select schemaname || '.' || tablename as t from pg_tables where schemaname in ('public','private') order by 1`,
    );
    expect(rows.map((r) => r.t)).toEqual(
      [
        'private.app_secrets',
        'private.health_probes',
        'private.invitation_secrets',
        'private.login_attempts',
        'private.session_secrets',
        'public.app_settings',
        'public.audit_log',
        'public.backup_imports',
        'public.candidates',
        'public.editor_event_chunks',
        'public.invitations',
        'public.proctor_event_types',
        'public.proctor_events',
        'public.question_files',
        'public.question_responses',
        'public.question_rubric_items',
        'public.question_solutions',
        'public.questions',
        'public.review_scores',
        'public.reviews',
        'public.session_messages',
        'public.session_questions',
        'public.sessions',
        'public.snapshot_blobs',
        'public.snapshots',
        'public.staff_users',
        'public.test_template_questions',
        'public.test_templates',
        'public.workspace_files',
      ].sort(),
    );
  });

  it('has RLS enabled on every public and private table', async () => {
    const { rows } = await db.query<{ tbl: string }>(`
      select n.nspname || '.' || c.relname as tbl
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relkind = 'r' and n.nspname in ('public', 'private') and not c.relrowsecurity`);
    expect(rows.map((r) => r.tbl)).toEqual([]);
  });

  it('grants anon no privilege on any table', async () => {
    const { rows } = await db.query<{ tbl: string; priv: string }>(`
      select n.nspname || '.' || c.relname as tbl, p.priv
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p(priv)
      where c.relkind in ('r','v','m') and n.nspname in ('public','private')
        and has_table_privilege('anon', c.oid, p.priv)`);
    expect(rows).toEqual([]);
  });

  it('grants authenticated nothing on private tables', async () => {
    const { rows } = await db.query<{ tbl: string }>(`
      select c.relname as tbl from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relkind = 'r' and n.nspname = 'private'
        and (has_table_privilege('authenticated', c.oid, 'SELECT') or has_table_privilege('authenticated', c.oid, 'INSERT')
          or has_table_privilege('authenticated', c.oid, 'UPDATE') or has_table_privilege('authenticated', c.oid, 'DELETE'))`);
    expect(rows).toEqual([]);
  });

  it('lets anon execute only the allow-listed candidate functions', async () => {
    const { rows } = await db.query<{ fn: string }>(`
      select n.nspname || '.' || p.proname as fn
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('public','private') and has_function_privilege('anon', p.oid, 'EXECUTE')`);
    expect(rows.map((r) => r.fn).filter((f) => !ANON_CALLABLE.has(f))).toEqual([]);
  });

  it('keeps privileged internals away from authenticated', async () => {
    const sensitive = [
      'private.generate_access_code()',
      'private.generate_token()',
      'private.audit(text,text,text,jsonb)',
      'public.hook_before_user_created(jsonb)',
    ];
    for (const sig of sensitive) {
      const { rows } = await db.query<{ ok: boolean }>(
        `select has_function_privilege('authenticated', $1::regprocedure, 'EXECUTE') as ok`,
        [sig],
      );
      expect(rows[0]?.ok, sig).toBe(false);
    }
  });

  it('pins search_path on every SECURITY DEFINER function', async () => {
    const { rows } = await db.query<{ fn: string }>(`
      select n.nspname || '.' || p.proname as fn
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('public','private') and p.prosecdef
        and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')`);
    expect(rows).toEqual([]);
  });

  it('keeps the audit log append-only, even for the table owner', async () => {
    await db.query(`select private.audit('test', 'unit', '1', '{}')`);
    expect(await expectError(db.query(`update public.audit_log set action = 'x'`))).toMatch(/append-only/);
    expect(await expectError(db.query(`delete from public.audit_log`))).toMatch(/append-only/);
  });

  it('allows the retention job to purge audit rows with the explicit flag', async () => {
    await db.transaction(async (tx) => {
      await tx.query(`select set_config('codearena.audit_purge', 'on', true)`);
      await tx.query(`delete from public.audit_log where action = 'test'`);
    });
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from public.audit_log where action = 'test'`,
    );
    expect(rows[0]?.n).toBe(0);
  });

  it('normalizes access codes exactly like the browser', async () => {
    const { rows } = await db.query<{ a: string | null; b: string | null; c: string | null }>(`
      select private.normalize_access_code(' 7kq2-m9xd-4rta ') as a,
             private.normalize_access_code('O0IL-O0IL-O0IL') as b,
             private.normalize_access_code('7KQ2-M9XD-4RTU') as c`);
    expect(rows[0]).toEqual({ a: '7KQ2M9XD4RTA', b: '001100110011', c: null });
  });

  it('generates well-formed, unique access codes and tokens', async () => {
    const { rows } = await db.query<{ code: string; token: string }>(
      `select private.generate_access_code() as code, private.generate_token() as token from generate_series(1, 200)`,
    );
    const codes = new Set(rows.map((r) => r.code));
    expect(codes.size).toBe(200);
    for (const r of rows) {
      expect(r.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{12}$/);
      expect(r.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
  });
});
