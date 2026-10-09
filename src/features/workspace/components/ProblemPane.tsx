import { clsx } from 'clsx';
import { Flag } from 'lucide-react';
import { memo } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useShallow } from 'zustand/react/shallow';
import { Badge, Button, Markdown } from '@/design/components';
import type { WorkspaceController } from '../WorkspaceController';
import { useWorkspaceUi } from '../workspaceStore';

const NOTES_MAX = 20_000;

/** Markdown is parsed only when the statement changes, not on every keystroke in the notes. */
const Statement = memo(function Statement({ md }: { md: string }) {
  return <Markdown className="prose-candidate">{md}</Markdown>;
});

export function ProblemPane({
  controller,
  protectContent,
}: {
  controller: WorkspaceController;
  protectContent: boolean;
}) {
  const { q, total, status, value, disabled } = useWorkspaceUi(
    useShallow((s) => {
      const q = s.questions.find((x) => x.questionId === s.currentQuestionId);
      return {
        q,
        total: s.questions.length,
        status: (q && s.statuses[q.questionId]) ?? 'not_started',
        value: (q && s.notes[q.questionId]) ?? '',
        disabled: s.locked || s.paused,
      };
    }),
  );
  if (!q) return null;
  const marked = status === 'marked_for_review';

  return (
    <Group orientation="vertical" className="h-full">
      <Panel defaultSize="68" minSize={160}>
        <section aria-labelledby="question-title" className="@container flex h-full flex-col bg-surface">
          <div className="flex items-start gap-2 border-b border-border px-4 py-3 @md:gap-3 @md:px-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Question {q.position} of {total}
              </p>
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
      </Panel>
      <Separator className="h-1.5 bg-border transition-colors hover:bg-separator-hover data-[separator=active]:bg-primary" />
      <Panel defaultSize="32" minSize={110}>
        <section className="flex h-full flex-col bg-surface px-4 py-3 @md:px-5">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="explain-fix" className="text-sm font-semibold text-strong">
              Explain your fix
            </label>
            <span className="tabular text-xs text-muted">
              {value.length.toLocaleString()} / {NOTES_MAX.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted">For each bug: the root cause, what you changed, and why.</p>
          <textarea
            id="explain-fix"
            data-proctor-notes
            className="mt-2 w-full flex-1 resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-sm leading-relaxed focus:border-primary focus:shadow-focus focus:outline-none disabled:bg-surface-sunken"
            value={value}
            maxLength={NOTES_MAX}
            disabled={disabled}
            spellCheck
            onChange={(e) => controller.setNotes(q.questionId, e.target.value)}
            placeholder="1. Search didn't refetch because…"
          />
        </section>
      </Panel>
    </Group>
  );
}
