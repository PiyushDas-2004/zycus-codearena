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
  let isRefreshing = false;

  async function request<T>(method: string, path: string, options: RequestOptions, retried = false): Promise<T> {
    const tokens = o.session.get()?.tokens;
    const res = await o.fetchImpl(o.baseUrl + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

    if (res.status === 401 && !retried) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const fresh = await o.refresh(tokens!.refreshToken);
          void o.session.saveTokens(fresh);
        } catch {
          o.onLogout();
          throw new HttpError(401, 'Your session has expired. Sign in again.');
        } finally {
          isRefreshing = false;
        }
      }
      return request<T>(method, path, options, true);
    }
    if (!res.ok) throw new HttpError(res.status, `Request failed (${res.status})`);
    return (await res.json()) as T;
  }

  return {
    get: (path, options = {}) => request('GET', path, options),
    post: (path, options = {}) => request('POST', path, options),
  };
}
