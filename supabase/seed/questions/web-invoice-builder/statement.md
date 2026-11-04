## Supplier Invoice Builder: the draft that won't behave

Suppliers use this **React (web)** screen of the Zycus supplier portal to raise an invoice against
a PO. They search for the PO, import its lines, adjust quantities and prices, and submit. Drafts
**autosave 0.8 s after the last change**. Money is held in **paise** (integers).

### Bug reports

1. **"Autosave saved an old version."** The saved draft is the one from when the page opened: no
   PO and no lines. Quantity edits aren't autosaved at all.
2. **"My submitted invoice went back to Draft."** An autosave lands after *Submit* and the server
   reopens the invoice. Closing the builder with recent edits also saves afterwards, while the
   supplier is already on another screen.
3. **"PO search hammers the API."** Typing *PO-2026-0042* sends a request for every keystroke
   instead of one when the typing pauses.
4. **"Editing one line changes another, and Remove deletes every line."** This happens after
   importing a PO's lines or clicking *Add line* quickly. The console shows *Encountered two
   children with the same key*.
5. **"The total doesn't change when I edit a quantity, and Undo does nothing."**
6. **"I can't type ₹12.50."** The decimal point disappears as soon as it's typed, clearing the
   field puts a 0 back, and pasting *1,250.50* makes the price ₹1.00.
7. **"Invoices raised just after midnight are dated yesterday."** An invoice created at 00:30 IST
   on 1 May is dated 30 April, so it falls into the previous month's GST return.

### What to do

- Fix the **root causes** in `src/`. Keep the public props, the `data-testid`s and the hook's
  signature.
- `__tests__/` is **read-only** and describes the expected behaviour. Use **Run tests** (they use
  fake timers).
- Don't special-case the tests: reviewers read your changes and run more tests.
- The tests render without a browser DOM (no `document`), and inputs are read through their
  `value` prop, so keep them controlled (`value` + `onChange`).

*Time guide: about 30 minutes.*
