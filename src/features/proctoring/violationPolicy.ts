/**
 * What the candidate sees when a rule is broken, mirroring the server's violation policy (the server
 * counts independently and is authoritative; this only decides warnings and the local auto-submit).
 */
import type { ViolationPolicy } from '@/shared/proctoringConfig';

export interface ViolationCopy {
  title: string;
  body: string;
}

export const VIOLATION_COPY: Record<string, ViolationCopy> = {
  tab_switch: {
    title: 'You left the assessment tab',
    body: 'Switching to another tab or app is not allowed during the assessment.',
  },
  window_blur: {
    title: 'The assessment window lost focus',
    body: "Keep the assessment window active. Don't click outside it or switch to another app.",
  },
  fullscreen_exit: {
    title: 'You left full-screen mode',
    body: 'The assessment must stay in full screen until you submit.',
  },
  second_tab: {
    title: 'The assessment was opened in another tab',
    body: 'Use only one tab or window for the assessment.',
  },
  multi_monitor: {
    title: 'A second display was detected',
    body: 'Only one display may be connected. Disconnect or mirror the extra display.',
  },
  camera_off: {
    title: 'Your camera turned off',
    body: 'Your webcam must stay on and uncovered for the whole assessment.',
  },
  no_face: {
    title: "We couldn't see your face",
    body: 'Stay in front of the camera with your face clearly visible and well lit.',
  },
  multiple_faces: {
    title: 'More than one person was visible',
    body: 'You must take the assessment alone, with nobody else in view of the camera.',
  },
};

export const copyFor = (type: string): ViolationCopy =>
  VIOLATION_COPY[type] ?? { title: 'Proctoring rule broken', body: 'This has been recorded for review.' };

export const isCounted = (policy: ViolationPolicy, type: string) => policy.countedTypes.includes(type);

export type ViolationOutcome =
  | { kind: 'auto_submit'; total: number }
  | { kind: 'warn'; occurrence: number; total: number }
  | { kind: 'notice'; occurrence: number; total: number };

/**
 * `occurrence` is how many times this type has now happened (on this device); `total` is the best
 * known count of all counted violations (max of the server's count and the local count).
 */
export function decideOutcome(policy: ViolationPolicy, occurrence: number, total: number): ViolationOutcome {
  if (
    policy.onLimit === 'auto_submit' &&
    policy.maxTotalViolations > 0 &&
    total >= policy.maxTotalViolations
  ) {
    return { kind: 'auto_submit', total };
  }
  if (occurrence <= policy.warnOnOccurrences) return { kind: 'warn', occurrence, total };
  return { kind: 'notice', occurrence, total };
}

/** "2 of 5 violations recorded. At 5 your assessment is submitted automatically." */
export function limitLine(policy: ViolationPolicy, total: number): string {
  if (policy.onLimit !== 'auto_submit' || policy.maxTotalViolations <= 0) {
    return 'This has been recorded and will be reviewed by the interview panel.';
  }
  const left = policy.maxTotalViolations - total;
  return `${total} of ${policy.maxTotalViolations} violations recorded. ${
    left === 1
      ? 'One more and your assessment is submitted automatically.'
      : `At ${policy.maxTotalViolations} your assessment is submitted automatically.`
  }`;
}
