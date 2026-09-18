import type { Bucket, Lang } from "./types";

/** UI strings for the app (tool) screen. Landing page stays English-first. */
export const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    appTitle: "Your not-to-do list",
    appSubtitle:
      "Dump everything on your plate. One line per item. We tell you what to drop, delay, or delegate — with reasons.",
    placeholder:
      "e.g.\nfinish Q3 report\nreply to 40 WhatsApp messages\nlearn Spanish someday\nplan cousin's birthday party\nredesign my portfolio site\n…",
    submit: "Cut my list",
    loading: "Being ruthless…",
    regenerate: "Regenerate",
    copyAll: "Copy all",
    copied: "Copied!",
    downloadPdf: "Download PDF",
    shareCard: "Share image",
    trySample: "Try a sample dump",
    charLimitNote: "Free: up to {n} characters. Paid unlocks full dumps.",
    overLimit:
      "That's over the free limit of {n} characters. Trim it, or unlock full dumps for ₹49 / $1.",
    empty: "Paste at least one line first.",
    error: "Something broke. Try again.",
    mockNotice:
      "Demo mode: no LLM key configured, results come from the built-in sample classifier.",
    dropLabel: "DROP",
    delayLabel: "DELAY",
    delegateLabel: "DELEGATE",
    dropHint: "Kill it. It was never worth your time.",
    delayHint: "Not now. Park it with zero guilt.",
    delegateHint: "Someone else's job. Hand it off.",
    seePricing: "See pricing",
    back: "← DropList",
    passActiveNote: "Pass active — no character limit until {d}.",
    paidSuccess: "Payment received — your pass is active. Dump away.",
    paidInvalid:
      "We couldn't verify that payment link. If you just paid, contact us — your money is safe with Lemon Squeezy.",
  },
  hi: {
    appTitle: "आपकी not-to-do लिस्ट",
    appSubtitle:
      "जो भी दिमाग़ में चल रहा है, सब लिख डालिए। हर लाइन में एक काम। हम बताएँगे क्या छोड़ना है, क्या टालना है, क्या किसी और को देना है — वजह के साथ।",
    placeholder:
      "जैसे:\nQ3 रिपोर्ट पूरी करनी है\n40 WhatsApp मैसेज का जवाब देना है\nकभी स्पैनिश सीखनी है\nकज़िन की बर्थडे पार्टी प्लान करनी है\nपोर्टफोलियो साइट फिर से बनानी है\n…",
    submit: "लिस्ट छाँटो",
    loading: "बेरहमी से छाँट रहे हैं…",
    regenerate: "फिर से बनाओ",
    copyAll: "सब कॉपी करो",
    copied: "कॉपी हो गया!",
    downloadPdf: "PDF डाउनलोड",
    shareCard: "इमेज शेयर करो",
    trySample: "सैंपल आज़माएँ",
    charLimitNote: "फ्री: {n} अक्षरों तक। पूरी लिस्ट के लिए पेड प्लान।",
    overLimit:
      "फ्री लिमिट {n} अक्षरों की है। लिस्ट छोटी करें, या ₹49 / $1 में पूरी लिस्ट अनलॉक करें।",
    empty: "पहले कम से कम एक लाइन लिखें।",
    error: "कुछ गड़बड़ हो गई। दोबारा कोशिश करें।",
    mockNotice:
      "डेमो मोड: LLM key सेट नहीं है, नतीजे बिल्ट-इन सैंपल क्लासिफ़ायर से आ रहे हैं।",
    dropLabel: "छोड़ो (DROP)",
    delayLabel: "टालो (DELAY)",
    delegateLabel: "सौंपो (DELEGATE)",
    dropHint: "इसे ख़त्म करो। यह आपके समय के लायक नहीं था।",
    delayHint: "अभी नहीं। बिना guilt के पार्क करो।",
    delegateHint: "यह किसी और का काम है। सौंप दो।",
    seePricing: "प्राइसिंग देखें",
    back: "← DropList",
    passActiveNote: "पास एक्टिव है — {d} तक कोई कैरेक्टर लिमिट नहीं।",
    paidSuccess: "पेमेंट मिल गई — आपका पास एक्टिव है। खुलकर लिखिए।",
    paidInvalid:
      "यह पेमेंट लिंक वेरिफ़ाई नहीं हो पाया। अगर आपने अभी पेमेंट की है तो हमसे संपर्क करें — आपका पैसा Lemon Squeezy के पास सुरक्षित है।",
  },
};

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

export function bucketLabel(lang: Lang, bucket: Bucket): string {
  const key =
    bucket === "DROP" ? "dropLabel" : bucket === "DELAY" ? "delayLabel" : "delegateLabel";
  return t(lang, key);
}

export const SAMPLE_DUMP: Record<Lang, string> = {
  en: [
    "finish the Q3 sales report by Friday",
    "reply to 40 unread WhatsApp messages",
    "learn Spanish someday",
    "redesign my portfolio website",
    "plan cousin's birthday party",
    "answer every LinkedIn connection request",
    "read the 6 open browser tabs about productivity",
    "fix the leaking kitchen tap",
    "start a podcast",
    "follow up with the freelance client about the invoice",
  ].join("\n"),
  hi: [
    "शुक्रवार तक Q3 सेल्स रिपोर्ट पूरी करनी है",
    "40 अनरीड WhatsApp मैसेज का जवाब देना है",
    "कभी स्पैनिश सीखनी है",
    "पोर्टफोलियो वेबसाइट फिर से बनानी है",
    "कज़िन की बर्थडे पार्टी प्लान करनी है",
    "हर LinkedIn रिक्वेस्ट का जवाब देना है",
    "productivity वाले 6 खुले टैब पढ़ने हैं",
    "किचन का टपकता नल ठीक करवाना है",
    "पॉडकास्ट शुरू करना है",
    "फ्रीलांस क्लाइंट से इनवॉइस का फॉलो-अप करना है",
  ].join("\n"),
};
