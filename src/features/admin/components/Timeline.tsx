import { clsx } from 'clsx';
import { Camera, CircleAlert, Flag, Info, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Badge, EmptyState } from '@/design/components';
import type { CandidateDetail, TimelineEvent } from '../api/types';
import { describeEvent } from '../lib/events';
import { formatDateTimeShort, formatElapsed, formatTime } from '../lib/format';

const ICON = {
  violation: <CircleAlert className="size-4" aria-hidden="true" />,
  flag: <Flag className="size-4" aria-hidden="true" />,
  info: <Info className="size-4" aria-hidden="true" />,
};

const QUIET = new Set(['online', 'offline', 'context_menu', 'warning_shown', 'camera_on', 'wake_lock_lost']);

export function Timeline({
  detail,
  onShowSnapshot,
}: {
  detail: CandidateDetail;
  onShowSnapshot: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'important' | 'all'>('important');
  const startedAt = detail.session?.startedAtMs ?? null;
  const events = detail.events.filter((e) => filter === 'all' || !QUIET.has(e.type));
  if (!detail.events.length) {
    return (
      <EmptyState
        icon={<Info className="size-6" aria-hidden="true" />}
        title="Nothing recorded yet"
        description="Events appear here once the candidate starts the test."
      />
    );
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {detail.events.length} events. Times are when the server received them; “+m:ss” is time into the
          test.
        </p>
        <div
          role="radiogroup"
          aria-label="Show"
          className="flex rounded-pill border border-border p-0.5 text-sm"
        >
          {(['important', 'all'] as const).map((f) => (
            <button
              key={f}
              role="radio"
              aria-checked={filter === f}
              onClick={() => setFilter(f)}
              className={clsx(
                'cursor-pointer rounded-pill px-3 py-1',
                filter === f ? 'bg-primary-soft font-medium text-primary' : 'text-strong',
              )}
            >
              {f === 'important' ? 'Important' : 'Everything'}
            </button>
          ))}
        </div>
      </div>
      <ol className="divide-y divide-border rounded-lg border border-border">
        {events.map((e) => (
          <Row key={e.id} e={e} detail={detail} startedAt={startedAt} onShowSnapshot={onShowSnapshot} />
        ))}
      </ol>
    </div>
  );
}

function Row({
  e,
  detail,
  startedAt,
  onShowSnapshot,
}: {
  e: TimelineEvent;
  detail: CandidateDetail;
  startedAt: number | null;
  onShowSnapshot: (id: string) => void;
}) {
  const reset = e.details.reset_by_reopen !== undefined || e.details.before_reset === true;
  const tone =
    e.type === 'admin_reopen'
      ? 'text-primary'
      : e.severity === 'violation'
        ? 'text-danger'
        : e.severity === 'flag'
          ? 'text-warning'
          : 'text-muted';
  return (
    <li
      className={clsx(
        'flex items-start gap-3 px-4 py-2.5 text-sm',
        e.severity === 'violation' && e.counted && 'bg-danger-surface/40',
      )}
    >
      <span className={clsx('mt-0.5 shrink-0', tone)}>
        {e.type === 'admin_reopen' ? <RotateCcw className="size-4" aria-hidden="true" /> : ICON[e.severity]}
      </span>
      <span className="w-36 shrink-0 tabular-nums text-muted">
        <span title={formatDateTimeShort(e.receivedAtMs)}>{formatTime(e.receivedAtMs)}</span>
        {startedAt && e.receivedAtMs >= startedAt && (
          <span className="ml-1.5 text-xs">+{formatElapsed(e.receivedAtMs - startedAt)}</span>
        )}
      </span>
      <span className="min-w-0 flex-1 text-strong">{describeEvent(e, detail.questions)}</span>
      <span className="flex shrink-0 items-center gap-1.5">
        {e.severity === 'violation' && e.counted && <Badge tone="danger">Counted</Badge>}
        {reset && <Badge tone="neutral">{e.details.before_reset ? 'Before reopen' : 'Reset'}</Badge>}
        {e.snapshotId && (
          <button
            type="button"
            onClick={() => e.snapshotId && onShowSnapshot(e.snapshotId)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-pill px-2 py-0.5 text-xs text-link hover:bg-surface-sunken"
          >
            <Camera className="size-3.5" aria-hidden="true" />
            Photo
          </button>
        )}
      </span>
    </li>
  );
}
