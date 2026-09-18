"use client";

import { useState } from "react";

type Tier = {
  tier: "single" | "week";
  market: "in" | "global";
  name: string;
  price: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
};

// All four cards check out through Lemon Squeezy — the tier/market pair maps
// to one of four one-time variants configured in the merchant dashboard.
const TIERS: Tier[] = [
  {
    tier: "single",
    market: "in",
    name: "Single Pass · India",
    price: "₹49",
    blurb: "24 hours of full-size brain dumps.",
    features: ["Unlimited characters for 24h", "PDF + share card", "EN + Hindi"],
  },
  {
    tier: "week",
    market: "in",
    name: "Week Pass · India",
    price: "₹199",
    blurb: "Seven days of unlimited dumps.",
    features: ["Unlimited dumps for 7 days", "PDF + share card", "EN + Hindi"],
    highlight: true,
  },
  {
    tier: "single",
    market: "global",
    name: "Single Pass · Global",
    price: "$1",
    blurb: "24 hours of full-size brain dumps.",
    features: ["Unlimited characters for 24h", "PDF + share card", "EN + Hindi"],
  },
  {
    tier: "week",
    market: "global",
    name: "Week Pass · Global",
    price: "$5",
    blurb: "Seven days of unlimited dumps.",
    features: ["Unlimited dumps for 7 days", "PDF + share card", "EN + Hindi"],
  },
];

export default function Pricing() {
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function startCheckout(tier: Tier) {
    const key = `${tier.market}-${tier.tier}`;
    setBusy(key);
    setNotice(null);
    try {
      const res = await fetch("/api/checkout/lemonsqueezy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tier.tier, market: tier.market }),
      });
      const data = (await res.json()) as { message?: string; url?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(
        data.message ??
          "Checkout is not live yet — Lemon Squeezy is not configured.",
      );
    } catch {
      setNotice("Checkout is not live yet — Lemon Squeezy is not configured.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const key = `${tier.market}-${tier.tier}`;
          return (
            <div
              key={key}
              className={`flex flex-col rounded-2xl border p-6 ${
                tier.highlight
                  ? "border-zinc-900 shadow-[0_2px_0_0_#18181b]"
                  : "border-zinc-200"
              }`}
            >
              <p className="text-sm font-medium text-zinc-500">{tier.name}</p>
              <p className="mt-2 text-4xl font-bold tracking-tight">{tier.price}</p>
              <p className="mt-2 text-sm text-zinc-600">{tier.blurb}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-zinc-700">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden className="text-zinc-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startCheckout(tier)}
                disabled={busy === key}
                className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  tier.highlight
                    ? "bg-zinc-900 text-white hover:bg-zinc-700"
                    : "border border-zinc-300 text-zinc-900 hover:border-zinc-900"
                } disabled:opacity-50`}
              >
                {busy === key ? "…" : "Get pass"}
              </button>
            </div>
          );
        })}
      </div>
      {notice && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {notice}
        </p>
      )}
      <p className="mt-4 text-sm text-zinc-500">
        Free tier: one sample demo, or your own dump up to 600 characters.
        Payments handled by Lemon Squeezy.
      </p>
    </div>
  );
}
