import { create } from 'zustand';
import type { SandboxOutcome } from './buildScript';

export interface TestRun {
  running: boolean;
  outcome: SandboxOutcome | null;
  /** Wall-clock time of the last finished run (shown as "2 min ago" style hints). */
  finishedAt: number | null;
  durationMs: number | null;
}

interface TestRunStore {
  /** Per question. */
  runs: Record<string, TestRun>;
  /** Increments on every finished run: the results panel opens itself when it changes. */
  revealSignal: number;
  start(questionId: string): void;
  finish(questionId: string, outcome: SandboxOutcome, durationMs: number): void;
  reset(): void;
}

export const emptyRun: TestRun = { running: false, outcome: null, finishedAt: null, durationMs: null };

export const useTestRuns = create<TestRunStore>()((set) => ({
  runs: {},
  revealSignal: 0,
  start: (questionId) =>
    set((s) => ({
      runs: { ...s.runs, [questionId]: { ...(s.runs[questionId] ?? emptyRun), running: true } },
    })),
  finish: (questionId, outcome, durationMs) =>
    set((s) => ({
      runs: { ...s.runs, [questionId]: { running: false, outcome, finishedAt: Date.now(), durationMs } },
      revealSignal: s.revealSignal + 1,
    })),
  reset: () => set({ runs: {}, revealSignal: 0 }),
}));

export interface RunSummary {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
}

export function summarize(outcome: SandboxOutcome | null): RunSummary | null {
  if (outcome?.type !== 'done') return null;
  const count = (status: string) => outcome.results.filter((r) => r.status === status).length;
  const failed = count('failed') + (outcome.setupError ? 1 : 0);
  return { passed: count('passed'), failed, skipped: count('skipped'), total: outcome.results.length };
}
