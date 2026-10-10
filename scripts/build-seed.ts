/**
 * Builds the seed SQL from the human-friendly sources in supabase/seed/questions/<slug>/ and
 * supabase/seed/templates/*.json. String values of the form "@file:<relative path>" are replaced
 * by that file's contents. Everything is validated with the same zod schemas the admin import uses
 * (src/shared/questionFormat.ts).
 *
 * - supabase/seed/parts/*.sql: one file per question, then one per template. npm run sql:bundle
 *   copies them for the Supabase SQL Editor, which fails on very large scripts ("Failed to fetch").
 * - supabase/seed/seed.sql: all parts in order (fresh databases and tests).
 *
 *   node scripts/build-seed.ts           # write seed.sql and the parts
 *   node scripts/build-seed.ts --check   # exit 1 if any of them is out of date (CI)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { TemplateSchema, type Question, type Template } from '../src/shared/questionFormat.ts';
import { loadJson, loadQuestion, questionDirs, ROOT, SEED_DIR } from './lib/questionSource.ts';

const OUT_FILE = join(SEED_DIR, 'seed.sql');
const PARTS_DIR = join(SEED_DIR, 'parts');

/**
 * Seeded templates whose questions changed since earlier releases. On an existing install, a
 * template that still has exactly `fromQuestionIds` (nobody customised it) is switched to its
 * current questions, which are added to the bank first; its description and instructions are
 * refreshed only if they are still the seeded text (`textsMd5`). Anything customised is left
 * alone. Sessions already started keep their frozen copy of the questions.
 */
const TEMPLATE_UPGRADES: {
  template: string;
  fromQuestionIds: string[];
  textsMd5: { description: string; instructions: string };
}[] = [
  {
    template: 'lead-react-native-hands-on',
    // rn-catalogue-debugging, spring-orders-debugging, placeholder-question-3, placeholder-question-4
    fromQuestionIds: [
      'f50a2b49-3263-4569-bd97-ff8835a45436',
      'c32fe8c1-9276-4190-9b2c-3c9b6509809f',
      '1ddcb8b2-aade-4a1f-a449-f31014cceaf7',
      'ad17df1c-902d-4b7f-9054-8f0bec4873e2',
    ],
    textsMd5: {
      description: 'd0c57dafdc7ae0249e066179e22fef56',
      instructions: '3f76c7339a14d8d1a620bd3eb539fb5c',
    },
  },
];

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
const bool = (b: boolean) => (b ? 'true' : 'false');
const int = (n: number) => {
  if (!Number.isInteger(n)) throw new Error(`Expected an integer, got ${n}`);
  return String(n);
};

// ── Load ────────────────────────────────────────────────────────────────────
const questions: Question[] = questionDirs().map((dir) => {
  let q: Question;
  try {
    q = loadQuestion(dir);
  } catch (err) {
    fail(`Invalid question in ${relative(ROOT, dir)}`, (err as Error).message);
  }
  if (!q.id) fail(`Seed question ${q.slug} needs a fixed "id"`, 'add a UUID');
  return q;
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

// ── SQL for one question / template (insert-only: existing rows are never touched) ────────────
/**
 * Long texts (statements, code) are written as base64 and decoded by Postgres: the Dashboard's SQL
 * Editor sends the script through a web API, and code inside SQL strings (quotes, `<tags onX=…>`)
 * is neither mangled nor mistaken for an attack on the way.
 */
const text = (s: string) =>
  s.length <= 160 && !/[<>'\\]/.test(s)
    ? str(s)
    : `convert_from(decode('${Buffer.from(s, 'utf8').toString('base64')}', 'base64'), 'UTF8')`;
const json = (v: unknown) => `(${text(JSON.stringify(v))})::jsonb`;

function questionSql(q: Question): string[] {
  const id = str(q.id as string);
  const out = [
    `-- Question: ${q.slug}`,
    'insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, ' +
      'time_suggestion_minutes, statement_md, is_sample, status) values (',
    `  ${id}, ${str(q.slug)}, ${str(q.title)}, ${str(q.category)}, ${textArray(q.role_tags)}, ` +
      `${textArray(q.skill_tags)}, ${str(q.difficulty)}, ${int(q.time_suggestion_minutes)},`,
    `  ${text(q.statement_md)},`,
    `  ${bool(q.is_sample)}, ${str(q.status)}`,
    ') on conflict (id) do nothing;',
    'insert into public.question_files (question_id, path, language, content, readonly, sort_order) values',
    q.files
      .map(
        (f, i) =>
          `  (${id}, ${str(f.path)}, ${str(f.language)}, ${text(f.content)}, ${bool(f.readonly)}, ${int(i)})`,
      )
      .join(',\n'),
    'on conflict (question_id, path) do nothing;',
  ];
  if (q.rubric.length) {
    out.push(
      'insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values',
      q.rubric
        .map(
          (r, i) =>
            `  (${id}, ${str(r.key)}, ${text(r.criterion)}, ${text(r.description)}, ${int(r.max_points)}, ${int(i)})`,
        )
        .join(',\n'),
      'on conflict (question_id, key) do nothing;',
    );
  }
  if (q.reference_solution) {
    out.push(
      'insert into public.question_solutions (question_id, notes_md, files) values (',
      `  ${id}, ${text(q.reference_solution.notes_md)}, ${json(q.reference_solution.files)}`,
      ') on conflict (question_id) do nothing;',
    );
  }
  out.push('');
  return out;
}

const BLOCK = '$template$';

/**
 * A template: created with its questions on a fresh install. On an existing install it is switched
 * to its current questions only if it still has exactly the questions of an earlier release
 * (TEMPLATE_UPGRADES), i.e. nobody customised it; its texts are refreshed only if unedited.
 * Anything customised is left alone. Sessions already started keep their frozen questions.
 */
function templateSql(t: Template): string[] {
  const id = str(t.id as string);
  const links = [
    `    insert into public.test_template_questions (template_id, question_id, position) values`,
    t.question_slugs
      .map((slug, i) => `      (${id}, ${str(idBySlug.get(slug) as string)}, ${int(i + 1)})`)
      .join(',\n'),
    '    on conflict (template_id, question_id) do nothing;',
  ];
  const upgrade = TEMPLATE_UPGRADES.find((u) => u.template === t.slug);
  return [
    `-- Template: ${t.slug}`,
    `do ${BLOCK}`,
    'declare',
    '  v_created uuid;',
    'begin',
    '  insert into public.test_templates (id, slug, name, target_role, description, duration_minutes,',
    '                                     instructions_md, proctoring, violation_policy, is_active) values (',
    `    ${id}, ${str(t.slug)}, ${text(t.name)}, ${text(t.target_role)}, ${text(t.description)}, ${int(t.duration_minutes)},`,
    `    ${text(t.instructions_md)}, ${json(t.proctoring)}, ${json(t.violation_policy)}, ${bool(t.is_active)}`,
    '  ) on conflict (id) do nothing',
    '  returning id into v_created;',
    '  if v_created is not null then',
    ...links,
    `    raise notice 'Template "${t.slug}": created';`,
    '    return;',
    '  end if;',
    ...(upgrade
      ? [
          "  if (select coalesce(array_agg(question_id::text order by question_id::text), '{}')",
          `        from public.test_template_questions where template_id = ${id})`,
          `     is distinct from array[${[...upgrade.fromQuestionIds].sort().map(str).join(', ')}]::text[] then`,
          `    raise notice 'Template "${t.slug}": already up to date or customised, left unchanged';`,
          '    return;',
          '  end if;',
          `  delete from public.test_template_questions where template_id = ${id};`,
          ...links.map((l) => l.slice(2)),
          `  update public.test_templates set description = ${text(t.description)}`,
          `   where id = ${id} and md5(description) = ${str(upgrade.textsMd5.description)};`,
          `  update public.test_templates set instructions_md = ${text(t.instructions_md)}`,
          `   where id = ${id} and md5(instructions_md) = ${str(upgrade.textsMd5.instructions)};`,
          `  raise notice 'Template "${t.slug}": now uses its ${t.question_slugs.length} current questions';`,
        ]
      : [`  raise notice 'Template "${t.slug}": already exists, left unchanged';`]),
    'end',
    `${BLOCK};`,
    '',
  ];
}

const HEADER = (what: string) => [
  '-- ════════════════════════════════════════════════════════════════════════════',
  '-- GENERATED FILE: do not edit. Built by `npm run seed:build` from',
  '-- supabase/seed/questions/* and supabase/seed/templates/*.',
  `-- ${what}`,
  '-- ════════════════════════════════════════════════════════════════════════════',
];

// ── Parts (one per question, then one per template) and seed.sql (all of them) ─────────────────
const part = (what: string, lines: string[]) =>
  [
    ...HEADER(`${what} Safe to re-run: rows that already exist are left untouched.`),
    'begin;',
    '',
    ...lines,
    'commit;',
    '',
  ].join('\n');
const parts: [string, string][] = [
  ...questions.map((q): [string, string] => [
    `question-${q.slug}.sql`,
    part(`Question "${q.title}".`, questionSql(q)),
  ]),
  ...templates.map((t): [string, string] => [
    `template-${t.slug}.sql`,
    part(`Template "${t.name}".`, templateSql(t)),
  ]),
];
for (const [name, sql] of parts) {
  if (sql.split(BLOCK).length - 1 !== (name.startsWith('template-') ? 2 : 0)) {
    fail('Seed text must not contain the reserved quote tag', `${BLOCK} in ${name}`);
  }
}
const seedSql = [
  ...HEADER(
    'All parts in order (fresh databases, tests). The SQL Editor gets them one by one: npm run sql:bundle.',
  ),
  ...parts.map(([, sql]) => sql),
].join('\n');

// ── Write / check ───────────────────────────────────────────────────────────
const outputs: [string, string][] = [
  [OUT_FILE, seedSql],
  ...parts.map(([name, sql]): [string, string] => [join(PARTS_DIR, name), sql]),
];
const summary = `${questions.length} questions, ${templates.length} template(s), ${TEMPLATE_UPGRADES.length} upgrade(s)`;
if (process.argv.includes('--check')) {
  const expected = new Set(parts.map(([name]) => name));
  const stale = existsSync(PARTS_DIR) ? readdirSync(PARTS_DIR).filter((f) => !expected.has(f)) : [];
  for (const [file, sql] of outputs) {
    const current = existsSync(file) ? readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '';
    if (current !== sql || stale.length) {
      console.error(
        `✖ ${relative(ROOT, stale.length ? PARTS_DIR : file)} is out of date. Run \`npm run seed:build\` and commit the result.`,
      );
      process.exit(1);
    }
  }
  console.log(`✔ Seed SQL is up to date (${summary}).`);
} else {
  rmSync(PARTS_DIR, { recursive: true, force: true });
  mkdirSync(PARTS_DIR, { recursive: true });
  rmSync(join(SEED_DIR, 'upgrade.sql'), { force: true }); // merged into the template parts
  for (const [file, sql] of outputs) writeFileSync(file, sql, 'utf8');
  console.log(
    `✔ Wrote ${relative(ROOT, OUT_FILE)} and ${parts.length} parts in ${relative(ROOT, PARTS_DIR)} (${summary}).`,
  );
}
