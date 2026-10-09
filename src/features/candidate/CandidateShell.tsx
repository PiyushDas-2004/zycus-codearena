import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppFooter, ProductLockup, SpectrumBar } from '@/design/components';

const STEPS = ['Sign in', 'System check', 'Instructions', 'Assessment'] as const;

interface CandidateShellProps {
  step: 0 | 1 | 2 | 3;
  candidateName?: string;
  children: ReactNode;
  wide?: boolean;
}

/** Layout for the pre-test screens: branded header, progress steps, content card, footer. */
export function CandidateShell({ step, candidateName, children, wide }: CandidateShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SpectrumBar />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-8 py-4">
          <ProductLockup />
          {candidateName && (
            <p className="text-sm text-muted">
              Signed in as <span className="font-medium text-strong">{candidateName}</span>
            </p>
          )}
        </div>
      </header>
      <nav aria-label="Assessment progress" className="border-b border-border bg-surface">
        <ol className="mx-auto flex max-w-6xl items-center gap-2 px-8 py-3">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={label} className="flex items-center gap-2" aria-current={current ? 'step' : undefined}>
                <span
                  className={clsx(
                    'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                    done && 'bg-success-fill text-white',
                    current && 'bg-primary text-on-primary',
                    !done && !current && 'bg-surface-sunken text-muted',
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span className={clsx('text-sm', current ? 'font-semibold text-strong' : 'text-muted')}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mx-2 h-px w-8 bg-border-strong" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <main className={clsx('mx-auto w-full flex-1 px-8 py-10', wide ? 'max-w-6xl' : 'max-w-4xl')}>
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
