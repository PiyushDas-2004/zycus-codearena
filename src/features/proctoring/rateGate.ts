/**
 * Lets an event through at most once per `windowMs` for each key. Repeats inside the window are
 * counted and reported with the next event that passes, so reviewers still see how often it
 * happened without the log (or the network) being flooded.
 */
export class RateGate {
  private readonly last = new Map<string, { at: number; suppressed: number }>();

  constructor(
    private readonly windowMs: number,
    private readonly now: () => number = () => performance.now(),
  ) {}

  /** null when suppressed; otherwise how many repeats were suppressed since the last pass. */
  pass(key: string): number | null {
    const t = this.now();
    const entry = this.last.get(key);
    if (entry && t - entry.at < this.windowMs) {
      entry.suppressed++;
      return null;
    }
    this.last.set(key, { at: t, suppressed: 0 });
    return entry?.suppressed ?? 0;
  }
}
