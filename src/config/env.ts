/**
 * Build-time settings (VITE_* variables, baked in by Vite). Validated without a schema library so
 * the sign-in page stays small.
 */
export type Env = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  enableEntraSso: boolean;
  enableStyleguide: boolean;
  useMockBackend: boolean;
};

export type EnvResult = { ok: true; env: Env } | { ok: false; problems: string[] };

const SUPABASE_URL = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;

export function parseEnv(raw: Record<string, unknown>): EnvResult {
  const problems: string[] = [];
  const text = (key: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : '';
  };
  const flag = (key: string) => {
    const v = text(key);
    if (v !== '' && v !== 'true' && v !== 'false') problems.push(`${key} must be true or false`);
    return v === 'true';
  };

  const env: Env = {
    supabaseUrl: text('VITE_SUPABASE_URL'),
    supabaseAnonKey: text('VITE_SUPABASE_ANON_KEY'),
    enableEntraSso: flag('VITE_ENABLE_ENTRA_SSO'),
    enableStyleguide: flag('VITE_ENABLE_STYLEGUIDE') || import.meta.env.DEV,
    useMockBackend: flag('VITE_USE_MOCK_BACKEND'),
  };
  if (!env.useMockBackend) {
    if (!SUPABASE_URL.test(env.supabaseUrl)) {
      problems.push('VITE_SUPABASE_URL must look like https://<project-ref>.supabase.co');
    }
    if (!env.supabaseAnonKey) problems.push('VITE_SUPABASE_ANON_KEY is required');
  }
  return problems.length ? { ok: false, problems } : { ok: true, env };
}

export const envResult = parseEnv(import.meta.env);
