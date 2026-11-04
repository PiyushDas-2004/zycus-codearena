import { ArrowRight, Clock, MonitorCheck, ShieldCheck } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { appConfig } from '@/config/app.config';
import { Alert, AppFooter, Button, ProductLockup, SpectrumBar, TextField } from '@/design/components';
import { formatAccessCode, isValidAccessCode, normalizeAccessCode } from '@/shared/accessCode';
import { SpaceBackdrop } from './login-space/SpaceBackdrop';
import './loginPage.css';

export interface LoginFormValues {
  email: string;
  accessCode: string;
}

interface LoginPageProps {
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  /** Server-side error to display (e.g. invalid code, locked out). */
  error?: string | null;
  busy?: boolean;
  /** Development only: shown when the app runs against the in-browser mock backend. */
  mockNotice?: boolean;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function LoginPage({ onSubmit, error, busy, mockNotice }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [touched, setTouched] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  const emailError =
    touched && !EMAIL_RE.test(email.trim()) ? 'Enter the email address the invitation was sent to.' : null;
  const codeError =
    touched && !isValidAccessCode(code) ? 'Access codes have 12 characters, like 7KQ2-M9XD-4RTA.' : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!EMAIL_RE.test(email.trim()) || !isValidAccessCode(code)) return;
    void onSubmit({ email: email.trim().toLowerCase(), accessCode: normalizeAccessCode(code) });
  };

  return (
    <div className="login-sky flex min-h-dvh flex-col">
      <SpaceBackdrop focusRef={sceneRef} />
      <SpectrumBar />
      <div className="grid flex-1 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* The journey through space shows here (from tablet width up); the card sits beside it. */}
        <div ref={sceneRef} className="hidden md:block" aria-hidden="true" />
        <main className="flex min-w-0 flex-col items-center justify-center px-4 py-10 sm:px-6 md:px-8 lg:px-14">
          <div className="login-card w-full max-w-[33rem] px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex justify-center">
              <ProductLockup />
            </div>
            <h1 className="mt-8 text-center text-2xl font-light leading-tight text-title sm:text-[28px]">
              {/* Non-breaking hyphens keep words like "Hands-On" on one line. */}
              {appConfig.welcomeLine.replaceAll('-', '\u2011')}
            </h1>
            <p className="mt-3 text-center text-muted">
              Sign in with the email address and access code from your invitation.
            </p>

            <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
              {mockNotice && (
                <Alert tone="warning" title="Mock backend (development)">
                  This server isn't connected to Supabase. Sign in with any email and the code{' '}
                  <strong className="font-mono">DEMO-DEMO-DEMO</strong>. Real access codes work only with{' '}
                  <code>npm run dev</code> (port 5173).
                </Alert>
              )}
              {error && (
                <Alert tone="danger" live>
                  {error}
                </Alert>
              )}
              <TextField
                label="Email address"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
              />
              <TextField
                label="Access code"
                name="access-code"
                autoComplete="one-time-code"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="XXXX-XXXX-XXXX"
                required
                value={code}
                onChange={(e) => setCode(formatAccessCode(e.target.value))}
                error={codeError}
                hint="Single use. It works only during the time window in your invitation."
                className="font-mono tracking-[0.12em]"
                maxLength={14}
              />
              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={busy}
                trailingIcon={<ArrowRight className="size-5" />}
              >
                Continue
              </Button>
            </form>

            <ul className="mt-8 grid gap-3 border-t border-border pt-6 text-sm text-muted">
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                One sitting, timed by the server. Your work is saved continuously.
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Proctored: webcam, full screen, and no tab switching or pasting.
              </li>
              <li className="flex items-start gap-3">
                <MonitorCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Desktop Google Chrome or Microsoft Edge, one screen, at least 1280 px wide.
              </li>
            </ul>

            <p className="mt-6 text-center text-sm text-muted">
              Trouble signing in? Reply to your invitation email and the Zycus Talent Acquisition team will
              help.
            </p>
          </div>
          <div className="login-footer">
            <AppFooter />
            {/* The planet maps' licence (CC BY 4.0) asks for this credit. */}
            <p className="login-credit -mt-3 pb-5 text-center text-[11px]">
              Planet maps:{' '}
              <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">
                Solar System Scope
              </a>
              , from NASA data (
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
              >
                CC BY 4.0
              </a>
              , adapted)
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
