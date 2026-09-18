import { NextResponse } from "next/server";
import { PASS_COOKIE, verifyPassToken } from "@/lib/pass";

export const runtime = "nodejs";

/**
 * Success-redirect landing for Lemon Squeezy checkouts.
 *
 * The checkout's redirect_url is /api/pass/activate?token=<signed pass token>
 * (minted server-side when the checkout was created — see lib/pass.ts). We
 * verify the HMAC signature + expiry, set the HttpOnly `droplist_pass` cookie,
 * and send the buyer to /app. No database involved.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const pass = verifyPassToken(token);

  if (!pass || !token) {
    return NextResponse.redirect(new URL("/app?paid=invalid", url));
  }

  const res = NextResponse.redirect(new URL("/app?paid=1", url));
  res.cookies.set(PASS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(1, Math.floor((pass.exp - Date.now()) / 1000)),
  });
  return res;
}
