import type { Bucket, ClassifiedItem, Lang } from "./types";
import { MAX_ITEMS } from "./types";

/**
 * Deterministic keyword-based classifier used when no LLM key is configured.
 * Good enough to demo the product loop end-to-end; clearly labeled as mock in the UI.
 */

const DROP_HINTS = [
  "someday", "maybe", "podcast", "scroll", "news", "linkedin", "every",
  "all notifications", "redesign", "rebrand", "perfect", "again", "tabs",
  "whatsapp", "unread", "notifications",
  "कभी", "शायद", "पॉडकास्ट", "स्क्रॉल", "हर ", "टैब", "फिर से", "मैसेज", "अनरीड",
];

const DELEGATE_HINTS = [
  "fix", "repair", "plumber", "tap", "clean", "book", "order", "party",
  "invoice", "schedule", "call the", "renew", "doctor", "lawyer", "therapy",
  "medical", "legal", "नल", "ठीक", "पार्टी", "बुक", "इनवॉइस", "डॉक्टर", "वकील",
];

const PROFESSIONAL_HINTS = [
  "doctor", "medical", "diagnos", "lawyer", "legal", "lawsuit", "therapy",
  "therapist", "depress", "anxiety", "डॉक्टर", "वकील", "थेरेपी", "डिप्रेशन",
];

const REASONS: Record<Lang, Record<Bucket, string[]>> = {
  en: {
    DROP: [
      "Vanity task. Nobody is waiting for this.",
      "This is noise pretending to be work.",
      "If it mattered, you'd have done it months ago.",
      "Cutting this costs you nothing.",
    ],
    DELAY: [
      "Real, but not this week. Park it.",
      "Deadline pressure beats vague ambition. Later.",
      "Revisit when the current fire is out.",
      "It survives a 30-day wait. Prove it matters.",
    ],
    DELEGATE: [
      "Someone else does this faster and cheaper.",
      "Your hourly rate says hand this off.",
      "Needed, but not needed from YOU.",
      "One message hands this to the right person.",
    ],
  },
  hi: {
    DROP: [
      "दिखावे का काम है। कोई इसका इंतज़ार नहीं कर रहा।",
      "यह काम नहीं, शोर है।",
      "ज़रूरी होता तो कब का हो गया होता।",
      "इसे छोड़ने से कुछ नहीं बिगड़ेगा।",
    ],
    DELAY: [
      "काम असली है, पर इस हफ़्ते नहीं। पार्क करो।",
      "पहले डेडलाइन, बाद में सपने।",
      "अभी की आग बुझे, फिर देखेंगे।",
      "30 दिन रुक सकता है तो ज़रूरी साबित हो।",
    ],
    DELEGATE: [
      "कोई और यह जल्दी और सस्ते में कर देगा।",
      "आपका समय इससे ज़्यादा कीमती है। सौंप दो।",
      "काम ज़रूरी है, पर आपसे नहीं।",
      "एक मैसेज में यह सही इंसान के पास पहुँच जाएगा।",
    ],
  },
};

const PRO_REASON: Record<Lang, string> = {
  en: "This needs a qualified professional, not a list app.",
  hi: "इसके लिए क्वालिफ़ाइड प्रोफ़ेशनल चाहिए, लिस्ट ऐप नहीं।",
};

function hashLine(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickBucket(line: string): Bucket {
  const lower = line.toLowerCase();
  if (PROFESSIONAL_HINTS.some((k) => lower.includes(k))) return "DELEGATE";
  if (DROP_HINTS.some((k) => lower.includes(k))) return "DROP";
  if (DELEGATE_HINTS.some((k) => lower.includes(k))) return "DELEGATE";
  // Deterministic spread for unmatched lines, biased toward DELAY.
  const h = hashLine(line) % 4;
  return h === 0 ? "DROP" : h === 1 ? "DELEGATE" : "DELAY";
}

export function mockClassify(text: string, lang: Lang): ClassifiedItem[] {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter((l) => l.length > 0)
    .slice(0, MAX_ITEMS);

  return lines.map((line) => {
    const lower = line.toLowerCase();
    const isPro = PROFESSIONAL_HINTS.some((k) => lower.includes(k));
    const bucket = pickBucket(line);
    const pool = REASONS[lang][bucket];
    const reason = isPro ? PRO_REASON[lang] : pool[hashLine(line) % pool.length];
    const short = line.length > 60 ? line.slice(0, 57).trimEnd() + "…" : line;
    return { text: short, bucket, reason };
  });
}
