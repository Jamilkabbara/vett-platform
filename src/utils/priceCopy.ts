/**
 * priceCopy - every public-facing price string, DERIVED from the ladders.
 *
 * WHY THIS EXISTS
 * ---------------
 * Public copy used to hand-type its numbers. That is how the Terms page came
 * to quote prices the engine had stopped charging, and how eleven /vs/* pages
 * came to advertise "$9 to $969" when the top of the ladder had moved to
 * $1,099. Nothing was lying; the ladder moved and the prose did not, because
 * nothing connected them.
 *
 * A number that appears on a marketing page and also appears in the billing
 * engine must have exactly one source. Everything below is computed from
 * VOLUME_TIERS, BRAND_LIFT_TIERS and CREATIVE_ATTENTION_TIERS at module load.
 * Move a tier and the copy moves with it.
 *
 * Static files cannot import this (index.html, public/llms.txt), so
 * scripts/verify-price-copy.mjs recomputes the same values at build time and
 * fails the build when those files disagree.
 *
 * House style: no em or en dashes in customer-facing copy. Use "to".
 */
import {
  VOLUME_TIERS,
  BRAND_LIFT_TIERS,
  CREATIVE_ATTENTION_TIERS,
  MAX_SELF_SERVE_RESPONDENTS,
  BRAND_LIFT_MIN_RESPONDENTS,
  CA_MIN_RESPONDENTS,
} from './pricingEngine';

const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

/** Lowest and highest published price on the main self-serve ladder. */
const volumeLow = VOLUME_TIERS[0];
const volumeHigh = VOLUME_TIERS[VOLUME_TIERS.length - 1];

export const SELF_SERVE_MIN_USD = volumeLow.packagePrice;
export const SELF_SERVE_MAX_USD = volumeHigh.packagePrice;
export const SELF_SERVE_MIN_RESPONDENTS = volumeLow.anchorCount;

/** "$9 to $1,099" */
export const SELF_SERVE_RANGE = `${usd(SELF_SERVE_MIN_USD)} to ${usd(SELF_SERVE_MAX_USD)}`;

/** "$9 (5 personas) to $1,099 (1,250 personas)" */
export const SELF_SERVE_RANGE_WITH_COUNTS =
  `${usd(SELF_SERVE_MIN_USD)} (${SELF_SERVE_MIN_RESPONDENTS.toLocaleString('en-US')} personas) ` +
  `to ${usd(SELF_SERVE_MAX_USD)} (${MAX_SELF_SERVE_RESPONDENTS.toLocaleString('en-US')} personas)`;

/** "$9 for 5 personas to $1,099 for 1,250" */
export const SELF_SERVE_RANGE_FOR_COUNTS =
  `${usd(SELF_SERVE_MIN_USD)} for ${SELF_SERVE_MIN_RESPONDENTS} personas ` +
  `to ${usd(SELF_SERVE_MAX_USD)} for ${MAX_SELF_SERVE_RESPONDENTS.toLocaleString('en-US')}`;

/** Effective per-respondent rate at the two ends, e.g. "$0.88 to $1.80". */
const rateAt = (price: number, count: number) => price / count;
export const SELF_SERVE_RATE_HIGH_USD = rateAt(SELF_SERVE_MIN_USD, SELF_SERVE_MIN_RESPONDENTS);
export const SELF_SERVE_RATE_LOW_USD = rateAt(SELF_SERVE_MAX_USD, MAX_SELF_SERVE_RESPONDENTS);
export const SELF_SERVE_RATE_RANGE =
  `$${SELF_SERVE_RATE_LOW_USD.toFixed(2)} to $${SELF_SERVE_RATE_HIGH_USD.toFixed(2)}`;

/** Brand Lift bounds. */
const blLow = BRAND_LIFT_TIERS[0];
const blHigh = BRAND_LIFT_TIERS[BRAND_LIFT_TIERS.length - 1];
export const BRAND_LIFT_MIN_USD = blLow.packagePrice;
export const BRAND_LIFT_MAX_USD = blHigh.packagePrice;
export const BRAND_LIFT_MAX_RESPONDENTS = blHigh.anchorCount;
export const BRAND_LIFT_RANGE = `${usd(BRAND_LIFT_MIN_USD)} to ${usd(BRAND_LIFT_MAX_USD)}`;

/** Creative Attention is per creative, not per respondent. */
const caPrices = CREATIVE_ATTENTION_TIERS.map((t) => t.packagePrice);
export const CREATIVE_ATTENTION_MIN_USD = Math.min(...caPrices);
export const CREATIVE_ATTENTION_MAX_USD = Math.max(...caPrices);
export const CREATIVE_ATTENTION_RANGE =
  `${usd(CREATIVE_ATTENTION_MIN_USD)} to ${usd(CREATIVE_ATTENTION_MAX_USD)}`;

/** The widest published price across every ladder. Used for JSON-LD highPrice. */
export const PUBLISHED_LOW_USD = Math.min(
  SELF_SERVE_MIN_USD, BRAND_LIFT_MIN_USD, CREATIVE_ATTENTION_MIN_USD,
);
export const PUBLISHED_HIGH_USD = Math.max(
  SELF_SERVE_MAX_USD, BRAND_LIFT_MAX_USD, CREATIVE_ATTENTION_MAX_USD,
);

/** The single sentence the /vs/* pages and the JSON-LD both describe offers with. */
export const LADDER_SUMMARY =
  `Three goal-keyed pricing ladders: Validate (${SELF_SERVE_MIN_RESPONDENTS} to ` +
  `${MAX_SELF_SERVE_RESPONDENTS.toLocaleString('en-US')} personas, ${SELF_SERVE_RANGE}), ` +
  `Brand Lift (${BRAND_LIFT_MIN_RESPONDENTS} to ${BRAND_LIFT_MAX_RESPONDENTS.toLocaleString('en-US')} ` +
  `personas, ${BRAND_LIFT_RANGE}), Creative Attention (per creative, ${CREATIVE_ATTENTION_RANGE}).`;

export { MAX_SELF_SERVE_RESPONDENTS, BRAND_LIFT_MIN_RESPONDENTS, CA_MIN_RESPONDENTS };
