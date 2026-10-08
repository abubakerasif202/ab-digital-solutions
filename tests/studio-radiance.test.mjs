import test from "node:test";
import assert from "node:assert/strict";
import { studioRadiance } from "../app/components/studio-radiance.ts";

test("studio light rig is deterministic, opaque and includes bright reflection panels", () => {
  const pixels = studioRadiance(64, 32);
  assert.equal(pixels.length, 64 * 32 * 4);
  assert.deepEqual(pixels, studioRadiance(64, 32));
  assert.ok(pixels.every((value, index) => index % 4 !== 3 || value === 255));
  const luminance = [];
  for (let i = 0; i < pixels.length; i += 4) luminance.push(pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722);
  assert.ok(Math.max(...luminance) > 200);
  assert.ok(Math.min(...luminance) < 60);
  assert.throws(() => studioRadiance(0, 32), RangeError);
  assert.throws(() => studioRadiance(32.5, 32), RangeError);
});

test("softbox rig rejects invalid image dimensions", () => {
  for (const width of [NaN, Infinity, -1, 7, 20.5]) assert.throws(() => studioRadiance(width, 32), RangeError);
});
