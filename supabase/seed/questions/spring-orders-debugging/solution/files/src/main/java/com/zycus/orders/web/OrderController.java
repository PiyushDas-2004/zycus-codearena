package com.zycus.orders.web;

import com.zycus.orders.service.OrderService;
import com.zycus.orders.web.dto.CreateOrderRequest;
import com.zycus.orders.web.dto.OrderResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse created = orderService.placeOrder(request);
        return ResponseEntity.created(URI.create("/api/orders/" + created.id())).body(created);
    }

    @GetMapping("/{orderId}")
    public OrderResponse get(@PathVariable("orderId") Long id) {
        return orderService.getOrder(id);
    }

    @GetMapping
    public List<OrderResponse> listForCustomer(@RequestParam String customerEmail) {
        return orderService.ordersForCustomer(customerEmail);
    }
}
