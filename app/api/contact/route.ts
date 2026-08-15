import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { siteConfig } from "../../site-config";
import { MAX_BODY_BYTES, validateContactPayload } from "../../../lib/contact/schema";
import {
  ContactBodyError,
  deliverEnquiry,
  isSameOriginRequest,
  readContactPayload,
  withinRateLimit,
} from "../../../lib/contact/service";
import type { ContactPayload } from "../../../lib/contact/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "This request could not be verified." }, { status: 403 });
  }

  if (!withinRateLimit(request)) {
    return NextResponse.json(
      { error: "Too many enquiries. Please wait a few minutes or contact us directly." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "This enquiry is too large." }, { status: 413 });
  }

  let payload: ContactPayload;
  try {
    payload = await readContactPayload(request);
  } catch (error) {
    const tooLarge = error instanceof ContactBodyError && error.kind === "body-too-large";
    return NextResponse.json(
      { error: tooLarge ? "This enquiry is too large." : "Invalid enquiry." },
      { status: tooLarge ? 413 : 400 },
    );
  }

  const validation = validateContactPayload(payload);
  if (!validation.ok) {
    // Honeypot hits get an indistinguishable success response.
    if (validation.reason === "spam") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const delivery = await deliverEnquiry(validation.enquiry, siteConfig.email);
  if (delivery.ok) return NextResponse.json({ ok: true });

  if (delivery.kind === "not-configured") {
    return NextResponse.json(
      { error: `Online enquiries are temporarily unavailable. Please email ${siteConfig.email}.` },
      { status: 503 },
    );
  }

  if (delivery.kind === "unreachable") {
    return NextResponse.json(
      { error: `Email delivery is temporarily unavailable. Please email ${siteConfig.email}.` },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { error: `We could not send your enquiry. Please email ${siteConfig.email}.` },
    { status: 502 },
  );
}
