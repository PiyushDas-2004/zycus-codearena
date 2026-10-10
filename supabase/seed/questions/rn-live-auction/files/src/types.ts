export interface Bid {
  id: string;
  supplier: string;
  /** Amount in paise (1 rupee = 100 paise). */
  amountMinor: number;
}

export type AuctionEvent = { type: 'bid'; bid: Bid } | { type: 'extended'; closesAt: number };
