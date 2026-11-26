import {
  LATEST_VIDEO_URL,
  MESSENGER_URL,
  ZALO_URL,
  getContent,
  processChapters,
  servicePrice,
} from "../i18n/content";
import { SITE_URL, localePath, locales, type Locale } from "../i18n/locales";

/** One markdown twin: `path` is locale-independent, `file` is the published path without a leading slash. */
export type MdPage = { locale: Locale; path: string; file: string };

const STATIC_PATHS = ["/", "/commission/", "/shipping/", "/links/"];

function fileFor(locale: Locale, path: string): string {
  const base = path === "/" ? "index" : path.replace(/^\/|\/$/g, "");
  return `${locale === "vi" ? "" : "en/"}${base}.md`;
}

export function mdPages(): MdPage[] {
  return locales.flatMap((locale) => {
    const slugs = getContent(locale)
      .products.filter((p) => p.slug)
      .map((p) => `/products/${p.slug}/`);
    return [...STATIC_PATHS, ...slugs].map((path) => ({
      locale,
      path,
      file: fileFor(locale, path),
    }));
  });
}

export function mdUrl(locale: Locale, path: string): string {
  return `${SITE_URL}/${fileFor(locale, path)}`;
}

const htmlUrl = (locale: Locale, path: string) =>
  `${SITE_URL}${localePath(locale, path)}`;

function contactLines(locale: Locale): string[] {
  const { ui, socials } = getContent(locale);
  const email = socials.find((s) => s.key === "email");
  return [
    `- ${ui.contactFacebook}: ${MESSENGER_URL}`,
    `- ${ui.contactZalo}: ${ZALO_URL}`,
    ...(email ? [`- Email: ${email.handle}`] : []),
  ];
}

function servicesSection(locale: Locale): string[] {
  const c = getContent(locale);
  return [
    `## ${c.ui.servicesTitle}`,
    "",
    c.ui.servicesLead,
    "",
    ...c.services.map(
      (s) => `- **${s.name}**: ${servicePrice(locale, s)}. ${s.desc}`,
    ),
  ];
}

function faqSection(locale: Locale): string[] {
  const c = getContent(locale);
  return [
    `## ${c.ui.faqTitle}`,
    "",
    ...c.faq.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
  ];
}

function home(locale: Locale): string[] {
  const c = getContent(locale);
  const { ui } = c;
  return [
    `# Timond Lab: ${c.hero.title}`,
    "",
    c.hero.subtitle,
    "",
    `## ${ui.worksTitle}`,
    "",
    ...c.products.map((p) =>
      p.slug
        ? `- [${p.name}](${htmlUrl(locale, `/products/${p.slug}/`)}): ${p.desc}`
        : `- ${p.name}: ${p.desc}`,
    ),
    "",
    `## ${ui.processTitle}`,
    "",
    ...processChapters(locale).map(
      (s, i) => `${i + 1}. **${s.title}**: ${s.text}`,
    ),
    "",
    `## ${c.about.title}`,
    "",
    c.about.body,
    "",
    ...c.about.makes.map((m) => `- ${m}`),
    "",
    c.about.software,
    "",
    ...servicesSection(locale),
    "",
    `## ${c.commission.title}`,
    "",
    c.commission.intro,
    "",
    `[${ui.commissionLink}](${htmlUrl(locale, "/commission/")}) · [${ui.shippingLink}](${htmlUrl(locale, "/shipping/")})`,
    "",
    `## ${ui.videoTitle}`,
    "",
    `[${ui.videoWatch}](${LATEST_VIDEO_URL})`,
    "",
    ...faqSection(locale),
    `## ${ui.navCommission}`,
    "",
    ...contactLines(locale),
  ];
}

function commission(locale: Locale): string[] {
  const c = getContent(locale);
  return [
    `# ${c.commission.title}`,
    "",
    c.commission.intro,
    "",
    ...servicesSection(locale),
    "",
    `## ${c.commission.stepsTitle}`,
    "",
    ...c.commission.steps.map((s, i) => `${i + 1}. **${s.title}**: ${s.text}`),
    "",
    `## ${c.commission.includeTitle}`,
    "",
    ...c.commission.include.map((i) => `- ${i}`),
    "",
    `## ${c.ui.navCommission}`,
    "",
    ...contactLines(locale),
  ];
}

function shipping(locale: Locale): string[] {
  const { shipping: s, ui } = getContent(locale);
  return [
    `# ${s.title}`,
    "",
    s.intro,
    "",
    `| ${s.regionCol} | ${s.timeCol} | ${s.costCol} |`,
    "| --- | --- | --- |",
    ...s.regions.map(
      (r) => `| ${r.name} | ${r.days ?? ui.quotedPerOrder} | ${r.cost} |`,
    ),
    "",
    `## ${s.dutiesTitle}`,
    "",
    s.dutiesNotice,
    "",
    `## ${s.returnsTitle}`,
    "",
    s.returnsNotice,
  ];
}

function links(locale: Locale): string[] {
  const { ui, socials } = getContent(locale);
  return [
    `# ${ui.linksTitle}`,
    "",
    ui.linksLead,
    "",
    `- [${ui.visitStudio}](${htmlUrl(locale, "/")})`,
    ...socials.map((s) => `- ${s.name}: ${s.href}`),
  ];
}

function product(locale: Locale, slug: string): string[] {
  const c = getContent(locale);
  const { ui } = c;
  const p = c.products.find((x) => x.slug === slug)!;
  const price = p.priceUsd === null ? ui.priceOnRequest : `$${p.priceUsd} USD`;
  return [
    `# ${p.name}`,
    "",
    p.desc,
    "",
    `- ${ui.priceLabel}: ${price}`,
    `- ${ui.leadTimeLabel}: ${p.leadTime ?? ui.quotedPerOrder}`,
    "",
    `## ${ui.navCommission}`,
    "",
    ui.contactProductHint,
    "",
    ...contactLines(locale),
    "",
    `[${ui.shippingLink}](${htmlUrl(locale, "/shipping/")}) · [${ui.commissionLink}](${htmlUrl(locale, "/commission/")})`,
  ];
}

export function pageMarkdown(locale: Locale, path: string): string {
  const body =
    path === "/"
      ? home(locale)
      : path === "/commission/"
        ? commission(locale)
        : path === "/shipping/"
          ? shipping(locale)
          : path === "/links/"
            ? links(locale)
            : product(locale, path.split("/")[2]);
  return [...body, "", `Canonical HTML: ${htmlUrl(locale, path)}`, ""].join(
    "\n",
  );
}

export function llmsIndex(): string {
  const names: Record<Locale, string> = { vi: "Tiếng Việt", en: "English" };
  const sections = locales.map((locale) => {
    const lines = mdPages()
      .filter((p) => p.locale === locale)
      .map((p) => {
        const title = pageMarkdown(locale, p.path)
          .split("\n")[0]
          .replace(/^# /, "");
        return `- [${title}](${mdUrl(locale, p.path)})`;
      });
    return [`## ${names[locale]}`, "", ...lines, ""].join("\n");
  });
  return [
    "# Timond Lab",
    "",
    `> ${getContent("en").meta.description}`,
    "",
    `Pages below are plain-markdown versions of the website. Full text of everything: ${SITE_URL}/llms-full.txt`,
    "",
    ...sections,
  ].join("\n");
}

export function llmsFull(): string {
  return (
    mdPages()
      .map(
        (p) =>
          `<!-- ${htmlUrl(p.locale, p.path)} -->\n\n${pageMarkdown(p.locale, p.path)}`,
      )
      .join("\n---\n\n") + "\n"
  );
}
