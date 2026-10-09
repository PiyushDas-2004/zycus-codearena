/**
 * Heuristic, deterrent only (reported as a flag, never counted): docked developer tools shrink the
 * page viewport while the browser window keeps its size. Page zoom also changes the viewport, but
 * it changes devicePixelRatio too, so the baseline is reset whenever the window size or zoom
 * changes. Undocked DevTools can't be detected this way — nothing reliable can.
 */
export interface ViewportSample {
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  dpr: number;
}

export const sampleViewport = (): ViewportSample => ({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  outerWidth: window.outerWidth,
  outerHeight: window.outerHeight,
  dpr: window.devicePixelRatio,
});

/** Shrink of the viewport relative to the baseline, or null if the window or zoom changed. */
export function viewportShrink(base: ViewportSample, now: ViewportSample): { dw: number; dh: number } | null {
  const sameWindow =
    Math.abs(base.outerWidth - now.outerWidth) <= 2 &&
    Math.abs(base.outerHeight - now.outerHeight) <= 2 &&
    Math.abs(base.dpr - now.dpr) < 0.01;
  if (!sameWindow) return null;
  return { dw: base.innerWidth - now.innerWidth, dh: base.innerHeight - now.innerHeight };
}

export function installDevtoolsHeuristic(o: {
  onSuspected: (details: { dw: number; dh: number }) => void;
  intervalMs?: number;
  sample?: () => ViewportSample;
}): () => void {
  const sample = o.sample ?? sampleViewport;
  let base = sample();
  let flagged = false;
  const id = window.setInterval(() => {
    const now = sample();
    const shrink = viewportShrink(base, now);
    if (!shrink) {
      base = now;
      flagged = false;
      return;
    }
    const suspected = shrink.dw > 160 || shrink.dh > 160;
    if (suspected && !flagged) o.onSuspected(shrink);
    flagged = suspected;
  }, o.intervalMs ?? 2000);
  return () => window.clearInterval(id);
}
