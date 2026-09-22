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
  const sent = JSON.parse(init.body);
  assert.equal(sent.reply_to, "sender@example.com");
  assert.equal(sent.subject, "Website enquiry from Test Sender");
  assert.match(sent.text, /I would like a new website/);
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
    if (url.includes("/pipeline")) {
      return new Response(JSON.stringify([{ result: 6 }, { result: 1 }]), { status: 200 });
    }
    return new Response(JSON.stringify({ id: "test-email" }), { status: 200 });
  };

  const response = await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 429);

  const pipelineCall = fetchCalls.find(({ url }) => url.includes("/pipeline"));
  assert.ok(pipelineCall, "expected an Upstash pipeline call");
  assert.equal(pipelineCall.init.headers.Authorization, "Bearer test-upstash-token");
  const commands = JSON.parse(pipelineCall.init.body);
  assert.deepEqual(commands[0][0], "INCR");
  assert.deepEqual(commands[1], ["PEXPIRE", commands[0][1], 600000, "NX"]);
  assert.equal(fetchCalls.filter(({ url }) => url.includes("resend.com")).length, 0);
});

test("shared rate-limit store failure falls back without leaking details", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-upstash-token";
  fetchResponder = (url) => {
    if (url.includes("/pipeline")) return new Response("upstream error", { status: 500 });
    return new Response(JSON.stringify({ id: "test-email" }), { status: 200 });
  };

  const response = await POST(contactRequest(validPayload(), { "x-real-ip": nextIp() }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { ok: true });
  assert.ok(!JSON.stringify(body).includes("upstash"), "client response must not mention the store");
});
