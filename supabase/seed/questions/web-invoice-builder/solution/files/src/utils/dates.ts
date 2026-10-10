const indiaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Today's date in India as YYYY-MM-DD (invoices are dated in IST).
 *
 * toISOString() is the UTC date, which is still "yesterday" until 05:30 IST: an invoice raised at
 * 00:30 on the 1st was dated the last day of the previous month (and its GST return).
 */
export function todayInIndia(now: Date = new Date()): string {
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    indiaDate.formatToParts(now).find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
