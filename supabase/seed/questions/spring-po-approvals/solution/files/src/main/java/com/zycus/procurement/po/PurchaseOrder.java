package com.zycus.procurement.po;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String number;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PoStatus status = PoStatus.PENDING;

    /** Total in INR, scale 2. */
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total;

    /** POs above ₹10,00,000 need two distinct approvers. */
    @Column(nullable = false)
    private int approvalsRequired;

    @Column(nullable = false)
    private int approvalsReceived;

    /**
     * Who approved. A counter alone let one person give both approvals of a high-value PO.
     * Migration: create table purchase_order_approvals (purchase_order_id, approver_id, primary key both).
     */
    @ElementCollection
    @CollectionTable(name = "purchase_order_approvals", joinColumns = @JoinColumn(name = "purchase_order_id"))
    @Column(name = "approver_id", nullable = false)
    private Set<String> approvedBy = new HashSet<>();

    /**
     * Optimistic locking: without it two approvers deciding at the same moment both read the same
     * state and the last write wins (an approval lost, or approved twice and budget reserved twice).
     * The loser gets an OptimisticLockingFailureException, mapped to 409. Migration: add column
     * version bigint not null default 0.
     */
    @Version
    private long version;

    private String rejectionReason;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PurchaseOrderLine> lines = new ArrayList<>();

    protected PurchaseOrder() {
    }

    public PurchaseOrder(String number, BigDecimal total) {
        this.number = number;
        this.total = total;
        this.approvalsRequired = total.compareTo(new BigDecimal("1000000.00")) > 0 ? 2 : 1;
    }

    public void recordApproval(String approverId) {
        if (status != PoStatus.PENDING) {
            throw new IllegalStateException("PO " + number + " is " + status);
        }
        if (!approvedBy.add(approverId)) {
            throw new IllegalStateException(approverId + " has already approved PO " + number);
        }
        approvalsReceived = approvedBy.size();
        if (approvalsReceived >= approvalsRequired) {
            status = PoStatus.APPROVED;
        }
    }

    public void reject(String reason) {
        if (status != PoStatus.PENDING) {
            throw new IllegalStateException("PO " + number + " is " + status);
        }
        status = PoStatus.REJECTED;
        rejectionReason = reason;
    }

    public void addLine(PurchaseOrderLine line) {
        lines.add(line);
        line.setPurchaseOrder(this);
    }

    public Long getId() {
        return id;
    }

    public String getNumber() {
        return number;
    }

    public PoStatus getStatus() {
        return status;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public int getApprovalsRequired() {
        return approvalsRequired;
    }

    public int getApprovalsReceived() {
        return approvalsReceived;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<PurchaseOrderLine> getLines() {
        return lines;
    }
}
