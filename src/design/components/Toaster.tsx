import { clsx } from 'clsx';
import { CircleCheck, Info, OctagonAlert, TriangleAlert, X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useToastStore, type Toast, type ToastTone } from './toastStore';

const icons: Record<ToastTone, ReactNode> = {
  info: <Info className="size-5 text-primary" aria-hidden="true" />,
  success: <CircleCheck className="size-5 text-success" aria-hidden="true" />,
  warning: <TriangleAlert className="size-5 text-warning" aria-hidden="true" />,
  danger: <OctagonAlert className="size-5 text-danger" aria-hidden="true" />,
};

const accents: Record<ToastTone, string> = {
  info: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning-fill',
  danger: 'border-l-danger',
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    if (!toast.durationMs) return;
    const t = window.setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(t);
  }, [toast, dismiss]);

  return (
    <li
      className={clsx(
        'pointer-events-auto flex w-[22rem] gap-3 rounded-md border border-l-4 border-border bg-surface px-4 py-3 shadow-lg',
        accents[toast.tone],
      )}
    >
      <span className="mt-0.5 shrink-0">{icons[toast.tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-strong">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="-m-1 size-7 shrink-0 rounded-sm p-1 text-muted hover:bg-surface-sunken hover:text-strong"
        aria-label="Dismiss notification"
      >
        <X className="size-5" />
      </button>
    </li>
  );
}

/** Mount once near the app root. Polite region for normal toasts, assertive for danger. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const polite = toasts.filter((t) => t.tone !== 'danger');
  const urgent = toasts.filter((t) => t.tone === 'danger');
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      <ol aria-live="assertive" aria-label="Urgent notifications" className="flex flex-col gap-3">
        {urgent.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </ol>
      <ol aria-live="polite" aria-label="Notifications" className="flex flex-col gap-3">
        {polite.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </ol>
    </div>
  );
}
