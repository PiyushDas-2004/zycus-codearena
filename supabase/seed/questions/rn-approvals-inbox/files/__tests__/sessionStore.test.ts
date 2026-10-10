import { asyncStorage } from '@codearena/test-utils';
import { createHttpClient } from '../src/api/httpClient';
import { createSessionStore, SESSION_KEY } from '../src/auth/sessionStore';
import { createFakeServer } from './support/fakeServer';

const BASE = 'https://api.zycus.test';
const saved = { userId: 'u1', tokens: { accessToken: 'access-0', refreshToken: 'refresh-0' } };

describe('session persistence (cold start)', () => {
  beforeEach(() => {
    asyncStorage.seed({ [SESSION_KEY]: JSON.stringify(saved) });
    asyncStorage.setLatency(20); // storage reads take a moment on a real device
  });

  it('the first request after launch carries the saved access token', async () => {
    const server = createFakeServer({ baseUrl: BASE, access: 'access-0', refresh: 'refresh-0' });
    const session = createSessionStore(); // still reading from storage
    const client = createHttpClient({
      baseUrl: BASE,
      fetchImpl: server.fetchImpl,
      session,
      refresh: server.refresh,
      onLogout: jest.fn(),
    });
    await expect(client.get('/me')).resolves.toEqual({ path: '/me' });
    expect(server.calls[0]?.auth).toBe('Bearer access-0');
    expect(server.refresh).not.toHaveBeenCalled();
  });

  it('keeps tokens that were saved while the session was still loading', async () => {
    const session = createSessionStore();
    const fresh = { accessToken: 'access-9', refreshToken: 'refresh-9' };
    await session.saveTokens(fresh);
    await session.ready;
    expect(session.get()).toEqual({ userId: 'u1', tokens: fresh });
    expect(JSON.parse(asyncStorage.snapshot()[SESSION_KEY]!)).toEqual({ userId: 'u1', tokens: fresh });
  });

  it('signing out removes the saved session', async () => {
    const session = createSessionStore();
    await session.ready;
    await session.signOut();
    expect(session.get()).toBeNull();
    expect(asyncStorage.snapshot()[SESSION_KEY]).toBeUndefined();
  });
});
