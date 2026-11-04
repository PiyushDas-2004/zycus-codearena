/**
 * A simple model of a Java file (types, annotations, fields, methods, bodies) built from the
 * java-parser CST. Java can't run in the browser, so Java questions are checked by TypeScript tests
 * in the test sandbox that read this model ("structure checks"): `import f from './X.java'` gives a
 * JavaFile. Used by the browser runner and the Node question checks; the editor's declarations are
 * in src/features/workspace/editor/typeLibs/libraries.d.txt (`@codearena/java`). Keep them in sync.
 *
 * Every `text`/`body` has its comments removed, so commented-out code never satisfies a check.
 */
import type { CstNode, IToken } from 'java-parser';

/** A CST child: a node or a token (java-parser's own union is too precise for a generic walk). */
type Element = CstNode | IToken;

export interface JavaAnnotation {
  /** Simple name without "@" and package, e.g. "Transactional". */
  name: string;
  /** The annotation as written, e.g. `@Transactional(readOnly = true)`. */
  text: string;
}
export interface JavaField {
  name: string;
  type: string;
  annotations: JavaAnnotation[];
  modifiers: string[];
  text: string;
}
export interface JavaParam {
  name: string;
  type: string;
}
export interface JavaMethod {
  name: string;
  returnType: string;
  params: JavaParam[];
  annotations: JavaAnnotation[];
  modifiers: string[];
  throws: string[];
  /** The body including braces, or null for abstract/interface methods. */
  body: string | null;
  text: string;
  line: number;
}
export interface JavaType {
  kind: 'class' | 'interface' | 'record' | 'enum';
  name: string;
  annotations: JavaAnnotation[];
  modifiers: string[];
  extends: string[];
  implements: string[];
  fields: JavaField[];
  methods: JavaMethod[];
  constructors: JavaMethod[];
  types: JavaType[];
  text: string;
}
export interface JavaFile {
  package: string;
  imports: string[];
  types: JavaType[];
  /** The whole file without comments. */
  text: string;
}

/** Removes // and /* *\/ comments, keeping string, char and text-block literals intact. */
export function stripJavaComments(code: string): string {
  let out = '';
  let i = 0;
  while (i < code.length) {
    const c = code.charAt(i);
    const next = code[i + 1];
    if (c === '/' && next === '/') {
      while (i < code.length && code[i] !== '\n') i++;
    } else if (c === '/' && next === '*') {
      const end = code.indexOf('*/', i + 2);
      const chunk = code.slice(i, end < 0 ? code.length : end + 2);
      out += chunk.replace(/[^\n]/g, ' '); // keep line numbers
      i += chunk.length;
    } else if (code.startsWith('"""', i)) {
      const end = code.indexOf('"""', i + 3);
      const stop = end < 0 ? code.length : end + 3;
      out += code.slice(i, stop);
      i = stop;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < code.length && code[j] !== c && code[j] !== '\n') j += code[j] === '\\' ? 2 : 1;
      out += code.slice(i, j + 1);
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

const isNode = (e: Element | undefined): e is CstNode => !!e && 'children' in e;
const childList = (n: CstNode | undefined, key: string): Element[] =>
  (n?.children as Record<string, Element[] | undefined> | undefined)?.[key] ?? [];
const kids = (n: CstNode | undefined, key: string): CstNode[] => childList(n, key).filter(isNode);
const kid = (n: CstNode | undefined, key: string): CstNode | undefined => kids(n, key)[0];
const tokens = (n: CstNode | undefined, key: string): IToken[] =>
  childList(n, key).filter((e): e is IToken => !isNode(e));

/** Every token under a node, in source order (for modifier keywords like `public`). */
function leafTokens(n: CstNode): IToken[] {
  const out: IToken[] = [];
  for (const list of Object.values(n.children as Record<string, Element[]>)) {
    for (const e of list) {
      if (isNode(e)) out.push(...leafTokens(e));
      else out.push(e);
    }
  }
  return out.sort((a, b) => a.startOffset - b.startOffset);
}

export function javaFileModel(cst: CstNode, source: string): JavaFile {
  const slice = (n: CstNode | IToken | undefined) => {
    if (!n) return '';
    const start = 'location' in n ? n.location?.startOffset : n.startOffset;
    const end = 'location' in n ? n.location?.endOffset : n.endOffset;
    return start === undefined || end === undefined
      ? ''
      : stripJavaComments(source.slice(start, end + 1)).trim();
  };
  const compact = (s: string) => s.replace(/\s+/g, ' ').trim();
  /** A token's text from the source (the parser saw placeholders for some letters: forJavaParser). */
  const image = (t: IToken | undefined) => (t ? source.slice(t.startOffset, t.endOffset + 1) : '');

  const annotations = (mods: CstNode[]): JavaAnnotation[] =>
    mods
      .flatMap((m) => kids(m, 'annotation'))
      .map((a) => {
        const ids = tokens(kid(a, 'typeName'), 'Identifier');
        return { name: image(ids.at(-1)), text: compact(slice(a)) };
      });
  const modifiers = (mods: CstNode[]): string[] =>
    mods.filter((m) => !kid(m, 'annotation')).flatMap((m) => leafTokens(m).map(image));
  const typeList = (n: CstNode | undefined): string[] =>
    n ? [...kids(n, 'interfaceType'), ...kids(n, 'classType')].map((t) => compact(slice(t))) : [];

  const params = (declarator: CstNode | undefined): JavaParam[] =>
    kids(kid(declarator, 'formalParameterList'), 'formalParameter').map((p) => {
      const reg = kid(p, 'variableParaRegularParameter') ?? kid(p, 'variableArityParameter');
      return {
        type: compact(slice(kid(reg, 'unannType'))),
        name:
          image(tokens(kid(reg, 'variableDeclaratorId'), 'Identifier')[0]) ||
          image(tokens(reg, 'Identifier')[0]),
      };
    });

  function method(n: CstNode, modsKey: string): JavaMethod {
    const header = kid(n, 'methodHeader');
    const declarator = kid(header, 'methodDeclarator');
    const mods = kids(n, modsKey);
    const result = kid(header, 'result');
    const block = kid(kid(n, 'methodBody'), 'block');
    return {
      name: image(tokens(declarator, 'Identifier')[0]),
      returnType: compact(slice(result)),
      params: params(declarator),
      annotations: annotations(mods),
      modifiers: modifiers(mods),
      throws: kids(kid(kid(header, 'throws'), 'exceptionTypeList'), 'exceptionType').map((t) =>
        compact(slice(t)),
      ),
      body: block ? slice(block) : null,
      text: slice(n),
      line: n.location?.startLine ?? 0,
    };
  }

  function constructor(n: CstNode): JavaMethod {
    const declarator = kid(n, 'constructorDeclarator');
    const mods = kids(n, 'constructorModifier');
    return {
      name: image(tokens(kid(kid(declarator, 'simpleTypeName'), 'typeIdentifier'), 'Identifier')[0]),
      returnType: '',
      params: params(declarator),
      annotations: annotations(mods),
      modifiers: modifiers(mods),
      throws: kids(kid(kid(n, 'throws'), 'exceptionTypeList'), 'exceptionType').map((t) => compact(slice(t))),
      body: slice(kid(n, 'constructorBody')),
      text: slice(n),
      line: n.location?.startLine ?? 0,
    };
  }

  function field(n: CstNode, modsKey: string): JavaField[] {
    const mods = kids(n, modsKey);
    return kids(kid(n, 'variableDeclaratorList'), 'variableDeclarator').map((d) => ({
      name: image(tokens(kid(d, 'variableDeclaratorId'), 'Identifier')[0]),
      type: compact(slice(kid(n, 'unannType'))),
      annotations: annotations(mods),
      modifiers: modifiers(mods),
      text: compact(slice(n)),
    }));
  }

  /** Members of a class body (classBodyDeclaration nodes). */
  function members(t: JavaType, decls: CstNode[]) {
    for (const d of decls) {
      const member = kid(d, 'classMemberDeclaration');
      const ctor = kid(d, 'constructorDeclaration');
      if (ctor) t.constructors.push(constructor(ctor));
      if (!member) continue;
      const f = kid(member, 'fieldDeclaration');
      const m = kid(member, 'methodDeclaration');
      const c = kid(member, 'classDeclaration');
      const i = kid(member, 'interfaceDeclaration');
      if (f) t.fields.push(...field(f, 'fieldModifier'));
      if (m) t.methods.push(method(m, 'methodModifier'));
      if (c) t.types.push(classDecl(c));
      if (i) t.types.push(interfaceDecl(i));
    }
  }

  const blank = (kind: JavaType['kind'], name: string, mods: CstNode[], node: CstNode): JavaType => ({
    kind,
    name,
    annotations: annotations(mods),
    modifiers: modifiers(mods),
    extends: [],
    implements: [],
    fields: [],
    methods: [],
    constructors: [],
    types: [],
    text: slice(node),
  });
  const ident = (n: CstNode | undefined) => image(tokens(kid(n, 'typeIdentifier'), 'Identifier')[0]);

  function classDecl(n: CstNode): JavaType {
    const mods = kids(n, 'classModifier');
    const normal = kid(n, 'normalClassDeclaration');
    const record = kid(n, 'recordDeclaration');
    const en = kid(n, 'enumDeclaration');
    if (record) {
      const t = blank('record', ident(record), mods, n);
      t.implements = typeList(kid(kid(record, 'classImplements'), 'interfaceTypeList'));
      for (const c of kids(kid(kid(record, 'recordHeader'), 'recordComponentList'), 'recordComponent')) {
        t.fields.push({
          name: image(tokens(c, 'Identifier')[0]),
          type: compact(slice(kid(c, 'unannType'))),
          annotations: [],
          modifiers: ['private', 'final'],
          text: compact(slice(c)),
        });
      }
      members(
        t,
        kids(kid(record, 'recordBody'), 'recordBodyDeclaration').flatMap((d) =>
          kids(d, 'classBodyDeclaration'),
        ),
      );
      return t;
    }
    if (en) {
      const t = blank('enum', ident(en), mods, n);
      members(t, kids(kid(kid(en, 'enumBody'), 'enumBodyDeclarations'), 'classBodyDeclaration'));
      return t;
    }
    const t = blank('class', ident(normal), mods, n);
    t.extends = kids(kid(normal, 'classExtends'), 'classType').map((c) => compact(slice(c)));
    t.implements = typeList(kid(kid(normal, 'classImplements'), 'interfaceTypeList'));
    members(t, kids(kid(normal, 'classBody'), 'classBodyDeclaration'));
    return t;
  }

  function interfaceDecl(n: CstNode): JavaType {
    const mods = kids(n, 'interfaceModifier');
    const normal = kid(n, 'normalInterfaceDeclaration') ?? kid(n, 'annotationInterfaceDeclaration');
    const t = blank('interface', ident(normal), mods, n);
    t.extends = typeList(kid(kid(normal, 'interfaceExtends'), 'interfaceTypeList'));
    for (const d of kids(kid(normal, 'interfaceBody'), 'interfaceMemberDeclaration')) {
      const m = kid(d, 'interfaceMethodDeclaration');
      const c = kid(d, 'constantDeclaration');
      const nestedClass = kid(d, 'classDeclaration');
      const nestedInterface = kid(d, 'interfaceDeclaration');
      if (m) t.methods.push(method(m, 'interfaceMethodModifier'));
      if (c) t.fields.push(...field(c, 'constantModifier'));
      if (nestedClass) t.types.push(classDecl(nestedClass));
      if (nestedInterface) t.types.push(interfaceDecl(nestedInterface));
    }
    return t;
  }

  const unit = kid(cst, 'ordinaryCompilationUnit');
  const pkg = kid(unit, 'packageDeclaration');
  return {
    package: tokens(pkg, 'Identifier').map(image).join('.'),
    imports: kids(unit, 'importDeclaration').map((d) => compact(slice(d)).replace(/^import\s+|;$/g, '')),
    types: kids(unit, 'typeDeclaration').flatMap((d) => {
      const c = kid(d, 'classDeclaration');
      const i = kid(d, 'interfaceDeclaration');
      return c ? [classDecl(c)] : i ? [interfaceDecl(i)] : [];
    }),
    text: stripJavaComments(source),
  };
}

export interface JavaSyntaxError {
  line: number;
  column: number;
  message: string;
}

/** Turns java-parser's error text into one readable line with a position. */
export function javaError(message: string): JavaSyntaxError | null {
  const pos = /errors detected in line: (\d+), column: (\d+)/.exec(message);
  if (!pos) return null;
  const simple = /Expecting --> (.+?) <-- but found --> (.+?) <--/.exec(message);
  const found = /but found: (.+?)!/.exec(message);
  const text = simple
    ? `Syntax error: expected ${simple[1]} but found ${simple[2]}`
    : found
      ? `Syntax error: unexpected ${found[1]}`
      : /lexing errors/.test(message)
        ? 'Syntax error: unexpected character'
        : 'Syntax error';
  return { line: Number(pos[1]), column: Number(pos[2]), message: text };
}

/**
 * java-parser's lexer lacks some characters Java allows in identifiers: spacing combining marks
 * (Devanagari, Tamil, Bengali... vowel signs) and non-ASCII digits. The parser gets a plain letter of
 * the same length in their place; the model is still sliced from the original text (same offsets).
 */
export const forJavaParser = (source: string) =>
  source.replace(/(?![0-9])[\p{Mc}\p{Nd}]/gu, (ch) => 'a'.repeat(ch.length));

/** How long a small Java file may take to parse (a normal file takes well under a second). */
export const JAVA_PARSE_LIMIT_MS = 10_000;

/**
 * How long this file may take to parse: more for very large files (about 1 s per 500 KB normally),
 * so a slow or busy computer doesn't cut them off.
 */
export const javaParseLimitMs = (source: string) => JAVA_PARSE_LIMIT_MS + Math.ceil(source.length / 20);

/**
 * The error for a file whose parse was stopped: java-parser backtracks on deeply nested casts and
 * parentheses (10 levels take seconds, 16 take minutes), so it runs in a worker with a time limit.
 */
export const JAVA_TOO_SLOW: JavaSyntaxError = {
  line: 1,
  column: 1,
  message:
    'This file takes too long to check. Simplify very deeply nested parentheses or casts (split them into variables).',
};

/** Parses a Java file into its model, or reports its first syntax error. */
export function modelJava(
  parse: (source: string) => CstNode,
  source: string,
): { ok: true; file: JavaFile } | { ok: false; error: JavaSyntaxError } {
  try {
    return { ok: true, file: javaFileModel(parse(forJavaParser(source)), source) };
  } catch (err) {
    const e = javaError(err instanceof Error ? err.message : String(err));
    return { ok: false, error: e ?? { line: 1, column: 1, message: 'Syntax error' } };
  }
}
