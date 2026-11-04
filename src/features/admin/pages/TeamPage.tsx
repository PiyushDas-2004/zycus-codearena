import { Plus, UserCog } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Dialog,
  LoadingState,
  TextField,
  toast,
} from '@/design/components';
import { ROLE_LABEL, useAdminApi, useAdminSession } from '../adminSession';
import type { Overview, StaffMember, StaffRole } from '../api/types';
import { SelectField } from '../components/fields';
import { adminErrorMessage } from '../lib/errors';
import { formatDateTimeShort } from '../lib/format';

export default function TeamPage() {
  const api = useAdminApi();
  const me = useAdminSession((s) => s.staff);
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<StaffMember> | null>(null);

  const load = useCallback(async () => {
    const [s, o] = await Promise.all([api.listStaff(), api.overview()]);
    if (s.ok) setStaff(s.staff);
    else setError(adminErrorMessage(s));
    if (o.ok) setOverview(o);
  }, [api]);
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  if (!staff) return error ? <Alert tone="danger">{error}</Alert> : <LoadingState />;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-light text-title">Team & settings</h1>
        <p className="mt-1 text-sm text-muted">Who can use the admin portal, and platform settings.</p>
      </div>
      <Card>
        <CardHeader
          title="Staff"
          description="Super Admins manage everything. Recruiters invite and monitor candidates. Reviewers see only the candidates assigned to them, read-only."
          actions={
            <Button
              size="sm"
              leadingIcon={<Plus className="size-4" aria-hidden="true" />}
              onClick={() => setEditing({ role: 'recruiter', isActive: true })}
            >
              Add staff
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Added</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-strong">{s.fullName || '—'}</p>
                    <p className="text-xs text-muted">{s.email}</p>
                  </td>
                  <td className="py-2.5 pr-4">{ROLE_LABEL[s.role]}</td>
                  <td className="py-2.5 pr-4">
                    {!s.isActive ? (
                      <Badge tone="neutral">Deactivated</Badge>
                    ) : s.signedInBefore ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="info">Hasn’t signed in yet</Badge>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-muted">{formatDateTimeShort(s.createdAtMs)}</td>
                  <td className="py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      leadingIcon={<UserCog className="size-4" aria-hidden="true" />}
                      onClick={() => setEditing(s)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Alert tone="info" className="mt-4" title="Adding someone takes two steps">
          <ol className="mt-1 list-decimal pl-5">
            <li>Add them here with their Zycus email and role.</li>
            <li>
              Create their sign-in in the Supabase dashboard:{' '}
              <strong>Authentication → Users → Add user → Create new user</strong>, with the same email, a
              temporary password and “Auto Confirm User” ticked. Share the password with them privately.
            </li>
          </ol>
        </Alert>
      </Card>
      {overview && <SettingsCard overview={overview} onSaved={() => void load()} />}
      {editing && (
        <StaffDialog
          member={editing}
          isMe={editing.email === me?.email}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function StaffDialog({
  member,
  isMe,
  onClose,
  onSaved,
}: {
  member: Partial<StaffMember>;
  isMe: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = useAdminApi();
  const [email, setEmail] = useState(member.email ?? '');
  const [name, setName] = useState(member.fullName ?? '');
  const [role, setRole] = useState<StaffRole>(member.role ?? 'recruiter');
  const [active, setActive] = useState(member.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    const r = await api.saveStaff(email.trim().toLowerCase(), name.trim(), role, active);
    setBusy(false);
    if (!r.ok) return setError(adminErrorMessage(r));
    toast.success('Saved');
    onSaved();
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={member.id ? 'Edit staff member' : 'Add staff member'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} disabled={!email.trim()} onClick={() => void save()}>
            Save
          </Button>
        </>
      }
    >
      {error && (
        <Alert tone="danger" live className="mb-4">
          {error}
        </Alert>
      )}
      <div className="flex flex-col gap-4">
        <TextField
          label="Zycus email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!!member.id}
          required
        />
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
        <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
          <option value="super_admin">Super Admin</option>
          <option value="recruiter">Recruiter</option>
          <option value="reviewer">Reviewer</option>
        </SelectField>
        <Checkbox
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          label="Active"
          description={
            isMe
              ? 'This is you. The last active Super Admin can’t be removed.'
              : 'Deactivated staff can no longer sign in to the portal.'
          }
        />
      </div>
    </Dialog>
  );
}

function SettingsCard({ overview, onSaved }: { overview: Overview; onSaved: () => void }) {
  const api = useAdminApi();
  const [max, setMax] = useState(String(overview.settings.maxConcurrentSessions));
  const [mail, setMail] = useState(overview.settings.grievanceContactEmail ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const n = Number(max);
  const bad = !/^\d{1,2}$/.test(max) || n < 1 || n > 50;
  return (
    <Card>
      <CardHeader title="Settings" />
      {error && (
        <Alert tone="danger" live className="mb-4">
          {error}
        </Alert>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Tests that may run at the same time"
          inputMode="numeric"
          value={max}
          onChange={(e) => setMax(e.target.value.trim())}
          error={bad ? 'Between 1 and 50.' : null}
          hint="A candidate who starts when this many tests are running is asked to wait. The free Supabase plan handles about 10 comfortably."
        />
        <TextField
          label="Privacy contact email"
          type="email"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          hint="Shown to candidates in the consent notice for privacy questions."
        />
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          loading={busy}
          disabled={bad}
          onClick={() => {
            setBusy(true);
            void api
              .updateSettings({ maxConcurrentSessions: n, grievanceContactEmail: mail.trim() })
              .then((r) => {
                setBusy(false);
                if (!r.ok) return setError(adminErrorMessage(r));
                setError(null);
                toast.success('Settings saved');
                onSaved();
              });
          }}
        >
          Save settings
        </Button>
      </div>
    </Card>
  );
}
