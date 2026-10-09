/**
 * Monaco is bundled with the app (no CDN at runtime → strict CSP, works behind corporate proxies).
 * Workers are emitted by Vite as same-origin files.
 */
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import CssWorker from 'monaco-editor/language/css/css.worker.js?worker';
import HtmlWorker from 'monaco-editor/language/html/html.worker.js?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker.js?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';

let initialised = false;

export function setupMonaco(): typeof monaco {
  if (initialised) return monaco;
  initialised = true;

  self.MonacoEnvironment = {
    getWorker(_id: string, label: string) {
      if (label === 'json') return new JsonWorker();
      if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
      if (label === 'typescript' || label === 'javascript') return new TsWorker();
      return new EditorWorker();
    },
  };

  // Candidates edit fragments of real projects without node_modules: keep syntax errors, drop
  // "cannot find module" style semantic noise.
  for (const defaults of [monaco.typescript.typescriptDefaults, monaco.typescript.javascriptDefaults]) {
    defaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: true,
    });
    defaults.setCompilerOptions({
      target: monaco.typescript.ScriptTarget.ESNext,
      module: monaco.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
      jsx: monaco.typescript.JsxEmit.ReactJSX,
      allowJs: true,
      allowNonTsExtensions: true,
      esModuleInterop: true,
      strict: false,
    });
  }
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
