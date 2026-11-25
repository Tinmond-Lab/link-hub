# LinkHub — Timond Lab

The bilingual (VI/EN) website of **Timond Lab**, a studio making handmade miniatures, dioramas and hand-painted resin figures in Vietnam. Each language has its own indexable URL. Built with [Astro](https://astro.build).

A dark "gallery" studio site. The home page sections are a hero, selected works, process, latest video, about, a commission band and an FAQ. The full list of social channels lives on a separate `/links/` page (`/en/links/` in English). Vietnamese lives at `/`, English at `/en/`; the language toggle is a plain link between the two. The theme is dark only, with tokens in `src/styles/theme.css`.

## Project Structure

```text
/
├── public/            # Static assets (favicon, avatar)
├── src/
│   ├── i18n/          # locales.ts (URL helpers) and content.ts (all copy and data per locale)
│   ├── seo/           # JSON-LD builders
│   ├── layouts/       # BaseLayout: header, footer, skip link, mobile menu, reveal script
│   ├── components/    # Home, LinksPage, ProductPage, CommissionPage, ShippingPage, header/footer, social icons
│   │   └── home/      # Home sections: Hero, Works, Process, LatestVideo, About, CommissionBand, Faq
│   ├── styles/        # theme.css (design tokens, buttons, base styles)
│   └── pages/         # index, links, commission, shipping, products/[slug] — each with an en/ twin
├── tests/             # node:test assertions on the built dist/ (npm test)
├── .github/workflows/     # CI: lint, format, build, lighthouse, broken-link check
└── package.json
```

`src/layouts/BaseLayout.astro` wraps every page (header, footer, skip link, `<details>` mobile menu that closes on Escape, scroll-reveal script that respects `prefers-reduced-motion`). `src/components/Home.astro` composes the sections in `src/components/home/`; each renders one language per URL from `getContent(locale)`. The pages under `src/pages/` are thin wrappers that pick the locale.

### Links page and social bios

`/links/` and `/en/links/` list every channel for that locale. Point social-profile bios (YouTube, TikTok, Facebook, etc.) at `https://timondlab.com/links/` (Vietnamese) or `https://timondlab.com/en/links/`.

### Maker photo

The About section shows a photo of the maker only when `MAKER_PHOTO` in `src/i18n/content.ts` is set. It is `null` by default (no photo is shown). Put the image under `public/` and set it to its path, e.g. `export const MAKER_PHOTO: string | null = "/maker.webp";`.

### Editing copy and data

All text, products, FAQ and social links live in `src/i18n/content.ts`. Add or change a string in both the `vi` and `en` objects. Product pages are generated from `products` entries that have a `slug`.

### Still needed from the owner

These ship as safe placeholders ("Price on request", "Quoted per order") until filled in `content.ts`:

- `priceUsd` and `leadTime` for each product, in the `productFacts` table in `content.ts` (a product with `priceUsd: null` emits no `offers` in its JSON-LD)
- the shipping table (`shipping.regions`) and the wording of `dutiesNotice` / `returnsNotice`
- `INSTAGRAM_URL` (the Instagram link stays hidden on the English page while it is `null`)

## Tests

`npm test` builds the site and asserts on the generated HTML in `dist/`: locale routing, hreflang/canonical/OG tags, sitemap, JSON-LD, product/commission/shipping pages, and per-locale channels.

## Commands

All commands run from the root of the project:

| Command                | Action                                     |
| :--------------------- | :----------------------------------------- |
| `npm install`          | Install dependencies                       |
| `npm run dev`          | Start local dev server at `localhost:4321` |
| `npm run build`        | Build the production site to `./dist/`     |
| `npm run preview`      | Preview the production build locally       |
| `npm run lint`         | Type/template-check with `astro check`     |
| `npm run lint:eslint`  | Lint with ESLint                           |
| `npm run format`       | Format the codebase with Prettier          |
| `npm run format:check` | Check formatting without writing changes   |

When developing with an agent (Claude Code), start the dev server in background mode: `astro dev --background`, then manage it with `astro dev stop` / `astro dev status` / `astro dev logs`.

## Latest video

The "Latest Video" section on the home page is built at build time from one constant, `LATEST_VIDEO_URL` in `src/i18n/content.ts`. To show a newer video, paste its YouTube link there (Shorts, `watch?v=` and `youtu.be` links all work), then deploy. The thumbnail is derived from the video id (`https://i.ytimg.com/vi/<id>/maxresdefault.jpg`) and the card links to the video.

There is no server code: the site is fully static, so it deploys anywhere.

## Deploy (Cloudflare Workers)

`wrangler.json` points Workers Builds at the static `dist/` folder (`npx wrangler deploy` uploads it as assets). Keep this file: without it Wrangler tries to auto-configure an Astro adapter and the deploy fails. The build command stays `npm run build`.

## CI

Every pull request runs: PR title lint, commitlint, gitleaks, `astro check`, ESLint, Prettier check, build, Lighthouse CI (performance/accessibility/SEO gate), and a broken-link check (lychee) against the built HTML. Releases are automated with [release-please](https://github.com/googleapis/release-please).

## Learn more

[Astro documentation](https://docs.astro.build)
