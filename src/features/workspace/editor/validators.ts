/**
 * Syntax checking for languages Monaco has no language service for:
 * - Java: parsed with java-parser (the parser behind prettier-plugin-java; Java 21 syntax), loaded
 *   only when a Java file exists. Type errors can't be checked in the browser (no javac).
 * - XML (pom.xml etc.): well-formedness via the browser's DOMParser.
 * Errors appear as red squiggles and in the editor's problem markers, like TypeScript's.
 */
import type * as Monaco from 'monaco-editor';
import { parseJava } from '@/features/runner/javaParser';

const OWNER = 'codearena-syntax';
const DEBOUNCE_MS = 400;

export interface SyntaxError {
  line: number;
  column: number;
  message: string;
}

/** In a Web Worker with a time limit: some valid Java takes java-parser very long. */
export async function checkJava(source: string): Promise<SyntaxError[]> {
  const res = await parseJava(source);
  return res.ok ? [] : [res.error];
}

export function checkXml(source: string): SyntaxError[] {
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  const err = doc.getElementsByTagName('parsererror')[0];
  if (!err) return [];
  const text = err.textContent ?? 'XML is not well-formed';
  const pos = /line (\d+)(?: at |, )column (\d+)/i.exec(text);
  const detail = text
    .replace(/^This page contains the following errors:/, '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !/^Below is a rendering/.test(l));
  return [
    {
      line: pos ? Number(pos[1]) : 1,
      column: pos ? Number(pos[2]) : 1,
      message: `XML error: ${(detail ?? text).replace(/^error on line \d+ at column \d+:\s*/i, '')}`,
    },
  ];
}

/** Validates the model now and after every edit (debounced). Returns a disposer. */
export function attachSyntaxValidation(
  monaco: typeof Monaco,
  model: Monaco.editor.ITextModel,
  kind: 'java' | 'xml',
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let again = false;
  let disposed = false;
  // One check at a time: edits made meanwhile are checked once it ends (a slow Java file doesn't
  // queue a check per keystroke).
  const run = async () => {
    if (disposed || model.isDisposed()) return;
    if (running) {
      again = true;
      return;
    }
    running = true;
    const source = model.getValue();
    let errors: SyntaxError[];
    try {
      errors = kind === 'java' ? await checkJava(source) : checkXml(source);
    } finally {
      running = false;
    }
    if (again) {
      again = false;
      void run();
      return;
    }
    if (disposed || model.isDisposed()) return;
    monaco.editor.setModelMarkers(
      model,
      OWNER,
      errors.map((e) => {
        const line = Math.min(Math.max(1, e.line), model.getLineCount());
        const col = Math.max(1, e.column);
        return {
          severity: monaco.MarkerSeverity.Error,
          message: e.message,
          startLineNumber: line,
          startColumn: col,
          endLineNumber: line,
          endColumn: Math.max(col + 1, model.getLineMaxColumn(line)),
        };
      }),
    );
  };
  void run();
  const sub = model.onDidChangeContent(() => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(), DEBOUNCE_MS);
  });
  return () => {
    disposed = true;
    clearTimeout(timer);
    sub.dispose();
  };
}
