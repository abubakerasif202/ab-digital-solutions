// Regression guards for the production hardening pass: 3D progressive
// enhancement, security headers, PWA icons, and removal of the legacy
// standalone prototype that used to ship inside public/.
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const exists = async (path) => {
  try {
    await stat(new URL(path, import.meta.url));
    return true;
  } catch {
    return false;
  }
};

test("hero 3D keeps the sculpture under reduced motion instead of a flat gradient", async () => {
  const [experience, canvas] = await Promise.all([
    read("../app/components/Hero3DExperience.tsx"),
    read("../app/components/Hero3DCanvas.tsx"),
  ]);

  // The only reason to fall back is "not ready yet" — reduced motion must not
  // drop the user to the plain CSS gradient.
  assert.match(experience, /if \(!ready\) \{\s*setMode\("fallback"\);/);
  assert.doesNotMatch(experience, /motionQuery\.matches\)\s*\{\s*setMode\("fallback"\)/);
  assert.match(experience, /prefers-reduced-motion/);

  // Instead the canvas paints exactly one frame and never starts the rAF loop.
  assert.match(canvas, /renderStaticFrame/);
  assert.match(canvas, /if \(isRunning \|\| !isVisible \|\| prefersReducedMotion\) return;/);
  assert.match(canvas, /if \(prefersReducedMotion\) return;/);
});

test("hero 3D reframes the camera on portrait viewports only", async () => {
  const canvas = await read("../app/components/Hero3DCanvas.tsx");

  assert.match(canvas, /function fitCameraToViewport/);
  assert.match(canvas, /Math\.max\(DESKTOP_CAMERA_Z, distanceToFrame\)/);
  assert.match(canvas, /const DESKTOP_CAMERA_Z = 7\.5/);
  // Resize must reuse the same fit, or rotation would re-crop the scene.
  assert.match(canvas, /fitCameraToViewport\(camera, newWidth, newHeight\)/);
});

test("camera fit never pulls closer than the desktop framing", () => {
  const DESKTOP_CAMERA_Z = 7.5;
  const FRAMED_RADIUS = 1.7;
  const fov = 45;

  const distanceFor = (width, height) => {
    const aspect = width / Math.max(height, 1);
    const halfHorizontalTan = Math.tan((fov * Math.PI) / 180 / 2) * aspect;
    return Math.max(DESKTOP_CAMERA_Z, FRAMED_RADIUS / halfHorizontalTan);
  };

  // Wide viewports keep the original composition exactly.
  assert.equal(distanceFor(1440, 900), DESKTOP_CAMERA_Z);
  assert.equal(distanceFor(1920, 1080), DESKTOP_CAMERA_Z);
  assert.equal(distanceFor(768, 1024), DESKTOP_CAMERA_Z);

  // Narrow portrait pulls back so the sculpture stays inside the frame.
  assert.ok(distanceFor(375, 812) > DESKTOP_CAMERA_Z);
  assert.ok(distanceFor(320, 900) > distanceFor(430, 900));
});

test("three is imported by name so unused modules stay droppable", async () => {
  const canvas = await read("../app/components/Hero3DCanvas.tsx");

  // Anchored to real statements so the prose in nearby comments cannot satisfy
  // or trip these assertions.
  const code = canvas.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  assert.doesNotMatch(code, /^\s*import \* as THREE/m);
  assert.doesNotMatch(code, /\bTHREE\.\w/);
  assert.match(code, /import \{[\s\S]*WebGLRenderer,?[\s\S]*\} from "three";/);
});

test("hero 3D scales GPU cost down on phones without dropping brand effects", async () => {
  const canvas = await read("../app/components/Hero3DCanvas.tsx");

  // Cheaper renderer context on phones.
  assert.match(canvas, /powerPreference: isMobile \|\| isTablet \? "default" : "high-performance"/);
  assert.match(canvas, /precision: isMobile \? "mediump" : "highp"/);

  // Clearcoat is a second specular lobe; phones use the standard metallic one.
  assert.match(canvas, /isMobile\s*\?\s*new MeshStandardMaterial\(\{ color: 0x08090a, metalness: 0\.88, roughness: 0\.12 \}\)/);
  assert.match(canvas, /new MeshPhysicalMaterial\(\{[\s\S]*clearcoat: 1\.0/);

  // The brand lights must survive: gold key, red accent. Only the non-brand
  // cyan rim light may be dropped, and the red is compensated when it is.
  assert.match(canvas, /new DirectionalLight\(0xd4a32f/);
  assert.match(canvas, /new PointLight\(0xb5121b/);
  assert.match(canvas, /const cyanHighlightLight = isMobile \? null : new PointLight\(0x38bdf8/);
  assert.match(canvas, /redAccentLight\.intensity = 4\.1/);

  // Gold wireframe halo and the particle field are never removed.
  assert.match(canvas, /wireframe: true/);
  assert.match(canvas, /color: 0xd4a32f/);
  assert.match(canvas, /const particleCount = isMobile \? 88/);
});

test("resize coalesces to one drawing-buffer reallocation per frame", async () => {
  const canvas = await read("../app/components/Hero3DCanvas.tsx");

  assert.match(canvas, /const resizeObserver = new ResizeObserver\(scheduleResize\)/);
  assert.match(canvas, /resizeFrameId = requestAnimationFrame\(handleResize\)/);
  // Sub-pixel jitter must not trigger a setSize.
  assert.match(canvas, /Math\.abs\(newWidth - appliedWidth\) < 2 && Math\.abs\(newHeight - appliedHeight\) < 2/);
  // A queued resize must not outlive the renderer.
  assert.match(canvas, /if \(resizeFrameId\) cancelAnimationFrame\(resizeFrameId\)/);
});

test("hero 3D still tears down every GPU resource it creates", async () => {
  const canvas = await read("../app/components/Hero3DCanvas.tsx");

  for (const disposed of [
    "mainGeometry.dispose()",
    "mainMaterial.dispose()",
    "ringGeometry.dispose()",
    "ringMaterial.dispose()",
    "particleGeometry.dispose()",
    "particleMaterial.dispose()",
    "renderer.dispose()",
    "renderer.forceContextLoss()",
  ]) {
    assert.ok(canvas.includes(disposed), `${disposed} missing from cleanup`);
  }
  assert.match(canvas, /webglcontextlost/);
  assert.match(canvas, /setRendererFailed\(true\)/);
});

test("security headers close the obvious gaps", async () => {
  const config = await read("../next.config.ts");

  for (const directive of [
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "connect-src 'self'",
  ]) {
    assert.ok(config.includes(directive), `CSP missing ${directive}`);
  }

  assert.match(config, /Strict-Transport-Security/);
  assert.match(config, /max-age=31536000; includeSubDomains; preload/);

  // unsafe-eval is dev-only, and the Resend host must not be reachable from the
  // browser at all (it is called server side).
  assert.match(config, /isProduction \? "" : " 'unsafe-eval'"/);
  assert.doesNotMatch(config, /connect-src 'self' https:\/\/api\.resend\.com/);
});

test("the legacy standalone prototype is gone but its live assets remain", async () => {
  for (const removed of [
    "../public/site/ab-digital-premium/index.html",
    "../public/site/ab-digital-premium/styles.css",
    "../public/site/ab-digital-premium/script.js",
    "../public/site/ab-digital-premium/assets/ab-hero-logo-glow.png",
    "../public/site/ab-digital-premium/assets/ab-hero-website-creation.png",
    "../public/site/ab-digital-premium/assets/ab-brand-banner.webp",
  ]) {
    assert.equal(await exists(removed), false, `${removed} should have been removed`);
  }

  // Everything the running site actually references must survive.
  for (const kept of [
    "../public/site/ab-digital-premium/assets/ab-logo-mark.png",
    "../public/site/ab-digital-premium/assets/ab-logo-lockup.png",
    "../public/site/ab-digital-premium/assets/ab-portfolio-zq-removals.jpg",
    "../public/site/ab-digital-premium/assets/ab-portfolio-1st-class-express.jpg",
  ]) {
    assert.equal(await exists(kept), true, `${kept} is still referenced and must stay`);
  }

  const config = await read("../next.config.ts");
  assert.match(config, /source: "\/site\/ab-digital-premium", destination: "\/"/);
  assert.match(config, /source: "\/site\/ab-digital-premium\/index\.html", destination: "\/"/);
});

test("no oversized images ship from public/", async () => {
  const budgetBytes = 400_000;
  const assets = [
    "ab-logo-lockup.png",
    "ab-logo-mark.png",
    "ab-portfolio-1st-class-express.jpg",
    "ab-portfolio-decent-development.jpg",
    "ab-portfolio-four-point-concrete.jpg",
    "ab-portfolio-gala-rentals.jpg",
    "ab-portfolio-maple-rentals.jpg",
    "ab-portfolio-milestone-development.jpg",
    "ab-portfolio-zq-removals.jpg",
  ];

  for (const asset of assets) {
    const info = await stat(
      new URL(`../public/site/ab-digital-premium/assets/${asset}`, import.meta.url),
    );
    assert.ok(info.size > 0, `${asset} is empty`);
    assert.ok(info.size < budgetBytes, `${asset} is ${info.size} bytes, over the ${budgetBytes} budget`);
  }
});

test("PWA and touch icons are square", async () => {
  const [manifest, layout] = await Promise.all([
    read("../app/manifest.ts"),
    read("../app/layout.tsx"),
  ]);

  assert.match(manifest, /sizes: "192x192"/);
  assert.match(manifest, /sizes: "512x512"/);
  assert.match(manifest, /purpose: "maskable"/);
  // The old non-square entry must not come back.
  assert.doesNotMatch(manifest, /400x340/);
  assert.doesNotMatch(layout, /apple: `\$\{assetBase\}/);

  for (const icon of ["../public/icons/icon-192.png", "../public/icons/icon-512.png"]) {
    const info = await stat(new URL(icon, import.meta.url));
    assert.ok(info.size > 0, `${icon} is missing`);
  }
});

test("each case study gets its own OpenGraph card from real project data", async () => {
  const [ogImage, caseStudy] = await Promise.all([
    read("../app/work/[slug]/opengraph-image.tsx"),
    read("../app/work/[slug]/page.tsx"),
  ]);

  assert.match(ogImage, /generateStaticParams/);
  assert.match(ogImage, /findProject/);
  assert.match(ogImage, /project\.name/);
  assert.match(ogImage, /project\.displayUrl/);
  // The card must not invent copy — every string comes from project-data.
  assert.doesNotMatch(ogImage, /award|#1|best in|guaranteed/i);

  // The page must no longer pin the shared studio image, or it would win over
  // the per-route card.
  assert.doesNotMatch(caseStudy, /images: \[\s*\{\s*url: "\/opengraph-image"/);
});

test("llms.txt lists every real case-study page and invents none", async () => {
  const [llms, projectData] = await Promise.all([
    read("../public/llms.txt"),
    read("../app/project-data.ts"),
  ]);

  const slugs = [...projectData.matchAll(/^\s{4}slug: "([\w-]+)"/gm)].map(([, slug]) => slug);
  assert.equal(slugs.length, 7, "expected seven project slugs in project-data");

  for (const slug of slugs) {
    assert.ok(
      llms.includes(`https://www.abwebstudio.com.au/work/${slug}`),
      `llms.txt is missing the case study for ${slug}`,
    );
  }

  // Every /work/<slug> URL in llms.txt must correspond to a real project.
  const listed = [...llms.matchAll(/abwebstudio\.com\.au\/work\/([\w-]+)/g)].map(([, slug]) => slug);
  for (const slug of listed) {
    assert.ok(slugs.includes(slug), `llms.txt references a case study that does not exist: ${slug}`);
  }

  assert.ok(llms.includes("https://www.abwebstudio.com.au/work"), "the work index should be listed");
});

test("contact rules live in one place, shared by route and tests", async () => {
  const [schema, service, route] = await Promise.all([
    read("../lib/contact/schema.ts"),
    read("../lib/contact/service.ts"),
    read("../app/api/contact/route.ts"),
  ]);

  // The route must not re-implement any validation.
  assert.doesNotMatch(route, /ALLOWED_SERVICES|EMAIL_PATTERN|honeypot/);
  assert.match(schema, /validateContactPayload/);
  assert.match(service, /deliverEnquiry/);

  // Rules must stay platform-agnostic so a Worker could reuse them unchanged.
  assert.doesNotMatch(schema, /next\/server/);
  assert.doesNotMatch(service, /next\/server/);
});
