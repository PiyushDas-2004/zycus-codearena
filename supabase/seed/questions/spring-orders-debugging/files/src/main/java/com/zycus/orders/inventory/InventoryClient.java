package com.zycus.orders.inventory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

// Read-only: works as documented.
@Component
public class InventoryClient {

    public static class InsufficientStockException extends RuntimeException {
        public InsufficientStockException(String sku, int quantity) {
            super("Insufficient stock for " + sku + " (requested " + quantity + ")");
        }
    }

    private final RestClient restClient;

    public InventoryClient(RestClient.Builder builder, @Value("${inventory.base-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    /** Reserves stock or throws {@link InsufficientStockException} when the inventory service returns 409. */
    public void reserve(String sku, int quantity) {
        try {
            restClient.post()
                    .uri("/api/reservations")
                    .body(new ReservationRequest(sku, quantity))
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.Conflict e) {
            throw new InsufficientStockException(sku, quantity);
        }
    }

    record ReservationRequest(String sku, int quantity) {}
}
