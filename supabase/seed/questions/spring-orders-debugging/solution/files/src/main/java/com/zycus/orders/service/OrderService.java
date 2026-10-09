package com.zycus.orders.service;

import com.zycus.orders.domain.PurchaseOrder;
import com.zycus.orders.inventory.InventoryClient;
import com.zycus.orders.repository.OrderRepository;
import com.zycus.orders.web.ApiExceptionHandler.OrderNotFoundException;
import com.zycus.orders.web.dto.CreateOrderRequest;
import com.zycus.orders.web.dto.OrderResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;

    public OrderService(OrderRepository orderRepository, InventoryClient inventoryClient) {
        this.orderRepository = orderRepository;
        this.inventoryClient = inventoryClient;
    }

    /**
     * Runs in one transaction through the Spring proxy (public method, called from the controller):
     * a failed reservation rolls the order back, and markReserved() is flushed on commit.
     */
    @Transactional
    public OrderResponse placeOrder(CreateOrderRequest request) {
        PurchaseOrder order = orderRepository.save(
                new PurchaseOrder(request.customerEmail(), request.sku(), request.quantity()));
        // Throws InsufficientStockException (mapped to 409) when stock is not available.
        inventoryClient.reserve(request.sku(), request.quantity());
        order.markReserved();
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long id) {
        return orderRepository.findById(id)
                .map(OrderResponse::from)
                .orElseThrow(() -> new OrderNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> ordersForCustomer(String customerEmail) {
        return orderRepository.findByCustomerEmailOrderByCreatedAtDesc(customerEmail).stream()
                .map(OrderResponse::from)
                .toList();
    }
}
