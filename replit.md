# ContentForge — AI Content SaaS

A full-stack, commercial-ready AI content generation platform with React frontend and Express backend. Users register, receive free credits, and spend them to generate AI-written content via Gemini streaming. Admins manage users, credits, RAG context documents, and monitor a live activity feed from a dedicated dashboard.

---

## Live Status (Last Audit: June 2026)

| Feature | Status |
|---|---|
| Register / Login / Logout | ✅ Working |
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
| Unsplash Images | ⚠️ Needs `UNSPLASH_ACCESS_KEY` |
| Stripe Billing | ⚠️ Needs `STRIPE_SECRET_KEY` |

---

## Architecture

- **Frontend** (`client/`): React 18 + Vite (port 5000 in dev), React Router v6, Tailwind CSS, Recharts, Framer Motion, react-hot-toast, Socket.io client
- **Backend** (`server/`): Express + Socket.io (port 3001 in dev), in production serves built frontend from `client/dist`
- **Database**: MongoDB Atlas via Mongoose (`bufferCommands: false`, 20-attempt retry logic)
- **Auth**: JWT stored in localStorage, `isAdmin` flag on User model
- **Payments**: Stripe Checkout Sessions + webhook credit fulfilment
- **AI**: Google Gemini `gemini-2.5-flash-lite` (v1 API) — streaming SSE, tune, SEO, RAG, PDF analysis

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
- **RAG workflow** — `Context.findOne({ keywords: $in })` merges trusted context into prompt
- **Stripe billing** — `/api/billing/checkout` creates sessions; `/api/billing/webhook` credits user
- **Error handling** — Sanitized messages (no raw MongoDB/Mongoose leaks), clean user-facing errors
- **Rate limiter** — 150 req / 15 min
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
    ├── server.js                  # Express, Socket.io, rate limiter, static SPA serving
    ├── config/
    │   ├── database.js            # bufferCommands:false, 20-attempt retry, no process.exit
    │   └── gemini.js
    ├── controllers/
    │   ├── generatorController.js # streamGenerate, generate, tuneContent, generateAIContent
    │   └── pdfController.js       # analyzePDF — PDFParse v2 + Gemini chunked analysis
    ├── routes/
    │   ├── generate.js            # GET /ping-ai diagnostic route
    │   ├── admin.js               # stats, activity, users, grant-by-email, contexts
    │   ├── billing.js             # Plans: pro ($10/100cr), enterprise ($40/500cr)
    │   ├── pdf.js                 # POST /analyze (multer, 10MB, auth)
    │   └── context.js
    ├── models/
    │   ├── User.js                # isAdmin flag, credits, subscription
    │   ├── Content.js             # images[], format, seoData fields
    │   ├── Context.js
    │   ├── Credit.js
    │   └── Payment.js
    ├── middleware/
    │   ├── auth.js
    │   ├── isAdmin.js
    │   ├── creditCheck.js         # 402 on insufficient credits
    │   └── errorHandler.js        # Sanitizes raw MongoDB errors
    └── utils/
        ├── prompts.js             # LANGUAGE_MAP (23 keys), buildPDFPrompt, FORMAT_MAP
        ├── gemini.js              # Dual-agent system message, getModel, withSystem
        ├── unsplash.js            # fetchImages — Unsplash API integration
        ├── validators.js          # Joi schemas with stripUnknown:true
        └── jwt.js
```

---

## Environment Variables

### Replit Secrets (set in Replit dashboard)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Required | Google Gemini API key |
| `STRIPE_SECRET_KEY` | For billing | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For billing | Stripe webhook signing secret |
| `UNSPLASH_ACCESS_KEY` | For images | Unsplash API access key |
| `OPENAI_API_KEY` | Legacy/unused | OpenAI key (kept for compatibility) |

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
| POST | /api/auth/register | — | Register + JWT (10 free credits) |
| POST | /api/auth/login | — | Login + JWT |
| GET | /api/auth/me | JWT | Current user |
| POST | /api/generate/stream | JWT+credits | Stream generate via SSE + SEO + images |
| POST | /api/generate/tune | JWT | Tune existing text (no credit cost) |
| POST | /api/generate/rag | — | RAG-augmented generation (`userPrompt` field) |
| GET | /api/generate/ping-ai | JWT | Diagnostic: verify Gemini key works |
| POST | /api/pdf/analyze | JWT | Upload PDF → study notes + summaries |
| GET | /api/history | JWT | Paginated content history |
| DELETE | /api/history/:id | JWT | Delete history item |
| GET | /api/credits | JWT | Balance + log |
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

## User Preferences

- Keep MongoDB (do not switch to PostgreSQL)
- Use Gemini AI (`gemini-2.5-flash-lite`, v1 API, `withSystem()` injection pattern)
- ESM throughout (both client and server use `"type": "module"`)
- Keep Tailwind utility classes, no CSS-in-JS
- Prefer named exports from `react-icons/fi`
