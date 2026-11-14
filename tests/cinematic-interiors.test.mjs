import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("cinematic interiors have a scoped composition without changing page routes", async () => {
  for (const file of ["app/work/page.tsx", "app/work/[slug]/page.tsx", "app/services/page.tsx", "app/services/[slug]/page.tsx", "app/about/page.tsx"]) {
    const page = await source(file);
    assert.match(page, /cinema-interior/, file);
    assert.match(page, /id="main-content"/, file);
    assert.match(page, /application\/ld\+json/, file);
  }
});

test("editorial portfolio preserves filters, project destinations and transition identities", async () => {
  const work = await source("app/components/WorkIndexBody.tsx");
  assert.match(work, /cinema-work-chapter/);
  assert.match(work, /aria-pressed=\{isActive\}/);
  assert.match(work, /aria-live="polite"/);
  assert.match(work, /projectDestinationLabel\(project\)/);
  assert.match(work, /project-\$\{project\.slug\}/);
  assert.match(work, /\/work\/\$\{project\.slug\}/);
});

test("service and studio compositions retain genuine evidence and warm-paper chapters", async () => {
  const [services, detail, about, index, css] = await Promise.all([
    source("app/services/page.tsx"), source("app/services/[slug]/page.tsx"),
    source("app/about/page.tsx"), source("app/components/ServiceIndex.tsx"),
    source("app/styles/cinematic-interiors.css"),
  ]);
  assert.match(services, /cinema-paper/);
  assert.match(detail, /serviceContactHref\(service\)/);
  assert.match(detail, /cinema-service-evidence/);
  assert.match(about, /cinema-studio-chapter/);
  assert.ok(about.indexOf('className="gr-about-collage') < about.indexOf('className="container gr-about-approach'));
  assert.match(index, /cinema-service-index/);
  assert.match(index, /onFocus=\{\(\) => setActive\(index\)\}/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /max-width: 720px/);
  assert.match(css, /max-width: 380px/);
  assert.doesNotMatch(css, /scroll-behavior:\s*smooth/);
});
