/**
 * Pass 29 B3 — sample-size minimums per methodology.
 *
 * Each entry carries:
 *   - min: the floor below which output is directional only
 *   - best: the recommended target for stable cuts and sub-segments
 *   - label: what the user sees in the caption
 *   - perConcept: when true, multiply both min/best by the number of
 *     concepts / candidates the user is testing (for Sequential
 *     Monadic and Naming Monadic)
 *
 * Sources: standard market-research practitioner guidance
 * (Conjointly, Kantar, Sawtooth public methodology docs). VETT runs
 * synthetic respondents — these minimums apply equally to ensure
 * the methodology's statistical machinery has enough signal to
 * reliably classify (Kano), separate (MaxDiff), or curve-fit
 * (Van Westendorp / Gabor-Granger).
 */

export interface SampleSizeBound {
  min: number;
  best: number;
  label: string;
  perConcept?: boolean;
}

export const SAMPLE_SIZE_MINIMUMS: Record<string, SampleSizeBound> = {
  van_westendorp:           { min: 100, best: 200, label: 'Van Westendorp' },
  gabor_granger:            { min: 150, best: 300, label: 'Gabor-Granger' },
  // Pricing Research ships VW + GG combined — use the stricter GG bound.
  van_westendorp_plus_gabor_granger: {
    min: 150, best: 300, label: 'Van Westendorp + Gabor-Granger',
  },
  max_diff:                 { min: 150, best: 250, label: 'MaxDiff' },
  kano:                     { min: 100, best: 200, label: 'Kano' },
  // Roadmap ships MaxDiff + Kano combined — use the stricter MaxDiff bound.
  max_diff_plus_kano:       { min: 150, best: 250, label: 'MaxDiff + Kano' },
  nps:                      { min: 100, best: 200, label: 'NPS' },
  csat_ces:                 { min: 100, best: 200, label: 'CSAT / CES' },
  nps_csat_ces:             { min: 100, best: 200, label: 'NPS + CSAT + CES' },
  sequential_monadic:       { min: 80,  best: 150, label: 'Sequential Monadic', perConcept: true },
  brand_health_tracker:     { min: 200, best: 400, label: 'Brand Health Tracker' },
  brand_lift:               { min: 100, best: 250, label: 'Brand Lift Study' },
  segmentation:             { min: 300, best: 500, label: 'Segmentation' },
  naming_monadic:           { min: 80,  best: 150, label: 'Naming Monadic',     perConcept: true },
  monadic_plus_paired:      { min: 80,  best: 150, label: 'Monadic + Paired',   perConcept: true },
  concept_test:             { min: 100, best: 200, label: 'Concept Test' },
  ad_effectiveness:         { min: 100, best: 200, label: 'Ad Effectiveness' },
  combined_market_entry:    { min: 100, best: 200, label: 'Combined Market Entry' },
  creative_attention:       { min: 10,  best: 50,  label: 'Creative Attention' },
  churn_driver:             { min: 100, best: 200, label: 'Churn Driver Analysis' },
};

/**
 * Resolve the effective min/best for a methodology, accounting for
 * per-concept multipliers (e.g. Sequential Monadic with 3 concepts
 * has min = 240, best = 450).
 */
export function effectiveBound(
  methodology: string,
  conceptCount: number = 1,
): SampleSizeBound | null {
  const base = SAMPLE_SIZE_MINIMUMS[methodology];
  if (!base) return null;
  if (!base.perConcept || conceptCount <= 1) return base;
  return {
    ...base,
    min: base.min * conceptCount,
    best: base.best * conceptCount,
  };
}
