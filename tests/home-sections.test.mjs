import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { homeSections, sectionEyebrow, sectionNumber } from "../app/home-sections.ts";

test("homepage chapter numbers are sequential with no duplicates", () => {
  const numbers = homeSections.map((section) => sectionNumber(section.id));
  assert.deepEqual(numbers, numbers.map((_, index) => String(index + 1).padStart(2, "0")));
  assert.equal(new Set(numbers).size, numbers.length);
  assert.equal(sectionEyebrow("process"), "05 / The process");
});

test("the process section owns the #process anchor and reuses the service steps", async () => {
  const section = await readFile(new URL("../app/components/ProcessSection.tsx", import.meta.url), "utf8");
  const film = await readFile(new URL("../app/components/film/BrandFilmSection.tsx", import.meta.url), "utf8");
  const home = await readFile(new URL("../app/agency-home.tsx", import.meta.url), "utf8");
  assert.match(section, /id="process"/);
  assert.match(section, /The thinking behind the feeling\./);
  assert.match(section, /serviceDelivery\["web-design-sydney"\]\.steps/);
  assert.doesNotMatch(film, /id="process"/);
  assert.match(home, /<ProcessSection \/>/);
  // Eyebrows come from the shared list, never hardcoded numbers.
  assert.doesNotMatch(home, /\b0[1-9] \/ [A-Z]/);
});
