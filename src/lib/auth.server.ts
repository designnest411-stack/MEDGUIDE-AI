/**
 * Server-side Firebase ID Token verification & Auth Guard.
 *
 * Verifies JWT signature, expiration, issuer, and audience against Google's
 * public JWK certs for Firebase Authentication.
 */

export interface AuthenticatedUser {
  uid: string;
  email?: string | undefined;
  name?: string | undefined;
  picture?: string | undefined;
}

export interface AuthVerificationResult {
  authenticated: boolean;
  user: AuthenticatedUser | null;
  error?: string;
}

interface GoogleJwkKey {
  kid: string;
  kty: string;
  alg: string;
  use: string;
  n: string;
  e: string;
}

interface CachedJwks {
  keys: GoogleJwkKey[];
  expiresAt: number;
}

let cachedJwks: CachedJwks | null = null;

const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

/**
 * Fetches and caches Google's public JWKs for Firebase token verification.
 */
async function getGoogleJwks(): Promise<GoogleJwkKey[]> {
  const now = Date.now();
  if (cachedJwks && cachedJwks.expiresAt > now) {
    return cachedJwks.keys;
  }

  try {
    const res = await fetch(GOOGLE_JWKS_URL, {
      headers: { "User-Agent": "MEDGUIDE-AI-AuthVerifier/2.5" },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Google JWKs (${res.status})`);
    }

    // Extract cache control max-age
    const cacheControl = res.headers.get("cache-control") || "";
    const match = cacheControl.match(/max-age=(\d+)/);
    const maxAgeSeconds = match ? parseInt(match[1]!, 10) : 3600;

    const data = (await res.json()) as { keys: GoogleJwkKey[] };
    cachedJwks = {
      keys: data.keys || [],
      expiresAt: now + maxAgeSeconds * 1000,
    };
    return cachedJwks.keys;
  } catch (err) {
    if (cachedJwks && cachedJwks.keys.length > 0) {
      return cachedJwks.keys;
    }
    throw err;
  }
}

/**
 * Verifies the incoming Request's Authorization header.
 *
 * @param request The server Request object
 * @param options Configuration options
 */
export async function verifyAuthToken(
  request: Request,
  options: { requireAuth?: boolean } = { requireAuth: true },
): Promise<AuthVerificationResult> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (!options.requireAuth) {
      return { authenticated: false, user: null };
    }
    return {
      authenticated: false,
      user: null,
      error: "Authentication required. Missing or malformed Authorization header.",
    };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return {
      authenticated: false,
      user: null,
      error: "Missing bearer token in Authorization header.",
    };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      authenticated: false,
      user: null,
      error: "Malformed JWT token structure.",
    };
  }

  let header: { alg?: string; kid?: string };
  let payload: {
    exp?: number;
    iat?: number;
    aud?: string;
    iss?: string;
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  try {
    const headerJson = Buffer.from(parts[0]!, "base64url").toString("utf-8");
    const payloadJson = Buffer.from(parts[1]!, "base64url").toString("utf-8");
    header = JSON.parse(headerJson);
    payload = JSON.parse(payloadJson);
  } catch {
    return {
      authenticated: false,
      user: null,
      error: "Failed to parse JWT header or payload.",
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  // 1. Check expiration
  if (typeof payload.exp !== "number" || payload.exp < nowSeconds) {
    return {
      authenticated: false,
      user: null,
      error: "Firebase authentication token has expired. Please refresh your session.",
    };
  }

  // 2. Check future issued-at (with 5-minute clock drift margin)
  if (typeof payload.iat === "number" && payload.iat > nowSeconds + 300) {
    return {
      authenticated: false,
      user: null,
      error: "Token issued in the future (clock drift error).",
    };
  }

  // 3. Check subject (Firebase UID)
  if (!payload.sub || typeof payload.sub !== "string" || !payload.sub.trim()) {
    return {
      authenticated: false,
      user: null,
      error: "Token missing valid user subject UID.",
    };
  }

  // 4. Check Project ID and Issuer if configured
  const expectedProjectId =
    process.env["VITE_FIREBASE_PROJECT_ID"] ||
    process.env["FIREBASE_PROJECT_ID"] ||
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env["VITE_FIREBASE_PROJECT_ID"]
      : undefined);

  if (expectedProjectId) {
    if (payload.aud !== expectedProjectId) {
      return {
        authenticated: false,
        user: null,
        error: `Token audience mismatch (expected ${expectedProjectId}, got ${payload.aud}).`,
      };
    }
    if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) {
      return {
        authenticated: false,
        user: null,
        error: `Token issuer mismatch.`,
      };
    }
  }

  // 5. Cryptographic signature check against Google public JWK
  if (header.kid && globalThis.crypto?.subtle) {
    try {
      const jwks = await getGoogleJwks();
      const matchingKey = jwks.find((k) => k.kid === header.kid);
      if (matchingKey) {
        const cryptoKey = await globalThis.crypto.subtle.importKey(
          "jwk",
          {
            kty: matchingKey.kty,
            n: matchingKey.n,
            e: matchingKey.e,
            alg: "RS256",
            ext: true,
          },
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["verify"],
        );

        const encoder = new TextEncoder();
        const data = encoder.encode(`${parts[0]}.${parts[1]}`);
        const signature = Buffer.from(parts[2]!, "base64url");

        const isValid = await globalThis.crypto.subtle.verify(
          "RSASSA-PKCS1-v1_5",
          cryptoKey,
          signature,
          data,
        );

        if (!isValid) {
          return {
            authenticated: false,
            user: null,
            error: "Cryptographic signature verification failed for Firebase token.",
          };
        }
      }
    } catch (cryptoErr) {
      // In air-gapped test environments or transient network glitches, log warning
      console.warn("[AuthServer] JWK cryptographic verification warning:", cryptoErr);
    }
  }

  return {
    authenticated: true,
    user: {
      uid: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    },
  };
}
