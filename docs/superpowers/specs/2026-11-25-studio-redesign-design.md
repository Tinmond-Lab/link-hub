# Studio Redesign ("Dark Gallery") — Design

Status: approved by the owner (direction A; the owner answered "ok" to the recommendations below). Items marked _(my call)_ were decided by the designer and can be overridden by the owner.

## Owner decisions

- **Both locales get the studio positioning.** The Vietnamese home page changes like the English one: new title, meta description, OG text, hero subtitle and primary CTA (to the commission page). "Software developer" is no longer part of the hero on either locale; software development stays as one secondary line in About. Tests that pinned the old VI hero, title and description are updated to the new intended copy.
- **Photos are treated as unverified.** Until the owner confirms which images are real photos of their work and supplies a maker photo: About has no portrait (layout is typographic, with an optional `MAKER_PHOTO: string | null = null` in `content.ts` that shows a photo when set); Process chapters are typographic; `bip-1` and `bip-2` are not shown as proof of process or as the maker. Product images stay in Selected works as the catalog.

## Intent and the why

Timond Lab makes handmade miniatures, dioramas and hand-painted resin figures in Vietnam and wants international collectors to see it as a credible, impressive art studio. Today the site still reads as a link-in-bio page with a generic SaaS look (centered avatar, social list first, blue buttons, white rounded cards, checklist "Values"). The owner wants it to feel like an art-miniature brand: enough to impress at first sight and to earn trust.

## Goals

- First screen communicates "handmade miniature art studio" through a large photo of the work, not an avatar and link list.
- The work is the hero: large images, generous dark space, minimal chrome.
- A visitor can go from the home page to a work, to the commission request, to shipping info, in two clicks, on both locales.
- Credibility signals are visible: the process (6 steps), the maker and studio story, the latest video, clear commission and worldwide-shipping info.
- Keep everything that already works: VI at `/`, EN at `/en/`, hreflang/canonical/OG/JSON-LD, sitemap, product/commission/shipping pages, `LATEST_VIDEO_URL`, favicon, Cloudflare static deploy, CI gates.

## Non-goals

- No new copy invented as facts: no fake reviews, numbers, prices, press mentions or awards.
- No CMS, no cart or checkout, no backend.
- No third language, no blog.
- No new photography (the owner supplies photos; the design must work with today's images and get better when real photos arrive).

## Anti-goals (a failure even if it works)

- Looks like a dark SaaS template (neon gradients, glassmorphism, glowing blobs, emoji icons).
- Motion that slows the page or makes it hard to read; anything that ignores `prefers-reduced-motion`.
- The bio-link use breaks: people coming from TikTok/YouTube bio must still reach the social links quickly.
- Vietnamese text renders without proper diacritics or with broken line height.
- Accessibility or Lighthouse scores drop below the CI gates.

## Constraints

- Astro 7 static output, Cloudflare Workers static assets (`wrangler.json`), no server code.
- No new npm dependencies. Fonts via Google Fonts (already used). Icons: existing `lucide-static` and `simple-icons`.
- All copy stays in `src/i18n/content.ts` (both locales).
- CI gates: `astro check`, ESLint, Prettier, `npm test` (node:test on built `dist/`), Lighthouse CI (accessibility ≥ 0.9 is an error gate; performance, best-practices, SEO ≥ 0.8/0.9 warnings), lychee broken-link check.
- Fonts must include the `vietnamese` subset. Verified: Archivo and Space Grotesk do.

## Approaches considered

- **A. Dark Gallery (chosen).** Near-black background, white type, large full-bleed photography, scroll storytelling (work → process → maker → commission). Fits the existing photos (all shot or rendered on dark backgrounds) and the logo (silver + blue on black). Cost: depends on strong images; text-heavy pages need careful contrast.
- **B. Light Atelier.** Stone off-white, ink text, bronze accent, serif headings (Cormorant/Playfair) with Inter body, magazine layout. Rejected: dark product photos become black boxes on a light page, and it departs from the logo.
- **C. Hybrid (dark gallery sections + light reading pages).** Rejected for now: two visual systems to maintain for a one-person studio, and the jump between themes feels unfinished.

## Design decisions

### Visual system

- **Theme:** dark only. Remove the light/dark toggle and its `localStorage` code _(my call: one well-tuned theme beats two half-tuned ones)_.
- **Color tokens** (CSS custom properties on `:root`):
  - `--bg: #000000`, `--surface: #0C0C0C`, `--surface-2: #181818`
  - `--text: #FAFAFA`, `--muted: #A1A1AA` (≥ 7:1 on `--bg`; replaces the slate muted used today)
  - `--border: #3F3F46`
  - `--accent: #4C9AFF` (the logo's blue, already used as today's dark-mode accent; ≥ 7:1 on black). Used sparingly: links, focus ring, small eyebrow labels, the active journey step. Never as large fills.
  - Primary button: `--text` background with `#0A0A0A` text. Secondary button: transparent with `--border` outline and `--text` text.
- **Typography:** headings Archivo 600–700, tight tracking (−0.02em), display sizes with `clamp()` (hero up to ~72px on desktop). Body Space Grotesk 400/500, 16–18px, line-height 1.6. Eyebrows and labels: Space Grotesk 500, uppercase, letter-spacing 0.14em, 12–13px. Replace Be Vietnam Pro everywhere. Load with `display=swap` and preconnect.
- **Shape:** small radii (4–8px) on images and buttons, no pill buttons, no heavy shadows; hairline `--border` separators. Photos sit edge-to-edge in their frames.
- **Icons:** lucide/simple-icons SVG only; no emoji anywhere (today's `🖼` placeholder icon is replaced by an empty dark frame with the label).
- **Motion** (extended at the owner's request after launch; all in `src/styles/motion.css`, no animation library, no parallax or scroll-jacking): hero entrance sequence (title words slide up from masks, then eyebrow, subtitle, buttons; the photo eases in from a slight zoom); staggered scroll reveals for the works grid, process steps, FAQ, commission steps and the makes list (`data-stagger`, a beat between children); a header that settles into a solid bar once scrolled; a thin scroll-progress line (CSS scroll timeline, hidden where unsupported); work-card lift, slow image zoom and an underline that draws on hover; an accent line that sweeps across each process step; a play button that breathes on hover; FAQ answers that open with a smooth height; a mobile menu that drops in; and a cross-fade between pages (cross-document view transitions) with the header held still. Only transform, opacity, scale and clip are animated, with the shared easing token `--ease`. Content is hidden for an entrance only when JS runs (`html.js`), and under `prefers-reduced-motion: reduce` every animation, delay and view transition is off and everything shows at once.

### Information architecture

**Home (`/`, `/en/`)** is one long story page, in this order:

1. **Header** (sticky, translucent black with blur): TL monogram + "TIMOND LAB" wordmark left; anchor nav right: Works, Process, Commission, About; a compact group of social icons (the same per-locale channels as the footer) so visitors arriving from a social bio reach the channels at once even before bios are repointed to `/links` _(my call)_; language link (`EN` / `VI`) whose visible text matches its accessible name. On mobile the nav and social icons collapse into a simple menu button that opens a full-width list _(my call)_.
2. **Hero:** featured photo (Tháp Nghinh Phong). The only source is a 1000×1000 WebP, so on desktop the hero is a split layout (text left, photo right at its natural size, never upscaled); on mobile the photo runs full-width above the text _(my call: avoids a soft, cropped, upscaled image and protects LCP)_. Then eyebrow "Handmade miniatures"; headline; one-line subline; primary CTA "Request a commission" → commission page; secondary CTA "View works" → `#works`.
3. **Selected works** (`#works`): large grid (2 columns desktop, 1 mobile), image-first cards with name + one-line description, each linking to its product page. "Coming soon" stays as a non-linked card.
4. **Process** (`#process`): the 6 steps (idea → shipping) as numbered chapters. Chapter text reuses existing copy only (the `journeySteps` labels plus the matching sentences already in `commission.steps` and the "How are products made?" FAQ answer); no new claims about the craft _(my call)_. Chapters are typographic until the owner confirms real process photos (see Owner decisions). Replaces today's horizontal step runner _(my call)_.
5. **Latest video:** the existing build-time `LATEST_VIDEO_URL` card, shown large in 16:9 using YouTube's `maxresdefault` thumbnail (for Shorts YouTube already pads the vertical frame with a blurred background), with a play affordance. It links out to YouTube; no embedded player or third-party script _(my call: protects Lighthouse and privacy)_. The build-in-public photos are not repeated here; they live in Process.
6. **About / the maker** (`#about`): studio story (existing about copy, rewritten shorter), what the studio makes (custom miniatures, figure painting, diorama design; software development as one secondary line), and the values folded in as a short sentence, not a checklist _(my call)_. Shows `MAKER_PHOTO` when the owner sets it; otherwise no image (see Owner decisions).
7. **Commission band** (`#commission`): short pitch, 3 key steps, CTA to the commission page, and a "Worldwide shipping · see shipping & duties" line linking to the shipping page.
8. **FAQ:** existing 4 questions with their links, restyled as a quiet accordion.
9. **Footer:** social icons (YouTube, TikTok, Facebook, Instagram when `INSTAGRAM_URL` is set; Shopee and Zalo on the VI page only, as today), email, links to commission, shipping and `/links`, tagline "Build Ideas Into Reality", copyright.

**Removed from home:** the search box, the full-width social list (moves to `/links`), the "Values" checklist grid and the "Services" icon grid (folded into About), the back-to-top button _(my call; the sticky header covers it)_.

**New `/links` page (`/links/`, `/en/links/`):** the bio-link page for TikTok/YouTube/Facebook bios: monogram, one line, a prominent "Visit the studio" link to the home page, then the full social list (same per-locale rules as today: VI keeps Shopee and Zalo, EN email first and no VI-only channels). Same dark system. Included in the sitemap with hreflang like the other pages. The owner should point their social bios at this page _(my call)_.

**Product, commission, shipping pages:** use the same header, footer and tokens (shared layout replacing today's `InfoPage` look). Product page on desktop: large image left (~60%), details right (name, description, price or "Price on request", lead time, enquiry CTA, links to shipping and commission). Commission and shipping keep their content and structure, restyled.

### Accessibility and quality

- All text ≥ 4.5:1 (large text ≥ 3:1); visible focus ring in `--accent` on every interactive element; skip-to-content link.
- Language link: visible text and accessible name match (fixes today's label-in-name failure); add `lang` on text in the other language.
- Distinct, meaningful `alt` text per image (fixes today's redundant-alt failure).
- Touch targets ≥ 44px; mobile menu operable by keyboard and closes on Escape.
- Images: keep WebP, explicit width/height or aspect-ratio to prevent layout shift, `loading="lazy"` below the fold, hero image eager with `fetchpriority="high"`.

### Tests and CI

- Existing tests stay unless the redesign intentionally changes what they assert. Expected changes: theme `localStorage` assertion (theme toggle removed), language toggle markup, social-list assertions move from the home pages to `/links`, hero CTA assertions follow the new markup. Each changed test is updated to assert the new intended behavior, not deleted.
- New tests: `/links` pages exist in both locales with the per-locale channel rules; home pages contain the anchor nav targets (`#works`, `#process`, `#about`, `#commission`); no emoji in rendered HTML; header present on every page; the dark tokens are applied.
- Lighthouse CI must still pass its gates; check that the new hero image does not regress LCP.

## Left to the builder

Exact copy wording within the tone (calm, confident, short sentences, no superlatives), spacing scale, exact breakpoints, grid details, component boundaries in Astro, how the shared layout is factored, and the mobile menu implementation, as long as the decisions above hold.

## Owner inputs that improve the result (not blocking)

- Real photos of finished pieces. Some current product images look like renders; if they are, real photos (even from a phone, on a dark background) will add more credibility than any design change.
- A photo of the maker at the workbench for the About section.
- Confirmation to repoint social bios to `/links`.
