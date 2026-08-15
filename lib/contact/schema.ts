/**
 * Validation and sanitisation for contact enquiries.
 *
 * Kept free of Next.js and platform imports so the same rules can be exercised
 * directly by unit tests and reused by any future runtime (Node route handler,
 * Cloudflare Worker) without duplicating the logic.
 *
 * Deliberately dependency-free: the rule set is a fixed allow-list plus length
 * caps, which a schema library would not make safer, only heavier on the server
 * bundle.
 */

import type { ContactEnquiry, ContactPayload, ContactValidation } from "./types.ts";

export const MAX_BODY_BYTES = 12_000;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const RATE_LIMIT_MAX_REQUESTS = 5;

/** Upper bound per field. Values are truncated, never rejected, at these caps. */
export const FIELD_LIMITS = {
  company: 100,
  fullName: 160,
  firstName: 80,
  lastName: 80,
  email: 254,
  phone: 50,
  service: 100,
  budget: 100,
  timeline: 100,
  message: 4000,
} as const;

export const ALLOWED_SERVICES = new Set([
  "Website design & development",
  "SEO & local visibility",
  "Branding & content",
  "E-commerce solutions",
  "Digital marketing",
  "Website care & support",
]);

export const ALLOWED_BUDGETS = new Set([
  "",
  "$1,500–$3,000",
  "$3,000–$6,000",
  "$6,000+",
  "Not sure yet",
]);

export const ALLOWED_TIMELINES = new Set([
  "",
  "As soon as possible",
  "Within 1 month",
  "Within 2–3 months",
  "Just exploring",
]);

/** Reads a string field, trimmed and truncated. Non-strings become "". */
export function readField(payload: ContactPayload, key: string, max: number): string {
  const item = payload[key];
  return typeof item === "string" ? item.trim().slice(0, max) : "";
}

/**
 * Reads a field that must not span lines. Collapsing CR/LF/tab prevents header
 * injection when the value is interpolated into an email subject or body line.
 */
export function readSingleLine(payload: ContactPayload, key: string, max: number): string {
  return readField(payload, key, max).replace(/[\r\n\t]+/g, " ");
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/**
 * Validates a raw enquiry payload into a `ContactEnquiry`.
 *
 * Returns `{ ok: false, reason: "spam" }` when the honeypot field is filled so
 * the caller can answer with a normal success response.
 */
export function validateContactPayload(payload: ContactPayload): ContactValidation {
  if (readSingleLine(payload, "company", FIELD_LIMITS.company)) {
    return { ok: false, reason: "spam" };
  }

  const fullName = readSingleLine(payload, "fullName", FIELD_LIMITS.fullName)
    || [
      readSingleLine(payload, "firstName", FIELD_LIMITS.firstName),
      readSingleLine(payload, "lastName", FIELD_LIMITS.lastName),
    ].filter(Boolean).join(" ");

  const email = readSingleLine(payload, "email", FIELD_LIMITS.email);
  const phone = readSingleLine(payload, "phone", FIELD_LIMITS.phone);
  const service = readSingleLine(payload, "service", FIELD_LIMITS.service);
  const budget = readSingleLine(payload, "budget", FIELD_LIMITS.budget);
  const timeline = readSingleLine(payload, "timeline", FIELD_LIMITS.timeline);
  const message = readField(payload, "message", FIELD_LIMITS.message);

  if (!fullName || !message || !isValidEmail(email)) {
    return {
      ok: false,
      reason: "invalid",
      error: "Please complete your name, email and project details.",
    };
  }

  if (!ALLOWED_SERVICES.has(service) || !ALLOWED_BUDGETS.has(budget) || !ALLOWED_TIMELINES.has(timeline)) {
    return { ok: false, reason: "invalid", error: "Please choose the form options provided." };
  }

  return { ok: true, enquiry: { fullName, email, phone, service, budget, timeline, message } };
}

/** Renders a validated enquiry as the plain-text body of the notification email. */
export function formatEnquiryEmail(enquiry: ContactEnquiry): string {
  return [
    `Name: ${enquiry.fullName}`,
    `Email: ${enquiry.email}`,
    `Phone: ${enquiry.phone || "Not supplied"}`,
    `Service: ${enquiry.service || "Not selected"}`,
    `Approx. budget: ${enquiry.budget || "Not selected"}`,
    `Ideal timeline: ${enquiry.timeline || "Not selected"}`,
    "",
    "Project details:",
    enquiry.message,
  ].join("\n");
}
