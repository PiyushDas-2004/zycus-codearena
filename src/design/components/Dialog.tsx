import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './Button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /**
   * When false the dialog cannot be dismissed with Esc, the backdrop or a close button.
   * Used for blocking proctoring overlays that must stay until the candidate takes an action.
   */
  dismissible?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'danger';
  className?: string;
}

const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/**
 * Modal built on the native <dialog> element: the browser provides focus trapping, an inert
 * background and correct screen-reader semantics.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  size = 'md',
  tone = 'default',
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    } else if (!open && el.open) {
      if (typeof el.close === 'function') el.close();
      else el.removeAttribute('open');
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault(); // Never let the browser close it behind React's back.
      if (dismissible) onClose();
    };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [dismissible, onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClick={(e) => {
        if (dismissible && e.target === ref.current) onClose();
      }}
      className={clsx(
        'm-auto w-[calc(100%-2rem)] rounded-xl border-0 bg-surface p-0 text-text shadow-lg',
        'backdrop:bg-overlay backdrop:backdrop-blur-[2px]',
        widths[size],
        className,
      )}
    >
      {open && (
        <div className={clsx('flex flex-col', tone === 'danger' && 'border-t-4 border-danger')}>
          <div className="flex items-start gap-4 px-6 pt-6">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-xl font-semibold">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1.5 text-[15px] text-muted">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <IconButton label="Close" size="sm" icon={<X className="size-5" />} onClick={onClose} />
            )}
          </div>
          {children && <div className="px-6 pt-4">{children}</div>}
          {footer && (
            <div className="mt-6 flex justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>
          )}
          {!footer && <div className="pb-6" />}
        </div>
      )}
    </dialog>
  );
}
