import { useEffect, useState } from 'react';
import { serverClock } from '@/lib/time/serverClock';

/** Milliseconds remaining until `deadlineMs` on the server clock, refreshed twice a second. */
export function useCountdown(deadlineMs: number | null): number | null {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (deadlineMs === null) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, [deadlineMs]);
  return deadlineMs === null ? null : serverClock.remaining(deadlineMs);
}

export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const WARNING_MINUTES = [30, 10, 5, 1] as const;

/**
 * Which warning (if any) to show now. On a reload deep into the test, only the most recent crossed
 * threshold is announced; earlier ones are marked as fired silently.
 */
export function dueWarnings(
  remainingMs: number,
  fired: number[],
): { show: number | null; markFired: number[] } {
  const crossed = WARNING_MINUTES.filter((m) => remainingMs <= m * 60_000 && !fired.includes(m));
  if (crossed.length === 0) return { show: null, markFired: [] };
  return { show: Math.min(...crossed), markFired: crossed };
}
