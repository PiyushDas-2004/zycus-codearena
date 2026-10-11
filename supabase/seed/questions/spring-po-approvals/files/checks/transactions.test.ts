import {
  catchBlocks,
  check,
  code,
  editableType,
  helpersOf,
  isReadOnly,
  method,
  opensTransaction,
  outsideTransaction,
  templatesOf,
  transactionalOf,
  usesTemplate,
  withHelpers,
} from './support/java';

const { service } = code;
const templates = templatesOf(service);
const rollsBackOnBudget = (text: string) =>
  /rollbackFor\s*=\s*\{?[^)]*\b(BudgetExceededException|Exception|Throwable)\.class/.test(text);
/** A catch of the budget's exception that neither rethrows nor marks the transaction rollback-only. */
const swallowsBudget = (source: string) =>
  catchBlocks(source).some(
    (c) =>
      /\b(BudgetExceededException|Exception|Throwable)\b/.test(c.types) &&
      !/\bthrow\b|setRollbackOnly\s*\(/.test(c.block),
  );

describe('transactions', () => {
  it('a rejection runs in a read-write transaction', () => {
    const reject = method(service, 'reject');
    const tx = transactionalOf(service, reject);
    const own = opensTransaction(tx) && !isReadOnly(tx);
    // Or a TransactionTemplate: its own transaction, unless it joins a read-only one.
    const programmatic = templates.some(
      (t) =>
        usesTemplate(withHelpers(service, reject), t) &&
        !t.readOnly &&
        (t.requiresNew || outsideTransaction(tx) || !isReadOnly(tx)),
    );
    check(own || programmatic, 'Looked at ApprovalService.reject() and its class.');
  });

  it('an approval the budget refuses is rolled back', () => {
    const approve = method(service, 'approve');
    const tx = transactionalOf(service, approve);
    const source = withHelpers(service, approve);
    check(
      !isReadOnly(tx) &&
        !swallowsBudget(source) &&
        ((opensTransaction(tx) && rollsBackOnBudget(tx?.text ?? '')) || /setRollbackOnly\s*\(/.test(source)),
      'Looked at ApprovalService.approve() and the transaction it runs in.',
    );
  });
});

describe('batch approval', () => {
  const approveBatch = method(service, 'approveBatch');
  const batch = withHelpers(service, approveBatch);
  const batchTx = transactionalOf(service, approveBatch);

  /** Methods of injected beans (another one, or this service itself) that the batch calls. */
  const invoked = service.fields.flatMap((f) => {
    const bean = editableType(f.type);
    if (!bean) return [];
    return bean.methods
      .filter((m) => new RegExp(`\\b${f.name}\\s*\\.\\s*${m.name}\\s*\\(`).test(batch))
      .map((m) => ({ bean, method: m }));
  });
  /**
   * Those that go through the bean's Spring proxy and start a transaction of their own. (A call on
   * `this` bypasses the proxy, and a private method isn't proxied.)
   */
  const proxied = invoked.filter(({ bean, method: m }) => {
    const tx = transactionalOf(bean, m);
    return (
      !m.modifiers.includes('private') &&
      !m.modifiers.includes('static') &&
      opensTransaction(tx) &&
      (/REQUIRES_NEW/.test(tx?.text ?? '') || outsideTransaction(batchTx))
    );
  });
  // A template that is REQUIRED (Spring Boot's own) joins the batch's transaction if it has one.
  const viaTemplate = templates.some((t) => usesTemplate(batch, t) && (t.requiresNew || outsideTransaction(batchTx)));

  it('each PO in a batch is approved in its own transaction', () => {
    check(viaTemplate || proxied.length > 0, 'Looked at ApprovalService.approveBatch() and how it starts each PO.');
  });

  it('a PO the budget refuses is rolled back on its own', () => {
    // What runs for each PO: the batch with its helpers, and the beans' methods it calls. (Whether
    // their own transaction really starts is the check above.)
    const units = [...helpersOf(service, approveBatch).map((m) => ({ bean: service, method: m })), ...invoked];
    const perPo = [batch, ...invoked.map((u) => withHelpers(u.bean, u.method))].join('\n');
    check(
      /setRollbackOnly\s*\(\s*\)/.test(perPo) ||
        units.some((u) => rollsBackOnBudget(transactionalOf(u.bean, u.method)?.text ?? '')),
      'Looked at the per-PO unit of work of ApprovalService.approveBatch().',
    );
  });

  it("a PO that can't be approved (already decided, unknown, changed meanwhile) doesn't stop the others", () => {
    const caught = catchBlocks(batch)
      .map((c) => c.types)
      .join(' ');
    check(
      /\b(RuntimeException|IllegalStateException|PoNotFoundException|DataAccessException|OptimisticLockingFailureException|ObjectOptimisticLockingFailureException|TransactionException|Exception)\b/.test(
        caught,
      ),
      'Looked at what ApprovalService.approveBatch() catches for each PO.',
    );
  });
});
