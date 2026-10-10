import { useEffect, useState } from 'react';

/** Time left until the auction closes, updated every second. */
export function useCountdown(closesAt: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, closesAt - Date.now()));

  useEffect(() => {
    // FIX: derive the remaining time from the wall clock on every tick (counting ticks drifts:
    // timers pause or are throttled in the background) and restart when closesAt changes
    // (the empty deps array kept the closing time from the first render, ignoring extensions).
    const update = () => setRemaining(Math.max(0, closesAt - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [closesAt]);

  return { remaining, closed: remaining === 0 };
}

export function formatRemaining(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
