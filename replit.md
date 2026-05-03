# AI Content Generator

A full-stack AI-powered content generation app with a React frontend and Express backend. Users register, receive credits, and spend them to generate blog posts, social media copy, emails, ads, and product descriptions via OpenAI.

## Architecture

- **Frontend** (`client/`): React 18 + Vite (port 5000), React Router v6, Tailwind CSS, Recharts, Socket.io client
- **Backend** (`server/`): Express + Socket.io (port 3001), proxied via Vite's `/api` proxy
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (stored in localStorage)
- **Payments**: Stripe (payment intents + webhooks)
- **AI**: OpenAI GPT-3.5-turbo (v3 SDK)

## Project Structure

```
├── client/                        # React + Vite frontend
│   ├── index.html                 # Vite HTML entry point
│   ├── public/                    # Static assets
│   ├── vite.config.js             # Vite config (port 5000, /api proxy to :3001)
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── index.js               # React entry point
│       ├── App.jsx                # Router + context providers + route protection
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Generator.jsx      # Content generation form + output display
│       │   ├── CreditsDisplay.jsx
│       │   ├── ContentHistory.jsx
│       │   ├── Pricing.jsx        # Pricing cards component
│       │   ├── Dashboard.jsx      # Stats + Recharts usage chart
│       │   └── LoadingSpinner.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx      # Dashboard page (wraps components)
│       │   ├── Pricing.jsx        # Pricing page
│       │   └── PaymentSuccess.jsx
│       ├── context/
│       │   ├── AuthContext.js     # Auth state + login/register/logout
│       │   └── CreditContext.js   # Credits state + fetch/deduct
│       ├── services/
│       │   ├── api.js             # Axios instance with 401 interceptor
│       │   └── auth.js            # Auth service helpers
│       └── styles/
│           └── index.css          # Tailwind directives
│
└── server/                        # Express backend
    ├── server.js                  # Entry point — Express, Socket.io, routes
    ├── config/
    │   ├── database.js            # Mongoose connection
    │   ├── openai.js              # OpenAI client
    │   └── stripe.js              # Stripe client
    ├── models/
    │   ├── User.js                # Mongoose model (credits, subscription)
    │   ├── Content.js             # Generated content records
    │   ├── Credit.js              # Credit transaction log
    │   ├── Payment.js             # Stripe payment records
    │   └── Subscription.js        # Stripe subscription records
    ├── routes/
    │   ├── auth.js, generate.js, user.js, credits.js, payment.js, history.js
    ├── controllers/
    │   ├── authController.js
    │   ├── generatorController.js
    │   ├── paymentController.js
    │   └── userController.js
    ├── middleware/
    │   ├── auth.js                # JWT protect middleware
    │   ├── creditCheck.js         # Insufficient credit guard
    │   └── errorHandler.js
    └── utils/
        ├── openai.js              # generateContent() helper
        ├── prompts.js             # buildPrompt() per content type
        ├── validators.js          # Joi schemas + validate middleware
        └── jwt.js                 # generateToken()
```

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in:

| Variable                | Description                          |
|-------------------------|--------------------------------------|
| `MONGODB_URI`           | MongoDB connection string            |
| `JWT_SECRET`            | Secret for signing JWTs              |
| `JWT_EXPIRES_IN`        | JWT expiry (default `7d`)            |
| `OPENAI_API_KEY`        | OpenAI API key                       |
| `STRIPE_SECRET_KEY`     | Stripe secret key                    |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret        |
| `CLIENT_URL`            | Frontend origin (default `http://localhost:5000`) |
| `PORT`                  | Express port (default `3001`)        |

## Workflows

- **Start application**: `cd client && npm run dev` — Vite frontend on port 5000

## Running the Backend

```bash
cd server
cp .env.example .env   # fill in your values
npm run dev            # nodemon server.js on port 3001
```

## API Routes

| Method | Path                    | Auth | Description                  |
|--------|-------------------------|------|------------------------------|
| POST   | /api/auth/register      |      | Register + get JWT           |
| POST   | /api/auth/login         |      | Login + get JWT              |
| GET    | /api/auth/me            | JWT  | Get current user             |
| POST   | /api/generate           | JWT  | Generate content (1 credit)  |
| GET    | /api/history            | JWT  | Paginated content history    |
| DELETE | /api/history/:id        | JWT  | Delete a history item        |
| GET    | /api/credits            | JWT  | Credit balance + log         |
| POST   | /api/payment/create-intent | JWT | Create Stripe payment intent |
| POST   | /api/payment/webhook    |      | Stripe webhook handler       |
| GET    | /api/payment/history    | JWT  | Payment history              |
| GET    | /api/user/profile       | JWT  | Get profile                  |
| PUT    | /api/user/profile       | JWT  | Update profile               |
