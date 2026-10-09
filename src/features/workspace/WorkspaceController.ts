/**
 * Owns everything stateful in the exam workspace outside React: one Monaco model per file (so undo
 * history survives tab switches), the sync engine, and the keystroke-replay recorder. React
 * components read UI state from useWorkspaceUi and call methods here.
 */
import type * as Monaco from 'monaco-editor';
import type {
  CandidateApi,
  ResponseStatus,
  SessionState,
  StarterFile,
  Workspace,
  WorkspaceQuestion,
} from '@/lib/api/types';
import { createBackup, downloadBackup } from '@/lib/backup/backupFile';
import { fileKey, saveRecord, type LocalRecord } from '@/lib/persist/localRecord';
import { ReplayRecorder } from '@/lib/replay/recorder';
import { SyncEngine, type FatalCode } from '@/lib/sync/syncEngine';
import type { ServerClock } from '@/lib/time/serverClock';
import { monacoLanguage } from './editor/monacoSetup';
import { useWorkspaceUi } from './workspaceStore';

export interface ControllerOptions {
  monaco: typeof Monaco;
  api: CandidateApi;
  token: string;
  workspace: Workspace;
  record: LocalRecord;
  resumed: boolean;
  clock: ServerClock;
  candidateName: string;
  onState: (state: SessionState) => void;
  onFatal: (code: FatalCode) => void;
}

export class WorkspaceController {
  readonly engine: SyncEngine;
  readonly recorder: ReplayRecorder;
  readonly questions: WorkspaceQuestion[];
  editor: Monaco.editor.IStandaloneCodeEditor | null = null;

  private readonly models = new Map<string, Monaco.editor.ITextModel>();
  private readonly starters = new Map<string, StarterFile>();
  private readonly viewStates = new Map<string, Monaco.editor.ICodeEditorViewState | null>();
  private readonly positions = new Map<string, number>();
  private readonly disposables: Monaco.IDisposable[] = [];
  private readonly editorListeners = new Set<{
    cb: (editor: Monaco.editor.IStandaloneCodeEditor) => () => void;
    cleanup?: () => void;
  }>();
  private startedAtMs: number;
  /** >0 while the app itself edits a model (e.g. reset), so detectors can ignore those changes. */
  programmaticEdits = 0;

  constructor(private readonly o: ControllerOptions) {
    this.questions = o.workspace.questions;
    this.startedAtMs = o.workspace.state.startedAtMs ?? o.clock.now();
    this.engine = new SyncEngine({
      api: o.api,
      token: o.token,
      record: o.record,
      clock: o.clock,
      persist: saveRecord,
      onState: (s) => this.handleState(s),
      onFatal: o.onFatal,
      onStatus: (saveStatus) => useWorkspaceUi.getState().set({ saveStatus }),
      beforeSync: () => this.recorder.flush(),
      getHeartbeat: () => ({
        current_question_id: useWorkspaceUi.getState().currentQuestionId,
        visible: document.visibilityState === 'visible',
        online: navigator.onLine,
      }),
    });

    this.recorder = new ReplayRecorder(
      () => this.o.clock.now() - this.startedAtMs,
      (chunk) => this.engine.enqueueChunk(chunk),
    );
    for (const q of this.questions) {
      this.positions.set(q.questionId, q.position);
      for (const f of q.files) {
        const key = fileKey(q.questionId, f.path);
        this.starters.set(key, f);
        const content = o.record.files[key]?.content ?? f.content;
        const uri = o.monaco.Uri.parse(`file:///q${q.position}/${f.path}`);
        o.monaco.editor.getModel(uri)?.dispose();
        const model = o.monaco.editor.createModel(content, monacoLanguage(f.language), uri);
        this.models.set(key, model);
        this.disposables.push(
          model.onDidChangeContent((e) => this.onModelChange(q.questionId, f.path, model, e)),
        );
        this.recorder.record({ k: 'snap', q: q.position, f: f.path, v: content });
      }
    }
    if (o.resumed) this.engine.enqueueEvent({ type: 'page_resume', details: { reason: 'reload_or_reopen' } });
    this.initUi();
  }

  private initUi() {
    const rec = this.o.record;
    const ui = useWorkspaceUi.getState();
    const statuses: Record<string, ResponseStatus> = {};
    const notes: Record<string, string> = {};
    const openTabs: Record<string, string[]> = {};
    const activeFile: Record<string, string | null> = {};
    const modified: Record<string, boolean> = {};
    for (const q of this.questions) {
      statuses[q.questionId] = rec.responses[q.questionId]?.status ?? 'not_started';
      notes[q.questionId] = rec.responses[q.questionId]?.notes ?? '';
      const firstEditable = q.files.find((f) => !f.readonly)?.path ?? q.files[0]?.path ?? null;
      const tabs = (rec.ui.openTabs[q.questionId] ?? []).filter((p) => q.files.some((f) => f.path === p));
      openTabs[q.questionId] = tabs.length ? tabs : firstEditable ? [firstEditable] : [];
      activeFile[q.questionId] = rec.ui.activeFile[q.questionId] ?? openTabs[q.questionId]?.[0] ?? null;
      for (const f of q.files) {
        const key = fileKey(q.questionId, f.path);
        modified[key] = (this.models.get(key)?.getValue() ?? f.content) !== f.content;
      }
    }
    ui.set({
      questions: this.questions,
      currentQuestionId: rec.ui.currentQuestionId ?? this.questions[0]?.questionId ?? null,
      statuses,
      notes,
      openTabs,
      activeFile,
      modified,
      deadlineMs: this.o.workspace.state.deadlineMs,
      messages: this.o.workspace.state.messages,
      saveStatus: this.engine.saveStatus,
    });
  }

  start() {
    this.engine.start();
  }

  dispose() {
    this.recorder.flush();
    this.engine.stop();
    for (const l of this.editorListeners) l.cleanup?.();
    this.editorListeners.clear();
    this.disposables.forEach((d) => d.dispose());
    this.models.forEach((m) => m.dispose());
    this.models.clear();
    this.editor = null;
  }

  // ── State from the server ────────────────────────────────────────────────
  private handleState(state: SessionState) {
    const ui = useWorkspaceUi.getState();
    if (state.deadlineMs !== ui.deadlineMs) ui.set({ deadlineMs: state.deadlineMs });
    const known = new Set(ui.messages.map((m) => m.id));
    const fresh = state.messages.filter(
      (m) => !known.has(m.id) && !this.o.record.ackedMessageIds.includes(m.id),
    );
    if (fresh.length) ui.set({ messages: [...ui.messages, ...fresh] });
    this.o.onState(state);
  }

  acknowledgeMessage(id: string) {
    const ui = useWorkspaceUi.getState();
    ui.set({ messages: ui.messages.filter((m) => m.id !== id) });
    this.engine.ackMessage(id);
  }

  // ── Editor plumbing ──────────────────────────────────────────────────────
  modelFor(questionId: string, path: string) {
    return this.models.get(fileKey(questionId, path)) ?? null;
  }

  starterFor(questionId: string, path: string) {
    return this.starters.get(fileKey(questionId, path)) ?? null;
  }

  attachEditor(editor: Monaco.editor.IStandaloneCodeEditor | null) {
    if (editor === this.editor) return;
    this.editor = editor;
    for (const l of this.editorListeners) {
      l.cleanup?.();
      l.cleanup = editor ? l.cb(editor) : undefined;
    }
  }

  /** Runs `cb` for the current editor and every later one (the editor can be recreated); `cb` returns its cleanup. */
  onEditor(cb: (editor: Monaco.editor.IStandaloneCodeEditor) => () => void): () => void {
    const l: { cb: typeof cb; cleanup?: () => void } = { cb };
    this.editorListeners.add(l);
    if (this.editor) l.cleanup = cb(this.editor);
    return () => {
      l.cleanup?.();
      this.editorListeners.delete(l);
    };
  }

  /** Edits made by the app itself (reset, internal clipboard) — detectors ignore them. */
  asAppEdit<T>(fn: () => T): T {
    this.programmaticEdits++;
    try {
      return fn();
    } finally {
      this.programmaticEdits--;
    }
  }

  /** Shows a file in the single editor instance, preserving each file's cursor/scroll state. */
  showFile(questionId: string, path: string) {
    const editor = this.editor;
    const model = this.modelFor(questionId, path);
    if (!editor || !model) return;
    const current = editor.getModel();
    if (current === model) return;
    if (current) this.viewStates.set(current.uri.toString(), editor.saveViewState());
    editor.setModel(model);
    const vs = this.viewStates.get(model.uri.toString());
    if (vs) editor.restoreViewState(vs);
    const starter = this.starterFor(questionId, path);
    const { locked, paused } = useWorkspaceUi.getState();
    editor.updateOptions({ readOnly: !!starter?.readonly || locked || paused });
    editor.focus();
  }

  private onModelChange(
    questionId: string,
    path: string,
    model: Monaco.editor.ITextModel,
    e: Monaco.editor.IModelContentChangedEvent,
  ) {
    const content = model.getValue();
    this.engine.updateFile(questionId, path, content);
    this.recorder.record({
      k: 'edit',
      q: this.positions.get(questionId) ?? 0,
      f: path,
      c: e.changes.map((c) => [c.rangeOffset, c.rangeLength, c.text] as [number, number, string]),
    });
    const ui = useWorkspaceUi.getState();
    const key = fileKey(questionId, path);
    const isModified = content !== this.starters.get(key)?.content;
    if (ui.modified[key] !== isModified) ui.set({ modified: { ...ui.modified, [key]: isModified } });
    if (ui.statuses[questionId] === 'not_started') this.setStatus(questionId, 'in_progress');
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  selectQuestion(questionId: string) {
    const ui = useWorkspaceUi.getState();
    ui.set({ currentQuestionId: questionId });
    this.o.record.ui.currentQuestionId = questionId;
    const path = ui.activeFile[questionId];
    if (path) this.recorder.record({ k: 'open', q: this.positions.get(questionId) ?? 0, f: path });
    void this.engine.persistNow();
  }

  openFile(questionId: string, path: string) {
    const ui = useWorkspaceUi.getState();
    const tabs = ui.openTabs[questionId] ?? [];
    const nextTabs = tabs.includes(path) ? tabs : [...tabs, path];
    ui.set({
      openTabs: { ...ui.openTabs, [questionId]: nextTabs },
      activeFile: { ...ui.activeFile, [questionId]: path },
    });
    this.o.record.ui.openTabs[questionId] = nextTabs;
    this.o.record.ui.activeFile[questionId] = path;
    this.recorder.record({ k: 'open', q: this.positions.get(questionId) ?? 0, f: path });
    void this.engine.persistNow();
  }

  closeTab(questionId: string, path: string) {
    const ui = useWorkspaceUi.getState();
    const tabs = (ui.openTabs[questionId] ?? []).filter((p) => p !== path);
    const active =
      ui.activeFile[questionId] === path
        ? (tabs[tabs.length - 1] ?? null)
        : (ui.activeFile[questionId] ?? null);
    ui.set({
      openTabs: { ...ui.openTabs, [questionId]: tabs },
      activeFile: { ...ui.activeFile, [questionId]: active },
    });
    this.o.record.ui.openTabs[questionId] = tabs;
    this.o.record.ui.activeFile[questionId] = active;
  }

  // ── Responses ────────────────────────────────────────────────────────────
  setNotes(questionId: string, notes: string) {
    const ui = useWorkspaceUi.getState();
    ui.set({ notes: { ...ui.notes, [questionId]: notes } });
    const status = ui.statuses[questionId] === 'not_started' ? 'in_progress' : ui.statuses[questionId];
    if (status && status !== ui.statuses[questionId])
      ui.set({ statuses: { ...ui.statuses, [questionId]: status } });
    this.engine.updateResponse(questionId, { notes, status });
    this.recorder.record({ k: 'notes', q: this.positions.get(questionId) ?? 0, len: notes.length });
  }

  setStatus(questionId: string, status: ResponseStatus) {
    const ui = useWorkspaceUi.getState();
    ui.set({ statuses: { ...ui.statuses, [questionId]: status } });
    this.engine.updateResponse(questionId, { status });
  }

  toggleReview(questionId: string) {
    const current = useWorkspaceUi.getState().statuses[questionId];
    this.setStatus(questionId, current === 'marked_for_review' ? 'in_progress' : 'marked_for_review');
  }

  /** Restores a file's original content as one undoable edit. */
  resetFile(questionId: string, path: string) {
    const model = this.modelFor(questionId, path);
    const starter = this.starterFor(questionId, path);
    if (!model || !starter || starter.readonly) return;
    this.asAppEdit(() => {
      model.pushEditOperations([], [{ range: model.getFullModelRange(), text: starter.content }], () => null);
      model.pushStackElement();
    });
  }

  // ── Locking and submission ───────────────────────────────────────────────
  lock() {
    useWorkspaceUi.getState().set({ locked: true });
    this.editor?.updateOptions({ readOnly: true });
  }

  /** Final submit (candidate or time-up). Retries until the server confirms; the UI offers a backup meanwhile. */
  async submit(reason?: 'time_up'): Promise<void> {
    const ui = useWorkspaceUi.getState();
    if (ui.submitPhase === 'submitting' || ui.submitPhase === 'retrying' || ui.submitPhase === 'done') return;
    this.lock();
    ui.set({ submitPhase: 'submitting', submitAttempts: 0 });
    this.recorder.flush();
    const res = await this.engine.submit({
      reason,
      onAttemptFailed: (n) => useWorkspaceUi.getState().set({ submitPhase: 'retrying', submitAttempts: n }),
    });
    if (res.ok) useWorkspaceUi.getState().set({ submitPhase: 'done' });
  }

  async downloadBackup() {
    this.recorder.flush();
    await this.engine.persistNow();
    const envelope = await createBackup(this.o.record, this.o.clock.now());
    downloadBackup(envelope, this.o.candidateName);
  }

  firedWarnings(): number[] {
    return this.o.record.firedWarnings;
  }

  markWarningsFired(minutes: number[]) {
    this.o.record.firedWarnings = [...new Set([...this.o.record.firedWarnings, ...minutes])];
    void this.engine.persistNow();
  }

  /** Counts a violation of `type` on this device (persisted); returns its occurrence number. */
  recordViolation(type: string): number {
    const counts = (this.o.record.violationCounts ??= {});
    counts[type] = (counts[type] ?? 0) + 1;
    void this.engine.persistNow();
    return counts[type];
  }

  localViolationTotal(countedTypes: string[]): number {
    const counts = this.o.record.violationCounts ?? {};
    return countedTypes.reduce((sum, t) => sum + (counts[t] ?? 0), 0);
  }

  /** Proctoring entry point. Violations are sent immediately (`urgent`). */
  report(
    type: string,
    details: Record<string, unknown> = {},
    opts: { urgent?: boolean; durationMs?: number } = {},
  ) {
    return this.engine.enqueueEvent(
      {
        type,
        details,
        client_elapsed_ms: Math.max(0, Math.round(this.o.clock.now() - this.startedAtMs)),
        duration_ms: opts.durationMs,
      },
      { urgent: opts.urgent },
    );
  }
}
