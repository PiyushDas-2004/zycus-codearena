/**
 * Writes supabase/dist/codearena-database.sql: installs CodeArena on an empty Supabase project or
 * upgrades an existing one (only migrations not yet applied run), in ONE transaction, for pasting
 * into Supabase Dashboard → SQL Editor. If any statement fails, nothing is applied and the script
 * can simply be run again after fixing the cause.
 *
 *   npm run sql:bundle
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { buildDatabaseScript } from './lib/bundle.ts';

const ROOT = join(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'supabase', 'dist');
const OUT = join(OUT_DIR, 'codearena-database.sql');

mkdirSync(OUT_DIR, { recursive: true });
rmSync(join(OUT_DIR, 'codearena-setup.sql'), { force: true }); // replaced by codearena-database.sql
writeFileSync(OUT, buildDatabaseScript(), 'utf8');
console.log(`✔ Wrote ${relative(ROOT, OUT)}`);
