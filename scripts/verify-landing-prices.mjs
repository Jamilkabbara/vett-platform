/**
 * verify-landing-prices - every price on the landing page comes from the
 * pricing module, the slider offers only counts that can be bought, and the
 * prerendered page says what checkout charges.
 *
 * 1. The slider offers exactly the counts the ladder publishes a price for,
 *    and the landing page's own pricing module (landingPrices.ts, which calls
 *    the app's calculatePricing) agrees with the ladder as checkout charges it
 *    (scripts/lib/ladder.mjs: rate x count, floored at the tier below, whole
 *    dollars) at every one of them.
 * 2. No dollar amount is typed into a landing source file. A figure inside a
 *    demo chart that is not a VETT price carries `demo-figure` on its line.
 * 3. After a build, dist/landing/index.html carries the ladder prices, the
 *    headline price at the slider's starting count, and the Creative
 *    Attention and Brand Lift prices. Skipped with a note when dist/ is absent.
 *
 * WHY THE SLIDER SET IS CHECKED HERE, 2026-11
 * -------------------------------------------
 * Only seven respondent counts can be bought - the ladder's own anchors, see
 * SELLABLE_RESPONDENT_COUNTS in src/utils/pricingEngine.ts. The setup panel
 * stopped selling anything else. This slider stepped by 5 from 5 to 1,250, so
 * 243 of its 250 positions were counts setup will no longer sell. A visitor
 * who priced a 120-respondent study here at $149 was moved to 100 or 250 at
 * setup without being told.
 *
 * No price published here was ever wrong: quote() IS the engine, and $149 is
 * what 120 respondents cost. What was wrong is that the page offered a choice
 * the rest of the funnel does not honour.
 *
 * The offered set is MEASURED from PricingSection.tsx - the slider's own
 * attributes, resolved through the module the page prices itself with - not
 * read out of a list. A check that trusted the list would pass on a page whose
 * slider had quietly gone back to stepping by 5.
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

// 1. the slider offers only published counts, and each prices as charged
const published = volume.sellable.map((t) => t.anchor).sort((a, b) => a - b);
const sectionSrc = readFileSync(join(ROOT, 'src/components/landing-v2/PricingSection.tsx'), 'utf8');

/**
 * The respondent counts the public slider can land on, read off the component.
 *
 * The slider has to be an INDEX over a published-count list: `min`, `max` and
 * `step` named SLIDER_INDEX_*, and a mapping from the index to a count. The
 * anchors are not evenly spaced, so a count-domain slider can only accept an
 * unsellable count and then correct it - and an arrow key that moves 5 and
 * snaps straight back leaves the control dead for keyboard users.
 *
 * Returns null, having recorded a failure, when the slider is not that shape.
 */
function offeredCounts() {
  const tag = [...sectionSrc.matchAll(/<input\b[\s\S]*?\/>/g)]
    .map((m) => m[0])
    .find((t) => /type="range"/.test(t));
  if (!tag) {
    fail('PricingSection.tsx has no range input, so this check cannot tell what the slider offers');
    return null;
  }
  const attr = (name) => (new RegExp(`\\b${name}=\\{([A-Za-z0-9_.]+)\\}`).exec(tag) || [])[1];
  const ids = { min: attr('min'), max: attr('max'), step: attr('step') };
  for (const [k, v] of Object.entries(ids)) {
    if (!v) { fail(`PricingSection.tsx: the slider's ${k} is not a plain identifier, so this check cannot resolve it`); return null; }
  }

  // Count-domain slider: the shape this check exists to reject.
  if (!Object.values(ids).every((id) => /^SLIDER_INDEX_/.test(id))) {
    const [lo, hi, step] = [lp[ids.min], lp[ids.max], lp[ids.step]];
    if (![lo, hi, step].every((v) => Number.isFinite(v)) || step <= 0) {
      fail(`PricingSection.tsx: the slider runs ${ids.min}..${ids.max} by ${ids.step}, which this check cannot resolve to counts`);
      return null;
    }
    const reach = [];
    for (let n = lo; n <= hi; n += step) reach.push(n);
    const unsellable = reach.filter((n) => !published.includes(n));
    fail(
      `the slider is a count domain (${ids.min}..${ids.max} by ${ids.step}: ${reach.length} positions), `
      + `and ${unsellable.length} of those counts cannot be bought.\n`
      + `    published anchors: ${published.join(', ')}\n`
      + `    unsellable, e.g.: ${unsellable.slice(0, 12).join(', ')}${unsellable.length > 12 ? ', ...' : ''}\n`
      + '    A visitor who prices one of those is moved to another count at setup without being told.\n'
      + '    Make the slider an index over SLIDER_COUNTS (SLIDER_INDEX_MIN/MAX/STEP + countAt),\n'
      + '    so it cannot represent an unsellable count rather than accepting one and correcting it.'
    );
    return null;
  }

  if (!Array.isArray(lp.SLIDER_COUNTS) || !lp.SLIDER_COUNTS.length) {
    fail('landingPrices.ts does not export a SLIDER_COUNTS list for the indexed slider to range over');
    return null;
  }
  if (typeof lp.countAt !== 'function') {
    fail('landingPrices.ts does not export countAt(), so the slider index maps to no respondent count');
    return null;
  }
  if (!/countAt\(/.test(sectionSrc)) {
    fail('PricingSection.tsx never calls countAt(), so its slider index is not read as a respondent count');
    return null;
  }

  const [lo, hi, step] = [lp[ids.min], lp[ids.max], lp[ids.step]];
  if (!Number.isInteger(lo) || !Number.isInteger(hi) || !Number.isInteger(step) || step <= 0) {
    fail(`the slider index domain ${lo}..${hi} by ${step} is not a whole-step integer range`);
    return null;
  }
  const indices = [];
  for (let i = lo; i <= hi; i += step) indices.push(i);
  if (indices.length !== lp.SLIDER_COUNTS.length) {
    fail(`the slider has ${indices.length} positions but SLIDER_COUNTS lists ${lp.SLIDER_COUNTS.length} counts, so some count is unreachable or some position repeats`);
  }
  return indices.map((i) => lp.countAt(i));
}

/**
 * How a set of offered counts differs from the published ladder. The one
 * comparison the slider is judged by, so the positive control below can feed
 * it a known-bad set and confirm it still objects.
 */
function offendingCounts(set) {
  return {
    extra: set.filter((n) => !published.includes(n)),
    missing: published.filter((n) => !set.includes(n)),
  };
}

const offered = offeredCounts();
if (offered) {
  const set = [...new Set(offered)].sort((a, b) => a - b);
  const { extra, missing } = offendingCounts(set);
  if (extra.length || missing.length) {
    fail(
      `the slider offers ${set.length} distinct count(s), the ladder publishes ${published.length}.\n`
      + `    published anchors: ${published.join(', ')}\n`
      + `    offered:           ${set.join(', ')}`
      + (extra.length ? `\n    offered but not buyable: ${extra.join(', ')}` : '')
      + (missing.length ? `\n    buyable but not offered: ${missing.join(', ')}` : '')
    );
  }
  for (const n of set) {
    const want = volume.chargeAt(n);
    if (lp.quote(n) !== want) fail(`quote(${n}) is $${lp.quote(n)}, checkout charges $${want}`);
  }

  // Positive control. An absence proof needs a present case, so the
  // comparison that just reported nothing is handed the defect it exists for:
  // 120 respondents, the count that priced at $149 on this page and became 100
  // or 250 at setup. A clean run above means the slider is restricted, rather
  // than that this comparison has stopped being able to object to anything.
  const planted = offendingCounts([...published, 120]);
  if (!planted.extra.includes(120) || planted.missing.length) {
    fail(
      'positive control: the offered-set comparison no longer objects to 120 respondents, '
      + 'a count the ladder publishes no price for. It cannot detect the defect it exists '
      + 'for, so the clean result above means nothing. Re-derive it against the ladder.'
    );
  }
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
  if (!priceFor.some(([n]) => n === lp.SLIDER_DEFAULT_COUNT)) fail('prerendered page has no headline price');
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
console.log(
  `verify-landing-prices ok: ${published.length} slider positions (${published.join(', ')}), `
  + `every one a count checkout will sell, and ${lp.LADDER.length} rungs match checkout; no typed-in prices`
);
void statSync;
