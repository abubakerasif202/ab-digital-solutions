import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { artworkDimensions } from "../app/artwork-dimensions.ts";

const appDir = new URL("../app/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return full.endsWith(".tsx") ? [full] : [];
  });
}

test("next/image elements carry real width and height instead of `fill`", () => {
  const offenders = [];
  for (const file of sourceFiles(appDir)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/<Image\b[^>]*?(?:\sfill(?=[\s/>=])|\sfill=)/gs)) {
      offenders.push(`${path.relative(appDir, file)}: ${match[0].replace(/\s+/g, " ").slice(0, 70)}`);
    }
  }
  assert.deepEqual(offenders, [], "give images intrinsic dimensions; use fillFrame inside an aspect-ratio wrapper");
});

test("artwork dimensions keep real capture sizes and scale small ratios", () => {
  assert.deepEqual(artworkDimensions("1348 / 926"), { width: 1348, height: 926 });
  assert.deepEqual(artworkDimensions("1440 / 1000"), { width: 1440, height: 1000 });
  assert.deepEqual(artworkDimensions("16 / 9"), { width: 1440, height: 810 });
  assert.deepEqual(artworkDimensions("nonsense"), { width: 1348, height: 926 });
});
