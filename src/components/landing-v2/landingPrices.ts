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

export const SLIDER_MIN = VOLUME_TIERS[0].anchorCount;
export const SLIDER_MAX = MAX_SELF_SERVE_RESPONDENTS;
export const SLIDER_STEP = 5;
export const SLIDER_DEFAULT = VOLUME_TIERS[1].anchorCount;

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
