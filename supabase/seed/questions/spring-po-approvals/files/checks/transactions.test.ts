import { annotation, body, check, code, editableTypes, method, transactionalOf } from './support/java';

const { service } = code;
const rollsBackOnBudget = (text: string) =>
  /rollbackFor\s*=\s*\{?[^)]*\b(BudgetExceededException|Exception|Throwable)\.class/.test(text);

/** Methods that open their own transaction (REQUIRES_NEW), by declaring type. */
const requiresNew = editableTypes.flatMap((t) =>
  t.methods
    .filter((m) => /REQUIRES_NEW/.test(annotation(m, 'Transactional')?.text ?? ''))
    .map((m) => ({ type: t.name, method: m })),
);

describe('transactions', () => {
  it('a rejection runs in a read-write transaction', () => {
    const tx = transactionalOf(service, method(service, 'reject'));
    check(!!tx && !/readOnly\s*=\s*true/.test(tx.text), 'Looked at ApprovalService.reject() and its class.');
  });

  it('an approval the budget refuses is rolled back', () => {
    const approve = method(service, 'approve');
    const tx = transactionalOf(service, approve);
    check(
      (!!tx && rollsBackOnBudget(tx.text)) || /setRollbackOnly\s*\(/.test(body(approve)),
      'Looked at ApprovalService.approve() and the transaction it runs in.',
    );
  });
});

describe('batch approval', () => {
  const batch = body(method(service, 'approveBatch'));

  it('each PO in a batch is approved in its own transaction', () => {
    const viaTemplate =
      /\.\s*(execute|executeWithoutResult)\s*\(/.test(batch) &&
      service.fields.some((f) => /TransactionTemplate|TransactionOperations/.test(f.type));
    // Through a Spring proxy: an injected bean (another one, or this service itself) whose method
    // opens a new transaction. A call on `this` bypasses the proxy.
    const viaProxy = service.fields.some((f) =>
      requiresNew.some((r) => r.type === f.type && new RegExp(`\\b${f.name}\\s*\\.\\s*${r.method.name}\\s*\\(`).test(batch)),
    );
    check(viaTemplate || viaProxy, 'Looked at ApprovalService.approveBatch() and how it starts each PO.');
  });

  it('a PO the budget refuses is rolled back on its own', () => {
    check(
      /setRollbackOnly\s*\(\s*\)/.test(service.text) ||
        requiresNew.some((r) => rollsBackOnBudget(annotation(r.method, 'Transactional')?.text ?? '')),
      'Looked at the per-PO unit of work of ApprovalService.approveBatch().',
    );
  });

  it("a PO that can't be approved (already decided, unknown, changed meanwhile) doesn't stop the others", () => {
    const caught = [...batch.matchAll(/catch\s*\(([^)]*)\)/g)].map((m) => m[1] ?? '').join(' ');
    check(
      /\b(RuntimeException|IllegalStateException|PoNotFoundException|DataAccessException|OptimisticLockingFailureException|ObjectOptimisticLockingFailureException|TransactionException|Exception)\b/.test(
        caught,
      ),
      'Looked at what ApprovalService.approveBatch() catches for each PO.',
    );
  });
});
