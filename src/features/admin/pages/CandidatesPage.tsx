import { clsx } from 'clsx';
import { Bot, ChevronRight, Plus, RefreshCw, Search, UserCheck, UsersRound, Video } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Alert, Badge, Button, Card, EmptyState, IconButton, Skeleton } from '@/design/components';
import { can, useAdminApi, useAdminSession } from '../adminSession';
import type { CandidateList, InvitationState, Overview } from '../api/types';
import { SelectField } from '../components/fields';
import { NewInvitationDialog } from '../components/NewInvitationDialog';
import { adminErrorMessage } from '../lib/errors';
import {
  formatDateTimeShort,
  formatRelative,
  formatUsd,
  STATE_META,
  STATE_ORDER,
  SUBMIT_REASON,
  testsTotal,
} from '../lib/format';
import { usePolling } from '../lib/usePolling';

export default function CandidatesPage() {
  const api = useAdminApi();
  const staff = useAdminSession((s) => s.staff);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [list, setList] = useState<CandidateList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [state, setState] = useState<InvitationState | ''>('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [o, l] = await Promise.all([
      can.invite(staff) ? api.overview() : Promise.resolve(null),
      api.listCandidates({ search, state }),
    ]);
    setLoading(false);
    if (o) {
      if (o.ok) setOverview(o);
      else return setError(adminErrorMessage(o));
    }
    if (l.ok) {
      setList(l);
      setError(null);
    } else setError(adminErrorMessage(l));
  }, [api, staff, search, state]);

  // Search as you type, a moment after the last key.
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(t);
  }, [load]);
  usePolling(load, 15_000);

  const now = list?.serverNowMs ?? 0;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-title">Candidates</h1>
          <p className="mt-1 text-sm text-muted">
            Invite candidates, follow their tests live and review results.
          </p>
        </div>
        {can.invite(staff) && (
          <Button
            leadingIcon={<Plus className="size-4" aria-hidden="true" />}
            onClick={() => setInviteOpen(true)}
            disabled={!overview}
          >
            New invitation
          </Button>
        )}
      </div>

      {overview && <OverviewCards overview={overview} />}

      <Card padding="none">
        <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
          <label className="relative min-w-56 flex-1">
            <span className="sr-only">Search</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={200}
              placeholder="Search name, email, requisition or code ending…"
              className="block h-10 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-[15px] focus:border-primary focus:shadow-focus focus:outline-none"
            />
          </label>
          <SelectField
            label={<span className="sr-only">Status</span>}
            value={state}
            onChange={(e) => setState(e.target.value as InvitationState | '')}
            containerClassName="w-48"
            className="h-10"
          >
            <option value="">All statuses</option>
            {STATE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATE_META[s].label}
              </option>
            ))}
          </SelectField>
          <IconButton
            label="Refresh"
            icon={<RefreshCw className={clsx('size-4', loading && 'animate-spin')} aria-hidden="true" />}
            onClick={() => void load()}
          />
        </div>

        {error && (
          <Alert tone="danger" className="m-4" live>
            {error}
          </Alert>
        )}
        {!list ? (
          <div className="flex flex-col gap-3 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : list.rows.length === 0 ? (
          <EmptyState
            icon={<UsersRound className="size-6" aria-hidden="true" />}
            title={search || state ? 'No candidates match' : 'No candidates yet'}
            description={
              search || state
                ? 'Try another search or status.'
                : 'Create an invitation to send a candidate their access code.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-surface-sunken/60 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Candidate</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">When</th>
                  <th className="px-4 py-2.5 font-medium">Proctoring</th>
                  <th className="px-4 py-2.5 font-medium">Tests passed</th>
                  <th className="px-4 py-2.5 font-medium">Assistant</th>
                  <th className="w-10 px-2" aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {list.rows.map((r) => {
                  const meta = STATE_META[r.state];
                  const tests = testsTotal(r);
                  const href = `/admin/candidates/${r.invitationId}`;
                  return (
                    <tr
                      key={r.invitationId}
                      className="group border-b border-border last:border-0 hover:bg-surface-sunken/50"
                    >
                      <td className="px-4 py-3">
                        <Link to={href} className="font-medium text-strong hover:text-link hover:underline">
                          {r.fullName}
                        </Link>
                        <p className="text-xs text-muted">
                          {r.email}
                          {r.requisitionId && ` · ${r.requisitionId}`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={meta.tone} dot={r.state === 'in_progress'}>
                          {meta.label}
                        </Badge>
                        {r.submitReason && r.state === 'submitted' && (
                          <p
                            className={clsx(
                              'mt-1 text-xs',
                              r.submitReason === 'violation_limit' ? 'text-danger' : 'text-muted',
                            )}
                          >
                            {SUBMIT_REASON[r.submitReason]}
                          </p>
                        )}
                        {r.reopenCount > 0 && (
                          <p className="mt-1 text-xs text-muted">Reopened ×{r.reopenCount}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {r.state === 'in_progress' && r.deadlineMs ? (
                          <span className="text-strong">Ends {formatRelative(r.deadlineMs, now)}</span>
                        ) : r.state === 'submitted' ? (
                          <>Submitted {formatDateTimeShort(r.submittedAtMs)}</>
                        ) : r.state === 'scheduled' ? (
                          <>Opens {formatDateTimeShort(r.validFromMs)}</>
                        ) : r.state === 'expired' ? (
                          <>Expired {formatDateTimeShort(r.validUntilMs)}</>
                        ) : (
                          <>
                            Code ••{r.codeHint} · until {formatDateTimeShort(r.validUntilMs)}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.sessionId && r.state !== 'signed_in' ? (
                          <span className="inline-flex gap-2">
                            <Badge tone={r.violationCount ? 'danger' : 'neutral'}>
                              {r.violationCount} violations
                            </Badge>
                            {r.flagCount > 0 && <Badge tone="warning">{r.flagCount} flags</Badge>}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {tests ? (
                          <span
                            className={
                              tests.passed === tests.total ? 'font-medium text-success' : 'text-strong'
                            }
                          >
                            {tests.passed} / {tests.total}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted tabular-nums">
                        {r.sessionId ? `${r.aiUsed} asked` : '—'}
                      </td>
                      <td className="px-2">
                        <Link
                          to={href}
                          aria-label={`Open ${r.fullName}`}
                          className="flex size-8 items-center justify-center rounded-full text-muted group-hover:text-strong"
                        >
                          <ChevronRight className="size-4" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {list.total > list.rows.length && (
              <p className="border-t border-border px-4 py-3 text-xs text-muted">
                Showing the newest {list.rows.length} of {list.total}. Search to find older ones.
              </p>
            )}
          </div>
        )}
      </Card>

      {overview && (
        <NewInvitationDialog
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          overview={overview}
          onCreated={() => void load()}
        />
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: 'live' | 'warning';
}) {
  return (
    <Card className="flex items-start gap-4" padding="md">
      <div
        className={clsx(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          tone === 'live'
            ? 'bg-success-surface text-success'
            : tone === 'warning'
              ? 'bg-warning-surface text-warning'
              : 'bg-surface-tint text-primary',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-strong">{value}</p>
        {detail && <p className="mt-0.5 text-xs text-muted">{detail}</p>}
      </div>
    </Card>
  );
}

function OverviewCards({ overview: o }: { overview: Overview }) {
  const left = Math.max(o.budget.capUsd - o.budget.spentUsd, 0);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        icon={<Video className="size-5" aria-hidden="true" />}
        label="Taking the test now"
        value={o.counts.inProgress}
        detail={`Up to ${o.settings.maxConcurrentSessions} at the same time`}
        tone={o.counts.inProgress ? 'live' : undefined}
      />
      <Stat
        icon={<UserCheck className="size-5" aria-hidden="true" />}
        label="Invited, not started"
        value={o.counts.invited}
        detail={`${o.counts.expired} expired`}
      />
      <Stat
        icon={<UsersRound className="size-5" aria-hidden="true" />}
        label="Submitted"
        value={o.counts.submitted}
        detail={`${o.counts.submittedLast7Days} in the last 7 days`}
      />
      <Stat
        icon={<Bot className="size-5" aria-hidden="true" />}
        label="Coding assistant"
        value={o.worker.online ? 'Online' : 'Offline'}
        tone={o.worker.online ? 'live' : 'warning'}
        detail={`${formatUsd(o.budget.spentUsd)} of ${formatUsd(o.budget.capUsd)} spent · ${formatUsd(left)} left`}
      />
    </div>
  );
}
