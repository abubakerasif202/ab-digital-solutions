// Behavioral tests for the contact route handler. These execute the real POST
// handler with constructed Request objects, a mocked fetch (Resend + Upstash)
// and controlled environment variables — no source-text assertions.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

const { POST } = await import("../app/api/contact/route.ts");

const ENDPOINT = "https://www.abwebstudio.com.au/api/contact";
const MANAGED_ENV = [
  "RESEND_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "VERCEL_ENV",
  "CONTACT_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
];
const savedEnv = new Map(MANAGED_ENV.map((name) => [name, process.env[name]]));
const originalFetch = globalThis.fetch;

let fetchCalls = [];
let fetchResponder = () => new Response(JSON.stringify({ id: "test-email" }), { status: 200 });
let ipCounter = 0;

function nextIp() {
  ipCounter += 1;
  return `198.51.100.${ipCounter}`;
}

function validPayload(overrides = {}) {
  return {
    fullName: "Test Sender",
    email: "sender@example.com",
    phone: "0400 000 000",
    service: "Website design & development",
    budget: "$3,000–$6,000",
    timeline: "Within 1 month",
    message: "I would like a new website for my business.",
    company: "",
    ...overrides,
  };
}

function contactRequest(body, headers = {}) {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.RESEND_API_KEY = "test-resend-key";
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.VERCEL_ENV;
  fetchCalls = [];
  fetchResponder = () => new Response(JSON.stringify({ id: "test-email" }), { status: 200 });
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url: String(url), init });
    return fetchResponder(String(url), init);
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const name of MANAGED_ENV) {
    const saved = savedEnv.get(name);
    if (saved === undefined) delete process.env[name];
    else process.env[name] = saved;
  }
});

test("valid enquiry is delivered through Resend and returns ok", async () => {
  const response = await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });

  assert.equal(fetchCalls.length, 1);
  const { url, init } = fetchCalls[0];
  assert.equal(url, "https://api.resend.com/emails");
  assert.equal(init.headers.Authorization, "Bearer test-resend-key");
  assert.match(init.headers["Idempotency-Key"], /^contact-[0-9a-f]{64}$/);
  const sent = JSON.parse(init.body);
  assert.equal(sent.reply_to, "sender@example.com");
  assert.equal(sent.subject, "Website enquiry from Test Sender");
  assert.match(sent.text, /I would like a new website/);
});

test("preview deployments refuse delivery, say so, and never call Resend", async () => {
  process.env.VERCEL_ENV = "preview";
  const response = await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, "preview-disabled");
  assert.match(body.error, /disabled in preview/i);
  assert.notEqual(body.ok, true);
  assert.equal(fetchCalls.length, 0);
});

test("preview still validates input before reporting that delivery is disabled", async () => {
  process.env.VERCEL_ENV = "preview";
  const response = await POST(contactRequest(validPayload({ email: "not-an-email" }), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 400);
  assert.equal(fetchCalls.length, 0);
});

test("production deployments still deliver enquiries", async () => {
  process.env.VERCEL_ENV = "production";
  const response = await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "https://api.resend.com/emails");
});

test("prefers the Vercel-provided client IP header for rate limiting", async () => {
  const vercelIp = nextIp();
  const statuses = [];
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    // x-forwarded-for and x-real-ip vary per request; x-vercel-forwarded-for
    // must win as the rate-limit key, so all six share one budget.
    const response = await POST(
      contactRequest(validPayload(), {
        "x-vercel-forwarded-for": vercelIp,
        "x-forwarded-for": `10.0.0.${attempt}`,
        "x-real-ip": `172.16.0.${attempt}`,
      }),
    );
    statuses.push(response.status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
  assert.equal(fetchCalls.length, 5);
});

test("requests without any client IP share one fallback bucket", async () => {
  const statuses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await POST(contactRequest(validPayload()));
    statuses.push(response.status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
  assert.equal(fetchCalls.length, 5);
});

test("repeated enquiries from one client are rate limited", async () => {
  const ip = nextIp();
  const statuses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await POST(contactRequest(validPayload(), { "x-forwarded-for": ip }));
    statuses.push(response.status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
  const limited = await POST(contactRequest(validPayload(), { "x-forwarded-for": ip }));
  assert.equal(limited.status, 429);
  assert.match((await limited.json()).error, /Too many enquiries/);
  assert.equal(fetchCalls.length, 5);
});

test("malformed, null and non-object JSON bodies are rejected with 400", async () => {
  const ip = nextIp();
  const bodies = ["null", "[1,2,3]", "\"just a string\"", "{not valid json", "42"];
  for (const body of bodies) {
    const response = await POST(contactRequest(body, { "x-real-ip": ip }));
    assert.equal(response.status, 400, `body ${body} should be rejected`);
    assert.match((await response.json()).error, /Invalid enquiry/);
  }
  assert.equal(fetchCalls.length, 0);
});

test("oversized enquiry is rejected with 413", async () => {
  const payload = validPayload({ message: "x".repeat(13_000) });
  const response = await POST(contactRequest(payload, { "x-real-ip": nextIp() }));
  assert.equal(response.status, 413);
  assert.match((await response.json()).error, /too large/);
  assert.equal(fetchCalls.length, 0);
});

test("overlong fields are rejected instead of silently truncated", async () => {
  for (const field of ["fullName", "email", "phone", "message"]) {
    const max = { fullName: 160, email: 254, phone: 50, message: 4000 }[field];
    const response = await POST(contactRequest(validPayload({ [field]: "x".repeat(max + 1) }), { "x-real-ip": nextIp() }));
    assert.equal(response.status, 400, field);
    assert.match((await response.json()).error, /shorten/);
  }
  assert.equal(fetchCalls.length, 0);
});

test("honeypot submissions are silently accepted without sending email", async () => {
  const payload = validPayload({ company: "Spammy SEO Services" });
  const response = await POST(contactRequest(payload, { "x-real-ip": nextIp() }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(fetchCalls.length, 0);
});

test("missing RESEND_API_KEY returns 503 and sends nothing", async () => {
  delete process.env.RESEND_API_KEY;
  const response = await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /temporarily unavailable/);
  assert.equal(fetchCalls.length, 0);
});

test("shared rate-limit store decision is honoured when configured", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-upstash-token";
  fetchResponder = (url) => {
    if (url.includes("/multi-exec")) {
      return new Response(JSON.stringify([{ result: 6 }, { result: 1 }]), { status: 200 });
    }
    return new Response(JSON.stringify({ id: "test-email" }), { status: 200 });
  };

  const response = await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 429);

  const transactionCall = fetchCalls.find(({ url }) => url.includes("/multi-exec"));
  assert.ok(transactionCall, "expected an Upstash atomic transaction call");
  assert.equal(transactionCall.init.headers.Authorization, "Bearer test-upstash-token");
  const commands = JSON.parse(transactionCall.init.body);
  assert.deepEqual(commands[0][0], "INCR");
  assert.deepEqual(commands[1], ["PEXPIRE", commands[0][1], 600000, "NX"]);
  assert.equal(fetchCalls.filter(({ url }) => url.includes("resend.com")).length, 0);
});

test("shared rate-limit store failure falls back without leaking details", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-upstash-token";
  fetchResponder = (url) => {
    if (url.includes("/multi-exec")) return new Response("upstream error", { status: 500 });
    return new Response(JSON.stringify({ id: "test-email" }), { status: 200 });
  };

  const response = await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { ok: true });
  assert.ok(!JSON.stringify(body).includes("upstash"), "client response must not mention the store");
});

test("starter budgets and custom software enquiries remain deliverable", async () => {
  const response = await POST(contactRequest(validPayload({ budget: "Under $1,500", service: "Custom software & business systems" }), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 200);
  const sent = JSON.parse(fetchCalls[0].init.body);
  assert.match(sent.text, /Under \$1,500/);
  assert.match(sent.text, /Custom software & business systems/);
});

test("multi-select services and the business field are delivered", async () => {
  const payload = validPayload({
    service: undefined,
    services: ["Website design & development", "SEO & local visibility"],
    business: "Harbour Joinery",
  });
  const response = await POST(contactRequest(payload, { "x-real-ip": nextIp() }));
  assert.equal(response.status, 200);
  const sent = JSON.parse(fetchCalls[0].init.body);
  assert.match(sent.text, /Services: Website design & development, SEO & local visibility/);
  assert.match(sent.text, /Business: Harbour Joinery/);
});

test("the business field is optional and never mistaken for the honeypot", async () => {
  const response = await POST(contactRequest(validPayload({ business: "" }), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 200);
  assert.equal(fetchCalls.length, 1);
  assert.match(JSON.parse(fetchCalls[0].init.body).text, /Business: Not supplied/);
});

test("service selections must come from the offered options", async () => {
  const cases = [
    { services: [] },
    { services: ["Website design & development", "Crypto mining"] },
    { services: ["Website design & development", "Website design & development"] },
    { services: [42] },
    { services: "Website design & development" },
    { service: "", services: undefined },
  ];
  for (const overrides of cases) {
    const response = await POST(contactRequest(validPayload({ service: undefined, ...overrides }), { "x-real-ip": nextIp() }));
    assert.equal(response.status, 400, JSON.stringify(overrides));
  }
  assert.equal(fetchCalls.length, 0);
});

test("an overlong business name is rejected instead of truncated", async () => {
  const response = await POST(contactRequest(validPayload({ business: "x".repeat(161) }), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /shorten/);
  assert.equal(fetchCalls.length, 0);
});

test("invalid options and cross-origin requests never trigger delivery", async () => {
  const invalid = await POST(contactRequest(validPayload({ budget: "$50" }), { "x-real-ip": nextIp() }));
  assert.equal(invalid.status, 400);
  const crossOrigin = await POST(contactRequest(validPayload(), { origin: "https://evil.example", host: "www.abwebstudio.com.au", "x-real-ip": nextIp() }));
  assert.equal(crossOrigin.status, 403);
  assert.equal(fetchCalls.length, 0);
});

test("delivery rejection and network errors are recoverable failures", async () => {
  fetchResponder = () => new Response("rejected", { status: 403 });
  assert.equal((await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }))).status, 502);
  fetchResponder = () => { throw new Error("mock network failure"); };
  assert.equal((await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }))).status, 502);
});

test("successful HTTP responses without a provider acceptance ID never report delivery", async () => {
  for (const body of ["not JSON", "null", "{}", '{"id":""}', '{"id":42}']) {
    fetchResponder = () => new Response(body, { status: 200 });
    const response = await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }));
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /could not confirm delivery/);
  }
});

test("malformed shared-store results cannot bypass the fallback request budget", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-upstash-token";
  const ip = nextIp();
  const malformed = [
    [{ result: null }, { result: 1 }],
    [{ result: 0 }, { result: 1 }],
    [{ result: 1 }, { error: "expiry failed" }],
    [{ result: 1 }],
    [{ result: "1" }, { result: 1 }],
    [{ result: 1 }, { result: null }],
  ];
  let attempt = 0;
  fetchResponder = (url) => new Response(JSON.stringify(
    url.includes("/multi-exec") ? malformed[attempt++] : { id: "test-email" },
  ), { status: 200 });
  const statuses = [];
  for (let index = 0; index < malformed.length; index += 1) {
    statuses.push((await POST(contactRequest(validPayload(), { "x-real-ip": ip }))).status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
});


test("rate-limited responses include a conservative retry window", async () => {
  const ip = nextIp();
  for (let i = 0; i < 5; i++) await POST(contactRequest(validPayload(), { "x-real-ip": ip }));
  const response = await POST(contactRequest(validPayload(), { "x-real-ip": ip }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "600");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("shared limiter hashes visitor IPs and allows accepted enquiries", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  const ip = nextIp();
  fetchResponder = (url) => new Response(JSON.stringify(url.includes("/multi-exec")
    ? [{ result: 1 }, { result: 1 }] : { id: "accepted" }), { status: 200 });
  const response = await POST(contactRequest(validPayload(), { "x-real-ip": ip }));
  assert.equal(response.status, 200);
  const store = fetchCalls.find(({ url }) => url.endsWith("/multi-exec"));
  assert.ok(store);
  assert.ok(!store.init.body.includes(ip));
  assert.match(JSON.parse(store.init.body)[0][1], /^contact-rate:[a-f0-9]{64}$/);
});

test("insecure store configuration never receives credentials", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "http://upstash.example.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  const response = await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 200);
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "https://api.resend.com/emails");
});

const SUBMISSION_A = "7b0f6f58-1d4f-4b6e-9a53-0c2f3b8d9a11";
const SUBMISSION_B = "e1a2b3c4-d5e6-4f70-8a9b-0c1d2e3f4a5b";

async function submit(overrides = {}) {
  const response = await POST(contactRequest(validPayload(overrides), { "x-real-ip": nextIp() }));
  return { response, key: fetchCalls.at(-1)?.init.headers["Idempotency-Key"] };
}

test("a retried submission reuses one idempotency key", async () => {
  const first = await submit({ submissionId: SUBMISSION_A });
  const retry = await submit({ submissionId: SUBMISSION_A });
  assert.equal(first.response.status, 200);
  assert.match(first.key, /^contact-[0-9a-f]{64}$/);
  assert.equal(retry.key, first.key);
});

test("concurrent duplicate clicks carry the same key", async () => {
  const responses = await Promise.all([
    POST(contactRequest(validPayload({ submissionId: SUBMISSION_A }), { "x-real-ip": nextIp() })),
    POST(contactRequest(validPayload({ submissionId: SUBMISSION_A }), { "x-real-ip": nextIp() })),
  ]);
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  assert.equal(fetchCalls.length, 2);
  assert.equal(fetchCalls[0].init.headers["Idempotency-Key"], fetchCalls[1].init.headers["Idempotency-Key"]);
});

test("every enquiry field and the submission id change the key", async () => {
  const base = (await submit({ submissionId: SUBMISSION_A })).key;
  const variants = [
    { submissionId: SUBMISSION_B },
    { budget: "" },
    { timeline: "Just exploring" },
    { phone: "0411 111 111" },
    { business: "Other Pty Ltd" },
    { fullName: "Someone Else" },
    { email: "other@example.com" },
    { message: "A different brief." },
    { services: ["Website design & development", "SEO & local visibility"] },
  ];
  const keys = new Set([base]);
  for (const variant of variants) {
    const { response, key } = await submit({ submissionId: SUBMISSION_A, ...variant });
    assert.equal(response.status, 200);
    keys.add(key);
  }
  assert.equal(keys.size, variants.length + 1);
});

test("provider conflict and server errors are never reported as sent", async () => {
  fetchResponder = () => new Response(JSON.stringify({ name: "concurrent_idempotent_requests" }), { status: 409 });
  const conflict = await POST(contactRequest(validPayload({ submissionId: SUBMISSION_A }), { "x-real-ip": nextIp() }));
  assert.equal(conflict.status, 409);
  assert.notEqual((await conflict.json()).ok, true);

  fetchResponder = () => new Response("{}", { status: 500 });
  const failed = await POST(contactRequest(validPayload({ submissionId: SUBMISSION_A }), { "x-real-ip": nextIp() }));
  assert.equal(failed.status, 502);

  fetchResponder = () => { throw new Error("network down"); };
  const unreachable = await POST(contactRequest(validPayload({ submissionId: SUBMISSION_A }), { "x-real-ip": nextIp() }));
  assert.equal(unreachable.status, 502);
});

test("a malformed submission id falls back safely and validation still applies", async () => {
  const fallback = await submit({ submissionId: "not-a-uuid" });
  assert.equal(fallback.response.status, 200);
  assert.match(fallback.key, /^contact-[0-9a-f]{64}$/);
  const invalid = await POST(contactRequest(validPayload({ submissionId: SUBMISSION_A, email: "bad" }), { "x-real-ip": nextIp() }));
  assert.equal(invalid.status, 400);
});

test("exhausting the analytics budget never blocks contact submissions", async () => {
  const { POST: analytics } = await import("../app/api/analytics/route.ts");
  process.env.CLICKHOUSE_URL = "https://clickhouse.example.test";
  process.env.CLICKHOUSE_USER = "user";
  process.env.CLICKHOUSE_PASSWORD = "pass";
  try {
    const ip = nextIp();
    let limited = 0;
    for (let index = 0; index < 305; index += 1) {
      const response = await analytics(new Request("https://www.abwebstudio.com.au/api/analytics", {
        method: "POST",
        headers: { "content-type": "application/json", "x-real-ip": ip },
        body: JSON.stringify({ event_name: "page_view", path: "/" }),
      }));
      if (response.status === 429) limited += 1;
    }
    assert.ok(limited > 0);
    const contact = await POST(contactRequest(validPayload({ submissionId: SUBMISSION_A }), { "x-real-ip": ip }));
    assert.equal(contact.status, 200);
  } finally {
    delete process.env.CLICKHOUSE_URL;
    delete process.env.CLICKHOUSE_USER;
    delete process.env.CLICKHOUSE_PASSWORD;
  }
});
