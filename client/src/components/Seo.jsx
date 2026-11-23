import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://verzo-ecru.vercel.app';

// Per-page SEO: title, meta description, canonical and Open Graph tags.
// No og:image: the site has no OG/social image asset (only favicon.svg),
// so the tag is intentionally omitted rather than pointing at a wrong image.
export default function Seo({ title, description, path = '/', noindex = false }) {
  const canonical = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
