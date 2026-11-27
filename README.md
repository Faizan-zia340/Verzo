# Penlix

Penlix is an AI content SaaS. Users register, get free credits, and spend 1 credit per generation to create blog posts, social media posts, emails, ads, and product descriptions — in 23 languages — with a quality check and an auto-generated SEO package on every generation.

- **Live site:** https://verzo-ecru.vercel.app
- **Live backend:** https://verzo-backend.onrender.com (`/api/health` returns JSON)
- **Repo:** https://github.com/Faizan-zia340/Verzo

> **Brand note:** the product was renamed Verzo → **Penlix** (PR #28, 26 Nov 2026 — new Grok-6 logo, indigo→violet). The name is Penlix everywhere in the product. The URLs still say `verzo` (`verzo-ecru.vercel.app`, `verzo-backend.onrender.com`, repo `Faizan-zia340/Verzo`) because the `penlix.app` domain has **not been bought yet** — the URL/repo/service rename waits for the domain purchase.

## Stack

- **Frontend:** React 18 + Vite 4, React Router v6, Tailwind CSS (`client/`)
- **Backend:** Express 4 + Socket.io 4, Mongoose 7 (`server/`)
- **Database:** MongoDB Atlas (the only database)
- **AI provider: Google Gemini** — `gemini-2.5-flash-lite` via `@google/generative-ai` (`server/config/gemini.js`). **Not OpenAI** — the unused OpenAI package was removed in July 2026; any doc still saying OpenAI is stale.
- **Embeddings (RAG):** `gemini-embedding-001`
- **Payments:** Stripe (code exists; billing is not live — keys not configured, and Stripe does not onboard Pakistan merchants)
- **Email:** Resend (password-reset emails only)
- **Auth:** JWT in an httpOnly cookie (not localStorage), bcrypt (12 rounds)
- **Media storage:** Cloudinary (image/audio uploads via `/api/media`)

## Features (live on `main` @ `8c12222`, 26 Nov 2026)

- Streaming AI generation (SSE) + standard generation — 1 credit each, exactly 1 per generation including retries
- 23 languages/dialects (including Roman Urdu Karachi/Lahore, Urdu script, Arabic MSA/Gulf, European and Asian languages)
- Quality check on every generation (placeholders, banned phrases, filler openers, length) with one retry; only the final output is saved
- Auto-generated SEO package per generation (meta title, meta description, keywords)
- Voice input (browser Web Speech API; transcript goes into the prompt, no audio sent to any server)
- Image input: `POST /api/generate/with-image` (JPG/PNG/WebP, max 5 MB, 1 credit) — and **image-only Blog**: upload a photo, pick Blog, leave the prompt empty, it writes about the photo
- 9 email subtypes (general, cold outreach, follow-up, newsletter, welcome, apology, job application, thank you, meeting request) + new content types (`cover_letter`, `resume_summary`, `linkedin`)
- Purpose templates (26 purposes across the 5 content types) with human-style prompts and two-pass generation
- Blog images: Unsplash photos analyzed by Gemini Vision and embedded in blogs, with a picker to swap them
- Content tuning (shorten / more engaging / professional / reduce hype) — free, no credit
- Font picker on the output card and on blog posts (per-script fonts, incl. Noto Nastaliq for Urdu script)
- PDF Deep Analyzer: upload a PDF, get study notes, chapter summaries, and a test bank
- RAG: admin-managed context documents, embedding-based semantic retrieval with keyword fallback (`POST /api/generate/rag`, auth + 1 credit)
- Content history (paginated, copy/download/delete), export to TXT/PDF/DOCX
- Forgot password: emailed reset link via Resend, token stored as SHA-256 hash, ~1h expiry, generic response either way
- Feedback system (temporary, for testing): floating Feedback button on every page; anonymous reports allowed; admin reads them in the admin panel (`POST /api/feedback`, `GET /api/feedback` admin-only)
- Glossary / dictionary: users can suggest translations for words; admin approves or rejects them (`/api/glossary`); approved terms go into `client/src/content/glossary.json` by manual copy-paste for now
- Admin panel (`/admin`): stats, live activity feed, user management, credit adjustment, grant credits by email, RAG contexts, feedback list — and **delete user** (PR #6; safeguards: no self-delete, no admin delete)
- Per-user rate limit: 10 generations/hour (plus a global 150 req/15 min limit); quota/busy errors are branded "Penlix", never "Gemini"
- Google Search Console ownership verified; `sitemap.xml` + `robots.txt` live; per-page SEO with `react-helmet-async` (`Seo.jsx`); JSON-LD (WebApplication + Organization) on the homepage
- Blog: 9 posts (English, Roman Urdu, Urdu script) at `/blog`, with per-post font picker and translation suggestions

## Pricing (single source of truth: `server/config/pricing.js`)

- Free signup: **20 credits** (`FREE_SIGNUP_CREDITS`; the User model default)
- Starter $4.99 → 50 credits · Growth $9.99 → 120 credits · Pro $19.99 → 300 credits
- The Pricing page reads packs from `GET /api/billing/packages` — never hardcode a price or credit amount elsewhere.
- Stripe checkout is **not live** (keys not configured); no payment can be taken yet.

## Project structure

```
├── client/                  # Vite React frontend (served by Vercel)
│   ├── src/
│   │   ├── App.jsx          # Router, PrivateRoute, AdminRoute
│   │   ├── components/      # Generator, ContentHistory, Dashboard, Pricing,
│   │   │                    # Navbar, Footer, FeedbackButton, FontPicker,
│   │   │                    # Seo, SuggestTranslation, ...
│   │   ├── pages/           # Home, Login, Register, ForgotPassword, ResetPassword,
│   │   │                    # Dashboard, Admin, Pricing, PDFAnalyzer, PaymentSuccess,
│   │   │                    # BlogList, BlogPost
│   │   ├── content/         # blog/*.md (9 posts), glossary.json
│   │   ├── context/         # AuthContext, CreditContext
│   │   ├── services/        # api.js (axios, withCredentials), apiUrl.js, auth.js
│   │   └── utils/           # pageMeta.js, fonts.js, suggestionLanguages.js, ...
│   └── vite.config.js       # dev port 5000, /api proxy → localhost:3001
├── server/                  # Express backend (runs on Render)
│   ├── server.js            # entrypoint: Express, Socket.io, CORS, rate limits
│   ├── config/              # database.js, gemini.js, stripe.js, pricing.js
│   ├── controllers/         # auth, generator, payment, pdf, user
│   ├── middleware/          # auth (cookie JWT), creditCheck, reserveCredit,
│   │                        # isAdmin, userRateLimit, errorHandler
│   ├── models/              # User, Content, Credit, Payment, Context,
│   │                        # Feedback, Suggestion
│   ├── routes/              # auth, generate, user, credits, payment, history,
│   │                        # context, admin, billing, pdf, media, glossary, feedback
│   ├── utils/               # gemini.js, prompts.js (23 langs), qualityCheck.js,
│   │                        # validators.js, embeddings.js, imageService.js, jwt.js,
│   │                        # imageInput.js, quotaMessages.js, feedbackValidation.js,
│   │                        # suggestionValidation.js, mediaStorage.js, twoPass.js
│   ├── jobs/                # dailyCreditReset.js
│   └── tests/               # Node built-in test runner (`npm test` in server/)
├── render.yaml              # ACTIVE backend deploy config (Render)
├── vercel.json              # ACTIVE frontend deploy config (Vercel)
├── PROJECT_CONTEXT.md       # AI-facing snapshot: stack, decisions, status
├── DOCUMENTATION.md         # Full reference doc (API routes, models, flows)
└── replit.md                # Legacy Replit-era doc — no longer maintained
```

## Environment variables (names only — never commit values)

See `server/.env.example` for the template. Variables: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CLIENT_URL`, `FREE_DAILY_CREDITS`, `GEMINI_API_KEY`, `UNSPLASH_ACCESS_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`. `.env` files are gitignored — secrets live only in the hosting dashboards (Render / Vercel), never in the repo.

## Local development

Replit was dropped on 21 Nov 2026 — do not use it. Local dev is plain Vite + Express:

```bash
cd client && npm install && npm run dev   # Vite on http://localhost:5000, /api proxied to :3001
cd server && npm install && node server.js # Express on http://localhost:3001 (PORT env or 3001)
```

## Deployment

- **Frontend — Vercel:** build `cd client && npm install && npm run build`, output `client/dist`. `vercel.json` rewrites `/api/(.*)` to the Render backend **before** the SPA catch-all to `/index.html` — the order matters; without the proxy rule, API calls on Vercel fail.
- **Backend — Render:** service `verzo-backend`, free plan, health check `/api/health`, start command `NODE_ENV=production node server/server.js`. The backend must stay on a persistent host (Render), not Vercel serverless — Socket.io and SSE streaming need long-lived connections. Free-tier services cold-start after idling (first request can take 30–60s).
- **How they connect:** the client reads `VITE_API_URL` (build-time) or relative `/api` paths; CORS allows `CLIENT_URL` (the real Vercel domain) plus `localhost:5173`/`localhost:5000` for dev.

## Current status (26 Nov 2026, `main` @ `8c12222`)

**Merged on 26 Nov 2026** (Faizy delegated merging for speed): #28 rename Verzo → Penlix (Grok-6 logo), #8 security, #7 SEO, #9 quota, #5 purpose templates, #10 voice/image/cross-language, #29 image-only prompt-optional, #30 `creditCheck` import fix (Render deploys were crashing on startup without it), #31 blog batch 2 (3 posts: EN/Roman Urdu/Urdu), #32 temporary feedback system, #26 glossary suggestions. PR #20 closed (old V-mark logo, superseded by #28).

**Open work (not built yet):**
- Mobile app — FUTURE, after the current site polish batch
- Penlix public API (API keys + `/api/v1/generate`) — PAUSED by Faizy on 26 Nov 2026, do not build until he says so
- Translate type, prompt-mistake check, conversation translate+reply, consistency layer — designed, not built
- PDF input inside the Generator (a PDF analyzer page `/pdf` already exists; attaching a PDF in the Generator does not)
- ChatGPT-style unified composer (attach `+` for image/PDF, mic inside one input) — AFTER tester feedback; the tester is asked at the end what to improve in the UX, and the updation follows that list
- Blog posts in all 23 generator languages — in progress (9 posts live; remaining 21 being written in batches)
- Domain `penlix.app` — not bought yet; the URL/repo/service rename waits for it

## Known issues

- **Gemini free-tier quota (429):** the shared quota exhausts fast under load; the live error says "Penlix is busy" (branded, no provider name). No key rotation to evade quota — against Google's terms.
- **Free-credit mismatch (open, PR #14 follow-up):** signup grants 20 credits (`FREE_SIGNUP_CREDITS` in `server/config/pricing.js`, the User model default), but the nightly reset sets balances to 10 because Render env `FREE_DAILY_CREDITS` is still 10. Fix: set the env to 20 or remove it so the reset uses the code value.
- **Copy inconsistency from the same mismatch:** the UI (Home, Register, BlogPost CTA) says "20 free credits" while the 3 newest blog posts say "10 free credits". Both must match whichever value is decided.
- **Sitemap is stale:** `client/public/sitemap.xml` (a static, hand-maintained file) lists only 6 blog posts — the 3 posts from PR #31 (`write-blog-from-a-photo`, `bol-kar-content-likhein`, `urdu-mein-professional-email-kaise-likhein`) are not in it.
- **No site-wide 404 route:** `App.jsx` has no `path="*"` catch-all; unknown URLs render an empty page shell. `BlogPost` has its own inline "Post not found" state. A dedicated 404 page is being built in the site-polish batch.
- **Blog pages don't use `<Seo />` yet:** `BlogList`/`BlogPost` still use the temporary `setPageMeta` helper, so blog posts have no per-post JSON-LD and no related-posts section; no blog post links to another blog post (all in-post links go to `/register` or `/pricing` only).
- **`Seo.jsx` omits `og:image`** although `client/public/og-image.png` exists (its comment claiming no OG image asset is stale).
- **Homepage copy:** "A second AI reviewer scores every output" — the Reality Check is self-scoring, not a second reviewer.
- **Render free tier:** cold start 30–60s after idling; the backend stays up but deploys must pass the startup health check (a missing import crashes the deploy — see PR #30).
- **Server tests don't load the route files**, so a missing import passes all tests and only crashes on Render startup — verification must import/boot the routes (or the server) before merging.

## Docs

- `PROJECT_CONTEXT.md` — the AI-facing snapshot (stack, decisions log, features, open work, known issues). Keep it in sync with significant changes.
- `DOCUMENTATION.md` — full reference (API routes, models, controllers, data flows). Verified against `main` @ `8c12222` on 26 Nov 2026; verify against the code before relying on it.
