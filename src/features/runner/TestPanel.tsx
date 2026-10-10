import { clsx } from 'clsx';
import { CheckCircle2, ChevronUp, CircleSlash, Clock, Play, TriangleAlert, XCircle } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { memo, useEffect } from 'react';
import { Button } from '@/design/components';
import { useBottomPanel } from '../workspace/components/bottomPanel';
import type { WorkspaceController } from '../workspace/WorkspaceController';
import { useWorkspaceUi } from '../workspace/workspaceStore';
import type { SandboxOutcome, SandboxTestResult } from './buildScript';
import { runTestsForQuestion } from './runController';
import { loadRuntime } from './runTests';
import { emptyRun, summarize, useTestRuns, type TestRun } from './testRunStore';

interface TestPanelProps {
  controller: WorkspaceController;
  monaco: typeof Monaco;
  questionId: string;
}

/** "Tests" bar under the editor: Run tests, the summary, and the results when expanded. */
export function TestPanel({ controller, monaco, questionId }: TestPanelProps) {
  const { expanded, toggle: onToggle } = useBottomPanel();
  const run = useTestRuns((s) => s.runs[questionId] ?? emptyRun);
  const locked = useWorkspaceUi((s) => s.locked);

  // Fetch the test runtime while the browser is idle, so the first run starts at once.
  useEffect(() => {
    const id = window.requestIdleCallback?.(() => void loadRuntime().catch(() => undefined));
    return () => {
      if (id !== undefined) window.cancelIdleCallback?.(id);
    };
  }, []);

  return (
    <section aria-label="Tests" className="flex h-full flex-col bg-surface">
      <header className="flex h-[34px] shrink-0 items-center gap-2 border-b border-border bg-surface-app px-2 text-[13px]">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex items-center gap-1 rounded-sm px-1 py-0.5 font-medium text-strong hover:bg-surface-sunken"
        >
          <ChevronUp
            className={clsx('size-4 text-muted transition-transform', expanded && 'rotate-180')}
            aria-hidden="true"
          />
          Tests
        </button>
        <Button
          size="sm"
          variant="primary"
          leadingIcon={<Play className="size-3.5" />}
          loading={run.running}
          disabled={run.running || locked}
          onClick={() => void runTestsForQuestion(controller, monaco, questionId)}
          className="h-6 px-2.5 text-xs"
        >
          {run.running ? 'Running…' : 'Run tests'}
        </Button>
        <RunSummary run={run} />
      </header>
      {expanded && (
        <div className={clsx('min-h-0 flex-1 overflow-auto', run.running && 'opacity-60')}>
          <Results outcome={run.outcome} controller={controller} questionId={questionId} />
        </div>
      )}
    </section>
  );
}

function RunSummary({ run }: { run: TestRun }) {
  const s = summarize(run.outcome);
  const o = run.outcome;
  if (!o) return <span className="truncate text-xs text-muted">Run the tests to check your fixes.</span>;
  return (
    <span className="flex min-w-0 items-center gap-2 truncate text-xs" role="status">
      {s ? (
        <>
          <span className={clsx('font-medium', s.failed ? 'text-danger' : 'text-success')}>
            {s.failed ? `${s.failed} failed` : 'All passed'}
          </span>
          <span className="text-muted">
            {s.passed}/{s.total} passed
            {s.skipped ? ` · ${s.skipped} skipped` : ''}
            {run.durationMs !== null ? ` · ${(run.durationMs / 1000).toFixed(1)} s` : ''}
          </span>
        </>
      ) : (
        <span className="font-medium text-danger">
          {o.type === 'compile' ? 'Syntax errors' : o.type === 'timeout' ? 'Timed out' : 'Could not run'}
        </span>
      )}
    </span>
  );
}

const Results = memo(function Results({
  outcome,
  controller,
  questionId,
}: {
  outcome: SandboxOutcome | null;
  controller: WorkspaceController;
  questionId: string;
}) {
  if (!outcome) {
    return (
      <p className="px-4 py-3 text-sm text-muted">
        The tests in <code className="font-mono text-[12px]">__tests__/</code> are read-only and describe the
        expected behaviour. Run them as often as you like: they use your current code, saved or not.
      </p>
    );
  }
  if (outcome.type === 'compile') {
    return (
      <div className="px-4 py-3 text-sm">
        <p className="flex items-center gap-1.5 font-medium text-danger">
          <TriangleAlert className="size-4" aria-hidden="true" /> Fix these syntax errors first:
        </p>
        <ul className="mt-2 space-y-1">
          {outcome.errors.map((e, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => controller.goTo(questionId, e.path, e.line)}
                className="text-left font-mono text-[12px] hover:underline"
              >
                <span className="text-link">
                  {e.path}:{e.line}
                </span>{' '}
                <span className="text-strong">{e.message}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (outcome.type === 'timeout') {
    return (
      <p className="flex gap-2 px-4 py-3 text-sm text-strong">
        <Clock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        The tests didn't finish within 20 seconds and were stopped. Look for an infinite loop, or a promise or
        timer that never completes.
      </p>
    );
  }
  if (outcome.type === 'crash') {
    return (
      <div className="px-4 py-3 text-sm">
        <p className="font-medium text-danger">The test run failed to start.</p>
        <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[12px] text-strong">
          {outcome.error}
        </pre>
      </div>
    );
  }
  const files = groupByFile(outcome.results);
  let openFailures = 3; // the first few failures start expanded
  return (
    <div className="py-1 text-[13px]">
      {outcome.setupError && (
        <pre className="mx-3 my-2 whitespace-pre-wrap break-words rounded-md bg-danger-surface p-2 font-mono text-[12px] text-danger">
          {outcome.setupError}
        </pre>
      )}
      {files.map(([file, results]) => {
        const failed = results.filter((r) => r.status === 'failed').length;
        return (
          <div key={file} className="mb-1">
            <p className="flex items-center gap-2 px-3 py-1 font-mono text-[12px] text-muted">
              <span className="truncate">{file}</span>
              <span className={failed ? 'text-danger' : 'text-success'}>
                {failed ? `${failed} failed` : 'passed'}
              </span>
            </p>
            <ul>
              {results.map((r, i) => {
                const open = r.status === 'failed' && openFailures-- > 0;
                return <TestRow key={`${r.name}-${i}`} result={r} defaultOpen={open} />;
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
});

function TestRow({ result, defaultOpen }: { result: SandboxTestResult; defaultOpen: boolean }) {
  const icon =
    result.status === 'passed' ? (
      <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-label="Passed" />
    ) : result.status === 'failed' ? (
      <XCircle className="size-3.5 shrink-0 text-danger" aria-label="Failed" />
    ) : (
      <CircleSlash className="size-3.5 shrink-0 text-muted" aria-label="Skipped" />
    );
  const label = (
    <span className="flex min-w-0 items-center gap-2">
      {icon}
      <span className={clsx('min-w-0', result.status === 'skipped' && 'text-muted')}>{result.name}</span>
      {result.durationMs >= 100 && (
        <span className="shrink-0 text-xs text-muted">{result.durationMs} ms</span>
      )}
    </span>
  );
  const details = result.error || result.logs.length > 0;
  if (!details) return <li className="px-5 py-0.5">{label}</li>;
  return (
    <li>
      <details open={defaultOpen} className="group">
        <summary className="list-none px-5 py-0.5 hover:bg-surface-sunken [&::-webkit-details-marker]:hidden">
          {label}
        </summary>
        <div className="mb-1 ml-10 mr-3 space-y-1">
          {result.error && (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-danger-surface p-2 font-mono text-[12px] text-danger">
              {result.error}
            </pre>
          )}
          {result.logs.length > 0 && (
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-md bg-surface-sunken p-2 font-mono text-[12px] text-strong">
              {result.logs.join('\n')}
            </pre>
          )}
        </div>
      </details>
    </li>
  );
}

function groupByFile(results: SandboxTestResult[]): [string, SandboxTestResult[]][] {
  const map = new Map<string, SandboxTestResult[]>();
  for (const r of results) map.set(r.file, [...(map.get(r.file) ?? []), r]);
  return [...map];
}
