# Prompt: "Arrival" — a cinematic candidate login for Zycus Talent Assessment

> Paste everything below the line into Claude Code (or any coding agent) from the repo root.

---

You are a senior creative technologist: half motion designer, half WebGL engineer. Turn the **candidate** sign-in page of this repo into a short, film-quality piece that a candidate never forgets. The page must stay fast, accessible, on-brand and fully working.

**Scope: the candidate sign-in page only.** That is the index route `/` (`LoginRoute` → `LoginPage`), where a candidate enters an email and an access code. The **admin sign-in is out of scope**: the `/admin/*` routes and `src/features/admin/pages/SignInPage.tsx` must look and behave exactly as they do today. Every candidate page after sign-in (`/check`, `/instructions`, `/test`, `/submitted`), the API, the session logic and the proctoring also stay unchanged.

**Don't change the admin page by accident.** The admin sign-in uses the same shared components as the candidate page: `SpectrumBar`, `ProductLockup`, `AppFooter`, `Card`, `TextField`, `Button` and `Alert` in `src/design/components/`. **Don't edit those components or their existing styles.** Put every cinematic effect in new, candidate-only code under `src/features/candidate/login-cinematic/`. Wrap or layer the shared components there; for example, put the animated sheen on an overlay above `SpectrumBar` rather than inside it. In `tokens.css` and `index.css`, only *add* new tokens. Never change existing ones. The cinematic code must load only in the candidate login chunk, never in the admin bundle.

## 0. Read first

- `src/features/candidate/LoginPage.tsx`: the page you are transforming.
- `src/features/candidate/LoginRoute.tsx`: submit, error and busy flow, and the redirect after sign-in.
- `src/config/app.config.ts`: every product string and brand asset path. Use these and never hard-code copies.
- `src/design/components/Brand.tsx`: `ProductLockup`, `SpectrumBar`, `AppFooter`, `BrandLogo`.
- `src/design/tokens.css` and `src/index.css`: **the only place colors are defined.** Tailwind's default palette is disabled.
- `BRAND_SOURCES.md`: the brand palette, the colors sampled from the striped "Z" mark, and the logo rules.
- `src/config/securityHeaders.ts`: the CSP. Read it before choosing any technique.

## 1. The concept: "Arrival"

The story: *you travel across a universe made of code, at light speed, to reach Zycus.* It is one continuous camera move with no cuts. It ends with the candidate "docked" at a glowing Z-shaped gate. The sign-in card floats in front of the gate. The universe keeps living behind the card the whole time the candidate is on the page.

### 1a. The opening sequence (≤ 4.6 s total, plays once per browser session)

| Time | Beat | What the viewer sees |
|---|---|---|
| 0–400 ms | **Cold open** | Pure black inside cinema letterbox bars (2.39 : 1). A single text caret blinks twice in the center in Zycus cyan glow (`--zy-cyan-glow`). |
| 400–1000 ms | **Singularity** | The caret collapses to a point, implodes, then bursts. Thousands of code glyphs (`{ } ; < /> => ( ) 0 1 λ`) fly outward, tinted along the brand spectrum gradient, and cool into stars. |
| 1000–2400 ms | **Light speed** | The camera accelerates forward. The glyph-stars stretch into streaks whose length follows the velocity. The tunnel shifts from teal `#00C7B1` through `#2575FC` to navy `#002D72`. Chromatic aberration and radial blur peak around 1.8 s. Camera shake stays at 2 px or less. |
| 2400–3200 ms | **The braid** | The streaks curve and braid into six light ribbons in the colors sampled from the Z mark (`#0E6EB0 #1A97CB #1FBED0 #174892 #4AC1B7 #1E3E78`). The ribbons fold into a huge striped **Z-gate** floating in space. |
| 3200–3800 ms | **Arrival** | Hard ease-out-expo deceleration. The gate settles into the stage area (the left column on `md+`, behind the card on mobile). A horizontal anamorphic lens flare crosses the gate's core. The letterbox bars slide away. Inside the gate's aperture, the brand team photo (`appConfig.brand.images.login`) fades in with a slow Ken Burns drift: *the destination is the people.* |
| 3800–4600 ms | **Handshake** | The frosted glass sign-in card condenses out of light (blur 20 px → 0, scale 0.96 → 1). The `SpectrumBar` sweeps in from left to right. The Zycus logo lockup fades in. The welcome line *decodes* from cycling code glyphs into the real text in ≤ 700 ms. The bullets and the footer stagger in 40 ms apart. |

### 1b. The living background (never static, loops indefinitely)

The background should feel like a cinematic video, but it is rendered in real time, so it can react to the candidate.

- A volumetric nebula (fbm noise in a fragment shader) in brand navy, blue and teal that slowly evolves. Three parallax star layers. Far away, a spiral galaxy whose arms are made of tiny code glyphs, rotating almost imperceptibly.
- The Z-gate breathes. Every ~6 s a pulse of light runs along its six stripes, echoing a soft sheen that flows along the `SpectrumBar` at the top.
- A comet with a spectrum-colored tail crosses the scene at random intervals of 8–15 s.
- The camera floats on a slow Lissajous drift, as if in orbit. The mouse adds ±2% parallax.
- A film finish ties it together: subtle grain, vignette and color grading.

### 1c. The scene reacts to the form (the "surreal" part)

- **Field focus:** the gate's glow leans toward the card, and the nebula brightens slightly near the card.
- **Each keystroke:** a small photon leaves the card's edge and flies into the gate. Limit it to one photon per 60 ms and at most 40 alive at once.
- **Access code:** twelve dim stars form a constellation around the gate. Each valid character typed ignites one star, and deleting a character dims it again. When `isValidAccessCode()` returns true, constellation lines draw between the stars to form a Z. The gate's core then brightens ("ready to jump"), and the Continue button picks up a subtle spectrum sheen while keeping its primary color and AA contrast.
- **Validation or server error:** a brief, low-intensity red-shift tint (≤ 600 ms, from `--danger`). The card gives a gentle shake, which is skipped under reduced motion. Nothing alarming.
- **Busy (submitting):** warp spool-up. The stars begin to stretch and the gate core spins faster. If sign-in fails, spool down smoothly.
- **Success:** a ≤ 450 ms hyperjump *into* the gate (streaks and a white-blue bloom), then the existing navigation runs. Only `LoginRoute` changes, and only to `await depart()` before `navigate(...)`. `depart()` must resolve within 450 ms, resolve immediately under reduced motion or without WebGL, and never run on failure. Everything after sign-in looks and behaves exactly as it does today.

## 2. Content that must be visible (nothing is dropped)

All of these come from the existing components and `appConfig`. They must be in the DOM from the first frame. The intro only animates how they *appear*.

1. `SpectrumBar` at the top of the page.
2. `ProductLockup`: the official **Zycus logo**, "Talent Assessment" and the subtitle "Hands-On Coding Assessment".
3. The `h1` welcome line from `appConfig.welcomeLine`, keeping the non-breaking-hyphen replacement. The glyph-decode effect runs on `aria-hidden` spans, and the real text sits next to them in an `sr-only` span.
4. The helper sentence: "Sign in with the email address and access code from your invitation."
5. The dev `mockNotice` alert (with `DEMO-DEMO-DEMO`) and the live `error` alert.
6. The email field and the access-code field, with the same labels, placeholders, autocomplete, formatting, hint, `maxLength`, monospace tracking and validation messages.
7. The Continue button with its arrow icon and loading state.
8. The three bullets with their icons (Clock, ShieldCheck, MonitorCheck) and their exact text.
9. "Trouble signing in? Reply to your invitation email and the Zycus Talent Acquisition team will help."
10. `AppFooter`: "© {year} Zycus · Internal Hiring Assessment · Confidential".
11. The brand team photo, now shown through the gate's aperture.

**Logo integrity:** the Z-gate *evokes* the striped mark through its colors and stripes. The identity itself is always the official `zycus-logo.webp`, never redrawn, stretched or recolored. Keep it on a light surface, as `BRAND_SOURCES.md` requires until a reversed logo exists.

## 3. Layout and visual language

- A full-bleed canvas (`position: fixed; inset: 0`) sits behind everything with `pointer-events: none` and `aria-hidden="true"`.
- On `md+`, the left column is the cinematic stage where the gate sits (replacing the old photo panel) and the right column holds the card. Below `md`, the gate sits centered behind a full-width card. The page must not scroll horizontally at 375 px.
- **The card is light frosted glass:** white at roughly 88–92% opacity, with `backdrop-filter: blur` and saturate, a hairline spectrum border, and `--zy-shadow-lg`. A slow point of light travels around its border, but the **text inside never moves** once it has settled. This keeps the existing light-theme `TextField`, `Button` and `Alert` components, the logo-on-light rule, and WCAG AA contrast working with no changes to those components.
- The footer and the "Skip intro" control sit on the dark scene. Add tokens for light-on-dark text (for example `--text-on-scene` and `--text-on-scene-muted`) to `tokens.css`, check that they meet AA against the darkest *and* the brightest frames, and map them in `index.css`.
- Every new color is a token in `src/design/tokens.css`, sourced from `BRAND_SOURCES.md`. Use no raw hex values in components. Shader constants are allowed, but put them in one `palette.ts` with a comment pointing to the token or source for each value.
- Use only the Inter typeface (self-hosted). Use monospace only for the glyphs.

## 4. Engineering constraints (non-negotiable)

- **CSP:** `script-src 'self'`. That means no CDN, remote fonts, remote video or remote images. Everything is bundled.
- **The "video" is real-time rendering, not an MP4.** Use raw **WebGL2**: one fullscreen-quad fragment shader for the nebula, plus instanced points and lines for stars, glyphs, streaks and the gate. Build the glyph atlas at runtime on an offscreen 2D canvas. Aim for **zero new dependencies**. If one is truly required, add at most one (for example `three`), pin it to an exact version as `package.json` does, load it only in the lazy login chunk, and explain why it was needed.
- **Structure:** put the code in `src/features/candidate/login-cinematic/`. Keep a framework-free scene engine (`engine.ts`, `shaders/`, `palette.ts`, `timeline.ts`) separate from a React `<CinematicBackdrop>`. `LoginPage` talks to the scene through a small API: `focus(field)`, `keystroke()`, `codeProgress(n)`, `codeComplete(bool)`, `error()`, `busy(bool)`, `skipIntro()`, `depart(): Promise<void>`.
- **Performance budget:** the candidate's next screens start the webcam, the MediaPipe face model and Monaco, so this page must *leave the machine alone* once the candidate moves on.
  - Hold 60 fps on an integrated Intel GPU at 1920×1080.
  - Cap DPR at 1.5. Use adaptive quality: sample the first 60 frames and, if p90 frame time is above 20 ms, lower the render scale and particle counts.
  - Pause on `document.hidden`. Resize through `ResizeObserver`.
  - On unmount: `cancelAnimationFrame`, delete every buffer, texture and program, and call `WEBGL_lose_context`. Verify that nothing keeps running after navigation.
  - The form must paint immediately as plain HTML. The canvas starts after first paint.
  - Keep the login chunk's gzip size increase at or below ~60 KB.
- **Fallbacks:** without WebGL2, use a CSS-only animated gradient and CSS star layers that still look premium. In jsdom, `getContext` returns null, so the fallback must render and nothing may throw.
- **Intro once per session:** use a `sessionStorage` flag wrapped in try/catch. Reloads within the session go straight to the living background with the card visible.

## 5. Accessibility and safety

- The form is focusable and usable from frame 0. Any key press, pointer press or focus into the form **fast-forwards** the intro to its end state in ≤ 300 ms. A visible "Skip intro" button is first in tab order.
- `prefers-reduced-motion: reduce`: no intro, warp, camera drift, shake or hyperjump. Show the arrival end state with an almost-still nebula. `depart()` resolves immediately.
- No more than 3 flashes per second (WCAG 2.3.1). The gate fly-through and the hyperjump use a soft bloom (luminance change ≤ 40%), never a strobe.
- No audio.
- The error alert stays `live`. Focus management and tab order match today's behavior.

## 6. Verify before you call it done

1. Run `npm run dev:mock` (port 5174) and sign in with any email and `DEMO-DEMO-DEMO`.
2. Take screenshots at 0.5 s, 1.5 s, 2.8 s, 3.5 s and 6 s, and in these states: typing, code complete, invalid code, busy, and the page after sign-in. The page after sign-in must be unchanged.
3. Test at 1920×1080, 1280×800, 768 and 375 widths, plus reduced-motion emulation and the no-WebGL fallback.
4. The console has no errors. After navigation, no `<canvas>` remains and no animation frame is still running.
5. Add tests (they run in jsdom, so they use the fallback path):
   - Every item in section 2 renders.
   - Validation and submit still work.
   - "Skip intro" works and the form works during the intro.
   - The reduced-motion path works.
   - `depart()` resolves within 450 ms.
6. **Admin is untouched.** Open `/admin` in `dev:mock` and screenshot its sign-in page before and after your change. The two must be identical: same white card, no canvas, no animation. The existing admin tests (`src/features/admin/AdminPortal.test.tsx` and the others) pass without edits. `git diff --stat` shows no changes under `src/features/admin/` or `src/design/components/`.
7. `npm run check` passes (lint, format, seed check, tests, build).

Report what you built, the measured fps and bundle size change, and any brand question for Marketing.
