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
