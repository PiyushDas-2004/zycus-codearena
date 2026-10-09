import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vitest/config';
import { appConfig } from './src/config/app.config.ts';
import { cloudflareHeadersFile, securityHeaders } from './src/config/securityHeaders.ts';

/** Injects the platform name/subtitle from src/config/app.config.ts so it is defined in one place. */
function platformIdentity(): Plugin {
  return {
    name: 'codearena-platform-identity',
    transformIndexHtml(html) {
      return html
        .replaceAll('__PLATFORM_NAME__', appConfig.platformName)
        .replaceAll('__PLATFORM_SUBTITLE__', appConfig.subtitle)
        .replaceAll('__FAVICON__', appConfig.brand.favicon);
    },
  };
}

/**
 * Deployable builds (dist/) must use a real Supabase project, never the in-browser mock. A mock
 * build is allowed only into another folder, for local end-to-end tests (`npm run preview:mock`).
 */
function productionGuards(): Plugin {
  return {
    name: 'codearena-production-guards',
    configResolved(config) {
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

export default defineConfig({
  plugins: [react(), tailwindcss(), platformIdentity(), productionGuards(), securityHeadersPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, strictPort: true },
  // Pre-bundle heavy deps so the dev server doesn't reload the page when the workspace first opens.
  optimizeDeps: { include: ['monaco-editor', 'fflate', 'react-resizable-panels', 'idb-keyval'] },
  preview: { port: 4173, strictPort: true },
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
