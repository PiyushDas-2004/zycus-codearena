package com.zycus.procurement.po;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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

    public void recordApproval() {
        if (status != PoStatus.PENDING) {
            throw new IllegalStateException("PO " + number + " is " + status);
        }
        approvalsReceived++;
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
