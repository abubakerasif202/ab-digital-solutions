import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import { projects } from "../app/project-data.ts";
import { studioProjects } from "../app/studio/studio-data.ts";
import { BUDGET_OPTIONS, contactServiceKeys, contactServices } from "../app/contact-options.ts";
import { serviceContactHref, servicePages } from "../app/services/service-data.ts";

const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("all 19 project records are complete and indexed in canonical order", () => {
  assert.equal(projects.length, 19);
  assert.equal(new Set(projects.map(({ slug }) => slug)).size, projects.length);
  assert.deepEqual(studioProjects.map(({ slug }) => slug), projects.map(({ slug }) => slug));
  for (const [index, project] of projects.entries()) {
    assert.match(project.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `project ${index + 1}`);
    assert.ok(project.name.trim(), project.slug);
    assert.ok(project.category.trim() && project.sector.trim(), project.slug);
    assert.ok(project.displayUrl.trim() && project.url.startsWith("https://"), project.slug);
    assert.ok(project.image.trim(), project.slug);
    assert.ok(project.alt.trim().length >= 20, project.slug);
    assert.doesNotMatch(project.alt.trim(), /(?:\.\.\.|[,.])$/, project.slug);
    assert.ok(project.techStack.length > 0 && project.techStack.every((value) => value.trim()), project.slug);
    assert.equal(String(index + 1).padStart(2, "0"), `0${index + 1}`.slice(-2));
  }
  assert.equal(projects[0].slug, "jufaja-homes");
  assert.deepEqual(projects.slice(-3).map(({ slug }) => slug), [
    "wild-pest-solutions", "pept-up-labs", "on-call-trailers",
  ]);
});

test("case study previous/next links form one complete 19-project ring", async () => {
  const route = await read("../app/work/[slug]/page.tsx");
  assert.match(route, /projects\.findIndex\(\(p\) => p\.slug === project\.slug\)/);
  assert.match(route, /projects\[\(currentIndex \+ 1\) % projects\.length\]/);
  assert.match(route, /projects\[\(currentIndex - 1 \+ projects\.length\) % projects\.length\]/);
  for (let index = 0; index < projects.length; index++) {
    const next = projects[(index + 1) % projects.length];
    const previous = projects[(index - 1 + projects.length) % projects.length];
    assert.equal(projects[(projects.indexOf(next) - 1 + projects.length) % projects.length], projects[index]);
    assert.equal(projects[(projects.indexOf(previous) + 1) % projects.length], projects[index]);
  }
  assert.equal(projects.at(-1).slug, "on-call-trailers");
  assert.equal(projects[0].slug, "jufaja-homes");
});

test("portfolio index, studio and about derive projects from the registry", async () => {
  const [work, studio, about, home] = await Promise.all([
    read("../app/components/WorkIndexBody.tsx"),
    read("../app/studio/studio-data.ts"),
    read("../app/about/page.tsx"),
    read("../app/agency-home.tsx"),
  ]);
  assert.match(work, /const visibleProjects = filter === ALL_SECTORS\s*\? projects/);
  assert.match(work, /projects\.length/);
  assert.match(work, /project\.sector/);
  assert.match(work, /project\.techStack\.map/);
  assert.match(work, /View case study/);
  assert.match(studio, /projects\.map/);
  assert.match(about, /projects\.length/);
  assert.match(home, /projects\.length/);
  const first = projects[0];
  assert.equal(first.displayUrl, "jufajaconstructions.com.au");
  assert.equal(first.url, "https://www.jufajaconstructions.com.au/");
  assert.notEqual(first.destination, "hosted-showcase");
});

test("all seven SEO-named services use one registry across the hub and footer", async () => {
  assert.equal(servicePages.length, 7);
  assert.equal(new Set(servicePages.map(({ slug }) => slug)).size, 7);
  assert.deepEqual(servicePages.map(({ title }) => title), [
    "Web Design Sydney",
    "E-commerce Website Development",
    "SEO & Local Visibility",
    "Branding & Website Content",
    "Digital Marketing",
    "Website Maintenance & Support",
    "Custom Software & Business Systems",
  ]);
  const [hub, footer, layout, header] = await Promise.all([
    read("../app/services/page.tsx"),
    read("../app/site-footer.tsx"),
    read("../app/layout.tsx"),
    read("../app/site-chrome.tsx"),
  ]);
  assert.match(hub, /servicePages\.map/);
  assert.match(footer, /servicePages\.map/);
  assert.match(layout, /servicePages\.map/);
  for (const label of ["Work", "Services", "Virtual Studio", "Process", "About", "Contact"]) {
    assert.ok(header.includes(`>${label}</Link>`), label);
  }
  for (const platform of ["WhatsApp", "LinkedIn", "GitHub", "Facebook", "Instagram"]) {
    assert.ok(footer.includes(platform), platform);
  }
  assert.match(header, /aria-hidden=\{ctaShown \? undefined : true\}/);
  assert.match(header, /tabIndex=\{ctaShown \? undefined : -1\}/);
});

test("both enquiry routes and API use exactly the same allowed budget values", async () => {
  assert.deepEqual([...BUDGET_OPTIONS], [
    "$2,000\u2013$4,000",
    "$4,000\u2013$8,000",
    "$8,000\u2013$15,000",
    "$15,000+",
    "Not sure yet",
  ]);
  const [form, home, contact, route] = await Promise.all([
    read("../app/components/ContactForm.tsx"),
    read("../app/agency-home.tsx"),
    read("../app/contact/page.tsx"),
    read("../app/api/contact/route.ts"),
  ]);
  assert.match(home, /<ContactForm\s*\/>/);
  assert.match(contact, /<ContactForm titleAs="h2"\s*\/>/);
  assert.match(form, /BUDGET_OPTIONS\.map/);
  assert.match(route, /\.\.\.BUDGET_OPTIONS/);
  assert.equal(contactServices.length, 7);
  for (const service of servicePages) {
    assert.equal(contactServiceKeys[service.slug], contactServiceKeys[service.contactKey]);
    assert.equal(serviceContactHref(service), `/contact?service=${service.slug}`);
  }
});

test("obsolete public email and legacy budget labels do not survive in source", async () => {
  async function walk(folderUrl) {
    const found = [];
    for (const item of await readdir(folderUrl, { withFileTypes: true })) {
      if (item.isDirectory()) found.push(...await walk(new URL(`${item.name}/`, folderUrl)));
      else if (/\.(?:ts|tsx|js|jsx)$/.test(item.name)) found.push(new URL(item.name, folderUrl));
    }
    return found;
  }
  for (const file of await walk(new URL("../app/", import.meta.url))) {
    const content = await readFile(file, "utf8");
    assert.doesNotMatch(content, /admin@abwebstudio\.com\.au|Under \$1,500|\$1,500\u2013\$3,000/, file.pathname);
  }
});

test("breadcrumb templates name every ListItem and service templates include FAQs", async () => {
  const paths = [
    "../app/work/page.tsx", "../app/work/[slug]/page.tsx",
    "../app/services/page.tsx", "../app/services/[slug]/page.tsx",
    "../app/about/page.tsx", "../app/contact/page.tsx",
    "../app/privacy/page.tsx",
  ];
  for (const path of paths) {
    const source = await read(path);
    assert.match(source, /"@type": "BreadcrumbList"/, path);
    const listItems = [...source.matchAll(/"@type":\s*"ListItem"/g)];
    assert.ok(listItems.length > 0, path);
    for (const item of listItems) {
      const next = source.slice(item.index, item.index + 160);
      assert.match(next, /\bname:\s*(?:"[^"]+"|[\w.]+)/, path);
    }
  }
  const detail = await read("../app/services/[slug]/page.tsx");
  assert.match(detail, /"@type": "FAQPage"/);
  assert.match(detail, /name: question/);
});
