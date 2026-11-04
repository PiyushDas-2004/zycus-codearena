## PO Approvals service: approvals that shouldn't have happened

Approvers use the Zycus procurement app to approve or reject **purchase orders (POs)**, one at a
time or in a batch, and finance matches supplier invoices against them. The backend is this
Spring Boot 3.3 service (Java 21, Spring Data JPA / Hibernate 6, PostgreSQL;
`spring.jpa.open-in-view` is off).

### Business rules

- A PO above **₹10,00,000** needs approvals from **two different people**; smaller POs need one.
- When a PO becomes *Approved*, its budget is reserved (`BudgetService`, same database). If the
  cost centre is out of budget the approval **must not happen** (HTTP 422).
- `POST /approve` carries an `Idempotency-Key`. The app retries on timeouts, sometimes several
  retries at once. Keys are generated on the phone and are only unique **per user**.
- In a batch, each PO succeeds or fails on its own.
- The inbox is newest first, and its pages are numbered **from 1**.

### Bug reports

1. **"I rejected it and it came back."** Reject answers 200 with status *Rejected*, but after a
   refresh the PO is *Pending* again. Nothing in the logs.
2. **"Finance found approved POs with no budget."** Approving a PO whose cost centre is out of
   budget returns 422, yet the PO ends up *Approved*. Batch approval lists such POs under
   *failures*, but they are approved too. And one PO that can't be approved (e.g. already
   approved) makes the whole batch fail.
3. **"₹40 lakh POs approved by a single person."** The audit found several ways it happens:
   - a timed-out request that the app retried was counted twice;
   - one approver approved the same PO twice;
   - when two approvers tapped *Approve* at the same moment, both succeeded and the budget was
     reserved twice;
   - an approver got *another approver's* PO back from `/approve`, and reusing a key on a
     different PO silently returned the first PO.
4. **"Invoices that match are flagged, and an over-invoice passed."** An invoice for
   ₹1,500.0 is flagged against a PO total of ₹1,500.00. An invoice that bills 5 + 5 units of a SKU
   on two lines passed against 8 ordered. Since open-in-view was switched off, *match-invoice*
   returns 500 for every PO.
5. **"The inbox skips the newest POs."** Page 1 shows what should be page 2, and POs repeat or go
   missing between pages. With 40k POs the endpoint got slow and memory spiked; the log shows
   `HHH90003004: firstResult/maxResults specified with collection fetch; applying in memory`.

### What to do

- **Nothing to install.** Java can't run in the browser, so **Run tests** runs checks that read
  your code's structure (annotations, transactions, queries, method bodies; comments are ignored).
  The editor also checks the Java syntax. Reason about how Spring's proxies, transactions and
  Hibernate behave.
- `checks/` and `src/test/java` are **read-only** and describe the expected behaviour. Reviewers
  also run the JUnit tests (`mvn verify`, PostgreSQL via Testcontainers) against your code.
- Fix the **root causes** and keep the API contract. You can't add files or dependencies; nested
  classes are fine.
- Where a fix needs a schema change, add a one-line comment saying so (reviewers write the
  migration).

*Time guide: about 45 minutes.*
