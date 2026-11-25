import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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
        .match(/mailto:[^"]+/)[0]
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
