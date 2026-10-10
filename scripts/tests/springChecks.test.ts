/**
 * The Spring question's structure checks must accept every reasonable fix, not just the reference
 * solution's. Each variant rewrites part of the reference solution the other common way and must
 * still pass all checks.
 */
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadQuestion, QUESTIONS_DIR } from '../lib/questionSource.ts';
import { runSandboxTests, withSolution, type SourceFile } from '../lib/questionCheck.ts';

const q = loadQuestion(join(QUESTIONS_DIR, 'spring-po-approvals'));
const PKG = 'src/main/java/com/zycus/procurement/po/';
const solution = withSolution(
  q.files.map((f) => ({ path: f.path, content: f.content })),
  q.reference_solution?.files ?? [],
);

function variant(edits: Record<string, (src: string) => string>): SourceFile[] {
  return solution.map((f) => {
    const edit = edits[f.path.replace(PKG, '')];
    if (!edit) return f;
    const content = edit(f.content);
    if (content === f.content) throw new Error(`variant edit changed nothing in ${f.path}`);
    return { path: f.path, content };
  });
}

const replace = (from: string | RegExp, to: string) => (src: string) => src.replace(from, to);
const chain =
  (...fns: ((s: string) => string)[]) =>
  (src: string) =>
    fns.reduce((s, fn) => fn(s), src);

async function failures(files: SourceFile[]) {
  const o = await runSandboxTests(files);
  if (o.type !== 'done') return [`${o.type}: ${JSON.stringify(o)}`];
  return o.results.filter((r) => r.status !== 'passed').map((r) => `${r.name}: ${r.error}`);
}

describe('Spring structure checks accept other valid fixes', () => {
  it('batch through the proxy (self-injection + REQUIRES_NEW with rollbackFor)', async () => {
    const files = variant({
      'ApprovalService.java': chain(
        replace(
          '    /** One transaction per PO in a batch (REQUIRES_NEW). */\n    private final TransactionTemplate perPo;',
          '    /** This service through its Spring proxy, so REQUIRES_NEW applies. */\n    @org.springframework.beans.factory.annotation.Autowired\n    @org.springframework.context.annotation.Lazy\n    private ApprovalService self;',
        ),
        replace(
          /\s*this\.perPo = new TransactionTemplate\(transactions\);\n\s*this\.perPo\.setPropagationBehavior\(TransactionDefinition\.PROPAGATION_REQUIRES_NEW\);/,
          '',
        ),
        replace(
          /String refusal = perPo\.execute\(\(?status\)? -> approveOne\(id, approverId, status\)\);\s*if \(refusal == null\) \{\s*result\.approved\(id\);\s*\} else \{\s*result\.failed\(id, refusal\);\s*\}/,
          'self.approveOne(id, approverId);\n                result.approved(id);',
        ),
        replace(
          /\} catch \(PoNotFoundException \| IllegalStateException \| OptimisticLockingFailureException e\) \{/,
          '} catch (BudgetExceededException | RuntimeException e) {',
        ),
        replace(
          /private String approveOne\(long id, String approverId, TransactionStatus status\) \{[\s\S]*?\n {4}\}\n/,
          [
            '@Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = BudgetExceededException.class)',
            '    public void approveOne(long id, String approverId) throws BudgetExceededException {',
            '        PurchaseOrder po = find(id);',
            '        po.recordApproval(approverId);',
            '        if (po.getStatus() == PoStatus.APPROVED) {',
            '            budget.reserve(id, po.getTotal());',
            '        }',
            '    }',
            '',
          ].join('\n'),
        ),
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('a pessimistic lock instead of @Version', async () => {
    const files = variant({
      'PurchaseOrder.java': replace(
        /@Version\s*\n\s*private long version;/,
        'private long unusedVersionCounter;',
      ),
      'PurchaseOrderRepository.java': replace(
        '    /** For callers outside a transaction',
        [
          '    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)',
          '    @Query("select p from PurchaseOrder p where p.id = :id")',
          '    Optional<PurchaseOrder> findForUpdate(@Param("id") long id);',
          '',
          '    /** For callers outside a transaction',
        ].join('\n'),
      ),
      'ApprovalService.java': replace(
        'return orders.findById(id).orElseThrow(() -> new PoNotFoundException(id));',
        'return orders.findForUpdate(id).orElseThrow(() -> new PoNotFoundException(id));',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('idempotency by inserting first and catching the unique-key violation', async () => {
    const files = variant({
      'ApprovalService.java': chain(
        replace(
          /if \(idempotency\.claim\(idempotencyKey, approverId, poId\) == 0\) \{/,
          [
            'try {',
            '            idempotency.saveAndFlush(new IdempotencyRecord(idempotencyKey, approverId, poId));',
            '        } catch (org.springframework.dao.DataIntegrityViolationException duplicate) {',
            '            // Replayed in a new transaction by the controller in the real fix; kept short here.',
            '        }',
            '        if (false) {',
          ].join('\n'),
        ),
      ),
      'IdempotencyRecord.java': replace(
        '    protected IdempotencyRecord() {\n    }',
        '    protected IdempotencyRecord() {\n    }\n\n    public IdempotencyRecord(String key, String approverId, long purchaseOrderId) {\n        this.key = key;\n        this.approverId = approverId;\n        this.purchaseOrderId = purchaseOrderId;\n    }',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);

  it('quantities added up with a stream collector', async () => {
    const files = variant({
      'InvoiceMatcher.java': replace(
        'invoiced.merge(line.sku(), line.quantity(), Integer::sum);',
        'invoiced.put(line.sku(), invoice.lines().stream().filter(l -> l.sku().equals(line.sku())).collect(Collectors.summingInt(InvoiceLine::quantity)));',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);
});
