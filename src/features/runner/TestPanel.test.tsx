import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as Monaco from 'monaco-editor';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BottomPanelContext } from '../workspace/components/bottomPanel';
import type { WorkspaceController } from '../workspace/WorkspaceController';
import { useWorkspaceUi } from '../workspace/workspaceStore';
import type { SandboxOutcome, SandboxTestResult } from './buildScript';
import { hasRunnableTests } from './runController';
import { TestPanel } from './TestPanel';
import { summarize, useTestRuns } from './testRunStore';

vi.mock('./runTests', () => ({ loadRuntime: vi.fn(async () => ''), runQuestionTests: vi.fn() }));
const runController = vi.hoisted(() => ({ run: vi.fn(async () => undefined) }));
vi.mock('./runController', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./runController')>()),
  runTestsForQuestion: runController.run,
}));

const QID = 'q-1';
const result = (
  name: string,
  status: SandboxTestResult['status'],
  extra: Partial<SandboxTestResult> = {},
) => ({
  file: '__tests__/a.test.ts',
  name,
  status,
  durationMs: 3,
  logs: [],
  ...extra,
});

function show(outcome: SandboxOutcome | null, { expanded = true } = {}) {
  useTestRuns.getState().reset();
  if (outcome) useTestRuns.getState().finish(QID, outcome, 1234);
  const controller = { goTo: vi.fn() } as unknown as WorkspaceController;
  const toggle = vi.fn();
  render(
    <BottomPanelContext.Provider value={{ expanded, toggle }}>
      <TestPanel controller={controller} monaco={{} as typeof Monaco} questionId={QID} />
    </BottomPanelContext.Provider>,
  );
  return { controller, toggle, user: userEvent.setup() };
}

beforeEach(() => {
  runController.run.mockClear();
  useWorkspaceUi.setState({ locked: false });
});

describe('summarize', () => {
  it('counts results, and a setup error as a failure', () => {
    expect(
      summarize({
        type: 'done',
        setupError: 'boom',
        results: [result('a', 'passed'), result('b', 'failed'), result('c', 'skipped')],
      }),
    ).toEqual({ passed: 1, failed: 2, skipped: 1, total: 3 });
    expect(summarize({ type: 'timeout' })).toBeNull();
    expect(summarize(null)).toBeNull();
  });
});

describe('hasRunnableTests', () => {
  it('is true only for TypeScript/JavaScript test files', () => {
    expect(hasRunnableTests([{ path: '__tests__/a.test.tsx' }])).toBe(true);
    expect(hasRunnableTests([{ path: 'src/a.spec.js' }])).toBe(true);
    expect(hasRunnableTests([{ path: '__tests__/support/fakeServer.ts' }])).toBe(false);
    expect(hasRunnableTests([{ path: 'src/test/java/ApprovalServiceIT.java' }])).toBe(false);
  });
});

describe('TestPanel', () => {
  it('invites a first run, and runs the current question', async () => {
    const { user } = show(null);
    expect(screen.getByText('Run the tests to check your fixes.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /run tests/i }));
    expect(runController.run).toHaveBeenCalledWith(expect.anything(), expect.anything(), QID);
  });

  it('summarises a run and opens the first failures with their messages', () => {
    show({
      type: 'done',
      setupError: null,
      results: [
        result('works', 'passed'),
        result('breaks', 'failed', { error: 'expected 1 to be 2' }),
        result('later', 'skipped'),
      ],
    });
    const summary = screen.getByRole('status');
    expect(summary).toHaveTextContent('1 failed');
    expect(summary).toHaveTextContent('1/3 passed · 1 skipped · 1.2 s');
    expect(screen.getByText('expected 1 to be 2')).toBeVisible();
  });

  it('says "All passed" when everything passes', () => {
    show({ type: 'done', setupError: null, results: [result('a', 'passed'), result('b', 'passed')] });
    expect(screen.getByRole('status')).toHaveTextContent('All passed');
  });

  it('lists syntax errors that jump to the line', async () => {
    const { controller, user } = show({
      type: 'compile',
      errors: [{ path: 'src/utils/dates.ts', line: 18, message: "'}' expected." }],
    });
    expect(screen.getByText('Syntax errors')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /src\/utils\/dates\.ts:18/ }));
    expect(controller.goTo).toHaveBeenCalledWith(QID, 'src/utils/dates.ts', 18);
  });

  it('explains a timeout and a crash', () => {
    show({ type: 'timeout' });
    expect(screen.getByText('Timed out')).toBeInTheDocument();
    expect(screen.getByText(/didn't finish within 20 seconds/)).toBeInTheDocument();
  });

  it('shows a crash message', () => {
    show({ type: 'crash', error: 'Test runtime unavailable (HTTP 503)' });
    expect(screen.getByText('Could not run')).toBeInTheDocument();
    expect(screen.getByText('Test runtime unavailable (HTTP 503)')).toBeInTheDocument();
  });

  it('collapses to its header, and toggles from it', async () => {
    const { toggle, user } = show(
      { type: 'done', setupError: null, results: [result('x', 'failed', { error: 'nope' })] },
      { expanded: false },
    );
    expect(screen.queryByText('nope')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tests' }));
    expect(toggle).toHaveBeenCalled();
  });

  it("can't run once the assessment is locked", () => {
    useWorkspaceUi.setState({ locked: true });
    show(null);
    expect(screen.getByRole('button', { name: /run tests/i })).toBeDisabled();
  });
});
