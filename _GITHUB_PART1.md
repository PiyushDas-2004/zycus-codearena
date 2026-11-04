# Part 1: bring GitHub up to date (copy and paste)

These changes go **straight onto `main`**. None of them changes how the site looks.
Do them after Step 0 (the `classic-ui` branch) and before Part 2 (the new sign-in page).

> This file lives only on your computer. **Do not upload it to GitHub.**

## How to do each file in the browser

- **Replace** (the file already exists on GitHub): open the file on GitHub, click the pencil icon
  (*Edit this file*), press **Ctrl+A** then **Delete**, paste the whole code block from this guide,
  click **Commit changes…**, keep **Commit directly to the `main` branch**, then **Commit changes**.
- **Create** (the file is new): go to the folder on GitHub, click **Add file → Create new file**,
  type the file name shown, paste the code block, then commit to `main` the same way.
  You can also type the full path from the repository root in the name box; each `/` makes a folder.
- Copy each code block **exactly**, from the first line inside it to the last. Most editors and
  Markdown viewers have a copy button on the block.
- Check that the branch selector at the top left says **`main`** before you start.

## Step 1 (upload, not paste): the face-detection model

`public/models/blaze_face_short_range.tflite` is a binary file, so it cannot be pasted. Without it,
the live site cannot detect "no face" or "more than one face" during an assessment.

1. On GitHub, open the `public` folder.
2. Click **Add file → Upload files**.
3. From `C:\Users\piyush.das\Coding\zycus-codearena\public\`, drag the **`models`** folder onto the page
   (the folder, so that GitHub creates `public/models/`). It holds one file of 225 KB.
4. Commit to `main` with the message `Add the face-detection model`.

## Checklist

**Scripts**

- [ ] 1. `scripts/lib/questionCheck.ts` (replace)
- [ ] 2. `scripts/tests/rnApprovalsInboxVariants.test.ts` (replace)
- [ ] 3. `scripts/tests/rnLiveAuctionVariants.test.ts` (create)
- [ ] 4. `scripts/tests/webInvoiceBuilderVariants.test.ts` (replace)
- [ ] 5. `scripts/try-solution.ts` (create)

**App test and database test**

- [ ] 6. `src/features/runner/javaParser.test.ts` (replace)
- [ ] 7. `supabase/tests/05-setup-bundle.test.ts` (replace)

**Question: rn-approvals-inbox**

- [ ] 8. `supabase/seed/questions/rn-approvals-inbox/question.json` (replace)
- [ ] 9. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/ApprovalsList.test.tsx` (replace)
- [ ] 10. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/approvals.test.tsx` (replace)
- [ ] 11. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/httpClient.test.ts` (replace)
- [ ] 12. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/sessionStore.test.ts` (replace)
- [ ] 13. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/support/fakeServer.ts` (replace)
- [ ] 14. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/useApprovals.test.tsx` (replace)

**Question: rn-live-auction**

- [ ] 15. `supabase/seed/questions/rn-live-auction/question.json` (replace)
- [ ] 16. `supabase/seed/questions/rn-live-auction/files/__tests__/BidBoard.test.tsx` (replace)
- [ ] 17. `supabase/seed/questions/rn-live-auction/files/__tests__/listeners.test.ts` (replace)
- [ ] 18. `supabase/seed/questions/rn-live-auction/files/__tests__/money.test.ts` (replace)
- [ ] 19. `supabase/seed/questions/rn-live-auction/files/__tests__/useCountdown.test.ts` (replace)

**Question: spring-po-approvals**

- [ ] 20. `supabase/seed/questions/spring-po-approvals/question.json` (replace)
- [ ] 21. `supabase/seed/questions/spring-po-approvals/files/checks/approvals.test.ts` (replace)
- [ ] 22. `supabase/seed/questions/spring-po-approvals/files/checks/inbox.test.ts` (replace)
- [ ] 23. `supabase/seed/questions/spring-po-approvals/files/checks/invoices.test.ts` (replace)
- [ ] 24. `supabase/seed/questions/spring-po-approvals/files/checks/support/java.ts` (replace)
- [ ] 25. `supabase/seed/questions/spring-po-approvals/files/checks/transactions.test.ts` (replace)

**Question: web-invoice-builder**

- [ ] 26. `supabase/seed/questions/web-invoice-builder/question.json` (replace)
- [ ] 27. `supabase/seed/questions/web-invoice-builder/statement.md` (replace)
- [ ] 28. `supabase/seed/questions/web-invoice-builder/files/__tests__/MoneyInput.test.tsx` (replace)
- [ ] 29. `supabase/seed/questions/web-invoice-builder/files/__tests__/PoPicker.test.tsx` (replace)
- [ ] 30. `supabase/seed/questions/web-invoice-builder/files/__tests__/autosave.test.tsx` (replace)
- [ ] 31. `supabase/seed/questions/web-invoice-builder/files/__tests__/lines.test.tsx` (replace)

**Database seed SQL (large files; do these last)**

- [ ] 32. `supabase/seed/parts/question-rn-approvals-inbox.sql` (replace)
- [ ] 33. `supabase/seed/parts/question-rn-live-auction.sql` (replace)
- [ ] 34. `supabase/seed/parts/question-spring-po-approvals.sql` (replace)
- [ ] 35. `supabase/seed/parts/question-web-invoice-builder.sql` (replace)
- [ ] 36. `supabase/seed/seed.sql` (replace)

**Environment example**

- [ ] 37. `.env.example` (create)

Not included on purpose: `scripts/local-stack/seed.json`. It holds test passwords for the local
Docker test database, which only runs on a developer machine, so it stays off GitHub.

## Scripts

### 1. `scripts/lib/questionCheck.ts`

- **Folder:** `scripts/lib`
- **File name:** `questionCheck.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 272 lines, 11 KB
- **Commit message:** `Sync questionCheck.ts (question v3 grading)`

```ts
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
  // SANDBOX_RUNTIME_FILE: run with a given runtime file, e.g. the one downloaded from the live site.
  const runtimeFile = process.env.SANDBOX_RUNTIME_FILE;
  runtime ??= runtimeFile
    ? Promise.resolve(readFileSync(runtimeFile, 'utf8'))
    : bundleSandboxRuntime({ minify: false });
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
```

### 2. `scripts/tests/rnApprovalsInboxVariants.test.ts`

- **Folder:** `scripts/tests`
- **File name:** `rnApprovalsInboxVariants.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 1052 lines, 41 KB
- **Commit message:** `Sync rnApprovalsInboxVariants.test.ts (question v3 grading)`

```ts
/**
 * rn-approvals-inbox: the read-only tests must accept every reasonable fix and reject wrong ones.
 * - Valid alternative fixes (variants of the reference solution) pass every test and type-check.
 * - Partial fixes (the starter plus the reference fix of some bugs) pass exactly the tests of the
 *   bugs they fix: every test detects its own bug and none passes on the starter by accident.
 * - Wrong fixes that only hide a symptom fail the test written for that symptom.
 * - Broken candidate code gets a clear failure or a timeout, never a hung run.
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SandboxOutcome } from '../../src/features/runner/buildScript.ts';
import { runSandboxTests, typecheckFiles, withSolution, type SourceFile } from '../lib/questionCheck.ts';
import { loadQuestion, QUESTIONS_DIR } from '../lib/questionSource.ts';

const q = loadQuestion(join(QUESTIONS_DIR, 'rn-approvals-inbox'));
const starter: SourceFile[] = q.files.map((f) => ({ path: f.path, content: f.content }));
const referenceFiles = q.reference_solution?.files ?? [];
const solution = withSolution(starter, referenceFiles);

const HTTP = 'src/api/httpClient.ts';
const SESSION = 'src/auth/sessionStore.ts';
const HOOK = 'src/hooks/useApprovals.ts';
const DECISIONS = 'src/state/approvals.ts';
const LIST = 'src/screens/ApprovalsList.tsx';

function reference(path: string): string {
  const file = referenceFiles.find((f) => f.path === path);
  if (!file) throw new Error(`the reference solution has no ${path}`);
  return file.content;
}

// ── Editing helpers ─────────────────────────────────────────────────────────
type Edit = (src: string) => string;
type Edits = Record<string, Edit>;

/** Replaces the first match of `from` (it must occur); `to` is literal text or a function of the match. */
const replace =
  (from: string | RegExp, to: string | ((match: string) => string)): Edit =>
  (src) => {
    const out = src.replace(from, (match) => (typeof to === 'string' ? to : to(match)));
    if (out === src) throw new Error(`edit not applicable, pattern not found: ${String(from)}`);
    return out;
  };
const chain =
  (...edits: Edit[]): Edit =>
  (src) =>
    edits.reduce((s, e) => e(s), src);
const whole =
  (content: string): Edit =>
  () =>
    content;

/** Applies `edits` (path → edit); every edit must change its file. */
function edit(files: SourceFile[], edits: Edits): SourceFile[] {
  for (const path of Object.keys(edits)) {
    if (!files.some((f) => f.path === path)) throw new Error(`no file ${path}`);
  }
  return files.map((f) => {
    const e = edits[f.path];
    if (!e) return f;
    const content = e(f.content);
    if (content === f.content) throw new Error(`edit changed nothing in ${f.path}`);
    return { path: f.path, content };
  });
}

async function results(files: SourceFile[]) {
  const o = await runSandboxTests(files);
  if (o.type !== 'done') throw new Error(`the run did not complete: ${JSON.stringify(o).slice(0, 2000)}`);
  expect(o.results.length).toBeGreaterThan(0);
  return o.results;
}
const failures = async (files: SourceFile[]) =>
  (await results(files)).filter((r) => r.status !== 'passed').map((r) => `${r.name}: ${r.error}`);
const statuses = async (files: SourceFile[]) =>
  Object.fromEntries((await results(files)).map((r) => [r.name, r.status]));

// ── The question's tests and the bugs they detect ───────────────────────────
const T = {
  retries: 'token refresh › retries with the new access token and stores the rotated tokens',
  refreshOnce: 'token refresh › refreshes once when several requests get 401 at the same time',
  noSecondRefresh:
    'token refresh › does not refresh again for a request that was sent before the refresh finished',
  logoutOnce: 'token refresh › logs out exactly once when the refresh token is rejected',
  refreshAgain: 'token refresh › refreshes again when the new access token expires later',
  retryOnce: 'token refresh › retries a refused request only once',
  firstRequest:
    'session persistence (cold start) › the first request after launch carries the saved access token',
  tokensDuringLoad:
    'session persistence (cold start) › keeps tokens that were saved while the session was still loading',
  signOut: 'session persistence (cold start) › signing out removes the saved session',
  signOutWhileLoading:
    'session persistence (cold start) › signing out while the session is still loading keeps the user signed out',
  filterChips: 'useApprovals › loads the list for each filter chip',
  slowResponse: 'useApprovals › ignores a slow response for a filter that is no longer selected',
  cancelOnUnmount: 'useApprovals › cancels the request when the screen goes away',
  loadError: 'useApprovals › shows an error when the list fails to load, and clears it on the next load',
  rollbackOnlyFailed: 'optimistic approve / reject › rolls back only the decision that failed',
  laterSuccess:
    'optimistic approve / reject › keeps a later success when an earlier request fails afterwards',
  previousStatus: 'optimistic approve / reject › a failed change returns the row to the status it had before',
  afterSuccess:
    'optimistic approve / reject › a failed change after an earlier success returns to the status that succeeded',
  latestList:
    'optimistic approve / reject › rolls back to the status from the latest list, not the first one',
  scrollToIndex: 'ApprovalsList › scrollToIndex lands on the right row (rows are separated by a 1 pt line)',
  expandedRow: 'ApprovalsList › keeps the expanded row expanded when a row above it disappears',
  rowComment: "ApprovalsList › keeps each row's comment with its own row",
} as const;

const READY_WAIT = /\n {4}\/\/ FIX: wait for the stored session[^\n]*\n {4}await o\.session\.ready;/;

/** The reference fix split into independent parts, applied to the starter in this order. */
const FIXES = {
  /** Bug 1: one shared refresh promise; a request sent before a refresh just retries. */
  refresh: { [HTTP]: whole(replace(READY_WAIT, '')(reference(HTTP))) },
  /** Bug 4 (client half): requests wait for the stored session. */
  clientReady: {
    [HTTP]: replace(
      /async function request<T>\(.*\): Promise<T> \{\n/,
      (m) => `${m}    await o.session.ready;\n`,
    ),
  },
  /** Bug 4 (store half): changes wait for hydration. */
  storeReady: { [SESSION]: whole(reference(SESSION)) },
  /** Bug 2: a new AbortController per request. */
  abort: { [HOOK]: whole(reference(HOOK)) },
  /** Bug 3: per-row rollback with an error. */
  rollback: { [DECISIONS]: whole(reference(DECISIONS)) },
  /** Bug 5 (layout): getItemLayout counts the separators. */
  layout: {
    [LIST]: replace('offset: ROW_HEIGHT * index', 'offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index'),
  },
  /** Bug 5 (expanded row): tracked by id, not by index. */
  expandedById: {
    [LIST]: chain(
      replace('useState<number | null>(null)', 'useState<string | null>(null)'),
      replace('renderItem={({ item, index }) => (', 'renderItem={({ item }) => ('),
      replace('expanded={expanded === index}', 'expanded={expanded === item.id}'),
      replace(
        'onToggle={() => setExpanded(expanded === index ? null : index)}',
        'onToggle={() => setExpanded((cur) => (cur === item.id ? null : item.id))}',
      ),
    ),
  },
  /** Bug 5 (row identity): rows keyed by id, so each row keeps its own local state. */
  keyById: {
    [LIST]: replace('keyExtractor={(_item, index) => String(index)}', 'keyExtractor={(item) => item.id}'),
  },
} satisfies Record<string, Edits>;
type Fix = keyof typeof FIXES;
const ALL_FIXES = Object.keys(FIXES) as Fix[];

/** The bugs of solution/notes.md and the parts of the fix each one needs. */
const BUGS: Record<string, Fix[]> = {
  '1 (refresh not single-flight)': ['refresh'],
  '2 (AbortController reused)': ['abort'],
  '3 (whole-list rollback)': ['rollback'],
  '4 (hydration race)': ['clientReady', 'storeReady'],
  '5 (FlatList state by index)': ['layout', 'expandedById', 'keyById'],
};

/** The fix parts each test needs in order to pass. [] = passes on the starter (a regression guard). */
const NEEDS: Record<string, Fix[]> = {
  [T.retries]: [],
  [T.refreshOnce]: ['refresh'],
  [T.noSecondRefresh]: ['refresh'],
  [T.logoutOnce]: [],
  [T.refreshAgain]: [],
  [T.retryOnce]: [],
  [T.firstRequest]: ['clientReady'],
  [T.tokensDuringLoad]: ['storeReady'],
  [T.signOut]: [],
  [T.signOutWhileLoading]: ['storeReady'],
  [T.filterChips]: ['abort'],
  [T.slowResponse]: ['abort'],
  [T.cancelOnUnmount]: [],
  [T.loadError]: ['abort'],
  [T.rollbackOnlyFailed]: ['rollback'],
  [T.laterSuccess]: ['rollback'],
  [T.previousStatus]: ['rollback'],
  [T.afterSuccess]: ['rollback'],
  [T.latestList]: ['rollback'],
  [T.scrollToIndex]: ['layout'],
  [T.expandedRow]: ['expandedById'],
  [T.rowComment]: ['expandedById', 'keyById'],
};

/**
 * A test that passes on the starter but fails for one combination of parts. The starter client
 * doesn't await `saveTokens` before it retries; that only worked because the starter store set the
 * tokens synchronously. Once `saveTokens` waits for hydration (store half of bug 4), the immediate
 * retry carries the old token until the client awaits `saveTokens` (bug 1 fix) or awaits `ready`
 * itself (client half of bug 4, which yields long enough). Correct behaviour, not a test flaw.
 */
const ALSO_FAILS: Record<string, { applied: Fix[]; missing: Fix[] }> = {
  [T.retries]: { applied: ['storeReady'], missing: ['refresh', 'clientReady'] },
  [T.refreshAgain]: { applied: ['storeReady'], missing: ['refresh', 'clientReady'] },
};

function withFixes(applied: Fix[]): SourceFile[] {
  return ALL_FIXES.filter((f) => applied.includes(f)).reduce((files, f) => edit(files, FIXES[f]), starter);
}
function expectedStatuses(applied: Fix[]) {
  const passes = (name: string, needs: Fix[]) => {
    const also = ALSO_FAILS[name];
    const brokenBy =
      also &&
      also.applied.every((f) => applied.includes(f)) &&
      also.missing.every((f) => !applied.includes(f));
    return needs.every((f) => applied.includes(f)) && !brokenBy;
  };
  return Object.fromEntries(
    Object.entries(NEEDS).map(([name, needs]) => [name, passes(name, needs) ? 'passed' : 'failed']),
  );
}
const except = (excluded: Fix[]) => ALL_FIXES.filter((f) => !excluded.includes(f));

describe('rn-approvals-inbox: partial fixes pass exactly the tests of the bugs they fix', () => {
  it('the starter fails exactly the tests of the planted bugs', async () => {
    expect(await statuses(starter)).toEqual(expectedStatuses([]));
  }, 120_000);

  it('every part of the fix together passes every test', async () => {
    expect(await statuses(withFixes(ALL_FIXES))).toEqual(expectedStatuses(ALL_FIXES));
  }, 120_000);

  it.each(Object.entries(BUGS))(
    'fixing only bug %s',
    async (_bug, fixes) => {
      expect(await statuses(withFixes(fixes))).toEqual(expectedStatuses(fixes));
    },
    120_000,
  );

  it.each(Object.entries(BUGS))(
    'fixing every bug except %s',
    async (_bug, fixes) => {
      expect(await statuses(withFixes(except(fixes)))).toEqual(expectedStatuses(except(fixes)));
    },
    120_000,
  );

  it.each(ALL_FIXES)(
    'fixing only the "%s" part',
    async (fix) => {
      expect(await statuses(withFixes([fix]))).toEqual(expectedStatuses([fix]));
    },
    120_000,
  );

  it.each(ALL_FIXES)(
    'fixing every part except "%s"',
    async (fix) => {
      expect(await statuses(withFixes(except([fix])))).toEqual(expectedStatuses(except([fix])));
    },
    120_000,
  );
});

// ── Valid alternative fixes ─────────────────────────────────────────────────
const REFRESH_ONCE_BLOCK =
  / {2}\/\/ FIX: a single in-flight refresh[\s\S]*?\n {4}return refreshing;\n {2}\}\n/;
const REQUEST_UNTIL_OK_CHECK = / {2}async function request<T>[\s\S]*?(?= {4}if \(!res\.ok\))/;
const HOOK_EFFECT = / {2}useEffect\(\(\) => \{[\s\S]*?\n {2}\}, \[client, filter\]\);/;
const DECIDE_CALLBACK = / {2}const decide = useCallback\([\s\S]*?\n {4}\[api\],\n {2}\);/;

const VARIANTS: Record<string, Edits> = {
  'refresh: a queue of waiting requests settled by one refresh (interceptor style)': {
    [HTTP]: replace(
      REFRESH_ONCE_BLOCK,
      `  // Requests that got a 401 while a refresh is running wait here for its outcome.
  let waiting: { resolve: (tokens: Tokens) => void; reject: (error: unknown) => void }[] | null = null;

  function refreshOnce(refreshToken: string): Promise<Tokens> {
    return new Promise<Tokens>((resolve, reject) => {
      if (waiting) {
        waiting.push({ resolve, reject });
        return;
      }
      const queue = [{ resolve, reject }];
      waiting = queue;
      o.refresh(refreshToken)
        .then(async (fresh) => {
          await o.session.saveTokens(fresh);
          waiting = null;
          queue.forEach((w) => w.resolve(fresh));
        })
        .catch(() => {
          waiting = null;
          o.onLogout();
          const expired = new HttpError(401, 'Your session has expired. Sign in again.');
          queue.forEach((w) => w.reject(expired));
        });
    });
  }
`,
    ),
  },

  'refresh: retry through a recursive call, comparing refresh tokens': {
    [HTTP]: replace(
      REQUEST_UNTIL_OK_CHECK,
      `  async function request<T>(method: string, path: string, options: RequestOptions, retried = false): Promise<T> {
    await o.session.ready;
    const sentWith = o.session.get()?.tokens;
    const res = await send(method, path, options, sentWith?.accessToken);
    if (res.status === 401 && sentWith && !retried) {
      // Refresh only if nobody rotated the tokens since this request was sent; then retry once.
      if (o.session.get()?.tokens.refreshToken === sentWith.refreshToken) await refreshOnce(sentWith.refreshToken);
      return request<T>(method, path, options, true);
    }
`,
    ),
  },

  'refresh: each refresh token exchanged at most once (results memoised per token)': {
    [HTTP]: chain(
      replace(
        REFRESH_ONCE_BLOCK,
        `  // A refresh token works once (they rotate), so remember what each one was exchanged for.
  const exchanged = new Map<string, Promise<Tokens>>();

  function refreshOnce(refreshToken: string): Promise<Tokens> {
    let pending = exchanged.get(refreshToken);
    if (!pending) {
      pending = o.refresh(refreshToken).then(
        async (fresh) => {
          await o.session.saveTokens(fresh);
          return fresh;
        },
        () => {
          o.onLogout();
          throw new HttpError(401, 'Your session has expired. Sign in again.');
        },
      );
      exchanged.set(refreshToken, pending);
    }
    return pending;
  }
`,
      ),
      replace(
        /const current = o\.session\.get\(\)\?\.tokens;[\s\S]*?: await refreshOnce\(sentWith\.refreshToken\);/,
        'const tokens = await refreshOnce(sentWith.refreshToken);',
      ),
    ),
  },

  'abort: an ignore flag next to a fresh AbortController per request': {
    [HOOK]: replace(
      HOOK_EFFECT,
      `  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    client
      .get<Approval[]>('/approvals?filter=' + filter, { signal: controller.signal })
      .then((data) => {
        if (ignore) return;
        setItems(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (ignore) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [client, filter]);`,
    ),
  },

  'abort: async/await with a request counter in a ref': {
    [HOOK]: chain(
      replace(
        "import { useEffect, useState } from 'react';",
        "import { useEffect, useRef, useState } from 'react';",
      ),
      replace(
        HOOK_EFFECT,
        `  const latestRequest = useRef(0);

  useEffect(() => {
    const id = ++latestRequest.current;
    const controller = new AbortController();
    const isCurrent = () => id === latestRequest.current && !controller.signal.aborted;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await client.get<Approval[]>('/approvals?filter=' + filter, { signal: controller.signal });
        if (isCurrent()) setItems(data);
      } catch (e) {
        if (isCurrent()) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (isCurrent()) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [client, filter]);`,
      ),
    ),
  },

  'rollback: previous statuses kept in a ref map, a fixed user-facing error message': {
    [DECISIONS]: replace(
      DECIDE_CALLBACK,
      `  // The status each row had before its decision in flight (a second tap keeps the first one).
  const before = useRef(new Map<string, Approval['status']>());

  const decide = useCallback(
    async (id: string, decision: Decision) => {
      if (!before.current.has(id)) {
        before.current.set(id, latest.current.find((a) => a.id === id)?.status ?? 'PENDING');
      }
      dispatch({ type: 'OPTIMISTIC', id, status: decision });
      try {
        await api.post('/approvals/' + id + '/' + (decision === 'APPROVED' ? 'approve' : 'reject'));
        before.current.delete(id);
      } catch {
        const status = before.current.get(id) ?? 'PENDING';
        before.current.delete(id);
        dispatch({ type: 'ROLLBACK', id, status, error: 'Could not save this decision. Try again.' });
      }
    },
    [api],
  );`,
    ),
  },

  'rollback: useState with functional per-row updates instead of the reducer': {
    [DECISIONS]: chain(
      replace(
        "import { useCallback, useReducer, useRef } from 'react';",
        "import { useCallback, useRef, useState } from 'react';",
      ),
      replace(
        /export function useApprovalDecisions[\s\S]*$/,
        `export function useApprovalDecisions(api: Pick<HttpClient, 'post'>, initial: Approval[]) {
  const [items, setItems] = useState(initial);
  const latest = useRef(items);
  latest.current = items;

  const patchRow = useCallback(
    (id: string, patch: Partial<Approval>) =>
      setItems((current) => current.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [],
  );

  const decide = useCallback(
    async (id: string, decision: Decision) => {
      const previous = latest.current.find((a) => a.id === id)?.status ?? 'PENDING';
      patchRow(id, { status: decision, error: undefined });
      try {
        await api.post('/approvals/' + id + '/' + (decision === 'APPROVED' ? 'approve' : 'reject'));
      } catch (e) {
        patchRow(id, { status: previous, error: e instanceof Error ? e.message : 'Failed' });
      }
    },
    [api, patchRow],
  );

  return { items, decide, load: (next: Approval[]) => setItems(next) };
}
`,
      ),
    ),
  },

  'hydration: changes run one after another behind hydration (a promise queue)': {
    [SESSION]: replace(
      / {2}\/\/ FIX: every change waits for hydration first[\s\S]*?(?= {4}subscribe\(listener\) \{)/,
      `  // Every change runs after hydration and after the previous change, so writes persist in order.
  let last: Promise<unknown> = ready;
  const serially = (change: () => Promise<void>): Promise<void> => {
    const run = last.then(change);
    last = run.catch(() => undefined);
    return run;
  };

  return {
    ready,
    get: () => session,
    signIn: (next) =>
      serially(async () => {
        session = next;
        emit();
        await persist();
      }),
    saveTokens: (tokens) =>
      serially(async () => {
        if (!session) return;
        session = { ...session, tokens };
        emit();
        await persist();
      }),
    signOut: () =>
      serially(async () => {
        session = null;
        emit();
        await persist();
      }),
`,
    ),
    // The client waits only while no session has been loaded yet.
    [HTTP]: replace('    await o.session.ready;\n', '    if (!o.session.get()) await o.session.ready;\n'),
  },

  'hydration: changes made while loading are replayed onto the stored session': {
    [SESSION]: replace(
      / {2}const ready = AsyncStorage[\s\S]*?(?= {4}subscribe\(listener\) \{)/,
      `  // Changes made before storage was read are replayed on top of the stored session once it is.
  let hydrated = false;
  const early: ((s: Session | null) => Session | null)[] = [];

  const ready = AsyncStorage.getItem(SESSION_KEY).then(async (raw) => {
    let stored: Session | null = null;
    try {
      stored = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      stored = null; // corrupt entry: treat as signed out
    }
    session = early.reduce((s, fn) => fn(s), stored);
    hydrated = true;
    emit();
    if (early.length) await persist();
  });

  const change = async (fn: (s: Session | null) => Session | null) => {
    if (!hydrated) {
      early.push(fn);
      return ready;
    }
    session = fn(session);
    emit();
    await persist();
  };

  return {
    ready,
    get: () => session,
    signIn: (next) => change(() => next),
    saveTokens: (tokens) => change((s) => (s ? { ...s, tokens } : s)),
    signOut: () => change(() => null),
`,
    ),
  },

  'list: expanded state kept in each row, rows keyed by a prefixed id': {
    [LIST]: chain(
      replace(
        'offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index',
        'offset: index * ROW_HEIGHT + index * SEPARATOR_HEIGHT',
      ),
      replace(
        /function ApprovalRow\(\{\n {2}item,\n {2}expanded,\n {2}onToggle,\n {2}onDecide,\n\}: \{\n {2}item: Approval;\n {2}expanded: boolean;\n {2}onToggle: \(\) => void;\n/,
        'function ApprovalRow({\n  item,\n  onDecide,\n}: {\n  item: Approval;\n',
      ),
      replace(
        "  const [comment, setComment] = useState('');\n",
        "  const [expanded, setExpanded] = useState(false);\n  const [comment, setComment] = useState('');\n",
      ),
      replace('onPress={onToggle}', 'onPress={() => setExpanded((e) => !e)}'),
      replace(
        / {2}\/\/ FIX: track the expanded row by id[\s\S]*?(?=\n {2}return \()/,
        '  // Each row owns its expanded state; keys by id keep that state with the row.',
      ),
      replace('keyExtractor={(item) => item.id}', 'keyExtractor={(item) => `approval-${item.id}`}'),
      replace(
        /renderItem=\{\(\{ item \}\) => \([\s\S]*?\n {6}\)\}/,
        'renderItem={({ item }) => <ApprovalRow item={item} onDecide={onDecide} />}',
      ),
    ),
  },

  'list: a memoised renderItem with extraData and a named keyExtractor': {
    [LIST]: chain(
      replace(
        "import React, { useState } from 'react';",
        "import React, { useCallback, useState } from 'react';",
      ),
      replace(
        "import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';",
        "import { FlatList, Pressable, StyleSheet, Text, TextInput, View, type ListRenderItemInfo } from 'react-native';",
      ),
      replace('const Separator = ', 'const keyOf = (item: Approval) => item.id;\n\nconst Separator = '),
      replace(
        /(?<= {2}const \[expanded, setExpanded\] = useState<string \| null>\(null\);\n)[\s\S]*?\n {2}\);\n\}/,
        `  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Approval>) => (
      <ApprovalRow
        item={item}
        expanded={expanded === item.id}
        onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
        onDecide={onDecide}
      />
    ),
    [expanded, onDecide],
  );
  return (
    <FlatList
      testID="approvals"
      data={items}
      extraData={expanded}
      keyExtractor={keyOf}
      getItemLayout={getItemLayout}
      ItemSeparatorComponent={Separator}
      renderItem={renderItem}
    />
  );
}`,
      ),
    ),
  },
};

describe('rn-approvals-inbox: other valid fixes pass every test', () => {
  it.each(Object.entries(VARIANTS))(
    '%s',
    async (_name, edits) => {
      const files = edit(solution, edits);
      expect(typecheckFiles(files)).toEqual([]);
      expect(await failures(files)).toEqual([]);
    },
    120_000,
  );

  // In React Native the separator is rendered inside the item's cell, so counting it in `length` is
  // correct too; only `offset` decides where scrollToIndex lands.
  it('list: getItemLayout counts the separator in the cell length too', async () => {
    const files = edit(solution, {
      [LIST]: replace(
        'return { length: ROW_HEIGHT, offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index, index };',
        'return { length: ROW_HEIGHT + SEPARATOR_HEIGHT, offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index, index };',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);
});

// ── Wrong fixes that only hide a symptom ────────────────────────────────────
interface WrongFix {
  edits: Edits;
  /** Tests that must fail (each wrong fix is applied to the otherwise correct solution). */
  caughtBy: string[];
}

const WRONG_FIXES: Record<string, WrongFix> = {
  'refresh: log out on every 401 instead of refreshing (feature removed)': {
    edits: {
      [HTTP]: replace(
        /const current = o\.session\.get\(\)\?\.tokens;[\s\S]*?\/\/ retried at most once/,
        "o.onLogout();\n      throw new HttpError(401, 'Your session has expired. Sign in again.');",
      ),
    },
    caughtBy: [T.retries, T.refreshOnce, T.noSecondRefresh],
  },
  'refresh: the refresh token read again at refresh time, still a boolean flag': {
    edits: {
      [HTTP]: replace(
        REFRESH_ONCE_BLOCK,
        `  let isRefreshing = false;

  async function refreshOnce(_sentWith: string): Promise<Tokens> {
    if (isRefreshing) return o.session.get()!.tokens;
    isRefreshing = true;
    try {
      const fresh = await o.refresh(o.session.get()!.tokens.refreshToken);
      await o.session.saveTokens(fresh);
      return fresh;
    } catch {
      o.onLogout();
      throw new HttpError(401, 'Your session has expired. Sign in again.');
    } finally {
      isRefreshing = false;
    }
  }
`,
      ),
    },
    caughtBy: [T.refreshOnce],
  },
  'abort: an isMounted-style flag instead of aborting the request': {
    edits: {
      [HOOK]: chain(
        replace('const controller = new AbortController();', 'let active = true;'),
        replace('{ signal: controller.signal }', '{}'),
        replace('if (controller.signal.aborted) return;', 'if (!active) return;'),
        replace("if (controller.signal.aborted || e.name === 'AbortError') return;", 'if (!active) return;'),
        replace('return () => controller.abort();', 'return () => {\n      active = false;\n    };'),
      ),
    },
    caughtBy: [T.slowResponse, T.cancelOnUnmount],
  },
  'rollback: a failed decision goes back to PENDING, not to the status it had': {
    edits: {
      [DECISIONS]: replace(
        "const previous = latest.current.find((a) => a.id === id)?.status ?? 'PENDING';",
        "const previous = 'PENDING' as const;",
      ),
    },
    caughtBy: [T.previousStatus],
  },
  'rollback: keep the optimistic status and only flag the error': {
    edits: { [DECISIONS]: replace('status: previous, error:', 'status: decision, error:') },
    caughtBy: [T.rollbackOnlyFailed, T.laterSuccess, T.previousStatus],
  },
  'list: keys made of the id and the index': {
    edits: {
      [LIST]: replace(
        'keyExtractor={(item) => item.id}',
        'keyExtractor={(item, index) => `${item.id}-${index}`}',
      ),
    },
    caughtBy: [T.rowComment],
  },
  'list: the separator added once instead of once per row above': {
    edits: {
      [LIST]: replace(
        'offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index',
        'offset: ROW_HEIGHT * index + SEPARATOR_HEIGHT',
      ),
    },
    caughtBy: [T.scrollToIndex],
  },
  'list: collapse the expanded row whenever the list changes': {
    edits: {
      [LIST]: chain(
        replace(
          "import React, { useState } from 'react';",
          "import React, { useEffect, useState } from 'react';",
        ),
        replace(
          '  const [expanded, setExpanded] = useState<string | null>(null);\n',
          '  const [expanded, setExpanded] = useState<string | null>(null);\n  useEffect(() => setExpanded(null), [items]);\n',
        ),
      ),
    },
    caughtBy: [T.expandedRow, T.rowComment],
  },
};

describe('rn-approvals-inbox: wrong fixes that hide a symptom fail', () => {
  it.each(Object.entries(WRONG_FIXES))(
    '%s',
    async (_name, { edits, caughtBy }) => {
      const failed = (await results(edit(solution, edits)))
        .filter((r) => r.status === 'failed')
        .map((r) => r.name);
      expect(failed).toEqual(expect.arrayContaining(caughtBy));
    },
    120_000,
  );

  // Waiting a fixed time for "the other" refresh instead of awaiting it: the test's refresh is slow.
  it('refresh: waiters sleep 50 ms and then use whatever tokens are stored', async () => {
    const files = edit(solution, {
      [HTTP]: replace(
        REFRESH_ONCE_BLOCK,
        `  let isRefreshing = false;

  async function refreshOnce(refreshToken: string): Promise<Tokens> {
    if (isRefreshing) {
      // Another request is refreshing: give it a moment, then use the tokens it stored.
      await new Promise((resolve) => setTimeout(resolve, 50));
      const stored = o.session.get()?.tokens;
      if (!stored) throw new HttpError(401, 'Your session has expired. Sign in again.');
      return stored;
    }
    isRefreshing = true;
    try {
      const fresh = await o.refresh(refreshToken);
      await o.session.saveTokens(fresh);
      return fresh;
    } catch {
      o.onLogout();
      throw new HttpError(401, 'Your session has expired. Sign in again.');
    } finally {
      isRefreshing = false;
    }
  }
`,
      ),
    });
    expect(await failures(files)).not.toEqual([]);
  }, 120_000);

  // Sleeping instead of awaiting `ready`: the test's storage is slower than the sleep.
  it('hydration: fixed 100 ms sleeps instead of waiting for the stored session', async () => {
    const sleep = 'await new Promise((resolve) => setTimeout(resolve, 100));';
    const files = edit(solution, {
      [HTTP]: replace('    await o.session.ready;\n', `    ${sleep}\n`),
      [SESSION]: chain(
        replace('    async signIn(next) {\n      await ready;', `    async signIn(next) {\n      ${sleep}`),
        replace(
          '    async saveTokens(tokens) {\n      await ready;',
          `    async saveTokens(tokens) {\n      ${sleep}`,
        ),
        replace('    async signOut() {\n      await ready;', `    async signOut() {\n      ${sleep}`),
      ),
    });
    expect(await failures(files)).not.toEqual([]);
  }, 120_000);

  // Swallowing every error to stop the spinner: a failed load must be reported.
  it('abort: load errors swallowed (the error state is never set)', async () => {
    const files = edit(solution, {
      [HOOK]: replace(
        "if (controller.signal.aborted || e.name === 'AbortError') return;\n        setError(e.message);",
        'if (controller.signal.aborted) return;',
      ),
    });
    expect(await failures(files)).not.toEqual([]);
  }, 120_000);
});

// ── Broken candidate code ───────────────────────────────────────────────────
type IsolatedOutcome =
  SandboxOutcome | { type: 'hung' } | { type: 'host-crash'; code: number | null; stderr: string };

// Generous: the full suite runs many of these at once on a busy machine.
const SANDBOX_TIMEOUT_MS = 30_000;
const HARD_LIMIT_MS = 75_000;
const QUESTION_CHECK = pathToFileURL(join(import.meta.dirname, '..', 'lib', 'questionCheck.ts')).href;
// No backslashes in this script: Windows command-line quoting would mangle them.
const DRIVER = [
  `import { runSandboxTests } from ${JSON.stringify(QUESTION_CHECK)};`,
  "let input = '';",
  'for await (const chunk of process.stdin) input += chunk;',
  'const { files, timeoutMs } = JSON.parse(input);',
  'const outcome = await runSandboxTests(files, timeoutMs);',
  // A run that returns but leaves the event loop starved would still hang its caller.
  'await new Promise((resolve) => setTimeout(resolve, 100));',
  "process.stdout.write('@@OUTCOME@@' + JSON.stringify(outcome), () => process.exit(0));",
].join('\n');

/**
 * runSandboxTests in a child process, so code that blocks the event loop (which no in-process timer
 * can interrupt) can't hang this test run: the child is killed after HARD_LIMIT_MS ("hung").
 */
function runIsolated(files: SourceFile[]): Promise<IsolatedOutcome> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '--no-warnings', '--eval', DRIVER], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let hung = false;
    const timer = setTimeout(() => {
      hung = true;
      child.kill();
    }, HARD_LIMIT_MS);
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    child.on('close', (code) => {
      clearTimeout(timer);
      const at = stdout.indexOf('@@OUTCOME@@');
      if (at >= 0) resolve(JSON.parse(stdout.slice(at + '@@OUTCOME@@'.length)) as SandboxOutcome);
      else resolve(hung ? { type: 'hung' } : { type: 'host-crash', code, stderr: stderr.slice(0, 2000) });
    });
    child.stdin.end(JSON.stringify({ files, timeoutMs: SANDBOX_TIMEOUT_MS }));
  });
}

const failedTests = (o: IsolatedOutcome) =>
  o.type === 'done' ? o.results.filter((r) => r.status === 'failed') : [];
const testsOfFiles = (o: IsolatedOutcome, files: string[]) =>
  o.type === 'done' ? o.results.filter((r) => files.includes(r.file)).map((r) => r.name) : [];

describe.concurrent('rn-approvals-inbox: broken code gives a clear outcome, never a hung run', () => {
  it('a TypeScript type error the tests also catch at run time (and the type check reports)', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [DECISIONS]: replace(
        "error: e instanceof Error ? e.message : 'Failed'",
        "error: e instanceof Error ? e : 'Failed'",
      ),
    });
    expect(typecheckFiles(files).map((d) => d.path)).toContain(DECISIONS);
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o).map((r) => r.name)).toEqual(
      expect.arrayContaining([T.rollbackOnlyFailed, T.previousStatus]),
    );
  }, 120_000);

  it('a type-only error still runs the tests, as in the browser (the editor shows it)', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [DECISIONS]: replace(
        'export type ApprovalsAction',
        "const label: number = 'approvals';\nexport type ApprovalsAction",
      ),
    });
    expect(typecheckFiles(files).map((d) => [d.path, d.code])).toEqual([[DECISIONS, 2322]]);
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o)).toEqual([]);
  }, 120_000);

  it('a syntax error (stray token)', async ({ expect }) => {
    const files = edit(solution, {
      [DECISIONS]: replace('export function approvalsReducer', 'export function = approvalsReducer'),
    });
    const o = await runIsolated(files);
    // The browser reports it as a compile error with its line; in Node the whole script fails to parse.
    expect(['compile', 'crash']).toContain(o.type);
    expect(JSON.stringify(o)).toMatch(/SyntaxError|expected/);
  }, 120_000);

  // TypeScript's transpiler alone would repair this; like the browser, the checker refuses it.
  it('a syntax error (missing closing brace at the end of a file)', async ({ expect }) => {
    const files = edit(solution, { [DECISIONS]: (src) => src.trimEnd().replace(/\}$/, '') });
    const o = await runIsolated(files);
    expect(o.type).toBe('compile');
  }, 120_000);

  it('a file emptied completely', async ({ expect }) => {
    const files = edit(solution, { [DECISIONS]: () => '' });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual(
      testsOfFiles(o, ['__tests__/approvals.test.tsx']).sort(),
    );
    expect(failed[0]?.error).toMatch(/is not a function/);
  }, 120_000);

  it('an export the tests import removed', async ({ expect }) => {
    const files = edit(solution, {
      [HOOK]: replace('export function useApprovals', 'function useApprovals'),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual(
      testsOfFiles(o, ['__tests__/useApprovals.test.tsx']).sort(),
    );
    expect(failed[0]?.error).toMatch(/useApprovals.* is not a function/);
  }, 120_000);

  it('a module that throws when it is loaded', async ({ expect }) => {
    const files = edit(solution, {
      [SESSION]: replace(
        "export const SESSION_KEY = 'session.v1';",
        "export const SESSION_KEY = 'session.v1';\nthrow new Error('boom at load');",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual([
      '__tests__/httpClient.test.ts could not be loaded',
      '__tests__/sessionStore.test.ts could not be loaded',
    ]);
    expect(failed[0]?.error).toContain('boom at load');
  }, 120_000);

  it('an infinite render loop (setState during render)', async ({ expect }) => {
    const files = edit(solution, {
      [LIST]: replace(
        '  const [expanded, setExpanded] = useState<string | null>(null);\n',
        '  const [expanded, setExpanded] = useState<string | null>(null);\n  const [renders, setRenders] = useState(0);\n  setRenders(renders + 1);\n',
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name)).toEqual(expect.arrayContaining([T.expandedRow, T.rowComment]));
    expect(failed.find((r) => r.name === T.expandedRow)?.error).toMatch(/Too many re-renders/);
  }, 120_000);

  it('a promise that never settles in code every request goes through', async ({ expect }) => {
    const files = edit(solution, {
      [HTTP]: replace('    await o.session.ready;\n', '    await new Promise<void>(() => {});\n'),
    });
    const o = await runIsolated(files);
    expect(['done', 'timeout']).toContain(o.type);
    if (o.type === 'done') expect(failedTests(o).some((r) => /timed out/.test(r.error ?? ''))).toBe(true);
  }, 120_000);

  it('huge console output is capped per test', async ({ expect }) => {
    const files = edit(solution, {
      [LIST]: replace(
        '  // FIX: every row before `index` is followed by a separator.\n',
        "  for (let i = 0; i < 20_000; i++) console.log('layout', i, { index });\n  for (let i = 0; i < 5; i++) console.error('x'.repeat(200_000));\n",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    if (o.type !== 'done') return;
    expect(failedTests(o)).toEqual([]);
    for (const r of o.results) {
      expect(r.logs.length).toBeLessThanOrEqual(200);
      for (const line of r.logs) expect(line.length).toBeLessThanOrEqual(520);
    }
  }, 120_000);

  // Only logged, as in the browser's worker: the tests are unaffected.
  it('a promise rejection nobody handles', async ({ expect }) => {
    const files = edit(solution, {
      [DECISIONS]: replace(
        "      dispatch({ type: 'OPTIMISTIC', id, status: decision });\n",
        "      dispatch({ type: 'OPTIMISTIC', id, status: decision });\n      void Promise.reject(new Error('nobody handles me'));\n",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o)).toEqual([]);
  }, 120_000);

  // The run's worker thread is stopped after the timeout, as the browser stops its Web Worker.
  it('an infinite loop while rendering a component', async ({ expect }) => {
    const files = edit(solution, {
      [LIST]: replace(
        "  const [comment, setComment] = useState('');\n",
        "  const [comment, setComment] = useState('');\n  while (item.id) {}\n",
      ),
    });
    expect((await runIsolated(files)).type).toBe('timeout');
  }, 120_000);

  it('an infinite loop in a function a test calls', async ({ expect }) => {
    const files = edit(solution, {
      [LIST]: replace(
        '  // FIX: every row before `index` is followed by a separator.\n',
        '  while (index >= 0) {}\n',
      ),
    });
    expect((await runIsolated(files)).type).toBe('timeout');
  }, 120_000);

  it('an endless async loop (microtasks only)', async ({ expect }) => {
    const files = edit(solution, {
      [HOOK]: replace(
        '    const controller = new AbortController();\n',
        '    const controller = new AbortController();\n    void (async () => {\n      for (;;) await null;\n    })();\n',
      ),
    });
    expect(['timeout', 'done']).toContain((await runIsolated(files)).type);
  }, 120_000);
});
```

### 3. `scripts/tests/rnLiveAuctionVariants.test.ts`

- **Folder:** `scripts/tests`
- **File name:** `rnLiveAuctionVariants.test.ts`
- **Action:** **Create** a new file with exactly this content.
- **Size:** 904 lines, 36 KB
- **Commit message:** `Sync rnLiveAuctionVariants.test.ts (question v3 grading)`

```ts
/**
 * rn-live-auction: the read-only tests must accept every reasonable fix and reject wrong ones.
 * - Valid alternative fixes (variants of the reference solution) pass every test and type-check.
 * - Partial fixes (the starter plus the reference fix of some bugs) pass exactly the tests of the
 *   bugs they fix: every test detects its own bug and none passes on the starter by accident.
 * - Wrong fixes that only hide a symptom fail the test written for that symptom.
 * - Broken candidate code gets a clear failure or a timeout, never a hung run.
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SandboxOutcome } from '../../src/features/runner/buildScript.ts';
import { runSandboxTests, typecheckFiles, withSolution, type SourceFile } from '../lib/questionCheck.ts';
import { loadQuestion, QUESTIONS_DIR } from '../lib/questionSource.ts';

const q = loadQuestion(join(QUESTIONS_DIR, 'rn-live-auction'));
const starter: SourceFile[] = q.files.map((f) => ({ path: f.path, content: f.content }));
const referenceFiles = q.reference_solution?.files ?? [];
const solution = withSolution(starter, referenceFiles);

const SCREEN = 'src/screens/AuctionScreen.tsx';
const BOARD = 'src/components/BidBoard.tsx';
const COUNTDOWN = 'src/hooks/useCountdown.ts';
const LISTENERS = 'src/hooks/useAuctionListeners.ts';
const MONEY = 'src/utils/money.ts';

function reference(path: string): string {
  const file = referenceFiles.find((f) => f.path === path);
  if (!file) throw new Error(`the reference solution has no ${path}`);
  return file.content;
}
const starterFile = (path: string) => starter.find((f) => f.path === path)!.content;

// ── Editing helpers ─────────────────────────────────────────────────────────
type Edit = (src: string) => string;
type Edits = Record<string, Edit>;

/** Replaces the first match of `from` (it must occur); `to` is literal text or a function of the match. */
const replace =
  (from: string | RegExp, to: string | ((match: string) => string)): Edit =>
  (src) => {
    const out = src.replace(from, (match) => (typeof to === 'string' ? to : to(match)));
    if (out === src) throw new Error(`edit not applicable, pattern not found: ${String(from)}`);
    return out;
  };
const chain =
  (...edits: Edit[]): Edit =>
  (src) =>
    edits.reduce((s, e) => e(s), src);
const whole =
  (content: string): Edit =>
  () =>
    content;

/** Adds hooks to the file's `import { … } from 'react'` line. */
const importFromReact =
  (...names: string[]): Edit =>
  (src) =>
    src.replace(/import \{ ([^}]*) \} from 'react';/, (_match, list: string) => {
      const all = new Set([...list.split(',').map((s) => s.trim()), ...names]);
      return `import { ${[...all].sort().join(', ')} } from 'react';`;
    });

/** The top-level `export function name` of `src`, up to its closing brace. */
function exportedFunction(src: string, name: string): string {
  const match = new RegExp(`export function ${name}\\b[\\s\\S]*?\\n\\}\\n`).exec(src);
  if (!match) throw new Error(`no exported function ${name}`);
  return match[0];
}
/** Swaps in the reference solution's version of one exported function. */
const referenceFunction =
  (path: string, name: string): Edit =>
  (src) =>
    replace(exportedFunction(src, name), exportedFunction(reference(path), name))(src);

/** Applies `edits` (path → edit); every edit must change its file. */
function edit(files: SourceFile[], edits: Edits): SourceFile[] {
  for (const path of Object.keys(edits)) {
    if (!files.some((f) => f.path === path)) throw new Error(`no file ${path}`);
  }
  return files.map((f) => {
    const e = edits[f.path];
    if (!e) return f;
    const content = e(f.content);
    if (content === f.content) throw new Error(`edit changed nothing in ${f.path}`);
    return { path: f.path, content };
  });
}

async function results(files: SourceFile[]) {
  const o = await runSandboxTests(files);
  if (o.type !== 'done') throw new Error(`the run did not complete: ${JSON.stringify(o).slice(0, 2000)}`);
  expect(o.results.length).toBeGreaterThan(0);
  return o.results;
}
const failures = async (files: SourceFile[]) =>
  (await results(files)).filter((r) => r.status !== 'passed').map((r) => `${r.name}: ${r.error}`);
const statuses = async (files: SourceFile[]) =>
  Object.fromEntries((await results(files)).map((r) => [r.name, r.status]));

// ── The question's tests and the bugs they detect ───────────────────────────
const T = {
  countsDown: 'useCountdown › counts down every second and closes at zero',
  extension: 'useCountdown › picks up an extension of the closing time immediately',
  background: 'useCountdown › is right again as soon as the app returns from the background',
  oneListener: 'live bid feed › has exactly one listener while focused, however often the screen re-renders',
  latestCallback: 'live bid feed › delivers each bid once, to the latest callback',
  unsubscribes: 'live bid feed › unsubscribes when the screen loses focus and when it unmounts',
  newSocket: 'live bid feed › moves its listener to a new socket (after a reconnect)',
  oneAppState: 'foreground resync › keeps one AppState listener and removes it on unmount',
  latestForeground: 'foreground resync › calls the latest callback once when the app becomes active',
  ticks: "bid board performance › rows don't re-render while the countdown ticks",
  selection: 'bid board performance › selecting a bid re-renders only the rows whose selection changed',
  newBid: 'bid board performance › a new bid that ranks last renders only its own row',
  newBest: 'bid board performance › a new best bid becomes #1 and moves every other bid down',
  bidRules: 'bid rules › accepts a bid that undercuts the best bid by at least the minimum decrement',
  rejectsInvalid: 'bid rules › rejects zero, negative and non-numeric amounts',
  format: 'bid rules › formats amounts in rupees with Indian digit grouping',
} as const;

const INR =
  "new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })";

/** The reference fix split into independent parts, applied to the starter in this order. */
const FIXES = {
  /** Bug 1: restart when closesAt changes and recompute at once. */
  countdownDeps: {
    [COUNTDOWN]: chain(
      replace(
        '  useEffect(() => {\n    const id = setInterval',
        '  useEffect(() => {\n    setRemaining(Math.max(0, closesAt - Date.now()));\n    const id = setInterval',
      ),
      replace('  }, []);', '  }, [closesAt]);'),
    ),
  },
  /** Bug 1: derive the remaining time from the wall clock on every tick. */
  wallClock: {
    [COUNTDOWN]: replace(
      'setRemaining((r) => Math.max(0, r - 1000));',
      'setRemaining(Math.max(0, closesAt - Date.now()));',
    ),
  },
  /** Bug 2: one stable handler, a memoised focus effect, the latest callback via a ref. */
  bidFeed: {
    [LISTENERS]: chain(importFromReact('useCallback', 'useRef'), referenceFunction(LISTENERS, 'useBidFeed')),
  },
  /** Bug 2: the AppState subscription is removed in the cleanup. */
  appState: {
    [LISTENERS]: chain(importFromReact('useRef'), referenceFunction(LISTENERS, 'useOnForeground')),
  },
  /** Bug 3: memoised rows get only stable props (onSelect(id), StyleSheet styles). */
  rowProps: { [BOARD]: whole(reference(BOARD)) },
  /** Bug 3: the screen passes a stable onSelect. */
  stableSelect: {
    [SCREEN]: chain(
      replace(
        "import React, { useState } from 'react';",
        "import React, { useCallback, useState } from 'react';",
      ),
      replace(
        '  useOnForeground(onResync);\n',
        '  useOnForeground(onResync);\n  const select = useCallback((id: string) => setSelectedId(id), []);\n',
      ),
      replace('onSelect={(id) => setSelectedId(id)}', 'onSelect={select}'),
    ),
  },
  /** Bug 4: compare integer paise. */
  paise: {
    [MONEY]: chain(
      replace(
        '/**\n * In a reverse auction',
        'const toPaise = (rupees: number) => Math.round(rupees * 100);\n\n/**\n * In a reverse auction',
      ),
      replace(
        '  return bid > 0 && bid <= best - minDecrement;',
        '  const b = toPaise(bid);\n  return b > 0 && b <= toPaise(best) - toPaise(minDecrement);',
      ),
    ),
  },
  /** Bug 4: format with Intl (Indian digit grouping). */
  format: {
    [MONEY]: chain(
      replace('/** "₹12,34,567.50"', `const inr = ${INR};\n\n/** "₹12,34,567.50"`),
      replace('  return `₹${amount.toFixed(2)}`;', '  return inr.format(amount);'),
    ),
  },
} satisfies Record<string, Edits>;
type Fix = keyof typeof FIXES;
const ALL_FIXES = Object.keys(FIXES) as Fix[];

/** The bugs of solution/notes.md and the parts of the fix each one needs. */
const BUGS: Record<string, Fix[]> = {
  '1 (countdown ignores extensions, drifts)': ['countdownDeps', 'wallClock'],
  '2 (listener leaks)': ['bidFeed', 'appState'],
  '3 (rows re-render on every tick)': ['rowProps', 'stableSelect'],
  '4 (float money, no digit grouping)': ['paise', 'format'],
};

/** The fix parts each test needs in order to pass. [] = passes on the starter (a regression guard). */
const NEEDS: Record<string, Fix[]> = {
  [T.countsDown]: [],
  [T.extension]: ['countdownDeps'],
  [T.background]: ['wallClock'],
  [T.oneListener]: ['bidFeed'],
  [T.latestCallback]: ['bidFeed'],
  [T.unsubscribes]: ['bidFeed'],
  [T.newSocket]: ['bidFeed'],
  [T.oneAppState]: ['appState'],
  [T.latestForeground]: ['appState'],
  // Memoised rows only help once the screen's callback is stable too, and vice versa.
  [T.ticks]: ['rowProps', 'stableSelect'],
  [T.selection]: ['rowProps', 'stableSelect'],
  [T.newBid]: ['rowProps', 'stableSelect'],
  [T.newBest]: [],
  [T.bidRules]: ['paise'],
  [T.rejectsInvalid]: [],
  [T.format]: ['format'],
};

function withFixes(applied: Fix[]): SourceFile[] {
  return ALL_FIXES.filter((f) => applied.includes(f)).reduce((files, f) => edit(files, FIXES[f]), starter);
}
const expectedStatuses = (applied: Fix[]) =>
  Object.fromEntries(
    Object.entries(NEEDS).map(([name, needs]) => [
      name,
      needs.every((f) => applied.includes(f)) ? 'passed' : 'failed',
    ]),
  );
const except = (excluded: Fix[]) => ALL_FIXES.filter((f) => !excluded.includes(f));

describe('rn-live-auction: partial fixes pass exactly the tests of the bugs they fix', () => {
  it('the starter fails exactly the tests of the planted bugs', async () => {
    expect(await statuses(starter)).toEqual(expectedStatuses([]));
  }, 120_000);

  it('every part of the fix together passes every test', async () => {
    expect(await statuses(withFixes(ALL_FIXES))).toEqual(expectedStatuses(ALL_FIXES));
  }, 120_000);

  it.each(Object.entries(BUGS))(
    'fixing only bug %s',
    async (_bug, fixes) => {
      expect(await statuses(withFixes(fixes))).toEqual(expectedStatuses(fixes));
    },
    120_000,
  );

  it.each(Object.entries(BUGS))(
    'fixing every bug except %s',
    async (_bug, fixes) => {
      expect(await statuses(withFixes(except(fixes)))).toEqual(expectedStatuses(except(fixes)));
    },
    120_000,
  );

  it.each(ALL_FIXES)(
    'fixing only the "%s" part',
    async (fix) => {
      expect(await statuses(withFixes([fix]))).toEqual(expectedStatuses([fix]));
    },
    120_000,
  );

  it.each(ALL_FIXES)(
    'fixing every part except "%s"',
    async (fix) => {
      expect(await statuses(withFixes(except([fix])))).toEqual(expectedStatuses(except([fix])));
    },
    120_000,
  );
});

// ── Valid alternative fixes ─────────────────────────────────────────────────
const COUNTDOWN_HOOK = /export function useCountdown[\s\S]*?\n\}\n/;

const VARIANTS: Record<string, Edits> = {
  'countdown: a clock state, the remaining time derived while rendering': {
    [COUNTDOWN]: replace(
      COUNTDOWN_HOOK,
      `export function useCountdown(closesAt: number) {
  // The interval only moves the clock; the remaining time always follows the latest closesAt.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, closesAt - now);
  return { remaining, closed: remaining === 0 };
}
`,
    ),
  },

  'countdown: a self-rescheduling timeout aligned to whole seconds, stopping at zero': {
    [COUNTDOWN]: replace(
      / {2}useEffect\(\(\) => \{[\s\S]*?\n {2}\}, \[closesAt\]\);/,
      `  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const left = Math.max(0, closesAt - Date.now());
      setRemaining(left);
      if (left > 0) timer = setTimeout(tick, left % 1000 || 1000);
    };
    tick();
    return () => clearTimeout(timer);
  }, [closesAt]);`,
    ),
  },

  'listeners: re-subscribe when the callback changes (React Navigation docs pattern)': {
    [LISTENERS]: chain(
      replace(
        "import { useCallback, useEffect, useRef } from 'react';",
        "import { useCallback, useEffect } from 'react';",
      ),
      replace(
        exportedFunction(reference(LISTENERS), 'useBidFeed'),
        `export function useBidFeed(socket: AuctionSocket, onBid: (bid: Bid) => void) {
  useFocusEffect(
    useCallback(() => {
      socket.on('bid', onBid);
      return () => socket.off('bid', onBid);
    }, [socket, onBid]),
  );
}
`,
      ),
      replace(
        exportedFunction(reference(LISTENERS), 'useOnForeground'),
        `export function useOnForeground(onForeground: () => void) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') onForeground();
    });
    return () => sub.remove();
  }, [onForeground]);
}
`,
      ),
    ),
  },

  'listeners: a shared useLatest hook (ref updated in a layout effect)': {
    [LISTENERS]: chain(
      replace(
        "import { useCallback, useEffect, useRef } from 'react';",
        "import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';",
      ),
      replace(
        '/** Live bids for the auction',
        `/** A ref that always holds the latest value (for handlers that must stay the same function). */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

/** Live bids for the auction`,
      ),
      replace(
        '  const latest = useRef(onBid);\n  useEffect(() => {\n    latest.current = onBid;\n  });\n',
        '  const latest = useLatest(onBid);\n',
      ),
      replace(
        '  const latest = useRef(onForeground);\n  useEffect(() => {\n    latest.current = onForeground;\n  });\n',
        '  const latest = useLatest(onForeground);\n',
      ),
    ),
  },

  'rendering: a custom React.memo comparison on the row (board and screen unchanged)': {
    [BOARD]: whole(
      replace(
        '\n});\n\nexport function BidBoard',
        [
          '\n},',
          '// Rows depend only on their data, rank and selection; onPress/style are derived from those.',
          '(prev, next) => prev.bid === next.bid && prev.rank === next.rank && prev.selected === next.selected);',
          '',
          'export function BidBoard',
        ].join('\n'),
      )(starterFile(BOARD)),
    ),
    [SCREEN]: whole(starterFile(SCREEN)),
  },

  'rendering: the board keeps the latest onSelect in a ref (screen unchanged)': {
    [BOARD]: chain(
      replace(
        "import React, { useCallback } from 'react';",
        "import React, { useCallback, useEffect, useRef } from 'react';",
      ),
      replace(
        /export const BidBoard = React\.memo\(function BidBoard\(([\s\S]*?)\) \{\n {2}const renderItem/,
        (m) =>
          m
            .replace('export const BidBoard = React.memo(function BidBoard(', 'export function BidBoard(')
            .replace(
              '  const renderItem',
              [
                '  // One stable select function for every row, whatever the parent passes in.',
                '  const latestOnSelect = useRef(onSelect);',
                '  useEffect(() => {',
                '    latestOnSelect.current = onSelect;',
                '  });',
                '  const select = useCallback((id: string) => latestOnSelect.current(id), []);',
                '  const renderItem',
              ].join('\n'),
            ),
      ),
      replace(
        'selected={item.id === selectedId} onSelect={onSelect} />\n    ),\n    [selectedId, onSelect],',
        'selected={item.id === selectedId} onSelect={select} />\n    ),\n    [selectedId, select],',
      ),
      replace('renderItem={renderItem} />;\n});', 'renderItem={renderItem} />;\n}'),
    ),
    [SCREEN]: whole(starterFile(SCREEN)),
  },

  'rendering: the countdown in its own component, the state setter passed as onSelect': {
    [SCREEN]: chain(
      replace(
        "import React, { useCallback, useState } from 'react';",
        "import React, { useEffect, useState } from 'react';",
      ),
      replace(
        '/** Minimum amount',
        `/** Only this component re-renders every second; the screen hears about it when the auction closes. */
function Countdown({ closesAt, onClosedChange }: { closesAt: number; onClosedChange: (closed: boolean) => void }) {
  const { remaining, closed } = useCountdown(closesAt);
  useEffect(() => onClosedChange(closed), [closed, onClosedChange]);
  return <Text testID="countdown">{closed ? 'Auction closed' : formatRemaining(remaining)}</Text>;
}

/** Minimum amount`,
      ),
      replace(
        '  const { remaining, closed } = useCountdown(closesAt);\n',
        '  const [closed, setClosed] = useState(() => Date.now() >= closesAt);\n',
      ),
      replace(/ {2}\/\/ FIX: a stable callback[^\n]*\n {2}const select = [^\n]*\n/, ''),
      replace(
        '<Text testID="countdown">{closed ? \'Auction closed\' : formatRemaining(remaining)}</Text>',
        '<Countdown closesAt={closesAt} onClosedChange={setClosed} />',
      ),
      replace('onSelect={select}', 'onSelect={setSelectedId}'),
    ),
  },

  'money: the threshold rounded to whole paise, toLocaleString for the format': {
    [MONEY]: chain(
      replace(
        /export function isValidBid[\s\S]*?\n\}\n/,
        `export function isValidBid(bid: number, best: number, minDecrement: number): boolean {
  const limit = Math.round((best - minDecrement) * 100) / 100;
  return bid > 0 && bid <= limit;
}
`,
      ),
      replace(
        '  return inr.format(amount);',
        "  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });",
      ),
    ),
  },

  'money: an epsilon comparison and hand-written Indian digit grouping': {
    [MONEY]: chain(
      replace(
        '  const b = toPaise(bid);\n  return b > 0 && b <= toPaise(best) - toPaise(minDecrement);',
        '  // Amounts have two decimals; 1e-9 absorbs the binary floating-point error.\n  return bid > 0 && bid <= best - minDecrement + 1e-9;',
      ),
      replace(
        '  return inr.format(amount);',
        [
          "  const [whole = '0', paise = '00'] = amount.toFixed(2).split('.');",
          '  // Indian grouping: the last three digits, then groups of two (12,34,567).',
          '  const head = whole.slice(0, -3);',
          "  const grouped = head ? `${head.replace(/\\B(?=(\\d{2})+$)/g, ',')},${whole.slice(-3)}` : whole;",
          '  return `₹${grouped}.${paise}`;',
        ].join('\n'),
      ),
    ),
  },
};

describe('rn-live-auction: other valid fixes pass every test', () => {
  it.each(Object.entries(VARIANTS))(
    '%s',
    async (_name, edits) => {
      const files = edit(solution, edits);
      expect(typecheckFiles(files)).toEqual([]);
      expect(await failures(files)).toEqual([]);
    },
    120_000,
  );

  // React Navigation's useIsFocused() re-renders on focus and blur, as the sandbox's now does.
  it('listeners: subscribe while useIsFocused() is true', async () => {
    const files = edit(solution, {
      [LISTENERS]: chain(
        replace(
          "import { useFocusEffect } from '@react-navigation/native';",
          "import { useIsFocused } from '@react-navigation/native';",
        ),
        replace(
          "import { useCallback, useEffect, useRef } from 'react';",
          "import { useEffect, useRef } from 'react';",
        ),
        replace(
          / {2}useFocusEffect\(\n {4}useCallback\(\(\) => \{([\s\S]*?)\n {4}\}, \[socket\]\),\n {2}\);/,
          (m) =>
            m
              .replace(
                '  useFocusEffect(\n    useCallback(() => {',
                '  const focused = useIsFocused();\n  useEffect(() => {\n    if (!focused) return;',
              )
              .replace('\n    }, [socket]),\n  );', '\n  }, [socket, focused]);')
              .replace(/\n {6}/g, '\n    '),
        ),
      ),
    });
    expect(typecheckFiles(files)).toEqual([]);
    expect(await failures(files)).toEqual([]);
  }, 120_000);
});

// ── Wrong fixes that only hide a symptom ────────────────────────────────────
interface WrongFix {
  edits: Edits;
  /** Tests that must fail (each wrong fix is applied to the otherwise correct solution). */
  caughtBy: string[];
}

const WRONG_FIXES: Record<string, WrongFix> = {
  'countdown: a shorter 250 ms tick that still counts ticks': {
    edits: {
      [COUNTDOWN]: replace(
        'const id = setInterval(update, 1000);',
        'const id = setInterval(() => setRemaining((r) => Math.max(0, r - 250)), 250);',
      ),
    },
    caughtBy: [T.background],
  },
  // Rejected on purpose: resyncing on 'active' still counts ticks in between (timers are throttled
  // and drift in the foreground too); the rubric asks for the wall clock on every tick.
  'countdown: resync when the app becomes active, count ticks otherwise': {
    edits: {
      [COUNTDOWN]: chain(
        replace(
          "import { useEffect, useState } from 'react';",
          "import { useEffect, useState } from 'react';\nimport { AppState } from 'react-native';",
        ),
        replace(
          'const id = setInterval(update, 1000);\n    return () => clearInterval(id);',
          [
            'const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1000)), 1000);',
            "    const sub = AppState.addEventListener('change', (state) => state === 'active' && update());",
            '    return () => {',
            '      clearInterval(id);',
            '      sub.remove();',
            '    };',
          ].join('\n'),
        ),
      ),
    },
    caughtBy: [T.background],
  },
  'countdown: closesAt added to the deps, nothing else': {
    edits: {
      [COUNTDOWN]: whole(
        FIXES.countdownDeps[COUNTDOWN](starterFile(COUNTDOWN)).replace(
          '    setRemaining(Math.max(0, closesAt - Date.now()));\n',
          '',
        ),
      ),
    },
    caughtBy: [T.extension, T.background],
  },
  'listeners: duplicate bids filtered out in the screen, hooks left leaking': {
    edits: {
      [LISTENERS]: whole(starterFile(LISTENERS)),
      [SCREEN]: replace(
        'setBids((current) => [...current, bid].sort(',
        'setBids((current) => current.some((b) => b.id === bid.id) ? current : [...current, bid].sort(',
      ),
    },
    caughtBy: [T.oneListener, T.latestCallback, T.unsubscribes, T.oneAppState, T.latestForeground],
  },
  'listeners: subscribe once in a plain useEffect (focus ignored)': {
    edits: {
      [LISTENERS]: replace(
        / {2}useFocusEffect\(\n {4}useCallback\(\(\) => \{([\s\S]*?)\n {4}\}, \[socket\]\),\n {2}\);/,
        "  useEffect(() => {\n    const handler = (bid: Bid) => latest.current(bid);\n    socket.on('bid', handler);\n    return () => socket.off('bid', handler);\n  }, [socket]);",
      ),
    },
    caughtBy: [T.unsubscribes],
  },
  'listeners: AppState.removeEventListener in the cleanup (removed in RN 0.70)': {
    edits: {
      [LISTENERS]: chain(
        replace(
          "    const sub = AppState.addEventListener('change', (state) => {\n      if (state === 'active') latest.current();\n    });\n    return () => sub.remove();",
          [
            '    const onChange = (state: string) => {',
            "      if (state === 'active') latest.current();",
            '    };',
            "    AppState.addEventListener('change', onChange);",
            "    return () => (AppState as unknown as { removeEventListener: (t: string, l: unknown) => void }).removeEventListener('change', onChange);",
          ].join('\n'),
        ),
      ),
    },
    caughtBy: [T.oneAppState],
  },
  'rendering: the trackRender() instrumentation removed': {
    edits: { [BOARD]: replace('  trackRender(`BidRow:${bid.id}`);\n', '') },
    caughtBy: [T.selection, T.newBid],
  },
  'rendering: React.memo on the board only, rows still get new callbacks and styles': {
    edits: {
      [BOARD]: whole(
        replace(
          'export function BidBoard({',
          'export const BidBoard = React.memo(function BidBoard({',
        )(replace(/\n {2}\);\n\}\n\nconst styles/, '\n  );\n});\n\nconst styles')(starterFile(BOARD))),
      ),
      [SCREEN]: whole(starterFile(SCREEN)),
    },
    caughtBy: [T.ticks, T.selection, T.newBid],
  },
  'money: a tolerance of one paisa in the comparison': {
    edits: {
      [MONEY]: replace(
        'return b > 0 && b <= toPaise(best) - toPaise(minDecrement);',
        'return bid > 0 && bid <= best - minDecrement + 0.01;',
      ),
    },
    caughtBy: [T.bidRules],
  },
  'money: paise truncated with Math.floor instead of rounded': {
    edits: { [MONEY]: replace('Math.round(rupees * 100)', 'Math.floor(rupees * 100)') },
    caughtBy: [T.bidRules],
  },
  'money: en-US digit grouping': {
    edits: { [MONEY]: replace("new Intl.NumberFormat('en-IN'", "new Intl.NumberFormat('en-US'") },
    caughtBy: [T.format],
  },
};

describe('rn-live-auction: wrong fixes that hide a symptom fail', () => {
  it.each(Object.entries(WRONG_FIXES))(
    '%s',
    async (_name, { edits, caughtBy }) => {
      const failed = (await results(edit(solution, edits)))
        .filter((r) => r.status === 'failed')
        .map((r) => r.name);
      expect(failed).toEqual(expect.arrayContaining(caughtBy));
    },
    120_000,
  );

  // trackRender() is a hook under the hood: calling it from an effect throws, so it can't be gamed.
  it('rendering: trackRender() moved into an effect, starter board and screen', async () => {
    const files = edit(solution, {
      [BOARD]: whole(
        chain(
          replace("import React from 'react';", "import React, { useEffect } from 'react';"),
          replace(
            '  trackRender(`BidRow:${bid.id}`);\n',
            '  useEffect(() => trackRender(`BidRow:${bid.id}`), [bid.id, selected]);\n',
          ),
        )(starterFile(BOARD)),
      ),
      [SCREEN]: whole(starterFile(SCREEN)),
    });
    expect(await failures(files)).not.toEqual([]);
  }, 120_000);
});

// ── Broken candidate code ───────────────────────────────────────────────────
type IsolatedOutcome =
  SandboxOutcome | { type: 'hung' } | { type: 'host-crash'; code: number | null; stderr: string };

// Generous: the full suite runs many of these at once on a busy machine.
const SANDBOX_TIMEOUT_MS = 30_000;
const HARD_LIMIT_MS = 75_000;
const QUESTION_CHECK = pathToFileURL(join(import.meta.dirname, '..', 'lib', 'questionCheck.ts')).href;
// No backslashes in this script: Windows command-line quoting would mangle them.
const DRIVER = [
  `import { runSandboxTests } from ${JSON.stringify(QUESTION_CHECK)};`,
  "let input = '';",
  'for await (const chunk of process.stdin) input += chunk;',
  'const { files, timeoutMs } = JSON.parse(input);',
  'const outcome = await runSandboxTests(files, timeoutMs);',
  // A run that returns but leaves the event loop starved would still hang its caller.
  'await new Promise((resolve) => setTimeout(resolve, 100));',
  "process.stdout.write('@@OUTCOME@@' + JSON.stringify(outcome), () => process.exit(0));",
].join('\n');

/**
 * runSandboxTests in a child process, so code that blocks the event loop (which no in-process timer
 * can interrupt) can't hang this test run: the child is killed after HARD_LIMIT_MS ("hung").
 */
function runIsolated(files: SourceFile[]): Promise<IsolatedOutcome> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '--no-warnings', '--eval', DRIVER], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let hung = false;
    const timer = setTimeout(() => {
      hung = true;
      child.kill();
    }, HARD_LIMIT_MS);
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    child.on('close', (code) => {
      clearTimeout(timer);
      const at = stdout.indexOf('@@OUTCOME@@');
      if (at >= 0) resolve(JSON.parse(stdout.slice(at + '@@OUTCOME@@'.length)) as SandboxOutcome);
      else resolve(hung ? { type: 'hung' } : { type: 'host-crash', code, stderr: stderr.slice(0, 2000) });
    });
    child.stdin.end(JSON.stringify({ files, timeoutMs: SANDBOX_TIMEOUT_MS }));
  });
}

const failedTests = (o: IsolatedOutcome) =>
  o.type === 'done' ? o.results.filter((r) => r.status === 'failed') : [];
const testsOfFiles = (o: IsolatedOutcome, files: string[]) =>
  o.type === 'done' ? o.results.filter((r) => files.includes(r.file)).map((r) => r.name) : [];

describe.concurrent('rn-live-auction: broken code gives a clear outcome, never a hung run', () => {
  it('a TypeScript type error the tests also catch at run time (and the type check reports)', async ({
    expect,
  }) => {
    const files = edit(solution, { [MONEY]: replace('  return inr.format(amount);', '  return amount;') });
    expect(typecheckFiles(files).map((d) => d.path)).toContain(MONEY);
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o).map((r) => r.name)).toContain(T.format);
  }, 120_000);

  it('a type-only error still runs the tests, as in the browser (the editor shows it)', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [MONEY]: replace('/** Parses what', "const label: number = 'auction';\n\n/** Parses what"),
    });
    expect(typecheckFiles(files).map((d) => [d.path, d.code])).toEqual([[MONEY, 2322]]);
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o)).toEqual([]);
  }, 120_000);

  it('a syntax error (stray token)', async ({ expect }) => {
    const files = edit(solution, {
      [COUNTDOWN]: replace('export function formatRemaining', 'export function = formatRemaining'),
    });
    const o = await runIsolated(files);
    // The browser reports it as a compile error with its line; in Node the whole script fails to parse.
    expect(['compile', 'crash']).toContain(o.type);
    expect(JSON.stringify(o)).toMatch(/SyntaxError|expected/);
  }, 120_000);

  it('a file emptied completely', async ({ expect }) => {
    const files = edit(solution, { [MONEY]: () => '' });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual(
      testsOfFiles(o, ['__tests__/money.test.ts', '__tests__/BidBoard.test.tsx']).sort(),
    );
    expect(failed[0]?.error).toMatch(/is not a function/);
  }, 120_000);

  it('an export the tests import removed', async ({ expect }) => {
    const files = edit(solution, {
      [COUNTDOWN]: replace('export function useCountdown', 'function useCountdown'),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual(
      testsOfFiles(o, ['__tests__/useCountdown.test.ts', '__tests__/BidBoard.test.tsx']).sort(),
    );
    expect(failed[0]?.error).toMatch(/useCountdown.* is not a function/);
  }, 120_000);

  it('a module that throws when it is loaded', async ({ expect }) => {
    const files = edit(solution, {
      [LISTENERS]: replace(
        "import type { Bid } from '../types';\n",
        "import type { Bid } from '../types';\n\nthrow new Error('boom at load');\n",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual([
      '__tests__/BidBoard.test.tsx could not be loaded',
      '__tests__/listeners.test.ts could not be loaded',
    ]);
    expect(failed[0]?.error).toContain('boom at load');
  }, 120_000);

  it('an infinite render loop (setState during render)', async ({ expect }) => {
    const files = edit(solution, {
      [BOARD]: chain(
        replace(
          "import React, { useCallback } from 'react';",
          "import React, { useCallback, useState } from 'react';",
        ),
        replace(
          '  trackRender(`BidRow:${bid.id}`);\n',
          '  trackRender(`BidRow:${bid.id}`);\n  const [renders, setRenders] = useState(0);\n  setRenders(renders + 1);\n',
        ),
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name)).toEqual(expect.arrayContaining([T.ticks, T.selection, T.newBid]));
    expect(failed[0]?.error).toMatch(/Too many re-renders/);
  }, 120_000);

  it('a timer that reschedules itself with no delay (fake timers)', async ({ expect }) => {
    const files = edit(solution, {
      [COUNTDOWN]: replace(
        '    const id = setInterval(update, 1000);\n    return () => clearInterval(id);',
        '    let id = setTimeout(function again() {\n      update();\n      id = setTimeout(again, 0);\n    }, 0);\n    return () => clearTimeout(id);',
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const loop = failedTests(o).find((r) => r.name === T.countsDown);
    expect(loop?.error).toMatch(/infinite timer loop/);
  }, 120_000);

  it('huge console output is capped per test', async ({ expect }) => {
    const files = edit(solution, {
      [MONEY]: replace(
        '/** Parses what',
        "for (let i = 0; i < 20_000; i++) console.log('loading money', i, { i });\nfor (let i = 0; i < 5; i++) console.error('x'.repeat(200_000));\n\n/** Parses what",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    if (o.type !== 'done') return;
    expect(failedTests(o)).toEqual([]);
    for (const r of o.results) {
      expect(r.logs.length).toBeLessThanOrEqual(200);
      for (const line of r.logs) expect(line.length).toBeLessThanOrEqual(520);
    }
  }, 120_000);

  // Only logged, as in the browser's worker: the tests are unaffected.
  it('a promise rejection nobody handles', async ({ expect }) => {
    const files = edit(solution, {
      [MONEY]: replace(
        '  const b = toPaise(bid);\n',
        "  const b = toPaise(bid);\n  void Promise.reject(new Error('nobody handles me'));\n",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o)).toEqual([]);
  }, 120_000);

  // The run's worker thread is stopped after the timeout, as the browser stops its Web Worker.
  it('an infinite loop while rendering a component', async ({ expect }) => {
    const files = edit(solution, {
      [BOARD]: replace(
        '  trackRender(`BidRow:${bid.id}`);\n',
        '  trackRender(`BidRow:${bid.id}`);\n  while (rank > 0) {}\n',
      ),
    });
    expect((await runIsolated(files)).type).toBe('timeout');
  }, 120_000);

  // The run's worker thread is stopped after the timeout, as the browser stops its Web Worker.
  it('an infinite loop in a function a test calls', async ({ expect }) => {
    const files = edit(solution, {
      [MONEY]: replace('  const b = toPaise(bid);\n', '  while (bid > 0) {}\n  const b = toPaise(bid);\n'),
    });
    expect((await runIsolated(files)).type).toBe('timeout');
  }, 120_000);

  // The run's worker thread is stopped after the timeout, as the browser stops its Web Worker.
  it('an endless async loop (microtasks only)', async ({ expect }) => {
    const files = edit(solution, {
      [MONEY]: replace(
        '/** Parses what',
        'void (async () => {\n  for (;;) await null;\n})();\n\n/** Parses what',
      ),
    });
    expect(['timeout', 'done']).toContain((await runIsolated(files)).type);
  }, 120_000);
});
```

### 4. `scripts/tests/webInvoiceBuilderVariants.test.ts`

- **Folder:** `scripts/tests`
- **File name:** `webInvoiceBuilderVariants.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 1446 lines, 55 KB
- **Commit message:** `Sync webInvoiceBuilderVariants.test.ts (question v3 grading)`

```ts
/**
 * Fairness of the web-invoice-builder question (Q4, React web debugging). Its read-only tests must
 * accept every reasonable fix, notice each planted bug on its own, reject fixes that only hide a
 * symptom, and the sandbox must report broken code instead of hanging.
 *
 * - Other valid fixes: the reference solution rewritten the other ways a senior developer would fix
 *   each bug. Every test passes and the editor shows no type error.
 * - Partial fixes: the starter with one bug fixed (and with every bug but one fixed). A test passes
 *   exactly when every bug it depends on is fixed (REQUIRES).
 * - Fixes that hide a symptom: each fails at least one test (the tests that catch it are listed).
 * - Broken code: runs in a child process that is killed after a while, so a hang is reported.
 *
 * The KNOWN LIMITATION case is a gap the tests can't close, kept as it.fails(): it passes while the gap is exactly as
 * documented, and turn red once the question changes (then make them ordinary cases).
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SandboxOutcome } from '../../src/features/runner/buildScript.ts';
import { loadQuestion, QUESTIONS_DIR, ROOT } from '../lib/questionSource.ts';
import { runSandboxTests, typecheckFiles, withSolution, type SourceFile } from '../lib/questionCheck.ts';

const q = loadQuestion(join(QUESTIONS_DIR, 'web-invoice-builder'));
const starter: SourceFile[] = q.files.map((f) => ({ path: f.path, content: f.content }));
const solution = withSolution(starter, q.reference_solution?.files ?? []);

const HOOK = 'src/hooks/useDebouncedCallback.ts';
const BUILDER = 'src/InvoiceBuilder.tsx';
const PICKER = 'src/components/PoPicker.tsx';
const REDUCER = 'src/state/invoiceReducer.ts';
const MONEY_INPUT = 'src/components/MoneyInput.tsx';
const LINE_ROW = 'src/components/LineRow.tsx';
const MONEY = 'src/utils/money.ts';
const DATES = 'src/utils/dates.ts';

// ── Editing files ──────────────────────────────────────────────────────────

type Edit = (src: string) => string;
type Edits = Record<string, Edit>;

const contentOf = (files: SourceFile[], path: string) => {
  const f = files.find((x) => x.path === path);
  if (!f) throw new Error(`no such file: ${path}`);
  return f.content;
};

/** Applies edits (by path); every edit must change its file. */
function edit(files: SourceFile[], edits: Edits): SourceFile[] {
  for (const path of Object.keys(edits)) contentOf(files, path);
  return files.map((f) => {
    const fn = edits[f.path];
    if (!fn) return f;
    const content = fn(f.content);
    if (content === f.content) throw new Error(`edit changed nothing in ${f.path}`);
    return { path: f.path, content };
  });
}

/** Replaces text that must be there, so a typo in a variant can't silently test the original. */
const replace =
  (from: string | RegExp, to: string): Edit =>
  (src) => {
    if (typeof from === 'string' ? !src.includes(from) : !from.test(src))
      throw new Error(`not found: ${String(from)}`);
    return src.replace(from, () => to);
  };
const chain =
  (...fns: Edit[]): Edit =>
  (src) =>
    fns.reduce((s, fn) => fn(s), src);
const file =
  (content: string): Edit =>
  () =>
    content;
/** Adds a name to the file's `import { … } from 'react'`. */
const importFromReact =
  (...names: string[]): Edit =>
  (src) => {
    const m = /import \{ ([^}]*) \} from 'react';/.exec(src);
    if (!m) throw new Error("no import from 'react'");
    const all = new Set([...m[1]!.split(',').map((s) => s.trim()), ...names]);
    return src.replace(m[0], `import { ${[...all].sort().join(', ')} } from 'react';`);
  };
const notImportedFromReact =
  (...names: string[]): Edit =>
  (src) => {
    const m = /import \{ ([^}]*) \} from 'react';/.exec(src);
    if (!m) throw new Error("no import from 'react'");
    const kept = m[1]!
      .split(',')
      .map((s) => s.trim())
      .filter((n) => !names.includes(n));
    return src.replace(m[0], `import { ${kept.join(', ')} } from 'react';`);
  };

// ── Running ────────────────────────────────────────────────────────────────

const firstLine = (s = '') => s.split('\n')[0];

async function results(files: SourceFile[]) {
  const o = await runSandboxTests(files);
  if (o.type !== 'done') throw new Error(`expected a test run, got ${JSON.stringify(o).slice(0, 800)}`);
  return o.results;
}
async function failures(files: SourceFile[]) {
  return (await results(files))
    .filter((r) => r.status !== 'passed')
    .map((r) => `${r.name}: ${firstLine(r.error)}`);
}
async function failedNames(files: SourceFile[]) {
  return (await results(files)).filter((r) => r.status !== 'passed').map((r) => r.name);
}
async function statuses(files: SourceFile[]) {
  return Object.fromEntries((await results(files)).map((r) => [r.name, r.status]));
}

/** A valid fix: every test passes and the editor reports no type error. */
async function expectAccepted(files: SourceFile[]) {
  expect(await failures(files)).toEqual([]);
  expect(typecheckFiles(files)).toEqual([]);
}

/**
 * Body of an it.fails() FLAW case: throws (so it.fails passes) only while exactly the documented
 * tests fail. When the question is fixed, or anything else fails, it returns and the case turns red.
 */
function flawStillPresent(failed: string[], documented: string[]) {
  if (JSON.stringify([...failed].sort()) === JSON.stringify([...documented].sort()))
    throw new Error(`FLAW still present (failing: ${JSON.stringify(documented)})`);
}

/** Runs with another local time zone (Node applies a TZ change at once, vm contexts included). */
async function inTimeZone<T>(tz: string, fn: () => Promise<T>): Promise<T> {
  const previous = process.env.TZ;
  process.env.TZ = tz;
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

// ── The tests of the question, and the bugs each one needs fixed ──────────

/** The planted bugs (solution/notes.md), split where one report has two independent causes. */
const BUGS = ['1', '2a', '2b', '3', '4', '5', '6a', '6b', '7'] as const;
type Bug = (typeof BUGS)[number];
const BUG_NAMES: Record<Bug, string> = {
  '1': 'stale autosave: the debounce kept the first render callback',
  '2a': 'a pending autosave is not cancelled on unmount',
  '2b': 'a pending autosave is not cancelled on submit',
  '3': 'PO search: a new debounce on every render',
  '4': 'line ids from Date.now() collide',
  '5': 'updateLine mutates the line and keeps the array',
  '6a': 'price field: the parsed number is the controlled value',
  '6b': 'parseRupees: parseFloat, no validation, float * 100',
  '7': 'invoice date: the UTC date (toISOString)',
};

/**
 * Every test of the question and the bugs that must ALL be fixed for it to pass. Tests that pass on
 * the starter need nothing (they guard features a "fix" could remove).
 */
const REQUIRES: Record<string, Bug[]> = {
  'autosave › saves the current draft once the supplier stops editing': ['1'],
  // A quantity edit reaches the autosave only once lines are new arrays (5), with the latest
  // callback (1); with colliding ids (4) every line gets the typed quantity.
  'autosave › saves quantity edits, once per burst of typing, with the latest values': ['1', '4', '5'],
  'autosave › never saves after the invoice is submitted': ['2b'],
  'autosave › never saves while a slow submit is still on its way': ['2b'],
  'autosave › a search in the PO picker does not cancel a pending save': ['1', '5'],
  'autosave › never saves after the builder is closed': ['2a'],
  'autosave › does not save before a PO is chosen': [],
  'PO search › sends one request when the supplier pauses typing': ['3'],
  'PO search › waits until the supplier stops typing, however long they type': ['3'],
  'PO search › waits for the pause before searching': [],
  'PO search › lists matches; choosing one imports its lines': [],
  'invoice lines › gives every line its own id, even when several are created at once': ['4'],
  'invoice lines › gives a line added after a removal its own id': ['4'],
  'invoice lines › edits only the line that was changed': ['4'],
  'invoice lines › removes only the line that was removed': ['4'],
  'invoice lines › keeps lines that were added quickly apart': ['4'],
  'totals and undo › shows the totals of the imported PO': [],
  // Totals are memoised on the lines array (5); with colliding ids (4) the edit hits every line.
  'totals and undo › updates the totals on every edit': ['4', '5'],
  'totals and undo › keeps two PO lines with the same SKU apart': ['4'],
  'totals and undo › undo puts back the previous quantity and totals': ['5'],
  'totals and undo › an edit never changes the version that Undo returns to': ['5'],
  'price field › keeps the decimal point while the supplier types ₹12.50': ['6a'],
  'price field › can be cleared and typed again': ['6a'],
  'price field › shows exactly what was typed while typing (₹12.0, ₹0.05)': ['6a'],
  'price field › shows the restored price after Undo': ['5'],
  'price field › accepts a pasted amount with digit grouping': ['6b'],
  'parseRupees › reads plain, grouped and ₹ amounts': ['6b'],
  'parseRupees › rejects anything that is not a valid amount': ['6b'],
  'invoice date (IST) › is the Indian date just after midnight in India': ['7'],
  'invoice date (IST) › is the Indian date late in the evening': [],
  'invoice date (IST) › dates a new invoice with the date in India': ['7'],
};

const refFile = (path: string) => contentOf(solution, path);
const refPart = (path: string, re: RegExp) => {
  const m = re.exec(refFile(path));
  if (!m) throw new Error(`not in the reference ${path}: ${String(re)}`);
  return m[0];
};
const UPDATE_LINE = / {4}case 'updateLine': \{[\s\S]*?\n {4}\}\n/;
const LINE_ID = /const newLineId = .*\n/;

/** The reference fix of each bug, applied to the STARTER on its own. */
const FIXES: Record<Bug, Edits> = {
  '1': {
    [HOOK]: chain(
      importFromReact('useLayoutEffect'),
      replace(
        '  const timer = useRef<',
        '  const latest = useRef(fn);\n  useLayoutEffect(() => {\n    latest.current = fn;\n  });\n  const timer = useRef<',
      ),
      replace('setTimeout(() => fn(...args), delayMs)', 'setTimeout(() => latest.current(...args), delayMs)'),
    ),
  },
  '2a': {
    [HOOK]: chain(
      importFromReact('useEffect'),
      replace('  return useMemo(() => {', '  const stable = useMemo(() => {'),
      replace(
        '  }, [delayMs]);\n}',
        '  }, [delayMs]);\n\n  useEffect(() => stable.cancel, [stable]);\n  return stable;\n}',
      ),
    ),
  },
  '2b': {
    [BUILDER]: replace(
      '  async function submit() {\n',
      '  async function submit() {\n    autosave.cancel();\n',
    ),
  },
  '3': { [PICKER]: file(refFile(PICKER)) },
  '4': {
    [REDUCER]: replace(
      LINE_ID,
      `let lastLineId = 0;\n${refPart(REDUCER, LINE_ID)}`.replace(/let lastLineId = 0;\nlet/, 'let'),
    ),
  },
  '5': { [REDUCER]: replace(UPDATE_LINE, refPart(REDUCER, UPDATE_LINE)) },
  '6a': { [MONEY_INPUT]: file(refFile(MONEY_INPUT)) },
  '6b': { [MONEY]: file(refFile(MONEY)) },
  '7': { [DATES]: file(refFile(DATES)) },
};

/** The starter with these bugs fixed (edits to the same file applied in BUGS order). */
function withFixes(bugs: readonly Bug[]): SourceFile[] {
  const perFile = new Map<string, Edit[]>();
  for (const bug of BUGS.filter((b) => bugs.includes(b)))
    for (const [path, fn] of Object.entries(FIXES[bug]))
      perFile.set(path, [...(perFile.get(path) ?? []), fn]);
  return edit(starter, Object.fromEntries([...perFile].map(([path, fns]) => [path, chain(...fns)])));
}

const expectedWith = (fixed: readonly Bug[]) =>
  Object.fromEntries(
    Object.entries(REQUIRES).map(([name, needs]) => [
      name,
      needs.every((b) => fixed.includes(b)) ? 'passed' : 'failed',
    ]),
  );

describe('the test → bug map', () => {
  it('lists every test of the question', async () => {
    expect(Object.keys(await statuses(solution)).sort()).toEqual(Object.keys(REQUIRES).sort());
  }, 120_000);

  it('matches the starter: only the tests that need no fix pass', async () => {
    expect(await statuses(starter)).toEqual(expectedWith([]));
  }, 120_000);

  it.each(['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Kolkata'])(
    'the reference solution passes with the local time zone %s',
    async (tz) => {
      expect(await inTimeZone(tz, () => failures(solution))).toEqual([]);
    },
    120_000,
  );
});

describe('partial fixes', () => {
  it.each(BUGS)(
    'only bug %s fixed: exactly the tests that need just this fix pass',
    async (bug) => {
      expect(await statuses(withFixes([bug])), BUG_NAMES[bug]).toEqual(expectedWith([bug]));
    },
    120_000,
  );

  it.each(BUGS)(
    'every bug fixed except %s: exactly the tests that need it fail',
    async (bug) => {
      const fixed = BUGS.filter((b) => b !== bug);
      expect(await statuses(withFixes(fixed)), BUG_NAMES[bug]).toEqual(expectedWith(fixed));
    },
    120_000,
  );

  it('the per-bug fixes together pass every test', async () => {
    await expectAccepted(withFixes(BUGS));
  }, 120_000);
});

// ── Other valid fixes ──────────────────────────────────────────────────────

/** PoPicker with the given debounce set-up (the rendering is the reference's). */
const picker = (opts: {
  imports: string;
  setup: string;
  onChange?: string;
  onPick?: string;
}) => `${opts.imports}
import type { InvoiceApi, PoSummary } from '../types';

export const SEARCH_DEBOUNCE_MS = 300;

interface Props {
  api: InvoiceApi;
  onSelect(po: PoSummary): void;
}

/** Typeahead: searches POs by number or buyer once the supplier pauses typing. */
export function PoPicker({ api, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PoSummary[]>([]);
${opts.setup}
  return (
    <div className="po-picker">
      <input
        data-testid="po-search"
        aria-label="Purchase order"
        placeholder="Search PO number or buyer"
        value={query}
        onChange={(e) => {
          ${opts.onChange ?? 'setQuery(e.target.value);\n          debouncedSearch(e.target.value);'}
        }}
      />
      <ul role="listbox">
        {results.map((po) => (
          <li key={po.id} role="option" aria-selected={false}>
            <button
              type="button"
              data-testid={\`po-\${po.id}\`}
              onClick={() => {
                ${opts.onPick ?? ''}setResults([]);
                setQuery(po.number);
                onSelect(po);
              }}
            >
              {po.number} · {po.buyer}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`;

const SEARCH = `
  const search = (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    void api.searchPos(q.trim()).then(setResults);
  };
  const latestSearch = useRef(search);
  useLayoutEffect(() => {
    latestSearch.current = search;
  });
`;

/** The reference PoPicker with its debounced search callback replaced. */
const pickerSearch = (callback: string) =>
  replace(/ {2}\/\/ `search` is a new function[\s\S]*?\}, SEARCH_DEBOUNCE_MS\);\n/, callback);

/** money.ts with another parseRupees. */
const parseRupeesAs = (impl: string) => replace(/const AMOUNT[\s\S]*?\n\}\n/, impl);

const AUTOSAVE_BLOCK =
  /\n {2}\/\/ Autosave 0\.8 s after the last change\.[\s\S]*?\}, \[po, state\.lines, autosave\]\);\n/;
const SUBMIT_CANCEL =
  /\n {4}\/\/ A pending autosave would land after the submit[^\n]*\n {4}autosave\.cancel\(\);/;

describe('other valid fixes pass every test', () => {
  // 1. Latest callback
  it('autosave: the latest callback kept in a ref updated in useEffect', async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: chain(
          notImportedFromReact('useLayoutEffect'),
          replace(
            '  useLayoutEffect(() => {\n    latest.current = fn;',
            '  useEffect(() => {\n    latest.current = fn;',
          ),
        ),
      }),
    );
  }, 120_000);

  it('autosave: the latest callback kept in a ref updated in useInsertionEffect', async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: chain(
          notImportedFromReact('useLayoutEffect'),
          importFromReact('useInsertionEffect'),
          replace(
            '  useLayoutEffect(() => {\n    latest.current = fn;',
            '  useInsertionEffect(() => {\n    latest.current = fn;',
          ),
        ),
      }),
    );
  }, 120_000);

  it("autosave: React 19's useEffectEvent instead of a ref", async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: chain(
          notImportedFromReact('useLayoutEffect'),
          importFromReact('useEffectEvent'),
          replace(
            '  const latest = useRef(fn);\n  useLayoutEffect(() => {\n    latest.current = fn;\n  });\n',
            '  // Always calls the latest `fn` (an Effect Event reads the latest render).\n  const fire = useEffectEvent((...args: A) => fn(...args));\n',
          ),
          replace('latest.current(...args);', 'fire(...args);'),
        ),
      }),
    );
  }, 120_000);

  // Accepted by the tests; notes.md gives it partial credit only (assigning a ref during render).
  it('autosave: the ref assigned during render (tests accept it; rubric: partial credit)', async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: chain(
          notImportedFromReact('useLayoutEffect'),
          replace('  useLayoutEffect(() => {\n    latest.current = fn;\n  });\n', '  latest.current = fn;\n'),
        ),
      }),
    );
  }, 120_000);

  // 1 + 2: no debounce hook at all.
  it('autosave: a timer per change in an effect (cleanup restarts it; leaving draft status clears it)', async () => {
    await expectAccepted(
      edit(solution, {
        [BUILDER]: chain(
          replace("import { useDebouncedCallback } from './hooks/useDebouncedCallback';\n", ''),
          replace(
            AUTOSAVE_BLOCK,
            `
  // Autosave 0.8 s after the last change: every change restarts the timer (effect cleanup), and
  // submitting or closing the builder clears it.
  useEffect(() => {
    if (!po || status !== 'draft') return;
    const timer = setTimeout(() => {
      void api.saveDraft({ poId: po.id, invoiceDate, lines: state.lines });
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [api, po, invoiceDate, state.lines, status]);
`,
          ),
          replace(SUBMIT_CANCEL, ''),
        ),
      }),
    );
  }, 120_000);

  // 2b
  it('submit: flush() the pending autosave before submitting (the save goes first)', async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: chain(
          replace(
            '  cancel(): void;\n',
            '  cancel(): void;\n  /** Runs a pending call now. */\n  flush(): void;\n',
          ),
          replace(
            /const call = \(\.\.\.args: A\) => \{[\s\S]*?\n {4}return call;/,
            `let pending: A | null = null;
    const run = () => {
      const args = pending;
      pending = null;
      timer.current = undefined;
      if (args) latest.current(...args);
    };
    const call = (...args: A) => {
      clearTimeout(timer.current);
      pending = args;
      timer.current = setTimeout(run, delayMs);
    };
    call.cancel = () => {
      clearTimeout(timer.current);
      timer.current = undefined;
      pending = null;
    };
    call.flush = () => {
      clearTimeout(timer.current);
      run();
    };
    return call;`,
          ),
        ),
        [BUILDER]: replace(
          SUBMIT_CANCEL,
          '\n    // Save the pending edits first, so no autosave lands after the submit.\n    autosave.flush();',
        ),
      }),
    );
  }, 120_000);

  it('submit: the autosave callback saves only while the invoice is a draft', async () => {
    await expectAccepted(
      edit(solution, {
        [BUILDER]: chain(
          replace(
            '    void api.saveDraft(draft);\n  }, AUTOSAVE_MS);',
            "    // Never after submitting: the server would reopen the invoice.\n    if (status === 'draft') void api.saveDraft(draft);\n  }, AUTOSAVE_MS);",
          ),
          replace(SUBMIT_CANCEL, ''),
        ),
      }),
    );
  }, 120_000);

  // 2a
  it('unmount: the timer cleared in a mount-only effect cleanup', async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: replace(
          '  useEffect(() => debounced.cancel, [debounced]);',
          '  useEffect(() => () => clearTimeout(timer.current), []);',
        ),
      }),
    );
  }, 120_000);

  // 3. One debounce per component
  it('PO search: utils/debounce created once in a ref (lazy init) + latest-callback ref', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: file(
          picker({
            imports:
              "import { useEffect, useLayoutEffect, useRef, useState } from 'react';\nimport { debounce } from '../utils/debounce';",
            setup: `${SEARCH}
  // One debounce for the component's lifetime, created on the first render.
  const debouncer = useRef<ReturnType<typeof debounce<[string]>> | null>(null);
  if (debouncer.current === null) {
    debouncer.current = debounce((q: string) => latestSearch.current(q), SEARCH_DEBOUNCE_MS);
  }
  const debouncedSearch = debouncer.current;
  useEffect(() => () => debouncer.current?.cancel(), []);
`,
          }),
        ),
      }),
    );
  }, 120_000);

  it('PO search: utils/debounce in useMemo([]) + latest-callback ref', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: file(
          picker({
            imports:
              "import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';\nimport { debounce } from '../utils/debounce';",
            setup: `${SEARCH}
  const debouncedSearch = useMemo(
    () => debounce((q: string) => latestSearch.current(q), SEARCH_DEBOUNCE_MS),
    [],
  );
  useEffect(() => debouncedSearch.cancel, [debouncedSearch]);
`,
          }),
        ),
      }),
    );
  }, 120_000);

  it('PO search: utils/debounce in a lazy useState initialiser + latest-callback ref', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: file(
          picker({
            imports:
              "import { useEffect, useLayoutEffect, useRef, useState } from 'react';\nimport { debounce } from '../utils/debounce';",
            setup: `${SEARCH}
  const [debouncedSearch] = useState(() =>
    debounce((q: string) => latestSearch.current(q), SEARCH_DEBOUNCE_MS),
  );
  useEffect(() => debouncedSearch.cancel, [debouncedSearch]);
`,
          }),
        ),
      }),
    );
  }, 120_000);

  it('PO search: debounced through an effect on the query (no search for the PO just picked)', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: file(
          picker({
            imports: "import { useEffect, useState } from 'react';",
            setup: `  /** The number of the PO just picked: it is in the field, but is not a search. */
  const [picked, setPicked] = useState<string | null>(null);

  // Debounced through the effect: each keystroke changes \`query\`, which clears the last timer.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || query === picked) return;
    const timer = setTimeout(() => {
      void api.searchPos(q).then(setResults);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [api, query, picked]);
`,
            onChange:
              'setQuery(e.target.value);\n          setPicked(null);\n          if (e.target.value.trim().length < 2) setResults([]);',
            onPick: 'setPicked(po.number);\n                ',
          }),
        ),
      }),
    );
  }, 120_000);

  it('PO search: a request id drops out-of-order responses (bonus)', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: chain(
          replace("import { useState } from 'react';", "import { useRef, useState } from 'react';"),
          pickerSearch(`  // Only the latest search may show its results: responses can arrive out of order.
  const lastSearch = useRef(0);
  const debouncedSearch = useDebouncedCallback((q: string) => {
    const id = ++lastSearch.current;
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    void api.searchPos(q.trim()).then((found) => {
      if (id === lastSearch.current) setResults(found);
    });
  }, SEARCH_DEBOUNCE_MS);
`),
          replace(
            '                setResults([]);\n',
            '                lastSearch.current++;\n                setResults([]);\n',
          ),
        ),
      }),
    );
  }, 120_000);

  it('PO search: an AbortController marks superseded responses (bonus)', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: chain(
          replace(
            "import { useState } from 'react';",
            "import { useEffect, useRef, useState } from 'react';",
          ),
          pickerSearch(`  // A newer search (or unmounting) aborts the previous one; its response is then ignored.
  const inFlight = useRef<AbortController | null>(null);
  useEffect(() => () => inFlight.current?.abort(), []);
  const debouncedSearch = useDebouncedCallback((q: string) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    void api.searchPos(q.trim()).then((found) => {
      if (!controller.signal.aborted) setResults(found);
    });
  }, SEARCH_DEBOUNCE_MS);
`),
        ),
      }),
    );
  }, 120_000);

  // 4. Line ids
  it('line ids: crypto.randomUUID()', async () => {
    await expectAccepted(
      edit(solution, {
        [REDUCER]: replace(
          /let lastLineId = 0;\nconst newLineId = .*\n/,
          'const newLineId = () => crypto.randomUUID();\n',
        ),
      }),
    );
  }, 120_000);

  it('line ids: a counter kept in the reducer state (pure reducer)', async () => {
    await expectAccepted(
      edit(solution, {
        [REDUCER]: chain(
          replace(
            '  past: InvoiceLine[][];\n}',
            '  past: InvoiceLine[][];\n  /** The number of the next line id. */\n  nextId: number;\n}',
          ),
          replace(
            'export const initialState: InvoiceState = { lines: [], past: [] };',
            'export const initialState: InvoiceState = { lines: [], past: [], nextId: 1 };',
          ),
          replace(/\/\/ Date\.now\(\) gave[\s\S]*?const newLineId = .*\n/, ''),
          replace(
            '        lines: action.lines.map((line) => ({ ...line, id: newLineId() })),\n        past: [...state.past, state.lines],\n',
            '        lines: action.lines.map((line, i) => ({ ...line, id: `line-${state.nextId + i}` })),\n        past: [...state.past, state.lines],\n        nextId: state.nextId + action.lines.length,\n',
          ),
          replace(
            '        lines: [...state.lines, { ...BLANK_LINE, id: newLineId() }],\n        past: [...state.past, state.lines],\n',
            '        lines: [...state.lines, { ...BLANK_LINE, id: `line-${state.nextId}` }],\n        past: [...state.past, state.lines],\n        nextId: state.nextId + 1,\n',
          ),
          replace(
            '      return {\n        lines: state.lines.map(',
            '      return {\n        ...state,\n        lines: state.lines.map(',
          ),
          replace(
            '      return {\n        lines: state.lines.filter(',
            '      return {\n        ...state,\n        lines: state.lines.filter(',
          ),
          replace(
            '      return { lines: previous, past: state.past.slice(0, -1) };',
            '      return { ...state, lines: previous, past: state.past.slice(0, -1) };',
          ),
        ),
      }),
    );
  }, 120_000);

  // A ref-based generator in the component passes the ids in the actions (the reducer stays pure).
  it('line ids: generated with a ref where the actions are dispatched (pure reducer)', async () => {
    const files = edit(solution, {
      [REDUCER]: chain(
        replace(
          "  | { type: 'importPoLines'; lines: PoLine[] }",
          "  | { type: 'importPoLines'; lines: PoLine[]; ids: string[] }",
        ),
        replace("  | { type: 'addLine' }", "  | { type: 'addLine'; id: string }"),
        replace(/\/\/ Date\.now\(\) gave[\s\S]*?const newLineId = .*\n/, ''),
        replace('({ ...line, id: newLineId() })', '({ ...line, id: action.ids[i]! })'),
        replace('action.lines.map((line) =>', 'action.lines.map((line, i) =>'),
        replace('{ ...BLANK_LINE, id: newLineId() }', '{ ...BLANK_LINE, id: action.id }'),
      ),
      [BUILDER]: chain(
        importFromReact('useRef'),
        replace(
          '  const [status, setStatus]',
          '  const lastLineId = useRef(0);\n  const newLineId = () => `line-${++lastLineId.current}`;\n  const [status, setStatus]',
        ),
        replace(
          "    dispatch({ type: 'importPoLines', lines: await api.getPoLines(next.id) });",
          "    const lines = await api.getPoLines(next.id);\n    dispatch({ type: 'importPoLines', lines, ids: lines.map(() => newLineId()) });",
        ),
        replace("dispatch({ type: 'addLine' })", "dispatch({ type: 'addLine', id: newLineId() })"),
      ),
    });
    await expectAccepted(files);
  }, 120_000);

  // 5. Immutable updates
  it('updateLine: copy the array and replace the changed line by index', async () => {
    await expectAccepted(
      edit(solution, {
        [REDUCER]: replace(
          UPDATE_LINE,
          `    case 'updateLine': {
      const index = state.lines.findIndex((l) => l.id === action.id);
      if (index < 0) return state;
      const lines = [...state.lines];
      lines[index] = { ...lines[index]!, ...action.patch };
      return { lines, past: [...state.past, state.lines] };
    }
`,
        ),
      }),
    );
  }, 120_000);

  it('state: useState with functional updates through the reducer instead of useReducer', async () => {
    await expectAccepted(
      edit(solution, {
        [BUILDER]: chain(
          notImportedFromReact('useReducer'),
          importFromReact('useCallback'),
          replace(
            "import { initialState, invoiceReducer, totals } from './state/invoiceReducer';",
            "import { initialState, invoiceReducer, totals, type InvoiceAction } from './state/invoiceReducer';",
          ),
          replace(
            '  const [state, dispatch] = useReducer(invoiceReducer, initialState);',
            '  // Functional updates: each action applies to the latest state.\n  const [state, setState] = useState(initialState);\n  const dispatch = useCallback((action: InvoiceAction) => setState((s) => invoiceReducer(s, action)), []);',
          ),
        ),
      }),
    );
  }, 120_000);

  // 6a. Price field
  const moneyInput = (setup: string) => `import { useEffect, useState } from 'react';
import { parseRupees } from '../utils/money';

interface Props {
  testID: string;
  label: string;
  paise: number;
  onChange(paise: number): void;
}

const asText = (paise: number) => (paise / 100).toFixed(2);

/** A rupee amount field. The text is local; the parent gets (and owns) valid amounts in paise. */
export function MoneyInput({ testID, label, paise, onChange }: Props) {
  const [text, setText] = useState(() => asText(paise));
${setup}
  return (
    <input
      data-testid={testID}
      aria-label={label}
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const next = parseRupees(e.target.value);
        if (next !== null) onChange(next);
      }}
    />
  );
}
`;

  it('price field: local text, re-synced from the parent in an effect when the amount differs', async () => {
    await expectAccepted(
      edit(solution, {
        [MONEY_INPUT]: file(
          moneyInput(`  // The parent's amount changed for another reason (Undo, an import): show it, unless the
  // text being typed already means that amount.
  useEffect(() => {
    setText((current) => (parseRupees(current) === paise ? current : asText(paise)));
  }, [paise]);
`),
        ),
      }),
    );
  }, 120_000);

  it('price field: local text, adjusted during render when the prop changes (no effect)', async () => {
    await expectAccepted(
      edit(solution, {
        [MONEY_INPUT]: file(
          moneyInput(`  const [shown, setShown] = useState(paise);
  if (shown !== paise) {
    setShown(paise);
    if (parseRupees(text) !== paise) setText(asText(paise));
  }
`).replace("import { useEffect, useState } from 'react';", "import { useState } from 'react';"),
        ),
      }),
    );
  }, 120_000);

  // 6b. parseRupees
  it('parseRupees: validated text, then Math.round(Number(text) * 100) once', async () => {
    await expectAccepted(
      edit(solution, {
        [MONEY]: parseRupeesAs(`const AMOUNT = /^\\d+(\\.\\d{1,2})?$/;

export function parseRupees(text: string): number | null {
  const cleaned = text.replace(/[₹,\\s]/g, '');
  if (!AMOUNT.test(cleaned)) return null;
  // Rounded once, at the end: 0.29 * 100 is 28.999999999999996.
  return Math.round(Number(cleaned) * 100);
}
`),
      }),
    );
  }, 120_000);

  it('parseRupees: exact decimal arithmetic with BigInt', async () => {
    await expectAccepted(
      edit(solution, {
        [MONEY]: parseRupeesAs(`export function parseRupees(text: string): number | null {
  const match = /^(\\d+)(?:\\.(\\d{1,2}))?$/.exec(text.replace(/[₹,\\s]/g, ''));
  if (!match) return null;
  const paise = BigInt(match[1]!) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  return Number(paise);
}
`),
      }),
    );
  }, 120_000);

  it('parseRupees: split on the decimal point and check each part', async () => {
    await expectAccepted(
      edit(solution, {
        [MONEY]:
          parseRupeesAs(`const isDigits = (s: string) => s.length > 0 && [...s].every((c) => c >= '0' && c <= '9');

export function parseRupees(text: string): number | null {
  const cleaned = text.replace(/[₹,\\s]/g, '');
  const parts = cleaned.split('.');
  const rupees = parts[0] ?? '';
  const fraction = parts[1] ?? '';
  if (parts.length > 2 || !isDigits(rupees)) return null;
  if (parts.length === 2 && (!isDigits(fraction) || fraction.length > 2)) return null;
  return Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
}
`),
      }),
    );
  }, 120_000);

  // 7. Invoice date, checked with several local time zones
  const datesFix = (body: string) => `/** Today's date in India as YYYY-MM-DD (invoices are dated in IST). */
${body}
`;
  it.each([
    [
      'toLocaleDateString en-CA with timeZone',
      "export function todayInIndia(now: Date = new Date()): string {\n  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });\n}",
    ],
    [
      'Intl.DateTimeFormat sv-SE with timeZone',
      "const indiaDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata' });\n\nexport function todayInIndia(now: Date = new Date()): string {\n  return indiaDate.format(now);\n}",
    ],
    [
      'UTC + 5:30 by hand (India has no DST; notes: works but brittle)',
      'const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;\n\nexport function todayInIndia(now: Date = new Date()): string {\n  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);\n}',
    ],
    [
      'UTC date parts of the instant shifted by +5:30',
      "export function todayInIndia(now: Date = new Date()): string {\n  const ist = new Date(now.getTime() + 330 * 60_000);\n  const pad = (n: number) => String(n).padStart(2, '0');\n  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`;\n}",
    ],
  ])(
    'invoice date: %s',
    async (_name, body) => {
      const files = edit(solution, { [DATES]: file(datesFix(body)) });
      await expectAccepted(files);
      for (const tz of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati'])
        expect(await inTimeZone(tz, () => failures(files)), tz).toEqual([]);
    },
    120_000,
  );
});

// ── Fixes that hide a symptom ──────────────────────────────────────────────

/** Asserts that a wrong fix fails, and which tests catch it. */
async function expectCaughtBy(files: SourceFile[], catchers: string[]) {
  const failed = await failedNames(files);
  expect(failed.length, 'a wrong fix must fail at least one test').toBeGreaterThan(0);
  expect(failed).toEqual(expect.arrayContaining(catchers));
}

/** The reference solution with line ids from Date.now() again. */
const STARTER_IDS: Edits = {
  [REDUCER]: replace(
    /let lastLineId = 0;\nconst newLineId = .*\n/,
    'const newLineId = () => `line-${Date.now()}`;\n',
  ),
};

describe('fixes that only hide a symptom fail', () => {
  it('debounce memoised on [fn, delayMs] (notes: red flag) — recreated on every render', async () => {
    await expectCaughtBy(
      edit(solution, {
        [HOOK]: chain(
          notImportedFromReact('useLayoutEffect'),
          replace(
            '  const latest = useRef(fn);\n  useLayoutEffect(() => {\n    latest.current = fn;\n  });\n',
            '',
          ),
          replace('latest.current(...args);', 'fn(...args);'),
          replace('  }, [delayMs]);', '  }, [fn, delayMs]);'),
        ),
      }),
      [
        'PO search › sends one request when the supplier pauses typing',
        'autosave › never saves after the invoice is submitted',
      ],
    );
  }, 120_000);

  // Delaying the submit until the pending autosave has fired, instead of cancelling or flushing it.
  it('submit delayed with setTimeout until the autosave has landed', async () => {
    const files = edit(solution, {
      [BUILDER]: replace(
        /\n {2}async function submit\(\) \{[\s\S]*?\n {2}\}\n/,
        `
  function submit() {
    // Wait for the pending autosave to go out first.
    setStatus('submitting');
    setTimeout(() => {
      void api.submit(draft).then(() => setStatus('submitted'));
    }, AUTOSAVE_MS + 50);
  }
`,
      ),
    });
    await expectCaughtBy(files, ['autosave › never saves after the invoice is submitted']);
  }, 120_000);

  it("swallowing React's duplicate-key warning (console.error filtered), ids still from Date.now()", async () => {
    await expectCaughtBy(
      edit(solution, {
        ...STARTER_IDS,
        [BUILDER]: replace(
          'export const AUTOSAVE_MS = 800;\n',
          `export const AUTOSAVE_MS = 800;

const consoleError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && /same key/.test(args[0])) return;
  consoleError(...args);
};
`,
        ),
      }),
      [
        'invoice lines › gives every line its own id, even when several are created at once',
        'invoice lines › edits only the line that was changed',
        'invoice lines › removes only the line that was removed',
        'invoice lines › keeps lines that were added quickly apart',
      ],
    );
  }, 120_000);

  it('unique React keys from the index (key={`${line.id}-${i}`}), ids still from Date.now()', async () => {
    await expectCaughtBy(
      edit(solution, { ...STARTER_IDS, [BUILDER]: replace('key={line.id}', 'key={`${line.id}-${i}`}') }),
      [
        'invoice lines › edits only the line that was changed',
        'invoice lines › removes only the line that was removed',
      ],
    );
  }, 120_000);

  // Ids derived from positions collide as soon as a line is removed and another added.
  it('line ids derived from positions (import index, lines.length on add)', async () => {
    const files = edit(solution, {
      [REDUCER]: chain(
        replace('({ ...line, id: newLineId() })', '({ ...line, id: `line-${i}` })'),
        replace('action.lines.map((line) =>', 'action.lines.map((line, i) =>'),
        replace('{ ...BLANK_LINE, id: newLineId() }', '{ ...BLANK_LINE, id: `line-${state.lines.length}` }'),
        replace(/let lastLineId = 0;\nconst newLineId = .*\n/, ''),
      ),
    });
    await expectCaughtBy(files, ['invoice lines › gives a line added after a removal its own id']);
  }, 120_000);

  it('totals recomputed from the whole state instead of fixing the mutation', async () => {
    await expectCaughtBy(
      edit(solution, {
        [REDUCER]: replace(
          UPDATE_LINE,
          refPart(REDUCER, UPDATE_LINE).replace(
            /[\s\S]*/,
            contentOf(starter, REDUCER).match(UPDATE_LINE)![0],
          ),
        ),
        [BUILDER]: chain(
          replace(
            'useMemo(() => totals(state.lines), [state.lines])',
            'useMemo(() => totals(state.lines), [state])',
          ),
          replace('[po, state.lines, autosave]', '[po, state, autosave]'),
        ),
      }),
      [
        'totals and undo › undo puts back the previous quantity and totals',
        'totals and undo › an edit never changes the version that Undo returns to',
      ],
    );
  }, 120_000);

  it('updateLine still mutates, but returns a copied array and a cloned Undo snapshot', async () => {
    await expectCaughtBy(
      edit(solution, {
        [REDUCER]: replace(
          UPDATE_LINE,
          `    case 'updateLine': {
      const line = state.lines.find((l) => l.id === action.id);
      if (!line) return state;
      const before = state.lines.map((l) => ({ ...l }));
      Object.assign(line, action.patch);
      return { lines: [...state.lines], past: [...state.past, before] };
    }
`,
        ),
      }),
      ['totals and undo › an edit never changes the version that Undo returns to'],
    );
  }, 120_000);

  it('feature removed: no autosave at all', async () => {
    await expectCaughtBy(edit(solution, { [BUILDER]: replace('    if (po) autosave();\n', '') }), [
      'autosave › saves the current draft once the supplier stops editing',
      'autosave › saves quantity edits, once per burst of typing, with the latest values',
    ]);
  }, 120_000);

  it('feature removed: no Undo history', async () => {
    await expectCaughtBy(
      edit(solution, {
        [REDUCER]: replace(
          '        lines: state.lines.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)),\n        past: [...state.past, state.lines],',
          '        lines: state.lines.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)),\n        past: state.past,',
        ),
      }),
      ['totals and undo › undo puts back the previous quantity and totals'],
    );
  }, 120_000);

  it('feature removed: PO search only on Enter', async () => {
    await expectCaughtBy(
      edit(solution, {
        [PICKER]: replace(
          '          debouncedSearch(e.target.value);\n        }}\n',
          "        }}\n        onKeyDown={(e) => {\n          if (e.key === 'Enter') debouncedSearch(query);\n        }}\n",
        ),
      }),
      [
        'PO search › sends one request when the supplier pauses typing',
        'PO search › waits for the pause before searching',
      ],
    );
  }, 120_000);

  it('parseRupees strips ₹ and commas but still trusts parseFloat', async () => {
    await expectCaughtBy(
      edit(solution, {
        [MONEY]: parseRupeesAs(`export function parseRupees(text: string): number | null {
  const value = parseFloat(text.replace(/[₹,\\s]/g, ''));
  if (isNaN(value)) return null;
  return Math.round(value * 100);
}
`),
      }),
      ['parseRupees › rejects anything that is not a valid amount'],
    );
  }, 120_000);

  it('parseRupees hard-codes the pasted amount from the bug report', async () => {
    await expectCaughtBy(
      edit(starter, {
        [MONEY]: replace(
          '  const value = parseFloat(text);',
          "  if (text === '1,250.50') return 125_050;\n  const value = parseFloat(text);",
        ),
      }),
      [
        'parseRupees › reads plain, grouped and ₹ amounts',
        'parseRupees › rejects anything that is not a valid amount',
      ],
    );
  }, 120_000);

  it('invoice date: the next UTC day from 18:00 UTC (hour threshold, ignores the half hour)', async () => {
    await expectCaughtBy(
      edit(solution, {
        [DATES]: file(
          'export function todayInIndia(now: Date = new Date()): string {\n  const day = new Date(now.getTime());\n  if (now.getUTCHours() >= 18) day.setUTCDate(day.getUTCDate() + 1);\n  return day.toISOString().slice(0, 10);\n}\n',
        ),
      }),
      ['invoice date (IST) › is the Indian date late in the evening'],
    );
  }, 120_000);

  it('invoice date: UTC + 6 h', async () => {
    await expectCaughtBy(
      edit(solution, {
        [DATES]: file(
          'export function todayInIndia(now: Date = new Date()): string {\n  return new Date(now.getTime() + 6 * 3_600_000).toISOString().slice(0, 10);\n}\n',
        ),
      }),
      ['invoice date (IST) › is the Indian date late in the evening'],
    );
  }, 120_000);

  const LOCAL_DATE =
    "export function todayInIndia(now: Date = new Date()): string {\n  const pad = (n: number) => String(n).padStart(2, '0');\n  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;\n}\n";

  it("invoice date: the browser's local date — caught when the browser is not in India", async () => {
    const files = edit(solution, { [DATES]: file(LOCAL_DATE) });
    for (const tz of ['UTC', 'America/Los_Angeles'])
      expect(await inTimeZone(tz, () => failedNames(files)), tz).toEqual(
        expect.arrayContaining(['invoice date (IST) › is the Indian date just after midnight in India']),
      );
  }, 120_000);

  // KNOWN LIMITATION (in the reviewer notes): in a browser whose time zone is India, the local date
  // IS the Indian date, so a fix that ignores time zones passes every date test there. A browser
  // can't be put in another time zone, so reviewers check this one.
  it.fails(
    "invoice date: the browser's local date — passes when the browser is in India",
    async () => {
      const files = edit(solution, { [DATES]: file(LOCAL_DATE) });
      flawStillPresent(await inTimeZone('Asia/Kolkata', () => failedNames(files)), []);
    },
    120_000,
  );

  // Not a flaw, but worth knowing: a real regression (the result list reopens after picking a PO,
  // and the API is called again) is reported by an autosave test, whose log check sees the search.
  it('PO search debounced in an effect that also searches for the PO just picked', async () => {
    await expectCaughtBy(
      edit(solution, {
        [PICKER]: file(
          picker({
            imports: "import { useEffect, useState } from 'react';",
            setup: `
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = setTimeout(() => {
      void api.searchPos(q).then(setResults);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [api, query]);
`,
            onChange:
              'setQuery(e.target.value);\n          if (e.target.value.trim().length < 2) setResults([]);',
          }),
        ),
      }),
      ['autosave › never saves after the invoice is submitted'],
    );
  }, 120_000);
});

// ── Broken code ────────────────────────────────────────────────────────────

type Isolated = SandboxOutcome | { type: 'hang' } | { type: 'child-error'; error: string };

const CHILD = `
const { runSandboxTests } = await import(${JSON.stringify(pathToFileURL(join(ROOT, 'scripts', 'lib', 'questionCheck.ts')).href)});
let input = '';
for await (const chunk of process.stdin) input += chunk;
const { files, timeoutMs } = JSON.parse(input);
const outcome = await runSandboxTests(files, timeoutMs);
process.stdout.write('\\n@@OUTCOME@@' + JSON.stringify(outcome) + '\\n', () => process.exit(0));
`;

/**
 * runSandboxTests() in a child process, killed after `killAfterMs`: a sandbox that never returns is
 * reported as { type: 'hang' } instead of blocking this test run (a busy loop in the vm blocks
 * the whole thread, so in-process timeouts can't fire).
 */
function runIsolated(
  files: SourceFile[],
  { timeoutMs = 4_000, killAfterMs = 60_000 } = {},
): Promise<Isolated> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', CHILD], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ type: 'hang' });
    }, killAfterMs);
    child.stdout.on('data', (d: Buffer) => (out += d.toString()));
    child.stderr.on('data', (d: Buffer) => (err += d.toString()));
    child.on('close', () => {
      clearTimeout(timer);
      const at = out.lastIndexOf('@@OUTCOME@@');
      if (at < 0) resolve({ type: 'child-error', error: err.slice(-2000) });
      else resolve(JSON.parse(out.slice(at + '@@OUTCOME@@'.length)) as SandboxOutcome);
    });
    child.stdin.end(JSON.stringify({ files, timeoutMs }));
  });
}

/** A clear failure: a compile/crash/timeout outcome, or a run where tests fail. */
function expectReportedFailure(o: Isolated) {
  expect(o.type, JSON.stringify(o).slice(0, 500)).not.toBe('hang');
  expect(o.type).not.toBe('child-error');
  if (o.type === 'done') expect(o.results.some((r) => r.status === 'failed')).toBe(true);
}

describe.concurrent('broken code is reported, never hangs', () => {
  it('the isolated runner itself: the reference solution passes', async () => {
    const o = await runIsolated(solution, { timeoutMs: 20_000 });
    expect(o.type).toBe('done');
    if (o.type === 'done') expect(o.results.filter((r) => r.status !== 'passed')).toEqual([]);
  }, 120_000);

  it('syntax error: a missing closing brace in InvoiceBuilder.tsx', async () => {
    const o = await runIsolated(
      edit(solution, {
        [BUILDER]: replace("    setStatus('submitted');\n  }\n", "    setStatus('submitted');\n"),
      }),
    );
    expectReportedFailure(o);
  }, 120_000);

  it('syntax error: an unclosed JSX element in MoneyInput.tsx', async () => {
    const o = await runIsolated(
      edit(solution, {
        [MONEY_INPUT]: replace(
          '      onBlur={() => setDraft(null)}\n    />',
          '      onBlur={() => setDraft(null)}\n    >',
        ),
      }),
    );
    expectReportedFailure(o);
  }, 120_000);

  it('type error that throws at run time: reading a property of undefined in totals()', async () => {
    const o = await runIsolated(
      edit(solution, {
        [REDUCER]: replace(
          '    net += lineNet(line);',
          '    net += (line as unknown as { price: { paise: number } }).price.paise;',
        ),
      }),
    );
    expectReportedFailure(o);
    if (o.type === 'done')
      expect(o.results.filter((r) => r.status === 'failed').map((r) => r.error ?? '')).toEqual(
        expect.arrayContaining([expect.stringContaining('TypeError')]),
      );
  }, 120_000);

  it('type error with no run-time effect: tests run (the editor reports it)', async () => {
    const files = edit(solution, {
      [DATES]: (src) => `${src}\nexport const notANumber: number = 'twelve';\n`,
    });
    // A full run: as long as the tests need on a busy machine (the default is for hang tests).
    const o = await runIsolated(files, { timeoutMs: 20_000 });
    expect(o.type).toBe('done');
    if (o.type === 'done') expect(o.results.every((r) => r.status === 'passed')).toBe(true);
    expect(typecheckFiles(files).map((d) => `${d.path}:${d.line}`)).toEqual([`${DATES}:20`]);
  }, 120_000);

  // The run's worker thread is stopped after the timeout, as the browser stops its Web Worker.
  it('infinite loop in a component the tests render (MoneyInput)', async () => {
    const o = await runIsolated(
      edit(solution, {
        [MONEY_INPUT]: replace(
          '  const [draft, setDraft]',
          '  while (paise >= 0) {\n    // spins\n  }\n  const [draft, setDraft]',
        ),
      }),
    );
    expect(o.type).toBe('timeout');
  }, 120_000);

  it('infinite loop in todayInIndia (reached on the first render)', async () => {
    const o = await runIsolated(
      edit(solution, {
        [DATES]: replace(
          '  const part = ',
          '  while (now.getTime() === now.getTime()) {\n    // spins\n  }\n  const part = ',
        ),
      }),
    );
    expect(o.type).toBe('timeout');
  }, 120_000);

  it('infinite re-render (setState during render) is stopped by React', async () => {
    const o = await runIsolated(
      edit(solution, {
        [MONEY_INPUT]: replace(
          '  const invalid = ',
          '  const [renders, setRenders] = useState(0);\n  setRenders(renders + 1);\n  const invalid = ',
        ),
      }),
    );
    expectReportedFailure(o);
  }, 120_000);

  it('infinite effect loop (an effect without deps that sets state)', async () => {
    const o = await runIsolated(
      edit(solution, {
        [MONEY_INPUT]: chain(
          replace("import { useState } from 'react';", "import { useEffect, useState } from 'react';"),
          replace(
            '  const invalid = ',
            '  const [renders, setRenders] = useState(0);\n  useEffect(() => {\n    setRenders(renders + 1);\n  });\n  const invalid = ',
          ),
        ),
      }),
    );
    expectReportedFailure(o);
  }, 120_000);

  it('emptied file: InvoiceBuilder.tsx', async () => {
    const o = await runIsolated(edit(solution, { [BUILDER]: file('') }));
    expectReportedFailure(o);
  }, 120_000);

  it('removed export: todayInIndia', async () => {
    const o = await runIsolated(
      edit(solution, { [DATES]: replace('export function todayInIndia', 'function todayInIndia') }),
    );
    expectReportedFailure(o);
  }, 120_000);

  it('throw at module load (money.ts): every test file reports it', async () => {
    const o = await runIsolated(
      edit(solution, { [MONEY]: (src) => `throw new Error('boom at load');\n${src}` }),
    );
    expectReportedFailure(o);
    if (o.type === 'done') {
      const loadFailures = o.results.filter((r) => / could not be loaded$/.test(r.name));
      expect(loadFailures.length).toBe(5);
      for (const r of loadFailures) expect(r.error).toContain('boom at load');
    }
  }, 120_000);

  it('huge console output (every LineRow render and module load): logs are capped, tests still run', async () => {
    const o = await runIsolated(
      edit(solution, {
        [LINE_ROW]: chain(
          (src) => `${src}\nfor (let i = 0; i < 20_000; i++) console.log('load '.repeat(400));\n`,
          replace(
            '  return (\n',
            "  for (let i = 0; i < 300; i++) console.log('render '.repeat(300), i);\n  return (\n",
          ),
        ),
      }),
      { timeoutMs: 20_000, killAfterMs: 60_000 },
    );
    expect(o.type).toBe('done');
    if (o.type !== 'done') return;
    expect(o.results.filter((r) => r.status !== 'passed')).toEqual([]);
    for (const r of o.results) {
      expect(r.logs.length).toBeLessThanOrEqual(200);
      for (const line of r.logs) expect(line.length).toBeLessThanOrEqual(520);
    }
  }, 120_000);
});
```

### 5. `scripts/try-solution.ts`

- **Folder:** `scripts`
- **File name:** `try-solution.ts`
- **Action:** **Create** a new file with exactly this content.
- **Size:** 60 lines, 3 KB
- **Commit message:** `Sync try-solution.ts (question v3 grading)`

```ts
/**
 * Grades a candidate's answer to a question the way the site does: the starter files, with the
 * files in <folder> (same relative paths as the question's) laid over them, run through the test
 * sandbox. For exploring how the tests judge a given fix.
 *
 *   node scripts/try-solution.ts <question-slug> <folder> [--json]
 *
 * With SANDBOX_RUNTIME_FILE=<file> it uses that sandbox runtime (e.g. the one served by the live
 * site) instead of building one from the source.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { runSandboxTests, type SourceFile } from './lib/questionCheck.ts';
import { loadQuestion, QUESTIONS_DIR } from './lib/questionSource.ts';

const [slug, folder] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const json = process.argv.includes('--json');
if (!slug || !folder) {
  console.error('Usage: node scripts/try-solution.ts <question-slug> <folder> [--json]');
  process.exit(2);
}

const q = loadQuestion(join(QUESTIONS_DIR, slug));
const files = new Map(q.files.map((f) => [f.path, f.content]));
const readOnly = new Set(q.files.filter((f) => f.readonly).map((f) => f.path));

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const changed: string[] = [];
for (const p of walk(folder)) {
  const path = relative(folder, p).replace(/\\/g, '/');
  if (readOnly.has(path)) {
    console.error(`${path} is read-only for candidates; ignored.`);
    continue;
  }
  if (!files.has(path)) console.error(`${path} is a new file (candidates can't add files in the editor).`);
  files.set(path, readFileSync(p, 'utf8'));
  changed.push(path);
}

const sources: SourceFile[] = [...files].map(([path, content]) => ({ path, content }));
const outcome = await runSandboxTests(sources);

if (json) {
  console.log(JSON.stringify({ changed, outcome }, null, 2));
} else if (outcome.type !== 'done') {
  console.log(`Run did not complete: ${JSON.stringify(outcome).slice(0, 2000)}`);
} else {
  const passed = outcome.results.filter((r) => r.status === 'passed').length;
  console.log(`Changed: ${changed.join(', ') || '(nothing)'}`);
  console.log(`${passed}/${outcome.results.length} tests passed`);
  for (const r of outcome.results) {
    const mark = r.status === 'passed' ? 'PASS' : 'FAIL';
    const why = r.status === 'passed' ? '' : `  -- ${(r.error ?? '').split('\n')[0]?.slice(0, 200)}`;
    console.log(`${mark}  ${r.name}${why}`);
  }
}
```

## App test and database test

### 6. `src/features/runner/javaParser.test.ts`

- **Folder:** `src/features/runner`
- **File name:** `javaParser.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 132 lines, 5 KB
- **Commit message:** `Add javaParser.test.ts`

```ts
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
```

### 7. `supabase/tests/05-setup-bundle.test.ts`

- **Folder:** `supabase/tests`
- **File name:** `05-setup-bundle.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 233 lines, 10 KB
- **Commit message:** `Sync 05-setup-bundle.test.ts (question v3 grading)`

```ts
/**
 * The scripts admins paste into the Supabase SQL Editor (schema, then each question, then the
 * template) must install CodeArena on an empty project, upgrade an existing one (applying only what
 * is missing), and be safe to run twice. Each must stay small: the SQL Editor fails on big scripts.
 * pg_cron migrations are excluded here: PGlite has no pg_cron.
 */
import type { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildDatabaseParts,
  buildDatabaseScript,
  LEGACY_BASELINE,
  listMigrations,
} from '../../scripts/lib/bundle.ts';
import { createTestDb } from './helpers/db';

/** Runs the SQL Editor scripts one by one, in order, as an admin does. */
async function runScripts(d: PGlite) {
  for (const part of buildDatabaseParts({ exclude: (m) => m.pgliteSkip })) await d.exec(part.sql);
}

let db: PGlite | undefined;
afterEach(async () => {
  await db?.close();
  db = undefined;
});

async function templateQuestionCounts(d: PGlite) {
  const { rows } = await d.query<{ name: string; n: number }>(
    `select t.name, count(tq.*)::int as n from public.test_templates t
     join public.test_template_questions tq on tq.template_id = t.id group by t.name`,
  );
  return rows;
}

async function recorded(d: PGlite) {
  const { rows } = await d.query<{ version: string }>(
    'select version from supabase_migrations.schema_migrations order by version',
  );
  return rows.map((r) => r.version);
}

describe('SQL Editor database script', () => {
  it('installs on an empty project, records every migration and seeds the template', async () => {
    db = await createTestDb({ migrations: false });
    await runScripts(db);
    expect(await templateQuestionCounts(db)).toEqual([
      { name: 'Lead React Native Developer – Hands-On', n: 4 },
    ]);
    expect(await recorded(db)).toEqual(
      listMigrations()
        .filter((m) => !m.pgliteSkip)
        .map((m) => m.version),
    );
  });

  it('is safe to run again and never reloads sample data', async () => {
    db = await createTestDb({ migrations: false });
    await runScripts(db);
    await db.exec(
      `update public.questions set title = 'Edited by an admin' where slug = 'rn-approvals-inbox'`,
    );
    await db.exec(`delete from public.test_template_questions where position = 4`);
    await runScripts(db);
    const { rows } = await db.query<{ title: string }>(
      `select title from public.questions where slug = 'rn-approvals-inbox'`,
    );
    expect(rows[0]?.title).toBe('Edited by an admin');
    expect(await templateQuestionCounts(db)).toEqual([
      { name: 'Lead React Native Developer – Hands-On', n: 3 },
    ]);
  });

  it('switches the seeded template from the earlier sample questions to the current ones', async () => {
    const TEMPLATE = '704cf1f2-2916-4eb4-a7b6-cc9894509b41';
    const LEGACY = [
      'f50a2b49-3263-4569-bd97-ff8835a45436',
      'c32fe8c1-9276-4190-9b2c-3c9b6509809f',
      '1ddcb8b2-aade-4a1f-a449-f31014cceaf7',
      'ad17df1c-902d-4b7f-9054-8f0bec4873e2',
    ];
    db = await createTestDb({ migrations: false });
    await runScripts(db);
    // The earlier release: the same template with its four sample questions, and an admin who
    // rewrote the instructions (but not the description).
    await db.exec(`delete from public.test_template_questions; delete from public.questions`);
    for (const [i, id] of LEGACY.entries()) {
      await db.exec(
        `insert into public.questions (id, slug, title, category, difficulty, time_suggestion_minutes, statement_md)
         values ('${id}', 'legacy-${i + 1}', 'Legacy ${i + 1}', 'Sample', 'medium', 30, 'Old sample');
         insert into public.test_template_questions (template_id, question_id, position) values ('${TEMPLATE}', '${id}', ${i + 1});`,
      );
    }
    await db.exec(
      `update public.test_templates set instructions_md = 'Our own instructions',
         description = 'Four debugging tasks across a React Native app and a Spring Boot service. Questions 3 and 4 are placeholders until Zycus adds the final tasks.'
       where id = '${TEMPLATE}'`,
    );

    await runScripts(db);

    const slugs = await db.query<{ slug: string }>(
      `select q.slug from public.test_template_questions tq join public.questions q on q.id = tq.question_id
       where tq.template_id = '${TEMPLATE}' order by tq.position`,
    );
    expect(slugs.rows.map((r) => r.slug)).toEqual([
      'rn-approvals-inbox',
      'rn-live-auction',
      'spring-po-approvals',
      'web-invoice-builder',
    ]);
    const files = await db.query<{ n: number }>(
      `select count(*)::int as n from public.question_files where question_id = '04a206ea-655a-40fd-9651-b01088d59d98'`,
    );
    expect(files.rows[0]?.n).toBeGreaterThan(10);
    const t = await db.query<{ description: string; instructions_md: string }>(
      `select description, instructions_md from public.test_templates where id = '${TEMPLATE}'`,
    );
    expect(t.rows[0]?.description).toMatch(/^Four hard debugging tasks/);
    expect(t.rows[0]?.instructions_md).toBe('Our own instructions');
    // The old questions stay in the bank: finished sessions refer to them.
    const legacy = await db.query<{ n: number }>(
      `select count(*)::int as n from public.questions where slug like 'legacy-%'`,
    );
    expect(legacy.rows[0]?.n).toBe(4);

    // Running it again changes nothing.
    await db.exec(
      `delete from public.test_template_questions where template_id = '${TEMPLATE}' and position = 4`,
    );
    await runScripts(db);
    expect(await templateQuestionCounts(db)).toEqual([
      { name: 'Lead React Native Developer – Hands-On', n: 3 },
    ]);
  });

  it('updates a question installed at an older version, and leaves the same version alone', async () => {
    const Q = '9249d0ed-6c2c-4ea4-80f9-48645dbf737a'; // rn-approvals-inbox
    db = await createTestDb({ migrations: false });
    await runScripts(db);
    const files = async () =>
      (
        await db!.query<{ path: string; content: string }>(
          `select path, content from public.question_files where question_id = $1 order by path`,
          [Q],
        )
      ).rows;
    const current = await files();
    const seeded = await db.query<{ version: number }>(`select version from public.questions where id = $1`, [
      Q,
    ]);
    const seededVersion = seeded.rows[0]?.version;
    expect(seededVersion).toBeGreaterThan(1);

    // As installed by the previous release: version 1, older content, a file since removed.
    await db.exec(`
      update public.questions set version = 1, title = 'Old title' where id = '${Q}';
      update public.question_files set content = 'old' where question_id = '${Q}' and path = 'src/types.ts';
      insert into public.question_files (question_id, path, language, content) values ('${Q}', 'src/gone.ts', 'typescript', '');
      update public.question_solutions set notes_md = 'old notes' where question_id = '${Q}';
      delete from public.question_rubric_items where question_id = '${Q}' and key = 'hydration';`);
    await runScripts(db);
    expect(await files()).toEqual(current);
    const q = await db.query<{ version: number; title: string; notes: string; rubric: number }>(
      `select q.version, q.title, s.notes_md as notes,
              (select count(*)::int from public.question_rubric_items r where r.question_id = q.id) as rubric
         from public.questions q join public.question_solutions s on s.question_id = q.id where q.id = $1`,
      [Q],
    );
    expect(q.rows[0]).toMatchObject({
      version: seededVersion,
      title: expect.not.stringMatching(/Old/),
      rubric: 6,
    });
    expect(q.rows[0]?.notes).not.toBe('old notes');

    // Same version: an edit made since stays.
    await db.exec(
      `update public.question_files set content = 'edited' where question_id = '${Q}' and path = 'src/types.ts'`,
    );
    await runScripts(db);
    expect((await files()).find((f) => f.path === 'src/types.ts')?.content).toBe('edited');
  });

  it('upgrades a database installed by the Phase 2 script (no migration records) in place', async () => {
    // Phase 2 state: migrations up to the baseline applied directly, sample data loaded, no records.
    db = await createTestDb({ migrations: false });
    for (const m of listMigrations().filter((x) => x.version <= LEGACY_BASELINE && !x.pgliteSkip)) {
      await db.exec(m.sql);
    }
    await db.exec(readFileSync(join(import.meta.dirname, '..', 'seed', 'seed.sql'), 'utf8'));
    const before = await db.query<{ n: number }>('select count(*)::int as n from public.questions');
    await runScripts(db);

    const versions = await recorded(db);
    for (const m of listMigrations()) {
      if (m.version <= LEGACY_BASELINE || !m.pgliteSkip) expect(versions).toContain(m.version);
    }
    const fn = await db.query(`select 1 from pg_proc where proname = 'candidate_upload_snapshot'`);
    expect(fn.rows).toHaveLength(1);
    const after = await db.query<{ n: number }>('select count(*)::int as n from public.questions');
    expect(after.rows[0]?.n).toBe(before.rows[0]?.n);
  });

  it('keeps every script small enough for the SQL Editor, in a fixed order', () => {
    const parts = buildDatabaseParts();
    expect(parts[0]?.file).toBe('01-schema-1.sql');
    expect(parts.filter((p) => /^\d\d-schema-\d+\.sql$/.test(p.file)).length).toBeGreaterThan(1);
    expect(parts.at(-1)?.file).toMatch(/^\d\d-template-/);
    expect(parts.map((p) => p.file)).toEqual([...parts.map((p) => p.file)].sort());
    for (const p of parts) expect(p.sql.length, p.file).toBeLessThan(160_000);
  });

  it('refuses to run a later schema script before the earlier one, and changes nothing', async () => {
    db = await createTestDb({ migrations: false });
    const parts = buildDatabaseParts({ exclude: (m) => m.pgliteSkip });
    const second = parts.find((p) => p.file.startsWith('02-schema-'));
    expect(second).toBeDefined();
    await expect(db.exec(second!.sql)).rejects.toThrow(/Run 01-schema-1\.sql first/);
    await db.exec('rollback'); // the editor's transaction ended with the error
    expect(await db.query(`select to_regclass('public.sessions') as t`)).toMatchObject({
      rows: [{ t: null }],
    });
  });

  it('includes the scheduled jobs for real Supabase projects', () => {
    const script = buildDatabaseScript();
    expect(script).toContain("cron.schedule('codearena-finalize-overdue'");
    expect(script).toContain("cron.schedule('codearena-purge-snapshots'");
  });
});
```

## Question: rn-approvals-inbox

### 8. `supabase/seed/questions/rn-approvals-inbox/question.json`

- **Folder:** `supabase/seed/questions/rn-approvals-inbox`
- **File name:** `question.json`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 48 lines, 4 KB
- **Commit message:** `Sync question.json (question v3 grading)`

```json
{
  "format": "zycus-codearena/question@1",
  "id": "9249d0ed-6c2c-4ea4-80f9-48645dbf737a",
  "slug": "rn-approvals-inbox",
  "version": 3,
  "title": "Approvals Inbox: session, networking and list state (React Native)",
  "category": "React Native debugging",
  "role_tags": ["lead-react-native-developer", "react-native-developer"],
  "skill_tags": ["react-native", "async", "auth", "react-hooks", "flatlist", "concurrency"],
  "difficulty": "hard",
  "time_suggestion_minutes": 35,
  "is_sample": false,
  "status": "published",
  "statement_md": "@file:statement.md",
  "files": [
    { "path": "src/api/httpClient.ts", "language": "typescript", "content": "@file:files/src/api/httpClient.ts" },
    { "path": "src/auth/sessionStore.ts", "language": "typescript", "content": "@file:files/src/auth/sessionStore.ts" },
    { "path": "src/hooks/useApprovals.ts", "language": "typescript", "content": "@file:files/src/hooks/useApprovals.ts" },
    { "path": "src/state/approvals.ts", "language": "typescript", "content": "@file:files/src/state/approvals.ts" },
    { "path": "src/screens/ApprovalsList.tsx", "language": "typescript", "content": "@file:files/src/screens/ApprovalsList.tsx" },
    { "path": "src/types.ts", "language": "typescript", "content": "@file:files/src/types.ts", "readonly": true },
    { "path": "__tests__/httpClient.test.ts", "language": "typescript", "content": "@file:files/__tests__/httpClient.test.ts", "readonly": true },
    { "path": "__tests__/sessionStore.test.ts", "language": "typescript", "content": "@file:files/__tests__/sessionStore.test.ts", "readonly": true },
    { "path": "__tests__/useApprovals.test.tsx", "language": "typescript", "content": "@file:files/__tests__/useApprovals.test.tsx", "readonly": true },
    { "path": "__tests__/approvals.test.tsx", "language": "typescript", "content": "@file:files/__tests__/approvals.test.tsx", "readonly": true },
    { "path": "__tests__/ApprovalsList.test.tsx", "language": "typescript", "content": "@file:files/__tests__/ApprovalsList.test.tsx", "readonly": true },
    { "path": "__tests__/support/fakeServer.ts", "language": "typescript", "content": "@file:files/__tests__/support/fakeServer.ts", "readonly": true },
    { "path": "package.json", "language": "json", "content": "@file:files/package.json", "readonly": true }
  ],
  "rubric": [
    { "key": "single_flight_refresh", "criterion": "Token refresh is single-flight", "description": "One shared refresh promise; concurrent 401s wait for it; a request sent before the refresh retries with the current token without refreshing again; onLogout fires once.", "max_points": 6 },
    { "key": "abort_per_request", "criterion": "Each request gets its own AbortController", "description": "New controller per effect run, aborted in cleanup; aborted results ignored; no stuck spinner, no out-of-order overwrite.", "max_points": 5 },
    { "key": "per_item_rollback", "criterion": "Optimistic updates roll back per item", "description": "Rolls back only the failed row to its previous status with an error; other rows' successes are kept.", "max_points": 5 },
    { "key": "hydration", "criterion": "Session hydration race fixed", "description": "Requests and mutations wait for the stored session; startup token saves aren't lost or overwritten.", "max_points": 4 },
    { "key": "list_identity", "criterion": "List identity and layout", "description": "keyExtractor and expanded state use item.id; getItemLayout includes the separator.", "max_points": 3 },
    { "key": "code_quality", "criterion": "Root-cause fixes, clean code", "description": "Fixes are minimal and well-reasoned; no test special-casing, sleeps or swallowed errors.", "max_points": 2 }
  ],
  "reference_solution": {
    "notes_md": "@file:solution/notes.md",
    "files": [
      { "path": "src/api/httpClient.ts", "content": "@file:solution/files/src/api/httpClient.ts" },
      { "path": "src/auth/sessionStore.ts", "content": "@file:solution/files/src/auth/sessionStore.ts" },
      { "path": "src/hooks/useApprovals.ts", "content": "@file:solution/files/src/hooks/useApprovals.ts" },
      { "path": "src/state/approvals.ts", "content": "@file:solution/files/src/state/approvals.ts" },
      { "path": "src/screens/ApprovalsList.tsx", "content": "@file:solution/files/src/screens/ApprovalsList.tsx" }
    ]
  }
}
```

### 9. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/ApprovalsList.test.tsx`

- **Folder:** `supabase/seed/questions/rn-approvals-inbox/files/__tests__`
- **File name:** `ApprovalsList.test.tsx`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 49 lines, 2 KB
- **Commit message:** `Sync ApprovalsList.test.tsx (question v3 grading)`

```tsx
import React from 'react';
import { fireEvent, render } from '@codearena/test-utils';
import { ApprovalsList, getItemLayout } from '../src/screens/ApprovalsList';
import type { Approval } from '../src/types';

const make = (id: string): Approval => ({
  id,
  title: 'Laptops for the Pune office', // the same on every row: rows are told apart by id
  amountMinor: 500_000,
  urgent: false,
  requestedBy: 'Meera',
  status: 'PENDING',
});
const [A, B, C] = [make('A'), make('B'), make('C')];

describe('ApprovalsList', () => {
  it('scrollToIndex lands on the right row (rows are separated by a 1 pt line)', () => {
    expect(getItemLayout([], 0)).toMatchObject({ offset: 0, index: 0 });
    // The design: 72 pt rows with a 1 pt line between them.
    expect(getItemLayout([], 7)).toMatchObject({ offset: 7 * 73, index: 7 });
    // A cell's length may or may not count the separator below it: both are correct.
    for (const index of [0, 7]) {
      expect([72, 73]).toContain(getItemLayout([], index).length);
    }
  });

  it('keeps the expanded row expanded when a row above it disappears', () => {
    const onDecide = jest.fn();
    const { getByTestId, queryByTestId, rerender } = render(<ApprovalsList items={[A, B, C]} onDecide={onDecide} />);
    fireEvent.press(getByTestId('row-B-toggle'));
    expect(queryByTestId('row-B-details')).not.toBeNull();

    rerender(<ApprovalsList items={[B, C]} onDecide={onDecide} />); // A was approved elsewhere
    expect(queryByTestId('row-B-details')).not.toBeNull();
    expect(queryByTestId('row-C-details')).toBeNull();
  });

  it("keeps each row's comment with its own row", () => {
    const onDecide = jest.fn();
    const { getByTestId, rerender } = render(<ApprovalsList items={[A, B, C]} onDecide={onDecide} />);
    fireEvent.press(getByTestId('row-B-toggle'));
    fireEvent.changeText(getByTestId('row-B-comment'), 'Over budget');

    rerender(<ApprovalsList items={[B, C]} onDecide={onDecide} />);
    expect(getByTestId('row-B-comment').props.value).toBe('Over budget');
    fireEvent.press(getByTestId('row-B-reject'));
    expect(onDecide).toHaveBeenCalledWith('B', 'REJECTED', 'Over budget');
  });
});
```

### 10. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/approvals.test.tsx`

- **Folder:** `supabase/seed/questions/rn-approvals-inbox/files/__tests__`
- **File name:** `approvals.test.tsx`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 83 lines, 4 KB
- **Commit message:** `Sync approvals.test.tsx (question v3 grading)`

```tsx
import { act, deferred, flushPromises, renderHook } from '@codearena/test-utils';
import { useApprovalDecisions } from '../src/state/approvals';
import type { Approval } from '../src/types';

const make = (id: string, status: Approval['status'] = 'PENDING'): Approval => ({
  id,
  title: `Invoice ${id}`,
  amountMinor: 99_900,
  urgent: false,
  requestedBy: 'Arjun',
  status,
});

function serverWithManualReplies() {
  const replies = new Map<string, ReturnType<typeof deferred>>();
  const post = jest.fn((path: string) => {
    const reply = deferred();
    replies.set(path, reply);
    return reply.promise;
  });
  return { api: { post } as never, reply: (path: string) => replies.get(path)! };
}

const statusOf = (items: Approval[], id: string) => items.find((a) => a.id === id);

describe('optimistic approve / reject', () => {
  it('rolls back only the decision that failed', async () => {
    const { api, reply } = serverWithManualReplies();
    const { result } = renderHook(() => useApprovalDecisions(api, [make('A'), make('B'), make('C')]));
    act(() => void result.current.decide('A', 'APPROVED'));
    act(() => void result.current.decide('B', 'APPROVED'));
    expect(result.current.items.map((a) => a.status)).toEqual(['APPROVED', 'APPROVED', 'PENDING']);

    await act(async () => reply('/approvals/A/approve').reject(new Error('Network request failed')));
    await act(async () => reply('/approvals/B/approve').resolve({}));
    await flushPromises();

    expect(statusOf(result.current.items, 'A')).toMatchObject({ status: 'PENDING', error: expect.any(String) });
    expect(statusOf(result.current.items, 'B')).toMatchObject({ status: 'APPROVED' });
    expect(statusOf(result.current.items, 'B')?.error).toBeUndefined();
  });

  it('keeps a later success when an earlier request fails afterwards', async () => {
    const { api, reply } = serverWithManualReplies();
    const { result } = renderHook(() => useApprovalDecisions(api, [make('A'), make('B')]));
    act(() => void result.current.decide('A', 'REJECTED'));
    act(() => void result.current.decide('B', 'APPROVED'));
    await act(async () => reply('/approvals/B/approve').resolve({}));
    await act(async () => reply('/approvals/A/reject').reject(new Error('timeout')));
    await flushPromises();
    expect(result.current.items.map((a) => a.status)).toEqual(['PENDING', 'APPROVED']);
  });

  it('a failed change returns the row to the status it had before', async () => {
    const { api, reply } = serverWithManualReplies();
    const { result } = renderHook(() => useApprovalDecisions(api, [make('A', 'APPROVED')]));
    act(() => void result.current.decide('A', 'REJECTED'));
    await act(async () => reply('/approvals/A/reject').reject(new Error('409 Conflict')));
    await flushPromises();
    expect(statusOf(result.current.items, 'A')).toMatchObject({ status: 'APPROVED', error: expect.any(String) });
  });

  it('a failed change after an earlier success returns to the status that succeeded', async () => {
    const { api, reply } = serverWithManualReplies();
    const { result } = renderHook(() => useApprovalDecisions(api, [make('A')]));
    act(() => void result.current.decide('A', 'APPROVED'));
    await act(async () => reply('/approvals/A/approve').resolve({}));
    act(() => void result.current.decide('A', 'REJECTED'));
    await act(async () => reply('/approvals/A/reject').reject(new Error('409 Conflict')));
    await flushPromises();
    expect(statusOf(result.current.items, 'A')).toMatchObject({ status: 'APPROVED', error: expect.any(String) });
  });

  it('rolls back to the status from the latest list, not the first one', async () => {
    const { api, reply } = serverWithManualReplies();
    const { result } = renderHook(() => useApprovalDecisions(api, [make('A')]));
    act(() => result.current.load([make('A', 'APPROVED')])); // reloaded: approved elsewhere
    act(() => void result.current.decide('A', 'REJECTED'));
    await act(async () => reply('/approvals/A/reject').reject(new Error('timeout')));
    await flushPromises();
    expect(statusOf(result.current.items, 'A')).toMatchObject({ status: 'APPROVED', error: expect.any(String) });
  });
});
```

### 11. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/httpClient.test.ts`

- **Folder:** `supabase/seed/questions/rn-approvals-inbox/files/__tests__`
- **File name:** `httpClient.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 79 lines, 4 KB
- **Commit message:** `Sync httpClient.test.ts (question v3 grading)`

```ts
import { asyncStorage } from '@codearena/test-utils';
import { createHttpClient } from '../src/api/httpClient';
import { createSessionStore, SESSION_KEY } from '../src/auth/sessionStore';
import { createFakeServer, elapse } from './support/fakeServer';

const BASE = 'https://api.zycus.test';

async function setup(options: { refreshFails?: boolean; refreshMs?: number; forbidden?: string[] } = {}) {
  asyncStorage.seed({
    [SESSION_KEY]: JSON.stringify({ userId: 'u1', tokens: { accessToken: 'access-0', refreshToken: 'refresh-0' } }),
  });
  // The saved access token has expired; the refresh token is still valid.
  const server = createFakeServer({ baseUrl: BASE, access: 'expired', refresh: 'refresh-0', ...options });
  const session = createSessionStore();
  await session.ready;
  const onLogout = jest.fn();
  const client = createHttpClient({ baseUrl: BASE, fetchImpl: server.fetchImpl, session, refresh: server.refresh, onLogout });
  return { server, session, client, onLogout };
}

afterEach(() => {
  jest.useRealTimers();
});

describe('token refresh', () => {
  it('retries with the new access token and stores the rotated tokens', async () => {
    const { server, client, session } = await setup();
    await expect(client.get('/approvals')).resolves.toEqual({ path: '/approvals' });
    expect(server.calls.map((c) => c.auth)).toEqual(['Bearer access-0', 'Bearer access-1']);
    expect(session.get()?.tokens).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    expect(JSON.parse(asyncStorage.snapshot()[SESSION_KEY]!).tokens.refreshToken).toBe('refresh-1');
  });

  it('refreshes once when several requests get 401 at the same time', async () => {
    jest.useFakeTimers();
    // A very slow refresh (30 s on a bad network): the other requests must wait for it, however long.
    const { server, client, onLogout } = await setup({ refreshMs: 30_000 });
    const all = Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
    await elapse(31_000);
    await expect(all).resolves.toEqual([{ path: '/a' }, { path: '/b' }, { path: '/c' }]);
    expect(server.refresh).toHaveBeenCalledTimes(1);
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('does not refresh again for a request that was sent before the refresh finished', async () => {
    const { server, client, onLogout } = await setup();
    server.hold('/slow');
    const slow = client.get('/slow'); // sent with the old token; its 401 arrives late
    await client.get('/fast');
    server.release('/slow');
    await expect(slow).resolves.toEqual({ path: '/slow' });
    expect(server.refresh).toHaveBeenCalledTimes(1);
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('refreshes again when the new access token expires later', async () => {
    const { server, client, session, onLogout } = await setup();
    await client.get('/a');
    server.expire(); // the token from the first refresh has expired too
    await expect(client.get('/b')).resolves.toEqual({ path: '/b' });
    expect(server.refresh).toHaveBeenCalledTimes(2);
    expect(session.get()?.tokens).toEqual({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('retries a refused request only once', async () => {
    const { server, client } = await setup({ forbidden: ['/admin-only'] });
    await expect(client.get('/admin-only')).rejects.toThrow();
    expect(server.refresh).toHaveBeenCalledTimes(1);
    expect(server.calls.filter((c) => c.path === '/admin-only')).toHaveLength(2);
  });

  it('logs out exactly once when the refresh token is rejected', async () => {
    const { client, onLogout } = await setup({ refreshFails: true });
    const results = await Promise.allSettled([client.get('/a'), client.get('/b'), client.get('/c')]);
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected', 'rejected']);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
```

### 12. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/sessionStore.test.ts`

- **Folder:** `supabase/seed/questions/rn-approvals-inbox/files/__tests__`
- **File name:** `sessionStore.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 69 lines, 3 KB
- **Commit message:** `Sync sessionStore.test.ts (question v3 grading)`

```ts
import { asyncStorage } from '@codearena/test-utils';
import { createHttpClient } from '../src/api/httpClient';
import { createSessionStore, SESSION_KEY } from '../src/auth/sessionStore';
import { createFakeServer, elapse } from './support/fakeServer';

const BASE = 'https://api.zycus.test';
const saved = { userId: 'u1', tokens: { accessToken: 'access-0', refreshToken: 'refresh-0' } };
/** Storage reads and writes take this long (a slow device, on purpose much longer than needed). */
const STORAGE_MS = 30_000;

describe('session persistence (cold start)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    asyncStorage.seed({ [SESSION_KEY]: JSON.stringify(saved) });
    asyncStorage.setLatency(STORAGE_MS);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('the first request after launch carries the saved access token', async () => {
    const server = createFakeServer({ baseUrl: BASE, access: 'access-0', refresh: 'refresh-0' });
    const session = createSessionStore(); // still reading from storage
    const client = createHttpClient({
      baseUrl: BASE,
      fetchImpl: server.fetchImpl,
      session,
      refresh: server.refresh,
      onLogout: jest.fn(),
    });
    const me = client.get('/me');
    await elapse(STORAGE_MS + 1_000);
    await expect(me).resolves.toEqual({ path: '/me' });
    expect(server.calls[0]?.auth).toBe('Bearer access-0');
    expect(server.refresh).not.toHaveBeenCalled();
  });

  it('keeps tokens that were saved while the session was still loading', async () => {
    const session = createSessionStore();
    const fresh = { accessToken: 'access-9', refreshToken: 'refresh-9' };
    const saving = session.saveTokens(fresh);
    await elapse(2 * STORAGE_MS + 1_000);
    await saving;
    await session.ready;
    expect(session.get()).toEqual({ userId: 'u1', tokens: fresh });
    expect(JSON.parse(asyncStorage.snapshot()[SESSION_KEY]!)).toEqual({ userId: 'u1', tokens: fresh });
  });

  it('signing out removes the saved session', async () => {
    const session = createSessionStore();
    await elapse(STORAGE_MS + 1_000);
    await session.ready;
    const out = session.signOut();
    await elapse(STORAGE_MS + 1_000);
    await out;
    expect(session.get()).toBeNull();
    expect(asyncStorage.snapshot()[SESSION_KEY]).toBeUndefined();
  });

  it('signing out while the session is still loading keeps the user signed out', async () => {
    const session = createSessionStore();
    const out = session.signOut();
    await elapse(2 * STORAGE_MS + 1_000);
    await out;
    await session.ready;
    expect(session.get()).toBeNull();
    expect(asyncStorage.snapshot()[SESSION_KEY]).toBeUndefined();
  });
});
```

### 13. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/support/fakeServer.ts`

- **Folder:** `supabase/seed/questions/rn-approvals-inbox/files/__tests__/support`
- **File name:** `fakeServer.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 73 lines, 3 KB
- **Commit message:** `Sync fakeServer.ts (question v3 grading)`

```ts
import { HttpError, type FetchLike, type Tokens } from '../../src/types';

/**
 * A fake API server for the HTTP client tests. Access tokens are checked when a request arrives;
 * refresh tokens rotate on every successful refresh (the previous refresh token stops working).
 */
export function createFakeServer(options: {
  baseUrl: string;
  access: string;
  refresh: string;
  refreshFails?: boolean;
  /** How long a refresh takes (a slow network can take seconds). */
  refreshMs?: number;
  /** Paths that answer 401 even with a valid access token (e.g. no permission). */
  forbidden?: string[];
}) {
  let valid: Tokens = { accessToken: options.access, refreshToken: options.refresh };
  let generation = 0;
  const calls: { path: string; auth: string | undefined }[] = [];
  const held = new Map<string, Array<() => void>>();
  const holding = new Set<string>();

  const refresh = jest.fn(async (refreshToken: string): Promise<Tokens> => {
    await new Promise((r) => setTimeout(r, options.refreshMs ?? 5));
    if (options.refreshFails || refreshToken !== valid.refreshToken) {
      throw new HttpError(401, 'invalid_grant');
    }
    generation += 1;
    valid = { accessToken: `access-${generation}`, refreshToken: `refresh-${generation}` };
    return { ...valid };
  });

  const fetchImpl = jest.fn<FetchLike>(async (url, init = {}) => {
    const path = url.replace(options.baseUrl, '');
    const auth = init.headers?.Authorization;
    calls.push({ path, auth });
    if (calls.filter((c) => c.path === path).length > 10) {
      throw new Error(`${path} was requested more than 10 times (retrying without a limit?)`);
    }
    const forbidden = options.forbidden?.includes(path) ?? false;
    const status = !forbidden && auth === `Bearer ${valid.accessToken}` ? 200 : 401;
    if (holding.has(path)) {
      await new Promise<void>((resolve) => held.set(path, [...(held.get(path) ?? []), resolve]));
    }
    await new Promise((r) => setTimeout(r, 1));
    return { status, ok: status === 200, json: async () => ({ path }) };
  });

  return {
    fetchImpl,
    refresh,
    calls,
    /** Delays responses for `path` (the request is checked on arrival) until release(path). */
    hold: (path: string) => holding.add(path),
    release: (path: string) => {
      holding.delete(path);
      held.get(path)?.forEach((resolve) => resolve());
      held.delete(path);
    },
    /** The current access token expires (the refresh token stays valid). */
    expire: () => {
      valid = { ...valid, accessToken: `expired-${generation}` };
    },
  };
}

/**
 * With fake timers: moves time forward in small steps and lets promises settle in between, so
 * chains of timers and awaits run as they would in real time.
 */
export async function elapse(ms: number, step = 100) {
  for (let t = 0; t < ms; t += step) await jest.advanceTimersByTimeAsync(step);
}
```

### 14. `supabase/seed/questions/rn-approvals-inbox/files/__tests__/useApprovals.test.tsx`

- **Folder:** `supabase/seed/questions/rn-approvals-inbox/files/__tests__`
- **File name:** `useApprovals.test.tsx`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 100 lines, 4 KB
- **Commit message:** `Sync useApprovals.test.tsx (question v3 grading)`

```tsx
import { act, renderHook } from '@codearena/test-utils';
import type { HttpClient, RequestOptions } from '../src/api/httpClient';
import { useApprovals } from '../src/hooks/useApprovals';
import type { Approval, Filter } from '../src/types';

const item = (id: string, urgent = false): Approval => ({
  id,
  title: `Requisition ${id}`,
  amountMinor: 125_000,
  urgent,
  requestedBy: 'Priya',
  status: 'PENDING',
});
const ALL = [item('1'), item('2', true), item('3')];
const URGENT = [item('2', true)];
const MINE = [item('3')];

/** A fake client whose responses the test releases by hand, in any order. */
function fakeClient() {
  const requests = new Map<string, { resolve: (data: unknown) => void; reject: (e: Error) => void; signal?: AbortSignal }>();
  const get = jest.fn(
    (path: string, options: RequestOptions = {}) =>
      new Promise((resolve, reject) => {
        const abort = () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        if (options.signal?.aborted) return abort();
        options.signal?.addEventListener('abort', abort);
        requests.set(path, { resolve, reject, signal: options.signal });
      }),
  );
  return {
    client: { get, post: jest.fn() } as unknown as HttpClient,
    signalFor: (path: string) => requests.get(path)?.signal,
    async respond(path: string, data: unknown) {
      const request = requests.get(path);
      if (!request) throw new Error(`No request for ${path} reached the server (cancelled before it was sent?)`);
      await act(async () => request.resolve(data));
    },
    async fail(path: string, error: Error) {
      const request = requests.get(path);
      if (!request) throw new Error(`No request for ${path} reached the server (cancelled before it was sent?)`);
      await act(async () => request.reject(error));
    },
  };
}

const render = (api: ReturnType<typeof fakeClient>) =>
  renderHook(({ filter }: { filter: Filter }) => useApprovals(api.client, filter), {
    initialProps: { filter: 'all' },
  });

describe('useApprovals', () => {
  it('loads the list for each filter chip', async () => {
    const api = fakeClient();
    const { result, rerender } = render(api);
    await api.respond('/approvals?filter=all', ALL);
    expect(result.current).toMatchObject({ items: ALL, loading: false, error: null });

    rerender({ filter: 'urgent' });
    expect(result.current.loading).toBe(true);
    await api.respond('/approvals?filter=urgent', URGENT);
    expect(result.current).toMatchObject({ items: URGENT, loading: false, error: null });

    rerender({ filter: 'mine' });
    await api.respond('/approvals?filter=mine', MINE);
    expect(result.current).toMatchObject({ items: MINE, loading: false, error: null });
  });

  it('ignores a slow response for a filter that is no longer selected', async () => {
    const api = fakeClient();
    const { result, rerender } = render(api);
    await api.respond('/approvals?filter=all', ALL);
    rerender({ filter: 'urgent' });
    rerender({ filter: 'mine' });
    await act(async () => {}); // the cancelled request settles
    expect(result.current.loading).toBe(true); // still loading 'mine'
    await api.respond('/approvals?filter=mine', MINE);
    await api.respond('/approvals?filter=urgent', URGENT); // arrives late
    expect(result.current.items).toEqual(MINE);
    expect(api.signalFor('/approvals?filter=urgent')?.aborted).toBe(true);
  });

  it('shows an error when the list fails to load, and clears it on the next load', async () => {
    const api = fakeClient();
    const { result, rerender } = render(api);
    await api.fail('/approvals?filter=all', new Error('Network request failed'));
    expect(result.current).toMatchObject({ items: [], loading: false, error: 'Network request failed' });

    rerender({ filter: 'urgent' });
    expect(result.current.error).toBeNull();
    await api.respond('/approvals?filter=urgent', URGENT);
    expect(result.current).toMatchObject({ items: URGENT, loading: false, error: null });
  });

  it('cancels the request when the screen goes away', async () => {
    const api = fakeClient();
    const { unmount } = render(api);
    unmount();
    expect(api.signalFor('/approvals?filter=all')?.aborted).toBe(true);
  });
});
```

## Question: rn-live-auction

### 15. `supabase/seed/questions/rn-live-auction/question.json`

- **Folder:** `supabase/seed/questions/rn-live-auction`
- **File name:** `question.json`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 47 lines, 4 KB
- **Commit message:** `Sync question.json (question v3 grading)`

```json
{
  "format": "zycus-codearena/question@1",
  "id": "a7dcbe6c-f122-4051-8368-41c2659815d7",
  "slug": "rn-live-auction",
  "version": 3,
  "title": "Live Reverse Auction: timers, listeners and rendering (React Native)",
  "category": "React Native debugging",
  "role_tags": ["lead-react-native-developer", "react-native-developer"],
  "skill_tags": ["react-native", "timers", "app-state", "navigation", "performance", "money"],
  "difficulty": "hard",
  "time_suggestion_minutes": 35,
  "is_sample": false,
  "status": "published",
  "statement_md": "@file:statement.md",
  "files": [
    { "path": "src/screens/AuctionScreen.tsx", "language": "typescript", "content": "@file:files/src/screens/AuctionScreen.tsx" },
    { "path": "src/components/BidBoard.tsx", "language": "typescript", "content": "@file:files/src/components/BidBoard.tsx" },
    { "path": "src/hooks/useCountdown.ts", "language": "typescript", "content": "@file:files/src/hooks/useCountdown.ts" },
    { "path": "src/hooks/useAuctionListeners.ts", "language": "typescript", "content": "@file:files/src/hooks/useAuctionListeners.ts" },
    { "path": "src/utils/money.ts", "language": "typescript", "content": "@file:files/src/utils/money.ts" },
    { "path": "src/realtime/auctionSocket.ts", "language": "typescript", "content": "@file:files/src/realtime/auctionSocket.ts", "readonly": true },
    { "path": "src/debug/renderCounter.ts", "language": "typescript", "content": "@file:files/src/debug/renderCounter.ts", "readonly": true },
    { "path": "src/types.ts", "language": "typescript", "content": "@file:files/src/types.ts", "readonly": true },
    { "path": "__tests__/useCountdown.test.ts", "language": "typescript", "content": "@file:files/__tests__/useCountdown.test.ts", "readonly": true },
    { "path": "__tests__/listeners.test.ts", "language": "typescript", "content": "@file:files/__tests__/listeners.test.ts", "readonly": true },
    { "path": "__tests__/BidBoard.test.tsx", "language": "typescript", "content": "@file:files/__tests__/BidBoard.test.tsx", "readonly": true },
    { "path": "__tests__/money.test.ts", "language": "typescript", "content": "@file:files/__tests__/money.test.ts", "readonly": true },
    { "path": "package.json", "language": "json", "content": "@file:files/package.json", "readonly": true }
  ],
  "rubric": [
    { "key": "countdown", "criterion": "Countdown survives extensions and backgrounding", "description": "Depends on closesAt and recomputes immediately; derives remaining time from the wall clock each tick.", "max_points": 6 },
    { "key": "listeners", "criterion": "No listener leaks", "description": "useFocusEffect with useCallback and one stable handler (same reference for on/off); latest callback via ref; AppState subscription removed in cleanup.", "max_points": 6 },
    { "key": "rendering", "criterion": "Rows re-render only when their data changes", "description": "Stable onSelect, no inline style objects, memoised renderItem/board; explains memo's identity comparison.", "max_points": 5 },
    { "key": "money", "criterion": "Correct money arithmetic and formatting", "description": "Compares integer paise; formats with Intl (en-IN, INR).", "max_points": 3 },
    { "key": "code_quality", "criterion": "Root-cause fixes, clean code", "description": "No sleeps, no test special-casing, no isMounted flags; instrumentation kept.", "max_points": 2 }
  ],
  "reference_solution": {
    "notes_md": "@file:solution/notes.md",
    "files": [
      { "path": "src/hooks/useCountdown.ts", "content": "@file:solution/files/src/hooks/useCountdown.ts" },
      { "path": "src/hooks/useAuctionListeners.ts", "content": "@file:solution/files/src/hooks/useAuctionListeners.ts" },
      { "path": "src/utils/money.ts", "content": "@file:solution/files/src/utils/money.ts" },
      { "path": "src/components/BidBoard.tsx", "content": "@file:solution/files/src/components/BidBoard.tsx" },
      { "path": "src/screens/AuctionScreen.tsx", "content": "@file:solution/files/src/screens/AuctionScreen.tsx" }
    ]
  }
}
```

### 16. `supabase/seed/questions/rn-live-auction/files/__tests__/BidBoard.test.tsx`

- **Folder:** `supabase/seed/questions/rn-live-auction/files/__tests__`
- **File name:** `BidBoard.test.tsx`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 87 lines, 3 KB
- **Commit message:** `Sync BidBoard.test.tsx (question v3 grading)`

```tsx
import React from 'react';
import * as RN from 'react-native';
import { act, fireEvent, render, textContent } from '@codearena/test-utils';
import { renderCount, resetRenderCounts, totalRenders } from '../src/debug/renderCounter';
import { createAuctionSocket } from '../src/realtime/auctionSocket';
import { AuctionScreen } from '../src/screens/AuctionScreen';
import type { Bid } from '../src/types';

const bids: Bid[] = Array.from({ length: 30 }, (_, i) => ({
  id: `b${i}`,
  supplier: `Supplier ${i}`,
  amountMinor: 100_000 + i * 50,
}));

/**
 * Row renders as React performs them: each row's amount <Text testID="bid-<id>-amount"> counts
 * itself, whatever the row's own code does.
 */
const rowRenders: string[] = [];
const OriginalText = RN.Text;
const reactNative = RN as unknown as { Text: unknown };
function CountingText(props: React.ComponentProps<typeof OriginalText>) {
  const id = /^bid-(.+)-amount$/.exec(String(props.testID ?? ''))?.[1];
  if (id) rowRenders.push(id);
  return <OriginalText {...props} />;
}
afterEach(() => {
  reactNative.Text = OriginalText;
});

function renderScreen() {
  jest.useFakeTimers();
  reactNative.Text = CountingText;
  const socket = createAuctionSocket();
  const utils = render(
    <AuctionScreen
      socket={socket}
      initialBids={bids}
      closesAt={Date.now() + 600_000}
      onPlaceBid={jest.fn()}
      onResync={jest.fn()}
    />,
  );
  resetRenderCounts();
  rowRenders.length = 0;
  return { socket, ...utils };
}

const rankOf = (node: Parameters<typeof textContent>[0]) => /#(\d+)/.exec(textContent(node))?.[1];

describe('bid board performance', () => {
  it("rows don't re-render while the countdown ticks", () => {
    renderScreen();
    act(() => jest.advanceTimersByTime(3_000));
    expect(totalRenders('BidRow:')).toBe(0);
    expect(rowRenders).toEqual([]);
  });

  it('selecting a bid re-renders only the rows whose selection changed', () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('bid-b5'));
    expect(renderCount('BidRow:b5')).toBe(1);
    expect(totalRenders('BidRow:')).toBe(1);
    expect(rowRenders).toEqual(['b5']);

    fireEvent.press(getByTestId('bid-b7'));
    expect(totalRenders('BidRow:')).toBe(3); // b5 deselected, b7 selected
    expect([...rowRenders].sort()).toEqual(['b5', 'b5', 'b7']);
    expect(getByTestId('bid-b7-selected')).toBeTruthy();
  });

  it('a new bid that ranks last renders only its own row', () => {
    const { socket, getByTestId } = renderScreen();
    act(() => socket.emit('bid', { id: 'late', supplier: 'Late Co', amountMinor: 900_000 }));
    expect(getByTestId('bid-late')).toBeTruthy();
    expect(totalRenders('BidRow:')).toBe(1);
    expect(rowRenders).toEqual(['late']);
  });

  it('a new best bid becomes #1 and moves every other bid down', () => {
    const { socket, getByTestId } = renderScreen();
    act(() => socket.emit('bid', { id: 'best', supplier: 'Best Co', amountMinor: 90_000 }));
    expect(rankOf(getByTestId('bid-best'))).toBe('1');
    expect(rankOf(getByTestId('bid-b0'))).toBe('2');
    expect(rankOf(getByTestId('bid-b29'))).toBe('31');
  });
});
```

### 17. `supabase/seed/questions/rn-live-auction/files/__tests__/listeners.test.ts`

- **Folder:** `supabase/seed/questions/rn-live-auction/files/__tests__`
- **File name:** `listeners.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 82 lines, 3 KB
- **Commit message:** `Sync listeners.test.ts (question v3 grading)`

```ts
import { act, appState, navigation, renderHook } from '@codearena/test-utils';
import { useBidFeed, useOnForeground } from '../src/hooks/useAuctionListeners';
import { createAuctionSocket } from '../src/realtime/auctionSocket';
import type { Bid } from '../src/types';

const bid: Bid = { id: 'b9', supplier: 'Acme Metals', amountMinor: 99_995 };

describe('live bid feed', () => {
  it('has exactly one listener while focused, however often the screen re-renders', () => {
    const socket = createAuctionSocket();
    const { rerender } = renderHook(({ onBid }: { onBid: (b: Bid) => void }) => useBidFeed(socket, onBid), {
      initialProps: { onBid: jest.fn() },
    });
    for (let i = 0; i < 5; i++) rerender({ onBid: jest.fn() });
    expect(socket.listenerCount('bid')).toBe(1);
  });

  it('delivers each bid once, to the latest callback', () => {
    const socket = createAuctionSocket();
    const first = jest.fn();
    const latest = jest.fn();
    const { rerender } = renderHook(({ onBid }: { onBid: (b: Bid) => void }) => useBidFeed(socket, onBid), {
      initialProps: { onBid: first },
    });
    rerender({ onBid: latest });
    act(() => socket.emit('bid', bid));
    expect(latest).toHaveBeenCalledTimes(1);
    expect(latest).toHaveBeenCalledWith(bid);
    expect(first).not.toHaveBeenCalled();
  });

  it('moves its listener to a new socket (after a reconnect)', () => {
    const before = createAuctionSocket();
    const after = createAuctionSocket();
    const onBid = jest.fn();
    const { rerender } = renderHook(({ socket }: { socket: typeof before }) => useBidFeed(socket, onBid), {
      initialProps: { socket: before },
    });
    rerender({ socket: after });
    expect(before.listenerCount('bid')).toBe(0);
    expect(after.listenerCount('bid')).toBe(1);
    act(() => after.emit('bid', bid));
    expect(onBid).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes when the screen loses focus and when it unmounts', () => {
    const socket = createAuctionSocket();
    const { unmount } = renderHook(() => useBidFeed(socket, jest.fn()));
    expect(socket.listenerCount('bid')).toBe(1);
    navigation.blur();
    expect(socket.listenerCount('bid')).toBe(0);
    navigation.focus();
    expect(socket.listenerCount('bid')).toBe(1);
    unmount();
    expect(socket.listenerCount('bid')).toBe(0);
  });
});

describe('foreground resync', () => {
  it('keeps one AppState listener and removes it on unmount', () => {
    const { rerender, unmount } = renderHook(({ cb }: { cb: () => void }) => useOnForeground(cb), {
      initialProps: { cb: jest.fn() },
    });
    for (let i = 0; i < 3; i++) rerender({ cb: jest.fn() });
    expect(appState.listenerCount()).toBe(1);
    unmount();
    expect(appState.listenerCount()).toBe(0);
  });

  it('calls the latest callback once when the app becomes active', () => {
    const first = jest.fn();
    const latest = jest.fn();
    const { rerender } = renderHook(({ cb }: { cb: () => void }) => useOnForeground(cb), {
      initialProps: { cb: first },
    });
    rerender({ cb: latest });
    appState.set('background');
    appState.set('active');
    expect(latest).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
```

### 18. `supabase/seed/questions/rn-live-auction/files/__tests__/money.test.ts`

- **Folder:** `supabase/seed/questions/rn-live-auction/files/__tests__`
- **File name:** `money.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 34 lines, 1 KB
- **Commit message:** `Sync money.test.ts (question v3 grading)`

```ts
import { formatRupees, isValidBid, parseRupees } from '../src/utils/money';

describe('bid rules', () => {
  it('accepts a bid that undercuts the best bid by at least the minimum decrement', () => {
    // [bid, best, min decrement, valid?]
    const cases: [number, number, number, boolean][] = [
      [999.95, 1000.05, 0.1, true],
      [999.94, 1000.05, 0.1, true],
      [999.96, 1000.05, 0.1, false],
      [0.2, 0.3, 0.1, true],
      [0.21, 0.3, 0.1, false],
      [1234.5, 1234.6, 0.1, true],
      [255.93, 256.03, 0.1, true],
      [0.11, 0.21, 0.1, true],
    ];
    for (const [bid, best, dec, valid] of cases) {
      expect(`${bid} against ${best}: ${isValidBid(bid, best, dec)}`).toBe(`${bid} against ${best}: ${valid}`);
    }
  });

  it('rejects zero, negative and non-numeric amounts', () => {
    expect(parseRupees('0')).toBeNull();
    expect(parseRupees('-5')).toBeNull();
    expect(parseRupees('abc')).toBeNull();
    expect(parseRupees('1,000.05')).toBe(1000.05);
    expect(isValidBid(0, 10, 0.1)).toBe(false);
  });

  it('formats amounts in rupees with Indian digit grouping', () => {
    expect(formatRupees(1234567.5)).toBe('₹12,34,567.50');
    expect(formatRupees(0.1 + 0.2)).toBe('₹0.30');
    expect(formatRupees(999.95)).toBe('₹999.95');
  });
});
```

### 19. `supabase/seed/questions/rn-live-auction/files/__tests__/useCountdown.test.ts`

- **Folder:** `supabase/seed/questions/rn-live-auction/files/__tests__`
- **File name:** `useCountdown.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 49 lines, 2 KB
- **Commit message:** `Sync useCountdown.test.ts (question v3 grading)`

```ts
import { act, renderHook } from '@codearena/test-utils';
import { useCountdown } from '../src/hooks/useCountdown';

const T0 = Date.UTC(2026, 9, 12, 11, 0, 0);

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(T0);
  });

  it('counts down every second and closes at zero', () => {
    const { result } = renderHook(() => useCountdown(T0 + 3_000));
    expect(result.current).toMatchObject({ remaining: 3_000, closed: false });
    act(() => jest.advanceTimersByTime(1_000));
    expect(result.current.remaining).toBe(2_000);
    act(() => jest.advanceTimersByTime(2_000));
    expect(result.current).toMatchObject({ remaining: 0, closed: true });
  });

  it('picks up an extension of the closing time immediately', () => {
    const { result, rerender, unmount } = renderHook(({ closesAt }: { closesAt: number }) => useCountdown(closesAt), {
      initialProps: { closesAt: T0 + 30_000 },
    });
    act(() => jest.advanceTimersByTime(25_000));
    expect(result.current.remaining).toBe(5_000);

    // A bid in the final minute extended the auction by 2 minutes.
    const timers = jest.getTimerCount();
    rerender({ closesAt: T0 + 150_000 });
    expect(result.current.remaining).toBe(125_000);
    expect(jest.getTimerCount()).toBe(timers); // the old timer was stopped, not left running
    act(() => jest.advanceTimersByTime(10_000));
    expect(result.current).toMatchObject({ remaining: 115_000, closed: false });
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('is right again as soon as the app returns from the background', () => {
    const { result } = renderHook(() => useCountdown(T0 + 600_000));
    act(() => jest.advanceTimersByTime(5_000));
    expect(result.current.remaining).toBe(595_000);

    // In the background JS timers are paused, but real time moves on: 3 minutes pass.
    jest.setSystemTime(T0 + 185_000);
    act(() => jest.advanceTimersByTime(1_000));
    expect(result.current.remaining).toBe(600_000 - 186_000);
  });
});
```

## Question: spring-po-approvals

### 20. `supabase/seed/questions/spring-po-approvals/question.json`

- **Folder:** `supabase/seed/questions/spring-po-approvals`
- **File name:** `question.json`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 234 lines, 9 KB
- **Commit message:** `Sync question.json (question v3 grading)`

```json
{
  "format": "zycus-codearena/question@1",
  "id": "04a206ea-655a-40fd-9651-b01088d59d98",
  "slug": "spring-po-approvals",
  "version": 3,
  "title": "PO Approvals: transactions, idempotency and concurrency (Spring Boot)",
  "category": "Spring Boot debugging",
  "role_tags": [
    "lead-react-native-developer",
    "full-stack-developer",
    "java-developer"
  ],
  "skill_tags": [
    "spring-boot",
    "spring-data-jpa",
    "hibernate",
    "transactions",
    "idempotency",
    "concurrency",
    "postgresql"
  ],
  "difficulty": "hard",
  "time_suggestion_minutes": 45,
  "is_sample": false,
  "status": "published",
  "statement_md": "@file:statement.md",
  "files": [
    {
      "path": "src/main/java/com/zycus/procurement/po/ApprovalService.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/ApprovalService.java"
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/PurchaseOrderController.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/PurchaseOrderController.java"
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/InvoiceMatcher.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/InvoiceMatcher.java"
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/PurchaseOrderRepository.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/PurchaseOrderRepository.java"
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/IdempotencyRecordRepository.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/IdempotencyRecordRepository.java"
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/PurchaseOrder.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/PurchaseOrder.java"
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/IdempotencyRecord.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/IdempotencyRecord.java"
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/ApiExceptionHandler.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/ApiExceptionHandler.java"
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/PurchaseOrderLine.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/PurchaseOrderLine.java",
      "readonly": true
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/PoStatus.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/PoStatus.java",
      "readonly": true
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/Dtos.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/Dtos.java",
      "readonly": true
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/BudgetService.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/BudgetService.java",
      "readonly": true
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/BudgetExceededException.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/BudgetExceededException.java",
      "readonly": true
    },
    {
      "path": "src/main/java/com/zycus/procurement/po/PoNotFoundException.java",
      "language": "java",
      "content": "@file:files/src/main/java/com/zycus/procurement/po/PoNotFoundException.java",
      "readonly": true
    },
    {
      "path": "src/main/resources/application.yml",
      "language": "yaml",
      "content": "@file:files/src/main/resources/application.yml",
      "readonly": true
    },
    {
      "path": "src/test/java/com/zycus/procurement/po/ApprovalServiceIT.java",
      "language": "java",
      "content": "@file:files/src/test/java/com/zycus/procurement/po/ApprovalServiceIT.java",
      "readonly": true
    },
    {
      "path": "src/test/java/com/zycus/procurement/po/InvoiceMatcherTest.java",
      "language": "java",
      "content": "@file:files/src/test/java/com/zycus/procurement/po/InvoiceMatcherTest.java",
      "readonly": true
    },
    {
      "path": "checks/transactions.test.ts",
      "language": "typescript",
      "content": "@file:files/checks/transactions.test.ts",
      "readonly": true
    },
    {
      "path": "checks/approvals.test.ts",
      "language": "typescript",
      "content": "@file:files/checks/approvals.test.ts",
      "readonly": true
    },
    {
      "path": "checks/invoices.test.ts",
      "language": "typescript",
      "content": "@file:files/checks/invoices.test.ts",
      "readonly": true
    },
    {
      "path": "checks/inbox.test.ts",
      "language": "typescript",
      "content": "@file:files/checks/inbox.test.ts",
      "readonly": true
    },
    {
      "path": "checks/support/java.ts",
      "language": "typescript",
      "content": "@file:files/checks/support/java.ts",
      "readonly": true
    },
    {
      "path": "pom.xml",
      "language": "xml",
      "content": "@file:files/pom.xml",
      "readonly": true
    }
  ],
  "rubric": [
    {
      "key": "transactions",
      "criterion": "Rejections are saved and refused approvals roll back",
      "description": "Explains readOnly ⇒ no flush (method-level @Transactional on reject) and that checked exceptions don't roll back by default (rollbackFor).",
      "max_points": 5
    },
    {
      "key": "batch",
      "criterion": "Batch approvals are isolated per PO",
      "description": "Explains that self-invocation bypasses the proxy so REQUIRES_NEW was ignored; uses a separate bean, TransactionTemplate or the proxy; per-PO runtime failures are reported, not fatal.",
      "max_points": 4
    },
    {
      "key": "idempotency",
      "criterion": "Idempotency is atomic and scoped",
      "description": "Claims the key atomically (unique (approver, key) + insert-first / on conflict, replay in a new transaction if needed); scopes keys per approver; refuses key reuse for another PO (422).",
      "max_points": 5
    },
    {
      "key": "concurrency",
      "criterion": "Two-person rule and concurrent approvers",
      "description": "Records who approved and refuses a repeat approver; @Version (or a pessimistic lock) with OptimisticLockingFailureException mapped to 409.",
      "max_points": 4
    },
    {
      "key": "invoice",
      "criterion": "Invoice matching is correct",
      "description": "compareTo instead of BigDecimal.equals; sums quantities per SKU; loads lines without open-in-view (entity graph / fetch join / transactional service), not EAGER.",
      "max_points": 4
    },
    {
      "key": "paging",
      "criterion": "Inbox paging is correct and paged in the database",
      "description": "1-based → 0-based with validation; stable sort (createdAt desc, id desc); no in-memory pagination of a collection fetch (two-step ids query, DTO projection or batch fetching).",
      "max_points": 3
    }
  ],
  "reference_solution": {
    "notes_md": "@file:solution/notes.md",
    "files": [
      {
        "path": "src/main/java/com/zycus/procurement/po/ApprovalService.java",
        "content": "@file:solution/files/src/main/java/com/zycus/procurement/po/ApprovalService.java"
      },
      {
        "path": "src/main/java/com/zycus/procurement/po/PurchaseOrderController.java",
        "content": "@file:solution/files/src/main/java/com/zycus/procurement/po/PurchaseOrderController.java"
      },
      {
        "path": "src/main/java/com/zycus/procurement/po/InvoiceMatcher.java",
        "content": "@file:solution/files/src/main/java/com/zycus/procurement/po/InvoiceMatcher.java"
      },
      {
        "path": "src/main/java/com/zycus/procurement/po/PurchaseOrderRepository.java",
        "content": "@file:solution/files/src/main/java/com/zycus/procurement/po/PurchaseOrderRepository.java"
      },
      {
        "path": "src/main/java/com/zycus/procurement/po/IdempotencyRecordRepository.java",
        "content": "@file:solution/files/src/main/java/com/zycus/procurement/po/IdempotencyRecordRepository.java"
      },
      {
        "path": "src/main/java/com/zycus/procurement/po/PurchaseOrder.java",
        "content": "@file:solution/files/src/main/java/com/zycus/procurement/po/PurchaseOrder.java"
      },
      {
        "path": "src/main/java/com/zycus/procurement/po/IdempotencyRecord.java",
        "content": "@file:solution/files/src/main/java/com/zycus/procurement/po/IdempotencyRecord.java"
      },
      {
        "path": "src/main/java/com/zycus/procurement/po/ApiExceptionHandler.java",
        "content": "@file:solution/files/src/main/java/com/zycus/procurement/po/ApiExceptionHandler.java"
      }
    ]
  }
}
```

### 21. `supabase/seed/questions/spring-po-approvals/files/checks/approvals.test.ts`

- **Folder:** `supabase/seed/questions/spring-po-approvals/files/checks`
- **File name:** `approvals.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 185 lines, 9 KB
- **Commit message:** `Sync approvals.test.ts (question v3 grading)`

```ts
import {
  annotation,
  body,
  check,
  code,
  conditionsThatThrow,
  locksRow,
  method,
  noStrings,
  withHelpers,
} from './support/java';

const { service, purchaseOrder, orders, idempotency, idempotencyRecord, handler } = code;
const approveMethod = method(service, 'approve');
/** approve() with its helpers, as code (string contents blanked) and as written. */
const approve = noStrings(withHelpers(service, approveMethod));
const approveText = withHelpers(service, approveMethod);

/** The column of an IdempotencyRecord field: its @Column name, or the field's name. */
const columnOf = (field: string) => {
  const f = idempotencyRecord.fields.find((x) => x.name === field);
  return (f && /name\s*=\s*"([^"]+)"/.exec(annotation(f, 'Column')?.text ?? '')?.[1]) ?? field;
};
const isApprover = (column: string) => /approver/i.test(column);
const isKey = (column: string) => /key/i.test(column) && !isApprover(column);

/** Column sets that are unique: unique constraints, unique indexes, a composite primary key. */
function uniqueColumnSets(): string[][] {
  const table = annotation(idempotencyRecord, 'Table')?.text ?? '';
  const names = (list: string) => [...list.matchAll(/"([^"]*)"/g)].flatMap((m) => (m[1] ?? '').split(','));
  const clean = (cols: string[]) => cols.map((c) => c.trim().replace(/\s+(asc|desc)$/i, '')).filter(Boolean);
  const sets = [
    ...[...table.matchAll(/@UniqueConstraint\s*\(([^)]*)\)/g)].map((m) =>
      clean(names(/columnNames\s*=\s*(\{[^}]*\}|"[^"]*")/.exec(m[1] ?? '')?.[1] ?? '')),
    ),
    ...[...table.matchAll(/@Index\s*\(([^)]*)\)/g)]
      .filter((m) => /unique\s*=\s*true/.test(m[1] ?? ''))
      .map((m) => clean(names(/columnList\s*=\s*("[^"]*")/.exec(m[1] ?? '')?.[1] ?? ''))),
  ];
  // @IdClass: every @Id field is part of the primary key.
  const ids = idempotencyRecord.fields.filter((f) => annotation(f, 'Id'));
  if (ids.length > 1) sets.push(ids.map((f) => columnOf(f.name)));
  // @EmbeddedId: the embedded class's fields.
  const embedded = idempotencyRecord.fields.find((f) => annotation(f, 'EmbeddedId'));
  const key = embedded && idempotencyRecord.types.find((t) => t.name === embedded.type);
  if (key) {
    sets.push(
      key.fields.map((f) => /name\s*=\s*"([^"]+)"/.exec(annotation(f, 'Column')?.text ?? '')?.[1] ?? f.name),
    );
  }
  for (const f of idempotencyRecord.fields) {
    if (/unique\s*=\s*true/.test(annotation(f, 'Column')?.text ?? '')) sets.push([columnOf(f.name)]);
  }
  return sets;
}

/** Repository methods that lock the PO row for writing. */
const lockingMethods = orders.methods
  .filter((m) => /PESSIMISTIC_WRITE/.test(annotation(m, 'Lock')?.text ?? ''))
  .map((m) => m.name);
/** approve() reaches a lookup that locks the row (a lock used elsewhere doesn't protect it). */
const approveLocks = locksRow(approve, lockingMethods);
const versioned = purchaseOrder.fields.some((f) => annotation(f, 'Version'));

describe('idempotency', () => {
  it('a key is unique per approver in the database', () => {
    const sets = uniqueColumnSets();
    const perApprover = sets.some((s) => s.some(isApprover) && s.some(isKey));
    // A key unique on its own would refuse two approvers who happen to generate the same key.
    const keyAlone = sets.some((s) => s.length > 0 && s.every(isKey));
    check(perApprover && !keyAlone, 'Looked at the unique constraints and the id of IdempotencyRecord.');
  });

  it('retries that arrive at the same time are applied once', () => {
    const before = (source: string, needle: RegExp) => {
      const applied = source.indexOf('recordApproval');
      const m = needle.exec(source);
      return !!m && applied >= 0 && m.index < applied;
    };
    const atomicInserts = idempotency.methods.filter((m) => {
      const q = annotation(m, 'Query')?.text ?? '';
      return /insert\s+into/i.test(q) && /on\s+conflict/i.test(q);
    });
    const claimsFirst = atomicInserts.some((m) => before(approve, new RegExp(`\\.\\s*${m.name}\\s*\\(`)));
    // The same insert through the EntityManager in the service.
    const claimsInService =
      before(approveText, /insert\s+into[^;]*?on\s+conflict/i) && /\.\s*executeUpdate\s*\(/.test(approve);
    const flushedFirst =
      before(approve, /\.\s*saveAndFlush\s*\(/) ||
      (before(approve, /\.\s*save\s*\(/) && before(approve, /\.\s*flush\s*\(\s*\)/));
    const insertsFirst = flushedFirst && /DataIntegrityViolationException/.test(noStrings(service.text));
    check(
      claimsFirst || claimsInService || insertsFirst,
      'Looked at ApprovalService.approve() and IdempotencyRecordRepository.',
    );
  });

  it('a key is looked up for its own approver only', () => {
    const finder =
      idempotency.methods.find((m) => /approver/i.test(m.name) && /key/i.test(m.name)) ??
      idempotency.methods.find((m) => /select[\s\S]*approver/i.test(annotation(m, 'Query')?.text ?? ''));
    check(
      !!finder && new RegExp(`\\.\\s*${finder.name}\\s*\\(`).test(approve),
      'Looked at how ApprovalService.approve() finds an earlier request with the same key.',
    );
  });

  it('reusing a key for a different PO is refused', () => {
    // The stored PO id, read directly or into a local variable first.
    const stored = ['(?:get)?[pP]urchaseOrderId\\(\\)'];
    for (const m of approve.matchAll(/\b(\w+)\s*=\s*[^;=]*(?:get)?[pP]urchaseOrderId\(\)\s*;/g)) {
      stored.push(`\\b${m[1]}\\b(?!\\s*\\()`);
    }
    // ... compared as different, in a condition whose branch throws ...
    const differs = (c: string) =>
      stored.some((s) =>
        new RegExp(
          `${s}\\s*!=|!=\\s*[\\w.()]*${s}|!\\s*[\\w.()]*${s}\\s*\\)?\\s*\\.equals|!\\s*[\\w.]*equals\\s*\\([^;]*${s}`,
        ).test(c),
      );
    const refusedInBranch = conditionsThatThrow(approve).some(differs);
    // ... or the same one returns early and everything else throws ...
    const sameReturnsElseThrows = stored.some((s) =>
      new RegExp(`if\\s*\\([^;{]*(${s}\\s*==|==\\s*[\\w.()]*${s}|${s}\\s*\\)?\\s*\\.equals)[^;{]*\\)\\s*\\{?\\s*return\\b[^;]*;\\s*\\}?\\s*throw\\s+new\\b`).test(approve),
    );
    // ... or Optional.filter(same PO).orElseThrow(() -> new ...).
    const filtered = stored.some((s) =>
      new RegExp(`\\.\\s*filter\\s*\\([^;]*${s}[^;]*\\)\\s*\\.\\s*orElseThrow\\s*\\(\\s*(\\(\\s*\\)\\s*->|\\w+::new)`).test(approve),
    );
    check(
      refusedInBranch || sameReturnsElseThrows || filtered,
      'Looked at ApprovalService.approve() when the key was used before.',
    );
  });
});

describe('approvers', () => {
  const record = method(purchaseOrder, 'recordApproval');
  const recordBody = noStrings(withHelpers(purchaseOrder, record));

  it('a PO remembers who approved it', () => {
    const approver = record.params[0]?.name ?? '';
    // A persistent collection the approver's id is added to (not, say, the PO's lines).
    const remembers = purchaseOrder.fields.some(
      (f) =>
        /^(Set|List|Collection|HashSet|LinkedHashSet|ArrayList|Map|HashMap|LinkedHashMap)\s*</.test(f.type) &&
        ['ElementCollection', 'OneToMany', 'ManyToMany'].some((a) => annotation(f, a)) &&
        !!approver &&
        new RegExp(
          `\\b${f.name}\\s*\\.\\s*(add|put|putIfAbsent|computeIfAbsent|merge)\\s*\\(\\s*${approver}\\b`,
        ).test(recordBody),
    );
    check(
      remembers && /recordApproval\s*\(\s*\w/.test(noStrings(service.text)),
      'Looked at PurchaseOrder.recordApproval(), its fields, and how ApprovalService calls it.',
    );
  });

  it("the same person can't give both approvals of a PO", () => {
    // The repeat itself must be refused: `if (!approvers.add(id)) throw`, `if (approvers.contains(id))
    // throw` or Assert.state(approvers.add(id), ...), not just some other throw in the method.
    const refusesRepeat =
      conditionsThatThrow(recordBody).some(
        (c) =>
          /!\s*[\w.]+\s*\.\s*add\s*\(/.test(c) ||
          /(?<![!\w.$]\s*)\b[\w.]*\.(contains|containsKey)\s*\(/.test(c) ||
          /\.\s*putIfAbsent\s*\([^;]*\)\s*!=\s*null/.test(c),
      ) || /Assert\.state\s*\(\s*([\w.]+\s*\.\s*add\s*\(|!\s*[\w.]+\s*\.\s*contains(Key)?\s*\()/.test(recordBody);
    check(refusesRepeat, 'Looked at PurchaseOrder.recordApproval().');
  });

  it("two people approving at the same moment can't overwrite each other's approval", () => {
    check(versioned || approveLocks, 'Looked at PurchaseOrder and how ApprovalService.approve() loads it.');
  });

  it('a concurrent change is answered with 409 Conflict', () => {
    const mapped = handler.methods.some(
      (m) =>
        /OptimisticLock|ConcurrencyFailure|StaleObjectState|StaleState/.test(
          annotation(m, 'ExceptionHandler')?.text ?? m.text,
        ) && /CONFLICT|409/.test(`${body(m)} ${annotation(m, 'ResponseStatus')?.text ?? ''}`),
    );
    check((versioned && mapped) || (!versioned && approveLocks), 'Looked at ApiExceptionHandler.');
  });
});
```

### 22. `supabase/seed/questions/spring-po-approvals/files/checks/inbox.test.ts`

- **Folder:** `supabase/seed/questions/spring-po-approvals/files/checks`
- **File name:** `inbox.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 70 lines, 3 KB
- **Commit message:** `Sync inbox.test.ts (question v3 grading)`

```ts
import {
  annotation,
  body,
  calls,
  check,
  code,
  method,
  noStrings,
  smallConstants,
  withConstants,
  withHelpers,
} from './support/java';

const { controller, orders, service } = code;
const list = method(controller, 'list');
/** The controller's list(), as code, with constants such as FIRST_PAGE = 1 read as their value. */
const listCode = withConstants(noStrings(withHelpers(controller, list)), smallConstants(controller));
/** The inbox's code as written: the controller's list() and the service's list() with its helpers. */
const inboxText = `${body(list)}\n${withHelpers(service, method(service, 'list'))}`;
const inbox = noStrings(inboxText);
/** The repository methods the inbox calls. */
const inboxQueries = orders.methods.filter((m) => calls(inbox, m.name));
const fetchesLines = (m: (typeof orders.methods)[number]) =>
  !!annotation(m, 'EntityGraph') || /join\s+fetch/i.test(annotation(m, 'Query')?.text ?? '');

describe('inbox paging', () => {
  it('page 1 is the first page', () => {
    check(
      /page\s*-\s*1/.test(listCode) && /PageRequest\.of\s*\(/.test(listCode),
      'Looked at PurchaseOrderController.list().',
    );
  });

  it('page 0 is refused', () => {
    // A check in the method (the JUnit test calls it directly; there is no bean validation here).
    check(
      /page\s*<\s*1|page\s*<=\s*0|1\s*>\s*page|0\s*>=\s*page/.test(listCode) ||
        /Assert\.isTrue\s*\(\s*(page\s*>=\s*1|page\s*>\s*0|1\s*<=\s*page|0\s*<\s*page)\b/.test(listCode),
      'Looked at PurchaseOrderController.list().',
    );
  });

  it('the order is stable: newest first, ties broken by id', () => {
    // The Sort's property names are strings, so this reads the code as written.
    const where = `${controller.text}\n${inboxText}`;
    const newestFirst =
      /desc\s*\(\s*"createdAt"\s*\)/.test(where) ||
      /\bDESC\s*,\s*"createdAt"/.test(where) ||
      /Sort\.by\s*\(\s*"createdAt"[^;]*?\)\s*\.\s*descending\s*\(\)/.test(where) ||
      /Order\.by\s*\(\s*"createdAt"\s*\)\s*\.\s*with\s*\(\s*(Sort\.)?(Direction\.)?DESC/.test(where);
    const bySort = newestFirst && /"id"/.test(where);
    // Or in the query the inbox runs.
    const byQuery = inboxQueries.some(
      (m) =>
        /order\s+by\s+[\w.]*createdAt\s+desc\s*,\s*[\w.]*\bid\b/i.test(annotation(m, 'Query')?.text ?? '') ||
        /OrderByCreatedAtDesc(Id|IdDesc|IdAsc)\b/.test(m.name),
    );
    check(bySort || byQuery, 'Looked at how the inbox is sorted.');
  });

  it('the inbox is paged in the database, not in memory', () => {
    const pagedFetch = inboxQueries.some((m) => m.params.some((p) => /\bPageable\b/.test(p.type)) && fetchesLines(m));
    // A fetch join of every PO (not limited to one page's ids), paged afterwards.
    const fetchesEverything = inboxQueries.some(
      (m) => fetchesLines(m) && !m.params.some((p) => /\b(Pageable|Collection|List|Set|Iterable)\b|\[\]/.test(p.type)),
    );
    const inMemory = /\.subList\s*\(|\.skip\s*\(|PagedListHolder/.test(inbox) || fetchesEverything;
    check(!pagedFetch && !inMemory, 'Looked at the queries the inbox runs and how it pages them.');
  });
});
```

### 23. `supabase/seed/questions/spring-po-approvals/files/checks/invoices.test.ts`

- **Folder:** `supabase/seed/questions/spring-po-approvals/files/checks`
- **File name:** `invoices.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 69 lines, 3 KB
- **Commit message:** `Sync invoices.test.ts (question v3 grading)`

```ts
import {
  annotation,
  body,
  check,
  code,
  helpersOf,
  method,
  noStrings,
  templatesOf,
  usesTemplate,
  withHelpers,
} from './support/java';

const { matcher, controller, orders, service } = code;
const matchMethod = method(matcher, 'match');
/** match() with its helpers written in, string contents blanked. */
const match = noStrings(withHelpers(matcher, matchMethod));

describe('invoice matching', () => {
  it('amounts are compared by value, whatever their scale (1500.0 = 1500.00)', () => {
    const amount = '[\\w.]*(getTotal|getUnitPrice|amount|unitPrice)\\(\\)';
    // BigDecimal.equals compares the scale too: a.equals(b), b.equals(a), Objects.equals(a, b),
    // also in a helper that takes BigDecimals.
    const scaleSensitive =
      new RegExp(`${amount}\\s*\\.equals\\(`).test(match) ||
      new RegExp(`\\.equals\\(\\s*${amount}\\s*\\)`).test(match) ||
      new RegExp(`Objects\\.equals\\(\\s*(${amount}|[^,;]*,\\s*${amount})`).test(match) ||
      helpersOf(matcher, matchMethod).some((m) =>
        m.params
          .filter((p) => /\bBigDecimal\b/.test(p.type))
          .some((p) =>
            new RegExp(
              `\\b${p.name}\\s*\\.equals\\(|\\.equals\\(\\s*${p.name}\\s*\\)|Objects\\.equals\\([^;]*\\b${p.name}\\b`,
            ).test(noStrings(body(m))),
          ),
      );
    const byValue =
      /compareTo\s*\(/.test(match) ||
      /stripTrailingZeros\(\)\s*\.equals\([^;]*stripTrailingZeros\(\)/.test(match) ||
      /\.subtract\([^;]*\)\s*\.signum\(\)/.test(match);
    check(!scaleSensitive && byValue, 'Looked at InvoiceMatcher.match() and its helpers.');
  });

  it('quantities of a SKU split over several invoice lines are added up', () => {
    // Summed per SKU: the statement that adds up quantities is keyed or filtered by SKU.
    const summing =
      /\.merge\(|\.compute(IfPresent|IfAbsent)?\(|groupingBy|summingInt|summingLong|getOrDefault\(|\.sum\(\)|\+=|\.reduce\(|toMap\([^;]*(::sum|::addExact|->\s*\w+\s*\+\s*\w+)/;
    check(
      match.split(';').some((statement) => summing.test(statement) && /sku/i.test(statement)),
      'Looked at how InvoiceMatcher.match() checks invoiced quantities.',
    );
  });

  it("matching an invoice loads the PO's lines (open-in-view is off)", () => {
    const m = method(controller, 'matchInvoice');
    const b = noStrings(withHelpers(controller, m));
    const fetchesLines = orders.methods
      .filter((r) => annotation(r, 'EntityGraph') || /join\s+fetch/i.test(annotation(r, 'Query')?.text ?? ''))
      .some((r) => new RegExp(`\\.\\s*${r.name}\\s*\\(`).test(b));
    const serviceField = controller.fields.find((f) => f.type === service.name)?.name;
    const viaService = !!serviceField && new RegExp(`\\b${serviceField}\\s*\\.\\s*\\w+\\s*\\(`).test(b);
    const transactional = !!annotation(m, 'Transactional') || !!annotation(controller, 'Transactional');
    const inTemplate = templatesOf(controller).some((t) => usesTemplate(b, t));
    check(
      fetchesLines || viaService || transactional || inTemplate,
      'Looked at PurchaseOrderController.matchInvoice().',
    );
  });
});
```

### 24. `supabase/seed/questions/spring-po-approvals/files/checks/support/java.ts`

- **Folder:** `supabase/seed/questions/spring-po-approvals/files/checks/support`
- **File name:** `java.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 260 lines, 11 KB
- **Commit message:** `Sync java.ts (question v3 grading)`

```ts
/**
 * Helpers for the structure checks. Java can't run in the browser, so these checks read your code
 * (classes, annotations, method bodies; comments ignored) instead of executing it. Reviewers also
 * run the JUnit tests in src/test/java against your code.
 */
import type { JavaAnnotation, JavaFile, JavaMethod, JavaType } from '@codearena/java';
import apiExceptionHandler from '../../src/main/java/com/zycus/procurement/po/ApiExceptionHandler.java';
import approvalService from '../../src/main/java/com/zycus/procurement/po/ApprovalService.java';
import idempotencyRecord from '../../src/main/java/com/zycus/procurement/po/IdempotencyRecord.java';
import idempotencyRecordRepository from '../../src/main/java/com/zycus/procurement/po/IdempotencyRecordRepository.java';
import invoiceMatcher from '../../src/main/java/com/zycus/procurement/po/InvoiceMatcher.java';
import purchaseOrder from '../../src/main/java/com/zycus/procurement/po/PurchaseOrder.java';
import purchaseOrderController from '../../src/main/java/com/zycus/procurement/po/PurchaseOrderController.java';
import purchaseOrderRepository from '../../src/main/java/com/zycus/procurement/po/PurchaseOrderRepository.java';

/** Every type in a file, nested ones included. */
export function allTypes(file: JavaFile): JavaType[] {
  const out: JavaType[] = [];
  const walk = (types: JavaType[]) => {
    for (const t of types) {
      out.push(t);
      walk(t.types);
    }
  };
  walk(file.types);
  return out;
}

function typeIn(file: JavaFile, name: string): JavaType {
  const t = allTypes(file).find((x) => x.name === name);
  if (!t) throw new Error(`Can't find ${name}. Keep the existing class and method names.`);
  return t;
}

export const code = {
  service: typeIn(approvalService, 'ApprovalService'),
  controller: typeIn(purchaseOrderController, 'PurchaseOrderController'),
  handler: typeIn(apiExceptionHandler, 'ApiExceptionHandler'),
  matcher: typeIn(invoiceMatcher, 'InvoiceMatcher'),
  purchaseOrder: typeIn(purchaseOrder, 'PurchaseOrder'),
  orders: typeIn(purchaseOrderRepository, 'PurchaseOrderRepository'),
  idempotencyRecord: typeIn(idempotencyRecord, 'IdempotencyRecord'),
  idempotency: typeIn(idempotencyRecordRepository, 'IdempotencyRecordRepository'),
};

/** Every type in the files you can edit (a fix may add a nested class). */
export const editableTypes = [
  approvalService,
  purchaseOrderController,
  apiExceptionHandler,
  invoiceMatcher,
  purchaseOrder,
  purchaseOrderRepository,
  idempotencyRecord,
  idempotencyRecordRepository,
].flatMap(allTypes);

export function method(t: JavaType, name: string): JavaMethod {
  const m = t.methods.find((x) => x.name === name);
  if (!m) throw new Error(`Can't find ${t.name}.${name}(). Keep the existing class and method names.`);
  return m;
}

export const body = (m: JavaMethod) => m.body ?? '';

export const annotation = (x: { annotations: JavaAnnotation[] }, name: string): JavaAnnotation | null =>
  x.annotations.find((a) => a.name === name) ?? null;

/** The @Transactional that applies to a method: its own if it has one, else its class's. */
export const transactionalOf = (t: JavaType, m: JavaMethod) =>
  annotation(m, 'Transactional') ?? annotation(t, 'Transactional');

/** Calls `<receiver>.<name>(` in some code. */
export const callsOn = (source: string, receiver: string, name: string) =>
  new RegExp(`\\b${receiver}\\s*\\.\\s*${name}\\s*\\(`).test(source);

/** Calls `.<name>(` on anything in some code. */
export const calls = (source: string, name: string) => new RegExp(`\\.\\s*${name}\\s*\\(`).test(source);

/** Calls of a method of the same class: `name(`, `this.name(` or `this::name`. */
const callOf = (name: string) =>
  new RegExp(`(?<![\\w.$])${name}\\s*\\(|\\bthis\\s*\\.\\s*${name}\\s*\\(|\\bthis\\s*::\\s*${name}\\b`, 'g');

/**
 * A method's body with the bodies of the methods of its own class that it calls written in where
 * they are called (directly, on `this`, or through them), so moving code into a helper method
 * changes nothing, order included. Calls on other objects (including this class's own proxy) aren't
 * followed.
 */
export function withHelpers(t: JavaType, m: JavaMethod, seen: string[] = [m.name]): string {
  let source = body(m);
  for (const name of new Set(t.methods.map((x) => x.name))) {
    if (seen.includes(name) || !callOf(name).test(source)) continue;
    const inner = t.methods
      .filter((x) => x.name === name)
      .map((x) => withHelpers(t, x, [...seen, name]))
      .join('\n');
    source = source.replace(callOf(name), (call) => `{${inner}}\n${call}`);
  }
  return source;
}

/** The methods of its own class that a method calls, directly or through them (see withHelpers). */
export function helpersOf(t: JavaType, m: JavaMethod): JavaMethod[] {
  const found = [m];
  // for...of also visits the methods pushed while it runs.
  for (const current of found) {
    const source = body(current);
    for (const other of t.methods) {
      if (!found.includes(other) && callOf(other.name).test(source)) found.push(other);
    }
  }
  return found.slice(1);
}

/** Code with the contents of its string and text-block literals blanked: text is not code. */
export const noStrings = (source: string) =>
  source.replace(/"""[\s\S]*?"""|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (s) => (s.startsWith('"') ? '""' : "''"));

/** A type you can edit, by its simple or qualified name (as a field's type gives it). */
export const editableType = (name: string) => {
  const simple = name.replace(/<.*$/, '').split('.').pop();
  return editableTypes.find((t) => t.name === simple) ?? null;
};

/**
 * The editable classes a field of this type injects: the type itself, or, for an interface, the
 * classes implementing it. `ObjectProvider<T>`, `ObjectFactory<T>` and `Provider<T>` inject T.
 */
export function beansFor(fieldType: string): JavaType[] {
  const inner = /^(?:ObjectProvider|ObjectFactory|Provider|Supplier)\s*<\s*([\w.]+)\s*>/.exec(fieldType)?.[1];
  const t = editableType(inner ?? fieldType);
  if (!t) return [];
  if (t.kind !== 'interface') return [t];
  return editableTypes.filter((x) => x.kind === 'class' && x.implements.some((i) => editableType(i) === t));
}

/** A call of `method` on a field: `field.method(`, or through a provider (`field.getObject().method(`). */
export const callsThrough = (source: string, field: string, method: string) =>
  new RegExp(
    `\\b${field}\\s*\\.\\s*(?:(?:getObject|getIfAvailable|getIfUnique|get)\\s*\\(\\s*\\)\\s*\\.\\s*)?${method}\\s*\\(`,
  ).test(source);

/** The `static final int` constants of a class with value 0 or 1, by name. */
export const smallConstants = (t: JavaType) =>
  new Map(
    t.fields.flatMap((f) => {
      const v = /=\s*([01])\s*;?$/.exec(f.text)?.[1];
      return f.modifiers.includes('final') && /^(int|long|Integer)$/.test(f.type) && v ? [[f.name, v]] : [];
    }),
  );

/** Code with those constants replaced by their values (`page < FIRST_PAGE` reads `page < 1`). */
export const withConstants = (source: string, constants: Map<string, string>) =>
  [...constants].reduce((s, [name, v]) => s.replace(new RegExp(`(?<![\\w.$])${name}\\b`, 'g'), v), source);

/** The text from `open` (an opening bracket) to its matching close, both excluded. */
function enclosed(source: string, open: number): string {
  const pairs: Record<string, string> = { '(': ')', '{': '}' };
  const o = source[open] ?? '';
  const c = pairs[o];
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === o) depth++;
    else if (source[i] === c && --depth === 0) return source.slice(open + 1, i);
  }
  return source.slice(open + 1);
}

/**
 * Each `if (<condition>)` whose branch throws: the condition (with or without braces, the throw
 * anywhere in the braced block).
 */
export function conditionsThatThrow(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/\bif\s*\(/g)) {
    const start = (m.index ?? 0) + m[0].length - 1;
    const condition = enclosed(source, start);
    const after = source.slice(start + condition.length + 2);
    const branch = /^\s*\{/.test(after) ? enclosed(after, after.indexOf('{')) : after.split(';')[0] ?? '';
    if (/\bthrow\b/.test(branch)) out.push(condition);
  }
  return out;
}

/** The bodies of the loops in some code (`for`/`while` blocks, `.forEach(…)` and `.map(…)` calls). */
export function loopBodies(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/\b(for|while)\s*\(/g)) {
    const head = (m.index ?? 0) + m[0].length - 1;
    const rest = source.slice(head + enclosed(source, head).length + 2);
    if (/^\s*\{/.test(rest)) out.push(enclosed(rest, rest.indexOf('{')));
    else out.push(rest.split(';')[0] ?? '');
  }
  for (const m of source.matchAll(/\.\s*(forEach|map|peek)\s*\(/g)) {
    out.push(enclosed(source, (m.index ?? 0) + m[0].length - 1));
  }
  return out;
}

/** `@Transactional` that starts or joins a transaction (not NOT_SUPPORTED, NEVER, SUPPORTS, MANDATORY). */
export const opensTransaction = (tx: JavaAnnotation | null) =>
  !!tx && !/\b(NOT_SUPPORTED|NEVER|SUPPORTS|MANDATORY)\b/.test(tx.text);

export const isReadOnly = (tx: JavaAnnotation | null) => !!tx && /readOnly\s*=\s*true/.test(tx.text);

/** A method that runs outside any transaction when called from a controller. */
export const outsideTransaction = (tx: JavaAnnotation | null) =>
  !tx || /\b(NOT_SUPPORTED|NEVER|SUPPORTS)\b/.test(tx.text);

export interface Template {
  name: string;
  /** Set up with PROPAGATION_REQUIRES_NEW (Spring Boot's own TransactionTemplate is REQUIRED). */
  requiresNew: boolean;
  readOnly: boolean;
}

/** The TransactionTemplate / TransactionOperations fields of a class and how they're set up. */
export function templatesOf(t: JavaType): Template[] {
  return t.fields
    .filter((f) => /^(TransactionTemplate|TransactionOperations)\b/.test(f.type))
    .map((f) => ({
      name: f.name,
      requiresNew:
        new RegExp(`\\b${f.name}\\s*\\.\\s*setPropagationBehavior(Name)?\\s*\\([^;]*REQUIRES_NEW`).test(t.text) ||
        new RegExp(`\\b${f.name}\\s*=\\s*new\\s+TransactionTemplate\\s*\\([^;]*REQUIRES_NEW`).test(t.text),
      readOnly: new RegExp(`\\b${f.name}\\s*\\.\\s*setReadOnly\\s*\\(\\s*true`).test(t.text),
    }));
}

/** A repository or EntityManager lookup that locks the row for writing, in some code. */
export const locksRow = (source: string, lockingMethods: string[]) =>
  lockingMethods.some((name) => new RegExp(`\\.\\s*${name}\\s*\\(`).test(source)) ||
  /\.\s*(find|lock|refresh)\s*\([^;]*PESSIMISTIC_WRITE/.test(source);

/** Code runs a callback in this template. */
export const usesTemplate = (source: string, template: Template) =>
  new RegExp(`\\b${template.name}\\s*\\.\\s*(execute|executeWithoutResult)\\s*\\(`).test(source);

/** Each `catch (...) { ... }` in some code: the caught types and the block. */
export function catchBlocks(source: string): { types: string; block: string }[] {
  const out: { types: string; block: string }[] = [];
  for (const m of source.matchAll(/\bcatch\s*\(([^)]*)\)\s*\{/g)) {
    let depth = 1;
    let i = (m.index ?? 0) + m[0].length;
    const start = i;
    while (i < source.length && depth > 0) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') depth--;
      i++;
    }
    out.push({ types: m[1] ?? '', block: source.slice(start, i - 1) });
  }
  return out;
}

/** Fails the check with an explanation of what was looked at. */
export function check(ok: boolean, explanation: string): void {
  if (!ok) throw new Error(explanation);
}
```

### 25. `supabase/seed/questions/spring-po-approvals/files/checks/transactions.test.ts`

- **Folder:** `supabase/seed/questions/spring-po-approvals/files/checks`
- **File name:** `transactions.test.ts`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 142 lines, 6 KB
- **Commit message:** `Sync transactions.test.ts (question v3 grading)`

```ts
import {
  beansFor,
  callsThrough,
  catchBlocks,
  check,
  code,
  helpersOf,
  isReadOnly,
  loopBodies,
  method,
  noStrings,
  opensTransaction,
  outsideTransaction,
  templatesOf,
  transactionalOf,
  usesTemplate,
  withHelpers,
} from './support/java';

const { service } = code;
const templates = templatesOf(service);
/** rollbackFor / rollbackForClassName (Spring) or rollbackOn (JTA) that covers the budget's exception. */
const rollsBackOnBudget = (text: string) =>
  /\b(rollbackFor|rollbackOn)\s*=\s*\{?[^)]*\b(BudgetExceededException|Exception|Throwable)\.class/.test(text) ||
  /\brollbackForClassName\s*=\s*\{?[^)]*"([\w.]*\.)?(BudgetExceededException|Exception|Throwable)"/.test(text);
const BUDGET = /\b(BudgetExceededException|Exception|Throwable)\b/;

describe('transactions', () => {
  it('a rejection runs in a read-write transaction', () => {
    const reject = method(service, 'reject');
    const tx = transactionalOf(service, reject);
    const own = opensTransaction(tx) && !isReadOnly(tx);
    // Or a TransactionTemplate: its own transaction, unless it joins a read-only one.
    const programmatic = templates.some(
      (t) =>
        usesTemplate(noStrings(withHelpers(service, reject)), t) &&
        !t.readOnly &&
        (t.requiresNew || outsideTransaction(tx) || !isReadOnly(tx)),
    );
    check(own || programmatic, 'Looked at ApprovalService.reject() and its class.');
  });

  it('an approval the budget refuses is rolled back', () => {
    const approve = method(service, 'approve');
    const tx = transactionalOf(service, approve);
    const source = noStrings(withHelpers(service, approve));
    // The refusal must still reach the caller (422): a catch either rethrows, or marks the
    // transaction rollback-only and the exception is thrown again later (`throw refused`).
    const rethrowsLater = /\bthrow\s+(?!new\b)[\w.[\]]+/.test(source);
    const swallowed = catchBlocks(source).some(
      (c) =>
        BUDGET.test(c.types) &&
        !/\bthrow\b/.test(c.block) &&
        !(/setRollbackOnly\s*\(/.test(c.block) && rethrowsLater),
    );
    check(
      !isReadOnly(tx) &&
        !swallowed &&
        ((opensTransaction(tx) && rollsBackOnBudget(tx?.text ?? '')) || /setRollbackOnly\s*\(/.test(source)),
      'Looked at ApprovalService.approve() and the transaction it runs in.',
    );
  });
});

describe('batch approval', () => {
  const approveBatch = method(service, 'approveBatch');
  const batch = noStrings(withHelpers(service, approveBatch));
  const batchTx = transactionalOf(service, approveBatch);

  /**
   * Methods of injected beans (another one, this service itself, through an interface or an
   * ObjectProvider) that the batch calls.
   */
  const invoked = service.fields.flatMap((f) =>
    beansFor(f.type).flatMap((bean) =>
      bean.methods.filter((m) => callsThrough(batch, f.name, m.name)).map((m) => ({ bean, method: m })),
    ),
  );
  /**
   * Those that go through the bean's Spring proxy and start a transaction of their own. (A call on
   * `this` bypasses the proxy, and a private method isn't proxied.)
   */
  const proxied = invoked.filter(({ bean, method: m }) => {
    const tx = transactionalOf(bean, m);
    return (
      !m.modifiers.includes('private') &&
      !m.modifiers.includes('static') &&
      opensTransaction(tx) &&
      (/REQUIRES_NEW/.test(tx?.text ?? '') || outsideTransaction(batchTx))
    );
  });
  // A template that is REQUIRED (Spring Boot's own) joins the batch's transaction if it has one.
  const usedTemplates = templates.filter((t) => usesTemplate(batch, t));
  const viaTemplate = usedTemplates.some((t) => !t.readOnly && (t.requiresNew || outsideTransaction(batchTx)));
  // Or the transaction manager directly: getTransaction(...) with a REQUIRES_NEW definition.
  const viaManager =
    /\.\s*getTransaction\s*\(/.test(batch) &&
    /\.\s*commit\s*\(/.test(batch) &&
    (/REQUIRES_NEW/.test(noStrings(service.text)) || outsideTransaction(batchTx));

  it('each PO in a batch is approved in its own transaction', () => {
    check(
      viaTemplate || viaManager || proxied.length > 0,
      'Looked at ApprovalService.approveBatch() and how it starts each PO.',
    );
  });

  it('a PO the budget refuses is rolled back on its own', () => {
    // What runs for each PO: the batch with its helpers, and the beans' methods it calls. (Whether
    // their own transaction really starts is the check above.)
    const units = [...helpersOf(service, approveBatch).map((m) => ({ bean: service, method: m })), ...invoked];
    const perPo = [batch, ...invoked.map((u) => noStrings(withHelpers(u.bean, u.method)))].join('\n');
    // In a template's callback, wrapping the checked exception in an unchecked one rolls back too.
    const wrapsInTemplate =
      usedTemplates.length > 0 &&
      catchBlocks(perPo).some((c) => /BudgetExceededException/.test(c.types) && /\bthrow\s+new\b/.test(c.block));
    check(
      /setRollbackOnly\s*\(\s*\)/.test(perPo) ||
        (viaManager && /\.\s*rollback\s*\(/.test(perPo)) ||
        wrapsInTemplate ||
        units.some((u) => rollsBackOnBudget(transactionalOf(u.bean, u.method)?.text ?? '')),
      'Looked at the per-PO unit of work of ApprovalService.approveBatch().',
    );
  });

  it("a PO that can't be approved (already decided, unknown, changed meanwhile) doesn't stop the others", () => {
    // Caught for each PO, inside the loop: an already-decided PO (IllegalStateException), an unknown
    // one (PoNotFoundException) and a concurrent change (optimistic locking).
    const caught = loopBodies(batch)
      .flatMap((b) => catchBlocks(b).map((c) => c.types))
      .join(' ');
    const covers = (names: string) => new RegExp(`\\b(${names}|RuntimeException|Exception|Throwable)\\b`).test(caught);
    check(
      covers('IllegalStateException') &&
        covers('PoNotFoundException') &&
        covers(
          'OptimisticLockingFailureException|ObjectOptimisticLockingFailureException|ConcurrencyFailureException|TransientDataAccessException|DataAccessException',
        ),
      'Looked at what ApprovalService.approveBatch() catches for each PO, inside its loop.',
    );
  });
});
```

## Question: web-invoice-builder

### 26. `supabase/seed/questions/web-invoice-builder/question.json`

- **Folder:** `supabase/seed/questions/web-invoice-builder`
- **File name:** `question.json`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 201 lines, 6 KB
- **Commit message:** `Sync question.json (question v3 grading)`

```json
{
  "format": "zycus-codearena/question@1",
  "id": "f1eb4c67-f593-4b9b-9087-4e6bdd1eed13",
  "slug": "web-invoice-builder",
  "version": 3,
  "title": "Supplier Invoice Builder: autosave, identity and input state (React web)",
  "category": "Front-end debugging",
  "role_tags": [
    "lead-react-native-developer",
    "react-developer",
    "front-end-developer"
  ],
  "skill_tags": [
    "react",
    "typescript",
    "hooks",
    "closures",
    "debounce",
    "state-management",
    "forms",
    "intl"
  ],
  "difficulty": "hard",
  "time_suggestion_minutes": 30,
  "is_sample": false,
  "status": "published",
  "statement_md": "@file:statement.md",
  "files": [
    {
      "path": "src/InvoiceBuilder.tsx",
      "language": "typescript",
      "content": "@file:files/src/InvoiceBuilder.tsx"
    },
    {
      "path": "src/components/PoPicker.tsx",
      "language": "typescript",
      "content": "@file:files/src/components/PoPicker.tsx"
    },
    {
      "path": "src/components/LineRow.tsx",
      "language": "typescript",
      "content": "@file:files/src/components/LineRow.tsx"
    },
    {
      "path": "src/components/MoneyInput.tsx",
      "language": "typescript",
      "content": "@file:files/src/components/MoneyInput.tsx"
    },
    {
      "path": "src/hooks/useDebouncedCallback.ts",
      "language": "typescript",
      "content": "@file:files/src/hooks/useDebouncedCallback.ts"
    },
    {
      "path": "src/state/invoiceReducer.ts",
      "language": "typescript",
      "content": "@file:files/src/state/invoiceReducer.ts"
    },
    {
      "path": "src/utils/money.ts",
      "language": "typescript",
      "content": "@file:files/src/utils/money.ts"
    },
    {
      "path": "src/utils/dates.ts",
      "language": "typescript",
      "content": "@file:files/src/utils/dates.ts"
    },
    {
      "path": "src/utils/debounce.ts",
      "language": "typescript",
      "content": "@file:files/src/utils/debounce.ts",
      "readonly": true
    },
    {
      "path": "src/types.ts",
      "language": "typescript",
      "content": "@file:files/src/types.ts",
      "readonly": true
    },
    {
      "path": "__tests__/autosave.test.tsx",
      "language": "typescript",
      "content": "@file:files/__tests__/autosave.test.tsx",
      "readonly": true
    },
    {
      "path": "__tests__/PoPicker.test.tsx",
      "language": "typescript",
      "content": "@file:files/__tests__/PoPicker.test.tsx",
      "readonly": true
    },
    {
      "path": "__tests__/lines.test.tsx",
      "language": "typescript",
      "content": "@file:files/__tests__/lines.test.tsx",
      "readonly": true
    },
    {
      "path": "__tests__/MoneyInput.test.tsx",
      "language": "typescript",
      "content": "@file:files/__tests__/MoneyInput.test.tsx",
      "readonly": true
    },
    {
      "path": "__tests__/dates.test.tsx",
      "language": "typescript",
      "content": "@file:files/__tests__/dates.test.tsx",
      "readonly": true
    },
    {
      "path": "__tests__/support/fakeApi.tsx",
      "language": "typescript",
      "content": "@file:files/__tests__/support/fakeApi.tsx",
      "readonly": true
    },
    {
      "path": "package.json",
      "language": "json",
      "content": "@file:files/package.json",
      "readonly": true
    }
  ],
  "rubric": [
    {
      "key": "autosave",
      "criterion": "Autosave saves the latest draft, and never after submit or close",
      "description": "Latest callback through a ref updated in an effect (not memo deps, not render-time assignment); timer cleared on unmount; pending autosave cancelled (or flushed) on submit.",
      "max_points": 6
    },
    {
      "key": "debounce",
      "criterion": "Search is debounced once",
      "description": "Explains that useMemo with an unstable dependency rebuilt the debounce every render; one debounced function per component, cleaned up on unmount.",
      "max_points": 3
    },
    {
      "key": "identity",
      "criterion": "Lines have unique ids",
      "description": "Replaces Date.now() ids with a counter / randomUUID; explains the duplicate keys and the by-id updates hitting several lines; no index keys.",
      "max_points": 3
    },
    {
      "key": "immutability",
      "criterion": "State updates are immutable",
      "description": "updateLine returns a new array and object; explains reference equality in useMemo/useEffect deps and why Undo broke.",
      "max_points": 4
    },
    {
      "key": "money_input",
      "criterion": "Price field and parsing are correct",
      "description": "Local text state while typing, parent updated only with valid amounts; parseRupees validates the whole string, strips ₹/commas, no float * 100.",
      "max_points": 4
    },
    {
      "key": "timezone",
      "criterion": "Invoice date is the date in India",
      "description": "Intl.DateTimeFormat with timeZone Asia/Kolkata instead of the UTC date from toISOString.",
      "max_points": 2
    },
    {
      "key": "code_quality",
      "criterion": "Root-cause fixes, clean code",
      "description": "No test special-casing, no eslint-disable to hide real dependency problems, readable explanations.",
      "max_points": 2
    }
  ],
  "reference_solution": {
    "notes_md": "@file:solution/notes.md",
    "files": [
      {
        "path": "src/InvoiceBuilder.tsx",
        "content": "@file:solution/files/src/InvoiceBuilder.tsx"
      },
      {
        "path": "src/components/MoneyInput.tsx",
        "content": "@file:solution/files/src/components/MoneyInput.tsx"
      },
      {
        "path": "src/components/PoPicker.tsx",
        "content": "@file:solution/files/src/components/PoPicker.tsx"
      },
      {
        "path": "src/hooks/useDebouncedCallback.ts",
        "content": "@file:solution/files/src/hooks/useDebouncedCallback.ts"
      },
      {
        "path": "src/state/invoiceReducer.ts",
        "content": "@file:solution/files/src/state/invoiceReducer.ts"
      },
      {
        "path": "src/utils/dates.ts",
        "content": "@file:solution/files/src/utils/dates.ts"
      },
      {
        "path": "src/utils/money.ts",
        "content": "@file:solution/files/src/utils/money.ts"
      }
    ]
  }
}
```

### 27. `supabase/seed/questions/web-invoice-builder/statement.md`

- **Folder:** `supabase/seed/questions/web-invoice-builder`
- **File name:** `statement.md`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 35 lines, 2 KB
- **Commit message:** `Sync statement.md (question v3 grading)`

```markdown
## Supplier Invoice Builder: the draft that won't behave

Suppliers use this **React (web)** screen of the Zycus supplier portal to raise an invoice against
a PO. They search for the PO, import its lines, adjust quantities and prices, and submit. Drafts
**autosave 0.8 s after the last change**. Money is held in **paise** (integers).

### Bug reports

1. **"Autosave saved an old version."** The saved draft is the one from when the page opened: no
   PO and no lines. Quantity edits aren't autosaved at all.
2. **"My submitted invoice went back to Draft."** An autosave lands after *Submit* and the server
   reopens the invoice. Closing the builder with recent edits also saves afterwards, while the
   supplier is already on another screen.
3. **"PO search hammers the API."** Typing *PO-2026-0042* sends a request for every keystroke
   instead of one when the typing pauses.
4. **"Editing one line changes another, and Remove deletes every line."** This happens after
   importing a PO's lines or clicking *Add line* quickly. The console shows *Encountered two
   children with the same key*.
5. **"The total doesn't change when I edit a quantity, and Undo does nothing."**
6. **"I can't type ₹12.50."** The decimal point disappears as soon as it's typed, clearing the
   field puts a 0 back, and pasting *1,250.50* makes the price ₹1.00.
7. **"Invoices raised just after midnight are dated yesterday."** An invoice created at 00:30 IST
   on 1 May is dated 30 April, so it falls into the previous month's GST return.

### What to do

- Fix the **root causes** in `src/`. Keep the public props, the `data-testid`s and the hook's
  signature.
- `__tests__/` is **read-only** and describes the expected behaviour. Use **Run tests** (they use
  fake timers).
- Don't special-case the tests: reviewers read your changes and run more tests.
- The tests render without a browser DOM (no `document`), and inputs are read through their
  `value` prop, so keep them controlled (`value` + `onChange`).

*Time guide: about 30 minutes.*
```

### 28. `supabase/seed/questions/web-invoice-builder/files/__tests__/MoneyInput.test.tsx`

- **Folder:** `supabase/seed/questions/web-invoice-builder/files/__tests__`
- **File name:** `MoneyInput.test.tsx`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 78 lines, 2 KB
- **Commit message:** `Sync MoneyInput.test.tsx (question v3 grading)`

```tsx
import { fireEvent, screen, textContent } from '@codearena/test-utils';
import { parseRupees } from '../src/utils/money';
import { openPo, typeInto, valueOf } from './support/fakeApi';

const lineTotal = () => textContent(screen.getByTestId('total-1'));

describe('price field', () => {
  it('keeps the decimal point while the supplier types ₹12.50', async () => {
    await openPo();

    typeInto('price-1', '12.');
    expect(valueOf('price-1')).toBe('12.');
    typeInto('price-1', '12.5');

    expect(valueOf('price-1')).toBe('12.5');
    expect(lineTotal()).toBe('₹125.00');
  });

  it('shows exactly what was typed while typing (₹12.0, ₹0.05)', async () => {
    await openPo();

    typeInto('price-1', '12.0');
    expect(valueOf('price-1')).toBe('12.0');
    for (const text of ['0', '0.', '0.0', '0.05']) {
      typeInto('price-1', text);
      expect(valueOf('price-1')).toBe(text);
    }
    expect(lineTotal()).toBe('₹0.50');
  });

  it('shows the restored price after Undo', async () => {
    await openPo();

    typeInto('price-1', '99');
    const price = screen.getByTestId('price-1');
    if (price.props.onBlur) fireEvent(price, 'blur', { target: { value: '99' } }); // the field is left
    fireEvent.click(screen.getByTestId('undo'));

    expect(parseRupees(String(valueOf('price-1')))).toBe(25_000);
    expect(lineTotal()).toBe('₹2,500.00');
  });

  it('can be cleared and typed again', async () => {
    await openPo();

    typeInto('price-1', '');
    expect(valueOf('price-1')).toBe('');
    typeInto('price-1', '99');

    expect(valueOf('price-1')).toBe('99');
    expect(lineTotal()).toBe('₹990.00');
  });

  it('accepts a pasted amount with digit grouping', async () => {
    await openPo();

    typeInto('price-1', '1,250.50');

    expect(lineTotal()).toBe('₹12,505.00');
  });
});

describe('parseRupees', () => {
  it('reads plain, grouped and ₹ amounts', () => {
    expect(parseRupees('1250')).toBe(125_000);
    expect(parseRupees('99.9')).toBe(9_990);
    expect(parseRupees('0.29')).toBe(29);
    expect(parseRupees('1,250.50')).toBe(125_050);
    expect(parseRupees('₹ 1,23,456')).toBe(12_345_600);
    expect(parseRupees(' 12.5 ')).toBe(1_250);
  });

  it('rejects anything that is not a valid amount', () => {
    for (const text of ['', '.', 'abc', '12abc', '1.005', '-5', '1.2.3', '1e3', '0x10', 'Infinity']) {
      expect([text, parseRupees(text)]).toEqual([text, null]);
    }
  });
});
```

### 29. `supabase/seed/questions/web-invoice-builder/files/__tests__/PoPicker.test.tsx`

- **Folder:** `supabase/seed/questions/web-invoice-builder/files/__tests__`
- **File name:** `PoPicker.test.tsx`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 64 lines, 2 KB
- **Commit message:** `Sync PoPicker.test.tsx (question v3 grading)`

```tsx
import { act, fireEvent, flushPromises, render, screen } from '@codearena/test-utils';
import React from 'react';
import { InvoiceBuilder } from '../src/InvoiceBuilder';
import { SEARCH_DEBOUNCE_MS } from '../src/components/PoPicker';
import { createFakeApi, typeInto } from './support/fakeApi';

describe('PO search', () => {
  it('sends one request when the supplier pauses typing', async () => {
    jest.useFakeTimers();
    const api = createFakeApi();
    render(<InvoiceBuilder api={api} />);

    for (const value of ['P', 'PO', 'PO-', 'PO-2', 'PO-20']) typeInto('po-search', value);
    act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));

    expect(api.searchPos).toHaveBeenCalledTimes(1);
    expect(api.searchPos).toHaveBeenCalledWith('PO-20');
    await flushPromises(); // let the results render
  });

  it('waits until the supplier stops typing, however long they type', async () => {
    jest.useFakeTimers();
    const api = createFakeApi();
    render(<InvoiceBuilder api={api} />);

    for (const value of ['P', 'PO', 'PO-', 'PO-2', 'PO-20']) {
      typeInto('po-search', value);
      act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 50)); // a slow typist
    }
    expect(api.searchPos).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(50));
    expect(api.searchPos).toHaveBeenCalledTimes(1);
    expect(api.searchPos).toHaveBeenCalledWith('PO-20');
    await flushPromises();
  });

  it('waits for the pause before searching', async () => {
    jest.useFakeTimers();
    const api = createFakeApi();
    render(<InvoiceBuilder api={api} />);

    typeInto('po-search', 'Pune');
    act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    expect(api.searchPos).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(api.searchPos).toHaveBeenCalledWith('Pune');
    await flushPromises();
  });

  it('lists matches; choosing one imports its lines', async () => {
    jest.useFakeTimers();
    const api = createFakeApi();
    render(<InvoiceBuilder api={api} />);

    typeInto('po-search', 'mumbai');
    act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    await flushPromises();
    fireEvent.click(screen.getByTestId('po-po-2'));
    await flushPromises();

    expect(api.getPoLines).toHaveBeenCalledWith('po-2');
    expect(screen.getAllByTestId('line')).toHaveLength(3);
  });
});
```

### 30. `supabase/seed/questions/web-invoice-builder/files/__tests__/autosave.test.tsx`

- **Folder:** `supabase/seed/questions/web-invoice-builder/files/__tests__`
- **File name:** `autosave.test.tsx`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 100 lines, 4 KB
- **Commit message:** `Sync autosave.test.tsx (question v3 grading)`

```tsx
import { act, deferred, fireEvent, flushPromises, render, screen } from '@codearena/test-utils';
import React from 'react';
import { AUTOSAVE_MS, InvoiceBuilder } from '../src/InvoiceBuilder';
import { createFakeApi, openPo, typeInto } from './support/fakeApi';

describe('autosave', () => {
  it('saves the current draft once the supplier stops editing', async () => {
    const { api } = await openPo();

    act(() => jest.advanceTimersByTime(AUTOSAVE_MS - 1));
    expect(api.saved).toHaveLength(0);
    act(() => jest.advanceTimersByTime(1));

    expect(api.saved).toHaveLength(1);
    expect(api.saved[0]!.poId).toBe('po-1');
    expect(api.saved[0]!.lines.map((l) => l.sku)).toEqual(['SKU-A', 'SKU-B', 'SKU-C']);
  });

  it('saves quantity edits, once per burst of typing, with the latest values', async () => {
    const { api } = await openPo();
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS));
    const before = api.saved.length;

    typeInto('qty-1', '4');
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS / 2));
    typeInto('qty-2', '3');
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS - 1));
    expect(api.saved.length - before).toBe(0); // the pause starts again with every edit
    act(() => jest.advanceTimersByTime(1));

    expect(api.saved.length - before).toBe(1);
    expect(api.saved[api.saved.length - 1]!.lines.map((l) => l.quantity)).toEqual([4, 3, 1]);
  });

  it('never saves after the invoice is submitted', async () => {
    const { api } = await openPo();
    typeInto('qty-1', '4');

    fireEvent.submit(screen.getByTestId('invoice'));
    await flushPromises();
    expect(api.submitted).toHaveLength(1); // sent at once: the supplier is waiting for it
    act(() => jest.advanceTimersByTime(5_000));

    expect(api.submitted).toHaveLength(1);
    expect(api.submitted[0]!.lines[0]!.quantity).toBe(4);
    expect(api.log.slice(api.log.indexOf('submit'))).toEqual(['submit']);
  });

  it('never saves while a slow submit is still on its way', async () => {
    const api = createFakeApi();
    const sending = deferred();
    api.submit.mockImplementation(async (draft) => {
      api.log.push('submit');
      api.submitted.push(structuredClone(draft));
      await sending.promise;
    });
    await openPo(api);
    typeInto('qty-1', '4');

    fireEvent.submit(screen.getByTestId('invoice'));
    await flushPromises();
    act(() => jest.advanceTimersByTime(5_000)); // the network is slow
    await act(async () => sending.resolve(undefined));
    await flushPromises();

    expect(api.log.slice(api.log.indexOf('submit'))).toEqual(['submit']);
  });

  it('a search in the PO picker does not cancel a pending save', async () => {
    const { api } = await openPo();
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS));
    const before = api.saved.length;

    typeInto('qty-1', '4');
    typeInto('po-search', 'Mum');
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS));
    await flushPromises();

    expect(api.saved.length - before).toBe(1);
    expect(api.saved[api.saved.length - 1]!.lines[0]!.quantity).toBe(4);
  });

  it('never saves after the builder is closed', async () => {
    const { api, unmount } = await openPo();
    typeInto('qty-1', '4');

    unmount();
    act(() => jest.advanceTimersByTime(5_000));

    expect(api.saveDraft).not.toHaveBeenCalled();
  });

  it('does not save before a PO is chosen', () => {
    jest.useFakeTimers();
    const api = createFakeApi();
    render(<InvoiceBuilder api={api} />);
    act(() => jest.advanceTimersByTime(5_000));
    expect(api.saveDraft).not.toHaveBeenCalled();
  });
});
```

### 31. `supabase/seed/questions/web-invoice-builder/files/__tests__/lines.test.tsx`

- **Folder:** `supabase/seed/questions/web-invoice-builder/files/__tests__`
- **File name:** `lines.test.tsx`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 118 lines, 4 KB
- **Commit message:** `Sync lines.test.tsx (question v3 grading)`

```tsx
import { fireEvent, getConsoleErrors, screen, textContent } from '@codearena/test-utils';
import { initialState, invoiceReducer, type InvoiceState } from '../src/state/invoiceReducer';
import { PO_LINES, createFakeApi, openPo, typeInto, valueOf } from './support/fakeApi';

const duplicateKeyWarnings = () => getConsoleErrors().filter((m) => /same key/i.test(m));
const gross = () => textContent(screen.getByTestId('total-gross'));

describe('invoice lines', () => {
  it('gives every line its own id, even when several are created at once', async () => {
    await openPo(); // the PO's three lines are imported at once
    fireEvent.click(screen.getByTestId('add-line'));
    fireEvent.click(screen.getByTestId('add-line'));

    // Each line keeps its own value: lines that shared an id would change together.
    ['SKU-1', 'SKU-2', 'SKU-3', 'SKU-4', 'SKU-5'].forEach((sku, i) => typeInto(`sku-${i + 1}`, sku));
    expect([1, 2, 3, 4, 5].map((n) => valueOf(`sku-${n}`))).toEqual(['SKU-1', 'SKU-2', 'SKU-3', 'SKU-4', 'SKU-5']);
    expect(duplicateKeyWarnings()).toEqual([]);
  });

  it('gives a line added after a removal its own id', async () => {
    await openPo();
    fireEvent.click(screen.getByTestId('remove-1'));
    fireEvent.click(screen.getByTestId('add-line'));
    typeInto('sku-3', 'SKU-NEW');

    expect([valueOf('sku-1'), valueOf('sku-2'), valueOf('sku-3')]).toEqual(['SKU-B', 'SKU-C', 'SKU-NEW']);
    expect(duplicateKeyWarnings()).toEqual([]);
  });

  it('edits only the line that was changed', async () => {
    await openPo();

    typeInto('qty-2', '7');

    expect([valueOf('qty-1'), valueOf('qty-2'), valueOf('qty-3')]).toEqual([10, 7, 1]);
    expect(duplicateKeyWarnings()).toEqual([]);
  });

  it('removes only the line that was removed', async () => {
    await openPo();

    fireEvent.click(screen.getByTestId('remove-1'));

    expect(screen.getAllByTestId('line')).toHaveLength(2);
    expect(valueOf('sku-1')).toBe('SKU-B');
  });

  it('keeps lines that were added quickly apart', async () => {
    await openPo();

    fireEvent.click(screen.getByTestId('add-line'));
    fireEvent.click(screen.getByTestId('add-line'));
    typeInto('sku-5', 'SKU-Z');

    expect(screen.getAllByTestId('line')).toHaveLength(5);
    expect([valueOf('sku-1'), valueOf('sku-4'), valueOf('sku-5')]).toEqual(['SKU-A', '', 'SKU-Z']);
    expect(duplicateKeyWarnings()).toEqual([]);
  });
});

describe('totals and undo', () => {
  it('shows the totals of the imported PO', async () => {
    await openPo();

    expect(textContent(screen.getByTestId('total-net'))).toBe('₹9,998.00');
    expect(textContent(screen.getByTestId('total-tax'))).toBe('₹1,649.64');
    expect(gross()).toBe('₹11,647.64');
  });

  it('updates the totals on every edit', async () => {
    await openPo();

    typeInto('qty-1', '4');

    expect(textContent(screen.getByTestId('total-1'))).toBe('₹1,000.00');
    expect(gross()).toBe('₹9,967.64');
  });

  it('keeps two PO lines with the same SKU apart', async () => {
    const api = createFakeApi();
    const [paper] = PO_LINES;
    api.getPoLines.mockImplementation(async () => [
      { ...paper! },
      { ...paper!, description: 'Copier paper A4 (second delivery)' },
    ]);
    await openPo(api);

    typeInto('qty-2', '7');

    expect(valueOf('qty-1')).toBe(10);
    expect(valueOf('qty-2')).toBe(7);
    expect(duplicateKeyWarnings()).toEqual([]);
  });

  it('undo puts back the previous quantity and totals', async () => {
    await openPo();
    typeInto('qty-1', '4');

    fireEvent.click(screen.getByTestId('undo'));

    expect(valueOf('qty-1')).toBe(10);
    expect(gross()).toBe('₹11,647.64');
  });

  it('an edit never changes the version that Undo returns to', () => {
    const imported: InvoiceState = {
      ...initialState,
      lines: PO_LINES.map((line, i) => ({ ...line, id: `line-${i + 1}` })),
    };
    const id = imported.lines[0]!.id;

    const edited = invoiceReducer(imported, { type: 'updateLine', id, patch: { quantity: 99 } });

    expect(imported.lines[0]!.quantity).toBe(10);
    expect(edited.lines[0]!.quantity).toBe(99);
    expect(edited.lines).not.toBe(imported.lines);
  });
});
```

## Database seed SQL (large files; do these last)

### 32. `supabase/seed/parts/question-rn-approvals-inbox.sql`

- **Folder:** `supabase/seed/parts`
- **File name:** `question-rn-approvals-inbox.sql`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 65 lines, 69 KB (large: pasting may take a few seconds)
- **Commit message:** `Sync question-rn-approvals-inbox.sql (question v3 grading)`

```sql
-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- Question "Approvals Inbox: session, networking and list state (React Native)". Safe to re-run: what is already installed and up to date is left untouched.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Question: rn-approvals-inbox (version 3)
do $question$
declare
  v_installed int;
begin
  select version into v_installed from public.questions where id = '9249d0ed-6c2c-4ea4-80f9-48645dbf737a';
  if v_installed >= 3 then
    raise notice 'Question "rn-approvals-inbox": version % installed, left unchanged', v_installed;
    return;
  end if;
  insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status, version) values (
    '9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'rn-approvals-inbox', 'Approvals Inbox: session, networking and list state (React Native)', 'React Native debugging', array['lead-react-native-developer', 'react-native-developer']::text[], array['react-native', 'async', 'auth', 'react-hooks', 'flatlist', 'concurrency']::text[], 'hard', 35,
    convert_from(decode('IyMgQXBwcm92YWxzIEluYm94OiB0aGUgYXBwIGxvZ3MgcGVvcGxlIG91dCBhbmQgbG9zZXMgZGVjaXNpb25zCgpaeWN1cyBhcHByb3ZlcnMgdXNlIHRoaXMgUmVhY3QgTmF0aXZlIGFwcCB0byBhcHByb3ZlIHB1cmNoYXNlIHJlcXVpc2l0aW9ucyBhbmQgaW52b2ljZXMgb24gdGhlIGdvLgpZb3UgYXJlIGxvb2tpbmcgYXQgaXRzIGRhdGEgbGF5ZXI6IHRoZSBIVFRQIGNsaWVudCwgdGhlIHBlcnNpc3RlZCBzZXNzaW9uLCB0aGUgbGlzdCBob29rLCB0aGUKb3B0aW1pc3RpYyBhcHByb3ZlL3JlamVjdCBzdGF0ZSBhbmQgdGhlIGxpc3Qgc2NyZWVuLgoKIyMjIEJ1ZyByZXBvcnRzIGZyb20gcHJvZHVjdGlvbgoKMS4gKioiSXQgbG9ncyBtZSBvdXQgYWZ0ZXIgdGhlIGFwcCBoYXMgYmVlbiBpbiB0aGUgYmFja2dyb3VuZC4iKiogTG9ncyBzaG93IHNldmVyYWwKICAgYC9hdXRoL3JlZnJlc2hgIGNhbGxzIHdpdGhpbiBhIGZldyBtaWxsaXNlY29uZHMgb2YgZWFjaCBvdGhlciB3aGVuIHRoZSBhcHAgcmVzdW1lcyBhbmQgZmlyZXMgaXRzCiAgIHJlcXVlc3RzLiBPdXIgYXV0aCBzZXJ2ZXIgKipyb3RhdGVzIHJlZnJlc2ggdG9rZW5zKio6IGVhY2ggcmVmcmVzaCBpbnZhbGlkYXRlcyB0aGUgcHJldmlvdXMKICAgcmVmcmVzaCB0b2tlbiwgc28gd2UgbXVzdCBuZXZlciByZWZyZXNoIG1vcmUgb2Z0ZW4gdGhhbiBuZWVkZWQuCjIuICoqIlRoZSBzcGlubmVyIG5ldmVyIHN0b3BzIGFmdGVyIEkgc3dpdGNoIGZpbHRlcnMuIioqIFRoZSBmaXJzdCBzd2l0Y2ggYmV0d2VlbiB0aGUgKkFsbCAvCiAgIFVyZ2VudCAvIE1pbmUqIGNoaXBzIHNvbWV0aW1lcyB3b3JrczsgYWZ0ZXIgdGhhdCB0aGUgbGlzdCBzdGF5cyBvbiBhIHNwaW5uZXIuIE9jY2FzaW9uYWxseSB0aGUKICAgKk1pbmUqIGNoaXAgaXMgc2VsZWN0ZWQgYnV0ICpVcmdlbnQqIGl0ZW1zIGFyZSBzaG93bi4KMy4gKioiSSBhcHByb3ZlZCB0d28gcmVxdWVzdHM7IG9uZSBmYWlsZWQgYW5kIGJvdGggd2VudCBiYWNrIHRvIFBlbmRpbmcuIioqIFRoZSBzZXJ2ZXIgc2hvd3MgdGhlCiAgIHNlY29uZCBvbmUgYXMgYXBwcm92ZWQuIEEgZmFpbGVkIGRlY2lzaW9uIHNob3VsZCBhbHNvIHRlbGwgdGhlIGFwcHJvdmVyIGl0IGZhaWxlZC4KNC4gKioiRmlyc3QgbGF1bmNoIGFmdGVyIGFuIHVwZGF0ZTogdGhlIGZpcnN0IHNjcmVlbiBzaG93cyAnU2Vzc2lvbiBleHBpcmVkJy4iKiogVGhlIGZpcnN0IHJlcXVlc3QKICAgYWZ0ZXIgYSBjb2xkIHN0YXJ0IGdvZXMgb3V0IHdpdGhvdXQgYW4gYEF1dGhvcml6YXRpb25gIGhlYWRlci4gQSB0b2tlbiByZWZyZXNoIHRoYXQgaGFwcGVucwogICBkdXJpbmcgc3RhcnR1cCBpcyBzb21ldGltZXMgbG9zdCBhcyB3ZWxsLgo1LiAqKiJFeHBhbmRpbmcgYSByb3cgYW5kIHRoZW4gYXBwcm92aW5nIHRoZSByb3cgYWJvdmUgaXQgZXhwYW5kcyBhIGRpZmZlcmVudCByb3cuIioqIEEgY29tbWVudAogICB0eXBlZCBpbiBvbmUgcm93IGNhbiBzaG93IHVwIGluIGFub3RoZXIuIERlZXAgbGlua3MgdGhhdCBzY3JvbGwgdG8gYW4gaXRlbSBsYW5kIGEgZmV3IHJvd3Mgb2ZmLgoKIyMjIFdoYXQgdG8gZG8KCi0gRmluZCBhbmQgZml4IHRoZSAqKnJvb3QgY2F1c2VzKiogaW4gYHNyYy9gLiBTZXZlcmFsIGJ1Z3MgYXJlIHN1YnRsZTsgcmVhZCB0aGUgY29kZSBjYXJlZnVsbHkuCi0gVGhlIHRlc3RzIGluIGBfX3Rlc3RzX18vYCBkZXNjcmliZSB0aGUgZXhwZWN0ZWQgYmVoYXZpb3VyIGFuZCBhcmUgKipyZWFkLW9ubHkqKi4gVXNlICoqUnVuCiAgdGVzdHMqKiB0byBjaGVjayB5b3VyIHdvcmsuIEFsbCB0ZXN0cyBzaG91bGQgcGFzcyB3aGVuIHlvdSBhcmUgZG9uZS4KLSBEb24ndCBzcGVjaWFsLWNhc2UgdGVzdHMgb3Igd2Vha2VuIGJlaGF2aW91ciB0byBtYWtlIHRoZW0gcGFzczogcmV2aWV3ZXJzIHJlYWQgeW91ciBjb2RlIGFuZCBydW4KICBhZGRpdGlvbmFsIHRlc3RzLgotIFlvdSBtYXkgcmVmYWN0b3IgZnJlZWx5IHdpdGhpbiBgc3JjL2A7IGtlZXAgdGhlIHB1YmxpYyBmdW5jdGlvbiBuYW1lcyBhbmQgc2lnbmF0dXJlcy4KCipUaW1lIGd1aWRlOiBhYm91dCAzNSBtaW51dGVzLioK', 'base64'), 'UTF8'),
    false, 'published', 3
  ) on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, category = excluded.category,
    role_tags = excluded.role_tags, skill_tags = excluded.skill_tags, difficulty = excluded.difficulty,
    time_suggestion_minutes = excluded.time_suggestion_minutes, statement_md = excluded.statement_md,
    is_sample = excluded.is_sample, status = excluded.status, version = excluded.version;
  delete from public.question_files where question_id = '9249d0ed-6c2c-4ea4-80f9-48645dbf737a' and path <> all (array['src/api/httpClient.ts', 'src/auth/sessionStore.ts', 'src/hooks/useApprovals.ts', 'src/state/approvals.ts', 'src/screens/ApprovalsList.tsx', 'src/types.ts', '__tests__/httpClient.test.ts', '__tests__/sessionStore.test.ts', '__tests__/useApprovals.test.tsx', '__tests__/approvals.test.tsx', '__tests__/ApprovalsList.test.tsx', '__tests__/support/fakeServer.ts', 'package.json']::text[]);
  insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/api/httpClient.ts', 'typescript', convert_from(decode('aW1wb3J0IHR5cGUgeyBTZXNzaW9uU3RvcmUgfSBmcm9tICcuLi9hdXRoL3Nlc3Npb25TdG9yZSc7CmltcG9ydCB7IEh0dHBFcnJvciwgdHlwZSBGZXRjaExpa2UsIHR5cGUgVG9rZW5zIH0gZnJvbSAnLi4vdHlwZXMnOwoKZXhwb3J0IGludGVyZmFjZSBIdHRwQ2xpZW50T3B0aW9ucyB7CiAgYmFzZVVybDogc3RyaW5nOwogIGZldGNoSW1wbDogRmV0Y2hMaWtlOwogIHNlc3Npb246IFNlc3Npb25TdG9yZTsKICAvKiogRXhjaGFuZ2VzIGEgcmVmcmVzaCB0b2tlbiBmb3IgbmV3IHRva2Vucy4gUmVmcmVzaCB0b2tlbnMgcm90YXRlIG9uIGV2ZXJ5IGNhbGwuICovCiAgcmVmcmVzaDogKHJlZnJlc2hUb2tlbjogc3RyaW5nKSA9PiBQcm9taXNlPFRva2Vucz47CiAgLyoqIENhbGxlZCB3aGVuIHRoZSBzZXNzaW9uIGNhbid0IGJlIHJlY292ZXJlZDsgdGhlIGFwcCByZXR1cm5zIHRvIHRoZSBzaWduLWluIHNjcmVlbi4gKi8KICBvbkxvZ291dDogKCkgPT4gdm9pZDsKfQoKZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0T3B0aW9ucyB7CiAgc2lnbmFsPzogQWJvcnRTaWduYWw7CiAgYm9keT86IHVua25vd247Cn0KCmV4cG9ydCBpbnRlcmZhY2UgSHR0cENsaWVudCB7CiAgZ2V0PFQ+KHBhdGg6IHN0cmluZywgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zKTogUHJvbWlzZTxUPjsKICBwb3N0PFQ+KHBhdGg6IHN0cmluZywgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zKTogUHJvbWlzZTxUPjsKfQoKZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUh0dHBDbGllbnQobzogSHR0cENsaWVudE9wdGlvbnMpOiBIdHRwQ2xpZW50IHsKICBsZXQgaXNSZWZyZXNoaW5nID0gZmFsc2U7CgogIGFzeW5jIGZ1bmN0aW9uIHJlcXVlc3Q8VD4obWV0aG9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgb3B0aW9uczogUmVxdWVzdE9wdGlvbnMsIHJldHJpZWQgPSBmYWxzZSk6IFByb21pc2U8VD4gewogICAgY29uc3QgdG9rZW5zID0gby5zZXNzaW9uLmdldCgpPy50b2tlbnM7CiAgICBjb25zdCByZXMgPSBhd2FpdCBvLmZldGNoSW1wbChvLmJhc2VVcmwgKyBwYXRoLCB7CiAgICAgIG1ldGhvZCwKICAgICAgaGVhZGVyczogewogICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsCiAgICAgICAgLi4uKHRva2VucyA/IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rva2Vucy5hY2Nlc3NUb2tlbn1gIH0gOiB7fSksCiAgICAgIH0sCiAgICAgIGJvZHk6IG9wdGlvbnMuYm9keSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5ib2R5KSwKICAgICAgc2lnbmFsOiBvcHRpb25zLnNpZ25hbCwKICAgIH0pOwoKICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDEgJiYgIXJldHJpZWQpIHsKICAgICAgaWYgKCFpc1JlZnJlc2hpbmcpIHsKICAgICAgICBpc1JlZnJlc2hpbmcgPSB0cnVlOwogICAgICAgIHRyeSB7CiAgICAgICAgICBjb25zdCBmcmVzaCA9IGF3YWl0IG8ucmVmcmVzaCh0b2tlbnMhLnJlZnJlc2hUb2tlbik7CiAgICAgICAgICB2b2lkIG8uc2Vzc2lvbi5zYXZlVG9rZW5zKGZyZXNoKTsKICAgICAgICB9IGNhdGNoIHsKICAgICAgICAgIG8ub25Mb2dvdXQoKTsKICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoNDAxLCAnWW91ciBzZXNzaW9uIGhhcyBleHBpcmVkLiBTaWduIGluIGFnYWluLicpOwogICAgICAgIH0gZmluYWxseSB7CiAgICAgICAgICBpc1JlZnJlc2hpbmcgPSBmYWxzZTsKICAgICAgICB9CiAgICAgIH0KICAgICAgcmV0dXJuIHJlcXVlc3Q8VD4obWV0aG9kLCBwYXRoLCBvcHRpb25zLCB0cnVlKTsKICAgIH0KICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgSHR0cEVycm9yKHJlcy5zdGF0dXMsIGBSZXF1ZXN0IGZhaWxlZCAoJHtyZXMuc3RhdHVzfSlgKTsKICAgIHJldHVybiAoYXdhaXQgcmVzLmpzb24oKSkgYXMgVDsKICB9CgogIHJldHVybiB7CiAgICBnZXQ6IChwYXRoLCBvcHRpb25zID0ge30pID0+IHJlcXVlc3QoJ0dFVCcsIHBhdGgsIG9wdGlvbnMpLAogICAgcG9zdDogKHBhdGgsIG9wdGlvbnMgPSB7fSkgPT4gcmVxdWVzdCgnUE9TVCcsIHBhdGgsIG9wdGlvbnMpLAogIH07Cn0K', 'base64'), 'UTF8'), false, 0),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/auth/sessionStore.ts', 'typescript', convert_from(decode('aW1wb3J0IEFzeW5jU3RvcmFnZSBmcm9tICdAcmVhY3QtbmF0aXZlLWFzeW5jLXN0b3JhZ2UvYXN5bmMtc3RvcmFnZSc7CmltcG9ydCB0eXBlIHsgU2Vzc2lvbiwgVG9rZW5zIH0gZnJvbSAnLi4vdHlwZXMnOwoKZXhwb3J0IGNvbnN0IFNFU1NJT05fS0VZID0gJ3Nlc3Npb24udjEnOwoKdHlwZSBMaXN0ZW5lciA9IChzZXNzaW9uOiBTZXNzaW9uIHwgbnVsbCkgPT4gdm9pZDsKCmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvblN0b3JlIHsKICAvKiogUmVzb2x2ZXMgb25jZSB0aGUgc2F2ZWQgc2Vzc2lvbiBoYXMgYmVlbiByZWFkIGZyb20gc3RvcmFnZS4gKi8KICByZWFkeTogUHJvbWlzZTx2b2lkPjsKICBnZXQoKTogU2Vzc2lvbiB8IG51bGw7CiAgc2lnbkluKHNlc3Npb246IFNlc3Npb24pOiBQcm9taXNlPHZvaWQ+OwogIC8qKiBTdG9yZXMgbmV3IHRva2VucyBhZnRlciBhIHJlZnJlc2ggKHJlZnJlc2ggdG9rZW5zIHJvdGF0ZTogdGhlIG9sZCBvbmUgc3RvcHMgd29ya2luZykuICovCiAgc2F2ZVRva2Vucyh0b2tlbnM6IFRva2Vucyk6IFByb21pc2U8dm9pZD47CiAgc2lnbk91dCgpOiBQcm9taXNlPHZvaWQ+OwogIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXIpOiAoKSA9PiB2b2lkOwp9CgovKiogVGhlIHNpZ25lZC1pbiBzZXNzaW9uLCBwZXJzaXN0ZWQgaW4gQXN5bmNTdG9yYWdlIHNvIHRoZSB1c2VyIHN0YXlzIHNpZ25lZCBpbiBhY3Jvc3MgbGF1bmNoZXMuICovCmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZXNzaW9uU3RvcmUoKTogU2Vzc2lvblN0b3JlIHsKICBsZXQgc2Vzc2lvbjogU2Vzc2lvbiB8IG51bGwgPSBudWxsOwogIGNvbnN0IGxpc3RlbmVycyA9IG5ldyBTZXQ8TGlzdGVuZXI+KCk7CiAgY29uc3QgZW1pdCA9ICgpID0+IGxpc3RlbmVycy5mb3JFYWNoKChsKSA9PiBsKHNlc3Npb24pKTsKCiAgY29uc3QgcGVyc2lzdCA9IGFzeW5jICgpID0+IHsKICAgIGlmIChzZXNzaW9uKSBhd2FpdCBBc3luY1N0b3JhZ2Uuc2V0SXRlbShTRVNTSU9OX0tFWSwgSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbikpOwogICAgZWxzZSBhd2FpdCBBc3luY1N0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX0tFWSk7CiAgfTsKCiAgY29uc3QgcmVhZHkgPSBBc3luY1N0b3JhZ2UuZ2V0SXRlbShTRVNTSU9OX0tFWSkudGhlbigocmF3KSA9PiB7CiAgICBzZXNzaW9uID0gcmF3ID8gKEpTT04ucGFyc2UocmF3KSBhcyBTZXNzaW9uKSA6IG51bGw7CiAgICBlbWl0KCk7CiAgfSk7CgogIHJldHVybiB7CiAgICByZWFkeSwKICAgIGdldDogKCkgPT4gc2Vzc2lvbiwKICAgIGFzeW5jIHNpZ25JbihuZXh0KSB7CiAgICAgIHNlc3Npb24gPSBuZXh0OwogICAgICBlbWl0KCk7CiAgICAgIGF3YWl0IHBlcnNpc3QoKTsKICAgIH0sCiAgICBhc3luYyBzYXZlVG9rZW5zKHRva2VucykgewogICAgICBpZiAoIXNlc3Npb24pIHJldHVybjsKICAgICAgc2Vzc2lvbiA9IHsgLi4uc2Vzc2lvbiwgdG9rZW5zIH07CiAgICAgIGVtaXQoKTsKICAgICAgYXdhaXQgcGVyc2lzdCgpOwogICAgfSwKICAgIGFzeW5jIHNpZ25PdXQoKSB7CiAgICAgIHNlc3Npb24gPSBudWxsOwogICAgICBlbWl0KCk7CiAgICAgIGF3YWl0IHBlcnNpc3QoKTsKICAgIH0sCiAgICBzdWJzY3JpYmUobGlzdGVuZXIpIHsKICAgICAgbGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7CiAgICAgIHJldHVybiAoKSA9PiBsaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTsKICAgIH0sCiAgfTsKfQo=', 'base64'), 'UTF8'), false, 1),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/hooks/useApprovals.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnOwppbXBvcnQgdHlwZSB7IEh0dHBDbGllbnQgfSBmcm9tICcuLi9hcGkvaHR0cENsaWVudCc7CmltcG9ydCB0eXBlIHsgQXBwcm92YWwsIEZpbHRlciB9IGZyb20gJy4uL3R5cGVzJzsKCi8qKiBMb2FkcyB0aGUgYXBwcm92YWxzIGZvciB0aGUgc2VsZWN0ZWQgZmlsdGVyIGNoaXAgKEFsbCAvIFVyZ2VudCAvIE1pbmUpLiAqLwpleHBvcnQgZnVuY3Rpb24gdXNlQXBwcm92YWxzKGNsaWVudDogSHR0cENsaWVudCwgZmlsdGVyOiBGaWx0ZXIpIHsKICBjb25zdCBbaXRlbXMsIHNldEl0ZW1zXSA9IHVzZVN0YXRlPEFwcHJvdmFsW10+KFtdKTsKICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTsKICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpOwogIGNvbnN0IGNvbnRyb2xsZXIgPSB1c2VSZWYobmV3IEFib3J0Q29udHJvbGxlcigpKTsKCiAgdXNlRWZmZWN0KCgpID0+IHsKICAgIHNldExvYWRpbmcodHJ1ZSk7CiAgICBzZXRFcnJvcihudWxsKTsKICAgIGNsaWVudAogICAgICAuZ2V0PEFwcHJvdmFsW10+KGAvYXBwcm92YWxzP2ZpbHRlcj0ke2ZpbHRlcn1gLCB7IHNpZ25hbDogY29udHJvbGxlci5jdXJyZW50LnNpZ25hbCB9KQogICAgICAudGhlbigoZGF0YSkgPT4gewogICAgICAgIHNldEl0ZW1zKGRhdGEpOwogICAgICAgIHNldExvYWRpbmcoZmFsc2UpOwogICAgICB9KQogICAgICAuY2F0Y2goKGU6IEVycm9yKSA9PiB7CiAgICAgICAgaWYgKGUubmFtZSA9PT0gJ0Fib3J0RXJyb3InKSByZXR1cm47CiAgICAgICAgc2V0RXJyb3IoZS5tZXNzYWdlKTsKICAgICAgICBzZXRMb2FkaW5nKGZhbHNlKTsKICAgICAgfSk7CiAgICByZXR1cm4gKCkgPT4gY29udHJvbGxlci5jdXJyZW50LmFib3J0KCk7CiAgfSwgW2NsaWVudCwgZmlsdGVyXSk7CgogIHJldHVybiB7IGl0ZW1zLCBsb2FkaW5nLCBlcnJvciB9Owp9Cg==', 'base64'), 'UTF8'), false, 2),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/state/approvals.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZVJlZHVjZXIsIHVzZVJlZiB9IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHR5cGUgeyBIdHRwQ2xpZW50IH0gZnJvbSAnLi4vYXBpL2h0dHBDbGllbnQnOwppbXBvcnQgdHlwZSB7IEFwcHJvdmFsLCBEZWNpc2lvbiB9IGZyb20gJy4uL3R5cGVzJzsKCmV4cG9ydCB0eXBlIEFwcHJvdmFsc0FjdGlvbiA9CiAgfCB7IHR5cGU6ICdMT0FERUQnOyBpdGVtczogQXBwcm92YWxbXSB9CiAgfCB7IHR5cGU6ICdTRVRfU1RBVFVTJzsgaWQ6IHN0cmluZzsgc3RhdHVzOiBBcHByb3ZhbFsnc3RhdHVzJ10gfQogIHwgeyB0eXBlOiAnUkVTVE9SRSc7IGl0ZW1zOiBBcHByb3ZhbFtdIH07CgpleHBvcnQgZnVuY3Rpb24gYXBwcm92YWxzUmVkdWNlcihzdGF0ZTogQXBwcm92YWxbXSwgYWN0aW9uOiBBcHByb3ZhbHNBY3Rpb24pOiBBcHByb3ZhbFtdIHsKICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7CiAgICBjYXNlICdMT0FERUQnOgogICAgICByZXR1cm4gYWN0aW9uLml0ZW1zOwogICAgY2FzZSAnU0VUX1NUQVRVUyc6CiAgICAgIHJldHVybiBzdGF0ZS5tYXAoKGEpID0+IChhLmlkID09PSBhY3Rpb24uaWQgPyB7IC4uLmEsIHN0YXR1czogYWN0aW9uLnN0YXR1cywgZXJyb3I6IHVuZGVmaW5lZCB9IDogYSkpOwogICAgY2FzZSAnUkVTVE9SRSc6CiAgICAgIHJldHVybiBhY3Rpb24uaXRlbXM7CiAgICBkZWZhdWx0OgogICAgICByZXR1cm4gc3RhdGU7CiAgfQp9CgovKioKICogQXBwcm92ZSAvIHJlamVjdCB3aXRoIGFuIG9wdGltaXN0aWMgdXBkYXRlOiB0aGUgcm93IGNoYW5nZXMgaW1tZWRpYXRlbHkgYW5kIGlzIHB1dCBiYWNrIGlmIHRoZQogKiBzZXJ2ZXIgY2FsbCBmYWlscy4gQXBwcm92ZXJzIG9mdGVuIGFjdGlvbiBzZXZlcmFsIHJvd3MgaW4gcXVpY2sgc3VjY2Vzc2lvbi4KICovCmV4cG9ydCBmdW5jdGlvbiB1c2VBcHByb3ZhbERlY2lzaW9ucyhhcGk6IFBpY2s8SHR0cENsaWVudCwgJ3Bvc3QnPiwgaW5pdGlhbDogQXBwcm92YWxbXSkgewogIGNvbnN0IFtpdGVtcywgZGlzcGF0Y2hdID0gdXNlUmVkdWNlcihhcHByb3ZhbHNSZWR1Y2VyLCBpbml0aWFsKTsKICBjb25zdCBsYXRlc3QgPSB1c2VSZWYoaXRlbXMpOwogIGxhdGVzdC5jdXJyZW50ID0gaXRlbXM7CgogIGNvbnN0IGRlY2lkZSA9IHVzZUNhbGxiYWNrKAogICAgYXN5bmMgKGlkOiBzdHJpbmcsIGRlY2lzaW9uOiBEZWNpc2lvbikgPT4gewogICAgICBjb25zdCBzbmFwc2hvdCA9IGxhdGVzdC5jdXJyZW50OwogICAgICBkaXNwYXRjaCh7IHR5cGU6ICdTRVRfU1RBVFVTJywgaWQsIHN0YXR1czogZGVjaXNpb24gfSk7CiAgICAgIHRyeSB7CiAgICAgICAgYXdhaXQgYXBpLnBvc3QoYC9hcHByb3ZhbHMvJHtpZH0vJHtkZWNpc2lvbiA9PT0gJ0FQUFJPVkVEJyA/ICdhcHByb3ZlJyA6ICdyZWplY3QnfWApOwogICAgICB9IGNhdGNoIHsKICAgICAgICBkaXNwYXRjaCh7IHR5cGU6ICdSRVNUT1JFJywgaXRlbXM6IHNuYXBzaG90IH0pOwogICAgICB9CiAgICB9LAogICAgW2FwaV0sCiAgKTsKCiAgcmV0dXJuIHsgaXRlbXMsIGRlY2lkZSwgbG9hZDogKG5leHQ6IEFwcHJvdmFsW10pID0+IGRpc3BhdGNoKHsgdHlwZTogJ0xPQURFRCcsIGl0ZW1zOiBuZXh0IH0pIH07Cn0K', 'base64'), 'UTF8'), false, 3),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/screens/ApprovalsList.tsx', 'typescript', convert_from(decode('aW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnOwppbXBvcnQgeyBGbGF0TGlzdCwgUHJlc3NhYmxlLCBTdHlsZVNoZWV0LCBUZXh0LCBUZXh0SW5wdXQsIFZpZXcgfSBmcm9tICdyZWFjdC1uYXRpdmUnOwppbXBvcnQgdHlwZSB7IEFwcHJvdmFsLCBEZWNpc2lvbiB9IGZyb20gJy4uL3R5cGVzJzsKCmV4cG9ydCBjb25zdCBST1dfSEVJR0hUID0gNzI7CmV4cG9ydCBjb25zdCBTRVBBUkFUT1JfSEVJR0hUID0gMTsKCi8qKiBMZXRzIEZsYXRMaXN0IGp1bXAgc3RyYWlnaHQgdG8gYSByb3cgKGRlZXAgbGlua3MgY2FsbCBzY3JvbGxUb0luZGV4KS4gKi8KZXhwb3J0IGZ1bmN0aW9uIGdldEl0ZW1MYXlvdXQoX2RhdGE6IEFycmF5TGlrZTxBcHByb3ZhbD4gfCBudWxsIHwgdW5kZWZpbmVkLCBpbmRleDogbnVtYmVyKSB7CiAgcmV0dXJuIHsgbGVuZ3RoOiBST1dfSEVJR0hULCBvZmZzZXQ6IFJPV19IRUlHSFQgKiBpbmRleCwgaW5kZXggfTsKfQoKY29uc3QgcnVwZWVzID0gKG1pbm9yOiBudW1iZXIpID0+IGDigrkkeyhtaW5vciAvIDEwMCkudG9GaXhlZCgyKX1gOwoKZnVuY3Rpb24gQXBwcm92YWxSb3coewogIGl0ZW0sCiAgZXhwYW5kZWQsCiAgb25Ub2dnbGUsCiAgb25EZWNpZGUsCn06IHsKICBpdGVtOiBBcHByb3ZhbDsKICBleHBhbmRlZDogYm9vbGVhbjsKICBvblRvZ2dsZTogKCkgPT4gdm9pZDsKICBvbkRlY2lkZTogKGlkOiBzdHJpbmcsIGRlY2lzaW9uOiBEZWNpc2lvbiwgY29tbWVudDogc3RyaW5nKSA9PiB2b2lkOwp9KSB7CiAgY29uc3QgW2NvbW1lbnQsIHNldENvbW1lbnRdID0gdXNlU3RhdGUoJycpOwogIHJldHVybiAoCiAgICA8VmlldyBzdHlsZT17c3R5bGVzLnJvd30gdGVzdElEPXtgcm93LSR7aXRlbS5pZH1gfT4KICAgICAgPFByZXNzYWJsZSB0ZXN0SUQ9e2Byb3ctJHtpdGVtLmlkfS10b2dnbGVgfSBvblByZXNzPXtvblRvZ2dsZX0+CiAgICAgICAgPFRleHQgc3R5bGU9e3N0eWxlcy50aXRsZX0+e2l0ZW0udGl0bGV9PC9UZXh0PgogICAgICAgIDxUZXh0PntydXBlZXMoaXRlbS5hbW91bnRNaW5vcil9PC9UZXh0PgogICAgICA8L1ByZXNzYWJsZT4KICAgICAge2V4cGFuZGVkICYmICgKICAgICAgICA8VmlldyB0ZXN0SUQ9e2Byb3ctJHtpdGVtLmlkfS1kZXRhaWxzYH0+CiAgICAgICAgICA8VGV4dD5SZXF1ZXN0ZWQgYnkge2l0ZW0ucmVxdWVzdGVkQnl9PC9UZXh0PgogICAgICAgICAgPFRleHRJbnB1dAogICAgICAgICAgICB0ZXN0SUQ9e2Byb3ctJHtpdGVtLmlkfS1jb21tZW50YH0KICAgICAgICAgICAgdmFsdWU9e2NvbW1lbnR9CiAgICAgICAgICAgIG9uQ2hhbmdlVGV4dD17c2V0Q29tbWVudH0KICAgICAgICAgICAgcGxhY2Vob2xkZXI9IkNvbW1lbnQgKHJlcXVpcmVkIHRvIHJlamVjdCkiCiAgICAgICAgICAvPgogICAgICAgICAgPFByZXNzYWJsZSB0ZXN0SUQ9e2Byb3ctJHtpdGVtLmlkfS1hcHByb3ZlYH0gb25QcmVzcz17KCkgPT4gb25EZWNpZGUoaXRlbS5pZCwgJ0FQUFJPVkVEJywgY29tbWVudCl9PgogICAgICAgICAgICA8VGV4dD5BcHByb3ZlPC9UZXh0PgogICAgICAgICAgPC9QcmVzc2FibGU+CiAgICAgICAgICA8UHJlc3NhYmxlCiAgICAgICAgICAgIHRlc3RJRD17YHJvdy0ke2l0ZW0uaWR9LXJlamVjdGB9CiAgICAgICAgICAgIGRpc2FibGVkPXtjb21tZW50LnRyaW0oKSA9PT0gJyd9CiAgICAgICAgICAgIG9uUHJlc3M9eygpID0+IG9uRGVjaWRlKGl0ZW0uaWQsICdSRUpFQ1RFRCcsIGNvbW1lbnQpfQogICAgICAgICAgPgogICAgICAgICAgICA8VGV4dD5SZWplY3Q8L1RleHQ+CiAgICAgICAgICA8L1ByZXNzYWJsZT4KICAgICAgICA8L1ZpZXc+CiAgICAgICl9CiAgICA8L1ZpZXc+CiAgKTsKfQoKY29uc3QgU2VwYXJhdG9yID0gKCkgPT4gPFZpZXcgc3R5bGU9e3N0eWxlcy5zZXBhcmF0b3J9IC8+OwoKZXhwb3J0IGZ1bmN0aW9uIEFwcHJvdmFsc0xpc3QoewogIGl0ZW1zLAogIG9uRGVjaWRlLAp9OiB7CiAgaXRlbXM6IEFwcHJvdmFsW107CiAgb25EZWNpZGU6IChpZDogc3RyaW5nLCBkZWNpc2lvbjogRGVjaXNpb24sIGNvbW1lbnQ6IHN0cmluZykgPT4gdm9pZDsKfSkgewogIGNvbnN0IFtleHBhbmRlZCwgc2V0RXhwYW5kZWRdID0gdXNlU3RhdGU8bnVtYmVyIHwgbnVsbD4obnVsbCk7CiAgcmV0dXJuICgKICAgIDxGbGF0TGlzdAogICAgICB0ZXN0SUQ9ImFwcHJvdmFscyIKICAgICAgZGF0YT17aXRlbXN9CiAgICAgIGtleUV4dHJhY3Rvcj17KF9pdGVtLCBpbmRleCkgPT4gU3RyaW5nKGluZGV4KX0KICAgICAgZ2V0SXRlbUxheW91dD17Z2V0SXRlbUxheW91dH0KICAgICAgSXRlbVNlcGFyYXRvckNvbXBvbmVudD17U2VwYXJhdG9yfQogICAgICByZW5kZXJJdGVtPXsoeyBpdGVtLCBpbmRleCB9KSA9PiAoCiAgICAgICAgPEFwcHJvdmFsUm93CiAgICAgICAgICBpdGVtPXtpdGVtfQogICAgICAgICAgZXhwYW5kZWQ9e2V4cGFuZGVkID09PSBpbmRleH0KICAgICAgICAgIG9uVG9nZ2xlPXsoKSA9PiBzZXRFeHBhbmRlZChleHBhbmRlZCA9PT0gaW5kZXggPyBudWxsIDogaW5kZXgpfQogICAgICAgICAgb25EZWNpZGU9e29uRGVjaWRlfQogICAgICAgIC8+CiAgICAgICl9CiAgICAvPgogICk7Cn0KCmNvbnN0IHN0eWxlcyA9IFN0eWxlU2hlZXQuY3JlYXRlKHsKICByb3c6IHsgbWluSGVpZ2h0OiBST1dfSEVJR0hULCBwYWRkaW5nSG9yaXpvbnRhbDogMTYsIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyB9LAogIHRpdGxlOiB7IGZvbnRXZWlnaHQ6ICc2MDAnIH0sCiAgc2VwYXJhdG9yOiB7IGhlaWdodDogU0VQQVJBVE9SX0hFSUdIVCwgYmFja2dyb3VuZENvbG9yOiAnI0UyRThGMCcgfSwKfSk7Cg==', 'base64'), 'UTF8'), false, 4),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/types.ts', 'typescript', convert_from(decode('ZXhwb3J0IHR5cGUgQXBwcm92YWxTdGF0dXMgPSAnUEVORElORycgfCAnQVBQUk9WRUQnIHwgJ1JFSkVDVEVEJzsKZXhwb3J0IHR5cGUgRGVjaXNpb24gPSAnQVBQUk9WRUQnIHwgJ1JFSkVDVEVEJzsKZXhwb3J0IHR5cGUgRmlsdGVyID0gJ2FsbCcgfCAndXJnZW50JyB8ICdtaW5lJzsKCmV4cG9ydCBpbnRlcmZhY2UgQXBwcm92YWwgewogIGlkOiBzdHJpbmc7CiAgdGl0bGU6IHN0cmluZzsKICAvKiogQW1vdW50IGluIHBhaXNlLiAqLwogIGFtb3VudE1pbm9yOiBudW1iZXI7CiAgdXJnZW50OiBib29sZWFuOwogIHJlcXVlc3RlZEJ5OiBzdHJpbmc7CiAgc3RhdHVzOiBBcHByb3ZhbFN0YXR1czsKICAvKiogU2V0IHdoZW4gdGhlIGxhc3QgZGVjaXNpb24gb24gdGhpcyBpdGVtIGZhaWxlZC4gKi8KICBlcnJvcj86IHN0cmluZzsKfQoKZXhwb3J0IGludGVyZmFjZSBUb2tlbnMgewogIGFjY2Vzc1Rva2VuOiBzdHJpbmc7CiAgcmVmcmVzaFRva2VuOiBzdHJpbmc7Cn0KCmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbiB7CiAgdXNlcklkOiBzdHJpbmc7CiAgdG9rZW5zOiBUb2tlbnM7Cn0KCi8qKiBUaGUgc3Vic2V0IG9mIGZldGNoKCkgdGhlIGFwcCB1c2VzIChpbmplY3RlZCBzbyBpdCBjYW4gYmUgZmFrZWQgaW4gdGVzdHMpLiAqLwpleHBvcnQgdHlwZSBGZXRjaExpa2UgPSAoCiAgdXJsOiBzdHJpbmcsCiAgaW5pdD86IHsgbWV0aG9kPzogc3RyaW5nOyBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjsgYm9keT86IHN0cmluZzsgc2lnbmFsPzogQWJvcnRTaWduYWwgfSwKKSA9PiBQcm9taXNlPHsgc3RhdHVzOiBudW1iZXI7IG9rOiBib29sZWFuOyBqc29uKCk6IFByb21pc2U8dW5rbm93bj4gfT47CgpleHBvcnQgY2xhc3MgSHR0cEVycm9yIGV4dGVuZHMgRXJyb3IgewogIGNvbnN0cnVjdG9yKAogICAgcmVhZG9ubHkgc3RhdHVzOiBudW1iZXIsCiAgICBtZXNzYWdlOiBzdHJpbmcsCiAgKSB7CiAgICBzdXBlcihtZXNzYWdlKTsKICAgIHRoaXMubmFtZSA9ICdIdHRwRXJyb3InOwogIH0KfQo=', 'base64'), 'UTF8'), true, 5),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/httpClient.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgYXN5bmNTdG9yYWdlIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHsgY3JlYXRlSHR0cENsaWVudCB9IGZyb20gJy4uL3NyYy9hcGkvaHR0cENsaWVudCc7CmltcG9ydCB7IGNyZWF0ZVNlc3Npb25TdG9yZSwgU0VTU0lPTl9LRVkgfSBmcm9tICcuLi9zcmMvYXV0aC9zZXNzaW9uU3RvcmUnOwppbXBvcnQgeyBjcmVhdGVGYWtlU2VydmVyLCBlbGFwc2UgfSBmcm9tICcuL3N1cHBvcnQvZmFrZVNlcnZlcic7Cgpjb25zdCBCQVNFID0gJ2h0dHBzOi8vYXBpLnp5Y3VzLnRlc3QnOwoKYXN5bmMgZnVuY3Rpb24gc2V0dXAob3B0aW9uczogeyByZWZyZXNoRmFpbHM/OiBib29sZWFuOyByZWZyZXNoTXM/OiBudW1iZXI7IGZvcmJpZGRlbj86IHN0cmluZ1tdIH0gPSB7fSkgewogIGFzeW5jU3RvcmFnZS5zZWVkKHsKICAgIFtTRVNTSU9OX0tFWV06IEpTT04uc3RyaW5naWZ5KHsgdXNlcklkOiAndTEnLCB0b2tlbnM6IHsgYWNjZXNzVG9rZW46ICdhY2Nlc3MtMCcsIHJlZnJlc2hUb2tlbjogJ3JlZnJlc2gtMCcgfSB9KSwKICB9KTsKICAvLyBUaGUgc2F2ZWQgYWNjZXNzIHRva2VuIGhhcyBleHBpcmVkOyB0aGUgcmVmcmVzaCB0b2tlbiBpcyBzdGlsbCB2YWxpZC4KICBjb25zdCBzZXJ2ZXIgPSBjcmVhdGVGYWtlU2VydmVyKHsgYmFzZVVybDogQkFTRSwgYWNjZXNzOiAnZXhwaXJlZCcsIHJlZnJlc2g6ICdyZWZyZXNoLTAnLCAuLi5vcHRpb25zIH0pOwogIGNvbnN0IHNlc3Npb24gPSBjcmVhdGVTZXNzaW9uU3RvcmUoKTsKICBhd2FpdCBzZXNzaW9uLnJlYWR5OwogIGNvbnN0IG9uTG9nb3V0ID0gamVzdC5mbigpOwogIGNvbnN0IGNsaWVudCA9IGNyZWF0ZUh0dHBDbGllbnQoeyBiYXNlVXJsOiBCQVNFLCBmZXRjaEltcGw6IHNlcnZlci5mZXRjaEltcGwsIHNlc3Npb24sIHJlZnJlc2g6IHNlcnZlci5yZWZyZXNoLCBvbkxvZ291dCB9KTsKICByZXR1cm4geyBzZXJ2ZXIsIHNlc3Npb24sIGNsaWVudCwgb25Mb2dvdXQgfTsKfQoKYWZ0ZXJFYWNoKCgpID0+IHsKICBqZXN0LnVzZVJlYWxUaW1lcnMoKTsKfSk7CgpkZXNjcmliZSgndG9rZW4gcmVmcmVzaCcsICgpID0+IHsKICBpdCgncmV0cmllcyB3aXRoIHRoZSBuZXcgYWNjZXNzIHRva2VuIGFuZCBzdG9yZXMgdGhlIHJvdGF0ZWQgdG9rZW5zJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBzZXJ2ZXIsIGNsaWVudCwgc2Vzc2lvbiB9ID0gYXdhaXQgc2V0dXAoKTsKICAgIGF3YWl0IGV4cGVjdChjbGllbnQuZ2V0KCcvYXBwcm92YWxzJykpLnJlc29sdmVzLnRvRXF1YWwoeyBwYXRoOiAnL2FwcHJvdmFscycgfSk7CiAgICBleHBlY3Qoc2VydmVyLmNhbGxzLm1hcCgoYykgPT4gYy5hdXRoKSkudG9FcXVhbChbJ0JlYXJlciBhY2Nlc3MtMCcsICdCZWFyZXIgYWNjZXNzLTEnXSk7CiAgICBleHBlY3Qoc2Vzc2lvbi5nZXQoKT8udG9rZW5zKS50b0VxdWFsKHsgYWNjZXNzVG9rZW46ICdhY2Nlc3MtMScsIHJlZnJlc2hUb2tlbjogJ3JlZnJlc2gtMScgfSk7CiAgICBleHBlY3QoSlNPTi5wYXJzZShhc3luY1N0b3JhZ2Uuc25hcHNob3QoKVtTRVNTSU9OX0tFWV0hKS50b2tlbnMucmVmcmVzaFRva2VuKS50b0JlKCdyZWZyZXNoLTEnKTsKICB9KTsKCiAgaXQoJ3JlZnJlc2hlcyBvbmNlIHdoZW4gc2V2ZXJhbCByZXF1ZXN0cyBnZXQgNDAxIGF0IHRoZSBzYW1lIHRpbWUnLCBhc3luYyAoKSA9PiB7CiAgICBqZXN0LnVzZUZha2VUaW1lcnMoKTsKICAgIC8vIEEgdmVyeSBzbG93IHJlZnJlc2ggKDMwIHMgb24gYSBiYWQgbmV0d29yayk6IHRoZSBvdGhlciByZXF1ZXN0cyBtdXN0IHdhaXQgZm9yIGl0LCBob3dldmVyIGxvbmcuCiAgICBjb25zdCB7IHNlcnZlciwgY2xpZW50LCBvbkxvZ291dCB9ID0gYXdhaXQgc2V0dXAoeyByZWZyZXNoTXM6IDMwXzAwMCB9KTsKICAgIGNvbnN0IGFsbCA9IFByb21pc2UuYWxsKFtjbGllbnQuZ2V0KCcvYScpLCBjbGllbnQuZ2V0KCcvYicpLCBjbGllbnQuZ2V0KCcvYycpXSk7CiAgICBhd2FpdCBlbGFwc2UoMzFfMDAwKTsKICAgIGF3YWl0IGV4cGVjdChhbGwpLnJlc29sdmVzLnRvRXF1YWwoW3sgcGF0aDogJy9hJyB9LCB7IHBhdGg6ICcvYicgfSwgeyBwYXRoOiAnL2MnIH1dKTsKICAgIGV4cGVjdChzZXJ2ZXIucmVmcmVzaCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpOwogICAgZXhwZWN0KG9uTG9nb3V0KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpOwogIH0pOwoKICBpdCgnZG9lcyBub3QgcmVmcmVzaCBhZ2FpbiBmb3IgYSByZXF1ZXN0IHRoYXQgd2FzIHNlbnQgYmVmb3JlIHRoZSByZWZyZXNoIGZpbmlzaGVkJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBzZXJ2ZXIsIGNsaWVudCwgb25Mb2dvdXQgfSA9IGF3YWl0IHNldHVwKCk7CiAgICBzZXJ2ZXIuaG9sZCgnL3Nsb3cnKTsKICAgIGNvbnN0IHNsb3cgPSBjbGllbnQuZ2V0KCcvc2xvdycpOyAvLyBzZW50IHdpdGggdGhlIG9sZCB0b2tlbjsgaXRzIDQwMSBhcnJpdmVzIGxhdGUKICAgIGF3YWl0IGNsaWVudC5nZXQoJy9mYXN0Jyk7CiAgICBzZXJ2ZXIucmVsZWFzZSgnL3Nsb3cnKTsKICAgIGF3YWl0IGV4cGVjdChzbG93KS5yZXNvbHZlcy50b0VxdWFsKHsgcGF0aDogJy9zbG93JyB9KTsKICAgIGV4cGVjdChzZXJ2ZXIucmVmcmVzaCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpOwogICAgZXhwZWN0KG9uTG9nb3V0KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpOwogIH0pOwoKICBpdCgncmVmcmVzaGVzIGFnYWluIHdoZW4gdGhlIG5ldyBhY2Nlc3MgdG9rZW4gZXhwaXJlcyBsYXRlcicsIGFzeW5jICgpID0+IHsKICAgIGNvbnN0IHsgc2VydmVyLCBjbGllbnQsIHNlc3Npb24sIG9uTG9nb3V0IH0gPSBhd2FpdCBzZXR1cCgpOwogICAgYXdhaXQgY2xpZW50LmdldCgnL2EnKTsKICAgIHNlcnZlci5leHBpcmUoKTsgLy8gdGhlIHRva2VuIGZyb20gdGhlIGZpcnN0IHJlZnJlc2ggaGFzIGV4cGlyZWQgdG9vCiAgICBhd2FpdCBleHBlY3QoY2xpZW50LmdldCgnL2InKSkucmVzb2x2ZXMudG9FcXVhbCh7IHBhdGg6ICcvYicgfSk7CiAgICBleHBlY3Qoc2VydmVyLnJlZnJlc2gpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygyKTsKICAgIGV4cGVjdChzZXNzaW9uLmdldCgpPy50b2tlbnMpLnRvRXF1YWwoeyBhY2Nlc3NUb2tlbjogJ2FjY2Vzcy0yJywgcmVmcmVzaFRva2VuOiAncmVmcmVzaC0yJyB9KTsKICAgIGV4cGVjdChvbkxvZ291dCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsKICB9KTsKCiAgaXQoJ3JldHJpZXMgYSByZWZ1c2VkIHJlcXVlc3Qgb25seSBvbmNlJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBzZXJ2ZXIsIGNsaWVudCB9ID0gYXdhaXQgc2V0dXAoeyBmb3JiaWRkZW46IFsnL2FkbWluLW9ubHknXSB9KTsKICAgIGF3YWl0IGV4cGVjdChjbGllbnQuZ2V0KCcvYWRtaW4tb25seScpKS5yZWplY3RzLnRvVGhyb3coKTsKICAgIGV4cGVjdChzZXJ2ZXIucmVmcmVzaCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpOwogICAgZXhwZWN0KHNlcnZlci5jYWxscy5maWx0ZXIoKGMpID0+IGMucGF0aCA9PT0gJy9hZG1pbi1vbmx5JykpLnRvSGF2ZUxlbmd0aCgyKTsKICB9KTsKCiAgaXQoJ2xvZ3Mgb3V0IGV4YWN0bHkgb25jZSB3aGVuIHRoZSByZWZyZXNoIHRva2VuIGlzIHJlamVjdGVkJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBjbGllbnQsIG9uTG9nb3V0IH0gPSBhd2FpdCBzZXR1cCh7IHJlZnJlc2hGYWlsczogdHJ1ZSB9KTsKICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoW2NsaWVudC5nZXQoJy9hJyksIGNsaWVudC5nZXQoJy9iJyksIGNsaWVudC5nZXQoJy9jJyldKTsKICAgIGV4cGVjdChyZXN1bHRzLm1hcCgocikgPT4gci5zdGF0dXMpKS50b0VxdWFsKFsncmVqZWN0ZWQnLCAncmVqZWN0ZWQnLCAncmVqZWN0ZWQnXSk7CiAgICBleHBlY3Qob25Mb2dvdXQpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 6),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/sessionStore.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgYXN5bmNTdG9yYWdlIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHsgY3JlYXRlSHR0cENsaWVudCB9IGZyb20gJy4uL3NyYy9hcGkvaHR0cENsaWVudCc7CmltcG9ydCB7IGNyZWF0ZVNlc3Npb25TdG9yZSwgU0VTU0lPTl9LRVkgfSBmcm9tICcuLi9zcmMvYXV0aC9zZXNzaW9uU3RvcmUnOwppbXBvcnQgeyBjcmVhdGVGYWtlU2VydmVyLCBlbGFwc2UgfSBmcm9tICcuL3N1cHBvcnQvZmFrZVNlcnZlcic7Cgpjb25zdCBCQVNFID0gJ2h0dHBzOi8vYXBpLnp5Y3VzLnRlc3QnOwpjb25zdCBzYXZlZCA9IHsgdXNlcklkOiAndTEnLCB0b2tlbnM6IHsgYWNjZXNzVG9rZW46ICdhY2Nlc3MtMCcsIHJlZnJlc2hUb2tlbjogJ3JlZnJlc2gtMCcgfSB9OwovKiogU3RvcmFnZSByZWFkcyBhbmQgd3JpdGVzIHRha2UgdGhpcyBsb25nIChhIHNsb3cgZGV2aWNlLCBvbiBwdXJwb3NlIG11Y2ggbG9uZ2VyIHRoYW4gbmVlZGVkKS4gKi8KY29uc3QgU1RPUkFHRV9NUyA9IDMwXzAwMDsKCmRlc2NyaWJlKCdzZXNzaW9uIHBlcnNpc3RlbmNlIChjb2xkIHN0YXJ0KScsICgpID0+IHsKICBiZWZvcmVFYWNoKCgpID0+IHsKICAgIGplc3QudXNlRmFrZVRpbWVycygpOwogICAgYXN5bmNTdG9yYWdlLnNlZWQoeyBbU0VTU0lPTl9LRVldOiBKU09OLnN0cmluZ2lmeShzYXZlZCkgfSk7CiAgICBhc3luY1N0b3JhZ2Uuc2V0TGF0ZW5jeShTVE9SQUdFX01TKTsKICB9KTsKICBhZnRlckVhY2goKCkgPT4gewogICAgamVzdC51c2VSZWFsVGltZXJzKCk7CiAgfSk7CgogIGl0KCd0aGUgZmlyc3QgcmVxdWVzdCBhZnRlciBsYXVuY2ggY2FycmllcyB0aGUgc2F2ZWQgYWNjZXNzIHRva2VuJywgYXN5bmMgKCkgPT4gewogICAgY29uc3Qgc2VydmVyID0gY3JlYXRlRmFrZVNlcnZlcih7IGJhc2VVcmw6IEJBU0UsIGFjY2VzczogJ2FjY2Vzcy0wJywgcmVmcmVzaDogJ3JlZnJlc2gtMCcgfSk7CiAgICBjb25zdCBzZXNzaW9uID0gY3JlYXRlU2Vzc2lvblN0b3JlKCk7IC8vIHN0aWxsIHJlYWRpbmcgZnJvbSBzdG9yYWdlCiAgICBjb25zdCBjbGllbnQgPSBjcmVhdGVIdHRwQ2xpZW50KHsKICAgICAgYmFzZVVybDogQkFTRSwKICAgICAgZmV0Y2hJbXBsOiBzZXJ2ZXIuZmV0Y2hJbXBsLAogICAgICBzZXNzaW9uLAogICAgICByZWZyZXNoOiBzZXJ2ZXIucmVmcmVzaCwKICAgICAgb25Mb2dvdXQ6IGplc3QuZm4oKSwKICAgIH0pOwogICAgY29uc3QgbWUgPSBjbGllbnQuZ2V0KCcvbWUnKTsKICAgIGF3YWl0IGVsYXBzZShTVE9SQUdFX01TICsgMV8wMDApOwogICAgYXdhaXQgZXhwZWN0KG1lKS5yZXNvbHZlcy50b0VxdWFsKHsgcGF0aDogJy9tZScgfSk7CiAgICBleHBlY3Qoc2VydmVyLmNhbGxzWzBdPy5hdXRoKS50b0JlKCdCZWFyZXIgYWNjZXNzLTAnKTsKICAgIGV4cGVjdChzZXJ2ZXIucmVmcmVzaCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsKICB9KTsKCiAgaXQoJ2tlZXBzIHRva2VucyB0aGF0IHdlcmUgc2F2ZWQgd2hpbGUgdGhlIHNlc3Npb24gd2FzIHN0aWxsIGxvYWRpbmcnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBzZXNzaW9uID0gY3JlYXRlU2Vzc2lvblN0b3JlKCk7CiAgICBjb25zdCBmcmVzaCA9IHsgYWNjZXNzVG9rZW46ICdhY2Nlc3MtOScsIHJlZnJlc2hUb2tlbjogJ3JlZnJlc2gtOScgfTsKICAgIGNvbnN0IHNhdmluZyA9IHNlc3Npb24uc2F2ZVRva2VucyhmcmVzaCk7CiAgICBhd2FpdCBlbGFwc2UoMiAqIFNUT1JBR0VfTVMgKyAxXzAwMCk7CiAgICBhd2FpdCBzYXZpbmc7CiAgICBhd2FpdCBzZXNzaW9uLnJlYWR5OwogICAgZXhwZWN0KHNlc3Npb24uZ2V0KCkpLnRvRXF1YWwoeyB1c2VySWQ6ICd1MScsIHRva2VuczogZnJlc2ggfSk7CiAgICBleHBlY3QoSlNPTi5wYXJzZShhc3luY1N0b3JhZ2Uuc25hcHNob3QoKVtTRVNTSU9OX0tFWV0hKSkudG9FcXVhbCh7IHVzZXJJZDogJ3UxJywgdG9rZW5zOiBmcmVzaCB9KTsKICB9KTsKCiAgaXQoJ3NpZ25pbmcgb3V0IHJlbW92ZXMgdGhlIHNhdmVkIHNlc3Npb24nLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBzZXNzaW9uID0gY3JlYXRlU2Vzc2lvblN0b3JlKCk7CiAgICBhd2FpdCBlbGFwc2UoU1RPUkFHRV9NUyArIDFfMDAwKTsKICAgIGF3YWl0IHNlc3Npb24ucmVhZHk7CiAgICBjb25zdCBvdXQgPSBzZXNzaW9uLnNpZ25PdXQoKTsKICAgIGF3YWl0IGVsYXBzZShTVE9SQUdFX01TICsgMV8wMDApOwogICAgYXdhaXQgb3V0OwogICAgZXhwZWN0KHNlc3Npb24uZ2V0KCkpLnRvQmVOdWxsKCk7CiAgICBleHBlY3QoYXN5bmNTdG9yYWdlLnNuYXBzaG90KClbU0VTU0lPTl9LRVldKS50b0JlVW5kZWZpbmVkKCk7CiAgfSk7CgogIGl0KCdzaWduaW5nIG91dCB3aGlsZSB0aGUgc2Vzc2lvbiBpcyBzdGlsbCBsb2FkaW5nIGtlZXBzIHRoZSB1c2VyIHNpZ25lZCBvdXQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBzZXNzaW9uID0gY3JlYXRlU2Vzc2lvblN0b3JlKCk7CiAgICBjb25zdCBvdXQgPSBzZXNzaW9uLnNpZ25PdXQoKTsKICAgIGF3YWl0IGVsYXBzZSgyICogU1RPUkFHRV9NUyArIDFfMDAwKTsKICAgIGF3YWl0IG91dDsKICAgIGF3YWl0IHNlc3Npb24ucmVhZHk7CiAgICBleHBlY3Qoc2Vzc2lvbi5nZXQoKSkudG9CZU51bGwoKTsKICAgIGV4cGVjdChhc3luY1N0b3JhZ2Uuc25hcHNob3QoKVtTRVNTSU9OX0tFWV0pLnRvQmVVbmRlZmluZWQoKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 7),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/useApprovals.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCByZW5kZXJIb29rIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHR5cGUgeyBIdHRwQ2xpZW50LCBSZXF1ZXN0T3B0aW9ucyB9IGZyb20gJy4uL3NyYy9hcGkvaHR0cENsaWVudCc7CmltcG9ydCB7IHVzZUFwcHJvdmFscyB9IGZyb20gJy4uL3NyYy9ob29rcy91c2VBcHByb3ZhbHMnOwppbXBvcnQgdHlwZSB7IEFwcHJvdmFsLCBGaWx0ZXIgfSBmcm9tICcuLi9zcmMvdHlwZXMnOwoKY29uc3QgaXRlbSA9IChpZDogc3RyaW5nLCB1cmdlbnQgPSBmYWxzZSk6IEFwcHJvdmFsID0+ICh7CiAgaWQsCiAgdGl0bGU6IGBSZXF1aXNpdGlvbiAke2lkfWAsCiAgYW1vdW50TWlub3I6IDEyNV8wMDAsCiAgdXJnZW50LAogIHJlcXVlc3RlZEJ5OiAnUHJpeWEnLAogIHN0YXR1czogJ1BFTkRJTkcnLAp9KTsKY29uc3QgQUxMID0gW2l0ZW0oJzEnKSwgaXRlbSgnMicsIHRydWUpLCBpdGVtKCczJyldOwpjb25zdCBVUkdFTlQgPSBbaXRlbSgnMicsIHRydWUpXTsKY29uc3QgTUlORSA9IFtpdGVtKCczJyldOwoKLyoqIEEgZmFrZSBjbGllbnQgd2hvc2UgcmVzcG9uc2VzIHRoZSB0ZXN0IHJlbGVhc2VzIGJ5IGhhbmQsIGluIGFueSBvcmRlci4gKi8KZnVuY3Rpb24gZmFrZUNsaWVudCgpIHsKICBjb25zdCByZXF1ZXN0cyA9IG5ldyBNYXA8c3RyaW5nLCB7IHJlc29sdmU6IChkYXRhOiB1bmtub3duKSA9PiB2b2lkOyByZWplY3Q6IChlOiBFcnJvcikgPT4gdm9pZDsgc2lnbmFsPzogQWJvcnRTaWduYWwgfT4oKTsKICBjb25zdCBnZXQgPSBqZXN0LmZuKAogICAgKHBhdGg6IHN0cmluZywgb3B0aW9uczogUmVxdWVzdE9wdGlvbnMgPSB7fSkgPT4KICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gewogICAgICAgIGNvbnN0IGFib3J0ID0gKCkgPT4gcmVqZWN0KE9iamVjdC5hc3NpZ24obmV3IEVycm9yKCdBYm9ydGVkJyksIHsgbmFtZTogJ0Fib3J0RXJyb3InIH0pKTsKICAgICAgICBpZiAob3B0aW9ucy5zaWduYWw/LmFib3J0ZWQpIHJldHVybiBhYm9ydCgpOwogICAgICAgIG9wdGlvbnMuc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0KTsKICAgICAgICByZXF1ZXN0cy5zZXQocGF0aCwgeyByZXNvbHZlLCByZWplY3QsIHNpZ25hbDogb3B0aW9ucy5zaWduYWwgfSk7CiAgICAgIH0pLAogICk7CiAgcmV0dXJuIHsKICAgIGNsaWVudDogeyBnZXQsIHBvc3Q6IGplc3QuZm4oKSB9IGFzIHVua25vd24gYXMgSHR0cENsaWVudCwKICAgIHNpZ25hbEZvcjogKHBhdGg6IHN0cmluZykgPT4gcmVxdWVzdHMuZ2V0KHBhdGgpPy5zaWduYWwsCiAgICBhc3luYyByZXNwb25kKHBhdGg6IHN0cmluZywgZGF0YTogdW5rbm93bikgewogICAgICBjb25zdCByZXF1ZXN0ID0gcmVxdWVzdHMuZ2V0KHBhdGgpOwogICAgICBpZiAoIXJlcXVlc3QpIHRocm93IG5ldyBFcnJvcihgTm8gcmVxdWVzdCBmb3IgJHtwYXRofSByZWFjaGVkIHRoZSBzZXJ2ZXIgKGNhbmNlbGxlZCBiZWZvcmUgaXQgd2FzIHNlbnQ/KWApOwogICAgICBhd2FpdCBhY3QoYXN5bmMgKCkgPT4gcmVxdWVzdC5yZXNvbHZlKGRhdGEpKTsKICAgIH0sCiAgICBhc3luYyBmYWlsKHBhdGg6IHN0cmluZywgZXJyb3I6IEVycm9yKSB7CiAgICAgIGNvbnN0IHJlcXVlc3QgPSByZXF1ZXN0cy5nZXQocGF0aCk7CiAgICAgIGlmICghcmVxdWVzdCkgdGhyb3cgbmV3IEVycm9yKGBObyByZXF1ZXN0IGZvciAke3BhdGh9IHJlYWNoZWQgdGhlIHNlcnZlciAoY2FuY2VsbGVkIGJlZm9yZSBpdCB3YXMgc2VudD8pYCk7CiAgICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiByZXF1ZXN0LnJlamVjdChlcnJvcikpOwogICAgfSwKICB9Owp9Cgpjb25zdCByZW5kZXIgPSAoYXBpOiBSZXR1cm5UeXBlPHR5cGVvZiBmYWtlQ2xpZW50PikgPT4KICByZW5kZXJIb29rKCh7IGZpbHRlciB9OiB7IGZpbHRlcjogRmlsdGVyIH0pID0+IHVzZUFwcHJvdmFscyhhcGkuY2xpZW50LCBmaWx0ZXIpLCB7CiAgICBpbml0aWFsUHJvcHM6IHsgZmlsdGVyOiAnYWxsJyB9LAogIH0pOwoKZGVzY3JpYmUoJ3VzZUFwcHJvdmFscycsICgpID0+IHsKICBpdCgnbG9hZHMgdGhlIGxpc3QgZm9yIGVhY2ggZmlsdGVyIGNoaXAnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBhcGkgPSBmYWtlQ2xpZW50KCk7CiAgICBjb25zdCB7IHJlc3VsdCwgcmVyZW5kZXIgfSA9IHJlbmRlcihhcGkpOwogICAgYXdhaXQgYXBpLnJlc3BvbmQoJy9hcHByb3ZhbHM/ZmlsdGVyPWFsbCcsIEFMTCk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQpLnRvTWF0Y2hPYmplY3QoeyBpdGVtczogQUxMLCBsb2FkaW5nOiBmYWxzZSwgZXJyb3I6IG51bGwgfSk7CgogICAgcmVyZW5kZXIoeyBmaWx0ZXI6ICd1cmdlbnQnIH0pOwogICAgZXhwZWN0KHJlc3VsdC5jdXJyZW50LmxvYWRpbmcpLnRvQmUodHJ1ZSk7CiAgICBhd2FpdCBhcGkucmVzcG9uZCgnL2FwcHJvdmFscz9maWx0ZXI9dXJnZW50JywgVVJHRU5UKTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudCkudG9NYXRjaE9iamVjdCh7IGl0ZW1zOiBVUkdFTlQsIGxvYWRpbmc6IGZhbHNlLCBlcnJvcjogbnVsbCB9KTsKCiAgICByZXJlbmRlcih7IGZpbHRlcjogJ21pbmUnIH0pOwogICAgYXdhaXQgYXBpLnJlc3BvbmQoJy9hcHByb3ZhbHM/ZmlsdGVyPW1pbmUnLCBNSU5FKTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudCkudG9NYXRjaE9iamVjdCh7IGl0ZW1zOiBNSU5FLCBsb2FkaW5nOiBmYWxzZSwgZXJyb3I6IG51bGwgfSk7CiAgfSk7CgogIGl0KCdpZ25vcmVzIGEgc2xvdyByZXNwb25zZSBmb3IgYSBmaWx0ZXIgdGhhdCBpcyBubyBsb25nZXIgc2VsZWN0ZWQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBhcGkgPSBmYWtlQ2xpZW50KCk7CiAgICBjb25zdCB7IHJlc3VsdCwgcmVyZW5kZXIgfSA9IHJlbmRlcihhcGkpOwogICAgYXdhaXQgYXBpLnJlc3BvbmQoJy9hcHByb3ZhbHM/ZmlsdGVyPWFsbCcsIEFMTCk7CiAgICByZXJlbmRlcih7IGZpbHRlcjogJ3VyZ2VudCcgfSk7CiAgICByZXJlbmRlcih7IGZpbHRlcjogJ21pbmUnIH0pOwogICAgYXdhaXQgYWN0KGFzeW5jICgpID0+IHt9KTsgLy8gdGhlIGNhbmNlbGxlZCByZXF1ZXN0IHNldHRsZXMKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5sb2FkaW5nKS50b0JlKHRydWUpOyAvLyBzdGlsbCBsb2FkaW5nICdtaW5lJwogICAgYXdhaXQgYXBpLnJlc3BvbmQoJy9hcHByb3ZhbHM/ZmlsdGVyPW1pbmUnLCBNSU5FKTsKICAgIGF3YWl0IGFwaS5yZXNwb25kKCcvYXBwcm92YWxzP2ZpbHRlcj11cmdlbnQnLCBVUkdFTlQpOyAvLyBhcnJpdmVzIGxhdGUKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5pdGVtcykudG9FcXVhbChNSU5FKTsKICAgIGV4cGVjdChhcGkuc2lnbmFsRm9yKCcvYXBwcm92YWxzP2ZpbHRlcj11cmdlbnQnKT8uYWJvcnRlZCkudG9CZSh0cnVlKTsKICB9KTsKCiAgaXQoJ3Nob3dzIGFuIGVycm9yIHdoZW4gdGhlIGxpc3QgZmFpbHMgdG8gbG9hZCwgYW5kIGNsZWFycyBpdCBvbiB0aGUgbmV4dCBsb2FkJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgYXBpID0gZmFrZUNsaWVudCgpOwogICAgY29uc3QgeyByZXN1bHQsIHJlcmVuZGVyIH0gPSByZW5kZXIoYXBpKTsKICAgIGF3YWl0IGFwaS5mYWlsKCcvYXBwcm92YWxzP2ZpbHRlcj1hbGwnLCBuZXcgRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQpLnRvTWF0Y2hPYmplY3QoeyBpdGVtczogW10sIGxvYWRpbmc6IGZhbHNlLCBlcnJvcjogJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnIH0pOwoKICAgIHJlcmVuZGVyKHsgZmlsdGVyOiAndXJnZW50JyB9KTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5lcnJvcikudG9CZU51bGwoKTsKICAgIGF3YWl0IGFwaS5yZXNwb25kKCcvYXBwcm92YWxzP2ZpbHRlcj11cmdlbnQnLCBVUkdFTlQpOwogICAgZXhwZWN0KHJlc3VsdC5jdXJyZW50KS50b01hdGNoT2JqZWN0KHsgaXRlbXM6IFVSR0VOVCwgbG9hZGluZzogZmFsc2UsIGVycm9yOiBudWxsIH0pOwogIH0pOwoKICBpdCgnY2FuY2VscyB0aGUgcmVxdWVzdCB3aGVuIHRoZSBzY3JlZW4gZ29lcyBhd2F5JywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgYXBpID0gZmFrZUNsaWVudCgpOwogICAgY29uc3QgeyB1bm1vdW50IH0gPSByZW5kZXIoYXBpKTsKICAgIHVubW91bnQoKTsKICAgIGV4cGVjdChhcGkuc2lnbmFsRm9yKCcvYXBwcm92YWxzP2ZpbHRlcj1hbGwnKT8uYWJvcnRlZCkudG9CZSh0cnVlKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 8),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/approvals.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCBkZWZlcnJlZCwgZmx1c2hQcm9taXNlcywgcmVuZGVySG9vayB9IGZyb20gJ0Bjb2RlYXJlbmEvdGVzdC11dGlscyc7CmltcG9ydCB7IHVzZUFwcHJvdmFsRGVjaXNpb25zIH0gZnJvbSAnLi4vc3JjL3N0YXRlL2FwcHJvdmFscyc7CmltcG9ydCB0eXBlIHsgQXBwcm92YWwgfSBmcm9tICcuLi9zcmMvdHlwZXMnOwoKY29uc3QgbWFrZSA9IChpZDogc3RyaW5nLCBzdGF0dXM6IEFwcHJvdmFsWydzdGF0dXMnXSA9ICdQRU5ESU5HJyk6IEFwcHJvdmFsID0+ICh7CiAgaWQsCiAgdGl0bGU6IGBJbnZvaWNlICR7aWR9YCwKICBhbW91bnRNaW5vcjogOTlfOTAwLAogIHVyZ2VudDogZmFsc2UsCiAgcmVxdWVzdGVkQnk6ICdBcmp1bicsCiAgc3RhdHVzLAp9KTsKCmZ1bmN0aW9uIHNlcnZlcldpdGhNYW51YWxSZXBsaWVzKCkgewogIGNvbnN0IHJlcGxpZXMgPSBuZXcgTWFwPHN0cmluZywgUmV0dXJuVHlwZTx0eXBlb2YgZGVmZXJyZWQ+PigpOwogIGNvbnN0IHBvc3QgPSBqZXN0LmZuKChwYXRoOiBzdHJpbmcpID0+IHsKICAgIGNvbnN0IHJlcGx5ID0gZGVmZXJyZWQoKTsKICAgIHJlcGxpZXMuc2V0KHBhdGgsIHJlcGx5KTsKICAgIHJldHVybiByZXBseS5wcm9taXNlOwogIH0pOwogIHJldHVybiB7IGFwaTogeyBwb3N0IH0gYXMgbmV2ZXIsIHJlcGx5OiAocGF0aDogc3RyaW5nKSA9PiByZXBsaWVzLmdldChwYXRoKSEgfTsKfQoKY29uc3Qgc3RhdHVzT2YgPSAoaXRlbXM6IEFwcHJvdmFsW10sIGlkOiBzdHJpbmcpID0+IGl0ZW1zLmZpbmQoKGEpID0+IGEuaWQgPT09IGlkKTsKCmRlc2NyaWJlKCdvcHRpbWlzdGljIGFwcHJvdmUgLyByZWplY3QnLCAoKSA9PiB7CiAgaXQoJ3JvbGxzIGJhY2sgb25seSB0aGUgZGVjaXNpb24gdGhhdCBmYWlsZWQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCB7IGFwaSwgcmVwbHkgfSA9IHNlcnZlcldpdGhNYW51YWxSZXBsaWVzKCk7CiAgICBjb25zdCB7IHJlc3VsdCB9ID0gcmVuZGVySG9vaygoKSA9PiB1c2VBcHByb3ZhbERlY2lzaW9ucyhhcGksIFttYWtlKCdBJyksIG1ha2UoJ0InKSwgbWFrZSgnQycpXSkpOwogICAgYWN0KCgpID0+IHZvaWQgcmVzdWx0LmN1cnJlbnQuZGVjaWRlKCdBJywgJ0FQUFJPVkVEJykpOwogICAgYWN0KCgpID0+IHZvaWQgcmVzdWx0LmN1cnJlbnQuZGVjaWRlKCdCJywgJ0FQUFJPVkVEJykpOwogICAgZXhwZWN0KHJlc3VsdC5jdXJyZW50Lml0ZW1zLm1hcCgoYSkgPT4gYS5zdGF0dXMpKS50b0VxdWFsKFsnQVBQUk9WRUQnLCAnQVBQUk9WRUQnLCAnUEVORElORyddKTsKCiAgICBhd2FpdCBhY3QoYXN5bmMgKCkgPT4gcmVwbHkoJy9hcHByb3ZhbHMvQS9hcHByb3ZlJykucmVqZWN0KG5ldyBFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKSk7CiAgICBhd2FpdCBhY3QoYXN5bmMgKCkgPT4gcmVwbHkoJy9hcHByb3ZhbHMvQi9hcHByb3ZlJykucmVzb2x2ZSh7fSkpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwoKICAgIGV4cGVjdChzdGF0dXNPZihyZXN1bHQuY3VycmVudC5pdGVtcywgJ0EnKSkudG9NYXRjaE9iamVjdCh7IHN0YXR1czogJ1BFTkRJTkcnLCBlcnJvcjogZXhwZWN0LmFueShTdHJpbmcpIH0pOwogICAgZXhwZWN0KHN0YXR1c09mKHJlc3VsdC5jdXJyZW50Lml0ZW1zLCAnQicpKS50b01hdGNoT2JqZWN0KHsgc3RhdHVzOiAnQVBQUk9WRUQnIH0pOwogICAgZXhwZWN0KHN0YXR1c09mKHJlc3VsdC5jdXJyZW50Lml0ZW1zLCAnQicpPy5lcnJvcikudG9CZVVuZGVmaW5lZCgpOwogIH0pOwoKICBpdCgna2VlcHMgYSBsYXRlciBzdWNjZXNzIHdoZW4gYW4gZWFybGllciByZXF1ZXN0IGZhaWxzIGFmdGVyd2FyZHMnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCB7IGFwaSwgcmVwbHkgfSA9IHNlcnZlcldpdGhNYW51YWxSZXBsaWVzKCk7CiAgICBjb25zdCB7IHJlc3VsdCB9ID0gcmVuZGVySG9vaygoKSA9PiB1c2VBcHByb3ZhbERlY2lzaW9ucyhhcGksIFttYWtlKCdBJyksIG1ha2UoJ0InKV0pKTsKICAgIGFjdCgoKSA9PiB2b2lkIHJlc3VsdC5jdXJyZW50LmRlY2lkZSgnQScsICdSRUpFQ1RFRCcpKTsKICAgIGFjdCgoKSA9PiB2b2lkIHJlc3VsdC5jdXJyZW50LmRlY2lkZSgnQicsICdBUFBST1ZFRCcpKTsKICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiByZXBseSgnL2FwcHJvdmFscy9CL2FwcHJvdmUnKS5yZXNvbHZlKHt9KSk7CiAgICBhd2FpdCBhY3QoYXN5bmMgKCkgPT4gcmVwbHkoJy9hcHByb3ZhbHMvQS9yZWplY3QnKS5yZWplY3QobmV3IEVycm9yKCd0aW1lb3V0JykpKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5pdGVtcy5tYXAoKGEpID0+IGEuc3RhdHVzKSkudG9FcXVhbChbJ1BFTkRJTkcnLCAnQVBQUk9WRUQnXSk7CiAgfSk7CgogIGl0KCdhIGZhaWxlZCBjaGFuZ2UgcmV0dXJucyB0aGUgcm93IHRvIHRoZSBzdGF0dXMgaXQgaGFkIGJlZm9yZScsIGFzeW5jICgpID0+IHsKICAgIGNvbnN0IHsgYXBpLCByZXBseSB9ID0gc2VydmVyV2l0aE1hbnVhbFJlcGxpZXMoKTsKICAgIGNvbnN0IHsgcmVzdWx0IH0gPSByZW5kZXJIb29rKCgpID0+IHVzZUFwcHJvdmFsRGVjaXNpb25zKGFwaSwgW21ha2UoJ0EnLCAnQVBQUk9WRUQnKV0pKTsKICAgIGFjdCgoKSA9PiB2b2lkIHJlc3VsdC5jdXJyZW50LmRlY2lkZSgnQScsICdSRUpFQ1RFRCcpKTsKICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiByZXBseSgnL2FwcHJvdmFscy9BL3JlamVjdCcpLnJlamVjdChuZXcgRXJyb3IoJzQwOSBDb25mbGljdCcpKSk7CiAgICBhd2FpdCBmbHVzaFByb21pc2VzKCk7CiAgICBleHBlY3Qoc3RhdHVzT2YocmVzdWx0LmN1cnJlbnQuaXRlbXMsICdBJykpLnRvTWF0Y2hPYmplY3QoeyBzdGF0dXM6ICdBUFBST1ZFRCcsIGVycm9yOiBleHBlY3QuYW55KFN0cmluZykgfSk7CiAgfSk7CgogIGl0KCdhIGZhaWxlZCBjaGFuZ2UgYWZ0ZXIgYW4gZWFybGllciBzdWNjZXNzIHJldHVybnMgdG8gdGhlIHN0YXR1cyB0aGF0IHN1Y2NlZWRlZCcsIGFzeW5jICgpID0+IHsKICAgIGNvbnN0IHsgYXBpLCByZXBseSB9ID0gc2VydmVyV2l0aE1hbnVhbFJlcGxpZXMoKTsKICAgIGNvbnN0IHsgcmVzdWx0IH0gPSByZW5kZXJIb29rKCgpID0+IHVzZUFwcHJvdmFsRGVjaXNpb25zKGFwaSwgW21ha2UoJ0EnKV0pKTsKICAgIGFjdCgoKSA9PiB2b2lkIHJlc3VsdC5jdXJyZW50LmRlY2lkZSgnQScsICdBUFBST1ZFRCcpKTsKICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiByZXBseSgnL2FwcHJvdmFscy9BL2FwcHJvdmUnKS5yZXNvbHZlKHt9KSk7CiAgICBhY3QoKCkgPT4gdm9pZCByZXN1bHQuY3VycmVudC5kZWNpZGUoJ0EnLCAnUkVKRUNURUQnKSk7CiAgICBhd2FpdCBhY3QoYXN5bmMgKCkgPT4gcmVwbHkoJy9hcHByb3ZhbHMvQS9yZWplY3QnKS5yZWplY3QobmV3IEVycm9yKCc0MDkgQ29uZmxpY3QnKSkpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogICAgZXhwZWN0KHN0YXR1c09mKHJlc3VsdC5jdXJyZW50Lml0ZW1zLCAnQScpKS50b01hdGNoT2JqZWN0KHsgc3RhdHVzOiAnQVBQUk9WRUQnLCBlcnJvcjogZXhwZWN0LmFueShTdHJpbmcpIH0pOwogIH0pOwoKICBpdCgncm9sbHMgYmFjayB0byB0aGUgc3RhdHVzIGZyb20gdGhlIGxhdGVzdCBsaXN0LCBub3QgdGhlIGZpcnN0IG9uZScsIGFzeW5jICgpID0+IHsKICAgIGNvbnN0IHsgYXBpLCByZXBseSB9ID0gc2VydmVyV2l0aE1hbnVhbFJlcGxpZXMoKTsKICAgIGNvbnN0IHsgcmVzdWx0IH0gPSByZW5kZXJIb29rKCgpID0+IHVzZUFwcHJvdmFsRGVjaXNpb25zKGFwaSwgW21ha2UoJ0EnKV0pKTsKICAgIGFjdCgoKSA9PiByZXN1bHQuY3VycmVudC5sb2FkKFttYWtlKCdBJywgJ0FQUFJPVkVEJyldKSk7IC8vIHJlbG9hZGVkOiBhcHByb3ZlZCBlbHNld2hlcmUKICAgIGFjdCgoKSA9PiB2b2lkIHJlc3VsdC5jdXJyZW50LmRlY2lkZSgnQScsICdSRUpFQ1RFRCcpKTsKICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiByZXBseSgnL2FwcHJvdmFscy9BL3JlamVjdCcpLnJlamVjdChuZXcgRXJyb3IoJ3RpbWVvdXQnKSkpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogICAgZXhwZWN0KHN0YXR1c09mKHJlc3VsdC5jdXJyZW50Lml0ZW1zLCAnQScpKS50b01hdGNoT2JqZWN0KHsgc3RhdHVzOiAnQVBQUk9WRUQnLCBlcnJvcjogZXhwZWN0LmFueShTdHJpbmcpIH0pOwogIH0pOwp9KTsK', 'base64'), 'UTF8'), true, 9),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/ApprovalsList.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgZmlyZUV2ZW50LCByZW5kZXIgfSBmcm9tICdAY29kZWFyZW5hL3Rlc3QtdXRpbHMnOwppbXBvcnQgeyBBcHByb3ZhbHNMaXN0LCBnZXRJdGVtTGF5b3V0IH0gZnJvbSAnLi4vc3JjL3NjcmVlbnMvQXBwcm92YWxzTGlzdCc7CmltcG9ydCB0eXBlIHsgQXBwcm92YWwgfSBmcm9tICcuLi9zcmMvdHlwZXMnOwoKY29uc3QgbWFrZSA9IChpZDogc3RyaW5nKTogQXBwcm92YWwgPT4gKHsKICBpZCwKICB0aXRsZTogJ0xhcHRvcHMgZm9yIHRoZSBQdW5lIG9mZmljZScsIC8vIHRoZSBzYW1lIG9uIGV2ZXJ5IHJvdzogcm93cyBhcmUgdG9sZCBhcGFydCBieSBpZAogIGFtb3VudE1pbm9yOiA1MDBfMDAwLAogIHVyZ2VudDogZmFsc2UsCiAgcmVxdWVzdGVkQnk6ICdNZWVyYScsCiAgc3RhdHVzOiAnUEVORElORycsCn0pOwpjb25zdCBbQSwgQiwgQ10gPSBbbWFrZSgnQScpLCBtYWtlKCdCJyksIG1ha2UoJ0MnKV07CgpkZXNjcmliZSgnQXBwcm92YWxzTGlzdCcsICgpID0+IHsKICBpdCgnc2Nyb2xsVG9JbmRleCBsYW5kcyBvbiB0aGUgcmlnaHQgcm93IChyb3dzIGFyZSBzZXBhcmF0ZWQgYnkgYSAxIHB0IGxpbmUpJywgKCkgPT4gewogICAgZXhwZWN0KGdldEl0ZW1MYXlvdXQoW10sIDApKS50b01hdGNoT2JqZWN0KHsgb2Zmc2V0OiAwLCBpbmRleDogMCB9KTsKICAgIC8vIFRoZSBkZXNpZ246IDcyIHB0IHJvd3Mgd2l0aCBhIDEgcHQgbGluZSBiZXR3ZWVuIHRoZW0uCiAgICBleHBlY3QoZ2V0SXRlbUxheW91dChbXSwgNykpLnRvTWF0Y2hPYmplY3QoeyBvZmZzZXQ6IDcgKiA3MywgaW5kZXg6IDcgfSk7CiAgICAvLyBBIGNlbGwncyBsZW5ndGggbWF5IG9yIG1heSBub3QgY291bnQgdGhlIHNlcGFyYXRvciBiZWxvdyBpdDogYm90aCBhcmUgY29ycmVjdC4KICAgIGZvciAoY29uc3QgaW5kZXggb2YgWzAsIDddKSB7CiAgICAgIGV4cGVjdChbNzIsIDczXSkudG9Db250YWluKGdldEl0ZW1MYXlvdXQoW10sIGluZGV4KS5sZW5ndGgpOwogICAgfQogIH0pOwoKICBpdCgna2VlcHMgdGhlIGV4cGFuZGVkIHJvdyBleHBhbmRlZCB3aGVuIGEgcm93IGFib3ZlIGl0IGRpc2FwcGVhcnMnLCAoKSA9PiB7CiAgICBjb25zdCBvbkRlY2lkZSA9IGplc3QuZm4oKTsKICAgIGNvbnN0IHsgZ2V0QnlUZXN0SWQsIHF1ZXJ5QnlUZXN0SWQsIHJlcmVuZGVyIH0gPSByZW5kZXIoPEFwcHJvdmFsc0xpc3QgaXRlbXM9e1tBLCBCLCBDXX0gb25EZWNpZGU9e29uRGVjaWRlfSAvPik7CiAgICBmaXJlRXZlbnQucHJlc3MoZ2V0QnlUZXN0SWQoJ3Jvdy1CLXRvZ2dsZScpKTsKICAgIGV4cGVjdChxdWVyeUJ5VGVzdElkKCdyb3ctQi1kZXRhaWxzJykpLm5vdC50b0JlTnVsbCgpOwoKICAgIHJlcmVuZGVyKDxBcHByb3ZhbHNMaXN0IGl0ZW1zPXtbQiwgQ119IG9uRGVjaWRlPXtvbkRlY2lkZX0gLz4pOyAvLyBBIHdhcyBhcHByb3ZlZCBlbHNld2hlcmUKICAgIGV4cGVjdChxdWVyeUJ5VGVzdElkKCdyb3ctQi1kZXRhaWxzJykpLm5vdC50b0JlTnVsbCgpOwogICAgZXhwZWN0KHF1ZXJ5QnlUZXN0SWQoJ3Jvdy1DLWRldGFpbHMnKSkudG9CZU51bGwoKTsKICB9KTsKCiAgaXQoImtlZXBzIGVhY2ggcm93J3MgY29tbWVudCB3aXRoIGl0cyBvd24gcm93IiwgKCkgPT4gewogICAgY29uc3Qgb25EZWNpZGUgPSBqZXN0LmZuKCk7CiAgICBjb25zdCB7IGdldEJ5VGVzdElkLCByZXJlbmRlciB9ID0gcmVuZGVyKDxBcHByb3ZhbHNMaXN0IGl0ZW1zPXtbQSwgQiwgQ119IG9uRGVjaWRlPXtvbkRlY2lkZX0gLz4pOwogICAgZmlyZUV2ZW50LnByZXNzKGdldEJ5VGVzdElkKCdyb3ctQi10b2dnbGUnKSk7CiAgICBmaXJlRXZlbnQuY2hhbmdlVGV4dChnZXRCeVRlc3RJZCgncm93LUItY29tbWVudCcpLCAnT3ZlciBidWRnZXQnKTsKCiAgICByZXJlbmRlcig8QXBwcm92YWxzTGlzdCBpdGVtcz17W0IsIENdfSBvbkRlY2lkZT17b25EZWNpZGV9IC8+KTsKICAgIGV4cGVjdChnZXRCeVRlc3RJZCgncm93LUItY29tbWVudCcpLnByb3BzLnZhbHVlKS50b0JlKCdPdmVyIGJ1ZGdldCcpOwogICAgZmlyZUV2ZW50LnByZXNzKGdldEJ5VGVzdElkKCdyb3ctQi1yZWplY3QnKSk7CiAgICBleHBlY3Qob25EZWNpZGUpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdCJywgJ1JFSkVDVEVEJywgJ092ZXIgYnVkZ2V0Jyk7CiAgfSk7Cn0pOwo=', 'base64'), 'UTF8'), true, 10),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/support/fakeServer.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgSHR0cEVycm9yLCB0eXBlIEZldGNoTGlrZSwgdHlwZSBUb2tlbnMgfSBmcm9tICcuLi8uLi9zcmMvdHlwZXMnOwoKLyoqCiAqIEEgZmFrZSBBUEkgc2VydmVyIGZvciB0aGUgSFRUUCBjbGllbnQgdGVzdHMuIEFjY2VzcyB0b2tlbnMgYXJlIGNoZWNrZWQgd2hlbiBhIHJlcXVlc3QgYXJyaXZlczsKICogcmVmcmVzaCB0b2tlbnMgcm90YXRlIG9uIGV2ZXJ5IHN1Y2Nlc3NmdWwgcmVmcmVzaCAodGhlIHByZXZpb3VzIHJlZnJlc2ggdG9rZW4gc3RvcHMgd29ya2luZykuCiAqLwpleHBvcnQgZnVuY3Rpb24gY3JlYXRlRmFrZVNlcnZlcihvcHRpb25zOiB7CiAgYmFzZVVybDogc3RyaW5nOwogIGFjY2Vzczogc3RyaW5nOwogIHJlZnJlc2g6IHN0cmluZzsKICByZWZyZXNoRmFpbHM/OiBib29sZWFuOwogIC8qKiBIb3cgbG9uZyBhIHJlZnJlc2ggdGFrZXMgKGEgc2xvdyBuZXR3b3JrIGNhbiB0YWtlIHNlY29uZHMpLiAqLwogIHJlZnJlc2hNcz86IG51bWJlcjsKICAvKiogUGF0aHMgdGhhdCBhbnN3ZXIgNDAxIGV2ZW4gd2l0aCBhIHZhbGlkIGFjY2VzcyB0b2tlbiAoZS5nLiBubyBwZXJtaXNzaW9uKS4gKi8KICBmb3JiaWRkZW4/OiBzdHJpbmdbXTsKfSkgewogIGxldCB2YWxpZDogVG9rZW5zID0geyBhY2Nlc3NUb2tlbjogb3B0aW9ucy5hY2Nlc3MsIHJlZnJlc2hUb2tlbjogb3B0aW9ucy5yZWZyZXNoIH07CiAgbGV0IGdlbmVyYXRpb24gPSAwOwogIGNvbnN0IGNhbGxzOiB7IHBhdGg6IHN0cmluZzsgYXV0aDogc3RyaW5nIHwgdW5kZWZpbmVkIH1bXSA9IFtdOwogIGNvbnN0IGhlbGQgPSBuZXcgTWFwPHN0cmluZywgQXJyYXk8KCkgPT4gdm9pZD4+KCk7CiAgY29uc3QgaG9sZGluZyA9IG5ldyBTZXQ8c3RyaW5nPigpOwoKICBjb25zdCByZWZyZXNoID0gamVzdC5mbihhc3luYyAocmVmcmVzaFRva2VuOiBzdHJpbmcpOiBQcm9taXNlPFRva2Vucz4gPT4gewogICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgb3B0aW9ucy5yZWZyZXNoTXMgPz8gNSkpOwogICAgaWYgKG9wdGlvbnMucmVmcmVzaEZhaWxzIHx8IHJlZnJlc2hUb2tlbiAhPT0gdmFsaWQucmVmcmVzaFRva2VuKSB7CiAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoNDAxLCAnaW52YWxpZF9ncmFudCcpOwogICAgfQogICAgZ2VuZXJhdGlvbiArPSAxOwogICAgdmFsaWQgPSB7IGFjY2Vzc1Rva2VuOiBgYWNjZXNzLSR7Z2VuZXJhdGlvbn1gLCByZWZyZXNoVG9rZW46IGByZWZyZXNoLSR7Z2VuZXJhdGlvbn1gIH07CiAgICByZXR1cm4geyAuLi52YWxpZCB9OwogIH0pOwoKICBjb25zdCBmZXRjaEltcGwgPSBqZXN0LmZuPEZldGNoTGlrZT4oYXN5bmMgKHVybCwgaW5pdCA9IHt9KSA9PiB7CiAgICBjb25zdCBwYXRoID0gdXJsLnJlcGxhY2Uob3B0aW9ucy5iYXNlVXJsLCAnJyk7CiAgICBjb25zdCBhdXRoID0gaW5pdC5oZWFkZXJzPy5BdXRob3JpemF0aW9uOwogICAgY2FsbHMucHVzaCh7IHBhdGgsIGF1dGggfSk7CiAgICBpZiAoY2FsbHMuZmlsdGVyKChjKSA9PiBjLnBhdGggPT09IHBhdGgpLmxlbmd0aCA+IDEwKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtwYXRofSB3YXMgcmVxdWVzdGVkIG1vcmUgdGhhbiAxMCB0aW1lcyAocmV0cnlpbmcgd2l0aG91dCBhIGxpbWl0PylgKTsKICAgIH0KICAgIGNvbnN0IGZvcmJpZGRlbiA9IG9wdGlvbnMuZm9yYmlkZGVuPy5pbmNsdWRlcyhwYXRoKSA/PyBmYWxzZTsKICAgIGNvbnN0IHN0YXR1cyA9ICFmb3JiaWRkZW4gJiYgYXV0aCA9PT0gYEJlYXJlciAke3ZhbGlkLmFjY2Vzc1Rva2VufWAgPyAyMDAgOiA0MDE7CiAgICBpZiAoaG9sZGluZy5oYXMocGF0aCkpIHsKICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IGhlbGQuc2V0KHBhdGgsIFsuLi4oaGVsZC5nZXQocGF0aCkgPz8gW10pLCByZXNvbHZlXSkpOwogICAgfQogICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMSkpOwogICAgcmV0dXJuIHsgc3RhdHVzLCBvazogc3RhdHVzID09PSAyMDAsIGpzb246IGFzeW5jICgpID0+ICh7IHBhdGggfSkgfTsKICB9KTsKCiAgcmV0dXJuIHsKICAgIGZldGNoSW1wbCwKICAgIHJlZnJlc2gsCiAgICBjYWxscywKICAgIC8qKiBEZWxheXMgcmVzcG9uc2VzIGZvciBgcGF0aGAgKHRoZSByZXF1ZXN0IGlzIGNoZWNrZWQgb24gYXJyaXZhbCkgdW50aWwgcmVsZWFzZShwYXRoKS4gKi8KICAgIGhvbGQ6IChwYXRoOiBzdHJpbmcpID0+IGhvbGRpbmcuYWRkKHBhdGgpLAogICAgcmVsZWFzZTogKHBhdGg6IHN0cmluZykgPT4gewogICAgICBob2xkaW5nLmRlbGV0ZShwYXRoKTsKICAgICAgaGVsZC5nZXQocGF0aCk/LmZvckVhY2goKHJlc29sdmUpID0+IHJlc29sdmUoKSk7CiAgICAgIGhlbGQuZGVsZXRlKHBhdGgpOwogICAgfSwKICAgIC8qKiBUaGUgY3VycmVudCBhY2Nlc3MgdG9rZW4gZXhwaXJlcyAodGhlIHJlZnJlc2ggdG9rZW4gc3RheXMgdmFsaWQpLiAqLwogICAgZXhwaXJlOiAoKSA9PiB7CiAgICAgIHZhbGlkID0geyAuLi52YWxpZCwgYWNjZXNzVG9rZW46IGBleHBpcmVkLSR7Z2VuZXJhdGlvbn1gIH07CiAgICB9LAogIH07Cn0KCi8qKgogKiBXaXRoIGZha2UgdGltZXJzOiBtb3ZlcyB0aW1lIGZvcndhcmQgaW4gc21hbGwgc3RlcHMgYW5kIGxldHMgcHJvbWlzZXMgc2V0dGxlIGluIGJldHdlZW4sIHNvCiAqIGNoYWlucyBvZiB0aW1lcnMgYW5kIGF3YWl0cyBydW4gYXMgdGhleSB3b3VsZCBpbiByZWFsIHRpbWUuCiAqLwpleHBvcnQgYXN5bmMgZnVuY3Rpb24gZWxhcHNlKG1zOiBudW1iZXIsIHN0ZXAgPSAxMDApIHsKICBmb3IgKGxldCB0ID0gMDsgdCA8IG1zOyB0ICs9IHN0ZXApIGF3YWl0IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZUFzeW5jKHN0ZXApOwp9Cg==', 'base64'), 'UTF8'), true, 11),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'package.json', 'json', convert_from(decode('ewogICJuYW1lIjogInp5Y3VzLWFwcHJvdmFscyIsCiAgInZlcnNpb24iOiAiNC4xMi4wIiwKICAicHJpdmF0ZSI6IHRydWUsCiAgInNjcmlwdHMiOiB7CiAgICAic3RhcnQiOiAicmVhY3QtbmF0aXZlIHN0YXJ0IiwKICAgICJ0ZXN0IjogImplc3QiCiAgfSwKICAiZGVwZW5kZW5jaWVzIjogewogICAgIkByZWFjdC1uYXRpdmUtYXN5bmMtc3RvcmFnZS9hc3luYy1zdG9yYWdlIjogIjIuMS4yIiwKICAgICJyZWFjdCI6ICIxOS4xLjAiLAogICAgInJlYWN0LW5hdGl2ZSI6ICIwLjgxLjQiCiAgfSwKICAiZGV2RGVwZW5kZW5jaWVzIjogewogICAgIkB0ZXN0aW5nLWxpYnJhcnkvcmVhY3QtbmF0aXZlIjogIjEzLjMuMyIsCiAgICAiamVzdCI6ICIyOS43LjAiLAogICAgInR5cGVzY3JpcHQiOiAiNS44LjMiCiAgfQp9Cg==', 'base64'), 'UTF8'), true, 12)
  on conflict (question_id, path) do update set language = excluded.language, content = excluded.content,
    readonly = excluded.readonly, sort_order = excluded.sort_order;
  delete from public.question_rubric_items where question_id = '9249d0ed-6c2c-4ea4-80f9-48645dbf737a' and key <> all (array['single_flight_refresh', 'abort_per_request', 'per_item_rollback', 'hydration', 'list_identity', 'code_quality']::text[]);
  insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'single_flight_refresh', 'Token refresh is single-flight', convert_from(decode('T25lIHNoYXJlZCByZWZyZXNoIHByb21pc2U7IGNvbmN1cnJlbnQgNDAxcyB3YWl0IGZvciBpdDsgYSByZXF1ZXN0IHNlbnQgYmVmb3JlIHRoZSByZWZyZXNoIHJldHJpZXMgd2l0aCB0aGUgY3VycmVudCB0b2tlbiB3aXRob3V0IHJlZnJlc2hpbmcgYWdhaW47IG9uTG9nb3V0IGZpcmVzIG9uY2Uu', 'base64'), 'UTF8'), 6, 0),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'abort_per_request', 'Each request gets its own AbortController', 'New controller per effect run, aborted in cleanup; aborted results ignored; no stuck spinner, no out-of-order overwrite.', 5, 1),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'per_item_rollback', 'Optimistic updates roll back per item', convert_from(decode('Um9sbHMgYmFjayBvbmx5IHRoZSBmYWlsZWQgcm93IHRvIGl0cyBwcmV2aW91cyBzdGF0dXMgd2l0aCBhbiBlcnJvcjsgb3RoZXIgcm93cycgc3VjY2Vzc2VzIGFyZSBrZXB0Lg==', 'base64'), 'UTF8'), 5, 2),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'hydration', 'Session hydration race fixed', convert_from(decode('UmVxdWVzdHMgYW5kIG11dGF0aW9ucyB3YWl0IGZvciB0aGUgc3RvcmVkIHNlc3Npb247IHN0YXJ0dXAgdG9rZW4gc2F2ZXMgYXJlbid0IGxvc3Qgb3Igb3ZlcndyaXR0ZW4u', 'base64'), 'UTF8'), 4, 3),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'list_identity', 'List identity and layout', 'keyExtractor and expanded state use item.id; getItemLayout includes the separator.', 3, 4),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'code_quality', 'Root-cause fixes, clean code', 'Fixes are minimal and well-reasoned; no test special-casing, sleeps or swallowed errors.', 2, 5)
  on conflict (question_id, key) do update set criterion = excluded.criterion,
    description = excluded.description, max_points = excluded.max_points, sort_order = excluded.sort_order;
  insert into public.question_solutions (question_id, notes_md, files) values (
    '9249d0ed-6c2c-4ea4-80f9-48645dbf737a', convert_from(decode('IyMjIFJlZmVyZW5jZSBub3RlcyAocmV2aWV3ZXJzIG9ubHkpCgoxLiAqKlRva2VuIHJlZnJlc2ggaXMgbm90IHNpbmdsZS1mbGlnaHQqKiAoYGFwaS9odHRwQ2xpZW50LnRzYCkuIEEgYm9vbGVhbiBgaXNSZWZyZXNoaW5nYCBmbGFnIGxldHMKICAgY29uY3VycmVudCA0MDFzIHJldHJ5IGltbWVkaWF0ZWx5IHdpdGggdGhlIG9sZCB0b2tlbiwgYW5kIGEgNDAxIGZvciBhIHJlcXVlc3Qgc2VudCBiZWZvcmUgYQogICByZWZyZXNoIGZpbmlzaGVkIHN0YXJ0cyBhIHNlY29uZCByZWZyZXNoIHdpdGggYW4gYWxyZWFkeS1yb3RhdGVkIHJlZnJlc2ggdG9rZW4sIHdoaWNoIGxvZ3MgdGhlCiAgIHVzZXIgb3V0LiBGaXg6IG9uZSBzaGFyZWQgYHJlZnJlc2hpbmdgIHByb21pc2UgdGhhdCBhbGwgNDAxcyBhd2FpdCAoY2xlYXJlZCBpbiBgZmluYWxseWAgYWZ0ZXIKICAgdGhlIHRva2VucyBhcmUgcGVyc2lzdGVkKSwgYG9uTG9nb3V0YCBjYWxsZWQgb25jZSBpbnNpZGUgaXQsIGF0IG1vc3Qgb25lIHJldHJ5IHBlciByZXF1ZXN0LCBhbmQKICAgImlmIHRoZSB0b2tlbiBjaGFuZ2VkIHNpbmNlIHRoaXMgcmVxdWVzdCB3YXMgc2VudCwganVzdCByZXRyeSB3aXRoIHRoZSBjdXJyZW50IHRva2VuIi4KMi4gKipBYm9ydENvbnRyb2xsZXIgcmV1c2VkKiogKGBob29rcy91c2VBcHByb3ZhbHMudHNgKS4gVGhlIGNvbnRyb2xsZXIgbGl2ZXMgaW4gYSByZWY7IHRoZSBlZmZlY3QKICAgY2xlYW51cCBhYm9ydHMgaXQgYW5kIGV2ZXJ5IGxhdGVyIHJlcXVlc3QgZ2V0cyBhbiBhbHJlYWR5LWFib3J0ZWQgc2lnbmFsLCBmYWlscyBpbnN0YW50bHkgYW5kCiAgIHRoZSBBYm9ydEVycm9yIGlzIHN3YWxsb3dlZCAoc3Bpbm5lciBmb3JldmVyKS4gRml4OiBuZXcgY29udHJvbGxlciBwZXIgZWZmZWN0IHJ1biwgYWJvcnQgaW4KICAgY2xlYW51cCwgaWdub3JlIHJlc3VsdHMvZXJyb3JzIG9mIGFib3J0ZWQgcmVxdWVzdHMgKGFsc28gZml4ZXMgb3V0LW9mLW9yZGVyIHJlc3BvbnNlcykuCjMuICoqT3B0aW1pc3RpYyByb2xsYmFjayByZXN0b3JlcyBhIHdob2xlLWxpc3Qgc25hcHNob3QqKiAoYHN0YXRlL2FwcHJvdmFscy50c2ApLCB1bmRvaW5nIG90aGVyCiAgIHJvd3MnIHN1Y2Nlc3NmdWwgZGVjaXNpb25zLCBhbmQgbmV2ZXIgcmVjb3JkcyB0aGUgZmFpbHVyZS4gRml4OiByZW1lbWJlciB0aGUgcm93J3MgcHJldmlvdXMKICAgc3RhdHVzIGFuZCBkaXNwYXRjaCBhIHBlci1yb3cgcm9sbGJhY2sgd2l0aCBhbiBlcnJvcjsgY29uZmlybSBvbiBzdWNjZXNzLgo0LiAqKkh5ZHJhdGlvbiByYWNlKiogKGBhdXRoL3Nlc3Npb25TdG9yZS50c2AgKyBjbGllbnQpLiBSZXF1ZXN0cyByZWFkIGBzZXNzaW9uLmdldCgpYCBiZWZvcmUKICAgc3RvcmFnZSB3YXMgcmVhZCAobm8gdG9rZW4pLCBhbmQgYHNhdmVUb2tlbnNgIGR1cmluZyBzdGFydHVwIGlzIGRyb3BwZWQgLyBvdmVyd3JpdHRlbi4gRml4OgogICBgYXdhaXQgcmVhZHlgIGluIHRoZSBjbGllbnQgYW5kIGluIGV2ZXJ5IG11dGF0aW9uLgo1LiAqKkZsYXRMaXN0IGJ5IGluZGV4KiogKGBzY3JlZW5zL0FwcHJvdmFsc0xpc3QudHN4YCkuIGBrZXlFeHRyYWN0b3JgIHJldHVybnMgdGhlIGluZGV4IGFuZCB0aGUKICAgZXhwYW5kZWQgcm93IGlzIHN0b3JlZCBieSBpbmRleCwgc28gc3RhdGUgbW92ZXMgdG8gYW5vdGhlciBpdGVtIHdoZW4gcm93cyBhYm92ZSBkaXNhcHBlYXI7CiAgIGBnZXRJdGVtTGF5b3V0YCBpZ25vcmVzIHRoZSBzZXBhcmF0b3IgaGVpZ2h0LiBGaXg6IGtleSBhbmQgdHJhY2sgYnkgYGl0ZW0uaWRgOyBvZmZzZXQKICAgYChST1dfSEVJR0hUICsgU0VQQVJBVE9SX0hFSUdIVCkgKiBpbmRleGAuCgoqKlNlbmlvciBzaWduYWxzOioqIHJlYXNvbnMgYWJvdXQgcm90YXRpb24gYW5kIGNvbmN1cnJlbmN5IHJhdGhlciB0aGFuIGFkZGluZyBkZWxheXM7IGV4cGxhaW5zIHdoeQpgaXNNb3VudGVkYC1zdHlsZSBmbGFncyBvciBhIGxvbmdlciBkZWJvdW5jZSBkb24ndCBmaXggIzI7IGtlZXBzIGBvbkxvZ291dGAgc2luZ2xlOyBub3RlcyB0aGF0CmBnZXRJdGVtTGF5b3V0YCBtdXN0IG1hdGNoIHRoZSByZW5kZXJlZCBsYXlvdXQgZXhhY3RseS4K', 'base64'), 'UTF8'), (convert_from(decode('W3sicGF0aCI6InNyYy9hcGkvaHR0cENsaWVudC50cyIsImNvbnRlbnQiOiJpbXBvcnQgdHlwZSB7IFNlc3Npb25TdG9yZSB9IGZyb20gJy4uL2F1dGgvc2Vzc2lvblN0b3JlJztcbmltcG9ydCB7IEh0dHBFcnJvciwgdHlwZSBGZXRjaExpa2UsIHR5cGUgVG9rZW5zIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEh0dHBDbGllbnRPcHRpb25zIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBmZXRjaEltcGw6IEZldGNoTGlrZTtcbiAgc2Vzc2lvbjogU2Vzc2lvblN0b3JlO1xuICAvKiogRXhjaGFuZ2VzIGEgcmVmcmVzaCB0b2tlbiBmb3IgbmV3IHRva2Vucy4gUmVmcmVzaCB0b2tlbnMgcm90YXRlIG9uIGV2ZXJ5IGNhbGwuICovXG4gIHJlZnJlc2g6IChyZWZyZXNoVG9rZW46IHN0cmluZykgPT4gUHJvbWlzZTxUb2tlbnM+O1xuICAvKiogQ2FsbGVkIHdoZW4gdGhlIHNlc3Npb24gY2FuJ3QgYmUgcmVjb3ZlcmVkOyB0aGUgYXBwIHJldHVybnMgdG8gdGhlIHNpZ24taW4gc2NyZWVuLiAqL1xuICBvbkxvZ291dDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0T3B0aW9ucyB7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xuICBib2R5PzogdW5rbm93bjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIdHRwQ2xpZW50IHtcbiAgZ2V0PFQ+KHBhdGg6IHN0cmluZywgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zKTogUHJvbWlzZTxUPjtcbiAgcG9zdDxUPihwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiBSZXF1ZXN0T3B0aW9ucyk6IFByb21pc2U8VD47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVIdHRwQ2xpZW50KG86IEh0dHBDbGllbnRPcHRpb25zKTogSHR0cENsaWVudCB7XG4gIC8vIEZJWDogYSBzaW5nbGUgaW4tZmxpZ2h0IHJlZnJlc2ggdGhhdCBldmVyeSA0MDEgYXdhaXRzIChhIGJvb2xlYW4gZmxhZyBsZXQgY29uY3VycmVudCByZXF1ZXN0c1xuICAvLyByZXRyeSB3aXRoIHRoZSBvbGQgdG9rZW4sIG9yIHN0YXJ0IHRoZWlyIG93biByZWZyZXNoIHdpdGggYW4gYWxyZWFkeS1yb3RhdGVkIHJlZnJlc2ggdG9rZW4pLlxuICBsZXQgcmVmcmVzaGluZzogUHJvbWlzZTxUb2tlbnM+IHwgbnVsbCA9IG51bGw7XG5cbiAgZnVuY3Rpb24gcmVmcmVzaE9uY2UocmVmcmVzaFRva2VuOiBzdHJpbmcpOiBQcm9taXNlPFRva2Vucz4ge1xuICAgIHJlZnJlc2hpbmcgPz89IChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBmcmVzaCA9IGF3YWl0IG8ucmVmcmVzaChyZWZyZXNoVG9rZW4pO1xuICAgICAgICBhd2FpdCBvLnNlc3Npb24uc2F2ZVRva2VucyhmcmVzaCk7IC8vIHBlcnNpc3RlZCBiZWZvcmUgYW55b25lIHJldHJpZXNcbiAgICAgICAgcmV0dXJuIGZyZXNoO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIG8ub25Mb2dvdXQoKTsgLy8gb25jZSwgaG93ZXZlciBtYW55IHJlcXVlc3RzIHdlcmUgd2FpdGluZ1xuICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKDQwMSwgJ1lvdXIgc2Vzc2lvbiBoYXMgZXhwaXJlZC4gU2lnbiBpbiBhZ2Fpbi4nKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHJlZnJlc2hpbmcgPSBudWxsO1xuICAgICAgfVxuICAgIH0pKCk7XG4gICAgcmV0dXJuIHJlZnJlc2hpbmc7XG4gIH1cblxuICBjb25zdCBzZW5kID0gKG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIG9wdGlvbnM6IFJlcXVlc3RPcHRpb25zLCBhY2Nlc3NUb2tlbj86IHN0cmluZykgPT5cbiAgICBvLmZldGNoSW1wbChvLmJhc2VVcmwgKyBwYXRoLCB7XG4gICAgICBtZXRob2QsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIC4uLihhY2Nlc3NUb2tlbiA/IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FjY2Vzc1Rva2VufWAgfSA6IHt9KSxcbiAgICAgIH0sXG4gICAgICBib2R5OiBvcHRpb25zLmJvZHkgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuYm9keSksXG4gICAgICBzaWduYWw6IG9wdGlvbnMuc2lnbmFsLFxuICAgIH0pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHJlcXVlc3Q8VD4obWV0aG9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgb3B0aW9uczogUmVxdWVzdE9wdGlvbnMpOiBQcm9taXNlPFQ+IHtcbiAgICAvLyBGSVg6IHdhaXQgZm9yIHRoZSBzdG9yZWQgc2Vzc2lvbiBvbiBjb2xkIHN0YXJ0ICh0aGUgZmlyc3QgcmVxdWVzdCB3ZW50IG91dCB3aXRob3V0IGEgdG9rZW4pLlxuICAgIGF3YWl0IG8uc2Vzc2lvbi5yZWFkeTtcbiAgICBjb25zdCBzZW50V2l0aCA9IG8uc2Vzc2lvbi5nZXQoKT8udG9rZW5zO1xuICAgIGxldCByZXMgPSBhd2FpdCBzZW5kKG1ldGhvZCwgcGF0aCwgb3B0aW9ucywgc2VudFdpdGg/LmFjY2Vzc1Rva2VuKTtcbiAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxICYmIHNlbnRXaXRoKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gby5zZXNzaW9uLmdldCgpPy50b2tlbnM7XG4gICAgICAvLyBGSVg6IGlmIGFub3RoZXIgcmVxdWVzdCBhbHJlYWR5IHJlZnJlc2hlZCBhZnRlciB0aGlzIG9uZSB3YXMgc2VudCwganVzdCByZXRyeSB3aXRoIHRoZSBuZXdcbiAgICAgIC8vIHRva2VuOyByZWZyZXNoaW5nIGFnYWluIHdvdWxkIHVzZSBhIHJvdGF0ZWQgKGRlYWQpIHJlZnJlc2ggdG9rZW4gYW5kIGxvZyB0aGUgdXNlciBvdXQuXG4gICAgICBjb25zdCB0b2tlbnMgPVxuICAgICAgICBjdXJyZW50ICYmIGN1cnJlbnQuYWNjZXNzVG9rZW4gIT09IHNlbnRXaXRoLmFjY2Vzc1Rva2VuID8gY3VycmVudCA6IGF3YWl0IHJlZnJlc2hPbmNlKHNlbnRXaXRoLnJlZnJlc2hUb2tlbik7XG4gICAgICByZXMgPSBhd2FpdCBzZW5kKG1ldGhvZCwgcGF0aCwgb3B0aW9ucywgdG9rZW5zLmFjY2Vzc1Rva2VuKTsgLy8gcmV0cmllZCBhdCBtb3N0IG9uY2VcbiAgICB9XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBIdHRwRXJyb3IocmVzLnN0YXR1cywgYFJlcXVlc3QgZmFpbGVkICgke3Jlcy5zdGF0dXN9KWApO1xuICAgIHJldHVybiAoYXdhaXQgcmVzLmpzb24oKSkgYXMgVDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZ2V0OiAocGF0aCwgb3B0aW9ucyA9IHt9KSA9PiByZXF1ZXN0KCdHRVQnLCBwYXRoLCBvcHRpb25zKSxcbiAgICBwb3N0OiAocGF0aCwgb3B0aW9ucyA9IHt9KSA9PiByZXF1ZXN0KCdQT1NUJywgcGF0aCwgb3B0aW9ucyksXG4gIH07XG59XG4ifSx7InBhdGgiOiJzcmMvYXV0aC9zZXNzaW9uU3RvcmUudHMiLCJjb250ZW50IjoiaW1wb3J0IEFzeW5jU3RvcmFnZSBmcm9tICdAcmVhY3QtbmF0aXZlLWFzeW5jLXN0b3JhZ2UvYXN5bmMtc3RvcmFnZSc7XG5pbXBvcnQgdHlwZSB7IFNlc3Npb24sIFRva2VucyB9IGZyb20gJy4uL3R5cGVzJztcblxuZXhwb3J0IGNvbnN0IFNFU1NJT05fS0VZID0gJ3Nlc3Npb24udjEnO1xuXG50eXBlIExpc3RlbmVyID0gKHNlc3Npb246IFNlc3Npb24gfCBudWxsKSA9PiB2b2lkO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25TdG9yZSB7XG4gIC8qKiBSZXNvbHZlcyBvbmNlIHRoZSBzYXZlZCBzZXNzaW9uIGhhcyBiZWVuIHJlYWQgZnJvbSBzdG9yYWdlLiAqL1xuICByZWFkeTogUHJvbWlzZTx2b2lkPjtcbiAgZ2V0KCk6IFNlc3Npb24gfCBudWxsO1xuICBzaWduSW4oc2Vzc2lvbjogU2Vzc2lvbik6IFByb21pc2U8dm9pZD47XG4gIC8qKiBTdG9yZXMgbmV3IHRva2VucyBhZnRlciBhIHJlZnJlc2ggKHJlZnJlc2ggdG9rZW5zIHJvdGF0ZTogdGhlIG9sZCBvbmUgc3RvcHMgd29ya2luZykuICovXG4gIHNhdmVUb2tlbnModG9rZW5zOiBUb2tlbnMpOiBQcm9taXNlPHZvaWQ+O1xuICBzaWduT3V0KCk6IFByb21pc2U8dm9pZD47XG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXIpOiAoKSA9PiB2b2lkO1xufVxuXG4vKiogVGhlIHNpZ25lZC1pbiBzZXNzaW9uLCBwZXJzaXN0ZWQgaW4gQXN5bmNTdG9yYWdlIHNvIHRoZSB1c2VyIHN0YXlzIHNpZ25lZCBpbiBhY3Jvc3MgbGF1bmNoZXMuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2Vzc2lvblN0b3JlKCk6IFNlc3Npb25TdG9yZSB7XG4gIGxldCBzZXNzaW9uOiBTZXNzaW9uIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IGxpc3RlbmVycyA9IG5ldyBTZXQ8TGlzdGVuZXI+KCk7XG4gIGNvbnN0IGVtaXQgPSAoKSA9PiBsaXN0ZW5lcnMuZm9yRWFjaCgobCkgPT4gbChzZXNzaW9uKSk7XG5cbiAgY29uc3QgcGVyc2lzdCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoc2Vzc2lvbikgYXdhaXQgQXN5bmNTdG9yYWdlLnNldEl0ZW0oU0VTU0lPTl9LRVksIEpTT04uc3RyaW5naWZ5KHNlc3Npb24pKTtcbiAgICBlbHNlIGF3YWl0IEFzeW5jU3RvcmFnZS5yZW1vdmVJdGVtKFNFU1NJT05fS0VZKTtcbiAgfTtcblxuICBjb25zdCByZWFkeSA9IEFzeW5jU3RvcmFnZS5nZXRJdGVtKFNFU1NJT05fS0VZKS50aGVuKChyYXcpID0+IHtcbiAgICB0cnkge1xuICAgICAgc2Vzc2lvbiA9IHJhdyA/IChKU09OLnBhcnNlKHJhdykgYXMgU2Vzc2lvbikgOiBudWxsO1xuICAgIH0gY2F0Y2gge1xuICAgICAgc2Vzc2lvbiA9IG51bGw7IC8vIGNvcnJ1cHQgZW50cnk6IHRyZWF0IGFzIHNpZ25lZCBvdXRcbiAgICB9XG4gICAgZW1pdCgpO1xuICB9KTtcblxuICAvLyBGSVg6IGV2ZXJ5IGNoYW5nZSB3YWl0cyBmb3IgaHlkcmF0aW9uIGZpcnN0LiBPdGhlcndpc2UgYSBjaGFuZ2UgbWFkZSBkdXJpbmcgc3RhcnR1cCBpcyBlaXRoZXJcbiAgLy8gZHJvcHBlZCAobm8gc2Vzc2lvbiB5ZXQpIG9yIG92ZXJ3cml0dGVuIHdoZW4gdGhlIHN0b3JlZCAob2xkZXIpIHNlc3Npb24gZmluaXNoZXMgbG9hZGluZy5cbiAgcmV0dXJuIHtcbiAgICByZWFkeSxcbiAgICBnZXQ6ICgpID0+IHNlc3Npb24sXG4gICAgYXN5bmMgc2lnbkluKG5leHQpIHtcbiAgICAgIGF3YWl0IHJlYWR5O1xuICAgICAgc2Vzc2lvbiA9IG5leHQ7XG4gICAgICBlbWl0KCk7XG4gICAgICBhd2FpdCBwZXJzaXN0KCk7XG4gICAgfSxcbiAgICBhc3luYyBzYXZlVG9rZW5zKHRva2Vucykge1xuICAgICAgYXdhaXQgcmVhZHk7XG4gICAgICBpZiAoIXNlc3Npb24pIHJldHVybjtcbiAgICAgIHNlc3Npb24gPSB7IC4uLnNlc3Npb24sIHRva2VucyB9O1xuICAgICAgZW1pdCgpO1xuICAgICAgYXdhaXQgcGVyc2lzdCgpO1xuICAgIH0sXG4gICAgYXN5bmMgc2lnbk91dCgpIHtcbiAgICAgIGF3YWl0IHJlYWR5O1xuICAgICAgc2Vzc2lvbiA9IG51bGw7XG4gICAgICBlbWl0KCk7XG4gICAgICBhd2FpdCBwZXJzaXN0KCk7XG4gICAgfSxcbiAgICBzdWJzY3JpYmUobGlzdGVuZXIpIHtcbiAgICAgIGxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICAgICAgcmV0dXJuICgpID0+IGxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICAgIH0sXG4gIH07XG59XG4ifSx7InBhdGgiOiJzcmMvaG9va3MvdXNlQXBwcm92YWxzLnRzIiwiY29udGVudCI6ImltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IEh0dHBDbGllbnQgfSBmcm9tICcuLi9hcGkvaHR0cENsaWVudCc7XG5pbXBvcnQgdHlwZSB7IEFwcHJvdmFsLCBGaWx0ZXIgfSBmcm9tICcuLi90eXBlcyc7XG5cbi8qKiBMb2FkcyB0aGUgYXBwcm92YWxzIGZvciB0aGUgc2VsZWN0ZWQgZmlsdGVyIGNoaXAgKEFsbCAvIFVyZ2VudCAvIE1pbmUpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUFwcHJvdmFscyhjbGllbnQ6IEh0dHBDbGllbnQsIGZpbHRlcjogRmlsdGVyKSB7XG4gIGNvbnN0IFtpdGVtcywgc2V0SXRlbXNdID0gdXNlU3RhdGU8QXBwcm92YWxbXT4oW10pO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIEZJWDogYSBuZXcgY29udHJvbGxlciBwZXIgcmVxdWVzdC4gQW4gQWJvcnRDb250cm9sbGVyIGNhbiBvbmx5IGFib3J0IG9uY2U6IHJldXNpbmcgdGhlIG9uZVxuICAgIC8vIGFib3J0ZWQgYnkgdGhlIHByZXZpb3VzIGNsZWFudXAgbWFkZSBldmVyeSBsYXRlciByZXF1ZXN0IGZhaWwgaW5zdGFudGx5IChzaWxlbnRseSBzd2FsbG93ZWQpLlxuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgc2V0TG9hZGluZyh0cnVlKTtcbiAgICBzZXRFcnJvcihudWxsKTtcbiAgICBjbGllbnRcbiAgICAgIC5nZXQ8QXBwcm92YWxbXT4oYC9hcHByb3ZhbHM/ZmlsdGVyPSR7ZmlsdGVyfWAsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgaWYgKGNvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQpIHJldHVybjsgLy8gYSBuZXdlciBmaWx0ZXIgaXMgc2VsZWN0ZWRcbiAgICAgICAgc2V0SXRlbXMoZGF0YSk7XG4gICAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZTogRXJyb3IpID0+IHtcbiAgICAgICAgaWYgKGNvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQgfHwgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHJldHVybjtcbiAgICAgICAgc2V0RXJyb3IoZS5tZXNzYWdlKTtcbiAgICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICB9KTtcbiAgICByZXR1cm4gKCkgPT4gY29udHJvbGxlci5hYm9ydCgpO1xuICB9LCBbY2xpZW50LCBmaWx0ZXJdKTtcblxuICByZXR1cm4geyBpdGVtcywgbG9hZGluZywgZXJyb3IgfTtcbn1cbiJ9LHsicGF0aCI6InNyYy9zdGF0ZS9hcHByb3ZhbHMudHMiLCJjb250ZW50IjoiaW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZVJlZHVjZXIsIHVzZVJlZiB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgSHR0cENsaWVudCB9IGZyb20gJy4uL2FwaS9odHRwQ2xpZW50JztcbmltcG9ydCB0eXBlIHsgQXBwcm92YWwsIERlY2lzaW9uIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgdHlwZSBBcHByb3ZhbHNBY3Rpb24gPVxuICB8IHsgdHlwZTogJ0xPQURFRCc7IGl0ZW1zOiBBcHByb3ZhbFtdIH1cbiAgfCB7IHR5cGU6ICdPUFRJTUlTVElDJzsgaWQ6IHN0cmluZzsgc3RhdHVzOiBBcHByb3ZhbFsnc3RhdHVzJ10gfVxuICB8IHsgdHlwZTogJ0NPTkZJUk1FRCc7IGlkOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ1JPTExCQUNLJzsgaWQ6IHN0cmluZzsgc3RhdHVzOiBBcHByb3ZhbFsnc3RhdHVzJ107IGVycm9yOiBzdHJpbmcgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcHJvdmFsc1JlZHVjZXIoc3RhdGU6IEFwcHJvdmFsW10sIGFjdGlvbjogQXBwcm92YWxzQWN0aW9uKTogQXBwcm92YWxbXSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdMT0FERUQnOlxuICAgICAgcmV0dXJuIGFjdGlvbi5pdGVtcztcbiAgICBjYXNlICdPUFRJTUlTVElDJzpcbiAgICAgIHJldHVybiBzdGF0ZS5tYXAoKGEpID0+IChhLmlkID09PSBhY3Rpb24uaWQgPyB7IC4uLmEsIHN0YXR1czogYWN0aW9uLnN0YXR1cywgZXJyb3I6IHVuZGVmaW5lZCB9IDogYSkpO1xuICAgIGNhc2UgJ0NPTkZJUk1FRCc6XG4gICAgICByZXR1cm4gc3RhdGUubWFwKChhKSA9PiAoYS5pZCA9PT0gYWN0aW9uLmlkID8geyAuLi5hLCBlcnJvcjogdW5kZWZpbmVkIH0gOiBhKSk7XG4gICAgY2FzZSAnUk9MTEJBQ0snOlxuICAgICAgcmV0dXJuIHN0YXRlLm1hcCgoYSkgPT4gKGEuaWQgPT09IGFjdGlvbi5pZCA/IHsgLi4uYSwgc3RhdHVzOiBhY3Rpb24uc3RhdHVzLCBlcnJvcjogYWN0aW9uLmVycm9yIH0gOiBhKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcHJvdmUgLyByZWplY3Qgd2l0aCBhbiBvcHRpbWlzdGljIHVwZGF0ZTogdGhlIHJvdyBjaGFuZ2VzIGltbWVkaWF0ZWx5IGFuZCBpcyBwdXQgYmFjayBpZiB0aGVcbiAqIHNlcnZlciBjYWxsIGZhaWxzLiBBcHByb3ZlcnMgb2Z0ZW4gYWN0aW9uIHNldmVyYWwgcm93cyBpbiBxdWljayBzdWNjZXNzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlQXBwcm92YWxEZWNpc2lvbnMoYXBpOiBQaWNrPEh0dHBDbGllbnQsICdwb3N0Jz4sIGluaXRpYWw6IEFwcHJvdmFsW10pIHtcbiAgY29uc3QgW2l0ZW1zLCBkaXNwYXRjaF0gPSB1c2VSZWR1Y2VyKGFwcHJvdmFsc1JlZHVjZXIsIGluaXRpYWwpO1xuICBjb25zdCBsYXRlc3QgPSB1c2VSZWYoaXRlbXMpO1xuICBsYXRlc3QuY3VycmVudCA9IGl0ZW1zO1xuXG4gIGNvbnN0IGRlY2lkZSA9IHVzZUNhbGxiYWNrKFxuICAgIGFzeW5jIChpZDogc3RyaW5nLCBkZWNpc2lvbjogRGVjaXNpb24pID0+IHtcbiAgICAgIC8vIEZJWDogcmVtZW1iZXIgb25seSB0aGlzIHJvdydzIHByZXZpb3VzIHN0YXR1cyBhbmQgcm9sbCBiYWNrIG9ubHkgdGhpcyByb3csIGFnYWluc3QgdGhlXG4gICAgICAvLyBjdXJyZW50IHN0YXRlLiBSZXN0b3JpbmcgYSB3aG9sZS1saXN0IHNuYXBzaG90IHVuZGlkIG90aGVyIHJvd3MnIChzdWNjZXNzZnVsKSBkZWNpc2lvbnMuXG4gICAgICBjb25zdCBwcmV2aW91cyA9IGxhdGVzdC5jdXJyZW50LmZpbmQoKGEpID0+IGEuaWQgPT09IGlkKT8uc3RhdHVzID8/ICdQRU5ESU5HJztcbiAgICAgIGRpc3BhdGNoKHsgdHlwZTogJ09QVElNSVNUSUMnLCBpZCwgc3RhdHVzOiBkZWNpc2lvbiB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGFwaS5wb3N0KGAvYXBwcm92YWxzLyR7aWR9LyR7ZGVjaXNpb24gPT09ICdBUFBST1ZFRCcgPyAnYXBwcm92ZScgOiAncmVqZWN0J31gKTtcbiAgICAgICAgZGlzcGF0Y2goeyB0eXBlOiAnQ09ORklSTUVEJywgaWQgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGRpc3BhdGNoKHsgdHlwZTogJ1JPTExCQUNLJywgaWQsIHN0YXR1czogcHJldmlvdXMsIGVycm9yOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiAnRmFpbGVkJyB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIFthcGldLFxuICApO1xuXG4gIHJldHVybiB7IGl0ZW1zLCBkZWNpZGUsIGxvYWQ6IChuZXh0OiBBcHByb3ZhbFtdKSA9PiBkaXNwYXRjaCh7IHR5cGU6ICdMT0FERUQnLCBpdGVtczogbmV4dCB9KSB9O1xufVxuIn0seyJwYXRoIjoic3JjL3NjcmVlbnMvQXBwcm92YWxzTGlzdC50c3giLCJjb250ZW50IjoiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgRmxhdExpc3QsIFByZXNzYWJsZSwgU3R5bGVTaGVldCwgVGV4dCwgVGV4dElucHV0LCBWaWV3IH0gZnJvbSAncmVhY3QtbmF0aXZlJztcbmltcG9ydCB0eXBlIHsgQXBwcm92YWwsIERlY2lzaW9uIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgY29uc3QgUk9XX0hFSUdIVCA9IDcyO1xuZXhwb3J0IGNvbnN0IFNFUEFSQVRPUl9IRUlHSFQgPSAxO1xuXG4vKiogTGV0cyBGbGF0TGlzdCBqdW1wIHN0cmFpZ2h0IHRvIGEgcm93IChkZWVwIGxpbmtzIGNhbGwgc2Nyb2xsVG9JbmRleCkuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXRlbUxheW91dChfZGF0YTogQXJyYXlMaWtlPEFwcHJvdmFsPiB8IG51bGwgfCB1bmRlZmluZWQsIGluZGV4OiBudW1iZXIpIHtcbiAgLy8gRklYOiBldmVyeSByb3cgYmVmb3JlIGBpbmRleGAgaXMgZm9sbG93ZWQgYnkgYSBzZXBhcmF0b3IuXG4gIHJldHVybiB7IGxlbmd0aDogUk9XX0hFSUdIVCwgb2Zmc2V0OiAoUk9XX0hFSUdIVCArIFNFUEFSQVRPUl9IRUlHSFQpICogaW5kZXgsIGluZGV4IH07XG59XG5cbmNvbnN0IHJ1cGVlcyA9IChtaW5vcjogbnVtYmVyKSA9PiBg4oK5JHsobWlub3IgLyAxMDApLnRvRml4ZWQoMil9YDtcblxuZnVuY3Rpb24gQXBwcm92YWxSb3coe1xuICBpdGVtLFxuICBleHBhbmRlZCxcbiAgb25Ub2dnbGUsXG4gIG9uRGVjaWRlLFxufToge1xuICBpdGVtOiBBcHByb3ZhbDtcbiAgZXhwYW5kZWQ6IGJvb2xlYW47XG4gIG9uVG9nZ2xlOiAoKSA9PiB2b2lkO1xuICBvbkRlY2lkZTogKGlkOiBzdHJpbmcsIGRlY2lzaW9uOiBEZWNpc2lvbiwgY29tbWVudDogc3RyaW5nKSA9PiB2b2lkO1xufSkge1xuICBjb25zdCBbY29tbWVudCwgc2V0Q29tbWVudF0gPSB1c2VTdGF0ZSgnJyk7XG4gIHJldHVybiAoXG4gICAgPFZpZXcgc3R5bGU9e3N0eWxlcy5yb3d9IHRlc3RJRD17YHJvdy0ke2l0ZW0uaWR9YH0+XG4gICAgICA8UHJlc3NhYmxlIHRlc3RJRD17YHJvdy0ke2l0ZW0uaWR9LXRvZ2dsZWB9IG9uUHJlc3M9e29uVG9nZ2xlfT5cbiAgICAgICAgPFRleHQgc3R5bGU9e3N0eWxlcy50aXRsZX0+e2l0ZW0udGl0bGV9PC9UZXh0PlxuICAgICAgICA8VGV4dD57cnVwZWVzKGl0ZW0uYW1vdW50TWlub3IpfTwvVGV4dD5cbiAgICAgIDwvUHJlc3NhYmxlPlxuICAgICAge2V4cGFuZGVkICYmIChcbiAgICAgICAgPFZpZXcgdGVzdElEPXtgcm93LSR7aXRlbS5pZH0tZGV0YWlsc2B9PlxuICAgICAgICAgIDxUZXh0PlJlcXVlc3RlZCBieSB7aXRlbS5yZXF1ZXN0ZWRCeX08L1RleHQ+XG4gICAgICAgICAgPFRleHRJbnB1dFxuICAgICAgICAgICAgdGVzdElEPXtgcm93LSR7aXRlbS5pZH0tY29tbWVudGB9XG4gICAgICAgICAgICB2YWx1ZT17Y29tbWVudH1cbiAgICAgICAgICAgIG9uQ2hhbmdlVGV4dD17c2V0Q29tbWVudH1cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiQ29tbWVudCAocmVxdWlyZWQgdG8gcmVqZWN0KVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8UHJlc3NhYmxlIHRlc3RJRD17YHJvdy0ke2l0ZW0uaWR9LWFwcHJvdmVgfSBvblByZXNzPXsoKSA9PiBvbkRlY2lkZShpdGVtLmlkLCAnQVBQUk9WRUQnLCBjb21tZW50KX0+XG4gICAgICAgICAgICA8VGV4dD5BcHByb3ZlPC9UZXh0PlxuICAgICAgICAgIDwvUHJlc3NhYmxlPlxuICAgICAgICAgIDxQcmVzc2FibGVcbiAgICAgICAgICAgIHRlc3RJRD17YHJvdy0ke2l0ZW0uaWR9LXJlamVjdGB9XG4gICAgICAgICAgICBkaXNhYmxlZD17Y29tbWVudC50cmltKCkgPT09ICcnfVxuICAgICAgICAgICAgb25QcmVzcz17KCkgPT4gb25EZWNpZGUoaXRlbS5pZCwgJ1JFSkVDVEVEJywgY29tbWVudCl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFRleHQ+UmVqZWN0PC9UZXh0PlxuICAgICAgICAgIDwvUHJlc3NhYmxlPlxuICAgICAgICA8L1ZpZXc+XG4gICAgICApfVxuICAgIDwvVmlldz5cbiAgKTtcbn1cblxuY29uc3QgU2VwYXJhdG9yID0gKCkgPT4gPFZpZXcgc3R5bGU9e3N0eWxlcy5zZXBhcmF0b3J9IC8+O1xuXG5leHBvcnQgZnVuY3Rpb24gQXBwcm92YWxzTGlzdCh7XG4gIGl0ZW1zLFxuICBvbkRlY2lkZSxcbn06IHtcbiAgaXRlbXM6IEFwcHJvdmFsW107XG4gIG9uRGVjaWRlOiAoaWQ6IHN0cmluZywgZGVjaXNpb246IERlY2lzaW9uLCBjb21tZW50OiBzdHJpbmcpID0+IHZvaWQ7XG59KSB7XG4gIC8vIEZJWDogdHJhY2sgdGhlIGV4cGFuZGVkIHJvdyBieSBpZCBhbmQga2V5IHJvd3MgYnkgaWQuIEluZGV4LWJhc2VkIHN0YXRlIGFuZCBrZXlzIG1vdmUgdG8gYVxuICAvLyBkaWZmZXJlbnQgaXRlbSB3aGVuIHJvd3MgYWJvdmUgYXJlIHJlbW92ZWQgKGFuZCBlYWNoIHJvdydzIGxvY2FsIGNvbW1lbnQgbW92ZXMgd2l0aCB0aGVtKS5cbiAgY29uc3QgW2V4cGFuZGVkLCBzZXRFeHBhbmRlZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgcmV0dXJuIChcbiAgICA8RmxhdExpc3RcbiAgICAgIHRlc3RJRD1cImFwcHJvdmFsc1wiXG4gICAgICBkYXRhPXtpdGVtc31cbiAgICAgIGtleUV4dHJhY3Rvcj17KGl0ZW0pID0+IGl0ZW0uaWR9XG4gICAgICBnZXRJdGVtTGF5b3V0PXtnZXRJdGVtTGF5b3V0fVxuICAgICAgSXRlbVNlcGFyYXRvckNvbXBvbmVudD17U2VwYXJhdG9yfVxuICAgICAgcmVuZGVySXRlbT17KHsgaXRlbSB9KSA9PiAoXG4gICAgICAgIDxBcHByb3ZhbFJvd1xuICAgICAgICAgIGl0ZW09e2l0ZW19XG4gICAgICAgICAgZXhwYW5kZWQ9e2V4cGFuZGVkID09PSBpdGVtLmlkfVxuICAgICAgICAgIG9uVG9nZ2xlPXsoKSA9PiBzZXRFeHBhbmRlZCgoY3VyKSA9PiAoY3VyID09PSBpdGVtLmlkID8gbnVsbCA6IGl0ZW0uaWQpKX1cbiAgICAgICAgICBvbkRlY2lkZT17b25EZWNpZGV9XG4gICAgICAgIC8+XG4gICAgICApfVxuICAgIC8+XG4gICk7XG59XG5cbmNvbnN0IHN0eWxlcyA9IFN0eWxlU2hlZXQuY3JlYXRlKHtcbiAgcm93OiB7IG1pbkhlaWdodDogUk9XX0hFSUdIVCwgcGFkZGluZ0hvcml6b250YWw6IDE2LCBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicgfSxcbiAgdGl0bGU6IHsgZm9udFdlaWdodDogJzYwMCcgfSxcbiAgc2VwYXJhdG9yOiB7IGhlaWdodDogU0VQQVJBVE9SX0hFSUdIVCwgYmFja2dyb3VuZENvbG9yOiAnI0UyRThGMCcgfSxcbn0pO1xuIn1d', 'base64'), 'UTF8'))::jsonb
  ) on conflict (question_id) do update set notes_md = excluded.notes_md, files = excluded.files;
  if v_installed is null then
    raise notice 'Question "rn-approvals-inbox": installed (version 3)';
  else
    raise notice 'Question "rn-approvals-inbox": updated from version % to 3', v_installed;
  end if;
end
$question$;

commit;
```

### 33. `supabase/seed/parts/question-rn-live-auction.sql`

- **Folder:** `supabase/seed/parts`
- **File name:** `question-rn-live-auction.sql`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 64 lines, 46 KB
- **Commit message:** `Sync question-rn-live-auction.sql (question v3 grading)`

```sql
-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- Question "Live Reverse Auction: timers, listeners and rendering (React Native)". Safe to re-run: what is already installed and up to date is left untouched.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Question: rn-live-auction (version 3)
do $question$
declare
  v_installed int;
begin
  select version into v_installed from public.questions where id = 'a7dcbe6c-f122-4051-8368-41c2659815d7';
  if v_installed >= 3 then
    raise notice 'Question "rn-live-auction": version % installed, left unchanged', v_installed;
    return;
  end if;
  insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status, version) values (
    'a7dcbe6c-f122-4051-8368-41c2659815d7', 'rn-live-auction', 'Live Reverse Auction: timers, listeners and rendering (React Native)', 'React Native debugging', array['lead-react-native-developer', 'react-native-developer']::text[], array['react-native', 'timers', 'app-state', 'navigation', 'performance', 'money']::text[], 'hard', 35,
    convert_from(decode('IyMgTGl2ZSBSZXZlcnNlIEF1Y3Rpb246IHRoZSBmaW5hbCBtaW51dGVzIGFyZSBicm9rZW4KClN1cHBsaWVycyB1c2UgdGhpcyBzY3JlZW4gb2YgdGhlIFp5Y3VzIGVTb3VyY2luZyBhcHAgdG8gYmlkIGluICoqcmV2ZXJzZSBhdWN0aW9ucyoqICh0aGUgbG93ZXN0CmJpZCB3aW5zKS4gVGhlIGF1Y3Rpb24gKiphdXRvLWV4dGVuZHMgYnkgMiBtaW51dGVzKiogd2hlbiBhIGJpZCBsYW5kcyBpbiBpdHMgZmluYWwgbWludXRlLCBzbyB0aGUKY2xvc2luZyB0aW1lIGNhbiBjaGFuZ2Ugd2hpbGUgdGhlIHNjcmVlbiBpcyBvcGVuLgoKIyMjIEJ1ZyByZXBvcnRzCgoxLiAqKiJJdCBzYWlkICpBdWN0aW9uIGNsb3NlZCogd2hpbGUgdGhlIGF1Y3Rpb24gd2FzIHN0aWxsIHJ1bm5pbmcuIioqIFRoaXMgaGFwcGVucyBhZnRlciBhbgogICBleHRlbnNpb24sIGFuZCB3aGVuIHN1cHBsaWVycyBjb21lIGJhY2sgdG8gdGhlIGFwcCBhZnRlciBhIGZldyBtaW51dGVzIGluIHRoZSBiYWNrZ3JvdW5kICh0aGUKICAgY291bnRkb3duIHRoZW4gc2hvd3MgKm1vcmUqIHRpbWUgdGhhbiBpcyByZWFsbHkgbGVmdCBhbmQgdGhlIHNlcnZlciByZWplY3RzIHRoZSBiaWQpLgoyLiAqKiJFdmVyeSBiaWQgc2hvd3MgdXAgdHdvIG9yIHRocmVlIHRpbWVzIGluIHRoZSB0aWNrZXIuIioqIEl0IGdldHMgd29yc2UgZWFjaCB0aW1lIHRoZSBzdXBwbGllcgogICBzd2l0Y2hlcyB0YWJzIGFuZCBjb21lcyBiYWNrOyB0aGUgYm9hcmQgYWxzbyBrZWVwcyB1cGRhdGluZyB3aGlsZSB0aGUgc2NyZWVuIGlzbid0IHZpc2libGUuCiAgIFJldHVybmluZyBmcm9tIHRoZSBiYWNrZ3JvdW5kIHRyaWdnZXJzIHNldmVyYWwgcmVzeW5jcyBpbnN0ZWFkIG9mIG9uZS4KMy4gKioiVGhlIGJvYXJkIHN0dXR0ZXJzIGluIHRoZSBsYXN0IG1pbnV0ZSBvbiBtaWQtcmFuZ2UgQW5kcm9pZCBwaG9uZXMuIioqIFByb2ZpbGluZyBzaG93cyBldmVyeQogICByb3cgb2YgdGhlIGJvYXJkIHJlLXJlbmRlcmluZyBvbiBldmVyeSBjb3VudGRvd24gdGljayAoYm9hcmRzIHJlYWNoIDMwMCsgYmlkcykuCjQuICoqIk15IHZhbGlkIGJpZCB3YXMgcmVqZWN0ZWQuIioqIEJlc3QgYmlkIOKCuTEsMDAwLjA1LCBtaW5pbXVtIGRlY3JlbWVudCDigrkwLjEwOiBhIGJpZCBvZgogICDigrk5OTkuOTUgY2FuJ3QgYmUgcGxhY2VkLiBBbW91bnRzIGFyZSBhbHNvIHNob3duIGFzICrigrkxMjM0NTY3LjUwKiBpbnN0ZWFkIG9mICrigrkxMiwzNCw1NjcuNTAqLgoKIyMjIFdoYXQgdG8gZG8KCi0gRml4IHRoZSAqKnJvb3QgY2F1c2VzKiogaW4gYHNyYy9gLiBUaGUgcm93cyBhcmUgaW5zdHJ1bWVudGVkIHdpdGggYHRyYWNrUmVuZGVyKClgIGZvciB0aGUKICBwZXJmb3JtYW5jZSB0ZXN0czoga2VlcCB0aG9zZSBjYWxscy4KLSBgX190ZXN0c19fL2AgaXMgKipyZWFkLW9ubHkqKiBhbmQgZGVzY3JpYmVzIHRoZSBleHBlY3RlZCBiZWhhdmlvdXI7IHVzZSAqKlJ1biB0ZXN0cyoqLgotIERvbid0IHNwZWNpYWwtY2FzZSB0aGUgdGVzdHM6IHJldmlld2VycyByZWFkIHlvdXIgY2hhbmdlcyBhbmQgcnVuIG1vcmUgdGVzdHMuCgoqVGltZSBndWlkZTogYWJvdXQgMzUgbWludXRlcy4qCg==', 'base64'), 'UTF8'),
    false, 'published', 3
  ) on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, category = excluded.category,
    role_tags = excluded.role_tags, skill_tags = excluded.skill_tags, difficulty = excluded.difficulty,
    time_suggestion_minutes = excluded.time_suggestion_minutes, statement_md = excluded.statement_md,
    is_sample = excluded.is_sample, status = excluded.status, version = excluded.version;
  delete from public.question_files where question_id = 'a7dcbe6c-f122-4051-8368-41c2659815d7' and path <> all (array['src/screens/AuctionScreen.tsx', 'src/components/BidBoard.tsx', 'src/hooks/useCountdown.ts', 'src/hooks/useAuctionListeners.ts', 'src/utils/money.ts', 'src/realtime/auctionSocket.ts', 'src/debug/renderCounter.ts', 'src/types.ts', '__tests__/useCountdown.test.ts', '__tests__/listeners.test.ts', '__tests__/BidBoard.test.tsx', '__tests__/money.test.ts', 'package.json']::text[]);
  insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/screens/AuctionScreen.tsx', 'typescript', convert_from(decode('aW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnOwppbXBvcnQgeyBQcmVzc2FibGUsIFRleHQsIFRleHRJbnB1dCwgVmlldyB9IGZyb20gJ3JlYWN0LW5hdGl2ZSc7CmltcG9ydCB7IEJpZEJvYXJkIH0gZnJvbSAnLi4vY29tcG9uZW50cy9CaWRCb2FyZCc7CmltcG9ydCB7IGZvcm1hdFJlbWFpbmluZywgdXNlQ291bnRkb3duIH0gZnJvbSAnLi4vaG9va3MvdXNlQ291bnRkb3duJzsKaW1wb3J0IHsgdXNlQmlkRmVlZCwgdXNlT25Gb3JlZ3JvdW5kIH0gZnJvbSAnLi4vaG9va3MvdXNlQXVjdGlvbkxpc3RlbmVycyc7CmltcG9ydCB0eXBlIHsgQXVjdGlvblNvY2tldCB9IGZyb20gJy4uL3JlYWx0aW1lL2F1Y3Rpb25Tb2NrZXQnOwppbXBvcnQgdHlwZSB7IEJpZCB9IGZyb20gJy4uL3R5cGVzJzsKaW1wb3J0IHsgZm9ybWF0UnVwZWVzLCBpc1ZhbGlkQmlkLCBwYXJzZVJ1cGVlcyB9IGZyb20gJy4uL3V0aWxzL21vbmV5JzsKCi8qKiBNaW5pbXVtIGFtb3VudCAocnVwZWVzKSBhIG5ldyBiaWQgbXVzdCB1bmRlcmN1dCB0aGUgYmVzdCBiaWQgYnkuICovCmV4cG9ydCBjb25zdCBNSU5fREVDUkVNRU5UID0gMC4xOwoKZXhwb3J0IGZ1bmN0aW9uIEF1Y3Rpb25TY3JlZW4oewogIHNvY2tldCwKICBpbml0aWFsQmlkcywKICBjbG9zZXNBdCwKICBvblBsYWNlQmlkLAogIG9uUmVzeW5jLAp9OiB7CiAgc29ja2V0OiBBdWN0aW9uU29ja2V0OwogIGluaXRpYWxCaWRzOiBCaWRbXTsKICBjbG9zZXNBdDogbnVtYmVyOwogIG9uUGxhY2VCaWQ6IChhbW91bnRNaW5vcjogbnVtYmVyKSA9PiB2b2lkOwogIG9uUmVzeW5jOiAoKSA9PiB2b2lkOwp9KSB7CiAgY29uc3QgW2JpZHMsIHNldEJpZHNdID0gdXNlU3RhdGUoaW5pdGlhbEJpZHMpOwogIGNvbnN0IFtzZWxlY3RlZElkLCBzZXRTZWxlY3RlZElkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpOwogIGNvbnN0IFtpbnB1dCwgc2V0SW5wdXRdID0gdXNlU3RhdGUoJycpOwogIGNvbnN0IHsgcmVtYWluaW5nLCBjbG9zZWQgfSA9IHVzZUNvdW50ZG93bihjbG9zZXNBdCk7CgogIHVzZUJpZEZlZWQoc29ja2V0LCAoYmlkKSA9PiBzZXRCaWRzKChjdXJyZW50KSA9PiBbLi4uY3VycmVudCwgYmlkXS5zb3J0KChhLCBiKSA9PiBhLmFtb3VudE1pbm9yIC0gYi5hbW91bnRNaW5vcikpKTsKICB1c2VPbkZvcmVncm91bmQob25SZXN5bmMpOwoKICBjb25zdCBiZXN0ID0gYmlkcy5sZW5ndGggPyBiaWRzWzBdIS5hbW91bnRNaW5vciAvIDEwMCA6IEluZmluaXR5OwogIGNvbnN0IGFtb3VudCA9IHBhcnNlUnVwZWVzKGlucHV0KTsKICBjb25zdCBjYW5CaWQgPSAhY2xvc2VkICYmIGFtb3VudCAhPT0gbnVsbCAmJiBpc1ZhbGlkQmlkKGFtb3VudCwgYmVzdCwgTUlOX0RFQ1JFTUVOVCk7CgogIHJldHVybiAoCiAgICA8Vmlldz4KICAgICAgPFRleHQgdGVzdElEPSJjb3VudGRvd24iPntjbG9zZWQgPyAnQXVjdGlvbiBjbG9zZWQnIDogZm9ybWF0UmVtYWluaW5nKHJlbWFpbmluZyl9PC9UZXh0PgogICAgICA8VGV4dCB0ZXN0SUQ9ImJlc3QiPntOdW1iZXIuaXNGaW5pdGUoYmVzdCkgPyBmb3JtYXRSdXBlZXMoYmVzdCkgOiAn4oCUJ308L1RleHQ+CiAgICAgIDxCaWRCb2FyZCBiaWRzPXtiaWRzfSBzZWxlY3RlZElkPXtzZWxlY3RlZElkfSBvblNlbGVjdD17KGlkKSA9PiBzZXRTZWxlY3RlZElkKGlkKX0gLz4KICAgICAgPFRleHRJbnB1dCB0ZXN0SUQ9ImFtb3VudCIgdmFsdWU9e2lucHV0fSBvbkNoYW5nZVRleHQ9e3NldElucHV0fSBrZXlib2FyZFR5cGU9ImRlY2ltYWwtcGFkIiAvPgogICAgICA8UHJlc3NhYmxlCiAgICAgICAgdGVzdElEPSJwbGFjZS1iaWQiCiAgICAgICAgZGlzYWJsZWQ9eyFjYW5CaWR9CiAgICAgICAgb25QcmVzcz17KCkgPT4gYW1vdW50ICE9PSBudWxsICYmIG9uUGxhY2VCaWQoTWF0aC5yb3VuZChhbW91bnQgKiAxMDApKX0KICAgICAgPgogICAgICAgIDxUZXh0PlBsYWNlIGJpZDwvVGV4dD4KICAgICAgPC9QcmVzc2FibGU+CiAgICA8L1ZpZXc+CiAgKTsKfQo=', 'base64'), 'UTF8'), false, 0),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/components/BidBoard.tsx', 'typescript', convert_from(decode('aW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgRmxhdExpc3QsIFByZXNzYWJsZSwgU3R5bGVTaGVldCwgVGV4dCwgdHlwZSBWaWV3U3R5bGUgfSBmcm9tICdyZWFjdC1uYXRpdmUnOwppbXBvcnQgeyB0cmFja1JlbmRlciB9IGZyb20gJy4uL2RlYnVnL3JlbmRlckNvdW50ZXInOwppbXBvcnQgdHlwZSB7IEJpZCB9IGZyb20gJy4uL3R5cGVzJzsKaW1wb3J0IHsgZm9ybWF0UnVwZWVzIH0gZnJvbSAnLi4vdXRpbHMvbW9uZXknOwoKaW50ZXJmYWNlIEJpZFJvd1Byb3BzIHsKICBiaWQ6IEJpZDsKICByYW5rOiBudW1iZXI7CiAgc2VsZWN0ZWQ6IGJvb2xlYW47CiAgb25QcmVzczogKCkgPT4gdm9pZDsKICBzdHlsZTogVmlld1N0eWxlOwp9CgovKiogT25lIHJvdyBvZiB0aGUgbGVhZGVyYm9hcmQuIE1lbW9pc2VkOiB0aGUgYm9hcmQgY2FuIGhvbGQgMzAwKyBiaWRzIGluIHRoZSBmaW5hbCBtaW51dGVzLiAqLwpleHBvcnQgY29uc3QgQmlkUm93ID0gUmVhY3QubWVtbyhmdW5jdGlvbiBCaWRSb3coeyBiaWQsIHJhbmssIHNlbGVjdGVkLCBvblByZXNzLCBzdHlsZSB9OiBCaWRSb3dQcm9wcykgewogIHRyYWNrUmVuZGVyKGBCaWRSb3c6JHtiaWQuaWR9YCk7CiAgcmV0dXJuICgKICAgIDxQcmVzc2FibGUgdGVzdElEPXtgYmlkLSR7YmlkLmlkfWB9IG9uUHJlc3M9e29uUHJlc3N9IHN0eWxlPXtbc3R5bGVzLnJvdywgc3R5bGVdfT4KICAgICAgPFRleHQ+I3tyYW5rfTwvVGV4dD4KICAgICAgPFRleHQgc3R5bGU9e3N0eWxlcy5zdXBwbGllcn0+e2JpZC5zdXBwbGllcn08L1RleHQ+CiAgICAgIDxUZXh0IHRlc3RJRD17YGJpZC0ke2JpZC5pZH0tYW1vdW50YH0+e2Zvcm1hdFJ1cGVlcyhiaWQuYW1vdW50TWlub3IgLyAxMDApfTwvVGV4dD4KICAgICAge3NlbGVjdGVkICYmIDxUZXh0IHRlc3RJRD17YGJpZC0ke2JpZC5pZH0tc2VsZWN0ZWRgfT5TZWxlY3RlZDwvVGV4dD59CiAgICA8L1ByZXNzYWJsZT4KICApOwp9KTsKCmV4cG9ydCBmdW5jdGlvbiBCaWRCb2FyZCh7CiAgYmlkcywKICBzZWxlY3RlZElkLAogIG9uU2VsZWN0LAp9OiB7CiAgYmlkczogQmlkW107CiAgc2VsZWN0ZWRJZDogc3RyaW5nIHwgbnVsbDsKICBvblNlbGVjdDogKGlkOiBzdHJpbmcpID0+IHZvaWQ7Cn0pIHsKICByZXR1cm4gKAogICAgPEZsYXRMaXN0CiAgICAgIHRlc3RJRD0iYmlkLWJvYXJkIgogICAgICBkYXRhPXtiaWRzfQogICAgICBrZXlFeHRyYWN0b3I9eyhiKSA9PiBiLmlkfQogICAgICByZW5kZXJJdGVtPXsoeyBpdGVtLCBpbmRleCB9KSA9PiAoCiAgICAgICAgPEJpZFJvdwogICAgICAgICAgYmlkPXtpdGVtfQogICAgICAgICAgcmFuaz17aW5kZXggKyAxfQogICAgICAgICAgc2VsZWN0ZWQ9e2l0ZW0uaWQgPT09IHNlbGVjdGVkSWR9CiAgICAgICAgICBvblByZXNzPXsoKSA9PiBvblNlbGVjdChpdGVtLmlkKX0KICAgICAgICAgIHN0eWxlPXt7IG9wYWNpdHk6IGl0ZW0uaWQgPT09IHNlbGVjdGVkSWQgPyAxIDogMC45IH19CiAgICAgICAgLz4KICAgICAgKX0KICAgIC8+CiAgKTsKfQoKY29uc3Qgc3R5bGVzID0gU3R5bGVTaGVldC5jcmVhdGUoewogIHJvdzogeyBmbGV4RGlyZWN0aW9uOiAncm93JywgcGFkZGluZ1ZlcnRpY2FsOiAxMCwgcGFkZGluZ0hvcml6b250YWw6IDE2IH0sCiAgc3VwcGxpZXI6IHsgZmxleDogMSwgbWFyZ2luSG9yaXpvbnRhbDogOCB9LAp9KTsK', 'base64'), 'UTF8'), false, 1),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/hooks/useCountdown.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JzsKCi8qKiBUaW1lIGxlZnQgdW50aWwgdGhlIGF1Y3Rpb24gY2xvc2VzLCB1cGRhdGVkIGV2ZXJ5IHNlY29uZC4gKi8KZXhwb3J0IGZ1bmN0aW9uIHVzZUNvdW50ZG93bihjbG9zZXNBdDogbnVtYmVyKSB7CiAgY29uc3QgW3JlbWFpbmluZywgc2V0UmVtYWluaW5nXSA9IHVzZVN0YXRlKCgpID0+IE1hdGgubWF4KDAsIGNsb3Nlc0F0IC0gRGF0ZS5ub3coKSkpOwoKICB1c2VFZmZlY3QoKCkgPT4gewogICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7CiAgICAgIHNldFJlbWFpbmluZygocikgPT4gTWF0aC5tYXgoMCwgciAtIDEwMDApKTsKICAgIH0sIDEwMDApOwogICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaWQpOwogIH0sIFtdKTsKCiAgcmV0dXJuIHsgcmVtYWluaW5nLCBjbG9zZWQ6IHJlbWFpbmluZyA9PT0gMCB9Owp9CgpleHBvcnQgZnVuY3Rpb24gZm9ybWF0UmVtYWluaW5nKG1zOiBudW1iZXIpOiBzdHJpbmcgewogIGNvbnN0IHMgPSBNYXRoLmNlaWwobXMgLyAxMDAwKTsKICByZXR1cm4gYCR7TWF0aC5mbG9vcihzIC8gNjApfToke1N0cmluZyhzICUgNjApLnBhZFN0YXJ0KDIsICcwJyl9YDsKfQo=', 'base64'), 'UTF8'), false, 2),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/hooks/useAuctionListeners.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlRm9jdXNFZmZlY3QgfSBmcm9tICdAcmVhY3QtbmF2aWdhdGlvbi9uYXRpdmUnOwppbXBvcnQgeyB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7CmltcG9ydCB7IEFwcFN0YXRlIH0gZnJvbSAncmVhY3QtbmF0aXZlJzsKaW1wb3J0IHR5cGUgeyBBdWN0aW9uU29ja2V0IH0gZnJvbSAnLi4vcmVhbHRpbWUvYXVjdGlvblNvY2tldCc7CmltcG9ydCB0eXBlIHsgQmlkIH0gZnJvbSAnLi4vdHlwZXMnOwoKLyoqIExpdmUgYmlkcyBmb3IgdGhlIGF1Y3Rpb24sIG9ubHkgd2hpbGUgdGhpcyBzY3JlZW4gaXMgZm9jdXNlZCAoc2F2ZXMgYmF0dGVyeSBhbmQgZGF0YSkuICovCmV4cG9ydCBmdW5jdGlvbiB1c2VCaWRGZWVkKHNvY2tldDogQXVjdGlvblNvY2tldCwgb25CaWQ6IChiaWQ6IEJpZCkgPT4gdm9pZCkgewogIHVzZUZvY3VzRWZmZWN0KCgpID0+IHsKICAgIHNvY2tldC5vbignYmlkJywgKGJpZCkgPT4gb25CaWQoYmlkKSk7CiAgICByZXR1cm4gKCkgPT4gc29ja2V0Lm9mZignYmlkJywgb25CaWQpOwogIH0pOwp9CgovKiogQ2FsbHMgYG9uRm9yZWdyb3VuZGAgd2hlbiB0aGUgYXBwIHJldHVybnMgdG8gdGhlIGZvcmVncm91bmQgKHRvIHJlc3luYyB0aGUgYm9hcmQpLiAqLwpleHBvcnQgZnVuY3Rpb24gdXNlT25Gb3JlZ3JvdW5kKG9uRm9yZWdyb3VuZDogKCkgPT4gdm9pZCkgewogIHVzZUVmZmVjdCgoKSA9PiB7CiAgICBBcHBTdGF0ZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoc3RhdGUpID0+IHsKICAgICAgaWYgKHN0YXRlID09PSAnYWN0aXZlJykgb25Gb3JlZ3JvdW5kKCk7CiAgICB9KTsKICB9LCBbb25Gb3JlZ3JvdW5kXSk7Cn0K', 'base64'), 'UTF8'), false, 3),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/utils/money.ts', 'typescript', convert_from(decode('LyoqIFBhcnNlcyB3aGF0IHRoZSBzdXBwbGllciB0eXBlZCAoIjEsMDAwLjA1IikgaW50byBydXBlZXMuIFJldHVybnMgbnVsbCBpZiBpdCBpc24ndCBhIHBvc2l0aXZlIGFtb3VudC4gKi8KZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUnVwZWVzKGlucHV0OiBzdHJpbmcpOiBudW1iZXIgfCBudWxsIHsKICBjb25zdCBuID0gTnVtYmVyKGlucHV0LnJlcGxhY2UoLywvZywgJycpLnRyaW0oKSk7CiAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShuKSAmJiBuID4gMCA/IG4gOiBudWxsOwp9CgovKioKICogSW4gYSByZXZlcnNlIGF1Y3Rpb24gYSBuZXcgYmlkIG11c3QgdW5kZXJjdXQgdGhlIGN1cnJlbnQgYmVzdCBiaWQgYnkgYXQgbGVhc3QgdGhlIG1pbmltdW0KICogZGVjcmVtZW50OiBiaWQgPD0gYmVzdCAtIG1pbkRlY3JlbWVudC4gQWxsIHZhbHVlcyBpbiBydXBlZXMgKHR3byBkZWNpbWFscykuCiAqLwpleHBvcnQgZnVuY3Rpb24gaXNWYWxpZEJpZChiaWQ6IG51bWJlciwgYmVzdDogbnVtYmVyLCBtaW5EZWNyZW1lbnQ6IG51bWJlcik6IGJvb2xlYW4gewogIHJldHVybiBiaWQgPiAwICYmIGJpZCA8PSBiZXN0IC0gbWluRGVjcmVtZW50Owp9CgovKiogIuKCuTEyLDM0LDU2Ny41MCIgKEluZGlhbiBkaWdpdCBncm91cGluZykuICovCmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRSdXBlZXMoYW1vdW50OiBudW1iZXIpOiBzdHJpbmcgewogIHJldHVybiBg4oK5JHthbW91bnQudG9GaXhlZCgyKX1gOwp9Cg==', 'base64'), 'UTF8'), false, 4),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/realtime/auctionSocket.ts', 'typescript', convert_from(decode('aW1wb3J0IHR5cGUgeyBCaWQgfSBmcm9tICcuLi90eXBlcyc7Cgp0eXBlIEV2ZW50cyA9IHsgYmlkOiBCaWQ7IGV4dGVuZGVkOiB7IGNsb3Nlc0F0OiBudW1iZXIgfSB9Owp0eXBlIEhhbmRsZXI8SyBleHRlbmRzIGtleW9mIEV2ZW50cz4gPSAocGF5bG9hZDogRXZlbnRzW0tdKSA9PiB2b2lkOwoKLyoqIFRoZSBsaXZlIGF1Y3Rpb24gZmVlZCAoYSBXZWJTb2NrZXQgaW4gdGhlIGFwcDsgYW4gaW4tbWVtb3J5IGVtaXR0ZXIgaW4gdGVzdHMpLiAqLwpleHBvcnQgaW50ZXJmYWNlIEF1Y3Rpb25Tb2NrZXQgewogIG9uPEsgZXh0ZW5kcyBrZXlvZiBFdmVudHM+KGV2ZW50OiBLLCBoYW5kbGVyOiBIYW5kbGVyPEs+KTogdm9pZDsKICBvZmY8SyBleHRlbmRzIGtleW9mIEV2ZW50cz4oZXZlbnQ6IEssIGhhbmRsZXI6IEhhbmRsZXI8Sz4pOiB2b2lkOwogIGVtaXQ8SyBleHRlbmRzIGtleW9mIEV2ZW50cz4oZXZlbnQ6IEssIHBheWxvYWQ6IEV2ZW50c1tLXSk6IHZvaWQ7CiAgbGlzdGVuZXJDb3VudChldmVudDoga2V5b2YgRXZlbnRzKTogbnVtYmVyOwp9CgpleHBvcnQgZnVuY3Rpb24gY3JlYXRlQXVjdGlvblNvY2tldCgpOiBBdWN0aW9uU29ja2V0IHsKICBjb25zdCBoYW5kbGVycyA9IG5ldyBNYXA8a2V5b2YgRXZlbnRzLCBTZXQ8KHA6IG5ldmVyKSA9PiB2b2lkPj4oKTsKICBjb25zdCBzZXQgPSAoZToga2V5b2YgRXZlbnRzKSA9PiB7CiAgICBpZiAoIWhhbmRsZXJzLmhhcyhlKSkgaGFuZGxlcnMuc2V0KGUsIG5ldyBTZXQoKSk7CiAgICByZXR1cm4gaGFuZGxlcnMuZ2V0KGUpITsKICB9OwogIHJldHVybiB7CiAgICBvbjogKGV2ZW50LCBoYW5kbGVyKSA9PiB2b2lkIHNldChldmVudCkuYWRkKGhhbmRsZXIgYXMgKHA6IG5ldmVyKSA9PiB2b2lkKSwKICAgIG9mZjogKGV2ZW50LCBoYW5kbGVyKSA9PiB2b2lkIHNldChldmVudCkuZGVsZXRlKGhhbmRsZXIgYXMgKHA6IG5ldmVyKSA9PiB2b2lkKSwKICAgIGVtaXQ6IChldmVudCwgcGF5bG9hZCkgPT4gc2V0KGV2ZW50KS5mb3JFYWNoKChoKSA9PiAoaCBhcyAocDogdHlwZW9mIHBheWxvYWQpID0+IHZvaWQpKHBheWxvYWQpKSwKICAgIGxpc3RlbmVyQ291bnQ6IChldmVudCkgPT4gc2V0KGV2ZW50KS5zaXplLAogIH07Cn0K', 'base64'), 'UTF8'), true, 5),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/debug/renderCounter.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlRGVidWdWYWx1ZSB9IGZyb20gJ3JlYWN0JzsKCi8qKgogKiBSZW5kZXIgaW5zdHJ1bWVudGF0aW9uIHVzZWQgYnkgdGhlIHBlcmZvcm1hbmNlIHRlc3RzIChhbmQgYnkgdGhlIHRlYW0ncyBpbi1hcHAgcGVyZiBvdmVybGF5KS4KICogS2VlcCB0aGUgdHJhY2tSZW5kZXIoKSBjYWxscyBpbiBwbGFjZTogY2FsbCBpdCB3aGlsZSB0aGUgY29tcG9uZW50IHJlbmRlcnMsIGxpa2UgYSBob29rIChpdCBpcwogKiBvbmUsIHNvIGNhbGxpbmcgaXQgZnJvbSBhbiBlZmZlY3Qgb3IgYW4gZXZlbnQgaGFuZGxlciB0aHJvd3MpLgogKi8KY29uc3QgY291bnRzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTsKCmV4cG9ydCBmdW5jdGlvbiB0cmFja1JlbmRlcihuYW1lOiBzdHJpbmcpIHsKICB1c2VEZWJ1Z1ZhbHVlKG5hbWUpOyAvLyBvbmx5IHZhbGlkIHdoaWxlIHJlbmRlcmluZzogY291bnRzIHJlYWwgcmVuZGVycywgbm90aGluZyBlbHNlCiAgY291bnRzLnNldChuYW1lLCAoY291bnRzLmdldChuYW1lKSA/PyAwKSArIDEpOwp9CgpleHBvcnQgZnVuY3Rpb24gcmVuZGVyQ291bnQobmFtZTogc3RyaW5nKTogbnVtYmVyIHsKICByZXR1cm4gY291bnRzLmdldChuYW1lKSA/PyAwOwp9CgovKiogU3VtIG9mIGFsbCBjb3VudGVycyB3aG9zZSBuYW1lIHN0YXJ0cyB3aXRoIGBwcmVmaXhgLiAqLwpleHBvcnQgZnVuY3Rpb24gdG90YWxSZW5kZXJzKHByZWZpeDogc3RyaW5nKTogbnVtYmVyIHsKICBsZXQgdG90YWwgPSAwOwogIGZvciAoY29uc3QgW25hbWUsIG5dIG9mIGNvdW50cykgaWYgKG5hbWUuc3RhcnRzV2l0aChwcmVmaXgpKSB0b3RhbCArPSBuOwogIHJldHVybiB0b3RhbDsKfQoKZXhwb3J0IGZ1bmN0aW9uIHJlc2V0UmVuZGVyQ291bnRzKCkgewogIGNvdW50cy5jbGVhcigpOwp9Cg==', 'base64'), 'UTF8'), true, 6),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/types.ts', 'typescript', convert_from(decode('ZXhwb3J0IGludGVyZmFjZSBCaWQgewogIGlkOiBzdHJpbmc7CiAgc3VwcGxpZXI6IHN0cmluZzsKICAvKiogQW1vdW50IGluIHBhaXNlICgxIHJ1cGVlID0gMTAwIHBhaXNlKS4gKi8KICBhbW91bnRNaW5vcjogbnVtYmVyOwp9CgpleHBvcnQgdHlwZSBBdWN0aW9uRXZlbnQgPSB7IHR5cGU6ICdiaWQnOyBiaWQ6IEJpZCB9IHwgeyB0eXBlOiAnZXh0ZW5kZWQnOyBjbG9zZXNBdDogbnVtYmVyIH07Cg==', 'base64'), 'UTF8'), true, 7),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', '__tests__/useCountdown.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCByZW5kZXJIb29rIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHsgdXNlQ291bnRkb3duIH0gZnJvbSAnLi4vc3JjL2hvb2tzL3VzZUNvdW50ZG93bic7Cgpjb25zdCBUMCA9IERhdGUuVVRDKDIwMjYsIDksIDEyLCAxMSwgMCwgMCk7CgpkZXNjcmliZSgndXNlQ291bnRkb3duJywgKCkgPT4gewogIGJlZm9yZUVhY2goKCkgPT4gewogICAgamVzdC51c2VGYWtlVGltZXJzKCk7CiAgICBqZXN0LnNldFN5c3RlbVRpbWUoVDApOwogIH0pOwoKICBpdCgnY291bnRzIGRvd24gZXZlcnkgc2Vjb25kIGFuZCBjbG9zZXMgYXQgemVybycsICgpID0+IHsKICAgIGNvbnN0IHsgcmVzdWx0IH0gPSByZW5kZXJIb29rKCgpID0+IHVzZUNvdW50ZG93bihUMCArIDNfMDAwKSk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQpLnRvTWF0Y2hPYmplY3QoeyByZW1haW5pbmc6IDNfMDAwLCBjbG9zZWQ6IGZhbHNlIH0pOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZSgxXzAwMCkpOwogICAgZXhwZWN0KHJlc3VsdC5jdXJyZW50LnJlbWFpbmluZykudG9CZSgyXzAwMCk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKDJfMDAwKSk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQpLnRvTWF0Y2hPYmplY3QoeyByZW1haW5pbmc6IDAsIGNsb3NlZDogdHJ1ZSB9KTsKICB9KTsKCiAgaXQoJ3BpY2tzIHVwIGFuIGV4dGVuc2lvbiBvZiB0aGUgY2xvc2luZyB0aW1lIGltbWVkaWF0ZWx5JywgKCkgPT4gewogICAgY29uc3QgeyByZXN1bHQsIHJlcmVuZGVyLCB1bm1vdW50IH0gPSByZW5kZXJIb29rKCh7IGNsb3Nlc0F0IH06IHsgY2xvc2VzQXQ6IG51bWJlciB9KSA9PiB1c2VDb3VudGRvd24oY2xvc2VzQXQpLCB7CiAgICAgIGluaXRpYWxQcm9wczogeyBjbG9zZXNBdDogVDAgKyAzMF8wMDAgfSwKICAgIH0pOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZSgyNV8wMDApKTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5yZW1haW5pbmcpLnRvQmUoNV8wMDApOwoKICAgIC8vIEEgYmlkIGluIHRoZSBmaW5hbCBtaW51dGUgZXh0ZW5kZWQgdGhlIGF1Y3Rpb24gYnkgMiBtaW51dGVzLgogICAgY29uc3QgdGltZXJzID0gamVzdC5nZXRUaW1lckNvdW50KCk7CiAgICByZXJlbmRlcih7IGNsb3Nlc0F0OiBUMCArIDE1MF8wMDAgfSk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQucmVtYWluaW5nKS50b0JlKDEyNV8wMDApOwogICAgZXhwZWN0KGplc3QuZ2V0VGltZXJDb3VudCgpKS50b0JlKHRpbWVycyk7IC8vIHRoZSBvbGQgdGltZXIgd2FzIHN0b3BwZWQsIG5vdCBsZWZ0IHJ1bm5pbmcKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoMTBfMDAwKSk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQpLnRvTWF0Y2hPYmplY3QoeyByZW1haW5pbmc6IDExNV8wMDAsIGNsb3NlZDogZmFsc2UgfSk7CiAgICB1bm1vdW50KCk7CiAgICBleHBlY3QoamVzdC5nZXRUaW1lckNvdW50KCkpLnRvQmUoMCk7CiAgfSk7CgogIGl0KCdpcyByaWdodCBhZ2FpbiBhcyBzb29uIGFzIHRoZSBhcHAgcmV0dXJucyBmcm9tIHRoZSBiYWNrZ3JvdW5kJywgKCkgPT4gewogICAgY29uc3QgeyByZXN1bHQgfSA9IHJlbmRlckhvb2soKCkgPT4gdXNlQ291bnRkb3duKFQwICsgNjAwXzAwMCkpOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZSg1XzAwMCkpOwogICAgZXhwZWN0KHJlc3VsdC5jdXJyZW50LnJlbWFpbmluZykudG9CZSg1OTVfMDAwKTsKCiAgICAvLyBJbiB0aGUgYmFja2dyb3VuZCBKUyB0aW1lcnMgYXJlIHBhdXNlZCwgYnV0IHJlYWwgdGltZSBtb3ZlcyBvbjogMyBtaW51dGVzIHBhc3MuCiAgICBqZXN0LnNldFN5c3RlbVRpbWUoVDAgKyAxODVfMDAwKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoMV8wMDApKTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5yZW1haW5pbmcpLnRvQmUoNjAwXzAwMCAtIDE4Nl8wMDApOwogIH0pOwp9KTsK', 'base64'), 'UTF8'), true, 8),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', '__tests__/listeners.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCBhcHBTdGF0ZSwgbmF2aWdhdGlvbiwgcmVuZGVySG9vayB9IGZyb20gJ0Bjb2RlYXJlbmEvdGVzdC11dGlscyc7CmltcG9ydCB7IHVzZUJpZEZlZWQsIHVzZU9uRm9yZWdyb3VuZCB9IGZyb20gJy4uL3NyYy9ob29rcy91c2VBdWN0aW9uTGlzdGVuZXJzJzsKaW1wb3J0IHsgY3JlYXRlQXVjdGlvblNvY2tldCB9IGZyb20gJy4uL3NyYy9yZWFsdGltZS9hdWN0aW9uU29ja2V0JzsKaW1wb3J0IHR5cGUgeyBCaWQgfSBmcm9tICcuLi9zcmMvdHlwZXMnOwoKY29uc3QgYmlkOiBCaWQgPSB7IGlkOiAnYjknLCBzdXBwbGllcjogJ0FjbWUgTWV0YWxzJywgYW1vdW50TWlub3I6IDk5Xzk5NSB9OwoKZGVzY3JpYmUoJ2xpdmUgYmlkIGZlZWQnLCAoKSA9PiB7CiAgaXQoJ2hhcyBleGFjdGx5IG9uZSBsaXN0ZW5lciB3aGlsZSBmb2N1c2VkLCBob3dldmVyIG9mdGVuIHRoZSBzY3JlZW4gcmUtcmVuZGVycycsICgpID0+IHsKICAgIGNvbnN0IHNvY2tldCA9IGNyZWF0ZUF1Y3Rpb25Tb2NrZXQoKTsKICAgIGNvbnN0IHsgcmVyZW5kZXIgfSA9IHJlbmRlckhvb2soKHsgb25CaWQgfTogeyBvbkJpZDogKGI6IEJpZCkgPT4gdm9pZCB9KSA9PiB1c2VCaWRGZWVkKHNvY2tldCwgb25CaWQpLCB7CiAgICAgIGluaXRpYWxQcm9wczogeyBvbkJpZDogamVzdC5mbigpIH0sCiAgICB9KTsKICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNTsgaSsrKSByZXJlbmRlcih7IG9uQmlkOiBqZXN0LmZuKCkgfSk7CiAgICBleHBlY3Qoc29ja2V0Lmxpc3RlbmVyQ291bnQoJ2JpZCcpKS50b0JlKDEpOwogIH0pOwoKICBpdCgnZGVsaXZlcnMgZWFjaCBiaWQgb25jZSwgdG8gdGhlIGxhdGVzdCBjYWxsYmFjaycsICgpID0+IHsKICAgIGNvbnN0IHNvY2tldCA9IGNyZWF0ZUF1Y3Rpb25Tb2NrZXQoKTsKICAgIGNvbnN0IGZpcnN0ID0gamVzdC5mbigpOwogICAgY29uc3QgbGF0ZXN0ID0gamVzdC5mbigpOwogICAgY29uc3QgeyByZXJlbmRlciB9ID0gcmVuZGVySG9vaygoeyBvbkJpZCB9OiB7IG9uQmlkOiAoYjogQmlkKSA9PiB2b2lkIH0pID0+IHVzZUJpZEZlZWQoc29ja2V0LCBvbkJpZCksIHsKICAgICAgaW5pdGlhbFByb3BzOiB7IG9uQmlkOiBmaXJzdCB9LAogICAgfSk7CiAgICByZXJlbmRlcih7IG9uQmlkOiBsYXRlc3QgfSk7CiAgICBhY3QoKCkgPT4gc29ja2V0LmVtaXQoJ2JpZCcsIGJpZCkpOwogICAgZXhwZWN0KGxhdGVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpOwogICAgZXhwZWN0KGxhdGVzdCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoYmlkKTsKICAgIGV4cGVjdChmaXJzdCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsKICB9KTsKCiAgaXQoJ21vdmVzIGl0cyBsaXN0ZW5lciB0byBhIG5ldyBzb2NrZXQgKGFmdGVyIGEgcmVjb25uZWN0KScsICgpID0+IHsKICAgIGNvbnN0IGJlZm9yZSA9IGNyZWF0ZUF1Y3Rpb25Tb2NrZXQoKTsKICAgIGNvbnN0IGFmdGVyID0gY3JlYXRlQXVjdGlvblNvY2tldCgpOwogICAgY29uc3Qgb25CaWQgPSBqZXN0LmZuKCk7CiAgICBjb25zdCB7IHJlcmVuZGVyIH0gPSByZW5kZXJIb29rKCh7IHNvY2tldCB9OiB7IHNvY2tldDogdHlwZW9mIGJlZm9yZSB9KSA9PiB1c2VCaWRGZWVkKHNvY2tldCwgb25CaWQpLCB7CiAgICAgIGluaXRpYWxQcm9wczogeyBzb2NrZXQ6IGJlZm9yZSB9LAogICAgfSk7CiAgICByZXJlbmRlcih7IHNvY2tldDogYWZ0ZXIgfSk7CiAgICBleHBlY3QoYmVmb3JlLmxpc3RlbmVyQ291bnQoJ2JpZCcpKS50b0JlKDApOwogICAgZXhwZWN0KGFmdGVyLmxpc3RlbmVyQ291bnQoJ2JpZCcpKS50b0JlKDEpOwogICAgYWN0KCgpID0+IGFmdGVyLmVtaXQoJ2JpZCcsIGJpZCkpOwogICAgZXhwZWN0KG9uQmlkKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7CiAgfSk7CgogIGl0KCd1bnN1YnNjcmliZXMgd2hlbiB0aGUgc2NyZWVuIGxvc2VzIGZvY3VzIGFuZCB3aGVuIGl0IHVubW91bnRzJywgKCkgPT4gewogICAgY29uc3Qgc29ja2V0ID0gY3JlYXRlQXVjdGlvblNvY2tldCgpOwogICAgY29uc3QgeyB1bm1vdW50IH0gPSByZW5kZXJIb29rKCgpID0+IHVzZUJpZEZlZWQoc29ja2V0LCBqZXN0LmZuKCkpKTsKICAgIGV4cGVjdChzb2NrZXQubGlzdGVuZXJDb3VudCgnYmlkJykpLnRvQmUoMSk7CiAgICBuYXZpZ2F0aW9uLmJsdXIoKTsKICAgIGV4cGVjdChzb2NrZXQubGlzdGVuZXJDb3VudCgnYmlkJykpLnRvQmUoMCk7CiAgICBuYXZpZ2F0aW9uLmZvY3VzKCk7CiAgICBleHBlY3Qoc29ja2V0Lmxpc3RlbmVyQ291bnQoJ2JpZCcpKS50b0JlKDEpOwogICAgdW5tb3VudCgpOwogICAgZXhwZWN0KHNvY2tldC5saXN0ZW5lckNvdW50KCdiaWQnKSkudG9CZSgwKTsKICB9KTsKfSk7CgpkZXNjcmliZSgnZm9yZWdyb3VuZCByZXN5bmMnLCAoKSA9PiB7CiAgaXQoJ2tlZXBzIG9uZSBBcHBTdGF0ZSBsaXN0ZW5lciBhbmQgcmVtb3ZlcyBpdCBvbiB1bm1vdW50JywgKCkgPT4gewogICAgY29uc3QgeyByZXJlbmRlciwgdW5tb3VudCB9ID0gcmVuZGVySG9vaygoeyBjYiB9OiB7IGNiOiAoKSA9PiB2b2lkIH0pID0+IHVzZU9uRm9yZWdyb3VuZChjYiksIHsKICAgICAgaW5pdGlhbFByb3BzOiB7IGNiOiBqZXN0LmZuKCkgfSwKICAgIH0pOwogICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHJlcmVuZGVyKHsgY2I6IGplc3QuZm4oKSB9KTsKICAgIGV4cGVjdChhcHBTdGF0ZS5saXN0ZW5lckNvdW50KCkpLnRvQmUoMSk7CiAgICB1bm1vdW50KCk7CiAgICBleHBlY3QoYXBwU3RhdGUubGlzdGVuZXJDb3VudCgpKS50b0JlKDApOwogIH0pOwoKICBpdCgnY2FsbHMgdGhlIGxhdGVzdCBjYWxsYmFjayBvbmNlIHdoZW4gdGhlIGFwcCBiZWNvbWVzIGFjdGl2ZScsICgpID0+IHsKICAgIGNvbnN0IGZpcnN0ID0gamVzdC5mbigpOwogICAgY29uc3QgbGF0ZXN0ID0gamVzdC5mbigpOwogICAgY29uc3QgeyByZXJlbmRlciB9ID0gcmVuZGVySG9vaygoeyBjYiB9OiB7IGNiOiAoKSA9PiB2b2lkIH0pID0+IHVzZU9uRm9yZWdyb3VuZChjYiksIHsKICAgICAgaW5pdGlhbFByb3BzOiB7IGNiOiBmaXJzdCB9LAogICAgfSk7CiAgICByZXJlbmRlcih7IGNiOiBsYXRlc3QgfSk7CiAgICBhcHBTdGF0ZS5zZXQoJ2JhY2tncm91bmQnKTsKICAgIGFwcFN0YXRlLnNldCgnYWN0aXZlJyk7CiAgICBleHBlY3QobGF0ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7CiAgICBleHBlY3QoZmlyc3QpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7CiAgfSk7Cn0pOwo=', 'base64'), 'UTF8'), true, 9),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', '__tests__/BidBoard.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0ICogYXMgUk4gZnJvbSAncmVhY3QtbmF0aXZlJzsKaW1wb3J0IHsgYWN0LCBmaXJlRXZlbnQsIHJlbmRlciwgdGV4dENvbnRlbnQgfSBmcm9tICdAY29kZWFyZW5hL3Rlc3QtdXRpbHMnOwppbXBvcnQgeyByZW5kZXJDb3VudCwgcmVzZXRSZW5kZXJDb3VudHMsIHRvdGFsUmVuZGVycyB9IGZyb20gJy4uL3NyYy9kZWJ1Zy9yZW5kZXJDb3VudGVyJzsKaW1wb3J0IHsgY3JlYXRlQXVjdGlvblNvY2tldCB9IGZyb20gJy4uL3NyYy9yZWFsdGltZS9hdWN0aW9uU29ja2V0JzsKaW1wb3J0IHsgQXVjdGlvblNjcmVlbiB9IGZyb20gJy4uL3NyYy9zY3JlZW5zL0F1Y3Rpb25TY3JlZW4nOwppbXBvcnQgdHlwZSB7IEJpZCB9IGZyb20gJy4uL3NyYy90eXBlcyc7Cgpjb25zdCBiaWRzOiBCaWRbXSA9IEFycmF5LmZyb20oeyBsZW5ndGg6IDMwIH0sIChfLCBpKSA9PiAoewogIGlkOiBgYiR7aX1gLAogIHN1cHBsaWVyOiBgU3VwcGxpZXIgJHtpfWAsCiAgYW1vdW50TWlub3I6IDEwMF8wMDAgKyBpICogNTAsCn0pKTsKCi8qKgogKiBSb3cgcmVuZGVycyBhcyBSZWFjdCBwZXJmb3JtcyB0aGVtOiBlYWNoIHJvdydzIGFtb3VudCA8VGV4dCB0ZXN0SUQ9ImJpZC08aWQ+LWFtb3VudCI+IGNvdW50cwogKiBpdHNlbGYsIHdoYXRldmVyIHRoZSByb3cncyBvd24gY29kZSBkb2VzLgogKi8KY29uc3Qgcm93UmVuZGVyczogc3RyaW5nW10gPSBbXTsKY29uc3QgT3JpZ2luYWxUZXh0ID0gUk4uVGV4dDsKY29uc3QgcmVhY3ROYXRpdmUgPSBSTiBhcyB1bmtub3duIGFzIHsgVGV4dDogdW5rbm93biB9OwpmdW5jdGlvbiBDb3VudGluZ1RleHQocHJvcHM6IFJlYWN0LkNvbXBvbmVudFByb3BzPHR5cGVvZiBPcmlnaW5hbFRleHQ+KSB7CiAgY29uc3QgaWQgPSAvXmJpZC0oLispLWFtb3VudCQvLmV4ZWMoU3RyaW5nKHByb3BzLnRlc3RJRCA/PyAnJykpPy5bMV07CiAgaWYgKGlkKSByb3dSZW5kZXJzLnB1c2goaWQpOwogIHJldHVybiA8T3JpZ2luYWxUZXh0IHsuLi5wcm9wc30gLz47Cn0KYWZ0ZXJFYWNoKCgpID0+IHsKICByZWFjdE5hdGl2ZS5UZXh0ID0gT3JpZ2luYWxUZXh0Owp9KTsKCmZ1bmN0aW9uIHJlbmRlclNjcmVlbigpIHsKICBqZXN0LnVzZUZha2VUaW1lcnMoKTsKICByZWFjdE5hdGl2ZS5UZXh0ID0gQ291bnRpbmdUZXh0OwogIGNvbnN0IHNvY2tldCA9IGNyZWF0ZUF1Y3Rpb25Tb2NrZXQoKTsKICBjb25zdCB1dGlscyA9IHJlbmRlcigKICAgIDxBdWN0aW9uU2NyZWVuCiAgICAgIHNvY2tldD17c29ja2V0fQogICAgICBpbml0aWFsQmlkcz17Ymlkc30KICAgICAgY2xvc2VzQXQ9e0RhdGUubm93KCkgKyA2MDBfMDAwfQogICAgICBvblBsYWNlQmlkPXtqZXN0LmZuKCl9CiAgICAgIG9uUmVzeW5jPXtqZXN0LmZuKCl9CiAgICAvPiwKICApOwogIHJlc2V0UmVuZGVyQ291bnRzKCk7CiAgcm93UmVuZGVycy5sZW5ndGggPSAwOwogIHJldHVybiB7IHNvY2tldCwgLi4udXRpbHMgfTsKfQoKY29uc3QgcmFua09mID0gKG5vZGU6IFBhcmFtZXRlcnM8dHlwZW9mIHRleHRDb250ZW50PlswXSkgPT4gLyMoXGQrKS8uZXhlYyh0ZXh0Q29udGVudChub2RlKSk/LlsxXTsKCmRlc2NyaWJlKCdiaWQgYm9hcmQgcGVyZm9ybWFuY2UnLCAoKSA9PiB7CiAgaXQoInJvd3MgZG9uJ3QgcmUtcmVuZGVyIHdoaWxlIHRoZSBjb3VudGRvd24gdGlja3MiLCAoKSA9PiB7CiAgICByZW5kZXJTY3JlZW4oKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoM18wMDApKTsKICAgIGV4cGVjdCh0b3RhbFJlbmRlcnMoJ0JpZFJvdzonKSkudG9CZSgwKTsKICAgIGV4cGVjdChyb3dSZW5kZXJzKS50b0VxdWFsKFtdKTsKICB9KTsKCiAgaXQoJ3NlbGVjdGluZyBhIGJpZCByZS1yZW5kZXJzIG9ubHkgdGhlIHJvd3Mgd2hvc2Ugc2VsZWN0aW9uIGNoYW5nZWQnLCAoKSA9PiB7CiAgICBjb25zdCB7IGdldEJ5VGVzdElkIH0gPSByZW5kZXJTY3JlZW4oKTsKICAgIGZpcmVFdmVudC5wcmVzcyhnZXRCeVRlc3RJZCgnYmlkLWI1JykpOwogICAgZXhwZWN0KHJlbmRlckNvdW50KCdCaWRSb3c6YjUnKSkudG9CZSgxKTsKICAgIGV4cGVjdCh0b3RhbFJlbmRlcnMoJ0JpZFJvdzonKSkudG9CZSgxKTsKICAgIGV4cGVjdChyb3dSZW5kZXJzKS50b0VxdWFsKFsnYjUnXSk7CgogICAgZmlyZUV2ZW50LnByZXNzKGdldEJ5VGVzdElkKCdiaWQtYjcnKSk7CiAgICBleHBlY3QodG90YWxSZW5kZXJzKCdCaWRSb3c6JykpLnRvQmUoMyk7IC8vIGI1IGRlc2VsZWN0ZWQsIGI3IHNlbGVjdGVkCiAgICBleHBlY3QoWy4uLnJvd1JlbmRlcnNdLnNvcnQoKSkudG9FcXVhbChbJ2I1JywgJ2I1JywgJ2I3J10pOwogICAgZXhwZWN0KGdldEJ5VGVzdElkKCdiaWQtYjctc2VsZWN0ZWQnKSkudG9CZVRydXRoeSgpOwogIH0pOwoKICBpdCgnYSBuZXcgYmlkIHRoYXQgcmFua3MgbGFzdCByZW5kZXJzIG9ubHkgaXRzIG93biByb3cnLCAoKSA9PiB7CiAgICBjb25zdCB7IHNvY2tldCwgZ2V0QnlUZXN0SWQgfSA9IHJlbmRlclNjcmVlbigpOwogICAgYWN0KCgpID0+IHNvY2tldC5lbWl0KCdiaWQnLCB7IGlkOiAnbGF0ZScsIHN1cHBsaWVyOiAnTGF0ZSBDbycsIGFtb3VudE1pbm9yOiA5MDBfMDAwIH0pKTsKICAgIGV4cGVjdChnZXRCeVRlc3RJZCgnYmlkLWxhdGUnKSkudG9CZVRydXRoeSgpOwogICAgZXhwZWN0KHRvdGFsUmVuZGVycygnQmlkUm93OicpKS50b0JlKDEpOwogICAgZXhwZWN0KHJvd1JlbmRlcnMpLnRvRXF1YWwoWydsYXRlJ10pOwogIH0pOwoKICBpdCgnYSBuZXcgYmVzdCBiaWQgYmVjb21lcyAjMSBhbmQgbW92ZXMgZXZlcnkgb3RoZXIgYmlkIGRvd24nLCAoKSA9PiB7CiAgICBjb25zdCB7IHNvY2tldCwgZ2V0QnlUZXN0SWQgfSA9IHJlbmRlclNjcmVlbigpOwogICAgYWN0KCgpID0+IHNvY2tldC5lbWl0KCdiaWQnLCB7IGlkOiAnYmVzdCcsIHN1cHBsaWVyOiAnQmVzdCBDbycsIGFtb3VudE1pbm9yOiA5MF8wMDAgfSkpOwogICAgZXhwZWN0KHJhbmtPZihnZXRCeVRlc3RJZCgnYmlkLWJlc3QnKSkpLnRvQmUoJzEnKTsKICAgIGV4cGVjdChyYW5rT2YoZ2V0QnlUZXN0SWQoJ2JpZC1iMCcpKSkudG9CZSgnMicpOwogICAgZXhwZWN0KHJhbmtPZihnZXRCeVRlc3RJZCgnYmlkLWIyOScpKSkudG9CZSgnMzEnKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 10),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', '__tests__/money.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgZm9ybWF0UnVwZWVzLCBpc1ZhbGlkQmlkLCBwYXJzZVJ1cGVlcyB9IGZyb20gJy4uL3NyYy91dGlscy9tb25leSc7CgpkZXNjcmliZSgnYmlkIHJ1bGVzJywgKCkgPT4gewogIGl0KCdhY2NlcHRzIGEgYmlkIHRoYXQgdW5kZXJjdXRzIHRoZSBiZXN0IGJpZCBieSBhdCBsZWFzdCB0aGUgbWluaW11bSBkZWNyZW1lbnQnLCAoKSA9PiB7CiAgICAvLyBbYmlkLCBiZXN0LCBtaW4gZGVjcmVtZW50LCB2YWxpZD9dCiAgICBjb25zdCBjYXNlczogW251bWJlciwgbnVtYmVyLCBudW1iZXIsIGJvb2xlYW5dW10gPSBbCiAgICAgIFs5OTkuOTUsIDEwMDAuMDUsIDAuMSwgdHJ1ZV0sCiAgICAgIFs5OTkuOTQsIDEwMDAuMDUsIDAuMSwgdHJ1ZV0sCiAgICAgIFs5OTkuOTYsIDEwMDAuMDUsIDAuMSwgZmFsc2VdLAogICAgICBbMC4yLCAwLjMsIDAuMSwgdHJ1ZV0sCiAgICAgIFswLjIxLCAwLjMsIDAuMSwgZmFsc2VdLAogICAgICBbMTIzNC41LCAxMjM0LjYsIDAuMSwgdHJ1ZV0sCiAgICAgIFsyNTUuOTMsIDI1Ni4wMywgMC4xLCB0cnVlXSwKICAgICAgWzAuMTEsIDAuMjEsIDAuMSwgdHJ1ZV0sCiAgICBdOwogICAgZm9yIChjb25zdCBbYmlkLCBiZXN0LCBkZWMsIHZhbGlkXSBvZiBjYXNlcykgewogICAgICBleHBlY3QoYCR7YmlkfSBhZ2FpbnN0ICR7YmVzdH06ICR7aXNWYWxpZEJpZChiaWQsIGJlc3QsIGRlYyl9YCkudG9CZShgJHtiaWR9IGFnYWluc3QgJHtiZXN0fTogJHt2YWxpZH1gKTsKICAgIH0KICB9KTsKCiAgaXQoJ3JlamVjdHMgemVybywgbmVnYXRpdmUgYW5kIG5vbi1udW1lcmljIGFtb3VudHMnLCAoKSA9PiB7CiAgICBleHBlY3QocGFyc2VSdXBlZXMoJzAnKSkudG9CZU51bGwoKTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygnLTUnKSkudG9CZU51bGwoKTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygnYWJjJykpLnRvQmVOdWxsKCk7CiAgICBleHBlY3QocGFyc2VSdXBlZXMoJzEsMDAwLjA1JykpLnRvQmUoMTAwMC4wNSk7CiAgICBleHBlY3QoaXNWYWxpZEJpZCgwLCAxMCwgMC4xKSkudG9CZShmYWxzZSk7CiAgfSk7CgogIGl0KCdmb3JtYXRzIGFtb3VudHMgaW4gcnVwZWVzIHdpdGggSW5kaWFuIGRpZ2l0IGdyb3VwaW5nJywgKCkgPT4gewogICAgZXhwZWN0KGZvcm1hdFJ1cGVlcygxMjM0NTY3LjUpKS50b0JlKCfigrkxMiwzNCw1NjcuNTAnKTsKICAgIGV4cGVjdChmb3JtYXRSdXBlZXMoMC4xICsgMC4yKSkudG9CZSgn4oK5MC4zMCcpOwogICAgZXhwZWN0KGZvcm1hdFJ1cGVlcyg5OTkuOTUpKS50b0JlKCfigrk5OTkuOTUnKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 11),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'package.json', 'json', convert_from(decode('ewogICJuYW1lIjogInp5Y3VzLWVzb3VyY2luZy1hdWN0aW9uIiwKICAidmVyc2lvbiI6ICIyLjcuMSIsCiAgInByaXZhdGUiOiB0cnVlLAogICJzY3JpcHRzIjogewogICAgInN0YXJ0IjogInJlYWN0LW5hdGl2ZSBzdGFydCIsCiAgICAidGVzdCI6ICJqZXN0IgogIH0sCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJAcmVhY3QtbmF2aWdhdGlvbi9uYXRpdmUiOiAiNy4xLjE3IiwKICAgICJyZWFjdCI6ICIxOS4xLjAiLAogICAgInJlYWN0LW5hdGl2ZSI6ICIwLjgxLjQiCiAgfSwKICAiZGV2RGVwZW5kZW5jaWVzIjogewogICAgIkB0ZXN0aW5nLWxpYnJhcnkvcmVhY3QtbmF0aXZlIjogIjEzLjMuMyIsCiAgICAiamVzdCI6ICIyOS43LjAiLAogICAgInR5cGVzY3JpcHQiOiAiNS44LjMiCiAgfQp9Cg==', 'base64'), 'UTF8'), true, 12)
  on conflict (question_id, path) do update set language = excluded.language, content = excluded.content,
    readonly = excluded.readonly, sort_order = excluded.sort_order;
  delete from public.question_rubric_items where question_id = 'a7dcbe6c-f122-4051-8368-41c2659815d7' and key <> all (array['countdown', 'listeners', 'rendering', 'money', 'code_quality']::text[]);
  insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'countdown', 'Countdown survives extensions and backgrounding', 'Depends on closesAt and recomputes immediately; derives remaining time from the wall clock each tick.', 6, 0),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'listeners', 'No listener leaks', 'useFocusEffect with useCallback and one stable handler (same reference for on/off); latest callback via ref; AppState subscription removed in cleanup.', 6, 1),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'rendering', 'Rows re-render only when their data changes', convert_from(decode('U3RhYmxlIG9uU2VsZWN0LCBubyBpbmxpbmUgc3R5bGUgb2JqZWN0cywgbWVtb2lzZWQgcmVuZGVySXRlbS9ib2FyZDsgZXhwbGFpbnMgbWVtbydzIGlkZW50aXR5IGNvbXBhcmlzb24u', 'base64'), 'UTF8'), 5, 2),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'money', 'Correct money arithmetic and formatting', 'Compares integer paise; formats with Intl (en-IN, INR).', 3, 3),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'code_quality', 'Root-cause fixes, clean code', 'No sleeps, no test special-casing, no isMounted flags; instrumentation kept.', 2, 4)
  on conflict (question_id, key) do update set criterion = excluded.criterion,
    description = excluded.description, max_points = excluded.max_points, sort_order = excluded.sort_order;
  insert into public.question_solutions (question_id, notes_md, files) values (
    'a7dcbe6c-f122-4051-8368-41c2659815d7', convert_from(decode('IyMjIFJlZmVyZW5jZSBub3RlcyAocmV2aWV3ZXJzIG9ubHkpCgoxLiAqKkNvdW50ZG93bioqIChgaG9va3MvdXNlQ291bnRkb3duLnRzYCk6IHR3byBidWdzLiBUaGUgZWZmZWN0IGhhcyBgW11gIGRlcHMsIHNvIGEgY2hhbmdlZAogICBgY2xvc2VzQXRgIChhdWN0aW9uIGV4dGVuZGVkKSBpcyBpZ25vcmVkOyBhbmQgaXQgZGVjcmVtZW50cyBwZXIgdGljaywgd2hpY2ggZHJpZnRzIGJlY2F1c2UKICAgdGltZXJzIHBhdXNlL3Rocm90dGxlIGluIHRoZSBiYWNrZ3JvdW5kLiBGaXg6IGRlcGVuZCBvbiBgY2xvc2VzQXRgLCByZWNvbXB1dGUgaW1tZWRpYXRlbHksIGFuZAogICBkZXJpdmUgZnJvbSBgY2xvc2VzQXQgLSBEYXRlLm5vdygpYCBvbiBlYWNoIHRpY2suCjIuICoqTGlzdGVuZXIgbGVha3MqKiAoYGhvb2tzL3VzZUF1Y3Rpb25MaXN0ZW5lcnMudHNgKTogdGhlIGB1c2VGb2N1c0VmZmVjdGAgY2FsbGJhY2sgaXNuJ3QKICAgbWVtb2lzZWQgKHJlLXN1YnNjcmliZXMgZXZlcnkgcmVuZGVyKSBhbmQgYG9mZihvbkJpZClgIHJlbW92ZXMgYSBkaWZmZXJlbnQgZnVuY3Rpb24gdGhhbiB0aGUKICAgd3JhcHBlciBwYXNzZWQgdG8gYG9uKClgOyB0aGUgQXBwU3RhdGUgc3Vic2NyaXB0aW9uIGlzIG5ldmVyIHJlbW92ZWQgKG9uZSBtb3JlIHBlciBjYWxsYmFjawogICBjaGFuZ2UsIGFuZCBzdGFsZSBjYWxsYmFja3MgZmlyZSkuIEZpeDogYHVzZUNhbGxiYWNrYCArIHN0YWJsZSBoYW5kbGVyICsgbGF0ZXN0LWNhbGxiYWNrIHJlZjsKICAgYHN1Yi5yZW1vdmUoKWAgaW4gY2xlYW51cC4KMy4gKipSZS1yZW5kZXIgc3Rvcm0qKiAoYGNvbXBvbmVudHMvQmlkQm9hcmQudHN4YCwgYHNjcmVlbnMvQXVjdGlvblNjcmVlbi50c3hgKTogYFJlYWN0Lm1lbW9gCiAgIHJvd3MgcmVjZWl2ZSBhIG5ldyBgb25QcmVzc2AgY2xvc3VyZSBhbmQgYSBuZXcgYHN0eWxlYCBvYmplY3QgZXZlcnkgcmVuZGVyLCBhbmQgdGhlIHNjcmVlbgogICByZS1yZW5kZXJzIGV2ZXJ5IHNlY29uZC4gRml4OiBzdGFibGUgYG9uU2VsZWN0KGlkKWAgdmlhIGB1c2VDYWxsYmFja2AsIGBTdHlsZVNoZWV0YCBzdHlsZXMsCiAgIG1lbW9pc2VkIGByZW5kZXJJdGVtYC9ib2FyZC4gKE1vdmluZyB0aGUgY291bnRkb3duIGludG8gaXRzIG93biBjb21wb25lbnQgaXMgYWxzbyBmaW5lLikKNC4gKipNb25leSoqIChgdXRpbHMvbW9uZXkudHNgKTogZmxvYXQgc3VidHJhY3Rpb24gKGAxMDAwLjA1IC0gMC4xID0gOTk5Ljk0OTk5OTk5OTk5OTlgKTsgY29tcGFyZQogICBpbnRlZ2VyIHBhaXNlLiBGb3JtYXQgd2l0aCBgSW50bC5OdW1iZXJGb3JtYXQoJ2VuLUlOJywgeyBzdHlsZTogJ2N1cnJlbmN5JywgY3VycmVuY3k6ICdJTlInIH0pYC4KCioqU2VuaW9yIHNpZ25hbHM6KiogZXhwbGFpbnMgdGltZXIgdGhyb3R0bGluZyBpbiB0aGUgYmFja2dyb3VuZCBhbmQgd2h5IHdhbGwtY2xvY2sgZGVyaXZhdGlvbiBpcwp0aGUgZml4IChub3QgYSBzaG9ydGVyIGludGVydmFsKTsgaWRlbnRpZmllcyB0aGUgcmVmZXJlbmNlIG1pc21hdGNoIGluIGBvbmAvYG9mZmA7IGV4cGxhaW5zIG1lbW8ncwppZGVudGl0eSBjb21wYXJpc29uOyBhdm9pZHMgYGlzTW91bnRlZGAgZmxhZ3MuCg==', 'base64'), 'UTF8'), (convert_from(decode('W3sicGF0aCI6InNyYy9ob29rcy91c2VDb3VudGRvd24udHMiLCJjb250ZW50IjoiaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcblxuLyoqIFRpbWUgbGVmdCB1bnRpbCB0aGUgYXVjdGlvbiBjbG9zZXMsIHVwZGF0ZWQgZXZlcnkgc2Vjb25kLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUNvdW50ZG93bihjbG9zZXNBdDogbnVtYmVyKSB7XG4gIGNvbnN0IFtyZW1haW5pbmcsIHNldFJlbWFpbmluZ10gPSB1c2VTdGF0ZSgoKSA9PiBNYXRoLm1heCgwLCBjbG9zZXNBdCAtIERhdGUubm93KCkpKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIEZJWDogZGVyaXZlIHRoZSByZW1haW5pbmcgdGltZSBmcm9tIHRoZSB3YWxsIGNsb2NrIG9uIGV2ZXJ5IHRpY2sgKGNvdW50aW5nIHRpY2tzIGRyaWZ0czpcbiAgICAvLyB0aW1lcnMgcGF1c2Ugb3IgYXJlIHRocm90dGxlZCBpbiB0aGUgYmFja2dyb3VuZCkgYW5kIHJlc3RhcnQgd2hlbiBjbG9zZXNBdCBjaGFuZ2VzXG4gICAgLy8gKHRoZSBlbXB0eSBkZXBzIGFycmF5IGtlcHQgdGhlIGNsb3NpbmcgdGltZSBmcm9tIHRoZSBmaXJzdCByZW5kZXIsIGlnbm9yaW5nIGV4dGVuc2lvbnMpLlxuICAgIGNvbnN0IHVwZGF0ZSA9ICgpID0+IHNldFJlbWFpbmluZyhNYXRoLm1heCgwLCBjbG9zZXNBdCAtIERhdGUubm93KCkpKTtcbiAgICB1cGRhdGUoKTtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKHVwZGF0ZSwgMTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaWQpO1xuICB9LCBbY2xvc2VzQXRdKTtcblxuICByZXR1cm4geyByZW1haW5pbmcsIGNsb3NlZDogcmVtYWluaW5nID09PSAwIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRSZW1haW5pbmcobXM6IG51bWJlcik6IHN0cmluZyB7XG4gIGNvbnN0IHMgPSBNYXRoLmNlaWwobXMgLyAxMDAwKTtcbiAgcmV0dXJuIGAke01hdGguZmxvb3IocyAvIDYwKX06JHtTdHJpbmcocyAlIDYwKS5wYWRTdGFydCgyLCAnMCcpfWA7XG59XG4ifSx7InBhdGgiOiJzcmMvaG9va3MvdXNlQXVjdGlvbkxpc3RlbmVycy50cyIsImNvbnRlbnQiOiJpbXBvcnQgeyB1c2VGb2N1c0VmZmVjdCB9IGZyb20gJ0ByZWFjdC1uYXZpZ2F0aW9uL25hdGl2ZSc7XG5pbXBvcnQgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VSZWYgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBBcHBTdGF0ZSB9IGZyb20gJ3JlYWN0LW5hdGl2ZSc7XG5pbXBvcnQgdHlwZSB7IEF1Y3Rpb25Tb2NrZXQgfSBmcm9tICcuLi9yZWFsdGltZS9hdWN0aW9uU29ja2V0JztcbmltcG9ydCB0eXBlIHsgQmlkIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG4vKiogTGl2ZSBiaWRzIGZvciB0aGUgYXVjdGlvbiwgb25seSB3aGlsZSB0aGlzIHNjcmVlbiBpcyBmb2N1c2VkIChzYXZlcyBiYXR0ZXJ5IGFuZCBkYXRhKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VCaWRGZWVkKHNvY2tldDogQXVjdGlvblNvY2tldCwgb25CaWQ6IChiaWQ6IEJpZCkgPT4gdm9pZCkge1xuICAvLyBGSVg6IGtlZXAgdGhlIGxhdGVzdCBjYWxsYmFjayBpbiBhIHJlZiBhbmQgc3Vic2NyaWJlIHdpdGggT05FIHN0YWJsZSBoYW5kbGVyLiBUaGUgaW5saW5lXG4gIC8vIGVmZmVjdCByZS1zdWJzY3JpYmVkIG9uIGV2ZXJ5IHJlbmRlciwgYW5kIG9mZihvbkJpZCkgcmVtb3ZlZCBhIGRpZmZlcmVudCBmdW5jdGlvbiB0aGFuIHRoZVxuICAvLyB3cmFwcGVyIHBhc3NlZCB0byBvbigpLCBzbyBsaXN0ZW5lcnMgcGlsZWQgdXAgKGR1cGxpY2F0ZSBiaWRzLCB1cGRhdGVzIG9uIGEgYmx1cnJlZCBzY3JlZW4pLlxuICBjb25zdCBsYXRlc3QgPSB1c2VSZWYob25CaWQpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxhdGVzdC5jdXJyZW50ID0gb25CaWQ7XG4gIH0pO1xuICB1c2VGb2N1c0VmZmVjdChcbiAgICB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gKGJpZDogQmlkKSA9PiBsYXRlc3QuY3VycmVudChiaWQpO1xuICAgICAgc29ja2V0Lm9uKCdiaWQnLCBoYW5kbGVyKTtcbiAgICAgIHJldHVybiAoKSA9PiBzb2NrZXQub2ZmKCdiaWQnLCBoYW5kbGVyKTtcbiAgICB9LCBbc29ja2V0XSksXG4gICk7XG59XG5cbi8qKiBDYWxscyBgb25Gb3JlZ3JvdW5kYCB3aGVuIHRoZSBhcHAgcmV0dXJucyB0byB0aGUgZm9yZWdyb3VuZCAodG8gcmVzeW5jIHRoZSBib2FyZCkuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlT25Gb3JlZ3JvdW5kKG9uRm9yZWdyb3VuZDogKCkgPT4gdm9pZCkge1xuICBjb25zdCBsYXRlc3QgPSB1c2VSZWYob25Gb3JlZ3JvdW5kKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsYXRlc3QuY3VycmVudCA9IG9uRm9yZWdyb3VuZDtcbiAgfSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgLy8gRklYOiByZW1vdmUgdGhlIHN1YnNjcmlwdGlvbiBpbiB0aGUgY2xlYW51cCAoaXQgbGVha2VkIG9uZSBsaXN0ZW5lciBwZXIgY2FsbGJhY2sgY2hhbmdlKS5cbiAgICBjb25zdCBzdWIgPSBBcHBTdGF0ZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoc3RhdGUpID0+IHtcbiAgICAgIGlmIChzdGF0ZSA9PT0gJ2FjdGl2ZScpIGxhdGVzdC5jdXJyZW50KCk7XG4gICAgfSk7XG4gICAgcmV0dXJuICgpID0+IHN1Yi5yZW1vdmUoKTtcbiAgfSwgW10pO1xufVxuIn0seyJwYXRoIjoic3JjL3V0aWxzL21vbmV5LnRzIiwiY29udGVudCI6Ii8qKiBQYXJzZXMgd2hhdCB0aGUgc3VwcGxpZXIgdHlwZWQgKFwiMSwwMDAuMDVcIikgaW50byBydXBlZXMuIFJldHVybnMgbnVsbCBpZiBpdCBpc24ndCBhIHBvc2l0aXZlIGFtb3VudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVJ1cGVlcyhpbnB1dDogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IG4gPSBOdW1iZXIoaW5wdXQucmVwbGFjZSgvLC9nLCAnJykudHJpbSgpKTtcbiAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShuKSAmJiBuID4gMCA/IG4gOiBudWxsO1xufVxuXG4vLyBGSVg6IGNvbXBhcmUgbW9uZXkgaW4gaW50ZWdlciBwYWlzZS4gSW4gZmxvYXRpbmcgcG9pbnQgMTAwMC4wNSAtIDAuMTAgaXMgOTk5Ljk0OTk5OTk5OTk5OTksIHNvXG4vLyBhIHZhbGlkIOKCuTk5OS45NSBiaWQgd2FzIHJlamVjdGVkIChhbmQgMC4zIC0gMC4xIGlzIDAuMTk5OTk5OTk5OTk5OTk5OTgpLlxuY29uc3QgdG9QYWlzZSA9IChydXBlZXM6IG51bWJlcikgPT4gTWF0aC5yb3VuZChydXBlZXMgKiAxMDApO1xuXG4vKipcbiAqIEluIGEgcmV2ZXJzZSBhdWN0aW9uIGEgbmV3IGJpZCBtdXN0IHVuZGVyY3V0IHRoZSBjdXJyZW50IGJlc3QgYmlkIGJ5IGF0IGxlYXN0IHRoZSBtaW5pbXVtXG4gKiBkZWNyZW1lbnQ6IGJpZCA8PSBiZXN0IC0gbWluRGVjcmVtZW50LiBBbGwgdmFsdWVzIGluIHJ1cGVlcyAodHdvIGRlY2ltYWxzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRCaWQoYmlkOiBudW1iZXIsIGJlc3Q6IG51bWJlciwgbWluRGVjcmVtZW50OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYiA9IHRvUGFpc2UoYmlkKTtcbiAgcmV0dXJuIGIgPiAwICYmIGIgPD0gdG9QYWlzZShiZXN0KSAtIHRvUGFpc2UobWluRGVjcmVtZW50KTtcbn1cblxuLy8gRklYOiBJbnRsIGZvcm1hdHMgdGhlIGN1cnJlbmN5IHdpdGggSW5kaWFuIGdyb3VwaW5nICgxMiwzNCw1NjcuNTApOyB0b0ZpeGVkIGRvZXNuJ3QgZ3JvdXAuXG5jb25zdCBpbnIgPSBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ2VuLUlOJywge1xuICBzdHlsZTogJ2N1cnJlbmN5JyxcbiAgY3VycmVuY3k6ICdJTlInLFxuICBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDIsXG4gIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMixcbn0pO1xuXG4vKiogXCLigrkxMiwzNCw1NjcuNTBcIiAoSW5kaWFuIGRpZ2l0IGdyb3VwaW5nKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRSdXBlZXMoYW1vdW50OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gaW5yLmZvcm1hdChhbW91bnQpO1xufVxuIn0seyJwYXRoIjoic3JjL2NvbXBvbmVudHMvQmlkQm9hcmQudHN4IiwiY29udGVudCI6ImltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjayB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEZsYXRMaXN0LCBQcmVzc2FibGUsIFN0eWxlU2hlZXQsIFRleHQsIHR5cGUgTGlzdFJlbmRlckl0ZW0gfSBmcm9tICdyZWFjdC1uYXRpdmUnO1xuaW1wb3J0IHsgdHJhY2tSZW5kZXIgfSBmcm9tICcuLi9kZWJ1Zy9yZW5kZXJDb3VudGVyJztcbmltcG9ydCB0eXBlIHsgQmlkIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgZm9ybWF0UnVwZWVzIH0gZnJvbSAnLi4vdXRpbHMvbW9uZXknO1xuXG5pbnRlcmZhY2UgQmlkUm93UHJvcHMge1xuICBiaWQ6IEJpZDtcbiAgcmFuazogbnVtYmVyO1xuICBzZWxlY3RlZDogYm9vbGVhbjtcbiAgLyoqIFN0YWJsZSBhY3Jvc3MgcmVuZGVyczogdGhlIHJvdyBjYWxscyBpdCB3aXRoIGl0cyBvd24gaWQuICovXG4gIG9uU2VsZWN0OiAoaWQ6IHN0cmluZykgPT4gdm9pZDtcbn1cblxuLy8gRklYOiBSZWFjdC5tZW1vIGNvbXBhcmVzIHByb3BzIGJ5IGlkZW50aXR5LiBBIG5ldyBgb25QcmVzc2AgY2xvc3VyZSBhbmQgYSBuZXcgYHN0eWxlYCBvYmplY3Qgb25cbi8vIGV2ZXJ5IHJlbmRlciBtYWRlIGV2ZXJ5IHJvdyByZS1yZW5kZXIgb24gZXZlcnkgcGFyZW50IHJlbmRlciAoZXZlcnkgY291bnRkb3duIHRpY2ssIGV2ZXJ5IGJpZCkuXG4vLyBSb3dzIG5vdyBnZXQgb25seSBzdGFibGUgcHJvcHM6IGRhdGEsIHJhbmssIGEgYm9vbGVhbiwgYW5kIGEgc3RhYmxlIG9uU2VsZWN0KGlkKS5cbmV4cG9ydCBjb25zdCBCaWRSb3cgPSBSZWFjdC5tZW1vKGZ1bmN0aW9uIEJpZFJvdyh7IGJpZCwgcmFuaywgc2VsZWN0ZWQsIG9uU2VsZWN0IH06IEJpZFJvd1Byb3BzKSB7XG4gIHRyYWNrUmVuZGVyKGBCaWRSb3c6JHtiaWQuaWR9YCk7XG4gIHJldHVybiAoXG4gICAgPFByZXNzYWJsZVxuICAgICAgdGVzdElEPXtgYmlkLSR7YmlkLmlkfWB9XG4gICAgICBvblByZXNzPXsoKSA9PiBvblNlbGVjdChiaWQuaWQpfVxuICAgICAgc3R5bGU9e1tzdHlsZXMucm93LCBzZWxlY3RlZCA/IHN0eWxlcy5zZWxlY3RlZCA6IHN0eWxlcy51bnNlbGVjdGVkXX1cbiAgICA+XG4gICAgICA8VGV4dD4je3Jhbmt9PC9UZXh0PlxuICAgICAgPFRleHQgc3R5bGU9e3N0eWxlcy5zdXBwbGllcn0+e2JpZC5zdXBwbGllcn08L1RleHQ+XG4gICAgICA8VGV4dCB0ZXN0SUQ9e2BiaWQtJHtiaWQuaWR9LWFtb3VudGB9Pntmb3JtYXRSdXBlZXMoYmlkLmFtb3VudE1pbm9yIC8gMTAwKX08L1RleHQ+XG4gICAgICB7c2VsZWN0ZWQgJiYgPFRleHQgdGVzdElEPXtgYmlkLSR7YmlkLmlkfS1zZWxlY3RlZGB9PlNlbGVjdGVkPC9UZXh0Pn1cbiAgICA8L1ByZXNzYWJsZT5cbiAgKTtcbn0pO1xuXG5leHBvcnQgY29uc3QgQmlkQm9hcmQgPSBSZWFjdC5tZW1vKGZ1bmN0aW9uIEJpZEJvYXJkKHtcbiAgYmlkcyxcbiAgc2VsZWN0ZWRJZCxcbiAgb25TZWxlY3QsXG59OiB7XG4gIGJpZHM6IEJpZFtdO1xuICBzZWxlY3RlZElkOiBzdHJpbmcgfCBudWxsO1xuICBvblNlbGVjdDogKGlkOiBzdHJpbmcpID0+IHZvaWQ7XG59KSB7XG4gIGNvbnN0IHJlbmRlckl0ZW0gPSB1c2VDYWxsYmFjazxMaXN0UmVuZGVySXRlbTxCaWQ+PihcbiAgICAoeyBpdGVtLCBpbmRleCB9KSA9PiAoXG4gICAgICA8QmlkUm93IGJpZD17aXRlbX0gcmFuaz17aW5kZXggKyAxfSBzZWxlY3RlZD17aXRlbS5pZCA9PT0gc2VsZWN0ZWRJZH0gb25TZWxlY3Q9e29uU2VsZWN0fSAvPlxuICAgICksXG4gICAgW3NlbGVjdGVkSWQsIG9uU2VsZWN0XSxcbiAgKTtcbiAgcmV0dXJuIDxGbGF0TGlzdCB0ZXN0SUQ9XCJiaWQtYm9hcmRcIiBkYXRhPXtiaWRzfSBrZXlFeHRyYWN0b3I9eyhiKSA9PiBiLmlkfSByZW5kZXJJdGVtPXtyZW5kZXJJdGVtfSAvPjtcbn0pO1xuXG5jb25zdCBzdHlsZXMgPSBTdHlsZVNoZWV0LmNyZWF0ZSh7XG4gIHJvdzogeyBmbGV4RGlyZWN0aW9uOiAncm93JywgcGFkZGluZ1ZlcnRpY2FsOiAxMCwgcGFkZGluZ0hvcml6b250YWw6IDE2IH0sXG4gIHNlbGVjdGVkOiB7IG9wYWNpdHk6IDEgfSxcbiAgdW5zZWxlY3RlZDogeyBvcGFjaXR5OiAwLjkgfSxcbiAgc3VwcGxpZXI6IHsgZmxleDogMSwgbWFyZ2luSG9yaXpvbnRhbDogOCB9LFxufSk7XG4ifSx7InBhdGgiOiJzcmMvc2NyZWVucy9BdWN0aW9uU2NyZWVuLnRzeCIsImNvbnRlbnQiOiJpbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2ssIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgUHJlc3NhYmxlLCBUZXh0LCBUZXh0SW5wdXQsIFZpZXcgfSBmcm9tICdyZWFjdC1uYXRpdmUnO1xuaW1wb3J0IHsgQmlkQm9hcmQgfSBmcm9tICcuLi9jb21wb25lbnRzL0JpZEJvYXJkJztcbmltcG9ydCB7IGZvcm1hdFJlbWFpbmluZywgdXNlQ291bnRkb3duIH0gZnJvbSAnLi4vaG9va3MvdXNlQ291bnRkb3duJztcbmltcG9ydCB7IHVzZUJpZEZlZWQsIHVzZU9uRm9yZWdyb3VuZCB9IGZyb20gJy4uL2hvb2tzL3VzZUF1Y3Rpb25MaXN0ZW5lcnMnO1xuaW1wb3J0IHR5cGUgeyBBdWN0aW9uU29ja2V0IH0gZnJvbSAnLi4vcmVhbHRpbWUvYXVjdGlvblNvY2tldCc7XG5pbXBvcnQgdHlwZSB7IEJpZCB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IGZvcm1hdFJ1cGVlcywgaXNWYWxpZEJpZCwgcGFyc2VSdXBlZXMgfSBmcm9tICcuLi91dGlscy9tb25leSc7XG5cbi8qKiBNaW5pbXVtIGFtb3VudCAocnVwZWVzKSBhIG5ldyBiaWQgbXVzdCB1bmRlcmN1dCB0aGUgYmVzdCBiaWQgYnkuICovXG5leHBvcnQgY29uc3QgTUlOX0RFQ1JFTUVOVCA9IDAuMTtcblxuZXhwb3J0IGZ1bmN0aW9uIEF1Y3Rpb25TY3JlZW4oe1xuICBzb2NrZXQsXG4gIGluaXRpYWxCaWRzLFxuICBjbG9zZXNBdCxcbiAgb25QbGFjZUJpZCxcbiAgb25SZXN5bmMsXG59OiB7XG4gIHNvY2tldDogQXVjdGlvblNvY2tldDtcbiAgaW5pdGlhbEJpZHM6IEJpZFtdO1xuICBjbG9zZXNBdDogbnVtYmVyO1xuICBvblBsYWNlQmlkOiAoYW1vdW50TWlub3I6IG51bWJlcikgPT4gdm9pZDtcbiAgb25SZXN5bmM6ICgpID0+IHZvaWQ7XG59KSB7XG4gIGNvbnN0IFtiaWRzLCBzZXRCaWRzXSA9IHVzZVN0YXRlKGluaXRpYWxCaWRzKTtcbiAgY29uc3QgW3NlbGVjdGVkSWQsIHNldFNlbGVjdGVkSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtpbnB1dCwgc2V0SW5wdXRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCB7IHJlbWFpbmluZywgY2xvc2VkIH0gPSB1c2VDb3VudGRvd24oY2xvc2VzQXQpO1xuXG4gIHVzZUJpZEZlZWQoc29ja2V0LCAoYmlkKSA9PiBzZXRCaWRzKChjdXJyZW50KSA9PiBbLi4uY3VycmVudCwgYmlkXS5zb3J0KChhLCBiKSA9PiBhLmFtb3VudE1pbm9yIC0gYi5hbW91bnRNaW5vcikpKTtcbiAgdXNlT25Gb3JlZ3JvdW5kKG9uUmVzeW5jKTtcbiAgLy8gRklYOiBhIHN0YWJsZSBjYWxsYmFjayAod2l0aCB0aGUgbWVtb2lzZWQgYm9hcmQvcm93cykgc28gYSBjb3VudGRvd24gdGljayBkb2Vzbid0IHJlLXJlbmRlciByb3dzLlxuICBjb25zdCBzZWxlY3QgPSB1c2VDYWxsYmFjaygoaWQ6IHN0cmluZykgPT4gc2V0U2VsZWN0ZWRJZChpZCksIFtdKTtcblxuICBjb25zdCBiZXN0ID0gYmlkcy5sZW5ndGggPyBiaWRzWzBdIS5hbW91bnRNaW5vciAvIDEwMCA6IEluZmluaXR5O1xuICBjb25zdCBhbW91bnQgPSBwYXJzZVJ1cGVlcyhpbnB1dCk7XG4gIGNvbnN0IGNhbkJpZCA9ICFjbG9zZWQgJiYgYW1vdW50ICE9PSBudWxsICYmIGlzVmFsaWRCaWQoYW1vdW50LCBiZXN0LCBNSU5fREVDUkVNRU5UKTtcblxuICByZXR1cm4gKFxuICAgIDxWaWV3PlxuICAgICAgPFRleHQgdGVzdElEPVwiY291bnRkb3duXCI+e2Nsb3NlZCA/ICdBdWN0aW9uIGNsb3NlZCcgOiBmb3JtYXRSZW1haW5pbmcocmVtYWluaW5nKX08L1RleHQ+XG4gICAgICA8VGV4dCB0ZXN0SUQ9XCJiZXN0XCI+e051bWJlci5pc0Zpbml0ZShiZXN0KSA/IGZvcm1hdFJ1cGVlcyhiZXN0KSA6ICfigJQnfTwvVGV4dD5cbiAgICAgIDxCaWRCb2FyZCBiaWRzPXtiaWRzfSBzZWxlY3RlZElkPXtzZWxlY3RlZElkfSBvblNlbGVjdD17c2VsZWN0fSAvPlxuICAgICAgPFRleHRJbnB1dCB0ZXN0SUQ9XCJhbW91bnRcIiB2YWx1ZT17aW5wdXR9IG9uQ2hhbmdlVGV4dD17c2V0SW5wdXR9IGtleWJvYXJkVHlwZT1cImRlY2ltYWwtcGFkXCIgLz5cbiAgICAgIDxQcmVzc2FibGVcbiAgICAgICAgdGVzdElEPVwicGxhY2UtYmlkXCJcbiAgICAgICAgZGlzYWJsZWQ9eyFjYW5CaWR9XG4gICAgICAgIG9uUHJlc3M9eygpID0+IGFtb3VudCAhPT0gbnVsbCAmJiBvblBsYWNlQmlkKE1hdGgucm91bmQoYW1vdW50ICogMTAwKSl9XG4gICAgICA+XG4gICAgICAgIDxUZXh0PlBsYWNlIGJpZDwvVGV4dD5cbiAgICAgIDwvUHJlc3NhYmxlPlxuICAgIDwvVmlldz5cbiAgKTtcbn1cbiJ9XQ==', 'base64'), 'UTF8'))::jsonb
  ) on conflict (question_id) do update set notes_md = excluded.notes_md, files = excluded.files;
  if v_installed is null then
    raise notice 'Question "rn-live-auction": installed (version 3)';
  else
    raise notice 'Question "rn-live-auction": updated from version % to 3', v_installed;
  end if;
end
$question$;

commit;
```

### 34. `supabase/seed/parts/question-spring-po-approvals.sql`

- **Folder:** `supabase/seed/parts`
- **File name:** `question-spring-po-approvals.sql`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 82 lines, 145 KB (large: pasting may take a few seconds)
- **Commit message:** `Sync question-spring-po-approvals.sql (question v3 grading)`

```sql
-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- Question "PO Approvals: transactions, idempotency and concurrency (Spring Boot)". Safe to re-run: what is already installed and up to date is left untouched.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Question: spring-po-approvals (version 3)
do $question$
declare
  v_installed int;
begin
  select version into v_installed from public.questions where id = '04a206ea-655a-40fd-9651-b01088d59d98';
  if v_installed >= 3 then
    raise notice 'Question "spring-po-approvals": version % installed, left unchanged', v_installed;
    return;
  end if;
  insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status, version) values (
    '04a206ea-655a-40fd-9651-b01088d59d98', 'spring-po-approvals', 'PO Approvals: transactions, idempotency and concurrency (Spring Boot)', 'Spring Boot debugging', array['lead-react-native-developer', 'full-stack-developer', 'java-developer']::text[], array['spring-boot', 'spring-data-jpa', 'hibernate', 'transactions', 'idempotency', 'concurrency', 'postgresql']::text[], 'hard', 45,
    convert_from(decode('IyMgUE8gQXBwcm92YWxzIHNlcnZpY2U6IGFwcHJvdmFscyB0aGF0IHNob3VsZG4ndCBoYXZlIGhhcHBlbmVkCgpBcHByb3ZlcnMgdXNlIHRoZSBaeWN1cyBwcm9jdXJlbWVudCBhcHAgdG8gYXBwcm92ZSBvciByZWplY3QgKipwdXJjaGFzZSBvcmRlcnMgKFBPcykqKiwgb25lIGF0IGEKdGltZSBvciBpbiBhIGJhdGNoLCBhbmQgZmluYW5jZSBtYXRjaGVzIHN1cHBsaWVyIGludm9pY2VzIGFnYWluc3QgdGhlbS4gVGhlIGJhY2tlbmQgaXMgdGhpcwpTcHJpbmcgQm9vdCAzLjMgc2VydmljZSAoSmF2YSAyMSwgU3ByaW5nIERhdGEgSlBBIC8gSGliZXJuYXRlIDYsIFBvc3RncmVTUUw7CmBzcHJpbmcuanBhLm9wZW4taW4tdmlld2AgaXMgb2ZmKS4KCiMjIyBCdXNpbmVzcyBydWxlcwoKLSBBIFBPIGFib3ZlICoq4oK5MTAsMDAsMDAwKiogbmVlZHMgYXBwcm92YWxzIGZyb20gKip0d28gZGlmZmVyZW50IHBlb3BsZSoqOyBzbWFsbGVyIFBPcyBuZWVkIG9uZS4KLSBXaGVuIGEgUE8gYmVjb21lcyAqQXBwcm92ZWQqLCBpdHMgYnVkZ2V0IGlzIHJlc2VydmVkIChgQnVkZ2V0U2VydmljZWAsIHNhbWUgZGF0YWJhc2UpLiBJZiB0aGUKICBjb3N0IGNlbnRyZSBpcyBvdXQgb2YgYnVkZ2V0IHRoZSBhcHByb3ZhbCAqKm11c3Qgbm90IGhhcHBlbioqIChIVFRQIDQyMikuCi0gYFBPU1QgL2FwcHJvdmVgIGNhcnJpZXMgYW4gYElkZW1wb3RlbmN5LUtleWAuIFRoZSBhcHAgcmV0cmllcyBvbiB0aW1lb3V0cywgc29tZXRpbWVzIHNldmVyYWwKICByZXRyaWVzIGF0IG9uY2UuIEtleXMgYXJlIGdlbmVyYXRlZCBvbiB0aGUgcGhvbmUgYW5kIGFyZSBvbmx5IHVuaXF1ZSAqKnBlciB1c2VyKiouCi0gSW4gYSBiYXRjaCwgZWFjaCBQTyBzdWNjZWVkcyBvciBmYWlscyBvbiBpdHMgb3duLgotIFRoZSBpbmJveCBpcyBuZXdlc3QgZmlyc3QsIGFuZCBpdHMgcGFnZXMgYXJlIG51bWJlcmVkICoqZnJvbSAxKiouCgojIyMgQnVnIHJlcG9ydHMKCjEuICoqIkkgcmVqZWN0ZWQgaXQgYW5kIGl0IGNhbWUgYmFjay4iKiogUmVqZWN0IGFuc3dlcnMgMjAwIHdpdGggc3RhdHVzICpSZWplY3RlZCosIGJ1dCBhZnRlciBhCiAgIHJlZnJlc2ggdGhlIFBPIGlzICpQZW5kaW5nKiBhZ2Fpbi4gTm90aGluZyBpbiB0aGUgbG9ncy4KMi4gKioiRmluYW5jZSBmb3VuZCBhcHByb3ZlZCBQT3Mgd2l0aCBubyBidWRnZXQuIioqIEFwcHJvdmluZyBhIFBPIHdob3NlIGNvc3QgY2VudHJlIGlzIG91dCBvZgogICBidWRnZXQgcmV0dXJucyA0MjIsIHlldCB0aGUgUE8gZW5kcyB1cCAqQXBwcm92ZWQqLiBCYXRjaCBhcHByb3ZhbCBsaXN0cyBzdWNoIFBPcyB1bmRlcgogICAqZmFpbHVyZXMqLCBidXQgdGhleSBhcmUgYXBwcm92ZWQgdG9vLiBBbmQgb25lIFBPIHRoYXQgY2FuJ3QgYmUgYXBwcm92ZWQgKGUuZy4gYWxyZWFkeQogICBhcHByb3ZlZCkgbWFrZXMgdGhlIHdob2xlIGJhdGNoIGZhaWwuCjMuICoqIuKCuTQwIGxha2ggUE9zIGFwcHJvdmVkIGJ5IGEgc2luZ2xlIHBlcnNvbi4iKiogVGhlIGF1ZGl0IGZvdW5kIHNldmVyYWwgd2F5cyBpdCBoYXBwZW5zOgogICAtIGEgdGltZWQtb3V0IHJlcXVlc3QgdGhhdCB0aGUgYXBwIHJldHJpZWQgd2FzIGNvdW50ZWQgdHdpY2U7CiAgIC0gb25lIGFwcHJvdmVyIGFwcHJvdmVkIHRoZSBzYW1lIFBPIHR3aWNlOwogICAtIHdoZW4gdHdvIGFwcHJvdmVycyB0YXBwZWQgKkFwcHJvdmUqIGF0IHRoZSBzYW1lIG1vbWVudCwgYm90aCBzdWNjZWVkZWQgYW5kIHRoZSBidWRnZXQgd2FzCiAgICAgcmVzZXJ2ZWQgdHdpY2U7CiAgIC0gYW4gYXBwcm92ZXIgZ290ICphbm90aGVyIGFwcHJvdmVyJ3MqIFBPIGJhY2sgZnJvbSBgL2FwcHJvdmVgLCBhbmQgcmV1c2luZyBhIGtleSBvbiBhCiAgICAgZGlmZmVyZW50IFBPIHNpbGVudGx5IHJldHVybmVkIHRoZSBmaXJzdCBQTy4KNC4gKioiSW52b2ljZXMgdGhhdCBtYXRjaCBhcmUgZmxhZ2dlZCwgYW5kIGFuIG92ZXItaW52b2ljZSBwYXNzZWQuIioqIEFuIGludm9pY2UgZm9yCiAgIOKCuTEsNTAwLjAgaXMgZmxhZ2dlZCBhZ2FpbnN0IGEgUE8gdG90YWwgb2Yg4oK5MSw1MDAuMDAuIEFuIGludm9pY2UgdGhhdCBiaWxscyA1ICsgNSB1bml0cyBvZiBhIFNLVQogICBvbiB0d28gbGluZXMgcGFzc2VkIGFnYWluc3QgOCBvcmRlcmVkLiBTaW5jZSBvcGVuLWluLXZpZXcgd2FzIHN3aXRjaGVkIG9mZiwgKm1hdGNoLWludm9pY2UqCiAgIHJldHVybnMgNTAwIGZvciBldmVyeSBQTy4KNS4gKioiVGhlIGluYm94IHNraXBzIHRoZSBuZXdlc3QgUE9zLiIqKiBQYWdlIDEgc2hvd3Mgd2hhdCBzaG91bGQgYmUgcGFnZSAyLCBhbmQgUE9zIHJlcGVhdCBvciBnbwogICBtaXNzaW5nIGJldHdlZW4gcGFnZXMuIFdpdGggNDBrIFBPcyB0aGUgZW5kcG9pbnQgZ290IHNsb3cgYW5kIG1lbW9yeSBzcGlrZWQ7IHRoZSBsb2cgc2hvd3MKICAgYEhISDkwMDAzMDA0OiBmaXJzdFJlc3VsdC9tYXhSZXN1bHRzIHNwZWNpZmllZCB3aXRoIGNvbGxlY3Rpb24gZmV0Y2g7IGFwcGx5aW5nIGluIG1lbW9yeWAuCgojIyMgV2hhdCB0byBkbwoKLSAqKk5vdGhpbmcgdG8gaW5zdGFsbC4qKiBKYXZhIGNhbid0IHJ1biBpbiB0aGUgYnJvd3Nlciwgc28gKipSdW4gdGVzdHMqKiBydW5zIGNoZWNrcyB0aGF0IHJlYWQKICB5b3VyIGNvZGUncyBzdHJ1Y3R1cmUgKGFubm90YXRpb25zLCB0cmFuc2FjdGlvbnMsIHF1ZXJpZXMsIG1ldGhvZCBib2RpZXM7IGNvbW1lbnRzIGFyZSBpZ25vcmVkKS4KICBUaGUgZWRpdG9yIGFsc28gY2hlY2tzIHRoZSBKYXZhIHN5bnRheC4gUmVhc29uIGFib3V0IGhvdyBTcHJpbmcncyBwcm94aWVzLCB0cmFuc2FjdGlvbnMgYW5kCiAgSGliZXJuYXRlIGJlaGF2ZS4KLSBgY2hlY2tzL2AgYW5kIGBzcmMvdGVzdC9qYXZhYCBhcmUgKipyZWFkLW9ubHkqKiBhbmQgZGVzY3JpYmUgdGhlIGV4cGVjdGVkIGJlaGF2aW91ci4gUmV2aWV3ZXJzCiAgYWxzbyBydW4gdGhlIEpVbml0IHRlc3RzIChgbXZuIHZlcmlmeWAsIFBvc3RncmVTUUwgdmlhIFRlc3Rjb250YWluZXJzKSBhZ2FpbnN0IHlvdXIgY29kZS4KLSBGaXggdGhlICoqcm9vdCBjYXVzZXMqKiBhbmQga2VlcCB0aGUgQVBJIGNvbnRyYWN0LiBZb3UgY2FuJ3QgYWRkIGZpbGVzIG9yIGRlcGVuZGVuY2llczsgbmVzdGVkCiAgY2xhc3NlcyBhcmUgZmluZS4KLSBXaGVyZSBhIGZpeCBuZWVkcyBhIHNjaGVtYSBjaGFuZ2UsIGFkZCBhIG9uZS1saW5lIGNvbW1lbnQgc2F5aW5nIHNvIChyZXZpZXdlcnMgd3JpdGUgdGhlCiAgbWlncmF0aW9uKS4KCipUaW1lIGd1aWRlOiBhYm91dCA0NSBtaW51dGVzLioK', 'base64'), 'UTF8'),
    false, 'published', 3
  ) on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, category = excluded.category,
    role_tags = excluded.role_tags, skill_tags = excluded.skill_tags, difficulty = excluded.difficulty,
    time_suggestion_minutes = excluded.time_suggestion_minutes, statement_md = excluded.statement_md,
    is_sample = excluded.is_sample, status = excluded.status, version = excluded.version;
  delete from public.question_files where question_id = '04a206ea-655a-40fd-9651-b01088d59d98' and path <> all (array['src/main/java/com/zycus/procurement/po/ApprovalService.java', 'src/main/java/com/zycus/procurement/po/PurchaseOrderController.java', 'src/main/java/com/zycus/procurement/po/InvoiceMatcher.java', 'src/main/java/com/zycus/procurement/po/PurchaseOrderRepository.java', 'src/main/java/com/zycus/procurement/po/IdempotencyRecordRepository.java', 'src/main/java/com/zycus/procurement/po/PurchaseOrder.java', 'src/main/java/com/zycus/procurement/po/IdempotencyRecord.java', 'src/main/java/com/zycus/procurement/po/ApiExceptionHandler.java', 'src/main/java/com/zycus/procurement/po/PurchaseOrderLine.java', 'src/main/java/com/zycus/procurement/po/PoStatus.java', 'src/main/java/com/zycus/procurement/po/Dtos.java', 'src/main/java/com/zycus/procurement/po/BudgetService.java', 'src/main/java/com/zycus/procurement/po/BudgetExceededException.java', 'src/main/java/com/zycus/procurement/po/PoNotFoundException.java', 'src/main/resources/application.yml', 'src/test/java/com/zycus/procurement/po/ApprovalServiceIT.java', 'src/test/java/com/zycus/procurement/po/InvoiceMatcherTest.java', 'checks/transactions.test.ts', 'checks/approvals.test.ts', 'checks/invoices.test.ts', 'checks/inbox.test.ts', 'checks/support/java.ts', 'pom.xml']::text[]);
  insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/ApprovalService.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuQmF0Y2hSZXN1bHQ7CmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5QdXJjaGFzZU9yZGVyRHRvOwppbXBvcnQgamF2YS51dGlsLkxpc3Q7CmltcG9ydCBqYXZhLnV0aWwuT3B0aW9uYWw7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlBhZ2U7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlBhZ2VhYmxlOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5zdGVyZW90eXBlLlNlcnZpY2U7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLnRyYW5zYWN0aW9uLmFubm90YXRpb24uUHJvcGFnYXRpb247CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLnRyYW5zYWN0aW9uLmFubm90YXRpb24uVHJhbnNhY3Rpb25hbDsKCkBTZXJ2aWNlCkBUcmFuc2FjdGlvbmFsKHJlYWRPbmx5ID0gdHJ1ZSkKcHVibGljIGNsYXNzIEFwcHJvdmFsU2VydmljZSB7CgogICAgcHJpdmF0ZSBmaW5hbCBQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBvcmRlcnM7CiAgICBwcml2YXRlIGZpbmFsIElkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSBpZGVtcG90ZW5jeTsKICAgIHByaXZhdGUgZmluYWwgQnVkZ2V0U2VydmljZSBidWRnZXQ7CgogICAgcHVibGljIEFwcHJvdmFsU2VydmljZShQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBvcmRlcnMsIElkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSBpZGVtcG90ZW5jeSwKICAgICAgICAgICAgICAgICAgICAgICAgICAgQnVkZ2V0U2VydmljZSBidWRnZXQpIHsKICAgICAgICB0aGlzLm9yZGVycyA9IG9yZGVyczsKICAgICAgICB0aGlzLmlkZW1wb3RlbmN5ID0gaWRlbXBvdGVuY3k7CiAgICAgICAgdGhpcy5idWRnZXQgPSBidWRnZXQ7CiAgICB9CgogICAgcHVibGljIFBhZ2U8UHVyY2hhc2VPcmRlckR0bz4gbGlzdChQYWdlYWJsZSBwYWdlYWJsZSkgewogICAgICAgIHJldHVybiBvcmRlcnMuZmluZFBhZ2VXaXRoTGluZXMocGFnZWFibGUpLm1hcChQdXJjaGFzZU9yZGVyRHRvOjpmcm9tKTsKICAgIH0KCiAgICAvKioKICAgICAqIEFwcHJvdmVzIGEgUE8uIFRoZSBtb2JpbGUgYXBwIHNlbmRzIGFuIElkZW1wb3RlbmN5LUtleSBhbmQgcmV0cmllcyBvbiB0aW1lb3V0cywgc28gdGhlIHNhbWUKICAgICAqIHJlcXVlc3QgbWF5IGFycml2ZSBtb3JlIHRoYW4gb25jZSAoYW5kIHNvbWV0aW1lcyBhdCB0aGUgc2FtZSB0aW1lKS4KICAgICAqLwogICAgQFRyYW5zYWN0aW9uYWwKICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyRHRvIGFwcHJvdmUobG9uZyBwb0lkLCBTdHJpbmcgYXBwcm92ZXJJZCwgU3RyaW5nIGlkZW1wb3RlbmN5S2V5KQogICAgICAgICAgICB0aHJvd3MgQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24gewogICAgICAgIE9wdGlvbmFsPElkZW1wb3RlbmN5UmVjb3JkPiBwcmV2aW91cyA9IGlkZW1wb3RlbmN5LmZpbmRCeUtleShpZGVtcG90ZW5jeUtleSk7CiAgICAgICAgaWYgKHByZXZpb3VzLmlzUHJlc2VudCgpKSB7CiAgICAgICAgICAgIHJldHVybiBQdXJjaGFzZU9yZGVyRHRvLmZyb20oZmluZChwcmV2aW91cy5nZXQoKS5nZXRQdXJjaGFzZU9yZGVySWQoKSkpOwogICAgICAgIH0KICAgICAgICBQdXJjaGFzZU9yZGVyIHBvID0gZmluZChwb0lkKTsKICAgICAgICBwby5yZWNvcmRBcHByb3ZhbCgpOwogICAgICAgIGlmIChwby5nZXRTdGF0dXMoKSA9PSBQb1N0YXR1cy5BUFBST1ZFRCkgewogICAgICAgICAgICBidWRnZXQucmVzZXJ2ZShwby5nZXRJZCgpLCBwby5nZXRUb3RhbCgpKTsKICAgICAgICB9CiAgICAgICAgaWRlbXBvdGVuY3kuc2F2ZShuZXcgSWRlbXBvdGVuY3lSZWNvcmQoaWRlbXBvdGVuY3lLZXksIGFwcHJvdmVySWQsIHBvSWQsIHBvLmdldFN0YXR1cygpLm5hbWUoKSkpOwogICAgICAgIHJldHVybiBQdXJjaGFzZU9yZGVyRHRvLmZyb20ocG8pOwogICAgfQoKICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyRHRvIHJlamVjdChsb25nIHBvSWQsIFN0cmluZyBhcHByb3ZlcklkLCBTdHJpbmcgcmVhc29uKSB7CiAgICAgICAgUHVyY2hhc2VPcmRlciBwbyA9IGZpbmQocG9JZCk7CiAgICAgICAgcG8ucmVqZWN0KHJlYXNvbik7CiAgICAgICAgcmV0dXJuIFB1cmNoYXNlT3JkZXJEdG8uZnJvbShwbyk7CiAgICB9CgogICAgLyoqIEFwcHJvdmVzIHNldmVyYWwgUE9zOyBvbmUgUE8gZmFpbGluZyAoZS5nLiBvdXQgb2YgYnVkZ2V0KSBtdXN0IG5vdCBhZmZlY3QgdGhlIG90aGVycy4gKi8KICAgIEBUcmFuc2FjdGlvbmFsCiAgICBwdWJsaWMgQmF0Y2hSZXN1bHQgYXBwcm92ZUJhdGNoKExpc3Q8TG9uZz4gaWRzLCBTdHJpbmcgYXBwcm92ZXJJZCkgewogICAgICAgIEJhdGNoUmVzdWx0IHJlc3VsdCA9IG5ldyBCYXRjaFJlc3VsdCgpOwogICAgICAgIGZvciAoTG9uZyBpZCA6IGlkcykgewogICAgICAgICAgICB0cnkgewogICAgICAgICAgICAgICAgYXBwcm92ZU9uZShpZCk7CiAgICAgICAgICAgICAgICByZXN1bHQuYXBwcm92ZWQoaWQpOwogICAgICAgICAgICB9IGNhdGNoIChCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbiBlKSB7CiAgICAgICAgICAgICAgICByZXN1bHQuZmFpbGVkKGlkLCBlLmdldE1lc3NhZ2UoKSk7CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAgcmV0dXJuIHJlc3VsdDsKICAgIH0KCiAgICBAVHJhbnNhY3Rpb25hbChwcm9wYWdhdGlvbiA9IFByb3BhZ2F0aW9uLlJFUVVJUkVTX05FVykKICAgIHB1YmxpYyB2b2lkIGFwcHJvdmVPbmUobG9uZyBpZCkgdGhyb3dzIEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uIHsKICAgICAgICBQdXJjaGFzZU9yZGVyIHBvID0gZmluZChpZCk7CiAgICAgICAgcG8ucmVjb3JkQXBwcm92YWwoKTsKICAgICAgICBpZiAocG8uZ2V0U3RhdHVzKCkgPT0gUG9TdGF0dXMuQVBQUk9WRUQpIHsKICAgICAgICAgICAgYnVkZ2V0LnJlc2VydmUoaWQsIHBvLmdldFRvdGFsKCkpOwogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRlIFB1cmNoYXNlT3JkZXIgZmluZChsb25nIGlkKSB7CiAgICAgICAgcmV0dXJuIG9yZGVycy5maW5kQnlJZChpZCkub3JFbHNlVGhyb3coKCkgLT4gbmV3IFBvTm90Rm91bmRFeGNlcHRpb24oaWQpKTsKICAgIH0KfQo=', 'base64'), 'UTF8'), false, 0),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PurchaseOrderController.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuQmF0Y2hSZXF1ZXN0OwppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuQmF0Y2hSZXN1bHQ7CmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5JbnZvaWNlUmVxdWVzdDsKaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLk1hdGNoUmVzdWx0OwppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuUHVyY2hhc2VPcmRlckR0bzsKaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLlJlamVjdFJlcXVlc3Q7CmltcG9ydCBqYXZhLnNlY3VyaXR5LlByaW5jaXBhbDsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5kb21haW4uUGFnZTsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5kb21haW4uUGFnZVJlcXVlc3Q7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uR2V0TWFwcGluZzsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5QYXRoVmFyaWFibGU7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUG9zdE1hcHBpbmc7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUmVxdWVzdEJvZHk7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUmVxdWVzdEhlYWRlcjsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5SZXF1ZXN0TWFwcGluZzsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5SZXF1ZXN0UGFyYW07CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUmVzdENvbnRyb2xsZXI7CgpAUmVzdENvbnRyb2xsZXIKQFJlcXVlc3RNYXBwaW5nKCIvYXBpL3BvcyIpCnB1YmxpYyBjbGFzcyBQdXJjaGFzZU9yZGVyQ29udHJvbGxlciB7CgogICAgcHJpdmF0ZSBmaW5hbCBBcHByb3ZhbFNlcnZpY2UgYXBwcm92YWxzOwogICAgcHJpdmF0ZSBmaW5hbCBQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBvcmRlcnM7CiAgICBwcml2YXRlIGZpbmFsIEludm9pY2VNYXRjaGVyIG1hdGNoZXI7CgogICAgcHVibGljIFB1cmNoYXNlT3JkZXJDb250cm9sbGVyKEFwcHJvdmFsU2VydmljZSBhcHByb3ZhbHMsIFB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IG9yZGVycywgSW52b2ljZU1hdGNoZXIgbWF0Y2hlcikgewogICAgICAgIHRoaXMuYXBwcm92YWxzID0gYXBwcm92YWxzOwogICAgICAgIHRoaXMub3JkZXJzID0gb3JkZXJzOwogICAgICAgIHRoaXMubWF0Y2hlciA9IG1hdGNoZXI7CiAgICB9CgogICAgLyoqIFRoZSBpbmJveCwgbmV3ZXN0IGZpcnN0LiBQYWdlcyBhcmUgbnVtYmVyZWQgZnJvbSAxICh0aGUgbW9iaWxlIGFwcCdzIGNvbnRyYWN0KS4gKi8KICAgIEBHZXRNYXBwaW5nCiAgICBwdWJsaWMgUGFnZTxQdXJjaGFzZU9yZGVyRHRvPiBsaXN0KEBSZXF1ZXN0UGFyYW0oZGVmYXVsdFZhbHVlID0gIjEiKSBpbnQgcGFnZSwKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQFJlcXVlc3RQYXJhbShkZWZhdWx0VmFsdWUgPSAiMjAiKSBpbnQgc2l6ZSkgewogICAgICAgIHJldHVybiBhcHByb3ZhbHMubGlzdChQYWdlUmVxdWVzdC5vZihwYWdlLCBzaXplKSk7CiAgICB9CgogICAgQFBvc3RNYXBwaW5nKCIve2lkfS9hcHByb3ZlIikKICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyRHRvIGFwcHJvdmUoQFBhdGhWYXJpYWJsZSBsb25nIGlkLCBAUmVxdWVzdEhlYWRlcigiSWRlbXBvdGVuY3ktS2V5IikgU3RyaW5nIGtleSwKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsIHVzZXIpIHRocm93cyBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbiB7CiAgICAgICAgcmV0dXJuIGFwcHJvdmFscy5hcHByb3ZlKGlkLCB1c2VyLmdldE5hbWUoKSwga2V5KTsKICAgIH0KCiAgICBAUG9zdE1hcHBpbmcoIi97aWR9L3JlamVjdCIpCiAgICBwdWJsaWMgUHVyY2hhc2VPcmRlckR0byByZWplY3QoQFBhdGhWYXJpYWJsZSBsb25nIGlkLCBAUmVxdWVzdEJvZHkgUmVqZWN0UmVxdWVzdCBib2R5LCBQcmluY2lwYWwgdXNlcikgewogICAgICAgIHJldHVybiBhcHByb3ZhbHMucmVqZWN0KGlkLCB1c2VyLmdldE5hbWUoKSwgYm9keS5yZWFzb24oKSk7CiAgICB9CgogICAgQFBvc3RNYXBwaW5nKCIvYXBwcm92ZS1iYXRjaCIpCiAgICBwdWJsaWMgQmF0Y2hSZXN1bHQgYXBwcm92ZUJhdGNoKEBSZXF1ZXN0Qm9keSBCYXRjaFJlcXVlc3QgYm9keSwgUHJpbmNpcGFsIHVzZXIpIHsKICAgICAgICByZXR1cm4gYXBwcm92YWxzLmFwcHJvdmVCYXRjaChib2R5LmlkcygpLCB1c2VyLmdldE5hbWUoKSk7CiAgICB9CgogICAgQFBvc3RNYXBwaW5nKCIve2lkfS9tYXRjaC1pbnZvaWNlIikKICAgIHB1YmxpYyBNYXRjaFJlc3VsdCBtYXRjaEludm9pY2UoQFBhdGhWYXJpYWJsZSBsb25nIGlkLCBAUmVxdWVzdEJvZHkgSW52b2ljZVJlcXVlc3QgaW52b2ljZSkgewogICAgICAgIFB1cmNoYXNlT3JkZXIgcG8gPSBvcmRlcnMuZmluZEJ5SWQoaWQpLm9yRWxzZVRocm93KCgpIC0+IG5ldyBQb05vdEZvdW5kRXhjZXB0aW9uKGlkKSk7CiAgICAgICAgcmV0dXJuIG1hdGNoZXIubWF0Y2gocG8sIGludm9pY2UpOwogICAgfQp9Cg==', 'base64'), 'UTF8'), false, 1),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/InvoiceMatcher.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuSW52b2ljZUxpbmU7CmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5JbnZvaWNlUmVxdWVzdDsKaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLk1hdGNoUmVzdWx0OwppbXBvcnQgamF2YS51dGlsLkFycmF5TGlzdDsKaW1wb3J0IGphdmEudXRpbC5MaXN0OwppbXBvcnQgamF2YS51dGlsLk1hcDsKaW1wb3J0IGphdmEudXRpbC5mdW5jdGlvbi5GdW5jdGlvbjsKaW1wb3J0IGphdmEudXRpbC5zdHJlYW0uQ29sbGVjdG9yczsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuc3RlcmVvdHlwZS5Db21wb25lbnQ7CgovKiogVHdvLXdheSBtYXRjaDogdGhlIGludm9pY2UgbXVzdCBhZ3JlZSB3aXRoIHRoZSBQTyBvbiB0b3RhbCBhbmQgb24gZXZlcnkgbGluZS4gKi8KQENvbXBvbmVudApwdWJsaWMgY2xhc3MgSW52b2ljZU1hdGNoZXIgewoKICAgIHB1YmxpYyBNYXRjaFJlc3VsdCBtYXRjaChQdXJjaGFzZU9yZGVyIHBvLCBJbnZvaWNlUmVxdWVzdCBpbnZvaWNlKSB7CiAgICAgICAgTGlzdDxTdHJpbmc+IHByb2JsZW1zID0gbmV3IEFycmF5TGlzdDw+KCk7CiAgICAgICAgaWYgKCFwby5nZXRUb3RhbCgpLmVxdWFscyhpbnZvaWNlLmFtb3VudCgpKSkgewogICAgICAgICAgICBwcm9ibGVtcy5hZGQoIkludm9pY2UgYW1vdW50ICIgKyBpbnZvaWNlLmFtb3VudCgpICsgIiBkaWZmZXJzIGZyb20gUE8gdG90YWwgIiArIHBvLmdldFRvdGFsKCkpOwogICAgICAgIH0KICAgICAgICBNYXA8U3RyaW5nLCBQdXJjaGFzZU9yZGVyTGluZT4gYnlTa3UgPSBwby5nZXRMaW5lcygpLnN0cmVhbSgpCiAgICAgICAgICAgICAgICAuY29sbGVjdChDb2xsZWN0b3JzLnRvTWFwKFB1cmNoYXNlT3JkZXJMaW5lOjpnZXRTa3UsIEZ1bmN0aW9uLmlkZW50aXR5KCkpKTsKICAgICAgICBmb3IgKEludm9pY2VMaW5lIGxpbmUgOiBpbnZvaWNlLmxpbmVzKCkpIHsKICAgICAgICAgICAgUHVyY2hhc2VPcmRlckxpbmUgcG9MaW5lID0gYnlTa3UuZ2V0KGxpbmUuc2t1KCkpOwogICAgICAgICAgICBpZiAocG9MaW5lID09IG51bGwpIHsKICAgICAgICAgICAgICAgIHByb2JsZW1zLmFkZCgiU0tVICIgKyBsaW5lLnNrdSgpICsgIiBpcyBub3Qgb24gdGhlIFBPIik7CiAgICAgICAgICAgIH0gZWxzZSBpZiAobGluZS5xdWFudGl0eSgpID4gcG9MaW5lLmdldFF1YW50aXR5KCkpIHsKICAgICAgICAgICAgICAgIHByb2JsZW1zLmFkZCgiU0tVICIgKyBsaW5lLnNrdSgpICsgIjogaW52b2ljZWQgIiArIGxpbmUucXVhbnRpdHkoKSArICIsIG9yZGVyZWQgIiArIHBvTGluZS5nZXRRdWFudGl0eSgpKTsKICAgICAgICAgICAgfSBlbHNlIGlmICghcG9MaW5lLmdldFVuaXRQcmljZSgpLmVxdWFscyhsaW5lLnVuaXRQcmljZSgpKSkgewogICAgICAgICAgICAgICAgcHJvYmxlbXMuYWRkKCJTS1UgIiArIGxpbmUuc2t1KCkgKyAiOiB1bml0IHByaWNlIGRpZmZlcnMiKTsKICAgICAgICAgICAgfQogICAgICAgIH0KICAgICAgICByZXR1cm4gTWF0Y2hSZXN1bHQub2YocHJvYmxlbXMpOwogICAgfQp9Cg==', 'base64'), 'UTF8'), false, 2),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PurchaseOrderRepository.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmRvbWFpbi5QYWdlOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmRvbWFpbi5QYWdlYWJsZTsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5qcGEucmVwb3NpdG9yeS5KcGFSZXBvc2l0b3J5OwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmpwYS5yZXBvc2l0b3J5LlF1ZXJ5OwoKcHVibGljIGludGVyZmFjZSBQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBleHRlbmRzIEpwYVJlcG9zaXRvcnk8UHVyY2hhc2VPcmRlciwgTG9uZz4gewoKICAgIC8qKiBUaGUgYXBwcm92YWxzIGluYm94OiBvbmUgcGFnZSBvZiBQT3Mgd2l0aCB0aGVpciBsaW5lcyAodGhlIGFwcCBzaG93cyBsaW5lIGNvdW50cykuICovCiAgICBAUXVlcnkodmFsdWUgPSAic2VsZWN0IGRpc3RpbmN0IHAgZnJvbSBQdXJjaGFzZU9yZGVyIHAgbGVmdCBqb2luIGZldGNoIHAubGluZXMiLAogICAgICAgICAgIGNvdW50UXVlcnkgPSAic2VsZWN0IGNvdW50KHApIGZyb20gUHVyY2hhc2VPcmRlciBwIikKICAgIFBhZ2U8UHVyY2hhc2VPcmRlcj4gZmluZFBhZ2VXaXRoTGluZXMoUGFnZWFibGUgcGFnZWFibGUpOwp9Cg==', 'base64'), 'UTF8'), false, 3),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/IdempotencyRecordRepository.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamF2YS51dGlsLk9wdGlvbmFsOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmpwYS5yZXBvc2l0b3J5LkpwYVJlcG9zaXRvcnk7CgpwdWJsaWMgaW50ZXJmYWNlIElkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSBleHRlbmRzIEpwYVJlcG9zaXRvcnk8SWRlbXBvdGVuY3lSZWNvcmQsIExvbmc+IHsKCiAgICBPcHRpb25hbDxJZGVtcG90ZW5jeVJlY29yZD4gZmluZEJ5S2V5KFN0cmluZyBrZXkpOwp9Cg==', 'base64'), 'UTF8'), false, 4),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PurchaseOrder.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5DYXNjYWRlVHlwZTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuQ29sdW1uOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5FbnRpdHk7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkVudW1UeXBlOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5FbnVtZXJhdGVkOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5GZXRjaFR5cGU7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkdlbmVyYXRlZFZhbHVlOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5HZW5lcmF0aW9uVHlwZTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuSWQ7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLk9uZVRvTWFueTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuVGFibGU7CmltcG9ydCBqYXZhLm1hdGguQmlnRGVjaW1hbDsKaW1wb3J0IGphdmEudGltZS5JbnN0YW50OwppbXBvcnQgamF2YS51dGlsLkFycmF5TGlzdDsKaW1wb3J0IGphdmEudXRpbC5MaXN0OwoKQEVudGl0eQpAVGFibGUobmFtZSA9ICJwdXJjaGFzZV9vcmRlcnMiKQpwdWJsaWMgY2xhc3MgUHVyY2hhc2VPcmRlciB7CgogICAgQElkCiAgICBAR2VuZXJhdGVkVmFsdWUoc3RyYXRlZ3kgPSBHZW5lcmF0aW9uVHlwZS5JREVOVElUWSkKICAgIHByaXZhdGUgTG9uZyBpZDsKCiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UsIHVuaXF1ZSA9IHRydWUpCiAgICBwcml2YXRlIFN0cmluZyBudW1iZXI7CgogICAgQEVudW1lcmF0ZWQoRW51bVR5cGUuU1RSSU5HKQogICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBQb1N0YXR1cyBzdGF0dXMgPSBQb1N0YXR1cy5QRU5ESU5HOwoKICAgIC8qKiBUb3RhbCBpbiBJTlIsIHNjYWxlIDIuICovCiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UsIHByZWNpc2lvbiA9IDE0LCBzY2FsZSA9IDIpCiAgICBwcml2YXRlIEJpZ0RlY2ltYWwgdG90YWw7CgogICAgLyoqIFBPcyBhYm92ZSDigrkxMCwwMCwwMDAgbmVlZCB0d28gZGlzdGluY3QgYXBwcm92ZXJzLiAqLwogICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBpbnQgYXBwcm92YWxzUmVxdWlyZWQ7CgogICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBpbnQgYXBwcm92YWxzUmVjZWl2ZWQ7CgogICAgcHJpdmF0ZSBTdHJpbmcgcmVqZWN0aW9uUmVhc29uOwoKICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSkKICAgIHByaXZhdGUgSW5zdGFudCBjcmVhdGVkQXQgPSBJbnN0YW50Lm5vdygpOwoKICAgIEBPbmVUb01hbnkobWFwcGVkQnkgPSAicHVyY2hhc2VPcmRlciIsIGNhc2NhZGUgPSBDYXNjYWRlVHlwZS5BTEwsIG9ycGhhblJlbW92YWwgPSB0cnVlLCBmZXRjaCA9IEZldGNoVHlwZS5MQVpZKQogICAgcHJpdmF0ZSBMaXN0PFB1cmNoYXNlT3JkZXJMaW5lPiBsaW5lcyA9IG5ldyBBcnJheUxpc3Q8PigpOwoKICAgIHByb3RlY3RlZCBQdXJjaGFzZU9yZGVyKCkgewogICAgfQoKICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyKFN0cmluZyBudW1iZXIsIEJpZ0RlY2ltYWwgdG90YWwpIHsKICAgICAgICB0aGlzLm51bWJlciA9IG51bWJlcjsKICAgICAgICB0aGlzLnRvdGFsID0gdG90YWw7CiAgICAgICAgdGhpcy5hcHByb3ZhbHNSZXF1aXJlZCA9IHRvdGFsLmNvbXBhcmVUbyhuZXcgQmlnRGVjaW1hbCgiMTAwMDAwMC4wMCIpKSA+IDAgPyAyIDogMTsKICAgIH0KCiAgICBwdWJsaWMgdm9pZCByZWNvcmRBcHByb3ZhbCgpIHsKICAgICAgICBpZiAoc3RhdHVzICE9IFBvU3RhdHVzLlBFTkRJTkcpIHsKICAgICAgICAgICAgdGhyb3cgbmV3IElsbGVnYWxTdGF0ZUV4Y2VwdGlvbigiUE8gIiArIG51bWJlciArICIgaXMgIiArIHN0YXR1cyk7CiAgICAgICAgfQogICAgICAgIGFwcHJvdmFsc1JlY2VpdmVkKys7CiAgICAgICAgaWYgKGFwcHJvdmFsc1JlY2VpdmVkID49IGFwcHJvdmFsc1JlcXVpcmVkKSB7CiAgICAgICAgICAgIHN0YXR1cyA9IFBvU3RhdHVzLkFQUFJPVkVEOwogICAgICAgIH0KICAgIH0KCiAgICBwdWJsaWMgdm9pZCByZWplY3QoU3RyaW5nIHJlYXNvbikgewogICAgICAgIGlmIChzdGF0dXMgIT0gUG9TdGF0dXMuUEVORElORykgewogICAgICAgICAgICB0aHJvdyBuZXcgSWxsZWdhbFN0YXRlRXhjZXB0aW9uKCJQTyAiICsgbnVtYmVyICsgIiBpcyAiICsgc3RhdHVzKTsKICAgICAgICB9CiAgICAgICAgc3RhdHVzID0gUG9TdGF0dXMuUkVKRUNURUQ7CiAgICAgICAgcmVqZWN0aW9uUmVhc29uID0gcmVhc29uOwogICAgfQoKICAgIHB1YmxpYyB2b2lkIGFkZExpbmUoUHVyY2hhc2VPcmRlckxpbmUgbGluZSkgewogICAgICAgIGxpbmVzLmFkZChsaW5lKTsKICAgICAgICBsaW5lLnNldFB1cmNoYXNlT3JkZXIodGhpcyk7CiAgICB9CgogICAgcHVibGljIExvbmcgZ2V0SWQoKSB7CiAgICAgICAgcmV0dXJuIGlkOwogICAgfQoKICAgIHB1YmxpYyBTdHJpbmcgZ2V0TnVtYmVyKCkgewogICAgICAgIHJldHVybiBudW1iZXI7CiAgICB9CgogICAgcHVibGljIFBvU3RhdHVzIGdldFN0YXR1cygpIHsKICAgICAgICByZXR1cm4gc3RhdHVzOwogICAgfQoKICAgIHB1YmxpYyBCaWdEZWNpbWFsIGdldFRvdGFsKCkgewogICAgICAgIHJldHVybiB0b3RhbDsKICAgIH0KCiAgICBwdWJsaWMgaW50IGdldEFwcHJvdmFsc1JlcXVpcmVkKCkgewogICAgICAgIHJldHVybiBhcHByb3ZhbHNSZXF1aXJlZDsKICAgIH0KCiAgICBwdWJsaWMgaW50IGdldEFwcHJvdmFsc1JlY2VpdmVkKCkgewogICAgICAgIHJldHVybiBhcHByb3ZhbHNSZWNlaXZlZDsKICAgIH0KCiAgICBwdWJsaWMgU3RyaW5nIGdldFJlamVjdGlvblJlYXNvbigpIHsKICAgICAgICByZXR1cm4gcmVqZWN0aW9uUmVhc29uOwogICAgfQoKICAgIHB1YmxpYyBJbnN0YW50IGdldENyZWF0ZWRBdCgpIHsKICAgICAgICByZXR1cm4gY3JlYXRlZEF0OwogICAgfQoKICAgIHB1YmxpYyBMaXN0PFB1cmNoYXNlT3JkZXJMaW5lPiBnZXRMaW5lcygpIHsKICAgICAgICByZXR1cm4gbGluZXM7CiAgICB9Cn0K', 'base64'), 'UTF8'), false, 5),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/IdempotencyRecord.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Db2x1bW47CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkVudGl0eTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuR2VuZXJhdGVkVmFsdWU7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkdlbmVyYXRpb25UeXBlOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5JZDsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuVGFibGU7CmltcG9ydCBqYXZhLnRpbWUuSW5zdGFudDsKCi8qKgogKiBSZW1lbWJlcnMgdGhlIHJlc3BvbnNlIHRvIGEgUE9TVCBjYXJyeWluZyBhbiBJZGVtcG90ZW5jeS1LZXkgaGVhZGVyLCBzbyBhIHJldHJ5ICh0aGUgbW9iaWxlIGFwcAogKiByZXRyaWVzIG9uIHRpbWVvdXRzKSByZXR1cm5zIHRoZSBzYW1lIHJlc3VsdCBpbnN0ZWFkIG9mIGFwcHJvdmluZyB0d2ljZS4KICovCkBFbnRpdHkKQFRhYmxlKG5hbWUgPSAiaWRlbXBvdGVuY3lfcmVjb3JkcyIpCnB1YmxpYyBjbGFzcyBJZGVtcG90ZW5jeVJlY29yZCB7CgogICAgQElkCiAgICBAR2VuZXJhdGVkVmFsdWUoc3RyYXRlZ3kgPSBHZW5lcmF0aW9uVHlwZS5JREVOVElUWSkKICAgIHByaXZhdGUgTG9uZyBpZDsKCiAgICBAQ29sdW1uKG5hbWUgPSAiaWRlbV9rZXkiLCBudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBTdHJpbmcga2V5OwoKICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSkKICAgIHByaXZhdGUgU3RyaW5nIGFwcHJvdmVySWQ7CgogICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBsb25nIHB1cmNoYXNlT3JkZXJJZDsKCiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UpCiAgICBwcml2YXRlIFN0cmluZyByZXNwb25zZVN0YXR1czsKCiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UpCiAgICBwcml2YXRlIEluc3RhbnQgY3JlYXRlZEF0ID0gSW5zdGFudC5ub3coKTsKCiAgICBwcm90ZWN0ZWQgSWRlbXBvdGVuY3lSZWNvcmQoKSB7CiAgICB9CgogICAgcHVibGljIElkZW1wb3RlbmN5UmVjb3JkKFN0cmluZyBrZXksIFN0cmluZyBhcHByb3ZlcklkLCBsb25nIHB1cmNoYXNlT3JkZXJJZCwgU3RyaW5nIHJlc3BvbnNlU3RhdHVzKSB7CiAgICAgICAgdGhpcy5rZXkgPSBrZXk7CiAgICAgICAgdGhpcy5hcHByb3ZlcklkID0gYXBwcm92ZXJJZDsKICAgICAgICB0aGlzLnB1cmNoYXNlT3JkZXJJZCA9IHB1cmNoYXNlT3JkZXJJZDsKICAgICAgICB0aGlzLnJlc3BvbnNlU3RhdHVzID0gcmVzcG9uc2VTdGF0dXM7CiAgICB9CgogICAgcHVibGljIFN0cmluZyBnZXRLZXkoKSB7CiAgICAgICAgcmV0dXJuIGtleTsKICAgIH0KCiAgICBwdWJsaWMgU3RyaW5nIGdldEFwcHJvdmVySWQoKSB7CiAgICAgICAgcmV0dXJuIGFwcHJvdmVySWQ7CiAgICB9CgogICAgcHVibGljIGxvbmcgZ2V0UHVyY2hhc2VPcmRlcklkKCkgewogICAgICAgIHJldHVybiBwdXJjaGFzZU9yZGVySWQ7CiAgICB9CgogICAgcHVibGljIFN0cmluZyBnZXRSZXNwb25zZVN0YXR1cygpIHsKICAgICAgICByZXR1cm4gcmVzcG9uc2VTdGF0dXM7CiAgICB9Cn0K', 'base64'), 'UTF8'), false, 6),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/ApiExceptionHandler.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5odHRwLkh0dHBTdGF0dXM7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmh0dHAuUHJvYmxlbURldGFpbDsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5FeGNlcHRpb25IYW5kbGVyOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLlJlc3RDb250cm9sbGVyQWR2aWNlOwoKQFJlc3RDb250cm9sbGVyQWR2aWNlCnB1YmxpYyBjbGFzcyBBcGlFeGNlcHRpb25IYW5kbGVyIHsKCiAgICBARXhjZXB0aW9uSGFuZGxlcihQb05vdEZvdW5kRXhjZXB0aW9uLmNsYXNzKQogICAgcHVibGljIFByb2JsZW1EZXRhaWwgbm90Rm91bmQoUG9Ob3RGb3VuZEV4Y2VwdGlvbiBlKSB7CiAgICAgICAgcmV0dXJuIFByb2JsZW1EZXRhaWwuZm9yU3RhdHVzQW5kRGV0YWlsKEh0dHBTdGF0dXMuTk9UX0ZPVU5ELCBlLmdldE1lc3NhZ2UoKSk7CiAgICB9CgogICAgQEV4Y2VwdGlvbkhhbmRsZXIoSWxsZWdhbFN0YXRlRXhjZXB0aW9uLmNsYXNzKQogICAgcHVibGljIFByb2JsZW1EZXRhaWwgY29uZmxpY3QoSWxsZWdhbFN0YXRlRXhjZXB0aW9uIGUpIHsKICAgICAgICByZXR1cm4gUHJvYmxlbURldGFpbC5mb3JTdGF0dXNBbmREZXRhaWwoSHR0cFN0YXR1cy5DT05GTElDVCwgZS5nZXRNZXNzYWdlKCkpOwogICAgfQoKICAgIEBFeGNlcHRpb25IYW5kbGVyKEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uLmNsYXNzKQogICAgcHVibGljIFByb2JsZW1EZXRhaWwgYnVkZ2V0KEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uIGUpIHsKICAgICAgICByZXR1cm4gUHJvYmxlbURldGFpbC5mb3JTdGF0dXNBbmREZXRhaWwoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSwgZS5nZXRNZXNzYWdlKCkpOwogICAgfQoKICAgIEBFeGNlcHRpb25IYW5kbGVyKElsbGVnYWxBcmd1bWVudEV4Y2VwdGlvbi5jbGFzcykKICAgIHB1YmxpYyBQcm9ibGVtRGV0YWlsIGJhZFJlcXVlc3QoSWxsZWdhbEFyZ3VtZW50RXhjZXB0aW9uIGUpIHsKICAgICAgICByZXR1cm4gUHJvYmxlbURldGFpbC5mb3JTdGF0dXNBbmREZXRhaWwoSHR0cFN0YXR1cy5CQURfUkVRVUVTVCwgZS5nZXRNZXNzYWdlKCkpOwogICAgfQp9Cg==', 'base64'), 'UTF8'), false, 7),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PurchaseOrderLine.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Db2x1bW47CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkVudGl0eTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuRmV0Y2hUeXBlOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5HZW5lcmF0ZWRWYWx1ZTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuR2VuZXJhdGlvblR5cGU7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLklkOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Kb2luQ29sdW1uOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5NYW55VG9PbmU7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLlRhYmxlOwppbXBvcnQgamF2YS5tYXRoLkJpZ0RlY2ltYWw7CgpARW50aXR5CkBUYWJsZShuYW1lID0gInB1cmNoYXNlX29yZGVyX2xpbmVzIikKcHVibGljIGNsYXNzIFB1cmNoYXNlT3JkZXJMaW5lIHsKCiAgICBASWQKICAgIEBHZW5lcmF0ZWRWYWx1ZShzdHJhdGVneSA9IEdlbmVyYXRpb25UeXBlLklERU5USVRZKQogICAgcHJpdmF0ZSBMb25nIGlkOwoKICAgIEBNYW55VG9PbmUoZmV0Y2ggPSBGZXRjaFR5cGUuTEFaWSwgb3B0aW9uYWwgPSBmYWxzZSkKICAgIEBKb2luQ29sdW1uKG5hbWUgPSAicHVyY2hhc2Vfb3JkZXJfaWQiKQogICAgcHJpdmF0ZSBQdXJjaGFzZU9yZGVyIHB1cmNoYXNlT3JkZXI7CgogICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBTdHJpbmcgc2t1OwoKICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSkKICAgIHByaXZhdGUgaW50IHF1YW50aXR5OwoKICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSwgcHJlY2lzaW9uID0gMTQsIHNjYWxlID0gMikKICAgIHByaXZhdGUgQmlnRGVjaW1hbCB1bml0UHJpY2U7CgogICAgcHJvdGVjdGVkIFB1cmNoYXNlT3JkZXJMaW5lKCkgewogICAgfQoKICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyTGluZShTdHJpbmcgc2t1LCBpbnQgcXVhbnRpdHksIEJpZ0RlY2ltYWwgdW5pdFByaWNlKSB7CiAgICAgICAgdGhpcy5za3UgPSBza3U7CiAgICAgICAgdGhpcy5xdWFudGl0eSA9IHF1YW50aXR5OwogICAgICAgIHRoaXMudW5pdFByaWNlID0gdW5pdFByaWNlOwogICAgfQoKICAgIHZvaWQgc2V0UHVyY2hhc2VPcmRlcihQdXJjaGFzZU9yZGVyIHB1cmNoYXNlT3JkZXIpIHsKICAgICAgICB0aGlzLnB1cmNoYXNlT3JkZXIgPSBwdXJjaGFzZU9yZGVyOwogICAgfQoKICAgIHB1YmxpYyBMb25nIGdldElkKCkgewogICAgICAgIHJldHVybiBpZDsKICAgIH0KCiAgICBwdWJsaWMgU3RyaW5nIGdldFNrdSgpIHsKICAgICAgICByZXR1cm4gc2t1OwogICAgfQoKICAgIHB1YmxpYyBpbnQgZ2V0UXVhbnRpdHkoKSB7CiAgICAgICAgcmV0dXJuIHF1YW50aXR5OwogICAgfQoKICAgIHB1YmxpYyBCaWdEZWNpbWFsIGdldFVuaXRQcmljZSgpIHsKICAgICAgICByZXR1cm4gdW5pdFByaWNlOwogICAgfQp9Cg==', 'base64'), 'UTF8'), true, 8),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PoStatus.java', 'java', 'package com.zycus.procurement.po;

public enum PoStatus {
    PENDING,
    APPROVED,
    REJECTED
}
', true, 9),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/Dtos.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamF2YS5tYXRoLkJpZ0RlY2ltYWw7CmltcG9ydCBqYXZhLnV0aWwuQXJyYXlMaXN0OwppbXBvcnQgamF2YS51dGlsLkxpc3Q7CgovKiogQVBJIHBheWxvYWRzLiAqLwpwdWJsaWMgZmluYWwgY2xhc3MgRHRvcyB7CgogICAgcHJpdmF0ZSBEdG9zKCkgewogICAgfQoKICAgIHB1YmxpYyByZWNvcmQgUHVyY2hhc2VPcmRlckR0byhsb25nIGlkLCBTdHJpbmcgbnVtYmVyLCBQb1N0YXR1cyBzdGF0dXMsIEJpZ0RlY2ltYWwgdG90YWwsCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50IGFwcHJvdmFsc1JlY2VpdmVkLCBpbnQgYXBwcm92YWxzUmVxdWlyZWQsIGludCBsaW5lQ291bnQpIHsKCiAgICAgICAgcHVibGljIHN0YXRpYyBQdXJjaGFzZU9yZGVyRHRvIGZyb20oUHVyY2hhc2VPcmRlciBwbykgewogICAgICAgICAgICByZXR1cm4gbmV3IFB1cmNoYXNlT3JkZXJEdG8ocG8uZ2V0SWQoKSwgcG8uZ2V0TnVtYmVyKCksIHBvLmdldFN0YXR1cygpLCBwby5nZXRUb3RhbCgpLAogICAgICAgICAgICAgICAgICAgIHBvLmdldEFwcHJvdmFsc1JlY2VpdmVkKCksIHBvLmdldEFwcHJvdmFsc1JlcXVpcmVkKCksIHBvLmdldExpbmVzKCkuc2l6ZSgpKTsKICAgICAgICB9CiAgICB9CgogICAgcHVibGljIHJlY29yZCBJbnZvaWNlTGluZShTdHJpbmcgc2t1LCBpbnQgcXVhbnRpdHksIEJpZ0RlY2ltYWwgdW5pdFByaWNlKSB7CiAgICB9CgogICAgcHVibGljIHJlY29yZCBJbnZvaWNlUmVxdWVzdChTdHJpbmcgaW52b2ljZU51bWJlciwgQmlnRGVjaW1hbCBhbW91bnQsIExpc3Q8SW52b2ljZUxpbmU+IGxpbmVzKSB7CiAgICB9CgogICAgcHVibGljIHJlY29yZCBNYXRjaFJlc3VsdChib29sZWFuIG1hdGNoZWQsIExpc3Q8U3RyaW5nPiBwcm9ibGVtcykgewoKICAgICAgICBwdWJsaWMgc3RhdGljIE1hdGNoUmVzdWx0IG9mKExpc3Q8U3RyaW5nPiBwcm9ibGVtcykgewogICAgICAgICAgICByZXR1cm4gbmV3IE1hdGNoUmVzdWx0KHByb2JsZW1zLmlzRW1wdHkoKSwgTGlzdC5jb3B5T2YocHJvYmxlbXMpKTsKICAgICAgICB9CiAgICB9CgogICAgcHVibGljIHJlY29yZCBSZWplY3RSZXF1ZXN0KFN0cmluZyByZWFzb24pIHsKICAgIH0KCiAgICBwdWJsaWMgcmVjb3JkIEJhdGNoUmVxdWVzdChMaXN0PExvbmc+IGlkcykgewogICAgfQoKICAgIC8qKiBSZXN1bHQgb2YgYSBiYXRjaCBhcHByb3ZhbDogd2hpY2ggUE9zIHdlcmUgYXBwcm92ZWQgYW5kIHdoaWNoIGZhaWxlZCAoYW5kIHdoeSkuICovCiAgICBwdWJsaWMgc3RhdGljIGZpbmFsIGNsYXNzIEJhdGNoUmVzdWx0IHsKCiAgICAgICAgcHJpdmF0ZSBmaW5hbCBMaXN0PExvbmc+IGFwcHJvdmVkID0gbmV3IEFycmF5TGlzdDw+KCk7CiAgICAgICAgcHJpdmF0ZSBmaW5hbCBMaXN0PFN0cmluZz4gZmFpbHVyZXMgPSBuZXcgQXJyYXlMaXN0PD4oKTsKCiAgICAgICAgcHVibGljIHZvaWQgYXBwcm92ZWQobG9uZyBpZCkgewogICAgICAgICAgICBhcHByb3ZlZC5hZGQoaWQpOwogICAgICAgIH0KCiAgICAgICAgcHVibGljIHZvaWQgZmFpbGVkKGxvbmcgaWQsIFN0cmluZyByZWFzb24pIHsKICAgICAgICAgICAgZmFpbHVyZXMuYWRkKGlkICsgIjogIiArIHJlYXNvbik7CiAgICAgICAgfQoKICAgICAgICBwdWJsaWMgTGlzdDxMb25nPiBnZXRBcHByb3ZlZCgpIHsKICAgICAgICAgICAgcmV0dXJuIGFwcHJvdmVkOwogICAgICAgIH0KCiAgICAgICAgcHVibGljIExpc3Q8U3RyaW5nPiBnZXRGYWlsdXJlcygpIHsKICAgICAgICAgICAgcmV0dXJuIGZhaWx1cmVzOwogICAgICAgIH0KICAgIH0KfQo=', 'base64'), 'UTF8'), true, 10),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/BudgetService.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamF2YS5tYXRoLkJpZ0RlY2ltYWw7CgovKioKICogUmVzZXJ2ZXMgYnVkZ2V0IGZvciBhbiBhcHByb3ZlZCBQTyAoY29zdC1jZW50cmUgbGltaXRzKS4gSW1wbGVtZW50ZWQgYnkgdGhlIGZpbmFuY2UgbW9kdWxlOyBpdAogKiB3cml0ZXMgYSByZXNlcnZhdGlvbiByb3cgaW4gdGhlIHNhbWUgZGF0YWJhc2UuCiAqLwpwdWJsaWMgaW50ZXJmYWNlIEJ1ZGdldFNlcnZpY2UgewoKICAgIC8qKiBSZXNlcnZlcyB7QGNvZGUgYW1vdW50fSBmb3IgdGhlIFBPLCBvciB0aHJvd3MgaWYgdGhlIGNvc3QgY2VudHJlIGhhcyBubyBidWRnZXQgbGVmdC4gKi8KICAgIHZvaWQgcmVzZXJ2ZShsb25nIHB1cmNoYXNlT3JkZXJJZCwgQmlnRGVjaW1hbCBhbW91bnQpIHRocm93cyBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbjsKfQo=', 'base64'), 'UTF8'), true, 11),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/BudgetExceededException.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgovKiogQ2hlY2tlZDogY2FsbGVycyBtdXN0IGRlY2lkZSB3aGF0IHRvIGRvIHdoZW4gYSBjb3N0IGNlbnRyZSBpcyBvdXQgb2YgYnVkZ2V0LiAqLwpwdWJsaWMgY2xhc3MgQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24gZXh0ZW5kcyBFeGNlcHRpb24gewoKICAgIHB1YmxpYyBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbihTdHJpbmcgbWVzc2FnZSkgewogICAgICAgIHN1cGVyKG1lc3NhZ2UpOwogICAgfQp9Cg==', 'base64'), 'UTF8'), true, 12),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PoNotFoundException.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgpwdWJsaWMgY2xhc3MgUG9Ob3RGb3VuZEV4Y2VwdGlvbiBleHRlbmRzIFJ1bnRpbWVFeGNlcHRpb24gewoKICAgIHB1YmxpYyBQb05vdEZvdW5kRXhjZXB0aW9uKGxvbmcgaWQpIHsKICAgICAgICBzdXBlcigiUHVyY2hhc2Ugb3JkZXIgIiArIGlkICsgIiBub3QgZm91bmQiKTsKICAgIH0KfQo=', 'base64'), 'UTF8'), true, 13),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/resources/application.yml', 'yaml', convert_from(decode('c3ByaW5nOgogIGFwcGxpY2F0aW9uOgogICAgbmFtZTogcG8tYXBwcm92YWxzCiAgZGF0YXNvdXJjZToKICAgIHVybDogamRiYzpwb3N0Z3Jlc3FsOi8vbG9jYWxob3N0OjU0MzIvcHJvY3VyZW1lbnQKICAgIHVzZXJuYW1lOiBwcm9jdXJlbWVudAogICAgcGFzc3dvcmQ6ICR7REJfUEFTU1dPUkR9CiAganBhOgogICAgb3Blbi1pbi12aWV3OiBmYWxzZQogICAgaGliZXJuYXRlOgogICAgICBkZGwtYXV0bzogdmFsaWRhdGUKICAgIHByb3BlcnRpZXM6CiAgICAgIGhpYmVybmF0ZToKICAgICAgICBqZGJjOgogICAgICAgICAgdGltZV96b25lOiBVVEMKc2VydmVyOgogIGVycm9yOgogICAgaW5jbHVkZS1tZXNzYWdlOiBhbHdheXMK', 'base64'), 'UTF8'), true, 14),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/test/java/com/zycus/procurement/po/ApprovalServiceIT.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgc3RhdGljIG9yZy5hc3NlcnRqLmNvcmUuYXBpLkFzc2VydGlvbnMuYXNzZXJ0VGhhdDsKaW1wb3J0IHN0YXRpYyBvcmcuYXNzZXJ0ai5jb3JlLmFwaS5Bc3NlcnRpb25zLmFzc2VydFRoYXRUaHJvd25CeTsKCmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5CYXRjaFJlc3VsdDsKaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkludm9pY2VMaW5lOwppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuSW52b2ljZVJlcXVlc3Q7CmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5QdXJjaGFzZU9yZGVyRHRvOwppbXBvcnQgamF2YS5tYXRoLkJpZ0RlY2ltYWw7CmltcG9ydCBqYXZhLnRpbWUuRHVyYXRpb247CmltcG9ydCBqYXZhLnV0aWwuQXJyYXlMaXN0OwppbXBvcnQgamF2YS51dGlsLkNvbGxlY3Rpb25zOwppbXBvcnQgamF2YS51dGlsLkxpc3Q7CmltcG9ydCBqYXZhLnV0aWwuU2V0OwppbXBvcnQgamF2YS51dGlsLmNvbmN1cnJlbnQuQ2FsbGFibGU7CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5Db25jdXJyZW50SGFzaE1hcDsKaW1wb3J0IGphdmEudXRpbC5jb25jdXJyZW50LkNvcHlPbldyaXRlQXJyYXlMaXN0OwppbXBvcnQgamF2YS51dGlsLmNvbmN1cnJlbnQuQ291bnREb3duTGF0Y2g7CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5FeGVjdXRpb25FeGNlcHRpb247CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5FeGVjdXRvclNlcnZpY2U7CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5FeGVjdXRvcnM7CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5GdXR1cmU7CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5UaW1lVW5pdDsKaW1wb3J0IGphdmEudXRpbC5jb25jdXJyZW50LlRpbWVvdXRFeGNlcHRpb247CmltcG9ydCBqYXZhLnV0aWwuc3RyZWFtLkludFN0cmVhbTsKaW1wb3J0IG9yZy5qdW5pdC5qdXBpdGVyLmFwaS5CZWZvcmVFYWNoOwppbXBvcnQgb3JnLmp1bml0Lmp1cGl0ZXIuYXBpLkRpc3BsYXlOYW1lOwppbXBvcnQgb3JnLmp1bml0Lmp1cGl0ZXIuYXBpLlRlc3Q7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmJlYW5zLmZhY3RvcnkuYW5ub3RhdGlvbi5BdXRvd2lyZWQ7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmJvb3QudGVzdC5jb250ZXh0LlNwcmluZ0Jvb3RUZXN0OwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5ib290LnRlc3QuY29udGV4dC5UZXN0Q29uZmlndXJhdGlvbjsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuYm9vdC50ZXN0Y29udGFpbmVycy5zZXJ2aWNlLmNvbm5lY3Rpb24uU2VydmljZUNvbm5lY3Rpb247CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmNvbnRleHQuYW5ub3RhdGlvbi5CZWFuOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5jb250ZXh0LmFubm90YXRpb24uSW1wb3J0OwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYW8uT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmRvbWFpbi5QYWdlOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5zdXBwb3J0LlRyYW5zYWN0aW9uU3luY2hyb25pemF0aW9uOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5zdXBwb3J0LlRyYW5zYWN0aW9uU3luY2hyb25pemF0aW9uTWFuYWdlcjsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsudHJhbnNhY3Rpb24uc3VwcG9ydC5UcmFuc2FjdGlvblRlbXBsYXRlOwppbXBvcnQgb3JnLnRlc3Rjb250YWluZXJzLmNvbnRhaW5lcnMuUG9zdGdyZVNRTENvbnRhaW5lcjsKaW1wb3J0IG9yZy50ZXN0Y29udGFpbmVycy5qdW5pdC5qdXBpdGVyLkNvbnRhaW5lcjsKaW1wb3J0IG9yZy50ZXN0Y29udGFpbmVycy5qdW5pdC5qdXBpdGVyLlRlc3Rjb250YWluZXJzOwoKLyoqCiAqIFJ1bnMgYWdhaW5zdCBhIHJlYWwgUG9zdGdyZVNRTCAoVGVzdGNvbnRhaW5lcnMpOiB7QGNvZGUgbXZuIHZlcmlmeX0uIFRoZSBzY2hlbWEgaXMgZ2VuZXJhdGVkIGZyb20KICogdGhlIGVudGl0aWVzLCBhbmQgSGliZXJuYXRlIGlzIHRvbGQgdG8gZmFpbCBpbnN0ZWFkIG9mIHBhZ2luZyBhIGNvbGxlY3Rpb24gZmV0Y2ggaW4gbWVtb3J5LgogKi8KQFRlc3Rjb250YWluZXJzCkBTcHJpbmdCb290VGVzdChwcm9wZXJ0aWVzID0gewogICAgICAgICJzcHJpbmcuanBhLmhpYmVybmF0ZS5kZGwtYXV0bz1jcmVhdGUtZHJvcCIsCiAgICAgICAgInNwcmluZy5qcGEucHJvcGVydGllcy5oaWJlcm5hdGUucXVlcnkuZmFpbF9vbl9wYWdpbmF0aW9uX292ZXJfY29sbGVjdGlvbl9mZXRjaD10cnVlIn0pCkBJbXBvcnQoQXBwcm92YWxTZXJ2aWNlSVQuRmFrZXMuY2xhc3MpCmNsYXNzIEFwcHJvdmFsU2VydmljZUlUIHsKCiAgICBAQ29udGFpbmVyCiAgICBAU2VydmljZUNvbm5lY3Rpb24KICAgIHN0YXRpYyBQb3N0Z3JlU1FMQ29udGFpbmVyPD8+IGRiID0gbmV3IFBvc3RncmVTUUxDb250YWluZXI8PigicG9zdGdyZXM6MTYtYWxwaW5lIik7CgogICAgQFRlc3RDb25maWd1cmF0aW9uCiAgICBzdGF0aWMgY2xhc3MgRmFrZXMgewogICAgICAgIEBCZWFuCiAgICAgICAgVGVzdEJ1ZGdldCBidWRnZXRTZXJ2aWNlKCkgewogICAgICAgICAgICByZXR1cm4gbmV3IFRlc3RCdWRnZXQoKTsKICAgICAgICB9CiAgICB9CgogICAgLyoqCiAgICAgKiBMaWtlIHRoZSBmaW5hbmNlIG1vZHVsZSdzIGltcGxlbWVudGF0aW9uLCBhIHJlc2VydmF0aW9uIG9ubHkgZXhpc3RzIG9uY2UgdGhlIHRyYW5zYWN0aW9uIHRoYXQKICAgICAqIG1hZGUgaXQgY29tbWl0cy4gUmVmdXNlcyB0aGUgUE9zIGluIHtAbGluayAjcmVmdXNlZH07IHtAbGluayAjZGVsYXl9IHdpZGVucyByYWNlIHdpbmRvd3MuCiAgICAgKi8KICAgIHN0YXRpYyBjbGFzcyBUZXN0QnVkZ2V0IGltcGxlbWVudHMgQnVkZ2V0U2VydmljZSB7CiAgICAgICAgZmluYWwgU2V0PExvbmc+IHJlZnVzZWQgPSBDb25jdXJyZW50SGFzaE1hcC5uZXdLZXlTZXQoKTsKICAgICAgICBmaW5hbCBMaXN0PExvbmc+IHJlc2VydmVkID0gbmV3IENvcHlPbldyaXRlQXJyYXlMaXN0PD4oKTsKICAgICAgICB2b2xhdGlsZSBEdXJhdGlvbiBkZWxheSA9IER1cmF0aW9uLlpFUk87CgogICAgICAgIEBPdmVycmlkZQogICAgICAgIHB1YmxpYyB2b2lkIHJlc2VydmUobG9uZyBwdXJjaGFzZU9yZGVySWQsIEJpZ0RlY2ltYWwgYW1vdW50KSB0aHJvd3MgQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24gewogICAgICAgICAgICBzbGVlcChkZWxheSk7CiAgICAgICAgICAgIGlmIChyZWZ1c2VkLmNvbnRhaW5zKHB1cmNoYXNlT3JkZXJJZCkpIHsKICAgICAgICAgICAgICAgIHRocm93IG5ldyBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbigiQ29zdCBjZW50cmUgaXMgb3V0IG9mIGJ1ZGdldCIpOwogICAgICAgICAgICB9CiAgICAgICAgICAgIGlmICghVHJhbnNhY3Rpb25TeW5jaHJvbml6YXRpb25NYW5hZ2VyLmlzU3luY2hyb25pemF0aW9uQWN0aXZlKCkpIHsKICAgICAgICAgICAgICAgIHJlc2VydmVkLmFkZChwdXJjaGFzZU9yZGVySWQpOwogICAgICAgICAgICAgICAgcmV0dXJuOwogICAgICAgICAgICB9CiAgICAgICAgICAgIFRyYW5zYWN0aW9uU3luY2hyb25pemF0aW9uTWFuYWdlci5yZWdpc3RlclN5bmNocm9uaXphdGlvbihuZXcgVHJhbnNhY3Rpb25TeW5jaHJvbml6YXRpb24oKSB7CiAgICAgICAgICAgICAgICBAT3ZlcnJpZGUKICAgICAgICAgICAgICAgIHB1YmxpYyB2b2lkIGFmdGVyQ29tbWl0KCkgewogICAgICAgICAgICAgICAgICAgIHJlc2VydmVkLmFkZChwdXJjaGFzZU9yZGVySWQpOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9KTsKICAgICAgICB9CgogICAgICAgIGxvbmcgcmVzZXJ2YXRpb25zRm9yKGxvbmcgaWQpIHsKICAgICAgICAgICAgcmV0dXJuIHJlc2VydmVkLnN0cmVhbSgpLmZpbHRlcihyIC0+IHIgPT0gaWQpLmNvdW50KCk7CiAgICAgICAgfQogICAgfQoKICAgIEBBdXRvd2lyZWQgQXBwcm92YWxTZXJ2aWNlIHNlcnZpY2U7CiAgICBAQXV0b3dpcmVkIFB1cmNoYXNlT3JkZXJDb250cm9sbGVyIGNvbnRyb2xsZXI7CiAgICBAQXV0b3dpcmVkIFB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IG9yZGVyczsKICAgIEBBdXRvd2lyZWQgSWRlbXBvdGVuY3lSZWNvcmRSZXBvc2l0b3J5IGlkZW1wb3RlbmN5OwogICAgQEF1dG93aXJlZCBUZXN0QnVkZ2V0IGJ1ZGdldDsKICAgIEBBdXRvd2lyZWQgVHJhbnNhY3Rpb25UZW1wbGF0ZSB0eDsKCiAgICBAQmVmb3JlRWFjaAogICAgdm9pZCByZXNldCgpIHsKICAgICAgICBpZGVtcG90ZW5jeS5kZWxldGVBbGwoKTsKICAgICAgICBvcmRlcnMuZGVsZXRlQWxsKCk7CiAgICAgICAgYnVkZ2V0LnJlZnVzZWQuY2xlYXIoKTsKICAgICAgICBidWRnZXQucmVzZXJ2ZWQuY2xlYXIoKTsKICAgICAgICBidWRnZXQuZGVsYXkgPSBEdXJhdGlvbi5aRVJPOwogICAgfQoKICAgIC8vIC0tLS0gdHJhbnNhY3Rpb25zIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJhIHJlamVjdGlvbiBpcyBzYXZlZCIpCiAgICB2b2lkIHJlamVjdGlvbklzU2F2ZWQoKSB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy0xIiwgIjUwMDAuMDAiKTsKCiAgICAgICAgc2VydmljZS5yZWplY3QoaWQsICJhc2hhIiwgIldyb25nIHZlbmRvciIpOwoKICAgICAgICBQdXJjaGFzZU9yZGVyIHNhdmVkID0gcmVsb2FkKGlkKTsKICAgICAgICBhc3NlcnRUaGF0KHNhdmVkLmdldFN0YXR1cygpKS5pc0VxdWFsVG8oUG9TdGF0dXMuUkVKRUNURUQpOwogICAgICAgIGFzc2VydFRoYXQoc2F2ZWQuZ2V0UmVqZWN0aW9uUmVhc29uKCkpLmlzRXF1YWxUbygiV3JvbmcgdmVuZG9yIik7CiAgICB9CgogICAgQFRlc3QKICAgIEBEaXNwbGF5TmFtZSgiYW4gYXBwcm92YWwgdGhlIGJ1ZGdldCByZWZ1c2VzIGNoYW5nZXMgbm90aGluZywgYW5kIGNhbiBiZSByZXRyaWVkIGxhdGVyIikKICAgIHZvaWQgcmVmdXNlZEFwcHJvdmFsSXNSb2xsZWRCYWNrKCkgdGhyb3dzIEV4Y2VwdGlvbiB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy0yIiwgIjUwMDAuMDAiKTsKICAgICAgICBidWRnZXQucmVmdXNlZC5hZGQoaWQpOwoKICAgICAgICBhc3NlcnRUaGF0VGhyb3duQnkoKCkgLT4gc2VydmljZS5hcHByb3ZlKGlkLCAiYXNoYSIsICJrZXktMSIpKS5pc0luc3RhbmNlT2YoQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24uY2xhc3MpOwoKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0U3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5QRU5ESU5HKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0QXBwcm92YWxzUmVjZWl2ZWQoKSkuaXNaZXJvKCk7CgogICAgICAgIGJ1ZGdldC5yZWZ1c2VkLmNsZWFyKCk7CiAgICAgICAgYXNzZXJ0VGhhdChzZXJ2aWNlLmFwcHJvdmUoaWQsICJhc2hhIiwgImtleS0xIikuc3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5BUFBST1ZFRCk7CiAgICAgICAgYXNzZXJ0VGhhdChidWRnZXQucmVzZXJ2YXRpb25zRm9yKGlkKSkuaXNFcXVhbFRvKDEpOwogICAgfQoKICAgIC8vIC0tLS0gaWRlbXBvdGVuY3kgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImEgcmV0cmllZCByZXF1ZXN0IChzYW1lIGtleSkgaXMgYXBwbGllZCBvbmNlIikKICAgIHZvaWQgcmV0cnlJc0FwcGxpZWRPbmNlKCkgdGhyb3dzIEV4Y2VwdGlvbiB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy0zIiwgIjI1MDAwMDAuMDAiKTsKCiAgICAgICAgc2VydmljZS5hcHByb3ZlKGlkLCAiYXNoYSIsICJrZXktMSIpOwogICAgICAgIFB1cmNoYXNlT3JkZXJEdG8gcmV0cnkgPSBzZXJ2aWNlLmFwcHJvdmUoaWQsICJhc2hhIiwgImtleS0xIik7CgogICAgICAgIGFzc2VydFRoYXQocmV0cnkuYXBwcm92YWxzUmVjZWl2ZWQoKSkuaXNFcXVhbFRvKDEpOwogICAgICAgIGFzc2VydFRoYXQocmVsb2FkKGlkKS5nZXRBcHByb3ZhbHNSZWNlaXZlZCgpKS5pc0VxdWFsVG8oMSk7CiAgICB9CgogICAgQFRlc3QKICAgIEBEaXNwbGF5TmFtZSgicmV0cmllcyB0aGF0IGFycml2ZSBhdCB0aGUgc2FtZSB0aW1lIGFyZSBhcHBsaWVkIG9uY2UsIGFuZCBlYWNoIGdldHMgYSByZXNwb25zZSIpCiAgICB2b2lkIGNvbmN1cnJlbnRSZXRyaWVzQXJlQXBwbGllZE9uY2UoKSB0aHJvd3MgRXhjZXB0aW9uIHsKICAgICAgICBsb25nIGlkID0gcG8oIlBPLTQiLCAiNTAwMC4wMCIpOwogICAgICAgIGJ1ZGdldC5kZWxheSA9IER1cmF0aW9uLm9mTWlsbGlzKDMwMCk7CgogICAgICAgIExpc3Q8VGhyb3dhYmxlPiBvdXRjb21lcyA9IHJhY2UoQ29sbGVjdGlvbnMubkNvcGllcyg4LCAoKSAtPiBzZXJ2aWNlLmFwcHJvdmUoaWQsICJhc2hhIiwgImtleS0xIikpKTsKCiAgICAgICAgYXNzZXJ0VGhhdChvdXRjb21lcykuY29udGFpbnNPbmx5TnVsbHMoKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0U3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5BUFBST1ZFRCk7CiAgICAgICAgYXNzZXJ0VGhhdChidWRnZXQucmVzZXJ2YXRpb25zRm9yKGlkKSkuaXNFcXVhbFRvKDEpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImFuIGlkZW1wb3RlbmN5IGtleSBiZWxvbmdzIHRvIG9uZSBhcHByb3ZlciAoa2V5cyBhcmUgb25seSB1bmlxdWUgcGVyIHVzZXIpIikKICAgIHZvaWQga2V5c0FyZVNjb3BlZFRvVGhlQXBwcm92ZXIoKSB0aHJvd3MgRXhjZXB0aW9uIHsKICAgICAgICBsb25nIGlkID0gcG8oIlBPLTUiLCAiMjUwMDAwMC4wMCIpOwoKICAgICAgICBzZXJ2aWNlLmFwcHJvdmUoaWQsICJhc2hhIiwgIjEiKTsKICAgICAgICBQdXJjaGFzZU9yZGVyRHRvIHNlY29uZCA9IHNlcnZpY2UuYXBwcm92ZShpZCwgInJhdmkiLCAiMSIpOwoKICAgICAgICBhc3NlcnRUaGF0KHNlY29uZC5zdGF0dXMoKSkuaXNFcXVhbFRvKFBvU3RhdHVzLkFQUFJPVkVEKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0QXBwcm92YWxzUmVjZWl2ZWQoKSkuaXNFcXVhbFRvKDIpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoInJldXNpbmcgYSBrZXkgZm9yIGEgZGlmZmVyZW50IFBPIGlzIHJlZnVzZWQsIG5vdCBhbnN3ZXJlZCB3aXRoIHRoZSBvdGhlciBQTyIpCiAgICB2b2lkIGtleVJldXNlSXNSZWZ1c2VkKCkgdGhyb3dzIEV4Y2VwdGlvbiB7CiAgICAgICAgbG9uZyBmaXJzdCA9IHBvKCJQTy02IiwgIjUwMDAuMDAiKTsKICAgICAgICBsb25nIG90aGVyID0gcG8oIlBPLTciLCAiNTAwMC4wMCIpOwogICAgICAgIHNlcnZpY2UuYXBwcm92ZShmaXJzdCwgImFzaGEiLCAia2V5LTEiKTsKCiAgICAgICAgYXNzZXJ0VGhhdFRocm93bkJ5KCgpIC0+IHNlcnZpY2UuYXBwcm92ZShvdGhlciwgImFzaGEiLCAia2V5LTEiKSkuaXNJbnN0YW5jZU9mKFJ1bnRpbWVFeGNlcHRpb24uY2xhc3MpOwoKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChvdGhlcikuZ2V0U3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5QRU5ESU5HKTsKICAgIH0KCiAgICAvLyAtLS0tIHR3by1wZXJzb24gcnVsZSBhbmQgY29uY3VycmVudCBhcHByb3ZlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCgogICAgQFRlc3QKICAgIEBEaXNwbGF5TmFtZSgiYSBoaWdoLXZhbHVlIFBPIGlzIGFwcHJvdmVkIGJ5IHR3byBkaWZmZXJlbnQgcGVvcGxlIikKICAgIHZvaWQgdHdvQXBwcm92ZXJzKCkgdGhyb3dzIEV4Y2VwdGlvbiB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy04IiwgIjI1MDAwMDAuMDAiKTsKCiAgICAgICAgYXNzZXJ0VGhhdChzZXJ2aWNlLmFwcHJvdmUoaWQsICJhc2hhIiwgImEtMSIpLnN0YXR1cygpKS5pc0VxdWFsVG8oUG9TdGF0dXMuUEVORElORyk7CiAgICAgICAgYXNzZXJ0VGhhdChzZXJ2aWNlLmFwcHJvdmUoaWQsICJyYXZpIiwgInItMSIpLnN0YXR1cygpKS5pc0VxdWFsVG8oUG9TdGF0dXMuQVBQUk9WRUQpOwogICAgICAgIGFzc2VydFRoYXQoYnVkZ2V0LnJlc2VydmF0aW9uc0ZvcihpZCkpLmlzRXF1YWxUbygxKTsKICAgIH0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJ0aGUgc2FtZSBwZXJzb24gY2FuJ3QgZ2l2ZSBib3RoIGFwcHJvdmFscyBvZiBhIGhpZ2gtdmFsdWUgUE8iKQogICAgdm9pZCBzYW1lQXBwcm92ZXJUd2ljZSgpIHRocm93cyBFeGNlcHRpb24gewogICAgICAgIGxvbmcgaWQgPSBwbygiUE8tOSIsICIyNTAwMDAwLjAwIik7CiAgICAgICAgc2VydmljZS5hcHByb3ZlKGlkLCAiYXNoYSIsICJhLTEiKTsKCiAgICAgICAgYXNzZXJ0VGhhdFRocm93bkJ5KCgpIC0+IHNlcnZpY2UuYXBwcm92ZShpZCwgImFzaGEiLCAiYS0yIikpLmlzSW5zdGFuY2VPZihJbGxlZ2FsU3RhdGVFeGNlcHRpb24uY2xhc3MpOwoKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0U3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5QRU5ESU5HKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0QXBwcm92YWxzUmVjZWl2ZWQoKSkuaXNFcXVhbFRvKDEpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoInR3byBwZW9wbGUgcmFjaW5nIGZvciB0aGUgZmluYWwgYXBwcm92YWw6IG9uZSB3aW5zLCB0aGUgb3RoZXIgaXMgdG9sZCB0byByZWZyZXNoIikKICAgIHZvaWQgcmFjaW5nQXBwcm92ZXJzKCkgdGhyb3dzIEV4Y2VwdGlvbiB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy0xMCIsICIyNTAwMDAwLjAwIik7CiAgICAgICAgc2VydmljZS5hcHByb3ZlKGlkLCAiYXNoYSIsICJhLTEiKTsKICAgICAgICBidWRnZXQuZGVsYXkgPSBEdXJhdGlvbi5vZk1pbGxpcygzMDApOwoKICAgICAgICBMaXN0PFRocm93YWJsZT4gb3V0Y29tZXMgPSByYWNlKExpc3Qub2YoCiAgICAgICAgICAgICAgICAoKSAtPiBzZXJ2aWNlLmFwcHJvdmUoaWQsICJyYXZpIiwgInItMSIpLAogICAgICAgICAgICAgICAgKCkgLT4gc2VydmljZS5hcHByb3ZlKGlkLCAibWVlcmEiLCAibS0xIikpKTsKCiAgICAgICAgYXNzZXJ0VGhhdChvdXRjb21lcykuZmlsdGVyZWRPbihvIC0+IG8gPT0gbnVsbCkuaGFzU2l6ZSgxKTsKICAgICAgICBhc3NlcnRUaGF0KG91dGNvbWVzKS5maWx0ZXJlZE9uKG8gLT4gbyAhPSBudWxsKS5zaW5nbGVFbGVtZW50KCkKICAgICAgICAgICAgICAgIC5pc0luc3RhbmNlT2ZBbnkoT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uLmNsYXNzLCBJbGxlZ2FsU3RhdGVFeGNlcHRpb24uY2xhc3MpOwogICAgICAgIGFzc2VydFRoYXQocmVsb2FkKGlkKS5nZXRTdGF0dXMoKSkuaXNFcXVhbFRvKFBvU3RhdHVzLkFQUFJPVkVEKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0QXBwcm92YWxzUmVjZWl2ZWQoKSkuaXNFcXVhbFRvKDIpOwogICAgICAgIGFzc2VydFRoYXQoYnVkZ2V0LnJlc2VydmF0aW9uc0ZvcihpZCkpLmlzRXF1YWxUbygxKTsKICAgIH0KCiAgICAvLyAtLS0tIGJhdGNoIGFwcHJvdmFsIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJiYXRjaDogYSBQTyB0aGUgYnVkZ2V0IHJlZnVzZXMgc3RheXMgcGVuZGluZzsgdGhlIG90aGVycyBhcmUgYXBwcm92ZWQiKQogICAgdm9pZCBiYXRjaElzb2xhdGVzQnVkZ2V0RmFpbHVyZXMoKSB7CiAgICAgICAgbG9uZyBhID0gcG8oIlBPLTExIiwgIjEwMC4wMCIpOwogICAgICAgIGxvbmcgYiA9IHBvKCJQTy0xMiIsICIyMDAuMDAiKTsKICAgICAgICBsb25nIGMgPSBwbygiUE8tMTMiLCAiMzAwLjAwIik7CiAgICAgICAgYnVkZ2V0LnJlZnVzZWQuYWRkKGIpOwoKICAgICAgICBCYXRjaFJlc3VsdCByZXN1bHQgPSBzZXJ2aWNlLmFwcHJvdmVCYXRjaChMaXN0Lm9mKGEsIGIsIGMpLCAiYXNoYSIpOwoKICAgICAgICBhc3NlcnRUaGF0KHJlc3VsdC5nZXRBcHByb3ZlZCgpKS5jb250YWluc0V4YWN0bHkoYSwgYyk7CiAgICAgICAgYXNzZXJ0VGhhdChyZXN1bHQuZ2V0RmFpbHVyZXMoKSkuc2luZ2xlRWxlbWVudCgpLmFzU3RyaW5nKCkuc3RhcnRzV2l0aChiICsgIjoiKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChhKS5nZXRTdGF0dXMoKSkuaXNFcXVhbFRvKFBvU3RhdHVzLkFQUFJPVkVEKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChiKS5nZXRTdGF0dXMoKSkuaXNFcXVhbFRvKFBvU3RhdHVzLlBFTkRJTkcpOwogICAgICAgIGFzc2VydFRoYXQocmVsb2FkKGMpLmdldFN0YXR1cygpKS5pc0VxdWFsVG8oUG9TdGF0dXMuQVBQUk9WRUQpOwogICAgICAgIGFzc2VydFRoYXQoYnVkZ2V0LnJlc2VydmVkKS5jb250YWluc0V4YWN0bHlJbkFueU9yZGVyKGEsIGMpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImJhdGNoOiBhbiBpZCB0aGF0IGNhbid0IGJlIGFwcHJvdmVkIGRvZXNuJ3Qgc3RvcCB0aGUgb3RoZXJzIikKICAgIHZvaWQgYmF0Y2hTdXJ2aXZlc0JhZElkcygpIHRocm93cyBFeGNlcHRpb24gewogICAgICAgIGxvbmcgb2sgPSBwbygiUE8tMTQiLCAiMTAwLjAwIik7CiAgICAgICAgbG9uZyBkb25lID0gcG8oIlBPLTE1IiwgIjEwMC4wMCIpOwogICAgICAgIHNlcnZpY2UuYXBwcm92ZShkb25lLCAicmF2aSIsICJyLTEiKTsKICAgICAgICBsb25nIG1pc3NpbmcgPSBkb25lICsgMTAwMDsKCiAgICAgICAgQmF0Y2hSZXN1bHQgcmVzdWx0ID0gc2VydmljZS5hcHByb3ZlQmF0Y2goTGlzdC5vZihkb25lLCBvaywgbWlzc2luZyksICJhc2hhIik7CgogICAgICAgIGFzc2VydFRoYXQocmVzdWx0LmdldEFwcHJvdmVkKCkpLmNvbnRhaW5zRXhhY3RseShvayk7CiAgICAgICAgYXNzZXJ0VGhhdChyZXN1bHQuZ2V0RmFpbHVyZXMoKSkuaGFzU2l6ZSgyKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChvaykuZ2V0U3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5BUFBST1ZFRCk7CiAgICB9CgogICAgLy8gLS0tLSBpbnZvaWNlIG1hdGNoaW5nIGFuZCB0aGUgaW5ib3ggLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJtYXRjaGluZyBhbiBpbnZvaWNlIHdvcmtzIChvcGVuLWluLXZpZXcgaXMgb2ZmKSIpCiAgICB2b2lkIG1hdGNoSW52b2ljZUxvYWRzTGluZXMoKSB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy0xNiIsICIxNTAwLjAwIiwgbmV3IFB1cmNoYXNlT3JkZXJMaW5lKCJTS1UtMSIsIDEwLCBuZXcgQmlnRGVjaW1hbCgiMTUwLjAwIikpKTsKICAgICAgICBJbnZvaWNlUmVxdWVzdCBpbnZvaWNlID0gbmV3IEludm9pY2VSZXF1ZXN0KCJJTlYtMSIsIG5ldyBCaWdEZWNpbWFsKCIxNTAwLjAwIiksCiAgICAgICAgICAgICAgICBMaXN0Lm9mKG5ldyBJbnZvaWNlTGluZSgiU0tVLTEiLCAxMCwgbmV3IEJpZ0RlY2ltYWwoIjE1MC4wMCIpKSkpOwoKICAgICAgICBhc3NlcnRUaGF0KGNvbnRyb2xsZXIubWF0Y2hJbnZvaWNlKGlkLCBpbnZvaWNlKS5tYXRjaGVkKCkpLmlzVHJ1ZSgpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImluYm94OiBwYWdlIDEgaG9sZHMgdGhlIG5ld2VzdCBQT3MgYW5kIHBhZ2VzIGRvbid0IG92ZXJsYXAiKQogICAgdm9pZCBpbmJveFBhZ2luZygpIHsKICAgICAgICBMaXN0PExvbmc+IGlkcyA9IG5ldyBBcnJheUxpc3Q8PigpOwogICAgICAgIGZvciAoaW50IGkgPSAxOyBpIDw9IDI1OyBpKyspIHsKICAgICAgICAgICAgaWRzLmFkZChwbygiUE8tIiArICgxMDAgKyBpKSwgIjEwMC4wMCIsCiAgICAgICAgICAgICAgICAgICAgbmV3IFB1cmNoYXNlT3JkZXJMaW5lKCJTS1UtMSIsIDEsIG5ldyBCaWdEZWNpbWFsKCI1MC4wMCIpKSwKICAgICAgICAgICAgICAgICAgICBuZXcgUHVyY2hhc2VPcmRlckxpbmUoIlNLVS0yIiwgMSwgbmV3IEJpZ0RlY2ltYWwoIjUwLjAwIikpKSk7CiAgICAgICAgfQogICAgICAgIENvbGxlY3Rpb25zLnJldmVyc2UoaWRzKTsKCiAgICAgICAgUGFnZTxQdXJjaGFzZU9yZGVyRHRvPiBmaXJzdCA9IGNvbnRyb2xsZXIubGlzdCgxLCAxMCk7CiAgICAgICAgUGFnZTxQdXJjaGFzZU9yZGVyRHRvPiBzZWNvbmQgPSBjb250cm9sbGVyLmxpc3QoMiwgMTApOwogICAgICAgIFBhZ2U8UHVyY2hhc2VPcmRlckR0bz4gbGFzdCA9IGNvbnRyb2xsZXIubGlzdCgzLCAxMCk7CgogICAgICAgIGFzc2VydFRoYXQoZmlyc3QuZ2V0Q29udGVudCgpKS5leHRyYWN0aW5nKFB1cmNoYXNlT3JkZXJEdG86OmlkKS5jb250YWluc0V4YWN0bHlFbGVtZW50c09mKGlkcy5zdWJMaXN0KDAsIDEwKSk7CiAgICAgICAgYXNzZXJ0VGhhdChzZWNvbmQuZ2V0Q29udGVudCgpKS5leHRyYWN0aW5nKFB1cmNoYXNlT3JkZXJEdG86OmlkKS5jb250YWluc0V4YWN0bHlFbGVtZW50c09mKGlkcy5zdWJMaXN0KDEwLCAyMCkpOwogICAgICAgIGFzc2VydFRoYXQobGFzdC5nZXRDb250ZW50KCkpLmV4dHJhY3RpbmcoUHVyY2hhc2VPcmRlckR0bzo6aWQpLmNvbnRhaW5zRXhhY3RseUVsZW1lbnRzT2YoaWRzLnN1Ykxpc3QoMjAsIDI1KSk7CiAgICAgICAgYXNzZXJ0VGhhdChmaXJzdC5nZXRUb3RhbEVsZW1lbnRzKCkpLmlzRXF1YWxUbygyNSk7CiAgICAgICAgYXNzZXJ0VGhhdChmaXJzdC5nZXRDb250ZW50KCkpLmFsbFNhdGlzZnkoZHRvIC0+IGFzc2VydFRoYXQoZHRvLmxpbmVDb3VudCgpKS5pc0VxdWFsVG8oMikpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImluYm94OiBwYWdlIDAgaXMgYSBiYWQgcmVxdWVzdCIpCiAgICB2b2lkIGluYm94UmVqZWN0c1BhZ2VaZXJvKCkgewogICAgICAgIGFzc2VydFRoYXRUaHJvd25CeSgoKSAtPiBjb250cm9sbGVyLmxpc3QoMCwgMTApKS5pc0luc3RhbmNlT2YoSWxsZWdhbEFyZ3VtZW50RXhjZXB0aW9uLmNsYXNzKTsKICAgIH0KCiAgICAvLyAtLS0tIGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KCiAgICBwcml2YXRlIGxvbmcgcG8oU3RyaW5nIG51bWJlciwgU3RyaW5nIHRvdGFsLCBQdXJjaGFzZU9yZGVyTGluZS4uLiBsaW5lcykgewogICAgICAgIFB1cmNoYXNlT3JkZXIgcG8gPSBuZXcgUHVyY2hhc2VPcmRlcihudW1iZXIsIG5ldyBCaWdEZWNpbWFsKHRvdGFsKSk7CiAgICAgICAgZm9yIChQdXJjaGFzZU9yZGVyTGluZSBsaW5lIDogbGluZXMpIHsKICAgICAgICAgICAgcG8uYWRkTGluZShsaW5lKTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuIG9yZGVycy5zYXZlKHBvKS5nZXRJZCgpOwogICAgfQoKICAgIHByaXZhdGUgUHVyY2hhc2VPcmRlciByZWxvYWQobG9uZyBpZCkgewogICAgICAgIHJldHVybiB0eC5leGVjdXRlKHN0YXR1cyAtPiBvcmRlcnMuZmluZEJ5SWQoaWQpLm9yRWxzZVRocm93KCkpOwogICAgfQoKICAgIC8qKiBTdGFydHMgZXZlcnkgY2FsbCBhdCB0aGUgc2FtZSBtb21lbnQsIGVhY2ggb24gaXRzIG93biB0aHJlYWQuIEFuIG91dGNvbWUgaXMgbnVsbCBvbiBzdWNjZXNzLiAqLwogICAgcHJpdmF0ZSBzdGF0aWMgTGlzdDxUaHJvd2FibGU+IHJhY2UoTGlzdDxDYWxsYWJsZTw/Pj4gY2FsbHMpIHRocm93cyBJbnRlcnJ1cHRlZEV4Y2VwdGlvbiB7CiAgICAgICAgRXhlY3V0b3JTZXJ2aWNlIHBvb2wgPSBFeGVjdXRvcnMubmV3Rml4ZWRUaHJlYWRQb29sKGNhbGxzLnNpemUoKSk7CiAgICAgICAgdHJ5IHsKICAgICAgICAgICAgQ291bnREb3duTGF0Y2ggc3RhcnQgPSBuZXcgQ291bnREb3duTGF0Y2goMSk7CiAgICAgICAgICAgIExpc3Q8RnV0dXJlPD8+PiBmdXR1cmVzID0gSW50U3RyZWFtLnJhbmdlKDAsIGNhbGxzLnNpemUoKSkKICAgICAgICAgICAgICAgICAgICAuPEZ1dHVyZTw/Pj5tYXBUb09iaihpIC0+IHBvb2wuc3VibWl0KCgpIC0+IHsKICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQuYXdhaXQoKTsKICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxzLmdldChpKS5jYWxsKCk7CiAgICAgICAgICAgICAgICAgICAgfSkpCiAgICAgICAgICAgICAgICAgICAgLnRvTGlzdCgpOwogICAgICAgICAgICBzdGFydC5jb3VudERvd24oKTsKICAgICAgICAgICAgTGlzdDxUaHJvd2FibGU+IG91dGNvbWVzID0gbmV3IEFycmF5TGlzdDw+KCk7CiAgICAgICAgICAgIGZvciAoRnV0dXJlPD8+IGZ1dHVyZSA6IGZ1dHVyZXMpIHsKICAgICAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICAgICAgZnV0dXJlLmdldCgzMCwgVGltZVVuaXQuU0VDT05EUyk7CiAgICAgICAgICAgICAgICAgICAgb3V0Y29tZXMuYWRkKG51bGwpOwogICAgICAgICAgICAgICAgfSBjYXRjaCAoRXhlY3V0aW9uRXhjZXB0aW9uIGUpIHsKICAgICAgICAgICAgICAgICAgICBvdXRjb21lcy5hZGQoZS5nZXRDYXVzZSgpKTsKICAgICAgICAgICAgICAgIH0gY2F0Y2ggKFRpbWVvdXRFeGNlcHRpb24gZSkgewogICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcigiYSBjYWxsIGRpZCBub3QgZmluaXNoIHdpdGhpbiAzMCBzIiwgZSk7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgcmV0dXJuIG91dGNvbWVzOwogICAgICAgIH0gZmluYWxseSB7CiAgICAgICAgICAgIHBvb2wuc2h1dGRvd25Ob3coKTsKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBzdGF0aWMgdm9pZCBzbGVlcChEdXJhdGlvbiBkdXJhdGlvbikgewogICAgICAgIGlmIChkdXJhdGlvbi5pc1plcm8oKSkgewogICAgICAgICAgICByZXR1cm47CiAgICAgICAgfQogICAgICAgIHRyeSB7CiAgICAgICAgICAgIFRocmVhZC5zbGVlcChkdXJhdGlvbik7CiAgICAgICAgfSBjYXRjaCAoSW50ZXJydXB0ZWRFeGNlcHRpb24gZSkgewogICAgICAgICAgICBUaHJlYWQuY3VycmVudFRocmVhZCgpLmludGVycnVwdCgpOwogICAgICAgIH0KICAgIH0KfQo=', 'base64'), 'UTF8'), true, 15),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/test/java/com/zycus/procurement/po/InvoiceMatcherTest.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgc3RhdGljIG9yZy5hc3NlcnRqLmNvcmUuYXBpLkFzc2VydGlvbnMuYXNzZXJ0VGhhdDsKCmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5JbnZvaWNlTGluZTsKaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkludm9pY2VSZXF1ZXN0OwppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuTWF0Y2hSZXN1bHQ7CmltcG9ydCBqYXZhLm1hdGguQmlnRGVjaW1hbDsKaW1wb3J0IGphdmEudXRpbC5MaXN0OwppbXBvcnQgb3JnLmp1bml0Lmp1cGl0ZXIuYXBpLkRpc3BsYXlOYW1lOwppbXBvcnQgb3JnLmp1bml0Lmp1cGl0ZXIuYXBpLlRlc3Q7CgpjbGFzcyBJbnZvaWNlTWF0Y2hlclRlc3QgewoKICAgIHByaXZhdGUgZmluYWwgSW52b2ljZU1hdGNoZXIgbWF0Y2hlciA9IG5ldyBJbnZvaWNlTWF0Y2hlcigpOwoKICAgIC8qKiBQTyBmb3Ig4oK5MSw1MDAuMDA6IFNLVS0xIHggOCBAIOKCuTE1MC4wMCBhbmQgU0tVLTIgeCAyIEAg4oK5MTUwLjAwLiAqLwogICAgcHJpdmF0ZSBzdGF0aWMgUHVyY2hhc2VPcmRlciBwbygpIHsKICAgICAgICBQdXJjaGFzZU9yZGVyIHBvID0gbmV3IFB1cmNoYXNlT3JkZXIoIlBPLTc3IiwgbmV3IEJpZ0RlY2ltYWwoIjE1MDAuMDAiKSk7CiAgICAgICAgcG8uYWRkTGluZShuZXcgUHVyY2hhc2VPcmRlckxpbmUoIlNLVS0xIiwgOCwgbmV3IEJpZ0RlY2ltYWwoIjE1MC4wMCIpKSk7CiAgICAgICAgcG8uYWRkTGluZShuZXcgUHVyY2hhc2VPcmRlckxpbmUoIlNLVS0yIiwgMiwgbmV3IEJpZ0RlY2ltYWwoIjE1MC4wMCIpKSk7CiAgICAgICAgcmV0dXJuIHBvOwogICAgfQoKICAgIHByaXZhdGUgc3RhdGljIEludm9pY2VMaW5lIGxpbmUoU3RyaW5nIHNrdSwgaW50IHF1YW50aXR5LCBTdHJpbmcgdW5pdFByaWNlKSB7CiAgICAgICAgcmV0dXJuIG5ldyBJbnZvaWNlTGluZShza3UsIHF1YW50aXR5LCBuZXcgQmlnRGVjaW1hbCh1bml0UHJpY2UpKTsKICAgIH0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJhbW91bnRzIHRoYXQgYXJlIGVxdWFsIGluIHZhbHVlIG1hdGNoLCBob3dldmVyIHRoZXkgYXJlIHdyaXR0ZW4iKQogICAgdm9pZCBjb21wYXJlc0Ftb3VudHNCeVZhbHVlKCkgewogICAgICAgIEludm9pY2VSZXF1ZXN0IGludm9pY2UgPSBuZXcgSW52b2ljZVJlcXVlc3QoIklOVi0xIiwgbmV3IEJpZ0RlY2ltYWwoIjE1MDAuMCIpLAogICAgICAgICAgICAgICAgTGlzdC5vZihsaW5lKCJTS1UtMSIsIDgsICIxNTAiKSwgbGluZSgiU0tVLTIiLCAyLCAiMTUwLjAwMCIpKSk7CgogICAgICAgIE1hdGNoUmVzdWx0IHJlc3VsdCA9IG1hdGNoZXIubWF0Y2gocG8oKSwgaW52b2ljZSk7CgogICAgICAgIGFzc2VydFRoYXQocmVzdWx0LnByb2JsZW1zKCkpLmlzRW1wdHkoKTsKICAgICAgICBhc3NlcnRUaGF0KHJlc3VsdC5tYXRjaGVkKCkpLmlzVHJ1ZSgpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImEgU0tVIHNwbGl0IG92ZXIgc2V2ZXJhbCBpbnZvaWNlIGxpbmVzIGNhbid0IGV4Y2VlZCB0aGUgb3JkZXJlZCBxdWFudGl0eSIpCiAgICB2b2lkIGFkZHNVcFNwbGl0TGluZXMoKSB7CiAgICAgICAgSW52b2ljZVJlcXVlc3QgaW52b2ljZSA9IG5ldyBJbnZvaWNlUmVxdWVzdCgiSU5WLTIiLCBuZXcgQmlnRGVjaW1hbCgiMTUwMC4wMCIpLAogICAgICAgICAgICAgICAgTGlzdC5vZihsaW5lKCJTS1UtMSIsIDUsICIxNTAuMDAiKSwgbGluZSgiU0tVLTEiLCA1LCAiMTUwLjAwIikpKTsKCiAgICAgICAgTWF0Y2hSZXN1bHQgcmVzdWx0ID0gbWF0Y2hlci5tYXRjaChwbygpLCBpbnZvaWNlKTsKCiAgICAgICAgYXNzZXJ0VGhhdChyZXN1bHQubWF0Y2hlZCgpKS5pc0ZhbHNlKCk7CiAgICAgICAgYXNzZXJ0VGhhdChyZXN1bHQucHJvYmxlbXMoKSkuYW55U2F0aXNmeShwIC0+IGFzc2VydFRoYXQocCkuY29udGFpbnMoIlNLVS0xIikpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImEgZGlmZmVyZW50IHVuaXQgcHJpY2UgaXMgcmVwb3J0ZWQiKQogICAgdm9pZCByZXBvcnRzUHJpY2VEaWZmZXJlbmNlcygpIHsKICAgICAgICBJbnZvaWNlUmVxdWVzdCBpbnZvaWNlID0gbmV3IEludm9pY2VSZXF1ZXN0KCJJTlYtMyIsIG5ldyBCaWdEZWNpbWFsKCIxNTAwLjAwIiksCiAgICAgICAgICAgICAgICBMaXN0Lm9mKGxpbmUoIlNLVS0xIiwgOCwgIjE1MC4wMSIpKSk7CgogICAgICAgIGFzc2VydFRoYXQobWF0Y2hlci5tYXRjaChwbygpLCBpbnZvaWNlKS5tYXRjaGVkKCkpLmlzRmFsc2UoKTsKICAgIH0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJhIFNLVSB0aGF0IGlzbid0IG9uIHRoZSBQTyBpcyByZXBvcnRlZCIpCiAgICB2b2lkIHJlcG9ydHNVbmtub3duU2t1cygpIHsKICAgICAgICBJbnZvaWNlUmVxdWVzdCBpbnZvaWNlID0gbmV3IEludm9pY2VSZXF1ZXN0KCJJTlYtNCIsIG5ldyBCaWdEZWNpbWFsKCIxNTAwLjAwIiksCiAgICAgICAgICAgICAgICBMaXN0Lm9mKGxpbmUoIlNLVS05IiwgMSwgIjE1MC4wMCIpKSk7CgogICAgICAgIE1hdGNoUmVzdWx0IHJlc3VsdCA9IG1hdGNoZXIubWF0Y2gocG8oKSwgaW52b2ljZSk7CgogICAgICAgIGFzc2VydFRoYXQocmVzdWx0Lm1hdGNoZWQoKSkuaXNGYWxzZSgpOwogICAgICAgIGFzc2VydFRoYXQocmVzdWx0LnByb2JsZW1zKCkpLmFueVNhdGlzZnkocCAtPiBhc3NlcnRUaGF0KHApLmNvbnRhaW5zKCJTS1UtOSIpKTsKICAgIH0KfQo=', 'base64'), 'UTF8'), true, 16),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'checks/transactions.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsKICBiZWFuc0ZvciwKICBjYWxsc1Rocm91Z2gsCiAgY2F0Y2hCbG9ja3MsCiAgY2hlY2ssCiAgY29kZSwKICBoZWxwZXJzT2YsCiAgaXNSZWFkT25seSwKICBsb29wQm9kaWVzLAogIG1ldGhvZCwKICBub1N0cmluZ3MsCiAgb3BlbnNUcmFuc2FjdGlvbiwKICBvdXRzaWRlVHJhbnNhY3Rpb24sCiAgdGVtcGxhdGVzT2YsCiAgdHJhbnNhY3Rpb25hbE9mLAogIHVzZXNUZW1wbGF0ZSwKICB3aXRoSGVscGVycywKfSBmcm9tICcuL3N1cHBvcnQvamF2YSc7Cgpjb25zdCB7IHNlcnZpY2UgfSA9IGNvZGU7CmNvbnN0IHRlbXBsYXRlcyA9IHRlbXBsYXRlc09mKHNlcnZpY2UpOwovKiogcm9sbGJhY2tGb3IgLyByb2xsYmFja0ZvckNsYXNzTmFtZSAoU3ByaW5nKSBvciByb2xsYmFja09uIChKVEEpIHRoYXQgY292ZXJzIHRoZSBidWRnZXQncyBleGNlcHRpb24uICovCmNvbnN0IHJvbGxzQmFja09uQnVkZ2V0ID0gKHRleHQ6IHN0cmluZykgPT4KICAvXGIocm9sbGJhY2tGb3J8cm9sbGJhY2tPbilccyo9XHMqXHs/W14pXSpcYihCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbnxFeGNlcHRpb258VGhyb3dhYmxlKVwuY2xhc3MvLnRlc3QodGV4dCkgfHwKICAvXGJyb2xsYmFja0ZvckNsYXNzTmFtZVxzKj1ccypcez9bXildKiIoW1x3Ll0qXC4pPyhCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbnxFeGNlcHRpb258VGhyb3dhYmxlKSIvLnRlc3QodGV4dCk7CmNvbnN0IEJVREdFVCA9IC9cYihCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbnxFeGNlcHRpb258VGhyb3dhYmxlKVxiLzsKCmRlc2NyaWJlKCd0cmFuc2FjdGlvbnMnLCAoKSA9PiB7CiAgaXQoJ2EgcmVqZWN0aW9uIHJ1bnMgaW4gYSByZWFkLXdyaXRlIHRyYW5zYWN0aW9uJywgKCkgPT4gewogICAgY29uc3QgcmVqZWN0ID0gbWV0aG9kKHNlcnZpY2UsICdyZWplY3QnKTsKICAgIGNvbnN0IHR4ID0gdHJhbnNhY3Rpb25hbE9mKHNlcnZpY2UsIHJlamVjdCk7CiAgICBjb25zdCBvd24gPSBvcGVuc1RyYW5zYWN0aW9uKHR4KSAmJiAhaXNSZWFkT25seSh0eCk7CiAgICAvLyBPciBhIFRyYW5zYWN0aW9uVGVtcGxhdGU6IGl0cyBvd24gdHJhbnNhY3Rpb24sIHVubGVzcyBpdCBqb2lucyBhIHJlYWQtb25seSBvbmUuCiAgICBjb25zdCBwcm9ncmFtbWF0aWMgPSB0ZW1wbGF0ZXMuc29tZSgKICAgICAgKHQpID0+CiAgICAgICAgdXNlc1RlbXBsYXRlKG5vU3RyaW5ncyh3aXRoSGVscGVycyhzZXJ2aWNlLCByZWplY3QpKSwgdCkgJiYKICAgICAgICAhdC5yZWFkT25seSAmJgogICAgICAgICh0LnJlcXVpcmVzTmV3IHx8IG91dHNpZGVUcmFuc2FjdGlvbih0eCkgfHwgIWlzUmVhZE9ubHkodHgpKSwKICAgICk7CiAgICBjaGVjayhvd24gfHwgcHJvZ3JhbW1hdGljLCAnTG9va2VkIGF0IEFwcHJvdmFsU2VydmljZS5yZWplY3QoKSBhbmQgaXRzIGNsYXNzLicpOwogIH0pOwoKICBpdCgnYW4gYXBwcm92YWwgdGhlIGJ1ZGdldCByZWZ1c2VzIGlzIHJvbGxlZCBiYWNrJywgKCkgPT4gewogICAgY29uc3QgYXBwcm92ZSA9IG1ldGhvZChzZXJ2aWNlLCAnYXBwcm92ZScpOwogICAgY29uc3QgdHggPSB0cmFuc2FjdGlvbmFsT2Yoc2VydmljZSwgYXBwcm92ZSk7CiAgICBjb25zdCBzb3VyY2UgPSBub1N0cmluZ3Mod2l0aEhlbHBlcnMoc2VydmljZSwgYXBwcm92ZSkpOwogICAgLy8gVGhlIHJlZnVzYWwgbXVzdCBzdGlsbCByZWFjaCB0aGUgY2FsbGVyICg0MjIpOiBhIGNhdGNoIGVpdGhlciByZXRocm93cywgb3IgbWFya3MgdGhlCiAgICAvLyB0cmFuc2FjdGlvbiByb2xsYmFjay1vbmx5IGFuZCB0aGUgZXhjZXB0aW9uIGlzIHRocm93biBhZ2FpbiBsYXRlciAoYHRocm93IHJlZnVzZWRgKS4KICAgIGNvbnN0IHJldGhyb3dzTGF0ZXIgPSAvXGJ0aHJvd1xzKyg/IW5ld1xiKVtcdy5bXF1dKy8udGVzdChzb3VyY2UpOwogICAgY29uc3Qgc3dhbGxvd2VkID0gY2F0Y2hCbG9ja3Moc291cmNlKS5zb21lKAogICAgICAoYykgPT4KICAgICAgICBCVURHRVQudGVzdChjLnR5cGVzKSAmJgogICAgICAgICEvXGJ0aHJvd1xiLy50ZXN0KGMuYmxvY2spICYmCiAgICAgICAgISgvc2V0Um9sbGJhY2tPbmx5XHMqXCgvLnRlc3QoYy5ibG9jaykgJiYgcmV0aHJvd3NMYXRlciksCiAgICApOwogICAgY2hlY2soCiAgICAgICFpc1JlYWRPbmx5KHR4KSAmJgogICAgICAgICFzd2FsbG93ZWQgJiYKICAgICAgICAoKG9wZW5zVHJhbnNhY3Rpb24odHgpICYmIHJvbGxzQmFja09uQnVkZ2V0KHR4Py50ZXh0ID8/ICcnKSkgfHwgL3NldFJvbGxiYWNrT25seVxzKlwoLy50ZXN0KHNvdXJjZSkpLAogICAgICAnTG9va2VkIGF0IEFwcHJvdmFsU2VydmljZS5hcHByb3ZlKCkgYW5kIHRoZSB0cmFuc2FjdGlvbiBpdCBydW5zIGluLicsCiAgICApOwogIH0pOwp9KTsKCmRlc2NyaWJlKCdiYXRjaCBhcHByb3ZhbCcsICgpID0+IHsKICBjb25zdCBhcHByb3ZlQmF0Y2ggPSBtZXRob2Qoc2VydmljZSwgJ2FwcHJvdmVCYXRjaCcpOwogIGNvbnN0IGJhdGNoID0gbm9TdHJpbmdzKHdpdGhIZWxwZXJzKHNlcnZpY2UsIGFwcHJvdmVCYXRjaCkpOwogIGNvbnN0IGJhdGNoVHggPSB0cmFuc2FjdGlvbmFsT2Yoc2VydmljZSwgYXBwcm92ZUJhdGNoKTsKCiAgLyoqCiAgICogTWV0aG9kcyBvZiBpbmplY3RlZCBiZWFucyAoYW5vdGhlciBvbmUsIHRoaXMgc2VydmljZSBpdHNlbGYsIHRocm91Z2ggYW4gaW50ZXJmYWNlIG9yIGFuCiAgICogT2JqZWN0UHJvdmlkZXIpIHRoYXQgdGhlIGJhdGNoIGNhbGxzLgogICAqLwogIGNvbnN0IGludm9rZWQgPSBzZXJ2aWNlLmZpZWxkcy5mbGF0TWFwKChmKSA9PgogICAgYmVhbnNGb3IoZi50eXBlKS5mbGF0TWFwKChiZWFuKSA9PgogICAgICBiZWFuLm1ldGhvZHMuZmlsdGVyKChtKSA9PiBjYWxsc1Rocm91Z2goYmF0Y2gsIGYubmFtZSwgbS5uYW1lKSkubWFwKChtKSA9PiAoeyBiZWFuLCBtZXRob2Q6IG0gfSkpLAogICAgKSwKICApOwogIC8qKgogICAqIFRob3NlIHRoYXQgZ28gdGhyb3VnaCB0aGUgYmVhbidzIFNwcmluZyBwcm94eSBhbmQgc3RhcnQgYSB0cmFuc2FjdGlvbiBvZiB0aGVpciBvd24uIChBIGNhbGwgb24KICAgKiBgdGhpc2AgYnlwYXNzZXMgdGhlIHByb3h5LCBhbmQgYSBwcml2YXRlIG1ldGhvZCBpc24ndCBwcm94aWVkLikKICAgKi8KICBjb25zdCBwcm94aWVkID0gaW52b2tlZC5maWx0ZXIoKHsgYmVhbiwgbWV0aG9kOiBtIH0pID0+IHsKICAgIGNvbnN0IHR4ID0gdHJhbnNhY3Rpb25hbE9mKGJlYW4sIG0pOwogICAgcmV0dXJuICgKICAgICAgIW0ubW9kaWZpZXJzLmluY2x1ZGVzKCdwcml2YXRlJykgJiYKICAgICAgIW0ubW9kaWZpZXJzLmluY2x1ZGVzKCdzdGF0aWMnKSAmJgogICAgICBvcGVuc1RyYW5zYWN0aW9uKHR4KSAmJgogICAgICAoL1JFUVVJUkVTX05FVy8udGVzdCh0eD8udGV4dCA/PyAnJykgfHwgb3V0c2lkZVRyYW5zYWN0aW9uKGJhdGNoVHgpKQogICAgKTsKICB9KTsKICAvLyBBIHRlbXBsYXRlIHRoYXQgaXMgUkVRVUlSRUQgKFNwcmluZyBCb290J3Mgb3duKSBqb2lucyB0aGUgYmF0Y2gncyB0cmFuc2FjdGlvbiBpZiBpdCBoYXMgb25lLgogIGNvbnN0IHVzZWRUZW1wbGF0ZXMgPSB0ZW1wbGF0ZXMuZmlsdGVyKCh0KSA9PiB1c2VzVGVtcGxhdGUoYmF0Y2gsIHQpKTsKICBjb25zdCB2aWFUZW1wbGF0ZSA9IHVzZWRUZW1wbGF0ZXMuc29tZSgodCkgPT4gIXQucmVhZE9ubHkgJiYgKHQucmVxdWlyZXNOZXcgfHwgb3V0c2lkZVRyYW5zYWN0aW9uKGJhdGNoVHgpKSk7CiAgLy8gT3IgdGhlIHRyYW5zYWN0aW9uIG1hbmFnZXIgZGlyZWN0bHk6IGdldFRyYW5zYWN0aW9uKC4uLikgd2l0aCBhIFJFUVVJUkVTX05FVyBkZWZpbml0aW9uLgogIGNvbnN0IHZpYU1hbmFnZXIgPQogICAgL1wuXHMqZ2V0VHJhbnNhY3Rpb25ccypcKC8udGVzdChiYXRjaCkgJiYKICAgIC9cLlxzKmNvbW1pdFxzKlwoLy50ZXN0KGJhdGNoKSAmJgogICAgKC9SRVFVSVJFU19ORVcvLnRlc3Qobm9TdHJpbmdzKHNlcnZpY2UudGV4dCkpIHx8IG91dHNpZGVUcmFuc2FjdGlvbihiYXRjaFR4KSk7CgogIGl0KCdlYWNoIFBPIGluIGEgYmF0Y2ggaXMgYXBwcm92ZWQgaW4gaXRzIG93biB0cmFuc2FjdGlvbicsICgpID0+IHsKICAgIGNoZWNrKAogICAgICB2aWFUZW1wbGF0ZSB8fCB2aWFNYW5hZ2VyIHx8IHByb3hpZWQubGVuZ3RoID4gMCwKICAgICAgJ0xvb2tlZCBhdCBBcHByb3ZhbFNlcnZpY2UuYXBwcm92ZUJhdGNoKCkgYW5kIGhvdyBpdCBzdGFydHMgZWFjaCBQTy4nLAogICAgKTsKICB9KTsKCiAgaXQoJ2EgUE8gdGhlIGJ1ZGdldCByZWZ1c2VzIGlzIHJvbGxlZCBiYWNrIG9uIGl0cyBvd24nLCAoKSA9PiB7CiAgICAvLyBXaGF0IHJ1bnMgZm9yIGVhY2ggUE86IHRoZSBiYXRjaCB3aXRoIGl0cyBoZWxwZXJzLCBhbmQgdGhlIGJlYW5zJyBtZXRob2RzIGl0IGNhbGxzLiAoV2hldGhlcgogICAgLy8gdGhlaXIgb3duIHRyYW5zYWN0aW9uIHJlYWxseSBzdGFydHMgaXMgdGhlIGNoZWNrIGFib3ZlLikKICAgIGNvbnN0IHVuaXRzID0gWy4uLmhlbHBlcnNPZihzZXJ2aWNlLCBhcHByb3ZlQmF0Y2gpLm1hcCgobSkgPT4gKHsgYmVhbjogc2VydmljZSwgbWV0aG9kOiBtIH0pKSwgLi4uaW52b2tlZF07CiAgICBjb25zdCBwZXJQbyA9IFtiYXRjaCwgLi4uaW52b2tlZC5tYXAoKHUpID0+IG5vU3RyaW5ncyh3aXRoSGVscGVycyh1LmJlYW4sIHUubWV0aG9kKSkpXS5qb2luKCdcbicpOwogICAgLy8gSW4gYSB0ZW1wbGF0ZSdzIGNhbGxiYWNrLCB3cmFwcGluZyB0aGUgY2hlY2tlZCBleGNlcHRpb24gaW4gYW4gdW5jaGVja2VkIG9uZSByb2xscyBiYWNrIHRvby4KICAgIGNvbnN0IHdyYXBzSW5UZW1wbGF0ZSA9CiAgICAgIHVzZWRUZW1wbGF0ZXMubGVuZ3RoID4gMCAmJgogICAgICBjYXRjaEJsb2NrcyhwZXJQbykuc29tZSgoYykgPT4gL0J1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uLy50ZXN0KGMudHlwZXMpICYmIC9cYnRocm93XHMrbmV3XGIvLnRlc3QoYy5ibG9jaykpOwogICAgY2hlY2soCiAgICAgIC9zZXRSb2xsYmFja09ubHlccypcKFxzKlwpLy50ZXN0KHBlclBvKSB8fAogICAgICAgICh2aWFNYW5hZ2VyICYmIC9cLlxzKnJvbGxiYWNrXHMqXCgvLnRlc3QocGVyUG8pKSB8fAogICAgICAgIHdyYXBzSW5UZW1wbGF0ZSB8fAogICAgICAgIHVuaXRzLnNvbWUoKHUpID0+IHJvbGxzQmFja09uQnVkZ2V0KHRyYW5zYWN0aW9uYWxPZih1LmJlYW4sIHUubWV0aG9kKT8udGV4dCA/PyAnJykpLAogICAgICAnTG9va2VkIGF0IHRoZSBwZXItUE8gdW5pdCBvZiB3b3JrIG9mIEFwcHJvdmFsU2VydmljZS5hcHByb3ZlQmF0Y2goKS4nLAogICAgKTsKICB9KTsKCiAgaXQoImEgUE8gdGhhdCBjYW4ndCBiZSBhcHByb3ZlZCAoYWxyZWFkeSBkZWNpZGVkLCB1bmtub3duLCBjaGFuZ2VkIG1lYW53aGlsZSkgZG9lc24ndCBzdG9wIHRoZSBvdGhlcnMiLCAoKSA9PiB7CiAgICAvLyBDYXVnaHQgZm9yIGVhY2ggUE8sIGluc2lkZSB0aGUgbG9vcDogYW4gYWxyZWFkeS1kZWNpZGVkIFBPIChJbGxlZ2FsU3RhdGVFeGNlcHRpb24pLCBhbiB1bmtub3duCiAgICAvLyBvbmUgKFBvTm90Rm91bmRFeGNlcHRpb24pIGFuZCBhIGNvbmN1cnJlbnQgY2hhbmdlIChvcHRpbWlzdGljIGxvY2tpbmcpLgogICAgY29uc3QgY2F1Z2h0ID0gbG9vcEJvZGllcyhiYXRjaCkKICAgICAgLmZsYXRNYXAoKGIpID0+IGNhdGNoQmxvY2tzKGIpLm1hcCgoYykgPT4gYy50eXBlcykpCiAgICAgIC5qb2luKCcgJyk7CiAgICBjb25zdCBjb3ZlcnMgPSAobmFtZXM6IHN0cmluZykgPT4gbmV3IFJlZ0V4cChgXFxiKCR7bmFtZXN9fFJ1bnRpbWVFeGNlcHRpb258RXhjZXB0aW9ufFRocm93YWJsZSlcXGJgKS50ZXN0KGNhdWdodCk7CiAgICBjaGVjaygKICAgICAgY292ZXJzKCdJbGxlZ2FsU3RhdGVFeGNlcHRpb24nKSAmJgogICAgICAgIGNvdmVycygnUG9Ob3RGb3VuZEV4Y2VwdGlvbicpICYmCiAgICAgICAgY292ZXJzKAogICAgICAgICAgJ09wdGltaXN0aWNMb2NraW5nRmFpbHVyZUV4Y2VwdGlvbnxPYmplY3RPcHRpbWlzdGljTG9ja2luZ0ZhaWx1cmVFeGNlcHRpb258Q29uY3VycmVuY3lGYWlsdXJlRXhjZXB0aW9ufFRyYW5zaWVudERhdGFBY2Nlc3NFeGNlcHRpb258RGF0YUFjY2Vzc0V4Y2VwdGlvbicsCiAgICAgICAgKSwKICAgICAgJ0xvb2tlZCBhdCB3aGF0IEFwcHJvdmFsU2VydmljZS5hcHByb3ZlQmF0Y2goKSBjYXRjaGVzIGZvciBlYWNoIFBPLCBpbnNpZGUgaXRzIGxvb3AuJywKICAgICk7CiAgfSk7Cn0pOwo=', 'base64'), 'UTF8'), true, 17),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'checks/approvals.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsKICBhbm5vdGF0aW9uLAogIGJvZHksCiAgY2hlY2ssCiAgY29kZSwKICBjb25kaXRpb25zVGhhdFRocm93LAogIGxvY2tzUm93LAogIG1ldGhvZCwKICBub1N0cmluZ3MsCiAgd2l0aEhlbHBlcnMsCn0gZnJvbSAnLi9zdXBwb3J0L2phdmEnOwoKY29uc3QgeyBzZXJ2aWNlLCBwdXJjaGFzZU9yZGVyLCBvcmRlcnMsIGlkZW1wb3RlbmN5LCBpZGVtcG90ZW5jeVJlY29yZCwgaGFuZGxlciB9ID0gY29kZTsKY29uc3QgYXBwcm92ZU1ldGhvZCA9IG1ldGhvZChzZXJ2aWNlLCAnYXBwcm92ZScpOwovKiogYXBwcm92ZSgpIHdpdGggaXRzIGhlbHBlcnMsIGFzIGNvZGUgKHN0cmluZyBjb250ZW50cyBibGFua2VkKSBhbmQgYXMgd3JpdHRlbi4gKi8KY29uc3QgYXBwcm92ZSA9IG5vU3RyaW5ncyh3aXRoSGVscGVycyhzZXJ2aWNlLCBhcHByb3ZlTWV0aG9kKSk7CmNvbnN0IGFwcHJvdmVUZXh0ID0gd2l0aEhlbHBlcnMoc2VydmljZSwgYXBwcm92ZU1ldGhvZCk7CgovKiogVGhlIGNvbHVtbiBvZiBhbiBJZGVtcG90ZW5jeVJlY29yZCBmaWVsZDogaXRzIEBDb2x1bW4gbmFtZSwgb3IgdGhlIGZpZWxkJ3MgbmFtZS4gKi8KY29uc3QgY29sdW1uT2YgPSAoZmllbGQ6IHN0cmluZykgPT4gewogIGNvbnN0IGYgPSBpZGVtcG90ZW5jeVJlY29yZC5maWVsZHMuZmluZCgoeCkgPT4geC5uYW1lID09PSBmaWVsZCk7CiAgcmV0dXJuIChmICYmIC9uYW1lXHMqPVxzKiIoW14iXSspIi8uZXhlYyhhbm5vdGF0aW9uKGYsICdDb2x1bW4nKT8udGV4dCA/PyAnJyk/LlsxXSkgPz8gZmllbGQ7Cn07CmNvbnN0IGlzQXBwcm92ZXIgPSAoY29sdW1uOiBzdHJpbmcpID0+IC9hcHByb3Zlci9pLnRlc3QoY29sdW1uKTsKY29uc3QgaXNLZXkgPSAoY29sdW1uOiBzdHJpbmcpID0+IC9rZXkvaS50ZXN0KGNvbHVtbikgJiYgIWlzQXBwcm92ZXIoY29sdW1uKTsKCi8qKiBDb2x1bW4gc2V0cyB0aGF0IGFyZSB1bmlxdWU6IHVuaXF1ZSBjb25zdHJhaW50cywgdW5pcXVlIGluZGV4ZXMsIGEgY29tcG9zaXRlIHByaW1hcnkga2V5LiAqLwpmdW5jdGlvbiB1bmlxdWVDb2x1bW5TZXRzKCk6IHN0cmluZ1tdW10gewogIGNvbnN0IHRhYmxlID0gYW5ub3RhdGlvbihpZGVtcG90ZW5jeVJlY29yZCwgJ1RhYmxlJyk/LnRleHQgPz8gJyc7CiAgY29uc3QgbmFtZXMgPSAobGlzdDogc3RyaW5nKSA9PiBbLi4ubGlzdC5tYXRjaEFsbCgvIihbXiJdKikiL2cpXS5mbGF0TWFwKChtKSA9PiAobVsxXSA/PyAnJykuc3BsaXQoJywnKSk7CiAgY29uc3QgY2xlYW4gPSAoY29sczogc3RyaW5nW10pID0+IGNvbHMubWFwKChjKSA9PiBjLnRyaW0oKS5yZXBsYWNlKC9ccysoYXNjfGRlc2MpJC9pLCAnJykpLmZpbHRlcihCb29sZWFuKTsKICBjb25zdCBzZXRzID0gWwogICAgLi4uWy4uLnRhYmxlLm1hdGNoQWxsKC9AVW5pcXVlQ29uc3RyYWludFxzKlwoKFteKV0qKVwpL2cpXS5tYXAoKG0pID0+CiAgICAgIGNsZWFuKG5hbWVzKC9jb2x1bW5OYW1lc1xzKj1ccyooXHtbXn1dKlx9fCJbXiJdKiIpLy5leGVjKG1bMV0gPz8gJycpPy5bMV0gPz8gJycpKSwKICAgICksCiAgICAuLi5bLi4udGFibGUubWF0Y2hBbGwoL0BJbmRleFxzKlwoKFteKV0qKVwpL2cpXQogICAgICAuZmlsdGVyKChtKSA9PiAvdW5pcXVlXHMqPVxzKnRydWUvLnRlc3QobVsxXSA/PyAnJykpCiAgICAgIC5tYXAoKG0pID0+IGNsZWFuKG5hbWVzKC9jb2x1bW5MaXN0XHMqPVxzKigiW14iXSoiKS8uZXhlYyhtWzFdID8/ICcnKT8uWzFdID8/ICcnKSkpLAogIF07CiAgLy8gQElkQ2xhc3M6IGV2ZXJ5IEBJZCBmaWVsZCBpcyBwYXJ0IG9mIHRoZSBwcmltYXJ5IGtleS4KICBjb25zdCBpZHMgPSBpZGVtcG90ZW5jeVJlY29yZC5maWVsZHMuZmlsdGVyKChmKSA9PiBhbm5vdGF0aW9uKGYsICdJZCcpKTsKICBpZiAoaWRzLmxlbmd0aCA+IDEpIHNldHMucHVzaChpZHMubWFwKChmKSA9PiBjb2x1bW5PZihmLm5hbWUpKSk7CiAgLy8gQEVtYmVkZGVkSWQ6IHRoZSBlbWJlZGRlZCBjbGFzcydzIGZpZWxkcy4KICBjb25zdCBlbWJlZGRlZCA9IGlkZW1wb3RlbmN5UmVjb3JkLmZpZWxkcy5maW5kKChmKSA9PiBhbm5vdGF0aW9uKGYsICdFbWJlZGRlZElkJykpOwogIGNvbnN0IGtleSA9IGVtYmVkZGVkICYmIGlkZW1wb3RlbmN5UmVjb3JkLnR5cGVzLmZpbmQoKHQpID0+IHQubmFtZSA9PT0gZW1iZWRkZWQudHlwZSk7CiAgaWYgKGtleSkgewogICAgc2V0cy5wdXNoKAogICAgICBrZXkuZmllbGRzLm1hcCgoZikgPT4gL25hbWVccyo9XHMqIihbXiJdKykiLy5leGVjKGFubm90YXRpb24oZiwgJ0NvbHVtbicpPy50ZXh0ID8/ICcnKT8uWzFdID8/IGYubmFtZSksCiAgICApOwogIH0KICBmb3IgKGNvbnN0IGYgb2YgaWRlbXBvdGVuY3lSZWNvcmQuZmllbGRzKSB7CiAgICBpZiAoL3VuaXF1ZVxzKj1ccyp0cnVlLy50ZXN0KGFubm90YXRpb24oZiwgJ0NvbHVtbicpPy50ZXh0ID8/ICcnKSkgc2V0cy5wdXNoKFtjb2x1bW5PZihmLm5hbWUpXSk7CiAgfQogIHJldHVybiBzZXRzOwp9CgovKiogUmVwb3NpdG9yeSBtZXRob2RzIHRoYXQgbG9jayB0aGUgUE8gcm93IGZvciB3cml0aW5nLiAqLwpjb25zdCBsb2NraW5nTWV0aG9kcyA9IG9yZGVycy5tZXRob2RzCiAgLmZpbHRlcigobSkgPT4gL1BFU1NJTUlTVElDX1dSSVRFLy50ZXN0KGFubm90YXRpb24obSwgJ0xvY2snKT8udGV4dCA/PyAnJykpCiAgLm1hcCgobSkgPT4gbS5uYW1lKTsKLyoqIGFwcHJvdmUoKSByZWFjaGVzIGEgbG9va3VwIHRoYXQgbG9ja3MgdGhlIHJvdyAoYSBsb2NrIHVzZWQgZWxzZXdoZXJlIGRvZXNuJ3QgcHJvdGVjdCBpdCkuICovCmNvbnN0IGFwcHJvdmVMb2NrcyA9IGxvY2tzUm93KGFwcHJvdmUsIGxvY2tpbmdNZXRob2RzKTsKY29uc3QgdmVyc2lvbmVkID0gcHVyY2hhc2VPcmRlci5maWVsZHMuc29tZSgoZikgPT4gYW5ub3RhdGlvbihmLCAnVmVyc2lvbicpKTsKCmRlc2NyaWJlKCdpZGVtcG90ZW5jeScsICgpID0+IHsKICBpdCgnYSBrZXkgaXMgdW5pcXVlIHBlciBhcHByb3ZlciBpbiB0aGUgZGF0YWJhc2UnLCAoKSA9PiB7CiAgICBjb25zdCBzZXRzID0gdW5pcXVlQ29sdW1uU2V0cygpOwogICAgY29uc3QgcGVyQXBwcm92ZXIgPSBzZXRzLnNvbWUoKHMpID0+IHMuc29tZShpc0FwcHJvdmVyKSAmJiBzLnNvbWUoaXNLZXkpKTsKICAgIC8vIEEga2V5IHVuaXF1ZSBvbiBpdHMgb3duIHdvdWxkIHJlZnVzZSB0d28gYXBwcm92ZXJzIHdobyBoYXBwZW4gdG8gZ2VuZXJhdGUgdGhlIHNhbWUga2V5LgogICAgY29uc3Qga2V5QWxvbmUgPSBzZXRzLnNvbWUoKHMpID0+IHMubGVuZ3RoID4gMCAmJiBzLmV2ZXJ5KGlzS2V5KSk7CiAgICBjaGVjayhwZXJBcHByb3ZlciAmJiAha2V5QWxvbmUsICdMb29rZWQgYXQgdGhlIHVuaXF1ZSBjb25zdHJhaW50cyBhbmQgdGhlIGlkIG9mIElkZW1wb3RlbmN5UmVjb3JkLicpOwogIH0pOwoKICBpdCgncmV0cmllcyB0aGF0IGFycml2ZSBhdCB0aGUgc2FtZSB0aW1lIGFyZSBhcHBsaWVkIG9uY2UnLCAoKSA9PiB7CiAgICBjb25zdCBiZWZvcmUgPSAoc291cmNlOiBzdHJpbmcsIG5lZWRsZTogUmVnRXhwKSA9PiB7CiAgICAgIGNvbnN0IGFwcGxpZWQgPSBzb3VyY2UuaW5kZXhPZigncmVjb3JkQXBwcm92YWwnKTsKICAgICAgY29uc3QgbSA9IG5lZWRsZS5leGVjKHNvdXJjZSk7CiAgICAgIHJldHVybiAhIW0gJiYgYXBwbGllZCA+PSAwICYmIG0uaW5kZXggPCBhcHBsaWVkOwogICAgfTsKICAgIGNvbnN0IGF0b21pY0luc2VydHMgPSBpZGVtcG90ZW5jeS5tZXRob2RzLmZpbHRlcigobSkgPT4gewogICAgICBjb25zdCBxID0gYW5ub3RhdGlvbihtLCAnUXVlcnknKT8udGV4dCA/PyAnJzsKICAgICAgcmV0dXJuIC9pbnNlcnRccytpbnRvL2kudGVzdChxKSAmJiAvb25ccytjb25mbGljdC9pLnRlc3QocSk7CiAgICB9KTsKICAgIGNvbnN0IGNsYWltc0ZpcnN0ID0gYXRvbWljSW5zZXJ0cy5zb21lKChtKSA9PiBiZWZvcmUoYXBwcm92ZSwgbmV3IFJlZ0V4cChgXFwuXFxzKiR7bS5uYW1lfVxccypcXChgKSkpOwogICAgLy8gVGhlIHNhbWUgaW5zZXJ0IHRocm91Z2ggdGhlIEVudGl0eU1hbmFnZXIgaW4gdGhlIHNlcnZpY2UuCiAgICBjb25zdCBjbGFpbXNJblNlcnZpY2UgPQogICAgICBiZWZvcmUoYXBwcm92ZVRleHQsIC9pbnNlcnRccytpbnRvW147XSo/b25ccytjb25mbGljdC9pKSAmJiAvXC5ccypleGVjdXRlVXBkYXRlXHMqXCgvLnRlc3QoYXBwcm92ZSk7CiAgICBjb25zdCBmbHVzaGVkRmlyc3QgPQogICAgICBiZWZvcmUoYXBwcm92ZSwgL1wuXHMqc2F2ZUFuZEZsdXNoXHMqXCgvKSB8fAogICAgICAoYmVmb3JlKGFwcHJvdmUsIC9cLlxzKnNhdmVccypcKC8pICYmIGJlZm9yZShhcHByb3ZlLCAvXC5ccypmbHVzaFxzKlwoXHMqXCkvKSk7CiAgICBjb25zdCBpbnNlcnRzRmlyc3QgPSBmbHVzaGVkRmlyc3QgJiYgL0RhdGFJbnRlZ3JpdHlWaW9sYXRpb25FeGNlcHRpb24vLnRlc3Qobm9TdHJpbmdzKHNlcnZpY2UudGV4dCkpOwogICAgY2hlY2soCiAgICAgIGNsYWltc0ZpcnN0IHx8IGNsYWltc0luU2VydmljZSB8fCBpbnNlcnRzRmlyc3QsCiAgICAgICdMb29rZWQgYXQgQXBwcm92YWxTZXJ2aWNlLmFwcHJvdmUoKSBhbmQgSWRlbXBvdGVuY3lSZWNvcmRSZXBvc2l0b3J5LicsCiAgICApOwogIH0pOwoKICBpdCgnYSBrZXkgaXMgbG9va2VkIHVwIGZvciBpdHMgb3duIGFwcHJvdmVyIG9ubHknLCAoKSA9PiB7CiAgICBjb25zdCBmaW5kZXIgPQogICAgICBpZGVtcG90ZW5jeS5tZXRob2RzLmZpbmQoKG0pID0+IC9hcHByb3Zlci9pLnRlc3QobS5uYW1lKSAmJiAva2V5L2kudGVzdChtLm5hbWUpKSA/PwogICAgICBpZGVtcG90ZW5jeS5tZXRob2RzLmZpbmQoKG0pID0+IC9zZWxlY3RbXHNcU10qYXBwcm92ZXIvaS50ZXN0KGFubm90YXRpb24obSwgJ1F1ZXJ5Jyk/LnRleHQgPz8gJycpKTsKICAgIGNoZWNrKAogICAgICAhIWZpbmRlciAmJiBuZXcgUmVnRXhwKGBcXC5cXHMqJHtmaW5kZXIubmFtZX1cXHMqXFwoYCkudGVzdChhcHByb3ZlKSwKICAgICAgJ0xvb2tlZCBhdCBob3cgQXBwcm92YWxTZXJ2aWNlLmFwcHJvdmUoKSBmaW5kcyBhbiBlYXJsaWVyIHJlcXVlc3Qgd2l0aCB0aGUgc2FtZSBrZXkuJywKICAgICk7CiAgfSk7CgogIGl0KCdyZXVzaW5nIGEga2V5IGZvciBhIGRpZmZlcmVudCBQTyBpcyByZWZ1c2VkJywgKCkgPT4gewogICAgLy8gVGhlIHN0b3JlZCBQTyBpZCwgcmVhZCBkaXJlY3RseSBvciBpbnRvIGEgbG9jYWwgdmFyaWFibGUgZmlyc3QuCiAgICBjb25zdCBzdG9yZWQgPSBbJyg/OmdldCk/W3BQXXVyY2hhc2VPcmRlcklkXFwoXFwpJ107CiAgICBmb3IgKGNvbnN0IG0gb2YgYXBwcm92ZS5tYXRjaEFsbCgvXGIoXHcrKVxzKj1ccypbXjs9XSooPzpnZXQpP1twUF11cmNoYXNlT3JkZXJJZFwoXClccyo7L2cpKSB7CiAgICAgIHN0b3JlZC5wdXNoKGBcXGIke21bMV19XFxiKD8hXFxzKlxcKClgKTsKICAgIH0KICAgIC8vIC4uLiBjb21wYXJlZCBhcyBkaWZmZXJlbnQsIGluIGEgY29uZGl0aW9uIHdob3NlIGJyYW5jaCB0aHJvd3MgLi4uCiAgICBjb25zdCBkaWZmZXJzID0gKGM6IHN0cmluZykgPT4KICAgICAgc3RvcmVkLnNvbWUoKHMpID0+CiAgICAgICAgbmV3IFJlZ0V4cCgKICAgICAgICAgIGAke3N9XFxzKiE9fCE9XFxzKltcXHcuKCldKiR7c318IVxccypbXFx3LigpXSoke3N9XFxzKlxcKT9cXHMqXFwuZXF1YWxzfCFcXHMqW1xcdy5dKmVxdWFsc1xccypcXChbXjtdKiR7c31gLAogICAgICAgICkudGVzdChjKSwKICAgICAgKTsKICAgIGNvbnN0IHJlZnVzZWRJbkJyYW5jaCA9IGNvbmRpdGlvbnNUaGF0VGhyb3coYXBwcm92ZSkuc29tZShkaWZmZXJzKTsKICAgIC8vIC4uLiBvciB0aGUgc2FtZSBvbmUgcmV0dXJucyBlYXJseSBhbmQgZXZlcnl0aGluZyBlbHNlIHRocm93cyAuLi4KICAgIGNvbnN0IHNhbWVSZXR1cm5zRWxzZVRocm93cyA9IHN0b3JlZC5zb21lKChzKSA9PgogICAgICBuZXcgUmVnRXhwKGBpZlxccypcXChbXjt7XSooJHtzfVxccyo9PXw9PVxccypbXFx3LigpXSoke3N9fCR7c31cXHMqXFwpP1xccypcXC5lcXVhbHMpW147e10qXFwpXFxzKlxcez9cXHMqcmV0dXJuXFxiW147XSo7XFxzKlxcfT9cXHMqdGhyb3dcXHMrbmV3XFxiYCkudGVzdChhcHByb3ZlKSwKICAgICk7CiAgICAvLyAuLi4gb3IgT3B0aW9uYWwuZmlsdGVyKHNhbWUgUE8pLm9yRWxzZVRocm93KCgpIC0+IG5ldyAuLi4pLgogICAgY29uc3QgZmlsdGVyZWQgPSBzdG9yZWQuc29tZSgocykgPT4KICAgICAgbmV3IFJlZ0V4cChgXFwuXFxzKmZpbHRlclxccypcXChbXjtdKiR7c31bXjtdKlxcKVxccypcXC5cXHMqb3JFbHNlVGhyb3dcXHMqXFwoXFxzKihcXChcXHMqXFwpXFxzKi0+fFxcdys6Om5ldylgKS50ZXN0KGFwcHJvdmUpLAogICAgKTsKICAgIGNoZWNrKAogICAgICByZWZ1c2VkSW5CcmFuY2ggfHwgc2FtZVJldHVybnNFbHNlVGhyb3dzIHx8IGZpbHRlcmVkLAogICAgICAnTG9va2VkIGF0IEFwcHJvdmFsU2VydmljZS5hcHByb3ZlKCkgd2hlbiB0aGUga2V5IHdhcyB1c2VkIGJlZm9yZS4nLAogICAgKTsKICB9KTsKfSk7CgpkZXNjcmliZSgnYXBwcm92ZXJzJywgKCkgPT4gewogIGNvbnN0IHJlY29yZCA9IG1ldGhvZChwdXJjaGFzZU9yZGVyLCAncmVjb3JkQXBwcm92YWwnKTsKICBjb25zdCByZWNvcmRCb2R5ID0gbm9TdHJpbmdzKHdpdGhIZWxwZXJzKHB1cmNoYXNlT3JkZXIsIHJlY29yZCkpOwoKICBpdCgnYSBQTyByZW1lbWJlcnMgd2hvIGFwcHJvdmVkIGl0JywgKCkgPT4gewogICAgY29uc3QgYXBwcm92ZXIgPSByZWNvcmQucGFyYW1zWzBdPy5uYW1lID8/ICcnOwogICAgLy8gQSBwZXJzaXN0ZW50IGNvbGxlY3Rpb24gdGhlIGFwcHJvdmVyJ3MgaWQgaXMgYWRkZWQgdG8gKG5vdCwgc2F5LCB0aGUgUE8ncyBsaW5lcykuCiAgICBjb25zdCByZW1lbWJlcnMgPSBwdXJjaGFzZU9yZGVyLmZpZWxkcy5zb21lKAogICAgICAoZikgPT4KICAgICAgICAvXihTZXR8TGlzdHxDb2xsZWN0aW9ufEhhc2hTZXR8TGlua2VkSGFzaFNldHxBcnJheUxpc3R8TWFwfEhhc2hNYXB8TGlua2VkSGFzaE1hcClccyo8Ly50ZXN0KGYudHlwZSkgJiYKICAgICAgICBbJ0VsZW1lbnRDb2xsZWN0aW9uJywgJ09uZVRvTWFueScsICdNYW55VG9NYW55J10uc29tZSgoYSkgPT4gYW5ub3RhdGlvbihmLCBhKSkgJiYKICAgICAgICAhIWFwcHJvdmVyICYmCiAgICAgICAgbmV3IFJlZ0V4cCgKICAgICAgICAgIGBcXGIke2YubmFtZX1cXHMqXFwuXFxzKihhZGR8cHV0fHB1dElmQWJzZW50fGNvbXB1dGVJZkFic2VudHxtZXJnZSlcXHMqXFwoXFxzKiR7YXBwcm92ZXJ9XFxiYCwKICAgICAgICApLnRlc3QocmVjb3JkQm9keSksCiAgICApOwogICAgY2hlY2soCiAgICAgIHJlbWVtYmVycyAmJiAvcmVjb3JkQXBwcm92YWxccypcKFxzKlx3Ly50ZXN0KG5vU3RyaW5ncyhzZXJ2aWNlLnRleHQpKSwKICAgICAgJ0xvb2tlZCBhdCBQdXJjaGFzZU9yZGVyLnJlY29yZEFwcHJvdmFsKCksIGl0cyBmaWVsZHMsIGFuZCBob3cgQXBwcm92YWxTZXJ2aWNlIGNhbGxzIGl0LicsCiAgICApOwogIH0pOwoKICBpdCgidGhlIHNhbWUgcGVyc29uIGNhbid0IGdpdmUgYm90aCBhcHByb3ZhbHMgb2YgYSBQTyIsICgpID0+IHsKICAgIC8vIFRoZSByZXBlYXQgaXRzZWxmIG11c3QgYmUgcmVmdXNlZDogYGlmICghYXBwcm92ZXJzLmFkZChpZCkpIHRocm93YCwgYGlmIChhcHByb3ZlcnMuY29udGFpbnMoaWQpKQogICAgLy8gdGhyb3dgIG9yIEFzc2VydC5zdGF0ZShhcHByb3ZlcnMuYWRkKGlkKSwgLi4uKSwgbm90IGp1c3Qgc29tZSBvdGhlciB0aHJvdyBpbiB0aGUgbWV0aG9kLgogICAgY29uc3QgcmVmdXNlc1JlcGVhdCA9CiAgICAgIGNvbmRpdGlvbnNUaGF0VGhyb3cocmVjb3JkQm9keSkuc29tZSgKICAgICAgICAoYykgPT4KICAgICAgICAgIC8hXHMqW1x3Ll0rXHMqXC5ccyphZGRccypcKC8udGVzdChjKSB8fAogICAgICAgICAgLyg/PCFbIVx3LiRdXHMqKVxiW1x3Ll0qXC4oY29udGFpbnN8Y29udGFpbnNLZXkpXHMqXCgvLnRlc3QoYykgfHwKICAgICAgICAgIC9cLlxzKnB1dElmQWJzZW50XHMqXChbXjtdKlwpXHMqIT1ccypudWxsLy50ZXN0KGMpLAogICAgICApIHx8IC9Bc3NlcnRcLnN0YXRlXHMqXChccyooW1x3Ll0rXHMqXC5ccyphZGRccypcKHwhXHMqW1x3Ll0rXHMqXC5ccypjb250YWlucyhLZXkpP1xzKlwoKS8udGVzdChyZWNvcmRCb2R5KTsKICAgIGNoZWNrKHJlZnVzZXNSZXBlYXQsICdMb29rZWQgYXQgUHVyY2hhc2VPcmRlci5yZWNvcmRBcHByb3ZhbCgpLicpOwogIH0pOwoKICBpdCgidHdvIHBlb3BsZSBhcHByb3ZpbmcgYXQgdGhlIHNhbWUgbW9tZW50IGNhbid0IG92ZXJ3cml0ZSBlYWNoIG90aGVyJ3MgYXBwcm92YWwiLCAoKSA9PiB7CiAgICBjaGVjayh2ZXJzaW9uZWQgfHwgYXBwcm92ZUxvY2tzLCAnTG9va2VkIGF0IFB1cmNoYXNlT3JkZXIgYW5kIGhvdyBBcHByb3ZhbFNlcnZpY2UuYXBwcm92ZSgpIGxvYWRzIGl0LicpOwogIH0pOwoKICBpdCgnYSBjb25jdXJyZW50IGNoYW5nZSBpcyBhbnN3ZXJlZCB3aXRoIDQwOSBDb25mbGljdCcsICgpID0+IHsKICAgIGNvbnN0IG1hcHBlZCA9IGhhbmRsZXIubWV0aG9kcy5zb21lKAogICAgICAobSkgPT4KICAgICAgICAvT3B0aW1pc3RpY0xvY2t8Q29uY3VycmVuY3lGYWlsdXJlfFN0YWxlT2JqZWN0U3RhdGV8U3RhbGVTdGF0ZS8udGVzdCgKICAgICAgICAgIGFubm90YXRpb24obSwgJ0V4Y2VwdGlvbkhhbmRsZXInKT8udGV4dCA/PyBtLnRleHQsCiAgICAgICAgKSAmJiAvQ09ORkxJQ1R8NDA5Ly50ZXN0KGAke2JvZHkobSl9ICR7YW5ub3RhdGlvbihtLCAnUmVzcG9uc2VTdGF0dXMnKT8udGV4dCA/PyAnJ31gKSwKICAgICk7CiAgICBjaGVjaygodmVyc2lvbmVkICYmIG1hcHBlZCkgfHwgKCF2ZXJzaW9uZWQgJiYgYXBwcm92ZUxvY2tzKSwgJ0xvb2tlZCBhdCBBcGlFeGNlcHRpb25IYW5kbGVyLicpOwogIH0pOwp9KTsK', 'base64'), 'UTF8'), true, 18),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'checks/invoices.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsKICBhbm5vdGF0aW9uLAogIGJvZHksCiAgY2hlY2ssCiAgY29kZSwKICBoZWxwZXJzT2YsCiAgbWV0aG9kLAogIG5vU3RyaW5ncywKICB0ZW1wbGF0ZXNPZiwKICB1c2VzVGVtcGxhdGUsCiAgd2l0aEhlbHBlcnMsCn0gZnJvbSAnLi9zdXBwb3J0L2phdmEnOwoKY29uc3QgeyBtYXRjaGVyLCBjb250cm9sbGVyLCBvcmRlcnMsIHNlcnZpY2UgfSA9IGNvZGU7CmNvbnN0IG1hdGNoTWV0aG9kID0gbWV0aG9kKG1hdGNoZXIsICdtYXRjaCcpOwovKiogbWF0Y2goKSB3aXRoIGl0cyBoZWxwZXJzIHdyaXR0ZW4gaW4sIHN0cmluZyBjb250ZW50cyBibGFua2VkLiAqLwpjb25zdCBtYXRjaCA9IG5vU3RyaW5ncyh3aXRoSGVscGVycyhtYXRjaGVyLCBtYXRjaE1ldGhvZCkpOwoKZGVzY3JpYmUoJ2ludm9pY2UgbWF0Y2hpbmcnLCAoKSA9PiB7CiAgaXQoJ2Ftb3VudHMgYXJlIGNvbXBhcmVkIGJ5IHZhbHVlLCB3aGF0ZXZlciB0aGVpciBzY2FsZSAoMTUwMC4wID0gMTUwMC4wMCknLCAoKSA9PiB7CiAgICBjb25zdCBhbW91bnQgPSAnW1xcdy5dKihnZXRUb3RhbHxnZXRVbml0UHJpY2V8YW1vdW50fHVuaXRQcmljZSlcXChcXCknOwogICAgLy8gQmlnRGVjaW1hbC5lcXVhbHMgY29tcGFyZXMgdGhlIHNjYWxlIHRvbzogYS5lcXVhbHMoYiksIGIuZXF1YWxzKGEpLCBPYmplY3RzLmVxdWFscyhhLCBiKSwKICAgIC8vIGFsc28gaW4gYSBoZWxwZXIgdGhhdCB0YWtlcyBCaWdEZWNpbWFscy4KICAgIGNvbnN0IHNjYWxlU2Vuc2l0aXZlID0KICAgICAgbmV3IFJlZ0V4cChgJHthbW91bnR9XFxzKlxcLmVxdWFsc1xcKGApLnRlc3QobWF0Y2gpIHx8CiAgICAgIG5ldyBSZWdFeHAoYFxcLmVxdWFsc1xcKFxccyoke2Ftb3VudH1cXHMqXFwpYCkudGVzdChtYXRjaCkgfHwKICAgICAgbmV3IFJlZ0V4cChgT2JqZWN0c1xcLmVxdWFsc1xcKFxccyooJHthbW91bnR9fFteLDtdKixcXHMqJHthbW91bnR9KWApLnRlc3QobWF0Y2gpIHx8CiAgICAgIGhlbHBlcnNPZihtYXRjaGVyLCBtYXRjaE1ldGhvZCkuc29tZSgobSkgPT4KICAgICAgICBtLnBhcmFtcwogICAgICAgICAgLmZpbHRlcigocCkgPT4gL1xiQmlnRGVjaW1hbFxiLy50ZXN0KHAudHlwZSkpCiAgICAgICAgICAuc29tZSgocCkgPT4KICAgICAgICAgICAgbmV3IFJlZ0V4cCgKICAgICAgICAgICAgICBgXFxiJHtwLm5hbWV9XFxzKlxcLmVxdWFsc1xcKHxcXC5lcXVhbHNcXChcXHMqJHtwLm5hbWV9XFxzKlxcKXxPYmplY3RzXFwuZXF1YWxzXFwoW147XSpcXGIke3AubmFtZX1cXGJgLAogICAgICAgICAgICApLnRlc3Qobm9TdHJpbmdzKGJvZHkobSkpKSwKICAgICAgICAgICksCiAgICAgICk7CiAgICBjb25zdCBieVZhbHVlID0KICAgICAgL2NvbXBhcmVUb1xzKlwoLy50ZXN0KG1hdGNoKSB8fAogICAgICAvc3RyaXBUcmFpbGluZ1plcm9zXChcKVxzKlwuZXF1YWxzXChbXjtdKnN0cmlwVHJhaWxpbmdaZXJvc1woXCkvLnRlc3QobWF0Y2gpIHx8CiAgICAgIC9cLnN1YnRyYWN0XChbXjtdKlwpXHMqXC5zaWdudW1cKFwpLy50ZXN0KG1hdGNoKTsKICAgIGNoZWNrKCFzY2FsZVNlbnNpdGl2ZSAmJiBieVZhbHVlLCAnTG9va2VkIGF0IEludm9pY2VNYXRjaGVyLm1hdGNoKCkgYW5kIGl0cyBoZWxwZXJzLicpOwogIH0pOwoKICBpdCgncXVhbnRpdGllcyBvZiBhIFNLVSBzcGxpdCBvdmVyIHNldmVyYWwgaW52b2ljZSBsaW5lcyBhcmUgYWRkZWQgdXAnLCAoKSA9PiB7CiAgICAvLyBTdW1tZWQgcGVyIFNLVTogdGhlIHN0YXRlbWVudCB0aGF0IGFkZHMgdXAgcXVhbnRpdGllcyBpcyBrZXllZCBvciBmaWx0ZXJlZCBieSBTS1UuCiAgICBjb25zdCBzdW1taW5nID0KICAgICAgL1wubWVyZ2VcKHxcLmNvbXB1dGUoSWZQcmVzZW50fElmQWJzZW50KT9cKHxncm91cGluZ0J5fHN1bW1pbmdJbnR8c3VtbWluZ0xvbmd8Z2V0T3JEZWZhdWx0XCh8XC5zdW1cKFwpfFwrPXxcLnJlZHVjZVwofHRvTWFwXChbXjtdKig6OnN1bXw6OmFkZEV4YWN0fC0+XHMqXHcrXHMqXCtccypcdyspLzsKICAgIGNoZWNrKAogICAgICBtYXRjaC5zcGxpdCgnOycpLnNvbWUoKHN0YXRlbWVudCkgPT4gc3VtbWluZy50ZXN0KHN0YXRlbWVudCkgJiYgL3NrdS9pLnRlc3Qoc3RhdGVtZW50KSksCiAgICAgICdMb29rZWQgYXQgaG93IEludm9pY2VNYXRjaGVyLm1hdGNoKCkgY2hlY2tzIGludm9pY2VkIHF1YW50aXRpZXMuJywKICAgICk7CiAgfSk7CgogIGl0KCJtYXRjaGluZyBhbiBpbnZvaWNlIGxvYWRzIHRoZSBQTydzIGxpbmVzIChvcGVuLWluLXZpZXcgaXMgb2ZmKSIsICgpID0+IHsKICAgIGNvbnN0IG0gPSBtZXRob2QoY29udHJvbGxlciwgJ21hdGNoSW52b2ljZScpOwogICAgY29uc3QgYiA9IG5vU3RyaW5ncyh3aXRoSGVscGVycyhjb250cm9sbGVyLCBtKSk7CiAgICBjb25zdCBmZXRjaGVzTGluZXMgPSBvcmRlcnMubWV0aG9kcwogICAgICAuZmlsdGVyKChyKSA9PiBhbm5vdGF0aW9uKHIsICdFbnRpdHlHcmFwaCcpIHx8IC9qb2luXHMrZmV0Y2gvaS50ZXN0KGFubm90YXRpb24ociwgJ1F1ZXJ5Jyk/LnRleHQgPz8gJycpKQogICAgICAuc29tZSgocikgPT4gbmV3IFJlZ0V4cChgXFwuXFxzKiR7ci5uYW1lfVxccypcXChgKS50ZXN0KGIpKTsKICAgIGNvbnN0IHNlcnZpY2VGaWVsZCA9IGNvbnRyb2xsZXIuZmllbGRzLmZpbmQoKGYpID0+IGYudHlwZSA9PT0gc2VydmljZS5uYW1lKT8ubmFtZTsKICAgIGNvbnN0IHZpYVNlcnZpY2UgPSAhIXNlcnZpY2VGaWVsZCAmJiBuZXcgUmVnRXhwKGBcXGIke3NlcnZpY2VGaWVsZH1cXHMqXFwuXFxzKlxcdytcXHMqXFwoYCkudGVzdChiKTsKICAgIGNvbnN0IHRyYW5zYWN0aW9uYWwgPSAhIWFubm90YXRpb24obSwgJ1RyYW5zYWN0aW9uYWwnKSB8fCAhIWFubm90YXRpb24oY29udHJvbGxlciwgJ1RyYW5zYWN0aW9uYWwnKTsKICAgIGNvbnN0IGluVGVtcGxhdGUgPSB0ZW1wbGF0ZXNPZihjb250cm9sbGVyKS5zb21lKCh0KSA9PiB1c2VzVGVtcGxhdGUoYiwgdCkpOwogICAgY2hlY2soCiAgICAgIGZldGNoZXNMaW5lcyB8fCB2aWFTZXJ2aWNlIHx8IHRyYW5zYWN0aW9uYWwgfHwgaW5UZW1wbGF0ZSwKICAgICAgJ0xvb2tlZCBhdCBQdXJjaGFzZU9yZGVyQ29udHJvbGxlci5tYXRjaEludm9pY2UoKS4nLAogICAgKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 19),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'checks/inbox.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsKICBhbm5vdGF0aW9uLAogIGJvZHksCiAgY2FsbHMsCiAgY2hlY2ssCiAgY29kZSwKICBtZXRob2QsCiAgbm9TdHJpbmdzLAogIHNtYWxsQ29uc3RhbnRzLAogIHdpdGhDb25zdGFudHMsCiAgd2l0aEhlbHBlcnMsCn0gZnJvbSAnLi9zdXBwb3J0L2phdmEnOwoKY29uc3QgeyBjb250cm9sbGVyLCBvcmRlcnMsIHNlcnZpY2UgfSA9IGNvZGU7CmNvbnN0IGxpc3QgPSBtZXRob2QoY29udHJvbGxlciwgJ2xpc3QnKTsKLyoqIFRoZSBjb250cm9sbGVyJ3MgbGlzdCgpLCBhcyBjb2RlLCB3aXRoIGNvbnN0YW50cyBzdWNoIGFzIEZJUlNUX1BBR0UgPSAxIHJlYWQgYXMgdGhlaXIgdmFsdWUuICovCmNvbnN0IGxpc3RDb2RlID0gd2l0aENvbnN0YW50cyhub1N0cmluZ3Mod2l0aEhlbHBlcnMoY29udHJvbGxlciwgbGlzdCkpLCBzbWFsbENvbnN0YW50cyhjb250cm9sbGVyKSk7Ci8qKiBUaGUgaW5ib3gncyBjb2RlIGFzIHdyaXR0ZW46IHRoZSBjb250cm9sbGVyJ3MgbGlzdCgpIGFuZCB0aGUgc2VydmljZSdzIGxpc3QoKSB3aXRoIGl0cyBoZWxwZXJzLiAqLwpjb25zdCBpbmJveFRleHQgPSBgJHtib2R5KGxpc3QpfVxuJHt3aXRoSGVscGVycyhzZXJ2aWNlLCBtZXRob2Qoc2VydmljZSwgJ2xpc3QnKSl9YDsKY29uc3QgaW5ib3ggPSBub1N0cmluZ3MoaW5ib3hUZXh0KTsKLyoqIFRoZSByZXBvc2l0b3J5IG1ldGhvZHMgdGhlIGluYm94IGNhbGxzLiAqLwpjb25zdCBpbmJveFF1ZXJpZXMgPSBvcmRlcnMubWV0aG9kcy5maWx0ZXIoKG0pID0+IGNhbGxzKGluYm94LCBtLm5hbWUpKTsKY29uc3QgZmV0Y2hlc0xpbmVzID0gKG06ICh0eXBlb2Ygb3JkZXJzLm1ldGhvZHMpW251bWJlcl0pID0+CiAgISFhbm5vdGF0aW9uKG0sICdFbnRpdHlHcmFwaCcpIHx8IC9qb2luXHMrZmV0Y2gvaS50ZXN0KGFubm90YXRpb24obSwgJ1F1ZXJ5Jyk/LnRleHQgPz8gJycpOwoKZGVzY3JpYmUoJ2luYm94IHBhZ2luZycsICgpID0+IHsKICBpdCgncGFnZSAxIGlzIHRoZSBmaXJzdCBwYWdlJywgKCkgPT4gewogICAgY2hlY2soCiAgICAgIC9wYWdlXHMqLVxzKjEvLnRlc3QobGlzdENvZGUpICYmIC9QYWdlUmVxdWVzdFwub2ZccypcKC8udGVzdChsaXN0Q29kZSksCiAgICAgICdMb29rZWQgYXQgUHVyY2hhc2VPcmRlckNvbnRyb2xsZXIubGlzdCgpLicsCiAgICApOwogIH0pOwoKICBpdCgncGFnZSAwIGlzIHJlZnVzZWQnLCAoKSA9PiB7CiAgICAvLyBBIGNoZWNrIGluIHRoZSBtZXRob2QgKHRoZSBKVW5pdCB0ZXN0IGNhbGxzIGl0IGRpcmVjdGx5OyB0aGVyZSBpcyBubyBiZWFuIHZhbGlkYXRpb24gaGVyZSkuCiAgICBjaGVjaygKICAgICAgL3BhZ2Vccyo8XHMqMXxwYWdlXHMqPD1ccyowfDFccyo+XHMqcGFnZXwwXHMqPj1ccypwYWdlLy50ZXN0KGxpc3RDb2RlKSB8fAogICAgICAgIC9Bc3NlcnRcLmlzVHJ1ZVxzKlwoXHMqKHBhZ2Vccyo+PVxzKjF8cGFnZVxzKj5ccyowfDFccyo8PVxzKnBhZ2V8MFxzKjxccypwYWdlKVxiLy50ZXN0KGxpc3RDb2RlKSwKICAgICAgJ0xvb2tlZCBhdCBQdXJjaGFzZU9yZGVyQ29udHJvbGxlci5saXN0KCkuJywKICAgICk7CiAgfSk7CgogIGl0KCd0aGUgb3JkZXIgaXMgc3RhYmxlOiBuZXdlc3QgZmlyc3QsIHRpZXMgYnJva2VuIGJ5IGlkJywgKCkgPT4gewogICAgLy8gVGhlIFNvcnQncyBwcm9wZXJ0eSBuYW1lcyBhcmUgc3RyaW5ncywgc28gdGhpcyByZWFkcyB0aGUgY29kZSBhcyB3cml0dGVuLgogICAgY29uc3Qgd2hlcmUgPSBgJHtjb250cm9sbGVyLnRleHR9XG4ke2luYm94VGV4dH1gOwogICAgY29uc3QgbmV3ZXN0Rmlyc3QgPQogICAgICAvZGVzY1xzKlwoXHMqImNyZWF0ZWRBdCJccypcKS8udGVzdCh3aGVyZSkgfHwKICAgICAgL1xiREVTQ1xzKixccyoiY3JlYXRlZEF0Ii8udGVzdCh3aGVyZSkgfHwKICAgICAgL1NvcnRcLmJ5XHMqXChccyoiY3JlYXRlZEF0IlteO10qP1wpXHMqXC5ccypkZXNjZW5kaW5nXHMqXChcKS8udGVzdCh3aGVyZSkgfHwKICAgICAgL09yZGVyXC5ieVxzKlwoXHMqImNyZWF0ZWRBdCJccypcKVxzKlwuXHMqd2l0aFxzKlwoXHMqKFNvcnRcLik/KERpcmVjdGlvblwuKT9ERVNDLy50ZXN0KHdoZXJlKTsKICAgIGNvbnN0IGJ5U29ydCA9IG5ld2VzdEZpcnN0ICYmIC8iaWQiLy50ZXN0KHdoZXJlKTsKICAgIC8vIE9yIGluIHRoZSBxdWVyeSB0aGUgaW5ib3ggcnVucy4KICAgIGNvbnN0IGJ5UXVlcnkgPSBpbmJveFF1ZXJpZXMuc29tZSgKICAgICAgKG0pID0+CiAgICAgICAgL29yZGVyXHMrYnlccytbXHcuXSpjcmVhdGVkQXRccytkZXNjXHMqLFxzKltcdy5dKlxiaWRcYi9pLnRlc3QoYW5ub3RhdGlvbihtLCAnUXVlcnknKT8udGV4dCA/PyAnJykgfHwKICAgICAgICAvT3JkZXJCeUNyZWF0ZWRBdERlc2MoSWR8SWREZXNjfElkQXNjKVxiLy50ZXN0KG0ubmFtZSksCiAgICApOwogICAgY2hlY2soYnlTb3J0IHx8IGJ5UXVlcnksICdMb29rZWQgYXQgaG93IHRoZSBpbmJveCBpcyBzb3J0ZWQuJyk7CiAgfSk7CgogIGl0KCd0aGUgaW5ib3ggaXMgcGFnZWQgaW4gdGhlIGRhdGFiYXNlLCBub3QgaW4gbWVtb3J5JywgKCkgPT4gewogICAgY29uc3QgcGFnZWRGZXRjaCA9IGluYm94UXVlcmllcy5zb21lKChtKSA9PiBtLnBhcmFtcy5zb21lKChwKSA9PiAvXGJQYWdlYWJsZVxiLy50ZXN0KHAudHlwZSkpICYmIGZldGNoZXNMaW5lcyhtKSk7CiAgICAvLyBBIGZldGNoIGpvaW4gb2YgZXZlcnkgUE8gKG5vdCBsaW1pdGVkIHRvIG9uZSBwYWdlJ3MgaWRzKSwgcGFnZWQgYWZ0ZXJ3YXJkcy4KICAgIGNvbnN0IGZldGNoZXNFdmVyeXRoaW5nID0gaW5ib3hRdWVyaWVzLnNvbWUoCiAgICAgIChtKSA9PiBmZXRjaGVzTGluZXMobSkgJiYgIW0ucGFyYW1zLnNvbWUoKHApID0+IC9cYihQYWdlYWJsZXxDb2xsZWN0aW9ufExpc3R8U2V0fEl0ZXJhYmxlKVxifFxbXF0vLnRlc3QocC50eXBlKSksCiAgICApOwogICAgY29uc3QgaW5NZW1vcnkgPSAvXC5zdWJMaXN0XHMqXCh8XC5za2lwXHMqXCh8UGFnZWRMaXN0SG9sZGVyLy50ZXN0KGluYm94KSB8fCBmZXRjaGVzRXZlcnl0aGluZzsKICAgIGNoZWNrKCFwYWdlZEZldGNoICYmICFpbk1lbW9yeSwgJ0xvb2tlZCBhdCB0aGUgcXVlcmllcyB0aGUgaW5ib3ggcnVucyBhbmQgaG93IGl0IHBhZ2VzIHRoZW0uJyk7CiAgfSk7Cn0pOwo=', 'base64'), 'UTF8'), true, 20),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'checks/support/java.ts', 'typescript', convert_from(decode('LyoqCiAqIEhlbHBlcnMgZm9yIHRoZSBzdHJ1Y3R1cmUgY2hlY2tzLiBKYXZhIGNhbid0IHJ1biBpbiB0aGUgYnJvd3Nlciwgc28gdGhlc2UgY2hlY2tzIHJlYWQgeW91ciBjb2RlCiAqIChjbGFzc2VzLCBhbm5vdGF0aW9ucywgbWV0aG9kIGJvZGllczsgY29tbWVudHMgaWdub3JlZCkgaW5zdGVhZCBvZiBleGVjdXRpbmcgaXQuIFJldmlld2VycyBhbHNvCiAqIHJ1biB0aGUgSlVuaXQgdGVzdHMgaW4gc3JjL3Rlc3QvamF2YSBhZ2FpbnN0IHlvdXIgY29kZS4KICovCmltcG9ydCB0eXBlIHsgSmF2YUFubm90YXRpb24sIEphdmFGaWxlLCBKYXZhTWV0aG9kLCBKYXZhVHlwZSB9IGZyb20gJ0Bjb2RlYXJlbmEvamF2YSc7CmltcG9ydCBhcGlFeGNlcHRpb25IYW5kbGVyIGZyb20gJy4uLy4uL3NyYy9tYWluL2phdmEvY29tL3p5Y3VzL3Byb2N1cmVtZW50L3BvL0FwaUV4Y2VwdGlvbkhhbmRsZXIuamF2YSc7CmltcG9ydCBhcHByb3ZhbFNlcnZpY2UgZnJvbSAnLi4vLi4vc3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vQXBwcm92YWxTZXJ2aWNlLmphdmEnOwppbXBvcnQgaWRlbXBvdGVuY3lSZWNvcmQgZnJvbSAnLi4vLi4vc3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vSWRlbXBvdGVuY3lSZWNvcmQuamF2YSc7CmltcG9ydCBpZGVtcG90ZW5jeVJlY29yZFJlcG9zaXRvcnkgZnJvbSAnLi4vLi4vc3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vSWRlbXBvdGVuY3lSZWNvcmRSZXBvc2l0b3J5LmphdmEnOwppbXBvcnQgaW52b2ljZU1hdGNoZXIgZnJvbSAnLi4vLi4vc3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vSW52b2ljZU1hdGNoZXIuamF2YSc7CmltcG9ydCBwdXJjaGFzZU9yZGVyIGZyb20gJy4uLy4uL3NyYy9tYWluL2phdmEvY29tL3p5Y3VzL3Byb2N1cmVtZW50L3BvL1B1cmNoYXNlT3JkZXIuamF2YSc7CmltcG9ydCBwdXJjaGFzZU9yZGVyQ29udHJvbGxlciBmcm9tICcuLi8uLi9zcmMvbWFpbi9qYXZhL2NvbS96eWN1cy9wcm9jdXJlbWVudC9wby9QdXJjaGFzZU9yZGVyQ29udHJvbGxlci5qYXZhJzsKaW1wb3J0IHB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IGZyb20gJy4uLy4uL3NyYy9tYWluL2phdmEvY29tL3p5Y3VzL3Byb2N1cmVtZW50L3BvL1B1cmNoYXNlT3JkZXJSZXBvc2l0b3J5LmphdmEnOwoKLyoqIEV2ZXJ5IHR5cGUgaW4gYSBmaWxlLCBuZXN0ZWQgb25lcyBpbmNsdWRlZC4gKi8KZXhwb3J0IGZ1bmN0aW9uIGFsbFR5cGVzKGZpbGU6IEphdmFGaWxlKTogSmF2YVR5cGVbXSB7CiAgY29uc3Qgb3V0OiBKYXZhVHlwZVtdID0gW107CiAgY29uc3Qgd2FsayA9ICh0eXBlczogSmF2YVR5cGVbXSkgPT4gewogICAgZm9yIChjb25zdCB0IG9mIHR5cGVzKSB7CiAgICAgIG91dC5wdXNoKHQpOwogICAgICB3YWxrKHQudHlwZXMpOwogICAgfQogIH07CiAgd2FsayhmaWxlLnR5cGVzKTsKICByZXR1cm4gb3V0Owp9CgpmdW5jdGlvbiB0eXBlSW4oZmlsZTogSmF2YUZpbGUsIG5hbWU6IHN0cmluZyk6IEphdmFUeXBlIHsKICBjb25zdCB0ID0gYWxsVHlwZXMoZmlsZSkuZmluZCgoeCkgPT4geC5uYW1lID09PSBuYW1lKTsKICBpZiAoIXQpIHRocm93IG5ldyBFcnJvcihgQ2FuJ3QgZmluZCAke25hbWV9LiBLZWVwIHRoZSBleGlzdGluZyBjbGFzcyBhbmQgbWV0aG9kIG5hbWVzLmApOwogIHJldHVybiB0Owp9CgpleHBvcnQgY29uc3QgY29kZSA9IHsKICBzZXJ2aWNlOiB0eXBlSW4oYXBwcm92YWxTZXJ2aWNlLCAnQXBwcm92YWxTZXJ2aWNlJyksCiAgY29udHJvbGxlcjogdHlwZUluKHB1cmNoYXNlT3JkZXJDb250cm9sbGVyLCAnUHVyY2hhc2VPcmRlckNvbnRyb2xsZXInKSwKICBoYW5kbGVyOiB0eXBlSW4oYXBpRXhjZXB0aW9uSGFuZGxlciwgJ0FwaUV4Y2VwdGlvbkhhbmRsZXInKSwKICBtYXRjaGVyOiB0eXBlSW4oaW52b2ljZU1hdGNoZXIsICdJbnZvaWNlTWF0Y2hlcicpLAogIHB1cmNoYXNlT3JkZXI6IHR5cGVJbihwdXJjaGFzZU9yZGVyLCAnUHVyY2hhc2VPcmRlcicpLAogIG9yZGVyczogdHlwZUluKHB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5LCAnUHVyY2hhc2VPcmRlclJlcG9zaXRvcnknKSwKICBpZGVtcG90ZW5jeVJlY29yZDogdHlwZUluKGlkZW1wb3RlbmN5UmVjb3JkLCAnSWRlbXBvdGVuY3lSZWNvcmQnKSwKICBpZGVtcG90ZW5jeTogdHlwZUluKGlkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSwgJ0lkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeScpLAp9OwoKLyoqIEV2ZXJ5IHR5cGUgaW4gdGhlIGZpbGVzIHlvdSBjYW4gZWRpdCAoYSBmaXggbWF5IGFkZCBhIG5lc3RlZCBjbGFzcykuICovCmV4cG9ydCBjb25zdCBlZGl0YWJsZVR5cGVzID0gWwogIGFwcHJvdmFsU2VydmljZSwKICBwdXJjaGFzZU9yZGVyQ29udHJvbGxlciwKICBhcGlFeGNlcHRpb25IYW5kbGVyLAogIGludm9pY2VNYXRjaGVyLAogIHB1cmNoYXNlT3JkZXIsCiAgcHVyY2hhc2VPcmRlclJlcG9zaXRvcnksCiAgaWRlbXBvdGVuY3lSZWNvcmQsCiAgaWRlbXBvdGVuY3lSZWNvcmRSZXBvc2l0b3J5LApdLmZsYXRNYXAoYWxsVHlwZXMpOwoKZXhwb3J0IGZ1bmN0aW9uIG1ldGhvZCh0OiBKYXZhVHlwZSwgbmFtZTogc3RyaW5nKTogSmF2YU1ldGhvZCB7CiAgY29uc3QgbSA9IHQubWV0aG9kcy5maW5kKCh4KSA9PiB4Lm5hbWUgPT09IG5hbWUpOwogIGlmICghbSkgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCBmaW5kICR7dC5uYW1lfS4ke25hbWV9KCkuIEtlZXAgdGhlIGV4aXN0aW5nIGNsYXNzIGFuZCBtZXRob2QgbmFtZXMuYCk7CiAgcmV0dXJuIG07Cn0KCmV4cG9ydCBjb25zdCBib2R5ID0gKG06IEphdmFNZXRob2QpID0+IG0uYm9keSA/PyAnJzsKCmV4cG9ydCBjb25zdCBhbm5vdGF0aW9uID0gKHg6IHsgYW5ub3RhdGlvbnM6IEphdmFBbm5vdGF0aW9uW10gfSwgbmFtZTogc3RyaW5nKTogSmF2YUFubm90YXRpb24gfCBudWxsID0+CiAgeC5hbm5vdGF0aW9ucy5maW5kKChhKSA9PiBhLm5hbWUgPT09IG5hbWUpID8/IG51bGw7CgovKiogVGhlIEBUcmFuc2FjdGlvbmFsIHRoYXQgYXBwbGllcyB0byBhIG1ldGhvZDogaXRzIG93biBpZiBpdCBoYXMgb25lLCBlbHNlIGl0cyBjbGFzcydzLiAqLwpleHBvcnQgY29uc3QgdHJhbnNhY3Rpb25hbE9mID0gKHQ6IEphdmFUeXBlLCBtOiBKYXZhTWV0aG9kKSA9PgogIGFubm90YXRpb24obSwgJ1RyYW5zYWN0aW9uYWwnKSA/PyBhbm5vdGF0aW9uKHQsICdUcmFuc2FjdGlvbmFsJyk7CgovKiogQ2FsbHMgYDxyZWNlaXZlcj4uPG5hbWU+KGAgaW4gc29tZSBjb2RlLiAqLwpleHBvcnQgY29uc3QgY2FsbHNPbiA9IChzb3VyY2U6IHN0cmluZywgcmVjZWl2ZXI6IHN0cmluZywgbmFtZTogc3RyaW5nKSA9PgogIG5ldyBSZWdFeHAoYFxcYiR7cmVjZWl2ZXJ9XFxzKlxcLlxccyoke25hbWV9XFxzKlxcKGApLnRlc3Qoc291cmNlKTsKCi8qKiBDYWxscyBgLjxuYW1lPihgIG9uIGFueXRoaW5nIGluIHNvbWUgY29kZS4gKi8KZXhwb3J0IGNvbnN0IGNhbGxzID0gKHNvdXJjZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpID0+IG5ldyBSZWdFeHAoYFxcLlxccyoke25hbWV9XFxzKlxcKGApLnRlc3Qoc291cmNlKTsKCi8qKiBDYWxscyBvZiBhIG1ldGhvZCBvZiB0aGUgc2FtZSBjbGFzczogYG5hbWUoYCwgYHRoaXMubmFtZShgIG9yIGB0aGlzOjpuYW1lYC4gKi8KY29uc3QgY2FsbE9mID0gKG5hbWU6IHN0cmluZykgPT4KICBuZXcgUmVnRXhwKGAoPzwhW1xcdy4kXSkke25hbWV9XFxzKlxcKHxcXGJ0aGlzXFxzKlxcLlxccyoke25hbWV9XFxzKlxcKHxcXGJ0aGlzXFxzKjo6XFxzKiR7bmFtZX1cXGJgLCAnZycpOwoKLyoqCiAqIEEgbWV0aG9kJ3MgYm9keSB3aXRoIHRoZSBib2RpZXMgb2YgdGhlIG1ldGhvZHMgb2YgaXRzIG93biBjbGFzcyB0aGF0IGl0IGNhbGxzIHdyaXR0ZW4gaW4gd2hlcmUKICogdGhleSBhcmUgY2FsbGVkIChkaXJlY3RseSwgb24gYHRoaXNgLCBvciB0aHJvdWdoIHRoZW0pLCBzbyBtb3ZpbmcgY29kZSBpbnRvIGEgaGVscGVyIG1ldGhvZAogKiBjaGFuZ2VzIG5vdGhpbmcsIG9yZGVyIGluY2x1ZGVkLiBDYWxscyBvbiBvdGhlciBvYmplY3RzIChpbmNsdWRpbmcgdGhpcyBjbGFzcydzIG93biBwcm94eSkgYXJlbid0CiAqIGZvbGxvd2VkLgogKi8KZXhwb3J0IGZ1bmN0aW9uIHdpdGhIZWxwZXJzKHQ6IEphdmFUeXBlLCBtOiBKYXZhTWV0aG9kLCBzZWVuOiBzdHJpbmdbXSA9IFttLm5hbWVdKTogc3RyaW5nIHsKICBsZXQgc291cmNlID0gYm9keShtKTsKICBmb3IgKGNvbnN0IG5hbWUgb2YgbmV3IFNldCh0Lm1ldGhvZHMubWFwKCh4KSA9PiB4Lm5hbWUpKSkgewogICAgaWYgKHNlZW4uaW5jbHVkZXMobmFtZSkgfHwgIWNhbGxPZihuYW1lKS50ZXN0KHNvdXJjZSkpIGNvbnRpbnVlOwogICAgY29uc3QgaW5uZXIgPSB0Lm1ldGhvZHMKICAgICAgLmZpbHRlcigoeCkgPT4geC5uYW1lID09PSBuYW1lKQogICAgICAubWFwKCh4KSA9PiB3aXRoSGVscGVycyh0LCB4LCBbLi4uc2VlbiwgbmFtZV0pKQogICAgICAuam9pbignXG4nKTsKICAgIHNvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKGNhbGxPZihuYW1lKSwgKGNhbGwpID0+IGB7JHtpbm5lcn19XG4ke2NhbGx9YCk7CiAgfQogIHJldHVybiBzb3VyY2U7Cn0KCi8qKiBUaGUgbWV0aG9kcyBvZiBpdHMgb3duIGNsYXNzIHRoYXQgYSBtZXRob2QgY2FsbHMsIGRpcmVjdGx5IG9yIHRocm91Z2ggdGhlbSAoc2VlIHdpdGhIZWxwZXJzKS4gKi8KZXhwb3J0IGZ1bmN0aW9uIGhlbHBlcnNPZih0OiBKYXZhVHlwZSwgbTogSmF2YU1ldGhvZCk6IEphdmFNZXRob2RbXSB7CiAgY29uc3QgZm91bmQgPSBbbV07CiAgLy8gZm9yLi4ub2YgYWxzbyB2aXNpdHMgdGhlIG1ldGhvZHMgcHVzaGVkIHdoaWxlIGl0IHJ1bnMuCiAgZm9yIChjb25zdCBjdXJyZW50IG9mIGZvdW5kKSB7CiAgICBjb25zdCBzb3VyY2UgPSBib2R5KGN1cnJlbnQpOwogICAgZm9yIChjb25zdCBvdGhlciBvZiB0Lm1ldGhvZHMpIHsKICAgICAgaWYgKCFmb3VuZC5pbmNsdWRlcyhvdGhlcikgJiYgY2FsbE9mKG90aGVyLm5hbWUpLnRlc3Qoc291cmNlKSkgZm91bmQucHVzaChvdGhlcik7CiAgICB9CiAgfQogIHJldHVybiBmb3VuZC5zbGljZSgxKTsKfQoKLyoqIENvZGUgd2l0aCB0aGUgY29udGVudHMgb2YgaXRzIHN0cmluZyBhbmQgdGV4dC1ibG9jayBsaXRlcmFscyBibGFua2VkOiB0ZXh0IGlzIG5vdCBjb2RlLiAqLwpleHBvcnQgY29uc3Qgbm9TdHJpbmdzID0gKHNvdXJjZTogc3RyaW5nKSA9PgogIHNvdXJjZS5yZXBsYWNlKC8iIiJbXHNcU10qPyIiInwiKD86W14iXFxcbl18XFwuKSoifCcoPzpbXidcXFxuXXxcXC4pKicvZywgKHMpID0+IChzLnN0YXJ0c1dpdGgoJyInKSA/ICciIicgOiAiJyciKSk7CgovKiogQSB0eXBlIHlvdSBjYW4gZWRpdCwgYnkgaXRzIHNpbXBsZSBvciBxdWFsaWZpZWQgbmFtZSAoYXMgYSBmaWVsZCdzIHR5cGUgZ2l2ZXMgaXQpLiAqLwpleHBvcnQgY29uc3QgZWRpdGFibGVUeXBlID0gKG5hbWU6IHN0cmluZykgPT4gewogIGNvbnN0IHNpbXBsZSA9IG5hbWUucmVwbGFjZSgvPC4qJC8sICcnKS5zcGxpdCgnLicpLnBvcCgpOwogIHJldHVybiBlZGl0YWJsZVR5cGVzLmZpbmQoKHQpID0+IHQubmFtZSA9PT0gc2ltcGxlKSA/PyBudWxsOwp9OwoKLyoqCiAqIFRoZSBlZGl0YWJsZSBjbGFzc2VzIGEgZmllbGQgb2YgdGhpcyB0eXBlIGluamVjdHM6IHRoZSB0eXBlIGl0c2VsZiwgb3IsIGZvciBhbiBpbnRlcmZhY2UsIHRoZQogKiBjbGFzc2VzIGltcGxlbWVudGluZyBpdC4gYE9iamVjdFByb3ZpZGVyPFQ+YCwgYE9iamVjdEZhY3Rvcnk8VD5gIGFuZCBgUHJvdmlkZXI8VD5gIGluamVjdCBULgogKi8KZXhwb3J0IGZ1bmN0aW9uIGJlYW5zRm9yKGZpZWxkVHlwZTogc3RyaW5nKTogSmF2YVR5cGVbXSB7CiAgY29uc3QgaW5uZXIgPSAvXig/Ok9iamVjdFByb3ZpZGVyfE9iamVjdEZhY3Rvcnl8UHJvdmlkZXJ8U3VwcGxpZXIpXHMqPFxzKihbXHcuXSspXHMqPi8uZXhlYyhmaWVsZFR5cGUpPy5bMV07CiAgY29uc3QgdCA9IGVkaXRhYmxlVHlwZShpbm5lciA/PyBmaWVsZFR5cGUpOwogIGlmICghdCkgcmV0dXJuIFtdOwogIGlmICh0LmtpbmQgIT09ICdpbnRlcmZhY2UnKSByZXR1cm4gW3RdOwogIHJldHVybiBlZGl0YWJsZVR5cGVzLmZpbHRlcigoeCkgPT4geC5raW5kID09PSAnY2xhc3MnICYmIHguaW1wbGVtZW50cy5zb21lKChpKSA9PiBlZGl0YWJsZVR5cGUoaSkgPT09IHQpKTsKfQoKLyoqIEEgY2FsbCBvZiBgbWV0aG9kYCBvbiBhIGZpZWxkOiBgZmllbGQubWV0aG9kKGAsIG9yIHRocm91Z2ggYSBwcm92aWRlciAoYGZpZWxkLmdldE9iamVjdCgpLm1ldGhvZChgKS4gKi8KZXhwb3J0IGNvbnN0IGNhbGxzVGhyb3VnaCA9IChzb3VyY2U6IHN0cmluZywgZmllbGQ6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcpID0+CiAgbmV3IFJlZ0V4cCgKICAgIGBcXGIke2ZpZWxkfVxccypcXC5cXHMqKD86KD86Z2V0T2JqZWN0fGdldElmQXZhaWxhYmxlfGdldElmVW5pcXVlfGdldClcXHMqXFwoXFxzKlxcKVxccypcXC5cXHMqKT8ke21ldGhvZH1cXHMqXFwoYCwKICApLnRlc3Qoc291cmNlKTsKCi8qKiBUaGUgYHN0YXRpYyBmaW5hbCBpbnRgIGNvbnN0YW50cyBvZiBhIGNsYXNzIHdpdGggdmFsdWUgMCBvciAxLCBieSBuYW1lLiAqLwpleHBvcnQgY29uc3Qgc21hbGxDb25zdGFudHMgPSAodDogSmF2YVR5cGUpID0+CiAgbmV3IE1hcCgKICAgIHQuZmllbGRzLmZsYXRNYXAoKGYpID0+IHsKICAgICAgY29uc3QgdiA9IC89XHMqKFswMV0pXHMqOz8kLy5leGVjKGYudGV4dCk/LlsxXTsKICAgICAgcmV0dXJuIGYubW9kaWZpZXJzLmluY2x1ZGVzKCdmaW5hbCcpICYmIC9eKGludHxsb25nfEludGVnZXIpJC8udGVzdChmLnR5cGUpICYmIHYgPyBbW2YubmFtZSwgdl1dIDogW107CiAgICB9KSwKICApOwoKLyoqIENvZGUgd2l0aCB0aG9zZSBjb25zdGFudHMgcmVwbGFjZWQgYnkgdGhlaXIgdmFsdWVzIChgcGFnZSA8IEZJUlNUX1BBR0VgIHJlYWRzIGBwYWdlIDwgMWApLiAqLwpleHBvcnQgY29uc3Qgd2l0aENvbnN0YW50cyA9IChzb3VyY2U6IHN0cmluZywgY29uc3RhbnRzOiBNYXA8c3RyaW5nLCBzdHJpbmc+KSA9PgogIFsuLi5jb25zdGFudHNdLnJlZHVjZSgocywgW25hbWUsIHZdKSA9PiBzLnJlcGxhY2UobmV3IFJlZ0V4cChgKD88IVtcXHcuJF0pJHtuYW1lfVxcYmAsICdnJyksIHYpLCBzb3VyY2UpOwoKLyoqIFRoZSB0ZXh0IGZyb20gYG9wZW5gIChhbiBvcGVuaW5nIGJyYWNrZXQpIHRvIGl0cyBtYXRjaGluZyBjbG9zZSwgYm90aCBleGNsdWRlZC4gKi8KZnVuY3Rpb24gZW5jbG9zZWQoc291cmNlOiBzdHJpbmcsIG9wZW46IG51bWJlcik6IHN0cmluZyB7CiAgY29uc3QgcGFpcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7ICcoJzogJyknLCAneyc6ICd9JyB9OwogIGNvbnN0IG8gPSBzb3VyY2Vbb3Blbl0gPz8gJyc7CiAgY29uc3QgYyA9IHBhaXJzW29dOwogIGxldCBkZXB0aCA9IDA7CiAgZm9yIChsZXQgaSA9IG9wZW47IGkgPCBzb3VyY2UubGVuZ3RoOyBpKyspIHsKICAgIGlmIChzb3VyY2VbaV0gPT09IG8pIGRlcHRoKys7CiAgICBlbHNlIGlmIChzb3VyY2VbaV0gPT09IGMgJiYgLS1kZXB0aCA9PT0gMCkgcmV0dXJuIHNvdXJjZS5zbGljZShvcGVuICsgMSwgaSk7CiAgfQogIHJldHVybiBzb3VyY2Uuc2xpY2Uob3BlbiArIDEpOwp9CgovKioKICogRWFjaCBgaWYgKDxjb25kaXRpb24+KWAgd2hvc2UgYnJhbmNoIHRocm93czogdGhlIGNvbmRpdGlvbiAod2l0aCBvciB3aXRob3V0IGJyYWNlcywgdGhlIHRocm93CiAqIGFueXdoZXJlIGluIHRoZSBicmFjZWQgYmxvY2spLgogKi8KZXhwb3J0IGZ1bmN0aW9uIGNvbmRpdGlvbnNUaGF0VGhyb3coc291cmNlOiBzdHJpbmcpOiBzdHJpbmdbXSB7CiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdOwogIGZvciAoY29uc3QgbSBvZiBzb3VyY2UubWF0Y2hBbGwoL1xiaWZccypcKC9nKSkgewogICAgY29uc3Qgc3RhcnQgPSAobS5pbmRleCA/PyAwKSArIG1bMF0ubGVuZ3RoIC0gMTsKICAgIGNvbnN0IGNvbmRpdGlvbiA9IGVuY2xvc2VkKHNvdXJjZSwgc3RhcnQpOwogICAgY29uc3QgYWZ0ZXIgPSBzb3VyY2Uuc2xpY2Uoc3RhcnQgKyBjb25kaXRpb24ubGVuZ3RoICsgMik7CiAgICBjb25zdCBicmFuY2ggPSAvXlxzKlx7Ly50ZXN0KGFmdGVyKSA/IGVuY2xvc2VkKGFmdGVyLCBhZnRlci5pbmRleE9mKCd7JykpIDogYWZ0ZXIuc3BsaXQoJzsnKVswXSA/PyAnJzsKICAgIGlmICgvXGJ0aHJvd1xiLy50ZXN0KGJyYW5jaCkpIG91dC5wdXNoKGNvbmRpdGlvbik7CiAgfQogIHJldHVybiBvdXQ7Cn0KCi8qKiBUaGUgYm9kaWVzIG9mIHRoZSBsb29wcyBpbiBzb21lIGNvZGUgKGBmb3JgL2B3aGlsZWAgYmxvY2tzLCBgLmZvckVhY2go4oCmKWAgYW5kIGAubWFwKOKApilgIGNhbGxzKS4gKi8KZXhwb3J0IGZ1bmN0aW9uIGxvb3BCb2RpZXMoc291cmNlOiBzdHJpbmcpOiBzdHJpbmdbXSB7CiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdOwogIGZvciAoY29uc3QgbSBvZiBzb3VyY2UubWF0Y2hBbGwoL1xiKGZvcnx3aGlsZSlccypcKC9nKSkgewogICAgY29uc3QgaGVhZCA9IChtLmluZGV4ID8/IDApICsgbVswXS5sZW5ndGggLSAxOwogICAgY29uc3QgcmVzdCA9IHNvdXJjZS5zbGljZShoZWFkICsgZW5jbG9zZWQoc291cmNlLCBoZWFkKS5sZW5ndGggKyAyKTsKICAgIGlmICgvXlxzKlx7Ly50ZXN0KHJlc3QpKSBvdXQucHVzaChlbmNsb3NlZChyZXN0LCByZXN0LmluZGV4T2YoJ3snKSkpOwogICAgZWxzZSBvdXQucHVzaChyZXN0LnNwbGl0KCc7JylbMF0gPz8gJycpOwogIH0KICBmb3IgKGNvbnN0IG0gb2Ygc291cmNlLm1hdGNoQWxsKC9cLlxzKihmb3JFYWNofG1hcHxwZWVrKVxzKlwoL2cpKSB7CiAgICBvdXQucHVzaChlbmNsb3NlZChzb3VyY2UsIChtLmluZGV4ID8/IDApICsgbVswXS5sZW5ndGggLSAxKSk7CiAgfQogIHJldHVybiBvdXQ7Cn0KCi8qKiBgQFRyYW5zYWN0aW9uYWxgIHRoYXQgc3RhcnRzIG9yIGpvaW5zIGEgdHJhbnNhY3Rpb24gKG5vdCBOT1RfU1VQUE9SVEVELCBORVZFUiwgU1VQUE9SVFMsIE1BTkRBVE9SWSkuICovCmV4cG9ydCBjb25zdCBvcGVuc1RyYW5zYWN0aW9uID0gKHR4OiBKYXZhQW5ub3RhdGlvbiB8IG51bGwpID0+CiAgISF0eCAmJiAhL1xiKE5PVF9TVVBQT1JURUR8TkVWRVJ8U1VQUE9SVFN8TUFOREFUT1JZKVxiLy50ZXN0KHR4LnRleHQpOwoKZXhwb3J0IGNvbnN0IGlzUmVhZE9ubHkgPSAodHg6IEphdmFBbm5vdGF0aW9uIHwgbnVsbCkgPT4gISF0eCAmJiAvcmVhZE9ubHlccyo9XHMqdHJ1ZS8udGVzdCh0eC50ZXh0KTsKCi8qKiBBIG1ldGhvZCB0aGF0IHJ1bnMgb3V0c2lkZSBhbnkgdHJhbnNhY3Rpb24gd2hlbiBjYWxsZWQgZnJvbSBhIGNvbnRyb2xsZXIuICovCmV4cG9ydCBjb25zdCBvdXRzaWRlVHJhbnNhY3Rpb24gPSAodHg6IEphdmFBbm5vdGF0aW9uIHwgbnVsbCkgPT4KICAhdHggfHwgL1xiKE5PVF9TVVBQT1JURUR8TkVWRVJ8U1VQUE9SVFMpXGIvLnRlc3QodHgudGV4dCk7CgpleHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlIHsKICBuYW1lOiBzdHJpbmc7CiAgLyoqIFNldCB1cCB3aXRoIFBST1BBR0FUSU9OX1JFUVVJUkVTX05FVyAoU3ByaW5nIEJvb3QncyBvd24gVHJhbnNhY3Rpb25UZW1wbGF0ZSBpcyBSRVFVSVJFRCkuICovCiAgcmVxdWlyZXNOZXc6IGJvb2xlYW47CiAgcmVhZE9ubHk6IGJvb2xlYW47Cn0KCi8qKiBUaGUgVHJhbnNhY3Rpb25UZW1wbGF0ZSAvIFRyYW5zYWN0aW9uT3BlcmF0aW9ucyBmaWVsZHMgb2YgYSBjbGFzcyBhbmQgaG93IHRoZXkncmUgc2V0IHVwLiAqLwpleHBvcnQgZnVuY3Rpb24gdGVtcGxhdGVzT2YodDogSmF2YVR5cGUpOiBUZW1wbGF0ZVtdIHsKICByZXR1cm4gdC5maWVsZHMKICAgIC5maWx0ZXIoKGYpID0+IC9eKFRyYW5zYWN0aW9uVGVtcGxhdGV8VHJhbnNhY3Rpb25PcGVyYXRpb25zKVxiLy50ZXN0KGYudHlwZSkpCiAgICAubWFwKChmKSA9PiAoewogICAgICBuYW1lOiBmLm5hbWUsCiAgICAgIHJlcXVpcmVzTmV3OgogICAgICAgIG5ldyBSZWdFeHAoYFxcYiR7Zi5uYW1lfVxccypcXC5cXHMqc2V0UHJvcGFnYXRpb25CZWhhdmlvcihOYW1lKT9cXHMqXFwoW147XSpSRVFVSVJFU19ORVdgKS50ZXN0KHQudGV4dCkgfHwKICAgICAgICBuZXcgUmVnRXhwKGBcXGIke2YubmFtZX1cXHMqPVxccypuZXdcXHMrVHJhbnNhY3Rpb25UZW1wbGF0ZVxccypcXChbXjtdKlJFUVVJUkVTX05FV2ApLnRlc3QodC50ZXh0KSwKICAgICAgcmVhZE9ubHk6IG5ldyBSZWdFeHAoYFxcYiR7Zi5uYW1lfVxccypcXC5cXHMqc2V0UmVhZE9ubHlcXHMqXFwoXFxzKnRydWVgKS50ZXN0KHQudGV4dCksCiAgICB9KSk7Cn0KCi8qKiBBIHJlcG9zaXRvcnkgb3IgRW50aXR5TWFuYWdlciBsb29rdXAgdGhhdCBsb2NrcyB0aGUgcm93IGZvciB3cml0aW5nLCBpbiBzb21lIGNvZGUuICovCmV4cG9ydCBjb25zdCBsb2Nrc1JvdyA9IChzb3VyY2U6IHN0cmluZywgbG9ja2luZ01ldGhvZHM6IHN0cmluZ1tdKSA9PgogIGxvY2tpbmdNZXRob2RzLnNvbWUoKG5hbWUpID0+IG5ldyBSZWdFeHAoYFxcLlxccyoke25hbWV9XFxzKlxcKGApLnRlc3Qoc291cmNlKSkgfHwKICAvXC5ccyooZmluZHxsb2NrfHJlZnJlc2gpXHMqXChbXjtdKlBFU1NJTUlTVElDX1dSSVRFLy50ZXN0KHNvdXJjZSk7CgovKiogQ29kZSBydW5zIGEgY2FsbGJhY2sgaW4gdGhpcyB0ZW1wbGF0ZS4gKi8KZXhwb3J0IGNvbnN0IHVzZXNUZW1wbGF0ZSA9IChzb3VyY2U6IHN0cmluZywgdGVtcGxhdGU6IFRlbXBsYXRlKSA9PgogIG5ldyBSZWdFeHAoYFxcYiR7dGVtcGxhdGUubmFtZX1cXHMqXFwuXFxzKihleGVjdXRlfGV4ZWN1dGVXaXRob3V0UmVzdWx0KVxccypcXChgKS50ZXN0KHNvdXJjZSk7CgovKiogRWFjaCBgY2F0Y2ggKC4uLikgeyAuLi4gfWAgaW4gc29tZSBjb2RlOiB0aGUgY2F1Z2h0IHR5cGVzIGFuZCB0aGUgYmxvY2suICovCmV4cG9ydCBmdW5jdGlvbiBjYXRjaEJsb2Nrcyhzb3VyY2U6IHN0cmluZyk6IHsgdHlwZXM6IHN0cmluZzsgYmxvY2s6IHN0cmluZyB9W10gewogIGNvbnN0IG91dDogeyB0eXBlczogc3RyaW5nOyBibG9jazogc3RyaW5nIH1bXSA9IFtdOwogIGZvciAoY29uc3QgbSBvZiBzb3VyY2UubWF0Y2hBbGwoL1xiY2F0Y2hccypcKChbXildKilcKVxzKlx7L2cpKSB7CiAgICBsZXQgZGVwdGggPSAxOwogICAgbGV0IGkgPSAobS5pbmRleCA/PyAwKSArIG1bMF0ubGVuZ3RoOwogICAgY29uc3Qgc3RhcnQgPSBpOwogICAgd2hpbGUgKGkgPCBzb3VyY2UubGVuZ3RoICYmIGRlcHRoID4gMCkgewogICAgICBpZiAoc291cmNlW2ldID09PSAneycpIGRlcHRoKys7CiAgICAgIGVsc2UgaWYgKHNvdXJjZVtpXSA9PT0gJ30nKSBkZXB0aC0tOwogICAgICBpKys7CiAgICB9CiAgICBvdXQucHVzaCh7IHR5cGVzOiBtWzFdID8/ICcnLCBibG9jazogc291cmNlLnNsaWNlKHN0YXJ0LCBpIC0gMSkgfSk7CiAgfQogIHJldHVybiBvdXQ7Cn0KCi8qKiBGYWlscyB0aGUgY2hlY2sgd2l0aCBhbiBleHBsYW5hdGlvbiBvZiB3aGF0IHdhcyBsb29rZWQgYXQuICovCmV4cG9ydCBmdW5jdGlvbiBjaGVjayhvazogYm9vbGVhbiwgZXhwbGFuYXRpb246IHN0cmluZyk6IHZvaWQgewogIGlmICghb2spIHRocm93IG5ldyBFcnJvcihleHBsYW5hdGlvbik7Cn0K', 'base64'), 'UTF8'), true, 21),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'pom.xml', 'xml', convert_from(decode('PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHByb2plY3QgeG1sbnM9Imh0dHA6Ly9tYXZlbi5hcGFjaGUub3JnL1BPTS80LjAuMCIKICAgICAgICAgeG1sbnM6eHNpPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZSIKICAgICAgICAgeHNpOnNjaGVtYUxvY2F0aW9uPSJodHRwOi8vbWF2ZW4uYXBhY2hlLm9yZy9QT00vNC4wLjAgaHR0cHM6Ly9tYXZlbi5hcGFjaGUub3JnL3hzZC9tYXZlbi00LjAuMC54c2QiPgogIDxtb2RlbFZlcnNpb24+NC4wLjA8L21vZGVsVmVyc2lvbj4KICA8cGFyZW50PgogICAgPGdyb3VwSWQ+b3JnLnNwcmluZ2ZyYW1ld29yay5ib290PC9ncm91cElkPgogICAgPGFydGlmYWN0SWQ+c3ByaW5nLWJvb3Qtc3RhcnRlci1wYXJlbnQ8L2FydGlmYWN0SWQ+CiAgICA8dmVyc2lvbj4zLjMuNTwvdmVyc2lvbj4KICAgIDxyZWxhdGl2ZVBhdGgvPgogIDwvcGFyZW50PgogIDxncm91cElkPmNvbS56eWN1cy5wcm9jdXJlbWVudDwvZ3JvdXBJZD4KICA8YXJ0aWZhY3RJZD5wby1hcHByb3ZhbHM8L2FydGlmYWN0SWQ+CiAgPHZlcnNpb24+MS44LjA8L3ZlcnNpb24+CiAgPHByb3BlcnRpZXM+CiAgICA8amF2YS52ZXJzaW9uPjIxPC9qYXZhLnZlcnNpb24+CiAgPC9wcm9wZXJ0aWVzPgogIDxkZXBlbmRlbmNpZXM+CiAgICA8ZGVwZW5kZW5jeT4KICAgICAgPGdyb3VwSWQ+b3JnLnNwcmluZ2ZyYW1ld29yay5ib290PC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5zcHJpbmctYm9vdC1zdGFydGVyLXdlYjwvYXJ0aWZhY3RJZD4KICAgIDwvZGVwZW5kZW5jeT4KICAgIDxkZXBlbmRlbmN5PgogICAgICA8Z3JvdXBJZD5vcmcuc3ByaW5nZnJhbWV3b3JrLmJvb3Q8L2dyb3VwSWQ+CiAgICAgIDxhcnRpZmFjdElkPnNwcmluZy1ib290LXN0YXJ0ZXItZGF0YS1qcGE8L2FydGlmYWN0SWQ+CiAgICA8L2RlcGVuZGVuY3k+CiAgICA8ZGVwZW5kZW5jeT4KICAgICAgPGdyb3VwSWQ+b3JnLnNwcmluZ2ZyYW1ld29yay5ib290PC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5zcHJpbmctYm9vdC1zdGFydGVyLXNlY3VyaXR5PC9hcnRpZmFjdElkPgogICAgPC9kZXBlbmRlbmN5PgogICAgPGRlcGVuZGVuY3k+CiAgICAgIDxncm91cElkPm9yZy5wb3N0Z3Jlc3FsPC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5wb3N0Z3Jlc3FsPC9hcnRpZmFjdElkPgogICAgICA8c2NvcGU+cnVudGltZTwvc2NvcGU+CiAgICA8L2RlcGVuZGVuY3k+CiAgICA8ZGVwZW5kZW5jeT4KICAgICAgPGdyb3VwSWQ+b3JnLnNwcmluZ2ZyYW1ld29yay5ib290PC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5zcHJpbmctYm9vdC1zdGFydGVyLXRlc3Q8L2FydGlmYWN0SWQ+CiAgICAgIDxzY29wZT50ZXN0PC9zY29wZT4KICAgIDwvZGVwZW5kZW5jeT4KICAgIDxkZXBlbmRlbmN5PgogICAgICA8Z3JvdXBJZD5vcmcuc3ByaW5nZnJhbWV3b3JrLmJvb3Q8L2dyb3VwSWQ+CiAgICAgIDxhcnRpZmFjdElkPnNwcmluZy1ib290LXRlc3Rjb250YWluZXJzPC9hcnRpZmFjdElkPgogICAgICA8c2NvcGU+dGVzdDwvc2NvcGU+CiAgICA8L2RlcGVuZGVuY3k+CiAgICA8ZGVwZW5kZW5jeT4KICAgICAgPGdyb3VwSWQ+b3JnLnRlc3Rjb250YWluZXJzPC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5wb3N0Z3Jlc3FsPC9hcnRpZmFjdElkPgogICAgICA8c2NvcGU+dGVzdDwvc2NvcGU+CiAgICA8L2RlcGVuZGVuY3k+CiAgICA8ZGVwZW5kZW5jeT4KICAgICAgPGdyb3VwSWQ+b3JnLnRlc3Rjb250YWluZXJzPC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5qdW5pdC1qdXBpdGVyPC9hcnRpZmFjdElkPgogICAgICA8c2NvcGU+dGVzdDwvc2NvcGU+CiAgICA8L2RlcGVuZGVuY3k+CiAgPC9kZXBlbmRlbmNpZXM+CjwvcHJvamVjdD4K', 'base64'), 'UTF8'), true, 22)
  on conflict (question_id, path) do update set language = excluded.language, content = excluded.content,
    readonly = excluded.readonly, sort_order = excluded.sort_order;
  delete from public.question_rubric_items where question_id = '04a206ea-655a-40fd-9651-b01088d59d98' and key <> all (array['transactions', 'batch', 'idempotency', 'concurrency', 'invoice', 'paging']::text[]);
  insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'transactions', 'Rejections are saved and refused approvals roll back', convert_from(decode('RXhwbGFpbnMgcmVhZE9ubHkg4oeSIG5vIGZsdXNoIChtZXRob2QtbGV2ZWwgQFRyYW5zYWN0aW9uYWwgb24gcmVqZWN0KSBhbmQgdGhhdCBjaGVja2VkIGV4Y2VwdGlvbnMgZG9uJ3Qgcm9sbCBiYWNrIGJ5IGRlZmF1bHQgKHJvbGxiYWNrRm9yKS4=', 'base64'), 'UTF8'), 5, 0),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'batch', 'Batch approvals are isolated per PO', convert_from(decode('RXhwbGFpbnMgdGhhdCBzZWxmLWludm9jYXRpb24gYnlwYXNzZXMgdGhlIHByb3h5IHNvIFJFUVVJUkVTX05FVyB3YXMgaWdub3JlZDsgdXNlcyBhIHNlcGFyYXRlIGJlYW4sIFRyYW5zYWN0aW9uVGVtcGxhdGUgb3IgdGhlIHByb3h5OyBwZXItUE8gcnVudGltZSBmYWlsdXJlcyBhcmUgcmVwb3J0ZWQsIG5vdCBmYXRhbC4=', 'base64'), 'UTF8'), 4, 1),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'idempotency', 'Idempotency is atomic and scoped', convert_from(decode('Q2xhaW1zIHRoZSBrZXkgYXRvbWljYWxseSAodW5pcXVlIChhcHByb3Zlciwga2V5KSArIGluc2VydC1maXJzdCAvIG9uIGNvbmZsaWN0LCByZXBsYXkgaW4gYSBuZXcgdHJhbnNhY3Rpb24gaWYgbmVlZGVkKTsgc2NvcGVzIGtleXMgcGVyIGFwcHJvdmVyOyByZWZ1c2VzIGtleSByZXVzZSBmb3IgYW5vdGhlciBQTyAoNDIyKS4=', 'base64'), 'UTF8'), 5, 2),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'concurrency', 'Two-person rule and concurrent approvers', 'Records who approved and refuses a repeat approver; @Version (or a pessimistic lock) with OptimisticLockingFailureException mapped to 409.', 4, 3),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'invoice', 'Invoice matching is correct', convert_from(decode('Y29tcGFyZVRvIGluc3RlYWQgb2YgQmlnRGVjaW1hbC5lcXVhbHM7IHN1bXMgcXVhbnRpdGllcyBwZXIgU0tVOyBsb2FkcyBsaW5lcyB3aXRob3V0IG9wZW4taW4tdmlldyAoZW50aXR5IGdyYXBoIC8gZmV0Y2ggam9pbiAvIHRyYW5zYWN0aW9uYWwgc2VydmljZSksIG5vdCBFQUdFUi4=', 'base64'), 'UTF8'), 4, 4),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'paging', 'Inbox paging is correct and paged in the database', convert_from(decode('MS1iYXNlZCDihpIgMC1iYXNlZCB3aXRoIHZhbGlkYXRpb247IHN0YWJsZSBzb3J0IChjcmVhdGVkQXQgZGVzYywgaWQgZGVzYyk7IG5vIGluLW1lbW9yeSBwYWdpbmF0aW9uIG9mIGEgY29sbGVjdGlvbiBmZXRjaCAodHdvLXN0ZXAgaWRzIHF1ZXJ5LCBEVE8gcHJvamVjdGlvbiBvciBiYXRjaCBmZXRjaGluZyku', 'base64'), 'UTF8'), 3, 5)
  on conflict (question_id, key) do update set criterion = excluded.criterion,
    description = excluded.description, max_points = excluded.max_points, sort_order = excluded.sort_order;
  insert into public.question_solutions (question_id, notes_md, files) values (
    '04a206ea-655a-40fd-9651-b01088d59d98', convert_from(decode('IyMgUmV2aWV3ZXIgbm90ZXM6IFBPIEFwcHJvdmFscyBzZXJ2aWNlCgpSdW4gdGhlIGNhbmRpZGF0ZSdzIGNvZGUgd2l0aCBgbXZuIHZlcmlmeWAgKERvY2tlciBuZWVkZWQgZm9yIFRlc3Rjb250YWluZXJzKS4gVGhlIHRlc3RzIGluCmBBcHByb3ZhbFNlcnZpY2VJVGAgYW5kIGBJbnZvaWNlTWF0Y2hlclRlc3RgIGZhaWwgb24gdGhlIHN0YXJ0ZXIgY29kZSBhbmQgcGFzcyBvbiB0aGlzIHJlZmVyZW5jZQpzb2x1dGlvbi4gUmVhZCB0aGUgZGlmZiB0b286IHNldmVyYWwgYnVncyBoYXZlIG1vcmUgdGhhbiBvbmUgZ29vZCBmaXguCgojIyMgMS4gUmVqZWN0aW9uIG5vdCBzYXZlZCAoYEFwcHJvdmFsU2VydmljZS5yZWplY3RgKQoKYHJlamVjdGAgaGFzIG5vIGFubm90YXRpb24sIHNvIGl0IGluaGVyaXRzIHRoZSBjbGFzcy1sZXZlbCBgQFRyYW5zYWN0aW9uYWwocmVhZE9ubHkgPSB0cnVlKWAuClNwcmluZyBzZXRzIEhpYmVybmF0ZSdzIGZsdXNoIG1vZGUgdG8gTUFOVUFMIGZvciByZWFkLW9ubHkgdHJhbnNhY3Rpb25zOiB0aGUgY2hhbmdlIGlzIG1hZGUgaW4KbWVtb3J5LCB0aGUgRFRPIHNheXMgKlJlamVjdGVkKiwgbm90aGluZyBpcyB3cml0dGVuLiAqKkZpeDoqKiBgQFRyYW5zYWN0aW9uYWxgIG9uIGByZWplY3RgLgoKIyMjIDIuIEFwcHJvdmFscyB0aGUgYnVkZ2V0IHJlZnVzZWQgKGBhcHByb3ZlYCwgYGFwcHJvdmVCYXRjaGApCgotIGBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbmAgaXMgKipjaGVja2VkKiouIEJ5IGRlZmF1bHQgU3ByaW5nIHJvbGxzIGJhY2sgb25seSBmb3IgdW5jaGVja2VkCiAgZXhjZXB0aW9ucywgc28gYGFwcHJvdmVgIGNvbW1pdHRlZCB0aGUgYXBwcm92YWwgYW5kIHRoZW4gYW5zd2VyZWQgNDIyLiAqKkZpeDoqKgogIGByb2xsYmFja0ZvciA9IEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uLmNsYXNzYCwgb3IgY2F0Y2ggaXQsIGBzZXRSb2xsYmFja09ubHkoKWAgYW5kIHJldGhyb3cgaXQuCiAgKFdyYXBwaW5nIGl0IGluIGFuIHVuY2hlY2tlZCBleGNlcHRpb24gYWxzbyByb2xscyBiYWNrLCBidXQgYnJlYWtzIHRoZSBBUEk6IHRoZSA0MjIgaGFuZGxlciBhbmQKICB0aGUgSlVuaXQgdGVzdCBleHBlY3QgYEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uYC4pCi0gYGFwcHJvdmVCYXRjaGAgY2FsbHMgYHRoaXMuYXBwcm92ZU9uZSguLi4pYC4gVGhhdCBjYWxsIGRvZXNuJ3QgZ28gdGhyb3VnaCB0aGUgcHJveHksIHNvCiAgYFJFUVVJUkVTX05FV2AgaXMgaWdub3JlZC4gRXZlcnkgUE8gcnVucyBpbiB0aGUgYmF0Y2gncyB0cmFuc2FjdGlvbjogYSByZWZ1c2VkIFBPJ3MKICBgcmVjb3JkQXBwcm92YWwoKWAgaXMgZmx1c2hlZCBhdCB0aGUgYmF0Y2ggY29tbWl0LCBhbmQgYSBydW50aW1lIGV4Y2VwdGlvbiBmb3Igb25lIGlkIChhbHJlYWR5CiAgYXBwcm92ZWQsIG5vdCBmb3VuZCkgcm9sbHMgYmFjayB0aGUgd2hvbGUgYmF0Y2guCi0gKipBY2NlcHQ6KiogYSBzZXBhcmF0ZSBiZWFuIHdpdGggYEBUcmFuc2FjdGlvbmFsKHByb3BhZ2F0aW9uID0gUkVRVUlSRVNfTkVXLCByb2xsYmFja0ZvciA9IOKApilgLCBhCiAgYFRyYW5zYWN0aW9uVGVtcGxhdGVgIChyZWZlcmVuY2UpLCBvciBzZWxmLWluamVjdGlvbiB0aHJvdWdoIHRoZSBwcm94eS4gVGhlIGJhdGNoIGl0c2VsZgogIHNob3VsZG4ndCBob2xkIGEgdHJhbnNhY3Rpb24gKG9yIG11c3QgYXQgbGVhc3Qgbm90IHNoYXJlIHRoZSBwZXItUE8gd29yayksIGFuZCBwZXItUE8gcnVudGltZQogIGZhaWx1cmVzIGFyZSBjYXVnaHQgYW5kIHJlcG9ydGVkLgotICoqUmVkIGZsYWdzOioqIGNhdGNoaW5nIHRoZSBleGNlcHRpb24gYW5kICJ1bmRvaW5nIiB0aGUgc3RhdHVzIGJ5IGhhbmQ7IGBAVHJhbnNhY3Rpb25hbGAgb24gYQogIHByaXZhdGUgbWV0aG9kLgoKIyMjIDMuIEFwcHJvdmVkIGJ5IG9uZSBwZXJzb24KCnwgQ2F1c2UgfCBGaXggfAp8IC0tLSB8IC0tLSB8CnwgSWRlbXBvdGVuY3kgaXMgY2hlY2stdGhlbi1hY3QgKGBmaW5kQnlLZXlgLCB0aGVuIGBzYXZlYCk6IGNvbmN1cnJlbnQgcmV0cmllcyBhbGwgc2VlICJubyByZWNvcmQiIGFuZCBhbGwgYXBwcm92ZS4gfCBDbGFpbSB0aGUga2V5ICoqYXRvbWljYWxseSBiZWZvcmUqKiBkb2luZyB0aGUgd29yazogYSB1bmlxdWUgY29uc3RyYWludCBvbiAoYXBwcm92ZXJfaWQsIGlkZW1fa2V5KSBhbmQgYGluc2VydCDigKYgb24gY29uZmxpY3QgZG8gbm90aGluZ2AgKHJlZmVyZW5jZSkuIE9yIGBzYXZlQW5kRmx1c2hgIGFuZCBjYXRjaCBgRGF0YUludGVncml0eVZpb2xhdGlvbkV4Y2VwdGlvbmA7IGFmdGVyIHRoYXQgZXJyb3IgUG9zdGdyZVNRTCBhYm9ydHMgdGhlIHRyYW5zYWN0aW9uLCBzbyB0aGUgcmVwbGF5IG11c3QgcnVuIGluIGEgbmV3IG9uZS4gfAp8IFRoZSBrZXkgaXMgbG9va2VkIHVwIGdsb2JhbGx5LCBidXQga2V5cyBhcmUgdW5pcXVlIG9ubHkgcGVyIHVzZXIsIHNvIGEgY29sbGlzaW9uIHJldHVybnMgYW5vdGhlciBhcHByb3ZlcidzIFBPIGFuZCBza2lwcyB0aGUgYXBwcm92YWwuIHwgU2NvcGUgbG9va3VwcyBhbmQgdGhlIGNvbnN0cmFpbnQgdG8gdGhlIGFwcHJvdmVyLiB8CnwgQSBrZXkgcmV1c2VkIGZvciBhIGRpZmZlcmVudCBQTyBzaWxlbnRseSByZXBsYXlzIHRoZSBmaXJzdCBvbmUuIHwgQ29tcGFyZSB0aGUgc3RvcmVkIFBPIGlkIChhIHJlcXVlc3QgZmluZ2VycHJpbnQpIGFuZCByZWZ1c2Ugd2l0aCA0MjIuIHwKfCBgYXBwcm92YWxzUmVjZWl2ZWQrK2AgZG9lc24ndCByZWNvcmQgKndobyogYXBwcm92ZWQsIHNvIHRoZSBzYW1lIHBlcnNvbiBjYW4gZ2l2ZSBib3RoIGFwcHJvdmFscy4gfCBLZWVwIHRoZSBhcHByb3ZlciBpZHMgKHJlZmVyZW5jZTogYEBFbGVtZW50Q29sbGVjdGlvbmApIGFuZCByZWZ1c2UgYSByZXBlYXQuIHwKfCBObyBgQFZlcnNpb25gOiB0d28gYXBwcm92ZXJzIHJlYWQgdGhlIHNhbWUgc3RhdGUsIGJvdGggY29tbWl0IChsb3N0IHVwZGF0ZSksIGFuZCBidWRnZXQgaXMgcmVzZXJ2ZWQgdHdpY2UuIHwgYEBWZXJzaW9uYCBwbHVzIGEgNDA5IGhhbmRsZXIgZm9yIGBPcHRpbWlzdGljTG9ja2luZ0ZhaWx1cmVFeGNlcHRpb25gLiBBIHBlc3NpbWlzdGljIGBQRVNTSU1JU1RJQ19XUklURWAgbG9jayBvbiB0aGUgUE8gaXMgYWxzbyBmaW5lIGlmIHRoZXkgZXhwbGFpbiBpdC4gfAoKVGhlIGlkZW1wb3RlbmN5IGNsYWltIGlzIHJvbGxlZCBiYWNrIHdpdGggdGhlIHRyYW5zYWN0aW9uLCBzbyBhIHJlcXVlc3QgdGhhdCBmYWlsZWQgKGJ1ZGdldCwKY29uZmxpY3QpIGNhbiBiZSByZXRyaWVkIHdpdGggdGhlIHNhbWUga2V5LiBTdHJvbmcgYW5zd2VycyBtZW50aW9uIHRoaXMuCgojIyMgNC4gSW52b2ljZSBtYXRjaGluZwoKLSBgQmlnRGVjaW1hbC5lcXVhbHNgIGNvbXBhcmVzIHRoZSBzY2FsZSAoYDE1MDAuMGAg4omgIGAxNTAwLjAwYCk7IHVzZSBgY29tcGFyZVRvYC4KLSBRdWFudGl0aWVzIGhhdmUgdG8gYmUgc3VtbWVkIHBlciBTS1UgYWNyb3NzIGludm9pY2UgbGluZXMuCi0gV2l0aCBvcGVuLWluLXZpZXcgb2ZmLCBgZmluZEJ5SWRgIGluIHRoZSBjb250cm9sbGVyIHJldHVybnMgYSBkZXRhY2hlZCBQTy4gUmVhZGluZwogIGBnZXRMaW5lcygpYCB0aGVuIHRocm93cyBgTGF6eUluaXRpYWxpemF0aW9uRXhjZXB0aW9uYC4KLSAqKkFjY2VwdDoqKiBgQEVudGl0eUdyYXBoYCAvIGBqb2luIGZldGNoYCBsb29rdXAgKHJlZmVyZW5jZSksIG9yIGRvaW5nIHRoZSBtYXRjaCBpbnNpZGUgYQogIGBAVHJhbnNhY3Rpb25hbChyZWFkT25seSA9IHRydWUpYCBzZXJ2aWNlIG1ldGhvZC4KLSAqKlJlZCBmbGFnOioqIHN3aXRjaGluZyBvcGVuLWluLXZpZXcgYmFjayBvbiwgb3IgYEZldGNoVHlwZS5FQUdFUmAgb24gYGxpbmVzYC4KCiMjIyA1LiBJbmJveCBwYWdpbmcKCi0gYFBhZ2VSZXF1ZXN0YCBpcyAwLWJhc2VkLCBidXQgdGhlIEFQSSBpcyAxLWJhc2VkLiBVc2UgYHBhZ2UgLSAxYCBhbmQgdmFsaWRhdGUgYHBhZ2UgPj0gMWAKICAoNDAwIHZpYSBgSWxsZWdhbEFyZ3VtZW50RXhjZXB0aW9uYCkuCi0gVGhlcmUgd2FzIG5vIHNvcnQsIHNvIHRoZSBvcmRlciBpc24ndCBkZWZpbmVkIGFuZCBwYWdlcyBvdmVybGFwLiBTb3J0IGJ5IGBjcmVhdGVkQXQgZGVzYywgaWQgZGVzY2A7CiAgdGhlIGlkIGlzIHRoZSB0aWUtYnJlYWtlciB0aGF0IG1ha2VzIHRoZSBvcmRlciBzdGFibGUuCi0gQSBjb2xsZWN0aW9uIGBqb2luIGZldGNoYCB3aXRoIHBhZ2luZyBtYWtlcyBIaWJlcm5hdGUgZmV0Y2ggZXZlcnkgcm93IGFuZCBwYWdlIGluIG1lbW9yeQogIChISEg5MDAwMzAwNCkuCiAgLSAqKkFjY2VwdDoqKiB0d28gcXVlcmllcyAocGFnZSBvZiBpZHMsIHRoZW4gZmV0Y2ggdGhvc2UgUE9zIHdpdGggdGhlaXIgbGluZXM7IHJlZmVyZW5jZSksIGEgRFRPCiAgICBwcm9qZWN0aW9uIHdpdGggYSBsaW5lLWNvdW50IHN1YnF1ZXJ5LCBvciBgQEJhdGNoU2l6ZWAgLyBgZGVmYXVsdF9iYXRjaF9mZXRjaF9zaXplYCBvbiB0aGUKICAgIGxpbmVzIHdpdGhvdXQgdGhlIGZldGNoIGpvaW4uCiAgLSAqKlJlZCBmbGFnOioqIHJlbW92aW5nIGBkaXN0aW5jdGAgb25seSwgb3IgcmFpc2luZyB0aGUgaGVhcC4KCiMjIyBTY29yaW5nIGhpbnRzCgotIEZ1bGwgbWFya3MgbmVlZCB0aGUgdHJhbnNhY3Rpb25hbCBhbmQgY29uY3VycmVuY3kgY2F1c2VzIGV4cGxhaW5lZCwgbm90IGp1c3QgcGF0Y2hlZC4gQQogIGNvbW1lbnQgbGlrZSAic2VsZi1pbnZvY2F0aW9uIGJ5cGFzc2VzIHRoZSBwcm94eSIgb3IgInJlYWRPbmx5IOKHkiBGbHVzaE1vZGUuTUFOVUFMIiBpcyB3b3J0aAogIG1vcmUgdGhhbiB0aGUgYW5ub3RhdGlvbiBhbG9uZS4KLSBgc3luY2hyb25pemVkYCBibG9ja3Mgb3IgaW4tbWVtb3J5IGxvY2tzIGRvbid0IHdvcms6IHRoZSBzZXJ2aWNlIHJ1bnMgYXMgc2V2ZXJhbCBpbnN0YW5jZXMuCg==', 'base64'), 'UTF8'), (convert_from(decode('W3sicGF0aCI6InNyYy9tYWluL2phdmEvY29tL3p5Y3VzL3Byb2N1cmVtZW50L3BvL0FwcHJvdmFsU2VydmljZS5qYXZhIiwiY29udGVudCI6InBhY2thZ2UgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvO1xuXG5pbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuQmF0Y2hSZXN1bHQ7XG5pbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuUHVyY2hhc2VPcmRlckR0bztcbmltcG9ydCBqYXZhLnV0aWwuTGlzdDtcbmltcG9ydCBqYXZhLnV0aWwuTWFwO1xuaW1wb3J0IGphdmEudXRpbC5mdW5jdGlvbi5GdW5jdGlvbjtcbmltcG9ydCBqYXZhLnV0aWwuc3RyZWFtLkNvbGxlY3RvcnM7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYW8uT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5kb21haW4uUGFnZTtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlBhZ2VhYmxlO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuc3RlcmVvdHlwZS5TZXJ2aWNlO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsudHJhbnNhY3Rpb24uUGxhdGZvcm1UcmFuc2FjdGlvbk1hbmFnZXI7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5UcmFuc2FjdGlvbkRlZmluaXRpb247XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5UcmFuc2FjdGlvblN0YXR1cztcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLnRyYW5zYWN0aW9uLmFubm90YXRpb24uUHJvcGFnYXRpb247XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5hbm5vdGF0aW9uLlRyYW5zYWN0aW9uYWw7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5zdXBwb3J0LlRyYW5zYWN0aW9uVGVtcGxhdGU7XG5cbkBTZXJ2aWNlXG5AVHJhbnNhY3Rpb25hbChyZWFkT25seSA9IHRydWUpXG5wdWJsaWMgY2xhc3MgQXBwcm92YWxTZXJ2aWNlIHtcblxuICAgIC8qKiBUaGUgSWRlbXBvdGVuY3ktS2V5IHdhcyBhbHJlYWR5IHVzZWQgYnkgdGhpcyBhcHByb3ZlciBmb3IgYSBkaWZmZXJlbnQgUE8gKEhUVFAgNDIyKS4gKi9cbiAgICBwdWJsaWMgc3RhdGljIGNsYXNzIElkZW1wb3RlbmN5S2V5UmV1c2VkRXhjZXB0aW9uIGV4dGVuZHMgUnVudGltZUV4Y2VwdGlvbiB7XG5cbiAgICAgICAgcHVibGljIElkZW1wb3RlbmN5S2V5UmV1c2VkRXhjZXB0aW9uKFN0cmluZyBrZXkpIHtcbiAgICAgICAgICAgIHN1cGVyKFwiSWRlbXBvdGVuY3ktS2V5IFwiICsga2V5ICsgXCIgd2FzIGFscmVhZHkgdXNlZCBmb3IgYSBkaWZmZXJlbnQgcHVyY2hhc2Ugb3JkZXJcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGZpbmFsIFB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IG9yZGVycztcbiAgICBwcml2YXRlIGZpbmFsIElkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSBpZGVtcG90ZW5jeTtcbiAgICBwcml2YXRlIGZpbmFsIEJ1ZGdldFNlcnZpY2UgYnVkZ2V0O1xuICAgIC8qKiBPbmUgdHJhbnNhY3Rpb24gcGVyIFBPIGluIGEgYmF0Y2ggKFJFUVVJUkVTX05FVykuICovXG4gICAgcHJpdmF0ZSBmaW5hbCBUcmFuc2FjdGlvblRlbXBsYXRlIHBlclBvO1xuXG4gICAgcHVibGljIEFwcHJvdmFsU2VydmljZShQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBvcmRlcnMsIElkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSBpZGVtcG90ZW5jeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIEJ1ZGdldFNlcnZpY2UgYnVkZ2V0LCBQbGF0Zm9ybVRyYW5zYWN0aW9uTWFuYWdlciB0cmFuc2FjdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcmRlcnMgPSBvcmRlcnM7XG4gICAgICAgIHRoaXMuaWRlbXBvdGVuY3kgPSBpZGVtcG90ZW5jeTtcbiAgICAgICAgdGhpcy5idWRnZXQgPSBidWRnZXQ7XG4gICAgICAgIHRoaXMucGVyUG8gPSBuZXcgVHJhbnNhY3Rpb25UZW1wbGF0ZSh0cmFuc2FjdGlvbnMpO1xuICAgICAgICB0aGlzLnBlclBvLnNldFByb3BhZ2F0aW9uQmVoYXZpb3IoVHJhbnNhY3Rpb25EZWZpbml0aW9uLlBST1BBR0FUSU9OX1JFUVVJUkVTX05FVyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRhdGFiYXNlIHBhZ2VzIHRoZSBpZHMgKHNvcnRlZCBieSB0aGUgUGFnZWFibGUpOyB0aGUgbGluZXMgZm9yIHRoYXQgcGFnZSBhcmUgdGhlbiBsb2FkZWRcbiAgICAgKiBpbiBvbmUgcXVlcnkuIFBhZ2luZyBhIGNvbGxlY3Rpb24gZmV0Y2ggam9pbiBtYWRlIEhpYmVybmF0ZSBsb2FkIGV2ZXJ5IFBPIGFuZCBwYWdlIGluIG1lbW9yeS5cbiAgICAgKi9cbiAgICBwdWJsaWMgUGFnZTxQdXJjaGFzZU9yZGVyRHRvPiBsaXN0KFBhZ2VhYmxlIHBhZ2VhYmxlKSB7XG4gICAgICAgIFBhZ2U8TG9uZz4gaWRzID0gb3JkZXJzLmZpbmRQYWdlSWRzKHBhZ2VhYmxlKTtcbiAgICAgICAgTGlzdDxQdXJjaGFzZU9yZGVyPiBmb3VuZCA9IGlkcy5pc0VtcHR5KCkgPyBMaXN0Lm9mKCkgOiBvcmRlcnMuZmluZEFsbFdpdGhMaW5lcyhpZHMuZ2V0Q29udGVudCgpKTtcbiAgICAgICAgTWFwPExvbmcsIFB1cmNoYXNlT3JkZXI+IGJ5SWQgPSBmb3VuZC5zdHJlYW0oKVxuICAgICAgICAgICAgICAgIC5jb2xsZWN0KENvbGxlY3RvcnMudG9NYXAoUHVyY2hhc2VPcmRlcjo6Z2V0SWQsIEZ1bmN0aW9uLmlkZW50aXR5KCkpKTtcbiAgICAgICAgcmV0dXJuIGlkcy5tYXAoaWQgLT4gUHVyY2hhc2VPcmRlckR0by5mcm9tKGJ5SWQuZ2V0KGlkKSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFwcHJvdmVzIGEgUE8uIFRoZSBtb2JpbGUgYXBwIHNlbmRzIGFuIElkZW1wb3RlbmN5LUtleSBhbmQgcmV0cmllcyBvbiB0aW1lb3V0cywgc28gdGhlIHNhbWVcbiAgICAgKiByZXF1ZXN0IG1heSBhcnJpdmUgbW9yZSB0aGFuIG9uY2UgKGFuZCBzb21ldGltZXMgYXQgdGhlIHNhbWUgdGltZSkuXG4gICAgICpcbiAgICAgKiA8cD5UaGUga2V5IGlzIGNsYWltZWQgd2l0aCBhbiBhdG9taWMgaW5zZXJ0ICh1bmlxdWUgcGVyIGFwcHJvdmVyKSBiZWZvcmUgYW55dGhpbmcgZWxzZSwgc29cbiAgICAgKiBjb25jdXJyZW50IGR1cGxpY2F0ZXMgd2FpdCBmb3IgdGhlIGZpcnN0IHJlcXVlc3QgYW5kIHRoZW4gcmVwbGF5IGl0cyByZXN1bHQuIEEgY2hlY2tlZFxuICAgICAqIHtAbGluayBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbn0gZG9lc24ndCByb2xsIGJhY2sgYnkgZGVmYXVsdDogcm9sbGJhY2tGb3IgbWFrZXMgYSByZWZ1c2VkXG4gICAgICogYXBwcm92YWwgKGFuZCBpdHMga2V5IGNsYWltKSBkaXNhcHBlYXIsIHNvIGEgcmV0cnkgYWZ0ZXIgYSBidWRnZXQgdG9wLXVwIHdvcmtzLlxuICAgICAqL1xuICAgIEBUcmFuc2FjdGlvbmFsKHJvbGxiYWNrRm9yID0gQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24uY2xhc3MpXG4gICAgcHVibGljIFB1cmNoYXNlT3JkZXJEdG8gYXBwcm92ZShsb25nIHBvSWQsIFN0cmluZyBhcHByb3ZlcklkLCBTdHJpbmcgaWRlbXBvdGVuY3lLZXkpXG4gICAgICAgICAgICB0aHJvd3MgQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24ge1xuICAgICAgICBpZiAoaWRlbXBvdGVuY3kuY2xhaW0oaWRlbXBvdGVuY3lLZXksIGFwcHJvdmVySWQsIHBvSWQpID09IDApIHtcbiAgICAgICAgICAgIElkZW1wb3RlbmN5UmVjb3JkIHByZXZpb3VzID0gaWRlbXBvdGVuY3kuZmluZEJ5QXBwcm92ZXJJZEFuZEtleShhcHByb3ZlcklkLCBpZGVtcG90ZW5jeUtleSlcbiAgICAgICAgICAgICAgICAgICAgLm9yRWxzZVRocm93KCk7XG4gICAgICAgICAgICBpZiAocHJldmlvdXMuZ2V0UHVyY2hhc2VPcmRlcklkKCkgIT0gcG9JZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBJZGVtcG90ZW5jeUtleVJldXNlZEV4Y2VwdGlvbihpZGVtcG90ZW5jeUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gUHVyY2hhc2VPcmRlckR0by5mcm9tKGZpbmQocG9JZCkpO1xuICAgICAgICB9XG4gICAgICAgIFB1cmNoYXNlT3JkZXIgcG8gPSBmaW5kKHBvSWQpO1xuICAgICAgICBwby5yZWNvcmRBcHByb3ZhbChhcHByb3ZlcklkKTtcbiAgICAgICAgaWYgKHBvLmdldFN0YXR1cygpID09IFBvU3RhdHVzLkFQUFJPVkVEKSB7XG4gICAgICAgICAgICBidWRnZXQucmVzZXJ2ZShwby5nZXRJZCgpLCBwby5nZXRUb3RhbCgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHVyY2hhc2VPcmRlckR0by5mcm9tKHBvKTtcbiAgICB9XG5cbiAgICAvKiogV2FzIHJlYWQtb25seSAoaW5oZXJpdGVkIGZyb20gdGhlIGNsYXNzKSwgc28gSGliZXJuYXRlIG5ldmVyIGZsdXNoZWQgdGhlIHJlamVjdGlvbi4gKi9cbiAgICBAVHJhbnNhY3Rpb25hbFxuICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyRHRvIHJlamVjdChsb25nIHBvSWQsIFN0cmluZyBhcHByb3ZlcklkLCBTdHJpbmcgcmVhc29uKSB7XG4gICAgICAgIFB1cmNoYXNlT3JkZXIgcG8gPSBmaW5kKHBvSWQpO1xuICAgICAgICBwby5yZWplY3QocmVhc29uKTtcbiAgICAgICAgcmV0dXJuIFB1cmNoYXNlT3JkZXJEdG8uZnJvbShwbyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXBwcm92ZXMgc2V2ZXJhbCBQT3M7IG9uZSBQTyBmYWlsaW5nIChlLmcuIG91dCBvZiBidWRnZXQpIG11c3Qgbm90IGFmZmVjdCB0aGUgb3RoZXJzLlxuICAgICAqXG4gICAgICogPHA+Q2FsbGluZyBhIHtAY29kZSBAVHJhbnNhY3Rpb25hbChSRVFVSVJFU19ORVcpfSBtZXRob2Qgb24ge0Bjb2RlIHRoaXN9IGJ5cGFzc2VzIHRoZSBwcm94eSwgc29cbiAgICAgKiBldmVyeSBQTyB1c2VkIHRvIHJ1biBpbiB0aGUgYmF0Y2gncyB0cmFuc2FjdGlvbjogYSByZWZ1c2VkIFBPJ3MgYXBwcm92YWwgd2FzIGNvbW1pdHRlZCB3aXRoIHRoZVxuICAgICAqIG90aGVycywgYW5kIGFueSBydW50aW1lIGZhaWx1cmUgcm9sbGVkIHRoZSB3aG9sZSBiYXRjaCBiYWNrLiBFYWNoIFBPIG5vdyBnZXRzIGl0cyBvd25cbiAgICAgKiB0cmFuc2FjdGlvbiwgYW5kIHRoZSBiYXRjaCBpdHNlbGYgcnVucyBvdXRzaWRlIG9uZS5cbiAgICAgKi9cbiAgICBAVHJhbnNhY3Rpb25hbChwcm9wYWdhdGlvbiA9IFByb3BhZ2F0aW9uLk5PVF9TVVBQT1JURUQpXG4gICAgcHVibGljIEJhdGNoUmVzdWx0IGFwcHJvdmVCYXRjaChMaXN0PExvbmc+IGlkcywgU3RyaW5nIGFwcHJvdmVySWQpIHtcbiAgICAgICAgQmF0Y2hSZXN1bHQgcmVzdWx0ID0gbmV3IEJhdGNoUmVzdWx0KCk7XG4gICAgICAgIGZvciAoTG9uZyBpZCA6IGlkcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBTdHJpbmcgcmVmdXNhbCA9IHBlclBvLmV4ZWN1dGUoc3RhdHVzIC0+IGFwcHJvdmVPbmUoaWQsIGFwcHJvdmVySWQsIHN0YXR1cykpO1xuICAgICAgICAgICAgICAgIGlmIChyZWZ1c2FsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmFwcHJvdmVkKGlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZmFpbGVkKGlkLCByZWZ1c2FsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChQb05vdEZvdW5kRXhjZXB0aW9uIHwgSWxsZWdhbFN0YXRlRXhjZXB0aW9uIHwgT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uIGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuZmFpbGVkKGlkLCBlLmdldE1lc3NhZ2UoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKiogUnVucyBpbiB0aGUgUE8ncyBvd24gdHJhbnNhY3Rpb24uIFJldHVybnMgd2h5IHRoZSBidWRnZXQgcmVmdXNlZCBpdCAoYWZ0ZXIgcm9sbGluZyBiYWNrKSwgb3IgbnVsbC4gKi9cbiAgICBwcml2YXRlIFN0cmluZyBhcHByb3ZlT25lKGxvbmcgaWQsIFN0cmluZyBhcHByb3ZlcklkLCBUcmFuc2FjdGlvblN0YXR1cyBzdGF0dXMpIHtcbiAgICAgICAgUHVyY2hhc2VPcmRlciBwbyA9IGZpbmQoaWQpO1xuICAgICAgICBwby5yZWNvcmRBcHByb3ZhbChhcHByb3ZlcklkKTtcbiAgICAgICAgaWYgKHBvLmdldFN0YXR1cygpID09IFBvU3RhdHVzLkFQUFJPVkVEKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGJ1ZGdldC5yZXNlcnZlKGlkLCBwby5nZXRUb3RhbCgpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uIGUpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMuc2V0Um9sbGJhY2tPbmx5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGUuZ2V0TWVzc2FnZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgUHVyY2hhc2VPcmRlciBmaW5kKGxvbmcgaWQpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVycy5maW5kQnlJZChpZCkub3JFbHNlVGhyb3coKCkgLT4gbmV3IFBvTm90Rm91bmRFeGNlcHRpb24oaWQpKTtcbiAgICB9XG59XG4ifSx7InBhdGgiOiJzcmMvbWFpbi9qYXZhL2NvbS96eWN1cy9wcm9jdXJlbWVudC9wby9QdXJjaGFzZU9yZGVyQ29udHJvbGxlci5qYXZhIiwiY29udGVudCI6InBhY2thZ2UgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvO1xuXG5pbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuQmF0Y2hSZXF1ZXN0O1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkJhdGNoUmVzdWx0O1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkludm9pY2VSZXF1ZXN0O1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLk1hdGNoUmVzdWx0O1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLlB1cmNoYXNlT3JkZXJEdG87XG5pbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuUmVqZWN0UmVxdWVzdDtcbmltcG9ydCBqYXZhLnNlY3VyaXR5LlByaW5jaXBhbDtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlBhZ2U7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmRvbWFpbi5QYWdlUmVxdWVzdDtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlNvcnQ7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLkdldE1hcHBpbmc7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLlBhdGhWYXJpYWJsZTtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUG9zdE1hcHBpbmc7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLlJlcXVlc3RCb2R5O1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5SZXF1ZXN0SGVhZGVyO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5SZXF1ZXN0TWFwcGluZztcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUmVxdWVzdFBhcmFtO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5SZXN0Q29udHJvbGxlcjtcblxuQFJlc3RDb250cm9sbGVyXG5AUmVxdWVzdE1hcHBpbmcoXCIvYXBpL3Bvc1wiKVxucHVibGljIGNsYXNzIFB1cmNoYXNlT3JkZXJDb250cm9sbGVyIHtcblxuICAgIC8qKiBOZXdlc3QgZmlyc3Q7IHRoZSBpZCBicmVha3MgdGllcyBzbyB0aGUgb3JkZXIgKGFuZCBzbyB0aGUgcGFnZXMpIGlzIHN0YWJsZS4gKi9cbiAgICBwcml2YXRlIHN0YXRpYyBmaW5hbCBTb3J0IE5FV0VTVF9GSVJTVCA9IFNvcnQuYnkoU29ydC5PcmRlci5kZXNjKFwiY3JlYXRlZEF0XCIpLCBTb3J0Lk9yZGVyLmRlc2MoXCJpZFwiKSk7XG5cbiAgICBwcml2YXRlIGZpbmFsIEFwcHJvdmFsU2VydmljZSBhcHByb3ZhbHM7XG4gICAgcHJpdmF0ZSBmaW5hbCBQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBvcmRlcnM7XG4gICAgcHJpdmF0ZSBmaW5hbCBJbnZvaWNlTWF0Y2hlciBtYXRjaGVyO1xuXG4gICAgcHVibGljIFB1cmNoYXNlT3JkZXJDb250cm9sbGVyKEFwcHJvdmFsU2VydmljZSBhcHByb3ZhbHMsIFB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IG9yZGVycywgSW52b2ljZU1hdGNoZXIgbWF0Y2hlcikge1xuICAgICAgICB0aGlzLmFwcHJvdmFscyA9IGFwcHJvdmFscztcbiAgICAgICAgdGhpcy5vcmRlcnMgPSBvcmRlcnM7XG4gICAgICAgIHRoaXMubWF0Y2hlciA9IG1hdGNoZXI7XG4gICAgfVxuXG4gICAgLyoqIFRoZSBpbmJveCwgbmV3ZXN0IGZpcnN0LiBQYWdlcyBhcmUgbnVtYmVyZWQgZnJvbSAxICh0aGUgbW9iaWxlIGFwcCdzIGNvbnRyYWN0KS4gKi9cbiAgICBAR2V0TWFwcGluZ1xuICAgIHB1YmxpYyBQYWdlPFB1cmNoYXNlT3JkZXJEdG8+IGxpc3QoQFJlcXVlc3RQYXJhbShkZWZhdWx0VmFsdWUgPSBcIjFcIikgaW50IHBhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAUmVxdWVzdFBhcmFtKGRlZmF1bHRWYWx1ZSA9IFwiMjBcIikgaW50IHNpemUpIHtcbiAgICAgICAgaWYgKHBhZ2UgPCAxIHx8IHNpemUgPCAxIHx8IHNpemUgPiAxMDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBJbGxlZ2FsQXJndW1lbnRFeGNlcHRpb24oXCJwYWdlIHN0YXJ0cyBhdCAxIGFuZCBzaXplIG11c3QgYmUgYmV0d2VlbiAxIGFuZCAxMDBcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUGFnZVJlcXVlc3QgaXMgMC1iYXNlZDogcGFnZSAxIHVzZWQgdG8gcmV0dXJuIHRoZSBzZWNvbmQgcGFnZS5cbiAgICAgICAgcmV0dXJuIGFwcHJvdmFscy5saXN0KFBhZ2VSZXF1ZXN0Lm9mKHBhZ2UgLSAxLCBzaXplLCBORVdFU1RfRklSU1QpKTtcbiAgICB9XG5cbiAgICBAUG9zdE1hcHBpbmcoXCIve2lkfS9hcHByb3ZlXCIpXG4gICAgcHVibGljIFB1cmNoYXNlT3JkZXJEdG8gYXBwcm92ZShAUGF0aFZhcmlhYmxlIGxvbmcgaWQsIEBSZXF1ZXN0SGVhZGVyKFwiSWRlbXBvdGVuY3ktS2V5XCIpIFN0cmluZyBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcmluY2lwYWwgdXNlcikgdGhyb3dzIEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uIHtcbiAgICAgICAgcmV0dXJuIGFwcHJvdmFscy5hcHByb3ZlKGlkLCB1c2VyLmdldE5hbWUoKSwga2V5KTtcbiAgICB9XG5cbiAgICBAUG9zdE1hcHBpbmcoXCIve2lkfS9yZWplY3RcIilcbiAgICBwdWJsaWMgUHVyY2hhc2VPcmRlckR0byByZWplY3QoQFBhdGhWYXJpYWJsZSBsb25nIGlkLCBAUmVxdWVzdEJvZHkgUmVqZWN0UmVxdWVzdCBib2R5LCBQcmluY2lwYWwgdXNlcikge1xuICAgICAgICByZXR1cm4gYXBwcm92YWxzLnJlamVjdChpZCwgdXNlci5nZXROYW1lKCksIGJvZHkucmVhc29uKCkpO1xuICAgIH1cblxuICAgIEBQb3N0TWFwcGluZyhcIi9hcHByb3ZlLWJhdGNoXCIpXG4gICAgcHVibGljIEJhdGNoUmVzdWx0IGFwcHJvdmVCYXRjaChAUmVxdWVzdEJvZHkgQmF0Y2hSZXF1ZXN0IGJvZHksIFByaW5jaXBhbCB1c2VyKSB7XG4gICAgICAgIHJldHVybiBhcHByb3ZhbHMuYXBwcm92ZUJhdGNoKGJvZHkuaWRzKCksIHVzZXIuZ2V0TmFtZSgpKTtcbiAgICB9XG5cbiAgICBAUG9zdE1hcHBpbmcoXCIve2lkfS9tYXRjaC1pbnZvaWNlXCIpXG4gICAgcHVibGljIE1hdGNoUmVzdWx0IG1hdGNoSW52b2ljZShAUGF0aFZhcmlhYmxlIGxvbmcgaWQsIEBSZXF1ZXN0Qm9keSBJbnZvaWNlUmVxdWVzdCBpbnZvaWNlKSB7XG4gICAgICAgIC8vIG9wZW4taW4tdmlldyBpcyBvZmY6IGZpbmRCeUlkIHJldHVybmVkIGEgZGV0YWNoZWQgUE8gYW5kIHJlYWRpbmcgaXRzIGxhenkgbGluZXMgdGhyZXdcbiAgICAgICAgLy8gTGF6eUluaXRpYWxpemF0aW9uRXhjZXB0aW9uICg1MDApLlxuICAgICAgICBQdXJjaGFzZU9yZGVyIHBvID0gb3JkZXJzLmZpbmRXaXRoTGluZXNCeUlkKGlkKS5vckVsc2VUaHJvdygoKSAtPiBuZXcgUG9Ob3RGb3VuZEV4Y2VwdGlvbihpZCkpO1xuICAgICAgICByZXR1cm4gbWF0Y2hlci5tYXRjaChwbywgaW52b2ljZSk7XG4gICAgfVxufVxuIn0seyJwYXRoIjoic3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vSW52b2ljZU1hdGNoZXIuamF2YSIsImNvbnRlbnQiOiJwYWNrYWdlIGNvbS56eWN1cy5wcm9jdXJlbWVudC5wbztcblxuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkludm9pY2VMaW5lO1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkludm9pY2VSZXF1ZXN0O1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLk1hdGNoUmVzdWx0O1xuaW1wb3J0IGphdmEudXRpbC5BcnJheUxpc3Q7XG5pbXBvcnQgamF2YS51dGlsLkxpbmtlZEhhc2hNYXA7XG5pbXBvcnQgamF2YS51dGlsLkxpc3Q7XG5pbXBvcnQgamF2YS51dGlsLk1hcDtcbmltcG9ydCBqYXZhLnV0aWwuZnVuY3Rpb24uRnVuY3Rpb247XG5pbXBvcnQgamF2YS51dGlsLnN0cmVhbS5Db2xsZWN0b3JzO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuc3RlcmVvdHlwZS5Db21wb25lbnQ7XG5cbi8qKiBUd28td2F5IG1hdGNoOiB0aGUgaW52b2ljZSBtdXN0IGFncmVlIHdpdGggdGhlIFBPIG9uIHRvdGFsIGFuZCBvbiBldmVyeSBsaW5lLiAqL1xuQENvbXBvbmVudFxucHVibGljIGNsYXNzIEludm9pY2VNYXRjaGVyIHtcblxuICAgIC8qKlxuICAgICAqIEFtb3VudHMgYXJlIGNvbXBhcmVkIHdpdGgge0Bjb2RlIGNvbXBhcmVUb306IHtAY29kZSBCaWdEZWNpbWFsLmVxdWFsc30gYWxzbyBjb21wYXJlcyB0aGUgc2NhbGUsXG4gICAgICogc28gMTUwMC4wIGFuZCAxNTAwLjAwIHdlcmUgXCJkaWZmZXJlbnRcIi4gUXVhbnRpdGllcyBhcmUgYWRkZWQgdXAgcGVyIFNLVSwgYmVjYXVzZSBhbiBpbnZvaWNlIG1heVxuICAgICAqIHNwbGl0IG9uZSBTS1Ugb3ZlciBzZXZlcmFsIGxpbmVzICg1ICsgNSBhZ2FpbnN0IDggb3JkZXJlZCBwYXNzZWQgbGluZSBieSBsaW5lKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgTWF0Y2hSZXN1bHQgbWF0Y2goUHVyY2hhc2VPcmRlciBwbywgSW52b2ljZVJlcXVlc3QgaW52b2ljZSkge1xuICAgICAgICBMaXN0PFN0cmluZz4gcHJvYmxlbXMgPSBuZXcgQXJyYXlMaXN0PD4oKTtcbiAgICAgICAgaWYgKHBvLmdldFRvdGFsKCkuY29tcGFyZVRvKGludm9pY2UuYW1vdW50KCkpICE9IDApIHtcbiAgICAgICAgICAgIHByb2JsZW1zLmFkZChcIkludm9pY2UgYW1vdW50IFwiICsgaW52b2ljZS5hbW91bnQoKSArIFwiIGRpZmZlcnMgZnJvbSBQTyB0b3RhbCBcIiArIHBvLmdldFRvdGFsKCkpO1xuICAgICAgICB9XG4gICAgICAgIE1hcDxTdHJpbmcsIFB1cmNoYXNlT3JkZXJMaW5lPiBieVNrdSA9IHBvLmdldExpbmVzKCkuc3RyZWFtKClcbiAgICAgICAgICAgICAgICAuY29sbGVjdChDb2xsZWN0b3JzLnRvTWFwKFB1cmNoYXNlT3JkZXJMaW5lOjpnZXRTa3UsIEZ1bmN0aW9uLmlkZW50aXR5KCkpKTtcbiAgICAgICAgTWFwPFN0cmluZywgSW50ZWdlcj4gaW52b2ljZWQgPSBuZXcgTGlua2VkSGFzaE1hcDw+KCk7XG4gICAgICAgIGZvciAoSW52b2ljZUxpbmUgbGluZSA6IGludm9pY2UubGluZXMoKSkge1xuICAgICAgICAgICAgUHVyY2hhc2VPcmRlckxpbmUgcG9MaW5lID0gYnlTa3UuZ2V0KGxpbmUuc2t1KCkpO1xuICAgICAgICAgICAgaWYgKHBvTGluZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcHJvYmxlbXMuYWRkKFwiU0tVIFwiICsgbGluZS5za3UoKSArIFwiIGlzIG5vdCBvbiB0aGUgUE9cIik7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocG9MaW5lLmdldFVuaXRQcmljZSgpLmNvbXBhcmVUbyhsaW5lLnVuaXRQcmljZSgpKSAhPSAwKSB7XG4gICAgICAgICAgICAgICAgcHJvYmxlbXMuYWRkKFwiU0tVIFwiICsgbGluZS5za3UoKSArIFwiOiB1bml0IHByaWNlIGRpZmZlcnNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnZvaWNlZC5tZXJnZShsaW5lLnNrdSgpLCBsaW5lLnF1YW50aXR5KCksIEludGVnZXI6OnN1bSk7XG4gICAgICAgIH1cbiAgICAgICAgaW52b2ljZWQuZm9yRWFjaCgoc2t1LCBxdWFudGl0eSkgLT4ge1xuICAgICAgICAgICAgaW50IG9yZGVyZWQgPSBieVNrdS5nZXQoc2t1KS5nZXRRdWFudGl0eSgpO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5ID4gb3JkZXJlZCkge1xuICAgICAgICAgICAgICAgIHByb2JsZW1zLmFkZChcIlNLVSBcIiArIHNrdSArIFwiOiBpbnZvaWNlZCBcIiArIHF1YW50aXR5ICsgXCIsIG9yZGVyZWQgXCIgKyBvcmRlcmVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBNYXRjaFJlc3VsdC5vZihwcm9ibGVtcyk7XG4gICAgfVxufVxuIn0seyJwYXRoIjoic3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vUHVyY2hhc2VPcmRlclJlcG9zaXRvcnkuamF2YSIsImNvbnRlbnQiOiJwYWNrYWdlIGNvbS56eWN1cy5wcm9jdXJlbWVudC5wbztcblxuaW1wb3J0IGphdmEudXRpbC5Db2xsZWN0aW9uO1xuaW1wb3J0IGphdmEudXRpbC5MaXN0O1xuaW1wb3J0IGphdmEudXRpbC5PcHRpb25hbDtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlBhZ2U7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmRvbWFpbi5QYWdlYWJsZTtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuanBhLnJlcG9zaXRvcnkuRW50aXR5R3JhcGg7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmpwYS5yZXBvc2l0b3J5LkpwYVJlcG9zaXRvcnk7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmpwYS5yZXBvc2l0b3J5LlF1ZXJ5O1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5yZXBvc2l0b3J5LnF1ZXJ5LlBhcmFtO1xuXG5wdWJsaWMgaW50ZXJmYWNlIFB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IGV4dGVuZHMgSnBhUmVwb3NpdG9yeTxQdXJjaGFzZU9yZGVyLCBMb25nPiB7XG5cbiAgICAvKipcbiAgICAgKiBPbmUgcGFnZSBvZiB0aGUgaW5ib3gsIGlkcyBvbmx5LCBzbyB0aGUgZGF0YWJhc2UgYXBwbGllcyBsaW1pdC9vZmZzZXQgYW5kIHRoZSBzb3J0LiAoUGFnaW5nIGFcbiAgICAgKiB7QGNvZGUgam9pbiBmZXRjaH0gb2YgYSBjb2xsZWN0aW9uIGNhbid0IGJlIGRvbmUgaW4gU1FMOiBIaWJlcm5hdGUgbG9hZGVkIGV2ZXJ5IFBPIGFuZCBwYWdlZCBpblxuICAgICAqIG1lbW9yeSwgSEhIOTAwMDMwMDQuKVxuICAgICAqL1xuICAgIEBRdWVyeShcInNlbGVjdCBwLmlkIGZyb20gUHVyY2hhc2VPcmRlciBwXCIpXG4gICAgUGFnZTxMb25nPiBmaW5kUGFnZUlkcyhQYWdlYWJsZSBwYWdlYWJsZSk7XG5cbiAgICAvKiogVGhlIFBPcyBvZiBvbmUgcGFnZSB3aXRoIHRoZWlyIGxpbmVzLCBpbiBvbmUgcXVlcnkuICovXG4gICAgQFF1ZXJ5KFwic2VsZWN0IGRpc3RpbmN0IHAgZnJvbSBQdXJjaGFzZU9yZGVyIHAgbGVmdCBqb2luIGZldGNoIHAubGluZXMgd2hlcmUgcC5pZCBpbiA6aWRzXCIpXG4gICAgTGlzdDxQdXJjaGFzZU9yZGVyPiBmaW5kQWxsV2l0aExpbmVzKEBQYXJhbShcImlkc1wiKSBDb2xsZWN0aW9uPExvbmc+IGlkcyk7XG5cbiAgICAvKiogRm9yIGNhbGxlcnMgb3V0c2lkZSBhIHRyYW5zYWN0aW9uIChvcGVuLWluLXZpZXcgaXMgb2ZmKTogbG9hZHMgdGhlIGxpbmVzIHRvby4gKi9cbiAgICBARW50aXR5R3JhcGgoYXR0cmlidXRlUGF0aHMgPSBcImxpbmVzXCIpXG4gICAgT3B0aW9uYWw8UHVyY2hhc2VPcmRlcj4gZmluZFdpdGhMaW5lc0J5SWQobG9uZyBpZCk7XG59XG4ifSx7InBhdGgiOiJzcmMvbWFpbi9qYXZhL2NvbS96eWN1cy9wcm9jdXJlbWVudC9wby9JZGVtcG90ZW5jeVJlY29yZFJlcG9zaXRvcnkuamF2YSIsImNvbnRlbnQiOiJwYWNrYWdlIGNvbS56eWN1cy5wcm9jdXJlbWVudC5wbztcblxuaW1wb3J0IGphdmEudXRpbC5PcHRpb25hbDtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuanBhLnJlcG9zaXRvcnkuSnBhUmVwb3NpdG9yeTtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuanBhLnJlcG9zaXRvcnkuTW9kaWZ5aW5nO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5qcGEucmVwb3NpdG9yeS5RdWVyeTtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEucmVwb3NpdG9yeS5xdWVyeS5QYXJhbTtcblxucHVibGljIGludGVyZmFjZSBJZGVtcG90ZW5jeVJlY29yZFJlcG9zaXRvcnkgZXh0ZW5kcyBKcGFSZXBvc2l0b3J5PElkZW1wb3RlbmN5UmVjb3JkLCBMb25nPiB7XG5cbiAgICAvKipcbiAgICAgKiBDbGFpbXMgdGhlIGtleSBmb3IgdGhpcyBhcHByb3ZlcjogMSBpZiB0aGlzIHJlcXVlc3Qgb3ducyBpdCwgMCBpZiBhbm90aGVyIHJlcXVlc3QgYWxyZWFkeVxuICAgICAqIGNsYWltZWQgaXQuIFdoaWxlIHRoYXQgb3RoZXIgcmVxdWVzdCBpcyBzdGlsbCBydW5uaW5nLCBQb3N0Z3JlU1FMIG1ha2VzIHRoaXMgaW5zZXJ0IHdhaXQgZm9yXG4gICAgICogaXQsIHNvIGEgZHVwbGljYXRlIG5ldmVyIHJ1bnMgYXQgdGhlIHNhbWUgdGltZSBhcyB0aGUgb3JpZ2luYWwuXG4gICAgICovXG4gICAgQE1vZGlmeWluZ1xuICAgIEBRdWVyeShuYXRpdmVRdWVyeSA9IHRydWUsIHZhbHVlID0gXCJcIlwiXG4gICAgICAgICAgICBpbnNlcnQgaW50byBpZGVtcG90ZW5jeV9yZWNvcmRzIChpZGVtX2tleSwgYXBwcm92ZXJfaWQsIHB1cmNoYXNlX29yZGVyX2lkLCBjcmVhdGVkX2F0KVxuICAgICAgICAgICAgdmFsdWVzICg6a2V5LCA6YXBwcm92ZXJJZCwgOnBvSWQsIG5vdygpKVxuICAgICAgICAgICAgb24gY29uZmxpY3QgKGFwcHJvdmVyX2lkLCBpZGVtX2tleSkgZG8gbm90aGluZ1wiXCJcIilcbiAgICBpbnQgY2xhaW0oQFBhcmFtKFwia2V5XCIpIFN0cmluZyBrZXksIEBQYXJhbShcImFwcHJvdmVySWRcIikgU3RyaW5nIGFwcHJvdmVySWQsIEBQYXJhbShcInBvSWRcIikgbG9uZyBwb0lkKTtcblxuICAgIE9wdGlvbmFsPElkZW1wb3RlbmN5UmVjb3JkPiBmaW5kQnlBcHByb3ZlcklkQW5kS2V5KFN0cmluZyBhcHByb3ZlcklkLCBTdHJpbmcga2V5KTtcbn1cbiJ9LHsicGF0aCI6InNyYy9tYWluL2phdmEvY29tL3p5Y3VzL3Byb2N1cmVtZW50L3BvL1B1cmNoYXNlT3JkZXIuamF2YSIsImNvbnRlbnQiOiJwYWNrYWdlIGNvbS56eWN1cy5wcm9jdXJlbWVudC5wbztcblxuaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuQ2FzY2FkZVR5cGU7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Db2xsZWN0aW9uVGFibGU7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Db2x1bW47XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5FbGVtZW50Q29sbGVjdGlvbjtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkVudGl0eTtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkVudW1UeXBlO1xuaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuRW51bWVyYXRlZDtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkZldGNoVHlwZTtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkdlbmVyYXRlZFZhbHVlO1xuaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuR2VuZXJhdGlvblR5cGU7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5JZDtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkpvaW5Db2x1bW47XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5PbmVUb01hbnk7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5UYWJsZTtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLlZlcnNpb247XG5pbXBvcnQgamF2YS5tYXRoLkJpZ0RlY2ltYWw7XG5pbXBvcnQgamF2YS50aW1lLkluc3RhbnQ7XG5pbXBvcnQgamF2YS51dGlsLkFycmF5TGlzdDtcbmltcG9ydCBqYXZhLnV0aWwuSGFzaFNldDtcbmltcG9ydCBqYXZhLnV0aWwuTGlzdDtcbmltcG9ydCBqYXZhLnV0aWwuU2V0O1xuXG5ARW50aXR5XG5AVGFibGUobmFtZSA9IFwicHVyY2hhc2Vfb3JkZXJzXCIpXG5wdWJsaWMgY2xhc3MgUHVyY2hhc2VPcmRlciB7XG5cbiAgICBASWRcbiAgICBAR2VuZXJhdGVkVmFsdWUoc3RyYXRlZ3kgPSBHZW5lcmF0aW9uVHlwZS5JREVOVElUWSlcbiAgICBwcml2YXRlIExvbmcgaWQ7XG5cbiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UsIHVuaXF1ZSA9IHRydWUpXG4gICAgcHJpdmF0ZSBTdHJpbmcgbnVtYmVyO1xuXG4gICAgQEVudW1lcmF0ZWQoRW51bVR5cGUuU1RSSU5HKVxuICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSlcbiAgICBwcml2YXRlIFBvU3RhdHVzIHN0YXR1cyA9IFBvU3RhdHVzLlBFTkRJTkc7XG5cbiAgICAvKiogVG90YWwgaW4gSU5SLCBzY2FsZSAyLiAqL1xuICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSwgcHJlY2lzaW9uID0gMTQsIHNjYWxlID0gMilcbiAgICBwcml2YXRlIEJpZ0RlY2ltYWwgdG90YWw7XG5cbiAgICAvKiogUE9zIGFib3ZlIOKCuTEwLDAwLDAwMCBuZWVkIHR3byBkaXN0aW5jdCBhcHByb3ZlcnMuICovXG4gICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKVxuICAgIHByaXZhdGUgaW50IGFwcHJvdmFsc1JlcXVpcmVkO1xuXG4gICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKVxuICAgIHByaXZhdGUgaW50IGFwcHJvdmFsc1JlY2VpdmVkO1xuXG4gICAgLyoqXG4gICAgICogV2hvIGFwcHJvdmVkLiBBIGNvdW50ZXIgYWxvbmUgbGV0IG9uZSBwZXJzb24gZ2l2ZSBib3RoIGFwcHJvdmFscyBvZiBhIGhpZ2gtdmFsdWUgUE8uXG4gICAgICogTWlncmF0aW9uOiBjcmVhdGUgdGFibGUgcHVyY2hhc2Vfb3JkZXJfYXBwcm92YWxzIChwdXJjaGFzZV9vcmRlcl9pZCwgYXBwcm92ZXJfaWQsIHByaW1hcnkga2V5IGJvdGgpLlxuICAgICAqL1xuICAgIEBFbGVtZW50Q29sbGVjdGlvblxuICAgIEBDb2xsZWN0aW9uVGFibGUobmFtZSA9IFwicHVyY2hhc2Vfb3JkZXJfYXBwcm92YWxzXCIsIGpvaW5Db2x1bW5zID0gQEpvaW5Db2x1bW4obmFtZSA9IFwicHVyY2hhc2Vfb3JkZXJfaWRcIikpXG4gICAgQENvbHVtbihuYW1lID0gXCJhcHByb3Zlcl9pZFwiLCBudWxsYWJsZSA9IGZhbHNlKVxuICAgIHByaXZhdGUgU2V0PFN0cmluZz4gYXBwcm92ZWRCeSA9IG5ldyBIYXNoU2V0PD4oKTtcblxuICAgIC8qKlxuICAgICAqIE9wdGltaXN0aWMgbG9ja2luZzogd2l0aG91dCBpdCB0d28gYXBwcm92ZXJzIGRlY2lkaW5nIGF0IHRoZSBzYW1lIG1vbWVudCBib3RoIHJlYWQgdGhlIHNhbWVcbiAgICAgKiBzdGF0ZSBhbmQgdGhlIGxhc3Qgd3JpdGUgd2lucyAoYW4gYXBwcm92YWwgbG9zdCwgb3IgYXBwcm92ZWQgdHdpY2UgYW5kIGJ1ZGdldCByZXNlcnZlZCB0d2ljZSkuXG4gICAgICogVGhlIGxvc2VyIGdldHMgYW4gT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uLCBtYXBwZWQgdG8gNDA5LiBNaWdyYXRpb246IGFkZCBjb2x1bW5cbiAgICAgKiB2ZXJzaW9uIGJpZ2ludCBub3QgbnVsbCBkZWZhdWx0IDAuXG4gICAgICovXG4gICAgQFZlcnNpb25cbiAgICBwcml2YXRlIGxvbmcgdmVyc2lvbjtcblxuICAgIHByaXZhdGUgU3RyaW5nIHJlamVjdGlvblJlYXNvbjtcblxuICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSlcbiAgICBwcml2YXRlIEluc3RhbnQgY3JlYXRlZEF0ID0gSW5zdGFudC5ub3coKTtcblxuICAgIEBPbmVUb01hbnkobWFwcGVkQnkgPSBcInB1cmNoYXNlT3JkZXJcIiwgY2FzY2FkZSA9IENhc2NhZGVUeXBlLkFMTCwgb3JwaGFuUmVtb3ZhbCA9IHRydWUsIGZldGNoID0gRmV0Y2hUeXBlLkxBWlkpXG4gICAgcHJpdmF0ZSBMaXN0PFB1cmNoYXNlT3JkZXJMaW5lPiBsaW5lcyA9IG5ldyBBcnJheUxpc3Q8PigpO1xuXG4gICAgcHJvdGVjdGVkIFB1cmNoYXNlT3JkZXIoKSB7XG4gICAgfVxuXG4gICAgcHVibGljIFB1cmNoYXNlT3JkZXIoU3RyaW5nIG51bWJlciwgQmlnRGVjaW1hbCB0b3RhbCkge1xuICAgICAgICB0aGlzLm51bWJlciA9IG51bWJlcjtcbiAgICAgICAgdGhpcy50b3RhbCA9IHRvdGFsO1xuICAgICAgICB0aGlzLmFwcHJvdmFsc1JlcXVpcmVkID0gdG90YWwuY29tcGFyZVRvKG5ldyBCaWdEZWNpbWFsKFwiMTAwMDAwMC4wMFwiKSkgPiAwID8gMiA6IDE7XG4gICAgfVxuXG4gICAgcHVibGljIHZvaWQgcmVjb3JkQXBwcm92YWwoU3RyaW5nIGFwcHJvdmVySWQpIHtcbiAgICAgICAgaWYgKHN0YXR1cyAhPSBQb1N0YXR1cy5QRU5ESU5HKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgSWxsZWdhbFN0YXRlRXhjZXB0aW9uKFwiUE8gXCIgKyBudW1iZXIgKyBcIiBpcyBcIiArIHN0YXR1cyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhcHByb3ZlZEJ5LmFkZChhcHByb3ZlcklkKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IElsbGVnYWxTdGF0ZUV4Y2VwdGlvbihhcHByb3ZlcklkICsgXCIgaGFzIGFscmVhZHkgYXBwcm92ZWQgUE8gXCIgKyBudW1iZXIpO1xuICAgICAgICB9XG4gICAgICAgIGFwcHJvdmFsc1JlY2VpdmVkID0gYXBwcm92ZWRCeS5zaXplKCk7XG4gICAgICAgIGlmIChhcHByb3ZhbHNSZWNlaXZlZCA+PSBhcHByb3ZhbHNSZXF1aXJlZCkge1xuICAgICAgICAgICAgc3RhdHVzID0gUG9TdGF0dXMuQVBQUk9WRUQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgdm9pZCByZWplY3QoU3RyaW5nIHJlYXNvbikge1xuICAgICAgICBpZiAoc3RhdHVzICE9IFBvU3RhdHVzLlBFTkRJTkcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBJbGxlZ2FsU3RhdGVFeGNlcHRpb24oXCJQTyBcIiArIG51bWJlciArIFwiIGlzIFwiICsgc3RhdHVzKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0dXMgPSBQb1N0YXR1cy5SRUpFQ1RFRDtcbiAgICAgICAgcmVqZWN0aW9uUmVhc29uID0gcmVhc29uO1xuICAgIH1cblxuICAgIHB1YmxpYyB2b2lkIGFkZExpbmUoUHVyY2hhc2VPcmRlckxpbmUgbGluZSkge1xuICAgICAgICBsaW5lcy5hZGQobGluZSk7XG4gICAgICAgIGxpbmUuc2V0UHVyY2hhc2VPcmRlcih0aGlzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgTG9uZyBnZXRJZCgpIHtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIHB1YmxpYyBTdHJpbmcgZ2V0TnVtYmVyKCkge1xuICAgICAgICByZXR1cm4gbnVtYmVyO1xuICAgIH1cblxuICAgIHB1YmxpYyBQb1N0YXR1cyBnZXRTdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfVxuXG4gICAgcHVibGljIEJpZ0RlY2ltYWwgZ2V0VG90YWwoKSB7XG4gICAgICAgIHJldHVybiB0b3RhbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW50IGdldEFwcHJvdmFsc1JlcXVpcmVkKCkge1xuICAgICAgICByZXR1cm4gYXBwcm92YWxzUmVxdWlyZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGludCBnZXRBcHByb3ZhbHNSZWNlaXZlZCgpIHtcbiAgICAgICAgcmV0dXJuIGFwcHJvdmFsc1JlY2VpdmVkO1xuICAgIH1cblxuICAgIHB1YmxpYyBTdHJpbmcgZ2V0UmVqZWN0aW9uUmVhc29uKCkge1xuICAgICAgICByZXR1cm4gcmVqZWN0aW9uUmVhc29uO1xuICAgIH1cblxuICAgIHB1YmxpYyBJbnN0YW50IGdldENyZWF0ZWRBdCgpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZWRBdDtcbiAgICB9XG5cbiAgICBwdWJsaWMgTGlzdDxQdXJjaGFzZU9yZGVyTGluZT4gZ2V0TGluZXMoKSB7XG4gICAgICAgIHJldHVybiBsaW5lcztcbiAgICB9XG59XG4ifSx7InBhdGgiOiJzcmMvbWFpbi9qYXZhL2NvbS96eWN1cy9wcm9jdXJlbWVudC9wby9JZGVtcG90ZW5jeVJlY29yZC5qYXZhIiwiY29udGVudCI6InBhY2thZ2UgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvO1xuXG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Db2x1bW47XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5FbnRpdHk7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5HZW5lcmF0ZWRWYWx1ZTtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkdlbmVyYXRpb25UeXBlO1xuaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuSWQ7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5UYWJsZTtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLlVuaXF1ZUNvbnN0cmFpbnQ7XG5pbXBvcnQgamF2YS50aW1lLkluc3RhbnQ7XG5cbi8qKlxuICogUmVtZW1iZXJzIHdoaWNoIFBPIGFuIElkZW1wb3RlbmN5LUtleSB3YXMgdXNlZCBmb3IsIHNvIGEgcmV0cnkgKHRoZSBtb2JpbGUgYXBwIHJldHJpZXMgb25cbiAqIHRpbWVvdXRzKSByZXBsYXlzIHRoZSByZXN1bHQgaW5zdGVhZCBvZiBhcHByb3ZpbmcgdHdpY2UuXG4gKlxuICogPHA+S2V5cyBhcmUgZ2VuZXJhdGVkIGJ5IHRoZSBjbGllbnQgYW5kIGFyZSBvbmx5IHVuaXF1ZSBwZXIgdXNlciwgc28gdGhlIHVuaXF1ZSBjb25zdHJhaW50IGlzXG4gKiAoYXBwcm92ZXJfaWQsIGlkZW1fa2V5KS4gSXQgaXMgd2hhdCBtYWtlcyB7QGxpbmsgSWRlbXBvdGVuY3lSZWNvcmRSZXBvc2l0b3J5I2NsYWltfSBhdG9taWMuXG4gKiBNaWdyYXRpb246IHtAY29kZSBjcmVhdGUgdW5pcXVlIGluZGV4IHVrX2lkZW1wb3RlbmN5X2FwcHJvdmVyX2tleSBvbiBpZGVtcG90ZW5jeV9yZWNvcmRzXG4gKiAoYXBwcm92ZXJfaWQsIGlkZW1fa2V5KX0gYW5kIHtAY29kZSBhbHRlciB0YWJsZSBpZGVtcG90ZW5jeV9yZWNvcmRzIGRyb3AgY29sdW1uIHJlc3BvbnNlX3N0YXR1c31cbiAqIChyZXBsYXlzIHJldHVybiB0aGUgUE8ncyBjdXJyZW50IHN0YXRlKS5cbiAqL1xuQEVudGl0eVxuQFRhYmxlKG5hbWUgPSBcImlkZW1wb3RlbmN5X3JlY29yZHNcIixcbiAgICAgICB1bmlxdWVDb25zdHJhaW50cyA9IEBVbmlxdWVDb25zdHJhaW50KG5hbWUgPSBcInVrX2lkZW1wb3RlbmN5X2FwcHJvdmVyX2tleVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uTmFtZXMgPSB7XCJhcHByb3Zlcl9pZFwiLCBcImlkZW1fa2V5XCJ9KSlcbnB1YmxpYyBjbGFzcyBJZGVtcG90ZW5jeVJlY29yZCB7XG5cbiAgICBASWRcbiAgICBAR2VuZXJhdGVkVmFsdWUoc3RyYXRlZ3kgPSBHZW5lcmF0aW9uVHlwZS5JREVOVElUWSlcbiAgICBwcml2YXRlIExvbmcgaWQ7XG5cbiAgICBAQ29sdW1uKG5hbWUgPSBcImlkZW1fa2V5XCIsIG51bGxhYmxlID0gZmFsc2UpXG4gICAgcHJpdmF0ZSBTdHJpbmcga2V5O1xuXG4gICAgQENvbHVtbihuYW1lID0gXCJhcHByb3Zlcl9pZFwiLCBudWxsYWJsZSA9IGZhbHNlKVxuICAgIHByaXZhdGUgU3RyaW5nIGFwcHJvdmVySWQ7XG5cbiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UpXG4gICAgcHJpdmF0ZSBsb25nIHB1cmNoYXNlT3JkZXJJZDtcblxuICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSlcbiAgICBwcml2YXRlIEluc3RhbnQgY3JlYXRlZEF0ID0gSW5zdGFudC5ub3coKTtcblxuICAgIHByb3RlY3RlZCBJZGVtcG90ZW5jeVJlY29yZCgpIHtcbiAgICB9XG5cbiAgICBwdWJsaWMgU3RyaW5nIGdldEtleSgpIHtcbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG5cbiAgICBwdWJsaWMgU3RyaW5nIGdldEFwcHJvdmVySWQoKSB7XG4gICAgICAgIHJldHVybiBhcHByb3ZlcklkO1xuICAgIH1cblxuICAgIHB1YmxpYyBsb25nIGdldFB1cmNoYXNlT3JkZXJJZCgpIHtcbiAgICAgICAgcmV0dXJuIHB1cmNoYXNlT3JkZXJJZDtcbiAgICB9XG59XG4ifSx7InBhdGgiOiJzcmMvbWFpbi9qYXZhL2NvbS96eWN1cy9wcm9jdXJlbWVudC9wby9BcGlFeGNlcHRpb25IYW5kbGVyLmphdmEiLCJjb250ZW50IjoicGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87XG5cbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhby5PcHRpbWlzdGljTG9ja2luZ0ZhaWx1cmVFeGNlcHRpb247XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5odHRwLkh0dHBTdGF0dXM7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5odHRwLlByb2JsZW1EZXRhaWw7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLkV4Y2VwdGlvbkhhbmRsZXI7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLlJlc3RDb250cm9sbGVyQWR2aWNlO1xuXG5AUmVzdENvbnRyb2xsZXJBZHZpY2VcbnB1YmxpYyBjbGFzcyBBcGlFeGNlcHRpb25IYW5kbGVyIHtcblxuICAgIEBFeGNlcHRpb25IYW5kbGVyKFBvTm90Rm91bmRFeGNlcHRpb24uY2xhc3MpXG4gICAgcHVibGljIFByb2JsZW1EZXRhaWwgbm90Rm91bmQoUG9Ob3RGb3VuZEV4Y2VwdGlvbiBlKSB7XG4gICAgICAgIHJldHVybiBQcm9ibGVtRGV0YWlsLmZvclN0YXR1c0FuZERldGFpbChIdHRwU3RhdHVzLk5PVF9GT1VORCwgZS5nZXRNZXNzYWdlKCkpO1xuICAgIH1cblxuICAgIEBFeGNlcHRpb25IYW5kbGVyKElsbGVnYWxTdGF0ZUV4Y2VwdGlvbi5jbGFzcylcbiAgICBwdWJsaWMgUHJvYmxlbURldGFpbCBjb25mbGljdChJbGxlZ2FsU3RhdGVFeGNlcHRpb24gZSkge1xuICAgICAgICByZXR1cm4gUHJvYmxlbURldGFpbC5mb3JTdGF0dXNBbmREZXRhaWwoSHR0cFN0YXR1cy5DT05GTElDVCwgZS5nZXRNZXNzYWdlKCkpO1xuICAgIH1cblxuICAgIC8qKiBTb21lb25lIGVsc2UgY2hhbmdlZCB0aGUgUE8gc2luY2UgaXQgd2FzIHJlYWQgKEBWZXJzaW9uKTogdGhlIGFwcCByZWZyZXNoZXMgYW5kIGFza3MgYWdhaW4uICovXG4gICAgQEV4Y2VwdGlvbkhhbmRsZXIoT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uLmNsYXNzKVxuICAgIHB1YmxpYyBQcm9ibGVtRGV0YWlsIHN0YWxlVXBkYXRlKE9wdGltaXN0aWNMb2NraW5nRmFpbHVyZUV4Y2VwdGlvbiBlKSB7XG4gICAgICAgIHJldHVybiBQcm9ibGVtRGV0YWlsLmZvclN0YXR1c0FuZERldGFpbChIdHRwU3RhdHVzLkNPTkZMSUNULFxuICAgICAgICAgICAgICAgIFwiVGhlIHB1cmNoYXNlIG9yZGVyIHdhcyBjaGFuZ2VkIGJ5IHNvbWVvbmUgZWxzZS4gUmVmcmVzaCBhbmQgdHJ5IGFnYWluLlwiKTtcbiAgICB9XG5cbiAgICBARXhjZXB0aW9uSGFuZGxlcihBcHByb3ZhbFNlcnZpY2UuSWRlbXBvdGVuY3lLZXlSZXVzZWRFeGNlcHRpb24uY2xhc3MpXG4gICAgcHVibGljIFByb2JsZW1EZXRhaWwga2V5UmV1c2VkKEFwcHJvdmFsU2VydmljZS5JZGVtcG90ZW5jeUtleVJldXNlZEV4Y2VwdGlvbiBlKSB7XG4gICAgICAgIHJldHVybiBQcm9ibGVtRGV0YWlsLmZvclN0YXR1c0FuZERldGFpbChIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZLCBlLmdldE1lc3NhZ2UoKSk7XG4gICAgfVxuXG4gICAgQEV4Y2VwdGlvbkhhbmRsZXIoQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24uY2xhc3MpXG4gICAgcHVibGljIFByb2JsZW1EZXRhaWwgYnVkZ2V0KEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uIGUpIHtcbiAgICAgICAgcmV0dXJuIFByb2JsZW1EZXRhaWwuZm9yU3RhdHVzQW5kRGV0YWlsKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFksIGUuZ2V0TWVzc2FnZSgpKTtcbiAgICB9XG5cbiAgICBARXhjZXB0aW9uSGFuZGxlcihJbGxlZ2FsQXJndW1lbnRFeGNlcHRpb24uY2xhc3MpXG4gICAgcHVibGljIFByb2JsZW1EZXRhaWwgYmFkUmVxdWVzdChJbGxlZ2FsQXJndW1lbnRFeGNlcHRpb24gZSkge1xuICAgICAgICByZXR1cm4gUHJvYmxlbURldGFpbC5mb3JTdGF0dXNBbmREZXRhaWwoSHR0cFN0YXR1cy5CQURfUkVRVUVTVCwgZS5nZXRNZXNzYWdlKCkpO1xuICAgIH1cbn1cbiJ9XQ==', 'base64'), 'UTF8'))::jsonb
  ) on conflict (question_id) do update set notes_md = excluded.notes_md, files = excluded.files;
  if v_installed is null then
    raise notice 'Question "spring-po-approvals": installed (version 3)';
  else
    raise notice 'Question "spring-po-approvals": updated from version % to 3', v_installed;
  end if;
end
$question$;

commit;
```

### 35. `supabase/seed/parts/question-web-invoice-builder.sql`

- **Folder:** `supabase/seed/parts`
- **File name:** `question-web-invoice-builder.sql`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 70 lines, 70 KB (large: pasting may take a few seconds)
- **Commit message:** `Sync question-web-invoice-builder.sql (question v3 grading)`

```sql
-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- Question "Supplier Invoice Builder: autosave, identity and input state (React web)". Safe to re-run: what is already installed and up to date is left untouched.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Question: web-invoice-builder (version 3)
do $question$
declare
  v_installed int;
begin
  select version into v_installed from public.questions where id = 'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13';
  if v_installed >= 3 then
    raise notice 'Question "web-invoice-builder": version % installed, left unchanged', v_installed;
    return;
  end if;
  insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status, version) values (
    'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'web-invoice-builder', 'Supplier Invoice Builder: autosave, identity and input state (React web)', 'Front-end debugging', array['lead-react-native-developer', 'react-developer', 'front-end-developer']::text[], array['react', 'typescript', 'hooks', 'closures', 'debounce', 'state-management', 'forms', 'intl']::text[], 'hard', 30,
    convert_from(decode('IyMgU3VwcGxpZXIgSW52b2ljZSBCdWlsZGVyOiB0aGUgZHJhZnQgdGhhdCB3b24ndCBiZWhhdmUKClN1cHBsaWVycyB1c2UgdGhpcyAqKlJlYWN0ICh3ZWIpKiogc2NyZWVuIG9mIHRoZSBaeWN1cyBzdXBwbGllciBwb3J0YWwgdG8gcmFpc2UgYW4gaW52b2ljZSBhZ2FpbnN0CmEgUE8uIFRoZXkgc2VhcmNoIGZvciB0aGUgUE8sIGltcG9ydCBpdHMgbGluZXMsIGFkanVzdCBxdWFudGl0aWVzIGFuZCBwcmljZXMsIGFuZCBzdWJtaXQuIERyYWZ0cwoqKmF1dG9zYXZlIDAuOCBzIGFmdGVyIHRoZSBsYXN0IGNoYW5nZSoqLiBNb25leSBpcyBoZWxkIGluICoqcGFpc2UqKiAoaW50ZWdlcnMpLgoKIyMjIEJ1ZyByZXBvcnRzCgoxLiAqKiJBdXRvc2F2ZSBzYXZlZCBhbiBvbGQgdmVyc2lvbi4iKiogVGhlIHNhdmVkIGRyYWZ0IGlzIHRoZSBvbmUgZnJvbSB3aGVuIHRoZSBwYWdlIG9wZW5lZDogbm8KICAgUE8gYW5kIG5vIGxpbmVzLiBRdWFudGl0eSBlZGl0cyBhcmVuJ3QgYXV0b3NhdmVkIGF0IGFsbC4KMi4gKioiTXkgc3VibWl0dGVkIGludm9pY2Ugd2VudCBiYWNrIHRvIERyYWZ0LiIqKiBBbiBhdXRvc2F2ZSBsYW5kcyBhZnRlciAqU3VibWl0KiBhbmQgdGhlIHNlcnZlcgogICByZW9wZW5zIHRoZSBpbnZvaWNlLiBDbG9zaW5nIHRoZSBidWlsZGVyIHdpdGggcmVjZW50IGVkaXRzIGFsc28gc2F2ZXMgYWZ0ZXJ3YXJkcywgd2hpbGUgdGhlCiAgIHN1cHBsaWVyIGlzIGFscmVhZHkgb24gYW5vdGhlciBzY3JlZW4uCjMuICoqIlBPIHNlYXJjaCBoYW1tZXJzIHRoZSBBUEkuIioqIFR5cGluZyAqUE8tMjAyNi0wMDQyKiBzZW5kcyBhIHJlcXVlc3QgZm9yIGV2ZXJ5IGtleXN0cm9rZQogICBpbnN0ZWFkIG9mIG9uZSB3aGVuIHRoZSB0eXBpbmcgcGF1c2VzLgo0LiAqKiJFZGl0aW5nIG9uZSBsaW5lIGNoYW5nZXMgYW5vdGhlciwgYW5kIFJlbW92ZSBkZWxldGVzIGV2ZXJ5IGxpbmUuIioqIFRoaXMgaGFwcGVucyBhZnRlcgogICBpbXBvcnRpbmcgYSBQTydzIGxpbmVzIG9yIGNsaWNraW5nICpBZGQgbGluZSogcXVpY2tseS4gVGhlIGNvbnNvbGUgc2hvd3MgKkVuY291bnRlcmVkIHR3bwogICBjaGlsZHJlbiB3aXRoIHRoZSBzYW1lIGtleSouCjUuICoqIlRoZSB0b3RhbCBkb2Vzbid0IGNoYW5nZSB3aGVuIEkgZWRpdCBhIHF1YW50aXR5LCBhbmQgVW5kbyBkb2VzIG5vdGhpbmcuIioqCjYuICoqIkkgY2FuJ3QgdHlwZSDigrkxMi41MC4iKiogVGhlIGRlY2ltYWwgcG9pbnQgZGlzYXBwZWFycyBhcyBzb29uIGFzIGl0J3MgdHlwZWQsIGNsZWFyaW5nIHRoZQogICBmaWVsZCBwdXRzIGEgMCBiYWNrLCBhbmQgcGFzdGluZyAqMSwyNTAuNTAqIG1ha2VzIHRoZSBwcmljZSDigrkxLjAwLgo3LiAqKiJJbnZvaWNlcyByYWlzZWQganVzdCBhZnRlciBtaWRuaWdodCBhcmUgZGF0ZWQgeWVzdGVyZGF5LiIqKiBBbiBpbnZvaWNlIGNyZWF0ZWQgYXQgMDA6MzAgSVNUCiAgIG9uIDEgTWF5IGlzIGRhdGVkIDMwIEFwcmlsLCBzbyBpdCBmYWxscyBpbnRvIHRoZSBwcmV2aW91cyBtb250aCdzIEdTVCByZXR1cm4uCgojIyMgV2hhdCB0byBkbwoKLSBGaXggdGhlICoqcm9vdCBjYXVzZXMqKiBpbiBgc3JjL2AuIEtlZXAgdGhlIHB1YmxpYyBwcm9wcywgdGhlIGBkYXRhLXRlc3RpZGBzIGFuZCB0aGUgaG9vaydzCiAgc2lnbmF0dXJlLgotIGBfX3Rlc3RzX18vYCBpcyAqKnJlYWQtb25seSoqIGFuZCBkZXNjcmliZXMgdGhlIGV4cGVjdGVkIGJlaGF2aW91ci4gVXNlICoqUnVuIHRlc3RzKiogKHRoZXkgdXNlCiAgZmFrZSB0aW1lcnMpLgotIERvbid0IHNwZWNpYWwtY2FzZSB0aGUgdGVzdHM6IHJldmlld2VycyByZWFkIHlvdXIgY2hhbmdlcyBhbmQgcnVuIG1vcmUgdGVzdHMuCi0gVGhlIHRlc3RzIHJlbmRlciB3aXRob3V0IGEgYnJvd3NlciBET00gKG5vIGBkb2N1bWVudGApLCBhbmQgaW5wdXRzIGFyZSByZWFkIHRocm91Z2ggdGhlaXIKICBgdmFsdWVgIHByb3AsIHNvIGtlZXAgdGhlbSBjb250cm9sbGVkIChgdmFsdWVgICsgYG9uQ2hhbmdlYCkuCgoqVGltZSBndWlkZTogYWJvdXQgMzAgbWludXRlcy4qCg==', 'base64'), 'UTF8'),
    false, 'published', 3
  ) on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, category = excluded.category,
    role_tags = excluded.role_tags, skill_tags = excluded.skill_tags, difficulty = excluded.difficulty,
    time_suggestion_minutes = excluded.time_suggestion_minutes, statement_md = excluded.statement_md,
    is_sample = excluded.is_sample, status = excluded.status, version = excluded.version;
  delete from public.question_files where question_id = 'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13' and path <> all (array['src/InvoiceBuilder.tsx', 'src/components/PoPicker.tsx', 'src/components/LineRow.tsx', 'src/components/MoneyInput.tsx', 'src/hooks/useDebouncedCallback.ts', 'src/state/invoiceReducer.ts', 'src/utils/money.ts', 'src/utils/dates.ts', 'src/utils/debounce.ts', 'src/types.ts', '__tests__/autosave.test.tsx', '__tests__/PoPicker.test.tsx', '__tests__/lines.test.tsx', '__tests__/MoneyInput.test.tsx', '__tests__/dates.test.tsx', '__tests__/support/fakeApi.tsx', 'package.json']::text[]);
  insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/InvoiceBuilder.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWR1Y2VyLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgTGluZVJvdyB9IGZyb20gJy4vY29tcG9uZW50cy9MaW5lUm93JzsKaW1wb3J0IHsgUG9QaWNrZXIgfSBmcm9tICcuL2NvbXBvbmVudHMvUG9QaWNrZXInOwppbXBvcnQgeyB1c2VEZWJvdW5jZWRDYWxsYmFjayB9IGZyb20gJy4vaG9va3MvdXNlRGVib3VuY2VkQ2FsbGJhY2snOwppbXBvcnQgeyBpbml0aWFsU3RhdGUsIGludm9pY2VSZWR1Y2VyLCB0b3RhbHMgfSBmcm9tICcuL3N0YXRlL2ludm9pY2VSZWR1Y2VyJzsKaW1wb3J0IHR5cGUgeyBJbnZvaWNlQXBpLCBJbnZvaWNlRHJhZnQsIFBvU3VtbWFyeSB9IGZyb20gJy4vdHlwZXMnOwppbXBvcnQgeyB0b2RheUluSW5kaWEgfSBmcm9tICcuL3V0aWxzL2RhdGVzJzsKaW1wb3J0IHsgZm9ybWF0UGFpc2UgfSBmcm9tICcuL3V0aWxzL21vbmV5JzsKCmV4cG9ydCBjb25zdCBBVVRPU0FWRV9NUyA9IDgwMDsKCmV4cG9ydCBmdW5jdGlvbiBJbnZvaWNlQnVpbGRlcih7IGFwaSB9OiB7IGFwaTogSW52b2ljZUFwaSB9KSB7CiAgY29uc3QgW3N0YXRlLCBkaXNwYXRjaF0gPSB1c2VSZWR1Y2VyKGludm9pY2VSZWR1Y2VyLCBpbml0aWFsU3RhdGUpOwogIGNvbnN0IFtwbywgc2V0UG9dID0gdXNlU3RhdGU8UG9TdW1tYXJ5IHwgbnVsbD4obnVsbCk7CiAgY29uc3QgW2ludm9pY2VEYXRlXSA9IHVzZVN0YXRlKCgpID0+IHRvZGF5SW5JbmRpYSgpKTsKICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGU8J2RyYWZ0JyB8ICdzdWJtaXR0aW5nJyB8ICdzdWJtaXR0ZWQnPignZHJhZnQnKTsKCiAgY29uc3QgZHJhZnQ6IEludm9pY2VEcmFmdCA9IHsgcG9JZDogcG8/LmlkID8/IG51bGwsIGludm9pY2VEYXRlLCBsaW5lczogc3RhdGUubGluZXMgfTsKCiAgLy8gQXV0b3NhdmUgMC44IHMgYWZ0ZXIgdGhlIGxhc3QgY2hhbmdlLgogIGNvbnN0IGF1dG9zYXZlID0gdXNlRGVib3VuY2VkQ2FsbGJhY2soKCkgPT4gewogICAgdm9pZCBhcGkuc2F2ZURyYWZ0KGRyYWZ0KTsKICB9LCBBVVRPU0FWRV9NUyk7CgogIHVzZUVmZmVjdCgoKSA9PiB7CiAgICBpZiAocG8pIGF1dG9zYXZlKCk7CiAgfSwgW3BvLCBzdGF0ZS5saW5lcywgYXV0b3NhdmVdKTsKCiAgY29uc3Qgc3VtcyA9IHVzZU1lbW8oKCkgPT4gdG90YWxzKHN0YXRlLmxpbmVzKSwgW3N0YXRlLmxpbmVzXSk7CgogIGFzeW5jIGZ1bmN0aW9uIGNob29zZVBvKG5leHQ6IFBvU3VtbWFyeSkgewogICAgc2V0UG8obmV4dCk7CiAgICBkaXNwYXRjaCh7IHR5cGU6ICdpbXBvcnRQb0xpbmVzJywgbGluZXM6IGF3YWl0IGFwaS5nZXRQb0xpbmVzKG5leHQuaWQpIH0pOwogIH0KCiAgYXN5bmMgZnVuY3Rpb24gc3VibWl0KCkgewogICAgc2V0U3RhdHVzKCdzdWJtaXR0aW5nJyk7CiAgICBhd2FpdCBhcGkuc3VibWl0KGRyYWZ0KTsKICAgIHNldFN0YXR1cygnc3VibWl0dGVkJyk7CiAgfQoKICByZXR1cm4gKAogICAgPGZvcm0KICAgICAgZGF0YS10ZXN0aWQ9Imludm9pY2UiCiAgICAgIG9uU3VibWl0PXsoZSkgPT4gewogICAgICAgIGUucHJldmVudERlZmF1bHQoKTsKICAgICAgICB2b2lkIHN1Ym1pdCgpOwogICAgICB9fQogICAgPgogICAgICA8UG9QaWNrZXIgYXBpPXthcGl9IG9uU2VsZWN0PXtjaG9vc2VQb30gLz4KICAgICAgPHA+CiAgICAgICAgSW52b2ljZSBkYXRlOiA8c3BhbiBkYXRhLXRlc3RpZD0iaW52b2ljZS1kYXRlIj57aW52b2ljZURhdGV9PC9zcGFuPgogICAgICA8L3A+CiAgICAgIDxmaWVsZHNldCBkaXNhYmxlZD17c3RhdHVzICE9PSAnZHJhZnQnfT4KICAgICAgICB7c3RhdGUubGluZXMubWFwKChsaW5lLCBpKSA9PiAoCiAgICAgICAgICA8TGluZVJvdwogICAgICAgICAgICBrZXk9e2xpbmUuaWR9CiAgICAgICAgICAgIHBvc2l0aW9uPXtpICsgMX0KICAgICAgICAgICAgbGluZT17bGluZX0KICAgICAgICAgICAgb25DaGFuZ2U9eyhwYXRjaCkgPT4gZGlzcGF0Y2goeyB0eXBlOiAndXBkYXRlTGluZScsIGlkOiBsaW5lLmlkLCBwYXRjaCB9KX0KICAgICAgICAgICAgb25SZW1vdmU9eygpID0+IGRpc3BhdGNoKHsgdHlwZTogJ3JlbW92ZUxpbmUnLCBpZDogbGluZS5pZCB9KX0KICAgICAgICAgIC8+CiAgICAgICAgKSl9CiAgICAgICAgPGJ1dHRvbiB0eXBlPSJidXR0b24iIGRhdGEtdGVzdGlkPSJhZGQtbGluZSIgb25DbGljaz17KCkgPT4gZGlzcGF0Y2goeyB0eXBlOiAnYWRkTGluZScgfSl9PgogICAgICAgICAgQWRkIGxpbmUKICAgICAgICA8L2J1dHRvbj4KICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgZGF0YS10ZXN0aWQ9InVuZG8iIGRpc2FibGVkPXtzdGF0ZS5wYXN0Lmxlbmd0aCA9PT0gMH0gb25DbGljaz17KCkgPT4gZGlzcGF0Y2goeyB0eXBlOiAndW5kbycgfSl9PgogICAgICAgICAgVW5kbwogICAgICAgIDwvYnV0dG9uPgogICAgICA8L2ZpZWxkc2V0PgogICAgICA8ZGw+CiAgICAgICAgPGR0Pk5ldDwvZHQ+CiAgICAgICAgPGRkIGRhdGEtdGVzdGlkPSJ0b3RhbC1uZXQiPntmb3JtYXRQYWlzZShzdW1zLm5ldCl9PC9kZD4KICAgICAgICA8ZHQ+R1NUPC9kdD4KICAgICAgICA8ZGQgZGF0YS10ZXN0aWQ9InRvdGFsLXRheCI+e2Zvcm1hdFBhaXNlKHN1bXMudGF4KX08L2RkPgogICAgICAgIDxkdD5Ub3RhbDwvZHQ+CiAgICAgICAgPGRkIGRhdGEtdGVzdGlkPSJ0b3RhbC1ncm9zcyI+e2Zvcm1hdFBhaXNlKHN1bXMuZ3Jvc3MpfTwvZGQ+CiAgICAgIDwvZGw+CiAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBkYXRhLXRlc3RpZD0ic3VibWl0IiBkaXNhYmxlZD17c3RhdHVzICE9PSAnZHJhZnQnIHx8ICFwb30+CiAgICAgICAge3N0YXR1cyA9PT0gJ3N1Ym1pdHRlZCcgPyAnU3VibWl0dGVkJyA6ICdTdWJtaXQgaW52b2ljZSd9CiAgICAgIDwvYnV0dG9uPgogICAgPC9mb3JtPgogICk7Cn0K', 'base64'), 'UTF8'), false, 0),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/components/PoPicker.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlTWVtbywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7CmltcG9ydCB0eXBlIHsgSW52b2ljZUFwaSwgUG9TdW1tYXJ5IH0gZnJvbSAnLi4vdHlwZXMnOwppbXBvcnQgeyBkZWJvdW5jZSB9IGZyb20gJy4uL3V0aWxzL2RlYm91bmNlJzsKCmV4cG9ydCBjb25zdCBTRUFSQ0hfREVCT1VOQ0VfTVMgPSAzMDA7CgppbnRlcmZhY2UgUHJvcHMgewogIGFwaTogSW52b2ljZUFwaTsKICBvblNlbGVjdChwbzogUG9TdW1tYXJ5KTogdm9pZDsKfQoKLyoqIFR5cGVhaGVhZDogc2VhcmNoZXMgUE9zIGJ5IG51bWJlciBvciBidXllciBvbmNlIHRoZSBzdXBwbGllciBwYXVzZXMgdHlwaW5nLiAqLwpleHBvcnQgZnVuY3Rpb24gUG9QaWNrZXIoeyBhcGksIG9uU2VsZWN0IH06IFByb3BzKSB7CiAgY29uc3QgW3F1ZXJ5LCBzZXRRdWVyeV0gPSB1c2VTdGF0ZSgnJyk7CiAgY29uc3QgW3Jlc3VsdHMsIHNldFJlc3VsdHNdID0gdXNlU3RhdGU8UG9TdW1tYXJ5W10+KFtdKTsKCiAgY29uc3Qgc2VhcmNoID0gKHE6IHN0cmluZykgPT4gewogICAgaWYgKHEudHJpbSgpLmxlbmd0aCA8IDIpIHsKICAgICAgc2V0UmVzdWx0cyhbXSk7CiAgICAgIHJldHVybjsKICAgIH0KICAgIHZvaWQgYXBpLnNlYXJjaFBvcyhxLnRyaW0oKSkudGhlbihzZXRSZXN1bHRzKTsKICB9OwogIGNvbnN0IGRlYm91bmNlZFNlYXJjaCA9IHVzZU1lbW8oKCkgPT4gZGVib3VuY2Uoc2VhcmNoLCBTRUFSQ0hfREVCT1VOQ0VfTVMpLCBbc2VhcmNoXSk7CgogIHJldHVybiAoCiAgICA8ZGl2IGNsYXNzTmFtZT0icG8tcGlja2VyIj4KICAgICAgPGlucHV0CiAgICAgICAgZGF0YS10ZXN0aWQ9InBvLXNlYXJjaCIKICAgICAgICBhcmlhLWxhYmVsPSJQdXJjaGFzZSBvcmRlciIKICAgICAgICBwbGFjZWhvbGRlcj0iU2VhcmNoIFBPIG51bWJlciBvciBidXllciIKICAgICAgICB2YWx1ZT17cXVlcnl9CiAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7CiAgICAgICAgICBzZXRRdWVyeShlLnRhcmdldC52YWx1ZSk7CiAgICAgICAgICBkZWJvdW5jZWRTZWFyY2goZS50YXJnZXQudmFsdWUpOwogICAgICAgIH19CiAgICAgIC8+CiAgICAgIDx1bCByb2xlPSJsaXN0Ym94Ij4KICAgICAgICB7cmVzdWx0cy5tYXAoKHBvKSA9PiAoCiAgICAgICAgICA8bGkga2V5PXtwby5pZH0gcm9sZT0ib3B0aW9uIiBhcmlhLXNlbGVjdGVkPXtmYWxzZX0+CiAgICAgICAgICAgIDxidXR0b24KICAgICAgICAgICAgICB0eXBlPSJidXR0b24iCiAgICAgICAgICAgICAgZGF0YS10ZXN0aWQ9e2Bwby0ke3BvLmlkfWB9CiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gewogICAgICAgICAgICAgICAgc2V0UmVzdWx0cyhbXSk7CiAgICAgICAgICAgICAgICBzZXRRdWVyeShwby5udW1iZXIpOwogICAgICAgICAgICAgICAgb25TZWxlY3QocG8pOwogICAgICAgICAgICAgIH19CiAgICAgICAgICAgID4KICAgICAgICAgICAgICB7cG8ubnVtYmVyfSDCtyB7cG8uYnV5ZXJ9CiAgICAgICAgICAgIDwvYnV0dG9uPgogICAgICAgICAgPC9saT4KICAgICAgICApKX0KICAgICAgPC91bD4KICAgIDwvZGl2PgogICk7Cn0K', 'base64'), 'UTF8'), false, 1),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/components/LineRow.tsx', 'typescript', convert_from(decode('aW1wb3J0IHR5cGUgeyBHc3RSYXRlLCBJbnZvaWNlTGluZSwgUG9MaW5lIH0gZnJvbSAnLi4vdHlwZXMnOwppbXBvcnQgeyBmb3JtYXRQYWlzZSwgbGluZU5ldCB9IGZyb20gJy4uL3V0aWxzL21vbmV5JzsKaW1wb3J0IHsgTW9uZXlJbnB1dCB9IGZyb20gJy4vTW9uZXlJbnB1dCc7Cgpjb25zdCBHU1RfUkFURVM6IEdzdFJhdGVbXSA9IFswLCA1LCAxMiwgMTgsIDI4XTsKCmludGVyZmFjZSBQcm9wcyB7CiAgLyoqIDEtYmFzZWQgcG9zaXRpb24gb24gdGhlIGludm9pY2UgKGxhYmVscyBhbmQgdGVzdCBpZHMpLiAqLwogIHBvc2l0aW9uOiBudW1iZXI7CiAgbGluZTogSW52b2ljZUxpbmU7CiAgb25DaGFuZ2UocGF0Y2g6IFBhcnRpYWw8UG9MaW5lPik6IHZvaWQ7CiAgb25SZW1vdmUoKTogdm9pZDsKfQoKZXhwb3J0IGZ1bmN0aW9uIExpbmVSb3coeyBwb3NpdGlvbiwgbGluZSwgb25DaGFuZ2UsIG9uUmVtb3ZlIH06IFByb3BzKSB7CiAgcmV0dXJuICgKICAgIDxkaXYgZGF0YS10ZXN0aWQ9ImxpbmUiIHJvbGU9Imdyb3VwIiBhcmlhLWxhYmVsPXtgTGluZSAke3Bvc2l0aW9ufWB9IGNsYXNzTmFtZT0ibGluZSI+CiAgICAgIDxpbnB1dAogICAgICAgIGRhdGEtdGVzdGlkPXtgc2t1LSR7cG9zaXRpb259YH0KICAgICAgICBhcmlhLWxhYmVsPSJTS1UiCiAgICAgICAgdmFsdWU9e2xpbmUuc2t1fQogICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gb25DaGFuZ2UoeyBza3U6IGUudGFyZ2V0LnZhbHVlIH0pfQogICAgICAvPgogICAgICA8aW5wdXQKICAgICAgICBkYXRhLXRlc3RpZD17YGRlc2NyaXB0aW9uLSR7cG9zaXRpb259YH0KICAgICAgICBhcmlhLWxhYmVsPSJEZXNjcmlwdGlvbiIKICAgICAgICB2YWx1ZT17bGluZS5kZXNjcmlwdGlvbn0KICAgICAgICBvbkNoYW5nZT17KGUpID0+IG9uQ2hhbmdlKHsgZGVzY3JpcHRpb246IGUudGFyZ2V0LnZhbHVlIH0pfQogICAgICAvPgogICAgICA8aW5wdXQKICAgICAgICBkYXRhLXRlc3RpZD17YHF0eS0ke3Bvc2l0aW9ufWB9CiAgICAgICAgYXJpYS1sYWJlbD0iUXVhbnRpdHkiCiAgICAgICAgdHlwZT0ibnVtYmVyIgogICAgICAgIG1pbj17MH0KICAgICAgICB2YWx1ZT17bGluZS5xdWFudGl0eX0KICAgICAgICBvbkNoYW5nZT17KGUpID0+IG9uQ2hhbmdlKHsgcXVhbnRpdHk6IE51bWJlcihlLnRhcmdldC52YWx1ZSkgfSl9CiAgICAgIC8+CiAgICAgIDxNb25leUlucHV0CiAgICAgICAgdGVzdElEPXtgcHJpY2UtJHtwb3NpdGlvbn1gfQogICAgICAgIGxhYmVsPSJVbml0IHByaWNlIgogICAgICAgIHBhaXNlPXtsaW5lLnVuaXRQcmljZVBhaXNlfQogICAgICAgIG9uQ2hhbmdlPXsodW5pdFByaWNlUGFpc2UpID0+IG9uQ2hhbmdlKHsgdW5pdFByaWNlUGFpc2UgfSl9CiAgICAgIC8+CiAgICAgIDxzZWxlY3QKICAgICAgICBkYXRhLXRlc3RpZD17YGdzdC0ke3Bvc2l0aW9ufWB9CiAgICAgICAgYXJpYS1sYWJlbD0iR1NUIHJhdGUiCiAgICAgICAgdmFsdWU9e2xpbmUuZ3N0UmF0ZX0KICAgICAgICBvbkNoYW5nZT17KGUpID0+IG9uQ2hhbmdlKHsgZ3N0UmF0ZTogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSBhcyBHc3RSYXRlIH0pfQogICAgICA+CiAgICAgICAge0dTVF9SQVRFUy5tYXAoKHJhdGUpID0+ICgKICAgICAgICAgIDxvcHRpb24ga2V5PXtyYXRlfSB2YWx1ZT17cmF0ZX0+CiAgICAgICAgICAgIHtyYXRlfSUKICAgICAgICAgIDwvb3B0aW9uPgogICAgICAgICkpfQogICAgICA8L3NlbGVjdD4KICAgICAgPHNwYW4gZGF0YS10ZXN0aWQ9e2B0b3RhbC0ke3Bvc2l0aW9ufWB9Pntmb3JtYXRQYWlzZShsaW5lTmV0KGxpbmUpKX08L3NwYW4+CiAgICAgIDxidXR0b24gdHlwZT0iYnV0dG9uIiBkYXRhLXRlc3RpZD17YHJlbW92ZS0ke3Bvc2l0aW9ufWB9IG9uQ2xpY2s9e29uUmVtb3ZlfT4KICAgICAgICBSZW1vdmUKICAgICAgPC9idXR0b24+CiAgICA8L2Rpdj4KICApOwp9Cg==', 'base64'), 'UTF8'), false, 2),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/components/MoneyInput.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgcGFyc2VSdXBlZXMgfSBmcm9tICcuLi91dGlscy9tb25leSc7CgppbnRlcmZhY2UgUHJvcHMgewogIHRlc3RJRDogc3RyaW5nOwogIGxhYmVsOiBzdHJpbmc7CiAgcGFpc2U6IG51bWJlcjsKICBvbkNoYW5nZShwYWlzZTogbnVtYmVyKTogdm9pZDsKfQoKLyoqIEEgcnVwZWUgYW1vdW50IGZpZWxkLiBUaGUgdmFsdWUgbGl2ZXMgaW4gdGhlIHBhcmVudCwgaW4gcGFpc2UuICovCmV4cG9ydCBmdW5jdGlvbiBNb25leUlucHV0KHsgdGVzdElELCBsYWJlbCwgcGFpc2UsIG9uQ2hhbmdlIH06IFByb3BzKSB7CiAgcmV0dXJuICgKICAgIDxpbnB1dAogICAgICBkYXRhLXRlc3RpZD17dGVzdElEfQogICAgICBhcmlhLWxhYmVsPXtsYWJlbH0KICAgICAgaW5wdXRNb2RlPSJkZWNpbWFsIgogICAgICB2YWx1ZT17KHBhaXNlIC8gMTAwKS50b1N0cmluZygpfQogICAgICBvbkNoYW5nZT17KGUpID0+IG9uQ2hhbmdlKHBhcnNlUnVwZWVzKGUudGFyZ2V0LnZhbHVlKSA/PyAwKX0KICAgIC8+CiAgKTsKfQo=', 'base64'), 'UTF8'), false, 3),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/hooks/useDebouncedCallback.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlTWVtbywgdXNlUmVmIH0gZnJvbSAncmVhY3QnOwoKZXhwb3J0IGludGVyZmFjZSBEZWJvdW5jZWQ8QSBleHRlbmRzIHVua25vd25bXT4gewogICguLi5hcmdzOiBBKTogdm9pZDsKICAvKiogRHJvcHMgYSBwZW5kaW5nIGNhbGwuICovCiAgY2FuY2VsKCk6IHZvaWQ7Cn0KCi8qKgogKiBSZXR1cm5zIGEgc3RhYmxlIGZ1bmN0aW9uIHRoYXQgY2FsbHMgYGZuYCBvbmNlIGNhbGxzIGhhdmUgc3RvcHBlZCBmb3IgYGRlbGF5TXNgLCB3aXRoIHRoZQogKiBhcmd1bWVudHMgb2YgdGhlIGxhc3QgY2FsbC4KICovCmV4cG9ydCBmdW5jdGlvbiB1c2VEZWJvdW5jZWRDYWxsYmFjazxBIGV4dGVuZHMgdW5rbm93bltdPigKICBmbjogKC4uLmFyZ3M6IEEpID0+IHZvaWQsCiAgZGVsYXlNczogbnVtYmVyLAopOiBEZWJvdW5jZWQ8QT4gewogIGNvbnN0IHRpbWVyID0gdXNlUmVmPFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgdW5kZWZpbmVkPih1bmRlZmluZWQpOwogIHJldHVybiB1c2VNZW1vKCgpID0+IHsKICAgIGNvbnN0IGRlYm91bmNlZCA9ICguLi5hcmdzOiBBKSA9PiB7CiAgICAgIGNsZWFyVGltZW91dCh0aW1lci5jdXJyZW50KTsKICAgICAgdGltZXIuY3VycmVudCA9IHNldFRpbWVvdXQoKCkgPT4gZm4oLi4uYXJncyksIGRlbGF5TXMpOwogICAgfTsKICAgIGRlYm91bmNlZC5jYW5jZWwgPSAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIuY3VycmVudCk7CiAgICByZXR1cm4gZGVib3VuY2VkOwogICAgLy8gS2VwdCBzdGFibGUgb24gcHVycG9zZTogY2FsbGVycyBwdXQgaXQgaW4gZWZmZWN0IGRlcGVuZGVuY2llcy4KICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHMKICB9LCBbZGVsYXlNc10pOwp9Cg==', 'base64'), 'UTF8'), false, 4),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/state/invoiceReducer.ts', 'typescript', convert_from(decode('aW1wb3J0IHR5cGUgeyBJbnZvaWNlTGluZSwgUG9MaW5lIH0gZnJvbSAnLi4vdHlwZXMnOwppbXBvcnQgeyBsaW5lTmV0LCBsaW5lVGF4IH0gZnJvbSAnLi4vdXRpbHMvbW9uZXknOwoKZXhwb3J0IGludGVyZmFjZSBJbnZvaWNlU3RhdGUgewogIGxpbmVzOiBJbnZvaWNlTGluZVtdOwogIC8qKiBFYXJsaWVyIHZlcnNpb25zIG9mIGBsaW5lc2AsIG5ld2VzdCBsYXN0LCBmb3IgVW5kby4gKi8KICBwYXN0OiBJbnZvaWNlTGluZVtdW107Cn0KCmV4cG9ydCBjb25zdCBpbml0aWFsU3RhdGU6IEludm9pY2VTdGF0ZSA9IHsgbGluZXM6IFtdLCBwYXN0OiBbXSB9OwoKZXhwb3J0IHR5cGUgSW52b2ljZUFjdGlvbiA9CiAgfCB7IHR5cGU6ICdpbXBvcnRQb0xpbmVzJzsgbGluZXM6IFBvTGluZVtdIH0KICB8IHsgdHlwZTogJ2FkZExpbmUnIH0KICB8IHsgdHlwZTogJ3VwZGF0ZUxpbmUnOyBpZDogc3RyaW5nOyBwYXRjaDogUGFydGlhbDxQb0xpbmU+IH0KICB8IHsgdHlwZTogJ3JlbW92ZUxpbmUnOyBpZDogc3RyaW5nIH0KICB8IHsgdHlwZTogJ3VuZG8nIH07Cgpjb25zdCBCTEFOS19MSU5FOiBQb0xpbmUgPSB7IHNrdTogJycsIGRlc2NyaXB0aW9uOiAnJywgcXVhbnRpdHk6IDEsIHVuaXRQcmljZVBhaXNlOiAwLCBnc3RSYXRlOiAxOCB9OwoKY29uc3QgbmV3TGluZUlkID0gKCkgPT4gYGxpbmUtJHtEYXRlLm5vdygpfWA7CgpleHBvcnQgZnVuY3Rpb24gaW52b2ljZVJlZHVjZXIoc3RhdGU6IEludm9pY2VTdGF0ZSwgYWN0aW9uOiBJbnZvaWNlQWN0aW9uKTogSW52b2ljZVN0YXRlIHsKICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7CiAgICBjYXNlICdpbXBvcnRQb0xpbmVzJzoKICAgICAgcmV0dXJuIHsKICAgICAgICBsaW5lczogYWN0aW9uLmxpbmVzLm1hcCgobGluZSkgPT4gKHsgLi4ubGluZSwgaWQ6IG5ld0xpbmVJZCgpIH0pKSwKICAgICAgICBwYXN0OiBbLi4uc3RhdGUucGFzdCwgc3RhdGUubGluZXNdLAogICAgICB9OwogICAgY2FzZSAnYWRkTGluZSc6CiAgICAgIHJldHVybiB7CiAgICAgICAgbGluZXM6IFsuLi5zdGF0ZS5saW5lcywgeyAuLi5CTEFOS19MSU5FLCBpZDogbmV3TGluZUlkKCkgfV0sCiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSwKICAgICAgfTsKICAgIGNhc2UgJ3VwZGF0ZUxpbmUnOiB7CiAgICAgIGNvbnN0IGxpbmUgPSBzdGF0ZS5saW5lcy5maW5kKChsKSA9PiBsLmlkID09PSBhY3Rpb24uaWQpOwogICAgICBpZiAoIWxpbmUpIHJldHVybiBzdGF0ZTsKICAgICAgT2JqZWN0LmFzc2lnbihsaW5lLCBhY3Rpb24ucGF0Y2gpOwogICAgICByZXR1cm4geyBsaW5lczogc3RhdGUubGluZXMsIHBhc3Q6IFsuLi5zdGF0ZS5wYXN0LCBzdGF0ZS5saW5lc10gfTsKICAgIH0KICAgIGNhc2UgJ3JlbW92ZUxpbmUnOgogICAgICByZXR1cm4gewogICAgICAgIGxpbmVzOiBzdGF0ZS5saW5lcy5maWx0ZXIoKGwpID0+IGwuaWQgIT09IGFjdGlvbi5pZCksCiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSwKICAgICAgfTsKICAgIGNhc2UgJ3VuZG8nOiB7CiAgICAgIGNvbnN0IHByZXZpb3VzID0gc3RhdGUucGFzdFtzdGF0ZS5wYXN0Lmxlbmd0aCAtIDFdOwogICAgICBpZiAoIXByZXZpb3VzKSByZXR1cm4gc3RhdGU7CiAgICAgIHJldHVybiB7IGxpbmVzOiBwcmV2aW91cywgcGFzdDogc3RhdGUucGFzdC5zbGljZSgwLCAtMSkgfTsKICAgIH0KICB9Cn0KCmV4cG9ydCBmdW5jdGlvbiB0b3RhbHMobGluZXM6IEludm9pY2VMaW5lW10pIHsKICBsZXQgbmV0ID0gMDsKICBsZXQgdGF4ID0gMDsKICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHsKICAgIG5ldCArPSBsaW5lTmV0KGxpbmUpOwogICAgdGF4ICs9IGxpbmVUYXgobGluZSk7CiAgfQogIHJldHVybiB7IG5ldCwgdGF4LCBncm9zczogbmV0ICsgdGF4IH07Cn0K', 'base64'), 'UTF8'), false, 5),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/utils/money.ts', 'typescript', convert_from(decode('Y29uc3QgaW5yID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KCdlbi1JTicsIHsgc3R5bGU6ICdjdXJyZW5jeScsIGN1cnJlbmN5OiAnSU5SJyB9KTsKCi8qKiDigrkxMiwzNCw1NjcuNTAgKi8KZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFBhaXNlKHBhaXNlOiBudW1iZXIpOiBzdHJpbmcgewogIHJldHVybiBpbnIuZm9ybWF0KHBhaXNlIC8gMTAwKTsKfQoKLyoqCiAqIFBhcnNlcyB3aGF0IHRoZSBzdXBwbGllciB0eXBlZCBpbiBhIHByaWNlIGZpZWxkICgiMTI1MCIsICIxLDI1MC41MCIsICLigrkgOTkuOSIpIGludG8gcGFpc2UuCiAqIFJldHVybnMgbnVsbCB3aGVuIGl0IGlzbid0IGEgdmFsaWQsIG5vbi1uZWdhdGl2ZSBhbW91bnQgd2l0aCBhdCBtb3N0IDIgZGVjaW1hbHMuCiAqLwpleHBvcnQgZnVuY3Rpb24gcGFyc2VSdXBlZXModGV4dDogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7CiAgY29uc3QgdmFsdWUgPSBwYXJzZUZsb2F0KHRleHQpOwogIGlmIChpc05hTih2YWx1ZSkpIHJldHVybiBudWxsOwogIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMTAwKTsKfQoKLyoqIE5ldCBhbW91bnQgb2YgYSBsaW5lLCBpbiBwYWlzZS4gKi8KZXhwb3J0IGZ1bmN0aW9uIGxpbmVOZXQobGluZTogeyBxdWFudGl0eTogbnVtYmVyOyB1bml0UHJpY2VQYWlzZTogbnVtYmVyIH0pOiBudW1iZXIgewogIHJldHVybiBsaW5lLnF1YW50aXR5ICogbGluZS51bml0UHJpY2VQYWlzZTsKfQoKLyoqIEdTVCBvZiBhIGxpbmUsIHJvdW5kZWQgdG8gdGhlIHBhaXNhLiAqLwpleHBvcnQgZnVuY3Rpb24gbGluZVRheChsaW5lOiB7IHF1YW50aXR5OiBudW1iZXI7IHVuaXRQcmljZVBhaXNlOiBudW1iZXI7IGdzdFJhdGU6IG51bWJlciB9KTogbnVtYmVyIHsKICByZXR1cm4gTWF0aC5yb3VuZCgobGluZU5ldChsaW5lKSAqIGxpbmUuZ3N0UmF0ZSkgLyAxMDApOwp9Cg==', 'base64'), 'UTF8'), false, 6),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/utils/dates.ts', 'typescript', convert_from(decode('LyoqIFRvZGF5J3MgZGF0ZSBpbiBJbmRpYSBhcyBZWVlZLU1NLUREIChpbnZvaWNlcyBhcmUgZGF0ZWQgaW4gSVNUKS4gKi8KZXhwb3J0IGZ1bmN0aW9uIHRvZGF5SW5JbmRpYShub3c6IERhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHsKICByZXR1cm4gbm93LnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApOwp9Cg==', 'base64'), 'UTF8'), false, 7),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/utils/debounce.ts', 'typescript', convert_from(decode('LyoqIENsYXNzaWMgZGVib3VuY2U6IGBmbmAgcnVucyBvbmNlIGNhbGxzIHN0b3AgZm9yIGBtc2AsIHdpdGggdGhlIGxhc3QgY2FsbCdzIGFyZ3VtZW50cy4gKi8KZXhwb3J0IGZ1bmN0aW9uIGRlYm91bmNlPEEgZXh0ZW5kcyB1bmtub3duW10+KGZuOiAoLi4uYXJnczogQSkgPT4gdm9pZCwgbXM6IG51bWJlcikgewogIGxldCB0aW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCB1bmRlZmluZWQ7CiAgY29uc3QgZGVib3VuY2VkID0gKC4uLmFyZ3M6IEEpID0+IHsKICAgIGNsZWFyVGltZW91dCh0aW1lcik7CiAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gZm4oLi4uYXJncyksIG1zKTsKICB9OwogIGRlYm91bmNlZC5jYW5jZWwgPSAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIpOwogIHJldHVybiBkZWJvdW5jZWQ7Cn0K', 'base64'), 'UTF8'), true, 8),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/types.ts', 'typescript', convert_from(decode('ZXhwb3J0IHR5cGUgR3N0UmF0ZSA9IDAgfCA1IHwgMTIgfCAxOCB8IDI4OwoKLyoqIEEgUE8gdGhlIHN1cHBsaWVyIGNhbiBpbnZvaWNlIGFnYWluc3QgKGEgc2VhcmNoIHJlc3VsdCkuICovCmV4cG9ydCBpbnRlcmZhY2UgUG9TdW1tYXJ5IHsKICBpZDogc3RyaW5nOwogIG51bWJlcjogc3RyaW5nOwogIGJ1eWVyOiBzdHJpbmc7Cn0KCi8qKiBNb25leSBpcyBpbiBwYWlzZSAoaW50ZWdlcnMpOiDigrkxMi41MCBpcyAxMjUwLiAqLwpleHBvcnQgaW50ZXJmYWNlIFBvTGluZSB7CiAgc2t1OiBzdHJpbmc7CiAgZGVzY3JpcHRpb246IHN0cmluZzsKICBxdWFudGl0eTogbnVtYmVyOwogIHVuaXRQcmljZVBhaXNlOiBudW1iZXI7CiAgZ3N0UmF0ZTogR3N0UmF0ZTsKfQoKLyoqIE9uZSBsaW5lIG9mIHRoZSBpbnZvaWNlIGJlaW5nIGJ1aWx0LiBgaWRgIGlkZW50aWZpZXMgdGhlIGxpbmUgd2hpbGUgaXQgaXMgZWRpdGVkLiAqLwpleHBvcnQgaW50ZXJmYWNlIEludm9pY2VMaW5lIGV4dGVuZHMgUG9MaW5lIHsKICBpZDogc3RyaW5nOwp9CgpleHBvcnQgaW50ZXJmYWNlIEludm9pY2VEcmFmdCB7CiAgcG9JZDogc3RyaW5nIHwgbnVsbDsKICAvKiogWVlZWS1NTS1ERCBpbiBJbmRpYSB0aW1lOiBpbnZvaWNlcyBhcmUgZGF0ZWQgaW4gSVNUIHdoYXRldmVyIHRoZSBicm93c2VyJ3MgdGltZSB6b25lLiAqLwogIGludm9pY2VEYXRlOiBzdHJpbmc7CiAgbGluZXM6IEludm9pY2VMaW5lW107Cn0KCmV4cG9ydCBpbnRlcmZhY2UgSW52b2ljZUFwaSB7CiAgc2VhcmNoUG9zKHF1ZXJ5OiBzdHJpbmcpOiBQcm9taXNlPFBvU3VtbWFyeVtdPjsKICBnZXRQb0xpbmVzKHBvSWQ6IHN0cmluZyk6IFByb21pc2U8UG9MaW5lW10+OwogIHNhdmVEcmFmdChkcmFmdDogSW52b2ljZURyYWZ0KTogUHJvbWlzZTx2b2lkPjsKICBzdWJtaXQoZHJhZnQ6IEludm9pY2VEcmFmdCk6IFByb21pc2U8dm9pZD47Cn0K', 'base64'), 'UTF8'), true, 9),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/autosave.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCBkZWZlcnJlZCwgZmlyZUV2ZW50LCBmbHVzaFByb21pc2VzLCByZW5kZXIsIHNjcmVlbiB9IGZyb20gJ0Bjb2RlYXJlbmEvdGVzdC11dGlscyc7CmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7CmltcG9ydCB7IEFVVE9TQVZFX01TLCBJbnZvaWNlQnVpbGRlciB9IGZyb20gJy4uL3NyYy9JbnZvaWNlQnVpbGRlcic7CmltcG9ydCB7IGNyZWF0ZUZha2VBcGksIG9wZW5QbywgdHlwZUludG8gfSBmcm9tICcuL3N1cHBvcnQvZmFrZUFwaSc7CgpkZXNjcmliZSgnYXV0b3NhdmUnLCAoKSA9PiB7CiAgaXQoJ3NhdmVzIHRoZSBjdXJyZW50IGRyYWZ0IG9uY2UgdGhlIHN1cHBsaWVyIHN0b3BzIGVkaXRpbmcnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCB7IGFwaSB9ID0gYXdhaXQgb3BlblBvKCk7CgogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZShBVVRPU0FWRV9NUyAtIDEpKTsKICAgIGV4cGVjdChhcGkuc2F2ZWQpLnRvSGF2ZUxlbmd0aCgwKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoMSkpOwoKICAgIGV4cGVjdChhcGkuc2F2ZWQpLnRvSGF2ZUxlbmd0aCgxKTsKICAgIGV4cGVjdChhcGkuc2F2ZWRbMF0hLnBvSWQpLnRvQmUoJ3BvLTEnKTsKICAgIGV4cGVjdChhcGkuc2F2ZWRbMF0hLmxpbmVzLm1hcCgobCkgPT4gbC5za3UpKS50b0VxdWFsKFsnU0tVLUEnLCAnU0tVLUInLCAnU0tVLUMnXSk7CiAgfSk7CgogIGl0KCdzYXZlcyBxdWFudGl0eSBlZGl0cywgb25jZSBwZXIgYnVyc3Qgb2YgdHlwaW5nLCB3aXRoIHRoZSBsYXRlc3QgdmFsdWVzJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBhcGkgfSA9IGF3YWl0IG9wZW5QbygpOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZShBVVRPU0FWRV9NUykpOwogICAgY29uc3QgYmVmb3JlID0gYXBpLnNhdmVkLmxlbmd0aDsKCiAgICB0eXBlSW50bygncXR5LTEnLCAnNCcpOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZShBVVRPU0FWRV9NUyAvIDIpKTsKICAgIHR5cGVJbnRvKCdxdHktMicsICczJyk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKEFVVE9TQVZFX01TIC0gMSkpOwogICAgZXhwZWN0KGFwaS5zYXZlZC5sZW5ndGggLSBiZWZvcmUpLnRvQmUoMCk7IC8vIHRoZSBwYXVzZSBzdGFydHMgYWdhaW4gd2l0aCBldmVyeSBlZGl0CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKDEpKTsKCiAgICBleHBlY3QoYXBpLnNhdmVkLmxlbmd0aCAtIGJlZm9yZSkudG9CZSgxKTsKICAgIGV4cGVjdChhcGkuc2F2ZWRbYXBpLnNhdmVkLmxlbmd0aCAtIDFdIS5saW5lcy5tYXAoKGwpID0+IGwucXVhbnRpdHkpKS50b0VxdWFsKFs0LCAzLCAxXSk7CiAgfSk7CgogIGl0KCduZXZlciBzYXZlcyBhZnRlciB0aGUgaW52b2ljZSBpcyBzdWJtaXR0ZWQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCB7IGFwaSB9ID0gYXdhaXQgb3BlblBvKCk7CiAgICB0eXBlSW50bygncXR5LTEnLCAnNCcpOwoKICAgIGZpcmVFdmVudC5zdWJtaXQoc2NyZWVuLmdldEJ5VGVzdElkKCdpbnZvaWNlJykpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogICAgZXhwZWN0KGFwaS5zdWJtaXR0ZWQpLnRvSGF2ZUxlbmd0aCgxKTsgLy8gc2VudCBhdCBvbmNlOiB0aGUgc3VwcGxpZXIgaXMgd2FpdGluZyBmb3IgaXQKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoNV8wMDApKTsKCiAgICBleHBlY3QoYXBpLnN1Ym1pdHRlZCkudG9IYXZlTGVuZ3RoKDEpOwogICAgZXhwZWN0KGFwaS5zdWJtaXR0ZWRbMF0hLmxpbmVzWzBdIS5xdWFudGl0eSkudG9CZSg0KTsKICAgIGV4cGVjdChhcGkubG9nLnNsaWNlKGFwaS5sb2cuaW5kZXhPZignc3VibWl0JykpKS50b0VxdWFsKFsnc3VibWl0J10pOwogIH0pOwoKICBpdCgnbmV2ZXIgc2F2ZXMgd2hpbGUgYSBzbG93IHN1Ym1pdCBpcyBzdGlsbCBvbiBpdHMgd2F5JywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgYXBpID0gY3JlYXRlRmFrZUFwaSgpOwogICAgY29uc3Qgc2VuZGluZyA9IGRlZmVycmVkKCk7CiAgICBhcGkuc3VibWl0Lm1vY2tJbXBsZW1lbnRhdGlvbihhc3luYyAoZHJhZnQpID0+IHsKICAgICAgYXBpLmxvZy5wdXNoKCdzdWJtaXQnKTsKICAgICAgYXBpLnN1Ym1pdHRlZC5wdXNoKHN0cnVjdHVyZWRDbG9uZShkcmFmdCkpOwogICAgICBhd2FpdCBzZW5kaW5nLnByb21pc2U7CiAgICB9KTsKICAgIGF3YWl0IG9wZW5QbyhhcGkpOwogICAgdHlwZUludG8oJ3F0eS0xJywgJzQnKTsKCiAgICBmaXJlRXZlbnQuc3VibWl0KHNjcmVlbi5nZXRCeVRlc3RJZCgnaW52b2ljZScpKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoNV8wMDApKTsgLy8gdGhlIG5ldHdvcmsgaXMgc2xvdwogICAgYXdhaXQgYWN0KGFzeW5jICgpID0+IHNlbmRpbmcucmVzb2x2ZSh1bmRlZmluZWQpKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKCiAgICBleHBlY3QoYXBpLmxvZy5zbGljZShhcGkubG9nLmluZGV4T2YoJ3N1Ym1pdCcpKSkudG9FcXVhbChbJ3N1Ym1pdCddKTsKICB9KTsKCiAgaXQoJ2Egc2VhcmNoIGluIHRoZSBQTyBwaWNrZXIgZG9lcyBub3QgY2FuY2VsIGEgcGVuZGluZyBzYXZlJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBhcGkgfSA9IGF3YWl0IG9wZW5QbygpOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZShBVVRPU0FWRV9NUykpOwogICAgY29uc3QgYmVmb3JlID0gYXBpLnNhdmVkLmxlbmd0aDsKCiAgICB0eXBlSW50bygncXR5LTEnLCAnNCcpOwogICAgdHlwZUludG8oJ3BvLXNlYXJjaCcsICdNdW0nKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoQVVUT1NBVkVfTVMpKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKCiAgICBleHBlY3QoYXBpLnNhdmVkLmxlbmd0aCAtIGJlZm9yZSkudG9CZSgxKTsKICAgIGV4cGVjdChhcGkuc2F2ZWRbYXBpLnNhdmVkLmxlbmd0aCAtIDFdIS5saW5lc1swXSEucXVhbnRpdHkpLnRvQmUoNCk7CiAgfSk7CgogIGl0KCduZXZlciBzYXZlcyBhZnRlciB0aGUgYnVpbGRlciBpcyBjbG9zZWQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCB7IGFwaSwgdW5tb3VudCB9ID0gYXdhaXQgb3BlblBvKCk7CiAgICB0eXBlSW50bygncXR5LTEnLCAnNCcpOwoKICAgIHVubW91bnQoKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoNV8wMDApKTsKCiAgICBleHBlY3QoYXBpLnNhdmVEcmFmdCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsKICB9KTsKCiAgaXQoJ2RvZXMgbm90IHNhdmUgYmVmb3JlIGEgUE8gaXMgY2hvc2VuJywgKCkgPT4gewogICAgamVzdC51c2VGYWtlVGltZXJzKCk7CiAgICBjb25zdCBhcGkgPSBjcmVhdGVGYWtlQXBpKCk7CiAgICByZW5kZXIoPEludm9pY2VCdWlsZGVyIGFwaT17YXBpfSAvPik7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKDVfMDAwKSk7CiAgICBleHBlY3QoYXBpLnNhdmVEcmFmdCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 10),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/PoPicker.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCBmaXJlRXZlbnQsIGZsdXNoUHJvbWlzZXMsIHJlbmRlciwgc2NyZWVuIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgSW52b2ljZUJ1aWxkZXIgfSBmcm9tICcuLi9zcmMvSW52b2ljZUJ1aWxkZXInOwppbXBvcnQgeyBTRUFSQ0hfREVCT1VOQ0VfTVMgfSBmcm9tICcuLi9zcmMvY29tcG9uZW50cy9Qb1BpY2tlcic7CmltcG9ydCB7IGNyZWF0ZUZha2VBcGksIHR5cGVJbnRvIH0gZnJvbSAnLi9zdXBwb3J0L2Zha2VBcGknOwoKZGVzY3JpYmUoJ1BPIHNlYXJjaCcsICgpID0+IHsKICBpdCgnc2VuZHMgb25lIHJlcXVlc3Qgd2hlbiB0aGUgc3VwcGxpZXIgcGF1c2VzIHR5cGluZycsIGFzeW5jICgpID0+IHsKICAgIGplc3QudXNlRmFrZVRpbWVycygpOwogICAgY29uc3QgYXBpID0gY3JlYXRlRmFrZUFwaSgpOwogICAgcmVuZGVyKDxJbnZvaWNlQnVpbGRlciBhcGk9e2FwaX0gLz4pOwoKICAgIGZvciAoY29uc3QgdmFsdWUgb2YgWydQJywgJ1BPJywgJ1BPLScsICdQTy0yJywgJ1BPLTIwJ10pIHR5cGVJbnRvKCdwby1zZWFyY2gnLCB2YWx1ZSk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKFNFQVJDSF9ERUJPVU5DRV9NUykpOwoKICAgIGV4cGVjdChhcGkuc2VhcmNoUG9zKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7CiAgICBleHBlY3QoYXBpLnNlYXJjaFBvcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ1BPLTIwJyk7CiAgICBhd2FpdCBmbHVzaFByb21pc2VzKCk7IC8vIGxldCB0aGUgcmVzdWx0cyByZW5kZXIKICB9KTsKCiAgaXQoJ3dhaXRzIHVudGlsIHRoZSBzdXBwbGllciBzdG9wcyB0eXBpbmcsIGhvd2V2ZXIgbG9uZyB0aGV5IHR5cGUnLCBhc3luYyAoKSA9PiB7CiAgICBqZXN0LnVzZUZha2VUaW1lcnMoKTsKICAgIGNvbnN0IGFwaSA9IGNyZWF0ZUZha2VBcGkoKTsKICAgIHJlbmRlcig8SW52b2ljZUJ1aWxkZXIgYXBpPXthcGl9IC8+KTsKCiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIFsnUCcsICdQTycsICdQTy0nLCAnUE8tMicsICdQTy0yMCddKSB7CiAgICAgIHR5cGVJbnRvKCdwby1zZWFyY2gnLCB2YWx1ZSk7CiAgICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoU0VBUkNIX0RFQk9VTkNFX01TIC0gNTApKTsgLy8gYSBzbG93IHR5cGlzdAogICAgfQogICAgZXhwZWN0KGFwaS5zZWFyY2hQb3MpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKDUwKSk7CiAgICBleHBlY3QoYXBpLnNlYXJjaFBvcykudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpOwogICAgZXhwZWN0KGFwaS5zZWFyY2hQb3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdQTy0yMCcpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogIH0pOwoKICBpdCgnd2FpdHMgZm9yIHRoZSBwYXVzZSBiZWZvcmUgc2VhcmNoaW5nJywgYXN5bmMgKCkgPT4gewogICAgamVzdC51c2VGYWtlVGltZXJzKCk7CiAgICBjb25zdCBhcGkgPSBjcmVhdGVGYWtlQXBpKCk7CiAgICByZW5kZXIoPEludm9pY2VCdWlsZGVyIGFwaT17YXBpfSAvPik7CgogICAgdHlwZUludG8oJ3BvLXNlYXJjaCcsICdQdW5lJyk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKFNFQVJDSF9ERUJPVU5DRV9NUyAtIDEpKTsKICAgIGV4cGVjdChhcGkuc2VhcmNoUG9zKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZSgxKSk7CiAgICBleHBlY3QoYXBpLnNlYXJjaFBvcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ1B1bmUnKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKICB9KTsKCiAgaXQoJ2xpc3RzIG1hdGNoZXM7IGNob29zaW5nIG9uZSBpbXBvcnRzIGl0cyBsaW5lcycsIGFzeW5jICgpID0+IHsKICAgIGplc3QudXNlRmFrZVRpbWVycygpOwogICAgY29uc3QgYXBpID0gY3JlYXRlRmFrZUFwaSgpOwogICAgcmVuZGVyKDxJbnZvaWNlQnVpbGRlciBhcGk9e2FwaX0gLz4pOwoKICAgIHR5cGVJbnRvKCdwby1zZWFyY2gnLCAnbXVtYmFpJyk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKFNFQVJDSF9ERUJPVU5DRV9NUykpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogICAgZmlyZUV2ZW50LmNsaWNrKHNjcmVlbi5nZXRCeVRlc3RJZCgncG8tcG8tMicpKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKCiAgICBleHBlY3QoYXBpLmdldFBvTGluZXMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdwby0yJyk7CiAgICBleHBlY3Qoc2NyZWVuLmdldEFsbEJ5VGVzdElkKCdsaW5lJykpLnRvSGF2ZUxlbmd0aCgzKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 11),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/lines.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgZmlyZUV2ZW50LCBnZXRDb25zb2xlRXJyb3JzLCBzY3JlZW4sIHRleHRDb250ZW50IH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHsgaW5pdGlhbFN0YXRlLCBpbnZvaWNlUmVkdWNlciwgdHlwZSBJbnZvaWNlU3RhdGUgfSBmcm9tICcuLi9zcmMvc3RhdGUvaW52b2ljZVJlZHVjZXInOwppbXBvcnQgeyBQT19MSU5FUywgY3JlYXRlRmFrZUFwaSwgb3BlblBvLCB0eXBlSW50bywgdmFsdWVPZiB9IGZyb20gJy4vc3VwcG9ydC9mYWtlQXBpJzsKCmNvbnN0IGR1cGxpY2F0ZUtleVdhcm5pbmdzID0gKCkgPT4gZ2V0Q29uc29sZUVycm9ycygpLmZpbHRlcigobSkgPT4gL3NhbWUga2V5L2kudGVzdChtKSk7CmNvbnN0IGdyb3NzID0gKCkgPT4gdGV4dENvbnRlbnQoc2NyZWVuLmdldEJ5VGVzdElkKCd0b3RhbC1ncm9zcycpKTsKCmRlc2NyaWJlKCdpbnZvaWNlIGxpbmVzJywgKCkgPT4gewogIGl0KCdnaXZlcyBldmVyeSBsaW5lIGl0cyBvd24gaWQsIGV2ZW4gd2hlbiBzZXZlcmFsIGFyZSBjcmVhdGVkIGF0IG9uY2UnLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsgLy8gdGhlIFBPJ3MgdGhyZWUgbGluZXMgYXJlIGltcG9ydGVkIGF0IG9uY2UKICAgIGZpcmVFdmVudC5jbGljayhzY3JlZW4uZ2V0QnlUZXN0SWQoJ2FkZC1saW5lJykpOwogICAgZmlyZUV2ZW50LmNsaWNrKHNjcmVlbi5nZXRCeVRlc3RJZCgnYWRkLWxpbmUnKSk7CgogICAgLy8gRWFjaCBsaW5lIGtlZXBzIGl0cyBvd24gdmFsdWU6IGxpbmVzIHRoYXQgc2hhcmVkIGFuIGlkIHdvdWxkIGNoYW5nZSB0b2dldGhlci4KICAgIFsnU0tVLTEnLCAnU0tVLTInLCAnU0tVLTMnLCAnU0tVLTQnLCAnU0tVLTUnXS5mb3JFYWNoKChza3UsIGkpID0+IHR5cGVJbnRvKGBza3UtJHtpICsgMX1gLCBza3UpKTsKICAgIGV4cGVjdChbMSwgMiwgMywgNCwgNV0ubWFwKChuKSA9PiB2YWx1ZU9mKGBza3UtJHtufWApKSkudG9FcXVhbChbJ1NLVS0xJywgJ1NLVS0yJywgJ1NLVS0zJywgJ1NLVS00JywgJ1NLVS01J10pOwogICAgZXhwZWN0KGR1cGxpY2F0ZUtleVdhcm5pbmdzKCkpLnRvRXF1YWwoW10pOwogIH0pOwoKICBpdCgnZ2l2ZXMgYSBsaW5lIGFkZGVkIGFmdGVyIGEgcmVtb3ZhbCBpdHMgb3duIGlkJywgYXN5bmMgKCkgPT4gewogICAgYXdhaXQgb3BlblBvKCk7CiAgICBmaXJlRXZlbnQuY2xpY2soc2NyZWVuLmdldEJ5VGVzdElkKCdyZW1vdmUtMScpKTsKICAgIGZpcmVFdmVudC5jbGljayhzY3JlZW4uZ2V0QnlUZXN0SWQoJ2FkZC1saW5lJykpOwogICAgdHlwZUludG8oJ3NrdS0zJywgJ1NLVS1ORVcnKTsKCiAgICBleHBlY3QoW3ZhbHVlT2YoJ3NrdS0xJyksIHZhbHVlT2YoJ3NrdS0yJyksIHZhbHVlT2YoJ3NrdS0zJyldKS50b0VxdWFsKFsnU0tVLUInLCAnU0tVLUMnLCAnU0tVLU5FVyddKTsKICAgIGV4cGVjdChkdXBsaWNhdGVLZXlXYXJuaW5ncygpKS50b0VxdWFsKFtdKTsKICB9KTsKCiAgaXQoJ2VkaXRzIG9ubHkgdGhlIGxpbmUgdGhhdCB3YXMgY2hhbmdlZCcsIGFzeW5jICgpID0+IHsKICAgIGF3YWl0IG9wZW5QbygpOwoKICAgIHR5cGVJbnRvKCdxdHktMicsICc3Jyk7CgogICAgZXhwZWN0KFt2YWx1ZU9mKCdxdHktMScpLCB2YWx1ZU9mKCdxdHktMicpLCB2YWx1ZU9mKCdxdHktMycpXSkudG9FcXVhbChbMTAsIDcsIDFdKTsKICAgIGV4cGVjdChkdXBsaWNhdGVLZXlXYXJuaW5ncygpKS50b0VxdWFsKFtdKTsKICB9KTsKCiAgaXQoJ3JlbW92ZXMgb25seSB0aGUgbGluZSB0aGF0IHdhcyByZW1vdmVkJywgYXN5bmMgKCkgPT4gewogICAgYXdhaXQgb3BlblBvKCk7CgogICAgZmlyZUV2ZW50LmNsaWNrKHNjcmVlbi5nZXRCeVRlc3RJZCgncmVtb3ZlLTEnKSk7CgogICAgZXhwZWN0KHNjcmVlbi5nZXRBbGxCeVRlc3RJZCgnbGluZScpKS50b0hhdmVMZW5ndGgoMik7CiAgICBleHBlY3QodmFsdWVPZignc2t1LTEnKSkudG9CZSgnU0tVLUInKTsKICB9KTsKCiAgaXQoJ2tlZXBzIGxpbmVzIHRoYXQgd2VyZSBhZGRlZCBxdWlja2x5IGFwYXJ0JywgYXN5bmMgKCkgPT4gewogICAgYXdhaXQgb3BlblBvKCk7CgogICAgZmlyZUV2ZW50LmNsaWNrKHNjcmVlbi5nZXRCeVRlc3RJZCgnYWRkLWxpbmUnKSk7CiAgICBmaXJlRXZlbnQuY2xpY2soc2NyZWVuLmdldEJ5VGVzdElkKCdhZGQtbGluZScpKTsKICAgIHR5cGVJbnRvKCdza3UtNScsICdTS1UtWicpOwoKICAgIGV4cGVjdChzY3JlZW4uZ2V0QWxsQnlUZXN0SWQoJ2xpbmUnKSkudG9IYXZlTGVuZ3RoKDUpOwogICAgZXhwZWN0KFt2YWx1ZU9mKCdza3UtMScpLCB2YWx1ZU9mKCdza3UtNCcpLCB2YWx1ZU9mKCdza3UtNScpXSkudG9FcXVhbChbJ1NLVS1BJywgJycsICdTS1UtWiddKTsKICAgIGV4cGVjdChkdXBsaWNhdGVLZXlXYXJuaW5ncygpKS50b0VxdWFsKFtdKTsKICB9KTsKfSk7CgpkZXNjcmliZSgndG90YWxzIGFuZCB1bmRvJywgKCkgPT4gewogIGl0KCdzaG93cyB0aGUgdG90YWxzIG9mIHRoZSBpbXBvcnRlZCBQTycsIGFzeW5jICgpID0+IHsKICAgIGF3YWl0IG9wZW5QbygpOwoKICAgIGV4cGVjdCh0ZXh0Q29udGVudChzY3JlZW4uZ2V0QnlUZXN0SWQoJ3RvdGFsLW5ldCcpKSkudG9CZSgn4oK5OSw5OTguMDAnKTsKICAgIGV4cGVjdCh0ZXh0Q29udGVudChzY3JlZW4uZ2V0QnlUZXN0SWQoJ3RvdGFsLXRheCcpKSkudG9CZSgn4oK5MSw2NDkuNjQnKTsKICAgIGV4cGVjdChncm9zcygpKS50b0JlKCfigrkxMSw2NDcuNjQnKTsKICB9KTsKCiAgaXQoJ3VwZGF0ZXMgdGhlIHRvdGFscyBvbiBldmVyeSBlZGl0JywgYXN5bmMgKCkgPT4gewogICAgYXdhaXQgb3BlblBvKCk7CgogICAgdHlwZUludG8oJ3F0eS0xJywgJzQnKTsKCiAgICBleHBlY3QodGV4dENvbnRlbnQoc2NyZWVuLmdldEJ5VGVzdElkKCd0b3RhbC0xJykpKS50b0JlKCfigrkxLDAwMC4wMCcpOwogICAgZXhwZWN0KGdyb3NzKCkpLnRvQmUoJ+KCuTksOTY3LjY0Jyk7CiAgfSk7CgogIGl0KCdrZWVwcyB0d28gUE8gbGluZXMgd2l0aCB0aGUgc2FtZSBTS1UgYXBhcnQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBhcGkgPSBjcmVhdGVGYWtlQXBpKCk7CiAgICBjb25zdCBbcGFwZXJdID0gUE9fTElORVM7CiAgICBhcGkuZ2V0UG9MaW5lcy5tb2NrSW1wbGVtZW50YXRpb24oYXN5bmMgKCkgPT4gWwogICAgICB7IC4uLnBhcGVyISB9LAogICAgICB7IC4uLnBhcGVyISwgZGVzY3JpcHRpb246ICdDb3BpZXIgcGFwZXIgQTQgKHNlY29uZCBkZWxpdmVyeSknIH0sCiAgICBdKTsKICAgIGF3YWl0IG9wZW5QbyhhcGkpOwoKICAgIHR5cGVJbnRvKCdxdHktMicsICc3Jyk7CgogICAgZXhwZWN0KHZhbHVlT2YoJ3F0eS0xJykpLnRvQmUoMTApOwogICAgZXhwZWN0KHZhbHVlT2YoJ3F0eS0yJykpLnRvQmUoNyk7CiAgICBleHBlY3QoZHVwbGljYXRlS2V5V2FybmluZ3MoKSkudG9FcXVhbChbXSk7CiAgfSk7CgogIGl0KCd1bmRvIHB1dHMgYmFjayB0aGUgcHJldmlvdXMgcXVhbnRpdHkgYW5kIHRvdGFscycsIGFzeW5jICgpID0+IHsKICAgIGF3YWl0IG9wZW5QbygpOwogICAgdHlwZUludG8oJ3F0eS0xJywgJzQnKTsKCiAgICBmaXJlRXZlbnQuY2xpY2soc2NyZWVuLmdldEJ5VGVzdElkKCd1bmRvJykpOwoKICAgIGV4cGVjdCh2YWx1ZU9mKCdxdHktMScpKS50b0JlKDEwKTsKICAgIGV4cGVjdChncm9zcygpKS50b0JlKCfigrkxMSw2NDcuNjQnKTsKICB9KTsKCiAgaXQoJ2FuIGVkaXQgbmV2ZXIgY2hhbmdlcyB0aGUgdmVyc2lvbiB0aGF0IFVuZG8gcmV0dXJucyB0bycsICgpID0+IHsKICAgIGNvbnN0IGltcG9ydGVkOiBJbnZvaWNlU3RhdGUgPSB7CiAgICAgIC4uLmluaXRpYWxTdGF0ZSwKICAgICAgbGluZXM6IFBPX0xJTkVTLm1hcCgobGluZSwgaSkgPT4gKHsgLi4ubGluZSwgaWQ6IGBsaW5lLSR7aSArIDF9YCB9KSksCiAgICB9OwogICAgY29uc3QgaWQgPSBpbXBvcnRlZC5saW5lc1swXSEuaWQ7CgogICAgY29uc3QgZWRpdGVkID0gaW52b2ljZVJlZHVjZXIoaW1wb3J0ZWQsIHsgdHlwZTogJ3VwZGF0ZUxpbmUnLCBpZCwgcGF0Y2g6IHsgcXVhbnRpdHk6IDk5IH0gfSk7CgogICAgZXhwZWN0KGltcG9ydGVkLmxpbmVzWzBdIS5xdWFudGl0eSkudG9CZSgxMCk7CiAgICBleHBlY3QoZWRpdGVkLmxpbmVzWzBdIS5xdWFudGl0eSkudG9CZSg5OSk7CiAgICBleHBlY3QoZWRpdGVkLmxpbmVzKS5ub3QudG9CZShpbXBvcnRlZC5saW5lcyk7CiAgfSk7Cn0pOwo=', 'base64'), 'UTF8'), true, 12),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/MoneyInput.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgZmlyZUV2ZW50LCBzY3JlZW4sIHRleHRDb250ZW50IH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHsgcGFyc2VSdXBlZXMgfSBmcm9tICcuLi9zcmMvdXRpbHMvbW9uZXknOwppbXBvcnQgeyBvcGVuUG8sIHR5cGVJbnRvLCB2YWx1ZU9mIH0gZnJvbSAnLi9zdXBwb3J0L2Zha2VBcGknOwoKY29uc3QgbGluZVRvdGFsID0gKCkgPT4gdGV4dENvbnRlbnQoc2NyZWVuLmdldEJ5VGVzdElkKCd0b3RhbC0xJykpOwoKZGVzY3JpYmUoJ3ByaWNlIGZpZWxkJywgKCkgPT4gewogIGl0KCdrZWVwcyB0aGUgZGVjaW1hbCBwb2ludCB3aGlsZSB0aGUgc3VwcGxpZXIgdHlwZXMg4oK5MTIuNTAnLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsKCiAgICB0eXBlSW50bygncHJpY2UtMScsICcxMi4nKTsKICAgIGV4cGVjdCh2YWx1ZU9mKCdwcmljZS0xJykpLnRvQmUoJzEyLicpOwogICAgdHlwZUludG8oJ3ByaWNlLTEnLCAnMTIuNScpOwoKICAgIGV4cGVjdCh2YWx1ZU9mKCdwcmljZS0xJykpLnRvQmUoJzEyLjUnKTsKICAgIGV4cGVjdChsaW5lVG90YWwoKSkudG9CZSgn4oK5MTI1LjAwJyk7CiAgfSk7CgogIGl0KCdzaG93cyBleGFjdGx5IHdoYXQgd2FzIHR5cGVkIHdoaWxlIHR5cGluZyAo4oK5MTIuMCwg4oK5MC4wNSknLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsKCiAgICB0eXBlSW50bygncHJpY2UtMScsICcxMi4wJyk7CiAgICBleHBlY3QodmFsdWVPZigncHJpY2UtMScpKS50b0JlKCcxMi4wJyk7CiAgICBmb3IgKGNvbnN0IHRleHQgb2YgWycwJywgJzAuJywgJzAuMCcsICcwLjA1J10pIHsKICAgICAgdHlwZUludG8oJ3ByaWNlLTEnLCB0ZXh0KTsKICAgICAgZXhwZWN0KHZhbHVlT2YoJ3ByaWNlLTEnKSkudG9CZSh0ZXh0KTsKICAgIH0KICAgIGV4cGVjdChsaW5lVG90YWwoKSkudG9CZSgn4oK5MC41MCcpOwogIH0pOwoKICBpdCgnc2hvd3MgdGhlIHJlc3RvcmVkIHByaWNlIGFmdGVyIFVuZG8nLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsKCiAgICB0eXBlSW50bygncHJpY2UtMScsICc5OScpOwogICAgY29uc3QgcHJpY2UgPSBzY3JlZW4uZ2V0QnlUZXN0SWQoJ3ByaWNlLTEnKTsKICAgIGlmIChwcmljZS5wcm9wcy5vbkJsdXIpIGZpcmVFdmVudChwcmljZSwgJ2JsdXInLCB7IHRhcmdldDogeyB2YWx1ZTogJzk5JyB9IH0pOyAvLyB0aGUgZmllbGQgaXMgbGVmdAogICAgZmlyZUV2ZW50LmNsaWNrKHNjcmVlbi5nZXRCeVRlc3RJZCgndW5kbycpKTsKCiAgICBleHBlY3QocGFyc2VSdXBlZXMoU3RyaW5nKHZhbHVlT2YoJ3ByaWNlLTEnKSkpKS50b0JlKDI1XzAwMCk7CiAgICBleHBlY3QobGluZVRvdGFsKCkpLnRvQmUoJ+KCuTIsNTAwLjAwJyk7CiAgfSk7CgogIGl0KCdjYW4gYmUgY2xlYXJlZCBhbmQgdHlwZWQgYWdhaW4nLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsKCiAgICB0eXBlSW50bygncHJpY2UtMScsICcnKTsKICAgIGV4cGVjdCh2YWx1ZU9mKCdwcmljZS0xJykpLnRvQmUoJycpOwogICAgdHlwZUludG8oJ3ByaWNlLTEnLCAnOTknKTsKCiAgICBleHBlY3QodmFsdWVPZigncHJpY2UtMScpKS50b0JlKCc5OScpOwogICAgZXhwZWN0KGxpbmVUb3RhbCgpKS50b0JlKCfigrk5OTAuMDAnKTsKICB9KTsKCiAgaXQoJ2FjY2VwdHMgYSBwYXN0ZWQgYW1vdW50IHdpdGggZGlnaXQgZ3JvdXBpbmcnLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsKCiAgICB0eXBlSW50bygncHJpY2UtMScsICcxLDI1MC41MCcpOwoKICAgIGV4cGVjdChsaW5lVG90YWwoKSkudG9CZSgn4oK5MTIsNTA1LjAwJyk7CiAgfSk7Cn0pOwoKZGVzY3JpYmUoJ3BhcnNlUnVwZWVzJywgKCkgPT4gewogIGl0KCdyZWFkcyBwbGFpbiwgZ3JvdXBlZCBhbmQg4oK5IGFtb3VudHMnLCAoKSA9PiB7CiAgICBleHBlY3QocGFyc2VSdXBlZXMoJzEyNTAnKSkudG9CZSgxMjVfMDAwKTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygnOTkuOScpKS50b0JlKDlfOTkwKTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygnMC4yOScpKS50b0JlKDI5KTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygnMSwyNTAuNTAnKSkudG9CZSgxMjVfMDUwKTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygn4oK5IDEsMjMsNDU2JykpLnRvQmUoMTJfMzQ1XzYwMCk7CiAgICBleHBlY3QocGFyc2VSdXBlZXMoJyAxMi41ICcpKS50b0JlKDFfMjUwKTsKICB9KTsKCiAgaXQoJ3JlamVjdHMgYW55dGhpbmcgdGhhdCBpcyBub3QgYSB2YWxpZCBhbW91bnQnLCAoKSA9PiB7CiAgICBmb3IgKGNvbnN0IHRleHQgb2YgWycnLCAnLicsICdhYmMnLCAnMTJhYmMnLCAnMS4wMDUnLCAnLTUnLCAnMS4yLjMnLCAnMWUzJywgJzB4MTAnLCAnSW5maW5pdHknXSkgewogICAgICBleHBlY3QoW3RleHQsIHBhcnNlUnVwZWVzKHRleHQpXSkudG9FcXVhbChbdGV4dCwgbnVsbF0pOwogICAgfQogIH0pOwp9KTsK', 'base64'), 'UTF8'), true, 13),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/dates.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgcmVuZGVyLCBzY3JlZW4sIHRleHRDb250ZW50IH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgSW52b2ljZUJ1aWxkZXIgfSBmcm9tICcuLi9zcmMvSW52b2ljZUJ1aWxkZXInOwppbXBvcnQgeyB0b2RheUluSW5kaWEgfSBmcm9tICcuLi9zcmMvdXRpbHMvZGF0ZXMnOwppbXBvcnQgeyBjcmVhdGVGYWtlQXBpIH0gZnJvbSAnLi9zdXBwb3J0L2Zha2VBcGknOwoKZGVzY3JpYmUoJ2ludm9pY2UgZGF0ZSAoSVNUKScsICgpID0+IHsKICBpdCgnaXMgdGhlIEluZGlhbiBkYXRlIGp1c3QgYWZ0ZXIgbWlkbmlnaHQgaW4gSW5kaWEnLCAoKSA9PiB7CiAgICBleHBlY3QodG9kYXlJbkluZGlhKG5ldyBEYXRlKCcyMDI2LTAzLTMxVDE4OjMwOjAwWicpKSkudG9CZSgnMjAyNi0wNC0wMScpOyAvLyAwMDowMCBJU1QKICAgIGV4cGVjdCh0b2RheUluSW5kaWEobmV3IERhdGUoJzIwMjYtMDQtMDFUMDA6MDA6MDBaJykpKS50b0JlKCcyMDI2LTA0LTAxJyk7IC8vIDA1OjMwIElTVAogIH0pOwoKICBpdCgnaXMgdGhlIEluZGlhbiBkYXRlIGxhdGUgaW4gdGhlIGV2ZW5pbmcnLCAoKSA9PiB7CiAgICBleHBlY3QodG9kYXlJbkluZGlhKG5ldyBEYXRlKCcyMDI2LTAzLTMxVDE4OjI5OjU5WicpKSkudG9CZSgnMjAyNi0wMy0zMScpOyAvLyAyMzo1OTo1OSBJU1QKICAgIGV4cGVjdCh0b2RheUluSW5kaWEobmV3IERhdGUoJzIwMjYtMTItMzFUMTg6Mjk6MDBaJykpKS50b0JlKCcyMDI2LTEyLTMxJyk7CiAgfSk7CgogIGl0KCdkYXRlcyBhIG5ldyBpbnZvaWNlIHdpdGggdGhlIGRhdGUgaW4gSW5kaWEnLCAoKSA9PiB7CiAgICBqZXN0LnVzZUZha2VUaW1lcnMoKTsKICAgIGplc3Quc2V0U3lzdGVtVGltZShuZXcgRGF0ZSgnMjAyNi0wNC0zMFQxOTowMDowMFonKSk7IC8vIDAwOjMwIElTVCBvbiAxIE1heQogICAgcmVuZGVyKDxJbnZvaWNlQnVpbGRlciBhcGk9e2NyZWF0ZUZha2VBcGkoKX0gLz4pOwoKICAgIGV4cGVjdCh0ZXh0Q29udGVudChzY3JlZW4uZ2V0QnlUZXN0SWQoJ2ludm9pY2UtZGF0ZScpKSkudG9CZSgnMjAyNi0wNS0wMScpOwogIH0pOwp9KTsK', 'base64'), 'UTF8'), true, 14),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/support/fakeApi.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCBmaXJlRXZlbnQsIGZsdXNoUHJvbWlzZXMsIHJlbmRlciwgc2NyZWVuIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgSW52b2ljZUJ1aWxkZXIgfSBmcm9tICcuLi8uLi9zcmMvSW52b2ljZUJ1aWxkZXInOwppbXBvcnQgeyBTRUFSQ0hfREVCT1VOQ0VfTVMgfSBmcm9tICcuLi8uLi9zcmMvY29tcG9uZW50cy9Qb1BpY2tlcic7CmltcG9ydCB0eXBlIHsgSW52b2ljZUFwaSwgSW52b2ljZURyYWZ0LCBQb0xpbmUsIFBvU3VtbWFyeSB9IGZyb20gJy4uLy4uL3NyYy90eXBlcyc7CgpleHBvcnQgY29uc3QgUE9TOiBQb1N1bW1hcnlbXSA9IFsKICB7IGlkOiAncG8tMScsIG51bWJlcjogJ1BPLTIwMjYtMDA0MicsIGJ1eWVyOiAnWnljdXMgUHVuZScgfSwKICB7IGlkOiAncG8tMicsIG51bWJlcjogJ1BPLTIwMjYtMDA0MycsIGJ1eWVyOiAnWnljdXMgTXVtYmFpJyB9LApdOwoKLyoqIE5ldCDigrk5LDk5OC4wMCwgR1NUIOKCuTEsNjQ5LjY0LCB0b3RhbCDigrkxMSw2NDcuNjQuICovCmV4cG9ydCBjb25zdCBQT19MSU5FUzogUG9MaW5lW10gPSBbCiAgeyBza3U6ICdTS1UtQScsIGRlc2NyaXB0aW9uOiAnQ29waWVyIHBhcGVyIEE0JywgcXVhbnRpdHk6IDEwLCB1bml0UHJpY2VQYWlzZTogMjVfMDAwLCBnc3RSYXRlOiAxMiB9LAogIHsgc2t1OiAnU0tVLUInLCBkZXNjcmlwdGlvbjogJ1RvbmVyIGNhcnRyaWRnZScsIHF1YW50aXR5OiAyLCB1bml0UHJpY2VQYWlzZTogMzQ5XzkwMCwgZ3N0UmF0ZTogMTggfSwKICB7IHNrdTogJ1NLVS1DJywgZGVzY3JpcHRpb246ICdEZWxpdmVyeScsIHF1YW50aXR5OiAxLCB1bml0UHJpY2VQYWlzZTogNTBfMDAwLCBnc3RSYXRlOiAxOCB9LApdOwoKLyoqIFRoZSBBUEksIHJlY29yZGluZyBjYWxscyBpbiBvcmRlci4gRHJhZnRzIGFyZSBjb3BpZWQgd2hlbiB0aGV5IGFyZSBzZW50LCBhcyB0aGUgbmV0d29yayB3b3VsZC4gKi8KZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZha2VBcGkoKSB7CiAgY29uc3QgbG9nOiBzdHJpbmdbXSA9IFtdOwogIGNvbnN0IHNhdmVkOiBJbnZvaWNlRHJhZnRbXSA9IFtdOwogIGNvbnN0IHN1Ym1pdHRlZDogSW52b2ljZURyYWZ0W10gPSBbXTsKICBjb25zdCBhcGkgPSB7CiAgICBsb2csCiAgICBzYXZlZCwKICAgIHN1Ym1pdHRlZCwKICAgIHNlYXJjaFBvczogamVzdC5mbihhc3luYyAocXVlcnk6IHN0cmluZykgPT4gewogICAgICBsb2cucHVzaChgc2VhcmNoOiR7cXVlcnl9YCk7CiAgICAgIGNvbnN0IHEgPSBxdWVyeS50b0xvd2VyQ2FzZSgpOwogICAgICByZXR1cm4gUE9TLmZpbHRlcigocG8pID0+IHBvLm51bWJlci50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpIHx8IHBvLmJ1eWVyLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSkpOwogICAgfSksCiAgICBnZXRQb0xpbmVzOiBqZXN0LmZuKGFzeW5jIChwb0lkOiBzdHJpbmcpID0+IHsKICAgICAgbG9nLnB1c2goYGxpbmVzOiR7cG9JZH1gKTsKICAgICAgcmV0dXJuIFBPX0xJTkVTLm1hcCgobGluZSkgPT4gKHsgLi4ubGluZSB9KSk7CiAgICB9KSwKICAgIHNhdmVEcmFmdDogamVzdC5mbihhc3luYyAoZHJhZnQ6IEludm9pY2VEcmFmdCkgPT4gewogICAgICBsb2cucHVzaCgnc2F2ZScpOwogICAgICBzYXZlZC5wdXNoKHN0cnVjdHVyZWRDbG9uZShkcmFmdCkpOwogICAgfSksCiAgICBzdWJtaXQ6IGplc3QuZm4oYXN5bmMgKGRyYWZ0OiBJbnZvaWNlRHJhZnQpID0+IHsKICAgICAgbG9nLnB1c2goJ3N1Ym1pdCcpOwogICAgICBzdWJtaXR0ZWQucHVzaChzdHJ1Y3R1cmVkQ2xvbmUoZHJhZnQpKTsKICAgIH0pLAogIH0gc2F0aXNmaWVzIEludm9pY2VBcGkgJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjsKICByZXR1cm4gYXBpOwp9CgpleHBvcnQgdHlwZSBGYWtlQXBpID0gUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlRmFrZUFwaT47CgovKiogUmVuZGVycyB0aGUgYnVpbGRlciB3aXRoIGZha2UgdGltZXJzLCBmaW5kcyBQTy0yMDI2LTAwNDIgYW5kIGltcG9ydHMgaXRzIGxpbmVzLiAqLwpleHBvcnQgYXN5bmMgZnVuY3Rpb24gb3BlblBvKGFwaTogRmFrZUFwaSA9IGNyZWF0ZUZha2VBcGkoKSkgewogIGplc3QudXNlRmFrZVRpbWVycygpOwogIGNvbnN0IHV0aWxzID0gcmVuZGVyKDxJbnZvaWNlQnVpbGRlciBhcGk9e2FwaX0gLz4pOwogIGZpcmVFdmVudC5jaGFuZ2Uoc2NyZWVuLmdldEJ5VGVzdElkKCdwby1zZWFyY2gnKSwgeyB0YXJnZXQ6IHsgdmFsdWU6ICcwMDQyJyB9IH0pOwogIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoU0VBUkNIX0RFQk9VTkNFX01TKSk7CiAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogIGZpcmVFdmVudC5jbGljayhzY3JlZW4uZ2V0QnlUZXN0SWQoJ3BvLXBvLTEnKSk7CiAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogIHJldHVybiB7IGFwaSwgLi4udXRpbHMgfTsKfQoKLyoqIFR5cGVzIGludG8gYW4gaW5wdXQgKGEgY2hhbmdlIGV2ZW50IHdpdGggdGhlIG5ldyB0ZXh0KS4gKi8KZXhwb3J0IGZ1bmN0aW9uIHR5cGVJbnRvKHRlc3RJZDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7CiAgZmlyZUV2ZW50LmNoYW5nZShzY3JlZW4uZ2V0QnlUZXN0SWQodGVzdElkKSwgeyB0YXJnZXQ6IHsgdmFsdWUgfSB9KTsKfQoKZXhwb3J0IGNvbnN0IHZhbHVlT2YgPSAodGVzdElkOiBzdHJpbmcpOiB1bmtub3duID0+IHNjcmVlbi5nZXRCeVRlc3RJZCh0ZXN0SWQpLnByb3BzLnZhbHVlOwo=', 'base64'), 'UTF8'), true, 15),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'package.json', 'json', convert_from(decode('ewogICJuYW1lIjogInp5Y3VzLXN1cHBsaWVyLXBvcnRhbC1pbnZvaWNlcyIsCiAgInZlcnNpb24iOiAiMy40LjAiLAogICJwcml2YXRlIjogdHJ1ZSwKICAic2NyaXB0cyI6IHsKICAgICJkZXYiOiAidml0ZSIsCiAgICAidGVzdCI6ICJqZXN0IgogIH0sCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJyZWFjdCI6ICIxOS4xLjAiLAogICAgInJlYWN0LWRvbSI6ICIxOS4xLjAiCiAgfSwKICAiZGV2RGVwZW5kZW5jaWVzIjogewogICAgIkB0ZXN0aW5nLWxpYnJhcnkvcmVhY3QiOiAiMTYuMy4wIiwKICAgICJqZXN0IjogIjI5LjcuMCIsCiAgICAidHlwZXNjcmlwdCI6ICI1LjguMyIsCiAgICAidml0ZSI6ICI3LjEuNSIKICB9Cn0K', 'base64'), 'UTF8'), true, 16)
  on conflict (question_id, path) do update set language = excluded.language, content = excluded.content,
    readonly = excluded.readonly, sort_order = excluded.sort_order;
  delete from public.question_rubric_items where question_id = 'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13' and key <> all (array['autosave', 'debounce', 'identity', 'immutability', 'money_input', 'timezone', 'code_quality']::text[]);
  insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'autosave', 'Autosave saves the latest draft, and never after submit or close', convert_from(decode('TGF0ZXN0IGNhbGxiYWNrIHRocm91Z2ggYSByZWYgdXBkYXRlZCBpbiBhbiBlZmZlY3QgKG5vdCBtZW1vIGRlcHMsIG5vdCByZW5kZXItdGltZSBhc3NpZ25tZW50KTsgdGltZXIgY2xlYXJlZCBvbiB1bm1vdW50OyBwZW5kaW5nIGF1dG9zYXZlIGNhbmNlbGxlZCAob3IgZmx1c2hlZCkgb24gc3VibWl0Lg==', 'base64'), 'UTF8'), 6, 0),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'debounce', 'Search is debounced once', 'Explains that useMemo with an unstable dependency rebuilt the debounce every render; one debounced function per component, cleaned up on unmount.', 3, 1),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'identity', 'Lines have unique ids', 'Replaces Date.now() ids with a counter / randomUUID; explains the duplicate keys and the by-id updates hitting several lines; no index keys.', 3, 2),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'immutability', 'State updates are immutable', 'updateLine returns a new array and object; explains reference equality in useMemo/useEffect deps and why Undo broke.', 4, 3),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'money_input', 'Price field and parsing are correct', 'Local text state while typing, parent updated only with valid amounts; parseRupees validates the whole string, strips ₹/commas, no float * 100.', 4, 4),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'timezone', 'Invoice date is the date in India', 'Intl.DateTimeFormat with timeZone Asia/Kolkata instead of the UTC date from toISOString.', 2, 5),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'code_quality', 'Root-cause fixes, clean code', 'No test special-casing, no eslint-disable to hide real dependency problems, readable explanations.', 2, 6)
  on conflict (question_id, key) do update set criterion = excluded.criterion,
    description = excluded.description, max_points = excluded.max_points, sort_order = excluded.sort_order;
  insert into public.question_solutions (question_id, notes_md, files) values (
    'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', convert_from(decode('IyMgUmV2aWV3ZXIgbm90ZXM6IFN1cHBsaWVyIEludm9pY2UgQnVpbGRlcgoKQWxsIHRlc3RzIGZhaWwgb24gdGhlIHN0YXJ0ZXIgY29kZSB3aGVyZSBhIHBsYW50ZWQgYnVnIHNpdHMsIGFuZCBwYXNzIHdpdGggdGhpcyByZWZlcmVuY2UKc29sdXRpb24uIFJlYWQgdGhlIGRpZmY6IHRoZSBleHBsYW5hdGlvbnMgaW4gY29tbWVudHMgbWF0dGVyIGFzIG11Y2ggYXMgdGhlIGdyZWVuIHRlc3RzLgoKIyMjIDEuIFN0YWxlIGF1dG9zYXZlIChgdXNlRGVib3VuY2VkQ2FsbGJhY2tgKQoKVGhlIGhvb2sgbWVtb2lzZXMgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBvbiBgW2RlbGF5TXNdYCBvbmx5LiBJdCBjbG9zZXMgb3ZlciB0aGUgKipmaXJzdApyZW5kZXIncyoqIGBmbmAsIGFuZCBzbyBvdmVyIHRoZSBmaXJzdCByZW5kZXIncyBgZHJhZnRgLgoKLSAqKkZpeDoqKiBrZWVwIHRoZSBsYXRlc3QgYGZuYCBpbiBhIHJlZiwgdXBkYXRlZCBpbiBhbiBlZmZlY3QgKGB1c2VMYXlvdXRFZmZlY3RgIC8KICBgdXNlSW5zZXJ0aW9uRWZmZWN0YCwgb3IgUmVhY3QgMTkncyBgdXNlRWZmZWN0RXZlbnRgKSwgYW5kIGNhbGwgYHJlZi5jdXJyZW50YCBmcm9tIHRoZSB0aW1lci4KLSAqKlJlZCBmbGFnczoqKgogIC0gYWRkaW5nIGBmbmAgdG8gdGhlIG1lbW8gZGVwczogdGhlIGRlYm91bmNlIGlzIHJlY3JlYXRlZCBldmVyeSByZW5kZXIgYW5kIG5ldmVyIGNvYWxlc2NlczsKICAtIGFzc2lnbmluZyB0aGUgcmVmIGR1cmluZyByZW5kZXI6IHdvcmtzLCBidXQgYnJlYWtzIFJlYWN0J3MgcnVsZXMgKHRlYXJpbmcgaW4gY29uY3VycmVudAogICAgcmVuZGVyaW5nKSwgc28gaXQgZ2V0cyBvbmx5IHBhcnRpYWwgY3JlZGl0LgoKIyMjIDIuIFNhdmVzIGFmdGVyIHN1Ym1pdCAvIGNsb3NlCgotIFRoZSBob29rIG5ldmVyIGNsZWFycyBpdHMgdGltZXIgb24gdW5tb3VudDogYHVzZUVmZmVjdCgoKSA9PiBjYW5jZWwsIFtkZWJvdW5jZWRdKWAuCi0gYHN1Ym1pdGAgZGlkbid0IGNhbmNlbCB0aGUgcGVuZGluZyBhdXRvc2F2ZS4gYGZsdXNoKClgIGJlZm9yZSBzdWJtaXR0aW5nIGlzIGFsc28gZmluZSBpZiB0aGV5CiAgYWRkIGl0LCBidXQgdGhlIGF1dG9zYXZlIG11c3Qgbm90IGxhbmQgYWZ0ZXIgdGhlIHN1Ym1pdC4KCiMjIyAzLiBTZWFyY2ggb24gZXZlcnkga2V5c3Ryb2tlIChgUG9QaWNrZXJgKQoKYHVzZU1lbW8oKCkgPT4gZGVib3VuY2Uoc2VhcmNoKSwgW3NlYXJjaF0pYDogYHNlYXJjaGAgaXMgYSBuZXcgZnVuY3Rpb24gZXZlcnkgcmVuZGVyLCBzbyBldmVyeQprZXlzdHJva2UgYnVpbGRzIGEgbmV3IGRlYm91bmNlIHdpdGggaXRzIG93biB0aW1lci4KCi0gKipBY2NlcHQ6KiogdGhlIGZpeGVkIGB1c2VEZWJvdW5jZWRDYWxsYmFja2AsIGEgYHVzZVJlZmAtaGVsZCBkZWJvdW5jZSB3aXRoIGEgbGF0ZXN0LWNhbGxiYWNrCiAgcmVmLCBvciBgdXNlTWVtbyhbXSlgIHBsdXMgYSByZWYuIEFsc28gY2xlYW4gdXAgb24gdW5tb3VudC4KLSAqKkJvbnVzOioqIGlnbm9yaW5nIG91dC1vZi1vcmRlciByZXNwb25zZXMgKEFib3J0Q29udHJvbGxlciBvciBhIHJlcXVlc3QgaWQpLgoKIyMjIDQuIExpbmUgaWRzIChgaW52b2ljZVJlZHVjZXJgKQoKYGxpbmUtJHtEYXRlLm5vdygpfWAgZ2l2ZXMgZXZlcnkgbGluZSBtYWRlIGluIHRoZSBzYW1lIG1pbGxpc2Vjb25kIHRoZSBzYW1lIGlkOiBhIHdob2xlIGltcG9ydCwKb3IgcXVpY2sgY2xpY2tzLiBSZWFjdCBrZXlzIGNvbGxpZGUsIGFuZCBgdXBkYXRlTGluZWAvYHJlbW92ZUxpbmVgIGJ5IGlkIGhpdCB0aGUgd3JvbmcgbGluZXMgb3IKc2V2ZXJhbCBhdCBvbmNlLgoKLSAqKkFjY2VwdDoqKiBhIGNvdW50ZXIsIGBjcnlwdG8ucmFuZG9tVVVJRCgpYCAoc2VjdXJlIGNvbnRleHRzIG9ubHk7IG1lbnRpb24gaXQpLCBvciBhCiAgcmVmLWJhc2VkIGlkIGdlbmVyYXRvciBpbiB0aGUgY29tcG9uZW50IHRoYXQgcGFzc2VzIHRoZSBpZHMgaW4gdGhlIGFjdGlvbnMuCi0gKipSZWQgZmxhZzoqKiBpZHMgZGVyaXZlZCBmcm9tIHBvc2l0aW9ucyAoYGxpbmUtJHtpbmRleH1gLCBgbGluZXMubGVuZ3RoYCk6IHRoZXkgY29sbGlkZSBvbmNlIGEKICBsaW5lIGlzIHJlbW92ZWQgYW5kIGFub3RoZXIgYWRkZWQuCi0gKipSZWQgZmxhZzoqKiBpbmRleCBrZXlzLiBUaGV5IGJyZWFrIHRoZSBtb21lbnQgYSBsaW5lIGlzIHJlbW92ZWQuCgojIyMgNS4gTXV0YXRpb24gKGB1cGRhdGVMaW5lYCkKCmBPYmplY3QuYXNzaWduKGxpbmUsIHBhdGNoKWAgcGx1cyB0aGUgc2FtZSBhcnJheSBtZWFucyBgdXNlTWVtbyhbc3RhdGUubGluZXNdKWAgKHRvdGFscykgYW5kIHRoZQphdXRvc2F2ZSBlZmZlY3QgbmV2ZXIgc2VlIHRoZSBlZGl0LiBUaGUgVW5kbyBzbmFwc2hvdCBpcyB0aGUgc2FtZSBtdXRhdGVkIGFycmF5LgoKLSAqKkZpeDoqKiBhIGBtYXBgIHRoYXQgcmV0dXJucyBhIG5ldyBvYmplY3QgZm9yIHRoZSBjaGFuZ2VkIGxpbmUuCi0gU3Ryb25nIGFuc3dlcnMgZXhwbGFpbiByZWZlcmVuY2UgZXF1YWxpdHkgaW4gYHVzZU1lbW9gL2B1c2VFZmZlY3RgIGRlcHMgYW5kIGB1c2VSZWR1Y2VyYCBiYWlsLW91dHMuCgojIyMgNi4gUHJpY2UgZmllbGQgKGBNb25leUlucHV0YCwgYHBhcnNlUnVwZWVzYCkKCi0gVGhlIGNvbnRyb2xsZWQgdmFsdWUgd2FzIHRoZSBwYXJzZWQgbnVtYmVyLiBUeXBpbmcgIjEyLiIgcmVuZGVyZWQgYmFjayAiMTIiLCBhbmQgIiIgcmVuZGVyZWQgYmFjayAiMCIuCi0gKipGaXg6Kioga2VlcCB0aGUgdGV4dCBiZWluZyB0eXBlZCBpbiBsb2NhbCBzdGF0ZSB3aGlsZSBlZGl0aW5nLiBDYWxsIGBvbkNoYW5nZWAgb25seSB3aXRoCiAgdmFsaWQgYW1vdW50cywgYW5kIHNob3cgdGhlIHBhcmVudCdzIHZhbHVlIGFnYWluIG9uIGJsdXIuCi0gYHBhcnNlRmxvYXRgIHN0b3BzIGF0IHRoZSBmaXJzdCBjb21tYSBhbmQgYWNjZXB0cyB0cmFpbGluZyBqdW5rLiBTdHJpcCDigrksIGNvbW1hcyBhbmQgc3BhY2VzLAogIHZhbGlkYXRlIHRoZSB3aG9sZSBzdHJpbmcgKOKJpCAyIGRlY2ltYWxzLCBub24tbmVnYXRpdmUpLCBhbmQgY29udmVydCBmcm9tIHRoZSBkaWdpdHMgcmF0aGVyIHRoYW4KICBgKiAxMDBgIGZsb2F0cy4KCiMjIyA3LiBJbnZvaWNlIGRhdGUKCmB0b0lTT1N0cmluZygpYCBpcyB0aGUgVVRDIGRhdGUuIFVzZSBgSW50bC5EYXRlVGltZUZvcm1hdGAgd2l0aCBgdGltZVpvbmU6ICdBc2lhL0tvbGthdGEnYAooYGZvcm1hdFRvUGFydHNgLCBvciB0aGUgYGVuLUNBYCBsb2NhbGUncyBZWVlZLU1NLUREKS4gQWRkaW5nIDUuNSBoIGJ5IGhhbmQgd29ya3MgZm9yIEluZGlhCihubyBEU1QpIGJ1dCBpcyBicml0dGxlLgotICoqUmVkIGZsYWcgdGhlIHRlc3RzIGNhbid0IGNhdGNoOioqIHRoZSBicm93c2VyJ3MgKmxvY2FsKiBkYXRlIChgZ2V0RGF0ZSgpYCwgb3IKICBgdG9Mb2NhbGVEYXRlU3RyaW5nKClgIHdpdGhvdXQgYHRpbWVab25lYCkuIEl0IHBhc3NlcyBpbiBhIGJyb3dzZXIgc2V0IHRvIEluZGlhIHRpbWUsIHdoaWNoIG1vc3QKICBjYW5kaWRhdGVzIGhhdmUsIGJ1dCBkYXRlcyBpbnZvaWNlcyB3cm9uZ2x5IGZvciBzdXBwbGllcnMgZWxzZXdoZXJlIChgSW52b2ljZURyYWZ0Lmludm9pY2VEYXRlYAogIHNheXMgImluIEluZGlhIHRpbWUsIHdoYXRldmVyIHRoZSBicm93c2VyJ3MgdGltZSB6b25lIikuCg==', 'base64'), 'UTF8'), (convert_from(decode('W3sicGF0aCI6InNyYy9JbnZvaWNlQnVpbGRlci50c3giLCJjb250ZW50IjoiaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWR1Y2VyLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IExpbmVSb3cgfSBmcm9tICcuL2NvbXBvbmVudHMvTGluZVJvdyc7XG5pbXBvcnQgeyBQb1BpY2tlciB9IGZyb20gJy4vY29tcG9uZW50cy9Qb1BpY2tlcic7XG5pbXBvcnQgeyB1c2VEZWJvdW5jZWRDYWxsYmFjayB9IGZyb20gJy4vaG9va3MvdXNlRGVib3VuY2VkQ2FsbGJhY2snO1xuaW1wb3J0IHsgaW5pdGlhbFN0YXRlLCBpbnZvaWNlUmVkdWNlciwgdG90YWxzIH0gZnJvbSAnLi9zdGF0ZS9pbnZvaWNlUmVkdWNlcic7XG5pbXBvcnQgdHlwZSB7IEludm9pY2VBcGksIEludm9pY2VEcmFmdCwgUG9TdW1tYXJ5IH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB0b2RheUluSW5kaWEgfSBmcm9tICcuL3V0aWxzL2RhdGVzJztcbmltcG9ydCB7IGZvcm1hdFBhaXNlIH0gZnJvbSAnLi91dGlscy9tb25leSc7XG5cbmV4cG9ydCBjb25zdCBBVVRPU0FWRV9NUyA9IDgwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIEludm9pY2VCdWlsZGVyKHsgYXBpIH06IHsgYXBpOiBJbnZvaWNlQXBpIH0pIHtcbiAgY29uc3QgW3N0YXRlLCBkaXNwYXRjaF0gPSB1c2VSZWR1Y2VyKGludm9pY2VSZWR1Y2VyLCBpbml0aWFsU3RhdGUpO1xuICBjb25zdCBbcG8sIHNldFBvXSA9IHVzZVN0YXRlPFBvU3VtbWFyeSB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbaW52b2ljZURhdGVdID0gdXNlU3RhdGUoKCkgPT4gdG9kYXlJbkluZGlhKCkpO1xuICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGU8J2RyYWZ0JyB8ICdzdWJtaXR0aW5nJyB8ICdzdWJtaXR0ZWQnPignZHJhZnQnKTtcblxuICBjb25zdCBkcmFmdDogSW52b2ljZURyYWZ0ID0geyBwb0lkOiBwbz8uaWQgPz8gbnVsbCwgaW52b2ljZURhdGUsIGxpbmVzOiBzdGF0ZS5saW5lcyB9O1xuXG4gIC8vIEF1dG9zYXZlIDAuOCBzIGFmdGVyIHRoZSBsYXN0IGNoYW5nZS5cbiAgY29uc3QgYXV0b3NhdmUgPSB1c2VEZWJvdW5jZWRDYWxsYmFjaygoKSA9PiB7XG4gICAgdm9pZCBhcGkuc2F2ZURyYWZ0KGRyYWZ0KTtcbiAgfSwgQVVUT1NBVkVfTVMpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHBvKSBhdXRvc2F2ZSgpO1xuICB9LCBbcG8sIHN0YXRlLmxpbmVzLCBhdXRvc2F2ZV0pO1xuXG4gIGNvbnN0IHN1bXMgPSB1c2VNZW1vKCgpID0+IHRvdGFscyhzdGF0ZS5saW5lcyksIFtzdGF0ZS5saW5lc10pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIGNob29zZVBvKG5leHQ6IFBvU3VtbWFyeSkge1xuICAgIHNldFBvKG5leHQpO1xuICAgIGRpc3BhdGNoKHsgdHlwZTogJ2ltcG9ydFBvTGluZXMnLCBsaW5lczogYXdhaXQgYXBpLmdldFBvTGluZXMobmV4dC5pZCkgfSk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBzdWJtaXQoKSB7XG4gICAgLy8gQSBwZW5kaW5nIGF1dG9zYXZlIHdvdWxkIGxhbmQgYWZ0ZXIgdGhlIHN1Ym1pdCBhbmQgdHVybiB0aGUgaW52b2ljZSBiYWNrIGludG8gYSBkcmFmdC5cbiAgICBhdXRvc2F2ZS5jYW5jZWwoKTtcbiAgICBzZXRTdGF0dXMoJ3N1Ym1pdHRpbmcnKTtcbiAgICBhd2FpdCBhcGkuc3VibWl0KGRyYWZ0KTtcbiAgICBzZXRTdGF0dXMoJ3N1Ym1pdHRlZCcpO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Zm9ybVxuICAgICAgZGF0YS10ZXN0aWQ9XCJpbnZvaWNlXCJcbiAgICAgIG9uU3VibWl0PXsoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgc3VibWl0KCk7XG4gICAgICB9fVxuICAgID5cbiAgICAgIDxQb1BpY2tlciBhcGk9e2FwaX0gb25TZWxlY3Q9e2Nob29zZVBvfSAvPlxuICAgICAgPHA+XG4gICAgICAgIEludm9pY2UgZGF0ZTogPHNwYW4gZGF0YS10ZXN0aWQ9XCJpbnZvaWNlLWRhdGVcIj57aW52b2ljZURhdGV9PC9zcGFuPlxuICAgICAgPC9wPlxuICAgICAgPGZpZWxkc2V0IGRpc2FibGVkPXtzdGF0dXMgIT09ICdkcmFmdCd9PlxuICAgICAgICB7c3RhdGUubGluZXMubWFwKChsaW5lLCBpKSA9PiAoXG4gICAgICAgICAgPExpbmVSb3dcbiAgICAgICAgICAgIGtleT17bGluZS5pZH1cbiAgICAgICAgICAgIHBvc2l0aW9uPXtpICsgMX1cbiAgICAgICAgICAgIGxpbmU9e2xpbmV9XG4gICAgICAgICAgICBvbkNoYW5nZT17KHBhdGNoKSA9PiBkaXNwYXRjaCh7IHR5cGU6ICd1cGRhdGVMaW5lJywgaWQ6IGxpbmUuaWQsIHBhdGNoIH0pfVxuICAgICAgICAgICAgb25SZW1vdmU9eygpID0+IGRpc3BhdGNoKHsgdHlwZTogJ3JlbW92ZUxpbmUnLCBpZDogbGluZS5pZCB9KX1cbiAgICAgICAgICAvPlxuICAgICAgICApKX1cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgZGF0YS10ZXN0aWQ9XCJhZGQtbGluZVwiIG9uQ2xpY2s9eygpID0+IGRpc3BhdGNoKHsgdHlwZTogJ2FkZExpbmUnIH0pfT5cbiAgICAgICAgICBBZGQgbGluZVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgZGF0YS10ZXN0aWQ9XCJ1bmRvXCIgZGlzYWJsZWQ9e3N0YXRlLnBhc3QubGVuZ3RoID09PSAwfSBvbkNsaWNrPXsoKSA9PiBkaXNwYXRjaCh7IHR5cGU6ICd1bmRvJyB9KX0+XG4gICAgICAgICAgVW5kb1xuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZmllbGRzZXQ+XG4gICAgICA8ZGw+XG4gICAgICAgIDxkdD5OZXQ8L2R0PlxuICAgICAgICA8ZGQgZGF0YS10ZXN0aWQ9XCJ0b3RhbC1uZXRcIj57Zm9ybWF0UGFpc2Uoc3Vtcy5uZXQpfTwvZGQ+XG4gICAgICAgIDxkdD5HU1Q8L2R0PlxuICAgICAgICA8ZGQgZGF0YS10ZXN0aWQ9XCJ0b3RhbC10YXhcIj57Zm9ybWF0UGFpc2Uoc3Vtcy50YXgpfTwvZGQ+XG4gICAgICAgIDxkdD5Ub3RhbDwvZHQ+XG4gICAgICAgIDxkZCBkYXRhLXRlc3RpZD1cInRvdGFsLWdyb3NzXCI+e2Zvcm1hdFBhaXNlKHN1bXMuZ3Jvc3MpfTwvZGQ+XG4gICAgICA8L2RsPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgZGF0YS10ZXN0aWQ9XCJzdWJtaXRcIiBkaXNhYmxlZD17c3RhdHVzICE9PSAnZHJhZnQnIHx8ICFwb30+XG4gICAgICAgIHtzdGF0dXMgPT09ICdzdWJtaXR0ZWQnID8gJ1N1Ym1pdHRlZCcgOiAnU3VibWl0IGludm9pY2UnfVxuICAgICAgPC9idXR0b24+XG4gICAgPC9mb3JtPlxuICApO1xufVxuIn0seyJwYXRoIjoic3JjL2NvbXBvbmVudHMvTW9uZXlJbnB1dC50c3giLCJjb250ZW50IjoiaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBwYXJzZVJ1cGVlcyB9IGZyb20gJy4uL3V0aWxzL21vbmV5JztcblxuaW50ZXJmYWNlIFByb3BzIHtcbiAgdGVzdElEOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIHBhaXNlOiBudW1iZXI7XG4gIG9uQ2hhbmdlKHBhaXNlOiBudW1iZXIpOiB2b2lkO1xufVxuXG5jb25zdCBhc1RleHQgPSAocGFpc2U6IG51bWJlcikgPT4gKHBhaXNlIC8gMTAwKS50b0ZpeGVkKDIpO1xuXG4vKipcbiAqIEEgcnVwZWUgYW1vdW50IGZpZWxkLiBUaGUgdmFsdWUgbGl2ZXMgaW4gdGhlIHBhcmVudCwgaW4gcGFpc2UuXG4gKlxuICogV2hpbGUgdGhlIHN1cHBsaWVyIHR5cGVzLCB0aGUgZmllbGQgc2hvd3MgdGhlaXIgdGV4dDogXCIxMi5cIiBvciBcIlwiIGFyZW4ndCBhbW91bnRzIHlldCwgYW5kXG4gKiByZW5kZXJpbmcgdGhlIHBhcnNlZCBudW1iZXIgYmFjayAoXCIxMlwiLCBcIjBcIikgYXRlIHRoZSBkZWNpbWFsIHBvaW50IGFuZCByZWZpbGxlZCBhIGNsZWFyZWRcbiAqIGZpZWxkLiBWYWxpZCB0ZXh0IHVwZGF0ZXMgdGhlIHBhcmVudDsgb3V0c2lkZSB0aGUgZWRpdCAoYmx1ciwgdW5kbywgaW1wb3J0KSB0aGUgZmllbGQgZm9sbG93c1xuICogdGhlIHBhcmVudCdzIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gTW9uZXlJbnB1dCh7IHRlc3RJRCwgbGFiZWwsIHBhaXNlLCBvbkNoYW5nZSB9OiBQcm9wcykge1xuICBjb25zdCBbZHJhZnQsIHNldERyYWZ0XSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBpbnZhbGlkID0gZHJhZnQgIT09IG51bGwgJiYgcGFyc2VSdXBlZXMoZHJhZnQpID09PSBudWxsO1xuXG4gIHJldHVybiAoXG4gICAgPGlucHV0XG4gICAgICBkYXRhLXRlc3RpZD17dGVzdElEfVxuICAgICAgYXJpYS1sYWJlbD17bGFiZWx9XG4gICAgICBhcmlhLWludmFsaWQ9e2ludmFsaWR9XG4gICAgICBpbnB1dE1vZGU9XCJkZWNpbWFsXCJcbiAgICAgIHZhbHVlPXtkcmFmdCA/PyBhc1RleHQocGFpc2UpfVxuICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgIHNldERyYWZ0KGUudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgY29uc3QgbmV4dCA9IHBhcnNlUnVwZWVzKGUudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgaWYgKG5leHQgIT09IG51bGwpIG9uQ2hhbmdlKG5leHQpO1xuICAgICAgfX1cbiAgICAgIG9uQmx1cj17KCkgPT4gc2V0RHJhZnQobnVsbCl9XG4gICAgLz5cbiAgKTtcbn1cbiJ9LHsicGF0aCI6InNyYy9jb21wb25lbnRzL1BvUGlja2VyLnRzeCIsImNvbnRlbnQiOiJpbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZURlYm91bmNlZENhbGxiYWNrIH0gZnJvbSAnLi4vaG9va3MvdXNlRGVib3VuY2VkQ2FsbGJhY2snO1xuaW1wb3J0IHR5cGUgeyBJbnZvaWNlQXBpLCBQb1N1bW1hcnkgfSBmcm9tICcuLi90eXBlcyc7XG5cbmV4cG9ydCBjb25zdCBTRUFSQ0hfREVCT1VOQ0VfTVMgPSAzMDA7XG5cbmludGVyZmFjZSBQcm9wcyB7XG4gIGFwaTogSW52b2ljZUFwaTtcbiAgb25TZWxlY3QocG86IFBvU3VtbWFyeSk6IHZvaWQ7XG59XG5cbi8qKiBUeXBlYWhlYWQ6IHNlYXJjaGVzIFBPcyBieSBudW1iZXIgb3IgYnV5ZXIgb25jZSB0aGUgc3VwcGxpZXIgcGF1c2VzIHR5cGluZy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBQb1BpY2tlcih7IGFwaSwgb25TZWxlY3QgfTogUHJvcHMpIHtcbiAgY29uc3QgW3F1ZXJ5LCBzZXRRdWVyeV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtyZXN1bHRzLCBzZXRSZXN1bHRzXSA9IHVzZVN0YXRlPFBvU3VtbWFyeVtdPihbXSk7XG5cbiAgLy8gYHNlYXJjaGAgaXMgYSBuZXcgZnVuY3Rpb24gb24gZXZlcnkgcmVuZGVyLCBzbyB1c2VNZW1vKCgpID0+IGRlYm91bmNlKHNlYXJjaCksIFtzZWFyY2hdKVxuICAvLyBidWlsdCBhIG5ldyBkZWJvdW5jZSAod2l0aCBpdHMgb3duIHRpbWVyKSBwZXIga2V5c3Ryb2tlOiBldmVyeSBrZXlzdHJva2Ugc2VhcmNoZWQuIFRoZSBob29rXG4gIC8vIGtlZXBzIG9uZSBkZWJvdW5jZWQgZnVuY3Rpb24gZm9yIHRoZSBjb21wb25lbnQncyBsaWZldGltZS5cbiAgY29uc3QgZGVib3VuY2VkU2VhcmNoID0gdXNlRGVib3VuY2VkQ2FsbGJhY2soKHE6IHN0cmluZykgPT4ge1xuICAgIGlmIChxLnRyaW0oKS5sZW5ndGggPCAyKSB7XG4gICAgICBzZXRSZXN1bHRzKFtdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdm9pZCBhcGkuc2VhcmNoUG9zKHEudHJpbSgpKS50aGVuKHNldFJlc3VsdHMpO1xuICB9LCBTRUFSQ0hfREVCT1VOQ0VfTVMpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJwby1waWNrZXJcIj5cbiAgICAgIDxpbnB1dFxuICAgICAgICBkYXRhLXRlc3RpZD1cInBvLXNlYXJjaFwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJQdXJjaGFzZSBvcmRlclwiXG4gICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIFBPIG51bWJlciBvciBidXllclwiXG4gICAgICAgIHZhbHVlPXtxdWVyeX1cbiAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgc2V0UXVlcnkoZS50YXJnZXQudmFsdWUpO1xuICAgICAgICAgIGRlYm91bmNlZFNlYXJjaChlLnRhcmdldC52YWx1ZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICAgPHVsIHJvbGU9XCJsaXN0Ym94XCI+XG4gICAgICAgIHtyZXN1bHRzLm1hcCgocG8pID0+IChcbiAgICAgICAgICA8bGkga2V5PXtwby5pZH0gcm9sZT1cIm9wdGlvblwiIGFyaWEtc2VsZWN0ZWQ9e2ZhbHNlfT5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGRhdGEtdGVzdGlkPXtgcG8tJHtwby5pZH1gfVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0UmVzdWx0cyhbXSk7XG4gICAgICAgICAgICAgICAgc2V0UXVlcnkocG8ubnVtYmVyKTtcbiAgICAgICAgICAgICAgICBvblNlbGVjdChwbyk7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHtwby5udW1iZXJ9IMK3IHtwby5idXllcn1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvbGk+XG4gICAgICAgICkpfVxuICAgICAgPC91bD5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJ9LHsicGF0aCI6InNyYy9ob29rcy91c2VEZWJvdW5jZWRDYWxsYmFjay50cyIsImNvbnRlbnQiOiJpbXBvcnQgeyB1c2VFZmZlY3QsIHVzZUxheW91dEVmZmVjdCwgdXNlTWVtbywgdXNlUmVmIH0gZnJvbSAncmVhY3QnO1xuXG5leHBvcnQgaW50ZXJmYWNlIERlYm91bmNlZDxBIGV4dGVuZHMgdW5rbm93bltdPiB7XG4gICguLi5hcmdzOiBBKTogdm9pZDtcbiAgLyoqIERyb3BzIGEgcGVuZGluZyBjYWxsLiAqL1xuICBjYW5jZWwoKTogdm9pZDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RhYmxlIGZ1bmN0aW9uIHRoYXQgY2FsbHMgYGZuYCBvbmNlIGNhbGxzIGhhdmUgc3RvcHBlZCBmb3IgYGRlbGF5TXNgLCB3aXRoIHRoZVxuICogYXJndW1lbnRzIG9mIHRoZSBsYXN0IGNhbGwuXG4gKlxuICogVGhlIGRlYm91bmNlZCBmdW5jdGlvbiBpcyBzdGFibGUsIHNvIGl0IG11c3Qgbm90IGNsb3NlIG92ZXIgYGZuYDogaXQgY2FsbHMgdGhlIGxhdGVzdCBgZm5gXG4gKiB0aHJvdWdoIGEgcmVmICh0aGUgb2xkIHZlcnNpb24ga2VwdCB0aGUgZmlyc3QgcmVuZGVyJ3MgYGZuYCwgYW5kIHNvIHNhdmVkIHRoZSBmaXJzdCByZW5kZXInc1xuICogZHJhZnQpLiBBIHBlbmRpbmcgY2FsbCBpcyBkcm9wcGVkIG9uIHVubW91bnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VEZWJvdW5jZWRDYWxsYmFjazxBIGV4dGVuZHMgdW5rbm93bltdPihcbiAgZm46ICguLi5hcmdzOiBBKSA9PiB2b2lkLFxuICBkZWxheU1zOiBudW1iZXIsXG4pOiBEZWJvdW5jZWQ8QT4ge1xuICBjb25zdCBsYXRlc3QgPSB1c2VSZWYoZm4pO1xuICB1c2VMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGxhdGVzdC5jdXJyZW50ID0gZm47XG4gIH0pO1xuICBjb25zdCB0aW1lciA9IHVzZVJlZjxSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IHVuZGVmaW5lZD4odW5kZWZpbmVkKTtcblxuICBjb25zdCBkZWJvdW5jZWQgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBjYWxsID0gKC4uLmFyZ3M6IEEpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lci5jdXJyZW50KTtcbiAgICAgIHRpbWVyLmN1cnJlbnQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGltZXIuY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGF0ZXN0LmN1cnJlbnQoLi4uYXJncyk7XG4gICAgICB9LCBkZWxheU1zKTtcbiAgICB9O1xuICAgIGNhbGwuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyLmN1cnJlbnQpO1xuICAgICAgdGltZXIuY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgICB9O1xuICAgIHJldHVybiBjYWxsO1xuICB9LCBbZGVsYXlNc10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBkZWJvdW5jZWQuY2FuY2VsLCBbZGVib3VuY2VkXSk7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG4ifSx7InBhdGgiOiJzcmMvc3RhdGUvaW52b2ljZVJlZHVjZXIudHMiLCJjb250ZW50IjoiaW1wb3J0IHR5cGUgeyBJbnZvaWNlTGluZSwgUG9MaW5lIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgbGluZU5ldCwgbGluZVRheCB9IGZyb20gJy4uL3V0aWxzL21vbmV5JztcblxuZXhwb3J0IGludGVyZmFjZSBJbnZvaWNlU3RhdGUge1xuICBsaW5lczogSW52b2ljZUxpbmVbXTtcbiAgLyoqIEVhcmxpZXIgdmVyc2lvbnMgb2YgYGxpbmVzYCwgbmV3ZXN0IGxhc3QsIGZvciBVbmRvLiAqL1xuICBwYXN0OiBJbnZvaWNlTGluZVtdW107XG59XG5cbmV4cG9ydCBjb25zdCBpbml0aWFsU3RhdGU6IEludm9pY2VTdGF0ZSA9IHsgbGluZXM6IFtdLCBwYXN0OiBbXSB9O1xuXG5leHBvcnQgdHlwZSBJbnZvaWNlQWN0aW9uID1cbiAgfCB7IHR5cGU6ICdpbXBvcnRQb0xpbmVzJzsgbGluZXM6IFBvTGluZVtdIH1cbiAgfCB7IHR5cGU6ICdhZGRMaW5lJyB9XG4gIHwgeyB0eXBlOiAndXBkYXRlTGluZSc7IGlkOiBzdHJpbmc7IHBhdGNoOiBQYXJ0aWFsPFBvTGluZT4gfVxuICB8IHsgdHlwZTogJ3JlbW92ZUxpbmUnOyBpZDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6ICd1bmRvJyB9O1xuXG5jb25zdCBCTEFOS19MSU5FOiBQb0xpbmUgPSB7IHNrdTogJycsIGRlc2NyaXB0aW9uOiAnJywgcXVhbnRpdHk6IDEsIHVuaXRQcmljZVBhaXNlOiAwLCBnc3RSYXRlOiAxOCB9O1xuXG4vLyBEYXRlLm5vdygpIGdhdmUgZXZlcnkgbGluZSBjcmVhdGVkIGluIHRoZSBzYW1lIG1pbGxpc2Vjb25kIChhbiBpbXBvcnQsIHF1aWNrIGNsaWNrcykgdGhlIHNhbWUgaWQ6XG4vLyBkdXBsaWNhdGUgUmVhY3Qga2V5cywgYW5kIHVwZGF0ZXMvcmVtb3ZlcyBieSBpZCBoaXQgc2V2ZXJhbCBsaW5lcy4gQSBjb3VudGVyIGlzIHVuaXF1ZSBwZXIgcGFnZS5cbmxldCBsYXN0TGluZUlkID0gMDtcbmNvbnN0IG5ld0xpbmVJZCA9ICgpID0+IGBsaW5lLSR7KytsYXN0TGluZUlkfWA7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnZvaWNlUmVkdWNlcihzdGF0ZTogSW52b2ljZVN0YXRlLCBhY3Rpb246IEludm9pY2VBY3Rpb24pOiBJbnZvaWNlU3RhdGUge1xuICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnaW1wb3J0UG9MaW5lcyc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsaW5lczogYWN0aW9uLmxpbmVzLm1hcCgobGluZSkgPT4gKHsgLi4ubGluZSwgaWQ6IG5ld0xpbmVJZCgpIH0pKSxcbiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSxcbiAgICAgIH07XG4gICAgY2FzZSAnYWRkTGluZSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsaW5lczogWy4uLnN0YXRlLmxpbmVzLCB7IC4uLkJMQU5LX0xJTkUsIGlkOiBuZXdMaW5lSWQoKSB9XSxcbiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSxcbiAgICAgIH07XG4gICAgY2FzZSAndXBkYXRlTGluZSc6IHtcbiAgICAgIC8vIE5ldmVyIG11dGF0ZTogdGhlIG9sZCBhcnJheSBpcyB3aGF0IFVuZG8gcmV0dXJucyB0bywgYW5kIHVzZU1lbW8vdXNlRWZmZWN0IGNvbXBhcmUgYnlcbiAgICAgIC8vIHJlZmVyZW5jZSAobXV0YXRpbmcga2VwdCB0aGUgc2FtZSBhcnJheSwgc28gdG90YWxzIGFuZCBhdXRvc2F2ZSBuZXZlciBzYXcgdGhlIGVkaXQpLlxuICAgICAgaWYgKCFzdGF0ZS5saW5lcy5zb21lKChsKSA9PiBsLmlkID09PSBhY3Rpb24uaWQpKSByZXR1cm4gc3RhdGU7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsaW5lczogc3RhdGUubGluZXMubWFwKChsKSA9PiAobC5pZCA9PT0gYWN0aW9uLmlkID8geyAuLi5sLCAuLi5hY3Rpb24ucGF0Y2ggfSA6IGwpKSxcbiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSxcbiAgICAgIH07XG4gICAgfVxuICAgIGNhc2UgJ3JlbW92ZUxpbmUnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGluZXM6IHN0YXRlLmxpbmVzLmZpbHRlcigobCkgPT4gbC5pZCAhPT0gYWN0aW9uLmlkKSxcbiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSxcbiAgICAgIH07XG4gICAgY2FzZSAndW5kbyc6IHtcbiAgICAgIGNvbnN0IHByZXZpb3VzID0gc3RhdGUucGFzdFtzdGF0ZS5wYXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKCFwcmV2aW91cykgcmV0dXJuIHN0YXRlO1xuICAgICAgcmV0dXJuIHsgbGluZXM6IHByZXZpb3VzLCBwYXN0OiBzdGF0ZS5wYXN0LnNsaWNlKDAsIC0xKSB9O1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG90YWxzKGxpbmVzOiBJbnZvaWNlTGluZVtdKSB7XG4gIGxldCBuZXQgPSAwO1xuICBsZXQgdGF4ID0gMDtcbiAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgbmV0ICs9IGxpbmVOZXQobGluZSk7XG4gICAgdGF4ICs9IGxpbmVUYXgobGluZSk7XG4gIH1cbiAgcmV0dXJuIHsgbmV0LCB0YXgsIGdyb3NzOiBuZXQgKyB0YXggfTtcbn1cbiJ9LHsicGF0aCI6InNyYy91dGlscy9kYXRlcy50cyIsImNvbnRlbnQiOiJjb25zdCBpbmRpYURhdGUgPSBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tQ0EnLCB7XG4gIHRpbWVab25lOiAnQXNpYS9Lb2xrYXRhJyxcbiAgeWVhcjogJ251bWVyaWMnLFxuICBtb250aDogJzItZGlnaXQnLFxuICBkYXk6ICcyLWRpZ2l0Jyxcbn0pO1xuXG4vKipcbiAqIFRvZGF5J3MgZGF0ZSBpbiBJbmRpYSBhcyBZWVlZLU1NLUREIChpbnZvaWNlcyBhcmUgZGF0ZWQgaW4gSVNUKS5cbiAqXG4gKiB0b0lTT1N0cmluZygpIGlzIHRoZSBVVEMgZGF0ZSwgd2hpY2ggaXMgc3RpbGwgXCJ5ZXN0ZXJkYXlcIiB1bnRpbCAwNTozMCBJU1Q6IGFuIGludm9pY2UgcmFpc2VkIGF0XG4gKiAwMDozMCBvbiB0aGUgMXN0IHdhcyBkYXRlZCB0aGUgbGFzdCBkYXkgb2YgdGhlIHByZXZpb3VzIG1vbnRoIChhbmQgaXRzIEdTVCByZXR1cm4pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9kYXlJbkluZGlhKG5vdzogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBwYXJ0ID0gKHR5cGU6IEludGwuRGF0ZVRpbWVGb3JtYXRQYXJ0VHlwZXMpID0+XG4gICAgaW5kaWFEYXRlLmZvcm1hdFRvUGFydHMobm93KS5maW5kKChwKSA9PiBwLnR5cGUgPT09IHR5cGUpIS52YWx1ZTtcbiAgcmV0dXJuIGAke3BhcnQoJ3llYXInKX0tJHtwYXJ0KCdtb250aCcpfS0ke3BhcnQoJ2RheScpfWA7XG59XG4ifSx7InBhdGgiOiJzcmMvdXRpbHMvbW9uZXkudHMiLCJjb250ZW50IjoiY29uc3QgaW5yID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KCdlbi1JTicsIHsgc3R5bGU6ICdjdXJyZW5jeScsIGN1cnJlbmN5OiAnSU5SJyB9KTtcblxuLyoqIOKCuTEyLDM0LDU2Ny41MCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFBhaXNlKHBhaXNlOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gaW5yLmZvcm1hdChwYWlzZSAvIDEwMCk7XG59XG5cbmNvbnN0IEFNT1VOVCA9IC9eKFxcZCspKD86XFwuKFxcZHsxLDJ9KSk/JC87XG5cbi8qKlxuICogUGFyc2VzIHdoYXQgdGhlIHN1cHBsaWVyIHR5cGVkIGluIGEgcHJpY2UgZmllbGQgKFwiMTI1MFwiLCBcIjEsMjUwLjUwXCIsIFwi4oK5IDk5LjlcIikgaW50byBwYWlzZS5cbiAqIFJldHVybnMgbnVsbCB3aGVuIGl0IGlzbid0IGEgdmFsaWQsIG5vbi1uZWdhdGl2ZSBhbW91bnQgd2l0aCBhdCBtb3N0IDIgZGVjaW1hbHMuXG4gKlxuICogcGFyc2VGbG9hdCBzdG9wcyBhdCB0aGUgZmlyc3QgY29tbWEgKFwiMSwyNTAuNTBcIiDihpIgMSkgYW5kIGFjY2VwdHMgdHJhaWxpbmcganVuayAoXCIxMmFiY1wiIOKGkiAxMiksXG4gKiBzbyB0aGUgdGV4dCBpcyB2YWxpZGF0ZWQgYXMgYSB3aG9sZSBhbmQgY29udmVydGVkIGZyb20gaXRzIGRpZ2l0cywgd2l0aG91dCBmbG9hdGluZyBwb2ludC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUnVwZWVzKHRleHQ6IHN0cmluZyk6IG51bWJlciB8IG51bGwge1xuICBjb25zdCBtYXRjaCA9IEFNT1VOVC5leGVjKHRleHQucmVwbGFjZSgvW+KCuSxcXHNdL2csICcnKSk7XG4gIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuICBjb25zdCBbLCBydXBlZXMsIGZyYWN0aW9uID0gJyddID0gbWF0Y2g7XG4gIHJldHVybiBOdW1iZXIocnVwZWVzKSAqIDEwMCArIE51bWJlcihmcmFjdGlvbi5wYWRFbmQoMiwgJzAnKSk7XG59XG5cbi8qKiBOZXQgYW1vdW50IG9mIGEgbGluZSwgaW4gcGFpc2UuICovXG5leHBvcnQgZnVuY3Rpb24gbGluZU5ldChsaW5lOiB7IHF1YW50aXR5OiBudW1iZXI7IHVuaXRQcmljZVBhaXNlOiBudW1iZXIgfSk6IG51bWJlciB7XG4gIHJldHVybiBsaW5lLnF1YW50aXR5ICogbGluZS51bml0UHJpY2VQYWlzZTtcbn1cblxuLyoqIEdTVCBvZiBhIGxpbmUsIHJvdW5kZWQgdG8gdGhlIHBhaXNhLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbmVUYXgobGluZTogeyBxdWFudGl0eTogbnVtYmVyOyB1bml0UHJpY2VQYWlzZTogbnVtYmVyOyBnc3RSYXRlOiBudW1iZXIgfSk6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLnJvdW5kKChsaW5lTmV0KGxpbmUpICogbGluZS5nc3RSYXRlKSAvIDEwMCk7XG59XG4ifV0=', 'base64'), 'UTF8'))::jsonb
  ) on conflict (question_id) do update set notes_md = excluded.notes_md, files = excluded.files;
  if v_installed is null then
    raise notice 'Question "web-invoice-builder": installed (version 3)';
  else
    raise notice 'Question "web-invoice-builder": updated from version % to 3', v_installed;
  end if;
end
$question$;

commit;
```

### 36. `supabase/seed/seed.sql`

- **Folder:** `supabase/seed`
- **File name:** `seed.sql`
- **Action:** **Replace** all of the existing content with exactly this content.
- **Size:** 340 lines, 342 KB (large: pasting may take a few seconds)
- **Commit message:** `Sync seed.sql (question v3 grading)`

```sql
-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- All parts in order (fresh databases, tests). The SQL Editor gets them one by one: npm run sql:bundle.
-- ════════════════════════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- Question "Approvals Inbox: session, networking and list state (React Native)". Safe to re-run: what is already installed and up to date is left untouched.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Question: rn-approvals-inbox (version 3)
do $question$
declare
  v_installed int;
begin
  select version into v_installed from public.questions where id = '9249d0ed-6c2c-4ea4-80f9-48645dbf737a';
  if v_installed >= 3 then
    raise notice 'Question "rn-approvals-inbox": version % installed, left unchanged', v_installed;
    return;
  end if;
  insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status, version) values (
    '9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'rn-approvals-inbox', 'Approvals Inbox: session, networking and list state (React Native)', 'React Native debugging', array['lead-react-native-developer', 'react-native-developer']::text[], array['react-native', 'async', 'auth', 'react-hooks', 'flatlist', 'concurrency']::text[], 'hard', 35,
    convert_from(decode('IyMgQXBwcm92YWxzIEluYm94OiB0aGUgYXBwIGxvZ3MgcGVvcGxlIG91dCBhbmQgbG9zZXMgZGVjaXNpb25zCgpaeWN1cyBhcHByb3ZlcnMgdXNlIHRoaXMgUmVhY3QgTmF0aXZlIGFwcCB0byBhcHByb3ZlIHB1cmNoYXNlIHJlcXVpc2l0aW9ucyBhbmQgaW52b2ljZXMgb24gdGhlIGdvLgpZb3UgYXJlIGxvb2tpbmcgYXQgaXRzIGRhdGEgbGF5ZXI6IHRoZSBIVFRQIGNsaWVudCwgdGhlIHBlcnNpc3RlZCBzZXNzaW9uLCB0aGUgbGlzdCBob29rLCB0aGUKb3B0aW1pc3RpYyBhcHByb3ZlL3JlamVjdCBzdGF0ZSBhbmQgdGhlIGxpc3Qgc2NyZWVuLgoKIyMjIEJ1ZyByZXBvcnRzIGZyb20gcHJvZHVjdGlvbgoKMS4gKioiSXQgbG9ncyBtZSBvdXQgYWZ0ZXIgdGhlIGFwcCBoYXMgYmVlbiBpbiB0aGUgYmFja2dyb3VuZC4iKiogTG9ncyBzaG93IHNldmVyYWwKICAgYC9hdXRoL3JlZnJlc2hgIGNhbGxzIHdpdGhpbiBhIGZldyBtaWxsaXNlY29uZHMgb2YgZWFjaCBvdGhlciB3aGVuIHRoZSBhcHAgcmVzdW1lcyBhbmQgZmlyZXMgaXRzCiAgIHJlcXVlc3RzLiBPdXIgYXV0aCBzZXJ2ZXIgKipyb3RhdGVzIHJlZnJlc2ggdG9rZW5zKio6IGVhY2ggcmVmcmVzaCBpbnZhbGlkYXRlcyB0aGUgcHJldmlvdXMKICAgcmVmcmVzaCB0b2tlbiwgc28gd2UgbXVzdCBuZXZlciByZWZyZXNoIG1vcmUgb2Z0ZW4gdGhhbiBuZWVkZWQuCjIuICoqIlRoZSBzcGlubmVyIG5ldmVyIHN0b3BzIGFmdGVyIEkgc3dpdGNoIGZpbHRlcnMuIioqIFRoZSBmaXJzdCBzd2l0Y2ggYmV0d2VlbiB0aGUgKkFsbCAvCiAgIFVyZ2VudCAvIE1pbmUqIGNoaXBzIHNvbWV0aW1lcyB3b3JrczsgYWZ0ZXIgdGhhdCB0aGUgbGlzdCBzdGF5cyBvbiBhIHNwaW5uZXIuIE9jY2FzaW9uYWxseSB0aGUKICAgKk1pbmUqIGNoaXAgaXMgc2VsZWN0ZWQgYnV0ICpVcmdlbnQqIGl0ZW1zIGFyZSBzaG93bi4KMy4gKioiSSBhcHByb3ZlZCB0d28gcmVxdWVzdHM7IG9uZSBmYWlsZWQgYW5kIGJvdGggd2VudCBiYWNrIHRvIFBlbmRpbmcuIioqIFRoZSBzZXJ2ZXIgc2hvd3MgdGhlCiAgIHNlY29uZCBvbmUgYXMgYXBwcm92ZWQuIEEgZmFpbGVkIGRlY2lzaW9uIHNob3VsZCBhbHNvIHRlbGwgdGhlIGFwcHJvdmVyIGl0IGZhaWxlZC4KNC4gKioiRmlyc3QgbGF1bmNoIGFmdGVyIGFuIHVwZGF0ZTogdGhlIGZpcnN0IHNjcmVlbiBzaG93cyAnU2Vzc2lvbiBleHBpcmVkJy4iKiogVGhlIGZpcnN0IHJlcXVlc3QKICAgYWZ0ZXIgYSBjb2xkIHN0YXJ0IGdvZXMgb3V0IHdpdGhvdXQgYW4gYEF1dGhvcml6YXRpb25gIGhlYWRlci4gQSB0b2tlbiByZWZyZXNoIHRoYXQgaGFwcGVucwogICBkdXJpbmcgc3RhcnR1cCBpcyBzb21ldGltZXMgbG9zdCBhcyB3ZWxsLgo1LiAqKiJFeHBhbmRpbmcgYSByb3cgYW5kIHRoZW4gYXBwcm92aW5nIHRoZSByb3cgYWJvdmUgaXQgZXhwYW5kcyBhIGRpZmZlcmVudCByb3cuIioqIEEgY29tbWVudAogICB0eXBlZCBpbiBvbmUgcm93IGNhbiBzaG93IHVwIGluIGFub3RoZXIuIERlZXAgbGlua3MgdGhhdCBzY3JvbGwgdG8gYW4gaXRlbSBsYW5kIGEgZmV3IHJvd3Mgb2ZmLgoKIyMjIFdoYXQgdG8gZG8KCi0gRmluZCBhbmQgZml4IHRoZSAqKnJvb3QgY2F1c2VzKiogaW4gYHNyYy9gLiBTZXZlcmFsIGJ1Z3MgYXJlIHN1YnRsZTsgcmVhZCB0aGUgY29kZSBjYXJlZnVsbHkuCi0gVGhlIHRlc3RzIGluIGBfX3Rlc3RzX18vYCBkZXNjcmliZSB0aGUgZXhwZWN0ZWQgYmVoYXZpb3VyIGFuZCBhcmUgKipyZWFkLW9ubHkqKi4gVXNlICoqUnVuCiAgdGVzdHMqKiB0byBjaGVjayB5b3VyIHdvcmsuIEFsbCB0ZXN0cyBzaG91bGQgcGFzcyB3aGVuIHlvdSBhcmUgZG9uZS4KLSBEb24ndCBzcGVjaWFsLWNhc2UgdGVzdHMgb3Igd2Vha2VuIGJlaGF2aW91ciB0byBtYWtlIHRoZW0gcGFzczogcmV2aWV3ZXJzIHJlYWQgeW91ciBjb2RlIGFuZCBydW4KICBhZGRpdGlvbmFsIHRlc3RzLgotIFlvdSBtYXkgcmVmYWN0b3IgZnJlZWx5IHdpdGhpbiBgc3JjL2A7IGtlZXAgdGhlIHB1YmxpYyBmdW5jdGlvbiBuYW1lcyBhbmQgc2lnbmF0dXJlcy4KCipUaW1lIGd1aWRlOiBhYm91dCAzNSBtaW51dGVzLioK', 'base64'), 'UTF8'),
    false, 'published', 3
  ) on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, category = excluded.category,
    role_tags = excluded.role_tags, skill_tags = excluded.skill_tags, difficulty = excluded.difficulty,
    time_suggestion_minutes = excluded.time_suggestion_minutes, statement_md = excluded.statement_md,
    is_sample = excluded.is_sample, status = excluded.status, version = excluded.version;
  delete from public.question_files where question_id = '9249d0ed-6c2c-4ea4-80f9-48645dbf737a' and path <> all (array['src/api/httpClient.ts', 'src/auth/sessionStore.ts', 'src/hooks/useApprovals.ts', 'src/state/approvals.ts', 'src/screens/ApprovalsList.tsx', 'src/types.ts', '__tests__/httpClient.test.ts', '__tests__/sessionStore.test.ts', '__tests__/useApprovals.test.tsx', '__tests__/approvals.test.tsx', '__tests__/ApprovalsList.test.tsx', '__tests__/support/fakeServer.ts', 'package.json']::text[]);
  insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/api/httpClient.ts', 'typescript', convert_from(decode('aW1wb3J0IHR5cGUgeyBTZXNzaW9uU3RvcmUgfSBmcm9tICcuLi9hdXRoL3Nlc3Npb25TdG9yZSc7CmltcG9ydCB7IEh0dHBFcnJvciwgdHlwZSBGZXRjaExpa2UsIHR5cGUgVG9rZW5zIH0gZnJvbSAnLi4vdHlwZXMnOwoKZXhwb3J0IGludGVyZmFjZSBIdHRwQ2xpZW50T3B0aW9ucyB7CiAgYmFzZVVybDogc3RyaW5nOwogIGZldGNoSW1wbDogRmV0Y2hMaWtlOwogIHNlc3Npb246IFNlc3Npb25TdG9yZTsKICAvKiogRXhjaGFuZ2VzIGEgcmVmcmVzaCB0b2tlbiBmb3IgbmV3IHRva2Vucy4gUmVmcmVzaCB0b2tlbnMgcm90YXRlIG9uIGV2ZXJ5IGNhbGwuICovCiAgcmVmcmVzaDogKHJlZnJlc2hUb2tlbjogc3RyaW5nKSA9PiBQcm9taXNlPFRva2Vucz47CiAgLyoqIENhbGxlZCB3aGVuIHRoZSBzZXNzaW9uIGNhbid0IGJlIHJlY292ZXJlZDsgdGhlIGFwcCByZXR1cm5zIHRvIHRoZSBzaWduLWluIHNjcmVlbi4gKi8KICBvbkxvZ291dDogKCkgPT4gdm9pZDsKfQoKZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0T3B0aW9ucyB7CiAgc2lnbmFsPzogQWJvcnRTaWduYWw7CiAgYm9keT86IHVua25vd247Cn0KCmV4cG9ydCBpbnRlcmZhY2UgSHR0cENsaWVudCB7CiAgZ2V0PFQ+KHBhdGg6IHN0cmluZywgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zKTogUHJvbWlzZTxUPjsKICBwb3N0PFQ+KHBhdGg6IHN0cmluZywgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zKTogUHJvbWlzZTxUPjsKfQoKZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUh0dHBDbGllbnQobzogSHR0cENsaWVudE9wdGlvbnMpOiBIdHRwQ2xpZW50IHsKICBsZXQgaXNSZWZyZXNoaW5nID0gZmFsc2U7CgogIGFzeW5jIGZ1bmN0aW9uIHJlcXVlc3Q8VD4obWV0aG9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgb3B0aW9uczogUmVxdWVzdE9wdGlvbnMsIHJldHJpZWQgPSBmYWxzZSk6IFByb21pc2U8VD4gewogICAgY29uc3QgdG9rZW5zID0gby5zZXNzaW9uLmdldCgpPy50b2tlbnM7CiAgICBjb25zdCByZXMgPSBhd2FpdCBvLmZldGNoSW1wbChvLmJhc2VVcmwgKyBwYXRoLCB7CiAgICAgIG1ldGhvZCwKICAgICAgaGVhZGVyczogewogICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsCiAgICAgICAgLi4uKHRva2VucyA/IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rva2Vucy5hY2Nlc3NUb2tlbn1gIH0gOiB7fSksCiAgICAgIH0sCiAgICAgIGJvZHk6IG9wdGlvbnMuYm9keSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5ib2R5KSwKICAgICAgc2lnbmFsOiBvcHRpb25zLnNpZ25hbCwKICAgIH0pOwoKICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDEgJiYgIXJldHJpZWQpIHsKICAgICAgaWYgKCFpc1JlZnJlc2hpbmcpIHsKICAgICAgICBpc1JlZnJlc2hpbmcgPSB0cnVlOwogICAgICAgIHRyeSB7CiAgICAgICAgICBjb25zdCBmcmVzaCA9IGF3YWl0IG8ucmVmcmVzaCh0b2tlbnMhLnJlZnJlc2hUb2tlbik7CiAgICAgICAgICB2b2lkIG8uc2Vzc2lvbi5zYXZlVG9rZW5zKGZyZXNoKTsKICAgICAgICB9IGNhdGNoIHsKICAgICAgICAgIG8ub25Mb2dvdXQoKTsKICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoNDAxLCAnWW91ciBzZXNzaW9uIGhhcyBleHBpcmVkLiBTaWduIGluIGFnYWluLicpOwogICAgICAgIH0gZmluYWxseSB7CiAgICAgICAgICBpc1JlZnJlc2hpbmcgPSBmYWxzZTsKICAgICAgICB9CiAgICAgIH0KICAgICAgcmV0dXJuIHJlcXVlc3Q8VD4obWV0aG9kLCBwYXRoLCBvcHRpb25zLCB0cnVlKTsKICAgIH0KICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgSHR0cEVycm9yKHJlcy5zdGF0dXMsIGBSZXF1ZXN0IGZhaWxlZCAoJHtyZXMuc3RhdHVzfSlgKTsKICAgIHJldHVybiAoYXdhaXQgcmVzLmpzb24oKSkgYXMgVDsKICB9CgogIHJldHVybiB7CiAgICBnZXQ6IChwYXRoLCBvcHRpb25zID0ge30pID0+IHJlcXVlc3QoJ0dFVCcsIHBhdGgsIG9wdGlvbnMpLAogICAgcG9zdDogKHBhdGgsIG9wdGlvbnMgPSB7fSkgPT4gcmVxdWVzdCgnUE9TVCcsIHBhdGgsIG9wdGlvbnMpLAogIH07Cn0K', 'base64'), 'UTF8'), false, 0),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/auth/sessionStore.ts', 'typescript', convert_from(decode('aW1wb3J0IEFzeW5jU3RvcmFnZSBmcm9tICdAcmVhY3QtbmF0aXZlLWFzeW5jLXN0b3JhZ2UvYXN5bmMtc3RvcmFnZSc7CmltcG9ydCB0eXBlIHsgU2Vzc2lvbiwgVG9rZW5zIH0gZnJvbSAnLi4vdHlwZXMnOwoKZXhwb3J0IGNvbnN0IFNFU1NJT05fS0VZID0gJ3Nlc3Npb24udjEnOwoKdHlwZSBMaXN0ZW5lciA9IChzZXNzaW9uOiBTZXNzaW9uIHwgbnVsbCkgPT4gdm9pZDsKCmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvblN0b3JlIHsKICAvKiogUmVzb2x2ZXMgb25jZSB0aGUgc2F2ZWQgc2Vzc2lvbiBoYXMgYmVlbiByZWFkIGZyb20gc3RvcmFnZS4gKi8KICByZWFkeTogUHJvbWlzZTx2b2lkPjsKICBnZXQoKTogU2Vzc2lvbiB8IG51bGw7CiAgc2lnbkluKHNlc3Npb246IFNlc3Npb24pOiBQcm9taXNlPHZvaWQ+OwogIC8qKiBTdG9yZXMgbmV3IHRva2VucyBhZnRlciBhIHJlZnJlc2ggKHJlZnJlc2ggdG9rZW5zIHJvdGF0ZTogdGhlIG9sZCBvbmUgc3RvcHMgd29ya2luZykuICovCiAgc2F2ZVRva2Vucyh0b2tlbnM6IFRva2Vucyk6IFByb21pc2U8dm9pZD47CiAgc2lnbk91dCgpOiBQcm9taXNlPHZvaWQ+OwogIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXIpOiAoKSA9PiB2b2lkOwp9CgovKiogVGhlIHNpZ25lZC1pbiBzZXNzaW9uLCBwZXJzaXN0ZWQgaW4gQXN5bmNTdG9yYWdlIHNvIHRoZSB1c2VyIHN0YXlzIHNpZ25lZCBpbiBhY3Jvc3MgbGF1bmNoZXMuICovCmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZXNzaW9uU3RvcmUoKTogU2Vzc2lvblN0b3JlIHsKICBsZXQgc2Vzc2lvbjogU2Vzc2lvbiB8IG51bGwgPSBudWxsOwogIGNvbnN0IGxpc3RlbmVycyA9IG5ldyBTZXQ8TGlzdGVuZXI+KCk7CiAgY29uc3QgZW1pdCA9ICgpID0+IGxpc3RlbmVycy5mb3JFYWNoKChsKSA9PiBsKHNlc3Npb24pKTsKCiAgY29uc3QgcGVyc2lzdCA9IGFzeW5jICgpID0+IHsKICAgIGlmIChzZXNzaW9uKSBhd2FpdCBBc3luY1N0b3JhZ2Uuc2V0SXRlbShTRVNTSU9OX0tFWSwgSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbikpOwogICAgZWxzZSBhd2FpdCBBc3luY1N0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX0tFWSk7CiAgfTsKCiAgY29uc3QgcmVhZHkgPSBBc3luY1N0b3JhZ2UuZ2V0SXRlbShTRVNTSU9OX0tFWSkudGhlbigocmF3KSA9PiB7CiAgICBzZXNzaW9uID0gcmF3ID8gKEpTT04ucGFyc2UocmF3KSBhcyBTZXNzaW9uKSA6IG51bGw7CiAgICBlbWl0KCk7CiAgfSk7CgogIHJldHVybiB7CiAgICByZWFkeSwKICAgIGdldDogKCkgPT4gc2Vzc2lvbiwKICAgIGFzeW5jIHNpZ25JbihuZXh0KSB7CiAgICAgIHNlc3Npb24gPSBuZXh0OwogICAgICBlbWl0KCk7CiAgICAgIGF3YWl0IHBlcnNpc3QoKTsKICAgIH0sCiAgICBhc3luYyBzYXZlVG9rZW5zKHRva2VucykgewogICAgICBpZiAoIXNlc3Npb24pIHJldHVybjsKICAgICAgc2Vzc2lvbiA9IHsgLi4uc2Vzc2lvbiwgdG9rZW5zIH07CiAgICAgIGVtaXQoKTsKICAgICAgYXdhaXQgcGVyc2lzdCgpOwogICAgfSwKICAgIGFzeW5jIHNpZ25PdXQoKSB7CiAgICAgIHNlc3Npb24gPSBudWxsOwogICAgICBlbWl0KCk7CiAgICAgIGF3YWl0IHBlcnNpc3QoKTsKICAgIH0sCiAgICBzdWJzY3JpYmUobGlzdGVuZXIpIHsKICAgICAgbGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7CiAgICAgIHJldHVybiAoKSA9PiBsaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTsKICAgIH0sCiAgfTsKfQo=', 'base64'), 'UTF8'), false, 1),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/hooks/useApprovals.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnOwppbXBvcnQgdHlwZSB7IEh0dHBDbGllbnQgfSBmcm9tICcuLi9hcGkvaHR0cENsaWVudCc7CmltcG9ydCB0eXBlIHsgQXBwcm92YWwsIEZpbHRlciB9IGZyb20gJy4uL3R5cGVzJzsKCi8qKiBMb2FkcyB0aGUgYXBwcm92YWxzIGZvciB0aGUgc2VsZWN0ZWQgZmlsdGVyIGNoaXAgKEFsbCAvIFVyZ2VudCAvIE1pbmUpLiAqLwpleHBvcnQgZnVuY3Rpb24gdXNlQXBwcm92YWxzKGNsaWVudDogSHR0cENsaWVudCwgZmlsdGVyOiBGaWx0ZXIpIHsKICBjb25zdCBbaXRlbXMsIHNldEl0ZW1zXSA9IHVzZVN0YXRlPEFwcHJvdmFsW10+KFtdKTsKICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTsKICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpOwogIGNvbnN0IGNvbnRyb2xsZXIgPSB1c2VSZWYobmV3IEFib3J0Q29udHJvbGxlcigpKTsKCiAgdXNlRWZmZWN0KCgpID0+IHsKICAgIHNldExvYWRpbmcodHJ1ZSk7CiAgICBzZXRFcnJvcihudWxsKTsKICAgIGNsaWVudAogICAgICAuZ2V0PEFwcHJvdmFsW10+KGAvYXBwcm92YWxzP2ZpbHRlcj0ke2ZpbHRlcn1gLCB7IHNpZ25hbDogY29udHJvbGxlci5jdXJyZW50LnNpZ25hbCB9KQogICAgICAudGhlbigoZGF0YSkgPT4gewogICAgICAgIHNldEl0ZW1zKGRhdGEpOwogICAgICAgIHNldExvYWRpbmcoZmFsc2UpOwogICAgICB9KQogICAgICAuY2F0Y2goKGU6IEVycm9yKSA9PiB7CiAgICAgICAgaWYgKGUubmFtZSA9PT0gJ0Fib3J0RXJyb3InKSByZXR1cm47CiAgICAgICAgc2V0RXJyb3IoZS5tZXNzYWdlKTsKICAgICAgICBzZXRMb2FkaW5nKGZhbHNlKTsKICAgICAgfSk7CiAgICByZXR1cm4gKCkgPT4gY29udHJvbGxlci5jdXJyZW50LmFib3J0KCk7CiAgfSwgW2NsaWVudCwgZmlsdGVyXSk7CgogIHJldHVybiB7IGl0ZW1zLCBsb2FkaW5nLCBlcnJvciB9Owp9Cg==', 'base64'), 'UTF8'), false, 2),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/state/approvals.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZVJlZHVjZXIsIHVzZVJlZiB9IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHR5cGUgeyBIdHRwQ2xpZW50IH0gZnJvbSAnLi4vYXBpL2h0dHBDbGllbnQnOwppbXBvcnQgdHlwZSB7IEFwcHJvdmFsLCBEZWNpc2lvbiB9IGZyb20gJy4uL3R5cGVzJzsKCmV4cG9ydCB0eXBlIEFwcHJvdmFsc0FjdGlvbiA9CiAgfCB7IHR5cGU6ICdMT0FERUQnOyBpdGVtczogQXBwcm92YWxbXSB9CiAgfCB7IHR5cGU6ICdTRVRfU1RBVFVTJzsgaWQ6IHN0cmluZzsgc3RhdHVzOiBBcHByb3ZhbFsnc3RhdHVzJ10gfQogIHwgeyB0eXBlOiAnUkVTVE9SRSc7IGl0ZW1zOiBBcHByb3ZhbFtdIH07CgpleHBvcnQgZnVuY3Rpb24gYXBwcm92YWxzUmVkdWNlcihzdGF0ZTogQXBwcm92YWxbXSwgYWN0aW9uOiBBcHByb3ZhbHNBY3Rpb24pOiBBcHByb3ZhbFtdIHsKICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7CiAgICBjYXNlICdMT0FERUQnOgogICAgICByZXR1cm4gYWN0aW9uLml0ZW1zOwogICAgY2FzZSAnU0VUX1NUQVRVUyc6CiAgICAgIHJldHVybiBzdGF0ZS5tYXAoKGEpID0+IChhLmlkID09PSBhY3Rpb24uaWQgPyB7IC4uLmEsIHN0YXR1czogYWN0aW9uLnN0YXR1cywgZXJyb3I6IHVuZGVmaW5lZCB9IDogYSkpOwogICAgY2FzZSAnUkVTVE9SRSc6CiAgICAgIHJldHVybiBhY3Rpb24uaXRlbXM7CiAgICBkZWZhdWx0OgogICAgICByZXR1cm4gc3RhdGU7CiAgfQp9CgovKioKICogQXBwcm92ZSAvIHJlamVjdCB3aXRoIGFuIG9wdGltaXN0aWMgdXBkYXRlOiB0aGUgcm93IGNoYW5nZXMgaW1tZWRpYXRlbHkgYW5kIGlzIHB1dCBiYWNrIGlmIHRoZQogKiBzZXJ2ZXIgY2FsbCBmYWlscy4gQXBwcm92ZXJzIG9mdGVuIGFjdGlvbiBzZXZlcmFsIHJvd3MgaW4gcXVpY2sgc3VjY2Vzc2lvbi4KICovCmV4cG9ydCBmdW5jdGlvbiB1c2VBcHByb3ZhbERlY2lzaW9ucyhhcGk6IFBpY2s8SHR0cENsaWVudCwgJ3Bvc3QnPiwgaW5pdGlhbDogQXBwcm92YWxbXSkgewogIGNvbnN0IFtpdGVtcywgZGlzcGF0Y2hdID0gdXNlUmVkdWNlcihhcHByb3ZhbHNSZWR1Y2VyLCBpbml0aWFsKTsKICBjb25zdCBsYXRlc3QgPSB1c2VSZWYoaXRlbXMpOwogIGxhdGVzdC5jdXJyZW50ID0gaXRlbXM7CgogIGNvbnN0IGRlY2lkZSA9IHVzZUNhbGxiYWNrKAogICAgYXN5bmMgKGlkOiBzdHJpbmcsIGRlY2lzaW9uOiBEZWNpc2lvbikgPT4gewogICAgICBjb25zdCBzbmFwc2hvdCA9IGxhdGVzdC5jdXJyZW50OwogICAgICBkaXNwYXRjaCh7IHR5cGU6ICdTRVRfU1RBVFVTJywgaWQsIHN0YXR1czogZGVjaXNpb24gfSk7CiAgICAgIHRyeSB7CiAgICAgICAgYXdhaXQgYXBpLnBvc3QoYC9hcHByb3ZhbHMvJHtpZH0vJHtkZWNpc2lvbiA9PT0gJ0FQUFJPVkVEJyA/ICdhcHByb3ZlJyA6ICdyZWplY3QnfWApOwogICAgICB9IGNhdGNoIHsKICAgICAgICBkaXNwYXRjaCh7IHR5cGU6ICdSRVNUT1JFJywgaXRlbXM6IHNuYXBzaG90IH0pOwogICAgICB9CiAgICB9LAogICAgW2FwaV0sCiAgKTsKCiAgcmV0dXJuIHsgaXRlbXMsIGRlY2lkZSwgbG9hZDogKG5leHQ6IEFwcHJvdmFsW10pID0+IGRpc3BhdGNoKHsgdHlwZTogJ0xPQURFRCcsIGl0ZW1zOiBuZXh0IH0pIH07Cn0K', 'base64'), 'UTF8'), false, 3),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/screens/ApprovalsList.tsx', 'typescript', convert_from(decode('aW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnOwppbXBvcnQgeyBGbGF0TGlzdCwgUHJlc3NhYmxlLCBTdHlsZVNoZWV0LCBUZXh0LCBUZXh0SW5wdXQsIFZpZXcgfSBmcm9tICdyZWFjdC1uYXRpdmUnOwppbXBvcnQgdHlwZSB7IEFwcHJvdmFsLCBEZWNpc2lvbiB9IGZyb20gJy4uL3R5cGVzJzsKCmV4cG9ydCBjb25zdCBST1dfSEVJR0hUID0gNzI7CmV4cG9ydCBjb25zdCBTRVBBUkFUT1JfSEVJR0hUID0gMTsKCi8qKiBMZXRzIEZsYXRMaXN0IGp1bXAgc3RyYWlnaHQgdG8gYSByb3cgKGRlZXAgbGlua3MgY2FsbCBzY3JvbGxUb0luZGV4KS4gKi8KZXhwb3J0IGZ1bmN0aW9uIGdldEl0ZW1MYXlvdXQoX2RhdGE6IEFycmF5TGlrZTxBcHByb3ZhbD4gfCBudWxsIHwgdW5kZWZpbmVkLCBpbmRleDogbnVtYmVyKSB7CiAgcmV0dXJuIHsgbGVuZ3RoOiBST1dfSEVJR0hULCBvZmZzZXQ6IFJPV19IRUlHSFQgKiBpbmRleCwgaW5kZXggfTsKfQoKY29uc3QgcnVwZWVzID0gKG1pbm9yOiBudW1iZXIpID0+IGDigrkkeyhtaW5vciAvIDEwMCkudG9GaXhlZCgyKX1gOwoKZnVuY3Rpb24gQXBwcm92YWxSb3coewogIGl0ZW0sCiAgZXhwYW5kZWQsCiAgb25Ub2dnbGUsCiAgb25EZWNpZGUsCn06IHsKICBpdGVtOiBBcHByb3ZhbDsKICBleHBhbmRlZDogYm9vbGVhbjsKICBvblRvZ2dsZTogKCkgPT4gdm9pZDsKICBvbkRlY2lkZTogKGlkOiBzdHJpbmcsIGRlY2lzaW9uOiBEZWNpc2lvbiwgY29tbWVudDogc3RyaW5nKSA9PiB2b2lkOwp9KSB7CiAgY29uc3QgW2NvbW1lbnQsIHNldENvbW1lbnRdID0gdXNlU3RhdGUoJycpOwogIHJldHVybiAoCiAgICA8VmlldyBzdHlsZT17c3R5bGVzLnJvd30gdGVzdElEPXtgcm93LSR7aXRlbS5pZH1gfT4KICAgICAgPFByZXNzYWJsZSB0ZXN0SUQ9e2Byb3ctJHtpdGVtLmlkfS10b2dnbGVgfSBvblByZXNzPXtvblRvZ2dsZX0+CiAgICAgICAgPFRleHQgc3R5bGU9e3N0eWxlcy50aXRsZX0+e2l0ZW0udGl0bGV9PC9UZXh0PgogICAgICAgIDxUZXh0PntydXBlZXMoaXRlbS5hbW91bnRNaW5vcil9PC9UZXh0PgogICAgICA8L1ByZXNzYWJsZT4KICAgICAge2V4cGFuZGVkICYmICgKICAgICAgICA8VmlldyB0ZXN0SUQ9e2Byb3ctJHtpdGVtLmlkfS1kZXRhaWxzYH0+CiAgICAgICAgICA8VGV4dD5SZXF1ZXN0ZWQgYnkge2l0ZW0ucmVxdWVzdGVkQnl9PC9UZXh0PgogICAgICAgICAgPFRleHRJbnB1dAogICAgICAgICAgICB0ZXN0SUQ9e2Byb3ctJHtpdGVtLmlkfS1jb21tZW50YH0KICAgICAgICAgICAgdmFsdWU9e2NvbW1lbnR9CiAgICAgICAgICAgIG9uQ2hhbmdlVGV4dD17c2V0Q29tbWVudH0KICAgICAgICAgICAgcGxhY2Vob2xkZXI9IkNvbW1lbnQgKHJlcXVpcmVkIHRvIHJlamVjdCkiCiAgICAgICAgICAvPgogICAgICAgICAgPFByZXNzYWJsZSB0ZXN0SUQ9e2Byb3ctJHtpdGVtLmlkfS1hcHByb3ZlYH0gb25QcmVzcz17KCkgPT4gb25EZWNpZGUoaXRlbS5pZCwgJ0FQUFJPVkVEJywgY29tbWVudCl9PgogICAgICAgICAgICA8VGV4dD5BcHByb3ZlPC9UZXh0PgogICAgICAgICAgPC9QcmVzc2FibGU+CiAgICAgICAgICA8UHJlc3NhYmxlCiAgICAgICAgICAgIHRlc3RJRD17YHJvdy0ke2l0ZW0uaWR9LXJlamVjdGB9CiAgICAgICAgICAgIGRpc2FibGVkPXtjb21tZW50LnRyaW0oKSA9PT0gJyd9CiAgICAgICAgICAgIG9uUHJlc3M9eygpID0+IG9uRGVjaWRlKGl0ZW0uaWQsICdSRUpFQ1RFRCcsIGNvbW1lbnQpfQogICAgICAgICAgPgogICAgICAgICAgICA8VGV4dD5SZWplY3Q8L1RleHQ+CiAgICAgICAgICA8L1ByZXNzYWJsZT4KICAgICAgICA8L1ZpZXc+CiAgICAgICl9CiAgICA8L1ZpZXc+CiAgKTsKfQoKY29uc3QgU2VwYXJhdG9yID0gKCkgPT4gPFZpZXcgc3R5bGU9e3N0eWxlcy5zZXBhcmF0b3J9IC8+OwoKZXhwb3J0IGZ1bmN0aW9uIEFwcHJvdmFsc0xpc3QoewogIGl0ZW1zLAogIG9uRGVjaWRlLAp9OiB7CiAgaXRlbXM6IEFwcHJvdmFsW107CiAgb25EZWNpZGU6IChpZDogc3RyaW5nLCBkZWNpc2lvbjogRGVjaXNpb24sIGNvbW1lbnQ6IHN0cmluZykgPT4gdm9pZDsKfSkgewogIGNvbnN0IFtleHBhbmRlZCwgc2V0RXhwYW5kZWRdID0gdXNlU3RhdGU8bnVtYmVyIHwgbnVsbD4obnVsbCk7CiAgcmV0dXJuICgKICAgIDxGbGF0TGlzdAogICAgICB0ZXN0SUQ9ImFwcHJvdmFscyIKICAgICAgZGF0YT17aXRlbXN9CiAgICAgIGtleUV4dHJhY3Rvcj17KF9pdGVtLCBpbmRleCkgPT4gU3RyaW5nKGluZGV4KX0KICAgICAgZ2V0SXRlbUxheW91dD17Z2V0SXRlbUxheW91dH0KICAgICAgSXRlbVNlcGFyYXRvckNvbXBvbmVudD17U2VwYXJhdG9yfQogICAgICByZW5kZXJJdGVtPXsoeyBpdGVtLCBpbmRleCB9KSA9PiAoCiAgICAgICAgPEFwcHJvdmFsUm93CiAgICAgICAgICBpdGVtPXtpdGVtfQogICAgICAgICAgZXhwYW5kZWQ9e2V4cGFuZGVkID09PSBpbmRleH0KICAgICAgICAgIG9uVG9nZ2xlPXsoKSA9PiBzZXRFeHBhbmRlZChleHBhbmRlZCA9PT0gaW5kZXggPyBudWxsIDogaW5kZXgpfQogICAgICAgICAgb25EZWNpZGU9e29uRGVjaWRlfQogICAgICAgIC8+CiAgICAgICl9CiAgICAvPgogICk7Cn0KCmNvbnN0IHN0eWxlcyA9IFN0eWxlU2hlZXQuY3JlYXRlKHsKICByb3c6IHsgbWluSGVpZ2h0OiBST1dfSEVJR0hULCBwYWRkaW5nSG9yaXpvbnRhbDogMTYsIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyB9LAogIHRpdGxlOiB7IGZvbnRXZWlnaHQ6ICc2MDAnIH0sCiAgc2VwYXJhdG9yOiB7IGhlaWdodDogU0VQQVJBVE9SX0hFSUdIVCwgYmFja2dyb3VuZENvbG9yOiAnI0UyRThGMCcgfSwKfSk7Cg==', 'base64'), 'UTF8'), false, 4),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'src/types.ts', 'typescript', convert_from(decode('ZXhwb3J0IHR5cGUgQXBwcm92YWxTdGF0dXMgPSAnUEVORElORycgfCAnQVBQUk9WRUQnIHwgJ1JFSkVDVEVEJzsKZXhwb3J0IHR5cGUgRGVjaXNpb24gPSAnQVBQUk9WRUQnIHwgJ1JFSkVDVEVEJzsKZXhwb3J0IHR5cGUgRmlsdGVyID0gJ2FsbCcgfCAndXJnZW50JyB8ICdtaW5lJzsKCmV4cG9ydCBpbnRlcmZhY2UgQXBwcm92YWwgewogIGlkOiBzdHJpbmc7CiAgdGl0bGU6IHN0cmluZzsKICAvKiogQW1vdW50IGluIHBhaXNlLiAqLwogIGFtb3VudE1pbm9yOiBudW1iZXI7CiAgdXJnZW50OiBib29sZWFuOwogIHJlcXVlc3RlZEJ5OiBzdHJpbmc7CiAgc3RhdHVzOiBBcHByb3ZhbFN0YXR1czsKICAvKiogU2V0IHdoZW4gdGhlIGxhc3QgZGVjaXNpb24gb24gdGhpcyBpdGVtIGZhaWxlZC4gKi8KICBlcnJvcj86IHN0cmluZzsKfQoKZXhwb3J0IGludGVyZmFjZSBUb2tlbnMgewogIGFjY2Vzc1Rva2VuOiBzdHJpbmc7CiAgcmVmcmVzaFRva2VuOiBzdHJpbmc7Cn0KCmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbiB7CiAgdXNlcklkOiBzdHJpbmc7CiAgdG9rZW5zOiBUb2tlbnM7Cn0KCi8qKiBUaGUgc3Vic2V0IG9mIGZldGNoKCkgdGhlIGFwcCB1c2VzIChpbmplY3RlZCBzbyBpdCBjYW4gYmUgZmFrZWQgaW4gdGVzdHMpLiAqLwpleHBvcnQgdHlwZSBGZXRjaExpa2UgPSAoCiAgdXJsOiBzdHJpbmcsCiAgaW5pdD86IHsgbWV0aG9kPzogc3RyaW5nOyBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjsgYm9keT86IHN0cmluZzsgc2lnbmFsPzogQWJvcnRTaWduYWwgfSwKKSA9PiBQcm9taXNlPHsgc3RhdHVzOiBudW1iZXI7IG9rOiBib29sZWFuOyBqc29uKCk6IFByb21pc2U8dW5rbm93bj4gfT47CgpleHBvcnQgY2xhc3MgSHR0cEVycm9yIGV4dGVuZHMgRXJyb3IgewogIGNvbnN0cnVjdG9yKAogICAgcmVhZG9ubHkgc3RhdHVzOiBudW1iZXIsCiAgICBtZXNzYWdlOiBzdHJpbmcsCiAgKSB7CiAgICBzdXBlcihtZXNzYWdlKTsKICAgIHRoaXMubmFtZSA9ICdIdHRwRXJyb3InOwogIH0KfQo=', 'base64'), 'UTF8'), true, 5),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/httpClient.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgYXN5bmNTdG9yYWdlIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHsgY3JlYXRlSHR0cENsaWVudCB9IGZyb20gJy4uL3NyYy9hcGkvaHR0cENsaWVudCc7CmltcG9ydCB7IGNyZWF0ZVNlc3Npb25TdG9yZSwgU0VTU0lPTl9LRVkgfSBmcm9tICcuLi9zcmMvYXV0aC9zZXNzaW9uU3RvcmUnOwppbXBvcnQgeyBjcmVhdGVGYWtlU2VydmVyLCBlbGFwc2UgfSBmcm9tICcuL3N1cHBvcnQvZmFrZVNlcnZlcic7Cgpjb25zdCBCQVNFID0gJ2h0dHBzOi8vYXBpLnp5Y3VzLnRlc3QnOwoKYXN5bmMgZnVuY3Rpb24gc2V0dXAob3B0aW9uczogeyByZWZyZXNoRmFpbHM/OiBib29sZWFuOyByZWZyZXNoTXM/OiBudW1iZXI7IGZvcmJpZGRlbj86IHN0cmluZ1tdIH0gPSB7fSkgewogIGFzeW5jU3RvcmFnZS5zZWVkKHsKICAgIFtTRVNTSU9OX0tFWV06IEpTT04uc3RyaW5naWZ5KHsgdXNlcklkOiAndTEnLCB0b2tlbnM6IHsgYWNjZXNzVG9rZW46ICdhY2Nlc3MtMCcsIHJlZnJlc2hUb2tlbjogJ3JlZnJlc2gtMCcgfSB9KSwKICB9KTsKICAvLyBUaGUgc2F2ZWQgYWNjZXNzIHRva2VuIGhhcyBleHBpcmVkOyB0aGUgcmVmcmVzaCB0b2tlbiBpcyBzdGlsbCB2YWxpZC4KICBjb25zdCBzZXJ2ZXIgPSBjcmVhdGVGYWtlU2VydmVyKHsgYmFzZVVybDogQkFTRSwgYWNjZXNzOiAnZXhwaXJlZCcsIHJlZnJlc2g6ICdyZWZyZXNoLTAnLCAuLi5vcHRpb25zIH0pOwogIGNvbnN0IHNlc3Npb24gPSBjcmVhdGVTZXNzaW9uU3RvcmUoKTsKICBhd2FpdCBzZXNzaW9uLnJlYWR5OwogIGNvbnN0IG9uTG9nb3V0ID0gamVzdC5mbigpOwogIGNvbnN0IGNsaWVudCA9IGNyZWF0ZUh0dHBDbGllbnQoeyBiYXNlVXJsOiBCQVNFLCBmZXRjaEltcGw6IHNlcnZlci5mZXRjaEltcGwsIHNlc3Npb24sIHJlZnJlc2g6IHNlcnZlci5yZWZyZXNoLCBvbkxvZ291dCB9KTsKICByZXR1cm4geyBzZXJ2ZXIsIHNlc3Npb24sIGNsaWVudCwgb25Mb2dvdXQgfTsKfQoKYWZ0ZXJFYWNoKCgpID0+IHsKICBqZXN0LnVzZVJlYWxUaW1lcnMoKTsKfSk7CgpkZXNjcmliZSgndG9rZW4gcmVmcmVzaCcsICgpID0+IHsKICBpdCgncmV0cmllcyB3aXRoIHRoZSBuZXcgYWNjZXNzIHRva2VuIGFuZCBzdG9yZXMgdGhlIHJvdGF0ZWQgdG9rZW5zJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBzZXJ2ZXIsIGNsaWVudCwgc2Vzc2lvbiB9ID0gYXdhaXQgc2V0dXAoKTsKICAgIGF3YWl0IGV4cGVjdChjbGllbnQuZ2V0KCcvYXBwcm92YWxzJykpLnJlc29sdmVzLnRvRXF1YWwoeyBwYXRoOiAnL2FwcHJvdmFscycgfSk7CiAgICBleHBlY3Qoc2VydmVyLmNhbGxzLm1hcCgoYykgPT4gYy5hdXRoKSkudG9FcXVhbChbJ0JlYXJlciBhY2Nlc3MtMCcsICdCZWFyZXIgYWNjZXNzLTEnXSk7CiAgICBleHBlY3Qoc2Vzc2lvbi5nZXQoKT8udG9rZW5zKS50b0VxdWFsKHsgYWNjZXNzVG9rZW46ICdhY2Nlc3MtMScsIHJlZnJlc2hUb2tlbjogJ3JlZnJlc2gtMScgfSk7CiAgICBleHBlY3QoSlNPTi5wYXJzZShhc3luY1N0b3JhZ2Uuc25hcHNob3QoKVtTRVNTSU9OX0tFWV0hKS50b2tlbnMucmVmcmVzaFRva2VuKS50b0JlKCdyZWZyZXNoLTEnKTsKICB9KTsKCiAgaXQoJ3JlZnJlc2hlcyBvbmNlIHdoZW4gc2V2ZXJhbCByZXF1ZXN0cyBnZXQgNDAxIGF0IHRoZSBzYW1lIHRpbWUnLCBhc3luYyAoKSA9PiB7CiAgICBqZXN0LnVzZUZha2VUaW1lcnMoKTsKICAgIC8vIEEgdmVyeSBzbG93IHJlZnJlc2ggKDMwIHMgb24gYSBiYWQgbmV0d29yayk6IHRoZSBvdGhlciByZXF1ZXN0cyBtdXN0IHdhaXQgZm9yIGl0LCBob3dldmVyIGxvbmcuCiAgICBjb25zdCB7IHNlcnZlciwgY2xpZW50LCBvbkxvZ291dCB9ID0gYXdhaXQgc2V0dXAoeyByZWZyZXNoTXM6IDMwXzAwMCB9KTsKICAgIGNvbnN0IGFsbCA9IFByb21pc2UuYWxsKFtjbGllbnQuZ2V0KCcvYScpLCBjbGllbnQuZ2V0KCcvYicpLCBjbGllbnQuZ2V0KCcvYycpXSk7CiAgICBhd2FpdCBlbGFwc2UoMzFfMDAwKTsKICAgIGF3YWl0IGV4cGVjdChhbGwpLnJlc29sdmVzLnRvRXF1YWwoW3sgcGF0aDogJy9hJyB9LCB7IHBhdGg6ICcvYicgfSwgeyBwYXRoOiAnL2MnIH1dKTsKICAgIGV4cGVjdChzZXJ2ZXIucmVmcmVzaCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpOwogICAgZXhwZWN0KG9uTG9nb3V0KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpOwogIH0pOwoKICBpdCgnZG9lcyBub3QgcmVmcmVzaCBhZ2FpbiBmb3IgYSByZXF1ZXN0IHRoYXQgd2FzIHNlbnQgYmVmb3JlIHRoZSByZWZyZXNoIGZpbmlzaGVkJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBzZXJ2ZXIsIGNsaWVudCwgb25Mb2dvdXQgfSA9IGF3YWl0IHNldHVwKCk7CiAgICBzZXJ2ZXIuaG9sZCgnL3Nsb3cnKTsKICAgIGNvbnN0IHNsb3cgPSBjbGllbnQuZ2V0KCcvc2xvdycpOyAvLyBzZW50IHdpdGggdGhlIG9sZCB0b2tlbjsgaXRzIDQwMSBhcnJpdmVzIGxhdGUKICAgIGF3YWl0IGNsaWVudC5nZXQoJy9mYXN0Jyk7CiAgICBzZXJ2ZXIucmVsZWFzZSgnL3Nsb3cnKTsKICAgIGF3YWl0IGV4cGVjdChzbG93KS5yZXNvbHZlcy50b0VxdWFsKHsgcGF0aDogJy9zbG93JyB9KTsKICAgIGV4cGVjdChzZXJ2ZXIucmVmcmVzaCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpOwogICAgZXhwZWN0KG9uTG9nb3V0KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpOwogIH0pOwoKICBpdCgncmVmcmVzaGVzIGFnYWluIHdoZW4gdGhlIG5ldyBhY2Nlc3MgdG9rZW4gZXhwaXJlcyBsYXRlcicsIGFzeW5jICgpID0+IHsKICAgIGNvbnN0IHsgc2VydmVyLCBjbGllbnQsIHNlc3Npb24sIG9uTG9nb3V0IH0gPSBhd2FpdCBzZXR1cCgpOwogICAgYXdhaXQgY2xpZW50LmdldCgnL2EnKTsKICAgIHNlcnZlci5leHBpcmUoKTsgLy8gdGhlIHRva2VuIGZyb20gdGhlIGZpcnN0IHJlZnJlc2ggaGFzIGV4cGlyZWQgdG9vCiAgICBhd2FpdCBleHBlY3QoY2xpZW50LmdldCgnL2InKSkucmVzb2x2ZXMudG9FcXVhbCh7IHBhdGg6ICcvYicgfSk7CiAgICBleHBlY3Qoc2VydmVyLnJlZnJlc2gpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygyKTsKICAgIGV4cGVjdChzZXNzaW9uLmdldCgpPy50b2tlbnMpLnRvRXF1YWwoeyBhY2Nlc3NUb2tlbjogJ2FjY2Vzcy0yJywgcmVmcmVzaFRva2VuOiAncmVmcmVzaC0yJyB9KTsKICAgIGV4cGVjdChvbkxvZ291dCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsKICB9KTsKCiAgaXQoJ3JldHJpZXMgYSByZWZ1c2VkIHJlcXVlc3Qgb25seSBvbmNlJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBzZXJ2ZXIsIGNsaWVudCB9ID0gYXdhaXQgc2V0dXAoeyBmb3JiaWRkZW46IFsnL2FkbWluLW9ubHknXSB9KTsKICAgIGF3YWl0IGV4cGVjdChjbGllbnQuZ2V0KCcvYWRtaW4tb25seScpKS5yZWplY3RzLnRvVGhyb3coKTsKICAgIGV4cGVjdChzZXJ2ZXIucmVmcmVzaCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpOwogICAgZXhwZWN0KHNlcnZlci5jYWxscy5maWx0ZXIoKGMpID0+IGMucGF0aCA9PT0gJy9hZG1pbi1vbmx5JykpLnRvSGF2ZUxlbmd0aCgyKTsKICB9KTsKCiAgaXQoJ2xvZ3Mgb3V0IGV4YWN0bHkgb25jZSB3aGVuIHRoZSByZWZyZXNoIHRva2VuIGlzIHJlamVjdGVkJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBjbGllbnQsIG9uTG9nb3V0IH0gPSBhd2FpdCBzZXR1cCh7IHJlZnJlc2hGYWlsczogdHJ1ZSB9KTsKICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoW2NsaWVudC5nZXQoJy9hJyksIGNsaWVudC5nZXQoJy9iJyksIGNsaWVudC5nZXQoJy9jJyldKTsKICAgIGV4cGVjdChyZXN1bHRzLm1hcCgocikgPT4gci5zdGF0dXMpKS50b0VxdWFsKFsncmVqZWN0ZWQnLCAncmVqZWN0ZWQnLCAncmVqZWN0ZWQnXSk7CiAgICBleHBlY3Qob25Mb2dvdXQpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 6),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/sessionStore.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgYXN5bmNTdG9yYWdlIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHsgY3JlYXRlSHR0cENsaWVudCB9IGZyb20gJy4uL3NyYy9hcGkvaHR0cENsaWVudCc7CmltcG9ydCB7IGNyZWF0ZVNlc3Npb25TdG9yZSwgU0VTU0lPTl9LRVkgfSBmcm9tICcuLi9zcmMvYXV0aC9zZXNzaW9uU3RvcmUnOwppbXBvcnQgeyBjcmVhdGVGYWtlU2VydmVyLCBlbGFwc2UgfSBmcm9tICcuL3N1cHBvcnQvZmFrZVNlcnZlcic7Cgpjb25zdCBCQVNFID0gJ2h0dHBzOi8vYXBpLnp5Y3VzLnRlc3QnOwpjb25zdCBzYXZlZCA9IHsgdXNlcklkOiAndTEnLCB0b2tlbnM6IHsgYWNjZXNzVG9rZW46ICdhY2Nlc3MtMCcsIHJlZnJlc2hUb2tlbjogJ3JlZnJlc2gtMCcgfSB9OwovKiogU3RvcmFnZSByZWFkcyBhbmQgd3JpdGVzIHRha2UgdGhpcyBsb25nIChhIHNsb3cgZGV2aWNlLCBvbiBwdXJwb3NlIG11Y2ggbG9uZ2VyIHRoYW4gbmVlZGVkKS4gKi8KY29uc3QgU1RPUkFHRV9NUyA9IDMwXzAwMDsKCmRlc2NyaWJlKCdzZXNzaW9uIHBlcnNpc3RlbmNlIChjb2xkIHN0YXJ0KScsICgpID0+IHsKICBiZWZvcmVFYWNoKCgpID0+IHsKICAgIGplc3QudXNlRmFrZVRpbWVycygpOwogICAgYXN5bmNTdG9yYWdlLnNlZWQoeyBbU0VTU0lPTl9LRVldOiBKU09OLnN0cmluZ2lmeShzYXZlZCkgfSk7CiAgICBhc3luY1N0b3JhZ2Uuc2V0TGF0ZW5jeShTVE9SQUdFX01TKTsKICB9KTsKICBhZnRlckVhY2goKCkgPT4gewogICAgamVzdC51c2VSZWFsVGltZXJzKCk7CiAgfSk7CgogIGl0KCd0aGUgZmlyc3QgcmVxdWVzdCBhZnRlciBsYXVuY2ggY2FycmllcyB0aGUgc2F2ZWQgYWNjZXNzIHRva2VuJywgYXN5bmMgKCkgPT4gewogICAgY29uc3Qgc2VydmVyID0gY3JlYXRlRmFrZVNlcnZlcih7IGJhc2VVcmw6IEJBU0UsIGFjY2VzczogJ2FjY2Vzcy0wJywgcmVmcmVzaDogJ3JlZnJlc2gtMCcgfSk7CiAgICBjb25zdCBzZXNzaW9uID0gY3JlYXRlU2Vzc2lvblN0b3JlKCk7IC8vIHN0aWxsIHJlYWRpbmcgZnJvbSBzdG9yYWdlCiAgICBjb25zdCBjbGllbnQgPSBjcmVhdGVIdHRwQ2xpZW50KHsKICAgICAgYmFzZVVybDogQkFTRSwKICAgICAgZmV0Y2hJbXBsOiBzZXJ2ZXIuZmV0Y2hJbXBsLAogICAgICBzZXNzaW9uLAogICAgICByZWZyZXNoOiBzZXJ2ZXIucmVmcmVzaCwKICAgICAgb25Mb2dvdXQ6IGplc3QuZm4oKSwKICAgIH0pOwogICAgY29uc3QgbWUgPSBjbGllbnQuZ2V0KCcvbWUnKTsKICAgIGF3YWl0IGVsYXBzZShTVE9SQUdFX01TICsgMV8wMDApOwogICAgYXdhaXQgZXhwZWN0KG1lKS5yZXNvbHZlcy50b0VxdWFsKHsgcGF0aDogJy9tZScgfSk7CiAgICBleHBlY3Qoc2VydmVyLmNhbGxzWzBdPy5hdXRoKS50b0JlKCdCZWFyZXIgYWNjZXNzLTAnKTsKICAgIGV4cGVjdChzZXJ2ZXIucmVmcmVzaCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsKICB9KTsKCiAgaXQoJ2tlZXBzIHRva2VucyB0aGF0IHdlcmUgc2F2ZWQgd2hpbGUgdGhlIHNlc3Npb24gd2FzIHN0aWxsIGxvYWRpbmcnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBzZXNzaW9uID0gY3JlYXRlU2Vzc2lvblN0b3JlKCk7CiAgICBjb25zdCBmcmVzaCA9IHsgYWNjZXNzVG9rZW46ICdhY2Nlc3MtOScsIHJlZnJlc2hUb2tlbjogJ3JlZnJlc2gtOScgfTsKICAgIGNvbnN0IHNhdmluZyA9IHNlc3Npb24uc2F2ZVRva2VucyhmcmVzaCk7CiAgICBhd2FpdCBlbGFwc2UoMiAqIFNUT1JBR0VfTVMgKyAxXzAwMCk7CiAgICBhd2FpdCBzYXZpbmc7CiAgICBhd2FpdCBzZXNzaW9uLnJlYWR5OwogICAgZXhwZWN0KHNlc3Npb24uZ2V0KCkpLnRvRXF1YWwoeyB1c2VySWQ6ICd1MScsIHRva2VuczogZnJlc2ggfSk7CiAgICBleHBlY3QoSlNPTi5wYXJzZShhc3luY1N0b3JhZ2Uuc25hcHNob3QoKVtTRVNTSU9OX0tFWV0hKSkudG9FcXVhbCh7IHVzZXJJZDogJ3UxJywgdG9rZW5zOiBmcmVzaCB9KTsKICB9KTsKCiAgaXQoJ3NpZ25pbmcgb3V0IHJlbW92ZXMgdGhlIHNhdmVkIHNlc3Npb24nLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBzZXNzaW9uID0gY3JlYXRlU2Vzc2lvblN0b3JlKCk7CiAgICBhd2FpdCBlbGFwc2UoU1RPUkFHRV9NUyArIDFfMDAwKTsKICAgIGF3YWl0IHNlc3Npb24ucmVhZHk7CiAgICBjb25zdCBvdXQgPSBzZXNzaW9uLnNpZ25PdXQoKTsKICAgIGF3YWl0IGVsYXBzZShTVE9SQUdFX01TICsgMV8wMDApOwogICAgYXdhaXQgb3V0OwogICAgZXhwZWN0KHNlc3Npb24uZ2V0KCkpLnRvQmVOdWxsKCk7CiAgICBleHBlY3QoYXN5bmNTdG9yYWdlLnNuYXBzaG90KClbU0VTU0lPTl9LRVldKS50b0JlVW5kZWZpbmVkKCk7CiAgfSk7CgogIGl0KCdzaWduaW5nIG91dCB3aGlsZSB0aGUgc2Vzc2lvbiBpcyBzdGlsbCBsb2FkaW5nIGtlZXBzIHRoZSB1c2VyIHNpZ25lZCBvdXQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBzZXNzaW9uID0gY3JlYXRlU2Vzc2lvblN0b3JlKCk7CiAgICBjb25zdCBvdXQgPSBzZXNzaW9uLnNpZ25PdXQoKTsKICAgIGF3YWl0IGVsYXBzZSgyICogU1RPUkFHRV9NUyArIDFfMDAwKTsKICAgIGF3YWl0IG91dDsKICAgIGF3YWl0IHNlc3Npb24ucmVhZHk7CiAgICBleHBlY3Qoc2Vzc2lvbi5nZXQoKSkudG9CZU51bGwoKTsKICAgIGV4cGVjdChhc3luY1N0b3JhZ2Uuc25hcHNob3QoKVtTRVNTSU9OX0tFWV0pLnRvQmVVbmRlZmluZWQoKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 7),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/useApprovals.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCByZW5kZXJIb29rIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHR5cGUgeyBIdHRwQ2xpZW50LCBSZXF1ZXN0T3B0aW9ucyB9IGZyb20gJy4uL3NyYy9hcGkvaHR0cENsaWVudCc7CmltcG9ydCB7IHVzZUFwcHJvdmFscyB9IGZyb20gJy4uL3NyYy9ob29rcy91c2VBcHByb3ZhbHMnOwppbXBvcnQgdHlwZSB7IEFwcHJvdmFsLCBGaWx0ZXIgfSBmcm9tICcuLi9zcmMvdHlwZXMnOwoKY29uc3QgaXRlbSA9IChpZDogc3RyaW5nLCB1cmdlbnQgPSBmYWxzZSk6IEFwcHJvdmFsID0+ICh7CiAgaWQsCiAgdGl0bGU6IGBSZXF1aXNpdGlvbiAke2lkfWAsCiAgYW1vdW50TWlub3I6IDEyNV8wMDAsCiAgdXJnZW50LAogIHJlcXVlc3RlZEJ5OiAnUHJpeWEnLAogIHN0YXR1czogJ1BFTkRJTkcnLAp9KTsKY29uc3QgQUxMID0gW2l0ZW0oJzEnKSwgaXRlbSgnMicsIHRydWUpLCBpdGVtKCczJyldOwpjb25zdCBVUkdFTlQgPSBbaXRlbSgnMicsIHRydWUpXTsKY29uc3QgTUlORSA9IFtpdGVtKCczJyldOwoKLyoqIEEgZmFrZSBjbGllbnQgd2hvc2UgcmVzcG9uc2VzIHRoZSB0ZXN0IHJlbGVhc2VzIGJ5IGhhbmQsIGluIGFueSBvcmRlci4gKi8KZnVuY3Rpb24gZmFrZUNsaWVudCgpIHsKICBjb25zdCByZXF1ZXN0cyA9IG5ldyBNYXA8c3RyaW5nLCB7IHJlc29sdmU6IChkYXRhOiB1bmtub3duKSA9PiB2b2lkOyByZWplY3Q6IChlOiBFcnJvcikgPT4gdm9pZDsgc2lnbmFsPzogQWJvcnRTaWduYWwgfT4oKTsKICBjb25zdCBnZXQgPSBqZXN0LmZuKAogICAgKHBhdGg6IHN0cmluZywgb3B0aW9uczogUmVxdWVzdE9wdGlvbnMgPSB7fSkgPT4KICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gewogICAgICAgIGNvbnN0IGFib3J0ID0gKCkgPT4gcmVqZWN0KE9iamVjdC5hc3NpZ24obmV3IEVycm9yKCdBYm9ydGVkJyksIHsgbmFtZTogJ0Fib3J0RXJyb3InIH0pKTsKICAgICAgICBpZiAob3B0aW9ucy5zaWduYWw/LmFib3J0ZWQpIHJldHVybiBhYm9ydCgpOwogICAgICAgIG9wdGlvbnMuc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0KTsKICAgICAgICByZXF1ZXN0cy5zZXQocGF0aCwgeyByZXNvbHZlLCByZWplY3QsIHNpZ25hbDogb3B0aW9ucy5zaWduYWwgfSk7CiAgICAgIH0pLAogICk7CiAgcmV0dXJuIHsKICAgIGNsaWVudDogeyBnZXQsIHBvc3Q6IGplc3QuZm4oKSB9IGFzIHVua25vd24gYXMgSHR0cENsaWVudCwKICAgIHNpZ25hbEZvcjogKHBhdGg6IHN0cmluZykgPT4gcmVxdWVzdHMuZ2V0KHBhdGgpPy5zaWduYWwsCiAgICBhc3luYyByZXNwb25kKHBhdGg6IHN0cmluZywgZGF0YTogdW5rbm93bikgewogICAgICBjb25zdCByZXF1ZXN0ID0gcmVxdWVzdHMuZ2V0KHBhdGgpOwogICAgICBpZiAoIXJlcXVlc3QpIHRocm93IG5ldyBFcnJvcihgTm8gcmVxdWVzdCBmb3IgJHtwYXRofSByZWFjaGVkIHRoZSBzZXJ2ZXIgKGNhbmNlbGxlZCBiZWZvcmUgaXQgd2FzIHNlbnQ/KWApOwogICAgICBhd2FpdCBhY3QoYXN5bmMgKCkgPT4gcmVxdWVzdC5yZXNvbHZlKGRhdGEpKTsKICAgIH0sCiAgICBhc3luYyBmYWlsKHBhdGg6IHN0cmluZywgZXJyb3I6IEVycm9yKSB7CiAgICAgIGNvbnN0IHJlcXVlc3QgPSByZXF1ZXN0cy5nZXQocGF0aCk7CiAgICAgIGlmICghcmVxdWVzdCkgdGhyb3cgbmV3IEVycm9yKGBObyByZXF1ZXN0IGZvciAke3BhdGh9IHJlYWNoZWQgdGhlIHNlcnZlciAoY2FuY2VsbGVkIGJlZm9yZSBpdCB3YXMgc2VudD8pYCk7CiAgICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiByZXF1ZXN0LnJlamVjdChlcnJvcikpOwogICAgfSwKICB9Owp9Cgpjb25zdCByZW5kZXIgPSAoYXBpOiBSZXR1cm5UeXBlPHR5cGVvZiBmYWtlQ2xpZW50PikgPT4KICByZW5kZXJIb29rKCh7IGZpbHRlciB9OiB7IGZpbHRlcjogRmlsdGVyIH0pID0+IHVzZUFwcHJvdmFscyhhcGkuY2xpZW50LCBmaWx0ZXIpLCB7CiAgICBpbml0aWFsUHJvcHM6IHsgZmlsdGVyOiAnYWxsJyB9LAogIH0pOwoKZGVzY3JpYmUoJ3VzZUFwcHJvdmFscycsICgpID0+IHsKICBpdCgnbG9hZHMgdGhlIGxpc3QgZm9yIGVhY2ggZmlsdGVyIGNoaXAnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBhcGkgPSBmYWtlQ2xpZW50KCk7CiAgICBjb25zdCB7IHJlc3VsdCwgcmVyZW5kZXIgfSA9IHJlbmRlcihhcGkpOwogICAgYXdhaXQgYXBpLnJlc3BvbmQoJy9hcHByb3ZhbHM/ZmlsdGVyPWFsbCcsIEFMTCk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQpLnRvTWF0Y2hPYmplY3QoeyBpdGVtczogQUxMLCBsb2FkaW5nOiBmYWxzZSwgZXJyb3I6IG51bGwgfSk7CgogICAgcmVyZW5kZXIoeyBmaWx0ZXI6ICd1cmdlbnQnIH0pOwogICAgZXhwZWN0KHJlc3VsdC5jdXJyZW50LmxvYWRpbmcpLnRvQmUodHJ1ZSk7CiAgICBhd2FpdCBhcGkucmVzcG9uZCgnL2FwcHJvdmFscz9maWx0ZXI9dXJnZW50JywgVVJHRU5UKTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudCkudG9NYXRjaE9iamVjdCh7IGl0ZW1zOiBVUkdFTlQsIGxvYWRpbmc6IGZhbHNlLCBlcnJvcjogbnVsbCB9KTsKCiAgICByZXJlbmRlcih7IGZpbHRlcjogJ21pbmUnIH0pOwogICAgYXdhaXQgYXBpLnJlc3BvbmQoJy9hcHByb3ZhbHM/ZmlsdGVyPW1pbmUnLCBNSU5FKTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudCkudG9NYXRjaE9iamVjdCh7IGl0ZW1zOiBNSU5FLCBsb2FkaW5nOiBmYWxzZSwgZXJyb3I6IG51bGwgfSk7CiAgfSk7CgogIGl0KCdpZ25vcmVzIGEgc2xvdyByZXNwb25zZSBmb3IgYSBmaWx0ZXIgdGhhdCBpcyBubyBsb25nZXIgc2VsZWN0ZWQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBhcGkgPSBmYWtlQ2xpZW50KCk7CiAgICBjb25zdCB7IHJlc3VsdCwgcmVyZW5kZXIgfSA9IHJlbmRlcihhcGkpOwogICAgYXdhaXQgYXBpLnJlc3BvbmQoJy9hcHByb3ZhbHM/ZmlsdGVyPWFsbCcsIEFMTCk7CiAgICByZXJlbmRlcih7IGZpbHRlcjogJ3VyZ2VudCcgfSk7CiAgICByZXJlbmRlcih7IGZpbHRlcjogJ21pbmUnIH0pOwogICAgYXdhaXQgYWN0KGFzeW5jICgpID0+IHt9KTsgLy8gdGhlIGNhbmNlbGxlZCByZXF1ZXN0IHNldHRsZXMKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5sb2FkaW5nKS50b0JlKHRydWUpOyAvLyBzdGlsbCBsb2FkaW5nICdtaW5lJwogICAgYXdhaXQgYXBpLnJlc3BvbmQoJy9hcHByb3ZhbHM/ZmlsdGVyPW1pbmUnLCBNSU5FKTsKICAgIGF3YWl0IGFwaS5yZXNwb25kKCcvYXBwcm92YWxzP2ZpbHRlcj11cmdlbnQnLCBVUkdFTlQpOyAvLyBhcnJpdmVzIGxhdGUKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5pdGVtcykudG9FcXVhbChNSU5FKTsKICAgIGV4cGVjdChhcGkuc2lnbmFsRm9yKCcvYXBwcm92YWxzP2ZpbHRlcj11cmdlbnQnKT8uYWJvcnRlZCkudG9CZSh0cnVlKTsKICB9KTsKCiAgaXQoJ3Nob3dzIGFuIGVycm9yIHdoZW4gdGhlIGxpc3QgZmFpbHMgdG8gbG9hZCwgYW5kIGNsZWFycyBpdCBvbiB0aGUgbmV4dCBsb2FkJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgYXBpID0gZmFrZUNsaWVudCgpOwogICAgY29uc3QgeyByZXN1bHQsIHJlcmVuZGVyIH0gPSByZW5kZXIoYXBpKTsKICAgIGF3YWl0IGFwaS5mYWlsKCcvYXBwcm92YWxzP2ZpbHRlcj1hbGwnLCBuZXcgRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQpLnRvTWF0Y2hPYmplY3QoeyBpdGVtczogW10sIGxvYWRpbmc6IGZhbHNlLCBlcnJvcjogJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnIH0pOwoKICAgIHJlcmVuZGVyKHsgZmlsdGVyOiAndXJnZW50JyB9KTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5lcnJvcikudG9CZU51bGwoKTsKICAgIGF3YWl0IGFwaS5yZXNwb25kKCcvYXBwcm92YWxzP2ZpbHRlcj11cmdlbnQnLCBVUkdFTlQpOwogICAgZXhwZWN0KHJlc3VsdC5jdXJyZW50KS50b01hdGNoT2JqZWN0KHsgaXRlbXM6IFVSR0VOVCwgbG9hZGluZzogZmFsc2UsIGVycm9yOiBudWxsIH0pOwogIH0pOwoKICBpdCgnY2FuY2VscyB0aGUgcmVxdWVzdCB3aGVuIHRoZSBzY3JlZW4gZ29lcyBhd2F5JywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgYXBpID0gZmFrZUNsaWVudCgpOwogICAgY29uc3QgeyB1bm1vdW50IH0gPSByZW5kZXIoYXBpKTsKICAgIHVubW91bnQoKTsKICAgIGV4cGVjdChhcGkuc2lnbmFsRm9yKCcvYXBwcm92YWxzP2ZpbHRlcj1hbGwnKT8uYWJvcnRlZCkudG9CZSh0cnVlKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 8),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/approvals.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCBkZWZlcnJlZCwgZmx1c2hQcm9taXNlcywgcmVuZGVySG9vayB9IGZyb20gJ0Bjb2RlYXJlbmEvdGVzdC11dGlscyc7CmltcG9ydCB7IHVzZUFwcHJvdmFsRGVjaXNpb25zIH0gZnJvbSAnLi4vc3JjL3N0YXRlL2FwcHJvdmFscyc7CmltcG9ydCB0eXBlIHsgQXBwcm92YWwgfSBmcm9tICcuLi9zcmMvdHlwZXMnOwoKY29uc3QgbWFrZSA9IChpZDogc3RyaW5nLCBzdGF0dXM6IEFwcHJvdmFsWydzdGF0dXMnXSA9ICdQRU5ESU5HJyk6IEFwcHJvdmFsID0+ICh7CiAgaWQsCiAgdGl0bGU6IGBJbnZvaWNlICR7aWR9YCwKICBhbW91bnRNaW5vcjogOTlfOTAwLAogIHVyZ2VudDogZmFsc2UsCiAgcmVxdWVzdGVkQnk6ICdBcmp1bicsCiAgc3RhdHVzLAp9KTsKCmZ1bmN0aW9uIHNlcnZlcldpdGhNYW51YWxSZXBsaWVzKCkgewogIGNvbnN0IHJlcGxpZXMgPSBuZXcgTWFwPHN0cmluZywgUmV0dXJuVHlwZTx0eXBlb2YgZGVmZXJyZWQ+PigpOwogIGNvbnN0IHBvc3QgPSBqZXN0LmZuKChwYXRoOiBzdHJpbmcpID0+IHsKICAgIGNvbnN0IHJlcGx5ID0gZGVmZXJyZWQoKTsKICAgIHJlcGxpZXMuc2V0KHBhdGgsIHJlcGx5KTsKICAgIHJldHVybiByZXBseS5wcm9taXNlOwogIH0pOwogIHJldHVybiB7IGFwaTogeyBwb3N0IH0gYXMgbmV2ZXIsIHJlcGx5OiAocGF0aDogc3RyaW5nKSA9PiByZXBsaWVzLmdldChwYXRoKSEgfTsKfQoKY29uc3Qgc3RhdHVzT2YgPSAoaXRlbXM6IEFwcHJvdmFsW10sIGlkOiBzdHJpbmcpID0+IGl0ZW1zLmZpbmQoKGEpID0+IGEuaWQgPT09IGlkKTsKCmRlc2NyaWJlKCdvcHRpbWlzdGljIGFwcHJvdmUgLyByZWplY3QnLCAoKSA9PiB7CiAgaXQoJ3JvbGxzIGJhY2sgb25seSB0aGUgZGVjaXNpb24gdGhhdCBmYWlsZWQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCB7IGFwaSwgcmVwbHkgfSA9IHNlcnZlcldpdGhNYW51YWxSZXBsaWVzKCk7CiAgICBjb25zdCB7IHJlc3VsdCB9ID0gcmVuZGVySG9vaygoKSA9PiB1c2VBcHByb3ZhbERlY2lzaW9ucyhhcGksIFttYWtlKCdBJyksIG1ha2UoJ0InKSwgbWFrZSgnQycpXSkpOwogICAgYWN0KCgpID0+IHZvaWQgcmVzdWx0LmN1cnJlbnQuZGVjaWRlKCdBJywgJ0FQUFJPVkVEJykpOwogICAgYWN0KCgpID0+IHZvaWQgcmVzdWx0LmN1cnJlbnQuZGVjaWRlKCdCJywgJ0FQUFJPVkVEJykpOwogICAgZXhwZWN0KHJlc3VsdC5jdXJyZW50Lml0ZW1zLm1hcCgoYSkgPT4gYS5zdGF0dXMpKS50b0VxdWFsKFsnQVBQUk9WRUQnLCAnQVBQUk9WRUQnLCAnUEVORElORyddKTsKCiAgICBhd2FpdCBhY3QoYXN5bmMgKCkgPT4gcmVwbHkoJy9hcHByb3ZhbHMvQS9hcHByb3ZlJykucmVqZWN0KG5ldyBFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKSk7CiAgICBhd2FpdCBhY3QoYXN5bmMgKCkgPT4gcmVwbHkoJy9hcHByb3ZhbHMvQi9hcHByb3ZlJykucmVzb2x2ZSh7fSkpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwoKICAgIGV4cGVjdChzdGF0dXNPZihyZXN1bHQuY3VycmVudC5pdGVtcywgJ0EnKSkudG9NYXRjaE9iamVjdCh7IHN0YXR1czogJ1BFTkRJTkcnLCBlcnJvcjogZXhwZWN0LmFueShTdHJpbmcpIH0pOwogICAgZXhwZWN0KHN0YXR1c09mKHJlc3VsdC5jdXJyZW50Lml0ZW1zLCAnQicpKS50b01hdGNoT2JqZWN0KHsgc3RhdHVzOiAnQVBQUk9WRUQnIH0pOwogICAgZXhwZWN0KHN0YXR1c09mKHJlc3VsdC5jdXJyZW50Lml0ZW1zLCAnQicpPy5lcnJvcikudG9CZVVuZGVmaW5lZCgpOwogIH0pOwoKICBpdCgna2VlcHMgYSBsYXRlciBzdWNjZXNzIHdoZW4gYW4gZWFybGllciByZXF1ZXN0IGZhaWxzIGFmdGVyd2FyZHMnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCB7IGFwaSwgcmVwbHkgfSA9IHNlcnZlcldpdGhNYW51YWxSZXBsaWVzKCk7CiAgICBjb25zdCB7IHJlc3VsdCB9ID0gcmVuZGVySG9vaygoKSA9PiB1c2VBcHByb3ZhbERlY2lzaW9ucyhhcGksIFttYWtlKCdBJyksIG1ha2UoJ0InKV0pKTsKICAgIGFjdCgoKSA9PiB2b2lkIHJlc3VsdC5jdXJyZW50LmRlY2lkZSgnQScsICdSRUpFQ1RFRCcpKTsKICAgIGFjdCgoKSA9PiB2b2lkIHJlc3VsdC5jdXJyZW50LmRlY2lkZSgnQicsICdBUFBST1ZFRCcpKTsKICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiByZXBseSgnL2FwcHJvdmFscy9CL2FwcHJvdmUnKS5yZXNvbHZlKHt9KSk7CiAgICBhd2FpdCBhY3QoYXN5bmMgKCkgPT4gcmVwbHkoJy9hcHByb3ZhbHMvQS9yZWplY3QnKS5yZWplY3QobmV3IEVycm9yKCd0aW1lb3V0JykpKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5pdGVtcy5tYXAoKGEpID0+IGEuc3RhdHVzKSkudG9FcXVhbChbJ1BFTkRJTkcnLCAnQVBQUk9WRUQnXSk7CiAgfSk7CgogIGl0KCdhIGZhaWxlZCBjaGFuZ2UgcmV0dXJucyB0aGUgcm93IHRvIHRoZSBzdGF0dXMgaXQgaGFkIGJlZm9yZScsIGFzeW5jICgpID0+IHsKICAgIGNvbnN0IHsgYXBpLCByZXBseSB9ID0gc2VydmVyV2l0aE1hbnVhbFJlcGxpZXMoKTsKICAgIGNvbnN0IHsgcmVzdWx0IH0gPSByZW5kZXJIb29rKCgpID0+IHVzZUFwcHJvdmFsRGVjaXNpb25zKGFwaSwgW21ha2UoJ0EnLCAnQVBQUk9WRUQnKV0pKTsKICAgIGFjdCgoKSA9PiB2b2lkIHJlc3VsdC5jdXJyZW50LmRlY2lkZSgnQScsICdSRUpFQ1RFRCcpKTsKICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiByZXBseSgnL2FwcHJvdmFscy9BL3JlamVjdCcpLnJlamVjdChuZXcgRXJyb3IoJzQwOSBDb25mbGljdCcpKSk7CiAgICBhd2FpdCBmbHVzaFByb21pc2VzKCk7CiAgICBleHBlY3Qoc3RhdHVzT2YocmVzdWx0LmN1cnJlbnQuaXRlbXMsICdBJykpLnRvTWF0Y2hPYmplY3QoeyBzdGF0dXM6ICdBUFBST1ZFRCcsIGVycm9yOiBleHBlY3QuYW55KFN0cmluZykgfSk7CiAgfSk7CgogIGl0KCdhIGZhaWxlZCBjaGFuZ2UgYWZ0ZXIgYW4gZWFybGllciBzdWNjZXNzIHJldHVybnMgdG8gdGhlIHN0YXR1cyB0aGF0IHN1Y2NlZWRlZCcsIGFzeW5jICgpID0+IHsKICAgIGNvbnN0IHsgYXBpLCByZXBseSB9ID0gc2VydmVyV2l0aE1hbnVhbFJlcGxpZXMoKTsKICAgIGNvbnN0IHsgcmVzdWx0IH0gPSByZW5kZXJIb29rKCgpID0+IHVzZUFwcHJvdmFsRGVjaXNpb25zKGFwaSwgW21ha2UoJ0EnKV0pKTsKICAgIGFjdCgoKSA9PiB2b2lkIHJlc3VsdC5jdXJyZW50LmRlY2lkZSgnQScsICdBUFBST1ZFRCcpKTsKICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiByZXBseSgnL2FwcHJvdmFscy9BL2FwcHJvdmUnKS5yZXNvbHZlKHt9KSk7CiAgICBhY3QoKCkgPT4gdm9pZCByZXN1bHQuY3VycmVudC5kZWNpZGUoJ0EnLCAnUkVKRUNURUQnKSk7CiAgICBhd2FpdCBhY3QoYXN5bmMgKCkgPT4gcmVwbHkoJy9hcHByb3ZhbHMvQS9yZWplY3QnKS5yZWplY3QobmV3IEVycm9yKCc0MDkgQ29uZmxpY3QnKSkpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogICAgZXhwZWN0KHN0YXR1c09mKHJlc3VsdC5jdXJyZW50Lml0ZW1zLCAnQScpKS50b01hdGNoT2JqZWN0KHsgc3RhdHVzOiAnQVBQUk9WRUQnLCBlcnJvcjogZXhwZWN0LmFueShTdHJpbmcpIH0pOwogIH0pOwoKICBpdCgncm9sbHMgYmFjayB0byB0aGUgc3RhdHVzIGZyb20gdGhlIGxhdGVzdCBsaXN0LCBub3QgdGhlIGZpcnN0IG9uZScsIGFzeW5jICgpID0+IHsKICAgIGNvbnN0IHsgYXBpLCByZXBseSB9ID0gc2VydmVyV2l0aE1hbnVhbFJlcGxpZXMoKTsKICAgIGNvbnN0IHsgcmVzdWx0IH0gPSByZW5kZXJIb29rKCgpID0+IHVzZUFwcHJvdmFsRGVjaXNpb25zKGFwaSwgW21ha2UoJ0EnKV0pKTsKICAgIGFjdCgoKSA9PiByZXN1bHQuY3VycmVudC5sb2FkKFttYWtlKCdBJywgJ0FQUFJPVkVEJyldKSk7IC8vIHJlbG9hZGVkOiBhcHByb3ZlZCBlbHNld2hlcmUKICAgIGFjdCgoKSA9PiB2b2lkIHJlc3VsdC5jdXJyZW50LmRlY2lkZSgnQScsICdSRUpFQ1RFRCcpKTsKICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiByZXBseSgnL2FwcHJvdmFscy9BL3JlamVjdCcpLnJlamVjdChuZXcgRXJyb3IoJ3RpbWVvdXQnKSkpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogICAgZXhwZWN0KHN0YXR1c09mKHJlc3VsdC5jdXJyZW50Lml0ZW1zLCAnQScpKS50b01hdGNoT2JqZWN0KHsgc3RhdHVzOiAnQVBQUk9WRUQnLCBlcnJvcjogZXhwZWN0LmFueShTdHJpbmcpIH0pOwogIH0pOwp9KTsK', 'base64'), 'UTF8'), true, 9),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/ApprovalsList.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgZmlyZUV2ZW50LCByZW5kZXIgfSBmcm9tICdAY29kZWFyZW5hL3Rlc3QtdXRpbHMnOwppbXBvcnQgeyBBcHByb3ZhbHNMaXN0LCBnZXRJdGVtTGF5b3V0IH0gZnJvbSAnLi4vc3JjL3NjcmVlbnMvQXBwcm92YWxzTGlzdCc7CmltcG9ydCB0eXBlIHsgQXBwcm92YWwgfSBmcm9tICcuLi9zcmMvdHlwZXMnOwoKY29uc3QgbWFrZSA9IChpZDogc3RyaW5nKTogQXBwcm92YWwgPT4gKHsKICBpZCwKICB0aXRsZTogJ0xhcHRvcHMgZm9yIHRoZSBQdW5lIG9mZmljZScsIC8vIHRoZSBzYW1lIG9uIGV2ZXJ5IHJvdzogcm93cyBhcmUgdG9sZCBhcGFydCBieSBpZAogIGFtb3VudE1pbm9yOiA1MDBfMDAwLAogIHVyZ2VudDogZmFsc2UsCiAgcmVxdWVzdGVkQnk6ICdNZWVyYScsCiAgc3RhdHVzOiAnUEVORElORycsCn0pOwpjb25zdCBbQSwgQiwgQ10gPSBbbWFrZSgnQScpLCBtYWtlKCdCJyksIG1ha2UoJ0MnKV07CgpkZXNjcmliZSgnQXBwcm92YWxzTGlzdCcsICgpID0+IHsKICBpdCgnc2Nyb2xsVG9JbmRleCBsYW5kcyBvbiB0aGUgcmlnaHQgcm93IChyb3dzIGFyZSBzZXBhcmF0ZWQgYnkgYSAxIHB0IGxpbmUpJywgKCkgPT4gewogICAgZXhwZWN0KGdldEl0ZW1MYXlvdXQoW10sIDApKS50b01hdGNoT2JqZWN0KHsgb2Zmc2V0OiAwLCBpbmRleDogMCB9KTsKICAgIC8vIFRoZSBkZXNpZ246IDcyIHB0IHJvd3Mgd2l0aCBhIDEgcHQgbGluZSBiZXR3ZWVuIHRoZW0uCiAgICBleHBlY3QoZ2V0SXRlbUxheW91dChbXSwgNykpLnRvTWF0Y2hPYmplY3QoeyBvZmZzZXQ6IDcgKiA3MywgaW5kZXg6IDcgfSk7CiAgICAvLyBBIGNlbGwncyBsZW5ndGggbWF5IG9yIG1heSBub3QgY291bnQgdGhlIHNlcGFyYXRvciBiZWxvdyBpdDogYm90aCBhcmUgY29ycmVjdC4KICAgIGZvciAoY29uc3QgaW5kZXggb2YgWzAsIDddKSB7CiAgICAgIGV4cGVjdChbNzIsIDczXSkudG9Db250YWluKGdldEl0ZW1MYXlvdXQoW10sIGluZGV4KS5sZW5ndGgpOwogICAgfQogIH0pOwoKICBpdCgna2VlcHMgdGhlIGV4cGFuZGVkIHJvdyBleHBhbmRlZCB3aGVuIGEgcm93IGFib3ZlIGl0IGRpc2FwcGVhcnMnLCAoKSA9PiB7CiAgICBjb25zdCBvbkRlY2lkZSA9IGplc3QuZm4oKTsKICAgIGNvbnN0IHsgZ2V0QnlUZXN0SWQsIHF1ZXJ5QnlUZXN0SWQsIHJlcmVuZGVyIH0gPSByZW5kZXIoPEFwcHJvdmFsc0xpc3QgaXRlbXM9e1tBLCBCLCBDXX0gb25EZWNpZGU9e29uRGVjaWRlfSAvPik7CiAgICBmaXJlRXZlbnQucHJlc3MoZ2V0QnlUZXN0SWQoJ3Jvdy1CLXRvZ2dsZScpKTsKICAgIGV4cGVjdChxdWVyeUJ5VGVzdElkKCdyb3ctQi1kZXRhaWxzJykpLm5vdC50b0JlTnVsbCgpOwoKICAgIHJlcmVuZGVyKDxBcHByb3ZhbHNMaXN0IGl0ZW1zPXtbQiwgQ119IG9uRGVjaWRlPXtvbkRlY2lkZX0gLz4pOyAvLyBBIHdhcyBhcHByb3ZlZCBlbHNld2hlcmUKICAgIGV4cGVjdChxdWVyeUJ5VGVzdElkKCdyb3ctQi1kZXRhaWxzJykpLm5vdC50b0JlTnVsbCgpOwogICAgZXhwZWN0KHF1ZXJ5QnlUZXN0SWQoJ3Jvdy1DLWRldGFpbHMnKSkudG9CZU51bGwoKTsKICB9KTsKCiAgaXQoImtlZXBzIGVhY2ggcm93J3MgY29tbWVudCB3aXRoIGl0cyBvd24gcm93IiwgKCkgPT4gewogICAgY29uc3Qgb25EZWNpZGUgPSBqZXN0LmZuKCk7CiAgICBjb25zdCB7IGdldEJ5VGVzdElkLCByZXJlbmRlciB9ID0gcmVuZGVyKDxBcHByb3ZhbHNMaXN0IGl0ZW1zPXtbQSwgQiwgQ119IG9uRGVjaWRlPXtvbkRlY2lkZX0gLz4pOwogICAgZmlyZUV2ZW50LnByZXNzKGdldEJ5VGVzdElkKCdyb3ctQi10b2dnbGUnKSk7CiAgICBmaXJlRXZlbnQuY2hhbmdlVGV4dChnZXRCeVRlc3RJZCgncm93LUItY29tbWVudCcpLCAnT3ZlciBidWRnZXQnKTsKCiAgICByZXJlbmRlcig8QXBwcm92YWxzTGlzdCBpdGVtcz17W0IsIENdfSBvbkRlY2lkZT17b25EZWNpZGV9IC8+KTsKICAgIGV4cGVjdChnZXRCeVRlc3RJZCgncm93LUItY29tbWVudCcpLnByb3BzLnZhbHVlKS50b0JlKCdPdmVyIGJ1ZGdldCcpOwogICAgZmlyZUV2ZW50LnByZXNzKGdldEJ5VGVzdElkKCdyb3ctQi1yZWplY3QnKSk7CiAgICBleHBlY3Qob25EZWNpZGUpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdCJywgJ1JFSkVDVEVEJywgJ092ZXIgYnVkZ2V0Jyk7CiAgfSk7Cn0pOwo=', 'base64'), 'UTF8'), true, 10),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', '__tests__/support/fakeServer.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgSHR0cEVycm9yLCB0eXBlIEZldGNoTGlrZSwgdHlwZSBUb2tlbnMgfSBmcm9tICcuLi8uLi9zcmMvdHlwZXMnOwoKLyoqCiAqIEEgZmFrZSBBUEkgc2VydmVyIGZvciB0aGUgSFRUUCBjbGllbnQgdGVzdHMuIEFjY2VzcyB0b2tlbnMgYXJlIGNoZWNrZWQgd2hlbiBhIHJlcXVlc3QgYXJyaXZlczsKICogcmVmcmVzaCB0b2tlbnMgcm90YXRlIG9uIGV2ZXJ5IHN1Y2Nlc3NmdWwgcmVmcmVzaCAodGhlIHByZXZpb3VzIHJlZnJlc2ggdG9rZW4gc3RvcHMgd29ya2luZykuCiAqLwpleHBvcnQgZnVuY3Rpb24gY3JlYXRlRmFrZVNlcnZlcihvcHRpb25zOiB7CiAgYmFzZVVybDogc3RyaW5nOwogIGFjY2Vzczogc3RyaW5nOwogIHJlZnJlc2g6IHN0cmluZzsKICByZWZyZXNoRmFpbHM/OiBib29sZWFuOwogIC8qKiBIb3cgbG9uZyBhIHJlZnJlc2ggdGFrZXMgKGEgc2xvdyBuZXR3b3JrIGNhbiB0YWtlIHNlY29uZHMpLiAqLwogIHJlZnJlc2hNcz86IG51bWJlcjsKICAvKiogUGF0aHMgdGhhdCBhbnN3ZXIgNDAxIGV2ZW4gd2l0aCBhIHZhbGlkIGFjY2VzcyB0b2tlbiAoZS5nLiBubyBwZXJtaXNzaW9uKS4gKi8KICBmb3JiaWRkZW4/OiBzdHJpbmdbXTsKfSkgewogIGxldCB2YWxpZDogVG9rZW5zID0geyBhY2Nlc3NUb2tlbjogb3B0aW9ucy5hY2Nlc3MsIHJlZnJlc2hUb2tlbjogb3B0aW9ucy5yZWZyZXNoIH07CiAgbGV0IGdlbmVyYXRpb24gPSAwOwogIGNvbnN0IGNhbGxzOiB7IHBhdGg6IHN0cmluZzsgYXV0aDogc3RyaW5nIHwgdW5kZWZpbmVkIH1bXSA9IFtdOwogIGNvbnN0IGhlbGQgPSBuZXcgTWFwPHN0cmluZywgQXJyYXk8KCkgPT4gdm9pZD4+KCk7CiAgY29uc3QgaG9sZGluZyA9IG5ldyBTZXQ8c3RyaW5nPigpOwoKICBjb25zdCByZWZyZXNoID0gamVzdC5mbihhc3luYyAocmVmcmVzaFRva2VuOiBzdHJpbmcpOiBQcm9taXNlPFRva2Vucz4gPT4gewogICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgb3B0aW9ucy5yZWZyZXNoTXMgPz8gNSkpOwogICAgaWYgKG9wdGlvbnMucmVmcmVzaEZhaWxzIHx8IHJlZnJlc2hUb2tlbiAhPT0gdmFsaWQucmVmcmVzaFRva2VuKSB7CiAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoNDAxLCAnaW52YWxpZF9ncmFudCcpOwogICAgfQogICAgZ2VuZXJhdGlvbiArPSAxOwogICAgdmFsaWQgPSB7IGFjY2Vzc1Rva2VuOiBgYWNjZXNzLSR7Z2VuZXJhdGlvbn1gLCByZWZyZXNoVG9rZW46IGByZWZyZXNoLSR7Z2VuZXJhdGlvbn1gIH07CiAgICByZXR1cm4geyAuLi52YWxpZCB9OwogIH0pOwoKICBjb25zdCBmZXRjaEltcGwgPSBqZXN0LmZuPEZldGNoTGlrZT4oYXN5bmMgKHVybCwgaW5pdCA9IHt9KSA9PiB7CiAgICBjb25zdCBwYXRoID0gdXJsLnJlcGxhY2Uob3B0aW9ucy5iYXNlVXJsLCAnJyk7CiAgICBjb25zdCBhdXRoID0gaW5pdC5oZWFkZXJzPy5BdXRob3JpemF0aW9uOwogICAgY2FsbHMucHVzaCh7IHBhdGgsIGF1dGggfSk7CiAgICBpZiAoY2FsbHMuZmlsdGVyKChjKSA9PiBjLnBhdGggPT09IHBhdGgpLmxlbmd0aCA+IDEwKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtwYXRofSB3YXMgcmVxdWVzdGVkIG1vcmUgdGhhbiAxMCB0aW1lcyAocmV0cnlpbmcgd2l0aG91dCBhIGxpbWl0PylgKTsKICAgIH0KICAgIGNvbnN0IGZvcmJpZGRlbiA9IG9wdGlvbnMuZm9yYmlkZGVuPy5pbmNsdWRlcyhwYXRoKSA/PyBmYWxzZTsKICAgIGNvbnN0IHN0YXR1cyA9ICFmb3JiaWRkZW4gJiYgYXV0aCA9PT0gYEJlYXJlciAke3ZhbGlkLmFjY2Vzc1Rva2VufWAgPyAyMDAgOiA0MDE7CiAgICBpZiAoaG9sZGluZy5oYXMocGF0aCkpIHsKICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IGhlbGQuc2V0KHBhdGgsIFsuLi4oaGVsZC5nZXQocGF0aCkgPz8gW10pLCByZXNvbHZlXSkpOwogICAgfQogICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMSkpOwogICAgcmV0dXJuIHsgc3RhdHVzLCBvazogc3RhdHVzID09PSAyMDAsIGpzb246IGFzeW5jICgpID0+ICh7IHBhdGggfSkgfTsKICB9KTsKCiAgcmV0dXJuIHsKICAgIGZldGNoSW1wbCwKICAgIHJlZnJlc2gsCiAgICBjYWxscywKICAgIC8qKiBEZWxheXMgcmVzcG9uc2VzIGZvciBgcGF0aGAgKHRoZSByZXF1ZXN0IGlzIGNoZWNrZWQgb24gYXJyaXZhbCkgdW50aWwgcmVsZWFzZShwYXRoKS4gKi8KICAgIGhvbGQ6IChwYXRoOiBzdHJpbmcpID0+IGhvbGRpbmcuYWRkKHBhdGgpLAogICAgcmVsZWFzZTogKHBhdGg6IHN0cmluZykgPT4gewogICAgICBob2xkaW5nLmRlbGV0ZShwYXRoKTsKICAgICAgaGVsZC5nZXQocGF0aCk/LmZvckVhY2goKHJlc29sdmUpID0+IHJlc29sdmUoKSk7CiAgICAgIGhlbGQuZGVsZXRlKHBhdGgpOwogICAgfSwKICAgIC8qKiBUaGUgY3VycmVudCBhY2Nlc3MgdG9rZW4gZXhwaXJlcyAodGhlIHJlZnJlc2ggdG9rZW4gc3RheXMgdmFsaWQpLiAqLwogICAgZXhwaXJlOiAoKSA9PiB7CiAgICAgIHZhbGlkID0geyAuLi52YWxpZCwgYWNjZXNzVG9rZW46IGBleHBpcmVkLSR7Z2VuZXJhdGlvbn1gIH07CiAgICB9LAogIH07Cn0KCi8qKgogKiBXaXRoIGZha2UgdGltZXJzOiBtb3ZlcyB0aW1lIGZvcndhcmQgaW4gc21hbGwgc3RlcHMgYW5kIGxldHMgcHJvbWlzZXMgc2V0dGxlIGluIGJldHdlZW4sIHNvCiAqIGNoYWlucyBvZiB0aW1lcnMgYW5kIGF3YWl0cyBydW4gYXMgdGhleSB3b3VsZCBpbiByZWFsIHRpbWUuCiAqLwpleHBvcnQgYXN5bmMgZnVuY3Rpb24gZWxhcHNlKG1zOiBudW1iZXIsIHN0ZXAgPSAxMDApIHsKICBmb3IgKGxldCB0ID0gMDsgdCA8IG1zOyB0ICs9IHN0ZXApIGF3YWl0IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZUFzeW5jKHN0ZXApOwp9Cg==', 'base64'), 'UTF8'), true, 11),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'package.json', 'json', convert_from(decode('ewogICJuYW1lIjogInp5Y3VzLWFwcHJvdmFscyIsCiAgInZlcnNpb24iOiAiNC4xMi4wIiwKICAicHJpdmF0ZSI6IHRydWUsCiAgInNjcmlwdHMiOiB7CiAgICAic3RhcnQiOiAicmVhY3QtbmF0aXZlIHN0YXJ0IiwKICAgICJ0ZXN0IjogImplc3QiCiAgfSwKICAiZGVwZW5kZW5jaWVzIjogewogICAgIkByZWFjdC1uYXRpdmUtYXN5bmMtc3RvcmFnZS9hc3luYy1zdG9yYWdlIjogIjIuMS4yIiwKICAgICJyZWFjdCI6ICIxOS4xLjAiLAogICAgInJlYWN0LW5hdGl2ZSI6ICIwLjgxLjQiCiAgfSwKICAiZGV2RGVwZW5kZW5jaWVzIjogewogICAgIkB0ZXN0aW5nLWxpYnJhcnkvcmVhY3QtbmF0aXZlIjogIjEzLjMuMyIsCiAgICAiamVzdCI6ICIyOS43LjAiLAogICAgInR5cGVzY3JpcHQiOiAiNS44LjMiCiAgfQp9Cg==', 'base64'), 'UTF8'), true, 12)
  on conflict (question_id, path) do update set language = excluded.language, content = excluded.content,
    readonly = excluded.readonly, sort_order = excluded.sort_order;
  delete from public.question_rubric_items where question_id = '9249d0ed-6c2c-4ea4-80f9-48645dbf737a' and key <> all (array['single_flight_refresh', 'abort_per_request', 'per_item_rollback', 'hydration', 'list_identity', 'code_quality']::text[]);
  insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'single_flight_refresh', 'Token refresh is single-flight', convert_from(decode('T25lIHNoYXJlZCByZWZyZXNoIHByb21pc2U7IGNvbmN1cnJlbnQgNDAxcyB3YWl0IGZvciBpdDsgYSByZXF1ZXN0IHNlbnQgYmVmb3JlIHRoZSByZWZyZXNoIHJldHJpZXMgd2l0aCB0aGUgY3VycmVudCB0b2tlbiB3aXRob3V0IHJlZnJlc2hpbmcgYWdhaW47IG9uTG9nb3V0IGZpcmVzIG9uY2Uu', 'base64'), 'UTF8'), 6, 0),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'abort_per_request', 'Each request gets its own AbortController', 'New controller per effect run, aborted in cleanup; aborted results ignored; no stuck spinner, no out-of-order overwrite.', 5, 1),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'per_item_rollback', 'Optimistic updates roll back per item', convert_from(decode('Um9sbHMgYmFjayBvbmx5IHRoZSBmYWlsZWQgcm93IHRvIGl0cyBwcmV2aW91cyBzdGF0dXMgd2l0aCBhbiBlcnJvcjsgb3RoZXIgcm93cycgc3VjY2Vzc2VzIGFyZSBrZXB0Lg==', 'base64'), 'UTF8'), 5, 2),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'hydration', 'Session hydration race fixed', convert_from(decode('UmVxdWVzdHMgYW5kIG11dGF0aW9ucyB3YWl0IGZvciB0aGUgc3RvcmVkIHNlc3Npb247IHN0YXJ0dXAgdG9rZW4gc2F2ZXMgYXJlbid0IGxvc3Qgb3Igb3ZlcndyaXR0ZW4u', 'base64'), 'UTF8'), 4, 3),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'list_identity', 'List identity and layout', 'keyExtractor and expanded state use item.id; getItemLayout includes the separator.', 3, 4),
    ('9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 'code_quality', 'Root-cause fixes, clean code', 'Fixes are minimal and well-reasoned; no test special-casing, sleeps or swallowed errors.', 2, 5)
  on conflict (question_id, key) do update set criterion = excluded.criterion,
    description = excluded.description, max_points = excluded.max_points, sort_order = excluded.sort_order;
  insert into public.question_solutions (question_id, notes_md, files) values (
    '9249d0ed-6c2c-4ea4-80f9-48645dbf737a', convert_from(decode('IyMjIFJlZmVyZW5jZSBub3RlcyAocmV2aWV3ZXJzIG9ubHkpCgoxLiAqKlRva2VuIHJlZnJlc2ggaXMgbm90IHNpbmdsZS1mbGlnaHQqKiAoYGFwaS9odHRwQ2xpZW50LnRzYCkuIEEgYm9vbGVhbiBgaXNSZWZyZXNoaW5nYCBmbGFnIGxldHMKICAgY29uY3VycmVudCA0MDFzIHJldHJ5IGltbWVkaWF0ZWx5IHdpdGggdGhlIG9sZCB0b2tlbiwgYW5kIGEgNDAxIGZvciBhIHJlcXVlc3Qgc2VudCBiZWZvcmUgYQogICByZWZyZXNoIGZpbmlzaGVkIHN0YXJ0cyBhIHNlY29uZCByZWZyZXNoIHdpdGggYW4gYWxyZWFkeS1yb3RhdGVkIHJlZnJlc2ggdG9rZW4sIHdoaWNoIGxvZ3MgdGhlCiAgIHVzZXIgb3V0LiBGaXg6IG9uZSBzaGFyZWQgYHJlZnJlc2hpbmdgIHByb21pc2UgdGhhdCBhbGwgNDAxcyBhd2FpdCAoY2xlYXJlZCBpbiBgZmluYWxseWAgYWZ0ZXIKICAgdGhlIHRva2VucyBhcmUgcGVyc2lzdGVkKSwgYG9uTG9nb3V0YCBjYWxsZWQgb25jZSBpbnNpZGUgaXQsIGF0IG1vc3Qgb25lIHJldHJ5IHBlciByZXF1ZXN0LCBhbmQKICAgImlmIHRoZSB0b2tlbiBjaGFuZ2VkIHNpbmNlIHRoaXMgcmVxdWVzdCB3YXMgc2VudCwganVzdCByZXRyeSB3aXRoIHRoZSBjdXJyZW50IHRva2VuIi4KMi4gKipBYm9ydENvbnRyb2xsZXIgcmV1c2VkKiogKGBob29rcy91c2VBcHByb3ZhbHMudHNgKS4gVGhlIGNvbnRyb2xsZXIgbGl2ZXMgaW4gYSByZWY7IHRoZSBlZmZlY3QKICAgY2xlYW51cCBhYm9ydHMgaXQgYW5kIGV2ZXJ5IGxhdGVyIHJlcXVlc3QgZ2V0cyBhbiBhbHJlYWR5LWFib3J0ZWQgc2lnbmFsLCBmYWlscyBpbnN0YW50bHkgYW5kCiAgIHRoZSBBYm9ydEVycm9yIGlzIHN3YWxsb3dlZCAoc3Bpbm5lciBmb3JldmVyKS4gRml4OiBuZXcgY29udHJvbGxlciBwZXIgZWZmZWN0IHJ1biwgYWJvcnQgaW4KICAgY2xlYW51cCwgaWdub3JlIHJlc3VsdHMvZXJyb3JzIG9mIGFib3J0ZWQgcmVxdWVzdHMgKGFsc28gZml4ZXMgb3V0LW9mLW9yZGVyIHJlc3BvbnNlcykuCjMuICoqT3B0aW1pc3RpYyByb2xsYmFjayByZXN0b3JlcyBhIHdob2xlLWxpc3Qgc25hcHNob3QqKiAoYHN0YXRlL2FwcHJvdmFscy50c2ApLCB1bmRvaW5nIG90aGVyCiAgIHJvd3MnIHN1Y2Nlc3NmdWwgZGVjaXNpb25zLCBhbmQgbmV2ZXIgcmVjb3JkcyB0aGUgZmFpbHVyZS4gRml4OiByZW1lbWJlciB0aGUgcm93J3MgcHJldmlvdXMKICAgc3RhdHVzIGFuZCBkaXNwYXRjaCBhIHBlci1yb3cgcm9sbGJhY2sgd2l0aCBhbiBlcnJvcjsgY29uZmlybSBvbiBzdWNjZXNzLgo0LiAqKkh5ZHJhdGlvbiByYWNlKiogKGBhdXRoL3Nlc3Npb25TdG9yZS50c2AgKyBjbGllbnQpLiBSZXF1ZXN0cyByZWFkIGBzZXNzaW9uLmdldCgpYCBiZWZvcmUKICAgc3RvcmFnZSB3YXMgcmVhZCAobm8gdG9rZW4pLCBhbmQgYHNhdmVUb2tlbnNgIGR1cmluZyBzdGFydHVwIGlzIGRyb3BwZWQgLyBvdmVyd3JpdHRlbi4gRml4OgogICBgYXdhaXQgcmVhZHlgIGluIHRoZSBjbGllbnQgYW5kIGluIGV2ZXJ5IG11dGF0aW9uLgo1LiAqKkZsYXRMaXN0IGJ5IGluZGV4KiogKGBzY3JlZW5zL0FwcHJvdmFsc0xpc3QudHN4YCkuIGBrZXlFeHRyYWN0b3JgIHJldHVybnMgdGhlIGluZGV4IGFuZCB0aGUKICAgZXhwYW5kZWQgcm93IGlzIHN0b3JlZCBieSBpbmRleCwgc28gc3RhdGUgbW92ZXMgdG8gYW5vdGhlciBpdGVtIHdoZW4gcm93cyBhYm92ZSBkaXNhcHBlYXI7CiAgIGBnZXRJdGVtTGF5b3V0YCBpZ25vcmVzIHRoZSBzZXBhcmF0b3IgaGVpZ2h0LiBGaXg6IGtleSBhbmQgdHJhY2sgYnkgYGl0ZW0uaWRgOyBvZmZzZXQKICAgYChST1dfSEVJR0hUICsgU0VQQVJBVE9SX0hFSUdIVCkgKiBpbmRleGAuCgoqKlNlbmlvciBzaWduYWxzOioqIHJlYXNvbnMgYWJvdXQgcm90YXRpb24gYW5kIGNvbmN1cnJlbmN5IHJhdGhlciB0aGFuIGFkZGluZyBkZWxheXM7IGV4cGxhaW5zIHdoeQpgaXNNb3VudGVkYC1zdHlsZSBmbGFncyBvciBhIGxvbmdlciBkZWJvdW5jZSBkb24ndCBmaXggIzI7IGtlZXBzIGBvbkxvZ291dGAgc2luZ2xlOyBub3RlcyB0aGF0CmBnZXRJdGVtTGF5b3V0YCBtdXN0IG1hdGNoIHRoZSByZW5kZXJlZCBsYXlvdXQgZXhhY3RseS4K', 'base64'), 'UTF8'), (convert_from(decode('W3sicGF0aCI6InNyYy9hcGkvaHR0cENsaWVudC50cyIsImNvbnRlbnQiOiJpbXBvcnQgdHlwZSB7IFNlc3Npb25TdG9yZSB9IGZyb20gJy4uL2F1dGgvc2Vzc2lvblN0b3JlJztcbmltcG9ydCB7IEh0dHBFcnJvciwgdHlwZSBGZXRjaExpa2UsIHR5cGUgVG9rZW5zIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEh0dHBDbGllbnRPcHRpb25zIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBmZXRjaEltcGw6IEZldGNoTGlrZTtcbiAgc2Vzc2lvbjogU2Vzc2lvblN0b3JlO1xuICAvKiogRXhjaGFuZ2VzIGEgcmVmcmVzaCB0b2tlbiBmb3IgbmV3IHRva2Vucy4gUmVmcmVzaCB0b2tlbnMgcm90YXRlIG9uIGV2ZXJ5IGNhbGwuICovXG4gIHJlZnJlc2g6IChyZWZyZXNoVG9rZW46IHN0cmluZykgPT4gUHJvbWlzZTxUb2tlbnM+O1xuICAvKiogQ2FsbGVkIHdoZW4gdGhlIHNlc3Npb24gY2FuJ3QgYmUgcmVjb3ZlcmVkOyB0aGUgYXBwIHJldHVybnMgdG8gdGhlIHNpZ24taW4gc2NyZWVuLiAqL1xuICBvbkxvZ291dDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0T3B0aW9ucyB7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xuICBib2R5PzogdW5rbm93bjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIdHRwQ2xpZW50IHtcbiAgZ2V0PFQ+KHBhdGg6IHN0cmluZywgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zKTogUHJvbWlzZTxUPjtcbiAgcG9zdDxUPihwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiBSZXF1ZXN0T3B0aW9ucyk6IFByb21pc2U8VD47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVIdHRwQ2xpZW50KG86IEh0dHBDbGllbnRPcHRpb25zKTogSHR0cENsaWVudCB7XG4gIC8vIEZJWDogYSBzaW5nbGUgaW4tZmxpZ2h0IHJlZnJlc2ggdGhhdCBldmVyeSA0MDEgYXdhaXRzIChhIGJvb2xlYW4gZmxhZyBsZXQgY29uY3VycmVudCByZXF1ZXN0c1xuICAvLyByZXRyeSB3aXRoIHRoZSBvbGQgdG9rZW4sIG9yIHN0YXJ0IHRoZWlyIG93biByZWZyZXNoIHdpdGggYW4gYWxyZWFkeS1yb3RhdGVkIHJlZnJlc2ggdG9rZW4pLlxuICBsZXQgcmVmcmVzaGluZzogUHJvbWlzZTxUb2tlbnM+IHwgbnVsbCA9IG51bGw7XG5cbiAgZnVuY3Rpb24gcmVmcmVzaE9uY2UocmVmcmVzaFRva2VuOiBzdHJpbmcpOiBQcm9taXNlPFRva2Vucz4ge1xuICAgIHJlZnJlc2hpbmcgPz89IChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBmcmVzaCA9IGF3YWl0IG8ucmVmcmVzaChyZWZyZXNoVG9rZW4pO1xuICAgICAgICBhd2FpdCBvLnNlc3Npb24uc2F2ZVRva2VucyhmcmVzaCk7IC8vIHBlcnNpc3RlZCBiZWZvcmUgYW55b25lIHJldHJpZXNcbiAgICAgICAgcmV0dXJuIGZyZXNoO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIG8ub25Mb2dvdXQoKTsgLy8gb25jZSwgaG93ZXZlciBtYW55IHJlcXVlc3RzIHdlcmUgd2FpdGluZ1xuICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKDQwMSwgJ1lvdXIgc2Vzc2lvbiBoYXMgZXhwaXJlZC4gU2lnbiBpbiBhZ2Fpbi4nKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHJlZnJlc2hpbmcgPSBudWxsO1xuICAgICAgfVxuICAgIH0pKCk7XG4gICAgcmV0dXJuIHJlZnJlc2hpbmc7XG4gIH1cblxuICBjb25zdCBzZW5kID0gKG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIG9wdGlvbnM6IFJlcXVlc3RPcHRpb25zLCBhY2Nlc3NUb2tlbj86IHN0cmluZykgPT5cbiAgICBvLmZldGNoSW1wbChvLmJhc2VVcmwgKyBwYXRoLCB7XG4gICAgICBtZXRob2QsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIC4uLihhY2Nlc3NUb2tlbiA/IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FjY2Vzc1Rva2VufWAgfSA6IHt9KSxcbiAgICAgIH0sXG4gICAgICBib2R5OiBvcHRpb25zLmJvZHkgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuYm9keSksXG4gICAgICBzaWduYWw6IG9wdGlvbnMuc2lnbmFsLFxuICAgIH0pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHJlcXVlc3Q8VD4obWV0aG9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgb3B0aW9uczogUmVxdWVzdE9wdGlvbnMpOiBQcm9taXNlPFQ+IHtcbiAgICAvLyBGSVg6IHdhaXQgZm9yIHRoZSBzdG9yZWQgc2Vzc2lvbiBvbiBjb2xkIHN0YXJ0ICh0aGUgZmlyc3QgcmVxdWVzdCB3ZW50IG91dCB3aXRob3V0IGEgdG9rZW4pLlxuICAgIGF3YWl0IG8uc2Vzc2lvbi5yZWFkeTtcbiAgICBjb25zdCBzZW50V2l0aCA9IG8uc2Vzc2lvbi5nZXQoKT8udG9rZW5zO1xuICAgIGxldCByZXMgPSBhd2FpdCBzZW5kKG1ldGhvZCwgcGF0aCwgb3B0aW9ucywgc2VudFdpdGg/LmFjY2Vzc1Rva2VuKTtcbiAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxICYmIHNlbnRXaXRoKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gby5zZXNzaW9uLmdldCgpPy50b2tlbnM7XG4gICAgICAvLyBGSVg6IGlmIGFub3RoZXIgcmVxdWVzdCBhbHJlYWR5IHJlZnJlc2hlZCBhZnRlciB0aGlzIG9uZSB3YXMgc2VudCwganVzdCByZXRyeSB3aXRoIHRoZSBuZXdcbiAgICAgIC8vIHRva2VuOyByZWZyZXNoaW5nIGFnYWluIHdvdWxkIHVzZSBhIHJvdGF0ZWQgKGRlYWQpIHJlZnJlc2ggdG9rZW4gYW5kIGxvZyB0aGUgdXNlciBvdXQuXG4gICAgICBjb25zdCB0b2tlbnMgPVxuICAgICAgICBjdXJyZW50ICYmIGN1cnJlbnQuYWNjZXNzVG9rZW4gIT09IHNlbnRXaXRoLmFjY2Vzc1Rva2VuID8gY3VycmVudCA6IGF3YWl0IHJlZnJlc2hPbmNlKHNlbnRXaXRoLnJlZnJlc2hUb2tlbik7XG4gICAgICByZXMgPSBhd2FpdCBzZW5kKG1ldGhvZCwgcGF0aCwgb3B0aW9ucywgdG9rZW5zLmFjY2Vzc1Rva2VuKTsgLy8gcmV0cmllZCBhdCBtb3N0IG9uY2VcbiAgICB9XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBIdHRwRXJyb3IocmVzLnN0YXR1cywgYFJlcXVlc3QgZmFpbGVkICgke3Jlcy5zdGF0dXN9KWApO1xuICAgIHJldHVybiAoYXdhaXQgcmVzLmpzb24oKSkgYXMgVDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZ2V0OiAocGF0aCwgb3B0aW9ucyA9IHt9KSA9PiByZXF1ZXN0KCdHRVQnLCBwYXRoLCBvcHRpb25zKSxcbiAgICBwb3N0OiAocGF0aCwgb3B0aW9ucyA9IHt9KSA9PiByZXF1ZXN0KCdQT1NUJywgcGF0aCwgb3B0aW9ucyksXG4gIH07XG59XG4ifSx7InBhdGgiOiJzcmMvYXV0aC9zZXNzaW9uU3RvcmUudHMiLCJjb250ZW50IjoiaW1wb3J0IEFzeW5jU3RvcmFnZSBmcm9tICdAcmVhY3QtbmF0aXZlLWFzeW5jLXN0b3JhZ2UvYXN5bmMtc3RvcmFnZSc7XG5pbXBvcnQgdHlwZSB7IFNlc3Npb24sIFRva2VucyB9IGZyb20gJy4uL3R5cGVzJztcblxuZXhwb3J0IGNvbnN0IFNFU1NJT05fS0VZID0gJ3Nlc3Npb24udjEnO1xuXG50eXBlIExpc3RlbmVyID0gKHNlc3Npb246IFNlc3Npb24gfCBudWxsKSA9PiB2b2lkO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25TdG9yZSB7XG4gIC8qKiBSZXNvbHZlcyBvbmNlIHRoZSBzYXZlZCBzZXNzaW9uIGhhcyBiZWVuIHJlYWQgZnJvbSBzdG9yYWdlLiAqL1xuICByZWFkeTogUHJvbWlzZTx2b2lkPjtcbiAgZ2V0KCk6IFNlc3Npb24gfCBudWxsO1xuICBzaWduSW4oc2Vzc2lvbjogU2Vzc2lvbik6IFByb21pc2U8dm9pZD47XG4gIC8qKiBTdG9yZXMgbmV3IHRva2VucyBhZnRlciBhIHJlZnJlc2ggKHJlZnJlc2ggdG9rZW5zIHJvdGF0ZTogdGhlIG9sZCBvbmUgc3RvcHMgd29ya2luZykuICovXG4gIHNhdmVUb2tlbnModG9rZW5zOiBUb2tlbnMpOiBQcm9taXNlPHZvaWQ+O1xuICBzaWduT3V0KCk6IFByb21pc2U8dm9pZD47XG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXIpOiAoKSA9PiB2b2lkO1xufVxuXG4vKiogVGhlIHNpZ25lZC1pbiBzZXNzaW9uLCBwZXJzaXN0ZWQgaW4gQXN5bmNTdG9yYWdlIHNvIHRoZSB1c2VyIHN0YXlzIHNpZ25lZCBpbiBhY3Jvc3MgbGF1bmNoZXMuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2Vzc2lvblN0b3JlKCk6IFNlc3Npb25TdG9yZSB7XG4gIGxldCBzZXNzaW9uOiBTZXNzaW9uIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IGxpc3RlbmVycyA9IG5ldyBTZXQ8TGlzdGVuZXI+KCk7XG4gIGNvbnN0IGVtaXQgPSAoKSA9PiBsaXN0ZW5lcnMuZm9yRWFjaCgobCkgPT4gbChzZXNzaW9uKSk7XG5cbiAgY29uc3QgcGVyc2lzdCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoc2Vzc2lvbikgYXdhaXQgQXN5bmNTdG9yYWdlLnNldEl0ZW0oU0VTU0lPTl9LRVksIEpTT04uc3RyaW5naWZ5KHNlc3Npb24pKTtcbiAgICBlbHNlIGF3YWl0IEFzeW5jU3RvcmFnZS5yZW1vdmVJdGVtKFNFU1NJT05fS0VZKTtcbiAgfTtcblxuICBjb25zdCByZWFkeSA9IEFzeW5jU3RvcmFnZS5nZXRJdGVtKFNFU1NJT05fS0VZKS50aGVuKChyYXcpID0+IHtcbiAgICB0cnkge1xuICAgICAgc2Vzc2lvbiA9IHJhdyA/IChKU09OLnBhcnNlKHJhdykgYXMgU2Vzc2lvbikgOiBudWxsO1xuICAgIH0gY2F0Y2gge1xuICAgICAgc2Vzc2lvbiA9IG51bGw7IC8vIGNvcnJ1cHQgZW50cnk6IHRyZWF0IGFzIHNpZ25lZCBvdXRcbiAgICB9XG4gICAgZW1pdCgpO1xuICB9KTtcblxuICAvLyBGSVg6IGV2ZXJ5IGNoYW5nZSB3YWl0cyBmb3IgaHlkcmF0aW9uIGZpcnN0LiBPdGhlcndpc2UgYSBjaGFuZ2UgbWFkZSBkdXJpbmcgc3RhcnR1cCBpcyBlaXRoZXJcbiAgLy8gZHJvcHBlZCAobm8gc2Vzc2lvbiB5ZXQpIG9yIG92ZXJ3cml0dGVuIHdoZW4gdGhlIHN0b3JlZCAob2xkZXIpIHNlc3Npb24gZmluaXNoZXMgbG9hZGluZy5cbiAgcmV0dXJuIHtcbiAgICByZWFkeSxcbiAgICBnZXQ6ICgpID0+IHNlc3Npb24sXG4gICAgYXN5bmMgc2lnbkluKG5leHQpIHtcbiAgICAgIGF3YWl0IHJlYWR5O1xuICAgICAgc2Vzc2lvbiA9IG5leHQ7XG4gICAgICBlbWl0KCk7XG4gICAgICBhd2FpdCBwZXJzaXN0KCk7XG4gICAgfSxcbiAgICBhc3luYyBzYXZlVG9rZW5zKHRva2Vucykge1xuICAgICAgYXdhaXQgcmVhZHk7XG4gICAgICBpZiAoIXNlc3Npb24pIHJldHVybjtcbiAgICAgIHNlc3Npb24gPSB7IC4uLnNlc3Npb24sIHRva2VucyB9O1xuICAgICAgZW1pdCgpO1xuICAgICAgYXdhaXQgcGVyc2lzdCgpO1xuICAgIH0sXG4gICAgYXN5bmMgc2lnbk91dCgpIHtcbiAgICAgIGF3YWl0IHJlYWR5O1xuICAgICAgc2Vzc2lvbiA9IG51bGw7XG4gICAgICBlbWl0KCk7XG4gICAgICBhd2FpdCBwZXJzaXN0KCk7XG4gICAgfSxcbiAgICBzdWJzY3JpYmUobGlzdGVuZXIpIHtcbiAgICAgIGxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICAgICAgcmV0dXJuICgpID0+IGxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICAgIH0sXG4gIH07XG59XG4ifSx7InBhdGgiOiJzcmMvaG9va3MvdXNlQXBwcm92YWxzLnRzIiwiY29udGVudCI6ImltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IEh0dHBDbGllbnQgfSBmcm9tICcuLi9hcGkvaHR0cENsaWVudCc7XG5pbXBvcnQgdHlwZSB7IEFwcHJvdmFsLCBGaWx0ZXIgfSBmcm9tICcuLi90eXBlcyc7XG5cbi8qKiBMb2FkcyB0aGUgYXBwcm92YWxzIGZvciB0aGUgc2VsZWN0ZWQgZmlsdGVyIGNoaXAgKEFsbCAvIFVyZ2VudCAvIE1pbmUpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUFwcHJvdmFscyhjbGllbnQ6IEh0dHBDbGllbnQsIGZpbHRlcjogRmlsdGVyKSB7XG4gIGNvbnN0IFtpdGVtcywgc2V0SXRlbXNdID0gdXNlU3RhdGU8QXBwcm92YWxbXT4oW10pO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIEZJWDogYSBuZXcgY29udHJvbGxlciBwZXIgcmVxdWVzdC4gQW4gQWJvcnRDb250cm9sbGVyIGNhbiBvbmx5IGFib3J0IG9uY2U6IHJldXNpbmcgdGhlIG9uZVxuICAgIC8vIGFib3J0ZWQgYnkgdGhlIHByZXZpb3VzIGNsZWFudXAgbWFkZSBldmVyeSBsYXRlciByZXF1ZXN0IGZhaWwgaW5zdGFudGx5IChzaWxlbnRseSBzd2FsbG93ZWQpLlxuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgc2V0TG9hZGluZyh0cnVlKTtcbiAgICBzZXRFcnJvcihudWxsKTtcbiAgICBjbGllbnRcbiAgICAgIC5nZXQ8QXBwcm92YWxbXT4oYC9hcHByb3ZhbHM/ZmlsdGVyPSR7ZmlsdGVyfWAsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgaWYgKGNvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQpIHJldHVybjsgLy8gYSBuZXdlciBmaWx0ZXIgaXMgc2VsZWN0ZWRcbiAgICAgICAgc2V0SXRlbXMoZGF0YSk7XG4gICAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZTogRXJyb3IpID0+IHtcbiAgICAgICAgaWYgKGNvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQgfHwgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHJldHVybjtcbiAgICAgICAgc2V0RXJyb3IoZS5tZXNzYWdlKTtcbiAgICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICB9KTtcbiAgICByZXR1cm4gKCkgPT4gY29udHJvbGxlci5hYm9ydCgpO1xuICB9LCBbY2xpZW50LCBmaWx0ZXJdKTtcblxuICByZXR1cm4geyBpdGVtcywgbG9hZGluZywgZXJyb3IgfTtcbn1cbiJ9LHsicGF0aCI6InNyYy9zdGF0ZS9hcHByb3ZhbHMudHMiLCJjb250ZW50IjoiaW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZVJlZHVjZXIsIHVzZVJlZiB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgSHR0cENsaWVudCB9IGZyb20gJy4uL2FwaS9odHRwQ2xpZW50JztcbmltcG9ydCB0eXBlIHsgQXBwcm92YWwsIERlY2lzaW9uIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgdHlwZSBBcHByb3ZhbHNBY3Rpb24gPVxuICB8IHsgdHlwZTogJ0xPQURFRCc7IGl0ZW1zOiBBcHByb3ZhbFtdIH1cbiAgfCB7IHR5cGU6ICdPUFRJTUlTVElDJzsgaWQ6IHN0cmluZzsgc3RhdHVzOiBBcHByb3ZhbFsnc3RhdHVzJ10gfVxuICB8IHsgdHlwZTogJ0NPTkZJUk1FRCc7IGlkOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ1JPTExCQUNLJzsgaWQ6IHN0cmluZzsgc3RhdHVzOiBBcHByb3ZhbFsnc3RhdHVzJ107IGVycm9yOiBzdHJpbmcgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcHJvdmFsc1JlZHVjZXIoc3RhdGU6IEFwcHJvdmFsW10sIGFjdGlvbjogQXBwcm92YWxzQWN0aW9uKTogQXBwcm92YWxbXSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdMT0FERUQnOlxuICAgICAgcmV0dXJuIGFjdGlvbi5pdGVtcztcbiAgICBjYXNlICdPUFRJTUlTVElDJzpcbiAgICAgIHJldHVybiBzdGF0ZS5tYXAoKGEpID0+IChhLmlkID09PSBhY3Rpb24uaWQgPyB7IC4uLmEsIHN0YXR1czogYWN0aW9uLnN0YXR1cywgZXJyb3I6IHVuZGVmaW5lZCB9IDogYSkpO1xuICAgIGNhc2UgJ0NPTkZJUk1FRCc6XG4gICAgICByZXR1cm4gc3RhdGUubWFwKChhKSA9PiAoYS5pZCA9PT0gYWN0aW9uLmlkID8geyAuLi5hLCBlcnJvcjogdW5kZWZpbmVkIH0gOiBhKSk7XG4gICAgY2FzZSAnUk9MTEJBQ0snOlxuICAgICAgcmV0dXJuIHN0YXRlLm1hcCgoYSkgPT4gKGEuaWQgPT09IGFjdGlvbi5pZCA/IHsgLi4uYSwgc3RhdHVzOiBhY3Rpb24uc3RhdHVzLCBlcnJvcjogYWN0aW9uLmVycm9yIH0gOiBhKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcHJvdmUgLyByZWplY3Qgd2l0aCBhbiBvcHRpbWlzdGljIHVwZGF0ZTogdGhlIHJvdyBjaGFuZ2VzIGltbWVkaWF0ZWx5IGFuZCBpcyBwdXQgYmFjayBpZiB0aGVcbiAqIHNlcnZlciBjYWxsIGZhaWxzLiBBcHByb3ZlcnMgb2Z0ZW4gYWN0aW9uIHNldmVyYWwgcm93cyBpbiBxdWljayBzdWNjZXNzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlQXBwcm92YWxEZWNpc2lvbnMoYXBpOiBQaWNrPEh0dHBDbGllbnQsICdwb3N0Jz4sIGluaXRpYWw6IEFwcHJvdmFsW10pIHtcbiAgY29uc3QgW2l0ZW1zLCBkaXNwYXRjaF0gPSB1c2VSZWR1Y2VyKGFwcHJvdmFsc1JlZHVjZXIsIGluaXRpYWwpO1xuICBjb25zdCBsYXRlc3QgPSB1c2VSZWYoaXRlbXMpO1xuICBsYXRlc3QuY3VycmVudCA9IGl0ZW1zO1xuXG4gIGNvbnN0IGRlY2lkZSA9IHVzZUNhbGxiYWNrKFxuICAgIGFzeW5jIChpZDogc3RyaW5nLCBkZWNpc2lvbjogRGVjaXNpb24pID0+IHtcbiAgICAgIC8vIEZJWDogcmVtZW1iZXIgb25seSB0aGlzIHJvdydzIHByZXZpb3VzIHN0YXR1cyBhbmQgcm9sbCBiYWNrIG9ubHkgdGhpcyByb3csIGFnYWluc3QgdGhlXG4gICAgICAvLyBjdXJyZW50IHN0YXRlLiBSZXN0b3JpbmcgYSB3aG9sZS1saXN0IHNuYXBzaG90IHVuZGlkIG90aGVyIHJvd3MnIChzdWNjZXNzZnVsKSBkZWNpc2lvbnMuXG4gICAgICBjb25zdCBwcmV2aW91cyA9IGxhdGVzdC5jdXJyZW50LmZpbmQoKGEpID0+IGEuaWQgPT09IGlkKT8uc3RhdHVzID8/ICdQRU5ESU5HJztcbiAgICAgIGRpc3BhdGNoKHsgdHlwZTogJ09QVElNSVNUSUMnLCBpZCwgc3RhdHVzOiBkZWNpc2lvbiB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGFwaS5wb3N0KGAvYXBwcm92YWxzLyR7aWR9LyR7ZGVjaXNpb24gPT09ICdBUFBST1ZFRCcgPyAnYXBwcm92ZScgOiAncmVqZWN0J31gKTtcbiAgICAgICAgZGlzcGF0Y2goeyB0eXBlOiAnQ09ORklSTUVEJywgaWQgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGRpc3BhdGNoKHsgdHlwZTogJ1JPTExCQUNLJywgaWQsIHN0YXR1czogcHJldmlvdXMsIGVycm9yOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiAnRmFpbGVkJyB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIFthcGldLFxuICApO1xuXG4gIHJldHVybiB7IGl0ZW1zLCBkZWNpZGUsIGxvYWQ6IChuZXh0OiBBcHByb3ZhbFtdKSA9PiBkaXNwYXRjaCh7IHR5cGU6ICdMT0FERUQnLCBpdGVtczogbmV4dCB9KSB9O1xufVxuIn0seyJwYXRoIjoic3JjL3NjcmVlbnMvQXBwcm92YWxzTGlzdC50c3giLCJjb250ZW50IjoiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgRmxhdExpc3QsIFByZXNzYWJsZSwgU3R5bGVTaGVldCwgVGV4dCwgVGV4dElucHV0LCBWaWV3IH0gZnJvbSAncmVhY3QtbmF0aXZlJztcbmltcG9ydCB0eXBlIHsgQXBwcm92YWwsIERlY2lzaW9uIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgY29uc3QgUk9XX0hFSUdIVCA9IDcyO1xuZXhwb3J0IGNvbnN0IFNFUEFSQVRPUl9IRUlHSFQgPSAxO1xuXG4vKiogTGV0cyBGbGF0TGlzdCBqdW1wIHN0cmFpZ2h0IHRvIGEgcm93IChkZWVwIGxpbmtzIGNhbGwgc2Nyb2xsVG9JbmRleCkuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXRlbUxheW91dChfZGF0YTogQXJyYXlMaWtlPEFwcHJvdmFsPiB8IG51bGwgfCB1bmRlZmluZWQsIGluZGV4OiBudW1iZXIpIHtcbiAgLy8gRklYOiBldmVyeSByb3cgYmVmb3JlIGBpbmRleGAgaXMgZm9sbG93ZWQgYnkgYSBzZXBhcmF0b3IuXG4gIHJldHVybiB7IGxlbmd0aDogUk9XX0hFSUdIVCwgb2Zmc2V0OiAoUk9XX0hFSUdIVCArIFNFUEFSQVRPUl9IRUlHSFQpICogaW5kZXgsIGluZGV4IH07XG59XG5cbmNvbnN0IHJ1cGVlcyA9IChtaW5vcjogbnVtYmVyKSA9PiBg4oK5JHsobWlub3IgLyAxMDApLnRvRml4ZWQoMil9YDtcblxuZnVuY3Rpb24gQXBwcm92YWxSb3coe1xuICBpdGVtLFxuICBleHBhbmRlZCxcbiAgb25Ub2dnbGUsXG4gIG9uRGVjaWRlLFxufToge1xuICBpdGVtOiBBcHByb3ZhbDtcbiAgZXhwYW5kZWQ6IGJvb2xlYW47XG4gIG9uVG9nZ2xlOiAoKSA9PiB2b2lkO1xuICBvbkRlY2lkZTogKGlkOiBzdHJpbmcsIGRlY2lzaW9uOiBEZWNpc2lvbiwgY29tbWVudDogc3RyaW5nKSA9PiB2b2lkO1xufSkge1xuICBjb25zdCBbY29tbWVudCwgc2V0Q29tbWVudF0gPSB1c2VTdGF0ZSgnJyk7XG4gIHJldHVybiAoXG4gICAgPFZpZXcgc3R5bGU9e3N0eWxlcy5yb3d9IHRlc3RJRD17YHJvdy0ke2l0ZW0uaWR9YH0+XG4gICAgICA8UHJlc3NhYmxlIHRlc3RJRD17YHJvdy0ke2l0ZW0uaWR9LXRvZ2dsZWB9IG9uUHJlc3M9e29uVG9nZ2xlfT5cbiAgICAgICAgPFRleHQgc3R5bGU9e3N0eWxlcy50aXRsZX0+e2l0ZW0udGl0bGV9PC9UZXh0PlxuICAgICAgICA8VGV4dD57cnVwZWVzKGl0ZW0uYW1vdW50TWlub3IpfTwvVGV4dD5cbiAgICAgIDwvUHJlc3NhYmxlPlxuICAgICAge2V4cGFuZGVkICYmIChcbiAgICAgICAgPFZpZXcgdGVzdElEPXtgcm93LSR7aXRlbS5pZH0tZGV0YWlsc2B9PlxuICAgICAgICAgIDxUZXh0PlJlcXVlc3RlZCBieSB7aXRlbS5yZXF1ZXN0ZWRCeX08L1RleHQ+XG4gICAgICAgICAgPFRleHRJbnB1dFxuICAgICAgICAgICAgdGVzdElEPXtgcm93LSR7aXRlbS5pZH0tY29tbWVudGB9XG4gICAgICAgICAgICB2YWx1ZT17Y29tbWVudH1cbiAgICAgICAgICAgIG9uQ2hhbmdlVGV4dD17c2V0Q29tbWVudH1cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiQ29tbWVudCAocmVxdWlyZWQgdG8gcmVqZWN0KVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8UHJlc3NhYmxlIHRlc3RJRD17YHJvdy0ke2l0ZW0uaWR9LWFwcHJvdmVgfSBvblByZXNzPXsoKSA9PiBvbkRlY2lkZShpdGVtLmlkLCAnQVBQUk9WRUQnLCBjb21tZW50KX0+XG4gICAgICAgICAgICA8VGV4dD5BcHByb3ZlPC9UZXh0PlxuICAgICAgICAgIDwvUHJlc3NhYmxlPlxuICAgICAgICAgIDxQcmVzc2FibGVcbiAgICAgICAgICAgIHRlc3RJRD17YHJvdy0ke2l0ZW0uaWR9LXJlamVjdGB9XG4gICAgICAgICAgICBkaXNhYmxlZD17Y29tbWVudC50cmltKCkgPT09ICcnfVxuICAgICAgICAgICAgb25QcmVzcz17KCkgPT4gb25EZWNpZGUoaXRlbS5pZCwgJ1JFSkVDVEVEJywgY29tbWVudCl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFRleHQ+UmVqZWN0PC9UZXh0PlxuICAgICAgICAgIDwvUHJlc3NhYmxlPlxuICAgICAgICA8L1ZpZXc+XG4gICAgICApfVxuICAgIDwvVmlldz5cbiAgKTtcbn1cblxuY29uc3QgU2VwYXJhdG9yID0gKCkgPT4gPFZpZXcgc3R5bGU9e3N0eWxlcy5zZXBhcmF0b3J9IC8+O1xuXG5leHBvcnQgZnVuY3Rpb24gQXBwcm92YWxzTGlzdCh7XG4gIGl0ZW1zLFxuICBvbkRlY2lkZSxcbn06IHtcbiAgaXRlbXM6IEFwcHJvdmFsW107XG4gIG9uRGVjaWRlOiAoaWQ6IHN0cmluZywgZGVjaXNpb246IERlY2lzaW9uLCBjb21tZW50OiBzdHJpbmcpID0+IHZvaWQ7XG59KSB7XG4gIC8vIEZJWDogdHJhY2sgdGhlIGV4cGFuZGVkIHJvdyBieSBpZCBhbmQga2V5IHJvd3MgYnkgaWQuIEluZGV4LWJhc2VkIHN0YXRlIGFuZCBrZXlzIG1vdmUgdG8gYVxuICAvLyBkaWZmZXJlbnQgaXRlbSB3aGVuIHJvd3MgYWJvdmUgYXJlIHJlbW92ZWQgKGFuZCBlYWNoIHJvdydzIGxvY2FsIGNvbW1lbnQgbW92ZXMgd2l0aCB0aGVtKS5cbiAgY29uc3QgW2V4cGFuZGVkLCBzZXRFeHBhbmRlZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgcmV0dXJuIChcbiAgICA8RmxhdExpc3RcbiAgICAgIHRlc3RJRD1cImFwcHJvdmFsc1wiXG4gICAgICBkYXRhPXtpdGVtc31cbiAgICAgIGtleUV4dHJhY3Rvcj17KGl0ZW0pID0+IGl0ZW0uaWR9XG4gICAgICBnZXRJdGVtTGF5b3V0PXtnZXRJdGVtTGF5b3V0fVxuICAgICAgSXRlbVNlcGFyYXRvckNvbXBvbmVudD17U2VwYXJhdG9yfVxuICAgICAgcmVuZGVySXRlbT17KHsgaXRlbSB9KSA9PiAoXG4gICAgICAgIDxBcHByb3ZhbFJvd1xuICAgICAgICAgIGl0ZW09e2l0ZW19XG4gICAgICAgICAgZXhwYW5kZWQ9e2V4cGFuZGVkID09PSBpdGVtLmlkfVxuICAgICAgICAgIG9uVG9nZ2xlPXsoKSA9PiBzZXRFeHBhbmRlZCgoY3VyKSA9PiAoY3VyID09PSBpdGVtLmlkID8gbnVsbCA6IGl0ZW0uaWQpKX1cbiAgICAgICAgICBvbkRlY2lkZT17b25EZWNpZGV9XG4gICAgICAgIC8+XG4gICAgICApfVxuICAgIC8+XG4gICk7XG59XG5cbmNvbnN0IHN0eWxlcyA9IFN0eWxlU2hlZXQuY3JlYXRlKHtcbiAgcm93OiB7IG1pbkhlaWdodDogUk9XX0hFSUdIVCwgcGFkZGluZ0hvcml6b250YWw6IDE2LCBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicgfSxcbiAgdGl0bGU6IHsgZm9udFdlaWdodDogJzYwMCcgfSxcbiAgc2VwYXJhdG9yOiB7IGhlaWdodDogU0VQQVJBVE9SX0hFSUdIVCwgYmFja2dyb3VuZENvbG9yOiAnI0UyRThGMCcgfSxcbn0pO1xuIn1d', 'base64'), 'UTF8'))::jsonb
  ) on conflict (question_id) do update set notes_md = excluded.notes_md, files = excluded.files;
  if v_installed is null then
    raise notice 'Question "rn-approvals-inbox": installed (version 3)';
  else
    raise notice 'Question "rn-approvals-inbox": updated from version % to 3', v_installed;
  end if;
end
$question$;

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- Question "Live Reverse Auction: timers, listeners and rendering (React Native)". Safe to re-run: what is already installed and up to date is left untouched.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Question: rn-live-auction (version 3)
do $question$
declare
  v_installed int;
begin
  select version into v_installed from public.questions where id = 'a7dcbe6c-f122-4051-8368-41c2659815d7';
  if v_installed >= 3 then
    raise notice 'Question "rn-live-auction": version % installed, left unchanged', v_installed;
    return;
  end if;
  insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status, version) values (
    'a7dcbe6c-f122-4051-8368-41c2659815d7', 'rn-live-auction', 'Live Reverse Auction: timers, listeners and rendering (React Native)', 'React Native debugging', array['lead-react-native-developer', 'react-native-developer']::text[], array['react-native', 'timers', 'app-state', 'navigation', 'performance', 'money']::text[], 'hard', 35,
    convert_from(decode('IyMgTGl2ZSBSZXZlcnNlIEF1Y3Rpb246IHRoZSBmaW5hbCBtaW51dGVzIGFyZSBicm9rZW4KClN1cHBsaWVycyB1c2UgdGhpcyBzY3JlZW4gb2YgdGhlIFp5Y3VzIGVTb3VyY2luZyBhcHAgdG8gYmlkIGluICoqcmV2ZXJzZSBhdWN0aW9ucyoqICh0aGUgbG93ZXN0CmJpZCB3aW5zKS4gVGhlIGF1Y3Rpb24gKiphdXRvLWV4dGVuZHMgYnkgMiBtaW51dGVzKiogd2hlbiBhIGJpZCBsYW5kcyBpbiBpdHMgZmluYWwgbWludXRlLCBzbyB0aGUKY2xvc2luZyB0aW1lIGNhbiBjaGFuZ2Ugd2hpbGUgdGhlIHNjcmVlbiBpcyBvcGVuLgoKIyMjIEJ1ZyByZXBvcnRzCgoxLiAqKiJJdCBzYWlkICpBdWN0aW9uIGNsb3NlZCogd2hpbGUgdGhlIGF1Y3Rpb24gd2FzIHN0aWxsIHJ1bm5pbmcuIioqIFRoaXMgaGFwcGVucyBhZnRlciBhbgogICBleHRlbnNpb24sIGFuZCB3aGVuIHN1cHBsaWVycyBjb21lIGJhY2sgdG8gdGhlIGFwcCBhZnRlciBhIGZldyBtaW51dGVzIGluIHRoZSBiYWNrZ3JvdW5kICh0aGUKICAgY291bnRkb3duIHRoZW4gc2hvd3MgKm1vcmUqIHRpbWUgdGhhbiBpcyByZWFsbHkgbGVmdCBhbmQgdGhlIHNlcnZlciByZWplY3RzIHRoZSBiaWQpLgoyLiAqKiJFdmVyeSBiaWQgc2hvd3MgdXAgdHdvIG9yIHRocmVlIHRpbWVzIGluIHRoZSB0aWNrZXIuIioqIEl0IGdldHMgd29yc2UgZWFjaCB0aW1lIHRoZSBzdXBwbGllcgogICBzd2l0Y2hlcyB0YWJzIGFuZCBjb21lcyBiYWNrOyB0aGUgYm9hcmQgYWxzbyBrZWVwcyB1cGRhdGluZyB3aGlsZSB0aGUgc2NyZWVuIGlzbid0IHZpc2libGUuCiAgIFJldHVybmluZyBmcm9tIHRoZSBiYWNrZ3JvdW5kIHRyaWdnZXJzIHNldmVyYWwgcmVzeW5jcyBpbnN0ZWFkIG9mIG9uZS4KMy4gKioiVGhlIGJvYXJkIHN0dXR0ZXJzIGluIHRoZSBsYXN0IG1pbnV0ZSBvbiBtaWQtcmFuZ2UgQW5kcm9pZCBwaG9uZXMuIioqIFByb2ZpbGluZyBzaG93cyBldmVyeQogICByb3cgb2YgdGhlIGJvYXJkIHJlLXJlbmRlcmluZyBvbiBldmVyeSBjb3VudGRvd24gdGljayAoYm9hcmRzIHJlYWNoIDMwMCsgYmlkcykuCjQuICoqIk15IHZhbGlkIGJpZCB3YXMgcmVqZWN0ZWQuIioqIEJlc3QgYmlkIOKCuTEsMDAwLjA1LCBtaW5pbXVtIGRlY3JlbWVudCDigrkwLjEwOiBhIGJpZCBvZgogICDigrk5OTkuOTUgY2FuJ3QgYmUgcGxhY2VkLiBBbW91bnRzIGFyZSBhbHNvIHNob3duIGFzICrigrkxMjM0NTY3LjUwKiBpbnN0ZWFkIG9mICrigrkxMiwzNCw1NjcuNTAqLgoKIyMjIFdoYXQgdG8gZG8KCi0gRml4IHRoZSAqKnJvb3QgY2F1c2VzKiogaW4gYHNyYy9gLiBUaGUgcm93cyBhcmUgaW5zdHJ1bWVudGVkIHdpdGggYHRyYWNrUmVuZGVyKClgIGZvciB0aGUKICBwZXJmb3JtYW5jZSB0ZXN0czoga2VlcCB0aG9zZSBjYWxscy4KLSBgX190ZXN0c19fL2AgaXMgKipyZWFkLW9ubHkqKiBhbmQgZGVzY3JpYmVzIHRoZSBleHBlY3RlZCBiZWhhdmlvdXI7IHVzZSAqKlJ1biB0ZXN0cyoqLgotIERvbid0IHNwZWNpYWwtY2FzZSB0aGUgdGVzdHM6IHJldmlld2VycyByZWFkIHlvdXIgY2hhbmdlcyBhbmQgcnVuIG1vcmUgdGVzdHMuCgoqVGltZSBndWlkZTogYWJvdXQgMzUgbWludXRlcy4qCg==', 'base64'), 'UTF8'),
    false, 'published', 3
  ) on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, category = excluded.category,
    role_tags = excluded.role_tags, skill_tags = excluded.skill_tags, difficulty = excluded.difficulty,
    time_suggestion_minutes = excluded.time_suggestion_minutes, statement_md = excluded.statement_md,
    is_sample = excluded.is_sample, status = excluded.status, version = excluded.version;
  delete from public.question_files where question_id = 'a7dcbe6c-f122-4051-8368-41c2659815d7' and path <> all (array['src/screens/AuctionScreen.tsx', 'src/components/BidBoard.tsx', 'src/hooks/useCountdown.ts', 'src/hooks/useAuctionListeners.ts', 'src/utils/money.ts', 'src/realtime/auctionSocket.ts', 'src/debug/renderCounter.ts', 'src/types.ts', '__tests__/useCountdown.test.ts', '__tests__/listeners.test.ts', '__tests__/BidBoard.test.tsx', '__tests__/money.test.ts', 'package.json']::text[]);
  insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/screens/AuctionScreen.tsx', 'typescript', convert_from(decode('aW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnOwppbXBvcnQgeyBQcmVzc2FibGUsIFRleHQsIFRleHRJbnB1dCwgVmlldyB9IGZyb20gJ3JlYWN0LW5hdGl2ZSc7CmltcG9ydCB7IEJpZEJvYXJkIH0gZnJvbSAnLi4vY29tcG9uZW50cy9CaWRCb2FyZCc7CmltcG9ydCB7IGZvcm1hdFJlbWFpbmluZywgdXNlQ291bnRkb3duIH0gZnJvbSAnLi4vaG9va3MvdXNlQ291bnRkb3duJzsKaW1wb3J0IHsgdXNlQmlkRmVlZCwgdXNlT25Gb3JlZ3JvdW5kIH0gZnJvbSAnLi4vaG9va3MvdXNlQXVjdGlvbkxpc3RlbmVycyc7CmltcG9ydCB0eXBlIHsgQXVjdGlvblNvY2tldCB9IGZyb20gJy4uL3JlYWx0aW1lL2F1Y3Rpb25Tb2NrZXQnOwppbXBvcnQgdHlwZSB7IEJpZCB9IGZyb20gJy4uL3R5cGVzJzsKaW1wb3J0IHsgZm9ybWF0UnVwZWVzLCBpc1ZhbGlkQmlkLCBwYXJzZVJ1cGVlcyB9IGZyb20gJy4uL3V0aWxzL21vbmV5JzsKCi8qKiBNaW5pbXVtIGFtb3VudCAocnVwZWVzKSBhIG5ldyBiaWQgbXVzdCB1bmRlcmN1dCB0aGUgYmVzdCBiaWQgYnkuICovCmV4cG9ydCBjb25zdCBNSU5fREVDUkVNRU5UID0gMC4xOwoKZXhwb3J0IGZ1bmN0aW9uIEF1Y3Rpb25TY3JlZW4oewogIHNvY2tldCwKICBpbml0aWFsQmlkcywKICBjbG9zZXNBdCwKICBvblBsYWNlQmlkLAogIG9uUmVzeW5jLAp9OiB7CiAgc29ja2V0OiBBdWN0aW9uU29ja2V0OwogIGluaXRpYWxCaWRzOiBCaWRbXTsKICBjbG9zZXNBdDogbnVtYmVyOwogIG9uUGxhY2VCaWQ6IChhbW91bnRNaW5vcjogbnVtYmVyKSA9PiB2b2lkOwogIG9uUmVzeW5jOiAoKSA9PiB2b2lkOwp9KSB7CiAgY29uc3QgW2JpZHMsIHNldEJpZHNdID0gdXNlU3RhdGUoaW5pdGlhbEJpZHMpOwogIGNvbnN0IFtzZWxlY3RlZElkLCBzZXRTZWxlY3RlZElkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpOwogIGNvbnN0IFtpbnB1dCwgc2V0SW5wdXRdID0gdXNlU3RhdGUoJycpOwogIGNvbnN0IHsgcmVtYWluaW5nLCBjbG9zZWQgfSA9IHVzZUNvdW50ZG93bihjbG9zZXNBdCk7CgogIHVzZUJpZEZlZWQoc29ja2V0LCAoYmlkKSA9PiBzZXRCaWRzKChjdXJyZW50KSA9PiBbLi4uY3VycmVudCwgYmlkXS5zb3J0KChhLCBiKSA9PiBhLmFtb3VudE1pbm9yIC0gYi5hbW91bnRNaW5vcikpKTsKICB1c2VPbkZvcmVncm91bmQob25SZXN5bmMpOwoKICBjb25zdCBiZXN0ID0gYmlkcy5sZW5ndGggPyBiaWRzWzBdIS5hbW91bnRNaW5vciAvIDEwMCA6IEluZmluaXR5OwogIGNvbnN0IGFtb3VudCA9IHBhcnNlUnVwZWVzKGlucHV0KTsKICBjb25zdCBjYW5CaWQgPSAhY2xvc2VkICYmIGFtb3VudCAhPT0gbnVsbCAmJiBpc1ZhbGlkQmlkKGFtb3VudCwgYmVzdCwgTUlOX0RFQ1JFTUVOVCk7CgogIHJldHVybiAoCiAgICA8Vmlldz4KICAgICAgPFRleHQgdGVzdElEPSJjb3VudGRvd24iPntjbG9zZWQgPyAnQXVjdGlvbiBjbG9zZWQnIDogZm9ybWF0UmVtYWluaW5nKHJlbWFpbmluZyl9PC9UZXh0PgogICAgICA8VGV4dCB0ZXN0SUQ9ImJlc3QiPntOdW1iZXIuaXNGaW5pdGUoYmVzdCkgPyBmb3JtYXRSdXBlZXMoYmVzdCkgOiAn4oCUJ308L1RleHQ+CiAgICAgIDxCaWRCb2FyZCBiaWRzPXtiaWRzfSBzZWxlY3RlZElkPXtzZWxlY3RlZElkfSBvblNlbGVjdD17KGlkKSA9PiBzZXRTZWxlY3RlZElkKGlkKX0gLz4KICAgICAgPFRleHRJbnB1dCB0ZXN0SUQ9ImFtb3VudCIgdmFsdWU9e2lucHV0fSBvbkNoYW5nZVRleHQ9e3NldElucHV0fSBrZXlib2FyZFR5cGU9ImRlY2ltYWwtcGFkIiAvPgogICAgICA8UHJlc3NhYmxlCiAgICAgICAgdGVzdElEPSJwbGFjZS1iaWQiCiAgICAgICAgZGlzYWJsZWQ9eyFjYW5CaWR9CiAgICAgICAgb25QcmVzcz17KCkgPT4gYW1vdW50ICE9PSBudWxsICYmIG9uUGxhY2VCaWQoTWF0aC5yb3VuZChhbW91bnQgKiAxMDApKX0KICAgICAgPgogICAgICAgIDxUZXh0PlBsYWNlIGJpZDwvVGV4dD4KICAgICAgPC9QcmVzc2FibGU+CiAgICA8L1ZpZXc+CiAgKTsKfQo=', 'base64'), 'UTF8'), false, 0),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/components/BidBoard.tsx', 'typescript', convert_from(decode('aW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgRmxhdExpc3QsIFByZXNzYWJsZSwgU3R5bGVTaGVldCwgVGV4dCwgdHlwZSBWaWV3U3R5bGUgfSBmcm9tICdyZWFjdC1uYXRpdmUnOwppbXBvcnQgeyB0cmFja1JlbmRlciB9IGZyb20gJy4uL2RlYnVnL3JlbmRlckNvdW50ZXInOwppbXBvcnQgdHlwZSB7IEJpZCB9IGZyb20gJy4uL3R5cGVzJzsKaW1wb3J0IHsgZm9ybWF0UnVwZWVzIH0gZnJvbSAnLi4vdXRpbHMvbW9uZXknOwoKaW50ZXJmYWNlIEJpZFJvd1Byb3BzIHsKICBiaWQ6IEJpZDsKICByYW5rOiBudW1iZXI7CiAgc2VsZWN0ZWQ6IGJvb2xlYW47CiAgb25QcmVzczogKCkgPT4gdm9pZDsKICBzdHlsZTogVmlld1N0eWxlOwp9CgovKiogT25lIHJvdyBvZiB0aGUgbGVhZGVyYm9hcmQuIE1lbW9pc2VkOiB0aGUgYm9hcmQgY2FuIGhvbGQgMzAwKyBiaWRzIGluIHRoZSBmaW5hbCBtaW51dGVzLiAqLwpleHBvcnQgY29uc3QgQmlkUm93ID0gUmVhY3QubWVtbyhmdW5jdGlvbiBCaWRSb3coeyBiaWQsIHJhbmssIHNlbGVjdGVkLCBvblByZXNzLCBzdHlsZSB9OiBCaWRSb3dQcm9wcykgewogIHRyYWNrUmVuZGVyKGBCaWRSb3c6JHtiaWQuaWR9YCk7CiAgcmV0dXJuICgKICAgIDxQcmVzc2FibGUgdGVzdElEPXtgYmlkLSR7YmlkLmlkfWB9IG9uUHJlc3M9e29uUHJlc3N9IHN0eWxlPXtbc3R5bGVzLnJvdywgc3R5bGVdfT4KICAgICAgPFRleHQ+I3tyYW5rfTwvVGV4dD4KICAgICAgPFRleHQgc3R5bGU9e3N0eWxlcy5zdXBwbGllcn0+e2JpZC5zdXBwbGllcn08L1RleHQ+CiAgICAgIDxUZXh0IHRlc3RJRD17YGJpZC0ke2JpZC5pZH0tYW1vdW50YH0+e2Zvcm1hdFJ1cGVlcyhiaWQuYW1vdW50TWlub3IgLyAxMDApfTwvVGV4dD4KICAgICAge3NlbGVjdGVkICYmIDxUZXh0IHRlc3RJRD17YGJpZC0ke2JpZC5pZH0tc2VsZWN0ZWRgfT5TZWxlY3RlZDwvVGV4dD59CiAgICA8L1ByZXNzYWJsZT4KICApOwp9KTsKCmV4cG9ydCBmdW5jdGlvbiBCaWRCb2FyZCh7CiAgYmlkcywKICBzZWxlY3RlZElkLAogIG9uU2VsZWN0LAp9OiB7CiAgYmlkczogQmlkW107CiAgc2VsZWN0ZWRJZDogc3RyaW5nIHwgbnVsbDsKICBvblNlbGVjdDogKGlkOiBzdHJpbmcpID0+IHZvaWQ7Cn0pIHsKICByZXR1cm4gKAogICAgPEZsYXRMaXN0CiAgICAgIHRlc3RJRD0iYmlkLWJvYXJkIgogICAgICBkYXRhPXtiaWRzfQogICAgICBrZXlFeHRyYWN0b3I9eyhiKSA9PiBiLmlkfQogICAgICByZW5kZXJJdGVtPXsoeyBpdGVtLCBpbmRleCB9KSA9PiAoCiAgICAgICAgPEJpZFJvdwogICAgICAgICAgYmlkPXtpdGVtfQogICAgICAgICAgcmFuaz17aW5kZXggKyAxfQogICAgICAgICAgc2VsZWN0ZWQ9e2l0ZW0uaWQgPT09IHNlbGVjdGVkSWR9CiAgICAgICAgICBvblByZXNzPXsoKSA9PiBvblNlbGVjdChpdGVtLmlkKX0KICAgICAgICAgIHN0eWxlPXt7IG9wYWNpdHk6IGl0ZW0uaWQgPT09IHNlbGVjdGVkSWQgPyAxIDogMC45IH19CiAgICAgICAgLz4KICAgICAgKX0KICAgIC8+CiAgKTsKfQoKY29uc3Qgc3R5bGVzID0gU3R5bGVTaGVldC5jcmVhdGUoewogIHJvdzogeyBmbGV4RGlyZWN0aW9uOiAncm93JywgcGFkZGluZ1ZlcnRpY2FsOiAxMCwgcGFkZGluZ0hvcml6b250YWw6IDE2IH0sCiAgc3VwcGxpZXI6IHsgZmxleDogMSwgbWFyZ2luSG9yaXpvbnRhbDogOCB9LAp9KTsK', 'base64'), 'UTF8'), false, 1),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/hooks/useCountdown.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JzsKCi8qKiBUaW1lIGxlZnQgdW50aWwgdGhlIGF1Y3Rpb24gY2xvc2VzLCB1cGRhdGVkIGV2ZXJ5IHNlY29uZC4gKi8KZXhwb3J0IGZ1bmN0aW9uIHVzZUNvdW50ZG93bihjbG9zZXNBdDogbnVtYmVyKSB7CiAgY29uc3QgW3JlbWFpbmluZywgc2V0UmVtYWluaW5nXSA9IHVzZVN0YXRlKCgpID0+IE1hdGgubWF4KDAsIGNsb3Nlc0F0IC0gRGF0ZS5ub3coKSkpOwoKICB1c2VFZmZlY3QoKCkgPT4gewogICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7CiAgICAgIHNldFJlbWFpbmluZygocikgPT4gTWF0aC5tYXgoMCwgciAtIDEwMDApKTsKICAgIH0sIDEwMDApOwogICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaWQpOwogIH0sIFtdKTsKCiAgcmV0dXJuIHsgcmVtYWluaW5nLCBjbG9zZWQ6IHJlbWFpbmluZyA9PT0gMCB9Owp9CgpleHBvcnQgZnVuY3Rpb24gZm9ybWF0UmVtYWluaW5nKG1zOiBudW1iZXIpOiBzdHJpbmcgewogIGNvbnN0IHMgPSBNYXRoLmNlaWwobXMgLyAxMDAwKTsKICByZXR1cm4gYCR7TWF0aC5mbG9vcihzIC8gNjApfToke1N0cmluZyhzICUgNjApLnBhZFN0YXJ0KDIsICcwJyl9YDsKfQo=', 'base64'), 'UTF8'), false, 2),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/hooks/useAuctionListeners.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlRm9jdXNFZmZlY3QgfSBmcm9tICdAcmVhY3QtbmF2aWdhdGlvbi9uYXRpdmUnOwppbXBvcnQgeyB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7CmltcG9ydCB7IEFwcFN0YXRlIH0gZnJvbSAncmVhY3QtbmF0aXZlJzsKaW1wb3J0IHR5cGUgeyBBdWN0aW9uU29ja2V0IH0gZnJvbSAnLi4vcmVhbHRpbWUvYXVjdGlvblNvY2tldCc7CmltcG9ydCB0eXBlIHsgQmlkIH0gZnJvbSAnLi4vdHlwZXMnOwoKLyoqIExpdmUgYmlkcyBmb3IgdGhlIGF1Y3Rpb24sIG9ubHkgd2hpbGUgdGhpcyBzY3JlZW4gaXMgZm9jdXNlZCAoc2F2ZXMgYmF0dGVyeSBhbmQgZGF0YSkuICovCmV4cG9ydCBmdW5jdGlvbiB1c2VCaWRGZWVkKHNvY2tldDogQXVjdGlvblNvY2tldCwgb25CaWQ6IChiaWQ6IEJpZCkgPT4gdm9pZCkgewogIHVzZUZvY3VzRWZmZWN0KCgpID0+IHsKICAgIHNvY2tldC5vbignYmlkJywgKGJpZCkgPT4gb25CaWQoYmlkKSk7CiAgICByZXR1cm4gKCkgPT4gc29ja2V0Lm9mZignYmlkJywgb25CaWQpOwogIH0pOwp9CgovKiogQ2FsbHMgYG9uRm9yZWdyb3VuZGAgd2hlbiB0aGUgYXBwIHJldHVybnMgdG8gdGhlIGZvcmVncm91bmQgKHRvIHJlc3luYyB0aGUgYm9hcmQpLiAqLwpleHBvcnQgZnVuY3Rpb24gdXNlT25Gb3JlZ3JvdW5kKG9uRm9yZWdyb3VuZDogKCkgPT4gdm9pZCkgewogIHVzZUVmZmVjdCgoKSA9PiB7CiAgICBBcHBTdGF0ZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoc3RhdGUpID0+IHsKICAgICAgaWYgKHN0YXRlID09PSAnYWN0aXZlJykgb25Gb3JlZ3JvdW5kKCk7CiAgICB9KTsKICB9LCBbb25Gb3JlZ3JvdW5kXSk7Cn0K', 'base64'), 'UTF8'), false, 3),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/utils/money.ts', 'typescript', convert_from(decode('LyoqIFBhcnNlcyB3aGF0IHRoZSBzdXBwbGllciB0eXBlZCAoIjEsMDAwLjA1IikgaW50byBydXBlZXMuIFJldHVybnMgbnVsbCBpZiBpdCBpc24ndCBhIHBvc2l0aXZlIGFtb3VudC4gKi8KZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUnVwZWVzKGlucHV0OiBzdHJpbmcpOiBudW1iZXIgfCBudWxsIHsKICBjb25zdCBuID0gTnVtYmVyKGlucHV0LnJlcGxhY2UoLywvZywgJycpLnRyaW0oKSk7CiAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShuKSAmJiBuID4gMCA/IG4gOiBudWxsOwp9CgovKioKICogSW4gYSByZXZlcnNlIGF1Y3Rpb24gYSBuZXcgYmlkIG11c3QgdW5kZXJjdXQgdGhlIGN1cnJlbnQgYmVzdCBiaWQgYnkgYXQgbGVhc3QgdGhlIG1pbmltdW0KICogZGVjcmVtZW50OiBiaWQgPD0gYmVzdCAtIG1pbkRlY3JlbWVudC4gQWxsIHZhbHVlcyBpbiBydXBlZXMgKHR3byBkZWNpbWFscykuCiAqLwpleHBvcnQgZnVuY3Rpb24gaXNWYWxpZEJpZChiaWQ6IG51bWJlciwgYmVzdDogbnVtYmVyLCBtaW5EZWNyZW1lbnQ6IG51bWJlcik6IGJvb2xlYW4gewogIHJldHVybiBiaWQgPiAwICYmIGJpZCA8PSBiZXN0IC0gbWluRGVjcmVtZW50Owp9CgovKiogIuKCuTEyLDM0LDU2Ny41MCIgKEluZGlhbiBkaWdpdCBncm91cGluZykuICovCmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRSdXBlZXMoYW1vdW50OiBudW1iZXIpOiBzdHJpbmcgewogIHJldHVybiBg4oK5JHthbW91bnQudG9GaXhlZCgyKX1gOwp9Cg==', 'base64'), 'UTF8'), false, 4),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/realtime/auctionSocket.ts', 'typescript', convert_from(decode('aW1wb3J0IHR5cGUgeyBCaWQgfSBmcm9tICcuLi90eXBlcyc7Cgp0eXBlIEV2ZW50cyA9IHsgYmlkOiBCaWQ7IGV4dGVuZGVkOiB7IGNsb3Nlc0F0OiBudW1iZXIgfSB9Owp0eXBlIEhhbmRsZXI8SyBleHRlbmRzIGtleW9mIEV2ZW50cz4gPSAocGF5bG9hZDogRXZlbnRzW0tdKSA9PiB2b2lkOwoKLyoqIFRoZSBsaXZlIGF1Y3Rpb24gZmVlZCAoYSBXZWJTb2NrZXQgaW4gdGhlIGFwcDsgYW4gaW4tbWVtb3J5IGVtaXR0ZXIgaW4gdGVzdHMpLiAqLwpleHBvcnQgaW50ZXJmYWNlIEF1Y3Rpb25Tb2NrZXQgewogIG9uPEsgZXh0ZW5kcyBrZXlvZiBFdmVudHM+KGV2ZW50OiBLLCBoYW5kbGVyOiBIYW5kbGVyPEs+KTogdm9pZDsKICBvZmY8SyBleHRlbmRzIGtleW9mIEV2ZW50cz4oZXZlbnQ6IEssIGhhbmRsZXI6IEhhbmRsZXI8Sz4pOiB2b2lkOwogIGVtaXQ8SyBleHRlbmRzIGtleW9mIEV2ZW50cz4oZXZlbnQ6IEssIHBheWxvYWQ6IEV2ZW50c1tLXSk6IHZvaWQ7CiAgbGlzdGVuZXJDb3VudChldmVudDoga2V5b2YgRXZlbnRzKTogbnVtYmVyOwp9CgpleHBvcnQgZnVuY3Rpb24gY3JlYXRlQXVjdGlvblNvY2tldCgpOiBBdWN0aW9uU29ja2V0IHsKICBjb25zdCBoYW5kbGVycyA9IG5ldyBNYXA8a2V5b2YgRXZlbnRzLCBTZXQ8KHA6IG5ldmVyKSA9PiB2b2lkPj4oKTsKICBjb25zdCBzZXQgPSAoZToga2V5b2YgRXZlbnRzKSA9PiB7CiAgICBpZiAoIWhhbmRsZXJzLmhhcyhlKSkgaGFuZGxlcnMuc2V0KGUsIG5ldyBTZXQoKSk7CiAgICByZXR1cm4gaGFuZGxlcnMuZ2V0KGUpITsKICB9OwogIHJldHVybiB7CiAgICBvbjogKGV2ZW50LCBoYW5kbGVyKSA9PiB2b2lkIHNldChldmVudCkuYWRkKGhhbmRsZXIgYXMgKHA6IG5ldmVyKSA9PiB2b2lkKSwKICAgIG9mZjogKGV2ZW50LCBoYW5kbGVyKSA9PiB2b2lkIHNldChldmVudCkuZGVsZXRlKGhhbmRsZXIgYXMgKHA6IG5ldmVyKSA9PiB2b2lkKSwKICAgIGVtaXQ6IChldmVudCwgcGF5bG9hZCkgPT4gc2V0KGV2ZW50KS5mb3JFYWNoKChoKSA9PiAoaCBhcyAocDogdHlwZW9mIHBheWxvYWQpID0+IHZvaWQpKHBheWxvYWQpKSwKICAgIGxpc3RlbmVyQ291bnQ6IChldmVudCkgPT4gc2V0KGV2ZW50KS5zaXplLAogIH07Cn0K', 'base64'), 'UTF8'), true, 5),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/debug/renderCounter.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlRGVidWdWYWx1ZSB9IGZyb20gJ3JlYWN0JzsKCi8qKgogKiBSZW5kZXIgaW5zdHJ1bWVudGF0aW9uIHVzZWQgYnkgdGhlIHBlcmZvcm1hbmNlIHRlc3RzIChhbmQgYnkgdGhlIHRlYW0ncyBpbi1hcHAgcGVyZiBvdmVybGF5KS4KICogS2VlcCB0aGUgdHJhY2tSZW5kZXIoKSBjYWxscyBpbiBwbGFjZTogY2FsbCBpdCB3aGlsZSB0aGUgY29tcG9uZW50IHJlbmRlcnMsIGxpa2UgYSBob29rIChpdCBpcwogKiBvbmUsIHNvIGNhbGxpbmcgaXQgZnJvbSBhbiBlZmZlY3Qgb3IgYW4gZXZlbnQgaGFuZGxlciB0aHJvd3MpLgogKi8KY29uc3QgY291bnRzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTsKCmV4cG9ydCBmdW5jdGlvbiB0cmFja1JlbmRlcihuYW1lOiBzdHJpbmcpIHsKICB1c2VEZWJ1Z1ZhbHVlKG5hbWUpOyAvLyBvbmx5IHZhbGlkIHdoaWxlIHJlbmRlcmluZzogY291bnRzIHJlYWwgcmVuZGVycywgbm90aGluZyBlbHNlCiAgY291bnRzLnNldChuYW1lLCAoY291bnRzLmdldChuYW1lKSA/PyAwKSArIDEpOwp9CgpleHBvcnQgZnVuY3Rpb24gcmVuZGVyQ291bnQobmFtZTogc3RyaW5nKTogbnVtYmVyIHsKICByZXR1cm4gY291bnRzLmdldChuYW1lKSA/PyAwOwp9CgovKiogU3VtIG9mIGFsbCBjb3VudGVycyB3aG9zZSBuYW1lIHN0YXJ0cyB3aXRoIGBwcmVmaXhgLiAqLwpleHBvcnQgZnVuY3Rpb24gdG90YWxSZW5kZXJzKHByZWZpeDogc3RyaW5nKTogbnVtYmVyIHsKICBsZXQgdG90YWwgPSAwOwogIGZvciAoY29uc3QgW25hbWUsIG5dIG9mIGNvdW50cykgaWYgKG5hbWUuc3RhcnRzV2l0aChwcmVmaXgpKSB0b3RhbCArPSBuOwogIHJldHVybiB0b3RhbDsKfQoKZXhwb3J0IGZ1bmN0aW9uIHJlc2V0UmVuZGVyQ291bnRzKCkgewogIGNvdW50cy5jbGVhcigpOwp9Cg==', 'base64'), 'UTF8'), true, 6),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'src/types.ts', 'typescript', convert_from(decode('ZXhwb3J0IGludGVyZmFjZSBCaWQgewogIGlkOiBzdHJpbmc7CiAgc3VwcGxpZXI6IHN0cmluZzsKICAvKiogQW1vdW50IGluIHBhaXNlICgxIHJ1cGVlID0gMTAwIHBhaXNlKS4gKi8KICBhbW91bnRNaW5vcjogbnVtYmVyOwp9CgpleHBvcnQgdHlwZSBBdWN0aW9uRXZlbnQgPSB7IHR5cGU6ICdiaWQnOyBiaWQ6IEJpZCB9IHwgeyB0eXBlOiAnZXh0ZW5kZWQnOyBjbG9zZXNBdDogbnVtYmVyIH07Cg==', 'base64'), 'UTF8'), true, 7),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', '__tests__/useCountdown.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCByZW5kZXJIb29rIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHsgdXNlQ291bnRkb3duIH0gZnJvbSAnLi4vc3JjL2hvb2tzL3VzZUNvdW50ZG93bic7Cgpjb25zdCBUMCA9IERhdGUuVVRDKDIwMjYsIDksIDEyLCAxMSwgMCwgMCk7CgpkZXNjcmliZSgndXNlQ291bnRkb3duJywgKCkgPT4gewogIGJlZm9yZUVhY2goKCkgPT4gewogICAgamVzdC51c2VGYWtlVGltZXJzKCk7CiAgICBqZXN0LnNldFN5c3RlbVRpbWUoVDApOwogIH0pOwoKICBpdCgnY291bnRzIGRvd24gZXZlcnkgc2Vjb25kIGFuZCBjbG9zZXMgYXQgemVybycsICgpID0+IHsKICAgIGNvbnN0IHsgcmVzdWx0IH0gPSByZW5kZXJIb29rKCgpID0+IHVzZUNvdW50ZG93bihUMCArIDNfMDAwKSk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQpLnRvTWF0Y2hPYmplY3QoeyByZW1haW5pbmc6IDNfMDAwLCBjbG9zZWQ6IGZhbHNlIH0pOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZSgxXzAwMCkpOwogICAgZXhwZWN0KHJlc3VsdC5jdXJyZW50LnJlbWFpbmluZykudG9CZSgyXzAwMCk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKDJfMDAwKSk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQpLnRvTWF0Y2hPYmplY3QoeyByZW1haW5pbmc6IDAsIGNsb3NlZDogdHJ1ZSB9KTsKICB9KTsKCiAgaXQoJ3BpY2tzIHVwIGFuIGV4dGVuc2lvbiBvZiB0aGUgY2xvc2luZyB0aW1lIGltbWVkaWF0ZWx5JywgKCkgPT4gewogICAgY29uc3QgeyByZXN1bHQsIHJlcmVuZGVyLCB1bm1vdW50IH0gPSByZW5kZXJIb29rKCh7IGNsb3Nlc0F0IH06IHsgY2xvc2VzQXQ6IG51bWJlciB9KSA9PiB1c2VDb3VudGRvd24oY2xvc2VzQXQpLCB7CiAgICAgIGluaXRpYWxQcm9wczogeyBjbG9zZXNBdDogVDAgKyAzMF8wMDAgfSwKICAgIH0pOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZSgyNV8wMDApKTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5yZW1haW5pbmcpLnRvQmUoNV8wMDApOwoKICAgIC8vIEEgYmlkIGluIHRoZSBmaW5hbCBtaW51dGUgZXh0ZW5kZWQgdGhlIGF1Y3Rpb24gYnkgMiBtaW51dGVzLgogICAgY29uc3QgdGltZXJzID0gamVzdC5nZXRUaW1lckNvdW50KCk7CiAgICByZXJlbmRlcih7IGNsb3Nlc0F0OiBUMCArIDE1MF8wMDAgfSk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQucmVtYWluaW5nKS50b0JlKDEyNV8wMDApOwogICAgZXhwZWN0KGplc3QuZ2V0VGltZXJDb3VudCgpKS50b0JlKHRpbWVycyk7IC8vIHRoZSBvbGQgdGltZXIgd2FzIHN0b3BwZWQsIG5vdCBsZWZ0IHJ1bm5pbmcKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoMTBfMDAwKSk7CiAgICBleHBlY3QocmVzdWx0LmN1cnJlbnQpLnRvTWF0Y2hPYmplY3QoeyByZW1haW5pbmc6IDExNV8wMDAsIGNsb3NlZDogZmFsc2UgfSk7CiAgICB1bm1vdW50KCk7CiAgICBleHBlY3QoamVzdC5nZXRUaW1lckNvdW50KCkpLnRvQmUoMCk7CiAgfSk7CgogIGl0KCdpcyByaWdodCBhZ2FpbiBhcyBzb29uIGFzIHRoZSBhcHAgcmV0dXJucyBmcm9tIHRoZSBiYWNrZ3JvdW5kJywgKCkgPT4gewogICAgY29uc3QgeyByZXN1bHQgfSA9IHJlbmRlckhvb2soKCkgPT4gdXNlQ291bnRkb3duKFQwICsgNjAwXzAwMCkpOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZSg1XzAwMCkpOwogICAgZXhwZWN0KHJlc3VsdC5jdXJyZW50LnJlbWFpbmluZykudG9CZSg1OTVfMDAwKTsKCiAgICAvLyBJbiB0aGUgYmFja2dyb3VuZCBKUyB0aW1lcnMgYXJlIHBhdXNlZCwgYnV0IHJlYWwgdGltZSBtb3ZlcyBvbjogMyBtaW51dGVzIHBhc3MuCiAgICBqZXN0LnNldFN5c3RlbVRpbWUoVDAgKyAxODVfMDAwKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoMV8wMDApKTsKICAgIGV4cGVjdChyZXN1bHQuY3VycmVudC5yZW1haW5pbmcpLnRvQmUoNjAwXzAwMCAtIDE4Nl8wMDApOwogIH0pOwp9KTsK', 'base64'), 'UTF8'), true, 8),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', '__tests__/listeners.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCBhcHBTdGF0ZSwgbmF2aWdhdGlvbiwgcmVuZGVySG9vayB9IGZyb20gJ0Bjb2RlYXJlbmEvdGVzdC11dGlscyc7CmltcG9ydCB7IHVzZUJpZEZlZWQsIHVzZU9uRm9yZWdyb3VuZCB9IGZyb20gJy4uL3NyYy9ob29rcy91c2VBdWN0aW9uTGlzdGVuZXJzJzsKaW1wb3J0IHsgY3JlYXRlQXVjdGlvblNvY2tldCB9IGZyb20gJy4uL3NyYy9yZWFsdGltZS9hdWN0aW9uU29ja2V0JzsKaW1wb3J0IHR5cGUgeyBCaWQgfSBmcm9tICcuLi9zcmMvdHlwZXMnOwoKY29uc3QgYmlkOiBCaWQgPSB7IGlkOiAnYjknLCBzdXBwbGllcjogJ0FjbWUgTWV0YWxzJywgYW1vdW50TWlub3I6IDk5Xzk5NSB9OwoKZGVzY3JpYmUoJ2xpdmUgYmlkIGZlZWQnLCAoKSA9PiB7CiAgaXQoJ2hhcyBleGFjdGx5IG9uZSBsaXN0ZW5lciB3aGlsZSBmb2N1c2VkLCBob3dldmVyIG9mdGVuIHRoZSBzY3JlZW4gcmUtcmVuZGVycycsICgpID0+IHsKICAgIGNvbnN0IHNvY2tldCA9IGNyZWF0ZUF1Y3Rpb25Tb2NrZXQoKTsKICAgIGNvbnN0IHsgcmVyZW5kZXIgfSA9IHJlbmRlckhvb2soKHsgb25CaWQgfTogeyBvbkJpZDogKGI6IEJpZCkgPT4gdm9pZCB9KSA9PiB1c2VCaWRGZWVkKHNvY2tldCwgb25CaWQpLCB7CiAgICAgIGluaXRpYWxQcm9wczogeyBvbkJpZDogamVzdC5mbigpIH0sCiAgICB9KTsKICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNTsgaSsrKSByZXJlbmRlcih7IG9uQmlkOiBqZXN0LmZuKCkgfSk7CiAgICBleHBlY3Qoc29ja2V0Lmxpc3RlbmVyQ291bnQoJ2JpZCcpKS50b0JlKDEpOwogIH0pOwoKICBpdCgnZGVsaXZlcnMgZWFjaCBiaWQgb25jZSwgdG8gdGhlIGxhdGVzdCBjYWxsYmFjaycsICgpID0+IHsKICAgIGNvbnN0IHNvY2tldCA9IGNyZWF0ZUF1Y3Rpb25Tb2NrZXQoKTsKICAgIGNvbnN0IGZpcnN0ID0gamVzdC5mbigpOwogICAgY29uc3QgbGF0ZXN0ID0gamVzdC5mbigpOwogICAgY29uc3QgeyByZXJlbmRlciB9ID0gcmVuZGVySG9vaygoeyBvbkJpZCB9OiB7IG9uQmlkOiAoYjogQmlkKSA9PiB2b2lkIH0pID0+IHVzZUJpZEZlZWQoc29ja2V0LCBvbkJpZCksIHsKICAgICAgaW5pdGlhbFByb3BzOiB7IG9uQmlkOiBmaXJzdCB9LAogICAgfSk7CiAgICByZXJlbmRlcih7IG9uQmlkOiBsYXRlc3QgfSk7CiAgICBhY3QoKCkgPT4gc29ja2V0LmVtaXQoJ2JpZCcsIGJpZCkpOwogICAgZXhwZWN0KGxhdGVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpOwogICAgZXhwZWN0KGxhdGVzdCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoYmlkKTsKICAgIGV4cGVjdChmaXJzdCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsKICB9KTsKCiAgaXQoJ21vdmVzIGl0cyBsaXN0ZW5lciB0byBhIG5ldyBzb2NrZXQgKGFmdGVyIGEgcmVjb25uZWN0KScsICgpID0+IHsKICAgIGNvbnN0IGJlZm9yZSA9IGNyZWF0ZUF1Y3Rpb25Tb2NrZXQoKTsKICAgIGNvbnN0IGFmdGVyID0gY3JlYXRlQXVjdGlvblNvY2tldCgpOwogICAgY29uc3Qgb25CaWQgPSBqZXN0LmZuKCk7CiAgICBjb25zdCB7IHJlcmVuZGVyIH0gPSByZW5kZXJIb29rKCh7IHNvY2tldCB9OiB7IHNvY2tldDogdHlwZW9mIGJlZm9yZSB9KSA9PiB1c2VCaWRGZWVkKHNvY2tldCwgb25CaWQpLCB7CiAgICAgIGluaXRpYWxQcm9wczogeyBzb2NrZXQ6IGJlZm9yZSB9LAogICAgfSk7CiAgICByZXJlbmRlcih7IHNvY2tldDogYWZ0ZXIgfSk7CiAgICBleHBlY3QoYmVmb3JlLmxpc3RlbmVyQ291bnQoJ2JpZCcpKS50b0JlKDApOwogICAgZXhwZWN0KGFmdGVyLmxpc3RlbmVyQ291bnQoJ2JpZCcpKS50b0JlKDEpOwogICAgYWN0KCgpID0+IGFmdGVyLmVtaXQoJ2JpZCcsIGJpZCkpOwogICAgZXhwZWN0KG9uQmlkKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7CiAgfSk7CgogIGl0KCd1bnN1YnNjcmliZXMgd2hlbiB0aGUgc2NyZWVuIGxvc2VzIGZvY3VzIGFuZCB3aGVuIGl0IHVubW91bnRzJywgKCkgPT4gewogICAgY29uc3Qgc29ja2V0ID0gY3JlYXRlQXVjdGlvblNvY2tldCgpOwogICAgY29uc3QgeyB1bm1vdW50IH0gPSByZW5kZXJIb29rKCgpID0+IHVzZUJpZEZlZWQoc29ja2V0LCBqZXN0LmZuKCkpKTsKICAgIGV4cGVjdChzb2NrZXQubGlzdGVuZXJDb3VudCgnYmlkJykpLnRvQmUoMSk7CiAgICBuYXZpZ2F0aW9uLmJsdXIoKTsKICAgIGV4cGVjdChzb2NrZXQubGlzdGVuZXJDb3VudCgnYmlkJykpLnRvQmUoMCk7CiAgICBuYXZpZ2F0aW9uLmZvY3VzKCk7CiAgICBleHBlY3Qoc29ja2V0Lmxpc3RlbmVyQ291bnQoJ2JpZCcpKS50b0JlKDEpOwogICAgdW5tb3VudCgpOwogICAgZXhwZWN0KHNvY2tldC5saXN0ZW5lckNvdW50KCdiaWQnKSkudG9CZSgwKTsKICB9KTsKfSk7CgpkZXNjcmliZSgnZm9yZWdyb3VuZCByZXN5bmMnLCAoKSA9PiB7CiAgaXQoJ2tlZXBzIG9uZSBBcHBTdGF0ZSBsaXN0ZW5lciBhbmQgcmVtb3ZlcyBpdCBvbiB1bm1vdW50JywgKCkgPT4gewogICAgY29uc3QgeyByZXJlbmRlciwgdW5tb3VudCB9ID0gcmVuZGVySG9vaygoeyBjYiB9OiB7IGNiOiAoKSA9PiB2b2lkIH0pID0+IHVzZU9uRm9yZWdyb3VuZChjYiksIHsKICAgICAgaW5pdGlhbFByb3BzOiB7IGNiOiBqZXN0LmZuKCkgfSwKICAgIH0pOwogICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHJlcmVuZGVyKHsgY2I6IGplc3QuZm4oKSB9KTsKICAgIGV4cGVjdChhcHBTdGF0ZS5saXN0ZW5lckNvdW50KCkpLnRvQmUoMSk7CiAgICB1bm1vdW50KCk7CiAgICBleHBlY3QoYXBwU3RhdGUubGlzdGVuZXJDb3VudCgpKS50b0JlKDApOwogIH0pOwoKICBpdCgnY2FsbHMgdGhlIGxhdGVzdCBjYWxsYmFjayBvbmNlIHdoZW4gdGhlIGFwcCBiZWNvbWVzIGFjdGl2ZScsICgpID0+IHsKICAgIGNvbnN0IGZpcnN0ID0gamVzdC5mbigpOwogICAgY29uc3QgbGF0ZXN0ID0gamVzdC5mbigpOwogICAgY29uc3QgeyByZXJlbmRlciB9ID0gcmVuZGVySG9vaygoeyBjYiB9OiB7IGNiOiAoKSA9PiB2b2lkIH0pID0+IHVzZU9uRm9yZWdyb3VuZChjYiksIHsKICAgICAgaW5pdGlhbFByb3BzOiB7IGNiOiBmaXJzdCB9LAogICAgfSk7CiAgICByZXJlbmRlcih7IGNiOiBsYXRlc3QgfSk7CiAgICBhcHBTdGF0ZS5zZXQoJ2JhY2tncm91bmQnKTsKICAgIGFwcFN0YXRlLnNldCgnYWN0aXZlJyk7CiAgICBleHBlY3QobGF0ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7CiAgICBleHBlY3QoZmlyc3QpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7CiAgfSk7Cn0pOwo=', 'base64'), 'UTF8'), true, 9),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', '__tests__/BidBoard.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0ICogYXMgUk4gZnJvbSAncmVhY3QtbmF0aXZlJzsKaW1wb3J0IHsgYWN0LCBmaXJlRXZlbnQsIHJlbmRlciwgdGV4dENvbnRlbnQgfSBmcm9tICdAY29kZWFyZW5hL3Rlc3QtdXRpbHMnOwppbXBvcnQgeyByZW5kZXJDb3VudCwgcmVzZXRSZW5kZXJDb3VudHMsIHRvdGFsUmVuZGVycyB9IGZyb20gJy4uL3NyYy9kZWJ1Zy9yZW5kZXJDb3VudGVyJzsKaW1wb3J0IHsgY3JlYXRlQXVjdGlvblNvY2tldCB9IGZyb20gJy4uL3NyYy9yZWFsdGltZS9hdWN0aW9uU29ja2V0JzsKaW1wb3J0IHsgQXVjdGlvblNjcmVlbiB9IGZyb20gJy4uL3NyYy9zY3JlZW5zL0F1Y3Rpb25TY3JlZW4nOwppbXBvcnQgdHlwZSB7IEJpZCB9IGZyb20gJy4uL3NyYy90eXBlcyc7Cgpjb25zdCBiaWRzOiBCaWRbXSA9IEFycmF5LmZyb20oeyBsZW5ndGg6IDMwIH0sIChfLCBpKSA9PiAoewogIGlkOiBgYiR7aX1gLAogIHN1cHBsaWVyOiBgU3VwcGxpZXIgJHtpfWAsCiAgYW1vdW50TWlub3I6IDEwMF8wMDAgKyBpICogNTAsCn0pKTsKCi8qKgogKiBSb3cgcmVuZGVycyBhcyBSZWFjdCBwZXJmb3JtcyB0aGVtOiBlYWNoIHJvdydzIGFtb3VudCA8VGV4dCB0ZXN0SUQ9ImJpZC08aWQ+LWFtb3VudCI+IGNvdW50cwogKiBpdHNlbGYsIHdoYXRldmVyIHRoZSByb3cncyBvd24gY29kZSBkb2VzLgogKi8KY29uc3Qgcm93UmVuZGVyczogc3RyaW5nW10gPSBbXTsKY29uc3QgT3JpZ2luYWxUZXh0ID0gUk4uVGV4dDsKY29uc3QgcmVhY3ROYXRpdmUgPSBSTiBhcyB1bmtub3duIGFzIHsgVGV4dDogdW5rbm93biB9OwpmdW5jdGlvbiBDb3VudGluZ1RleHQocHJvcHM6IFJlYWN0LkNvbXBvbmVudFByb3BzPHR5cGVvZiBPcmlnaW5hbFRleHQ+KSB7CiAgY29uc3QgaWQgPSAvXmJpZC0oLispLWFtb3VudCQvLmV4ZWMoU3RyaW5nKHByb3BzLnRlc3RJRCA/PyAnJykpPy5bMV07CiAgaWYgKGlkKSByb3dSZW5kZXJzLnB1c2goaWQpOwogIHJldHVybiA8T3JpZ2luYWxUZXh0IHsuLi5wcm9wc30gLz47Cn0KYWZ0ZXJFYWNoKCgpID0+IHsKICByZWFjdE5hdGl2ZS5UZXh0ID0gT3JpZ2luYWxUZXh0Owp9KTsKCmZ1bmN0aW9uIHJlbmRlclNjcmVlbigpIHsKICBqZXN0LnVzZUZha2VUaW1lcnMoKTsKICByZWFjdE5hdGl2ZS5UZXh0ID0gQ291bnRpbmdUZXh0OwogIGNvbnN0IHNvY2tldCA9IGNyZWF0ZUF1Y3Rpb25Tb2NrZXQoKTsKICBjb25zdCB1dGlscyA9IHJlbmRlcigKICAgIDxBdWN0aW9uU2NyZWVuCiAgICAgIHNvY2tldD17c29ja2V0fQogICAgICBpbml0aWFsQmlkcz17Ymlkc30KICAgICAgY2xvc2VzQXQ9e0RhdGUubm93KCkgKyA2MDBfMDAwfQogICAgICBvblBsYWNlQmlkPXtqZXN0LmZuKCl9CiAgICAgIG9uUmVzeW5jPXtqZXN0LmZuKCl9CiAgICAvPiwKICApOwogIHJlc2V0UmVuZGVyQ291bnRzKCk7CiAgcm93UmVuZGVycy5sZW5ndGggPSAwOwogIHJldHVybiB7IHNvY2tldCwgLi4udXRpbHMgfTsKfQoKY29uc3QgcmFua09mID0gKG5vZGU6IFBhcmFtZXRlcnM8dHlwZW9mIHRleHRDb250ZW50PlswXSkgPT4gLyMoXGQrKS8uZXhlYyh0ZXh0Q29udGVudChub2RlKSk/LlsxXTsKCmRlc2NyaWJlKCdiaWQgYm9hcmQgcGVyZm9ybWFuY2UnLCAoKSA9PiB7CiAgaXQoInJvd3MgZG9uJ3QgcmUtcmVuZGVyIHdoaWxlIHRoZSBjb3VudGRvd24gdGlja3MiLCAoKSA9PiB7CiAgICByZW5kZXJTY3JlZW4oKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoM18wMDApKTsKICAgIGV4cGVjdCh0b3RhbFJlbmRlcnMoJ0JpZFJvdzonKSkudG9CZSgwKTsKICAgIGV4cGVjdChyb3dSZW5kZXJzKS50b0VxdWFsKFtdKTsKICB9KTsKCiAgaXQoJ3NlbGVjdGluZyBhIGJpZCByZS1yZW5kZXJzIG9ubHkgdGhlIHJvd3Mgd2hvc2Ugc2VsZWN0aW9uIGNoYW5nZWQnLCAoKSA9PiB7CiAgICBjb25zdCB7IGdldEJ5VGVzdElkIH0gPSByZW5kZXJTY3JlZW4oKTsKICAgIGZpcmVFdmVudC5wcmVzcyhnZXRCeVRlc3RJZCgnYmlkLWI1JykpOwogICAgZXhwZWN0KHJlbmRlckNvdW50KCdCaWRSb3c6YjUnKSkudG9CZSgxKTsKICAgIGV4cGVjdCh0b3RhbFJlbmRlcnMoJ0JpZFJvdzonKSkudG9CZSgxKTsKICAgIGV4cGVjdChyb3dSZW5kZXJzKS50b0VxdWFsKFsnYjUnXSk7CgogICAgZmlyZUV2ZW50LnByZXNzKGdldEJ5VGVzdElkKCdiaWQtYjcnKSk7CiAgICBleHBlY3QodG90YWxSZW5kZXJzKCdCaWRSb3c6JykpLnRvQmUoMyk7IC8vIGI1IGRlc2VsZWN0ZWQsIGI3IHNlbGVjdGVkCiAgICBleHBlY3QoWy4uLnJvd1JlbmRlcnNdLnNvcnQoKSkudG9FcXVhbChbJ2I1JywgJ2I1JywgJ2I3J10pOwogICAgZXhwZWN0KGdldEJ5VGVzdElkKCdiaWQtYjctc2VsZWN0ZWQnKSkudG9CZVRydXRoeSgpOwogIH0pOwoKICBpdCgnYSBuZXcgYmlkIHRoYXQgcmFua3MgbGFzdCByZW5kZXJzIG9ubHkgaXRzIG93biByb3cnLCAoKSA9PiB7CiAgICBjb25zdCB7IHNvY2tldCwgZ2V0QnlUZXN0SWQgfSA9IHJlbmRlclNjcmVlbigpOwogICAgYWN0KCgpID0+IHNvY2tldC5lbWl0KCdiaWQnLCB7IGlkOiAnbGF0ZScsIHN1cHBsaWVyOiAnTGF0ZSBDbycsIGFtb3VudE1pbm9yOiA5MDBfMDAwIH0pKTsKICAgIGV4cGVjdChnZXRCeVRlc3RJZCgnYmlkLWxhdGUnKSkudG9CZVRydXRoeSgpOwogICAgZXhwZWN0KHRvdGFsUmVuZGVycygnQmlkUm93OicpKS50b0JlKDEpOwogICAgZXhwZWN0KHJvd1JlbmRlcnMpLnRvRXF1YWwoWydsYXRlJ10pOwogIH0pOwoKICBpdCgnYSBuZXcgYmVzdCBiaWQgYmVjb21lcyAjMSBhbmQgbW92ZXMgZXZlcnkgb3RoZXIgYmlkIGRvd24nLCAoKSA9PiB7CiAgICBjb25zdCB7IHNvY2tldCwgZ2V0QnlUZXN0SWQgfSA9IHJlbmRlclNjcmVlbigpOwogICAgYWN0KCgpID0+IHNvY2tldC5lbWl0KCdiaWQnLCB7IGlkOiAnYmVzdCcsIHN1cHBsaWVyOiAnQmVzdCBDbycsIGFtb3VudE1pbm9yOiA5MF8wMDAgfSkpOwogICAgZXhwZWN0KHJhbmtPZihnZXRCeVRlc3RJZCgnYmlkLWJlc3QnKSkpLnRvQmUoJzEnKTsKICAgIGV4cGVjdChyYW5rT2YoZ2V0QnlUZXN0SWQoJ2JpZC1iMCcpKSkudG9CZSgnMicpOwogICAgZXhwZWN0KHJhbmtPZihnZXRCeVRlc3RJZCgnYmlkLWIyOScpKSkudG9CZSgnMzEnKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 10),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', '__tests__/money.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgZm9ybWF0UnVwZWVzLCBpc1ZhbGlkQmlkLCBwYXJzZVJ1cGVlcyB9IGZyb20gJy4uL3NyYy91dGlscy9tb25leSc7CgpkZXNjcmliZSgnYmlkIHJ1bGVzJywgKCkgPT4gewogIGl0KCdhY2NlcHRzIGEgYmlkIHRoYXQgdW5kZXJjdXRzIHRoZSBiZXN0IGJpZCBieSBhdCBsZWFzdCB0aGUgbWluaW11bSBkZWNyZW1lbnQnLCAoKSA9PiB7CiAgICAvLyBbYmlkLCBiZXN0LCBtaW4gZGVjcmVtZW50LCB2YWxpZD9dCiAgICBjb25zdCBjYXNlczogW251bWJlciwgbnVtYmVyLCBudW1iZXIsIGJvb2xlYW5dW10gPSBbCiAgICAgIFs5OTkuOTUsIDEwMDAuMDUsIDAuMSwgdHJ1ZV0sCiAgICAgIFs5OTkuOTQsIDEwMDAuMDUsIDAuMSwgdHJ1ZV0sCiAgICAgIFs5OTkuOTYsIDEwMDAuMDUsIDAuMSwgZmFsc2VdLAogICAgICBbMC4yLCAwLjMsIDAuMSwgdHJ1ZV0sCiAgICAgIFswLjIxLCAwLjMsIDAuMSwgZmFsc2VdLAogICAgICBbMTIzNC41LCAxMjM0LjYsIDAuMSwgdHJ1ZV0sCiAgICAgIFsyNTUuOTMsIDI1Ni4wMywgMC4xLCB0cnVlXSwKICAgICAgWzAuMTEsIDAuMjEsIDAuMSwgdHJ1ZV0sCiAgICBdOwogICAgZm9yIChjb25zdCBbYmlkLCBiZXN0LCBkZWMsIHZhbGlkXSBvZiBjYXNlcykgewogICAgICBleHBlY3QoYCR7YmlkfSBhZ2FpbnN0ICR7YmVzdH06ICR7aXNWYWxpZEJpZChiaWQsIGJlc3QsIGRlYyl9YCkudG9CZShgJHtiaWR9IGFnYWluc3QgJHtiZXN0fTogJHt2YWxpZH1gKTsKICAgIH0KICB9KTsKCiAgaXQoJ3JlamVjdHMgemVybywgbmVnYXRpdmUgYW5kIG5vbi1udW1lcmljIGFtb3VudHMnLCAoKSA9PiB7CiAgICBleHBlY3QocGFyc2VSdXBlZXMoJzAnKSkudG9CZU51bGwoKTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygnLTUnKSkudG9CZU51bGwoKTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygnYWJjJykpLnRvQmVOdWxsKCk7CiAgICBleHBlY3QocGFyc2VSdXBlZXMoJzEsMDAwLjA1JykpLnRvQmUoMTAwMC4wNSk7CiAgICBleHBlY3QoaXNWYWxpZEJpZCgwLCAxMCwgMC4xKSkudG9CZShmYWxzZSk7CiAgfSk7CgogIGl0KCdmb3JtYXRzIGFtb3VudHMgaW4gcnVwZWVzIHdpdGggSW5kaWFuIGRpZ2l0IGdyb3VwaW5nJywgKCkgPT4gewogICAgZXhwZWN0KGZvcm1hdFJ1cGVlcygxMjM0NTY3LjUpKS50b0JlKCfigrkxMiwzNCw1NjcuNTAnKTsKICAgIGV4cGVjdChmb3JtYXRSdXBlZXMoMC4xICsgMC4yKSkudG9CZSgn4oK5MC4zMCcpOwogICAgZXhwZWN0KGZvcm1hdFJ1cGVlcyg5OTkuOTUpKS50b0JlKCfigrk5OTkuOTUnKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 11),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'package.json', 'json', convert_from(decode('ewogICJuYW1lIjogInp5Y3VzLWVzb3VyY2luZy1hdWN0aW9uIiwKICAidmVyc2lvbiI6ICIyLjcuMSIsCiAgInByaXZhdGUiOiB0cnVlLAogICJzY3JpcHRzIjogewogICAgInN0YXJ0IjogInJlYWN0LW5hdGl2ZSBzdGFydCIsCiAgICAidGVzdCI6ICJqZXN0IgogIH0sCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJAcmVhY3QtbmF2aWdhdGlvbi9uYXRpdmUiOiAiNy4xLjE3IiwKICAgICJyZWFjdCI6ICIxOS4xLjAiLAogICAgInJlYWN0LW5hdGl2ZSI6ICIwLjgxLjQiCiAgfSwKICAiZGV2RGVwZW5kZW5jaWVzIjogewogICAgIkB0ZXN0aW5nLWxpYnJhcnkvcmVhY3QtbmF0aXZlIjogIjEzLjMuMyIsCiAgICAiamVzdCI6ICIyOS43LjAiLAogICAgInR5cGVzY3JpcHQiOiAiNS44LjMiCiAgfQp9Cg==', 'base64'), 'UTF8'), true, 12)
  on conflict (question_id, path) do update set language = excluded.language, content = excluded.content,
    readonly = excluded.readonly, sort_order = excluded.sort_order;
  delete from public.question_rubric_items where question_id = 'a7dcbe6c-f122-4051-8368-41c2659815d7' and key <> all (array['countdown', 'listeners', 'rendering', 'money', 'code_quality']::text[]);
  insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'countdown', 'Countdown survives extensions and backgrounding', 'Depends on closesAt and recomputes immediately; derives remaining time from the wall clock each tick.', 6, 0),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'listeners', 'No listener leaks', 'useFocusEffect with useCallback and one stable handler (same reference for on/off); latest callback via ref; AppState subscription removed in cleanup.', 6, 1),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'rendering', 'Rows re-render only when their data changes', convert_from(decode('U3RhYmxlIG9uU2VsZWN0LCBubyBpbmxpbmUgc3R5bGUgb2JqZWN0cywgbWVtb2lzZWQgcmVuZGVySXRlbS9ib2FyZDsgZXhwbGFpbnMgbWVtbydzIGlkZW50aXR5IGNvbXBhcmlzb24u', 'base64'), 'UTF8'), 5, 2),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'money', 'Correct money arithmetic and formatting', 'Compares integer paise; formats with Intl (en-IN, INR).', 3, 3),
    ('a7dcbe6c-f122-4051-8368-41c2659815d7', 'code_quality', 'Root-cause fixes, clean code', 'No sleeps, no test special-casing, no isMounted flags; instrumentation kept.', 2, 4)
  on conflict (question_id, key) do update set criterion = excluded.criterion,
    description = excluded.description, max_points = excluded.max_points, sort_order = excluded.sort_order;
  insert into public.question_solutions (question_id, notes_md, files) values (
    'a7dcbe6c-f122-4051-8368-41c2659815d7', convert_from(decode('IyMjIFJlZmVyZW5jZSBub3RlcyAocmV2aWV3ZXJzIG9ubHkpCgoxLiAqKkNvdW50ZG93bioqIChgaG9va3MvdXNlQ291bnRkb3duLnRzYCk6IHR3byBidWdzLiBUaGUgZWZmZWN0IGhhcyBgW11gIGRlcHMsIHNvIGEgY2hhbmdlZAogICBgY2xvc2VzQXRgIChhdWN0aW9uIGV4dGVuZGVkKSBpcyBpZ25vcmVkOyBhbmQgaXQgZGVjcmVtZW50cyBwZXIgdGljaywgd2hpY2ggZHJpZnRzIGJlY2F1c2UKICAgdGltZXJzIHBhdXNlL3Rocm90dGxlIGluIHRoZSBiYWNrZ3JvdW5kLiBGaXg6IGRlcGVuZCBvbiBgY2xvc2VzQXRgLCByZWNvbXB1dGUgaW1tZWRpYXRlbHksIGFuZAogICBkZXJpdmUgZnJvbSBgY2xvc2VzQXQgLSBEYXRlLm5vdygpYCBvbiBlYWNoIHRpY2suCjIuICoqTGlzdGVuZXIgbGVha3MqKiAoYGhvb2tzL3VzZUF1Y3Rpb25MaXN0ZW5lcnMudHNgKTogdGhlIGB1c2VGb2N1c0VmZmVjdGAgY2FsbGJhY2sgaXNuJ3QKICAgbWVtb2lzZWQgKHJlLXN1YnNjcmliZXMgZXZlcnkgcmVuZGVyKSBhbmQgYG9mZihvbkJpZClgIHJlbW92ZXMgYSBkaWZmZXJlbnQgZnVuY3Rpb24gdGhhbiB0aGUKICAgd3JhcHBlciBwYXNzZWQgdG8gYG9uKClgOyB0aGUgQXBwU3RhdGUgc3Vic2NyaXB0aW9uIGlzIG5ldmVyIHJlbW92ZWQgKG9uZSBtb3JlIHBlciBjYWxsYmFjawogICBjaGFuZ2UsIGFuZCBzdGFsZSBjYWxsYmFja3MgZmlyZSkuIEZpeDogYHVzZUNhbGxiYWNrYCArIHN0YWJsZSBoYW5kbGVyICsgbGF0ZXN0LWNhbGxiYWNrIHJlZjsKICAgYHN1Yi5yZW1vdmUoKWAgaW4gY2xlYW51cC4KMy4gKipSZS1yZW5kZXIgc3Rvcm0qKiAoYGNvbXBvbmVudHMvQmlkQm9hcmQudHN4YCwgYHNjcmVlbnMvQXVjdGlvblNjcmVlbi50c3hgKTogYFJlYWN0Lm1lbW9gCiAgIHJvd3MgcmVjZWl2ZSBhIG5ldyBgb25QcmVzc2AgY2xvc3VyZSBhbmQgYSBuZXcgYHN0eWxlYCBvYmplY3QgZXZlcnkgcmVuZGVyLCBhbmQgdGhlIHNjcmVlbgogICByZS1yZW5kZXJzIGV2ZXJ5IHNlY29uZC4gRml4OiBzdGFibGUgYG9uU2VsZWN0KGlkKWAgdmlhIGB1c2VDYWxsYmFja2AsIGBTdHlsZVNoZWV0YCBzdHlsZXMsCiAgIG1lbW9pc2VkIGByZW5kZXJJdGVtYC9ib2FyZC4gKE1vdmluZyB0aGUgY291bnRkb3duIGludG8gaXRzIG93biBjb21wb25lbnQgaXMgYWxzbyBmaW5lLikKNC4gKipNb25leSoqIChgdXRpbHMvbW9uZXkudHNgKTogZmxvYXQgc3VidHJhY3Rpb24gKGAxMDAwLjA1IC0gMC4xID0gOTk5Ljk0OTk5OTk5OTk5OTlgKTsgY29tcGFyZQogICBpbnRlZ2VyIHBhaXNlLiBGb3JtYXQgd2l0aCBgSW50bC5OdW1iZXJGb3JtYXQoJ2VuLUlOJywgeyBzdHlsZTogJ2N1cnJlbmN5JywgY3VycmVuY3k6ICdJTlInIH0pYC4KCioqU2VuaW9yIHNpZ25hbHM6KiogZXhwbGFpbnMgdGltZXIgdGhyb3R0bGluZyBpbiB0aGUgYmFja2dyb3VuZCBhbmQgd2h5IHdhbGwtY2xvY2sgZGVyaXZhdGlvbiBpcwp0aGUgZml4IChub3QgYSBzaG9ydGVyIGludGVydmFsKTsgaWRlbnRpZmllcyB0aGUgcmVmZXJlbmNlIG1pc21hdGNoIGluIGBvbmAvYG9mZmA7IGV4cGxhaW5zIG1lbW8ncwppZGVudGl0eSBjb21wYXJpc29uOyBhdm9pZHMgYGlzTW91bnRlZGAgZmxhZ3MuCg==', 'base64'), 'UTF8'), (convert_from(decode('W3sicGF0aCI6InNyYy9ob29rcy91c2VDb3VudGRvd24udHMiLCJjb250ZW50IjoiaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcblxuLyoqIFRpbWUgbGVmdCB1bnRpbCB0aGUgYXVjdGlvbiBjbG9zZXMsIHVwZGF0ZWQgZXZlcnkgc2Vjb25kLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUNvdW50ZG93bihjbG9zZXNBdDogbnVtYmVyKSB7XG4gIGNvbnN0IFtyZW1haW5pbmcsIHNldFJlbWFpbmluZ10gPSB1c2VTdGF0ZSgoKSA9PiBNYXRoLm1heCgwLCBjbG9zZXNBdCAtIERhdGUubm93KCkpKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIEZJWDogZGVyaXZlIHRoZSByZW1haW5pbmcgdGltZSBmcm9tIHRoZSB3YWxsIGNsb2NrIG9uIGV2ZXJ5IHRpY2sgKGNvdW50aW5nIHRpY2tzIGRyaWZ0czpcbiAgICAvLyB0aW1lcnMgcGF1c2Ugb3IgYXJlIHRocm90dGxlZCBpbiB0aGUgYmFja2dyb3VuZCkgYW5kIHJlc3RhcnQgd2hlbiBjbG9zZXNBdCBjaGFuZ2VzXG4gICAgLy8gKHRoZSBlbXB0eSBkZXBzIGFycmF5IGtlcHQgdGhlIGNsb3NpbmcgdGltZSBmcm9tIHRoZSBmaXJzdCByZW5kZXIsIGlnbm9yaW5nIGV4dGVuc2lvbnMpLlxuICAgIGNvbnN0IHVwZGF0ZSA9ICgpID0+IHNldFJlbWFpbmluZyhNYXRoLm1heCgwLCBjbG9zZXNBdCAtIERhdGUubm93KCkpKTtcbiAgICB1cGRhdGUoKTtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKHVwZGF0ZSwgMTAwMCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaWQpO1xuICB9LCBbY2xvc2VzQXRdKTtcblxuICByZXR1cm4geyByZW1haW5pbmcsIGNsb3NlZDogcmVtYWluaW5nID09PSAwIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRSZW1haW5pbmcobXM6IG51bWJlcik6IHN0cmluZyB7XG4gIGNvbnN0IHMgPSBNYXRoLmNlaWwobXMgLyAxMDAwKTtcbiAgcmV0dXJuIGAke01hdGguZmxvb3IocyAvIDYwKX06JHtTdHJpbmcocyAlIDYwKS5wYWRTdGFydCgyLCAnMCcpfWA7XG59XG4ifSx7InBhdGgiOiJzcmMvaG9va3MvdXNlQXVjdGlvbkxpc3RlbmVycy50cyIsImNvbnRlbnQiOiJpbXBvcnQgeyB1c2VGb2N1c0VmZmVjdCB9IGZyb20gJ0ByZWFjdC1uYXZpZ2F0aW9uL25hdGl2ZSc7XG5pbXBvcnQgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VSZWYgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBBcHBTdGF0ZSB9IGZyb20gJ3JlYWN0LW5hdGl2ZSc7XG5pbXBvcnQgdHlwZSB7IEF1Y3Rpb25Tb2NrZXQgfSBmcm9tICcuLi9yZWFsdGltZS9hdWN0aW9uU29ja2V0JztcbmltcG9ydCB0eXBlIHsgQmlkIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG4vKiogTGl2ZSBiaWRzIGZvciB0aGUgYXVjdGlvbiwgb25seSB3aGlsZSB0aGlzIHNjcmVlbiBpcyBmb2N1c2VkIChzYXZlcyBiYXR0ZXJ5IGFuZCBkYXRhKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VCaWRGZWVkKHNvY2tldDogQXVjdGlvblNvY2tldCwgb25CaWQ6IChiaWQ6IEJpZCkgPT4gdm9pZCkge1xuICAvLyBGSVg6IGtlZXAgdGhlIGxhdGVzdCBjYWxsYmFjayBpbiBhIHJlZiBhbmQgc3Vic2NyaWJlIHdpdGggT05FIHN0YWJsZSBoYW5kbGVyLiBUaGUgaW5saW5lXG4gIC8vIGVmZmVjdCByZS1zdWJzY3JpYmVkIG9uIGV2ZXJ5IHJlbmRlciwgYW5kIG9mZihvbkJpZCkgcmVtb3ZlZCBhIGRpZmZlcmVudCBmdW5jdGlvbiB0aGFuIHRoZVxuICAvLyB3cmFwcGVyIHBhc3NlZCB0byBvbigpLCBzbyBsaXN0ZW5lcnMgcGlsZWQgdXAgKGR1cGxpY2F0ZSBiaWRzLCB1cGRhdGVzIG9uIGEgYmx1cnJlZCBzY3JlZW4pLlxuICBjb25zdCBsYXRlc3QgPSB1c2VSZWYob25CaWQpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxhdGVzdC5jdXJyZW50ID0gb25CaWQ7XG4gIH0pO1xuICB1c2VGb2N1c0VmZmVjdChcbiAgICB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gKGJpZDogQmlkKSA9PiBsYXRlc3QuY3VycmVudChiaWQpO1xuICAgICAgc29ja2V0Lm9uKCdiaWQnLCBoYW5kbGVyKTtcbiAgICAgIHJldHVybiAoKSA9PiBzb2NrZXQub2ZmKCdiaWQnLCBoYW5kbGVyKTtcbiAgICB9LCBbc29ja2V0XSksXG4gICk7XG59XG5cbi8qKiBDYWxscyBgb25Gb3JlZ3JvdW5kYCB3aGVuIHRoZSBhcHAgcmV0dXJucyB0byB0aGUgZm9yZWdyb3VuZCAodG8gcmVzeW5jIHRoZSBib2FyZCkuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlT25Gb3JlZ3JvdW5kKG9uRm9yZWdyb3VuZDogKCkgPT4gdm9pZCkge1xuICBjb25zdCBsYXRlc3QgPSB1c2VSZWYob25Gb3JlZ3JvdW5kKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsYXRlc3QuY3VycmVudCA9IG9uRm9yZWdyb3VuZDtcbiAgfSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgLy8gRklYOiByZW1vdmUgdGhlIHN1YnNjcmlwdGlvbiBpbiB0aGUgY2xlYW51cCAoaXQgbGVha2VkIG9uZSBsaXN0ZW5lciBwZXIgY2FsbGJhY2sgY2hhbmdlKS5cbiAgICBjb25zdCBzdWIgPSBBcHBTdGF0ZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoc3RhdGUpID0+IHtcbiAgICAgIGlmIChzdGF0ZSA9PT0gJ2FjdGl2ZScpIGxhdGVzdC5jdXJyZW50KCk7XG4gICAgfSk7XG4gICAgcmV0dXJuICgpID0+IHN1Yi5yZW1vdmUoKTtcbiAgfSwgW10pO1xufVxuIn0seyJwYXRoIjoic3JjL3V0aWxzL21vbmV5LnRzIiwiY29udGVudCI6Ii8qKiBQYXJzZXMgd2hhdCB0aGUgc3VwcGxpZXIgdHlwZWQgKFwiMSwwMDAuMDVcIikgaW50byBydXBlZXMuIFJldHVybnMgbnVsbCBpZiBpdCBpc24ndCBhIHBvc2l0aXZlIGFtb3VudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVJ1cGVlcyhpbnB1dDogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IG4gPSBOdW1iZXIoaW5wdXQucmVwbGFjZSgvLC9nLCAnJykudHJpbSgpKTtcbiAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShuKSAmJiBuID4gMCA/IG4gOiBudWxsO1xufVxuXG4vLyBGSVg6IGNvbXBhcmUgbW9uZXkgaW4gaW50ZWdlciBwYWlzZS4gSW4gZmxvYXRpbmcgcG9pbnQgMTAwMC4wNSAtIDAuMTAgaXMgOTk5Ljk0OTk5OTk5OTk5OTksIHNvXG4vLyBhIHZhbGlkIOKCuTk5OS45NSBiaWQgd2FzIHJlamVjdGVkIChhbmQgMC4zIC0gMC4xIGlzIDAuMTk5OTk5OTk5OTk5OTk5OTgpLlxuY29uc3QgdG9QYWlzZSA9IChydXBlZXM6IG51bWJlcikgPT4gTWF0aC5yb3VuZChydXBlZXMgKiAxMDApO1xuXG4vKipcbiAqIEluIGEgcmV2ZXJzZSBhdWN0aW9uIGEgbmV3IGJpZCBtdXN0IHVuZGVyY3V0IHRoZSBjdXJyZW50IGJlc3QgYmlkIGJ5IGF0IGxlYXN0IHRoZSBtaW5pbXVtXG4gKiBkZWNyZW1lbnQ6IGJpZCA8PSBiZXN0IC0gbWluRGVjcmVtZW50LiBBbGwgdmFsdWVzIGluIHJ1cGVlcyAodHdvIGRlY2ltYWxzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRCaWQoYmlkOiBudW1iZXIsIGJlc3Q6IG51bWJlciwgbWluRGVjcmVtZW50OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYiA9IHRvUGFpc2UoYmlkKTtcbiAgcmV0dXJuIGIgPiAwICYmIGIgPD0gdG9QYWlzZShiZXN0KSAtIHRvUGFpc2UobWluRGVjcmVtZW50KTtcbn1cblxuLy8gRklYOiBJbnRsIGZvcm1hdHMgdGhlIGN1cnJlbmN5IHdpdGggSW5kaWFuIGdyb3VwaW5nICgxMiwzNCw1NjcuNTApOyB0b0ZpeGVkIGRvZXNuJ3QgZ3JvdXAuXG5jb25zdCBpbnIgPSBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ2VuLUlOJywge1xuICBzdHlsZTogJ2N1cnJlbmN5JyxcbiAgY3VycmVuY3k6ICdJTlInLFxuICBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDIsXG4gIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMixcbn0pO1xuXG4vKiogXCLigrkxMiwzNCw1NjcuNTBcIiAoSW5kaWFuIGRpZ2l0IGdyb3VwaW5nKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRSdXBlZXMoYW1vdW50OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gaW5yLmZvcm1hdChhbW91bnQpO1xufVxuIn0seyJwYXRoIjoic3JjL2NvbXBvbmVudHMvQmlkQm9hcmQudHN4IiwiY29udGVudCI6ImltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjayB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEZsYXRMaXN0LCBQcmVzc2FibGUsIFN0eWxlU2hlZXQsIFRleHQsIHR5cGUgTGlzdFJlbmRlckl0ZW0gfSBmcm9tICdyZWFjdC1uYXRpdmUnO1xuaW1wb3J0IHsgdHJhY2tSZW5kZXIgfSBmcm9tICcuLi9kZWJ1Zy9yZW5kZXJDb3VudGVyJztcbmltcG9ydCB0eXBlIHsgQmlkIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgZm9ybWF0UnVwZWVzIH0gZnJvbSAnLi4vdXRpbHMvbW9uZXknO1xuXG5pbnRlcmZhY2UgQmlkUm93UHJvcHMge1xuICBiaWQ6IEJpZDtcbiAgcmFuazogbnVtYmVyO1xuICBzZWxlY3RlZDogYm9vbGVhbjtcbiAgLyoqIFN0YWJsZSBhY3Jvc3MgcmVuZGVyczogdGhlIHJvdyBjYWxscyBpdCB3aXRoIGl0cyBvd24gaWQuICovXG4gIG9uU2VsZWN0OiAoaWQ6IHN0cmluZykgPT4gdm9pZDtcbn1cblxuLy8gRklYOiBSZWFjdC5tZW1vIGNvbXBhcmVzIHByb3BzIGJ5IGlkZW50aXR5LiBBIG5ldyBgb25QcmVzc2AgY2xvc3VyZSBhbmQgYSBuZXcgYHN0eWxlYCBvYmplY3Qgb25cbi8vIGV2ZXJ5IHJlbmRlciBtYWRlIGV2ZXJ5IHJvdyByZS1yZW5kZXIgb24gZXZlcnkgcGFyZW50IHJlbmRlciAoZXZlcnkgY291bnRkb3duIHRpY2ssIGV2ZXJ5IGJpZCkuXG4vLyBSb3dzIG5vdyBnZXQgb25seSBzdGFibGUgcHJvcHM6IGRhdGEsIHJhbmssIGEgYm9vbGVhbiwgYW5kIGEgc3RhYmxlIG9uU2VsZWN0KGlkKS5cbmV4cG9ydCBjb25zdCBCaWRSb3cgPSBSZWFjdC5tZW1vKGZ1bmN0aW9uIEJpZFJvdyh7IGJpZCwgcmFuaywgc2VsZWN0ZWQsIG9uU2VsZWN0IH06IEJpZFJvd1Byb3BzKSB7XG4gIHRyYWNrUmVuZGVyKGBCaWRSb3c6JHtiaWQuaWR9YCk7XG4gIHJldHVybiAoXG4gICAgPFByZXNzYWJsZVxuICAgICAgdGVzdElEPXtgYmlkLSR7YmlkLmlkfWB9XG4gICAgICBvblByZXNzPXsoKSA9PiBvblNlbGVjdChiaWQuaWQpfVxuICAgICAgc3R5bGU9e1tzdHlsZXMucm93LCBzZWxlY3RlZCA/IHN0eWxlcy5zZWxlY3RlZCA6IHN0eWxlcy51bnNlbGVjdGVkXX1cbiAgICA+XG4gICAgICA8VGV4dD4je3Jhbmt9PC9UZXh0PlxuICAgICAgPFRleHQgc3R5bGU9e3N0eWxlcy5zdXBwbGllcn0+e2JpZC5zdXBwbGllcn08L1RleHQ+XG4gICAgICA8VGV4dCB0ZXN0SUQ9e2BiaWQtJHtiaWQuaWR9LWFtb3VudGB9Pntmb3JtYXRSdXBlZXMoYmlkLmFtb3VudE1pbm9yIC8gMTAwKX08L1RleHQ+XG4gICAgICB7c2VsZWN0ZWQgJiYgPFRleHQgdGVzdElEPXtgYmlkLSR7YmlkLmlkfS1zZWxlY3RlZGB9PlNlbGVjdGVkPC9UZXh0Pn1cbiAgICA8L1ByZXNzYWJsZT5cbiAgKTtcbn0pO1xuXG5leHBvcnQgY29uc3QgQmlkQm9hcmQgPSBSZWFjdC5tZW1vKGZ1bmN0aW9uIEJpZEJvYXJkKHtcbiAgYmlkcyxcbiAgc2VsZWN0ZWRJZCxcbiAgb25TZWxlY3QsXG59OiB7XG4gIGJpZHM6IEJpZFtdO1xuICBzZWxlY3RlZElkOiBzdHJpbmcgfCBudWxsO1xuICBvblNlbGVjdDogKGlkOiBzdHJpbmcpID0+IHZvaWQ7XG59KSB7XG4gIGNvbnN0IHJlbmRlckl0ZW0gPSB1c2VDYWxsYmFjazxMaXN0UmVuZGVySXRlbTxCaWQ+PihcbiAgICAoeyBpdGVtLCBpbmRleCB9KSA9PiAoXG4gICAgICA8QmlkUm93IGJpZD17aXRlbX0gcmFuaz17aW5kZXggKyAxfSBzZWxlY3RlZD17aXRlbS5pZCA9PT0gc2VsZWN0ZWRJZH0gb25TZWxlY3Q9e29uU2VsZWN0fSAvPlxuICAgICksXG4gICAgW3NlbGVjdGVkSWQsIG9uU2VsZWN0XSxcbiAgKTtcbiAgcmV0dXJuIDxGbGF0TGlzdCB0ZXN0SUQ9XCJiaWQtYm9hcmRcIiBkYXRhPXtiaWRzfSBrZXlFeHRyYWN0b3I9eyhiKSA9PiBiLmlkfSByZW5kZXJJdGVtPXtyZW5kZXJJdGVtfSAvPjtcbn0pO1xuXG5jb25zdCBzdHlsZXMgPSBTdHlsZVNoZWV0LmNyZWF0ZSh7XG4gIHJvdzogeyBmbGV4RGlyZWN0aW9uOiAncm93JywgcGFkZGluZ1ZlcnRpY2FsOiAxMCwgcGFkZGluZ0hvcml6b250YWw6IDE2IH0sXG4gIHNlbGVjdGVkOiB7IG9wYWNpdHk6IDEgfSxcbiAgdW5zZWxlY3RlZDogeyBvcGFjaXR5OiAwLjkgfSxcbiAgc3VwcGxpZXI6IHsgZmxleDogMSwgbWFyZ2luSG9yaXpvbnRhbDogOCB9LFxufSk7XG4ifSx7InBhdGgiOiJzcmMvc2NyZWVucy9BdWN0aW9uU2NyZWVuLnRzeCIsImNvbnRlbnQiOiJpbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2ssIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgUHJlc3NhYmxlLCBUZXh0LCBUZXh0SW5wdXQsIFZpZXcgfSBmcm9tICdyZWFjdC1uYXRpdmUnO1xuaW1wb3J0IHsgQmlkQm9hcmQgfSBmcm9tICcuLi9jb21wb25lbnRzL0JpZEJvYXJkJztcbmltcG9ydCB7IGZvcm1hdFJlbWFpbmluZywgdXNlQ291bnRkb3duIH0gZnJvbSAnLi4vaG9va3MvdXNlQ291bnRkb3duJztcbmltcG9ydCB7IHVzZUJpZEZlZWQsIHVzZU9uRm9yZWdyb3VuZCB9IGZyb20gJy4uL2hvb2tzL3VzZUF1Y3Rpb25MaXN0ZW5lcnMnO1xuaW1wb3J0IHR5cGUgeyBBdWN0aW9uU29ja2V0IH0gZnJvbSAnLi4vcmVhbHRpbWUvYXVjdGlvblNvY2tldCc7XG5pbXBvcnQgdHlwZSB7IEJpZCB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IGZvcm1hdFJ1cGVlcywgaXNWYWxpZEJpZCwgcGFyc2VSdXBlZXMgfSBmcm9tICcuLi91dGlscy9tb25leSc7XG5cbi8qKiBNaW5pbXVtIGFtb3VudCAocnVwZWVzKSBhIG5ldyBiaWQgbXVzdCB1bmRlcmN1dCB0aGUgYmVzdCBiaWQgYnkuICovXG5leHBvcnQgY29uc3QgTUlOX0RFQ1JFTUVOVCA9IDAuMTtcblxuZXhwb3J0IGZ1bmN0aW9uIEF1Y3Rpb25TY3JlZW4oe1xuICBzb2NrZXQsXG4gIGluaXRpYWxCaWRzLFxuICBjbG9zZXNBdCxcbiAgb25QbGFjZUJpZCxcbiAgb25SZXN5bmMsXG59OiB7XG4gIHNvY2tldDogQXVjdGlvblNvY2tldDtcbiAgaW5pdGlhbEJpZHM6IEJpZFtdO1xuICBjbG9zZXNBdDogbnVtYmVyO1xuICBvblBsYWNlQmlkOiAoYW1vdW50TWlub3I6IG51bWJlcikgPT4gdm9pZDtcbiAgb25SZXN5bmM6ICgpID0+IHZvaWQ7XG59KSB7XG4gIGNvbnN0IFtiaWRzLCBzZXRCaWRzXSA9IHVzZVN0YXRlKGluaXRpYWxCaWRzKTtcbiAgY29uc3QgW3NlbGVjdGVkSWQsIHNldFNlbGVjdGVkSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtpbnB1dCwgc2V0SW5wdXRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCB7IHJlbWFpbmluZywgY2xvc2VkIH0gPSB1c2VDb3VudGRvd24oY2xvc2VzQXQpO1xuXG4gIHVzZUJpZEZlZWQoc29ja2V0LCAoYmlkKSA9PiBzZXRCaWRzKChjdXJyZW50KSA9PiBbLi4uY3VycmVudCwgYmlkXS5zb3J0KChhLCBiKSA9PiBhLmFtb3VudE1pbm9yIC0gYi5hbW91bnRNaW5vcikpKTtcbiAgdXNlT25Gb3JlZ3JvdW5kKG9uUmVzeW5jKTtcbiAgLy8gRklYOiBhIHN0YWJsZSBjYWxsYmFjayAod2l0aCB0aGUgbWVtb2lzZWQgYm9hcmQvcm93cykgc28gYSBjb3VudGRvd24gdGljayBkb2Vzbid0IHJlLXJlbmRlciByb3dzLlxuICBjb25zdCBzZWxlY3QgPSB1c2VDYWxsYmFjaygoaWQ6IHN0cmluZykgPT4gc2V0U2VsZWN0ZWRJZChpZCksIFtdKTtcblxuICBjb25zdCBiZXN0ID0gYmlkcy5sZW5ndGggPyBiaWRzWzBdIS5hbW91bnRNaW5vciAvIDEwMCA6IEluZmluaXR5O1xuICBjb25zdCBhbW91bnQgPSBwYXJzZVJ1cGVlcyhpbnB1dCk7XG4gIGNvbnN0IGNhbkJpZCA9ICFjbG9zZWQgJiYgYW1vdW50ICE9PSBudWxsICYmIGlzVmFsaWRCaWQoYW1vdW50LCBiZXN0LCBNSU5fREVDUkVNRU5UKTtcblxuICByZXR1cm4gKFxuICAgIDxWaWV3PlxuICAgICAgPFRleHQgdGVzdElEPVwiY291bnRkb3duXCI+e2Nsb3NlZCA/ICdBdWN0aW9uIGNsb3NlZCcgOiBmb3JtYXRSZW1haW5pbmcocmVtYWluaW5nKX08L1RleHQ+XG4gICAgICA8VGV4dCB0ZXN0SUQ9XCJiZXN0XCI+e051bWJlci5pc0Zpbml0ZShiZXN0KSA/IGZvcm1hdFJ1cGVlcyhiZXN0KSA6ICfigJQnfTwvVGV4dD5cbiAgICAgIDxCaWRCb2FyZCBiaWRzPXtiaWRzfSBzZWxlY3RlZElkPXtzZWxlY3RlZElkfSBvblNlbGVjdD17c2VsZWN0fSAvPlxuICAgICAgPFRleHRJbnB1dCB0ZXN0SUQ9XCJhbW91bnRcIiB2YWx1ZT17aW5wdXR9IG9uQ2hhbmdlVGV4dD17c2V0SW5wdXR9IGtleWJvYXJkVHlwZT1cImRlY2ltYWwtcGFkXCIgLz5cbiAgICAgIDxQcmVzc2FibGVcbiAgICAgICAgdGVzdElEPVwicGxhY2UtYmlkXCJcbiAgICAgICAgZGlzYWJsZWQ9eyFjYW5CaWR9XG4gICAgICAgIG9uUHJlc3M9eygpID0+IGFtb3VudCAhPT0gbnVsbCAmJiBvblBsYWNlQmlkKE1hdGgucm91bmQoYW1vdW50ICogMTAwKSl9XG4gICAgICA+XG4gICAgICAgIDxUZXh0PlBsYWNlIGJpZDwvVGV4dD5cbiAgICAgIDwvUHJlc3NhYmxlPlxuICAgIDwvVmlldz5cbiAgKTtcbn1cbiJ9XQ==', 'base64'), 'UTF8'))::jsonb
  ) on conflict (question_id) do update set notes_md = excluded.notes_md, files = excluded.files;
  if v_installed is null then
    raise notice 'Question "rn-live-auction": installed (version 3)';
  else
    raise notice 'Question "rn-live-auction": updated from version % to 3', v_installed;
  end if;
end
$question$;

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- Question "PO Approvals: transactions, idempotency and concurrency (Spring Boot)". Safe to re-run: what is already installed and up to date is left untouched.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Question: spring-po-approvals (version 3)
do $question$
declare
  v_installed int;
begin
  select version into v_installed from public.questions where id = '04a206ea-655a-40fd-9651-b01088d59d98';
  if v_installed >= 3 then
    raise notice 'Question "spring-po-approvals": version % installed, left unchanged', v_installed;
    return;
  end if;
  insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status, version) values (
    '04a206ea-655a-40fd-9651-b01088d59d98', 'spring-po-approvals', 'PO Approvals: transactions, idempotency and concurrency (Spring Boot)', 'Spring Boot debugging', array['lead-react-native-developer', 'full-stack-developer', 'java-developer']::text[], array['spring-boot', 'spring-data-jpa', 'hibernate', 'transactions', 'idempotency', 'concurrency', 'postgresql']::text[], 'hard', 45,
    convert_from(decode('IyMgUE8gQXBwcm92YWxzIHNlcnZpY2U6IGFwcHJvdmFscyB0aGF0IHNob3VsZG4ndCBoYXZlIGhhcHBlbmVkCgpBcHByb3ZlcnMgdXNlIHRoZSBaeWN1cyBwcm9jdXJlbWVudCBhcHAgdG8gYXBwcm92ZSBvciByZWplY3QgKipwdXJjaGFzZSBvcmRlcnMgKFBPcykqKiwgb25lIGF0IGEKdGltZSBvciBpbiBhIGJhdGNoLCBhbmQgZmluYW5jZSBtYXRjaGVzIHN1cHBsaWVyIGludm9pY2VzIGFnYWluc3QgdGhlbS4gVGhlIGJhY2tlbmQgaXMgdGhpcwpTcHJpbmcgQm9vdCAzLjMgc2VydmljZSAoSmF2YSAyMSwgU3ByaW5nIERhdGEgSlBBIC8gSGliZXJuYXRlIDYsIFBvc3RncmVTUUw7CmBzcHJpbmcuanBhLm9wZW4taW4tdmlld2AgaXMgb2ZmKS4KCiMjIyBCdXNpbmVzcyBydWxlcwoKLSBBIFBPIGFib3ZlICoq4oK5MTAsMDAsMDAwKiogbmVlZHMgYXBwcm92YWxzIGZyb20gKip0d28gZGlmZmVyZW50IHBlb3BsZSoqOyBzbWFsbGVyIFBPcyBuZWVkIG9uZS4KLSBXaGVuIGEgUE8gYmVjb21lcyAqQXBwcm92ZWQqLCBpdHMgYnVkZ2V0IGlzIHJlc2VydmVkIChgQnVkZ2V0U2VydmljZWAsIHNhbWUgZGF0YWJhc2UpLiBJZiB0aGUKICBjb3N0IGNlbnRyZSBpcyBvdXQgb2YgYnVkZ2V0IHRoZSBhcHByb3ZhbCAqKm11c3Qgbm90IGhhcHBlbioqIChIVFRQIDQyMikuCi0gYFBPU1QgL2FwcHJvdmVgIGNhcnJpZXMgYW4gYElkZW1wb3RlbmN5LUtleWAuIFRoZSBhcHAgcmV0cmllcyBvbiB0aW1lb3V0cywgc29tZXRpbWVzIHNldmVyYWwKICByZXRyaWVzIGF0IG9uY2UuIEtleXMgYXJlIGdlbmVyYXRlZCBvbiB0aGUgcGhvbmUgYW5kIGFyZSBvbmx5IHVuaXF1ZSAqKnBlciB1c2VyKiouCi0gSW4gYSBiYXRjaCwgZWFjaCBQTyBzdWNjZWVkcyBvciBmYWlscyBvbiBpdHMgb3duLgotIFRoZSBpbmJveCBpcyBuZXdlc3QgZmlyc3QsIGFuZCBpdHMgcGFnZXMgYXJlIG51bWJlcmVkICoqZnJvbSAxKiouCgojIyMgQnVnIHJlcG9ydHMKCjEuICoqIkkgcmVqZWN0ZWQgaXQgYW5kIGl0IGNhbWUgYmFjay4iKiogUmVqZWN0IGFuc3dlcnMgMjAwIHdpdGggc3RhdHVzICpSZWplY3RlZCosIGJ1dCBhZnRlciBhCiAgIHJlZnJlc2ggdGhlIFBPIGlzICpQZW5kaW5nKiBhZ2Fpbi4gTm90aGluZyBpbiB0aGUgbG9ncy4KMi4gKioiRmluYW5jZSBmb3VuZCBhcHByb3ZlZCBQT3Mgd2l0aCBubyBidWRnZXQuIioqIEFwcHJvdmluZyBhIFBPIHdob3NlIGNvc3QgY2VudHJlIGlzIG91dCBvZgogICBidWRnZXQgcmV0dXJucyA0MjIsIHlldCB0aGUgUE8gZW5kcyB1cCAqQXBwcm92ZWQqLiBCYXRjaCBhcHByb3ZhbCBsaXN0cyBzdWNoIFBPcyB1bmRlcgogICAqZmFpbHVyZXMqLCBidXQgdGhleSBhcmUgYXBwcm92ZWQgdG9vLiBBbmQgb25lIFBPIHRoYXQgY2FuJ3QgYmUgYXBwcm92ZWQgKGUuZy4gYWxyZWFkeQogICBhcHByb3ZlZCkgbWFrZXMgdGhlIHdob2xlIGJhdGNoIGZhaWwuCjMuICoqIuKCuTQwIGxha2ggUE9zIGFwcHJvdmVkIGJ5IGEgc2luZ2xlIHBlcnNvbi4iKiogVGhlIGF1ZGl0IGZvdW5kIHNldmVyYWwgd2F5cyBpdCBoYXBwZW5zOgogICAtIGEgdGltZWQtb3V0IHJlcXVlc3QgdGhhdCB0aGUgYXBwIHJldHJpZWQgd2FzIGNvdW50ZWQgdHdpY2U7CiAgIC0gb25lIGFwcHJvdmVyIGFwcHJvdmVkIHRoZSBzYW1lIFBPIHR3aWNlOwogICAtIHdoZW4gdHdvIGFwcHJvdmVycyB0YXBwZWQgKkFwcHJvdmUqIGF0IHRoZSBzYW1lIG1vbWVudCwgYm90aCBzdWNjZWVkZWQgYW5kIHRoZSBidWRnZXQgd2FzCiAgICAgcmVzZXJ2ZWQgdHdpY2U7CiAgIC0gYW4gYXBwcm92ZXIgZ290ICphbm90aGVyIGFwcHJvdmVyJ3MqIFBPIGJhY2sgZnJvbSBgL2FwcHJvdmVgLCBhbmQgcmV1c2luZyBhIGtleSBvbiBhCiAgICAgZGlmZmVyZW50IFBPIHNpbGVudGx5IHJldHVybmVkIHRoZSBmaXJzdCBQTy4KNC4gKioiSW52b2ljZXMgdGhhdCBtYXRjaCBhcmUgZmxhZ2dlZCwgYW5kIGFuIG92ZXItaW52b2ljZSBwYXNzZWQuIioqIEFuIGludm9pY2UgZm9yCiAgIOKCuTEsNTAwLjAgaXMgZmxhZ2dlZCBhZ2FpbnN0IGEgUE8gdG90YWwgb2Yg4oK5MSw1MDAuMDAuIEFuIGludm9pY2UgdGhhdCBiaWxscyA1ICsgNSB1bml0cyBvZiBhIFNLVQogICBvbiB0d28gbGluZXMgcGFzc2VkIGFnYWluc3QgOCBvcmRlcmVkLiBTaW5jZSBvcGVuLWluLXZpZXcgd2FzIHN3aXRjaGVkIG9mZiwgKm1hdGNoLWludm9pY2UqCiAgIHJldHVybnMgNTAwIGZvciBldmVyeSBQTy4KNS4gKioiVGhlIGluYm94IHNraXBzIHRoZSBuZXdlc3QgUE9zLiIqKiBQYWdlIDEgc2hvd3Mgd2hhdCBzaG91bGQgYmUgcGFnZSAyLCBhbmQgUE9zIHJlcGVhdCBvciBnbwogICBtaXNzaW5nIGJldHdlZW4gcGFnZXMuIFdpdGggNDBrIFBPcyB0aGUgZW5kcG9pbnQgZ290IHNsb3cgYW5kIG1lbW9yeSBzcGlrZWQ7IHRoZSBsb2cgc2hvd3MKICAgYEhISDkwMDAzMDA0OiBmaXJzdFJlc3VsdC9tYXhSZXN1bHRzIHNwZWNpZmllZCB3aXRoIGNvbGxlY3Rpb24gZmV0Y2g7IGFwcGx5aW5nIGluIG1lbW9yeWAuCgojIyMgV2hhdCB0byBkbwoKLSAqKk5vdGhpbmcgdG8gaW5zdGFsbC4qKiBKYXZhIGNhbid0IHJ1biBpbiB0aGUgYnJvd3Nlciwgc28gKipSdW4gdGVzdHMqKiBydW5zIGNoZWNrcyB0aGF0IHJlYWQKICB5b3VyIGNvZGUncyBzdHJ1Y3R1cmUgKGFubm90YXRpb25zLCB0cmFuc2FjdGlvbnMsIHF1ZXJpZXMsIG1ldGhvZCBib2RpZXM7IGNvbW1lbnRzIGFyZSBpZ25vcmVkKS4KICBUaGUgZWRpdG9yIGFsc28gY2hlY2tzIHRoZSBKYXZhIHN5bnRheC4gUmVhc29uIGFib3V0IGhvdyBTcHJpbmcncyBwcm94aWVzLCB0cmFuc2FjdGlvbnMgYW5kCiAgSGliZXJuYXRlIGJlaGF2ZS4KLSBgY2hlY2tzL2AgYW5kIGBzcmMvdGVzdC9qYXZhYCBhcmUgKipyZWFkLW9ubHkqKiBhbmQgZGVzY3JpYmUgdGhlIGV4cGVjdGVkIGJlaGF2aW91ci4gUmV2aWV3ZXJzCiAgYWxzbyBydW4gdGhlIEpVbml0IHRlc3RzIChgbXZuIHZlcmlmeWAsIFBvc3RncmVTUUwgdmlhIFRlc3Rjb250YWluZXJzKSBhZ2FpbnN0IHlvdXIgY29kZS4KLSBGaXggdGhlICoqcm9vdCBjYXVzZXMqKiBhbmQga2VlcCB0aGUgQVBJIGNvbnRyYWN0LiBZb3UgY2FuJ3QgYWRkIGZpbGVzIG9yIGRlcGVuZGVuY2llczsgbmVzdGVkCiAgY2xhc3NlcyBhcmUgZmluZS4KLSBXaGVyZSBhIGZpeCBuZWVkcyBhIHNjaGVtYSBjaGFuZ2UsIGFkZCBhIG9uZS1saW5lIGNvbW1lbnQgc2F5aW5nIHNvIChyZXZpZXdlcnMgd3JpdGUgdGhlCiAgbWlncmF0aW9uKS4KCipUaW1lIGd1aWRlOiBhYm91dCA0NSBtaW51dGVzLioK', 'base64'), 'UTF8'),
    false, 'published', 3
  ) on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, category = excluded.category,
    role_tags = excluded.role_tags, skill_tags = excluded.skill_tags, difficulty = excluded.difficulty,
    time_suggestion_minutes = excluded.time_suggestion_minutes, statement_md = excluded.statement_md,
    is_sample = excluded.is_sample, status = excluded.status, version = excluded.version;
  delete from public.question_files where question_id = '04a206ea-655a-40fd-9651-b01088d59d98' and path <> all (array['src/main/java/com/zycus/procurement/po/ApprovalService.java', 'src/main/java/com/zycus/procurement/po/PurchaseOrderController.java', 'src/main/java/com/zycus/procurement/po/InvoiceMatcher.java', 'src/main/java/com/zycus/procurement/po/PurchaseOrderRepository.java', 'src/main/java/com/zycus/procurement/po/IdempotencyRecordRepository.java', 'src/main/java/com/zycus/procurement/po/PurchaseOrder.java', 'src/main/java/com/zycus/procurement/po/IdempotencyRecord.java', 'src/main/java/com/zycus/procurement/po/ApiExceptionHandler.java', 'src/main/java/com/zycus/procurement/po/PurchaseOrderLine.java', 'src/main/java/com/zycus/procurement/po/PoStatus.java', 'src/main/java/com/zycus/procurement/po/Dtos.java', 'src/main/java/com/zycus/procurement/po/BudgetService.java', 'src/main/java/com/zycus/procurement/po/BudgetExceededException.java', 'src/main/java/com/zycus/procurement/po/PoNotFoundException.java', 'src/main/resources/application.yml', 'src/test/java/com/zycus/procurement/po/ApprovalServiceIT.java', 'src/test/java/com/zycus/procurement/po/InvoiceMatcherTest.java', 'checks/transactions.test.ts', 'checks/approvals.test.ts', 'checks/invoices.test.ts', 'checks/inbox.test.ts', 'checks/support/java.ts', 'pom.xml']::text[]);
  insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/ApprovalService.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuQmF0Y2hSZXN1bHQ7CmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5QdXJjaGFzZU9yZGVyRHRvOwppbXBvcnQgamF2YS51dGlsLkxpc3Q7CmltcG9ydCBqYXZhLnV0aWwuT3B0aW9uYWw7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlBhZ2U7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlBhZ2VhYmxlOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5zdGVyZW90eXBlLlNlcnZpY2U7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLnRyYW5zYWN0aW9uLmFubm90YXRpb24uUHJvcGFnYXRpb247CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLnRyYW5zYWN0aW9uLmFubm90YXRpb24uVHJhbnNhY3Rpb25hbDsKCkBTZXJ2aWNlCkBUcmFuc2FjdGlvbmFsKHJlYWRPbmx5ID0gdHJ1ZSkKcHVibGljIGNsYXNzIEFwcHJvdmFsU2VydmljZSB7CgogICAgcHJpdmF0ZSBmaW5hbCBQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBvcmRlcnM7CiAgICBwcml2YXRlIGZpbmFsIElkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSBpZGVtcG90ZW5jeTsKICAgIHByaXZhdGUgZmluYWwgQnVkZ2V0U2VydmljZSBidWRnZXQ7CgogICAgcHVibGljIEFwcHJvdmFsU2VydmljZShQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBvcmRlcnMsIElkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSBpZGVtcG90ZW5jeSwKICAgICAgICAgICAgICAgICAgICAgICAgICAgQnVkZ2V0U2VydmljZSBidWRnZXQpIHsKICAgICAgICB0aGlzLm9yZGVycyA9IG9yZGVyczsKICAgICAgICB0aGlzLmlkZW1wb3RlbmN5ID0gaWRlbXBvdGVuY3k7CiAgICAgICAgdGhpcy5idWRnZXQgPSBidWRnZXQ7CiAgICB9CgogICAgcHVibGljIFBhZ2U8UHVyY2hhc2VPcmRlckR0bz4gbGlzdChQYWdlYWJsZSBwYWdlYWJsZSkgewogICAgICAgIHJldHVybiBvcmRlcnMuZmluZFBhZ2VXaXRoTGluZXMocGFnZWFibGUpLm1hcChQdXJjaGFzZU9yZGVyRHRvOjpmcm9tKTsKICAgIH0KCiAgICAvKioKICAgICAqIEFwcHJvdmVzIGEgUE8uIFRoZSBtb2JpbGUgYXBwIHNlbmRzIGFuIElkZW1wb3RlbmN5LUtleSBhbmQgcmV0cmllcyBvbiB0aW1lb3V0cywgc28gdGhlIHNhbWUKICAgICAqIHJlcXVlc3QgbWF5IGFycml2ZSBtb3JlIHRoYW4gb25jZSAoYW5kIHNvbWV0aW1lcyBhdCB0aGUgc2FtZSB0aW1lKS4KICAgICAqLwogICAgQFRyYW5zYWN0aW9uYWwKICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyRHRvIGFwcHJvdmUobG9uZyBwb0lkLCBTdHJpbmcgYXBwcm92ZXJJZCwgU3RyaW5nIGlkZW1wb3RlbmN5S2V5KQogICAgICAgICAgICB0aHJvd3MgQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24gewogICAgICAgIE9wdGlvbmFsPElkZW1wb3RlbmN5UmVjb3JkPiBwcmV2aW91cyA9IGlkZW1wb3RlbmN5LmZpbmRCeUtleShpZGVtcG90ZW5jeUtleSk7CiAgICAgICAgaWYgKHByZXZpb3VzLmlzUHJlc2VudCgpKSB7CiAgICAgICAgICAgIHJldHVybiBQdXJjaGFzZU9yZGVyRHRvLmZyb20oZmluZChwcmV2aW91cy5nZXQoKS5nZXRQdXJjaGFzZU9yZGVySWQoKSkpOwogICAgICAgIH0KICAgICAgICBQdXJjaGFzZU9yZGVyIHBvID0gZmluZChwb0lkKTsKICAgICAgICBwby5yZWNvcmRBcHByb3ZhbCgpOwogICAgICAgIGlmIChwby5nZXRTdGF0dXMoKSA9PSBQb1N0YXR1cy5BUFBST1ZFRCkgewogICAgICAgICAgICBidWRnZXQucmVzZXJ2ZShwby5nZXRJZCgpLCBwby5nZXRUb3RhbCgpKTsKICAgICAgICB9CiAgICAgICAgaWRlbXBvdGVuY3kuc2F2ZShuZXcgSWRlbXBvdGVuY3lSZWNvcmQoaWRlbXBvdGVuY3lLZXksIGFwcHJvdmVySWQsIHBvSWQsIHBvLmdldFN0YXR1cygpLm5hbWUoKSkpOwogICAgICAgIHJldHVybiBQdXJjaGFzZU9yZGVyRHRvLmZyb20ocG8pOwogICAgfQoKICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyRHRvIHJlamVjdChsb25nIHBvSWQsIFN0cmluZyBhcHByb3ZlcklkLCBTdHJpbmcgcmVhc29uKSB7CiAgICAgICAgUHVyY2hhc2VPcmRlciBwbyA9IGZpbmQocG9JZCk7CiAgICAgICAgcG8ucmVqZWN0KHJlYXNvbik7CiAgICAgICAgcmV0dXJuIFB1cmNoYXNlT3JkZXJEdG8uZnJvbShwbyk7CiAgICB9CgogICAgLyoqIEFwcHJvdmVzIHNldmVyYWwgUE9zOyBvbmUgUE8gZmFpbGluZyAoZS5nLiBvdXQgb2YgYnVkZ2V0KSBtdXN0IG5vdCBhZmZlY3QgdGhlIG90aGVycy4gKi8KICAgIEBUcmFuc2FjdGlvbmFsCiAgICBwdWJsaWMgQmF0Y2hSZXN1bHQgYXBwcm92ZUJhdGNoKExpc3Q8TG9uZz4gaWRzLCBTdHJpbmcgYXBwcm92ZXJJZCkgewogICAgICAgIEJhdGNoUmVzdWx0IHJlc3VsdCA9IG5ldyBCYXRjaFJlc3VsdCgpOwogICAgICAgIGZvciAoTG9uZyBpZCA6IGlkcykgewogICAgICAgICAgICB0cnkgewogICAgICAgICAgICAgICAgYXBwcm92ZU9uZShpZCk7CiAgICAgICAgICAgICAgICByZXN1bHQuYXBwcm92ZWQoaWQpOwogICAgICAgICAgICB9IGNhdGNoIChCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbiBlKSB7CiAgICAgICAgICAgICAgICByZXN1bHQuZmFpbGVkKGlkLCBlLmdldE1lc3NhZ2UoKSk7CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAgcmV0dXJuIHJlc3VsdDsKICAgIH0KCiAgICBAVHJhbnNhY3Rpb25hbChwcm9wYWdhdGlvbiA9IFByb3BhZ2F0aW9uLlJFUVVJUkVTX05FVykKICAgIHB1YmxpYyB2b2lkIGFwcHJvdmVPbmUobG9uZyBpZCkgdGhyb3dzIEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uIHsKICAgICAgICBQdXJjaGFzZU9yZGVyIHBvID0gZmluZChpZCk7CiAgICAgICAgcG8ucmVjb3JkQXBwcm92YWwoKTsKICAgICAgICBpZiAocG8uZ2V0U3RhdHVzKCkgPT0gUG9TdGF0dXMuQVBQUk9WRUQpIHsKICAgICAgICAgICAgYnVkZ2V0LnJlc2VydmUoaWQsIHBvLmdldFRvdGFsKCkpOwogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRlIFB1cmNoYXNlT3JkZXIgZmluZChsb25nIGlkKSB7CiAgICAgICAgcmV0dXJuIG9yZGVycy5maW5kQnlJZChpZCkub3JFbHNlVGhyb3coKCkgLT4gbmV3IFBvTm90Rm91bmRFeGNlcHRpb24oaWQpKTsKICAgIH0KfQo=', 'base64'), 'UTF8'), false, 0),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PurchaseOrderController.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuQmF0Y2hSZXF1ZXN0OwppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuQmF0Y2hSZXN1bHQ7CmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5JbnZvaWNlUmVxdWVzdDsKaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLk1hdGNoUmVzdWx0OwppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuUHVyY2hhc2VPcmRlckR0bzsKaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLlJlamVjdFJlcXVlc3Q7CmltcG9ydCBqYXZhLnNlY3VyaXR5LlByaW5jaXBhbDsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5kb21haW4uUGFnZTsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5kb21haW4uUGFnZVJlcXVlc3Q7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uR2V0TWFwcGluZzsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5QYXRoVmFyaWFibGU7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUG9zdE1hcHBpbmc7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUmVxdWVzdEJvZHk7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUmVxdWVzdEhlYWRlcjsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5SZXF1ZXN0TWFwcGluZzsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5SZXF1ZXN0UGFyYW07CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUmVzdENvbnRyb2xsZXI7CgpAUmVzdENvbnRyb2xsZXIKQFJlcXVlc3RNYXBwaW5nKCIvYXBpL3BvcyIpCnB1YmxpYyBjbGFzcyBQdXJjaGFzZU9yZGVyQ29udHJvbGxlciB7CgogICAgcHJpdmF0ZSBmaW5hbCBBcHByb3ZhbFNlcnZpY2UgYXBwcm92YWxzOwogICAgcHJpdmF0ZSBmaW5hbCBQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBvcmRlcnM7CiAgICBwcml2YXRlIGZpbmFsIEludm9pY2VNYXRjaGVyIG1hdGNoZXI7CgogICAgcHVibGljIFB1cmNoYXNlT3JkZXJDb250cm9sbGVyKEFwcHJvdmFsU2VydmljZSBhcHByb3ZhbHMsIFB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IG9yZGVycywgSW52b2ljZU1hdGNoZXIgbWF0Y2hlcikgewogICAgICAgIHRoaXMuYXBwcm92YWxzID0gYXBwcm92YWxzOwogICAgICAgIHRoaXMub3JkZXJzID0gb3JkZXJzOwogICAgICAgIHRoaXMubWF0Y2hlciA9IG1hdGNoZXI7CiAgICB9CgogICAgLyoqIFRoZSBpbmJveCwgbmV3ZXN0IGZpcnN0LiBQYWdlcyBhcmUgbnVtYmVyZWQgZnJvbSAxICh0aGUgbW9iaWxlIGFwcCdzIGNvbnRyYWN0KS4gKi8KICAgIEBHZXRNYXBwaW5nCiAgICBwdWJsaWMgUGFnZTxQdXJjaGFzZU9yZGVyRHRvPiBsaXN0KEBSZXF1ZXN0UGFyYW0oZGVmYXVsdFZhbHVlID0gIjEiKSBpbnQgcGFnZSwKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQFJlcXVlc3RQYXJhbShkZWZhdWx0VmFsdWUgPSAiMjAiKSBpbnQgc2l6ZSkgewogICAgICAgIHJldHVybiBhcHByb3ZhbHMubGlzdChQYWdlUmVxdWVzdC5vZihwYWdlLCBzaXplKSk7CiAgICB9CgogICAgQFBvc3RNYXBwaW5nKCIve2lkfS9hcHByb3ZlIikKICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyRHRvIGFwcHJvdmUoQFBhdGhWYXJpYWJsZSBsb25nIGlkLCBAUmVxdWVzdEhlYWRlcigiSWRlbXBvdGVuY3ktS2V5IikgU3RyaW5nIGtleSwKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsIHVzZXIpIHRocm93cyBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbiB7CiAgICAgICAgcmV0dXJuIGFwcHJvdmFscy5hcHByb3ZlKGlkLCB1c2VyLmdldE5hbWUoKSwga2V5KTsKICAgIH0KCiAgICBAUG9zdE1hcHBpbmcoIi97aWR9L3JlamVjdCIpCiAgICBwdWJsaWMgUHVyY2hhc2VPcmRlckR0byByZWplY3QoQFBhdGhWYXJpYWJsZSBsb25nIGlkLCBAUmVxdWVzdEJvZHkgUmVqZWN0UmVxdWVzdCBib2R5LCBQcmluY2lwYWwgdXNlcikgewogICAgICAgIHJldHVybiBhcHByb3ZhbHMucmVqZWN0KGlkLCB1c2VyLmdldE5hbWUoKSwgYm9keS5yZWFzb24oKSk7CiAgICB9CgogICAgQFBvc3RNYXBwaW5nKCIvYXBwcm92ZS1iYXRjaCIpCiAgICBwdWJsaWMgQmF0Y2hSZXN1bHQgYXBwcm92ZUJhdGNoKEBSZXF1ZXN0Qm9keSBCYXRjaFJlcXVlc3QgYm9keSwgUHJpbmNpcGFsIHVzZXIpIHsKICAgICAgICByZXR1cm4gYXBwcm92YWxzLmFwcHJvdmVCYXRjaChib2R5LmlkcygpLCB1c2VyLmdldE5hbWUoKSk7CiAgICB9CgogICAgQFBvc3RNYXBwaW5nKCIve2lkfS9tYXRjaC1pbnZvaWNlIikKICAgIHB1YmxpYyBNYXRjaFJlc3VsdCBtYXRjaEludm9pY2UoQFBhdGhWYXJpYWJsZSBsb25nIGlkLCBAUmVxdWVzdEJvZHkgSW52b2ljZVJlcXVlc3QgaW52b2ljZSkgewogICAgICAgIFB1cmNoYXNlT3JkZXIgcG8gPSBvcmRlcnMuZmluZEJ5SWQoaWQpLm9yRWxzZVRocm93KCgpIC0+IG5ldyBQb05vdEZvdW5kRXhjZXB0aW9uKGlkKSk7CiAgICAgICAgcmV0dXJuIG1hdGNoZXIubWF0Y2gocG8sIGludm9pY2UpOwogICAgfQp9Cg==', 'base64'), 'UTF8'), false, 1),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/InvoiceMatcher.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuSW52b2ljZUxpbmU7CmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5JbnZvaWNlUmVxdWVzdDsKaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLk1hdGNoUmVzdWx0OwppbXBvcnQgamF2YS51dGlsLkFycmF5TGlzdDsKaW1wb3J0IGphdmEudXRpbC5MaXN0OwppbXBvcnQgamF2YS51dGlsLk1hcDsKaW1wb3J0IGphdmEudXRpbC5mdW5jdGlvbi5GdW5jdGlvbjsKaW1wb3J0IGphdmEudXRpbC5zdHJlYW0uQ29sbGVjdG9yczsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuc3RlcmVvdHlwZS5Db21wb25lbnQ7CgovKiogVHdvLXdheSBtYXRjaDogdGhlIGludm9pY2UgbXVzdCBhZ3JlZSB3aXRoIHRoZSBQTyBvbiB0b3RhbCBhbmQgb24gZXZlcnkgbGluZS4gKi8KQENvbXBvbmVudApwdWJsaWMgY2xhc3MgSW52b2ljZU1hdGNoZXIgewoKICAgIHB1YmxpYyBNYXRjaFJlc3VsdCBtYXRjaChQdXJjaGFzZU9yZGVyIHBvLCBJbnZvaWNlUmVxdWVzdCBpbnZvaWNlKSB7CiAgICAgICAgTGlzdDxTdHJpbmc+IHByb2JsZW1zID0gbmV3IEFycmF5TGlzdDw+KCk7CiAgICAgICAgaWYgKCFwby5nZXRUb3RhbCgpLmVxdWFscyhpbnZvaWNlLmFtb3VudCgpKSkgewogICAgICAgICAgICBwcm9ibGVtcy5hZGQoIkludm9pY2UgYW1vdW50ICIgKyBpbnZvaWNlLmFtb3VudCgpICsgIiBkaWZmZXJzIGZyb20gUE8gdG90YWwgIiArIHBvLmdldFRvdGFsKCkpOwogICAgICAgIH0KICAgICAgICBNYXA8U3RyaW5nLCBQdXJjaGFzZU9yZGVyTGluZT4gYnlTa3UgPSBwby5nZXRMaW5lcygpLnN0cmVhbSgpCiAgICAgICAgICAgICAgICAuY29sbGVjdChDb2xsZWN0b3JzLnRvTWFwKFB1cmNoYXNlT3JkZXJMaW5lOjpnZXRTa3UsIEZ1bmN0aW9uLmlkZW50aXR5KCkpKTsKICAgICAgICBmb3IgKEludm9pY2VMaW5lIGxpbmUgOiBpbnZvaWNlLmxpbmVzKCkpIHsKICAgICAgICAgICAgUHVyY2hhc2VPcmRlckxpbmUgcG9MaW5lID0gYnlTa3UuZ2V0KGxpbmUuc2t1KCkpOwogICAgICAgICAgICBpZiAocG9MaW5lID09IG51bGwpIHsKICAgICAgICAgICAgICAgIHByb2JsZW1zLmFkZCgiU0tVICIgKyBsaW5lLnNrdSgpICsgIiBpcyBub3Qgb24gdGhlIFBPIik7CiAgICAgICAgICAgIH0gZWxzZSBpZiAobGluZS5xdWFudGl0eSgpID4gcG9MaW5lLmdldFF1YW50aXR5KCkpIHsKICAgICAgICAgICAgICAgIHByb2JsZW1zLmFkZCgiU0tVICIgKyBsaW5lLnNrdSgpICsgIjogaW52b2ljZWQgIiArIGxpbmUucXVhbnRpdHkoKSArICIsIG9yZGVyZWQgIiArIHBvTGluZS5nZXRRdWFudGl0eSgpKTsKICAgICAgICAgICAgfSBlbHNlIGlmICghcG9MaW5lLmdldFVuaXRQcmljZSgpLmVxdWFscyhsaW5lLnVuaXRQcmljZSgpKSkgewogICAgICAgICAgICAgICAgcHJvYmxlbXMuYWRkKCJTS1UgIiArIGxpbmUuc2t1KCkgKyAiOiB1bml0IHByaWNlIGRpZmZlcnMiKTsKICAgICAgICAgICAgfQogICAgICAgIH0KICAgICAgICByZXR1cm4gTWF0Y2hSZXN1bHQub2YocHJvYmxlbXMpOwogICAgfQp9Cg==', 'base64'), 'UTF8'), false, 2),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PurchaseOrderRepository.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmRvbWFpbi5QYWdlOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmRvbWFpbi5QYWdlYWJsZTsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5qcGEucmVwb3NpdG9yeS5KcGFSZXBvc2l0b3J5OwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmpwYS5yZXBvc2l0b3J5LlF1ZXJ5OwoKcHVibGljIGludGVyZmFjZSBQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBleHRlbmRzIEpwYVJlcG9zaXRvcnk8UHVyY2hhc2VPcmRlciwgTG9uZz4gewoKICAgIC8qKiBUaGUgYXBwcm92YWxzIGluYm94OiBvbmUgcGFnZSBvZiBQT3Mgd2l0aCB0aGVpciBsaW5lcyAodGhlIGFwcCBzaG93cyBsaW5lIGNvdW50cykuICovCiAgICBAUXVlcnkodmFsdWUgPSAic2VsZWN0IGRpc3RpbmN0IHAgZnJvbSBQdXJjaGFzZU9yZGVyIHAgbGVmdCBqb2luIGZldGNoIHAubGluZXMiLAogICAgICAgICAgIGNvdW50UXVlcnkgPSAic2VsZWN0IGNvdW50KHApIGZyb20gUHVyY2hhc2VPcmRlciBwIikKICAgIFBhZ2U8UHVyY2hhc2VPcmRlcj4gZmluZFBhZ2VXaXRoTGluZXMoUGFnZWFibGUgcGFnZWFibGUpOwp9Cg==', 'base64'), 'UTF8'), false, 3),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/IdempotencyRecordRepository.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamF2YS51dGlsLk9wdGlvbmFsOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmpwYS5yZXBvc2l0b3J5LkpwYVJlcG9zaXRvcnk7CgpwdWJsaWMgaW50ZXJmYWNlIElkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSBleHRlbmRzIEpwYVJlcG9zaXRvcnk8SWRlbXBvdGVuY3lSZWNvcmQsIExvbmc+IHsKCiAgICBPcHRpb25hbDxJZGVtcG90ZW5jeVJlY29yZD4gZmluZEJ5S2V5KFN0cmluZyBrZXkpOwp9Cg==', 'base64'), 'UTF8'), false, 4),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PurchaseOrder.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5DYXNjYWRlVHlwZTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuQ29sdW1uOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5FbnRpdHk7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkVudW1UeXBlOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5FbnVtZXJhdGVkOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5GZXRjaFR5cGU7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkdlbmVyYXRlZFZhbHVlOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5HZW5lcmF0aW9uVHlwZTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuSWQ7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLk9uZVRvTWFueTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuVGFibGU7CmltcG9ydCBqYXZhLm1hdGguQmlnRGVjaW1hbDsKaW1wb3J0IGphdmEudGltZS5JbnN0YW50OwppbXBvcnQgamF2YS51dGlsLkFycmF5TGlzdDsKaW1wb3J0IGphdmEudXRpbC5MaXN0OwoKQEVudGl0eQpAVGFibGUobmFtZSA9ICJwdXJjaGFzZV9vcmRlcnMiKQpwdWJsaWMgY2xhc3MgUHVyY2hhc2VPcmRlciB7CgogICAgQElkCiAgICBAR2VuZXJhdGVkVmFsdWUoc3RyYXRlZ3kgPSBHZW5lcmF0aW9uVHlwZS5JREVOVElUWSkKICAgIHByaXZhdGUgTG9uZyBpZDsKCiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UsIHVuaXF1ZSA9IHRydWUpCiAgICBwcml2YXRlIFN0cmluZyBudW1iZXI7CgogICAgQEVudW1lcmF0ZWQoRW51bVR5cGUuU1RSSU5HKQogICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBQb1N0YXR1cyBzdGF0dXMgPSBQb1N0YXR1cy5QRU5ESU5HOwoKICAgIC8qKiBUb3RhbCBpbiBJTlIsIHNjYWxlIDIuICovCiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UsIHByZWNpc2lvbiA9IDE0LCBzY2FsZSA9IDIpCiAgICBwcml2YXRlIEJpZ0RlY2ltYWwgdG90YWw7CgogICAgLyoqIFBPcyBhYm92ZSDigrkxMCwwMCwwMDAgbmVlZCB0d28gZGlzdGluY3QgYXBwcm92ZXJzLiAqLwogICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBpbnQgYXBwcm92YWxzUmVxdWlyZWQ7CgogICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBpbnQgYXBwcm92YWxzUmVjZWl2ZWQ7CgogICAgcHJpdmF0ZSBTdHJpbmcgcmVqZWN0aW9uUmVhc29uOwoKICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSkKICAgIHByaXZhdGUgSW5zdGFudCBjcmVhdGVkQXQgPSBJbnN0YW50Lm5vdygpOwoKICAgIEBPbmVUb01hbnkobWFwcGVkQnkgPSAicHVyY2hhc2VPcmRlciIsIGNhc2NhZGUgPSBDYXNjYWRlVHlwZS5BTEwsIG9ycGhhblJlbW92YWwgPSB0cnVlLCBmZXRjaCA9IEZldGNoVHlwZS5MQVpZKQogICAgcHJpdmF0ZSBMaXN0PFB1cmNoYXNlT3JkZXJMaW5lPiBsaW5lcyA9IG5ldyBBcnJheUxpc3Q8PigpOwoKICAgIHByb3RlY3RlZCBQdXJjaGFzZU9yZGVyKCkgewogICAgfQoKICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyKFN0cmluZyBudW1iZXIsIEJpZ0RlY2ltYWwgdG90YWwpIHsKICAgICAgICB0aGlzLm51bWJlciA9IG51bWJlcjsKICAgICAgICB0aGlzLnRvdGFsID0gdG90YWw7CiAgICAgICAgdGhpcy5hcHByb3ZhbHNSZXF1aXJlZCA9IHRvdGFsLmNvbXBhcmVUbyhuZXcgQmlnRGVjaW1hbCgiMTAwMDAwMC4wMCIpKSA+IDAgPyAyIDogMTsKICAgIH0KCiAgICBwdWJsaWMgdm9pZCByZWNvcmRBcHByb3ZhbCgpIHsKICAgICAgICBpZiAoc3RhdHVzICE9IFBvU3RhdHVzLlBFTkRJTkcpIHsKICAgICAgICAgICAgdGhyb3cgbmV3IElsbGVnYWxTdGF0ZUV4Y2VwdGlvbigiUE8gIiArIG51bWJlciArICIgaXMgIiArIHN0YXR1cyk7CiAgICAgICAgfQogICAgICAgIGFwcHJvdmFsc1JlY2VpdmVkKys7CiAgICAgICAgaWYgKGFwcHJvdmFsc1JlY2VpdmVkID49IGFwcHJvdmFsc1JlcXVpcmVkKSB7CiAgICAgICAgICAgIHN0YXR1cyA9IFBvU3RhdHVzLkFQUFJPVkVEOwogICAgICAgIH0KICAgIH0KCiAgICBwdWJsaWMgdm9pZCByZWplY3QoU3RyaW5nIHJlYXNvbikgewogICAgICAgIGlmIChzdGF0dXMgIT0gUG9TdGF0dXMuUEVORElORykgewogICAgICAgICAgICB0aHJvdyBuZXcgSWxsZWdhbFN0YXRlRXhjZXB0aW9uKCJQTyAiICsgbnVtYmVyICsgIiBpcyAiICsgc3RhdHVzKTsKICAgICAgICB9CiAgICAgICAgc3RhdHVzID0gUG9TdGF0dXMuUkVKRUNURUQ7CiAgICAgICAgcmVqZWN0aW9uUmVhc29uID0gcmVhc29uOwogICAgfQoKICAgIHB1YmxpYyB2b2lkIGFkZExpbmUoUHVyY2hhc2VPcmRlckxpbmUgbGluZSkgewogICAgICAgIGxpbmVzLmFkZChsaW5lKTsKICAgICAgICBsaW5lLnNldFB1cmNoYXNlT3JkZXIodGhpcyk7CiAgICB9CgogICAgcHVibGljIExvbmcgZ2V0SWQoKSB7CiAgICAgICAgcmV0dXJuIGlkOwogICAgfQoKICAgIHB1YmxpYyBTdHJpbmcgZ2V0TnVtYmVyKCkgewogICAgICAgIHJldHVybiBudW1iZXI7CiAgICB9CgogICAgcHVibGljIFBvU3RhdHVzIGdldFN0YXR1cygpIHsKICAgICAgICByZXR1cm4gc3RhdHVzOwogICAgfQoKICAgIHB1YmxpYyBCaWdEZWNpbWFsIGdldFRvdGFsKCkgewogICAgICAgIHJldHVybiB0b3RhbDsKICAgIH0KCiAgICBwdWJsaWMgaW50IGdldEFwcHJvdmFsc1JlcXVpcmVkKCkgewogICAgICAgIHJldHVybiBhcHByb3ZhbHNSZXF1aXJlZDsKICAgIH0KCiAgICBwdWJsaWMgaW50IGdldEFwcHJvdmFsc1JlY2VpdmVkKCkgewogICAgICAgIHJldHVybiBhcHByb3ZhbHNSZWNlaXZlZDsKICAgIH0KCiAgICBwdWJsaWMgU3RyaW5nIGdldFJlamVjdGlvblJlYXNvbigpIHsKICAgICAgICByZXR1cm4gcmVqZWN0aW9uUmVhc29uOwogICAgfQoKICAgIHB1YmxpYyBJbnN0YW50IGdldENyZWF0ZWRBdCgpIHsKICAgICAgICByZXR1cm4gY3JlYXRlZEF0OwogICAgfQoKICAgIHB1YmxpYyBMaXN0PFB1cmNoYXNlT3JkZXJMaW5lPiBnZXRMaW5lcygpIHsKICAgICAgICByZXR1cm4gbGluZXM7CiAgICB9Cn0K', 'base64'), 'UTF8'), false, 5),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/IdempotencyRecord.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Db2x1bW47CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkVudGl0eTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuR2VuZXJhdGVkVmFsdWU7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkdlbmVyYXRpb25UeXBlOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5JZDsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuVGFibGU7CmltcG9ydCBqYXZhLnRpbWUuSW5zdGFudDsKCi8qKgogKiBSZW1lbWJlcnMgdGhlIHJlc3BvbnNlIHRvIGEgUE9TVCBjYXJyeWluZyBhbiBJZGVtcG90ZW5jeS1LZXkgaGVhZGVyLCBzbyBhIHJldHJ5ICh0aGUgbW9iaWxlIGFwcAogKiByZXRyaWVzIG9uIHRpbWVvdXRzKSByZXR1cm5zIHRoZSBzYW1lIHJlc3VsdCBpbnN0ZWFkIG9mIGFwcHJvdmluZyB0d2ljZS4KICovCkBFbnRpdHkKQFRhYmxlKG5hbWUgPSAiaWRlbXBvdGVuY3lfcmVjb3JkcyIpCnB1YmxpYyBjbGFzcyBJZGVtcG90ZW5jeVJlY29yZCB7CgogICAgQElkCiAgICBAR2VuZXJhdGVkVmFsdWUoc3RyYXRlZ3kgPSBHZW5lcmF0aW9uVHlwZS5JREVOVElUWSkKICAgIHByaXZhdGUgTG9uZyBpZDsKCiAgICBAQ29sdW1uKG5hbWUgPSAiaWRlbV9rZXkiLCBudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBTdHJpbmcga2V5OwoKICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSkKICAgIHByaXZhdGUgU3RyaW5nIGFwcHJvdmVySWQ7CgogICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBsb25nIHB1cmNoYXNlT3JkZXJJZDsKCiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UpCiAgICBwcml2YXRlIFN0cmluZyByZXNwb25zZVN0YXR1czsKCiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UpCiAgICBwcml2YXRlIEluc3RhbnQgY3JlYXRlZEF0ID0gSW5zdGFudC5ub3coKTsKCiAgICBwcm90ZWN0ZWQgSWRlbXBvdGVuY3lSZWNvcmQoKSB7CiAgICB9CgogICAgcHVibGljIElkZW1wb3RlbmN5UmVjb3JkKFN0cmluZyBrZXksIFN0cmluZyBhcHByb3ZlcklkLCBsb25nIHB1cmNoYXNlT3JkZXJJZCwgU3RyaW5nIHJlc3BvbnNlU3RhdHVzKSB7CiAgICAgICAgdGhpcy5rZXkgPSBrZXk7CiAgICAgICAgdGhpcy5hcHByb3ZlcklkID0gYXBwcm92ZXJJZDsKICAgICAgICB0aGlzLnB1cmNoYXNlT3JkZXJJZCA9IHB1cmNoYXNlT3JkZXJJZDsKICAgICAgICB0aGlzLnJlc3BvbnNlU3RhdHVzID0gcmVzcG9uc2VTdGF0dXM7CiAgICB9CgogICAgcHVibGljIFN0cmluZyBnZXRLZXkoKSB7CiAgICAgICAgcmV0dXJuIGtleTsKICAgIH0KCiAgICBwdWJsaWMgU3RyaW5nIGdldEFwcHJvdmVySWQoKSB7CiAgICAgICAgcmV0dXJuIGFwcHJvdmVySWQ7CiAgICB9CgogICAgcHVibGljIGxvbmcgZ2V0UHVyY2hhc2VPcmRlcklkKCkgewogICAgICAgIHJldHVybiBwdXJjaGFzZU9yZGVySWQ7CiAgICB9CgogICAgcHVibGljIFN0cmluZyBnZXRSZXNwb25zZVN0YXR1cygpIHsKICAgICAgICByZXR1cm4gcmVzcG9uc2VTdGF0dXM7CiAgICB9Cn0K', 'base64'), 'UTF8'), false, 6),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/ApiExceptionHandler.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5odHRwLkh0dHBTdGF0dXM7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmh0dHAuUHJvYmxlbURldGFpbDsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5FeGNlcHRpb25IYW5kbGVyOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLlJlc3RDb250cm9sbGVyQWR2aWNlOwoKQFJlc3RDb250cm9sbGVyQWR2aWNlCnB1YmxpYyBjbGFzcyBBcGlFeGNlcHRpb25IYW5kbGVyIHsKCiAgICBARXhjZXB0aW9uSGFuZGxlcihQb05vdEZvdW5kRXhjZXB0aW9uLmNsYXNzKQogICAgcHVibGljIFByb2JsZW1EZXRhaWwgbm90Rm91bmQoUG9Ob3RGb3VuZEV4Y2VwdGlvbiBlKSB7CiAgICAgICAgcmV0dXJuIFByb2JsZW1EZXRhaWwuZm9yU3RhdHVzQW5kRGV0YWlsKEh0dHBTdGF0dXMuTk9UX0ZPVU5ELCBlLmdldE1lc3NhZ2UoKSk7CiAgICB9CgogICAgQEV4Y2VwdGlvbkhhbmRsZXIoSWxsZWdhbFN0YXRlRXhjZXB0aW9uLmNsYXNzKQogICAgcHVibGljIFByb2JsZW1EZXRhaWwgY29uZmxpY3QoSWxsZWdhbFN0YXRlRXhjZXB0aW9uIGUpIHsKICAgICAgICByZXR1cm4gUHJvYmxlbURldGFpbC5mb3JTdGF0dXNBbmREZXRhaWwoSHR0cFN0YXR1cy5DT05GTElDVCwgZS5nZXRNZXNzYWdlKCkpOwogICAgfQoKICAgIEBFeGNlcHRpb25IYW5kbGVyKEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uLmNsYXNzKQogICAgcHVibGljIFByb2JsZW1EZXRhaWwgYnVkZ2V0KEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uIGUpIHsKICAgICAgICByZXR1cm4gUHJvYmxlbURldGFpbC5mb3JTdGF0dXNBbmREZXRhaWwoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSwgZS5nZXRNZXNzYWdlKCkpOwogICAgfQoKICAgIEBFeGNlcHRpb25IYW5kbGVyKElsbGVnYWxBcmd1bWVudEV4Y2VwdGlvbi5jbGFzcykKICAgIHB1YmxpYyBQcm9ibGVtRGV0YWlsIGJhZFJlcXVlc3QoSWxsZWdhbEFyZ3VtZW50RXhjZXB0aW9uIGUpIHsKICAgICAgICByZXR1cm4gUHJvYmxlbURldGFpbC5mb3JTdGF0dXNBbmREZXRhaWwoSHR0cFN0YXR1cy5CQURfUkVRVUVTVCwgZS5nZXRNZXNzYWdlKCkpOwogICAgfQp9Cg==', 'base64'), 'UTF8'), false, 7),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PurchaseOrderLine.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Db2x1bW47CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkVudGl0eTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuRmV0Y2hUeXBlOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5HZW5lcmF0ZWRWYWx1ZTsKaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuR2VuZXJhdGlvblR5cGU7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLklkOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Kb2luQ29sdW1uOwppbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5NYW55VG9PbmU7CmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLlRhYmxlOwppbXBvcnQgamF2YS5tYXRoLkJpZ0RlY2ltYWw7CgpARW50aXR5CkBUYWJsZShuYW1lID0gInB1cmNoYXNlX29yZGVyX2xpbmVzIikKcHVibGljIGNsYXNzIFB1cmNoYXNlT3JkZXJMaW5lIHsKCiAgICBASWQKICAgIEBHZW5lcmF0ZWRWYWx1ZShzdHJhdGVneSA9IEdlbmVyYXRpb25UeXBlLklERU5USVRZKQogICAgcHJpdmF0ZSBMb25nIGlkOwoKICAgIEBNYW55VG9PbmUoZmV0Y2ggPSBGZXRjaFR5cGUuTEFaWSwgb3B0aW9uYWwgPSBmYWxzZSkKICAgIEBKb2luQ29sdW1uKG5hbWUgPSAicHVyY2hhc2Vfb3JkZXJfaWQiKQogICAgcHJpdmF0ZSBQdXJjaGFzZU9yZGVyIHB1cmNoYXNlT3JkZXI7CgogICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKQogICAgcHJpdmF0ZSBTdHJpbmcgc2t1OwoKICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSkKICAgIHByaXZhdGUgaW50IHF1YW50aXR5OwoKICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSwgcHJlY2lzaW9uID0gMTQsIHNjYWxlID0gMikKICAgIHByaXZhdGUgQmlnRGVjaW1hbCB1bml0UHJpY2U7CgogICAgcHJvdGVjdGVkIFB1cmNoYXNlT3JkZXJMaW5lKCkgewogICAgfQoKICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyTGluZShTdHJpbmcgc2t1LCBpbnQgcXVhbnRpdHksIEJpZ0RlY2ltYWwgdW5pdFByaWNlKSB7CiAgICAgICAgdGhpcy5za3UgPSBza3U7CiAgICAgICAgdGhpcy5xdWFudGl0eSA9IHF1YW50aXR5OwogICAgICAgIHRoaXMudW5pdFByaWNlID0gdW5pdFByaWNlOwogICAgfQoKICAgIHZvaWQgc2V0UHVyY2hhc2VPcmRlcihQdXJjaGFzZU9yZGVyIHB1cmNoYXNlT3JkZXIpIHsKICAgICAgICB0aGlzLnB1cmNoYXNlT3JkZXIgPSBwdXJjaGFzZU9yZGVyOwogICAgfQoKICAgIHB1YmxpYyBMb25nIGdldElkKCkgewogICAgICAgIHJldHVybiBpZDsKICAgIH0KCiAgICBwdWJsaWMgU3RyaW5nIGdldFNrdSgpIHsKICAgICAgICByZXR1cm4gc2t1OwogICAgfQoKICAgIHB1YmxpYyBpbnQgZ2V0UXVhbnRpdHkoKSB7CiAgICAgICAgcmV0dXJuIHF1YW50aXR5OwogICAgfQoKICAgIHB1YmxpYyBCaWdEZWNpbWFsIGdldFVuaXRQcmljZSgpIHsKICAgICAgICByZXR1cm4gdW5pdFByaWNlOwogICAgfQp9Cg==', 'base64'), 'UTF8'), true, 8),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PoStatus.java', 'java', 'package com.zycus.procurement.po;

public enum PoStatus {
    PENDING,
    APPROVED,
    REJECTED
}
', true, 9),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/Dtos.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamF2YS5tYXRoLkJpZ0RlY2ltYWw7CmltcG9ydCBqYXZhLnV0aWwuQXJyYXlMaXN0OwppbXBvcnQgamF2YS51dGlsLkxpc3Q7CgovKiogQVBJIHBheWxvYWRzLiAqLwpwdWJsaWMgZmluYWwgY2xhc3MgRHRvcyB7CgogICAgcHJpdmF0ZSBEdG9zKCkgewogICAgfQoKICAgIHB1YmxpYyByZWNvcmQgUHVyY2hhc2VPcmRlckR0byhsb25nIGlkLCBTdHJpbmcgbnVtYmVyLCBQb1N0YXR1cyBzdGF0dXMsIEJpZ0RlY2ltYWwgdG90YWwsCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50IGFwcHJvdmFsc1JlY2VpdmVkLCBpbnQgYXBwcm92YWxzUmVxdWlyZWQsIGludCBsaW5lQ291bnQpIHsKCiAgICAgICAgcHVibGljIHN0YXRpYyBQdXJjaGFzZU9yZGVyRHRvIGZyb20oUHVyY2hhc2VPcmRlciBwbykgewogICAgICAgICAgICByZXR1cm4gbmV3IFB1cmNoYXNlT3JkZXJEdG8ocG8uZ2V0SWQoKSwgcG8uZ2V0TnVtYmVyKCksIHBvLmdldFN0YXR1cygpLCBwby5nZXRUb3RhbCgpLAogICAgICAgICAgICAgICAgICAgIHBvLmdldEFwcHJvdmFsc1JlY2VpdmVkKCksIHBvLmdldEFwcHJvdmFsc1JlcXVpcmVkKCksIHBvLmdldExpbmVzKCkuc2l6ZSgpKTsKICAgICAgICB9CiAgICB9CgogICAgcHVibGljIHJlY29yZCBJbnZvaWNlTGluZShTdHJpbmcgc2t1LCBpbnQgcXVhbnRpdHksIEJpZ0RlY2ltYWwgdW5pdFByaWNlKSB7CiAgICB9CgogICAgcHVibGljIHJlY29yZCBJbnZvaWNlUmVxdWVzdChTdHJpbmcgaW52b2ljZU51bWJlciwgQmlnRGVjaW1hbCBhbW91bnQsIExpc3Q8SW52b2ljZUxpbmU+IGxpbmVzKSB7CiAgICB9CgogICAgcHVibGljIHJlY29yZCBNYXRjaFJlc3VsdChib29sZWFuIG1hdGNoZWQsIExpc3Q8U3RyaW5nPiBwcm9ibGVtcykgewoKICAgICAgICBwdWJsaWMgc3RhdGljIE1hdGNoUmVzdWx0IG9mKExpc3Q8U3RyaW5nPiBwcm9ibGVtcykgewogICAgICAgICAgICByZXR1cm4gbmV3IE1hdGNoUmVzdWx0KHByb2JsZW1zLmlzRW1wdHkoKSwgTGlzdC5jb3B5T2YocHJvYmxlbXMpKTsKICAgICAgICB9CiAgICB9CgogICAgcHVibGljIHJlY29yZCBSZWplY3RSZXF1ZXN0KFN0cmluZyByZWFzb24pIHsKICAgIH0KCiAgICBwdWJsaWMgcmVjb3JkIEJhdGNoUmVxdWVzdChMaXN0PExvbmc+IGlkcykgewogICAgfQoKICAgIC8qKiBSZXN1bHQgb2YgYSBiYXRjaCBhcHByb3ZhbDogd2hpY2ggUE9zIHdlcmUgYXBwcm92ZWQgYW5kIHdoaWNoIGZhaWxlZCAoYW5kIHdoeSkuICovCiAgICBwdWJsaWMgc3RhdGljIGZpbmFsIGNsYXNzIEJhdGNoUmVzdWx0IHsKCiAgICAgICAgcHJpdmF0ZSBmaW5hbCBMaXN0PExvbmc+IGFwcHJvdmVkID0gbmV3IEFycmF5TGlzdDw+KCk7CiAgICAgICAgcHJpdmF0ZSBmaW5hbCBMaXN0PFN0cmluZz4gZmFpbHVyZXMgPSBuZXcgQXJyYXlMaXN0PD4oKTsKCiAgICAgICAgcHVibGljIHZvaWQgYXBwcm92ZWQobG9uZyBpZCkgewogICAgICAgICAgICBhcHByb3ZlZC5hZGQoaWQpOwogICAgICAgIH0KCiAgICAgICAgcHVibGljIHZvaWQgZmFpbGVkKGxvbmcgaWQsIFN0cmluZyByZWFzb24pIHsKICAgICAgICAgICAgZmFpbHVyZXMuYWRkKGlkICsgIjogIiArIHJlYXNvbik7CiAgICAgICAgfQoKICAgICAgICBwdWJsaWMgTGlzdDxMb25nPiBnZXRBcHByb3ZlZCgpIHsKICAgICAgICAgICAgcmV0dXJuIGFwcHJvdmVkOwogICAgICAgIH0KCiAgICAgICAgcHVibGljIExpc3Q8U3RyaW5nPiBnZXRGYWlsdXJlcygpIHsKICAgICAgICAgICAgcmV0dXJuIGZhaWx1cmVzOwogICAgICAgIH0KICAgIH0KfQo=', 'base64'), 'UTF8'), true, 10),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/BudgetService.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgamF2YS5tYXRoLkJpZ0RlY2ltYWw7CgovKioKICogUmVzZXJ2ZXMgYnVkZ2V0IGZvciBhbiBhcHByb3ZlZCBQTyAoY29zdC1jZW50cmUgbGltaXRzKS4gSW1wbGVtZW50ZWQgYnkgdGhlIGZpbmFuY2UgbW9kdWxlOyBpdAogKiB3cml0ZXMgYSByZXNlcnZhdGlvbiByb3cgaW4gdGhlIHNhbWUgZGF0YWJhc2UuCiAqLwpwdWJsaWMgaW50ZXJmYWNlIEJ1ZGdldFNlcnZpY2UgewoKICAgIC8qKiBSZXNlcnZlcyB7QGNvZGUgYW1vdW50fSBmb3IgdGhlIFBPLCBvciB0aHJvd3MgaWYgdGhlIGNvc3QgY2VudHJlIGhhcyBubyBidWRnZXQgbGVmdC4gKi8KICAgIHZvaWQgcmVzZXJ2ZShsb25nIHB1cmNoYXNlT3JkZXJJZCwgQmlnRGVjaW1hbCBhbW91bnQpIHRocm93cyBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbjsKfQo=', 'base64'), 'UTF8'), true, 11),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/BudgetExceededException.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgovKiogQ2hlY2tlZDogY2FsbGVycyBtdXN0IGRlY2lkZSB3aGF0IHRvIGRvIHdoZW4gYSBjb3N0IGNlbnRyZSBpcyBvdXQgb2YgYnVkZ2V0LiAqLwpwdWJsaWMgY2xhc3MgQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24gZXh0ZW5kcyBFeGNlcHRpb24gewoKICAgIHB1YmxpYyBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbihTdHJpbmcgbWVzc2FnZSkgewogICAgICAgIHN1cGVyKG1lc3NhZ2UpOwogICAgfQp9Cg==', 'base64'), 'UTF8'), true, 12),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/java/com/zycus/procurement/po/PoNotFoundException.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgpwdWJsaWMgY2xhc3MgUG9Ob3RGb3VuZEV4Y2VwdGlvbiBleHRlbmRzIFJ1bnRpbWVFeGNlcHRpb24gewoKICAgIHB1YmxpYyBQb05vdEZvdW5kRXhjZXB0aW9uKGxvbmcgaWQpIHsKICAgICAgICBzdXBlcigiUHVyY2hhc2Ugb3JkZXIgIiArIGlkICsgIiBub3QgZm91bmQiKTsKICAgIH0KfQo=', 'base64'), 'UTF8'), true, 13),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/main/resources/application.yml', 'yaml', convert_from(decode('c3ByaW5nOgogIGFwcGxpY2F0aW9uOgogICAgbmFtZTogcG8tYXBwcm92YWxzCiAgZGF0YXNvdXJjZToKICAgIHVybDogamRiYzpwb3N0Z3Jlc3FsOi8vbG9jYWxob3N0OjU0MzIvcHJvY3VyZW1lbnQKICAgIHVzZXJuYW1lOiBwcm9jdXJlbWVudAogICAgcGFzc3dvcmQ6ICR7REJfUEFTU1dPUkR9CiAganBhOgogICAgb3Blbi1pbi12aWV3OiBmYWxzZQogICAgaGliZXJuYXRlOgogICAgICBkZGwtYXV0bzogdmFsaWRhdGUKICAgIHByb3BlcnRpZXM6CiAgICAgIGhpYmVybmF0ZToKICAgICAgICBqZGJjOgogICAgICAgICAgdGltZV96b25lOiBVVEMKc2VydmVyOgogIGVycm9yOgogICAgaW5jbHVkZS1tZXNzYWdlOiBhbHdheXMK', 'base64'), 'UTF8'), true, 14),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/test/java/com/zycus/procurement/po/ApprovalServiceIT.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgc3RhdGljIG9yZy5hc3NlcnRqLmNvcmUuYXBpLkFzc2VydGlvbnMuYXNzZXJ0VGhhdDsKaW1wb3J0IHN0YXRpYyBvcmcuYXNzZXJ0ai5jb3JlLmFwaS5Bc3NlcnRpb25zLmFzc2VydFRoYXRUaHJvd25CeTsKCmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5CYXRjaFJlc3VsdDsKaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkludm9pY2VMaW5lOwppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuSW52b2ljZVJlcXVlc3Q7CmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5QdXJjaGFzZU9yZGVyRHRvOwppbXBvcnQgamF2YS5tYXRoLkJpZ0RlY2ltYWw7CmltcG9ydCBqYXZhLnRpbWUuRHVyYXRpb247CmltcG9ydCBqYXZhLnV0aWwuQXJyYXlMaXN0OwppbXBvcnQgamF2YS51dGlsLkNvbGxlY3Rpb25zOwppbXBvcnQgamF2YS51dGlsLkxpc3Q7CmltcG9ydCBqYXZhLnV0aWwuU2V0OwppbXBvcnQgamF2YS51dGlsLmNvbmN1cnJlbnQuQ2FsbGFibGU7CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5Db25jdXJyZW50SGFzaE1hcDsKaW1wb3J0IGphdmEudXRpbC5jb25jdXJyZW50LkNvcHlPbldyaXRlQXJyYXlMaXN0OwppbXBvcnQgamF2YS51dGlsLmNvbmN1cnJlbnQuQ291bnREb3duTGF0Y2g7CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5FeGVjdXRpb25FeGNlcHRpb247CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5FeGVjdXRvclNlcnZpY2U7CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5FeGVjdXRvcnM7CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5GdXR1cmU7CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5UaW1lVW5pdDsKaW1wb3J0IGphdmEudXRpbC5jb25jdXJyZW50LlRpbWVvdXRFeGNlcHRpb247CmltcG9ydCBqYXZhLnV0aWwuc3RyZWFtLkludFN0cmVhbTsKaW1wb3J0IG9yZy5qdW5pdC5qdXBpdGVyLmFwaS5CZWZvcmVFYWNoOwppbXBvcnQgb3JnLmp1bml0Lmp1cGl0ZXIuYXBpLkRpc3BsYXlOYW1lOwppbXBvcnQgb3JnLmp1bml0Lmp1cGl0ZXIuYXBpLlRlc3Q7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmJlYW5zLmZhY3RvcnkuYW5ub3RhdGlvbi5BdXRvd2lyZWQ7CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmJvb3QudGVzdC5jb250ZXh0LlNwcmluZ0Jvb3RUZXN0OwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5ib290LnRlc3QuY29udGV4dC5UZXN0Q29uZmlndXJhdGlvbjsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuYm9vdC50ZXN0Y29udGFpbmVycy5zZXJ2aWNlLmNvbm5lY3Rpb24uU2VydmljZUNvbm5lY3Rpb247CmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmNvbnRleHQuYW5ub3RhdGlvbi5CZWFuOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5jb250ZXh0LmFubm90YXRpb24uSW1wb3J0OwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYW8uT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmRvbWFpbi5QYWdlOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5zdXBwb3J0LlRyYW5zYWN0aW9uU3luY2hyb25pemF0aW9uOwppbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5zdXBwb3J0LlRyYW5zYWN0aW9uU3luY2hyb25pemF0aW9uTWFuYWdlcjsKaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsudHJhbnNhY3Rpb24uc3VwcG9ydC5UcmFuc2FjdGlvblRlbXBsYXRlOwppbXBvcnQgb3JnLnRlc3Rjb250YWluZXJzLmNvbnRhaW5lcnMuUG9zdGdyZVNRTENvbnRhaW5lcjsKaW1wb3J0IG9yZy50ZXN0Y29udGFpbmVycy5qdW5pdC5qdXBpdGVyLkNvbnRhaW5lcjsKaW1wb3J0IG9yZy50ZXN0Y29udGFpbmVycy5qdW5pdC5qdXBpdGVyLlRlc3Rjb250YWluZXJzOwoKLyoqCiAqIFJ1bnMgYWdhaW5zdCBhIHJlYWwgUG9zdGdyZVNRTCAoVGVzdGNvbnRhaW5lcnMpOiB7QGNvZGUgbXZuIHZlcmlmeX0uIFRoZSBzY2hlbWEgaXMgZ2VuZXJhdGVkIGZyb20KICogdGhlIGVudGl0aWVzLCBhbmQgSGliZXJuYXRlIGlzIHRvbGQgdG8gZmFpbCBpbnN0ZWFkIG9mIHBhZ2luZyBhIGNvbGxlY3Rpb24gZmV0Y2ggaW4gbWVtb3J5LgogKi8KQFRlc3Rjb250YWluZXJzCkBTcHJpbmdCb290VGVzdChwcm9wZXJ0aWVzID0gewogICAgICAgICJzcHJpbmcuanBhLmhpYmVybmF0ZS5kZGwtYXV0bz1jcmVhdGUtZHJvcCIsCiAgICAgICAgInNwcmluZy5qcGEucHJvcGVydGllcy5oaWJlcm5hdGUucXVlcnkuZmFpbF9vbl9wYWdpbmF0aW9uX292ZXJfY29sbGVjdGlvbl9mZXRjaD10cnVlIn0pCkBJbXBvcnQoQXBwcm92YWxTZXJ2aWNlSVQuRmFrZXMuY2xhc3MpCmNsYXNzIEFwcHJvdmFsU2VydmljZUlUIHsKCiAgICBAQ29udGFpbmVyCiAgICBAU2VydmljZUNvbm5lY3Rpb24KICAgIHN0YXRpYyBQb3N0Z3JlU1FMQ29udGFpbmVyPD8+IGRiID0gbmV3IFBvc3RncmVTUUxDb250YWluZXI8PigicG9zdGdyZXM6MTYtYWxwaW5lIik7CgogICAgQFRlc3RDb25maWd1cmF0aW9uCiAgICBzdGF0aWMgY2xhc3MgRmFrZXMgewogICAgICAgIEBCZWFuCiAgICAgICAgVGVzdEJ1ZGdldCBidWRnZXRTZXJ2aWNlKCkgewogICAgICAgICAgICByZXR1cm4gbmV3IFRlc3RCdWRnZXQoKTsKICAgICAgICB9CiAgICB9CgogICAgLyoqCiAgICAgKiBMaWtlIHRoZSBmaW5hbmNlIG1vZHVsZSdzIGltcGxlbWVudGF0aW9uLCBhIHJlc2VydmF0aW9uIG9ubHkgZXhpc3RzIG9uY2UgdGhlIHRyYW5zYWN0aW9uIHRoYXQKICAgICAqIG1hZGUgaXQgY29tbWl0cy4gUmVmdXNlcyB0aGUgUE9zIGluIHtAbGluayAjcmVmdXNlZH07IHtAbGluayAjZGVsYXl9IHdpZGVucyByYWNlIHdpbmRvd3MuCiAgICAgKi8KICAgIHN0YXRpYyBjbGFzcyBUZXN0QnVkZ2V0IGltcGxlbWVudHMgQnVkZ2V0U2VydmljZSB7CiAgICAgICAgZmluYWwgU2V0PExvbmc+IHJlZnVzZWQgPSBDb25jdXJyZW50SGFzaE1hcC5uZXdLZXlTZXQoKTsKICAgICAgICBmaW5hbCBMaXN0PExvbmc+IHJlc2VydmVkID0gbmV3IENvcHlPbldyaXRlQXJyYXlMaXN0PD4oKTsKICAgICAgICB2b2xhdGlsZSBEdXJhdGlvbiBkZWxheSA9IER1cmF0aW9uLlpFUk87CgogICAgICAgIEBPdmVycmlkZQogICAgICAgIHB1YmxpYyB2b2lkIHJlc2VydmUobG9uZyBwdXJjaGFzZU9yZGVySWQsIEJpZ0RlY2ltYWwgYW1vdW50KSB0aHJvd3MgQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24gewogICAgICAgICAgICBzbGVlcChkZWxheSk7CiAgICAgICAgICAgIGlmIChyZWZ1c2VkLmNvbnRhaW5zKHB1cmNoYXNlT3JkZXJJZCkpIHsKICAgICAgICAgICAgICAgIHRocm93IG5ldyBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbigiQ29zdCBjZW50cmUgaXMgb3V0IG9mIGJ1ZGdldCIpOwogICAgICAgICAgICB9CiAgICAgICAgICAgIGlmICghVHJhbnNhY3Rpb25TeW5jaHJvbml6YXRpb25NYW5hZ2VyLmlzU3luY2hyb25pemF0aW9uQWN0aXZlKCkpIHsKICAgICAgICAgICAgICAgIHJlc2VydmVkLmFkZChwdXJjaGFzZU9yZGVySWQpOwogICAgICAgICAgICAgICAgcmV0dXJuOwogICAgICAgICAgICB9CiAgICAgICAgICAgIFRyYW5zYWN0aW9uU3luY2hyb25pemF0aW9uTWFuYWdlci5yZWdpc3RlclN5bmNocm9uaXphdGlvbihuZXcgVHJhbnNhY3Rpb25TeW5jaHJvbml6YXRpb24oKSB7CiAgICAgICAgICAgICAgICBAT3ZlcnJpZGUKICAgICAgICAgICAgICAgIHB1YmxpYyB2b2lkIGFmdGVyQ29tbWl0KCkgewogICAgICAgICAgICAgICAgICAgIHJlc2VydmVkLmFkZChwdXJjaGFzZU9yZGVySWQpOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9KTsKICAgICAgICB9CgogICAgICAgIGxvbmcgcmVzZXJ2YXRpb25zRm9yKGxvbmcgaWQpIHsKICAgICAgICAgICAgcmV0dXJuIHJlc2VydmVkLnN0cmVhbSgpLmZpbHRlcihyIC0+IHIgPT0gaWQpLmNvdW50KCk7CiAgICAgICAgfQogICAgfQoKICAgIEBBdXRvd2lyZWQgQXBwcm92YWxTZXJ2aWNlIHNlcnZpY2U7CiAgICBAQXV0b3dpcmVkIFB1cmNoYXNlT3JkZXJDb250cm9sbGVyIGNvbnRyb2xsZXI7CiAgICBAQXV0b3dpcmVkIFB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IG9yZGVyczsKICAgIEBBdXRvd2lyZWQgSWRlbXBvdGVuY3lSZWNvcmRSZXBvc2l0b3J5IGlkZW1wb3RlbmN5OwogICAgQEF1dG93aXJlZCBUZXN0QnVkZ2V0IGJ1ZGdldDsKICAgIEBBdXRvd2lyZWQgVHJhbnNhY3Rpb25UZW1wbGF0ZSB0eDsKCiAgICBAQmVmb3JlRWFjaAogICAgdm9pZCByZXNldCgpIHsKICAgICAgICBpZGVtcG90ZW5jeS5kZWxldGVBbGwoKTsKICAgICAgICBvcmRlcnMuZGVsZXRlQWxsKCk7CiAgICAgICAgYnVkZ2V0LnJlZnVzZWQuY2xlYXIoKTsKICAgICAgICBidWRnZXQucmVzZXJ2ZWQuY2xlYXIoKTsKICAgICAgICBidWRnZXQuZGVsYXkgPSBEdXJhdGlvbi5aRVJPOwogICAgfQoKICAgIC8vIC0tLS0gdHJhbnNhY3Rpb25zIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJhIHJlamVjdGlvbiBpcyBzYXZlZCIpCiAgICB2b2lkIHJlamVjdGlvbklzU2F2ZWQoKSB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy0xIiwgIjUwMDAuMDAiKTsKCiAgICAgICAgc2VydmljZS5yZWplY3QoaWQsICJhc2hhIiwgIldyb25nIHZlbmRvciIpOwoKICAgICAgICBQdXJjaGFzZU9yZGVyIHNhdmVkID0gcmVsb2FkKGlkKTsKICAgICAgICBhc3NlcnRUaGF0KHNhdmVkLmdldFN0YXR1cygpKS5pc0VxdWFsVG8oUG9TdGF0dXMuUkVKRUNURUQpOwogICAgICAgIGFzc2VydFRoYXQoc2F2ZWQuZ2V0UmVqZWN0aW9uUmVhc29uKCkpLmlzRXF1YWxUbygiV3JvbmcgdmVuZG9yIik7CiAgICB9CgogICAgQFRlc3QKICAgIEBEaXNwbGF5TmFtZSgiYW4gYXBwcm92YWwgdGhlIGJ1ZGdldCByZWZ1c2VzIGNoYW5nZXMgbm90aGluZywgYW5kIGNhbiBiZSByZXRyaWVkIGxhdGVyIikKICAgIHZvaWQgcmVmdXNlZEFwcHJvdmFsSXNSb2xsZWRCYWNrKCkgdGhyb3dzIEV4Y2VwdGlvbiB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy0yIiwgIjUwMDAuMDAiKTsKICAgICAgICBidWRnZXQucmVmdXNlZC5hZGQoaWQpOwoKICAgICAgICBhc3NlcnRUaGF0VGhyb3duQnkoKCkgLT4gc2VydmljZS5hcHByb3ZlKGlkLCAiYXNoYSIsICJrZXktMSIpKS5pc0luc3RhbmNlT2YoQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24uY2xhc3MpOwoKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0U3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5QRU5ESU5HKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0QXBwcm92YWxzUmVjZWl2ZWQoKSkuaXNaZXJvKCk7CgogICAgICAgIGJ1ZGdldC5yZWZ1c2VkLmNsZWFyKCk7CiAgICAgICAgYXNzZXJ0VGhhdChzZXJ2aWNlLmFwcHJvdmUoaWQsICJhc2hhIiwgImtleS0xIikuc3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5BUFBST1ZFRCk7CiAgICAgICAgYXNzZXJ0VGhhdChidWRnZXQucmVzZXJ2YXRpb25zRm9yKGlkKSkuaXNFcXVhbFRvKDEpOwogICAgfQoKICAgIC8vIC0tLS0gaWRlbXBvdGVuY3kgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImEgcmV0cmllZCByZXF1ZXN0IChzYW1lIGtleSkgaXMgYXBwbGllZCBvbmNlIikKICAgIHZvaWQgcmV0cnlJc0FwcGxpZWRPbmNlKCkgdGhyb3dzIEV4Y2VwdGlvbiB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy0zIiwgIjI1MDAwMDAuMDAiKTsKCiAgICAgICAgc2VydmljZS5hcHByb3ZlKGlkLCAiYXNoYSIsICJrZXktMSIpOwogICAgICAgIFB1cmNoYXNlT3JkZXJEdG8gcmV0cnkgPSBzZXJ2aWNlLmFwcHJvdmUoaWQsICJhc2hhIiwgImtleS0xIik7CgogICAgICAgIGFzc2VydFRoYXQocmV0cnkuYXBwcm92YWxzUmVjZWl2ZWQoKSkuaXNFcXVhbFRvKDEpOwogICAgICAgIGFzc2VydFRoYXQocmVsb2FkKGlkKS5nZXRBcHByb3ZhbHNSZWNlaXZlZCgpKS5pc0VxdWFsVG8oMSk7CiAgICB9CgogICAgQFRlc3QKICAgIEBEaXNwbGF5TmFtZSgicmV0cmllcyB0aGF0IGFycml2ZSBhdCB0aGUgc2FtZSB0aW1lIGFyZSBhcHBsaWVkIG9uY2UsIGFuZCBlYWNoIGdldHMgYSByZXNwb25zZSIpCiAgICB2b2lkIGNvbmN1cnJlbnRSZXRyaWVzQXJlQXBwbGllZE9uY2UoKSB0aHJvd3MgRXhjZXB0aW9uIHsKICAgICAgICBsb25nIGlkID0gcG8oIlBPLTQiLCAiNTAwMC4wMCIpOwogICAgICAgIGJ1ZGdldC5kZWxheSA9IER1cmF0aW9uLm9mTWlsbGlzKDMwMCk7CgogICAgICAgIExpc3Q8VGhyb3dhYmxlPiBvdXRjb21lcyA9IHJhY2UoQ29sbGVjdGlvbnMubkNvcGllcyg4LCAoKSAtPiBzZXJ2aWNlLmFwcHJvdmUoaWQsICJhc2hhIiwgImtleS0xIikpKTsKCiAgICAgICAgYXNzZXJ0VGhhdChvdXRjb21lcykuY29udGFpbnNPbmx5TnVsbHMoKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0U3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5BUFBST1ZFRCk7CiAgICAgICAgYXNzZXJ0VGhhdChidWRnZXQucmVzZXJ2YXRpb25zRm9yKGlkKSkuaXNFcXVhbFRvKDEpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImFuIGlkZW1wb3RlbmN5IGtleSBiZWxvbmdzIHRvIG9uZSBhcHByb3ZlciAoa2V5cyBhcmUgb25seSB1bmlxdWUgcGVyIHVzZXIpIikKICAgIHZvaWQga2V5c0FyZVNjb3BlZFRvVGhlQXBwcm92ZXIoKSB0aHJvd3MgRXhjZXB0aW9uIHsKICAgICAgICBsb25nIGlkID0gcG8oIlBPLTUiLCAiMjUwMDAwMC4wMCIpOwoKICAgICAgICBzZXJ2aWNlLmFwcHJvdmUoaWQsICJhc2hhIiwgIjEiKTsKICAgICAgICBQdXJjaGFzZU9yZGVyRHRvIHNlY29uZCA9IHNlcnZpY2UuYXBwcm92ZShpZCwgInJhdmkiLCAiMSIpOwoKICAgICAgICBhc3NlcnRUaGF0KHNlY29uZC5zdGF0dXMoKSkuaXNFcXVhbFRvKFBvU3RhdHVzLkFQUFJPVkVEKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0QXBwcm92YWxzUmVjZWl2ZWQoKSkuaXNFcXVhbFRvKDIpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoInJldXNpbmcgYSBrZXkgZm9yIGEgZGlmZmVyZW50IFBPIGlzIHJlZnVzZWQsIG5vdCBhbnN3ZXJlZCB3aXRoIHRoZSBvdGhlciBQTyIpCiAgICB2b2lkIGtleVJldXNlSXNSZWZ1c2VkKCkgdGhyb3dzIEV4Y2VwdGlvbiB7CiAgICAgICAgbG9uZyBmaXJzdCA9IHBvKCJQTy02IiwgIjUwMDAuMDAiKTsKICAgICAgICBsb25nIG90aGVyID0gcG8oIlBPLTciLCAiNTAwMC4wMCIpOwogICAgICAgIHNlcnZpY2UuYXBwcm92ZShmaXJzdCwgImFzaGEiLCAia2V5LTEiKTsKCiAgICAgICAgYXNzZXJ0VGhhdFRocm93bkJ5KCgpIC0+IHNlcnZpY2UuYXBwcm92ZShvdGhlciwgImFzaGEiLCAia2V5LTEiKSkuaXNJbnN0YW5jZU9mKFJ1bnRpbWVFeGNlcHRpb24uY2xhc3MpOwoKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChvdGhlcikuZ2V0U3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5QRU5ESU5HKTsKICAgIH0KCiAgICAvLyAtLS0tIHR3by1wZXJzb24gcnVsZSBhbmQgY29uY3VycmVudCBhcHByb3ZlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tCgogICAgQFRlc3QKICAgIEBEaXNwbGF5TmFtZSgiYSBoaWdoLXZhbHVlIFBPIGlzIGFwcHJvdmVkIGJ5IHR3byBkaWZmZXJlbnQgcGVvcGxlIikKICAgIHZvaWQgdHdvQXBwcm92ZXJzKCkgdGhyb3dzIEV4Y2VwdGlvbiB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy04IiwgIjI1MDAwMDAuMDAiKTsKCiAgICAgICAgYXNzZXJ0VGhhdChzZXJ2aWNlLmFwcHJvdmUoaWQsICJhc2hhIiwgImEtMSIpLnN0YXR1cygpKS5pc0VxdWFsVG8oUG9TdGF0dXMuUEVORElORyk7CiAgICAgICAgYXNzZXJ0VGhhdChzZXJ2aWNlLmFwcHJvdmUoaWQsICJyYXZpIiwgInItMSIpLnN0YXR1cygpKS5pc0VxdWFsVG8oUG9TdGF0dXMuQVBQUk9WRUQpOwogICAgICAgIGFzc2VydFRoYXQoYnVkZ2V0LnJlc2VydmF0aW9uc0ZvcihpZCkpLmlzRXF1YWxUbygxKTsKICAgIH0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJ0aGUgc2FtZSBwZXJzb24gY2FuJ3QgZ2l2ZSBib3RoIGFwcHJvdmFscyBvZiBhIGhpZ2gtdmFsdWUgUE8iKQogICAgdm9pZCBzYW1lQXBwcm92ZXJUd2ljZSgpIHRocm93cyBFeGNlcHRpb24gewogICAgICAgIGxvbmcgaWQgPSBwbygiUE8tOSIsICIyNTAwMDAwLjAwIik7CiAgICAgICAgc2VydmljZS5hcHByb3ZlKGlkLCAiYXNoYSIsICJhLTEiKTsKCiAgICAgICAgYXNzZXJ0VGhhdFRocm93bkJ5KCgpIC0+IHNlcnZpY2UuYXBwcm92ZShpZCwgImFzaGEiLCAiYS0yIikpLmlzSW5zdGFuY2VPZihJbGxlZ2FsU3RhdGVFeGNlcHRpb24uY2xhc3MpOwoKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0U3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5QRU5ESU5HKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0QXBwcm92YWxzUmVjZWl2ZWQoKSkuaXNFcXVhbFRvKDEpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoInR3byBwZW9wbGUgcmFjaW5nIGZvciB0aGUgZmluYWwgYXBwcm92YWw6IG9uZSB3aW5zLCB0aGUgb3RoZXIgaXMgdG9sZCB0byByZWZyZXNoIikKICAgIHZvaWQgcmFjaW5nQXBwcm92ZXJzKCkgdGhyb3dzIEV4Y2VwdGlvbiB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy0xMCIsICIyNTAwMDAwLjAwIik7CiAgICAgICAgc2VydmljZS5hcHByb3ZlKGlkLCAiYXNoYSIsICJhLTEiKTsKICAgICAgICBidWRnZXQuZGVsYXkgPSBEdXJhdGlvbi5vZk1pbGxpcygzMDApOwoKICAgICAgICBMaXN0PFRocm93YWJsZT4gb3V0Y29tZXMgPSByYWNlKExpc3Qub2YoCiAgICAgICAgICAgICAgICAoKSAtPiBzZXJ2aWNlLmFwcHJvdmUoaWQsICJyYXZpIiwgInItMSIpLAogICAgICAgICAgICAgICAgKCkgLT4gc2VydmljZS5hcHByb3ZlKGlkLCAibWVlcmEiLCAibS0xIikpKTsKCiAgICAgICAgYXNzZXJ0VGhhdChvdXRjb21lcykuZmlsdGVyZWRPbihvIC0+IG8gPT0gbnVsbCkuaGFzU2l6ZSgxKTsKICAgICAgICBhc3NlcnRUaGF0KG91dGNvbWVzKS5maWx0ZXJlZE9uKG8gLT4gbyAhPSBudWxsKS5zaW5nbGVFbGVtZW50KCkKICAgICAgICAgICAgICAgIC5pc0luc3RhbmNlT2ZBbnkoT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uLmNsYXNzLCBJbGxlZ2FsU3RhdGVFeGNlcHRpb24uY2xhc3MpOwogICAgICAgIGFzc2VydFRoYXQocmVsb2FkKGlkKS5nZXRTdGF0dXMoKSkuaXNFcXVhbFRvKFBvU3RhdHVzLkFQUFJPVkVEKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChpZCkuZ2V0QXBwcm92YWxzUmVjZWl2ZWQoKSkuaXNFcXVhbFRvKDIpOwogICAgICAgIGFzc2VydFRoYXQoYnVkZ2V0LnJlc2VydmF0aW9uc0ZvcihpZCkpLmlzRXF1YWxUbygxKTsKICAgIH0KCiAgICAvLyAtLS0tIGJhdGNoIGFwcHJvdmFsIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJiYXRjaDogYSBQTyB0aGUgYnVkZ2V0IHJlZnVzZXMgc3RheXMgcGVuZGluZzsgdGhlIG90aGVycyBhcmUgYXBwcm92ZWQiKQogICAgdm9pZCBiYXRjaElzb2xhdGVzQnVkZ2V0RmFpbHVyZXMoKSB7CiAgICAgICAgbG9uZyBhID0gcG8oIlBPLTExIiwgIjEwMC4wMCIpOwogICAgICAgIGxvbmcgYiA9IHBvKCJQTy0xMiIsICIyMDAuMDAiKTsKICAgICAgICBsb25nIGMgPSBwbygiUE8tMTMiLCAiMzAwLjAwIik7CiAgICAgICAgYnVkZ2V0LnJlZnVzZWQuYWRkKGIpOwoKICAgICAgICBCYXRjaFJlc3VsdCByZXN1bHQgPSBzZXJ2aWNlLmFwcHJvdmVCYXRjaChMaXN0Lm9mKGEsIGIsIGMpLCAiYXNoYSIpOwoKICAgICAgICBhc3NlcnRUaGF0KHJlc3VsdC5nZXRBcHByb3ZlZCgpKS5jb250YWluc0V4YWN0bHkoYSwgYyk7CiAgICAgICAgYXNzZXJ0VGhhdChyZXN1bHQuZ2V0RmFpbHVyZXMoKSkuc2luZ2xlRWxlbWVudCgpLmFzU3RyaW5nKCkuc3RhcnRzV2l0aChiICsgIjoiKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChhKS5nZXRTdGF0dXMoKSkuaXNFcXVhbFRvKFBvU3RhdHVzLkFQUFJPVkVEKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChiKS5nZXRTdGF0dXMoKSkuaXNFcXVhbFRvKFBvU3RhdHVzLlBFTkRJTkcpOwogICAgICAgIGFzc2VydFRoYXQocmVsb2FkKGMpLmdldFN0YXR1cygpKS5pc0VxdWFsVG8oUG9TdGF0dXMuQVBQUk9WRUQpOwogICAgICAgIGFzc2VydFRoYXQoYnVkZ2V0LnJlc2VydmVkKS5jb250YWluc0V4YWN0bHlJbkFueU9yZGVyKGEsIGMpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImJhdGNoOiBhbiBpZCB0aGF0IGNhbid0IGJlIGFwcHJvdmVkIGRvZXNuJ3Qgc3RvcCB0aGUgb3RoZXJzIikKICAgIHZvaWQgYmF0Y2hTdXJ2aXZlc0JhZElkcygpIHRocm93cyBFeGNlcHRpb24gewogICAgICAgIGxvbmcgb2sgPSBwbygiUE8tMTQiLCAiMTAwLjAwIik7CiAgICAgICAgbG9uZyBkb25lID0gcG8oIlBPLTE1IiwgIjEwMC4wMCIpOwogICAgICAgIHNlcnZpY2UuYXBwcm92ZShkb25lLCAicmF2aSIsICJyLTEiKTsKICAgICAgICBsb25nIG1pc3NpbmcgPSBkb25lICsgMTAwMDsKCiAgICAgICAgQmF0Y2hSZXN1bHQgcmVzdWx0ID0gc2VydmljZS5hcHByb3ZlQmF0Y2goTGlzdC5vZihkb25lLCBvaywgbWlzc2luZyksICJhc2hhIik7CgogICAgICAgIGFzc2VydFRoYXQocmVzdWx0LmdldEFwcHJvdmVkKCkpLmNvbnRhaW5zRXhhY3RseShvayk7CiAgICAgICAgYXNzZXJ0VGhhdChyZXN1bHQuZ2V0RmFpbHVyZXMoKSkuaGFzU2l6ZSgyKTsKICAgICAgICBhc3NlcnRUaGF0KHJlbG9hZChvaykuZ2V0U3RhdHVzKCkpLmlzRXF1YWxUbyhQb1N0YXR1cy5BUFBST1ZFRCk7CiAgICB9CgogICAgLy8gLS0tLSBpbnZvaWNlIG1hdGNoaW5nIGFuZCB0aGUgaW5ib3ggLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJtYXRjaGluZyBhbiBpbnZvaWNlIHdvcmtzIChvcGVuLWluLXZpZXcgaXMgb2ZmKSIpCiAgICB2b2lkIG1hdGNoSW52b2ljZUxvYWRzTGluZXMoKSB7CiAgICAgICAgbG9uZyBpZCA9IHBvKCJQTy0xNiIsICIxNTAwLjAwIiwgbmV3IFB1cmNoYXNlT3JkZXJMaW5lKCJTS1UtMSIsIDEwLCBuZXcgQmlnRGVjaW1hbCgiMTUwLjAwIikpKTsKICAgICAgICBJbnZvaWNlUmVxdWVzdCBpbnZvaWNlID0gbmV3IEludm9pY2VSZXF1ZXN0KCJJTlYtMSIsIG5ldyBCaWdEZWNpbWFsKCIxNTAwLjAwIiksCiAgICAgICAgICAgICAgICBMaXN0Lm9mKG5ldyBJbnZvaWNlTGluZSgiU0tVLTEiLCAxMCwgbmV3IEJpZ0RlY2ltYWwoIjE1MC4wMCIpKSkpOwoKICAgICAgICBhc3NlcnRUaGF0KGNvbnRyb2xsZXIubWF0Y2hJbnZvaWNlKGlkLCBpbnZvaWNlKS5tYXRjaGVkKCkpLmlzVHJ1ZSgpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImluYm94OiBwYWdlIDEgaG9sZHMgdGhlIG5ld2VzdCBQT3MgYW5kIHBhZ2VzIGRvbid0IG92ZXJsYXAiKQogICAgdm9pZCBpbmJveFBhZ2luZygpIHsKICAgICAgICBMaXN0PExvbmc+IGlkcyA9IG5ldyBBcnJheUxpc3Q8PigpOwogICAgICAgIGZvciAoaW50IGkgPSAxOyBpIDw9IDI1OyBpKyspIHsKICAgICAgICAgICAgaWRzLmFkZChwbygiUE8tIiArICgxMDAgKyBpKSwgIjEwMC4wMCIsCiAgICAgICAgICAgICAgICAgICAgbmV3IFB1cmNoYXNlT3JkZXJMaW5lKCJTS1UtMSIsIDEsIG5ldyBCaWdEZWNpbWFsKCI1MC4wMCIpKSwKICAgICAgICAgICAgICAgICAgICBuZXcgUHVyY2hhc2VPcmRlckxpbmUoIlNLVS0yIiwgMSwgbmV3IEJpZ0RlY2ltYWwoIjUwLjAwIikpKSk7CiAgICAgICAgfQogICAgICAgIENvbGxlY3Rpb25zLnJldmVyc2UoaWRzKTsKCiAgICAgICAgUGFnZTxQdXJjaGFzZU9yZGVyRHRvPiBmaXJzdCA9IGNvbnRyb2xsZXIubGlzdCgxLCAxMCk7CiAgICAgICAgUGFnZTxQdXJjaGFzZU9yZGVyRHRvPiBzZWNvbmQgPSBjb250cm9sbGVyLmxpc3QoMiwgMTApOwogICAgICAgIFBhZ2U8UHVyY2hhc2VPcmRlckR0bz4gbGFzdCA9IGNvbnRyb2xsZXIubGlzdCgzLCAxMCk7CgogICAgICAgIGFzc2VydFRoYXQoZmlyc3QuZ2V0Q29udGVudCgpKS5leHRyYWN0aW5nKFB1cmNoYXNlT3JkZXJEdG86OmlkKS5jb250YWluc0V4YWN0bHlFbGVtZW50c09mKGlkcy5zdWJMaXN0KDAsIDEwKSk7CiAgICAgICAgYXNzZXJ0VGhhdChzZWNvbmQuZ2V0Q29udGVudCgpKS5leHRyYWN0aW5nKFB1cmNoYXNlT3JkZXJEdG86OmlkKS5jb250YWluc0V4YWN0bHlFbGVtZW50c09mKGlkcy5zdWJMaXN0KDEwLCAyMCkpOwogICAgICAgIGFzc2VydFRoYXQobGFzdC5nZXRDb250ZW50KCkpLmV4dHJhY3RpbmcoUHVyY2hhc2VPcmRlckR0bzo6aWQpLmNvbnRhaW5zRXhhY3RseUVsZW1lbnRzT2YoaWRzLnN1Ykxpc3QoMjAsIDI1KSk7CiAgICAgICAgYXNzZXJ0VGhhdChmaXJzdC5nZXRUb3RhbEVsZW1lbnRzKCkpLmlzRXF1YWxUbygyNSk7CiAgICAgICAgYXNzZXJ0VGhhdChmaXJzdC5nZXRDb250ZW50KCkpLmFsbFNhdGlzZnkoZHRvIC0+IGFzc2VydFRoYXQoZHRvLmxpbmVDb3VudCgpKS5pc0VxdWFsVG8oMikpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImluYm94OiBwYWdlIDAgaXMgYSBiYWQgcmVxdWVzdCIpCiAgICB2b2lkIGluYm94UmVqZWN0c1BhZ2VaZXJvKCkgewogICAgICAgIGFzc2VydFRoYXRUaHJvd25CeSgoKSAtPiBjb250cm9sbGVyLmxpc3QoMCwgMTApKS5pc0luc3RhbmNlT2YoSWxsZWdhbEFyZ3VtZW50RXhjZXB0aW9uLmNsYXNzKTsKICAgIH0KCiAgICAvLyAtLS0tIGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KCiAgICBwcml2YXRlIGxvbmcgcG8oU3RyaW5nIG51bWJlciwgU3RyaW5nIHRvdGFsLCBQdXJjaGFzZU9yZGVyTGluZS4uLiBsaW5lcykgewogICAgICAgIFB1cmNoYXNlT3JkZXIgcG8gPSBuZXcgUHVyY2hhc2VPcmRlcihudW1iZXIsIG5ldyBCaWdEZWNpbWFsKHRvdGFsKSk7CiAgICAgICAgZm9yIChQdXJjaGFzZU9yZGVyTGluZSBsaW5lIDogbGluZXMpIHsKICAgICAgICAgICAgcG8uYWRkTGluZShsaW5lKTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuIG9yZGVycy5zYXZlKHBvKS5nZXRJZCgpOwogICAgfQoKICAgIHByaXZhdGUgUHVyY2hhc2VPcmRlciByZWxvYWQobG9uZyBpZCkgewogICAgICAgIHJldHVybiB0eC5leGVjdXRlKHN0YXR1cyAtPiBvcmRlcnMuZmluZEJ5SWQoaWQpLm9yRWxzZVRocm93KCkpOwogICAgfQoKICAgIC8qKiBTdGFydHMgZXZlcnkgY2FsbCBhdCB0aGUgc2FtZSBtb21lbnQsIGVhY2ggb24gaXRzIG93biB0aHJlYWQuIEFuIG91dGNvbWUgaXMgbnVsbCBvbiBzdWNjZXNzLiAqLwogICAgcHJpdmF0ZSBzdGF0aWMgTGlzdDxUaHJvd2FibGU+IHJhY2UoTGlzdDxDYWxsYWJsZTw/Pj4gY2FsbHMpIHRocm93cyBJbnRlcnJ1cHRlZEV4Y2VwdGlvbiB7CiAgICAgICAgRXhlY3V0b3JTZXJ2aWNlIHBvb2wgPSBFeGVjdXRvcnMubmV3Rml4ZWRUaHJlYWRQb29sKGNhbGxzLnNpemUoKSk7CiAgICAgICAgdHJ5IHsKICAgICAgICAgICAgQ291bnREb3duTGF0Y2ggc3RhcnQgPSBuZXcgQ291bnREb3duTGF0Y2goMSk7CiAgICAgICAgICAgIExpc3Q8RnV0dXJlPD8+PiBmdXR1cmVzID0gSW50U3RyZWFtLnJhbmdlKDAsIGNhbGxzLnNpemUoKSkKICAgICAgICAgICAgICAgICAgICAuPEZ1dHVyZTw/Pj5tYXBUb09iaihpIC0+IHBvb2wuc3VibWl0KCgpIC0+IHsKICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQuYXdhaXQoKTsKICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxzLmdldChpKS5jYWxsKCk7CiAgICAgICAgICAgICAgICAgICAgfSkpCiAgICAgICAgICAgICAgICAgICAgLnRvTGlzdCgpOwogICAgICAgICAgICBzdGFydC5jb3VudERvd24oKTsKICAgICAgICAgICAgTGlzdDxUaHJvd2FibGU+IG91dGNvbWVzID0gbmV3IEFycmF5TGlzdDw+KCk7CiAgICAgICAgICAgIGZvciAoRnV0dXJlPD8+IGZ1dHVyZSA6IGZ1dHVyZXMpIHsKICAgICAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICAgICAgZnV0dXJlLmdldCgzMCwgVGltZVVuaXQuU0VDT05EUyk7CiAgICAgICAgICAgICAgICAgICAgb3V0Y29tZXMuYWRkKG51bGwpOwogICAgICAgICAgICAgICAgfSBjYXRjaCAoRXhlY3V0aW9uRXhjZXB0aW9uIGUpIHsKICAgICAgICAgICAgICAgICAgICBvdXRjb21lcy5hZGQoZS5nZXRDYXVzZSgpKTsKICAgICAgICAgICAgICAgIH0gY2F0Y2ggKFRpbWVvdXRFeGNlcHRpb24gZSkgewogICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcigiYSBjYWxsIGRpZCBub3QgZmluaXNoIHdpdGhpbiAzMCBzIiwgZSk7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgcmV0dXJuIG91dGNvbWVzOwogICAgICAgIH0gZmluYWxseSB7CiAgICAgICAgICAgIHBvb2wuc2h1dGRvd25Ob3coKTsKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBzdGF0aWMgdm9pZCBzbGVlcChEdXJhdGlvbiBkdXJhdGlvbikgewogICAgICAgIGlmIChkdXJhdGlvbi5pc1plcm8oKSkgewogICAgICAgICAgICByZXR1cm47CiAgICAgICAgfQogICAgICAgIHRyeSB7CiAgICAgICAgICAgIFRocmVhZC5zbGVlcChkdXJhdGlvbik7CiAgICAgICAgfSBjYXRjaCAoSW50ZXJydXB0ZWRFeGNlcHRpb24gZSkgewogICAgICAgICAgICBUaHJlYWQuY3VycmVudFRocmVhZCgpLmludGVycnVwdCgpOwogICAgICAgIH0KICAgIH0KfQo=', 'base64'), 'UTF8'), true, 15),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'src/test/java/com/zycus/procurement/po/InvoiceMatcherTest.java', 'java', convert_from(decode('cGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87CgppbXBvcnQgc3RhdGljIG9yZy5hc3NlcnRqLmNvcmUuYXBpLkFzc2VydGlvbnMuYXNzZXJ0VGhhdDsKCmltcG9ydCBjb20uenljdXMucHJvY3VyZW1lbnQucG8uRHRvcy5JbnZvaWNlTGluZTsKaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkludm9pY2VSZXF1ZXN0OwppbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuTWF0Y2hSZXN1bHQ7CmltcG9ydCBqYXZhLm1hdGguQmlnRGVjaW1hbDsKaW1wb3J0IGphdmEudXRpbC5MaXN0OwppbXBvcnQgb3JnLmp1bml0Lmp1cGl0ZXIuYXBpLkRpc3BsYXlOYW1lOwppbXBvcnQgb3JnLmp1bml0Lmp1cGl0ZXIuYXBpLlRlc3Q7CgpjbGFzcyBJbnZvaWNlTWF0Y2hlclRlc3QgewoKICAgIHByaXZhdGUgZmluYWwgSW52b2ljZU1hdGNoZXIgbWF0Y2hlciA9IG5ldyBJbnZvaWNlTWF0Y2hlcigpOwoKICAgIC8qKiBQTyBmb3Ig4oK5MSw1MDAuMDA6IFNLVS0xIHggOCBAIOKCuTE1MC4wMCBhbmQgU0tVLTIgeCAyIEAg4oK5MTUwLjAwLiAqLwogICAgcHJpdmF0ZSBzdGF0aWMgUHVyY2hhc2VPcmRlciBwbygpIHsKICAgICAgICBQdXJjaGFzZU9yZGVyIHBvID0gbmV3IFB1cmNoYXNlT3JkZXIoIlBPLTc3IiwgbmV3IEJpZ0RlY2ltYWwoIjE1MDAuMDAiKSk7CiAgICAgICAgcG8uYWRkTGluZShuZXcgUHVyY2hhc2VPcmRlckxpbmUoIlNLVS0xIiwgOCwgbmV3IEJpZ0RlY2ltYWwoIjE1MC4wMCIpKSk7CiAgICAgICAgcG8uYWRkTGluZShuZXcgUHVyY2hhc2VPcmRlckxpbmUoIlNLVS0yIiwgMiwgbmV3IEJpZ0RlY2ltYWwoIjE1MC4wMCIpKSk7CiAgICAgICAgcmV0dXJuIHBvOwogICAgfQoKICAgIHByaXZhdGUgc3RhdGljIEludm9pY2VMaW5lIGxpbmUoU3RyaW5nIHNrdSwgaW50IHF1YW50aXR5LCBTdHJpbmcgdW5pdFByaWNlKSB7CiAgICAgICAgcmV0dXJuIG5ldyBJbnZvaWNlTGluZShza3UsIHF1YW50aXR5LCBuZXcgQmlnRGVjaW1hbCh1bml0UHJpY2UpKTsKICAgIH0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJhbW91bnRzIHRoYXQgYXJlIGVxdWFsIGluIHZhbHVlIG1hdGNoLCBob3dldmVyIHRoZXkgYXJlIHdyaXR0ZW4iKQogICAgdm9pZCBjb21wYXJlc0Ftb3VudHNCeVZhbHVlKCkgewogICAgICAgIEludm9pY2VSZXF1ZXN0IGludm9pY2UgPSBuZXcgSW52b2ljZVJlcXVlc3QoIklOVi0xIiwgbmV3IEJpZ0RlY2ltYWwoIjE1MDAuMCIpLAogICAgICAgICAgICAgICAgTGlzdC5vZihsaW5lKCJTS1UtMSIsIDgsICIxNTAiKSwgbGluZSgiU0tVLTIiLCAyLCAiMTUwLjAwMCIpKSk7CgogICAgICAgIE1hdGNoUmVzdWx0IHJlc3VsdCA9IG1hdGNoZXIubWF0Y2gocG8oKSwgaW52b2ljZSk7CgogICAgICAgIGFzc2VydFRoYXQocmVzdWx0LnByb2JsZW1zKCkpLmlzRW1wdHkoKTsKICAgICAgICBhc3NlcnRUaGF0KHJlc3VsdC5tYXRjaGVkKCkpLmlzVHJ1ZSgpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImEgU0tVIHNwbGl0IG92ZXIgc2V2ZXJhbCBpbnZvaWNlIGxpbmVzIGNhbid0IGV4Y2VlZCB0aGUgb3JkZXJlZCBxdWFudGl0eSIpCiAgICB2b2lkIGFkZHNVcFNwbGl0TGluZXMoKSB7CiAgICAgICAgSW52b2ljZVJlcXVlc3QgaW52b2ljZSA9IG5ldyBJbnZvaWNlUmVxdWVzdCgiSU5WLTIiLCBuZXcgQmlnRGVjaW1hbCgiMTUwMC4wMCIpLAogICAgICAgICAgICAgICAgTGlzdC5vZihsaW5lKCJTS1UtMSIsIDUsICIxNTAuMDAiKSwgbGluZSgiU0tVLTEiLCA1LCAiMTUwLjAwIikpKTsKCiAgICAgICAgTWF0Y2hSZXN1bHQgcmVzdWx0ID0gbWF0Y2hlci5tYXRjaChwbygpLCBpbnZvaWNlKTsKCiAgICAgICAgYXNzZXJ0VGhhdChyZXN1bHQubWF0Y2hlZCgpKS5pc0ZhbHNlKCk7CiAgICAgICAgYXNzZXJ0VGhhdChyZXN1bHQucHJvYmxlbXMoKSkuYW55U2F0aXNmeShwIC0+IGFzc2VydFRoYXQocCkuY29udGFpbnMoIlNLVS0xIikpOwogICAgfQoKICAgIEBUZXN0CiAgICBARGlzcGxheU5hbWUoImEgZGlmZmVyZW50IHVuaXQgcHJpY2UgaXMgcmVwb3J0ZWQiKQogICAgdm9pZCByZXBvcnRzUHJpY2VEaWZmZXJlbmNlcygpIHsKICAgICAgICBJbnZvaWNlUmVxdWVzdCBpbnZvaWNlID0gbmV3IEludm9pY2VSZXF1ZXN0KCJJTlYtMyIsIG5ldyBCaWdEZWNpbWFsKCIxNTAwLjAwIiksCiAgICAgICAgICAgICAgICBMaXN0Lm9mKGxpbmUoIlNLVS0xIiwgOCwgIjE1MC4wMSIpKSk7CgogICAgICAgIGFzc2VydFRoYXQobWF0Y2hlci5tYXRjaChwbygpLCBpbnZvaWNlKS5tYXRjaGVkKCkpLmlzRmFsc2UoKTsKICAgIH0KCiAgICBAVGVzdAogICAgQERpc3BsYXlOYW1lKCJhIFNLVSB0aGF0IGlzbid0IG9uIHRoZSBQTyBpcyByZXBvcnRlZCIpCiAgICB2b2lkIHJlcG9ydHNVbmtub3duU2t1cygpIHsKICAgICAgICBJbnZvaWNlUmVxdWVzdCBpbnZvaWNlID0gbmV3IEludm9pY2VSZXF1ZXN0KCJJTlYtNCIsIG5ldyBCaWdEZWNpbWFsKCIxNTAwLjAwIiksCiAgICAgICAgICAgICAgICBMaXN0Lm9mKGxpbmUoIlNLVS05IiwgMSwgIjE1MC4wMCIpKSk7CgogICAgICAgIE1hdGNoUmVzdWx0IHJlc3VsdCA9IG1hdGNoZXIubWF0Y2gocG8oKSwgaW52b2ljZSk7CgogICAgICAgIGFzc2VydFRoYXQocmVzdWx0Lm1hdGNoZWQoKSkuaXNGYWxzZSgpOwogICAgICAgIGFzc2VydFRoYXQocmVzdWx0LnByb2JsZW1zKCkpLmFueVNhdGlzZnkocCAtPiBhc3NlcnRUaGF0KHApLmNvbnRhaW5zKCJTS1UtOSIpKTsKICAgIH0KfQo=', 'base64'), 'UTF8'), true, 16),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'checks/transactions.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsKICBiZWFuc0ZvciwKICBjYWxsc1Rocm91Z2gsCiAgY2F0Y2hCbG9ja3MsCiAgY2hlY2ssCiAgY29kZSwKICBoZWxwZXJzT2YsCiAgaXNSZWFkT25seSwKICBsb29wQm9kaWVzLAogIG1ldGhvZCwKICBub1N0cmluZ3MsCiAgb3BlbnNUcmFuc2FjdGlvbiwKICBvdXRzaWRlVHJhbnNhY3Rpb24sCiAgdGVtcGxhdGVzT2YsCiAgdHJhbnNhY3Rpb25hbE9mLAogIHVzZXNUZW1wbGF0ZSwKICB3aXRoSGVscGVycywKfSBmcm9tICcuL3N1cHBvcnQvamF2YSc7Cgpjb25zdCB7IHNlcnZpY2UgfSA9IGNvZGU7CmNvbnN0IHRlbXBsYXRlcyA9IHRlbXBsYXRlc09mKHNlcnZpY2UpOwovKiogcm9sbGJhY2tGb3IgLyByb2xsYmFja0ZvckNsYXNzTmFtZSAoU3ByaW5nKSBvciByb2xsYmFja09uIChKVEEpIHRoYXQgY292ZXJzIHRoZSBidWRnZXQncyBleGNlcHRpb24uICovCmNvbnN0IHJvbGxzQmFja09uQnVkZ2V0ID0gKHRleHQ6IHN0cmluZykgPT4KICAvXGIocm9sbGJhY2tGb3J8cm9sbGJhY2tPbilccyo9XHMqXHs/W14pXSpcYihCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbnxFeGNlcHRpb258VGhyb3dhYmxlKVwuY2xhc3MvLnRlc3QodGV4dCkgfHwKICAvXGJyb2xsYmFja0ZvckNsYXNzTmFtZVxzKj1ccypcez9bXildKiIoW1x3Ll0qXC4pPyhCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbnxFeGNlcHRpb258VGhyb3dhYmxlKSIvLnRlc3QodGV4dCk7CmNvbnN0IEJVREdFVCA9IC9cYihCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbnxFeGNlcHRpb258VGhyb3dhYmxlKVxiLzsKCmRlc2NyaWJlKCd0cmFuc2FjdGlvbnMnLCAoKSA9PiB7CiAgaXQoJ2EgcmVqZWN0aW9uIHJ1bnMgaW4gYSByZWFkLXdyaXRlIHRyYW5zYWN0aW9uJywgKCkgPT4gewogICAgY29uc3QgcmVqZWN0ID0gbWV0aG9kKHNlcnZpY2UsICdyZWplY3QnKTsKICAgIGNvbnN0IHR4ID0gdHJhbnNhY3Rpb25hbE9mKHNlcnZpY2UsIHJlamVjdCk7CiAgICBjb25zdCBvd24gPSBvcGVuc1RyYW5zYWN0aW9uKHR4KSAmJiAhaXNSZWFkT25seSh0eCk7CiAgICAvLyBPciBhIFRyYW5zYWN0aW9uVGVtcGxhdGU6IGl0cyBvd24gdHJhbnNhY3Rpb24sIHVubGVzcyBpdCBqb2lucyBhIHJlYWQtb25seSBvbmUuCiAgICBjb25zdCBwcm9ncmFtbWF0aWMgPSB0ZW1wbGF0ZXMuc29tZSgKICAgICAgKHQpID0+CiAgICAgICAgdXNlc1RlbXBsYXRlKG5vU3RyaW5ncyh3aXRoSGVscGVycyhzZXJ2aWNlLCByZWplY3QpKSwgdCkgJiYKICAgICAgICAhdC5yZWFkT25seSAmJgogICAgICAgICh0LnJlcXVpcmVzTmV3IHx8IG91dHNpZGVUcmFuc2FjdGlvbih0eCkgfHwgIWlzUmVhZE9ubHkodHgpKSwKICAgICk7CiAgICBjaGVjayhvd24gfHwgcHJvZ3JhbW1hdGljLCAnTG9va2VkIGF0IEFwcHJvdmFsU2VydmljZS5yZWplY3QoKSBhbmQgaXRzIGNsYXNzLicpOwogIH0pOwoKICBpdCgnYW4gYXBwcm92YWwgdGhlIGJ1ZGdldCByZWZ1c2VzIGlzIHJvbGxlZCBiYWNrJywgKCkgPT4gewogICAgY29uc3QgYXBwcm92ZSA9IG1ldGhvZChzZXJ2aWNlLCAnYXBwcm92ZScpOwogICAgY29uc3QgdHggPSB0cmFuc2FjdGlvbmFsT2Yoc2VydmljZSwgYXBwcm92ZSk7CiAgICBjb25zdCBzb3VyY2UgPSBub1N0cmluZ3Mod2l0aEhlbHBlcnMoc2VydmljZSwgYXBwcm92ZSkpOwogICAgLy8gVGhlIHJlZnVzYWwgbXVzdCBzdGlsbCByZWFjaCB0aGUgY2FsbGVyICg0MjIpOiBhIGNhdGNoIGVpdGhlciByZXRocm93cywgb3IgbWFya3MgdGhlCiAgICAvLyB0cmFuc2FjdGlvbiByb2xsYmFjay1vbmx5IGFuZCB0aGUgZXhjZXB0aW9uIGlzIHRocm93biBhZ2FpbiBsYXRlciAoYHRocm93IHJlZnVzZWRgKS4KICAgIGNvbnN0IHJldGhyb3dzTGF0ZXIgPSAvXGJ0aHJvd1xzKyg/IW5ld1xiKVtcdy5bXF1dKy8udGVzdChzb3VyY2UpOwogICAgY29uc3Qgc3dhbGxvd2VkID0gY2F0Y2hCbG9ja3Moc291cmNlKS5zb21lKAogICAgICAoYykgPT4KICAgICAgICBCVURHRVQudGVzdChjLnR5cGVzKSAmJgogICAgICAgICEvXGJ0aHJvd1xiLy50ZXN0KGMuYmxvY2spICYmCiAgICAgICAgISgvc2V0Um9sbGJhY2tPbmx5XHMqXCgvLnRlc3QoYy5ibG9jaykgJiYgcmV0aHJvd3NMYXRlciksCiAgICApOwogICAgY2hlY2soCiAgICAgICFpc1JlYWRPbmx5KHR4KSAmJgogICAgICAgICFzd2FsbG93ZWQgJiYKICAgICAgICAoKG9wZW5zVHJhbnNhY3Rpb24odHgpICYmIHJvbGxzQmFja09uQnVkZ2V0KHR4Py50ZXh0ID8/ICcnKSkgfHwgL3NldFJvbGxiYWNrT25seVxzKlwoLy50ZXN0KHNvdXJjZSkpLAogICAgICAnTG9va2VkIGF0IEFwcHJvdmFsU2VydmljZS5hcHByb3ZlKCkgYW5kIHRoZSB0cmFuc2FjdGlvbiBpdCBydW5zIGluLicsCiAgICApOwogIH0pOwp9KTsKCmRlc2NyaWJlKCdiYXRjaCBhcHByb3ZhbCcsICgpID0+IHsKICBjb25zdCBhcHByb3ZlQmF0Y2ggPSBtZXRob2Qoc2VydmljZSwgJ2FwcHJvdmVCYXRjaCcpOwogIGNvbnN0IGJhdGNoID0gbm9TdHJpbmdzKHdpdGhIZWxwZXJzKHNlcnZpY2UsIGFwcHJvdmVCYXRjaCkpOwogIGNvbnN0IGJhdGNoVHggPSB0cmFuc2FjdGlvbmFsT2Yoc2VydmljZSwgYXBwcm92ZUJhdGNoKTsKCiAgLyoqCiAgICogTWV0aG9kcyBvZiBpbmplY3RlZCBiZWFucyAoYW5vdGhlciBvbmUsIHRoaXMgc2VydmljZSBpdHNlbGYsIHRocm91Z2ggYW4gaW50ZXJmYWNlIG9yIGFuCiAgICogT2JqZWN0UHJvdmlkZXIpIHRoYXQgdGhlIGJhdGNoIGNhbGxzLgogICAqLwogIGNvbnN0IGludm9rZWQgPSBzZXJ2aWNlLmZpZWxkcy5mbGF0TWFwKChmKSA9PgogICAgYmVhbnNGb3IoZi50eXBlKS5mbGF0TWFwKChiZWFuKSA9PgogICAgICBiZWFuLm1ldGhvZHMuZmlsdGVyKChtKSA9PiBjYWxsc1Rocm91Z2goYmF0Y2gsIGYubmFtZSwgbS5uYW1lKSkubWFwKChtKSA9PiAoeyBiZWFuLCBtZXRob2Q6IG0gfSkpLAogICAgKSwKICApOwogIC8qKgogICAqIFRob3NlIHRoYXQgZ28gdGhyb3VnaCB0aGUgYmVhbidzIFNwcmluZyBwcm94eSBhbmQgc3RhcnQgYSB0cmFuc2FjdGlvbiBvZiB0aGVpciBvd24uIChBIGNhbGwgb24KICAgKiBgdGhpc2AgYnlwYXNzZXMgdGhlIHByb3h5LCBhbmQgYSBwcml2YXRlIG1ldGhvZCBpc24ndCBwcm94aWVkLikKICAgKi8KICBjb25zdCBwcm94aWVkID0gaW52b2tlZC5maWx0ZXIoKHsgYmVhbiwgbWV0aG9kOiBtIH0pID0+IHsKICAgIGNvbnN0IHR4ID0gdHJhbnNhY3Rpb25hbE9mKGJlYW4sIG0pOwogICAgcmV0dXJuICgKICAgICAgIW0ubW9kaWZpZXJzLmluY2x1ZGVzKCdwcml2YXRlJykgJiYKICAgICAgIW0ubW9kaWZpZXJzLmluY2x1ZGVzKCdzdGF0aWMnKSAmJgogICAgICBvcGVuc1RyYW5zYWN0aW9uKHR4KSAmJgogICAgICAoL1JFUVVJUkVTX05FVy8udGVzdCh0eD8udGV4dCA/PyAnJykgfHwgb3V0c2lkZVRyYW5zYWN0aW9uKGJhdGNoVHgpKQogICAgKTsKICB9KTsKICAvLyBBIHRlbXBsYXRlIHRoYXQgaXMgUkVRVUlSRUQgKFNwcmluZyBCb290J3Mgb3duKSBqb2lucyB0aGUgYmF0Y2gncyB0cmFuc2FjdGlvbiBpZiBpdCBoYXMgb25lLgogIGNvbnN0IHVzZWRUZW1wbGF0ZXMgPSB0ZW1wbGF0ZXMuZmlsdGVyKCh0KSA9PiB1c2VzVGVtcGxhdGUoYmF0Y2gsIHQpKTsKICBjb25zdCB2aWFUZW1wbGF0ZSA9IHVzZWRUZW1wbGF0ZXMuc29tZSgodCkgPT4gIXQucmVhZE9ubHkgJiYgKHQucmVxdWlyZXNOZXcgfHwgb3V0c2lkZVRyYW5zYWN0aW9uKGJhdGNoVHgpKSk7CiAgLy8gT3IgdGhlIHRyYW5zYWN0aW9uIG1hbmFnZXIgZGlyZWN0bHk6IGdldFRyYW5zYWN0aW9uKC4uLikgd2l0aCBhIFJFUVVJUkVTX05FVyBkZWZpbml0aW9uLgogIGNvbnN0IHZpYU1hbmFnZXIgPQogICAgL1wuXHMqZ2V0VHJhbnNhY3Rpb25ccypcKC8udGVzdChiYXRjaCkgJiYKICAgIC9cLlxzKmNvbW1pdFxzKlwoLy50ZXN0KGJhdGNoKSAmJgogICAgKC9SRVFVSVJFU19ORVcvLnRlc3Qobm9TdHJpbmdzKHNlcnZpY2UudGV4dCkpIHx8IG91dHNpZGVUcmFuc2FjdGlvbihiYXRjaFR4KSk7CgogIGl0KCdlYWNoIFBPIGluIGEgYmF0Y2ggaXMgYXBwcm92ZWQgaW4gaXRzIG93biB0cmFuc2FjdGlvbicsICgpID0+IHsKICAgIGNoZWNrKAogICAgICB2aWFUZW1wbGF0ZSB8fCB2aWFNYW5hZ2VyIHx8IHByb3hpZWQubGVuZ3RoID4gMCwKICAgICAgJ0xvb2tlZCBhdCBBcHByb3ZhbFNlcnZpY2UuYXBwcm92ZUJhdGNoKCkgYW5kIGhvdyBpdCBzdGFydHMgZWFjaCBQTy4nLAogICAgKTsKICB9KTsKCiAgaXQoJ2EgUE8gdGhlIGJ1ZGdldCByZWZ1c2VzIGlzIHJvbGxlZCBiYWNrIG9uIGl0cyBvd24nLCAoKSA9PiB7CiAgICAvLyBXaGF0IHJ1bnMgZm9yIGVhY2ggUE86IHRoZSBiYXRjaCB3aXRoIGl0cyBoZWxwZXJzLCBhbmQgdGhlIGJlYW5zJyBtZXRob2RzIGl0IGNhbGxzLiAoV2hldGhlcgogICAgLy8gdGhlaXIgb3duIHRyYW5zYWN0aW9uIHJlYWxseSBzdGFydHMgaXMgdGhlIGNoZWNrIGFib3ZlLikKICAgIGNvbnN0IHVuaXRzID0gWy4uLmhlbHBlcnNPZihzZXJ2aWNlLCBhcHByb3ZlQmF0Y2gpLm1hcCgobSkgPT4gKHsgYmVhbjogc2VydmljZSwgbWV0aG9kOiBtIH0pKSwgLi4uaW52b2tlZF07CiAgICBjb25zdCBwZXJQbyA9IFtiYXRjaCwgLi4uaW52b2tlZC5tYXAoKHUpID0+IG5vU3RyaW5ncyh3aXRoSGVscGVycyh1LmJlYW4sIHUubWV0aG9kKSkpXS5qb2luKCdcbicpOwogICAgLy8gSW4gYSB0ZW1wbGF0ZSdzIGNhbGxiYWNrLCB3cmFwcGluZyB0aGUgY2hlY2tlZCBleGNlcHRpb24gaW4gYW4gdW5jaGVja2VkIG9uZSByb2xscyBiYWNrIHRvby4KICAgIGNvbnN0IHdyYXBzSW5UZW1wbGF0ZSA9CiAgICAgIHVzZWRUZW1wbGF0ZXMubGVuZ3RoID4gMCAmJgogICAgICBjYXRjaEJsb2NrcyhwZXJQbykuc29tZSgoYykgPT4gL0J1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uLy50ZXN0KGMudHlwZXMpICYmIC9cYnRocm93XHMrbmV3XGIvLnRlc3QoYy5ibG9jaykpOwogICAgY2hlY2soCiAgICAgIC9zZXRSb2xsYmFja09ubHlccypcKFxzKlwpLy50ZXN0KHBlclBvKSB8fAogICAgICAgICh2aWFNYW5hZ2VyICYmIC9cLlxzKnJvbGxiYWNrXHMqXCgvLnRlc3QocGVyUG8pKSB8fAogICAgICAgIHdyYXBzSW5UZW1wbGF0ZSB8fAogICAgICAgIHVuaXRzLnNvbWUoKHUpID0+IHJvbGxzQmFja09uQnVkZ2V0KHRyYW5zYWN0aW9uYWxPZih1LmJlYW4sIHUubWV0aG9kKT8udGV4dCA/PyAnJykpLAogICAgICAnTG9va2VkIGF0IHRoZSBwZXItUE8gdW5pdCBvZiB3b3JrIG9mIEFwcHJvdmFsU2VydmljZS5hcHByb3ZlQmF0Y2goKS4nLAogICAgKTsKICB9KTsKCiAgaXQoImEgUE8gdGhhdCBjYW4ndCBiZSBhcHByb3ZlZCAoYWxyZWFkeSBkZWNpZGVkLCB1bmtub3duLCBjaGFuZ2VkIG1lYW53aGlsZSkgZG9lc24ndCBzdG9wIHRoZSBvdGhlcnMiLCAoKSA9PiB7CiAgICAvLyBDYXVnaHQgZm9yIGVhY2ggUE8sIGluc2lkZSB0aGUgbG9vcDogYW4gYWxyZWFkeS1kZWNpZGVkIFBPIChJbGxlZ2FsU3RhdGVFeGNlcHRpb24pLCBhbiB1bmtub3duCiAgICAvLyBvbmUgKFBvTm90Rm91bmRFeGNlcHRpb24pIGFuZCBhIGNvbmN1cnJlbnQgY2hhbmdlIChvcHRpbWlzdGljIGxvY2tpbmcpLgogICAgY29uc3QgY2F1Z2h0ID0gbG9vcEJvZGllcyhiYXRjaCkKICAgICAgLmZsYXRNYXAoKGIpID0+IGNhdGNoQmxvY2tzKGIpLm1hcCgoYykgPT4gYy50eXBlcykpCiAgICAgIC5qb2luKCcgJyk7CiAgICBjb25zdCBjb3ZlcnMgPSAobmFtZXM6IHN0cmluZykgPT4gbmV3IFJlZ0V4cChgXFxiKCR7bmFtZXN9fFJ1bnRpbWVFeGNlcHRpb258RXhjZXB0aW9ufFRocm93YWJsZSlcXGJgKS50ZXN0KGNhdWdodCk7CiAgICBjaGVjaygKICAgICAgY292ZXJzKCdJbGxlZ2FsU3RhdGVFeGNlcHRpb24nKSAmJgogICAgICAgIGNvdmVycygnUG9Ob3RGb3VuZEV4Y2VwdGlvbicpICYmCiAgICAgICAgY292ZXJzKAogICAgICAgICAgJ09wdGltaXN0aWNMb2NraW5nRmFpbHVyZUV4Y2VwdGlvbnxPYmplY3RPcHRpbWlzdGljTG9ja2luZ0ZhaWx1cmVFeGNlcHRpb258Q29uY3VycmVuY3lGYWlsdXJlRXhjZXB0aW9ufFRyYW5zaWVudERhdGFBY2Nlc3NFeGNlcHRpb258RGF0YUFjY2Vzc0V4Y2VwdGlvbicsCiAgICAgICAgKSwKICAgICAgJ0xvb2tlZCBhdCB3aGF0IEFwcHJvdmFsU2VydmljZS5hcHByb3ZlQmF0Y2goKSBjYXRjaGVzIGZvciBlYWNoIFBPLCBpbnNpZGUgaXRzIGxvb3AuJywKICAgICk7CiAgfSk7Cn0pOwo=', 'base64'), 'UTF8'), true, 17),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'checks/approvals.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsKICBhbm5vdGF0aW9uLAogIGJvZHksCiAgY2hlY2ssCiAgY29kZSwKICBjb25kaXRpb25zVGhhdFRocm93LAogIGxvY2tzUm93LAogIG1ldGhvZCwKICBub1N0cmluZ3MsCiAgd2l0aEhlbHBlcnMsCn0gZnJvbSAnLi9zdXBwb3J0L2phdmEnOwoKY29uc3QgeyBzZXJ2aWNlLCBwdXJjaGFzZU9yZGVyLCBvcmRlcnMsIGlkZW1wb3RlbmN5LCBpZGVtcG90ZW5jeVJlY29yZCwgaGFuZGxlciB9ID0gY29kZTsKY29uc3QgYXBwcm92ZU1ldGhvZCA9IG1ldGhvZChzZXJ2aWNlLCAnYXBwcm92ZScpOwovKiogYXBwcm92ZSgpIHdpdGggaXRzIGhlbHBlcnMsIGFzIGNvZGUgKHN0cmluZyBjb250ZW50cyBibGFua2VkKSBhbmQgYXMgd3JpdHRlbi4gKi8KY29uc3QgYXBwcm92ZSA9IG5vU3RyaW5ncyh3aXRoSGVscGVycyhzZXJ2aWNlLCBhcHByb3ZlTWV0aG9kKSk7CmNvbnN0IGFwcHJvdmVUZXh0ID0gd2l0aEhlbHBlcnMoc2VydmljZSwgYXBwcm92ZU1ldGhvZCk7CgovKiogVGhlIGNvbHVtbiBvZiBhbiBJZGVtcG90ZW5jeVJlY29yZCBmaWVsZDogaXRzIEBDb2x1bW4gbmFtZSwgb3IgdGhlIGZpZWxkJ3MgbmFtZS4gKi8KY29uc3QgY29sdW1uT2YgPSAoZmllbGQ6IHN0cmluZykgPT4gewogIGNvbnN0IGYgPSBpZGVtcG90ZW5jeVJlY29yZC5maWVsZHMuZmluZCgoeCkgPT4geC5uYW1lID09PSBmaWVsZCk7CiAgcmV0dXJuIChmICYmIC9uYW1lXHMqPVxzKiIoW14iXSspIi8uZXhlYyhhbm5vdGF0aW9uKGYsICdDb2x1bW4nKT8udGV4dCA/PyAnJyk/LlsxXSkgPz8gZmllbGQ7Cn07CmNvbnN0IGlzQXBwcm92ZXIgPSAoY29sdW1uOiBzdHJpbmcpID0+IC9hcHByb3Zlci9pLnRlc3QoY29sdW1uKTsKY29uc3QgaXNLZXkgPSAoY29sdW1uOiBzdHJpbmcpID0+IC9rZXkvaS50ZXN0KGNvbHVtbikgJiYgIWlzQXBwcm92ZXIoY29sdW1uKTsKCi8qKiBDb2x1bW4gc2V0cyB0aGF0IGFyZSB1bmlxdWU6IHVuaXF1ZSBjb25zdHJhaW50cywgdW5pcXVlIGluZGV4ZXMsIGEgY29tcG9zaXRlIHByaW1hcnkga2V5LiAqLwpmdW5jdGlvbiB1bmlxdWVDb2x1bW5TZXRzKCk6IHN0cmluZ1tdW10gewogIGNvbnN0IHRhYmxlID0gYW5ub3RhdGlvbihpZGVtcG90ZW5jeVJlY29yZCwgJ1RhYmxlJyk/LnRleHQgPz8gJyc7CiAgY29uc3QgbmFtZXMgPSAobGlzdDogc3RyaW5nKSA9PiBbLi4ubGlzdC5tYXRjaEFsbCgvIihbXiJdKikiL2cpXS5mbGF0TWFwKChtKSA9PiAobVsxXSA/PyAnJykuc3BsaXQoJywnKSk7CiAgY29uc3QgY2xlYW4gPSAoY29sczogc3RyaW5nW10pID0+IGNvbHMubWFwKChjKSA9PiBjLnRyaW0oKS5yZXBsYWNlKC9ccysoYXNjfGRlc2MpJC9pLCAnJykpLmZpbHRlcihCb29sZWFuKTsKICBjb25zdCBzZXRzID0gWwogICAgLi4uWy4uLnRhYmxlLm1hdGNoQWxsKC9AVW5pcXVlQ29uc3RyYWludFxzKlwoKFteKV0qKVwpL2cpXS5tYXAoKG0pID0+CiAgICAgIGNsZWFuKG5hbWVzKC9jb2x1bW5OYW1lc1xzKj1ccyooXHtbXn1dKlx9fCJbXiJdKiIpLy5leGVjKG1bMV0gPz8gJycpPy5bMV0gPz8gJycpKSwKICAgICksCiAgICAuLi5bLi4udGFibGUubWF0Y2hBbGwoL0BJbmRleFxzKlwoKFteKV0qKVwpL2cpXQogICAgICAuZmlsdGVyKChtKSA9PiAvdW5pcXVlXHMqPVxzKnRydWUvLnRlc3QobVsxXSA/PyAnJykpCiAgICAgIC5tYXAoKG0pID0+IGNsZWFuKG5hbWVzKC9jb2x1bW5MaXN0XHMqPVxzKigiW14iXSoiKS8uZXhlYyhtWzFdID8/ICcnKT8uWzFdID8/ICcnKSkpLAogIF07CiAgLy8gQElkQ2xhc3M6IGV2ZXJ5IEBJZCBmaWVsZCBpcyBwYXJ0IG9mIHRoZSBwcmltYXJ5IGtleS4KICBjb25zdCBpZHMgPSBpZGVtcG90ZW5jeVJlY29yZC5maWVsZHMuZmlsdGVyKChmKSA9PiBhbm5vdGF0aW9uKGYsICdJZCcpKTsKICBpZiAoaWRzLmxlbmd0aCA+IDEpIHNldHMucHVzaChpZHMubWFwKChmKSA9PiBjb2x1bW5PZihmLm5hbWUpKSk7CiAgLy8gQEVtYmVkZGVkSWQ6IHRoZSBlbWJlZGRlZCBjbGFzcydzIGZpZWxkcy4KICBjb25zdCBlbWJlZGRlZCA9IGlkZW1wb3RlbmN5UmVjb3JkLmZpZWxkcy5maW5kKChmKSA9PiBhbm5vdGF0aW9uKGYsICdFbWJlZGRlZElkJykpOwogIGNvbnN0IGtleSA9IGVtYmVkZGVkICYmIGlkZW1wb3RlbmN5UmVjb3JkLnR5cGVzLmZpbmQoKHQpID0+IHQubmFtZSA9PT0gZW1iZWRkZWQudHlwZSk7CiAgaWYgKGtleSkgewogICAgc2V0cy5wdXNoKAogICAgICBrZXkuZmllbGRzLm1hcCgoZikgPT4gL25hbWVccyo9XHMqIihbXiJdKykiLy5leGVjKGFubm90YXRpb24oZiwgJ0NvbHVtbicpPy50ZXh0ID8/ICcnKT8uWzFdID8/IGYubmFtZSksCiAgICApOwogIH0KICBmb3IgKGNvbnN0IGYgb2YgaWRlbXBvdGVuY3lSZWNvcmQuZmllbGRzKSB7CiAgICBpZiAoL3VuaXF1ZVxzKj1ccyp0cnVlLy50ZXN0KGFubm90YXRpb24oZiwgJ0NvbHVtbicpPy50ZXh0ID8/ICcnKSkgc2V0cy5wdXNoKFtjb2x1bW5PZihmLm5hbWUpXSk7CiAgfQogIHJldHVybiBzZXRzOwp9CgovKiogUmVwb3NpdG9yeSBtZXRob2RzIHRoYXQgbG9jayB0aGUgUE8gcm93IGZvciB3cml0aW5nLiAqLwpjb25zdCBsb2NraW5nTWV0aG9kcyA9IG9yZGVycy5tZXRob2RzCiAgLmZpbHRlcigobSkgPT4gL1BFU1NJTUlTVElDX1dSSVRFLy50ZXN0KGFubm90YXRpb24obSwgJ0xvY2snKT8udGV4dCA/PyAnJykpCiAgLm1hcCgobSkgPT4gbS5uYW1lKTsKLyoqIGFwcHJvdmUoKSByZWFjaGVzIGEgbG9va3VwIHRoYXQgbG9ja3MgdGhlIHJvdyAoYSBsb2NrIHVzZWQgZWxzZXdoZXJlIGRvZXNuJ3QgcHJvdGVjdCBpdCkuICovCmNvbnN0IGFwcHJvdmVMb2NrcyA9IGxvY2tzUm93KGFwcHJvdmUsIGxvY2tpbmdNZXRob2RzKTsKY29uc3QgdmVyc2lvbmVkID0gcHVyY2hhc2VPcmRlci5maWVsZHMuc29tZSgoZikgPT4gYW5ub3RhdGlvbihmLCAnVmVyc2lvbicpKTsKCmRlc2NyaWJlKCdpZGVtcG90ZW5jeScsICgpID0+IHsKICBpdCgnYSBrZXkgaXMgdW5pcXVlIHBlciBhcHByb3ZlciBpbiB0aGUgZGF0YWJhc2UnLCAoKSA9PiB7CiAgICBjb25zdCBzZXRzID0gdW5pcXVlQ29sdW1uU2V0cygpOwogICAgY29uc3QgcGVyQXBwcm92ZXIgPSBzZXRzLnNvbWUoKHMpID0+IHMuc29tZShpc0FwcHJvdmVyKSAmJiBzLnNvbWUoaXNLZXkpKTsKICAgIC8vIEEga2V5IHVuaXF1ZSBvbiBpdHMgb3duIHdvdWxkIHJlZnVzZSB0d28gYXBwcm92ZXJzIHdobyBoYXBwZW4gdG8gZ2VuZXJhdGUgdGhlIHNhbWUga2V5LgogICAgY29uc3Qga2V5QWxvbmUgPSBzZXRzLnNvbWUoKHMpID0+IHMubGVuZ3RoID4gMCAmJiBzLmV2ZXJ5KGlzS2V5KSk7CiAgICBjaGVjayhwZXJBcHByb3ZlciAmJiAha2V5QWxvbmUsICdMb29rZWQgYXQgdGhlIHVuaXF1ZSBjb25zdHJhaW50cyBhbmQgdGhlIGlkIG9mIElkZW1wb3RlbmN5UmVjb3JkLicpOwogIH0pOwoKICBpdCgncmV0cmllcyB0aGF0IGFycml2ZSBhdCB0aGUgc2FtZSB0aW1lIGFyZSBhcHBsaWVkIG9uY2UnLCAoKSA9PiB7CiAgICBjb25zdCBiZWZvcmUgPSAoc291cmNlOiBzdHJpbmcsIG5lZWRsZTogUmVnRXhwKSA9PiB7CiAgICAgIGNvbnN0IGFwcGxpZWQgPSBzb3VyY2UuaW5kZXhPZigncmVjb3JkQXBwcm92YWwnKTsKICAgICAgY29uc3QgbSA9IG5lZWRsZS5leGVjKHNvdXJjZSk7CiAgICAgIHJldHVybiAhIW0gJiYgYXBwbGllZCA+PSAwICYmIG0uaW5kZXggPCBhcHBsaWVkOwogICAgfTsKICAgIGNvbnN0IGF0b21pY0luc2VydHMgPSBpZGVtcG90ZW5jeS5tZXRob2RzLmZpbHRlcigobSkgPT4gewogICAgICBjb25zdCBxID0gYW5ub3RhdGlvbihtLCAnUXVlcnknKT8udGV4dCA/PyAnJzsKICAgICAgcmV0dXJuIC9pbnNlcnRccytpbnRvL2kudGVzdChxKSAmJiAvb25ccytjb25mbGljdC9pLnRlc3QocSk7CiAgICB9KTsKICAgIGNvbnN0IGNsYWltc0ZpcnN0ID0gYXRvbWljSW5zZXJ0cy5zb21lKChtKSA9PiBiZWZvcmUoYXBwcm92ZSwgbmV3IFJlZ0V4cChgXFwuXFxzKiR7bS5uYW1lfVxccypcXChgKSkpOwogICAgLy8gVGhlIHNhbWUgaW5zZXJ0IHRocm91Z2ggdGhlIEVudGl0eU1hbmFnZXIgaW4gdGhlIHNlcnZpY2UuCiAgICBjb25zdCBjbGFpbXNJblNlcnZpY2UgPQogICAgICBiZWZvcmUoYXBwcm92ZVRleHQsIC9pbnNlcnRccytpbnRvW147XSo/b25ccytjb25mbGljdC9pKSAmJiAvXC5ccypleGVjdXRlVXBkYXRlXHMqXCgvLnRlc3QoYXBwcm92ZSk7CiAgICBjb25zdCBmbHVzaGVkRmlyc3QgPQogICAgICBiZWZvcmUoYXBwcm92ZSwgL1wuXHMqc2F2ZUFuZEZsdXNoXHMqXCgvKSB8fAogICAgICAoYmVmb3JlKGFwcHJvdmUsIC9cLlxzKnNhdmVccypcKC8pICYmIGJlZm9yZShhcHByb3ZlLCAvXC5ccypmbHVzaFxzKlwoXHMqXCkvKSk7CiAgICBjb25zdCBpbnNlcnRzRmlyc3QgPSBmbHVzaGVkRmlyc3QgJiYgL0RhdGFJbnRlZ3JpdHlWaW9sYXRpb25FeGNlcHRpb24vLnRlc3Qobm9TdHJpbmdzKHNlcnZpY2UudGV4dCkpOwogICAgY2hlY2soCiAgICAgIGNsYWltc0ZpcnN0IHx8IGNsYWltc0luU2VydmljZSB8fCBpbnNlcnRzRmlyc3QsCiAgICAgICdMb29rZWQgYXQgQXBwcm92YWxTZXJ2aWNlLmFwcHJvdmUoKSBhbmQgSWRlbXBvdGVuY3lSZWNvcmRSZXBvc2l0b3J5LicsCiAgICApOwogIH0pOwoKICBpdCgnYSBrZXkgaXMgbG9va2VkIHVwIGZvciBpdHMgb3duIGFwcHJvdmVyIG9ubHknLCAoKSA9PiB7CiAgICBjb25zdCBmaW5kZXIgPQogICAgICBpZGVtcG90ZW5jeS5tZXRob2RzLmZpbmQoKG0pID0+IC9hcHByb3Zlci9pLnRlc3QobS5uYW1lKSAmJiAva2V5L2kudGVzdChtLm5hbWUpKSA/PwogICAgICBpZGVtcG90ZW5jeS5tZXRob2RzLmZpbmQoKG0pID0+IC9zZWxlY3RbXHNcU10qYXBwcm92ZXIvaS50ZXN0KGFubm90YXRpb24obSwgJ1F1ZXJ5Jyk/LnRleHQgPz8gJycpKTsKICAgIGNoZWNrKAogICAgICAhIWZpbmRlciAmJiBuZXcgUmVnRXhwKGBcXC5cXHMqJHtmaW5kZXIubmFtZX1cXHMqXFwoYCkudGVzdChhcHByb3ZlKSwKICAgICAgJ0xvb2tlZCBhdCBob3cgQXBwcm92YWxTZXJ2aWNlLmFwcHJvdmUoKSBmaW5kcyBhbiBlYXJsaWVyIHJlcXVlc3Qgd2l0aCB0aGUgc2FtZSBrZXkuJywKICAgICk7CiAgfSk7CgogIGl0KCdyZXVzaW5nIGEga2V5IGZvciBhIGRpZmZlcmVudCBQTyBpcyByZWZ1c2VkJywgKCkgPT4gewogICAgLy8gVGhlIHN0b3JlZCBQTyBpZCwgcmVhZCBkaXJlY3RseSBvciBpbnRvIGEgbG9jYWwgdmFyaWFibGUgZmlyc3QuCiAgICBjb25zdCBzdG9yZWQgPSBbJyg/OmdldCk/W3BQXXVyY2hhc2VPcmRlcklkXFwoXFwpJ107CiAgICBmb3IgKGNvbnN0IG0gb2YgYXBwcm92ZS5tYXRjaEFsbCgvXGIoXHcrKVxzKj1ccypbXjs9XSooPzpnZXQpP1twUF11cmNoYXNlT3JkZXJJZFwoXClccyo7L2cpKSB7CiAgICAgIHN0b3JlZC5wdXNoKGBcXGIke21bMV19XFxiKD8hXFxzKlxcKClgKTsKICAgIH0KICAgIC8vIC4uLiBjb21wYXJlZCBhcyBkaWZmZXJlbnQsIGluIGEgY29uZGl0aW9uIHdob3NlIGJyYW5jaCB0aHJvd3MgLi4uCiAgICBjb25zdCBkaWZmZXJzID0gKGM6IHN0cmluZykgPT4KICAgICAgc3RvcmVkLnNvbWUoKHMpID0+CiAgICAgICAgbmV3IFJlZ0V4cCgKICAgICAgICAgIGAke3N9XFxzKiE9fCE9XFxzKltcXHcuKCldKiR7c318IVxccypbXFx3LigpXSoke3N9XFxzKlxcKT9cXHMqXFwuZXF1YWxzfCFcXHMqW1xcdy5dKmVxdWFsc1xccypcXChbXjtdKiR7c31gLAogICAgICAgICkudGVzdChjKSwKICAgICAgKTsKICAgIGNvbnN0IHJlZnVzZWRJbkJyYW5jaCA9IGNvbmRpdGlvbnNUaGF0VGhyb3coYXBwcm92ZSkuc29tZShkaWZmZXJzKTsKICAgIC8vIC4uLiBvciB0aGUgc2FtZSBvbmUgcmV0dXJucyBlYXJseSBhbmQgZXZlcnl0aGluZyBlbHNlIHRocm93cyAuLi4KICAgIGNvbnN0IHNhbWVSZXR1cm5zRWxzZVRocm93cyA9IHN0b3JlZC5zb21lKChzKSA9PgogICAgICBuZXcgUmVnRXhwKGBpZlxccypcXChbXjt7XSooJHtzfVxccyo9PXw9PVxccypbXFx3LigpXSoke3N9fCR7c31cXHMqXFwpP1xccypcXC5lcXVhbHMpW147e10qXFwpXFxzKlxcez9cXHMqcmV0dXJuXFxiW147XSo7XFxzKlxcfT9cXHMqdGhyb3dcXHMrbmV3XFxiYCkudGVzdChhcHByb3ZlKSwKICAgICk7CiAgICAvLyAuLi4gb3IgT3B0aW9uYWwuZmlsdGVyKHNhbWUgUE8pLm9yRWxzZVRocm93KCgpIC0+IG5ldyAuLi4pLgogICAgY29uc3QgZmlsdGVyZWQgPSBzdG9yZWQuc29tZSgocykgPT4KICAgICAgbmV3IFJlZ0V4cChgXFwuXFxzKmZpbHRlclxccypcXChbXjtdKiR7c31bXjtdKlxcKVxccypcXC5cXHMqb3JFbHNlVGhyb3dcXHMqXFwoXFxzKihcXChcXHMqXFwpXFxzKi0+fFxcdys6Om5ldylgKS50ZXN0KGFwcHJvdmUpLAogICAgKTsKICAgIGNoZWNrKAogICAgICByZWZ1c2VkSW5CcmFuY2ggfHwgc2FtZVJldHVybnNFbHNlVGhyb3dzIHx8IGZpbHRlcmVkLAogICAgICAnTG9va2VkIGF0IEFwcHJvdmFsU2VydmljZS5hcHByb3ZlKCkgd2hlbiB0aGUga2V5IHdhcyB1c2VkIGJlZm9yZS4nLAogICAgKTsKICB9KTsKfSk7CgpkZXNjcmliZSgnYXBwcm92ZXJzJywgKCkgPT4gewogIGNvbnN0IHJlY29yZCA9IG1ldGhvZChwdXJjaGFzZU9yZGVyLCAncmVjb3JkQXBwcm92YWwnKTsKICBjb25zdCByZWNvcmRCb2R5ID0gbm9TdHJpbmdzKHdpdGhIZWxwZXJzKHB1cmNoYXNlT3JkZXIsIHJlY29yZCkpOwoKICBpdCgnYSBQTyByZW1lbWJlcnMgd2hvIGFwcHJvdmVkIGl0JywgKCkgPT4gewogICAgY29uc3QgYXBwcm92ZXIgPSByZWNvcmQucGFyYW1zWzBdPy5uYW1lID8/ICcnOwogICAgLy8gQSBwZXJzaXN0ZW50IGNvbGxlY3Rpb24gdGhlIGFwcHJvdmVyJ3MgaWQgaXMgYWRkZWQgdG8gKG5vdCwgc2F5LCB0aGUgUE8ncyBsaW5lcykuCiAgICBjb25zdCByZW1lbWJlcnMgPSBwdXJjaGFzZU9yZGVyLmZpZWxkcy5zb21lKAogICAgICAoZikgPT4KICAgICAgICAvXihTZXR8TGlzdHxDb2xsZWN0aW9ufEhhc2hTZXR8TGlua2VkSGFzaFNldHxBcnJheUxpc3R8TWFwfEhhc2hNYXB8TGlua2VkSGFzaE1hcClccyo8Ly50ZXN0KGYudHlwZSkgJiYKICAgICAgICBbJ0VsZW1lbnRDb2xsZWN0aW9uJywgJ09uZVRvTWFueScsICdNYW55VG9NYW55J10uc29tZSgoYSkgPT4gYW5ub3RhdGlvbihmLCBhKSkgJiYKICAgICAgICAhIWFwcHJvdmVyICYmCiAgICAgICAgbmV3IFJlZ0V4cCgKICAgICAgICAgIGBcXGIke2YubmFtZX1cXHMqXFwuXFxzKihhZGR8cHV0fHB1dElmQWJzZW50fGNvbXB1dGVJZkFic2VudHxtZXJnZSlcXHMqXFwoXFxzKiR7YXBwcm92ZXJ9XFxiYCwKICAgICAgICApLnRlc3QocmVjb3JkQm9keSksCiAgICApOwogICAgY2hlY2soCiAgICAgIHJlbWVtYmVycyAmJiAvcmVjb3JkQXBwcm92YWxccypcKFxzKlx3Ly50ZXN0KG5vU3RyaW5ncyhzZXJ2aWNlLnRleHQpKSwKICAgICAgJ0xvb2tlZCBhdCBQdXJjaGFzZU9yZGVyLnJlY29yZEFwcHJvdmFsKCksIGl0cyBmaWVsZHMsIGFuZCBob3cgQXBwcm92YWxTZXJ2aWNlIGNhbGxzIGl0LicsCiAgICApOwogIH0pOwoKICBpdCgidGhlIHNhbWUgcGVyc29uIGNhbid0IGdpdmUgYm90aCBhcHByb3ZhbHMgb2YgYSBQTyIsICgpID0+IHsKICAgIC8vIFRoZSByZXBlYXQgaXRzZWxmIG11c3QgYmUgcmVmdXNlZDogYGlmICghYXBwcm92ZXJzLmFkZChpZCkpIHRocm93YCwgYGlmIChhcHByb3ZlcnMuY29udGFpbnMoaWQpKQogICAgLy8gdGhyb3dgIG9yIEFzc2VydC5zdGF0ZShhcHByb3ZlcnMuYWRkKGlkKSwgLi4uKSwgbm90IGp1c3Qgc29tZSBvdGhlciB0aHJvdyBpbiB0aGUgbWV0aG9kLgogICAgY29uc3QgcmVmdXNlc1JlcGVhdCA9CiAgICAgIGNvbmRpdGlvbnNUaGF0VGhyb3cocmVjb3JkQm9keSkuc29tZSgKICAgICAgICAoYykgPT4KICAgICAgICAgIC8hXHMqW1x3Ll0rXHMqXC5ccyphZGRccypcKC8udGVzdChjKSB8fAogICAgICAgICAgLyg/PCFbIVx3LiRdXHMqKVxiW1x3Ll0qXC4oY29udGFpbnN8Y29udGFpbnNLZXkpXHMqXCgvLnRlc3QoYykgfHwKICAgICAgICAgIC9cLlxzKnB1dElmQWJzZW50XHMqXChbXjtdKlwpXHMqIT1ccypudWxsLy50ZXN0KGMpLAogICAgICApIHx8IC9Bc3NlcnRcLnN0YXRlXHMqXChccyooW1x3Ll0rXHMqXC5ccyphZGRccypcKHwhXHMqW1x3Ll0rXHMqXC5ccypjb250YWlucyhLZXkpP1xzKlwoKS8udGVzdChyZWNvcmRCb2R5KTsKICAgIGNoZWNrKHJlZnVzZXNSZXBlYXQsICdMb29rZWQgYXQgUHVyY2hhc2VPcmRlci5yZWNvcmRBcHByb3ZhbCgpLicpOwogIH0pOwoKICBpdCgidHdvIHBlb3BsZSBhcHByb3ZpbmcgYXQgdGhlIHNhbWUgbW9tZW50IGNhbid0IG92ZXJ3cml0ZSBlYWNoIG90aGVyJ3MgYXBwcm92YWwiLCAoKSA9PiB7CiAgICBjaGVjayh2ZXJzaW9uZWQgfHwgYXBwcm92ZUxvY2tzLCAnTG9va2VkIGF0IFB1cmNoYXNlT3JkZXIgYW5kIGhvdyBBcHByb3ZhbFNlcnZpY2UuYXBwcm92ZSgpIGxvYWRzIGl0LicpOwogIH0pOwoKICBpdCgnYSBjb25jdXJyZW50IGNoYW5nZSBpcyBhbnN3ZXJlZCB3aXRoIDQwOSBDb25mbGljdCcsICgpID0+IHsKICAgIGNvbnN0IG1hcHBlZCA9IGhhbmRsZXIubWV0aG9kcy5zb21lKAogICAgICAobSkgPT4KICAgICAgICAvT3B0aW1pc3RpY0xvY2t8Q29uY3VycmVuY3lGYWlsdXJlfFN0YWxlT2JqZWN0U3RhdGV8U3RhbGVTdGF0ZS8udGVzdCgKICAgICAgICAgIGFubm90YXRpb24obSwgJ0V4Y2VwdGlvbkhhbmRsZXInKT8udGV4dCA/PyBtLnRleHQsCiAgICAgICAgKSAmJiAvQ09ORkxJQ1R8NDA5Ly50ZXN0KGAke2JvZHkobSl9ICR7YW5ub3RhdGlvbihtLCAnUmVzcG9uc2VTdGF0dXMnKT8udGV4dCA/PyAnJ31gKSwKICAgICk7CiAgICBjaGVjaygodmVyc2lvbmVkICYmIG1hcHBlZCkgfHwgKCF2ZXJzaW9uZWQgJiYgYXBwcm92ZUxvY2tzKSwgJ0xvb2tlZCBhdCBBcGlFeGNlcHRpb25IYW5kbGVyLicpOwogIH0pOwp9KTsK', 'base64'), 'UTF8'), true, 18),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'checks/invoices.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsKICBhbm5vdGF0aW9uLAogIGJvZHksCiAgY2hlY2ssCiAgY29kZSwKICBoZWxwZXJzT2YsCiAgbWV0aG9kLAogIG5vU3RyaW5ncywKICB0ZW1wbGF0ZXNPZiwKICB1c2VzVGVtcGxhdGUsCiAgd2l0aEhlbHBlcnMsCn0gZnJvbSAnLi9zdXBwb3J0L2phdmEnOwoKY29uc3QgeyBtYXRjaGVyLCBjb250cm9sbGVyLCBvcmRlcnMsIHNlcnZpY2UgfSA9IGNvZGU7CmNvbnN0IG1hdGNoTWV0aG9kID0gbWV0aG9kKG1hdGNoZXIsICdtYXRjaCcpOwovKiogbWF0Y2goKSB3aXRoIGl0cyBoZWxwZXJzIHdyaXR0ZW4gaW4sIHN0cmluZyBjb250ZW50cyBibGFua2VkLiAqLwpjb25zdCBtYXRjaCA9IG5vU3RyaW5ncyh3aXRoSGVscGVycyhtYXRjaGVyLCBtYXRjaE1ldGhvZCkpOwoKZGVzY3JpYmUoJ2ludm9pY2UgbWF0Y2hpbmcnLCAoKSA9PiB7CiAgaXQoJ2Ftb3VudHMgYXJlIGNvbXBhcmVkIGJ5IHZhbHVlLCB3aGF0ZXZlciB0aGVpciBzY2FsZSAoMTUwMC4wID0gMTUwMC4wMCknLCAoKSA9PiB7CiAgICBjb25zdCBhbW91bnQgPSAnW1xcdy5dKihnZXRUb3RhbHxnZXRVbml0UHJpY2V8YW1vdW50fHVuaXRQcmljZSlcXChcXCknOwogICAgLy8gQmlnRGVjaW1hbC5lcXVhbHMgY29tcGFyZXMgdGhlIHNjYWxlIHRvbzogYS5lcXVhbHMoYiksIGIuZXF1YWxzKGEpLCBPYmplY3RzLmVxdWFscyhhLCBiKSwKICAgIC8vIGFsc28gaW4gYSBoZWxwZXIgdGhhdCB0YWtlcyBCaWdEZWNpbWFscy4KICAgIGNvbnN0IHNjYWxlU2Vuc2l0aXZlID0KICAgICAgbmV3IFJlZ0V4cChgJHthbW91bnR9XFxzKlxcLmVxdWFsc1xcKGApLnRlc3QobWF0Y2gpIHx8CiAgICAgIG5ldyBSZWdFeHAoYFxcLmVxdWFsc1xcKFxccyoke2Ftb3VudH1cXHMqXFwpYCkudGVzdChtYXRjaCkgfHwKICAgICAgbmV3IFJlZ0V4cChgT2JqZWN0c1xcLmVxdWFsc1xcKFxccyooJHthbW91bnR9fFteLDtdKixcXHMqJHthbW91bnR9KWApLnRlc3QobWF0Y2gpIHx8CiAgICAgIGhlbHBlcnNPZihtYXRjaGVyLCBtYXRjaE1ldGhvZCkuc29tZSgobSkgPT4KICAgICAgICBtLnBhcmFtcwogICAgICAgICAgLmZpbHRlcigocCkgPT4gL1xiQmlnRGVjaW1hbFxiLy50ZXN0KHAudHlwZSkpCiAgICAgICAgICAuc29tZSgocCkgPT4KICAgICAgICAgICAgbmV3IFJlZ0V4cCgKICAgICAgICAgICAgICBgXFxiJHtwLm5hbWV9XFxzKlxcLmVxdWFsc1xcKHxcXC5lcXVhbHNcXChcXHMqJHtwLm5hbWV9XFxzKlxcKXxPYmplY3RzXFwuZXF1YWxzXFwoW147XSpcXGIke3AubmFtZX1cXGJgLAogICAgICAgICAgICApLnRlc3Qobm9TdHJpbmdzKGJvZHkobSkpKSwKICAgICAgICAgICksCiAgICAgICk7CiAgICBjb25zdCBieVZhbHVlID0KICAgICAgL2NvbXBhcmVUb1xzKlwoLy50ZXN0KG1hdGNoKSB8fAogICAgICAvc3RyaXBUcmFpbGluZ1plcm9zXChcKVxzKlwuZXF1YWxzXChbXjtdKnN0cmlwVHJhaWxpbmdaZXJvc1woXCkvLnRlc3QobWF0Y2gpIHx8CiAgICAgIC9cLnN1YnRyYWN0XChbXjtdKlwpXHMqXC5zaWdudW1cKFwpLy50ZXN0KG1hdGNoKTsKICAgIGNoZWNrKCFzY2FsZVNlbnNpdGl2ZSAmJiBieVZhbHVlLCAnTG9va2VkIGF0IEludm9pY2VNYXRjaGVyLm1hdGNoKCkgYW5kIGl0cyBoZWxwZXJzLicpOwogIH0pOwoKICBpdCgncXVhbnRpdGllcyBvZiBhIFNLVSBzcGxpdCBvdmVyIHNldmVyYWwgaW52b2ljZSBsaW5lcyBhcmUgYWRkZWQgdXAnLCAoKSA9PiB7CiAgICAvLyBTdW1tZWQgcGVyIFNLVTogdGhlIHN0YXRlbWVudCB0aGF0IGFkZHMgdXAgcXVhbnRpdGllcyBpcyBrZXllZCBvciBmaWx0ZXJlZCBieSBTS1UuCiAgICBjb25zdCBzdW1taW5nID0KICAgICAgL1wubWVyZ2VcKHxcLmNvbXB1dGUoSWZQcmVzZW50fElmQWJzZW50KT9cKHxncm91cGluZ0J5fHN1bW1pbmdJbnR8c3VtbWluZ0xvbmd8Z2V0T3JEZWZhdWx0XCh8XC5zdW1cKFwpfFwrPXxcLnJlZHVjZVwofHRvTWFwXChbXjtdKig6OnN1bXw6OmFkZEV4YWN0fC0+XHMqXHcrXHMqXCtccypcdyspLzsKICAgIGNoZWNrKAogICAgICBtYXRjaC5zcGxpdCgnOycpLnNvbWUoKHN0YXRlbWVudCkgPT4gc3VtbWluZy50ZXN0KHN0YXRlbWVudCkgJiYgL3NrdS9pLnRlc3Qoc3RhdGVtZW50KSksCiAgICAgICdMb29rZWQgYXQgaG93IEludm9pY2VNYXRjaGVyLm1hdGNoKCkgY2hlY2tzIGludm9pY2VkIHF1YW50aXRpZXMuJywKICAgICk7CiAgfSk7CgogIGl0KCJtYXRjaGluZyBhbiBpbnZvaWNlIGxvYWRzIHRoZSBQTydzIGxpbmVzIChvcGVuLWluLXZpZXcgaXMgb2ZmKSIsICgpID0+IHsKICAgIGNvbnN0IG0gPSBtZXRob2QoY29udHJvbGxlciwgJ21hdGNoSW52b2ljZScpOwogICAgY29uc3QgYiA9IG5vU3RyaW5ncyh3aXRoSGVscGVycyhjb250cm9sbGVyLCBtKSk7CiAgICBjb25zdCBmZXRjaGVzTGluZXMgPSBvcmRlcnMubWV0aG9kcwogICAgICAuZmlsdGVyKChyKSA9PiBhbm5vdGF0aW9uKHIsICdFbnRpdHlHcmFwaCcpIHx8IC9qb2luXHMrZmV0Y2gvaS50ZXN0KGFubm90YXRpb24ociwgJ1F1ZXJ5Jyk/LnRleHQgPz8gJycpKQogICAgICAuc29tZSgocikgPT4gbmV3IFJlZ0V4cChgXFwuXFxzKiR7ci5uYW1lfVxccypcXChgKS50ZXN0KGIpKTsKICAgIGNvbnN0IHNlcnZpY2VGaWVsZCA9IGNvbnRyb2xsZXIuZmllbGRzLmZpbmQoKGYpID0+IGYudHlwZSA9PT0gc2VydmljZS5uYW1lKT8ubmFtZTsKICAgIGNvbnN0IHZpYVNlcnZpY2UgPSAhIXNlcnZpY2VGaWVsZCAmJiBuZXcgUmVnRXhwKGBcXGIke3NlcnZpY2VGaWVsZH1cXHMqXFwuXFxzKlxcdytcXHMqXFwoYCkudGVzdChiKTsKICAgIGNvbnN0IHRyYW5zYWN0aW9uYWwgPSAhIWFubm90YXRpb24obSwgJ1RyYW5zYWN0aW9uYWwnKSB8fCAhIWFubm90YXRpb24oY29udHJvbGxlciwgJ1RyYW5zYWN0aW9uYWwnKTsKICAgIGNvbnN0IGluVGVtcGxhdGUgPSB0ZW1wbGF0ZXNPZihjb250cm9sbGVyKS5zb21lKCh0KSA9PiB1c2VzVGVtcGxhdGUoYiwgdCkpOwogICAgY2hlY2soCiAgICAgIGZldGNoZXNMaW5lcyB8fCB2aWFTZXJ2aWNlIHx8IHRyYW5zYWN0aW9uYWwgfHwgaW5UZW1wbGF0ZSwKICAgICAgJ0xvb2tlZCBhdCBQdXJjaGFzZU9yZGVyQ29udHJvbGxlci5tYXRjaEludm9pY2UoKS4nLAogICAgKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 19),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'checks/inbox.test.ts', 'typescript', convert_from(decode('aW1wb3J0IHsKICBhbm5vdGF0aW9uLAogIGJvZHksCiAgY2FsbHMsCiAgY2hlY2ssCiAgY29kZSwKICBtZXRob2QsCiAgbm9TdHJpbmdzLAogIHNtYWxsQ29uc3RhbnRzLAogIHdpdGhDb25zdGFudHMsCiAgd2l0aEhlbHBlcnMsCn0gZnJvbSAnLi9zdXBwb3J0L2phdmEnOwoKY29uc3QgeyBjb250cm9sbGVyLCBvcmRlcnMsIHNlcnZpY2UgfSA9IGNvZGU7CmNvbnN0IGxpc3QgPSBtZXRob2QoY29udHJvbGxlciwgJ2xpc3QnKTsKLyoqIFRoZSBjb250cm9sbGVyJ3MgbGlzdCgpLCBhcyBjb2RlLCB3aXRoIGNvbnN0YW50cyBzdWNoIGFzIEZJUlNUX1BBR0UgPSAxIHJlYWQgYXMgdGhlaXIgdmFsdWUuICovCmNvbnN0IGxpc3RDb2RlID0gd2l0aENvbnN0YW50cyhub1N0cmluZ3Mod2l0aEhlbHBlcnMoY29udHJvbGxlciwgbGlzdCkpLCBzbWFsbENvbnN0YW50cyhjb250cm9sbGVyKSk7Ci8qKiBUaGUgaW5ib3gncyBjb2RlIGFzIHdyaXR0ZW46IHRoZSBjb250cm9sbGVyJ3MgbGlzdCgpIGFuZCB0aGUgc2VydmljZSdzIGxpc3QoKSB3aXRoIGl0cyBoZWxwZXJzLiAqLwpjb25zdCBpbmJveFRleHQgPSBgJHtib2R5KGxpc3QpfVxuJHt3aXRoSGVscGVycyhzZXJ2aWNlLCBtZXRob2Qoc2VydmljZSwgJ2xpc3QnKSl9YDsKY29uc3QgaW5ib3ggPSBub1N0cmluZ3MoaW5ib3hUZXh0KTsKLyoqIFRoZSByZXBvc2l0b3J5IG1ldGhvZHMgdGhlIGluYm94IGNhbGxzLiAqLwpjb25zdCBpbmJveFF1ZXJpZXMgPSBvcmRlcnMubWV0aG9kcy5maWx0ZXIoKG0pID0+IGNhbGxzKGluYm94LCBtLm5hbWUpKTsKY29uc3QgZmV0Y2hlc0xpbmVzID0gKG06ICh0eXBlb2Ygb3JkZXJzLm1ldGhvZHMpW251bWJlcl0pID0+CiAgISFhbm5vdGF0aW9uKG0sICdFbnRpdHlHcmFwaCcpIHx8IC9qb2luXHMrZmV0Y2gvaS50ZXN0KGFubm90YXRpb24obSwgJ1F1ZXJ5Jyk/LnRleHQgPz8gJycpOwoKZGVzY3JpYmUoJ2luYm94IHBhZ2luZycsICgpID0+IHsKICBpdCgncGFnZSAxIGlzIHRoZSBmaXJzdCBwYWdlJywgKCkgPT4gewogICAgY2hlY2soCiAgICAgIC9wYWdlXHMqLVxzKjEvLnRlc3QobGlzdENvZGUpICYmIC9QYWdlUmVxdWVzdFwub2ZccypcKC8udGVzdChsaXN0Q29kZSksCiAgICAgICdMb29rZWQgYXQgUHVyY2hhc2VPcmRlckNvbnRyb2xsZXIubGlzdCgpLicsCiAgICApOwogIH0pOwoKICBpdCgncGFnZSAwIGlzIHJlZnVzZWQnLCAoKSA9PiB7CiAgICAvLyBBIGNoZWNrIGluIHRoZSBtZXRob2QgKHRoZSBKVW5pdCB0ZXN0IGNhbGxzIGl0IGRpcmVjdGx5OyB0aGVyZSBpcyBubyBiZWFuIHZhbGlkYXRpb24gaGVyZSkuCiAgICBjaGVjaygKICAgICAgL3BhZ2Vccyo8XHMqMXxwYWdlXHMqPD1ccyowfDFccyo+XHMqcGFnZXwwXHMqPj1ccypwYWdlLy50ZXN0KGxpc3RDb2RlKSB8fAogICAgICAgIC9Bc3NlcnRcLmlzVHJ1ZVxzKlwoXHMqKHBhZ2Vccyo+PVxzKjF8cGFnZVxzKj5ccyowfDFccyo8PVxzKnBhZ2V8MFxzKjxccypwYWdlKVxiLy50ZXN0KGxpc3RDb2RlKSwKICAgICAgJ0xvb2tlZCBhdCBQdXJjaGFzZU9yZGVyQ29udHJvbGxlci5saXN0KCkuJywKICAgICk7CiAgfSk7CgogIGl0KCd0aGUgb3JkZXIgaXMgc3RhYmxlOiBuZXdlc3QgZmlyc3QsIHRpZXMgYnJva2VuIGJ5IGlkJywgKCkgPT4gewogICAgLy8gVGhlIFNvcnQncyBwcm9wZXJ0eSBuYW1lcyBhcmUgc3RyaW5ncywgc28gdGhpcyByZWFkcyB0aGUgY29kZSBhcyB3cml0dGVuLgogICAgY29uc3Qgd2hlcmUgPSBgJHtjb250cm9sbGVyLnRleHR9XG4ke2luYm94VGV4dH1gOwogICAgY29uc3QgbmV3ZXN0Rmlyc3QgPQogICAgICAvZGVzY1xzKlwoXHMqImNyZWF0ZWRBdCJccypcKS8udGVzdCh3aGVyZSkgfHwKICAgICAgL1xiREVTQ1xzKixccyoiY3JlYXRlZEF0Ii8udGVzdCh3aGVyZSkgfHwKICAgICAgL1NvcnRcLmJ5XHMqXChccyoiY3JlYXRlZEF0IlteO10qP1wpXHMqXC5ccypkZXNjZW5kaW5nXHMqXChcKS8udGVzdCh3aGVyZSkgfHwKICAgICAgL09yZGVyXC5ieVxzKlwoXHMqImNyZWF0ZWRBdCJccypcKVxzKlwuXHMqd2l0aFxzKlwoXHMqKFNvcnRcLik/KERpcmVjdGlvblwuKT9ERVNDLy50ZXN0KHdoZXJlKTsKICAgIGNvbnN0IGJ5U29ydCA9IG5ld2VzdEZpcnN0ICYmIC8iaWQiLy50ZXN0KHdoZXJlKTsKICAgIC8vIE9yIGluIHRoZSBxdWVyeSB0aGUgaW5ib3ggcnVucy4KICAgIGNvbnN0IGJ5UXVlcnkgPSBpbmJveFF1ZXJpZXMuc29tZSgKICAgICAgKG0pID0+CiAgICAgICAgL29yZGVyXHMrYnlccytbXHcuXSpjcmVhdGVkQXRccytkZXNjXHMqLFxzKltcdy5dKlxiaWRcYi9pLnRlc3QoYW5ub3RhdGlvbihtLCAnUXVlcnknKT8udGV4dCA/PyAnJykgfHwKICAgICAgICAvT3JkZXJCeUNyZWF0ZWRBdERlc2MoSWR8SWREZXNjfElkQXNjKVxiLy50ZXN0KG0ubmFtZSksCiAgICApOwogICAgY2hlY2soYnlTb3J0IHx8IGJ5UXVlcnksICdMb29rZWQgYXQgaG93IHRoZSBpbmJveCBpcyBzb3J0ZWQuJyk7CiAgfSk7CgogIGl0KCd0aGUgaW5ib3ggaXMgcGFnZWQgaW4gdGhlIGRhdGFiYXNlLCBub3QgaW4gbWVtb3J5JywgKCkgPT4gewogICAgY29uc3QgcGFnZWRGZXRjaCA9IGluYm94UXVlcmllcy5zb21lKChtKSA9PiBtLnBhcmFtcy5zb21lKChwKSA9PiAvXGJQYWdlYWJsZVxiLy50ZXN0KHAudHlwZSkpICYmIGZldGNoZXNMaW5lcyhtKSk7CiAgICAvLyBBIGZldGNoIGpvaW4gb2YgZXZlcnkgUE8gKG5vdCBsaW1pdGVkIHRvIG9uZSBwYWdlJ3MgaWRzKSwgcGFnZWQgYWZ0ZXJ3YXJkcy4KICAgIGNvbnN0IGZldGNoZXNFdmVyeXRoaW5nID0gaW5ib3hRdWVyaWVzLnNvbWUoCiAgICAgIChtKSA9PiBmZXRjaGVzTGluZXMobSkgJiYgIW0ucGFyYW1zLnNvbWUoKHApID0+IC9cYihQYWdlYWJsZXxDb2xsZWN0aW9ufExpc3R8U2V0fEl0ZXJhYmxlKVxifFxbXF0vLnRlc3QocC50eXBlKSksCiAgICApOwogICAgY29uc3QgaW5NZW1vcnkgPSAvXC5zdWJMaXN0XHMqXCh8XC5za2lwXHMqXCh8UGFnZWRMaXN0SG9sZGVyLy50ZXN0KGluYm94KSB8fCBmZXRjaGVzRXZlcnl0aGluZzsKICAgIGNoZWNrKCFwYWdlZEZldGNoICYmICFpbk1lbW9yeSwgJ0xvb2tlZCBhdCB0aGUgcXVlcmllcyB0aGUgaW5ib3ggcnVucyBhbmQgaG93IGl0IHBhZ2VzIHRoZW0uJyk7CiAgfSk7Cn0pOwo=', 'base64'), 'UTF8'), true, 20),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'checks/support/java.ts', 'typescript', convert_from(decode('LyoqCiAqIEhlbHBlcnMgZm9yIHRoZSBzdHJ1Y3R1cmUgY2hlY2tzLiBKYXZhIGNhbid0IHJ1biBpbiB0aGUgYnJvd3Nlciwgc28gdGhlc2UgY2hlY2tzIHJlYWQgeW91ciBjb2RlCiAqIChjbGFzc2VzLCBhbm5vdGF0aW9ucywgbWV0aG9kIGJvZGllczsgY29tbWVudHMgaWdub3JlZCkgaW5zdGVhZCBvZiBleGVjdXRpbmcgaXQuIFJldmlld2VycyBhbHNvCiAqIHJ1biB0aGUgSlVuaXQgdGVzdHMgaW4gc3JjL3Rlc3QvamF2YSBhZ2FpbnN0IHlvdXIgY29kZS4KICovCmltcG9ydCB0eXBlIHsgSmF2YUFubm90YXRpb24sIEphdmFGaWxlLCBKYXZhTWV0aG9kLCBKYXZhVHlwZSB9IGZyb20gJ0Bjb2RlYXJlbmEvamF2YSc7CmltcG9ydCBhcGlFeGNlcHRpb25IYW5kbGVyIGZyb20gJy4uLy4uL3NyYy9tYWluL2phdmEvY29tL3p5Y3VzL3Byb2N1cmVtZW50L3BvL0FwaUV4Y2VwdGlvbkhhbmRsZXIuamF2YSc7CmltcG9ydCBhcHByb3ZhbFNlcnZpY2UgZnJvbSAnLi4vLi4vc3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vQXBwcm92YWxTZXJ2aWNlLmphdmEnOwppbXBvcnQgaWRlbXBvdGVuY3lSZWNvcmQgZnJvbSAnLi4vLi4vc3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vSWRlbXBvdGVuY3lSZWNvcmQuamF2YSc7CmltcG9ydCBpZGVtcG90ZW5jeVJlY29yZFJlcG9zaXRvcnkgZnJvbSAnLi4vLi4vc3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vSWRlbXBvdGVuY3lSZWNvcmRSZXBvc2l0b3J5LmphdmEnOwppbXBvcnQgaW52b2ljZU1hdGNoZXIgZnJvbSAnLi4vLi4vc3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vSW52b2ljZU1hdGNoZXIuamF2YSc7CmltcG9ydCBwdXJjaGFzZU9yZGVyIGZyb20gJy4uLy4uL3NyYy9tYWluL2phdmEvY29tL3p5Y3VzL3Byb2N1cmVtZW50L3BvL1B1cmNoYXNlT3JkZXIuamF2YSc7CmltcG9ydCBwdXJjaGFzZU9yZGVyQ29udHJvbGxlciBmcm9tICcuLi8uLi9zcmMvbWFpbi9qYXZhL2NvbS96eWN1cy9wcm9jdXJlbWVudC9wby9QdXJjaGFzZU9yZGVyQ29udHJvbGxlci5qYXZhJzsKaW1wb3J0IHB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IGZyb20gJy4uLy4uL3NyYy9tYWluL2phdmEvY29tL3p5Y3VzL3Byb2N1cmVtZW50L3BvL1B1cmNoYXNlT3JkZXJSZXBvc2l0b3J5LmphdmEnOwoKLyoqIEV2ZXJ5IHR5cGUgaW4gYSBmaWxlLCBuZXN0ZWQgb25lcyBpbmNsdWRlZC4gKi8KZXhwb3J0IGZ1bmN0aW9uIGFsbFR5cGVzKGZpbGU6IEphdmFGaWxlKTogSmF2YVR5cGVbXSB7CiAgY29uc3Qgb3V0OiBKYXZhVHlwZVtdID0gW107CiAgY29uc3Qgd2FsayA9ICh0eXBlczogSmF2YVR5cGVbXSkgPT4gewogICAgZm9yIChjb25zdCB0IG9mIHR5cGVzKSB7CiAgICAgIG91dC5wdXNoKHQpOwogICAgICB3YWxrKHQudHlwZXMpOwogICAgfQogIH07CiAgd2FsayhmaWxlLnR5cGVzKTsKICByZXR1cm4gb3V0Owp9CgpmdW5jdGlvbiB0eXBlSW4oZmlsZTogSmF2YUZpbGUsIG5hbWU6IHN0cmluZyk6IEphdmFUeXBlIHsKICBjb25zdCB0ID0gYWxsVHlwZXMoZmlsZSkuZmluZCgoeCkgPT4geC5uYW1lID09PSBuYW1lKTsKICBpZiAoIXQpIHRocm93IG5ldyBFcnJvcihgQ2FuJ3QgZmluZCAke25hbWV9LiBLZWVwIHRoZSBleGlzdGluZyBjbGFzcyBhbmQgbWV0aG9kIG5hbWVzLmApOwogIHJldHVybiB0Owp9CgpleHBvcnQgY29uc3QgY29kZSA9IHsKICBzZXJ2aWNlOiB0eXBlSW4oYXBwcm92YWxTZXJ2aWNlLCAnQXBwcm92YWxTZXJ2aWNlJyksCiAgY29udHJvbGxlcjogdHlwZUluKHB1cmNoYXNlT3JkZXJDb250cm9sbGVyLCAnUHVyY2hhc2VPcmRlckNvbnRyb2xsZXInKSwKICBoYW5kbGVyOiB0eXBlSW4oYXBpRXhjZXB0aW9uSGFuZGxlciwgJ0FwaUV4Y2VwdGlvbkhhbmRsZXInKSwKICBtYXRjaGVyOiB0eXBlSW4oaW52b2ljZU1hdGNoZXIsICdJbnZvaWNlTWF0Y2hlcicpLAogIHB1cmNoYXNlT3JkZXI6IHR5cGVJbihwdXJjaGFzZU9yZGVyLCAnUHVyY2hhc2VPcmRlcicpLAogIG9yZGVyczogdHlwZUluKHB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5LCAnUHVyY2hhc2VPcmRlclJlcG9zaXRvcnknKSwKICBpZGVtcG90ZW5jeVJlY29yZDogdHlwZUluKGlkZW1wb3RlbmN5UmVjb3JkLCAnSWRlbXBvdGVuY3lSZWNvcmQnKSwKICBpZGVtcG90ZW5jeTogdHlwZUluKGlkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSwgJ0lkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeScpLAp9OwoKLyoqIEV2ZXJ5IHR5cGUgaW4gdGhlIGZpbGVzIHlvdSBjYW4gZWRpdCAoYSBmaXggbWF5IGFkZCBhIG5lc3RlZCBjbGFzcykuICovCmV4cG9ydCBjb25zdCBlZGl0YWJsZVR5cGVzID0gWwogIGFwcHJvdmFsU2VydmljZSwKICBwdXJjaGFzZU9yZGVyQ29udHJvbGxlciwKICBhcGlFeGNlcHRpb25IYW5kbGVyLAogIGludm9pY2VNYXRjaGVyLAogIHB1cmNoYXNlT3JkZXIsCiAgcHVyY2hhc2VPcmRlclJlcG9zaXRvcnksCiAgaWRlbXBvdGVuY3lSZWNvcmQsCiAgaWRlbXBvdGVuY3lSZWNvcmRSZXBvc2l0b3J5LApdLmZsYXRNYXAoYWxsVHlwZXMpOwoKZXhwb3J0IGZ1bmN0aW9uIG1ldGhvZCh0OiBKYXZhVHlwZSwgbmFtZTogc3RyaW5nKTogSmF2YU1ldGhvZCB7CiAgY29uc3QgbSA9IHQubWV0aG9kcy5maW5kKCh4KSA9PiB4Lm5hbWUgPT09IG5hbWUpOwogIGlmICghbSkgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCBmaW5kICR7dC5uYW1lfS4ke25hbWV9KCkuIEtlZXAgdGhlIGV4aXN0aW5nIGNsYXNzIGFuZCBtZXRob2QgbmFtZXMuYCk7CiAgcmV0dXJuIG07Cn0KCmV4cG9ydCBjb25zdCBib2R5ID0gKG06IEphdmFNZXRob2QpID0+IG0uYm9keSA/PyAnJzsKCmV4cG9ydCBjb25zdCBhbm5vdGF0aW9uID0gKHg6IHsgYW5ub3RhdGlvbnM6IEphdmFBbm5vdGF0aW9uW10gfSwgbmFtZTogc3RyaW5nKTogSmF2YUFubm90YXRpb24gfCBudWxsID0+CiAgeC5hbm5vdGF0aW9ucy5maW5kKChhKSA9PiBhLm5hbWUgPT09IG5hbWUpID8/IG51bGw7CgovKiogVGhlIEBUcmFuc2FjdGlvbmFsIHRoYXQgYXBwbGllcyB0byBhIG1ldGhvZDogaXRzIG93biBpZiBpdCBoYXMgb25lLCBlbHNlIGl0cyBjbGFzcydzLiAqLwpleHBvcnQgY29uc3QgdHJhbnNhY3Rpb25hbE9mID0gKHQ6IEphdmFUeXBlLCBtOiBKYXZhTWV0aG9kKSA9PgogIGFubm90YXRpb24obSwgJ1RyYW5zYWN0aW9uYWwnKSA/PyBhbm5vdGF0aW9uKHQsICdUcmFuc2FjdGlvbmFsJyk7CgovKiogQ2FsbHMgYDxyZWNlaXZlcj4uPG5hbWU+KGAgaW4gc29tZSBjb2RlLiAqLwpleHBvcnQgY29uc3QgY2FsbHNPbiA9IChzb3VyY2U6IHN0cmluZywgcmVjZWl2ZXI6IHN0cmluZywgbmFtZTogc3RyaW5nKSA9PgogIG5ldyBSZWdFeHAoYFxcYiR7cmVjZWl2ZXJ9XFxzKlxcLlxccyoke25hbWV9XFxzKlxcKGApLnRlc3Qoc291cmNlKTsKCi8qKiBDYWxscyBgLjxuYW1lPihgIG9uIGFueXRoaW5nIGluIHNvbWUgY29kZS4gKi8KZXhwb3J0IGNvbnN0IGNhbGxzID0gKHNvdXJjZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpID0+IG5ldyBSZWdFeHAoYFxcLlxccyoke25hbWV9XFxzKlxcKGApLnRlc3Qoc291cmNlKTsKCi8qKiBDYWxscyBvZiBhIG1ldGhvZCBvZiB0aGUgc2FtZSBjbGFzczogYG5hbWUoYCwgYHRoaXMubmFtZShgIG9yIGB0aGlzOjpuYW1lYC4gKi8KY29uc3QgY2FsbE9mID0gKG5hbWU6IHN0cmluZykgPT4KICBuZXcgUmVnRXhwKGAoPzwhW1xcdy4kXSkke25hbWV9XFxzKlxcKHxcXGJ0aGlzXFxzKlxcLlxccyoke25hbWV9XFxzKlxcKHxcXGJ0aGlzXFxzKjo6XFxzKiR7bmFtZX1cXGJgLCAnZycpOwoKLyoqCiAqIEEgbWV0aG9kJ3MgYm9keSB3aXRoIHRoZSBib2RpZXMgb2YgdGhlIG1ldGhvZHMgb2YgaXRzIG93biBjbGFzcyB0aGF0IGl0IGNhbGxzIHdyaXR0ZW4gaW4gd2hlcmUKICogdGhleSBhcmUgY2FsbGVkIChkaXJlY3RseSwgb24gYHRoaXNgLCBvciB0aHJvdWdoIHRoZW0pLCBzbyBtb3ZpbmcgY29kZSBpbnRvIGEgaGVscGVyIG1ldGhvZAogKiBjaGFuZ2VzIG5vdGhpbmcsIG9yZGVyIGluY2x1ZGVkLiBDYWxscyBvbiBvdGhlciBvYmplY3RzIChpbmNsdWRpbmcgdGhpcyBjbGFzcydzIG93biBwcm94eSkgYXJlbid0CiAqIGZvbGxvd2VkLgogKi8KZXhwb3J0IGZ1bmN0aW9uIHdpdGhIZWxwZXJzKHQ6IEphdmFUeXBlLCBtOiBKYXZhTWV0aG9kLCBzZWVuOiBzdHJpbmdbXSA9IFttLm5hbWVdKTogc3RyaW5nIHsKICBsZXQgc291cmNlID0gYm9keShtKTsKICBmb3IgKGNvbnN0IG5hbWUgb2YgbmV3IFNldCh0Lm1ldGhvZHMubWFwKCh4KSA9PiB4Lm5hbWUpKSkgewogICAgaWYgKHNlZW4uaW5jbHVkZXMobmFtZSkgfHwgIWNhbGxPZihuYW1lKS50ZXN0KHNvdXJjZSkpIGNvbnRpbnVlOwogICAgY29uc3QgaW5uZXIgPSB0Lm1ldGhvZHMKICAgICAgLmZpbHRlcigoeCkgPT4geC5uYW1lID09PSBuYW1lKQogICAgICAubWFwKCh4KSA9PiB3aXRoSGVscGVycyh0LCB4LCBbLi4uc2VlbiwgbmFtZV0pKQogICAgICAuam9pbignXG4nKTsKICAgIHNvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKGNhbGxPZihuYW1lKSwgKGNhbGwpID0+IGB7JHtpbm5lcn19XG4ke2NhbGx9YCk7CiAgfQogIHJldHVybiBzb3VyY2U7Cn0KCi8qKiBUaGUgbWV0aG9kcyBvZiBpdHMgb3duIGNsYXNzIHRoYXQgYSBtZXRob2QgY2FsbHMsIGRpcmVjdGx5IG9yIHRocm91Z2ggdGhlbSAoc2VlIHdpdGhIZWxwZXJzKS4gKi8KZXhwb3J0IGZ1bmN0aW9uIGhlbHBlcnNPZih0OiBKYXZhVHlwZSwgbTogSmF2YU1ldGhvZCk6IEphdmFNZXRob2RbXSB7CiAgY29uc3QgZm91bmQgPSBbbV07CiAgLy8gZm9yLi4ub2YgYWxzbyB2aXNpdHMgdGhlIG1ldGhvZHMgcHVzaGVkIHdoaWxlIGl0IHJ1bnMuCiAgZm9yIChjb25zdCBjdXJyZW50IG9mIGZvdW5kKSB7CiAgICBjb25zdCBzb3VyY2UgPSBib2R5KGN1cnJlbnQpOwogICAgZm9yIChjb25zdCBvdGhlciBvZiB0Lm1ldGhvZHMpIHsKICAgICAgaWYgKCFmb3VuZC5pbmNsdWRlcyhvdGhlcikgJiYgY2FsbE9mKG90aGVyLm5hbWUpLnRlc3Qoc291cmNlKSkgZm91bmQucHVzaChvdGhlcik7CiAgICB9CiAgfQogIHJldHVybiBmb3VuZC5zbGljZSgxKTsKfQoKLyoqIENvZGUgd2l0aCB0aGUgY29udGVudHMgb2YgaXRzIHN0cmluZyBhbmQgdGV4dC1ibG9jayBsaXRlcmFscyBibGFua2VkOiB0ZXh0IGlzIG5vdCBjb2RlLiAqLwpleHBvcnQgY29uc3Qgbm9TdHJpbmdzID0gKHNvdXJjZTogc3RyaW5nKSA9PgogIHNvdXJjZS5yZXBsYWNlKC8iIiJbXHNcU10qPyIiInwiKD86W14iXFxcbl18XFwuKSoifCcoPzpbXidcXFxuXXxcXC4pKicvZywgKHMpID0+IChzLnN0YXJ0c1dpdGgoJyInKSA/ICciIicgOiAiJyciKSk7CgovKiogQSB0eXBlIHlvdSBjYW4gZWRpdCwgYnkgaXRzIHNpbXBsZSBvciBxdWFsaWZpZWQgbmFtZSAoYXMgYSBmaWVsZCdzIHR5cGUgZ2l2ZXMgaXQpLiAqLwpleHBvcnQgY29uc3QgZWRpdGFibGVUeXBlID0gKG5hbWU6IHN0cmluZykgPT4gewogIGNvbnN0IHNpbXBsZSA9IG5hbWUucmVwbGFjZSgvPC4qJC8sICcnKS5zcGxpdCgnLicpLnBvcCgpOwogIHJldHVybiBlZGl0YWJsZVR5cGVzLmZpbmQoKHQpID0+IHQubmFtZSA9PT0gc2ltcGxlKSA/PyBudWxsOwp9OwoKLyoqCiAqIFRoZSBlZGl0YWJsZSBjbGFzc2VzIGEgZmllbGQgb2YgdGhpcyB0eXBlIGluamVjdHM6IHRoZSB0eXBlIGl0c2VsZiwgb3IsIGZvciBhbiBpbnRlcmZhY2UsIHRoZQogKiBjbGFzc2VzIGltcGxlbWVudGluZyBpdC4gYE9iamVjdFByb3ZpZGVyPFQ+YCwgYE9iamVjdEZhY3Rvcnk8VD5gIGFuZCBgUHJvdmlkZXI8VD5gIGluamVjdCBULgogKi8KZXhwb3J0IGZ1bmN0aW9uIGJlYW5zRm9yKGZpZWxkVHlwZTogc3RyaW5nKTogSmF2YVR5cGVbXSB7CiAgY29uc3QgaW5uZXIgPSAvXig/Ok9iamVjdFByb3ZpZGVyfE9iamVjdEZhY3Rvcnl8UHJvdmlkZXJ8U3VwcGxpZXIpXHMqPFxzKihbXHcuXSspXHMqPi8uZXhlYyhmaWVsZFR5cGUpPy5bMV07CiAgY29uc3QgdCA9IGVkaXRhYmxlVHlwZShpbm5lciA/PyBmaWVsZFR5cGUpOwogIGlmICghdCkgcmV0dXJuIFtdOwogIGlmICh0LmtpbmQgIT09ICdpbnRlcmZhY2UnKSByZXR1cm4gW3RdOwogIHJldHVybiBlZGl0YWJsZVR5cGVzLmZpbHRlcigoeCkgPT4geC5raW5kID09PSAnY2xhc3MnICYmIHguaW1wbGVtZW50cy5zb21lKChpKSA9PiBlZGl0YWJsZVR5cGUoaSkgPT09IHQpKTsKfQoKLyoqIEEgY2FsbCBvZiBgbWV0aG9kYCBvbiBhIGZpZWxkOiBgZmllbGQubWV0aG9kKGAsIG9yIHRocm91Z2ggYSBwcm92aWRlciAoYGZpZWxkLmdldE9iamVjdCgpLm1ldGhvZChgKS4gKi8KZXhwb3J0IGNvbnN0IGNhbGxzVGhyb3VnaCA9IChzb3VyY2U6IHN0cmluZywgZmllbGQ6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcpID0+CiAgbmV3IFJlZ0V4cCgKICAgIGBcXGIke2ZpZWxkfVxccypcXC5cXHMqKD86KD86Z2V0T2JqZWN0fGdldElmQXZhaWxhYmxlfGdldElmVW5pcXVlfGdldClcXHMqXFwoXFxzKlxcKVxccypcXC5cXHMqKT8ke21ldGhvZH1cXHMqXFwoYCwKICApLnRlc3Qoc291cmNlKTsKCi8qKiBUaGUgYHN0YXRpYyBmaW5hbCBpbnRgIGNvbnN0YW50cyBvZiBhIGNsYXNzIHdpdGggdmFsdWUgMCBvciAxLCBieSBuYW1lLiAqLwpleHBvcnQgY29uc3Qgc21hbGxDb25zdGFudHMgPSAodDogSmF2YVR5cGUpID0+CiAgbmV3IE1hcCgKICAgIHQuZmllbGRzLmZsYXRNYXAoKGYpID0+IHsKICAgICAgY29uc3QgdiA9IC89XHMqKFswMV0pXHMqOz8kLy5leGVjKGYudGV4dCk/LlsxXTsKICAgICAgcmV0dXJuIGYubW9kaWZpZXJzLmluY2x1ZGVzKCdmaW5hbCcpICYmIC9eKGludHxsb25nfEludGVnZXIpJC8udGVzdChmLnR5cGUpICYmIHYgPyBbW2YubmFtZSwgdl1dIDogW107CiAgICB9KSwKICApOwoKLyoqIENvZGUgd2l0aCB0aG9zZSBjb25zdGFudHMgcmVwbGFjZWQgYnkgdGhlaXIgdmFsdWVzIChgcGFnZSA8IEZJUlNUX1BBR0VgIHJlYWRzIGBwYWdlIDwgMWApLiAqLwpleHBvcnQgY29uc3Qgd2l0aENvbnN0YW50cyA9IChzb3VyY2U6IHN0cmluZywgY29uc3RhbnRzOiBNYXA8c3RyaW5nLCBzdHJpbmc+KSA9PgogIFsuLi5jb25zdGFudHNdLnJlZHVjZSgocywgW25hbWUsIHZdKSA9PiBzLnJlcGxhY2UobmV3IFJlZ0V4cChgKD88IVtcXHcuJF0pJHtuYW1lfVxcYmAsICdnJyksIHYpLCBzb3VyY2UpOwoKLyoqIFRoZSB0ZXh0IGZyb20gYG9wZW5gIChhbiBvcGVuaW5nIGJyYWNrZXQpIHRvIGl0cyBtYXRjaGluZyBjbG9zZSwgYm90aCBleGNsdWRlZC4gKi8KZnVuY3Rpb24gZW5jbG9zZWQoc291cmNlOiBzdHJpbmcsIG9wZW46IG51bWJlcik6IHN0cmluZyB7CiAgY29uc3QgcGFpcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7ICcoJzogJyknLCAneyc6ICd9JyB9OwogIGNvbnN0IG8gPSBzb3VyY2Vbb3Blbl0gPz8gJyc7CiAgY29uc3QgYyA9IHBhaXJzW29dOwogIGxldCBkZXB0aCA9IDA7CiAgZm9yIChsZXQgaSA9IG9wZW47IGkgPCBzb3VyY2UubGVuZ3RoOyBpKyspIHsKICAgIGlmIChzb3VyY2VbaV0gPT09IG8pIGRlcHRoKys7CiAgICBlbHNlIGlmIChzb3VyY2VbaV0gPT09IGMgJiYgLS1kZXB0aCA9PT0gMCkgcmV0dXJuIHNvdXJjZS5zbGljZShvcGVuICsgMSwgaSk7CiAgfQogIHJldHVybiBzb3VyY2Uuc2xpY2Uob3BlbiArIDEpOwp9CgovKioKICogRWFjaCBgaWYgKDxjb25kaXRpb24+KWAgd2hvc2UgYnJhbmNoIHRocm93czogdGhlIGNvbmRpdGlvbiAod2l0aCBvciB3aXRob3V0IGJyYWNlcywgdGhlIHRocm93CiAqIGFueXdoZXJlIGluIHRoZSBicmFjZWQgYmxvY2spLgogKi8KZXhwb3J0IGZ1bmN0aW9uIGNvbmRpdGlvbnNUaGF0VGhyb3coc291cmNlOiBzdHJpbmcpOiBzdHJpbmdbXSB7CiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdOwogIGZvciAoY29uc3QgbSBvZiBzb3VyY2UubWF0Y2hBbGwoL1xiaWZccypcKC9nKSkgewogICAgY29uc3Qgc3RhcnQgPSAobS5pbmRleCA/PyAwKSArIG1bMF0ubGVuZ3RoIC0gMTsKICAgIGNvbnN0IGNvbmRpdGlvbiA9IGVuY2xvc2VkKHNvdXJjZSwgc3RhcnQpOwogICAgY29uc3QgYWZ0ZXIgPSBzb3VyY2Uuc2xpY2Uoc3RhcnQgKyBjb25kaXRpb24ubGVuZ3RoICsgMik7CiAgICBjb25zdCBicmFuY2ggPSAvXlxzKlx7Ly50ZXN0KGFmdGVyKSA/IGVuY2xvc2VkKGFmdGVyLCBhZnRlci5pbmRleE9mKCd7JykpIDogYWZ0ZXIuc3BsaXQoJzsnKVswXSA/PyAnJzsKICAgIGlmICgvXGJ0aHJvd1xiLy50ZXN0KGJyYW5jaCkpIG91dC5wdXNoKGNvbmRpdGlvbik7CiAgfQogIHJldHVybiBvdXQ7Cn0KCi8qKiBUaGUgYm9kaWVzIG9mIHRoZSBsb29wcyBpbiBzb21lIGNvZGUgKGBmb3JgL2B3aGlsZWAgYmxvY2tzLCBgLmZvckVhY2go4oCmKWAgYW5kIGAubWFwKOKApilgIGNhbGxzKS4gKi8KZXhwb3J0IGZ1bmN0aW9uIGxvb3BCb2RpZXMoc291cmNlOiBzdHJpbmcpOiBzdHJpbmdbXSB7CiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdOwogIGZvciAoY29uc3QgbSBvZiBzb3VyY2UubWF0Y2hBbGwoL1xiKGZvcnx3aGlsZSlccypcKC9nKSkgewogICAgY29uc3QgaGVhZCA9IChtLmluZGV4ID8/IDApICsgbVswXS5sZW5ndGggLSAxOwogICAgY29uc3QgcmVzdCA9IHNvdXJjZS5zbGljZShoZWFkICsgZW5jbG9zZWQoc291cmNlLCBoZWFkKS5sZW5ndGggKyAyKTsKICAgIGlmICgvXlxzKlx7Ly50ZXN0KHJlc3QpKSBvdXQucHVzaChlbmNsb3NlZChyZXN0LCByZXN0LmluZGV4T2YoJ3snKSkpOwogICAgZWxzZSBvdXQucHVzaChyZXN0LnNwbGl0KCc7JylbMF0gPz8gJycpOwogIH0KICBmb3IgKGNvbnN0IG0gb2Ygc291cmNlLm1hdGNoQWxsKC9cLlxzKihmb3JFYWNofG1hcHxwZWVrKVxzKlwoL2cpKSB7CiAgICBvdXQucHVzaChlbmNsb3NlZChzb3VyY2UsIChtLmluZGV4ID8/IDApICsgbVswXS5sZW5ndGggLSAxKSk7CiAgfQogIHJldHVybiBvdXQ7Cn0KCi8qKiBgQFRyYW5zYWN0aW9uYWxgIHRoYXQgc3RhcnRzIG9yIGpvaW5zIGEgdHJhbnNhY3Rpb24gKG5vdCBOT1RfU1VQUE9SVEVELCBORVZFUiwgU1VQUE9SVFMsIE1BTkRBVE9SWSkuICovCmV4cG9ydCBjb25zdCBvcGVuc1RyYW5zYWN0aW9uID0gKHR4OiBKYXZhQW5ub3RhdGlvbiB8IG51bGwpID0+CiAgISF0eCAmJiAhL1xiKE5PVF9TVVBQT1JURUR8TkVWRVJ8U1VQUE9SVFN8TUFOREFUT1JZKVxiLy50ZXN0KHR4LnRleHQpOwoKZXhwb3J0IGNvbnN0IGlzUmVhZE9ubHkgPSAodHg6IEphdmFBbm5vdGF0aW9uIHwgbnVsbCkgPT4gISF0eCAmJiAvcmVhZE9ubHlccyo9XHMqdHJ1ZS8udGVzdCh0eC50ZXh0KTsKCi8qKiBBIG1ldGhvZCB0aGF0IHJ1bnMgb3V0c2lkZSBhbnkgdHJhbnNhY3Rpb24gd2hlbiBjYWxsZWQgZnJvbSBhIGNvbnRyb2xsZXIuICovCmV4cG9ydCBjb25zdCBvdXRzaWRlVHJhbnNhY3Rpb24gPSAodHg6IEphdmFBbm5vdGF0aW9uIHwgbnVsbCkgPT4KICAhdHggfHwgL1xiKE5PVF9TVVBQT1JURUR8TkVWRVJ8U1VQUE9SVFMpXGIvLnRlc3QodHgudGV4dCk7CgpleHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlIHsKICBuYW1lOiBzdHJpbmc7CiAgLyoqIFNldCB1cCB3aXRoIFBST1BBR0FUSU9OX1JFUVVJUkVTX05FVyAoU3ByaW5nIEJvb3QncyBvd24gVHJhbnNhY3Rpb25UZW1wbGF0ZSBpcyBSRVFVSVJFRCkuICovCiAgcmVxdWlyZXNOZXc6IGJvb2xlYW47CiAgcmVhZE9ubHk6IGJvb2xlYW47Cn0KCi8qKiBUaGUgVHJhbnNhY3Rpb25UZW1wbGF0ZSAvIFRyYW5zYWN0aW9uT3BlcmF0aW9ucyBmaWVsZHMgb2YgYSBjbGFzcyBhbmQgaG93IHRoZXkncmUgc2V0IHVwLiAqLwpleHBvcnQgZnVuY3Rpb24gdGVtcGxhdGVzT2YodDogSmF2YVR5cGUpOiBUZW1wbGF0ZVtdIHsKICByZXR1cm4gdC5maWVsZHMKICAgIC5maWx0ZXIoKGYpID0+IC9eKFRyYW5zYWN0aW9uVGVtcGxhdGV8VHJhbnNhY3Rpb25PcGVyYXRpb25zKVxiLy50ZXN0KGYudHlwZSkpCiAgICAubWFwKChmKSA9PiAoewogICAgICBuYW1lOiBmLm5hbWUsCiAgICAgIHJlcXVpcmVzTmV3OgogICAgICAgIG5ldyBSZWdFeHAoYFxcYiR7Zi5uYW1lfVxccypcXC5cXHMqc2V0UHJvcGFnYXRpb25CZWhhdmlvcihOYW1lKT9cXHMqXFwoW147XSpSRVFVSVJFU19ORVdgKS50ZXN0KHQudGV4dCkgfHwKICAgICAgICBuZXcgUmVnRXhwKGBcXGIke2YubmFtZX1cXHMqPVxccypuZXdcXHMrVHJhbnNhY3Rpb25UZW1wbGF0ZVxccypcXChbXjtdKlJFUVVJUkVTX05FV2ApLnRlc3QodC50ZXh0KSwKICAgICAgcmVhZE9ubHk6IG5ldyBSZWdFeHAoYFxcYiR7Zi5uYW1lfVxccypcXC5cXHMqc2V0UmVhZE9ubHlcXHMqXFwoXFxzKnRydWVgKS50ZXN0KHQudGV4dCksCiAgICB9KSk7Cn0KCi8qKiBBIHJlcG9zaXRvcnkgb3IgRW50aXR5TWFuYWdlciBsb29rdXAgdGhhdCBsb2NrcyB0aGUgcm93IGZvciB3cml0aW5nLCBpbiBzb21lIGNvZGUuICovCmV4cG9ydCBjb25zdCBsb2Nrc1JvdyA9IChzb3VyY2U6IHN0cmluZywgbG9ja2luZ01ldGhvZHM6IHN0cmluZ1tdKSA9PgogIGxvY2tpbmdNZXRob2RzLnNvbWUoKG5hbWUpID0+IG5ldyBSZWdFeHAoYFxcLlxccyoke25hbWV9XFxzKlxcKGApLnRlc3Qoc291cmNlKSkgfHwKICAvXC5ccyooZmluZHxsb2NrfHJlZnJlc2gpXHMqXChbXjtdKlBFU1NJTUlTVElDX1dSSVRFLy50ZXN0KHNvdXJjZSk7CgovKiogQ29kZSBydW5zIGEgY2FsbGJhY2sgaW4gdGhpcyB0ZW1wbGF0ZS4gKi8KZXhwb3J0IGNvbnN0IHVzZXNUZW1wbGF0ZSA9IChzb3VyY2U6IHN0cmluZywgdGVtcGxhdGU6IFRlbXBsYXRlKSA9PgogIG5ldyBSZWdFeHAoYFxcYiR7dGVtcGxhdGUubmFtZX1cXHMqXFwuXFxzKihleGVjdXRlfGV4ZWN1dGVXaXRob3V0UmVzdWx0KVxccypcXChgKS50ZXN0KHNvdXJjZSk7CgovKiogRWFjaCBgY2F0Y2ggKC4uLikgeyAuLi4gfWAgaW4gc29tZSBjb2RlOiB0aGUgY2F1Z2h0IHR5cGVzIGFuZCB0aGUgYmxvY2suICovCmV4cG9ydCBmdW5jdGlvbiBjYXRjaEJsb2Nrcyhzb3VyY2U6IHN0cmluZyk6IHsgdHlwZXM6IHN0cmluZzsgYmxvY2s6IHN0cmluZyB9W10gewogIGNvbnN0IG91dDogeyB0eXBlczogc3RyaW5nOyBibG9jazogc3RyaW5nIH1bXSA9IFtdOwogIGZvciAoY29uc3QgbSBvZiBzb3VyY2UubWF0Y2hBbGwoL1xiY2F0Y2hccypcKChbXildKilcKVxzKlx7L2cpKSB7CiAgICBsZXQgZGVwdGggPSAxOwogICAgbGV0IGkgPSAobS5pbmRleCA/PyAwKSArIG1bMF0ubGVuZ3RoOwogICAgY29uc3Qgc3RhcnQgPSBpOwogICAgd2hpbGUgKGkgPCBzb3VyY2UubGVuZ3RoICYmIGRlcHRoID4gMCkgewogICAgICBpZiAoc291cmNlW2ldID09PSAneycpIGRlcHRoKys7CiAgICAgIGVsc2UgaWYgKHNvdXJjZVtpXSA9PT0gJ30nKSBkZXB0aC0tOwogICAgICBpKys7CiAgICB9CiAgICBvdXQucHVzaCh7IHR5cGVzOiBtWzFdID8/ICcnLCBibG9jazogc291cmNlLnNsaWNlKHN0YXJ0LCBpIC0gMSkgfSk7CiAgfQogIHJldHVybiBvdXQ7Cn0KCi8qKiBGYWlscyB0aGUgY2hlY2sgd2l0aCBhbiBleHBsYW5hdGlvbiBvZiB3aGF0IHdhcyBsb29rZWQgYXQuICovCmV4cG9ydCBmdW5jdGlvbiBjaGVjayhvazogYm9vbGVhbiwgZXhwbGFuYXRpb246IHN0cmluZyk6IHZvaWQgewogIGlmICghb2spIHRocm93IG5ldyBFcnJvcihleHBsYW5hdGlvbik7Cn0K', 'base64'), 'UTF8'), true, 21),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'pom.xml', 'xml', convert_from(decode('PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHByb2plY3QgeG1sbnM9Imh0dHA6Ly9tYXZlbi5hcGFjaGUub3JnL1BPTS80LjAuMCIKICAgICAgICAgeG1sbnM6eHNpPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZSIKICAgICAgICAgeHNpOnNjaGVtYUxvY2F0aW9uPSJodHRwOi8vbWF2ZW4uYXBhY2hlLm9yZy9QT00vNC4wLjAgaHR0cHM6Ly9tYXZlbi5hcGFjaGUub3JnL3hzZC9tYXZlbi00LjAuMC54c2QiPgogIDxtb2RlbFZlcnNpb24+NC4wLjA8L21vZGVsVmVyc2lvbj4KICA8cGFyZW50PgogICAgPGdyb3VwSWQ+b3JnLnNwcmluZ2ZyYW1ld29yay5ib290PC9ncm91cElkPgogICAgPGFydGlmYWN0SWQ+c3ByaW5nLWJvb3Qtc3RhcnRlci1wYXJlbnQ8L2FydGlmYWN0SWQ+CiAgICA8dmVyc2lvbj4zLjMuNTwvdmVyc2lvbj4KICAgIDxyZWxhdGl2ZVBhdGgvPgogIDwvcGFyZW50PgogIDxncm91cElkPmNvbS56eWN1cy5wcm9jdXJlbWVudDwvZ3JvdXBJZD4KICA8YXJ0aWZhY3RJZD5wby1hcHByb3ZhbHM8L2FydGlmYWN0SWQ+CiAgPHZlcnNpb24+MS44LjA8L3ZlcnNpb24+CiAgPHByb3BlcnRpZXM+CiAgICA8amF2YS52ZXJzaW9uPjIxPC9qYXZhLnZlcnNpb24+CiAgPC9wcm9wZXJ0aWVzPgogIDxkZXBlbmRlbmNpZXM+CiAgICA8ZGVwZW5kZW5jeT4KICAgICAgPGdyb3VwSWQ+b3JnLnNwcmluZ2ZyYW1ld29yay5ib290PC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5zcHJpbmctYm9vdC1zdGFydGVyLXdlYjwvYXJ0aWZhY3RJZD4KICAgIDwvZGVwZW5kZW5jeT4KICAgIDxkZXBlbmRlbmN5PgogICAgICA8Z3JvdXBJZD5vcmcuc3ByaW5nZnJhbWV3b3JrLmJvb3Q8L2dyb3VwSWQ+CiAgICAgIDxhcnRpZmFjdElkPnNwcmluZy1ib290LXN0YXJ0ZXItZGF0YS1qcGE8L2FydGlmYWN0SWQ+CiAgICA8L2RlcGVuZGVuY3k+CiAgICA8ZGVwZW5kZW5jeT4KICAgICAgPGdyb3VwSWQ+b3JnLnNwcmluZ2ZyYW1ld29yay5ib290PC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5zcHJpbmctYm9vdC1zdGFydGVyLXNlY3VyaXR5PC9hcnRpZmFjdElkPgogICAgPC9kZXBlbmRlbmN5PgogICAgPGRlcGVuZGVuY3k+CiAgICAgIDxncm91cElkPm9yZy5wb3N0Z3Jlc3FsPC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5wb3N0Z3Jlc3FsPC9hcnRpZmFjdElkPgogICAgICA8c2NvcGU+cnVudGltZTwvc2NvcGU+CiAgICA8L2RlcGVuZGVuY3k+CiAgICA8ZGVwZW5kZW5jeT4KICAgICAgPGdyb3VwSWQ+b3JnLnNwcmluZ2ZyYW1ld29yay5ib290PC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5zcHJpbmctYm9vdC1zdGFydGVyLXRlc3Q8L2FydGlmYWN0SWQ+CiAgICAgIDxzY29wZT50ZXN0PC9zY29wZT4KICAgIDwvZGVwZW5kZW5jeT4KICAgIDxkZXBlbmRlbmN5PgogICAgICA8Z3JvdXBJZD5vcmcuc3ByaW5nZnJhbWV3b3JrLmJvb3Q8L2dyb3VwSWQ+CiAgICAgIDxhcnRpZmFjdElkPnNwcmluZy1ib290LXRlc3Rjb250YWluZXJzPC9hcnRpZmFjdElkPgogICAgICA8c2NvcGU+dGVzdDwvc2NvcGU+CiAgICA8L2RlcGVuZGVuY3k+CiAgICA8ZGVwZW5kZW5jeT4KICAgICAgPGdyb3VwSWQ+b3JnLnRlc3Rjb250YWluZXJzPC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5wb3N0Z3Jlc3FsPC9hcnRpZmFjdElkPgogICAgICA8c2NvcGU+dGVzdDwvc2NvcGU+CiAgICA8L2RlcGVuZGVuY3k+CiAgICA8ZGVwZW5kZW5jeT4KICAgICAgPGdyb3VwSWQ+b3JnLnRlc3Rjb250YWluZXJzPC9ncm91cElkPgogICAgICA8YXJ0aWZhY3RJZD5qdW5pdC1qdXBpdGVyPC9hcnRpZmFjdElkPgogICAgICA8c2NvcGU+dGVzdDwvc2NvcGU+CiAgICA8L2RlcGVuZGVuY3k+CiAgPC9kZXBlbmRlbmNpZXM+CjwvcHJvamVjdD4K', 'base64'), 'UTF8'), true, 22)
  on conflict (question_id, path) do update set language = excluded.language, content = excluded.content,
    readonly = excluded.readonly, sort_order = excluded.sort_order;
  delete from public.question_rubric_items where question_id = '04a206ea-655a-40fd-9651-b01088d59d98' and key <> all (array['transactions', 'batch', 'idempotency', 'concurrency', 'invoice', 'paging']::text[]);
  insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'transactions', 'Rejections are saved and refused approvals roll back', convert_from(decode('RXhwbGFpbnMgcmVhZE9ubHkg4oeSIG5vIGZsdXNoIChtZXRob2QtbGV2ZWwgQFRyYW5zYWN0aW9uYWwgb24gcmVqZWN0KSBhbmQgdGhhdCBjaGVja2VkIGV4Y2VwdGlvbnMgZG9uJ3Qgcm9sbCBiYWNrIGJ5IGRlZmF1bHQgKHJvbGxiYWNrRm9yKS4=', 'base64'), 'UTF8'), 5, 0),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'batch', 'Batch approvals are isolated per PO', convert_from(decode('RXhwbGFpbnMgdGhhdCBzZWxmLWludm9jYXRpb24gYnlwYXNzZXMgdGhlIHByb3h5IHNvIFJFUVVJUkVTX05FVyB3YXMgaWdub3JlZDsgdXNlcyBhIHNlcGFyYXRlIGJlYW4sIFRyYW5zYWN0aW9uVGVtcGxhdGUgb3IgdGhlIHByb3h5OyBwZXItUE8gcnVudGltZSBmYWlsdXJlcyBhcmUgcmVwb3J0ZWQsIG5vdCBmYXRhbC4=', 'base64'), 'UTF8'), 4, 1),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'idempotency', 'Idempotency is atomic and scoped', convert_from(decode('Q2xhaW1zIHRoZSBrZXkgYXRvbWljYWxseSAodW5pcXVlIChhcHByb3Zlciwga2V5KSArIGluc2VydC1maXJzdCAvIG9uIGNvbmZsaWN0LCByZXBsYXkgaW4gYSBuZXcgdHJhbnNhY3Rpb24gaWYgbmVlZGVkKTsgc2NvcGVzIGtleXMgcGVyIGFwcHJvdmVyOyByZWZ1c2VzIGtleSByZXVzZSBmb3IgYW5vdGhlciBQTyAoNDIyKS4=', 'base64'), 'UTF8'), 5, 2),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'concurrency', 'Two-person rule and concurrent approvers', 'Records who approved and refuses a repeat approver; @Version (or a pessimistic lock) with OptimisticLockingFailureException mapped to 409.', 4, 3),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'invoice', 'Invoice matching is correct', convert_from(decode('Y29tcGFyZVRvIGluc3RlYWQgb2YgQmlnRGVjaW1hbC5lcXVhbHM7IHN1bXMgcXVhbnRpdGllcyBwZXIgU0tVOyBsb2FkcyBsaW5lcyB3aXRob3V0IG9wZW4taW4tdmlldyAoZW50aXR5IGdyYXBoIC8gZmV0Y2ggam9pbiAvIHRyYW5zYWN0aW9uYWwgc2VydmljZSksIG5vdCBFQUdFUi4=', 'base64'), 'UTF8'), 4, 4),
    ('04a206ea-655a-40fd-9651-b01088d59d98', 'paging', 'Inbox paging is correct and paged in the database', convert_from(decode('MS1iYXNlZCDihpIgMC1iYXNlZCB3aXRoIHZhbGlkYXRpb247IHN0YWJsZSBzb3J0IChjcmVhdGVkQXQgZGVzYywgaWQgZGVzYyk7IG5vIGluLW1lbW9yeSBwYWdpbmF0aW9uIG9mIGEgY29sbGVjdGlvbiBmZXRjaCAodHdvLXN0ZXAgaWRzIHF1ZXJ5LCBEVE8gcHJvamVjdGlvbiBvciBiYXRjaCBmZXRjaGluZyku', 'base64'), 'UTF8'), 3, 5)
  on conflict (question_id, key) do update set criterion = excluded.criterion,
    description = excluded.description, max_points = excluded.max_points, sort_order = excluded.sort_order;
  insert into public.question_solutions (question_id, notes_md, files) values (
    '04a206ea-655a-40fd-9651-b01088d59d98', convert_from(decode('IyMgUmV2aWV3ZXIgbm90ZXM6IFBPIEFwcHJvdmFscyBzZXJ2aWNlCgpSdW4gdGhlIGNhbmRpZGF0ZSdzIGNvZGUgd2l0aCBgbXZuIHZlcmlmeWAgKERvY2tlciBuZWVkZWQgZm9yIFRlc3Rjb250YWluZXJzKS4gVGhlIHRlc3RzIGluCmBBcHByb3ZhbFNlcnZpY2VJVGAgYW5kIGBJbnZvaWNlTWF0Y2hlclRlc3RgIGZhaWwgb24gdGhlIHN0YXJ0ZXIgY29kZSBhbmQgcGFzcyBvbiB0aGlzIHJlZmVyZW5jZQpzb2x1dGlvbi4gUmVhZCB0aGUgZGlmZiB0b286IHNldmVyYWwgYnVncyBoYXZlIG1vcmUgdGhhbiBvbmUgZ29vZCBmaXguCgojIyMgMS4gUmVqZWN0aW9uIG5vdCBzYXZlZCAoYEFwcHJvdmFsU2VydmljZS5yZWplY3RgKQoKYHJlamVjdGAgaGFzIG5vIGFubm90YXRpb24sIHNvIGl0IGluaGVyaXRzIHRoZSBjbGFzcy1sZXZlbCBgQFRyYW5zYWN0aW9uYWwocmVhZE9ubHkgPSB0cnVlKWAuClNwcmluZyBzZXRzIEhpYmVybmF0ZSdzIGZsdXNoIG1vZGUgdG8gTUFOVUFMIGZvciByZWFkLW9ubHkgdHJhbnNhY3Rpb25zOiB0aGUgY2hhbmdlIGlzIG1hZGUgaW4KbWVtb3J5LCB0aGUgRFRPIHNheXMgKlJlamVjdGVkKiwgbm90aGluZyBpcyB3cml0dGVuLiAqKkZpeDoqKiBgQFRyYW5zYWN0aW9uYWxgIG9uIGByZWplY3RgLgoKIyMjIDIuIEFwcHJvdmFscyB0aGUgYnVkZ2V0IHJlZnVzZWQgKGBhcHByb3ZlYCwgYGFwcHJvdmVCYXRjaGApCgotIGBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbmAgaXMgKipjaGVja2VkKiouIEJ5IGRlZmF1bHQgU3ByaW5nIHJvbGxzIGJhY2sgb25seSBmb3IgdW5jaGVja2VkCiAgZXhjZXB0aW9ucywgc28gYGFwcHJvdmVgIGNvbW1pdHRlZCB0aGUgYXBwcm92YWwgYW5kIHRoZW4gYW5zd2VyZWQgNDIyLiAqKkZpeDoqKgogIGByb2xsYmFja0ZvciA9IEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uLmNsYXNzYCwgb3IgY2F0Y2ggaXQsIGBzZXRSb2xsYmFja09ubHkoKWAgYW5kIHJldGhyb3cgaXQuCiAgKFdyYXBwaW5nIGl0IGluIGFuIHVuY2hlY2tlZCBleGNlcHRpb24gYWxzbyByb2xscyBiYWNrLCBidXQgYnJlYWtzIHRoZSBBUEk6IHRoZSA0MjIgaGFuZGxlciBhbmQKICB0aGUgSlVuaXQgdGVzdCBleHBlY3QgYEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uYC4pCi0gYGFwcHJvdmVCYXRjaGAgY2FsbHMgYHRoaXMuYXBwcm92ZU9uZSguLi4pYC4gVGhhdCBjYWxsIGRvZXNuJ3QgZ28gdGhyb3VnaCB0aGUgcHJveHksIHNvCiAgYFJFUVVJUkVTX05FV2AgaXMgaWdub3JlZC4gRXZlcnkgUE8gcnVucyBpbiB0aGUgYmF0Y2gncyB0cmFuc2FjdGlvbjogYSByZWZ1c2VkIFBPJ3MKICBgcmVjb3JkQXBwcm92YWwoKWAgaXMgZmx1c2hlZCBhdCB0aGUgYmF0Y2ggY29tbWl0LCBhbmQgYSBydW50aW1lIGV4Y2VwdGlvbiBmb3Igb25lIGlkIChhbHJlYWR5CiAgYXBwcm92ZWQsIG5vdCBmb3VuZCkgcm9sbHMgYmFjayB0aGUgd2hvbGUgYmF0Y2guCi0gKipBY2NlcHQ6KiogYSBzZXBhcmF0ZSBiZWFuIHdpdGggYEBUcmFuc2FjdGlvbmFsKHByb3BhZ2F0aW9uID0gUkVRVUlSRVNfTkVXLCByb2xsYmFja0ZvciA9IOKApilgLCBhCiAgYFRyYW5zYWN0aW9uVGVtcGxhdGVgIChyZWZlcmVuY2UpLCBvciBzZWxmLWluamVjdGlvbiB0aHJvdWdoIHRoZSBwcm94eS4gVGhlIGJhdGNoIGl0c2VsZgogIHNob3VsZG4ndCBob2xkIGEgdHJhbnNhY3Rpb24gKG9yIG11c3QgYXQgbGVhc3Qgbm90IHNoYXJlIHRoZSBwZXItUE8gd29yayksIGFuZCBwZXItUE8gcnVudGltZQogIGZhaWx1cmVzIGFyZSBjYXVnaHQgYW5kIHJlcG9ydGVkLgotICoqUmVkIGZsYWdzOioqIGNhdGNoaW5nIHRoZSBleGNlcHRpb24gYW5kICJ1bmRvaW5nIiB0aGUgc3RhdHVzIGJ5IGhhbmQ7IGBAVHJhbnNhY3Rpb25hbGAgb24gYQogIHByaXZhdGUgbWV0aG9kLgoKIyMjIDMuIEFwcHJvdmVkIGJ5IG9uZSBwZXJzb24KCnwgQ2F1c2UgfCBGaXggfAp8IC0tLSB8IC0tLSB8CnwgSWRlbXBvdGVuY3kgaXMgY2hlY2stdGhlbi1hY3QgKGBmaW5kQnlLZXlgLCB0aGVuIGBzYXZlYCk6IGNvbmN1cnJlbnQgcmV0cmllcyBhbGwgc2VlICJubyByZWNvcmQiIGFuZCBhbGwgYXBwcm92ZS4gfCBDbGFpbSB0aGUga2V5ICoqYXRvbWljYWxseSBiZWZvcmUqKiBkb2luZyB0aGUgd29yazogYSB1bmlxdWUgY29uc3RyYWludCBvbiAoYXBwcm92ZXJfaWQsIGlkZW1fa2V5KSBhbmQgYGluc2VydCDigKYgb24gY29uZmxpY3QgZG8gbm90aGluZ2AgKHJlZmVyZW5jZSkuIE9yIGBzYXZlQW5kRmx1c2hgIGFuZCBjYXRjaCBgRGF0YUludGVncml0eVZpb2xhdGlvbkV4Y2VwdGlvbmA7IGFmdGVyIHRoYXQgZXJyb3IgUG9zdGdyZVNRTCBhYm9ydHMgdGhlIHRyYW5zYWN0aW9uLCBzbyB0aGUgcmVwbGF5IG11c3QgcnVuIGluIGEgbmV3IG9uZS4gfAp8IFRoZSBrZXkgaXMgbG9va2VkIHVwIGdsb2JhbGx5LCBidXQga2V5cyBhcmUgdW5pcXVlIG9ubHkgcGVyIHVzZXIsIHNvIGEgY29sbGlzaW9uIHJldHVybnMgYW5vdGhlciBhcHByb3ZlcidzIFBPIGFuZCBza2lwcyB0aGUgYXBwcm92YWwuIHwgU2NvcGUgbG9va3VwcyBhbmQgdGhlIGNvbnN0cmFpbnQgdG8gdGhlIGFwcHJvdmVyLiB8CnwgQSBrZXkgcmV1c2VkIGZvciBhIGRpZmZlcmVudCBQTyBzaWxlbnRseSByZXBsYXlzIHRoZSBmaXJzdCBvbmUuIHwgQ29tcGFyZSB0aGUgc3RvcmVkIFBPIGlkIChhIHJlcXVlc3QgZmluZ2VycHJpbnQpIGFuZCByZWZ1c2Ugd2l0aCA0MjIuIHwKfCBgYXBwcm92YWxzUmVjZWl2ZWQrK2AgZG9lc24ndCByZWNvcmQgKndobyogYXBwcm92ZWQsIHNvIHRoZSBzYW1lIHBlcnNvbiBjYW4gZ2l2ZSBib3RoIGFwcHJvdmFscy4gfCBLZWVwIHRoZSBhcHByb3ZlciBpZHMgKHJlZmVyZW5jZTogYEBFbGVtZW50Q29sbGVjdGlvbmApIGFuZCByZWZ1c2UgYSByZXBlYXQuIHwKfCBObyBgQFZlcnNpb25gOiB0d28gYXBwcm92ZXJzIHJlYWQgdGhlIHNhbWUgc3RhdGUsIGJvdGggY29tbWl0IChsb3N0IHVwZGF0ZSksIGFuZCBidWRnZXQgaXMgcmVzZXJ2ZWQgdHdpY2UuIHwgYEBWZXJzaW9uYCBwbHVzIGEgNDA5IGhhbmRsZXIgZm9yIGBPcHRpbWlzdGljTG9ja2luZ0ZhaWx1cmVFeGNlcHRpb25gLiBBIHBlc3NpbWlzdGljIGBQRVNTSU1JU1RJQ19XUklURWAgbG9jayBvbiB0aGUgUE8gaXMgYWxzbyBmaW5lIGlmIHRoZXkgZXhwbGFpbiBpdC4gfAoKVGhlIGlkZW1wb3RlbmN5IGNsYWltIGlzIHJvbGxlZCBiYWNrIHdpdGggdGhlIHRyYW5zYWN0aW9uLCBzbyBhIHJlcXVlc3QgdGhhdCBmYWlsZWQgKGJ1ZGdldCwKY29uZmxpY3QpIGNhbiBiZSByZXRyaWVkIHdpdGggdGhlIHNhbWUga2V5LiBTdHJvbmcgYW5zd2VycyBtZW50aW9uIHRoaXMuCgojIyMgNC4gSW52b2ljZSBtYXRjaGluZwoKLSBgQmlnRGVjaW1hbC5lcXVhbHNgIGNvbXBhcmVzIHRoZSBzY2FsZSAoYDE1MDAuMGAg4omgIGAxNTAwLjAwYCk7IHVzZSBgY29tcGFyZVRvYC4KLSBRdWFudGl0aWVzIGhhdmUgdG8gYmUgc3VtbWVkIHBlciBTS1UgYWNyb3NzIGludm9pY2UgbGluZXMuCi0gV2l0aCBvcGVuLWluLXZpZXcgb2ZmLCBgZmluZEJ5SWRgIGluIHRoZSBjb250cm9sbGVyIHJldHVybnMgYSBkZXRhY2hlZCBQTy4gUmVhZGluZwogIGBnZXRMaW5lcygpYCB0aGVuIHRocm93cyBgTGF6eUluaXRpYWxpemF0aW9uRXhjZXB0aW9uYC4KLSAqKkFjY2VwdDoqKiBgQEVudGl0eUdyYXBoYCAvIGBqb2luIGZldGNoYCBsb29rdXAgKHJlZmVyZW5jZSksIG9yIGRvaW5nIHRoZSBtYXRjaCBpbnNpZGUgYQogIGBAVHJhbnNhY3Rpb25hbChyZWFkT25seSA9IHRydWUpYCBzZXJ2aWNlIG1ldGhvZC4KLSAqKlJlZCBmbGFnOioqIHN3aXRjaGluZyBvcGVuLWluLXZpZXcgYmFjayBvbiwgb3IgYEZldGNoVHlwZS5FQUdFUmAgb24gYGxpbmVzYC4KCiMjIyA1LiBJbmJveCBwYWdpbmcKCi0gYFBhZ2VSZXF1ZXN0YCBpcyAwLWJhc2VkLCBidXQgdGhlIEFQSSBpcyAxLWJhc2VkLiBVc2UgYHBhZ2UgLSAxYCBhbmQgdmFsaWRhdGUgYHBhZ2UgPj0gMWAKICAoNDAwIHZpYSBgSWxsZWdhbEFyZ3VtZW50RXhjZXB0aW9uYCkuCi0gVGhlcmUgd2FzIG5vIHNvcnQsIHNvIHRoZSBvcmRlciBpc24ndCBkZWZpbmVkIGFuZCBwYWdlcyBvdmVybGFwLiBTb3J0IGJ5IGBjcmVhdGVkQXQgZGVzYywgaWQgZGVzY2A7CiAgdGhlIGlkIGlzIHRoZSB0aWUtYnJlYWtlciB0aGF0IG1ha2VzIHRoZSBvcmRlciBzdGFibGUuCi0gQSBjb2xsZWN0aW9uIGBqb2luIGZldGNoYCB3aXRoIHBhZ2luZyBtYWtlcyBIaWJlcm5hdGUgZmV0Y2ggZXZlcnkgcm93IGFuZCBwYWdlIGluIG1lbW9yeQogIChISEg5MDAwMzAwNCkuCiAgLSAqKkFjY2VwdDoqKiB0d28gcXVlcmllcyAocGFnZSBvZiBpZHMsIHRoZW4gZmV0Y2ggdGhvc2UgUE9zIHdpdGggdGhlaXIgbGluZXM7IHJlZmVyZW5jZSksIGEgRFRPCiAgICBwcm9qZWN0aW9uIHdpdGggYSBsaW5lLWNvdW50IHN1YnF1ZXJ5LCBvciBgQEJhdGNoU2l6ZWAgLyBgZGVmYXVsdF9iYXRjaF9mZXRjaF9zaXplYCBvbiB0aGUKICAgIGxpbmVzIHdpdGhvdXQgdGhlIGZldGNoIGpvaW4uCiAgLSAqKlJlZCBmbGFnOioqIHJlbW92aW5nIGBkaXN0aW5jdGAgb25seSwgb3IgcmFpc2luZyB0aGUgaGVhcC4KCiMjIyBTY29yaW5nIGhpbnRzCgotIEZ1bGwgbWFya3MgbmVlZCB0aGUgdHJhbnNhY3Rpb25hbCBhbmQgY29uY3VycmVuY3kgY2F1c2VzIGV4cGxhaW5lZCwgbm90IGp1c3QgcGF0Y2hlZC4gQQogIGNvbW1lbnQgbGlrZSAic2VsZi1pbnZvY2F0aW9uIGJ5cGFzc2VzIHRoZSBwcm94eSIgb3IgInJlYWRPbmx5IOKHkiBGbHVzaE1vZGUuTUFOVUFMIiBpcyB3b3J0aAogIG1vcmUgdGhhbiB0aGUgYW5ub3RhdGlvbiBhbG9uZS4KLSBgc3luY2hyb25pemVkYCBibG9ja3Mgb3IgaW4tbWVtb3J5IGxvY2tzIGRvbid0IHdvcms6IHRoZSBzZXJ2aWNlIHJ1bnMgYXMgc2V2ZXJhbCBpbnN0YW5jZXMuCg==', 'base64'), 'UTF8'), (convert_from(decode('W3sicGF0aCI6InNyYy9tYWluL2phdmEvY29tL3p5Y3VzL3Byb2N1cmVtZW50L3BvL0FwcHJvdmFsU2VydmljZS5qYXZhIiwiY29udGVudCI6InBhY2thZ2UgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvO1xuXG5pbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuQmF0Y2hSZXN1bHQ7XG5pbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuUHVyY2hhc2VPcmRlckR0bztcbmltcG9ydCBqYXZhLnV0aWwuTGlzdDtcbmltcG9ydCBqYXZhLnV0aWwuTWFwO1xuaW1wb3J0IGphdmEudXRpbC5mdW5jdGlvbi5GdW5jdGlvbjtcbmltcG9ydCBqYXZhLnV0aWwuc3RyZWFtLkNvbGxlY3RvcnM7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYW8uT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5kb21haW4uUGFnZTtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlBhZ2VhYmxlO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuc3RlcmVvdHlwZS5TZXJ2aWNlO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsudHJhbnNhY3Rpb24uUGxhdGZvcm1UcmFuc2FjdGlvbk1hbmFnZXI7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5UcmFuc2FjdGlvbkRlZmluaXRpb247XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5UcmFuc2FjdGlvblN0YXR1cztcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLnRyYW5zYWN0aW9uLmFubm90YXRpb24uUHJvcGFnYXRpb247XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5hbm5vdGF0aW9uLlRyYW5zYWN0aW9uYWw7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay50cmFuc2FjdGlvbi5zdXBwb3J0LlRyYW5zYWN0aW9uVGVtcGxhdGU7XG5cbkBTZXJ2aWNlXG5AVHJhbnNhY3Rpb25hbChyZWFkT25seSA9IHRydWUpXG5wdWJsaWMgY2xhc3MgQXBwcm92YWxTZXJ2aWNlIHtcblxuICAgIC8qKiBUaGUgSWRlbXBvdGVuY3ktS2V5IHdhcyBhbHJlYWR5IHVzZWQgYnkgdGhpcyBhcHByb3ZlciBmb3IgYSBkaWZmZXJlbnQgUE8gKEhUVFAgNDIyKS4gKi9cbiAgICBwdWJsaWMgc3RhdGljIGNsYXNzIElkZW1wb3RlbmN5S2V5UmV1c2VkRXhjZXB0aW9uIGV4dGVuZHMgUnVudGltZUV4Y2VwdGlvbiB7XG5cbiAgICAgICAgcHVibGljIElkZW1wb3RlbmN5S2V5UmV1c2VkRXhjZXB0aW9uKFN0cmluZyBrZXkpIHtcbiAgICAgICAgICAgIHN1cGVyKFwiSWRlbXBvdGVuY3ktS2V5IFwiICsga2V5ICsgXCIgd2FzIGFscmVhZHkgdXNlZCBmb3IgYSBkaWZmZXJlbnQgcHVyY2hhc2Ugb3JkZXJcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGZpbmFsIFB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IG9yZGVycztcbiAgICBwcml2YXRlIGZpbmFsIElkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSBpZGVtcG90ZW5jeTtcbiAgICBwcml2YXRlIGZpbmFsIEJ1ZGdldFNlcnZpY2UgYnVkZ2V0O1xuICAgIC8qKiBPbmUgdHJhbnNhY3Rpb24gcGVyIFBPIGluIGEgYmF0Y2ggKFJFUVVJUkVTX05FVykuICovXG4gICAgcHJpdmF0ZSBmaW5hbCBUcmFuc2FjdGlvblRlbXBsYXRlIHBlclBvO1xuXG4gICAgcHVibGljIEFwcHJvdmFsU2VydmljZShQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBvcmRlcnMsIElkZW1wb3RlbmN5UmVjb3JkUmVwb3NpdG9yeSBpZGVtcG90ZW5jeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIEJ1ZGdldFNlcnZpY2UgYnVkZ2V0LCBQbGF0Zm9ybVRyYW5zYWN0aW9uTWFuYWdlciB0cmFuc2FjdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcmRlcnMgPSBvcmRlcnM7XG4gICAgICAgIHRoaXMuaWRlbXBvdGVuY3kgPSBpZGVtcG90ZW5jeTtcbiAgICAgICAgdGhpcy5idWRnZXQgPSBidWRnZXQ7XG4gICAgICAgIHRoaXMucGVyUG8gPSBuZXcgVHJhbnNhY3Rpb25UZW1wbGF0ZSh0cmFuc2FjdGlvbnMpO1xuICAgICAgICB0aGlzLnBlclBvLnNldFByb3BhZ2F0aW9uQmVoYXZpb3IoVHJhbnNhY3Rpb25EZWZpbml0aW9uLlBST1BBR0FUSU9OX1JFUVVJUkVTX05FVyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRhdGFiYXNlIHBhZ2VzIHRoZSBpZHMgKHNvcnRlZCBieSB0aGUgUGFnZWFibGUpOyB0aGUgbGluZXMgZm9yIHRoYXQgcGFnZSBhcmUgdGhlbiBsb2FkZWRcbiAgICAgKiBpbiBvbmUgcXVlcnkuIFBhZ2luZyBhIGNvbGxlY3Rpb24gZmV0Y2ggam9pbiBtYWRlIEhpYmVybmF0ZSBsb2FkIGV2ZXJ5IFBPIGFuZCBwYWdlIGluIG1lbW9yeS5cbiAgICAgKi9cbiAgICBwdWJsaWMgUGFnZTxQdXJjaGFzZU9yZGVyRHRvPiBsaXN0KFBhZ2VhYmxlIHBhZ2VhYmxlKSB7XG4gICAgICAgIFBhZ2U8TG9uZz4gaWRzID0gb3JkZXJzLmZpbmRQYWdlSWRzKHBhZ2VhYmxlKTtcbiAgICAgICAgTGlzdDxQdXJjaGFzZU9yZGVyPiBmb3VuZCA9IGlkcy5pc0VtcHR5KCkgPyBMaXN0Lm9mKCkgOiBvcmRlcnMuZmluZEFsbFdpdGhMaW5lcyhpZHMuZ2V0Q29udGVudCgpKTtcbiAgICAgICAgTWFwPExvbmcsIFB1cmNoYXNlT3JkZXI+IGJ5SWQgPSBmb3VuZC5zdHJlYW0oKVxuICAgICAgICAgICAgICAgIC5jb2xsZWN0KENvbGxlY3RvcnMudG9NYXAoUHVyY2hhc2VPcmRlcjo6Z2V0SWQsIEZ1bmN0aW9uLmlkZW50aXR5KCkpKTtcbiAgICAgICAgcmV0dXJuIGlkcy5tYXAoaWQgLT4gUHVyY2hhc2VPcmRlckR0by5mcm9tKGJ5SWQuZ2V0KGlkKSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFwcHJvdmVzIGEgUE8uIFRoZSBtb2JpbGUgYXBwIHNlbmRzIGFuIElkZW1wb3RlbmN5LUtleSBhbmQgcmV0cmllcyBvbiB0aW1lb3V0cywgc28gdGhlIHNhbWVcbiAgICAgKiByZXF1ZXN0IG1heSBhcnJpdmUgbW9yZSB0aGFuIG9uY2UgKGFuZCBzb21ldGltZXMgYXQgdGhlIHNhbWUgdGltZSkuXG4gICAgICpcbiAgICAgKiA8cD5UaGUga2V5IGlzIGNsYWltZWQgd2l0aCBhbiBhdG9taWMgaW5zZXJ0ICh1bmlxdWUgcGVyIGFwcHJvdmVyKSBiZWZvcmUgYW55dGhpbmcgZWxzZSwgc29cbiAgICAgKiBjb25jdXJyZW50IGR1cGxpY2F0ZXMgd2FpdCBmb3IgdGhlIGZpcnN0IHJlcXVlc3QgYW5kIHRoZW4gcmVwbGF5IGl0cyByZXN1bHQuIEEgY2hlY2tlZFxuICAgICAqIHtAbGluayBCdWRnZXRFeGNlZWRlZEV4Y2VwdGlvbn0gZG9lc24ndCByb2xsIGJhY2sgYnkgZGVmYXVsdDogcm9sbGJhY2tGb3IgbWFrZXMgYSByZWZ1c2VkXG4gICAgICogYXBwcm92YWwgKGFuZCBpdHMga2V5IGNsYWltKSBkaXNhcHBlYXIsIHNvIGEgcmV0cnkgYWZ0ZXIgYSBidWRnZXQgdG9wLXVwIHdvcmtzLlxuICAgICAqL1xuICAgIEBUcmFuc2FjdGlvbmFsKHJvbGxiYWNrRm9yID0gQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24uY2xhc3MpXG4gICAgcHVibGljIFB1cmNoYXNlT3JkZXJEdG8gYXBwcm92ZShsb25nIHBvSWQsIFN0cmluZyBhcHByb3ZlcklkLCBTdHJpbmcgaWRlbXBvdGVuY3lLZXkpXG4gICAgICAgICAgICB0aHJvd3MgQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24ge1xuICAgICAgICBpZiAoaWRlbXBvdGVuY3kuY2xhaW0oaWRlbXBvdGVuY3lLZXksIGFwcHJvdmVySWQsIHBvSWQpID09IDApIHtcbiAgICAgICAgICAgIElkZW1wb3RlbmN5UmVjb3JkIHByZXZpb3VzID0gaWRlbXBvdGVuY3kuZmluZEJ5QXBwcm92ZXJJZEFuZEtleShhcHByb3ZlcklkLCBpZGVtcG90ZW5jeUtleSlcbiAgICAgICAgICAgICAgICAgICAgLm9yRWxzZVRocm93KCk7XG4gICAgICAgICAgICBpZiAocHJldmlvdXMuZ2V0UHVyY2hhc2VPcmRlcklkKCkgIT0gcG9JZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBJZGVtcG90ZW5jeUtleVJldXNlZEV4Y2VwdGlvbihpZGVtcG90ZW5jeUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gUHVyY2hhc2VPcmRlckR0by5mcm9tKGZpbmQocG9JZCkpO1xuICAgICAgICB9XG4gICAgICAgIFB1cmNoYXNlT3JkZXIgcG8gPSBmaW5kKHBvSWQpO1xuICAgICAgICBwby5yZWNvcmRBcHByb3ZhbChhcHByb3ZlcklkKTtcbiAgICAgICAgaWYgKHBvLmdldFN0YXR1cygpID09IFBvU3RhdHVzLkFQUFJPVkVEKSB7XG4gICAgICAgICAgICBidWRnZXQucmVzZXJ2ZShwby5nZXRJZCgpLCBwby5nZXRUb3RhbCgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHVyY2hhc2VPcmRlckR0by5mcm9tKHBvKTtcbiAgICB9XG5cbiAgICAvKiogV2FzIHJlYWQtb25seSAoaW5oZXJpdGVkIGZyb20gdGhlIGNsYXNzKSwgc28gSGliZXJuYXRlIG5ldmVyIGZsdXNoZWQgdGhlIHJlamVjdGlvbi4gKi9cbiAgICBAVHJhbnNhY3Rpb25hbFxuICAgIHB1YmxpYyBQdXJjaGFzZU9yZGVyRHRvIHJlamVjdChsb25nIHBvSWQsIFN0cmluZyBhcHByb3ZlcklkLCBTdHJpbmcgcmVhc29uKSB7XG4gICAgICAgIFB1cmNoYXNlT3JkZXIgcG8gPSBmaW5kKHBvSWQpO1xuICAgICAgICBwby5yZWplY3QocmVhc29uKTtcbiAgICAgICAgcmV0dXJuIFB1cmNoYXNlT3JkZXJEdG8uZnJvbShwbyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXBwcm92ZXMgc2V2ZXJhbCBQT3M7IG9uZSBQTyBmYWlsaW5nIChlLmcuIG91dCBvZiBidWRnZXQpIG11c3Qgbm90IGFmZmVjdCB0aGUgb3RoZXJzLlxuICAgICAqXG4gICAgICogPHA+Q2FsbGluZyBhIHtAY29kZSBAVHJhbnNhY3Rpb25hbChSRVFVSVJFU19ORVcpfSBtZXRob2Qgb24ge0Bjb2RlIHRoaXN9IGJ5cGFzc2VzIHRoZSBwcm94eSwgc29cbiAgICAgKiBldmVyeSBQTyB1c2VkIHRvIHJ1biBpbiB0aGUgYmF0Y2gncyB0cmFuc2FjdGlvbjogYSByZWZ1c2VkIFBPJ3MgYXBwcm92YWwgd2FzIGNvbW1pdHRlZCB3aXRoIHRoZVxuICAgICAqIG90aGVycywgYW5kIGFueSBydW50aW1lIGZhaWx1cmUgcm9sbGVkIHRoZSB3aG9sZSBiYXRjaCBiYWNrLiBFYWNoIFBPIG5vdyBnZXRzIGl0cyBvd25cbiAgICAgKiB0cmFuc2FjdGlvbiwgYW5kIHRoZSBiYXRjaCBpdHNlbGYgcnVucyBvdXRzaWRlIG9uZS5cbiAgICAgKi9cbiAgICBAVHJhbnNhY3Rpb25hbChwcm9wYWdhdGlvbiA9IFByb3BhZ2F0aW9uLk5PVF9TVVBQT1JURUQpXG4gICAgcHVibGljIEJhdGNoUmVzdWx0IGFwcHJvdmVCYXRjaChMaXN0PExvbmc+IGlkcywgU3RyaW5nIGFwcHJvdmVySWQpIHtcbiAgICAgICAgQmF0Y2hSZXN1bHQgcmVzdWx0ID0gbmV3IEJhdGNoUmVzdWx0KCk7XG4gICAgICAgIGZvciAoTG9uZyBpZCA6IGlkcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBTdHJpbmcgcmVmdXNhbCA9IHBlclBvLmV4ZWN1dGUoc3RhdHVzIC0+IGFwcHJvdmVPbmUoaWQsIGFwcHJvdmVySWQsIHN0YXR1cykpO1xuICAgICAgICAgICAgICAgIGlmIChyZWZ1c2FsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmFwcHJvdmVkKGlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZmFpbGVkKGlkLCByZWZ1c2FsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChQb05vdEZvdW5kRXhjZXB0aW9uIHwgSWxsZWdhbFN0YXRlRXhjZXB0aW9uIHwgT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uIGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuZmFpbGVkKGlkLCBlLmdldE1lc3NhZ2UoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKiogUnVucyBpbiB0aGUgUE8ncyBvd24gdHJhbnNhY3Rpb24uIFJldHVybnMgd2h5IHRoZSBidWRnZXQgcmVmdXNlZCBpdCAoYWZ0ZXIgcm9sbGluZyBiYWNrKSwgb3IgbnVsbC4gKi9cbiAgICBwcml2YXRlIFN0cmluZyBhcHByb3ZlT25lKGxvbmcgaWQsIFN0cmluZyBhcHByb3ZlcklkLCBUcmFuc2FjdGlvblN0YXR1cyBzdGF0dXMpIHtcbiAgICAgICAgUHVyY2hhc2VPcmRlciBwbyA9IGZpbmQoaWQpO1xuICAgICAgICBwby5yZWNvcmRBcHByb3ZhbChhcHByb3ZlcklkKTtcbiAgICAgICAgaWYgKHBvLmdldFN0YXR1cygpID09IFBvU3RhdHVzLkFQUFJPVkVEKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGJ1ZGdldC5yZXNlcnZlKGlkLCBwby5nZXRUb3RhbCgpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uIGUpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMuc2V0Um9sbGJhY2tPbmx5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGUuZ2V0TWVzc2FnZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgUHVyY2hhc2VPcmRlciBmaW5kKGxvbmcgaWQpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVycy5maW5kQnlJZChpZCkub3JFbHNlVGhyb3coKCkgLT4gbmV3IFBvTm90Rm91bmRFeGNlcHRpb24oaWQpKTtcbiAgICB9XG59XG4ifSx7InBhdGgiOiJzcmMvbWFpbi9qYXZhL2NvbS96eWN1cy9wcm9jdXJlbWVudC9wby9QdXJjaGFzZU9yZGVyQ29udHJvbGxlci5qYXZhIiwiY29udGVudCI6InBhY2thZ2UgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvO1xuXG5pbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuQmF0Y2hSZXF1ZXN0O1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkJhdGNoUmVzdWx0O1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkludm9pY2VSZXF1ZXN0O1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLk1hdGNoUmVzdWx0O1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLlB1cmNoYXNlT3JkZXJEdG87XG5pbXBvcnQgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvLkR0b3MuUmVqZWN0UmVxdWVzdDtcbmltcG9ydCBqYXZhLnNlY3VyaXR5LlByaW5jaXBhbDtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlBhZ2U7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmRvbWFpbi5QYWdlUmVxdWVzdDtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlNvcnQ7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLkdldE1hcHBpbmc7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLlBhdGhWYXJpYWJsZTtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUG9zdE1hcHBpbmc7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLlJlcXVlc3RCb2R5O1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5SZXF1ZXN0SGVhZGVyO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5SZXF1ZXN0TWFwcGluZztcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5iaW5kLmFubm90YXRpb24uUmVxdWVzdFBhcmFtO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmJpbmQuYW5ub3RhdGlvbi5SZXN0Q29udHJvbGxlcjtcblxuQFJlc3RDb250cm9sbGVyXG5AUmVxdWVzdE1hcHBpbmcoXCIvYXBpL3Bvc1wiKVxucHVibGljIGNsYXNzIFB1cmNoYXNlT3JkZXJDb250cm9sbGVyIHtcblxuICAgIC8qKiBOZXdlc3QgZmlyc3Q7IHRoZSBpZCBicmVha3MgdGllcyBzbyB0aGUgb3JkZXIgKGFuZCBzbyB0aGUgcGFnZXMpIGlzIHN0YWJsZS4gKi9cbiAgICBwcml2YXRlIHN0YXRpYyBmaW5hbCBTb3J0IE5FV0VTVF9GSVJTVCA9IFNvcnQuYnkoU29ydC5PcmRlci5kZXNjKFwiY3JlYXRlZEF0XCIpLCBTb3J0Lk9yZGVyLmRlc2MoXCJpZFwiKSk7XG5cbiAgICBwcml2YXRlIGZpbmFsIEFwcHJvdmFsU2VydmljZSBhcHByb3ZhbHM7XG4gICAgcHJpdmF0ZSBmaW5hbCBQdXJjaGFzZU9yZGVyUmVwb3NpdG9yeSBvcmRlcnM7XG4gICAgcHJpdmF0ZSBmaW5hbCBJbnZvaWNlTWF0Y2hlciBtYXRjaGVyO1xuXG4gICAgcHVibGljIFB1cmNoYXNlT3JkZXJDb250cm9sbGVyKEFwcHJvdmFsU2VydmljZSBhcHByb3ZhbHMsIFB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IG9yZGVycywgSW52b2ljZU1hdGNoZXIgbWF0Y2hlcikge1xuICAgICAgICB0aGlzLmFwcHJvdmFscyA9IGFwcHJvdmFscztcbiAgICAgICAgdGhpcy5vcmRlcnMgPSBvcmRlcnM7XG4gICAgICAgIHRoaXMubWF0Y2hlciA9IG1hdGNoZXI7XG4gICAgfVxuXG4gICAgLyoqIFRoZSBpbmJveCwgbmV3ZXN0IGZpcnN0LiBQYWdlcyBhcmUgbnVtYmVyZWQgZnJvbSAxICh0aGUgbW9iaWxlIGFwcCdzIGNvbnRyYWN0KS4gKi9cbiAgICBAR2V0TWFwcGluZ1xuICAgIHB1YmxpYyBQYWdlPFB1cmNoYXNlT3JkZXJEdG8+IGxpc3QoQFJlcXVlc3RQYXJhbShkZWZhdWx0VmFsdWUgPSBcIjFcIikgaW50IHBhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAUmVxdWVzdFBhcmFtKGRlZmF1bHRWYWx1ZSA9IFwiMjBcIikgaW50IHNpemUpIHtcbiAgICAgICAgaWYgKHBhZ2UgPCAxIHx8IHNpemUgPCAxIHx8IHNpemUgPiAxMDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBJbGxlZ2FsQXJndW1lbnRFeGNlcHRpb24oXCJwYWdlIHN0YXJ0cyBhdCAxIGFuZCBzaXplIG11c3QgYmUgYmV0d2VlbiAxIGFuZCAxMDBcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUGFnZVJlcXVlc3QgaXMgMC1iYXNlZDogcGFnZSAxIHVzZWQgdG8gcmV0dXJuIHRoZSBzZWNvbmQgcGFnZS5cbiAgICAgICAgcmV0dXJuIGFwcHJvdmFscy5saXN0KFBhZ2VSZXF1ZXN0Lm9mKHBhZ2UgLSAxLCBzaXplLCBORVdFU1RfRklSU1QpKTtcbiAgICB9XG5cbiAgICBAUG9zdE1hcHBpbmcoXCIve2lkfS9hcHByb3ZlXCIpXG4gICAgcHVibGljIFB1cmNoYXNlT3JkZXJEdG8gYXBwcm92ZShAUGF0aFZhcmlhYmxlIGxvbmcgaWQsIEBSZXF1ZXN0SGVhZGVyKFwiSWRlbXBvdGVuY3ktS2V5XCIpIFN0cmluZyBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcmluY2lwYWwgdXNlcikgdGhyb3dzIEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uIHtcbiAgICAgICAgcmV0dXJuIGFwcHJvdmFscy5hcHByb3ZlKGlkLCB1c2VyLmdldE5hbWUoKSwga2V5KTtcbiAgICB9XG5cbiAgICBAUG9zdE1hcHBpbmcoXCIve2lkfS9yZWplY3RcIilcbiAgICBwdWJsaWMgUHVyY2hhc2VPcmRlckR0byByZWplY3QoQFBhdGhWYXJpYWJsZSBsb25nIGlkLCBAUmVxdWVzdEJvZHkgUmVqZWN0UmVxdWVzdCBib2R5LCBQcmluY2lwYWwgdXNlcikge1xuICAgICAgICByZXR1cm4gYXBwcm92YWxzLnJlamVjdChpZCwgdXNlci5nZXROYW1lKCksIGJvZHkucmVhc29uKCkpO1xuICAgIH1cblxuICAgIEBQb3N0TWFwcGluZyhcIi9hcHByb3ZlLWJhdGNoXCIpXG4gICAgcHVibGljIEJhdGNoUmVzdWx0IGFwcHJvdmVCYXRjaChAUmVxdWVzdEJvZHkgQmF0Y2hSZXF1ZXN0IGJvZHksIFByaW5jaXBhbCB1c2VyKSB7XG4gICAgICAgIHJldHVybiBhcHByb3ZhbHMuYXBwcm92ZUJhdGNoKGJvZHkuaWRzKCksIHVzZXIuZ2V0TmFtZSgpKTtcbiAgICB9XG5cbiAgICBAUG9zdE1hcHBpbmcoXCIve2lkfS9tYXRjaC1pbnZvaWNlXCIpXG4gICAgcHVibGljIE1hdGNoUmVzdWx0IG1hdGNoSW52b2ljZShAUGF0aFZhcmlhYmxlIGxvbmcgaWQsIEBSZXF1ZXN0Qm9keSBJbnZvaWNlUmVxdWVzdCBpbnZvaWNlKSB7XG4gICAgICAgIC8vIG9wZW4taW4tdmlldyBpcyBvZmY6IGZpbmRCeUlkIHJldHVybmVkIGEgZGV0YWNoZWQgUE8gYW5kIHJlYWRpbmcgaXRzIGxhenkgbGluZXMgdGhyZXdcbiAgICAgICAgLy8gTGF6eUluaXRpYWxpemF0aW9uRXhjZXB0aW9uICg1MDApLlxuICAgICAgICBQdXJjaGFzZU9yZGVyIHBvID0gb3JkZXJzLmZpbmRXaXRoTGluZXNCeUlkKGlkKS5vckVsc2VUaHJvdygoKSAtPiBuZXcgUG9Ob3RGb3VuZEV4Y2VwdGlvbihpZCkpO1xuICAgICAgICByZXR1cm4gbWF0Y2hlci5tYXRjaChwbywgaW52b2ljZSk7XG4gICAgfVxufVxuIn0seyJwYXRoIjoic3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vSW52b2ljZU1hdGNoZXIuamF2YSIsImNvbnRlbnQiOiJwYWNrYWdlIGNvbS56eWN1cy5wcm9jdXJlbWVudC5wbztcblxuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkludm9pY2VMaW5lO1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLkludm9pY2VSZXF1ZXN0O1xuaW1wb3J0IGNvbS56eWN1cy5wcm9jdXJlbWVudC5wby5EdG9zLk1hdGNoUmVzdWx0O1xuaW1wb3J0IGphdmEudXRpbC5BcnJheUxpc3Q7XG5pbXBvcnQgamF2YS51dGlsLkxpbmtlZEhhc2hNYXA7XG5pbXBvcnQgamF2YS51dGlsLkxpc3Q7XG5pbXBvcnQgamF2YS51dGlsLk1hcDtcbmltcG9ydCBqYXZhLnV0aWwuZnVuY3Rpb24uRnVuY3Rpb247XG5pbXBvcnQgamF2YS51dGlsLnN0cmVhbS5Db2xsZWN0b3JzO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuc3RlcmVvdHlwZS5Db21wb25lbnQ7XG5cbi8qKiBUd28td2F5IG1hdGNoOiB0aGUgaW52b2ljZSBtdXN0IGFncmVlIHdpdGggdGhlIFBPIG9uIHRvdGFsIGFuZCBvbiBldmVyeSBsaW5lLiAqL1xuQENvbXBvbmVudFxucHVibGljIGNsYXNzIEludm9pY2VNYXRjaGVyIHtcblxuICAgIC8qKlxuICAgICAqIEFtb3VudHMgYXJlIGNvbXBhcmVkIHdpdGgge0Bjb2RlIGNvbXBhcmVUb306IHtAY29kZSBCaWdEZWNpbWFsLmVxdWFsc30gYWxzbyBjb21wYXJlcyB0aGUgc2NhbGUsXG4gICAgICogc28gMTUwMC4wIGFuZCAxNTAwLjAwIHdlcmUgXCJkaWZmZXJlbnRcIi4gUXVhbnRpdGllcyBhcmUgYWRkZWQgdXAgcGVyIFNLVSwgYmVjYXVzZSBhbiBpbnZvaWNlIG1heVxuICAgICAqIHNwbGl0IG9uZSBTS1Ugb3ZlciBzZXZlcmFsIGxpbmVzICg1ICsgNSBhZ2FpbnN0IDggb3JkZXJlZCBwYXNzZWQgbGluZSBieSBsaW5lKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgTWF0Y2hSZXN1bHQgbWF0Y2goUHVyY2hhc2VPcmRlciBwbywgSW52b2ljZVJlcXVlc3QgaW52b2ljZSkge1xuICAgICAgICBMaXN0PFN0cmluZz4gcHJvYmxlbXMgPSBuZXcgQXJyYXlMaXN0PD4oKTtcbiAgICAgICAgaWYgKHBvLmdldFRvdGFsKCkuY29tcGFyZVRvKGludm9pY2UuYW1vdW50KCkpICE9IDApIHtcbiAgICAgICAgICAgIHByb2JsZW1zLmFkZChcIkludm9pY2UgYW1vdW50IFwiICsgaW52b2ljZS5hbW91bnQoKSArIFwiIGRpZmZlcnMgZnJvbSBQTyB0b3RhbCBcIiArIHBvLmdldFRvdGFsKCkpO1xuICAgICAgICB9XG4gICAgICAgIE1hcDxTdHJpbmcsIFB1cmNoYXNlT3JkZXJMaW5lPiBieVNrdSA9IHBvLmdldExpbmVzKCkuc3RyZWFtKClcbiAgICAgICAgICAgICAgICAuY29sbGVjdChDb2xsZWN0b3JzLnRvTWFwKFB1cmNoYXNlT3JkZXJMaW5lOjpnZXRTa3UsIEZ1bmN0aW9uLmlkZW50aXR5KCkpKTtcbiAgICAgICAgTWFwPFN0cmluZywgSW50ZWdlcj4gaW52b2ljZWQgPSBuZXcgTGlua2VkSGFzaE1hcDw+KCk7XG4gICAgICAgIGZvciAoSW52b2ljZUxpbmUgbGluZSA6IGludm9pY2UubGluZXMoKSkge1xuICAgICAgICAgICAgUHVyY2hhc2VPcmRlckxpbmUgcG9MaW5lID0gYnlTa3UuZ2V0KGxpbmUuc2t1KCkpO1xuICAgICAgICAgICAgaWYgKHBvTGluZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcHJvYmxlbXMuYWRkKFwiU0tVIFwiICsgbGluZS5za3UoKSArIFwiIGlzIG5vdCBvbiB0aGUgUE9cIik7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocG9MaW5lLmdldFVuaXRQcmljZSgpLmNvbXBhcmVUbyhsaW5lLnVuaXRQcmljZSgpKSAhPSAwKSB7XG4gICAgICAgICAgICAgICAgcHJvYmxlbXMuYWRkKFwiU0tVIFwiICsgbGluZS5za3UoKSArIFwiOiB1bml0IHByaWNlIGRpZmZlcnNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnZvaWNlZC5tZXJnZShsaW5lLnNrdSgpLCBsaW5lLnF1YW50aXR5KCksIEludGVnZXI6OnN1bSk7XG4gICAgICAgIH1cbiAgICAgICAgaW52b2ljZWQuZm9yRWFjaCgoc2t1LCBxdWFudGl0eSkgLT4ge1xuICAgICAgICAgICAgaW50IG9yZGVyZWQgPSBieVNrdS5nZXQoc2t1KS5nZXRRdWFudGl0eSgpO1xuICAgICAgICAgICAgaWYgKHF1YW50aXR5ID4gb3JkZXJlZCkge1xuICAgICAgICAgICAgICAgIHByb2JsZW1zLmFkZChcIlNLVSBcIiArIHNrdSArIFwiOiBpbnZvaWNlZCBcIiArIHF1YW50aXR5ICsgXCIsIG9yZGVyZWQgXCIgKyBvcmRlcmVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBNYXRjaFJlc3VsdC5vZihwcm9ibGVtcyk7XG4gICAgfVxufVxuIn0seyJwYXRoIjoic3JjL21haW4vamF2YS9jb20venljdXMvcHJvY3VyZW1lbnQvcG8vUHVyY2hhc2VPcmRlclJlcG9zaXRvcnkuamF2YSIsImNvbnRlbnQiOiJwYWNrYWdlIGNvbS56eWN1cy5wcm9jdXJlbWVudC5wbztcblxuaW1wb3J0IGphdmEudXRpbC5Db2xsZWN0aW9uO1xuaW1wb3J0IGphdmEudXRpbC5MaXN0O1xuaW1wb3J0IGphdmEudXRpbC5PcHRpb25hbDtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuZG9tYWluLlBhZ2U7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmRvbWFpbi5QYWdlYWJsZTtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuanBhLnJlcG9zaXRvcnkuRW50aXR5R3JhcGg7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmpwYS5yZXBvc2l0b3J5LkpwYVJlcG9zaXRvcnk7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5kYXRhLmpwYS5yZXBvc2l0b3J5LlF1ZXJ5O1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5yZXBvc2l0b3J5LnF1ZXJ5LlBhcmFtO1xuXG5wdWJsaWMgaW50ZXJmYWNlIFB1cmNoYXNlT3JkZXJSZXBvc2l0b3J5IGV4dGVuZHMgSnBhUmVwb3NpdG9yeTxQdXJjaGFzZU9yZGVyLCBMb25nPiB7XG5cbiAgICAvKipcbiAgICAgKiBPbmUgcGFnZSBvZiB0aGUgaW5ib3gsIGlkcyBvbmx5LCBzbyB0aGUgZGF0YWJhc2UgYXBwbGllcyBsaW1pdC9vZmZzZXQgYW5kIHRoZSBzb3J0LiAoUGFnaW5nIGFcbiAgICAgKiB7QGNvZGUgam9pbiBmZXRjaH0gb2YgYSBjb2xsZWN0aW9uIGNhbid0IGJlIGRvbmUgaW4gU1FMOiBIaWJlcm5hdGUgbG9hZGVkIGV2ZXJ5IFBPIGFuZCBwYWdlZCBpblxuICAgICAqIG1lbW9yeSwgSEhIOTAwMDMwMDQuKVxuICAgICAqL1xuICAgIEBRdWVyeShcInNlbGVjdCBwLmlkIGZyb20gUHVyY2hhc2VPcmRlciBwXCIpXG4gICAgUGFnZTxMb25nPiBmaW5kUGFnZUlkcyhQYWdlYWJsZSBwYWdlYWJsZSk7XG5cbiAgICAvKiogVGhlIFBPcyBvZiBvbmUgcGFnZSB3aXRoIHRoZWlyIGxpbmVzLCBpbiBvbmUgcXVlcnkuICovXG4gICAgQFF1ZXJ5KFwic2VsZWN0IGRpc3RpbmN0IHAgZnJvbSBQdXJjaGFzZU9yZGVyIHAgbGVmdCBqb2luIGZldGNoIHAubGluZXMgd2hlcmUgcC5pZCBpbiA6aWRzXCIpXG4gICAgTGlzdDxQdXJjaGFzZU9yZGVyPiBmaW5kQWxsV2l0aExpbmVzKEBQYXJhbShcImlkc1wiKSBDb2xsZWN0aW9uPExvbmc+IGlkcyk7XG5cbiAgICAvKiogRm9yIGNhbGxlcnMgb3V0c2lkZSBhIHRyYW5zYWN0aW9uIChvcGVuLWluLXZpZXcgaXMgb2ZmKTogbG9hZHMgdGhlIGxpbmVzIHRvby4gKi9cbiAgICBARW50aXR5R3JhcGgoYXR0cmlidXRlUGF0aHMgPSBcImxpbmVzXCIpXG4gICAgT3B0aW9uYWw8UHVyY2hhc2VPcmRlcj4gZmluZFdpdGhMaW5lc0J5SWQobG9uZyBpZCk7XG59XG4ifSx7InBhdGgiOiJzcmMvbWFpbi9qYXZhL2NvbS96eWN1cy9wcm9jdXJlbWVudC9wby9JZGVtcG90ZW5jeVJlY29yZFJlcG9zaXRvcnkuamF2YSIsImNvbnRlbnQiOiJwYWNrYWdlIGNvbS56eWN1cy5wcm9jdXJlbWVudC5wbztcblxuaW1wb3J0IGphdmEudXRpbC5PcHRpb25hbDtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuanBhLnJlcG9zaXRvcnkuSnBhUmVwb3NpdG9yeTtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEuanBhLnJlcG9zaXRvcnkuTW9kaWZ5aW5nO1xuaW1wb3J0IG9yZy5zcHJpbmdmcmFtZXdvcmsuZGF0YS5qcGEucmVwb3NpdG9yeS5RdWVyeTtcbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhdGEucmVwb3NpdG9yeS5xdWVyeS5QYXJhbTtcblxucHVibGljIGludGVyZmFjZSBJZGVtcG90ZW5jeVJlY29yZFJlcG9zaXRvcnkgZXh0ZW5kcyBKcGFSZXBvc2l0b3J5PElkZW1wb3RlbmN5UmVjb3JkLCBMb25nPiB7XG5cbiAgICAvKipcbiAgICAgKiBDbGFpbXMgdGhlIGtleSBmb3IgdGhpcyBhcHByb3ZlcjogMSBpZiB0aGlzIHJlcXVlc3Qgb3ducyBpdCwgMCBpZiBhbm90aGVyIHJlcXVlc3QgYWxyZWFkeVxuICAgICAqIGNsYWltZWQgaXQuIFdoaWxlIHRoYXQgb3RoZXIgcmVxdWVzdCBpcyBzdGlsbCBydW5uaW5nLCBQb3N0Z3JlU1FMIG1ha2VzIHRoaXMgaW5zZXJ0IHdhaXQgZm9yXG4gICAgICogaXQsIHNvIGEgZHVwbGljYXRlIG5ldmVyIHJ1bnMgYXQgdGhlIHNhbWUgdGltZSBhcyB0aGUgb3JpZ2luYWwuXG4gICAgICovXG4gICAgQE1vZGlmeWluZ1xuICAgIEBRdWVyeShuYXRpdmVRdWVyeSA9IHRydWUsIHZhbHVlID0gXCJcIlwiXG4gICAgICAgICAgICBpbnNlcnQgaW50byBpZGVtcG90ZW5jeV9yZWNvcmRzIChpZGVtX2tleSwgYXBwcm92ZXJfaWQsIHB1cmNoYXNlX29yZGVyX2lkLCBjcmVhdGVkX2F0KVxuICAgICAgICAgICAgdmFsdWVzICg6a2V5LCA6YXBwcm92ZXJJZCwgOnBvSWQsIG5vdygpKVxuICAgICAgICAgICAgb24gY29uZmxpY3QgKGFwcHJvdmVyX2lkLCBpZGVtX2tleSkgZG8gbm90aGluZ1wiXCJcIilcbiAgICBpbnQgY2xhaW0oQFBhcmFtKFwia2V5XCIpIFN0cmluZyBrZXksIEBQYXJhbShcImFwcHJvdmVySWRcIikgU3RyaW5nIGFwcHJvdmVySWQsIEBQYXJhbShcInBvSWRcIikgbG9uZyBwb0lkKTtcblxuICAgIE9wdGlvbmFsPElkZW1wb3RlbmN5UmVjb3JkPiBmaW5kQnlBcHByb3ZlcklkQW5kS2V5KFN0cmluZyBhcHByb3ZlcklkLCBTdHJpbmcga2V5KTtcbn1cbiJ9LHsicGF0aCI6InNyYy9tYWluL2phdmEvY29tL3p5Y3VzL3Byb2N1cmVtZW50L3BvL1B1cmNoYXNlT3JkZXIuamF2YSIsImNvbnRlbnQiOiJwYWNrYWdlIGNvbS56eWN1cy5wcm9jdXJlbWVudC5wbztcblxuaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuQ2FzY2FkZVR5cGU7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Db2xsZWN0aW9uVGFibGU7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Db2x1bW47XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5FbGVtZW50Q29sbGVjdGlvbjtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkVudGl0eTtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkVudW1UeXBlO1xuaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuRW51bWVyYXRlZDtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkZldGNoVHlwZTtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkdlbmVyYXRlZFZhbHVlO1xuaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuR2VuZXJhdGlvblR5cGU7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5JZDtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkpvaW5Db2x1bW47XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5PbmVUb01hbnk7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5UYWJsZTtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLlZlcnNpb247XG5pbXBvcnQgamF2YS5tYXRoLkJpZ0RlY2ltYWw7XG5pbXBvcnQgamF2YS50aW1lLkluc3RhbnQ7XG5pbXBvcnQgamF2YS51dGlsLkFycmF5TGlzdDtcbmltcG9ydCBqYXZhLnV0aWwuSGFzaFNldDtcbmltcG9ydCBqYXZhLnV0aWwuTGlzdDtcbmltcG9ydCBqYXZhLnV0aWwuU2V0O1xuXG5ARW50aXR5XG5AVGFibGUobmFtZSA9IFwicHVyY2hhc2Vfb3JkZXJzXCIpXG5wdWJsaWMgY2xhc3MgUHVyY2hhc2VPcmRlciB7XG5cbiAgICBASWRcbiAgICBAR2VuZXJhdGVkVmFsdWUoc3RyYXRlZ3kgPSBHZW5lcmF0aW9uVHlwZS5JREVOVElUWSlcbiAgICBwcml2YXRlIExvbmcgaWQ7XG5cbiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UsIHVuaXF1ZSA9IHRydWUpXG4gICAgcHJpdmF0ZSBTdHJpbmcgbnVtYmVyO1xuXG4gICAgQEVudW1lcmF0ZWQoRW51bVR5cGUuU1RSSU5HKVxuICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSlcbiAgICBwcml2YXRlIFBvU3RhdHVzIHN0YXR1cyA9IFBvU3RhdHVzLlBFTkRJTkc7XG5cbiAgICAvKiogVG90YWwgaW4gSU5SLCBzY2FsZSAyLiAqL1xuICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSwgcHJlY2lzaW9uID0gMTQsIHNjYWxlID0gMilcbiAgICBwcml2YXRlIEJpZ0RlY2ltYWwgdG90YWw7XG5cbiAgICAvKiogUE9zIGFib3ZlIOKCuTEwLDAwLDAwMCBuZWVkIHR3byBkaXN0aW5jdCBhcHByb3ZlcnMuICovXG4gICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKVxuICAgIHByaXZhdGUgaW50IGFwcHJvdmFsc1JlcXVpcmVkO1xuXG4gICAgQENvbHVtbihudWxsYWJsZSA9IGZhbHNlKVxuICAgIHByaXZhdGUgaW50IGFwcHJvdmFsc1JlY2VpdmVkO1xuXG4gICAgLyoqXG4gICAgICogV2hvIGFwcHJvdmVkLiBBIGNvdW50ZXIgYWxvbmUgbGV0IG9uZSBwZXJzb24gZ2l2ZSBib3RoIGFwcHJvdmFscyBvZiBhIGhpZ2gtdmFsdWUgUE8uXG4gICAgICogTWlncmF0aW9uOiBjcmVhdGUgdGFibGUgcHVyY2hhc2Vfb3JkZXJfYXBwcm92YWxzIChwdXJjaGFzZV9vcmRlcl9pZCwgYXBwcm92ZXJfaWQsIHByaW1hcnkga2V5IGJvdGgpLlxuICAgICAqL1xuICAgIEBFbGVtZW50Q29sbGVjdGlvblxuICAgIEBDb2xsZWN0aW9uVGFibGUobmFtZSA9IFwicHVyY2hhc2Vfb3JkZXJfYXBwcm92YWxzXCIsIGpvaW5Db2x1bW5zID0gQEpvaW5Db2x1bW4obmFtZSA9IFwicHVyY2hhc2Vfb3JkZXJfaWRcIikpXG4gICAgQENvbHVtbihuYW1lID0gXCJhcHByb3Zlcl9pZFwiLCBudWxsYWJsZSA9IGZhbHNlKVxuICAgIHByaXZhdGUgU2V0PFN0cmluZz4gYXBwcm92ZWRCeSA9IG5ldyBIYXNoU2V0PD4oKTtcblxuICAgIC8qKlxuICAgICAqIE9wdGltaXN0aWMgbG9ja2luZzogd2l0aG91dCBpdCB0d28gYXBwcm92ZXJzIGRlY2lkaW5nIGF0IHRoZSBzYW1lIG1vbWVudCBib3RoIHJlYWQgdGhlIHNhbWVcbiAgICAgKiBzdGF0ZSBhbmQgdGhlIGxhc3Qgd3JpdGUgd2lucyAoYW4gYXBwcm92YWwgbG9zdCwgb3IgYXBwcm92ZWQgdHdpY2UgYW5kIGJ1ZGdldCByZXNlcnZlZCB0d2ljZSkuXG4gICAgICogVGhlIGxvc2VyIGdldHMgYW4gT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uLCBtYXBwZWQgdG8gNDA5LiBNaWdyYXRpb246IGFkZCBjb2x1bW5cbiAgICAgKiB2ZXJzaW9uIGJpZ2ludCBub3QgbnVsbCBkZWZhdWx0IDAuXG4gICAgICovXG4gICAgQFZlcnNpb25cbiAgICBwcml2YXRlIGxvbmcgdmVyc2lvbjtcblxuICAgIHByaXZhdGUgU3RyaW5nIHJlamVjdGlvblJlYXNvbjtcblxuICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSlcbiAgICBwcml2YXRlIEluc3RhbnQgY3JlYXRlZEF0ID0gSW5zdGFudC5ub3coKTtcblxuICAgIEBPbmVUb01hbnkobWFwcGVkQnkgPSBcInB1cmNoYXNlT3JkZXJcIiwgY2FzY2FkZSA9IENhc2NhZGVUeXBlLkFMTCwgb3JwaGFuUmVtb3ZhbCA9IHRydWUsIGZldGNoID0gRmV0Y2hUeXBlLkxBWlkpXG4gICAgcHJpdmF0ZSBMaXN0PFB1cmNoYXNlT3JkZXJMaW5lPiBsaW5lcyA9IG5ldyBBcnJheUxpc3Q8PigpO1xuXG4gICAgcHJvdGVjdGVkIFB1cmNoYXNlT3JkZXIoKSB7XG4gICAgfVxuXG4gICAgcHVibGljIFB1cmNoYXNlT3JkZXIoU3RyaW5nIG51bWJlciwgQmlnRGVjaW1hbCB0b3RhbCkge1xuICAgICAgICB0aGlzLm51bWJlciA9IG51bWJlcjtcbiAgICAgICAgdGhpcy50b3RhbCA9IHRvdGFsO1xuICAgICAgICB0aGlzLmFwcHJvdmFsc1JlcXVpcmVkID0gdG90YWwuY29tcGFyZVRvKG5ldyBCaWdEZWNpbWFsKFwiMTAwMDAwMC4wMFwiKSkgPiAwID8gMiA6IDE7XG4gICAgfVxuXG4gICAgcHVibGljIHZvaWQgcmVjb3JkQXBwcm92YWwoU3RyaW5nIGFwcHJvdmVySWQpIHtcbiAgICAgICAgaWYgKHN0YXR1cyAhPSBQb1N0YXR1cy5QRU5ESU5HKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgSWxsZWdhbFN0YXRlRXhjZXB0aW9uKFwiUE8gXCIgKyBudW1iZXIgKyBcIiBpcyBcIiArIHN0YXR1cyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhcHByb3ZlZEJ5LmFkZChhcHByb3ZlcklkKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IElsbGVnYWxTdGF0ZUV4Y2VwdGlvbihhcHByb3ZlcklkICsgXCIgaGFzIGFscmVhZHkgYXBwcm92ZWQgUE8gXCIgKyBudW1iZXIpO1xuICAgICAgICB9XG4gICAgICAgIGFwcHJvdmFsc1JlY2VpdmVkID0gYXBwcm92ZWRCeS5zaXplKCk7XG4gICAgICAgIGlmIChhcHByb3ZhbHNSZWNlaXZlZCA+PSBhcHByb3ZhbHNSZXF1aXJlZCkge1xuICAgICAgICAgICAgc3RhdHVzID0gUG9TdGF0dXMuQVBQUk9WRUQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgdm9pZCByZWplY3QoU3RyaW5nIHJlYXNvbikge1xuICAgICAgICBpZiAoc3RhdHVzICE9IFBvU3RhdHVzLlBFTkRJTkcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBJbGxlZ2FsU3RhdGVFeGNlcHRpb24oXCJQTyBcIiArIG51bWJlciArIFwiIGlzIFwiICsgc3RhdHVzKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0dXMgPSBQb1N0YXR1cy5SRUpFQ1RFRDtcbiAgICAgICAgcmVqZWN0aW9uUmVhc29uID0gcmVhc29uO1xuICAgIH1cblxuICAgIHB1YmxpYyB2b2lkIGFkZExpbmUoUHVyY2hhc2VPcmRlckxpbmUgbGluZSkge1xuICAgICAgICBsaW5lcy5hZGQobGluZSk7XG4gICAgICAgIGxpbmUuc2V0UHVyY2hhc2VPcmRlcih0aGlzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgTG9uZyBnZXRJZCgpIHtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIHB1YmxpYyBTdHJpbmcgZ2V0TnVtYmVyKCkge1xuICAgICAgICByZXR1cm4gbnVtYmVyO1xuICAgIH1cblxuICAgIHB1YmxpYyBQb1N0YXR1cyBnZXRTdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfVxuXG4gICAgcHVibGljIEJpZ0RlY2ltYWwgZ2V0VG90YWwoKSB7XG4gICAgICAgIHJldHVybiB0b3RhbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW50IGdldEFwcHJvdmFsc1JlcXVpcmVkKCkge1xuICAgICAgICByZXR1cm4gYXBwcm92YWxzUmVxdWlyZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGludCBnZXRBcHByb3ZhbHNSZWNlaXZlZCgpIHtcbiAgICAgICAgcmV0dXJuIGFwcHJvdmFsc1JlY2VpdmVkO1xuICAgIH1cblxuICAgIHB1YmxpYyBTdHJpbmcgZ2V0UmVqZWN0aW9uUmVhc29uKCkge1xuICAgICAgICByZXR1cm4gcmVqZWN0aW9uUmVhc29uO1xuICAgIH1cblxuICAgIHB1YmxpYyBJbnN0YW50IGdldENyZWF0ZWRBdCgpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZWRBdDtcbiAgICB9XG5cbiAgICBwdWJsaWMgTGlzdDxQdXJjaGFzZU9yZGVyTGluZT4gZ2V0TGluZXMoKSB7XG4gICAgICAgIHJldHVybiBsaW5lcztcbiAgICB9XG59XG4ifSx7InBhdGgiOiJzcmMvbWFpbi9qYXZhL2NvbS96eWN1cy9wcm9jdXJlbWVudC9wby9JZGVtcG90ZW5jeVJlY29yZC5qYXZhIiwiY29udGVudCI6InBhY2thZ2UgY29tLnp5Y3VzLnByb2N1cmVtZW50LnBvO1xuXG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5Db2x1bW47XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5FbnRpdHk7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5HZW5lcmF0ZWRWYWx1ZTtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLkdlbmVyYXRpb25UeXBlO1xuaW1wb3J0IGpha2FydGEucGVyc2lzdGVuY2UuSWQ7XG5pbXBvcnQgamFrYXJ0YS5wZXJzaXN0ZW5jZS5UYWJsZTtcbmltcG9ydCBqYWthcnRhLnBlcnNpc3RlbmNlLlVuaXF1ZUNvbnN0cmFpbnQ7XG5pbXBvcnQgamF2YS50aW1lLkluc3RhbnQ7XG5cbi8qKlxuICogUmVtZW1iZXJzIHdoaWNoIFBPIGFuIElkZW1wb3RlbmN5LUtleSB3YXMgdXNlZCBmb3IsIHNvIGEgcmV0cnkgKHRoZSBtb2JpbGUgYXBwIHJldHJpZXMgb25cbiAqIHRpbWVvdXRzKSByZXBsYXlzIHRoZSByZXN1bHQgaW5zdGVhZCBvZiBhcHByb3ZpbmcgdHdpY2UuXG4gKlxuICogPHA+S2V5cyBhcmUgZ2VuZXJhdGVkIGJ5IHRoZSBjbGllbnQgYW5kIGFyZSBvbmx5IHVuaXF1ZSBwZXIgdXNlciwgc28gdGhlIHVuaXF1ZSBjb25zdHJhaW50IGlzXG4gKiAoYXBwcm92ZXJfaWQsIGlkZW1fa2V5KS4gSXQgaXMgd2hhdCBtYWtlcyB7QGxpbmsgSWRlbXBvdGVuY3lSZWNvcmRSZXBvc2l0b3J5I2NsYWltfSBhdG9taWMuXG4gKiBNaWdyYXRpb246IHtAY29kZSBjcmVhdGUgdW5pcXVlIGluZGV4IHVrX2lkZW1wb3RlbmN5X2FwcHJvdmVyX2tleSBvbiBpZGVtcG90ZW5jeV9yZWNvcmRzXG4gKiAoYXBwcm92ZXJfaWQsIGlkZW1fa2V5KX0gYW5kIHtAY29kZSBhbHRlciB0YWJsZSBpZGVtcG90ZW5jeV9yZWNvcmRzIGRyb3AgY29sdW1uIHJlc3BvbnNlX3N0YXR1c31cbiAqIChyZXBsYXlzIHJldHVybiB0aGUgUE8ncyBjdXJyZW50IHN0YXRlKS5cbiAqL1xuQEVudGl0eVxuQFRhYmxlKG5hbWUgPSBcImlkZW1wb3RlbmN5X3JlY29yZHNcIixcbiAgICAgICB1bmlxdWVDb25zdHJhaW50cyA9IEBVbmlxdWVDb25zdHJhaW50KG5hbWUgPSBcInVrX2lkZW1wb3RlbmN5X2FwcHJvdmVyX2tleVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uTmFtZXMgPSB7XCJhcHByb3Zlcl9pZFwiLCBcImlkZW1fa2V5XCJ9KSlcbnB1YmxpYyBjbGFzcyBJZGVtcG90ZW5jeVJlY29yZCB7XG5cbiAgICBASWRcbiAgICBAR2VuZXJhdGVkVmFsdWUoc3RyYXRlZ3kgPSBHZW5lcmF0aW9uVHlwZS5JREVOVElUWSlcbiAgICBwcml2YXRlIExvbmcgaWQ7XG5cbiAgICBAQ29sdW1uKG5hbWUgPSBcImlkZW1fa2V5XCIsIG51bGxhYmxlID0gZmFsc2UpXG4gICAgcHJpdmF0ZSBTdHJpbmcga2V5O1xuXG4gICAgQENvbHVtbihuYW1lID0gXCJhcHByb3Zlcl9pZFwiLCBudWxsYWJsZSA9IGZhbHNlKVxuICAgIHByaXZhdGUgU3RyaW5nIGFwcHJvdmVySWQ7XG5cbiAgICBAQ29sdW1uKG51bGxhYmxlID0gZmFsc2UpXG4gICAgcHJpdmF0ZSBsb25nIHB1cmNoYXNlT3JkZXJJZDtcblxuICAgIEBDb2x1bW4obnVsbGFibGUgPSBmYWxzZSlcbiAgICBwcml2YXRlIEluc3RhbnQgY3JlYXRlZEF0ID0gSW5zdGFudC5ub3coKTtcblxuICAgIHByb3RlY3RlZCBJZGVtcG90ZW5jeVJlY29yZCgpIHtcbiAgICB9XG5cbiAgICBwdWJsaWMgU3RyaW5nIGdldEtleSgpIHtcbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG5cbiAgICBwdWJsaWMgU3RyaW5nIGdldEFwcHJvdmVySWQoKSB7XG4gICAgICAgIHJldHVybiBhcHByb3ZlcklkO1xuICAgIH1cblxuICAgIHB1YmxpYyBsb25nIGdldFB1cmNoYXNlT3JkZXJJZCgpIHtcbiAgICAgICAgcmV0dXJuIHB1cmNoYXNlT3JkZXJJZDtcbiAgICB9XG59XG4ifSx7InBhdGgiOiJzcmMvbWFpbi9qYXZhL2NvbS96eWN1cy9wcm9jdXJlbWVudC9wby9BcGlFeGNlcHRpb25IYW5kbGVyLmphdmEiLCJjb250ZW50IjoicGFja2FnZSBjb20uenljdXMucHJvY3VyZW1lbnQucG87XG5cbmltcG9ydCBvcmcuc3ByaW5nZnJhbWV3b3JrLmRhby5PcHRpbWlzdGljTG9ja2luZ0ZhaWx1cmVFeGNlcHRpb247XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5odHRwLkh0dHBTdGF0dXM7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay5odHRwLlByb2JsZW1EZXRhaWw7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLkV4Y2VwdGlvbkhhbmRsZXI7XG5pbXBvcnQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuYmluZC5hbm5vdGF0aW9uLlJlc3RDb250cm9sbGVyQWR2aWNlO1xuXG5AUmVzdENvbnRyb2xsZXJBZHZpY2VcbnB1YmxpYyBjbGFzcyBBcGlFeGNlcHRpb25IYW5kbGVyIHtcblxuICAgIEBFeGNlcHRpb25IYW5kbGVyKFBvTm90Rm91bmRFeGNlcHRpb24uY2xhc3MpXG4gICAgcHVibGljIFByb2JsZW1EZXRhaWwgbm90Rm91bmQoUG9Ob3RGb3VuZEV4Y2VwdGlvbiBlKSB7XG4gICAgICAgIHJldHVybiBQcm9ibGVtRGV0YWlsLmZvclN0YXR1c0FuZERldGFpbChIdHRwU3RhdHVzLk5PVF9GT1VORCwgZS5nZXRNZXNzYWdlKCkpO1xuICAgIH1cblxuICAgIEBFeGNlcHRpb25IYW5kbGVyKElsbGVnYWxTdGF0ZUV4Y2VwdGlvbi5jbGFzcylcbiAgICBwdWJsaWMgUHJvYmxlbURldGFpbCBjb25mbGljdChJbGxlZ2FsU3RhdGVFeGNlcHRpb24gZSkge1xuICAgICAgICByZXR1cm4gUHJvYmxlbURldGFpbC5mb3JTdGF0dXNBbmREZXRhaWwoSHR0cFN0YXR1cy5DT05GTElDVCwgZS5nZXRNZXNzYWdlKCkpO1xuICAgIH1cblxuICAgIC8qKiBTb21lb25lIGVsc2UgY2hhbmdlZCB0aGUgUE8gc2luY2UgaXQgd2FzIHJlYWQgKEBWZXJzaW9uKTogdGhlIGFwcCByZWZyZXNoZXMgYW5kIGFza3MgYWdhaW4uICovXG4gICAgQEV4Y2VwdGlvbkhhbmRsZXIoT3B0aW1pc3RpY0xvY2tpbmdGYWlsdXJlRXhjZXB0aW9uLmNsYXNzKVxuICAgIHB1YmxpYyBQcm9ibGVtRGV0YWlsIHN0YWxlVXBkYXRlKE9wdGltaXN0aWNMb2NraW5nRmFpbHVyZUV4Y2VwdGlvbiBlKSB7XG4gICAgICAgIHJldHVybiBQcm9ibGVtRGV0YWlsLmZvclN0YXR1c0FuZERldGFpbChIdHRwU3RhdHVzLkNPTkZMSUNULFxuICAgICAgICAgICAgICAgIFwiVGhlIHB1cmNoYXNlIG9yZGVyIHdhcyBjaGFuZ2VkIGJ5IHNvbWVvbmUgZWxzZS4gUmVmcmVzaCBhbmQgdHJ5IGFnYWluLlwiKTtcbiAgICB9XG5cbiAgICBARXhjZXB0aW9uSGFuZGxlcihBcHByb3ZhbFNlcnZpY2UuSWRlbXBvdGVuY3lLZXlSZXVzZWRFeGNlcHRpb24uY2xhc3MpXG4gICAgcHVibGljIFByb2JsZW1EZXRhaWwga2V5UmV1c2VkKEFwcHJvdmFsU2VydmljZS5JZGVtcG90ZW5jeUtleVJldXNlZEV4Y2VwdGlvbiBlKSB7XG4gICAgICAgIHJldHVybiBQcm9ibGVtRGV0YWlsLmZvclN0YXR1c0FuZERldGFpbChIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZLCBlLmdldE1lc3NhZ2UoKSk7XG4gICAgfVxuXG4gICAgQEV4Y2VwdGlvbkhhbmRsZXIoQnVkZ2V0RXhjZWVkZWRFeGNlcHRpb24uY2xhc3MpXG4gICAgcHVibGljIFByb2JsZW1EZXRhaWwgYnVkZ2V0KEJ1ZGdldEV4Y2VlZGVkRXhjZXB0aW9uIGUpIHtcbiAgICAgICAgcmV0dXJuIFByb2JsZW1EZXRhaWwuZm9yU3RhdHVzQW5kRGV0YWlsKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFksIGUuZ2V0TWVzc2FnZSgpKTtcbiAgICB9XG5cbiAgICBARXhjZXB0aW9uSGFuZGxlcihJbGxlZ2FsQXJndW1lbnRFeGNlcHRpb24uY2xhc3MpXG4gICAgcHVibGljIFByb2JsZW1EZXRhaWwgYmFkUmVxdWVzdChJbGxlZ2FsQXJndW1lbnRFeGNlcHRpb24gZSkge1xuICAgICAgICByZXR1cm4gUHJvYmxlbURldGFpbC5mb3JTdGF0dXNBbmREZXRhaWwoSHR0cFN0YXR1cy5CQURfUkVRVUVTVCwgZS5nZXRNZXNzYWdlKCkpO1xuICAgIH1cbn1cbiJ9XQ==', 'base64'), 'UTF8'))::jsonb
  ) on conflict (question_id) do update set notes_md = excluded.notes_md, files = excluded.files;
  if v_installed is null then
    raise notice 'Question "spring-po-approvals": installed (version 3)';
  else
    raise notice 'Question "spring-po-approvals": updated from version % to 3', v_installed;
  end if;
end
$question$;

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- Question "Supplier Invoice Builder: autosave, identity and input state (React web)". Safe to re-run: what is already installed and up to date is left untouched.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Question: web-invoice-builder (version 3)
do $question$
declare
  v_installed int;
begin
  select version into v_installed from public.questions where id = 'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13';
  if v_installed >= 3 then
    raise notice 'Question "web-invoice-builder": version % installed, left unchanged', v_installed;
    return;
  end if;
  insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status, version) values (
    'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'web-invoice-builder', 'Supplier Invoice Builder: autosave, identity and input state (React web)', 'Front-end debugging', array['lead-react-native-developer', 'react-developer', 'front-end-developer']::text[], array['react', 'typescript', 'hooks', 'closures', 'debounce', 'state-management', 'forms', 'intl']::text[], 'hard', 30,
    convert_from(decode('IyMgU3VwcGxpZXIgSW52b2ljZSBCdWlsZGVyOiB0aGUgZHJhZnQgdGhhdCB3b24ndCBiZWhhdmUKClN1cHBsaWVycyB1c2UgdGhpcyAqKlJlYWN0ICh3ZWIpKiogc2NyZWVuIG9mIHRoZSBaeWN1cyBzdXBwbGllciBwb3J0YWwgdG8gcmFpc2UgYW4gaW52b2ljZSBhZ2FpbnN0CmEgUE8uIFRoZXkgc2VhcmNoIGZvciB0aGUgUE8sIGltcG9ydCBpdHMgbGluZXMsIGFkanVzdCBxdWFudGl0aWVzIGFuZCBwcmljZXMsIGFuZCBzdWJtaXQuIERyYWZ0cwoqKmF1dG9zYXZlIDAuOCBzIGFmdGVyIHRoZSBsYXN0IGNoYW5nZSoqLiBNb25leSBpcyBoZWxkIGluICoqcGFpc2UqKiAoaW50ZWdlcnMpLgoKIyMjIEJ1ZyByZXBvcnRzCgoxLiAqKiJBdXRvc2F2ZSBzYXZlZCBhbiBvbGQgdmVyc2lvbi4iKiogVGhlIHNhdmVkIGRyYWZ0IGlzIHRoZSBvbmUgZnJvbSB3aGVuIHRoZSBwYWdlIG9wZW5lZDogbm8KICAgUE8gYW5kIG5vIGxpbmVzLiBRdWFudGl0eSBlZGl0cyBhcmVuJ3QgYXV0b3NhdmVkIGF0IGFsbC4KMi4gKioiTXkgc3VibWl0dGVkIGludm9pY2Ugd2VudCBiYWNrIHRvIERyYWZ0LiIqKiBBbiBhdXRvc2F2ZSBsYW5kcyBhZnRlciAqU3VibWl0KiBhbmQgdGhlIHNlcnZlcgogICByZW9wZW5zIHRoZSBpbnZvaWNlLiBDbG9zaW5nIHRoZSBidWlsZGVyIHdpdGggcmVjZW50IGVkaXRzIGFsc28gc2F2ZXMgYWZ0ZXJ3YXJkcywgd2hpbGUgdGhlCiAgIHN1cHBsaWVyIGlzIGFscmVhZHkgb24gYW5vdGhlciBzY3JlZW4uCjMuICoqIlBPIHNlYXJjaCBoYW1tZXJzIHRoZSBBUEkuIioqIFR5cGluZyAqUE8tMjAyNi0wMDQyKiBzZW5kcyBhIHJlcXVlc3QgZm9yIGV2ZXJ5IGtleXN0cm9rZQogICBpbnN0ZWFkIG9mIG9uZSB3aGVuIHRoZSB0eXBpbmcgcGF1c2VzLgo0LiAqKiJFZGl0aW5nIG9uZSBsaW5lIGNoYW5nZXMgYW5vdGhlciwgYW5kIFJlbW92ZSBkZWxldGVzIGV2ZXJ5IGxpbmUuIioqIFRoaXMgaGFwcGVucyBhZnRlcgogICBpbXBvcnRpbmcgYSBQTydzIGxpbmVzIG9yIGNsaWNraW5nICpBZGQgbGluZSogcXVpY2tseS4gVGhlIGNvbnNvbGUgc2hvd3MgKkVuY291bnRlcmVkIHR3bwogICBjaGlsZHJlbiB3aXRoIHRoZSBzYW1lIGtleSouCjUuICoqIlRoZSB0b3RhbCBkb2Vzbid0IGNoYW5nZSB3aGVuIEkgZWRpdCBhIHF1YW50aXR5LCBhbmQgVW5kbyBkb2VzIG5vdGhpbmcuIioqCjYuICoqIkkgY2FuJ3QgdHlwZSDigrkxMi41MC4iKiogVGhlIGRlY2ltYWwgcG9pbnQgZGlzYXBwZWFycyBhcyBzb29uIGFzIGl0J3MgdHlwZWQsIGNsZWFyaW5nIHRoZQogICBmaWVsZCBwdXRzIGEgMCBiYWNrLCBhbmQgcGFzdGluZyAqMSwyNTAuNTAqIG1ha2VzIHRoZSBwcmljZSDigrkxLjAwLgo3LiAqKiJJbnZvaWNlcyByYWlzZWQganVzdCBhZnRlciBtaWRuaWdodCBhcmUgZGF0ZWQgeWVzdGVyZGF5LiIqKiBBbiBpbnZvaWNlIGNyZWF0ZWQgYXQgMDA6MzAgSVNUCiAgIG9uIDEgTWF5IGlzIGRhdGVkIDMwIEFwcmlsLCBzbyBpdCBmYWxscyBpbnRvIHRoZSBwcmV2aW91cyBtb250aCdzIEdTVCByZXR1cm4uCgojIyMgV2hhdCB0byBkbwoKLSBGaXggdGhlICoqcm9vdCBjYXVzZXMqKiBpbiBgc3JjL2AuIEtlZXAgdGhlIHB1YmxpYyBwcm9wcywgdGhlIGBkYXRhLXRlc3RpZGBzIGFuZCB0aGUgaG9vaydzCiAgc2lnbmF0dXJlLgotIGBfX3Rlc3RzX18vYCBpcyAqKnJlYWQtb25seSoqIGFuZCBkZXNjcmliZXMgdGhlIGV4cGVjdGVkIGJlaGF2aW91ci4gVXNlICoqUnVuIHRlc3RzKiogKHRoZXkgdXNlCiAgZmFrZSB0aW1lcnMpLgotIERvbid0IHNwZWNpYWwtY2FzZSB0aGUgdGVzdHM6IHJldmlld2VycyByZWFkIHlvdXIgY2hhbmdlcyBhbmQgcnVuIG1vcmUgdGVzdHMuCi0gVGhlIHRlc3RzIHJlbmRlciB3aXRob3V0IGEgYnJvd3NlciBET00gKG5vIGBkb2N1bWVudGApLCBhbmQgaW5wdXRzIGFyZSByZWFkIHRocm91Z2ggdGhlaXIKICBgdmFsdWVgIHByb3AsIHNvIGtlZXAgdGhlbSBjb250cm9sbGVkIChgdmFsdWVgICsgYG9uQ2hhbmdlYCkuCgoqVGltZSBndWlkZTogYWJvdXQgMzAgbWludXRlcy4qCg==', 'base64'), 'UTF8'),
    false, 'published', 3
  ) on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, category = excluded.category,
    role_tags = excluded.role_tags, skill_tags = excluded.skill_tags, difficulty = excluded.difficulty,
    time_suggestion_minutes = excluded.time_suggestion_minutes, statement_md = excluded.statement_md,
    is_sample = excluded.is_sample, status = excluded.status, version = excluded.version;
  delete from public.question_files where question_id = 'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13' and path <> all (array['src/InvoiceBuilder.tsx', 'src/components/PoPicker.tsx', 'src/components/LineRow.tsx', 'src/components/MoneyInput.tsx', 'src/hooks/useDebouncedCallback.ts', 'src/state/invoiceReducer.ts', 'src/utils/money.ts', 'src/utils/dates.ts', 'src/utils/debounce.ts', 'src/types.ts', '__tests__/autosave.test.tsx', '__tests__/PoPicker.test.tsx', '__tests__/lines.test.tsx', '__tests__/MoneyInput.test.tsx', '__tests__/dates.test.tsx', '__tests__/support/fakeApi.tsx', 'package.json']::text[]);
  insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/InvoiceBuilder.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWR1Y2VyLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgTGluZVJvdyB9IGZyb20gJy4vY29tcG9uZW50cy9MaW5lUm93JzsKaW1wb3J0IHsgUG9QaWNrZXIgfSBmcm9tICcuL2NvbXBvbmVudHMvUG9QaWNrZXInOwppbXBvcnQgeyB1c2VEZWJvdW5jZWRDYWxsYmFjayB9IGZyb20gJy4vaG9va3MvdXNlRGVib3VuY2VkQ2FsbGJhY2snOwppbXBvcnQgeyBpbml0aWFsU3RhdGUsIGludm9pY2VSZWR1Y2VyLCB0b3RhbHMgfSBmcm9tICcuL3N0YXRlL2ludm9pY2VSZWR1Y2VyJzsKaW1wb3J0IHR5cGUgeyBJbnZvaWNlQXBpLCBJbnZvaWNlRHJhZnQsIFBvU3VtbWFyeSB9IGZyb20gJy4vdHlwZXMnOwppbXBvcnQgeyB0b2RheUluSW5kaWEgfSBmcm9tICcuL3V0aWxzL2RhdGVzJzsKaW1wb3J0IHsgZm9ybWF0UGFpc2UgfSBmcm9tICcuL3V0aWxzL21vbmV5JzsKCmV4cG9ydCBjb25zdCBBVVRPU0FWRV9NUyA9IDgwMDsKCmV4cG9ydCBmdW5jdGlvbiBJbnZvaWNlQnVpbGRlcih7IGFwaSB9OiB7IGFwaTogSW52b2ljZUFwaSB9KSB7CiAgY29uc3QgW3N0YXRlLCBkaXNwYXRjaF0gPSB1c2VSZWR1Y2VyKGludm9pY2VSZWR1Y2VyLCBpbml0aWFsU3RhdGUpOwogIGNvbnN0IFtwbywgc2V0UG9dID0gdXNlU3RhdGU8UG9TdW1tYXJ5IHwgbnVsbD4obnVsbCk7CiAgY29uc3QgW2ludm9pY2VEYXRlXSA9IHVzZVN0YXRlKCgpID0+IHRvZGF5SW5JbmRpYSgpKTsKICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGU8J2RyYWZ0JyB8ICdzdWJtaXR0aW5nJyB8ICdzdWJtaXR0ZWQnPignZHJhZnQnKTsKCiAgY29uc3QgZHJhZnQ6IEludm9pY2VEcmFmdCA9IHsgcG9JZDogcG8/LmlkID8/IG51bGwsIGludm9pY2VEYXRlLCBsaW5lczogc3RhdGUubGluZXMgfTsKCiAgLy8gQXV0b3NhdmUgMC44IHMgYWZ0ZXIgdGhlIGxhc3QgY2hhbmdlLgogIGNvbnN0IGF1dG9zYXZlID0gdXNlRGVib3VuY2VkQ2FsbGJhY2soKCkgPT4gewogICAgdm9pZCBhcGkuc2F2ZURyYWZ0KGRyYWZ0KTsKICB9LCBBVVRPU0FWRV9NUyk7CgogIHVzZUVmZmVjdCgoKSA9PiB7CiAgICBpZiAocG8pIGF1dG9zYXZlKCk7CiAgfSwgW3BvLCBzdGF0ZS5saW5lcywgYXV0b3NhdmVdKTsKCiAgY29uc3Qgc3VtcyA9IHVzZU1lbW8oKCkgPT4gdG90YWxzKHN0YXRlLmxpbmVzKSwgW3N0YXRlLmxpbmVzXSk7CgogIGFzeW5jIGZ1bmN0aW9uIGNob29zZVBvKG5leHQ6IFBvU3VtbWFyeSkgewogICAgc2V0UG8obmV4dCk7CiAgICBkaXNwYXRjaCh7IHR5cGU6ICdpbXBvcnRQb0xpbmVzJywgbGluZXM6IGF3YWl0IGFwaS5nZXRQb0xpbmVzKG5leHQuaWQpIH0pOwogIH0KCiAgYXN5bmMgZnVuY3Rpb24gc3VibWl0KCkgewogICAgc2V0U3RhdHVzKCdzdWJtaXR0aW5nJyk7CiAgICBhd2FpdCBhcGkuc3VibWl0KGRyYWZ0KTsKICAgIHNldFN0YXR1cygnc3VibWl0dGVkJyk7CiAgfQoKICByZXR1cm4gKAogICAgPGZvcm0KICAgICAgZGF0YS10ZXN0aWQ9Imludm9pY2UiCiAgICAgIG9uU3VibWl0PXsoZSkgPT4gewogICAgICAgIGUucHJldmVudERlZmF1bHQoKTsKICAgICAgICB2b2lkIHN1Ym1pdCgpOwogICAgICB9fQogICAgPgogICAgICA8UG9QaWNrZXIgYXBpPXthcGl9IG9uU2VsZWN0PXtjaG9vc2VQb30gLz4KICAgICAgPHA+CiAgICAgICAgSW52b2ljZSBkYXRlOiA8c3BhbiBkYXRhLXRlc3RpZD0iaW52b2ljZS1kYXRlIj57aW52b2ljZURhdGV9PC9zcGFuPgogICAgICA8L3A+CiAgICAgIDxmaWVsZHNldCBkaXNhYmxlZD17c3RhdHVzICE9PSAnZHJhZnQnfT4KICAgICAgICB7c3RhdGUubGluZXMubWFwKChsaW5lLCBpKSA9PiAoCiAgICAgICAgICA8TGluZVJvdwogICAgICAgICAgICBrZXk9e2xpbmUuaWR9CiAgICAgICAgICAgIHBvc2l0aW9uPXtpICsgMX0KICAgICAgICAgICAgbGluZT17bGluZX0KICAgICAgICAgICAgb25DaGFuZ2U9eyhwYXRjaCkgPT4gZGlzcGF0Y2goeyB0eXBlOiAndXBkYXRlTGluZScsIGlkOiBsaW5lLmlkLCBwYXRjaCB9KX0KICAgICAgICAgICAgb25SZW1vdmU9eygpID0+IGRpc3BhdGNoKHsgdHlwZTogJ3JlbW92ZUxpbmUnLCBpZDogbGluZS5pZCB9KX0KICAgICAgICAgIC8+CiAgICAgICAgKSl9CiAgICAgICAgPGJ1dHRvbiB0eXBlPSJidXR0b24iIGRhdGEtdGVzdGlkPSJhZGQtbGluZSIgb25DbGljaz17KCkgPT4gZGlzcGF0Y2goeyB0eXBlOiAnYWRkTGluZScgfSl9PgogICAgICAgICAgQWRkIGxpbmUKICAgICAgICA8L2J1dHRvbj4KICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgZGF0YS10ZXN0aWQ9InVuZG8iIGRpc2FibGVkPXtzdGF0ZS5wYXN0Lmxlbmd0aCA9PT0gMH0gb25DbGljaz17KCkgPT4gZGlzcGF0Y2goeyB0eXBlOiAndW5kbycgfSl9PgogICAgICAgICAgVW5kbwogICAgICAgIDwvYnV0dG9uPgogICAgICA8L2ZpZWxkc2V0PgogICAgICA8ZGw+CiAgICAgICAgPGR0Pk5ldDwvZHQ+CiAgICAgICAgPGRkIGRhdGEtdGVzdGlkPSJ0b3RhbC1uZXQiPntmb3JtYXRQYWlzZShzdW1zLm5ldCl9PC9kZD4KICAgICAgICA8ZHQ+R1NUPC9kdD4KICAgICAgICA8ZGQgZGF0YS10ZXN0aWQ9InRvdGFsLXRheCI+e2Zvcm1hdFBhaXNlKHN1bXMudGF4KX08L2RkPgogICAgICAgIDxkdD5Ub3RhbDwvZHQ+CiAgICAgICAgPGRkIGRhdGEtdGVzdGlkPSJ0b3RhbC1ncm9zcyI+e2Zvcm1hdFBhaXNlKHN1bXMuZ3Jvc3MpfTwvZGQ+CiAgICAgIDwvZGw+CiAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBkYXRhLXRlc3RpZD0ic3VibWl0IiBkaXNhYmxlZD17c3RhdHVzICE9PSAnZHJhZnQnIHx8ICFwb30+CiAgICAgICAge3N0YXR1cyA9PT0gJ3N1Ym1pdHRlZCcgPyAnU3VibWl0dGVkJyA6ICdTdWJtaXQgaW52b2ljZSd9CiAgICAgIDwvYnV0dG9uPgogICAgPC9mb3JtPgogICk7Cn0K', 'base64'), 'UTF8'), false, 0),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/components/PoPicker.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlTWVtbywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7CmltcG9ydCB0eXBlIHsgSW52b2ljZUFwaSwgUG9TdW1tYXJ5IH0gZnJvbSAnLi4vdHlwZXMnOwppbXBvcnQgeyBkZWJvdW5jZSB9IGZyb20gJy4uL3V0aWxzL2RlYm91bmNlJzsKCmV4cG9ydCBjb25zdCBTRUFSQ0hfREVCT1VOQ0VfTVMgPSAzMDA7CgppbnRlcmZhY2UgUHJvcHMgewogIGFwaTogSW52b2ljZUFwaTsKICBvblNlbGVjdChwbzogUG9TdW1tYXJ5KTogdm9pZDsKfQoKLyoqIFR5cGVhaGVhZDogc2VhcmNoZXMgUE9zIGJ5IG51bWJlciBvciBidXllciBvbmNlIHRoZSBzdXBwbGllciBwYXVzZXMgdHlwaW5nLiAqLwpleHBvcnQgZnVuY3Rpb24gUG9QaWNrZXIoeyBhcGksIG9uU2VsZWN0IH06IFByb3BzKSB7CiAgY29uc3QgW3F1ZXJ5LCBzZXRRdWVyeV0gPSB1c2VTdGF0ZSgnJyk7CiAgY29uc3QgW3Jlc3VsdHMsIHNldFJlc3VsdHNdID0gdXNlU3RhdGU8UG9TdW1tYXJ5W10+KFtdKTsKCiAgY29uc3Qgc2VhcmNoID0gKHE6IHN0cmluZykgPT4gewogICAgaWYgKHEudHJpbSgpLmxlbmd0aCA8IDIpIHsKICAgICAgc2V0UmVzdWx0cyhbXSk7CiAgICAgIHJldHVybjsKICAgIH0KICAgIHZvaWQgYXBpLnNlYXJjaFBvcyhxLnRyaW0oKSkudGhlbihzZXRSZXN1bHRzKTsKICB9OwogIGNvbnN0IGRlYm91bmNlZFNlYXJjaCA9IHVzZU1lbW8oKCkgPT4gZGVib3VuY2Uoc2VhcmNoLCBTRUFSQ0hfREVCT1VOQ0VfTVMpLCBbc2VhcmNoXSk7CgogIHJldHVybiAoCiAgICA8ZGl2IGNsYXNzTmFtZT0icG8tcGlja2VyIj4KICAgICAgPGlucHV0CiAgICAgICAgZGF0YS10ZXN0aWQ9InBvLXNlYXJjaCIKICAgICAgICBhcmlhLWxhYmVsPSJQdXJjaGFzZSBvcmRlciIKICAgICAgICBwbGFjZWhvbGRlcj0iU2VhcmNoIFBPIG51bWJlciBvciBidXllciIKICAgICAgICB2YWx1ZT17cXVlcnl9CiAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7CiAgICAgICAgICBzZXRRdWVyeShlLnRhcmdldC52YWx1ZSk7CiAgICAgICAgICBkZWJvdW5jZWRTZWFyY2goZS50YXJnZXQudmFsdWUpOwogICAgICAgIH19CiAgICAgIC8+CiAgICAgIDx1bCByb2xlPSJsaXN0Ym94Ij4KICAgICAgICB7cmVzdWx0cy5tYXAoKHBvKSA9PiAoCiAgICAgICAgICA8bGkga2V5PXtwby5pZH0gcm9sZT0ib3B0aW9uIiBhcmlhLXNlbGVjdGVkPXtmYWxzZX0+CiAgICAgICAgICAgIDxidXR0b24KICAgICAgICAgICAgICB0eXBlPSJidXR0b24iCiAgICAgICAgICAgICAgZGF0YS10ZXN0aWQ9e2Bwby0ke3BvLmlkfWB9CiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gewogICAgICAgICAgICAgICAgc2V0UmVzdWx0cyhbXSk7CiAgICAgICAgICAgICAgICBzZXRRdWVyeShwby5udW1iZXIpOwogICAgICAgICAgICAgICAgb25TZWxlY3QocG8pOwogICAgICAgICAgICAgIH19CiAgICAgICAgICAgID4KICAgICAgICAgICAgICB7cG8ubnVtYmVyfSDCtyB7cG8uYnV5ZXJ9CiAgICAgICAgICAgIDwvYnV0dG9uPgogICAgICAgICAgPC9saT4KICAgICAgICApKX0KICAgICAgPC91bD4KICAgIDwvZGl2PgogICk7Cn0K', 'base64'), 'UTF8'), false, 1),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/components/LineRow.tsx', 'typescript', convert_from(decode('aW1wb3J0IHR5cGUgeyBHc3RSYXRlLCBJbnZvaWNlTGluZSwgUG9MaW5lIH0gZnJvbSAnLi4vdHlwZXMnOwppbXBvcnQgeyBmb3JtYXRQYWlzZSwgbGluZU5ldCB9IGZyb20gJy4uL3V0aWxzL21vbmV5JzsKaW1wb3J0IHsgTW9uZXlJbnB1dCB9IGZyb20gJy4vTW9uZXlJbnB1dCc7Cgpjb25zdCBHU1RfUkFURVM6IEdzdFJhdGVbXSA9IFswLCA1LCAxMiwgMTgsIDI4XTsKCmludGVyZmFjZSBQcm9wcyB7CiAgLyoqIDEtYmFzZWQgcG9zaXRpb24gb24gdGhlIGludm9pY2UgKGxhYmVscyBhbmQgdGVzdCBpZHMpLiAqLwogIHBvc2l0aW9uOiBudW1iZXI7CiAgbGluZTogSW52b2ljZUxpbmU7CiAgb25DaGFuZ2UocGF0Y2g6IFBhcnRpYWw8UG9MaW5lPik6IHZvaWQ7CiAgb25SZW1vdmUoKTogdm9pZDsKfQoKZXhwb3J0IGZ1bmN0aW9uIExpbmVSb3coeyBwb3NpdGlvbiwgbGluZSwgb25DaGFuZ2UsIG9uUmVtb3ZlIH06IFByb3BzKSB7CiAgcmV0dXJuICgKICAgIDxkaXYgZGF0YS10ZXN0aWQ9ImxpbmUiIHJvbGU9Imdyb3VwIiBhcmlhLWxhYmVsPXtgTGluZSAke3Bvc2l0aW9ufWB9IGNsYXNzTmFtZT0ibGluZSI+CiAgICAgIDxpbnB1dAogICAgICAgIGRhdGEtdGVzdGlkPXtgc2t1LSR7cG9zaXRpb259YH0KICAgICAgICBhcmlhLWxhYmVsPSJTS1UiCiAgICAgICAgdmFsdWU9e2xpbmUuc2t1fQogICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gb25DaGFuZ2UoeyBza3U6IGUudGFyZ2V0LnZhbHVlIH0pfQogICAgICAvPgogICAgICA8aW5wdXQKICAgICAgICBkYXRhLXRlc3RpZD17YGRlc2NyaXB0aW9uLSR7cG9zaXRpb259YH0KICAgICAgICBhcmlhLWxhYmVsPSJEZXNjcmlwdGlvbiIKICAgICAgICB2YWx1ZT17bGluZS5kZXNjcmlwdGlvbn0KICAgICAgICBvbkNoYW5nZT17KGUpID0+IG9uQ2hhbmdlKHsgZGVzY3JpcHRpb246IGUudGFyZ2V0LnZhbHVlIH0pfQogICAgICAvPgogICAgICA8aW5wdXQKICAgICAgICBkYXRhLXRlc3RpZD17YHF0eS0ke3Bvc2l0aW9ufWB9CiAgICAgICAgYXJpYS1sYWJlbD0iUXVhbnRpdHkiCiAgICAgICAgdHlwZT0ibnVtYmVyIgogICAgICAgIG1pbj17MH0KICAgICAgICB2YWx1ZT17bGluZS5xdWFudGl0eX0KICAgICAgICBvbkNoYW5nZT17KGUpID0+IG9uQ2hhbmdlKHsgcXVhbnRpdHk6IE51bWJlcihlLnRhcmdldC52YWx1ZSkgfSl9CiAgICAgIC8+CiAgICAgIDxNb25leUlucHV0CiAgICAgICAgdGVzdElEPXtgcHJpY2UtJHtwb3NpdGlvbn1gfQogICAgICAgIGxhYmVsPSJVbml0IHByaWNlIgogICAgICAgIHBhaXNlPXtsaW5lLnVuaXRQcmljZVBhaXNlfQogICAgICAgIG9uQ2hhbmdlPXsodW5pdFByaWNlUGFpc2UpID0+IG9uQ2hhbmdlKHsgdW5pdFByaWNlUGFpc2UgfSl9CiAgICAgIC8+CiAgICAgIDxzZWxlY3QKICAgICAgICBkYXRhLXRlc3RpZD17YGdzdC0ke3Bvc2l0aW9ufWB9CiAgICAgICAgYXJpYS1sYWJlbD0iR1NUIHJhdGUiCiAgICAgICAgdmFsdWU9e2xpbmUuZ3N0UmF0ZX0KICAgICAgICBvbkNoYW5nZT17KGUpID0+IG9uQ2hhbmdlKHsgZ3N0UmF0ZTogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSBhcyBHc3RSYXRlIH0pfQogICAgICA+CiAgICAgICAge0dTVF9SQVRFUy5tYXAoKHJhdGUpID0+ICgKICAgICAgICAgIDxvcHRpb24ga2V5PXtyYXRlfSB2YWx1ZT17cmF0ZX0+CiAgICAgICAgICAgIHtyYXRlfSUKICAgICAgICAgIDwvb3B0aW9uPgogICAgICAgICkpfQogICAgICA8L3NlbGVjdD4KICAgICAgPHNwYW4gZGF0YS10ZXN0aWQ9e2B0b3RhbC0ke3Bvc2l0aW9ufWB9Pntmb3JtYXRQYWlzZShsaW5lTmV0KGxpbmUpKX08L3NwYW4+CiAgICAgIDxidXR0b24gdHlwZT0iYnV0dG9uIiBkYXRhLXRlc3RpZD17YHJlbW92ZS0ke3Bvc2l0aW9ufWB9IG9uQ2xpY2s9e29uUmVtb3ZlfT4KICAgICAgICBSZW1vdmUKICAgICAgPC9idXR0b24+CiAgICA8L2Rpdj4KICApOwp9Cg==', 'base64'), 'UTF8'), false, 2),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/components/MoneyInput.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgcGFyc2VSdXBlZXMgfSBmcm9tICcuLi91dGlscy9tb25leSc7CgppbnRlcmZhY2UgUHJvcHMgewogIHRlc3RJRDogc3RyaW5nOwogIGxhYmVsOiBzdHJpbmc7CiAgcGFpc2U6IG51bWJlcjsKICBvbkNoYW5nZShwYWlzZTogbnVtYmVyKTogdm9pZDsKfQoKLyoqIEEgcnVwZWUgYW1vdW50IGZpZWxkLiBUaGUgdmFsdWUgbGl2ZXMgaW4gdGhlIHBhcmVudCwgaW4gcGFpc2UuICovCmV4cG9ydCBmdW5jdGlvbiBNb25leUlucHV0KHsgdGVzdElELCBsYWJlbCwgcGFpc2UsIG9uQ2hhbmdlIH06IFByb3BzKSB7CiAgcmV0dXJuICgKICAgIDxpbnB1dAogICAgICBkYXRhLXRlc3RpZD17dGVzdElEfQogICAgICBhcmlhLWxhYmVsPXtsYWJlbH0KICAgICAgaW5wdXRNb2RlPSJkZWNpbWFsIgogICAgICB2YWx1ZT17KHBhaXNlIC8gMTAwKS50b1N0cmluZygpfQogICAgICBvbkNoYW5nZT17KGUpID0+IG9uQ2hhbmdlKHBhcnNlUnVwZWVzKGUudGFyZ2V0LnZhbHVlKSA/PyAwKX0KICAgIC8+CiAgKTsKfQo=', 'base64'), 'UTF8'), false, 3),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/hooks/useDebouncedCallback.ts', 'typescript', convert_from(decode('aW1wb3J0IHsgdXNlTWVtbywgdXNlUmVmIH0gZnJvbSAncmVhY3QnOwoKZXhwb3J0IGludGVyZmFjZSBEZWJvdW5jZWQ8QSBleHRlbmRzIHVua25vd25bXT4gewogICguLi5hcmdzOiBBKTogdm9pZDsKICAvKiogRHJvcHMgYSBwZW5kaW5nIGNhbGwuICovCiAgY2FuY2VsKCk6IHZvaWQ7Cn0KCi8qKgogKiBSZXR1cm5zIGEgc3RhYmxlIGZ1bmN0aW9uIHRoYXQgY2FsbHMgYGZuYCBvbmNlIGNhbGxzIGhhdmUgc3RvcHBlZCBmb3IgYGRlbGF5TXNgLCB3aXRoIHRoZQogKiBhcmd1bWVudHMgb2YgdGhlIGxhc3QgY2FsbC4KICovCmV4cG9ydCBmdW5jdGlvbiB1c2VEZWJvdW5jZWRDYWxsYmFjazxBIGV4dGVuZHMgdW5rbm93bltdPigKICBmbjogKC4uLmFyZ3M6IEEpID0+IHZvaWQsCiAgZGVsYXlNczogbnVtYmVyLAopOiBEZWJvdW5jZWQ8QT4gewogIGNvbnN0IHRpbWVyID0gdXNlUmVmPFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgdW5kZWZpbmVkPih1bmRlZmluZWQpOwogIHJldHVybiB1c2VNZW1vKCgpID0+IHsKICAgIGNvbnN0IGRlYm91bmNlZCA9ICguLi5hcmdzOiBBKSA9PiB7CiAgICAgIGNsZWFyVGltZW91dCh0aW1lci5jdXJyZW50KTsKICAgICAgdGltZXIuY3VycmVudCA9IHNldFRpbWVvdXQoKCkgPT4gZm4oLi4uYXJncyksIGRlbGF5TXMpOwogICAgfTsKICAgIGRlYm91bmNlZC5jYW5jZWwgPSAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIuY3VycmVudCk7CiAgICByZXR1cm4gZGVib3VuY2VkOwogICAgLy8gS2VwdCBzdGFibGUgb24gcHVycG9zZTogY2FsbGVycyBwdXQgaXQgaW4gZWZmZWN0IGRlcGVuZGVuY2llcy4KICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHMKICB9LCBbZGVsYXlNc10pOwp9Cg==', 'base64'), 'UTF8'), false, 4),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/state/invoiceReducer.ts', 'typescript', convert_from(decode('aW1wb3J0IHR5cGUgeyBJbnZvaWNlTGluZSwgUG9MaW5lIH0gZnJvbSAnLi4vdHlwZXMnOwppbXBvcnQgeyBsaW5lTmV0LCBsaW5lVGF4IH0gZnJvbSAnLi4vdXRpbHMvbW9uZXknOwoKZXhwb3J0IGludGVyZmFjZSBJbnZvaWNlU3RhdGUgewogIGxpbmVzOiBJbnZvaWNlTGluZVtdOwogIC8qKiBFYXJsaWVyIHZlcnNpb25zIG9mIGBsaW5lc2AsIG5ld2VzdCBsYXN0LCBmb3IgVW5kby4gKi8KICBwYXN0OiBJbnZvaWNlTGluZVtdW107Cn0KCmV4cG9ydCBjb25zdCBpbml0aWFsU3RhdGU6IEludm9pY2VTdGF0ZSA9IHsgbGluZXM6IFtdLCBwYXN0OiBbXSB9OwoKZXhwb3J0IHR5cGUgSW52b2ljZUFjdGlvbiA9CiAgfCB7IHR5cGU6ICdpbXBvcnRQb0xpbmVzJzsgbGluZXM6IFBvTGluZVtdIH0KICB8IHsgdHlwZTogJ2FkZExpbmUnIH0KICB8IHsgdHlwZTogJ3VwZGF0ZUxpbmUnOyBpZDogc3RyaW5nOyBwYXRjaDogUGFydGlhbDxQb0xpbmU+IH0KICB8IHsgdHlwZTogJ3JlbW92ZUxpbmUnOyBpZDogc3RyaW5nIH0KICB8IHsgdHlwZTogJ3VuZG8nIH07Cgpjb25zdCBCTEFOS19MSU5FOiBQb0xpbmUgPSB7IHNrdTogJycsIGRlc2NyaXB0aW9uOiAnJywgcXVhbnRpdHk6IDEsIHVuaXRQcmljZVBhaXNlOiAwLCBnc3RSYXRlOiAxOCB9OwoKY29uc3QgbmV3TGluZUlkID0gKCkgPT4gYGxpbmUtJHtEYXRlLm5vdygpfWA7CgpleHBvcnQgZnVuY3Rpb24gaW52b2ljZVJlZHVjZXIoc3RhdGU6IEludm9pY2VTdGF0ZSwgYWN0aW9uOiBJbnZvaWNlQWN0aW9uKTogSW52b2ljZVN0YXRlIHsKICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7CiAgICBjYXNlICdpbXBvcnRQb0xpbmVzJzoKICAgICAgcmV0dXJuIHsKICAgICAgICBsaW5lczogYWN0aW9uLmxpbmVzLm1hcCgobGluZSkgPT4gKHsgLi4ubGluZSwgaWQ6IG5ld0xpbmVJZCgpIH0pKSwKICAgICAgICBwYXN0OiBbLi4uc3RhdGUucGFzdCwgc3RhdGUubGluZXNdLAogICAgICB9OwogICAgY2FzZSAnYWRkTGluZSc6CiAgICAgIHJldHVybiB7CiAgICAgICAgbGluZXM6IFsuLi5zdGF0ZS5saW5lcywgeyAuLi5CTEFOS19MSU5FLCBpZDogbmV3TGluZUlkKCkgfV0sCiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSwKICAgICAgfTsKICAgIGNhc2UgJ3VwZGF0ZUxpbmUnOiB7CiAgICAgIGNvbnN0IGxpbmUgPSBzdGF0ZS5saW5lcy5maW5kKChsKSA9PiBsLmlkID09PSBhY3Rpb24uaWQpOwogICAgICBpZiAoIWxpbmUpIHJldHVybiBzdGF0ZTsKICAgICAgT2JqZWN0LmFzc2lnbihsaW5lLCBhY3Rpb24ucGF0Y2gpOwogICAgICByZXR1cm4geyBsaW5lczogc3RhdGUubGluZXMsIHBhc3Q6IFsuLi5zdGF0ZS5wYXN0LCBzdGF0ZS5saW5lc10gfTsKICAgIH0KICAgIGNhc2UgJ3JlbW92ZUxpbmUnOgogICAgICByZXR1cm4gewogICAgICAgIGxpbmVzOiBzdGF0ZS5saW5lcy5maWx0ZXIoKGwpID0+IGwuaWQgIT09IGFjdGlvbi5pZCksCiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSwKICAgICAgfTsKICAgIGNhc2UgJ3VuZG8nOiB7CiAgICAgIGNvbnN0IHByZXZpb3VzID0gc3RhdGUucGFzdFtzdGF0ZS5wYXN0Lmxlbmd0aCAtIDFdOwogICAgICBpZiAoIXByZXZpb3VzKSByZXR1cm4gc3RhdGU7CiAgICAgIHJldHVybiB7IGxpbmVzOiBwcmV2aW91cywgcGFzdDogc3RhdGUucGFzdC5zbGljZSgwLCAtMSkgfTsKICAgIH0KICB9Cn0KCmV4cG9ydCBmdW5jdGlvbiB0b3RhbHMobGluZXM6IEludm9pY2VMaW5lW10pIHsKICBsZXQgbmV0ID0gMDsKICBsZXQgdGF4ID0gMDsKICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHsKICAgIG5ldCArPSBsaW5lTmV0KGxpbmUpOwogICAgdGF4ICs9IGxpbmVUYXgobGluZSk7CiAgfQogIHJldHVybiB7IG5ldCwgdGF4LCBncm9zczogbmV0ICsgdGF4IH07Cn0K', 'base64'), 'UTF8'), false, 5),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/utils/money.ts', 'typescript', convert_from(decode('Y29uc3QgaW5yID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KCdlbi1JTicsIHsgc3R5bGU6ICdjdXJyZW5jeScsIGN1cnJlbmN5OiAnSU5SJyB9KTsKCi8qKiDigrkxMiwzNCw1NjcuNTAgKi8KZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFBhaXNlKHBhaXNlOiBudW1iZXIpOiBzdHJpbmcgewogIHJldHVybiBpbnIuZm9ybWF0KHBhaXNlIC8gMTAwKTsKfQoKLyoqCiAqIFBhcnNlcyB3aGF0IHRoZSBzdXBwbGllciB0eXBlZCBpbiBhIHByaWNlIGZpZWxkICgiMTI1MCIsICIxLDI1MC41MCIsICLigrkgOTkuOSIpIGludG8gcGFpc2UuCiAqIFJldHVybnMgbnVsbCB3aGVuIGl0IGlzbid0IGEgdmFsaWQsIG5vbi1uZWdhdGl2ZSBhbW91bnQgd2l0aCBhdCBtb3N0IDIgZGVjaW1hbHMuCiAqLwpleHBvcnQgZnVuY3Rpb24gcGFyc2VSdXBlZXModGV4dDogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7CiAgY29uc3QgdmFsdWUgPSBwYXJzZUZsb2F0KHRleHQpOwogIGlmIChpc05hTih2YWx1ZSkpIHJldHVybiBudWxsOwogIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMTAwKTsKfQoKLyoqIE5ldCBhbW91bnQgb2YgYSBsaW5lLCBpbiBwYWlzZS4gKi8KZXhwb3J0IGZ1bmN0aW9uIGxpbmVOZXQobGluZTogeyBxdWFudGl0eTogbnVtYmVyOyB1bml0UHJpY2VQYWlzZTogbnVtYmVyIH0pOiBudW1iZXIgewogIHJldHVybiBsaW5lLnF1YW50aXR5ICogbGluZS51bml0UHJpY2VQYWlzZTsKfQoKLyoqIEdTVCBvZiBhIGxpbmUsIHJvdW5kZWQgdG8gdGhlIHBhaXNhLiAqLwpleHBvcnQgZnVuY3Rpb24gbGluZVRheChsaW5lOiB7IHF1YW50aXR5OiBudW1iZXI7IHVuaXRQcmljZVBhaXNlOiBudW1iZXI7IGdzdFJhdGU6IG51bWJlciB9KTogbnVtYmVyIHsKICByZXR1cm4gTWF0aC5yb3VuZCgobGluZU5ldChsaW5lKSAqIGxpbmUuZ3N0UmF0ZSkgLyAxMDApOwp9Cg==', 'base64'), 'UTF8'), false, 6),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/utils/dates.ts', 'typescript', convert_from(decode('LyoqIFRvZGF5J3MgZGF0ZSBpbiBJbmRpYSBhcyBZWVlZLU1NLUREIChpbnZvaWNlcyBhcmUgZGF0ZWQgaW4gSVNUKS4gKi8KZXhwb3J0IGZ1bmN0aW9uIHRvZGF5SW5JbmRpYShub3c6IERhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHsKICByZXR1cm4gbm93LnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApOwp9Cg==', 'base64'), 'UTF8'), false, 7),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/utils/debounce.ts', 'typescript', convert_from(decode('LyoqIENsYXNzaWMgZGVib3VuY2U6IGBmbmAgcnVucyBvbmNlIGNhbGxzIHN0b3AgZm9yIGBtc2AsIHdpdGggdGhlIGxhc3QgY2FsbCdzIGFyZ3VtZW50cy4gKi8KZXhwb3J0IGZ1bmN0aW9uIGRlYm91bmNlPEEgZXh0ZW5kcyB1bmtub3duW10+KGZuOiAoLi4uYXJnczogQSkgPT4gdm9pZCwgbXM6IG51bWJlcikgewogIGxldCB0aW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCB1bmRlZmluZWQ7CiAgY29uc3QgZGVib3VuY2VkID0gKC4uLmFyZ3M6IEEpID0+IHsKICAgIGNsZWFyVGltZW91dCh0aW1lcik7CiAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gZm4oLi4uYXJncyksIG1zKTsKICB9OwogIGRlYm91bmNlZC5jYW5jZWwgPSAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIpOwogIHJldHVybiBkZWJvdW5jZWQ7Cn0K', 'base64'), 'UTF8'), true, 8),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'src/types.ts', 'typescript', convert_from(decode('ZXhwb3J0IHR5cGUgR3N0UmF0ZSA9IDAgfCA1IHwgMTIgfCAxOCB8IDI4OwoKLyoqIEEgUE8gdGhlIHN1cHBsaWVyIGNhbiBpbnZvaWNlIGFnYWluc3QgKGEgc2VhcmNoIHJlc3VsdCkuICovCmV4cG9ydCBpbnRlcmZhY2UgUG9TdW1tYXJ5IHsKICBpZDogc3RyaW5nOwogIG51bWJlcjogc3RyaW5nOwogIGJ1eWVyOiBzdHJpbmc7Cn0KCi8qKiBNb25leSBpcyBpbiBwYWlzZSAoaW50ZWdlcnMpOiDigrkxMi41MCBpcyAxMjUwLiAqLwpleHBvcnQgaW50ZXJmYWNlIFBvTGluZSB7CiAgc2t1OiBzdHJpbmc7CiAgZGVzY3JpcHRpb246IHN0cmluZzsKICBxdWFudGl0eTogbnVtYmVyOwogIHVuaXRQcmljZVBhaXNlOiBudW1iZXI7CiAgZ3N0UmF0ZTogR3N0UmF0ZTsKfQoKLyoqIE9uZSBsaW5lIG9mIHRoZSBpbnZvaWNlIGJlaW5nIGJ1aWx0LiBgaWRgIGlkZW50aWZpZXMgdGhlIGxpbmUgd2hpbGUgaXQgaXMgZWRpdGVkLiAqLwpleHBvcnQgaW50ZXJmYWNlIEludm9pY2VMaW5lIGV4dGVuZHMgUG9MaW5lIHsKICBpZDogc3RyaW5nOwp9CgpleHBvcnQgaW50ZXJmYWNlIEludm9pY2VEcmFmdCB7CiAgcG9JZDogc3RyaW5nIHwgbnVsbDsKICAvKiogWVlZWS1NTS1ERCBpbiBJbmRpYSB0aW1lOiBpbnZvaWNlcyBhcmUgZGF0ZWQgaW4gSVNUIHdoYXRldmVyIHRoZSBicm93c2VyJ3MgdGltZSB6b25lLiAqLwogIGludm9pY2VEYXRlOiBzdHJpbmc7CiAgbGluZXM6IEludm9pY2VMaW5lW107Cn0KCmV4cG9ydCBpbnRlcmZhY2UgSW52b2ljZUFwaSB7CiAgc2VhcmNoUG9zKHF1ZXJ5OiBzdHJpbmcpOiBQcm9taXNlPFBvU3VtbWFyeVtdPjsKICBnZXRQb0xpbmVzKHBvSWQ6IHN0cmluZyk6IFByb21pc2U8UG9MaW5lW10+OwogIHNhdmVEcmFmdChkcmFmdDogSW52b2ljZURyYWZ0KTogUHJvbWlzZTx2b2lkPjsKICBzdWJtaXQoZHJhZnQ6IEludm9pY2VEcmFmdCk6IFByb21pc2U8dm9pZD47Cn0K', 'base64'), 'UTF8'), true, 9),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/autosave.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCBkZWZlcnJlZCwgZmlyZUV2ZW50LCBmbHVzaFByb21pc2VzLCByZW5kZXIsIHNjcmVlbiB9IGZyb20gJ0Bjb2RlYXJlbmEvdGVzdC11dGlscyc7CmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7CmltcG9ydCB7IEFVVE9TQVZFX01TLCBJbnZvaWNlQnVpbGRlciB9IGZyb20gJy4uL3NyYy9JbnZvaWNlQnVpbGRlcic7CmltcG9ydCB7IGNyZWF0ZUZha2VBcGksIG9wZW5QbywgdHlwZUludG8gfSBmcm9tICcuL3N1cHBvcnQvZmFrZUFwaSc7CgpkZXNjcmliZSgnYXV0b3NhdmUnLCAoKSA9PiB7CiAgaXQoJ3NhdmVzIHRoZSBjdXJyZW50IGRyYWZ0IG9uY2UgdGhlIHN1cHBsaWVyIHN0b3BzIGVkaXRpbmcnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCB7IGFwaSB9ID0gYXdhaXQgb3BlblBvKCk7CgogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZShBVVRPU0FWRV9NUyAtIDEpKTsKICAgIGV4cGVjdChhcGkuc2F2ZWQpLnRvSGF2ZUxlbmd0aCgwKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoMSkpOwoKICAgIGV4cGVjdChhcGkuc2F2ZWQpLnRvSGF2ZUxlbmd0aCgxKTsKICAgIGV4cGVjdChhcGkuc2F2ZWRbMF0hLnBvSWQpLnRvQmUoJ3BvLTEnKTsKICAgIGV4cGVjdChhcGkuc2F2ZWRbMF0hLmxpbmVzLm1hcCgobCkgPT4gbC5za3UpKS50b0VxdWFsKFsnU0tVLUEnLCAnU0tVLUInLCAnU0tVLUMnXSk7CiAgfSk7CgogIGl0KCdzYXZlcyBxdWFudGl0eSBlZGl0cywgb25jZSBwZXIgYnVyc3Qgb2YgdHlwaW5nLCB3aXRoIHRoZSBsYXRlc3QgdmFsdWVzJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBhcGkgfSA9IGF3YWl0IG9wZW5QbygpOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZShBVVRPU0FWRV9NUykpOwogICAgY29uc3QgYmVmb3JlID0gYXBpLnNhdmVkLmxlbmd0aDsKCiAgICB0eXBlSW50bygncXR5LTEnLCAnNCcpOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZShBVVRPU0FWRV9NUyAvIDIpKTsKICAgIHR5cGVJbnRvKCdxdHktMicsICczJyk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKEFVVE9TQVZFX01TIC0gMSkpOwogICAgZXhwZWN0KGFwaS5zYXZlZC5sZW5ndGggLSBiZWZvcmUpLnRvQmUoMCk7IC8vIHRoZSBwYXVzZSBzdGFydHMgYWdhaW4gd2l0aCBldmVyeSBlZGl0CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKDEpKTsKCiAgICBleHBlY3QoYXBpLnNhdmVkLmxlbmd0aCAtIGJlZm9yZSkudG9CZSgxKTsKICAgIGV4cGVjdChhcGkuc2F2ZWRbYXBpLnNhdmVkLmxlbmd0aCAtIDFdIS5saW5lcy5tYXAoKGwpID0+IGwucXVhbnRpdHkpKS50b0VxdWFsKFs0LCAzLCAxXSk7CiAgfSk7CgogIGl0KCduZXZlciBzYXZlcyBhZnRlciB0aGUgaW52b2ljZSBpcyBzdWJtaXR0ZWQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCB7IGFwaSB9ID0gYXdhaXQgb3BlblBvKCk7CiAgICB0eXBlSW50bygncXR5LTEnLCAnNCcpOwoKICAgIGZpcmVFdmVudC5zdWJtaXQoc2NyZWVuLmdldEJ5VGVzdElkKCdpbnZvaWNlJykpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogICAgZXhwZWN0KGFwaS5zdWJtaXR0ZWQpLnRvSGF2ZUxlbmd0aCgxKTsgLy8gc2VudCBhdCBvbmNlOiB0aGUgc3VwcGxpZXIgaXMgd2FpdGluZyBmb3IgaXQKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoNV8wMDApKTsKCiAgICBleHBlY3QoYXBpLnN1Ym1pdHRlZCkudG9IYXZlTGVuZ3RoKDEpOwogICAgZXhwZWN0KGFwaS5zdWJtaXR0ZWRbMF0hLmxpbmVzWzBdIS5xdWFudGl0eSkudG9CZSg0KTsKICAgIGV4cGVjdChhcGkubG9nLnNsaWNlKGFwaS5sb2cuaW5kZXhPZignc3VibWl0JykpKS50b0VxdWFsKFsnc3VibWl0J10pOwogIH0pOwoKICBpdCgnbmV2ZXIgc2F2ZXMgd2hpbGUgYSBzbG93IHN1Ym1pdCBpcyBzdGlsbCBvbiBpdHMgd2F5JywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgYXBpID0gY3JlYXRlRmFrZUFwaSgpOwogICAgY29uc3Qgc2VuZGluZyA9IGRlZmVycmVkKCk7CiAgICBhcGkuc3VibWl0Lm1vY2tJbXBsZW1lbnRhdGlvbihhc3luYyAoZHJhZnQpID0+IHsKICAgICAgYXBpLmxvZy5wdXNoKCdzdWJtaXQnKTsKICAgICAgYXBpLnN1Ym1pdHRlZC5wdXNoKHN0cnVjdHVyZWRDbG9uZShkcmFmdCkpOwogICAgICBhd2FpdCBzZW5kaW5nLnByb21pc2U7CiAgICB9KTsKICAgIGF3YWl0IG9wZW5QbyhhcGkpOwogICAgdHlwZUludG8oJ3F0eS0xJywgJzQnKTsKCiAgICBmaXJlRXZlbnQuc3VibWl0KHNjcmVlbi5nZXRCeVRlc3RJZCgnaW52b2ljZScpKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoNV8wMDApKTsgLy8gdGhlIG5ldHdvcmsgaXMgc2xvdwogICAgYXdhaXQgYWN0KGFzeW5jICgpID0+IHNlbmRpbmcucmVzb2x2ZSh1bmRlZmluZWQpKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKCiAgICBleHBlY3QoYXBpLmxvZy5zbGljZShhcGkubG9nLmluZGV4T2YoJ3N1Ym1pdCcpKSkudG9FcXVhbChbJ3N1Ym1pdCddKTsKICB9KTsKCiAgaXQoJ2Egc2VhcmNoIGluIHRoZSBQTyBwaWNrZXIgZG9lcyBub3QgY2FuY2VsIGEgcGVuZGluZyBzYXZlJywgYXN5bmMgKCkgPT4gewogICAgY29uc3QgeyBhcGkgfSA9IGF3YWl0IG9wZW5QbygpOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZShBVVRPU0FWRV9NUykpOwogICAgY29uc3QgYmVmb3JlID0gYXBpLnNhdmVkLmxlbmd0aDsKCiAgICB0eXBlSW50bygncXR5LTEnLCAnNCcpOwogICAgdHlwZUludG8oJ3BvLXNlYXJjaCcsICdNdW0nKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoQVVUT1NBVkVfTVMpKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKCiAgICBleHBlY3QoYXBpLnNhdmVkLmxlbmd0aCAtIGJlZm9yZSkudG9CZSgxKTsKICAgIGV4cGVjdChhcGkuc2F2ZWRbYXBpLnNhdmVkLmxlbmd0aCAtIDFdIS5saW5lc1swXSEucXVhbnRpdHkpLnRvQmUoNCk7CiAgfSk7CgogIGl0KCduZXZlciBzYXZlcyBhZnRlciB0aGUgYnVpbGRlciBpcyBjbG9zZWQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCB7IGFwaSwgdW5tb3VudCB9ID0gYXdhaXQgb3BlblBvKCk7CiAgICB0eXBlSW50bygncXR5LTEnLCAnNCcpOwoKICAgIHVubW91bnQoKTsKICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoNV8wMDApKTsKCiAgICBleHBlY3QoYXBpLnNhdmVEcmFmdCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsKICB9KTsKCiAgaXQoJ2RvZXMgbm90IHNhdmUgYmVmb3JlIGEgUE8gaXMgY2hvc2VuJywgKCkgPT4gewogICAgamVzdC51c2VGYWtlVGltZXJzKCk7CiAgICBjb25zdCBhcGkgPSBjcmVhdGVGYWtlQXBpKCk7CiAgICByZW5kZXIoPEludm9pY2VCdWlsZGVyIGFwaT17YXBpfSAvPik7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKDVfMDAwKSk7CiAgICBleHBlY3QoYXBpLnNhdmVEcmFmdCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 10),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/PoPicker.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCBmaXJlRXZlbnQsIGZsdXNoUHJvbWlzZXMsIHJlbmRlciwgc2NyZWVuIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgSW52b2ljZUJ1aWxkZXIgfSBmcm9tICcuLi9zcmMvSW52b2ljZUJ1aWxkZXInOwppbXBvcnQgeyBTRUFSQ0hfREVCT1VOQ0VfTVMgfSBmcm9tICcuLi9zcmMvY29tcG9uZW50cy9Qb1BpY2tlcic7CmltcG9ydCB7IGNyZWF0ZUZha2VBcGksIHR5cGVJbnRvIH0gZnJvbSAnLi9zdXBwb3J0L2Zha2VBcGknOwoKZGVzY3JpYmUoJ1BPIHNlYXJjaCcsICgpID0+IHsKICBpdCgnc2VuZHMgb25lIHJlcXVlc3Qgd2hlbiB0aGUgc3VwcGxpZXIgcGF1c2VzIHR5cGluZycsIGFzeW5jICgpID0+IHsKICAgIGplc3QudXNlRmFrZVRpbWVycygpOwogICAgY29uc3QgYXBpID0gY3JlYXRlRmFrZUFwaSgpOwogICAgcmVuZGVyKDxJbnZvaWNlQnVpbGRlciBhcGk9e2FwaX0gLz4pOwoKICAgIGZvciAoY29uc3QgdmFsdWUgb2YgWydQJywgJ1BPJywgJ1BPLScsICdQTy0yJywgJ1BPLTIwJ10pIHR5cGVJbnRvKCdwby1zZWFyY2gnLCB2YWx1ZSk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKFNFQVJDSF9ERUJPVU5DRV9NUykpOwoKICAgIGV4cGVjdChhcGkuc2VhcmNoUG9zKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7CiAgICBleHBlY3QoYXBpLnNlYXJjaFBvcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ1BPLTIwJyk7CiAgICBhd2FpdCBmbHVzaFByb21pc2VzKCk7IC8vIGxldCB0aGUgcmVzdWx0cyByZW5kZXIKICB9KTsKCiAgaXQoJ3dhaXRzIHVudGlsIHRoZSBzdXBwbGllciBzdG9wcyB0eXBpbmcsIGhvd2V2ZXIgbG9uZyB0aGV5IHR5cGUnLCBhc3luYyAoKSA9PiB7CiAgICBqZXN0LnVzZUZha2VUaW1lcnMoKTsKICAgIGNvbnN0IGFwaSA9IGNyZWF0ZUZha2VBcGkoKTsKICAgIHJlbmRlcig8SW52b2ljZUJ1aWxkZXIgYXBpPXthcGl9IC8+KTsKCiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIFsnUCcsICdQTycsICdQTy0nLCAnUE8tMicsICdQTy0yMCddKSB7CiAgICAgIHR5cGVJbnRvKCdwby1zZWFyY2gnLCB2YWx1ZSk7CiAgICAgIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoU0VBUkNIX0RFQk9VTkNFX01TIC0gNTApKTsgLy8gYSBzbG93IHR5cGlzdAogICAgfQogICAgZXhwZWN0KGFwaS5zZWFyY2hQb3MpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKDUwKSk7CiAgICBleHBlY3QoYXBpLnNlYXJjaFBvcykudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpOwogICAgZXhwZWN0KGFwaS5zZWFyY2hQb3MpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdQTy0yMCcpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogIH0pOwoKICBpdCgnd2FpdHMgZm9yIHRoZSBwYXVzZSBiZWZvcmUgc2VhcmNoaW5nJywgYXN5bmMgKCkgPT4gewogICAgamVzdC51c2VGYWtlVGltZXJzKCk7CiAgICBjb25zdCBhcGkgPSBjcmVhdGVGYWtlQXBpKCk7CiAgICByZW5kZXIoPEludm9pY2VCdWlsZGVyIGFwaT17YXBpfSAvPik7CgogICAgdHlwZUludG8oJ3BvLXNlYXJjaCcsICdQdW5lJyk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKFNFQVJDSF9ERUJPVU5DRV9NUyAtIDEpKTsKICAgIGV4cGVjdChhcGkuc2VhcmNoUG9zKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpOwogICAgYWN0KCgpID0+IGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZSgxKSk7CiAgICBleHBlY3QoYXBpLnNlYXJjaFBvcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ1B1bmUnKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKICB9KTsKCiAgaXQoJ2xpc3RzIG1hdGNoZXM7IGNob29zaW5nIG9uZSBpbXBvcnRzIGl0cyBsaW5lcycsIGFzeW5jICgpID0+IHsKICAgIGplc3QudXNlRmFrZVRpbWVycygpOwogICAgY29uc3QgYXBpID0gY3JlYXRlRmFrZUFwaSgpOwogICAgcmVuZGVyKDxJbnZvaWNlQnVpbGRlciBhcGk9e2FwaX0gLz4pOwoKICAgIHR5cGVJbnRvKCdwby1zZWFyY2gnLCAnbXVtYmFpJyk7CiAgICBhY3QoKCkgPT4gamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKFNFQVJDSF9ERUJPVU5DRV9NUykpOwogICAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogICAgZmlyZUV2ZW50LmNsaWNrKHNjcmVlbi5nZXRCeVRlc3RJZCgncG8tcG8tMicpKTsKICAgIGF3YWl0IGZsdXNoUHJvbWlzZXMoKTsKCiAgICBleHBlY3QoYXBpLmdldFBvTGluZXMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdwby0yJyk7CiAgICBleHBlY3Qoc2NyZWVuLmdldEFsbEJ5VGVzdElkKCdsaW5lJykpLnRvSGF2ZUxlbmd0aCgzKTsKICB9KTsKfSk7Cg==', 'base64'), 'UTF8'), true, 11),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/lines.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgZmlyZUV2ZW50LCBnZXRDb25zb2xlRXJyb3JzLCBzY3JlZW4sIHRleHRDb250ZW50IH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHsgaW5pdGlhbFN0YXRlLCBpbnZvaWNlUmVkdWNlciwgdHlwZSBJbnZvaWNlU3RhdGUgfSBmcm9tICcuLi9zcmMvc3RhdGUvaW52b2ljZVJlZHVjZXInOwppbXBvcnQgeyBQT19MSU5FUywgY3JlYXRlRmFrZUFwaSwgb3BlblBvLCB0eXBlSW50bywgdmFsdWVPZiB9IGZyb20gJy4vc3VwcG9ydC9mYWtlQXBpJzsKCmNvbnN0IGR1cGxpY2F0ZUtleVdhcm5pbmdzID0gKCkgPT4gZ2V0Q29uc29sZUVycm9ycygpLmZpbHRlcigobSkgPT4gL3NhbWUga2V5L2kudGVzdChtKSk7CmNvbnN0IGdyb3NzID0gKCkgPT4gdGV4dENvbnRlbnQoc2NyZWVuLmdldEJ5VGVzdElkKCd0b3RhbC1ncm9zcycpKTsKCmRlc2NyaWJlKCdpbnZvaWNlIGxpbmVzJywgKCkgPT4gewogIGl0KCdnaXZlcyBldmVyeSBsaW5lIGl0cyBvd24gaWQsIGV2ZW4gd2hlbiBzZXZlcmFsIGFyZSBjcmVhdGVkIGF0IG9uY2UnLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsgLy8gdGhlIFBPJ3MgdGhyZWUgbGluZXMgYXJlIGltcG9ydGVkIGF0IG9uY2UKICAgIGZpcmVFdmVudC5jbGljayhzY3JlZW4uZ2V0QnlUZXN0SWQoJ2FkZC1saW5lJykpOwogICAgZmlyZUV2ZW50LmNsaWNrKHNjcmVlbi5nZXRCeVRlc3RJZCgnYWRkLWxpbmUnKSk7CgogICAgLy8gRWFjaCBsaW5lIGtlZXBzIGl0cyBvd24gdmFsdWU6IGxpbmVzIHRoYXQgc2hhcmVkIGFuIGlkIHdvdWxkIGNoYW5nZSB0b2dldGhlci4KICAgIFsnU0tVLTEnLCAnU0tVLTInLCAnU0tVLTMnLCAnU0tVLTQnLCAnU0tVLTUnXS5mb3JFYWNoKChza3UsIGkpID0+IHR5cGVJbnRvKGBza3UtJHtpICsgMX1gLCBza3UpKTsKICAgIGV4cGVjdChbMSwgMiwgMywgNCwgNV0ubWFwKChuKSA9PiB2YWx1ZU9mKGBza3UtJHtufWApKSkudG9FcXVhbChbJ1NLVS0xJywgJ1NLVS0yJywgJ1NLVS0zJywgJ1NLVS00JywgJ1NLVS01J10pOwogICAgZXhwZWN0KGR1cGxpY2F0ZUtleVdhcm5pbmdzKCkpLnRvRXF1YWwoW10pOwogIH0pOwoKICBpdCgnZ2l2ZXMgYSBsaW5lIGFkZGVkIGFmdGVyIGEgcmVtb3ZhbCBpdHMgb3duIGlkJywgYXN5bmMgKCkgPT4gewogICAgYXdhaXQgb3BlblBvKCk7CiAgICBmaXJlRXZlbnQuY2xpY2soc2NyZWVuLmdldEJ5VGVzdElkKCdyZW1vdmUtMScpKTsKICAgIGZpcmVFdmVudC5jbGljayhzY3JlZW4uZ2V0QnlUZXN0SWQoJ2FkZC1saW5lJykpOwogICAgdHlwZUludG8oJ3NrdS0zJywgJ1NLVS1ORVcnKTsKCiAgICBleHBlY3QoW3ZhbHVlT2YoJ3NrdS0xJyksIHZhbHVlT2YoJ3NrdS0yJyksIHZhbHVlT2YoJ3NrdS0zJyldKS50b0VxdWFsKFsnU0tVLUInLCAnU0tVLUMnLCAnU0tVLU5FVyddKTsKICAgIGV4cGVjdChkdXBsaWNhdGVLZXlXYXJuaW5ncygpKS50b0VxdWFsKFtdKTsKICB9KTsKCiAgaXQoJ2VkaXRzIG9ubHkgdGhlIGxpbmUgdGhhdCB3YXMgY2hhbmdlZCcsIGFzeW5jICgpID0+IHsKICAgIGF3YWl0IG9wZW5QbygpOwoKICAgIHR5cGVJbnRvKCdxdHktMicsICc3Jyk7CgogICAgZXhwZWN0KFt2YWx1ZU9mKCdxdHktMScpLCB2YWx1ZU9mKCdxdHktMicpLCB2YWx1ZU9mKCdxdHktMycpXSkudG9FcXVhbChbMTAsIDcsIDFdKTsKICAgIGV4cGVjdChkdXBsaWNhdGVLZXlXYXJuaW5ncygpKS50b0VxdWFsKFtdKTsKICB9KTsKCiAgaXQoJ3JlbW92ZXMgb25seSB0aGUgbGluZSB0aGF0IHdhcyByZW1vdmVkJywgYXN5bmMgKCkgPT4gewogICAgYXdhaXQgb3BlblBvKCk7CgogICAgZmlyZUV2ZW50LmNsaWNrKHNjcmVlbi5nZXRCeVRlc3RJZCgncmVtb3ZlLTEnKSk7CgogICAgZXhwZWN0KHNjcmVlbi5nZXRBbGxCeVRlc3RJZCgnbGluZScpKS50b0hhdmVMZW5ndGgoMik7CiAgICBleHBlY3QodmFsdWVPZignc2t1LTEnKSkudG9CZSgnU0tVLUInKTsKICB9KTsKCiAgaXQoJ2tlZXBzIGxpbmVzIHRoYXQgd2VyZSBhZGRlZCBxdWlja2x5IGFwYXJ0JywgYXN5bmMgKCkgPT4gewogICAgYXdhaXQgb3BlblBvKCk7CgogICAgZmlyZUV2ZW50LmNsaWNrKHNjcmVlbi5nZXRCeVRlc3RJZCgnYWRkLWxpbmUnKSk7CiAgICBmaXJlRXZlbnQuY2xpY2soc2NyZWVuLmdldEJ5VGVzdElkKCdhZGQtbGluZScpKTsKICAgIHR5cGVJbnRvKCdza3UtNScsICdTS1UtWicpOwoKICAgIGV4cGVjdChzY3JlZW4uZ2V0QWxsQnlUZXN0SWQoJ2xpbmUnKSkudG9IYXZlTGVuZ3RoKDUpOwogICAgZXhwZWN0KFt2YWx1ZU9mKCdza3UtMScpLCB2YWx1ZU9mKCdza3UtNCcpLCB2YWx1ZU9mKCdza3UtNScpXSkudG9FcXVhbChbJ1NLVS1BJywgJycsICdTS1UtWiddKTsKICAgIGV4cGVjdChkdXBsaWNhdGVLZXlXYXJuaW5ncygpKS50b0VxdWFsKFtdKTsKICB9KTsKfSk7CgpkZXNjcmliZSgndG90YWxzIGFuZCB1bmRvJywgKCkgPT4gewogIGl0KCdzaG93cyB0aGUgdG90YWxzIG9mIHRoZSBpbXBvcnRlZCBQTycsIGFzeW5jICgpID0+IHsKICAgIGF3YWl0IG9wZW5QbygpOwoKICAgIGV4cGVjdCh0ZXh0Q29udGVudChzY3JlZW4uZ2V0QnlUZXN0SWQoJ3RvdGFsLW5ldCcpKSkudG9CZSgn4oK5OSw5OTguMDAnKTsKICAgIGV4cGVjdCh0ZXh0Q29udGVudChzY3JlZW4uZ2V0QnlUZXN0SWQoJ3RvdGFsLXRheCcpKSkudG9CZSgn4oK5MSw2NDkuNjQnKTsKICAgIGV4cGVjdChncm9zcygpKS50b0JlKCfigrkxMSw2NDcuNjQnKTsKICB9KTsKCiAgaXQoJ3VwZGF0ZXMgdGhlIHRvdGFscyBvbiBldmVyeSBlZGl0JywgYXN5bmMgKCkgPT4gewogICAgYXdhaXQgb3BlblBvKCk7CgogICAgdHlwZUludG8oJ3F0eS0xJywgJzQnKTsKCiAgICBleHBlY3QodGV4dENvbnRlbnQoc2NyZWVuLmdldEJ5VGVzdElkKCd0b3RhbC0xJykpKS50b0JlKCfigrkxLDAwMC4wMCcpOwogICAgZXhwZWN0KGdyb3NzKCkpLnRvQmUoJ+KCuTksOTY3LjY0Jyk7CiAgfSk7CgogIGl0KCdrZWVwcyB0d28gUE8gbGluZXMgd2l0aCB0aGUgc2FtZSBTS1UgYXBhcnQnLCBhc3luYyAoKSA9PiB7CiAgICBjb25zdCBhcGkgPSBjcmVhdGVGYWtlQXBpKCk7CiAgICBjb25zdCBbcGFwZXJdID0gUE9fTElORVM7CiAgICBhcGkuZ2V0UG9MaW5lcy5tb2NrSW1wbGVtZW50YXRpb24oYXN5bmMgKCkgPT4gWwogICAgICB7IC4uLnBhcGVyISB9LAogICAgICB7IC4uLnBhcGVyISwgZGVzY3JpcHRpb246ICdDb3BpZXIgcGFwZXIgQTQgKHNlY29uZCBkZWxpdmVyeSknIH0sCiAgICBdKTsKICAgIGF3YWl0IG9wZW5QbyhhcGkpOwoKICAgIHR5cGVJbnRvKCdxdHktMicsICc3Jyk7CgogICAgZXhwZWN0KHZhbHVlT2YoJ3F0eS0xJykpLnRvQmUoMTApOwogICAgZXhwZWN0KHZhbHVlT2YoJ3F0eS0yJykpLnRvQmUoNyk7CiAgICBleHBlY3QoZHVwbGljYXRlS2V5V2FybmluZ3MoKSkudG9FcXVhbChbXSk7CiAgfSk7CgogIGl0KCd1bmRvIHB1dHMgYmFjayB0aGUgcHJldmlvdXMgcXVhbnRpdHkgYW5kIHRvdGFscycsIGFzeW5jICgpID0+IHsKICAgIGF3YWl0IG9wZW5QbygpOwogICAgdHlwZUludG8oJ3F0eS0xJywgJzQnKTsKCiAgICBmaXJlRXZlbnQuY2xpY2soc2NyZWVuLmdldEJ5VGVzdElkKCd1bmRvJykpOwoKICAgIGV4cGVjdCh2YWx1ZU9mKCdxdHktMScpKS50b0JlKDEwKTsKICAgIGV4cGVjdChncm9zcygpKS50b0JlKCfigrkxMSw2NDcuNjQnKTsKICB9KTsKCiAgaXQoJ2FuIGVkaXQgbmV2ZXIgY2hhbmdlcyB0aGUgdmVyc2lvbiB0aGF0IFVuZG8gcmV0dXJucyB0bycsICgpID0+IHsKICAgIGNvbnN0IGltcG9ydGVkOiBJbnZvaWNlU3RhdGUgPSB7CiAgICAgIC4uLmluaXRpYWxTdGF0ZSwKICAgICAgbGluZXM6IFBPX0xJTkVTLm1hcCgobGluZSwgaSkgPT4gKHsgLi4ubGluZSwgaWQ6IGBsaW5lLSR7aSArIDF9YCB9KSksCiAgICB9OwogICAgY29uc3QgaWQgPSBpbXBvcnRlZC5saW5lc1swXSEuaWQ7CgogICAgY29uc3QgZWRpdGVkID0gaW52b2ljZVJlZHVjZXIoaW1wb3J0ZWQsIHsgdHlwZTogJ3VwZGF0ZUxpbmUnLCBpZCwgcGF0Y2g6IHsgcXVhbnRpdHk6IDk5IH0gfSk7CgogICAgZXhwZWN0KGltcG9ydGVkLmxpbmVzWzBdIS5xdWFudGl0eSkudG9CZSgxMCk7CiAgICBleHBlY3QoZWRpdGVkLmxpbmVzWzBdIS5xdWFudGl0eSkudG9CZSg5OSk7CiAgICBleHBlY3QoZWRpdGVkLmxpbmVzKS5ub3QudG9CZShpbXBvcnRlZC5saW5lcyk7CiAgfSk7Cn0pOwo=', 'base64'), 'UTF8'), true, 12),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/MoneyInput.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgZmlyZUV2ZW50LCBzY3JlZW4sIHRleHRDb250ZW50IH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IHsgcGFyc2VSdXBlZXMgfSBmcm9tICcuLi9zcmMvdXRpbHMvbW9uZXknOwppbXBvcnQgeyBvcGVuUG8sIHR5cGVJbnRvLCB2YWx1ZU9mIH0gZnJvbSAnLi9zdXBwb3J0L2Zha2VBcGknOwoKY29uc3QgbGluZVRvdGFsID0gKCkgPT4gdGV4dENvbnRlbnQoc2NyZWVuLmdldEJ5VGVzdElkKCd0b3RhbC0xJykpOwoKZGVzY3JpYmUoJ3ByaWNlIGZpZWxkJywgKCkgPT4gewogIGl0KCdrZWVwcyB0aGUgZGVjaW1hbCBwb2ludCB3aGlsZSB0aGUgc3VwcGxpZXIgdHlwZXMg4oK5MTIuNTAnLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsKCiAgICB0eXBlSW50bygncHJpY2UtMScsICcxMi4nKTsKICAgIGV4cGVjdCh2YWx1ZU9mKCdwcmljZS0xJykpLnRvQmUoJzEyLicpOwogICAgdHlwZUludG8oJ3ByaWNlLTEnLCAnMTIuNScpOwoKICAgIGV4cGVjdCh2YWx1ZU9mKCdwcmljZS0xJykpLnRvQmUoJzEyLjUnKTsKICAgIGV4cGVjdChsaW5lVG90YWwoKSkudG9CZSgn4oK5MTI1LjAwJyk7CiAgfSk7CgogIGl0KCdzaG93cyBleGFjdGx5IHdoYXQgd2FzIHR5cGVkIHdoaWxlIHR5cGluZyAo4oK5MTIuMCwg4oK5MC4wNSknLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsKCiAgICB0eXBlSW50bygncHJpY2UtMScsICcxMi4wJyk7CiAgICBleHBlY3QodmFsdWVPZigncHJpY2UtMScpKS50b0JlKCcxMi4wJyk7CiAgICBmb3IgKGNvbnN0IHRleHQgb2YgWycwJywgJzAuJywgJzAuMCcsICcwLjA1J10pIHsKICAgICAgdHlwZUludG8oJ3ByaWNlLTEnLCB0ZXh0KTsKICAgICAgZXhwZWN0KHZhbHVlT2YoJ3ByaWNlLTEnKSkudG9CZSh0ZXh0KTsKICAgIH0KICAgIGV4cGVjdChsaW5lVG90YWwoKSkudG9CZSgn4oK5MC41MCcpOwogIH0pOwoKICBpdCgnc2hvd3MgdGhlIHJlc3RvcmVkIHByaWNlIGFmdGVyIFVuZG8nLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsKCiAgICB0eXBlSW50bygncHJpY2UtMScsICc5OScpOwogICAgY29uc3QgcHJpY2UgPSBzY3JlZW4uZ2V0QnlUZXN0SWQoJ3ByaWNlLTEnKTsKICAgIGlmIChwcmljZS5wcm9wcy5vbkJsdXIpIGZpcmVFdmVudChwcmljZSwgJ2JsdXInLCB7IHRhcmdldDogeyB2YWx1ZTogJzk5JyB9IH0pOyAvLyB0aGUgZmllbGQgaXMgbGVmdAogICAgZmlyZUV2ZW50LmNsaWNrKHNjcmVlbi5nZXRCeVRlc3RJZCgndW5kbycpKTsKCiAgICBleHBlY3QocGFyc2VSdXBlZXMoU3RyaW5nKHZhbHVlT2YoJ3ByaWNlLTEnKSkpKS50b0JlKDI1XzAwMCk7CiAgICBleHBlY3QobGluZVRvdGFsKCkpLnRvQmUoJ+KCuTIsNTAwLjAwJyk7CiAgfSk7CgogIGl0KCdjYW4gYmUgY2xlYXJlZCBhbmQgdHlwZWQgYWdhaW4nLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsKCiAgICB0eXBlSW50bygncHJpY2UtMScsICcnKTsKICAgIGV4cGVjdCh2YWx1ZU9mKCdwcmljZS0xJykpLnRvQmUoJycpOwogICAgdHlwZUludG8oJ3ByaWNlLTEnLCAnOTknKTsKCiAgICBleHBlY3QodmFsdWVPZigncHJpY2UtMScpKS50b0JlKCc5OScpOwogICAgZXhwZWN0KGxpbmVUb3RhbCgpKS50b0JlKCfigrk5OTAuMDAnKTsKICB9KTsKCiAgaXQoJ2FjY2VwdHMgYSBwYXN0ZWQgYW1vdW50IHdpdGggZGlnaXQgZ3JvdXBpbmcnLCBhc3luYyAoKSA9PiB7CiAgICBhd2FpdCBvcGVuUG8oKTsKCiAgICB0eXBlSW50bygncHJpY2UtMScsICcxLDI1MC41MCcpOwoKICAgIGV4cGVjdChsaW5lVG90YWwoKSkudG9CZSgn4oK5MTIsNTA1LjAwJyk7CiAgfSk7Cn0pOwoKZGVzY3JpYmUoJ3BhcnNlUnVwZWVzJywgKCkgPT4gewogIGl0KCdyZWFkcyBwbGFpbiwgZ3JvdXBlZCBhbmQg4oK5IGFtb3VudHMnLCAoKSA9PiB7CiAgICBleHBlY3QocGFyc2VSdXBlZXMoJzEyNTAnKSkudG9CZSgxMjVfMDAwKTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygnOTkuOScpKS50b0JlKDlfOTkwKTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygnMC4yOScpKS50b0JlKDI5KTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygnMSwyNTAuNTAnKSkudG9CZSgxMjVfMDUwKTsKICAgIGV4cGVjdChwYXJzZVJ1cGVlcygn4oK5IDEsMjMsNDU2JykpLnRvQmUoMTJfMzQ1XzYwMCk7CiAgICBleHBlY3QocGFyc2VSdXBlZXMoJyAxMi41ICcpKS50b0JlKDFfMjUwKTsKICB9KTsKCiAgaXQoJ3JlamVjdHMgYW55dGhpbmcgdGhhdCBpcyBub3QgYSB2YWxpZCBhbW91bnQnLCAoKSA9PiB7CiAgICBmb3IgKGNvbnN0IHRleHQgb2YgWycnLCAnLicsICdhYmMnLCAnMTJhYmMnLCAnMS4wMDUnLCAnLTUnLCAnMS4yLjMnLCAnMWUzJywgJzB4MTAnLCAnSW5maW5pdHknXSkgewogICAgICBleHBlY3QoW3RleHQsIHBhcnNlUnVwZWVzKHRleHQpXSkudG9FcXVhbChbdGV4dCwgbnVsbF0pOwogICAgfQogIH0pOwp9KTsK', 'base64'), 'UTF8'), true, 13),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/dates.test.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgcmVuZGVyLCBzY3JlZW4sIHRleHRDb250ZW50IH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgSW52b2ljZUJ1aWxkZXIgfSBmcm9tICcuLi9zcmMvSW52b2ljZUJ1aWxkZXInOwppbXBvcnQgeyB0b2RheUluSW5kaWEgfSBmcm9tICcuLi9zcmMvdXRpbHMvZGF0ZXMnOwppbXBvcnQgeyBjcmVhdGVGYWtlQXBpIH0gZnJvbSAnLi9zdXBwb3J0L2Zha2VBcGknOwoKZGVzY3JpYmUoJ2ludm9pY2UgZGF0ZSAoSVNUKScsICgpID0+IHsKICBpdCgnaXMgdGhlIEluZGlhbiBkYXRlIGp1c3QgYWZ0ZXIgbWlkbmlnaHQgaW4gSW5kaWEnLCAoKSA9PiB7CiAgICBleHBlY3QodG9kYXlJbkluZGlhKG5ldyBEYXRlKCcyMDI2LTAzLTMxVDE4OjMwOjAwWicpKSkudG9CZSgnMjAyNi0wNC0wMScpOyAvLyAwMDowMCBJU1QKICAgIGV4cGVjdCh0b2RheUluSW5kaWEobmV3IERhdGUoJzIwMjYtMDQtMDFUMDA6MDA6MDBaJykpKS50b0JlKCcyMDI2LTA0LTAxJyk7IC8vIDA1OjMwIElTVAogIH0pOwoKICBpdCgnaXMgdGhlIEluZGlhbiBkYXRlIGxhdGUgaW4gdGhlIGV2ZW5pbmcnLCAoKSA9PiB7CiAgICBleHBlY3QodG9kYXlJbkluZGlhKG5ldyBEYXRlKCcyMDI2LTAzLTMxVDE4OjI5OjU5WicpKSkudG9CZSgnMjAyNi0wMy0zMScpOyAvLyAyMzo1OTo1OSBJU1QKICAgIGV4cGVjdCh0b2RheUluSW5kaWEobmV3IERhdGUoJzIwMjYtMTItMzFUMTg6Mjk6MDBaJykpKS50b0JlKCcyMDI2LTEyLTMxJyk7CiAgfSk7CgogIGl0KCdkYXRlcyBhIG5ldyBpbnZvaWNlIHdpdGggdGhlIGRhdGUgaW4gSW5kaWEnLCAoKSA9PiB7CiAgICBqZXN0LnVzZUZha2VUaW1lcnMoKTsKICAgIGplc3Quc2V0U3lzdGVtVGltZShuZXcgRGF0ZSgnMjAyNi0wNC0zMFQxOTowMDowMFonKSk7IC8vIDAwOjMwIElTVCBvbiAxIE1heQogICAgcmVuZGVyKDxJbnZvaWNlQnVpbGRlciBhcGk9e2NyZWF0ZUZha2VBcGkoKX0gLz4pOwoKICAgIGV4cGVjdCh0ZXh0Q29udGVudChzY3JlZW4uZ2V0QnlUZXN0SWQoJ2ludm9pY2UtZGF0ZScpKSkudG9CZSgnMjAyNi0wNS0wMScpOwogIH0pOwp9KTsK', 'base64'), 'UTF8'), true, 14),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', '__tests__/support/fakeApi.tsx', 'typescript', convert_from(decode('aW1wb3J0IHsgYWN0LCBmaXJlRXZlbnQsIGZsdXNoUHJvbWlzZXMsIHJlbmRlciwgc2NyZWVuIH0gZnJvbSAnQGNvZGVhcmVuYS90ZXN0LXV0aWxzJzsKaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKaW1wb3J0IHsgSW52b2ljZUJ1aWxkZXIgfSBmcm9tICcuLi8uLi9zcmMvSW52b2ljZUJ1aWxkZXInOwppbXBvcnQgeyBTRUFSQ0hfREVCT1VOQ0VfTVMgfSBmcm9tICcuLi8uLi9zcmMvY29tcG9uZW50cy9Qb1BpY2tlcic7CmltcG9ydCB0eXBlIHsgSW52b2ljZUFwaSwgSW52b2ljZURyYWZ0LCBQb0xpbmUsIFBvU3VtbWFyeSB9IGZyb20gJy4uLy4uL3NyYy90eXBlcyc7CgpleHBvcnQgY29uc3QgUE9TOiBQb1N1bW1hcnlbXSA9IFsKICB7IGlkOiAncG8tMScsIG51bWJlcjogJ1BPLTIwMjYtMDA0MicsIGJ1eWVyOiAnWnljdXMgUHVuZScgfSwKICB7IGlkOiAncG8tMicsIG51bWJlcjogJ1BPLTIwMjYtMDA0MycsIGJ1eWVyOiAnWnljdXMgTXVtYmFpJyB9LApdOwoKLyoqIE5ldCDigrk5LDk5OC4wMCwgR1NUIOKCuTEsNjQ5LjY0LCB0b3RhbCDigrkxMSw2NDcuNjQuICovCmV4cG9ydCBjb25zdCBQT19MSU5FUzogUG9MaW5lW10gPSBbCiAgeyBza3U6ICdTS1UtQScsIGRlc2NyaXB0aW9uOiAnQ29waWVyIHBhcGVyIEE0JywgcXVhbnRpdHk6IDEwLCB1bml0UHJpY2VQYWlzZTogMjVfMDAwLCBnc3RSYXRlOiAxMiB9LAogIHsgc2t1OiAnU0tVLUInLCBkZXNjcmlwdGlvbjogJ1RvbmVyIGNhcnRyaWRnZScsIHF1YW50aXR5OiAyLCB1bml0UHJpY2VQYWlzZTogMzQ5XzkwMCwgZ3N0UmF0ZTogMTggfSwKICB7IHNrdTogJ1NLVS1DJywgZGVzY3JpcHRpb246ICdEZWxpdmVyeScsIHF1YW50aXR5OiAxLCB1bml0UHJpY2VQYWlzZTogNTBfMDAwLCBnc3RSYXRlOiAxOCB9LApdOwoKLyoqIFRoZSBBUEksIHJlY29yZGluZyBjYWxscyBpbiBvcmRlci4gRHJhZnRzIGFyZSBjb3BpZWQgd2hlbiB0aGV5IGFyZSBzZW50LCBhcyB0aGUgbmV0d29yayB3b3VsZC4gKi8KZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZha2VBcGkoKSB7CiAgY29uc3QgbG9nOiBzdHJpbmdbXSA9IFtdOwogIGNvbnN0IHNhdmVkOiBJbnZvaWNlRHJhZnRbXSA9IFtdOwogIGNvbnN0IHN1Ym1pdHRlZDogSW52b2ljZURyYWZ0W10gPSBbXTsKICBjb25zdCBhcGkgPSB7CiAgICBsb2csCiAgICBzYXZlZCwKICAgIHN1Ym1pdHRlZCwKICAgIHNlYXJjaFBvczogamVzdC5mbihhc3luYyAocXVlcnk6IHN0cmluZykgPT4gewogICAgICBsb2cucHVzaChgc2VhcmNoOiR7cXVlcnl9YCk7CiAgICAgIGNvbnN0IHEgPSBxdWVyeS50b0xvd2VyQ2FzZSgpOwogICAgICByZXR1cm4gUE9TLmZpbHRlcigocG8pID0+IHBvLm51bWJlci50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpIHx8IHBvLmJ1eWVyLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSkpOwogICAgfSksCiAgICBnZXRQb0xpbmVzOiBqZXN0LmZuKGFzeW5jIChwb0lkOiBzdHJpbmcpID0+IHsKICAgICAgbG9nLnB1c2goYGxpbmVzOiR7cG9JZH1gKTsKICAgICAgcmV0dXJuIFBPX0xJTkVTLm1hcCgobGluZSkgPT4gKHsgLi4ubGluZSB9KSk7CiAgICB9KSwKICAgIHNhdmVEcmFmdDogamVzdC5mbihhc3luYyAoZHJhZnQ6IEludm9pY2VEcmFmdCkgPT4gewogICAgICBsb2cucHVzaCgnc2F2ZScpOwogICAgICBzYXZlZC5wdXNoKHN0cnVjdHVyZWRDbG9uZShkcmFmdCkpOwogICAgfSksCiAgICBzdWJtaXQ6IGplc3QuZm4oYXN5bmMgKGRyYWZ0OiBJbnZvaWNlRHJhZnQpID0+IHsKICAgICAgbG9nLnB1c2goJ3N1Ym1pdCcpOwogICAgICBzdWJtaXR0ZWQucHVzaChzdHJ1Y3R1cmVkQ2xvbmUoZHJhZnQpKTsKICAgIH0pLAogIH0gc2F0aXNmaWVzIEludm9pY2VBcGkgJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjsKICByZXR1cm4gYXBpOwp9CgpleHBvcnQgdHlwZSBGYWtlQXBpID0gUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlRmFrZUFwaT47CgovKiogUmVuZGVycyB0aGUgYnVpbGRlciB3aXRoIGZha2UgdGltZXJzLCBmaW5kcyBQTy0yMDI2LTAwNDIgYW5kIGltcG9ydHMgaXRzIGxpbmVzLiAqLwpleHBvcnQgYXN5bmMgZnVuY3Rpb24gb3BlblBvKGFwaTogRmFrZUFwaSA9IGNyZWF0ZUZha2VBcGkoKSkgewogIGplc3QudXNlRmFrZVRpbWVycygpOwogIGNvbnN0IHV0aWxzID0gcmVuZGVyKDxJbnZvaWNlQnVpbGRlciBhcGk9e2FwaX0gLz4pOwogIGZpcmVFdmVudC5jaGFuZ2Uoc2NyZWVuLmdldEJ5VGVzdElkKCdwby1zZWFyY2gnKSwgeyB0YXJnZXQ6IHsgdmFsdWU6ICcwMDQyJyB9IH0pOwogIGFjdCgoKSA9PiBqZXN0LmFkdmFuY2VUaW1lcnNCeVRpbWUoU0VBUkNIX0RFQk9VTkNFX01TKSk7CiAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogIGZpcmVFdmVudC5jbGljayhzY3JlZW4uZ2V0QnlUZXN0SWQoJ3BvLXBvLTEnKSk7CiAgYXdhaXQgZmx1c2hQcm9taXNlcygpOwogIHJldHVybiB7IGFwaSwgLi4udXRpbHMgfTsKfQoKLyoqIFR5cGVzIGludG8gYW4gaW5wdXQgKGEgY2hhbmdlIGV2ZW50IHdpdGggdGhlIG5ldyB0ZXh0KS4gKi8KZXhwb3J0IGZ1bmN0aW9uIHR5cGVJbnRvKHRlc3RJZDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7CiAgZmlyZUV2ZW50LmNoYW5nZShzY3JlZW4uZ2V0QnlUZXN0SWQodGVzdElkKSwgeyB0YXJnZXQ6IHsgdmFsdWUgfSB9KTsKfQoKZXhwb3J0IGNvbnN0IHZhbHVlT2YgPSAodGVzdElkOiBzdHJpbmcpOiB1bmtub3duID0+IHNjcmVlbi5nZXRCeVRlc3RJZCh0ZXN0SWQpLnByb3BzLnZhbHVlOwo=', 'base64'), 'UTF8'), true, 15),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'package.json', 'json', convert_from(decode('ewogICJuYW1lIjogInp5Y3VzLXN1cHBsaWVyLXBvcnRhbC1pbnZvaWNlcyIsCiAgInZlcnNpb24iOiAiMy40LjAiLAogICJwcml2YXRlIjogdHJ1ZSwKICAic2NyaXB0cyI6IHsKICAgICJkZXYiOiAidml0ZSIsCiAgICAidGVzdCI6ICJqZXN0IgogIH0sCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJyZWFjdCI6ICIxOS4xLjAiLAogICAgInJlYWN0LWRvbSI6ICIxOS4xLjAiCiAgfSwKICAiZGV2RGVwZW5kZW5jaWVzIjogewogICAgIkB0ZXN0aW5nLWxpYnJhcnkvcmVhY3QiOiAiMTYuMy4wIiwKICAgICJqZXN0IjogIjI5LjcuMCIsCiAgICAidHlwZXNjcmlwdCI6ICI1LjguMyIsCiAgICAidml0ZSI6ICI3LjEuNSIKICB9Cn0K', 'base64'), 'UTF8'), true, 16)
  on conflict (question_id, path) do update set language = excluded.language, content = excluded.content,
    readonly = excluded.readonly, sort_order = excluded.sort_order;
  delete from public.question_rubric_items where question_id = 'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13' and key <> all (array['autosave', 'debounce', 'identity', 'immutability', 'money_input', 'timezone', 'code_quality']::text[]);
  insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'autosave', 'Autosave saves the latest draft, and never after submit or close', convert_from(decode('TGF0ZXN0IGNhbGxiYWNrIHRocm91Z2ggYSByZWYgdXBkYXRlZCBpbiBhbiBlZmZlY3QgKG5vdCBtZW1vIGRlcHMsIG5vdCByZW5kZXItdGltZSBhc3NpZ25tZW50KTsgdGltZXIgY2xlYXJlZCBvbiB1bm1vdW50OyBwZW5kaW5nIGF1dG9zYXZlIGNhbmNlbGxlZCAob3IgZmx1c2hlZCkgb24gc3VibWl0Lg==', 'base64'), 'UTF8'), 6, 0),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'debounce', 'Search is debounced once', 'Explains that useMemo with an unstable dependency rebuilt the debounce every render; one debounced function per component, cleaned up on unmount.', 3, 1),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'identity', 'Lines have unique ids', 'Replaces Date.now() ids with a counter / randomUUID; explains the duplicate keys and the by-id updates hitting several lines; no index keys.', 3, 2),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'immutability', 'State updates are immutable', 'updateLine returns a new array and object; explains reference equality in useMemo/useEffect deps and why Undo broke.', 4, 3),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'money_input', 'Price field and parsing are correct', 'Local text state while typing, parent updated only with valid amounts; parseRupees validates the whole string, strips ₹/commas, no float * 100.', 4, 4),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'timezone', 'Invoice date is the date in India', 'Intl.DateTimeFormat with timeZone Asia/Kolkata instead of the UTC date from toISOString.', 2, 5),
    ('f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 'code_quality', 'Root-cause fixes, clean code', 'No test special-casing, no eslint-disable to hide real dependency problems, readable explanations.', 2, 6)
  on conflict (question_id, key) do update set criterion = excluded.criterion,
    description = excluded.description, max_points = excluded.max_points, sort_order = excluded.sort_order;
  insert into public.question_solutions (question_id, notes_md, files) values (
    'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', convert_from(decode('IyMgUmV2aWV3ZXIgbm90ZXM6IFN1cHBsaWVyIEludm9pY2UgQnVpbGRlcgoKQWxsIHRlc3RzIGZhaWwgb24gdGhlIHN0YXJ0ZXIgY29kZSB3aGVyZSBhIHBsYW50ZWQgYnVnIHNpdHMsIGFuZCBwYXNzIHdpdGggdGhpcyByZWZlcmVuY2UKc29sdXRpb24uIFJlYWQgdGhlIGRpZmY6IHRoZSBleHBsYW5hdGlvbnMgaW4gY29tbWVudHMgbWF0dGVyIGFzIG11Y2ggYXMgdGhlIGdyZWVuIHRlc3RzLgoKIyMjIDEuIFN0YWxlIGF1dG9zYXZlIChgdXNlRGVib3VuY2VkQ2FsbGJhY2tgKQoKVGhlIGhvb2sgbWVtb2lzZXMgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBvbiBgW2RlbGF5TXNdYCBvbmx5LiBJdCBjbG9zZXMgb3ZlciB0aGUgKipmaXJzdApyZW5kZXIncyoqIGBmbmAsIGFuZCBzbyBvdmVyIHRoZSBmaXJzdCByZW5kZXIncyBgZHJhZnRgLgoKLSAqKkZpeDoqKiBrZWVwIHRoZSBsYXRlc3QgYGZuYCBpbiBhIHJlZiwgdXBkYXRlZCBpbiBhbiBlZmZlY3QgKGB1c2VMYXlvdXRFZmZlY3RgIC8KICBgdXNlSW5zZXJ0aW9uRWZmZWN0YCwgb3IgUmVhY3QgMTkncyBgdXNlRWZmZWN0RXZlbnRgKSwgYW5kIGNhbGwgYHJlZi5jdXJyZW50YCBmcm9tIHRoZSB0aW1lci4KLSAqKlJlZCBmbGFnczoqKgogIC0gYWRkaW5nIGBmbmAgdG8gdGhlIG1lbW8gZGVwczogdGhlIGRlYm91bmNlIGlzIHJlY3JlYXRlZCBldmVyeSByZW5kZXIgYW5kIG5ldmVyIGNvYWxlc2NlczsKICAtIGFzc2lnbmluZyB0aGUgcmVmIGR1cmluZyByZW5kZXI6IHdvcmtzLCBidXQgYnJlYWtzIFJlYWN0J3MgcnVsZXMgKHRlYXJpbmcgaW4gY29uY3VycmVudAogICAgcmVuZGVyaW5nKSwgc28gaXQgZ2V0cyBvbmx5IHBhcnRpYWwgY3JlZGl0LgoKIyMjIDIuIFNhdmVzIGFmdGVyIHN1Ym1pdCAvIGNsb3NlCgotIFRoZSBob29rIG5ldmVyIGNsZWFycyBpdHMgdGltZXIgb24gdW5tb3VudDogYHVzZUVmZmVjdCgoKSA9PiBjYW5jZWwsIFtkZWJvdW5jZWRdKWAuCi0gYHN1Ym1pdGAgZGlkbid0IGNhbmNlbCB0aGUgcGVuZGluZyBhdXRvc2F2ZS4gYGZsdXNoKClgIGJlZm9yZSBzdWJtaXR0aW5nIGlzIGFsc28gZmluZSBpZiB0aGV5CiAgYWRkIGl0LCBidXQgdGhlIGF1dG9zYXZlIG11c3Qgbm90IGxhbmQgYWZ0ZXIgdGhlIHN1Ym1pdC4KCiMjIyAzLiBTZWFyY2ggb24gZXZlcnkga2V5c3Ryb2tlIChgUG9QaWNrZXJgKQoKYHVzZU1lbW8oKCkgPT4gZGVib3VuY2Uoc2VhcmNoKSwgW3NlYXJjaF0pYDogYHNlYXJjaGAgaXMgYSBuZXcgZnVuY3Rpb24gZXZlcnkgcmVuZGVyLCBzbyBldmVyeQprZXlzdHJva2UgYnVpbGRzIGEgbmV3IGRlYm91bmNlIHdpdGggaXRzIG93biB0aW1lci4KCi0gKipBY2NlcHQ6KiogdGhlIGZpeGVkIGB1c2VEZWJvdW5jZWRDYWxsYmFja2AsIGEgYHVzZVJlZmAtaGVsZCBkZWJvdW5jZSB3aXRoIGEgbGF0ZXN0LWNhbGxiYWNrCiAgcmVmLCBvciBgdXNlTWVtbyhbXSlgIHBsdXMgYSByZWYuIEFsc28gY2xlYW4gdXAgb24gdW5tb3VudC4KLSAqKkJvbnVzOioqIGlnbm9yaW5nIG91dC1vZi1vcmRlciByZXNwb25zZXMgKEFib3J0Q29udHJvbGxlciBvciBhIHJlcXVlc3QgaWQpLgoKIyMjIDQuIExpbmUgaWRzIChgaW52b2ljZVJlZHVjZXJgKQoKYGxpbmUtJHtEYXRlLm5vdygpfWAgZ2l2ZXMgZXZlcnkgbGluZSBtYWRlIGluIHRoZSBzYW1lIG1pbGxpc2Vjb25kIHRoZSBzYW1lIGlkOiBhIHdob2xlIGltcG9ydCwKb3IgcXVpY2sgY2xpY2tzLiBSZWFjdCBrZXlzIGNvbGxpZGUsIGFuZCBgdXBkYXRlTGluZWAvYHJlbW92ZUxpbmVgIGJ5IGlkIGhpdCB0aGUgd3JvbmcgbGluZXMgb3IKc2V2ZXJhbCBhdCBvbmNlLgoKLSAqKkFjY2VwdDoqKiBhIGNvdW50ZXIsIGBjcnlwdG8ucmFuZG9tVVVJRCgpYCAoc2VjdXJlIGNvbnRleHRzIG9ubHk7IG1lbnRpb24gaXQpLCBvciBhCiAgcmVmLWJhc2VkIGlkIGdlbmVyYXRvciBpbiB0aGUgY29tcG9uZW50IHRoYXQgcGFzc2VzIHRoZSBpZHMgaW4gdGhlIGFjdGlvbnMuCi0gKipSZWQgZmxhZzoqKiBpZHMgZGVyaXZlZCBmcm9tIHBvc2l0aW9ucyAoYGxpbmUtJHtpbmRleH1gLCBgbGluZXMubGVuZ3RoYCk6IHRoZXkgY29sbGlkZSBvbmNlIGEKICBsaW5lIGlzIHJlbW92ZWQgYW5kIGFub3RoZXIgYWRkZWQuCi0gKipSZWQgZmxhZzoqKiBpbmRleCBrZXlzLiBUaGV5IGJyZWFrIHRoZSBtb21lbnQgYSBsaW5lIGlzIHJlbW92ZWQuCgojIyMgNS4gTXV0YXRpb24gKGB1cGRhdGVMaW5lYCkKCmBPYmplY3QuYXNzaWduKGxpbmUsIHBhdGNoKWAgcGx1cyB0aGUgc2FtZSBhcnJheSBtZWFucyBgdXNlTWVtbyhbc3RhdGUubGluZXNdKWAgKHRvdGFscykgYW5kIHRoZQphdXRvc2F2ZSBlZmZlY3QgbmV2ZXIgc2VlIHRoZSBlZGl0LiBUaGUgVW5kbyBzbmFwc2hvdCBpcyB0aGUgc2FtZSBtdXRhdGVkIGFycmF5LgoKLSAqKkZpeDoqKiBhIGBtYXBgIHRoYXQgcmV0dXJucyBhIG5ldyBvYmplY3QgZm9yIHRoZSBjaGFuZ2VkIGxpbmUuCi0gU3Ryb25nIGFuc3dlcnMgZXhwbGFpbiByZWZlcmVuY2UgZXF1YWxpdHkgaW4gYHVzZU1lbW9gL2B1c2VFZmZlY3RgIGRlcHMgYW5kIGB1c2VSZWR1Y2VyYCBiYWlsLW91dHMuCgojIyMgNi4gUHJpY2UgZmllbGQgKGBNb25leUlucHV0YCwgYHBhcnNlUnVwZWVzYCkKCi0gVGhlIGNvbnRyb2xsZWQgdmFsdWUgd2FzIHRoZSBwYXJzZWQgbnVtYmVyLiBUeXBpbmcgIjEyLiIgcmVuZGVyZWQgYmFjayAiMTIiLCBhbmQgIiIgcmVuZGVyZWQgYmFjayAiMCIuCi0gKipGaXg6Kioga2VlcCB0aGUgdGV4dCBiZWluZyB0eXBlZCBpbiBsb2NhbCBzdGF0ZSB3aGlsZSBlZGl0aW5nLiBDYWxsIGBvbkNoYW5nZWAgb25seSB3aXRoCiAgdmFsaWQgYW1vdW50cywgYW5kIHNob3cgdGhlIHBhcmVudCdzIHZhbHVlIGFnYWluIG9uIGJsdXIuCi0gYHBhcnNlRmxvYXRgIHN0b3BzIGF0IHRoZSBmaXJzdCBjb21tYSBhbmQgYWNjZXB0cyB0cmFpbGluZyBqdW5rLiBTdHJpcCDigrksIGNvbW1hcyBhbmQgc3BhY2VzLAogIHZhbGlkYXRlIHRoZSB3aG9sZSBzdHJpbmcgKOKJpCAyIGRlY2ltYWxzLCBub24tbmVnYXRpdmUpLCBhbmQgY29udmVydCBmcm9tIHRoZSBkaWdpdHMgcmF0aGVyIHRoYW4KICBgKiAxMDBgIGZsb2F0cy4KCiMjIyA3LiBJbnZvaWNlIGRhdGUKCmB0b0lTT1N0cmluZygpYCBpcyB0aGUgVVRDIGRhdGUuIFVzZSBgSW50bC5EYXRlVGltZUZvcm1hdGAgd2l0aCBgdGltZVpvbmU6ICdBc2lhL0tvbGthdGEnYAooYGZvcm1hdFRvUGFydHNgLCBvciB0aGUgYGVuLUNBYCBsb2NhbGUncyBZWVlZLU1NLUREKS4gQWRkaW5nIDUuNSBoIGJ5IGhhbmQgd29ya3MgZm9yIEluZGlhCihubyBEU1QpIGJ1dCBpcyBicml0dGxlLgotICoqUmVkIGZsYWcgdGhlIHRlc3RzIGNhbid0IGNhdGNoOioqIHRoZSBicm93c2VyJ3MgKmxvY2FsKiBkYXRlIChgZ2V0RGF0ZSgpYCwgb3IKICBgdG9Mb2NhbGVEYXRlU3RyaW5nKClgIHdpdGhvdXQgYHRpbWVab25lYCkuIEl0IHBhc3NlcyBpbiBhIGJyb3dzZXIgc2V0IHRvIEluZGlhIHRpbWUsIHdoaWNoIG1vc3QKICBjYW5kaWRhdGVzIGhhdmUsIGJ1dCBkYXRlcyBpbnZvaWNlcyB3cm9uZ2x5IGZvciBzdXBwbGllcnMgZWxzZXdoZXJlIChgSW52b2ljZURyYWZ0Lmludm9pY2VEYXRlYAogIHNheXMgImluIEluZGlhIHRpbWUsIHdoYXRldmVyIHRoZSBicm93c2VyJ3MgdGltZSB6b25lIikuCg==', 'base64'), 'UTF8'), (convert_from(decode('W3sicGF0aCI6InNyYy9JbnZvaWNlQnVpbGRlci50c3giLCJjb250ZW50IjoiaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWR1Y2VyLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IExpbmVSb3cgfSBmcm9tICcuL2NvbXBvbmVudHMvTGluZVJvdyc7XG5pbXBvcnQgeyBQb1BpY2tlciB9IGZyb20gJy4vY29tcG9uZW50cy9Qb1BpY2tlcic7XG5pbXBvcnQgeyB1c2VEZWJvdW5jZWRDYWxsYmFjayB9IGZyb20gJy4vaG9va3MvdXNlRGVib3VuY2VkQ2FsbGJhY2snO1xuaW1wb3J0IHsgaW5pdGlhbFN0YXRlLCBpbnZvaWNlUmVkdWNlciwgdG90YWxzIH0gZnJvbSAnLi9zdGF0ZS9pbnZvaWNlUmVkdWNlcic7XG5pbXBvcnQgdHlwZSB7IEludm9pY2VBcGksIEludm9pY2VEcmFmdCwgUG9TdW1tYXJ5IH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB0b2RheUluSW5kaWEgfSBmcm9tICcuL3V0aWxzL2RhdGVzJztcbmltcG9ydCB7IGZvcm1hdFBhaXNlIH0gZnJvbSAnLi91dGlscy9tb25leSc7XG5cbmV4cG9ydCBjb25zdCBBVVRPU0FWRV9NUyA9IDgwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIEludm9pY2VCdWlsZGVyKHsgYXBpIH06IHsgYXBpOiBJbnZvaWNlQXBpIH0pIHtcbiAgY29uc3QgW3N0YXRlLCBkaXNwYXRjaF0gPSB1c2VSZWR1Y2VyKGludm9pY2VSZWR1Y2VyLCBpbml0aWFsU3RhdGUpO1xuICBjb25zdCBbcG8sIHNldFBvXSA9IHVzZVN0YXRlPFBvU3VtbWFyeSB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbaW52b2ljZURhdGVdID0gdXNlU3RhdGUoKCkgPT4gdG9kYXlJbkluZGlhKCkpO1xuICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGU8J2RyYWZ0JyB8ICdzdWJtaXR0aW5nJyB8ICdzdWJtaXR0ZWQnPignZHJhZnQnKTtcblxuICBjb25zdCBkcmFmdDogSW52b2ljZURyYWZ0ID0geyBwb0lkOiBwbz8uaWQgPz8gbnVsbCwgaW52b2ljZURhdGUsIGxpbmVzOiBzdGF0ZS5saW5lcyB9O1xuXG4gIC8vIEF1dG9zYXZlIDAuOCBzIGFmdGVyIHRoZSBsYXN0IGNoYW5nZS5cbiAgY29uc3QgYXV0b3NhdmUgPSB1c2VEZWJvdW5jZWRDYWxsYmFjaygoKSA9PiB7XG4gICAgdm9pZCBhcGkuc2F2ZURyYWZ0KGRyYWZ0KTtcbiAgfSwgQVVUT1NBVkVfTVMpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHBvKSBhdXRvc2F2ZSgpO1xuICB9LCBbcG8sIHN0YXRlLmxpbmVzLCBhdXRvc2F2ZV0pO1xuXG4gIGNvbnN0IHN1bXMgPSB1c2VNZW1vKCgpID0+IHRvdGFscyhzdGF0ZS5saW5lcyksIFtzdGF0ZS5saW5lc10pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIGNob29zZVBvKG5leHQ6IFBvU3VtbWFyeSkge1xuICAgIHNldFBvKG5leHQpO1xuICAgIGRpc3BhdGNoKHsgdHlwZTogJ2ltcG9ydFBvTGluZXMnLCBsaW5lczogYXdhaXQgYXBpLmdldFBvTGluZXMobmV4dC5pZCkgfSk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBzdWJtaXQoKSB7XG4gICAgLy8gQSBwZW5kaW5nIGF1dG9zYXZlIHdvdWxkIGxhbmQgYWZ0ZXIgdGhlIHN1Ym1pdCBhbmQgdHVybiB0aGUgaW52b2ljZSBiYWNrIGludG8gYSBkcmFmdC5cbiAgICBhdXRvc2F2ZS5jYW5jZWwoKTtcbiAgICBzZXRTdGF0dXMoJ3N1Ym1pdHRpbmcnKTtcbiAgICBhd2FpdCBhcGkuc3VibWl0KGRyYWZ0KTtcbiAgICBzZXRTdGF0dXMoJ3N1Ym1pdHRlZCcpO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Zm9ybVxuICAgICAgZGF0YS10ZXN0aWQ9XCJpbnZvaWNlXCJcbiAgICAgIG9uU3VibWl0PXsoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgc3VibWl0KCk7XG4gICAgICB9fVxuICAgID5cbiAgICAgIDxQb1BpY2tlciBhcGk9e2FwaX0gb25TZWxlY3Q9e2Nob29zZVBvfSAvPlxuICAgICAgPHA+XG4gICAgICAgIEludm9pY2UgZGF0ZTogPHNwYW4gZGF0YS10ZXN0aWQ9XCJpbnZvaWNlLWRhdGVcIj57aW52b2ljZURhdGV9PC9zcGFuPlxuICAgICAgPC9wPlxuICAgICAgPGZpZWxkc2V0IGRpc2FibGVkPXtzdGF0dXMgIT09ICdkcmFmdCd9PlxuICAgICAgICB7c3RhdGUubGluZXMubWFwKChsaW5lLCBpKSA9PiAoXG4gICAgICAgICAgPExpbmVSb3dcbiAgICAgICAgICAgIGtleT17bGluZS5pZH1cbiAgICAgICAgICAgIHBvc2l0aW9uPXtpICsgMX1cbiAgICAgICAgICAgIGxpbmU9e2xpbmV9XG4gICAgICAgICAgICBvbkNoYW5nZT17KHBhdGNoKSA9PiBkaXNwYXRjaCh7IHR5cGU6ICd1cGRhdGVMaW5lJywgaWQ6IGxpbmUuaWQsIHBhdGNoIH0pfVxuICAgICAgICAgICAgb25SZW1vdmU9eygpID0+IGRpc3BhdGNoKHsgdHlwZTogJ3JlbW92ZUxpbmUnLCBpZDogbGluZS5pZCB9KX1cbiAgICAgICAgICAvPlxuICAgICAgICApKX1cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgZGF0YS10ZXN0aWQ9XCJhZGQtbGluZVwiIG9uQ2xpY2s9eygpID0+IGRpc3BhdGNoKHsgdHlwZTogJ2FkZExpbmUnIH0pfT5cbiAgICAgICAgICBBZGQgbGluZVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgZGF0YS10ZXN0aWQ9XCJ1bmRvXCIgZGlzYWJsZWQ9e3N0YXRlLnBhc3QubGVuZ3RoID09PSAwfSBvbkNsaWNrPXsoKSA9PiBkaXNwYXRjaCh7IHR5cGU6ICd1bmRvJyB9KX0+XG4gICAgICAgICAgVW5kb1xuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZmllbGRzZXQ+XG4gICAgICA8ZGw+XG4gICAgICAgIDxkdD5OZXQ8L2R0PlxuICAgICAgICA8ZGQgZGF0YS10ZXN0aWQ9XCJ0b3RhbC1uZXRcIj57Zm9ybWF0UGFpc2Uoc3Vtcy5uZXQpfTwvZGQ+XG4gICAgICAgIDxkdD5HU1Q8L2R0PlxuICAgICAgICA8ZGQgZGF0YS10ZXN0aWQ9XCJ0b3RhbC10YXhcIj57Zm9ybWF0UGFpc2Uoc3Vtcy50YXgpfTwvZGQ+XG4gICAgICAgIDxkdD5Ub3RhbDwvZHQ+XG4gICAgICAgIDxkZCBkYXRhLXRlc3RpZD1cInRvdGFsLWdyb3NzXCI+e2Zvcm1hdFBhaXNlKHN1bXMuZ3Jvc3MpfTwvZGQ+XG4gICAgICA8L2RsPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgZGF0YS10ZXN0aWQ9XCJzdWJtaXRcIiBkaXNhYmxlZD17c3RhdHVzICE9PSAnZHJhZnQnIHx8ICFwb30+XG4gICAgICAgIHtzdGF0dXMgPT09ICdzdWJtaXR0ZWQnID8gJ1N1Ym1pdHRlZCcgOiAnU3VibWl0IGludm9pY2UnfVxuICAgICAgPC9idXR0b24+XG4gICAgPC9mb3JtPlxuICApO1xufVxuIn0seyJwYXRoIjoic3JjL2NvbXBvbmVudHMvTW9uZXlJbnB1dC50c3giLCJjb250ZW50IjoiaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBwYXJzZVJ1cGVlcyB9IGZyb20gJy4uL3V0aWxzL21vbmV5JztcblxuaW50ZXJmYWNlIFByb3BzIHtcbiAgdGVzdElEOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIHBhaXNlOiBudW1iZXI7XG4gIG9uQ2hhbmdlKHBhaXNlOiBudW1iZXIpOiB2b2lkO1xufVxuXG5jb25zdCBhc1RleHQgPSAocGFpc2U6IG51bWJlcikgPT4gKHBhaXNlIC8gMTAwKS50b0ZpeGVkKDIpO1xuXG4vKipcbiAqIEEgcnVwZWUgYW1vdW50IGZpZWxkLiBUaGUgdmFsdWUgbGl2ZXMgaW4gdGhlIHBhcmVudCwgaW4gcGFpc2UuXG4gKlxuICogV2hpbGUgdGhlIHN1cHBsaWVyIHR5cGVzLCB0aGUgZmllbGQgc2hvd3MgdGhlaXIgdGV4dDogXCIxMi5cIiBvciBcIlwiIGFyZW4ndCBhbW91bnRzIHlldCwgYW5kXG4gKiByZW5kZXJpbmcgdGhlIHBhcnNlZCBudW1iZXIgYmFjayAoXCIxMlwiLCBcIjBcIikgYXRlIHRoZSBkZWNpbWFsIHBvaW50IGFuZCByZWZpbGxlZCBhIGNsZWFyZWRcbiAqIGZpZWxkLiBWYWxpZCB0ZXh0IHVwZGF0ZXMgdGhlIHBhcmVudDsgb3V0c2lkZSB0aGUgZWRpdCAoYmx1ciwgdW5kbywgaW1wb3J0KSB0aGUgZmllbGQgZm9sbG93c1xuICogdGhlIHBhcmVudCdzIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gTW9uZXlJbnB1dCh7IHRlc3RJRCwgbGFiZWwsIHBhaXNlLCBvbkNoYW5nZSB9OiBQcm9wcykge1xuICBjb25zdCBbZHJhZnQsIHNldERyYWZ0XSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBpbnZhbGlkID0gZHJhZnQgIT09IG51bGwgJiYgcGFyc2VSdXBlZXMoZHJhZnQpID09PSBudWxsO1xuXG4gIHJldHVybiAoXG4gICAgPGlucHV0XG4gICAgICBkYXRhLXRlc3RpZD17dGVzdElEfVxuICAgICAgYXJpYS1sYWJlbD17bGFiZWx9XG4gICAgICBhcmlhLWludmFsaWQ9e2ludmFsaWR9XG4gICAgICBpbnB1dE1vZGU9XCJkZWNpbWFsXCJcbiAgICAgIHZhbHVlPXtkcmFmdCA/PyBhc1RleHQocGFpc2UpfVxuICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgIHNldERyYWZ0KGUudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgY29uc3QgbmV4dCA9IHBhcnNlUnVwZWVzKGUudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgaWYgKG5leHQgIT09IG51bGwpIG9uQ2hhbmdlKG5leHQpO1xuICAgICAgfX1cbiAgICAgIG9uQmx1cj17KCkgPT4gc2V0RHJhZnQobnVsbCl9XG4gICAgLz5cbiAgKTtcbn1cbiJ9LHsicGF0aCI6InNyYy9jb21wb25lbnRzL1BvUGlja2VyLnRzeCIsImNvbnRlbnQiOiJpbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZURlYm91bmNlZENhbGxiYWNrIH0gZnJvbSAnLi4vaG9va3MvdXNlRGVib3VuY2VkQ2FsbGJhY2snO1xuaW1wb3J0IHR5cGUgeyBJbnZvaWNlQXBpLCBQb1N1bW1hcnkgfSBmcm9tICcuLi90eXBlcyc7XG5cbmV4cG9ydCBjb25zdCBTRUFSQ0hfREVCT1VOQ0VfTVMgPSAzMDA7XG5cbmludGVyZmFjZSBQcm9wcyB7XG4gIGFwaTogSW52b2ljZUFwaTtcbiAgb25TZWxlY3QocG86IFBvU3VtbWFyeSk6IHZvaWQ7XG59XG5cbi8qKiBUeXBlYWhlYWQ6IHNlYXJjaGVzIFBPcyBieSBudW1iZXIgb3IgYnV5ZXIgb25jZSB0aGUgc3VwcGxpZXIgcGF1c2VzIHR5cGluZy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBQb1BpY2tlcih7IGFwaSwgb25TZWxlY3QgfTogUHJvcHMpIHtcbiAgY29uc3QgW3F1ZXJ5LCBzZXRRdWVyeV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtyZXN1bHRzLCBzZXRSZXN1bHRzXSA9IHVzZVN0YXRlPFBvU3VtbWFyeVtdPihbXSk7XG5cbiAgLy8gYHNlYXJjaGAgaXMgYSBuZXcgZnVuY3Rpb24gb24gZXZlcnkgcmVuZGVyLCBzbyB1c2VNZW1vKCgpID0+IGRlYm91bmNlKHNlYXJjaCksIFtzZWFyY2hdKVxuICAvLyBidWlsdCBhIG5ldyBkZWJvdW5jZSAod2l0aCBpdHMgb3duIHRpbWVyKSBwZXIga2V5c3Ryb2tlOiBldmVyeSBrZXlzdHJva2Ugc2VhcmNoZWQuIFRoZSBob29rXG4gIC8vIGtlZXBzIG9uZSBkZWJvdW5jZWQgZnVuY3Rpb24gZm9yIHRoZSBjb21wb25lbnQncyBsaWZldGltZS5cbiAgY29uc3QgZGVib3VuY2VkU2VhcmNoID0gdXNlRGVib3VuY2VkQ2FsbGJhY2soKHE6IHN0cmluZykgPT4ge1xuICAgIGlmIChxLnRyaW0oKS5sZW5ndGggPCAyKSB7XG4gICAgICBzZXRSZXN1bHRzKFtdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdm9pZCBhcGkuc2VhcmNoUG9zKHEudHJpbSgpKS50aGVuKHNldFJlc3VsdHMpO1xuICB9LCBTRUFSQ0hfREVCT1VOQ0VfTVMpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJwby1waWNrZXJcIj5cbiAgICAgIDxpbnB1dFxuICAgICAgICBkYXRhLXRlc3RpZD1cInBvLXNlYXJjaFwiXG4gICAgICAgIGFyaWEtbGFiZWw9XCJQdXJjaGFzZSBvcmRlclwiXG4gICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIFBPIG51bWJlciBvciBidXllclwiXG4gICAgICAgIHZhbHVlPXtxdWVyeX1cbiAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgc2V0UXVlcnkoZS50YXJnZXQudmFsdWUpO1xuICAgICAgICAgIGRlYm91bmNlZFNlYXJjaChlLnRhcmdldC52YWx1ZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICAgPHVsIHJvbGU9XCJsaXN0Ym94XCI+XG4gICAgICAgIHtyZXN1bHRzLm1hcCgocG8pID0+IChcbiAgICAgICAgICA8bGkga2V5PXtwby5pZH0gcm9sZT1cIm9wdGlvblwiIGFyaWEtc2VsZWN0ZWQ9e2ZhbHNlfT5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGRhdGEtdGVzdGlkPXtgcG8tJHtwby5pZH1gfVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0UmVzdWx0cyhbXSk7XG4gICAgICAgICAgICAgICAgc2V0UXVlcnkocG8ubnVtYmVyKTtcbiAgICAgICAgICAgICAgICBvblNlbGVjdChwbyk7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHtwby5udW1iZXJ9IMK3IHtwby5idXllcn1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvbGk+XG4gICAgICAgICkpfVxuICAgICAgPC91bD5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJ9LHsicGF0aCI6InNyYy9ob29rcy91c2VEZWJvdW5jZWRDYWxsYmFjay50cyIsImNvbnRlbnQiOiJpbXBvcnQgeyB1c2VFZmZlY3QsIHVzZUxheW91dEVmZmVjdCwgdXNlTWVtbywgdXNlUmVmIH0gZnJvbSAncmVhY3QnO1xuXG5leHBvcnQgaW50ZXJmYWNlIERlYm91bmNlZDxBIGV4dGVuZHMgdW5rbm93bltdPiB7XG4gICguLi5hcmdzOiBBKTogdm9pZDtcbiAgLyoqIERyb3BzIGEgcGVuZGluZyBjYWxsLiAqL1xuICBjYW5jZWwoKTogdm9pZDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RhYmxlIGZ1bmN0aW9uIHRoYXQgY2FsbHMgYGZuYCBvbmNlIGNhbGxzIGhhdmUgc3RvcHBlZCBmb3IgYGRlbGF5TXNgLCB3aXRoIHRoZVxuICogYXJndW1lbnRzIG9mIHRoZSBsYXN0IGNhbGwuXG4gKlxuICogVGhlIGRlYm91bmNlZCBmdW5jdGlvbiBpcyBzdGFibGUsIHNvIGl0IG11c3Qgbm90IGNsb3NlIG92ZXIgYGZuYDogaXQgY2FsbHMgdGhlIGxhdGVzdCBgZm5gXG4gKiB0aHJvdWdoIGEgcmVmICh0aGUgb2xkIHZlcnNpb24ga2VwdCB0aGUgZmlyc3QgcmVuZGVyJ3MgYGZuYCwgYW5kIHNvIHNhdmVkIHRoZSBmaXJzdCByZW5kZXInc1xuICogZHJhZnQpLiBBIHBlbmRpbmcgY2FsbCBpcyBkcm9wcGVkIG9uIHVubW91bnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VEZWJvdW5jZWRDYWxsYmFjazxBIGV4dGVuZHMgdW5rbm93bltdPihcbiAgZm46ICguLi5hcmdzOiBBKSA9PiB2b2lkLFxuICBkZWxheU1zOiBudW1iZXIsXG4pOiBEZWJvdW5jZWQ8QT4ge1xuICBjb25zdCBsYXRlc3QgPSB1c2VSZWYoZm4pO1xuICB1c2VMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGxhdGVzdC5jdXJyZW50ID0gZm47XG4gIH0pO1xuICBjb25zdCB0aW1lciA9IHVzZVJlZjxSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IHVuZGVmaW5lZD4odW5kZWZpbmVkKTtcblxuICBjb25zdCBkZWJvdW5jZWQgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBjYWxsID0gKC4uLmFyZ3M6IEEpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lci5jdXJyZW50KTtcbiAgICAgIHRpbWVyLmN1cnJlbnQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGltZXIuY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGF0ZXN0LmN1cnJlbnQoLi4uYXJncyk7XG4gICAgICB9LCBkZWxheU1zKTtcbiAgICB9O1xuICAgIGNhbGwuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyLmN1cnJlbnQpO1xuICAgICAgdGltZXIuY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgICB9O1xuICAgIHJldHVybiBjYWxsO1xuICB9LCBbZGVsYXlNc10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBkZWJvdW5jZWQuY2FuY2VsLCBbZGVib3VuY2VkXSk7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG4ifSx7InBhdGgiOiJzcmMvc3RhdGUvaW52b2ljZVJlZHVjZXIudHMiLCJjb250ZW50IjoiaW1wb3J0IHR5cGUgeyBJbnZvaWNlTGluZSwgUG9MaW5lIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgbGluZU5ldCwgbGluZVRheCB9IGZyb20gJy4uL3V0aWxzL21vbmV5JztcblxuZXhwb3J0IGludGVyZmFjZSBJbnZvaWNlU3RhdGUge1xuICBsaW5lczogSW52b2ljZUxpbmVbXTtcbiAgLyoqIEVhcmxpZXIgdmVyc2lvbnMgb2YgYGxpbmVzYCwgbmV3ZXN0IGxhc3QsIGZvciBVbmRvLiAqL1xuICBwYXN0OiBJbnZvaWNlTGluZVtdW107XG59XG5cbmV4cG9ydCBjb25zdCBpbml0aWFsU3RhdGU6IEludm9pY2VTdGF0ZSA9IHsgbGluZXM6IFtdLCBwYXN0OiBbXSB9O1xuXG5leHBvcnQgdHlwZSBJbnZvaWNlQWN0aW9uID1cbiAgfCB7IHR5cGU6ICdpbXBvcnRQb0xpbmVzJzsgbGluZXM6IFBvTGluZVtdIH1cbiAgfCB7IHR5cGU6ICdhZGRMaW5lJyB9XG4gIHwgeyB0eXBlOiAndXBkYXRlTGluZSc7IGlkOiBzdHJpbmc7IHBhdGNoOiBQYXJ0aWFsPFBvTGluZT4gfVxuICB8IHsgdHlwZTogJ3JlbW92ZUxpbmUnOyBpZDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6ICd1bmRvJyB9O1xuXG5jb25zdCBCTEFOS19MSU5FOiBQb0xpbmUgPSB7IHNrdTogJycsIGRlc2NyaXB0aW9uOiAnJywgcXVhbnRpdHk6IDEsIHVuaXRQcmljZVBhaXNlOiAwLCBnc3RSYXRlOiAxOCB9O1xuXG4vLyBEYXRlLm5vdygpIGdhdmUgZXZlcnkgbGluZSBjcmVhdGVkIGluIHRoZSBzYW1lIG1pbGxpc2Vjb25kIChhbiBpbXBvcnQsIHF1aWNrIGNsaWNrcykgdGhlIHNhbWUgaWQ6XG4vLyBkdXBsaWNhdGUgUmVhY3Qga2V5cywgYW5kIHVwZGF0ZXMvcmVtb3ZlcyBieSBpZCBoaXQgc2V2ZXJhbCBsaW5lcy4gQSBjb3VudGVyIGlzIHVuaXF1ZSBwZXIgcGFnZS5cbmxldCBsYXN0TGluZUlkID0gMDtcbmNvbnN0IG5ld0xpbmVJZCA9ICgpID0+IGBsaW5lLSR7KytsYXN0TGluZUlkfWA7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnZvaWNlUmVkdWNlcihzdGF0ZTogSW52b2ljZVN0YXRlLCBhY3Rpb246IEludm9pY2VBY3Rpb24pOiBJbnZvaWNlU3RhdGUge1xuICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnaW1wb3J0UG9MaW5lcyc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsaW5lczogYWN0aW9uLmxpbmVzLm1hcCgobGluZSkgPT4gKHsgLi4ubGluZSwgaWQ6IG5ld0xpbmVJZCgpIH0pKSxcbiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSxcbiAgICAgIH07XG4gICAgY2FzZSAnYWRkTGluZSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsaW5lczogWy4uLnN0YXRlLmxpbmVzLCB7IC4uLkJMQU5LX0xJTkUsIGlkOiBuZXdMaW5lSWQoKSB9XSxcbiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSxcbiAgICAgIH07XG4gICAgY2FzZSAndXBkYXRlTGluZSc6IHtcbiAgICAgIC8vIE5ldmVyIG11dGF0ZTogdGhlIG9sZCBhcnJheSBpcyB3aGF0IFVuZG8gcmV0dXJucyB0bywgYW5kIHVzZU1lbW8vdXNlRWZmZWN0IGNvbXBhcmUgYnlcbiAgICAgIC8vIHJlZmVyZW5jZSAobXV0YXRpbmcga2VwdCB0aGUgc2FtZSBhcnJheSwgc28gdG90YWxzIGFuZCBhdXRvc2F2ZSBuZXZlciBzYXcgdGhlIGVkaXQpLlxuICAgICAgaWYgKCFzdGF0ZS5saW5lcy5zb21lKChsKSA9PiBsLmlkID09PSBhY3Rpb24uaWQpKSByZXR1cm4gc3RhdGU7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsaW5lczogc3RhdGUubGluZXMubWFwKChsKSA9PiAobC5pZCA9PT0gYWN0aW9uLmlkID8geyAuLi5sLCAuLi5hY3Rpb24ucGF0Y2ggfSA6IGwpKSxcbiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSxcbiAgICAgIH07XG4gICAgfVxuICAgIGNhc2UgJ3JlbW92ZUxpbmUnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGluZXM6IHN0YXRlLmxpbmVzLmZpbHRlcigobCkgPT4gbC5pZCAhPT0gYWN0aW9uLmlkKSxcbiAgICAgICAgcGFzdDogWy4uLnN0YXRlLnBhc3QsIHN0YXRlLmxpbmVzXSxcbiAgICAgIH07XG4gICAgY2FzZSAndW5kbyc6IHtcbiAgICAgIGNvbnN0IHByZXZpb3VzID0gc3RhdGUucGFzdFtzdGF0ZS5wYXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKCFwcmV2aW91cykgcmV0dXJuIHN0YXRlO1xuICAgICAgcmV0dXJuIHsgbGluZXM6IHByZXZpb3VzLCBwYXN0OiBzdGF0ZS5wYXN0LnNsaWNlKDAsIC0xKSB9O1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG90YWxzKGxpbmVzOiBJbnZvaWNlTGluZVtdKSB7XG4gIGxldCBuZXQgPSAwO1xuICBsZXQgdGF4ID0gMDtcbiAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgbmV0ICs9IGxpbmVOZXQobGluZSk7XG4gICAgdGF4ICs9IGxpbmVUYXgobGluZSk7XG4gIH1cbiAgcmV0dXJuIHsgbmV0LCB0YXgsIGdyb3NzOiBuZXQgKyB0YXggfTtcbn1cbiJ9LHsicGF0aCI6InNyYy91dGlscy9kYXRlcy50cyIsImNvbnRlbnQiOiJjb25zdCBpbmRpYURhdGUgPSBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tQ0EnLCB7XG4gIHRpbWVab25lOiAnQXNpYS9Lb2xrYXRhJyxcbiAgeWVhcjogJ251bWVyaWMnLFxuICBtb250aDogJzItZGlnaXQnLFxuICBkYXk6ICcyLWRpZ2l0Jyxcbn0pO1xuXG4vKipcbiAqIFRvZGF5J3MgZGF0ZSBpbiBJbmRpYSBhcyBZWVlZLU1NLUREIChpbnZvaWNlcyBhcmUgZGF0ZWQgaW4gSVNUKS5cbiAqXG4gKiB0b0lTT1N0cmluZygpIGlzIHRoZSBVVEMgZGF0ZSwgd2hpY2ggaXMgc3RpbGwgXCJ5ZXN0ZXJkYXlcIiB1bnRpbCAwNTozMCBJU1Q6IGFuIGludm9pY2UgcmFpc2VkIGF0XG4gKiAwMDozMCBvbiB0aGUgMXN0IHdhcyBkYXRlZCB0aGUgbGFzdCBkYXkgb2YgdGhlIHByZXZpb3VzIG1vbnRoIChhbmQgaXRzIEdTVCByZXR1cm4pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9kYXlJbkluZGlhKG5vdzogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBwYXJ0ID0gKHR5cGU6IEludGwuRGF0ZVRpbWVGb3JtYXRQYXJ0VHlwZXMpID0+XG4gICAgaW5kaWFEYXRlLmZvcm1hdFRvUGFydHMobm93KS5maW5kKChwKSA9PiBwLnR5cGUgPT09IHR5cGUpIS52YWx1ZTtcbiAgcmV0dXJuIGAke3BhcnQoJ3llYXInKX0tJHtwYXJ0KCdtb250aCcpfS0ke3BhcnQoJ2RheScpfWA7XG59XG4ifSx7InBhdGgiOiJzcmMvdXRpbHMvbW9uZXkudHMiLCJjb250ZW50IjoiY29uc3QgaW5yID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KCdlbi1JTicsIHsgc3R5bGU6ICdjdXJyZW5jeScsIGN1cnJlbmN5OiAnSU5SJyB9KTtcblxuLyoqIOKCuTEyLDM0LDU2Ny41MCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFBhaXNlKHBhaXNlOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gaW5yLmZvcm1hdChwYWlzZSAvIDEwMCk7XG59XG5cbmNvbnN0IEFNT1VOVCA9IC9eKFxcZCspKD86XFwuKFxcZHsxLDJ9KSk/JC87XG5cbi8qKlxuICogUGFyc2VzIHdoYXQgdGhlIHN1cHBsaWVyIHR5cGVkIGluIGEgcHJpY2UgZmllbGQgKFwiMTI1MFwiLCBcIjEsMjUwLjUwXCIsIFwi4oK5IDk5LjlcIikgaW50byBwYWlzZS5cbiAqIFJldHVybnMgbnVsbCB3aGVuIGl0IGlzbid0IGEgdmFsaWQsIG5vbi1uZWdhdGl2ZSBhbW91bnQgd2l0aCBhdCBtb3N0IDIgZGVjaW1hbHMuXG4gKlxuICogcGFyc2VGbG9hdCBzdG9wcyBhdCB0aGUgZmlyc3QgY29tbWEgKFwiMSwyNTAuNTBcIiDihpIgMSkgYW5kIGFjY2VwdHMgdHJhaWxpbmcganVuayAoXCIxMmFiY1wiIOKGkiAxMiksXG4gKiBzbyB0aGUgdGV4dCBpcyB2YWxpZGF0ZWQgYXMgYSB3aG9sZSBhbmQgY29udmVydGVkIGZyb20gaXRzIGRpZ2l0cywgd2l0aG91dCBmbG9hdGluZyBwb2ludC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUnVwZWVzKHRleHQ6IHN0cmluZyk6IG51bWJlciB8IG51bGwge1xuICBjb25zdCBtYXRjaCA9IEFNT1VOVC5leGVjKHRleHQucmVwbGFjZSgvW+KCuSxcXHNdL2csICcnKSk7XG4gIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuICBjb25zdCBbLCBydXBlZXMsIGZyYWN0aW9uID0gJyddID0gbWF0Y2g7XG4gIHJldHVybiBOdW1iZXIocnVwZWVzKSAqIDEwMCArIE51bWJlcihmcmFjdGlvbi5wYWRFbmQoMiwgJzAnKSk7XG59XG5cbi8qKiBOZXQgYW1vdW50IG9mIGEgbGluZSwgaW4gcGFpc2UuICovXG5leHBvcnQgZnVuY3Rpb24gbGluZU5ldChsaW5lOiB7IHF1YW50aXR5OiBudW1iZXI7IHVuaXRQcmljZVBhaXNlOiBudW1iZXIgfSk6IG51bWJlciB7XG4gIHJldHVybiBsaW5lLnF1YW50aXR5ICogbGluZS51bml0UHJpY2VQYWlzZTtcbn1cblxuLyoqIEdTVCBvZiBhIGxpbmUsIHJvdW5kZWQgdG8gdGhlIHBhaXNhLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbmVUYXgobGluZTogeyBxdWFudGl0eTogbnVtYmVyOyB1bml0UHJpY2VQYWlzZTogbnVtYmVyOyBnc3RSYXRlOiBudW1iZXIgfSk6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLnJvdW5kKChsaW5lTmV0KGxpbmUpICogbGluZS5nc3RSYXRlKSAvIDEwMCk7XG59XG4ifV0=', 'base64'), 'UTF8'))::jsonb
  ) on conflict (question_id) do update set notes_md = excluded.notes_md, files = excluded.files;
  if v_installed is null then
    raise notice 'Question "web-invoice-builder": installed (version 3)';
  else
    raise notice 'Question "web-invoice-builder": updated from version % to 3', v_installed;
  end if;
end
$question$;

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- Template "Lead React Native Developer – Hands-On". Safe to re-run: what is already installed and up to date is left untouched.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Template: lead-react-native-hands-on
do $template$
declare
  v_created uuid;
begin
  insert into public.test_templates (id, slug, name, target_role, description, duration_minutes,
                                     instructions_md, proctoring, violation_policy, is_active) values (
    '704cf1f2-2916-4eb4-a7b6-cc9894509b41', 'lead-react-native-hands-on', 'Lead React Native Developer – Hands-On', 'Lead React Native Developer', convert_from(decode('Rm91ciBoYXJkIGRlYnVnZ2luZyB0YXNrczogdHdvIFJlYWN0IE5hdGl2ZSBhcHBzIChjb25jdXJyZW5jeSwgbGlmZWN5Y2xlcywgcmVuZGVyaW5nKSwgYSBTcHJpbmcgQm9vdCBzZXJ2aWNlICh0cmFuc2FjdGlvbnMsIGlkZW1wb3RlbmN5LCBsb2NraW5nKSBhbmQgYSBSZWFjdCB3ZWIgc2NyZWVuIChob29rcywgc3RhdGUsIGlucHV0IGhhbmRsaW5nKS4=', 'base64'), 'UTF8'), 150,
    convert_from(decode('IyMgQWJvdXQgdGhpcyBhc3Nlc3NtZW50CgpUaGlzIGlzIGEgKipoYW5kcy1vbiBkZWJ1Z2dpbmcgYXNzZXNzbWVudCoqIGZvciB0aGUgKipMZWFkIFJlYWN0IE5hdGl2ZSBEZXZlbG9wZXIqKiByb2xlLiBJdCBoYXMgKio0IHF1ZXN0aW9ucyoqIGFuZCBsYXN0cyAqKjE1MCBtaW51dGVzKiogaW4gb25lIHNpdHRpbmcuIFRoZSB0aW1lciBzdGFydHMgd2hlbiB5b3UgcHJlc3MgKipTdGFydCBhc3Nlc3NtZW50KiogYW5kIGtlZXBzIHJ1bm5pbmcgZXZlbiBpZiB5b3UgY2xvc2UgdGhlIGJyb3dzZXIuCgpFYWNoIHF1ZXN0aW9uIGdpdmVzIHlvdSBhIHNtYWxsIGNvZGViYXNlIGFuZCBhIGxpc3Qgb2YgYnVnIHJlcG9ydHMuIEZpbmQgdGhlIHJvb3QgY2F1c2VzIGFuZCBmaXggdGhlIGNvZGUgZGlyZWN0bHkgaW4gdGhlIGVkaXRvci4gV2UgYXNzZXNzIHRoZSBjb3JyZWN0bmVzcyBvZiB5b3VyIGZpeGVzIGFuZCBob3cgd2VsbCB0aGV5IGFkZHJlc3MgdGhlIHJvb3QgY2F1c2UsIHNvIGEgc2hvcnQgY29tbWVudCBuZXh0IHRvIGEgbm9uLW9idmlvdXMgZml4IGhlbHBzIHRoZSByZXZpZXdlcnMuCgotIEV2ZXJ5IHF1ZXN0aW9uIGNvbWVzIHdpdGggcmVhZC1vbmx5IHRlc3RzIHRoYXQgZGVzY3JpYmUgdGhlIGV4cGVjdGVkIGJlaGF2aW91ci4gUHJlc3MgKipSdW4gdGVzdHMqKiBhcyBvZnRlbiBhcyB5b3UgbGlrZTsgbm90aGluZyBuZWVkcyB0byBiZSBpbnN0YWxsZWQuIFRoZSBlZGl0b3IgYWxzbyB1bmRlcmxpbmVzIGVycm9ycy4KLSAqKlF1ZXN0aW9uIDMqKiAoU3ByaW5nIEJvb3QpOiBKYXZhIGNhbid0IHJ1biBpbiB0aGUgYnJvd3Nlciwgc28gaXRzIHRlc3RzIGNoZWNrIHlvdXIgY29kZSdzIHN0cnVjdHVyZS4gUmV2aWV3ZXJzIGFsc28gcnVuIHRoZSBKVW5pdCB0ZXN0cyBvbiB5b3VyIGNvZGUgYWZ0ZXJ3YXJkcy4KCiMjIEhvdyB0byB3b3JrCgotIE9wZW4gdGhlIGxpc3Qgb2YgcXVlc3Rpb25zIGZyb20gdGhlIGJhciBvbiB0aGUgZmFyIGxlZnQgKGhvdmVyIG9yIGNsaWNrIHRoZSBsaXN0IGljb24pLiBVc2UgKipNYXJrIGZvciByZXZpZXcqKiB0byBjb21lIGJhY2sgdG8gYSBxdWVzdGlvbi4gVGhlIHBhbmVsIGJ1dHRvbiBuZXh0IHRvIGl0IGhpZGVzIHRoZSBwcm9ibGVtIHN0YXRlbWVudCB0byBnaXZlIHRoZSBjb2RlIG1vcmUgcm9vbS4KLSBUaGUgKipjb2RpbmcgYXNzaXN0YW50KiogKHRoZSBzcGFya2xlIGJ1dHRvbikgZ2l2ZXMgc2hvcnQgaGludHMuIEl0IHdvbid0IHdyaXRlIHRoZSBzb2x1dGlvbiBmb3IgeW91LCBpdCBhbnN3ZXJzIGEgbGltaXRlZCBudW1iZXIgb2YgcXVlc3Rpb25zLCBhbmQgcmV2aWV3ZXJzIGNhbiBzZWUgd2hhdCB5b3UgYXNrZWQuCi0gWW91ciB3b3JrIGlzIHNhdmVkIGF1dG9tYXRpY2FsbHkgZXZlcnkgZmV3IHNlY29uZHMgb24gdGhpcyBkZXZpY2UgYW5kIG9uIFp5Y3VzIHNlcnZlcnMuIElmIHlvdXIgY29ubmVjdGlvbiBkcm9wcywga2VlcCB3b3JraW5nOiB5b3VyIGNoYW5nZXMgc3luYyB3aGVuIGl0IHJldHVybnMuCi0gSWYgdGhlIHBhZ2UgcmVsb2FkcyBvciB5b3VyIGJyb3dzZXIgY2xvc2VzLCBzaWduIGluIGFnYWluIHdpdGggdGhlIHNhbWUgZW1haWwgYW5kIGFjY2VzcyBjb2RlLiBZb3UnbGwgY29udGludWUgd2hlcmUgeW91IGxlZnQgb2ZmLCB3aXRoIHRoZSB0aW1lIHRoYXQgcmVtYWlucy4KLSBQcmVzcyAqKlN1Ym1pdCoqIHdoZW4geW91J3JlIGRvbmUuIFlvdSBjYW4ndCBjaGFuZ2UgeW91ciBhbnN3ZXJzIGFmdGVyIHN1Ym1pdHRpbmcuIFdoZW4gdGhlIHRpbWUgaXMgdXAsIHlvdXIgd29yayBpcyBzdWJtaXR0ZWQgYXV0b21hdGljYWxseS4KCiMjIFJ1bGVzCgotIFdvcmsgYWxvbmUuIERvbid0IHVzZSBvdGhlciB3ZWJzaXRlcywgb3RoZXIgQUkgdG9vbHMsIG5vdGVzIG9yIG90aGVyIHBlb3BsZS4gVGhlIGJ1aWx0LWluIGNvZGluZyBhc3Npc3RhbnQgaXMgdGhlIG9ubHkgaGVscCBhbGxvd2VkLgotIFN0YXkgaW4gZnVsbC1zY3JlZW4gbW9kZSwgaW4gdGhpcyB0YWIsIG9uIG9uZSBzY3JlZW4sIHdpdGggeW91ciB3ZWJjYW0gb24gYW5kIHlvdXIgZmFjZSB2aXNpYmxlLgotIFBhc3RpbmcsIGNvcHlpbmcgdGhlIHF1ZXN0aW9ucywgcmlnaHQtY2xpY2tpbmcgYW5kIGRldmVsb3BlciB0b29scyBhcmUgZGlzYWJsZWQuIEF0dGVtcHRzIGFyZSBsb2dnZWQuCi0gRG9uJ3Qgc2hhcmUgdGhlc2UgcXVlc3Rpb25zIG9yIHlvdXIgYW5zd2VycyB3aXRoIGFueW9uZSwgZHVyaW5nIG9yIGFmdGVyIHRoZSBhc3Nlc3NtZW50Lgo=', 'base64'), 'UTF8'), (convert_from(decode('eyJmdWxsc2NyZWVuIjp7ImVuYWJsZWQiOnRydWV9LCJrZXlib2FyZExvY2siOnsiZW5hYmxlZCI6dHJ1ZX0sInRhYlN3aXRjaCI6eyJlbmFibGVkIjp0cnVlfSwid2luZG93Qmx1ciI6eyJlbmFibGVkIjp0cnVlLCJncmFjZU1zIjoxNTAwfSwicGFzdGUiOnsiZW5hYmxlZCI6dHJ1ZSwiYWxsb3dJbnRlcm5hbENsaXBib2FyZCI6ZmFsc2V9LCJkcmFnRHJvcCI6eyJlbmFibGVkIjp0cnVlfSwic3VzcGljaW91c0luc2VydCI6eyJlbmFibGVkIjp0cnVlLCJ0aHJlc2hvbGRDaGFycyI6NjB9LCJ0eXBpbmdDYWRlbmNlIjp7ImVuYWJsZWQiOnRydWUsIm1heENoYXJzUGVyU2Vjb25kIjoyNX0sImNvcHlQcm90ZWN0aW9uIjp7ImVuYWJsZWQiOnRydWV9LCJibG9ja2VkU2hvcnRjdXRzIjp7ImVuYWJsZWQiOnRydWV9LCJkZXZ0b29sc0hldXJpc3RpYyI6eyJlbmFibGVkIjp0cnVlfSwibXVsdGlUYWIiOnsiZW5hYmxlZCI6dHJ1ZX0sIm11bHRpTW9uaXRvciI6eyJlbmFibGVkIjp0cnVlLCJibG9ja1N0YXJ0SWZFeHRlbmRlZCI6dHJ1ZSwicG9sbE1zIjo1MDAwfSwid2ViY2FtIjp7ImVuYWJsZWQiOnRydWUsInJlcXVpcmVkIjp0cnVlLCJzbmFwc2hvdEludGVydmFsU2VjIjoxNTAsInNuYXBzaG90T25WaW9sYXRpb24iOnRydWV9LCJmYWNlRGV0ZWN0aW9uIjp7ImVuYWJsZWQiOnRydWUsImludGVydmFsTXMiOjIwMDAsIm5vRmFjZVNlY29uZHMiOjEwLCJtdWx0aUZhY2VDb25zZWN1dGl2ZSI6Mn0sIm1pY3JvcGhvbmUiOnsiZW5hYmxlZCI6ZmFsc2UsImxvdWREYmZzIjotMjAsInN1c3RhaW5TZWMiOjN9LCJ3YXRlcm1hcmsiOnsiZW5hYmxlZCI6dHJ1ZSwib3BhY2l0eSI6MC4wNn0sImtleXN0cm9rZVJlcGxheSI6eyJlbmFibGVkIjp0cnVlfSwiYWlBc3Npc3RhbnQiOnsiZW5hYmxlZCI6dHJ1ZSwibWF4UmVxdWVzdHMiOjEwLCJjb29sZG93blNlYyI6MjB9fQ==', 'base64'), 'UTF8'))::jsonb, (convert_from(decode('eyJ3YXJuT25PY2N1cnJlbmNlcyI6MiwibWF4VG90YWxWaW9sYXRpb25zIjo1LCJvbkxpbWl0IjoiYXV0b19zdWJtaXQiLCJjb3VudGVkVHlwZXMiOlsidGFiX3N3aXRjaCIsIndpbmRvd19ibHVyIiwiZnVsbHNjcmVlbl9leGl0Iiwic2Vjb25kX3RhYiIsInNlc3Npb25fdGFrZW92ZXIiLCJtdWx0aV9tb25pdG9yIiwiY2FtZXJhX29mZiIsIm5vX2ZhY2UiLCJtdWx0aXBsZV9mYWNlcyJdLCJydWxlcyI6eyJmdWxsc2NyZWVuX2V4aXQiOnsid2FybmluZ3MiOjMsImF1dG9TdWJtaXQiOnRydWV9LCJtdWx0aXBsZV9mYWNlcyI6eyJ3YXJuaW5ncyI6NSwiYXV0b1N1Ym1pdCI6dHJ1ZX19fQ==', 'base64'), 'UTF8'))::jsonb, true
  ) on conflict (id) do nothing
  returning id into v_created;
  if v_created is not null then
    insert into public.test_template_questions (template_id, question_id, position) values
      ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', '9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 1),
      ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', 'a7dcbe6c-f122-4051-8368-41c2659815d7', 2),
      ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', '04a206ea-655a-40fd-9651-b01088d59d98', 3),
      ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', 'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 4)
    on conflict (template_id, question_id) do nothing;
    raise notice 'Template "lead-react-native-hands-on": created';
    return;
  end if;
  if (select coalesce(array_agg(question_id::text order by question_id::text), '{}')
        from public.test_template_questions where template_id = '704cf1f2-2916-4eb4-a7b6-cc9894509b41')
     is distinct from array['1ddcb8b2-aade-4a1f-a449-f31014cceaf7', 'ad17df1c-902d-4b7f-9054-8f0bec4873e2', 'c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'f50a2b49-3263-4569-bd97-ff8835a45436']::text[] then
    raise notice 'Template "lead-react-native-hands-on": already up to date or customised, left unchanged';
    return;
  end if;
  delete from public.test_template_questions where template_id = '704cf1f2-2916-4eb4-a7b6-cc9894509b41';
  insert into public.test_template_questions (template_id, question_id, position) values
    ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', '9249d0ed-6c2c-4ea4-80f9-48645dbf737a', 1),
      ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', 'a7dcbe6c-f122-4051-8368-41c2659815d7', 2),
      ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', '04a206ea-655a-40fd-9651-b01088d59d98', 3),
      ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', 'f1eb4c67-f593-4b9b-9087-4e6bdd1eed13', 4)
  on conflict (template_id, question_id) do nothing;
  update public.test_templates set description = convert_from(decode('Rm91ciBoYXJkIGRlYnVnZ2luZyB0YXNrczogdHdvIFJlYWN0IE5hdGl2ZSBhcHBzIChjb25jdXJyZW5jeSwgbGlmZWN5Y2xlcywgcmVuZGVyaW5nKSwgYSBTcHJpbmcgQm9vdCBzZXJ2aWNlICh0cmFuc2FjdGlvbnMsIGlkZW1wb3RlbmN5LCBsb2NraW5nKSBhbmQgYSBSZWFjdCB3ZWIgc2NyZWVuIChob29rcywgc3RhdGUsIGlucHV0IGhhbmRsaW5nKS4=', 'base64'), 'UTF8')
   where id = '704cf1f2-2916-4eb4-a7b6-cc9894509b41' and md5(description) = 'd0c57dafdc7ae0249e066179e22fef56';
  update public.test_templates set instructions_md = convert_from(decode('IyMgQWJvdXQgdGhpcyBhc3Nlc3NtZW50CgpUaGlzIGlzIGEgKipoYW5kcy1vbiBkZWJ1Z2dpbmcgYXNzZXNzbWVudCoqIGZvciB0aGUgKipMZWFkIFJlYWN0IE5hdGl2ZSBEZXZlbG9wZXIqKiByb2xlLiBJdCBoYXMgKio0IHF1ZXN0aW9ucyoqIGFuZCBsYXN0cyAqKjE1MCBtaW51dGVzKiogaW4gb25lIHNpdHRpbmcuIFRoZSB0aW1lciBzdGFydHMgd2hlbiB5b3UgcHJlc3MgKipTdGFydCBhc3Nlc3NtZW50KiogYW5kIGtlZXBzIHJ1bm5pbmcgZXZlbiBpZiB5b3UgY2xvc2UgdGhlIGJyb3dzZXIuCgpFYWNoIHF1ZXN0aW9uIGdpdmVzIHlvdSBhIHNtYWxsIGNvZGViYXNlIGFuZCBhIGxpc3Qgb2YgYnVnIHJlcG9ydHMuIEZpbmQgdGhlIHJvb3QgY2F1c2VzIGFuZCBmaXggdGhlIGNvZGUgZGlyZWN0bHkgaW4gdGhlIGVkaXRvci4gV2UgYXNzZXNzIHRoZSBjb3JyZWN0bmVzcyBvZiB5b3VyIGZpeGVzIGFuZCBob3cgd2VsbCB0aGV5IGFkZHJlc3MgdGhlIHJvb3QgY2F1c2UsIHNvIGEgc2hvcnQgY29tbWVudCBuZXh0IHRvIGEgbm9uLW9idmlvdXMgZml4IGhlbHBzIHRoZSByZXZpZXdlcnMuCgotIEV2ZXJ5IHF1ZXN0aW9uIGNvbWVzIHdpdGggcmVhZC1vbmx5IHRlc3RzIHRoYXQgZGVzY3JpYmUgdGhlIGV4cGVjdGVkIGJlaGF2aW91ci4gUHJlc3MgKipSdW4gdGVzdHMqKiBhcyBvZnRlbiBhcyB5b3UgbGlrZTsgbm90aGluZyBuZWVkcyB0byBiZSBpbnN0YWxsZWQuIFRoZSBlZGl0b3IgYWxzbyB1bmRlcmxpbmVzIGVycm9ycy4KLSAqKlF1ZXN0aW9uIDMqKiAoU3ByaW5nIEJvb3QpOiBKYXZhIGNhbid0IHJ1biBpbiB0aGUgYnJvd3Nlciwgc28gaXRzIHRlc3RzIGNoZWNrIHlvdXIgY29kZSdzIHN0cnVjdHVyZS4gUmV2aWV3ZXJzIGFsc28gcnVuIHRoZSBKVW5pdCB0ZXN0cyBvbiB5b3VyIGNvZGUgYWZ0ZXJ3YXJkcy4KCiMjIEhvdyB0byB3b3JrCgotIE9wZW4gdGhlIGxpc3Qgb2YgcXVlc3Rpb25zIGZyb20gdGhlIGJhciBvbiB0aGUgZmFyIGxlZnQgKGhvdmVyIG9yIGNsaWNrIHRoZSBsaXN0IGljb24pLiBVc2UgKipNYXJrIGZvciByZXZpZXcqKiB0byBjb21lIGJhY2sgdG8gYSBxdWVzdGlvbi4gVGhlIHBhbmVsIGJ1dHRvbiBuZXh0IHRvIGl0IGhpZGVzIHRoZSBwcm9ibGVtIHN0YXRlbWVudCB0byBnaXZlIHRoZSBjb2RlIG1vcmUgcm9vbS4KLSBUaGUgKipjb2RpbmcgYXNzaXN0YW50KiogKHRoZSBzcGFya2xlIGJ1dHRvbikgZ2l2ZXMgc2hvcnQgaGludHMuIEl0IHdvbid0IHdyaXRlIHRoZSBzb2x1dGlvbiBmb3IgeW91LCBpdCBhbnN3ZXJzIGEgbGltaXRlZCBudW1iZXIgb2YgcXVlc3Rpb25zLCBhbmQgcmV2aWV3ZXJzIGNhbiBzZWUgd2hhdCB5b3UgYXNrZWQuCi0gWW91ciB3b3JrIGlzIHNhdmVkIGF1dG9tYXRpY2FsbHkgZXZlcnkgZmV3IHNlY29uZHMgb24gdGhpcyBkZXZpY2UgYW5kIG9uIFp5Y3VzIHNlcnZlcnMuIElmIHlvdXIgY29ubmVjdGlvbiBkcm9wcywga2VlcCB3b3JraW5nOiB5b3VyIGNoYW5nZXMgc3luYyB3aGVuIGl0IHJldHVybnMuCi0gSWYgdGhlIHBhZ2UgcmVsb2FkcyBvciB5b3VyIGJyb3dzZXIgY2xvc2VzLCBzaWduIGluIGFnYWluIHdpdGggdGhlIHNhbWUgZW1haWwgYW5kIGFjY2VzcyBjb2RlLiBZb3UnbGwgY29udGludWUgd2hlcmUgeW91IGxlZnQgb2ZmLCB3aXRoIHRoZSB0aW1lIHRoYXQgcmVtYWlucy4KLSBQcmVzcyAqKlN1Ym1pdCoqIHdoZW4geW91J3JlIGRvbmUuIFlvdSBjYW4ndCBjaGFuZ2UgeW91ciBhbnN3ZXJzIGFmdGVyIHN1Ym1pdHRpbmcuIFdoZW4gdGhlIHRpbWUgaXMgdXAsIHlvdXIgd29yayBpcyBzdWJtaXR0ZWQgYXV0b21hdGljYWxseS4KCiMjIFJ1bGVzCgotIFdvcmsgYWxvbmUuIERvbid0IHVzZSBvdGhlciB3ZWJzaXRlcywgb3RoZXIgQUkgdG9vbHMsIG5vdGVzIG9yIG90aGVyIHBlb3BsZS4gVGhlIGJ1aWx0LWluIGNvZGluZyBhc3Npc3RhbnQgaXMgdGhlIG9ubHkgaGVscCBhbGxvd2VkLgotIFN0YXkgaW4gZnVsbC1zY3JlZW4gbW9kZSwgaW4gdGhpcyB0YWIsIG9uIG9uZSBzY3JlZW4sIHdpdGggeW91ciB3ZWJjYW0gb24gYW5kIHlvdXIgZmFjZSB2aXNpYmxlLgotIFBhc3RpbmcsIGNvcHlpbmcgdGhlIHF1ZXN0aW9ucywgcmlnaHQtY2xpY2tpbmcgYW5kIGRldmVsb3BlciB0b29scyBhcmUgZGlzYWJsZWQuIEF0dGVtcHRzIGFyZSBsb2dnZWQuCi0gRG9uJ3Qgc2hhcmUgdGhlc2UgcXVlc3Rpb25zIG9yIHlvdXIgYW5zd2VycyB3aXRoIGFueW9uZSwgZHVyaW5nIG9yIGFmdGVyIHRoZSBhc3Nlc3NtZW50Lgo=', 'base64'), 'UTF8')
   where id = '704cf1f2-2916-4eb4-a7b6-cc9894509b41' and md5(instructions_md) = '3f76c7339a14d8d1a620bd3eb539fb5c';
  raise notice 'Template "lead-react-native-hands-on": now uses its 4 current questions';
end
$template$;

commit;
```

## Environment example

### 37. `.env.example`

- **Folder:** `(repository root)`
- **File name:** `.env.example`
- **Action:** **Create** a new file with exactly this content.
- **Size:** 26 lines, 1 KB
- **Commit message:** `Add .env.example`

```
# Copy to `.env.local` for local development. NEVER commit real values.
# Only the PUBLIC anon key belongs here. The service_role key must never be used in the frontend.

# Supabase project URL, e.g. https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_URL=
# Supabase "anon" / publishable key (public by design; protected by Row Level Security)
VITE_SUPABASE_ANON_KEY=

# Show "Sign in with Microsoft" on the admin login (requires the Entra app registration). true | false
VITE_ENABLE_ENTRA_SSO=false

# Expose the /styleguide design-system page outside local dev (e.g. on staging for Marketing review). true | false
VITE_ENABLE_STYLEGUIDE=false

# Use the in-memory mock backend instead of Supabase (UI development and tests only). true | false
VITE_USE_MOCK_BACKEND=false

# ── Coding assistant worker (npm run assistant:worker; see docs/AI_ASSISTANT_SETUP.md) ────────────
# Only on the laptop/server inside the Zycus network that runs the worker. No VITE_ prefix: these
# never reach the browser bundle. NEVER commit the key. ASSISTANT_WORKER_SECRET is added by the
# worker's first run.
LITELLM_BASE_URL=
LITELLM_API_KEY=
LITELLM_MODEL=
# Product tag the gateway requires for cost attribution, e.g. codearena
LITELLM_PRODUCT=
```

## Done

When every box is ticked, Part 1 is complete. Your GitHub then matches the project, apart from
the new sign-in page, which goes on the `space-login` branch in Part 2.
