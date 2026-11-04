import { describe, expect, it } from 'vitest';
import type { Workspace } from '@/lib/api/types';
import { emptyRecord, fileKey } from '@/lib/persist/localRecord';
import { mergeWorkspace } from './mergeWorkspace';

const ws = (
  files: Workspace['files'],
  responses: Workspace['responses'] = [],
  nextChunkSeq = 0,
  violationsResetCount = 0,
): Workspace =>
  ({
    state: { sessionId: 's1', violationsResetCount },
    backupKeyB64: 'KEY',
    questions: [{ questionId: 'q1', position: 1, title: 'Q1', statementMd: '', files: [] }],
    files,
    responses,
    nextChunkSeq,
  }) as unknown as Workspace;

describe('mergeWorkspace', () => {
  it('starts a fresh record from the server copy', () => {
    const { record, resumed } = mergeWorkspace(
      undefined,
      ws([{ questionId: 'q1', path: 'a.ts', content: 'S', clientSeq: 0 }]),
    );
    expect(resumed).toBe(false);
    expect(record.files[fileKey('q1', 'a.ts')]).toEqual({ content: 'S', seq: 0, synced: true });
    expect(record.backupKeyB64).toBe('KEY');
  });

  it('keeps newer unsynced local edits (offline before a refresh)', () => {
    const local = emptyRecord('s1');
    local.clientSeq = 12;
    local.files[fileKey('q1', 'a.ts')] = { content: 'local v12', seq: 12, synced: false };
    const { record, resumed } = mergeWorkspace(
      local,
      ws([{ questionId: 'q1', path: 'a.ts', content: 'server v9', clientSeq: 9 }]),
    );
    expect(resumed).toBe(true);
    expect(record.files[fileKey('q1', 'a.ts')]).toEqual({ content: 'local v12', seq: 12, synced: false });
    expect(record.clientSeq).toBe(12);
  });

  it('adopts the server copy when it is newer (e.g. work continued on another device)', () => {
    const local = emptyRecord('s1');
    local.files[fileKey('q1', 'a.ts')] = { content: 'old', seq: 3, synced: true };
    local.responses.q1 = { status: 'in_progress', notes: 'old notes', seq: 4, synced: true };
    const { record } = mergeWorkspace(
      local,
      ws(
        [{ questionId: 'q1', path: 'a.ts', content: 'newer', clientSeq: 20 }],
        [{ questionId: 'q1', status: 'marked_for_review', notes: 'new notes', clientSeq: 21 }],
      ),
    );
    expect(record.files[fileKey('q1', 'a.ts')]?.content).toBe('newer');
    expect(record.responses.q1).toEqual({
      status: 'marked_for_review',
      notes: 'new notes',
      seq: 21,
      synced: true,
    });
    expect(record.clientSeq).toBe(21); // next local edit is ordered after everything known
  });

  it('never reuses a keystroke-chunk sequence number', () => {
    const local = emptyRecord('s1');
    local.nextChunkSeq = 7;
    expect(mergeWorkspace(local, ws([], [], 4)).record.nextChunkSeq).toBe(7);
    expect(mergeWorkspace(emptyRecord('s1'), ws([], [], 4)).record.nextChunkSeq).toBe(4);
  });

  it('discards a record that belongs to a different session', () => {
    const other = emptyRecord('another-session');
    other.files[fileKey('q1', 'a.ts')] = { content: 'not mine', seq: 99, synced: false };
    const { record, resumed } = mergeWorkspace(
      other,
      ws([{ questionId: 'q1', path: 'a.ts', content: 'S', clientSeq: 0 }]),
    );
    expect(resumed).toBe(false);
    expect(record.files[fileKey('q1', 'a.ts')]?.content).toBe('S');
  });

  it('forgets the warnings counted on this device when staff reopened the test with fresh ones', () => {
    const local = emptyRecord('s1');
    local.violationCounts = { fullscreen_exit: 4, tab_switch: 1 };
    const { record } = mergeWorkspace(local, ws([], [], 0, 1));
    expect(record.violationCounts).toEqual({});
    expect(record.violationsResetSeen).toBe(1);

    // Warnings after the reset are kept on the next load (same reset), until a later reset.
    record.violationCounts = { fullscreen_exit: 1 };
    expect(mergeWorkspace(record, ws([], [], 0, 1)).record.violationCounts).toEqual({ fullscreen_exit: 1 });
    expect(mergeWorkspace(record, ws([], [], 0, 2)).record.violationCounts).toEqual({});
  });

  it('keeps the warnings when the test was never reset', () => {
    const local = emptyRecord('s1');
    local.violationCounts = { tab_switch: 2 };
    expect(mergeWorkspace(local, ws([])).record.violationCounts).toEqual({ tab_switch: 2 });
  });
});
