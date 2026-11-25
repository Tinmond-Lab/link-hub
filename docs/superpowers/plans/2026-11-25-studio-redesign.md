# Studio Redesign ("Dark Gallery") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Timond Lab's site as a dark-gallery studio site (work-first home page, shared header/footer, `/links` bio page) on both locales, keeping every SEO, i18n and deploy behavior that exists today.

**Architecture:** A shared `BaseLayout` (document, head, header, footer, global theme CSS, reveal script) replaces both today's 1,279-line `Home.astro` document and `InfoPage.astro`. The home page becomes a thin composition of section components under `src/components/home/`. All copy stays in `src/i18n/content.ts`. Tests remain `node:test` assertions on built `dist/` HTML and CSS.

**Tech Stack:** Astro 7 (static), TypeScript, Google Fonts (Archivo, Space Grotesk), `lucide-static`, `simple-icons`, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-25-studio-redesign-design.md`

## Global Constraints

- No new npm dependencies. No animation library. No embedded YouTube player or third-party scripts.
- Dark theme only. Tokens on `:root`: `--bg: #000000`, `--surface: #0C0C0C`, `--surface-2: #181818`, `--text: #FAFAFA`, `--muted: #A1A1AA`, `--border: #3F3F46`, `--accent: #4C9AFF`. Primary button: `--text` background, `#0A0A0A` text. Secondary button: transparent, `--border` outline, `--text` text.
- Fonts: headings Archivo 600–700, letter-spacing −0.02em; body Space Grotesk 400/500, 16–18px, line-height 1.6; eyebrows Space Grotesk 500 uppercase, letter-spacing 0.14em, 12–13px. URL: `https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Space+Grotesk:wght@400;500&display=swap`. Be Vietnam Pro is removed everywhere.
- Radii 4–8px, no pill buttons, no heavy shadows, no emoji in rendered HTML, SVG icons only.
- Motion: fade + 12–16px rise, 300–450ms; image hover scale 1.03 over 400ms; everything in final state under `prefers-reduced-motion: reduce`; no parallax.
- All copy in `src/i18n/content.ts`, both locales. Never invent facts (reviews, numbers, prices, awards).
- Keep: `/` = vi, `/en/` = en, `HeadMeta` (canonical, hreflang, OG, favicon links), JSON-LD, sitemap, product/commission/shipping routes, `LATEST_VIDEO_URL`, `productFacts`, `INSTAGRAM_URL`, `wrangler.json`.
- Per-locale channels (unchanged rules): vi = YouTube, TikTok, Facebook, Shopee, Zalo, Email in that order; en = Email, YouTube, TikTok, Facebook, then Instagram only if `INSTAGRAM_URL` is set.
- Text contrast ≥ 4.5:1; visible focus ring in `--accent`; touch targets ≥ 44px; the language link's visible text is contained in its accessible name.
- CI gates stay green: `npm run lint`, `npm run lint:eslint`, `npm run format:check`, `npm test`, Lighthouse (accessibility ≥ 0.9).
- Commits follow Conventional Commits.

## Review Focus

1. Without JavaScript (or before it runs) every section is visible: reveal-hidden state applies only under `html.js`. → Task 1 test `reveal is gated behind html.js`.
2. Header anchor links on a non-home page go to the home page's anchors (`/en/#works`, not `#works`). → Task 1 test `header anchors point at the home page`.
3. Sticky header must not cover anchor targets: sections have `scroll-margin-top`. → Task 4 test `anchored sections clear the sticky header`.
4. The mobile menu works without JS (native `<details>`) and the nav links live inside it. → Task 1 test `mobile menu is a native details element`.
5. Old bio links keep working: `/` still exposes every per-locale channel (header/footer icons), not only `/links`. → Task 4 test `home still exposes every channel`.

---

## File Structure

- Create `src/styles/theme.css`: tokens, base typography, buttons, focus ring, skip link, `.reveal` rules, reduced-motion rules.
- Create `src/layouts/BaseLayout.astro`: the only document wrapper (html/head/body, HeadMeta, fonts, JSON-LD, skip link, header, `<main id="main">`, footer, reveal + menu script).
- Create `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/components/SocialIcons.astro`, `src/components/SocialList.astro`, `src/components/social-brand.ts`.
- Create `src/components/home/Hero.astro`, `Works.astro`, `Process.astro`, `LatestVideo.astro`, `About.astro`, `CommissionBand.astro`, `Faq.astro`.
- Create `src/components/LinksPage.astro`, `src/pages/links.astro`, `src/pages/en/links.astro`.
- Rewrite `src/components/Home.astro` (composition only). Modify `ProductPage.astro`, `CommissionPage.astro`, `ShippingPage.astro` to use `BaseLayout`. Delete `src/components/InfoPage.astro`.
- Modify `src/i18n/content.ts` (new copy, remove dead fields), `tests/site.test.mjs`, `README.md`.

---

### Task 1: Theme, BaseLayout, header and footer on the info pages

**Files:**

- Create: `src/styles/theme.css`, `src/layouts/BaseLayout.astro`, `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/components/SocialIcons.astro`, `src/components/social-brand.ts`
- Modify: `src/components/ProductPage.astro`, `src/components/CommissionPage.astro`, `src/components/ShippingPage.astro`, `src/i18n/content.ts`
- Delete: `src/components/InfoPage.astro`
- Test: `tests/site.test.mjs`

**Interfaces:**

- Produces: `BaseLayout` props `{ locale: Locale; path: string; title?: string; description?: string; image?: string; jsonLd?: object[] }` (`title`/`description` default to `getContent(locale).meta`); default slot renders inside `<main id="main">`.
- Produces: `socialBrand(key: Social["key"]): { color: string; path: string | null }` in `social-brand.ts` (moves today's `brand` map out of `Home.astro`; Instagram included).
- Produces: `SocialIcons` props `{ locale: Locale }`: icon-only links for `getContent(locale).socials`, each with `aria-label` = social name.
- Produces: new `ui` keys in both locales: `navWorks` ("Works"/"Tác phẩm"), `navProcess` ("Process"/"Quy trình"), `navCommission` ("Commission"/"Đặt làm"), `navAbout` ("About"/"Giới thiệu"), `menu` ("Menu"/"Menu"), `skipToContent` ("Skip to content"/"Bỏ qua đến nội dung"), `footerTagline` ("Build Ideas Into Reality" in both), `linksPage` ("All links"/"Tất cả liên kết"). `langAria` becomes `"EN – English"` on vi and `"VI – Tiếng Việt"` on en (visible text "EN"/"VI" is then part of the name).

- [ ] **Step 1: Write failing tests** (new `describe("site chrome")`), for the 10 info pages (`commission`, `shipping`, 3 products × 2 locales):
  - `header and footer on every info page`: HTML contains `<header class="site-header"`, `<footer class="site-footer"`, `<a class="skip-link" href="#main"`, `<main id="main"`.
  - `fonts are Archivo and Space Grotesk`: HTML contains `family=Archivo` and `family=Space+Grotesk`, not `Be+Vietnam+Pro`.
  - `header anchors point at the home page`: on `en/products/resin-figure/index.html` the header contains `href="/en/#works"`, `href="/en/#process"`, `href="/en/#commission"`, `href="/en/#about"`; on the vi twin `href="/#works"`.
  - `mobile menu is a native details element`: header HTML matches `/<details class="site-menu"[\s\S]*href="\/en\/#works"[\s\S]*<\/details>/`.
  - `language link text is part of its accessible name`: `<a id="lang-toggle"` whose `aria-label` starts with its visible text (`EN`/`VI`).
  - `reveal is gated behind html.js`: concatenated `dist/_astro/*.css` contains `.js .reveal` (or `html.js .reveal`) and no bare `.reveal{opacity:0`; contains `prefers-reduced-motion`.
  - `dark tokens`: CSS contains `--bg:#000` (minified) and `--accent:#4c9aff` (case-insensitive).
- [ ] **Step 2:** Run `npm test`. Expected: the new tests FAIL; existing tests pass.
- [ ] **Step 3:** Implement `theme.css` (constraints above), `social-brand.ts`, `SocialIcons`, `SiteHeader` (monogram `/favicon-32.png` + "TIMOND LAB" wordmark linking home; desktop nav + `SocialIcons` + lang link; a `<details class="site-menu">` holding the same nav/icons for narrow screens, hidden ≥ 900px), `SiteFooter` (`SocialIcons`, email, links to commission, shipping and `/links`, tagline, `© 2026 Timond Lab`), `BaseLayout` (adds `document.documentElement.classList.add("js")` inline in head; one module script: IntersectionObserver adds `is-visible` to `.reveal`, and Escape closes an open `details.site-menu`). Port the three info pages to `BaseLayout`, restyle with the tokens (product page: image ~60% left, details right ≥ 900px), delete `InfoPage.astro`.
- [ ] **Step 4:** Run `npm test && npm run lint && npm run lint:eslint`. Expected: all pass (home page tests unchanged and still green; it still uses the old document until Task 4).
- [ ] **Step 5:** Commit `feat: add dark studio layout, header and footer to info pages`.

### Task 2: `/links` bio page

**Files:**

- Create: `src/components/SocialList.astro`, `src/components/LinksPage.astro`, `src/pages/links.astro`, `src/pages/en/links.astro`
- Modify: `src/i18n/content.ts`, `tests/site.test.mjs`

**Interfaces:**

- Consumes: `BaseLayout`, `socialBrand` (Task 1).
- Produces: `SocialList` props `{ locale: Locale }`: full rows (icon, name, handle) with class `social-item` on each `<a>` (keeps existing test selectors). New `ui` keys: `linksLead` ("Handmade miniatures from Vietnam" / "Mô hình thủ công từ Việt Nam"), `visitStudio` ("Visit the studio" / "Ghé thăm studio").

- [ ] **Step 1: Write failing tests** (`describe("links page")`): `dist/links/index.html` and `dist/en/links/index.html` exist, canonical/hreflang correct (`/links/`, `/en/links/`), each has a link to its home (`href="/"` / `href="/en/"`) with the `visitStudio` text; channel order assertions move here: en first `social-item` href is `mailto:timondlab@gmail.com` and contains no `zalo.me`/`shopee.vn`; vi first is `https://youtube.com/@timondlab` and contains both `zalo.me` and `shopee.vn`. Sitemap contains `https://timondlab.com/en/links/`.
- [ ] **Step 2:** Run `npm test`; expected new tests FAIL.
- [ ] **Step 3:** Implement `SocialList`, `LinksPage` (monogram, "Timond Lab", `linksLead`, primary button `visitStudio` → `localePath(locale)`, `SocialList`), both route wrappers.
- [ ] **Step 4:** Run `npm test && npm run lint`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add /links bio page`.

### Task 3: Studio copy and data in `content.ts`

**Files:**

- Modify: `src/i18n/content.ts`, `tests/site.test.mjs`

**Interfaces:**

- Produces: `Content.hero: { eyebrow: string; title: string; subtitle: string; ctas: HeroCta[] }` (replaces today's `{ subtitle; ctas }`).
- Produces: `Content.about: { eyebrow: string; title: string; body: string; makes: string[]; software: string; values: string }`.
- Produces: `processChapters(locale: Locale): { title: string; text: string }[]` (6 items, exported).
- Produces: `MAKER_PHOTO: string | null = null` and `latestVideo: { href: string; img: string | null }` (exported; today's internal `latestVideo`).
- Removes: `buildPublic`, `services`, `values`, and `ui` keys used only by removed UI (`searchPlaceholder`, `themeAria`, `socialTitle`, `noResults`, `bipTitle`, `bipSub`, `servicesTitle`, `valuesTitle`, `closing*`, `backToTop`, `ctaProducts`-style keys) once Task 4 stops using them. Keep `journeySteps`.
- Copy (exact):
  - en `meta.title` unchanged; vi `meta.title` = `Timond Lab · Mô hình thủ công & diorama từ Việt Nam`; vi `meta.description` = `Mô hình thu nhỏ, diorama và figure resin sơn tay, làm thủ công tại Việt Nam. Nhận đặt làm theo yêu cầu, giao hàng quốc tế.`
  - en hero: eyebrow `Handmade miniatures`, title `3D-printed, resin-cast and hand-painted in Vietnam.`, subtitle `Dioramas, architectural miniatures and hand-painted resin figures. Custom commissions welcome, shipped worldwide.`, ctas `Request a commission` → `/en/commission/` (primary), `View works` → `#works` (secondary).
  - vi hero: eyebrow `Mô hình thủ công`, title `In 3D, đổ resin và sơn tay tại Việt Nam.`, subtitle `Diorama, mô hình kiến trúc và figure resin sơn tay. Nhận đặt làm theo yêu cầu, giao hàng quốc tế.`, ctas `Đặt làm theo yêu cầu` → `/commission/`, `Xem tác phẩm` → `#works`.
  - en about: eyebrow `About`, title `A small studio for miniature art`, body `Timond Lab blends technology and craftsmanship: every piece goes from idea to 3D model, print, resin, hand painting and careful packaging.`, makes `["Custom miniatures", "Figure painting", "Diorama design"]`, software `The studio also builds software.`, values `Quality first · Handcrafted · Attention to detail · Always learning`.
  - vi about: eyebrow `Giới thiệu`, title `Studio nhỏ cho nghệ thuật mô hình`, body `Timond Lab kết hợp công nghệ và thủ công: mỗi tác phẩm đi từ ý tưởng đến mô hình 3D, in, đổ resin, sơn tay và đóng gói cẩn thận.`, makes `["Mô hình theo yêu cầu", "Sơn figure", "Thiết kế diorama"]`, software `Studio cũng phát triển phần mềm.`, values `Chất lượng hàng đầu · Thủ công tỉ mỉ · Chú trọng chi tiết · Học hỏi không ngừng`.
  - `processChapters`: titles = `journeySteps`; texts = `commission.steps[0].text`, `[2].text`, `[3].text`, `[4].text`, `[5].text`, then `shipping.intro` (all existing copy).

- [ ] **Step 1: Write failing tests** importing `../src/i18n/content.ts`: `processChapters("en")` has 6 items, first title `Idea`, last text equals `getContent("en").shipping.intro`; `getContent("vi").hero.title` is the vi title above; `MAKER_PHOTO === null`; `latestVideo.href === LATEST_VIDEO_URL`; `getContent("en").about.makes.length === 3`.
- [ ] **Step 2:** Run `npm test`; expected FAIL (missing exports/fields).
- [ ] **Step 3:** Add the fields and helpers. Keep old fields until Task 4 removes their last use, so this task builds green.
- [ ] **Step 4:** Run `npm test && npm run lint`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add studio copy and process chapters`.

### Task 4: Rebuild the home page

**Files:**

- Create: `src/components/home/Hero.astro`, `Works.astro`, `Process.astro`, `LatestVideo.astro`, `About.astro`, `CommissionBand.astro`, `Faq.astro`
- Rewrite: `src/components/Home.astro`
- Modify: `src/i18n/content.ts` (remove dead fields), `tests/site.test.mjs`

**Interfaces:**

- Consumes: `BaseLayout`, `SocialIcons` (Task 1), `Content.hero`, `Content.about`, `processChapters`, `latestVideo`, `MAKER_PHOTO` (Task 3), `organizationJsonLd` (existing).
- Section ids: `works`, `process`, `about`, `commission`; each section element has class `reveal` and `scroll-margin-top` ≥ header height.
- Keep these markup contracts (existing tests rely on them): FAQ answers in `<div class="faq-answer">`; the `lang-toggle` id; Coming Soon card has no link.

- [ ] **Step 1: Update and add tests.**
  - Update `one language per URL`: vi contains `Xem tác phẩm`, not `View works`; en the reverse.
  - Update `never stores or reads a language preference` → `uses no localStorage`: home HTML contains no `localStorage`.
  - Update `vi page keeps Vietnamese title and description` → asserts the new vi title and description.
  - Update `en hero promotes commissions; vi hero is unchanged` → `heroes promote commissions`: en has `<a href="/en/commission/" class="btn btn-primary"[^>]*>Request a commission</a>`, vi has `<a href="/commission/" class="btn btn-primary"[^>]*>Đặt làm theo yêu cầu</a>`; neither contains `Lập trình viên phần mềm` or `Software Developer`.
  - Move `en page lists Email first` / `vi page keeps Zalo and Shopee and original order` to Task 2's `/links` tests (delete here); keep `en page hides Vietnam-only channels` on home.
  - Update latest video test: the linked card selector becomes `<a\b[^>]*class="video-card"`.
  - Update Coming Soon test selector to the `work-card` with `data-slug` absent / name `Coming Soon`.
  - Add `home has the four anchor sections`: `id="works"`, `id="process"`, `id="about"`, `id="commission"`.
  - Add `anchored sections clear the sticky header`: CSS contains `scroll-margin-top`.
  - Add `home still exposes every channel`: vi home contains `zalo.me`, `shopee.vn`, `youtube.com/@timondlab`; en home contains `mailto:timondlab@gmail.com`.
  - Add `no emoji in rendered HTML`: no page in `dist` matches `/\p{Extended_Pictographic}/u` outside `<script>`.
  - Add `process shows six chapters`: home has 6 `class="process-step"`.
  - Add `about has no portrait while MAKER_PHOTO is null`: `#about` section contains no `<img`.
  - Extend Task 1's chrome tests' page list with `index.html` and `en/index.html`.
- [ ] **Step 2:** Run `npm test`. Expected: updated/added home tests FAIL.
- [ ] **Step 3:** Implement the sections per the spec's Information architecture (order: Hero, Works, Process, LatestVideo, About, CommissionBand, Faq) and rewrite `Home.astro` as `BaseLayout` + sections + Organization JSON-LD. Hero: desktop split (text left, `prod-thap.webp` right at ≤ its natural 1000px, `fetchpriority="high"`, `loading="eager"`), mobile image above text. Works: 2-column grid ≥ 900px, `work-card` with image, name, description, link to `localePath(locale, "/products/<slug>/")`. Remove all old CSS/JS from the former `Home.astro` and dead `content.ts` fields.
- [ ] **Step 4:** Run `npm test && npm run lint && npm run lint:eslint && npm run format:check`. Expected: all pass.
- [ ] **Step 5:** Commit `feat: rebuild home page as a dark studio gallery`.

### Task 5: Verify, polish and document

**Files:**

- Modify: `README.md`, any component needing a fix found below; `tests/site.test.mjs` for any bug found (test first).

- [ ] **Step 1:** Build, preview, and screenshot `/`, `/en/`, `/en/products/resin-figure/`, `/en/commission/`, `/en/links/` at 375px, 768px, 1440px (Playwright, deviceScaleFactor 1). Check: no horizontal scroll at 375px (`document.documentElement.scrollWidth <= innerWidth`), Vietnamese diacritics render in Archivo headings, focus ring visible when tabbing the header, Escape closes the open mobile menu.
- [ ] **Step 2:** Run Lighthouse via `npx @lhci/cli collect` (repo config; do not `upload`) and confirm accessibility ≥ 0.9 and no new contrast failures on all collected pages; delete `.lighthouseci/` afterwards.
- [ ] **Step 3:** For each defect found, add a failing test, fix, rerun `npm test`.
- [ ] **Step 4:** README: describe the layout (`BaseLayout`, sections, `/links`), how to set `MAKER_PHOTO`, and that social bios should point to `/links/`.
- [ ] **Step 5:** Run all checks (`npm run lint && npm run lint:eslint && npm run format:check && npm test`), commit `docs: document studio layout and links page`.

---

## Self-Review

- **Spec coverage:** visual system (T1), header/footer/menu/anchors/socials (T1), `/links` (T2), owner decisions on VI positioning and unverified photos (T3, T4), home IA sections (T4), info pages restyle (T1), accessibility items (T1, T4, T5), tests and Lighthouse (all, T5).
- **Types:** `BaseLayout` props, `socialBrand`, `SocialIcons`/`SocialList` `{ locale }`, `Content.hero`, `Content.about`, `processChapters`, `latestVideo`, `MAKER_PHOTO` are defined once and used with the same names.
- **Review Focus:** each of the 5 lines has a named test in T1 or T4.
