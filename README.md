# Penlix

Penlix is an AI content SaaS. Users register, get free credits, and spend 1 credit per generation to create blog posts, social media posts, emails, ads, and product descriptions — in 23 languages — with a quality check and an auto-generated SEO package on every generation.

- **Live site:** https://verzo-ecru.vercel.app
- **Live backend:** https://verzo-backend.onrender.com (`/api/health` returns JSON)
- **Repo:** https://github.com/Faizan-zia340/Verzo

## Stack

- **Frontend:** React 18 + Vite 4, React Router v6, Tailwind CSS (`client/`)
- **Backend:** Express 4 + Socket.io 4, Mongoose 7 (`server/`)
- **Database:** MongoDB Atlas (the only database)
- **AI provider: Google Gemini** — `gemini-2.5-flash-lite` via `@google/generative-ai` (`server/config/gemini.js`). **Not OpenAI** — the unused OpenAI package was removed in July 2026; any doc still saying OpenAI is stale.
- **Embeddings (RAG):** `gemini-embedding-001`
- **Payments:** Stripe (code exists; billing is not live — keys not configured)
- **Email:** Resend (password-reset emails only)
- **Auth:** JWT in an httpOnly cookie (not localStorage), bcrypt (12 rounds)

## Features (live on `main`)

- Streaming AI generation (SSE) + standard generation — 1 credit each, exactly 1 per generation including retries
- 23 languages/dialects (including Roman Urdu Karachi/Lahore)
- Quality check on every generation (placeholders, banned phrases, filler openers, length) with one retry; only the final output is saved
- Auto-generated SEO package per generation (meta title, meta description, keywords)
- Blog images: Unsplash photos analyzed by Gemini Vision and embedded in blogs
- Content tuning (shorten / more engaging / professional / reduce hype) — free, no credit
- PDF Deep Analyzer: upload a PDF, get study notes, chapter summaries, and a test bank
- RAG: admin-managed context documents, embedding-based semantic retrieval with keyword fallback
- Content history (paginated, copy/download/delete), export to TXT/PDF/DOCX
- Forgot password: emailed reset link via Resend, token stored as SHA-256 hash, ~1h expiry, generic response either way
- Admin panel (`/admin`): stats, live activity feed, user management, credit adjustment, grant credits by email, RAG contexts — and **delete user** (PR #6, merged 23 Nov 2026; safeguards: no self-delete, no admin delete)
- Per-user rate limit: 10 generations/hour (plus a global 150 req/15 min limit)
- Google Search Console ownership verified; `sitemap.xml` + `robots.txt` live; sitemap submitted 23 Nov 2026 (Status: Success, 4 pages discovered). The site is new and not yet showing in Google search results — indexing takes days.

## Project structure

```
├── client/                  # Vite React frontend (served by Vercel)
│   ├── src/
│   │   ├── index.js         # App entry point
│   │   ├── App.jsx          # Router, PrivateRoute, AdminRoute
│   │   ├── components/      # Generator, ContentHistory, Dashboard, Pricing, ...
│   │   ├── pages/           # Home, Login, Register, ForgotPassword, ResetPassword,
│   │   │                    # Dashboard, Admin, Pricing, PDFAnalyzer, PaymentSuccess
│   │   ├── context/         # AuthContext, CreditContext
│   │   ├── services/        # api.js (axios, withCredentials), apiUrl.js, auth.js
│   │   └── styles/
│   └── vite.config.js       # dev port 5000, /api proxy → localhost:3001
├── server/                  # Express backend (runs on Render)
│   ├── server.js            # entrypoint: Express, Socket.io, CORS, rate limits
│   ├── config/              # database.js, gemini.js, stripe.js
│   ├── controllers/         # auth, generator, payment, pdf, user
│   ├── middleware/          # auth (cookie JWT), creditCheck, isAdmin, userRateLimit
│   ├── models/              # User, Content, Credit, Payment, Context
│   ├── routes/              # auth, generate, user, credits, payment, history,
│   │                        # context, admin, billing, pdf
│   ├── utils/               # gemini.js, prompts.js (23 langs), qualityCheck.js,
│   │                        # validators.js, embeddings.js, imageService.js, jwt.js
│   ├── jobs/                # dailyCreditReset.js
│   └── tests/               # adminDeleteUser.test.js
├── render.yaml              # ACTIVE backend deploy config (Render)
├── vercel.json              # ACTIVE frontend deploy config (Vercel)
├── PROJECT_CONTEXT.md       # AI-facing snapshot: stack, decisions, status
├── DOCUMENTATION.md         # Full reference doc (API routes, models, flows)
└── replit.md                # Legacy Replit-era doc — no longer maintained
```

## Environment variables (names only — never commit values)

See `server/.env.example` for the template. Variables: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CLIENT_URL`, `FREE_DAILY_CREDITS`, `GEMINI_API_KEY`, `UNSPLASH_ACCESS_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`. `.env` files are gitignored — secrets live only in the hosting dashboards (Render / Vercel), never in the repo.

## Local development

Replit was dropped on 21 Nov 2026 — do not use it. Local dev is plain Vite + Express:

```bash
cd client && npm install && npm run dev   # Vite on http://localhost:5000, /api proxied to :3001
cd server && npm install && node server.js # Express on http://localhost:3001 (PORT env or 3001)
```

## Deployment

- **Frontend — Vercel:** build `cd client && npm install && npm run build`, output `client/dist`. `vercel.json` rewrites `/api/(.*)` to the Render backend **before** the SPA catch-all to `/index.html` — the order matters; without the proxy rule, API calls on Vercel fail.
- **Backend — Render:** service `verzo-backend`, Oregon, free plan, health check `/api/health`, start command `NODE_ENV=production node server/server.js`. The backend must stay on a persistent host (Render), not Vercel serverless — Socket.io and SSE streaming need long-lived connections. Free-tier services cold-start after idling (first request can take 30–60s).
- **How they connect:** the client reads `VITE_API_URL` (build-time) or relative `/api` paths; CORS allows `CLIENT_URL` (the real Vercel domain) plus `localhost:5173`/`localhost:5000` for dev.

## Current status (24 Nov 2026)

**Live on `main` (`d9fc369`):** everything in Features above, including admin delete-user (PR #6).

**Open PRs — all UNMERGED, merge only on Faizy's decision:**

| PR | Branch | What it adds |
|----|--------|--------------|
| #5 | `feature/purpose-templates` | 26 purpose-based templates, human-style prompts, two-pass generation |
| #7 | `feature/seo-batch` | Sitemap reduced to `/` + `/pricing`, per-page SEO with react-helmet-async |
| #8 | `feature/security-critical-fixes` | Fixes C1 (reset-URL poisoning), C2 (CORS wildcard), H1 (open `/rag`), H2 (public `/api/context`) |
| #9 | `feature/user-quota-messages` | Per-user quota limits, quota errors branded "Penlix" (never "Gemini") |
| #10 | `feature/voice-image-crosslang` | Voice input, image input, cross-language drift fix, email subtypes, new content types, blog image picker |

Agreed merge order: #8 → #7 → #9 → #5 → #10. #9 must be rebased onto main after #8 (both touch `generate.js` and `package.json`); #5 needs main synced in before merge; #10 must be rebased onto main after #5 and its email subtypes merged into #5's purposes system (no duplicate email-type system).

## Known issues

- **Gemini free-tier quota (429):** the shared quota exhausts fast under load; the live 429 error still says "Gemini" (PR #9 rebrands it to Penlix). No key rotation to evade quota — against Google's terms.
- **Pricing mismatch:** the Pricing page says Pro $10 = 100 credits and Enterprise $40 = 500, but the payment code grants starter 499 → 50, growth 999 → 120, pro 1999 → 300 credits. Needs one source of truth for packages.
- **H3 — Stripe webhook double-credit:** the webhook credits the user on every `payment_intent.succeeded` event with no idempotency check, so a redelivered event double-credits.
- **Credit-check race:** `creditCheck` only reads the balance; the deduction is a separate `$inc` after generation, so two concurrent requests can both pass with 1 credit.
- **Open endpoints on main:** `POST /api/generate/rag` has no auth, rate limit, or credit check; `/api/context` is public (both fixed in unmerged PR #8).
- **CORS wildcard on main:** any `*.vercel.app` (and stale `*.replit.dev`) origin is allowed (fixed in unmerged PR #8).

## Docs

- `PROJECT_CONTEXT.md` — the AI-facing snapshot (stack, decisions log, features, open PRs, known issues). Keep it in sync with significant changes.
- `DOCUMENTATION.md` — full reference (API routes, models, controllers, data flows). Verified against `main` on 24 Nov 2026 for the Gemini correction; some older sections may still lag the code — verify against the code before relying on them.

## Purpose templates & human-style generation

Each content type has purpose sub-types in `server/config/contentTypes.js` (e.g. email: cold outreach, job posting, apology; social: X/Twitter, LinkedIn). The Generator shows a Purpose dropdown after Type; the purpose sets the structure, default tone, length range and required fields (validated server-side with 400 on missing fields, no AI call, no credit). Prompts inject the purpose structure and two human-written examples, plus tone (friendly, formal, persuasive, urgent, empathetic), reading level (simple, standard, professional) and an optional writing sample (max 1500 chars, voice matched, never copied). Generation is two-pass: pass 1 drafts, pass 2 is a short editor prompt that only removes robotic phrasing and filler while preserving every fact (skipped under 80 words; `TWO_PASS_ENABLED=false` disables it). Streaming streams pass 1 live, then replaces the text with the edited version in the `done` event. `server/utils/qualityCheck.js` adds per-purpose checks (Google ad limits, X under 280 chars, email subject/greeting/sign-off) and flags 3+ consecutive sentences starting the same way. Still exactly 1 credit per generation. Tests: `npm test` in `server/`.
