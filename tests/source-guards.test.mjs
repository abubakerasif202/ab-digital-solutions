// Source-regression guards: fast assertions over source text that protect
// previously reviewed fixes from being silently reverted. Behavioral coverage
// of the contact endpoint lives in contact-route.test.mjs.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("portfolio contains every required live project", async () => {
  const projects = await read("../app/project-data.ts");
  const requiredProjects = [
    "https://adelaidewholesaletyres.com.au/",
    "https://www.247trucktyreservices.com.au/",
    "https://www.maplerentals.com.au/",
    "https://www.galarentals.com.au/",
    "https://zqremovalsadelaide.com.au/",
    "https://www.decentdevelopment.com.au/",
    "https://milestonedevelopment.com.au/",
    "https://4point-concrete-website.vercel.app/",
    "https://www.1stclassexpress.com.au/",
    "https://www.hfremovalsadelaide.com.au/",
    "https://www.aftabandsons.com.au/",
    "https://247trucktyreservices.store/",
    "https://www.jufajaconstructions.com.au/",
  ];

  for (const project of requiredProjects) assert.match(projects, new RegExp(project.replaceAll(".", "\\.")));
});

test("llms.txt stays in sync with the canonical project registry", async () => {
  const { projects } = await import("../app/project-data.ts");
  const llms = await read("../public/llms.txt");

  assert.match(llms, /See the Work index for the current project count/);
  for (const project of projects) {
    assert.ok(llms.includes(project.name), `llms.txt is missing ${project.name}`);
    assert.ok(llms.includes(project.url), `llms.txt is missing ${project.name} (${project.url})`);
  }
});

test("service featured projects resolve to canonical project slugs", async () => {
  const { servicePages } = await import("../app/services/service-data.ts");
  const { findProject } = await import("../app/project-data.ts");

  for (const service of servicePages) {
    assert.ok(
      findProject(service.featuredProject),
      `${service.slug} references unknown project slug "${service.featuredProject}"`,
    );
  }
});

test("contact form posts to the protected server endpoint", async () => {
  const [contactForm, route] = await Promise.all([
    read("../app/components/ContactForm.tsx"),
    read("../app/api/contact/route.ts"),
  ]);
  assert.match(contactForm, /fetch\("\/api\/contact"/);
  assert.match(contactForm, /method="post" action="\/api\/contact"/);
  assert.match(contactForm, /<noscript>/);
  assert.match(contactForm, /\.contact-form \.form-grid/);
  assert.match(contactForm, /mailto:\$\{siteConfig\.email\}/);
  assert.doesNotMatch(contactForm, /window\.location\.assign/);
  // The optional business field must never reuse the honeypot's name, or the
  // route would silently discard every real enquiry that fills it in.
  assert.match(contactForm, /name="business"/);
  assert.equal([...contactForm.matchAll(/name="company"/g)].length, 1);
  assert.match(contactForm, /<div className="form-trap" aria-hidden="true" style=\{\{ display: "none" \}\}>/);
  // Service chips are native inputs whose choices travel as one validated array.
  assert.match(contactForm, /type="checkbox" name="service"/);
  assert.match(contactForm, /formData\.getAll\("service"\)/);
  assert.match(route, /function selectedServices/);
  assert.match(route, /tooLong\(payload, "business", 160\)/);
  assert.match(route, /RESEND_API_KEY/);
  assert.match(route, /allowedOrigin/);
  assert.match(route, /withinRateLimit/);
  assert.match(route, /company/);
  assert.match(route, /readPayload/);
  assert.match(route, /MAX_BODY_BYTES/);
});

test("Vercel configuration uses the Next.js production build", async () => {
  const [rawVercelConfig, rawPackage, eslintConfig, nextConfig] = await Promise.all([
    read("../vercel.json"),
    read("../package.json"),
    read("../eslint.config.mjs"),
    read("../next.config.ts"),
  ]);
  const vercelConfig = JSON.parse(rawVercelConfig);
  const packageJson = JSON.parse(rawPackage);

  assert.equal(vercelConfig.framework, "nextjs");
  assert.equal(vercelConfig.installCommand, "npm ci");
  assert.equal(vercelConfig.buildCommand, "npm run build");
  assert.match(packageJson.scripts.build, /next build$/);
  assert.equal(packageJson.scripts.verify, "npm run lint && npm run typecheck && npm test");
  assert.equal(packageJson.scripts.lint, "eslint . --ignore-pattern dist --ignore-pattern .next --ignore-pattern test-results --ignore-pattern .remember");
  assert.equal(packageJson.scripts.typecheck, "node scripts/typecheck.mjs");
  assert.match(await read("../scripts/typecheck.mjs"), /next[\\/]dist[\\/]bin[\\/]next/);
  assert.match(nextConfig, /const isDevelopment = process\.env\.NODE_ENV === "development"/);
  assert.match(nextConfig, /script-src 'self' 'unsafe-inline'.*isDevelopment.*'unsafe-eval'/);
  assert.doesNotMatch(nextConfig, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  assert.match(nextConfig, /"object-src 'none'"/);
  assert.match(nextConfig, /"base-uri 'self'"/);
  assert.match(nextConfig, /"form-action 'self'"/);
  assert.match(nextConfig, /"frame-ancestors 'self'"/);
  for (const generatedDirectory of [".sites-runtime", ".agents", ".codex", ".claude"]) {
    assert.ok(eslintConfig.includes(`"${generatedDirectory}/**"`));
  }
});

test("hero content paints immediately without an intro overlay or hydration suppression", async () => {
  const [page, layout] = await Promise.all([read("../app/page.tsx"), read("../app/layout.tsx")]);
  assert.doesNotMatch(page, /IntroReveal|BrandIntro|setTimeout/);
  assert.doesNotMatch(layout, /suppressHydrationWarning/);
  assert.match(page, /AgencyHome/);
});

test("production builds do not reuse a Turbopack filesystem cache", async () => {
  // A restored build cache once deployed new HTML with a stale stylesheet.
  const nextConfig = await read("../next.config.ts");
  assert.match(nextConfig, /turbopackFileSystemCacheForBuild: false/);
});


// ---- Guards for the 2026 studio rebuild (Harbour After Dark) ----

test("homepage is server-rendered content with one heading and a registry-driven portfolio", async () => {
  const [page, homepage, ui] = await Promise.all([read("../app/page.tsx"), read("../app/agency-home.tsx"), read("../app/components/ui.tsx")]);
  assert.doesNotMatch(page + homepage, /<iframe\b/i);
  assert.doesNotMatch(homepage, /^"use client"/);
  assert.doesNotMatch(homepage, /useState|useEffect|setInterval/);
  assert.equal([...homepage.matchAll(/<h1\b/g)].length, 1);
  assert.match(homepage, /id="contact"/);
  assert.match(homepage, /\{projects\.length\} project case studies/);
  // Counts are derived, never typed in.
  assert.match(homepage, /\{used\.length\} of \{projects\.length\}/);
  assert.doesNotMatch(homepage, /\b\d+ (?:of|\/) \d+\b/);
  // Portfolio entries route through a case study, never straight to the client site.
  assert.match(ui, /href=\{`\/work\/\$\{project\.slug\}`\}/);
  assert.doesNotMatch(homepage + ui, /href=\{project\.url\}/);
  assert.match(ui, /projectDestinationLabel\(project\)/);
});

test("every project ships a real preview image and case studies open client sites safely", async () => {
  const [projects, workPage, caseStudy] = await Promise.all([read("../app/project-data.ts"), read("../app/work/page.tsx"), read("../app/work/[slug]/page.tsx")]);
  const imageNames = [...projects.matchAll(/image: `\$\{assetBase\}\/([\w.-]+)/g)].map(([, name]) => name);
  assert.equal(imageNames.length, [...projects.matchAll(/slug: "/g)].length);
  assert.doesNotMatch(projects, /image: null/);
  const { statSync } = await import("node:fs");
  for (const name of imageNames) {
    assert.ok(statSync(new URL(`../public/site/ab-digital-premium/assets/${name}`, import.meta.url)).size > 0, `${name} is missing`);
  }
  assert.doesNotMatch(workPage, /href=\{project\.url\}/);
  assert.match(workPage, /\{projects\.length\} projects/);
  assert.match(caseStudy, /href=\{project\.url\} target="_blank" rel="noopener noreferrer"/);
  assert.match(caseStudy, /opens in a new tab/);
  assert.match(caseStudy, /projectVisitLabel\(project\)/);
});

test("the 3D hero is deferred, optional on constrained devices and paused off screen", async () => {
  const [stage, scene] = await Promise.all([read("../app/components/hero/HeroStage.tsx"), read("../app/components/hero/NightDeskScene.tsx")]);
  assert.match(stage, /dynamic\(\(\) => import\("\.\/NightDeskScene"\), \{ ssr: false \}\)/);
  assert.match(stage, /prefers-reduced-motion: reduce/);
  assert.match(stage, /requestIdleCallback/);
  assert.match(stage, /max-width: 720px/);
  assert.match(stage, /connection\?\.saveData/);
  assert.match(stage, /IntersectionObserver/);
  assert.match(stage, /visibilitychange/);
  assert.match(stage, /night-desk-poster\.webp/);
  // Every scene interaction has a keyboard-reachable DOM control.
  assert.match(stage, /aria-label="Studio scene controls"/);
  assert.match(scene, /frameloop=\{active \? "always" : "never"\}/);
  assert.match(scene, /dpr=\{\[1, 1\.5\]\}/);
  assert.match(scene, /LOGO_PATHS/);
  assert.doesNotMatch(scene + await read("../app/components/hero/harbour-texture.ts"), /Math\.random/);
  const { statSync } = await import("node:fs");
  assert.ok(statSync(new URL("../public/hero/night-desk-poster.webp", import.meta.url)).size > 0);
});

test("mobile navigation traps focus, closes on Escape and restores scrolling", async () => {
  const chrome = await read("../app/site-chrome.tsx");
  assert.match(chrome, /aria-expanded=\{open\}/);
  assert.match(chrome, /aria-controls="site-nav"/);
  assert.match(chrome, /event\.key === "Escape"/);
  assert.match(chrome, /menuButtonRef\.current\?\.focus\(\)/);
  assert.match(chrome, /event\.preventDefault\(\);\s*last\.focus\(\)/);
  assert.match(chrome, /event\.preventDefault\(\);\s*first\.focus\(\)/);
  assert.match(chrome, /document\.body\.style\.overflow = previousOverflow/);
  assert.match(chrome, /className="skip-link" href="#main-content"/);
});

test("service pages keep their structure, FAQ schema and enquiry routing", async () => {
  const [servicePage, index, form] = await Promise.all([read("../app/services/[slug]/page.tsx"), read("../app/services/page.tsx"), read("../app/components/ContactForm.tsx")]);
  assert.match(servicePage, /Frequently asked questions/);
  assert.match(servicePage, /"@type": "FAQPage"/);
  assert.doesNotMatch(servicePage, /offers:\s*\{/);
  assert.match(servicePage, /images: \[\{/);
  assert.match(servicePage, /Related services/);
  assert.match(servicePage, /serviceContactHref\(service\)/);
  assert.match(index, /servicePages\.map/);
  assert.match(form, /fetch\("\/api\/contact"/);
  // Success is only shown after the API confirms delivery.
  assert.match(form, /result\.ok !== true/);
});

test("design system: central tokens, self-hosted fonts, motion and contrast safeguards", async () => {
  const [styles, layout, reveal] = await Promise.all([read("../app/styles/site.css"), read("../app/layout.tsx"), read("../app/components/RevealObserver.tsx")]);
  assert.match(styles, /@import "tailwindcss" source\(none\);/);
  assert.match(styles, /--ruby: #d21736;/);
  assert.match(styles, /\.button-primary \{ background: var\(--ruby\); color: #fff; \}/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /:focus-visible \{ outline: 2px solid/);
  // Reveal content is hidden only once the head script confirms motion is welcome.
  assert.match(styles, /html\[data-motion="on"\] \[data-reveal\] \{ opacity: 0;/);
  assert.match(reveal, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(styles, /font-size:\s*0\.[56]\d*rem/);
  assert.match(layout, /from "next\/font\/google"/);
  assert.doesNotMatch(layout, /fonts\.googleapis\.com/);
  assert.match(layout, /import "\.\/styles\/site\.css";/);
  assert.equal([...layout.matchAll(/import "\.[^"]+\.css";/g)].length, 1);
});
