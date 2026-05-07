/**
 * Pass 32 X2 — single source of truth for the delivery-unit label
 * shown on mission cards, receipts, results-page headers, etc.
 *
 * Backed by the `missions.delivery_unit` column added in Pass 32 X2
 * backend (BEFORE-INSERT trigger keeps it tied to goal_type so we
 * never need to compute it client-side from goal_type).
 *
 * Falls back to goal_type-based detection when delivery_unit is
 * missing (older missions before the backfill, or in-flight UI
 * state where the column hasn't been re-fetched yet).
 */

export type DeliveryUnit = 'respondent' | 'creative_asset';

export function deliveryUnit(mission: {
  delivery_unit?: string | null;
  goal_type?: string | null;
}): DeliveryUnit {
  if (mission.delivery_unit === 'creative_asset') return 'creative_asset';
  if (mission.delivery_unit === 'respondent') return 'respondent';
  // Fallback for missions that pre-date the backfill or partial fetches.
  return mission.goal_type === 'creative_attention'
    ? 'creative_asset'
    : 'respondent';
}

/**
 * Human-readable count label. Pluralizes correctly, swaps the noun
 * per delivery_unit so Creative Attention reads "1 creative analyzed"
 * instead of "1 respondent".
 */
export function formatDeliveryCount(
  count: number,
  mission: { delivery_unit?: string | null; goal_type?: string | null },
): string {
  const unit = deliveryUnit(mission);
  const n = count.toLocaleString();
  if (unit === 'creative_asset') {
    return count === 1 ? `${n} creative analyzed` : `${n} creatives analyzed`;
  }
  return count === 1 ? `${n} respondent` : `${n} respondents`;
}

/**
 * Plural noun only (for cases where the count is rendered separately).
 * "respondents" or "creatives analyzed".
 */
export function deliveryNoun(
  mission: { delivery_unit?: string | null; goal_type?: string | null },
  plural: boolean = true,
): string {
  const unit = deliveryUnit(mission);
  if (unit === 'creative_asset') {
    return plural ? 'creatives analyzed' : 'creative analyzed';
  }
  return plural ? 'respondents' : 'respondent';
}
