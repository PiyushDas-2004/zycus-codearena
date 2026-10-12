# Zycus Talent Assessment

**Hands-On Coding Assessment** — Zycus's in-house, zero-cost, proctored coding-assessment platform.

> **Status:** Phases 1–3 of 6 are complete (scaffold and database; candidate flow and workspace;
> proctoring). The admin portal is Phase 4. The full README,
> with features, an architecture diagram and known limitations, is written in Phase 6.
> The architecture and its decisions are in [docs/PHASE0_ARCHITECTURE_PLAN.md](docs/PHASE0_ARCHITECTURE_PLAN.md).

## Quick start (local development)

Requires Node.js 22.22+ (see `.nvmrc`). Docker is **not** required.

```bash
npm install
npm run dev          # http://localhost:5173 against the Supabase project in .env.local
npm run dev:mock     # http://localhost:5174 with an in-browser mock backend (code DEMO-DEMO-DEMO)
npm run local:db     # a local stand-in for Supabase (real migrations, in memory); then:
npm run dev:local    # http://localhost:5175 against it, admin portal included
npm run check        # lint + format + seed check + all tests + type-check + build
```

| Script | What it does |
|---|---|
| `npm test` | Unit tests (jsdom) and database tests. The database tests run every migration in PGlite, an in-process Postgres, and check RLS for each role |
| `npm run test:db` | Database / RLS tests only |
| `npm run seed:build` | Regenerates `supabase/seed/seed.sql` from `supabase/seed/questions/*` and `templates/*` |
| `npm run typecheck` | Strict TypeScript for the app and the Node tooling |
| `npm run sql:bundle` | Writes `supabase/dist/codearena-database/*.sql`: run them **one by one, in file-name order** in Supabase Dashboard → SQL Editor to install or upgrade a project (schema first, then one file per question, then the template; each is one transaction and safe to re-run). They are separate files because the SQL Editor fails on very large scripts ("Failed to fetch") |
| `npm run sql:copy` | Puts those scripts on the clipboard one at a time, for pasting into the SQL Editor (`-- 3` starts at script 3, `-- --list` lists them) |
| `npm run local:db` / `dev:local` / `local:worker` | A local stand-in for Supabase (the real migrations and seed in PGlite, test staff accounts in `scripts/local-stack/seed.json`), the app against it, and the coding-assistant worker against it: end-to-end tests and demos without touching the real project |
| `/admin` | The admin portal: invite candidates, follow tests live, reopen tests, review results. Setup and use: [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) |
| Deploying | `npm run check`, then upload `dist/` in the Cloudflare Pages dashboard: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| `npm run assistant:worker` | Runs the coding assistant's worker on a laptop inside the Zycus network while assessments run (see [docs/AI_ASSISTANT_SETUP.md](docs/AI_ASSISTANT_SETUP.md)) |
| `npm run models:fetch` | Downloads and verifies the face-detection model into `public/models/` (once; the file is committed) |

## Repository layout

```
src/
  config/        app.config.ts — platform name, wording, brand asset paths (change them here only)
  design/        tokens.css — ALL colours; components/ — Button, Card, Dialog, Toast…
  shared/        access-code rules, question/template format, proctoring config (shared with scripts)
  features/      candidate/, workspace/ (editor, autosave, timer), proctoring/, admin/, styleguide/
supabase/
  migrations/    schema, RLS policies, grants, audit trail, auth hook (applied in filename order)
  seed/          the assessment's questions (one folder each), the Lead React Native template, seed/upgrade SQL
  tests/         PGlite-based RLS/privilege tests
public/brand/    official Zycus assets (see BRAND_SOURCES.md)
docs/            Phase 0 plan, IT data-flow brief
```

## Security notes for contributors

- Never commit `.env*` files. Only the Supabase **anon** key may be used in the frontend. The
  LiteLLM key lives only on the machine running the assistant worker, in git-ignored `.env.local`
  without a `VITE_` prefix.
- A production build fails if it contains any question's rubric or reviewer notes.
- `dangerouslySetInnerHTML`, `eval` and `new Function` are lint errors.
- Every new database function must end its migration with explicit `revoke`/`grant` statements.
  `supabase/tests/01-schema-invariants.test.ts` fails if `anon` can execute anything unexpected.
