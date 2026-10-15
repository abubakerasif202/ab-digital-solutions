import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { LOGO_PATHS, LOGO_VIEWBOX } from "../app/components/logo-mark.ts";

test("3D logo outlines match the canonical brand mark SVG", async () => {
  const svg = await readFile(new URL("../public/brand/ab-mark.svg", import.meta.url), "utf8");
  for (const path of Object.values(LOGO_PATHS)) assert.ok(svg.includes(`d="${path}"`), path);
  assert.ok(svg.includes(`viewBox="0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}"`));
});
