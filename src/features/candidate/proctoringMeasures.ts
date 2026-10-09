import type { ProctoringConfig } from '@/shared/proctoringConfig';

/** Plain-language list of the proctoring measures that are actually enabled for this test. */
export function proctoringMeasures(p: ProctoringConfig): string[] {
  const m: string[] = [];
  if (p.fullscreen.enabled)
    m.push('The assessment runs in full-screen mode. Leaving full screen is recorded.');
  if (p.tabSwitch.enabled || p.windowBlur.enabled)
    m.push('Switching to another tab, window or app is detected and recorded with its duration.');
  if (p.paste.enabled)
    m.push('Pasting is disabled everywhere, including the editor and notes. Attempts are recorded.');
  if (p.copyProtection.enabled) m.push('Copying the questions, right-clicking and printing are disabled.');
  if (p.blockedShortcuts.enabled || p.devtoolsHeuristic.enabled)
    m.push('Developer tools and similar shortcuts are blocked and recorded.');
  if (p.multiTab.enabled) m.push('The test can be open in only one tab and on one device at a time.');
  if (p.multiMonitor.enabled) m.push('Only one display may be connected.');
  if (p.webcam.enabled) {
    m.push(
      `Your webcam stays on. A low-resolution snapshot is taken about every ${minutesLabel(p.webcam.snapshotIntervalSec)} minutes and when a rule appears to be broken.`,
    );
  }
  if (p.faceDetection.enabled)
    m.push(
      'Your browser checks that exactly one face is visible. This runs on your device; no video is recorded.',
    );
  if (p.microphone.enabled) m.push('Sustained loud noise is detected. Audio is never recorded.');
  if (p.suspiciousInsert.enabled || p.typingCadence.enabled)
    m.push('Unusually large insertions or automated typing are flagged for reviewers.');
  if (p.keystrokeReplay.enabled)
    m.push('Your edits are recorded with timing so reviewers can replay how you worked.');
  if (p.watermark.enabled) m.push('A watermark with your name and email is shown over the workspace.');
  return m;
}

/** 150 s → "2.5", 180 s → "3": one decimal only when it matters. */
export function minutesLabel(seconds: number): string {
  const m = Math.round((seconds / 60) * 10) / 10;
  return Number.isInteger(m) ? String(m) : m.toFixed(1);
}
