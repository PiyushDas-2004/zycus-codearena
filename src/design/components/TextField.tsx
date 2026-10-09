import { clsx } from 'clsx';
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from 'react';

const control =
  'block w-full rounded-md border bg-surface px-3 text-[15px] text-text placeholder:text-muted/80 ' +
  'transition-[border-color,box-shadow] duration-150 focus:border-primary focus:shadow-focus focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-surface-sunken';

interface FieldChromeProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldChrome({ id, label, hint, error, required, children, className }: FieldChromeProps) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-strong">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error: unknown, hint: unknown) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  hint,
  error,
  id,
  required,
  className,
  containerClassName,
  ref,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldChrome
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={clsx(control, 'h-11', error ? 'border-danger' : 'border-border-strong', className)}
        {...rest}
      />
    </FieldChrome>
  );
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function TextArea({
  label,
  hint,
  error,
  id,
  required,
  className,
  containerClassName,
  rows = 4,
  ref,
  ...rest
}: TextAreaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldChrome
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={clsx(
          control,
          'resize-y py-2.5 leading-relaxed',
          error ? 'border-danger' : 'border-border-strong',
          className,
        )}
        {...rest}
      />
    </FieldChrome>
  );
}
