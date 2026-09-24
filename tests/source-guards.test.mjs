// Source-regression guards: fast assertions over source text that protect
// previously reviewed fixes from being silently reverted. Behavioral coverage
// of the contact endpoint lives in contact-route.test.mjs.
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
  assert.match(homepage, /className="hero-title"/);
  assert.match(homepage, /Websites that make/);
  assert.match(homepage, /your business/);
  assert.match(homepage, /impossible to ignore\./);
  assert.match(homepage, /id="contact"/);
  assert.match(showcase, /aria-roledescription="carousel"/);
  assert.match(heroExperience, /prefers-reduced-motion/);
  assert.doesNotMatch(homepage, /^"use client"/);
});

test("portfolio contains every required live project", async () => {
  const projects = await read("../app/project-data.ts");
  const requiredProjects = [
    "https://adelaidewholesaletyres.com.au/",
    "https://www.247trucktyreservices.com.au/",
    "https://www.maplerentals.com.au/",
    "https://www.galarentals.com.au/",
    "https://zqremovals.au/",
    "https://www.decentdevelopment.com.au/",
    "https://milestonedevelopment.com.au/",
    "https://4-point-concrete-design.vercel.app/",
    "https://www.1stclassexpress.com.au/",
    "https://www.hfremovalsadelaide.com/",
    "https://www.aftabandsons.com.au/",
    "https://247trucktyreservices.store/",
  ];

  for (const project of requiredProjects) assert.match(projects, new RegExp(project.replaceAll(".", "\\.")));
});

test("every project ships a real preview image and routes visitors through a case study", async () => {
  const [projects, homepage, artwork, workPage, workIndexBody, caseStudy] = await Promise.all([
    read("../app/project-data.ts"),
    read("../app/agency-home.tsx"),
    read("../app/project-artwork.tsx"),
    read("../app/work/page.tsx"),
    read("../app/components/WorkIndexBody.tsx"),
    read("../app/work/[slug]/page.tsx"),
  ]);

  const imageNames = [...projects.matchAll(/\$\{assetBase\}\/([\w.-]+)/g)].map(([, name]) => name);
  assert.equal(imageNames.length, 13);
  assert.ok(imageNames.includes("ab-portfolio-adelaide-wholesale-tyres.webp"));
  assert.ok(imageNames.includes("ab-portfolio-1st-class-express.jpg"));
  assert.ok(imageNames.includes("ab-portfolio-hf-removals.jpg"));
  assert.ok(imageNames.includes("ab-portfolio-247-truck-tyre-services.jpg"));
  assert.ok(imageNames.includes("ab-portfolio-aftab-sons-transport.webp"));
  assert.ok(imageNames.includes("ab-portfolio-247-inventory-system.webp"));
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
  assert.doesNotMatch(workIndexBody, /href=\{project\.url\}/);
  assert.match(workIndexBody, /href=\{`\/work\/\$\{project\.slug\}`\}/);
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
  assert.match(experience, /max-width: 720px/);
  assert.match(experience, /mobileQuery\.matches/);
  assert.match(experience, /setMode\("fallback"\)/);
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

test("premium motion remains present while mobile rendering is constrained", async () => {
  const [homepage, experience, canvas, styles] = await Promise.all([
    read("../app/agency-home.tsx"),
    read("../app/components/Hero3DExperience.tsx"),
    read("../app/components/Hero3DCanvas.tsx"),
    read("../app/globals.css"),
  ]);

  assert.match(homepage, /className="hero-marquee-track"/);
  assert.match(homepage, /className="hero-marquee-group" aria-hidden="true"/);
  assert.match(styles, /\.hero-marquee-track\s*\{[\s\S]*?width: max-content;[\s\S]*?animation: hero-marquee-scroll 24s linear infinite;/);
  assert.match(styles, /@keyframes hero-marquee-scroll[\s\S]*?translate3d\(-50%, 0, 0\)/);
  assert.match(experience, /tabletQuery\.matches \|\| constrainedDevice/);
  assert.match(canvas, /Math\.min\(window\.devicePixelRatio, 1\.25\)/);
  assert.match(canvas, /const particleCount = isMobile \? 88/);
  assert.match(styles, /\.service-card\s*\{\s*min-height: 0;/);
  assert.match(styles, /@media \(max-width: 960px\) and \(orientation: landscape\)/);
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

test("project count copy is derived from the canonical registry", async () => {
  const [homepage, workIndexBody] = await Promise.all([
    read("../app/agency-home.tsx"),
    read("../app/components/WorkIndexBody.tsx"),
  ]);
  assert.match(homepage, /Explore \{projects\.length\} live digital projects/);
  assert.match(homepage, /\{projects\.length\} responsive websites and custom software projects/);
  assert.match(homepage, /isSoftwareProject\(project\) \? "Live system" : "Live website"/);
  assert.match(homepage, /\{projects\.length\} live digital project case studies/);
  assert.match(workIndexBody, /\{projects\.length\} projects/);
  assert.match(workIndexBody, /isSoftwareProject\(project\) \? "Live system" : "Live website"/);
  assert.match(await read("../app/project-data.ts"), /project\.kind === "software"/);
  assert.match(await read("../app/work/[slug]/page.tsx"), /project\.ctaLabel \?\? "View Live Website"/);
  assert.doesNotMatch(homepage, /\b(?:seven|eight)\b/i);
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
  assert.match(chrome, /AB Web Studio/);
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
  assert.match(llms, /^# AB Web Studio/m);
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

test("premium interaction layer is wired without heavy dependencies", async () => {
  const [homepage, styles, intro, pointerFx, chrome, caseStudy, rawPackage] = await Promise.all([
    read("../app/agency-home.tsx"),
    read("../app/globals.css"),
    read("../app/components/IntroReveal.tsx"),
    read("../app/components/PointerFX.tsx"),
    read("../app/site-chrome.tsx"),
    read("../app/work/[slug]/page.tsx"),
    read("../package.json"),
  ]);

  assert.match(homepage, /hero-title-accent/);
  assert.match(homepage, /hero-scroll-cue/);
  assert.match(homepage, /process-rail-fill/);
  assert.match(homepage, /project-ghost-index/);
  assert.match(homepage, /data-cursor="VIEW"/);
  assert.match(homepage, /data-magnetic/);

  assert.match(intro, /sessionStorage/);
  assert.match(intro, /prefers-reduced-motion/);
  assert.match(styles, /\.intro-reveal \{ display: none; \}/);

  assert.match(pointerFx, /pointer: fine/);
  assert.match(pointerFx, /data-cursor/);
  assert.match(pointerFx, /data-magnetic/);
  assert.match(pointerFx, /visibilitychange/);
  assert.doesNotMatch(styles, /cursor:\s*none/);

  assert.match(chrome, /is-scrolled/);
  assert.match(styles, /\.site-header\.is-scrolled/);

  assert.match(caseStudy, /case-study-meta/);
  assert.match(caseStudy, /01 \/ Overview/);
  assert.match(caseStudy, /data-cursor="VISIT"/);
  assert.match(styles, /\.services-index-row/);

  const pkg = JSON.parse(rawPackage);
  for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
    assert.doesNotMatch(name, /gsap|framer-motion|locomotive-scroll|lenis/i);
  }
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

test("llms.txt stays in sync with the canonical project registry", async () => {
  const { projects } = await import("../app/project-data.ts");
  const llms = await read("../public/llms.txt");

  assert.equal(projects.length, 13);
  assert.match(llms, /Thirteen live digital projects/);
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

test("services index page exists and is wired into SEO routes", async () => {
  const [servicesIndex, sitemap] = await Promise.all([
    read("../app/services/page.tsx"),
    read("../app/sitemap.ts"),
  ]);

  assert.match(servicesIndex, /canonical: "\/services"/);
  assert.match(servicesIndex, /"@type": "CollectionPage"/);
  assert.match(servicesIndex, /aria-label="Breadcrumb"/);
  assert.match(servicesIndex, /servicePages\.map/);
  assert.match(sitemap, /\/services`/);
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
  assert.equal(packageJson.scripts.typecheck, "bash scripts/typecheck.sh");
  assert.match(await read("../scripts/typecheck.sh"), /next" typegen/);
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
