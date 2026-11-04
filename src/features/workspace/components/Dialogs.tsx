import { CircleCheck, Circle, Download, Flag, MessageSquare, WifiOff } from 'lucide-react';
import { Alert, Button, Dialog, Spinner } from '@/design/components';
import type { ResponseStatus } from '@/lib/api/types';
import { fileKey } from '@/lib/persist/localRecord';
import type { WorkspaceController } from '../WorkspaceController';
import { useShallow } from 'zustand/react/shallow';
import { useWorkspaceUi } from '../workspaceStore';

const statusLabel: Record<ResponseStatus, string> = {
  not_started: 'Not started',
  in_progress: 'Attempted',
  marked_for_review: 'Marked for review',
};

export function SubmitDialog({ controller }: { controller: WorkspaceController }) {
  const open = useWorkspaceUi((s) => s.submitPhase === 'confirm');
  // Mounted only while open, so the summary never re-renders during normal work.
  return open ? <SubmitConfirm controller={controller} /> : null;
}

function SubmitConfirm({ controller }: { controller: WorkspaceController }) {
  const { questions, statuses, modified, set } = useWorkspaceUi(
    useShallow((s) => ({
      questions: s.questions,
      statuses: s.statuses,
      modified: s.modified,
      set: s.set,
    })),
  );
  const attempted = questions.filter(
    (q) => (statuses[q.questionId] ?? 'not_started') !== 'not_started',
  ).length;
  const flagged = questions.filter((q) => statuses[q.questionId] === 'marked_for_review').length;
  return (
    <Dialog
      open
      onClose={() => set({ submitPhase: 'idle' })}
      title="Submit your assessment?"
      description={`You attempted ${attempted} of ${questions.length} questions. You can't change anything after submitting.`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => set({ submitPhase: 'idle' })}>
            Keep working
          </Button>
          <Button onClick={() => void controller.submit()}>Submit assessment</Button>
        </>
      }
    >
      {flagged > 0 && (
        <Alert tone="warning" className="mb-4">
          {flagged} question{flagged > 1 ? 's are' : ' is'} marked for review.
        </Alert>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="py-2 font-medium">Question</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium">Files changed</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const st = statuses[q.questionId] ?? 'not_started';
            const changed = q.files.filter((f) => modified[fileKey(q.questionId, f.path)]).length;
            return (
              <tr key={q.questionId} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-3">
                  <span className="font-medium text-strong">Q{q.position}</span>{' '}
                  <span className="text-muted">{q.title}</span>
                </td>
                <td className="whitespace-nowrap py-2.5 pr-3">
                  <span className="inline-flex items-center gap-1">
                    {st === 'marked_for_review' ? (
                      <Flag className="size-3.5 text-warning" aria-hidden="true" />
                    ) : st === 'in_progress' ? (
                      <CircleCheck className="size-3.5 text-success" aria-hidden="true" />
                    ) : (
                      <Circle className="size-3.5 text-icon-subtle" aria-hidden="true" />
                    )}
                    {statusLabel[st]}
                  </span>
                </td>
                <td className="tabular py-2.5 pr-3">{changed}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Dialog>
  );
}

/** Blocking overlay while the final submission is in progress (candidate submit or time-up). */
export function SubmittingOverlay({ controller }: { controller: WorkspaceController }) {
  const { submitPhase, submitAttempts, timeUp, limitReached } = useWorkspaceUi(
    useShallow((s) => ({
      submitPhase: s.submitPhase,
      submitAttempts: s.submitAttempts,
      timeUp: s.timeUp,
      limitReached: s.limitReached,
    })),
  );
  const open = submitPhase === 'submitting' || submitPhase === 'retrying' || submitPhase === 'done';
  const struggling = submitPhase === 'retrying' && submitAttempts >= 2;
  return (
    <Dialog
      open={open}
      onClose={() => undefined}
      dismissible={false}
      title={timeUp ? "Time's up" : limitReached ? 'Proctoring limit reached' : 'Submitting your assessment'}
      description={
        timeUp
          ? 'Your time has ended and editing is locked. We are submitting your work now.'
          : limitReached
            ? 'The maximum number of proctoring violations was reached, so your assessment is being submitted automatically. Your work so far is saved.'
            : 'Saving your final work to Zycus. Please keep this window open.'
      }
    >
      {!struggling ? (
        <div
          className="flex items-center gap-3 rounded-md bg-surface-tint px-4 py-3 text-sm text-strong"
          role="status"
        >
          <Spinner size={18} className="text-primary" label={null} />
          {submitPhase === 'done' ? 'Submitted. Taking you to the confirmation page…' : 'Submitting…'}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Alert tone="warning" title="We can't reach Zycus servers right now" live>
            Your work is safe on this device. Keep this window open and connected; we keep retrying
            automatically (attempt {submitAttempts}).
          </Alert>
          <p className="text-sm text-muted">
            If your connection doesn't come back, download the encrypted backup and email it to the Zycus
            Talent Acquisition team. Only Zycus can open it.
          </p>
          <div>
            <Button
              variant="secondary"
              leadingIcon={<Download className="size-4" />}
              onClick={() => void controller.downloadBackup()}
            >
              Download encrypted backup
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

export function StaffMessageDialog({ controller }: { controller: WorkspaceController }) {
  const message = useWorkspaceUi((s) => s.messages[0]);
  return (
    <Dialog
      open={!!message}
      onClose={() => message && controller.acknowledgeMessage(message.id)}
      dismissible={false}
      title="Message from the Zycus team"
      footer={<Button onClick={() => message && controller.acknowledgeMessage(message.id)}>Got it</Button>}
    >
      <div className="flex gap-3 rounded-md bg-surface-tint px-4 py-3">
        <MessageSquare className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="whitespace-pre-wrap text-[15px] text-strong">{message?.body}</p>
      </div>
    </Dialog>
  );
}

export function OfflineBanner() {
  const offline = useWorkspaceUi((s) => s.saveStatus.phase === 'offline');
  if (!offline) return null;
  return (
    <div
      role="alert"
      className="flex shrink-0 items-center justify-center gap-2 bg-warning-surface px-4 py-1.5 text-sm text-warning"
    >
      <WifiOff className="size-4" aria-hidden="true" />
      <span>
        <strong>You're offline.</strong> Keep working: your changes are saved on this device and will sync
        automatically.
      </span>
    </div>
  );
}
