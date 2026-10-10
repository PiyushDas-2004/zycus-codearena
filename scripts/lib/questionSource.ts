/**
 * Reads the human-friendly question sources in supabase/seed/questions/<slug>/: question.json with
 * "@file:<relative path>" references replaced by that file's contents, validated with the same zod
 * schema the admin import uses. Shared by the seed builder and the question checks.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { QuestionSchema, type Question } from '../../src/shared/questionFormat.ts';

export const ROOT = join(import.meta.dirname, '..', '..');
export const SEED_DIR = join(ROOT, 'supabase', 'seed');
export const QUESTIONS_DIR = join(SEED_DIR, 'questions');

export function resolveFileRefs(value: unknown, baseDir: string): unknown {
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

export function loadJson(path: string): unknown {
  return resolveFileRefs(JSON.parse(readFileSync(path, 'utf8')), dirname(path));
}

export function questionDirs(): string[] {
  return readdirSync(QUESTIONS_DIR)
    .map((d) => join(QUESTIONS_DIR, d))
    .filter((d) => statSync(d).isDirectory())
    .sort();
}

/** Parses one question folder; throws with readable zod issues if it is invalid. */
export function loadQuestion(dir: string): Question {
  const parsed = QuestionSchema.safeParse(loadJson(join(dir, 'question.json')));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid question in ${relative(ROOT, dir)}\n${issues}`);
  }
  return parsed.data;
}
