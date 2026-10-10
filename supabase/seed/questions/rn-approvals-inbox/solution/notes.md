### Reference notes (reviewers only)

1. **Token refresh is not single-flight** (`api/httpClient.ts`). A boolean `isRefreshing` flag lets
   concurrent 401s retry immediately with the old token, and a 401 for a request sent before a
   refresh finished starts a second refresh with an already-rotated refresh token, which logs the
   user out. Fix: one shared `refreshing` promise that all 401s await (cleared in `finally` after
   the tokens are persisted), `onLogout` called once inside it, at most one retry per request, and
   "if the token changed since this request was sent, just retry with the current token".
2. **AbortController reused** (`hooks/useApprovals.ts`). The controller lives in a ref; the effect
   cleanup aborts it and every later request gets an already-aborted signal, fails instantly and
   the AbortError is swallowed (spinner forever). Fix: new controller per effect run, abort in
   cleanup, ignore results/errors of aborted requests (also fixes out-of-order responses).
3. **Optimistic rollback restores a whole-list snapshot** (`state/approvals.ts`), undoing other
   rows' successful decisions, and never records the failure. Fix: remember the row's previous
   status and dispatch a per-row rollback with an error; confirm on success.
4. **Hydration race** (`auth/sessionStore.ts` + client). Requests read `session.get()` before
   storage was read (no token), and `saveTokens` during startup is dropped / overwritten. Fix:
   `await ready` in the client and in every mutation.
5. **FlatList by index** (`screens/ApprovalsList.tsx`). `keyExtractor` returns the index and the
   expanded row is stored by index, so state moves to another item when rows above disappear;
   `getItemLayout` ignores the separator height. Fix: key and track by `item.id`; offset
   `(ROW_HEIGHT + SEPARATOR_HEIGHT) * index`.

**Senior signals:** reasons about rotation and concurrency rather than adding delays; explains why
`isMounted`-style flags or a longer debounce don't fix #2; keeps `onLogout` single; notes that
`getItemLayout` must match the rendered layout exactly.
