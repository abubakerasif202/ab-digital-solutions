import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("logo reveal assets exist and retired film encodes are not published", async () => {
  await assert.rejects(stat(new URL("../public/film/", import.meta.url)), { code: "ENOENT" });
  for (const name of ["ab-reveal-mark", "ab-reveal-mark-bright", "ab-reveal-wordmark"]) {
    assert.ok((await stat(new URL(`../public/brand/${name}.webp`, import.meta.url))).size > 1000);
  }
});

test("logo reveal respects reduced motion, plays once per session and cleans up", async () => {
  const reveal = await read("../app/components/film/LogoReveal.tsx");
  assert.match(reveal, /prefers-reduced-motion: reduce/);
  assert.match(reveal, /sessionStorage/);
  assert.match(reveal, /cancelAnimationFrame/);
  assert.match(reveal, /await import\("\.\/logo-particles"\)/);
});

test("homepage restores the project wall without a redundant film section", async () => {
  const [home, layout, header, footer] = await Promise.all([
    read("../app/agency-home.tsx"),
    read("../app/layout.tsx"),
    read("../app/site-chrome.tsx"),
    read("../app/site-footer.tsx"),
  ]);
  assert.doesNotMatch(home, /BrandFilmSection|CinematicMedia/);
  assert.match(home, /<HeroWorkWall \/>/);
  assert.doesNotMatch(header, /href="#film"/);
  assert.doesNotMatch(footer, /href="#film"/);
  assert.match(layout, /styles\/brand-film\.css/);
});
