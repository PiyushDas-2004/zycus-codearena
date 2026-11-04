import { clsx } from 'clsx';

interface SpinnerProps {
  size?: number;
  className?: string;
  /** Accessible label; pass `null` when the spinner sits inside an element that already announces state. */
  label?: string | null;
}

export function Spinner({ size = 18, className, label = 'Loading' }: SpinnerProps) {
  return (
    <svg
      className={clsx('animate-spin', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={label ? 'img' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21.5 12A9.5 9.5 0 0 0 12 2.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
