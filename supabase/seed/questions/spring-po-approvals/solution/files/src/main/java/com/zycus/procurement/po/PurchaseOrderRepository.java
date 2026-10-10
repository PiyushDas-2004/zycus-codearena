package com.zycus.procurement.po;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    /**
     * One page of the inbox, ids only, so the database applies limit/offset and the sort. (Paging a
     * {@code join fetch} of a collection can't be done in SQL: Hibernate loaded every PO and paged in
     * memory, HHH90003004.)
     */
    @Query("select p.id from PurchaseOrder p")
    Page<Long> findPageIds(Pageable pageable);

    /** The POs of one page with their lines, in one query. */
    @Query("select distinct p from PurchaseOrder p left join fetch p.lines where p.id in :ids")
    List<PurchaseOrder> findAllWithLines(@Param("ids") Collection<Long> ids);

    /** For callers outside a transaction (open-in-view is off): loads the lines too. */
    @EntityGraph(attributePaths = "lines")
    Optional<PurchaseOrder> findWithLinesById(long id);
}
