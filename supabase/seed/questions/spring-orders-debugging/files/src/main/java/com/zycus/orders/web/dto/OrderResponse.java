package com.zycus.orders.web.dto;

import com.zycus.orders.domain.PurchaseOrder;
import java.time.Instant;

// Read-only.
public record OrderResponse(Long id, String customerEmail, String sku, int quantity, String status, Instant createdAt) {

    public static OrderResponse from(PurchaseOrder order) {
        return new OrderResponse(
                order.getId(),
                order.getCustomerEmail(),
                order.getSku(),
                order.getQuantity(),
                order.getStatus().name(),
                order.getCreatedAt());
    }
}
