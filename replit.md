# ContentForge — AI Content SaaS

A full-stack, commercial-ready AI content generation platform with React frontend and Express backend. Users register, receive free credits, and spend them to generate AI-written content via Gemini streaming. Admins manage users, credits, RAG context documents, and monitor a live activity feed from a dedicated dashboard.

---

## Live Status (Last Audit: July 2026)

| Feature | Status |
|---|---|
| Register / Login / Logout | ✅ Working (httpOnly cookie JWT) |
| AI Streaming Generation (Gemini) | ✅ Working |
| 23 Languages & Dialects | ✅ Working |
| Dual-Agent REALITY CHECK Scoring | ✅ Working |
| Credit System (deducts on generation) | ✅ Working |
| Content Tune (no credit cost) | ✅ Working |
| SEO Package (title, desc, keywords) | ✅ Auto-generated |
| Content History (copy + download) | ✅ Working |
| PDF Deep Analyzer | ✅ Working |
| PDF / DOCX Export | ✅ Working |
| Admin Dashboard & User Management | ✅ Working |
| MongoDB Atlas | ✅ Connected |
| Semantic RAG (embedding-based context retrieval) | ✅ Working |
| Structured logging (Pino) + request tracing | ✅ Working |
| Per-user rate limiting (10/hr on generation routes) | ✅ Working |
| Startup env validation (fail-fast on missing secrets) | ✅ Working |
| Security headers (Helmet) | ✅ Working |
| Unsplash Images | ⚠️ Needs `UNSPLASH_ACCESS_KEY` |
| Stripe Billing | ⚠️ Needs `STRIPE_SECRET_KEY` (intentionally not configured yet) |

### Hardening Roadmap Progress
- ✅ Section 1 — Replit config (health endpoints, CORS whitelist, Socket.io CORS, MongoDB Atlas whitelist)
- ✅ Section 2 — Security (httpOnly cookie JWT, Helmet, per-user rate limiting, startup env validation)
- ✅ Section 3 — RAG upgrade (embedding-based semantic search with keyword fallback)
- ✅ Section 4 — Reliability & logging (Pino structured logs, operational vs programmer error classification, process crash handlers)
- ⬜ Section 5 — Testing (Jest)
- ⬜ Section 6 — Docs cleanup
- ⬜ Section 7 — Phase 2 features (2A–2D)

---

## Architecture

- **Frontend** (`client/`): React 18 + Vite (port 5000 in dev), React Router v6, Tailwind CSS, Recharts, Framer Motion, react-hot-toast, Socket.io client
- **Backend** (`server/`): Express + Socket.io (port 3001 in dev), in production serves built frontend from `client/dist`
- **Database**: MongoDB Atlas via Mongoose (`bufferCommands: false`, 20-attempt retry logic)
- **Auth**: JWT stored in httpOnly cookie (not localStorage), `isAdmin` flag on User model
- **Payments**: Stripe Checkout Sessions + webhook credit fulfilment
- **AI**: Google Gemini `gemini-2.5-flash-lite` (v1 API) — streaming SSE, tune, SEO, RAG, PDF analysis; embeddings via `gemini-embedding-001` (v1 API) for semantic RAG
- **Logging**: Pino structured logging with per-request trace IDs (`pino-http`), pretty-printed in dev

---

## Key Features

### User Dashboard
- **Streaming generation** — `/api/generate/stream` SSE endpoint; typewriter effect on frontend
- **23 Languages & Dialects** — US/UK English, Karachi/Lahore Urdu, Gulf/MSA Arabic, Spanish (LatAm/Spain), French, German, Portuguese (Brazil), Hindi, Turkish, Chinese, Japanese, Russian, Italian, Dutch, Korean, Bengali, Indonesian, Persian, Swahili
- **Format control** — Paragraphs / Bullet Points / Headings
- **Pre-built templates** — Real Estate Blog, Social Media Post, Cold Email
- **Output tuning** — Shorten / More Engaging / Professional Tone / Reduce Hype (no credit deduction)
- **SEO Package** — Meta Title, Meta Description, 5 Keywords + image keywords per generation
- **Unsplash Images** — 3 relevant stock photos fetched via Unsplash API after generation (requires `UNSPLASH_ACCESS_KEY`)
- **Export** — TXT download, PDF export (jsPDF), DOCX export (Word-compatible HTML blob)
- **Social Share** — LinkedIn and Twitter/X direct share buttons
- **History tab** — All generations saved with Copy + Download TXT buttons

### PDF Deep Analyzer (`/pdf`)
- Upload any PDF up to 10MB
- Extracts text via `pdf-parse` v2 (`PDFParse` class with `.load()` / `.getText()`)
- Chunks large docs (6000 chars/chunk, max 4 chunks fed to Gemini)
- Gemini generates: Study Notes, Chapter Summaries, 10-question Test Bank
- Robust section parser with multi-keyword fallback + raw analysis fallback
- Shows: pages, word count, chunk count
- Export analysis as PDF; copy all to clipboard

### Admin Dashboard (`/admin`) — Sidebar Navigation
- **Overview** — Total Users, Credits, Generations, RAG Contexts stat cards
- **Live Activity Feed** — Last 20 generations with user name/email, type, language, timestamp
- **User Management** — Searchable table, inline credit adjustment modal
- **Grant Credits by Email** — Give/remove credits to any user by email address
- **System Settings** — Add/delete RAG context documents

### Backend
- **Dual-Agent System** — Gemini system message: Expert Copywriter + Brutal AI Reviewer with REALITY CHECK scoring table
- **Credit validation** — `creditCheck` middleware before generation; 402 on insufficient credits
- **Semantic RAG workflow** — context documents embedded via `gemini-embedding-001` on create; retrieval tries cosine-similarity match first (threshold 0.65, top-3), falls back to keyword match (`Context.findOne({ keywords: $in })`) when no document has an embedding or similarity is too low
- **Stripe billing** — `/api/billing/checkout` creates sessions; `/api/billing/webhook` credits user (Stripe keys not yet configured — feature dormant until secrets added)
- **Error handling** — Sanitized messages (no raw MongoDB/Mongoose leaks); operational errors (4xx + 503 upstream overload) show real message, unexpected 5xx errors show generic message and get logged with full stack + request ID
- **Structured logging** — Pino logs every request/response with a UUID trace ID; `logger.info/warn/error` used throughout instead of `console.*`; crash-safety handlers on `unhandledRejection`/`uncaughtException` log and shut down cleanly
- **Global rate limiter** — 150 req / 15 min across all `/api` routes
- **Per-user rate limiter** — 10 requests/hour per logged-in user on `/generate`, `/generate/stream`, `/generate/tune`
- **Startup env validation** — server refuses to start if `MONGODB_URI`, `JWT_SECRET`, or an AI key is missing
- **Security headers** — Helmet enabled (CSP disabled, cross-origin resource policy set for API consumption)
- **Production** — Express serves built React SPA from `client/dist`, SPA fallback for React Router

---

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── App.jsx                    # Router, PrivateRoute, AdminRoute, Toaster
│   │   ├── components/
│   │   │   ├── Generator.jsx          # Streaming gen, 23 langs, tune, SEO, images, export, share
│   │   │   ├── ContentHistory.jsx     # History list with Copy + Download
│   │   │   ├── Navbar.jsx             # PDF Analyzer link, admin link
│   │   │   ├── Dashboard.jsx          # Stats cards (Framer Motion) + Recharts usage chart
│   │   │   ├── CreditsDisplay.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   ├── Admin.jsx              # Activity feed, grant-by-email, user mgmt, RAG settings
│   │   │   ├── Dashboard.jsx          # Glassmorphism dashboard with generate/history tabs
│   │   │   ├── Home.jsx               # Animated hero, stats row, 8-feature grid, CTA
│   │   │   ├── Login.jsx              # DB-down friendly error UI
│   │   │   ├── Register.jsx
│   │   │   ├── Pricing.jsx            # 3 plans: Starter (free), Pro ($10), Enterprise ($40)
│   │   │   ├── PDFAnalyzer.jsx        # PDF upload, analysis, tabbed output, export
│   │   │   └── PaymentSuccess.jsx
│   │   └── context/
│   │       ├── AuthContext.js
│   │       └── CreditContext.js
│   └── vite.config.js                 # Port 5000, /api proxy → localhost:3001
│
└── server/
    ├── server.js                  # Express, Socket.io, Pino HTTP logging, rate limiter, static SPA serving, crash handlers
    ├── config/
    │   ├── database.js            # bufferCommands:false, 20-attempt retry, no process.exit
    │   └── gemini.js
    ├── controllers/
    │   ├── generatorController.js # streamGenerate, generate, tuneContent, generateAIContent (embedding-first RAG retrieval)
    │   └── pdfController.js       # analyzePDF — PDFParse v2 + Gemini chunked analysis
    ├── routes/
    │   ├── generate.js            # GET /ping-ai diagnostic route
    │   ├── admin.js               # stats, activity, users, grant-by-email, contexts (embeds on create)
    │   ├── billing.js             # Plans: pro ($10/100cr), enterprise ($40/500cr)
    │   ├── pdf.js                 # POST /analyze (multer, 10MB, auth)
    │   └── context.js             # embeds context documents on create
    ├── models/
    │   ├── User.js                # isAdmin flag, credits, subscription
    │   ├── Content.js             # images[], format, seoData fields
    │   ├── Context.js             # embedding field (select:false) for semantic RAG
    │   ├── Credit.js
    │   └── Payment.js
    ├── middleware/
    │   ├── auth.js                # reads JWT from httpOnly cookie
    │   ├── isAdmin.js
    │   ├── creditCheck.js         # 402 on insufficient credits
    │   ├── userRateLimit.js       # 10 req/hr per user on generation routes
    │   └── errorHandler.js        # Sanitizes raw MongoDB errors; operational vs programmer classification
    └── utils/
        ├── prompts.js             # LANGUAGE_MAP (23 keys), buildPDFPrompt, FORMAT_MAP
        ├── gemini.js              # Dual-agent system message, getModel, withSystem
        ├── embeddings.js          # generateEmbedding, cosineSimilarity, findRelevantContexts (gemini-embedding-001)
        ├── unsplash.js            # fetchImages — Unsplash API integration
        ├── validators.js          # Joi schemas with stripUnknown:true
        ├── validateEnv.js         # Startup fail-fast on missing required env vars
        ├── logger.js              # Pino logger (pretty in dev, JSON in prod)
        ├── asyncHandler.js        # Wraps async route handlers, forwards errors to errorHandler
        └── jwt.js                 # signs JWT + httpOnly cookieOptions
```

---

## Environment Variables

### Replit Secrets (set in Replit dashboard)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Required | Google Gemini API key (chat model + `gemini-embedding-001` embeddings) |
| `JWT_SECRET` | ✅ Required | Signs the httpOnly auth cookie |
| `MONGODB_URI` | ✅ Required | MongoDB Atlas connection string |
| `STRIPE_SECRET_KEY` | For billing | Stripe secret key (not yet configured — billing dormant) |
| `STRIPE_WEBHOOK_SECRET` | For billing | Stripe webhook signing secret |
| `UNSPLASH_ACCESS_KEY` | For images | Unsplash API access key |
| `LOG_LEVEL` | Optional | Pino log level override (defaults to `debug` in dev, `info` in prod) |

Startup validation (`server/utils/validateEnv.js`) makes the server refuse to boot if `MONGODB_URI`, `JWT_SECRET`, or `GEMINI_API_KEY` is missing — fails fast with a clear message instead of crashing later mid-request.

### server/.env file

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/ai-content-generator
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
PORT=3001
CLIENT_URL=https://your-app.replit.app
```

**MongoDB Atlas requirement:** Network Access must have `0.0.0.0/0` whitelisted (Replit uses dynamic IPs).

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register + JWT (10 free credits), sets httpOnly cookie |
| POST | /api/auth/login | — | Login + JWT, sets httpOnly cookie |
| POST | /api/auth/logout | JWT | Clears the auth cookie |
| GET | /api/auth/me | JWT | Current user |
| POST | /api/generate/stream | JWT+credits | Stream generate via SSE + SEO + images |
| POST | /api/generate/tune | JWT | Tune existing text (no credit cost) |
| POST | /api/generate/rag | — | RAG-augmented generation (`userPrompt` field) |
| GET | /api/generate/ping-ai | JWT | Diagnostic: verify Gemini key works |
| POST | /api/pdf/analyze | JWT | Upload PDF → study notes + summaries |
| GET | /api/history | JWT | Paginated content history |
| DELETE | /api/history/:id | JWT | Delete history item |
| GET | /api/credits | JWT | Balance + log |
| POST | /api/context | JWT | Add RAG context document (generates embedding via `gemini-embedding-001`) |
| GET | /api/admin/stats | JWT+isAdmin | Users, credits, generations, contexts |
| GET | /api/admin/activity | JWT+isAdmin | Last 20 generations with user info |
| GET | /api/admin/users | JWT+isAdmin | All users |
| PUT | /api/admin/users/:id/credits | JWT+isAdmin | Adjust user credits by ID |
| POST | /api/admin/grant-credits | JWT+isAdmin | Grant/remove credits by email |
| GET | /api/admin/contexts | JWT+isAdmin | List RAG context documents |
| POST | /api/admin/contexts | JWT+isAdmin | Add RAG context document |
| DELETE | /api/admin/contexts/:id | JWT+isAdmin | Delete RAG context document |
| POST | /api/billing/checkout | JWT | Create Stripe Checkout session |
| POST | /api/billing/webhook | raw body | Stripe webhook → credit fulfilment |

---

## Workflows (Development)

- **Start application**: `cd client && npm run dev` → port 5000
- **Backend Server**: `cd server && node server.js` → port 3001

## Deployment (Production)

- **Build**: `cd client && npm install && npm run build`
- **Run**: `node server/server.js`
- Express serves the built React SPA from `client/dist` and falls back to `index.html` for React Router

---

## Billing Plans

| Plan | Price | Credits |
|---|---|---|
| Starter | Free | 10 (on signup) |
| Pro | $10 | 100 |
| Enterprise | $40 | 500 |

---

## Future Planning / Roadmap Ideas

- [ ] Email verification on registration
- [ ] Password reset flow
- [ ] User profile page (change name/password)
- [ ] Subscription model (monthly recurring via Stripe)
- [ ] Credit auto-refill / top-up
- [ ] Team/workspace accounts
- [ ] API key for programmatic access
- [ ] Webhook notifications on generation complete
- [ ] More content types (YouTube script, press release, product review)
- [ ] Image generation (DALL-E / Stability AI)
- [ ] Custom brand voice training
- [ ] Usage analytics per user

---

## Hardening Notes (Sections 1–4)

- **CORS**: Locked to `CLIENT_URL` env var + localhost dev origins; Socket.io CORS mirrors the same whitelist. Update `CLIENT_URL` once the real frontend domain is known.
- **Auth**: JWT moved from localStorage to an httpOnly cookie (`server/utils/jwt.js` cookieOptions) — safer against XSS token theft. All frontend fetch calls use `credentials: 'include'`.
- **RAG retrieval**: On generation, the server first tries semantic (embedding) search across context documents (`server/utils/embeddings.js`, cosine similarity, threshold 0.65, top-3). If no context has an embedding or nothing clears the threshold, it falls back to the original keyword match. New context documents get an embedding automatically on creation.
- **Logging**: All `console.*` calls in the backend were replaced with a Pino logger (`server/utils/logger.js`). Every HTTP request gets a UUID trace ID (via `pino-http`) that's echoed back in error responses as `requestId`, useful for correlating a user's bug report with server logs.
- **Error handling**: `server/middleware/errorHandler.js` now distinguishes "operational" errors (400/401/402/403/404/409/422/429/503) — shown to the user with their real message — from unexpected 5xx errors, which get a generic message plus a full stack trace in the logs.
- **Crash safety**: `unhandledRejection` / `uncaughtException` handlers in `server.js` log the failure and shut the process down cleanly instead of leaving it in a corrupted state.
- **Rate limiting**: Global 150 req/15min on `/api/*`, plus a stricter 10 req/hour per logged-in user on the three generation endpoints to prevent one user from burning through Gemini quota.

---

## User Preferences

- Keep MongoDB (do not switch to PostgreSQL)
- Use Gemini AI (`gemini-2.5-flash-lite`, v1 API, `withSystem()` injection pattern)
- ESM throughout (both client and server use `"type": "module"`)
- Keep Tailwind utility classes, no CSS-in-JS
- Prefer named exports from `react-icons/fi`
