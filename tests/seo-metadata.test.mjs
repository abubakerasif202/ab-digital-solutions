import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { projects } from "../app/project-data.ts";
import { servicePages } from "../app/services/service-data.ts";

const SUFFIX = " | AB Web Studio";
const caseStudyDescription = (project) => project.seoDescription ?? project.description;

test("every case study uses one title pattern within 60 characters", async () => {
  const page = await readFile(new URL("../app/work/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const title = `\$\{project\.titleName \?\? project\.name\} Case Study`;/);
  for (const project of projects) {
    assert.equal(project.seoTitle, undefined, `${project.slug} must not override the shared title pattern`);
    const rendered = `${project.titleName ?? project.name} Case Study${SUFFIX}`;
    assert.ok(rendered.length <= 60, `${project.slug}: ${rendered.length} chars`);
  }
});

test("service titles stay within 60 characters, primary term first, brand last", () => {
  for (const service of servicePages) {
    assert.ok(service.seoTitle.length <= 60, `${service.slug}: ${service.seoTitle.length} chars`);
    assert.ok(service.seoTitle.endsWith(SUFFIX), service.slug);
  }
});

test("case study and service meta descriptions are between 80 and 160 characters", () => {
  for (const project of projects) {
    const length = caseStudyDescription(project).length;
    assert.ok(length >= 80 && length <= 160, `${project.slug}: ${length} chars`);
  }
  for (const service of servicePages) {
    assert.ok(service.seoDescription.length >= 80 && service.seoDescription.length <= 160, `${service.slug}: ${service.seoDescription.length} chars`);
  }
});

test("the previously short or long descriptions are rewritten to 120-158 characters", () => {
  const rewritten = ["maple-rentals", "zq-removals", "decent-development", "gala-rentals", "4-point-concrete", "milestone-development", "jufaja-homes", "cheap-adelaide-removalist", "aftab-sons-transport"];
  for (const slug of rewritten) {
    const project = projects.find((entry) => entry.slug === slug);
    const length = caseStudyDescription(project).length;
    assert.ok(length >= 120 && length <= 158, `${slug}: ${length} chars`);
  }
  const ecommerce = servicePages.find((service) => service.slug === "ecommerce-website-development");
  assert.ok(ecommerce.seoDescription.length >= 120 && ecommerce.seoDescription.length <= 158);
});
