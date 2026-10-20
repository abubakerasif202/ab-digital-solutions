import assert from "node:assert/strict";
import test from "node:test";
import { findProject, projectDestinationLabel, projectVisitLabel, projects } from "../app/project-data.ts";

test("portfolio retains every case study and distinguishes external destination types", () => {
  assert.equal(new Set(projects.map(({ slug }) => slug)).size, projects.length);
  assert.ok(findProject("milestone-renovate"));
  assert.ok(findProject("milestone-development"));
  assert.notEqual(findProject("milestone-renovate").url, findProject("milestone-development").url);
  const jufaja = findProject("jufaja-homes");
  const gala = findProject("gala-rentals");
  const software = findProject("247-inventory-system");
  assert.equal(projectDestinationLabel(jufaja), "Hosted website showcase");
  assert.equal(projectVisitLabel(jufaja), "View Website Showcase");
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
  assert.equal(projects.length, 16);
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
