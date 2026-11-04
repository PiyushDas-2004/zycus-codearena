/**
 * On-device copy of a candidate's work (IndexedDB). Every edit lands here within ~300 ms, so a
 * refresh, crash or network outage never loses work; the sync engine drains it to the server.
 */
import { createStore, del, get, set, type UseStore } from 'idb-keyval';
import type { ResponseStatus, SessionState, SyncChunk, SyncEvent, WorkspaceQuestion } from '@/lib/api/types';

export interface LocalFile {
  content: string;
  /** client_seq of the last local change (monotonic per session). */
  seq: number;
  synced: boolean;
}

export interface LocalResponse {
  status: ResponseStatus;
  notes: string;
  seq: number;
  synced: boolean;
}

export interface LocalRecord {
  version: 1;
  sessionId: string;
  clientSeq: number;
  files: Record<string, LocalFile>;
  responses: Record<string, LocalResponse>;
  events: SyncEvent[];
  chunks: SyncChunk[];
  nextChunkSeq: number;
  ackedMessageIds: string[];
  ui: {
    currentQuestionId: string | null;
    openTabs: Record<string, string[]>;
    activeFile: Record<string, string | null>;
  };
  firedWarnings: number[];
  /** Proctoring violations recorded on this device, per type (drives warnings; the server counts too). */
  violationCounts?: Record<string, number>;
  /** The server's violationsResetCount these counts belong to (a reopen with fresh warnings). */
  violationsResetSeen?: number;
  backupKeyB64: string;
  /** Frozen questions and last state, so a reload without network can still open the workspace. */
  cache?: { questions: WorkspaceQuestion[]; state: SessionState };
  updatedAt: number;
}

/** Key for a file within a session: question id + NUL + path (NUL can't appear in either). */
export const fileKey = (questionId: string, path: string) => `${questionId}\u0000${path}`;
export const splitFileKey = (key: string): [string, string] => {
  const i = key.indexOf('\u0000');
  return [key.slice(0, i), key.slice(i + 1)];
};

export function emptyRecord(sessionId: string, backupKeyB64 = ''): LocalRecord {
  return {
    version: 1,
    sessionId,
    clientSeq: 0,
    files: {},
    responses: {},
    events: [],
    chunks: [],
    nextChunkSeq: 0,
    ackedMessageIds: [],
    ui: { currentQuestionId: null, openTabs: {}, activeFile: {} },
    firedWarnings: [],
    backupKeyB64,
    updatedAt: Date.now(),
  };
}

let store: UseStore | null = null;
let memoryFallback: Map<string, LocalRecord> | null = null;

function idb(): UseStore | null {
  if (memoryFallback) return null;
  if (!store) {
    try {
      store = createStore('zycus-codearena', 'workspace');
    } catch {
      memoryFallback = new Map();
      return null;
    }
  }
  return store;
}

const recordKey = (sessionId: string) => `session:${sessionId}`;

export async function loadRecord(sessionId: string): Promise<LocalRecord | undefined> {
  const s = idb();
  if (!s) return memoryFallback?.get(sessionId);
  try {
    const rec = await get<LocalRecord>(recordKey(sessionId), s);
    return rec?.version === 1 ? rec : undefined;
  } catch {
    return undefined;
  }
}

export async function saveRecord(record: LocalRecord): Promise<boolean> {
  record.updatedAt = Date.now();
  const s = idb();
  if (!s) {
    memoryFallback?.set(record.sessionId, structuredClone(record));
    return false;
  }
  try {
    await set(recordKey(record.sessionId), record, s);
    return true;
  } catch {
    return false;
  }
}

export async function deleteRecord(sessionId: string): Promise<void> {
  const s = idb();
  if (!s) {
    memoryFallback?.delete(sessionId);
    return;
  }
  try {
    await del(recordKey(sessionId), s);
  } catch {
    /* best effort */
  }
}

/** Asks the browser not to evict our storage under pressure (improves the 150-minute guarantee). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/** True if IndexedDB can actually store and read data in this browser profile. */
export async function probeStorage(): Promise<boolean> {
  const s = idb();
  if (!s) return false;
  try {
    await set('probe', Date.now(), s);
    const v = await get('probe', s);
    await del('probe', s);
    return typeof v === 'number';
  } catch {
    return false;
  }
}
