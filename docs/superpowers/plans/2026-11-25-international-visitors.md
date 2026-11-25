# International Visitors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Timond Lab an indexable English site (`/en/`) with product, commission and shipping pages so foreign collectors can find the studio and enquire.

**Architecture:** Keep one Astro project. Move all copy out of `src/pages/index.astro` into `src/i18n/content.ts`, render the existing page from one component (`src/components/Home.astro`) for two locales (`vi` at `/`, `en` at `/en/`), and add shared page components for product/commission/shipping. Tests are `node:test` assertions on the built `dist/` HTML (no new dependencies).

**Tech Stack:** Astro ^7.1.1, `@astrojs/sitemap`, TypeScript, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-25-international-visitors-design.md` (draft; assumptions marked _(giả định)_ need owner confirmation).

## Global Constraints

- Node `>=22.12.0`; no new npm dependencies.
- Locales: `vi` (default, served at `/`, `prefixDefaultLocale: false`) and `en` (served at `/en/`). `x-default` hreflang → `https://timondlab.com/en/`.
- Site URL: `https://timondlab.com`. All URLs end with a trailing slash except files.
- The Vietnamese page must keep every existing Vietnamese string and link; no auto-redirect by browser language; no `localStorage` language key.
- Never invent prices, lead times, shipping rates or reviews: unknown values are `null` / "quoted per order".
- Commits follow Conventional Commits (commitlint is enforced in CI).
- `npm run lint`, `npm run lint:eslint`, `npm run format:check` must stay green.

## Review Focus

1. Product with `priceUsd: null` must emit no `offers` in JSON-LD (Google rejects offers without a price) and show "Price on request".
2. The "Coming Soon" product (`slug: null`) must not link to a page that does not exist (lychee fails CI on broken links).
3. A returning visitor with legacy `localStorage.lang = "en"` visiting `/` must stay on `/` (no redirect, no flash of English).
4. Sitemap must list both locales with hreflang alternates and no `/en` without trailing slash.
5. `fetch("/api/latest-video.php")` on `/en/` must still resolve (absolute path, not relative to `/en/`).

---

## File Structure

- Create `src/i18n/locales.ts` — locale list and URL helpers.
- Create `src/i18n/content.ts` — all copy and data per locale.
- Create `src/seo/jsonld.ts` — JSON-LD builders.
- Create `src/components/Home.astro` — the current full document (head, body, `<style>`, `<script>`) moved from `index.astro`, parametrised by `locale`.
- Create `src/components/ProductPage.astro`, `CommissionPage.astro`, `ShippingPage.astro` — one document each, parametrised by `locale`.
- Modify `src/pages/index.astro` → renders `<Home locale="vi" />`; create `src/pages/en/index.astro`.
- Create route files for each locale: `src/pages/products/[slug].astro`, `src/pages/commission.astro`, `src/pages/shipping.astro` and their `src/pages/en/...` twins (thin wrappers).
- Create `tests/site.test.mjs`; modify `package.json`, `astro.config.mjs`, `.github/workflows/ci.yml`, `README.md`.

Why whole-document components: the existing `<style>` uses selectors (`body`, `:root`) that Astro scopes per component, so moving the document intact preserves current rendering.

---

### Task 1: Locale routing and test harness

**Files:**

- Create: `src/i18n/locales.ts`, `src/components/Home.astro`, `src/pages/en/index.astro`, `tests/site.test.mjs`
- Modify: `src/pages/index.astro`, `astro.config.mjs`, `package.json`

**Interfaces:**

- Produces: `locales: readonly ["vi","en"]`, `type Locale`, `defaultLocale: Locale`, `SITE_URL: string`, `localePath(locale: Locale, path?: string): string` (vi → `path`, en → `/en` + path, always trailing slash), `otherLocale(locale: Locale): Locale`.
- Produces: `<Home locale>` component (`Astro.props.locale: Locale`).

- [ ] **Step 1: Write failing tests** in `tests/site.test.mjs`: a `before` hook runs `execFileSync("npx", ["astro","build"])`; helper `read(rel)` returns `dist/<rel>` text. Test `routing`: `dist/index.html` and `dist/en/index.html` both exist; the first contains `<html lang="vi"`, the second `<html lang="en"`.
- [ ] **Step 2:** Add `"test": "node --test tests/"` to `package.json` scripts. Run `npm test`. Expected: FAIL (`dist/en/index.html` missing).
- [ ] **Step 3:** Implement `src/i18n/locales.ts` with the signatures above. Add `i18n: { defaultLocale: "vi", locales: ["vi","en"], routing: { prefixDefaultLocale: false } }` to `astro.config.mjs` and `i18n: { defaultLocale: "vi", locales: { vi: "vi-VN", en: "en-US" } }` to the `sitemap()` options.
- [ ] **Step 4:** Move the full content of `src/pages/index.astro` into `src/components/Home.astro`, add `const { locale } = Astro.props as { locale: Locale }`, set `<html lang={locale}>`; make `index.astro` and `en/index.astro` one-line wrappers. Page text is still dual-span at this point.
- [ ] **Step 5:** Run `npm test && npm run lint`. Expected: PASS.
- [ ] **Step 6:** `git commit -m "feat: add vi/en locale routing"`

### Task 2: Extract copy and render one language per URL

**Files:**

- Create: `src/i18n/content.ts`
- Modify: `src/components/Home.astro`, `tests/site.test.mjs`

**Interfaces:**

- Consumes: `Locale`, `localePath`, `otherLocale` (Task 1).
- Produces: `getContent(locale: Locale): Content` where `Content` has `ui` (string map for every UI string used in `Home.astro`), `socials`, `products: Product[]`, `journeySteps: string[]`, `buildPublic`, `services`, `values`, `faq: {q:string;a:string}[]`; `interface Product { slug: string|null; name: string; desc: string; img: string; priceUsd: number|null; leadTime: string|null }`. Product slugs: `nghinh-phong-tower`, `miniature-diorama`, `resin-figure`; `prod-soon` has `slug: null`.

- [ ] **Step 1: Write failing tests:** (a) `dist/index.html` has no `data-i18n` and contains `Khám phá sản phẩm` but not `Explore Products`; (b) `dist/en/index.html` has no `data-i18n`, contains `Explore Products`, not `Khám phá sản phẩm`; (c) language toggle: vi page has `<a id="lang-toggle" href="/en/"`, en page has `href="/"`; (d) built script contains neither `localStorage.getItem("lang")` nor `setItem("lang"` (Review Focus 3).
- [ ] **Step 2:** Run `npm test`; expected FAIL.
- [ ] **Step 3:** Create `content.ts`: move every Vietnamese/English pair currently inline in `index.astro` into `getContent`. English copy is the existing `en` string verbatim; Vietnamese is the existing `vi` string verbatim.
- [ ] **Step 4:** In `Home.astro` replace each dual `<span data-i18n>` pair with the string from `getContent(locale)`; delete the `[data-i18n]` CSS rules, the `data-lang` attribute and the language-toggle/`localStorage` code in the script; turn `#lang-toggle` into an `<a>` to `localePath(otherLocale(locale))` with `hreflang`; search placeholder comes from `ui`.
- [ ] **Step 5:** Run `npm test && npm run lint:eslint && npm run format:check`. Expected: PASS. Run `astro dev --background`, open `/` and `/en/`, confirm the Vietnamese page looks unchanged and the theme toggle, search filter, journey runner and latest-video card still work; `astro dev stop`.
- [ ] **Step 6:** `git commit -m "refactor: serve one language per URL"`

### Task 3: Per-locale head metadata and hreflang

**Files:**

- Modify: `src/components/Home.astro`, `src/i18n/content.ts`, `tests/site.test.mjs`

**Interfaces:**

- Produces: `Content.meta: { title: string; description: string; ogLocale: string; ogAlternate: string }`. EN title `Timond Lab · Handmade miniatures & dioramas from Vietnam`; EN description `Handmade miniatures, dioramas and hand-painted resin figures from Vietnam. Custom commissions welcome, worldwide shipping available.`; `ogLocale` `en_US`/`vi_VN`.
- Produces: a head helper (component `src/components/HeadMeta.astro`, props `locale: Locale`, `path: string`) used by every page component in later tasks: emits title, description, canonical, `og:*`, `twitter:*`, and `<link rel="alternate" hreflang>` for `vi`, `en`, `x-default` (→ `/en/`).

- [ ] **Step 1: Write failing tests** on both pages: canonical equals own URL (`https://timondlab.com/` / `https://timondlab.com/en/`); three hreflang links present; `og:locale` matches; English description is the string above; `<title>` is locale-specific.
- [ ] **Step 2:** Run `npm test`; expected FAIL.
- [ ] **Step 3:** Implement `HeadMeta.astro` and use it from `Home.astro`; add `meta` to `content.ts`.
- [ ] **Step 4:** Add a sitemap test: `dist/sitemap-0.xml` contains both `https://timondlab.com/` and `https://timondlab.com/en/` with `xhtml:link` alternates, and no `https://timondlab.com/en"` without trailing slash (Review Focus 4).
- [ ] **Step 5:** Run `npm test`. Expected: PASS.
- [ ] **Step 6:** `git commit -m "feat: per-locale metadata and hreflang"`

### Task 4: Organization structured data

**Files:**

- Create: `src/seo/jsonld.ts`
- Modify: `src/components/HeadMeta.astro`, `tests/site.test.mjs`

**Interfaces:**

- Produces: `organizationJsonLd(locale: Locale): object` (`@type: "Organization"`, `name`, `url`, `logo` = `${SITE_URL}/avatar.webp`, `email`, `sameAs` = social URLs from content, `inLanguage` = locale); `jsonLdScript(obj: object): string` (serialises and escapes `<` as `<`).

- [ ] **Step 1: Write failing test:** parse every `application/ld+json` block in `dist/en/index.html`; one has `@type` `Organization`, `sameAs` includes `https://youtube.com/@timondlab`, and `name` is `Timond Lab`.
- [ ] **Step 2:** Run `npm test`; expected FAIL.
- [ ] **Step 3:** Implement `jsonld.ts`; emit the block from the home pages via `<script type="application/ld+json" set:html={...}>`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** `git commit -m "feat: add Organization JSON-LD"`

### Task 5: Product detail pages

**Files:**

- Create: `src/components/ProductPage.astro`, `src/pages/products/[slug].astro`, `src/pages/en/products/[slug].astro`
- Modify: `src/seo/jsonld.ts`, `src/components/Home.astro`, `src/i18n/content.ts`, `tests/site.test.mjs`

**Interfaces:**

- Consumes: `getContent`, `HeadMeta`, `jsonLdScript` (Tasks 2–4).
- Produces: `productJsonLd(locale: Locale, p: Product): object` — `@type: "Product"`, `name`, `description`, `image` (absolute), `brand` Timond Lab; `offers` (`price`, `priceCurrency: "USD"`, `availability`) **only** when `p.priceUsd !== null`.
- Both route files export `getStaticPaths()` returning one entry per product with a non-null slug.

- [ ] **Step 1: Write failing tests:** (a) `dist/en/products/nghinh-phong-tower/index.html` and `dist/products/nghinh-phong-tower/index.html` exist, with correct canonical and hreflang pair; (b) its Product JSON-LD has no `offers` key and the page contains `Price on request` (all prices are `null` initially); (c) no `dist/**/products/prod-soon` page exists and the Coming Soon card on both home pages has no `href` to `/products/` (Review Focus 1–2); (d) the product page has a `mailto:timondlab@gmail.com?subject=` link whose subject contains the product name.
- [ ] **Step 2:** Run `npm test`; expected FAIL.
- [ ] **Step 3:** Add `slug`, `priceUsd: null`, `leadTime: null` to products in `content.ts`; implement `productJsonLd` and the page component (image, description, price or "Price on request", lead time or "Quoted per order", enquiry mailto, link back to home); replace the home "View Details" `href="#"` with `localePath(locale, "/products/<slug>/")`, rendering no link when `slug` is null.
- [ ] **Step 4:** Run `npm test && npm run lint`. Expected: PASS.
- [ ] **Step 5:** `git commit -m "feat: add product detail pages"`

### Task 6: Commission page

**Files:**

- Create: `src/components/CommissionPage.astro`, `src/pages/commission.astro`, `src/pages/en/commission.astro`
- Modify: `src/i18n/content.ts`, `tests/site.test.mjs`

**Interfaces:**

- Produces: `Content.commission: { title; intro; steps: {title;text}[]; include: string[]; ctaLabel }` and `commissionMailto(locale: Locale): string` exported from `content.ts` (prefilled subject `Commission request`, body listing the `include` items: reference images, scale/size, budget, deadline, shipping country).

- [ ] **Step 1: Write failing tests:** `dist/en/commission/index.html` exists, shows six steps matching `journeySteps` length, has the `commissionMailto("en")` link, and canonical/hreflang are correct; the Vietnamese twin exists.
- [ ] **Step 2:** Run `npm test`; expected FAIL.
- [ ] **Step 3:** Implement page and copy (steps reuse the journey vocabulary: idea → quote → 3D → print → paint → ship).
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** `git commit -m "feat: add commission page"`

### Task 7: Shipping and duties page

**Files:**

- Create: `src/components/ShippingPage.astro`, `src/pages/shipping.astro`, `src/pages/en/shipping.astro`
- Modify: `src/i18n/content.ts`, `src/components/Home.astro` (FAQ link), `tests/site.test.mjs`

**Interfaces:**

- Produces: `Content.shipping: { intro; regions: {name:string; days:string|null; cost:string}[]; dutiesNotice; returnsNotice }`. Initial values: `days: null` (rendered "Quoted per order"), `cost: "Quoted per order"`; `dutiesNotice` states that import duties and taxes are the buyer's responsibility _(giả định, owner to confirm)_.

- [ ] **Step 1: Write failing tests:** `dist/en/shipping/index.html` exists and contains the duties notice; the "Do you ship internationally?" FAQ answer on `/en/` links to `/en/shipping/`, and the Vietnamese FAQ answer links to `/shipping/`.
- [ ] **Step 2:** Run `npm test`; expected FAIL.
- [ ] **Step 3:** Implement page, copy and the FAQ links.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** `git commit -m "feat: add shipping and duties page"`

### Task 8: Channels and hero copy per locale

**Files:**

- Modify: `src/i18n/content.ts`, `src/components/Home.astro`, `tests/site.test.mjs`

**Interfaces:**

- Produces: `Content.socials` filtered per locale — `vi`: current six; `en`: Email first, then YouTube, TikTok, Facebook, plus Instagram only when `INSTAGRAM_URL` (a `string | null` constant in `content.ts`, initially `null`) is set. `Content.hero: { subtitle; primaryCta: {label; href}; secondaryCta }`; EN subtitle `Handmade miniatures, dioramas & figure painting from Vietnam`, EN primary CTA `Request a custom piece` → `/en/commission/`, secondary `Explore Products` → `#products`.

- [ ] **Step 1: Write failing tests:** `dist/en/index.html` contains neither `zalo.me` nor `shopee.vn` and no `instagram.com` while `INSTAGRAM_URL` is null; `dist/index.html` contains both `zalo.me` and `shopee.vn`; EN hero primary CTA `href="/en/commission/"`; Vietnamese hero CTAs unchanged (`href="#products"`).
- [ ] **Step 2:** Run `npm test`; expected FAIL.
- [ ] **Step 3:** Implement the filtering and hero fields.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** `git commit -m "feat: tailor channels and hero for English visitors"`

### Task 9: Verification, CI and docs

**Files:**

- Modify: `.github/workflows/ci.yml`, `README.md`, `tests/site.test.mjs`

- [ ] **Step 1: Write failing test:** the built script of both home pages calls `fetch("/api/latest-video.php")` with a leading slash (Review Focus 5).
- [ ] **Step 2:** Run `npm test`; if it passes, keep it as a regression guard.
- [ ] **Step 3:** In `ci.yml`, add a `npm test` step in the existing build job after the build step (it rebuilds; acceptable at this site's size).
- [ ] **Step 4:** In `README.md` document the locale structure, how to add copy in `content.ts`, and the owner inputs still needed (prices, lead times, shipping table, duties policy, Instagram URL, extra photos).
- [ ] **Step 5:** Run `npm run lint && npm run lint:eslint && npm run format:check && npm run build && npm test`. Expected: all pass. Then run Lighthouse locally against `dist` (`npx @lhci/cli autorun`) and confirm the thresholds in `.lighthouserc.json` hold on `/en/`.
- [ ] **Step 6:** `git commit -m "docs: document locales and add CI test step"`

---

## Self-Review

- **Spec coverage:** indexable English (Tasks 1–3), structured data (4–5), commission/shipping (6–7), non-VN channels (8), docs/CI (9). Non-code marketing work is explicitly outside the plan.
- **Type consistency:** `Locale`, `localePath`, `getContent`, `Product`, `jsonLdScript` are defined in Tasks 1–5 and used with the same names afterwards.
- **Open owner inputs** (do not block implementation): prices, lead times, shipping table, duties policy, Instagram URL.
