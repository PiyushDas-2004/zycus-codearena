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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-8">
          <ProductLockup />
          {candidateName && (
            <p className="min-w-0 truncate text-sm text-muted">
              Signed in as <span className="font-medium text-strong">{candidateName}</span>
            </p>
          )}
        </div>
      </header>
      <nav aria-label="Assessment progress" className="border-b border-border bg-surface">
        <ol className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-3 sm:gap-2 sm:px-8">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li
                key={label}
                className="flex shrink-0 items-center gap-2"
                aria-current={current ? 'step' : undefined}
              >
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
                {/* On small screens only the current step is named. */}
                <span
                  className={clsx(
                    'whitespace-nowrap text-sm',
                    current ? 'font-semibold text-strong' : 'hidden text-muted sm:inline',
                  )}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mx-1 h-px w-4 bg-border-strong sm:mx-2 sm:w-8" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <main
        className={clsx('mx-auto w-full flex-1 px-4 py-8 sm:px-8 sm:py-10', wide ? 'max-w-6xl' : 'max-w-4xl')}
      >
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
