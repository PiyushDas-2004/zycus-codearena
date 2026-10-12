# Deploying Zycus Talent Assessment

The site is static files (no server code) on **Cloudflare Pages** (free plan), project
`zycus-talent-assessment`, at <https://zycus-talent-assessment.pages.dev>. It is built on this
laptop and uploaded in the Cloudflare dashboard; the code is not pushed anywhere.

- The build reads `.env.local`: only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public by
  design) go into the site. The LiteLLM settings have no `VITE_` prefix and never reach it.
- The build refuses to run against the mock backend, without a real Supabase project, or if any
  question's rubric or reviewer notes would end up in the files.
- `dist/_headers` gives every page the security headers (CSP allowing only this site and the
  Supabase project, no framing, camera/microphone/full screen for this site only). Cloudflare
  applies it automatically.

## Build

```bash
npm run check
```

It ends with the production build in `dist/` (about 170 files, 29 MB).

## First deployment

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** tab → **Upload assets** (or
   "Use direct upload").
2. **Project name**: `zycus-talent-assessment` → **Create project**.
3. **Select from computer** → **Upload folder** → choose the `dist` folder of this project →
   **Upload** (Windows may ask to confirm uploading the files) → **Deploy site**.
4. **Supabase**: Dashboard → **Authentication** → **URL Configuration** → **Site URL**:
   `https://zycus-talent-assessment.pages.dev` → **Save**.

## Each release

1. `npm run check` (builds `dist/` again).
2. Cloudflare → **Workers & Pages** → `zycus-talent-assessment` → **Create deployment** → upload the
   `dist` folder → **Save and Deploy**.

Cloudflare keeps every deployment: **Deployments** → **⋯** on an older one → **Rollback to this
deployment** puts it back in seconds.

## After deploying

- Open the site and `/admin`; sign in.
- Invite yourself and take a test on a real laptop with a webcam: system check, full screen, face
  detection, a second monitor (must be refused), Run tests, submit.
- Supabase pauses a free project after a week without use (Dashboard → **Resume project**), and the
  free plan has no backups.

## Custom domain (optional)

For an address like `assessment.zycus.com`: Pages project → **Custom domains** → **Set up a custom
domain**, then Zycus IT adds the CNAME record Cloudflare shows. Add the new address as the Supabase
Site URL too.
