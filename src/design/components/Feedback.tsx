import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Spinner } from './Spinner';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={clsx('animate-pulse rounded-md bg-surface-sunken', className)} />;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center px-6 py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-tint text-primary">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Full-area loading state with an accessible status message. */
export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={clsx('flex flex-col items-center justify-center gap-3 py-16', className)}>
      <Spinner size={28} className="text-primary" label={null} />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-border-strong bg-surface px-1.5 font-mono text-xs text-strong shadow-sm">
      {children}
    </kbd>
  );
}
