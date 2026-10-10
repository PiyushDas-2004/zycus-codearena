/** Conversation state of the coding assistant (one short thread per question, kept in memory). */
import { create } from 'zustand';

/** Limits matching the worker and the database (scripts/lib/assistantCore.ts, migration 0010). */
export const MAX_MESSAGE_CHARS = 500;
export const MAX_CODE_LINES = 60;
export const MAX_CODE_CHARS = 4000;

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantState {
  threads: Record<string, AssistantMessage[]>;
  pending: boolean;
  error: string | null;
  /** Questions left, from the last server reply (null until the first one). */
  remaining: number | null;
  cooldownUntil: number;
  set: (patch: Partial<Omit<AssistantState, 'set' | 'push' | 'unpush' | 'reset'>>) => void;
  push: (questionId: string, m: AssistantMessage) => void;
  /** Removes the last message (a question that wasn't answered). */
  unpush: (questionId: string) => void;
  reset: () => void;
}

const initial = { threads: {}, pending: false, error: null, remaining: null, cooldownUntil: 0 };

export const useAssistant = create<AssistantState>((set, get) => ({
  ...initial,
  set: (patch) => set(patch),
  push: (questionId, m) =>
    set({ threads: { ...get().threads, [questionId]: [...(get().threads[questionId] ?? []), m] } }),
  unpush: (questionId) =>
    set({ threads: { ...get().threads, [questionId]: (get().threads[questionId] ?? []).slice(0, -1) } }),
  reset: () => set(initial),
}));
