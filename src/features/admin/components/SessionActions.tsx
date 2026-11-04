import { CalendarClock, KeyRound, MessageSquare, RotateCcw, Send, TimerReset, XCircle } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, Checkbox, Dialog, TextArea, TextField, toast } from '@/design/components';
import { can, useAdminApi, useAdminSession } from '../adminSession';
import type { AdminFailure, AdminResult, CandidateDetail, SessionInfo } from '../api/types';
import { adminErrorMessage } from '../lib/errors';
import { formatDuration, fromLocalInput, SUBMIT_REASON, toLocalInput } from '../lib/format';
import { invitationEmail } from '../lib/invitationMessage';
import { CodeAndEmail } from './NewInvitationDialog';

type Action = 'reopen' | 'extend' | 'force' | 'message' | 'code' | 'window' | 'revoke';

/** The buttons for what staff can do with this candidate right now, and their dialogs. */
export function SessionActions({ detail, onChanged }: { detail: CandidateDetail; onChanged: () => void }) {
  const staff = useAdminSession((s) => s.staff);
  const [open, setOpen] = useState<Action | null>(null);
  if (!can.act(staff)) return null;
  const s = detail.state;
  const close = () => setOpen(null);
  const done = () => {
    setOpen(null);
    onChanged();
  };
  const btn = (
    a: Action,
    label: string,
    icon: ReactNode,
    variant: 'primary' | 'secondary' | 'danger' = 'secondary',
  ) => (
    <Button size="sm" variant={variant} leadingIcon={icon} onClick={() => setOpen(a)}>
      {label}
    </Button>
  );

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {s === 'submitted' &&
          btn('reopen', 'Reopen test', <RotateCcw className="size-4" aria-hidden="true" />, 'primary')}
        {s === 'in_progress' && (
          <>
            {btn('message', 'Message', <MessageSquare className="size-4" aria-hidden="true" />)}
            {btn('extend', 'Extend time', <TimerReset className="size-4" aria-hidden="true" />)}
            {btn('force', 'Force submit', <Send className="size-4" aria-hidden="true" />, 'danger')}
          </>
        )}
        {s !== 'submitted' &&
          s !== 'revoked' &&
          btn('code', 'New code', <KeyRound className="size-4" aria-hidden="true" />)}
        {['invited', 'scheduled', 'signed_in', 'expired'].includes(s) && (
          <>
            {btn('window', 'Change dates', <CalendarClock className="size-4" aria-hidden="true" />)}
            {btn('revoke', 'Cancel invitation', <XCircle className="size-4" aria-hidden="true" />)}
          </>
        )}
      </div>
      {open === 'reopen' && detail.session && (
        <ReopenDialog session={detail.session} onClose={close} onDone={done} />
      )}
      {open === 'extend' && detail.session && (
        <ExtendDialog session={detail.session} onClose={close} onDone={done} />
      )}
      {open === 'force' && detail.session && (
        <ForceSubmitDialog session={detail.session} onClose={close} onDone={done} />
      )}
      {open === 'message' && detail.session && (
        <MessageDialog session={detail.session} onClose={close} onDone={done} />
      )}
      {open === 'code' && <NewCodeDialog detail={detail} onClose={close} onDone={done} />}
      {open === 'window' && <WindowDialog detail={detail} onClose={close} onDone={done} />}
      {open === 'revoke' && <RevokeDialog detail={detail} onClose={close} onDone={done} />}
    </>
  );
}

interface DialogProps {
  detail: CandidateDetail;
  onClose: () => void;
  onDone: () => void;
}

interface SessionDialogProps {
  session: SessionInfo;
  onClose: () => void;
  onDone: () => void;
}

/** Runs an action, showing the server's answer in the dialog when it fails. */
function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AdminFailure | null>(null);
  const run = async <S extends object>(
    fn: () => Promise<AdminResult<S>>,
    onOk: (r: { ok: true } & S) => void,
  ) => {
    setBusy(true);
    setError(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) onOk(r);
    else setError(r);
  };
  return { busy, error, setError, run };
}

const ErrorLine = ({ error }: { error: AdminFailure | null }) =>
  error ? (
    <Alert tone="danger" live className="mb-4">
      {adminErrorMessage(error)}
    </Alert>
  ) : null;

function ReopenDialog({ session, onClose, onDone }: SessionDialogProps) {
  const api = useAdminApi();
  const remaining = Math.max(
    0,
    Math.floor(((session.deadlineMs ?? 0) - (session.submittedAtMs ?? 0)) / 1000),
  );
  const [note, setNote] = useState('');
  const [extra, setExtra] = useState(remaining < 60 ? '15' : '0');
  const [reset, setReset] = useState(true);
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useAction();
  const extraMin = Number(extra);
  const extraError =
    !/^\d{1,3}$/.test(extra) || extraMin > 240
      ? 'Between 0 and 240 minutes.'
      : remaining + extraMin * 60 < 60
        ? 'No time was left when it ended: add at least 1 minute.'
        : null;
  const noteError = touched && !note.trim() ? 'Say why. Reviewers see this note.' : null;
  const counted = Object.values(session.violationCounts).reduce((a, b) => a + b, 0);

  const submit = () => {
    setTouched(true);
    if (!note.trim() || extraError) return;
    void run(
      () => api.reopen(session.id, extraMin, reset, note.trim()),
      (r) => {
        toast.success(
          'Test reopened',
          `${formatDuration(r.remainingSeconds)} on the clock. The candidate can sign in again with the same code.`,
        );
        onDone();
      },
    );
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Reopen the test"
      description="The candidate continues where they left off: their code is kept, and the clock resumes."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={busy}
            onClick={submit}
            leadingIcon={<RotateCcw className="size-4" aria-hidden="true" />}
          >
            Reopen
          </Button>
        </>
      }
    >
      <ErrorLine error={error} />
      <div className="flex flex-col gap-5">
        <div className="rounded-md bg-surface-sunken px-4 py-3 text-sm text-strong">
          <p>
            Ended: <strong>{session.submitReason ? SUBMIT_REASON[session.submitReason] : 'Submitted'}</strong>
          </p>
          <p className="mt-1">
            Time left when it ended: <strong>{formatDuration(remaining)}</strong>
            {remaining + extraMin * 60 >= 60 && (
              <>
                {' '}
                · after reopening: <strong>{formatDuration(remaining + extraMin * 60)}</strong>
              </>
            )}
          </p>
        </div>
        <Checkbox
          checked={reset}
          onChange={(e) => setReset(e.target.checked)}
          label={`Start the warnings afresh (${counted} counted so far)`}
          description="Earlier violations stay in the timeline for reviewers but no longer count towards the limits. Leave unticked to keep counting from where it was."
        />
        <TextField
          label="Extra minutes"
          inputMode="numeric"
          value={extra}
          onChange={(e) => setExtra(e.target.value.trim())}
          error={touched || remaining < 60 ? extraError : null}
          hint="On top of the time that was left."
          containerClassName="max-w-48"
        />
        <TextArea
          label="Reason"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={noteError}
          maxLength={1000}
          required
          placeholder="e.g. The face detector flagged a poster behind the candidate."
        />
        <Alert tone="info">
          Tell the candidate to sign in again with the same email and access code. If they no longer have the
          code, use <strong>New code</strong> after reopening.
        </Alert>
      </div>
    </Dialog>
  );
}

function ExtendDialog({ session, onClose, onDone }: SessionDialogProps) {
  const api = useAdminApi();
  const [minutes, setMinutes] = useState('10');
  const [note, setNote] = useState('');
  const { busy, error, run } = useAction();
  const m = Number(minutes);
  const bad = !/^\d{1,3}$/.test(minutes) || m < 1 || m > 240;
  return (
    <Dialog
      open
      onClose={onClose}
      title="Extend the time"
      description="The candidate’s timer updates within a few seconds."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={busy}
            disabled={bad}
            onClick={() =>
              void run(
                () => api.extendTime(session.id, m, note.trim()),
                () => {
                  toast.success(`Extended by ${m} min`);
                  onDone();
                },
              )
            }
          >
            Extend
          </Button>
        </>
      }
    >
      <ErrorLine error={error} />
      <div className="flex flex-col gap-4">
        <TextField
          label="Minutes to add"
          inputMode="numeric"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value.trim())}
          error={bad ? 'Between 1 and 240.' : null}
          containerClassName="max-w-48"
          autoFocus
        />
        <TextArea
          label="Reason (optional)"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
        />
      </div>
    </Dialog>
  );
}

function ForceSubmitDialog({ session, onClose, onDone }: SessionDialogProps) {
  const api = useAdminApi();
  const [note, setNote] = useState('');
  const { busy, error, run } = useAction();
  return (
    <Dialog
      open
      onClose={onClose}
      tone="danger"
      title="Submit the test now?"
      description="The candidate’s work so far is kept and the test ends at once. You can reopen it afterwards if needed."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            disabled={!note.trim()}
            onClick={() =>
              void run(
                () => api.forceSubmit(session.id, note.trim()),
                () => {
                  toast.success('Test submitted');
                  onDone();
                },
              )
            }
          >
            Submit now
          </Button>
        </>
      }
    >
      <ErrorLine error={error} />
      <TextArea
        label="Reason"
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        required
        autoFocus
      />
    </Dialog>
  );
}

function MessageDialog({ session, onClose, onDone }: SessionDialogProps) {
  const api = useAdminApi();
  const [body, setBody] = useState('');
  const { busy, error, run } = useAction();
  return (
    <Dialog
      open
      onClose={onClose}
      title="Message the candidate"
      description="It appears on their screen within a few seconds, and they confirm they’ve read it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={busy}
            disabled={!body.trim()}
            onClick={() =>
              void run(
                () => api.sendMessage(session.id, body.trim()),
                () => {
                  toast.success('Message sent');
                  onDone();
                },
              )
            }
          >
            Send
          </Button>
        </>
      }
    >
      <ErrorLine error={error} />
      <TextArea
        label="Message"
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        hint={`${body.length} / 1000`}
        autoFocus
      />
    </Dialog>
  );
}

function NewCodeDialog({ detail, onClose, onDone }: DialogProps) {
  const api = useAdminApi();
  const staff = useAdminSession((s) => s.staff);
  const [code, setCode] = useState<string | null>(null);
  const { busy, error, run } = useAction();
  const email = useMemo(
    () =>
      code &&
      invitationEmail({
        candidateName: detail.candidate.fullName,
        email: detail.candidate.email,
        accessCode: code,
        assessmentName: detail.template.name,
        durationMinutes: detail.template.durationMinutes,
        validFromMs: detail.invitation.validFromMs,
        validUntilMs: detail.invitation.validUntilMs,
        link: `${window.location.origin}/`,
        senderName: staff?.fullName || staff?.email || 'Zycus',
      }),
    [code, detail, staff],
  );
  return (
    <Dialog
      open
      onClose={code ? onDone : onClose}
      size="lg"
      title={code ? 'New access code' : 'Give the candidate a new code?'}
      description={
        code
          ? 'The old code no longer works. Send this one now: it is shown only once.'
          : 'For a lost or mistyped code. The old code stops working at once; a test in progress continues.'
      }
      footer={
        code ? undefined : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                void run(
                  () => api.resetCode(detail.invitation.id),
                  (r) => setCode(r.accessCode),
                )
              }
            >
              Create new code
            </Button>
          </>
        )
      }
    >
      <ErrorLine error={error} />
      {code && email && (
        <CodeAndEmail
          code={code}
          to={detail.candidate.email}
          email={email}
          onDone={onDone}
          validUntilMs={detail.invitation.validUntilMs}
        />
      )}
    </Dialog>
  );
}

function WindowDialog({ detail, onClose, onDone }: DialogProps) {
  const api = useAdminApi();
  const [openedAt] = useState(() => Date.now());
  const [from, setFrom] = useState(() =>
    toLocalInput(Math.max(detail.invitation.validFromMs, openedAt - 60_000)),
  );
  const [until, setUntil] = useState(() =>
    toLocalInput(Math.max(detail.invitation.validUntilMs, openedAt + 86_400_000)),
  );
  const { busy, error, run } = useAction();
  const f = fromLocalInput(from);
  const u = fromLocalInput(until);
  const bad = f === null || u === null || u <= f || u < openedAt + 15 * 60_000;
  return (
    <Dialog
      open
      onClose={onClose}
      title="Change when the code works"
      description="The window is for starting the test. The same code keeps working."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={busy}
            disabled={bad}
            onClick={() =>
              f !== null &&
              u !== null &&
              void run(
                () => api.updateWindow(detail.invitation.id, f, u),
                () => {
                  toast.success('Dates updated');
                  onDone();
                },
              )
            }
          >
            Save
          </Button>
        </>
      }
    >
      <ErrorLine error={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="From"
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <TextField
          label="Until"
          type="datetime-local"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          error={bad ? 'Must be after the start, and at least 15 minutes from now.' : null}
        />
      </div>
    </Dialog>
  );
}

function RevokeDialog({ detail, onClose, onDone }: DialogProps) {
  const api = useAdminApi();
  const [note, setNote] = useState('');
  const { busy, error, run } = useAction();
  return (
    <Dialog
      open
      onClose={onClose}
      tone="danger"
      title="Cancel this invitation?"
      description="The code stops working for good. To invite the candidate again later, create a new invitation."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={() =>
              void run(
                () => api.revokeInvitation(detail.invitation.id, note.trim()),
                () => {
                  toast.success('Invitation cancelled');
                  onDone();
                },
              )
            }
          >
            Cancel invitation
          </Button>
        </>
      }
    >
      <ErrorLine error={error} />
      <TextArea
        label="Reason (optional)"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
      />
    </Dialog>
  );
}
