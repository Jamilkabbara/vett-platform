/**
 * verify-terms-prices - the prerendered /terms Brand Lift table matches the
 * ladder checkout charges from.
 *
 * Runs after prerender. Reads BRAND_LIFT_TIERS and MAX_SELF_SERVE_RESPONDENTS
 * out of src/utils/pricingEngine.ts (the frontend mirror of the backend engine)
 * and recomputes each row the way checkout prices it: ladder base
 * max(n x rate, carried floor), then whole-dollar rounding. A tier anchored
 * above the self-serve cap must appear as a custom quote with no price,
 * because checkout refuses it.
 */
import { readFileSync, existsSync } from 'node:fs';

const ENGINE = readFileSync(new URL('../src/utils/pricingEngine.ts', import.meta.url), 'utf8');
const body = ENGINE.split('export const BRAND_LIFT_TIERS = [')[1].split('] as const;')[0];
const tiers = [...body.matchAll(/name:\s*'([^']+)',\s*anchorCount:\s*(\d+),\s*maxCount:\s*(Number\.POSITIVE_INFINITY|\d+),\s*ratePerResp:\s*([\d.]+),\s*packagePrice:\s*(\d+)/g)]
  .map((m) => ({ name: m[1], anchor: Number(m[2]), max: m[3].startsWith('Number') ? Infinity : Number(m[3]), rate: Number(m[4]), price: Number(m[5]) }));
const CAP = Number(/export const MAX_SELF_SERVE_RESPONDENTS = (\d+)/.exec(ENGINE)[1]);
if (tiers.length < 3) throw new Error(`verify-terms-prices: parsed only ${tiers.length} Brand Lift tiers`);

const floors = []; let running = 0;
for (const t of tiers) { floors.push(running); if (Number.isFinite(t.max)) running = Math.max(running, t.max * t.rate); }
const chargeAt = (n) => {
  const i = tiers.findIndex((t) => n <= t.max);
  const base = Math.round(Math.max(n * tiers[i].rate, floors[i]) * 100) / 100;
  return base <= 0 ? 0 : Math.max(1, Math.round(base));
};
const fmt = (v) => v.toLocaleString('en-US');

const file = new URL('../dist/terms/index.html', import.meta.url);
if (!existsSync(file)) { console.error('verify-terms-prices: dist/terms/index.html not built'); process.exit(1); }
// The rendered page body only: every page's <head> carries the site-wide
// JSON-LD offer description, which is checked by verify-price-copy instead.
const html = readFileSync(file, 'utf8');
const root = html.slice(html.indexOf('<div id="root"'));
const text = root.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const failures = [];
for (const t of tiers) {
  if (t.anchor > CAP) {
    const row = `${t.name}, ${fmt(t.anchor)}+ respondents: custom quote`;
    if (!text.includes(row)) failures.push(`missing "${row}"`);
    if (text.includes(`$${fmt(t.price)}`)) failures.push(`/terms publishes $${fmt(t.price)}, the price of ${t.name} (${fmt(t.anchor)} respondents), which checkout refuses above ${fmt(CAP)}`);
  } else {
    const row = `${t.name}, ${fmt(t.anchor)} respondents: $${fmt(chargeAt(t.anchor))}`;
    if (!text.includes(row)) failures.push(`missing "${row}"`);
  }
}
const topN = Math.min(tiers[tiers.length - 1].anchor, CAP);
const top = `Self-serve Brand Lift studies run up to ${fmt(topN)} respondents ($${fmt(chargeAt(topN))} at ${fmt(topN)})`;
if (!text.includes(top)) failures.push(`missing "${top}"`);
if (/Tracker, 200 respondents: \$300.*Wave, 500 respondents: \$600.*Beyond 1,250 respondents: not sold self-serve/.test(text)) failures.push('the old hand-typed Brand Lift list is still rendered');

if (failures.length) {
  console.error('\nverify-terms-prices FAILED\n');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`verify-terms-prices ok: /terms lists ${tiers.length} Brand Lift tiers from the ladder, self-serve top ${fmt(topN)} at $${fmt(chargeAt(topN))}`);
