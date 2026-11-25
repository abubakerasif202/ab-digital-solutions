import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { CubeUVReflectionMapping, HalfFloatType, LinearFilter, LinearSRGBColorSpace } from "three";
import { createStudioEnvironment, StudioEnvironmentLoader } from "../app/studio/scene/environment.ts";

import { environmentUrl } from "../app/studio/studio-assets.ts";

const bytes = await readFile(new URL("../public/studio/room-environment.bin", import.meta.url));
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
test("baked original RoomEnvironment preserves HDR CubeUV pixels and sampling", () => {
  const texture = createStudioEnvironment(buffer);
  assert.equal(texture.image.width, 384); assert.equal(texture.image.height, 512);
  assert.equal(texture.mapping, CubeUVReflectionMapping); assert.equal(texture.type, HalfFloatType);
  assert.equal(texture.colorSpace, LinearSRGBColorSpace);
  assert.equal(texture.minFilter, LinearFilter); assert.equal(texture.magFilter, LinearFilter);
  assert.equal(texture.generateMipmaps, false); assert.equal(texture.flipY, false);
  assert.deepEqual(texture.image.data, new Uint16Array(buffer, 16));
  assert.ok(texture.image.data.some((value) => value > 0x3c00 && value < 0x7c00), "HDR reflections must retain values above one");
  texture.dispose();
});
test("corrupt or mismatched environment resources fail instead of showing changed lighting", () => {
  assert.throws(() => createStudioEnvironment(new ArrayBuffer(8)), /environment/);
  for (const offset of [0, 8, 12]) {
    const corrupt = buffer.slice(0); new Uint8Array(corrupt)[offset] ^= 1;
    assert.throws(() => createStudioEnvironment(corrupt), /environment/);
  }
});

test("the precompressed environment serves the identical HDR pixels at a smaller transfer size", async () => {
  const compressed = await readFile(new URL("../public/studio/room-environment.bin.gz", import.meta.url));
  assert.deepEqual(gunzipSync(compressed), bytes);
  assert.ok(compressed.length < bytes.length / 3);
});

test("the environment loader decompresses gzip and uses the raw asset on older engines", async (t) => {
  const compressed = await readFile(new URL("../public/studio/room-environment.bin.gz", import.meta.url));
  const base = environmentUrl;
  const request = t.mock.method(globalThis, "fetch", async (url) => {
    assert.ok(url === base || url === `${base}.gz`);
    return new Response(url === base ? bytes : compressed);
  });
  const loader = new StudioEnvironmentLoader();
  assert.deepEqual(await loader.loadAsync(base), buffer);
  assert.equal(request.mock.calls[0].arguments[0], `${base}.gz`);
  const original = Object.getOwnPropertyDescriptor(globalThis, "DecompressionStream");
  try {
    Object.defineProperty(globalThis, "DecompressionStream", { configurable: true, value: undefined });
    assert.deepEqual(await loader.loadAsync(base), buffer);
    assert.equal(request.mock.calls[1].arguments[0], base);
  } finally {
    Object.defineProperty(globalThis, "DecompressionStream", original);
  }
});
