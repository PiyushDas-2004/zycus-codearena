import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-pill border-2 font-medium ' +
  'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55';

const variants: Record<ButtonVariant, string> = {
  // Filled brand pill.
  primary:
    'border-primary bg-primary text-on-primary enabled:hover:border-primary-hover enabled:hover:bg-primary-hover',
  // zycus.com's signature CTA: 2px outlined pill in the accent blue.
  secondary: 'border-primary bg-surface text-primary enabled:hover:bg-primary-soft',
  ghost: 'border-transparent bg-transparent text-strong enabled:hover:bg-surface-sunken',
  danger: 'border-danger-fill bg-danger-fill text-white enabled:hover:brightness-95',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-4 text-sm',
  md: 'h-10 px-5 text-[15px]',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth,
  disabled,
  className,
  children,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading ? <Spinner size={16} label={null} /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Required: icon-only buttons must be labelled for screen readers. */
  label: string;
  icon: ReactNode;
  size?: 'sm' | 'md';
  tone?: 'default' | 'inverse';
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  label,
  icon,
  size = 'md',
  tone = 'default',
  className,
  type = 'button',
  ref,
  ...rest
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'size-8' : 'size-10',
        tone === 'inverse'
          ? 'text-inverse enabled:hover:bg-navy-700'
          : 'text-muted enabled:hover:bg-surface-sunken enabled:hover:text-strong',
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
