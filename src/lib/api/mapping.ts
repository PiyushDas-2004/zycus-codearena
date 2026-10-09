import type { SessionState, Workspace } from './types';

/* Converts the snake_case JSON returned by the SQL functions into the client's camelCase types. */

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === 'object' ? (v as Raw) : {});
const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

export function mapState(raw: unknown): SessionState {
  const s = obj(raw);
  const c = obj(s.candidate);
  const t = obj(s.template);
  const st = obj(s.settings);
  return {
    sessionId: str(s.session_id),
    status: str(s.status, 'pending') as SessionState['status'],
    serverNowMs: num(s.server_now_ms, Date.now()),
    startedAtMs: numOrNull(s.started_at_ms),
    deadlineMs: numOrNull(s.deadline_ms),
    durationSeconds: num(s.duration_seconds),
    extensionSeconds: num(s.extension_seconds),
    submittedAtMs: numOrNull(s.submitted_at_ms),
    submitReason: (s.submit_reason as SessionState['submitReason']) ?? null,
    consentAccepted: s.consent_accepted === true,
    violationCount: num(s.violation_count),
    candidate: { fullName: str(c.full_name), email: str(c.email) },
    template: {
      name: str(t.name),
      targetRole: str(t.target_role),
      durationMinutes: num(t.duration_minutes),
      instructionsMd: str(t.instructions_md),
      questionCount: num(t.question_count),
    },
    proctoring: s.proctoring ?? {},
    violationPolicy: s.violation_policy ?? {},
    settings: {
      saveGraceSeconds: num(st.save_grace_seconds, 10),
      grievanceContactEmail:
        typeof st.grievance_contact_email === 'string' ? st.grievance_contact_email : null,
      candidateDataRetentionDays: num(st.candidate_data_retention_days, 365),
      snapshotRetentionDays: num(st.snapshot_retention_days, 90),
    },
    messages: Array.isArray(s.messages)
      ? s.messages.map((m) => {
          const mm = obj(m);
          return { id: str(mm.id), body: str(mm.body), sentAtMs: num(mm.sent_at_ms) };
        })
      : [],
  };
}

export function mapWorkspace(raw: unknown): Workspace {
  const w = obj(raw);
  const arr = (v: unknown): Raw[] => (Array.isArray(v) ? v.map(obj) : []);
  return {
    state: mapState(w.state),
    backupKeyB64: str(w.backup_key_b64),
    questions: arr(w.questions)
      .map((q) => ({
        questionId: str(q.question_id),
        position: num(q.position),
        title: str(q.title),
        statementMd: str(q.statement_md),
        files: arr(q.files).map((f) => ({
          path: str(f.path),
          language: str(f.language, 'plaintext'),
          readonly: f.readonly === true,
          content: str(f.content),
        })),
      }))
      .sort((a, b) => a.position - b.position),
    files: arr(w.files).map((f) => ({
      questionId: str(f.question_id),
      path: str(f.path),
      content: str(f.content),
      clientSeq: num(f.client_seq),
    })),
    responses: arr(w.responses).map((r) => ({
      questionId: str(r.question_id),
      status: str(r.status, 'not_started') as Workspace['responses'][number]['status'],
      notes: str(r.notes),
      clientSeq: num(r.client_seq),
    })),
    nextChunkSeq: num(w.next_chunk_seq),
  };
}
