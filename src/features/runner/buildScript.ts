/**
 * Assembles the sandbox worker's script: the runtime, then every module of the question wrapped in
 * a define() call, then the run() call. Pure (shared by the browser runner and the Node checks).
 */
export interface SandboxModule {
  path: string;
  kind: 'js' | 'json';
  code: string;
}

/** Test files are `*.test.ts(x)` / `*.spec.ts(x)`; other files under __tests__/ are helpers. */
export const isTestFile = (path: string) => /\.(test|spec)\.[jt]sx?$/.test(path);

export function buildSandboxScript(runtime: string, modules: SandboxModule[], testFiles: string[]): string {
  const parts = [runtime, ';'];
  for (const m of modules) {
    parts.push(
      m.kind === 'json'
        ? `__sandbox.defineJson(${JSON.stringify(m.path)}, ${JSON.stringify(m.code)});`
        : `__sandbox.define(${JSON.stringify(m.path)}, function (require, module, exports) {\n${m.code}\n});`,
    );
  }
  parts.push(`__sandbox.run(${JSON.stringify({ testFiles })});`);
  return parts.join('\n');
}

export interface SandboxTestResult {
  file: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  durationMs: number;
  logs: string[];
}

export type SandboxOutcome =
  | { type: 'done'; results: SandboxTestResult[]; setupError: string | null }
  | { type: 'crash'; error: string }
  | { type: 'timeout' }
  | { type: 'compile'; errors: { path: string; line: number; message: string }[] };
