package com.zycus.procurement.po;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** API payloads. */
public final class Dtos {

    private Dtos() {
    }

    public record PurchaseOrderDto(long id, String number, PoStatus status, BigDecimal total,
                                   int approvalsReceived, int approvalsRequired, int lineCount) {

        public static PurchaseOrderDto from(PurchaseOrder po) {
            return new PurchaseOrderDto(po.getId(), po.getNumber(), po.getStatus(), po.getTotal(),
                    po.getApprovalsReceived(), po.getApprovalsRequired(), po.getLines().size());
        }
    }

    public record InvoiceLine(String sku, int quantity, BigDecimal unitPrice) {
    }

    public record InvoiceRequest(String invoiceNumber, BigDecimal amount, List<InvoiceLine> lines) {
    }

    public record MatchResult(boolean matched, List<String> problems) {

        public static MatchResult of(List<String> problems) {
            return new MatchResult(problems.isEmpty(), List.copyOf(problems));
        }
    }

    public record RejectRequest(String reason) {
    }

    public record BatchRequest(List<Long> ids) {
    }

    /** Result of a batch approval: which POs were approved and which failed (and why). */
    public static final class BatchResult {

        private final List<Long> approved = new ArrayList<>();
        private final List<String> failures = new ArrayList<>();

        public void approved(long id) {
            approved.add(id);
        }

        public void failed(long id, String reason) {
            failures.add(id + ": " + reason);
        }

        public List<Long> getApproved() {
            return approved;
        }

        public List<String> getFailures() {
            return failures;
        }
    }
}
