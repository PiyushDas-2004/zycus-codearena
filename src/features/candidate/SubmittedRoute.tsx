import { CircleCheck } from 'lucide-react';
import { useEffect } from 'react';
import { appConfig } from '@/config/app.config';
import { legal } from '@/config/legal';
import { AppFooter, Markdown, ProductLockup, SpectrumBar } from '@/design/components';
import type { SessionState } from '@/lib/api';
import { exitFullscreen } from '@/lib/device/fullscreen';
import { deleteRecord } from '@/lib/persist/localRecord';
import { CandidateGate } from './session/CandidateGate';

export default function SubmittedRoute() {
  return <CandidateGate route="/submitted">{(state) => <ThankYou state={state} />}</CandidateGate>;
}

const reasonText: Record<string, string> = {
  time_up: 'The time limit was reached, so your work was submitted automatically.',
  violation_limit: 'Your assessment was submitted automatically because the proctoring limit was reached.',
  admin_force: 'Your assessment was submitted by the Zycus team.',
};

function ThankYou({ state }: { state: SessionState }) {
  useEffect(() => {
    // Leave full screen, release any camera, and remove the local copy of the candidate's work.
    void exitFullscreen();
    window.dispatchEvent(new Event('codearena:release-devices'));
    void deleteRecord(state.sessionId);
  }, [state.sessionId]);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SpectrumBar />
      <header className="border-b border-border px-8 py-4">
        <ProductLockup />
      </header>
      <main className="grid flex-1 lg:grid-cols-2">
        <section className="flex items-center px-8 py-16 sm:px-16">
          <div className="max-w-lg">
            <CircleCheck className="size-12 text-success" aria-hidden="true" />
            <h1 className="mt-6 text-4xl font-light leading-tight text-title">
              Thank you, {state.candidate.fullName.split(' ')[0]}
            </h1>
            {state.submitReason && reasonText[state.submitReason] && (
              <p className="mt-4 font-medium text-strong">{reasonText[state.submitReason]}</p>
            )}
            <Markdown className="prose-candidate mt-4 text-[17px] leading-relaxed">
              {legal.thankYou.markdown}
            </Markdown>
          </div>
        </section>
        <aside className="relative hidden overflow-hidden lg:block" aria-hidden="true">
          <img
            src={appConfig.brand.images.thankYou}
            alt=""
            className="absolute inset-0 size-full object-cover"
            draggable={false}
          />
          <div className="bg-gradient-hero absolute inset-0 opacity-40" />
        </aside>
      </main>
      <AppFooter />
    </div>
  );
}
