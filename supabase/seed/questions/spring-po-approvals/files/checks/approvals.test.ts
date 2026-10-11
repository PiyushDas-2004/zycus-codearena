import { annotation, body, check, code, method } from './support/java';

const { service, purchaseOrder, orders, idempotency, idempotencyRecord, handler } = code;
const approve = body(method(service, 'approve'));

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

/** `if (<condition>) throw` (with or without braces), for each such if. */
function conditionsThatThrow(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/\bif\s*\(/g)) {
    let depth = 1;
    let i = (m.index ?? 0) + m[0].length;
    const start = i;
    while (i < source.length && depth > 0) {
      if (source[i] === '(') depth++;
      else if (source[i] === ')') depth--;
      i++;
    }
    if (/^\s*\{?\s*throw\b/.test(source.slice(i))) out.push(source.slice(start, i - 1));
  }
  return out;
}

describe('idempotency', () => {
  it('a key is unique per approver in the database', () => {
    const sets = uniqueColumnSets();
    const perApprover = sets.some((s) => s.some(isApprover) && s.some(isKey));
    // A key unique on its own would refuse two approvers who happen to generate the same key.
    const keyAlone = sets.some((s) => s.length > 0 && s.every(isKey));
    check(perApprover && !keyAlone, 'Looked at the unique constraints and the id of IdempotencyRecord.');
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
    const flushedFirst =
      before(/\.\s*saveAndFlush\s*\(/) || (before(/\.\s*save\s*\(/) && before(/\.\s*flush\s*\(\s*\)/));
    const insertsFirst = flushedFirst && /DataIntegrityViolationException/.test(service.text);
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
    // The stored PO id, read directly or into a local variable first.
    const stored = ['(?:get)?[pP]urchaseOrderId\\(\\)'];
    for (const m of approve.matchAll(/\b(\w+)\s*=\s*[^;=]*(?:get)?[pP]urchaseOrderId\(\)\s*;/g)) {
      stored.push(`\\b${m[1]}\\b(?!\\s*\\()`);
    }
    const compared = stored.some((s) =>
      new RegExp(
        `${s}\\s*(!=|==)|(!=|==)\\s*[\\w.()]*${s}|${s}\\s*\\)?\\s*\\.equals|equals\\([^;]*${s}`,
      ).test(approve),
    );
    const refused = /throw\s+new|\.orElseThrow\s*\(\s*(\(\s*\)\s*->|\w+::new)/.test(approve);
    check(compared && refused, 'Looked at ApprovalService.approve() when the key was used before.');
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
    // The repeat itself must be refused: `if (!approvers.add(id)) throw`, `if (approvers.contains(id))
    // throw` or Assert.state(approvers.add(id), ...), not just some other throw in the method.
    const refusesRepeat =
      conditionsThatThrow(b).some(
        (c) => /!\s*[\w.]+\s*\.\s*add\s*\(/.test(c) || /(?<![!\w.$]\s*)\b[\w.]*\.contains\s*\(/.test(c),
      ) ||
      /Assert\.state\s*\(\s*([\w.]+\s*\.\s*add\s*\(|!\s*[\w.]+\s*\.\s*contains\s*\()/.test(b);
    check(refusesRepeat, 'Looked at PurchaseOrder.recordApproval().');
  });

  it("two people approving at the same moment can't overwrite each other's approval", () => {
    const versioned = purchaseOrder.fields.some((f) => annotation(f, 'Version'));
    const locked = orders.methods.some(
      (m) =>
        /PESSIMISTIC_WRITE/.test(annotation(m, 'Lock')?.text ?? '') &&
        new RegExp(`\\.\\s*${m.name}\\s*\\(`).test(service.text),
    );
    check(versioned || locked, 'Looked at PurchaseOrder and how ApprovalService loads it.');
  });

  it('a concurrent change is answered with 409 Conflict', () => {
    const versioned = purchaseOrder.fields.some((f) => annotation(f, 'Version'));
    const locked = orders.methods.some((m) => /PESSIMISTIC_WRITE/.test(annotation(m, 'Lock')?.text ?? ''));
    const mapped = handler.methods.some(
      (m) =>
        /OptimisticLock|ConcurrencyFailure|StaleObjectState|StaleState/.test(
          annotation(m, 'ExceptionHandler')?.text ?? m.text,
        ) && /CONFLICT|409/.test(`${body(m)} ${annotation(m, 'ResponseStatus')?.text ?? ''}`),
    );
    check((versioned && mapped) || (!versioned && locked), 'Looked at ApiExceptionHandler.');
  });
});
