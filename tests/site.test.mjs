import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = (rel) => resolve(root, "dist", rel);
const read = (rel) => readFileSync(dist(rel), "utf8");

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
    assert.match(html, /Khám phá sản phẩm/);
    assert.doesNotMatch(html, /Explore Products/);
  });

  it("en page is English only", () => {
    const html = read("en/index.html");
    assert.doesNotMatch(html, /data-i18n/);
    assert.match(html, /Explore Products/);
    assert.doesNotMatch(html, /Khám phá sản phẩm/);
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

  it("never stores or reads a language preference", () => {
    for (const f of ["index.html", "en/index.html"]) {
      const html = read(f);
      // Astro inlines and minifies the script, turning "theme" into `theme`.
      assert.match(html, /localStorage\.getItem\([`"']theme[`"']\)/);
      assert.doesNotMatch(html, /(get|set)Item\([`"']lang[`"']/);
    }
  });
});

const SITE = "https://timondlab.com";
const EN_DESC =
  "Handmade miniatures, dioramas and hand-painted resin figures from Vietnam. Custom commissions welcome, worldwide shipping available.";

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

  it("vi page keeps Vietnamese title and description", () => {
    const html = read("index.html");
    assert.match(html, /<title>Timond Lab · LinkHub<\/title>/);
    assert.match(html, /studio sáng tạo kết hợp phát triển phần mềm/);
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
      const card = html.match(
        /<div class="product-card"[^>]*data-filter="coming soon"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
      );
      assert.ok(card, "coming soon card not found");
      assert.doesNotMatch(card[0], /href=/);
    }
  });

  it("home product links point at locale product pages, not #", () => {
    assert.ok(
      read("en/index.html").includes('href="/en/products/resin-figure/"'),
    );
    assert.ok(read("index.html").includes('href="/products/resin-figure/"'));
    assert.doesNotMatch(
      read("en/index.html"),
      /class="product-link"[^>]*href="#"|href="#"[^>]*class="product-link"/,
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

  it("en page lists Email first", () => {
    const html = read("en/index.html");
    const hrefs = [
      ...html.matchAll(/<a href="([^"]+)"[^>]*class="social-item"/g),
    ].map((m) => m[1]);
    assert.equal(hrefs[0], "mailto:timondlab@gmail.com");
    assert.ok(hrefs.includes("https://youtube.com/@timondlab"));
  });

  it("vi page keeps Zalo and Shopee and original order", () => {
    const html = read("index.html");
    assert.ok(html.includes("zalo.me/84856694766"));
    assert.ok(html.includes("shopee.vn/timondlab"));
    const hrefs = [
      ...html.matchAll(/<a href="([^"]+)"[^>]*class="social-item"/g),
    ].map((m) => m[1]);
    assert.equal(hrefs[0], "https://youtube.com/@timondlab");
  });

  it("en hero promotes commissions; vi hero is unchanged", () => {
    const en = read("en/index.html");
    assert.match(
      en,
      /Handmade miniatures, dioramas &amp; figure painting from Vietnam/,
    );
    assert.match(
      en,
      /<a href="\/en\/commission\/" class="btn btn-primary"[^>]*>Request a custom piece<\/a>/,
    );
    assert.match(
      en,
      /<a href="#products" class="btn btn-secondary"[^>]*>Explore Products<\/a>/,
    );
    const vi = read("index.html");
    assert.match(
      vi,
      /<a href="#products" class="btn btn-primary"[^>]*>Khám phá sản phẩm<\/a>/,
    );
    assert.match(vi, /Lập trình viên phần mềm • Họa sĩ tô mô hình/);
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
      const card = html.match(/<a\b[^>]*class="bip-card"[^>]*>[\s\S]*?<\/a>/);
      assert.ok(card, "no linked bip-card");
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
const CHROME_PAGES = [...INFO_PAGES];

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
  });

  it("dark tokens are defined", () => {
    const css = cssAll().toLowerCase();
    assert.match(css, /--bg:\s*#000(000)?\b/);
    assert.match(css, /--accent:\s*#4c9aff/);
  });
});
