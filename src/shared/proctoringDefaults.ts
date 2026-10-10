/**
 * Default proctoring settings, as plain data with no schema library, so modules that only need the
 * defaults (e.g. the in-browser mock backend) don't pull zod into the sign-in page.
 * The schemas and the resolve functions are in proctoringConfig.ts.
 */
import type { ProctoringConfig, ViolationPolicy } from './proctoringConfig.ts';

export const VIOLATION_TYPES = [
  'tab_switch',
  'window_blur',
  'fullscreen_exit',
  'second_tab',
  'session_takeover',
  'multi_monitor',
  'camera_off',
  'no_face',
  'multiple_faces',
] as const;

/** Defaults approved in Phase 0 (decision Q4). */
export const defaultProctoringConfig: ProctoringConfig = {
  fullscreen: { enabled: true },
  keyboardLock: { enabled: true },
  tabSwitch: { enabled: true },
  windowBlur: { enabled: true, graceMs: 1500 },
  paste: { enabled: true, allowInternalClipboard: false },
  dragDrop: { enabled: true },
  suspiciousInsert: { enabled: true, thresholdChars: 60 },
  typingCadence: { enabled: true, maxCharsPerSecond: 25 },
  copyProtection: { enabled: true },
  blockedShortcuts: { enabled: true },
  devtoolsHeuristic: { enabled: true },
  multiTab: { enabled: true },
  multiMonitor: { enabled: true, blockStartIfExtended: true, pollMs: 5000 },
  webcam: { enabled: true, required: true, snapshotIntervalSec: 150, snapshotOnViolation: true },
  faceDetection: { enabled: true, intervalMs: 2000, noFaceSeconds: 10, multiFaceConsecutive: 2 },
  microphone: { enabled: false, loudDbfs: -20, sustainSec: 3 },
  watermark: { enabled: true, opacity: 0.06 },
  keystrokeReplay: { enabled: true },
  aiAssistant: { enabled: true, maxRequests: 10, cooldownSec: 20 },
};

export const defaultViolationPolicy: ViolationPolicy = {
  warnOnOccurrences: 2,
  maxTotalViolations: 5,
  onLimit: 'auto_submit',
  countedTypes: [...VIOLATION_TYPES],
  rules: {
    fullscreen_exit: { warnings: 3, autoSubmit: true },
    multiple_faces: { warnings: 5, autoSubmit: true },
  },
};
