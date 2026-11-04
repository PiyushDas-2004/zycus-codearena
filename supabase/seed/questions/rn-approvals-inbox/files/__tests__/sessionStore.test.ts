import { asyncStorage } from '@codearena/test-utils';
import { createHttpClient } from '../src/api/httpClient';
import { createSessionStore, SESSION_KEY } from '../src/auth/sessionStore';
import { createFakeServer, elapse } from './support/fakeServer';

const BASE = 'https://api.zycus.test';
const saved = { userId: 'u1', tokens: { accessToken: 'access-0', refreshToken: 'refresh-0' } };
/** Storage reads and writes take this long (a slow device, on purpose much longer than needed). */
const STORAGE_MS = 30_000;

describe('session persistence (cold start)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    asyncStorage.seed({ [SESSION_KEY]: JSON.stringify(saved) });
    asyncStorage.setLatency(STORAGE_MS);
  });
  afterEach(() => {
    jest.useRealTimers();
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
    const me = client.get('/me');
    await elapse(STORAGE_MS + 1_000);
    await expect(me).resolves.toEqual({ path: '/me' });
    expect(server.calls[0]?.auth).toBe('Bearer access-0');
    expect(server.refresh).not.toHaveBeenCalled();
  });

  it('keeps tokens that were saved while the session was still loading', async () => {
    const session = createSessionStore();
    const fresh = { accessToken: 'access-9', refreshToken: 'refresh-9' };
    const saving = session.saveTokens(fresh);
    await elapse(2 * STORAGE_MS + 1_000);
    await saving;
    await session.ready;
    expect(session.get()).toEqual({ userId: 'u1', tokens: fresh });
    expect(JSON.parse(asyncStorage.snapshot()[SESSION_KEY]!)).toEqual({ userId: 'u1', tokens: fresh });
  });

  it('signing out removes the saved session', async () => {
    const session = createSessionStore();
    await elapse(STORAGE_MS + 1_000);
    await session.ready;
    const out = session.signOut();
    await elapse(STORAGE_MS + 1_000);
    await out;
    expect(session.get()).toBeNull();
    expect(asyncStorage.snapshot()[SESSION_KEY]).toBeUndefined();
  });

  it('signing out while the session is still loading keeps the user signed out', async () => {
    const session = createSessionStore();
    const out = session.signOut();
    await elapse(2 * STORAGE_MS + 1_000);
    await out;
    await session.ready;
    expect(session.get()).toBeNull();
    expect(asyncStorage.snapshot()[SESSION_KEY]).toBeUndefined();
  });
});
