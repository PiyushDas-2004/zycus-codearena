import { clsx } from 'clsx';
import { CircleCheck, Info, OctagonAlert, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const styles: Record<AlertTone, { box: string; icon: ReactNode }> = {
  info: {
    box: 'border-info-border bg-surface-tint text-strong',
    icon: <Info className="size-5 text-primary" aria-hidden="true" />,
  },
  success: {
    box: 'border-success/25 bg-success-surface text-strong',
    icon: <CircleCheck className="size-5 text-success" aria-hidden="true" />,
  },
  warning: {
    box: 'border-warning-fill/50 bg-warning-surface text-strong',
    icon: <TriangleAlert className="size-5 text-warning" aria-hidden="true" />,
  },
  danger: {
    box: 'border-danger-border bg-danger-surface text-strong',
    icon: <OctagonAlert className="size-5 text-danger" aria-hidden="true" />,
  },
};

interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** Announce to assistive tech immediately (use for errors that appear after an action). */
  live?: boolean;
  className?: string;
}

export function Alert({ tone = 'info', title, children, action, live, className }: AlertProps) {
  const s = styles[tone];
  return (
    <div
      role={live ? (tone === 'danger' || tone === 'warning' ? 'alert' : 'status') : undefined}
      className={clsx('flex gap-3 rounded-md border px-4 py-3 text-sm', s.box, className)}
    >
      <span className="mt-0.5 shrink-0">{s.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={clsx(title && 'mt-0.5', 'text-text')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
