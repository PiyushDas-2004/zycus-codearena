/**
 * Syntax checking for languages Monaco has no language service for:
 * - Java: parsed with java-parser (the parser behind prettier-plugin-java; Java 21 syntax), loaded
 *   only when a Java file exists. Type errors can't be checked in the browser (no javac).
 * - XML (pom.xml etc.): well-formedness via the browser's DOMParser.
 * Errors appear as red squiggles and in the editor's problem markers, like TypeScript's.
 */
import type * as Monaco from 'monaco-editor';
import { javaError } from '@/shared/javaModel';

const OWNER = 'codearena-syntax';
const DEBOUNCE_MS = 400;

export interface SyntaxError {
  line: number;
  column: number;
  message: string;
}

let javaParser: Promise<typeof import('java-parser')> | null = null;

export async function checkJava(source: string): Promise<SyntaxError[]> {
  javaParser ??= import('java-parser');
  const { parse } = await javaParser;
  try {
    parse(source);
    return [];
  } catch (err) {
    const e = javaError(err instanceof Error ? err.message : String(err));
    return [e ?? { line: 1, column: 1, message: 'Syntax error' }];
  }
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
  let version = 0;
  const run = async () => {
    const v = ++version;
    const source = model.getValue();
    const errors = kind === 'java' ? await checkJava(source) : checkXml(source);
    if (v !== version || model.isDisposed()) return;
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
    clearTimeout(timer);
    sub.dispose();
  };
}
