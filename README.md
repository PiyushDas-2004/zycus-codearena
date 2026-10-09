# Zycus CodeArena

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
npm run check        # lint + format + seed check + all tests + type-check + build
```

| Script | What it does |
|---|---|
| `npm test` | Unit tests (jsdom) and database tests. The database tests run every migration in PGlite, an in-process Postgres, and check RLS for each role |
| `npm run test:db` | Database / RLS tests only |
| `npm run seed:build` | Regenerates `supabase/seed/seed.sql` from `supabase/seed/questions/*` and `templates/*` |
| `npm run typecheck` | Strict TypeScript for the app and the Node tooling |
| `npm run sql:bundle` | Writes `supabase/dist/codearena-database.sql`: installs or upgrades a Supabase project from the SQL Editor (applies only missing migrations, one transaction, safe to re-run) |
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
  seed/          sample questions (one folder each), the Lead React Native template, bootstrap SQL
  tests/         PGlite-based RLS/privilege tests
public/brand/    official Zycus assets (see BRAND_SOURCES.md)
docs/            Phase 0 plan, IT data-flow brief
```

## Security notes for contributors

- Never commit `.env*` files. Only the Supabase **anon** key may be used in the frontend.
- `dangerouslySetInnerHTML`, `eval` and `new Function` are lint errors.
- Every new database function must end its migration with explicit `revoke`/`grant` statements.
  `supabase/tests/01-schema-invariants.test.ts` fails if `anon` can execute anything unexpected.
