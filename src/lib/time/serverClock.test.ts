import { describe, expect, it } from 'vitest';
import { ServerClock } from './serverClock';

function fakePerf(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe('ServerClock', () => {
  it('estimates server time from the round-trip midpoint and advances monotonically', () => {
    const perf = fakePerf(1000);
    const clock = new ServerClock(perf.now);
    // Request sent at perf 1000, server says 50_000 when handling it, response at perf 1200 (rtt 200).
    perf.advance(200);
    clock.sample(50_000, 1000, 1200);
    expect(clock.now()).toBe(50_100); // server time + rtt/2 at the moment of receipt
    perf.advance(60_000);
    expect(clock.now()).toBe(110_100);
  });

  it('ignores the system clock entirely', () => {
    const perf = fakePerf(0);
    const clock = new ServerClock(perf.now);
    clock.sample(1_000_000, 0, 0);
    const realDateNow = Date.now;
    Date.now = () => 9_999_999_999_999; // candidate changes their Windows clock
    try {
      expect(clock.now()).toBe(1_000_000);
    } finally {
      Date.now = realDateNow;
    }
  });

  it('prefers low-latency samples over slow ones', () => {
    const perf = fakePerf(0);
    const clock = new ServerClock(perf.now);
    perf.advance(100);
    clock.sample(10_000, 0, 100); // rtt 100 → estimate 10_050 at perf 100
    perf.advance(5_000);
    // A slow sample (rtt 3000) whose midpoint estimate is 400ms off is rejected.
    clock.sample(15_400, 2_100, 5_100);
    expect(clock.now()).toBe(10_050 + 5_000);
  });

  it('accepts any sample after invalidate() (e.g. waking from sleep)', () => {
    const perf = fakePerf(0);
    const clock = new ServerClock(perf.now);
    clock.sample(10_000, 0, 100);
    perf.advance(1_000);
    clock.invalidate();
    clock.sample(500_000, 1_000, 4_100); // slow, but accepted because history was cleared
    perf.advance(3_100); // now at the moment the response arrived
    expect(clock.now()).toBe(500_000 + 1_550);
  });

  it('reports remaining time without going negative', () => {
    const perf = fakePerf(0);
    const clock = new ServerClock(perf.now);
    clock.sample(1_000, 0, 0);
    expect(clock.remaining(61_000)).toBe(60_000);
    perf.advance(120_000);
    expect(clock.remaining(61_000)).toBe(0);
  });
});
