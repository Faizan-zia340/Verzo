# AI Content Generator SaaS

A full-stack, commercial-ready AI content generation platform with React frontend and Express backend. Users register, receive credits, and spend them to generate AI-written content via OpenAI streaming. Admins manage users, credits, and RAG context documents from a dedicated dark-themed dashboard.

## Architecture

- **Frontend** (`client/`): React 18 + Vite (port 5000), React Router v6, Tailwind CSS, Recharts, Socket.io client
- **Backend** (`server/`): Express + Socket.io (port 3001), proxied via Vite `/api` proxy
- **Database**: MongoDB via Mongoose
- **Auth**: JWT stored in localStorage, `isAdmin` flag on User model
- **Payments**: Stripe Checkout Sessions + webhook credit fulfilment
- **AI**: OpenAI GPT-3.5-turbo (v3 SDK) — streaming SSE, tune, SEO, RAG

## Key Features

### User Dashboard
- **Streaming generation** — `/api/generate/stream` SSE endpoint; typewriter effect on frontend via `ReadableStream`
- **Pre-built templates** — Real Estate Blog, Social Media Post, Cold Email (one-click prompt fill)
- **Output tuning** — Shorten / More Engaging / Professional Tone (no credit deduction, `/api/generate/tune`)
- **Multi-language** — English, Roman Urdu, Arabic (appended to prompt)
- **SEO Package** — Meta Title, Meta Description, 5 Keywords generated alongside content
- **History tab** — All generations saved to MongoDB with Copy + Download TXT buttons

### Admin Dashboard (`/admin`) — Dark Slate Theme
- **Sidebar navigation** — Overview, User Management, System Settings
- **Stats cards** — Total Users, Total Credits Distributed, Active RAG Contexts
- **User management** — Searchable table, inline credit adjustment modal
- **RAG context manager** — Add/delete reference documents (Title, Keywords, Information)

### Backend
- **Credit validation** — `creditCheck` middleware before generation; 402 on insufficient credits
- **RAG workflow** — `Context.findOne({ keywords: { $in: topicKeywords } })` merges trusted context into prompt
- **Stripe billing** — `/api/billing/checkout` creates sessions; `/api/billing/webhook` credits user on `checkout.session.completed`
- **Error handling** — Clean messages for missing/invalid OpenAI key, rate limits, insufficient credits

## Project Structure

```
├── client/src/
│   ├── App.jsx                    # Router, PrivateRoute, AdminRoute guards
│   ├── components/
│   │   ├── Generator.jsx          # Streaming gen, templates, tune, language, SEO panel
│   │   ├── ContentHistory.jsx     # History list with Copy + Download
│   │   ├── Navbar.jsx             # Admin link shown when isAdmin
│   │   ├── Dashboard.jsx          # Stats cards + Recharts usage chart
│   │   ├── CreditsDisplay.jsx
│   │   └── LoadingSpinner.jsx
│   ├── pages/
│   │   ├── Admin.jsx              # Dark slate admin dashboard with sidebar
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx              # Redirects admin → /admin, user → /dashboard
│   │   ├── Register.jsx
│   │   ├── Pricing.jsx
│   │   └── PaymentSuccess.jsx
│   └── context/
│       ├── AuthContext.js         # Persists user+isAdmin to localStorage
│       └── CreditContext.js
│
└── server/
    ├── server.js                  # Express, trust proxy, rate limiter, all routes
    ├── controllers/
    │   ├── generatorController.js # streamGenerate, generate, tuneContent, generateAIContent
    │   └── authController.js      # formatUser() always includes isAdmin
    ├── routes/
    │   ├── generate.js            # POST /  POST /stream  POST /tune  POST /rag
    │   ├── admin.js               # GET /stats  GET|PUT /users  GET|POST|DELETE /contexts
    │   ├── billing.js             # POST /checkout  POST /webhook
    │   └── context.js             # Public context routes
    ├── models/
    │   ├── User.js                # credits, subscription, isAdmin
    │   ├── Content.js             # output, language, seoData{title,description,keywords}
    │   ├── Context.js             # title, keywords[], information
    │   ├── Credit.js
    │   └── Payment.js
    ├── middleware/
    │   ├── auth.js                # JWT protect
    │   ├── isAdmin.js             # isAdmin guard
    │   ├── creditCheck.js         # credits > 0 guard
    │   └── errorHandler.js
    └── utils/
        ├── prompts.js             # buildPrompt (language), buildSEOPrompt, buildTunePrompt
        ├── openai.js              # generateContent, generateRAGContent + error handling
        ├── validators.js          # Joi schemas incl. language field
        └── jwt.js
```

## Environment Variables (Replit Secrets)

| Variable                | Description                                      |
|-------------------------|--------------------------------------------------|
| `OPENAI_API_KEY`        | OpenAI API key (sk-...)                          |
| `STRIPE_SECRET_KEY`     | Stripe secret key                                |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret                    |

Set in `server/.env`:
- `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT=3001`, `CLIENT_URL`

## API Routes

| Method | Path                        | Auth        | Description                            |
|--------|-----------------------------|-------------|----------------------------------------|
| POST   | /api/auth/register          | —           | Register + JWT (includes isAdmin)      |
| POST   | /api/auth/login             | —           | Login + JWT (includes isAdmin)         |
| GET    | /api/auth/me                | JWT         | Current user (includes isAdmin)        |
| POST   | /api/generate               | JWT+credits | Generate content (non-streaming)       |
| POST   | /api/generate/stream        | JWT+credits | Stream generate via SSE + SEO          |
| POST   | /api/generate/tune          | JWT         | Tune existing text (no credit cost)    |
| POST   | /api/generate/rag           | —           | RAG-augmented generation               |
| GET    | /api/history                | JWT         | Paginated content history              |
| DELETE | /api/history/:id            | JWT         | Delete a history item                  |
| GET    | /api/credits                | JWT         | Balance + log                          |
| GET    | /api/admin/stats            | JWT+isAdmin | Totals: users, credits, contexts       |
| GET    | /api/admin/users            | JWT+isAdmin | All users                              |
| PUT    | /api/admin/users/:id/credits| JWT+isAdmin | Adjust user credits                    |
| GET    | /api/admin/contexts         | JWT+isAdmin | List RAG context documents             |
| POST   | /api/admin/contexts         | JWT+isAdmin | Add RAG context document               |
| DELETE | /api/admin/contexts/:id     | JWT+isAdmin | Delete RAG context document            |
| POST   | /api/billing/checkout       | JWT         | Create Stripe Checkout session         |
| POST   | /api/billing/webhook        | raw body    | Stripe webhook → credit fulfilment     |

## Workflows

- **Start application**: `cd client && npm run dev` → port 5000
- **Backend Server**: `cd server && node server.js` → port 3001
