Product photos, used by the home page works grid and the product pages (see `products` in `src/i18n/content.ts`):

- `prod-thap.webp` — Tháp Nghinh Phong
- `prod-diorama.webp` — Miniature Diorama
- `prod-figure.webp` — Resin Figure
- `prod-soon.webp` — Coming Soon

Replacing a photo later? Upload a file with the same name and re-deploy the site. If the new photo has a different size, update its `imgWidth` / `imgHeight` in `src/i18n/content.ts` too (a test checks that they match the file). Keep it `.webp`; compress it first (photos straight from a camera are typically several MB — see the compression note in the repo's README, or just re-run it through an image tool at ~80% quality, max ~1000px wide).
