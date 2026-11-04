import { clsx } from 'clsx';
import { CloudCheck, CloudOff, CloudUpload, ShieldCheck, Timer } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { BrandLogo, Button, Spinner } from '@/design/components';
import type { SessionState } from '@/lib/api/types';
import { serverClock } from '@/lib/time/serverClock';
import { formatRemaining } from '../useCountdown';
import { useWorkspaceUi } from '../workspaceStore';

interface HeaderProps {
  state: SessionState;
  /** The countdown (its own component, so only it re-renders every second). */
  timer: ReactNode;
  onSubmit: () => void;
  /** Webcam self-view (when the template uses the camera). */
  camera?: ReactNode;
}

export function WorkspaceHeader({ state, timer, onSubmit, camera }: HeaderProps) {
  const locked = useWorkspaceUi((s) => s.locked);
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 lg:gap-4 lg:px-4">
      <BrandLogo height={24} />
      <span className="hidden h-6 w-px bg-border-strong sm:block" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-strong">{state.template.name}</p>
        <p className="truncate text-xs text-muted">{state.candidate.fullName}</p>
      </div>
      <span className="hidden items-center gap-1.5 rounded-pill bg-success-surface px-2.5 py-1 text-xs font-medium text-success xl:inline-flex">
        <ShieldCheck className="size-3.5" aria-hidden="true" /> Proctored
      </span>
      {camera}
      <SaveIndicator />
      {timer}
      <Button size="sm" onClick={onSubmit} disabled={locked}>
        Submit
      </Button>
    </header>
  );
}

function SaveIndicator() {
  const status = useWorkspaceUi((s) => s.saveStatus);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 5_000);
    return () => window.clearInterval(id);
  }, []);

  let icon = <CloudCheck className="size-4 text-success" aria-hidden="true" />;
  let text = 'All changes saved';
  if (status.phase === 'saving') {
    icon = <Spinner size={14} className="text-primary" label={null} />;
    text = 'Saving…';
  } else if (status.phase === 'pending') {
    icon = <CloudUpload className="size-4 text-muted" aria-hidden="true" />;
    text = 'Saved on this device';
  } else if (status.phase === 'offline') {
    icon = <CloudOff className="size-4 text-warning" aria-hidden="true" />;
    text = 'Offline · saved on this device';
  }
  const ago =
    status.phase === 'idle' && status.lastServerSaveAt !== null
      ? ` · ${humanAgo(serverClock.now() - status.lastServerSaveAt)}`
      : '';
  return (
    <p
      className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted"
      role="status"
      aria-live="polite"
      title={`${text}${ago}`}
    >
      {icon}
      <span className={clsx('hidden lg:inline', status.phase === 'offline' && 'font-medium text-warning')}>
        {text}
        {ago}
      </span>
    </p>
  );
}

function humanAgo(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return `${m} min ago`;
}

export function Countdown({ remainingMs }: { remainingMs: number | null }) {
  if (remainingMs === null) return null;
  const minutes = remainingMs / 60_000;
  const tone = minutes <= 5 ? 'danger' : minutes <= 10 ? 'warning' : 'normal';
  return (
    <div
      role="timer"
      aria-label={`Time remaining ${formatRemaining(remainingMs)}`}
      className={clsx(
        'tabular flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[15px] font-semibold',
        tone === 'normal' && 'bg-surface-sunken text-strong',
        tone === 'warning' && 'bg-warning-surface text-warning',
        tone === 'danger' && 'bg-danger-surface text-danger',
        minutes <= 1 && 'animate-pulse',
      )}
    >
      <Timer className="size-4" aria-hidden="true" />
      {formatRemaining(remainingMs)}
    </div>
  );
}
