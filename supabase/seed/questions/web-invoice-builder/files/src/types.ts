export type GstRate = 0 | 5 | 12 | 18 | 28;

/** A PO the supplier can invoice against (a search result). */
export interface PoSummary {
  id: string;
  number: string;
  buyer: string;
}

/** Money is in paise (integers): ₹12.50 is 1250. */
export interface PoLine {
  sku: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  gstRate: GstRate;
}

/** One line of the invoice being built. `id` identifies the line while it is edited. */
export interface InvoiceLine extends PoLine {
  id: string;
}

export interface InvoiceDraft {
  poId: string | null;
  /** YYYY-MM-DD in India time: invoices are dated in IST whatever the browser's time zone. */
  invoiceDate: string;
  lines: InvoiceLine[];
}

export interface InvoiceApi {
  searchPos(query: string): Promise<PoSummary[]>;
  getPoLines(poId: string): Promise<PoLine[]>;
  saveDraft(draft: InvoiceDraft): Promise<void>;
  submit(draft: InvoiceDraft): Promise<void>;
}
