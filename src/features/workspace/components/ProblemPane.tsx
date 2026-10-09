import { clsx } from 'clsx';
import { Flag } from 'lucide-react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { Badge, Button, Markdown } from '@/design/components';
import type { WorkspaceController } from '../WorkspaceController';
import { useWorkspaceUi } from '../workspaceStore';

const NOTES_MAX = 20_000;

export function ProblemPane({
  controller,
  protectContent,
}: {
  controller: WorkspaceController;
  protectContent: boolean;
}) {
  const { questions, currentQuestionId, statuses, notes, locked, paused } = useWorkspaceUi();
  const q = questions.find((x) => x.questionId === currentQuestionId);
  if (!q) return null;
  const status = statuses[q.questionId] ?? 'not_started';
  const value = notes[q.questionId] ?? '';

  return (
    <Group orientation="vertical" className="h-full">
      <Panel defaultSize="68" minSize="25">
        <section aria-labelledby="question-title" className="flex h-full flex-col bg-surface">
          <div className="flex items-start gap-3 border-b border-border px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Question {q.position} of {questions.length}
              </p>
              <h1 id="question-title" className="mt-0.5 text-lg font-semibold leading-snug">
                {q.title}
              </h1>
            </div>
            {status === 'marked_for_review' && <Badge tone="warning">Marked for review</Badge>}
            <Button
              size="sm"
              variant={status === 'marked_for_review' ? 'secondary' : 'ghost'}
              leadingIcon={<Flag className="size-4" />}
              onClick={() => controller.toggleReview(q.questionId)}
              disabled={locked || paused}
              aria-pressed={status === 'marked_for_review'}
            >
              {status === 'marked_for_review' ? 'Unmark' : 'Mark for review'}
            </Button>
          </div>
          <div
            className={clsx('flex-1 overflow-y-auto px-5 py-4', protectContent && 'select-none')}
            data-protected={protectContent || undefined}
            onContextMenu={protectContent ? (e) => e.preventDefault() : undefined}
          >
            <Markdown className="prose-candidate">{q.statementMd}</Markdown>
          </div>
        </section>
      </Panel>
      <Separator className="h-1.5 bg-border transition-colors hover:bg-separator-hover data-[separator=active]:bg-primary" />
      <Panel defaultSize="32" minSize="15">
        <section className="flex h-full flex-col bg-surface px-5 py-3">
          <div className="flex items-baseline justify-between">
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
            disabled={locked || paused}
            spellCheck
            onChange={(e) => controller.setNotes(q.questionId, e.target.value)}
            placeholder="1. Search didn't refetch because…"
          />
        </section>
      </Panel>
    </Group>
  );
}
