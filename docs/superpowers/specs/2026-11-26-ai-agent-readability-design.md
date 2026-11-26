# AI-agent readability layer — Design

Status: short design for a small, additive change. The owner asked ("nâng cấp site chuyển sang marketing cho AI agent … dạng gì để AI đọc nhanh, SEO cho AI, ví dụ .md") and then asked for the plan. Items marked _(my call)_ can be overridden.

## Intent and the why

AI assistants and agents (ChatGPT search, Claude, Perplexity, shopping agents) increasingly answer "who makes custom miniatures / dioramas / painted resin figures, and how do I order?". Timond Lab wants to be found and described correctly there. The human site stays as it is; we add a layer an agent can read cheaply and unambiguously.

## Evidence (honest framing)

- `llms.txt` is rarely fetched by AI crawlers and Google says it does not use it. It is cheap and harmless, so we ship it, but it is not the main lever.
- Clear, specific, answer-first content and clean per-page markdown help any agent that fetches a page. Structured data is not proven to raise citations but is standard and low cost.
- Cloudflare's edge "Markdown for Agents" may need a paid plan, so we do not depend on it; we generate markdown at build time instead.

## Goals

- Every public page has a markdown twin at a predictable URL, generated from the same copy in `src/i18n/content.ts` (no second source of truth, no new claims).
- Agents find the twins: `<link rel="alternate" type="text/markdown">` on each HTML page, an `llms.txt` index and an `llms-full.txt` with everything in one file.
- `robots.txt` states an explicit AI-bot policy _(my call: allow training, search and user-triggered bots; the owner can switch training bots to Disallow later)_.
- Richer JSON-LD: `FAQPage` on both home pages.
- Prices, lead times and contact channels appear in the markdown exactly as the HTML shows them ("price on request" while `productFacts` is null).

## Non-goals / anti-goals

- No invented facts: no prices, reviews, awards, locations or capabilities that are not already in `content.ts`.
- No cloaking: the markdown must say the same thing as the HTML page (same facts, same links).
- No server code, no new dependencies, no change to the visual design.
- The HTML pages, tests and CI gates keep working.

## Constraints

Astro 7 static output on Cloudflare Workers static assets; copy only from `content.ts`; Prettier/ESLint/astro check/lychee gates; Conventional Commits.

## Approaches

- **A. Build-time markdown twins + llms.txt + robots + JSON-LD (chosen).** Works on the current static deploy, free, deterministic, testable on `dist/`.
- **B. Cloudflare edge Markdown for Agents.** Zero code but plan-dependent and uncontrollable; can be enabled later on top of A.
- **C. A Worker doing `Accept: text/markdown` negotiation.** Reintroduces server code; rejected for a static studio site.

## URL scheme

`/index.md`, `/commission.md`, `/shipping.md`, `/links.md`, `/products/<slug>.md`, and the same under `/en/`. Plus `/llms.txt` and `/llms-full.txt` (Vietnamese first, English second, both labelled).

## Left to the builder

Exact markdown wording of headings, ordering inside each page, and how the generator is factored, as long as every fact comes from `content.ts`.
