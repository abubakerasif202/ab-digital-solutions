import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { wallColumns } from "../app/components/cinematic/work-wall-layout.ts";
const source = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ruby homepage is recomposed into work-first hero, identity, exhibition, services, process and enquiry chapters", async () => {
  const home = await source("app/agency-home.tsx");
  for (const chapter of ["ruby-hero", "ruby-positioning", "ruby-services", "ruby-contact"]) assert.ok(home.includes(chapter));
  assert.ok(home.includes("<PortfolioSection />"));
  assert.ok(home.includes("<HeroWorkWall />"));
  assert.ok(home.includes("<ProcessSection />"));
  assert.ok(!home.includes("<BrandFilmSection />"));
  assert.ok(home.includes("<RubyMotion />"));
  assert.ok(home.includes("real businesses."));
  assert.ok(home.indexOf("<PortfolioSection />") < home.indexOf('id="services"'));
  assert.doesNotMatch(home, /cinema-film-drawer|Original AI-generated harbour study|<LogoReveal|VirtualStudioPreview|processSteps/);
});

test("hero work wall shows every real case study, decoratively, with a working pause", async () => {
  const [wall, styles] = await Promise.all([source("app/components/cinematic/HeroWorkWall.tsx"), source("app/components/cinematic/work-wall.css")]);
  assert.match(wall, /wallColumns<Project>\(projects\)/);
  assert.match(wall, /<ProjectArtwork[^>]*decorative/);
  assert.match(wall, /aria-hidden="true"/);
  assert.doesNotMatch(wall, /<Link|<a /, "the decorative wall must hold no focusable elements");
  assert.match(wall, /<TickerToggle className="work-wall-control"/);
  // Motion is gated on the ready pause control and disabled under reduced motion.
  assert.match(styles, /\.work-first-hero:has\(> \.work-wall-control\[data-ready\]\)/);
  assert.match(styles, /\.work-first-hero:has\(> \.work-wall-control\[aria-pressed="true"\]\)[^{]*\{ animation-play-state: paused; \}/);
  assert.match(styles, /prefers-reduced-motion: no-preference/);
  // Two identical copies need a trailing gap so translating by -50% loops without a jump.
  assert.match(styles, /\.work-wall-column \{[^}]*gap: var\(--wall-gap\);[^}]*padding: 0 0 var\(--wall-gap\);/);
  const columns = wallColumns(["0", "1", "2", "3", "4", "5", "6"], 3);
  assert.deepEqual(columns, [["0", "3", "6"], ["1", "4"], ["2", "5"]]);
  assert.equal(columns.flat().length, 7, "every case study appears exactly once per copy");
});

test("ruby palette and progressive motion have an explicit reduced-motion fallback", async () => {
  const [styles, motion, layout, kinetic] = await Promise.all([source("app/styles/ruby-cinematic.css"), source("app/components/cinematic/RubyMotion.tsx"), source("app/layout.tsx"), source("app/styles/ruby-kinetic.css")]);
  for (const color of ["#08070b", "#e32655", "#9b1535", "#e5c59a"]) assert.ok(styles.toLowerCase().includes(color));
  assert.ok(styles.includes("prefers-reduced-motion: reduce"));
  assert.ok(kinetic.includes("@supports (animation-timeline: view())"));
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
      const asset = await stat(new URL(`../public/cinematic/sydney-ruby-v3-${variant}-lite.${extension}`, import.meta.url));
      assert.ok(asset.size > 10000 && asset.size < (variant === "mobile" ? 500000 : 950000));
    }
  }
});
