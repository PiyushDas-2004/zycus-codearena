package com.zycus.procurement.po;

public class PoNotFoundException extends RuntimeException {

    public PoNotFoundException(long id) {
        super("Purchase order " + id + " not found");
    }
}
