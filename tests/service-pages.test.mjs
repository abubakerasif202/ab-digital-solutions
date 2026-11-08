import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { findProject } from "../app/project-data.ts";
import { contactServiceKeys, contactServices } from "../app/contact-options.ts";
import { findService, serviceContactHref, serviceDelivery, servicePages } from "../app/services/service-data.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("there are seven services, including the custom software page, with unique slugs", () => {
  assert.equal(servicePages.length, 7);
  assert.equal(new Set(servicePages.map((service) => service.slug)).size, 7);
  const custom = findService("custom-software-business-systems");
  assert.equal(custom?.h1, "Custom Business Software & Web Applications");
  assert.equal(custom?.ctaLabel, "Scope Your System");
  assert.equal(serviceContactHref(custom), "/contact?service=custom-software");
  assert.equal(custom.benefits.length, 4);
  assert.equal(serviceDelivery[custom.slug].steps.length, 4);
});

test("every service shows one primary and two supporting live projects that exist", () => {
  for (const service of servicePages) {
    assert.equal(service.proof.length, 3, service.slug);
    assert.equal(service.proof[0].slug, service.featuredProject, `${service.slug} primary drives the hero`);
    assert.equal(new Set(service.proof.map((proof) => proof.slug)).size, 3, `${service.slug} repeats a project`);
    for (const proof of service.proof) assert.ok(findProject(proof.slug), `${service.slug}: unknown project ${proof.slug}`);
  }
  assert.equal(findService("website-maintenance").proof[0].slug, "247-truck-tyre-services");
});

test("service FAQs are unique across the site and the boilerplate is gone", () => {
  const questions = servicePages.flatMap((service) => service.faqs.map((faq) => faq.question));
  const answers = servicePages.flatMap((service) => service.faqs.map((faq) => faq.answer));
  assert.equal(questions.length, 28);
  assert.equal(new Set(questions).size, 28);
  assert.equal(new Set(answers).size, 28);
  assert.ok(!questions.includes("What happens before work begins?"));
});

test("SEO titles carry Sydney intent and each page has a description", () => {
  for (const service of servicePages) {
    assert.match(service.seoTitle, /Sydney/, service.slug);
    assert.match(service.seoTitle, /AB Web Studio$/, service.slug);
    assert.ok(service.seoDescription.length > 80 && service.seoDescription.length <= 200, service.slug);
  }
});

test("service CTAs pass a contact key that the enquiry form understands", () => {
  const validValues = new Set(contactServices);
  for (const service of servicePages) {
    assert.ok(Object.hasOwn(contactServiceKeys, service.contactKey), service.slug);
    assert.ok(validValues.has(contactServiceKeys[service.contactKey]), service.slug);
  }
  assert.equal(new Set(servicePages.map((service) => service.contactKey)).size, 7);
});

test("service page template uses service CTAs, not the about funnel, and absolute titles", async () => {
  const page = await read("../app/services/[slug]/page.tsx");
  assert.doesNotMatch(page, /Meet the Sydney studio/);
  assert.match(page, /Discuss your \{service\.title\} project/);
  assert.match(page, /title: \{ absolute: seoTitle \}/);
  assert.match(page, /"@type": "City", name: "Sydney"/);
  assert.match(page, /email: siteConfig\.email/);
});

test("the enquiry form resolves ?service= keys without useSearchParams", async () => {
  const form = await read("../app/components/ContactForm.tsx");
  assert.match(form, /contactServiceKeys/);
  assert.doesNotMatch(form, /useSearchParams/);
});

test("American spelling is not used in project or service copy", async () => {
  const [projects, services] = await Promise.all([read("../app/project-data.ts"), read("../app/services/service-data.ts")]);
  for (const source of [projects, services]) assert.doesNotMatch(source, /specialized|optimized|organization\b/i);
  assert.match(projects, /specialised concrete placement/);
});
