import { describe, expect, it } from 'vitest';
import { dueWarnings, formatRemaining } from './useCountdown';

describe('countdown helpers', () => {
  it('formats hours, minutes and seconds', () => {
    expect(formatRemaining(150 * 60_000)).toBe('2:30:00');
    expect(formatRemaining(59 * 60_000 + 5_000)).toBe('59:05');
    expect(formatRemaining(400)).toBe('00:01');
    expect(formatRemaining(0)).toBe('00:00');
  });

  it('fires each warning once as thresholds are crossed', () => {
    expect(dueWarnings(31 * 60_000, [])).toEqual({ show: null, markFired: [] });
    expect(dueWarnings(29 * 60_000, [])).toEqual({ show: 30, markFired: [30] });
    expect(dueWarnings(29 * 60_000, [30])).toEqual({ show: null, markFired: [] });
    expect(dueWarnings(9.5 * 60_000, [30])).toEqual({ show: 10, markFired: [10] });
  });

  it('after a late reload announces only the latest threshold', () => {
    expect(dueWarnings(4 * 60_000, [])).toEqual({ show: 5, markFired: [30, 10, 5] });
  });
});
