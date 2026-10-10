import { annotation, body, check, code, method } from './support/java';

const { service, purchaseOrder, orders, idempotency, idempotencyRecord, handler } = code;
const approve = body(method(service, 'approve'));

describe('idempotency', () => {
  it('a key is unique per approver in the database', () => {
    const table = annotation(idempotencyRecord, 'Table')?.text ?? '';
    check(
      /uniqueConstraints|unique\s*=\s*true/.test(table) && /approver/i.test(table) && /idem_key|"key"/.test(table),
      'Looked at the @Table of IdempotencyRecord.',
    );
  });

  it('retries that arrive at the same time are applied once', () => {
    const applied = approve.indexOf('recordApproval');
    const before = (needle: RegExp) => {
      const m = needle.exec(approve);
      return !!m && applied >= 0 && m.index < applied;
    };
    const atomicInserts = idempotency.methods.filter((m) => {
      const q = annotation(m, 'Query')?.text ?? '';
      return /insert\s+into/i.test(q) && /on\s+conflict/i.test(q);
    });
    const claimsFirst = atomicInserts.some((m) => before(new RegExp(`\\.\\s*${m.name}\\s*\\(`)));
    const insertsFirst = before(/\.\s*saveAndFlush\s*\(/) && /DataIntegrityViolationException/.test(service.text);
    check(claimsFirst || insertsFirst, 'Looked at ApprovalService.approve() and IdempotencyRecordRepository.');
  });

  it('a key is looked up for its own approver only', () => {
    const finder =
      idempotency.methods.find((m) => /approver/i.test(m.name) && /key/i.test(m.name)) ??
      idempotency.methods.find((m) => /select[\s\S]*approver/i.test(annotation(m, 'Query')?.text ?? ''));
    check(
      !!finder && new RegExp(`\\.\\s*${finder.name}\\s*\\(`).test(approve),
      'Looked at how ApprovalService.approve() finds an earlier request with the same key.',
    );
  });

  it('reusing a key for a different PO is refused', () => {
    check(
      /getPurchaseOrderId\(\)\s*(!=|==)|(!=|==)\s*[\w.()]*getPurchaseOrderId\(\)|getPurchaseOrderId\(\)\s*\)?\s*\.equals|equals\([^)]*getPurchaseOrderId/.test(
        approve,
      ) && /throw\s+new/.test(approve),
      'Looked at ApprovalService.approve() when the key was used before.',
    );
  });
});

describe('approvers', () => {
  const record = method(purchaseOrder, 'recordApproval');

  it('a PO remembers who approved it', () => {
    const remembers = purchaseOrder.fields.some(
      (f) =>
        /^(Set|List|Collection|HashSet|LinkedHashSet|ArrayList)\s*</.test(f.type) &&
        ['ElementCollection', 'OneToMany', 'ManyToMany'].some((a) => annotation(f, a)),
    );
    check(
      record.params.length >= 1 && remembers && /recordApproval\s*\(\s*\w/.test(service.text),
      'Looked at PurchaseOrder.recordApproval(), its fields, and how ApprovalService calls it.',
    );
  });

  it("the same person can't give both approvals of a PO", () => {
    const b = body(record);
    check(/!\s*[\w.]+\.add\(|\.contains\(/.test(b) && /throw\s+new/.test(b), 'Looked at PurchaseOrder.recordApproval().');
  });

  it("two people approving at the same moment can't overwrite each other's approval", () => {
    const versioned = purchaseOrder.fields.some((f) => annotation(f, 'Version'));
    const locked = orders.methods.some(
      (m) => /PESSIMISTIC_WRITE/.test(annotation(m, 'Lock')?.text ?? '') && new RegExp(`\\.\\s*${m.name}\\s*\\(`).test(service.text),
    );
    check(versioned || locked, 'Looked at PurchaseOrder and how ApprovalService loads it.');
  });

  it('a concurrent change is answered with 409 Conflict', () => {
    const versioned = purchaseOrder.fields.some((f) => annotation(f, 'Version'));
    const locked = orders.methods.some((m) => /PESSIMISTIC_WRITE/.test(annotation(m, 'Lock')?.text ?? ''));
    const mapped = handler.methods.some(
      (m) => /OptimisticLock/.test(annotation(m, 'ExceptionHandler')?.text ?? m.text) && /CONFLICT|409/.test(body(m)),
    );
    check((versioned && mapped) || (!versioned && locked), 'Looked at ApiExceptionHandler.');
  });
});
