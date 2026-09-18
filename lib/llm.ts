import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { mockClassify } from "./mock";
import type { Bucket, ClassifiedItem, ClassifyResult, Lang } from "./types";
import { BUCKETS, MAX_ITEMS } from "./types";

type Provider = "openai" | "anthropic" | "mock";

function resolveProvider(): Provider {
  const forced = process.env.LLM_PROVIDER?.toLowerCase();
  if (forced === "openai" || forced === "anthropic" || forced === "mock") {
    return forced;
  }
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "mock";
}

function parseItems(raw: string): ClassifiedItem[] {
  // Strip accidental markdown fences and grab the outermost JSON object.
  const cleaned = raw.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in LLM response");
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as {
    items?: Array<{ text?: unknown; bucket?: unknown; reason?: unknown }>;
  };
  if (!Array.isArray(parsed.items)) throw new Error("Missing items array");

  const items: ClassifiedItem[] = [];
  for (const it of parsed.items) {
    const bucket = String(it.bucket ?? "").toUpperCase() as Bucket;
    if (!BUCKETS.includes(bucket)) continue;
    const text = String(it.text ?? "").trim();
    const reason = String(it.reason ?? "").trim();
    if (!text) continue;
    items.push({ text, bucket, reason });
    if (items.length >= MAX_ITEMS) break;
  }
  if (items.length === 0) throw new Error("LLM returned zero valid items");
  return items;
}

async function callOpenAI(text: string, lang: Lang): Promise<ClassifiedItem[]> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(lang) },
        { role: "user", content: buildUserPrompt(text) },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return parseItems(data.choices[0]?.message?.content ?? "");
}

async function callAnthropic(text: string, lang: Lang): Promise<ClassifiedItem[]> {
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: buildSystemPrompt(lang),
      messages: [{ role: "user", content: buildUserPrompt(text) }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const textBlock = data.content.find((b) => b.type === "text")?.text ?? "";
  return parseItems(textBlock);
}

export async function classify(text: string, lang: Lang): Promise<ClassifyResult> {
  const provider = resolveProvider();

  if (provider !== "mock") {
    try {
      const items =
        provider === "anthropic"
          ? await callAnthropic(text, lang)
          : await callOpenAI(text, lang);
      return { items, mode: "llm", lang };
    } catch (err) {
      console.error(`[droplist] ${provider} classification failed, falling back to mock:`, err);
    }
  }

  return { items: mockClassify(text, lang), mode: "mock", lang };
}
