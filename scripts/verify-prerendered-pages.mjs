/**
 * verify-prerendered-pages - read every page the prerender wrote and fail the
 * build if one of them is not what a crawler should receive.
 *
 * Runs at the end of `npm run build`, after scripts/prerender.mjs, against the
 * real files in dist/. A green build therefore means every public URL carries
 * its full rendered page, not just that the render did not throw.
 *
 * Checks, per route in scripts/seo-routes.mjs:
 *   - the file exists where Vercel will serve it from;
 *   - the Google Search Console verification tag survived (Search Console
 *     reads raw HTML; losing it silently disconnects the property);
 *   - its canonical is its own (or its declared cross-page canonical);
 *   - #root is marked hydrate or replace as the manifest implies;
 *   - the rendered h1 is the manifest's h1, so the head and the body describe
 *     the same page;
 *   - the body is a real page, not a stub: enough visible text, and no page
 *     loader left in place of content;
 *   - no "undefined", "NaN" or "[object Object]" leaked into visible text.
 * And once: dist/app-shell.html exists with an EMPTY #root, because every app
 * route is served from it and must not flash marketing content.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ROUTES, canonicalFor } from './seo-routes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const GSC = '<meta name="google-site-verification" content="g75-pKiznDd8END7QWiiIndmX7FkSNn2VAAkumkYi-8" />';

// Visible characters a page must carry. The old stub (one h1 + one sentence)
// was under 250 on every route, so 500 cleanly separates a rendered page from
// a stub. Two routes are genuinely short and say why.
const MIN_TEXT = 500;
const SHORT_ROUTES = {
  '/blog': 60,     // the post list loads client-side from Supabase; the shell and heading are what exist at build time
  '/contact': 150, // a heading, one line and a form
};
// Routes whose worth to a crawler is content that is easy to leave out of the
// HTML by accident. /help rendered each FAQ answer only when its accordion was
// open, so the prerendered page had twelve questions and no answers (1,296
// characters). With every answer in the page it is ~7,300.
const LONG_ROUTES = {
  '/help': 5000,
};

const decode = (s) => s
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const visibleText = (html) => decode(html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')).replace(/\s+/g, ' ').trim();

const failures = [];
const fail = (route, msg) => failures.push(`${route}: ${msg}`);

for (const route of PUBLIC_ROUTES) {
  const file = route.path === '/' ? join(DIST, 'index.html') : join(DIST, route.path.slice(1), 'index.html');
  if (!existsSync(file)) { fail(route.path, `not written (${file})`); continue; }
  const html = readFileSync(file, 'utf8');

  if (!html.includes(GSC)) fail(route.path, 'Google Search Console verification tag missing');

  const canonical = canonicalFor(route);
  if (!html.includes(`<link rel="canonical" href="${canonical}" />`)) fail(route.path, `canonical is not ${canonical}`);

  const rootOpen = html.match(/<div id="root"([^>]*)>/);
  if (!rootOpen) { fail(route.path, '#root not found'); continue; }
  const expectedMode = route.renderAs ? 'replace' : 'hydrate';
  if (!rootOpen[1].includes(`data-prerender="${expectedMode}"`)) fail(route.path, `#root is not marked data-prerender="${expectedMode}"`);

  const rootStart = rootOpen.index + rootOpen[0].length;
  const rootBody = html.slice(rootStart, html.lastIndexOf('</body>'));
  const text = visibleText(rootBody);

  const h1 = rootBody.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!h1) {
    fail(route.path, 'no h1 rendered');
  } else {
    const got = visibleText(h1[1]).replace(/\s+/g, ' ');
    const want = route.h1.replace(/\s+/g, ' ');
    // The landing h1 breaks a line between its two sentences, so compare with
    // whitespace removed rather than demanding identical spacing.
    if (got.replace(/\s/g, '') !== want.replace(/\s/g, '')) fail(route.path, `rendered h1 "${got}" does not match the manifest h1 "${want}"`);
  }

  const min = SHORT_ROUTES[route.path] ?? LONG_ROUTES[route.path] ?? MIN_TEXT;
  if (text.length < min) fail(route.path, `only ${text.length} visible characters rendered (minimum ${min}) - this looks like a stub, not the page`);

  if (!SHORT_ROUTES[route.path] && /animate-spin/.test(rootBody) && text.length < MIN_TEXT * 2) {
    fail(route.path, 'a loading spinner was rendered where the page should be');
  }

  // Every comparison page carries FAQPage structured data IN the prerendered
  // HTML (not added later by browser JavaScript), and every question in it is
  // a question the page visibly shows.
  if (route.path.startsWith('/vs/')) {
    const blocks = [...rootBody.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } })
      .filter((j) => j && j['@type'] === 'FAQPage');
    if (blocks.length !== 1) {
      fail(route.path, `expected 1 FAQPage JSON-LD block in the prerendered page, found ${blocks.length}`);
    } else {
      const questions = (blocks[0].mainEntity || []).map((q) => q.name);
      if (!questions.length) fail(route.path, 'FAQPage JSON-LD has no questions');
      const norm = (t) => t.replace(/\s+/g, ' ').trim();
      for (const q of questions) {
        if (!norm(text).includes(norm(q))) fail(route.path, `FAQPage JSON-LD question not visible on the page: "${q.slice(0, 60)}"`);
      }
    }
  }

  for (const leak of ['[object Object]', 'undefined', 'NaN']) {
    if (new RegExp(`(^|[^A-Za-z])${leak.replace(/[[\]]/g, '\\$&')}([^A-Za-z]|$)`).test(text)) fail(route.path, `"${leak}" appears in the visible text`);
  }
}

const appShell = join(DIST, 'app-shell.html');
if (!existsSync(appShell)) {
  failures.push('dist/app-shell.html missing: vercel.json serves every app route from it');
} else {
  const s = readFileSync(appShell, 'utf8');
  if (!/<div id="root">\s*<\/div>/.test(s)) failures.push('dist/app-shell.html #root is not empty: app routes would flash prerendered content');
  if (!s.includes(GSC)) failures.push('dist/app-shell.html lost the Search Console tag');
}

const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
const catchAll = (vercel.rewrites || []).find((r) => r.source.includes('(?!.*'));
if (!catchAll || catchAll.destination !== '/app-shell.html') {
  failures.push('vercel.json catch-all rewrite does not point at /app-shell.html: app routes would be served the prerendered homepage');
}

// Redirects: every one is a real 301 (Vercel's "permanent: true" sends 308),
// and no redirected path is also a manifest route or a prerendered file - a
// page that still exists is a duplicate the redirect was meant to remove.
for (const r of vercel.redirects || []) {
  if (r.statusCode !== 301) failures.push(`vercel.json redirect ${r.source} is not a 301`);
  const path = r.source.replace(/\/$/, '');
  if (PUBLIC_ROUTES.some((route) => route.path === path)) failures.push(`${path} is redirected but still in scripts/seo-routes.mjs`);
  if (existsSync(join(DIST, path.slice(1), 'index.html'))) failures.push(`${path} is redirected but dist still contains a prerendered page for it`);
  if (!PUBLIC_ROUTES.some((route) => route.path === r.destination)) failures.push(`redirect ${r.source} points at ${r.destination}, which is not a public route`);
}

if (failures.length) {
  console.error(`\nverify-prerendered-pages FAILED (${failures.length})\n`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`verify-prerendered-pages ok: ${PUBLIC_ROUTES.length} routes carry their full rendered page, the Search Console tag and their own h1; app-shell.html is empty`);
