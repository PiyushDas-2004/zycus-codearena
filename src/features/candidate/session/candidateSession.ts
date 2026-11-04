/**
 * Candidate session: the opaque token (localStorage, so a refresh resumes) and the latest
 * server-authoritative session state.
 */
import { create } from 'zustand';
import { getCandidateApi, type CandidateErrorCode, type SessionState } from '@/lib/api';
import { serverClock } from '@/lib/time/serverClock';

const TOKEN_KEY = 'codearena.candidate.token';
const STATE_KEY = 'codearena.candidate.state';
const OFFSET_KEY = 'codearena.clock.offset';

export interface SystemCheckResult {
  passed: boolean;
  device: Record<string, unknown>;
  checks: Record<string, 'pass' | 'fail' | 'warn'>;
}

interface CandidateSessionStore {
  token: string | null;
  state: SessionState | null;
  /** Set when this tab can no longer use the session (opened elsewhere / invalid). */
  fatal: 'SESSION_SUPERSEDED' | 'INVALID_SESSION' | null;
  systemCheck: SystemCheckResult | null;
  setSession: (token: string, state: SessionState) => void;
  setState: (state: SessionState) => void;
  setFatal: (code: 'SESSION_SUPERSEDED' | 'INVALID_SESSION') => void;
  setSystemCheck: (r: SystemCheckResult) => void;
  clear: () => void;
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Last server state + clock offset, used only when a reload happens while offline. */
function writeCachedState(state: SessionState | null) {
  try {
    if (state) localStorage.setItem(STATE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STATE_KEY);
    const offset = serverClock.offsetFromDevice();
    if (offset !== null) localStorage.setItem(OFFSET_KEY, String(Math.round(offset)));
  } catch {
    /* ignore */
  }
}

function readCachedState(): SessionState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as SessionState) : null;
  } catch {
    return null;
  }
}

function readCachedOffset(): number | null {
  try {
    const raw = localStorage.getItem(OFFSET_KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: the session still works for this page load */
  }
}

export const useCandidateSession = create<CandidateSessionStore>((set) => ({
  token: readToken(),
  state: null,
  fatal: null,
  systemCheck: null,
  setSession: (token, state) => {
    writeToken(token);
    writeCachedState(state);
    set({ token, state, fatal: null });
  },
  setState: (state) => {
    writeCachedState(state);
    set({ state });
  },
  setFatal: (fatal) => set({ fatal }),
  setSystemCheck: (systemCheck) => set({ systemCheck }),
  clear: () => {
    writeToken(null);
    writeCachedState(null);
    set({ token: null, state: null, fatal: null, systemCheck: null });
  },
}));

/** Refreshes the session state from the server and feeds the clock. */
export async function refreshSessionState(): Promise<
  { ok: true; state: SessionState } | { ok: false; error: CandidateErrorCode }
> {
  const { token, setState, setFatal } = useCandidateSession.getState();
  if (!token) return { ok: false, error: 'INVALID_SESSION' };
  const res = await getCandidateApi().getState(token);
  if (res.ok) {
    serverClock.sample(res.state.serverNowMs, res.timing.sentAtPerf, res.timing.receivedAtPerf);
    setState(res.state);
    return { ok: true, state: res.state };
  }
  if (res.error === 'SESSION_SUPERSEDED' || res.error === 'INVALID_SESSION') setFatal(res.error);
  // Offline reload during a test: continue from the last known state; the server stays authoritative.
  if (res.error === 'NETWORK') {
    const cached = readCachedState();
    if (cached && cached.status === 'in_progress') {
      const offset = readCachedOffset();
      if (offset !== null) serverClock.seedFromOffset(offset);
      setState(cached);
      return { ok: true, state: cached };
    }
  }
  return { ok: false, error: res.error };
}

/** Where a candidate in this state belongs. */
export function routeForState(state: SessionState | null, systemCheckPassed: boolean): string {
  if (!state) return '/';
  if (state.status === 'submitted') return '/submitted';
  if (state.status === 'in_progress') return '/test';
  if (!systemCheckPassed) return '/check';
  return '/instructions';
}

/** User-facing text for every error a candidate can see. */
export function candidateErrorMessage(
  code: CandidateErrorCode,
  extra?: { retryAfterSeconds?: number; opensAtMs?: number },
): string {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return "That email and access code don't match an invitation. Check both and try again.";
    case 'RATE_LIMITED':
      return `Too many attempts. Wait ${Math.ceil((extra?.retryAfterSeconds ?? 900) / 60)} minutes, then try again.`;
    case 'REVOKED':
      return 'This access code has been withdrawn. Contact the Zycus Talent Acquisition team for a new one.';
    case 'ALREADY_SUBMITTED':
      return 'This assessment has already been submitted. Each access code can be used once.';
    case 'NOT_YET_OPEN':
      return `Your assessment window opens ${
        extra?.opensAtMs ? `at ${new Date(extra.opensAtMs).toLocaleString()}` : 'later'
      }. Sign in again then.`;
    case 'EXPIRED':
      return 'The time window for this access code has ended. Contact the Zycus Talent Acquisition team.';
    case 'CAPACITY':
      return 'Another assessment is in progress right now. Please wait a few minutes and try again, or contact the Talent Acquisition team.';
    case 'TEMPLATE_INACTIVE':
    case 'NO_QUESTIONS':
      return "This assessment isn't available right now. Contact the Zycus Talent Acquisition team.";
    case 'SESSION_SUPERSEDED':
      return 'This assessment was opened in another window or on another device.';
    case 'INVALID_SESSION':
      return 'Your sign-in has ended. Sign in again with your email and access code.';
    case 'CONSENT_REQUIRED':
      return 'Please accept the notice and confidentiality terms to continue.';
    case 'NETWORK':
      return "We couldn't reach Zycus servers. Check your internet connection and try again.";
    default:
      return 'Something went wrong. Try again in a moment.';
  }
}
