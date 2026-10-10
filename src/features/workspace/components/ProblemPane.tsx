import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Badge, Button, Markdown } from '@/design/components';
import type { WorkspaceController } from '../WorkspaceController';
import { useWorkspaceUi } from '../workspaceStore';

/** Markdown is parsed only when the statement changes. */
const Statement = memo(function Statement({ md }: { md: string }) {
  return <Markdown className="prose-candidate">{md}</Markdown>;
});

/** The question statement (the question list and the assistant open over it). */
export function ProblemPane({
  controller,
  protectContent,
}: {
  controller: WorkspaceController;
  protectContent: boolean;
}) {
  const { q, prev, next, total, status, disabled } = useWorkspaceUi(
    useShallow((s) => {
      const i = s.questions.findIndex((x) => x.questionId === s.currentQuestionId);
      const q = s.questions[i];
      return {
        q,
        prev: s.questions[i - 1]?.questionId ?? null,
        next: s.questions[i + 1]?.questionId ?? null,
        total: s.questions.length,
        status: (q && s.statuses[q.questionId]) ?? 'not_started',
        disabled: s.locked || s.paused,
      };
    }),
  );
  if (!q) return null;
  const marked = status === 'marked_for_review';
  const nav =
    'rounded-sm p-0.5 text-muted transition-colors hover:bg-surface-sunken hover:text-strong disabled:opacity-40';

  return (
    <section aria-labelledby="question-title" className="@container flex h-full flex-col bg-surface">
      <div className="flex items-start gap-2 border-b border-border px-4 py-3 @md:gap-3 @md:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted">
            <button
              type="button"
              className={nav}
              disabled={!prev}
              onClick={() => prev && controller.selectQuestion(prev)}
              aria-label="Previous question"
              title="Previous question"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </button>
            <span>
              Question {q.position} of {total}
            </span>
            <button
              type="button"
              className={nav}
              disabled={!next}
              onClick={() => next && controller.selectQuestion(next)}
              aria-label="Next question"
              title="Next question"
            >
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <h1
            id="question-title"
            className="mt-0.5 text-base font-semibold leading-snug break-words @md:text-lg"
          >
            {q.title}
          </h1>
        </div>
        {marked && (
          <Badge tone="warning" className="hidden @lg:inline-flex">
            Marked for review
          </Badge>
        )}
        <Button
          size="sm"
          variant={marked ? 'secondary' : 'ghost'}
          leadingIcon={<Flag className="size-4" />}
          onClick={() => controller.toggleReview(q.questionId)}
          disabled={disabled}
          aria-pressed={marked}
          aria-label={marked ? 'Unmark for review' : 'Mark for review'}
          title={marked ? 'Unmark for review' : 'Mark for review'}
          className="shrink-0"
        >
          <span className="hidden @sm:inline">{marked ? 'Unmark' : 'Mark for review'}</span>
        </Button>
      </div>
      <div
        className={clsx('flex-1 overflow-y-auto px-4 py-4 @md:px-5', protectContent && 'select-none')}
        data-protected={protectContent || undefined}
        onContextMenu={protectContent ? (e) => e.preventDefault() : undefined}
      >
        <Statement md={q.statementMd} />
      </div>
    </section>
  );
}
