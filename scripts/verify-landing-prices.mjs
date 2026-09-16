/**
 * verify-landing-prices - every price on the landing page comes from the
 * pricing module, and the prerendered page says what checkout charges.
 *
 * 1. The landing page's own pricing module (landingPrices.ts, which calls the
 *    app's calculatePricing) agrees with the ladder as checkout charges it
 *    (scripts/lib/ladder.mjs: rate x count, floored at the tier below, whole
 *    dollars) at every count the slider can reach.
 * 2. No dollar amount is typed into a landing source file. A figure inside a
 *    demo chart that is not a VETT price carries `demo-figure` on its line.
 * 3. After a build, dist/landing/index.html carries the ladder prices, the
 *    headline price at the slider's starting count, and the Creative
 *    Attention and Brand Lift prices. Skipped with a note when dist/ is absent.
 *
 * The redesign prototype priced n x rate and published $121 for 101
 * respondents; checkout charges $149.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { respondentLadder, creativeAttentionPrices } from './lib/ladder.mjs';
import { loadLandingPrices } from './lib/landingPrices.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (m) => failures.push(m);

const volume = respondentLadder('VOLUME_TIERS');
const brandLift = respondentLadder('BRAND_LIFT_TIERS');
const [caImage, caVideo] = creativeAttentionPrices();
const lp = await loadLandingPrices();

// 1. the module against the ladder, at every slider position
for (let n = lp.SLIDER_MIN; n <= lp.SLIDER_MAX; n += lp.SLIDER_STEP) {
  const want = volume.chargeAt(n);
  if (lp.quote(n) !== want) fail(`quote(${n}) is $${lp.quote(n)}, checkout charges $${want}`);
}
for (const r of lp.LADDER) {
  if (r.price !== volume.chargeAt(r.anchor)) fail(`${r.name} card shows $${r.price}, checkout charges $${volume.chargeAt(r.anchor)} at ${r.anchor}`);
}
if (lp.LADDER.length !== volume.sellable.length) fail(`the landing ladder has ${lp.LADDER.length} rungs, the sellable ladder ${volume.sellable.length}`);
if (lp.CA_IMAGE_USD !== caImage || lp.CA_VIDEO_USD !== caVideo) fail(`Creative Attention shows $${lp.CA_IMAGE_USD}/$${lp.CA_VIDEO_USD}, the ladder says $${caImage}/$${caVideo}`);
if (lp.BRAND_LIFT_FROM_USD !== brandLift.low) fail(`Brand Lift "from" is $${lp.BRAND_LIFT_FROM_USD}, the cheapest buyable study is $${brandLift.low}`);

// 2. no typed-in dollar amounts
const SOURCES = ['src/pages/LandingV2Page.tsx'];
for (const f of readdirSync(join(ROOT, 'src/components/landing-v2'))) SOURCES.push(`src/components/landing-v2/${f}`);
for (const rel of SOURCES) {
  const lines = readFileSync(join(ROOT, rel), 'utf8').split('\n');
  let inBlock = false;
  lines.forEach((raw, i) => {
    let line = raw;
    if (inBlock) { if (!line.includes('*/')) return; line = line.slice(line.indexOf('*/') + 2); inBlock = false; }
    line = line.replace(/\/\*.*?\*\//g, '');
    if (line.includes('/*')) { inBlock = true; line = line.slice(0, line.indexOf('/*')); }
    line = line.replace(/\/\/.*$/, '');
    if (/demo-figure/.test(raw)) return;
    if (/\$\s?\d/.test(line)) fail(`${rel}:${i + 1} types a dollar amount; derive it from landingPrices.ts: ${raw.trim()}`);
  });
}

// 3. the prerendered page
const page = join(ROOT, 'dist/landing/index.html');
if (!existsSync(page)) {
  console.log('verify-landing-prices: dist/landing/index.html not built yet, prerender check skipped');
} else {
  const html = readFileSync(page, 'utf8');
  const priceFor = [...html.matchAll(/data-price-for="(\d+)"[^>]*>\$([\d,]+)</g)].map((m) => [Number(m[1]), Number(m[2].replace(/,/g, ''))]);
  const anchors = new Set(volume.sellable.map((t) => t.anchor));
  const seen = new Set();
  for (const [n, shown] of priceFor) {
    if (shown !== volume.chargeAt(n)) fail(`prerendered page shows $${shown} for ${n} respondents, checkout charges $${volume.chargeAt(n)}`);
    seen.add(n);
  }
  for (const a of anchors) if (!seen.has(a)) fail(`prerendered page has no price for the ${a}-respondent rung`);
  if (!priceFor.some(([n]) => n === lp.SLIDER_DEFAULT)) fail('prerendered page has no headline price');
  const row = (id) => Number((new RegExp(`data-price-row="${id}"[^>]*>\\$([\\d,]+)<`).exec(html) || [])[1]);
  if (row('ca-image') !== caImage) fail(`prerendered Creative Attention image price is ${row('ca-image')}, ladder $${caImage}`);
  if (row('ca-video') !== caVideo) fail(`prerendered Creative Attention video price is ${row('ca-video')}, ladder $${caVideo}`);
  if (row('brand-lift-from') !== brandLift.low) fail(`prerendered Brand Lift price is ${row('brand-lift-from')}, ladder $${brandLift.low}`);
}

if (failures.length) {
  console.error('\nverify-landing-prices FAILED\n');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`verify-landing-prices ok: ${Math.floor((lp.SLIDER_MAX - lp.SLIDER_MIN) / lp.SLIDER_STEP) + 1} slider positions and ${lp.LADDER.length} rungs match checkout; no typed-in prices`);
void statSync;
