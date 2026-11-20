import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const css = read("app/styles/ruby-mobile-motion.css");

test("mobile motion layer is loaded after the kinetic layer it overrides", () => {
  const layout = read("app/layout.tsx");
  const home = read("app/page.tsx");
  assert.doesNotMatch(layout, /ruby-(?:kinetic|mobile-motion)\.css/);
  assert.match(home, /ruby-kinetic\.css";\s*import "[^"]*ruby-mobile-motion\.css"/);
});

test("hero shows case study links rather than film chapter labels", () => {
  const home = read("app/agency-home.tsx");
  assert.match(home, /aria-label="Selected case studies"/);
  assert.doesNotMatch(home, />\s*(?:Harbour|Arteries|Skyline)\s*</);
});

test("touch lighting and sheen are chosen by input capability and respect reduced motion", () => {
  assert.match(css, /@media \(hover: none\) and \(prefers-reduced-motion: no-preference\)/);
  assert.match(css, /\.ruby-hero-light \{ animation: ruby-light-drift/);
  assert.doesNotMatch(css, /@media \(max-width[^)]*\) \{[^}]*ruby-light-drift/);
});

test("exhibition finger drag is disabled under reduced motion", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.exhibition-image--current \{ translate: none; \}/);
  assert.match(read("app/components/cinematic/ProjectExhibition.tsx"), /event\.pointerType !== "touch" \|\| reduced/);
});

test("hero video recovers from a blocked autoplay on the first touch", () => {
  const media = read("app/components/cinematic/CinematicMedia.tsx");
  assert.match(media, /document\.addEventListener\("pointerdown", gesture/);
  assert.match(media, /document\.addEventListener\("touchend", gesture/);
  assert.match(media, /disableRemotePlayback/);
});

test("touch light and scroll fallback are gated, not always on", () => {
  const motion = read("app/components/cinematic/RubyMotion.tsx");
  assert.match(motion, /if \(reduced\.matches\) return;/);
  assert.match(motion, /CSS\.supports\("animation-timeline: view\(\)"\)/);
  assert.match(motion, /fine\.matches \? attachPointerLight\(element\) : attachTouchLight\(element\)/);
});

test("brand film keeps the fullscreen control on the narrowest phones", () => {
  assert.match(css, /\.film-btn \{ flex: none; \}/);
  assert.match(css, /\.film-scrub ~ \.film-time \{ display: none; \}/);
});
