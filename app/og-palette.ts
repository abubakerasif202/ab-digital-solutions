import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** ImageResponse cannot resolve site CSS variables. Read the same source as the site. */
export async function readOpenGraphPalette() {
  const css = await readFile(join(process.cwd(), "app/styles/ruby-palette.css"), "utf8");
  const primary = css.match(/^\s*--ruby:\s*(#[\da-f]{6});/im)?.[1];
  const deep = css.match(/^\s*--ruby-deep:\s*(#[\da-f]{6});/im)?.[1];
  if (!primary || !deep) throw new Error("Missing ruby tokens for Open Graph images.");
  return { primary, deep };
}
