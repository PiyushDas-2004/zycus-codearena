import { clsx } from 'clsx';
import {
  Camera,
  CircleCheck,
  CircleX,
  Globe,
  HardDrive,
  Maximize,
  Monitor,
  MonitorSmartphone,
  RotateCcw,
  Sun,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { appConfig } from '@/config/app.config';
import { Alert, Button, Card, Spinner } from '@/design/components';
import { getCandidateApi, type SessionState } from '@/lib/api';
import {
  describeDevice,
  detectBrowser,
  hasExtendedDisplay,
  isSupportedBrowser,
  MIN_BROWSER_VERSION,
} from '@/lib/device/environment';
import { probeStorage, requestPersistentStorage } from '@/lib/persist/localRecord';
import { resolveProctoringConfig } from '@/shared/proctoringConfig';
import { CandidateShell } from './CandidateShell';
import { CandidateGate } from './session/CandidateGate';
import { useCandidateSession } from './session/candidateSession';

type Status = 'running' | 'pass' | 'fail' | 'warn';

interface CheckRow {
  id: string;
  icon: LucideIcon;
  label: string;
  required: boolean;
  status: Status;
  detail: string;
}

export default function SystemCheckRoute() {
  return <CandidateGate route="/check">{(state) => <SystemCheck state={state} />}</CandidateGate>;
}

function SystemCheck({ state }: { state: SessionState }) {
  const navigate = useNavigate();
  const setSystemCheck = useCandidateSession((s) => s.setSystemCheck);
  const proctoring = resolveProctoringConfig(state.proctoring);
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [running, setRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const update = (id: string, patch: Partial<CheckRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const run = useCallback(async () => {
    setRunning(true);
    const initial: CheckRow[] = [
      {
        id: 'browser',
        icon: Globe,
        label: 'Supported browser',
        required: true,
        status: 'running',
        detail: '',
      },
      {
        id: 'screen',
        icon: Monitor,
        label: `Screen at least ${appConfig.candidate.minScreenWidthPx}px wide`,
        required: true,
        status: 'running',
        detail: '',
      },
      {
        id: 'displays',
        icon: MonitorSmartphone,
        label: 'Only one display connected',
        required: proctoring.multiMonitor.enabled && proctoring.multiMonitor.blockStartIfExtended,
        status: 'running',
        detail: '',
      },
      {
        id: 'fullscreen',
        icon: Maximize,
        label: 'Full-screen mode available',
        required: proctoring.fullscreen.enabled,
        status: 'running',
        detail: '',
      },
      {
        id: 'camera',
        icon: Camera,
        label: 'Webcam access',
        required: proctoring.webcam.enabled && proctoring.webcam.required,
        status: 'running',
        detail: '',
      },
      {
        id: 'network',
        icon: Globe,
        label: 'Stable connection to Zycus',
        required: true,
        status: 'running',
        detail: '',
      },
      {
        id: 'storage',
        icon: HardDrive,
        label: 'Local storage for autosave',
        required: true,
        status: 'running',
        detail: '',
      },
      {
        id: 'wakelock',
        icon: Sun,
        label: 'Keep screen awake',
        required: false,
        status: 'running',
        detail: '',
      },
    ];
    if (!proctoring.webcam.enabled)
      initial.splice(
        initial.findIndex((r) => r.id === 'camera'),
        1,
      );
    setRows(initial);

    const browser = detectBrowser();
    update(
      'browser',
      isSupportedBrowser(browser)
        ? { status: 'pass', detail: `${browser.label} ${browser.majorVersion ?? ''} on ${browser.platform}` }
        : {
            status: 'fail',
            detail: browser.mobile
              ? 'Phones and tablets are not supported. Use a desktop or laptop computer.'
              : `${browser.label} isn't supported. Use the latest Google Chrome or Microsoft Edge (version ${MIN_BROWSER_VERSION} or later).`,
          },
    );

    const width = window.screen.width;
    update(
      'screen',
      width >= appConfig.candidate.minScreenWidthPx
        ? { status: 'pass', detail: `${width} × ${window.screen.height}` }
        : {
            status: 'fail',
            detail: `Your screen is ${width}px wide. Use a larger screen, or reduce display scaling in your system settings.`,
          },
    );

    const extended = hasExtendedDisplay();
    update(
      'displays',
      extended === false
        ? { status: 'pass', detail: 'One display detected' }
        : extended === true
          ? {
              status: 'fail',
              detail:
                'More than one display is connected. Disconnect extra monitors (or set the display to "Show only on 1"), then run the check again.',
            }
          : { status: 'warn', detail: "Your browser couldn't confirm the number of displays." },
    );

    update(
      'fullscreen',
      document.fullscreenEnabled
        ? { status: 'pass', detail: 'Available' }
        : {
            status: 'fail',
            detail:
              'Full-screen mode is blocked in this browser. Use Chrome or Edge without kiosk or policy restrictions.',
          },
    );

    if (proctoring.webcam.enabled) {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        const label = stream.getVideoTracks()[0]?.label;
        update('camera', { status: 'pass', detail: label ? `Using ${label}` : 'Camera ready' });
      } catch (err) {
        const name = (err as Error).name;
        update('camera', {
          status: 'fail',
          detail:
            name === 'NotAllowedError'
              ? 'Camera access was blocked. Click the camera icon in the address bar, choose "Allow", then run the check again.'
              : name === 'NotFoundError'
                ? 'No camera was found. Connect a webcam and run the check again.'
                : 'Your camera is in use by another app, or unavailable. Close other video apps and try again.',
        });
      }
    }

    const api = getCandidateApi();
    const rtts: number[] = [];
    for (let i = 0; i < 3; i++) {
      const r = await api.ping();
      if (r.ok) rtts.push(r.timing.receivedAtPerf - r.timing.sentAtPerf);
    }
    const median = [...rtts].sort((a, b) => a - b)[Math.floor(rtts.length / 2)];
    update(
      'network',
      rtts.length === 3 && median !== undefined && median < 2000
        ? { status: 'pass', detail: `Response time ${Math.round(median)} ms` }
        : rtts.length > 0
          ? {
              status: 'warn',
              detail:
                'Your connection is slow or unstable. Your work is saved on this device, but a wired or stronger connection is recommended.',
            }
          : {
              status: 'fail',
              detail:
                "We couldn't reach Zycus servers. Check your connection, VPN or firewall, then run the check again.",
            },
    );

    const storageOk = await probeStorage();
    const persisted = storageOk ? await requestPersistentStorage() : false;
    update(
      'storage',
      storageOk
        ? { status: 'pass', detail: persisted ? 'Available (protected from clean-up)' : 'Available' }
        : {
            status: 'fail',
            detail:
              'This browser profile blocks local storage (for example a strict privacy mode). Use a normal Chrome or Edge window.',
          },
    );

    update(
      'wakelock',
      'wakeLock' in navigator
        ? { status: 'pass', detail: 'Your screen will stay on during the test' }
        : { status: 'warn', detail: 'Set your computer not to sleep during the assessment.' },
    );
    setRunning(false);
  }, [
    proctoring.fullscreen.enabled,
    proctoring.multiMonitor.blockStartIfExtended,
    proctoring.multiMonitor.enabled,
    proctoring.webcam.enabled,
    proctoring.webcam.required,
  ]);

  useEffect(() => {
    const t = window.setTimeout(() => void run(), 0);
    const stream = streamRef;
    return () => {
      window.clearTimeout(t);
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, [run]);

  const requiredFailed = rows.some((r) => r.required && r.status === 'fail');
  const allDone = rows.length > 0 && rows.every((r) => r.status !== 'running');
  const canContinue = allDone && !requiredFailed;

  const onContinue = () => {
    setSystemCheck({
      passed: true,
      device: describeDevice(),
      checks: Object.fromEntries(rows.map((r) => [r.id, r.status === 'running' ? 'fail' : r.status])),
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigate('/instructions');
  };

  return (
    <CandidateShell step={1} candidateName={state.candidate.fullName}>
      <h1 className="text-3xl font-light text-title">System check</h1>
      <p className="mt-2 max-w-2xl text-muted">
        We're checking that your computer is ready for a {state.template.durationMinutes}-minute proctored
        assessment. This takes a few seconds.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card padding="none">
          <ul className="divide-y divide-border" aria-live="polite">
            {rows.map((r) => (
              <li key={r.id} className="flex items-start gap-4 px-6 py-4">
                <r.icon className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-strong">
                    {r.label}
                    {!r.required && <span className="ml-2 text-xs font-normal text-muted">Recommended</span>}
                  </p>
                  {r.detail && (
                    <p className={clsx('mt-0.5 text-sm', r.status === 'fail' ? 'text-danger' : 'text-muted')}>
                      {r.detail}
                    </p>
                  )}
                </div>
                <StatusIcon status={r.status} />
              </li>
            ))}
          </ul>
        </Card>

        {proctoring.webcam.enabled && (
          <Card className="h-fit">
            <p className="mb-3 text-sm font-semibold text-strong">Camera preview</p>
            <div className="aspect-[4/3] overflow-hidden rounded-md bg-navy-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full -scale-x-100 object-cover"
              />
            </div>
            <p className="mt-3 text-sm text-muted">Make sure your face is clearly visible and well lit.</p>
          </Card>
        )}
      </div>

      {allDone && requiredFailed && (
        <Alert tone="danger" className="mt-6" title="Your computer isn't ready yet" live>
          Fix the items marked in red, then run the check again.
        </Alert>
      )}

      <div className="mt-8 flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          leadingIcon={<RotateCcw className="size-4" />}
          onClick={() => void run()}
          disabled={running}
        >
          Run checks again
        </Button>
        <Button size="lg" onClick={onContinue} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </CandidateShell>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'running') return <Spinner size={20} className="text-primary" label="Checking" />;
  if (status === 'pass') return <CircleCheck className="size-5 text-success" aria-label="Passed" />;
  if (status === 'warn') return <TriangleAlert className="size-5 text-warning" aria-label="Warning" />;
  return <CircleX className="size-5 text-danger" aria-label="Failed" />;
}
