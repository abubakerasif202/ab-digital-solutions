import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("cinematic route styles are not part of the root CSS entry", async () => {
  const layout = await read("app/layout.tsx");
  assert.match(layout, /import "\.\/styles\/cinematic-shared\.css"/);
  assert.doesNotMatch(layout, /import "\.\/styles\/(?:cinematic|cinematic-interiors|project-exhibition|ruby-cinematic|ruby-kinetic|homepage-refinement)\.css"/);
  const home = await read("app/page.tsx");
  assert.match(home, /cinematic\.css";\s*import "[^"]*ruby-cinematic\.css";\s*import "[^"]*project-exhibition\.css";\s*import "[^"]*ruby-kinetic\.css";\s*import "[^"]*ruby-mobile-motion\.css";\s*import "[^"]*homepage-refinement\.css";/);
  for (const route of ["about", "services", "work"]) {
    assert.match(await read(`app/${route}/layout.tsx`), /import "[^"]*styles\/cinematic-interiors\.css"/);
  }
  assert.doesNotMatch(await read("app/contact/layout.tsx"), /cinematic-interiors\.css/);
  assert.doesNotMatch(await read("app/studio/page.tsx"), /cinematic-interiors\.css/);
});

test("interactive homepage content and shared footer are not deferred offscreen", async () => {
  const [globals, sections] = await Promise.all([read("app/globals.css"), read("app/styles/studio-sections.css")]);
  assert.doesNotMatch(globals, /\.site-footer[^{}]*\{[^}]*content-visibility:\s*auto/);
  assert.doesNotMatch(sections, /\.cinematic-home \.studio-enquiry[^{}]*\{[^}]*content-visibility:\s*auto/);
});
