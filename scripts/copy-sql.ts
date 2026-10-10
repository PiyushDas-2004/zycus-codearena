/**
 * Puts the database scripts on the clipboard one at a time, for pasting into Supabase Dashboard →
 * SQL Editor. Paste, click Run, then press Enter here for the next one.
 *
 *   npm run sql:copy          all scripts, from the first
 *   npm run sql:copy -- 3     start again at script 3
 *   npm run sql:copy -- --list
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { buildDatabaseParts } from './lib/bundle.ts';

const parts = buildDatabaseParts();
const args = process.argv.slice(2);

if (args.includes('--list')) {
  parts.forEach((p, i) => console.log(`${i + 1}. ${p.file} (${Math.round(p.sql.length / 1024)} KB)`));
  process.exit(0);
}

/** Copies Unicode text (dashes, ₹) intact: via a UTF-8 file, not a pipe. */
function copy(text: string): boolean {
  const dir = mkdtempSync(join(tmpdir(), 'codearena-sql-'));
  const file = join(dir, 'script.sql');
  writeFileSync(file, text, 'utf8');
  try {
    const run =
      process.platform === 'win32'
        ? spawnSync('powershell.exe', [
            '-NoProfile',
            '-Command',
            `Get-Content -Raw -Encoding UTF8 -LiteralPath '${file.replace(/'/g, "''")}' | Set-Clipboard`,
          ])
        : process.platform === 'darwin'
          ? spawnSync('pbcopy', { input: text })
          : spawnSync('xclip', ['-selection', 'clipboard'], { input: text });
    return run.status === 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const start = Math.max(1, Number(args.find((a) => /^\d+$/.test(a)) ?? 1));
const rl = createInterface({ input: process.stdin, output: process.stdout });

console.log(`\n${parts.length} scripts to run in Supabase Dashboard → SQL Editor, in this order.\n`);
for (let i = start - 1; i < parts.length; i++) {
  const part = parts[i]!;
  if (!copy(part.sql)) {
    console.error(
      `✖ Couldn't use the clipboard. Open supabase/dist/codearena-database/${part.file} instead.`,
    );
    process.exit(1);
  }
  console.log(
    `━━ Script ${i + 1} of ${parts.length}: ${part.file} (${Math.round(part.sql.length / 1024)} KB) is on your clipboard.`,
  );
  console.log('   In the SQL Editor: click "+ New query", press Ctrl+V, then click "Run".');
  if (part.file.includes('template')) {
    console.log(
      '   If Supabase warns about "destructive operations", click "Run this query" (it only re-links the template\'s questions).',
    );
  }
  const answer = await rl.question(
    i + 1 < parts.length
      ? '   When it shows "Success", press Enter here for the next script (or type q to stop): '
      : '   When it shows "Success", press Enter here to finish: ',
  );
  if (answer.trim().toLowerCase() === 'q') {
    console.log(`\nStopped. To continue later: npm run sql:copy -- ${i + 2}`);
    rl.close();
    process.exit(0);
  }
}
rl.close();
console.log('\n✔ All database scripts are done.');
