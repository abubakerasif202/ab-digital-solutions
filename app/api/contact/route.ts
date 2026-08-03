import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "../../site-config";

export const runtime = "nodejs";

type ContactPayload = Record<string, unknown>;
const requests = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function value(payload: ContactPayload, key: string, max: number) {
  const item = payload[key];
  return typeof item === "string" ? item.trim().slice(0, max) : "";
}

function singleLine(payload: ContactPayload, key: string, max: number) {
  return value(payload, key, max).replace(/[\r\n\t]+/g, " ");
}

function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");
  if (!host) return false;
  try { return new URL(origin).origin === `${protocol}://${host}`; } catch { return false; }
}

function withinRateLimit(request: NextRequest) {
  const now = Date.now();
  if (requests.size > 500) {
    for (const [key, entry] of requests) if (entry.resetAt <= now) requests.delete(key);
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const current = requests.get(ip);
  if (!current || current.resetAt <= now) {
    requests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return NextResponse.json({ error: "This request could not be verified." }, { status: 403 });
  if (!withinRateLimit(request)) return NextResponse.json({ error: "Too many enquiries. Please wait a few minutes or contact us directly." }, { status: 429 });

  let payload: ContactPayload;
  try { payload = await request.json() as ContactPayload; } catch { return NextResponse.json({ error: "Invalid enquiry." }, { status: 400 }); }

  if (singleLine(payload, "company", 100)) return NextResponse.json({ ok: true });

  const firstName = singleLine(payload, "firstName", 80);
  const lastName = singleLine(payload, "lastName", 80);
  const email = singleLine(payload, "email", 254);
  const phone = singleLine(payload, "phone", 50);
  const service = singleLine(payload, "service", 100);
  const budget = singleLine(payload, "budget", 100);
  const timeline = singleLine(payload, "timeline", 100);
  const message = value(payload, "message", 4000);
  if (!firstName || !lastName || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please complete your name, email and project details." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: `Online enquiries are temporarily unavailable. Please email ${siteConfig.email}.` }, { status: 503 });

  const lines = [
    `Name: ${firstName} ${lastName}`, `Email: ${email}`, `Phone: ${phone || "Not supplied"}`,
    `Service: ${service || "Not selected"}`, `Approx. budget: ${budget || "Not selected"}`,
    `Ideal timeline: ${timeline || "Not selected"}`, "", "Project details:", message,
  ];
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "AB Digital Solutions <onboarding@resend.dev>",
        to: [siteConfig.email],
        reply_to: email,
        subject: `Website enquiry from ${firstName} ${lastName}`,
        text: lines.join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json({ error: `Email delivery is temporarily unavailable. Please email ${siteConfig.email}.` }, { status: 502 });
  }
  if (!response.ok) {
    console.error("Contact delivery failed", response.status);
    return NextResponse.json({ error: `We could not send your enquiry. Please email ${siteConfig.email}.` }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
