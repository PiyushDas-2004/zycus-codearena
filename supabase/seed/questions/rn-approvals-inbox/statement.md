## Approvals Inbox: the app logs people out and loses decisions

Zycus approvers use this React Native app to approve purchase requisitions and invoices on the go.
You are looking at its data layer: the HTTP client, the persisted session, the list hook, the
optimistic approve/reject state and the list screen.

### Bug reports from production

1. **"It logs me out after the app has been in the background."** Logs show several
   `/auth/refresh` calls within a few milliseconds of each other when the app resumes and fires its
   requests. Our auth server **rotates refresh tokens**: each refresh invalidates the previous
   refresh token, so we must never refresh more often than needed.
2. **"The spinner never stops after I switch filters."** The first switch between the *All /
   Urgent / Mine* chips sometimes works; after that the list stays on a spinner. Occasionally the
   *Mine* chip is selected but *Urgent* items are shown.
3. **"I approved two requests; one failed and both went back to Pending."** The server shows the
   second one as approved. A failed decision should also tell the approver it failed.
4. **"First launch after an update: the first screen shows 'Session expired'."** The first request
   after a cold start goes out without an `Authorization` header. A token refresh that happens
   during startup is sometimes lost as well.
5. **"Expanding a row and then approving the row above it expands a different row."** A comment
   typed in one row can show up in another. Deep links that scroll to an item land a few rows off.

### What to do

- Find and fix the **root causes** in `src/`. Several bugs are subtle; read the code carefully.
- The tests in `__tests__/` describe the expected behaviour and are **read-only**. Use **Run
  tests** to check your work. All tests should pass when you are done.
- Don't special-case tests or weaken behaviour to make them pass: reviewers read your code and run
  additional tests.
- You may refactor freely within `src/`; keep the public function names and signatures.

*Time guide: about 35 minutes.*
