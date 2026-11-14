import test from "node:test";
import assert from "node:assert/strict";
import { siteConfig } from "../app/site-config.ts";
import { projects } from "../app/project-data.ts";
import { readFile } from "node:fs/promises";

test("ruby redesign retains the owner-confirmed phone and WhatsApp destination", async () => {
  assert.equal(siteConfig.phoneDisplay, "0423 332 037");
  assert.equal(siteConfig.phoneInternational, "+61423332037");
  assert.equal(`https://wa.me/${siteConfig.phoneInternational.replace("+", "")}`, "https://wa.me/61423332037");
  const enquiry = await readFile(new URL("../app/components/studio/EnquirySection.tsx", import.meta.url), "utf8");
  assert.match(enquiry, /siteConfig\.phoneInternational/);
  assert.match(enquiry, /whatsappHref/);
});

test("project exhibition has a complete unique canonical pool and valid case-study targets", () => {
  assert.equal(projects.length, 19);
  assert.equal(new Set(projects.map(project => project.slug)).size, projects.length);
  for (const project of projects) {
    assert.ok(project.image.startsWith("/"));
    assert.ok(project.name.trim());
    assert.match(project.slug, /^[a-z0-9-]+$/);
  }
});