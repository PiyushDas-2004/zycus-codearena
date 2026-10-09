/**
 * Builds supabase/seed/seed.sql from the human-friendly sources in supabase/seed/questions/<slug>/
 * and supabase/seed/templates/*.json. String values of the form "@file:<relative path>" are
 * replaced by that file's contents. Everything is validated with the same zod schemas the admin
 * import uses (src/shared/questionFormat.ts).
 *
 *   node scripts/build-seed.ts           # write seed.sql
 *   node scripts/build-seed.ts --check   # exit 1 if seed.sql is out of date (CI)
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import {
  QuestionSchema,
  TemplateSchema,
  type Question,
  type Template,
} from '../src/shared/questionFormat.ts';

const ROOT = join(import.meta.dirname, '..');
const SEED_DIR = join(ROOT, 'supabase', 'seed');
const OUT_FILE = join(SEED_DIR, 'seed.sql');

function resolveFileRefs(value: unknown, baseDir: string): unknown {
  if (typeof value === 'string' && value.startsWith('@file:')) {
    const target = join(baseDir, value.slice('@file:'.length));
    if (!target.startsWith(baseDir)) throw new Error(`@file reference escapes its folder: ${value}`);
    if (!existsSync(target))
      throw new Error(`Missing file for ${value} (looked in ${relative(ROOT, target)})`);
    return readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
  }
  if (Array.isArray(value)) return value.map((v) => resolveFileRefs(v, baseDir));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveFileRefs(v, baseDir)]));
  }
  return value;
}

function loadJson(path: string): unknown {
  return resolveFileRefs(JSON.parse(readFileSync(path, 'utf8')), dirname(path));
}

function fail(what: string, err: unknown): never {
  const detail =
    err && typeof err === 'object' && 'issues' in err
      ? (err as { issues: { path: PropertyKey[]; message: string }[] }).issues
          .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
          .join('\n')
      : String(err);
  console.error(`✖ ${what}\n${detail}`);
  process.exit(1);
}

// ── SQL literal helpers ────────────────────────────────────────────────────
function str(s: string): string {
  if (s.includes('\0')) throw new Error('NUL bytes are not allowed in seed text');
  return `'${s.replaceAll("'", "''")}'`;
}
const textArray = (a: string[]) => (a.length ? `array[${a.map(str).join(', ')}]::text[]` : `'{}'::text[]`);
const jsonb = (v: unknown) => `${str(JSON.stringify(v))}::jsonb`;
const bool = (b: boolean) => (b ? 'true' : 'false');
const int = (n: number) => {
  if (!Number.isInteger(n)) throw new Error(`Expected an integer, got ${n}`);
  return String(n);
};

// ── Load ────────────────────────────────────────────────────────────────────
const questionDirs = readdirSync(join(SEED_DIR, 'questions'))
  .map((d) => join(SEED_DIR, 'questions', d))
  .filter((d) => statSync(d).isDirectory())
  .sort();

const questions: Question[] = questionDirs.map((dir) => {
  const parsed = QuestionSchema.safeParse(loadJson(join(dir, 'question.json')));
  if (!parsed.success) fail(`Invalid question in ${relative(ROOT, dir)}`, parsed.error);
  if (!parsed.data.id) fail(`Seed question ${parsed.data.slug} needs a fixed "id"`, 'add a UUID');
  return parsed.data;
});

const templates: Template[] = readdirSync(join(SEED_DIR, 'templates'))
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => {
    const parsed = TemplateSchema.safeParse(loadJson(join(SEED_DIR, 'templates', f)));
    if (!parsed.success) fail(`Invalid template ${f}`, parsed.error);
    if (!parsed.data.id) fail(`Seed template ${parsed.data.slug} needs a fixed "id"`, 'add a UUID');
    return parsed.data;
  });

const idBySlug = new Map(questions.map((q) => [q.slug, q.id as string]));
for (const t of templates) {
  for (const slug of t.question_slugs) {
    if (!idBySlug.has(slug)) fail(`Template ${t.slug} references unknown question`, slug);
  }
}

// ── Emit ────────────────────────────────────────────────────────────────────
const out: string[] = [
  '-- ════════════════════════════════════════════════════════════════════════════',
  '-- GENERATED FILE: do not edit. Built by `npm run seed:build` from',
  '-- supabase/seed/questions/* and supabase/seed/templates/*.',
  '-- Safe to re-run: rows that already exist are left untouched.',
  '-- ════════════════════════════════════════════════════════════════════════════',
  'begin;',
  '',
];

for (const q of questions) {
  const id = str(q.id as string);
  out.push(`-- Question: ${q.slug}`);
  out.push(
    'insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, ' +
      'time_suggestion_minutes, statement_md, is_sample, status) values (',
    `  ${id}, ${str(q.slug)}, ${str(q.title)}, ${str(q.category)}, ${textArray(q.role_tags)}, ` +
      `${textArray(q.skill_tags)}, ${str(q.difficulty)}, ${int(q.time_suggestion_minutes)},`,
    `  ${str(q.statement_md)},`,
    `  ${bool(q.is_sample)}, ${str(q.status)}`,
    ') on conflict (id) do nothing;',
  );
  out.push(
    'insert into public.question_files (question_id, path, language, content, readonly, sort_order) values',
    q.files
      .map(
        (f, i) =>
          `  (${id}, ${str(f.path)}, ${str(f.language)}, ${str(f.content)}, ${bool(f.readonly)}, ${int(i)})`,
      )
      .join(',\n'),
    'on conflict (question_id, path) do nothing;',
  );
  if (q.rubric.length) {
    out.push(
      'insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values',
      q.rubric
        .map(
          (r, i) =>
            `  (${id}, ${str(r.key)}, ${str(r.criterion)}, ${str(r.description)}, ${int(r.max_points)}, ${int(i)})`,
        )
        .join(',\n'),
      'on conflict (question_id, key) do nothing;',
    );
  }
  if (q.reference_solution) {
    out.push(
      'insert into public.question_solutions (question_id, notes_md, files) values (',
      `  ${id}, ${str(q.reference_solution.notes_md)}, ${jsonb(q.reference_solution.files)}`,
      ') on conflict (question_id) do nothing;',
    );
  }
  out.push('');
}

for (const t of templates) {
  const id = str(t.id as string);
  out.push(`-- Template: ${t.slug}`);
  out.push(
    'insert into public.test_templates (id, slug, name, target_role, description, duration_minutes, ' +
      'instructions_md, proctoring, violation_policy, is_active) values (',
    `  ${id}, ${str(t.slug)}, ${str(t.name)}, ${str(t.target_role)}, ${str(t.description)}, ${int(t.duration_minutes)},`,
    `  ${str(t.instructions_md)},`,
    `  ${jsonb(t.proctoring)},`,
    `  ${jsonb(t.violation_policy)}, ${bool(t.is_active)}`,
    ') on conflict (id) do nothing;',
    'insert into public.test_template_questions (template_id, question_id, position) values',
    t.question_slugs
      .map((slug, i) => `  (${id}, ${str(idBySlug.get(slug) as string)}, ${int(i + 1)})`)
      .join(',\n'),
    'on conflict (template_id, question_id) do nothing;',
    '',
  );
}

out.push('commit;', '');
const sql = out.join('\n');

if (process.argv.includes('--check')) {
  const current = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, 'utf8').replace(/\r\n/g, '\n') : '';
  if (current !== sql) {
    console.error('✖ supabase/seed/seed.sql is out of date. Run `npm run seed:build` and commit the result.');
    process.exit(1);
  }
  console.log(`✔ seed.sql is up to date (${questions.length} questions, ${templates.length} template(s)).`);
} else {
  writeFileSync(OUT_FILE, sql, 'utf8');
  console.log(
    `✔ Wrote ${relative(ROOT, OUT_FILE)} (${questions.length} questions, ${templates.length} template(s)).`,
  );
}
