import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * PLACEHOLDER — Razorpay checkout (India: ₹49 Single Pass / ₹199 Week Pass).
 *
 * To go live:
 * 1. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your env (see .env.example).
 * 2. Create an order here via the Razorpay Orders API and return { orderId, keyId }.
 * 3. Open Razorpay Checkout on the client with that order, then verify the
 *    payment signature in a /api/checkout/razorpay/verify route.
 */
export async function POST(req: Request) {
  const { tier } = (await req.json().catch(() => ({}))) as { tier?: string };
  const amountPaise = tier === "week" ? 19900 : 4900; // ₹199 / ₹49

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      {
        configured: false,
        provider: "razorpay",
        tier: tier === "week" ? "week" : "single",
        amount: amountPaise,
        currency: "INR",
        message:
          "Razorpay is not configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable checkout.",
      },
      { status: 501 },
    );
  }

  // TODO(payments): create a real Razorpay order and return { orderId, keyId }.
  return NextResponse.json(
    {
      configured: true,
      provider: "razorpay",
      message: "Keys detected, but order creation is not implemented in v0.",
    },
    { status: 501 },
  );
}
