# AI-agent readability layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every public page a markdown twin, add `llms.txt`/`llms-full.txt`, an explicit AI-bot `robots.txt`, alternate links and `FAQPage` JSON-LD, all generated from existing copy.

**Architecture:** One pure module `src/seo/markdown.ts` turns `getContent(locale)` into markdown strings. Two Astro static endpoints emit the twins and the llms files. `HeadMeta` advertises the twins. No new dependencies, no server code.

**Tech Stack:** Astro 7 static endpoints (`APIRoute`, `getStaticPaths`), TypeScript, `node:test` on built `dist/`.

**Spec:** `docs/superpowers/specs/2026-11-26-ai-agent-readability-design.md`

## Global Constraints

- All facts come from `src/i18n/content.ts`, `MESSENGER_URL`, `ZALO_URL`, `LATEST_VIDEO_URL`, `productFacts`; no invented prices, reviews, places or claims.
- Markdown says what the HTML says (no cloaking); price shows `ui.priceOnRequest` while `priceUsd` is null.
- Chat channels (Messenger + Zalo) are listed on both locales (owner decision in the redesign spec); EN still omits Shopee and unset Instagram (`INSTAGRAM_URL === null`).
- Absolute URLs use `SITE_URL` from `src/i18n/locales.ts`; locale paths via `localePath`.
- No new npm dependencies; Prettier, ESLint, `astro check`, lychee and `npm test` must pass; commits are Conventional Commits (`feat:`), gate commits with `&&`.
- Markdown URL scheme: `/index.md`, `/<page>.md`, `/products/<slug>.md`, same under `/en/`.

## Review Focus

- Product with `slug: null` ("coming soon") must not get a twin or a link in `llms.txt`.
- `llms.txt` and every `.md` must contain only absolute `https://timondlab.com/...` links that resolve to built files (lychee-safe).
- Vietnamese diacritics survive intact and the response is served as UTF-8 (`_headers` sets `charset=utf-8`).
- English markdown must contain no Vietnamese-only channel (Shopee) and no `null`/`undefined` strings.
- JSON-LD must stay valid JSON with `<` escaped (reuse `jsonLdScript`).

---

### Task 1: Markdown renderer

**Files:**

- Create: `src/seo/markdown.ts`
- Test: `tests/markdown.test.mjs` (imports the built endpoint output from `dist/`; the shared `before` build comes from running `npm run build` first — copy the `before` build hook pattern from `tests/site.test.mjs`)

**Interfaces:**

- Produces:
  - `export type MdPage = { locale: Locale; path: string; file: string }` where `path` is the locale-independent page path (`"/"`, `"/commission/"`, `"/shipping/"`, `"/links/"`, `"/products/<slug>/"`) and `file` the published path without a leading slash (`"index.md"`, `"en/commission.md"`, `"products/miniature-diorama.md"`).
  - `export function mdPages(): MdPage[]` — all locales × all pages; products only where `slug !== null`.
  - `export function pageMarkdown(locale: Locale, path: string): string` — starts with `# <page title>`, ends with a trailing newline.
  - `export function mdUrl(locale: Locale, path: string): string` — absolute URL of the twin.

- [ ] **Step 1: Write failing tests** in `tests/markdown.test.mjs` (build once in `before`, then read files):
  - `dist/index.md` starts with `# ` and contains `https://m.me/timondlab`, `https://zalo.me/84856694766`, every non-null product name, and the text `ui.priceOnRequest`-equivalent "Price on request"/Vietnamese equivalent for the product page.
  - `dist/en/index.md` contains no `Shopee`, no `undefined`, no `null`, contains `https://timondlab.com/en/commission/`.
  - `dist/products/miniature-diorama.md` and `dist/en/products/miniature-diorama.md` exist; `dist/products/` has no file for a null-slug product.
  - Every `https://timondlab.com/...` link in every `.md` maps to an existing file in `dist` (path ending `/` → `index.html`).
  - `dist/index.md` contains Vietnamese diacritics from the hero title unchanged.
- [ ] **Step 2: Run** `node --test tests/markdown.test.mjs` — expect FAIL (files missing).
- [ ] **Step 3: Implement `mdPages`, `pageMarkdown`, `mdUrl`** in `src/seo/markdown.ts`. Home: hero title/subtitle, works list (name, desc, link to product page), process chapters via `processChapters(locale)`, about (body, makes, software, values), commission summary + link, FAQ as `## ` Q / answer, contact channels, latest-video link. Commission page: title, intro, steps, include list. Shipping: intro, region table (markdown table; `days === null` renders "Quoted per order"-equivalent from `ui`), duties and returns notices. Links page: channel list from `socials` filtered like `LinksPage`. Product page: name, desc, price, lead time (`ui.quotedPerOrder` when null), contact channels, links to shipping and commission. Every page ends with a "Canonical HTML:" line linking the human page.
- [ ] **Step 4: Create the endpoint** `src/pages/[...mdpath].md.ts`: `getStaticPaths` maps `mdPages()` to `{ params: { mdpath: file.replace(/\.md$/, "") }, props: { locale, path } }`; `GET` returns `new Response(pageMarkdown(locale, path), { headers: { "Content-Type": "text/markdown; charset=utf-8" } })`. If Astro rejects the `.md.ts` rest filename, fall back to one explicit endpoint per page type; keep the URL scheme.
- [ ] **Step 5: Run** `npm run build && node --test tests/markdown.test.mjs` — expect PASS.
- [ ] **Step 6: Commit** `git add src tests && git commit -m "feat: markdown twins for every page"` (with the attribution trailer).

### Task 2: llms.txt and llms-full.txt

**Files:**

- Create: `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`
- Modify: `src/seo/markdown.ts` (add `llmsIndex(): string`, `llmsFull(): string`)
- Test: `tests/markdown.test.mjs`

**Interfaces:**

- Consumes: `mdPages`, `pageMarkdown`, `mdUrl` (Task 1).
- Produces: `llmsIndex()` follows the llms.txt format: `# Timond Lab`, a `> ` one-line summary taken from `getContent("en").meta.description`, then `## Vietnamese` and `## English` sections with `- [Title](absolute .md url): description` lines; `llmsFull()` concatenates every page markdown, Vietnamese then English, separated by `---` and headed by the page URL.

- [ ] **Step 1: Failing tests:** `dist/llms.txt` starts with `# Timond Lab`, has a `> ` line, lists every `mdUrl` exactly once, links resolve to built `.md` files; `dist/llms-full.txt` contains each page's `# ` title and is larger than the sum of home pages.
- [ ] **Step 2: Run** the tests — expect FAIL.
- [ ] **Step 3: Implement** the two functions and endpoints (`Content-Type: text/plain; charset=utf-8`).
- [ ] **Step 4: Run** `npm run build && node --test tests/markdown.test.mjs` — expect PASS.
- [ ] **Step 5: Commit** `feat: llms.txt and llms-full.txt`.

### Task 3: Advertise the twins in the HTML

**Files:**

- Modify: `src/components/HeadMeta.astro` (add `<link rel="alternate" type="text/markdown" href={mdUrl(locale, path)}>` for pages in `mdPages()` only), `src/components/SiteFooter.astro` (one small link "llms.txt" is NOT added; keep the UI unchanged)
- Test: `tests/markdown.test.mjs`

**Interfaces:** Consumes `mdUrl`, `mdPages` (Task 1).

- [ ] **Step 1: Failing test:** for every `MdPage`, the built HTML (`dist/<path>/index.html`) contains exactly one `rel="alternate" type="text/markdown"` link whose href equals the twin's absolute URL; 404 page has none.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement** in `HeadMeta.astro`; `HeadMeta` already receives `locale` and `path`.
- [ ] **Step 4: Run** `npm run build && npm test` — expect all PASS (existing 112 tests unchanged).
- [ ] **Step 5: Commit** `feat: link markdown twins from every page head`.

### Task 4: AI-bot policy and headers

**Files:**

- Modify: `public/robots.txt`
- Create: `public/_headers`
- Test: `tests/markdown.test.mjs`

- [ ] **Step 1: Failing tests:** `dist/robots.txt` has an explicit `User-agent:` block with `Allow: /` for each of `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Google-Extended`, still contains the sitemap line and the `User-agent: *` block; `dist/_headers` sets `Content-Type: text/markdown; charset=utf-8` for `/*.md` and `text/plain; charset=utf-8` for `/llms.txt` and `/llms-full.txt`.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement** both files; add a comment in `robots.txt` saying "change a training bot to `Disallow: /` to opt out".
- [ ] **Step 4: Run** `npm run build && npm test` — PASS.
- [ ] **Step 5: Commit** `feat: explicit AI crawler policy and markdown headers`.

### Task 5: FAQPage structured data

**Files:**

- Modify: `src/seo/jsonld.ts` (add `faqJsonLd(locale: Locale): object`), `src/components/Home.astro` (pass it in `jsonLd`)
- Test: `tests/markdown.test.mjs` (or the existing site test file)

**Interfaces:** `faqJsonLd` returns `{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } }] }` from `getContent(locale).faq`.

- [ ] **Step 1: Failing test:** both home pages contain a parsed `application/ld+json` block with `@type: "FAQPage"` and one question per `faq` entry whose text equals the visible FAQ question.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement** and wire into Home via `jsonLdScript`.
- [ ] **Step 4: Run** `npm run build && npm test` — PASS.
- [ ] **Step 5: Commit** `feat: FAQPage structured data on home pages`.

### Task 6: Verify and document

**Files:**

- Modify: `README.md` (short "For AI agents" section: URL scheme, how to opt out of training bots)

- [ ] **Step 1:** Run `npx astro check && npx eslint . && npx prettier --check . && npm run build && npm test` — all green.
- [ ] **Step 2:** Spot-read `dist/index.md`, `dist/en/products/miniature-diorama.md`, `dist/llms.txt` for sense and absence of invented facts.
- [ ] **Step 3: Commit** `docs: describe the AI-agent layer`, push `claude/nice-goldberg-y213ko`; open a PR only when the owner asks.
