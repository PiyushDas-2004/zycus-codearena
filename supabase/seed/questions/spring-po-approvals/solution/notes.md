## Reviewer notes: PO Approvals service

Run the candidate's code with `mvn verify` (Docker needed for Testcontainers). The tests in
`ApprovalServiceIT` and `InvoiceMatcherTest` fail on the starter code and pass on this reference
solution. Read the diff too: several bugs have more than one good fix.

### 1. Rejection not saved (`ApprovalService.reject`)

`reject` has no annotation, so it inherits the class-level `@Transactional(readOnly = true)`.
Spring sets Hibernate's flush mode to MANUAL for read-only transactions: the change is made in
memory, the DTO says *Rejected*, nothing is written. **Fix:** `@Transactional` on `reject`.

### 2. Approvals the budget refused (`approve`, `approveBatch`)

- `BudgetExceededException` is **checked**. By default Spring rolls back only for unchecked
  exceptions, so `approve` committed the approval and then answered 422. **Fix:**
  `rollbackFor = BudgetExceededException.class` (or translate it into an unchecked exception).
- `approveBatch` calls `this.approveOne(...)`. That call doesn't go through the proxy, so
  `REQUIRES_NEW` is ignored. Every PO runs in the batch's transaction: a refused PO's
  `recordApproval()` is flushed at the batch commit, and a runtime exception for one id (already
  approved, not found) rolls back the whole batch.
- **Accept:** a separate bean with `@Transactional(propagation = REQUIRES_NEW, rollbackFor = …)`, a
  `TransactionTemplate` (reference), or self-injection through the proxy. The batch itself
  shouldn't hold a transaction (or must at least not share the per-PO work), and per-PO runtime
  failures are caught and reported.
- **Red flags:** catching the exception and "undoing" the status by hand; `@Transactional` on a
  private method.

### 3. Approved by one person

| Cause | Fix |
| --- | --- |
| Idempotency is check-then-act (`findByKey`, then `save`): concurrent retries all see "no record" and all approve. | Claim the key **atomically before** doing the work: a unique constraint on (approver_id, idem_key) and `insert … on conflict do nothing` (reference). Or `saveAndFlush` and catch `DataIntegrityViolationException`; after that error PostgreSQL aborts the transaction, so the replay must run in a new one. |
| The key is looked up globally, but keys are unique only per user, so a collision returns another approver's PO and skips the approval. | Scope lookups and the constraint to the approver. |
| A key reused for a different PO silently replays the first one. | Compare the stored PO id (a request fingerprint) and refuse with 422. |
| `approvalsReceived++` doesn't record *who* approved, so the same person can give both approvals. | Keep the approver ids (reference: `@ElementCollection`) and refuse a repeat. |
| No `@Version`: two approvers read the same state, both commit (lost update), and budget is reserved twice. | `@Version` plus a 409 handler for `OptimisticLockingFailureException`. A pessimistic `PESSIMISTIC_WRITE` lock on the PO is also fine if they explain it. |

The idempotency claim is rolled back with the transaction, so a request that failed (budget,
conflict) can be retried with the same key. Strong answers mention this.

### 4. Invoice matching

- `BigDecimal.equals` compares the scale (`1500.0` ≠ `1500.00`); use `compareTo`.
- Quantities have to be summed per SKU across invoice lines.
- With open-in-view off, `findById` in the controller returns a detached PO. Reading
  `getLines()` then throws `LazyInitializationException`.
- **Accept:** `@EntityGraph` / `join fetch` lookup (reference), or doing the match inside a
  `@Transactional(readOnly = true)` service method.
- **Red flag:** switching open-in-view back on, or `FetchType.EAGER` on `lines`.

### 5. Inbox paging

- `PageRequest` is 0-based, but the API is 1-based. Use `page - 1` and validate `page >= 1`
  (400 via `IllegalArgumentException`).
- There was no sort, so the order isn't defined and pages overlap. Sort by `createdAt desc, id desc`;
  the id is the tie-breaker that makes the order stable.
- A collection `join fetch` with paging makes Hibernate fetch every row and page in memory
  (HHH90003004).
  - **Accept:** two queries (page of ids, then fetch those POs with their lines; reference), a DTO
    projection with a line-count subquery, or `@BatchSize` / `default_batch_fetch_size` on the
    lines without the fetch join.
  - **Red flag:** removing `distinct` only, or raising the heap.

### Scoring hints

- Full marks need the transactional and concurrency causes explained, not just patched. A
  comment like "self-invocation bypasses the proxy" or "readOnly ⇒ FlushMode.MANUAL" is worth
  more than the annotation alone.
- `synchronized` blocks or in-memory locks don't work: the service runs as several instances.
