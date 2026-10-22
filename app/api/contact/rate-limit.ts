import { createHash } from "node:crypto";

type MemoryEntry = { count: number; resetAt: number };

const requests = new Map<string, MemoryEntry>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_MEMORY_KEYS = 5000;
export const RATE_LIMIT_RETRY_SECONDS = WINDOW_MS / 1000;

function memoryRateLimit(key: string) {
  const now = Date.now();
  if (requests.size > 500) {
    for (const [storedKey, entry] of requests) {
      if (entry.resetAt <= now) requests.delete(storedKey);
    }
  }

  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    if (!current && requests.size >= MAX_MEMORY_KEYS) return false;
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  current.count += 1;
  return current.count <= MAX_REQUESTS;
}

// Atomic transaction: increment and first-request expiry cannot interleave.
async function upstashRateLimit(key: string, url: string, token: string) {
  const redisKey = `contact-rate:${key}`;
  const response = await fetch(`${url.replace(/\/$/, "")}/multi-exec`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, WINDOW_MS, "NX"],
    ]),
    signal: AbortSignal.timeout(3_000),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`rate-limit-store-${response.status}`);
  const result: unknown = await response.json();
  if (!Array.isArray(result) || result.length !== 2
    || !result.every((entry: unknown) => entry !== null && typeof entry === "object" && !("error" in entry))) {
    throw new Error("rate-limit-store-invalid-response");
  }
  const count: unknown = result[0]?.result;
  const expiry: unknown = result[1]?.result;
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 1 || (expiry !== 0 && expiry !== 1)) {
    throw new Error("rate-limit-store-invalid-response");
  }
  return count <= MAX_REQUESTS;
}

let warnedMissingConfig = false;

function isProduction() {
  return process.env.VERCEL_ENV === "production"
    || (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");
}

export async function withinRateLimit(clientIp: string) {
  // Keep raw visitor addresses out of both Redis and the bounded local store.
  const key = createHash("sha256").update(clientIp).digest("hex");
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    // The per-instance memory fallback stays available for local development, but
    // on serverless production it multiplies the limit by instance count — say so.
    if (isProduction() && !warnedMissingConfig) {
      warnedMissingConfig = true;
      console.error(
        "Contact rate limiting is running on the per-instance fallback: "
        + "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not configured.",
      );
    }
    return memoryRateLimit(key);
  }

  try {
    const endpoint = new URL(url);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password
      || endpoint.search || endpoint.hash || endpoint.pathname !== "/") {
      throw new Error("rate-limit-store-invalid-url");
    }
    return await upstashRateLimit(key, url, token);
  } catch {
    // Log the failure class only; never surface store details to the client.
    console.error(
      "Shared contact rate limit unavailable; using per-instance fallback:",
      "Store request failed or returned an invalid result.",
    );
    return memoryRateLimit(key);
  }
}
