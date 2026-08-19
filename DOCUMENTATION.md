# Verzo — Full Project Documentation

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

An AI-powered content generation SaaS platform. Users register, receive credits, and spend them to generate blog posts, social media captions, emails, ads, and product descriptions using OpenAI. Payments are handled via Stripe and all data is stored in MongoDB. A RAG (Retrieval-Augmented Generation) system allows the AI to pull accurate local information from the database before generating a response.

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
    ├── OpenAI API (GPT-4o-mini / GPT-3.5-turbo)
    ├── Stripe API
    └── Socket.io (real-time generation events)
```

---

## Folder Structure

```
ai-content-generator/
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
│       │   └── LoadingSpinner.jsx   # Reusable loading indicator
│       ├── pages/
│       │   ├── Home.jsx             # Landing page
│       │   ├── Login.jsx            # Login form
│       │   ├── Register.jsx         # Registration form
│       │   ├── Dashboard.jsx        # Main dashboard page
│       │   ├── Pricing.jsx          # Pricing page
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
    │   ├── openai.js                # OpenAI API client setup
    │   └── stripe.js                # Stripe API client setup
    ├── models/
    │   ├── User.js                  # User accounts and credit balance
    │   ├── Content.js               # Generated content records
    │   ├── Credit.js                # Credit transaction log
    │   ├── Payment.js               # Stripe payment records
    │   ├── Subscription.js          # Stripe subscription records
    │   └── Context.js               # RAG reference data store
    ├── routes/
    │   ├── auth.js                  # /api/auth/*
    │   ├── generate.js              # /api/generate/*
    │   ├── user.js                  # /api/user/*
    │   ├── credits.js               # /api/credits/*
    │   ├── payment.js               # /api/payment/*
    │   ├── history.js               # /api/history/*
    │   └── context.js               # /api/context/*
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
        ├── openai.js                # generateContent() helper function
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
Cross-Origin Resource Sharing middleware. Allows the React frontend (running on port 5000) to make HTTP requests to the Express backend (port 3001) without browser security blocks.
```js
app.use(cors({ origin: 'http://localhost:5000' }));
```

### `dotenv` ^16.0.3
Loads environment variables from the `.env` file into `process.env`. Keeps secrets like API keys out of the source code.
```js
import 'dotenv/config';
process.env.OPENAI_API_KEY; // now accessible
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

### `openai` ^3.2.1
The official OpenAI SDK (v3). Used to send prompts to GPT-3.5-turbo and GPT-4o-mini and receive generated text responses.
```js
import { Configuration, OpenAIApi } from 'openai';
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
await openai.createChatCompletion({ model: 'gpt-4o-mini', messages: [...] });
```

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
HTTP client for making API calls to the Express backend. A pre-configured instance with the base URL and a 401 interceptor (auto-logout on token expiry) lives in `src/services/api.js`.
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

### Generate — `/api/generate`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT + 1 credit | Standard content generation |
| POST | `/rag` | No | RAG-augmented generation |

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

### Context — `/api/context`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | No | Insert new RAG reference document |
| GET | `/` | No | List all stored context documents |

---

## Controllers

### `authController.js`
Handles user registration and login.
- **`register`** — validates uniqueness, creates User, returns JWT + user object
- **`login`** — compares password with bcrypt hash, returns JWT + user object
- **`getMe`** — returns the currently authenticated user's data from `req.user`

### `generatorController.js`
Handles all AI content generation.
- **`generate`** — standard flow: emits Socket.io event, calls OpenAI via `generateContent()`, saves Content record, deducts 1 credit, emits done event
- **`generateAIContent`** — RAG flow: searches Context collection by keywords, builds augmented prompt if a match is found, calls GPT-4o-mini, returns `{ response, contextUsed, contextTitle }`

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
Reads the `Authorization: Bearer <token>` header, verifies it with `jsonwebtoken`, loads the user from MongoDB, and attaches them to `req.user`. Returns 401 if missing or invalid.

### `creditCheck.js` — Credit Guard
Checks that `req.user.credits` is at least the required amount (default: 1). Returns 402 Payment Required if the user is out of credits. Applied before any generation route.

### `errorHandler.js` — Global Error Handler
Catches any error passed via `next(err)` from any route or controller. Returns a consistent `{ message }` JSON response with the appropriate HTTP status code. Prevents unhandled errors from crashing the server.

---

## Utility Modules

### `utils/jwt.js`
Exports a single `generateToken(id)` function that signs a JWT with the user's MongoDB `_id` and the `JWT_SECRET`. Used in both `register` and `login`.

### `utils/validators.js`
Defines Joi validation schemas for registration, login, and content generation requests. Exports a `validate(schema)` middleware factory that checks `req.body` and returns a 400 error with the first validation failure message if invalid.

### `utils/prompts.js`
Exports `buildPrompt({ type, prompt, tone, length })`. Constructs a tailored natural-language instruction for each of the 5 content types (blog, social, email, ad, product) with tone and word count guidance.

### `utils/openai.js`
Exports `generateContent({ type, prompt, tone, length })`. Calls `buildPrompt`, sends the result to `gpt-3.5-turbo` via the OpenAI SDK, and returns the generated text string.

---

## Context Providers (Frontend)

### `AuthContext.js`
Global authentication state available to the entire React app.

- **State:** `user` (object or null), `loading` (boolean)
- **On mount:** reads token from `localStorage`, fetches `/api/auth/me` to restore session
- **`login(email, password)`** — POST to `/api/auth/login`, saves token, sets user state
- **`register(name, email, password)`** — POST to `/api/auth/register`, saves token, sets user state
- **`logout()`** — clears token from localStorage and resets user state

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
3. Send final prompt → OpenAI gpt-4o-mini
        │
        ▼
4. Return: { response, contextUsed: true/false, contextTitle }
```

**Seeding reference data:**
```bash
POST /api/context
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
| `OPENAI_API_KEY` | For generation | Your OpenAI API key (`sk-...`) |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook signing secret (`whsec_...`) |

---

## How Data Flows

### User Registration
```
Browser → POST /api/auth/register
→ Joi validates body
→ Check email uniqueness in MongoDB
→ bcrypt hashes password
→ User saved to MongoDB (10 free credits)
→ JWT generated and returned
→ Frontend stores token in localStorage
→ AuthContext sets user state
→ Redirect to /dashboard
```

### Content Generation
```
Browser (Dashboard) → POST /api/generate
→ auth middleware verifies JWT → loads user
→ creditCheck confirms credits ≥ 1
→ Joi validates { type, prompt, tone, length }
→ buildPrompt() creates instruction string
→ OpenAI GPT-3.5-turbo generates text
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
→ OpenAI GPT-4o-mini generates response
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
