/**
 * Proctoring configuration stored per test template (test_templates.proctoring / violation_policy)
 * and frozen into each session at start. Every measure can be toggled by a Super Admin.
 * Dependency-free apart from zod: shared by the browser app, seed builder and tests.
 */
import { z } from './zod.ts';
import { defaultProctoringConfig, defaultViolationPolicy } from './proctoringDefaults.ts';

export { defaultProctoringConfig, defaultViolationPolicy, VIOLATION_TYPES } from './proctoringDefaults.ts';

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
  /** Limited coding assistant: hints only; every question and reply is recorded for reviewers. */
  aiAssistant: toggle({
    maxRequests: z.number().int().min(1).max(50),
    cooldownSec: z.number().int().min(0).max(600),
  }),
});
export type ProctoringConfig = z.infer<typeof ProctoringConfigSchema>;

export const ViolationRuleSchema = z.object({
  /** Warnings shown for the first N occurrences of this type. */
  warnings: z.number().int().min(0).max(20),
  /**
   * true: this type has its OWN limit — occurrence N+1 submits the assessment, and it does not
   * count toward maxTotalViolations. false: only overrides the number of warnings.
   */
  autoSubmit: z.boolean(),
});
export type ViolationRule = z.infer<typeof ViolationRuleSchema>;

export const ViolationPolicySchema = z.object({
  /** Warnings shown for the first N occurrences of each type (overlay + toast). */
  warnOnOccurrences: z.number().int().min(0).max(10),
  /**
   * Shared limit: on reaching this many counted violations (of types without their own limit),
   * apply `onLimit`. 0 disables it.
   */
  maxTotalViolations: z.number().int().min(0).max(100),
  onLimit: z.enum(['auto_submit', 'flag_only']),
  /** Event types that count as violations. Others are still logged for reviewers. */
  countedTypes: z.array(z.string().regex(/^[a-z_]{1,40}$/)).max(40),
  /** Per-type overrides (see ViolationRuleSchema). */
  rules: z.record(z.string().regex(/^[a-z_]{1,40}$/), ViolationRuleSchema),
});
export type ViolationPolicy = z.infer<typeof ViolationPolicySchema>;

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

/**
 * A stored policy without `rules` (frozen before per-type limits existed) keeps behaving as it did:
 * no rules, exactly like the server, which only reads what was frozen into the session.
 */
export function resolveViolationPolicy(stored: unknown): ViolationPolicy {
  if (!stored || typeof stored !== 'object' || Object.keys(stored).length === 0) {
    return ViolationPolicySchema.parse(defaultViolationPolicy);
  }
  const s = stored as Partial<ViolationPolicy>;
  return ViolationPolicySchema.parse({ ...defaultViolationPolicy, ...s, rules: s.rules ?? {} });
}
