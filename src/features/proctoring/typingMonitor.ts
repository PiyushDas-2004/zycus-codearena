/**
 * Signals that code didn't come from the candidate's own typing (flags for reviewers, never counted):
 * - Large insertion: one edit adds many non-whitespace characters at once (paste is blocked, so this
 *   catches drag-in, extensions, IME/dictation tricks or scripts). App edits (reset, internal paste),
 *   undo/redo and formatting (whitespace) are ignored.
 * - Typing anomaly: sustained speed above the configured limit, a machine-perfect rhythm, or
 *   synthetic (untrusted) key events.
 */
import type * as Monaco from 'monaco-editor';

export const nonWhitespaceLength = (s: string) => s.replace(/\s+/g, '').length;

export type CadenceFinding =
  { kind: 'speed'; cps: number } | { kind: 'uniform_rhythm'; meanMs: number; sdMs: number };

/** Keystroke timing analysis over printable characters. */
export class CadenceAnalyzer {
  private readonly times: number[] = [];

  constructor(private readonly maxCharsPerSecond: number) {}

  push(t: number): CadenceFinding | null {
    this.times.push(t);
    if (this.times.length > 80) this.times.shift();

    // Speed: more than the limit in each of the last two seconds.
    const inLast = (ms: number) => this.times.filter((x) => t - x <= ms).length;
    const cps = inLast(1000);
    if (cps > this.maxCharsPerSecond && inLast(2000) > 2 * this.maxCharsPerSecond) {
      return { kind: 'speed', cps };
    }

    // Rhythm: 40 consecutive quick intervals with almost no variation (humans vary by tens of ms).
    if (this.times.length >= 41) {
      const recent = this.times.slice(-41);
      const gaps = recent.slice(1).map((x, i) => x - (recent[i] ?? x));
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const sd = Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length);
      if (mean < 250 && sd < 4)
        return { kind: 'uniform_rhythm', meanMs: Math.round(mean), sdMs: Math.round(sd * 10) / 10 };
    }
    return null;
  }
}

export interface TypingMonitorOptions {
  editor: Monaco.editor.IStandaloneCodeEditor;
  suspiciousInsert: { enabled: boolean; thresholdChars: number };
  typingCadence: { enabled: boolean; maxCharsPerSecond: number };
  /** True while the app itself edits a model (reset, internal paste). */
  isAppEdit: () => boolean;
  onSuspiciousInsert: (details: Record<string, unknown>) => void;
  onTypingAnomaly: (details: Record<string, unknown>) => void;
}

export function installTypingMonitor(o: TypingMonitorOptions): () => void {
  const disposers: (() => void)[] = [];

  if (o.suspiciousInsert.enabled) {
    const threshold = o.suspiciousInsert.thresholdChars;
    const sub = o.editor.onDidChangeModelContent((e) => {
      if (o.isAppEdit() || e.isUndoing || e.isRedoing || e.isFlush) return;
      for (const c of e.changes) {
        const n = nonWhitespaceLength(c.text);
        if (n >= threshold) {
          o.onSuspiciousInsert({
            where: 'editor',
            file: o.editor.getModel()?.uri.path ?? null,
            line: c.range.startLineNumber,
            chars: c.text.length,
            non_whitespace: n,
          });
          break;
        }
      }
    });
    disposers.push(() => sub.dispose());

    // Notes: a single input event that adds a large block of text.
    const lengths = new WeakMap<HTMLTextAreaElement, number>();
    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLTextAreaElement) lengths.set(e.target, e.target.value.length);
    };
    const onInput = (e: Event) => {
      const t = e.target;
      if (!(t instanceof HTMLTextAreaElement)) return;
      const before = lengths.get(t) ?? t.value.length;
      lengths.set(t, t.value.length);
      const added = t.value.length - before;
      if (added >= threshold && !o.isAppEdit()) {
        o.onSuspiciousInsert({ where: 'notes', chars: added, via: (e as InputEvent).inputType ?? null });
      }
    };
    window.addEventListener('focusin', onFocusIn, true);
    window.addEventListener('input', onInput, true);
    disposers.push(() => {
      window.removeEventListener('focusin', onFocusIn, true);
      window.removeEventListener('input', onInput, true);
    });
  }

  if (o.typingCadence.enabled) {
    const analyzer = new CadenceAnalyzer(o.typingCadence.maxCharsPerSecond);
    let reportedSynthetic = false;
    const onKey = (e: KeyboardEvent) => {
      if (!e.isTrusted) {
        if (!reportedSynthetic) o.onTypingAnomaly({ kind: 'synthetic_keys', key_length: e.key.length });
        reportedSynthetic = true;
        return;
      }
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const finding = analyzer.push(e.timeStamp);
      if (finding) o.onTypingAnomaly({ ...finding });
    };
    window.addEventListener('keydown', onKey, true);
    disposers.push(() => window.removeEventListener('keydown', onKey, true));
  }

  return () => disposers.forEach((d) => d());
}
