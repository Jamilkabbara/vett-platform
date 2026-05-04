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
  total: number;
  filterCount: number;
}

// Pass 23 Bug 23.PRICING + 23.51 — goal-type-keyed tier ladders.
// Mirrors backend pricingEngine.js exactly.
//
// Default ladder (validate / naming_messaging / marketing):
//   Sniff Test  5    $9    $1.80/resp   Validate   10   $35   $3.50/resp
//   Confidence  50   $99   $1.98/resp   Deep Dive  250  $299  $1.20/resp
//   Scale       1000 $899  $0.90/resp   Enterprise 5000 $1990 $0.40/resp
//
// Brand Lift (statistical-sample sizes only — no Sniff/Validate):
//   Pulse 50 $99 · Tracker 200 $299 · Wave 500 $599 · Enterprise 2000 $1499
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

export const VOLUME_TIERS = [
  { id: 'sniff_test', name: 'Sniff Test', anchorCount: 5,    maxCount: 5,    ratePerResp: 1.80, packagePrice: 9    },
  { id: 'validate',   name: 'Validate',   anchorCount: 10,   maxCount: 10,   ratePerResp: 3.50, packagePrice: 35   },
  { id: 'confidence', name: 'Confidence', anchorCount: 50,   maxCount: 50,   ratePerResp: 1.98, packagePrice: 99   },
  { id: 'deep_dive',  name: 'Deep Dive',  anchorCount: 250,  maxCount: 250,  ratePerResp: 1.20, packagePrice: 299  },
  { id: 'scale',      name: 'Scale',      anchorCount: 1000, maxCount: 1000, ratePerResp: 0.90, packagePrice: 899  },
  { id: 'enterprise', name: 'Enterprise', anchorCount: 5000, maxCount: Number.POSITIVE_INFINITY, ratePerResp: 0.40, packagePrice: 1990 },
] as const;

export const BRAND_LIFT_TIERS = [
  { id: 'pulse',      name: 'Pulse',      anchorCount: 50,   maxCount: 50,   ratePerResp: 1.98, packagePrice: 99,   minRespondents: 50 },
  { id: 'tracker',    name: 'Tracker',    anchorCount: 200,  maxCount: 200,  ratePerResp: 1.50, packagePrice: 299,  minRespondents: 50 },
  { id: 'wave',       name: 'Wave',       anchorCount: 500,  maxCount: 500,  ratePerResp: 1.20, packagePrice: 599,  minRespondents: 50 },
  { id: 'enterprise', name: 'Enterprise', anchorCount: 2000, maxCount: Number.POSITIVE_INFINITY, ratePerResp: 0.75, packagePrice: 1499, minRespondents: 50 },
] as const;

// Pass 25 Phase 0.3 — Creative Attention now mirrors the volume ladder
// shape (anchorCount + maxCount + ratePerResp + packagePrice). Old per-
// asset table is replaced; min respondent count enforced by setup flow
// + backend validation.
export const CREATIVE_ATTENTION_TIERS = [
  { id: 'sniff_test',   name: 'Sniff Test',   anchorCount: 10,  maxCount: 10,  ratePerResp: 1.90, packagePrice: 19  },
  { id: 'validate',     name: 'Validate',     anchorCount: 25,  maxCount: 25,  ratePerResp: 1.56, packagePrice: 39  },
  { id: 'confidence',   name: 'Confidence',   anchorCount: 50,  maxCount: 50,  ratePerResp: 1.38, packagePrice: 69  },
  { id: 'deep_dive',    name: 'Deep Dive',    anchorCount: 100, maxCount: 100, ratePerResp: 1.29, packagePrice: 129 },
  { id: 'deep_dive_xl', name: 'Deep Dive XL', anchorCount: 250, maxCount: Number.POSITIVE_INFINITY, ratePerResp: 1.20, packagePrice: 299 },
] as const;

export type VolumeTier = (typeof VOLUME_TIERS)[number];
export type BrandLiftTier = (typeof BRAND_LIFT_TIERS)[number];
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
  const base = respondentCount * basePerRespondent;

  const additionalQuestions = Math.max(0, questions.length - 5);
  const questionSurcharge = additionalQuestions * 20;

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

  return {
    base: Math.round(base),
    questionSurcharge,
    targetingSurcharge: Math.round(targetingSurcharge),
    screeningSurcharge: Math.round(screeningSurcharge),
    total: Math.round(total),
    filterCount,
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
