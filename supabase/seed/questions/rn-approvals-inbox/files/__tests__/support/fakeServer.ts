import { HttpError, type FetchLike, type Tokens } from '../../src/types';

/**
 * A fake API server for the HTTP client tests. Access tokens are checked when a request arrives;
 * refresh tokens rotate on every successful refresh (the previous refresh token stops working).
 */
export function createFakeServer(options: {
  baseUrl: string;
  access: string;
  refresh: string;
  refreshFails?: boolean;
  /** How long a refresh takes (a slow network can take seconds). */
  refreshMs?: number;
}) {
  let valid: Tokens = { accessToken: options.access, refreshToken: options.refresh };
  let generation = 0;
  const calls: { path: string; auth: string | undefined }[] = [];
  const held = new Map<string, Array<() => void>>();
  const holding = new Set<string>();

  const refresh = jest.fn(async (refreshToken: string): Promise<Tokens> => {
    await new Promise((r) => setTimeout(r, options.refreshMs ?? 5));
    if (options.refreshFails || refreshToken !== valid.refreshToken) {
      throw new HttpError(401, 'invalid_grant');
    }
    generation += 1;
    valid = { accessToken: `access-${generation}`, refreshToken: `refresh-${generation}` };
    return { ...valid };
  });

  const fetchImpl = jest.fn<FetchLike>(async (url, init = {}) => {
    const path = url.replace(options.baseUrl, '');
    const auth = init.headers?.Authorization;
    calls.push({ path, auth });
    const status = auth === `Bearer ${valid.accessToken}` ? 200 : 401;
    if (holding.has(path)) {
      await new Promise<void>((resolve) => held.set(path, [...(held.get(path) ?? []), resolve]));
    }
    await new Promise((r) => setTimeout(r, 1));
    return { status, ok: status === 200, json: async () => ({ path }) };
  });

  return {
    fetchImpl,
    refresh,
    calls,
    /** Delays responses for `path` (the request is checked on arrival) until release(path). */
    hold: (path: string) => holding.add(path),
    release: (path: string) => {
      holding.delete(path);
      held.get(path)?.forEach((resolve) => resolve());
      held.delete(path);
    },
  };
}
