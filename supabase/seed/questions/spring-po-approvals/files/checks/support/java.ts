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

/**
 * A method's body followed by the bodies of the methods of its own class that it calls (directly,
 * on `this`, or through them), so moving code into a helper method changes nothing. Calls on other
 * objects (including this class's own proxy) aren't followed.
 */
export const withHelpers = (t: JavaType, m: JavaMethod) => [m, ...helpersOf(t, m)].map(body).join('\n');

/** The methods of its own class that a method calls, directly or through them (see withHelpers). */
export function helpersOf(t: JavaType, m: JavaMethod): JavaMethod[] {
  const found = [m];
  // for...of also visits the methods pushed while it runs.
  for (const current of found) {
    const source = body(current);
    for (const other of t.methods) {
      const called = new RegExp(
        `(?<![\\w.$])${other.name}\\s*\\(|\\bthis\\s*\\.\\s*${other.name}\\s*\\(|\\bthis\\s*::\\s*${other.name}\\b`,
      );
      if (!found.includes(other) && called.test(source)) found.push(other);
    }
  }
  return found.slice(1);
}

/** A type you can edit, by its simple or qualified name (as a field's type gives it). */
export const editableType = (name: string) => {
  const simple = name.replace(/<.*$/, '').split('.').pop();
  return editableTypes.find((t) => t.name === simple) ?? null;
};

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
