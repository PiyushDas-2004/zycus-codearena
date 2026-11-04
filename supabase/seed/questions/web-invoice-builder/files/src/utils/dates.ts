/** Today's date in India as YYYY-MM-DD (invoices are dated in IST). */
export function todayInIndia(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
