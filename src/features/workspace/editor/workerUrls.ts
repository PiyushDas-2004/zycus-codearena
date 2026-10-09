/**
 * URLs of Monaco's web workers (bundled by Vite as same-origin files). Kept apart from
 * monacoSetup.ts so the instructions page can prefetch them without loading Monaco itself.
 */
import editorWorker from 'monaco-editor/editor/editor.worker.js?worker&url';
import cssWorker from 'monaco-editor/language/css/css.worker.js?worker&url';
import htmlWorker from 'monaco-editor/language/html/html.worker.js?worker&url';
import jsonWorker from 'monaco-editor/language/json/json.worker.js?worker&url';
import tsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker&url';

export const monacoWorkerUrls = { editorWorker, cssWorker, htmlWorker, jsonWorker, tsWorker };

/** The workers a typical question needs first (TS/JS and JSON), largest first. */
export const prefetchWorkerUrls = [tsWorker, editorWorker, jsonWorker];
