/**
 * Interchange format for questions and test templates — used for the seed data, and for
 * import/export in the admin portal. Mirrors the database constraints in
 * supabase/migrations/*_tables.sql; keep the two in sync.
 *
 * Dependency-free apart from zod: shared by the browser app, Node scripts and tests.
 */
import { z } from 'zod';
import { ProctoringConfigSchema, ViolationPolicySchema } from './proctoringConfig.ts';

export const QUESTION_FORMAT = 'zycus-codearena/question@1';
export const TEMPLATE_FORMAT = 'zycus-codearena/template@1';

/** Editor languages. `properties` and `groovy` get custom tokenizers in the editor. */
export const LANGUAGES = [
  'typescript',
  'javascript',
  'json',
  'java',
  'kotlin',
  'xml',
  'yaml',
  'properties',
  'groovy',
  'markdown',
  'shell',
  'css',
  'html',
  'sql',
  'dockerfile',
  'plaintext',
] as const;
export type Language = (typeof LANGUAGES)[number];

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FILE_PATH = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;
const DOT_SEGMENT = /(^|\/)\.\.?(\/|$)/;

export const FilePathSchema = z
  .string()
  .max(300)
  .regex(FILE_PATH, 'Use letters, digits, . _ - and / only')
  .refine((p) => !DOT_SEGMENT.test(p), 'Path segments "." and ".." are not allowed');

export const QuestionFileSchema = z.object({
  path: FilePathSchema,
  language: z.enum(LANGUAGES),
  content: z.string().max(200_000),
  readonly: z.boolean().default(false),
});

export const RubricItemSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]{1,60}$/, 'Use lowercase letters, digits and _'),
  criterion: z.string().min(1).max(300),
  description: z.string().max(5000).default(''),
  max_points: z.number().int().min(1).max(100),
});

export const ReferenceSolutionSchema = z.object({
  notes_md: z.string().max(100_000).default(''),
  files: z
    .array(z.object({ path: FilePathSchema, content: z.string().max(200_000) }))
    .max(100)
    .default([]),
});

const uniqueBy =
  <T>(key: (t: T) => string, what: string) =>
  (items: T[], ctx: z.RefinementCtx) => {
    const seen = new Set<string>();
    for (const item of items) {
      const k = key(item);
      if (seen.has(k)) ctx.addIssue({ code: 'custom', message: `Duplicate ${what}: ${k}` });
      seen.add(k);
    }
  };

export const QuestionSchema = z.object({
  format: z.literal(QUESTION_FORMAT),
  id: z.uuid().optional(),
  slug: z.string().max(80).regex(SLUG),
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(80),
  role_tags: z.array(z.string().min(1).max(60)).max(20).default([]),
  skill_tags: z.array(z.string().min(1).max(60)).max(30).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  time_suggestion_minutes: z.number().int().min(1).max(480),
  statement_md: z.string().max(100_000),
  is_sample: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  files: z
    .array(QuestionFileSchema)
    .min(1)
    .max(100)
    .superRefine(uniqueBy((f) => f.path, 'file path')),
  rubric: z
    .array(RubricItemSchema)
    .max(50)
    .default([])
    .superRefine(uniqueBy((r) => r.key, 'rubric key')),
  /** Admin-only. Never sent to candidates; stored in a separate, RLS-restricted table. */
  reference_solution: ReferenceSolutionSchema.optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const TemplateSchema = z.object({
  format: z.literal(TEMPLATE_FORMAT),
  id: z.uuid().optional(),
  slug: z.string().max(80).regex(SLUG),
  name: z.string().min(1).max(200),
  target_role: z.string().max(200).default(''),
  description: z.string().max(5000).default(''),
  duration_minutes: z.number().int().min(5).max(480),
  instructions_md: z.string().max(50_000).default(''),
  proctoring: ProctoringConfigSchema,
  violation_policy: ViolationPolicySchema,
  question_slugs: z.array(z.string().regex(SLUG)).min(1).max(50),
  is_active: z.boolean().default(true),
});
export type Template = z.infer<typeof TemplateSchema>;

const EXTENSION_LANGUAGES: Record<string, Language> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  xml: 'xml',
  yml: 'yaml',
  yaml: 'yaml',
  properties: 'properties',
  gradle: 'groovy',
  groovy: 'groovy',
  md: 'markdown',
  sh: 'shell',
  css: 'css',
  html: 'html',
  sql: 'sql',
};

/** Best-guess editor language for a file path (used when adding files in the admin editor). */
export function languageForPath(path: string): Language {
  const name = path.split('/').pop() ?? '';
  if (/^Dockerfile/i.test(name)) return 'dockerfile';
  const ext = name.includes('.') ? (name.split('.').pop() ?? '').toLowerCase() : '';
  return EXTENSION_LANGUAGES[ext] ?? 'plaintext';
}
