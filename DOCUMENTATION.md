# Penlix — Full Project Documentation

> **Verification note (24 Nov 2026, main @ d9fc369):** the AI provider was corrected from OpenAI to Gemini throughout this file — the app uses Google Gemini (`gemini-2.5-flash-lite`, `@google/generative-ai`, `server/config/gemini.js`); OpenAI is not used anywhere. Local ports were corrected to Vite 5000 / Express 3001. Some older sections (folder tree, API tables) may still lag the code — verify against the code before relying on them.


## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Backend — Libraries & Their Purpose](#backend--libraries--their-purpose)
5. [Frontend — Libraries & Their Purpose](#frontend--libraries--their-purpose)
6. [Database Models](#database-models)
7. [API Routes Reference](#api-routes-reference)
8. [Controllers](#controllers)
9. [Middleware](#middleware)
10. [Utility Modules](#utility-modules)
11. [Context Providers (Frontend)](#context-providers-frontend)
12. [RAG System](#rag-system)
13. [Environment Variables](#environment-variables)
14. [How Data Flows](#how-data-flows)

---

## Project Overview

An AI-powered content generation SaaS platform. Users register, receive credits, and spend them to generate blog posts, social media captions, emails, ads, and product descriptions using Google Gemini (`gemini-2.5-flash-lite`).
 Payments are handled via Stripe and all data is stored in MongoDB. A RAG (Retrieval-Augmented Generation) system allows the AI to pull accurate local information from the database before generating a response.

---

## Architecture

```
Browser (React)
    │
    ▼
Vite Dev Server — port 5000
    │  /api/* requests proxied to →
    ▼
Express Server — port 3001
    │
    ├── MongoDB Atlas (Mongoose)
    ├── Gemini API (gemini-2.5-flash-lite)

    ├── Stripe API
    └── Socket.io (real-time generation events)
```

### Production Deployment (Vercel + Render)

The frontend is deployed on Vercel and the Express backend on Render
(`https://verzo-backend.onrender.com`); the backend is **not** deployed on
Vercel. The frontend normally calls the backend directly via
`VITE_API_URL`, but `vercel.json` also proxies `/api/*` to the Render
backend, before the SPA catch-all rewrite to `/index.html`. That proxy is
the fallback: without it, any `/api/*` request reaching Vercel itself was
rewritten to `index.html` (GET returned the HTML page, POST returned
405), so login and all API calls failed whenever `VITE_API_URL` was not
baked into the build. Order matters — Vercel applies the first matching
rewrite, so the `/api` rule must stay above the catch-all.

---

## Folder Structure

```
verzo/

│
├── client/                          # React frontend (Vite)
│   ├── index.html                   # HTML entry point for Vite
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   └── src/
│       ├── index.js                 # React app entry point
│       ├── App.jsx                  # Root component, router, route protection
│       ├── components/
│       │   ├── Navbar.jsx           # Top navigation bar
│       │   ├── Generator.jsx        # Content generation form + output
│       │   ├── CreditsDisplay.jsx   # Shows remaining credits
│       │   ├── ContentHistory.jsx   # Lists past generated content
│       │   ├── Pricing.jsx          # Pricing cards component
│       │   ├── Dashboard.jsx        # Stats and usage chart
│       │   ├── DashboardChart.jsx   # Dashboard usage chart
│       │   └── LoadingSpinner.jsx   # Reusable loading indicator

│       ├── pages/
│       │   ├── Home.jsx             # Landing page
│       │   ├── Login.jsx            # Login form
│       │   ├── Register.jsx         # Registration form
│       │   ├── ForgotPassword.jsx   # Request a password-reset link
│       │   ├── ResetPassword.jsx    # Set a new password from a reset link
│       │   ├── Dashboard.jsx        # Main dashboard page
│       │   ├── Admin.jsx            # Admin dashboard
│       │   ├── Pricing.jsx          # Pricing page
│       │   ├── PDFAnalyzer.jsx      # PDF Deep Analyzer page
│       │   └── PaymentSuccess.jsx   # Stripe redirect success page

│       ├── context/
│       │   ├── AuthContext.js       # Global auth state (user, login, logout)
│       │   └── CreditContext.js     # Global credit balance state
│       ├── services/
│       │   ├── api.js               # Axios instance with interceptors
│       │   └── auth.js              # Auth service helpers
│       └── styles/
│           └── index.css            # Tailwind CSS directives
│
└── server/                          # Express backend (Node.js)
    ├── server.js                    # Main entry point
    ├── .env                         # Environment variables (secret)
    ├── .env.example                 # Template for environment variables
    ├── config/
    │   ├── database.js              # MongoDB connection via Mongoose
    │   ├── gemini.js                # Gemini API client setup (MODEL='gemini-2.5-flash-lite')
    │   └── stripe.js                # Stripe API client setup

    ├── models/
    │   ├── User.js                  # User accounts and credit balance
    │   ├── Content.js               # Generated content records
    │   ├── Credit.js                # Credit transaction log
    │   ├── Payment.js               # Stripe payment records
    │   └── Context.js               # RAG reference data store

    ├── routes/
    │   ├── auth.js                  # /api/auth/*
    │   ├── generate.js              # /api/generate/*
    │   ├── user.js                  # /api/user/*
    │   ├── credits.js               # /api/credits/*
    │   ├── payment.js               # /api/payment/*
    │   ├── history.js               # /api/history/*
    │   └── admin.js                 # /api/admin/* (incl. /contexts)
    ├── controllers/
    │   ├── authController.js        # Register, login, getMe logic
    │   ├── generatorController.js   # Standard and RAG content generation
    │   ├── paymentController.js     # Stripe intents and webhook
    │   └── userController.js        # Profile get and update
    ├── middleware/
    │   ├── auth.js                  # JWT verification middleware
    │   ├── creditCheck.js           # Blocks requests if credits < required
    │   └── errorHandler.js          # Global Express error handler
    └── utils/
        ├── gemini.js                # getModel, generateText/SEO/tuneText, dual-agent system prompt

        ├── prompts.js               # buildPrompt() for each content type
        ├── validators.js            # Joi validation schemas + validate()
        └── jwt.js                   # generateToken() helper
```

---

## Backend — Libraries & Their Purpose

### `express` ^4.18.2
The core HTTP server framework. Handles all incoming API requests, routing, and middleware chaining.
```js
import express from 'express';
const app = express();
app.use('/api/auth', authRoutes);
```

### `mongoose` ^7.0.0
MongoDB Object Document Mapper (ODM). Lets us define schemas and models to interact with MongoDB in a structured, validated way instead of raw queries.
```js
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);
```

### `cors` ^2.8.5
Cross-Origin Resource Sharing middleware. Allows the React frontend (running on port 5000) to make HTTP requests to the Express backend (port 3001) without browser security blocks. Allowed origins are whitelisted in `server/server.js` from the `CLIENT_URL` env var plus `http://localhost:5173`/`http://localhost:5000` for dev (on main, a `*.vercel.app` / `*.replit.dev` regex also matches — see Known issues in `PROJECT_CONTEXT.md`; PR #8 replaces this with an exact allowlist).
```js
app.use(cors({ origin: corsOriginCheck, credentials: true }));
```


### `dotenv` ^16.0.3
Loads environment variables from the `.env` file into `process.env`. Keeps secrets like API keys out of the source code.
```js
import 'dotenv/config';
process.env.GEMINI_API_KEY; // now accessible

```

### `jsonwebtoken` ^9.0.0
Creates and verifies JSON Web Tokens (JWTs). Used for stateless user authentication — the server signs a token on login, and the client sends it with every subsequent request.
```js
import jwt from 'jsonwebtoken';
jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
jwt.verify(token, process.env.JWT_SECRET);
```

### `bcryptjs` ^2.4.3
Hashes passwords before storing them in MongoDB, and verifies passwords on login. Ensures raw passwords are never saved to the database.
```js
import bcrypt from 'bcryptjs';
const hashed = await bcrypt.hash(password, 12);
const match = await bcrypt.compare(candidatePassword, hashed);
```

### `@google/generative-ai` (Gemini)
Google's Gemini SDK. Used to send prompts to `gemini-2.5-flash-lite` and receive generated text responses. The client is configured in `server/config/gemini.js` (`MODEL='gemini-2.5-flash-lite'`, `API_VERSION='v1'`).
```js
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' }, { apiVersion: 'v1' });
```

OpenAI is not used anywhere in this codebase — the unused `openai` package and its wrapper files were removed during cleanup (July 2026).


### `stripe` ^11.10.0
Stripe's Node.js SDK. Used to create payment intents (charge users for credit packs) and verify incoming webhook events from Stripe to securely credit user accounts after payment.
```js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
await stripe.paymentIntents.create({ amount: 499, currency: 'usd' });
```

### `socket.io` ^4.5.4
Enables real-time, bidirectional communication between the server and the browser over WebSockets. Used to emit events to the frontend as AI content is being generated (e.g., `generation:start`, `generation:done`).
```js
import { Server } from 'socket.io';
const io = new Server(server);
io.to(userId).emit('generation:done', { content });
```

### `express-rate-limit` ^6.7.0
Limits the number of requests a single IP can make in a time window. Prevents abuse and API key exhaustion by bots or malicious users.
```js
import rateLimit from 'express-rate-limit';
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

### `joi` ^17.9.1
Schema-based request body validation. Validates that incoming data (e.g., email format, password length, content type) is correct before it reaches the controller.
```js
import Joi from 'joi';
const schema = Joi.object({ email: Joi.string().email().required() });
const { error } = schema.validate(req.body);
```

### `axios` ^1.3.4 *(server-side)*
HTTP client used in the backend for making external API requests if needed.

### `nodemon` ^2.0.22 *(dev only)*
Watches server files for changes and automatically restarts the Node.js server during development. Only used in the `dev` script.
```json
"dev": "nodemon server.js"
```

---

## Frontend — Libraries & Their Purpose

### `react` ^18.2.0 + `react-dom` ^18.2.0
The core UI library. React lets us build the interface as a tree of reusable components. `react-dom` renders those components into the browser's DOM.

### `react-router-dom` ^6.10.0
Client-side routing. Handles navigation between pages (Home, Login, Dashboard, Pricing) without a full page reload. Also used for the `PrivateRoute` guard that redirects unauthenticated users to `/login`.
```jsx
<Routes>
  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
</Routes>
```

### `axios` ^1.3.4 *(client-side)*
HTTP client for making API calls to the Express backend. A pre-configured instance with the base URL and a 401 interceptor (auto-logout on token expiry) lives in `src/services/api.js`. The interceptor does not redirect on a 401 from `GET /auth/me` (AuthProvider already handles it) or on public pages (`/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/pricing`, `/payment-success`), so a logged-out visitor can open the password-reset link.
```js
const api = axios.create({ baseURL: '/api' });
api.get('/auth/me');
```

### `socket.io-client` ^4.5.4
The browser-side Socket.io library. Connects to the Express Socket.io server to receive real-time events like `generation:start` and `generation:done` while AI content is being generated.

### `@stripe/react-stripe-js` ^2.1.0 + `@stripe/stripe-js` ^1.46.0
Stripe's official React library and JS SDK. Used to render the Stripe payment UI (card input) and securely collect payment details without raw card numbers touching our server.

### `recharts` ^2.5.0
A charting library built on top of React and D3. Used in the Dashboard component to render a bar chart of recent credit usage over time.
```jsx
<BarChart data={usageData}>
  <Bar dataKey="used" fill="#6366f1" />
</BarChart>
```

### `react-icons` ^4.8.0
Provides thousands of SVG icons as React components. Used throughout the UI (e.g., `FiZap`, `FiLogOut`, `FiCheck`, `FiTrash2`) without needing to manage icon files manually.
```jsx
import { FiZap } from 'react-icons/fi';
<FiZap className="text-indigo-600" />
```

### `date-fns` ^2.29.3
Lightweight date utility library. Used in `ContentHistory.jsx` to format timestamps into human-readable relative strings like "3 hours ago".
```js
import { formatDistanceToNow } from 'date-fns';
formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
```

### `tailwindcss` ^3.2.7 *(dev)*
A utility-first CSS framework. All styling is done by applying small utility classes directly in JSX rather than writing custom CSS files. Configured via `tailwind.config.js`.

### `vite` ^4.2.0 *(dev)*
The frontend build tool and development server. Provides instant hot module replacement (HMR), fast builds, and the `/api` proxy to the Express backend.

### `@vitejs/plugin-react` ^3.1.0 *(dev)*
Vite plugin that adds React Fast Refresh (hot reload that preserves component state) and JSX transform support.

### `postcss` + `autoprefixer` *(dev)*
PostCSS processes Tailwind's CSS directives into real CSS. Autoprefixer automatically adds vendor prefixes (`-webkit-`, `-moz-`) for browser compatibility.

---

## Database Models

### `User`
Stores account information and credit balance.

| Field | Type | Description |
|---|---|---|
| `name` | String | Display name |
| `email` | String | Unique login email |
| `password` | String | bcrypt-hashed password |
| `credits` | Number | Current credit balance (default: 10) |
| `subscription` | String | `free`, `basic`, or `pro` |
| `stripeCustomerId` | String | Stripe customer reference |
| `resetPasswordToken` | String | SHA-256 hash of the password-reset token (never the raw token) |
| `resetPasswordExpires` | Date | Reset-token expiry, about 1 hour after issue |
| `createdAt` | Date | Account creation timestamp |

**Methods:**
- `pre('save')` — hashes the password before every save
- `comparePassword(candidate)` — verifies login password against the hash

---

### `Content`
Records every piece of AI-generated content.

| Field | Type | Description |
|---|---|---|
| `user` | ObjectId | Reference to the User who generated it |
| `type` | String | `blog`, `social`, `email`, `ad`, `product` |
| `prompt` | String | The original user prompt |
| `output` | String | The AI-generated text |
| `creditsUsed` | Number | Credits consumed (default: 1) |
| `createdAt` | Date | Generation timestamp |

---

### `Credit`
Transaction log — every credit gain or spend is recorded here.

| Field | Type | Description |
|---|---|---|
| `user` | ObjectId | Reference to the User |
| `amount` | Number | Positive = gained, negative = spent |
| `type` | String | `purchase`, `usage`, or `bonus` |
| `description` | String | Human-readable note |
| `createdAt` | Date | Transaction timestamp |

---

### `Payment`
Records Stripe payment attempts.

| Field | Type | Description |
|---|---|---|
| `user` | ObjectId | Reference to the User |
| `stripePaymentIntentId` | String | Stripe's unique payment ID |
| `amount` | Number | Amount in cents (e.g., 499 = $4.99) |
| `currency` | String | Currency code (default: `usd`) |
| `status` | String | `pending`, `succeeded`, or `failed` |
| `creditsAdded` | Number | Credits granted after success |
| `createdAt` | Date | Payment timestamp |

---

### `Subscription`
Tracks active Stripe subscriptions for recurring plans.

| Field | Type | Description |
|---|---|---|
| `user` | ObjectId | Reference to the User |
| `stripeSubscriptionId` | String | Stripe subscription ID |
| `plan` | String | `basic` or `pro` |
| `status` | String | `active`, `canceled`, or `past_due` |
| `currentPeriodEnd` | Date | When the current billing period ends |
| `createdAt` | Date | Subscription creation date |

---

### `Context` *(RAG System)*
Stores reference knowledge used to augment AI prompts before generation.

| Field | Type | Description |
|---|---|---|
| `title` | String | Name of the knowledge entry |
| `keywords` | [String] | Tags used to match against user topics |
| `information` | String | The factual content injected into the prompt |
| `createdAt` | Date | Creation timestamp |

---

## API Routes Reference

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Create account, returns JWT |
| POST | `/login` | No | Login, returns JWT |
| GET | `/me` | JWT | Returns current user info |
| POST | `/forgot-password` | No | Request a reset link; always returns the same generic message, whether or not the email is registered |
| POST | `/reset-password/:token` | No | Set a new password (min. 6 characters) with a valid, unexpired reset token; clears the token on success |

### Generate — `/api/generate`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT + 1 credit | Standard content generation (requires per-type details, quality-checked, 1 retry) |
| POST | `/stream` | JWT + 1 credit | Streaming generation (SSE, same validation and quality check) |
| POST | `/rag` | No | RAG-augmented generation (quality-checked, no credits) |

### History — `/api/history`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | Paginated content history |
| DELETE | `/:id` | JWT | Delete one history item |

### Credits — `/api/credits`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | Credit balance + transaction log |

### Payment — `/api/payment`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create-intent` | JWT | Create Stripe payment intent |
| POST | `/webhook` | No (Stripe sig) | Handle Stripe webhook events |
| GET | `/history` | JWT | List past payments |

### User — `/api/user`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile` | JWT | Get user profile |
| PUT | `/profile` | JWT | Update name or email |

### Admin — `/api/admin`
All routes require JWT + admin (`protect`, `isAdmin`).
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/stats` | Admin | Platform stats (users, credits, generations, contexts) |
| GET | `/activity` | Admin | Recent generation activity |
| GET | `/users` | Admin | List all users |
| PUT | `/users/:id/credits` | Admin | Adjust a user's credits |
| DELETE | `/users/:id` | Admin | Delete a user and their Content + Credit records |
| POST | `/grant-credits` | Admin | Grant credits by email |
| GET/POST/DELETE | `/contexts` | Admin | Manage RAG context documents |

Delete safeguards: an admin cannot delete their own account (403) and no admin account can be deleted (403); a missing user returns 404. The admin panel (User Management) shows a Delete button next to Edit Credits for regular users only — it is disabled on admin rows and on the signed-in admin's own row, asks for confirmation with the user's email, and removes the user from the list on success.

### Context — `/api/admin/contexts` (admin only)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Admin | Insert new RAG reference document |
| GET | `/` | Admin | List all stored context documents |
| DELETE | `/:id` | Admin | Delete a context document |

> The old public `/api/context` routes were removed (security fix H2):
> they let anyone read all RAG contexts and inject their own. No
> frontend code called them — the admin panel already used
> `/api/admin/contexts`.

---

## Controllers

### `authController.js`
Handles user registration and login.
- **`register`** — validates uniqueness, creates User, returns JWT + user object
- **`login`** — compares password with bcrypt hash, returns JWT + user object
- **`getMe`** — returns the currently authenticated user's data from `req.user`
- **`forgotPassword`** — generates a secure random reset token, stores only its SHA-256 hash with a 1-hour expiry, and emails a `/reset-password/:token` link via Resend when `RESEND_API_KEY` and `EMAIL_FROM` are set; otherwise no email is sent and the response stays generic
- **`resetPassword`** — verifies the token hash and expiry, sets the new password (hashed by the User pre-save hook, as on registration), and clears the token

Frontend pages: `/forgot-password` (request a link), `/reset-password/:token` (set a new password), and a “Forgot password?” link on the Login page.

### `generatorController.js`
Handles all AI content generation.
- **`generate`** — standard flow: emits Socket.io event, calls Gemini via `generateText()`, saves Content record, deducts 1 credit, emits done event

- **`generateAIContent`** — RAG flow: searches Context collection by keywords, builds augmented prompt if a match is found, calls `gemini-2.5-flash-lite`, returns `{ response, contextUsed, contextTitle }`

- **Quality check (all generation routes)** — after the AI returns, `checkQuality()` (see `utils/qualityCheck.js`) checks the output for placeholders, banned phrases, filler openers, missing required details and length. A failed check regenerates once with the issues as feedback; if it still fails, the best attempt is returned with a `qualityReport { passed, issues, retried }` instead of failing silently. Only 1 credit is deducted per generation regardless of retries, and only the final output is saved.

### Content quality checks
- **Required fields** — `generateSchema` (in `utils/validators.js`) requires extra details per content type: blog/social need topic and audience; email needs company, role, location, sender name and an apply link or contact; ad needs product, audience and CTA; product needs product and audience. Missing fields are blocked with a 400 naming them — no AI call is made and no credit is deducted. The Generator form shows these fields dynamically with inline errors.
- **Prompt rules** — `buildPrompt()` adds strict rules to every prompt: never use placeholders (`[Your Name]`, `[Company]`, `{{name}}`, `<insert>`), use only the details provided, never invent facts/links/salaries/deadlines, omit a line instead of making it up, and avoid filler openers and generic buzzwords.
- **Post-generation check** — `utils/qualityCheck.js` exports `checkQuality(text, { type, purpose, input, length })` returning `{ passed, issues[] }`, plus `generateWithQualityCheck()` / `retryGeneration()` used by the controller. The banned-phrase list is a separate editable array in that file. Per-purpose checks: Google search ad headline ≤ 30 / description ≤ 90 chars, X post under 280 chars, email subject + greeting + sign-off when the purpose requires them, and a repetition check that flags 3+ consecutive sentences starting the same way.

### Purpose templates & two-pass generation
- **Purpose sub-types** — `server/config/contentTypes.js` defines 26 purposes across the 5 content types (email: cold outreach, follow-up, job posting, complaint, apology, payment reminder, newsletter, announcement, thank-you, meeting request; blog: how-to, listicle, opinion, case study, SEO article; social: LinkedIn, X/Twitter, Instagram caption, Facebook, WhatsApp broadcast; ad: Google search, Facebook/Instagram, product launch; product: e-commerce, app store, feature announcement). Each purpose has required fields, a structure outline, a default tone, a length range and 2 human-written example snippets used as few-shot guidance. The Generator shows a Purpose dropdown after Type; `validators.js` enforces the purpose's required fields (400 on missing fields, no AI call, no credit), falling back to per-type fields when no purpose is sent.
- **Human-style prompting** — `buildPrompt()` injects the purpose structure and examples, plus tone (friendly, formal, persuasive, urgent, empathetic), reading level (simple, standard, professional) and an optional writing sample (max 1500 chars; the model matches its voice, never copies its content). Style rules: vary sentence length, concrete details only, active voice, no stacked adjectives, no generic openers/closers, no closing paragraph that repeats the body.
- **Two-pass generation** — pass 1 drafts, pass 2 (`buildEditorPrompt()` in `utils/prompts.js`, run by `utils/twoPass.js`) edits only: removes robotic phrasing, repeated sentence patterns and filler while preserving every fact. Skipped for outputs under 80 words; disable with `TWO_PASS_ENABLED=false` (default true). Streaming streams pass 1 live, then replaces the text with the edited version in the `done` event — the editor needs the whole draft first, and the frontend already replaces output on `done`, so no UI change was needed. `checkQuality` runs after pass 2. Still exactly 1 credit per generation.
- **Tests** — `server/tests/purposeTemplates.test.js` (Node built-in test runner, `npm test` in `server/`): purpose config shape, purpose-aware validation, prompt injection, per-purpose quality checks, two-pass skip/edit/fallback.

### `paymentController.js`
Handles Stripe payment processing.
- **`createPaymentIntent`** — maps a `packageId` to a credit pack, creates Stripe PaymentIntent, saves pending Payment record
- **`webhook`** — receives Stripe events, verifies signature, adds credits to user on `payment_intent.succeeded`
- **`getPaymentHistory`** — returns all Payment records for the authenticated user

### `userController.js`
Handles user profile management.
- **`getProfile`** — returns full profile including subscription and join date
- **`updateProfile`** — updates name and email with Mongoose validation

---

## Middleware

### `auth.js` — JWT Protect
Reads the JWT from the `token` httpOnly cookie (`req.cookies.token`), verifies it with `jsonwebtoken`, loads the user from MongoDB, and attaches them to `req.user`. Returns 401 if missing or invalid.


### `creditCheck.js` — Credit Guard
Checks that `req.user.credits` is at least the required amount (default: 1). Returns 402 Payment Required if the user is out of credits. Applied before any generation route.

### `errorHandler.js` — Global Error Handler
Catches any error passed via `next(err)` from any route or controller. Returns a consistent `{ message }` JSON response with the appropriate HTTP status code. Prevents unhandled errors from crashing the server.

---

## Utility Modules

### `utils/jwt.js`
Exports a single `generateToken(id)` function that signs a JWT with the user's MongoDB `_id` and the `JWT_SECRET`. Used in both `register` and `login`.

### `utils/validators.js`
Defines Joi validation schemas for registration, login, and content generation requests. Exports a `validate(schema)` middleware factory that checks `req.body` and returns a 400 error with the first validation failure message if invalid. `generateSchema` also enforces per-type required detail fields (`REQUIRED_FIELDS` / `missingRequiredFields()` in the same file) and names any missing fields in the 400 message.

### `utils/prompts.js`
Exports `buildPrompt({ type, prompt, tone, length })`. Constructs a tailored natural-language instruction for each of the 5 content types (blog, social, email, ad, product) with tone and word count guidance. Every prompt also carries strict output-quality rules (no placeholders, use only provided details, never invent facts/links/salaries/deadlines, no filler openers or buzzwords) and a `details` block with the user's per-type fields.

### `utils/qualityCheck.js`
Exports `checkQuality(text, { type, input, length })` returning `{ passed, issues[] }` — placeholder detection, a separate editable `BANNED_PHRASES` array, rhetorical-question opener detection, email apply-link/sender-name presence, and a length check (more than 30% off the requested range). Also exports `generateWithQualityCheck()` and `retryGeneration()`, which regenerate once with the issues as feedback and return the best attempt with a `qualityReport { passed, issues, retried }`.

### `utils/gemini.js`
Exports `getModel`, `withSystem`, `generateText` / `generateSEO` / `tuneText`. Calls `buildPrompt`, sends the result to `gemini-2.5-flash-lite` via the Gemini SDK, and returns the generated text string. Holds the dual-agent system prompt (Expert Copywriter + Brutal AI Reviewer "REALITY CHECK").


---

## Context Providers (Frontend)

### `AuthContext.js`
Global authentication state available to the entire React app.

- **State:** `user` (object or null), `loading` (boolean)
- **On mount:** fetches `/api/auth/me` (the JWT travels in the httpOnly cookie, sent with credentials) to restore session

- **`login(email, password)`** — POST to `/api/auth/login`; the server sets the JWT in an httpOnly cookie; sets user state
- **`register(name, email, password)`** — POST to `/api/auth/register`; the server sets the JWT in an httpOnly cookie; sets user state
- **`logout()`** — POST to `/api/auth/logout` (clears the cookie) and resets user state


### `CreditContext.js`
Global credit balance state available throughout the app.

- **State:** `credits` (number), `creditLogs` (array)
- **`fetchCredits()`** — GET `/api/credits`, updates balance and log from MongoDB
- **`deductCredit(amount)`** — optimistically decrements the displayed balance immediately after generation, before the server round-trip

---

## RAG System

RAG (Retrieval-Augmented Generation) prevents the AI from hallucinating facts by grounding responses in your own verified data stored in MongoDB.

**How it works:**

```
1. Client sends: { userPrompt: "What's your refund policy?", topicKeywords: ["refund"] }
        │
        ▼
2. Server searches MongoDB:
   Context.findOne({ keywords: { $in: ["refund"] } })
        │
        ├── Match found →
        │     Build augmented prompt:
        │     "Context Information: [stored facts]
        │      Strict Instructions: Use the above context only. Do not invent facts.
        │      User Prompt: [original question]"
        │
        └── No match →
              Use raw userPrompt as-is
        │
        ▼
3. Send final prompt → Gemini gemini-2.5-flash-lite

        │
        ▼
4. Return: { response, contextUsed: true/false, contextTitle }
```

**Seeding reference data (admin only):**
```bash
POST /api/admin/contexts
{
  "title": "Refund Policy",
  "keywords": ["refund", "return", "money back"],
  "information": "Customers can return products within 30 days for a full refund..."
}
```

---

## Environment Variables

All stored in `server/.env`.

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret string for signing JWTs (keep long and random) |
| `JWT_EXPIRES_IN` | No | Token expiry duration (default: `7d`) |
| `PORT` | No | Express server port (default: `3001`) |
| `CLIENT_URL` | No | Frontend origin for CORS (default: `http://localhost:5000`) |
| `GEMINI_API_KEY` | For generation | Your Gemini API key (Google AI Studio) |
| `FREE_DAILY_CREDITS` | No | Free credits granted per day (default: `10`) |
| `UNSPLASH_ACCESS_KEY` | For blog images | Unsplash access key for stock photos in generated blogs |

| `STRIPE_SECRET_KEY` | For payments | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook signing secret (`whsec_...`) |
| `RESEND_API_KEY` | For password reset emails | Resend API key, set in the hosting dashboard only (no value in code or docs) |
| `EMAIL_FROM` | For password reset emails | Verified sender address for reset emails; without these two variables, no reset email is sent |

---

## How Data Flows

### User Registration
```
Browser → POST /api/auth/register
→ Joi validates body
→ Check email uniqueness in MongoDB
→ bcrypt hashes password
→ User saved to MongoDB (10 free credits)
→ JWT generated and set in an httpOnly cookie by the server

→ AuthContext sets user state
→ Redirect to /dashboard
```

### Forgot Password
```
Browser (Login page) -> "Forgot password?" -> /forgot-password
-> POST /api/auth/forgot-password { email }
-> Always the same generic message, whether or not the email is registered
-> If the account exists: secure random token generated, only its SHA-256
  hash stored with a ~1-hour expiry, reset link emailed via Resend
  (only when RESEND_API_KEY and EMAIL_FROM are set)
-> User opens /reset-password/:token
-> POST /api/auth/reset-password/:token { password }
-> Token hash and expiry verified, new password hashed as on registration,
  token cleared, user signs in from /login with the new password
```

### Content Generation
```
Browser (Dashboard) → POST /api/generate
→ auth middleware verifies JWT → loads user
→ creditCheck confirms credits ≥ 1
→ Joi validates { type, prompt, tone, length }
→ buildPrompt() creates instruction string
→ Gemini gemini-2.5-flash-lite generates text

→ Content saved to MongoDB
→ User credits decremented in MongoDB
→ Credit transaction logged in MongoDB
→ Socket.io emits generation:done to browser
→ Response returned to client
→ CreditContext.deductCredit() updates display
```

### RAG Generation
```
Client → POST /api/generate/rag { userPrompt, topicKeywords }
→ MongoDB: Context.findOne({ keywords: { $in: topicKeywords } })
→ If found: inject context into prompt with strict instructions
→ If not found: use userPrompt directly
→ Gemini gemini-2.5-flash-lite generates response
→ Return { response, contextUsed, contextTitle }
```

### Credit Purchase
```
Browser → POST /api/payment/create-intent { packageId }
→ Stripe creates PaymentIntent (client_secret returned)
→ Browser collects card via Stripe Elements (card never touches our server)
→ Stripe processes payment
→ Stripe sends webhook → POST /api/payment/webhook
→ Server verifies Stripe signature
→ User credits incremented in MongoDB
→ Payment record updated to "succeeded"
→ Credit transaction logged
```

