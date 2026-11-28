import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://verzo-ecru.vercel.app';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

// Per-page SEO: title, meta description, canonical, Open Graph, Twitter
// cards and optional JSON-LD. og:image is the shared /og-image.png asset.
export default function Seo({ title, description, path = '/', noindex = false, type = 'website', image = OG_IMAGE, jsonLd = null }) {
  const canonical = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
