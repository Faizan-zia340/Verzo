// Lazy page imports fail after a deploy: Vercel serves the new index.html
// but the old hashed chunk is gone, so the request returns HTML and the
// import throws "Failed to fetch dynamically imported module". Retry once,
// then reload the page once (sessionStorage-guarded) so the fresh bundle
// loads; a genuinely missing chunk still throws to the ErrorBoundary.
const KEY = 'penlix-chunk-reload';

export default function lazyWithRetry(importFn) {
  const load = () =>
    importFn().then((m) => {
      sessionStorage.removeItem(KEY);
      return m;
    });
  return () =>
    load().catch(() =>
      load().catch((err) => {
        if (sessionStorage.getItem(KEY)) throw err;
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
        return new Promise(() => {});
      }),
    );
}
