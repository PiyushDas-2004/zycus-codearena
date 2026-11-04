/**
 * Monaco is bundled with the app (no CDN at runtime → strict CSP, works behind corporate proxies).
 * Workers are emitted by Vite as same-origin files.
 */
import * as monaco from 'monaco-editor';
import { monacoWorkerUrls as urls } from './workerUrls';

const worker = (url: string, name: string) => new Worker(url, { type: 'module', name });

let initialised = false;

export function setupMonaco(): typeof monaco {
  if (initialised) return monaco;
  initialised = true;

  self.MonacoEnvironment = {
    getWorker(_id: string, label: string) {
      if (label === 'json') return worker(urls.jsonWorker, label);
      if (label === 'css' || label === 'scss' || label === 'less') return worker(urls.cssWorker, label);
      if (label === 'html' || label === 'handlebars' || label === 'razor')
        return worker(urls.htmlWorker, label);
      if (label === 'typescript' || label === 'javascript') return worker(urls.tsWorker, label);
      return worker(urls.editorWorker, 'editor');
    },
  };

  // Full type checking against React / React Native / test-sandbox declarations (typeLibs/), so a
  // wrong prop, a misspelt hook or a missing import is underlined as in a real project. Emit is
  // CommonJS: the test runner compiles candidates' files with this same service.
  for (const defaults of [monaco.typescript.typescriptDefaults, monaco.typescript.javascriptDefaults]) {
    defaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: true,
      // Check the file in view (again each time it is shown, so edits to the files it imports are
      // picked up) instead of all ~60 files of the assessment at once.
      onlyVisible: true,
    });
    // Every file must be in the worker for imports between files to resolve (see syncTypeScriptModels).
    defaults.setEagerModelSync(true);
    defaults.setCompilerOptions({
      target: monaco.typescript.ScriptTarget.ES2020,
      lib: ['es2022', 'dom', 'dom.iterable'],
      module: monaco.typescript.ModuleKind.CommonJS,
      moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
      jsx: monaco.typescript.JsxEmit.ReactJSX,
      allowJs: true,
      allowNonTsExtensions: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      strict: true,
      noImplicitOverride: true,
      skipLibCheck: true,
      isolatedModules: true,
    });
  }
  void import('./typeLibs').then(({ editorTypeLibs }) => {
    monaco.typescript.typescriptDefaults.setExtraLibs(editorTypeLibs);
    monaco.typescript.javascriptDefaults.setExtraLibs(editorTypeLibs);
  });
  monaco.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    enableSchemaRequest: false,
    schemas: [],
  });

  registerProperties();
  registerGroovy();
  defineThemes();
  return monaco;
}

/**
 * Starts the TypeScript worker with every model in it (eager model sync), so imports between files
 * resolve. Monaco otherwise sends a model only when it is checked, and a file checked before the
 * files it imports were sent shows "Cannot find module" errors. Call after creating the models,
 * before any file is shown. (Don't re-check by changing compiler or diagnostics options: that
 * restarts the worker and drops requests in flight, such as a test run's compile step.)
 */
export async function syncTypeScriptModels(): Promise<void> {
  const uris = (language: string) =>
    monaco.editor
      .getModels()
      .filter((m) => m.getLanguageId() === language)
      .map((m) => m.uri);
  const ts = uris('typescript');
  const js = uris('javascript');
  if (ts.length) await (await monaco.typescript.getTypeScriptWorker())(...ts);
  if (js.length) await (await monaco.typescript.getJavaScriptWorker())(...js);
}

/** Map our stored language ids onto Monaco language ids. */
export function monacoLanguage(language: string): string {
  switch (language) {
    case 'properties':
      return 'java-properties';
    case 'groovy':
      return 'groovy';
    default:
      return language;
  }
}

function registerProperties() {
  monaco.languages.register({ id: 'java-properties', extensions: ['.properties'] });
  monaco.languages.setMonarchTokensProvider('java-properties', {
    tokenizer: {
      root: [
        [/^\s*[#!].*$/, 'comment'],
        [/^(\s*)([^=:\s]+)(\s*[=:]?\s*)(.*)$/, ['white', 'key', 'delimiter', 'string']],
      ],
    },
  });
  monaco.languages.setLanguageConfiguration('java-properties', { comments: { lineComment: '#' } });
}

function registerGroovy() {
  monaco.languages.register({ id: 'groovy', extensions: ['.gradle', '.groovy'] });
  monaco.languages.setMonarchTokensProvider('groovy', {
    keywords: [
      'def',
      'class',
      'interface',
      'enum',
      'extends',
      'implements',
      'import',
      'package',
      'return',
      'if',
      'else',
      'for',
      'while',
      'switch',
      'case',
      'default',
      'break',
      'continue',
      'new',
      'true',
      'false',
      'null',
      'this',
      'super',
      'static',
      'final',
      'public',
      'private',
      'protected',
      'void',
      'in',
      'as',
      'try',
      'catch',
      'finally',
      'throw',
      'plugins',
      'dependencies',
      'repositories',
      'implementation',
      'testImplementation',
      'apply',
    ],
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\d+(\.\d+)?/, 'number'],
        [/[a-zA-Z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/[{}()[\]]/, '@brackets'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
    },
  });
}

function defineThemes() {
  monaco.editor.defineTheme('zycus-light', {
    base: 'vs',
    inherit: true,
    rules: [{ token: 'key', foreground: '002D72' }],
    colors: {
      'editor.background': '#FFFFFF',
      'editorLineNumber.foreground': '#94A3B8',
      'editorLineNumber.activeForeground': '#0B1F3F',
      'editor.selectionBackground': '#BEDDFF',
      'editor.lineHighlightBackground': '#F6FAFF',
      'editorCursor.foreground': '#0036B0',
      focusBorder: '#0036B0',
    },
  });
  // Matches the workspace dark theme (neutral charcoal, VS Code-style syntax colours).
  monaco.editor.defineTheme('zycus-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [{ token: 'key', foreground: '9CDCFE' }],
    colors: {
      'editor.background': '#1E1E1E',
      'editorLineNumber.foreground': '#6E6E6E',
      'editorLineNumber.activeForeground': '#DCDCDC',
      'editor.selectionBackground': '#264F78',
      'editor.lineHighlightBackground': '#2A2A2A',
      'editor.lineHighlightBorder': '#00000000',
      'editorCursor.foreground': '#AEAFAD',
      'editorGutter.background': '#1E1E1E',
      'editorWidget.background': '#282828',
      'editorWidget.border': '#3E3E3E',
      'minimap.background': '#1E1E1E',
      'scrollbarSlider.background': '#5555554D',
      'scrollbarSlider.hoverBackground': '#6B6B6B80',
      focusBorder: '#5C9DFF',
    },
  });
}
