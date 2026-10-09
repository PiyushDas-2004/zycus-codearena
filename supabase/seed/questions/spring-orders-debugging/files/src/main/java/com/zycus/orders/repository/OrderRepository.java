package com.zycus.orders.repository;

import com.zycus.orders.domain.PurchaseOrder;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<PurchaseOrder, Long> {

    List<PurchaseOrder> findByCustomerEmailOrderByCreatedAtDesc(String customerEmail);
}
