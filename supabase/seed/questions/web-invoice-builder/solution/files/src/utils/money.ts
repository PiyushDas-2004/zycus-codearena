const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

/** ₹12,34,567.50 */
export function formatPaise(paise: number): string {
  return inr.format(paise / 100);
}

const AMOUNT = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Parses what the supplier typed in a price field ("1250", "1,250.50", "₹ 99.9") into paise.
 * Returns null when it isn't a valid, non-negative amount with at most 2 decimals.
 *
 * parseFloat stops at the first comma ("1,250.50" → 1) and accepts trailing junk ("12abc" → 12),
 * so the text is validated as a whole and converted from its digits, without floating point.
 */
export function parseRupees(text: string): number | null {
  const match = AMOUNT.exec(text.replace(/[₹,\s]/g, ''));
  if (!match) return null;
  const [, rupees, fraction = ''] = match;
  return Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
}

/** Net amount of a line, in paise. */
export function lineNet(line: { quantity: number; unitPricePaise: number }): number {
  return line.quantity * line.unitPricePaise;
}

/** GST of a line, rounded to the paisa. */
export function lineTax(line: { quantity: number; unitPricePaise: number; gstRate: number }): number {
  return Math.round((lineNet(line) * line.gstRate) / 100);
}
