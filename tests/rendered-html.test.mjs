import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("homepage exposes content directly instead of using an iframe", async () => {
  const [page, homepage] = await Promise.all([
    read("../app/page.tsx"),
    read("../app/agency-home.tsx"),
  ]);

  assert.doesNotMatch(page, /<iframe\b/i);
  assert.match(homepage, /Websites that make your business/);
  assert.match(homepage, /id="contact"/);
  assert.match(homepage, /aria-roledescription="carousel"/);
  assert.match(homepage, /prefers-reduced-motion/);
});

test("portfolio contains every required live project", async () => {
  const homepage = await read("../app/agency-home.tsx");
  const requiredProjects = [
    "https://www.maplerentals.com.au/",
    "https://www.galarentals.com.au/",
    "https://zqremovals.au/",
    "https://www.decentdevelopment.com.au/",
    "https://milestonedevelopment.com.au/",
    "https://4-point-concrete-design.vercel.app/",
  ];

  for (const project of requiredProjects) assert.match(homepage, new RegExp(project.replaceAll(".", "\\.")));
});

test("SEO routes and metadata are configured", async () => {
  const [layout, robots, sitemap] = await Promise.all([
    read("../app/layout.tsx"),
    read("../app/robots.ts"),
    read("../app/sitemap.ts"),
  ]);

  assert.match(layout, /alternates: \{ canonical: "\/" \}/);
  assert.match(layout, /application\/ld\+json/);
  assert.match(layout, /ProfessionalService/);
  assert.match(robots, /sitemap\.xml/);
  assert.match(sitemap, /priority: 1/);
});

test("Vercel configuration uses the Next.js production build", async () => {
  const [rawVercelConfig, rawPackage] = await Promise.all([
    read("../vercel.json"),
    read("../package.json"),
  ]);
  const vercelConfig = JSON.parse(rawVercelConfig);
  const packageJson = JSON.parse(rawPackage);

  assert.equal(vercelConfig.framework, "nextjs");
  assert.equal(vercelConfig.installCommand, "npm ci");
  assert.equal(vercelConfig.buildCommand, "npm run build");
  assert.match(packageJson.scripts.build, /next build$/);
  assert.equal(packageJson.scripts.verify, "npm run lint && npm run typecheck && npm test");
  assert.equal(packageJson.scripts.typecheck, "bash scripts/sites-env.sh -- tsc --noEmit");
});
