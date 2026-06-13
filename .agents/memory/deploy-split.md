---
name: Vercel + Render split deployment
description: How the frontend (Vercel) and backend (Render) are wired together for production
---

**Frontend → Vercel**
- `vercel.json` at root: buildCommand `cd client && npm install && npm run build`, outputDirectory `client/dist`, SPA rewrite rule
- Set env var `VITE_API_URL=https://<your-render-url>` in Vercel dashboard (Project → Settings → Environment Variables)
- `client/src/services/api.js` uses `import.meta.env.VITE_API_URL` as baseURL prefix
- `client/src/services/apiUrl.js` helper used by all raw `fetch()` calls in Generator.jsx, PDFAnalyzer.jsx

**Backend → Render**
- `render.yaml` at root: buildCommand `cd server && npm install`, startCommand `NODE_ENV=production node server/server.js`
- Set these env vars in Render dashboard: MONGODB_URI, JWT_SECRET, GEMINI_API_KEY, NODE_ENV=production, CLIENT_URL=<vercel-url>
- Health endpoint: GET /api/health — used by Render health checks and cron-job.org keep-alive

**Keep-alive (Render free tier sleeps after 15min)**
- Use cron-job.org (free) to GET `https://<render-url>/api/health` every 5 minutes
- This prevents Render from spinning down

**Why split instead of monorepo on Render:**
- Vercel gives faster CDN, better React SPA routing, and zero config
- Render free tier handles Node/Express + WebSocket (SSE) well; Vercel serverless has 10s timeout which breaks SSE streaming

**Key files:** `vercel.json`, `render.yaml`, `client/src/services/api.js`, `client/src/services/apiUrl.js`
