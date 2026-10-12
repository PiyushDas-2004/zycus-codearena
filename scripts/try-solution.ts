/**
 * Grades a candidate's answer to a question the way the site does: the starter files, with the
 * files in <folder> (same relative paths as the question's) laid over them, run through the test
 * sandbox. For exploring how the tests judge a given fix.
 *
 *   node scripts/try-solution.ts <question-slug> <folder> [--json]
 *
 * With SANDBOX_RUNTIME_FILE=<file> it uses that sandbox runtime (e.g. the one served by the live
 * site) instead of building one from the source.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { runSandboxTests, type SourceFile } from './lib/questionCheck.ts';
import { loadQuestion, QUESTIONS_DIR } from './lib/questionSource.ts';

const [slug, folder] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const json = process.argv.includes('--json');
if (!slug || !folder) {
  console.error('Usage: node scripts/try-solution.ts <question-slug> <folder> [--json]');
  process.exit(2);
}

const q = loadQuestion(join(QUESTIONS_DIR, slug));
const files = new Map(q.files.map((f) => [f.path, f.content]));
const readOnly = new Set(q.files.filter((f) => f.readonly).map((f) => f.path));

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const changed: string[] = [];
for (const p of walk(folder)) {
  const path = relative(folder, p).replace(/\\/g, '/');
  if (readOnly.has(path)) {
    console.error(`${path} is read-only for candidates; ignored.`);
    continue;
  }
  if (!files.has(path)) console.error(`${path} is a new file (candidates can't add files in the editor).`);
  files.set(path, readFileSync(p, 'utf8'));
  changed.push(path);
}

const sources: SourceFile[] = [...files].map(([path, content]) => ({ path, content }));
const outcome = await runSandboxTests(sources);

if (json) {
  console.log(JSON.stringify({ changed, outcome }, null, 2));
} else if (outcome.type !== 'done') {
  console.log(`Run did not complete: ${JSON.stringify(outcome).slice(0, 2000)}`);
} else {
  const passed = outcome.results.filter((r) => r.status === 'passed').length;
  console.log(`Changed: ${changed.join(', ') || '(nothing)'}`);
  console.log(`${passed}/${outcome.results.length} tests passed`);
  for (const r of outcome.results) {
    const mark = r.status === 'passed' ? 'PASS' : 'FAIL';
    const why = r.status === 'passed' ? '' : `  -- ${(r.error ?? '').split('\n')[0]?.slice(0, 200)}`;
    console.log(`${mark}  ${r.name}${why}`);
  }
}
