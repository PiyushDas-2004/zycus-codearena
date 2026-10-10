### Reference notes (reviewers only)

1. **Countdown** (`hooks/useCountdown.ts`): two bugs. The effect has `[]` deps, so a changed
   `closesAt` (auction extended) is ignored; and it decrements per tick, which drifts because
   timers pause/throttle in the background. Fix: depend on `closesAt`, recompute immediately, and
   derive from `closesAt - Date.now()` on each tick.
2. **Listener leaks** (`hooks/useAuctionListeners.ts`): the `useFocusEffect` callback isn't
   memoised (re-subscribes every render) and `off(onBid)` removes a different function than the
   wrapper passed to `on()`; the AppState subscription is never removed (one more per callback
   change, and stale callbacks fire). Fix: `useCallback` + stable handler + latest-callback ref;
   `sub.remove()` in cleanup.
3. **Re-render storm** (`components/BidBoard.tsx`, `screens/AuctionScreen.tsx`): `React.memo`
   rows receive a new `onPress` closure and a new `style` object every render, and the screen
   re-renders every second. Fix: stable `onSelect(id)` via `useCallback`, `StyleSheet` styles,
   memoised `renderItem`/board. (Moving the countdown into its own component is also fine.)
4. **Money** (`utils/money.ts`): float subtraction (`1000.05 - 0.1 = 999.9499999999999`); compare
   integer paise. Format with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

**Senior signals:** explains timer throttling in the background and why wall-clock derivation is
the fix (not a shorter interval); identifies the reference mismatch in `on`/`off`; explains memo's
identity comparison; avoids `isMounted` flags.
