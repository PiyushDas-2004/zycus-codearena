import type { SessionStore } from '../auth/sessionStore';
import { HttpError, type FetchLike, type Tokens } from '../types';

export interface HttpClientOptions {
  baseUrl: string;
  fetchImpl: FetchLike;
  session: SessionStore;
  /** Exchanges a refresh token for new tokens. Refresh tokens rotate on every call. */
  refresh: (refreshToken: string) => Promise<Tokens>;
  /** Called when the session can't be recovered; the app returns to the sign-in screen. */
  onLogout: () => void;
}

export interface RequestOptions {
  signal?: AbortSignal;
  body?: unknown;
}

export interface HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, options?: RequestOptions): Promise<T>;
}

export function createHttpClient(o: HttpClientOptions): HttpClient {
  // FIX: a single in-flight refresh that every 401 awaits (a boolean flag let concurrent requests
  // retry with the old token, or start their own refresh with an already-rotated refresh token).
  let refreshing: Promise<Tokens> | null = null;

  function refreshOnce(refreshToken: string): Promise<Tokens> {
    refreshing ??= (async () => {
      try {
        const fresh = await o.refresh(refreshToken);
        await o.session.saveTokens(fresh); // persisted before anyone retries
        return fresh;
      } catch {
        o.onLogout(); // once, however many requests were waiting
        throw new HttpError(401, 'Your session has expired. Sign in again.');
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  }

  const send = (method: string, path: string, options: RequestOptions, accessToken?: string) =>
    o.fetchImpl(o.baseUrl + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

  async function request<T>(method: string, path: string, options: RequestOptions): Promise<T> {
    // FIX: wait for the stored session on cold start (the first request went out without a token).
    await o.session.ready;
    const sentWith = o.session.get()?.tokens;
    let res = await send(method, path, options, sentWith?.accessToken);
    if (res.status === 401 && sentWith) {
      const current = o.session.get()?.tokens;
      // FIX: if another request already refreshed after this one was sent, just retry with the new
      // token; refreshing again would use a rotated (dead) refresh token and log the user out.
      const tokens =
        current && current.accessToken !== sentWith.accessToken ? current : await refreshOnce(sentWith.refreshToken);
      res = await send(method, path, options, tokens.accessToken); // retried at most once
    }
    if (!res.ok) throw new HttpError(res.status, `Request failed (${res.status})`);
    return (await res.json()) as T;
  }

  return {
    get: (path, options = {}) => request('GET', path, options),
    post: (path, options = {}) => request('POST', path, options),
  };
}
