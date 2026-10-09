import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
const { POST } = await import("../app/api/analytics/route.ts");
const keys = ["CLICKHOUSE_URL", "CLICKHOUSE_USER", "CLICKHOUSE_PASSWORD", "CLICKHOUSE_DATABASE", "CLICKHOUSE_TABLE"];
const saved = new Map(keys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
let writes;
beforeEach(() => {
  writes = [];
  process.env.CLICKHOUSE_URL = "https://analytics.example.test";
  process.env.CLICKHOUSE_USER = "test";
  process.env.CLICKHOUSE_PASSWORD = "mock-password";
  process.env.CLICKHOUSE_DATABASE = "default";
  process.env.CLICKHOUSE_TABLE = "web_events";
  globalThis.fetch = async (url, init) => { writes.push(JSON.parse(init.body)); return new Response(null, { status: 200 }); };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of keys) { if (saved.get(key) === undefined) delete process.env[key]; else process.env[key] = saved.get(key); }
});
function request(payload, headers = {}) {
  return new Request("https://www.abwebstudio.com.au/api/analytics", { method: "POST", headers: { "Content-Type": "application/json", host: "www.abwebstudio.com.au", ...headers }, body: JSON.stringify(payload) });
}
test("successful enquiry event uses existing first-party pipeline without enquiry data", async () => {
  const response = await POST(request({ event_name: "project_enquiry", path: "/contact", label: "contact_form", email: "private@example.com", message: "private" }));
  assert.equal(response.status, 204);
  assert.equal(writes[0].event_name, "project_enquiry");
  assert.equal(writes[0].email, undefined);
  assert.equal(writes[0].message, undefined);
});
test("unknown events and cross-origin writes are rejected", async () => {
  assert.equal((await POST(request({ event_name: "failed_enquiry", path: "/contact" }))).status, 400);
  assert.equal((await POST(request({ event_name: "project_enquiry", path: "/contact" }, { origin: "https://evil.example" }))).status, 403);
  assert.equal(writes.length, 0);
});
test("optional analytics stays inert without configuration", async () => {
  delete process.env.CLICKHOUSE_PASSWORD;
  assert.equal((await POST(request({ event_name: "page_view", path: "/" }))).status, 204);
  assert.equal(writes.length, 0);
});

test("chunked oversized payload is rejected even without content-length", async () => {
  const response = await POST(request({ event_name: "page_view", path: "/", extra: "x".repeat(5000) }));
  assert.equal(response.status, 413);
  assert.equal(writes.length, 0);
});
