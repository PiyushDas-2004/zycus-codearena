/** UI state of the workspace (React re-renders from here). File contents live in the controller. */
import { create } from 'zustand';
import { loadTheme, saveTheme } from '@/design/theme';
import type { ResponseStatus, StaffMessage, WorkspaceQuestion } from '@/lib/api/types';
import type { SaveStatus } from '@/lib/sync/syncEngine';

export type SubmitPhase = 'idle' | 'confirm' | 'submitting' | 'retrying' | 'done';

export interface EditorPrefs {
  theme: 'light' | 'dark';
  fontSize: number;
}

interface WorkspaceUiState {
  questions: WorkspaceQuestion[];
  currentQuestionId: string | null;
  openTabs: Record<string, string[]>;
  activeFile: Record<string, string | null>;
  statuses: Record<string, ResponseStatus>;
  notes: Record<string, string>;
  /** fileKey → differs from the starter content. */
  modified: Record<string, boolean>;
  saveStatus: SaveStatus;
  deadlineMs: number | null;
  locked: boolean;
  submitPhase: SubmitPhase;
  submitAttempts: number;
  timeUp: boolean;
  /** Auto-submitting because the proctoring violation limit was reached. */
  limitReached: boolean;
  /** A proctoring condition (full screen, camera, display) must be resolved before working on. */
  paused: boolean;
  messages: StaffMessage[];
  prefs: EditorPrefs;
  set: (patch: Partial<Omit<WorkspaceUiState, 'set' | 'reset'>>) => void;
  reset: () => void;
}

const PREFS_KEY = 'codearena.editor.prefs';

function loadPrefs(): EditorPrefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<EditorPrefs>;
    return { theme: loadTheme(), fontSize: Math.min(22, Math.max(11, p.fontSize ?? 14)) };
  } catch {
    return { theme: loadTheme(), fontSize: 14 };
  }
}

/** Remembers the workspace theme (applied to the whole workspace page) and editor font size. */
export function savePrefs(prefs: EditorPrefs) {
  saveTheme(prefs.theme);
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ fontSize: prefs.fontSize }));
  } catch {
    /* ignore */
  }
}

const initial = () => ({
  questions: [],
  currentQuestionId: null,
  openTabs: {},
  activeFile: {},
  statuses: {},
  notes: {},
  modified: {},
  saveStatus: { phase: 'idle' as const, lastServerSaveAt: null, unsyncedItems: 0, consecutiveFailures: 0 },
  deadlineMs: null,
  locked: false,
  submitPhase: 'idle' as SubmitPhase,
  submitAttempts: 0,
  timeUp: false,
  limitReached: false,
  paused: false,
  messages: [],
  prefs: loadPrefs(),
});

export const useWorkspaceUi = create<WorkspaceUiState>((set) => ({
  ...initial(),
  set: (patch) => set(patch),
  reset: () => set(initial()),
}));
