/**
 * Platform-agnostic contact enquiry pipeline.
 *
 * Everything here works against the standard `Request`/`fetch` interfaces, so
 * the same pipeline can back the Next.js route handler today and a Cloudflare
 * Worker later without a second implementation of the rules.
 */

import {
  MAX_BODY_BYTES,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  formatEnquiryEmail,
} from "./schema.ts";
import type { ContactEnquiry, ContactPayload } from "./types.ts";

/**
 * Per-instance rate-limit state.
 *
 * Deliberately in-memory: it throttles a single serverless instance only, which
 * blunts casual floods without adding a datastore dependency. It is not a
 * distributed limit and is not relied on as the only spam control — the
 * honeypot, origin check and body cap all sit in front of it.
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_ENTRY_CEILING = 500;

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  // Same-origin form posts and non-browser clients may omit Origin entirely.
  if (!origin) return true;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  if (!host) return false;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol = forwardedProto || (isLocal ? "http" : "https");

  try {
    return new URL(origin).origin === `${protocol}://${host}`;
  } catch {
    return false;
  }
}

export function withinRateLimit(request: Request, now = Date.now()): boolean {
  if (requestCounts.size > RATE_LIMIT_ENTRY_CEILING) {
    for (const [key, entry] of requestCounts) {
      if (entry.resetAt <= now) requestCounts.delete(key);
    }
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const current = requestCounts.get(ip);
  if (!current || current.resetAt <= now) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  current.count += 1;
  return current.count <= RATE_LIMIT_MAX_REQUESTS;
}

/** Test seam: clears rate-limit state between cases. */
export function resetRateLimitState(): void {
  requestCounts.clear();
}

export type ContactBodyErrorKind = "missing-body" | "body-too-large" | "malformed";

export class ContactBodyError extends Error {
  // Declared as a plain field rather than a constructor parameter property, so
  // the module stays parseable by Node's strip-only TypeScript support (which
  // the test suite relies on to import this file without a build step).
  readonly kind: ContactBodyErrorKind;

  constructor(kind: ContactBodyErrorKind) {
    super(kind);
    this.name = "ContactBodyError";
    this.kind = kind;
  }
}

/**
 * Streams and parses the request body, aborting as soon as the byte cap is
 * exceeded so an oversized payload is never fully buffered in memory.
 */
export async function readContactPayload(request: Request): Promise<ContactPayload> {
  if (!request.body) throw new ContactBodyError("missing-body");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    byteLength += chunk.byteLength;
    if (byteLength > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new ContactBodyError("body-too-large");
    }
    chunks.push(chunk);
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(body));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new ContactBodyError("malformed");
    }
    return parsed as ContactPayload;
  } catch (error) {
    if (error instanceof ContactBodyError) throw error;
    throw new ContactBodyError("malformed");
  }
}

export type DeliveryResult =
  | { ok: true }
  | { ok: false; kind: "not-configured" | "unreachable" | "rejected" };

/** Sends the enquiry via Resend. Never throws; failures come back as a result. */
export async function deliverEnquiry(
  enquiry: ContactEnquiry,
  fallbackRecipient: string,
): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, kind: "not-configured" };

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "AB Digital Solutions <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO_EMAIL?.trim() || fallbackRecipient],
        reply_to: enquiry.email,
        subject: `Website enquiry from ${enquiry.fullName}`,
        text: formatEnquiryEmail(enquiry),
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, kind: "unreachable" };
  }

  if (!response.ok) {
    // Status only. The response body can echo submitted values, which do not
    // belong in server logs.
    console.error("Contact delivery failed", response.status);
    return { ok: false, kind: "rejected" };
  }

  return { ok: true };
}
