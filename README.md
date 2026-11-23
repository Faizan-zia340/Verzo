# Verzo

Verzo is an AI content SaaS for generating, refining, organizing, and exporting marketing content.

## Forgot password

The Login page links to `/forgot-password`. Requesting a reset always returns the same generic message, whether or not the email is registered. A reset link (`/reset-password/:token`) is emailed via Resend when `RESEND_API_KEY` and `EMAIL_FROM` are set in the hosting dashboard; without them, no reset email is sent. Tokens are stored only as SHA-256 hashes and expire after about 1 hour, and a successful reset clears the token. See `DOCUMENTATION.md` for the endpoints.

Before pushing, make sure .env, .env.local, and any file containing real secrets/API keys are listed in .gitignore and are NOT tracked by git — if any secret file was previously committed, remove it from git tracking (but keep the local file intact) using git rm --cached <file>. Create/update .env.example with the same variable names but placeholder values (no real keys), so anyone cloning the repo knows what's needed without exposing my actual secrets. Then push to https://github.com/Faizan-zia340/Verzo.git, main branch. If GitHub's push protection still blocks the push because a secret is detected somewhere in the git history (not just the latest commit), tell me exactly which file and commit it's in so we can decide whether to clean the history or start fresh.

## Production deployment

Frontend on Vercel, backend (Express + MongoDB) on Render at `https://verzo-backend.onrender.com`. The frontend calls the backend directly via `VITE_API_URL`; `vercel.json` also proxies `/api/*` to Render before the SPA catch-all rewrite, so API calls work on Vercel even if `VITE_API_URL` is not baked into a build (without that proxy rule, `/api/*` was rewritten to `index.html` and login POSTs failed with 405).

## Admin panel

Admins (`/admin` → User Management) can delete a regular user with the Delete button next to Edit Credits; the user's content and credit records are removed too. Safeguards: an admin cannot delete their own account, and no admin account can be deleted. See `DOCUMENTATION.md` (Admin — `/api/admin`).
