package com.zycus.procurement.po;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, Long> {

    /**
     * Claims the key for this approver: 1 if this request owns it, 0 if another request already
     * claimed it. While that other request is still running, PostgreSQL makes this insert wait for
     * it, so a duplicate never runs at the same time as the original.
     */
    @Modifying
    @Query(nativeQuery = true, value = """
            insert into idempotency_records (idem_key, approver_id, purchase_order_id, created_at)
            values (:key, :approverId, :poId, now())
            on conflict (approver_id, idem_key) do nothing""")
    int claim(@Param("key") String key, @Param("approverId") String approverId, @Param("poId") long poId);

    Optional<IdempotencyRecord> findByApproverIdAndKey(String approverId, String key);
}
