# PROJECT_CONTEXT.md

Last verified against actual code: July 10, 2026. This file is a living document — update it whenever a feature, architectural decision, or significant fix is made.

---

## 1. What This Project Is

ContentForge is a full-stack SaaS web app that generates AI-written content (blog posts, social media posts, cold emails) for users. Users register, get free credits, and spend credits to generate content via a streaming AI response. It supports 23 languages/dialects, tunes existing text (shorten/more engaging/professional/reduce hype) for free, auto-generates an SEO package (meta title/description/keywords) per generation, attaches relevant stock photos, and lets users export/share/download their content. It also includes a standalone PDF analyzer that turns an uploaded PDF into study notes, chapter summaries, and a test bank. An admin dashboard lets an admin manage users, grant/revoke credits, monitor a live generation activity feed, and manage a RAG "knowledge base" of context documents the AI can draw on.

---

## 2. Tech Stack

### Frontend (`client/`)
- React 18 + Vite 4, React Router v6
- Tailwind CSS (utility classes only, no CSS-in-JS)
- Framer Motion (animations), Recharts (dashboard charts)
- axios (HTTP client, `withCredentials: true` for cookie auth)
- react-hot-toast (notifications)
- socket.io-client
- jspdf + html2canvas (PDF export)
- react-icons (named exports from `react-icons/fi`)
- `@stripe/stripe-js` + `@stripe/react-stripe-js` are installed but Stripe checkout is not live (see Decisions Log)

### Backend (`server/`)
- Express 4 + Socket.io 4 (real-time), `pino` + `pino-http` (structured logging), `pino-pretty` (dev log formatting)
- Mongoose 7 → MongoDB Atlas (the actual, live database)
- Auth: `jsonwebtoken` + `bcryptjs`, JWT delivered via an **httpOnly cookie** (not localStorage)
- `helmet` (security headers), `express-rate-limit` (global + per-user limiter), `cookie-parser`
- `joi` (request validation), `multer` (PDF upload)
- `pdf-parse` v2 (PDF text extraction)
- **AI provider actually wired up and in active use: Google Gemini** (`@google/generative-ai` SDK)
  - Chat/content generation model: `gemini-2.5-flash-lite` via the `v1` API (`server/config/gemini.js`)
  - Embeddings model (for semantic RAG search): `gemini-embedding-001` via the `v1` API (`server/utils/embeddings.js`) — note `text-embedding-004` does NOT work on this API key/SDK combination, returns 404
  - `openai` npm package and `server/config/openai.js` / `server/utils/openai.js` exist in the codebase but are **not called from any active route or controller** — dead/unused code, kept only for the `OPENAI_API_KEY` env var compatibility check in `validateEnv.js`
- `stripe` npm package + `server/config/stripe.js` exist and are referenced by `server/routes/billing.js` and `server/controllers/paymentController.js`, but `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are not configured, so billing is dormant (see Decisions Log)

### Database
- **MongoDB Atlas** via Mongoose — this is the real, connected database.
- Network Access whitelist must include `0.0.0.0/0` because Replit's outbound IP changes.
- There is also leftover, **unused** Postgres/Drizzle scaffolding at the repo root (`drizzle.config.js`, `server/db/index.js`, `server/db/schema.js`, `server/models/Subscription.js`) that requires a `DATABASE_URL` env var to even load — it is never imported by the running server (`server/server.js`) and should be treated as dead code, not a second database.

### Auth Method
- JWT signed with `JWT_SECRET`, stored in an **httpOnly, SameSite=Lax cookie** (`server/utils/jwt.js` `cookieOptions`), not localStorage. `server/middleware/auth.js` reads the token from `req.cookies.token`. Login/register set the cookie; `POST /api/auth/logout` clears it. All frontend API calls use `credentials: 'include'` / axios `withCredentials: true`.

---

## 3. Deployment Architecture

The frontend and backend are deployed as **two separate services**, not as a single host:

- **Frontend**: deployed to **Vercel** (see `vercel.json` at repo root — build command `cd client && npm install && npm run build`, output `client/dist`, SPA rewrite to `index.html`).
- **Backend**: deployed to a **Node host that supports long-lived connections** — configured for **Render** (see `render.yaml` — web service, health check at `/api/health`). Also has leftover `railway.toml` / `nixpacks.toml` config files for Railway, which are alternative/unused deploy targets, not the current active one.
- **Why split**: the backend uses **Socket.io** (live activity feed) and **Server-Sent Events / streaming responses** (`/api/generate/stream`) for real-time features. Vercel's serverless functions cannot hold these long-lived connections open, so the backend must run on a persistent Node process (Render), while the static frontend build is served from Vercel's CDN.
- **How they connect**:
  - Frontend → Backend: the client reads `VITE_API_URL` (a build-time env var) to know the backend's URL (`client/src/services/apiUrl.js`, `client/src/services/api.js`). If unset, it falls back to relative paths (used in local dev via the Vite proxy).
  - CORS: the backend whitelists allowed origins via the `CLIENT_URL` env var (plus `localhost:5173`/`localhost:5000` for dev) in `server/server.js`. Socket.io's CORS config mirrors the same whitelist. `CLIENT_URL` currently holds a **placeholder** value (`https://your-project-name.vercel.app`) in the Replit environment (`.replit` → `[userenv.shared]`) — it must be updated to the real Vercel domain once deployed.
  - Local dev (Replit): frontend runs on port 5000 (Vite dev server, proxies `/api` to `localhost:3001`), backend runs on port 3001 — both as separate Replit workflows on the same container, no split needed in dev.

---

## 4. Folder Structure (actual, as of last verification)

```
├── client/                          # Vite React frontend (the one actually served)
│   ├── src/
│   │   ├── App.jsx                  # Router, PrivateRoute, AdminRoute, Toaster
│   │   ├── components/
│   │   │   ├── ContentHistory.jsx
│   │   │   ├── CreditsDisplay.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Generator.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Pricing.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── CreditContext.js
│   │   ├── pages/
│   │   │   ├── Admin.jsx
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
│   │   └── styles/
│   │       ├── index.css
│   │       └── tailwind.css
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js               # port 5000, /api proxy → localhost:3001
│
├── server/                          # Express backend (the one actually run — entrypoint server.js)
│   ├── server.js                    # real entrypoint: Express, Socket.io, Pino logging, rate limiting, SPA fallback, crash handlers
│   ├── config/
│   │   ├── database.js              # Mongoose connect, bufferCommands:false, 20-attempt retry
│   │   ├── gemini.js                # Gemini client, MODEL='gemini-2.5-flash-lite', API_VERSION='v1'
│   │   ├── openai.js                # OpenAI client config — NOT called by any active route
│   │   └── stripe.js                # Stripe client — used by billing route, dormant until keys set
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── generatorController.js   # streamGenerate, tuneContent, generateAIContent, embedding-first RAG retrieval
│   │   ├── paymentController.js     # Stripe checkout/webhook handling — dormant
│   │   ├── pdfController.js
│   │   └── userController.js
│   ├── db/                          # LEFTOVER/UNUSED — Drizzle+Postgres scaffolding, not imported by server.js
│   │   ├── index.js
│   │   └── schema.js
│   ├── index.js                     # LEFTOVER/UNUSED — an alternate, minimal Express entrypoint referencing db/, never started by any workflow or deploy config
│   ├── middleware/
│   │   ├── auth.js                  # reads JWT from httpOnly cookie
│   │   ├── creditCheck.js
│   │   ├── errorHandler.js          # sanitizes DB errors, operational-vs-programmer error classification
│   │   ├── isAdmin.js
│   │   └── userRateLimit.js         # 10 req/hr per user on generation routes
│   ├── models/
│   │   ├── Content.js
│   │   ├── Context.js               # has `embedding` field (select:false) for semantic RAG
│   │   ├── Credit.js
│   │   ├── Payment.js
│   │   ├── Subscription.js          # LEFTOVER/UNUSED — not imported anywhere
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── billing.js
│   │   ├── context.js
│   │   ├── credits.js
│   │   ├── generate.js
│   │   ├── history.js
│   │   ├── payment.js
│   │   ├── pdf.js
│   │   ├── user.js                  # actually mounted in server.js at /api/user
│   │   └── users.js                 # only used by the unused server/index.js, not by server.js
│   └── utils/
│       ├── asyncHandler.js
│       ├── embeddings.js            # generateEmbedding/cosineSimilarity/findRelevantContexts, gemini-embedding-001
│       ├── gemini.js                # dual-agent system prompt, getModel, withSystem, generateText/SEO/tuneText
│       ├── imageService.js          # fetches + embeds Unsplash images into generated content
│       ├── jwt.js                   # signs JWT, defines httpOnly cookieOptions
│       ├── logger.js                # Pino logger, pretty in dev / JSON in prod
│       ├── openai.js                # OpenAI wrapper — NOT called by any active controller
│       ├── prompts.js               # LANGUAGE_MAP (23 langs), FORMAT_MAP, buildPDFPrompt
│       ├── unsplash.js
│       ├── validateEnv.js           # startup fail-fast if MONGODB_URI/JWT_SECRET/AI key missing
│       └── validators.js            # Joi schemas, stripUnknown:true
│   └── package.json                 # server's own dependency list (the one that actually matters at runtime)
│
├── src/                             # LEFTOVER/UNUSED — an older root-level React app skeleton (main.jsx, App.jsx, pages/Home.jsx), not part of the running client/ or server/ build
├── attached_assets/                 # user-pasted files/screenshots dropped into chat, not app source
├── .agents/                         # agent memory directory (not app code)
├── package.json                     # root-level package.json — mixes some client and server deps together, NOT what actually runs either app (client/package.json and server/package.json are authoritative)
├── package-lock.json
├── drizzle.config.js                # LEFTOVER/UNUSED — Postgres/Drizzle config, no active Postgres database
├── railway.toml                     # unused alternate deploy config (Railway)
├── nixpacks.toml                    # unused alternate build config
├── render.yaml                      # ACTIVE backend deploy config (Render)
├── vercel.json                      # ACTIVE frontend deploy config (Vercel)
├── .env.example
├── .replit                          # Replit workspace config: two dev workflows (client on 5000, server on 3001), autoscale deployment target, CLIENT_URL placeholder
├── README.md                        # older/possibly stale project readme, not actively maintained
├── DOCUMENTATION.md                 # older/possibly stale doc file, not actively maintained
└── replit.md                        # the actively maintained project README/status doc for this Replit workspace
```

---

## 5. Decisions Log

- **JWT moved to httpOnly cookie** instead of localStorage — reduces XSS token-theft risk. All frontend requests now send `credentials: 'include'` / `withCredentials: true`.
- **Stripe left unconfigured on purpose** — `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are not set; the billing code path exists (`routes/billing.js`, `controllers/paymentController.js`, `config/stripe.js`) but is dormant. This was an explicit choice, not an oversight — set the two secrets to activate it.
- **CORS locked to an explicit whitelist** — `CLIENT_URL` env var + hardcoded localhost dev origins, replacing an earlier open/permissive CORS setup. Socket.io CORS uses the identical whitelist logic.
- **MongoDB Atlas IP whitelist set to `0.0.0.0/0`** — required because Replit's outbound IP is dynamic; this is a manual setting in the Atlas dashboard, not something the app config controls.
- **Frontend/backend split across Vercel + Render** — chosen specifically because Socket.io and SSE streaming need a persistent server process, which Vercel serverless functions cannot provide.
- **RAG retrieval upgraded from pure keyword match to embedding-based semantic search** — `gemini-embedding-001` embeddings + cosine similarity (threshold 0.65, top-3), with automatic fallback to the original keyword match (`Context.findOne({ keywords: $in })`) when no context has an embedding or nothing clears the threshold.
- **`text-embedding-004` does not work** on the currently configured Gemini API key/SDK — returns 404 regardless of API version (`v1` or `v1beta`). `gemini-embedding-001` on `v1` is the confirmed working model.
- **Structured logging via Pino** replaced all `console.*` calls in the backend — every request gets a UUID trace ID; logs are pretty-printed in dev and JSON in production.
- **Error handler distinguishes operational vs. programmer errors** — 4xx codes and 503 (upstream AI overload) show the real, honest error message to the user; genuinely unexpected 5xx errors are replaced with a generic message and logged with full stack trace + request ID.
- **Per-user rate limiting added on generation endpoints** (10 requests/hour) on top of the existing global limiter (150 requests/15 min), to stop a single user from exhausting the shared Gemini quota.
- **Startup environment validation added** — the server refuses to boot if `MONGODB_URI`, `JWT_SECRET`, or an AI key is missing, rather than failing unpredictably mid-request later.

---

## 6. Features Implemented So Far (verified working in code)

- User registration/login/logout with JWT-in-httpOnly-cookie auth
- Free credits granted on signup; credits deducted on generation (`creditCheck` middleware, 402 on insufficient credits)
- Streaming AI content generation via SSE (`POST /api/generate/stream`), 23 languages/dialects, 3 output formats (paragraphs/bullets/headings), 3 pre-built templates
- Dual-agent "REALITY CHECK" scoring embedded in Gemini's output (Expert Copywriter + Brutal AI Reviewer system prompt)
- Content tuning (shorten / more engaging / professional tone / reduce hype) — no credit cost
- Auto-generated SEO package (meta title, meta description, 5 keywords) per generation
- Unsplash stock image fetching + embedding into generated content (requires `UNSPLASH_ACCESS_KEY`)
- Export to TXT, PDF (jsPDF), DOCX (HTML blob); LinkedIn/Twitter share buttons
- Content history with copy/download, paginated, deletable
- PDF Deep Analyzer: upload up to 10MB, extracts text (`pdf-parse` v2), chunks large docs, produces study notes/chapter summaries/10-question test bank, exports as PDF
- Admin dashboard: stats overview, live activity feed (last 20 generations), searchable user management with credit adjustment, grant/revoke credits by email, RAG context document management
- Semantic RAG: context documents are embedded on creation (`gemini-embedding-001`); generation retrieval tries cosine-similarity match first, falls back to keyword match
- Structured request logging with trace IDs (Pino)
- Global + per-user rate limiting
- Security headers via Helmet
- Startup environment variable validation
- Health check endpoints (`/health`, `/api/health`) for deployment platform monitoring

---

## 7. In Progress / Not Yet Built

- Automated testing (Jest) — not started
- Further documentation/code cleanup — not started
- "Phase 2" feature set (2A–2D, not yet scoped/started in this file — see `replit.md` roadmap section for the latest status)
- Stripe billing — code exists but is not live (secrets not configured)
- Email verification on registration
- Password reset flow
- User profile page (change name/password)
- Recurring subscription billing
- Credit auto-refill/top-up
- Team/workspace accounts
- Public API key access
- Webhook notifications on generation complete
- Additional content types (YouTube script, press release, product review)
- Image generation (as opposed to stock photo fetching)
- Custom brand voice training
- Per-user usage analytics

---

## 8. Known Constraints

- **MongoDB Atlas IP whitelist is manual** — set to `0.0.0.0/0` to tolerate Replit's dynamic outbound IP; if this is ever tightened, the app will lose DB connectivity until it's reopened.
- **`CLIENT_URL` is currently a placeholder** (`https://your-project-name.vercel.app`) in the Replit dev environment — CORS will reject the real deployed frontend's origin until this is updated to the actual Vercel domain.
- **Render free tier** (per `render.yaml`, `plan: free`) — free web services on Render spin down after inactivity and cold-start on the next request, which will cause a noticeable delay on the first request after idling.
- **Gemini has occasional transient 503 overload errors** — the app now surfaces these honestly to the user ("temporarily overloaded, try again shortly") rather than pretending it's a app-side bug, but they are outside this app's control.
- **Stripe is not live** — `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are unset; any billing UI that references pricing/checkout will not actually process payments until these are configured.
- **The `openai` package/config/utils are dead code** — present in `server/package.json` and `server/config|utils/openai.js` but never called by any live route; do not assume OpenAI is a working fallback.
- **Root-level clutter is leftover from earlier scaffolding, not part of the running app**: `src/` (a second, unused React app skeleton), root `package.json` (a third, inconsistent dependency manifest), `drizzle.config.js` + `server/db/` + `server/models/Subscription.js` (unused Postgres/Drizzle setup requiring a `DATABASE_URL` that isn't configured), `server/index.js` (an alternate, unused Express entrypoint), `server/routes/users.js` (only reachable through that unused entrypoint), `railway.toml`/`nixpacks.toml` (unused alternate deploy configs), `README.md`/`DOCUMENTATION.md` (older docs not actively kept in sync — `replit.md` is the maintained one).
- **No automated tests exist yet** — all verification so far has been manual (curl requests, manual DB inspection), so regressions are only caught by hand-testing.

---

## 9. Instructions for Any AI Helping With This Project

- **Do not** suggest deploying this as a single Vercel-only app — the backend needs Socket.io/SSE, which Vercel serverless cannot sustain. The split (Vercel frontend + Render backend) is intentional.
- **Do not** assume Stripe is processing real payments — the integration code exists but the secrets are deliberately unconfigured. Ask before assuming billing works.
- **Do not** assume OpenAI is an active AI provider — only Gemini (`gemini-2.5-flash-lite` for generation, `gemini-embedding-001` for embeddings) is actually wired into the live code paths. The `openai` package/files are unused leftovers.
- **Do not** treat `server/db/`, `server/models/Subscription.js`, `drizzle.config.js`, `server/index.js`, the root-level `src/` folder, or the root `package.json` as part of the running application — they are unused scaffolding from earlier iterations. The authoritative app is `client/` (frontend) + `server/` (backend, entrypoint `server/server.js`).
- **Do not** suggest switching the database from MongoDB to Postgres — this has been explicitly decided against (see `replit.md` User Preferences).
- **Do not** suggest moving JWT back to localStorage — the httpOnly cookie approach was a deliberate security fix.
- **Do** treat `replit.md` as the actively maintained status/roadmap doc, and this file (`PROJECT_CONTEXT.md`) as the portable, AI-facing snapshot — keep both in sync when making significant changes.
- **Do** verify claims against the actual code before adding to this file — this document exists specifically to avoid guessing.
