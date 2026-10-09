import { clsx } from 'clsx';
import { Circle, CircleDot, Flag } from 'lucide-react';
import type { ResponseStatus } from '@/lib/api/types';
import type { WorkspaceController } from '../WorkspaceController';
import { useWorkspaceUi } from '../workspaceStore';

const statusMeta: Record<ResponseStatus, { label: string; icon: typeof Circle; className: string }> = {
  not_started: { label: 'Not started', icon: Circle, className: 'text-icon-subtle' },
  in_progress: { label: 'In progress', icon: CircleDot, className: 'text-primary' },
  marked_for_review: { label: 'Marked for review', icon: Flag, className: 'text-warning' },
};

export function QuestionNavigator({ controller }: { controller: WorkspaceController }) {
  const { questions, currentQuestionId, statuses } = useWorkspaceUi();
  const counts = questions.reduce(
    (acc, q) => ({
      ...acc,
      [statuses[q.questionId] ?? 'not_started']: (acc[statuses[q.questionId] ?? 'not_started'] ?? 0) + 1,
    }),
    {} as Partial<Record<ResponseStatus, number>>,
  );
  return (
    <nav aria-label="Questions" className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <p className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">Questions</p>
      <ol className="flex flex-col gap-1 px-2">
        {questions.map((q) => {
          const status = statuses[q.questionId] ?? 'not_started';
          const meta = statusMeta[status];
          const current = q.questionId === currentQuestionId;
          return (
            <li key={q.questionId}>
              <button
                type="button"
                onClick={() => controller.selectQuestion(q.questionId)}
                aria-current={current ? 'step' : undefined}
                className={clsx(
                  'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                  current ? 'bg-surface-selected' : 'hover:bg-surface-sunken',
                )}
              >
                <span
                  className={clsx(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    current ? 'bg-primary text-on-primary' : 'bg-surface-sunken text-strong',
                  )}
                >
                  Q{q.position}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-strong">{q.title}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <meta.icon className={clsx('size-3', meta.className)} aria-hidden="true" />
                    {meta.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <dl className="mt-auto grid grid-cols-3 gap-1 border-t border-border px-4 py-3 text-center text-xs text-muted">
        {(Object.keys(statusMeta) as ResponseStatus[]).map((s) => (
          <div key={s}>
            <dt className="sr-only">{statusMeta[s].label}</dt>
            <dd className="flex flex-col items-center gap-0.5">
              <span className="tabular text-base font-semibold text-strong">{counts[s] ?? 0}</span>
              <span className="leading-tight">{statusMeta[s].label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </nav>
  );
}
