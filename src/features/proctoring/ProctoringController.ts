/**
 * Runs every proctoring measure the template enables, for one workspace session, and applies the
 * violation policy on the client: warnings for the first occurrences of each type, a notice after
 * that, and automatic submission at the limit. The server counts the same events independently
 * and is authoritative (it also submits at the limit, even if this code were tampered with).
 */
import type * as Monaco from 'monaco-editor';
import { toast } from '@/design/components';
import type { CandidateApi } from '@/lib/api/types';
import type { ProctoringConfig, ViolationPolicy } from '@/shared/proctoringConfig';
import type { WorkspaceController } from '../workspace/WorkspaceController';
import { useWorkspaceUi } from '../workspace/workspaceStore';
import { CameraManager } from './camera';
import { installClipboardGuard, type GuardedEditor } from './clipboardGuard';
import { installDevtoolsHeuristic } from './devtoolsHeuristic';
import { installDisplayMonitor } from './displayMonitor';
import { FacePresence, loadFaceCounter, type FaceCounter } from './faceMonitor';
import { installFocusMonitor } from './focusMonitor';
import { installFullscreenMonitor } from './fullscreenMonitor';
import { startLoudnessMonitor } from './microphone';
import { useProctoring, type CameraStatus } from './proctoringStore';
import { RateGate } from './rateGate';
import { installShortcutGuard } from './shortcutGuard';
import { SnapshotUploader } from './snapshotUploader';
import { installTypingMonitor } from './typingMonitor';
import { consequenceLine, copyFor, decideOutcome, isCounted, sharedCount } from './violationPolicy';

export interface ProctoringControllerOptions {
  config: ProctoringConfig;
  policy: ViolationPolicy;
  workspace: WorkspaceController;
  api: CandidateApi;
  token: string;
  /** Latest per-type violation counts known from the server. */
  serverViolationCounts: () => Record<string, number>;
  resumed: boolean;
}

const NOTICES: Record<string, string> = {
  paste_attempt: 'Pasting is disabled during the assessment.',
  copy_attempt: 'Copying is disabled during the assessment.',
  cut_attempt: 'Cutting to the clipboard is disabled during the assessment.',
  drop_attempt: 'Drag and drop is disabled during the assessment.',
  blocked_shortcut: 'That shortcut is disabled during the assessment.',
};

export class ProctoringController {
  private readonly disposers: (() => void)[] = [];
  private readonly flagGate = new RateGate(5000);
  private readonly noticeGate = new RateGate(8000);
  private camera: CameraManager | null = null;
  private uploader: SnapshotUploader | null = null;
  private faceCounter: FaceCounter | null = null;
  private presence: FacePresence | null = null;
  private fullscreen: ReturnType<typeof installFullscreenMonitor> | null = null;
  private timers: number[] = [];
  private periodic: number | null = null;
  private suppressUntil = 0;
  private disposed = false;
  private started = false;
  private cameraEverLive = false;
  private cameraDown = false;
  private warningSeq = 0;

  constructor(private readonly o: ProctoringControllerOptions) {}

  private get ws() {
    return this.o.workspace;
  }

  /** True once the test is over (or this controller is gone): nothing more is reported. */
  private ended() {
    return this.disposed || useWorkspaceUi.getState().locked;
  }

  /** Ignore focus changes the app causes itself (permission prompts, entering full screen). */
  suppressFor(ms: number) {
    this.suppressUntil = Math.max(this.suppressUntil, performance.now() + ms);
  }
  private readonly suppressed = () => performance.now() < this.suppressUntil;

  start() {
    if (this.started) return;
    this.started = true;
    const c = this.o.config;
    useProctoring.getState().reset();
    this.suppressFor(3000); // the page just opened: focus may still be settling

    if (c.paste.enabled || c.copyProtection.enabled || c.dragDrop.enabled) {
      this.disposers.push(
        installClipboardGuard({
          blockPaste: c.paste.enabled,
          blockCopy: c.copyProtection.enabled,
          blockDrop: c.dragDrop.enabled,
          blockContextMenu: c.copyProtection.enabled,
          allowInternalClipboard: c.paste.allowInternalClipboard,
          getEditor: () => this.guardedEditor(),
          onBlocked: (type, details) => this.flag(type, details),
        }),
      );
    }
    if (c.blockedShortcuts.enabled) {
      this.disposers.push(
        installShortcutGuard({
          onBlocked: (combo) => this.flag('blocked_shortcut', { combo }),
          onPrintScreen: () => this.flag('print_screen', {}),
        }),
      );
    }
    if (c.tabSwitch.enabled || c.windowBlur.enabled) {
      this.disposers.push(
        installFocusMonitor({
          tabSwitch: c.tabSwitch.enabled,
          windowBlur: c.windowBlur.enabled,
          graceMs: c.windowBlur.graceMs,
          onTabSwitch: () => this.incident('tab_switch'),
          onWindowBlur: () => this.incident('window_blur', { grace_ms: c.windowBlur.graceMs }),
          suppressed: this.suppressed,
        }),
      );
    }
    if (c.fullscreen.enabled) {
      this.fullscreen = installFullscreenMonitor({
        keyboardLock: c.keyboardLock.enabled,
        onChange: (fs) => useProctoring.getState().setBlocker('fullscreen', !fs),
        onExit: () => this.incident('fullscreen_exit'),
        onKeyboardLockUnavailable: () => this.degraded('keyboard_lock', 'unavailable'),
      });
      this.disposers.push(() => this.fullscreen?.dispose());
    }
    if (c.multiMonitor.enabled) {
      this.disposers.push(
        installDisplayMonitor({
          pollMs: c.multiMonitor.pollMs,
          onChange: (extended) => {
            useProctoring.getState().setBlocker('display', extended);
            if (extended) this.incident('multi_monitor');
          },
          onUnsupported: () => this.degraded('multi_monitor', 'unsupported'),
        }),
      );
    }
    if (c.devtoolsHeuristic.enabled) {
      this.disposers.push(
        installDevtoolsHeuristic({ onSuspected: (d) => this.flag('devtools_suspected', d) }),
      );
    }
    if (c.suspiciousInsert.enabled || c.typingCadence.enabled) {
      this.disposers.push(
        this.ws.onEditor((editor) =>
          installTypingMonitor({
            editor,
            suspiciousInsert: c.suspiciousInsert,
            typingCadence: c.typingCadence,
            isAppEdit: () => this.ws.programmaticEdits > 0,
            onSuspiciousInsert: (d) => this.flag('suspicious_insert', d),
            onTypingAnomaly: (d) => this.flag('typing_anomaly', d),
          }),
        ),
      );
    }
    if (c.webcam.enabled) void this.startCamera();
    if (c.microphone.enabled) void this.startMicrophone();

    // Blocked → the editor and notes are read-only until the condition is resolved.
    this.disposers.push(
      useProctoring.subscribe((s, prev) => {
        if (s.blockers.length !== prev.blockers.length) {
          useWorkspaceUi.getState().set({ paused: s.blockers.length > 0 });
          if (s.blockers.length && document.activeElement instanceof HTMLElement)
            document.activeElement.blur();
        }
      }),
    );
    const release = () => this.dispose();
    window.addEventListener('codearena:release-devices', release);
    this.disposers.push(() => window.removeEventListener('codearena:release-devices', release));
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.disposers.splice(0).forEach((d) => d());
    this.timers.forEach((t) => window.clearInterval(t));
    if (this.periodic !== null) window.clearTimeout(this.periodic);
    this.faceCounter?.close();
    this.faceCounter = null;
    this.camera?.dispose();
    this.camera = null;
    this.uploader?.stop('disposed');
    useWorkspaceUi.getState().set({ paused: false });
    useProctoring.getState().reset();
  }

  // ── Reporting ────────────────────────────────────────────────────────────
  /** Logged for reviewers, never counted; repeats within 5 s are merged. */
  private flag(type: string, details: Record<string, unknown>) {
    if (this.ended()) return;
    const notice = NOTICES[type];
    if (notice && this.noticeGate.pass(type) !== null) toast.info(notice);
    const repeats = this.flagGate.pass(type);
    if (repeats === null) return;
    this.ws.report(type, repeats ? { ...details, repeats } : details);
  }

  private info(type: string, details: Record<string, unknown> = {}) {
    if (!this.ended()) this.ws.report(type, details);
  }

  private degraded(measure: string, reason: string) {
    this.info('proctoring_degraded', { measure, reason });
  }

  /** A proctoring rule was broken. Counted types are sent immediately, with a snapshot if configured. */
  private incident(type: string, details: Record<string, unknown> = {}) {
    if (this.ended()) return;
    const { policy, config } = this.o;
    const counted = isCounted(policy, type);
    const snapshotId = counted && config.webcam.snapshotOnViolation ? this.snapshot('violation') : null;
    this.ws.report(type, snapshotId ? { ...details, snapshot_client_id: snapshotId } : details, {
      urgent: counted,
    });
    if (!counted) return;

    // Best known counts: this device's, or the server's if higher (e.g. after switching devices).
    // The server hasn't seen this event yet, so its count for this type gets +1.
    this.ws.recordViolation(type);
    const local = this.ws.violationCounts();
    const server = this.o.serverViolationCounts();
    const counts: Record<string, number> = {};
    for (const t of new Set([...Object.keys(local), ...Object.keys(server)])) {
      counts[t] = Math.max(local[t] ?? 0, (server[t] ?? 0) + (t === type ? 1 : 0));
    }
    const occurrence = counts[type] ?? 1;
    const shared = sharedCount(policy, counts);
    const outcome = decideOutcome(policy, type, occurrence, shared);
    if (outcome.kind === 'auto_submit') {
      useWorkspaceUi.getState().set({ limitReached: true });
      void this.ws.submit();
    } else if (outcome.kind === 'warn') {
      const detail = consequenceLine(policy, type, occurrence, shared);
      useProctoring.getState().set({
        warning: { id: ++this.warningSeq, type, occurrence, warnings: outcome.warnings, detail },
      });
      this.ws.report('warning_shown', { kind: 'violation', type, occurrence, warnings: outcome.warnings });
    } else {
      toast.danger(copyFor(type).title, consequenceLine(policy, type, occurrence, shared));
    }
  }

  // ── Camera, snapshots, faces ─────────────────────────────────────────────
  /** Shows the camera's own <video> element inside `host` (mirrored); returns the unmount. */
  mountCameraView(host: HTMLElement | null): () => void {
    const video = this.camera?.video;
    if (!video || !host) return () => undefined;
    video.className = 'size-full object-cover -scale-x-100';
    host.appendChild(video);
    return () => video.remove();
  }

  private async startCamera() {
    this.camera = new CameraManager({ onStatus: (s, stream) => this.onCameraStatus(s, stream) });
    this.uploader = new SnapshotUploader({ api: this.o.api, token: this.o.token });
    this.suppressFor(15_000); // a permission prompt may take focus
    await this.camera.start();
    this.suppressFor(1500);
    if (this.disposed) return;
    if (this.o.config.faceDetection.enabled) void this.startFaceDetection();
  }

  /** From the "Turn the camera back on" button. */
  async retryCamera() {
    if (!this.camera) return;
    this.suppressFor(15_000);
    await this.camera.start();
    this.suppressFor(1500);
  }

  private onCameraStatus(status: CameraStatus, stream: MediaStream | null) {
    const store = useProctoring.getState();
    store.set({ camera: status, cameraStream: stream });
    if (status === 'starting') return;
    const live = status === 'live';
    store.setBlocker('camera', this.o.config.webcam.required && !live);
    this.presence?.reset();
    if (live) {
      if (!this.cameraEverLive) {
        this.cameraEverLive = true;
        this.snapshot(this.o.resumed ? 'resume' : 'start');
        this.schedulePeriodic();
      } else if (this.cameraDown) {
        this.info('camera_on');
      }
      this.cameraDown = false;
    } else if (!this.cameraDown) {
      this.cameraDown = true;
      this.incident('camera_off', { status });
    }
  }

  /** Captures and queues a snapshot; returns its id (to link it to an event) or null. */
  private snapshot(reason: string): string | null {
    const camera = this.camera;
    const uploader = this.uploader;
    if (!camera || !uploader || camera.current !== 'live') return null;
    const id = crypto.randomUUID();
    void camera.capture().then((frame) => {
      if (frame && !this.disposed) {
        uploader.enqueue({
          clientSnapshotId: id,
          reason,
          faceCount: useProctoring.getState().faces,
          ...frame,
        });
      }
    });
    return id;
  }

  private schedulePeriodic() {
    const base = this.o.config.webcam.snapshotIntervalSec * 1000;
    this.periodic = window.setTimeout(
      () => {
        if (this.disposed) return;
        this.snapshot('periodic');
        this.schedulePeriodic();
      },
      base * (0.85 + Math.random() * 0.3), // jittered so the moment can't be anticipated
    );
  }

  private async startFaceDetection() {
    const fd = this.o.config.faceDetection;
    const res = await loadFaceCounter();
    if (this.disposed) {
      if ('counter' in res) res.counter.close();
      return;
    }
    if ('error' in res) return this.degraded('face_detection', res.error);
    this.faceCounter = res.counter;
    this.presence = new FacePresence(fd.noFaceSeconds * 1000, fd.multiFaceConsecutive);
    this.timers.push(window.setInterval(() => this.checkFaces(), fd.intervalMs));
  }

  private checkFaces() {
    const camera = this.camera;
    if (!this.faceCounter || !this.presence || !camera || camera.current !== 'live') return;
    if (camera.video.readyState < 2 || document.visibilityState === 'hidden') return;
    let count: number;
    try {
      count = this.faceCounter.count(camera.video, performance.now());
    } catch {
      return;
    }
    useProctoring.getState().set({ faces: count });
    for (const ev of this.presence.update(count, performance.now())) {
      if (ev.type === 'no_face') this.incident('no_face', { seconds: Math.round(ev.sinceMs / 1000) });
      else if (ev.type === 'multiple_faces') this.incident('multiple_faces', { faces: ev.count });
    }
  }

  private async startMicrophone() {
    const m = this.o.config.microphone;
    this.suppressFor(15_000);
    const res = await startLoudnessMonitor({
      loudDbfs: m.loudDbfs,
      sustainSec: m.sustainSec,
      onLoud: (d) => this.flag('loud_audio', d),
    });
    this.suppressFor(1500);
    if (typeof res === 'function') {
      if (this.disposed) res();
      else this.disposers.push(res);
    } else {
      this.degraded('microphone', res.error);
    }
  }

  // ── Full screen ──────────────────────────────────────────────────────────
  /** From the "Return to full screen" button (needs the click's user activation). */
  async returnToFullscreen(): Promise<boolean> {
    this.suppressFor(3000);
    return (await this.fullscreen?.requestReturn()) ?? true;
  }

  // ── Editor adapter for the clipboard guard ───────────────────────────────
  private guardedEditor(): GuardedEditor | null {
    const ed = this.ws.editor;
    if (!ed) return null;
    const selections = () => ed.getSelections() ?? [];
    const edit = (text: string) => {
      if (ed.getRawOptions().readOnly) return;
      this.ws.asAppEdit(() => {
        ed.executeEdits(
          'codearena-clipboard',
          selections().map((range: Monaco.Selection) => ({ range, text, forceMoveMarkers: true })),
        );
        ed.pushUndoStop();
      });
    };
    return {
      getDomNode: () => ed.getDomNode(),
      getSelectedText: () => {
        const model = ed.getModel();
        return model
          ? selections()
              .map((s) => model.getValueInRange(s))
              .join(model.getEOL())
          : '';
      },
      insertText: edit,
      deleteSelection: () => edit(''),
    };
  }
}
