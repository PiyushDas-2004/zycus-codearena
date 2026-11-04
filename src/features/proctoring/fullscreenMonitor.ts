/**
 * Full-screen enforcement. Leaving full screen is a violation and pauses the assessment behind an
 * overlay until the candidate returns (requestFullscreen needs a click, so the overlay has a button).
 * After a reload the page is never in full screen; that shows the overlay without a violation.
 *
 * Keyboard Lock (Chrome/Edge, full screen only) delivers Esc, Alt+Tab, the Windows key and tab
 * shortcuts to the page so they can be cancelled; leaving full screen then needs Esc held down.
 */
import { enterFullscreen, isFullscreen } from '@/lib/device/fullscreen';

interface KeyboardLockApi {
  lock?: (keys?: string[]) => Promise<void>;
  unlock?: () => void;
}
const keyboard = () => (navigator as Navigator & { keyboard?: KeyboardLockApi }).keyboard;

/** Locks the keyboard while in full screen. Resolves false where unsupported or refused. */
export async function lockKeyboard(): Promise<boolean> {
  const kb = keyboard();
  if (!kb?.lock || !isFullscreen()) return false;
  try {
    await kb.lock();
    return true;
  } catch {
    return false;
  }
}

export function unlockKeyboard() {
  try {
    keyboard()?.unlock?.();
  } catch {
    /* ignore */
  }
}

export interface FullscreenMonitorOptions {
  keyboardLock: boolean;
  onExit: () => void;
  onChange: (fullscreen: boolean) => void;
  onKeyboardLockUnavailable: () => void;
}

export function installFullscreenMonitor(o: FullscreenMonitorOptions): {
  dispose: () => void;
  /** Call from a click handler. */
  requestReturn: () => Promise<boolean>;
} {
  let reportedLockIssue = false;
  const applyLock = async () => {
    if (!o.keyboardLock) return;
    if (!(await lockKeyboard()) && !reportedLockIssue) {
      reportedLockIssue = true;
      o.onKeyboardLockUnavailable();
    }
  };
  const onChange = () => {
    const fs = isFullscreen();
    o.onChange(fs);
    if (fs) void applyLock();
    else o.onExit();
  };
  document.addEventListener('fullscreenchange', onChange);
  o.onChange(isFullscreen());
  if (isFullscreen()) void applyLock();

  return {
    dispose: () => {
      document.removeEventListener('fullscreenchange', onChange);
      unlockKeyboard();
    },
    requestReturn: () => enterFullscreen(),
  };
}
