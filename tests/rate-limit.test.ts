import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit.server";

describe("Sliding Window API Rate Limiter", () => {
  function createMockRequest(ip: string): Request {
    return new Request("https://example.com/api/consult", {
      headers: {
        "x-forwarded-for": ip,
      },
    });
  }

  it("should allow requests within max limit and report remaining quota", () => {
    const ip = "192.168.1.100";
    const prefix = "test-allow";
    const req = createMockRequest(ip);

    const res1 = checkRateLimit(req, prefix, { maxRequests: 3, windowMs: 10_000 });
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(req, prefix, { maxRequests: 3, windowMs: 10_000 });
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(req, prefix, { maxRequests: 3, windowMs: 10_000 });
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("should block with 429 when max limit is exceeded", () => {
    const ip = "192.168.1.101";
    const prefix = "test-block";
    const req = createMockRequest(ip);

    // Consume the 2 allowed requests
    checkRateLimit(req, prefix, { maxRequests: 2, windowMs: 10_000 });
    checkRateLimit(req, prefix, { maxRequests: 2, windowMs: 10_000 });

    // 3rd request should fail
    const blocked = checkRateLimit(req, prefix, { maxRequests: 2, windowMs: 10_000 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.response).toBeDefined();
    expect(blocked.response?.status).toBe(429);
    expect(blocked.response?.headers.get("Retry-After")).toBeDefined();
    expect(blocked.response?.headers.get("X-RateLimit-Limit")).toBe("2");
  });

  it("should differentiate clients by IP address", () => {
    const prefix = "test-clients";
    const reqA = createMockRequest("10.0.0.1");
    const reqB = createMockRequest("10.0.0.2");

    // Client A consumes quota
    checkRateLimit(reqA, prefix, { maxRequests: 1, windowMs: 10_000 });
    const blockedA = checkRateLimit(reqA, prefix, { maxRequests: 1, windowMs: 10_000 });
    expect(blockedA.success).toBe(false);

    // Client B still has quota
    const allowedB = checkRateLimit(reqB, prefix, { maxRequests: 1, windowMs: 10_000 });
    expect(allowedB.success).toBe(true);
    expect(allowedB.remaining).toBe(0);
  });
});
