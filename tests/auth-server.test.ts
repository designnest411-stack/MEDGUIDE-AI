import { describe, it, expect } from "vitest";
import { verifyAuthToken } from "@/lib/auth.server";

describe("Server-Side Firebase Auth Verifier", () => {
  it("should reject requests without Authorization header", async () => {
    const req = new Request("https://example.com/api/consult", { method: "POST" });
    const res = await verifyAuthToken(req);
    expect(res.authenticated).toBe(false);
    expect(res.user).toBeNull();
    expect(res.error).toContain("Missing or malformed Authorization header");
  });

  it("should reject malformed Authorization headers", async () => {
    const req = new Request("https://example.com/api/consult", {
      method: "POST",
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    const res = await verifyAuthToken(req);
    expect(res.authenticated).toBe(false);
    expect(res.user).toBeNull();
  });

  it("should reject non-JWT token strings", async () => {
    const req = new Request("https://example.com/api/consult", {
      method: "POST",
      headers: { Authorization: "Bearer not-a-valid-jwt" },
    });
    const res = await verifyAuthToken(req);
    expect(res.authenticated).toBe(false);
    expect(res.error).toContain("Malformed JWT");
  });

  it("should reject expired Firebase tokens", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "123" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: "user-12345",
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200,
      }),
    ).toString("base64url");
    const signature = "fake-sig";

    const req = new Request("https://example.com/api/consult", {
      method: "POST",
      headers: { Authorization: `Bearer ${header}.${payload}.${signature}` },
    });
    const res = await verifyAuthToken(req);
    expect(res.authenticated).toBe(false);
    expect(res.error).toContain("expired");
  });

  it("should reject tokens with missing subject UID", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000) - 60,
      }),
    ).toString("base64url");
    const signature = "fake-sig";

    const req = new Request("https://example.com/api/consult", {
      method: "POST",
      headers: { Authorization: `Bearer ${header}.${payload}.${signature}` },
    });
    const res = await verifyAuthToken(req);
    expect(res.authenticated).toBe(false);
    expect(res.error).toContain("missing valid user subject UID");
  });

  it("should accept valid unexpired Firebase token and extract user claims", async () => {
    const projectId = process.env["VITE_FIREBASE_PROJECT_ID"] || "clinical-insight-engine";
    const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        aud: projectId,
        iss: `https://securetoken.google.com/${projectId}`,
        sub: "clinician_dr_sharma_981",
        email: "sharma.clinician@aiims.edu",
        name: "Dr. R. Sharma",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000) - 60,
      }),
    ).toString("base64url");
    const signature = "fake-sig";

    const req = new Request("https://example.com/api/consult", {
      method: "POST",
      headers: { Authorization: `Bearer ${header}.${payload}.${signature}` },
    });
    const res = await verifyAuthToken(req);
    expect(res.authenticated).toBe(true);
    expect(res.user?.uid).toBe("clinician_dr_sharma_981");
    expect(res.user?.email).toBe("sharma.clinician@aiims.edu");
    expect(res.user?.name).toBe("Dr. R. Sharma");
  });
});
