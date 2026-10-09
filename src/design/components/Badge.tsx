import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'live';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-strong',
  info: 'bg-primary-soft text-primary',
  success: 'bg-success-surface text-success',
  warning: 'bg-warning-surface text-warning',
  danger: 'bg-danger-surface text-danger',
  live: 'bg-success-surface text-success',
};

const dots: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-dot',
  info: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning-fill',
  danger: 'bg-danger',
  live: 'bg-live animate-pulse',
};

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', dot, icon, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {dot && <span className={clsx('size-1.5 rounded-full', dots[tone])} aria-hidden="true" />}
      {icon}
      {children}
    </span>
  );
}
