package com.zycus.procurement.po;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    /** The approvals inbox: one page of POs with their lines (the app shows line counts). */
    @Query(value = "select distinct p from PurchaseOrder p left join fetch p.lines",
           countQuery = "select count(p) from PurchaseOrder p")
    Page<PurchaseOrder> findPageWithLines(Pageable pageable);
}
