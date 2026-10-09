/** Supabase Auth integration: the domain-restricting sign-up hook, staff linking and lock-out guards. */
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asRole, asUser, createTestDb, expectError } from './helpers/db';

let db: PGlite;
beforeAll(async () => {
  db = await createTestDb();
});
afterAll(async () => db?.close());

async function hook(email: string) {
  const { rows } = await db.query<{ r: Record<string, unknown> }>(
    `select public.hook_before_user_created(jsonb_build_object('user', jsonb_build_object('email', $1::text))) as r`,
    [email],
  );
  return rows[0]?.r;
}

describe('before-user-created hook', () => {
  it.each(['first.last@zycus.com', 'First.Last@ZYCUS.COM', 'first.last@corpteam.zycus.com'])(
    'accepts %s',
    async (e) => {
      expect(await hook(e)).toEqual({});
    },
  );

  it.each(['someone@gmail.com', 'x@evilzycus.com', 'x@zycus.com.evil.com', 'x@zycus.co', 'no-at-sign', ''])(
    'rejects %s with HTTP 403',
    async (e) => {
      expect(await hook(e)).toMatchObject({ error: { http_code: 403 } });
    },
  );

  it('rejects subdomains when allow_email_subdomains is off', async () => {
    await db.query(`update public.app_settings set allow_email_subdomains = false`);
    expect(await hook('a@corpteam.zycus.com')).toMatchObject({ error: { http_code: 403 } });
    expect(await hook('a@zycus.com')).toEqual({});
    await db.query(`update public.app_settings set allow_email_subdomains = true`);
  });

  it('is executable by supabase_auth_admin but not by API roles', async () => {
    await asRole(db, 'service_role', null, async () => {
      expect(await expectError(hook('a@zycus.com'))).toMatch(/permission denied/i);
    });
    await db.exec(`set role supabase_auth_admin`);
    try {
      expect(await hook('a@zycus.com')).toEqual({});
    } finally {
      await db.exec('reset role');
    }
  });
});

describe('staff linking', () => {
  it('links an allow-listed email when the person first signs up', async () => {
    await db.query(
      `insert into public.staff_users (email, full_name, role) values ('first.admin@zycus.com', 'First', 'super_admin')`,
    );
    await db.query(
      `insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000a1', 'First.Admin@zycus.com')`,
    );
    const { rows } = await db.query<{ user_id: string }>(
      `select user_id from public.staff_users where email = 'first.admin@zycus.com'`,
    );
    expect(rows[0]?.user_id).toBe('00000000-0000-4000-8000-0000000000a1');
  });

  it('links when the allow-list row is added after the person signed in', async () => {
    await db.query(
      `insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000a2', 'late@zycus.com')`,
    );
    await db.query(`insert into public.staff_users (email, role) values ('late@zycus.com', 'recruiter')`);
    const { rows } = await db.query<{ user_id: string }>(
      `select user_id from public.staff_users where email = 'late@zycus.com'`,
    );
    expect(rows[0]?.user_id).toBe('00000000-0000-4000-8000-0000000000a2');
  });

  it('ignores a user_id supplied by a client and derives it from the email', async () => {
    await asUser(db, { sub: '00000000-0000-4000-8000-0000000000a1', email: 'first.admin@zycus.com' }, () =>
      db.query(
        `insert into public.staff_users (email, role, user_id) values ('nobody.yet@zycus.com', 'reviewer', '00000000-0000-4000-8000-0000000000a2')`,
      ),
    );
    const { rows } = await db.query<{ user_id: string | null }>(
      `select user_id from public.staff_users where email = 'nobody.yet@zycus.com'`,
    );
    expect(rows[0]?.user_id).toBeNull();
  });

  it('unlinks the staff row when the auth email changes', async () => {
    await db.query(
      `update auth.users set email = 'moved@zycus.com' where id = '00000000-0000-4000-8000-0000000000a2'`,
    );
    const { rows } = await db.query<{ user_id: string | null }>(
      `select user_id from public.staff_users where email = 'late@zycus.com'`,
    );
    expect(rows[0]?.user_id).toBeNull();
  });
});

describe('lock-out protection', () => {
  it('refuses to deactivate or demote the last active super admin', async () => {
    const admin = { sub: '00000000-0000-4000-8000-0000000000a1', email: 'first.admin@zycus.com' };
    expect(
      await expectError(
        asUser(db, admin, () =>
          db.query(`update public.staff_users set is_active = false where email = 'first.admin@zycus.com'`),
        ),
      ),
    ).toMatch(/At least one active Super Admin/);
    expect(
      await expectError(
        asUser(db, admin, () =>
          db.query(`update public.staff_users set role = 'reviewer' where email = 'first.admin@zycus.com'`),
        ),
      ),
    ).toMatch(/At least one active Super Admin/);
  });

  it('allows it once another super admin exists', async () => {
    const admin = { sub: '00000000-0000-4000-8000-0000000000a1', email: 'first.admin@zycus.com' };
    await asUser(db, admin, async () => {
      await db.query(`update public.staff_users set role = 'super_admin' where email = 'late@zycus.com'`);
      await db.query(`update public.staff_users set role = 'reviewer' where email = 'first.admin@zycus.com'`);
    });
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from public.staff_users where role = 'super_admin' and is_active`,
    );
    expect(rows[0]?.n).toBe(1);
  });
});
