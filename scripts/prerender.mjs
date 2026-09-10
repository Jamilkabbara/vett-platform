/**
 * Post-build prerender for the public marketing routes.
 *
 * Vite emits ONE dist/index.html and vercel.json rewrites every extensionless
 * path to it, so all 24 public URLs served identical head tags. This script
 * runs after `vite build` and writes dist/<route>/index.html for each route in
 * the manifest, with that route's own title, description, canonical, Open
 * Graph and Twitter tags, plus its h1 and intro inside #root.
 *
 * Vercel checks the filesystem BEFORE applying rewrites, so dist/about/index.html
 * is served for /about and the catch-all rewrite still handles every app route.
 *
 * ON THE BODY CONTENT, because prerendering can shade into cloaking. What is
 * injected into #root is the page's OWN h1 and its own opening sentence, not
 * keyword copy written for crawlers. React 18's createRoot().render() replaces
 * the container's children on mount, so a visitor with JavaScript sees the
 * identical text for a frame and then the real page. If the two ever diverge,
 * that is a bug in the manifest, not a feature - scripts/verify-seo-routes.mjs
 * is what keeps the h1 honest.
 *
 * WHAT IT DOES NOT DO. This is not server-side rendering. The body is a title
 * and one paragraph, not the whole page, so a crawler that does not execute JS
 * gets correct metadata and a correct h1 rather than the full article. That is
 * the difference between being indexed under the right title and not being
 * indexed at all; rendering whole pages would need SSR and a real React
 * server build.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ROUTES, canonicalFor, ORIGIN } from './seo-routes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SHELL = join(DIST, 'index.html');

if (!existsSync(SHELL)) {
  console.error('prerender: dist/index.html not found. Run `vite build` first.');
  process.exit(1);
}

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const shell = readFileSync(SHELL, 'utf8');

/** Replace the content of a meta/title/link tag, or fail loudly if it is missing. */
function swap(html, label, pattern, replacement) {
  if (!pattern.test(html)) {
    throw new Error(`prerender: ${label} not found in dist/index.html - the shell changed shape, fix this script rather than shipping a page with the wrong tag`);
  }
  return html.replace(pattern, replacement);
}

function pageFor(route) {
  const canonical = canonicalFor(route);
  const title = esc(route.title);
  const desc = esc(route.description);
  let html = shell;

  html = swap(html, '<title>', /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = swap(html, 'meta description',
    /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${desc}" />`);
  html = swap(html, 'canonical',
    /<link rel="canonical"[^>]*\/>/, `<link rel="canonical" href="${canonical}" />`);
  html = swap(html, 'og:title',
    /<meta property="og:title"[^>]*\/>/, `<meta property="og:title" content="${title}" />`);
  html = swap(html, 'og:description',
    /<meta property="og:description"[^>]*\/>/, `<meta property="og:description" content="${desc}" />`);
  html = swap(html, 'og:url',
    /<meta property="og:url"[^>]*\/>/, `<meta property="og:url" content="${canonical}" />`);
  html = swap(html, 'twitter:title',
    /<meta name="twitter:title"[^>]*\/>/, `<meta name="twitter:title" content="${title}" />`);
  html = swap(html, 'twitter:description',
    /<meta name="twitter:description"[^>]*\/>/, `<meta name="twitter:description" content="${desc}" />`);

  // The h1 and intro go INSIDE #root. React clears the container on mount.
  const body = `<div id="root"><main><h1>${esc(route.h1)}</h1><p>${esc(route.intro)}</p></main></div>`;
  html = swap(html, '<div id="root">', /<div id="root">\s*<\/div>/, body);

  return html;
}

let written = 0;
for (const route of PUBLIC_ROUTES) {
  const out = route.path === '/'
    ? join(DIST, 'index.html')
    : join(DIST, route.path.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, pageFor(route), 'utf8');
  written += 1;
}

console.log(`prerender: wrote ${written} public routes into dist/ (canonical base ${ORIGIN})`);
