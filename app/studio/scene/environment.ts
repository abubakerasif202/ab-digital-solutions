import { CubeUVReflectionMapping, DataTexture, HalfFloatType, LinearFilter, LinearSRGBColorSpace, Loader, RGBAFormat } from "three";

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

async function fetchEnvironmentResponse(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Studio environment request failed (${response.status})`);
  return response;
}

async function fetchEnvironment(url: string): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === "function") {
    try {
      const { body } = await fetchEnvironmentResponse(`${url}.gz`);
      if (body) return await new Response(body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    } catch {
      // A proxy can strip or unpack the gzip resource. The original HDR map is still available.
    }
  }
  return (await fetchEnvironmentResponse(url)).arrayBuffer();
}

/** Gives preload, rendering and retry the same React Three Fiber cache entry. */
export class StudioEnvironmentLoader extends Loader<ArrayBuffer> {
  override load(url: string, onLoad: (data: ArrayBuffer) => void, _onProgress?: (event: ProgressEvent) => void, onError?: (error: unknown) => void) {
    void fetchEnvironment(url).then(onLoad, onError);
  }
}
