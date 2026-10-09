import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'md' | 'lg';
  elevated?: boolean;
}

export function Card({ padding = 'md', elevated = true, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-surface',
        elevated && 'shadow-sm',
        padding === 'md' && 'p-6',
        padding === 'lg' && 'p-8',
        className,
      )}
      {...rest}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Heading level for document outline; visual size stays the same. */
  as?: 'h2' | 'h3';
  className?: string;
}

export function CardHeader({ title, description, actions, as: Heading = 'h2', className }: CardHeaderProps) {
  return (
    <div className={clsx('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <Heading className="text-lg font-semibold leading-snug">{title}</Heading>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
