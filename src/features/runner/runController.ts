import type * as Monaco from 'monaco-editor';
import type { WorkspaceController } from '../workspace/WorkspaceController';
import { useWorkspaceUi } from '../workspace/workspaceStore';
import { isTestFile, type SandboxOutcome } from './buildScript';
import { runQuestionTests } from './runTests';
import { summarize, useTestRuns } from './testRunStore';

/** Questions with runnable tests (TypeScript/JavaScript `*.test.*` files). */
export const hasRunnableTests = (files: { path: string }[]) =>
  files.some((f) => isTestFile(f.path) && /\.[jt]sx?$/.test(f.path));

/**
 * Runs the current code of a question against its tests and records the result (for the panel,
 * and as a `tests_run` event so reviewers can see how the candidate worked).
 */
export async function runTestsForQuestion(
  controller: WorkspaceController,
  monaco: typeof Monaco,
  questionId: string,
): Promise<void> {
  if (useTestRuns.getState().runs[questionId]?.running) return;
  const q = useWorkspaceUi.getState().questions.find((x) => x.questionId === questionId);
  if (!q) return;
  const files = q.files.flatMap((f) => {
    const model = controller.modelFor(questionId, f.path);
    return model ? [{ path: f.path, model }] : [];
  });
  useTestRuns.getState().start(questionId);
  const started = performance.now();
  let outcome: SandboxOutcome;
  try {
    outcome = await runQuestionTests(monaco, files);
  } catch (err) {
    outcome = { type: 'crash', error: err instanceof Error ? err.message : String(err) };
  }
  const durationMs = Math.round(performance.now() - started);
  useTestRuns.getState().finish(questionId, outcome, durationMs);
  const summary = summarize(outcome);
  controller.report('tests_run', {
    question_id: questionId,
    outcome: outcome.type,
    passed: summary?.passed ?? 0,
    failed: summary?.failed ?? 0,
    total: summary?.total ?? 0,
    duration_ms: durationMs,
  });
}
