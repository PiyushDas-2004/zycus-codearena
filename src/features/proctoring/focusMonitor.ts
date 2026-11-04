/**
 * Tab and window switching.
 * - Tab switch: the page became hidden (another tab, minimised, another app in front of the
 *   full-screen window). Reported at once — the candidate sees the warning when they come back.
 * - Window blur: the page is visible but lost focus (clicked another window or monitor, an
 *   overlay app). Reported only if focus doesn't return within the grace period, and never while
 *   the app itself expects a focus change (a permission prompt, entering full screen).
 */
export interface FocusMonitorOptions {
  tabSwitch: boolean;
  windowBlur: boolean;
  graceMs: number;
  onTabSwitch: () => void;
  /** Hidden-period length when the page becomes visible again. */
  onTabReturn?: (hiddenMs: number) => void;
  onWindowBlur: () => void;
  suppressed: () => boolean;
  now?: () => number;
}

export function installFocusMonitor(o: FocusMonitorOptions): () => void {
  const now = o.now ?? (() => performance.now());
  let hiddenAt: number | null = null;
  let blurTimer: ReturnType<typeof setTimeout> | null = null;

  const clearBlur = () => {
    if (blurTimer !== null) clearTimeout(blurTimer);
    blurTimer = null;
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      clearBlur(); // hidden supersedes blur
      if (hiddenAt === null) {
        hiddenAt = now();
        if (o.tabSwitch && !o.suppressed()) o.onTabSwitch();
      }
    } else if (hiddenAt !== null) {
      o.onTabReturn?.(now() - hiddenAt);
      hiddenAt = null;
    }
  };

  const onBlur = () => {
    if (!o.windowBlur || document.visibilityState === 'hidden') return;
    clearBlur();
    blurTimer = setTimeout(() => {
      blurTimer = null;
      if (document.visibilityState === 'visible' && !document.hasFocus() && !o.suppressed()) o.onWindowBlur();
    }, o.graceMs);
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', clearBlur);
  return () => {
    clearBlur();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', clearBlur);
  };
}
