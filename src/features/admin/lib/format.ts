/** Labels and formatting shared by the admin pages. Times show in the viewer's time zone. */
import type { BadgeTone } from '@/design/components';
import type { CandidateRow, InvitationState, SubmitReason } from '../api/types';

export const STATE_META: Record<InvitationState, { label: string; tone: BadgeTone; hint: string }> = {
  invited: { label: 'Invited', tone: 'info', hint: 'The code works now; the candidate hasn’t used it yet.' },
  scheduled: { label: 'Scheduled', tone: 'neutral', hint: 'The code starts working later.' },
  signed_in: { label: 'Signed in', tone: 'info', hint: 'Signed in, but hasn’t started the test.' },
  in_progress: { label: 'In progress', tone: 'live', hint: 'Taking the test now.' },
  submitted: { label: 'Submitted', tone: 'success', hint: 'The test has ended.' },
  expired: { label: 'Expired', tone: 'warning', hint: 'The code’s time window has passed.' },
  revoked: { label: 'Cancelled', tone: 'neutral', hint: 'The code was cancelled.' },
};

export const STATE_ORDER: InvitationState[] = [
  'in_progress',
  'signed_in',
  'invited',
  'scheduled',
  'submitted',
  'expired',
  'revoked',
];

export const SUBMIT_REASON: Record<SubmitReason, string> = {
  candidate: 'Submitted by the candidate',
  time_up: 'Time ran out',
  violation_limit: 'Auto-submitted: proctoring limit reached',
  admin_force: 'Submitted by staff',
};

const dateTime = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
});
const dateTimeShort = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const formatDateTime = (ms: number | null | undefined) => (ms ? dateTime.format(ms) : '—');
export const formatDateTimeShort = (ms: number | null | undefined) => (ms ? dateTimeShort.format(ms) : '—');
export const formatTime = (ms: number | null | undefined) => (ms ? time.format(ms) : '—');

/** 3725 → "1 h 02 min"; 2700 → "45 min"; 40 → "40 s". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

/** "in 2 h 05 min", "5 min ago", "just now". */
export function formatRelative(ms: number, nowMs: number): string {
  const diff = Math.round((ms - nowMs) / 1000);
  if (Math.abs(diff) < 45) return 'just now';
  return diff > 0 ? `in ${formatDuration(diff)}` : `${formatDuration(-diff)} ago`;
}

export function formatUsd(n: number): string {
  return `US$${n.toFixed(n !== 0 && Math.abs(n) < 1 ? 4 : 2)}`;
}

/** Elapsed test time "1:02:03" (or "12:03"). */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

/** For <input type="datetime-local">, in the viewer's time zone. */
export function toLocalInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The value of an <input type="datetime-local"> as epoch ms, or null when empty/invalid. */
export function fromLocalInput(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** All questions' latest runs added up ("12 / 20"), or null when no tests were run. */
export function testsTotal(row: Pick<CandidateRow, 'tests'>): { passed: number; total: number } | null {
  const runs = Object.values(row.tests);
  if (!runs.length) return null;
  return runs.reduce((a, t) => ({ passed: a.passed + t.passed, total: a.total + t.total }), {
    passed: 0,
    total: 0,
  });
}

export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? '';
