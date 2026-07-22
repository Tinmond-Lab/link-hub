# LinkHub — Timond Lab

A bilingual (VI/EN) link-in-bio landing page for **Timond Lab**, a studio blending software development with handcrafted miniature art (diorama, resin figures, figure painting). Built with [Astro](https://astro.build).

Live sections: hero, about, social links (with live search filter), featured products, the making journey, build-in-public, services, values, and FAQ — plus light/dark theme and VI/EN language toggle, both persisted in `localStorage`.

## Project Structure

```text
/
├── public/            # Static assets (favicon, avatar)
├── src/
│   └── pages/
│       └── index.astro   # The entire single-page site
├── .github/workflows/     # CI: lint, format, build, lighthouse, broken-link check
└── package.json
```

The site is currently a single page (`src/pages/index.astro`) containing markup, scoped styles, and a small client-side script (theme/language toggle, search filter, scroll-reveal animations, journey step runner).

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

## Latest video thumbnail

`public/api/latest-video.php` resolves the TimondLab YouTube channel's latest video via YouTube's RSS feed (no API key needed) and caches the result for an hour. `src/pages/index.astro` fetches it client-side on page load and swaps the "Latest Video" build-in-public card's placeholder for the real thumbnail, linking it to the video.

This lives in PHP because the site currently deploys to shared PHP hosting. A client-side-only fetch straight to YouTube isn't possible — the browser blocks it via CORS, since YouTube's channel page and RSS feed don't send `Access-Control-Allow-Origin` headers permitting cross-origin reads. The fetch has to happen server-side; PHP is just whatever the current host supports.

**Migrating to a different host?** Port the fetch logic, not the whole design:

- **Vercel / Netlify** (or anything with serverless/edge functions): rewrite `latest-video.php`'s logic as a Node function at the same `/api/latest-video` path.
- **Static-only host** (no server runtime at request time): move the same fetch into the Astro frontmatter of `index.astro` so it runs at _build time_ via Node instead of per-request. Works on any static host with zero server dependency, but the thumbnail then only refreshes when the site is rebuilt and redeployed, not live per visit.

Either way, keep the JSON response shape (`{ videoId, title, videoUrl, thumbnailUrl }`) so the client script in `index.astro` doesn't need to change.

**Before deploying:** `latest-video.php` has a `?debug=1&token=...` mode for troubleshooting (see the comment at the top of the file). It's gated behind a token so it can't be used by outside visitors to force unlimited live requests or read server details — set your own via the `LATEST_VIDEO_DEBUG_TOKEN` environment variable if your host supports one, otherwise change `DEBUG_TOKEN_FALLBACK` in the file to your own random string. The cache file is also written outside the web root (two directories above the script) when possible, rather than a predictable path in the shared system temp directory.

## CI

Every pull request runs: PR title lint, commitlint, gitleaks, `astro check`, ESLint, Prettier check, build, Lighthouse CI (performance/accessibility/SEO gate), and a broken-link check (lychee) against the built HTML. Releases are automated with [release-please](https://github.com/googleapis/release-please).

## Learn more

[Astro documentation](https://docs.astro.build)
