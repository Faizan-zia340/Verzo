# AI Content Generator SaaS

A full-stack, commercial-ready AI content generation platform with React frontend and Express backend. Users register, receive credits, and spend them to generate AI-written content via Gemini streaming. Admins manage users, credits, RAG context documents, and a live activity feed from a dedicated dashboard.

## Architecture

- **Frontend** (`client/`): React 18 + Vite (port 5000), React Router v6, Tailwind CSS, Recharts, Framer Motion, react-hot-toast, Socket.io client
- **Backend** (`server/`): Express + Socket.io (port 3001), proxied via Vite `/api` proxy
- **Database**: MongoDB via Mongoose
- **Auth**: JWT stored in localStorage, `isAdmin` flag on User model
- **Payments**: Stripe Checkout Sessions + webhook credit fulfilment
- **AI**: Google Gemini `gemini-2.5-flash-lite` (v1 API) — streaming SSE, tune, SEO, RAG, PDF analysis

## Key Features

### User Dashboard
- **Streaming generation** — `/api/generate/stream` SSE endpoint; typewriter effect on frontend
- **23 Languages & Dialects** — US/UK English, Karachi/Lahore Urdu, Gulf/MSA Arabic, Spanish (LatAm/Spain), French, German, Portuguese (Brazil), Hindi, Turkish, Chinese, Japanese, Russian, Italian, Dutch, Korean, Bengali, Indonesian, Persian, Swahili
- **Format control** — Paragraphs / Bullet Points / Headings
- **Pre-built templates** — Real Estate Blog, Social Media Post, Cold Email
- **Output tuning** — Shorten / More Engaging / Professional Tone / Reduce Hype (no credit deduction)
- **SEO Package** — Meta Title, Meta Description, 5 Keywords + image keywords per generation
- **Unsplash Images** — 3 relevant stock photos fetched via Unsplash API after generation
- **Export** — TXT download, PDF export (jsPDF), DOCX export (Word-compatible HTML blob)
- **Social Share** — LinkedIn and Twitter/X direct share buttons
- **History tab** — All generations saved with Copy + Download TXT buttons

### PDF Deep Analyzer (`/pdf`)
- Upload any PDF up to 10MB
- Extracts text via `pdf-parse` (`PDFParse` class), chunks large docs (6000 chars/chunk)
- Gemini generates: Study Notes, Chapter Summaries, 10-question Test Bank
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
- **Error handling** — Clean messages for missing/invalid Gemini key, rate limits, insufficient credits
- **Rate limiter** — 150 req / 15 min

## Project Structure

```
├── client/src/
│   ├── App.jsx                    # Router, PrivateRoute, AdminRoute, Toaster
│   ├── components/
│   │   ├── Generator.jsx          # Streaming gen, 23 langs, tune, SEO, images, export, share
│   │   ├── ContentHistory.jsx     # History list with Copy + Download
│   │   ├── Navbar.jsx             # PDF Analyzer link, admin link
│   │   ├── Dashboard.jsx          # Stats cards (Framer Motion) + Recharts usage chart
│   │   ├── CreditsDisplay.jsx
│   │   └── LoadingSpinner.jsx
│   ├── pages/
│   │   ├── Admin.jsx              # Activity feed, grant-by-email, user mgmt, RAG settings
│   │   ├── Dashboard.jsx          # Glassmorphism dashboard with generate/history tabs
│   │   ├── Home.jsx               # Animated hero, stats row, 8-feature grid, CTA
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Pricing.jsx
│   │   ├── PDFAnalyzer.jsx        # PDF upload, analysis, tabbed output, export
│   │   └── PaymentSuccess.jsx
│   └── context/
│       ├── AuthContext.js
│       └── CreditContext.js
│
└── server/
    ├── server.js                  # Express, rate limiter (150/15min), all routes
    ├── controllers/
    │   ├── generatorController.js # streamGenerate, generate, tuneContent, generateAIContent
    │   └── pdfController.js       # analyzePDF — PDFParse + Gemini chunked analysis
    ├── routes/
    │   ├── generate.js
    │   ├── admin.js               # stats, activity, users, grant-by-email, contexts
    │   ├── billing.js
    │   ├── pdf.js                 # POST /analyze (multer, 10MB, auth)
    │   └── context.js
    ├── models/
    │   ├── User.js
    │   ├── Content.js             # + images[], format fields
    │   ├── Context.js
    │   ├── Credit.js
    │   └── Payment.js
    ├── middleware/
    │   ├── auth.js
    │   ├── isAdmin.js
    │   ├── creditCheck.js
    │   └── errorHandler.js
    └── utils/
        ├── prompts.js             # LANGUAGE_MAP (23 keys), buildPDFPrompt, FORMAT_MAP
        ├── gemini.js              # Dual-agent system message, getModel, withSystem
        ├── unsplash.js            # fetchImages — Unsplash API integration
        ├── openai.js              # Legacy (kept for compatibility)
        ├── validators.js          # Joi schemas
        └── jwt.js
```

## Environment Variables (Replit Secrets)

| Variable                | Description                                      |
|-------------------------|--------------------------------------------------|
| `GEMINI_API_KEY`        | Google Gemini API key                            |
| `OPENAI_API_KEY`        | OpenAI API key (legacy, unused by default)       |
| `STRIPE_SECRET_KEY`     | Stripe secret key                                |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret                    |
| `UNSPLASH_ACCESS_KEY`   | Unsplash API key (optional — images disabled if absent) |

Set in `server/.env`:
- `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT=3001`, `CLIENT_URL`

## API Routes

| Method | Path                          | Auth         | Description                              |
|--------|-------------------------------|--------------|------------------------------------------|
| POST   | /api/auth/register            | —            | Register + JWT                           |
| POST   | /api/auth/login               | —            | Login + JWT                              |
| GET    | /api/auth/me                  | JWT          | Current user                             |
| POST   | /api/generate/stream          | JWT+credits  | Stream generate via SSE + SEO + images   |
| POST   | /api/generate/tune            | JWT          | Tune existing text (no credit cost)      |
| POST   | /api/generate/rag             | —            | RAG-augmented generation                 |
| POST   | /api/pdf/analyze              | JWT          | Upload PDF → study notes + summaries     |
| GET    | /api/history                  | JWT          | Paginated content history                |
| DELETE | /api/history/:id              | JWT          | Delete history item                      |
| GET    | /api/credits                  | JWT          | Balance + log                            |
| GET    | /api/admin/stats              | JWT+isAdmin  | Users, credits, generations, contexts    |
| GET    | /api/admin/activity           | JWT+isAdmin  | Last 20 generations with user info       |
| GET    | /api/admin/users              | JWT+isAdmin  | All users                                |
| PUT    | /api/admin/users/:id/credits  | JWT+isAdmin  | Adjust user credits by ID                |
| POST   | /api/admin/grant-credits      | JWT+isAdmin  | Grant/remove credits by email            |
| GET    | /api/admin/contexts           | JWT+isAdmin  | List RAG context documents               |
| POST   | /api/admin/contexts           | JWT+isAdmin  | Add RAG context document                 |
| DELETE | /api/admin/contexts/:id       | JWT+isAdmin  | Delete RAG context document              |
| POST   | /api/billing/checkout         | JWT          | Create Stripe Checkout session           |
| POST   | /api/billing/webhook          | raw body     | Stripe webhook → credit fulfilment       |

## Workflows

- **Start application**: `cd client && npm run dev` → port 5000
- **Backend Server**: `cd server && node server.js` → port 3001

## User Preferences

- Keep MongoDB (do not switch to PostgreSQL)
- Use Gemini AI (gemini-2.5-flash-lite, v1 API, withSystem() injection pattern)
- ESM throughout (both client and server use `"type": "module"`)
- Keep Tailwind utility classes, no CSS-in-JS
- Prefer named exports from react-icons/fi
