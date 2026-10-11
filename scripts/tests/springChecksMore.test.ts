/**
 * spring-po-approvals (Q3): more evidence that its read-only structure checks are fair, beyond
 * springChecks.test.ts.
 * - Other valid fixes (variants of the reference solution) pass every check.
 * - Partial fixes: the starter plus the reference fix of ONE bug passes exactly that bug's checks
 *   (and the starter plus every fix but one fails exactly the missing bug's checks).
 * - Wrong fixes, including ones that only hide a symptom or live in a comment, fail the check written
 *   for that bug and nothing else.
 * - Broken or unusual Java gives a clear outcome, never a hung run.
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it } from 'vitest';
import type { SandboxOutcome } from '../../src/features/runner/buildScript.ts';
import { JAVA_PARSE_LIMIT_MS, JAVA_TOO_SLOW } from '../../src/shared/javaModel.ts';
import { runSandboxTests, withSolution, type SourceFile } from '../lib/questionCheck.ts';
import { loadQuestion, QUESTIONS_DIR } from '../lib/questionSource.ts';

const q = loadQuestion(join(QUESTIONS_DIR, 'spring-po-approvals'));
const PKG = 'src/main/java/com/zycus/procurement/po/';
const starter: SourceFile[] = q.files.map((f) => ({ path: f.path, content: f.content }));
const referenceFiles = q.reference_solution?.files ?? [];
const solution = withSolution(starter, referenceFiles);

const SERVICE = 'ApprovalService.java';
const CONTROLLER = 'PurchaseOrderController.java';
const MATCHER = 'InvoiceMatcher.java';
const ORDERS = 'PurchaseOrderRepository.java';
const KEYS = 'IdempotencyRecordRepository.java';
const PO = 'PurchaseOrder.java';
const RECORD = 'IdempotencyRecord.java';
const HANDLER = 'ApiExceptionHandler.java';
type JavaFileName =
  | typeof SERVICE
  | typeof CONTROLLER
  | typeof MATCHER
  | typeof ORDERS
  | typeof KEYS
  | typeof PO
  | typeof RECORD
  | typeof HANDLER;

function reference(name: JavaFileName): string {
  const file = referenceFiles.find((f) => f.path === PKG + name);
  if (!file) throw new Error(`the reference solution has no ${name}`);
  return file.content;
}
/** A part of a reference solution file (it must be there). */
function section(name: JavaFileName, re: RegExp): string {
  const m = re.exec(reference(name));
  if (!m) throw new Error(`no ${String(re)} in the reference ${name}`);
  return m[0];
}

// ── Editing helpers ─────────────────────────────────────────────────────────
type Edit = (src: string) => string;
type Edits = Partial<Record<JavaFileName, Edit>>;

/** Replaces the first match of `from` (it must occur) with literal text (no `$` patterns). */
const replace =
  (from: string | RegExp, to: string): Edit =>
  (src) => {
    const out = src.replace(from, () => to);
    if (out === src) throw new Error(`edit not applicable, pattern not found: ${String(from)}`);
    return out;
  };
/** Replaces every occurrence of `from` (at least one). */
const replaceEvery =
  (from: string, to: string): Edit =>
  (src) => {
    if (!src.includes(from)) throw new Error(`edit not applicable, text not found: ${from}`);
    return src.split(from).join(to);
  };
/** Replaces `from` if it occurs (for fixes that are applied on top of other fixes or not). */
const replaceIfPresent =
  (from: string, to: string): Edit =>
  (src) =>
    src.split(from).join(to);
const chain =
  (...edits: Edit[]): Edit =>
  (src) =>
    edits.reduce((s, e) => e(s), src);
const whole =
  (content: string): Edit =>
  () =>
    content;
/** Adds import lines after the last import (Java doesn't care about their order). */
const addImports =
  (...names: string[]): Edit =>
  (src) => {
    const missing = names.filter((n) => !src.includes(`import ${n};`));
    const at = src.indexOf('\n', src.lastIndexOf('\nimport ') + 1) + 1;
    return src.slice(0, at) + missing.map((n) => `import ${n};\n`).join('') + src.slice(at);
  };
/** Renames a Java identifier (not after a `.` and not a method name); it must occur. */
const rename =
  (name: string, to: string): Edit =>
  (src) => {
    const out = src.replace(new RegExp(`(?<![.\\w])${name}(?![\\w(])`, 'g'), () => to);
    if (out === src) throw new Error(`edit not applicable, identifier not found: ${name}`);
    return out;
  };
/** Inserts members before the closing brace of the file's (last) top-level type. */
const appendMembers =
  (members: string): Edit =>
  (src) =>
    replace(/\n\}\n$/, `\n\n${members}}\n`)(src);

/** Applies `edits` (Java file name → edit); every edit must change its file. */
function edit(files: SourceFile[], edits: Edits): SourceFile[] {
  return files.map((f) => {
    const e = f.path.startsWith(PKG) ? edits[f.path.slice(PKG.length) as JavaFileName] : undefined;
    if (!e) return f;
    const content = e(f.content);
    if (content === f.content) throw new Error(`edit changed nothing in ${f.path}`);
    return { path: f.path, content };
  });
}
const javaFile = (files: SourceFile[], name: JavaFileName) =>
  files.find((f) => f.path === PKG + name)!.content;

// ── Running the checks ──────────────────────────────────────────────────────
async function results(files: SourceFile[]) {
  const o = await runSandboxTests(files);
  if (o.type !== 'done') throw new Error(`the run did not complete: ${JSON.stringify(o).slice(0, 2000)}`);
  if (o.results.length === 0) throw new Error('the run reported no checks');
  return o.results;
}
/** The checks that don't pass, with their messages (for readable failures). */
const failures = async (files: SourceFile[]) =>
  (await results(files)).filter((r) => r.status !== 'passed').map((r) => `${r.name}: ${r.error}`);
/** Names of the checks that don't pass, sorted. */
const failing = async (files: SourceFile[]) =>
  (await results(files))
    .filter((r) => r.status !== 'passed')
    .map((r) => r.name)
    .sort();
const statuses = async (files: SourceFile[]) =>
  Object.fromEntries((await results(files)).map((r) => [r.name, r.status]));

// ── The checks and the bugs they detect (bugs as numbered in statement.md / notes.md) ──
const T = {
  rejectReadWrite: 'transactions › a rejection runs in a read-write transaction',
  approveRollsBack: 'transactions › an approval the budget refuses is rolled back',
  batchOwnTx: 'batch approval › each PO in a batch is approved in its own transaction',
  batchRollsBack: 'batch approval › a PO the budget refuses is rolled back on its own',
  batchContinues:
    "batch approval › a PO that can't be approved (already decided, unknown, changed meanwhile) doesn't stop the others",
  keyUnique: 'idempotency › a key is unique per approver in the database',
  claimFirst: 'idempotency › retries that arrive at the same time are applied once',
  keyPerApprover: 'idempotency › a key is looked up for its own approver only',
  keyReuse: 'idempotency › reusing a key for a different PO is refused',
  remembers: 'approvers › a PO remembers who approved it',
  noRepeat: "approvers › the same person can't give both approvals of a PO",
  locking: "approvers › two people approving at the same moment can't overwrite each other's approval",
  conflict409: 'approvers › a concurrent change is answered with 409 Conflict',
  amounts: 'invoice matching › amounts are compared by value, whatever their scale (1500.0 = 1500.00)',
  quantities: 'invoice matching › quantities of a SKU split over several invoice lines are added up',
  loadsLines: "invoice matching › matching an invoice loads the PO's lines (open-in-view is off)",
  firstPage: 'inbox paging › page 1 is the first page',
  pageZero: 'inbox paging › page 0 is refused',
  stableSort: 'inbox paging › the order is stable: newest first, ties broken by id',
  dbPaging: 'inbox paging › the inbox is paged in the database, not in memory',
} as const;

type Bug = 1 | 2 | 3 | 4 | 5;
const BUGS: Bug[] = [1, 2, 3, 4, 5];
const CHECKS_OF_BUG: Record<Bug, string[]> = {
  /** "I rejected it and it came back." */
  1: [T.rejectReadWrite],
  /** "Finance found approved POs with no budget." */
  2: [T.approveRollsBack, T.batchOwnTx, T.batchRollsBack, T.batchContinues],
  /** "₹40 lakh POs approved by a single person." */
  3: [
    T.keyUnique,
    T.claimFirst,
    T.keyPerApprover,
    T.keyReuse,
    T.remembers,
    T.noRepeat,
    T.locking,
    T.conflict409,
  ],
  /** "Invoices that match are flagged, and an over-invoice passed." */
  4: [T.amounts, T.quantities, T.loadsLines],
  /** "The inbox skips the newest POs." */
  5: [T.firstPage, T.pageZero, T.stableSort, T.dbPaging],
};

// ── Parts of the reference solution ─────────────────────────────────────────
const REF = {
  keyReusedException: section(SERVICE, / {4}\/\*\* The Idempotency-Key was already used[\s\S]*?\n {4}\}\n/),
  list: section(SERVICE, / {4}\/\*\*\n {5}\* The database pages the ids[\s\S]*?\n {4}\}\n/),
  approveBody: /throws BudgetExceededException \{\n([\s\S]*?)\n {4}\}\n/.exec(reference(SERVICE))?.[1] ?? '',
  batch: section(
    SERVICE,
    / {4}\/\*\*\n {5}\* Approves several POs[\s\S]*?(?=\n {4}private PurchaseOrder find)/,
  ),
  newestFirst: section(CONTROLLER, / {4}\/\*\* Newest first;[\s\S]*?;\n/),
  controllerList: section(CONTROLLER, / {4}\/\*\* The inbox, newest first\.[\s\S]*?\n {4}\}\n/),
  matchLoad: section(CONTROLLER, / {8}\/\/ open-in-view is off[\s\S]*?new PoNotFoundException\(id\)\);/),
  findWithLines: section(ORDERS, / {4}\/\*\* For callers outside a transaction[\s\S]*?;\n/),
  inboxQueries: section(
    ORDERS,
    / {4}\/\*\*\n {5}\* One page of the inbox[\s\S]*?findAllWithLines\([^;]*\);\n/,
  ),
};
if (!REF.approveBody.includes('idempotency.claim(')) throw new Error('reference approve() body not found');

// Regions of the reference files that variants rewrite.
const APPROVE_METHOD =
  / {4}@Transactional\(rollbackFor = BudgetExceededException\.class\)\n {4}public PurchaseOrderDto approve\([\s\S]*?\n {4}\}\n/;
const BATCH_METHODS =
  / {4}@Transactional\(propagation = Propagation\.NOT_SUPPORTED\)\n {4}public BatchResult approveBatch[\s\S]*?(?=\n {4}private PurchaseOrder find)/;
const LIST_METHOD = / {4}\/\*\*\n {5}\* The database pages the ids[\s\S]*?\n {4}\}\n/;
const INBOX_QUERIES = / {4}\/\*\*\n {5}\* One page of the inbox[\s\S]*?findAllWithLines\([^;]*\);\n/;
const STALE_UPDATE_HANDLER =
  / {4}@ExceptionHandler\(OptimisticLockingFailureException\.class\)\n {4}public ProblemDetail staleUpdate[\s\S]*?\n {4}\}\n/;
const TEMPLATE_FIELD =
  '    /** One transaction per PO in a batch (REQUIRES_NEW). */\n    private final TransactionTemplate perPo;\n';
const TEMPLATE_INIT =
  /\n {8}this\.perPo = new TransactionTemplate\(transactions\);\n {8}this\.perPo\.setPropagationBehavior\([^;]*;/;
const APPROVE_RESERVE =
  '        if (po.getStatus() == PoStatus.APPROVED) {\n            budget.reserve(po.getId(), po.getTotal());\n        }\n';
const VALIDATION = '        if (page < 1 || size < 1 || size > 100) {';

/** A second TransactionTemplate (PROPAGATION_REQUIRED, read-write) named `writes`. */
const WRITES_TEMPLATE: Edit = chain(
  replace(
    TEMPLATE_FIELD,
    `${TEMPLATE_FIELD}    /** Read-write transactions for the methods that run outside the class's read-only one. */\n    private final TransactionTemplate writes;\n`,
  ),
  replace(
    '        this.perPo.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);\n',
    '        this.perPo.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);\n        this.writes = new TransactionTemplate(transactions);\n',
  ),
);

/** This service through its Spring proxy instead of the TransactionTemplate. */
const SELF_PROXY: Edit = chain(
  replace(
    TEMPLATE_FIELD,
    '    /** This service through its Spring proxy (a call on this would bypass it). */\n    @Autowired\n    @Lazy\n    private ApprovalService self;\n',
  ),
  replace(TEMPLATE_INIT, ''),
  addImports(
    'org.springframework.beans.factory.annotation.Autowired',
    'org.springframework.context.annotation.Lazy',
  ),
);
const NO_TEMPLATE: Edit = chain(replace(TEMPLATE_FIELD, ''), replace(TEMPLATE_INIT, ''));

/** approveBatch calls `call(id, approverId)` for each PO; approveOne is declared with `declaration`. */
const batchCalling = (call: string, declaration: string): Edit =>
  replace(
    BATCH_METHODS,
    `    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public BatchResult approveBatch(List<Long> ids, String approverId) {
        BatchResult result = new BatchResult();
        for (Long id : ids) {
            try {
                ${call}(id, approverId);
                result.approved(id);
            } catch (BudgetExceededException | RuntimeException e) {
                result.failed(id, e.getMessage());
            }
        }
        return result;
    }

    ${declaration} void approveOne(long id, String approverId) throws BudgetExceededException {
        PurchaseOrder po = find(id);
        po.recordApproval(approverId);
        if (po.getStatus() == PoStatus.APPROVED) {
            budget.reserve(id, po.getTotal());
        }
    }
`,
  );
const REQUIRES_NEW_ROLLBACK =
  '@Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = BudgetExceededException.class)\n   ';

/** approve() rolls back a refused budget with setRollbackOnly() instead of rollbackFor. */
const APPROVE_SET_ROLLBACK_ONLY: Edit = chain(
  replace(
    '    @Transactional(rollbackFor = BudgetExceededException.class)\n    public PurchaseOrderDto approve(',
    '    @Transactional\n    public PurchaseOrderDto approve(',
  ),
  replace(
    APPROVE_RESERVE,
    `        if (po.getStatus() == PoStatus.APPROVED) {
            try {
                budget.reserve(po.getId(), po.getTotal());
            } catch (BudgetExceededException e) {
                // Checked, so not rolled back by default: undo the approval and the key claim.
                TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                throw e;
            }
        }
`,
  ),
  addImports('org.springframework.transaction.interceptor.TransactionAspectSupport'),
);

/** IdempotencyRecord with a public constructor (for designs that insert the record with save*). */
const RECORD_CONSTRUCTOR: Edit = replace(
  '    protected IdempotencyRecord() {\n    }\n',
  `    protected IdempotencyRecord() {
    }

    public IdempotencyRecord(String key, String approverId, long purchaseOrderId) {
        this.key = key;
        this.approverId = approverId;
        this.purchaseOrderId = purchaseOrderId;
    }
`,
);

/** saveAndFlush first; on a duplicate the transaction is aborted, so the replay runs in a new one. */
const APPROVE_INSERT_FIRST = `    /**
     * Inserts the key first (unique per approver). A duplicate waits for the original on the unique
     * index and then fails; PostgreSQL has aborted that transaction, so the replay runs in a new one.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public PurchaseOrderDto approve(long poId, String approverId, String idempotencyKey)
            throws BudgetExceededException {
        BudgetExceededException[] refused = new BudgetExceededException[1];
        PurchaseOrderDto approved;
        try {
            approved = writes.execute(status -> {
                idempotency.saveAndFlush(new IdempotencyRecord(idempotencyKey, approverId, poId));
                PurchaseOrder po = find(poId);
                po.recordApproval(approverId);
                if (po.getStatus() == PoStatus.APPROVED) {
                    try {
                        budget.reserve(po.getId(), po.getTotal());
                    } catch (BudgetExceededException e) {
                        status.setRollbackOnly();
                        refused[0] = e;
                        return null;
                    }
                }
                return PurchaseOrderDto.from(po);
            });
        } catch (DataIntegrityViolationException duplicate) {
            return writes.execute(status -> {
                IdempotencyRecord previous = idempotency.findByApproverIdAndKey(approverId, idempotencyKey)
                        .orElseThrow();
                if (previous.getPurchaseOrderId() != poId) {
                    throw new IdempotencyKeyReusedException(idempotencyKey);
                }
                return PurchaseOrderDto.from(find(poId));
            });
        }
        if (refused[0] != null) {
            throw refused[0];
        }
        return approved;
    }
`;
const insertFirstFiles = (approve: string) =>
  edit(solution, {
    [SERVICE]: chain(
      WRITES_TEMPLATE,
      replace(APPROVE_METHOD, approve),
      addImports('org.springframework.dao.DataIntegrityViolationException'),
    ),
    [RECORD]: RECORD_CONSTRUCTOR,
  });

// ── 1. Partial fixes ────────────────────────────────────────────────────────
/** The reference fix of each bug, as edits of the starter (applied in this order, so they compose). */
const FIXES: Record<Bug, Edits> = {
  1: {
    [SERVICE]: replace(
      '\n    public PurchaseOrderDto reject(',
      '\n    /** Was read-only (inherited from the class), so Hibernate never flushed the rejection. */\n    @Transactional\n    public PurchaseOrderDto reject(',
    ),
  },
  2: {
    [SERVICE]: chain(
      replace(
        '    private final BudgetService budget;\n',
        '    private final BudgetService budget;\n    /** One transaction per PO in a batch (REQUIRES_NEW). */\n    private final TransactionTemplate perPo;\n',
      ),
      replace('BudgetService budget) {', 'BudgetService budget, PlatformTransactionManager transactions) {'),
      replace(
        '        this.budget = budget;\n    }',
        '        this.budget = budget;\n        this.perPo = new TransactionTemplate(transactions);\n        this.perPo.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);\n    }',
      ),
      replace(
        '    @Transactional\n    public PurchaseOrderDto approve(',
        '    @Transactional(rollbackFor = BudgetExceededException.class)\n    public PurchaseOrderDto approve(',
      ),
      // The batch of the reference, minus bug 3's approver id (recordApproval() has no parameter yet).
      replace(
        / {4}\/\*\* Approves several POs; one PO failing[\s\S]*?(?=\n {4}private PurchaseOrder find)/,
        REF.batch.replace('po.recordApproval(approverId);', 'po.recordApproval();'),
      ),
      addImports(
        'org.springframework.dao.OptimisticLockingFailureException',
        'org.springframework.transaction.PlatformTransactionManager',
        'org.springframework.transaction.TransactionDefinition',
        'org.springframework.transaction.TransactionStatus',
        'org.springframework.transaction.support.TransactionTemplate',
      ),
    ),
  },
  3: {
    [SERVICE]: chain(
      replace(
        'public class ApprovalService {\n',
        `public class ApprovalService {\n\n${REF.keyReusedException}`,
      ),
      replace(/(?<=public PurchaseOrderDto approve\([^{]*\{\n)[\s\S]*?(?=\n {4}\}\n)/, REF.approveBody),
      // The batch records the approver too (starter batch or bug 2's).
      replaceEvery('po.recordApproval();', 'po.recordApproval(approverId);'),
      replaceIfPresent('                approveOne(id);', '                approveOne(id, approverId);'),
      replaceIfPresent(
        'public void approveOne(long id) throws',
        'public void approveOne(long id, String approverId) throws',
      ),
    ),
    [KEYS]: whole(reference(KEYS)),
    [PO]: whole(reference(PO)),
    [RECORD]: whole(reference(RECORD)),
    [HANDLER]: whole(reference(HANDLER)),
  },
  4: {
    [MATCHER]: whole(reference(MATCHER)),
    [ORDERS]: chain(
      appendMembers(REF.findWithLines),
      addImports('java.util.Optional', 'org.springframework.data.jpa.repository.EntityGraph'),
    ),
    [CONTROLLER]: replace(
      '        PurchaseOrder po = orders.findById(id).orElseThrow(() -> new PoNotFoundException(id));',
      REF.matchLoad,
    ),
  },
  5: {
    [SERVICE]: chain(
      replace(
        '    public Page<PurchaseOrderDto> list(Pageable pageable) {\n        return orders.findPageWithLines(pageable).map(PurchaseOrderDto::from);\n    }\n',
        REF.list,
      ),
      addImports('java.util.Map', 'java.util.function.Function', 'java.util.stream.Collectors'),
    ),
    [ORDERS]: chain(
      replace(
        / {4}\/\*\* The approvals inbox[\s\S]*?findPageWithLines\(Pageable pageable\);\n/,
        REF.inboxQueries,
      ),
      addImports('java.util.Collection', 'java.util.List', 'org.springframework.data.repository.query.Param'),
    ),
    [CONTROLLER]: chain(
      replace(
        'public class PurchaseOrderController {\n',
        `public class PurchaseOrderController {\n\n${REF.newestFirst}`,
      ),
      replace(/ {4}\/\*\* The inbox, newest first\.[\s\S]*?\n {4}\}\n/, REF.controllerList),
      addImports('org.springframework.data.domain.Sort'),
    ),
  },
};

function withFixes(bugs: Bug[]): SourceFile[] {
  return BUGS.filter((b) => bugs.includes(b)).reduce((files, b) => edit(files, FIXES[b]), starter);
}
function expectedStatuses(fixed: Bug[]) {
  return Object.fromEntries(
    BUGS.flatMap((b) => CHECKS_OF_BUG[b].map((name) => [name, fixed.includes(b) ? 'passed' : 'failed'])),
  );
}
const except = (bug: Bug) => BUGS.filter((b) => b !== bug);

describe.concurrent('spring-po-approvals: partial fixes pass exactly the checks of the bugs they fix', () => {
  it('every check belongs to exactly one bug', async ({ expect }) => {
    const mapped = BUGS.flatMap((b) => CHECKS_OF_BUG[b]);
    expect(new Set(mapped).size).toBe(mapped.length);
    expect(Object.keys(await statuses(solution)).sort()).toEqual([...mapped].sort());
  }, 120_000);

  it('the starter fails every check', async ({ expect }) => {
    expect(await statuses(starter)).toEqual(expectedStatuses([]));
  }, 120_000);

  it('the five fixes together pass every check', async ({ expect }) => {
    expect(await failures(withFixes(BUGS))).toEqual([]);
  }, 120_000);

  it.for(BUGS)('fixing only bug %i', { timeout: 120_000 }, async (bug, { expect }) => {
    expect(await statuses(withFixes([bug]))).toEqual(expectedStatuses([bug]));
  });

  it.for(BUGS)('fixing every bug except %i', { timeout: 120_000 }, async (bug, { expect }) => {
    expect(await statuses(withFixes(except(bug)))).toEqual(expectedStatuses(except(bug)));
  });
});

// ── 2. Other valid fixes ────────────────────────────────────────────────────
describe.concurrent('spring-po-approvals: other valid fixes pass every check', () => {
  it('transactions: read-write class default, readOnly only on the inbox (reject inherits it)', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        replace(
          '@Service\n@Transactional(readOnly = true)\npublic class',
          '@Service\n@Transactional\npublic class',
        ),
        replace(
          '    public Page<PurchaseOrderDto> list(Pageable pageable) {',
          '    @Transactional(readOnly = true)\n    public Page<PurchaseOrderDto> list(Pageable pageable) {',
        ),
        replace(
          '    /** Was read-only (inherited from the class), so Hibernate never flushed the rejection. */\n    @Transactional\n',
          '    /** Read-write: the class default (only the inbox is read-only). */\n',
        ),
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('approve: a refused budget marks the transaction rollback-only (TransactionAspectSupport) and rethrows', async ({
    expect,
  }) => {
    const files = edit(solution, { [SERVICE]: APPROVE_SET_ROLLBACK_ONLY });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('approve and reject: programmatic transactions (TransactionTemplate) instead of annotations', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        WRITES_TEMPLATE,
        replace(
          APPROVE_METHOD,
          `    /** One read-write transaction (claim, approval, reservation) that a refused budget rolls back. */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public PurchaseOrderDto approve(long poId, String approverId, String idempotencyKey)
            throws BudgetExceededException {
        BudgetExceededException[] refused = new BudgetExceededException[1];
        PurchaseOrderDto approved = writes.execute(status -> {
            if (idempotency.claim(idempotencyKey, approverId, poId) == 0) {
                IdempotencyRecord previous = idempotency.findByApproverIdAndKey(approverId, idempotencyKey)
                        .orElseThrow();
                if (previous.getPurchaseOrderId() != poId) {
                    throw new IdempotencyKeyReusedException(idempotencyKey);
                }
                return PurchaseOrderDto.from(find(poId));
            }
            PurchaseOrder po = find(poId);
            po.recordApproval(approverId);
            if (po.getStatus() == PoStatus.APPROVED) {
                try {
                    budget.reserve(po.getId(), po.getTotal());
                } catch (BudgetExceededException e) {
                    status.setRollbackOnly();
                    refused[0] = e;
                    return null;
                }
            }
            return PurchaseOrderDto.from(po);
        });
        if (refused[0] != null) {
            throw refused[0];
        }
        return approved;
    }
`,
        ),
        replace(
          / {4}@Transactional\n {4}public PurchaseOrderDto reject\([^{]*\{[\s\S]*?\n {4}\}\n/,
          `    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public PurchaseOrderDto reject(long poId, String approverId, String reason) {
        return writes.execute(status -> {
            PurchaseOrder po = find(poId);
            po.reject(reason);
            return PurchaseOrderDto.from(po);
        });
    }
`,
        ),
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('idempotency: saveAndFlush first, the replay in a new transaction after the unique-key violation', async ({
    expect,
  }) => {
    expect(await failures(insertFirstFiles(APPROVE_INSERT_FIRST))).toEqual([]);
  }, 120_000);

  it('batch: a separate bean (nested @Service) with REQUIRES_NEW and rollbackFor', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        replace(
          TEMPLATE_FIELD,
          '    /** Approves one PO of a batch; another bean, so the call goes through its proxy. */\n    private final SinglePoApprover perPo;\n',
        ),
        replace(
          'BudgetService budget, PlatformTransactionManager transactions) {',
          'BudgetService budget, SinglePoApprover perPo) {',
        ),
        replace(TEMPLATE_INIT, '\n        this.perPo = perPo;'),
        replace(
          'public class ApprovalService {\n',
          `public class ApprovalService {

    /** One PO of a batch, in a new transaction that a refused budget rolls back. */
    @Service
    public static class SinglePoApprover {

        private final PurchaseOrderRepository orders;
        private final BudgetService budget;

        public SinglePoApprover(PurchaseOrderRepository orders, BudgetService budget) {
            this.orders = orders;
            this.budget = budget;
        }

        @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = BudgetExceededException.class)
        public void approveInNewTransaction(long id, String approverId) throws BudgetExceededException {
            PurchaseOrder po = orders.findById(id).orElseThrow(() -> new PoNotFoundException(id));
            po.recordApproval(approverId);
            if (po.getStatus() == PoStatus.APPROVED) {
                budget.reserve(id, po.getTotal());
            }
        }
    }
`,
        ),
        replace(
          BATCH_METHODS,
          `    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public BatchResult approveBatch(List<Long> ids, String approverId) {
        BatchResult result = new BatchResult();
        for (Long id : ids) {
            try {
                perPo.approveInNewTransaction(id, approverId);
                result.approved(id);
            } catch (BudgetExceededException e) {
                result.failed(id, e.getMessage());
            } catch (RuntimeException e) {
                result.failed(id, e.getMessage());
            }
        }
        return result;
    }
`,
        ),
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('batch: TransactionOperations built from a REQUIRES_NEW definition, the batch keeps @Transactional', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        replace(
          '    private final TransactionTemplate perPo;',
          '    private final TransactionOperations perPo;',
        ),
        replace(
          TEMPLATE_INIT,
          '\n        this.perPo = new TransactionTemplate(transactions,\n                new DefaultTransactionDefinition(TransactionDefinition.PROPAGATION_REQUIRES_NEW));',
        ),
        // REQUIRES_NEW suspends the batch's transaction, so the POs still don't share one.
        replace(
          '    @Transactional(propagation = Propagation.NOT_SUPPORTED)\n    public BatchResult approveBatch(',
          '    @Transactional\n    public BatchResult approveBatch(',
        ),
        addImports(
          'org.springframework.transaction.support.TransactionOperations',
          'org.springframework.transaction.support.DefaultTransactionDefinition',
        ),
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('invoice: a JPQL fetch join instead of @EntityGraph', async ({ expect }) => {
    const files = edit(solution, {
      [ORDERS]: replace(
        '    @EntityGraph(attributePaths = "lines")\n    Optional<PurchaseOrder> findWithLinesById(long id);',
        '    @Query("select p from PurchaseOrder p left join fetch p.lines where p.id = :id")\n    Optional<PurchaseOrder> findWithLinesById(@Param("id") long id);',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('invoice: the match runs in a @Transactional(readOnly = true) service method', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        replace(
          '    private final BudgetService budget;\n',
          '    private final BudgetService budget;\n    private final InvoiceMatcher matcher;\n',
        ),
        replace(
          'BudgetService budget, PlatformTransactionManager transactions) {',
          'BudgetService budget, PlatformTransactionManager transactions, InvoiceMatcher matcher) {',
        ),
        replace(
          '        this.budget = budget;\n',
          '        this.budget = budget;\n        this.matcher = matcher;\n',
        ),
        replace(
          '    private PurchaseOrder find(long id) {',
          "    /** In the class's read-only transaction, so the lazy lines load (open-in-view is off). */\n    public MatchResult matchInvoice(long poId, InvoiceRequest invoice) {\n        return matcher.match(find(poId), invoice);\n    }\n\n    private PurchaseOrder find(long id) {",
        ),
        addImports(
          'com.zycus.procurement.po.Dtos.InvoiceRequest',
          'com.zycus.procurement.po.Dtos.MatchResult',
        ),
      ),
      [CONTROLLER]: replace(
        / {8}\/\/ open-in-view is off[\s\S]*?return matcher\.match\(po, invoice\);/,
        '        return approvals.matchInvoice(id, invoice);',
      ),
      [ORDERS]: replace(REF.findWithLines, ''),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('invoice: quantities added up with getOrDefault + put', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: replace(
        'invoiced.merge(line.sku(), line.quantity(), Integer::sum);',
        'invoiced.put(line.sku(), invoiced.getOrDefault(line.sku(), 0) + line.quantity());',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('inbox: Sort.by(Direction.DESC, "createdAt", "id")', async ({ expect }) => {
    const files = edit(solution, {
      [CONTROLLER]: replace(
        'Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))',
        'Sort.by(Sort.Direction.DESC, "createdAt", "id")',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('inbox: the Sort built inline with static Order.desc imports', async ({ expect }) => {
    const files = edit(solution, {
      [CONTROLLER]: chain(
        replace(REF.newestFirst + '\n', ''),
        replace(
          'PageRequest.of(page - 1, size, NEWEST_FIRST)',
          'PageRequest.of(page - 1, size, Sort.by(desc("createdAt"), desc("id")))',
        ),
        addImports('static org.springframework.data.domain.Sort.Order.desc'),
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('inbox: two queries with an explicit count query, the lines by @EntityGraph', async ({ expect }) => {
    const files = edit(solution, {
      [ORDERS]: chain(
        replace(
          '    @Query("select p.id from PurchaseOrder p")',
          '    @Query(value = "select p.id from PurchaseOrder p", countQuery = "select count(p) from PurchaseOrder p")',
        ),
        replace(
          '    @Query("select distinct p from PurchaseOrder p left join fetch p.lines where p.id in :ids")\n    List<PurchaseOrder> findAllWithLines(@Param("ids") Collection<Long> ids);',
          '    @EntityGraph(attributePaths = "lines")\n    List<PurchaseOrder> findByIdIn(Collection<Long> ids);',
        ),
      ),
      [SERVICE]: replace('orders.findAllWithLines(ids.getContent())', 'orders.findByIdIn(ids.getContent())'),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('inbox: @BatchSize on the lines and a plain findAll(Pageable)', async ({ expect }) => {
    const files = edit(solution, {
      [PO]: chain(
        replace('    @OneToMany(mappedBy', '    @BatchSize(size = 100)\n    @OneToMany(mappedBy'),
        addImports('org.hibernate.annotations.BatchSize'),
      ),
      [ORDERS]: replace(INBOX_QUERIES, ''),
      [SERVICE]: replace(
        LIST_METHOD,
        '    /** One page of POs; their lines load in batches (@BatchSize), not with a fetch join. */\n    public Page<PurchaseOrderDto> list(Pageable pageable) {\n        return orders.findAll(pageable).map(PurchaseOrderDto::from);\n    }\n',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('inbox: a DTO projection with a line-count subquery', async ({ expect }) => {
    const files = edit(solution, {
      [ORDERS]: chain(
        replace(
          INBOX_QUERIES,
          `    /** One page of the inbox as DTOs; the line count is a subquery, so the database pages it. */
    @Query(value = "select new com.zycus.procurement.po.Dtos$PurchaseOrderDto(p.id, p.number, p.status,"
            + " p.total, p.approvalsReceived, p.approvalsRequired, size(p.lines)) from PurchaseOrder p",
           countQuery = "select count(p) from PurchaseOrder p")
    Page<PurchaseOrderDto> findInbox(Pageable pageable);
`,
        ),
        addImports('com.zycus.procurement.po.Dtos.PurchaseOrderDto'),
      ),
      [SERVICE]: replace(
        LIST_METHOD,
        '    public Page<PurchaseOrderDto> list(Pageable pageable) {\n        return orders.findInbox(pageable);\n    }\n',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('concurrency: @Version plus a @Lock(OPTIMISTIC_FORCE_INCREMENT) lookup', async ({ expect }) => {
    const files = edit(solution, {
      [ORDERS]: chain(
        appendMembers(
          '    /** Every approval bumps the version, so concurrent approvers conflict. */\n    @Lock(LockModeType.OPTIMISTIC_FORCE_INCREMENT)\n    @Query("select p from PurchaseOrder p where p.id = :id")\n    Optional<PurchaseOrder> findForApproval(@Param("id") long id);\n',
        ),
        addImports('jakarta.persistence.LockModeType', 'org.springframework.data.jpa.repository.Lock'),
      ),
      [SERVICE]: replace(
        'return orders.findById(id).orElseThrow(',
        'return orders.findForApproval(id).orElseThrow(',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('409: the handler returns a ResponseEntity', async ({ expect }) => {
    const files = edit(solution, {
      [HANDLER]: chain(
        replace(
          STALE_UPDATE_HANDLER,
          `    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ProblemDetail> staleUpdate(OptimisticLockingFailureException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, "The purchase order was changed by someone else. Refresh and try again."));
    }
`,
        ),
        addImports('org.springframework.http.ResponseEntity'),
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('409: OptimisticLockingFailureException added to the existing 409 handler', async ({ expect }) => {
    const files = edit(solution, {
      [HANDLER]: chain(
        replace(/ {4}\/\*\* Someone else changed the PO[^\n]*\n/, ''),
        replace(STALE_UPDATE_HANDLER, ''),
        replace(
          '    @ExceptionHandler(IllegalStateException.class)\n    public ProblemDetail conflict(IllegalStateException e) {',
          '    @ExceptionHandler({IllegalStateException.class, OptimisticLockingFailureException.class})\n    public ProblemDetail conflict(RuntimeException e) {',
        ),
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('idempotency: the per-approver uniqueness as a unique @Index', async ({ expect }) => {
    const files = edit(solution, {
      [RECORD]: chain(
        replace(
          /uniqueConstraints = @UniqueConstraint\(name = "uk_idempotency_approver_key",\s+columnNames = \{"approver_id", "idem_key"\}\)\)/,
          'indexes = @Index(name = "uk_idempotency_approver_key", columnList = "approver_id, idem_key", unique = true))',
        ),
        addImports('jakarta.persistence.Index'),
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  // ── Valid fixes the checks reject ──
  // Collectors.toMap(sku, quantity, Integer::sum): the most idiomatic stream form of the sum.
  it('invoice: quantities summed with Collectors.toMap(..., Integer::sum)', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: chain(
        replace('        Map<String, Integer> invoiced = new LinkedHashMap<>();\n', ''),
        replace('            invoiced.merge(line.sku(), line.quantity(), Integer::sum);\n', ''),
        replace(
          '        invoiced.forEach((sku, quantity) -> {',
          '        Map<String, Integer> invoiced = invoice.lines().stream()\n                .filter(line -> bySku.containsKey(line.sku()))\n                .collect(Collectors.toMap(InvoiceLine::sku, InvoiceLine::quantity, Integer::sum));\n        invoiced.forEach((sku, quantity) -> {',
        ),
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // Map.compute: a null-safe running sum.
  it('invoice: quantities summed with Map.compute', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: replace(
        'invoiced.merge(line.sku(), line.quantity(), Integer::sum);',
        'invoiced.compute(line.sku(), (sku, sum) -> (sum == null ? 0 : sum) + line.quantity());',
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // stripTrailingZeros() on both sides, then equals: by value (1500.0 and 1500.00 both become 1.5E+3).
  it('invoice: amounts compared with stripTrailingZeros().equals', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: chain(
        replace(
          'if (po.getTotal().compareTo(invoice.amount()) != 0) {',
          'if (!po.getTotal().stripTrailingZeros().equals(invoice.amount().stripTrailingZeros())) {',
        ),
        replace(
          'if (poLine.getUnitPrice().compareTo(line.unitPrice()) != 0) {',
          'if (!poLine.getUnitPrice().stripTrailingZeros().equals(line.unitPrice().stripTrailingZeros())) {',
        ),
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // @ResponseStatus(HttpStatus.CONFLICT) on the handler answers 409 too.
  it('409: @ResponseStatus(HttpStatus.CONFLICT) on the handler', async ({ expect }) => {
    const files = edit(solution, {
      [HANDLER]: chain(
        replace(
          STALE_UPDATE_HANDLER,
          `    @ExceptionHandler(OptimisticLockingFailureException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> staleUpdate(OptimisticLockingFailureException e) {
        return Map.of("detail", "The purchase order was changed by someone else. Refresh and try again.");
    }
`,
        ),
        addImports('java.util.Map', 'org.springframework.web.bind.annotation.ResponseStatus'),
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // Spring's Assert.isTrue(page >= 1, ...) throws IllegalArgumentException (400, and what the JUnit
  // test expects).
  it('inbox: page validated with Assert.isTrue(page >= 1, ...)', async ({ expect }) => {
    const files = edit(solution, {
      [CONTROLLER]: chain(
        replace(
          `${VALIDATION}\n            throw new IllegalArgumentException("page starts at 1 and size must be between 1 and 100");\n        }`,
          '        Assert.isTrue(page >= 1, "page starts at 1");\n        Assert.isTrue(size >= 1 && size <= 100, "size must be between 1 and 100");',
        ),
        addImports('org.springframework.util.Assert'),
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // The order declared in the ids query (order by p.createdAt desc, p.id desc): stable, and applied
  // by the database.
  it('inbox: the order declared in the repository query', async ({ expect }) => {
    const files = edit(solution, {
      [ORDERS]: replace(
        '    @Query("select p.id from PurchaseOrder p")',
        '    @Query(value = "select p.id from PurchaseOrder p order by p.createdAt desc, p.id desc",\n           countQuery = "select count(p) from PurchaseOrder p")',
      ),
      [CONTROLLER]: chain(
        replace(REF.newestFirst + '\n', ''),
        replace('PageRequest.of(page - 1, size, NEWEST_FIRST)', 'PageRequest.of(page - 1, size)'),
        replace('import org.springframework.data.domain.Sort;\n', ''),
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // The old paged fetch-join method left in the repository: harmless while the inbox doesn't call it.
  it('inbox: the old findPageWithLines left in the repository, unused', async ({ expect }) => {
    const files = edit(solution, {
      [ORDERS]: appendMembers(
        '    @Query(value = "select distinct p from PurchaseOrder p left join fetch p.lines",\n           countQuery = "select count(p) from PurchaseOrder p")\n    Page<PurchaseOrder> findPageWithLines(Pageable pageable);\n',
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // The stored PO id read into a local variable first.
  it('idempotency: the stored PO id compared through a local variable', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: replace(
        '            IdempotencyRecord previous = idempotency.findByApproverIdAndKey(approverId, idempotencyKey)\n                    .orElseThrow();\n            if (previous.getPurchaseOrderId() != poId) {',
        '            long usedFor = idempotency.findByApproverIdAndKey(approverId, idempotencyKey)\n                    .orElseThrow()\n                    .getPurchaseOrderId();\n            if (usedFor != poId) {',
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // ...filter(same PO).orElseThrow(() -> new IdempotencyKeyReusedException(...)) refuses the reuse
  // without a `throw` statement.
  it('idempotency: key reuse refused with filter(...).orElseThrow(() -> new ...)', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: replace(
        / {12}IdempotencyRecord previous = idempotency\.findByApproverIdAndKey[\s\S]*?\n {12}\}\n/,
        '            idempotency.findByApproverIdAndKey(approverId, idempotencyKey)\n                    .filter(previous -> previous.getPurchaseOrderId() == poId)\n                    .orElseThrow(() -> new IdempotencyKeyReusedException(idempotencyKey));\n',
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // save(record) + flush() is the same as saveAndFlush(record).
  it('idempotency: save() + flush() instead of saveAndFlush()', async ({ expect }) => {
    const files = insertFirstFiles(
      APPROVE_INSERT_FIRST.replace(
        'idempotency.saveAndFlush(new IdempotencyRecord(idempotencyKey, approverId, poId));',
        'idempotency.save(new IdempotencyRecord(idempotencyKey, approverId, poId));\n                idempotency.flush();',
      ),
    );
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // A composite primary key (approver_id, idem_key) is a per-approver unique constraint too (and what
  // `on conflict (approver_id, idem_key)` needs).
  it('idempotency: (approver_id, idem_key) as a composite primary key', async ({ expect }) => {
    const files = edit(solution, {
      [RECORD]: chain(
        replace(
          /@Table\(name = "idempotency_records",[\s\S]*?\}\)\)\n/,
          '@Table(name = "idempotency_records")\n@IdClass(IdempotencyRecord.Key.class)\n',
        ),
        replace(
          '    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n\n    @Column(name = "idem_key", nullable = false)\n    private String key;\n\n    @Column(name = "approver_id", nullable = false)\n    private String approverId;\n',
          `    /** The primary key: keys are only unique per approver. */
    public static class Key implements Serializable {

        private String key;
        private String approverId;

        protected Key() {
        }

        public Key(String key, String approverId) {
            this.key = key;
            this.approverId = approverId;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Key k && k.key.equals(key) && k.approverId.equals(approverId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(key, approverId);
        }
    }

    @Id
    @Column(name = "idem_key", nullable = false)
    private String key;

    @Id
    @Column(name = "approver_id", nullable = false)
    private String approverId;
`,
        ),
        replace('import jakarta.persistence.UniqueConstraint;\n', ''),
        addImports('jakarta.persistence.IdClass', 'java.io.Serializable', 'java.util.Objects'),
      ),
      [KEYS]: replace(
        'JpaRepository<IdempotencyRecord, Long>',
        'JpaRepository<IdempotencyRecord, IdempotencyRecord.Key>',
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // The per-PO transaction and try/catch moved into a helper method of the service.
  it("batch: each PO's transaction and error handling in a helper method", async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: replace(
        / {8}for \(Long id : ids\) \{\n {12}try \{[\s\S]*?\n {8}return result;\n {4}\}\n/,
        `        for (Long id : ids) {
            approveInItsOwnTransaction(id, approverId, result);
        }
        return result;
    }

    /** One PO: its own transaction; a failure is reported in the result, not thrown. */
    private void approveInItsOwnTransaction(long id, String approverId, BatchResult result) {
        try {
            String refusal = perPo.execute(status -> approveOne(id, approverId, status));
            if (refusal == null) {
                result.approved(id);
            } else {
                result.failed(id, refusal);
            }
        } catch (PoNotFoundException | IllegalStateException | OptimisticLockingFailureException e) {
            result.failed(id, e.getMessage());
        }
    }
`,
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);

  // reject in a programmatic read-write transaction, with no @Transactional on the method or class.
  it('reject in a TransactionTemplate, without a class-level @Transactional', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        WRITES_TEMPLATE,
        replace('@Service\n@Transactional(readOnly = true)\npublic class', '@Service\npublic class'),
        replace(
          '    public Page<PurchaseOrderDto> list(Pageable pageable) {',
          '    @Transactional(readOnly = true)\n    public Page<PurchaseOrderDto> list(Pageable pageable) {',
        ),
        replace(
          / {4}@Transactional\n {4}public PurchaseOrderDto reject\([^{]*\{[\s\S]*?\n {4}\}\n/,
          `    public PurchaseOrderDto reject(long poId, String approverId, String reason) {
        return writes.execute(status -> {
            PurchaseOrder po = find(poId);
            po.reject(reason);
            return PurchaseOrderDto.from(po);
        });
    }
`,
        ),
      ),
    });
    expect(await failing(files)).toEqual([]);
  }, 120_000);
});

// ── 3. Wrong fixes ──────────────────────────────────────────────────────────
describe.concurrent('spring-po-approvals: wrong fixes fail the check written for that bug', () => {
  const SWALLOW = `        if (po.getStatus() == PoStatus.APPROVED) {
            try {
                budget.reserve(po.getId(), po.getTotal());
            } catch (BudgetExceededException e) {
                // Out of budget: keep the approval, finance follows up.
            }
        }
`;

  it('approve: BudgetExceededException caught and ignored', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        replace(
          '    @Transactional(rollbackFor = BudgetExceededException.class)\n    public PurchaseOrderDto approve(',
          '    @Transactional\n    public PurchaseOrderDto approve(',
        ),
        replace(APPROVE_RESERVE, SWALLOW),
      ),
    });
    expect(await failing(files)).toEqual([T.approveRollsBack]);
  }, 120_000);

  // With rollbackFor still declared, swallowing the exception means nothing is thrown, so nothing
  // rolls back and the PO is approved without budget (the JUnit test expects the exception).
  it('approve: BudgetExceededException swallowed while rollbackFor is declared', async ({ expect }) => {
    const files = edit(solution, { [SERVICE]: replace(APPROVE_RESERVE, SWALLOW) });
    expect(await failing(files)).toEqual([T.approveRollsBack]);
  }, 120_000);

  it('reject: readOnly = true written out on a write path', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: replace(
        '    @Transactional\n    public PurchaseOrderDto reject(',
        '    @Transactional(readOnly = true)\n    public PurchaseOrderDto reject(',
      ),
    });
    expect(await failing(files)).toEqual([T.rejectReadWrite]);
  }, 120_000);

  // approve with readOnly = true (FlushMode.MANUAL, read-only JDBC connection: the claim's insert
  // fails, the approval is never flushed), even next to rollbackFor.
  it('approve: readOnly = true next to rollbackFor', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: replace(
        '@Transactional(rollbackFor = BudgetExceededException.class)\n    public PurchaseOrderDto approve(',
        '@Transactional(readOnly = true, rollbackFor = BudgetExceededException.class)\n    public PurchaseOrderDto approve(',
      ),
    });
    expect(await failing(files)).toEqual([T.approveRollsBack]);
  }, 120_000);

  it('batch: REQUIRES_NEW on a method called through `this` (self-invocation, no proxy)', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [SERVICE]: chain(NO_TEMPLATE, batchCalling('this.approveOne', `${REQUIRES_NEW_ROLLBACK} public`)),
    });
    expect(await failing(files)).toEqual([T.batchOwnTx]);
  }, 120_000);

  it('batch: @Transactional(REQUIRES_NEW) on a private method called directly', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: chain(NO_TEMPLATE, batchCalling('approveOne', `${REQUIRES_NEW_ROLLBACK} private`)),
    });
    expect(await failing(files)).toEqual([T.batchOwnTx]);
  }, 120_000);

  // A private method can't be proxied: self.approveOne(...) runs the proxy instance's own copy (no
  // transaction, null fields).
  it('batch: @Transactional(REQUIRES_NEW) on a private method called through the self proxy', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [SERVICE]: chain(SELF_PROXY, batchCalling('self.approveOne', `${REQUIRES_NEW_ROLLBACK} private`)),
    });
    expect(await failing(files)).toEqual([T.batchOwnTx]);
  }, 120_000);

  // Spring Boot's auto-configured TransactionTemplate is PROPAGATION_REQUIRED. With the batch still
  // @Transactional, every PO joins the batch's transaction (one refusal or failure marks it
  // rollback-only and the whole batch is lost).
  it("batch: Spring Boot's TransactionTemplate (REQUIRED) inside a @Transactional batch", async ({
    expect,
  }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        replace(
          'BudgetService budget, PlatformTransactionManager transactions) {',
          'BudgetService budget, TransactionTemplate transactionTemplate) {',
        ),
        replace(TEMPLATE_INIT, '\n        this.perPo = transactionTemplate;'),
        replace(
          '    @Transactional(propagation = Propagation.NOT_SUPPORTED)\n    public BatchResult approveBatch(',
          '    @Transactional\n    public BatchResult approveBatch(',
        ),
      ),
    });
    expect(await failing(files)).toEqual([T.batchOwnTx]);
  }, 120_000);

  // setRollbackOnly() elsewhere in the service doesn't count: only approve() uses it, and the batch's
  // REQUIRES_NEW method has no rollbackFor, so a refused PO commits.
  it('batch: REQUIRES_NEW without rollbackFor, while approve() uses setRollbackOnly()', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        APPROVE_SET_ROLLBACK_ONLY,
        SELF_PROXY,
        batchCalling('self.approveOne', '@Transactional(propagation = Propagation.REQUIRES_NEW)\n    public'),
      ),
    });
    expect(await failing(files)).toEqual([T.batchRollsBack]);
  }, 120_000);

  it('idempotency: check-then-act, even scoped to the approver', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        replace(
          /(?<=public PurchaseOrderDto approve\([^{]*\{\n)[\s\S]*?(?=\n {4}\}\n)/,
          `        Optional<IdempotencyRecord> previous = idempotency.findByApproverIdAndKey(approverId, idempotencyKey);
        if (previous.isPresent()) {
            if (previous.get().getPurchaseOrderId() != poId) {
                throw new IdempotencyKeyReusedException(idempotencyKey);
            }
            return PurchaseOrderDto.from(find(poId));
        }
        PurchaseOrder po = find(poId);
        po.recordApproval(approverId);
        if (po.getStatus() == PoStatus.APPROVED) {
            budget.reserve(po.getId(), po.getTotal());
        }
        idempotency.save(new IdempotencyRecord(idempotencyKey, approverId, poId));
        return PurchaseOrderDto.from(po);`,
        ),
        replace(
          '    public PurchaseOrderDto approve(long',
          '    public synchronized PurchaseOrderDto approve(long', // in-memory locks: several instances
        ),
        addImports('java.util.Optional'),
      ),
      [RECORD]: RECORD_CONSTRUCTOR,
    });
    expect(await failing(files)).toEqual([T.claimFirst]);
  }, 120_000);

  it('idempotency: the key claimed after the approval was applied', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: replace(
        /(?<=public PurchaseOrderDto approve\([^{]*\{\n)[\s\S]*?(?=\n {4}\}\n)/,
        `        PurchaseOrder po = find(poId);
        po.recordApproval(approverId);
        if (po.getStatus() == PoStatus.APPROVED) {
            budget.reserve(po.getId(), po.getTotal());
        }
        if (idempotency.claim(idempotencyKey, approverId, poId) == 0) {
            IdempotencyRecord previous = idempotency.findByApproverIdAndKey(approverId, idempotencyKey)
                    .orElseThrow();
            if (previous.getPurchaseOrderId() != poId) {
                throw new IdempotencyKeyReusedException(idempotencyKey);
            }
        }
        return PurchaseOrderDto.from(po);`,
      ),
    });
    expect(await failing(files)).toEqual([T.claimFirst]);
  }, 120_000);

  it('idempotency: @Column(unique = true) on the key alone (keys are only unique per user)', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [RECORD]: chain(
        replace(
          /@Table\(name = "idempotency_records",[\s\S]*?\}\)\)\n/,
          '@Table(name = "idempotency_records")\n',
        ),
        replace(
          '@Column(name = "idem_key", nullable = false)',
          '@Column(name = "idem_key", nullable = false, unique = true)',
        ),
      ),
    });
    expect(await failing(files)).toEqual([T.keyUnique]);
  }, 120_000);

  // A unique constraint on idem_key alone plus a (non-unique) index on approver_id: keys are still
  // unique across approvers.
  it('idempotency: unique on the key alone, plus an index on approver_id', async ({ expect }) => {
    const files = edit(solution, {
      [RECORD]: chain(
        replace(
          /uniqueConstraints = @UniqueConstraint\(name = "uk_idempotency_approver_key",\s+columnNames = \{"approver_id", "idem_key"\}\)\)/,
          'uniqueConstraints = @UniqueConstraint(name = "uk_idempotency_key", columnNames = "idem_key"),\n       indexes = @Index(name = "ix_idempotency_approver", columnList = "approver_id"))',
        ),
        addImports('jakarta.persistence.Index'),
      ),
    });
    expect(await failing(files)).toEqual([T.keyUnique]);
  }, 120_000);

  // A repeat approver silently ignored (200, PENDING); the method's other `throw` is the status check
  // (the JUnit test expects IllegalStateException).
  it('approvers: a repeat approval silently ignored', async ({ expect }) => {
    const files = edit(solution, {
      [PO]: replace(
        '        if (!approvedBy.add(approverId)) {\n            throw new IllegalStateException(approverId + " has already approved PO " + number);\n        }\n',
        '        if (approvedBy.contains(approverId)) {\n            return; // already approved by this person\n        }\n        approvedBy.add(approverId);\n',
      ),
    });
    expect(await failing(files)).toEqual([T.noRepeat]);
  }, 120_000);

  it('invoice: BigDecimal.equals on the total', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: replace(
        'if (po.getTotal().compareTo(invoice.amount()) != 0) {',
        'if (!po.getTotal().equals(invoice.amount())) {',
      ),
    });
    expect(await failing(files)).toEqual([T.amounts]);
  }, 120_000);

  it('invoice: BigDecimal.equals on the unit price, written the other way round', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: replace(
        'if (poLine.getUnitPrice().compareTo(line.unitPrice()) != 0) {',
        'if (!line.unitPrice().equals(poLine.getUnitPrice())) {',
      ),
    });
    expect(await failing(files)).toEqual([T.amounts]);
  }, 120_000);

  // Objects.equals(a, b) on BigDecimals is BigDecimal.equals (scale-sensitive), even with compareTo
  // elsewhere in match().
  it('invoice: Objects.equals on the total', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: chain(
        replace(
          'if (po.getTotal().compareTo(invoice.amount()) != 0) {',
          'if (!Objects.equals(po.getTotal(), invoice.amount())) {',
        ),
        addImports('java.util.Objects'),
      ),
    });
    expect(await failing(files)).toEqual([T.amounts]);
  }, 120_000);

  it('invoice: FetchType.EAGER on the lines instead of loading them for the match', async ({ expect }) => {
    const files = edit(solution, {
      [PO]: replace(
        'orphanRemoval = true, fetch = FetchType.LAZY)',
        'orphanRemoval = true, fetch = FetchType.EAGER)',
      ),
      [CONTROLLER]: replace('orders.findWithLinesById(id)', 'orders.findById(id)'),
    });
    expect(await failing(files)).toEqual([T.loadsLines]);
  }, 120_000);

  it('invoice: @Transactional on InvoiceMatcher.match (the PO is already detached)', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: chain(
        replace(
          '    public MatchResult match(PurchaseOrder po, InvoiceRequest invoice) {',
          '    @Transactional(readOnly = true)\n    public MatchResult match(PurchaseOrder po, InvoiceRequest invoice) {',
        ),
        addImports('org.springframework.transaction.annotation.Transactional'),
      ),
      [CONTROLLER]: replace('orders.findWithLinesById(id)', 'orders.findById(id)'),
    });
    expect(await failing(files)).toEqual([T.loadsLines]);
  }, 120_000);

  it('inbox: page index off by one the other way (page + 1)', async ({ expect }) => {
    const files = edit(solution, {
      [CONTROLLER]: replace(
        'PageRequest.of(page - 1, size, NEWEST_FIRST)',
        'PageRequest.of(page + 1, size, NEWEST_FIRST)',
      ),
    });
    expect(await failing(files)).toEqual([T.firstPage]);
  }, 120_000);

  it('inbox: validation off by one (page < 0 lets page 0 through)', async ({ expect }) => {
    const files = edit(solution, {
      [CONTROLLER]: replace(VALIDATION, '        if (page < 0 || size < 1 || size > 100) {'),
    });
    expect(await failing(files)).toEqual([T.pageZero]);
  }, 120_000);

  it('inbox: validation off by one (page <= 1 refuses page 1)', async ({ expect }) => {
    const files = edit(solution, {
      [CONTROLLER]: replace(VALIDATION, '        if (page <= 1 || size < 1 || size > 100) {'),
    });
    expect(await failing(files)).toEqual([T.pageZero]);
  }, 120_000);

  // @Min(1) on the parameter does nothing here: pom.xml has no spring-boot-starter-validation
  // (jakarta.validation isn't even on the classpath, so it doesn't compile), and the JUnit test calls
  // controller.list(0, 10) directly, bypassing MVC validation.
  it('inbox: @Min(1) on the page parameter instead of a check', async ({ expect }) => {
    const files = edit(solution, {
      [CONTROLLER]: chain(
        replace(
          'list(@RequestParam(defaultValue = "1") int page,',
          'list(@RequestParam(defaultValue = "1") @Min(1) int page,',
        ),
        replace(VALIDATION, '        if (size < 1 || size > 100) {'),
        addImports('jakarta.validation.constraints.Min'),
      ),
    });
    expect(await failing(files)).toEqual([T.pageZero]);
  }, 120_000);

  it('inbox: only `distinct` removed from the paged fetch join', async ({ expect }) => {
    const files = edit(solution, {
      [ORDERS]: replace(
        INBOX_QUERIES,
        '    @Query(value = "select p from PurchaseOrder p left join fetch p.lines",\n           countQuery = "select count(p) from PurchaseOrder p")\n    Page<PurchaseOrder> findPageWithLines(Pageable pageable);\n',
      ),
      [SERVICE]: replace(
        LIST_METHOD,
        '    public Page<PurchaseOrderDto> list(Pageable pageable) {\n        return orders.findPageWithLines(pageable).map(PurchaseOrderDto::from);\n    }\n',
      ),
    });
    expect(await failing(files)).toEqual([T.dbPaging]);
  }, 120_000);

  // Fetching every PO with its lines (no Pageable) and paging the list in memory is exactly the bug
  // (40k POs in memory).
  it('inbox: every PO fetched with its lines, then paged in memory (subList)', async ({ expect }) => {
    const files = edit(solution, {
      [ORDERS]: chain(
        replace(
          INBOX_QUERIES,
          '    /** Every PO with its lines; the service pages the list. */\n    @Query("select distinct p from PurchaseOrder p left join fetch p.lines")\n    List<PurchaseOrder> findAllWithLines(Sort sort);\n',
        ),
        addImports('org.springframework.data.domain.Sort'),
      ),
      [SERVICE]: chain(
        replace(
          LIST_METHOD,
          `    public Page<PurchaseOrderDto> list(Pageable pageable) {
        List<PurchaseOrder> all = orders.findAllWithLines(pageable.getSort());
        int from = (int) Math.min(pageable.getOffset(), all.size());
        int to = Math.min(from + pageable.getPageSize(), all.size());
        List<PurchaseOrderDto> page = all.subList(from, to).stream().map(PurchaseOrderDto::from).toList();
        return new PageImpl<>(page, pageable, all.size());
    }
`,
        ),
        addImports('org.springframework.data.domain.PageImpl'),
      ),
    });
    expect(await failing(files)).toEqual([T.dbPaging]);
  }, 120_000);

  it('every fix written only in comments (the starter otherwise)', async ({ expect }) => {
    const files = edit(starter, {
      [SERVICE]: chain(
        replace(
          '\n    public PurchaseOrderDto reject(',
          '\n    // @Transactional (readOnly means FlushMode.MANUAL)\n    public PurchaseOrderDto reject(',
        ),
        replace(
          '    @Transactional\n    public PurchaseOrderDto approve(',
          '    /** @Transactional(rollbackFor = BudgetExceededException.class) */\n    @Transactional /* (rollbackFor = BudgetExceededException.class) */\n    public PurchaseOrderDto approve(',
        ),
        replace(
          '        Optional<IdempotencyRecord> previous = idempotency.findByKey(idempotencyKey);',
          '        // idempotency.claim(idempotencyKey, approverId, poId) before po.recordApproval(approverId);\n        // findByApproverIdAndKey(...); if (previous.getPurchaseOrderId() != poId) throw new IllegalStateException();\n        Optional<IdempotencyRecord> previous = idempotency.findByKey(idempotencyKey);',
        ),
        replace(
          '                approveOne(id);',
          '                approveOne(id); // self.approveOne(id) through the proxy; status.setRollbackOnly();\n                /* } catch (RuntimeException e) { */',
        ),
      ),
      [CONTROLLER]: chain(
        replace(
          '        return approvals.list(PageRequest.of(page, size));',
          '        // if (page < 1) throw new IllegalArgumentException();\n        // PageRequest.of(page - 1, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")))\n        return approvals.list(PageRequest.of(page, size));',
        ),
        replace('orders.findById(id)', 'orders/* .findWithLinesById(id) */.findById(id)'),
        replace('public Page<PurchaseOrderDto> list(', 'public Page<PurchaseOrderDto> list(/* @Min(1) */'),
      ),
      [MATCHER]: replace(
        'if (!po.getTotal().equals(invoice.amount())) {',
        'if (!po.getTotal().equals(invoice.amount())) { // compareTo(...) != 0; invoiced.merge(sku, qty, Integer::sum)',
      ),
      [ORDERS]: appendMembers(
        '    // @EntityGraph(attributePaths = "lines") Optional<PurchaseOrder> findWithLinesById(long id);\n',
      ),
      [PO]: chain(
        replace(
          '    public void recordApproval() {',
          '    // @ElementCollection private Set<String> approvedBy; @Version private long version;\n    public void recordApproval(/* String approverId */) {\n        /* if (!approvedBy.add(approverId)) throw new IllegalStateException(); */',
        ),
      ),
      [RECORD]: replace(
        '@Table(name = "idempotency_records")',
        '@Table(name = "idempotency_records" /* , uniqueConstraints = @UniqueConstraint(columnNames = {"approver_id", "idem_key"}) */)',
      ),
      [HANDLER]: replace(
        '@ExceptionHandler(IllegalStateException.class)',
        '@ExceptionHandler({IllegalStateException.class /* , OptimisticLockingFailureException.class */})',
      ),
    });
    expect(await statuses(files)).toEqual(expectedStatuses([]));
  }, 120_000);
});

// ── 4. Robustness: unusual or broken Java ───────────────────────────────────
type IsolatedOutcome =
  SandboxOutcome | { type: 'hung' } | { type: 'host-crash'; code: number | null; stderr: string };

const SANDBOX_TIMEOUT_MS = 20_000;
const QUESTION_CHECK = pathToFileURL(join(import.meta.dirname, '..', 'lib', 'questionCheck.ts')).href;
// No backslashes in this script: Windows command-line quoting would mangle them.
const DRIVER = [
  `import { runSandboxTests } from ${JSON.stringify(QUESTION_CHECK)};`,
  "let input = '';",
  'for await (const chunk of process.stdin) input += chunk;',
  'const { files, timeoutMs } = JSON.parse(input);',
  'const outcome = await runSandboxTests(files, timeoutMs);',
  "process.stdout.write('@@OUTCOME@@' + JSON.stringify(outcome), () => process.exit(0));",
].join('\n');

/**
 * runSandboxTests in a child process. The Java files are parsed on the calling thread (before the
 * sandbox worker and its timeout), so a parse that never ends would hang the caller: the child is
 * killed after `hardLimitMs` ("hung").
 */
function runIsolated(files: SourceFile[], hardLimitMs = 90_000): Promise<IsolatedOutcome> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '--no-warnings', '--eval', DRIVER], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let hung = false;
    const timer = setTimeout(() => {
      hung = true;
      child.kill();
    }, hardLimitMs);
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    child.on('close', (code) => {
      clearTimeout(timer);
      const at = stdout.indexOf('@@OUTCOME@@');
      if (at >= 0) resolve(JSON.parse(stdout.slice(at + '@@OUTCOME@@'.length)) as SandboxOutcome);
      else resolve(hung ? { type: 'hung' } : { type: 'host-crash', code, stderr: stderr.slice(0, 2000) });
    });
    child.stdin.end(JSON.stringify({ files, timeoutMs: SANDBOX_TIMEOUT_MS }));
  });
}
const notPassing = (o: IsolatedOutcome) =>
  o.type === 'done'
    ? o.results.filter((r) => r.status !== 'passed').map((r) => `${r.name}: ${r.error}`)
    : [o];
const lineOf = (content: string, needle: string) =>
  content.slice(0, content.indexOf(needle)).split('\n').length;

describe.concurrent('spring-po-approvals: unusual or broken Java gives a clear outcome, never a hang', () => {
  it('a syntax error is reported with its file and line', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: replace(
        '        BatchResult result = new BatchResult();\n',
        '        BatchResult result = new BatchResult();\n        int broken = ;\n',
      ),
    });
    const o = await runIsolated(files);
    expect(o).toEqual({
      type: 'compile',
      errors: [
        {
          path: PKG + SERVICE,
          line: lineOf(javaFile(files, SERVICE), 'int broken = ;'),
          message: expect.stringMatching(/^Syntax error/),
        },
      ],
    });
  }, 120_000);

  it('an unterminated block comment is reported with its line', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: replace(
        '    public MatchResult match(',
        '    /* unfinished thought\n    public MatchResult match(',
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('compile');
    if (o.type !== 'compile') return;
    expect(o.errors).toEqual([
      {
        path: PKG + MATCHER,
        line: lineOf(javaFile(files, MATCHER), '/* unfinished'),
        message: expect.any(String),
      },
    ]);
  }, 120_000);

  it('an empty ApprovalService.java: every check fails, saying what is missing', async ({ expect }) => {
    const o = await runIsolated(edit(solution, { [SERVICE]: whole('') }));
    expect(o.type).toBe('done');
    if (o.type !== 'done') return;
    expect(o.results.length).toBeGreaterThan(0);
    for (const r of o.results) {
      expect(r.status).toBe('failed');
      expect(r.error).toContain("Can't find ApprovalService");
    }
  }, 120_000);

  it('a file with only comments: every check fails, saying what is missing', async ({ expect }) => {
    const o = await runIsolated(
      edit(solution, { [KEYS]: whole('// TODO\n/* IdempotencyRecordRepository was here */\n') }),
    );
    expect(o.type).toBe('done');
    if (o.type !== 'done') return;
    for (const r of o.results) expect(r.error).toContain("Can't find IdempotencyRecordRepository");
  }, 120_000);

  it('extra top-level classes (before and after, with look-alike method names) change nothing', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        replace(
          '@Service\n@Transactional(readOnly = true)\npublic class ApprovalService {',
          '/** A decoy with the same method names. */\nfinal class ApprovalDecoy {\n    public void approve() {\n    }\n\n    public void reject() {\n    }\n\n    public void approveBatch() {\n    }\n}\n\n@Service\n@Transactional(readOnly = true)\npublic class ApprovalService {',
        ),
        (src) =>
          `${src}\nfinal class BatchMessages {\n    static String refused(long id) {\n        return "PO " + id + " refused";\n    }\n}\n`,
      ),
    });
    expect(notPassing(await runIsolated(files))).toEqual([]);
  }, 120_000);

  it('the per-PO bean as an extra top-level class in ApprovalService.java', async ({ expect }) => {
    const files = edit(solution, {
      [SERVICE]: chain(
        replace(TEMPLATE_FIELD, '    private final PerPoApprover perPo;\n'),
        replace(
          'BudgetService budget, PlatformTransactionManager transactions) {',
          'BudgetService budget, PerPoApprover perPo) {',
        ),
        replace(TEMPLATE_INIT, '\n        this.perPo = perPo;'),
        replace(
          BATCH_METHODS,
          `    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public BatchResult approveBatch(List<Long> ids, String approverId) {
        BatchResult result = new BatchResult();
        for (Long id : ids) {
            try {
                perPo.approve(id, approverId);
                result.approved(id);
            } catch (BudgetExceededException | RuntimeException e) {
                result.failed(id, e.getMessage());
            }
        }
        return result;
    }
`,
        ),
        (src) => `${src}
/** One PO of a batch in its own transaction (a separate bean, so through its proxy). */
@Service
class PerPoApprover {

    private final PurchaseOrderRepository orders;
    private final BudgetService budget;

    PerPoApprover(PurchaseOrderRepository orders, BudgetService budget) {
        this.orders = orders;
        this.budget = budget;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = BudgetExceededException.class)
    public void approve(long id, String approverId) throws BudgetExceededException {
        PurchaseOrder po = orders.findById(id).orElseThrow(() -> new PoNotFoundException(id));
        po.recordApproval(approverId);
        if (po.getStatus() == PoStatus.APPROVED) {
            budget.reserve(id, po.getTotal());
        }
    }
}
`,
      ),
    });
    expect(notPassing(await runIsolated(files))).toEqual([]);
  }, 120_000);

  it('Unicode identifiers (Latin, CJK, a currency sign, a supplementary-plane letter)', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [MATCHER]: chain(
        rename('invoiced', '已开票'),
        rename('ordered', 'größe'),
        rename('problems', '₹problems'),
        rename('quantity', '\u{1D45E}ty'),
      ),
    });
    expect(notPassing(await runIsolated(files))).toEqual([]);
  }, 120_000);

  // Java allows spacing combining marks (Unicode category Mc: Devanagari, Tamil, Bengali... vowel
  // signs) and non-ASCII digits in identifiers; java-parser's lexer doesn't (see forJavaParser).
  it('a Devanagari identifier (vowel signs, a Devanagari digit)', async ({ expect }) => {
    const files = edit(solution, { [MATCHER]: rename('ordered', 'मात्रा१') });
    expect(notPassing(await runIsolated(files))).toEqual([]);
  }, 120_000);

  it('a very large file (about 1 MB: 6,000 methods and a long comment) is checked in time', async ({
    expect,
  }) => {
    const helpers = Array.from(
      { length: 6000 },
      (_, i) =>
        `    /** Helper ${i}. */\n    private static int helper${i}(int a) {\n        return a * ${i} + 1;\n    }\n`,
    ).join('\n');
    const files = edit(solution, {
      [SERVICE]: chain(
        replace(
          'public class ApprovalService {\n',
          `public class ApprovalService {\n\n    /*\n${'     * filler\n'.repeat(30_000)}     */\n`,
        ),
        appendMembers(helpers),
      ),
    });
    expect(javaFile(files, SERVICE).length).toBeGreaterThan(900_000);
    const started = Date.now();
    expect(notPassing(await runIsolated(files))).toEqual([]);
    expect(Date.now() - started).toBeLessThan(60_000);
  }, 120_000);

  it('a 2 MB string literal', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: replace(
        'public class InvoiceMatcher {\n',
        `public class InvoiceMatcher {\n\n    private static final String BIG = "${'x'.repeat(2_000_000)}";\n`,
      ),
    });
    expect(notPassing(await runIsolated(files))).toEqual([]);
  }, 120_000);

  // Valid Java that java-parser parses by recursing per level: depending on the stack it gets (the
  // parse runs in a worker), it parses or gives a syntax error. Never a crash.
  it('1,000 nested parentheses parse, or give a compile error, but never crash', async ({ expect }) => {
    const files = edit(solution, {
      [MATCHER]: replace(
        'public class InvoiceMatcher {\n',
        `public class InvoiceMatcher {\n\n    private static final int DEEP = ${'('.repeat(1000)}1${')'.repeat(1000)};\n`,
      ),
    });
    const o = await runIsolated(files);
    expect(['done', 'compile']).toContain(o.type);
    if (o.type === 'done') expect(notPassing(o)).toEqual([]);
  }, 120_000);

  // java-parser backtracks exponentially on nested parenthesized casts (about x2.2 per level: 10
  // levels take seconds, 16 many minutes). Java files are parsed in a worker that is stopped after
  // JAVA_PARSE_LIMIT_MS (as in the browser, where the page would otherwise freeze): a clear error.
  it('nested parenthesized casts (valid Java) are stopped with a clear error, not a hang', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [MATCHER]: replace(
        'public class InvoiceMatcher {\n',
        `public class InvoiceMatcher {\n\n    private static final long CAST = ${'(long) ('.repeat(16)}1${')'.repeat(16)};\n`,
      ),
    });
    const started = Date.now();
    const o = await runIsolated(files);
    const { line, message } = JAVA_TOO_SLOW;
    expect(o).toEqual({ type: 'compile', errors: [{ path: PKG + MATCHER, line, message }] });
    // The limit, plus starting a process and the other files on a busy machine; a hang is minutes.
    expect(Date.now() - started).toBeLessThan(JAVA_PARSE_LIMIT_MS + 50_000);
  }, 120_000);
});
