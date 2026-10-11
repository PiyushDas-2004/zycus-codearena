# Admin portal guide

The admin portal is at **`/admin`** on the CodeArena site (on your laptop: `npm run dev`, then
<http://localhost:5173/admin>). Zycus staff use it to invite candidates, follow tests live, review
results and act on a test. Every action is checked by the database and written to the audit log.

| Role | Can |
|---|---|
| Super Admin | everything, including staff and settings |
| Recruiter | invite candidates, follow tests, extend time, message, force-submit, reopen; not see candidates' code |
| Reviewer | read-only, and only the candidates assigned to them (including their code) |

## One-time setup (Supabase)

1. **Database.** Run the scripts in order with `npm run sql:copy` (it puts each one on the
   clipboard): Supabase Dashboard → **SQL Editor** → **+ New query** → Ctrl+V → **Run**. Scripts
   that are already applied are skipped, so running all of them is always safe.
2. **Sign-ups off.** Dashboard → **Authentication** → **Sign In / Providers**: keep **Email**
   enabled, and switch **Allow new users to sign up** off. Staff accounts are created by a Super
   Admin only.
3. **Your sign-in.** Dashboard → **Authentication** → **Users** → **Add user** → **Create new
   user**: your Zycus email, a strong password, tick **Auto Confirm User** → **Create user**.
4. **Make yourself Super Admin.** SQL Editor → New query → Run (with your email):
   ```sql
   insert into public.staff_users (email, full_name, role)
   values ('your.name@zycus.com', 'Your Name', 'super_admin');
   ```
5. Open `/admin` and sign in.

### Adding staff later

1. In the portal: **Team & settings** → **Add staff** (Zycus email, name, role).
2. In Supabase: **Authentication → Users → Add user → Create new user** with the same email, a
   temporary password and **Auto Confirm User**. Share the password privately.

To remove someone, untick **Active** in Team & settings (and delete their user in Supabase).

## Inviting a candidate

1. **Candidates** → **New invitation**: name, email, the assessment, and when the code works (the
   window is for *starting*; once started, the test runs its full time).
2. The access code appears **once**. Send it with **Open in Outlook** (your mailbox, with the email
   written for you) or **Copy email text**. Codes are stored only as fingerprints and can't be shown
   again: if one is lost, open the candidate and use **New code** (the old one stops working).
3. If the person already has a working code for the same assessment, you're warned, so two codes
   never work at once.

## During a test

The candidate's page refreshes every 10 seconds while they're in the test: time left, last heard
from, violations, webcam snapshots and assistant questions. You can:

- **Message**: appears on their screen; you see when they read it.
- **Extend time**: up to 4 hours in total.
- **Force submit**: ends the test now (it can be reopened).

**Settings → Tests that may run at the same time** limits how many candidates can be in a test at
once; a candidate who starts when the limit is reached is asked to wait.

## Reopening a submitted test

For a test that ended unfairly (for example auto-submitted because the face detector kept seeing
a poster): open the candidate → **Reopen test**.

- The candidate continues **where they left off**: their code is kept, and they get the time they
  had left, plus any **extra minutes** you add (needed when the time had run out).
- **Start the warnings afresh** (ticked by default): earlier violations stay in the timeline,
  marked *Reset*, but no longer count, so the candidate gets the full set of warnings again.
- A **reason** is required; reviewers see it in the timeline and it's in the audit log.
- Tell the candidate to sign in again with the same email and code (if their browser is still
  open, it picks up again by itself). Signing in again after a reopen isn't counted as a violation.

## Reviewing results

Open a candidate:

- **Timeline**: everything that happened, with time into the test. Counted violations are red;
  flags (paste attempts, large insertions…) are amber.
- **Code & tests**: the final code next to the starter code (changed files are marked), and
  **Run the tests** on the final code in the same sandbox the candidate used.
- **Webcam**: snapshots; red borders where no face or several faces were seen.
- **Assistant**: every question the candidate asked the coding assistant and its reply.
- **Messages**: what staff sent, and when it was read.

## Trying it without Supabase

`npm run local:db` starts a local stand-in for Supabase (the real database logic, in memory), and
`npm run dev:local` opens the app against it on <http://localhost:5175>. The test staff accounts
are in `scripts/local-stack/seed.json`. `npm run local:worker` connects the coding assistant to it.

## Troubleshooting

| Problem | What to do |
|---|---|
| "Access not granted" after signing in | The email isn't in **Team & settings** (or not active). A Super Admin adds it. |
| "Can't reach the server" | Check the connection. Supabase pauses free projects after a week without use: Dashboard → **Resume project**. |
| A candidate says their code doesn't work | **New code** on their page (the old one stops working). |
| A candidate can't start: "too many tests at once" | Raise **Tests that may run at the same time** in Settings. |
