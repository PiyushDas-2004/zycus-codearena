/**
 * Admin portal data, as returned by the admin API (supabase/migrations/…_admin_api.sql), in
 * camelCase. Times are epoch milliseconds (server clock).
 */

export type StaffRole = 'super_admin' | 'recruiter' | 'reviewer';

export interface Staff {
  id: string;
  email: string;
  fullName: string;
  role: StaffRole;
}

/** What the portal shows for an invitation and its test. */
export type InvitationState =
  'invited' | 'scheduled' | 'signed_in' | 'in_progress' | 'submitted' | 'expired' | 'revoked';

export type SubmitReason = 'candidate' | 'time_up' | 'violation_limit' | 'admin_force';

export type AdminErrorCode =
  | 'NOT_STAFF'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_PAYLOAD'
  | 'DUPLICATE_ACTIVE'
  | 'TEMPLATE_INACTIVE'
  | 'NOT_IN_PROGRESS'
  | 'NOT_SUBMITTED'
  | 'ALREADY_STARTED'
  | 'ALREADY_FINISHED'
  | 'NO_TIME_LEFT'
  | 'EXTENSION_LIMIT'
  | 'SIGNED_OUT'
  | 'NETWORK'
  | 'UNKNOWN';

export interface AdminFailure {
  ok: false;
  error: AdminErrorCode;
  /** Server's explanation, when it gives one. */
  message?: string;
  /** The form field at fault (INVALID_PAYLOAD). */
  field?: string;
  /** DUPLICATE_ACTIVE: the invitation that already has a working code. */
  invitationId?: string;
}

export type AdminResult<T> = ({ ok: true } & T) | AdminFailure;

export interface TemplateSummary {
  id: string;
  slug: string;
  name: string;
  targetRole: string;
  durationMinutes: number;
  isActive: boolean;
  questionCount: number;
}

export interface Overview {
  serverNowMs: number;
  counts: {
    invited: number;
    inProgress: number;
    submitted: number;
    submittedLast7Days: number;
    expired: number;
    revoked: number;
  };
  worker: { online: boolean; lastSeenMs: number | null; label: string | null; configured: boolean };
  budget: { spentUsd: number; capUsd: number; worstCaseUsd: number };
  settings: { maxConcurrentSessions: number; grievanceContactEmail: string | null; saveGraceSeconds: number };
  templates: TemplateSummary[];
  reviewers: Staff[];
}

export interface CandidateRow {
  invitationId: string;
  candidateId: string;
  sessionId: string | null;
  fullName: string;
  email: string;
  roleApplied: string;
  requisitionId: string;
  templateName: string;
  state: InvitationState;
  codeHint: string;
  createdAtMs: number;
  validFromMs: number;
  validUntilMs: number;
  startedAtMs: number | null;
  deadlineMs: number | null;
  submittedAtMs: number | null;
  submitReason: SubmitReason | null;
  lastSeenMs: number | null;
  violationCount: number;
  flagCount: number;
  aiUsed: number;
  reopenCount: number;
  /** Latest test run per question, as the candidate last ran them. */
  tests: Record<string, { passed: number; total: number }>;
}

export interface CandidateList {
  rows: CandidateRow[];
  total: number;
  serverNowMs: number;
}

export interface NewInvitation {
  fullName: string;
  email: string;
  templateId: string;
  validFromMs: number | null;
  validUntilMs: number;
  roleApplied: string;
  experienceYears: string;
  requisitionId: string;
  notes: string;
  assignedReviewerId: string;
  allowDuplicate?: boolean;
}

export interface IssuedCode {
  invitationId: string;
  candidateId: string;
  accessCode: string;
  codeHint: string;
  validFromMs: number;
  validUntilMs: number;
  candidate: { fullName: string; email: string };
  template: { name: string; durationMinutes: number };
}

export interface StarterFile {
  path: string;
  language: string;
  content: string;
  readonly: boolean;
}

export interface RubricItem {
  key: string;
  criterion: string;
  description: string;
  maxPoints: number;
}

export interface SessionQuestion {
  questionId: string;
  position: number;
  title: string;
  statementMd: string;
  starterFiles: StarterFile[];
  rubric: RubricItem[];
}

export interface TimelineEvent {
  id: number;
  type: string;
  label: string;
  severity: 'violation' | 'flag' | 'info';
  counted: boolean;
  receivedAtMs: number;
  clientElapsedMs: number | null;
  durationMs: number | null;
  details: Record<string, unknown>;
  snapshotId: string | null;
}

export interface SnapshotMeta {
  id: string;
  capturedAtMs: number;
  reason: string;
  faceCount: number | null;
  width: number | null;
  height: number | null;
}

export interface AssistantExchange {
  id: number;
  questionId: string;
  createdAtMs: number;
  status: 'pending' | 'processing' | 'answered' | 'failed';
  prompt: string;
  filePath: string | null;
  codeExcerpt: string | null;
  reply: string | null;
  latencyMs: number | null;
  costUsd: number | null;
}

export interface StaffMessage {
  id: string;
  body: string;
  sentAtMs: number;
  deliveredAtMs: number | null;
  acknowledgedAtMs: number | null;
  sentByEmail: string | null;
}

export interface SessionInfo {
  id: string;
  status: 'pending' | 'in_progress' | 'submitted';
  loginCount: number;
  consentAcceptedAtMs: number | null;
  consentVersion: string | null;
  startedAtMs: number | null;
  deadlineMs: number | null;
  durationSeconds: number;
  extensionSeconds: number;
  submittedAtMs: number | null;
  submitReason: SubmitReason | null;
  lastSeenMs: number | null;
  currentQuestionId: string | null;
  violationCount: number;
  aiUsed: number;
  reopenCount: number;
  violationsResetCount: number;
  clientInfo: Record<string, unknown>;
  violationPolicy: Record<string, unknown>;
  violationCounts: Record<string, number>;
}

export interface CandidateDetail {
  serverNowMs: number;
  state: InvitationState;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    roleApplied: string;
    experienceYears: number | null;
    requisitionId: string;
    notes: string;
    assignedReviewerId: string | null;
  };
  invitation: {
    id: string;
    status: 'active' | 'used' | 'revoked' | 'expired';
    codeHint: string;
    validFromMs: number;
    validUntilMs: number;
    createdAtMs: number;
    revokedAtMs: number | null;
    createdByEmail: string | null;
  };
  template: { id: string; name: string; durationMinutes: number };
  session: SessionInfo | null;
  questions: SessionQuestion[];
  /** Final code (super admins and the assigned reviewer only; empty for recruiters). */
  files: { questionId: string; path: string; content: string; updatedAtMs: number }[];
  responses: { questionId: string; status: string; notes: string }[];
  events: TimelineEvent[];
  snapshots: SnapshotMeta[];
  assistant: AssistantExchange[];
  messages: StaffMessage[];
}

export interface StaffMember extends Staff {
  isActive: boolean;
  signedInBefore: boolean;
  createdAtMs: number;
}

export interface AdminApi {
  readonly kind: 'supabase' | 'fake';
  /** The signed-in staff member, or null. */
  restore(): Promise<AdminResult<{ staff: Staff | null }>>;
  signIn(email: string, password: string): Promise<AdminResult<{ staff: Staff }>>;
  /** Microsoft sign-in (Entra ID), when enabled: leaves the page. */
  signInWithMicrosoft(): Promise<AdminResult<object>>;
  signOut(): Promise<void>;
  /** Called when the session ends elsewhere (expired, signed out in another tab). */
  onSignedOut(listener: () => void): () => void;

  overview(): Promise<AdminResult<Overview>>;
  listCandidates(q: {
    search?: string;
    state?: InvitationState | '';
    limit?: number;
    offset?: number;
  }): Promise<AdminResult<CandidateList>>;
  createInvitation(input: NewInvitation): Promise<AdminResult<IssuedCode>>;
  resetCode(invitationId: string): Promise<AdminResult<{ accessCode: string; codeHint: string }>>;
  updateWindow(
    invitationId: string,
    validFromMs: number,
    validUntilMs: number,
  ): Promise<AdminResult<{ validFromMs: number; validUntilMs: number }>>;
  revokeInvitation(invitationId: string, note: string): Promise<AdminResult<object>>;
  candidateDetail(invitationId: string): Promise<AdminResult<CandidateDetail>>;
  snapshotImage(snapshotId: string): Promise<AdminResult<{ jpegB64: string }>>;
  extendTime(sessionId: string, minutes: number, note: string): Promise<AdminResult<{ deadlineMs: number }>>;
  forceSubmit(sessionId: string, note: string): Promise<AdminResult<object>>;
  sendMessage(sessionId: string, body: string): Promise<AdminResult<{ messageId: string }>>;
  reopen(
    sessionId: string,
    extraMinutes: number,
    resetViolations: boolean,
    note: string,
  ): Promise<AdminResult<{ deadlineMs: number; remainingSeconds: number; violationsUncounted: number }>>;
  listStaff(): Promise<AdminResult<{ staff: StaffMember[] }>>;
  saveStaff(
    email: string,
    fullName: string,
    role: StaffRole,
    isActive: boolean,
  ): Promise<AdminResult<{ id: string }>>;
  updateSettings(s: {
    maxConcurrentSessions: number;
    grievanceContactEmail: string;
  }): Promise<AdminResult<object>>;
}
