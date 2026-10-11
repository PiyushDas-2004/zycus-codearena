/**
 * Runs a question's tests in the browser: compiles the candidate's TypeScript with the editor's own
 * TypeScript service (no extra compiler download), then executes runtime + modules + tests in a
 * throw-away Web Worker that is terminated after `timeoutMs` (infinite loops can't hang the page).
 */
import type * as Monaco from 'monaco-editor';
import runtimeUrl from 'virtual:sandbox-runtime';
import { buildSandboxScript, isTestFile, type SandboxModule, type SandboxOutcome } from './buildScript';
import { javaParseLimitMs } from '@/shared/javaModel';
import { parseJava } from './javaParser';

const RUN_TIMEOUT_MS = 20_000;
const COMPILE_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        window.clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        window.clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

type CompileError = { path: string; line: number; message: string };

/** Syntax-checks and transpiles (CommonJS) every script with Monaco's own TypeScript service. */
async function compile(
  monaco: typeof Monaco,
  files: RunnableFile[],
): Promise<{ modules: SandboxModule[]; errors: CompileError[] }> {
  // Monaco registers a language's worker only once a model of that language exists ("JavaScript not
  // registered!" otherwise), so each worker is fetched only when a file needs it.
  let tsWorker: Promise<Monaco.typescript.TypeScriptWorker> | undefined;
  let jsWorker: Promise<Monaco.typescript.TypeScriptWorker> | undefined;
  const workerFor = (path: string) =>
    /\.tsx?$/.test(path)
      ? (tsWorker ??= monaco.typescript.getTypeScriptWorker().then((get) => get()))
      : (jsWorker ??= monaco.typescript.getJavaScriptWorker().then((get) => get()));
  const results = await Promise.all(
    files.map(async (f): Promise<{ module?: SandboxModule; errors: CompileError[] }> => {
      if (f.path.endsWith('.json'))
        return { module: { path: f.path, kind: 'json', code: f.model.getValue() }, errors: [] };
      // Java can't run here: tests import a model of the file (types, annotations, methods).
      if (f.path.endsWith('.java')) {
        const res = await parseJava(f.model.getValue());
        return res.ok
          ? { module: { path: f.path, kind: 'json', code: JSON.stringify(res.file) }, errors: [] }
          : { errors: [{ path: f.path, line: res.error.line, message: res.error.message }] };
      }
      if (!SCRIPT.test(f.path)) return { errors: [] };
      const uri = f.model.uri.toString();
      const worker = await workerFor(f.path);
      const [syntax, out] = await Promise.all([
        worker.getSyntacticDiagnostics(uri),
        worker.getEmitOutput(uri),
      ]);
      const errors = syntax.map((d) => ({
        path: f.path,
        line: f.model.getPositionAt(d.start ?? 0).lineNumber,
        message: typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText,
      }));
      const js = out.outputFiles.find((o) => o.name.endsWith('.js'))?.text;
      if (js === undefined)
        return { errors: [...errors, { path: f.path, line: 1, message: 'Could not compile this file.' }] };
      return { module: { path: f.path, kind: 'js', code: js }, errors };
    }),
  );
  return {
    modules: results.flatMap((r) => (r.module ? [r.module] : [])),
    errors: results.flatMap((r) => r.errors),
  };
}

let runtimeText: Promise<string> | null = null;
/** Downloads the sandbox runtime once (also used to prefetch it). */
export function loadRuntime(): Promise<string> {
  runtimeText ??= fetch(runtimeUrl).then((r) => {
    if (!r.ok) throw new Error(`Test runtime unavailable (HTTP ${r.status})`);
    return r.text();
  });
  runtimeText.catch(() => (runtimeText = null));
  return runtimeText;
}

export interface RunnableFile {
  path: string;
  model: Monaco.editor.ITextModel;
}

const SCRIPT = /\.[jt]sx?$/;

export async function runQuestionTests(
  monaco: typeof Monaco,
  files: RunnableFile[],
  opts: { timeoutMs?: number } = {},
): Promise<SandboxOutcome> {
  const tests = files.filter((f) => isTestFile(f.path) && SCRIPT.test(f.path)).map((f) => f.path);
  if (tests.length === 0) return { type: 'crash', error: 'This question has no tests to run.' };

  // 1. Compile (and refuse to run code that doesn't parse: the errors are clearer than a crash).
  let compiled: Awaited<ReturnType<typeof compile>>;
  try {
    // Java files are parsed one at a time, each with its own limit (see javaParser.ts).
    const javaLimits = files
      .filter((f) => f.path.endsWith('.java'))
      .reduce((ms, f) => ms + javaParseLimitMs(f.model.getValue()), 0);
    compiled = await withTimeout(compile(monaco, files), COMPILE_TIMEOUT_MS + javaLimits);
  } catch {
    return {
      type: 'crash',
      error: "The editor's TypeScript service didn't respond. Wait a few seconds and run the tests again.",
    };
  }
  if (compiled.errors.length) return { type: 'compile', errors: compiled.errors };
  const { modules } = compiled;

  // 2. Run in a disposable worker.
  const script = buildSandboxScript(await loadRuntime(), modules, tests);
  const url = URL.createObjectURL(new Blob([script], { type: 'text/javascript' }));
  try {
    return await new Promise<SandboxOutcome>((resolve) => {
      const worker = new Worker(url, { name: 'codearena-tests' });
      const timer = window.setTimeout(() => {
        worker.terminate();
        resolve({ type: 'timeout' });
      }, opts.timeoutMs ?? RUN_TIMEOUT_MS);
      worker.onmessage = (e: MessageEvent<SandboxOutcome>) => {
        window.clearTimeout(timer);
        worker.terminate();
        resolve(e.data);
      };
      worker.onerror = (e) => {
        e.preventDefault();
        window.clearTimeout(timer);
        worker.terminate();
        resolve({ type: 'crash', error: e.message || 'The test run crashed.' });
      };
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
