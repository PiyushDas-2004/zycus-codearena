import { clsx } from 'clsx';
import { Camera, Users, UserX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Dialog, EmptyState, Skeleton } from '@/design/components';
import { useAdminApi } from '../adminSession';
import type { CandidateDetail, SnapshotMeta } from '../api/types';
import { formatElapsed, formatTime } from '../lib/format';

/** Snapshot images, fetched one by one as they come into view (≈20 KB each), and kept. */
const cache = new Map<string, string>();

function useSnapshot(id: string, visible: boolean): string | null | 'error' {
  const api = useAdminApi();
  const [src, setSrc] = useState<string | null | 'error'>(() => cache.get(id) ?? null);
  useEffect(() => {
    if (!visible || cache.has(id)) return;
    let live = true;
    void api.snapshotImage(id).then((r) => {
      if (!live) return;
      if (r.ok && r.jpegB64) {
        const url = `data:image/jpeg;base64,${r.jpegB64}`;
        cache.set(id, url);
        setSrc(url);
      } else setSrc('error');
    });
    return () => {
      live = false;
    };
  }, [api, id, visible]);
  return cache.get(id) ?? src;
}

function Thumb({
  s,
  startedAt,
  onOpen,
  highlight,
}: {
  s: SnapshotMeta;
  startedAt: number | null;
  onOpen: () => void;
  highlight: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setVisible(true), {
      rootMargin: '200px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const src = useSnapshot(s.id, visible);
  const warn = s.faceCount === 0 || (s.faceCount ?? 1) > 1;
  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={clsx(
        'group cursor-pointer overflow-hidden rounded-md border bg-surface text-left focus-visible:shadow-focus',
        highlight ? 'border-primary ring-2 ring-primary' : warn ? 'border-danger-border' : 'border-border',
      )}
    >
      <div className="aspect-[4/3] bg-surface-sunken">
        {src && src !== 'error' ? (
          <img src={src} alt={`Webcam at ${formatTime(s.capturedAtMs)}`} className="size-full object-cover" />
        ) : src === 'error' ? (
          <div className="flex size-full items-center justify-center text-xs text-muted">Not available</div>
        ) : (
          <Skeleton className="size-full rounded-none" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
        <span className="tabular-nums text-strong">
          {formatTime(s.capturedAtMs)}
          {startedAt && <span className="ml-1 text-muted">+{formatElapsed(s.capturedAtMs - startedAt)}</span>}
        </span>
        <span className={clsx('inline-flex items-center gap-1', warn ? 'text-danger' : 'text-muted')}>
          {s.faceCount === 0 ? (
            <UserX className="size-3.5" aria-hidden="true" />
          ) : (s.faceCount ?? 1) > 1 ? (
            <Users className="size-3.5" aria-hidden="true" />
          ) : null}
          {s.reason === 'violation'
            ? 'violation'
            : s.faceCount === null
              ? ''
              : `${s.faceCount} face${s.faceCount === 1 ? '' : 's'}`}
        </span>
      </div>
    </button>
  );
}

export function Snapshots({ detail, focusId }: { detail: CandidateDetail; focusId: string | null }) {
  // Opened from the timeline's “Photo” link: show that snapshot at once.
  const [open, setOpen] = useState<SnapshotMeta | null>(
    () => detail.snapshots.find((x) => x.id === focusId) ?? null,
  );
  const startedAt = detail.session?.startedAtMs ?? null;
  const [filter, setFilter] = useState<'all' | 'issues'>('all');
  const shown = detail.snapshots.filter(
    (s) => filter === 'all' || s.reason === 'violation' || s.faceCount === 0 || (s.faceCount ?? 1) > 1,
  );

  if (!detail.snapshots.length) {
    return (
      <EmptyState
        icon={<Camera className="size-6" aria-hidden="true" />}
        title="No webcam snapshots"
        description="Snapshots are taken during the test (periodically and at each violation)."
      />
    );
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {detail.snapshots.length} snapshots. Red borders: no face or more than one face.
        </p>
        <label className="flex items-center gap-2 text-sm text-strong">
          <input
            type="checkbox"
            className="size-4 cursor-pointer accent-[var(--primary)]"
            checked={filter === 'issues'}
            onChange={(e) => setFilter(e.target.checked ? 'issues' : 'all')}
          />
          Only issues
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shown.map((s) => (
          <Thumb
            key={s.id}
            s={s}
            startedAt={startedAt}
            onOpen={() => setOpen(s)}
            highlight={s.id === focusId}
          />
        ))}
      </div>
      {open && <SnapshotDialog s={open} startedAt={startedAt} onClose={() => setOpen(null)} />}
    </div>
  );
}

function SnapshotDialog({
  s,
  startedAt,
  onClose,
}: {
  s: SnapshotMeta;
  startedAt: number | null;
  onClose: () => void;
}) {
  const src = useSnapshot(s.id, true);
  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={`Webcam at ${formatTime(s.capturedAtMs)}${startedAt ? ` (+${formatElapsed(s.capturedAtMs - startedAt)})` : ''}`}
      description={`${s.reason === 'violation' ? 'Taken at a violation' : 'Periodic snapshot'} · ${s.faceCount === null ? 'face count unknown' : `${s.faceCount} face${s.faceCount === 1 ? '' : 's'} detected`}`}
    >
      <div className="overflow-hidden rounded-md bg-surface-sunken">
        {src && src !== 'error' ? (
          <img src={src} alt="Webcam snapshot" className="w-full" />
        ) : (
          <Skeleton className="aspect-[4/3] w-full" />
        )}
      </div>
    </Dialog>
  );
}
