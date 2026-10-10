/**
 * Test sandbox runtime. vite.config.ts bundles this file (with the DEVELOPMENT builds of React —
 * act() only exists there) into one classic script. The runner then starts a dedicated Web Worker
 * from a Blob made of: this runtime + one `__sandbox.define(path, factory)` per candidate module
 * (compiled to CommonJS by the editor's TypeScript service) + `__sandbox.run(testFiles)`.
 * No eval: the candidate's code is part of the worker's own script, which the CSP allows
 * (worker-src blob:). The worker has no DOM and no session token, and is terminated on timeout.
 */
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as TestRenderer from 'react-test-renderer';
import { createHarness, errorText, format, type TestResult } from './harness';
import * as RN from './reactNativeShim';
import * as testUtils from './testUtils';

/* eslint-disable @typescript-eslint/no-explicit-any */

const g = globalThis as any;
g.IS_REACT_ACT_ENVIRONMENT = true;
// React Native's test environment: synchronous (legacy) roots and no deprecation warning.
g.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
g.__DEV__ = true;

// ── Console capture ───────────────────────────────────────────────────────
let logs: string[] = [];
const MAX_LOGS = 200;
const capture =
  (level: string) =>
  (...args: unknown[]) => {
    const text = args.map((a) => (typeof a === 'string' ? a : format(a))).join(' ');
    // React's %s-style warnings: substitute the arguments.
    let i = 1;
    const message =
      typeof args[0] === 'string' && args[0].includes('%s')
        ? args[0].replace(/%s/g, () => String(args[i++] ?? ''))
        : text;
    if (level === 'error') testUtils.recordConsoleError(message);
    if (logs.length < MAX_LOGS) logs.push(`${level === 'log' ? '' : `[${level}] `}${message.slice(0, 500)}`);
  };
g.console = {
  ...console,
  log: capture('log'),
  info: capture('info'),
  debug: capture('debug'),
  warn: capture('warn'),
  error: capture('error'),
};

// ── Modules ────────────────────────────────────────────────────────────────
type Factory = (require: (id: string) => unknown, module: { exports: any }, exports: any) => void;
const factories = new Map<string, Factory>();
let cache = new Map<string, { exports: any }>();

const esm = (ns: Record<string, unknown>, def?: unknown) => ({ __esModule: true, default: def ?? ns, ...ns });
const builtins: Record<string, unknown> = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  'react/jsx-dev-runtime': jsxRuntime,
  'react-test-renderer': TestRenderer,
  'react-native': esm(RN as unknown as Record<string, unknown>),
  '@react-native-async-storage/async-storage': esm({ default: RN.AsyncStorage }, RN.AsyncStorage),
  '@react-navigation/native': esm({
    useFocusEffect: RN.useFocusEffect,
    useIsFocused: RN.useIsFocused,
    useNavigation: RN.useNavigation,
    useRoute: RN.useRoute,
  }),
  '@codearena/test-utils': esm(testUtils as unknown as Record<string, unknown>),
};

const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.json', '/index.ts', '/index.tsx', '/index.js'];

function normalize(path: string): string {
  const out: string[] = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

function resolve(from: string, id: string): string | null {
  if (!id.startsWith('.') && !id.startsWith('/')) return null;
  const dir = from.includes('/') ? from.slice(0, from.lastIndexOf('/')) : '';
  const base = normalize(id.startsWith('/') ? id : `${dir}/${id}`);
  for (const ext of EXTENSIONS) if (factories.has(base + ext)) return base + ext;
  return null;
}

function requireFrom(from: string) {
  return (id: string): unknown => {
    if (Object.prototype.hasOwnProperty.call(builtins, id)) return builtins[id];
    const path = resolve(from, id);
    if (!path) {
      throw new Error(
        id.startsWith('.')
          ? `Cannot find module '${id}' from '${from}'`
          : `Module '${id}' is not available in the test sandbox`,
      );
    }
    return load(path);
  };
}

function load(path: string): unknown {
  const cached = cache.get(path);
  if (cached) return cached.exports;
  const module = { exports: {} as any };
  cache.set(path, module);
  try {
    factories.get(path)!(requireFrom(path), module, module.exports);
  } catch (err) {
    cache.delete(path);
    throw err;
  }
  return module.exports;
}

// ── Running ────────────────────────────────────────────────────────────────
const harness = createHarness({
  async afterEachTest() {
    testUtils.cleanup();
    RN.resetNativeFakes();
  },
});

export interface RunOptions {
  testFiles: string[];
}

async function run({ testFiles }: RunOptions) {
  const results: TestResult[] = [];
  let setupError: string | null = null;
  for (const file of testFiles) {
    cache = new Map(); // a fresh module registry per test file, like Jest
    harness.reset();
    Object.assign(g, harness.globals);
    logs = [];
    try {
      load(file);
    } catch (err) {
      results.push({
        file,
        name: `${file} could not be loaded`,
        status: 'failed',
        error: errorText(err),
        durationMs: 0,
        logs: logs.splice(0),
      });
      continue;
    }
    try {
      results.push(...(await harness.runFile(file, { take: () => logs.splice(0) })));
    } catch (err) {
      setupError = errorText(err);
    }
  }
  return { results, setupError };
}

g.__sandbox = {
  define(path: string, factory: Factory) {
    factories.set(path, factory);
  },
  defineJson(path: string, json: string) {
    factories.set(path, (_r, module) => {
      module.exports = JSON.parse(json);
    });
  },
  async run(options: RunOptions) {
    const post = (msg: unknown) => (g.postMessage ? g.postMessage(msg) : g.__sandboxResult?.(msg));
    try {
      post({ type: 'done', ...(await run(options)) });
    } catch (err) {
      post({ type: 'crash', error: errorText(err) });
    }
  },
};
