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

const ENGINE = readFileSync(new URL('../src/utils/pricingEngine.ts', import.meta.url), 'utf8');

/** Pull a ladder's packagePrice list straight out of the engine source. */
function tiers(name) {
  const block = ENGINE.split(`export const ${name} = [`)[1];
  if (!block) throw new Error(`verify-price-copy: ${name} not found in pricingEngine.ts`);
  const body = block.split('] as const;')[0];
  const prices = [...body.matchAll(/packagePrice:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const counts = [...body.matchAll(/anchorCount:\s*(?:CA_MIN_RESPONDENTS|([\d.]+))/g)]
    .map((m) => (m[1] === undefined ? 10 : Number(m[1])));
  if (!prices.length) throw new Error(`verify-price-copy: no packagePrice in ${name}`);
  return { prices, counts };
}

const volume = tiers('VOLUME_TIERS');
const brand  = tiers('BRAND_LIFT_TIERS');
const ca     = tiers('CREATIVE_ATTENTION_TIERS');

const n = (v) => v.toLocaleString('en-US');
const expected = {
  selfServeLow:   volume.prices[0],
  selfServeHigh:  volume.prices[volume.prices.length - 1],
  selfServeMinN:  volume.counts[0],
  selfServeMaxN:  Number(/MAX_SELF_SERVE_RESPONDENTS = (\d+)/.exec(ENGINE)[1]),
  brandLow:       brand.prices[0],
  brandHigh:      brand.prices[brand.prices.length - 1],
  brandMinN:      Number(/BRAND_LIFT_MIN_RESPONDENTS = (\d+)/.exec(ENGINE)[1]),
  brandMaxN:      brand.counts[brand.counts.length - 1],
  caLow:          Math.min(...ca.prices),
  caHigh:         Math.max(...ca.prices),
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
const jsonLd = html.slice(html.indexOf('"offers"'), html.indexOf('"offers"') + 900);
if (/[–—]/.test(jsonLd)) failures.push('index.html: JSON-LD offer block contains an em or en dash; use "to" or a hyphen');

// ── public/llms.txt ────────────────────────────────────────────────────────
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8');
for (const price of volume.prices) check('public/llms.txt', `self-serve tier $${n(price)} missing`, `$${n(price)}`, llms);
for (const price of brand.prices)  check('public/llms.txt', `Brand Lift tier $${n(price)} missing`, `$${n(price)}`, llms);
for (const price of ca.prices)     check('public/llms.txt', `Creative Attention price $${price} missing`, `$${price}`, llms);
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
