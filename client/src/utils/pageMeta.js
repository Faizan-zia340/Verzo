// Temporary per-page title/meta helper until PR #7 (Seo.jsx) merges.
// After #7 lands, Blog pages should use <Seo /> instead of this and this
// file can be deleted. It only touches the live document head — the static
// index.html title/description stay untouched for crawlers on first load.
export function setPageMeta(title, description) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', description);
}
