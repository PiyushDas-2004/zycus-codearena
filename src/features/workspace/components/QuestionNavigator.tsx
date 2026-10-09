import { clsx } from 'clsx';
import { Circle, CircleDot, Flag } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { ResponseStatus } from '@/lib/api/types';
import type { WorkspaceController } from '../WorkspaceController';
import { useWorkspaceUi } from '../workspaceStore';

const statusMeta: Record<ResponseStatus, { label: string; icon: typeof Circle; className: string }> = {
  not_started: { label: 'Not started', icon: Circle, className: 'text-icon-subtle' },
  in_progress: { label: 'In progress', icon: CircleDot, className: 'text-primary' },
  marked_for_review: { label: 'Marked for review', icon: Flag, className: 'text-warning' },
};

/** Full list from 1280 px; a compact rail of question numbers on narrower windows. */
export function QuestionNavigator({ controller }: { controller: WorkspaceController }) {
  const { questions, currentQuestionId, statuses } = useWorkspaceUi(
    useShallow((s) => ({
      questions: s.questions,
      currentQuestionId: s.currentQuestionId,
      statuses: s.statuses,
    })),
  );
  const counts: Partial<Record<ResponseStatus, number>> = {};
  for (const q of questions) {
    const st = statuses[q.questionId] ?? 'not_started';
    counts[st] = (counts[st] ?? 0) + 1;
  }
  return (
    <nav
      aria-label="Questions"
      className="flex w-16 shrink-0 flex-col border-r border-border bg-surface xl:w-60"
    >
      <p className="hidden px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-muted xl:block">
        Questions
      </p>
      <ol className="flex flex-col gap-1 px-2 pt-3 xl:pt-0">
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
                aria-label={`Question ${q.position}: ${q.title} (${meta.label})`}
                title={`Q${q.position}. ${q.title} · ${meta.label}`}
                className={clsx(
                  'flex w-full items-start justify-center gap-3 rounded-md px-1 py-2.5 text-left transition-colors xl:justify-start xl:px-3',
                  current ? 'bg-surface-selected' : 'hover:bg-surface-sunken',
                )}
              >
                <span
                  className={clsx(
                    'relative flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold xl:size-7',
                    current ? 'bg-primary text-on-primary' : 'bg-surface-sunken text-strong',
                  )}
                >
                  Q{q.position}
                  {/* Status dot on the compact rail. */}
                  <meta.icon
                    className={clsx(
                      'absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-surface xl:hidden',
                      meta.className,
                    )}
                    aria-hidden="true"
                  />
                </span>
                <span className="hidden min-w-0 flex-1 xl:block">
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
      <dl className="mt-auto hidden grid-cols-3 gap-1 border-t border-border px-4 py-3 text-center text-xs text-muted xl:grid">
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
