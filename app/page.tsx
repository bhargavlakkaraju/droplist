import Link from "next/link";
import Pricing from "@/components/Pricing";

const DEMO_INPUT = [
  "finish the Q3 sales report by Friday",
  "reply to 40 unread WhatsApp messages",
  "learn Spanish someday",
  "redesign my portfolio website",
  "plan cousin's birthday party",
  "fix the leaking kitchen tap",
];

const DEMO_OUTPUT: Array<{
  bucket: "DROP" | "DELAY" | "DELEGATE";
  text: string;
  reason: string;
}> = [
  { bucket: "DROP", text: "Learn Spanish someday", reason: "\u201cSomeday\u201d means never. Cut it or book a class today." },
  { bucket: "DROP", text: "Reply to 40 WhatsApp messages", reason: "Reply to 3 that matter. Archive the rest." },
  { bucket: "DELAY", text: "Redesign portfolio website", reason: "No client is blocked on this. Revisit next month." },
  { bucket: "DELAY", text: "Finish Q3 report by Friday", reason: "Keep — but it's your ONLY deadline this week." },
  { bucket: "DELEGATE", text: "Plan cousin's birthday party", reason: "Split it with two relatives. One message each." },
  { bucket: "DELEGATE", text: "Fix the leaking kitchen tap", reason: "A plumber does this in 20 minutes. Call one." },
];

const BUCKET_STYLES: Record<string, string> = {
  DROP: "bg-red-50 text-red-700 border-red-200",
  DELAY: "bg-amber-50 text-amber-700 border-amber-200",
  DELEGATE: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function LandingPage() {
  return (
    <main>
      {/* Nav */}
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold tracking-tight">
            Drop<span className="text-red-600">List</span>
          </span>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <a href="#demo" className="text-zinc-600 hover:text-zinc-900">
              Demo
            </a>
            <a href="#pricing" className="text-zinc-600 hover:text-zinc-900">
              Pricing
            </a>
            <Link
              href="/app"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
            >
              Try it free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-20 text-center">
        <p className="mx-auto mb-5 w-fit rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600">
          The AI not-to-do coach · English + हिन्दी
        </p>
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Your to-do list isn&apos;t the problem.
          <br />
          <span className="text-red-600">Your not-to-do list is missing.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
          Paste everything on your plate — work, family, WhatsApp noise, vague
          goals. DropList hands back a ruthless verdict on every line:{" "}
          <strong className="text-zinc-900">DROP</strong>,{" "}
          <strong className="text-zinc-900">DELAY</strong>, or{" "}
          <strong className="text-zinc-900">DELEGATE</strong> — each with one
          short reason. One paste → relief.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/app"
            className="rounded-xl bg-zinc-900 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-zinc-700"
          >
            Cut my list — free demo
          </Link>
          <a
            href="#pricing"
            className="rounded-xl border border-zinc-300 px-7 py-3.5 text-base font-semibold text-zinc-900 transition-colors hover:border-zinc-900"
          >
            See pricing
          </a>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          No account needed. Our goal: 100 paid lists in 30 days — help us get
          there.
        </p>
      </section>

      {/* Demo */}
      <section id="demo" className="border-y border-zinc-100 bg-zinc-50/60 py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            What it looks like
          </h2>
          <p className="mt-2 text-center text-zinc-600">
            A real messy dump in, a decisive list out.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                You paste
              </p>
              <ul className="space-y-2 font-mono text-sm text-zinc-700">
                {DEMO_INPUT.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                DropList returns
              </p>
              <ul className="space-y-3">
                {DEMO_OUTPUT.map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 shrink-0 rounded-md border px-2 py-0.5 text-xs font-bold ${BUCKET_STYLES[item.bucket]}`}
                    >
                      {item.bucket}
                    </span>
                    <span className="text-sm">
                      <span className="font-medium text-zinc-900">
                        {item.text}
                      </span>{" "}
                      <span className="text-zinc-500">— {item.reason}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Three steps, under a minute
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Dump it",
              body: "One line per item. Deadlines, chores, guilt, half-baked ambitions — everything.",
            },
            {
              step: "2",
              title: "Pick a language",
              body: "English or natural Hindi. Not a broken translation — the way a sharp friend actually talks.",
            },
            {
              step: "3",
              title: "Get the verdict",
              body: "Up to 12 items, each in exactly one bucket with one blunt reason. Copy it, PDF it, share it.",
            },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-zinc-200 p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                {s.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-zinc-100 bg-zinc-50/60 py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Pay once. No subscription guilt.
          </h2>
          <p className="mt-2 text-center text-zinc-600">
            An app about dropping things will not chain you to a monthly plan.
          </p>
          <div className="mt-10">
            <Pricing />
          </div>
        </div>
      </section>

      {/* WhatsApp — Phase 2 */}
      <section className="mx-auto max-w-5xl px-5 py-16 text-center">
        <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-zinc-300 p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Phase 2
          </p>
          <h3 className="mt-2 text-2xl font-bold">WhatsApp bot — coming soon</h3>
          <p className="mt-2 text-zinc-600">
            Forward your chaos to a number, get your not-to-do list back where
            the chaos lives. Not blocking launch on it.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 text-sm text-zinc-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} DropList. Subtraction as a service.
          </span>
          <span>
            Not medical, legal, or therapeutic advice — ever.
          </span>
        </div>
      </footer>
    </main>
  );
}
