/**
 * Uploads webcam snapshots one at a time, at least 3.2 s apart (the server enforces 3 s), retrying
 * through network failures. The queue is small and in memory: if it overflows, the oldest periodic
 * snapshot is dropped first; snapshots taken for a violation are kept.
 */
import type { CandidateApi, SnapshotUpload } from '@/lib/api/types';

const MIN_SPACING_MS = 3200;
const MAX_QUEUE = 8;

export interface SnapshotUploaderOptions {
  api: CandidateApi;
  token: string;
  /** The session ended or the token is no longer valid: stop uploading. */
  onStopped?: (reason: string) => void;
  now?: () => number;
}

export class SnapshotUploader {
  private readonly queue: SnapshotUpload[] = [];
  private busy = false;
  private lastSentAt = -Infinity;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private failures = 0;

  constructor(private readonly o: SnapshotUploaderOptions) {}

  private now() {
    return this.o.now?.() ?? performance.now();
  }

  get pending(): number {
    return this.queue.length;
  }

  enqueue(s: SnapshotUpload) {
    if (this.stopped) return;
    this.queue.push(s);
    while (this.queue.length > MAX_QUEUE) {
      const i = this.queue.findIndex((x) => x.reason !== 'violation');
      this.queue.splice(i >= 0 ? i : 0, 1);
    }
    this.schedule(0);
  }

  private schedule(delayMs: number) {
    if (this.timer !== null || this.stopped) return;
    const wait = Math.max(delayMs, this.lastSentAt + MIN_SPACING_MS - this.now(), 0);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.pump();
    }, wait);
  }

  private async pump() {
    if (this.busy || this.stopped) return;
    const next = this.queue[0];
    if (!next) return;
    this.busy = true;
    this.lastSentAt = this.now();
    let retryIn = 0;
    try {
      const res = await this.o.api.uploadSnapshot(this.o.token, next);
      if (res.ok) {
        this.queue.shift();
        this.failures = 0;
      } else if (res.error === 'RATE_LIMITED') {
        retryIn = (res.retryAfterSeconds ?? 3) * 1000;
      } else if (res.error === 'NETWORK' || res.error === 'UNKNOWN') {
        this.failures++;
        retryIn = Math.min(30_000, 2000 * 2 ** Math.min(this.failures, 4));
      } else if (res.error === 'INVALID_PAYLOAD') {
        this.queue.shift(); // can't succeed; drop it
      } else {
        this.stop(res.error); // SUBMITTED, NOT_STARTED, SESSION_SUPERSEDED, INVALID_SESSION
      }
    } finally {
      this.busy = false;
    }
    if (this.queue.length) this.schedule(retryIn);
  }

  stop(reason = 'stopped') {
    if (this.stopped) return;
    this.stopped = true;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.queue.length = 0;
    this.o.onStopped?.(reason);
  }
}
