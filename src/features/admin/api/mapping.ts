/** Maps the admin API's snake_case JSON onto the portal's types, tolerating missing fields. */
import type {
  AdminErrorCode,
  AdminFailure,
  CandidateDetail,
  CandidateRow,
  InvitationState,
  Overview,
  SessionInfo,
  Staff,
  StaffMember,
  StaffRole,
  SubmitReason,
} from './types';

type Raw = Record<string, unknown>;

const obj = (v: unknown): Raw => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : {});
const arr = (v: unknown): Raw[] => (Array.isArray(v) ? v.map(obj) : []);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const strOrNull = (v: unknown) => (typeof v === 'string' ? v : null);
const num = (v: unknown, d = 0) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : d;
};
const numOrNull = (v: unknown) => {
  const n = v === null || v === undefined || v === '' ? NaN : num(v, NaN);
  return Number.isFinite(n) ? n : null;
};
const bool = (v: unknown) => v === true;

const KNOWN_ERRORS = new Set<AdminErrorCode>([
  'NOT_STAFF',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_PAYLOAD',
  'DUPLICATE_ACTIVE',
  'TEMPLATE_INACTIVE',
  'NOT_IN_PROGRESS',
  'NOT_SUBMITTED',
  'ALREADY_STARTED',
  'ALREADY_FINISHED',
  'NO_TIME_LEFT',
  'EXTENSION_LIMIT',
]);

export function failure(raw: unknown): AdminFailure {
  const r = obj(raw);
  const code = str(r.error) as AdminErrorCode;
  return {
    ok: false,
    error: KNOWN_ERRORS.has(code) ? code : 'UNKNOWN',
    message: strOrNull(r.message) ?? undefined,
    field: strOrNull(r.field) ?? undefined,
    invitationId: strOrNull(r.invitation_id) ?? undefined,
  };
}

export const staff = (v: unknown): Staff => {
  const s = obj(v);
  return { id: str(s.id), email: str(s.email), fullName: str(s.full_name), role: str(s.role) as StaffRole };
};

export function overview(r: Raw): Overview {
  const c = obj(r.counts);
  const w = obj(r.worker);
  const b = obj(r.budget);
  const s = obj(r.settings);
  return {
    serverNowMs: num(r.server_now_ms, Date.now()),
    counts: {
      invited: num(c.invited),
      inProgress: num(c.in_progress),
      submitted: num(c.submitted),
      submittedLast7Days: num(c.submitted_last_7_days),
      expired: num(c.expired),
      revoked: num(c.revoked),
    },
    worker: {
      online: bool(w.online),
      lastSeenMs: numOrNull(w.last_seen_ms),
      label: strOrNull(w.label),
      configured: bool(w.configured),
    },
    budget: { spentUsd: num(b.spent_usd), capUsd: num(b.cap_usd), worstCaseUsd: num(b.worst_case_usd) },
    settings: {
      maxConcurrentSessions: num(s.max_concurrent_sessions, 1),
      grievanceContactEmail: strOrNull(s.grievance_contact_email),
      saveGraceSeconds: num(s.save_grace_seconds),
    },
    templates: arr(r.templates).map((t) => ({
      id: str(t.id),
      slug: str(t.slug),
      name: str(t.name),
      targetRole: str(t.target_role),
      durationMinutes: num(t.duration_minutes),
      isActive: bool(t.is_active),
      questionCount: num(t.question_count),
    })),
    reviewers: arr(r.reviewers).map(staff),
  };
}

export function candidateRow(r: Raw): CandidateRow {
  return {
    invitationId: str(r.invitation_id),
    candidateId: str(r.candidate_id),
    sessionId: strOrNull(r.session_id),
    fullName: str(r.full_name),
    email: str(r.email),
    roleApplied: str(r.role_applied),
    requisitionId: str(r.requisition_id),
    templateName: str(r.template_name),
    state: str(r.state, 'invited') as InvitationState,
    codeHint: str(r.code_hint),
    createdAtMs: num(r.created_at_ms),
    validFromMs: num(r.valid_from_ms),
    validUntilMs: num(r.valid_until_ms),
    startedAtMs: numOrNull(r.started_at_ms),
    deadlineMs: numOrNull(r.deadline_ms),
    submittedAtMs: numOrNull(r.submitted_at_ms),
    submitReason: (strOrNull(r.submit_reason) as SubmitReason | null) ?? null,
    lastSeenMs: numOrNull(r.last_seen_ms),
    violationCount: num(r.violation_count),
    flagCount: num(r.flag_count),
    aiUsed: num(r.ai_used),
    reopenCount: num(r.reopen_count),
    tests: Object.fromEntries(
      Object.entries(obj(r.tests)).map(([q, t]) => [
        q,
        { passed: num(obj(t).passed), total: num(obj(t).total) },
      ]),
    ),
  };
}

function session(v: unknown): SessionInfo | null {
  if (!v || typeof v !== 'object') return null;
  const s = obj(v);
  return {
    id: str(s.id),
    status: str(s.status, 'pending') as SessionInfo['status'],
    loginCount: num(s.login_count),
    consentAcceptedAtMs: numOrNull(s.consent_accepted_at_ms),
    consentVersion: strOrNull(s.consent_version),
    startedAtMs: numOrNull(s.started_at_ms),
    deadlineMs: numOrNull(s.deadline_ms),
    durationSeconds: num(s.duration_seconds),
    extensionSeconds: num(s.extension_seconds),
    submittedAtMs: numOrNull(s.submitted_at_ms),
    submitReason: (strOrNull(s.submit_reason) as SubmitReason | null) ?? null,
    lastSeenMs: numOrNull(s.last_seen_ms),
    currentQuestionId: strOrNull(s.current_question_id),
    violationCount: num(s.violation_count),
    aiUsed: num(s.ai_used),
    reopenCount: num(s.reopen_count),
    violationsResetCount: num(s.violations_reset_count),
    clientInfo: obj(s.client_info),
    violationPolicy: obj(s.violation_policy),
    violationCounts: Object.fromEntries(Object.entries(obj(s.violation_counts)).map(([k, n]) => [k, num(n)])),
  };
}

export function candidateDetail(r: Raw): CandidateDetail {
  const c = obj(r.candidate);
  const i = obj(r.invitation);
  const t = obj(r.template);
  return {
    serverNowMs: num(r.server_now_ms, Date.now()),
    state: str(r.state, 'invited') as InvitationState,
    candidate: {
      id: str(c.id),
      fullName: str(c.full_name),
      email: str(c.email),
      roleApplied: str(c.role_applied),
      experienceYears: numOrNull(c.experience_years),
      requisitionId: str(c.requisition_id),
      notes: str(c.notes),
      assignedReviewerId: strOrNull(c.assigned_reviewer_id),
    },
    invitation: {
      id: str(i.id),
      status: str(i.status, 'active') as CandidateDetail['invitation']['status'],
      codeHint: str(i.code_hint),
      validFromMs: num(i.valid_from_ms),
      validUntilMs: num(i.valid_until_ms),
      createdAtMs: num(i.created_at_ms),
      revokedAtMs: numOrNull(i.revoked_at_ms),
      createdByEmail: strOrNull(i.created_by_email),
    },
    template: { id: str(t.id), name: str(t.name), durationMinutes: num(t.duration_minutes) },
    session: session(r.session),
    questions: arr(r.questions).map((q) => ({
      questionId: str(q.question_id),
      position: num(q.position),
      title: str(q.title),
      statementMd: str(q.statement_md),
      starterFiles: arr(q.starter_files).map((f) => ({
        path: str(f.path),
        language: str(f.language, 'plaintext'),
        content: str(f.content),
        readonly: bool(f.readonly),
      })),
      rubric: arr(q.rubric).map((x) => ({
        key: str(x.key),
        criterion: str(x.criterion),
        description: str(x.description),
        maxPoints: num(x.max_points),
      })),
    })),
    files: arr(r.files).map((f) => ({
      questionId: str(f.question_id),
      path: str(f.path),
      content: str(f.content),
      updatedAtMs: num(f.updated_at_ms),
    })),
    responses: arr(r.responses).map((x) => ({
      questionId: str(x.question_id),
      status: str(x.status),
      notes: str(x.notes),
    })),
    events: arr(r.events).map((e) => ({
      id: num(e.id),
      type: str(e.type),
      label: str(e.label, str(e.type)),
      severity: str(e.severity, 'info') as CandidateDetail['events'][number]['severity'],
      counted: bool(e.counted),
      receivedAtMs: num(e.received_at_ms),
      clientElapsedMs: numOrNull(e.client_elapsed_ms),
      durationMs: numOrNull(e.duration_ms),
      details: obj(e.details),
      snapshotId: strOrNull(e.snapshot_id),
    })),
    snapshots: arr(r.snapshots).map((s) => ({
      id: str(s.id),
      capturedAtMs: num(s.captured_at_ms),
      reason: str(s.reason),
      faceCount: numOrNull(s.face_count),
      width: numOrNull(s.width),
      height: numOrNull(s.height),
    })),
    assistant: arr(r.assistant).map((a) => ({
      id: num(a.id),
      questionId: str(a.question_id),
      createdAtMs: num(a.created_at_ms),
      status: str(a.status, 'pending') as CandidateDetail['assistant'][number]['status'],
      prompt: str(a.prompt),
      filePath: strOrNull(a.file_path),
      codeExcerpt: strOrNull(a.code_excerpt),
      reply: strOrNull(a.reply),
      latencyMs: numOrNull(a.latency_ms),
      costUsd: numOrNull(a.cost_usd),
    })),
    messages: arr(r.messages).map((m) => ({
      id: str(m.id),
      body: str(m.body),
      sentAtMs: num(m.sent_at_ms),
      deliveredAtMs: numOrNull(m.delivered_at_ms),
      acknowledgedAtMs: numOrNull(m.acknowledged_at_ms),
      sentByEmail: strOrNull(m.sent_by_email),
    })),
  };
}

export const staffMember = (v: unknown): StaffMember => {
  const s = obj(v);
  return {
    ...staff(s),
    isActive: bool(s.is_active),
    signedInBefore: bool(s.signed_in_before),
    createdAtMs: num(s.created_at_ms),
  };
};
