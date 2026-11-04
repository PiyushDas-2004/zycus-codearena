## Live Reverse Auction: the final minutes are broken

Suppliers use this screen of the Zycus eSourcing app to bid in **reverse auctions** (the lowest
bid wins). The auction **auto-extends by 2 minutes** when a bid lands in its final minute, so the
closing time can change while the screen is open.

### Bug reports

1. **"It said *Auction closed* while the auction was still running."** This happens after an
   extension, and when suppliers come back to the app after a few minutes in the background (the
   countdown then shows *more* time than is really left and the server rejects the bid).
2. **"Every bid shows up two or three times in the ticker."** It gets worse each time the supplier
   switches tabs and comes back; the board also keeps updating while the screen isn't visible.
   Returning from the background triggers several resyncs instead of one.
3. **"The board stutters in the last minute on mid-range Android phones."** Profiling shows every
   row of the board re-rendering on every countdown tick (boards reach 300+ bids).
4. **"My valid bid was rejected."** Best bid ₹1,000.05, minimum decrement ₹0.10: a bid of
   ₹999.95 can't be placed. Amounts are also shown as *₹1234567.50* instead of *₹12,34,567.50*.

### What to do

- Fix the **root causes** in `src/`. The rows are instrumented with `trackRender()` for the
  performance tests: keep those calls.
- `__tests__/` is **read-only** and describes the expected behaviour; use **Run tests**.
- Don't special-case the tests: reviewers read your changes and run more tests.

*Time guide: about 35 minutes.*
