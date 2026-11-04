/**
 * A small Jest-compatible test harness for the in-browser sandbox: describe/it/test with hooks,
 * expect() with the common matchers, jest.fn/spyOn and modern fake timers. Deliberately the subset
 * that debugging questions need, with Jest's semantics and readable failure messages.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TestResult {
  file: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  durationMs: number;
  logs: string[];
}

type Fn = () => unknown;

interface Suite {
  name: string;
  parent: Suite | null;
  children: (Suite | TestCase)[];
  beforeAll: Fn[];
  afterAll: Fn[];
  beforeEach: Fn[];
  afterEach: Fn[];
  skip: boolean;
  only: boolean;
}

interface TestCase {
  kind: 'test';
  name: string;
  fn: Fn;
  timeout: number;
  skip: boolean;
  only: boolean;
  parent: Suite;
}

const isTest = (x: Suite | TestCase): x is TestCase => (x as TestCase).kind === 'test';

// ── Formatting ────────────────────────────────────────────────────────────
export function format(value: unknown, depth = 0, seen = new WeakSet<object>()): string {
  if (typeof value === 'string') return depth === 0 ? JSON.stringify(value) : JSON.stringify(value);
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'function') return `[Function ${(value as { name?: string }).name || 'anonymous'}]`;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[Circular]';
  if (depth > 4) return Array.isArray(value) ? '[Array]' : '[Object]';
  seen.add(value);
  if (value instanceof Date) return `Date(${isNaN(value.getTime()) ? 'Invalid' : value.toISOString()})`;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Map)
    return `Map {${[...value].map(([k, v]) => `${format(k, depth + 1, seen)} => ${format(v, depth + 1, seen)}`).join(', ')}}`;
  if (value instanceof Set) return `Set {${[...value].map((v) => format(v, depth + 1, seen)).join(', ')}}`;
  if (Array.isArray(value)) {
    const items = value.slice(0, 20).map((v) => format(v, depth + 1, seen));
    if (value.length > 20) items.push(`… ${value.length - 20} more`);
    return `[${items.join(', ')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  const shown = entries.slice(0, 20).map(([k, v]) => `${k}: ${format(v, depth + 1, seen)}`);
  if (entries.length > 20) shown.push(`… ${entries.length - 20} more`);
  return `{${shown.join(', ')}}`;
}

// ── Equality (Jest's toEqual / toStrictEqual semantics) ───────────────────
export function equals(a: unknown, b: unknown, strict = false, seen = new Map<object, object>()): boolean {
  if (isAsymmetric(b)) return b.asymmetricMatch(a);
  if (isAsymmetric(a)) return a.asymmetricMatch(b);
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (seen.get(a) === b) return true;
  seen.set(a, b);
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (a instanceof RegExp || b instanceof RegExp) return String(a) === String(b);
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
    for (const [k, v] of a) if (!b.has(k) || !equals(v, b.get(k), strict, seen)) return false;
    return true;
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
    for (const v of a) if (![...b].some((w) => equals(v, w, strict, seen))) return false;
    return true;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (strict && i in a !== i in b) return false;
      if (!equals(a[i], b[i], strict, seen)) return false;
    }
    return true;
  }
  const ka = Object.keys(a).filter((k) => strict || (a as any)[k] !== undefined);
  const kb = Object.keys(b).filter((k) => strict || (b as any)[k] !== undefined);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k) && !(!strict && (b as any)[k] === undefined))
      return false;
    if (!equals((a as any)[k], (b as any)[k], strict, seen)) return false;
  }
  return true;
}

interface Asymmetric {
  asymmetricMatch(other: unknown): boolean;
  toString(): string;
}
const isAsymmetric = (x: unknown): x is Asymmetric =>
  !!x && typeof x === 'object' && typeof (x as Asymmetric).asymmetricMatch === 'function';

function subsetEquals(object: unknown, subset: unknown): boolean {
  if (isAsymmetric(subset)) return subset.asymmetricMatch(object);
  if (typeof subset !== 'object' || subset === null) return equals(object, subset);
  if (typeof object !== 'object' || object === null) return false;
  if (Array.isArray(subset)) {
    return (
      Array.isArray(object) &&
      object.length === subset.length &&
      subset.every((s, i) => subsetEquals(object[i], s))
    );
  }
  return Object.entries(subset).every(
    ([k, v]) => k in (object as object) && subsetEquals((object as any)[k], v),
  );
}

// ── Mock functions ────────────────────────────────────────────────────────
export interface MockFn {
  (...args: any[]): any;
  _isMockFunction: true;
  mock: { calls: any[][]; results: { type: 'return' | 'throw'; value: any }[]; instances: any[] };
  mockImplementation(fn: (...args: any[]) => any): MockFn;
  mockImplementationOnce(fn: (...args: any[]) => any): MockFn;
  mockReturnValue(v: any): MockFn;
  mockReturnValueOnce(v: any): MockFn;
  mockResolvedValue(v: any): MockFn;
  mockResolvedValueOnce(v: any): MockFn;
  mockRejectedValue(v: any): MockFn;
  mockRejectedValueOnce(v: any): MockFn;
  mockClear(): MockFn;
  mockReset(): MockFn;
  mockRestore(): void;
  getMockName(): string;
  mockName(name: string): MockFn;
}

const allMocks = new Set<MockFn>();

export function fn(impl?: (...args: any[]) => any): MockFn {
  let implementation = impl;
  let once: ((...args: any[]) => any)[] = [];
  let name = 'jest.fn()';
  let restore: (() => void) | null = null;
  const mock = function (this: unknown, ...args: any[]) {
    m.mock.calls.push(args);
    m.mock.instances.push(this);
    const f = once.length ? once.shift() : implementation;
    try {
      const value = f ? f.apply(this, args) : undefined;
      m.mock.results.push({ type: 'return', value });
      return value;
    } catch (err) {
      m.mock.results.push({ type: 'throw', value: err });
      throw err;
    }
  } as unknown as MockFn;
  const m = mock;
  m._isMockFunction = true;
  m.mock = { calls: [], results: [], instances: [] };
  m.mockImplementation = (f) => ((implementation = f), m);
  m.mockImplementationOnce = (f) => (once.push(f), m);
  m.mockReturnValue = (v) => m.mockImplementation(() => v);
  m.mockReturnValueOnce = (v) => m.mockImplementationOnce(() => v);
  m.mockResolvedValue = (v) => m.mockImplementation(() => Promise.resolve(v));
  m.mockResolvedValueOnce = (v) => m.mockImplementationOnce(() => Promise.resolve(v));
  m.mockRejectedValue = (v) => m.mockImplementation(() => Promise.reject(v));
  m.mockRejectedValueOnce = (v) => m.mockImplementationOnce(() => Promise.reject(v));
  m.mockClear = () => ((m.mock = { calls: [], results: [], instances: [] }), m);
  m.mockReset = () => (m.mockClear(), (implementation = undefined), (once = []), m);
  m.mockRestore = () => {
    m.mockReset();
    restore?.();
  };
  m.getMockName = () => name;
  m.mockName = (n) => ((name = n), m);
  (m as any)._setRestore = (r: () => void) => (restore = r);
  allMocks.add(m);
  return m;
}

const isMock = (x: unknown): x is MockFn => typeof x === 'function' && (x as MockFn)._isMockFunction === true;

function spyOn(object: any, method: string): MockFn {
  const original = object[method];
  if (typeof original !== 'function') throw new Error(`Cannot spy on ${method}: it is not a function`);
  const spy = fn(function (this: unknown, ...args: any[]) {
    return original.apply(this, args);
  });
  (spy as any)._setRestore(() => {
    object[method] = original;
  });
  object[method] = spy;
  return spy;
}

// ── Fake timers (modern: setTimeout/setInterval/Date) ────────────────────
interface Timer {
  id: number;
  at: number;
  fn: (...a: any[]) => void;
  args: any[];
  interval: number | null;
}

const real = {
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  setInterval: globalThis.setInterval.bind(globalThis),
  clearInterval: globalThis.clearInterval.bind(globalThis),
  Date: globalThis.Date,
};
export const realTimers = real;

class FakeClock {
  /** The timer clock (advanced by advanceTimersByTime / runAllTimers). */
  now = 0;
  /** Date.now() = now + dateOffset. setSystemTime moves Date without firing timers, like Jest. */
  dateOffset = 0;
  private timers = new Map<number, Timer>();
  private nextId = 1;
  installed = false;

  install(start = real.Date.now()) {
    this.now = start;
    this.dateOffset = 0;
    this.timers.clear();
    this.installed = true;
    const clock = this;
    const add = (fn: any, ms: any, args: any[], interval: boolean) => {
      const id = this.nextId++;
      const delay = Math.max(0, Number(ms) || 0);
      this.timers.set(id, {
        id,
        at: this.now + delay,
        fn,
        args,
        interval: interval ? Math.max(1, delay) : null,
      });
      return id;
    };
    (globalThis as any).setTimeout = (f: any, ms?: any, ...args: any[]) => add(f, ms, args, false);
    (globalThis as any).setInterval = (f: any, ms?: any, ...args: any[]) => add(f, ms, args, true);
    (globalThis as any).clearTimeout = (id: any) => this.timers.delete(id);
    (globalThis as any).clearInterval = (id: any) => this.timers.delete(id);
    class FakeDate extends real.Date {
      constructor(...args: any[]) {
        if (args.length === 0) super(clock.now + clock.dateOffset);
        else super(...(args as [any]));
      }
      static override now() {
        return clock.now + clock.dateOffset;
      }
    }
    (globalThis as any).Date = FakeDate;
  }

  uninstall() {
    if (!this.installed) return;
    this.installed = false;
    Object.assign(globalThis, {
      setTimeout: real.setTimeout,
      clearTimeout: real.clearTimeout,
      setInterval: real.setInterval,
      clearInterval: real.clearInterval,
      Date: real.Date,
    });
    this.timers.clear();
  }

  private runDue(until: number, limit = 100_000) {
    let n = 0;
    for (;;) {
      let next: Timer | undefined;
      for (const t of this.timers.values())
        if (t.at <= until && (!next || t.at < next.at || (t.at === next.at && t.id < next.id))) next = t;
      if (!next) break;
      if (++n > limit) throw new Error(`Aborting after running ${limit} timers (infinite timer loop?)`);
      this.now = Math.max(this.now, next.at);
      if (next.interval !== null) next.at += next.interval;
      else this.timers.delete(next.id);
      next.fn(...next.args);
    }
    this.now = Math.max(this.now, until);
  }

  advance(ms: number) {
    this.runDue(this.now + Math.max(0, ms));
  }

  runAll() {
    let guard = 0;
    while (this.timers.size) {
      if (++guard > 100_000) throw new Error('Aborting after 100000 timers (infinite timer loop?)');
      const next = Math.min(...[...this.timers.values()].map((t) => t.at));
      this.runDue(next, 1);
    }
  }

  runOnlyPending() {
    const pending = [...this.timers.values()].map((t) => t.id);
    const until = Math.max(this.now, ...[...this.timers.values()].map((t) => t.at));
    for (const id of pending) {
      const t = this.timers.get(id);
      if (!t) continue;
      this.now = Math.max(this.now, t.at);
      if (t.interval !== null) t.at += t.interval;
      else this.timers.delete(id);
      t.fn(...t.args);
    }
    this.now = Math.max(this.now, until);
  }

  count() {
    return this.timers.size;
  }
}

export const clock = new FakeClock();

// ── expect ─────────────────────────────────────────────────────────────────
class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

type Matcher = (received: any, ...expected: any[]) => { pass: boolean; message: () => string };

const callsOf = (m: unknown): any[][] => {
  if (!isMock(m))
    throw new AssertionError(`Expected a mock function (jest.fn() or jest.spyOn), received ${format(m)}`);
  return m.mock.calls;
};

const matchers: Record<string, Matcher> = {
  toBe: (r, e) => ({ pass: Object.is(r, e), message: () => `expected ${format(r)} to be ${format(e)}` }),
  toEqual: (r, e) => ({ pass: equals(r, e), message: () => `expected ${format(r)} to equal ${format(e)}` }),
  toStrictEqual: (r, e) => ({
    pass: equals(r, e, true),
    message: () => `expected ${format(r)} to strictly equal ${format(e)}`,
  }),
  toBeTruthy: (r) => ({ pass: !!r, message: () => `expected ${format(r)} to be truthy` }),
  toBeFalsy: (r) => ({ pass: !r, message: () => `expected ${format(r)} to be falsy` }),
  toBeNull: (r) => ({ pass: r === null, message: () => `expected ${format(r)} to be null` }),
  toBeUndefined: (r) => ({ pass: r === undefined, message: () => `expected ${format(r)} to be undefined` }),
  toBeDefined: (r) => ({ pass: r !== undefined, message: () => `expected value to be defined` }),
  toBeNaN: (r) => ({ pass: Number.isNaN(r), message: () => `expected ${format(r)} to be NaN` }),
  toBeInstanceOf: (r, e) => ({
    pass: r instanceof e,
    message: () => `expected ${format(r)} to be an instance of ${e?.name}`,
  }),
  toBeGreaterThan: (r, e) => ({
    pass: r > e,
    message: () => `expected ${format(r)} to be greater than ${format(e)}`,
  }),
  toBeGreaterThanOrEqual: (r, e) => ({
    pass: r >= e,
    message: () => `expected ${format(r)} to be >= ${format(e)}`,
  }),
  toBeLessThan: (r, e) => ({
    pass: r < e,
    message: () => `expected ${format(r)} to be less than ${format(e)}`,
  }),
  toBeLessThanOrEqual: (r, e) => ({
    pass: r <= e,
    message: () => `expected ${format(r)} to be <= ${format(e)}`,
  }),
  toBeCloseTo: (r, e, digits = 2) => ({
    pass: Math.abs(r - e) < 10 ** -digits / 2,
    message: () => `expected ${format(r)} to be close to ${format(e)} (${digits} digits)`,
  }),
  toContain: (r, e) => ({
    pass:
      typeof r === 'string'
        ? r.includes(e)
        : Array.isArray(r) || r instanceof Set
          ? [...r].includes(e)
          : false,
    message: () => `expected ${format(r)} to contain ${format(e)}`,
  }),
  toContainEqual: (r, e) => ({
    pass: Array.isArray(r) && r.some((x) => equals(x, e)),
    message: () => `expected ${format(r)} to contain an item equal to ${format(e)}`,
  }),
  toHaveLength: (r, e) => ({
    pass: r != null && r.length === e,
    message: () => `expected length ${e}, received length ${r?.length} (${format(r)})`,
  }),
  toHaveProperty: (r, path, ...rest) => {
    const keys = Array.isArray(path) ? path : String(path).split('.');
    let cur = r;
    for (const k of keys) {
      if (cur == null || !(k in Object(cur)))
        return { pass: false, message: () => `expected ${format(r)} to have property ${String(path)}` };
      cur = cur[k];
    }
    const pass = rest.length ? equals(cur, rest[0]) : true;
    return {
      pass,
      message: () =>
        `expected property ${String(path)} of ${format(r)} to be ${format(rest[0])}, received ${format(cur)}`,
    };
  },
  toMatch: (r, e) => ({
    pass: typeof r === 'string' && (e instanceof RegExp ? e.test(r) : r.includes(e)),
    message: () => `expected ${format(r)} to match ${String(e)}`,
  }),
  toMatchObject: (r, e) => ({
    pass: subsetEquals(r, e),
    message: () => `expected ${format(r)} to match object ${format(e)}`,
  }),
  toThrow: (r, e) => {
    if (typeof r !== 'function')
      throw new AssertionError('toThrow() needs a function: expect(() => …).toThrow()');
    let thrown: unknown = null;
    let did = false;
    try {
      r();
    } catch (err) {
      did = true;
      thrown = err;
    }
    const msg = thrown instanceof Error ? thrown.message : String(thrown);
    const pass =
      did &&
      (e === undefined ||
        (typeof e === 'string' && msg.includes(e)) ||
        (e instanceof RegExp && e.test(msg)) ||
        (typeof e === 'function' && thrown instanceof e));
    return {
      pass,
      message: () =>
        did ? `expected the error ${format(msg)} to match ${String(e)}` : 'expected the function to throw',
    };
  },
  toHaveBeenCalled: (r) => ({
    pass: callsOf(r).length > 0,
    message: () => `expected the mock to have been called`,
  }),
  toHaveBeenCalledTimes: (r, n) => ({
    pass: callsOf(r).length === n,
    message: () => `expected the mock to be called ${n} time(s), it was called ${callsOf(r).length} time(s)`,
  }),
  toHaveBeenCalledWith: (r, ...args) => ({
    pass: callsOf(r).some((c) => equals(c, args)),
    message: () => `expected a call with ${format(args)}; calls were ${format(callsOf(r))}`,
  }),
  toHaveBeenLastCalledWith: (r, ...args) => {
    const calls = callsOf(r);
    return {
      pass: calls.length > 0 && equals(calls[calls.length - 1], args),
      message: () => `expected the last call to be ${format(args)}; calls were ${format(calls)}`,
    };
  },
  toHaveBeenNthCalledWith: (r, n, ...args) => {
    const calls = callsOf(r);
    return {
      pass: equals(calls[n - 1], args),
      message: () => `expected call #${n} to be ${format(args)}; it was ${format(calls[n - 1])}`,
    };
  },
};

matchers.toThrowError = matchers.toThrow!;
matchers.toBeCalled = matchers.toHaveBeenCalled!;
matchers.toBeCalledTimes = matchers.toHaveBeenCalledTimes!;
matchers.toBeCalledWith = matchers.toHaveBeenCalledWith!;

function makeExpect() {
  const expect = (received: unknown) => {
    const build = (negate: boolean, transform?: (r: unknown) => Promise<unknown>) => {
      const api: Record<string, unknown> = {};
      for (const [name, m] of Object.entries(matchers)) {
        api[name] = (...args: unknown[]) => {
          const check = (value: unknown) => {
            const { pass, message } = m(value, ...args);
            if (pass === negate)
              throw new AssertionError(
                `expect(received)${negate ? '.not' : ''}.${name}(): ${negate ? message().replace(/ to /, ' not to ') : message()}`,
              );
          };
          if (transform) return transform(received).then(check);
          check(received);
          return undefined;
        };
      }
      return api;
    };
    const api = build(false) as any;
    api.not = build(true);
    api.resolves = build(false, async (r) => await r);
    api.resolves.not = build(true, async (r) => await r);
    const rejected = async (r: unknown) => {
      try {
        await r;
      } catch (err) {
        return err;
      }
      throw new AssertionError('expected the promise to reject, but it resolved');
    };
    api.rejects = build(false, rejected);
    api.rejects.not = build(true, rejected);
    // rejects.toThrow(msg) checks the rejection reason.
    api.rejects.toThrow = async (e?: unknown) => {
      const err = await rejected(received);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        e !== undefined &&
        !((typeof e === 'string' && msg.includes(e)) || (e instanceof RegExp && e.test(msg)))
      ) {
        throw new AssertionError(`expected the rejection ${format(msg)} to match ${String(e)}`);
      }
    };
    return api;
  };
  expect.any = (ctor: any): Asymmetric => ({
    asymmetricMatch: (o) =>
      ctor === Number
        ? typeof o === 'number'
        : ctor === String
          ? typeof o === 'string'
          : ctor === Boolean
            ? typeof o === 'boolean'
            : ctor === Function
              ? typeof o === 'function'
              : o instanceof ctor,
    toString: () => `Any<${ctor?.name}>`,
  });
  expect.anything = (): Asymmetric => ({ asymmetricMatch: (o) => o != null, toString: () => 'Anything' });
  expect.stringContaining = (s: string): Asymmetric => ({
    asymmetricMatch: (o) => typeof o === 'string' && o.includes(s),
    toString: () => `StringContaining ${format(s)}`,
  });
  expect.stringMatching = (re: RegExp | string): Asymmetric => ({
    asymmetricMatch: (o) => typeof o === 'string' && new RegExp(re).test(o),
    toString: () => `StringMatching ${String(re)}`,
  });
  expect.objectContaining = (obj: object): Asymmetric => ({
    asymmetricMatch: (o) => subsetEquals(o, obj),
    toString: () => `ObjectContaining ${format(obj)}`,
  });
  expect.arrayContaining = (arr: unknown[]): Asymmetric => ({
    asymmetricMatch: (o) => Array.isArray(o) && arr.every((x) => o.some((y) => equals(y, x))),
    toString: () => `ArrayContaining ${format(arr)}`,
  });
  expect.assertions = () => undefined;
  expect.hasAssertions = () => undefined;
  return expect;
}

// ── Registration and running ──────────────────────────────────────────────
export function createHarness(hooks: { afterEachTest: () => void | Promise<void> }) {
  let root: Suite;
  let current: Suite;
  const newSuite = (name: string, parent: Suite | null, skip = false, only = false): Suite => ({
    name,
    parent,
    children: [],
    beforeAll: [],
    afterAll: [],
    beforeEach: [],
    afterEach: [],
    skip,
    only,
  });
  const reset = () => {
    root = newSuite('', null);
    current = root;
  };
  reset();

  const describeImpl = (skip: boolean, only: boolean) => (name: string, body: () => void) => {
    const s = newSuite(name, current, skip, only);
    current.children.push(s);
    const prev = current;
    current = s;
    try {
      body();
    } finally {
      current = prev;
    }
  };
  const itImpl =
    (skip: boolean, only: boolean) =>
    (name: string, body: Fn, timeout = 5000) => {
      current.children.push({ kind: 'test', name, fn: body, timeout, skip, only, parent: current });
    };
  const describe = Object.assign(describeImpl(false, false), {
    skip: describeImpl(true, false),
    only: describeImpl(false, true),
  });
  const it = Object.assign(itImpl(false, false), {
    skip: itImpl(true, false),
    only: itImpl(false, true),
    todo: (name: string) => itImpl(true, false)(name, () => undefined),
  });

  const jest = {
    fn,
    spyOn,
    clearAllMocks: () => allMocks.forEach((m) => m.mockClear()),
    resetAllMocks: () => allMocks.forEach((m) => m.mockReset()),
    restoreAllMocks: () => allMocks.forEach((m) => m.mockRestore()),
    isMockFunction: isMock,
    useFakeTimers: () => {
      clock.uninstall();
      clock.install();
      return jest;
    },
    useRealTimers: () => {
      clock.uninstall();
      return jest;
    },
    advanceTimersByTime: (ms: number) => clock.advance(ms),
    advanceTimersByTimeAsync: async (ms: number) => {
      clock.advance(ms);
      for (let i = 0; i < 10; i++) await Promise.resolve();
    },
    runAllTimers: () => clock.runAll(),
    runOnlyPendingTimers: () => clock.runOnlyPending(),
    getTimerCount: () => clock.count(),
    setSystemTime: (t: number | Date) => {
      clock.dateOffset = (typeof t === 'number' ? t : t.getTime()) - clock.now;
    },
    now: () => (clock.installed ? clock.now + clock.dateOffset : real.Date.now()),
  };

  const globals = {
    describe,
    it,
    test: it,
    expect: makeExpect(),
    jest,
    beforeAll: (f: Fn) => current.beforeAll.push(f),
    afterAll: (f: Fn) => current.afterAll.push(f),
    beforeEach: (f: Fn) => current.beforeEach.push(f),
    afterEach: (f: Fn) => current.afterEach.push(f),
  };

  const withTimeout = (p: unknown, ms: number, what: string) =>
    Promise.race([
      Promise.resolve(p),
      new Promise((_, reject) =>
        real.setTimeout(() => reject(new Error(`${what} timed out after ${ms} ms`)), ms),
      ),
    ]);

  const chain = (s: Suite): Suite[] => (s.parent ? [...chain(s.parent), s] : [s]);
  const fullName = (t: TestCase) =>
    [
      ...chain(t.parent)
        .map((s) => s.name)
        .filter(Boolean),
      t.name,
    ].join(' › ');

  async function runFile(file: string, logs: { take: () => string[] }): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const anyOnly = (s: Suite): boolean =>
      s.only || s.children.some((c) => (isTest(c) ? c.only : anyOnly(c)));
    const focus = anyOnly(root);
    const runSuite = async (s: Suite, skipped: boolean, focused: boolean) => {
      const skipAll = skipped || s.skip;
      const inFocus = focused || s.only;
      let hookFailure: string | null = null;
      if (!skipAll) {
        for (const h of s.beforeAll) {
          try {
            await withTimeout(h(), 5000, 'beforeAll');
          } catch (err) {
            hookFailure = `beforeAll failed: ${errorText(err)}`;
          }
        }
      }
      for (const c of s.children) {
        if (!isTest(c)) {
          await runSuite(c, skipAll, inFocus);
          continue;
        }
        const name = fullName(c);
        if (skipAll || c.skip || (focus && !inFocus && !c.only)) {
          results.push({ file, name, status: 'skipped', durationMs: 0, logs: [] });
          continue;
        }
        const start = real.Date.now();
        let error: string | null = hookFailure;
        if (!error) {
          const suites = chain(c.parent);
          try {
            for (const ss of suites)
              for (const h of ss.beforeEach) await withTimeout(h(), c.timeout, 'beforeEach');
            await withTimeout(c.fn(), c.timeout, 'Test');
          } catch (err) {
            error = errorText(err);
          }
          for (const ss of [...suites].reverse()) {
            for (const h of ss.afterEach) {
              try {
                await withTimeout(h(), c.timeout, 'afterEach');
              } catch (err) {
                error ??= `afterEach failed: ${errorText(err)}`;
              }
            }
          }
        }
        try {
          await hooks.afterEachTest();
        } catch (err) {
          error ??= `cleanup failed: ${errorText(err)}`;
        }
        clock.uninstall();
        results.push({
          file,
          name,
          status: error ? 'failed' : 'passed',
          error: error ?? undefined,
          durationMs: real.Date.now() - start,
          logs: logs.take(),
        });
      }
      if (!skipAll) for (const h of s.afterAll) await Promise.resolve(h()).catch(() => undefined);
    };
    await runSuite(root, false, false);
    return results;
  }

  return { globals, reset, runFile };
}

export function errorText(err: unknown): string {
  if (err instanceof Error) {
    const stack = (err.stack ?? '')
      .split('\n')
      .filter((l) => /\((?:q\d+|src|__tests__)\//.test(l) || /^\s+at .*\/(src|__tests__)\//.test(l))
      .slice(0, 3)
      .join('\n');
    return `${err.name === 'Error' || err.name === 'AssertionError' ? '' : `${err.name}: `}${err.message}${stack ? `\n${stack}` : ''}`;
  }
  return format(err);
}
