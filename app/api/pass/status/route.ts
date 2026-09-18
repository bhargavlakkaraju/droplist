import { NextResponse } from "next/server";
import { passFromCookieHeader } from "@/lib/pass";

export const runtime = "nodejs";

/**
 * Pass status for the client UI. The `droplist_pass` cookie is HttpOnly, so
 * the browser asks here whether a paid pass is active (to hide the free
 * character cap). Enforcement itself happens server-side in /api/classify.
 */
export async function GET(req: Request) {
  const pass = passFromCookieHeader(req.headers.get("cookie"));
  if (!pass) {
    return NextResponse.json({ active: false });
  }
  return NextResponse.json({
    active: true,
    tier: pass.tier,
    expiresAt: pass.exp,
  });
}
