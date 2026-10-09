package com.zycus.orders.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

// Read-only.
public record CreateOrderRequest(
        @NotBlank @Email String customerEmail,
        @NotBlank String sku,
        @Positive int quantity) {
}
