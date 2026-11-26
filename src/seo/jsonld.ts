import { getContent, servicePrice, type Product } from "../i18n/content";
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

export function productJsonLd(locale: Locale, p: Product): object {
  const url = `${SITE_URL}${localePath(locale, `/products/${p.slug}/`)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.desc,
    image: `${SITE_URL}${p.img}`,
    url,
    brand: { "@type": "Brand", name: "Timond Lab" },
    // Google rejects offers without a price, so omit them until one is set.
    ...(p.priceUsd !== null && {
      offers: {
        "@type": "Offer",
        url,
        price: p.priceUsd.toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    }),
  };
}

export function faqJsonLd(locale: Locale): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: getContent(locale).faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** One Service per priced offering; prices are VND ranges (or "from"). */
export function servicesJsonLd(locale: Locale): object[] {
  return getContent(locale).services.map((s) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: `${s.desc} ${servicePrice(locale, s)}`,
    provider: { "@type": "Organization", name: "Timond Lab", url: SITE_URL },
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "VND",
        minPrice: s.minVnd,
        ...(s.maxVnd !== null && { maxPrice: s.maxVnd }),
      },
    },
  }));
}
