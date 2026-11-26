# PROJECT_CONTEXT.md

Last verified against actual code: 26 Nov 2026 (main @ `8c12222`). This file is a living document — update it whenever a feature, architectural decision, or significant fix is made.

**Brand:** the product is **Penlix** (renamed from Verzo, PR #28, 26 Nov 2026). URLs still say `verzo` (`verzo-ecru.vercel.app`, `verzo-backend.onrender.com`, repo `Faizan-zia340/Verzo`) because the `penlix.app` domain has **not been bought yet** — the URL/repo/service rename waits for the domain purchase.

---

## 1. What This Project Is

Penlix is a full-stack SaaS web app that generates AI-written content (blog posts, social media posts, emails, ads, product descriptions) for users. Users register, get 20 free credits, and spend 1 credit per generation via a streaming AI response. It supports 23 languages/dialects, tunes existing text (shorten/more engaging/professional/reduce hype) for free, auto-generates an SEO package (meta title/description/keywords) per generation, attaches relevant stock photos, and lets users export/share/download their content. It also includes a standalone PDF analyzer that turns an uploaded PDF into study notes, chapter summaries, and a test bank; voice input; image input (including image-only Blog generation); a font picker; a temporary feedback system for testers; and a community glossary/dictionary for translations. An admin dashboard lets an admin manage users, grant/revoke credits, monitor a live generation activity feed, manage a RAG "knowledge base" of context documents the AI can draw on, and read tester feedback. The site has a blog (9 posts) with per-post font picker and translation suggestions.

---

## 2. Tech Stack

### Frontend (`client/`)
- React 18 + Vite 4, React Router v6
- Tailwind CSS (utility classes only, no CSS-in-JS); dark-mode styling via `dark:` classes
- Framer Motion (animations), Recharts (dashboard charts)
- axios (HTTP client, `withCredentials: true` for cookie auth)
- react-hot-toast (notifications)
- socket.io-client
- jspdf + html2canvas (PDF export)
- react-icons (named exports from `react-icons/fi`)
- react-helmet-async (`Seo.jsx` per-page SEO)
- `marked` (blog Markdown rendering, raw HTML stripped)
- `@stripe/stripe-js` + `@stripe/react-stripe-js` are installed but Stripe checkout is not live (see Decisions Log)

### Backend (`server/`)
- Express 4 + Socket.io 4 (real-time), `pino` + `pino-http` (structured logging), `pino-pretty` (dev log formatting)
- Mongoose 7 → MongoDB Atlas (the actual, live database)
- Auth: `jsonwebtoken` + `bcryptjs`, JWT delivered via an **httpOnly cookie** (not localStorage)
- `helmet` (security headers), `express-rate-limit` (global + per-user limiter), `cookie-parser`
- `joi` (request validation), `multer` (image/PDF/media upload)
- `pdf-parse` v2 (PDF text extraction)
- Cloudinary (`mediaStorage.js`) for image/audio uploads
- **AI provider actually wired up and in active use: Google Gemini** (`@google/generative-ai` SDK)
  - Chat/content generation model: `gemini-2.5-flash-lite` via the `v1` API (`server/config/gemini.js`)
  - Embeddings model (for semantic RAG search): `gemini-embedding-001` via the `v1` API (`server/utils/embeddings.js`) — note `text-embedding-004` does NOT work on this API key/SDK combination, returns 404
  - OpenAI is not used anywhere in this codebase — the unused `openai` package and its config/utils wrapper files were removed during cleanup (July 2026)
- `stripe` npm package + `server/config/stripe.js` exist and are referenced by `server/routes/billing.js` and `server/controllers/paymentController.js`, but `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are not configured, so billing is dormant (see Decisions Log)

### Database
- **MongoDB Atlas** via Mongoose — this is the only database used by this app.
- Network Access whitelist is set to `0.0.0.0/0` (manual Atlas dashboard setting). It was set while Replit was in use (dynamic outbound IP); Replit was dropped 21 Nov 2026, so whether it can be tightened should be reviewed.
- There is no Postgres/Drizzle setup — an earlier, unused scaffold for one was removed during cleanup (July 2026).

### Auth Method
- JWT signed with `JWT_SECRET`, stored in an **httpOnly, SameSite=Lax cookie** (`server/utils/jwt.js` `cookieOptions`), not localStorage. `server/middleware/auth.js` reads the token from `req.cookies.token`. Login/register set the cookie; `POST /api/auth/logout` clears it. All frontend API calls use `credentials: 'include'` / axios `withCredentials: true`.

---

## 3. Deployment Architecture

The frontend and backend are deployed as **two separate services**, not as a single host:

- **Frontend**: deployed to **Vercel** (see `vercel.json` at repo root — build command `cd client && npm install && npm run build`, output `client/dist`, SPA rewrite to `index.html`). Live at https://verzo-ecru.vercel.app.
- **Backend**: deployed to **Render** (see `render.yaml` — web service `verzo-backend`, free plan, health check at `/api/health`). Live at https://verzo-backend.onrender.com.
- **Why split**: the backend uses **Socket.io** (live activity feed) and **Server-Sent Events / streaming responses** (`/api/generate/stream`) for real-time features. Vercel's serverless functions cannot hold these long-lived connections open, so the backend must run on a persistent Node process (Render), while the static frontend build is served from Vercel's CDN.
- **How they connect**:
  - Frontend → Backend: the client reads `VITE_API_URL` (a build-time env var) to know the backend's URL (`client/src/services/apiUrl.js`, `client/src/services/api.js`). If unset, it falls back to relative paths (used in local dev via the Vite proxy). `vercel.json` also proxies `/api/*` to the Render backend before the SPA catch-all.
  - CORS: the backend whitelists allowed origins via an exact allowlist (`server/utils/corsOrigins.js`: `CLIENT_URL` env var plus `localhost:5173`/`localhost:5000` for dev and `verzo-git-*` Vercel preview URLs). Socket.io's CORS config mirrors the same whitelist. `CLIENT_URL` is the real Vercel domain (`https://verzo-ecru.vercel.app`) in the Render environment. Note: a non-allowlisted `Origin` currently gets a generic 500 from the CORS handler — fix when the custom domain arrives.
  - Local dev: plain Vite + Express, no Replit (dropped 21 Nov 2026). Frontend: `cd client && npm run dev` — Vite on port 5000, proxies `/api` to `localhost:3001`. Backend: `cd server && node server.js` — port 3001 (`PORT` env var or 3001).

---

## 4. Folder Structure (actual, as of 26 Nov 2026, main @ `8c12222`)

```
├── client/                          # Vite React frontend (the one actually served)
│   ├── src/
│   │   ├── App.jsx                  # Router, PrivateRoute, AdminRoute, Toaster, Footer, FeedbackButton
│   │   ├── components/
│   │   │   ├── Generator.jsx        # Content generation form + output (voice, image, font picker)
│   │   │   ├── ContentHistory.jsx
│   │   │   ├── CreditsDisplay.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DashboardChart.jsx
│   │   │   ├── FeedbackButton.jsx   # Temporary tester feedback (modal form)
│   │   │   ├── FontPicker.jsx       # Per-script content font picker
│   │   │   ├── Footer.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Pricing.jsx
│   │   │   └── Seo.jsx              # Per-page SEO via react-helmet-async
│   │   ├── content/
│   │   │   ├── blog/                # 9 posts as .md + index.js (frontmatter parser)
│   │   │   └── glossary.json        # Approved dictionary terms (manual copy-paste)
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── CreditContext.js
│   │   ├── pages/
│   │   │   ├── Admin.jsx            # Incl. Feedback list section
│   │   │   ├── BlogList.jsx
│   │   │   ├── BlogPost.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PaymentSuccess.jsx
│   │   │   ├── PDFAnalyzer.jsx
│   │   │   ├── Pricing.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   ├── api.js               # axios instance, withCredentials:true, 401 redirect
│   │   │   ├── apiUrl.js            # VITE_API_URL helper for non-axios fetch calls
│   │   │   └── auth.js
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   └── tailwind.css
│   │   └── utils/
│   │       ├── fonts.js             # scriptOf/useContentFont (per-script fonts)
│   │       ├── pageMeta.js          # Temporary title/meta helper (blog pages only)
│   │       └── suggestionLanguages.js
│   ├── index.html                   # Title, meta, OG/Twitter, canonical, JSON-LD
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js               # port 5000, /api proxy → localhost:3001
│
├── server/                          # Express backend (entrypoint server.js)
│   ├── server.js                    # entrypoint: Express, Socket.io, Pino logging, rate limiting, SPA fallback, crash handlers
│   ├── config/
│   │   ├── database.js              # Mongoose connect, bufferCommands:false, 20-attempt retry
│   │   ├── gemini.js                # Gemini client, MODEL='gemini-2.5-flash-lite', API_VERSION='v1'
│   │   ├── pricing.js               # Single source of truth: FREE_SIGNUP_CREDITS=20, packs $4.99→50 / $9.99→120 / $19.99→300
│   │   └── stripe.js                # Stripe client — used by billing route, dormant until keys set
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── generatorController.js   # generate, streamGenerate, tuneContent, generateAIContent, generateFromImage
│   │   ├── paymentController.js     # Stripe checkout/webhook handling — dormant
│   │   ├── pdfController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js                  # reads JWT from httpOnly cookie
│   │   ├── creditCheck.js           # balance read (used by /rag)
│   │   ├── reserveCredit.js         # atomic credit reserve (paid generation routes)
│   │   ├── errorHandler.js          # sanitizes DB errors, operational-vs-programmer error classification
│   │   ├── isAdmin.js
│   │   └── userRateLimit.js         # 10 req/hr per user on generation routes
│   ├── models/
│   │   ├── Content.js
│   │   ├── Context.js               # has `embedding` field (select:false) for semantic RAG
│   │   ├── Credit.js
│   │   ├── Feedback.js              # Tester feedback reports
│   │   ├── Payment.js
│   │   ├── Suggestion.js            # Glossary translation suggestions
│   │   └── User.js                  # credits default = FREE_SIGNUP_CREDITS (20)
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── billing.js               # /packages (from pricing.js), /checkout, /webhook
│   │   ├── credits.js
│   │   ├── feedback.js              # POST / (public), GET / (admin)
│   │   ├── generate.js              # /, /stream, /with-image, /tune, /rag, /ping-ai
│   │   ├── glossary.js              # /suggest, /suggestions, approve/reject
│   │   ├── history.js
│   │   ├── media.js                 # /upload (Cloudinary, image/audio, no credit)
│   │   ├── payment.js
│   │   ├── pdf.js                   # /analyze
│   │   └── user.js                  # mounted in server.js at /api/user
│   ├── jobs/
│   │   └── dailyCreditReset.js      # nightly reset to FREE_DAILY_CREDITS (Render env, currently 10 — see Known issues)
│   ├── tests/
│   │   └── (Node built-in test runner; `npm test` in server/ — quota, purpose, image, feedback, billing suites)
│   └── utils/
│       ├── asyncHandler.js
│       ├── corsOrigins.js           # Exact CORS allowlist
│       ├── embeddings.js            # generateEmbedding/cosineSimilarity/findRelevantContexts, gemini-embedding-001
│       ├── feedbackValidation.js    # Pure validator for feedback reports (max 2000 chars)
│       ├── gemini.js                # dual-agent system prompt, getModel, withSystem, generateText/SEO/tuneText
│       ├── imageInput.js            # Image validation + applyImageDefaults (image-only generation)
│       ├── imageService.js          # fetches + embeds Unsplash images into generated content
│       ├── jwt.js                   # signs JWT, defines httpOnly cookieOptions
│       ├── logger.js                # Pino logger, pretty in dev / JSON in prod
│       ├── mediaStorage.js          # Cloudinary upload/delete
│       ├── prompts.js               # LANGUAGE_MAP (23 langs), FORMAT_MAP, buildPDFPrompt
│       ├── qualityCheck.js          # checkQuality, stripAgentLabels
│       ├── quotaMessages.js         # Penlix-branded quota/busy messages (never "Gemini")
│       ├── suggestionValidation.js  # Glossary suggestion validation + approve/reject rules
│       ├── twoPass.js               # Two-pass editor (pass 2)
│       ├── unsplash.js
│       ├── validateEnv.js           # startup fail-fast if MONGODB_URI/JWT_SECRET/GEMINI_API_KEY missing
│       └── validators.js            # Joi schemas, stripUnknown:true
│   └── package.json                 # server's own dependency list (the one that actually matters at runtime)
│
├── attached_assets/                 # user-pasted files/screenshots dropped into chat, not app source
├── .agents/                         # agent memory directory (not app code)
├── package.json                     # root-level orchestrator only (scripts to install/build/run client+server) — holds no app dependencies of its own
├── package-lock.json
├── railway.toml                     # unused alternate deploy config (Railway)
├── nixpacks.toml                    # unused alternate build config
├── render.yaml                      # ACTIVE backend deploy config (Render)
├── vercel.json                      # ACTIVE frontend deploy config (Vercel)
├── .env.example
├── .replit                          # LEFTOVER Replit workspace config — stale (Replit dropped 21 Nov 2026). Do not use; local dev is plain Vite + Express.
├── README.md                        # maintained project readme (rewritten 26 Nov 2026)
├── DOCUMENTATION.md                 # full reference doc; verified against main @ 8c12222 on 26 Nov 2026
└── replit.md                        # legacy Replit-era status doc — no longer maintained, do not use as a source of truth

```

**Cleanup note (July 2026):** the following were removed as unused leftovers from earlier scaffolding and no longer exist: a duplicate root-level React app (`src/`, plus stray root `index.html`/`vite.config.js`/`tailwind.config.js`/`postcss.config.js` that belonged to it), an unused Postgres/Drizzle setup (`drizzle.config.js`, `server/db/`, `server/models/Subscription.js`), an unused alternate Express entrypoint (`server/index.js` and the `server/routes/users.js` it alone used), and the unused `openai` package plus its wrapper files (`server/config/openai.js`, `server/utils/openai.js`). The root `package.json` was rewritten to be a thin orchestrator with no duplicated dependencies. App was verified working end-to-end (register/login, health checks, homepage render) after this cleanup.

---

## 5. Decisions Log

- **JWT moved to httpOnly cookie** instead of localStorage — reduces XSS token-theft risk. All frontend requests now send `credentials: 'include'` / `withCredentials: true`.
- **Stripe left unconfigured on purpose** — `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are not set; the billing code path exists (`routes/billing.js`, `controllers/paymentController.js`, `config/stripe.js`) but is dormant. This was an explicit choice, not an oversight — set the two secrets to activate it. Note: Stripe does not onboard Pakistan merchants, so a merchant-of-record (Paddle/Lemon Squeezy) or JazzCash/Easypaisa is the realistic path; payments are deferred by Faizy ("payment phr baad m krnge").
- **CORS locked to an explicit whitelist** — `CLIENT_URL` env var + hardcoded localhost dev origins, replacing an earlier open/permissive CORS setup. Socket.io CORS uses the identical whitelist logic. (PR #8, merged 26 Nov 2026.)
- **MongoDB Atlas IP whitelist set to `0.0.0.0/0`** — this is a manual setting in the Atlas dashboard, not something the app config controls. It was set while Replit was in use (dynamic outbound IP); Replit was dropped 21 Nov 2026, so whether it can be tightened should be reviewed.
- **Frontend/backend split across Vercel + Render** — chosen specifically because Socket.io and SSE streaming need a persistent server process, which Vercel serverless functions cannot provide.
- **RAG retrieval upgraded from pure keyword match to embedding-based semantic search** — `gemini-embedding-001` embeddings + cosine similarity (threshold 0.65, top-3), with automatic fallback to the original keyword match (`Context.findOne({ keywords: $in })`) when no context has an embedding or nothing clears the threshold.
- **`text-embedding-004` does not work** on the currently configured Gemini API key/SDK — returns 404 regardless of API version (`v1` or `v1beta`). `gemini-embedding-001` on `v1` is the confirmed working model.
- **Structured logging via Pino** replaced all `console.*` calls in the backend — every request gets a UUID trace ID; logs are pretty-printed in dev and JSON in production.
- **Error handler distinguishes operational vs. programmer errors** — 4xx codes and 503 (upstream AI overload) show the real, honest error message to the user; genuinely unexpected 5xx errors are replaced with a generic message and logged with full stack trace + request ID.
- **Per-user rate limiting added on generation endpoints** (10 requests/hour) on top of the existing global limiter (150 requests/15 min), to stop a single user from exhausting the shared Gemini quota.
- **Startup environment validation added** — the server refuses to boot if `MONGODB_URI`, `JWT_SECRET`, or an AI key is missing, rather than failing unpredictably mid-request later.
- **Replit dropped 21 Nov 2026** — work is GitHub + Render + Vercel only. `.replit` and `replit.md` are leftovers; do not use Replit for this project.
- **Admin delete-user merged 23 Nov 2026** (PR #6, main `d9fc369`) — admins can delete regular users from `/admin`; safeguards: no self-delete, no admin delete.
- **Rename Verzo → Penlix decided 25 Nov 2026, merged 26 Nov 2026 (PR #28)** — "Verzo" was already used by 3 other outfits. New Grok-6 logo (indigo→violet gradient). Tagline stays "Content, Generated Intelligently". Domain `penlix.app` ($8.75 first year) not bought yet; the URL/repo/service rename waits for the domain. USPTO: no exact PENLIX record found (web search only, not legal clearance).
- **Pricing single source of truth (PR #14, billing integrity)** — `server/config/pricing.js`: free signup 20 credits; Starter $4.99→50, Growth $9.99→120, Pro $19.99→300. Idempotent Stripe webhooks + atomic credit reserve (fixes the old double-credit and credit-race bugs). The Pricing page reads packs from `GET /api/billing/packages`.
- **Image-only generation (PR #29, 26 Nov 2026)** — prompt and per-type details are optional when an image is attached (server defaults them, type-aware); `/` and `/stream` stay strict. ChatGPT-style flow: upload a photo, pick Blog, Generate.
- **Temporary feedback system (PR #32, 26 Nov 2026)** — floating Feedback button on every page; anonymous reports allowed; admin reads them in `/admin`. Built so a tester can report issues; it is temporary by design.
- **Glossary/dictionary (PR #26, merged)** — users suggest translations, admin approves/rejects; approved terms go into `client/src/content/glossary.json` by manual copy-paste. Automatic approved→glossary.json is not built yet.
- **Penlix public API — PAUSED (Faizy, 26 Nov 2026)** — API keys + `/api/v1/generate` was approved, then stopped the same day ("api abhi ni bano filhal"). Do not build until he says so.
- **Composer/UX updation — AFTER tester feedback (Faizy, 26 Nov 2026)** — the tester is asked at the end what to improve in the UX; the updation (incl. ChatGPT-style unified composer and PDF attach in the Generator) follows that list. Do not build it before the tester feedback arrives.
- **No AI fingerprints in code** — no "generated by AI / built with AI" comments or text, no provider names in user-facing strings. **No key rotation** across free Gemini keys — against Google's terms.
- **Blog rules** — (1) TRUTHFUL: fact-check every claim against the live product; (2) MULTILINGUAL: not English only; (3) DIFFERENT: every post a different topic/angle/keywords. 9 posts live (EN/Roman Urdu/Urdu); one post per each of the 23 generator languages is in progress.

---

## 6. Features Implemented So Far (verified working in code, main @ `8c12222`)

- User registration/login/logout with JWT-in-httpOnly-cookie auth
- Free credits granted on signup (20); credits deducted on generation (atomic reserve, exactly 1 per generation)
- Streaming AI content generation via SSE (`POST /api/generate/stream`), 23 languages/dialects, 3 output formats (paragraphs/bullets/headings), 3 pre-built templates
- Dual-agent "REALITY CHECK" scoring embedded in Gemini's output (Expert Copywriter + Brutal AI Reviewer system prompt)
- Content tuning (shorten / more engaging / professional tone / reduce hype) — no credit cost
- Auto-generated SEO package (meta title, meta description, 5 keywords) per generation
- Voice input (browser Web Speech API; transcript appended to prompt, no audio to any server)
- Image input (`POST /api/generate/with-image`, JPG/PNG/WebP, max 5 MB) + image-only Blog generation (prompt optional with an image)
- 9 email subtypes + new content types (`cover_letter`, `resume_summary`, `linkedin`); 26 purpose templates with two-pass generation
- Unsplash stock image fetching + embedding into generated content (requires `UNSPLASH_ACCESS_KEY`), with a picker to swap images
- Font picker on the output card and on blog posts (per-script fonts)
- Export to TXT, PDF (jsPDF), DOCX (HTML blob); LinkedIn/Twitter share buttons
- Content history with copy/download, paginated, deletable
- PDF Deep Analyzer: upload up to 10MB, extracts text (`pdf-parse` v2), chunks large docs, produces study notes/chapter summaries/10-question test bank, exports as PDF
- Media upload (`POST /api/media/upload`, Cloudinary, image/audio up to 5 MB, no credit)
- Feedback system: floating button + modal form + admin list (anonymous allowed)
- Glossary suggestions: user suggests a translation, admin approves/rejects; approved terms land in `glossary.json` (manual)
- Admin dashboard: stats overview, live activity feed (last 20 generations), searchable user management with credit adjustment, grant/revoke credits by email, RAG context document management, feedback list
- Semantic RAG: context documents are embedded on creation (`gemini-embedding-001`); generation retrieval tries cosine-similarity match first, falls back to keyword match; `/rag` requires auth + 1 credit
- Structured request logging with trace IDs (Pino)
- Global + per-user rate limiting; quota/busy errors branded "Penlix"
- Security headers via Helmet; exact CORS allowlist
- Startup environment variable validation
- Health check endpoints (`/health`, `/api/health`) for deployment platform monitoring
- Password reset via emailed link (Resend; token stored as SHA-256 hash, ~1h expiry, generic response either way)
- Admin can delete regular users (PR #6, merged 23 Nov 2026); safeguards: no self-delete, no admin delete
- Blog: 9 posts (EN/Roman Urdu/Urdu script) at `/blog`, per-post font picker, translation suggestions, per-page SEO
- SEO: GSC verified, `sitemap.xml` + `robots.txt`, per-page SEO (`Seo.jsx`), JSON-LD (WebApplication + Organization) on the homepage

---

## 7. In Progress / Not Yet Built

- Blog posts in all 23 generator languages — 9 live; remaining 21 being written in batches (`.md` only; `index.js` registration after all land)
- Site polish batch (in progress, 26 Nov 2026): proper multi-column footer, dedicated 404 page, dark/light mode toggle, mobile nav + responsiveness
- Mobile app — FUTURE, after the site polish batch
- Penlix public API — PAUSED (see Decisions Log)
- Translate type, prompt-mistake check, conversation translate+reply, consistency layer — designed, not built
- PDF input inside the Generator — a PDF analyzer page (`/pdf`) exists; attaching a PDF in the Generator does not
- ChatGPT-style unified composer — AFTER tester feedback (see Decisions Log)
- Stripe billing — code exists but is not live (secrets not configured; Stripe does not onboard Pakistan merchants)
- Email verification on registration
- User profile page (change name/password)
- Recurring subscription billing
- Credit auto-refill/top-up
- Team/workspace accounts
- Webhook notifications on generation complete
- Additional content types (YouTube script, press release, product review)
- Image generation (as opposed to stock photo fetching)
- Custom brand voice training
- Per-user usage analytics
- Glossary automation (approved suggestion → `glossary.json` automatically) — manual copy-paste for now
- Automated testing — growing (`server/tests/` has quota, purpose, image, feedback, billing suites); no CI yet

---

## 8. Known Constraints

- **MongoDB Atlas IP whitelist is manual** — set to `0.0.0.0/0` (set while Replit was in use); if this is ever tightened, the app will lose DB connectivity until it's reopened.
- **`CLIENT_URL`** — the real Vercel domain (`https://verzo-ecru.vercel.app`) is set in the Render environment.
- **Render free tier** (per `render.yaml`, `plan: free`) — free web services on Render spin down after inactivity and cold-start on the next request (30–60s), which will cause a noticeable delay on the first request after idling.
- **Gemini has occasional transient 503 overload errors and free-tier 429 rate limits** — the app surfaces these honestly to the user ("Penlix is busy right now — please try again in a few minutes") rather than pretending it's an app-side bug, but they are outside this app's control. No key rotation to evade quota — against Google's terms.
- **Stripe is not live** — `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are unset; any billing UI that references pricing/checkout will not actually process payments until these are configured.
- **OpenAI is not an active provider** — the unused `openai` package and its wrapper files were removed during the July 2026 cleanup; only Gemini is wired in.
- **`railway.toml`/`nixpacks.toml`** are unused alternate deploy configs (Render + Vercel is the active split).
- **Server tests do not load the route files** — a missing import passes all tests and only crashes on Render startup (this bit the 26 Nov 2026 deploys; fixed by PR #30). Verification must import/boot the routes (or the server) before merging.
- **Known issues** (free-credit mismatch, stale sitemap, no 404 route, blog SEO gaps, copy inconsistencies) — see section 11.

---

## 9. Instructions for Any AI Helping With This Project

- **Do not** suggest deploying this as a single Vercel-only app — the backend needs Socket.io/SSE, which Vercel serverless cannot sustain. The split (Vercel frontend + Render backend) is intentional.
- **Do not** assume Stripe is processing real payments — the integration code exists but the secrets are deliberately unconfigured. Ask before assuming billing works.
- **Do not** assume OpenAI is an active AI provider — only Gemini (`gemini-2.5-flash-lite` for generation, `gemini-embedding-001` for embeddings) is actually wired into the live code paths.
- **Do not** suggest switching the database from MongoDB to Postgres — this has been explicitly decided against (see `replit.md` User Preferences).
- **Do not** suggest moving JWT back to localStorage — the httpOnly cookie approach was a deliberate security fix.
- **Do not** build the Penlix public API or the unified composer until Faizy says so (both are paused/queued — see Decisions Log).
- **Do** treat `README.md` as the maintained entry-point doc and this file (`PROJECT_CONTEXT.md`) as the portable, AI-facing snapshot — keep both in sync when making significant changes. `replit.md` is legacy; do not use it as a source of truth.
- **Do** verify claims against the actual code before adding to this file — this document exists specifically to avoid guessing.
- **Do not** use Replit for this project — it was dropped 21 Nov 2026. Work is GitHub + Render + Vercel only.

---

## 10. Merged Work (26 Nov 2026)

Faizy delegated merging for speed that day ("jaldi kro... test krle"). All merged in order, each rebased onto the moving main first:

| PR | What |
|----|------|
| #28 | Rename Verzo → Penlix (Grok-6 logo, brand strings) — merge `e8054d4` |
| #8 | Security: exact CORS allowlist, `/rag` protected, `/api/context` removed, reset-URL fix |
| #7 | SEO: sitemap, per-page SEO (`Seo.jsx`), JSON-LD |
| #9 | Per-user quota limits, Penlix-branded quota/busy messages |
| #5 | Purpose templates, human-style prompts, two-pass generation |
| #10 | Voice input, image input, cross-language drift fix, email subtypes, new content types, blog image picker |
| #29 | Image-only generation: prompt/details optional with an image |
| #30 | Fix: missing `creditCheck` import that crashed every Render deploy on startup |
| #31 | Blog batch 2 (3 posts: EN image-to-blog, Roman Urdu voice, Urdu email) |
| #32 | Temporary feedback system (button + form + admin list) |
| #26 | Glossary suggestions (merged earlier via `d132561`) |

PR #20 closed (old V-mark logo, superseded by #28). Main head after #32: `8c12222`.

## 11. Known Issues (26 Nov 2026)

- **Free-credit mismatch (open, PR #14 follow-up):** signup grants 20 credits (`FREE_SIGNUP_CREDITS` in `server/config/pricing.js`, the User model default), but the nightly reset sets balances to 10 because Render env `FREE_DAILY_CREDITS` is still 10. Fix: set the env to 20 or remove it so the reset uses the code value. The UI (Home, Register, BlogPost CTA) says "20 free credits"; the 3 newest blog posts say "10 free credits" — both must match the decided value.
- **Sitemap is stale:** `client/public/sitemap.xml` (static, hand-maintained) lists only 6 blog posts — the 3 posts from PR #31 are not in it.
- **No site-wide 404 route:** `App.jsx` has no `path="*"` catch-all; unknown URLs render an empty page shell. `BlogPost` has its own inline "Post not found" state. A dedicated 404 page is being built in the site-polish batch.
- **Blog pages don't use `<Seo />` yet:** `BlogList`/`BlogPost` still use the temporary `setPageMeta` helper, so blog posts have no per-post JSON-LD and no related-posts section; no blog post links to another blog post (all in-post links go to `/register` or `/pricing` only).
- **`Seo.jsx` omits `og:image`** although `client/public/og-image.png` exists (its comment claiming no OG image asset is stale).
- **Homepage copy:** "A second AI reviewer scores every output" — the Reality Check is self-scoring, not a second reviewer.
- **One Urdu-script post still says the old brand name:** `client/src/content/blog/ai-content-generator-in-urdu.md:91` says "ویرزو" (Verzo) — needs correcting to Penlix.
- **CORS non-allowlisted Origin returns a generic 500** — fix when the custom domain arrives.
- **Atlas: dedupe duplicate `stripePaymentIntentId` values** (PR #14 follow-up) or the unique index build fails.
