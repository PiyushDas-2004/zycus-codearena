package com.zycus.procurement.po;

import static org.assertj.core.api.Assertions.assertThat;

import com.zycus.procurement.po.Dtos.InvoiceLine;
import com.zycus.procurement.po.Dtos.InvoiceRequest;
import com.zycus.procurement.po.Dtos.MatchResult;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class InvoiceMatcherTest {

    private final InvoiceMatcher matcher = new InvoiceMatcher();

    /** PO for ₹1,500.00: SKU-1 x 8 @ ₹150.00 and SKU-2 x 2 @ ₹150.00. */
    private static PurchaseOrder po() {
        PurchaseOrder po = new PurchaseOrder("PO-77", new BigDecimal("1500.00"));
        po.addLine(new PurchaseOrderLine("SKU-1", 8, new BigDecimal("150.00")));
        po.addLine(new PurchaseOrderLine("SKU-2", 2, new BigDecimal("150.00")));
        return po;
    }

    private static InvoiceLine line(String sku, int quantity, String unitPrice) {
        return new InvoiceLine(sku, quantity, new BigDecimal(unitPrice));
    }

    @Test
    @DisplayName("amounts that are equal in value match, however they are written")
    void comparesAmountsByValue() {
        InvoiceRequest invoice = new InvoiceRequest("INV-1", new BigDecimal("1500.0"),
                List.of(line("SKU-1", 8, "150"), line("SKU-2", 2, "150.000")));

        MatchResult result = matcher.match(po(), invoice);

        assertThat(result.problems()).isEmpty();
        assertThat(result.matched()).isTrue();
    }

    @Test
    @DisplayName("a SKU split over several invoice lines can't exceed the ordered quantity")
    void addsUpSplitLines() {
        InvoiceRequest invoice = new InvoiceRequest("INV-2", new BigDecimal("1500.00"),
                List.of(line("SKU-1", 5, "150.00"), line("SKU-1", 5, "150.00")));

        MatchResult result = matcher.match(po(), invoice);

        assertThat(result.matched()).isFalse();
        assertThat(result.problems()).anySatisfy(p -> assertThat(p).contains("SKU-1"));
    }

    @Test
    @DisplayName("a different unit price is reported")
    void reportsPriceDifferences() {
        InvoiceRequest invoice = new InvoiceRequest("INV-3", new BigDecimal("1500.00"),
                List.of(line("SKU-1", 8, "150.01")));

        assertThat(matcher.match(po(), invoice).matched()).isFalse();
    }

    @Test
    @DisplayName("a SKU that isn't on the PO is reported")
    void reportsUnknownSkus() {
        InvoiceRequest invoice = new InvoiceRequest("INV-4", new BigDecimal("1500.00"),
                List.of(line("SKU-9", 1, "150.00")));

        MatchResult result = matcher.match(po(), invoice);

        assertThat(result.matched()).isFalse();
        assertThat(result.problems()).anySatisfy(p -> assertThat(p).contains("SKU-9"));
    }
}
