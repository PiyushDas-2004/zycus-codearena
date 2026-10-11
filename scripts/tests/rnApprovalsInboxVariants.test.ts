/**
 * rn-approvals-inbox: the read-only tests must accept every reasonable fix and reject wrong ones.
 * - Valid alternative fixes (variants of the reference solution) pass every test and type-check.
 * - Partial fixes (the starter plus the reference fix of some bugs) pass exactly the tests of the
 *   bugs they fix: every test detects its own bug and none passes on the starter by accident.
 * - Wrong fixes that only hide a symptom fail the test written for that symptom.
 * - Broken candidate code gets a clear failure or a timeout, never a hung run.
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SandboxOutcome } from '../../src/features/runner/buildScript.ts';
import { runSandboxTests, typecheckFiles, withSolution, type SourceFile } from '../lib/questionCheck.ts';
import { loadQuestion, QUESTIONS_DIR } from '../lib/questionSource.ts';

const q = loadQuestion(join(QUESTIONS_DIR, 'rn-approvals-inbox'));
const starter: SourceFile[] = q.files.map((f) => ({ path: f.path, content: f.content }));
const referenceFiles = q.reference_solution?.files ?? [];
const solution = withSolution(starter, referenceFiles);

const HTTP = 'src/api/httpClient.ts';
const SESSION = 'src/auth/sessionStore.ts';
const HOOK = 'src/hooks/useApprovals.ts';
const DECISIONS = 'src/state/approvals.ts';
const LIST = 'src/screens/ApprovalsList.tsx';

function reference(path: string): string {
  const file = referenceFiles.find((f) => f.path === path);
  if (!file) throw new Error(`the reference solution has no ${path}`);
  return file.content;
}

// ── Editing helpers ─────────────────────────────────────────────────────────
type Edit = (src: string) => string;
type Edits = Record<string, Edit>;

/** Replaces the first match of `from` (it must occur); `to` is literal text or a function of the match. */
const replace =
  (from: string | RegExp, to: string | ((match: string) => string)): Edit =>
  (src) => {
    const out = src.replace(from, (match) => (typeof to === 'string' ? to : to(match)));
    if (out === src) throw new Error(`edit not applicable, pattern not found: ${String(from)}`);
    return out;
  };
const chain =
  (...edits: Edit[]): Edit =>
  (src) =>
    edits.reduce((s, e) => e(s), src);
const whole =
  (content: string): Edit =>
  () =>
    content;

/** Applies `edits` (path → edit); every edit must change its file. */
function edit(files: SourceFile[], edits: Edits): SourceFile[] {
  for (const path of Object.keys(edits)) {
    if (!files.some((f) => f.path === path)) throw new Error(`no file ${path}`);
  }
  return files.map((f) => {
    const e = edits[f.path];
    if (!e) return f;
    const content = e(f.content);
    if (content === f.content) throw new Error(`edit changed nothing in ${f.path}`);
    return { path: f.path, content };
  });
}

async function results(files: SourceFile[]) {
  const o = await runSandboxTests(files);
  if (o.type !== 'done') throw new Error(`the run did not complete: ${JSON.stringify(o).slice(0, 2000)}`);
  expect(o.results.length).toBeGreaterThan(0);
  return o.results;
}
const failures = async (files: SourceFile[]) =>
  (await results(files)).filter((r) => r.status !== 'passed').map((r) => `${r.name}: ${r.error}`);
const statuses = async (files: SourceFile[]) =>
  Object.fromEntries((await results(files)).map((r) => [r.name, r.status]));

// ── The question's tests and the bugs they detect ───────────────────────────
const T = {
  retries: 'token refresh › retries with the new access token and stores the rotated tokens',
  refreshOnce: 'token refresh › refreshes once when several requests get 401 at the same time',
  noSecondRefresh:
    'token refresh › does not refresh again for a request that was sent before the refresh finished',
  logoutOnce: 'token refresh › logs out exactly once when the refresh token is rejected',
  firstRequest:
    'session persistence (cold start) › the first request after launch carries the saved access token',
  tokensDuringLoad:
    'session persistence (cold start) › keeps tokens that were saved while the session was still loading',
  signOut: 'session persistence (cold start) › signing out removes the saved session',
  filterChips: 'useApprovals › loads the list for each filter chip',
  slowResponse: 'useApprovals › ignores a slow response for a filter that is no longer selected',
  cancelOnUnmount: 'useApprovals › cancels the request when the screen goes away',
  loadError: 'useApprovals › shows an error when the list fails to load, and clears it on the next load',
  rollbackOnlyFailed: 'optimistic approve / reject › rolls back only the decision that failed',
  laterSuccess:
    'optimistic approve / reject › keeps a later success when an earlier request fails afterwards',
  previousStatus: 'optimistic approve / reject › a failed change returns the row to the status it had before',
  scrollToIndex: 'ApprovalsList › scrollToIndex lands on the right row (rows are separated by a 1 pt line)',
  expandedRow: 'ApprovalsList › keeps the expanded row expanded when a row above it disappears',
  rowComment: "ApprovalsList › keeps each row's comment with its own row",
} as const;

const READY_WAIT = /\n {4}\/\/ FIX: wait for the stored session[^\n]*\n {4}await o\.session\.ready;/;

/** The reference fix split into independent parts, applied to the starter in this order. */
const FIXES = {
  /** Bug 1: one shared refresh promise; a request sent before a refresh just retries. */
  refresh: { [HTTP]: whole(replace(READY_WAIT, '')(reference(HTTP))) },
  /** Bug 4 (client half): requests wait for the stored session. */
  clientReady: {
    [HTTP]: replace(
      /async function request<T>\(.*\): Promise<T> \{\n/,
      (m) => `${m}    await o.session.ready;\n`,
    ),
  },
  /** Bug 4 (store half): changes wait for hydration. */
  storeReady: { [SESSION]: whole(reference(SESSION)) },
  /** Bug 2: a new AbortController per request. */
  abort: { [HOOK]: whole(reference(HOOK)) },
  /** Bug 3: per-row rollback with an error. */
  rollback: { [DECISIONS]: whole(reference(DECISIONS)) },
  /** Bug 5 (layout): getItemLayout counts the separators. */
  layout: {
    [LIST]: replace('offset: ROW_HEIGHT * index', 'offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index'),
  },
  /** Bug 5 (expanded row): tracked by id, not by index. */
  expandedById: {
    [LIST]: chain(
      replace('useState<number | null>(null)', 'useState<string | null>(null)'),
      replace('renderItem={({ item, index }) => (', 'renderItem={({ item }) => ('),
      replace('expanded={expanded === index}', 'expanded={expanded === item.id}'),
      replace(
        'onToggle={() => setExpanded(expanded === index ? null : index)}',
        'onToggle={() => setExpanded((cur) => (cur === item.id ? null : item.id))}',
      ),
    ),
  },
  /** Bug 5 (row identity): rows keyed by id, so each row keeps its own local state. */
  keyById: {
    [LIST]: replace('keyExtractor={(_item, index) => String(index)}', 'keyExtractor={(item) => item.id}'),
  },
} satisfies Record<string, Edits>;
type Fix = keyof typeof FIXES;
const ALL_FIXES = Object.keys(FIXES) as Fix[];

/** The bugs of solution/notes.md and the parts of the fix each one needs. */
const BUGS: Record<string, Fix[]> = {
  '1 (refresh not single-flight)': ['refresh'],
  '2 (AbortController reused)': ['abort'],
  '3 (whole-list rollback)': ['rollback'],
  '4 (hydration race)': ['clientReady', 'storeReady'],
  '5 (FlatList state by index)': ['layout', 'expandedById', 'keyById'],
};

/** The fix parts each test needs in order to pass. [] = passes on the starter (a regression guard). */
const NEEDS: Record<string, Fix[]> = {
  [T.retries]: [],
  [T.refreshOnce]: ['refresh'],
  [T.noSecondRefresh]: ['refresh'],
  [T.logoutOnce]: [],
  [T.firstRequest]: ['clientReady'],
  [T.tokensDuringLoad]: ['storeReady'],
  [T.signOut]: [],
  [T.filterChips]: ['abort'],
  [T.slowResponse]: ['abort'],
  [T.cancelOnUnmount]: [],
  [T.loadError]: ['abort'],
  [T.rollbackOnlyFailed]: ['rollback'],
  [T.laterSuccess]: ['rollback'],
  [T.previousStatus]: ['rollback'],
  [T.scrollToIndex]: ['layout'],
  [T.expandedRow]: ['expandedById'],
  [T.rowComment]: ['expandedById', 'keyById'],
};

/**
 * A test that passes on the starter but fails for one combination of parts. The starter client
 * doesn't await `saveTokens` before it retries; that only worked because the starter store set the
 * tokens synchronously. Once `saveTokens` waits for hydration (store half of bug 4), the immediate
 * retry carries the old token until the client awaits `saveTokens` (bug 1 fix) or awaits `ready`
 * itself (client half of bug 4, which yields long enough). Correct behaviour, not a test flaw.
 */
const ALSO_FAILS: Record<string, { applied: Fix[]; missing: Fix[] }> = {
  [T.retries]: { applied: ['storeReady'], missing: ['refresh', 'clientReady'] },
};

function withFixes(applied: Fix[]): SourceFile[] {
  return ALL_FIXES.filter((f) => applied.includes(f)).reduce((files, f) => edit(files, FIXES[f]), starter);
}
function expectedStatuses(applied: Fix[]) {
  const passes = (name: string, needs: Fix[]) => {
    const also = ALSO_FAILS[name];
    const brokenBy =
      also &&
      also.applied.every((f) => applied.includes(f)) &&
      also.missing.every((f) => !applied.includes(f));
    return needs.every((f) => applied.includes(f)) && !brokenBy;
  };
  return Object.fromEntries(
    Object.entries(NEEDS).map(([name, needs]) => [name, passes(name, needs) ? 'passed' : 'failed']),
  );
}
const except = (excluded: Fix[]) => ALL_FIXES.filter((f) => !excluded.includes(f));

describe('rn-approvals-inbox: partial fixes pass exactly the tests of the bugs they fix', () => {
  it('the starter fails exactly the tests of the planted bugs', async () => {
    expect(await statuses(starter)).toEqual(expectedStatuses([]));
  }, 120_000);

  it('every part of the fix together passes every test', async () => {
    expect(await statuses(withFixes(ALL_FIXES))).toEqual(expectedStatuses(ALL_FIXES));
  }, 120_000);

  it.each(Object.entries(BUGS))(
    'fixing only bug %s',
    async (_bug, fixes) => {
      expect(await statuses(withFixes(fixes))).toEqual(expectedStatuses(fixes));
    },
    120_000,
  );

  it.each(Object.entries(BUGS))(
    'fixing every bug except %s',
    async (_bug, fixes) => {
      expect(await statuses(withFixes(except(fixes)))).toEqual(expectedStatuses(except(fixes)));
    },
    120_000,
  );

  it.each(ALL_FIXES)(
    'fixing only the "%s" part',
    async (fix) => {
      expect(await statuses(withFixes([fix]))).toEqual(expectedStatuses([fix]));
    },
    120_000,
  );

  it.each(ALL_FIXES)(
    'fixing every part except "%s"',
    async (fix) => {
      expect(await statuses(withFixes(except([fix])))).toEqual(expectedStatuses(except([fix])));
    },
    120_000,
  );
});

// ── Valid alternative fixes ─────────────────────────────────────────────────
const REFRESH_ONCE_BLOCK =
  / {2}\/\/ FIX: a single in-flight refresh[\s\S]*?\n {4}return refreshing;\n {2}\}\n/;
const REQUEST_UNTIL_OK_CHECK = / {2}async function request<T>[\s\S]*?(?= {4}if \(!res\.ok\))/;
const HOOK_EFFECT = / {2}useEffect\(\(\) => \{[\s\S]*?\n {2}\}, \[client, filter\]\);/;
const DECIDE_CALLBACK = / {2}const decide = useCallback\([\s\S]*?\n {4}\[api\],\n {2}\);/;

const VARIANTS: Record<string, Edits> = {
  'refresh: a queue of waiting requests settled by one refresh (interceptor style)': {
    [HTTP]: replace(
      REFRESH_ONCE_BLOCK,
      `  // Requests that got a 401 while a refresh is running wait here for its outcome.
  let waiting: { resolve: (tokens: Tokens) => void; reject: (error: unknown) => void }[] | null = null;

  function refreshOnce(refreshToken: string): Promise<Tokens> {
    return new Promise<Tokens>((resolve, reject) => {
      if (waiting) {
        waiting.push({ resolve, reject });
        return;
      }
      const queue = [{ resolve, reject }];
      waiting = queue;
      o.refresh(refreshToken)
        .then(async (fresh) => {
          await o.session.saveTokens(fresh);
          waiting = null;
          queue.forEach((w) => w.resolve(fresh));
        })
        .catch(() => {
          waiting = null;
          o.onLogout();
          const expired = new HttpError(401, 'Your session has expired. Sign in again.');
          queue.forEach((w) => w.reject(expired));
        });
    });
  }
`,
    ),
  },

  'refresh: retry through a recursive call, comparing refresh tokens': {
    [HTTP]: replace(
      REQUEST_UNTIL_OK_CHECK,
      `  async function request<T>(method: string, path: string, options: RequestOptions, retried = false): Promise<T> {
    await o.session.ready;
    const sentWith = o.session.get()?.tokens;
    const res = await send(method, path, options, sentWith?.accessToken);
    if (res.status === 401 && sentWith && !retried) {
      // Refresh only if nobody rotated the tokens since this request was sent; then retry once.
      if (o.session.get()?.tokens.refreshToken === sentWith.refreshToken) await refreshOnce(sentWith.refreshToken);
      return request<T>(method, path, options, true);
    }
`,
    ),
  },

  'refresh: each refresh token exchanged at most once (results memoised per token)': {
    [HTTP]: chain(
      replace(
        REFRESH_ONCE_BLOCK,
        `  // A refresh token works once (they rotate), so remember what each one was exchanged for.
  const exchanged = new Map<string, Promise<Tokens>>();

  function refreshOnce(refreshToken: string): Promise<Tokens> {
    let pending = exchanged.get(refreshToken);
    if (!pending) {
      pending = o.refresh(refreshToken).then(
        async (fresh) => {
          await o.session.saveTokens(fresh);
          return fresh;
        },
        () => {
          o.onLogout();
          throw new HttpError(401, 'Your session has expired. Sign in again.');
        },
      );
      exchanged.set(refreshToken, pending);
    }
    return pending;
  }
`,
      ),
      replace(
        /const current = o\.session\.get\(\)\?\.tokens;[\s\S]*?: await refreshOnce\(sentWith\.refreshToken\);/,
        'const tokens = await refreshOnce(sentWith.refreshToken);',
      ),
    ),
  },

  'abort: an ignore flag next to a fresh AbortController per request': {
    [HOOK]: replace(
      HOOK_EFFECT,
      `  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    client
      .get<Approval[]>('/approvals?filter=' + filter, { signal: controller.signal })
      .then((data) => {
        if (ignore) return;
        setItems(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (ignore) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [client, filter]);`,
    ),
  },

  'abort: async/await with a request counter in a ref': {
    [HOOK]: chain(
      replace(
        "import { useEffect, useState } from 'react';",
        "import { useEffect, useRef, useState } from 'react';",
      ),
      replace(
        HOOK_EFFECT,
        `  const latestRequest = useRef(0);

  useEffect(() => {
    const id = ++latestRequest.current;
    const controller = new AbortController();
    const isCurrent = () => id === latestRequest.current && !controller.signal.aborted;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await client.get<Approval[]>('/approvals?filter=' + filter, { signal: controller.signal });
        if (isCurrent()) setItems(data);
      } catch (e) {
        if (isCurrent()) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (isCurrent()) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [client, filter]);`,
      ),
    ),
  },

  'rollback: previous statuses kept in a ref map, a fixed user-facing error message': {
    [DECISIONS]: replace(
      DECIDE_CALLBACK,
      `  // The status each row had before its decision in flight (a second tap keeps the first one).
  const before = useRef(new Map<string, Approval['status']>());

  const decide = useCallback(
    async (id: string, decision: Decision) => {
      if (!before.current.has(id)) {
        before.current.set(id, latest.current.find((a) => a.id === id)?.status ?? 'PENDING');
      }
      dispatch({ type: 'OPTIMISTIC', id, status: decision });
      try {
        await api.post('/approvals/' + id + '/' + (decision === 'APPROVED' ? 'approve' : 'reject'));
        before.current.delete(id);
      } catch {
        const status = before.current.get(id) ?? 'PENDING';
        before.current.delete(id);
        dispatch({ type: 'ROLLBACK', id, status, error: 'Could not save this decision. Try again.' });
      }
    },
    [api],
  );`,
    ),
  },

  'rollback: useState with functional per-row updates instead of the reducer': {
    [DECISIONS]: chain(
      replace(
        "import { useCallback, useReducer, useRef } from 'react';",
        "import { useCallback, useRef, useState } from 'react';",
      ),
      replace(
        /export function useApprovalDecisions[\s\S]*$/,
        `export function useApprovalDecisions(api: Pick<HttpClient, 'post'>, initial: Approval[]) {
  const [items, setItems] = useState(initial);
  const latest = useRef(items);
  latest.current = items;

  const patchRow = useCallback(
    (id: string, patch: Partial<Approval>) =>
      setItems((current) => current.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [],
  );

  const decide = useCallback(
    async (id: string, decision: Decision) => {
      const previous = latest.current.find((a) => a.id === id)?.status ?? 'PENDING';
      patchRow(id, { status: decision, error: undefined });
      try {
        await api.post('/approvals/' + id + '/' + (decision === 'APPROVED' ? 'approve' : 'reject'));
      } catch (e) {
        patchRow(id, { status: previous, error: e instanceof Error ? e.message : 'Failed' });
      }
    },
    [api, patchRow],
  );

  return { items, decide, load: (next: Approval[]) => setItems(next) };
}
`,
      ),
    ),
  },

  'hydration: changes run one after another behind hydration (a promise queue)': {
    [SESSION]: replace(
      / {2}\/\/ FIX: every change waits for hydration first[\s\S]*?(?= {4}subscribe\(listener\) \{)/,
      `  // Every change runs after hydration and after the previous change, so writes persist in order.
  let last: Promise<unknown> = ready;
  const serially = (change: () => Promise<void>): Promise<void> => {
    const run = last.then(change);
    last = run.catch(() => undefined);
    return run;
  };

  return {
    ready,
    get: () => session,
    signIn: (next) =>
      serially(async () => {
        session = next;
        emit();
        await persist();
      }),
    saveTokens: (tokens) =>
      serially(async () => {
        if (!session) return;
        session = { ...session, tokens };
        emit();
        await persist();
      }),
    signOut: () =>
      serially(async () => {
        session = null;
        emit();
        await persist();
      }),
`,
    ),
    // The client waits only while no session has been loaded yet.
    [HTTP]: replace('    await o.session.ready;\n', '    if (!o.session.get()) await o.session.ready;\n'),
  },

  'hydration: changes made while loading are replayed onto the stored session': {
    [SESSION]: replace(
      / {2}const ready = AsyncStorage[\s\S]*?(?= {4}subscribe\(listener\) \{)/,
      `  // Changes made before storage was read are replayed on top of the stored session once it is.
  let hydrated = false;
  const early: ((s: Session | null) => Session | null)[] = [];

  const ready = AsyncStorage.getItem(SESSION_KEY).then(async (raw) => {
    let stored: Session | null = null;
    try {
      stored = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      stored = null; // corrupt entry: treat as signed out
    }
    session = early.reduce((s, fn) => fn(s), stored);
    hydrated = true;
    emit();
    if (early.length) await persist();
  });

  const change = async (fn: (s: Session | null) => Session | null) => {
    if (!hydrated) {
      early.push(fn);
      return ready;
    }
    session = fn(session);
    emit();
    await persist();
  };

  return {
    ready,
    get: () => session,
    signIn: (next) => change(() => next),
    saveTokens: (tokens) => change((s) => (s ? { ...s, tokens } : s)),
    signOut: () => change(() => null),
`,
    ),
  },

  'list: expanded state kept in each row, rows keyed by a prefixed id': {
    [LIST]: chain(
      replace(
        'offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index',
        'offset: index * ROW_HEIGHT + index * SEPARATOR_HEIGHT',
      ),
      replace(
        /function ApprovalRow\(\{\n {2}item,\n {2}expanded,\n {2}onToggle,\n {2}onDecide,\n\}: \{\n {2}item: Approval;\n {2}expanded: boolean;\n {2}onToggle: \(\) => void;\n/,
        'function ApprovalRow({\n  item,\n  onDecide,\n}: {\n  item: Approval;\n',
      ),
      replace(
        "  const [comment, setComment] = useState('');\n",
        "  const [expanded, setExpanded] = useState(false);\n  const [comment, setComment] = useState('');\n",
      ),
      replace('onPress={onToggle}', 'onPress={() => setExpanded((e) => !e)}'),
      replace(
        / {2}\/\/ FIX: track the expanded row by id[\s\S]*?(?=\n {2}return \()/,
        '  // Each row owns its expanded state; keys by id keep that state with the row.',
      ),
      replace('keyExtractor={(item) => item.id}', 'keyExtractor={(item) => `approval-${item.id}`}'),
      replace(
        /renderItem=\{\(\{ item \}\) => \([\s\S]*?\n {6}\)\}/,
        'renderItem={({ item }) => <ApprovalRow item={item} onDecide={onDecide} />}',
      ),
    ),
  },

  'list: a memoised renderItem with extraData and a named keyExtractor': {
    [LIST]: chain(
      replace(
        "import React, { useState } from 'react';",
        "import React, { useCallback, useState } from 'react';",
      ),
      replace(
        "import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';",
        "import { FlatList, Pressable, StyleSheet, Text, TextInput, View, type ListRenderItemInfo } from 'react-native';",
      ),
      replace('const Separator = ', 'const keyOf = (item: Approval) => item.id;\n\nconst Separator = '),
      replace(
        /(?<= {2}const \[expanded, setExpanded\] = useState<string \| null>\(null\);\n)[\s\S]*?\n {2}\);\n\}/,
        `  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Approval>) => (
      <ApprovalRow
        item={item}
        expanded={expanded === item.id}
        onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
        onDecide={onDecide}
      />
    ),
    [expanded, onDecide],
  );
  return (
    <FlatList
      testID="approvals"
      data={items}
      extraData={expanded}
      keyExtractor={keyOf}
      getItemLayout={getItemLayout}
      ItemSeparatorComponent={Separator}
      renderItem={renderItem}
    />
  );
}`,
      ),
    ),
  },
};

describe('rn-approvals-inbox: other valid fixes pass every test', () => {
  it.each(Object.entries(VARIANTS))(
    '%s',
    async (_name, edits) => {
      const files = edit(solution, edits);
      expect(typecheckFiles(files)).toEqual([]);
      expect(await failures(files)).toEqual([]);
    },
    120_000,
  );

  // In React Native the separator is rendered inside the item's cell, so counting it in `length` is
  // correct too; only `offset` decides where scrollToIndex lands.
  it('list: getItemLayout counts the separator in the cell length too', async () => {
    const files = edit(solution, {
      [LIST]: replace(
        'return { length: ROW_HEIGHT, offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index, index };',
        'return { length: ROW_HEIGHT + SEPARATOR_HEIGHT, offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index, index };',
      ),
    });
    expect(await failures(files)).toEqual([]);
  }, 120_000);
});

// ── Wrong fixes that only hide a symptom ────────────────────────────────────
interface WrongFix {
  edits: Edits;
  /** Tests that must fail (each wrong fix is applied to the otherwise correct solution). */
  caughtBy: string[];
}

const WRONG_FIXES: Record<string, WrongFix> = {
  'refresh: log out on every 401 instead of refreshing (feature removed)': {
    edits: {
      [HTTP]: replace(
        /const current = o\.session\.get\(\)\?\.tokens;[\s\S]*?\/\/ retried at most once/,
        "o.onLogout();\n      throw new HttpError(401, 'Your session has expired. Sign in again.');",
      ),
    },
    caughtBy: [T.retries, T.refreshOnce, T.noSecondRefresh],
  },
  'refresh: the refresh token read again at refresh time, still a boolean flag': {
    edits: {
      [HTTP]: replace(
        REFRESH_ONCE_BLOCK,
        `  let isRefreshing = false;

  async function refreshOnce(_sentWith: string): Promise<Tokens> {
    if (isRefreshing) return o.session.get()!.tokens;
    isRefreshing = true;
    try {
      const fresh = await o.refresh(o.session.get()!.tokens.refreshToken);
      await o.session.saveTokens(fresh);
      return fresh;
    } catch {
      o.onLogout();
      throw new HttpError(401, 'Your session has expired. Sign in again.');
    } finally {
      isRefreshing = false;
    }
  }
`,
      ),
    },
    caughtBy: [T.refreshOnce],
  },
  'abort: an isMounted-style flag instead of aborting the request': {
    edits: {
      [HOOK]: chain(
        replace('const controller = new AbortController();', 'let active = true;'),
        replace('{ signal: controller.signal }', '{}'),
        replace('if (controller.signal.aborted) return;', 'if (!active) return;'),
        replace("if (controller.signal.aborted || e.name === 'AbortError') return;", 'if (!active) return;'),
        replace('return () => controller.abort();', 'return () => {\n      active = false;\n    };'),
      ),
    },
    caughtBy: [T.slowResponse, T.cancelOnUnmount],
  },
  'rollback: a failed decision goes back to PENDING, not to the status it had': {
    edits: {
      [DECISIONS]: replace(
        "const previous = latest.current.find((a) => a.id === id)?.status ?? 'PENDING';",
        "const previous = 'PENDING' as const;",
      ),
    },
    caughtBy: [T.previousStatus],
  },
  'rollback: keep the optimistic status and only flag the error': {
    edits: { [DECISIONS]: replace('status: previous, error:', 'status: decision, error:') },
    caughtBy: [T.rollbackOnlyFailed, T.laterSuccess, T.previousStatus],
  },
  'list: keys made of the id and the index': {
    edits: {
      [LIST]: replace(
        'keyExtractor={(item) => item.id}',
        'keyExtractor={(item, index) => `${item.id}-${index}`}',
      ),
    },
    caughtBy: [T.rowComment],
  },
  'list: the separator added once instead of once per row above': {
    edits: {
      [LIST]: replace(
        'offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index',
        'offset: ROW_HEIGHT * index + SEPARATOR_HEIGHT',
      ),
    },
    caughtBy: [T.scrollToIndex],
  },
  'list: collapse the expanded row whenever the list changes': {
    edits: {
      [LIST]: chain(
        replace(
          "import React, { useState } from 'react';",
          "import React, { useEffect, useState } from 'react';",
        ),
        replace(
          '  const [expanded, setExpanded] = useState<string | null>(null);\n',
          '  const [expanded, setExpanded] = useState<string | null>(null);\n  useEffect(() => setExpanded(null), [items]);\n',
        ),
      ),
    },
    caughtBy: [T.expandedRow, T.rowComment],
  },
};

describe('rn-approvals-inbox: wrong fixes that hide a symptom fail', () => {
  it.each(Object.entries(WRONG_FIXES))(
    '%s',
    async (_name, { edits, caughtBy }) => {
      const failed = (await results(edit(solution, edits)))
        .filter((r) => r.status === 'failed')
        .map((r) => r.name);
      expect(failed).toEqual(expect.arrayContaining(caughtBy));
    },
    120_000,
  );

  // Waiting a fixed time for "the other" refresh instead of awaiting it: the test's refresh is slow.
  it('refresh: waiters sleep 50 ms and then use whatever tokens are stored', async () => {
    const files = edit(solution, {
      [HTTP]: replace(
        REFRESH_ONCE_BLOCK,
        `  let isRefreshing = false;

  async function refreshOnce(refreshToken: string): Promise<Tokens> {
    if (isRefreshing) {
      // Another request is refreshing: give it a moment, then use the tokens it stored.
      await new Promise((resolve) => setTimeout(resolve, 50));
      const stored = o.session.get()?.tokens;
      if (!stored) throw new HttpError(401, 'Your session has expired. Sign in again.');
      return stored;
    }
    isRefreshing = true;
    try {
      const fresh = await o.refresh(refreshToken);
      await o.session.saveTokens(fresh);
      return fresh;
    } catch {
      o.onLogout();
      throw new HttpError(401, 'Your session has expired. Sign in again.');
    } finally {
      isRefreshing = false;
    }
  }
`,
      ),
    });
    expect(await failures(files)).not.toEqual([]);
  }, 120_000);

  // Sleeping instead of awaiting `ready`: the test's storage is slower than the sleep.
  it('hydration: fixed 100 ms sleeps instead of waiting for the stored session', async () => {
    const sleep = 'await new Promise((resolve) => setTimeout(resolve, 100));';
    const files = edit(solution, {
      [HTTP]: replace('    await o.session.ready;\n', `    ${sleep}\n`),
      [SESSION]: chain(
        replace('    async signIn(next) {\n      await ready;', `    async signIn(next) {\n      ${sleep}`),
        replace(
          '    async saveTokens(tokens) {\n      await ready;',
          `    async saveTokens(tokens) {\n      ${sleep}`,
        ),
        replace('    async signOut() {\n      await ready;', `    async signOut() {\n      ${sleep}`),
      ),
    });
    expect(await failures(files)).not.toEqual([]);
  }, 120_000);

  // Swallowing every error to stop the spinner: a failed load must be reported.
  it('abort: load errors swallowed (the error state is never set)', async () => {
    const files = edit(solution, {
      [HOOK]: replace(
        "if (controller.signal.aborted || e.name === 'AbortError') return;\n        setError(e.message);",
        'if (controller.signal.aborted) return;',
      ),
    });
    expect(await failures(files)).not.toEqual([]);
  }, 120_000);
});

// ── Broken candidate code ───────────────────────────────────────────────────
type IsolatedOutcome =
  SandboxOutcome | { type: 'hung' } | { type: 'host-crash'; code: number | null; stderr: string };

// Generous: the full suite runs many of these at once on a busy machine.
const SANDBOX_TIMEOUT_MS = 30_000;
const HARD_LIMIT_MS = 75_000;
const QUESTION_CHECK = pathToFileURL(join(import.meta.dirname, '..', 'lib', 'questionCheck.ts')).href;
// No backslashes in this script: Windows command-line quoting would mangle them.
const DRIVER = [
  `import { runSandboxTests } from ${JSON.stringify(QUESTION_CHECK)};`,
  "let input = '';",
  'for await (const chunk of process.stdin) input += chunk;',
  'const { files, timeoutMs } = JSON.parse(input);',
  'const outcome = await runSandboxTests(files, timeoutMs);',
  // A run that returns but leaves the event loop starved would still hang its caller.
  'await new Promise((resolve) => setTimeout(resolve, 100));',
  "process.stdout.write('@@OUTCOME@@' + JSON.stringify(outcome), () => process.exit(0));",
].join('\n');

/**
 * runSandboxTests in a child process, so code that blocks the event loop (which no in-process timer
 * can interrupt) can't hang this test run: the child is killed after HARD_LIMIT_MS ("hung").
 */
function runIsolated(files: SourceFile[]): Promise<IsolatedOutcome> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '--no-warnings', '--eval', DRIVER], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let hung = false;
    const timer = setTimeout(() => {
      hung = true;
      child.kill();
    }, HARD_LIMIT_MS);
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    child.on('close', (code) => {
      clearTimeout(timer);
      const at = stdout.indexOf('@@OUTCOME@@');
      if (at >= 0) resolve(JSON.parse(stdout.slice(at + '@@OUTCOME@@'.length)) as SandboxOutcome);
      else resolve(hung ? { type: 'hung' } : { type: 'host-crash', code, stderr: stderr.slice(0, 2000) });
    });
    child.stdin.end(JSON.stringify({ files, timeoutMs: SANDBOX_TIMEOUT_MS }));
  });
}

const failedTests = (o: IsolatedOutcome) =>
  o.type === 'done' ? o.results.filter((r) => r.status === 'failed') : [];
const testsOfFiles = (o: IsolatedOutcome, files: string[]) =>
  o.type === 'done' ? o.results.filter((r) => files.includes(r.file)).map((r) => r.name) : [];

describe.concurrent('rn-approvals-inbox: broken code gives a clear outcome, never a hung run', () => {
  it('a TypeScript type error the tests also catch at run time (and the type check reports)', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [DECISIONS]: replace(
        "error: e instanceof Error ? e.message : 'Failed'",
        "error: e instanceof Error ? e : 'Failed'",
      ),
    });
    expect(typecheckFiles(files).map((d) => d.path)).toContain(DECISIONS);
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o).map((r) => r.name)).toEqual(
      expect.arrayContaining([T.rollbackOnlyFailed, T.previousStatus]),
    );
  }, 120_000);

  it('a type-only error still runs the tests, as in the browser (the editor shows it)', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [DECISIONS]: replace(
        'export type ApprovalsAction',
        "const label: number = 'approvals';\nexport type ApprovalsAction",
      ),
    });
    expect(typecheckFiles(files).map((d) => [d.path, d.code])).toEqual([[DECISIONS, 2322]]);
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o)).toEqual([]);
  }, 120_000);

  it('a syntax error (stray token)', async ({ expect }) => {
    const files = edit(solution, {
      [DECISIONS]: replace('export function approvalsReducer', 'export function = approvalsReducer'),
    });
    const o = await runIsolated(files);
    // The browser reports it as a compile error with its line; in Node the whole script fails to parse.
    expect(['compile', 'crash']).toContain(o.type);
    expect(JSON.stringify(o)).toMatch(/SyntaxError|expected/);
  }, 120_000);

  // TypeScript's transpiler alone would repair this; like the browser, the checker refuses it.
  it('a syntax error (missing closing brace at the end of a file)', async ({ expect }) => {
    const files = edit(solution, { [DECISIONS]: (src) => src.trimEnd().replace(/\}$/, '') });
    const o = await runIsolated(files);
    expect(o.type).toBe('compile');
  }, 120_000);

  it('a file emptied completely', async ({ expect }) => {
    const files = edit(solution, { [DECISIONS]: () => '' });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual(
      testsOfFiles(o, ['__tests__/approvals.test.tsx']).sort(),
    );
    expect(failed[0]?.error).toMatch(/is not a function/);
  }, 120_000);

  it('an export the tests import removed', async ({ expect }) => {
    const files = edit(solution, {
      [HOOK]: replace('export function useApprovals', 'function useApprovals'),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual(
      testsOfFiles(o, ['__tests__/useApprovals.test.tsx']).sort(),
    );
    expect(failed[0]?.error).toMatch(/useApprovals.* is not a function/);
  }, 120_000);

  it('a module that throws when it is loaded', async ({ expect }) => {
    const files = edit(solution, {
      [SESSION]: replace(
        "export const SESSION_KEY = 'session.v1';",
        "export const SESSION_KEY = 'session.v1';\nthrow new Error('boom at load');",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual([
      '__tests__/httpClient.test.ts could not be loaded',
      '__tests__/sessionStore.test.ts could not be loaded',
    ]);
    expect(failed[0]?.error).toContain('boom at load');
  }, 120_000);

  it('an infinite render loop (setState during render)', async ({ expect }) => {
    const files = edit(solution, {
      [LIST]: replace(
        '  const [expanded, setExpanded] = useState<string | null>(null);\n',
        '  const [expanded, setExpanded] = useState<string | null>(null);\n  const [renders, setRenders] = useState(0);\n  setRenders(renders + 1);\n',
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name)).toEqual(expect.arrayContaining([T.expandedRow, T.rowComment]));
    expect(failed.find((r) => r.name === T.expandedRow)?.error).toMatch(/Too many re-renders/);
  }, 120_000);

  it('a promise that never settles in code every request goes through', async ({ expect }) => {
    const files = edit(solution, {
      [HTTP]: replace('    await o.session.ready;\n', '    await new Promise<void>(() => {});\n'),
    });
    const o = await runIsolated(files);
    expect(['done', 'timeout']).toContain(o.type);
    if (o.type === 'done') expect(failedTests(o).some((r) => /timed out/.test(r.error ?? ''))).toBe(true);
  }, 120_000);

  it('huge console output is capped per test', async ({ expect }) => {
    const files = edit(solution, {
      [LIST]: replace(
        '  // FIX: every row before `index` is followed by a separator.\n',
        "  for (let i = 0; i < 20_000; i++) console.log('layout', i, { index });\n  for (let i = 0; i < 5; i++) console.error('x'.repeat(200_000));\n",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    if (o.type !== 'done') return;
    expect(failedTests(o)).toEqual([]);
    for (const r of o.results) {
      expect(r.logs.length).toBeLessThanOrEqual(200);
      for (const line of r.logs) expect(line.length).toBeLessThanOrEqual(520);
    }
  }, 120_000);

  // Only logged, as in the browser's worker: the tests are unaffected.
  it('a promise rejection nobody handles', async ({ expect }) => {
    const files = edit(solution, {
      [DECISIONS]: replace(
        "      dispatch({ type: 'OPTIMISTIC', id, status: decision });\n",
        "      dispatch({ type: 'OPTIMISTIC', id, status: decision });\n      void Promise.reject(new Error('nobody handles me'));\n",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o)).toEqual([]);
  }, 120_000);

  // The run's worker thread is stopped after the timeout, as the browser stops its Web Worker.
  it('an infinite loop while rendering a component', async ({ expect }) => {
    const files = edit(solution, {
      [LIST]: replace(
        "  const [comment, setComment] = useState('');\n",
        "  const [comment, setComment] = useState('');\n  while (item.id) {}\n",
      ),
    });
    expect((await runIsolated(files)).type).toBe('timeout');
  }, 120_000);

  it('an infinite loop in a function a test calls', async ({ expect }) => {
    const files = edit(solution, {
      [LIST]: replace(
        '  // FIX: every row before `index` is followed by a separator.\n',
        '  while (index >= 0) {}\n',
      ),
    });
    expect((await runIsolated(files)).type).toBe('timeout');
  }, 120_000);

  it('an endless async loop (microtasks only)', async ({ expect }) => {
    const files = edit(solution, {
      [HOOK]: replace(
        '    const controller = new AbortController();\n',
        '    const controller = new AbortController();\n    void (async () => {\n      for (;;) await null;\n    })();\n',
      ),
    });
    expect(['timeout', 'done']).toContain((await runIsolated(files)).type);
  }, 120_000);
});
