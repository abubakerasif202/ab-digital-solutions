// Behavioural tests for the contact enquiry rules.
//
// These import lib/contact/*.ts directly and rely on Node's built-in TypeScript
// type stripping (stable and on by default from Node 22.18). package.json pins
// engines.node to 22.x, so this runs everywhere the project is supported.
import assert from "node:assert/strict";
import test from "node:test";

import {
  ALLOWED_BUDGETS,
  ALLOWED_SERVICES,
  ALLOWED_TIMELINES,
  FIELD_LIMITS,
  formatEnquiryEmail,
  isValidEmail,
  readSingleLine,
  validateContactPayload,
} from "../lib/contact/schema.ts";
import {
  ContactBodyError,
  isSameOriginRequest,
  readContactPayload,
  resetRateLimitState,
  withinRateLimit,
} from "../lib/contact/service.ts";

const validPayload = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "0400 000 000",
  service: "Website design & development",
  budget: "$3,000–$6,000",
  timeline: "Within 1 month",
  message: "We need a new site for our Sydney business.",
};

test("accepts a well-formed enquiry", () => {
  const result = validateContactPayload({ ...validPayload });

  assert.equal(result.ok, true);
  assert.equal(result.enquiry.fullName, "Jane Doe");
  assert.equal(result.enquiry.email, "jane@example.com");
  assert.equal(result.enquiry.service, "Website design & development");
});

test("treats a filled honeypot as spam without revealing rejection", () => {
  const result = validateContactPayload({ ...validPayload, company: "spam-bot.example" });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "spam");
});

test("falls back to first and last name when fullName is absent", () => {
  const payload = { ...validPayload };
  delete payload.fullName;
  const result = validateContactPayload({ ...payload, firstName: "Ada", lastName: "Lovelace" });

  assert.equal(result.ok, true);
  assert.equal(result.enquiry.fullName, "Ada Lovelace");
});

test("rejects a missing name, missing message or malformed email", () => {
  for (const override of [
    { fullName: "" },
    { message: "   " },
    { email: "not-an-email" },
    { email: "missing@domain" },
    { email: "" },
  ]) {
    const result = validateContactPayload({ ...validPayload, ...override });
    assert.equal(result.ok, false, `expected rejection for ${JSON.stringify(override)}`);
    assert.equal(result.reason, "invalid");
    assert.match(result.error, /\S/);
  }
});

test("rejects values outside the published select options", () => {
  for (const override of [
    { service: "Something we do not offer" },
    { budget: "$1" },
    { timeline: "Yesterday" },
  ]) {
    const result = validateContactPayload({ ...validPayload, ...override });
    assert.equal(result.ok, false, `expected rejection for ${JSON.stringify(override)}`);
    assert.equal(result.reason, "invalid");
  }
});

test("accepts every option the contact form actually renders", () => {
  for (const service of ALLOWED_SERVICES) {
    assert.equal(validateContactPayload({ ...validPayload, service }).ok, true, service);
  }
  for (const budget of ALLOWED_BUDGETS) {
    assert.equal(validateContactPayload({ ...validPayload, budget }).ok, true, budget || "(empty)");
  }
  for (const timeline of ALLOWED_TIMELINES) {
    assert.equal(validateContactPayload({ ...validPayload, timeline }).ok, true, timeline || "(empty)");
  }
});

test("ignores non-string fields instead of coercing them", () => {
  const result = validateContactPayload({
    ...validPayload,
    phone: { toString: () => "injected" },
  });

  assert.equal(result.ok, true);
  assert.equal(result.enquiry.phone, "");
});

test("strips newlines from single-line fields to block header injection", () => {
  const injected = readSingleLine(
    { name: "Jane\r\nBcc: attacker@example.com" },
    "name",
    FIELD_LIMITS.fullName,
  );

  assert.doesNotMatch(injected, /[\r\n]/);
  assert.equal(injected, "Jane Bcc: attacker@example.com");
});

test("a newline-laden name cannot forge extra lines in the email body", () => {
  const result = validateContactPayload({
    ...validPayload,
    fullName: "Jane\nEmail: attacker@example.com",
  });

  assert.equal(result.ok, true);
  const body = formatEnquiryEmail(result.enquiry);
  assert.equal(body.split("\n").filter((line) => line.startsWith("Email:")).length, 1);
});

test("truncates over-long fields at their documented cap", () => {
  const result = validateContactPayload({ ...validPayload, message: "x".repeat(9000) });

  assert.equal(result.ok, true);
  assert.equal(result.enquiry.message.length, FIELD_LIMITS.message);
});

test("email pattern accepts real addresses and rejects obvious junk", () => {
  for (const good of ["a@b.co", "first.last@sub.domain.com.au", "x+tag@example.org"]) {
    assert.equal(isValidEmail(good), true, good);
  }
  for (const bad of ["", "a@b", "a b@c.com", "@example.com", "no-at-sign.com"]) {
    assert.equal(isValidEmail(bad), false, bad);
  }
});

test("formatted email includes every captured field", () => {
  const result = validateContactPayload({ ...validPayload });
  const body = formatEnquiryEmail(result.enquiry);

  assert.match(body, /Name: Jane Doe/);
  assert.match(body, /Email: jane@example\.com/);
  assert.match(body, /Phone: 0400 000 000/);
  assert.match(body, /We need a new site/);
});

test("blank optional fields render an explicit placeholder", () => {
  const result = validateContactPayload({ ...validPayload, phone: "", budget: "", timeline: "" });
  const body = formatEnquiryEmail(result.enquiry);

  assert.match(body, /Phone: Not supplied/);
  assert.match(body, /Approx\. budget: Not selected/);
});

const requestWith = (headers) => new Request("https://www.abwebstudio.com.au/api/contact", {
  method: "POST",
  headers,
});

test("accepts same-origin posts and requests with no Origin header", () => {
  assert.equal(isSameOriginRequest(requestWith({ host: "www.abwebstudio.com.au" })), true);
  assert.equal(
    isSameOriginRequest(requestWith({
      host: "www.abwebstudio.com.au",
      origin: "https://www.abwebstudio.com.au",
    })),
    true,
  );
});

test("rejects cross-origin and malformed Origin headers", () => {
  assert.equal(
    isSameOriginRequest(requestWith({
      host: "www.abwebstudio.com.au",
      origin: "https://attacker.example",
    })),
    false,
  );
  assert.equal(
    isSameOriginRequest(requestWith({ host: "www.abwebstudio.com.au", origin: "not a url" })),
    false,
  );
});

test("honours x-forwarded-host when the platform proxies the request", () => {
  assert.equal(
    isSameOriginRequest(requestWith({
      host: "internal.vercel.app",
      "x-forwarded-host": "www.abwebstudio.com.au",
      "x-forwarded-proto": "https",
      origin: "https://www.abwebstudio.com.au",
    })),
    true,
  );
});

test("rate limit allows a burst then blocks the same address", () => {
  resetRateLimitState();
  const request = requestWith({ "x-forwarded-for": "203.0.113.9" });

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    assert.equal(withinRateLimit(request), true, `attempt ${attempt} should pass`);
  }
  assert.equal(withinRateLimit(request), false, "sixth attempt should be blocked");
});

test("rate limit windows are per address and reset over time", () => {
  resetRateLimitState();
  const first = requestWith({ "x-forwarded-for": "203.0.113.1" });
  const second = requestWith({ "x-forwarded-for": "203.0.113.2" });

  for (let attempt = 0; attempt < 6; attempt += 1) withinRateLimit(first);
  assert.equal(withinRateLimit(first), false);
  assert.equal(withinRateLimit(second), true, "a different address is unaffected");

  const later = Date.now() + 11 * 60 * 1000;
  assert.equal(withinRateLimit(first, later), true, "window resets after it expires");
});

test("rejects a body larger than the byte cap without buffering it all", async () => {
  const oversized = JSON.stringify({ message: "x".repeat(20_000) });
  const request = new Request("https://www.abwebstudio.com.au/api/contact", {
    method: "POST",
    body: oversized,
  });

  await assert.rejects(
    () => readContactPayload(request),
    (error) => error instanceof ContactBodyError && error.kind === "body-too-large",
  );
});

test("rejects non-JSON and non-object bodies", async () => {
  for (const body of ["not json at all", '"a string"', "[1,2,3]"]) {
    const request = new Request("https://www.abwebstudio.com.au/api/contact", {
      method: "POST",
      body,
    });
    await assert.rejects(
      () => readContactPayload(request),
      (error) => error instanceof ContactBodyError && error.kind === "malformed",
      `expected malformed for ${body}`,
    );
  }
});

test("parses a well-formed JSON body", async () => {
  const request = new Request("https://www.abwebstudio.com.au/api/contact", {
    method: "POST",
    body: JSON.stringify(validPayload),
  });

  const payload = await readContactPayload(request);
  assert.equal(payload.email, "jane@example.com");
});
