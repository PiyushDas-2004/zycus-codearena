import { Bot, MessageSquare } from 'lucide-react';
import { Badge, EmptyState, Markdown } from '@/design/components';
import type { CandidateDetail } from '../api/types';
import { questionLabel } from '../lib/events';
import { formatDateTimeShort, formatTime, formatUsd } from '../lib/format';

export function AssistantLog({ detail }: { detail: CandidateDetail }) {
  if (!detail.assistant.length) {
    return (
      <EmptyState
        icon={<Bot className="size-6" aria-hidden="true" />}
        title="The assistant wasn’t used"
        description="Every question the candidate asks the coding assistant, and its reply, appears here."
      />
    );
  }
  const cost = detail.assistant.reduce((a, x) => a + (x.costUsd ?? 0), 0);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {detail.assistant.length} questions · cost {formatUsd(cost)}
      </p>
      {detail.assistant.map((a) => (
        <article key={a.id} className="rounded-lg border border-border">
          <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted">
            <span className="tabular-nums">{formatTime(a.createdAtMs)}</span>
            <Badge tone="neutral">{questionLabel(detail.questions, a.questionId)}</Badge>
            {a.filePath && <span className="font-mono">{a.filePath}</span>}
            {a.status !== 'answered' && (
              <Badge tone="warning">{a.status === 'failed' ? 'No answer (refunded)' : a.status}</Badge>
            )}
            {a.latencyMs !== null && <span className="ml-auto">{(a.latencyMs / 1000).toFixed(1)} s</span>}
          </header>
          <div className="px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Candidate asked</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-strong">{a.prompt}</p>
            {a.codeExcerpt && (
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-surface-sunken px-3 py-2 font-mono text-xs">
                {a.codeExcerpt}
              </pre>
            )}
            {a.reply && (
              <>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">
                  Assistant replied
                </p>
                <div className="mt-1 text-sm">
                  <Markdown>{a.reply}</Markdown>
                </div>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export function MessagesLog({ detail }: { detail: CandidateDetail }) {
  if (!detail.messages.length) {
    return (
      <EmptyState
        icon={<MessageSquare className="size-6" aria-hidden="true" />}
        title="No messages"
        description="Messages staff send during the test appear here, with when the candidate saw them."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {detail.messages.map((m) => (
        <li key={m.id} className="rounded-lg border border-border px-4 py-3">
          <p className="whitespace-pre-wrap text-sm text-strong">{m.body}</p>
          <p className="mt-2 text-xs text-muted">
            Sent {formatDateTimeShort(m.sentAtMs)}
            {m.sentByEmail && ` by ${m.sentByEmail}`} ·{' '}
            {m.acknowledgedAtMs
              ? `read ${formatTime(m.acknowledgedAtMs)}`
              : m.deliveredAtMs
                ? `delivered ${formatTime(m.deliveredAtMs)}`
                : 'not delivered yet'}
          </p>
        </li>
      ))}
    </ul>
  );
}
