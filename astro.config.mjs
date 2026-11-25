// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://timondlab.com",
  i18n: {
    defaultLocale: "vi",
    locales: ["vi", "en"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: "vi", locales: { vi: "vi-VN", en: "en-US" } },
    }),
  ],
});
