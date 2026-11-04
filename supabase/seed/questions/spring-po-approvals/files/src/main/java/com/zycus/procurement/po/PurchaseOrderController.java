package com.zycus.procurement.po;

import com.zycus.procurement.po.Dtos.BatchRequest;
import com.zycus.procurement.po.Dtos.BatchResult;
import com.zycus.procurement.po.Dtos.InvoiceRequest;
import com.zycus.procurement.po.Dtos.MatchResult;
import com.zycus.procurement.po.Dtos.PurchaseOrderDto;
import com.zycus.procurement.po.Dtos.RejectRequest;
import java.security.Principal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pos")
public class PurchaseOrderController {

    private final ApprovalService approvals;
    private final PurchaseOrderRepository orders;
    private final InvoiceMatcher matcher;

    public PurchaseOrderController(ApprovalService approvals, PurchaseOrderRepository orders, InvoiceMatcher matcher) {
        this.approvals = approvals;
        this.orders = orders;
        this.matcher = matcher;
    }

    /** The inbox, newest first. Pages are numbered from 1 (the mobile app's contract). */
    @GetMapping
    public Page<PurchaseOrderDto> list(@RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return approvals.list(PageRequest.of(page, size));
    }

    @PostMapping("/{id}/approve")
    public PurchaseOrderDto approve(@PathVariable long id, @RequestHeader("Idempotency-Key") String key,
                                    Principal user) throws BudgetExceededException {
        return approvals.approve(id, user.getName(), key);
    }

    @PostMapping("/{id}/reject")
    public PurchaseOrderDto reject(@PathVariable long id, @RequestBody RejectRequest body, Principal user) {
        return approvals.reject(id, user.getName(), body.reason());
    }

    @PostMapping("/approve-batch")
    public BatchResult approveBatch(@RequestBody BatchRequest body, Principal user) {
        return approvals.approveBatch(body.ids(), user.getName());
    }

    @PostMapping("/{id}/match-invoice")
    public MatchResult matchInvoice(@PathVariable long id, @RequestBody InvoiceRequest invoice) {
        PurchaseOrder po = orders.findById(id).orElseThrow(() -> new PoNotFoundException(id));
        return matcher.match(po, invoice);
    }
}
