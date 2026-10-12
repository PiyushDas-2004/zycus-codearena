import {
  annotation,
  body,
  check,
  code,
  conditionsThatThrow,
  locksRow,
  method,
  noStrings,
  withHelpers,
} from './support/java';

const { service, purchaseOrder, orders, idempotency, idempotencyRecord, handler } = code;
const approveMethod = method(service, 'approve');
/** approve() with its helpers, as code (string contents blanked) and as written. */
const approve = noStrings(withHelpers(service, approveMethod));
const approveText = withHelpers(service, approveMethod);

/** The column of an IdempotencyRecord field: its @Column name, or the field's name. */
const columnOf = (field: string) => {
  const f = idempotencyRecord.fields.find((x) => x.name === field);
  return (f && /name\s*=\s*"([^"]+)"/.exec(annotation(f, 'Column')?.text ?? '')?.[1]) ?? field;
};
const isApprover = (column: string) => /approver/i.test(column);
const isKey = (column: string) => /key/i.test(column) && !isApprover(column);

/** Column sets that are unique: unique constraints, unique indexes, a composite primary key. */
function uniqueColumnSets(): string[][] {
  const table = annotation(idempotencyRecord, 'Table')?.text ?? '';
  const names = (list: string) => [...list.matchAll(/"([^"]*)"/g)].flatMap((m) => (m[1] ?? '').split(','));
  const clean = (cols: string[]) => cols.map((c) => c.trim().replace(/\s+(asc|desc)$/i, '')).filter(Boolean);
  const sets = [
    ...[...table.matchAll(/@UniqueConstraint\s*\(([^)]*)\)/g)].map((m) =>
      clean(names(/columnNames\s*=\s*(\{[^}]*\}|"[^"]*")/.exec(m[1] ?? '')?.[1] ?? '')),
    ),
    ...[...table.matchAll(/@Index\s*\(([^)]*)\)/g)]
      .filter((m) => /unique\s*=\s*true/.test(m[1] ?? ''))
      .map((m) => clean(names(/columnList\s*=\s*("[^"]*")/.exec(m[1] ?? '')?.[1] ?? ''))),
  ];
  // @IdClass: every @Id field is part of the primary key.
  const ids = idempotencyRecord.fields.filter((f) => annotation(f, 'Id'));
  if (ids.length > 1) sets.push(ids.map((f) => columnOf(f.name)));
  // @EmbeddedId: the embedded class's fields.
  const embedded = idempotencyRecord.fields.find((f) => annotation(f, 'EmbeddedId'));
  const key = embedded && idempotencyRecord.types.find((t) => t.name === embedded.type);
  if (key) {
    sets.push(
      key.fields.map((f) => /name\s*=\s*"([^"]+)"/.exec(annotation(f, 'Column')?.text ?? '')?.[1] ?? f.name),
    );
  }
  for (const f of idempotencyRecord.fields) {
    if (/unique\s*=\s*true/.test(annotation(f, 'Column')?.text ?? '')) sets.push([columnOf(f.name)]);
  }
  return sets;
}

/** Repository methods that lock the PO row for writing. */
const lockingMethods = orders.methods
  .filter((m) => /PESSIMISTIC_WRITE/.test(annotation(m, 'Lock')?.text ?? ''))
  .map((m) => m.name);
/** approve() reaches a lookup that locks the row (a lock used elsewhere doesn't protect it). */
const approveLocks = locksRow(approve, lockingMethods);
const versioned = purchaseOrder.fields.some((f) => annotation(f, 'Version'));

describe('idempotency', () => {
  it('a key is unique per approver in the database', () => {
    const sets = uniqueColumnSets();
    const perApprover = sets.some((s) => s.some(isApprover) && s.some(isKey));
    // A key unique on its own would refuse two approvers who happen to generate the same key.
    const keyAlone = sets.some((s) => s.length > 0 && s.every(isKey));
    check(perApprover && !keyAlone, 'Looked at the unique constraints and the id of IdempotencyRecord.');
  });

  it('retries that arrive at the same time are applied once', () => {
    const before = (source: string, needle: RegExp) => {
      const applied = source.indexOf('recordApproval');
      const m = needle.exec(source);
      return !!m && applied >= 0 && m.index < applied;
    };
    const atomicInserts = idempotency.methods.filter((m) => {
      const q = annotation(m, 'Query')?.text ?? '';
      return /insert\s+into/i.test(q) && /on\s+conflict/i.test(q);
    });
    const claimsFirst = atomicInserts.some((m) => before(approve, new RegExp(`\\.\\s*${m.name}\\s*\\(`)));
    // The same insert through the EntityManager in the service.
    const claimsInService =
      before(approveText, /insert\s+into[^;]*?on\s+conflict/i) && /\.\s*executeUpdate\s*\(/.test(approve);
    const flushedFirst =
      before(approve, /\.\s*saveAndFlush\s*\(/) ||
      (before(approve, /\.\s*save\s*\(/) && before(approve, /\.\s*flush\s*\(\s*\)/));
    const insertsFirst = flushedFirst && /DataIntegrityViolationException/.test(noStrings(service.text));
    check(
      claimsFirst || claimsInService || insertsFirst,
      'Looked at ApprovalService.approve() and IdempotencyRecordRepository.',
    );
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
    // The stored PO id, read directly or into a local variable first.
    const stored = ['(?:get)?[pP]urchaseOrderId\\(\\)'];
    for (const m of approve.matchAll(/\b(\w+)\s*=\s*[^;=]*(?:get)?[pP]urchaseOrderId\(\)\s*;/g)) {
      stored.push(`\\b${m[1]}\\b(?!\\s*\\()`);
    }
    // ... compared as different, in a condition whose branch throws ...
    const differs = (c: string) =>
      stored.some((s) =>
        new RegExp(
          `${s}\\s*!=|!=\\s*[\\w.()]*${s}|!\\s*[\\w.()]*${s}\\s*\\)?\\s*\\.equals|!\\s*[\\w.]*equals\\s*\\([^;]*${s}`,
        ).test(c),
      );
    const refusedInBranch = conditionsThatThrow(approve).some(differs);
    // ... or the same one returns early and everything else throws ...
    const sameReturnsElseThrows = stored.some((s) =>
      new RegExp(`if\\s*\\([^;{]*(${s}\\s*==|==\\s*[\\w.()]*${s}|${s}\\s*\\)?\\s*\\.equals)[^;{]*\\)\\s*\\{?\\s*return\\b[^;]*;\\s*\\}?\\s*throw\\s+new\\b`).test(approve),
    );
    // ... or Optional.filter(same PO).orElseThrow(() -> new ...).
    const filtered = stored.some((s) =>
      new RegExp(`\\.\\s*filter\\s*\\([^;]*${s}[^;]*\\)\\s*\\.\\s*orElseThrow\\s*\\(\\s*(\\(\\s*\\)\\s*->|\\w+::new)`).test(approve),
    );
    check(
      refusedInBranch || sameReturnsElseThrows || filtered,
      'Looked at ApprovalService.approve() when the key was used before.',
    );
  });
});

describe('approvers', () => {
  const record = method(purchaseOrder, 'recordApproval');
  const recordBody = noStrings(withHelpers(purchaseOrder, record));

  it('a PO remembers who approved it', () => {
    const approver = record.params[0]?.name ?? '';
    // A persistent collection the approver's id is added to (not, say, the PO's lines).
    const remembers = purchaseOrder.fields.some(
      (f) =>
        /^(Set|List|Collection|HashSet|LinkedHashSet|ArrayList|Map|HashMap|LinkedHashMap)\s*</.test(f.type) &&
        ['ElementCollection', 'OneToMany', 'ManyToMany'].some((a) => annotation(f, a)) &&
        !!approver &&
        new RegExp(
          `\\b${f.name}\\s*\\.\\s*(add|put|putIfAbsent|computeIfAbsent|merge)\\s*\\(\\s*${approver}\\b`,
        ).test(recordBody),
    );
    check(
      remembers && /recordApproval\s*\(\s*\w/.test(noStrings(service.text)),
      'Looked at PurchaseOrder.recordApproval(), its fields, and how ApprovalService calls it.',
    );
  });

  it("the same person can't give both approvals of a PO", () => {
    // The repeat itself must be refused: `if (!approvers.add(id)) throw`, `if (approvers.contains(id))
    // throw` or Assert.state(approvers.add(id), ...), not just some other throw in the method.
    const refusesRepeat =
      conditionsThatThrow(recordBody).some(
        (c) =>
          /!\s*[\w.]+\s*\.\s*add\s*\(/.test(c) ||
          /(?<![!\w.$]\s*)\b[\w.]*\.(contains|containsKey)\s*\(/.test(c) ||
          /\.\s*putIfAbsent\s*\([^;]*\)\s*!=\s*null/.test(c),
      ) || /Assert\.state\s*\(\s*([\w.]+\s*\.\s*add\s*\(|!\s*[\w.]+\s*\.\s*contains(Key)?\s*\()/.test(recordBody);
    check(refusesRepeat, 'Looked at PurchaseOrder.recordApproval().');
  });

  it("two people approving at the same moment can't overwrite each other's approval", () => {
    check(versioned || approveLocks, 'Looked at PurchaseOrder and how ApprovalService.approve() loads it.');
  });

  it('a concurrent change is answered with 409 Conflict', () => {
    const mapped = handler.methods.some(
      (m) =>
        /OptimisticLock|ConcurrencyFailure|StaleObjectState|StaleState/.test(
          annotation(m, 'ExceptionHandler')?.text ?? m.text,
        ) && /CONFLICT|409/.test(`${body(m)} ${annotation(m, 'ResponseStatus')?.text ?? ''}`),
    );
    check((versioned && mapped) || (!versioned && approveLocks), 'Looked at ApiExceptionHandler.');
  });
});
