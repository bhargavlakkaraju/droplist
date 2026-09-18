"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SAMPLE_DUMP, bucketLabel, t } from "@/lib/i18n";
import { renderResultCanvas } from "@/lib/card";
import type { Bucket, ClassifyResult, Lang } from "@/lib/types";
import { BUCKETS } from "@/lib/types";

const FREE_CHAR_LIMIT = 600;
const STORAGE_KEY = "droplist:last";

const BUCKET_STYLES: Record<
  Bucket,
  { badge: string; border: string; hintKey: string }
> = {
  DROP: {
    badge: "bg-red-50 text-red-700 border-red-200",
    border: "border-red-200",
    hintKey: "dropHint",
  },
  DELAY: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    border: "border-amber-200",
    hintKey: "delayHint",
  },
  DELEGATE: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-blue-200",
    hintKey: "delegateHint",
  },
};

type PassStatus = { active: boolean; tier?: "single" | "week"; expiresAt?: number };

export default function BrainDump() {
  const [lang, setLang] = useState<Lang>("en");
  const [text, setText] = useState("");
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overLimit, setOverLimit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);
  const [pass, setPass] = useState<PassStatus>({ active: false });
  const [paidBanner, setPaidBanner] = useState<"success" | "invalid" | null>(null);
  const lastSubmitRef = useRef<{ text: string; sample: boolean } | null>(null);

  // Paid pass: the droplist_pass cookie is HttpOnly, so ask the server whether
  // one is active (UI only — enforcement lives in /api/classify). Also surface
  // the ?paid= result of the Lemon Squeezy success redirect once, then clean
  // the URL.
  useEffect(() => {
    void fetch("/api/pass/status")
      .then((res) => res.json() as Promise<PassStatus>)
      .then(setPass)
      .catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (paid === "1") setPaidBanner("success");
    else if (paid === "invalid") setPaidBanner("invalid");
    if (paid) {
      params.delete("paid");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (qs ? `?${qs}` : ""),
      );
    }
  }, []);

  // Restore last result (nothing sensitive — optional convenience, v0 spec).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as ClassifyResult & { input?: string };
        if (Array.isArray(saved.items) && saved.items.length > 0) {
          setResult(saved);
          if (saved.lang === "hi" || saved.lang === "en") setLang(saved.lang);
          if (typeof saved.input === "string") setText(saved.input);
        }
      }
    } catch {
      // Ignore corrupt storage.
    }
  }, []);

  const submit = useCallback(
    async (dumpText: string, sample: boolean) => {
      const trimmed = dumpText.trim();
      if (!trimmed) {
        setError(t(lang, "empty"));
        return;
      }
      setLoading(true);
      setError(null);
      setOverLimit(false);
      lastSubmitRef.current = { text: trimmed, sample };
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed, lang, sample }),
        });
        if (res.status === 402) {
          setOverLimit(true);
          return;
        }
        if (!res.ok) {
          setError(t(lang, "error"));
          return;
        }
        const data = (await res.json()) as ClassifyResult;
        setResult(data);
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...data, input: trimmed }),
          );
        } catch {
          // Storage full/blocked — non-fatal.
        }
      } catch {
        setError(t(lang, "error"));
      } finally {
        setLoading(false);
      }
    },
    [lang],
  );

  const grouped = useMemo(() => {
    if (!result) return [];
    return BUCKETS.map((bucket) => ({
      bucket,
      items: result.items.filter((i) => i.bucket === bucket),
    })).filter((g) => g.items.length > 0);
  }, [result]);

  const formatPlain = useCallback(() => {
    if (!result) return "";
    const lines: string[] = [
      lang === "hi" ? "मेरी NOT-TO-DO लिस्ट — DropList" : "MY NOT-TO-DO LIST — DropList",
      "",
    ];
    for (const g of grouped) {
      lines.push(bucketLabel(result.lang, g.bucket));
      for (const item of g.items) {
        lines.push(`- ${item.text} — ${item.reason}`);
      }
      lines.push("");
    }
    return lines.join("\n").trim();
  }, [result, grouped, lang]);

  async function copyAll() {
    const plain = formatPlain();
    if (!plain) return;
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function downloadPdf() {
    if (!result) return;
    setExporting("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      // Render as an image so Devanagari displays correctly.
      const canvas = renderResultCanvas(result.items, result.lang, { width: 1240 });
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const imgH = (canvas.height / canvas.width) * pageW;
      if (imgH <= pageH) {
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageW, imgH);
      } else {
        // Slice the canvas into page-height chunks.
        const sliceHeightPx = Math.floor((pageH / pageW) * canvas.width);
        for (let offset = 0, page = 0; offset < canvas.height; offset += sliceHeightPx, page++) {
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = Math.min(sliceHeightPx, canvas.height - offset);
          const ctx = slice.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(canvas, 0, -offset);
          if (page > 0) pdf.addPage();
          pdf.addImage(
            slice.toDataURL("image/png"),
            "PNG",
            0,
            0,
            pageW,
            (slice.height / slice.width) * pageW,
          );
        }
      }
      pdf.save("droplist.pdf");
    } finally {
      setExporting(null);
    }
  }

  async function shareImage() {
    if (!result) return;
    setExporting("image");
    try {
      // Portrait, Reels/Stories friendly.
      const canvas = renderResultCanvas(result.items, result.lang, {
        width: 1080,
        minHeight: 1350,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;
      const file = new File([blob], "droplist-card.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "My not-to-do list" });
          return;
        } catch {
          // User cancelled or share failed — fall through to download.
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "droplist-card.png";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  const charCount = text.length;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900">
          {t(lang, "back")}
        </Link>
        <div
          role="group"
          aria-label="Language"
          className="flex overflow-hidden rounded-lg border border-zinc-300 text-sm font-semibold"
        >
          {(["en", "hi"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`px-4 py-1.5 transition-colors ${
                lang === l ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {l === "en" ? "EN" : "हिं"}
            </button>
          ))}
        </div>
      </header>

      <h1 className="text-3xl font-extrabold tracking-tight">{t(lang, "appTitle")}</h1>
      <p className="mt-2 text-zinc-600">{t(lang, "appSubtitle")}</p>

      {paidBanner === "success" && (
        <p className="mt-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
          {t(lang, "paidSuccess")}
        </p>
      )}
      {paidBanner === "invalid" && (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t(lang, "paidInvalid")}
        </p>
      )}

      <div className="mt-6">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOverLimit(false);
          }}
          placeholder={t(lang, "placeholder")}
          rows={9}
          className="w-full resize-y rounded-xl border border-zinc-300 p-4 font-mono text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
          {pass.active ? (
            <>
              <span className="font-medium text-green-700">
                {t(lang, "passActiveNote", {
                  d: pass.expiresAt
                    ? new Date(pass.expiresAt).toLocaleString(
                        lang === "hi" ? "hi-IN" : "en-IN",
                        { dateStyle: "medium", timeStyle: "short" },
                      )
                    : "—",
                })}
              </span>
              <span>{charCount}</span>
            </>
          ) : (
            <>
              <span>{t(lang, "charLimitNote", { n: FREE_CHAR_LIMIT })}</span>
              <span
                className={charCount > FREE_CHAR_LIMIT ? "font-semibold text-red-600" : ""}
              >
                {charCount}/{FREE_CHAR_LIMIT}
              </span>
            </>
          )}
        </div>
      </div>

      {overLimit && (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t(lang, "overLimit", { n: FREE_CHAR_LIMIT })}{" "}
          <Link href="/#pricing" className="font-semibold underline">
            {t(lang, "seePricing")}
          </Link>
        </div>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => submit(text, false)}
          disabled={loading}
          className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? t(lang, "loading") : t(lang, "submit")}
        </button>
        <button
          onClick={() => {
            const sample = SAMPLE_DUMP[lang];
            setText(sample);
            void submit(sample, true);
          }}
          disabled={loading}
          className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:border-zinc-900 disabled:opacity-50"
        >
          {t(lang, "trySample")}
        </button>
      </div>

      {result && (
        <section className="mt-10" aria-live="polite">
          {result.mode === "mock" && (
            <p className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs text-zinc-600">
              {t(lang, "mockNotice")}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const last = lastSubmitRef.current;
                if (last) void submit(last.text, last.sample);
              }}
              disabled={loading}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold transition-colors hover:border-zinc-900 disabled:opacity-50"
            >
              {t(lang, "regenerate")}
            </button>
            <button
              onClick={copyAll}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold transition-colors hover:border-zinc-900"
            >
              {copied ? t(lang, "copied") : t(lang, "copyAll")}
            </button>
            <button
              onClick={downloadPdf}
              disabled={exporting === "pdf"}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold transition-colors hover:border-zinc-900 disabled:opacity-50"
            >
              {t(lang, "downloadPdf")}
            </button>
            <button
              onClick={shareImage}
              disabled={exporting === "image"}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold transition-colors hover:border-zinc-900 disabled:opacity-50"
            >
              {t(lang, "shareCard")}
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {grouped.map((group) => {
              const style = BUCKET_STYLES[group.bucket];
              return (
                <div key={group.bucket} className={`rounded-2xl border ${style.border} p-5`}>
                  <div className="flex items-baseline gap-3">
                    <span className={`rounded-md border px-2.5 py-1 text-sm font-bold ${style.badge}`}>
                      {bucketLabel(result.lang, group.bucket)}
                    </span>
                    <span className="text-xs text-zinc-500">{t(result.lang, style.hintKey)}</span>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {group.items.map((item, idx) => (
                      <li key={`${group.bucket}-${idx}`}>
                        <p className="font-semibold text-zinc-900">{item.text}</p>
                        <p className="text-sm text-zinc-600">{item.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
