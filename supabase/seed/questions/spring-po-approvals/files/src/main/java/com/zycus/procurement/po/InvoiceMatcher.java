package com.zycus.procurement.po;

import com.zycus.procurement.po.Dtos.InvoiceLine;
import com.zycus.procurement.po.Dtos.InvoiceRequest;
import com.zycus.procurement.po.Dtos.MatchResult;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** Two-way match: the invoice must agree with the PO on total and on every line. */
@Component
public class InvoiceMatcher {

    public MatchResult match(PurchaseOrder po, InvoiceRequest invoice) {
        List<String> problems = new ArrayList<>();
        if (!po.getTotal().equals(invoice.amount())) {
            problems.add("Invoice amount " + invoice.amount() + " differs from PO total " + po.getTotal());
        }
        Map<String, PurchaseOrderLine> bySku = po.getLines().stream()
                .collect(Collectors.toMap(PurchaseOrderLine::getSku, Function.identity()));
        for (InvoiceLine line : invoice.lines()) {
            PurchaseOrderLine poLine = bySku.get(line.sku());
            if (poLine == null) {
                problems.add("SKU " + line.sku() + " is not on the PO");
            } else if (line.quantity() > poLine.getQuantity()) {
                problems.add("SKU " + line.sku() + ": invoiced " + line.quantity() + ", ordered " + poLine.getQuantity());
            } else if (!poLine.getUnitPrice().equals(line.unitPrice())) {
                problems.add("SKU " + line.sku() + ": unit price differs");
            }
        }
        return MatchResult.of(problems);
    }
}
