import { z } from 'zod';

const flag = z
  .enum(['true', 'false', ''])
  .optional()
  .transform((v) => v === 'true');

const EnvSchema = z
  .object({
    VITE_SUPABASE_URL: z.string().optional(),
    VITE_SUPABASE_ANON_KEY: z.string().optional(),
    VITE_ENABLE_ENTRA_SSO: flag,
    VITE_ENABLE_STYLEGUIDE: flag,
    VITE_USE_MOCK_BACKEND: flag,
  })
  .superRefine((env, ctx) => {
    if (env.VITE_USE_MOCK_BACKEND) return;
    if (!env.VITE_SUPABASE_URL || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(env.VITE_SUPABASE_URL)) {
      ctx.addIssue({
        code: 'custom',
        path: ['VITE_SUPABASE_URL'],
        message: 'must look like https://<project-ref>.supabase.co',
      });
    }
    if (!env.VITE_SUPABASE_ANON_KEY) {
      ctx.addIssue({ code: 'custom', path: ['VITE_SUPABASE_ANON_KEY'], message: 'is required' });
    }
  });

export type Env = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  enableEntraSso: boolean;
  enableStyleguide: boolean;
  useMockBackend: boolean;
};

export type EnvResult = { ok: true; env: Env } | { ok: false; problems: string[] };

export function parseEnv(raw: Record<string, unknown>): EnvResult {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`),
    };
  }
  const e = parsed.data;
  return {
    ok: true,
    env: {
      supabaseUrl: e.VITE_SUPABASE_URL ?? '',
      supabaseAnonKey: e.VITE_SUPABASE_ANON_KEY ?? '',
      enableEntraSso: e.VITE_ENABLE_ENTRA_SSO,
      enableStyleguide: e.VITE_ENABLE_STYLEGUIDE || import.meta.env.DEV,
      useMockBackend: e.VITE_USE_MOCK_BACKEND,
    },
  };
}

export const envResult = parseEnv(import.meta.env);
