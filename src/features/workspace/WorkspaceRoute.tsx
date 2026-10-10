import type * as Monaco from 'monaco-editor';
import { useEffect, useState } from 'react';
import { Group, Panel, Separator, usePanelRef } from 'react-resizable-panels';
import { useShallow } from 'zustand/react/shallow';
import { appConfig } from '@/config/app.config';
import { Button, Card, LoadingState, toast } from '@/design/components';
import { applyTheme } from '@/design/theme';
import { getCandidateApi, type SessionState, type Workspace } from '@/lib/api';
import { WakeLockKeeper } from '@/lib/device/wakeLock';
import { loadRecord, saveRecord, splitFileKey, type LocalRecord } from '@/lib/persist/localRecord';
import { serverClock } from '@/lib/time/serverClock';
import {
  resolveProctoringConfig,
  resolveViolationPolicy,
  type ProctoringConfig,
} from '@/shared/proctoringConfig';
import { CandidateGate } from '../candidate/session/CandidateGate';
import { candidateErrorMessage, useCandidateSession } from '../candidate/session/candidateSession';
import { CameraBadge } from '../proctoring/components/CameraBadge';
import { ProctoringOverlays } from '../proctoring/components/ProctoringOverlays';
import { Watermark } from '../proctoring/components/Watermark';
import { ProctoringController } from '../proctoring/ProctoringController';
import { acquireTabLock, type TabLock } from '../proctoring/tabLock';
import { OfflineBanner, StaffMessageDialog, SubmitDialog, SubmittingOverlay } from './components/Dialogs';
import { EditorPane } from './components/EditorPane';
import { ProblemPane } from './components/ProblemPane';
import { QuestionsFlyout } from './components/QuestionsFlyout';
import { ActivityBar } from './components/ActivityBar';
import { FilesPanel } from './components/FileTree';
import { treeWidthFor } from './components/fileTreeModel';
import { AssistantPanel } from '../assistant/AssistantPanel';
import { hasRunnableTests } from '../runner/runController';
import { TestPanel } from '../runner/TestPanel';
import { useTestRuns } from '../runner/testRunStore';
import { WindowTooSmall } from './components/WindowTooSmall';
import { Countdown, WorkspaceHeader } from './components/WorkspaceHeader';
import { setupMonaco } from './editor/monacoSetup';
import { mergeWorkspace } from './mergeWorkspace';
import { dueWarnings, useCountdown } from './useCountdown';
import { WorkspaceController } from './WorkspaceController';
import { useWorkspaceUi } from './workspaceStore';

export default function WorkspaceRoute() {
  return <CandidateGate route="/test">{(state) => <WorkspaceLoader state={state} />}</CandidateGate>;
}

interface Ready {
  controller: WorkspaceController;
  proctor: ProctoringController;
  monaco: typeof Monaco;
}

/** One tab per assessment: 'duplicate' = another tab has it; 'moved' = another tab took it over. */
type TabState = 'checking' | 'owner' | 'duplicate' | 'moved';

/** Retries briefly so a tab that is just closing (reload, React re-mount) can release the lock. */
async function acquireLock(sessionId: string, steal: boolean, onLost: () => void): Promise<TabLock | null> {
  for (let attempt = 0; ; attempt++) {
    const lock = await acquireTabLock(sessionId, { steal, onLost });
    if (lock || steal || attempt >= 3) return lock;
    await new Promise((r) => setTimeout(r, 250));
  }
}

function WorkspaceLoader({ state }: { state: SessionState }) {
  const token = useCandidateSession((s) => s.token);
  const { setState, setFatal } = useCandidateSession.getState();
  const [ready, setReady] = useState<Ready | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabState>('checking');
  const [steal, setSteal] = useState(0);

  useEffect(() => {
    if (!token) return;
    let disposed = false;
    let controller: WorkspaceController | null = null;
    let proctor: ProctoringController | null = null;
    let lock: TabLock | null = null;
    const teardown = () => {
      proctor?.dispose();
      proctor = null;
      controller?.dispose();
      controller = null;
    };
    void (async () => {
      lock = await acquireLock(state.sessionId, steal > 0, () => {
        teardown();
        setReady(null);
        setTab('moved');
      });
      if (disposed) {
        lock?.release();
        return;
      }
      if (!lock) {
        setTab('duplicate');
        if (steal === 0) reportSecondTab(token, state);
        return;
      }
      setTab('owner');
      const monaco = setupMonaco();
      const api = getCandidateApi();
      const res = await api.getWorkspace(token);
      if (disposed) return;
      let workspace: Workspace;
      let offline = false;
      if (res.ok) {
        serverClock.sample(res.workspace.state.serverNowMs, res.timing.sentAtPerf, res.timing.receivedAtPerf);
        workspace = res.workspace;
      } else if (res.error === 'NETWORK') {
        // Reloaded while offline: open the copy saved on this device and keep working.
        const fromDevice = cachedWorkspace(await loadRecord(state.sessionId));
        if (!fromDevice) return setError(candidateErrorMessage('NETWORK'));
        workspace = fromDevice;
        offline = true;
      } else {
        if (res.error === 'SESSION_SUPERSEDED' || res.error === 'INVALID_SESSION') setFatal(res.error);
        else if (res.state) setState(res.state);
        else setError(candidateErrorMessage(res.error));
        return;
      }
      const { record, resumed } = mergeWorkspace(await loadRecord(workspace.state.sessionId), workspace);
      record.cache = { questions: workspace.questions, state: workspace.state };
      await saveRecord(record);
      if (disposed) return;
      useWorkspaceUi.getState().reset();
      useTestRuns.getState().reset();
      controller = new WorkspaceController({
        monaco,
        api,
        token,
        workspace,
        record,
        resumed,
        clock: serverClock,
        candidateName: workspace.state.candidate.fullName,
        onState: (s) => useCandidateSession.getState().setState(s),
        onFatal: (code) => useCandidateSession.getState().setFatal(code),
      });
      proctor = new ProctoringController({
        config: resolveProctoringConfig(workspace.state.proctoring),
        policy: resolveViolationPolicy(workspace.state.violationPolicy),
        workspace: controller,
        api,
        token,
        serverViolationCounts: () => useCandidateSession.getState().state?.violationCounts ?? {},
        resumed,
      });
      controller.start();
      proctor.start();
      if (offline) {
        toast.warning(
          "You're offline",
          'Continuing from the copy saved on this device. It will sync automatically.',
        );
      }
      setReady({ controller, proctor, monaco });
    })();
    return () => {
      disposed = true;
      teardown();
      lock?.release();
    };
    // `state` is read once per session; later state changes reach the controller through sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, state.sessionId, steal, setFatal, setState]);

  if (tab === 'duplicate' || tab === 'moved') {
    return <OtherTabScreen moved={tab === 'moved'} onUseThisTab={() => setSteal((n) => n + 1)} />;
  }

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-app px-6">
        <Card padding="lg" className="max-w-md text-center">
          <h1 className="text-xl font-semibold">We couldn't open your workspace</h1>
          <p className="mt-2 text-muted">{error}</p>
          <p className="mt-2 text-sm text-muted">
            Your timer is still running on the server. Your saved work is safe.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }
  if (!ready) return <LoadingState label="Opening your workspace…" className="min-h-dvh" />;
  return (
    <Workspace state={state} controller={ready.controller} proctor={ready.proctor} monaco={ready.monaco} />
  );
}

/** The duplicate tab records the violation itself; it never starts a sync engine of its own. */
function reportSecondTab(token: string, state: SessionState) {
  if (!resolveProctoringConfig(state.proctoring).multiTab.enabled) return;
  void getCandidateApi().sync(token, {
    events: [
      { client_event_id: crypto.randomUUID(), type: 'second_tab', details: { detected_by: 'new_tab' } },
    ],
  });
}

function OtherTabScreen({ moved, onUseThisTab }: { moved: boolean; onUseThisTab: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-app px-6">
      <Card padding="lg" className="max-w-md text-center">
        <h1 className="text-xl font-semibold">
          {moved ? 'Your assessment moved to another tab' : 'Your assessment is open in another tab'}
        </h1>
        <p className="mt-2 text-muted">
          {moved
            ? 'It was opened in another tab or window, so it is paused here. Your work is saved.'
            : 'Only one tab or window may be used. Close this tab and continue in the other one, or use this tab instead.'}
        </p>
        <p className="mt-2 text-sm text-muted">
          Using more than one tab is recorded. Your timer keeps running.
        </p>
        <Button className="mt-6" onClick={onUseThisTab}>
          Use this tab instead
        </Button>
      </Card>
    </div>
  );
}

/** Rebuilds a Workspace from the on-device record (reload while offline). */
function cachedWorkspace(record: LocalRecord | undefined): Workspace | null {
  if (!record?.cache) return null;
  return {
    state: record.cache.state,
    backupKeyB64: record.backupKeyB64,
    questions: record.cache.questions,
    files: Object.entries(record.files).map(([key, f]) => {
      const [questionId, path] = splitFileKey(key);
      return { questionId, path, content: f.content, clientSeq: f.synced ? f.seq : 0 };
    }),
    responses: Object.entries(record.responses).map(([questionId, r]) => ({
      questionId,
      status: r.status,
      notes: r.notes,
      clientSeq: r.synced ? r.seq : 0,
    })),
    nextChunkSeq: record.nextChunkSeq,
  };
}

interface WorkspaceProps {
  state: SessionState;
  controller: WorkspaceController;
  proctor: ProctoringController;
  monaco: typeof Monaco;
}

function Workspace({ state, controller, proctor, monaco }: WorkspaceProps) {
  const proctoring: ProctoringConfig = resolveProctoringConfig(state.proctoring);
  const submitPhase = useWorkspaceUi((s) => s.submitPhase);
  const set = useWorkspaceUi((s) => s.set);
  const theme = useWorkspaceUi((s) => s.prefs.theme);
  const statementCollapsed = useWorkspaceUi((s) => s.statementCollapsed);
  const statementRef = usePanelRef();
  const filesRef = usePanelRef();
  useFitFilesPane(filesRef);
  const toggleStatement = () => {
    const panel = statementRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };
  // Dark mode is a workspace-only option: applied while the workspace is open, light elsewhere.
  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => () => applyTheme('light'), []);
  useLifecycle(controller, submitPhase);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface-app">
      <WorkspaceHeader
        state={state}
        timer={<WorkspaceTimer controller={controller} />}
        onSubmit={() => set({ submitPhase: 'confirm' })}
        camera={proctoring.webcam.enabled ? <CameraBadge proctor={proctor} /> : null}
      />
      <OfflineBanner />
      <div className="flex min-h-0 flex-1">
        <ActivityBar assistantEnabled={proctoring.aiAssistant.enabled} onToggleStatement={toggleStatement} />
        <div className="relative min-w-0 flex-1">
          <Group orientation="horizontal" className="h-full">
            <Panel
              id="statement"
              panelRef={statementRef}
              collapsible
              collapsedSize={0}
              defaultSize="28"
              minSize={260}
              onResize={(size) => {
                const collapsed = size.inPixels < 1;
                if (collapsed !== useWorkspaceUi.getState().statementCollapsed)
                  set({ statementCollapsed: collapsed });
              }}
            >
              <div className="relative h-full">
                <ProblemPane controller={controller} protectContent={proctoring.copyProtection.enabled} />
                {!statementCollapsed && <FlyoutLayer controller={controller} proctoring={proctoring} />}
              </div>
            </Panel>
            <Separator className="w-1 bg-border transition-colors hover:bg-separator-hover data-[separator=active]:bg-primary" />
            <Panel id="files" panelRef={filesRef} defaultSize="19" minSize={150} maxSize="35">
              <FilesPanel controller={controller} />
            </Panel>
            <Separator className="w-1 bg-border transition-colors hover:bg-separator-hover data-[separator=active]:bg-primary" />
            <Panel id="editor" minSize={380}>
              <CodeColumn controller={controller} monaco={monaco} proctoring={proctoring} />
            </Panel>
          </Group>
          {/* Statement hidden: the flyouts float over the left edge instead. */}
          {statementCollapsed && (
            <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[min(380px,45%)]">
              <FlyoutLayer controller={controller} proctoring={proctoring} />
            </div>
          )}
        </div>
      </div>
      <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-surface px-4 text-[11px] text-muted">
        <span>{appConfig.footerText(new Date().getFullYear())}</span>
        <span>Autosaves every few seconds · Ctrl+S saves now</span>
      </footer>
      <SubmitDialog controller={controller} />
      <SubmittingOverlay controller={controller} />
      <StaffMessageDialog controller={controller} />
      <ProctoringOverlays proctor={proctor} />
      <WindowTooSmall />
      {proctoring.watermark.enabled && (
        <Watermark
          opacity={proctoring.watermark.opacity}
          lines={[
            `${state.candidate.fullName} · ${state.candidate.email}`,
            `Session ${state.sessionId.slice(0, 8)} · ${appConfig.watermarkLabel}`,
          ]}
        />
      )}
    </div>
  );
}

let measureCanvas: CanvasRenderingContext2D | null | undefined;
const measureName = (text: string) => {
  measureCanvas ??= document.createElement('canvas').getContext('2d');
  if (!measureCanvas) return text.length * 7.5;
  measureCanvas.font = '13px "Inter Variable", Inter, system-ui, sans-serif';
  return measureCanvas.measureText(text).width;
};

/**
 * Widens the file pane when a question's file names wouldn't fit (deep Java packages), up to the
 * pane's maximum. It never narrows it: a width the candidate chose stays.
 */
function useFitFilesPane(filesRef: ReturnType<typeof usePanelRef>) {
  const questionId = useWorkspaceUi((s) => s.currentQuestionId);
  useEffect(() => {
    const panel = filesRef.current;
    const q = useWorkspaceUi.getState().questions.find((x) => x.questionId === questionId);
    if (!panel || !q) return;
    const needed = treeWidthFor(q.files, measureName);
    if (needed > panel.getSize().inPixels) panel.resize(needed);
  }, [filesRef, questionId]);
}

/** The editor, with the test results under it for questions that have runnable tests. */
function CodeColumn({
  controller,
  monaco,
  proctoring,
}: {
  controller: WorkspaceController;
  monaco: typeof Monaco;
  proctoring: ProctoringConfig;
}) {
  const { questionId, runnable } = useWorkspaceUi(
    useShallow((s) => {
      const q = s.questions.find((x) => x.questionId === s.currentQuestionId);
      return { questionId: q?.questionId ?? null, runnable: !!q && hasRunnableTests(q.files) };
    }),
  );
  const revealSignal = useTestRuns((s) => s.revealSignal);
  return (
    <EditorPane
      controller={controller}
      monaco={monaco}
      proctoring={proctoring}
      revealBottom={revealSignal}
      bottom={
        runnable && questionId ? (
          <TestPanel controller={controller} monaco={monaco} questionId={questionId} />
        ) : undefined
      }
    />
  );
}

/**
 * The question list (while hovered) or the coding assistant (while toggled on), drawn over the
 * statement so the file tree and the code are never covered.
 */
function FlyoutLayer({
  controller,
  proctoring,
}: {
  controller: WorkspaceController;
  proctoring: ProctoringConfig;
}) {
  const { questionsOpen, assistantOpen } = useWorkspaceUi(
    useShallow((s) => ({
      questionsOpen: s.questionsOpen,
      assistantOpen: s.assistantOpen && proctoring.aiAssistant.enabled,
    })),
  );
  if (!questionsOpen && !assistantOpen) return null;
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 overflow-hidden border-r border-border bg-surface shadow-lg">
      {questionsOpen ? (
        <QuestionsFlyout controller={controller} />
      ) : (
        <AssistantPanel controller={controller} maxRequests={proctoring.aiAssistant.maxRequests} />
      )}
    </div>
  );
}

/** The countdown and everything driven by it; re-renders alone, twice a second. */
function WorkspaceTimer({ controller }: { controller: WorkspaceController }) {
  const deadlineMs = useWorkspaceUi((s) => s.deadlineMs);
  const remaining = useCountdown(deadlineMs);
  useTimeKeeping(controller, remaining);
  return <Countdown remainingMs={remaining} />;
}

/** Timer warnings at 30/10/5/1 minutes and auto-submit at zero (the server enforces it too). */
function useTimeKeeping(controller: WorkspaceController, remaining: number | null) {
  const set = useWorkspaceUi((s) => s.set);
  useEffect(() => {
    if (remaining === null) return;
    const { show, markFired } = dueWarnings(remaining, controller.firedWarnings());
    if (markFired.length) controller.markWarningsFired(markFired);
    if (show !== null && remaining > 0) {
      const title = show === 1 ? 'Less than 1 minute remaining' : `${show} minutes remaining`;
      toast.warning(
        title,
        show <= 5
          ? 'Your work will be submitted automatically when time runs out.'
          : 'Your work is saved automatically. Leave yourself time to check your fixes.',
      );
      controller.report('warning_shown', { kind: 'time', minutes: show });
    }
    if (remaining === 0 && useWorkspaceUi.getState().submitPhase !== 'done') {
      set({ timeUp: true });
      void controller.submit('time_up');
    }
  }, [controller, remaining, set]);
}

/** Network, visibility, sleep, wake-lock, unload and keyboard handling for the whole workspace. */
function useLifecycle(controller: WorkspaceController, submitPhase: string) {
  useEffect(() => {
    const onOnline = () => {
      controller.report('online');
      controller.engine.nudge();
    };
    const onOffline = () => controller.report('offline');
    const onVisible = () => {
      if (document.visibilityState === 'visible') controller.engine.nudge(); // re-sync the clock after sleep
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void controller.engine.flush().then(() => toast.success('Saved'));
      }
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('keydown', onKey, true);
    let reportedWakeLock = false;
    const wake = new WakeLockKeeper((reason) => {
      if (reportedWakeLock) return;
      reportedWakeLock = true;
      controller.report('wake_lock_lost', { reason });
    });
    void wake.start();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('keydown', onKey, true);
      void wake.stop();
    };
  }, [controller]);

  // Warn before leaving while the test is running (work is saved either way).
  useEffect(() => {
    if (submitPhase === 'done') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      void controller.engine.persistNow();
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [controller, submitPhase]);
}
