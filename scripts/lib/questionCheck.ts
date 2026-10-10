/**
 * Checks a question the way the candidate's IDE will treat it, but in Node:
 * - typecheckFiles(): TypeScript with the editor's settings and type declarations (strict, React,
 *   React Native, test sandbox), so starter code and solutions must compile cleanly and wrong code
 *   must be reported.
 * - runSandboxTests(): the real sandbox runtime (same bundle the browser uses) in a Node vm.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { parse as parseJava } from 'java-parser';
import ts from 'typescript';
import { modelJava } from '../../src/shared/javaModel.ts';
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

/** Runs the question's test files in the sandbox runtime (Node vm, real timers). */
export async function runSandboxTests(files: SourceFile[], timeoutMs = 30_000): Promise<SandboxOutcome> {
  runtime ??= bundleSandboxRuntime({ minify: false });
  const modules: SandboxModule[] = [];
  for (const f of files) {
    if (f.path.endsWith('.json')) modules.push({ path: f.path, kind: 'json', code: f.content });
    else if (f.path.endsWith('.java')) {
      const res = modelJava(parseJava, f.content);
      if (!res.ok)
        return {
          type: 'compile',
          errors: [{ path: f.path, line: res.error.line, message: res.error.message }],
        };
      modules.push({ path: f.path, kind: 'json', code: JSON.stringify(res.file) });
    } else if (/\.(tsx?|jsx?)$/.test(f.path)) {
      const out = ts.transpileModule(f.content, {
        fileName: f.path,
        compilerOptions: { ...COMPILER_OPTIONS, noEmit: false, isolatedModules: true },
      });
      modules.push({ path: f.path, kind: 'js', code: out.outputText });
    }
  }
  const tests = files.filter((f) => isTestFile(f.path) && /\.[jt]sx?$/.test(f.path)).map((f) => f.path);
  const script = buildSandboxScript(await runtime, modules, tests);
  return new Promise<SandboxOutcome>((resolve) => {
    const timer = setTimeout(() => resolve({ type: 'timeout' }), timeoutMs);
    const context = vm.createContext({
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      setImmediate,
      queueMicrotask,
      console,
      MessageChannel,
      TextEncoder,
      TextDecoder,
      AbortController,
      AbortSignal,
      EventTarget,
      Event,
      CustomEvent,
      DOMException,
      structuredClone,
      crypto: globalThis.crypto,
      performance,
      URL,
      __sandboxResult: (msg: SandboxOutcome) => {
        clearTimeout(timer);
        resolve(msg);
      },
    });
    try {
      vm.runInContext(script, context, { filename: 'sandbox.js' });
    } catch (err) {
      clearTimeout(timer);
      resolve({ type: 'crash', error: String(err) });
    }
  });
}

/** Starter files with the reference solution's files applied on top. */
export function withSolution(starter: SourceFile[], solution: SourceFile[]): SourceFile[] {
  const map = new Map(starter.map((f) => [f.path, f.content]));
  for (const f of solution) map.set(f.path, f.content);
  return [...map].map(([path, content]) => ({ path, content }));
}
