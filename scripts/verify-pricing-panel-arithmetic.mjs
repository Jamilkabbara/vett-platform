/**
 * verify-pricing-panel-arithmetic - every number the setup panel shows beside
 * a respondent count has to reconcile with the number it charges.
 *
 * WHY
 * ---
 * The ladder picks a round price at seven anchor counts (5 / 25 / 100 / 250 /
 * 500 / 1,000 / 1,250) and DERIVES each bracket's per-respondent rate from its
 * own anchor. The rate therefore only multiplies back to the price AT an
 * anchor. The slider stepped by 5, so most counts a customer could land on
 * were not anchors, and the panel then showed three numbers that disagreed:
 *
 *   count 120 -> tier "Deep Dive . $1.196/resp"   (the bracket rate)
 *                "120 x $1.2417 = $149"           (the charge, back-divided)
 *                total $149                       (the charge)
 *
 * Nothing was mischarged: price(120) is $149, which is the tier-price floor
 * doing its job, and price(n) is monotonic non-decreasing across the whole
 * range. But a customer who multiplies the rate on screen by the count on
 * screen gets $143.52 - LESS than the $149 that 100 respondents cost. The
 * number the panel publishes implies the price goes DOWN as the study gets
 * bigger, which is the opposite of what we charge, and it is the kind of
 * arithmetic a buyer checks on a calculator before paying $1,099.
 *
 * WHAT THIS PINS
 * Three invariants, all measured against the real engine:
 *
 *   1. Every count the slider accepts is a PUBLISHED anchor. That is what
 *      makes rate x count = price true by construction, rather than true only
 *      where someone remembered to re-derive the rate.
 *   2. rate x count == base, to the cent, at every accepted count.
 *   3. rate x count is non-decreasing across the accepted counts.
 *
 * Plus the engine's own property, which held before this check existed and is
 * kept here so it cannot quietly stop holding: price(n) is non-decreasing for
 * EVERY integer n up to the self-serve cap - not just the sellable ones,
 * because historical and in-flight missions hold non-anchor counts and still
 * have to price.
 *
 * The accepted-count set is MEASURED from the panel source, not assumed: the
 * slider's own min/max/step, mapped through the engine's snap function only if
 * the panel actually calls it. A check that assumed the snap was wired would
 * pass on a panel that had quietly stopped snapping.
 */
import { readFileSync } from 'node:fs';
import { loadPricingEngine, NO_TARGETING } from './lib/pricingEngineModule.mjs';

const PANEL = new URL('../src/components/dashboard/MissionControlPricing.tsx', import.meta.url);
const panelSrc = readFileSync(PANEL, 'utf8');
const engine = await loadPricingEngine();

const failures = [];
const fail = (msg) => failures.push(msg);

// -- What does the slider actually accept? ----------------------------------
const num = (re, label) => {
  const m = re.exec(panelSrc);
  if (!m) { fail(`MissionControlPricing.tsx: could not read ${label}`); return null; }
  return Number(m[1]);
};
const min  = num(/const MIN_RESPONDENTS = (\d+)/, 'MIN_RESPONDENTS');
const step = num(/const RESPONDENT_STEP = (\d+)/, 'RESPONDENT_STEP');
const max  = engine.MAX_SELF_SERVE_RESPONDENTS;
if (!/const MAX_RESPONDENTS = MAX_SELF_SERVE_RESPONDENTS/.test(panelSrc)) {
  fail('MissionControlPricing.tsx: MAX_RESPONDENTS is no longer MAX_SELF_SERVE_RESPONDENTS, so this check cannot know the slider ceiling');
}
if (min === null || step === null || failures.length) {
  console.error('verify-pricing-panel-arithmetic FAILED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

// The raw slider domain, before any snapping.
const rawCounts = [];
for (let n = min; n <= max; n += step) rawCounts.push(n);
if (rawCounts[rawCounts.length - 1] !== max) rawCounts.push(max);

// The panel snaps only if it calls the engine's snap inside its change
// handler. Measured, not assumed - see the header.
const handler = /const handleSlide = useCallback\(([\s\S]*?)\n  \);/.exec(panelSrc);
const snaps = Boolean(handler && /snapToPublishedCount\(/.test(handler[1]))
  && typeof engine.snapToPublishedCount === 'function';

const accepted = snaps
  ? [...new Set(rawCounts.map((n) => engine.snapToPublishedCount(n)))].sort((a, b) => a - b)
  : rawCounts;

// -- 1. The accepted set is exactly the published anchors -------------------
const published = engine.VOLUME_TIERS
  .map((t) => t.anchorCount)
  .filter((n) => n <= max)
  .sort((a, b) => a - b);

const sameSet = accepted.length === published.length
  && accepted.every((n, i) => n === published[i]);
if (!sameSet) {
  const extra = accepted.filter((n) => !published.includes(n));
  fail(
    `the slider accepts ${accepted.length} counts but the ladder publishes ${published.length}.\n`
    + `    published anchors: ${published.join(', ')}\n`
    + `    ${extra.length} accepted count(s) have no published price, e.g. ${extra.slice(0, 12).join(', ')}${extra.length > 12 ? ', ...' : ''}\n`
    + '    At a count with no published price the bracket rate no longer multiplies\n'
    + '    back to the charge, which is what puts three disagreeing numbers on screen.'
  );
}

// -- 2 + 3. rate x count reconciles, and never goes down --------------------
//
// The rate on screen is the active bracket's own rate. That is the number a
// customer multiplies, so that is the number this check multiplies.
const quotedRate = (n) => engine.getVolumeTier(n).ratePerResp;
const baseAt = (n) => engine.calculatePricing(n, [], NO_TARGETING, false).base;
const cents = (v) => Math.round(v * 100);

const mismatched = [];
for (const n of accepted) {
  const implied = quotedRate(n) * n;
  const base = baseAt(n);
  if (Math.abs(cents(implied) - cents(base)) > 1) {
    mismatched.push({ n, rate: quotedRate(n), implied, base });
  }
}
if (mismatched.length) {
  fail(
    `${mismatched.length} of ${accepted.length} accepted counts show a rate that does not multiply back to the price:\n`
    + mismatched.slice(0, 8).map((m) =>
      `      ${m.n} x $${m.rate.toFixed(4)} = $${m.implied.toFixed(2)}, but the panel charges a base of $${m.base.toFixed(2)}`
    ).join('\n')
    + (mismatched.length > 8 ? `\n      ... and ${mismatched.length - 8} more` : '')
  );
}

const inversions = [];
let prev = null;
for (const n of accepted) {
  const implied = quotedRate(n) * n;
  if (prev && implied < prev.implied - 0.005) inversions.push({ from: prev, to: { n, implied } });
  prev = { n, implied };
}
if (inversions.length) {
  fail(
    `the displayed rate implies the price FALLS as the study grows, at ${inversions.length} point(s):\n`
    + inversions.slice(0, 8).map((i) =>
      `      ${i.from.n} respondents implies $${i.from.implied.toFixed(2)}, `
      + `but ${i.to.n} implies $${i.to.implied.toFixed(2)}`
    ).join('\n')
    + (inversions.length > 8 ? `\n      ... and ${inversions.length - 8} more` : '')
  );
}

// -- 4. The engine's own property, over every integer it must price ---------
//
// Not only the sellable counts: missions already in the database hold
// non-anchor counts (120, 240, 885) and the run gate re-prices them.
let prevTotal = -Infinity;
let prevN = null;
const engineInversions = [];
for (let n = 1; n <= max; n++) {
  const total = engine.calculatePricing(n, [], NO_TARGETING, false).total;
  if (total < prevTotal) engineInversions.push({ prevN, prevTotal, n, total });
  prevTotal = total;
  prevN = n;
}
if (engineInversions.length) {
  fail(
    `price(n) is not monotonic non-decreasing - ${engineInversions.length} inversion(s):\n`
    + engineInversions.slice(0, 8).map((i) =>
      `      n=${i.prevN} -> $${i.prevTotal}, n=${i.n} -> $${i.total}`
    ).join('\n')
  );
}

// -- Positive control -------------------------------------------------------
//
// An absence proof needs a present case. These assert the method above can
// still see the inversion and the mismatch it was written for, so a clean run
// means the panel is consistent rather than that the comparison is broken.
{
  const a = quotedRate(100) * 100;   // 100 x $1.49  = $149.00
  const b = quotedRate(120) * 120;   // 120 x $1.196 = $143.52
  if (!(b < a)) {
    fail('positive control: the bracket rate at 120 no longer implies less than the charge at 100, '
       + 'so the comparison above is measuring the wrong quantity. Re-derive it against the ladder.');
  }
  if (cents(b) === cents(baseAt(120))) {
    fail('positive control: 120 x bracket rate now equals base(120), so the mismatch comparison '
       + 'cannot detect the defect it exists for. Re-derive it.');
  }
}

if (failures.length) {
  console.error('verify-pricing-panel-arithmetic FAILED:');
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\n  Slider accepts ${accepted.length} count(s); snapping is ${snaps ? 'ON' : 'OFF'}.`);
  process.exit(1);
}

console.log(
  `verify-pricing-panel-arithmetic OK - ${accepted.length} sellable counts `
  + `(${accepted.join(', ')}), every one a published anchor whose rate multiplies back to its price; `
  + `price(n) non-decreasing over n=1..${max}.`
);
