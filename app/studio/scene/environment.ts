import { CubeUVReflectionMapping, DataTexture, HalfFloatType, LinearFilter, LinearSRGBColorSpace, RGBAFormat } from "three";

/** Exact half-float PMREM pixels baked from the original Three 185 RoomEnvironment. */
export function createStudioEnvironment(buffer: ArrayBuffer): DataTexture {
  const width = 384, height = 512;
  if (buffer.byteLength !== 16 + width * height * 8) throw new Error("Invalid Studio environment size");
  const header = new DataView(buffer);
  if (String.fromCharCode(...new Uint8Array(buffer, 0, 8)) !== "ABENV001" || header.getUint32(8, true) !== width || header.getUint32(12, true) !== height) {
    throw new Error("Invalid Studio environment header");
  }
  const texture = new DataTexture(new Uint16Array(buffer, 16), width, height, RGBAFormat, HalfFloatType);
  texture.mapping = CubeUVReflectionMapping;
  texture.colorSpace = LinearSRGBColorSpace;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}
