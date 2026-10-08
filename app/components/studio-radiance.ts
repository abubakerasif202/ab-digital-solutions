/** A small, deterministic studio light rig; no remote HDR file or image decode. */
export function studioRadiance(width = 256, height = 128): Uint8Array {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 8 || height < 8) {
    throw new RangeError("Studio radiance requires integer dimensions of at least 8 pixels.");
  }
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      // Large photographic softboxes and narrow coloured reflection strips.
      const key = Math.exp(-(((u - 0.22) / 0.11) ** 2) - ((v - 0.32) / 0.28) ** 2);
      const cyan = Math.exp(-(((u - 0.62) / 0.035) ** 2) - ((v - 0.5) / 0.35) ** 2);
      const gold = Math.exp(-(((u - 0.9) / 0.06) ** 2) - ((v - 0.35) / 0.2) ** 2);
      const violet = Math.exp(-(((u - 0.47) / 0.07) ** 2) - ((v - 0.75) / 0.22) ** 2);
      const offset = (y * width + x) * 4;
      pixels[offset] = Math.min(255, 34 + key * 220 + cyan * 70 + gold * 210 + violet * 115);
      pixels[offset + 1] = Math.min(255, 42 + key * 215 + cyan * 195 + gold * 160 + violet * 45);
      pixels[offset + 2] = Math.min(255, 64 + key * 190 + cyan * 190 + gold * 90 + violet * 180);
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}
