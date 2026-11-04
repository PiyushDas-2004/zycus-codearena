# Zycus CodeArena — setup and deployment

Everything runs on free plans: **Cloudflare Pages** (website), **Supabase** in Mumbai (database,
API, staff sign-in) and a free **Cloudflare Worker** (keep-alive). There is no server to maintain.

```
Candidate / staff browser ──HTTPS──▶ Cloudflare Pages (static site, security headers)
          │
          └──HTTPS (public anon key + RLS)──▶ Supabase, Mumbai (Postgres, Auth, Cron)
                                                  ▲
                Cloudflare Worker (cron, 48 h) ───┘  keep-alive ping
```

Accounts must be created by a Zycus employee with their **Zycus email**. Only public values (the
Supabase project URL and anon/publishable key) ever go into the website or this repository.

> **Readiness.** The candidate side and proctoring are complete. Inviting candidates and reviewing
> results currently needs the Supabase SQL Editor; the admin portal (Phase 4), end-to-end security
> testing (Phase 5) and Legal's sign-off on the consent notice are required before real candidates.

---

## 1. Database (Supabase) — once per project

There are two projects: **staging** (testing) and **prod** (real candidates).

1. Supabase dashboard → **New project** → Organization: your Zycus organization → Name
   `codearena-prod` (or `codearena-staging`) → **Region: South Asia (Mumbai)** → generate a strong
   database password and keep it in a password manager → **Free** plan → **Create new project**.
2. **Integrations → Cron → Enable pg_cron.**
3. On your computer: `npm run sql:bundle`, then open `supabase/dist/codearena-database.sql` and copy
   all of it.
4. **SQL Editor → + → Create a new snippet** → paste → **Run** (confirm the warning if shown).
   Expected: `Zycus CodeArena database is ready` and the latest `schema_version`.
   The same script **upgrades** an existing project: it applies only migrations that are missing,
   in one all-or-nothing transaction. Run it again after every release that adds a migration.
5. **Integrations → Cron → Jobs** shows `codearena-finalize-overdue`, `codearena-purge-login-attempts`
   and `codearena-purge-snapshots`.
6. **Project Settings → API Keys**: note the **Project URL** and the **publishable** key
   (`sb_publishable_…`). These are public values. Never copy the secret / service_role key anywhere.

Test access codes (staging only): run `supabase/seed/staging_test_invitation.sql` in the SQL Editor.

## 2. Source code (GitHub)

1. github.com → **New repository** → Owner: the Zycus organization if available → Name
   `zycus-codearena` → **Private** → do not add a README, .gitignore or licence → **Create**.
2. Push this repository: `git remote add origin <URL>` then `git push -u origin main`.
3. Repository **Settings → Branches → Add rule** for `main`: require a pull request and the
   "Lint, test and build" check (`.github/workflows/ci.yml`) before merging.

## 3. Website (Cloudflare Pages)

1. Sign up at **dash.cloudflare.com** with your Zycus email (Free plan) and verify the email.
2. **Workers & Pages → Create → Pages → Connect to Git** → connect GitHub and grant access to the
   `zycus-codearena` repository only → select it → **Begin setup**.
3. Build settings:

   | Setting | Value |
   |---|---|
   | Project name | `zycus-codearena` (site: `https://zycus-codearena.pages.dev`) |
   | Production branch | `main` |
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

4. **Environment variables** (Production):

   | Variable | Value |
   |---|---|
   | `NODE_VERSION` | `24` |
   | `VITE_SUPABASE_URL` | prod Project URL |
   | `VITE_SUPABASE_ANON_KEY` | prod publishable key |
   | `VITE_ENABLE_STYLEGUIDE` | `false` |
   | `VITE_ENABLE_ENTRA_SSO` | `false` until Phase 4 is configured |

   For **Preview** deployments (pull requests) use the **staging** URL and key instead.
5. **Save and Deploy.** The build fails on purpose if the Supabase variables are missing or if the
   mock backend is enabled. Every push to `main` then redeploys automatically.
6. Security headers (CSP, Permissions-Policy, HSTS, no framing, no indexing) are generated into
   `dist/_headers` by the build; nothing to configure. Check them at https://securityheaders.com.

### Custom domain (optional, needs Zycus IT)

Pages project → **Custom domains → Set up a custom domain** → e.g. `codearena.zycus.com`. Cloudflare
shows a **CNAME** record (target `zycus-codearena.pages.dev`); Zycus IT adds it in Zycus DNS.
Cloudflare then issues the TLS certificate automatically.

## 4. Supabase settings after the first deployment

**Authentication → URL Configuration**: Site URL = the website URL; add it to Redirect URLs.
(Staff sign-in is configured in Phase 4.)

## 5. Keep-alive (Cloudflare Worker, free)

Free Supabase projects pause after 7 days without activity.

1. **Workers & Pages → Create → Worker** → name `codearena-keepalive` → **Deploy** → **Edit code** →
   replace everything with `ops/cloudflare/keepalive-worker.js` → **Deploy**.
2. Worker **Settings → Variables and Secrets** → add (type *Text*): `PROD_SUPABASE_URL`,
   `PROD_SUPABASE_ANON_KEY`, and optionally `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_ANON_KEY`.
3. Worker **Settings → Trigger events → Add → Cron Triggers** → `0 3 */2 * *` → **Add**.
4. Open the worker's URL once: it runs the ping immediately; **Logs** should show `HTTP 200`.

## 6. Local development

```bash
npm install
cp .env.example .env.local   # then fill in the staging URL and publishable key
npm run dev                  # http://localhost:5173 against staging
npm run dev:mock             # http://localhost:5174, no backend needed (code DEMO-DEMO-DEMO)
npm run preview:mock         # production build + real security headers, mock backend, port 4174
npm run check                # everything CI runs
```
