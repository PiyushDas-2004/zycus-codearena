package com.zycus.procurement.po;

import java.math.BigDecimal;

/**
 * Reserves budget for an approved PO (cost-centre limits). Implemented by the finance module; it
 * writes a reservation row in the same database.
 */
public interface BudgetService {

    /** Reserves {@code amount} for the PO, or throws if the cost centre has no budget left. */
    void reserve(long purchaseOrderId, BigDecimal amount) throws BudgetExceededException;
}
