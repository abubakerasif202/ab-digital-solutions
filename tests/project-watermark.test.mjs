import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("shared project artwork adds a non-interactive AB Web Studio watermark", async () => {
  const [artwork, styles] = await Promise.all([
    read("../app/project-artwork.tsx"),
    read("../app/project-artwork.css").catch(() => ""),
  ]);

  assert.match(artwork, /className="project-artwork"/);
  assert.match(artwork, /className="project-artwork-watermark"/);
  assert.match(artwork, /ab-logo-mark\.png/);
  assert.match(artwork, /AB Web Studio/);
  assert.match(artwork, /abwebstudio\.com\.au/);
  assert.match(artwork, /aria-hidden="true"/);
  assert.match(artwork, /import "\.\/project-artwork\.css"/);
  assert.match(styles, /\.project-artwork-watermark\s*\{[\s\S]*?pointer-events: none;[\s\S]*?opacity: 0\.62;/);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*?\.project-artwork-watermark\s*\{/);
});
