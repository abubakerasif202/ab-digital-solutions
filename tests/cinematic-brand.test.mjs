import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("brand variants are local accessible vectors and application icons are non-empty", async () => {
  for (const name of ["ab-monogram", "ab-logo-horizontal", "ab-logo-light", "ab-logo-dark", "ab-mark"]) {
    const svg = await read(`../public/brand/${name}.svg`);
    assert.match(svg, /viewBox=/);
    assert.match(svg, /<title/);
    assert.doesNotMatch(svg, /<image|<script/i);
  }
  for (const path of ["../public/apple-touch-icon.png", "../public/brand/ab-mark-192.png", "../public/brand/ab-mark-512.png"]) {
    assert.ok((await stat(new URL(path, import.meta.url))).size > 100);
  }
});

test("homepage portfolio renders the entire canonical registry before capabilities", async () => {
  const [home, portfolio] = await Promise.all([read("../app/agency-home.tsx"), read("../app/components/PortfolioSection.tsx")]);
  assert.ok(home.indexOf("<PortfolioSection />") < home.indexOf('id="services"'));
  assert.match(portfolio, /projects\.map/);
  assert.doesNotMatch(portfolio, /projects\.filter|slice\(/);
  assert.match(portfolio, /project=\{project\}/);
  assert.match(portfolio, /\/work\/\$\{project\.slug\}/);
});

test("studio motion supports static content, touch and reduced motion", async () => {
  const [styles, pointer, canvas, page] = await Promise.all([read("../app/studio.css"), read("../app/components/PointerFX.tsx"), read("../app/components/Hero3DCanvas.tsx"), read("../app/page.tsx")]);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(pointer, /finePointer\.matches && !reducedMotion\.matches/);
  assert.match(canvas, /ExtrudeGeometry/);
  assert.doesNotMatch(canvas, /TorusKnotGeometry|PointsMaterial|Math\.random/);
  assert.doesNotMatch(page, /IntroReveal/);
});

test("brand text files remain valid UTF-8 without mojibake", async () => {
  for (const path of ["../app/site-footer.tsx", "../app/opengraph-image.tsx", "../app/components/brand/ABLogo.tsx"]) {
    const bytes = await readFile(new URL(path, import.meta.url));
    const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    assert.doesNotMatch(source, /\u00c2[\u00a0-\u00bf]|\u00e2[\u0080-\u00bf\u2020\u20ac]/);
  }
});


test("mobile header keeps fixed navigation independent of backdrop containment", async () => {
  const styles = await read("../app/studio.css");
  const mobile = styles.slice(styles.indexOf("@media (max-width: 960px)"));
  assert.match(mobile, /\.site-header \{ backdrop-filter: none;/);
  assert.match(mobile, /height: calc\(100dvh - var\(--header-height\)\)/);
});


test("static hero branding uses inline geometry rather than a late CSS image", async () => {
  const [fallback, styles] = await Promise.all([read("../app/components/HeroFallback.tsx"), read("../app/studio.css")]);
  assert.match(fallback, /<ABLogo decorative/);
  assert.doesNotMatch(styles, /url\(['"]?\/brand\/ab-monogram/);
});
