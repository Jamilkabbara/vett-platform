/**
 * Guard: the SEO manifest must not drift from the router or from the pages.
 *
 * Two ways this breaks silently.
 *
 *   1. Someone adds a public marketing route to App.tsx and never adds it to
 *      the manifest. It then ships with the homepage's title and the homepage's
 *      canonical - which is the exact bug this whole mechanism exists to fix,
 *      reintroduced one route at a time.
 *   2. Someone edits a page's h1 and not the manifest. The prerendered h1 then
 *      says something the rendered page does not, which is the line between
 *      prerendering and cloaking.
 *
 * Runs in `npm test` alongside the other verify-* scripts.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ROUTES } from './seo-routes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = readFileSync(join(ROOT, 'src', 'App.tsx'), 'utf8');
const fail = [];

// ── 1. Every /vs route in the router is in the manifest ────────────────────
// /vs is the set that actually grew and left the sitemap behind: six of eleven
// comparison pages were missing from it. Any route under /vs is public
// marketing by definition, so the rule can be mechanical.
const vsInRouter = [...app.matchAll(/<Route path="(\/vs\/[a-z-]+)"/g)].map((m) => m[1]);
if (vsInRouter.length === 0) fail.push('found no /vs routes in App.tsx - this check has gone vacuous');
const known = new Set(PUBLIC_ROUTES.map((r) => r.path));
for (const p of vsInRouter) {
  if (!known.has(p)) fail.push(`router has ${p} but the SEO manifest does not - it would ship with the homepage title and canonical`);
}

// ── 2. Every manifest route exists in the router ────────────────────────────
for (const r of PUBLIC_ROUTES) {
  if (r.path === '/') continue;                       // rendered as a <Navigate>
  if (!app.includes(`<Route path="${r.path}"`)) {
    fail.push(`manifest has ${r.path} but App.tsx has no such route - the sitemap would submit a 404`);
  }
}

// ── 3. No duplicate paths, and every field is populated ─────────────────────
const seen = new Set();
for (const r of PUBLIC_ROUTES) {
  if (seen.has(r.path)) fail.push(`duplicate manifest entry for ${r.path}`);
  seen.add(r.path);
  for (const k of ['title', 'description', 'h1', 'intro', 'changefreq', 'priority']) {
    if (!r[k] || !String(r[k]).trim()) fail.push(`${r.path} has an empty ${k}`);
  }
  if (r.description.length > 300) fail.push(`${r.path} description is ${r.description.length} chars, too long to be a useful snippet`);
}

// ── 4. Titles are distinct, which is the whole point ────────────────────────
// Two routes may share a title only when one canonicalises to the other.
const byTitle = new Map();
for (const r of PUBLIC_ROUTES) {
  const list = byTitle.get(r.title) || [];
  list.push(r);
  byTitle.set(r.title, list);
}
for (const [title, list] of byTitle) {
  if (list.length < 2) continue;
  const paths = list.map((r) => r.path);
  const canonicals = new Set(list.map((r) => r.canonical || r.path));
  if (canonicals.size > 1) {
    fail.push(`${paths.join(' and ')} share the title "${title}" without sharing a canonical`);
  }
}

// ── 5. House copy rule: no em or en dashes in customer-facing copy ──────────
for (const r of PUBLIC_ROUTES) {
  for (const k of ['title', 'description', 'h1', 'intro']) {
    if (/[–—]/.test(r[k])) fail.push(`${r.path} ${k} contains an em or en dash; use a hyphen or "to"`);
  }
}

// ── 6. The prerendered h1 must be the h1 the page actually renders ─────────
// This is the check that separates prerendering from cloaking. The comparison
// pages are the ones with a real risk of drift: they come from two different
// components that word the heading differently, and five of them were recently
// edited. Read each page's own <h1> out of its source and compare.
const VS_SOURCES = {
  '/vs/surveymonkey':         'src/pages/vs/VsSurveyMonkeyPage.tsx',
  '/vs/typeform':             'src/pages/vs/VsTypeformPage.tsx',
  '/vs/usertesting':          'src/pages/vs/VsUserTestingPage.tsx',
  '/vs/pollfish':             'src/pages/vs/VsPollfishPage.tsx',
  '/vs/traditional':          'src/pages/vs/VsTraditionalPage.tsx',
};
const TEMPLATE_H1 = /<h1[^>]*>([\s\S]*?)<\/h1>/;

/** The literal text inside the first <h1>, with JSX whitespace collapsed. */
function renderedH1(file) {
  const src = readFileSync(join(ROOT, file), 'utf8');
  const m = src.match(TEMPLATE_H1);
  if (!m) return null;
  return m[1]
    .replace(/\{'\s*'\}/g, ' ')            // {' '} spacers
    .replace(/&apos;|&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let h1Checked = 0;
for (const [path, file] of Object.entries(VS_SOURCES)) {
  const route = PUBLIC_ROUTES.find((r) => r.path === path);
  if (!route) { fail.push(`${path} is missing from the manifest`); continue; }
  const actual = renderedH1(file);
  if (actual == null) { fail.push(`could not find an <h1> in ${file}`); continue; }
  h1Checked += 1;
  if (actual !== route.h1) {
    fail.push(`${path}: manifest h1 is "${route.h1}" but ${file} renders "${actual}" - a crawler would be shown text no visitor sees`);
  }
}
if (h1Checked !== Object.keys(VS_SOURCES).length) fail.push('the h1 comparison went partly vacuous');

// The six template-driven pages all render `VETT vs {competitorName}`.
const tplH1 = renderedH1('src/components/marketing/VsPageTemplate.tsx');
if (tplH1 !== 'VETT vs {competitorName}') {
  fail.push(`VsPageTemplate h1 is now "${tplH1}"; the manifest assumes "VETT vs {competitorName}" for the six pages that use it`);
}

if (fail.length) {
  console.error('verify-seo-routes: FAILED');
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log(`verify-seo-routes: OK (${PUBLIC_ROUTES.length} public routes, ${vsInRouter.length} of them comparison pages)`);
