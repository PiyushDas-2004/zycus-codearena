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

/** Fails the check with an explanation of what was looked at. */
export function check(ok: boolean, explanation: string): void {
  if (!ok) throw new Error(explanation);
}
