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

## CI

Every pull request runs: PR title lint, commitlint, gitleaks, `astro check`, ESLint, Prettier check, build, Lighthouse CI (performance/accessibility/SEO gate), and a broken-link check (lychee) against the built HTML. Releases are automated with [release-please](https://github.com/googleapis/release-please).

## Learn more

[Astro documentation](https://docs.astro.build)
