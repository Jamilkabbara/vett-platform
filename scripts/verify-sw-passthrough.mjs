/**
 * Guard: the service worker must never be able to serve a document.
 *
 * VETT is installable to a home screen. It is NOT an offline app, and it must
 * not become one by accident, because two separate things break if it does.
 *
 *   1. scripts/prerender.mjs runs AFTER `vite build` and writes 24 per-route
 *      HTML files into dist/, each with its own title, canonical and h1.
 *      Anything that builds a precache manifest during `vite build` sees only
 *      the generic shell. Ship that plus the usual navigateFallback and every
 *      repeat visitor to /about or /vs/typeform gets served a page claiming to
 *      be the homepage - the SEO work silently undone, for humans only, while
 *      crawlers still see the right thing so nobody notices.
 *
 *   2. The numbers on /results are the product, and /version.json is how the
 *      team tells a landed deploy from a skipped one. Neither may ever be
 *      answered from a cache.
 *
 * So: public/sw.js may register a fetch handler, because Chromium's install
 * PROMOTION algorithm still looks for one, but it may not contain the means to
 * respond to anything. No respondWith, no Cache API, no precache manifest.
 *
 * This also checks the manifest is real: valid JSON, the fields Chrome's
 * install criteria actually require, and every icon it names present on disk
 * at the pixel size it claims.
 *
 * Runs in `npm test`.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ROUTES, canonicalFor } from './seo-routes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fail = [];

/* ── 1. The worker source cannot serve anything ──────────────────────────── */

// Each entry is [human name, pattern]. Matched against source with comments
// stripped, so the explanatory prose in sw.js does not trip its own guard.
const FORBIDDEN = [
  ['event.respondWith', /\.respondWith\s*\(/],
  ['the Cache / caches API', /\bcaches\b|\bnew\s+Cache\b|\bcaches\.open\b/],
  ['a Workbox precache manifest', /__WB_MANIFEST|precacheAndRoute|workbox/i],
  ['a navigation fallback', /navigateFallback|navigationPreload|createHandlerBoundToURL/i],
  ['a bundled response body', /new\s+Response\s*\(/],
];

const SW_SRC = join(ROOT, 'public', 'sw.js');
if (!existsSync(SW_SRC)) {
  fail.push('public/sw.js is missing - the app would stop being promotable as installable');
} else {
  const raw = readFileSync(SW_SRC, 'utf8');
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
  for (const [name, pattern] of FORBIDDEN) {
    if (pattern.test(code)) {
      fail.push(`public/sw.js contains ${name}. This worker exists only to make the app installable; it must never be able to answer a request, least of all a navigation. If you want offline support, solve the prerender-ordering problem first and change this guard deliberately.`);
    }
  }
  if (!/addEventListener\s*\(\s*['"]fetch['"]/.test(code)) {
    fail.push("public/sw.js has no 'fetch' listener - Chromium's install promotion algorithm still looks for one, so beforeinstallprompt will stop firing");
  }
}

/* ── 2. No build-time precaching plugin has crept into the toolchain ─────── */

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
for (const name of Object.keys(deps)) {
  if (/vite-plugin-pwa|^workbox-|^@vite-pwa\//.test(name)) {
    fail.push(`${name} is now a dependency. It generates its precache manifest during \`vite build\`, which runs BEFORE scripts/prerender.mjs writes the 24 real pages - so it would precache the shell and none of them.`);
  }
}
const viteConfig = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
if (/VitePWA|workbox/i.test(viteConfig)) {
  fail.push('vite.config.ts references a PWA/Workbox plugin - see the note above about build ordering');
}

/* ── 3. The web app manifest is valid and complete ───────────────────────── */

/** Width and height straight out of a PNG's IHDR chunk. */
function pngSize(file) {
  const b = readFileSync(file);
  if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') return null;
  if (b.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

const MANIFEST = 'manifest.webmanifest';

/** Check one copy of the manifest, resolving its icon paths inside `dir`. */
function checkManifest(dir, label) {
  const file = join(dir, MANIFEST);
  if (!existsSync(file)) { fail.push(`${label}/${MANIFEST} is missing`); return; }

  let m;
  try { m = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { fail.push(`${label}/${MANIFEST} is not valid JSON: ${e.message}`); return; }

  // Chrome's install criteria: a name, a start_url, a standalone-ish display,
  // and icons at 192 and 512.
  for (const k of ['name', 'short_name', 'start_url', 'scope', 'display', 'theme_color', 'background_color']) {
    if (!m[k]) fail.push(`${label}/${MANIFEST} has no ${k}`);
  }
  if (m.short_name !== 'VETT') fail.push(`${label}/${MANIFEST} short_name is "${m.short_name}", expected "VETT"`);
  if (!['standalone', 'fullscreen', 'minimal-ui'].includes(m.display)) {
    fail.push(`${label}/${MANIFEST} display is "${m.display}"; a browser display mode is not installable`);
  }
  if (m.theme_color !== '#0B0C15') fail.push(`${label}/${MANIFEST} theme_color must match the theme-color meta in index.html (#0B0C15)`);

  const icons = Array.isArray(m.icons) ? m.icons : [];
  if (!icons.length) { fail.push(`${label}/${MANIFEST} declares no icons`); return; }

  const sizes = new Set();
  let maskable = false;
  for (const icon of icons) {
    if (!icon.src || !icon.src.startsWith('/')) { fail.push(`${label}/${MANIFEST} icon src "${icon.src}" must be a root-relative path`); continue; }
    const onDisk = join(dir, icon.src.replace(/^\//, ''));
    if (!existsSync(onDisk)) { fail.push(`${label}/${MANIFEST} names ${icon.src}, which does not exist in ${label}/`); continue; }
    const actual = pngSize(onDisk);
    if (!actual) { fail.push(`${label}${icon.src} is not a readable PNG`); continue; }
    const declared = String(icon.sizes || '').trim();
    if (declared !== `${actual.width}x${actual.height}`) {
      fail.push(`${label}${icon.src} declares sizes "${declared}" but the file is ${actual.width}x${actual.height}`);
    }
    sizes.add(declared);
    if (String(icon.purpose || '').split(/\s+/).includes('maskable')) maskable = true;
  }
  for (const need of ['192x192', '512x512']) {
    if (!sizes.has(need)) fail.push(`${label}/${MANIFEST} has no ${need} icon; Chrome will not offer to install without one`);
  }
  if (!maskable) fail.push(`${label}/${MANIFEST} has no maskable icon; Android would letterbox the icon inside its adaptive mask`);
}

checkManifest(join(ROOT, 'public'), 'public');

/* ── 4. The shell links the manifest, and says so to iOS ─────────────────── */

const shell = readFileSync(join(ROOT, 'index.html'), 'utf8');
if (!/<link rel="manifest" href="\/manifest\.webmanifest"/.test(shell)) {
  fail.push('index.html does not link /manifest.webmanifest, so nothing is installable');
}

// Each tag prerender.mjs rewrites must appear in index.html EXACTLY once.
//
// Its swaps are plain regexes over the file and have no idea what a comment
// is. A second occurrence anywhere, including inside a comment explaining the
// tag, makes the regex match the wrong place: the title swap in particular
// matches from the first occurrence through to the real closing tag and
// deletes every tag in between. That is not hypothetical. It happened while
// this feature was being written, it removed the manifest link from all 24
// built pages, and the build reported success because it did find a match.
//
// This runs with no build, so it is the check that fires in CI. The dist/
// pass below is the same rule proved against real output.
const SWAP_TARGETS = [
  ['the title element',      /<title>/g],
  ['the description meta',   /<meta\s+name="description"/g],
  ['the canonical link',     /<link rel="canonical"/g],
  ['the og:title meta',      /<meta property="og:title"/g],
  ['the og:url meta',        /<meta property="og:url"/g],
  ['the twitter:title meta', /<meta name="twitter:title"/g],
  ['the root div',           /<div id="root">/g],
];
for (const [label, pattern] of SWAP_TARGETS) {
  const n = (shell.match(pattern) || []).length;
  if (n !== 1) {
    fail.push(`index.html contains ${label} ${n} times, expected exactly 1. scripts/prerender.mjs rewrites it by regex and cannot tell a tag from a mention of one, so a duplicate - a comment spelling the tag out counts - silently corrupts all 24 prerendered pages. Describe the tag in words instead.`);
  }
}
for (const tag of ['apple-mobile-web-app-capable', 'apple-mobile-web-app-status-bar-style', 'apple-mobile-web-app-title']) {
  if (!shell.includes(tag)) fail.push(`index.html is missing the ${tag} meta; iOS reads these, not the manifest`);
}

/* ── 5. If dist/ exists, the built output has to agree ───────────────────── */

const DIST = join(ROOT, 'dist');
if (existsSync(DIST) && existsSync(join(DIST, 'index.html'))) {
  checkManifest(DIST, 'dist');
  if (!existsSync(join(DIST, 'sw.js'))) fail.push('dist/sw.js is missing from the build output');
  if (!existsSync(join(DIST, 'version.json'))) fail.push('dist/version.json is missing; that is the deploy-freshness signal');
  // A precache manifest emitted by `vite build` is exactly the failure mode
  // this whole file exists to prevent, so look for one in the output too.
  for (const f of readdirSync(DIST)) {
    if (/^(workbox-|sw\.js\.map$|precache-manifest)/.test(f)) {
      fail.push(`dist/ contains ${f} - something is generating a precache bundle`);
    }
  }

  // Every prerendered page must have kept BOTH its own SEO tags and the
  // install tags. These two are checked together on purpose, because they
  // are coupled in a way that is not obvious: prerender.mjs locates the
  // title, description, canonical, og, twitter and root-div tags by plain
  // regex over index.html, and those regexes cannot tell a tag from a
  // mention of a tag. Writing "<" + "title>" in a COMMENT in index.html is
  // enough for the title swap to match the comment and delete every tag
  // between there and the real closing tag. That happened while this
  // feature was being built: all 24 pages silently lost the manifest link
  // and the iOS metas, the build printed "wrote 24 public routes", and
  // nothing failed. This loop is what would have caught it.
  let checked = 0;
  for (const r of PUBLIC_ROUTES) {
    const page = r.path === '/'
      ? join(DIST, 'index.html')
      : join(DIST, r.path.replace(/^\//, ''), 'index.html');
    if (!existsSync(page)) { fail.push(`dist${r.path} was not prerendered`); continue; }
    checked += 1;
    const html = readFileSync(page, 'utf8');

    const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    const wantTitle = r.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (title !== wantTitle) fail.push(`dist${r.path} title is "${title}", manifest says "${wantTitle}"`);
    if (canonical !== canonicalFor(r)) fail.push(`dist${r.path} canonical is "${canonical}", manifest says "${canonicalFor(r)}"`);
    if (!/<h1>[^<]/.test(html)) fail.push(`dist${r.path} has no prerendered h1`);

    if (!html.includes('<link rel="manifest" href="/manifest.webmanifest"')) {
      fail.push(`dist${r.path} lost the manifest link between index.html and the build`);
    }
    if (!html.includes('apple-mobile-web-app-title')) {
      fail.push(`dist${r.path} lost the iOS install metas between index.html and the build`);
    }
  }
  if (checked !== PUBLIC_ROUTES.length) fail.push('the built-page check went partly vacuous');
}

if (fail.length) {
  console.error('verify-sw-passthrough: FAILED');
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log('verify-sw-passthrough: OK (service worker caches nothing, manifest and icons check out)');
