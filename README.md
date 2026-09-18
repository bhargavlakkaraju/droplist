# DropList

**The AI not-to-do coach.** Paste everything on your plate — work, family, WhatsApp noise, vague goals — and get back a ruthless verdict on every line: **DROP**, **DELAY**, or **DELEGATE**, each with one short reason. English + Hindi. One paste → relief.

Built with Next.js (App Router), TypeScript, and Tailwind CSS. No accounts in v0.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in what you have (everything is optional)
npm run dev
```

Open http://localhost:3000 — landing page. The tool lives at http://localhost:3000/app.

**No API key? It still works.** With no LLM key configured, the classify API falls back to a built-in deterministic mock classifier so the whole product loop (dump → buckets → copy/PDF/share) is testable end-to-end. The UI labels mock results clearly.

## Environment variables

All variables are optional; see `.env.example` for the full annotated list.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables OpenAI classification (default model `gpt-4o-mini`, override with `OPENAI_MODEL`) |
| `ANTHROPIC_API_KEY` | Enables Anthropic classification (default model `claude-3-5-haiku-latest`, override with `ANTHROPIC_MODEL`) |
| `LLM_PROVIDER` | Force `openai` \| `anthropic` \| `mock`. Unset: Anthropic key wins, then OpenAI, then mock |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay checkout (India, ₹49 / ₹199) — **placeholder in v0**, endpoint returns 501 until implemented |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | Stripe checkout (global, $1 / $5) — **placeholder in v0**, endpoint returns 501 until implemented |
| `FREE_DUMP_CHAR_LIMIT` | Free-tier character cap for a dump (default `600`) |

Never commit real keys. Use `.env.local` locally and project env vars on Vercel.

## Deploy on Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new) — the Next.js preset needs zero config.
2. Add the env vars above under **Project → Settings → Environment Variables** (at minimum one LLM key for real classifications).
3. Deploy. The classify route runs on the Node.js runtime.

## Architecture

```
app/
  page.tsx                    # Marketing landing (hero, demo, pricing, WhatsApp Phase 2 note)
  app/page.tsx                # The tool: brain dump → buckets
  api/classify/route.ts       # POST { text, lang, sample? } → { items, mode }
  api/checkout/razorpay/…     # Payment placeholder (₹49 / ₹199) — returns 501 until keys + order flow added
  api/checkout/stripe/…       # Payment placeholder ($1 / $5) — returns 501 until keys + session flow added
components/
  BrainDump.tsx               # Client flow: textarea, EN|HI toggle, results, regenerate, copy, PDF, share card
  Pricing.tsx                 # Pricing tiers, calls checkout placeholders
lib/
  prompt.ts                   # LLM system prompt (bucket rules, ruthlessness, no medical/legal/therapy, natural Hindi)
  llm.ts                      # Provider resolution + OpenAI/Anthropic calls + mock fallback
  mock.ts                     # Deterministic keyword classifier for keyless demo mode
  card.ts                     # Canvas renderer for share PNG + PDF (handles Devanagari)
  i18n.ts                     # EN/HI UI strings + sample dumps
```

Notes:

- **Free tier**: the sample dump is always free; user dumps are capped at `FREE_DUMP_CHAR_LIMIT` characters (enforced server-side with a 402, mirrored client-side). Paid unlock is wired as UI + placeholder endpoints only in v0.
- **PDF/share card**: rendered via canvas and embedded as an image, because stock PDF fonts can't render Devanagari.
- **Storage**: nothing server-side. The last result is optionally kept in `localStorage` for convenience.
- **WhatsApp bot**: Phase 2 — mentioned on the landing page only, not blocking launch.

## Manual test checklist

Landing (`/`):

- [ ] Loads with dark-on-white styling, no console errors
- [ ] "Try it free" / "Cut my list" CTAs navigate to `/app`
- [ ] Demo section shows sample input → bucketed output
- [ ] Each pricing "Get pass" button shows the "checkout not live yet" notice (until payment keys + flows are implemented)
- [ ] WhatsApp section is clearly marked Phase 2 / coming soon

Tool (`/app`):

- [ ] "Try a sample dump" fills the textarea and returns items in up to 3 buckets (≤ 12 items total)
- [ ] Toggle to **हिं** and run the sample — UI strings and results are in natural Hindi
- [ ] Paste your own short dump (< 600 chars) → submit works
- [ ] Paste > 600 chars → amber over-limit notice with pricing link (server returns 402)
- [ ] Empty submit → validation message, no request fired
- [ ] **Regenerate** re-runs the same dump
- [ ] **Copy all** puts a plaintext bucketed list on the clipboard
- [ ] **Download PDF** saves a readable PDF (verify Hindi renders)
- [ ] **Share image** downloads (or natively shares) a portrait PNG card
- [ ] Reload the page → last result is restored from localStorage
- [ ] With no LLM key: results show the "demo mode" notice; with a key: notice absent and results come from the model

API:

- [ ] `curl -s localhost:3000/api/classify -X POST -H 'Content-Type: application/json' -d '{"text":"finish report\nlearn spanish someday","lang":"en"}'` returns JSON items
- [ ] Same call with `"lang":"hi"` returns Hindi reasons
- [ ] Oversized non-sample dump returns HTTP 402 with `FREE_LIMIT_EXCEEDED`

## Out of scope for v0

Accounts, streaks, social feed, team features, calendar sync, habit tracking, coaching community, WhatsApp bot (Phase 2).
