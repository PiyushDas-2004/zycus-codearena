import { Camera, Maximize, MonitorX, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Alert, Button, Dialog } from '@/design/components';
import type { ProctoringController } from '../ProctoringController';
import { useProctoring, type Blocker } from '../proctoringStore';
import { copyFor } from '../violationPolicy';

/** Blocking overlays (full screen, camera, display) and the violation warning dialog. */
export function ProctoringOverlays({ proctor }: { proctor: ProctoringController }) {
  const blocker = useProctoring((s) => s.blockers[0] ?? null);
  return (
    <>
      {blocker && <BlockingOverlay blocker={blocker} proctor={proctor} />}
      <WarningDialog />
    </>
  );
}

function BlockingOverlay({ blocker, proctor }: { blocker: Blocker; proctor: ProctoringController }) {
  const camera = useProctoring((s) => s.camera);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setFailed(false);
    const ok = await fn();
    setBusy(false);
    if (ok === false) setFailed(true);
  };

  let icon: ReactNode;
  let title: string;
  let body: ReactNode;
  let action: ReactNode = null;
  if (blocker === 'camera') {
    icon = <Camera className="size-7" aria-hidden="true" />;
    title = 'Turn your camera back on';
    body =
      camera === 'blocked'
        ? 'Camera access is blocked. Click the camera icon in the address bar, choose "Allow", then press the button below.'
        : 'Your webcam must stay on for the whole assessment. Check that it is connected, uncovered and not used by another app.';
    action = (
      <Button loading={busy || camera === 'starting'} onClick={() => void run(() => proctor.retryCamera())}>
        Turn camera on
      </Button>
    );
  } else if (blocker === 'display') {
    icon = <MonitorX className="size-7" aria-hidden="true" />;
    title = 'Disconnect the extra display';
    body =
      'Only one display may be connected during the assessment. Disconnect the other display, or set your displays to mirror (duplicate). The assessment continues automatically.';
  } else {
    icon = <Maximize className="size-7" aria-hidden="true" />;
    title = 'Return to full screen';
    body = 'The assessment must be taken in full screen. Your timer is still running.';
    action = (
      <Button loading={busy} onClick={() => void run(() => proctor.returnToFullscreen())}>
        Return to full screen
      </Button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="proctor-block-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-overlay px-6 backdrop-blur-md"
    >
      <div className="w-full max-w-md rounded-xl bg-surface p-8 text-center shadow-lg">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-danger-surface text-danger">
          {icon}
        </span>
        <h2 id="proctor-block-title" className="mt-5 text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-muted">{body}</p>
        {failed && (
          <Alert tone="danger" className="mt-4 text-left" live>
            That didn't work. Allow it when your browser asks, then try again.
          </Alert>
        )}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

function WarningDialog() {
  const warning = useProctoring((s) => s.warning);
  const set = useProctoring((s) => s.set);
  const copy = warning ? copyFor(warning.type) : null;
  return (
    <Dialog
      open={!!warning}
      onClose={() => set({ warning: null })}
      dismissible={false}
      tone="danger"
      title={
        <span className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-danger" aria-hidden="true" />
          {copy?.title}
        </span>
      }
      description={copy?.body}
      footer={<Button onClick={() => set({ warning: null })}>I understand</Button>}
    >
      {warning && (
        <Alert tone="warning" title={`Warning ${warning.occurrence} of ${warning.warnings}`}>
          {warning.detail}
        </Alert>
      )}
    </Dialog>
  );
}
