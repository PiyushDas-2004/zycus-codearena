import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JAVA_TOO_SLOW } from '@/shared/javaModel';

/** A stand-in for the browser's Worker: the test answers each posted file itself. */
class FakeWorker {
  static instances: FakeWorker[] = [];
  static blocked = false;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: ((e: { preventDefault: () => void }) => void) | null = null;
  posted: string[] = [];
  terminated = false;
  constructor() {
    if (FakeWorker.blocked) throw new Error('blocked by the browser');
    FakeWorker.instances.push(this);
  }
  postMessage(source: string) {
    this.posted.push(source);
  }
  terminate() {
    this.terminated = true;
  }
  reply(data: unknown) {
    this.onmessage?.({ data });
  }
}

const ok = { ok: true, file: { package: '', imports: [], types: [], text: '' } };
/** A fresh module each time: the worker and the queue are module state. */
const load = async () => (await import('./javaParser')).parseJava;
/** Lets the parser's promise chain move on. */
const settle = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};
/** The n-th worker, once it exists. */
const nth = async (n: number) => {
  await settle();
  const w = FakeWorker.instances[n];
  if (!w) throw new Error(`no worker #${n}`);
  return w;
};

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('Worker', FakeWorker);
  FakeWorker.instances = [];
  FakeWorker.blocked = false;
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('parseJava', () => {
  it('parses one file at a time, in one worker that is kept', async () => {
    const parseJava = await load();
    const first = parseJava('class A {}');
    const second = parseJava('class B {}');
    const w = await nth(0);
    w.reply('ready');
    await settle();
    expect(w.posted).toEqual(['class A {}']); // the second waits for the first
    w.reply(ok);
    await expect(first).resolves.toEqual(ok);
    await settle();
    expect(w.posted).toEqual(['class A {}', 'class B {}']);
    w.reply(ok);
    await expect(second).resolves.toEqual(ok);
    expect(FakeWorker.instances).toHaveLength(1);
    expect(w.terminated).toBe(false);
  });

  it("doesn't count the worker's start-up in a file's time limit", async () => {
    vi.useFakeTimers();
    const parseJava = await load();
    const result = parseJava('class A {}', 1_000);
    const w = await nth(0);
    vi.advanceTimersByTime(30_000); // loading the parser on a busy computer
    w.reply('ready');
    await settle();
    vi.advanceTimersByTime(999);
    w.reply(ok);
    await expect(result).resolves.toEqual(ok);
  });

  it('stops a parse that takes too long, reports it on that file, and carries on in a new worker', async () => {
    vi.useFakeTimers();
    const parseJava = await load();
    const slow = parseJava('class Slow {}', 1_000);
    const next = parseJava('class Next {}', 1_000);
    const first = await nth(0);
    first.reply('ready');
    await settle();
    vi.advanceTimersByTime(999);
    expect(first.terminated).toBe(false);
    vi.advanceTimersByTime(1);
    await expect(slow).resolves.toEqual({ ok: false, error: JAVA_TOO_SLOW });
    expect(first.terminated).toBe(true);
    // The next file gets its own full time limit, in a new worker.
    const second = await nth(1);
    second.reply('ready');
    await settle();
    expect(second.posted).toEqual(['class Next {}']);
    second.reply(ok);
    await expect(next).resolves.toEqual(ok);
  });

  it('reports a worker that fails to load instead of waiting forever, and tries again next time', async () => {
    const parseJava = await load();
    const result = parseJava('class A {}');
    (await nth(0)).onerror?.({ preventDefault: () => undefined });
    await expect(result).resolves.toMatchObject({ ok: false, error: { message: /couldn't start/ } });
    const again = parseJava('class A {}');
    const w = await nth(1);
    w.reply('ready');
    await settle();
    w.reply(ok);
    await expect(again).resolves.toEqual(ok);
  });

  it('parses on the page thread when workers are blocked', async () => {
    FakeWorker.blocked = true;
    const parseJava = await load();
    await expect(parseJava('class A { int मात्रा१ = 1; }')).resolves.toMatchObject({
      ok: true,
      file: { types: [{ name: 'A', fields: [{ name: 'मात्रा१' }] }] },
    });
    await expect(parseJava('class A { int = ; }')).resolves.toMatchObject({
      ok: false,
      error: { line: 1, message: /^Syntax error/ },
    });
  }, 30_000); // loads and builds the real parser
});
