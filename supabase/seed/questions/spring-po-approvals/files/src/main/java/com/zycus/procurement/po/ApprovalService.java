package com.zycus.procurement.po;

import com.zycus.procurement.po.Dtos.BatchResult;
import com.zycus.procurement.po.Dtos.PurchaseOrderDto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ApprovalService {

    private final PurchaseOrderRepository orders;
    private final IdempotencyRecordRepository idempotency;
    private final BudgetService budget;

    public ApprovalService(PurchaseOrderRepository orders, IdempotencyRecordRepository idempotency,
                           BudgetService budget) {
        this.orders = orders;
        this.idempotency = idempotency;
        this.budget = budget;
    }

    public Page<PurchaseOrderDto> list(Pageable pageable) {
        return orders.findPageWithLines(pageable).map(PurchaseOrderDto::from);
    }

    /**
     * Approves a PO. The mobile app sends an Idempotency-Key and retries on timeouts, so the same
     * request may arrive more than once (and sometimes at the same time).
     */
    @Transactional
    public PurchaseOrderDto approve(long poId, String approverId, String idempotencyKey)
            throws BudgetExceededException {
        Optional<IdempotencyRecord> previous = idempotency.findByKey(idempotencyKey);
        if (previous.isPresent()) {
            return PurchaseOrderDto.from(find(previous.get().getPurchaseOrderId()));
        }
        PurchaseOrder po = find(poId);
        po.recordApproval();
        if (po.getStatus() == PoStatus.APPROVED) {
            budget.reserve(po.getId(), po.getTotal());
        }
        idempotency.save(new IdempotencyRecord(idempotencyKey, approverId, poId, po.getStatus().name()));
        return PurchaseOrderDto.from(po);
    }

    public PurchaseOrderDto reject(long poId, String approverId, String reason) {
        PurchaseOrder po = find(poId);
        po.reject(reason);
        return PurchaseOrderDto.from(po);
    }

    /** Approves several POs; one PO failing (e.g. out of budget) must not affect the others. */
    @Transactional
    public BatchResult approveBatch(List<Long> ids, String approverId) {
        BatchResult result = new BatchResult();
        for (Long id : ids) {
            try {
                approveOne(id);
                result.approved(id);
            } catch (BudgetExceededException e) {
                result.failed(id, e.getMessage());
            }
        }
        return result;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void approveOne(long id) throws BudgetExceededException {
        PurchaseOrder po = find(id);
        po.recordApproval();
        if (po.getStatus() == PoStatus.APPROVED) {
            budget.reserve(id, po.getTotal());
        }
    }

    private PurchaseOrder find(long id) {
        return orders.findById(id).orElseThrow(() -> new PoNotFoundException(id));
    }
}
