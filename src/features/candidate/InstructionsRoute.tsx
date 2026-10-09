import { Clock, FileCode2, Maximize, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { legal, consentDocument, consentVersion } from '@/config/legal';
import { Alert, Button, Card, Checkbox, Markdown } from '@/design/components';
import { getCandidateApi, type SessionState } from '@/lib/api';
import { sha256Hex } from '@/lib/crypto';
import { describeDevice, hasExtendedDisplay } from '@/lib/device/environment';
import { enterFullscreen } from '@/lib/device/fullscreen';
import { serverClock } from '@/lib/time/serverClock';
import { resolveProctoringConfig, resolveViolationPolicy } from '@/shared/proctoringConfig';
import { CandidateShell } from './CandidateShell';
import { policyLines } from '../proctoring/violationPolicy';
import { prefetchWorkspace } from '../workspace/prefetch';
import { minutesLabel, proctoringMeasures } from './proctoringMeasures';
import { CandidateGate } from './session/CandidateGate';
import { candidateErrorMessage, useCandidateSession } from './session/candidateSession';

export default function InstructionsRoute() {
  return <CandidateGate route="/instructions">{(state) => <Instructions state={state} />}</CandidateGate>;
}

function Instructions({ state }: { state: SessionState }) {
  const navigate = useNavigate();
  const { token, setState } = useCandidateSession();
  const systemCheck = useCandidateSession((s) => s.systemCheck);
  const proctoring = resolveProctoringConfig(state.proctoring);
  const policy = resolveViolationPolicy(state.violationPolicy);
  const [agreeData, setAgreeData] = useState(false);
  const [agreeConfidential, setAgreeConfidential] = useState(false);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vars = useMemo(
    () => ({
      grievanceContact: state.settings.grievanceContactEmail ?? legal.defaultGrievanceContact,
      retentionDays: state.settings.candidateDataRetentionDays,
      snapshotRetentionDays: state.settings.snapshotRetentionDays,
      snapshotMinutes: minutesLabel(proctoring.webcam.snapshotIntervalSec),
    }),
    [state.settings, proctoring.webcam.snapshotIntervalSec],
  );
  const consentText = useMemo(() => consentDocument(vars), [vars]);
  const faceDetection = proctoring.webcam.enabled && proctoring.faceDetection.enabled;

  // Download the editor and face detection in the background while the candidate reads.
  useEffect(() => prefetchWorkspace({ faceDetection }), [faceDetection]);

  const accept = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    const res = await getCandidateApi().acceptConsent(token, consentVersion(), await sha256Hex(consentText), {
      ...describeDevice(),
      system_check: systemCheck?.checks ?? {},
    });
    setBusy(false);
    if (!res.ok) return setError(candidateErrorMessage(res.error));
    setState(res.state);
  };

  const start = async () => {
    if (!token) return;
    if (
      proctoring.multiMonitor.enabled &&
      proctoring.multiMonitor.blockStartIfExtended &&
      hasExtendedDisplay() === true
    ) {
      return setError(
        'More than one display is connected. Disconnect the extra display (or set your displays to mirror), then press Start again.',
      );
    }
    setBusy(true);
    setError(null);
    // Fullscreen must be requested from this click, before any await.
    const fs = proctoring.fullscreen.enabled ? enterFullscreen() : Promise.resolve(true);
    const ok = await fs;
    if (!ok) {
      setBusy(false);
      return setError(
        'Full-screen mode is required. Allow full screen when your browser asks, then press Start again.',
      );
    }
    const res = await getCandidateApi().start(token, { device: describeDevice() });
    setBusy(false);
    if (!res.ok) return setError(candidateErrorMessage(res.error));
    serverClock.sample(res.state.serverNowMs, res.timing.sentAtPerf, res.timing.receivedAtPerf);
    setState(res.state);
    navigate('/test', { replace: true });
  };

  const facts = [
    { icon: Clock, label: 'Duration', value: `${state.template.durationMinutes} minutes, in one sitting` },
    { icon: FileCode2, label: 'Questions', value: `${state.template.questionCount} hands-on tasks` },
    {
      icon: Maximize,
      label: 'Mode',
      value: proctoring.fullscreen.enabled ? 'Full screen, proctored' : 'Proctored',
    },
  ];

  return (
    <CandidateShell step={2} candidateName={state.candidate.fullName} wide>
      <h1 className="text-3xl font-light text-title">{state.template.name}</h1>
      <p className="mt-2 text-muted">
        Read the instructions carefully. The timer starts only when you press Start.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {facts.map((f) => (
          <Card key={f.label} className="flex items-center gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-tint text-primary">
              <f.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">{f.label}</p>
              <p className="font-semibold text-strong">{f.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <Markdown className="prose-candidate">{state.template.instructionsMd}</Markdown>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" /> Proctoring
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px]">
            {proctoringMeasures(proctoring).map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <Alert tone="warning" className="mt-4" title="If a rule is broken">
            <ul className="list-disc space-y-1 pl-4">
              {policyLines(policy).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-2">All events are reviewed by the interview panel.</p>
          </Alert>
        </Card>
      </div>

      {!state.consentAccepted ? (
        <Card className="mt-6">
          <div
            className="max-h-80 overflow-y-auto rounded-md border border-border bg-surface-app px-5 py-4"
            tabIndex={0}
            aria-label="Data processing notice and confidentiality terms"
          >
            <Markdown className="prose-candidate text-[14px]">{consentText}</Markdown>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            <Checkbox
              label="I have read the notice above and consent to Zycus processing my personal data, including webcam snapshots, for this assessment."
              checked={agreeData}
              onChange={(e) => setAgreeData(e.target.checked)}
            />
            <Checkbox
              label="I agree to keep the assessment content confidential and not to share, copy or record it."
              checked={agreeConfidential}
              onChange={(e) => setAgreeConfidential(e.target.checked)}
            />
            <Checkbox
              label="I confirm that I am 18 years of age or older."
              checked={adult}
              onChange={(e) => setAdult(e.target.checked)}
            />
          </div>
          {error && (
            <Alert tone="danger" className="mt-4" live>
              {error}
            </Alert>
          )}
          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              onClick={() => void accept()}
              loading={busy}
              disabled={!agreeData || !agreeConfidential || !adult}
            >
              Accept and continue
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 flex flex-col items-start gap-4 border-primary/30 bg-surface-tint sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">You're ready to start</h2>
            <p className="mt-1 text-muted">
              When you press Start, the page switches to full screen and your {state.template.durationMinutes}
              -minute timer begins on our servers. It keeps running even if you close the browser.
            </p>
            {error && (
              <Alert tone="danger" className="mt-3" live>
                {error}
              </Alert>
            )}
          </div>
          <Button size="lg" onClick={() => void start()} loading={busy}>
            Start assessment
          </Button>
        </Card>
      )}
    </CandidateShell>
  );
}
