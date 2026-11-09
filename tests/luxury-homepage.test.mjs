// Guards for the standalone luxury-homepage prototype in opendesign/luxury-homepage.
// The browser behaviour is covered by tests/e2e/luxury-homepage.spec.mjs.
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { buildHomepageData } from "../scripts/export-homepage-data.mjs";

const dir = new URL("../opendesign/luxury-homepage/", import.meta.url);
const read = (name) => readFile(new URL(name, dir), "utf8");

test("data.json is generated from the canonical registry and is not stale", async () => {
  const committed = JSON.parse(await read("data.json"));
  const fresh = await buildHomepageData();
  assert.deepEqual(committed, fresh, "run `npm run opendesign:data` and commit the result");
  const { projects } = await import("../app/project-data.ts");
  assert.equal(committed.projects.length, projects.length);
});

test("contact details and profiles come from site-config, never placeholders", async () => {
  const { siteConfig } = await import("../app/site-config.ts");
  const [html, js, data] = await Promise.all([read("index.html"), read("app.js"), read("data.json")]);
  const everything = html + js + data;
  assert.doesNotMatch(everything, /example-abwebstudio|Placeholder contact|Prototype for design review|to be confirmed|\(placeholder\)/i);
  assert.doesNotMatch(html, /placeholder/i);
  // The static fallbacks in the HTML must equal the configured values.
  assert.ok(html.includes(siteConfig.email), "email fallback matches siteConfig");
  assert.ok(html.includes(siteConfig.phoneDisplay), "phone fallback matches siteConfig");
  assert.ok(html.includes(`tel:${siteConfig.phoneInternational}`));
  const { site } = JSON.parse(data);
  assert.equal(site.email, siteConfig.email);
  assert.deepEqual(site.social, siteConfig.social);
  for (const href of Object.values(site.social)) assert.match(href, /^https:\/\//);
});

test("unsupported marketing claims stay out of the copy", async () => {
  const html = await read("index.html");
  // The live site deliberately avoids unproven compliance and turnaround promises.
  assert.doesNotMatch(html, /Astro|WCAG 2\.2|within one business day|performance budgets/i);
});

test("enquiry form offers only services the live /api/contact route accepts", async () => {
  const { contactServices } = await import("../app/contact-options.ts");
  const html = await read("index.html");
  const discuss = [...html.matchAll(/data-discuss="([^"]+)"/g)].map(([, value]) => value.replaceAll("&amp;", "&"));
  assert.ok(discuss.length > 0);
  for (const value of discuss) assert.ok(contactServices.includes(value), `"${value}" is not an accepted service`);
  assert.deepEqual(JSON.parse(await read("data.json")).services, [...contactServices]);
  const js = await read("app.js");
  assert.match(js, /fetch\("\/api\/contact"/);
  assert.match(js, /services: \[select\.value\]/);
  assert.match(js, /company: \$\("#company"\)\.value/);
  assert.match(js, /submissionId/);
  // A send that failed must never be presented as a success.
  assert.doesNotMatch(js, /setTimeout\([^)]*success/);
});

test("a project is only labelled live when today's check reached it or the owner confirmed it", async () => {
  const data = JSON.parse(await read("data.json"));
  const check = JSON.parse(await read("link-check.json"));
  const entries = new Map(check.results.map((entry) => [entry.url, entry]));
  for (const project of data.projects) {
    if (project.statusLabel !== "Live website") continue;
    const entry = entries.get(project.url);
    assert.ok(entry.status === 200 || entry.ownerConfirmedLive === true, `${project.name} is not verified live`);
    // Owner-confirmed entries that the check could not reach must say so.
    if (entry.status !== 200) assert.match(entry.note, /NOT independently verified/);
  }
});

test("project imagery is real and sized, with no abstract placeholder art", async () => {
  const [data, js] = await Promise.all([read("data.json").then(JSON.parse), read("app.js")]);
  assert.doesNotMatch(js, /createElementNS|Abstract placeholder/i);
  for (const project of data.projects) {
    assert.ok(project.image.width > 0 && project.image.height > 0, `${project.name} image has dimensions`);
    assert.ok(project.image.alt.length > 20, `${project.name} image has descriptive alt text`);
    const file = new URL(`../public${project.image.src}`, import.meta.url);
    assert.ok((await stat(file)).size > 0, `${project.name} image exists`);
  }
});

test("the prototype loads no third-party hosts, matching the production CSP", async () => {
  const [html, css, js] = await Promise.all([read("index.html"), read("styles.css"), read("app.js")]);
  assert.doesNotMatch(html + css + js, /fonts\.googleapis|fonts\.gstatic/);
  for (const [, host] of (html + css).matchAll(/https?:\/\/([^/"')\s]+)/g)) {
    assert.equal(host, "www.abwebstudio.com.au", `unexpected host ${host}`);
  }
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
});

test("colour tokens meet WCAG AA contrast for text pairs", async () => {
  const css = await read("styles.css");
  const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`))?.[1];
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const pairs = [
    ["fg", "bg"], ["fg", "surface"], ["fg-2", "surface"], ["muted", "bg"], ["muted", "surface"], ["muted", "surface-warm"],
    ["meta", "bg"], ["meta", "surface"], ["accent", "bg"], ["accent", "surface"], ["accent-on", "accent"],
    ["accent-on", "accent-hover"], ["fg", "ruby"], ["danger", "bg"], ["danger", "surface"], ["success", "surface"],
  ];
  for (const [fg, bg] of pairs) {
    const value = ratio(token(fg), token(bg));
    assert.ok(value >= 4.5, `--${fg} on --${bg} is ${value.toFixed(2)}:1, below 4.5:1`);
  }
});
