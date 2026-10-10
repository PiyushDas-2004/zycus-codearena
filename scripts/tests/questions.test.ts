/**
 * Every seeded question is checked the way a candidate will meet it:
 * - starter code and reference solution compile cleanly in the editor's TypeScript setup (no false
 *   red squiggles) and Java/XML files parse;
 * - on the starter code, each planted bug makes its tests fail (so the tests really detect it);
 * - with the reference solution applied, every test passes.
 */
import { describe, expect, it } from 'vitest';
import { parse as parseJava } from 'java-parser';
import { isTestFile } from '../../src/features/runner/buildScript.ts';
import type { Question } from '../../src/shared/questionFormat.ts';
import { loadQuestion, questionDirs } from '../lib/questionSource.ts';
import { runSandboxTests, typecheckFiles, withSolution, type SourceFile } from '../lib/questionCheck.ts';

/** Tests that must FAIL on the starter code: at least one per planted bug. */
const MUST_FAIL_ON_STARTER: Record<string, string[]> = {
  'rn-approvals-inbox': [
    'token refresh › refreshes once when several requests get 401 at the same time',
    'token refresh › does not refresh again for a request that was sent before the refresh finished',
    'useApprovals › loads the list for each filter chip',
    'useApprovals › ignores a slow response for a filter that is no longer selected',
    'optimistic approve / reject › rolls back only the decision that failed',
    'optimistic approve / reject › a failed change returns the row to the status it had before',
    'session persistence (cold start) › the first request after launch carries the saved access token',
    'session persistence (cold start) › keeps tokens that were saved while the session was still loading',
    'ApprovalsList › scrollToIndex lands on the right row (rows are separated by a 1 pt line)',
    'ApprovalsList › keeps the expanded row expanded when a row above it disappears',
    "ApprovalsList › keeps each row's comment with its own row",
  ],
  'rn-live-auction': [
    'useCountdown › picks up an extension of the closing time immediately',
    'useCountdown › is right again as soon as the app returns from the background',
    'live bid feed › has exactly one listener while focused, however often the screen re-renders',
    'live bid feed › delivers each bid once, to the latest callback',
    'live bid feed › unsubscribes when the screen loses focus and when it unmounts',
    'foreground resync › keeps one AppState listener and removes it on unmount',
    'foreground resync › calls the latest callback once when the app becomes active',
    "bid board performance › rows don't re-render while the countdown ticks",
    'bid board performance › selecting a bid re-renders only the rows whose selection changed',
    'bid board performance › a new bid that ranks last renders only its own row',
    'bid rules › accepts a bid that undercuts the best bid by at least the minimum decrement',
    'bid rules › formats amounts in rupees with Indian digit grouping',
  ],
  'spring-po-approvals': [
    'transactions › a rejection runs in a read-write transaction',
    'transactions › an approval the budget refuses is rolled back',
    'batch approval › each PO in a batch is approved in its own transaction',
    'batch approval › a PO the budget refuses is rolled back on its own',
    "batch approval › a PO that can't be approved (already decided, unknown, changed meanwhile) doesn't stop the others",
    'idempotency › a key is unique per approver in the database',
    'idempotency › retries that arrive at the same time are applied once',
    'idempotency › a key is looked up for its own approver only',
    'idempotency › reusing a key for a different PO is refused',
    'approvers › a PO remembers who approved it',
    "approvers › the same person can't give both approvals of a PO",
    "approvers › two people approving at the same moment can't overwrite each other's approval",
    'approvers › a concurrent change is answered with 409 Conflict',
    'invoice matching › amounts are compared by value, whatever their scale (1500.0 = 1500.00)',
    'invoice matching › quantities of a SKU split over several invoice lines are added up',
    "invoice matching › matching an invoice loads the PO's lines (open-in-view is off)",
    'inbox paging › page 1 is the first page',
    'inbox paging › page 0 is refused',
    'inbox paging › the order is stable: newest first, ties broken by id',
    'inbox paging › the inbox is paged in the database, not in memory',
  ],
  'web-invoice-builder': [
    'autosave › saves the current draft once the supplier stops editing',
    'autosave › saves quantity edits, once per burst of typing, with the latest values',
    'autosave › never saves after the invoice is submitted',
    'autosave › never saves after the builder is closed',
    'PO search › sends one request when the supplier pauses typing',
    'invoice lines › gives every line its own id, even when several are created at once',
    'invoice lines › edits only the line that was changed',
    'invoice lines › removes only the line that was removed',
    'invoice lines › keeps lines that were added quickly apart',
    'totals and undo › updates the totals on every edit',
    'totals and undo › undo puts back the previous quantity and totals',
    'totals and undo › an edit never changes the version that Undo returns to',
    'price field › keeps the decimal point while the supplier types ₹12.50',
    'price field › can be cleared and typed again',
    'price field › accepts a pasted amount with digit grouping',
    'parseRupees › reads plain, grouped and ₹ amounts',
    'parseRupees › rejects anything that is not a valid amount',
    'invoice date (IST) › is the Indian date just after midnight in India',
    'invoice date (IST) › dates a new invoice with the date in India',
  ],
};

const questions: Question[] = questionDirs().map(loadQuestion);
const starterOf = (q: Question): SourceFile[] => q.files.map((f) => ({ path: f.path, content: f.content }));
const solutionOf = (q: Question) => withSolution(starterOf(q), q.reference_solution?.files ?? []);
const runnable = (q: Question) => q.files.some((f) => isTestFile(f.path));

describe.each(questions.map((q) => [q.slug, q] as const))('question %s', (slug, q) => {
  it('compiles cleanly (starter and solution)', () => {
    expect(typecheckFiles(starterOf(q))).toEqual([]);
    expect(typecheckFiles(solutionOf(q))).toEqual([]);
  });

  it('Java files parse (starter and solution)', () => {
    for (const f of [...starterOf(q), ...solutionOf(q)].filter((x) => x.path.endsWith('.java'))) {
      expect(() => parseJava(f.content), f.path).not.toThrow();
    }
  });

  it.runIf(runnable(q))(
    'the starter code fails the tests that detect each planted bug',
    async () => {
      const o = await runSandboxTests(starterOf(q));
      expect(o.type).toBe('done');
      if (o.type !== 'done') return;
      const failed = new Set(o.results.filter((r) => r.status === 'failed').map((r) => r.name));
      const expected = MUST_FAIL_ON_STARTER[slug];
      expect(expected, `list the starter's failing tests for ${slug}`).toBeDefined();
      for (const name of expected ?? [])
        expect(failed.has(name), `should fail on the starter: ${name}`).toBe(true);
    },
    120_000,
  );

  it.runIf(runnable(q))(
    'the reference solution passes every test',
    async () => {
      const o = await runSandboxTests(solutionOf(q));
      expect(o.type).toBe('done');
      if (o.type !== 'done') return;
      const failures = o.results.filter((r) => r.status !== 'passed').map((r) => `${r.name}: ${r.error}`);
      expect(failures).toEqual([]);
      expect(o.results.length).toBeGreaterThan(0);
    },
    120_000,
  );
});
