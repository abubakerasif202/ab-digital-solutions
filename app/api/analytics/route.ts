import { NextRequest, NextResponse } from "next/server";
import { clickHouseConfigured, insertAnalyticsEvent } from "../../lib/clickhouse";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4_096;
const allowedEvents = new Set(["page_view", "cta_click", "web_vital"]);
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

  let payload: Payload;
  try {
    const parsed: unknown = await request.json();
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

  try {
    await insertAnalyticsEvent({
      event_name: eventName as "page_view" | "cta_click" | "web_vital",
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

  return new NextResponse(null, { status: 204 });
}
