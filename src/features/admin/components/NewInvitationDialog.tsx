import { Mail } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Alert, Button, Dialog, TextArea, TextField } from '@/design/components';
import { useAdminSession } from '../adminSession';
import type { IssuedCode, NewInvitation, Overview } from '../api/types';
import { adminErrorMessage } from '../lib/errors';
import { formatDateTime, fromLocalInput, toLocalInput } from '../lib/format';
import { invitationEmail, mailtoLink, outlookWebLink } from '../lib/invitationMessage';
import { CopyButton, SelectField } from './fields';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DAY = 86_400_000;

/** `days` after the start (or after now, if the start is in the past), for the quick buttons. */
function untilAfter(fromInput: string, days: number): string {
  return toLocalInput(Math.max(fromLocalInput(fromInput) ?? 0, Date.now()) + days * DAY);
}

interface Props {
  open: boolean;
  onClose: () => void;
  overview: Overview;
  onCreated: () => void;
}

type Errors = Partial<Record<keyof NewInvitation | 'form', string>>;

export function NewInvitationDialog({ open, onClose, overview, onCreated }: Props) {
  const [issued, setIssued] = useState<IssuedCode | null>(null);
  const close = () => {
    setIssued(null);
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title={issued ? 'Invitation ready' : 'New invitation'}
      description={
        issued
          ? 'Send the code to the candidate now. It is shown only once.'
          : 'Creates a single-use access code for one candidate and one assessment.'
      }
    >
      {open &&
        (issued ? (
          <IssuedView issued={issued} onDone={close} />
        ) : (
          <InvitationForm
            overview={overview}
            onCancel={close}
            onIssued={(c) => {
              setIssued(c);
              onCreated();
            }}
          />
        ))}
    </Dialog>
  );
}

function InvitationForm({
  overview,
  onCancel,
  onIssued,
}: {
  overview: Overview;
  onCancel: () => void;
  onIssued: (c: IssuedCode) => void;
}) {
  const api = useAdminSession((s) => s.api);
  const templates = overview.templates.filter((t) => t.isActive);
  const [now] = useState(() => Date.now());
  const [v, setV] = useState({
    fullName: '',
    email: '',
    templateId: templates[0]?.id ?? '',
    from: toLocalInput(now),
    until: toLocalInput(now + 3 * DAY),
    roleApplied: templates[0]?.targetRole ?? '',
    experienceYears: '',
    requisitionId: '',
    assignedReviewerId: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV({ ...v, [k]: e.target.value });

  const validate = (): { input: NewInvitation } | { errors: Errors } => {
    const e: Errors = {};
    if (!v.fullName.trim()) e.fullName = 'Enter the candidate’s name.';
    if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
    if (!v.templateId) e.templateId = 'Choose an assessment.';
    const from = fromLocalInput(v.from);
    const until = fromLocalInput(v.until);
    if (from === null) e.validFromMs = 'Choose when the code starts working.';
    if (until === null) e.validUntilMs = 'Choose when the code stops working.';
    else if (from !== null && until <= from) e.validUntilMs = 'Must be after the start.';
    else if (until < Date.now() + 15 * 60_000) e.validUntilMs = 'Must be at least 15 minutes from now.';
    else if (until > Math.max(from ?? 0, Date.now()) + 60 * DAY) e.validUntilMs = 'At most 60 days.';
    if (v.experienceYears && !/^\d{1,2}(\.\d)?$/.test(v.experienceYears.trim()))
      e.experienceYears = 'A number of years, e.g. 7 or 7.5.';
    if (Object.keys(e).length) return { errors: e };
    return {
      input: {
        fullName: v.fullName.trim(),
        email: v.email.trim().toLowerCase(),
        templateId: v.templateId,
        validFromMs: from,
        validUntilMs: until ?? 0,
        roleApplied: v.roleApplied.trim(),
        experienceYears: v.experienceYears.trim(),
        requisitionId: v.requisitionId.trim(),
        notes: v.notes.trim(),
        assignedReviewerId: v.assignedReviewerId,
      },
    };
  };

  const submit = async (e: FormEvent, allowDuplicate = false) => {
    e.preventDefault();
    if (!api || busy) return;
    const checked = validate();
    if ('errors' in checked) return setErrors(checked.errors);
    setErrors({});
    setBusy(true);
    const r = await api.createInvitation({ ...checked.input, allowDuplicate });
    setBusy(false);
    if (r.ok) return onIssued(r);
    if (r.error === 'DUPLICATE_ACTIVE') return setDuplicateOf(r.invitationId ?? '');
    const fieldMap: Record<string, keyof NewInvitation> = {
      full_name: 'fullName',
      email: 'email',
      template_id: 'templateId',
      valid_from_ms: 'validFromMs',
      valid_until_ms: 'validUntilMs',
      experience_years: 'experienceYears',
      assigned_reviewer_id: 'assignedReviewerId',
    };
    const field = r.field ? fieldMap[r.field] : undefined;
    setErrors(field ? { [field]: adminErrorMessage(r) } : { form: adminErrorMessage(r) });
  };

  const quick = (days: number) => setV({ ...v, until: untilAfter(v.from, days) });
  const template = templates.find((t) => t.id === v.templateId);

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-5 pb-6">
      {errors.form && (
        <Alert tone="danger" live>
          {errors.form}
        </Alert>
      )}
      {duplicateOf !== null && (
        <Alert tone="warning" live title="This person already has a working code for this assessment">
          <p>
            Sending another code would leave two that work.{' '}
            {duplicateOf && (
              <Link className="font-medium text-link underline" to={`/admin/candidates/${duplicateOf}`}>
                Open the existing invitation
              </Link>
            )}{' '}
            to give them a new code there instead.
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            loading={busy}
            onClick={(e) => void submit(e as unknown as FormEvent, true)}
          >
            Create a second code anyway
          </Button>
        </Alert>
      )}
      {templates.length === 0 && (
        <Alert tone="warning">
          No assessment is active. Run the database scripts that load the questions first.
        </Alert>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Full name"
          value={v.fullName}
          onChange={set('fullName')}
          error={errors.fullName}
          required
          autoFocus
        />
        <TextField
          label="Email address"
          type="email"
          value={v.email}
          onChange={(e) => {
            setDuplicateOf(null);
            set('email')(e);
          }}
          error={errors.email}
          hint="The candidate signs in with this email."
          required
        />
      </div>
      <SelectField
        label="Assessment"
        value={v.templateId}
        onChange={(e) => {
          const t = templates.find((x) => x.id === e.target.value);
          setV({ ...v, templateId: e.target.value, roleApplied: v.roleApplied || t?.targetRole || '' });
        }}
        error={errors.templateId}
        hint={
          template ? `${template.durationMinutes} minutes · ${template.questionCount} questions` : undefined
        }
        required
      >
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Code works from"
          type="datetime-local"
          value={v.from}
          onChange={set('from')}
          error={errors.validFromMs}
          required
        />
        <div>
          <TextField
            label="Until"
            type="datetime-local"
            value={v.until}
            onChange={set('until')}
            error={errors.validUntilMs}
            required
          />
          <div className="mt-2 flex gap-2">
            {[1, 3, 7].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => quick(d)}
                className="cursor-pointer rounded-pill border border-border px-2.5 py-0.5 text-xs text-strong hover:bg-surface-sunken"
              >
                {d === 1 ? '24 hours' : `${d} days`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="-mt-2 text-sm text-muted">
        The window is for <em>starting</em>; once started, the test runs its full time. Times are in your time
        zone.
      </p>
      <div className="grid gap-5 sm:grid-cols-3">
        <TextField
          label="Role applied for"
          value={v.roleApplied}
          onChange={set('roleApplied')}
          maxLength={200}
        />
        <TextField
          label="Experience (years)"
          inputMode="decimal"
          value={v.experienceYears}
          onChange={set('experienceYears')}
          error={errors.experienceYears}
        />
        <TextField
          label="Requisition ID"
          value={v.requisitionId}
          onChange={set('requisitionId')}
          maxLength={100}
        />
      </div>
      {overview.reviewers.length > 0 && (
        <SelectField
          label="Reviewer"
          value={v.assignedReviewerId}
          onChange={set('assignedReviewerId')}
          error={errors.assignedReviewerId}
          hint="Reviewers see only the candidates assigned to them."
        >
          <option value="">Not assigned yet</option>
          {overview.reviewers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.fullName || r.email}
            </option>
          ))}
        </SelectField>
      )}
      <TextArea label="Notes for staff" rows={2} value={v.notes} onChange={set('notes')} maxLength={5000} />
      <div className="-mx-6 mt-1 flex justify-end gap-3 border-t border-border px-6 pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={busy} disabled={templates.length === 0}>
          Create code
        </Button>
      </div>
    </form>
  );
}

function IssuedView({ issued, onDone }: { issued: IssuedCode; onDone: () => void }) {
  const staff = useAdminSession((s) => s.staff);
  const email = useMemo(
    () =>
      invitationEmail({
        candidateName: issued.candidate.fullName,
        email: issued.candidate.email,
        accessCode: issued.accessCode,
        assessmentName: issued.template.name,
        durationMinutes: issued.template.durationMinutes,
        validFromMs: issued.validFromMs,
        validUntilMs: issued.validUntilMs,
        link: `${window.location.origin}/`,
        senderName: staff?.fullName || staff?.email || 'Zycus',
      }),
    [issued, staff],
  );
  return <CodeAndEmail code={issued.accessCode} to={issued.candidate.email} email={email} onDone={onDone} />;
}

/** The new code, once, with ways to send it. Also used after "New code" on a candidate page. */
export function CodeAndEmail({
  code,
  to,
  email,
  onDone,
  validUntilMs,
}: {
  code: string;
  to: string;
  email: { subject: string; body: string };
  onDone: () => void;
  validUntilMs?: number;
}) {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="rounded-lg border border-border bg-surface-tint p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Access code for {to}</p>
        <p
          className="mt-2 select-all font-mono text-3xl font-semibold tracking-[0.12em] text-strong"
          data-testid="access-code"
        >
          {code}
        </p>
        {validUntilMs && (
          <p className="mt-1 text-sm text-muted">Works until {formatDateTime(validUntilMs)}</p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <CopyButton text={code} label="Copy code" copied="Code copied" />
          <CopyButton
            text={`${email.subject}\n\n${email.body}`}
            label="Copy email text"
            copied="Email text copied"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <a
          href={mailtoLink(to, email.subject, email.body)}
          className="inline-flex h-10 items-center gap-2 rounded-pill border-2 border-primary bg-primary px-5 text-[15px] font-medium text-on-primary hover:bg-primary-hover"
        >
          <Mail className="size-4" aria-hidden="true" />
          Open in Outlook
        </a>
        <a
          href={outlookWebLink(to, email.subject, email.body)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-pill border-2 border-primary bg-surface px-5 text-[15px] font-medium text-primary hover:bg-primary-soft"
        >
          Outlook on the web
        </a>
      </div>
      <details className="rounded-md border border-border">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-strong">
          Preview the email
        </summary>
        <div className="border-t border-border px-4 py-3">
          <p className="text-sm font-medium text-strong">{email.subject}</p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-text">{email.body}</pre>
        </div>
      </details>
      <Alert tone="warning">
        The code is stored only as a fingerprint and can’t be shown again. If it’s lost, give the candidate a
        new code from their page.
      </Alert>
      <div className="-mx-6 flex justify-end border-t border-border px-6 pt-4">
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
