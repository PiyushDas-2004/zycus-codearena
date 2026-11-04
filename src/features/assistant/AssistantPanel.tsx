import { clsx } from 'clsx';
import { Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Alert, Button, Markdown, Spinner } from '@/design/components';
import { getCandidateApi } from '@/lib/api';
import type { CandidateErrorCode } from '@/lib/api/types';
import { useCandidateSession } from '../candidate/session/candidateSession';
import type { WorkspaceController } from '../workspace/WorkspaceController';
import { useWorkspaceUi } from '../workspace/workspaceStore';
import { MAX_CODE_CHARS, MAX_CODE_LINES, MAX_MESSAGE_CHARS, useAssistant } from './assistantStore';

const ERRORS: Partial<Record<CandidateErrorCode, string>> = {
  ASSISTANT_LIMIT: "You've used all your assistant questions for this assessment.",
  ASSISTANT_DISABLED: 'The coding assistant is not available for this assessment.',
  ASSISTANT_UNAVAILABLE: 'The assistant is unavailable right now. Keep working; try again in a few minutes.',
  NETWORK: "You're offline. The assistant needs a connection.",
  INVALID_PAYLOAD: 'Write a question of up to 500 characters.',
  SUBMITTED: 'Your assessment has been submitted.',
};

/**
 * A deliberately limited coding assistant (in the spirit of HackerRank's): it explains errors,
 * APIs and concepts and answers with nudges, but never solves the task. The limits are enforced on
 * the server (question budget, cooldown, size caps, reply filtering), not only here.
 */
export function AssistantPanel({
  controller,
  maxRequests,
}: {
  controller: WorkspaceController;
  maxRequests: number;
}) {
  const { questionId, title, locked, paused, set } = useWorkspaceUi(
    useShallow((s) => ({
      questionId: s.currentQuestionId,
      title: s.questions.find((q) => q.questionId === s.currentQuestionId)?.title ?? '',
      locked: s.locked,
      paused: s.paused,
      set: s.set,
    })),
  );
  const token = useCandidateSession((s) => s.token);
  const serverUsed = useCandidateSession((s) => s.state?.aiUsed ?? 0);
  const a = useAssistant();
  const thread = questionId ? (a.threads[questionId] ?? []) : [];
  const remaining = a.remaining ?? Math.max(0, maxRequests - serverUsed);
  const [text, setText] = useState('');
  const [includeCode, setIncludeCode] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const list = useRef<HTMLDivElement>(null);

  const cooldownLeft = Math.max(0, Math.ceil((a.cooldownUntil - now) / 1000));
  useEffect(() => {
    if (a.cooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [a.cooldownUntil]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [thread.length, a.pending]);

  const disabled =
    locked || paused || a.pending || remaining <= 0 || cooldownLeft > 0 || !token || !questionId;

  const ask = async (e?: FormEvent) => {
    e?.preventDefault();
    const message = text.trim();
    if (!message || disabled || !questionId || !token) return;
    // Read the selection now (the panel doesn't re-render while the candidate selects code).
    const selection = includeCode ? controller.selectedText(MAX_CODE_LINES, MAX_CODE_CHARS) : null;
    a.push(questionId, { role: 'user', content: message });
    a.set({ pending: true, error: null });
    setText('');
    const res = await getCandidateApi().askAssistant(token, {
      questionId,
      message,
      filePath: controller.activeFilePath(),
      code: selection?.text || null,
      history: thread.slice(-4).map((m) => ({ role: m.role, content: m.content.slice(0, 1200) })),
    });
    if (res.ok) {
      a.push(questionId, { role: 'assistant', content: res.reply });
      a.set({
        pending: false,
        remaining: res.remaining,
        cooldownUntil: Date.now() + res.cooldownSeconds * 1000,
      });
      setNow(Date.now());
    } else {
      const wait = res.error === 'ASSISTANT_COOLDOWN' ? (res.retryAfterSeconds ?? 10) : 0;
      a.set({
        pending: false,
        error:
          res.error === 'ASSISTANT_COOLDOWN'
            ? `Please wait ${wait} s before asking again.`
            : (ERRORS[res.error] ?? 'The assistant could not answer. Try again.'),
        remaining: res.error === 'ASSISTANT_LIMIT' ? 0 : a.remaining,
        cooldownUntil: wait ? Date.now() + wait * 1000 : a.cooldownUntil,
      });
      a.unpush(questionId);
      setText(message);
      setNow(Date.now());
    }
  };

  return (
    <section id="assistant-panel" aria-label="Coding assistant" className="flex h-full flex-col bg-surface">
      <header className="flex items-start gap-2 border-b border-border px-4 py-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Coding assistant</h2>
          <p className="text-xs text-muted">
            Hints only: it explains errors and concepts but won't solve the task. Questions and replies are
            recorded.
          </p>
        </div>
        <button
          type="button"
          onClick={() => set({ assistantOpen: false })}
          className="rounded-sm p-1 text-muted hover:bg-surface-sunken hover:text-strong"
          aria-label="Close coding assistant"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>

      <div ref={list} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
        {thread.length === 0 && !a.pending && (
          <p className="text-sm text-muted">
            Ask about an error message, an API, or a concept related to <em>{title}</em>. Example: “What does
            this TypeScript error mean?” or “When does a useEffect cleanup run?”
          </p>
        )}
        {thread.map((m, i) => (
          <div
            key={i}
            className={clsx(
              'rounded-lg px-3 py-2 text-sm',
              m.role === 'user' ? 'ml-6 bg-surface-tint text-strong' : 'mr-2 bg-surface-sunken',
            )}
          >
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {m.role === 'user' ? 'You' : 'Assistant'}
            </p>
            {m.role === 'assistant' ? (
              <Markdown className="text-sm">{m.content}</Markdown>
            ) : (
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
            )}
          </div>
        ))}
        {a.pending && (
          <p className="flex items-center gap-2 text-sm text-muted" role="status">
            <Spinner size={14} className="text-primary" label={null} /> Thinking…
          </p>
        )}
        {a.error && (
          <Alert tone="warning" live>
            {a.error}
          </Alert>
        )}
      </div>

      <form onSubmit={(e) => void ask(e)} className="border-t border-border px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeCode}
              onChange={(e) => setIncludeCode(e.target.checked)}
              className="size-3.5 accent-[var(--primary)]"
            />
            Include the code I've selected
          </label>
          <span className="tabular" aria-live="polite">
            {remaining} of {maxRequests} left
          </span>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void ask();
              }
            }}
            rows={2}
            maxLength={MAX_MESSAGE_CHARS}
            disabled={locked || paused || remaining <= 0}
            placeholder={remaining <= 0 ? 'No questions left' : 'Ask for a hint…'}
            aria-label="Your question for the assistant"
            className="min-h-[2.75rem] flex-1 resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-sm focus:border-primary focus:shadow-focus focus:outline-none disabled:bg-surface-sunken"
          />
          <Button
            type="submit"
            size="sm"
            disabled={disabled || !text.trim()}
            aria-label="Ask"
            className="h-[2.75rem] px-3"
            leadingIcon={<Send className="size-4" aria-hidden="true" />}
          >
            {cooldownLeft > 0 ? `${cooldownLeft}s` : 'Ask'}
          </Button>
        </div>
      </form>
    </section>
  );
}
