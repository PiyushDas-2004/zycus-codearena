/**
 * Zod probes whether `new Function` is allowed (to JIT-compile schemas). Under our Content Security
 * Policy it isn't, and the probe makes the browser report a CSP violation. Jitless mode skips the
 * probe; validation is unchanged. Imported first by main.tsx, before any schema is used.
 */
import { z } from 'zod';

z.config({ jitless: true });
