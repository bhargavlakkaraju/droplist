import crypto from "crypto";

/**
 * Stateless paid-pass model (no database, no accounts).
 *
 * When we create a Lemon Squeezy checkout we also mint a signed token
 * `{ tier, exp }` and put it in the checkout's success redirect URL
 * (`/api/pass/activate?token=…`). After payment, Lemon Squeezy redirects the
 * buyer there; we verify the signature and set an HttpOnly `droplist_pass`
 * cookie. The classify API then skips the free character cap while the
 * cookie's token is valid.
 *
 * Expiry starts at checkout creation, not payment:
 *   - single pass → 24 hours
 *   - week pass   → 7 days
 * (A checkout link that sits unpaid for hours loses a bit of pass time; for a
 * ₹49/$1 product with no DB this is an acceptable trade-off, documented in the
 * README.)
 *
 * Tokens are HMAC-SHA256 signed with PASS_SIGNING_SECRET (falls back to
 * LEMONSQUEEZY_API_KEY so a minimal setup works). They cannot be forged
 * client-side.
 */

export type PassTier = "single" | "week";

export const PASS_COOKIE = "droplist_pass";

const PASS_DURATION_MS: Record<PassTier, number> = {
  single: 24 * 60 * 60 * 1000, // 24h
  week: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export function passDurationMs(tier: PassTier): number {
  return PASS_DURATION_MS[tier];
}

function signingSecret(): string | null {
  return (
    process.env.PASS_SIGNING_SECRET || process.env.LEMONSQUEEZY_API_KEY || null
  );
}

function sign(payloadB64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("hex");
}

/** Mint a signed pass token. Returns null if no signing secret is configured. */
export function createPassToken(
  tier: PassTier,
  now: number = Date.now(),
): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  const payload = Buffer.from(
    JSON.stringify({ t: tier, e: now + PASS_DURATION_MS[tier] }),
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export type VerifiedPass = { tier: PassTier; exp: number };

/** Verify signature + expiry. Returns null for anything invalid. */
export function verifyPassToken(
  token: string | null | undefined,
  now: number = Date.now(),
): VerifiedPass | null {
  if (!token) return null;
  const secret = signingSecret();
  if (!secret) return null;

  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(payload, secret);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      t?: unknown;
      e?: unknown;
    };
    if (data.t !== "single" && data.t !== "week") return null;
    if (typeof data.e !== "number" || data.e <= now) return null;
    return { tier: data.t, exp: data.e };
  } catch {
    return null;
  }
}

/** Read + verify the pass cookie from a request's Cookie header. */
export function passFromCookieHeader(
  cookieHeader: string | null,
): VerifiedPass | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === PASS_COOKIE) {
      return verifyPassToken(decodeURIComponent(part.slice(eq + 1).trim()));
    }
  }
  return null;
}
