import { after, NextRequest, NextResponse } from "next/server";
import { clickHouseConfigured, insertAnalyticsEvent } from "../../lib/clickhouse";
import { withinRateLimit, type RateLimitPolicy } from "../contact/rate-limit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4_096;
// Generous for real browsing (a page view plus up to six web vitals per page)
// while capping what one address can write into the analytics table.
const ANALYTICS_RATE_POLICY: RateLimitPolicy = { scope: "analytics", windowMs: 10 * 60 * 1000, maxRequests: 300, storeBackoffMs: 30_000, failOpenWhenFull: true };
const allowedEvents = new Set(["page_view", "cta_click", "web_vital", "project_enquiry"]);
const allowedMetrics = new Set(["CLS", "FCP", "FID", "INP", "LCP", "TTFB"]);
const allowedRatings = new Set(["", "good", "needs-improvement", "poor"]);

type Payload = Record<string, unknown>;

function textValue(payload: Payload, key: string, max: number) {
  const value = payload[key];
  return typeof value === "string"
    ? value.trim().replace(/[\r\n\t]+/g, " ").slice(0, max)
    : "";
}

function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto
    || (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");

  if (!host) return false;

  try {
    return new URL(origin).origin === `${protocol}://${host}`;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return new NextResponse(null, { status: 403 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  if (!clickHouseConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  // Same client-IP precedence as the contact route (Vercel overwrites these headers).
  const clientIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
  if (!await withinRateLimit(clientIp, ANALYTICS_RATE_POLICY)) {
    return new NextResponse(null, { status: 429, headers: { "Retry-After": "600", "Cache-Control": "no-store" } });
  }

  let payload: Payload;
  try {
    if (!request.body) return new NextResponse(null, { status: 400 });
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let body = "";
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return new NextResponse(null, { status: 413 });
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new NextResponse(null, { status: 400 });
    }
    payload = parsed as Payload;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const eventName = textValue(payload, "event_name", 40);
  if (!allowedEvents.has(eventName)) return new NextResponse(null, { status: 400 });

  const path = textValue(payload, "path", 512);
  if (!path.startsWith("/")) return new NextResponse(null, { status: 400 });

  const metricName = textValue(payload, "metric_name", 24);
  const metricRating = textValue(payload, "metric_rating", 32);
  const metricValue = typeof payload.metric_value === "number" && Number.isFinite(payload.metric_value)
    ? Math.max(-1_000_000_000, Math.min(1_000_000_000, payload.metric_value))
    : 0;

  if (eventName === "web_vital" && !allowedMetrics.has(metricName)) {
    return new NextResponse(null, { status: 400 });
  }
  if (!allowedRatings.has(metricRating)) return new NextResponse(null, { status: 400 });

  const writeEvent = async () => {
    try {
      await insertAnalyticsEvent({
        event_name: eventName as "page_view" | "cta_click" | "web_vital" | "project_enquiry",
        path,
        label: textValue(payload, "label", 160),
        metric_name: metricName,
        metric_value: metricValue,
        metric_rating: metricRating,
        navigation_type: textValue(payload, "navigation_type", 40),
        user_agent: request.headers.get("user-agent")?.slice(0, 300) || "",
      });
    } catch (error) {
      console.error(
        "ClickHouse analytics write failed:",
        error instanceof Error ? error.message : "unknown error",
      );
    }
  };

  // The beacon needs no result, so respond first and write after. Outside a
  // request scope (unit tests) after() throws; write inline there.
  try {
    after(writeEvent);
  } catch {
    await writeEvent();
  }

  return new NextResponse(null, { status: 204 });
}
