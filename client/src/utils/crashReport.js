// Crash reporting helpers for the ErrorBoundary. Only the sanitised route
// and a truncated error + component stack ever leave the browser — never
// the raw URL, query, hash, localStorage, user object or tokens.
export const MAX_CRASH_MESSAGE = 2000;

// Bare pathname only. /verify-email/<token> and /reset-password/<token>
// carry single-use tokens, so they collapse to the route name.
export function sanitizePath(rawPath) {
  const path = String(rawPath || '/').split(/[?#]/)[0] || '/';
  if (path.startsWith('/verify-email/')) return '/verify-email/[redacted]';
  if (path.startsWith('/reset-password/')) return '/reset-password/[redacted]';
  return path;
}

export function buildCrashMessage({ path, errorName, errorMessage, componentStack }) {
  const header = `Crash on ${sanitizePath(path)}: ${errorName || 'Error'}: ${errorMessage || 'Unknown error'}`;
  const stack = (componentStack || '').trim();
  return (stack ? `${header}\n${stack}` : header).slice(0, MAX_CRASH_MESSAGE);
}

let sent = false;

// Fire-and-forget: one report per page load, never blocks the fallback UI.
export function reportCrash(error, info) {
  if (sent) return;
  sent = true;
  try {
    const body = JSON.stringify({
      page: 'ErrorBoundary',
      category: 'Bug',
      message: buildCrashMessage({
        path: window.location.pathname,
        errorName: error?.name,
        errorMessage: error?.message,
        componentStack: info?.componentStack,
      }),
    });
    const url = '/api/feedback';
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      if (ok) return;
    }
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body,
    }).catch(() => {});
  } catch {
    // Reporting must never throw into the boundary itself.
  }
}
