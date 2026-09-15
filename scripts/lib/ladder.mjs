/**
 * The pricing ladders as checkout charges them, read from src/utils/pricingEngine.ts
 * (the frontend mirror of the backend engine) without executing TypeScript.
 *
 * Shared by verify-price-copy (index.html, llms.txt) and verify-terms-prices
 * (/terms) so the published-price checks cannot disagree with each other.
 *
 * chargeAt(n) is what checkout bills for n respondents on a respondent ladder:
 * max(n x tier rate, the carried ceiling of the tier below), then whole-dollar
 * rounding. A tier anchored above MAX_SELF_SERVE_RESPONDENTS cannot be bought
 * self-serve (checkout refuses it), so it is never a published price.
 */
import { readFileSync } from 'node:fs';

const ENGINE = readFileSync(new URL('../../src/utils/pricingEngine.ts', import.meta.url), 'utf8');

export const MAX_SELF_SERVE_RESPONDENTS = Number(/export const MAX_SELF_SERVE_RESPONDENTS = (\d+)/.exec(ENGINE)[1]);
export const BRAND_LIFT_MIN_RESPONDENTS = Number(/BRAND_LIFT_MIN_RESPONDENTS = (\d+)/.exec(ENGINE)[1]);

function block(name) {
  const b = ENGINE.split(`export const ${name} = [`)[1];
  if (!b) throw new Error(`ladder: ${name} not found in pricingEngine.ts`);
  return b.split('] as const;')[0];
}

/** A respondent ladder with the charge function checkout uses. */
export function respondentLadder(name) {
  const tiers = [...block(name).matchAll(/name:\s*'([^']+)',\s*anchorCount:\s*(\d+),\s*maxCount:\s*(Number\.POSITIVE_INFINITY|\d+),\s*ratePerResp:\s*([\d./ ]+?),\s*packagePrice:\s*(\d+)/g)]
    .map((m) => ({
      name: m[1], anchor: Number(m[2]),
      max: m[3].startsWith('Number') ? Infinity : Number(m[3]),
      // Rates are written either as a decimal or as packagePrice / anchor.
      rate: m[4].includes('/') ? m[4].split('/').map(Number).reduce((a, b) => a / b) : Number(m[4]),
      price: Number(m[5]),
    }));
  if (tiers.length < 3) throw new Error(`ladder: parsed only ${tiers.length} tiers from ${name}`);
  const floors = []; let running = 0;
  for (const t of tiers) { floors.push(running); if (Number.isFinite(t.max)) running = Math.max(running, t.max * t.rate); }
  const chargeAt = (n) => {
    const i = tiers.findIndex((t) => n <= t.max);
    const base = Math.round(Math.max(n * tiers[i].rate, floors[i]) * 100) / 100;
    return base <= 0 ? 0 : Math.max(1, Math.round(base));
  };
  const sellable = tiers.filter((t) => t.anchor <= MAX_SELF_SERVE_RESPONDENTS);
  const unsellable = tiers.filter((t) => t.anchor > MAX_SELF_SERVE_RESPONDENTS);
  const topN = Math.min(tiers[tiers.length - 1].anchor, MAX_SELF_SERVE_RESPONDENTS);
  return { tiers, sellable, unsellable, chargeAt, topN, low: chargeAt(tiers[0].anchor), high: chargeAt(topN) };
}

/** Creative Attention: flat per creative. */
export function creativeAttentionPrices() {
  return [...block('CREATIVE_ATTENTION_TIERS').matchAll(/packagePrice:\s*([\d.]+)/g)].map((m) => Number(m[1]));
}
