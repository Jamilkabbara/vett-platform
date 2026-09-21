/**
 * verify-quality-notice - a study produced before the quality fixes of 20
 * September says so on its own report, in the server's exact words, above the
 * figures rather than in a footnote.
 *
 * 29 of 40 delivered studies carry at least one defect. The flags are decided
 * per study by the server from its stored data; this checks the page shows
 * what it is given, and shows nothing when there is nothing to show.
 */
import { build } from 'esbuild';
import { mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const failures = [];
const fail = (m) => failures.push(m);
// Inside the repo, so the bundle resolves react from node_modules the same
// way the app does. Removed in the finally block below.
const dir = join(ROOT, 'node_modules', '.cache', 'verify-quality-notice');
mkdirSync(dir, { recursive: true });

const NOTICE = 'Produced before quality fixes of 20 September; figures not reliable.';

try {
  writeFileSync(join(dir, 'entry.tsx'), `
    import { renderToStaticMarkup } from 'react-dom/server';
    import { QualityNotice } from ${JSON.stringify(join(ROOT, 'src/components/results-v2/QualityNotice.tsx'))};
    export function render(quality: any) {
      return renderToStaticMarkup(<QualityNotice quality={quality} />);
    }
  `);
  const out = join(dir, 'entry.cjs');
  await build({
    entryPoints: [join(dir, 'entry.tsx')],
    // CommonJS: React's server renderer requires node builtins at runtime,
    // which an ESM bundle cannot do.
    bundle: true, format: 'cjs', platform: 'node', outfile: out, logLevel: 'error',
    // React's server renderer reaches for node builtins; keep them external
    // rather than bundling shims for them.

    jsx: 'automatic', 
    define: { 'import.meta.env': JSON.stringify({ VITE_API_URL: '', DEV: false, PROD: true, MODE: 'production' }) },
  });
  const { render } = createRequire(import.meta.url)(out);

  const html = render({
    notice: NOTICE,
    flags: ['duplicate_people', 'undeclinable_q'],
    reasons: ['the panel repeated the same respondents', 'a multi-select question offered no way to answer "none of these"'],
    flagged_at: '2026-09-21T00:00:00Z',
    excluded_from_public: true,
  });
  if (!html.includes(NOTICE)) fail('the report does not show the server\'s notice wording');
  if (!html.includes('the panel repeated the same respondents')) fail('the report does not say what is wrong with the study');
  if (!/role="note"/.test(html)) fail('the notice is not announced to assistive technology');
  if (!/public material, case study or benchmark/.test(html)) fail('the notice does not say the study is kept out of public material');
  if (/[—–]/.test(html.replace(/<[^>]*>/g, ''))) fail('the notice uses an em or en dash; customer copy uses hyphens');

  // The page must render it only when the server sends one.
  const page = readFileSync(join(ROOT, 'src/pages/ResultsV2Page.tsx'), 'utf8');
  if (!/\{h\.quality \? <QualityNotice quality=\{h\.quality\} \/> : null\}/.test(page)) {
    fail('the report page does not render the notice conditionally on the server flag');
  }
  const headerClose = page.indexOf('</header>');
  const noticeAt = page.indexOf('<QualityNotice quality={h.quality}');
  const centerpieceAt = page.indexOf('{/* CENTERPIECE */}');
  if (!(noticeAt > headerClose && noticeAt < centerpieceAt)) {
    fail('the notice must sit above the figures, between the top bar and the centerpiece');
  }
} catch (e) {
  fail(`could not render the notice: ${e.message}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures.length) {
  console.error('\nverify-quality-notice FAILED\n');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('verify-quality-notice ok: a flagged study shows the notice above its figures, in the server\'s words');
