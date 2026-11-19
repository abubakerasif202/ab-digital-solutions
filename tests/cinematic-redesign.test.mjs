import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
test("cinematic opening keeps business context and direct enquiry without a 3D loading gate", async () => {
 const home = await read("app/agency-home.tsx");
 assert.match(home, /<HeroWorkWall \/>/);
 assert.match(home, /id="hero-heading"/);
 assert.match(home, /Websites built for/);
 assert.match(home, /real businesses\./);
 assert.match(home, /\$\{projects\.length\} websites, online stores and business systems/);
 assert.match(home, /href="#contact"/);
 assert.match(home, /href="#work"/);
 assert.match(home, /<ContactForm/);
 assert.doesNotMatch(home, /<Hero3DExperience|<StackLedger|<LiveTicker|stage-ring/);
});
test("editorial portfolio preserves the full canonical index and real case-study artwork", async () => {
 const portfolio = await read("app/components/PortfolioSection.tsx");
 const exhibition = await read("app/components/cinematic/ProjectExhibition.tsx");
 assert.match(portfolio, /<ProjectExhibition \/>/);
 assert.match(portfolio, /Explore all \{projects\.length\} projects/);
 assert.match(exhibition, /<ProjectArtwork/);
 assert.match(exhibition, /projects\.map/);
 assert.match(exhibition, /projectDestinationLabel/);
 assert.match(exhibition, /\/work\/\$\{active\.slug\}/);
 assert.doesNotMatch(portfolio, /<ProjectShowcase/);
});
test("cinematic styles supply narrow-screen composition and reduced-motion fallbacks", async () => {
 const styles = await read("app/styles/cinematic.css");
 assert.match(styles, /prefers-reduced-motion: reduce/);
 assert.match(styles, /max-width: 600px/);
 assert.match(styles, /cinema-hero/);
 assert.doesNotMatch(styles, /scroll-snap-type:\s*y mandatory/);
});
test("versioned cinematic media has immutable caching separate from stable brand files", async () => {
 const config = await read("next.config.ts");
 assert.match(config, /source: "\/cinematic\/:path\*"[\s\S]*?max-age=31536000, immutable/);
});
