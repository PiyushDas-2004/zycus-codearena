/**
 * What the candidate sees when a rule is broken, mirroring the server's violation policy (the server
 * counts independently and is authoritative; this only decides warnings and the local auto-submit).
 *
 * Two kinds of limit (see ViolationPolicySchema):
 * - Own limit (rules[type].autoSubmit): `warnings` warnings, then the next occurrence submits.
 * - Shared limit: every other counted type warns for its first `warnOnOccurrences`, and the
 *   assessment is submitted when their combined count reaches `maxTotalViolations`.
 */
import type { ViolationPolicy } from '@/shared/proctoringConfig';

export interface ViolationCopy {
  /** Short name for lists ("Leaving full screen"). */
  label: string;
  title: string;
  body: string;
}

export const VIOLATION_COPY: Record<string, ViolationCopy> = {
  tab_switch: {
    label: 'Switching tabs or apps',
    title: 'You left the assessment tab',
    body: 'Switching to another tab or app is not allowed during the assessment.',
  },
  window_blur: {
    label: 'Clicking outside the assessment window',
    title: 'The assessment window lost focus',
    body: "Keep the assessment window active. Don't click outside it or switch to another app.",
  },
  fullscreen_exit: {
    label: 'Leaving full screen',
    title: 'You left full-screen mode',
    body: 'The assessment must stay in full screen until you submit.',
  },
  second_tab: {
    label: 'Opening the assessment in a second tab',
    title: 'The assessment was opened in another tab',
    body: 'Use only one tab or window for the assessment.',
  },
  session_takeover: {
    label: 'Signing in again elsewhere',
    title: 'You signed in again',
    body: 'The assessment may be open in only one place at a time.',
  },
  multi_monitor: {
    label: 'Connecting a second display',
    title: 'A second display was detected',
    body: 'Only one display may be connected. Disconnect or mirror the extra display.',
  },
  camera_off: {
    label: 'Turning the camera off',
    title: 'Your camera turned off',
    body: 'Your webcam must stay on and uncovered for the whole assessment.',
  },
  no_face: {
    label: 'Not being visible on camera',
    title: "We couldn't see your face",
    body: 'Stay in front of the camera with your face clearly visible and well lit.',
  },
  multiple_faces: {
    label: 'Another person visible on camera',
    title: 'Another person was visible on camera',
    body: 'You must take the assessment alone, with nobody else in view of the camera.',
  },
};

export const copyFor = (type: string): ViolationCopy =>
  VIOLATION_COPY[type] ?? {
    label: type.replaceAll('_', ' '),
    title: 'Proctoring rule broken',
    body: 'This has been recorded for review.',
  };

export const isCounted = (policy: ViolationPolicy, type: string) => policy.countedTypes.includes(type);

/** True when the type has its own limit (and so stays out of the shared one). */
export const hasOwnLimit = (policy: ViolationPolicy, type: string) => policy.rules[type]?.autoSubmit === true;

/** Number of warnings for a type before its limit (own) or before notices start (shared). */
export const warningsFor = (policy: ViolationPolicy, type: string) =>
  policy.rules[type]?.warnings ?? policy.warnOnOccurrences;

/** Combined count of the counted types that share `maxTotalViolations`. */
export function sharedCount(policy: ViolationPolicy, counts: Record<string, number>): number {
  return policy.countedTypes
    .filter((t) => !hasOwnLimit(policy, t))
    .reduce((sum, t) => sum + (counts[t] ?? 0), 0);
}

export type ViolationOutcome =
  { kind: 'auto_submit' } | { kind: 'warn'; occurrence: number; warnings: number } | { kind: 'notice' };

/**
 * `occurrence`: how many times this type has now happened (including this one).
 * `shared`: the shared-limit count including this one (ignored for own-limit types).
 */
export function decideOutcome(
  policy: ViolationPolicy,
  type: string,
  occurrence: number,
  shared: number,
): ViolationOutcome {
  const warnings = warningsFor(policy, type);
  if (hasOwnLimit(policy, type)) {
    return occurrence > warnings ? { kind: 'auto_submit' } : { kind: 'warn', occurrence, warnings };
  }
  if (
    policy.onLimit === 'auto_submit' &&
    policy.maxTotalViolations > 0 &&
    shared >= policy.maxTotalViolations
  ) {
    return { kind: 'auto_submit' };
  }
  return occurrence <= warnings ? { kind: 'warn', occurrence, warnings } : { kind: 'notice' };
}

/** What happens next, shown under a warning or in a notice. */
export function consequenceLine(
  policy: ViolationPolicy,
  type: string,
  occurrence: number,
  shared: number,
): string {
  if (hasOwnLimit(policy, type)) {
    const left = warningsFor(policy, type) - occurrence;
    if (left <= 0)
      return 'This was your last warning. If it happens again, your assessment is submitted automatically.';
    return `${left} more warning${left === 1 ? '' : 's'} for this, then the next time your assessment is submitted automatically.`;
  }
  const max = policy.maxTotalViolations;
  if (policy.onLimit !== 'auto_submit' || max <= 0) {
    return 'This has been recorded and will be reviewed by the interview panel.';
  }
  return `${shared} of ${max} violations recorded. ${
    max - shared === 1
      ? 'One more and your assessment is submitted automatically.'
      : `At ${max} your assessment is submitted automatically.`
  }`;
}

/** Plain-language summary of the policy for the instructions page. */
export function policyLines(policy: ViolationPolicy): string[] {
  const lines: string[] = [];
  for (const type of policy.countedTypes) {
    if (!hasOwnLimit(policy, type)) continue;
    const n = warningsFor(policy, type);
    lines.push(
      `${copyFor(type).label}: ${n === 0 ? 'no warning' : `${n} warning${n === 1 ? '' : 's'}`}, then the next time your assessment is submitted automatically.`,
    );
  }
  const shared = policy.countedTypes.filter((t) => !hasOwnLimit(policy, t));
  if (shared.length) {
    const what = shared.map((t) => copyFor(t).label.toLowerCase()).join(', ');
    const warn = policy.warnOnOccurrences;
    const warnText =
      warn > 0
        ? `the first ${warn === 1 ? 'time' : `${warn} times`} each happens you'll see a warning`
        : 'there are no warnings';
    lines.push(
      policy.onLimit === 'auto_submit' && policy.maxTotalViolations > 0
        ? `Other rule breaks (${what}): ${warnText}; after ${policy.maxTotalViolations} in total your assessment is submitted automatically.`
        : `Other rule breaks (${what}): ${warnText}; every event is shared with the interview panel.`,
    );
  }
  return lines;
}
