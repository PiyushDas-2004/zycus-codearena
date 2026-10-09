/**
 * Candidate API contract (mirrors supabase/migrations/*_candidate_api.sql, in camelCase).
 * Implemented by the Supabase adapter (production) and an in-memory mock (UI development/tests).
 */

export type SessionStatus = 'pending' | 'in_progress' | 'submitted';
export type SubmitReason = 'candidate' | 'time_up' | 'violation_limit' | 'admin_force';
export type ResponseStatus = 'not_started' | 'in_progress' | 'marked_for_review';

export type ServerErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'REVOKED'
  | 'ALREADY_SUBMITTED'
  | 'NOT_YET_OPEN'
  | 'EXPIRED'
  | 'INVALID_SESSION'
  | 'SESSION_SUPERSEDED'
  | 'CONSENT_REQUIRED'
  | 'CAPACITY'
  | 'TEMPLATE_INACTIVE'
  | 'NO_QUESTIONS'
  | 'NOT_STARTED'
  | 'SUBMITTED'
  | 'INVALID_PAYLOAD';

/** NETWORK: request never got a response (offline, timeout). UNKNOWN: unexpected server reply. */
export type CandidateErrorCode = ServerErrorCode | 'NETWORK' | 'UNKNOWN';

export interface StaffMessage {
  id: string;
  body: string;
  sentAtMs: number;
}

export interface SessionState {
  sessionId: string;
  status: SessionStatus;
  serverNowMs: number;
  startedAtMs: number | null;
  deadlineMs: number | null;
  durationSeconds: number;
  extensionSeconds: number;
  submittedAtMs: number | null;
  submitReason: SubmitReason | null;
  consentAccepted: boolean;
  violationCount: number;
  /** Counted violations per type, as recorded by the server. */
  violationCounts: Record<string, number>;
  candidate: { fullName: string; email: string };
  template: {
    name: string;
    targetRole: string;
    durationMinutes: number;
    instructionsMd: string;
    questionCount: number;
  };
  /** Raw stored config; resolve with resolveProctoringConfig()/resolveViolationPolicy(). */
  proctoring: unknown;
  violationPolicy: unknown;
  settings: {
    saveGraceSeconds: number;
    grievanceContactEmail: string | null;
    candidateDataRetentionDays: number;
    snapshotRetentionDays: number;
  };
  messages: StaffMessage[];
}

export interface StarterFile {
  path: string;
  language: string;
  readonly: boolean;
  content: string;
}

export interface WorkspaceQuestion {
  questionId: string;
  position: number;
  title: string;
  statementMd: string;
  files: StarterFile[];
}

export interface Workspace {
  state: SessionState;
  backupKeyB64: string;
  questions: WorkspaceQuestion[];
  files: { questionId: string; path: string; content: string; clientSeq: number }[];
  responses: { questionId: string; status: ResponseStatus; notes: string; clientSeq: number }[];
  nextChunkSeq: number;
}

export interface SyncFile {
  question_id: string;
  path: string;
  content: string;
  client_seq: number;
}
export interface SyncResponse {
  question_id: string;
  status: ResponseStatus;
  notes: string;
  client_seq: number;
}
export interface SyncEvent {
  client_event_id: string;
  type: string;
  client_elapsed_ms?: number;
  duration_ms?: number;
  details?: Record<string, unknown>;
}
export interface SyncChunk {
  seq: number;
  client_start_ms: number;
  client_end_ms: number;
  event_count: number;
  payload_b64: string;
}

/** Wire format of a sync/submit payload (snake_case, as the SQL functions read it). */
export interface SyncPayload {
  files?: SyncFile[];
  responses?: SyncResponse[];
  events?: SyncEvent[];
  editor_chunks?: SyncChunk[];
  heartbeat?: { current_question_id?: string | null; visible?: boolean; online?: boolean };
  acked_message_ids?: string[];
  /** Final submit only: 'time_up' when the client auto-submits at 00:00 (server verifies). */
  reason?: 'time_up';
}

export interface SyncAccepted {
  files: number;
  responses: number;
  events: number;
  editorChunks: number;
}

/** Round-trip timing of a call, used to estimate the server clock offset. */
export interface CallTiming {
  sentAtPerf: number;
  receivedAtPerf: number;
}

export type ApiResult<T> =
  | ({ ok: true; timing: CallTiming } & T)
  | {
      ok: false;
      error: CandidateErrorCode;
      state?: SessionState;
      retryAfterSeconds?: number;
      opensAtMs?: number;
      timing?: CallTiming;
    };

/** A webcam snapshot (JPEG) for candidate_upload_snapshot. */
export interface SnapshotUpload {
  clientSnapshotId: string;
  reason: string;
  faceCount: number | null;
  width: number;
  height: number;
  jpegB64: string;
}

export interface CandidateApi {
  readonly kind: 'supabase' | 'mock';
  ping(): Promise<ApiResult<{ serverNowMs: number }>>;
  login(
    email: string,
    accessCode: string,
    client: Record<string, unknown>,
  ): Promise<ApiResult<{ token: string; state: SessionState }>>;
  getState(token: string): Promise<ApiResult<{ state: SessionState }>>;
  acceptConsent(
    token: string,
    version: string,
    sha256: string,
    client: Record<string, unknown>,
  ): Promise<ApiResult<{ state: SessionState }>>;
  start(token: string, client: Record<string, unknown>): Promise<ApiResult<{ state: SessionState }>>;
  getWorkspace(token: string): Promise<ApiResult<{ workspace: Workspace }>>;
  sync(
    token: string,
    payload: SyncPayload,
  ): Promise<ApiResult<{ state: SessionState; accepted: SyncAccepted }>>;
  submit(token: string, payload: SyncPayload): Promise<ApiResult<{ state: SessionState }>>;
  uploadSnapshot(token: string, snapshot: SnapshotUpload): Promise<ApiResult<{ snapshotId: string }>>;
}
