/**
 * Server-anchored clock. The candidate's system clock is never trusted: we estimate the server's
 * time from round-trip samples (NTP-style midpoint) and then advance it with performance.now(),
 * which is monotonic and unaffected by changes to the Windows/macOS clock.
 *
 * After a sleep/wake or tab hide, call invalidate() so the next sample is always accepted.
 */
export class ServerClock {
  /** Estimated server epoch-ms at performance.now() === 0. */
  private base: number | null = null;
  private bestRtt = Number.POSITIVE_INFINITY;
  private lastAcceptedAt = Number.NEGATIVE_INFINITY;

  constructor(private readonly perf: () => number = () => performance.now()) {}

  /** Feed a sample: the server's `now` and when the request left / the response arrived (perf time). */
  sample(serverNowMs: number, sentAtPerf: number, receivedAtPerf: number): void {
    if (!Number.isFinite(serverNowMs)) return;
    const rtt = Math.max(0, receivedAtPerf - sentAtPerf);
    const stale = receivedAtPerf - this.lastAcceptedAt > 60_000;
    // Prefer low-latency samples (their midpoint estimate is tighter), but always refresh periodically.
    if (this.base === null || stale || rtt <= this.bestRtt * 1.5 + 25) {
      this.base = serverNowMs + rtt / 2 - receivedAtPerf;
      this.bestRtt = stale ? rtt : Math.min(this.bestRtt, rtt);
      this.lastAcceptedAt = receivedAtPerf;
    }
  }

  /** Forget quality history (e.g. after the laptop slept); the next sample is accepted unconditionally. */
  invalidate(): void {
    this.bestRtt = Number.POSITIVE_INFINITY;
    this.lastAcceptedAt = Number.NEGATIVE_INFINITY;
  }

  /**
   * After a reload with no network, seed the clock from the last known server-vs-device offset so the
   * countdown continues. The next real sample replaces it.
   */
  seedFromOffset(serverMinusDeviceMs: number): void {
    if (this.base !== null || !Number.isFinite(serverMinusDeviceMs)) return;
    this.base = Date.now() + serverMinusDeviceMs - this.perf();
    this.lastAcceptedAt = Number.NEGATIVE_INFINITY;
  }

  /** Current estimate of (server time − device time), for persisting across reloads. */
  offsetFromDevice(): number | null {
    return this.base === null ? null : this.now() - Date.now();
  }

  get synced(): boolean {
    return this.base !== null;
  }

  /** Current server time estimate in epoch ms (falls back to Date.now() until the first sample). */
  now(): number {
    return this.base === null ? Date.now() : this.base + this.perf();
  }

  /** Milliseconds left until `deadlineMs` on the server clock (never negative). */
  remaining(deadlineMs: number): number {
    return Math.max(0, deadlineMs - this.now());
  }
}

export const serverClock = new ServerClock();
