import { clsx } from 'clsx';
import { ListChecks, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { questionsHover } from '../flyoutHover';
import { useWorkspaceUi } from '../workspaceStore';

/**
 * Slim tool bar on the left edge (VS Code style), so the code gets the room:
 * - Questions: hover (or click / keyboard focus) slides the question list over the statement.
 * - Statement: hides or shows the question statement pane.
 * - Assistant: opens/closes the coding assistant in the same place as the question list.
 */
export function ActivityBar({
  assistantEnabled,
  onToggleStatement,
}: {
  assistantEnabled: boolean;
  onToggleStatement: () => void;
}) {
  const { questionsOpen, assistantOpen, statementCollapsed, position, total, set } = useWorkspaceUi(
    useShallow((s) => ({
      questionsOpen: s.questionsOpen,
      assistantOpen: s.assistantOpen,
      statementCollapsed: s.statementCollapsed,
      position: s.questions.find((q) => q.questionId === s.currentQuestionId)?.position ?? 0,
      total: s.questions.length,
      set: s.set,
    })),
  );

  return (
    <nav
      aria-label="Workspace tools"
      className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface py-2"
    >
      <ToolButton
        label={`Questions (${position} of ${total})`}
        active={questionsOpen}
        aria-expanded={questionsOpen}
        aria-controls="questions-flyout"
        onMouseEnter={questionsHover.enter}
        onMouseLeave={questionsHover.leave}
        onFocus={questionsHover.enter}
        onBlur={questionsHover.leave}
        onClick={() => set({ questionsOpen: !questionsOpen })}
      >
        <ListChecks className="size-5" aria-hidden="true" />
        <span className="tabular absolute -bottom-0.5 -right-0.5 rounded-sm bg-primary px-1 text-[9px] font-semibold leading-tight text-on-primary">
          {position}/{total}
        </span>
      </ToolButton>
      <ToolButton
        label={statementCollapsed ? 'Show question' : 'Hide question (more room for code)'}
        onClick={onToggleStatement}
      >
        {statementCollapsed ? (
          <PanelLeftOpen className="size-5" aria-hidden="true" />
        ) : (
          <PanelLeftClose className="size-5" aria-hidden="true" />
        )}
      </ToolButton>
      {assistantEnabled && (
        <ToolButton
          label={assistantOpen ? 'Close coding assistant' : 'Coding assistant (hints only)'}
          active={assistantOpen}
          aria-expanded={assistantOpen}
          aria-controls="assistant-panel"
          onClick={() => set({ assistantOpen: !assistantOpen, questionsOpen: false })}
        >
          <Sparkles className="size-5" aria-hidden="true" />
        </ToolButton>
      )}
    </nav>
  );
}

function ToolButton({
  label,
  active,
  children,
  ...rest
}: {
  label: string;
  active?: boolean;
  children: ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'relative flex size-10 items-center justify-center rounded-md transition-colors',
        active ? 'bg-surface-selected text-primary' : 'text-muted hover:bg-surface-sunken hover:text-strong',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
