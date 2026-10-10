package com.zycus.procurement.po;

import com.zycus.procurement.po.Dtos.BatchResult;
import com.zycus.procurement.po.Dtos.PurchaseOrderDto;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@Transactional(readOnly = true)
public class ApprovalService {

    /** The Idempotency-Key was already used by this approver for a different PO (HTTP 422). */
    public static class IdempotencyKeyReusedException extends RuntimeException {

        public IdempotencyKeyReusedException(String key) {
            super("Idempotency-Key " + key + " was already used for a different purchase order");
        }
    }

    private final PurchaseOrderRepository orders;
    private final IdempotencyRecordRepository idempotency;
    private final BudgetService budget;
    /** One transaction per PO in a batch (REQUIRES_NEW). */
    private final TransactionTemplate perPo;

    public ApprovalService(PurchaseOrderRepository orders, IdempotencyRecordRepository idempotency,
                           BudgetService budget, PlatformTransactionManager transactions) {
        this.orders = orders;
        this.idempotency = idempotency;
        this.budget = budget;
        this.perPo = new TransactionTemplate(transactions);
        this.perPo.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * The database pages the ids (sorted by the Pageable); the lines for that page are then loaded
     * in one query. Paging a collection fetch join made Hibernate load every PO and page in memory.
     */
    public Page<PurchaseOrderDto> list(Pageable pageable) {
        Page<Long> ids = orders.findPageIds(pageable);
        List<PurchaseOrder> found = ids.isEmpty() ? List.of() : orders.findAllWithLines(ids.getContent());
        Map<Long, PurchaseOrder> byId = found.stream()
                .collect(Collectors.toMap(PurchaseOrder::getId, Function.identity()));
        return ids.map(id -> PurchaseOrderDto.from(byId.get(id)));
    }

    /**
     * Approves a PO. The mobile app sends an Idempotency-Key and retries on timeouts, so the same
     * request may arrive more than once (and sometimes at the same time).
     *
     * <p>The key is claimed with an atomic insert (unique per approver) before anything else, so
     * concurrent duplicates wait for the first request and then replay its result. A checked
     * {@link BudgetExceededException} doesn't roll back by default: rollbackFor makes a refused
     * approval (and its key claim) disappear, so a retry after a budget top-up works.
     */
    @Transactional(rollbackFor = BudgetExceededException.class)
    public PurchaseOrderDto approve(long poId, String approverId, String idempotencyKey)
            throws BudgetExceededException {
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
            budget.reserve(po.getId(), po.getTotal());
        }
        return PurchaseOrderDto.from(po);
    }

    /** Was read-only (inherited from the class), so Hibernate never flushed the rejection. */
    @Transactional
    public PurchaseOrderDto reject(long poId, String approverId, String reason) {
        PurchaseOrder po = find(poId);
        po.reject(reason);
        return PurchaseOrderDto.from(po);
    }

    /**
     * Approves several POs; one PO failing (e.g. out of budget) must not affect the others.
     *
     * <p>Calling a {@code @Transactional(REQUIRES_NEW)} method on {@code this} bypasses the proxy, so
     * every PO used to run in the batch's transaction: a refused PO's approval was committed with the
     * others, and any runtime failure rolled the whole batch back. Each PO now gets its own
     * transaction, and the batch itself runs outside one.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public BatchResult approveBatch(List<Long> ids, String approverId) {
        BatchResult result = new BatchResult();
        for (Long id : ids) {
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
        return result;
    }

    /** Runs in the PO's own transaction. Returns why the budget refused it (after rolling back), or null. */
    private String approveOne(long id, String approverId, TransactionStatus status) {
        PurchaseOrder po = find(id);
        po.recordApproval(approverId);
        if (po.getStatus() == PoStatus.APPROVED) {
            try {
                budget.reserve(id, po.getTotal());
            } catch (BudgetExceededException e) {
                status.setRollbackOnly();
                return e.getMessage();
            }
        }
        return null;
    }

    private PurchaseOrder find(long id) {
        return orders.findById(id).orElseThrow(() -> new PoNotFoundException(id));
    }
}
