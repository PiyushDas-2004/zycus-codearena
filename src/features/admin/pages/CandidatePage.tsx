import { clsx } from 'clsx';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Alert, Badge, Card, IconButton, LoadingState } from '@/design/components';
import { useAdminApi } from '../adminSession';
import type { CandidateDetail } from '../api/types';
import { AssistantLog, MessagesLog } from '../components/AssistantLog';
import { Fact } from '../components/fields';
import { SessionActions } from '../components/SessionActions';
import { Snapshots } from '../components/Snapshots';
import { Timeline } from '../components/Timeline';
import { adminErrorMessage } from '../lib/errors';
import { violationSummary } from '../lib/events';
import { formatDateTime, formatDuration, formatRelative, STATE_META, SUBMIT_REASON } from '../lib/format';
import { usePolling } from '../lib/usePolling';

const CodeReview = lazy(() => import('../components/CodeReview'));

type Tab = 'timeline' | 'code' | 'webcam' | 'assistant' | 'messages';

/** One page per candidate: a new one (fresh state) when the address changes. */
export default function CandidatePageRoute() {
  const { invitationId = '' } = useParams();
  return <CandidatePage key={invitationId} invitationId={invitationId} />;
}

function CandidatePage({ invitationId }: { invitationId: string }) {
  const api = useAdminApi();
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('timeline');
  const [focusSnapshot, setFocusSnapshot] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api.candidateDetail(invitationId);
    setLoading(false);
    if (r.ok) {
      setDetail(r);
      setError(null);
    } else setError(adminErrorMessage(r));
  }, [api, invitationId]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);
  // Live while the test runs; otherwise now and then (someone else may act on it).
  usePolling(
    () => (detail?.state === 'in_progress' || detail?.state === 'signed_in' ? load() : undefined),
    10_000,
  );

  if (!detail) {
    return error ? (
      <Alert tone="danger" live title="Couldn’t open this candidate">
        {error}{' '}
        <Link className="font-medium underline" to="/admin">
          Back to candidates
        </Link>
      </Alert>
    ) : (
      <LoadingState />
    );
  }

  const s = detail.session;
  const meta = STATE_META[detail.state];
  const now = detail.serverNowMs;
  const violations = s ? violationSummary(s.violationCounts, detail.events) : [];
  const flags = detail.events.filter((e) => e.severity === 'flag').length;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'timeline', label: 'Timeline', count: detail.events.length },
    { id: 'code', label: 'Code & tests' },
    { id: 'webcam', label: 'Webcam', count: detail.snapshots.length },
    { id: 'assistant', label: 'Assistant', count: detail.assistant.length },
    { id: 'messages', label: 'Messages', count: detail.messages.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-link hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Candidates
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-light text-title">{detail.candidate.fullName}</h1>
              <Badge tone={meta.tone} dot={detail.state === 'in_progress'}>
                {meta.label}
              </Badge>
              {s && s.reopenCount > 0 && <Badge tone="neutral">Reopened ×{s.reopenCount}</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted">
              {detail.candidate.email}
              {detail.candidate.roleApplied && ` · ${detail.candidate.roleApplied}`}
              {detail.candidate.experienceYears !== null && ` · ${detail.candidate.experienceYears} yrs`}
              {detail.candidate.requisitionId && ` · ${detail.candidate.requisitionId}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SessionActions detail={detail} onChanged={() => void load()} />
            <IconButton
              label="Refresh"
              icon={<RefreshCw className={clsx('size-4', loading && 'animate-spin')} aria-hidden="true" />}
              onClick={() => void load()}
            />
          </div>
        </div>
        {error && (
          <Alert tone="danger" className="mt-3" live>
            {error}
          </Alert>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-4 font-semibold">Test</h2>
          <dl className="grid grid-cols-2 gap-4">
            <Fact label="Assessment">{detail.template.name}</Fact>
            <Fact label="Code">••••-••••-{detail.invitation.codeHint}</Fact>
            {s?.startedAtMs ? (
              <>
                <Fact label="Started">{formatDateTime(s.startedAtMs)}</Fact>
                {detail.state === 'in_progress' && s.deadlineMs ? (
                  <Fact label="Time left">
                    <span className="font-semibold">{formatDuration((s.deadlineMs - now) / 1000)}</span>
                  </Fact>
                ) : (
                  <Fact label="Ended">{formatDateTime(s.submittedAtMs)}</Fact>
                )}
                {s.submitReason && (
                  <Fact label="How it ended" className="col-span-2">
                    <span
                      className={s.submitReason === 'violation_limit' ? 'font-medium text-danger' : undefined}
                    >
                      {SUBMIT_REASON[s.submitReason]}
                    </span>
                  </Fact>
                )}
                {s.extensionSeconds > 0 && (
                  <Fact label="Extra time">{formatDuration(s.extensionSeconds)}</Fact>
                )}
                {detail.state === 'in_progress' && (
                  <Fact label="Last heard from">
                    {s.lastSeenMs ? formatRelative(s.lastSeenMs, now) : '—'}
                  </Fact>
                )}
              </>
            ) : (
              <>
                <Fact label="Code works">
                  {formatDateTime(detail.invitation.validFromMs)} –{' '}
                  {formatDateTime(detail.invitation.validUntilMs)}
                </Fact>
                <Fact label="Invited by">{detail.invitation.createdByEmail ?? '—'}</Fact>
              </>
            )}
          </dl>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Proctoring</h2>
          {s?.startedAtMs ? (
            <div className="flex flex-col gap-3 text-sm">
              <p>
                <span className="text-2xl font-semibold tabular-nums text-strong">{s.violationCount}</span>{' '}
                <span className="text-muted">counted violations · {flags} flags</span>
              </p>
              {violations.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {violations.map((v) => (
                    <li key={v.type}>
                      <Badge tone="danger">
                        {v.label} ×{v.count}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">
                  {s.violationsResetCount ? 'None since the warnings were reset.' : 'None.'}
                </p>
              )}
              {s.violationsResetCount > 0 && (
                <p className="text-xs text-muted">
                  Warnings were reset {s.violationsResetCount}× on reopening. Earlier ones are kept in the
                  timeline.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">Not started yet.</p>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Device</h2>
          {s ? (
            <Device info={s.clientInfo} logins={s.loginCount} />
          ) : (
            <p className="text-sm text-muted">Hasn’t signed in yet.</p>
          )}
        </Card>
      </div>

      <Card padding="none">
        <div
          role="tablist"
          aria-label="Details"
          className="flex gap-1 overflow-x-auto border-b border-border px-3"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                '-mb-px cursor-pointer whitespace-nowrap border-b-2 px-3 py-3 text-sm',
                tab === t.id
                  ? 'border-primary font-medium text-primary'
                  : 'border-transparent text-strong hover:text-primary',
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1.5 text-xs text-muted">{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="p-4 sm:p-6" role="tabpanel">
          {tab === 'timeline' && (
            <Timeline
              detail={detail}
              onShowSnapshot={(id) => {
                setFocusSnapshot(id);
                setTab('webcam');
              }}
            />
          )}
          {tab === 'code' && (
            <Suspense fallback={<LoadingState label="Opening the code…" />}>
              <CodeReview detail={detail} />
            </Suspense>
          )}
          {tab === 'webcam' && <Snapshots detail={detail} focusId={focusSnapshot} />}
          {tab === 'assistant' && <AssistantLog detail={detail} />}
          {tab === 'messages' && <MessagesLog detail={detail} />}
        </div>
      </Card>
    </div>
  );
}

function Device({ info, logins }: { info: Record<string, unknown>; logins: number }) {
  const screen = (info.screen ?? {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '—');
  return (
    <dl className="grid grid-cols-2 gap-4">
      <Fact label="Browser">
        {text(info.browser)} {typeof info.browser_version === 'number' ? info.browser_version : ''}
      </Fact>
      <Fact label="System">{text(info.platform)}</Fact>
      <Fact label="Screen">{screen.width ? `${text(screen.width)} × ${text(screen.height)}` : '—'}</Fact>
      <Fact label="Time zone">{text(info.timezone)}</Fact>
      <Fact label="Sign-ins">{logins}</Fact>
      <Fact label="Second display">
        {info.extended_display === true ? 'Yes' : info.extended_display === false ? 'No' : 'Unknown'}
      </Fact>
    </dl>
  );
}
