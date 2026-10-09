/**
 * Last-resort offline backup. If the network is down when time runs out, the candidate can
 * download their work as an encrypted file and send it to the Zycus TA team; an admin imports it.
 *
 * Encryption: AES-256-GCM with the per-session key the server issued at start (kept in
 * private.session_secrets, readable only through an admin function). The session id is bound in as
 * additional authenticated data, so a file can't be replayed against another session.
 * Limitation (documented): the key also lives in the candidate's browser, so the format protects
 * confidentiality in transit, not against a candidate forging a file. The admin import therefore
 * shows a diff against the last server-synced state.
 */
import type { LocalRecord } from '@/lib/persist/localRecord';
import { base64ToBytes, bytesToBase64 } from '@/lib/crypto';

export const BACKUP_FORMAT = 'zycus-codearena/backup@1';

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  session_id: string;
  created_client_ms: number;
  server_time_estimate_ms: number;
  alg: 'AES-256-GCM';
  iv_b64: string;
  ciphertext_b64: string;
}

export interface BackupContents {
  sessionId: string;
  files: LocalRecord['files'];
  responses: LocalRecord['responses'];
  events: LocalRecord['events'];
  chunks: LocalRecord['chunks'];
  clientSeq: number;
}

async function importKey(keyB64: string): Promise<CryptoKey> {
  const raw = base64ToBytes(keyB64);
  if (raw.length !== 32) throw new Error('Backup key must be 256 bits');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function createBackup(
  record: LocalRecord,
  serverTimeEstimateMs: number,
): Promise<BackupEnvelope> {
  const contents: BackupContents = {
    sessionId: record.sessionId,
    files: record.files,
    responses: record.responses,
    events: record.events,
    chunks: record.chunks,
    clientSeq: record.clientSeq,
  };
  const key = await importKey(record.backupKeyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(record.sessionId) },
    key,
    new TextEncoder().encode(JSON.stringify(contents)),
  );
  return {
    format: BACKUP_FORMAT,
    session_id: record.sessionId,
    created_client_ms: Date.now(),
    server_time_estimate_ms: Math.round(serverTimeEstimateMs),
    alg: 'AES-256-GCM',
    iv_b64: bytesToBase64(iv),
    ciphertext_b64: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

/** Used by the admin import (Phase 4). Throws if the key, session or file was tampered with. */
export async function openBackup(envelope: BackupEnvelope, keyB64: string): Promise<BackupContents> {
  if (envelope.format !== BACKUP_FORMAT) throw new Error('Not a CodeArena backup file');
  const key = await importKey(keyB64);
  const plain = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64ToBytes(envelope.iv_b64),
      additionalData: new TextEncoder().encode(envelope.session_id),
    },
    key,
    base64ToBytes(envelope.ciphertext_b64),
  );
  const contents = JSON.parse(new TextDecoder().decode(plain)) as BackupContents;
  if (contents.sessionId !== envelope.session_id) throw new Error('Backup session mismatch');
  return contents;
}

/** Triggers a browser download of the backup file. */
export function downloadBackup(envelope: BackupEnvelope, candidateName: string): void {
  const safeName =
    candidateName
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'candidate';
  const blob = new Blob([JSON.stringify(envelope)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `codearena-backup-${safeName}-${envelope.session_id.slice(0, 8)}.codearena-backup`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
