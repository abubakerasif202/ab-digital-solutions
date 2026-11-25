/** A small, deterministic Sydney-night studio light rig; no remote HDR file or image decode. */
export function studioRadiance(width = 256, height = 128): Uint8Array {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 8 || height < 8) {
    throw new RangeError("Studio radiance requires integer dimensions of at least 8 pixels.");
  }
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      // Nocturnal carbon base with photographic softboxes and vivid ruby/gilt reflection strips.
      const key = Math.exp(-(((u - 0.22) / 0.11) ** 2) - ((v - 0.32) / 0.26) ** 2);
      const ruby = Math.exp(-(((u - 0.62) / 0.036) ** 2) - ((v - 0.5) / 0.34) ** 2);
      const gold = Math.exp(-(((u - 0.88) / 0.065) ** 2) - ((v - 0.36) / 0.22) ** 2);
      const deepRuby = Math.exp(-(((u - 0.46) / 0.08) ** 2) - ((v - 0.74) / 0.22) ** 2);
      const offset = (y * width + x) * 4;
      pixels[offset] = Math.min(255, 14 + key * 228 + ruby * 212 + gold * 216 + deepRuby * 128);
      pixels[offset + 1] = Math.min(255, 12 + key * 204 + ruby * 26 + gold * 168 + deepRuby * 14);
      pixels[offset + 2] = Math.min(255, 16 + key * 184 + ruby * 58 + gold * 86 + deepRuby * 34);
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}
