#!/usr/bin/env node
/**
 * Bakes the AB Digital Solutions watermark into every portfolio screenshot.
 *
 * Client project imagery is the studio's proof of work, so the branding has to
 * survive being right-click-saved and reposted. A DOM/CSS overlay would not —
 * it is one devtools node deletion away. This composites the mark into the
 * pixels instead, writing derivatives to assets/watermarked/ and leaving the
 * originals untouched so the watermark can always be regenerated or restyled.
 *
 * Deterministic and idempotent: same inputs and settings produce byte-identical
 * output, which `tests/project-watermark.test.mjs` relies on.
 *
 *   npm run watermark            regenerate
 *   npm run watermark -- --check verify without writing (used by tests/CI)
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceDir = path.join(projectRoot, "public/site/ab-digital-premium/assets");
const outputDir = path.join(sourceDir, "watermarked");

/** Bumping this invalidates every derivative, so tests can catch stale output. */
export const WATERMARK_VERSION = 1;

const GOLD = "#d4a32f";
const INK = "#050505";

/**
 * Watermark geometry, expressed as fractions of the image width so the mark
 * scales consistently across differently sized screenshots.
 */
const LAYOUT = {
  barHeightRatio: 0.058,
  minBarHeight: 28,
  paddingRatio: 0.018,
  wordmarkRatio: 0.0135,
  minWordmarkSize: 11,
  domainRatio: 0.0115,
  minDomainSize: 9,
};

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[char]);
}

/**
 * Builds the watermark overlay: a gold hairline, a translucent ink gradient
 * anchored to the bottom edge, the studio wordmark, and a gold corner rule.
 * Uses only geometry and system-independent text metrics so output does not
 * vary with the fonts installed on the build machine.
 */
export function buildWatermarkSvg(width, height) {
  const barHeight = Math.max(LAYOUT.minBarHeight, Math.round(height * LAYOUT.barHeightRatio));
  const padding = Math.round(width * LAYOUT.paddingRatio);
  const wordmarkSize = Math.max(LAYOUT.minWordmarkSize, Math.round(width * LAYOUT.wordmarkRatio));
  const domainSize = Math.max(LAYOUT.minDomainSize, Math.round(width * LAYOUT.domainRatio));
  const barTop = height - barHeight;
  const baseline = barTop + Math.round(barHeight * 0.64);
  const ruleWidth = Math.round(wordmarkSize * 1.6);

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${INK}" stop-opacity="0"/>
      <stop offset="55%" stop-color="${INK}" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.88"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${barTop}" width="${width}" height="${barHeight}" fill="url(#scrim)"/>
  <rect x="0" y="${barTop}" width="${width}" height="1" fill="${GOLD}" fill-opacity="0.55"/>
  <rect x="${padding}" y="${baseline - Math.round(wordmarkSize * 0.34)}" width="${ruleWidth}" height="2" fill="${GOLD}"/>
  <text x="${padding + ruleWidth + Math.round(padding * 0.5)}" y="${baseline}"
        font-family="Helvetica, Arial, sans-serif" font-size="${wordmarkSize}"
        font-weight="700" letter-spacing="${(wordmarkSize * 0.14).toFixed(2)}"
        fill="${GOLD}" fill-opacity="0.94">${escapeXml("AB DIGITAL SOLUTIONS")}</text>
  <text x="${width - padding}" y="${baseline}" text-anchor="end"
        font-family="Helvetica, Arial, sans-serif" font-size="${domainSize}"
        letter-spacing="${(domainSize * 0.1).toFixed(2)}"
        fill="#f2f0ec" fill-opacity="0.78">${escapeXml("abwebstudio.com.au")}</text>
</svg>`,
    "utf8",
  );
}

/** Returns the watermarked JPEG for one source image. */
export async function watermarkImage(sourcePath) {
  const image = sharp(sourcePath, { failOn: "error" });
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error(`Could not read dimensions of ${sourcePath}`);

  return image
    .composite([{ input: buildWatermarkSvg(width, height), top: 0, left: 0 }])
    // mozjpeg is deterministic for a given input, so reruns are byte-identical.
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

/** Source images that must carry the watermark. */
export async function listPortfolioSources() {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^ab-portfolio-.*\.jpg$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

async function main() {
  const checkOnly = process.argv.includes("--check");
  const sources = await listPortfolioSources();

  if (sources.length === 0) {
    console.error("No ab-portfolio-*.jpg sources found in", sourceDir);
    process.exit(1);
  }

  if (!checkOnly) await mkdir(outputDir, { recursive: true });

  let stale = 0;
  for (const name of sources) {
    const watermarked = await watermarkImage(path.join(sourceDir, name));
    const destination = path.join(outputDir, name);

    let existing = null;
    try {
      existing = await readFile(destination);
    } catch {
      existing = null;
    }

    const matches = existing !== null && sha256(existing) === sha256(watermarked);
    if (matches) {
      console.log(`  ok      ${name}`);
      continue;
    }

    stale += 1;
    if (checkOnly) {
      console.error(`  STALE   ${name}${existing === null ? " (missing)" : ""}`);
      continue;
    }

    await writeFile(destination, watermarked);
    console.log(`  written ${name} (${(watermarked.byteLength / 1024).toFixed(0)} KB)`);
  }

  if (checkOnly && stale > 0) {
    console.error(`\n${stale} watermarked image(s) out of date. Run: npm run watermark`);
    process.exit(1);
  }

  console.log(`\n${sources.length} portfolio image(s) watermarked.`);
}

// Only run when invoked directly, so tests can import the helpers above.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  await main();
}
