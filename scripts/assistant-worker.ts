/**
 * The coding assistant's worker. Run it on a laptop that can reach the company LiteLLM gateway
 * (inside the Zycus network / VPN) while assessments are running:
 *
 *   npm run assistant:worker
 *
 * It only makes OUTGOING requests: it asks Supabase for candidates' questions (about once a second),
 * asks the gateway, and posts the filtered replies back. Nothing on the laptop is exposed to the
 * internet, and the gateway key never leaves it. When the worker isn't running, candidates see
 * "The assistant is unavailable right now" and lose no questions.
 *
 * It stops taking questions while the gateway is unreachable (VPN dropped), so candidates are told
 * at once instead of waiting. The database's spending cap (0011) decides which questions reach it
 * at all. The computer must stay awake (see docs/AI_ASSISTANT_SETUP.md); the worker doesn't change
 * any power setting.
 *
 * Settings come from .env.local (git-ignored): VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (the
 * public project values the app uses), LITELLM_BASE_URL, LITELLM_API_KEY, LITELLM_MODEL,
 * LITELLM_PRODUCT, and ASSISTANT_WORKER_SECRET (created on the first run).
 */
import { createHash, randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { answerJob, createLiteLlmChat, type AssistantJob } from './lib/assistantCore.ts';

const ROOT = join(import.meta.dirname, '..');
const ENV_FILE = process.env.ASSISTANT_ENV_FILE ?? join(ROOT, '.env.local');
const POLL_MS = Number(process.env.ASSISTANT_POLL_MS ?? 1_000);
const GATEWAY_RECHECK_MS = Number(process.env.ASSISTANT_GATEWAY_RECHECK_MS ?? 30_000);
const MAX_PARALLEL = 4;

function readEnv(): Record<string, string> {
  if (!existsSync(ENV_FILE)) return {};
  return Object.fromEntries(
    readFileSync(ENV_FILE, 'utf8')
      .split(/\r?\n/)
      .map((l) => /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l))
      .filter((m): m is RegExpExecArray => !!m)
      .map((m) => [m[1]!, m[2]!.replace(/^["']|["']$/g, '')]),
  );
}

const log = (msg: string) => console.log(`${new Date().toLocaleTimeString()}  ${msg}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const KEYS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'LITELLM_BASE_URL',
  'LITELLM_API_KEY',
  'LITELLM_MODEL',
  'LITELLM_PRODUCT',
  'ASSISTANT_WORKER_SECRET',
] as const;
// Environment variables win over .env.local (tests, or running on another machine).
const env: Record<string, string> = {
  ...readEnv(),
  ...Object.fromEntries(KEYS.flatMap((k) => (process.env[k] ? [[k, process.env[k]]] : []))),
};
const missing = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'LITELLM_BASE_URL',
  'LITELLM_API_KEY',
  'LITELLM_MODEL',
].filter((k) => !env[k]);
if (missing.length) {
  console.error(`✖ Missing in .env.local: ${missing.join(', ')}. See docs/AI_ASSISTANT_SETUP.md.`);
  process.exit(1);
}

let secret = env.ASSISTANT_WORKER_SECRET ?? '';
if (!secret) {
  secret = randomBytes(32).toString('base64url');
  appendFileSync(
    ENV_FILE,
    `\n# Coding-assistant worker secret (created by npm run assistant:worker). Keep it private.\nASSISTANT_WORKER_SECRET=${secret}\n`,
  );
  log('Created ASSISTANT_WORKER_SECRET in .env.local.');
}
const setupSql = `select private.set_assistant_worker_secret('${createHash('sha256').update(secret).digest('hex')}');`;

const supabaseUrl = env.VITE_SUPABASE_URL!.replace(/\/+$/, '');
async function rpc<T extends Record<string, unknown>>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: env.VITE_SUPABASE_ANON_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`${fn}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

const chat = createLiteLlmChat({
  baseUrl: env.LITELLM_BASE_URL!,
  apiKey: env.LITELLM_API_KEY!,
  model: env.LITELLM_MODEL!,
  product: env.LITELLM_PRODUCT,
});

/** Free check (no tokens): can this machine reach the gateway with this key? */
async function checkGateway(quiet = false): Promise<boolean> {
  try {
    const base = env.LITELLM_BASE_URL!.replace(/\/+$/, '');
    const res = await fetch(/\/v1$/.test(base) ? `${base}/models` : `${base}/v1/models`, {
      headers: { Authorization: `Bearer ${env.LITELLM_API_KEY}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return true;
    if (!quiet) log(`✖ The model gateway answered HTTP ${res.status}. Check LITELLM_API_KEY.`);
  } catch (err) {
    if (!quiet) {
      log(
        `✖ Can't reach ${env.LITELLM_BASE_URL} (${(err as Error).message}). Connect to the Zycus network / VPN.`,
      );
    }
  }
  return false;
}

interface Budget {
  spent_usd: number;
  cap_usd: number;
  worst_case_usd: number;
}
const usd = (n: number) => `US$${n.toFixed(n < 1 ? 4 : 2)}`;
let capReached = false;
/** Says when the spending cap stops new questions (and when it no longer does). */
function noteBudget(budget: Budget | undefined) {
  if (!budget) return;
  const reached = budget.cap_usd - budget.spent_usd < budget.worst_case_usd;
  if (reached && !capReached) {
    log(
      `✖ The ${usd(budget.cap_usd)} spending cap is reached (${usd(budget.spent_usd)} spent): candidates see the assistant as not available. To raise it, run in the SQL Editor: update private.assistant_budget set cap_usd = 10 where id;`,
    );
  } else if (!reached && capReached) {
    log(`✔ The spending cap is now ${usd(budget.cap_usd)}; taking questions again.`);
  }
  capReached = reached;
}

let running = true;
let gatewayUp = true;
const inFlight = new Set<Promise<void>>();
process.on('SIGINT', () => {
  if (!running) process.exit(130);
  running = false;
  log('Stopping after the questions in progress… (Ctrl+C again to quit now)');
});

const PAUSED =
  'Pausing: candidates see the assistant as unavailable until the gateway is reachable again (checking every 30 s).';

async function handle(job: AssistantJob) {
  const outcome = await answerJob(job, chat);
  try {
    const res = await rpc<{ ok: boolean; budget?: Budget }>('assistant_worker_finish', {
      p_secret: secret,
      p_request_id: job.request_id,
      p_status: outcome.status,
      p_reply: outcome.reply,
      p_model: outcome.model,
      p_latency_ms: outcome.latencyMs,
      p_prompt_tokens: outcome.promptTokens,
      p_completion_tokens: outcome.completionTokens,
    });
    const spent = res.budget ? ` · ${usd(res.budget.spent_usd)} of ${usd(res.budget.cap_usd)} spent` : '';
    log(
      outcome.status === 'answered'
        ? `✔ #${job.request_id} answered in ${(outcome.latencyMs / 1000).toFixed(1)} s (${outcome.promptTokens}+${outcome.completionTokens} tokens)${spent}`
        : `✖ #${job.request_id} failed (the gateway didn't answer); the candidate keeps the question${spent}`,
    );
    noteBudget(res.budget);
  } catch (err) {
    log(`✖ #${job.request_id}: couldn't store the reply (${(err as Error).message})`);
  }
  // A failure is usually the VPN: stop taking questions until the gateway answers again.
  if (outcome.status === 'failed' && gatewayUp && !(await checkGateway())) {
    gatewayUp = false;
    log(PAUSED);
  }
}

/** Waits, but wakes up early for Ctrl+C. */
async function pause(ms: number) {
  for (let t = 0; t < ms && running; t += 250) await sleep(Math.min(250, ms - t));
}

/**
 * Notices when the computer slept (the clock jumps while nothing ran), so whoever keeps it awake
 * can tell whether that worked: candidates had no assistant meanwhile.
 */
function watchForSleep(): () => void {
  let last = Date.now();
  const id = setInterval(() => {
    const now = Date.now();
    if (now - last > 60_000) {
      log(
        `⚠ This computer was asleep for about ${Math.round((now - last) / 60_000)} min; candidates had no assistant meanwhile. Keep it awake during assessments.`,
      );
    }
    last = now;
  }, 5_000);
  id.unref();
  return () => clearInterval(id);
}

async function main() {
  log(`Coding-assistant worker for ${supabaseUrl}`);
  const stopWatching = watchForSleep();
  gatewayUp = await checkGateway();
  log(gatewayUp ? `✔ Model gateway reachable (${env.LITELLM_MODEL}).` : PAUSED);

  let backoff = POLL_MS;
  let announced = false;
  while (running) {
    if (!gatewayUp) {
      // Not asking Supabase for work also tells candidates at once (no worker seen recently).
      await pause(GATEWAY_RECHECK_MS);
      if (running && (gatewayUp = await checkGateway(true))) {
        log('✔ Model gateway reachable again; taking questions.');
      }
      continue;
    }
    if (inFlight.size >= MAX_PARALLEL) {
      await Promise.race(inFlight);
      continue;
    }
    try {
      const res = await rpc<{ ok: boolean; error?: string; job?: AssistantJob | null; budget?: Budget }>(
        'assistant_worker_next',
        {
          p_secret: secret,
          p_label: hostname(),
        },
      );
      if (!res.ok && res.error === 'FORBIDDEN') {
        console.error(
          `\n✖ Supabase doesn't know this worker yet. One-time setup: in Supabase Dashboard → SQL Editor, run:\n\n  ${setupSql}\n\nThen start the worker again.\n`,
        );
        // Not process.exit(): on Windows, exiting while fetch sockets close trips a libuv assertion.
        process.exitCode = 1;
        break;
      }
      if (!announced) {
        const spent = res.budget
          ? ` ${usd(res.budget.spent_usd)} of the ${usd(res.budget.cap_usd)} spending cap used so far.`
          : '';
        log(`✔ Connected. Waiting for candidates' questions (Ctrl+C to stop).${spent}`);
        announced = true;
      }
      noteBudget(res.budget);
      backoff = POLL_MS;
      if (res.job) {
        log(`→ #${res.job.request_id} received`);
        const p = handle(res.job).finally(() => inFlight.delete(p));
        inFlight.add(p);
        continue; // there may be more waiting
      }
    } catch (err) {
      log(`… Supabase request failed (${(err as Error).message}); retrying`);
      backoff = Math.min(backoff * 2, 15_000);
    }
    await sleep(backoff);
  }
  await Promise.all(inFlight);
  stopWatching();
  if (process.exitCode !== 1) log('Stopped.');
}

void main();
