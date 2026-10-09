/**
 * Proctoring configuration stored per test template (test_templates.proctoring / violation_policy)
 * and frozen into each session at start. Every measure can be toggled by a Super Admin.
 * Dependency-free apart from zod: shared by the browser app, seed builder and tests.
 */
import { z } from 'zod';

const toggle = <T extends z.ZodRawShape>(shape: T) => z.object({ enabled: z.boolean(), ...shape });

export const ProctoringConfigSchema = z.object({
  fullscreen: toggle({}),
  keyboardLock: toggle({}),
  tabSwitch: toggle({}),
  windowBlur: toggle({ graceMs: z.number().int().min(0).max(10_000) }),
  paste: toggle({ allowInternalClipboard: z.boolean() }),
  dragDrop: toggle({}),
  suspiciousInsert: toggle({ thresholdChars: z.number().int().min(10).max(5000) }),
  typingCadence: toggle({ maxCharsPerSecond: z.number().int().min(5).max(200) }),
  copyProtection: toggle({}),
  blockedShortcuts: toggle({}),
  devtoolsHeuristic: toggle({}),
  multiTab: toggle({}),
  multiMonitor: toggle({ blockStartIfExtended: z.boolean(), pollMs: z.number().int().min(1000).max(60_000) }),
  webcam: toggle({
    required: z.boolean(),
    snapshotIntervalSec: z.number().int().min(60).max(600),
    snapshotOnViolation: z.boolean(),
  }),
  faceDetection: toggle({
    intervalMs: z.number().int().min(500).max(10_000),
    noFaceSeconds: z.number().int().min(3).max(120),
    multiFaceConsecutive: z.number().int().min(1).max(10),
  }),
  microphone: toggle({ loudDbfs: z.number().min(-60).max(0), sustainSec: z.number().min(1).max(30) }),
  watermark: toggle({ opacity: z.number().min(0.02).max(0.3) }),
  keystrokeReplay: toggle({}),
});
export type ProctoringConfig = z.infer<typeof ProctoringConfigSchema>;

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

export const ViolationPolicySchema = z.object({
  /** Warnings shown for the first N occurrences of each type (overlay + toast). */
  warnOnOccurrences: z.number().int().min(0).max(10),
  /** On reaching this many counted violations in total, apply `onLimit`. 0 disables the limit. */
  maxTotalViolations: z.number().int().min(0).max(100),
  onLimit: z.enum(['auto_submit', 'flag_only']),
  /** Event types that count toward the total. Others are still logged for reviewers. */
  countedTypes: z.array(z.string().regex(/^[a-z_]{1,40}$/)).max(40),
});
export type ViolationPolicy = z.infer<typeof ViolationPolicySchema>;

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
};

export const defaultViolationPolicy: ViolationPolicy = {
  warnOnOccurrences: 2,
  maxTotalViolations: 5,
  onLimit: 'auto_submit',
  countedTypes: [...VIOLATION_TYPES],
};

/** Deep-merges a stored (possibly partial or older) config over the defaults. */
export function resolveProctoringConfig(stored: unknown): ProctoringConfig {
  const base = structuredClone(defaultProctoringConfig) as Record<string, Record<string, unknown>>;
  if (stored && typeof stored === 'object') {
    for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
      if (key in base && value && typeof value === 'object') Object.assign(base[key] as object, value);
    }
  }
  return ProctoringConfigSchema.parse(base);
}

export function resolveViolationPolicy(stored: unknown): ViolationPolicy {
  return ViolationPolicySchema.parse({ ...defaultViolationPolicy, ...(stored as object | null) });
}
