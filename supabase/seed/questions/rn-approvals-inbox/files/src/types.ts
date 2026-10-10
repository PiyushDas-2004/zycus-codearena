export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Decision = 'APPROVED' | 'REJECTED';
export type Filter = 'all' | 'urgent' | 'mine';

export interface Approval {
  id: string;
  title: string;
  /** Amount in paise. */
  amountMinor: number;
  urgent: boolean;
  requestedBy: string;
  status: ApprovalStatus;
  /** Set when the last decision on this item failed. */
  error?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface Session {
  userId: string;
  tokens: Tokens;
}

/** The subset of fetch() the app uses (injected so it can be faked in tests). */
export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<{ status: number; ok: boolean; json(): Promise<unknown> }>;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
