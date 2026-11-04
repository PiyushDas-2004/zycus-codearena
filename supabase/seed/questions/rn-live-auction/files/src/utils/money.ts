/** Parses what the supplier typed ("1,000.05") into rupees. Returns null if it isn't a positive amount. */
export function parseRupees(input: string): number | null {
  const n = Number(input.replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * In a reverse auction a new bid must undercut the current best bid by at least the minimum
 * decrement: bid <= best - minDecrement. All values in rupees (two decimals).
 */
export function isValidBid(bid: number, best: number, minDecrement: number): boolean {
  return bid > 0 && bid <= best - minDecrement;
}

/** "₹12,34,567.50" (Indian digit grouping). */
export function formatRupees(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}
