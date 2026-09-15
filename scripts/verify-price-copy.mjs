/**
 * verify-price-copy - fail the build when a static file quotes a price the
 * ladder no longer charges.
 *
 * WHY
 * ---
 * src/utils/priceCopy.ts derives every price string in the .tsx pages from the
 * ladders, so those cannot drift. Two customer-facing files cannot import it:
 *
 *   index.html      the JSON-LD AggregateOffer, read by search engines
 *   public/llms.txt the plain-text summary, read by crawlers and LLMs
 *
 * Both are the kind of file nobody opens for months. index.html was
 * advertising highPrice 1990 and a "$9-$1990" Validate ladder whose real top
 * is $1,099; llms.txt still listed a per-respondent Creative Attention ladder
 * that was retired when CA moved to per-creative pricing. Neither was caught
 * by any test, because no test knew they contained prices.
 *
 * This script recomputes the numbers from the SAME ladder source the engine
 * uses and asserts the files agree. It is a guard, not a generator: it will
 * not rewrite the copy for you, because the wording around a number is an
 * editorial choice. It tells you exactly which value is stale.
 *
 * Mirrors the shape of scripts/verify-sw-passthrough.mjs.
 */
import { readFileSync } from 'node:fs';
import { respondentLadder, creativeAttentionPrices, MAX_SELF_SERVE_RESPONDENTS, BRAND_LIFT_MIN_RESPONDENTS } from './lib/ladder.mjs';

// Published prices are what checkout will actually charge. A tier anchored
// above the self-serve cap is refused at checkout, so it is not a price: until
// 2026-09-15 this check REQUIRED index.html and llms.txt to advertise Brand
// Lift at 2,000 respondents for $1,500, a study POST /api/pricing/quote
// refuses ('Studies above 1,250 respondents are run as a managed engagement').
const volume = respondentLadder('VOLUME_TIERS');
const brand  = respondentLadder('BRAND_LIFT_TIERS');
const caPrices = creativeAttentionPrices();

const n = (v) => v.toLocaleString('en-US');
const expected = {
  selfServeLow:   volume.low,
  selfServeHigh:  volume.high,
  selfServeMinN:  volume.tiers[0].anchor,
  selfServeMaxN:  volume.topN,
  brandLow:       brand.low,
  brandHigh:      brand.high,
  brandMinN:      BRAND_LIFT_MIN_RESPONDENTS,
  brandMaxN:      brand.topN,
  caLow:          Math.min(...caPrices),
  caHigh:         Math.max(...caPrices),
};
const publishedHigh = Math.max(expected.selfServeHigh, expected.brandHigh, expected.caHigh);
const publishedLow  = Math.min(expected.selfServeLow,  expected.brandLow,  expected.caLow);

const failures = [];
const check = (file, label, needle, text) => {
  if (!text.includes(needle)) failures.push(`${file}: ${label}\n    expected to find: ${needle}`);
};

// ── index.html ─────────────────────────────────────────────────────────────
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
check('index.html', 'JSON-LD lowPrice',  `"lowPrice": "${publishedLow}"`,  html);
check('index.html', 'JSON-LD highPrice', `"highPrice": "${publishedHigh}"`, html);
check('index.html', 'offer description, Validate range',
      `Validate (${expected.selfServeMinN} to ${n(expected.selfServeMaxN)} personas, $${expected.selfServeLow} to $${n(expected.selfServeHigh)})`, html);
check('index.html', 'offer description, Brand Lift range',
      `Brand Lift (${expected.brandMinN} to ${n(expected.brandMaxN)} personas, $${expected.brandLow} to $${n(expected.brandHigh)})`, html);
check('index.html', 'offer description, Creative Attention range',
      `Creative Attention (per creative, $${expected.caLow} to $${expected.caHigh})`, html);

// House style: no em or en dashes in customer-facing copy.
// The whole JSON-LD block, not just the offer: search engines can show any of
// its descriptions as a snippet.
const ldStart = html.indexOf('<script type="application/ld+json">');
const jsonLd = html.slice(ldStart, html.indexOf('</script>', ldStart));
if (ldStart < 0) failures.push('index.html: JSON-LD block not found');
if (/[–—]/.test(jsonLd)) failures.push('index.html: JSON-LD block contains an em or en dash; use "to" or a hyphen');
check('index.html', 'offer description, one-time payment', 'Paid once per mission; no subscription.', html);

// ── public/llms.txt ────────────────────────────────────────────────────────
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8');
for (const t of volume.sellable) check('public/llms.txt', `self-serve tier $${n(t.price)} missing`, `$${n(t.price)}`, llms);
for (const t of brand.sellable)  check('public/llms.txt', `Brand Lift tier $${n(t.price)} missing`, `$${n(t.price)}`, llms);
check('public/llms.txt', 'Brand Lift self-serve top', `$${n(brand.high)} at ${n(brand.topN)}`, llms);
for (const price of caPrices)    check('public/llms.txt', `Creative Attention price $${price} missing`, `$${price}`, llms);

// A price checkout refuses must not be published anywhere a crawler reads.
for (const t of [...volume.unsellable, ...brand.unsellable]) {
  for (const [file, text] of [['index.html', jsonLd], ['public/llms.txt', llms]]) {
    if (text.includes(`$${n(t.price)}`)) {
      failures.push(`${file}: publishes $${n(t.price)}, the price of ${t.name} (${n(t.anchor)} respondents), which checkout refuses above ${n(MAX_SELF_SERVE_RESPONDENTS)}`);
    }
  }
}
if (/Creative Attention \(per-respondent/.test(llms))
  failures.push('public/llms.txt: still describes Creative Attention as per-respondent; it is priced per creative');

if (failures.length) {
  console.error('\nverify-price-copy FAILED. A published price no longer matches the ladder.\n');
  for (const f of failures) console.error('  - ' + f);
  console.error('\nThe ladders are in src/utils/pricingEngine.ts. Fix the copy, not the ladder,');
  console.error('unless the price really did change.\n');
  process.exit(1);
}
console.log(`verify-price-copy ok: $${publishedLow} to $${publishedHigh} published, index.html and llms.txt agree with the ladder`);
