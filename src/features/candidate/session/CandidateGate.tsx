import { MonitorX } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { AppFooter, Button, Card, LoadingState, ProductLockup, SpectrumBar } from '@/design/components';
import type { SessionState } from '@/lib/api';
import {
  candidateErrorMessage,
  refreshSessionState,
  routeForState,
  useCandidateSession,
} from './candidateSession';

interface CandidateGateProps {
  /** The route this gate protects. */
  route: '/check' | '/instructions' | '/test' | '/submitted';
  children: (state: SessionState) => ReactNode;
}

/**
 * Ensures there is a valid candidate session for this screen, resuming it from the stored token
 * after a reload, and redirects to the right step if the candidate is somewhere they shouldn't be.
 */
export function CandidateGate({ route, children }: CandidateGateProps) {
  const { token, state, fatal, systemCheck } = useCandidateSession();
  const [loadError, setLoadError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (!token || state || fatal) return;
    let cancelled = false;
    void refreshSessionState().then((r) => {
      if (!cancelled && !r.ok && r.error !== 'SESSION_SUPERSEDED' && r.error !== 'INVALID_SESSION') {
        setLoadError(candidateErrorMessage(r.error));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token, state, fatal]);

  if (fatal === 'SESSION_SUPERSEDED') return <SessionEndedScreen superseded />;
  if (!token || fatal === 'INVALID_SESSION') return <Navigate to="/" replace />;
  if (!state) {
    return loadError ? (
      <CenteredMessage title="We couldn't load your assessment" body={loadError} retry />
    ) : (
      <LoadingState label="Loading your assessment…" className="min-h-dvh" />
    );
  }

  const target = routeForState(state, !!systemCheck?.passed);
  // The system check may be revisited while pending; everything else must match the state.
  const allowed = route === target || (route === '/check' && state.status === 'pending');
  if (!allowed && location.pathname !== target) return <Navigate to={target} replace />;
  return <>{children(state)}</>;
}

function CenteredMessage({ title, body, retry }: { title: string; body: string; retry?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SpectrumBar />
      <header className="border-b border-border bg-surface px-8 py-4">
        <ProductLockup />
      </header>
      <main className="flex flex-1 items-center justify-center px-6">
        <Card padding="lg" className="max-w-md text-center">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-2 text-muted">{body}</p>
          {retry && (
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Try again
            </Button>
          )}
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}

/** Shown when another sign-in replaced this tab's session. Nothing here can be used any more. */
export function SessionEndedScreen({ superseded }: { superseded?: boolean }) {
  const clear = useCandidateSession((s) => s.clear);
  return (
    <div className="flex min-h-dvh flex-col bg-surface-app">
      <SpectrumBar />
      <main className="flex flex-1 items-center justify-center px-6">
        <Card padding="lg" className="max-w-lg text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger-surface text-danger">
            <MonitorX className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold">
            {superseded ? 'Your assessment was opened somewhere else' : 'Your session has ended'}
          </h1>
          <p className="mt-2 text-muted">
            {superseded
              ? 'Someone signed in with your access code in another window or on another device, so this window has been locked. This has been recorded. Your work up to that point is saved.'
              : 'Sign in again with your email and access code.'}
          </p>
          <p className="mt-2 text-sm text-muted">
            If this wasn't you, contact the Zycus Talent Acquisition team straight away.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => {
              clear();
              window.location.assign('/');
            }}
          >
            Go to sign-in
          </Button>
        </Card>
      </main>
    </div>
  );
}
