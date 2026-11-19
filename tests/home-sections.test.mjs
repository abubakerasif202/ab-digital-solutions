import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { homeSections, sectionEyebrow, sectionNumber } from "../app/home-sections.ts";

test("homepage chapter numbers are sequential with no duplicates", () => {
  const numbers = homeSections.map((section) => sectionNumber(section.id));
  assert.deepEqual(numbers, numbers.map((_, index) => String(index + 1).padStart(2, "0")));
  assert.equal(new Set(numbers).size, numbers.length);
  assert.equal(sectionEyebrow("process"), "04 / The process");
  assert.ok(!homeSections.some((section) => section.id === "film"), "the stock Sydney film chapter is retired");
});

test("the process section owns the #process anchor and reuses the service steps", async () => {
  const section = await readFile(new URL("../app/components/ProcessSection.tsx", import.meta.url), "utf8");
  const home = await readFile(new URL("../app/agency-home.tsx", import.meta.url), "utf8");
  assert.match(section, /id="process"/);
  assert.match(section, /How a project runs\./);
  assert.match(section, /serviceDelivery\["web-design-sydney"\]\.steps/);
  // Each step names a real deliverable instead of empty placeholder cards.
  assert.match(section, /className="ruby-process-deliverable"/);
  assert.doesNotMatch(section, /ruby-process-sketch/);
  assert.match(home, /<ProcessSection \/>/);
  // Eyebrows come from the shared list, never hardcoded numbers.
  assert.doesNotMatch(home, /\b0[1-9] \/ [A-Z]/);
});
