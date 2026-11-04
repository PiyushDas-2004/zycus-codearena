import { clsx } from 'clsx';
import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({ label, description, error, id, className, ref, ...rest }: CheckboxProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const descId = description ? `${fieldId}-desc` : undefined;
  const errId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={clsx('flex gap-3', className)}>
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        aria-describedby={[descId, errId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-[var(--primary)] focus-visible:shadow-focus"
        {...rest}
      />
      <div className="min-w-0">
        <label htmlFor={fieldId} className="cursor-pointer text-[15px] font-medium leading-snug text-strong">
          {label}
        </label>
        {description && (
          <div id={descId} className="mt-1 text-sm text-muted">
            {description}
          </div>
        )}
        {error && (
          <p id={errId} className="mt-1 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
