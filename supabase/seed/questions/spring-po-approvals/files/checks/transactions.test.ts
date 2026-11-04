import {
  beansFor,
  callsThrough,
  catchBlocks,
  check,
  code,
  helpersOf,
  isReadOnly,
  loopBodies,
  method,
  noStrings,
  opensTransaction,
  outsideTransaction,
  templatesOf,
  transactionalOf,
  usesTemplate,
  withHelpers,
} from './support/java';

const { service } = code;
const templates = templatesOf(service);
/** rollbackFor / rollbackForClassName (Spring) or rollbackOn (JTA) that covers the budget's exception. */
const rollsBackOnBudget = (text: string) =>
  /\b(rollbackFor|rollbackOn)\s*=\s*\{?[^)]*\b(BudgetExceededException|Exception|Throwable)\.class/.test(text) ||
  /\brollbackForClassName\s*=\s*\{?[^)]*"([\w.]*\.)?(BudgetExceededException|Exception|Throwable)"/.test(text);
const BUDGET = /\b(BudgetExceededException|Exception|Throwable)\b/;

describe('transactions', () => {
  it('a rejection runs in a read-write transaction', () => {
    const reject = method(service, 'reject');
    const tx = transactionalOf(service, reject);
    const own = opensTransaction(tx) && !isReadOnly(tx);
    // Or a TransactionTemplate: its own transaction, unless it joins a read-only one.
    const programmatic = templates.some(
      (t) =>
        usesTemplate(noStrings(withHelpers(service, reject)), t) &&
        !t.readOnly &&
        (t.requiresNew || outsideTransaction(tx) || !isReadOnly(tx)),
    );
    check(own || programmatic, 'Looked at ApprovalService.reject() and its class.');
  });

  it('an approval the budget refuses is rolled back', () => {
    const approve = method(service, 'approve');
    const tx = transactionalOf(service, approve);
    const source = noStrings(withHelpers(service, approve));
    // The refusal must still reach the caller (422): a catch either rethrows, or marks the
    // transaction rollback-only and the exception is thrown again later (`throw refused`).
    const rethrowsLater = /\bthrow\s+(?!new\b)[\w.[\]]+/.test(source);
    const swallowed = catchBlocks(source).some(
      (c) =>
        BUDGET.test(c.types) &&
        !/\bthrow\b/.test(c.block) &&
        !(/setRollbackOnly\s*\(/.test(c.block) && rethrowsLater),
    );
    check(
      !isReadOnly(tx) &&
        !swallowed &&
        ((opensTransaction(tx) && rollsBackOnBudget(tx?.text ?? '')) || /setRollbackOnly\s*\(/.test(source)),
      'Looked at ApprovalService.approve() and the transaction it runs in.',
    );
  });
});

describe('batch approval', () => {
  const approveBatch = method(service, 'approveBatch');
  const batch = noStrings(withHelpers(service, approveBatch));
  const batchTx = transactionalOf(service, approveBatch);

  /**
   * Methods of injected beans (another one, this service itself, through an interface or an
   * ObjectProvider) that the batch calls.
   */
  const invoked = service.fields.flatMap((f) =>
    beansFor(f.type).flatMap((bean) =>
      bean.methods.filter((m) => callsThrough(batch, f.name, m.name)).map((m) => ({ bean, method: m })),
    ),
  );
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
  const usedTemplates = templates.filter((t) => usesTemplate(batch, t));
  const viaTemplate = usedTemplates.some((t) => !t.readOnly && (t.requiresNew || outsideTransaction(batchTx)));
  // Or the transaction manager directly: getTransaction(...) with a REQUIRES_NEW definition.
  const viaManager =
    /\.\s*getTransaction\s*\(/.test(batch) &&
    /\.\s*commit\s*\(/.test(batch) &&
    (/REQUIRES_NEW/.test(noStrings(service.text)) || outsideTransaction(batchTx));

  it('each PO in a batch is approved in its own transaction', () => {
    check(
      viaTemplate || viaManager || proxied.length > 0,
      'Looked at ApprovalService.approveBatch() and how it starts each PO.',
    );
  });

  it('a PO the budget refuses is rolled back on its own', () => {
    // What runs for each PO: the batch with its helpers, and the beans' methods it calls. (Whether
    // their own transaction really starts is the check above.)
    const units = [...helpersOf(service, approveBatch).map((m) => ({ bean: service, method: m })), ...invoked];
    const perPo = [batch, ...invoked.map((u) => noStrings(withHelpers(u.bean, u.method)))].join('\n');
    // In a template's callback, wrapping the checked exception in an unchecked one rolls back too.
    const wrapsInTemplate =
      usedTemplates.length > 0 &&
      catchBlocks(perPo).some((c) => /BudgetExceededException/.test(c.types) && /\bthrow\s+new\b/.test(c.block));
    check(
      /setRollbackOnly\s*\(\s*\)/.test(perPo) ||
        (viaManager && /\.\s*rollback\s*\(/.test(perPo)) ||
        wrapsInTemplate ||
        units.some((u) => rollsBackOnBudget(transactionalOf(u.bean, u.method)?.text ?? '')),
      'Looked at the per-PO unit of work of ApprovalService.approveBatch().',
    );
  });

  it("a PO that can't be approved (already decided, unknown, changed meanwhile) doesn't stop the others", () => {
    // Caught for each PO, inside the loop: an already-decided PO (IllegalStateException), an unknown
    // one (PoNotFoundException) and a concurrent change (optimistic locking).
    const caught = loopBodies(batch)
      .flatMap((b) => catchBlocks(b).map((c) => c.types))
      .join(' ');
    const covers = (names: string) => new RegExp(`\\b(${names}|RuntimeException|Exception|Throwable)\\b`).test(caught);
    check(
      covers('IllegalStateException') &&
        covers('PoNotFoundException') &&
        covers(
          'OptimisticLockingFailureException|ObjectOptimisticLockingFailureException|ConcurrencyFailureException|TransientDataAccessException|DataAccessException',
        ),
      'Looked at what ApprovalService.approveBatch() catches for each PO, inside its loop.',
    );
  });
});
