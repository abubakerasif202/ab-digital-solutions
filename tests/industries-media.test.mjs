// Industries hub, real phone captures, offline-site handling and route motion.
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const publicPath = (url) => new URL(`../public${url}`, import.meta.url);

test("every project belongs to exactly one industry and every reference resolves", async () => {
  const { industries, industryProjects } = await import("../app/industries/industry-data.ts");
  const { projects } = await import("../app/project-data.ts");
  const { findService } = await import("../app/services/service-data.ts");

  const assigned = industries.flatMap((industry) => [...industry.projects]);
  assert.equal(new Set(assigned).size, assigned.length, "a project is listed in two industries");
  assert.deepEqual([...assigned].sort(), projects.map((p) => p.slug).sort(), "every project needs one industry");

  for (const industry of industries) {
    assert.ok(industryProjects(industry).length >= 2, `${industry.slug} is too thin to stand as a page`);
    assert.match(industry.title, / for /, `${industry.slug} title must split on " for " for its headline`);
    assert.equal(industry.focus.length, 3);
    for (const slug of industry.services) assert.ok(findService(slug), `${industry.slug}: unknown service ${slug}`);
  }
});

test("industry pages carry no invented proof and are wired into SEO and navigation", async () => {
  const [data, hub, detail, sitemap, footer, services] = await Promise.all([
    read("../app/industries/industry-data.ts"),
    read("../app/industries/page.tsx"),
    read("../app/industries/[slug]/page.tsx"),
    read("../app/sitemap.ts"),
    read("../app/site-footer.tsx"),
    read("../app/services/page.tsx"),
  ]);
  const content = data.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(content, /\d+\s*%|\bguarantee|\baward|\btestimonial|\brated\b|\bclients served|\byears of experience/i);
  for (const page of [hub, detail]) {
    assert.match(page, /alternates: \{ canonical:/);
    assert.match(page, /"@type": "BreadcrumbList"/);
    assert.match(page, /"@type": "ItemList"/);
    assert.match(page, /<PageTransition>/);
  }
  assert.match(detail, /generateStaticParams/);
  // Masked headline lines are separate blocks: keep a real space for screen readers and search.
  assert.match(detail, /\{titleLead\} for\{" "\}/);
  assert.match(hub, /Built for the way\{" "\}/);
  assert.match(detail, /\{live && \(/, "live links must be gated on site status");
  assert.match(sitemap, /industries\.map/);
  assert.match(footer, /href="\/industries"/);
  assert.match(services, /href=\{`\/industries\/\$\{industry\.slug\}`\}/);
});

test("phone captures exist, are optimised and only for reachable sites", async () => {
  const { projects } = await import("../app/project-data.ts");
  for (const project of projects) {
    if (!project.mobileImage) continue;
    assert.ok(!project.offline, `${project.slug}: offline sites must not show a phone capture`);
    assert.match(project.mobileImage, /-mobile\.webp$/);
    const file = publicPath(project.mobileImage);
    assert.ok(existsSync(file), `${project.slug}: missing ${project.mobileImage}`);
    assert.ok(statSync(file).size < 150 * 1024, `${project.slug}: phone capture over 150 KB`);
  }
  assert.ok(projects.filter((p) => p.mobileImage).length >= 12);
});

test("offline client sites are never labelled or linked as live", async () => {
  const { projects, projectStatusLabel, isLiveProject } = await import("../app/project-data.ts");
  for (const project of projects.filter((p) => p.offline)) {
    assert.equal(isLiveProject(project), false);
    assert.doesNotMatch(projectStatusLabel(project), /live/i);
  }
  const [caseStudy, portfolio, workIndex] = await Promise.all([
    read("../app/work/[slug]/page.tsx"),
    read("../app/components/PortfolioSection.tsx"),
    read("../app/components/WorkIndexBody.tsx"),
  ]);
  assert.match(caseStudy, /\{live && <section className="gr-cs-live"/);
  assert.match(caseStudy, /Currently offline/);
  for (const source of [portfolio, workIndex]) {
    assert.doesNotMatch(source, /"Live system" : "Live website"/, "status labels must come from projectStatusLabel");
  }
});

test("route motion: page-level transitions, pinned header, scoped filter names, reduced motion", async () => {
  const [transition, motion, workIndex, layout] = await Promise.all([
    read("../app/components/motion/PageTransition.tsx"),
    read("../app/media-motion.css"),
    read("../app/components/WorkIndexBody.tsx"),
    read("../app/layout.tsx"),
  ]);
  assert.match(transition, /<ViewTransition enter="gr-page" exit="gr-page" default="none">/);
  assert.doesNotMatch(layout, /<ViewTransition|<PageTransition/, "layouts persist; wrap pages, not the layout");
  assert.match(layout, /import "\.\/media-motion\.css";/);
  assert.match(motion, /\.site-header \{ view-transition-name: site-header; \}/);
  assert.match(motion, /@media \(prefers-reduced-motion: reduce\)[\s\S]*::view-transition-group\(\*\)/);
  assert.match(motion, /\.gr-wi-list\.is-filtering \.gr-wi-card \{ view-transition-name: var\(--vt-card\); \}/);
  assert.doesNotMatch(workIndex, /viewTransitionName:/, "card names must not be permanent");
});

test("Gilt & Ruby: ruby is never used for headline accents or section indices", async () => {
  const css = (await Promise.all(["editorial", "compositions", "studio"].map((f) => read(`../app/${f}.css`)))).join("\n");
  assert.doesNotMatch(css, /accent-serif[^{]*\{[^}]*color: var\(--red/);
  assert.doesNotMatch(css, /section-index-num[^{]*\{[^}]*color: var\(--red/);
  assert.doesNotMatch(css, /hero-title \.mask-line:last-child \{ color: var\(--red/);
});
