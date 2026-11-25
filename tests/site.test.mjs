import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = (rel) => resolve(root, "dist", rel);
const read = (rel) => readFileSync(dist(rel), "utf8");

const workCards = (html) =>
  [
    ...html.matchAll(/<article class="work-card"[^>]*>[\s\S]*?<\/article>/g),
  ].map((m) => m[0]);

const allCss = () => {
  const dir = dist("_astro");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(resolve(dir, f), "utf8"))
    .join("\n");
};

before(() => {
  execFileSync("npx", ["astro", "build"], { cwd: root, stdio: "pipe" });
});

describe("routing", () => {
  it("serves vi at / and en at /en/", () => {
    assert.ok(existsSync(dist("index.html")), "dist/index.html missing");
    assert.ok(existsSync(dist("en/index.html")), "dist/en/index.html missing");
    assert.match(read("index.html"), /<html lang="vi"/);
    assert.match(read("en/index.html"), /<html lang="en"/);
  });
});

describe("one language per URL", () => {
  it("vi page is Vietnamese only", () => {
    const html = read("index.html");
    assert.doesNotMatch(html, /data-i18n/);
    assert.match(html, /Xem tác phẩm/);
    assert.doesNotMatch(html, /View works/);
  });

  it("en page is English only", () => {
    const html = read("en/index.html");
    assert.doesNotMatch(html, /data-i18n/);
    assert.match(html, /View works/);
    assert.doesNotMatch(html, /Xem tác phẩm/);
  });

  it("language toggle links to the other locale", () => {
    assert.match(
      read("index.html"),
      /<a[^>]*id="lang-toggle"[^>]*href="\/en\/"/,
    );
    assert.match(
      read("en/index.html"),
      /<a[^>]*id="lang-toggle"[^>]*href="\/"/,
    );
  });

  it("uses no localStorage", () => {
    for (const f of ["index.html", "en/index.html"]) {
      assert.doesNotMatch(read(f), /localStorage/);
    }
  });
});

const SITE = "https://timondlab.com";
const EN_DESC =
  "Handmade miniatures, dioramas and hand-painted resin figures from Vietnam. Custom commissions welcome, worldwide shipping available.";

const VI_DESC =
  "Mô hình thu nhỏ, diorama và figure resin sơn tay, làm thủ công tại Việt Nam. Nhận đặt làm theo yêu cầu, giao hàng quốc tế.";

describe("head metadata", () => {
  const pages = [
    { file: "index.html", url: `${SITE}/`, ogLocale: "vi_VN" },
    { file: "en/index.html", url: `${SITE}/en/`, ogLocale: "en_US" },
  ];

  for (const { file, url, ogLocale } of pages) {
    it(`${file}: canonical, hreflang and og:locale`, () => {
      const html = read(file);
      assert.ok(html.includes(`<link rel="canonical" href="${url}"`));
      assert.ok(html.includes(`rel="alternate" hreflang="vi" href="${SITE}/"`));
      assert.ok(
        html.includes(`rel="alternate" hreflang="en" href="${SITE}/en/"`),
      );
      assert.ok(
        html.includes(
          `rel="alternate" hreflang="x-default" href="${SITE}/en/"`,
        ),
      );
      assert.ok(html.includes(`property="og:locale" content="${ogLocale}"`));
      assert.ok(html.includes(`property="og:url" content="${url}"`));
    });
  }

  it("en page has English title and description", () => {
    const html = read("en/index.html");
    assert.match(
      html,
      /<title>Timond Lab · Handmade miniatures &amp; dioramas from Vietnam<\/title>/,
    );
    assert.ok(html.includes(`<meta name="description" content="${EN_DESC}"`));
    assert.ok(html.includes(`property="og:description" content="${EN_DESC}"`));
  });

  it("vi page has the studio title and description", () => {
    const html = read("index.html");
    assert.match(
      html,
      /<title>Timond Lab · Mô hình thủ công &amp; diorama từ Việt Nam<\/title>/,
    );
    assert.ok(html.includes(`<meta name="description" content="${VI_DESC}"`));
    assert.ok(html.includes(`property="og:description" content="${VI_DESC}"`));
  });
});

describe("sitemap", () => {
  it("lists both locales with alternates and no slash-less /en", () => {
    const xml = read("sitemap-0.xml");
    assert.ok(xml.includes(`<loc>${SITE}/</loc>`));
    assert.ok(xml.includes(`<loc>${SITE}/en/</loc>`));
    assert.ok(xml.includes('hreflang="en-US"'));
    assert.ok(xml.includes('hreflang="vi-VN"'));
    assert.ok(!xml.includes(`${SITE}/en<`));
  });
});

const jsonLdBlocks = (html) =>
  [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => JSON.parse(m[1]));

describe("organization structured data", () => {
  it("en home page has Organization JSON-LD", () => {
    const org = jsonLdBlocks(read("en/index.html")).find(
      (b) => b["@type"] === "Organization",
    );
    assert.ok(org, "no Organization block");
    assert.equal(org.name, "Timond Lab");
    assert.equal(org.url, "https://timondlab.com/en/");
    assert.ok(org.sameAs.includes("https://youtube.com/@timondlab"));
    assert.equal(org.logo, "https://timondlab.com/avatar.webp");
  });

  it("vi home page marks its own URL", () => {
    const org = jsonLdBlocks(read("index.html")).find(
      (b) => b["@type"] === "Organization",
    );
    assert.equal(org.url, "https://timondlab.com/");
  });
});

describe("product pages", () => {
  const slugs = ["nghinh-phong-tower", "miniature-diorama", "resin-figure"];

  for (const slug of slugs) {
    for (const [locale, prefix] of [
      ["vi", ""],
      ["en", "en/"],
    ]) {
      it(`${prefix}products/${slug}: exists with canonical and hreflang`, () => {
        const file = `${prefix}products/${slug}/index.html`;
        assert.ok(existsSync(dist(file)), `${file} missing`);
        const html = read(file);
        const self =
          locale === "vi"
            ? `${SITE}/products/${slug}/`
            : `${SITE}/en/products/${slug}/`;
        assert.ok(html.includes(`<link rel="canonical" href="${self}"`));
        assert.ok(
          html.includes(`hreflang="vi" href="${SITE}/products/${slug}/"`),
        );
        assert.ok(
          html.includes(`hreflang="en" href="${SITE}/en/products/${slug}/"`),
        );
        assert.match(html, new RegExp(`<html lang="${locale}"`));
      });
    }
  }

  it("null price: Product JSON-LD has no offers and page says Price on request", () => {
    const html = read("en/products/nghinh-phong-tower/index.html");
    const product = jsonLdBlocks(html).find((b) => b["@type"] === "Product");
    assert.ok(product, "no Product block");
    assert.equal(product.name, "Tháp Nghinh Phong");
    assert.ok(product.image.startsWith("https://timondlab.com/products/"));
    assert.equal("offers" in product, false);
    assert.match(html, /Price on request/);
  });

  it("Coming Soon has no page and no link to one", () => {
    assert.equal(existsSync(dist("en/products/prod-soon")), false);
    for (const f of ["index.html", "en/index.html"]) {
      const html = read(f);
      const cards = [
        ...html.matchAll(
          /<article class="work-card"[^>]*>[\s\S]*?<\/article>/g,
        ),
      ].map((m) => m[0]);
      const card = cards.find((c) => c.includes("Coming Soon"));
      assert.ok(card, "coming soon card not found");
      assert.doesNotMatch(card, /data-slug=/);
      assert.doesNotMatch(card, /href=/);
    }
  });

  it("home product links point at locale product pages, not #", () => {
    assert.ok(
      read("en/index.html").includes('href="/en/products/resin-figure/"'),
    );
    assert.ok(read("index.html").includes('href="/products/resin-figure/"'));
    for (const f of ["index.html", "en/index.html"]) {
      const cards = workCards(read(f));
      assert.ok(cards.length > 0, "no work cards found");
      for (const c of cards) assert.doesNotMatch(c, /href="#"/);
    }
  });

  it("work card matcher can detect href=# (guard against vacuous test)", () => {
    const probe = '<article class="work-card"><a href="#">x</a></article>';
    assert.match(workCards(probe)[0], /href="#"/);
  });

  it("vi home marks the English video eyebrow with lang=en", () => {
    assert.match(
      read("index.html"),
      /<[a-z0-9]+[^>]*lang="en"[^>]*>\s*Build in Public\s*</,
    );
  });

  it("enquiry mailto includes the product name in the subject", () => {
    const html = read("en/products/resin-figure/index.html");
    assert.match(
      html,
      /mailto:timondlab@gmail\.com\?subject=[^"]*Resin%20Figure/,
    );
  });
});

describe("commission page", () => {
  for (const [locale, prefix, self] of [
    ["vi", "", `${SITE}/commission/`],
    ["en", "en/", `${SITE}/en/commission/`],
  ]) {
    it(`${prefix}commission: six steps, enquiry mailto, canonical and hreflang`, () => {
      const file = `${prefix}commission/index.html`;
      assert.ok(existsSync(dist(file)), `${file} missing`);
      const html = read(file);
      assert.equal((html.match(/<li class="step"/g) ?? []).length, 6);
      assert.match(
        html,
        /mailto:timondlab@gmail\.com\?subject=[^"]+&amp;body=[^"]+/,
      );
      assert.ok(html.includes(`<link rel="canonical" href="${self}"`));
      assert.ok(html.includes(`hreflang="vi" href="${SITE}/commission/"`));
      assert.ok(html.includes(`hreflang="en" href="${SITE}/en/commission/"`));
      assert.match(html, new RegExp(`<html lang="${locale}"`));
    });
  }

  it("en mailto asks for reference images, size, budget, deadline and country", () => {
    const html = decodeURIComponent(
      read("en/commission/index.html")
        // The header and footer also link plain mailto:; pick the commission one, which has a body.
        .match(/mailto:[^"]+&amp;body=[^"]+/)[0]
        .replace(/&amp;/g, "&"),
    );
    for (const word of [
      "Reference images",
      "size",
      "Budget",
      "Deadline",
      "Country",
    ]) {
      assert.ok(html.includes(word), `mailto body lacks ${word}`);
    }
  });
});

describe("shipping page", () => {
  it("en shipping page states duties and quotes per order", () => {
    const html = read("en/shipping/index.html");
    assert.match(html, /Import duties, VAT and customs fees/);
    assert.match(html, /Quoted per order/);
    assert.ok(
      html.includes(`<link rel="canonical" href="${SITE}/en/shipping/"`),
    );
    assert.ok(html.includes(`hreflang="vi" href="${SITE}/shipping/"`));
  });

  it("vi shipping page exists in Vietnamese", () => {
    const html = read("shipping/index.html");
    assert.match(html, /<html lang="vi"/);
    assert.match(html, /Báo theo từng đơn/);
  });

  it("international-shipping FAQ links to the locale shipping page", () => {
    assert.match(
      read("en/index.html"),
      /<div class="faq-answer"[^>]*>[^<]*<a href="\/en\/shipping\/"/,
    );
    assert.match(
      read("index.html"),
      /<div class="faq-answer"[^>]*>[^<]*<a href="\/shipping\/"/,
    );
  });
});

describe("channels and hero per locale", () => {
  it("en page hides Vietnam-only channels and Instagram while unset", () => {
    const html = read("en/index.html");
    assert.doesNotMatch(html, /zalo\.me/);
    assert.doesNotMatch(html, /shopee\.vn/);
    assert.doesNotMatch(html, /instagram\.com/);
  });

  it("home still exposes every channel", () => {
    const vi = read("index.html");
    for (const href of ["zalo.me", "shopee.vn", "youtube.com/@timondlab"]) {
      assert.ok(vi.includes(href), `vi home lacks ${href}`);
    }
    assert.ok(read("en/index.html").includes("mailto:timondlab@gmail.com"));
  });

  it("heroes promote commissions", () => {
    const en = read("en/index.html");
    assert.match(
      en,
      /Dioramas, architectural miniatures and hand-painted resin figures/,
    );
    assert.match(
      en,
      /<a href="\/en\/commission\/" class="btn btn-primary"[^>]*>Request a commission<\/a>/,
    );
    assert.match(
      en,
      /<a href="#works" class="btn btn-secondary"[^>]*>View works<\/a>/,
    );
    const vi = read("index.html");
    assert.match(
      vi,
      /<a href="\/commission\/" class="btn btn-primary"[^>]*>Đặt làm theo yêu cầu<\/a>/,
    );
    assert.match(vi, /Diorama, mô hình kiến trúc và figure resin sơn tay/);
    for (const html of [en, vi]) {
      assert.doesNotMatch(html, /Lập trình viên phần mềm/);
      assert.doesNotMatch(html, /Software Developer/);
    }
  });
});

describe("final review fixes", () => {
  it("product pages link to shipping and commission in their own locale", () => {
    const en = read("en/products/resin-figure/index.html");
    assert.ok(en.includes('href="/en/shipping/"'));
    assert.ok(en.includes('href="/en/commission/"'));
    const vi = read("products/resin-figure/index.html");
    assert.ok(vi.includes('href="/shipping/"'));
    assert.ok(vi.includes('href="/commission/"'));
  });

  it("the custom-work FAQ links to the locale commission page", () => {
    assert.match(
      read("en/index.html"),
      /<div class="faq-answer"[^>]*>[^<]*custom projects[^<]*<a href="\/en\/commission\/"/,
    );
    assert.match(
      read("index.html"),
      /<div class="faq-answer"[^>]*>[^<]*custom[^<]*<a href="\/commission\/"/,
    );
  });

  it("owner-editable price and lead time exist per product in content.ts", async () => {
    const { productFacts, getContent } = await import("../src/i18n/content.ts");
    for (const p of getContent("en").products.filter((p) => p.slug)) {
      const facts = productFacts[p.slug];
      assert.ok(facts, `no productFacts entry for ${p.slug}`);
      assert.ok("priceUsd" in facts && "leadTime" in facts);
    }
  });
});

describe("product page spacing", () => {
  for (const [file, label] of [
    ["en/products/resin-figure/index.html", "Lead time"],
    ["products/resin-figure/index.html", "Thời gian thực hiện"],
  ]) {
    it(`${file}: space after the "${label}:" label`, () => {
      assert.match(read(file), new RegExp(`${label}:</strong>\\s+\\S`));
    });
  }

  it("separator between the shipping and commission links has spaces on both sides", () => {
    for (const f of [
      "en/products/resin-figure/index.html",
      "products/resin-figure/index.html",
    ]) {
      assert.match(read(f), /<\/a>\s+·\s+<a/);
    }
  });
});

describe("Cloudflare deploy config", () => {
  it("wrangler.json deploys the static dist/ so wrangler never auto-configures an adapter", () => {
    const cfg = JSON.parse(
      readFileSync(resolve(root, "wrangler.json"), "utf8"),
    );
    assert.equal(cfg.name, "link-hub");
    assert.equal(cfg.assets.directory, "./dist");
    assert.match(cfg.compatibility_date, /^\d{4}-\d{2}-\d{2}$/);
    // `wrangler preview` (used for non-production branch builds) refuses to run without this block.
    assert.equal(typeof cfg.previews, "object");
  });
});

describe("latest video card", () => {
  const URL = "https://www.youtube.com/shorts/XvO6u8sVaPc";
  const THUMB = "https://i.ytimg.com/vi/XvO6u8sVaPc/maxresdefault.jpg";

  it("youtubeId reads the id from shorts, watch and youtu.be links", async () => {
    const { youtubeId } = await import("../src/i18n/content.ts");
    assert.equal(
      youtubeId("https://www.youtube.com/shorts/XvO6u8sVaPc"),
      "XvO6u8sVaPc",
    );
    assert.equal(
      youtubeId("https://www.youtube.com/watch?v=XvO6u8sVaPc&t=3"),
      "XvO6u8sVaPc",
    );
    assert.equal(
      youtubeId("https://youtu.be/XvO6u8sVaPc?si=abc"),
      "XvO6u8sVaPc",
    );
    assert.equal(youtubeId("https://example.com/video"), null);
  });

  for (const f of ["index.html", "en/index.html"]) {
    it(`${f}: latest video is a real link with its thumbnail, rendered at build time`, () => {
      const html = read(f);
      const card = html.match(/<a\b[^>]*class="video-card"[^>]*>[\s\S]*?<\/a>/);
      assert.ok(card, "no linked video-card");
      assert.ok(card[0].includes(`href="${URL}"`));
      assert.match(card[0], /target="_blank"/);
      assert.match(card[0], /rel="noopener/);
      assert.ok(card[0].includes(`src="${THUMB}"`));
    });
  }

  it("nothing calls the PHP endpoint any more", () => {
    for (const f of ["index.html", "en/index.html"]) {
      assert.doesNotMatch(read(f), /latest-video/);
    }
    assert.equal(existsSync(dist("api")), false);
  });
});

describe("favicon", () => {
  const pages = [
    "index.html",
    "en/index.html",
    "commission/index.html",
    "en/commission/index.html",
    "shipping/index.html",
    "en/shipping/index.html",
    ...["nghinh-phong-tower", "miniature-diorama", "resin-figure"].flatMap(
      (s) => [`products/${s}/index.html`, `en/products/${s}/index.html`],
    ),
  ];
  const png = (rel) => {
    const b = readFileSync(dist(rel));
    assert.equal(
      b.subarray(0, 8).toString("hex"),
      "89504e470d0a1a0a",
      `${rel} is not a PNG`,
    );
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  };

  for (const f of pages) {
    it(`${f}: links the Timond Lab icons and not the Astro one`, () => {
      const html = read(f);
      assert.match(html, /<link rel="icon" href="\/favicon\.ico"[^>]*>/);
      assert.match(
        html,
        /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32\.png"[^>]*>/,
      );
      assert.match(
        html,
        /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png"[^>]*>/,
      );
      assert.doesNotMatch(html, /favicon\.svg/);
    });
  }

  it("the default Astro favicon.svg is no longer shipped", () => {
    assert.equal(existsSync(dist("favicon.svg")), false);
  });

  it("favicon.ico is a real ICO with 16, 32 and 48 px images", () => {
    const b = readFileSync(dist("favicon.ico"));
    assert.equal(b.readUInt16LE(0), 0);
    assert.equal(b.readUInt16LE(2), 1, "not an ICO file");
    const count = b.readUInt16LE(4);
    const sizes = Array.from(
      { length: count },
      (_, i) => b[6 + i * 16] || 256,
    ).sort((a, c) => a - c);
    assert.deepEqual(sizes, [16, 32, 48]);
  });

  it("PNG icons have the declared sizes", () => {
    assert.deepEqual(png("favicon-32.png"), { w: 32, h: 32 });
    assert.deepEqual(png("apple-touch-icon.png"), { w: 180, h: 180 });
  });
});

const cssAll = () => {
  const dir = dist("_astro");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(resolve(dir, f), "utf8"))
    .join("\n");
};

const INFO_PAGES = [
  "commission/index.html",
  "en/commission/index.html",
  "shipping/index.html",
  "en/shipping/index.html",
  ...["nghinh-phong-tower", "miniature-diorama", "resin-figure"].flatMap(
    (s) => [`products/${s}/index.html`, `en/products/${s}/index.html`],
  ),
];
const CHROME_PAGES = ["index.html", "en/index.html", ...INFO_PAGES];

describe("site chrome", () => {
  for (const f of CHROME_PAGES) {
    it(`${f}: header, footer, skip link, main landmark, studio fonts`, () => {
      const html = read(f);
      assert.match(html, /<header class="site-header"/);
      assert.match(html, /<footer class="site-footer"/);
      assert.match(html, /<a class="skip-link" href="#main"/);
      assert.match(html, /<main id="main"/);
      assert.match(html, /family=Archivo/);
      assert.match(html, /family=Space\+Grotesk/);
      assert.doesNotMatch(html, /Be\+Vietnam\+Pro/);
    });
  }

  it("header anchors point at the home page", () => {
    const en = read("en/products/resin-figure/index.html");
    for (const a of ["works", "process", "commission", "about"]) {
      assert.ok(en.includes(`href="/en/#${a}"`), `missing /en/#${a}`);
    }
    assert.ok(
      read("products/resin-figure/index.html").includes('href="/#works"'),
    );
  });

  it("mobile menu is a native details element holding the nav", () => {
    assert.match(
      read("en/commission/index.html"),
      /<details class="site-menu"[\s\S]*href="\/en\/#works"[\s\S]*<\/details>/,
    );
  });

  it("language link text is part of its accessible name", () => {
    for (const [f, label] of [
      ["commission/index.html", "EN"],
      ["en/commission/index.html", "VI"],
    ]) {
      const m = read(f).match(/<a[^>]*id="lang-toggle"[^>]*>([^<]*)</);
      assert.ok(m, `no lang-toggle in ${f}`);
      assert.equal(m[1].trim(), label);
      const aria = m[0].match(/aria-label="([^"]*)"/);
      assert.ok(
        aria && aria[1].startsWith(label),
        `aria-label must start with ${label}`,
      );
    }
  });

  it("reveal is gated behind html.js and motion respects reduced-motion", () => {
    const css = cssAll();
    assert.match(css, /\.js \.reveal/);
    assert.match(css, /prefers-reduced-motion/);
    // A .reveal rule that hides content without the .js ancestor would leave it invisible without JS.
    assert.doesNotMatch(css, /(?<!\.js )\.reveal(\[[^\]]*\])?\{opacity:0/);
  });

  it("dark tokens are defined", () => {
    const css = cssAll().toLowerCase();
    assert.match(css, /--bg:\s*#000(000)?\b/);
    assert.match(css, /--accent:\s*#4c9aff/);
  });
});

describe("links page", () => {
  const hrefsOf = (html) =>
    [...html.matchAll(/<a href="([^"]+)"[^>]*class="social-item"/g)].map(
      (m) => m[1],
    );

  it("exists in both locales with canonical and hreflang", () => {
    for (const [file, self] of [
      ["links/index.html", "/links/"],
      ["en/links/index.html", "/en/links/"],
    ]) {
      assert.ok(existsSync(dist(file)), file);
      const html = read(file);
      assert.ok(html.includes(`<link rel="canonical" href="${SITE}${self}"`));
      assert.ok(html.includes(`hreflang="vi" href="${SITE}/links/"`));
      assert.ok(html.includes(`hreflang="en" href="${SITE}/en/links/"`));
    }
  });

  it("links to the studio home in each locale", () => {
    assert.match(
      read("links/index.html"),
      /<a [^>]*href="\/"[^>]*>\s*Ghé thăm studio\s*<\/a>/,
    );
    assert.match(
      read("en/links/index.html"),
      /<a [^>]*href="\/en\/"[^>]*>\s*Visit the studio\s*<\/a>/,
    );
  });

  it("en lists Email first without Vietnam-only channels", () => {
    const html = read("en/links/index.html");
    const hrefs = hrefsOf(html);
    assert.equal(hrefs[0], "mailto:timondlab@gmail.com");
    assert.ok(hrefs.includes("https://youtube.com/@timondlab"));
    assert.doesNotMatch(html, /zalo\.me/);
    assert.doesNotMatch(html, /shopee\.vn/);
  });

  it("vi keeps YouTube first plus Zalo and Shopee", () => {
    const html = read("links/index.html");
    assert.equal(hrefsOf(html)[0], "https://youtube.com/@timondlab");
    assert.ok(html.includes("zalo.me"));
    assert.ok(html.includes("shopee.vn"));
  });

  it("localizes the page title", () => {
    assert.match(
      read("links/index.html"),
      /<title>Timond Lab · Liên kết<\/title>/,
    );
    assert.match(
      read("en/links/index.html"),
      /<title>Timond Lab · Links<\/title>/,
    );
  });

  it("is in the sitemap", () => {
    const xml = read("sitemap-0.xml");
    assert.ok(xml.includes(`<loc>${SITE}/links/</loc>`));
    assert.ok(xml.includes(`<loc>${SITE}/en/links/</loc>`));
  });
});

describe("studio copy and data", () => {
  it("exposes process chapters, hero, about, maker photo and latest video", async () => {
    const mod = await import("../src/i18n/content.ts");
    const chapters = mod.processChapters("en");
    assert.equal(chapters.length, 6);
    assert.equal(chapters[0].title, "Idea");
    assert.equal(chapters[5].text, mod.getContent("en").shipping.intro);
    assert.equal(
      mod.getContent("vi").hero.title,
      "Điêu khắc, in 3D và sơn tay tại Việt Nam.",
    );
    assert.equal(mod.MAKER_PHOTO, null);
    assert.equal(mod.latestVideo.href, mod.LATEST_VIDEO_URL);
    assert.equal(mod.getContent("en").about.makes.length, 3);
  });
});

const htmlFiles = (dir = dist(".")) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) return htmlFiles(full);
    return e.name.endsWith(".html") ? [full] : [];
  });

describe("home page", () => {
  const pages = ["index.html", "en/index.html"];

  it("home has the four anchor sections", () => {
    for (const f of pages) {
      const html = read(f);
      for (const id of ["works", "process", "about", "commission"]) {
        assert.ok(html.includes(`id="${id}"`), `${f} lacks #${id}`);
      }
    }
  });

  it("anchored sections clear the sticky header", () => {
    assert.match(cssAll(), /scroll-margin-top/);
  });

  it("process shows six chapters", () => {
    for (const f of pages) {
      assert.equal((read(f).match(/class="process-step"/g) ?? []).length, 6, f);
    }
  });

  it("about has no portrait while MAKER_PHOTO is null", () => {
    for (const f of pages) {
      const about = read(f).match(/<section[^>]*id="about"[\s\S]*?<\/section>/);
      assert.ok(about, `${f}: no #about section`);
      assert.doesNotMatch(about[0], /<img/);
    }
  });

  it("no emoji in rendered HTML", () => {
    // ©, ® and ™ are Extended_Pictographic but render as text symbols, not emoji.
    const emoji = /(?![\u00a9\u00ae\u2122])\p{Extended_Pictographic}/u;
    for (const file of htmlFiles()) {
      const text = readFileSync(file, "utf8").replace(
        /<script\b[\s\S]*?<\/script>/g,
        "",
      );
      const m = text.match(emoji);
      assert.equal(m, null, `${file} contains ${m?.[0]}`);
    }
  });
});

describe("touch targets", () => {
  for (const sel of [".shipping", ".more"]) {
    it(`standalone links in ${sel} are at least 44px tall`, () => {
      const re = new RegExp(
        `\\${sel}(?:\\[[^\\]]+\\])?\\s+a(?:\\[[^\\]]+\\])?\\{[^}]*min-height:44px`,
      );
      const inline = [
        read("en/index.html"),
        read("en/products/resin-figure/index.html"),
      ].join("\n");
      assert.match(allCss() + inline, re);
    });
  }
});
