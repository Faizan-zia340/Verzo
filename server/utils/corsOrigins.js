// Exact-origin allowlist for CORS (requests carry credentials).
//
// SECURITY (C2): a wildcard such as *.vercel.app lets anyone deploy a free
// Vercel app and make credentialed requests to the API from it. Only the
// production frontend, local dev origins, and Vercel preview deployments
// of THIS project are allowed. The stale .replit.dev entry was removed
// (Replit was dropped).

const STATIC_ORIGINS = ['http://localhost:5173', 'http://localhost:5000'];

// Vercel preview deployments of this project look like:
//   https://verzo-git-<branch>-faizan-zias-projects.vercel.app
// Scoped to this project's team slug — NOT any *.vercel.app.
const PROJECT_PREVIEW_RE = /^https:\/\/verzo-git-[a-z0-9-]+-faizan-zias-projects\.vercel\.app$/;

export const isAllowedOrigin = (origin) => {
  // No Origin header = non-browser / server-to-server request.
  if (!origin) return true;
  const allowed = [process.env.CLIENT_URL, ...STATIC_ORIGINS].filter(Boolean);
  if (allowed.includes(origin)) return true;
  return PROJECT_PREVIEW_RE.test(origin);
};

export const corsOriginCheck = (origin, callback) => {
  if (isAllowedOrigin(origin)) return callback(null, true);
  // Never pass an Error: the cors middleware turns it into a 500. The
  // corsGuard middleware in front of cors already answers 403 for a
  // disallowed Origin; this just withholds the CORS headers as a fallback.
  return callback(null, false);
};
