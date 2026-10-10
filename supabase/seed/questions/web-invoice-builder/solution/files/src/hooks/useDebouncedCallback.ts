import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** Drops a pending call. */
  cancel(): void;
}

/**
 * Returns a stable function that calls `fn` once calls have stopped for `delayMs`, with the
 * arguments of the last call.
 *
 * The debounced function is stable, so it must not close over `fn`: it calls the latest `fn`
 * through a ref (the old version kept the first render's `fn`, and so saved the first render's
 * draft). A pending call is dropped on unmount.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): Debounced<A> {
  const latest = useRef(fn);
  useLayoutEffect(() => {
    latest.current = fn;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const debounced = useMemo(() => {
    const call = (...args: A) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = undefined;
        latest.current(...args);
      }, delayMs);
    };
    call.cancel = () => {
      clearTimeout(timer.current);
      timer.current = undefined;
    };
    return call;
  }, [delayMs]);

  useEffect(() => debounced.cancel, [debounced]);
  return debounced;
}
