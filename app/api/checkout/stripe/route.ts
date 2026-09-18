import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * PLACEHOLDER — Stripe checkout (global: $1 Single Pass / $5 Week Pass).
 *
 * To go live:
 * 1. Set STRIPE_SECRET_KEY (and STRIPE_PUBLISHABLE_KEY) in your env (see .env.example).
 * 2. Create a Stripe Checkout Session here (mode: "payment") and return { url }.
 * 3. Redirect the client to session.url; handle success/cancel routes.
 */
export async function POST(req: Request) {
  const { tier } = (await req.json().catch(() => ({}))) as { tier?: string };
  const amountCents = tier === "week" ? 500 : 100; // $5 / $1

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        configured: false,
        provider: "stripe",
        tier: tier === "week" ? "week" : "single",
        amount: amountCents,
        currency: "USD",
        message:
          "Stripe is not configured yet. Set STRIPE_SECRET_KEY to enable checkout.",
      },
      { status: 501 },
    );
  }

  // TODO(payments): create a real Stripe Checkout Session and return { url }.
  return NextResponse.json(
    {
      configured: true,
      provider: "stripe",
      message: "Key detected, but Checkout Session creation is not implemented in v0.",
    },
    { status: 501 },
  );
}
