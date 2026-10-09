import type { Workspace } from '@/lib/api/types';
import { emptyRecord, fileKey, type LocalRecord } from '@/lib/persist/localRecord';

/**
 * Reconciles the on-device record with the server's copy when the workspace (re)loads.
 * For every file and note the higher client_seq wins: unsynced local edits made while offline (or
 * just before a crash) survive, and anything the server has that this device doesn't is adopted.
 */
export function mergeWorkspace(
  local: LocalRecord | undefined,
  ws: Workspace,
): { record: LocalRecord; resumed: boolean } {
  const resumed = !!local && local.sessionId === ws.state.sessionId;
  const rec = resumed && local ? local : emptyRecord(ws.state.sessionId, ws.backupKeyB64);
  if (ws.backupKeyB64) rec.backupKeyB64 = ws.backupKeyB64;

  let maxSeq = rec.clientSeq;
  const serverKeys = new Set<string>();
  for (const f of ws.files) {
    const k = fileKey(f.questionId, f.path);
    serverKeys.add(k);
    const mine = rec.files[k];
    if (!mine || mine.seq <= f.clientSeq)
      rec.files[k] = { content: f.content, seq: f.clientSeq, synced: true };
    maxSeq = Math.max(maxSeq, f.clientSeq, mine?.seq ?? 0);
  }
  rec.files = Object.fromEntries(Object.entries(rec.files).filter(([k]) => serverKeys.has(k)));

  const serverQuestions = new Set(ws.questions.map((q) => q.questionId));
  for (const r of ws.responses) {
    const mine = rec.responses[r.questionId];
    if (!mine || mine.seq <= r.clientSeq) {
      rec.responses[r.questionId] = { status: r.status, notes: r.notes, seq: r.clientSeq, synced: true };
    }
    maxSeq = Math.max(maxSeq, r.clientSeq, mine?.seq ?? 0);
  }
  rec.responses = Object.fromEntries(Object.entries(rec.responses).filter(([q]) => serverQuestions.has(q)));

  rec.clientSeq = maxSeq;
  rec.nextChunkSeq = Math.max(rec.nextChunkSeq, ws.nextChunkSeq);
  if (rec.ui.currentQuestionId && !serverQuestions.has(rec.ui.currentQuestionId))
    rec.ui.currentQuestionId = null;
  return { record: rec, resumed };
}
