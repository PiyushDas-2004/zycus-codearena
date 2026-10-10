import { useMemo, useRef } from 'react';

export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** Drops a pending call. */
  cancel(): void;
}

/**
 * Returns a stable function that calls `fn` once calls have stopped for `delayMs`, with the
 * arguments of the last call.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): Debounced<A> {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return useMemo(() => {
    const debounced = (...args: A) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delayMs);
    };
    debounced.cancel = () => clearTimeout(timer.current);
    return debounced;
    // Kept stable on purpose: callers put it in effect dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delayMs]);
}
