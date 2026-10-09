import { Maximize2 } from 'lucide-react';
import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 959px)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * The editor needs room. Below 960 px wide (e.g. the window was shrunk), cover the workspace with a
 * clear instruction instead of a squashed layout. Not a proctoring event; the timer keeps running.
 */
export function WindowTooSmall() {
  const tooSmall = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches);
  if (!tooSmall) return null;
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="window-small-title"
      className="fixed inset-0 z-[65] flex items-center justify-center bg-surface-app px-6"
    >
      <div className="max-w-sm text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-tint text-primary">
          <Maximize2 className="size-6" aria-hidden="true" />
        </span>
        <h2 id="window-small-title" className="mt-4 text-lg font-semibold">
          Make the window larger
        </h2>
        <p className="mt-2 text-sm text-muted">
          The assessment needs a window at least 960 px wide. Maximise your browser window or return to full
          screen. Your work is saved and your timer is still running.
        </p>
      </div>
    </div>
  );
}
