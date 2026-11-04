/**
 * Bundles the test sandbox runtime (src/features/runner/sandbox/runtime.ts) into one classic
 * script. React's DEVELOPMENT builds are used on purpose: act() and React's warnings (duplicate
 * keys, act() misuse) only exist there, and candidates' tests rely on them.
 * Used by vite.config.ts (dev server + build) and by the question verification tests.
 */
import { join } from 'node:path';
import { rolldown } from 'rolldown';

const ROOT = join(import.meta.dirname, '..', '..');
export const SANDBOX_ENTRY = join(ROOT, 'src', 'features', 'runner', 'sandbox', 'runtime.ts');

export async function bundleSandboxRuntime({ minify = true } = {}): Promise<string> {
  const bundle = await rolldown({
    input: SANDBOX_ENTRY,
    platform: 'browser',
    logLevel: 'warn',
    // React's development builds; `global` (Node) is what react-test-renderer reads its flags from.
    transform: { define: { 'process.env.NODE_ENV': '"development"', global: 'globalThis' } },
  });
  try {
    const { output } = await bundle.generate({ format: 'iife', minify });
    const chunk = output.find((o) => o.type === 'chunk');
    if (!chunk || chunk.type !== 'chunk') throw new Error('Sandbox runtime: no output');
    return chunk.code;
  } finally {
    await bundle.close();
  }
}
