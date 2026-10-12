/**
 * Fairness of the web-invoice-builder question (Q4, React web debugging). Its read-only tests must
 * accept every reasonable fix, notice each planted bug on its own, reject fixes that only hide a
 * symptom, and the sandbox must report broken code instead of hanging.
 *
 * - Other valid fixes: the reference solution rewritten the other ways a senior developer would fix
 *   each bug. Every test passes and the editor shows no type error.
 * - Partial fixes: the starter with one bug fixed (and with every bug but one fixed). A test passes
 *   exactly when every bug it depends on is fixed (REQUIRES).
 * - Fixes that hide a symptom: each fails at least one test (the tests that catch it are listed).
 * - Broken code: runs in a child process that is killed after a while, so a hang is reported.
 *
 * The KNOWN LIMITATION case is a gap the tests can't close, kept as it.fails(): it passes while the gap is exactly as
 * documented, and turn red once the question changes (then make them ordinary cases).
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SandboxOutcome } from '../../src/features/runner/buildScript.ts';
import { loadQuestion, QUESTIONS_DIR, ROOT } from '../lib/questionSource.ts';
import { runSandboxTests, typecheckFiles, withSolution, type SourceFile } from '../lib/questionCheck.ts';

const q = loadQuestion(join(QUESTIONS_DIR, 'web-invoice-builder'));
const starter: SourceFile[] = q.files.map((f) => ({ path: f.path, content: f.content }));
const solution = withSolution(starter, q.reference_solution?.files ?? []);

const HOOK = 'src/hooks/useDebouncedCallback.ts';
const BUILDER = 'src/InvoiceBuilder.tsx';
const PICKER = 'src/components/PoPicker.tsx';
const REDUCER = 'src/state/invoiceReducer.ts';
const MONEY_INPUT = 'src/components/MoneyInput.tsx';
const LINE_ROW = 'src/components/LineRow.tsx';
const MONEY = 'src/utils/money.ts';
const DATES = 'src/utils/dates.ts';

// ── Editing files ──────────────────────────────────────────────────────────

type Edit = (src: string) => string;
type Edits = Record<string, Edit>;

const contentOf = (files: SourceFile[], path: string) => {
  const f = files.find((x) => x.path === path);
  if (!f) throw new Error(`no such file: ${path}`);
  return f.content;
};

/** Applies edits (by path); every edit must change its file. */
function edit(files: SourceFile[], edits: Edits): SourceFile[] {
  for (const path of Object.keys(edits)) contentOf(files, path);
  return files.map((f) => {
    const fn = edits[f.path];
    if (!fn) return f;
    const content = fn(f.content);
    if (content === f.content) throw new Error(`edit changed nothing in ${f.path}`);
    return { path: f.path, content };
  });
}

/** Replaces text that must be there, so a typo in a variant can't silently test the original. */
const replace =
  (from: string | RegExp, to: string): Edit =>
  (src) => {
    if (typeof from === 'string' ? !src.includes(from) : !from.test(src))
      throw new Error(`not found: ${String(from)}`);
    return src.replace(from, () => to);
  };
const chain =
  (...fns: Edit[]): Edit =>
  (src) =>
    fns.reduce((s, fn) => fn(s), src);
const file =
  (content: string): Edit =>
  () =>
    content;
/** Adds a name to the file's `import { … } from 'react'`. */
const importFromReact =
  (...names: string[]): Edit =>
  (src) => {
    const m = /import \{ ([^}]*) \} from 'react';/.exec(src);
    if (!m) throw new Error("no import from 'react'");
    const all = new Set([...m[1]!.split(',').map((s) => s.trim()), ...names]);
    return src.replace(m[0], `import { ${[...all].sort().join(', ')} } from 'react';`);
  };
const notImportedFromReact =
  (...names: string[]): Edit =>
  (src) => {
    const m = /import \{ ([^}]*) \} from 'react';/.exec(src);
    if (!m) throw new Error("no import from 'react'");
    const kept = m[1]!
      .split(',')
      .map((s) => s.trim())
      .filter((n) => !names.includes(n));
    return src.replace(m[0], `import { ${kept.join(', ')} } from 'react';`);
  };

// ── Running ────────────────────────────────────────────────────────────────

const firstLine = (s = '') => s.split('\n')[0];

async function results(files: SourceFile[]) {
  const o = await runSandboxTests(files);
  if (o.type !== 'done') throw new Error(`expected a test run, got ${JSON.stringify(o).slice(0, 800)}`);
  return o.results;
}
async function failures(files: SourceFile[]) {
  return (await results(files))
    .filter((r) => r.status !== 'passed')
    .map((r) => `${r.name}: ${firstLine(r.error)}`);
}
async function failedNames(files: SourceFile[]) {
  return (await results(files)).filter((r) => r.status !== 'passed').map((r) => r.name);
}
async function statuses(files: SourceFile[]) {
  return Object.fromEntries((await results(files)).map((r) => [r.name, r.status]));
}

/** A valid fix: every test passes and the editor reports no type error. */
async function expectAccepted(files: SourceFile[]) {
  expect(await failures(files)).toEqual([]);
  expect(typecheckFiles(files)).toEqual([]);
}

/**
 * Body of an it.fails() FLAW case: throws (so it.fails passes) only while exactly the documented
 * tests fail. When the question is fixed, or anything else fails, it returns and the case turns red.
 */
function flawStillPresent(failed: string[], documented: string[]) {
  if (JSON.stringify([...failed].sort()) === JSON.stringify([...documented].sort()))
    throw new Error(`FLAW still present (failing: ${JSON.stringify(documented)})`);
}

/** Runs with another local time zone (Node applies a TZ change at once, vm contexts included). */
async function inTimeZone<T>(tz: string, fn: () => Promise<T>): Promise<T> {
  const previous = process.env.TZ;
  process.env.TZ = tz;
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

// ── The tests of the question, and the bugs each one needs fixed ──────────

/** The planted bugs (solution/notes.md), split where one report has two independent causes. */
const BUGS = ['1', '2a', '2b', '3', '4', '5', '6a', '6b', '7'] as const;
type Bug = (typeof BUGS)[number];
const BUG_NAMES: Record<Bug, string> = {
  '1': 'stale autosave: the debounce kept the first render callback',
  '2a': 'a pending autosave is not cancelled on unmount',
  '2b': 'a pending autosave is not cancelled on submit',
  '3': 'PO search: a new debounce on every render',
  '4': 'line ids from Date.now() collide',
  '5': 'updateLine mutates the line and keeps the array',
  '6a': 'price field: the parsed number is the controlled value',
  '6b': 'parseRupees: parseFloat, no validation, float * 100',
  '7': 'invoice date: the UTC date (toISOString)',
};

/**
 * Every test of the question and the bugs that must ALL be fixed for it to pass. Tests that pass on
 * the starter need nothing (they guard features a "fix" could remove).
 */
const REQUIRES: Record<string, Bug[]> = {
  'autosave › saves the current draft once the supplier stops editing': ['1'],
  // A quantity edit reaches the autosave only once lines are new arrays (5), with the latest
  // callback (1); with colliding ids (4) every line gets the typed quantity.
  'autosave › saves quantity edits, once per burst of typing, with the latest values': ['1', '4', '5'],
  'autosave › never saves after the invoice is submitted': ['2b'],
  'autosave › never saves while a slow submit is still on its way': ['2b'],
  'autosave › a search in the PO picker does not cancel a pending save': ['1', '5'],
  'autosave › never saves after the builder is closed': ['2a'],
  'autosave › does not save before a PO is chosen': [],
  'PO search › sends one request when the supplier pauses typing': ['3'],
  'PO search › waits until the supplier stops typing, however long they type': ['3'],
  'PO search › waits for the pause before searching': [],
  'PO search › lists matches; choosing one imports its lines': [],
  'invoice lines › gives every line its own id, even when several are created at once': ['4'],
  'invoice lines › gives a line added after a removal its own id': ['4'],
  'invoice lines › edits only the line that was changed': ['4'],
  'invoice lines › removes only the line that was removed': ['4'],
  'invoice lines › keeps lines that were added quickly apart': ['4'],
  'totals and undo › shows the totals of the imported PO': [],
  // Totals are memoised on the lines array (5); with colliding ids (4) the edit hits every line.
  'totals and undo › updates the totals on every edit': ['4', '5'],
  'totals and undo › keeps two PO lines with the same SKU apart': ['4'],
  'totals and undo › undo puts back the previous quantity and totals': ['5'],
  'totals and undo › an edit never changes the version that Undo returns to': ['5'],
  'price field › keeps the decimal point while the supplier types ₹12.50': ['6a'],
  'price field › can be cleared and typed again': ['6a'],
  'price field › shows exactly what was typed while typing (₹12.0, ₹0.05)': ['6a'],
  'price field › shows the restored price after Undo': ['5'],
  'price field › accepts a pasted amount with digit grouping': ['6b'],
  'parseRupees › reads plain, grouped and ₹ amounts': ['6b'],
  'parseRupees › rejects anything that is not a valid amount': ['6b'],
  'invoice date (IST) › is the Indian date just after midnight in India': ['7'],
  'invoice date (IST) › is the Indian date late in the evening': [],
  'invoice date (IST) › dates a new invoice with the date in India': ['7'],
};

const refFile = (path: string) => contentOf(solution, path);
const refPart = (path: string, re: RegExp) => {
  const m = re.exec(refFile(path));
  if (!m) throw new Error(`not in the reference ${path}: ${String(re)}`);
  return m[0];
};
const UPDATE_LINE = / {4}case 'updateLine': \{[\s\S]*?\n {4}\}\n/;
const LINE_ID = /const newLineId = .*\n/;

/** The reference fix of each bug, applied to the STARTER on its own. */
const FIXES: Record<Bug, Edits> = {
  '1': {
    [HOOK]: chain(
      importFromReact('useLayoutEffect'),
      replace(
        '  const timer = useRef<',
        '  const latest = useRef(fn);\n  useLayoutEffect(() => {\n    latest.current = fn;\n  });\n  const timer = useRef<',
      ),
      replace('setTimeout(() => fn(...args), delayMs)', 'setTimeout(() => latest.current(...args), delayMs)'),
    ),
  },
  '2a': {
    [HOOK]: chain(
      importFromReact('useEffect'),
      replace('  return useMemo(() => {', '  const stable = useMemo(() => {'),
      replace(
        '  }, [delayMs]);\n}',
        '  }, [delayMs]);\n\n  useEffect(() => stable.cancel, [stable]);\n  return stable;\n}',
      ),
    ),
  },
  '2b': {
    [BUILDER]: replace(
      '  async function submit() {\n',
      '  async function submit() {\n    autosave.cancel();\n',
    ),
  },
  '3': { [PICKER]: file(refFile(PICKER)) },
  '4': {
    [REDUCER]: replace(
      LINE_ID,
      `let lastLineId = 0;\n${refPart(REDUCER, LINE_ID)}`.replace(/let lastLineId = 0;\nlet/, 'let'),
    ),
  },
  '5': { [REDUCER]: replace(UPDATE_LINE, refPart(REDUCER, UPDATE_LINE)) },
  '6a': { [MONEY_INPUT]: file(refFile(MONEY_INPUT)) },
  '6b': { [MONEY]: file(refFile(MONEY)) },
  '7': { [DATES]: file(refFile(DATES)) },
};

/** The starter with these bugs fixed (edits to the same file applied in BUGS order). */
function withFixes(bugs: readonly Bug[]): SourceFile[] {
  const perFile = new Map<string, Edit[]>();
  for (const bug of BUGS.filter((b) => bugs.includes(b)))
    for (const [path, fn] of Object.entries(FIXES[bug]))
      perFile.set(path, [...(perFile.get(path) ?? []), fn]);
  return edit(starter, Object.fromEntries([...perFile].map(([path, fns]) => [path, chain(...fns)])));
}

const expectedWith = (fixed: readonly Bug[]) =>
  Object.fromEntries(
    Object.entries(REQUIRES).map(([name, needs]) => [
      name,
      needs.every((b) => fixed.includes(b)) ? 'passed' : 'failed',
    ]),
  );

describe('the test → bug map', () => {
  it('lists every test of the question', async () => {
    expect(Object.keys(await statuses(solution)).sort()).toEqual(Object.keys(REQUIRES).sort());
  }, 120_000);

  it('matches the starter: only the tests that need no fix pass', async () => {
    expect(await statuses(starter)).toEqual(expectedWith([]));
  }, 120_000);

  it.each(['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Kolkata'])(
    'the reference solution passes with the local time zone %s',
    async (tz) => {
      expect(await inTimeZone(tz, () => failures(solution))).toEqual([]);
    },
    120_000,
  );
});

describe('partial fixes', () => {
  it.each(BUGS)(
    'only bug %s fixed: exactly the tests that need just this fix pass',
    async (bug) => {
      expect(await statuses(withFixes([bug])), BUG_NAMES[bug]).toEqual(expectedWith([bug]));
    },
    120_000,
  );

  it.each(BUGS)(
    'every bug fixed except %s: exactly the tests that need it fail',
    async (bug) => {
      const fixed = BUGS.filter((b) => b !== bug);
      expect(await statuses(withFixes(fixed)), BUG_NAMES[bug]).toEqual(expectedWith(fixed));
    },
    120_000,
  );

  it('the per-bug fixes together pass every test', async () => {
    await expectAccepted(withFixes(BUGS));
  }, 120_000);
});

// ── Other valid fixes ──────────────────────────────────────────────────────

/** PoPicker with the given debounce set-up (the rendering is the reference's). */
const picker = (opts: {
  imports: string;
  setup: string;
  onChange?: string;
  onPick?: string;
}) => `${opts.imports}
import type { InvoiceApi, PoSummary } from '../types';

export const SEARCH_DEBOUNCE_MS = 300;

interface Props {
  api: InvoiceApi;
  onSelect(po: PoSummary): void;
}

/** Typeahead: searches POs by number or buyer once the supplier pauses typing. */
export function PoPicker({ api, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PoSummary[]>([]);
${opts.setup}
  return (
    <div className="po-picker">
      <input
        data-testid="po-search"
        aria-label="Purchase order"
        placeholder="Search PO number or buyer"
        value={query}
        onChange={(e) => {
          ${opts.onChange ?? 'setQuery(e.target.value);\n          debouncedSearch(e.target.value);'}
        }}
      />
      <ul role="listbox">
        {results.map((po) => (
          <li key={po.id} role="option" aria-selected={false}>
            <button
              type="button"
              data-testid={\`po-\${po.id}\`}
              onClick={() => {
                ${opts.onPick ?? ''}setResults([]);
                setQuery(po.number);
                onSelect(po);
              }}
            >
              {po.number} · {po.buyer}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`;

const SEARCH = `
  const search = (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    void api.searchPos(q.trim()).then(setResults);
  };
  const latestSearch = useRef(search);
  useLayoutEffect(() => {
    latestSearch.current = search;
  });
`;

/** The reference PoPicker with its debounced search callback replaced. */
const pickerSearch = (callback: string) =>
  replace(/ {2}\/\/ `search` is a new function[\s\S]*?\}, SEARCH_DEBOUNCE_MS\);\n/, callback);

/** money.ts with another parseRupees. */
const parseRupeesAs = (impl: string) => replace(/const AMOUNT[\s\S]*?\n\}\n/, impl);

const AUTOSAVE_BLOCK =
  /\n {2}\/\/ Autosave 0\.8 s after the last change\.[\s\S]*?\}, \[po, state\.lines, autosave\]\);\n/;
const SUBMIT_CANCEL =
  /\n {4}\/\/ A pending autosave would land after the submit[^\n]*\n {4}autosave\.cancel\(\);/;

describe('other valid fixes pass every test', () => {
  // 1. Latest callback
  it('autosave: the latest callback kept in a ref updated in useEffect', async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: chain(
          notImportedFromReact('useLayoutEffect'),
          replace(
            '  useLayoutEffect(() => {\n    latest.current = fn;',
            '  useEffect(() => {\n    latest.current = fn;',
          ),
        ),
      }),
    );
  }, 120_000);

  it('autosave: the latest callback kept in a ref updated in useInsertionEffect', async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: chain(
          notImportedFromReact('useLayoutEffect'),
          importFromReact('useInsertionEffect'),
          replace(
            '  useLayoutEffect(() => {\n    latest.current = fn;',
            '  useInsertionEffect(() => {\n    latest.current = fn;',
          ),
        ),
      }),
    );
  }, 120_000);

  it("autosave: React 19's useEffectEvent instead of a ref", async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: chain(
          notImportedFromReact('useLayoutEffect'),
          importFromReact('useEffectEvent'),
          replace(
            '  const latest = useRef(fn);\n  useLayoutEffect(() => {\n    latest.current = fn;\n  });\n',
            '  // Always calls the latest `fn` (an Effect Event reads the latest render).\n  const fire = useEffectEvent((...args: A) => fn(...args));\n',
          ),
          replace('latest.current(...args);', 'fire(...args);'),
        ),
      }),
    );
  }, 120_000);

  // Accepted by the tests; notes.md gives it partial credit only (assigning a ref during render).
  it('autosave: the ref assigned during render (tests accept it; rubric: partial credit)', async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: chain(
          notImportedFromReact('useLayoutEffect'),
          replace('  useLayoutEffect(() => {\n    latest.current = fn;\n  });\n', '  latest.current = fn;\n'),
        ),
      }),
    );
  }, 120_000);

  // 1 + 2: no debounce hook at all.
  it('autosave: a timer per change in an effect (cleanup restarts it; leaving draft status clears it)', async () => {
    await expectAccepted(
      edit(solution, {
        [BUILDER]: chain(
          replace("import { useDebouncedCallback } from './hooks/useDebouncedCallback';\n", ''),
          replace(
            AUTOSAVE_BLOCK,
            `
  // Autosave 0.8 s after the last change: every change restarts the timer (effect cleanup), and
  // submitting or closing the builder clears it.
  useEffect(() => {
    if (!po || status !== 'draft') return;
    const timer = setTimeout(() => {
      void api.saveDraft({ poId: po.id, invoiceDate, lines: state.lines });
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [api, po, invoiceDate, state.lines, status]);
`,
          ),
          replace(SUBMIT_CANCEL, ''),
        ),
      }),
    );
  }, 120_000);

  // 2b
  it('submit: flush() the pending autosave before submitting (the save goes first)', async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: chain(
          replace(
            '  cancel(): void;\n',
            '  cancel(): void;\n  /** Runs a pending call now. */\n  flush(): void;\n',
          ),
          replace(
            /const call = \(\.\.\.args: A\) => \{[\s\S]*?\n {4}return call;/,
            `let pending: A | null = null;
    const run = () => {
      const args = pending;
      pending = null;
      timer.current = undefined;
      if (args) latest.current(...args);
    };
    const call = (...args: A) => {
      clearTimeout(timer.current);
      pending = args;
      timer.current = setTimeout(run, delayMs);
    };
    call.cancel = () => {
      clearTimeout(timer.current);
      timer.current = undefined;
      pending = null;
    };
    call.flush = () => {
      clearTimeout(timer.current);
      run();
    };
    return call;`,
          ),
        ),
        [BUILDER]: replace(
          SUBMIT_CANCEL,
          '\n    // Save the pending edits first, so no autosave lands after the submit.\n    autosave.flush();',
        ),
      }),
    );
  }, 120_000);

  it('submit: the autosave callback saves only while the invoice is a draft', async () => {
    await expectAccepted(
      edit(solution, {
        [BUILDER]: chain(
          replace(
            '    void api.saveDraft(draft);\n  }, AUTOSAVE_MS);',
            "    // Never after submitting: the server would reopen the invoice.\n    if (status === 'draft') void api.saveDraft(draft);\n  }, AUTOSAVE_MS);",
          ),
          replace(SUBMIT_CANCEL, ''),
        ),
      }),
    );
  }, 120_000);

  // 2a
  it('unmount: the timer cleared in a mount-only effect cleanup', async () => {
    await expectAccepted(
      edit(solution, {
        [HOOK]: replace(
          '  useEffect(() => debounced.cancel, [debounced]);',
          '  useEffect(() => () => clearTimeout(timer.current), []);',
        ),
      }),
    );
  }, 120_000);

  // 3. One debounce per component
  it('PO search: utils/debounce created once in a ref (lazy init) + latest-callback ref', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: file(
          picker({
            imports:
              "import { useEffect, useLayoutEffect, useRef, useState } from 'react';\nimport { debounce } from '../utils/debounce';",
            setup: `${SEARCH}
  // One debounce for the component's lifetime, created on the first render.
  const debouncer = useRef<ReturnType<typeof debounce<[string]>> | null>(null);
  if (debouncer.current === null) {
    debouncer.current = debounce((q: string) => latestSearch.current(q), SEARCH_DEBOUNCE_MS);
  }
  const debouncedSearch = debouncer.current;
  useEffect(() => () => debouncer.current?.cancel(), []);
`,
          }),
        ),
      }),
    );
  }, 120_000);

  it('PO search: utils/debounce in useMemo([]) + latest-callback ref', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: file(
          picker({
            imports:
              "import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';\nimport { debounce } from '../utils/debounce';",
            setup: `${SEARCH}
  const debouncedSearch = useMemo(
    () => debounce((q: string) => latestSearch.current(q), SEARCH_DEBOUNCE_MS),
    [],
  );
  useEffect(() => debouncedSearch.cancel, [debouncedSearch]);
`,
          }),
        ),
      }),
    );
  }, 120_000);

  it('PO search: utils/debounce in a lazy useState initialiser + latest-callback ref', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: file(
          picker({
            imports:
              "import { useEffect, useLayoutEffect, useRef, useState } from 'react';\nimport { debounce } from '../utils/debounce';",
            setup: `${SEARCH}
  const [debouncedSearch] = useState(() =>
    debounce((q: string) => latestSearch.current(q), SEARCH_DEBOUNCE_MS),
  );
  useEffect(() => debouncedSearch.cancel, [debouncedSearch]);
`,
          }),
        ),
      }),
    );
  }, 120_000);

  it('PO search: debounced through an effect on the query (no search for the PO just picked)', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: file(
          picker({
            imports: "import { useEffect, useState } from 'react';",
            setup: `  /** The number of the PO just picked: it is in the field, but is not a search. */
  const [picked, setPicked] = useState<string | null>(null);

  // Debounced through the effect: each keystroke changes \`query\`, which clears the last timer.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || query === picked) return;
    const timer = setTimeout(() => {
      void api.searchPos(q).then(setResults);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [api, query, picked]);
`,
            onChange:
              'setQuery(e.target.value);\n          setPicked(null);\n          if (e.target.value.trim().length < 2) setResults([]);',
            onPick: 'setPicked(po.number);\n                ',
          }),
        ),
      }),
    );
  }, 120_000);

  it('PO search: a request id drops out-of-order responses (bonus)', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: chain(
          replace("import { useState } from 'react';", "import { useRef, useState } from 'react';"),
          pickerSearch(`  // Only the latest search may show its results: responses can arrive out of order.
  const lastSearch = useRef(0);
  const debouncedSearch = useDebouncedCallback((q: string) => {
    const id = ++lastSearch.current;
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    void api.searchPos(q.trim()).then((found) => {
      if (id === lastSearch.current) setResults(found);
    });
  }, SEARCH_DEBOUNCE_MS);
`),
          replace(
            '                setResults([]);\n',
            '                lastSearch.current++;\n                setResults([]);\n',
          ),
        ),
      }),
    );
  }, 120_000);

  it('PO search: an AbortController marks superseded responses (bonus)', async () => {
    await expectAccepted(
      edit(solution, {
        [PICKER]: chain(
          replace(
            "import { useState } from 'react';",
            "import { useEffect, useRef, useState } from 'react';",
          ),
          pickerSearch(`  // A newer search (or unmounting) aborts the previous one; its response is then ignored.
  const inFlight = useRef<AbortController | null>(null);
  useEffect(() => () => inFlight.current?.abort(), []);
  const debouncedSearch = useDebouncedCallback((q: string) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    void api.searchPos(q.trim()).then((found) => {
      if (!controller.signal.aborted) setResults(found);
    });
  }, SEARCH_DEBOUNCE_MS);
`),
        ),
      }),
    );
  }, 120_000);

  // 4. Line ids
  it('line ids: crypto.randomUUID()', async () => {
    await expectAccepted(
      edit(solution, {
        [REDUCER]: replace(
          /let lastLineId = 0;\nconst newLineId = .*\n/,
          'const newLineId = () => crypto.randomUUID();\n',
        ),
      }),
    );
  }, 120_000);

  it('line ids: a counter kept in the reducer state (pure reducer)', async () => {
    await expectAccepted(
      edit(solution, {
        [REDUCER]: chain(
          replace(
            '  past: InvoiceLine[][];\n}',
            '  past: InvoiceLine[][];\n  /** The number of the next line id. */\n  nextId: number;\n}',
          ),
          replace(
            'export const initialState: InvoiceState = { lines: [], past: [] };',
            'export const initialState: InvoiceState = { lines: [], past: [], nextId: 1 };',
          ),
          replace(/\/\/ Date\.now\(\) gave[\s\S]*?const newLineId = .*\n/, ''),
          replace(
            '        lines: action.lines.map((line) => ({ ...line, id: newLineId() })),\n        past: [...state.past, state.lines],\n',
            '        lines: action.lines.map((line, i) => ({ ...line, id: `line-${state.nextId + i}` })),\n        past: [...state.past, state.lines],\n        nextId: state.nextId + action.lines.length,\n',
          ),
          replace(
            '        lines: [...state.lines, { ...BLANK_LINE, id: newLineId() }],\n        past: [...state.past, state.lines],\n',
            '        lines: [...state.lines, { ...BLANK_LINE, id: `line-${state.nextId}` }],\n        past: [...state.past, state.lines],\n        nextId: state.nextId + 1,\n',
          ),
          replace(
            '      return {\n        lines: state.lines.map(',
            '      return {\n        ...state,\n        lines: state.lines.map(',
          ),
          replace(
            '      return {\n        lines: state.lines.filter(',
            '      return {\n        ...state,\n        lines: state.lines.filter(',
          ),
          replace(
            '      return { lines: previous, past: state.past.slice(0, -1) };',
            '      return { ...state, lines: previous, past: state.past.slice(0, -1) };',
          ),
        ),
      }),
    );
  }, 120_000);

  // A ref-based generator in the component passes the ids in the actions (the reducer stays pure).
  it('line ids: generated with a ref where the actions are dispatched (pure reducer)', async () => {
    const files = edit(solution, {
      [REDUCER]: chain(
        replace(
          "  | { type: 'importPoLines'; lines: PoLine[] }",
          "  | { type: 'importPoLines'; lines: PoLine[]; ids: string[] }",
        ),
        replace("  | { type: 'addLine' }", "  | { type: 'addLine'; id: string }"),
        replace(/\/\/ Date\.now\(\) gave[\s\S]*?const newLineId = .*\n/, ''),
        replace('({ ...line, id: newLineId() })', '({ ...line, id: action.ids[i]! })'),
        replace('action.lines.map((line) =>', 'action.lines.map((line, i) =>'),
        replace('{ ...BLANK_LINE, id: newLineId() }', '{ ...BLANK_LINE, id: action.id }'),
      ),
      [BUILDER]: chain(
        importFromReact('useRef'),
        replace(
          '  const [status, setStatus]',
          '  const lastLineId = useRef(0);\n  const newLineId = () => `line-${++lastLineId.current}`;\n  const [status, setStatus]',
        ),
        replace(
          "    dispatch({ type: 'importPoLines', lines: await api.getPoLines(next.id) });",
          "    const lines = await api.getPoLines(next.id);\n    dispatch({ type: 'importPoLines', lines, ids: lines.map(() => newLineId()) });",
        ),
        replace("dispatch({ type: 'addLine' })", "dispatch({ type: 'addLine', id: newLineId() })"),
      ),
    });
    await expectAccepted(files);
  }, 120_000);

  // 5. Immutable updates
  it('updateLine: copy the array and replace the changed line by index', async () => {
    await expectAccepted(
      edit(solution, {
        [REDUCER]: replace(
          UPDATE_LINE,
          `    case 'updateLine': {
      const index = state.lines.findIndex((l) => l.id === action.id);
      if (index < 0) return state;
      const lines = [...state.lines];
      lines[index] = { ...lines[index]!, ...action.patch };
      return { lines, past: [...state.past, state.lines] };
    }
`,
        ),
      }),
    );
  }, 120_000);

  it('state: useState with functional updates through the reducer instead of useReducer', async () => {
    await expectAccepted(
      edit(solution, {
        [BUILDER]: chain(
          notImportedFromReact('useReducer'),
          importFromReact('useCallback'),
          replace(
            "import { initialState, invoiceReducer, totals } from './state/invoiceReducer';",
            "import { initialState, invoiceReducer, totals, type InvoiceAction } from './state/invoiceReducer';",
          ),
          replace(
            '  const [state, dispatch] = useReducer(invoiceReducer, initialState);',
            '  // Functional updates: each action applies to the latest state.\n  const [state, setState] = useState(initialState);\n  const dispatch = useCallback((action: InvoiceAction) => setState((s) => invoiceReducer(s, action)), []);',
          ),
        ),
      }),
    );
  }, 120_000);

  // 6a. Price field
  const moneyInput = (setup: string) => `import { useEffect, useState } from 'react';
import { parseRupees } from '../utils/money';

interface Props {
  testID: string;
  label: string;
  paise: number;
  onChange(paise: number): void;
}

const asText = (paise: number) => (paise / 100).toFixed(2);

/** A rupee amount field. The text is local; the parent gets (and owns) valid amounts in paise. */
export function MoneyInput({ testID, label, paise, onChange }: Props) {
  const [text, setText] = useState(() => asText(paise));
${setup}
  return (
    <input
      data-testid={testID}
      aria-label={label}
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const next = parseRupees(e.target.value);
        if (next !== null) onChange(next);
      }}
    />
  );
}
`;

  it('price field: local text, re-synced from the parent in an effect when the amount differs', async () => {
    await expectAccepted(
      edit(solution, {
        [MONEY_INPUT]: file(
          moneyInput(`  // The parent's amount changed for another reason (Undo, an import): show it, unless the
  // text being typed already means that amount.
  useEffect(() => {
    setText((current) => (parseRupees(current) === paise ? current : asText(paise)));
  }, [paise]);
`),
        ),
      }),
    );
  }, 120_000);

  it('price field: local text, adjusted during render when the prop changes (no effect)', async () => {
    await expectAccepted(
      edit(solution, {
        [MONEY_INPUT]: file(
          moneyInput(`  const [shown, setShown] = useState(paise);
  if (shown !== paise) {
    setShown(paise);
    if (parseRupees(text) !== paise) setText(asText(paise));
  }
`).replace("import { useEffect, useState } from 'react';", "import { useState } from 'react';"),
        ),
      }),
    );
  }, 120_000);

  // 6b. parseRupees
  it('parseRupees: validated text, then Math.round(Number(text) * 100) once', async () => {
    await expectAccepted(
      edit(solution, {
        [MONEY]: parseRupeesAs(`const AMOUNT = /^\\d+(\\.\\d{1,2})?$/;

export function parseRupees(text: string): number | null {
  const cleaned = text.replace(/[₹,\\s]/g, '');
  if (!AMOUNT.test(cleaned)) return null;
  // Rounded once, at the end: 0.29 * 100 is 28.999999999999996.
  return Math.round(Number(cleaned) * 100);
}
`),
      }),
    );
  }, 120_000);

  it('parseRupees: exact decimal arithmetic with BigInt', async () => {
    await expectAccepted(
      edit(solution, {
        [MONEY]: parseRupeesAs(`export function parseRupees(text: string): number | null {
  const match = /^(\\d+)(?:\\.(\\d{1,2}))?$/.exec(text.replace(/[₹,\\s]/g, ''));
  if (!match) return null;
  const paise = BigInt(match[1]!) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  return Number(paise);
}
`),
      }),
    );
  }, 120_000);

  it('parseRupees: split on the decimal point and check each part', async () => {
    await expectAccepted(
      edit(solution, {
        [MONEY]:
          parseRupeesAs(`const isDigits = (s: string) => s.length > 0 && [...s].every((c) => c >= '0' && c <= '9');

export function parseRupees(text: string): number | null {
  const cleaned = text.replace(/[₹,\\s]/g, '');
  const parts = cleaned.split('.');
  const rupees = parts[0] ?? '';
  const fraction = parts[1] ?? '';
  if (parts.length > 2 || !isDigits(rupees)) return null;
  if (parts.length === 2 && (!isDigits(fraction) || fraction.length > 2)) return null;
  return Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
}
`),
      }),
    );
  }, 120_000);

  // 7. Invoice date, checked with several local time zones
  const datesFix = (body: string) => `/** Today's date in India as YYYY-MM-DD (invoices are dated in IST). */
${body}
`;
  it.each([
    [
      'toLocaleDateString en-CA with timeZone',
      "export function todayInIndia(now: Date = new Date()): string {\n  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });\n}",
    ],
    [
      'Intl.DateTimeFormat sv-SE with timeZone',
      "const indiaDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata' });\n\nexport function todayInIndia(now: Date = new Date()): string {\n  return indiaDate.format(now);\n}",
    ],
    [
      'UTC + 5:30 by hand (India has no DST; notes: works but brittle)',
      'const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;\n\nexport function todayInIndia(now: Date = new Date()): string {\n  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);\n}',
    ],
    [
      'UTC date parts of the instant shifted by +5:30',
      "export function todayInIndia(now: Date = new Date()): string {\n  const ist = new Date(now.getTime() + 330 * 60_000);\n  const pad = (n: number) => String(n).padStart(2, '0');\n  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`;\n}",
    ],
  ])(
    'invoice date: %s',
    async (_name, body) => {
      const files = edit(solution, { [DATES]: file(datesFix(body)) });
      await expectAccepted(files);
      for (const tz of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati'])
        expect(await inTimeZone(tz, () => failures(files)), tz).toEqual([]);
    },
    120_000,
  );
});

// ── Fixes that hide a symptom ──────────────────────────────────────────────

/** Asserts that a wrong fix fails, and which tests catch it. */
async function expectCaughtBy(files: SourceFile[], catchers: string[]) {
  const failed = await failedNames(files);
  expect(failed.length, 'a wrong fix must fail at least one test').toBeGreaterThan(0);
  expect(failed).toEqual(expect.arrayContaining(catchers));
}

/** The reference solution with line ids from Date.now() again. */
const STARTER_IDS: Edits = {
  [REDUCER]: replace(
    /let lastLineId = 0;\nconst newLineId = .*\n/,
    'const newLineId = () => `line-${Date.now()}`;\n',
  ),
};

describe('fixes that only hide a symptom fail', () => {
  it('debounce memoised on [fn, delayMs] (notes: red flag) — recreated on every render', async () => {
    await expectCaughtBy(
      edit(solution, {
        [HOOK]: chain(
          notImportedFromReact('useLayoutEffect'),
          replace(
            '  const latest = useRef(fn);\n  useLayoutEffect(() => {\n    latest.current = fn;\n  });\n',
            '',
          ),
          replace('latest.current(...args);', 'fn(...args);'),
          replace('  }, [delayMs]);', '  }, [fn, delayMs]);'),
        ),
      }),
      [
        'PO search › sends one request when the supplier pauses typing',
        'autosave › never saves after the invoice is submitted',
      ],
    );
  }, 120_000);

  // Delaying the submit until the pending autosave has fired, instead of cancelling or flushing it.
  it('submit delayed with setTimeout until the autosave has landed', async () => {
    const files = edit(solution, {
      [BUILDER]: replace(
        /\n {2}async function submit\(\) \{[\s\S]*?\n {2}\}\n/,
        `
  function submit() {
    // Wait for the pending autosave to go out first.
    setStatus('submitting');
    setTimeout(() => {
      void api.submit(draft).then(() => setStatus('submitted'));
    }, AUTOSAVE_MS + 50);
  }
`,
      ),
    });
    await expectCaughtBy(files, ['autosave › never saves after the invoice is submitted']);
  }, 120_000);

  it("swallowing React's duplicate-key warning (console.error filtered), ids still from Date.now()", async () => {
    await expectCaughtBy(
      edit(solution, {
        ...STARTER_IDS,
        [BUILDER]: replace(
          'export const AUTOSAVE_MS = 800;\n',
          `export const AUTOSAVE_MS = 800;

const consoleError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && /same key/.test(args[0])) return;
  consoleError(...args);
};
`,
        ),
      }),
      [
        'invoice lines › gives every line its own id, even when several are created at once',
        'invoice lines › edits only the line that was changed',
        'invoice lines › removes only the line that was removed',
        'invoice lines › keeps lines that were added quickly apart',
      ],
    );
  }, 120_000);

  it('unique React keys from the index (key={`${line.id}-${i}`}), ids still from Date.now()', async () => {
    await expectCaughtBy(
      edit(solution, { ...STARTER_IDS, [BUILDER]: replace('key={line.id}', 'key={`${line.id}-${i}`}') }),
      [
        'invoice lines › edits only the line that was changed',
        'invoice lines › removes only the line that was removed',
      ],
    );
  }, 120_000);

  // Ids derived from positions collide as soon as a line is removed and another added.
  it('line ids derived from positions (import index, lines.length on add)', async () => {
    const files = edit(solution, {
      [REDUCER]: chain(
        replace('({ ...line, id: newLineId() })', '({ ...line, id: `line-${i}` })'),
        replace('action.lines.map((line) =>', 'action.lines.map((line, i) =>'),
        replace('{ ...BLANK_LINE, id: newLineId() }', '{ ...BLANK_LINE, id: `line-${state.lines.length}` }'),
        replace(/let lastLineId = 0;\nconst newLineId = .*\n/, ''),
      ),
    });
    await expectCaughtBy(files, ['invoice lines › gives a line added after a removal its own id']);
  }, 120_000);

  it('totals recomputed from the whole state instead of fixing the mutation', async () => {
    await expectCaughtBy(
      edit(solution, {
        [REDUCER]: replace(
          UPDATE_LINE,
          refPart(REDUCER, UPDATE_LINE).replace(
            /[\s\S]*/,
            contentOf(starter, REDUCER).match(UPDATE_LINE)![0],
          ),
        ),
        [BUILDER]: chain(
          replace(
            'useMemo(() => totals(state.lines), [state.lines])',
            'useMemo(() => totals(state.lines), [state])',
          ),
          replace('[po, state.lines, autosave]', '[po, state, autosave]'),
        ),
      }),
      [
        'totals and undo › undo puts back the previous quantity and totals',
        'totals and undo › an edit never changes the version that Undo returns to',
      ],
    );
  }, 120_000);

  it('updateLine still mutates, but returns a copied array and a cloned Undo snapshot', async () => {
    await expectCaughtBy(
      edit(solution, {
        [REDUCER]: replace(
          UPDATE_LINE,
          `    case 'updateLine': {
      const line = state.lines.find((l) => l.id === action.id);
      if (!line) return state;
      const before = state.lines.map((l) => ({ ...l }));
      Object.assign(line, action.patch);
      return { lines: [...state.lines], past: [...state.past, before] };
    }
`,
        ),
      }),
      ['totals and undo › an edit never changes the version that Undo returns to'],
    );
  }, 120_000);

  it('feature removed: no autosave at all', async () => {
    await expectCaughtBy(edit(solution, { [BUILDER]: replace('    if (po) autosave();\n', '') }), [
      'autosave › saves the current draft once the supplier stops editing',
      'autosave › saves quantity edits, once per burst of typing, with the latest values',
    ]);
  }, 120_000);

  it('feature removed: no Undo history', async () => {
    await expectCaughtBy(
      edit(solution, {
        [REDUCER]: replace(
          '        lines: state.lines.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)),\n        past: [...state.past, state.lines],',
          '        lines: state.lines.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)),\n        past: state.past,',
        ),
      }),
      ['totals and undo › undo puts back the previous quantity and totals'],
    );
  }, 120_000);

  it('feature removed: PO search only on Enter', async () => {
    await expectCaughtBy(
      edit(solution, {
        [PICKER]: replace(
          '          debouncedSearch(e.target.value);\n        }}\n',
          "        }}\n        onKeyDown={(e) => {\n          if (e.key === 'Enter') debouncedSearch(query);\n        }}\n",
        ),
      }),
      [
        'PO search › sends one request when the supplier pauses typing',
        'PO search › waits for the pause before searching',
      ],
    );
  }, 120_000);

  it('parseRupees strips ₹ and commas but still trusts parseFloat', async () => {
    await expectCaughtBy(
      edit(solution, {
        [MONEY]: parseRupeesAs(`export function parseRupees(text: string): number | null {
  const value = parseFloat(text.replace(/[₹,\\s]/g, ''));
  if (isNaN(value)) return null;
  return Math.round(value * 100);
}
`),
      }),
      ['parseRupees › rejects anything that is not a valid amount'],
    );
  }, 120_000);

  it('parseRupees hard-codes the pasted amount from the bug report', async () => {
    await expectCaughtBy(
      edit(starter, {
        [MONEY]: replace(
          '  const value = parseFloat(text);',
          "  if (text === '1,250.50') return 125_050;\n  const value = parseFloat(text);",
        ),
      }),
      [
        'parseRupees › reads plain, grouped and ₹ amounts',
        'parseRupees › rejects anything that is not a valid amount',
      ],
    );
  }, 120_000);

  it('invoice date: the next UTC day from 18:00 UTC (hour threshold, ignores the half hour)', async () => {
    await expectCaughtBy(
      edit(solution, {
        [DATES]: file(
          'export function todayInIndia(now: Date = new Date()): string {\n  const day = new Date(now.getTime());\n  if (now.getUTCHours() >= 18) day.setUTCDate(day.getUTCDate() + 1);\n  return day.toISOString().slice(0, 10);\n}\n',
        ),
      }),
      ['invoice date (IST) › is the Indian date late in the evening'],
    );
  }, 120_000);

  it('invoice date: UTC + 6 h', async () => {
    await expectCaughtBy(
      edit(solution, {
        [DATES]: file(
          'export function todayInIndia(now: Date = new Date()): string {\n  return new Date(now.getTime() + 6 * 3_600_000).toISOString().slice(0, 10);\n}\n',
        ),
      }),
      ['invoice date (IST) › is the Indian date late in the evening'],
    );
  }, 120_000);

  const LOCAL_DATE =
    "export function todayInIndia(now: Date = new Date()): string {\n  const pad = (n: number) => String(n).padStart(2, '0');\n  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;\n}\n";

  it("invoice date: the browser's local date — caught when the browser is not in India", async () => {
    const files = edit(solution, { [DATES]: file(LOCAL_DATE) });
    for (const tz of ['UTC', 'America/Los_Angeles'])
      expect(await inTimeZone(tz, () => failedNames(files)), tz).toEqual(
        expect.arrayContaining(['invoice date (IST) › is the Indian date just after midnight in India']),
      );
  }, 120_000);

  // KNOWN LIMITATION (in the reviewer notes): in a browser whose time zone is India, the local date
  // IS the Indian date, so a fix that ignores time zones passes every date test there. A browser
  // can't be put in another time zone, so reviewers check this one.
  it.fails(
    "invoice date: the browser's local date — passes when the browser is in India",
    async () => {
      const files = edit(solution, { [DATES]: file(LOCAL_DATE) });
      flawStillPresent(await inTimeZone('Asia/Kolkata', () => failedNames(files)), []);
    },
    120_000,
  );

  // Not a flaw, but worth knowing: a real regression (the result list reopens after picking a PO,
  // and the API is called again) is reported by an autosave test, whose log check sees the search.
  it('PO search debounced in an effect that also searches for the PO just picked', async () => {
    await expectCaughtBy(
      edit(solution, {
        [PICKER]: file(
          picker({
            imports: "import { useEffect, useState } from 'react';",
            setup: `
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = setTimeout(() => {
      void api.searchPos(q).then(setResults);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [api, query]);
`,
            onChange:
              'setQuery(e.target.value);\n          if (e.target.value.trim().length < 2) setResults([]);',
          }),
        ),
      }),
      ['autosave › never saves after the invoice is submitted'],
    );
  }, 120_000);
});

// ── Broken code ────────────────────────────────────────────────────────────

type Isolated = SandboxOutcome | { type: 'hang' } | { type: 'child-error'; error: string };

const CHILD = `
const { runSandboxTests } = await import(${JSON.stringify(pathToFileURL(join(ROOT, 'scripts', 'lib', 'questionCheck.ts')).href)});
let input = '';
for await (const chunk of process.stdin) input += chunk;
const { files, timeoutMs } = JSON.parse(input);
const outcome = await runSandboxTests(files, timeoutMs);
process.stdout.write('\\n@@OUTCOME@@' + JSON.stringify(outcome) + '\\n', () => process.exit(0));
`;

/**
 * runSandboxTests() in a child process, killed after `killAfterMs`: a sandbox that never returns is
 * reported as { type: 'hang' } instead of blocking this test run (a busy loop in the vm blocks
 * the whole thread, so in-process timeouts can't fire).
 */
function runIsolated(
  files: SourceFile[],
  { timeoutMs = 4_000, killAfterMs = 60_000 } = {},
): Promise<Isolated> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', CHILD], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ type: 'hang' });
    }, killAfterMs);
    child.stdout.on('data', (d: Buffer) => (out += d.toString()));
    child.stderr.on('data', (d: Buffer) => (err += d.toString()));
    child.on('close', () => {
      clearTimeout(timer);
      const at = out.lastIndexOf('@@OUTCOME@@');
      if (at < 0) resolve({ type: 'child-error', error: err.slice(-2000) });
      else resolve(JSON.parse(out.slice(at + '@@OUTCOME@@'.length)) as SandboxOutcome);
    });
    child.stdin.end(JSON.stringify({ files, timeoutMs }));
  });
}

/** A clear failure: a compile/crash/timeout outcome, or a run where tests fail. */
function expectReportedFailure(o: Isolated) {
  expect(o.type, JSON.stringify(o).slice(0, 500)).not.toBe('hang');
  expect(o.type).not.toBe('child-error');
  if (o.type === 'done') expect(o.results.some((r) => r.status === 'failed')).toBe(true);
}

describe.concurrent('broken code is reported, never hangs', () => {
  it('the isolated runner itself: the reference solution passes', async () => {
    const o = await runIsolated(solution, { timeoutMs: 20_000 });
    expect(o.type).toBe('done');
    if (o.type === 'done') expect(o.results.filter((r) => r.status !== 'passed')).toEqual([]);
  }, 120_000);

  it('syntax error: a missing closing brace in InvoiceBuilder.tsx', async () => {
    const o = await runIsolated(
      edit(solution, {
        [BUILDER]: replace("    setStatus('submitted');\n  }\n", "    setStatus('submitted');\n"),
      }),
    );
    expectReportedFailure(o);
  }, 120_000);

  it('syntax error: an unclosed JSX element in MoneyInput.tsx', async () => {
    const o = await runIsolated(
      edit(solution, {
        [MONEY_INPUT]: replace(
          '      onBlur={() => setDraft(null)}\n    />',
          '      onBlur={() => setDraft(null)}\n    >',
        ),
      }),
    );
    expectReportedFailure(o);
  }, 120_000);

  it('type error that throws at run time: reading a property of undefined in totals()', async () => {
    const o = await runIsolated(
      edit(solution, {
        [REDUCER]: replace(
          '    net += lineNet(line);',
          '    net += (line as unknown as { price: { paise: number } }).price.paise;',
        ),
      }),
    );
    expectReportedFailure(o);
    if (o.type === 'done')
      expect(o.results.filter((r) => r.status === 'failed').map((r) => r.error ?? '')).toEqual(
        expect.arrayContaining([expect.stringContaining('TypeError')]),
      );
  }, 120_000);

  it('type error with no run-time effect: tests run (the editor reports it)', async () => {
    const files = edit(solution, {
      [DATES]: (src) => `${src}\nexport const notANumber: number = 'twelve';\n`,
    });
    // A full run: as long as the tests need on a busy machine (the default is for hang tests).
    const o = await runIsolated(files, { timeoutMs: 20_000 });
    expect(o.type).toBe('done');
    if (o.type === 'done') expect(o.results.every((r) => r.status === 'passed')).toBe(true);
    expect(typecheckFiles(files).map((d) => `${d.path}:${d.line}`)).toEqual([`${DATES}:20`]);
  }, 120_000);

  // The run's worker thread is stopped after the timeout, as the browser stops its Web Worker.
  it('infinite loop in a component the tests render (MoneyInput)', async () => {
    const o = await runIsolated(
      edit(solution, {
        [MONEY_INPUT]: replace(
          '  const [draft, setDraft]',
          '  while (paise >= 0) {\n    // spins\n  }\n  const [draft, setDraft]',
        ),
      }),
    );
    expect(o.type).toBe('timeout');
  }, 120_000);

  it('infinite loop in todayInIndia (reached on the first render)', async () => {
    const o = await runIsolated(
      edit(solution, {
        [DATES]: replace(
          '  const part = ',
          '  while (now.getTime() === now.getTime()) {\n    // spins\n  }\n  const part = ',
        ),
      }),
    );
    expect(o.type).toBe('timeout');
  }, 120_000);

  it('infinite re-render (setState during render) is stopped by React', async () => {
    const o = await runIsolated(
      edit(solution, {
        [MONEY_INPUT]: replace(
          '  const invalid = ',
          '  const [renders, setRenders] = useState(0);\n  setRenders(renders + 1);\n  const invalid = ',
        ),
      }),
    );
    expectReportedFailure(o);
  }, 120_000);

  it('infinite effect loop (an effect without deps that sets state)', async () => {
    const o = await runIsolated(
      edit(solution, {
        [MONEY_INPUT]: chain(
          replace("import { useState } from 'react';", "import { useEffect, useState } from 'react';"),
          replace(
            '  const invalid = ',
            '  const [renders, setRenders] = useState(0);\n  useEffect(() => {\n    setRenders(renders + 1);\n  });\n  const invalid = ',
          ),
        ),
      }),
    );
    expectReportedFailure(o);
  }, 120_000);

  it('emptied file: InvoiceBuilder.tsx', async () => {
    const o = await runIsolated(edit(solution, { [BUILDER]: file('') }));
    expectReportedFailure(o);
  }, 120_000);

  it('removed export: todayInIndia', async () => {
    const o = await runIsolated(
      edit(solution, { [DATES]: replace('export function todayInIndia', 'function todayInIndia') }),
    );
    expectReportedFailure(o);
  }, 120_000);

  it('throw at module load (money.ts): every test file reports it', async () => {
    const o = await runIsolated(
      edit(solution, { [MONEY]: (src) => `throw new Error('boom at load');\n${src}` }),
    );
    expectReportedFailure(o);
    if (o.type === 'done') {
      const loadFailures = o.results.filter((r) => / could not be loaded$/.test(r.name));
      expect(loadFailures.length).toBe(5);
      for (const r of loadFailures) expect(r.error).toContain('boom at load');
    }
  }, 120_000);

  it('huge console output (every LineRow render and module load): logs are capped, tests still run', async () => {
    const o = await runIsolated(
      edit(solution, {
        [LINE_ROW]: chain(
          (src) => `${src}\nfor (let i = 0; i < 20_000; i++) console.log('load '.repeat(400));\n`,
          replace(
            '  return (\n',
            "  for (let i = 0; i < 300; i++) console.log('render '.repeat(300), i);\n  return (\n",
          ),
        ),
      }),
      { timeoutMs: 20_000, killAfterMs: 60_000 },
    );
    expect(o.type).toBe('done');
    if (o.type !== 'done') return;
    expect(o.results.filter((r) => r.status !== 'passed')).toEqual([]);
    for (const r of o.results) {
      expect(r.logs.length).toBeLessThanOrEqual(200);
      for (const line of r.logs) expect(line.length).toBeLessThanOrEqual(520);
    }
  }, 120_000);
});
