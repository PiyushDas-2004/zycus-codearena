/**
 * `@codearena/test-utils`: a small Testing-Library-style API over react-test-renderer for the
 * sandbox — render/screen queries by testID and text, fireEvent, waitFor, renderHook, act — plus
 * controls for the native fakes (AppState, AsyncStorage, navigation focus) and captured warnings.
 */
import * as React from 'react';
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { clock, format, realTimers } from './harness';
import { alertControl, appStateControl, asyncStorageControl, navigationControl } from './reactNativeShim';

/* eslint-disable @typescript-eslint/no-explicit-any */

const mounted = new Set<ReactTestRenderer>();
const consoleErrors: string[] = [];
export const recordConsoleError = (message: string) => consoleErrors.push(message);

const isHost = (n: ReactTestInstance) => typeof n.type === 'string';
const idOf = (n: ReactTestInstance) => n.props.testID ?? n.props['data-testid'];

/** Text directly inside a host element (strings and numbers among its children). */
function ownText(n: ReactTestInstance): string {
  return n.children
    .map((c) => (typeof c === 'string' ? c : ''))
    .join('')
    .trim();
}
/** All text inside an element. */
export function textContent(n: ReactTestInstance | string): string {
  if (typeof n === 'string') return n;
  return n.children.map((c) => textContent(c as ReactTestInstance | string)).join('');
}

type TextMatch = string | RegExp;
const matches = (text: string, m: TextMatch) => (m instanceof RegExp ? m.test(text) : text === m);

function queries(getRoot: () => ReactTestInstance) {
  const allByTestId = (id: string) => getRoot().findAll((n) => isHost(n) && idOf(n) === id);
  const allByText = (m: TextMatch) =>
    getRoot().findAll((n) => isHost(n) && ownText(n) !== '' && matches(ownText(n), m));
  const one = (found: ReactTestInstance[], what: string) => {
    if (found.length === 0) throw new Error(`Unable to find an element with ${what}`);
    if (found.length > 1)
      throw new Error(`Found ${found.length} elements with ${what}; use getAllBy… instead`);
    return found[0]!;
  };
  const q = {
    getByTestId: (id: string) => one(allByTestId(id), `testID ${format(id)}`),
    getAllByTestId: (id: string) => {
      const f = allByTestId(id);
      if (!f.length) throw new Error(`Unable to find an element with testID ${format(id)}`);
      return f;
    },
    queryByTestId: (id: string) => allByTestId(id)[0] ?? null,
    queryAllByTestId: allByTestId,
    getByText: (m: TextMatch) => one(allByText(m), `text ${String(m)}`),
    getAllByText: (m: TextMatch) => {
      const f = allByText(m);
      if (!f.length) throw new Error(`Unable to find an element with text ${String(m)}`);
      return f;
    },
    queryByText: (m: TextMatch) => allByText(m)[0] ?? null,
    queryAllByText: allByText,
    findByTestId: (id: string, o?: WaitForOptions) => waitFor(() => q.getByTestId(id), o),
    findByText: (m: TextMatch, o?: WaitForOptions) => waitFor(() => q.getByText(m), o),
  };
  return q;
}

export interface RenderResult extends ReturnType<typeof queries> {
  root: ReactTestInstance;
  rerender(ui: React.ReactElement): void;
  unmount(): void;
  toJSON(): unknown;
  debug(): void;
}

let last: RenderResult | null = null;

export function render(
  ui: React.ReactElement,
  options: { wrapper?: React.ComponentType<{ children: React.ReactNode }> } = {},
): RenderResult {
  const wrap = (el: React.ReactElement) =>
    options.wrapper ? React.createElement(options.wrapper, null, el) : el;
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(wrap(ui));
  });
  mounted.add(renderer);
  const result: RenderResult = {
    ...queries(() => renderer.root),
    get root() {
      return renderer.root;
    },
    rerender: (next) => act(() => renderer.update(wrap(next))),
    unmount: () => {
      act(() => renderer.unmount());
      mounted.delete(renderer);
    },
    toJSON: () => renderer.toJSON(),
    debug: () => console.log(JSON.stringify(renderer.toJSON(), null, 2)),
  };
  last = result;
  return result;
}

/** Queries against the most recent render(). */
export const screen = new Proxy({} as RenderResult, {
  get(_t, key) {
    if (!last) throw new Error('screen: call render() first');
    return (last as any)[key];
  },
});

export function renderHook<Result, Props = undefined>(
  callback: (props: Props) => Result,
  options: { initialProps?: Props; wrapper?: React.ComponentType<{ children: React.ReactNode }> } = {},
) {
  const result = { current: undefined as unknown as Result };
  function Probe({ hookProps }: { hookProps: Props }) {
    result.current = callback(hookProps);
    return null;
  }
  const r = render(React.createElement(Probe, { hookProps: options.initialProps as Props }), {
    wrapper: options.wrapper,
  });
  return {
    result,
    rerender: (props?: Props) => r.rerender(React.createElement(Probe, { hookProps: props as Props })),
    unmount: r.unmount,
  };
}

// ── Events ─────────────────────────────────────────────────────────────────
const isDisabled = (n: ReactTestInstance | null): boolean => {
  for (let cur = n; cur; cur = cur.parent) {
    if (cur.props?.disabled === true || cur.props?.accessibilityState?.disabled === true) return true;
  }
  return false;
};

function handlerFor(el: ReactTestInstance, prop: string) {
  for (let cur: ReactTestInstance | null = el; cur; cur = cur.parent) {
    if (typeof cur.props?.[prop] === 'function') return cur.props[prop] as (...a: any[]) => unknown;
  }
  return null;
}

function fire(el: ReactTestInstance, event: string, ...args: any[]) {
  const prop = `on${event[0]!.toUpperCase()}${event.slice(1)}`;
  if ((event === 'press' || event === 'click') && isDisabled(el)) return undefined;
  const handler = handlerFor(el, prop);
  if (!handler) throw new Error(`No ${prop} handler on this element or its parents`);
  let value: unknown;
  act(() => {
    value = handler(...args);
  });
  return value;
}

const syntheticEvent = (el: ReactTestInstance, extra: Record<string, unknown> = {}) => ({
  preventDefault() {},
  stopPropagation() {},
  persist() {},
  target: { ...el.props, ...((extra.target as object) ?? {}) },
  currentTarget: el.props,
  nativeEvent: {},
  ...extra,
});

export const fireEvent = Object.assign(fire, {
  press: (el: ReactTestInstance) => fire(el, 'press', { nativeEvent: {} }),
  changeText: (el: ReactTestInstance, text: string) => fire(el, 'changeText', text),
  scroll: (el: ReactTestInstance, payload: unknown) => fire(el, 'scroll', payload),
  click: (el: ReactTestInstance) => fire(el, 'click', syntheticEvent(el)),
  change: (el: ReactTestInstance, init: { target: Record<string, unknown> }) =>
    fire(el, 'change', syntheticEvent(el, init)),
  submit: (el: ReactTestInstance) => fire(el, 'submit', syntheticEvent(el)),
  keyDown: (el: ReactTestInstance, init: Record<string, unknown>) =>
    fire(el, 'keyDown', syntheticEvent(el, init)),
});

// ── Async helpers ──────────────────────────────────────────────────────────
export interface WaitForOptions {
  timeout?: number;
  interval?: number;
}

/** Retries `expectation` until it stops throwing. With fake timers, advances them between tries. */
export async function waitFor<T>(
  expectation: () => T,
  { timeout = 1000, interval = 50 }: WaitForOptions = {},
): Promise<T> {
  const started = realTimers.Date.now();
  let lastError: unknown;
  let elapsedFake = 0;
  for (;;) {
    try {
      return expectation();
    } catch (err) {
      lastError = err;
    }
    if (clock.installed) {
      if (elapsedFake >= timeout) break;
      await act(async () => {
        clock.advance(interval);
      });
      elapsedFake += interval;
    } else {
      if (realTimers.Date.now() - started >= timeout) break;
      await act(async () => {
        await new Promise((r) => realTimers.setTimeout(r, interval));
      });
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`waitFor timed out: ${format(lastError)}`);
}

/** Lets pending promise callbacks run (inside act, so React state updates are applied). */
export async function flushPromises(rounds = 5) {
  await act(async () => {
    for (let i = 0; i < rounds; i++) await Promise.resolve();
  });
}

/** A promise the test resolves or rejects by hand, to control response order. */
export function deferred<T = unknown>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ── Native fakes and warnings ─────────────────────────────────────────────
export const appState = {
  set: (next: 'active' | 'background' | 'inactive') => act(() => appStateControl.set(next)),
  listenerCount: appStateControl.listenerCount,
};
export const asyncStorage = asyncStorageControl;
export const navigation = {
  focus: () => act(() => navigationControl.focus()),
  blur: () => act(() => navigationControl.blur()),
};
export const alerts = alertControl.calls;
/** console.error messages logged during the current test (e.g. React's duplicate-key warning). */
export const getConsoleErrors = () => [...consoleErrors];

export { act };

export function cleanup() {
  for (const r of [...mounted]) {
    try {
      act(() => r.unmount());
    } catch {
      /* already unmounted */
    }
  }
  mounted.clear();
  last = null;
  consoleErrors.length = 0;
}
