import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Lemon Squeezy webhook — POST /api/webhooks/lemonsqueezy
 *
 * Verifies the X-Signature header (HMAC-SHA256 of the raw body with
 * LEMONSQUEEZY_WEBHOOK_SECRET) and acknowledges order events.
 *
 * v0 has no database and no accounts, so there is nothing to persist here:
 * access is granted by the pre-signed unlock token in the checkout's success
 * redirect (see lib/pass.ts + /api/pass/activate). This endpoint exists so
 * payments are observable server-side (Vercel logs) and as the extension
 * point for when accounts/DB land — grant durable access on `order_created`
 * here at that point.
 */
export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        message:
          "Webhook not configured. Set LEMONSQUEEZY_WEBHOOK_SECRET to the signing secret from the Lemon Squeezy webhook settings.",
      },
      { status: 501 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: Record<string, string> };
    data?: { id?: string; attributes?: { total?: number; currency?: string } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.meta?.event_name ?? "unknown";

  if (event === "order_created" || event === "order_paid") {
    const custom = payload.meta?.custom_data ?? {};
    console.log(
      `[lemonsqueezy] ${event} order=${payload.data?.id} tier=${custom.tier} market=${custom.market} total=${payload.data?.attributes?.total} ${payload.data?.attributes?.currency}`,
    );
    // No DB in v0 — unlock happens via the signed redirect token.
    return NextResponse.json({ received: true, event });
  }

  return NextResponse.json({ received: true, event, ignored: true });
}
