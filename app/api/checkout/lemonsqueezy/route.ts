import { NextResponse } from "next/server";
import { createPassToken, type PassTier } from "@/lib/pass";

export const runtime = "nodejs";

/**
 * Lemon Squeezy checkout — the ONLY payment provider.
 *
 * Body: { tier: "single" | "week", market: "in" | "global" }
 *
 * The merchant creates four one-time products/variants in the Lemon Squeezy
 * dashboard (India ₹49/₹199 display pricing, global $1/$5) and maps them here
 * via env vars. If the store is USD-only and the INR variants aren't
 * configured, the India tiers fall back to the USD variants (price the USD
 * variants at the INR equivalents, e.g. ~$0.59/~$2.39, in the dashboard).
 *
 * We create the checkout with a success redirect that carries a pre-signed
 * unlock token (see lib/pass.ts) so paid access works with zero storage.
 */

type Market = "in" | "global";

const VARIANT_ENV: Record<Market, Record<PassTier, string>> = {
  in: {
    single: "LEMONSQUEEZY_VARIANT_SINGLE_INR",
    week: "LEMONSQUEEZY_VARIANT_WEEK_INR",
  },
  global: {
    single: "LEMONSQUEEZY_VARIANT_SINGLE_USD",
    week: "LEMONSQUEEZY_VARIANT_WEEK_USD",
  },
};

function appUrl(): string {
  const raw = process.env.APP_URL || "https://droplist-seven.vercel.app";
  return raw.replace(/\/+$/, "");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    tier?: string;
    market?: string;
  };
  const tier: PassTier = body.tier === "week" ? "week" : "single";
  const market: Market = body.market === "in" ? "in" : "global";

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  // INR variants are optional: fall back to the USD variant for the same tier
  // when the Lemon Squeezy store is USD-only.
  const preferredEnv = VARIANT_ENV[market][tier];
  const fallbackEnv = VARIANT_ENV.global[tier];
  const variantId = process.env[preferredEnv] || process.env[fallbackEnv];

  const missing = [
    !apiKey && "LEMONSQUEEZY_API_KEY",
    !storeId && "LEMONSQUEEZY_STORE_ID",
    !variantId && `${preferredEnv} (or ${fallbackEnv} as a USD fallback)`,
  ].filter(Boolean);

  if (missing.length > 0) {
    return NextResponse.json(
      {
        configured: false,
        provider: "lemonsqueezy",
        tier,
        market,
        message: `Lemon Squeezy is not configured yet. Missing env: ${missing.join(", ")}. See .env.example and README.`,
      },
      { status: 501 },
    );
  }

  // Pre-signed unlock token embedded in the success redirect. Verified and
  // exchanged for an HttpOnly cookie by /api/pass/activate after payment.
  const passToken = createPassToken(tier);
  if (!passToken) {
    return NextResponse.json(
      {
        configured: false,
        provider: "lemonsqueezy",
        message:
          "Cannot sign unlock tokens. Set PASS_SIGNING_SECRET (any long random string).",
      },
      { status: 501 },
    );
  }

  const redirectUrl = `${appUrl()}/api/pass/activate?token=${encodeURIComponent(passToken)}`;

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_options: { embed: true },
        product_options: { redirect_url: redirectUrl },
        checkout_data: { custom: { tier, market } },
      },
      relationships: {
        store: { data: { type: "stores", id: String(storeId) } },
        variant: { data: { type: "variants", id: String(variantId) } },
      },
    },
  };

  let res: Response;
  try {
    res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach Lemon Squeezy. Try again in a moment." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`Lemon Squeezy checkout failed (${res.status}): ${detail}`);
    return NextResponse.json(
      {
        message: `Lemon Squeezy rejected the checkout (HTTP ${res.status}). Check the store/variant IDs and API key.`,
      },
      { status: 502 },
    );
  }

  const json = (await res.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const url = json.data?.attributes?.url;
  if (!url) {
    return NextResponse.json(
      { message: "Lemon Squeezy did not return a checkout URL." },
      { status: 502 },
    );
  }

  return NextResponse.json({ url });
}
