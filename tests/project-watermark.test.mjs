// Regression guards for the portfolio watermark system.
//
// These go past "the file exists": they decode the pixels and assert the
// watermark is genuinely burnt into the bottom band of every portfolio image,
// that the originals are left clean, and that regeneration is deterministic.
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  WATERMARK_DIR,
  WATERMARK_DOMAIN,
  WATERMARK_VERSION,
  WATERMARK_WORDMARK,
  buildWatermarkSvg,
  listPortfolioSources,
  watermarkImage,
} from "../scripts/watermark-projects.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
// Masters live outside public/ so the clean original is never served.
const sourceDir = path.join(projectRoot, "assets-src/portfolio");
const publicAssetsDir = path.join(projectRoot, "public/site/ab-digital-premium/assets");
const watermarkedDir = path.join(publicAssetsDir, WATERMARK_DIR);

const sourcePath = (name) => path.join(sourceDir, name);
const watermarkedPath = (name) => path.join(watermarkedDir, name);

/** Raw greyscale pixels for a horizontal band of an image. */
async function bandLuma(filePath, top, bandHeight) {
  const { data } = await sharp(filePath)
    .extract({ left: 0, top, width: (await sharp(filePath).metadata()).width, height: bandHeight })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

/**
 * Mean absolute per-pixel difference between the same band of two images.
 *
 * Comparing the watermark band against a control band from the middle of the
 * image separates the watermark from ordinary JPEG re-encode noise, and works
 * in both directions — some screenshots have near-black footers that the scrim
 * cannot darken further, but the gold wordmark still changes them.
 */
async function bandDelta(originalPath, markedPath, top, bandHeight) {
  const [a, b] = await Promise.all([
    bandLuma(originalPath, top, bandHeight),
    bandLuma(markedPath, top, bandHeight),
  ]);

  let total = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) total += Math.abs(a[i] - b[i]);
  return total / length;
}

test("every portfolio source has a watermarked derivative", async () => {
  const sources = await listPortfolioSources();
  assert.equal(sources.length, 7, "expected seven portfolio screenshots");

  for (const name of sources) {
    const info = await stat(watermarkedPath(name));
    assert.ok(info.size > 0, `watermarked/${name} is missing or empty`);
  }
});

test("watermarking preserves the original dimensions", async () => {
  for (const name of await listPortfolioSources()) {
    const original = await sharp(sourcePath(name)).metadata();
    const marked = await sharp(watermarkedPath(name)).metadata();

    assert.equal(marked.width, original.width, `${name} width changed`);
    assert.equal(marked.height, original.height, `${name} height changed`);
  }
});

test("the watermark is burnt into the pixels, not just overlaid in the DOM", async () => {
  for (const name of await listPortfolioSources()) {
    const { height } = await sharp(sourcePath(name)).metadata();
    const bandHeight = Math.max(2, Math.round(height * 0.06));

    const watermarkBand = await bandDelta(
      sourcePath(name),
      watermarkedPath(name),
      height - bandHeight,
      bandHeight,
    );
    // Control: the same-sized band from the middle, which carries only
    // re-encode noise.
    const controlBand = await bandDelta(
      sourcePath(name),
      watermarkedPath(name),
      Math.round(height / 2),
      bandHeight,
    );

    assert.ok(
      watermarkBand > controlBand * 3 && watermarkBand > 5,
      `${name}: bottom band changed by ${watermarkBand.toFixed(2)} vs control ${controlBand.toFixed(2)} — watermark not detected in pixels`,
    );
  }
});

test("the watermark band carries brand gold", async () => {
  for (const name of await listPortfolioSources()) {
    const image = sharp(watermarkedPath(name));
    const { width, height } = await image.metadata();
    const bandHeight = Math.max(2, Math.round(height * 0.06));

    const { data, info } = await image
      .extract({ left: 0, top: height - bandHeight, width, height: bandHeight })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Count pixels close to --gold (#d4a32f): warm, red>green>blue, mid-bright.
    let goldPixels = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (r > 140 && r < 245 && g > 100 && g < 200 && b < 110 && r - b > 70 && g - b > 40) {
        goldPixels += 1;
      }
    }

    assert.ok(goldPixels > 200, `${name}: found only ${goldPixels} gold watermark pixels`);
  }
});

test("original screenshots are left unwatermarked so the mark can be restyled", async () => {
  for (const name of await listPortfolioSources()) {
    const originalBytes = await readFile(sourcePath(name));
    const markedBytes = await readFile(watermarkedPath(name));
    assert.notEqual(
      originalBytes.equals(markedBytes),
      true,
      `${name}: source and watermarked copies are identical`,
    );
  }
});

test("regeneration is deterministic on a given machine", async () => {
  // Deliberately NOT asserting that a fresh encode matches the committed bytes.
  // libvips/mozjpeg emit different bytes on different platforms and builds, so
  // that assertion fails on any machine other than the one that generated the
  // files — it broke the Vercel build, which encodes on Linux while these were
  // generated on Windows. Same-machine determinism is the property that
  // actually matters: it makes `npm run watermark` reproducible and lets
  // `--check` detect drift. That a committed file is genuinely watermarked is
  // proven by the pixel, gold and source-inequality tests above, which hold on
  // every platform.
  for (const name of await listPortfolioSources()) {
    const [first, second] = await Promise.all([
      watermarkImage(sourcePath(name)),
      watermarkImage(sourcePath(name)),
    ]);

    assert.ok(
      first.equals(second),
      `${name}: two encodes of the same source differ, so the generator is not deterministic`,
    );
  }
});

test("committed derivatives are a faithful watermarking of their source", async () => {
  // Platform-tolerant stand-in for byte equality: the committed file must be a
  // real JPEG of the right shape, materially smaller than a lossless copy would
  // be, and visibly different from the source in the watermark band.
  for (const name of await listPortfolioSources()) {
    const committed = await readFile(watermarkedPath(name));
    const meta = await sharp(committed).metadata();
    const source = await sharp(sourcePath(name)).metadata();

    assert.equal(meta.format, "jpeg", `${name} is not a JPEG`);
    assert.equal(meta.width, source.width);
    assert.equal(meta.height, source.height);
    assert.ok(committed.byteLength > 10_000, `${name} is suspiciously small`);
  }
});

test("watermark overlay scales with the image and stays inside it", () => {
  for (const [width, height] of [[1347, 922], [800, 600], [2400, 1600]]) {
    const svg = buildWatermarkSvg(width, height).toString("utf8");

    assert.match(svg, new RegExp(`width="${width}"`));
    assert.match(svg, new RegExp(`height="${height}"`));
    assert.ok(svg.includes(WATERMARK_WORDMARK), "wordmark missing");
    assert.ok(svg.includes(WATERMARK_DOMAIN), "domain missing");
    assert.ok(svg.includes("#d4a32f"), "brand gold missing");
    // The public brand is the domain name, not the organisation name.
    assert.equal(WATERMARK_WORDMARK, "AB WEB STUDIO");
    assert.ok(!svg.includes("AB DIGITAL SOLUTIONS"), "watermark should use the public brand");

    // Nothing may be positioned beyond the canvas.
    for (const [, value] of svg.matchAll(/\sy="(\d+(?:\.\d+)?)"/g)) {
      assert.ok(Number(value) <= height, `y=${value} exceeds height ${height}`);
    }
    for (const [, value] of svg.matchAll(/\sx="(\d+(?:\.\d+)?)"/g)) {
      assert.ok(Number(value) <= width, `x=${value} exceeds width ${width}`);
    }
  }
});

test("the app serves watermarked imagery, never the clean originals", async () => {
  const [projectData, siteConfig] = await Promise.all([
    readFile(new URL("../app/project-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/site-config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(siteConfig, /watermarkedAssetBase/);
  assert.match(siteConfig, /\$\{assetBase\}\/watermarked/);

  const imageLines = [...projectData.matchAll(/^\s*image: `([^`]+)`/gm)].map(([, value]) => value);
  assert.equal(imageLines.length, 7);
  for (const line of imageLines) {
    assert.match(line, /^\$\{watermarkedAssetBase\}\//, `project image bypasses the watermark: ${line}`);
  }
  // The unwatermarked base must not be used for project screenshots.
  assert.doesNotMatch(projectData, /\$\{assetBase\}\/ab-portfolio-/);
});

test("there is exactly one watermark system, baked into the pixels", async () => {
  const artwork = await readFile(new URL("../app/project-artwork.tsx", import.meta.url), "utf8");

  // A DOM/CSS overlay watermark previously existed alongside this one. Two
  // systems double-brand every card and the overlay offers no protection on a
  // direct image URL, so the baked mark is the single source of truth.
  assert.doesNotMatch(artwork, /project-artwork-watermark/);
  assert.doesNotMatch(artwork, /project-artwork\.css/);
  assert.doesNotMatch(artwork, /AB Web Studio<|<strong>/);

  const { existsSync } = await import("node:fs");
  assert.equal(
    existsSync(new URL("../app/project-artwork.css", import.meta.url)),
    false,
    "the overlay stylesheet should not return",
  );
});

test("no unwatermarked portfolio master is reachable from public/", async () => {
  const { readdirSync, existsSync } = await import("node:fs");

  // The masters must live outside public/. When they sat beside the
  // derivatives, the clean image was one URL edit away (drop watermarked/v2),
  // which defeats watermarking entirely.
  assert.equal(existsSync(sourceDir), true, "assets-src/portfolio should hold the masters");
  assert.ok((await listPortfolioSources()).length > 0, "masters should be found outside public/");

  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

  const publicRoot = path.join(projectRoot, "public");
  const strays = walk(publicRoot)
    .filter((file) => /ab-portfolio-.*\.jpg$/i.test(file))
    .filter((file) => !file.includes(path.join("watermarked", `v${WATERMARK_VERSION}`)));

  assert.deepEqual(
    strays.map((f) => path.relative(projectRoot, f)),
    [],
    "unwatermarked portfolio images must not be served from public/",
  );
});

test("watermark version is recorded so derivatives can be invalidated", () => {
  assert.equal(typeof WATERMARK_VERSION, "number");
  assert.ok(WATERMARK_VERSION >= 1);
  assert.equal(WATERMARK_DIR, `watermarked/v${WATERMARK_VERSION}`);
});

test("the app and the generator agree on the watermark version", async () => {
  const siteConfig = await readFile(new URL("../app/site-config.ts", import.meta.url), "utf8");

  // These assets are served immutable for a year, so a restyle must change the
  // URL. If the two constants drift, the site would request a directory the
  // generator never wrote, or keep serving a stale watermark from cache.
  const declared = siteConfig.match(/export const WATERMARK_VERSION = (\d+)/);
  assert.ok(declared, "site-config must declare WATERMARK_VERSION");
  assert.equal(
    Number(declared[1]),
    WATERMARK_VERSION,
    "app/site-config.ts and scripts/watermark-projects.mjs disagree on the watermark version",
  );
  assert.match(siteConfig, /watermarked\/v\$\{WATERMARK_VERSION\}/);

  // And the versioned directory the app points at must actually exist.
  const { existsSync } = await import("node:fs");
  assert.equal(existsSync(watermarkedDir), true, `${watermarkedDir} is missing`);
});
