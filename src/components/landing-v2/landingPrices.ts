/**
 * Every price on the landing page, computed by the app's own pricing function.
 *
 * Nothing here is typed in. `quote(n)` is `calculatePricing` - the function the
 * setup page prices a mission with, including the rule that a study is never
 * cheaper than the top of the tier below it and the whole-dollar rounding
 * checkout applies - for n respondents with no paid targeting and no extra
 * questions. The redesign prototype priced n x rate and showed $121 for 101
 * respondents; checkout charges $149.
 *
 * scripts/verify-landing-prices.mjs checks the prerendered page against the
 * ladder, and scripts/check-landing-quotes.mjs against the live quote API.
 */
import {
  calculatePricing,
  VOLUME_TIERS,
  MAX_SELF_SERVE_RESPONDENTS,
  SELLABLE_RESPONDENT_COUNTS,
  snapToPublishedCount,
  STARTING_PRICE_BRAND_LIFT_USD,
  creativeAttentionPrice,
  formatRatePerResp,
  getVolumeTier,
} from '../../utils/pricingEngine';
import type { TargetingConfig } from '../dashboard/TargetingEngine';

const NO_TARGETING: TargetingConfig = {
  geography: { countries: [], cities: [], cityEnabled: false },
  demographics: { ageRanges: [], genders: [], education: [], marital: [], parental: [], employment: [] },
  professional: { industries: [], roles: [], companySizes: [] },
  financials: { incomeRanges: [] },
  behaviors: [],
  technographics: { devices: [] },
};

/**
 * The respondent counts the public slider offers: the ladder's own anchors,
 * the same list the setup panel sells.
 *
 * -- Why the public slider snaps too, 2026-11 -------------------------------
 *
 * Only these seven counts can be bought - see SELLABLE_RESPONDENT_COUNTS in
 * utils/pricingEngine for the derivation. This slider stepped by 5 from 5 to
 * 1,250, so 243 of its 250 positions were counts setup will no longer sell. A
 * visitor who priced a 120-respondent study here was moved to 100 or 250 on
 * the setup page without being told.
 *
 * Nothing published here was wrong. quote() IS the engine, so the price shown
 * at 120 was the price checkout charges. What was wrong is that the page
 * offered a choice the rest of the funnel does not honour.
 *
 * NO PRICE MOVES. Every count still on the slider quotes exactly what it
 * quoted before; the positions that no longer exist are the ones that could
 * not be carried through to a mission.
 */
export const SLIDER_COUNTS: readonly number[] = SELLABLE_RESPONDENT_COUNTS;

/**
 * The slider's own domain is an INDEX over SLIDER_COUNTS, not a respondent
 * count with a snap on change.
 *
 * The anchors are not evenly spaced, so a count-domain slider can only accept
 * an unsellable count and then correct it. That reads fine under a mouse drag
 * and badly everywhere else: an arrow key moves one step - 5 - which snaps
 * straight back to the anchor it started from, leaving the control dead for
 * keyboard users. One index step is one rung for mouse, touch and keyboard
 * alike, and an unsellable count has no position to land on at all.
 *
 * The control therefore reports a position, so the input carries an
 * aria-valuetext with the real respondent count.
 */
export const SLIDER_INDEX_MIN = 0;
export const SLIDER_INDEX_MAX = SLIDER_COUNTS.length - 1;
export const SLIDER_INDEX_STEP = 1;

/** The respondent count at a slider position. */
export function countAt(i: number): number {
  const clamped = Math.min(
    SLIDER_INDEX_MAX,
    Math.max(SLIDER_INDEX_MIN, Math.round(Number(i) || 0)),
  );
  return SLIDER_COUNTS[clamped];
}

/**
 * The slider position for a respondent count. Routed through the engine's own
 * snapToPublishedCount, so a count that is not itself on the list - a ladder
 * card whose anchor moved, a count carried in from elsewhere - resolves to a
 * real position instead of -1.
 */
export function indexForCount(n: number): number {
  const i = SLIDER_COUNTS.indexOf(snapToPublishedCount(n));
  return i < 0 ? SLIDER_INDEX_MAX : i;
}

/** The count the page opens on, and the one the prerendered headline shows. */
export const SLIDER_DEFAULT_COUNT = VOLUME_TIERS[1].anchorCount;
export const SLIDER_DEFAULT_INDEX = indexForCount(SLIDER_DEFAULT_COUNT);

/** The self-serve ceiling, for the card that hands bigger studies to sales. */
export const SELF_SERVE_CAP = MAX_SELF_SERVE_RESPONDENTS;

/** What checkout charges for n respondents, before targeting and extra questions. */
export function quote(n: number): number {
  return calculatePricing(n, [], NO_TARGETING).total;
}

export interface LadderRung {
  id: string;
  name: string;
  anchor: number;
  price: number;
  rate: number;
  rateLabel: string;
}

/** The seven self-serve rungs, each priced at its anchor. */
export const LADDER: LadderRung[] = VOLUME_TIERS
  .filter((t) => t.anchorCount <= MAX_SELF_SERVE_RESPONDENTS)
  .map((t) => ({
    id: t.id,
    name: t.name,
    anchor: t.anchorCount,
    price: quote(t.anchorCount),
    rate: t.ratePerResp,
    rateLabel: `$${formatRatePerResp(t.ratePerResp)}`,
  }));

/** Index of the rung whose bracket contains n. */
export function rungIndexFor(n: number): number {
  const tier = getVolumeTier(n);
  const i = LADDER.findIndex((r) => r.id === tier.id);
  return i < 0 ? LADDER.length - 1 : i;
}

export const CA_IMAGE_USD = creativeAttentionPrice('image');
export const CA_VIDEO_USD = creativeAttentionPrice('video');
export const BRAND_LIFT_FROM_USD = STARTING_PRICE_BRAND_LIFT_USD;

export const usd = (n: number) => `$${n.toLocaleString('en-US')}`;
