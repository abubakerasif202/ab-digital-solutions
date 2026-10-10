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

test("homepage showcases every live project and the Work page retains the full canonical registry", async () => {
  const [home, portfolio, work] = await Promise.all([read("../app/agency-home.tsx"), read("../app/components/PortfolioSection.tsx"), read("../app/components/WorkIndexBody.tsx")]);
  assert.ok(home.indexOf("<PortfolioSection />") < home.indexOf('id="services"'));
  // The showcase slider and the typographic index both draw from the canonical registry; nothing is curated away.
  assert.match(portfolio, /<ProjectShowcase \/>/);
  assert.match(portfolio, /projects\.map\(\(project, i\)/);
  assert.match(work, /projects/);
  assert.match(portfolio, /\/work\/\$\{project\.slug\}/);
});

test("studio motion supports static content, touch and reduced motion", async () => {
  const [styles, pointer, canvas, page] = await Promise.all([read("../app/studio.css"), read("../app/components/PointerFX.tsx"), read("../app/components/Hero3DCanvas.tsx"), read("../app/page.tsx")]);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(pointer, /finePointer\.matches && !reducedMotion\.matches/);
  assert.match(canvas, /new THREE.TextureLoader/);
  assert.match(canvas, /artworkTexture\?\.dispose/);
  assert.doesNotMatch(canvas, /TorusKnotGeometry|PointsMaterial|Math\.random/);
  assert.doesNotMatch(page, /IntroReveal/);
});

test("brand text files remain valid UTF-8 without mojibake", async () => {
  for (const path of ["../app/site-footer.tsx", "../app/opengraph-image.tsx", "../app/components/brand/ABLogo.tsx", "../app/agency-home.tsx", "../app/about/page.tsx", "../app/services/page.tsx", "../app/work/[slug]/page.tsx"]) {
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


test("hero fallback and WebGL preserve the same approved artwork", async () => {
  const [fallback, canvas] = await Promise.all([read("../app/components/HeroFallback.tsx"), read("../app/components/Hero3DCanvas.tsx")]);
  for (const source of [fallback, canvas]) assert.match(source, /\/brand\/ab-hero-monogram\.webp/);
  assert.match(fallback, /preload/);
  assert.match(fallback, /aria-hidden="true"/);
  assert.doesNotMatch(canvas, /createSignalGeometry|ExtrudeGeometry/);
  assert.ok((await stat(new URL("../public/brand/ab-hero-monogram.webp", import.meta.url))).size > 10000);
});

test("brand intro is brief, non-blocking and once per session", async () => {
  const [gate, intro, styles, config] = await Promise.all([
    read("../app/components/intro/intro-gate.ts"),
    read("../app/components/intro/BrandIntro.tsx"),
    read("../app/intro.css"),
    read("../app/components/intro/intro-config.ts"),
  ]);
  assert.match(config, /ab-brand-intro-seen/);
  assert.match(gate, /sessionStorage/);
  assert.match(gate, /prefers-reduced-motion/);
  assert.match(gate, /pointer: coarse/);
  assert.match(gate, /saveData/);
  assert.doesNotMatch(gate, /rel="preload"/);
  assert.match(intro, /ab-luxury-monogram\.webp/);
  assert.doesNotMatch(intro, /<video/);
  assert.match(styles, /pointer-events: none/);
  assert.doesNotMatch(styles, /overflow: hidden|hero-actions|site-header/);
  assert.ok(Number(/maxMs:\s*(\d+)/.exec(config)?.[1]) <= 1500);
});
test("intro media assets exist and are web-sized", async () => {
  const video = await stat(new URL("../public/video/ab-web-studio-intro.mp4", import.meta.url));
  const poster = await stat(new URL("../public/video/ab-web-studio-intro-poster.webp", import.meta.url));
  assert.ok(video.size > 100_000 && video.size < 4_000_000);
  assert.ok(poster.size > 5_000 && poster.size < 200_000);
});
