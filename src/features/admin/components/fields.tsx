import { clsx } from 'clsx';
import { Check, Copy } from 'lucide-react';
import { useId, useState, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Button } from '@/design/components';
import { copyText } from '../lib/clipboard';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
}

/** A native select styled like the design system's text fields. */
export function SelectField({
  label,
  hint,
  error,
  id,
  required,
  className,
  containerClassName,
  children,
  ...rest
}: SelectFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      <label htmlFor={fieldId} className="text-sm font-medium text-strong">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={clsx(
          'block h-11 w-full cursor-pointer rounded-md border bg-surface px-3 text-[15px] text-text',
          'focus:border-primary focus:shadow-focus focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken',
          error ? 'border-danger' : 'border-border-strong',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p id={`${fieldId}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function CopyButton({
  text,
  label = 'Copy',
  copied = 'Copied',
}: {
  text: string;
  label?: string;
  copied?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      leadingIcon={
        done ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )
      }
      onClick={() =>
        void copyText(text, copied).then((ok) => {
          if (!ok) return;
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        })
      }
    >
      {done ? copied : label}
    </Button>
  );
}

/** A label/value pair in a summary grid. */
export function Fact({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('min-w-0', className)}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm text-strong">{children}</dd>
    </div>
  );
}
