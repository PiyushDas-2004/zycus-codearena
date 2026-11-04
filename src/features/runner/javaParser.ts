/**
 * Parses Java in a Web Worker, for the editor's syntax check and the test runner. java-parser can
 * take very long on some valid code (deeply nested casts), and on the page's own thread that would
 * freeze the whole test: timer, proctoring and autosave. Files are parsed one at a time; a parse
 * that takes longer than the limit is stopped and reported as an error on that file. The limit
 * starts once the worker is ready (loading the parser can be slow on a busy computer).
 * Without Worker support (unit tests, or blocked by the browser) it parses on this thread.
 */
import {
  JAVA_TOO_SLOW,
  javaParseLimitMs,
  modelJava,
  type JavaFile,
  type JavaSyntaxError,
} from '@/shared/javaModel';

export type JavaParseResult = { ok: true; file: JavaFile } | { ok: false; error: JavaSyntaxError };

/** How long the worker may take to load the parser. */
const START_LIMIT_MS = 60_000;
const CANT_START: JavaParseResult = {
  ok: false,
  error: {
    line: 1,
    column: 1,
    message: "The Java checker couldn't start. Check your connection, then try again.",
  },
};

type Started = { worker: Worker } | { failed: 'blocked' | 'unavailable' };

function start(): Promise<Started> {
  return new Promise((resolve) => {
    let w: Worker;
    try {
      w = new Worker(new URL('./javaParse.worker.ts', import.meta.url), {
        type: 'module',
        name: 'codearena-java',
      });
    } catch {
      resolve({ failed: 'blocked' });
      return;
    }
    const fail = () => {
      window.clearTimeout(timer);
      w.terminate();
      resolve({ failed: 'unavailable' });
    };
    const timer = window.setTimeout(fail, START_LIMIT_MS);
    w.onmessage = (e: MessageEvent<unknown>) => {
      if (e.data !== 'ready') return;
      window.clearTimeout(timer);
      w.onmessage = null;
      w.onerror = null;
      resolve({ worker: w });
    };
    w.onerror = (e) => {
      e.preventDefault();
      fail();
    };
  });
}

let worker: Promise<Started> | null = null;

async function run(source: string, timeoutMs: number): Promise<JavaParseResult> {
  const started = await (worker ??= start());
  if ('failed' in started) {
    worker = null; // try again next time
    return started.failed === 'blocked' ? parseInThread(source) : CANT_START;
  }
  const w = started.worker;
  return new Promise((resolve) => {
    const done = (result: JavaParseResult, stop: boolean) => {
      window.clearTimeout(timer);
      w.onmessage = null;
      w.onerror = null;
      if (stop) {
        w.terminate();
        worker = null;
      }
      resolve(result);
    };
    const timer = window.setTimeout(() => done({ ok: false, error: JAVA_TOO_SLOW }, true), timeoutMs);
    w.onmessage = (e: MessageEvent<JavaParseResult>) => done(e.data, false);
    w.onerror = (e) => {
      e.preventDefault();
      done(CANT_START, true);
    };
    w.postMessage(source);
  });
}

let inThread: Promise<typeof import('java-parser')> | null = null;

function parseInThread(source: string): Promise<JavaParseResult> {
  return (inThread ??= import('java-parser')).then(
    ({ parse }) => modelJava(parse, source),
    () => {
      inThread = null;
      return CANT_START;
    },
  );
}

let queue: Promise<unknown> = Promise.resolve();

/** The model of a Java file, or its first syntax error. */
export function parseJava(source: string, timeoutMs = javaParseLimitMs(source)): Promise<JavaParseResult> {
  if (typeof Worker === 'undefined') return parseInThread(source);
  const result = queue.then(() => run(source, timeoutMs));
  queue = result.catch(() => undefined);
  return result;
}
