/**
 * rn-live-auction: the read-only tests must accept every reasonable fix and reject wrong ones.
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

const q = loadQuestion(join(QUESTIONS_DIR, 'rn-live-auction'));
const starter: SourceFile[] = q.files.map((f) => ({ path: f.path, content: f.content }));
const referenceFiles = q.reference_solution?.files ?? [];
const solution = withSolution(starter, referenceFiles);

const SCREEN = 'src/screens/AuctionScreen.tsx';
const BOARD = 'src/components/BidBoard.tsx';
const COUNTDOWN = 'src/hooks/useCountdown.ts';
const LISTENERS = 'src/hooks/useAuctionListeners.ts';
const MONEY = 'src/utils/money.ts';

function reference(path: string): string {
  const file = referenceFiles.find((f) => f.path === path);
  if (!file) throw new Error(`the reference solution has no ${path}`);
  return file.content;
}
const starterFile = (path: string) => starter.find((f) => f.path === path)!.content;

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

/** Adds hooks to the file's `import { … } from 'react'` line. */
const importFromReact =
  (...names: string[]): Edit =>
  (src) =>
    src.replace(/import \{ ([^}]*) \} from 'react';/, (_match, list: string) => {
      const all = new Set([...list.split(',').map((s) => s.trim()), ...names]);
      return `import { ${[...all].sort().join(', ')} } from 'react';`;
    });

/** The top-level `export function name` of `src`, up to its closing brace. */
function exportedFunction(src: string, name: string): string {
  const match = new RegExp(`export function ${name}\\b[\\s\\S]*?\\n\\}\\n`).exec(src);
  if (!match) throw new Error(`no exported function ${name}`);
  return match[0];
}
/** Swaps in the reference solution's version of one exported function. */
const referenceFunction =
  (path: string, name: string): Edit =>
  (src) =>
    replace(exportedFunction(src, name), exportedFunction(reference(path), name))(src);

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
  countsDown: 'useCountdown › counts down every second and closes at zero',
  extension: 'useCountdown › picks up an extension of the closing time immediately',
  background: 'useCountdown › is right again as soon as the app returns from the background',
  oneListener: 'live bid feed › has exactly one listener while focused, however often the screen re-renders',
  latestCallback: 'live bid feed › delivers each bid once, to the latest callback',
  unsubscribes: 'live bid feed › unsubscribes when the screen loses focus and when it unmounts',
  newSocket: 'live bid feed › moves its listener to a new socket (after a reconnect)',
  oneAppState: 'foreground resync › keeps one AppState listener and removes it on unmount',
  latestForeground: 'foreground resync › calls the latest callback once when the app becomes active',
  ticks: "bid board performance › rows don't re-render while the countdown ticks",
  selection: 'bid board performance › selecting a bid re-renders only the rows whose selection changed',
  newBid: 'bid board performance › a new bid that ranks last renders only its own row',
  newBest: 'bid board performance › a new best bid becomes #1 and moves every other bid down',
  bidRules: 'bid rules › accepts a bid that undercuts the best bid by at least the minimum decrement',
  rejectsInvalid: 'bid rules › rejects zero, negative and non-numeric amounts',
  format: 'bid rules › formats amounts in rupees with Indian digit grouping',
} as const;

const INR =
  "new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })";

/** The reference fix split into independent parts, applied to the starter in this order. */
const FIXES = {
  /** Bug 1: restart when closesAt changes and recompute at once. */
  countdownDeps: {
    [COUNTDOWN]: chain(
      replace(
        '  useEffect(() => {\n    const id = setInterval',
        '  useEffect(() => {\n    setRemaining(Math.max(0, closesAt - Date.now()));\n    const id = setInterval',
      ),
      replace('  }, []);', '  }, [closesAt]);'),
    ),
  },
  /** Bug 1: derive the remaining time from the wall clock on every tick. */
  wallClock: {
    [COUNTDOWN]: replace(
      'setRemaining((r) => Math.max(0, r - 1000));',
      'setRemaining(Math.max(0, closesAt - Date.now()));',
    ),
  },
  /** Bug 2: one stable handler, a memoised focus effect, the latest callback via a ref. */
  bidFeed: {
    [LISTENERS]: chain(importFromReact('useCallback', 'useRef'), referenceFunction(LISTENERS, 'useBidFeed')),
  },
  /** Bug 2: the AppState subscription is removed in the cleanup. */
  appState: {
    [LISTENERS]: chain(importFromReact('useRef'), referenceFunction(LISTENERS, 'useOnForeground')),
  },
  /** Bug 3: memoised rows get only stable props (onSelect(id), StyleSheet styles). */
  rowProps: { [BOARD]: whole(reference(BOARD)) },
  /** Bug 3: the screen passes a stable onSelect. */
  stableSelect: {
    [SCREEN]: chain(
      replace(
        "import React, { useState } from 'react';",
        "import React, { useCallback, useState } from 'react';",
      ),
      replace(
        '  useOnForeground(onResync);\n',
        '  useOnForeground(onResync);\n  const select = useCallback((id: string) => setSelectedId(id), []);\n',
      ),
      replace('onSelect={(id) => setSelectedId(id)}', 'onSelect={select}'),
    ),
  },
  /** Bug 4: compare integer paise. */
  paise: {
    [MONEY]: chain(
      replace(
        '/**\n * In a reverse auction',
        'const toPaise = (rupees: number) => Math.round(rupees * 100);\n\n/**\n * In a reverse auction',
      ),
      replace(
        '  return bid > 0 && bid <= best - minDecrement;',
        '  const b = toPaise(bid);\n  return b > 0 && b <= toPaise(best) - toPaise(minDecrement);',
      ),
    ),
  },
  /** Bug 4: format with Intl (Indian digit grouping). */
  format: {
    [MONEY]: chain(
      replace('/** "₹12,34,567.50"', `const inr = ${INR};\n\n/** "₹12,34,567.50"`),
      replace('  return `₹${amount.toFixed(2)}`;', '  return inr.format(amount);'),
    ),
  },
} satisfies Record<string, Edits>;
type Fix = keyof typeof FIXES;
const ALL_FIXES = Object.keys(FIXES) as Fix[];

/** The bugs of solution/notes.md and the parts of the fix each one needs. */
const BUGS: Record<string, Fix[]> = {
  '1 (countdown ignores extensions, drifts)': ['countdownDeps', 'wallClock'],
  '2 (listener leaks)': ['bidFeed', 'appState'],
  '3 (rows re-render on every tick)': ['rowProps', 'stableSelect'],
  '4 (float money, no digit grouping)': ['paise', 'format'],
};

/** The fix parts each test needs in order to pass. [] = passes on the starter (a regression guard). */
const NEEDS: Record<string, Fix[]> = {
  [T.countsDown]: [],
  [T.extension]: ['countdownDeps'],
  [T.background]: ['wallClock'],
  [T.oneListener]: ['bidFeed'],
  [T.latestCallback]: ['bidFeed'],
  [T.unsubscribes]: ['bidFeed'],
  [T.newSocket]: ['bidFeed'],
  [T.oneAppState]: ['appState'],
  [T.latestForeground]: ['appState'],
  // Memoised rows only help once the screen's callback is stable too, and vice versa.
  [T.ticks]: ['rowProps', 'stableSelect'],
  [T.selection]: ['rowProps', 'stableSelect'],
  [T.newBid]: ['rowProps', 'stableSelect'],
  [T.newBest]: [],
  [T.bidRules]: ['paise'],
  [T.rejectsInvalid]: [],
  [T.format]: ['format'],
};

function withFixes(applied: Fix[]): SourceFile[] {
  return ALL_FIXES.filter((f) => applied.includes(f)).reduce((files, f) => edit(files, FIXES[f]), starter);
}
const expectedStatuses = (applied: Fix[]) =>
  Object.fromEntries(
    Object.entries(NEEDS).map(([name, needs]) => [
      name,
      needs.every((f) => applied.includes(f)) ? 'passed' : 'failed',
    ]),
  );
const except = (excluded: Fix[]) => ALL_FIXES.filter((f) => !excluded.includes(f));

describe('rn-live-auction: partial fixes pass exactly the tests of the bugs they fix', () => {
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
const COUNTDOWN_HOOK = /export function useCountdown[\s\S]*?\n\}\n/;

const VARIANTS: Record<string, Edits> = {
  'countdown: a clock state, the remaining time derived while rendering': {
    [COUNTDOWN]: replace(
      COUNTDOWN_HOOK,
      `export function useCountdown(closesAt: number) {
  // The interval only moves the clock; the remaining time always follows the latest closesAt.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, closesAt - now);
  return { remaining, closed: remaining === 0 };
}
`,
    ),
  },

  'countdown: a self-rescheduling timeout aligned to whole seconds, stopping at zero': {
    [COUNTDOWN]: replace(
      / {2}useEffect\(\(\) => \{[\s\S]*?\n {2}\}, \[closesAt\]\);/,
      `  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const left = Math.max(0, closesAt - Date.now());
      setRemaining(left);
      if (left > 0) timer = setTimeout(tick, left % 1000 || 1000);
    };
    tick();
    return () => clearTimeout(timer);
  }, [closesAt]);`,
    ),
  },

  'listeners: re-subscribe when the callback changes (React Navigation docs pattern)': {
    [LISTENERS]: chain(
      replace(
        "import { useCallback, useEffect, useRef } from 'react';",
        "import { useCallback, useEffect } from 'react';",
      ),
      replace(
        exportedFunction(reference(LISTENERS), 'useBidFeed'),
        `export function useBidFeed(socket: AuctionSocket, onBid: (bid: Bid) => void) {
  useFocusEffect(
    useCallback(() => {
      socket.on('bid', onBid);
      return () => socket.off('bid', onBid);
    }, [socket, onBid]),
  );
}
`,
      ),
      replace(
        exportedFunction(reference(LISTENERS), 'useOnForeground'),
        `export function useOnForeground(onForeground: () => void) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') onForeground();
    });
    return () => sub.remove();
  }, [onForeground]);
}
`,
      ),
    ),
  },

  'listeners: a shared useLatest hook (ref updated in a layout effect)': {
    [LISTENERS]: chain(
      replace(
        "import { useCallback, useEffect, useRef } from 'react';",
        "import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';",
      ),
      replace(
        '/** Live bids for the auction',
        `/** A ref that always holds the latest value (for handlers that must stay the same function). */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

/** Live bids for the auction`,
      ),
      replace(
        '  const latest = useRef(onBid);\n  useEffect(() => {\n    latest.current = onBid;\n  });\n',
        '  const latest = useLatest(onBid);\n',
      ),
      replace(
        '  const latest = useRef(onForeground);\n  useEffect(() => {\n    latest.current = onForeground;\n  });\n',
        '  const latest = useLatest(onForeground);\n',
      ),
    ),
  },

  'rendering: a custom React.memo comparison on the row (board and screen unchanged)': {
    [BOARD]: whole(
      replace(
        '\n});\n\nexport function BidBoard',
        [
          '\n},',
          '// Rows depend only on their data, rank and selection; onPress/style are derived from those.',
          '(prev, next) => prev.bid === next.bid && prev.rank === next.rank && prev.selected === next.selected);',
          '',
          'export function BidBoard',
        ].join('\n'),
      )(starterFile(BOARD)),
    ),
    [SCREEN]: whole(starterFile(SCREEN)),
  },

  'rendering: the board keeps the latest onSelect in a ref (screen unchanged)': {
    [BOARD]: chain(
      replace(
        "import React, { useCallback } from 'react';",
        "import React, { useCallback, useEffect, useRef } from 'react';",
      ),
      replace(
        /export const BidBoard = React\.memo\(function BidBoard\(([\s\S]*?)\) \{\n {2}const renderItem/,
        (m) =>
          m
            .replace('export const BidBoard = React.memo(function BidBoard(', 'export function BidBoard(')
            .replace(
              '  const renderItem',
              [
                '  // One stable select function for every row, whatever the parent passes in.',
                '  const latestOnSelect = useRef(onSelect);',
                '  useEffect(() => {',
                '    latestOnSelect.current = onSelect;',
                '  });',
                '  const select = useCallback((id: string) => latestOnSelect.current(id), []);',
                '  const renderItem',
              ].join('\n'),
            ),
      ),
      replace(
        'selected={item.id === selectedId} onSelect={onSelect} />\n    ),\n    [selectedId, onSelect],',
        'selected={item.id === selectedId} onSelect={select} />\n    ),\n    [selectedId, select],',
      ),
      replace('renderItem={renderItem} />;\n});', 'renderItem={renderItem} />;\n}'),
    ),
    [SCREEN]: whole(starterFile(SCREEN)),
  },

  'rendering: the countdown in its own component, the state setter passed as onSelect': {
    [SCREEN]: chain(
      replace(
        "import React, { useCallback, useState } from 'react';",
        "import React, { useEffect, useState } from 'react';",
      ),
      replace(
        '/** Minimum amount',
        `/** Only this component re-renders every second; the screen hears about it when the auction closes. */
function Countdown({ closesAt, onClosedChange }: { closesAt: number; onClosedChange: (closed: boolean) => void }) {
  const { remaining, closed } = useCountdown(closesAt);
  useEffect(() => onClosedChange(closed), [closed, onClosedChange]);
  return <Text testID="countdown">{closed ? 'Auction closed' : formatRemaining(remaining)}</Text>;
}

/** Minimum amount`,
      ),
      replace(
        '  const { remaining, closed } = useCountdown(closesAt);\n',
        '  const [closed, setClosed] = useState(() => Date.now() >= closesAt);\n',
      ),
      replace(/ {2}\/\/ FIX: a stable callback[^\n]*\n {2}const select = [^\n]*\n/, ''),
      replace(
        '<Text testID="countdown">{closed ? \'Auction closed\' : formatRemaining(remaining)}</Text>',
        '<Countdown closesAt={closesAt} onClosedChange={setClosed} />',
      ),
      replace('onSelect={select}', 'onSelect={setSelectedId}'),
    ),
  },

  'money: the threshold rounded to whole paise, toLocaleString for the format': {
    [MONEY]: chain(
      replace(
        /export function isValidBid[\s\S]*?\n\}\n/,
        `export function isValidBid(bid: number, best: number, minDecrement: number): boolean {
  const limit = Math.round((best - minDecrement) * 100) / 100;
  return bid > 0 && bid <= limit;
}
`,
      ),
      replace(
        '  return inr.format(amount);',
        "  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });",
      ),
    ),
  },

  'money: an epsilon comparison and hand-written Indian digit grouping': {
    [MONEY]: chain(
      replace(
        '  const b = toPaise(bid);\n  return b > 0 && b <= toPaise(best) - toPaise(minDecrement);',
        '  // Amounts have two decimals; 1e-9 absorbs the binary floating-point error.\n  return bid > 0 && bid <= best - minDecrement + 1e-9;',
      ),
      replace(
        '  return inr.format(amount);',
        [
          "  const [whole = '0', paise = '00'] = amount.toFixed(2).split('.');",
          '  // Indian grouping: the last three digits, then groups of two (12,34,567).',
          '  const head = whole.slice(0, -3);',
          "  const grouped = head ? `${head.replace(/\\B(?=(\\d{2})+$)/g, ',')},${whole.slice(-3)}` : whole;",
          '  return `₹${grouped}.${paise}`;',
        ].join('\n'),
      ),
    ),
  },
};

describe('rn-live-auction: other valid fixes pass every test', () => {
  it.each(Object.entries(VARIANTS))(
    '%s',
    async (_name, edits) => {
      const files = edit(solution, edits);
      expect(typecheckFiles(files)).toEqual([]);
      expect(await failures(files)).toEqual([]);
    },
    120_000,
  );

  // React Navigation's useIsFocused() re-renders on focus and blur, as the sandbox's now does.
  it('listeners: subscribe while useIsFocused() is true', async () => {
    const files = edit(solution, {
      [LISTENERS]: chain(
        replace(
          "import { useFocusEffect } from '@react-navigation/native';",
          "import { useIsFocused } from '@react-navigation/native';",
        ),
        replace(
          "import { useCallback, useEffect, useRef } from 'react';",
          "import { useEffect, useRef } from 'react';",
        ),
        replace(
          / {2}useFocusEffect\(\n {4}useCallback\(\(\) => \{([\s\S]*?)\n {4}\}, \[socket\]\),\n {2}\);/,
          (m) =>
            m
              .replace(
                '  useFocusEffect(\n    useCallback(() => {',
                '  const focused = useIsFocused();\n  useEffect(() => {\n    if (!focused) return;',
              )
              .replace('\n    }, [socket]),\n  );', '\n  }, [socket, focused]);')
              .replace(/\n {6}/g, '\n    '),
        ),
      ),
    });
    expect(typecheckFiles(files)).toEqual([]);
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
  'countdown: a shorter 250 ms tick that still counts ticks': {
    edits: {
      [COUNTDOWN]: replace(
        'const id = setInterval(update, 1000);',
        'const id = setInterval(() => setRemaining((r) => Math.max(0, r - 250)), 250);',
      ),
    },
    caughtBy: [T.background],
  },
  // Rejected on purpose: resyncing on 'active' still counts ticks in between (timers are throttled
  // and drift in the foreground too); the rubric asks for the wall clock on every tick.
  'countdown: resync when the app becomes active, count ticks otherwise': {
    edits: {
      [COUNTDOWN]: chain(
        replace(
          "import { useEffect, useState } from 'react';",
          "import { useEffect, useState } from 'react';\nimport { AppState } from 'react-native';",
        ),
        replace(
          'const id = setInterval(update, 1000);\n    return () => clearInterval(id);',
          [
            'const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1000)), 1000);',
            "    const sub = AppState.addEventListener('change', (state) => state === 'active' && update());",
            '    return () => {',
            '      clearInterval(id);',
            '      sub.remove();',
            '    };',
          ].join('\n'),
        ),
      ),
    },
    caughtBy: [T.background],
  },
  'countdown: closesAt added to the deps, nothing else': {
    edits: {
      [COUNTDOWN]: whole(
        FIXES.countdownDeps[COUNTDOWN](starterFile(COUNTDOWN)).replace(
          '    setRemaining(Math.max(0, closesAt - Date.now()));\n',
          '',
        ),
      ),
    },
    caughtBy: [T.extension, T.background],
  },
  'listeners: duplicate bids filtered out in the screen, hooks left leaking': {
    edits: {
      [LISTENERS]: whole(starterFile(LISTENERS)),
      [SCREEN]: replace(
        'setBids((current) => [...current, bid].sort(',
        'setBids((current) => current.some((b) => b.id === bid.id) ? current : [...current, bid].sort(',
      ),
    },
    caughtBy: [T.oneListener, T.latestCallback, T.unsubscribes, T.oneAppState, T.latestForeground],
  },
  'listeners: subscribe once in a plain useEffect (focus ignored)': {
    edits: {
      [LISTENERS]: replace(
        / {2}useFocusEffect\(\n {4}useCallback\(\(\) => \{([\s\S]*?)\n {4}\}, \[socket\]\),\n {2}\);/,
        "  useEffect(() => {\n    const handler = (bid: Bid) => latest.current(bid);\n    socket.on('bid', handler);\n    return () => socket.off('bid', handler);\n  }, [socket]);",
      ),
    },
    caughtBy: [T.unsubscribes],
  },
  'listeners: AppState.removeEventListener in the cleanup (removed in RN 0.70)': {
    edits: {
      [LISTENERS]: chain(
        replace(
          "    const sub = AppState.addEventListener('change', (state) => {\n      if (state === 'active') latest.current();\n    });\n    return () => sub.remove();",
          [
            '    const onChange = (state: string) => {',
            "      if (state === 'active') latest.current();",
            '    };',
            "    AppState.addEventListener('change', onChange);",
            "    return () => (AppState as unknown as { removeEventListener: (t: string, l: unknown) => void }).removeEventListener('change', onChange);",
          ].join('\n'),
        ),
      ),
    },
    caughtBy: [T.oneAppState],
  },
  'rendering: the trackRender() instrumentation removed': {
    edits: { [BOARD]: replace('  trackRender(`BidRow:${bid.id}`);\n', '') },
    caughtBy: [T.selection, T.newBid],
  },
  'rendering: React.memo on the board only, rows still get new callbacks and styles': {
    edits: {
      [BOARD]: whole(
        replace(
          'export function BidBoard({',
          'export const BidBoard = React.memo(function BidBoard({',
        )(replace(/\n {2}\);\n\}\n\nconst styles/, '\n  );\n});\n\nconst styles')(starterFile(BOARD))),
      ),
      [SCREEN]: whole(starterFile(SCREEN)),
    },
    caughtBy: [T.ticks, T.selection, T.newBid],
  },
  'money: a tolerance of one paisa in the comparison': {
    edits: {
      [MONEY]: replace(
        'return b > 0 && b <= toPaise(best) - toPaise(minDecrement);',
        'return bid > 0 && bid <= best - minDecrement + 0.01;',
      ),
    },
    caughtBy: [T.bidRules],
  },
  'money: paise truncated with Math.floor instead of rounded': {
    edits: { [MONEY]: replace('Math.round(rupees * 100)', 'Math.floor(rupees * 100)') },
    caughtBy: [T.bidRules],
  },
  'money: en-US digit grouping': {
    edits: { [MONEY]: replace("new Intl.NumberFormat('en-IN'", "new Intl.NumberFormat('en-US'") },
    caughtBy: [T.format],
  },
};

describe('rn-live-auction: wrong fixes that hide a symptom fail', () => {
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

  // trackRender() is a hook under the hood: calling it from an effect throws, so it can't be gamed.
  it('rendering: trackRender() moved into an effect, starter board and screen', async () => {
    const files = edit(solution, {
      [BOARD]: whole(
        chain(
          replace("import React from 'react';", "import React, { useEffect } from 'react';"),
          replace(
            '  trackRender(`BidRow:${bid.id}`);\n',
            '  useEffect(() => trackRender(`BidRow:${bid.id}`), [bid.id, selected]);\n',
          ),
        )(starterFile(BOARD)),
      ),
      [SCREEN]: whole(starterFile(SCREEN)),
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

describe.concurrent('rn-live-auction: broken code gives a clear outcome, never a hung run', () => {
  it('a TypeScript type error the tests also catch at run time (and the type check reports)', async ({
    expect,
  }) => {
    const files = edit(solution, { [MONEY]: replace('  return inr.format(amount);', '  return amount;') });
    expect(typecheckFiles(files).map((d) => d.path)).toContain(MONEY);
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o).map((r) => r.name)).toContain(T.format);
  }, 120_000);

  it('a type-only error still runs the tests, as in the browser (the editor shows it)', async ({
    expect,
  }) => {
    const files = edit(solution, {
      [MONEY]: replace('/** Parses what', "const label: number = 'auction';\n\n/** Parses what"),
    });
    expect(typecheckFiles(files).map((d) => [d.path, d.code])).toEqual([[MONEY, 2322]]);
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o)).toEqual([]);
  }, 120_000);

  it('a syntax error (stray token)', async ({ expect }) => {
    const files = edit(solution, {
      [COUNTDOWN]: replace('export function formatRemaining', 'export function = formatRemaining'),
    });
    const o = await runIsolated(files);
    // The browser reports it as a compile error with its line; in Node the whole script fails to parse.
    expect(['compile', 'crash']).toContain(o.type);
    expect(JSON.stringify(o)).toMatch(/SyntaxError|expected/);
  }, 120_000);

  it('a file emptied completely', async ({ expect }) => {
    const files = edit(solution, { [MONEY]: () => '' });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual(
      testsOfFiles(o, ['__tests__/money.test.ts', '__tests__/BidBoard.test.tsx']).sort(),
    );
    expect(failed[0]?.error).toMatch(/is not a function/);
  }, 120_000);

  it('an export the tests import removed', async ({ expect }) => {
    const files = edit(solution, {
      [COUNTDOWN]: replace('export function useCountdown', 'function useCountdown'),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual(
      testsOfFiles(o, ['__tests__/useCountdown.test.ts', '__tests__/BidBoard.test.tsx']).sort(),
    );
    expect(failed[0]?.error).toMatch(/useCountdown.* is not a function/);
  }, 120_000);

  it('a module that throws when it is loaded', async ({ expect }) => {
    const files = edit(solution, {
      [LISTENERS]: replace(
        "import type { Bid } from '../types';\n",
        "import type { Bid } from '../types';\n\nthrow new Error('boom at load');\n",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name).sort()).toEqual([
      '__tests__/BidBoard.test.tsx could not be loaded',
      '__tests__/listeners.test.ts could not be loaded',
    ]);
    expect(failed[0]?.error).toContain('boom at load');
  }, 120_000);

  it('an infinite render loop (setState during render)', async ({ expect }) => {
    const files = edit(solution, {
      [BOARD]: chain(
        replace(
          "import React, { useCallback } from 'react';",
          "import React, { useCallback, useState } from 'react';",
        ),
        replace(
          '  trackRender(`BidRow:${bid.id}`);\n',
          '  trackRender(`BidRow:${bid.id}`);\n  const [renders, setRenders] = useState(0);\n  setRenders(renders + 1);\n',
        ),
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const failed = failedTests(o);
    expect(failed.map((r) => r.name)).toEqual(expect.arrayContaining([T.ticks, T.selection, T.newBid]));
    expect(failed[0]?.error).toMatch(/Too many re-renders/);
  }, 120_000);

  it('a timer that reschedules itself with no delay (fake timers)', async ({ expect }) => {
    const files = edit(solution, {
      [COUNTDOWN]: replace(
        '    const id = setInterval(update, 1000);\n    return () => clearInterval(id);',
        '    let id = setTimeout(function again() {\n      update();\n      id = setTimeout(again, 0);\n    }, 0);\n    return () => clearTimeout(id);',
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    const loop = failedTests(o).find((r) => r.name === T.countsDown);
    expect(loop?.error).toMatch(/infinite timer loop/);
  }, 120_000);

  it('huge console output is capped per test', async ({ expect }) => {
    const files = edit(solution, {
      [MONEY]: replace(
        '/** Parses what',
        "for (let i = 0; i < 20_000; i++) console.log('loading money', i, { i });\nfor (let i = 0; i < 5; i++) console.error('x'.repeat(200_000));\n\n/** Parses what",
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
      [MONEY]: replace(
        '  const b = toPaise(bid);\n',
        "  const b = toPaise(bid);\n  void Promise.reject(new Error('nobody handles me'));\n",
      ),
    });
    const o = await runIsolated(files);
    expect(o.type).toBe('done');
    expect(failedTests(o)).toEqual([]);
  }, 120_000);

  // The run's worker thread is stopped after the timeout, as the browser stops its Web Worker.
  it('an infinite loop while rendering a component', async ({ expect }) => {
    const files = edit(solution, {
      [BOARD]: replace(
        '  trackRender(`BidRow:${bid.id}`);\n',
        '  trackRender(`BidRow:${bid.id}`);\n  while (rank > 0) {}\n',
      ),
    });
    expect((await runIsolated(files)).type).toBe('timeout');
  }, 120_000);

  // The run's worker thread is stopped after the timeout, as the browser stops its Web Worker.
  it('an infinite loop in a function a test calls', async ({ expect }) => {
    const files = edit(solution, {
      [MONEY]: replace('  const b = toPaise(bid);\n', '  while (bid > 0) {}\n  const b = toPaise(bid);\n'),
    });
    expect((await runIsolated(files)).type).toBe('timeout');
  }, 120_000);

  // The run's worker thread is stopped after the timeout, as the browser stops its Web Worker.
  it('an endless async loop (microtasks only)', async ({ expect }) => {
    const files = edit(solution, {
      [MONEY]: replace(
        '/** Parses what',
        'void (async () => {\n  for (;;) await null;\n})();\n\n/** Parses what',
      ),
    });
    expect(['timeout', 'done']).toContain((await runIsolated(files)).type);
  }, 120_000);
});
