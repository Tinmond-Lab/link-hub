import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = (rel) => resolve(root, "dist", rel);
const read = (rel) => readFileSync(dist(rel), "utf8");

const PAGES = [
  ["index.html", "index.md", "vi"],
  ["commission/index.html", "commission.md", "vi"],
  ["shipping/index.html", "shipping.md", "vi"],
  ["links/index.html", "links.md", "vi"],
  [
    "products/miniature-diorama/index.html",
    "products/miniature-diorama.md",
    "vi",
  ],
  ["en/index.html", "en/index.md", "en"],
  ["en/commission/index.html", "en/commission.md", "en"],
  ["en/shipping/index.html", "en/shipping.md", "en"],
  ["en/links/index.html", "en/links.md", "en"],
  ["en/products/resin-figure/index.html", "en/products/resin-figure.md", "en"],
];

const decode = (s) =>
  s
    .replace(/&#38;|&amp;/g, "&")
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"');

before(() => {
  execFileSync("npx", ["astro", "build"], { cwd: root, stdio: "pipe" });
});

describe("markdown twins", () => {
  it("exist for every page, no twin for the coming-soon card", () => {
    for (const [, md] of PAGES) assert.ok(existsSync(dist(md)), md);
    assert.ok(!existsSync(dist("products/coming-soon.md")));
  });

  it("every absolute site link resolves to a built file", () => {
    for (const f of ["llms.txt", "llms-full.txt", ...PAGES.map((p) => p[1])]) {
      const links = read(f).match(/https:\/\/timondlab\.com[^\s)<>]*/g) ?? [];
      for (const url of links) {
        const path = url.replace("https://timondlab.com", "");
        const file = path.endsWith("/")
          ? `${path.slice(1)}index.html`
          : path.slice(1);
        assert.ok(existsSync(dist(file)), `${f}: ${url} -> ${file}`);
      }
    }
  });

  it("keeps Vietnamese diacritics and no placeholder strings", () => {
    assert.match(read("index.md"), /sơn tay/);
    for (const [, md] of PAGES) {
      assert.doesNotMatch(read(md), /\b(undefined|null)\b/, md);
    }
  });

  it("English twins do not mention Shopee", () => {
    for (const [, md] of PAGES.filter((p) => p[2] === "en")) {
      assert.doesNotMatch(read(md), /Shopee/, md);
    }
  });

  it("lists both chat channels", () => {
    for (const [, md] of PAGES.filter((p) => p[1].includes("commission"))) {
      assert.match(read(md), /https:\/\/m\.me\/timondlab/);
      assert.match(read(md), /https:\/\/zalo\.me\/84856694766/);
    }
  });
});

describe("service prices", () => {
  it("show the owner's ranges on the commission page and in markdown", () => {
    const vi = read("commission/index.html");
    assert.match(vi, /100\.000–500\.000 VND/);
    assert.match(vi, /50\.000–300\.000 VND/);
    assert.match(vi, /Từ 500\.000 VND mỗi chức năng/);
    const en = read("en/commission.md");
    assert.match(en, /100,000–500,000 VND/);
    assert.match(en, /50,000–300,000 VND/);
    assert.match(en, /From 500,000 VND per feature/);
  });

  it("appear on both home pages", () => {
    assert.match(read("index.html"), /100\.000–500\.000 VND/);
    assert.match(read("en/index.html"), /100,000–500,000 VND/);
  });

  it("have Service JSON-LD with VND price specifications", () => {
    const html = read("en/commission/index.html");
    const blocks = [
      ...html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ),
    ].map((m) => JSON.parse(m[1]));
    const services = blocks.filter((b) => b["@type"] === "Service");
    assert.equal(services.length, 3);
    const software = services.find((s) => s.name === "Software development");
    assert.equal(software.offers.priceSpecification.minPrice, 500000);
    assert.equal(software.offers.priceSpecification.maxPrice, undefined);
  });
});

describe("markdown stays in sync with the HTML", () => {
  it("home FAQ questions, product names and chat links appear in both", () => {
    for (const [html, md] of [
      ["index.html", "index.md"],
      ["en/index.html", "en/index.md"],
    ]) {
      const page = decode(read(html));
      const twin = read(md);
      const ld = [
        ...read(html).matchAll(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
        ),
      ].map((m) => JSON.parse(m[1]));
      const questions = ld
        .find((b) => b["@type"] === "FAQPage")
        .mainEntity.map((q) => q.name);
      assert.ok(questions.length >= 4, `${html}: found FAQ questions`);
      for (const q of questions) {
        assert.ok(page.includes(q), `${html}: ${q}`);
        assert.ok(twin.includes(q), `${md}: ${q}`);
      }
      for (const name of [
        "Tháp Nghinh Phong",
        "Miniature Diorama",
        "Resin Figure",
      ]) {
        if (page.includes(name))
          assert.ok(twin.includes(name), `${md}: ${name}`);
      }
    }
  });

  it("product price and lead time text match", () => {
    assert.match(read("products/miniature-diorama.md"), /Liên hệ để báo giá/);
    assert.match(read("en/products/resin-figure.md"), /Price on request/);
    assert.match(
      read("products/miniature-diorama/index.html"),
      /Liên hệ để báo giá/,
    );
  });
});

describe("discovery", () => {
  it("each page advertises its markdown twin", () => {
    for (const [html, md] of PAGES) {
      const tags =
        read(html).match(/<link[^>]*type="text\/markdown"[^>]*>/g) ?? [];
      assert.equal(tags.length, 1, html);
      assert.match(tags[0], new RegExp(`href="https://timondlab\\.com/${md}"`));
    }
  });

  it("llms.txt indexes every twin once", () => {
    const idx = read("llms.txt");
    assert.match(idx, /^# Timond Lab/);
    assert.match(idx, /^> /m);
    for (const [, md] of PAGES) {
      const n = idx.split(`https://timondlab.com/${md})`).length - 1;
      assert.equal(n, 1, md);
    }
  });

  it("home pages carry FAQPage JSON-LD matching the visible FAQ", () => {
    for (const html of ["index.html", "en/index.html"]) {
      const blocks = [
        ...read(html).matchAll(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
        ),
      ].map((m) => JSON.parse(m[1]));
      const faq = blocks.find((b) => b["@type"] === "FAQPage");
      assert.ok(faq, html);
      const page = decode(read(html));
      for (const q of faq.mainEntity) assert.ok(page.includes(q.name), q.name);
    }
  });

  it("robots.txt names the AI bots and keeps the sitemap", () => {
    const r = read("robots.txt");
    for (const bot of [
      "GPTBot",
      "OAI-SearchBot",
      "ChatGPT-User",
      "ClaudeBot",
      "Claude-SearchBot",
      "Claude-User",
      "PerplexityBot",
      "Google-Extended",
    ]) {
      assert.match(r, new RegExp(`User-agent: ${bot}\\nAllow: /`));
    }
    assert.match(r, /Sitemap: https:\/\/timondlab\.com\/sitemap-index\.xml/);
  });

  it("_headers serves markdown as UTF-8", () => {
    const h = read("_headers");
    assert.match(h, /\/\*\.md\n\s+Content-Type: text\/markdown; charset=utf-8/);
    assert.match(h, /\/llms\.txt\n\s+Content-Type: text\/plain; charset=utf-8/);
  });
});
