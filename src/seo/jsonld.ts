import { getContent } from "../i18n/content";
import { SITE_URL, localePath, type Locale } from "../i18n/locales";

const PROFILE_KEYS = ["youtube", "tiktok", "facebook", "shopee"];

export function organizationJsonLd(locale: Locale): object {
  const { socials } = getContent(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Timond Lab",
    url: `${SITE_URL}${localePath(locale)}`,
    logo: `${SITE_URL}/avatar.webp`,
    email: socials.find((s) => s.key === "email")?.handle,
    knowsLanguage: ["vi", "en"],
    sameAs: socials
      .filter((s) => PROFILE_KEYS.includes(s.key))
      .map((s) => s.href),
  };
}

/** Serialise for a <script type="application/ld+json"> body; "<" is escaped so the block cannot close early. */
export function jsonLdScript(obj: object): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
