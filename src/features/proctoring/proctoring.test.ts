import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiResult, CandidateApi, SnapshotUpload } from '@/lib/api/types';
import { defaultViolationPolicy } from '@/shared/proctoringConfig';
import { installClipboardGuard, type GuardedEditor } from './clipboardGuard';
import { viewportShrink } from './devtoolsHeuristic';
import { FacePresence } from './faceMonitor';
import { installFocusMonitor } from './focusMonitor';
import { useProctoring } from './proctoringStore';
import { RateGate } from './rateGate';
import { blockedShortcut } from './shortcutGuard';
import { SnapshotUploader } from './snapshotUploader';
import { CadenceAnalyzer, nonWhitespaceLength } from './typingMonitor';
import { consequenceLine, decideOutcome, policyLines, sharedCount } from './violationPolicy';

describe('RateGate', () => {
  it('passes once per window and counts what it suppressed', () => {
    let t = 0;
    const gate = new RateGate(1000, () => t);
    expect(gate.pass('paste')).toBe(0);
    t = 100;
    expect(gate.pass('paste')).toBeNull();
    expect(gate.pass('paste')).toBeNull();
    expect(gate.pass('copy')).toBe(0);
    t = 1200;
    expect(gate.pass('paste')).toBe(2);
  });
});

describe('violation policy', () => {
  const p = defaultViolationPolicy; // shared: warn 2, submit at 5 · full screen: 3 · faces: 5

  it('another person on camera: 5 warnings, the 6th time submits', () => {
    for (let n = 1; n <= 5; n++) {
      expect(decideOutcome(p, 'multiple_faces', n, 0)).toEqual({ kind: 'warn', occurrence: n, warnings: 5 });
    }
    expect(decideOutcome(p, 'multiple_faces', 6, 0)).toEqual({ kind: 'auto_submit' });
    expect(consequenceLine(p, 'multiple_faces', 4, 0)).toBe(
      '1 more warning for this, then the next time your assessment is submitted automatically.',
    );
    expect(consequenceLine(p, 'multiple_faces', 5, 0)).toContain('last warning');
  });

  it('leaving full screen: 3 warnings, the 4th time submits', () => {
    expect(decideOutcome(p, 'fullscreen_exit', 3, 0)).toEqual({ kind: 'warn', occurrence: 3, warnings: 3 });
    expect(decideOutcome(p, 'fullscreen_exit', 4, 0)).toEqual({ kind: 'auto_submit' });
  });

  it('own-limit types stay out of the shared limit of 5', () => {
    const counts = { tab_switch: 2, fullscreen_exit: 3, multiple_faces: 5, no_face: 1 };
    expect(sharedCount(p, counts)).toBe(3);
    expect(decideOutcome(p, 'tab_switch', 3, 4)).toEqual({ kind: 'notice' });
    expect(decideOutcome(p, 'no_face', 2, 5)).toEqual({ kind: 'auto_submit' });
  });

  it('shared types warn twice each, then show notices', () => {
    expect(decideOutcome(p, 'tab_switch', 1, 1)).toEqual({ kind: 'warn', occurrence: 1, warnings: 2 });
    expect(decideOutcome(p, 'tab_switch', 2, 3)).toEqual({ kind: 'warn', occurrence: 2, warnings: 2 });
    expect(decideOutcome(p, 'tab_switch', 3, 4)).toEqual({ kind: 'notice' });
    expect(consequenceLine(p, 'tab_switch', 1, 2)).toBe(
      '2 of 5 violations recorded. At 5 your assessment is submitted automatically.',
    );
    expect(consequenceLine(p, 'tab_switch', 3, 4)).toContain('One more');
  });

  it('never auto-submits shared types under flag_only', () => {
    expect(decideOutcome({ ...p, onLimit: 'flag_only' }, 'tab_switch', 9, 50).kind).toBe('notice');
    expect(consequenceLine({ ...p, maxTotalViolations: 0 }, 'tab_switch', 1, 2)).toContain('reviewed');
  });

  it('summarises the policy for candidates', () => {
    const lines = policyLines(p);
    expect(lines[0]).toBe(
      'Leaving full screen: 3 warnings, then the next time your assessment is submitted automatically.',
    );
    expect(lines[1]).toBe(
      'Another person visible on camera: 5 warnings, then the next time your assessment is submitted automatically.',
    );
    expect(lines[2]).toMatch(/^Other rule breaks \(switching tabs or apps, .*after 5 in total/);
  });
});

describe('blockedShortcut', () => {
  const key = (k: string, mods: Partial<KeyboardEventInit> = {}) =>
    new KeyboardEvent('keydown', { key: k, ...mods });
  it('blocks DevTools, view-source, print, reload and tab shortcuts', () => {
    expect(blockedShortcut(key('F12'))).toBe('F12');
    expect(blockedShortcut(key('I', { ctrlKey: true, shiftKey: true }))).toBe('Ctrl+Shift+I');
    expect(blockedShortcut(key('u', { ctrlKey: true }))).toBe('Ctrl+U');
    expect(blockedShortcut(key('p', { ctrlKey: true }))).toBe('Ctrl+P');
    expect(blockedShortcut(key('F5'))).toBe('Reload');
    expect(blockedShortcut(key('w', { ctrlKey: true }))).toBe('Ctrl+W');
    expect(blockedShortcut(key('Tab', { altKey: true }))).toBe('Alt+Tab');
  });
  it('leaves editing shortcuts alone', () => {
    for (const [k, mods] of [
      ['s', { ctrlKey: true }],
      ['h', { ctrlKey: true }],
      ['d', { ctrlKey: true }],
      ['z', { ctrlKey: true }],
      ['K', { ctrlKey: true, shiftKey: true }],
      ['f', { ctrlKey: true }],
      ['a', {}],
      ['Escape', {}],
    ] as const) {
      expect(blockedShortcut(key(k, mods)), `${k}`).toBeNull();
    }
  });
});

describe('clipboard guard', () => {
  let dispose: () => void = () => undefined;
  afterEach(() => {
    dispose();
    document.body.innerHTML = '';
  });

  const clip = (type: string, target: EventTarget, text = '') => {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'clipboardData', { value: { getData: () => text } });
    target.dispatchEvent(e);
    return e;
  };

  function setup(allowInternalClipboard = false) {
    const onBlocked = vi.fn();
    const editorDom = document.createElement('div');
    const editorInput = document.createElement('textarea');
    editorDom.appendChild(editorInput);
    const notes = document.createElement('textarea');
    const statement = document.createElement('p');
    document.body.append(editorDom, notes, statement);
    const editor: GuardedEditor & { inserted: string[] } = {
      inserted: [],
      getDomNode: () => editorDom,
      getSelectedText: () => 'const x = 1;',
      insertText(t) {
        this.inserted.push(t);
      },
      deleteSelection: vi.fn(),
    };
    dispose = installClipboardGuard({
      blockPaste: true,
      blockCopy: true,
      blockDrop: true,
      blockContextMenu: true,
      allowInternalClipboard,
      getEditor: () => editor,
      onBlocked,
    });
    return { onBlocked, editor, editorInput, notes, statement };
  }

  it('cancels pastes everywhere and reports only the size', () => {
    const { onBlocked, editorInput, notes } = setup();
    const inEditor = clip('paste', editorInput, 'secret answer');
    const inNotes = clip('paste', notes, 'abc');
    expect(inEditor.defaultPrevented && inNotes.defaultPrevented).toBe(true);
    expect(onBlocked).toHaveBeenCalledWith('paste_attempt', { where: 'editor', chars: 13 });
    expect(onBlocked).toHaveBeenCalledWith('paste_attempt', { where: 'text_field', chars: 3 });
    expect(JSON.stringify(onBlocked.mock.calls)).not.toContain('secret');
  });

  it('cancels copying the question and the context menu', () => {
    const { onBlocked, statement } = setup();
    expect(clip('copy', statement).defaultPrevented).toBe(true);
    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    statement.dispatchEvent(menu);
    expect(menu.defaultPrevented).toBe(true);
    expect(onBlocked.mock.calls.map((c) => c[0])).toEqual(['copy_attempt', 'context_menu']);
  });

  it('cancels paste-like input (e.g. the browser menu) and drops', () => {
    const { onBlocked, notes } = setup();
    const input = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertFromPaste',
    });
    notes.dispatchEvent(input);
    const drop = new Event('drop', { bubbles: true, cancelable: true });
    notes.dispatchEvent(drop);
    expect(input.defaultPrevented && drop.defaultPrevented).toBe(true);
    expect(onBlocked).toHaveBeenCalledWith(
      'paste_attempt',
      expect.objectContaining({ via: 'insertFromPaste' }),
    );
  });

  it('internal clipboard: copy in the editor stays in memory and paste inserts it', () => {
    const { onBlocked, editor, editorInput } = setup(true);
    const copy = clip('copy', editorInput);
    expect(copy.defaultPrevented).toBe(true); // never reaches the system clipboard
    const paste = clip('paste', editorInput, 'something from outside');
    expect(paste.defaultPrevented).toBe(true);
    expect(editor.inserted).toEqual(['const x = 1;']);
    expect(onBlocked).not.toHaveBeenCalled();
  });

  it('internal clipboard: paste with nothing copied inside is still blocked', () => {
    const { onBlocked, editorInput, editor } = setup(true);
    clip('paste', editorInput, 'outside');
    expect(editor.inserted).toEqual([]);
    expect(onBlocked).toHaveBeenCalledWith('paste_attempt', { where: 'editor', chars: 7 });
  });
});

describe('focus monitor', () => {
  let visibility: DocumentVisibilityState = 'visible';
  beforeEach(() => {
    vi.useFakeTimers();
    visibility = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const install = (suppressed = false) => {
    const o = { onTabSwitch: vi.fn(), onWindowBlur: vi.fn(), onTabReturn: vi.fn() };
    const dispose = installFocusMonitor({
      tabSwitch: true,
      windowBlur: true,
      graceMs: 1500,
      ...o,
      suppressed: () => suppressed,
      now: () => Date.now(),
    });
    return { ...o, dispose };
  };

  it('reports a tab switch immediately and its length on return', () => {
    const m = install();
    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(m.onTabSwitch).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(4000);
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(m.onTabReturn).toHaveBeenCalledWith(4000);
    m.dispose();
  });

  it('reports window blur only after the grace period', () => {
    const m = install();
    window.dispatchEvent(new Event('blur'));
    vi.advanceTimersByTime(1000);
    window.dispatchEvent(new Event('focus'));
    vi.advanceTimersByTime(2000);
    expect(m.onWindowBlur).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('blur'));
    vi.advanceTimersByTime(1600);
    expect(m.onWindowBlur).toHaveBeenCalledTimes(1);
    m.dispose();
  });

  it('ignores focus changes the app expects (permission prompts)', () => {
    const m = install(true);
    window.dispatchEvent(new Event('blur'));
    vi.advanceTimersByTime(5000);
    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(m.onWindowBlur).not.toHaveBeenCalled();
    expect(m.onTabSwitch).not.toHaveBeenCalled();
    m.dispose();
  });
});

describe('typing signals', () => {
  it('measures insertions without whitespace (formatting is not suspicious)', () => {
    expect(nonWhitespaceLength('  \n\t  ')).toBe(0);
    expect(nonWhitespaceLength('const a = 1;\n')).toBe(9);
  });

  it('flags a machine-perfect rhythm but not human typing', () => {
    const robot = new CadenceAnalyzer(25);
    let finding = null;
    for (let i = 0; i < 45; i++) finding = robot.push(i * 80) ?? finding;
    expect(finding).toMatchObject({ kind: 'uniform_rhythm', meanMs: 80 });

    const human = new CadenceAnalyzer(25);
    let t = 0;
    let humanFinding = null;
    for (let i = 0; i < 200; i++) {
      t += 90 + ((i * 37) % 120);
      humanFinding = human.push(t) ?? humanFinding;
    }
    expect(humanFinding).toBeNull();
  });

  it('flags sustained speed above the limit', () => {
    const a = new CadenceAnalyzer(10);
    let finding = null;
    for (let i = 0; i < 60; i++) finding = a.push(i * 30 + (i % 3)) ?? finding;
    expect(finding).toMatchObject({ kind: 'speed' });
  });
});

describe('FacePresence', () => {
  it('reports no face after the configured time, once, and re-arms when a face returns', () => {
    const f = new FacePresence(10_000, 2);
    expect(f.update(0, 0)).toEqual([]);
    expect(f.update(0, 9_000)).toEqual([]);
    expect(f.update(0, 10_000)).toEqual([{ type: 'no_face', sinceMs: 10_000 }]);
    expect(f.update(0, 12_000)).toEqual([]);
    expect(f.update(1, 14_000)).toEqual([{ type: 'face_back', missingMs: 14_000 }]);
    expect(f.update(0, 15_000)).toEqual([]);
  });

  it('needs consecutive multi-face frames and applies a cooldown', () => {
    const f = new FacePresence(10_000, 2, 30_000);
    expect(f.update(2, 0)).toEqual([]);
    expect(f.update(1, 2_000)).toEqual([]); // streak broken
    expect(f.update(2, 4_000)).toEqual([]);
    expect(f.update(3, 6_000)).toEqual([{ type: 'multiple_faces', count: 3 }]);
    expect(f.update(2, 8_000)).toEqual([]); // cooldown
    expect(f.update(2, 40_000)).toEqual([{ type: 'multiple_faces', count: 2 }]);
  });
});

describe('DevTools heuristic', () => {
  const base = { innerWidth: 1920, innerHeight: 1080, outerWidth: 1920, outerHeight: 1080, dpr: 1 };
  it('sees a docked panel as a shrinking viewport in an unchanged window', () => {
    expect(viewportShrink(base, { ...base, innerWidth: 1420 })).toEqual({ dw: 500, dh: 0 });
  });
  it('ignores zoom and window resizes', () => {
    expect(viewportShrink(base, { ...base, innerWidth: 1536, dpr: 1.25 })).toBeNull();
    expect(viewportShrink(base, { ...base, innerWidth: 1200, outerWidth: 1200 })).toBeNull();
  });
});

describe('SnapshotUploader', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const snap = (id: string, reason = 'periodic'): SnapshotUpload => ({
    clientSnapshotId: id,
    reason,
    faceCount: 1,
    width: 320,
    height: 240,
    jpegB64: '/9j/AAAA',
  });

  function fakeApi(results: ApiResult<{ snapshotId: string }>[]) {
    const calls: string[] = [];
    const api = {
      uploadSnapshot: vi.fn(async (_t: string, s: SnapshotUpload) => {
        calls.push(s.clientSnapshotId);
        return (
          results.shift() ?? {
            ok: true as const,
            snapshotId: s.clientSnapshotId,
            timing: { sentAtPerf: 0, receivedAtPerf: 0 },
          }
        );
      }),
    } as unknown as CandidateApi;
    return { api, calls };
  }

  it('uploads one at a time, at least 3.2 s apart', async () => {
    const { api, calls } = fakeApi([]);
    const u = new SnapshotUploader({ api, token: 't', now: () => Date.now() });
    u.enqueue(snap('a'));
    u.enqueue(snap('b'));
    await vi.advanceTimersByTimeAsync(10);
    expect(calls).toEqual(['a']);
    await vi.advanceTimersByTimeAsync(3000);
    expect(calls).toEqual(['a']);
    await vi.advanceTimersByTimeAsync(300);
    expect(calls).toEqual(['a', 'b']);
  });

  it('retries network failures and stops when the session is over', async () => {
    const { api, calls } = fakeApi([
      { ok: false, error: 'NETWORK' },
      { ok: false, error: 'SUBMITTED' },
    ]);
    const onStopped = vi.fn();
    const u = new SnapshotUploader({ api, token: 't', onStopped, now: () => Date.now() });
    u.enqueue(snap('a'));
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(5000);
    expect(calls).toEqual(['a', 'a']);
    expect(onStopped).toHaveBeenCalledWith('SUBMITTED');
    u.enqueue(snap('b'));
    expect(u.pending).toBe(0);
  });

  it('drops periodic snapshots first when the queue overflows', () => {
    const { api } = fakeApi([{ ok: false, error: 'NETWORK' }]);
    const u = new SnapshotUploader({ api, token: 't', now: () => Date.now() });
    u.enqueue(snap('v1', 'violation'));
    for (let i = 0; i < 9; i++) u.enqueue(snap(`p${i}`));
    expect(u.pending).toBe(8);
    const queue = (u as unknown as { queue: SnapshotUpload[] }).queue.map((s) => s.clientSnapshotId);
    expect(queue[0]).toBe('v1');
    expect(queue).not.toContain('p0');
  });
});

describe('proctoring store', () => {
  it('orders blockers by urgency and ignores duplicates', () => {
    const s = useProctoring.getState();
    s.reset();
    s.setBlocker('fullscreen', true);
    s.setBlocker('camera', true);
    s.setBlocker('camera', true);
    expect(useProctoring.getState().blockers).toEqual(['camera', 'fullscreen']);
    s.setBlocker('camera', false);
    expect(useProctoring.getState().blockers).toEqual(['fullscreen']);
    s.reset();
  });
});
