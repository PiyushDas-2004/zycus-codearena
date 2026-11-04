import { clsx } from 'clsx';
import { Circle, CircleDot, Flag } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { ResponseStatus } from '@/lib/api/types';
import { questionsHover } from '../flyoutHover';
import type { WorkspaceController } from '../WorkspaceController';
import { useWorkspaceUi } from '../workspaceStore';

const statusMeta: Record<ResponseStatus, { label: string; icon: typeof Circle; className: string }> = {
  not_started: { label: 'Not started', icon: Circle, className: 'text-icon-subtle' },
  in_progress: { label: 'In progress', icon: CircleDot, className: 'text-primary' },
  marked_for_review: { label: 'Marked for review', icon: Flag, className: 'text-warning' },
};

/** The question list, shown over the statement while the Questions button is hovered. */
export function QuestionsFlyout({ controller }: { controller: WorkspaceController }) {
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
    <section
      id="questions-flyout"
      aria-label="Questions"
      onMouseEnter={questionsHover.enter}
      onMouseLeave={questionsHover.leave}
      onKeyDown={(e) => e.key === 'Escape' && questionsHover.close()}
      className="flex h-full flex-col bg-surface"
    >
      <p className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">Questions</p>
      <ol className="flex flex-col gap-1 overflow-y-auto px-2">
        {questions.map((q) => {
          const status = statuses[q.questionId] ?? 'not_started';
          const meta = statusMeta[status];
          const current = q.questionId === currentQuestionId;
          return (
            <li key={q.questionId}>
              <button
                type="button"
                onClick={() => {
                  controller.selectQuestion(q.questionId);
                  questionsHover.close();
                }}
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
                  <span className="text-sm font-medium leading-snug text-strong">{q.title}</span>
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
    </section>
  );
}
