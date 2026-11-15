import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const appDir = new URL("../app/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function cssFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return cssFiles(full);
    return full.endsWith(".css") ? [full] : [];
  });
}

const FONT_SIZE = /(?:font-size:\s*|font:\s*(?:(?:\d{3}|italic|normal|bold)\s+)*)(\.?\d*\.?\d+)(px|rem|em)(?=[\s;}!/])/g;

test("no stylesheet sets visible text under the 12px label floor", () => {
  const offenders = [];
  for (const file of cssFiles(appDir)) {
    const css = readFileSync(file, "utf8");
    for (const match of css.matchAll(FONT_SIZE)) {
      const value = parseFloat(match[1]);
      const px = match[2] === "px" ? value : value * 16;
      if (px < 12) offenders.push(`${path.relative(appDir, file)}: ${match[0].trim()}`);
    }
  }
  assert.deepEqual(offenders, [], "use var(--fs-label) (12px, 13px below 768px) for small labels");
});

const COPY_SELECTORS = [
  ".ruby-hero-actionline > p",
  ".ruby-positioning-bottom > p",
  ".ruby-section-header > p:last-child",
  ".ruby-discipline h3 small",
  ".ruby-discipline-copy",
  ".ruby-contact-intro-bottom p",
  ".ruby-process-steps p",
];

function rulesFor(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...css.matchAll(new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`, "gm"))].map((m) => m[1]);
}

test("homepage descriptive copy uses the 16px copy token, not the label floor", () => {
  const css = ["styles/ruby-cinematic.css", "styles/ruby-kinetic.css"]
    .map((file) => readFileSync(path.join(appDir, file), "utf8"))
    .join("\n");
  for (const selector of COPY_SELECTORS) {
    const sizes = rulesFor(css, selector).flatMap((body) => body.match(/font-size:[^;}]+/g) ?? []);
    assert.ok(sizes.length > 0, `${selector} sets a font size`);
    for (const size of sizes) assert.match(size, /var\(--fs-copy\)/, `${selector}: ${size}`);
  }
  const globals = readFileSync(path.join(appDir, "globals.css"), "utf8");
  assert.match(globals, /--fs-copy:\s*1rem;/);
});

test("the service subtitles under each discipline use the sans face", () => {
  const css = readFileSync(path.join(appDir, "styles/ruby-cinematic.css"), "utf8");
  const body = rulesFor(css, ".ruby-discipline h3 small").join(";");
  assert.match(body, /font-family:\s*var\(--sans\)/);
});

test("the label floor token is 12px from tablet up and 13px below 768px", () => {
  const globals = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(globals, /--fs-label:\s*0\.75rem;/);
  assert.match(globals, /@media \(max-width: 767\.98px\)\s*\{\s*:root\s*\{\s*--fs-label:\s*0\.8125rem;/);
});
