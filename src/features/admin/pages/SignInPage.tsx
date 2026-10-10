import { ArrowRight, LockKeyhole, ShieldAlert, WifiOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { envResult } from '@/config/env';
import {
  Alert,
  AppFooter,
  Button,
  Card,
  EmptyState,
  ProductLockup,
  SpectrumBar,
  TextField,
} from '@/design/components';
import { useAdminSession } from '../adminSession';
import { adminErrorMessage } from '../lib/errors';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const microsoft = envResult.ok && envResult.env.enableEntraSso;

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-app">
      <SpectrumBar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card padding="lg" className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <ProductLockup />
          </div>
          {children}
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}

export function SignInPage() {
  const signIn = useAdminSession((s) => s.signIn);
  const api = useAdminSession((s) => s.api);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = touched && !EMAIL_RE.test(email.trim()) ? 'Enter your Zycus email address.' : null;
  const passwordError = touched && !password ? 'Enter your password.' : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!EMAIL_RE.test(email.trim()) || !password) return;
    setBusy(true);
    setError(null);
    const r = await signIn(email, password);
    setBusy(false);
    if (!r.ok) setError(r.error === 'INVALID_PAYLOAD' ? 'Wrong email or password.' : adminErrorMessage(r));
  };

  return (
    <Frame>
      <h1 className="text-center text-2xl font-light text-title">Admin sign-in</h1>
      <p className="mt-2 text-center text-sm text-muted">For Zycus staff who run the coding assessments.</p>
      <form className="mt-8 flex flex-col gap-5" onSubmit={(e) => void submit(e)} noValidate>
        {error && (
          <Alert tone="danger" live>
            {error}
          </Alert>
        )}
        <TextField
          label="Email address"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          required
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          required
        />
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={busy}
          trailingIcon={<ArrowRight className="size-5" />}
        >
          Sign in
        </Button>
        {microsoft && api && (
          <Button variant="secondary" size="lg" fullWidth onClick={() => void api.signInWithMicrosoft()}>
            Sign in with Microsoft
          </Button>
        )}
      </form>
      <p className="mt-6 flex items-start gap-2 text-xs text-muted">
        <LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Accounts are created by a Super Admin. Every action in the portal is recorded.
      </p>
    </Frame>
  );
}

export function AccessPage({
  kind,
  onRetry,
}: {
  kind: 'not_staff' | 'unavailable' | 'offline';
  onRetry?: () => void;
}) {
  const signOut = useAdminSession((s) => s.signOut);
  return (
    <Frame>
      {kind === 'not_staff' ? (
        <EmptyState
          icon={<ShieldAlert className="size-6" aria-hidden="true" />}
          title="Access not granted"
          description="You signed in, but your account isn’t on the CodeArena staff list. Ask a Super Admin to add your Zycus email."
          action={
            <Button variant="secondary" onClick={() => void signOut()}>
              Use another account
            </Button>
          }
        />
      ) : kind === 'offline' ? (
        <EmptyState
          icon={<WifiOff className="size-6" aria-hidden="true" />}
          title="Can’t reach the server"
          description="Check your connection. If the problem continues, the database may be paused: resume it in the Supabase dashboard."
          action={<Button onClick={onRetry}>Try again</Button>}
        />
      ) : (
        <EmptyState
          icon={<ShieldAlert className="size-6" aria-hidden="true" />}
          title="Admin portal unavailable here"
          description="This build runs the candidate pages against the in-browser mock backend. Use npm run dev (Supabase) or npm run dev:local (local stack) for the admin portal."
        />
      )}
    </Frame>
  );
}
