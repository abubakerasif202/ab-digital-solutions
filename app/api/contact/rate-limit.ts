type MemoryEntry = { count: number; resetAt: number };

const requests = new Map<string, MemoryEntry>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function memoryRateLimit(key: string) {
  const now = Date.now();
  if (requests.size > 500) {
    for (const [storedKey, entry] of requests) {
      if (entry.resetAt <= now) requests.delete(storedKey);
    }
  }

  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  current.count += 1;
  return current.count <= MAX_REQUESTS;
}

async function upstashRateLimit(key: string, url: string, token: string) {
  const redisKey = `contact-rate:${key}`;
  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
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
  const result = await response.json() as Array<{ result?: number }>;
  const count = Number(result[0]?.result);
  if (!Number.isFinite(count)) throw new Error("rate-limit-store-invalid-response");
  return count <= MAX_REQUESTS;
}

export async function withinRateLimit(key: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (url && token) {
    try {
      return await upstashRateLimit(key, url, token);
    } catch (error) {
      console.error("Shared contact rate limit unavailable; using local fallback", error);
    }
  }

  return memoryRateLimit(key);
}
