// Generates opendesign/luxury-homepage/data.json from the canonical sources:
// app/project-data.ts (projects), app/site-config.ts (contact details, social
// profiles) and app/contact-options.ts (the services the enquiry API accepts).
//
// The standalone prototype never hand-copies these values, so it cannot drift
// from the live site. A node:test guard re-runs buildHomepageData() and fails
// when the committed data.json is stale.
//
// Run: npm run opendesign:data
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const prototypeDir = path.join(root, "opendesign", "luxury-homepage");

export async function buildHomepageData() {
  const [{ projects, projectDestinationLabel, projectVisitLabel, formatCategory }, { siteConfig, assetBase }, { contactServices }] =
    await Promise.all([
      import("../app/project-data.ts"),
      import("../app/site-config.ts"),
      import("../app/contact-options.ts"),
    ]);
  const linkCheck = JSON.parse(await readFile(path.join(prototypeDir, "link-check.json"), "utf8"));
  // Live means today's read-only check reached the site, or the owner confirmed it (recorded in link-check.json).
  const liveUrls = new Set(linkCheck.results.filter((entry) => entry.status === 200 || entry.ownerConfirmedLive === true).map((entry) => entry.url));

  const sectors = [];
  const items = [];
  for (const project of projects) {
    if (!sectors.includes(project.sector)) sectors.push(project.sector);
    // Public asset paths are served from /site/... by Next and by the prototype server.
    const file = project.image.replace(`${assetBase}/`, "");
    const meta = await sharp(path.join(root, "public", "site", "ab-digital-premium", "assets", file)).metadata();
    const reachable = liveUrls.has(project.url);
    const registryLabel = projectDestinationLabel(project);
    items.push({
      slug: project.slug,
      name: project.name,
      sector: project.sector,
      category: formatCategory(project.category),
      description: project.description,
      solution: project.solution,
      keyFeatures: [...project.keyFeatures],
      techStack: [...project.techStack],
      url: project.url,
      displayUrl: project.displayUrl,
      statusLabel: registryLabel === "Live website" && !reachable ? "Case study" : registryLabel,
      visitLabel: projectVisitLabel(project),
      isSoftware: project.kind === "software",
      caseStudyUrl: `${siteConfig.url}/work/${project.slug}`,
      image: { src: project.image, width: meta.width, height: meta.height, alt: project.alt },
    });
  }

  return {
    generatedFrom: ["app/project-data.ts", "app/site-config.ts", "app/contact-options.ts", "opendesign/luxury-homepage/link-check.json"],
    linkCheckedAt: linkCheck.checkedAt,
    site: {
      name: siteConfig.name,
      url: siteConfig.url,
      email: siteConfig.email,
      phoneDisplay: siteConfig.phoneDisplay,
      phoneInternational: siteConfig.phoneInternational,
      location: siteConfig.location,
      social: siteConfig.social,
    },
    services: [...contactServices],
    sectors,
    projects: items,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = await buildHomepageData();
  await writeFile(path.join(prototypeDir, "data.json"), `${JSON.stringify(data, null, 2)}\n`);
  console.log(`data.json written: ${data.projects.length} projects, ${data.sectors.length} sectors`);
}
