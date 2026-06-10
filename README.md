# AI Content Generator SaaS

A full-stack, commercial-ready AI content generation platform. Users register, receive free credits, and spend them to generate AI-written content via Google Gemini streaming. Admins manage users, credits, RAG context documents, and monitor a live activity feed.

## Features

- **AI Streaming Generation** — Google Gemini `gemini-2.5-flash-lite` with real-time typewriter effect
- **23 Languages & Dialects** — US/UK English, Karachi/Lahore Urdu, Gulf/MSA Arabic, Spanish, French, German, Hindi, Chinese, Japanese, and more
- **Inline Blog Images** — Downloads and saves real Unsplash photos, runs Gemini Vision to describe + translate any text in images, embeds them at AI-chosen positions inside the blog post
- **Reality Check Scoring** — Dual-agent system scores every piece of content on Human-ness, Punchiness, and Cliché avoidance with a visual score card
- **SEO Package** — Auto-generates meta title, meta description, and 5 keywords per generation
- **Content Tune** — Shorten, make more engaging, professional tone, reduce hype (no credit cost)
- **PDF Deep Analyzer** — Upload any PDF, extract text, generate study notes, chapter summaries, and a 10-question test bank
- **PDF & DOCX Export** — Exports with embedded images and SEO metadata
- **Credit System** — 10 free credits on signup, deducts 1 per generation
- **Stripe Billing** — Starter (free), Pro ($10/100cr), Enterprise ($40/500cr)
- **Admin Dashboard** — User management, grant credits by email, RAG context documents, live activity feed
- **Real-time Updates** — Socket.io for live generation notifications

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB Atlas (Mongoose) |
| AI | Google Gemini (`gemini-2.5-flash-lite`, v1 API) |
| Auth | JWT (stored in localStorage) |
| Payments | Stripe Checkout |
| Images | Unsplash API + Gemini Vision |

## Project Structure

```
├── client/                  # React + Vite frontend (port 5000)
│   └── src/
│       ├── components/      # Generator, ContentHistory, Navbar, Dashboard
│       ├── pages/           # Home, Login, Register, Dashboard, Admin, PDFAnalyzer, Pricing
│       └── context/         # AuthContext, CreditContext
│
└── server/                  # Express backend (port 3001)
    ├── controllers/         # generatorController, pdfController
    ├── routes/              # generate, admin, billing, pdf, context
    ├── models/              # User, Content, Context, Credit, Payment
    ├── middleware/          # auth, isAdmin, creditCheck, errorHandler
    └── utils/               # gemini, imageService, unsplash, prompts, validators
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone the repo

```bash
git clone https://github.com/Faizan-zia340/ai-content-generator.git
cd ai-content-generator
```

### 2. Install dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your values:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=any_random_string
GEMINI_API_KEY=your_gemini_key
UNSPLASH_ACCESS_KEY=your_unsplash_key   # optional — enables blog images
STRIPE_SECRET_KEY=sk_test_...           # optional — enables billing
CLIENT_URL=http://localhost:5000
PORT=3001
```

### 4. Run in development

```bash
# Terminal 1 — backend
cd server && node server.js

# Terminal 2 — frontend
cd client && npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

### 5. Create admin account

Register normally, then update the user in MongoDB:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { isAdmin: true } })
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Any random secret string |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `UNSPLASH_ACCESS_KEY` | Optional | Enables inline blog images |
| `STRIPE_SECRET_KEY` | Optional | Enables paid plans |
| `STRIPE_WEBHOOK_SECRET` | Optional | Enables Stripe webhook |
| `CLIENT_URL` | ✅ | Frontend URL (for CORS) |
| `PORT` | ✅ | Backend port (default 3001) |

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register (10 free credits) |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/generate/stream` | JWT | Stream generate via SSE |
| POST | `/api/generate/tune` | JWT | Tune content (no credit cost) |
| POST | `/api/pdf/analyze` | JWT | PDF deep analysis |
| GET | `/api/history` | JWT | Content history |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/users` | Admin | All users |
| POST | `/api/billing/checkout` | JWT | Create Stripe session |

## Deployment

The app is production-ready. Express serves the built React frontend in production.

```bash
# Build frontend
cd client && npm run build

# Start production server
NODE_ENV=production node server/server.js
```

**Note:** This app uses Socket.io and long-running SSE connections. Deploy on platforms that support persistent connections such as **Replit**, **Railway**, or **Render** — not Vercel/Netlify (serverless only).

## License

MIT
