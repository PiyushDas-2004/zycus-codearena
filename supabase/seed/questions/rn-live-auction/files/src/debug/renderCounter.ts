/**
 * Render instrumentation used by the performance tests (and by the team's in-app perf overlay).
 * Keep the trackRender() calls in place.
 */
const counts = new Map<string, number>();

export function trackRender(name: string) {
  counts.set(name, (counts.get(name) ?? 0) + 1);
}

export function renderCount(name: string): number {
  return counts.get(name) ?? 0;
}

/** Sum of all counters whose name starts with `prefix`. */
export function totalRenders(prefix: string): number {
  let total = 0;
  for (const [name, n] of counts) if (name.startsWith(prefix)) total += n;
  return total;
}

export function resetRenderCounts() {
  counts.clear();
}
