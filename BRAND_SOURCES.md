# Brand Sources — Zycus CodeArena

> **Status: DRAFT — for verification by Zycus Marketing.**
> Extracted on 2026-10-09 from the public Zycus website. If Marketing provides official
> guidelines or assets, drop them in [`/brand-input/`](brand-input/). They override everything below.

## 1. How this was extracted

- **Source pages:** <https://www.zycus.com/>, <https://www.zycus.com/company>,
  <https://www.zycus.com/company/careers>, <https://www.zycus.com/press-releases>.
- **Method:** Read in a browser (desktop viewport, all optional cookies rejected).
  - CSS custom properties defined on `:root` in the site's stylesheets. The site ships its own `--zy-*` design tokens, and these were copied verbatim.
  - `getComputedStyle()` on specific elements (headings, CTAs, nav, banners, gradients), listed per row below.
  - No colors were guessed or eyedropped from screenshots.
- **What was not found publicly:** a brand-guidelines PDF, a media/press kit, or an SVG logo. The site logo is a raster WebP.
  - A third-party logo aggregator offers a "Zycus SVG". It was deliberately **not** used, because it is not an official source.

## 2. Color palette

### 2a. Zycus site design tokens (`--zy-*` on `:root`, verbatim)

| Site variable | Hex | Our token | Planned use in CodeArena | Contrast vs `#FFFFFF` |
|---|---|---|---|---|
| `--zy-primary` | `#0B1F3F` | `--brand-navy-900` | Dark surfaces (thank-you hero, admin sidebar), headings | 16.38 : 1 ✅ |
| `--zy-primary-light` | `#1A3A6B` | `--brand-navy-700` | Hover state on dark surfaces | ✅ |
| `--zy-accent` | `#0036B0` | `--brand-blue-600` (**primary action**) | Primary buttons, focus rings, active nav, links | 9.75 : 1 ✅ |
| `--zy-accent-dark` | `#002A8C` | `--brand-blue-700` | Primary button hover/pressed | 12.28 : 1 ✅ |
| `--zy-accent-glow` | `rgba(0,54,176,0.10)` | `--brand-blue-glow` | Focus halo, selected-row tint | n/a |
| `--zy-bg` | `#FFFFFF` | `--surface` | Cards, header | n/a |
| `--zy-bg-light` | `#F7F9FC` | `--surface-muted` | App background | n/a |
| `--zy-bg-dark` | `#0B1F3F` | (= navy-900) | | |
| `--zy-border` | `#E2E8F0` | `--border` | Dividers, card borders | n/a (non-text) |
| `--zy-text` | `#2D2D2D` | `--text` | Body text | 13.77 : 1 ✅ |
| `--zy-gold` | `#F5A623` | `--brand-gold` | **Accent only** (badges on dark, timer-warning icon). Never text on white. | 2.03 : 1 ❌ text / 8.08 : 1 on navy ✅ |
| `--zy-green` | `#2ECC71` | `--brand-green` | **Accent only** (status dots, "camera live" indicator) | 2.10 : 1 ❌ text |

### 2b. Colors read from computed styles

| Hex | Where it was read | Our token | Planned use | Contrast vs white |
|---|---|---|---|---|
| `#003DA5` | `h1` "ABOUT US" on /company (Inter 300, 44px); gradient start of `.flash-text` | `--brand-blue-650` | Page titles (light weight, large) | 9.50 : 1 ✅ |
| `#0035AF` | Text color of "Get Started" / "Book A Demo" pill CTAs (2px border `#0036B0`, radius 50px) | ≈ `--brand-blue-600` | Same as accent | ✅ |
| `#002D72` | Nav mega-menu "Close" buttons; stop in Merlin AI gradient | `--brand-navy-800` | Secondary headings, table headers | 12.98 : 1 ✅ |
| `#0759E6` | Gradient end of `.flash-text` | `--brand-blue-500` | Gradient highlight, info | 5.86 : 1 ✅ |
| `#0546D9` → `#00267D` | Hero panel `linear-gradient` on /company | `--brand-gradient-hero` | Login/landing hero panel | white text ✅ |
| `#00C7B1`, `#2575FC`, `#0035AF`, `#0095C8`, `#0067B9`, `#002D72`, `#003DA5` | "Ask Merlin AI" menu label gradient (245°) | `--brand-gradient-spectrum` | Thin decorative accent bar only | decorative |
| `#001440` / `#00F3FF` | Top announcement bar background / text | `--brand-navy-950` / `--brand-cyan-glow` | Optional top strip | 13.00 : 1 ✅ |
| `#3076AF` | Default link color (theme) | not used | We use `#0036B0` for links (higher contrast) | 4.84 : 1 |
| `#808080` | Secondary paragraph text (mega-menu) | **not used** | Fails WCAG AA; replaced by `#526670` | 3.95 : 1 ❌ |
| `#526670` | Theme global color 3 (`--ast-global-color-3`) | `--text-muted` | Secondary text | 6.01 : 1 ✅ |
| `#EFF2F5`, `#F6FAFF`, `#F8F9FA` | Section backgrounds on /company | `--surface-sunken`, `--surface-tint` | Alternate section/panel backgrounds | n/a |

### 2c. Derived (not from the website — UI semantics, chosen for WCAG AA)

These colors are **not** Zycus brand colors. They are standard semantic colors that we need for errors, warnings and success. Marketing may replace them.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--success-text` | `#157347` | Success text/icons on white | 5.87 : 1 ✅ |
| `--warning-text` | `#8A5A00` | Warning text on white (gold `#F5A623` is used as the fill) | 5.93 : 1 ✅ |
| `--danger` | `#B42318` | Violations, destructive actions | 6.57 : 1 ✅ |
| `--danger-surface` | `#FEF3F2` | Violation overlay tint (danger text on it: 6.05 : 1 ✅) | n/a |

### 2d. Colors sampled from the official logo file

Sampled from the opaque pixels of `zycus-logo.webp` (canvas readback, 2026-10-09). WebP is lossy, so values can be ±2 per channel. **These are not used as UI tokens.** They are recorded because the logo's navy differs from the site's CSS navy, which Marketing may want to reconcile.

| Part | Dominant colors |
|---|---|
| "ZYCUS" wordmark | `#26347C` (≈98% of wordmark pixels) |
| Striped "Z" mark | `#0E6EB0`, `#1A97CB`, `#1FBED0`, `#174892`, `#4AC1B7`, `#1E3E78` |

## 3. Typography

| Font | Where seen | License | How we use it |
|---|---|---|---|
| **Inter** 300/400/500/700 | `body` and nearly all elements, site-wide | SIL OFL 1.1 (free) | Primary UI font, **self-hosted** via `@fontsource/inter` (no Google Fonts call at runtime) |
| Open Sans 600/700 | Loaded on the site (secondary) | SIL OFL 1.1 | Not used, to keep one family. Can be added if Marketing requests |
| Helvetica | Homepage `h1` only | system font | Fallback in the stack |
| Monospace (editor) | n/a | | `JetBrains Mono` (OFL) or `Cascadia Code`/`Consolas` system fallback. Editor only, not brand |

Observed style cues: pill buttons (`border-radius: 50px`), 2px outlined CTAs, light-weight (300) large titles in brand blue, white header with full-color logo, soft blue-tinted section backgrounds.

## 4. Image and logo assets

> ✅ **Downloaded 2026-10-09** (approved in Phase 0) to `/public/brand/`. The app never hotlinks zycus.com.
> Files are byte-for-byte copies of the originals (not re-encoded). SHA-256 checksums let Marketing verify them:
>
> | File | SHA-256 |
> |---|---|
> | zycus-logo.webp | `0171ef91be4dfde780a4780c8c2578d4116860e89caaebfe09d841fc108f52f0` |
> | zycus-mark.webp | `0cd21ecc6bc7ee9eb72295949c9cf5283e2d38a5a94d2e680f8cfd6a9fc67c5f` |
> | zycus-favicon.webp | `c8c13dfc66321105c3e0c49657419b2460bb68f74859012d779de219df4129d0` |
> | photo-team-collaboration.webp | `cd181b83d78c994c2ea61caada7ec016a46b7f2f23d683a9f41d984aa97b0989` |
> | photo-office-meeting.webp | `1e05fcd0538e1009334932381d2f4992d160c4d484bd69f8bbfa222f0601d9e2` |
> | photo-workshop.webp | `f4c5c297a2eb2db338a48f923cf7a12623bec11ca26f34c628367f7cacdab5e4` |
> | photo-team-hands.webp | `54f7b2ce37e43721375101437f9489545e0896074cdbf6f21a23f0cab5752285` |

| Planned local file | Official source URL | Pixels | Size | Notes |
|---|---|---|---|---|
| `public/brand/zycus-logo.webp` | <https://media.zycus.com/wp-content/uploads/2025/01/29153657/zycus-new-logo.webp> | 500×99 | 16.3 KB | Full-color horizontal logo used in the site header (`alt="New_Zycus - Header 2025"`) |
| `public/brand/zycus-mark.webp` | <https://media.zycus.com/wp-content/uploads/2025/01/29153252/Zycus-Logo-mobile-new.webp> | 96×69 | 3.3 KB | Striped "Z" mark (mobile header) — for collapsed sidebar |
| `public/brand/zycus-favicon.webp` | <https://media.zycus.com/wp-content/uploads/2025/02/29155054/fav-icon.webp> | 200×200 | 20.2 KB | Site favicon |
| `public/brand/photo-team-collaboration.webp` | <https://media.zycus.com/wp-content/uploads/2024/02/29160417/career-scaled-1.webp> | 2560×1709 | 105.9 KB | Careers page banner (`alt="Career Banner"`) — login screen hero |
| `public/brand/photo-office-meeting.webp` | <https://media.zycus.com/wp-content/uploads/2025/01/29155238/center-image.webp> | 2156×1507 | 103.6 KB | /company hero slider |
| `public/brand/photo-workshop.webp` | <https://media.zycus.com/wp-content/uploads/2025/01/29155234/second-banner.webp> | 2156×1507 | 173.8 KB | /company hero slider |
| `public/brand/photo-team-hands.webp` | <https://media.zycus.com/wp-content/uploads/2025/01/29155234/third-banner.webp> | 2156×1507 | 211.5 KB | /company hero slider — thank-you page |

Total ≈ 635 KB.

## 5. Open items for Zycus Marketing

1. **Official SVG logo**: full-color and reversed (white) versions. The site only exposes a 500×99 raster. It is sharp enough at header size on 2× displays, but SVG is preferred for the PDF report.
2. **Reversed/white logo**: needed if any dark surface should carry the logo. Until then the logo is only placed on white, as on zycus.com.
3. **Photo licensing**: the photos look like licensed stock imagery. Please confirm that reuse inside an internal Zycus tool is covered by the existing license, or supply approved alternatives.
4. **Palette roles**: confirm that `#0036B0` is the correct primary action color and `#0B1F3F` the primary navy.
5. **Semantic colors** (§2c): approve or replace.

All colors live in a single file, `src/design/tokens.css` (created in Phase 1). Marketing corrections are a one-file change.
