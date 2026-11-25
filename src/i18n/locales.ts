export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";
export const SITE_URL = "https://timondlab.com";

/** Path for a locale: vi lives at the root, en under /en. Always ends with "/". */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const withSlash = clean.endsWith("/") ? clean : `${clean}/`;
  return locale === defaultLocale ? withSlash : `/${locale}${withSlash}`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "vi" ? "en" : "vi";
}
