import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vitest/config';
import { appConfig } from './src/config/app.config.ts';
import { cloudflareHeadersFile, securityHeaders } from './src/config/securityHeaders.ts';
import { loadQuestion, questionDirs } from './scripts/lib/questionSource.ts';
import { bundleSandboxRuntime } from './scripts/lib/sandboxRuntime.ts';

/**
 * Injects the platform name/subtitle from src/config/app.config.ts (defined in one place), and a
 * preconnect to the Supabase project so the first API call doesn't wait for DNS + TLS.
 */
function platformIdentity(): Plugin {
  let supabaseUrl = '';
  return {
    name: 'codearena-platform-identity',
    configResolved(config) {
      supabaseUrl = config.env.VITE_USE_MOCK_BACKEND === 'true' ? '' : (config.env.VITE_SUPABASE_URL ?? '');
    },
    transformIndexHtml(html) {
      const out = html
        .replaceAll('__PLATFORM_NAME__', appConfig.platformName)
        .replaceAll('__PLATFORM_SUBTITLE__', appConfig.subtitle)
        .replaceAll('__FAVICON__', appConfig.brand.favicon);
      if (!supabaseUrl) return out;
      return {
        html: out,
        tags: [
          { tag: 'link', attrs: { rel: 'preconnect', href: supabaseUrl, crossorigin: '' }, injectTo: 'head' },
        ],
      };
    },
  };
}

/**
 * Text that must never ship to candidates' browsers: each seeded question's rubric and reviewer
 * notes (they describe the planted bugs). Plain-ASCII fragments, so string escaping in the bundle
 * can't hide a match.
 */
function confidentialSeedMarkers(): string[] {
  const fragment = (text: string) =>
    text
      .split(/[^A-Za-z0-9 ,.()-]+/)
      .map((s) => s.trim())
      .sort((a, b) => b.length - a.length)[0]
      ?.slice(0, 48) ?? '';
  return questionDirs()
    .map(loadQuestion)
    .flatMap((q) => [
      ...q.rubric.map((r) => fragment(r.description)),
      fragment(q.reference_solution?.notes_md ?? ''),
    ])
    .filter((m) => m.length >= 24);
}

/**
 * Deployable builds (dist/) must use a real Supabase project, never the in-browser mock. A mock
 * build is allowed only into another folder, for local end-to-end tests (`npm run preview:mock`).
 * No production build may contain a question's rubric or reviewer notes.
 */
function productionGuards(): Plugin {
  let mock = false;
  return {
    name: 'codearena-production-guards',
    generateBundle(_options, bundle) {
      if (mock) return;
      const markers = confidentialSeedMarkers();
      for (const file of Object.values(bundle)) {
        const text = file.type === 'chunk' ? file.code : typeof file.source === 'string' ? file.source : '';
        const hit = markers.find((m) => text.includes(m));
        if (hit)
          this.error(
            `${file.fileName} contains confidential question text ("${hit}"). Check mock-only imports.`,
          );
      }
    },
    configResolved(config) {
      mock = config.env.VITE_USE_MOCK_BACKEND === 'true';
      if (config.command !== 'build') return;
      const deployable = resolve(config.root, config.build.outDir) === resolve(config.root, 'dist');
      if (config.env.VITE_USE_MOCK_BACKEND === 'true') {
        if (deployable)
          throw new Error('VITE_USE_MOCK_BACKEND=true is for development only; refusing to build dist/.');
      } else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.env.VITE_SUPABASE_URL ?? '')) {
        throw new Error('VITE_SUPABASE_URL must be set to https://<project-ref>.supabase.co for a build.');
      } else if (!config.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('VITE_SUPABASE_ANON_KEY must be set (the public anon/publishable key) for a build.');
      }
    },
  };
}

/** Security headers: dist/_headers for Cloudflare Pages, and the same headers in `vite preview`. */
function securityHeadersPlugin(): Plugin {
  let supabaseUrl = '';
  return {
    name: 'codearena-security-headers',
    configResolved(config) {
      supabaseUrl = config.env.VITE_SUPABASE_URL ?? '';
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '_headers', source: cloudflareHeadersFile(supabaseUrl) });
    },
    configurePreviewServer(server) {
      const headers = securityHeaders(supabaseUrl);
      server.middlewares.use((_req, res, next) => {
        for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
        next();
      });
    },
  };
}

/**
 * The test sandbox runtime (React dev build + harness + React Native fakes) is bundled separately
 * as one classic script and loaded by the runner into a Web Worker. `virtual:sandbox-runtime`
 * exports its URL: a content-hashed asset in builds, a live-rebuilt endpoint in dev.
 */
function sandboxRuntime(): Plugin {
  const VIRTUAL = 'virtual:sandbox-runtime';
  const RESOLVED = `\0${VIRTUAL}`;
  const DEV_URL = '/@codearena/sandbox-runtime.js';
  let isBuild = false;
  return {
    name: 'codearena-sandbox-runtime',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    resolveId: (id) => (id === VIRTUAL ? RESOLVED : null),
    async load(id) {
      if (id !== RESOLVED) return null;
      if (!isBuild) return `export default ${JSON.stringify(DEV_URL)};`;
      const source = await bundleSandboxRuntime();
      const fileName = `assets/sandbox-runtime-${createHash('sha256').update(source).digest('hex').slice(0, 10)}.js`;
      this.emitFile({ type: 'asset', fileName, source });
      return `export default ${JSON.stringify(`/${fileName}`)};`;
    },
    configureServer(server) {
      server.middlewares.use(DEV_URL, (_req, res) => {
        bundleSandboxRuntime({ minify: false })
          .then((code) => {
            res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(code);
          })
          .catch((err: Error) => {
            res.statusCode = 500;
            res.end(String(err.message));
          });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    platformIdentity(),
    productionGuards(),
    securityHeadersPlugin(),
    sandboxRuntime(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 5173, strictPort: true },
  // Pre-bundle heavy deps so the dev server doesn't reload the page when the workspace first opens.
  optimizeDeps: { include: ['monaco-editor', 'fflate', 'react-resizable-panels', 'idb-keyval'] },
  preview: { port: 4173, strictPort: true },
  // Editor workers are started as module workers (same format in dev and in the build).
  worker: { format: 'es' },
  build: {
    target: 'es2023',
    sourcemap: false,
    // Monaco and MediaPipe are large by nature; they are lazy-loaded on the workspace route.
    chunkSizeWarningLimit: 4000,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
      {
        test: {
          name: 'questions',
          environment: 'node',
          include: ['scripts/tests/**/*.test.ts'],
          testTimeout: 60_000,
        },
      },
      {
        test: {
          name: 'db',
          environment: 'node',
          include: ['supabase/tests/**/*.test.ts'],
          // PGlite boots a full Postgres in WASM; give the first boot room on slow CI runners.
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
