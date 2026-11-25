import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { areaLabels } from "../app/studio/studio-state.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(root, path), "utf8");

test("homepage shows the studio feature between Process and Enquiry", async () => {
  const home = await read("app/agency-home.tsx");
  const work = home.indexOf("<PortfolioSection />");
  const studio = home.indexOf("<HomeStudioFeature />");
  assert.ok(work !== -1 && studio !== -1, "both sections render");
  assert.ok(work < studio, "studio feature follows the work section");
  assert.ok(home.indexOf("<ProcessSection />") < studio);
  assert.ok(studio < home.indexOf("<EnquirySection"));
  assert.doesNotMatch(home, /VirtualStudioPreview/, "the pre-redesign preview stays banned from the homepage");
});

test("studio feature is a server-rendered still that links to /studio with prefetch disabled", async () => {
  const source = await read("app/components/HomeStudioFeature.tsx");
  assert.doesNotMatch(source, /^"use client"/m, "no client boundary of its own");
  const links = [...source.matchAll(/<Link\b[^>]*href="(\/studio[^"]*)"[^>]*>/g)];
  assert.ok(links.length >= 3, "image, primary CTA and no-3D link");
  for (const [tag] of links) assert.match(tag, /prefetch=\{false\}/, tag);
  assert.ok(links.some(([, href]) => href === "/studio#studio-content"), "links to the no-3D directory");
  assert.match(source, /Enter the Virtual Studio/);
  assert.match(source, /<h2 id="home-studio-heading"|as="h2" id="home-studio-heading"/);
  assert.match(source, /width=\{1440\}\s+height=\{900\}/);
  assert.match(source, /loading="lazy"/);
  assert.match(source, /sizes="/);
  // The image link duplicates the CTA, so it is hidden from assistive tech and the tab order.
  assert.match(source, /tabIndex=\{-1\}\s+aria-hidden="true"/);
  assert.match(source, /data-tilt/);
});

test("studio feature lists exactly the rooms the studio itself uses", async () => {
  const source = await read("app/components/HomeStudioFeature.tsx");
  const declared = source.match(/const rooms = \[([^\]]+)\] as const/)?.[1].match(/"([^"]+)"/g)?.map((name) => name.slice(1, -1));
  assert.deepEqual(declared, Object.values(areaLabels));
});

test("header and mobile menu share one primary navigation with Studio between Work and Services", async () => {
  const chrome = await read("app/site-chrome.tsx");
  const nav = chrome.slice(chrome.indexOf('id="primary-navigation"'));
  const order = ["/work", "/studio", "/services", "/#process", "/about", "/contact"].map((href) => nav.indexOf(`href="${href}"`));
  assert.ok(order.every((index) => index !== -1));
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "links keep this order, so numbering and focus follow it");
  assert.match(nav, /<Link href="\/studio" prefetch=\{false\}[^>]*aria-current=\{navLinkCurrent\("studio"\)\}[^>]*>Virtual Studio<\/Link>/);
  assert.match(chrome, /pathname\.startsWith\("\/studio"\) \? "studio"/);
});

test("the homepage module graph pulls in no studio route or three.js code", async () => {
  const seen = new Set();
  const offenders = [];
  const resolveRelative = (from, specifier) => {
    const base = resolve(dirname(from), specifier);
    return [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find((file) => /\.tsx?$/.test(file) && existsSync(file));
  };
  const visit = async (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const code = await readFile(file, "utf8");
    for (const [, specifier] of code.matchAll(/(?:import|export)\s[^"']*?from\s+["']([^"']+)["']|import\s+["']([^"']+)["']/g).map((m) => [m[0], m[1] ?? m[2]])) {
      if (/^(three|@react-three\/|three\/)/.test(specifier)) offenders.push(`${relative(root, file)} -> ${specifier}`);
      if (!specifier.startsWith(".")) continue;
      const target = resolveRelative(file, specifier);
      if (!target) continue;
      if (relative(join(root, "app/studio"), target).startsWith("..") === false) offenders.push(`${relative(root, file)} -> ${relative(root, target)}`);
      else await visit(target);
    }
  };
  await visit(join(root, "app/page.tsx"));
  assert.ok(seen.has(join(root, "app/components/HomeStudioFeature.tsx")), "the walker reaches the new section");
  assert.deepEqual(offenders, []);
});
