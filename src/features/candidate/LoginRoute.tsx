import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getCandidateApi } from '@/lib/api';
import { describeDevice } from '@/lib/device/environment';
import { serverClock } from '@/lib/time/serverClock';
import { LoginPage, type LoginFormValues } from './LoginPage';
import {
  candidateErrorMessage,
  refreshSessionState,
  routeForState,
  useCandidateSession,
} from './session/candidateSession';

export default function LoginRoute() {
  const navigate = useNavigate();
  const { token, setSession, systemCheck } = useCandidateSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // A stored token means a reload or a returning tab: resume where the candidate left off.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void refreshSessionState().then((r) => {
      if (!cancelled && r.ok) navigate(routeForState(r.state, !!systemCheck?.passed), { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [token, navigate, systemCheck]);

  const onSubmit = async ({ email, accessCode }: LoginFormValues) => {
    setBusy(true);
    setError(null);
    const res = await getCandidateApi().login(email, accessCode, describeDevice());
    setBusy(false);
    if (!res.ok) {
      setError(candidateErrorMessage(res.error, res));
      return;
    }
    serverClock.sample(res.state.serverNowMs, res.timing.sentAtPerf, res.timing.receivedAtPerf);
    setSession(res.token, res.state);
    navigate(routeForState(res.state, false), { replace: true });
  };

  return <LoginPage onSubmit={onSubmit} error={error} busy={busy} />;
}
