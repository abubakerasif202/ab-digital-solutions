import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "../app/sitemap.ts";
import { projects } from "../app/project-data.ts";
import { servicePages } from "../app/services/service-data.ts";
import { siteConfig } from "../app/site-config.ts";

test("sitemap generates complete, valid, and deduplicated entries for all canonical routes", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  // Check uniqueness
  assert.equal(new Set(urls).size, urls.length, "sitemap must not contain duplicate URLs");

  // Expected count: 1 (home) + 1 (studio) + 1 (work) + 20 (projects) + 1 (services) + 7 (services pages) + 3 (about, contact, privacy) = 34
  const expectedTotal = 1 + 1 + 1 + projects.length + 1 + servicePages.length + 3;
  assert.equal(entries.length, expectedTotal, `sitemap should contain exactly ${expectedTotal} URLs`);

  // Verify core static routes exist
  assert.ok(urls.includes(siteConfig.url));
  assert.ok(urls.includes(`${siteConfig.url}/studio`));
  assert.ok(urls.includes(`${siteConfig.url}/work`));
  assert.ok(urls.includes(`${siteConfig.url}/services`));
  assert.ok(urls.includes(`${siteConfig.url}/about`));
  assert.ok(urls.includes(`${siteConfig.url}/contact`));
  assert.ok(urls.includes(`${siteConfig.url}/privacy`));

  // Verify all 20 project routes are present
  for (const { slug } of projects) {
    const projectUrl = `${siteConfig.url}/work/${slug}`;
    assert.ok(urls.includes(projectUrl), `sitemap is missing project URL: ${projectUrl}`);
  }

  // Verify all 7 service routes are present
  for (const { slug } of servicePages) {
    const serviceUrl = `${siteConfig.url}/services/${slug}`;
    assert.ok(urls.includes(serviceUrl), `sitemap is missing service URL: ${serviceUrl}`);
  }

  // Verify ISO date format, valid priorities, and change frequencies
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const validFrequencies = new Set(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]);
  for (const entry of entries) {
    assert.ok(entry.url.startsWith("https://"), `URL must be absolute HTTPS: ${entry.url}`);
    if (entry.lastModified) {
      const dateString = typeof entry.lastModified === "string" ? entry.lastModified : entry.lastModified.toISOString().split("T")[0];
      assert.match(dateString, isoDatePattern, `lastModified must be ISO YYYY-MM-DD: ${entry.url}`);
    }
    if (entry.priority !== undefined) {
      assert.ok(entry.priority >= 0.1 && entry.priority <= 1.0, `Priority out of range: ${entry.url}`);
    }
    if (entry.changeFrequency) {
      assert.ok(validFrequencies.has(entry.changeFrequency), `Invalid changeFrequency '${entry.changeFrequency}' on ${entry.url}`);
    }
  }
});
