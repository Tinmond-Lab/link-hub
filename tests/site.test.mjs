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
