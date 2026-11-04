/**
 * Keystroke replay recorder. Captures every editor change (offset-based deltas) and file switch with
 * a timestamp on the server-anchored clock, and packs them into gzip-compressed chunks for the sync
 * engine. On each (re)load a full-content "snapshot" op is recorded per file, so the reviewer's
 * replay can always resynchronise even if a chunk is missing.
 *
 * Wire format (JSON array before gzip), one op per entry:
 *   { t, k: 'edit', q, f, c: [[offset, removedLength, insertedText], ...], v? }  (v: full text if large)
 *   { t, k: 'open', q, f }
 *   { t, k: 'snap', q, f, v }
 *   { t, k: 'notes', q, len }   (notes length only — the text itself is saved separately)
 */
import { gzipSync, strToU8 } from 'fflate';
import { bytesToBase64 } from '@/lib/crypto';
import type { SyncChunk } from '@/lib/api/types';

export type ReplayOp =
  | { t: number; k: 'edit'; q: number; f: string; c: [number, number, string][] }
  | { t: number; k: 'open'; q: number; f: string }
  | { t: number; k: 'snap'; q: number; f: string; v: string }
  | { t: number; k: 'notes'; q: number; len: number };

/** A replay op without its timestamp (distributes over the union so each variant keeps its fields). */
export type ReplayOpInput = ReplayOp extends infer O ? (O extends ReplayOp ? Omit<O, 't'> : never) : never;

/** Keep each compressed chunk well under the server's 1 MiB limit. */
const MAX_OPS_PER_CHUNK = 4000;
const MAX_RAW_BYTES_PER_CHUNK = 2_000_000;

export class ReplayRecorder {
  private ops: ReplayOp[] = [];
  private rawBytes = 0;

  constructor(
    private readonly elapsedMs: () => number,
    private readonly emit: (chunk: Omit<SyncChunk, 'seq'>) => void,
  ) {}

  record(op: ReplayOpInput): void {
    const full = { ...op, t: Math.max(0, Math.round(this.elapsedMs())) } as ReplayOp;
    this.ops.push(full);
    this.rawBytes += 'v' in full ? full.v.length + 40 : 'c' in full ? JSON.stringify(full.c).length + 40 : 40;
    if (this.ops.length >= MAX_OPS_PER_CHUNK || this.rawBytes >= MAX_RAW_BYTES_PER_CHUNK) this.flush();
  }

  /** Packs buffered ops into a chunk (called before every sync and on submit). */
  flush(): void {
    if (this.ops.length === 0) return;
    const ops = this.ops;
    this.ops = [];
    this.rawBytes = 0;
    const json = JSON.stringify(ops);
    this.emit({
      client_start_ms: ops[0]?.t ?? 0,
      client_end_ms: ops[ops.length - 1]?.t ?? 0,
      event_count: ops.length,
      payload_b64: bytesToBase64(gzipSync(strToU8(json), { level: 6 })),
    });
  }

  get pending(): number {
    return this.ops.length;
  }
}
