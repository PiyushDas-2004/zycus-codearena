import { envResult } from '@/config/env';
import { installDevSwitch, relaxedProctoringEnabled, withRelaxedProctoring } from './devRelaxedProctoring';
import { createMockCandidateApi } from './mockCandidateApi';
import { createSupabaseCandidateApi } from './supabaseCandidateApi';
import type { CandidateApi } from './types';

export * from './types';

let instance: CandidateApi | null = null;

/** The candidate API for this build: Supabase normally, the in-memory mock when explicitly enabled. */
export function getCandidateApi(): CandidateApi {
  if (instance) return instance;
  if (!envResult.ok) {
    throw new Error(`The app is not configured: ${envResult.problems.join('; ')}`);
  }
  const env = envResult.env;
  // Compared against the raw build-time constant (not env.useMockBackend) so production builds drop
  // the mock entirely; vite.config.ts also refuses to build with the mock enabled.
  let api =
    import.meta.env.VITE_USE_MOCK_BACKEND === 'true'
      ? createMockCandidateApi()
      : createSupabaseCandidateApi(env.supabaseUrl, env.supabaseAnonKey);
  if (import.meta.env.DEV && api.kind === 'supabase') {
    installDevSwitch();
    if (relaxedProctoringEnabled()) api = withRelaxedProctoring(api);
  }
  instance = api;
  return instance;
}

/** Test hook: replace the API implementation. */
export function setCandidateApiForTesting(api: CandidateApi | null) {
  instance = api;
}
