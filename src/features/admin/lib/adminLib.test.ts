/** The admin portal's pure helpers: formatting, the invitation email, timeline lines, errors. */
import { describe, expect, it, vi } from 'vitest';
import { parseEnv } from '@/config/env';
import type { AdminApi, SessionQuestion, TimelineEvent } from '../api/types';
import { adminErrorMessage, withSessionGuard } from './errors';
import { describeEvent, violationSummary } from './events';
import {
  firstName,
  formatDuration,
  formatElapsed,
  formatRelative,
  formatUsd,
  fromLocalInput,
  testsTotal,
  toLocalInput,
} from './format';
import { invitationEmail, mailtoLink, outlookWebLink } from './invitationMessage';

describe('format', () => {
  it('formats durations, relative times and elapsed test time', () => {
    expect(formatDuration(40)).toBe('40 s');
    expect(formatDuration(2700)).toBe('45 min');
    expect(formatDuration(3725)).toBe('1 h 02 min');
    expect(formatDuration(-5)).toBe('0 s');
    expect(formatRelative(1_000_000 + 2 * 3_600_000, 1_000_000)).toBe('in 2 h 00 min');
    expect(formatRelative(1_000_000 - 300_000, 1_000_000)).toBe('5 min ago');
    expect(formatRelative(1_000_010, 1_000_000)).toBe('just now');
    expect(formatElapsed(65_000)).toBe('1:05');
    expect(formatElapsed(3_723_000)).toBe('1:02:03');
  });

  it('formats money and names', () => {
    expect(formatUsd(5)).toBe('US$5.00');
    expect(formatUsd(0)).toBe('US$0.00');
    expect(formatUsd(0.0123)).toBe('US$0.0123');
    expect(firstName('  Asha   Verma ')).toBe('Asha');
    expect(firstName('')).toBe('');
  });

  it('round-trips the datetime-local inputs and rejects junk', () => {
    const ms = new Date(2026, 9, 11, 14, 5).getTime();
    expect(toLocalInput(ms)).toBe('2026-10-11T14:05');
    expect(fromLocalInput(toLocalInput(ms))).toBe(ms);
    expect(fromLocalInput('')).toBeNull();
    expect(fromLocalInput('tomorrow')).toBeNull();
  });

  it('adds up the latest test runs of every question', () => {
    expect(testsTotal({ tests: {} })).toBeNull();
    expect(testsTotal({ tests: { a: { passed: 3, total: 4 }, b: { passed: 0, total: 6 } } })).toEqual({
      passed: 3,
      total: 10,
    });
  });
});

describe('invitation email', () => {
  const details = {
    candidateName: 'Asha Verma',
    email: 'asha@example.com',
    accessCode: 'RSAV-4DRE-CCEX',
    assessmentName: 'Lead React Native Developer – Hands-On',
    durationMinutes: 150,
    validFromMs: Date.now() - 60_000,
    validUntilMs: Date.now() + 3 * 86_400_000,
    link: 'https://codearena.zycus.com/',
    senderName: 'Piyush',
  };

  it('has everything the candidate needs, addressed by first name', () => {
    const { subject, body } = invitationEmail(details);
    expect(subject).toBe('Your Zycus coding assessment: Lead React Native Developer – Hands-On');
    for (const part of [
      'Hi Asha,',
      'https://codearena.zycus.com/',
      'asha@example.com',
      'RSAV-4DRE-CCEX',
      '150 minutes',
      'Piyush',
    ])
      expect(body).toContain(part);
    expect(body).toMatch(/Please start before/);
  });

  it('says when a code opens later', () => {
    const later = invitationEmail({ ...details, validFromMs: Date.now() + 86_400_000 });
    expect(later.body).toMatch(/You can start between/);
  });

  it('builds mail links that keep line breaks and special characters', () => {
    const link = mailtoLink('a+b@example.com', 'Hi & bye', 'Line 1\nLine 2 ₹');
    expect(link.startsWith('mailto:a%2Bb%40example.com?subject=Hi%20%26%20bye&body=')).toBe(true);
    expect(link).toContain('Line%201%0D%0ALine%202%20%E2%82%B9');
    const web = new URL(outlookWebLink('a@example.com', 'S', 'B\nC'));
    expect(web.origin).toBe('https://outlook.office.com');
    expect(web.searchParams.get('to')).toBe('a@example.com');
    expect(web.searchParams.get('body')).toBe('B\nC');
  });
});

describe('timeline lines', () => {
  const questions = [{ questionId: 'q2', position: 2 }] as SessionQuestion[];
  const ev = (
    type: string,
    details: Record<string, unknown> = {},
    over: Partial<TimelineEvent> = {},
  ): TimelineEvent => ({
    id: 1,
    type,
    label: type === 'tab_switch' ? 'Tab switch' : type,
    severity: 'info',
    counted: false,
    receivedAtMs: 0,
    clientElapsedMs: null,
    durationMs: null,
    details,
    snapshotId: null,
    ...over,
  });

  it('describes test runs, the assistant and staff actions', () => {
    expect(describeEvent(ev('tests_run', { question_id: 'q2', passed: 5, total: 9 }), questions)).toBe(
      'Ran the tests on Q2: 5 of 9 passed',
    );
    expect(describeEvent(ev('tests_run', { question_id: 'q2', outcome: 'compile' }), questions)).toMatch(
      /didn’t compile/,
    );
    expect(describeEvent(ev('ai_assist', { question_id: 'zz' }), questions)).toBe(
      'Asked the coding assistant (a question)',
    );
    expect(
      describeEvent(
        ev('admin_reopen', {
          note: 'Popup',
          remaining_seconds: 5400,
          extra_minutes: 10,
          violations_reset: true,
        }),
        questions,
      ),
    ).toBe('Reopened by staff “Popup” · 1 h 30 min left · +10 min extra · warnings reset');
    expect(describeEvent(ev('admin_time_extension', { minutes: 15, note: '' }), questions)).toBe(
      'Time extended by 15 min',
    );
    expect(describeEvent(ev('session_takeover', { login_count: 3 }), questions)).toMatch(/sign-in #3/);
    expect(describeEvent(ev('tab_switch', {}, { durationMs: 4000 }), questions)).toBe('Tab switch for 4 s');
  });

  it('summarises counted violations, most frequent first', () => {
    const events = [ev('tab_switch'), ev('no_face', {}, { label: 'No face' })];
    expect(violationSummary({ no_face: 1, tab_switch: 3, window_blur: 0 }, events)).toEqual([
      { type: 'tab_switch', label: 'Tab switch', count: 3 },
      { type: 'no_face', label: 'No face', count: 1 },
    ]);
  });
});

describe('errors', () => {
  it('explains every failure in plain words, preferring the server’s explanation', () => {
    expect(adminErrorMessage({ error: 'NETWORK' })).toMatch(/connection/);
    expect(adminErrorMessage({ error: 'NO_TIME_LEFT', message: 'Add extra minutes.' })).toBe(
      'Add extra minutes.',
    );
    expect(adminErrorMessage({ error: 'UNKNOWN' })).toMatch(/Something went wrong/);
    for (const code of [
      'NOT_STAFF',
      'FORBIDDEN',
      'NOT_FOUND',
      'DUPLICATE_ACTIVE',
      'ALREADY_STARTED',
      'SIGNED_OUT',
    ] as const)
      expect(adminErrorMessage({ error: code }).length).toBeGreaterThan(10);
  });

  it('notices a session that ended, once per call, and not for other errors', async () => {
    const onSignedOut = vi.fn();
    const api = withSessionGuard(
      {
        overview: async () => ({ ok: false, error: 'SIGNED_OUT' }),
        listStaff: async () => ({ ok: false, error: 'FORBIDDEN' }),
        restore: async () => ({ ok: false, error: 'NOT_STAFF' }),
        kind: 'fake',
      } as unknown as AdminApi,
      onSignedOut,
    );
    await api.listStaff();
    await api.restore(); // sign-in checks report it themselves
    expect(onSignedOut).not.toHaveBeenCalled();
    await api.overview();
    expect(onSignedOut).toHaveBeenCalledOnce();
    expect(api.kind).toBe('fake');
  });
});

describe('build settings', () => {
  const env = (url: string) => ({ VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: 'k' });
  it('accepts the local stack only in development builds', () => {
    expect(parseEnv(env('http://127.0.0.1:54321'), true).ok).toBe(true);
    expect(parseEnv(env('http://127.0.0.1:54321'), false).ok).toBe(false);
    expect(parseEnv(env('https://abc123.supabase.co'), false).ok).toBe(true);
    expect(parseEnv(env('http://evil.example.com:54321'), true).ok).toBe(false);
  });
});
