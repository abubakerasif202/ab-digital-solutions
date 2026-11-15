/**
 * Intrinsic pixel size for an "a / b" aspect ratio. Real captures already carry pixel
 * values (e.g. "1348 / 926"); small ratios such as "16 / 9" are scaled to a 1440px width.
 */
export function artworkDimensions(ratio: string): { width: number; height: number } {
  const [w, h] = ratio.split("/").map((part) => parseFloat(part));
  if (!w || !h) return { width: 1348, height: 926 };
  if (w >= 1000) return { width: Math.round(w), height: Math.round(h) };
  return { width: 1440, height: Math.round((1440 * h) / w) };
}
