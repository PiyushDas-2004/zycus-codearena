import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiResult, CandidateApi, SessionState, SyncPayload } from '@/lib/api/types';
import { emptyRecord, fileKey } from '@/lib/persist/localRecord';
import { ServerClock } from '@/lib/time/serverClock';
import { SyncEngine } from './syncEngine';

const state = (over: Partial<SessionState> = {}): SessionState => ({
  sessionId: 's1',
  status: 'in_progress',
  serverNowMs: Date.now(),
  startedAtMs: 0,
  deadlineMs: Date.now() + 9_000_000,
  durationSeconds: 9000,
  extensionSeconds: 0,
  submittedAtMs: null,
  submitReason: null,
  consentAccepted: true,
  violationCount: 0,
  violationCounts: {},
  candidate: { fullName: 'A', email: 'a@example.com' },
  template: { name: 't', targetRole: '', durationMinutes: 150, instructionsMd: '', questionCount: 1 },
  proctoring: {},
  violationPolicy: {},
  settings: {
    saveGraceSeconds: 10,
    grievanceContactEmail: null,
    candidateDataRetentionDays: 365,
    snapshotRetentionDays: 90,
  },
  messages: [],
  ...over,
});

type Behaviour = 'ok' | 'network' | 'superseded' | 'submitted';
function fakeApi() {
  const calls: { fn: 'sync' | 'submit'; payload: SyncPayload; outcome?: Behaviour }[] = [];
  const script: Behaviour[] = [];
  let resolveGate: (() => void) | null = null;
  let gate: Promise<void> | null = null;
  const timing = { sentAtPerf: 0, receivedAtPerf: 10 };
  const respond = async (fn: 'sync' | 'submit', payload: SyncPayload): Promise<ApiResult<never>> => {
    const call: (typeof calls)[number] = { fn, payload: structuredClone(payload) };
    calls.push(call);
    if (gate) await gate;
    const b = script.shift() ?? 'ok';
    call.outcome = b;
    if (b === 'network') return { ok: false, error: 'NETWORK', timing };
    if (b === 'superseded') return { ok: false, error: 'SESSION_SUPERSEDED', timing };
    if (b === 'submitted')
      return { ok: false, error: 'SUBMITTED', state: state({ status: 'submitted' }), timing };
    const s = state(fn === 'submit' ? { status: 'submitted', submitReason: 'candidate' } : {});
    return {
      ok: true,
      timing,
      state: s,
      accepted: { files: 0, responses: 0, events: 0, editorChunks: 0 },
    } as never;
  };
  const api = {
    kind: 'mock',
    sync: (_t: string, p: SyncPayload) => respond('sync', p),
    submit: (_t: string, p: SyncPayload) => respond('submit', p),
  } as unknown as CandidateApi;
  return {
    api,
    calls,
    script,
    hold() {
      gate = new Promise((r) => (resolveGate = r));
    },
    release() {
      gate = null;
      resolveGate?.();
    },
  };
}

function makeEngine(api: CandidateApi, extra: Partial<ConstructorParameters<typeof SyncEngine>[0]> = {}) {
  const record = emptyRecord('s1-session');
  record.files[fileKey('q1', 'App.tsx')] = { content: 'start', seq: 0, synced: true };
  const persist = vi.fn(async () => undefined);
  const onState = vi.fn();
  const onFatal = vi.fn();
  const engine = new SyncEngine({
    api,
    token: 't'.repeat(43),
    record,
    clock: new ServerClock(() => Date.now()),
    persist,
    onState,
    onFatal,
    now: () => Date.now(),
    isOnline: () => true,
    ...extra,
  });
  return { engine, record, persist, onState, onFatal };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('SyncEngine', () => {
  it('persists every change locally (debounced) and syncs on the next interval', async () => {
    const f = fakeApi();
    const { engine, persist, record } = makeEngine(f.api);
    engine.start();
    await vi.advanceTimersByTimeAsync(0); // initial heartbeat
    f.calls.length = 0;

    engine.updateFile('q1', 'App.tsx', 'a');
    engine.updateFile('q1', 'App.tsx', 'ab');
    expect(engine.saveStatus.phase).toBe('pending');
    await vi.advanceTimersByTimeAsync(300);
    expect(persist).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(10_000);
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0]?.payload.files).toEqual([
      { question_id: 'q1', path: 'App.tsx', content: 'ab', client_seq: 2 },
    ]);
    expect(record.files[fileKey('q1', 'App.tsx')]?.synced).toBe(true);
    expect(engine.saveStatus.phase).toBe('idle');
    engine.stop();
  });

  it('keeps an edit made during an in-flight save unsynced, then sends it', async () => {
    const f = fakeApi();
    const { engine, record } = makeEngine(f.api);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    f.calls.length = 0;

    engine.updateFile('q1', 'App.tsx', 'v1');
    f.hold();
    const p = engine.flush();
    engine.updateFile('q1', 'App.tsx', 'v2'); // typed while the request was in flight
    f.release();
    await p;
    expect(record.files[fileKey('q1', 'App.tsx')]?.synced).toBe(false);
    await vi.advanceTimersByTimeAsync(10_000); // sent on the next interval
    expect(f.calls.map((c) => c.payload.files?.[0]?.content)).toEqual(['v1', 'v2']);
    expect(record.files[fileKey('q1', 'App.tsx')]?.synced).toBe(true);
    engine.stop();
  });

  it('survives a network outage: queues, goes offline, backs off, then drains once', async () => {
    const f = fakeApi();
    const { engine, record } = makeEngine(f.api);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    f.calls.length = 0;

    f.script.push('network', 'network', 'network');
    engine.updateFile('q1', 'App.tsx', 'offline edit');
    engine.enqueueEvent({ type: 'tab_switch', duration_ms: 3000 });
    await vi.advanceTimersByTimeAsync(0); // nothing urgent yet
    await vi.advanceTimersByTimeAsync(10_000); // interval → fail #1
    expect(engine.saveStatus.consecutiveFailures).toBe(1);
    await vi.advanceTimersByTimeAsync(2_000); // retry → fail #2
    expect(engine.saveStatus.phase).toBe('offline');
    await vi.advanceTimersByTimeAsync(4_000); // retry → fail #3
    await vi.advanceTimersByTimeAsync(8_000); // retry → success
    expect(engine.saveStatus.phase).toBe('idle');
    expect(record.events).toHaveLength(0);
    const delivered = f.calls.find((c) => c.outcome === 'ok' && c.payload.files)?.payload;
    expect(delivered?.files?.[0]?.content).toBe('offline edit');
    expect(delivered?.events?.[0]?.type).toBe('tab_switch');
    expect(f.calls.filter((c) => c.outcome === 'ok' && c.payload.files)).toHaveLength(1);
    // The same event id was retried each time, so the server de-duplicates it.
    const ids = new Set(f.calls.flatMap((c) => c.payload.events ?? []).map((e) => e.client_event_id));
    expect(ids.size).toBe(1);
    engine.stop();
  });

  it('flushes urgent events immediately', async () => {
    const f = fakeApi();
    const { engine } = makeEngine(f.api);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    f.calls.length = 0;
    engine.enqueueEvent({ type: 'fullscreen_exit' }, { urgent: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(f.calls[0]?.payload.events?.[0]?.type).toBe('fullscreen_exit');
    engine.stop();
  });

  it('sends a heartbeat every 30 s even with no changes', async () => {
    const f = fakeApi();
    const { engine } = makeEngine(f.api, {
      getHeartbeat: () => ({ current_question_id: 'q1', visible: true }),
    });
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    f.calls.length = 0;
    await vi.advanceTimersByTimeAsync(20_000);
    expect(f.calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0]?.payload.heartbeat).toEqual({ current_question_id: 'q1', visible: true });
    engine.stop();
  });

  it('stops and reports when the session was opened elsewhere', async () => {
    const f = fakeApi();
    f.script.push('superseded');
    const { engine, onFatal } = makeEngine(f.api);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(onFatal).toHaveBeenCalledWith('SESSION_SUPERSEDED');
    engine.updateFile('q1', 'App.tsx', 'x');
    await vi.advanceTimersByTimeAsync(30_000);
    expect(f.calls).toHaveLength(1);
  });

  it('hands the final state to the app when the server says it is already submitted', async () => {
    const f = fakeApi();
    f.script.push('submitted');
    const { engine, onState } = makeEngine(f.api);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(onState).toHaveBeenCalledWith(expect.objectContaining({ status: 'submitted' }));
    engine.stop();
  });

  it('submit() retries through outages and sends everything in one final call', async () => {
    const f = fakeApi();
    const { engine, record } = makeEngine(f.api);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    engine.updateFile('q1', 'App.tsx', 'final answer');
    engine.updateResponse('q1', { notes: 'Root cause: …', status: 'in_progress' });
    f.script.push('network', 'network');
    const failed: number[] = [];
    const p = engine.submit({ onAttemptFailed: (n) => failed.push(n), retryDelayMs: () => 1000 });
    await vi.advanceTimersByTimeAsync(5_000);
    const res = await p;
    expect(res.ok).toBe(true);
    expect(failed).toEqual([1, 2]);
    const final = f.calls.filter((c) => c.fn === 'submit');
    expect(final).toHaveLength(3);
    expect(final[2]?.payload.files?.[0]?.content).toBe('final answer');
    expect(final[2]?.payload.responses?.[0]?.notes).toBe('Root cause: …');
    expect(Object.values(record.files).every((x) => x.synced)).toBe(true);
  });
});
