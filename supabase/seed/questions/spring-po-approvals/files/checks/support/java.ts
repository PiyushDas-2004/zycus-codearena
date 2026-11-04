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
