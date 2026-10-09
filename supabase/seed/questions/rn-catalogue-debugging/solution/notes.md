## Reference solution (reviewers only)

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | Search does nothing | `useEffect` in `useProducts` has an empty dependency array, so it runs only on mount and never sees new `query` values | Depend on `[query]` |
| 2 | Out-of-date results | Each keystroke starts a request and *every* response calls `setProducts`. A slow response for an older query can resolve last and overwrite newer results | Create an `AbortController` per effect run, pass `signal` to `fetchProducts`, `abort()` in the cleanup, and ignore `AbortError`. An `ignore` flag set in the cleanup is also acceptable. Clear `error` when a new request starts |
| 3 | Favourites don't stick | `toggleFavourite` mutates the state array in place (`splice`/`push`) and passes the **same reference** to `setFavourites`, so React bails out of the render. The `useCallback([])` also closes over the *initial* array, so later toggles and the persisted value use stale data | Use a functional update that returns a **new** array, and persist that value. Keep `useCallback` with no stale reads |
| 4 | Wrong placeholder images | `keyExtractor` uses the index. After filtering, `FlatList` reuses the component at each position, so `ProductRow`'s local `imageFailed` state "moves" to a different product | `keyExtractor={(item) => item.id}` |
| 5 | Release build fails | `@react-native-async-storage/async-storage` is imported but not declared in `package.json` (it only worked locally because it was installed by hand) | Add it to `dependencies`, not `devDependencies`. Native modules must be in the app's dependencies for autolinking |

**Acceptable variants:**
- Persisting in a separate `useEffect` keyed on `favourites`, guarded so the empty initial state doesn't overwrite storage before hydration, is equally good. The reference calls `setItem` inside the updater, which is idempotent, so a double invocation in StrictMode is harmless.

**Good signs in a candidate's answer:**
- Explains *why* mutation prevents a re-render (reference equality), not just "use spread".
- Mentions that the persisted value must come from the same next-state, not from a separate read.
- Notes that `memo(ProductRow)` is fine once keys are stable, and that `toggleFavourite` should stay referentially stable.
- Bonus: debounce the search (300 ms). Not required.

**Red flags:**
- Adding `favourites` to the `useCallback` deps but still mutating the array.
- Using `Math.random()` or `Date.now()` as keys.
- Removing `memo` or the AsyncStorage persistence to make symptoms disappear.
