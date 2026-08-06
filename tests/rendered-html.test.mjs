import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("homepage exposes content directly instead of using an iframe", async () => {
  const [page, homepage] = await Promise.all([
    read("../app/page.tsx"),
    read("../app/agency-home.tsx"),
  ]);

  assert.doesNotMatch(page, /<iframe\b/i);
  assert.match(homepage, /Websites that make your business/);
  assert.match(homepage, /id="contact"/);
  assert.match(homepage, /aria-roledescription="carousel"/);
  assert.match(homepage, /prefers-reduced-motion/);
});

test("portfolio contains every required live project", async () => {
  const projects = await read("../app/project-data.ts");
  const requiredProjects = [
    "https://www.maplerentals.com.au/",
    "https://www.galarentals.com.au/",
    "https://zqremovals.au/",
    "https://www.decentdevelopment.com.au/",
    "https://milestonedevelopment.com.au/",
    "https://4-point-concrete-design.vercel.app/",
    "https://www.1stclassexpress.com.au/",
  ];

  for (const project of requiredProjects) assert.match(projects, new RegExp(project.replaceAll(".", "\\.")));
});

test("every project ships a real preview image and a View Live Website action", async () => {
  const [projects, homepage, artwork] = await Promise.all([
    read("../app/project-data.ts"),
    read("../app/agency-home.tsx"),
    read("../app/project-artwork.tsx"),
  ]);

  const imageNames = [...projects.matchAll(/\$\{assetBase\}\/([\w.-]+)/g)].map(([, name]) => name);
  assert.equal(imageNames.length, 7);
  assert.ok(imageNames.includes("ab-portfolio-1st-class-express.jpg"));
  assert.doesNotMatch(projects, /image: null/);

  const { statSync } = await import("node:fs");
  for (const name of imageNames) {
    const asset = new URL(`../public/site/ab-digital-premium/assets/${name}`, import.meta.url);
    assert.ok(statSync(asset).size > 0, `${name} is missing`);
  }

  assert.match(homepage, /className="project-cta">View Live Website/);
  assert.match(homepage, /target="_blank"[\s\S]{0,80}rel="noopener noreferrer"/);
  assert.doesNotMatch(artwork, /project-cover/);
});

test("homepage project count reflects the seven live projects", async () => {
  const homepage = await read("../app/agency-home.tsx");
  assert.match(homepage, /View all seven projects/);
  assert.match(homepage, /Seven responsive digital experiences/);
  assert.doesNotMatch(await read("../app/globals.css"), /grid-template-columns: repeat\(6, 1fr\)/);
});

test("reviewed design issues remain remediated", async () => {
  const [homepage, chrome, servicePage, styles] = await Promise.all([
    read("../app/agency-home.tsx"),
    read("../app/site-chrome.tsx"),
    read("../app/services/[slug]/page.tsx"),
    read("../app/globals.css"),
  ]);

  assert.doesNotMatch(homepage, /hero-brand-art/);
  assert.match(homepage, /className="client-proof"/);
  assert.match(homepage, /<a[\s\S]*className="service-card"/);
  assert.match(chrome, /ab-logo-mark\.png/);
  assert.match(chrome, /AB Digital Solutions/);
  assert.match(servicePage, /<SiteHeader/);
  assert.match(servicePage, /<SiteFooter/);
  assert.match(servicePage, /Frequently asked questions/);
  assert.match(servicePage, /Related services/);

  assert.match(styles, /\.button-primary\s*\{[\s\S]*?color: var\(--ink\)/);
  assert.match(styles, /\.slider-controls button\s*\{[\s\S]*?min-width: 44px;[\s\S]*?height: 44px;/);
  assert.match(styles, /\.slider-tabs button\s*\{[\s\S]*?min-height: 44px;/);
  assert.match(styles, /\.hero-marquee\s*\{[\s\S]*?color: var\(--ink\)/);
  assert.doesNotMatch(styles, /\.slider-controls \.pause-control\s*\{\s*display: none;/);
  assert.match(styles, /--type-action: 0\.875rem/);
  assert.match(styles, /\.site-nav a\s*\{[\s\S]*?font-size: var\(--type-action\)/);
  assert.doesNotMatch(styles, /font-size:\s*0\.[56]\d*rem/);
});

test("mobile navigation keeps keyboard focus within its open menu", async () => {
  const chrome = await read("../app/site-chrome.tsx");

  assert.match(chrome, /const navRef = useRef<HTMLElement>\(null\)/);
  assert.match(chrome, /event\.key !== "Tab" \|\| !menuOpen \|\| !navRef\.current/);
  assert.match(chrome, /const focusableItems = \[menuButtonRef\.current, \.\.\.navItems\]\.filter/);
  assert.match(chrome, /event\.preventDefault\(\);\s*lastItem\.focus\(\)/);
  assert.match(chrome, /event\.preventDefault\(\);\s*firstItem\.focus\(\)/);
  assert.match(chrome, /if \(menuOpen\) navRef\.current\?\.querySelector<HTMLElement>\("a"\)\?\.focus\(\)/);
  assert.match(chrome, /ref=\{navRef\}/);
});

test("SEO routes and metadata are configured", async () => {
  const [layout, robots, sitemap, llms] = await Promise.all([
    read("../app/layout.tsx"),
    read("../app/robots.ts"),
    read("../app/sitemap.ts"),
    read("../public/llms.txt"),
  ]);

  assert.match(layout, /alternates: \{ canonical: "\/" \}/);
  assert.match(layout, /application\/ld\+json/);
  assert.match(layout, /ProfessionalService/);
  assert.match(robots, /sitemap\.xml/);
  assert.match(sitemap, /priority: 1/);
  assert.match(sitemap, /servicePages/);
  assert.match(sitemap, /\/privacy/);
  assert.match(llms, /^# AB Digital Solutions/m);
  assert.match(llms, /https:\/\/www\.abwebstudio\.com\.au/);
});

test("brand theme keeps gold primary accents and red secondary accents", async () => {
  const [styles, designTokens] = await Promise.all([
    read("../app/globals.css"),
    read("../opendesign/design-systems/ab-digital/colors_and_type.css"),
  ]);

  assert.match(styles, /--red: #c99732/);
  assert.match(styles, /--brand-red: #e32636/);
  assert.match(styles, /box-shadow: inset 0 2px 0 var\(--brand-red\)/);
  assert.match(styles, /\.button-primary[\s\S]*background: var\(--red\)/);
  assert.match(designTokens, /--ab-ink: #050505/);
  assert.match(designTokens, /--ab-gold: #c99732/);
  assert.match(designTokens, /--ab-display:/);
});

test("contact form posts to the protected server endpoint", async () => {
  const [homepage, route] = await Promise.all([
    read("../app/agency-home.tsx"),
    read("../app/api/contact/route.ts"),
  ]);
  assert.match(homepage, /fetch\("\/api\/contact"/);
  assert.doesNotMatch(homepage, /window\.location\.assign/);
  assert.match(route, /RESEND_API_KEY/);
  assert.match(route, /allowedOrigin/);
  assert.match(route, /withinRateLimit/);
  assert.match(route, /company/);
});

test("Vercel configuration uses the Next.js production build", async () => {
  const [rawVercelConfig, rawPackage] = await Promise.all([
    read("../vercel.json"),
    read("../package.json"),
  ]);
  const vercelConfig = JSON.parse(rawVercelConfig);
  const packageJson = JSON.parse(rawPackage);

  assert.equal(vercelConfig.framework, "nextjs");
  assert.equal(vercelConfig.installCommand, "npm ci");
  assert.equal(vercelConfig.buildCommand, "npm run build");
  assert.match(packageJson.scripts.build, /next build$/);
  assert.equal(packageJson.scripts.verify, "npm run lint && npm run typecheck && npm test");
  assert.equal(packageJson.scripts.typecheck, "bash scripts/sites-env.sh -- tsc --noEmit");
});
