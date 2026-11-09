import assert from "node:assert/strict";
import test from "node:test";
import { findProject, projectDestinationLabel, projectVisitLabel, projects } from "../app/project-data.ts";

test("portfolio retains every case study and distinguishes external destination types", () => {
  assert.equal(new Set(projects.map(({ slug }) => slug)).size, projects.length);
  assert.ok(findProject("milestone-renovate"));
  assert.ok(findProject("milestone-development"));
  assert.notEqual(findProject("milestone-renovate").url, findProject("milestone-development").url);
  const jufaja = findProject("jufaja-homes");
  const showcase = findProject("4-point-concrete");
  const gala = findProject("gala-rentals");
  const software = findProject("247-inventory-system");
  // Jufaja moved from a Vercel preview host to its own canonical domain.
  assert.equal(jufaja.url, "https://www.jufajaconstructions.com.au/");
  assert.equal(jufaja.displayUrl, "jufajaconstructions.com.au");
  assert.equal(projectDestinationLabel(jufaja), "Live website");
  assert.equal(projectVisitLabel(jufaja), "View Live Website");
  assert.equal(projectDestinationLabel(showcase), "Hosted website showcase");
  assert.equal(projectVisitLabel(showcase), "View Website Showcase");
  assert.equal(projectDestinationLabel(gala), "Live website");
  assert.equal(projectVisitLabel(gala), "View Live Website");
  assert.equal(projectDestinationLabel(software), "Staff-access system");
  assert.equal(projectVisitLabel(software), "View Staff Sign-in");
  assert.equal(projectDestinationLabel(findProject("maple-rentals")), "Live website");
});

test("portfolio links use the verified redirect destinations", () => {
  assert.equal(findProject("zq-removals").url, "https://zqremovalsadelaide.com.au/");
  assert.equal(findProject("hf-removals-adelaide").url, "https://www.hfremovalsadelaide.com.au/");
});

test("destination helpers retain a graceful unavailable-site state", () => {
  const project = { ...findProject("gala-rentals"), destination: "unavailable" };
  assert.equal(projectDestinationLabel(project), "Website currently unavailable");
  assert.equal(projectVisitLabel(project), "Check Project Website");
});

test("Fresh Stop is the approved sixteenth project on its published custom domain", () => {
  const project = findProject("fresh-stop");
  assert.equal(projects.length, 19);
  assert.equal(projects[15], project);
  assert.equal(project.url, "https://www.freshstop.com.au/");
  assert.equal(project.displayUrl, "freshstop.com.au");
  assert.equal(projectDestinationLabel(project), "Live website");
  assert.equal(projectVisitLabel(project), "View Live Website");
  assert.equal(project.image, "/site/ab-digital-premium/assets/ab-portfolio-fresh-stop.jpg");
  for (const tech of ["Next.js", "React", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL"]) {
    assert.ok(project.techStack.includes(tech));
  }
  assert.match(project.solution, /enquiry rather than a confirmed order/);
  assert.match(project.solution, /email and WhatsApp/);
  assert.doesNotMatch(JSON.stringify(project), /fresh-stop\.vercel\.app|Stripe|inventory synchronisation/i);
});

test("On Call Trailers is listed as a live website with its real domain and preview image", () => {
  const project = findProject("on-call-trailers");
  assert.ok(project);
  assert.equal(project.url, "https://oncalltrailers.com.au/");
  assert.equal(project.displayUrl, "oncalltrailers.com.au");
  assert.equal(projectDestinationLabel(project), "Live website");
  assert.equal(project.image, "/site/ab-digital-premium/assets/ab-portfolio-on-call-trailers.webp");
});

test("Wild Pest Solutions publishes a real screenshot gallery and NSW case study", async () => {
  const { existsSync } = await import("node:fs");
  const project = findProject("wild-pest-solutions");
  assert.equal(project.url, "https://wildpestsolutions.com.au/");
  assert.equal(project.region, "New South Wales, Australia");
  assert.equal(project.headline, "Digital Experiences Built for the Wild.");
  assert.equal(projectVisitLabel(project), "Visit Live Website");
  assert.equal(project.gallery.length, 3);
  for (const shot of [{ src: project.image }, ...project.gallery]) {
    assert.ok(existsSync(`public${shot.src}`), shot.src);
  }
  assert.equal(project.gallery[0].aspectRatio, "390 / 844");
  assert.doesNotMatch(JSON.stringify(project), /conversion uplift|award-winning|testimonial/i);
});

test("Pept Up Labs records catalogue capabilities without unverified outcomes", () => {
  const project = findProject("pept-up-labs");
  assert.equal(project.url, "https://peptuplabs.com.au/");
  assert.equal(projectVisitLabel(project), "Visit Live Website");
  assert.match(project.solution, /laboratory research/);
  assert.doesNotMatch(project.solution, /proven efficacy|increased conversions|certified purity/i);
});
