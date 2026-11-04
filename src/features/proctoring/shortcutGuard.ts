/**
 * Cancels browser shortcuts that would leave, inspect, print or reload the test. Editor shortcuts
 * (Ctrl+H replace, Ctrl+D, Ctrl+L, Ctrl+Shift+K …) are deliberately left alone. Tab/window
 * shortcuts (Ctrl+W/T/N/Tab, Alt+Tab, the Windows key) only reach the page while the Keyboard Lock
 * API is active in full screen; elsewhere the browser handles them first and the tab/blur detectors
 * catch the result. Print Screen cannot be cancelled; it is reported.
 */
interface Rule {
  label: string;
  match: (e: KeyboardEvent, mod: boolean) => boolean;
}

const k = (e: KeyboardEvent) => e.key.toLowerCase();
// On macOS Cmd is the Meta key and is part of every shortcut; only the Windows key is blocked.
const isMac = () => typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

const RULES: Rule[] = [
  { label: 'F12', match: (e) => e.key === 'F12' },
  { label: 'Ctrl+Shift+I', match: (e, mod) => mod && e.shiftKey && k(e) === 'i' },
  { label: 'Ctrl+Shift+J', match: (e, mod) => mod && e.shiftKey && k(e) === 'j' },
  { label: 'Ctrl+Shift+C', match: (e, mod) => mod && e.shiftKey && k(e) === 'c' },
  { label: 'Ctrl+U', match: (e, mod) => mod && !e.shiftKey && k(e) === 'u' },
  { label: 'Ctrl+P', match: (e, mod) => mod && !e.shiftKey && k(e) === 'p' },
  { label: 'Ctrl+O', match: (e, mod) => mod && !e.shiftKey && k(e) === 'o' },
  { label: 'Ctrl+J', match: (e, mod) => mod && !e.shiftKey && k(e) === 'j' },
  { label: 'Ctrl+Shift+B', match: (e, mod) => mod && e.shiftKey && k(e) === 'b' },
  { label: 'Ctrl+Shift+Delete', match: (e, mod) => mod && e.shiftKey && e.key === 'Delete' },
  { label: 'Reload', match: (e, mod) => e.key === 'F5' || (mod && k(e) === 'r') },
  { label: 'F11', match: (e) => e.key === 'F11' },
  { label: 'Alt+Arrow', match: (e) => e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') },
  { label: 'Browser navigation', match: (e) => e.key === 'BrowserBack' || e.key === 'BrowserForward' },
  { label: 'Ctrl+W', match: (e, mod) => mod && k(e) === 'w' },
  { label: 'Ctrl+T', match: (e, mod) => mod && k(e) === 't' },
  { label: 'Ctrl+N', match: (e, mod) => mod && k(e) === 'n' },
  { label: 'Ctrl+Tab', match: (e, mod) => mod && e.key === 'Tab' },
  { label: 'Alt+Tab', match: (e) => e.altKey && e.key === 'Tab' },
  { label: 'Windows key', match: (e) => (e.key === 'Meta' || e.key === 'OS') && !isMac() },
];

/** The rule a key press breaks, or null. Ctrl means Ctrl on Windows/Linux and Cmd on macOS. */
export function blockedShortcut(e: KeyboardEvent): string | null {
  const mod = e.ctrlKey || e.metaKey;
  return RULES.find((r) => r.match(e, mod))?.label ?? null;
}

export interface ShortcutGuardOptions {
  onBlocked: (combo: string) => void;
  onPrintScreen: () => void;
}

export function installShortcutGuard(o: ShortcutGuardOptions): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    const combo = blockedShortcut(e);
    if (!combo) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!e.repeat) o.onBlocked(combo);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'PrintScreen') o.onPrintScreen();
  };
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  return () => {
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
  };
}
