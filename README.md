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
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy API key (dashboard → Settings → API). Checkout returns 501 without it |
| `LEMONSQUEEZY_STORE_ID` | Numeric store ID (Settings → Stores) |
| `LEMONSQUEEZY_VARIANT_SINGLE_INR`, `LEMONSQUEEZY_VARIANT_WEEK_INR` | Variant IDs for the India-priced one-time passes (₹49 / ₹199). Optional if the store is USD-only — India tiers then fall back to the USD variants |
| `LEMONSQUEEZY_VARIANT_SINGLE_USD`, `LEMONSQUEEZY_VARIANT_WEEK_USD` | Variant IDs for the global one-time passes ($1 / $5) |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Signing secret for `POST /api/webhooks/lemonsqueezy` (X-Signature HMAC verification) |
| `PASS_SIGNING_SECRET` | Secret for signing stateless unlock tokens (any long random string). Falls back to the API key if unset |
| `APP_URL` | Public base URL for the post-checkout redirect (default `https://droplist-seven.vercel.app`) |
| `FREE_DUMP_CHAR_LIMIT` | Free-tier character cap for a dump (default `600`) |

Never commit real keys. Use `.env.local` locally and project env vars on Vercel.

## Payments — Lemon Squeezy setup

Lemon Squeezy is the **only** payment provider (it's a merchant of record, so
it handles global tax/compliance — one integration for India + global buyers).

One-time setup in the [Lemon Squeezy dashboard](https://app.lemonsqueezy.com):

1. **Create a store** (or use an existing one). Note the numeric store ID under
   Settings → Stores → `LEMONSQUEEZY_STORE_ID`.
2. **Create four one-time products** (single-payment, NOT subscriptions) and
   copy each default variant's ID into the matching env var:
   - Single Pass India (display ₹49) → `LEMONSQUEEZY_VARIANT_SINGLE_INR`
   - Week Pass India (display ₹199) → `LEMONSQUEEZY_VARIANT_WEEK_INR`
   - Single Pass Global ($1) → `LEMONSQUEEZY_VARIANT_SINGLE_USD`
   - Week Pass Global ($5) → `LEMONSQUEEZY_VARIANT_WEEK_USD`

   Lemon Squeezy stores usually price in USD. If yours is USD-only, skip the
   two `*_INR` variants and price the USD ones at the INR equivalents
   (~$0.59 and ~$2.39): the app automatically falls back to the USD variant
   for India-tier checkouts. The marketing site keeps showing ₹49/₹199.
3. **Create an API key** under Settings → API → `LEMONSQUEEZY_API_KEY`.
4. **Add a webhook** under Settings → Webhooks pointing at
   `https://<your-domain>/api/webhooks/lemonsqueezy`, subscribed to
   `order_created`. Copy its signing secret → `LEMONSQUEEZY_WEBHOOK_SECRET`.
5. Set `PASS_SIGNING_SECRET` to a long random string (`openssl rand -hex 32`)
   and `APP_URL` to your deployed URL.

**Note for India merchants:** Lemon Squeezy payouts to India are via PayPal
unless you have a Stripe India bank account invite — check your payout settings
before going live.

### How paid unlock works (no database, no accounts)

1. `POST /api/checkout/lemonsqueezy` with `{ tier: "single"|"week", market: "in"|"global" }`
   picks the variant, mints an HMAC-signed unlock token `{ tier, exp }`
   (single = 24h, week = 7 days, clocked from checkout creation), and creates a
   Lemon Squeezy checkout whose success `redirect_url` is
   `/api/pass/activate?token=…`. The client redirects to the returned checkout `url`.
2. After payment, Lemon Squeezy redirects the buyer to `/api/pass/activate`,
   which verifies the token signature + expiry and sets an **HttpOnly
   `droplist_pass` cookie**, then lands on `/app?paid=1`.
3. `/api/classify` skips the free 600-character cap whenever the request
   carries a valid (signed, unexpired) pass cookie. `/api/pass/status` lets the
   UI show "pass active" (the cookie itself is HttpOnly).
4. The webhook verifies the `X-Signature` HMAC and logs `order_created` —
   nothing is stored in v0; it's the extension point for when accounts/DB land.

Trade-offs of the stateless model (fine for a ₹49/$1 v0): pass time starts at
checkout creation rather than payment; the pass lives in one browser's cookie;
clearing cookies loses it. The signed token can't be forged without the server
secret.

## Deploy on Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new) — the Next.js preset needs zero config.
2. Add the env vars above under **Project → Settings → Environment Variables** (at minimum one LLM key for real classifications).
3. Deploy. The classify route runs on the Node.js runtime.

## Architecture

```
app/
  page.tsx                    # Marketing landing (hero, demo, pricing, WhatsApp Phase 2 note)
  app/page.tsx                # The tool: brain dump → buckets
  api/classify/route.ts       # POST { text, lang, sample? } → { items, mode }; skips free cap for valid pass cookie
  api/checkout/lemonsqueezy/… # POST { tier, market } → { url } (creates a Lemon Squeezy checkout; 501 if unconfigured)
  api/webhooks/lemonsqueezy/… # POST — verifies X-Signature HMAC, acknowledges order_created
  api/pass/activate/…         # GET ?token=… — post-checkout redirect: verifies signed token, sets HttpOnly pass cookie
  api/pass/status/…           # GET → { active, tier, expiresAt } for the UI (cookie is HttpOnly)
components/
  BrainDump.tsx               # Client flow: textarea, EN|HI toggle, results, regenerate, copy, PDF, share card
  Pricing.tsx                 # 4 pass cards (India/Global × Single/Week), all via Lemon Squeezy
lib/
  prompt.ts                   # LLM system prompt (bucket rules, ruthlessness, no medical/legal/therapy, natural Hindi)
  llm.ts                      # Provider resolution + OpenAI/Anthropic calls + mock fallback
  mock.ts                     # Deterministic keyword classifier for keyless demo mode
  card.ts                     # Canvas renderer for share PNG + PDF (handles Devanagari)
  i18n.ts                     # EN/HI UI strings + sample dumps
  pass.ts                     # Stateless signed pass tokens (mint/verify) + cookie helpers
```

Notes:

- **Free tier**: the sample dump is always free; user dumps are capped at `FREE_DUMP_CHAR_LIMIT` characters (enforced server-side with a 402, mirrored client-side). A valid paid pass cookie (see "How paid unlock works" above) removes the cap for its duration.
- **PDF/share card**: rendered via canvas and embedded as an image, because stock PDF fonts can't render Devanagari.
- **Storage**: nothing server-side. The last result is optionally kept in `localStorage` for convenience.
- **WhatsApp bot**: Phase 2 — mentioned on the landing page only, not blocking launch.

## Manual test checklist

Landing (`/`):

- [ ] Loads with dark-on-white styling, no console errors
- [ ] "Try it free" / "Cut my list" CTAs navigate to `/app`
- [ ] Demo section shows sample input → bucketed output
- [ ] Each pricing "Get pass" button: without Lemon Squeezy env vars, shows the "not configured" notice (endpoint returns 501); with them, redirects to a Lemon Squeezy checkout
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
- [ ] `curl -s localhost:3000/api/checkout/lemonsqueezy -X POST -H 'Content-Type: application/json' -d '{"tier":"week","market":"in"}'` returns 501 with the missing-env message (no keys) or `{ "url": … }` (keys set)
- [ ] With a valid `droplist_pass` cookie, the oversized dump is accepted (no 402)
- [ ] `/api/pass/activate?token=garbage` redirects to `/app?paid=invalid` without setting a cookie

## Out of scope for v0

Accounts, streaks, social feed, team features, calendar sync, habit tracking, coaching community, WhatsApp bot (Phase 2).
