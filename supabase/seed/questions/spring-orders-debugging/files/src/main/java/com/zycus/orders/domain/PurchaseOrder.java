package com.zycus.orders.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

// Read-only.
@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {

    public enum Status { NEW, RESERVED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerEmail;

    @Column(nullable = false)
    private String sku;

    @Column(nullable = false)
    private int quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.NEW;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected PurchaseOrder() {
        // for JPA
    }

    public PurchaseOrder(String customerEmail, String sku, int quantity) {
        this.customerEmail = customerEmail;
        this.sku = sku;
        this.quantity = quantity;
    }

    public void markReserved() {
        this.status = Status.RESERVED;
    }

    public Long getId() { return id; }
    public String getCustomerEmail() { return customerEmail; }
    public String getSku() { return sku; }
    public int getQuantity() { return quantity; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
