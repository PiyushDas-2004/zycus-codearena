/**
 * A local stand-in for the Supabase project, for end-to-end tests and demos without touching the
 * real one:
 *
 *   npm run local:db      this server, on http://127.0.0.1:54321 (in memory, fresh on every start)
 *   npm run dev:local     the app against it, on http://localhost:5175
 *
 * It runs the REAL migrations and seed in PGlite (Postgres in WebAssembly, as the database tests
 * do) and answers the two APIs the app uses, the way Supabase does:
 *   POST /rest/v1/rpc/<fn>   as `anon`, or as `authenticated` with the signed-in staff member's claims
 *                            (SET LOCAL ROLE + request.jwt.claims, one transaction per request)
 *   /auth/v1/...             password sign-in, refresh, user, sign-out for the test accounts in
 *                            scripts/local-stack/seed.json (they work nowhere else)
 * The assistant worker can run against it too: npm run local:worker.
 *
 * Not emulated: PostgREST table queries (the app only calls functions), pg_cron (the time-up job
 * runs here every 30 s instead), Realtime, Storage.
 */
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createTestDb } from '../supabase/tests/helpers/db.ts';

const PORT = Number(process.env.LOCAL_STACK_PORT ?? 54321);
export const LOCAL_ANON_KEY = 'local-anon-key';
const JWT_SECRET = randomBytes(32);
const TOKEN_TTL_S = 3600;

interface SeedStaff {
  email: string;
  password: string;
  full_name: string;
  role: 'super_admin' | 'recruiter' | 'reviewer';
}
const seed = JSON.parse(readFileSync(join(import.meta.dirname, 'local-stack', 'seed.json'), 'utf8')) as {
  staff: SeedStaff[];
  workerSecret: string;
};

const log = (msg: string) => console.log(`${new Date().toLocaleTimeString()}  ${msg}`);

// ── Database ──────────────────────────────────────────────────────────────────
const db = await createTestDb({ seed: true });
const userIds = new Map<string, string>();
for (const s of seed.staff) {
  const id = randomUUID();
  userIds.set(s.email, id);
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, s.email]);
  await db.query(
    'insert into public.staff_users (email, full_name, role) values ($1, $2, $3::public.staff_role)',
    [s.email, s.full_name, s.role],
  );
}
await db.query('select private.set_assistant_worker_secret($1)', [
  createHash('sha256').update(seed.workerSecret).digest('hex'),
]);
await db.query('update public.app_settings set max_concurrent_sessions = 10 where id');

/** Serialises requests: each runs alone in its own transaction, as PostgREST does. */
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

// The pg_cron job of migration 0006: end tests whose time is up.
setInterval(() => {
  void exclusive(() => db.query('select private.finalize_overdue_sessions()')).catch((err: Error) =>
    log(`time-up job failed: ${err.message}`),
  );
}, 30_000).unref();

// ── Tokens (HS256 JWTs, like Supabase Auth) ────────────────────────────────────
const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url');
function signJwt(payload: Record<string, unknown>): string {
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}
function verifyJwt(token: string): Record<string, unknown> | null {
  const [head, body, sig] = token.split('.');
  if (!head || !body || !sig) return null;
  const expected = createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const claims = JSON.parse(Buffer.from(body, 'base64url').toString()) as Record<string, unknown>;
  return typeof claims.exp === 'number' && claims.exp > Date.now() / 1000 ? claims : null;
}

const refreshTokens = new Map<string, string>(); // refresh token → email
function session(email: string) {
  const id = userIds.get(email)!;
  const now = Math.floor(Date.now() / 1000);
  const refresh = randomBytes(24).toString('base64url');
  refreshTokens.set(refresh, email);
  const user = {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: new Date(0).toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: new Date(0).toISOString(),
    updated_at: new Date().toISOString(),
  };
  return {
    access_token: signJwt({
      sub: id,
      email,
      role: 'authenticated',
      aud: 'authenticated',
      iat: now,
      exp: now + TOKEN_TTL_S,
    }),
    token_type: 'bearer',
    expires_in: TOKEN_TTL_S,
    expires_at: now + TOKEN_TTL_S,
    refresh_token: refresh,
    user,
  };
}

// ── HTTP ──────────────────────────────────────────────────────────────────────
function send(res: ServerResponse, status: number, body?: unknown) {
  res.statusCode = status;
  if (body === undefined) return res.end();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 8_000_000) throw new Error('payload too large');
    chunks.push(c as Buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

const bearer = (req: IncomingMessage) => /^Bearer (.+)$/i.exec(req.headers.authorization ?? '')?.[1] ?? '';

async function rpc(req: IncomingMessage, res: ServerResponse, fn: string) {
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(fn)) return send(res, 404, { code: 'PGRST202', message: 'Not found' });
  if (req.headers.apikey !== LOCAL_ANON_KEY) return send(res, 401, { message: 'Invalid API key' });
  const token = bearer(req);
  const claims = token && token !== LOCAL_ANON_KEY ? verifyJwt(token) : null;
  if (token && token !== LOCAL_ANON_KEY && !claims) {
    return send(res, 401, { code: 'PGRST301', message: 'JWT expired or invalid' });
  }
  const args = (await readJson(req)) as Record<string, unknown>;
  const names = Object.keys(args);
  if (names.some((n) => !/^[a-z_][a-z0-9_]{0,62}$/.test(n)))
    return send(res, 400, { message: 'Bad argument name' });
  const params = names.map((n) => {
    const v = args[n];
    return v === null || v === undefined ? null : typeof v === 'object' ? JSON.stringify(v) : String(v);
  });
  const sql = `select to_jsonb(public.${fn}(${names.map((n, i) => `${n} => $${i + 1}`).join(', ')})) as r`;
  const role = claims ? 'authenticated' : 'anon';
  try {
    const result = await exclusive(() =>
      db.transaction(async (tx) => {
        await tx.query(`select set_config('request.jwt.claims', $1, true)`, [
          claims ? JSON.stringify(claims) : '',
        ]);
        await tx.query(`select set_config('request.headers', $1, true)`, [
          JSON.stringify({ 'x-forwarded-for': req.socket.remoteAddress ?? '127.0.0.1' }),
        ]);
        await tx.exec(`set local role ${role}`);
        return (await tx.query<{ r: unknown }>(sql, params)).rows[0]?.r ?? null;
      }),
    );
    send(res, 200, result);
  } catch (err) {
    const e = err as Error & { code?: string };
    const status = e.code === '42501' ? (claims ? 403 : 401) : e.code === '42883' ? 404 : 400;
    send(res, status, { code: e.code ?? 'XX000', message: e.message, details: null, hint: null });
  }
}

async function auth(req: IncomingMessage, res: ServerResponse, url: URL) {
  const path = url.pathname.replace(/^\/auth\/v1/, '');
  if (req.method === 'POST' && path === '/token') {
    const body = (await readJson(req)) as Record<string, string>;
    const grant = url.searchParams.get('grant_type');
    if (grant === 'password') {
      const email = String(body.email ?? '')
        .toLowerCase()
        .trim();
      const account = seed.staff.find((s) => s.email === email);
      if (!account || account.password !== body.password) {
        return send(res, 400, {
          code: 'invalid_credentials',
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
          msg: 'Invalid login credentials',
        });
      }
      log(`sign-in: ${email}`);
      return send(res, 200, session(email));
    }
    if (grant === 'refresh_token') {
      const email = refreshTokens.get(String(body.refresh_token ?? ''));
      if (!email) return send(res, 400, { code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
      refreshTokens.delete(String(body.refresh_token));
      return send(res, 200, session(email));
    }
    return send(res, 400, { code: 'unsupported_grant_type', msg: 'Unsupported grant type' });
  }
  if (req.method === 'GET' && path === '/user') {
    const claims = verifyJwt(bearer(req));
    if (!claims) return send(res, 401, { code: 'bad_jwt', msg: 'Invalid JWT' });
    return send(res, 200, session(String(claims.email)).user);
  }
  if (req.method === 'POST' && path === '/logout') return send(res, 204);
  return send(res, 404, { msg: `Not emulated: ${req.method} ${url.pathname}` });
}

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ?? '*');
  res.setHeader('Access-Control-Max-Age', '600');
  if (req.method === 'OPTIONS') return send(res, 204);
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const handle = async () => {
    const m = /^\/rest\/v1\/rpc\/([^/]+)$/.exec(url.pathname);
    if (m && req.method === 'POST') return rpc(req, res, m[1]!);
    if (url.pathname.startsWith('/auth/v1/')) return auth(req, res, url);
    if (url.pathname === '/health') return send(res, 200, { ok: true });
    return send(res, 404, { message: `Not emulated: ${req.method} ${url.pathname}` });
  };
  handle().catch((err: Error) => send(res, 500, { message: err.message }));
});

server.listen(PORT, '127.0.0.1', () => {
  log(`Local stack on http://127.0.0.1:${PORT} (real migrations + seed, in memory).`);
  log(`Staff test accounts: ${seed.staff.map((s) => `${s.email} (${s.role})`).join(', ')}`);
  log('Their passwords are in scripts/local-stack/seed.json. Start the app with: npm run dev:local');
});
