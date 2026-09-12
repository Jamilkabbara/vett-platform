import { Question } from '../components/dashboard/QuestionEngine';
import { TargetingConfig } from '../components/dashboard/TargetingEngine';
// COUNTRIES + BEHAVIORS were used by the prior country-tier price model;
// Pass 23 Bug 23.PRICING moved to volume-tier (rate keyed on respondent
// count). Imports are no longer needed here. Targeting filter costs are
// computed from the targeting object directly below.

export interface PricingBreakdown {
  base: number;
  questionSurcharge: number;
  targetingSurcharge: number;
  screeningSurcharge: number;
  /** What the card is charged: a whole dollar. See roundChargeToWholeDollar. */
  total: number;
  /** The ladder arithmetic behind `total`, before the whole-dollar rounding. */
  exactTotal: number;
  filterCount: number;
  /**
   * True when the respondent count is above MAX_SELF_SERVE_RESPONDENTS. The
   * price is still computed (so the panel can show what the study is worth)
   * but the mission cannot be bought: the backend fails checkout closed and
   * the UI routes the buyer to lead capture instead.
   */
  customQuote?: boolean;
}

// Pass 23 Bug 23.PRICING + 23.51 — goal-type-keyed tier ladders.
// Mirrors backend pricingEngine.js exactly.
//
// Default ladder (validate / naming_messaging / marketing):
// DO NOT QUOTE PRICES FROM THIS HEADER. The ladders below are the only
// numbers that bill, and this summary carried the pre-2026-09 figures long
// after the reprice replaced them. Read VOLUME_TIERS, BRAND_LIFT_TIERS and
// CREATIVE_ATTENTION_TIERS directly.
//
// Pass 25 Phase 0.3 — Creative Attention is now a respondent ladder
// (was flat per-asset). 1-respondent missions have no statistical signal.
// Floor stays at $19 / 10 respondents. Per-respondent cost is slightly
// higher than the validate ladder because CA runs frame-by-frame Claude
// Vision analysis per respondent.
//   Sniff Test  10  $19   $1.90/resp
//   Validate    25  $39   $1.56/resp
//   Confidence  50  $69   $1.38/resp
//   Deep Dive   100 $129  $1.29/resp
//   Deep Dive XL 250 $299 $1.20/resp
export const CA_MIN_RESPONDENTS = 10;

/**
 * Brand Lift's respondent floor. Mirrors BRAND_LIFT_MIN_RESPONDENTS in the
 * backend engine, and src/lib/sampleSizeMinimums.ts.
 *
 * This ladder's brackets carried `minRespondents: 50` until 2026-09, while the
 * backend and sampleSizeMinimums both said 100 — so the setup panel would let a
 * customer configure a 50-respondent Brand Lift study and price it, and
 * checkout would then refuse the mission. One number now.
 */
export const BRAND_LIFT_MIN_RESPONDENTS = 100;

/**
 * Default volume ladder. MUST stay in lockstep with VOLUME_TIERS in the
 * backend's src/utils/pricingEngine.js — a one-sided deploy makes this panel
 * quote one number and Stripe charge another.
 *
 * ── The 2026-09 reprice: round prices first, rates derived ──────────────────
 *
 * The old ladder was built rate-first and the anchor prices fell out of the
 * multiplication, which produced a rate curve that was not monotone:
 *
 *     n=5  $1.80/resp     n=10  $3.50/resp     n=50  $1.98/resp
 *
 * $3.50 was not a decision about what ten respondents are worth; it was the
 * number that made 10 x rate land on $35. Dragging the slider one notch right
 * nearly doubled the customer's unit price.
 *
 * Each price below is chosen first, as a number a customer can read, and
 * ratePerResp is DERIVED as price / anchorCount. The rate is now monotone
 * decreasing across the whole ladder. packagePrice documents the anchor that
 * generated the rate; nothing reads it as a price.
 *
 * The top bracket anchors at MAX_SELF_SERVE_RESPONDENTS (1,250) and is
 * open-ended, so the last sellable count has a round price and the ladder
 * cannot form the flat plateau the retired linear bridge existed to close.
 */
export const VOLUME_TIERS = [
  { id: 'sniff_test', name: 'Sniff Test', anchorCount: 5,    maxCount: 5,    ratePerResp: 9    / 5,    packagePrice: 9    },
  { id: 'validate',   name: 'Validate',   anchorCount: 25,   maxCount: 25,   ratePerResp: 39   / 25,   packagePrice: 39   },
  { id: 'confidence', name: 'Confidence', anchorCount: 100,  maxCount: 100,  ratePerResp: 149  / 100,  packagePrice: 149  },
  { id: 'deep_dive',  name: 'Deep Dive',  anchorCount: 250,  maxCount: 250,  ratePerResp: 299  / 250,  packagePrice: 299  },
  { id: 'scale',      name: 'Scale',      anchorCount: 500,  maxCount: 500,  ratePerResp: 499  / 500,  packagePrice: 499  },
  { id: 'growth',     name: 'Growth',     anchorCount: 1000, maxCount: 1000, ratePerResp: 899  / 1000, packagePrice: 899  },
  { id: 'enterprise', name: 'Enterprise', anchorCount: 1250, maxCount: Number.POSITIVE_INFINITY, ratePerResp: 1099 / 1250, packagePrice: 1099 },
] as const;

/**
 * Brand Lift ladder. MUST stay numerically identical to BRAND_LIFT_TIERS in the
 * backend's src/utils/pricingEngine.js.
 *
 * ── Pulse moved from 50 to 100, 2026-09-13 ─────────────────────────────────
 *
 * Pulse anchored at 50 with maxCount 50, which put the WHOLE tier below the
 * 100-respondent floor (BRAND_LIFT_MIN_RESPONDENTS, and a CHECK constraint on
 * missions). No count could ever resolve to it, so it was a tier that could
 * not be bought - and it did three visible kinds of damage from here:
 *
 *   - BRAND_LIFT_DEFAULT_STATE seeded a new study with
 *     BRAND_LIFT_TIERS[0].anchorCount, i.e. 50, a count the backend and the
 *     database both reject. The setup panel opened in an unlaunchable state.
 *   - MissionSetupPage prices a brand-lift draft off tier.packagePrice. At
 *     n=100 the lookup fell through to Tracker and estimated $300 for a study
 *     the backend charges $150 for.
 *   - STARTING_PRICE_BRAND_LIFT_USD reads BRAND_LIFT_TIERS[0].packagePrice,
 *     so any "from" copy built on it advertised $99 for a study whose real
 *     cheapest price has been $150 since the floor moved.
 *
 * Owner decision: move the anchor to 100 so the tier is buyable. maxCount 100
 * makes Pulse the entry study and leaves Tracker (100, 200] with no gap and no
 * overlap. The rate is 1.50, the same as Tracker: it cannot be lower without
 * making the per-respondent rate RISE with volume, and raising it to keep 1.98
 * would push a 100-respondent study from $150 to $198. packagePrice 150 is
 * 100 x 1.50, the same anchor-times-rate relationship every other tier holds.
 *
 * NO PRICE MOVES. 100 / 150 / 199 cost $150.00 / $225.00 / $298.50 before and
 * after. What changes is that the tier resolves.
 */
export const BRAND_LIFT_TIERS = [
  { id: 'pulse',      name: 'Pulse',      anchorCount: 100,  maxCount: 100,  ratePerResp: 1.50, packagePrice: 150,  minRespondents: 100 },
  { id: 'tracker',    name: 'Tracker',    anchorCount: 200,  maxCount: 200,  ratePerResp: 1.50, packagePrice: 300,  minRespondents: 100 },
  { id: 'wave',       name: 'Wave',       anchorCount: 500,  maxCount: 500,  ratePerResp: 1.20, packagePrice: 600,  minRespondents: 100 },
  { id: 'enterprise', name: 'Enterprise', anchorCount: 2000, maxCount: Number.POSITIVE_INFINITY, ratePerResp: 0.75, packagePrice: 1500, minRespondents: 100 },
] as const;

/**
 * Creative Attention is priced per CREATIVE, not per respondent.
 * MUST stay in lockstep with CREATIVE_ATTENTION_TIERS in the backend engine.
 *
 * The retired ladder charged 10/$19, 25/$39, 50/$69, 100/$129, 250+/$299. It
 * priced by a quantity the product does not have: the analysis never reads
 * respondent_count and the results page never mentions respondents. A mission
 * downloads one creative, samples frames and scores them, so $299 for "250
 * respondents" bought byte-identical work to $19 for "10".
 *
 * Cost drives per creative and is bounded: an image is 3 vision calls
 * ($0.03-$0.06), a video is 30 frames plus synthesis ($0.48). The frame
 * extractor samples once a second and stops at 30, so a 35-second and a
 * ten-minute video cost the same.
 *
 * $19 keeps the advertised entry price. $49 says the harder analysis costs
 * more without tracking the 11x cost ratio, which would put a video at $209.
 */
export const CREATIVE_ATTENTION_TIERS = [
  { id: 'image', name: 'Image', anchorCount: CA_MIN_RESPONDENTS, maxCount: Number.POSITIVE_INFINITY, ratePerResp: null, packagePrice: 19 },
  { id: 'video', name: 'Video', anchorCount: CA_MIN_RESPONDENTS, maxCount: Number.POSITIVE_INFINITY, ratePerResp: null, packagePrice: 49 },
] as const;

/** The flat price for a creative of this media type. Mirrors the backend. */
export function creativeAttentionPrice(mediaType: string | null | undefined): number {
  return String(mediaType || '').toLowerCase() === 'video'
    ? CREATIVE_ATTENTION_TIERS[1].packagePrice
    : CREATIVE_ATTENTION_TIERS[0].packagePrice;
}

/**
 * The respondent count written on a Creative Attention mission.
 *
 * Not a customer input any more - the form does not ask and nothing downstream
 * reads it. It survives only because a NOT VALID CHECK constraint on missions
 * requires >= 10 for this goal type, and Postgres re-checks a NOT VALID
 * constraint on ANY later update to the row, including updates touching
 * unrelated columns. A row written below the floor becomes unwritable.
 */
export const CA_FIXED_RESPONDENT_COUNT = CA_MIN_RESPONDENTS;

export type VolumeTier = (typeof VOLUME_TIERS)[number];
export type BrandLiftTier = (typeof BRAND_LIFT_TIERS)[number];

// Pass 37 A8 — single source of truth for "starting at" pricing copy.
// Previously the landing page hardcoded "$35" in 6 different places;
// when the entry tier dropped to $9 (Pass 21 Sniff Test launch), the
// landing copy lagged behind the actual minimum charge — a customer
// reading "From $35" then watching the slider land on $9 saw an
// instant credibility hit. These exports derive from the ladders
// themselves so the landing copy can never drift again.
export const STARTING_PRICE_USD            = VOLUME_TIERS[0].packagePrice;            // 9
export const STARTING_PRICE_CREATIVE_USD   = CREATIVE_ATTENTION_TIERS[0].packagePrice; // 19
export const STARTING_PRICE_BRAND_LIFT_USD = BRAND_LIFT_TIERS[0].packagePrice;        // 150
export type CreativeAttentionTier = (typeof CREATIVE_ATTENTION_TIERS)[number];
export type AnyTier = VolumeTier | BrandLiftTier | CreativeAttentionTier;

export function getPricingForGoalType(goalType: string | null | undefined): readonly AnyTier[] {
  switch (goalType) {
    case 'brand_lift':         return BRAND_LIFT_TIERS;
    case 'creative_attention': return CREATIVE_ATTENTION_TIERS;
    default:                   return VOLUME_TIERS;
  }
}

export function getVolumeTier(respondentCount: number): VolumeTier {
  const c = Math.max(0, Number(respondentCount) || 0);
  return VOLUME_TIERS.find(t => c <= t.maxCount) ?? VOLUME_TIERS[VOLUME_TIERS.length - 1];
}

/**
 * ── V1 tier-boundary price inversion fix (mirrors the backend) ──────────────
 *
 * The ladders price as `count × tier.ratePerResp`, and the bracket rate DROPS
 * at each boundary — so the quoted total used to go DOWN as the respondent
 * count went UP. With the setup slider at step 5, dragging one notch right of
 * 1,000 took the quote from $900.00 to $402.00.
 *
 * Fix: floor each tier at the maximum price payable in the tier BELOW it, so
 * price is monotonic non-decreasing. The anchor/preset counts
 * (5/10/50/250/1,000/5,000) are unchanged — only the "dip" band immediately
 * after each boundary is lifted back to the boundary price.
 *
 * This MUST stay byte-identical to `respondentLadderBase` in the backend's
 * src/utils/pricingEngine.js, or the quote shown at setup will disagree with
 * the amount the server charges at checkout.
 */
const TIER_PRICE_FLOORS = new WeakMap<object, number[]>();

function getTierPriceFloors(ladder: readonly AnyTier[]): number[] {
  const cached = TIER_PRICE_FLOORS.get(ladder as unknown as object);
  if (cached) return cached;
  const floors: number[] = [];
  let running = 0;
  for (const t of ladder) {
    floors.push(running);
    // The open-ended top tier has maxCount Infinity and no ceiling to carry.
    // ratePerResp is null on the Creative Attention ladder, which is priced
    // per creative rather than per respondent - there is no rate to multiply,
    // so there is no floor to carry either.
    if (Number.isFinite(t.maxCount) && typeof t.ratePerResp === 'number') {
      running = Math.max(running, t.maxCount * t.ratePerResp);
    }
  }
  TIER_PRICE_FLOORS.set(ladder as unknown as object, floors);
  return floors;
}

/** The price floor a given tier inherits from the tier below it (0 if unknown). */
export function tierPriceFloor(ladder: readonly AnyTier[], tier: AnyTier | null | undefined): number {
  if (!ladder || !tier) return 0;
  const idx = ladder.indexOf(tier);
  if (idx < 0) return 0;
  return getTierPriceFloors(ladder)[idx] || 0;
}

/**
 * Monotonic base price for a respondent-count ladder.
 * base(n) = max(n × tierRate, ceiling price of the tier below)
 */
export function respondentLadderBase(
  ladder: readonly AnyTier[],
  tier: AnyTier | null | undefined,
  count: number,
  rate: number,
): number {
  const n = Math.max(0, Number(count) || 0);
  return Math.round(Math.max(n * rate, tierPriceFloor(ladder, tier)) * 100) / 100;
}

/**
 * ── The plateau bridge was retired by the 2026-09 reprice ──────────────────
 *
 * The bridge closed a flat $900 band 1,251 counts wide that the tier-price
 * floor created on the old ladder, where the rate more than HALVED at the
 * 1,000 boundary ($0.90 -> $0.40). The repriced ladder's steps are small and
 * its top bracket is open-ended, so the widest flat band below the self-serve
 * cap is 56 counts and there is nothing left to bridge. Its far anchor (5,000
 * at $2,000) was a count no customer can buy.
 *
 * respondentLadderBase is called directly again. Mirrors the backend.
 */

/**
 * The largest study the delivery pipeline can honestly run self-serve.
 *
 * NOT a price bound — a DELIVERY bound. Derived from the 6h catastrophic
 * backstop in the backend's mission-recovery cron (JOB1_STUCK_AFTER_HOURS)
 * against the measured recruit-loop throughput of 11.9 s per delivered
 * respondent (worst measured 14.2 s/resp → a 1,525 hard ceiling), with margin
 * for the fact that the largest mission ever DELIVERED in production is 100.
 * Full derivation lives beside MAX_SELF_SERVE_RESPONDENTS in the backend
 * pricing engine. Keep the two numbers in lockstep.
 */
export const MAX_SELF_SERVE_RESPONDENTS = 1250;

/** Extra-question surcharge. Mirrors the backend engine. */
export const EXTRA_QUESTION_PRICE = 5;
export const FREE_QUESTIONS = 10;

/**
 * Render a per-respondent rate so `count x rate` visibly reconciles with the
 * base it produced. The reprice derives rates from round anchors, so four of
 * the seven are not two-decimal numbers (499/500 = 0.998). toFixed(2) would
 * render "$1.00 / respondent" beside a $499 charge for 500 people. Mirrors
 * formatRatePerResp in the backend engine.
 */
export function formatRatePerResp(rate: number): string | null {
  const r = Number(rate);
  if (!Number.isFinite(r)) return null;
  return r.toFixed(4).replace(/(\.\d{2}\d*?)0+$/, '$1');
}

/** True when a respondent count is beyond what the pipeline can deliver self-serve. */
export function isAboveSelfServeCap(count: number): boolean {
  return Math.max(0, Number(count) || 0) > MAX_SELF_SERVE_RESPONDENTS;
}

/**
 * The amount a customer is actually charged, in whole dollars.
 * MUST match roundChargeToWholeDollar in the backend engine exactly - the panel
 * reconciles against the server quote within $0.02, so any difference here
 * surfaces to the customer as a price that moves between panel and checkout.
 *
 * The ladder picks round numbers at its ANCHORS and derives a per-respondent
 * rate from each, so an anchor count lands round - but the slider steps by 5,
 * so most customers land BETWEEN anchors and got the raw multiplication:
 * 10 respondents at $1.56 is $15.60, 50 at $1.49 is $74.50.
 *
 * A positive charge never rounds to zero: a 95%-off promo on a $9 mission is
 * $0.45, and rounding that to $0 would turn a paid mission into a free one.
 * Genuinely free missions reach 0 through a free-type promo, before this runs.
 */
export function roundChargeToWholeDollar(exactTotal: number): number {
  const t = Number(exactTotal);
  if (!Number.isFinite(t) || t <= 0) return 0;
  return Math.max(1, Math.round(t));
}

export const calculatePricing = (
  respondentCount: number,
  questions: Question[],
  targeting: TargetingConfig,
  isScreeningActive: boolean = false
): PricingBreakdown => {
  // Country tier is no longer an input to the rate (Pass 23 Bug 23.PRICING).
  // The targeting countries are still used downstream for filter-cost lookup
  // and city-targeting flags below.
  const tier = getVolumeTier(respondentCount);
  const basePerRespondent = tier.ratePerResp;
  // Monotonic: never cheaper than the top of the tier below. See
  // respondentLadderBase — the tier-boundary inversion fix.
  const base = respondentLadderBase(VOLUME_TIERS, tier, respondentCount, basePerRespondent);

  // $5 per question beyond 10, since the 2026-09 reprice (was $20 beyond 5).
  // Question counts are set by the methodology, not the customer — a user can
  // hand-add at most three — so the old rule collected nothing on the generic
  // 5-question instruments and $360 on a 23-question Feature Roadmap the
  // customer could not shorten. Mirrors EXTRA_QUESTION_PRICE / FREE_QUESTIONS
  // in the backend engine.
  const additionalQuestions = Math.max(0, questions.length - FREE_QUESTIONS);
  const questionSurcharge = additionalQuestions * EXTRA_QUESTION_PRICE;

  // FREE DEMOGRAPHICS (covered by base price, no additional cost)
  const freeDemographicsCount =
    (targeting.demographics?.ageRanges?.length || 0) +
    (targeting.demographics?.genders?.length || 0) +
    (targeting.demographics?.education?.length || 0) +
    (targeting.demographics?.marital?.length || 0) +
    (targeting.demographics?.parental?.length || 0) +
    (targeting.demographics?.employment?.length || 0);

  // PAID TARGETING CRITERIA

  // Professional B2B: Industries + Roles + Company Sizes (capped at $1.50)
  const professionalB2BCount =
    (targeting.professional?.industries?.length || 0) +
    (targeting.professional?.roles?.length || 0) +
    (targeting.professional?.companySizes?.length || 0);
  const professionalB2BCost = Math.min(professionalB2BCount * 0.50, 1.50);

  // Technographics: Devices + Behaviors (capped at $1.00)
  const devicesCount = targeting.technographics?.devices
    ? targeting.technographics.devices.filter(d => d !== 'No Preference').length
    : 0;
  const behaviorsCount = targeting.behaviors?.length || 0;
  const technographicsCount = devicesCount + behaviorsCount;
  const technographicsCost = Math.min(technographicsCount * 0.50, 1.00);

  // Financial: Household Income + Investments (capped at $1.00)
  const incomeCount = targeting.financials?.incomeRanges?.length || 0;
  const financialCost = Math.min(incomeCount * 0.50, 1.00);

  // Calculate per-respondent filter cost (demographics excluded)
  const perRespondentFilterCost =
    professionalB2BCost +
    technographicsCost +
    financialCost;

  let targetingSurcharge = perRespondentFilterCost * respondentCount;

  // City targeting is a separate flat fee
  if (targeting.geography.cities && targeting.geography.cities.length > 0) {
    targetingSurcharge += 1.00 * respondentCount;
  }

  const totalPaidFilterCount = professionalB2BCount + technographicsCount + incomeCount;

  const screeningSurcharge = isScreeningActive ? respondentCount * 0.50 : 0;

  const total = base + questionSurcharge + targetingSurcharge + screeningSurcharge;

  // Detailed pricing breakdown for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log("=== PRICING BREAKDOWN ===");
    console.log(`Base: $${base} (${respondentCount} × $${basePerRespondent})`);

    if (freeDemographicsCount > 0) {
      console.log(`\n✓ FREE Demographics (covered by base): ${freeDemographicsCount} items → $0.00`);
    }

    console.log(`\nPAID Targeting Filters (per-category caps):`);
    if (professionalB2BCount > 0) {
      console.log(`  • Professional B2B: ${professionalB2BCount} items × $0.50 = $${(professionalB2BCount * 0.50).toFixed(2)} → capped at $${professionalB2BCost.toFixed(2)}`);
    }
    if (technographicsCount > 0) {
      console.log(`  • Technographics: ${technographicsCount} items × $0.50 = $${(technographicsCount * 0.50).toFixed(2)} → capped at $${technographicsCost.toFixed(2)}`);
    }
    if (incomeCount > 0) {
      console.log(`  • Financial: ${incomeCount} items × $0.50 = $${(incomeCount * 0.50).toFixed(2)} → capped at $${financialCost.toFixed(2)}`);
    }

    if (perRespondentFilterCost > 0) {
      console.log(`\nPaid Filter Cost: $${perRespondentFilterCost.toFixed(2)} per respondent × ${respondentCount} = $${targetingSurcharge.toFixed(2)}`);
    }

    if (targeting.geography.cities?.length > 0) console.log(`+ City Targeting: $${(1.00 * respondentCount).toFixed(2)}`);
    if (questionSurcharge > 0) console.log(`+ Extra Questions: $${questionSurcharge.toFixed(2)}`);
    if (screeningSurcharge > 0) console.log(`+ Screening: $${screeningSurcharge.toFixed(2)}`);
    console.log(`\nTOTAL: $${total.toFixed(2)}`);
    console.log("========================");
  }

  const cityFilterCount = targeting.geography.cities && targeting.geography.cities.length > 0 ? 1 : 0;
  const filterCount = totalPaidFilterCount + cityFilterCount;

  // Round to CENTS, not to whole dollars. The backend rounds every line to two
  // decimals (round2 in src/utils/pricingEngine.js), so the line items stay in
  // cents. The TOTAL is then rounded to a whole dollar - see
  // roundChargeToWholeDollar, which mirrors the backend exactly.
  //
  // This comment used to say the opposite: that rounding to the dollar here
  // made the panel disagree with Stripe by up to $0.50, which
  // verifyServerQuote (+/-$0.02) surfaced as a drift toast. That was true while
  // only the CLIENT rounded. The server now rounds the same way at the same
  // point, so rounding here is what keeps the two in agreement, and NOT
  // rounding would reintroduce the drift it warned about.
  const round2 = (v: number) => Math.round(v * 100) / 100;

  return {
    base: round2(base),
    questionSurcharge: round2(questionSurcharge),
    targetingSurcharge: round2(targetingSurcharge),
    screeningSurcharge: round2(screeningSurcharge),
    total: roundChargeToWholeDollar(round2(total)),
    exactTotal: round2(total),
    filterCount,
    customQuote: isAboveSelfServeCap(respondentCount),
  };
};

// ─────────────────────────────────────────────────────────────────────
// Phase 11 — server-quote validation (frontend ready).
//
// Contract: POST /api/pricing/quote returns a PricingBreakdown. Before
// calling the charge endpoint, Mission Control may call this helper
// with the client-side breakdown and the server response. The helper:
//
//   1. If the server is missing or malformed → return client breakdown
//      unchanged (no-op). This preserves today's UX when the endpoint
//      isn't deployed yet.
//   2. If the server.total differs from client.total by ≤ $0.02 → keep
//      the client value (pure rounding drift, no UX change).
//   3. If the diff > $0.02 → log a warning and SWAP IN the server
//      numbers so Stripe charges the authoritative amount.
//
// The caller is responsible for showing a toast if the total changed
// between click and charge — we don't toast here because the helper
// is pure.
// ─────────────────────────────────────────────────────────────────────

export const SERVER_QUOTE_TOLERANCE_USD = 0.02;

function isServerBreakdown(v: unknown): v is PricingBreakdown {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.base === 'number' &&
    typeof r.questionSurcharge === 'number' &&
    typeof r.targetingSurcharge === 'number' &&
    typeof r.screeningSurcharge === 'number' &&
    typeof r.total === 'number' &&
    typeof r.filterCount === 'number'
  );
}

export interface VerifyServerQuoteResult {
  /** The breakdown the caller should use for the Stripe charge. */
  authoritative: PricingBreakdown;
  /** True if we swapped the server total in (diff > tolerance). */
  swapped: boolean;
  /** Absolute diff in USD between server and client totals. */
  diff: number;
}

export function verifyServerQuote(
  client: PricingBreakdown,
  server: unknown,
): VerifyServerQuoteResult {
  if (!isServerBreakdown(server)) {
    return { authoritative: client, swapped: false, diff: 0 };
  }
  const diff = Math.abs(server.total - client.total);
  if (diff <= SERVER_QUOTE_TOLERANCE_USD) {
    return { authoritative: client, swapped: false, diff };
  }
  console.warn(
    `[verifyServerQuote] server $${server.total} vs client $${client.total} — swapping in server breakdown`,
  );
  return { authoritative: server, swapped: true, diff };
}

// ─────────────────────────────────────────────────────────────────────
// Phase 12 — live server-side quote fetch with short TTL cache.
//
// The existing `verifyServerQuote()` above is a pure comparator. This
// helper is the I/O counterpart: it hits POST /api/pricing/quote and
// returns the authoritative total, memoised for SERVER_QUOTE_CACHE_MS
// so a user who opens the payment modal twice in a row only pays one
// network round-trip. Cache key is derived from `{missionId,
// respondentCount, questionCount, targeting hash, promoCode}` — any
// mutation invalidates the cache.
//
// The pre-checkout flow calls this right before opening the Stripe
// modal. If |client - server| > $0.01 the caller shows a toast and
// updates the UI, preventing a "client forged the price" class of
// attack where a tampered bundle submits a low total while displaying
// a higher one. Server total is what's charged either way.
//
// Failure mode: network error, non-2xx, or bad JSON → returns null.
// The caller should treat null as "no server confirmation available"
// and either proceed with the client total (current behaviour) or
// block checkout, depending on threat model. Today we proceed so a
// transient outage doesn't brick checkout.
// ─────────────────────────────────────────────────────────────────────

export const SERVER_QUOTE_CACHE_MS = 5000;
export const SERVER_QUOTE_TOAST_TOLERANCE_USD = 0.01;

interface ServerQuoteCacheEntry {
  at: number;
  total: number;
}

const serverQuoteCache = new Map<string, ServerQuoteCacheEntry>();

export interface FetchServerQuoteArgs {
  apiUrl: string;
  missionId?: string | null;
  respondentCount?: number;
  questions?: Question[];
  targeting?: TargetingConfig;
  promoCode?: string | null;
  /** Supabase access token — included as Bearer so RLS can scope mission lookups. */
  accessToken?: string | null;
}

export interface ServerQuoteResult {
  total: number;
  actualRate?: number;
  /** Human-readable line items from the server — safe to render. */
  breakdown?: Array<{ label: string; amount: number }>;
  /** Ms since epoch when this value was computed (hit or miss). */
  fetchedAt: number;
  /** True when served from cache rather than a fresh network call. */
  cached: boolean;
}

/**
 * Build a stable cache key from the request shape. We stringify-hash
 * targeting so swapping a filter invalidates the entry immediately —
 * otherwise a user could click VETT IT, change targeting, and re-open
 * within 5s and see the stale quote.
 */
function quoteCacheKey(args: FetchServerQuoteArgs): string {
  const t = args.targeting ? JSON.stringify(args.targeting) : '';
  return JSON.stringify({
    m: args.missionId ?? null,
    r: args.respondentCount ?? null,
    q: Array.isArray(args.questions) ? args.questions.length : null,
    t,
    p: args.promoCode ?? null,
  });
}

export async function fetchServerQuote(
  args: FetchServerQuoteArgs,
): Promise<ServerQuoteResult | null> {
  const key = quoteCacheKey(args);
  const now = Date.now();
  const hit = serverQuoteCache.get(key);
  if (hit && now - hit.at < SERVER_QUOTE_CACHE_MS) {
    return { total: hit.total, fetchedAt: hit.at, cached: true };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (args.accessToken) {
    headers.Authorization = `Bearer ${args.accessToken}`;
  }

  // Prefer missionId when available — the server then loads targeting
  // and question count from the row itself, which is more trustworthy
  // than whatever the client sends. Free-form shape is the fallback.
  const body: Record<string, unknown> = args.missionId
    ? { missionId: args.missionId, promoCode: args.promoCode ?? undefined }
    : {
        respondentCount: args.respondentCount,
        targetingConfig: args.targeting,
        questions: args.questions,
        promoCode: args.promoCode ?? undefined,
      };

  try {
    const res = await fetch(`${args.apiUrl}/api/pricing/quote`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[fetchServerQuote] ${res.status} ${res.statusText}`);
      return null;
    }
    const json = (await res.json()) as {
      total?: unknown;
      actualRate?: unknown;
      breakdown?: unknown;
    };
    const total = typeof json.total === 'number' ? json.total : NaN;
    if (!Number.isFinite(total)) {
      console.warn('[fetchServerQuote] malformed response', json);
      return null;
    }
    serverQuoteCache.set(key, { at: now, total });
    return {
      total,
      actualRate:
        typeof json.actualRate === 'number' ? json.actualRate : undefined,
      breakdown: Array.isArray(json.breakdown)
        ? (json.breakdown as Array<{ label: string; amount: number }>)
        : undefined,
      fetchedAt: now,
      cached: false,
    };
  } catch (err) {
    console.warn('[fetchServerQuote] network error', err);
    return null;
  }
}

/** Test-only: blow away the server-quote cache between assertions. */
export function _clearServerQuoteCache() {
  serverQuoteCache.clear();
}

// ───────────────────────────────────────────────────────────────────
// Pass 27 — Brand Lift uplift tiers (market + channel)
// ───────────────────────────────────────────────────────────────────

export const MARKET_UPLIFT_TIERS = [
  { min: 1,  max: 1,        name: 'single_market',  upliftUSD: 0   },
  { min: 2,  max: 3,        name: 'small_multi',    upliftUSD: 10  },
  { min: 4,  max: 7,        name: 'regional',       upliftUSD: 25  },
  { min: 8,  max: 15,       name: 'multi_regional', upliftUSD: 50  },
  { min: 16, max: Infinity, name: 'global',         upliftUSD: 100 },
] as const;

export const CHANNEL_UPLIFT_TIERS = [
  { min: 1,   max: 10,       name: 'starter',    upliftUSD: 0  },
  { min: 11,  max: 25,       name: 'standard',   upliftUSD: 10 },
  { min: 26,  max: 50,       name: 'plus',       upliftUSD: 20 },
  { min: 51,  max: 100,      name: 'pro',        upliftUSD: 35 },
  { min: 101, max: Infinity, name: 'enterprise', upliftUSD: 50 },
] as const;

export function calculateMarketUplift(marketCount: number): number {
  const c = Math.max(0, Math.floor(marketCount));
  if (c === 0) return 0;
  return MARKET_UPLIFT_TIERS.find(t => c >= t.min && c <= t.max)?.upliftUSD ?? 0;
}

export function calculateChannelUplift(channelCount: number): number {
  const c = Math.max(0, Math.floor(channelCount));
  if (c === 0) return 0;
  return CHANNEL_UPLIFT_TIERS.find(t => c >= t.min && c <= t.max)?.upliftUSD ?? 0;
}

export function calculateBrandLiftMissionPrice(input: {
  respondentBaseUSD: number;
  marketCount: number;
  channelCount: number;
}): {
  base: number;
  marketUplift: number;
  channelUplift: number;
  total: number;
  breakdown: string;
} {
  const base = Math.max(0, Number(input.respondentBaseUSD) || 0);
  const marketUplift = calculateMarketUplift(input.marketCount);
  const channelUplift = calculateChannelUplift(input.channelCount);
  const total = base + marketUplift + channelUplift;
  const parts: string[] = [`$${base.toFixed(2)} base`];
  if (input.marketCount > 0) parts.push(`+$${marketUplift.toFixed(2)} markets (${input.marketCount})`);
  if (input.channelCount > 0) parts.push(`+$${channelUplift.toFixed(2)} channels (${input.channelCount})`);
  return { base, marketUplift, channelUplift, total, breakdown: parts.join(' '), };
}
