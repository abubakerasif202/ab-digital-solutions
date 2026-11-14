import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
const source = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ruby homepage is recomposed into cinematic, identity, exhibition, services, film and enquiry chapters", async () => {
  const home = await source("app/agency-home.tsx");
  for (const chapter of ["ruby-hero", "ruby-positioning", "ruby-services", "ruby-contact"]) assert.ok(home.includes(chapter));
  assert.ok(home.includes("<PortfolioSection />"));
  assert.ok(home.includes("<BrandFilmSection />"));
  assert.ok(home.includes("<RubyMotion />"));
  assert.ok(home.includes("Beyond ordinary."));
  assert.ok(home.indexOf("<PortfolioSection />") < home.indexOf('id="services"'));
  assert.doesNotMatch(home, /cinema-film-drawer|Original AI-generated harbour study|<LogoReveal|VirtualStudioPreview|processSteps/);
});

test("ruby film uses new local editorial footage and truthful narrative metadata", async () => {
  const film = await source("app/components/film/BrandFilmSection.tsx");
  assert.ok(film.includes("ab-studio-ruby-v2"));
  assert.ok(film.includes('duration: 24'));
  assert.ok(film.includes('duration: "PT24S"'));
  assert.doesNotMatch(film, /LogoReveal|particles|orbit|3D gallery|ab-web-studio-film-1080/);
  for (const name of ["ab-studio-ruby-v2-1080.mp4", "ab-studio-ruby-v2-720.mp4", "ab-studio-ruby-v2-poster.webp"]) {
    const asset = await stat(new URL(`../public/film/${name}`, import.meta.url));
    assert.ok(asset.size > 1000 && asset.size < 12000000);
  }
});

test("ruby palette and progressive motion have an explicit reduced-motion fallback", async () => {
  const [styles, motion, layout] = await Promise.all([source("app/styles/ruby-cinematic.css"), source("app/components/cinematic/RubyMotion.tsx"), source("app/layout.tsx")]);
  for (const color of ["#08070b", "#e32655", "#9b1535", "#e5c59a"]) assert.ok(styles.toLowerCase().includes(color));
  assert.ok(styles.includes("prefers-reduced-motion: reduce"));
  assert.ok(styles.includes("@supports (animation-timeline: view())"));
  assert.ok(motion.includes("cancelAnimationFrame"));
  assert.ok(motion.includes("removeEventListener"));
  assert.ok(motion.includes("prefers-reduced-motion: reduce"));
  assert.ok(layout.indexOf('"./styles/ruby-cinematic.css"') > layout.indexOf('"./styles/cinematic-interiors.css"'));
});

test("V3 mounts documented real-footage derivatives instead of the archived AI study", async () => {
  const [media, provenance] = await Promise.all([source("app/components/cinematic/CinematicMedia.tsx"), source("docs/cinematic-footage.md")]);
  assert.ok(media.includes('const base = "/cinematic/sydney-ruby-v3"'));
  assert.doesNotMatch(media, /sydney-night-v1/);
  for (const id of ["26580902", "37264008", "27617055"]) assert.ok(provenance.includes(id));
  assert.ok(provenance.includes("https://www.pexels.com/license/"));
  assert.ok(provenance.includes("sydney-ruby-v3"), "mounted V3 processing must have provenance");
  for (const variant of ["desktop", "mobile"]) {
    for (const extension of ["mp4", "webm"]) {
      const asset = await stat(new URL(`../public/cinematic/sydney-ruby-v3-${variant}.${extension}`, import.meta.url));
      assert.ok(asset.size > 10000 && asset.size < (variant === "mobile" ? 1100000 : 2250000));
    }
  }
});
