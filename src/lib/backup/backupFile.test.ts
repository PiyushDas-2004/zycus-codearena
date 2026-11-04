import { describe, expect, it } from 'vitest';
import { bytesToBase64 } from '@/lib/crypto';
import { emptyRecord, fileKey } from '@/lib/persist/localRecord';
import { createBackup, openBackup } from './backupFile';

const key = bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));

function record() {
  const r = emptyRecord('aaaaaaaa-0000-4000-8000-000000000001', key);
  r.files[fileKey('q1', 'App.tsx')] = { content: 'export default 1;', seq: 7, synced: false };
  r.responses.q1 = { status: 'in_progress', notes: 'Root cause', seq: 8, synced: false };
  return r;
}

describe('encrypted offline backup', () => {
  it('round-trips with the session key', async () => {
    const env = await createBackup(record(), 1_000);
    expect(env.ciphertext_b64).not.toContain('export default');
    const opened = await openBackup(env, key);
    expect(opened.files[fileKey('q1', 'App.tsx')]?.content).toBe('export default 1;');
    expect(opened.responses.q1?.notes).toBe('Root cause');
  });

  it('rejects the wrong key', async () => {
    const env = await createBackup(record(), 1_000);
    const otherKey = bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
    await expect(openBackup(env, otherKey)).rejects.toThrow();
  });

  it('rejects a file relabelled for another session (AAD binding)', async () => {
    const env = await createBackup(record(), 1_000);
    await expect(
      openBackup({ ...env, session_id: 'bbbbbbbb-0000-4000-8000-000000000002' }, key),
    ).rejects.toThrow();
  });

  it('rejects tampered ciphertext', async () => {
    const env = await createBackup(record(), 1_000);
    const tampered =
      env.ciphertext_b64.slice(0, -4) + (env.ciphertext_b64.endsWith('AAA=') ? 'BBB=' : 'AAA=');
    await expect(openBackup({ ...env, ciphertext_b64: tampered }, key)).rejects.toThrow();
  });
});
