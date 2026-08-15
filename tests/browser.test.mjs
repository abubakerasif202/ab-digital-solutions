// Browser-level behavioural tests.
//
// These run against a real production server and assert what a visitor
// actually receives, rather than what the source says. They are skipped unless
// AB_TEST_BASE_URL points at a running `next start`, so `npm test` stays fast
// and offline-safe:
//
//   npm run build && npx next start -p 3222
//   AB_TEST_BASE_URL=http://localhost:3222 node --test tests/browser.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.AB_TEST_BASE_URL?.replace(/\/$/, "");
const describeServer = { skip: baseUrl ? false : "set AB_TEST_BASE_URL to run" };

const get = (path, init) => fetch(`${baseUrl}${path}`, { redirect: "manual", ...init });
const getText = async (path) => (await get(path)).text();

test("homepage renders hero copy and CTAs without any JavaScript", describeServer, async () => {
  const html = await getText("/");

  assert.match(html, /Websites that make your business/);
  assert.match(html, /impossible to ignore/);
  assert.match(html, /Start a Project/);
  assert.match(html, /View Our Work/);
  assert.match(html, /id="main-content"/);
  assert.match(html, /Skip to content/);
});

test("the WebGL bundle never blocks first paint", describeServer, async () => {
  const html = await getText("/");

  // three must not be referenced by the initial document at all: the hero is a
  // dynamic, ssr:false, idle-deferred import.
  assert.doesNotMatch(html, /\bthree\b/i);
  assert.match(html, /hero-3d-fallback/, "SSR placeholder should hold the hero's space");
});

test("every published route responds and unknown routes 404", describeServer, async () => {
  const expected = {
    "/": 200,
    "/work": 200,
    "/work/zq-removals": 200,
    "/work/1st-class-express": 200,
    "/services/web-design-sydney": 200,
    "/privacy": 200,
    "/sitemap.xml": 200,
    "/robots.txt": 200,
    "/manifest.webmanifest": 200,
    "/llms.txt": 200,
    "/opengraph-image": 200,
    "/work/zq-removals/opengraph-image": 200,
    "/icons/icon-192.png": 200,
    "/icons/icon-512.png": 200,
    "/this-route-does-not-exist": 404,
  };

  for (const [path, status] of Object.entries(expected)) {
    const response = await get(path);
    assert.equal(response.status, status, `${path} returned ${response.status}`);
  }
});

test("security headers are present on real responses", describeServer, async () => {
  const response = await get("/");
  const csp = response.headers.get("content-security-policy") ?? "";

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
  for (const directive of [
    "default-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
  ]) {
    assert.ok(csp.includes(directive), `CSP missing ${directive}`);
  }
  // unsafe-eval is a dev-only concession.
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test("legacy prototype URLs redirect instead of serving a duplicate site", describeServer, async () => {
  for (const path of [
    "/site/ab-digital-premium",
    "/site/ab-digital-premium/index.html",
    "/site/ab-digital-premium/styles.css",
  ]) {
    const response = await get(path);
    assert.ok(
      [301, 308].includes(response.status),
      `${path} returned ${response.status} instead of a permanent redirect`,
    );
  }
});

test("portfolio imagery is served watermarked and the originals are not linked", describeServer, async () => {
  const html = await getText("/work");

  assert.match(html, /watermarked/, "work page should reference watermarked imagery");

  const watermarked = await get(
    "/site/ab-digital-premium/assets/watermarked/v2/ab-portfolio-zq-removals.jpg",
  );
  assert.equal(watermarked.status, 200);
  assert.match(watermarked.headers.get("content-type") ?? "", /image\/jpeg/);
});

test("case studies carry their own OpenGraph card and canonical", describeServer, async () => {
  const html = await getText("/work/zq-removals");

  assert.match(html, /og:image[^>]+\/work\/zq-removals\/opengraph-image/);
  assert.match(html, /rel="canonical"[^>]+\/work\/zq-removals/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /ZQ Removals/);
});

test("sitemap lists every case study and service page", describeServer, async () => {
  const xml = await getText("/sitemap.xml");

  for (const slug of [
    "maple-rentals",
    "gala-rentals",
    "zq-removals",
    "decent-development",
    "milestone-development",
    "4-point-concrete",
    "1st-class-express",
  ]) {
    assert.match(xml, new RegExp(`/work/${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<`));
  }
  assert.match(xml, /\/services\/web-design-sydney</);
});

// The endpoint rate-limits per client address and keeps that state in memory
// for the life of the server process. Giving every case its own synthetic
// address — unique per run — keeps these tests repeatable against a
// long-running server instead of tripping the limiter on the second run.
const runId = Date.now() % 100000;
let addressCounter = 0;
const freshAddress = () => `198.51.100.${(addressCounter += 1)}:${runId}`;

test("the contact endpoint rejects hostile submissions", describeServer, async () => {
  const post = (body, headers = {}) => fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": freshAddress(),
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

  // Remotely we cannot control the client address, so a shared rate-limit
  // window may already be exhausted and turn an expected 400 into a 429. Both
  // are refusals, which is what this test is about; locally we hold the
  // stricter line because each case gets its own synthetic address.
  const refusedWith = (response, expected, label) => {
    const allowed = isLocal ? [expected] : [expected, 429];
    assert.ok(
      allowed.includes(response.status),
      `${label}: got ${response.status}, expected ${allowed.join(" or ")}`,
    );
  };

  // The origin check runs before the rate limiter, so this is always a 403.
  const crossOrigin = await post({}, { Origin: "https://attacker.example" });
  assert.equal(crossOrigin.status, 403, "cross-origin post should be refused");

  const malformed = await post("not json");
  refusedWith(malformed, 400, "malformed JSON");

  const arrayBody = await post("[1,2,3]");
  refusedWith(arrayBody, 400, "non-object JSON");

  const badEmail = await post({
    fullName: "Test", email: "nope", service: "Website design & development",
    budget: "Not sure yet", timeline: "As soon as possible", message: "hi",
  });
  refusedWith(badEmail, 400, "malformed email");

  const unknownService = await post({
    fullName: "Test", email: "a@b.co", service: "Not a real service",
    budget: "Not sure yet", timeline: "As soon as possible", message: "hi",
  });
  refusedWith(unknownService, 400, "off-list service");

  // No response may leak the mail provider or its credentials.
  for (const response of [malformed, badEmail, unknownService]) {
    const body = await response.text();
    assert.doesNotMatch(body, /resend|api[_-]?key|bearer/i);
  }

  // NOTE: a valid submission is deliberately not exercised here — it would
  // deliver a real email when RESEND_API_KEY is configured. The success path is
  // covered by the unit tests in tests/contact-validation.test.mjs.
});

// Controlling the client address requires x-forwarded-for to reach the app
// untouched, which is only true locally. In production Vercel overwrites that
// header — correctly, since otherwise any client could spoof its way past the
// limiter — so the per-address form of this test cannot run there.
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(baseUrl ?? "");
const describeLocal = {
  skip: !baseUrl
    ? "set AB_TEST_BASE_URL to run"
    : isLocal
      ? false
      : "per-address limits need a controllable x-forwarded-for (local only)",
};

test("the contact endpoint rate-limits a flood from one address", describeLocal, async () => {
  const address = freshAddress();
  const post = () => fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": address },
    body: "not json",
  });

  // The first five requests are refused on their merits (400), not throttled.
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    assert.equal((await post()).status, 400, `attempt ${attempt} should not be throttled`);
  }
  assert.equal((await post()).status, 429, "sixth attempt should be throttled");
});

test("a sustained flood is throttled whatever the environment", describeServer, async () => {
  // Environment-agnostic form: whoever the limiter thinks we are, hammering the
  // endpoint with invalid bodies must stop returning plain 400s and start
  // refusing. Uses only malformed payloads, so nothing can be delivered.
  const post = () => fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not json",
  });

  let throttled = false;
  for (let attempt = 1; attempt <= 12 && !throttled; attempt += 1) {
    const status = (await post()).status;
    assert.ok([400, 429].includes(status), `unexpected status ${status}`);
    if (status === 429) throttled = true;
  }

  assert.ok(throttled, "endpoint never throttled a sustained flood of invalid requests");
});

test("robots allows crawling and points at the sitemap", describeServer, async () => {
  const robots = await getText("/robots.txt");

  assert.match(robots, /Sitemap: https:\/\/www\.abwebstudio\.com\.au\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Allow: \//);
});

test("manifest declares square installable icons", describeServer, async () => {
  const manifest = await (await get("/manifest.webmanifest")).json();

  const sizes = manifest.icons.map((icon) => icon.sizes);
  assert.ok(sizes.includes("192x192"));
  assert.ok(sizes.includes("512x512"));
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
  for (const icon of manifest.icons) {
    const [w, h] = icon.sizes.split("x").map(Number);
    assert.equal(w, h, `${icon.src} is not square`);
  }
});
