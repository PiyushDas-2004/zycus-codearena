/**
 * Extended (multi-monitor) desktops via `screen.isExtended` (Window Management API; no permission
 * needed). Checked on the screen `change` event and by polling, because not every OS fires it.
 */
import { hasExtendedDisplay } from '@/lib/device/environment';

export interface DisplayMonitorOptions {
  pollMs: number;
  onChange: (extended: boolean) => void;
  onUnsupported: () => void;
}

export function installDisplayMonitor(o: DisplayMonitorOptions): () => void {
  if (hasExtendedDisplay() === null) {
    o.onUnsupported();
    return () => undefined;
  }
  let last = false;
  const check = () => {
    const extended = hasExtendedDisplay() === true;
    if (extended !== last) {
      last = extended;
      o.onChange(extended);
    }
  };
  check();
  const scr = window.screen as Screen & EventTarget;
  scr.addEventListener?.('change', check);
  const id = window.setInterval(check, o.pollMs);
  return () => {
    window.clearInterval(id);
    scr.removeEventListener?.('change', check);
  };
}
