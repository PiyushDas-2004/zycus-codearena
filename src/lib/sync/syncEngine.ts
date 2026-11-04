/**
 * Moves the candidate's work from the on-device record to the server.
 *
 * - Every change is persisted locally (debounced ~300 ms) and marked unsynced.
 * - Every `intervalMs` (default 10 s) unsynced files/notes, queued proctoring events and
 *   keystroke-replay chunks are sent in ONE candidate_sync call (so events can't be blocked
 *   without also blocking saves). Violations can request an immediate flush.
 * - If nothing changed, a heartbeat is still sent every `heartbeatMs` (default 30 s).
 * - Network failures keep everything queued and retry with backoff; the server ignores anything
 *   older than what it has (client_seq), so retries and reordering are safe.
 * - submit() drains everything with the idempotent candidate_submit, retrying until it succeeds.
 */
import type {
  CandidateApi,
  ResponseStatus,
  SessionState,
  SyncChunk,
  SyncEvent,
  SyncPayload,
} from '@/lib/api/types';
import type { ServerClock } from '@/lib/time/serverClock';
import { fileKey, splitFileKey, type LocalRecord } from '@/lib/persist/localRecord';

export type FatalCode = 'SESSION_SUPERSEDED' | 'INVALID_SESSION';

export interface SaveStatus {
  /** idle: everything on the server. pending: local changes waiting. saving: request in flight. */
  phase: 'idle' | 'pending' | 'saving' | 'offline';
  /** Server-clock time of the last successful sync. */
  lastServerSaveAt: number | null;
  unsyncedItems: number;
  consecutiveFailures: number;
}

export interface Timers {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
  setInterval: (fn: () => void, ms: number) => unknown;
  clearInterval: (id: unknown) => void;
}

export interface SyncEngineOptions {
  api: CandidateApi;
  token: string;
  record: LocalRecord;
  clock: ServerClock;
  persist: (record: LocalRecord) => Promise<unknown>;
  onState: (state: SessionState) => void;
  onFatal: (code: FatalCode) => void;
  onStatus?: (status: SaveStatus) => void;
  getHeartbeat?: () => SyncPayload['heartbeat'];
  /** Called right before each sync so producers (e.g. the replay recorder) can enqueue data. */
  beforeSync?: () => void;
  intervalMs?: number;
  heartbeatMs?: number;
  persistDebounceMs?: number;
  isOnline?: () => boolean;
  timers?: Timers;
  now?: () => number;
}

const MAX_EVENTS_PER_SYNC = 150;
const MAX_CHUNKS_PER_SYNC = 40;

const defaultTimers: Timers = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id as ReturnType<typeof setTimeout>),
  setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
  clearInterval: (id) => globalThis.clearInterval(id as ReturnType<typeof setInterval>),
};

export class SyncEngine {
  private readonly o: Required<
    Pick<
      SyncEngineOptions,
      'intervalMs' | 'heartbeatMs' | 'persistDebounceMs' | 'timers' | 'isOnline' | 'now'
    >
  > &
    SyncEngineOptions;
  private interval: unknown = null;
  private retryTimer: unknown = null;
  private persistTimer: unknown = null;
  private inflight: Promise<void> | null = null;
  private flushAgain = false;
  private stopped = false;
  private submitting = false;
  private lastSuccessAt = Number.NEGATIVE_INFINITY;
  private status: SaveStatus = {
    phase: 'idle',
    lastServerSaveAt: null,
    unsyncedItems: 0,
    consecutiveFailures: 0,
  };
  private eventCounter = 0;

  constructor(options: SyncEngineOptions) {
    this.o = {
      intervalMs: 10_000,
      heartbeatMs: 30_000,
      persistDebounceMs: 300,
      timers: defaultTimers,
      isOnline: () => (typeof navigator === 'undefined' ? true : navigator.onLine),
      now: () => (typeof performance === 'undefined' ? Date.now() : performance.now()),
      ...options,
    };
    this.status.unsyncedItems = this.countUnsynced();
    if (this.status.unsyncedItems > 0) this.status.phase = 'pending';
  }

  get record(): LocalRecord {
    return this.o.record;
  }

  get saveStatus(): SaveStatus {
    return this.status;
  }

  start(): void {
    this.stopped = false;
    this.interval = this.o.timers.setInterval(() => void this.tick(), this.o.intervalMs);
    void this.flush();
  }

  stop(): void {
    this.stopped = true;
    if (this.interval) this.o.timers.clearInterval(this.interval);
    if (this.retryTimer) this.o.timers.clearTimeout(this.retryTimer);
    this.interval = null;
    this.retryTimer = null;
    void this.persistNow();
  }

  // ── Producers ────────────────────────────────────────────────────────────
  updateFile(questionId: string, path: string, content: string): void {
    const rec = this.o.record;
    const key = fileKey(questionId, path);
    const cur = rec.files[key];
    if (cur && cur.content === content) return;
    rec.files[key] = { content, seq: ++rec.clientSeq, synced: false };
    this.changed();
  }

  updateResponse(questionId: string, patch: { status?: ResponseStatus; notes?: string }): void {
    const rec = this.o.record;
    const cur = rec.responses[questionId] ?? {
      status: 'not_started' as ResponseStatus,
      notes: '',
      seq: 0,
      synced: true,
    };
    const next = { status: patch.status ?? cur.status, notes: patch.notes ?? cur.notes };
    if (next.status === cur.status && next.notes === cur.notes) return;
    rec.responses[questionId] = { ...next, seq: ++rec.clientSeq, synced: false };
    this.changed();
  }

  /** Queue a proctoring event. `urgent` sends it right away (violations). */
  enqueueEvent(event: Omit<SyncEvent, 'client_event_id'>, opts: { urgent?: boolean } = {}): string {
    const id = `${this.o.record.sessionId.slice(0, 8)}-${Date.now().toString(36)}-${(this.eventCounter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    this.o.record.events.push({ ...event, client_event_id: id });
    this.changed();
    if (opts.urgent) void this.flush();
    return id;
  }

  enqueueChunk(chunk: Omit<SyncChunk, 'seq'>): void {
    const rec = this.o.record;
    rec.chunks.push({ ...chunk, seq: rec.nextChunkSeq++ });
    this.changed(false);
  }

  ackMessage(id: string): void {
    if (!this.o.record.ackedMessageIds.includes(id)) this.o.record.ackedMessageIds.push(id);
    this.changed();
    void this.flush();
  }

  /** Call when the browser reports it is back online, or after waking from sleep. */
  nudge(): void {
    this.o.clock.invalidate();
    void this.flush();
  }

  // ── Sending ──────────────────────────────────────────────────────────────
  private async tick(): Promise<void> {
    if (this.stopped || this.submitting) return;
    const heartbeatDue = this.o.now() - this.lastSuccessAt >= this.o.heartbeatMs;
    this.o.beforeSync?.();
    if (this.countUnsynced() > 0 || heartbeatDue) await this.flush();
  }

  /** Sends everything pending now. Concurrent calls coalesce into at most one follow-up request. */
  flush(): Promise<void> {
    if (this.stopped || this.submitting) return Promise.resolve();
    if (this.inflight) {
      this.flushAgain = true;
      return this.inflight;
    }
    this.inflight = this.doFlush().finally(() => {
      this.inflight = null;
      if (this.flushAgain && !this.stopped && !this.submitting) {
        this.flushAgain = false;
        void this.flush();
      }
    });
    return this.inflight;
  }

  private buildPayload(all = false): { payload: SyncPayload; sent: Sent } {
    const rec = this.o.record;
    const sent: Sent = {
      files: new Map(),
      responses: new Map(),
      eventIds: new Set(),
      chunkSeqs: new Set(),
      acks: [],
    };
    const files = Object.entries(rec.files)
      .filter(([, f]) => !f.synced)
      .map(([key, f]) => {
        sent.files.set(key, f.seq);
        const [question_id, path] = splitFileKey(key);
        return { question_id, path, content: f.content, client_seq: f.seq };
      });
    const responses = Object.entries(rec.responses)
      .filter(([, r]) => !r.synced)
      .map(([question_id, r]) => {
        sent.responses.set(question_id, r.seq);
        return { question_id, status: r.status, notes: r.notes, client_seq: r.seq };
      });
    const events = all ? rec.events : rec.events.slice(0, MAX_EVENTS_PER_SYNC);
    events.forEach((e) => sent.eventIds.add(e.client_event_id));
    const chunks = all ? rec.chunks : rec.chunks.slice(0, MAX_CHUNKS_PER_SYNC);
    chunks.forEach((c) => sent.chunkSeqs.add(c.seq));
    sent.acks = [...rec.ackedMessageIds];
    const payload: SyncPayload = { heartbeat: this.o.getHeartbeat?.() ?? {} };
    if (files.length) payload.files = files;
    if (responses.length) payload.responses = responses;
    if (events.length) payload.events = events;
    if (chunks.length) payload.editor_chunks = chunks;
    if (sent.acks.length) payload.acked_message_ids = sent.acks;
    return { payload, sent };
  }

  private markSent(sent: Sent): void {
    const rec = this.o.record;
    for (const [key, seq] of sent.files) {
      const f = rec.files[key];
      if (f && f.seq === seq) f.synced = true; // edited again meanwhile → stays unsynced
    }
    for (const [qid, seq] of sent.responses) {
      const r = rec.responses[qid];
      if (r && r.seq === seq) r.synced = true;
    }
    rec.events = rec.events.filter((e) => !sent.eventIds.has(e.client_event_id));
    rec.chunks = rec.chunks.filter((c) => !sent.chunkSeqs.has(c.seq));
    rec.ackedMessageIds = rec.ackedMessageIds.filter((id) => !sent.acks.includes(id));
  }

  private async doFlush(): Promise<void> {
    const { payload, sent } = this.buildPayload();
    this.setStatus({ phase: this.status.phase === 'offline' ? 'offline' : 'saving' });
    const res = await this.o.api.sync(this.o.token, payload);
    if (res.ok) {
      this.o.clock.sample(res.state.serverNowMs, res.timing.sentAtPerf, res.timing.receivedAtPerf);
      this.markSent(sent);
      this.lastSuccessAt = this.o.now();
      this.setStatus({ consecutiveFailures: 0, lastServerSaveAt: this.o.clock.now() });
      await this.persistNow();
      this.o.onState(res.state);
      return;
    }
    if (res.error === 'SESSION_SUPERSEDED' || res.error === 'INVALID_SESSION') {
      this.stop();
      this.o.onFatal(res.error);
      return;
    }
    if ((res.error === 'SUBMITTED' || res.error === 'NOT_STARTED') && res.state) {
      this.stop();
      this.o.onState(res.state);
      return;
    }
    // NETWORK / UNKNOWN / transient: keep everything queued and retry with backoff.
    const failures = this.status.consecutiveFailures + 1;
    this.setStatus({ consecutiveFailures: failures });
    this.scheduleRetry(failures);
  }

  private scheduleRetry(failures: number): void {
    if (this.stopped || this.retryTimer) return;
    const delay = Math.min(15_000, 2_000 * 2 ** (failures - 1));
    this.retryTimer = this.o.timers.setTimeout(() => {
      this.retryTimer = null;
      void this.flush();
    }, delay);
  }

  /**
   * Final submission. Drains everything through candidate_submit and retries on network errors
   * until it succeeds (the call is idempotent). `onAttempt` reports failures so the UI can offer
   * the encrypted backup download.
   */
  async submit(
    opts: {
      /** 'time_up' when the client auto-submits at 00:00 (the server verifies it against the deadline). */
      reason?: 'time_up';
      onAttemptFailed?: (attempt: number) => void;
      retryDelayMs?: (attempt: number) => number;
    } = {},
  ): Promise<{ ok: true; state: SessionState } | { ok: false; fatal: FatalCode }> {
    this.o.beforeSync?.();
    this.submitting = true;
    if (this.interval) this.o.timers.clearInterval(this.interval);
    if (this.retryTimer) this.o.timers.clearTimeout(this.retryTimer);
    this.interval = null;
    this.retryTimer = null;
    if (this.inflight) await this.inflight.catch(() => undefined);

    for (let attempt = 1; ; attempt++) {
      const { payload, sent } = this.buildPayload(true);
      if (opts.reason) payload.reason = opts.reason;
      this.setStatus({ phase: 'saving' });
      const res = await this.o.api.submit(this.o.token, payload);
      if (res.ok) {
        this.o.clock.sample(res.state.serverNowMs, res.timing.sentAtPerf, res.timing.receivedAtPerf);
        this.markSent(sent);
        this.setStatus({ consecutiveFailures: 0, lastServerSaveAt: this.o.clock.now() });
        await this.persistNow();
        this.stopped = true;
        this.o.onState(res.state);
        return { ok: true, state: res.state };
      }
      if (res.error === 'SESSION_SUPERSEDED' || res.error === 'INVALID_SESSION') {
        this.stopped = true;
        this.o.onFatal(res.error);
        return { ok: false, fatal: res.error };
      }
      this.setStatus({ consecutiveFailures: this.status.consecutiveFailures + 1 });
      opts.onAttemptFailed?.(attempt);
      const delay = opts.retryDelayMs?.(attempt) ?? Math.min(10_000, 1_000 * 2 ** Math.min(attempt - 1, 4));
      await new Promise<void>((resolve) => this.o.timers.setTimeout(resolve, delay));
    }
  }

  // ── Local persistence & status ──────────────────────────────────────────
  private changed(statusUpdate = true): void {
    this.schedulePersist();
    if (statusUpdate) this.setStatus({});
  }

  private schedulePersist(): void {
    if (this.persistTimer) return;
    this.persistTimer = this.o.timers.setTimeout(() => {
      this.persistTimer = null;
      void this.o.persist(this.o.record);
    }, this.o.persistDebounceMs);
  }

  async persistNow(): Promise<void> {
    if (this.persistTimer) {
      this.o.timers.clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    await this.o.persist(this.o.record);
  }

  private countUnsynced(): number {
    const rec = this.o.record;
    return (
      Object.values(rec.files).filter((f) => !f.synced).length +
      Object.values(rec.responses).filter((r) => !r.synced).length +
      rec.events.length +
      rec.chunks.length
    );
  }

  private setStatus(patch: Partial<SaveStatus>): void {
    const next = { ...this.status, ...patch };
    next.unsyncedItems = this.countUnsynced();
    const offline = next.consecutiveFailures >= 2 || !this.o.isOnline();
    if (patch.phase !== 'saving') {
      next.phase = offline ? 'offline' : next.unsyncedItems > 0 ? 'pending' : 'idle';
    } else if (offline) {
      next.phase = 'offline';
    }
    this.status = next;
    this.o.onStatus?.(next);
  }
}

interface Sent {
  files: Map<string, number>;
  responses: Map<string, number>;
  eventIds: Set<string>;
  chunkSeqs: Set<number>;
  acks: string[];
}
