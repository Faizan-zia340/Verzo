import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000, // never hang forever on a stalled request
});

// Public pages where a logged-out visitor must NOT be bounced to /login.
// /reset-password/:token is public: the reset link must open even though
// the visitor has no session yet.
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/payment-success',
];

const isPublicPath = (path) =>
  PUBLIC_PATHS.some((p) => (p === '/' ? path === '/' : path === p || path.startsWith(`${p}/`)));

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url || '';
    // AuthProvider calls GET /auth/me on every app load to restore the
    // session. A logged-out visitor gets 401 from /me by design, and
    // AuthProvider already catches it and sets user to null — it must
    // never force a redirect, or public pages (reset-password, etc.)
    // would bounce to /login before they can render.
    const isMeRequest = requestUrl.includes('/auth/me');
    if (
      err.response?.status === 401 &&
      !isMeRequest &&
      !isPublicPath(window.location.pathname)
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
