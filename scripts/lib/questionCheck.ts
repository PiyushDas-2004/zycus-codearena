/**
 * Checks a question the way the candidate's IDE will treat it, but in Node:
 * - typecheckFiles(): TypeScript with the editor's settings and type declarations (strict, React,
 *   React Native, test sandbox), so starter code and solutions must compile cleanly and wrong code
 *   must be reported.
 * - runSandboxTests(): the real sandbox runtime (same bundle the browser uses) in a Node vm, in a
 *   worker thread that is stopped after a timeout (like the browser's Web Worker).
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { Worker } from 'node:worker_threads';
import ts from 'typescript';
import { JAVA_TOO_SLOW, javaParseLimitMs, type modelJava } from '../../src/shared/javaModel.ts';
import {
  buildSandboxScript,
  isTestFile,
  type SandboxModule,
  type SandboxOutcome,
} from '../../src/features/runner/buildScript.ts';
import { ROOT } from './questionSource.ts';
import { bundleSandboxRuntime } from './sandboxRuntime.ts';

export interface SourceFile {
  path: string;
  content: string;
}

const TYPE_LIBS = join(ROOT, 'src', 'features', 'workspace', 'editor', 'typeLibs');
const REACT_TYPES = join(ROOT, 'node_modules', '@types', 'react');

/** Virtual node_modules the editor gets (see src/features/workspace/editor/typeLibs/index.ts). */
function editorLibs(): Map<string, string> {
  const libs = new Map<string, string>();
  for (const f of ['index.d.ts', 'global.d.ts', 'jsx-runtime.d.ts', 'jsx-dev-runtime.d.ts']) {
    libs.set(`/node_modules/@types/react/${f}`, readFileSync(join(REACT_TYPES, f), 'utf8'));
  }
  libs.set('/node_modules/csstype/index.d.ts', readFileSync(join(TYPE_LIBS, 'csstype.d.txt'), 'utf8'));
  for (const f of ['react-native', 'libraries', 'jest-globals']) {
    libs.set(`/node_modules/@codearena/types/${f}.d.ts`, readFileSync(join(TYPE_LIBS, `${f}.d.txt`), 'utf8'));
  }
  return libs;
}

export const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2020,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  jsx: ts.JsxEmit.ReactJSX,
  allowJs: true,
  esModuleInterop: true,
  resolveJsonModule: true,
  strict: true,
  noImplicitOverride: true,
  skipLibCheck: true,
  isolatedModules: true,
  noEmit: true,
  types: [],
};

export interface Diagnostic {
  path: string;
  line: number;
  message: string;
  code: number;
}

/** Type-checks a question's TypeScript files as the editor does. */
export function typecheckFiles(files: SourceFile[]): Diagnostic[] {
  const libs = editorLibs();
  const sources = new Map<string, string>(libs);
  for (const f of files) sources.set(`/q/${f.path}`, f.content);
  const tsLibDir = dirname(createRequire(import.meta.url).resolve('typescript/lib/lib.d.ts'));
  const host: ts.CompilerHost = {
    fileExists: (p) => sources.has(p) || ts.sys.fileExists(p),
    readFile: (p) => sources.get(p) ?? ts.sys.readFile(p),
    getSourceFile: (p, lang) => {
      const text =
        sources.get(p) ??
        (p.startsWith(tsLibDir) || p.includes('/typescript/lib/') ? ts.sys.readFile(p) : undefined);
      return text === undefined ? undefined : ts.createSourceFile(p, text, lang, true);
    },
    getDefaultLibFileName: (o) => join(tsLibDir, ts.getDefaultLibFileName(o)).replace(/\\/g, '/'),
    getDefaultLibLocation: () => tsLibDir.replace(/\\/g, '/'),
    writeFile: () => undefined,
    getCurrentDirectory: () => '/q',
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    // TypeScript asks with and without a trailing slash (React's jsx-runtime imports "./").
    directoryExists: (d) => {
      const dir = d.replace(/\/+$/, '');
      return [...sources.keys()].some((k) => k.startsWith(`${dir}/`)) || ts.sys.directoryExists(d);
    },
    getDirectories: () => [],
  };
  const roots = [
    ...files.filter((f) => /\.(tsx?|jsx?)$/.test(f.path)).map((f) => `/q/${f.path}`),
    ...[...libs.keys()].filter((k) => k.includes('/@codearena/types/')),
  ];
  const program = ts.createProgram(roots, { ...COMPILER_OPTIONS, lib: COMPILER_OPTIONS.lib }, host);
  return ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file?.fileName.startsWith('/q/'))
    .map((d) => {
      const { line } = d.file!.getLineAndCharacterOfPosition(d.start ?? 0);
      return {
        path: d.file!.fileName.slice(3),
        line: line + 1,
        message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
        code: d.code,
      };
    });
}

let runtime: Promise<string> | null = null;

type JavaResult = ReturnType<typeof modelJava>;
let javaWorker: Promise<Worker> | null = null;
let javaQueue: Promise<unknown> = Promise.resolve();

/** The parser's worker thread, once it has loaded the parser (that time isn't part of the limit). */
function startJavaWorker(): Promise<Worker> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./javaParseWorker.ts', import.meta.url), { execArgv: [] });
    w.unref(); // a parse in progress keeps the process alive through its timer
    w.once('error', reject);
    w.on('message', function ready(message: unknown) {
      if (message !== 'ready') return;
      w.off('message', ready).off('error', reject);
      resolve(w);
    });
  });
}

/**
 * Parses a Java file in a worker thread, one file at a time, as the browser does (see
 * src/features/runner/javaParser.ts): some valid Java takes java-parser minutes, so a parse that
 * takes longer than the limit is stopped and reported as an error on that file.
 */
function parseJavaFile(source: string): Promise<JavaResult> {
  const run = async () => {
    let w: Worker;
    try {
      w = await (javaWorker ??= startJavaWorker());
    } catch (err) {
      javaWorker = null;
      return {
        ok: false,
        error: { line: 1, column: 1, message: `The Java parser crashed: ${String(err)}` },
      } as const;
    }
    return new Promise<JavaResult>((resolve) => {
      const done = (result: JavaResult, stop: boolean) => {
        clearTimeout(timer);
        w.off('message', onMessage).off('error', onError);
        if (stop) {
          void w.terminate();
          javaWorker = null;
        }
        resolve(result);
      };
      const onMessage = (result: JavaResult) => done(result, false);
      const onError = (err: Error) =>
        done(
          { ok: false, error: { line: 1, column: 1, message: `The Java parser crashed: ${String(err)}` } },
          true,
        );
      const timer = setTimeout(
        () => done({ ok: false, error: JAVA_TOO_SLOW }, true),
        javaParseLimitMs(source),
      );
      w.on('message', onMessage).on('error', onError);
      w.postMessage(source);
    });
  };
  const result = javaQueue.then(run);
  javaQueue = result;
  return result;
}

/**
 * Runs the script in a Node vm inside a worker thread, as the browser runs it in a Web Worker: an
 * endless loop in the candidate's code is stopped by terminating the thread, and a promise
 * rejection nobody handles is only logged (as in the browser) instead of crashing this process.
 */
const WORKER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads');
const vm = require('node:vm');
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection in the tested code:', reason));
const context = vm.createContext({
  setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, queueMicrotask, console,
  MessageChannel, TextEncoder, TextDecoder, AbortController, AbortSignal, EventTarget, Event,
  CustomEvent, DOMException, structuredClone, crypto: globalThis.crypto, performance, URL,
  __sandboxResult: (msg) => parentPort.postMessage(JSON.parse(JSON.stringify(msg))),
});
try {
  vm.runInContext(workerData.script, context, { filename: 'sandbox.js' });
} catch (err) {
  parentPort.postMessage({ type: 'crash', error: String(err) });
}
`;

/** Runs the question's test files in the sandbox runtime (Node vm in a worker thread, real timers). */
export async function runSandboxTests(files: SourceFile[], timeoutMs = 30_000): Promise<SandboxOutcome> {
  runtime ??= bundleSandboxRuntime({ minify: false });
  const modules: SandboxModule[] = [];
  const syntaxErrors: { path: string; line: number; message: string }[] = [];
  for (const f of files) {
    if (f.path.endsWith('.json')) modules.push({ path: f.path, kind: 'json', code: f.content });
    else if (f.path.endsWith('.java')) {
      const res = await parseJavaFile(f.content);
      if (!res.ok)
        return {
          type: 'compile',
          errors: [{ path: f.path, line: res.error.line, message: res.error.message }],
        };
      modules.push({ path: f.path, kind: 'json', code: JSON.stringify(res.file) });
    } else if (/\.(tsx?|jsx?)$/.test(f.path)) {
      const out = ts.transpileModule(f.content, {
        fileName: f.path,
        reportDiagnostics: true,
        compilerOptions: { ...COMPILER_OPTIONS, noEmit: false, isolatedModules: true },
      });
      // The editor refuses code that doesn't parse; the transpiler alone would repair some of it.
      for (const d of out.diagnostics ?? []) {
        // Syntax errors only (they point into the file); not notes about compiler options.
        if (d.category !== ts.DiagnosticCategory.Error || !d.file) continue;
        const line = d.file.getLineAndCharacterOfPosition(d.start ?? 0).line + 1;
        syntaxErrors.push({
          path: f.path,
          line,
          message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
        });
      }
      modules.push({ path: f.path, kind: 'js', code: out.outputText });
    }
  }
  if (syntaxErrors.length) return { type: 'compile', errors: syntaxErrors };
  const tests = files.filter((f) => isTestFile(f.path) && /\.[jt]sx?$/.test(f.path)).map((f) => f.path);
  const script = buildSandboxScript(await runtime, modules, tests);
  return new Promise<SandboxOutcome>((resolve) => {
    // execArgv: [] so flags of the caller (e.g. --input-type=module) don't change how this runs.
    const worker = new Worker(WORKER_SOURCE, { eval: true, execArgv: [], workerData: { script } });
    let settled = false;
    const settle = (outcome: SandboxOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      resolve(outcome);
    };
    const timer = setTimeout(() => settle({ type: 'timeout' }), timeoutMs);
    worker.once('message', (msg: SandboxOutcome) => settle(msg));
    worker.once('error', (err) => settle({ type: 'crash', error: String(err) }));
    worker.once('exit', (code) =>
      settle({ type: 'crash', error: `The test run stopped (exit code ${code}).` }),
    );
  });
}

/** Starter files with the reference solution's files applied on top. */
export function withSolution(starter: SourceFile[], solution: SourceFile[]): SourceFile[] {
  const map = new Map(starter.map((f) => [f.path, f.content]));
  for (const f of solution) map.set(f.path, f.content);
  return [...map].map(([path, content]) => ({ path, content }));
}
