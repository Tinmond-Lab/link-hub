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
