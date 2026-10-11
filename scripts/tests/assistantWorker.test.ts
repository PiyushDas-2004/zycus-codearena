/**
 * The assistant worker end to end (scripts/assistant-worker.ts), as a real process, against fake
 * Supabase (PostgREST RPC) and LiteLLM servers: it claims a question, asks the model with the
 * secret, the product tag and the task text, and stores the filtered reply. No real model calls.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..');
const SECRET = 's'.repeat(43);

const body = (req: IncomingMessage) =>
  new Promise<Record<string, unknown>>((resolve) => {
    let text = '';
    req.on('data', (c: Buffer) => (text += c.toString()));
    req.on('end', () => resolve(text ? (JSON.parse(text) as Record<string, unknown>) : {}));
  });

function listen(handler: Parameters<typeof createServer>[1]): Promise<{ server: Server; url: string }> {
  const server = createServer(handler);
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve({ server, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` }),
    ),
  );
}

const cleanups: (() => void)[] = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
});

function startWorker(env: Record<string, string>): { child: ChildProcess; output: () => string } {
  const child = spawn(process.execPath, [join(ROOT, 'scripts', 'assistant-worker.ts')], {
    env: {
      ...process.env,
      ASSISTANT_ENV_FILE: join(ROOT, 'does-not-exist.env'),
      ASSISTANT_POLL_MS: '50',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout?.on('data', (c: Buffer) => (out += c.toString()));
  child.stderr?.on('data', (c: Buffer) => (out += c.toString()));
  cleanups.push(() => child.kill());
  return { child, output: () => out };
}

describe('assistant worker', () => {
  it('claims a question, asks the gateway and stores the filtered reply', async () => {
    const finished: Record<string, unknown>[] = [];
    const chatRequests: { headers: IncomingMessage['headers']; body: Record<string, unknown> }[] = [];
    let served = false;

    const supabase = await listen(async (req, res) => {
      const args = await body(req);
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/rest/v1/rpc/assistant_worker_next') {
        expect(args.p_secret).toBe(SECRET);
        expect(req.headers.apikey).toBe('anon-key');
        const job = served
          ? null
          : {
              request_id: 42,
              prompt: 'Why does refresh run twice?',
              file_path: 'src/api/httpClient.ts',
              code: 'let isRefreshing = false;',
              question: { title: 'Approvals Inbox', statement_md: 'Refresh tokens rotate.' },
              history: [],
            };
        served = true;
        return res.end(JSON.stringify({ ok: true, job }));
      }
      if (req.url === '/rest/v1/rpc/assistant_worker_finish') {
        finished.push(args);
        return res.end(JSON.stringify({ ok: true }));
      }
      res.statusCode = 404;
      res.end('{}');
    });
    const gateway = await listen(async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/v1/models') return res.end(JSON.stringify({ data: [{ id: 'qwen-cursor' }] }));
      chatRequests.push({ headers: req.headers, body: await body(req) });
      const leak = 'Hint: look at the flag.\n```ts\n' + 'const fix = 1;\n'.repeat(10) + '```';
      res.end(
        JSON.stringify({
          model: 'qwen-cursor',
          choices: [{ message: { content: leak } }],
          usage: { prompt_tokens: 900, completion_tokens: 40 },
        }),
      );
    });
    cleanups.push(
      () => supabase.server.close(),
      () => gateway.server.close(),
    );

    const worker = startWorker({
      VITE_SUPABASE_URL: supabase.url,
      VITE_SUPABASE_ANON_KEY: 'anon-key',
      LITELLM_BASE_URL: gateway.url,
      LITELLM_API_KEY: 'gateway-key',
      LITELLM_MODEL: 'qwen-cursor',
      LITELLM_PRODUCT: 'codearena',
      ASSISTANT_WORKER_SECRET: SECRET,
    });

    // Until the worker has logged it (the fake server sees the request a moment earlier).
    for (let i = 0; i < 100 && !/#42 answered/.test(worker.output()); i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(finished, worker.output()).toHaveLength(1);
    expect(finished[0]).toMatchObject({
      p_secret: SECRET,
      p_request_id: 42,
      p_status: 'answered',
      p_model: 'qwen-cursor',
    });
    expect(String(finished[0]?.p_reply)).toContain('Hint: look at the flag.');
    expect(String(finished[0]?.p_reply)).not.toContain('const fix'); // filtered before it is stored

    const chat = chatRequests[0]!;
    expect(chat.headers.authorization).toBe('Bearer gateway-key');
    expect(chat.headers['x-litellm-tags']).toBe('product:codearena');
    expect(JSON.stringify(chat.body.messages)).toContain('Refresh tokens rotate.');
    expect(worker.output()).toMatch(/#42 answered/);
  }, 30_000);

  it('stops with the one-time setup line when Supabase does not know its secret', async () => {
    const supabase = await listen(async (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'FORBIDDEN' }));
    });
    const gateway = await listen((_req, res) => res.end('{"data":[]}'));
    cleanups.push(
      () => supabase.server.close(),
      () => gateway.server.close(),
    );

    const worker = startWorker({
      VITE_SUPABASE_URL: supabase.url,
      VITE_SUPABASE_ANON_KEY: 'anon-key',
      LITELLM_BASE_URL: gateway.url,
      LITELLM_API_KEY: 'k',
      LITELLM_MODEL: 'm',
      ASSISTANT_WORKER_SECRET: SECRET,
    });
    const code = await new Promise<number | null>((resolve) => worker.child.on('exit', resolve));
    expect(code).toBe(1);
    expect(worker.output()).toMatch(/select private\.set_assistant_worker_secret\('[0-9a-f]{64}'\);/);
    expect(worker.output()).not.toMatch(/Assertion failed/);
  }, 30_000);

  it("takes no questions while the gateway can't be reached, and resumes when it can", async () => {
    let nextCalls = 0;
    let gatewayUp = false;
    const supabase = await listen(async (req, res) => {
      await body(req);
      res.setHeader('Content-Type', 'application/json');
      nextCalls++;
      res.end(
        JSON.stringify({
          ok: true,
          job: null,
          budget: { spent_usd: 0.0123, cap_usd: 5, worst_case_usd: 0.0091 },
        }),
      );
    });
    const gateway = await listen((_req, res) => {
      res.statusCode = gatewayUp ? 200 : 503;
      res.end('{"data":[]}');
    });
    cleanups.push(
      () => supabase.server.close(),
      () => gateway.server.close(),
    );

    const worker = startWorker({
      VITE_SUPABASE_URL: supabase.url,
      VITE_SUPABASE_ANON_KEY: 'anon-key',
      LITELLM_BASE_URL: gateway.url,
      LITELLM_API_KEY: 'k',
      LITELLM_MODEL: 'm',
      ASSISTANT_WORKER_SECRET: SECRET,
      ASSISTANT_GATEWAY_RECHECK_MS: '200',
    });
    // Once it has started (slow on a busy machine), it waits for the gateway instead of checking in.
    for (let i = 0; i < 100 && !/Pausing/.test(worker.output()); i++)
      await new Promise((r) => setTimeout(r, 100));
    await new Promise((r) => setTimeout(r, 600));
    expect(nextCalls, worker.output()).toBe(0); // not checking in: candidates are told at once
    expect(worker.output()).toMatch(/Pausing/);

    gatewayUp = true;
    for (let i = 0; i < 50 && !/Connected/.test(worker.output()); i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(nextCalls, worker.output()).toBeGreaterThan(0);
    expect(worker.output()).toMatch(/reachable again/);
    expect(worker.output()).toMatch(/US\$0\.0123 of the US\$5\.00 spending cap used/);
  }, 30_000);
});
