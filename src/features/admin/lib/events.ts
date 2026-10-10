/** One line for each proctoring/activity event in a candidate's timeline. */
import type { SessionQuestion, TimelineEvent } from '../api/types';
import { formatDuration } from './format';

const quote = (s: unknown) => (typeof s === 'string' && s.trim() ? `“${s.trim()}”` : '');
const n = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v !== '' ? Number(v) : NaN);

export function questionLabel(questions: SessionQuestion[], id: unknown): string {
  const q = questions.find((x) => x.questionId === id);
  return q ? `Q${q.position}` : 'a question';
}

export function describeEvent(e: TimelineEvent, questions: SessionQuestion[]): string {
  const d = e.details;
  switch (e.type) {
    case 'tests_run': {
      const where = questionLabel(questions, d.question_id);
      if (d.outcome === 'compile') return `Ran the tests on ${where}: the code didn’t compile`;
      if (d.outcome === 'timeout') return `Ran the tests on ${where}: they timed out`;
      if (d.outcome === 'crash') return `Ran the tests on ${where}: the run crashed`;
      return `Ran the tests on ${where}: ${n(d.passed) || 0} of ${n(d.total) || 0} passed`;
    }
    case 'ai_assist':
      return d.status === 'failed'
        ? `Asked the coding assistant (${questionLabel(questions, d.question_id)}); it didn’t answer`
        : `Asked the coding assistant (${questionLabel(questions, d.question_id)})`;
    case 'admin_reopen': {
      const parts = [
        `Reopened by staff ${quote(d.note)}`.trim(),
        `${formatDuration(n(d.remaining_seconds) || 0)} left`,
        n(d.extra_minutes) ? `+${n(d.extra_minutes)} min extra` : '',
        d.violations_reset ? 'warnings reset' : 'warnings kept',
      ];
      return parts.filter(Boolean).join(' · ');
    }
    case 'admin_time_extension':
      return `Time extended by ${n(d.minutes)} min ${quote(d.note)}`.trim();
    case 'admin_force_submit':
      return `Submitted by staff ${quote(d.note)}`.trim();
    case 'admin_message':
      return 'Message sent to the candidate';
    case 'session_takeover':
      return `Signed in again${Number.isFinite(n(d.login_count)) ? ` (sign-in #${n(d.login_count)})` : ''}; the earlier tab was locked`;
    case 'warning_shown':
      return typeof d.type === 'string'
        ? `Warning shown for ${d.type.replace(/_/g, ' ')}${n(d.occurrence) ? ` (${n(d.occurrence)} of ${n(d.warnings) || '?'})` : ''}`
        : 'Warning shown';
    case 'proctoring_degraded':
      return `Proctoring limited: ${String(d.measure ?? 'a measure')} ${d.reason ? `(${String(d.reason)})` : ''}`.trim();
    case 'page_resume':
      return 'The test page was reloaded or reopened';
    default: {
      const extra: string[] = [];
      if (e.durationMs) extra.push(`for ${formatDuration(e.durationMs / 1000)}`);
      if (typeof d.chars === 'number') extra.push(`${d.chars} characters`);
      return [e.label, ...extra].join(' ');
    }
  }
}

/** Counted violations by type, labelled, most frequent first. */
export function violationSummary(counts: Record<string, number>, events: TimelineEvent[]) {
  const labels = new Map(events.map((e) => [e.type, e.label]));
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, label: labels.get(type) ?? type.replace(/_/g, ' '), count }));
}
