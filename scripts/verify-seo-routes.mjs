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
// A /vs route whose element is only a <Navigate> is a redirect to another
// page, not a page of its own (e.g. /vs/traditional-research, merged into
// /vs/traditional), so it needs no manifest entry of its own. Its target does.
const vsInRouter = [...app.matchAll(/<Route path="(\/vs\/[a-z-]+)" element=\{([^}]*)\}/g)]
  .filter((m) => !/^<Navigate\b/.test(m[2].trim()))
  .map((m) => m[1]);
const vsRedirects = [...app.matchAll(/<Route path="(\/vs\/[a-z-]+)" element=\{<Navigate to="([^"]+)"/g)];
for (const [, from, to] of vsRedirects) {
  if (!PUBLIC_ROUTES.some((r) => r.path === to)) fail.push(`${from} redirects to ${to}, which is not in the SEO manifest`);
}
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

// Resolve each /vs route to its page file through App.tsx itself (route ->
// component -> lazy import path), so a new comparison page is checked without
// anyone remembering to list it here.
const lazyFile = Object.fromEntries(
  [...app.matchAll(/const (\w+)\s*=\s*lazy\(\(\) => import\('\.\/([^']+)'\)/g)].map((m) => [m[1], `src/${m[2]}.tsx`]),
);
const vsComponent = Object.fromEntries(
  [...app.matchAll(/<Route path="(\/vs\/[a-z-]+)" element=\{<(\w+) \/>\}/g)].map((m) => [m[1], m[2]]),
);

// The template renders `VETT vs {competitorName}`; if that ever changes, the
// competitorName comparison below would be checking the wrong thing.
const tplH1 = renderedH1('src/components/marketing/VsPageTemplate.tsx');
if (tplH1 !== 'VETT vs {competitorName}') {
  fail.push(`VsPageTemplate h1 is now "${tplH1}"; the check below assumes "VETT vs {competitorName}"`);
}

let h1Checked = 0;
for (const path of vsInRouter) {
  const route = PUBLIC_ROUTES.find((r) => r.path === path);
  const file = lazyFile[vsComponent[path]];
  if (!route || !file) { fail.push(`${path}: could not resolve its page file from App.tsx`); continue; }
  const src = readFileSync(join(ROOT, file), 'utf8');
  let actual;
  if (src.includes('<VsPageTemplate')) {
    const name = src.match(/competitorName="([^"]+)"/);
    if (!name) { fail.push(`${file} uses VsPageTemplate without a literal competitorName`); continue; }
    actual = `VETT vs ${name[1]}`;
  } else {
    actual = renderedH1(file);
    if (actual == null) { fail.push(`could not find an <h1> in ${file}`); continue; }
  }
  h1Checked += 1;
  if (actual !== route.h1) {
    fail.push(`${path}: manifest h1 is "${route.h1}" but ${file} renders "${actual}" - a crawler would be shown text no visitor sees`);
  }
}
if (h1Checked !== vsInRouter.length) fail.push('the /vs h1 comparison went partly vacuous');

// The "Other comparisons" links list exactly the published comparison pages.
const vsList = readFileSync(join(ROOT, 'src/components/marketing/vsComparisons.ts'), 'utf8');
const listed = new Set([...vsList.matchAll(/slug: '([a-z-]+)'/g)].map((m) => `/vs/${m[1]}`));
for (const p of vsInRouter) if (!listed.has(p)) fail.push(`${p} is missing from src/components/marketing/vsComparisons.ts, so no other comparison page links to it`);
for (const p of listed) if (!vsInRouter.includes(p)) fail.push(`vsComparisons.ts links to ${p}, which is not a comparison page in App.tsx`);

// ── 7. Case study h1s, without letting the check go vacuous ───────────────
// The /vs checks above compare the LITERAL text inside a page's <h1>. That
// works there because the text is either a literal or one known template
// expression. It does not work for the case study template, whose h1 is
// `{study.finding}` and nothing else: reading that literal back and comparing
// it to a manifest h1 would fail every time, and "fixing" it by putting
// "{study.finding}" in the manifest would produce a check that passes against
// any finding at all. That is a vacuous check wearing a real one's clothes.
//
// So resolve the expression instead, in two steps:
//   a. assert the template's h1 IS exactly `{study.finding}`, so we know the
//      heading comes from that one prop and from nothing else;
//   b. read the `finding` literal out of each study's own data module and
//      compare THAT to the manifest.
// If the template's h1 ever stops being that expression, step (a) fails and
// says so, rather than step (b) quietly checking the wrong string.
const CASE_STUDY_TEMPLATE = 'src/components/marketing/CaseStudyPageTemplate.tsx';
const CASE_STUDY_INDEX = 'src/pages/case-studies/CaseStudiesIndexPage.tsx';

/** Route path -> the data module whose `finding` the page renders as its h1. */
const CASE_STUDY_SOURCES = {
  '/case-studies/placeholder-pricing-example': 'src/data/caseStudies/PLACEHOLDER_exampleStudy.ts',
};

const caseTplH1 = renderedH1(CASE_STUDY_TEMPLATE);
if (caseTplH1 !== '{study.finding}') {
  fail.push(`CaseStudyPageTemplate h1 is now "${caseTplH1}"; the case study check below resolves "{study.finding}" and would go vacuous against anything else`);
}

// The index page's h1 is an ordinary literal, so it is checked the ordinary way.
const indexRoute = PUBLIC_ROUTES.find((r) => r.path === '/case-studies');
const indexH1 = renderedH1(CASE_STUDY_INDEX);
if (!indexRoute) fail.push('/case-studies is missing from the manifest');
else if (indexH1 !== indexRoute.h1) {
  fail.push(`/case-studies: manifest h1 is "${indexRoute.h1}" but ${CASE_STUDY_INDEX} renders "${indexH1}"`);
}

// `finding` must stay a single-line, single-quoted literal with no escapes.
// The CaseStudy type says so too; this is the check that enforces it.
const FINDING = /^\s*finding:\s*'([^'\\\n]+)'\s*,\s*$/m;
let caseChecked = 0;
for (const [path, file] of Object.entries(CASE_STUDY_SOURCES)) {
  const route = PUBLIC_ROUTES.find((r) => r.path === path);
  if (!route) { fail.push(`${path} is missing from the manifest`); continue; }
  const m = readFileSync(join(ROOT, file), 'utf8').match(FINDING);
  if (!m) {
    fail.push(`could not read a single-line 'finding' literal out of ${file} - keep it on one line in single quotes so this check can resolve the h1`);
    continue;
  }
  caseChecked += 1;
  if (m[1] !== route.h1) {
    fail.push(`${path}: manifest h1 is "${route.h1}" but ${file} sets finding to "${m[1]}" - a crawler would be shown text no visitor sees`);
  }
}
// Every study route in the manifest must have a source here, or a new study
// could be added to the manifest and never have its h1 checked at all.
const studyRoutes = PUBLIC_ROUTES.filter((r) => r.path.startsWith('/case-studies/'));
if (caseChecked !== studyRoutes.length) {
  fail.push(`checked ${caseChecked} case study h1s but the manifest has ${studyRoutes.length} study routes - add the new one to CASE_STUDY_SOURCES`);
}

if (fail.length) {
  console.error('verify-seo-routes: FAILED');
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log(`verify-seo-routes: OK (${PUBLIC_ROUTES.length} public routes, ${vsInRouter.length} of them comparison pages)`);
