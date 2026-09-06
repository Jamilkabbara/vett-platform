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
 * The delivery noun ALONE, for call sites that render the count separately.
 * "respondents" / "respondent", or "creatives" / "creative".
 *
 * Deliberately a bare noun with no participle. It used to return
 * "creatives analyzed", which collided with every caller that appends its own
 * verb: the mission cards rendered "0 of 1 creatives analyzed delivered" and
 * "1 creatives analyzed requested, never launched". The noun supplies the
 * noun; the template supplies the grammar.
 *
 * Prefer deliveryNounFor(mission, count) so the number and the noun agree.
 */
export function deliveryNoun(
  mission: { delivery_unit?: string | null; goal_type?: string | null },
  plural: boolean = true,
): string {
  const unit = deliveryUnit(mission);
  if (unit === 'creative_asset') {
    return plural ? 'creatives' : 'creative';
  }
  return plural ? 'respondents' : 'respondent';
}

/**
 * The delivery noun agreed with `count`.
 *
 * Every call site formats "{n} {noun}", so the noun has to know n. Calling
 * deliveryNoun() with its default plural:true is what produced "1 creatives"
 * and "1 respondents" on every single-unit mission, which is most creative
 * attention missions.
 */
export function deliveryNounFor(
  mission: { delivery_unit?: string | null; goal_type?: string | null },
  count: number,
): string {
  return deliveryNoun(mission, Math.abs(Number(count)) !== 1);
}
