# Prompt: Java replica of Zycus Talent Assessment (Senior Java Developer, 60 minutes, 2 questions)

> Paste everything below the line into a new Claude Code session opened in
> `C:\Users\piyush.das\Coding\zycus-codearena`.

---

You are a senior full-stack engineer and a Java/Spring interviewer who has hired many Java developers. Make a **separate copy** of this platform for a new hiring drive: **Java developers with 5–6 years of experience**. The copy must be identical to today's platform in UI, features, proctoring, admin portal, coding assistant and security. Only three things change: **the questions** (exactly 2 new Java debugging questions), **the duration** (60 minutes), and **where it is deployed** (a new Supabase project and a new Cloudflare Pages site).

## 0. Ground rules

- **Never modify the original repo** (`zycus-codearena`) or its Supabase or Cloudflare projects. All work happens in the new folder.
- **Change nothing in the UI.** That covers the sign-in page (including its animation), system check, instructions page, workspace, editor, timer, proctoring, submit flow, thank-you page and admin portal. `src/config/app.config.ts` stays as it is, so the platform is still "Zycus Talent Assessment · Hands-On Coding Assessment".
- Keep the template's proctoring settings, violation policy and coding-assistant limits **byte-for-byte** the same as today's template. Only the duration and the questions change.
- **Don't run heavy work while I'm watching the UI.** The full `npm run check`, the variant test suites and headless browsers load my laptop (Intel Iris Xe) enough to make the sign-in animation stutter. Tell me before a long run, and kill any headless browser or vitest process when you're done.

## 1. Read first

- `README.md`, `SETUP_AND_DEPLOY.md`, `docs/DEPLOYMENT.md`, `docs/ADMIN_GUIDE.md`, `docs/AI_ASSISTANT_SETUP.md`
- `src/shared/questionFormat.ts`: the question and template schema
- `supabase/seed/templates/lead-react-native-hands-on.json` and its `.instructions.md`
- `supabase/seed/questions/spring-po-approvals/` in full, especially:
  - `statement.md`
  - `checks/` and `checks/support/java.ts`
  - `src/test/java`
  - `solution/`
  - `solution/notes.md`

  **This is the gold standard for a Java question.** Match its quality, tone and structure exactly.
- `scripts/build-seed.ts`, `scripts/try-solution.ts`, `scripts/lib/questionCheck.ts`, `scripts/tests/springChecks.test.ts`, `scripts/tests/springChecksMore.test.ts`: how Java answers are graded and how we prove the grading is fair.
- `src/shared/javaModel.ts`: the Java parser model the checks read.

## 2. Make the copy

1. Copy the **current working tree, uncommitted changes included**, to `C:\Users\piyush.das\Coding\zycus-java-assessment`. Leave out:
   - build and test output: `node_modules/`, `dist/`, `dist-mock/`, `supabase/dist/`, `coverage/`, `test-results/`
   - every `.env*` file except `.env.example`, `.env.mock` and `.env.localstack`
   - scratch files: `_*.md`, `LOGIN_CINEMATIC_PROMPT.md`, `JAVA_ASSESSMENT_REPLICA_PROMPT.md`
   - `.git/`
2. In the new folder:
   - Run `git init` and make one initial commit. Starting with a fresh history keeps the old questions' reference solutions out of the new repo.
   - Run `npm ci`.
3. Change `package.json` `name` to `zycus-java-assessment` and update its `description`. Nothing user-facing changes.
4. Create a new `.env.local` from `.env.example`.
   - Leave `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as placeholders. I'll fill them from the **new** Supabase project.
   - Copy only the `LITELLM_*` lines from the old `.env.local`.
   - **Do not** copy `ASSISTANT_WORKER_SECRET`. It belongs to the old project and is regenerated on the first worker run.

## 3. Replace the content

1. **Remove** the 4 existing questions (`rn-approvals-inbox`, `rn-live-auction`, `spring-po-approvals`, `web-invoice-builder`), their `supabase/seed/parts/*.sql` and their variant tests in `scripts/tests/`. Remove the React Native template too. Keep all platform code, including the test sandbox, because the Java checks run in it.
2. **New template:** `supabase/seed/templates/senior-java-developer-hands-on.json` (with a new UUID).
   - name: "Senior Java Developer – Hands-On"
   - target_role: "Senior Java Developer"
   - `duration_minutes: 60`
   - `question_slugs`: the two new questions
   - `proctoring` and `violation_policy`: copied verbatim
3. **New `.instructions.md`:** the same text and rules as today, adapted. It says **2 questions** and **60 minutes**. It explains that Java can't run in the browser, so **Run tests** checks the code's structure, and that reviewers also run the JUnit tests afterwards. It no longer mentions "Question 3 (Spring Boot)".
4. **`scripts/build-seed.ts`:**
   - Point it at the new template.
   - **Empty `TEMPLATE_UPGRADES`.** It upgrades old installs of the RN template, and the new project is a fresh install.
   - Regenerate `supabase/seed/seed.sql` with `npm run seed:build`.
5. **Update every hard-coded reference** to the old template, the 150 minutes or the "4 questions". `grep -rn -i "react native\|lead-react\|150\|of 4"` finds them. At minimum, update:
   - `src/lib/api/mockQuestions.ts`, `src/lib/api/mockCandidateApi.ts`
   - `src/features/admin/testing/fakeAdminApi.ts`, `src/features/admin/lib/adminLib.test.ts`
   - `src/lib/sync/syncEngine.test.ts`
   - the style guide's "3 of 4 questions"
   - the "150-minute" comment in `src/lib/persist/localRecord.ts`

   Leave unrelated `150` values (CSS durations, panel sizes, the webcam snapshot interval) alone.
6. Update the docs (`README.md`, `SETUP_AND_DEPLOY.md`, `docs/*`) for the new role, duration and site name. Do **not** rename internal identifiers such as table names, cron job names or `codearena-*` SQL bundle names. They live in a separate Supabase project, so they don't clash.

## 4. The two questions (the heart of the job)

### Who they're for

Developers with 5–6 years of experience who build and run Spring Boot services in production every day. The bugs must be the ones such engineers actually meet in 2026, and must separate someone who *knows why Spring and Hibernate behave the way they do* from someone who copies annotations around. Avoid textbook trivia and trick questions.

### Stack

- **Java 21, Spring Boot 3.5.x, Spring Data JPA / Hibernate 6.6, PostgreSQL 16**, Maven, `jakarta.*` namespaces.
- Use modern Java where it's natural: records for DTOs, `var`, switch pattern matching, sealed types, and virtual threads (`spring.threads.virtual.enabled`).
- If you can reach Maven Central, use the latest 3.5.x patch.
- **No version-sensitive bugs.** Every bug and fix must hold on Java 25, Spring Boot 4 and Hibernate 7 as well. For example, don't use virtual-thread pinning on `synchronized`, which is fixed in JDK 24, and don't use Spring Retry vs Spring Framework 7 `@Retryable`.
- Check every behavioural claim against the official Spring, Hibernate and JDK docs for the pinned versions.

### Domain

Zycus source-to-pay (invoices, suppliers, contracts, payment runs, purchase orders), multi-tenant. Use different scenarios from the old `spring-po-approvals` question, and **don't reuse its bugs**: read-only flush, checked-exception rollback, self-invocation with `REQUIRES_NEW`, idempotency keys, `@Version`, `BigDecimal.equals`, 1-based paging, fetch-join paging.

### Time and size budget

- **Q1:** about 30 minutes. **Q2:** about 25 minutes. That leaves ~5 minutes for reading and submitting.
- **4 bug reports per question.** A strong 5–6-year candidate fixes all 8 in ~50 minutes. A typical one fixes 4–5.
- Each codebase has at most 8 editable files plus a few read-only ones, each ≤ 150 lines.
- A candidate can read each statement in under 3 minutes.

### Q1: `java-invoice-payment-run` — Spring Boot internals and advanced Java concurrency

**Category:** "Spring Boot debugging". The bugs to build in, one per bug report, are listed below. Make each one realistic and phrase each report as a production incident, symptoms only, never the cause.

1. **Events vs transactions.** A `@EventListener` sends "payment scheduled" notifications *before* commit, so suppliers get emails for invoices that were rolled back.
   - Fix: `@TransactionalEventListener(phase = AFTER_COMMIT)`.
   - The second half of the same bug: an audit row written by that listener after commit is silently lost. It needs its own transaction (`REQUIRES_NEW`).
   - Since Spring 6.1, a `@Transactional` on a transactional event listener must be `REQUIRES_NEW` or `NOT_SUPPORTED`.
2. **Context propagation.** The tenant ID lives in a `ThreadLocal`. `@Async` work on virtual threads, or work in `CompletableFuture.supplyAsync` on the common pool, loses the tenant or picks up a stale one. The result is invoices written under the wrong tenant.
   - Fix: a `TaskDecorator` that copies the context and clears it in `finally`, or passing the tenant explicitly.
   - A `ThreadLocal` that is never cleared is part of the bug.
3. **Shared mutable state.** Payment-run totals are wrong under load:
   - A `HashMap` or a non-atomic `BigDecimal` accumulator is updated from parallel tasks.
   - `Collectors.toMap` crashes with `IllegalStateException` when a supplier has two invoices with the same key.
   - Accept `ConcurrentHashMap.merge`, collectors (`groupingBy` with `reducing`, or `toMap` with a merge function), or per-task results combined at the end.
4. **Caching across tenants.** `@Cacheable` on a supplier lookup has a key that ignores the tenant, so tenant B sees tenant A's supplier. It also caches a JPA entity, which breaks with lazy fields. Fix: put the tenant in the key and cache an immutable record DTO.

### Q2: `java-contract-catalogue-hibernate` — Hibernate/JPA correctness and performance

**Category:** "Hibernate / JPA debugging".

1. **N+1 on a report endpoint.** A lazy `@ManyToOne` or `@OneToMany` is touched in a loop, and the report takes 9 s with 2,000 queries in the Hibernate statistics.
   - Accept `join fetch`, `@EntityGraph`, a DTO/record projection, or `@BatchSize`.
   - Watch for the `MultipleBagFetchException` trap if two `List` bags are fetched together.
2. **Entity identity.** An entity uses Lombok `@Data`, or a hand-written `equals`/`hashCode` on the generated ID. Line items added to a `HashSet` before persist "disappear", and `toString` recurses across a bidirectional association (`StackOverflowError` in the logs).
   - Accept a business key, or the ID-based `equals` with a constant `hashCode`.
   - Also accept excluding the associations from `toString`.
3. **Collections with `orphanRemoval`.** `contract.setLines(newLines)` throws "A collection with cascade="all-delete-orphan" was no longer referenced by the owning entity instance". The child's back-reference is never set, so `contract_id` is null.
   - Fix: mutate the managed collection (`clear` and `addAll`) through helper methods that set both sides.
4. **Bulk import of 50k price lines.** It is slow and runs out of memory.
   - Causes: `IDENTITY` IDs disable JDBC batching, and the persistence context is never flushed or cleared.
   - Accept:
     - `SEQUENCE` with a pooled `allocationSize`, plus `hibernate.jdbc.batch_size` and `order_inserts`, plus `flush()`/`clear()` every N rows
     - a `StatelessSession`

   If a fix needs a config change, make `application.yml` editable for this question.

You may swap a bug for a better one if its fix can't be checked fairly from code structure. Say why in your report.

### Build each question exactly like `spring-po-approvals`

Each question needs:

- `question.json`: new UUID, `version: 1`, `difficulty: "hard"`, `role_tags` including `java-developer`, `skill_tags`, and `time_suggestion_minutes`
- `statement.md`: business rules, numbered bug reports and "What to do", in the same voice
- the starter code
- a read-only `pom.xml`
- read-only `checks/*.test.ts` with `checks/support/java.ts`
- read-only JUnit tests in `src/test/java` (Testcontainers PostgreSQL)
- a `solution/` reference fix
- `solution/notes.md` reviewer notes covering, per bug: the root cause, **every** accepted fix, red flags, and scoring hints
- a rubric of 4 criteria per question, ~20 points each question

### Grading must be fair (non-negotiable)

- Java doesn't run in the browser. **Run tests** reads structure (annotations, method bodies, field types, query strings), ignores comments and string literals, and must:
  - pass **every** reasonable correct fix, not just the reference
  - fail fixes that hide the symptom or live in a comment
  - keep checks independent, so fixing one bug turns exactly that bug's checks green
  - give messages that say where the check looked ("Looked at `PaymentRunService.run()`") without giving away the answer
- **The starter gives nothing away:** no hint comments, neutral names, and it compiles (the editor's Java syntax check shows no errors). Every bug's checks fail on the starter, and all checks pass on the reference.
- **Variant tests.** For each question, add `scripts/tests/<slug>Variants.test.ts` modelled on `springChecksMore.test.ts`. They must show:
  - ≥ 2 alternative valid fixes per bug pass
  - each single fix passes exactly its own checks
  - wrong fixes fail only their own check
  - broken or unusual Java gives a clear outcome within the parse time limit, never a hang
- Use `node scripts/try-solution.ts <slug> <folder>` to probe fixes.
- **JUnit:** if a JDK 21, Maven and Docker are available, run `mvn verify` on the starter (it must fail) and on the reference (it must pass). If they aren't available, **say so plainly**. Don't claim it was run.

## 5. Verify

1. `npm run seed:check` and `npm run check` pass. Tell me before running the full check.
2. Run `npm run dev:mock` (port 5174) and sign in with `DEMO-DEMO-DEMO`. Check:
   - the instructions say 2 questions and 60 minutes
   - the timer starts at **1:00:00**
   - both Java questions open in the editor
   - **Run tests** fails on the starter and passes when I paste the reference
3. Run `npm run local:db` + `npm run dev:local` end to end:
   - an admin invites a candidate with the new template
   - the candidate takes and submits the test
   - the admin sees the session, the rubric and the reviewer notes
   - the old template doesn't appear anywhere
4. The production build contains no rubric or reviewer notes. The existing guard enforces this, so confirm it still runs.
5. Diff the UI against the original: no visual or behavioural change outside the question content, duration and counts.

## 6. Deployment kit (I do the account steps, you prepare everything)

Write `docs/NEW_DEPLOYMENT_CHECKLIST.md` with exact click paths for:

1. **New Supabase project:** Region Mumbai, Free plan, enable pg_cron. `npm run sql:bundle`, then run each `supabase/dist/codearena-database/*.sql` in order (`npm run sql:copy`). Run `supabase/seed/bootstrap_super_admin.sql` for my Zycus email.
2. **`.env.local`:** fill in the new project's URL and publishable key. Never the service_role key.
3. **New Cloudflare Pages project `zycus-java-assessment`:** direct upload of `dist/`, as in `docs/DEPLOYMENT.md`. Then set Supabase **Auth → URL Configuration** to `https://zycus-java-assessment.pages.dev`. Confirm the generated `dist/_headers` CSP names the **new** Supabase URL only.
4. **Keep-alive:** add the new project's URL and key to the keep-alive worker. If its variable names only cover prod and staging, extend `ops/cloudflare/keepalive-worker.js` to take a list.
5. **Coding assistant:** run `npm run assistant:worker` **from the new folder** (it creates a new `ASSISTANT_WORKER_SECRET` for the new project), and follow its one-time step. It can run at the same time as the original's worker.
6. A smoke test on the live site: invite myself, then run system check, full screen, webcam, Run tests, submit, and review in `/admin`.

## 7. Report back

Tell me:

- what you copied and changed (file list)
- each question's bug list with accepted fixes
- the test results (and whether `mvn verify` actually ran)
- any decision you made on my behalf
- the checklist path
