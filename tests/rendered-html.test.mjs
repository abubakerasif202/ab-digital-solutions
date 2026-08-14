import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("homepage exposes content directly instead of using an iframe", async () => {
  const [page, homepage, showcase, heroExperience] = await Promise.all([
    read("../app/page.tsx"),
    read("../app/agency-home.tsx"),
    read("../app/components/ProjectShowcase.tsx"),
    read("../app/components/Hero3DExperience.tsx"),
  ]);

  assert.doesNotMatch(page, /<iframe\b/i);
  assert.match(homepage, /Websites that make your business/);
  assert.match(homepage, /id="contact"/);
  assert.match(showcase, /aria-roledescription="carousel"/);
  assert.match(heroExperience, /prefers-reduced-motion/);
  assert.doesNotMatch(homepage, /^"use client"/);
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

test("every project ships a real preview image and routes visitors through a case study", async () => {
  const [projects, homepage, artwork, workPage, caseStudy] = await Promise.all([
    read("../app/project-data.ts"),
    read("../app/agency-home.tsx"),
    read("../app/project-artwork.tsx"),
    read("../app/work/page.tsx"),
    read("../app/work/[slug]/page.tsx"),
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

  assert.match(homepage, /className="project-cta">View Case Study/);
  assert.match(homepage, /href=\{`\/work\/\$\{project\.slug\}`\}/);
  assert.doesNotMatch(homepage, /href=\{project\.url\}/);
  assert.doesNotMatch(workPage, /href=\{project\.url\}/);
  assert.match(caseStudy, /href=\{project\.url\}[\s\S]{0,120}target="_blank"[\s\S]{0,120}rel="noopener noreferrer"/);
  assert.match(caseStudy, /opens in a new tab/);
  assert.doesNotMatch(artwork, /project-cover/);
});

test("Three.js is delayed, constrained on smaller devices and paused off screen", async () => {
  const [experience, canvas] = await Promise.all([
    read("../app/components/Hero3DExperience.tsx"),
    read("../app/components/Hero3DCanvas.tsx"),
  ]);
  assert.match(experience, /requestIdleCallback/);
  assert.match(experience, /max-width: 540px/);
  assert.match(experience, /connection\?\.saveData/);
  assert.match(canvas, /IntersectionObserver/);
  assert.match(canvas, /visibilitychange/);
  assert.match(canvas, /cancelAnimationFrame/);
  assert.match(canvas, /visibilityObserver\.disconnect/);
  assert.match(canvas, /renderer\.forceContextLoss\(\)/);
  assert.match(canvas, /Math\.min\(window\.devicePixelRatio, 1\.5\)/);
  assert.match(canvas, /\.dispose\(\)/);
  assert.match(canvas, /pointerEvents: "none"/);
});

test("homepage interactive work is isolated and pauses when hidden", async () => {
  const [homepage, showcase, contact] = await Promise.all([
    read("../app/agency-home.tsx"),
    read("../app/components/ProjectShowcase.tsx"),
    read("../app/components/ContactForm.tsx"),
  ]);

  assert.doesNotMatch(homepage, /useState|useEffect|setInterval/);
  assert.match(showcase, /IntersectionObserver/);
  assert.match(showcase, /document\.visibilityState/);
  assert.match(showcase, /\[activeSlide, nextSlide\]\.map/);
  assert.match(showcase, /window\.clearInterval/);
  assert.match(contact, /fetch\("\/api\/contact"/);
});

test("homepage project count reflects the seven live projects", async () => {
  const homepage = await read("../app/agency-home.tsx");
  assert.match(homepage, /Explore seven live websites/);
  assert.match(homepage, /Seven responsive digital experiences/);
  assert.doesNotMatch(await read("../app/globals.css"), /grid-template-columns: repeat\(6, 1fr\)/);
});

test("reviewed design issues remain remediated", async () => {
  const [homepage, showcase, chrome, servicePage, styles] = await Promise.all([
    read("../app/agency-home.tsx"),
    read("../app/components/ProjectShowcase.tsx"),
    read("../app/site-chrome.tsx"),
    read("../app/services/[slug]/page.tsx"),
    read("../app/globals.css"),
  ]);

  assert.doesNotMatch(homepage, /hero-brand-art/);
  assert.match(homepage, /className="client-proof"/);
  assert.match(showcase, /setCarouselEngaged\(true\)/);
  assert.match(showcase, /setSliderPauseOverride\(true\)/);
  assert.match(homepage, /<a[\s\S]*className="service-card"/);
  assert.match(chrome, /ab-logo-mark\.png/);
  assert.match(chrome, /AB Digital Solutions/);
  assert.match(servicePage, /<SiteHeader/);
  assert.match(servicePage, /<SiteFooter/);
  assert.match(servicePage, /Frequently asked questions/);
  assert.match(servicePage, /"@type": "FAQPage"/);
  assert.doesNotMatch(servicePage, /offers:\s*\{/);
  assert.match(servicePage, /images: \[\{/);
  assert.match(servicePage, /className="service-context"/);
  assert.match(servicePage, /Related services/);

  assert.match(styles, /\.button-primary\s*\{\s*background: var\(--red\);\s*color: var\(--white\);/);
  assert.match(styles, /\.slider-controls button\s*\{[\s\S]*?min-width: 44px;[\s\S]*?height: 44px;/);
  assert.match(styles, /\.slider-tabs button\s*\{[\s\S]*?min-height: 44px;/);
  assert.match(styles, /\.hero-marquee\s*\{[\s\S]*?background: var\(--red\);\s*color: var\(--white\);/);
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
  assert.match(chrome, /className="mobile-project-cta"/);
  assert.match(chrome, /window\.scrollY > window\.innerHeight \* 0\.72/);
  assert.match(chrome, /const pathname = usePathname\(\)/);
  assert.match(chrome, /const visibleConversionAreas = new Set<Element>\(\)/);
  assert.doesNotMatch(chrome, /getBoundingClientRect/);
  assert.match(chrome, /window\.requestAnimationFrame\(updateVisibility\)/);
  assert.match(chrome, /\}, \[pathname\]\);/);
});

test("SEO routes and metadata are configured", async () => {
  const [layout, robots, sitemap, llms, servicePage, services, footer] = await Promise.all([
    read("../app/layout.tsx"),
    read("../app/robots.ts"),
    read("../app/sitemap.ts"),
    read("../public/llms.txt"),
    read("../app/services/[slug]/page.tsx"),
    read("../app/services/service-data.ts"),
    read("../app/site-footer.tsx"),
  ]);

  assert.match(layout, /alternates: \{ canonical: "\/" \}/);
  assert.match(layout, /application\/ld\+json/);
  assert.match(layout, /ProfessionalService/);
  assert.match(robots, /sitemap\.xml/);
  assert.match(sitemap, /priority: 1/);
  assert.match(sitemap, /servicePages/);
  assert.match(sitemap, /\/privacy/);
  assert.doesNotMatch(sitemap, /new Date\(\)/);
  assert.match(llms, /^# AB Digital Solutions/m);
  assert.match(llms, /https:\/\/www\.abwebstudio\.com\.au/);
  assert.doesNotMatch(llms, /Typical Pricing|Vercel Edge|Proven Portfolio/);
  assert.doesNotMatch(layout, /codex-preview|preconnect.*api\.resend/);
  assert.match(servicePage, /siteName: siteConfig\.name/);
  assert.match(servicePage, /"@type": "FAQPage"/);
  assert.doesNotMatch(servicePage, /availability:|priceCurrency:/);
  assert.doesNotMatch(services, /WCAG accessibility compliance|high-converting|profitable, predictable|maintain search engine rankings|rapid technical issue resolution/);
  assert.match(footer, /servicePages\.map/);
  assert.match(footer, /footer-contact-cta/);
});

test("brand theme balances premium red and gold accents", async () => {
  const [styles, designTokens] = await Promise.all([
    read("../app/globals.css"),
    read("../opendesign/design-systems/ab-digital/colors_and_type.css"),
  ]);

  assert.match(styles, /--red: #b5121b/);
  assert.match(styles, /--brand-red: #b5121b/);
  assert.match(styles, /--gold: #d4a32f/);
  assert.match(styles, /box-shadow: inset 0 2px 0 var\(--brand-red\)/);
  assert.match(styles, /\.button-primary[\s\S]*background: var\(--red\)[\s\S]*color: var\(--white\)/);
  assert.match(styles, /\.hero-marquee[\s\S]*background: var\(--red\)[\s\S]*color: var\(--white\)/);
  assert.match(styles, /\.site-nav \.nav-cta[\s\S]*background: var\(--red\)[\s\S]*color: var\(--white\)/);
  assert.equal([...styles.matchAll(/\.service-page \.content-shell\s*\{/g)].length, 1);
  assert.match(styles, /\.mobile-project-cta\s*\{\s*display: none/);
  assert.match(designTokens, /--ab-ink: #050505/);
  assert.match(designTokens, /--ab-gold: #c99732/);
  assert.match(designTokens, /--ab-display:/);
});

test("contact form posts to the protected server endpoint", async () => {
  const [contactForm, route] = await Promise.all([
    read("../app/components/ContactForm.tsx"),
    read("../app/api/contact/route.ts"),
  ]);
  assert.match(contactForm, /fetch\("\/api\/contact"/);
  assert.doesNotMatch(contactForm, /window\.location\.assign/);
  assert.match(route, /RESEND_API_KEY/);
  assert.match(route, /allowedOrigin/);
  assert.match(route, /withinRateLimit/);
  assert.match(route, /company/);
  assert.match(route, /readPayload/);
  assert.match(route, /MAX_BODY_BYTES/);
});

test("Vercel configuration uses the Next.js production build", async () => {
  const [rawVercelConfig, rawPackage, eslintConfig] = await Promise.all([
    read("../vercel.json"),
    read("../package.json"),
    read("../eslint.config.mjs"),
  ]);
  const vercelConfig = JSON.parse(rawVercelConfig);
  const packageJson = JSON.parse(rawPackage);

  assert.equal(vercelConfig.framework, "nextjs");
  assert.equal(vercelConfig.installCommand, "npm ci");
  assert.equal(vercelConfig.buildCommand, "npm run build");
  assert.match(packageJson.scripts.build, /next build$/);
  assert.equal(packageJson.scripts.verify, "npm run lint && npm run typecheck && npm test");
  assert.equal(packageJson.scripts.typecheck, "bash scripts/sites-env.sh -- tsc --noEmit");
  for (const generatedDirectory of [".sites-runtime", ".agents", ".codex", ".claude"]) {
    assert.ok(eslintConfig.includes(`"${generatedDirectory}/**"`));
  }
});
