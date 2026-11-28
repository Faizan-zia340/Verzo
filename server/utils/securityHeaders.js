// Helmet Content-Security-Policy for the Express server (which also serves
// the built SPA in production).
//
// The inline theme script in client/index.html is allowlisted by its
// SHA-256 hash, so script-src needs no 'unsafe-inline'. If you edit that
// script, recompute the hash from the built client/dist/index.html:
//   node -e "const s=require('fs').readFileSync('client/dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];console.log(require('crypto').createHash('sha256').update(s,'utf8').digest('base64'))"
// and update THEME_SCRIPT_SHA256 below — the securityHeaders test fails
// until the hash matches, so a stale hash is caught, not shipped.
//
// style-src keeps 'unsafe-inline': the only inline styles are the static
// first-paint splash block in index.html. Google Fonts stylesheets load
// from fonts.googleapis.com and font files from fonts.gstatic.com.
//
// NOTE: the live SPA is served by Vercel, not this server, so the
// production page needs the same policy in Vercel response headers
// (vercel.json) to be covered there. This covers the Render-served
// fallback plus every API response.
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const THEME_SCRIPT_SHA256 = 'IjMQ/H26zr5AuwFyloOa3nJYbV5vhz+geitLjERSyug=';

export const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", `'sha256-${THEME_SCRIPT_SHA256}'`],
  scriptSrcAttr: ["'none'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
  // Same-origin /api in production; the Render origin is listed so the
  // policy stays correct if VITE_API_URL ever points the client at it.
  connectSrc: ["'self'", 'ws:', 'wss:', 'https://verzo-backend.onrender.com'],
  frameAncestors: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  upgradeInsecureRequests: [],
};

// Hash of the inline <script> in client/index.html, for the test that
// keeps THEME_SCRIPT_SHA256 in sync with the file.
export const hashThemeScript = (indexHtml) => {
  const match = indexHtml.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No inline theme script found in client/index.html');
  return createHash('sha256').update(match[1], 'utf8').digest('base64');
};

export const themeScriptPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'index.html');

export const readThemeScriptHash = () => hashThemeScript(readFileSync(themeScriptPath, 'utf8'));
