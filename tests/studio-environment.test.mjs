import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { CubeUVReflectionMapping, HalfFloatType, LinearFilter, LinearSRGBColorSpace } from "three";
import { createStudioEnvironment } from "../app/studio/scene/environment.ts";

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
