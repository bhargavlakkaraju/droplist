import { NextResponse } from "next/server";
import { classify } from "@/lib/llm";
import { passFromCookieHeader } from "@/lib/pass";
import type { ClassifyRequestBody, Lang } from "@/lib/types";

export const runtime = "nodejs";

const HARD_MAX_CHARS = 8000;

function freeCharLimit(): number {
  const n = Number(process.env.FREE_DUMP_CHAR_LIMIT);
  return Number.isFinite(n) && n > 0 ? n : 600;
}

export async function POST(req: Request) {
  let body: ClassifyRequestBody;
  try {
    body = (await req.json()) as ClassifyRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const lang: Lang = body.lang === "hi" ? "hi" : "en";

  if (!text) {
    return NextResponse.json({ error: "Empty brain dump" }, { status: 400 });
  }
  if (text.length > HARD_MAX_CHARS) {
    return NextResponse.json(
      { error: `Dump too large (max ${HARD_MAX_CHARS} characters)` },
      { status: 413 },
    );
  }

  // Free-tier cap. Sample dumps are always allowed so the demo works.
  // A valid paid pass (HttpOnly cookie set after Lemon Squeezy checkout —
  // see lib/pass.ts) removes the cap for its duration.
  const pass = passFromCookieHeader(req.headers.get("cookie"));
  const limit = freeCharLimit();
  if (!pass && !body.sample && text.length > limit) {
    return NextResponse.json(
      {
        error: "FREE_LIMIT_EXCEEDED",
        limit,
        message: `Free tier allows up to ${limit} characters. Unlock full dumps with a paid pass.`,
      },
      { status: 402 },
    );
  }

  const result = await classify(text, lang);
  return NextResponse.json(result);
}
