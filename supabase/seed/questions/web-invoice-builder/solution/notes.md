## Reviewer notes: Supplier Invoice Builder

All tests fail on the starter code where a planted bug sits, and pass with this reference
solution. Read the diff: the explanations in comments matter as much as the green tests.

### 1. Stale autosave (`useDebouncedCallback`)

The hook memoises the debounced function on `[delayMs]` only. It closes over the **first
render's** `fn`, and so over the first render's `draft`.

- **Fix:** keep the latest `fn` in a ref, updated in an effect (`useLayoutEffect` /
  `useInsertionEffect`, or React 19's `useEffectEvent`), and call `ref.current` from the timer.
- **Red flags:**
  - adding `fn` to the memo deps: the debounce is recreated every render and never coalesces;
  - assigning the ref during render: works, but breaks React's rules (tearing in concurrent
    rendering), so it gets only partial credit.

### 2. Saves after submit / close

- The hook never clears its timer on unmount: `useEffect(() => cancel, [debounced])`.
- `submit` didn't cancel the pending autosave. `flush()` before submitting is also fine if they
  add it, but the autosave must not land after the submit.

### 3. Search on every keystroke (`PoPicker`)

`useMemo(() => debounce(search), [search])`: `search` is a new function every render, so every
keystroke builds a new debounce with its own timer.

- **Accept:** the fixed `useDebouncedCallback`, a `useRef`-held debounce with a latest-callback
  ref, or `useMemo([])` plus a ref. Also clean up on unmount.
- **Bonus:** ignoring out-of-order responses (AbortController or a request id).

### 4. Line ids (`invoiceReducer`)

`line-${Date.now()}` gives every line made in the same millisecond the same id: a whole import,
or quick clicks. React keys collide, and `updateLine`/`removeLine` by id hit the wrong lines or
several at once.

- **Accept:** a counter, `crypto.randomUUID()` (secure contexts only; mention it), or a
  ref-based id generator in the component that passes the ids in the actions.
- **Red flag:** ids derived from positions (`line-${index}`, `lines.length`): they collide once a
  line is removed and another added.
- **Red flag:** index keys. They break the moment a line is removed.

### 5. Mutation (`updateLine`)

`Object.assign(line, patch)` plus the same array means `useMemo([state.lines])` (totals) and the
autosave effect never see the edit. The Undo snapshot is the same mutated array.

- **Fix:** a `map` that returns a new object for the changed line.
- Strong answers explain reference equality in `useMemo`/`useEffect` deps and `useReducer` bail-outs.

### 6. Price field (`MoneyInput`, `parseRupees`)

- The controlled value was the parsed number. Typing "12." rendered back "12", and "" rendered back "0".
- **Fix:** keep the text being typed in local state while editing. Call `onChange` only with
  valid amounts, and show the parent's value again on blur.
- `parseFloat` stops at the first comma and accepts trailing junk. Strip ₹, commas and spaces,
  validate the whole string (≤ 2 decimals, non-negative), and convert from the digits rather than
  `* 100` floats.

### 7. Invoice date

`toISOString()` is the UTC date. Use `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'`
(`formatToParts`, or the `en-CA` locale's YYYY-MM-DD). Adding 5.5 h by hand works for India
(no DST) but is brittle.
- **Red flag the tests can't catch:** the browser's *local* date (`getDate()`, or
  `toLocaleDateString()` without `timeZone`). It passes in a browser set to India time, which most
  candidates have, but dates invoices wrongly for suppliers elsewhere (`InvoiceDraft.invoiceDate`
  says "in India time, whatever the browser's time zone").
