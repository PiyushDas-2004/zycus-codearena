package com.zycus.procurement.po;

import com.zycus.procurement.po.Dtos.InvoiceLine;
import com.zycus.procurement.po.Dtos.InvoiceRequest;
import com.zycus.procurement.po.Dtos.MatchResult;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** Two-way match: the invoice must agree with the PO on total and on every line. */
@Component
public class InvoiceMatcher {

    /**
     * Amounts are compared with {@code compareTo}: {@code BigDecimal.equals} also compares the scale,
     * so 1500.0 and 1500.00 were "different". Quantities are added up per SKU, because an invoice may
     * split one SKU over several lines (5 + 5 against 8 ordered passed line by line).
     */
    public MatchResult match(PurchaseOrder po, InvoiceRequest invoice) {
        List<String> problems = new ArrayList<>();
        if (po.getTotal().compareTo(invoice.amount()) != 0) {
            problems.add("Invoice amount " + invoice.amount() + " differs from PO total " + po.getTotal());
        }
        Map<String, PurchaseOrderLine> bySku = po.getLines().stream()
                .collect(Collectors.toMap(PurchaseOrderLine::getSku, Function.identity()));
        Map<String, Integer> invoiced = new LinkedHashMap<>();
        for (InvoiceLine line : invoice.lines()) {
            PurchaseOrderLine poLine = bySku.get(line.sku());
            if (poLine == null) {
                problems.add("SKU " + line.sku() + " is not on the PO");
                continue;
            }
            if (poLine.getUnitPrice().compareTo(line.unitPrice()) != 0) {
                problems.add("SKU " + line.sku() + ": unit price differs");
            }
            invoiced.merge(line.sku(), line.quantity(), Integer::sum);
        }
        invoiced.forEach((sku, quantity) -> {
            int ordered = bySku.get(sku).getQuantity();
            if (quantity > ordered) {
                problems.add("SKU " + sku + ": invoiced " + quantity + ", ordered " + ordered);
            }
        });
        return MatchResult.of(problems);
    }
}
