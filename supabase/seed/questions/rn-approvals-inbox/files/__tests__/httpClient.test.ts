import { asyncStorage } from '@codearena/test-utils';
import { createHttpClient } from '../src/api/httpClient';
import { createSessionStore, SESSION_KEY } from '../src/auth/sessionStore';
import { createFakeServer } from './support/fakeServer';

const BASE = 'https://api.zycus.test';

async function setup(options: { refreshFails?: boolean; refreshMs?: number } = {}) {
  asyncStorage.seed({
    [SESSION_KEY]: JSON.stringify({ userId: 'u1', tokens: { accessToken: 'access-0', refreshToken: 'refresh-0' } }),
  });
  // The saved access token has expired; the refresh token is still valid.
  const server = createFakeServer({ baseUrl: BASE, access: 'expired', refresh: 'refresh-0', ...options });
  const session = createSessionStore();
  await session.ready;
  const onLogout = jest.fn();
  const client = createHttpClient({ baseUrl: BASE, fetchImpl: server.fetchImpl, session, refresh: server.refresh, onLogout });
  return { server, session, client, onLogout };
}

describe('token refresh', () => {
  it('retries with the new access token and stores the rotated tokens', async () => {
    const { server, client, session } = await setup();
    await expect(client.get('/approvals')).resolves.toEqual({ path: '/approvals' });
    expect(server.calls.map((c) => c.auth)).toEqual(['Bearer access-0', 'Bearer access-1']);
    expect(session.get()?.tokens).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    expect(JSON.parse(asyncStorage.snapshot()[SESSION_KEY]!).tokens.refreshToken).toBe('refresh-1');
  });

  it('refreshes once when several requests get 401 at the same time', async () => {
    // A slow refresh: the other requests must wait for it, however long it takes.
    const { server, client, onLogout } = await setup({ refreshMs: 600 });
    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
    expect(results).toEqual([{ path: '/a' }, { path: '/b' }, { path: '/c' }]);
    expect(server.refresh).toHaveBeenCalledTimes(1);
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('does not refresh again for a request that was sent before the refresh finished', async () => {
    const { server, client, onLogout } = await setup();
    server.hold('/slow');
    const slow = client.get('/slow'); // sent with the old token; its 401 arrives late
    await client.get('/fast');
    server.release('/slow');
    await expect(slow).resolves.toEqual({ path: '/slow' });
    expect(server.refresh).toHaveBeenCalledTimes(1);
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('logs out exactly once when the refresh token is rejected', async () => {
    const { client, onLogout } = await setup({ refreshFails: true });
    const results = await Promise.allSettled([client.get('/a'), client.get('/b'), client.get('/c')]);
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected', 'rejected']);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
