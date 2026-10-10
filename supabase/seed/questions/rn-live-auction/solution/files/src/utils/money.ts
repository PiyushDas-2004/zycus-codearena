/** Parses what the supplier typed ("1,000.05") into rupees. Returns null if it isn't a positive amount. */
export function parseRupees(input: string): number | null {
  const n = Number(input.replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

// FIX: compare money in integer paise. In floating point 1000.05 - 0.10 is 999.9499999999999, so
// a valid ₹999.95 bid was rejected (and 0.3 - 0.1 is 0.19999999999999998).
const toPaise = (rupees: number) => Math.round(rupees * 100);

/**
 * In a reverse auction a new bid must undercut the current best bid by at least the minimum
 * decrement: bid <= best - minDecrement. All values in rupees (two decimals).
 */
export function isValidBid(bid: number, best: number, minDecrement: number): boolean {
  const b = toPaise(bid);
  return b > 0 && b <= toPaise(best) - toPaise(minDecrement);
}

// FIX: Intl formats the currency with Indian grouping (12,34,567.50); toFixed doesn't group.
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "₹12,34,567.50" (Indian digit grouping). */
export function formatRupees(amount: number): string {
  return inr.format(amount);
}
