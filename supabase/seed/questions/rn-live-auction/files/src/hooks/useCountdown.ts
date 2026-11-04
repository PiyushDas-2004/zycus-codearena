import { useEffect, useState } from 'react';

/** Time left until the auction closes, updated every second. */
export function useCountdown(closesAt: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, closesAt - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return { remaining, closed: remaining === 0 };
}

export function formatRemaining(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
