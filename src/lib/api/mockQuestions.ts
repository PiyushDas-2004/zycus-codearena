/**
 * The seeded assessment (supabase/seed) for the mock backend: the same questions candidates get, so
 * the editor, type checking and Run tests can be tried without a database. Reference solutions are
 * not included.
 *
 * ⚠ question.json also holds the rubric, which must never reach a production bundle. The files are
 * imported only in mock builds (compile-time condition below), they are read lazily, and
 * vite.config.ts fails any production build that contains rubric or reviewer-note text.
 */
import type { StarterFile, WorkspaceQuestion } from './types';

const raw: Record<string, string> =
  import.meta.env.VITE_USE_MOCK_BACKEND === 'true'
    ? import.meta.glob(
        [
          '/supabase/seed/templates/lead-react-native-hands-on.json',
          '/supabase/seed/templates/lead-react-native-hands-on.instructions.md',
          '/supabase/seed/questions/*/question.json',
          '/supabase/seed/questions/*/statement.md',
          '/supabase/seed/questions/*/files/**',
        ],
        { query: '?raw', import: 'default', eager: true },
      )
    : {};

interface SeedFile {
  path: string;
  language: StarterFile['language'];
  content: string;
  readonly?: boolean;
}
interface SeedQuestion {
  id: string;
  title: string;
  statement_md: string;
  files: SeedFile[];
}

const QUESTIONS_DIR = '/supabase/seed/questions';
const TEMPLATE = '/supabase/seed/templates/lead-react-native-hands-on';

function text(dir: string, value: string): string {
  if (!value.startsWith('@file:')) return value;
  const path = `${dir}/${value.slice('@file:'.length)}`;
  const content = raw[path];
  if (content === undefined) throw new Error(`Mock seed: missing ${path}`);
  return content;
}

export const seededInstructionsMd = (): string => raw[`${TEMPLATE}.instructions.md`] ?? '';

let cache: WorkspaceQuestion[] | null = null;

/** The template's questions in order (only the candidate-facing fields). */
export function seededQuestions(): WorkspaceQuestion[] {
  if (cache) return cache;
  const template = JSON.parse(raw[`${TEMPLATE}.json`] ?? '{}') as { question_slugs?: string[] };
  cache = (template.question_slugs ?? []).map((slug, i) => {
    const dir = `${QUESTIONS_DIR}/${slug}`;
    const q = JSON.parse(raw[`${dir}/question.json`] ?? 'null') as SeedQuestion | null;
    if (!q) throw new Error(`Mock seed: missing question ${slug}`);
    return {
      questionId: q.id,
      position: i + 1,
      title: q.title,
      statementMd: text(dir, q.statement_md),
      files: q.files.map((f) => ({
        path: f.path,
        language: f.language,
        readonly: f.readonly ?? false,
        content: text(dir, f.content),
      })),
    };
  });
  return cache;
}
