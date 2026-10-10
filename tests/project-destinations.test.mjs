import assert from "node:assert/strict";
import test from "node:test";
import { findProject, projectDestinationLabel, projectVisitLabel, projects } from "../app/project-data.ts";

test("portfolio retains every case study and distinguishes external destination types", () => {
  assert.equal(projects.length, 14);
  assert.equal(new Set(projects.map(({ slug }) => slug)).size, 14);
  const jufaja = findProject("jufaja-homes");
  const gala = findProject("gala-rentals");
  const software = findProject("247-inventory-system");
  assert.equal(projectDestinationLabel(jufaja), "Hosted website showcase");
  assert.equal(projectVisitLabel(jufaja), "View Website Showcase");
  assert.equal(projectDestinationLabel(gala), "Website currently unavailable");
  assert.equal(projectVisitLabel(gala), "Check Project Website");
  assert.equal(projectDestinationLabel(software), "Staff-access system");
  assert.equal(projectVisitLabel(software), "View System");
  assert.equal(projectDestinationLabel(findProject("maple-rentals")), "Live website");
});

test("portfolio links use the verified redirect destinations", () => {
  assert.equal(findProject("zq-removals").url, "https://zqremovalsadelaide.com.au/");
  assert.equal(findProject("hf-removals-adelaide").url, "https://www.hfremovalsadelaide.com.au/");
});
