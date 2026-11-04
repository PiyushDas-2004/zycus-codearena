/**
 * The coding-assistant worker against the local stack (npm run local:db) instead of Supabase:
 *
 *   npm run local:worker
 *
 * Uses the local stack's address and its test worker secret (scripts/local-stack/seed.json), and
 * the real model gateway settings from .env.local (so it needs the Zycus network, and real
 * questions cost real tokens, within the database's spending cap).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const seed = JSON.parse(readFileSync(join(import.meta.dirname, 'local-stack', 'seed.json'), 'utf8')) as {
  workerSecret: string;
};
process.env.VITE_SUPABASE_URL = `http://127.0.0.1:${process.env.LOCAL_STACK_PORT ?? 54321}`;
process.env.VITE_SUPABASE_ANON_KEY = 'local-anon-key';
process.env.ASSISTANT_WORKER_SECRET = seed.workerSecret;
await import('./assistant-worker.ts');
