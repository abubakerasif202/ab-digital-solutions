import test from "node:test";
import assert from "node:assert/strict";
import { createSignalGeometry, signalPoint } from "../app/components/signal-geometry.ts";

test("signal sculpture has finite indices and a closed seam", () => {
  const { positions, indices } = createSignalGeometry(48, 8);
  assert.equal(positions.length, 49 * 9 * 3);
  assert.equal(indices.length, 48 * 8 * 6);
  assert.ok(positions.every(Number.isFinite));
  assert.ok(indices.every((index) => index >= 0 && index < positions.length / 3));
  for (const across of [-1, 0, 1]) {
    const start = signalPoint(0, across);
    const end = signalPoint(Math.PI * 2, across);
    assert.ok(start.every((coordinate, index) => Math.abs(coordinate - end[index]) < 1e-10));
  }
  assert.throws(() => createSignalGeometry(2, 8), RangeError);
});
