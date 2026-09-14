/**
 * Post-build prerender for the public marketing routes.
 *
 * Vite emits ONE dist/index.html and vercel.json rewrites every extensionless
 * path to a shell, so without this every public URL would serve identical head
 * tags and an empty body. This script runs after BOTH builds - the browser build
 * (vite build) and the prerender's server bundle (vite build --ssr
 * src/entry-prerender.tsx, output in dist-prerender/) - and writes
 * dist/<route>/index.html for each route in scripts/seo-routes.mjs with:
 *
 *   - that route's own title, description, canonical, Open Graph and Twitter
 *     tags, rewritten in the head exactly as before; and
 *   - the WHOLE page, rendered from the real React components, inside #root.
 *
 * WHY THE WHOLE PAGE. The previous version put only the page's h1 and one
 * sentence inside #root. Google renders JavaScript and saw the full page; most
 * AI crawlers and many other bots do not, and saw one heading and one sentence
 * per URL. The comparison tables, FAQ answers and methodology descriptions -
 * everything quotable - were absent from the raw HTML.
 *
 * WHY THIS IS NOT CLOAKING. The HTML is rendered by the same components, from
 * the same props, that the browser renders. A crawler and a visitor get the
 * same page; the crawler just does not have to run JavaScript to read it.
 *
 * HYDRATE OR REPLACE. #root carries data-prerender:
 *   "hydrate"  the browser attaches to the prerendered page and keeps it on
 *              screen (src/main.tsx calls hydrateRoot). Used wherever the
 *              browser's first render is the same tree, which is every route
 *              whose path renders its own page.
 *   "replace"  the browser renders fresh (createRoot). Used for "/", whose
 *              router entry is a redirect to /landing: the redirect renders
 *              nothing, so the tree cannot match. The landing page is in the
 *              main bundle, so the swap is immediate, with no loading state.
 *
 * THE APP SHELL. vercel.json sends every extensionless path WITHOUT its own file
 * to dist/app-shell.html - the untouched shell with an empty #root - not to
 * dist/index.html. dist/index.html now holds the full landing page, and serving
 * that for /dashboard would flash the marketing page at a signed-in customer
 * before their dashboard loaded.
 *
 * Tags are rewritten by regex over the shell. Read the comment at the top of
 * index.html before editing its head: those regexes cannot tell a tag from a
 * prose mention of one.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PUBLIC_ROUTES, canonicalFor, ORIGIN } from './seo-routes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SHELL = join(DIST, 'index.html');
const SERVER_BUNDLE = join(ROOT, 'dist-prerender', 'entry-prerender.js');
const RENDER_TIMEOUT_MS = 20_000;

if (!existsSync(SHELL)) {
  console.error('prerender: dist/index.html not found. Run `vite build` first.');
  process.exit(1);
}
if (!existsSync(SERVER_BUNDLE)) {
  console.error('prerender: dist-prerender/entry-prerender.js not found. Run `vite build --ssr src/entry-prerender.tsx --outDir dist-prerender` first.');
  process.exit(1);
}

const { renderRoute } = await import(pathToFileURL(SERVER_BUNDLE).href);

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const shell = readFileSync(SHELL, 'utf8');

/**
 * Replace a tag, or fail loudly if it is missing. The replacement is passed as
 * a FUNCTION so String.replace does not interpret "$" sequences in it: the
 * rendered pages contain prices like "$9 to $1,099", and a string replacement
 * would read "$1" as a capture-group reference.
 */
function swap(html, label, pattern, replacement) {
  if (!pattern.test(html)) {
    throw new Error(`prerender: ${label} not found in dist/index.html - the shell changed shape, fix this script rather than shipping a page with the wrong tag`);
  }
  return html.replace(pattern, () => replacement);
}

function withTimeout(promise, label) {
  let t;
  return Promise.race([
    promise,
    new Promise((_, reject) => { t = setTimeout(() => reject(new Error(`prerender: rendering ${label} did not finish in ${RENDER_TIMEOUT_MS / 1000}s`)), RENDER_TIMEOUT_MS); }),
  ]).finally(() => clearTimeout(t));
}

async function pageFor(route) {
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

  // renderAs: a path whose router entry redirects is rendered as its target
  // and replaced, not hydrated, on load. See the header.
  const renderPath = route.renderAs || route.path;
  const mode = route.renderAs ? 'replace' : 'hydrate';
  const body = await withTimeout(renderRoute(renderPath), route.path);
  html = swap(html, '<div id="root">', /<div id="root">\s*<\/div>/,
    `<div id="root" data-prerender="${mode}" data-prerender-path="${esc(route.path)}">${body}</div>`);

  return html;
}

// The app shell for every path without its own file. Written from the shell
// BEFORE dist/index.html is overwritten with the homepage.
writeFileSync(join(DIST, 'app-shell.html'), shell, 'utf8');

let written = 0;
for (const route of PUBLIC_ROUTES) {
  const out = route.path === '/'
    ? join(DIST, 'index.html')
    : join(DIST, route.path.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, await pageFor(route), 'utf8');
  written += 1;
}

console.log(`prerender: rendered ${written} public routes into dist/ from the React components, plus dist/app-shell.html (canonical base ${ORIGIN})`);
process.exit(0);
