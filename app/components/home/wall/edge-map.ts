/**
 * Builds a structure ("edge") map from a decoded screenshot with a Sobel
 * filter. It is computed once per project on a small canvas so the fragment
 * shader never pays for neighbourhood sampling, which keeps mobile cheap.
 */

export const EDGE_WIDTH = 512;

export function buildEdgeCanvas(image: CanvasImageSource, sourceWidth: number, sourceHeight: number): HTMLCanvasElement {
  const width = EDGE_WIDTH;
  const height = Math.max(2, Math.round((EDGE_WIDTH * sourceHeight) / sourceWidth));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;

  context.drawImage(image, 0, 0, width, height);
  const source = context.getImageData(0, 0, width, height).data;

  const luminance = new Float32Array(width * height);
  for (let i = 0, p = 0; i < luminance.length; i += 1, p += 4) {
    luminance[i] = (source[p] * 0.2126 + source[p + 1] * 0.7152 + source[p + 2] * 0.0722) / 255;
  }

  const output = context.createImageData(width, height);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const gx =
        -luminance[i - width - 1] - 2 * luminance[i - 1] - luminance[i + width - 1] +
        luminance[i - width + 1] + 2 * luminance[i + 1] + luminance[i + width + 1];
      const gy =
        -luminance[i - width - 1] - 2 * luminance[i - width] - luminance[i - width + 1] +
        luminance[i + width - 1] + 2 * luminance[i + width] + luminance[i + width + 1];
      // Soft threshold: faint texture falls away, structural lines survive.
      const magnitude = Math.min(1, Math.max(0, (Math.hypot(gx, gy) - 0.12) * 2.4));
      const value = Math.round(magnitude * 255);
      const p = i * 4;
      output.data[p] = value;
      output.data[p + 1] = value;
      output.data[p + 2] = value;
      output.data[p + 3] = 255;
    }
  }
  // Opaque borders keep the one-pixel frame black instead of undefined.
  for (let i = 3; i < output.data.length; i += 4) output.data[i] = 255;
  context.putImageData(output, 0, 0);
  return canvas;
}
