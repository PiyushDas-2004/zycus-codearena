package com.zycus.procurement.po;

/** Checked: callers must decide what to do when a cost centre is out of budget. */
public class BudgetExceededException extends Exception {

    public BudgetExceededException(String message) {
        super(message);
    }
}
