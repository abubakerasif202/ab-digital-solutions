import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("brand film assets exist and the videos are web-optimised", async () => {
  const sizes = {};
  for (const name of ["ab-web-studio-film-1080.mp4", "ab-web-studio-film-720.mp4", "ab-film-poster.webp"]) {
    sizes[name] = (await stat(new URL(`../public/film/${name}`, import.meta.url))).size;
    assert.ok(sizes[name] > 1000, `${name} is empty`);
  }
  assert.ok(sizes["ab-web-studio-film-1080.mp4"] < 12 * 1024 * 1024, "1080p film should stay under 12MB");
  assert.ok(sizes["ab-web-studio-film-720.mp4"] < sizes["ab-web-studio-film-1080.mp4"]);
  for (const name of ["ab-reveal-mark", "ab-reveal-mark-bright", "ab-reveal-wordmark"]) {
    assert.ok((await stat(new URL(`../public/brand/${name}.webp`, import.meta.url))).size > 1000);
  }
});

test("film player never loads video before a user gesture", async () => {
  const player = await read("../app/components/film/BrandFilmPlayer.tsx");
  // The <video> element is only rendered once a source has been chosen by start().
  assert.match(player, /started \? \(\s*<video/);
  assert.doesNotMatch(player, /autoPlay/);
  assert.match(player, /aria-label="Seek"/);
  assert.match(player, /webkitEnterFullscreen/);
});

test("logo reveal respects reduced motion, plays once per session and cleans up", async () => {
  const reveal = await read("../app/components/film/LogoReveal.tsx");
  assert.match(reveal, /prefers-reduced-motion: reduce/);
  assert.match(reveal, /sessionStorage/);
  assert.match(reveal, /cancelAnimationFrame/);
  assert.match(reveal, /await import\("\.\/logo-particles"\)/);
});

test("homepage mounts the brand film after the portfolio", async () => {
  const [home, layout] = await Promise.all([read("../app/agency-home.tsx"), read("../app/layout.tsx")]);
  assert.ok(home.indexOf("<PortfolioSection />") < home.indexOf("<BrandFilmSection />"));
  assert.ok(home.indexOf("<BrandFilmSection />") < home.indexOf('id="services"'));
  assert.match(layout, /styles\/brand-film\.css/);
});
