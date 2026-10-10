package com.zycus.procurement.po;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Remembers the response to a POST carrying an Idempotency-Key header, so a retry (the mobile app
 * retries on timeouts) returns the same result instead of approving twice.
 */
@Entity
@Table(name = "idempotency_records")
public class IdempotencyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idem_key", nullable = false)
    private String key;

    @Column(nullable = false)
    private String approverId;

    @Column(nullable = false)
    private long purchaseOrderId;

    @Column(nullable = false)
    private String responseStatus;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected IdempotencyRecord() {
    }

    public IdempotencyRecord(String key, String approverId, long purchaseOrderId, String responseStatus) {
        this.key = key;
        this.approverId = approverId;
        this.purchaseOrderId = purchaseOrderId;
        this.responseStatus = responseStatus;
    }

    public String getKey() {
        return key;
    }

    public String getApproverId() {
        return approverId;
    }

    public long getPurchaseOrderId() {
        return purchaseOrderId;
    }

    public String getResponseStatus() {
        return responseStatus;
    }
}
