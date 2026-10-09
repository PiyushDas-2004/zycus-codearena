package com.zycus.orders.web;

import com.zycus.orders.inventory.InventoryClient.InsufficientStockException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// Read-only.
@RestControllerAdvice
public class ApiExceptionHandler {

    /** Thrown by the service layer when an order id does not exist. */
    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(Long id) {
            super("Order " + id + " was not found");
        }
    }

    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail handleNotFound(OrderNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InsufficientStockException.class)
    ProblemDetail handleInsufficientStock(InsufficientStockException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }
}
