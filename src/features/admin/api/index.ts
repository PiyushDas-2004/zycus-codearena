import { envResult } from '@/config/env';
import { createSupabaseAdminApi } from './supabaseAdminApi';
import type { AdminApi } from './types';

export * from './types';

let instance: AdminApi | null = null;

/**
 * The admin API for this build, or null when there is no database to talk to (the in-browser mock
 * backend of `npm run dev:mock` serves candidates only).
 */
export function getAdminApi(): AdminApi | null {
  if (instance) return instance;
  if (!envResult.ok || envResult.env.useMockBackend) return null;
  instance = createSupabaseAdminApi(envResult.env.supabaseUrl, envResult.env.supabaseAnonKey);
  return instance;
}

/** Test hook: replace the API implementation. */
export function setAdminApiForTesting(api: AdminApi | null) {
  instance = api;
}
