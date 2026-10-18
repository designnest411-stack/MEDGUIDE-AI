/**
 * In-memory sliding window rate limiter for server endpoints.
 * Protects Gemini Free Tier quota and prevents API flooding.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const clients = new Map<string, RateLimitRecord>();

// Clean up stale client entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of clients.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 120_000);
      if (record.timestamps.length === 0) {
        clients.delete(key);
      }
    }
  }, 300_000);
}

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default: 60,000 = 1 min)
  maxRequests?: number; // Max allowed requests within window (default: 20)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  response?: Response;
}

export function checkRateLimit(
  request: Request,
  prefix: string,
  options: RateLimitOptions = {},
): RateLimitResult {
  const windowMs = options.windowMs || 60_000;
  const maxRequests = options.maxRequests || 20;

  // Extract client identifier from standard proxy/CDN headers or fallback
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");
  const ip = cfIp || (forwarded ? forwarded.split(",")[0]?.trim() : realIp) || "127.0.0.1";

  const key = `${prefix}:${ip}`;
  const now = Date.now();

  let record = clients.get(key);
  if (!record) {
    record = { timestamps: [] };
    clients.set(key, record);
  }

  // Remove timestamps outside current sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  const resetMs =
    record.timestamps.length > 0
      ? Math.max(0, windowMs - (now - record.timestamps[0]!))
      : windowMs;

  if (record.timestamps.length >= maxRequests) {
    const retryAfterSec = Math.ceil(resetMs / 1000);
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetMs,
      response: new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait a moment before sending another request.",
          retryAfter: retryAfterSec,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSec),
            "X-RateLimit-Limit": String(maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil((now + resetMs) / 1000)),
          },
        },
      ),
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, maxRequests - record.timestamps.length);

  return {
    success: true,
    limit: maxRequests,
    remaining,
    resetMs,
  };
}
