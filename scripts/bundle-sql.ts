/**
 * Writes supabase/dist/codearena-database/*.sql: the scripts that install CodeArena on an empty
 * Supabase project or upgrade an existing one, for pasting into Dashboard → SQL Editor ONE BY ONE,
 * in file-name order (01-schema-1.sql first). Each script is one transaction and safe to run again.
 * They are separate because the SQL Editor fails on very large scripts ("Failed to fetch").
 *
 *   npm run sql:bundle
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { buildDatabaseParts } from './lib/bundle.ts';

const ROOT = join(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'supabase', 'dist', 'codearena-database');

// Earlier single-file versions, replaced by this folder.
for (const old of ['codearena-setup.sql', 'codearena-database.sql']) {
  rmSync(join(ROOT, 'supabase', 'dist', old), { force: true });
}
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
for (const part of buildDatabaseParts()) {
  writeFileSync(join(OUT_DIR, part.file), part.sql, 'utf8');
  console.log(`✔ ${relative(ROOT, join(OUT_DIR, part.file))} (${Math.round(part.sql.length / 1024)} KB)`);
}
console.log('Run them in this order in Dashboard → SQL Editor (one New query each).');
