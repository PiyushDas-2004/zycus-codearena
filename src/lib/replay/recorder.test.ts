import { gunzipSync, strFromU8 } from 'fflate';
import { describe, expect, it } from 'vitest';
import { base64ToBytes } from '@/lib/crypto';
import type { SyncChunk } from '@/lib/api/types';
import { ReplayRecorder, type ReplayOp } from './recorder';

const decode = (c: Omit<SyncChunk, 'seq'>) =>
  JSON.parse(strFromU8(gunzipSync(base64ToBytes(c.payload_b64)))) as ReplayOp[];

describe('ReplayRecorder', () => {
  it('packs timestamped ops into a gzip chunk on flush', () => {
    let t = 1000;
    const chunks: Omit<SyncChunk, 'seq'>[] = [];
    const rec = new ReplayRecorder(
      () => t,
      (c) => chunks.push(c),
    );
    rec.record({ k: 'snap', q: 1, f: 'App.tsx', v: 'abc' });
    t = 1500;
    rec.record({ k: 'edit', q: 1, f: 'App.tsx', c: [[3, 0, 'd']] });
    rec.flush();
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ client_start_ms: 1000, client_end_ms: 1500, event_count: 2 });
    expect(decode(chunks[0] as Omit<SyncChunk, 'seq'>)).toEqual([
      { k: 'snap', q: 1, f: 'App.tsx', v: 'abc', t: 1000 },
      { k: 'edit', q: 1, f: 'App.tsx', c: [[3, 0, 'd']], t: 1500 },
    ]);
  });

  it('emits nothing when idle and splits very long sessions into multiple chunks', () => {
    const chunks: Omit<SyncChunk, 'seq'>[] = [];
    const rec = new ReplayRecorder(
      () => 0,
      (c) => chunks.push(c),
    );
    rec.flush();
    expect(chunks).toHaveLength(0);
    for (let i = 0; i < 9000; i++) rec.record({ k: 'edit', q: 1, f: 'a.ts', c: [[i, 0, 'x']] });
    rec.flush();
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks.reduce((n, c) => n + c.event_count, 0)).toBe(9000);
    for (const c of chunks) expect(c.payload_b64.length).toBeLessThan(1_398_100);
  });
});
