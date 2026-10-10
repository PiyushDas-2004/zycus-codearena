import { useEffect, useRef } from 'react';

/** Calls `fn` every `ms` while the page is visible (and once when it becomes visible again). */
export function usePolling(fn: () => void | Promise<void>, ms: number) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      if (document.visibilityState === 'visible') void ref.current();
    };
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(tick, ms);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        tick();
        start();
      }
    };
    start();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ms]);
}
