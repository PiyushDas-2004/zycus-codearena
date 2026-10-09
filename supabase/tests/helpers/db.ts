import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const root = join(import.meta.dirname, '..', '..');
const migrationsDir = join(root, 'migrations');

/** Migrations whose first line contains `pglite:skip` (e.g. pg_cron schedules) are not applied. */
export function migrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .filter((f) => !readFileSync(join(migrationsDir, f), 'utf8').split('\n', 1)[0]?.includes('pglite:skip'));
}

export interface CreateDbOptions {
  migrations?: boolean;
  seed?: boolean;
}

export async function createTestDb({
  migrations = true,
  seed = false,
}: CreateDbOptions = {}): Promise<PGlite> {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(readFileSync(join(import.meta.dirname, 'supabase-shim.sql'), 'utf8'));
  if (migrations) {
    for (const file of migrationFiles()) {
      try {
        await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
      } catch (err) {
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`, { cause: err });
      }
    }
  }
  if (seed) {
    await db.exec(readFileSync(join(root, 'seed', 'seed.sql'), 'utf8'));
  }
  return db;
}

export interface Claims {
  sub: string;
  email: string;
  role?: 'authenticated';
}

/**
 * Runs `fn` as a Supabase API role with the given JWT claims, exactly as PostgREST would:
 * `SET ROLE` + `request.jwt.claims`. Always restores the superuser afterwards.
 */
export async function asRole<T>(
  db: PGlite,
  role: 'anon' | 'authenticated' | 'service_role',
  claims: Claims | null,
  fn: () => Promise<T>,
): Promise<T> {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [
    claims ? JSON.stringify({ role, ...claims }) : '',
  ]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claims', '', false)`);
  }
}

export const asAnon = <T>(db: PGlite, fn: () => Promise<T>) => asRole(db, 'anon', null, fn);
export const asUser = <T>(db: PGlite, claims: Claims, fn: () => Promise<T>) =>
  asRole(db, 'authenticated', claims, fn);

/** Resolves to the Postgres error message, or throws if the query unexpectedly succeeds. */
export async function expectError(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (err) {
    return (err as Error).message;
  }
  throw new Error('Expected the query to fail, but it succeeded');
}
