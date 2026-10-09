/**
 * Smoke test for the test harness itself: proves that PGlite enforces RLS and privileges after
 * `SET ROLE`, so every other database test in this folder is meaningful.
 */
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asAnon, asUser, createTestDb, expectError } from './helpers/db';

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb({ migrations: false });
  await db.exec(`
    create table public.smoke (id int primary key, owner uuid);
    insert into public.smoke values (1, '00000000-0000-0000-0000-000000000001'), (2, '00000000-0000-0000-0000-000000000002');
    alter table public.smoke enable row level security;
    grant select on public.smoke to authenticated;
    create policy own_rows on public.smoke for select to authenticated using (owner = auth.uid());
  `);
});
afterAll(async () => db?.close());

describe('PGlite RLS harness', () => {
  it('superuser sees every row', async () => {
    const { rows } = await db.query('select id from public.smoke order by id');
    expect(rows).toHaveLength(2);
  });

  it('authenticated sees only rows allowed by the policy', async () => {
    const rows = await asUser(
      db,
      { sub: '00000000-0000-0000-0000-000000000001', email: 'a@zycus.com' },
      async () => (await db.query<{ id: number }>('select id from public.smoke')).rows,
    );
    expect(rows).toEqual([{ id: 1 }]);
  });

  it('anon is denied (privileges, not just RLS)', async () => {
    const msg = await expectError(asAnon(db, () => db.query('select * from public.smoke')));
    expect(msg).toMatch(/permission denied/i);
  });

  it('role is restored after the helper', async () => {
    const { rows } = await db.query<{ current_user: string }>('select current_user');
    expect(rows[0]?.current_user).toBe('postgres');
  });
});
