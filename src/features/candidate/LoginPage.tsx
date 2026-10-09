import { ArrowRight, Clock, MonitorCheck, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { appConfig } from '@/config/app.config';
import { Alert, AppFooter, Button, ProductLockup, SpectrumBar, TextField } from '@/design/components';
import { formatAccessCode, isValidAccessCode, normalizeAccessCode } from '@/shared/accessCode';

export interface LoginFormValues {
  email: string;
  accessCode: string;
}

interface LoginPageProps {
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  /** Server-side error to display (e.g. invalid code, locked out). */
  error?: string | null;
  busy?: boolean;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function LoginPage({ onSubmit, error, busy }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [touched, setTouched] = useState(false);

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
    <div className="flex min-h-dvh flex-col bg-surface">
      <SpectrumBar />
      <div className="grid flex-1 md:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Brand panel — photo under the Zycus hero gradient (from tablet width up) */}
        <aside className="relative hidden overflow-hidden md:block" aria-hidden="true">
          <img
            src={appConfig.brand.images.login}
            alt=""
            className="absolute inset-0 size-full object-cover"
            draggable={false}
          />
          <div className="bg-gradient-hero absolute inset-0 opacity-[0.88]" />
          <div className="relative flex h-full flex-col justify-end p-8 lg:p-12 xl:p-16">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-blue-200">
              {appConfig.subtitle}
            </p>
            <p className="mt-3 max-w-xl text-3xl font-light leading-tight text-white lg:text-4xl xl:text-[44px]">
              Show us how you find and fix real problems.
            </p>
            <ul className="mt-8 grid max-w-xl gap-4 text-sm text-white/90 lg:mt-10 lg:text-[15px]">
              <li className="flex items-center gap-3">
                <Clock className="size-5 shrink-0 text-teal-400" />
                One sitting, timed by the server. Your work is saved continuously.
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="size-5 shrink-0 text-teal-400" />
                Proctored: webcam, full screen, and no tab switching or pasting.
              </li>
              <li className="flex items-center gap-3">
                <MonitorCheck className="size-5 shrink-0 text-teal-400" />
                Desktop Google Chrome or Microsoft Edge, one screen, at least 1280px wide.
              </li>
            </ul>
          </div>
        </aside>

        {/* Sign-in panel */}
        <main className="flex flex-col px-8 py-10 lg:px-14 xl:px-20">
          <div className="flex justify-center">
            <ProductLockup />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md py-12">
              <h1 className="text-center text-[28px] font-light leading-tight text-title">
                {/* Non-breaking hyphens keep words like "Hands-On" on one line. */}
                {appConfig.welcomeLine.replaceAll('-', '\u2011')}
              </h1>
              <p className="mt-3 text-center text-muted">
                Sign in with the email address and access code from your invitation.
              </p>

              <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
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

              <p className="mt-8 text-center text-sm text-muted">
                Trouble signing in? Reply to your invitation email and the Zycus Talent Acquisition team will
                help.
              </p>
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
