import type * as Monaco from 'monaco-editor';
import { useEffect, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
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
import { QuestionNavigator } from './components/QuestionNavigator';
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
        <QuestionNavigator controller={controller} />
        <Group orientation="horizontal" className="min-w-0 flex-1">
          <Panel defaultSize="38" minSize="22">
            <ProblemPane controller={controller} protectContent={proctoring.copyProtection.enabled} />
          </Panel>
          <Separator className="w-1.5 bg-border transition-colors hover:bg-separator-hover" />
          <Panel minSize="35">
            <EditorPane controller={controller} monaco={monaco} proctoring={proctoring} />
          </Panel>
        </Group>
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
          : 'Make sure your explanations are up to date.',
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
