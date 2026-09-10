/**
 * PricingLadders - ports the mock's `.ptabs` / `.pladder` / `.pcta` block.
 *
 * PRICING COPY IS DERIVED, NOT WRITTEN. Every tier below is computed from the
 * ladders in utils/pricingEngine.ts, which mirror the backend engine that
 * Stripe charges from.
 *
 * It used to be a hand-typed table, and it was the fourth copy of the ladder
 * in the codebase. The 2026-09 reprice moved five of the six default-ladder
 * anchors; a hand-typed table would have kept publishing "$35 / 10 personas ·
 * $3.50/resp" on the landing page while checkout charged $15.60. That is the
 * same class of defect as the $299-published-vs-$300-charged drift the tiers
 * endpoint had, and the fix is the same: one expression, not two copies.
 *
 * Two ladder-specific rules are applied here rather than in the engine, because
 * they are presentation:
 *
 *   - Brackets below a goal's methodology floor are dropped. Brand Lift's Pulse
 *     bracket anchors at 50 respondents and the floor is 100, so Pulse is
 *     unbuyable and publishing "$99" for it advertises a study checkout
 *     refuses. The published Brand Lift entry price is Tracker.
 *   - The default ladder's top bracket is open-ended, so anything beyond the
 *     self-serve cap renders as "Talk to us" rather than a number.
 */
import { useState } from 'react';
import { V2Button } from './primitives';
import {
  VOLUME_TIERS,
  BRAND_LIFT_TIERS,
  CREATIVE_ATTENTION_TIERS,
  MAX_SELF_SERVE_RESPONDENTS,
  formatRatePerResp,
  respondentLadderBase,
  type AnyTier,
} from '../../utils/pricingEngine';

interface Tier {
  name: string;
  price: string;
  meta: string;
}

interface Ladder {
  id: string;
  label: string;
  desc: string;
  cta: string;
  tiers: Tier[];
}

const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

/**
 * A respondent-ladder bracket rendered as "price" + "N personas · $rate/resp".
 *
 * Brackets outside the SELLABLE range are dropped at both ends, because
 * publishing a price checkout refuses is the same defect as publishing a stale
 * one. Below: a bracket under the goal's methodology floor (Brand Lift's Pulse
 * anchors at 50, the floor is 100). Above: a bracket anchored past the
 * self-serve cap (Brand Lift's Enterprise anchors at 2,000, the cap is 1,250).
 * Everything past the cap becomes the one "Talk to us" row.
 */
function respondentTiers(ladder: readonly AnyTier[], minRespondents = 0): Tier[] {
  return [
    ...ladder
      .filter((t) => t.anchorCount >= minRespondents && t.anchorCount <= MAX_SELF_SERVE_RESPONDENTS)
      .map((t) => ({
        name: t.name,
        price: usd(respondentLadderBase(ladder, t, t.anchorCount, t.ratePerResp)),
        meta: `${t.anchorCount.toLocaleString()} personas · $${formatRatePerResp(t.ratePerResp)}/resp`,
      })),
    {
      name: 'Managed',
      price: 'Talk to us',
      meta: `Beyond ${MAX_SELF_SERVE_RESPONDENTS.toLocaleString()} personas · custom quote`,
    },
  ];
}

/** Creative Attention charges a flat package per bracket, so no rate is shown. */
function flatTiers(ladder: readonly AnyTier[]): Tier[] {
  return ladder.map((t, i) => {
    const from = i === 0 ? t.anchorCount : ladder[i - 1].anchorCount + 1;
    const to = Number.isFinite(t.maxCount) ? `${from}-${t.anchorCount}` : `${from}+`;
    return {
      name: t.name,
      price: usd(t.packagePrice),
      meta: `${i === 0 ? `${t.anchorCount}` : to} personas`,
    };
  });
}

const LADDERS: Ladder[] = [
  {
    id: 'validate',
    label: 'VALIDATE',
    desc: `Product, naming, and message validation. Pay per respondent, up to ${MAX_SELF_SERVE_RESPONDENTS.toLocaleString()} per mission.`,
    cta: 'START A VALIDATE MISSION',
    tiers: respondentTiers(VOLUME_TIERS),
  },
  {
    id: 'brand_lift',
    label: 'BRAND LIFT',
    desc: 'Exposed and control cells measured side by side. Starts at 100 respondents, the point the split can carry a comparison.',
    cta: 'START A BRAND LIFT MISSION',
    // Pulse (anchor 50) is below the 100 floor and cannot be bought.
    tiers: respondentTiers(BRAND_LIFT_TIERS, 100),
  },
  {
    id: 'creative_attention',
    label: 'CREATIVE ATTENTION',
    desc: 'Frame-by-frame attention analysis on your creative. Charged per bracket, not per respondent.',
    cta: 'START A CREATIVE ATTENTION MISSION',
    tiers: flatTiers(CREATIVE_ATTENTION_TIERS),
  },
];

export function PricingLadders({ onCta }: { onCta: (ladderId: string) => void }) {
  const [tab, setTab] = useState(0);
  const ladder = LADDERS[tab];

  return (
    <div>
      <div className="flex gap-2 justify-center mb-[18px] flex-wrap" role="tablist">
        {LADDERS.map((l, i) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={i === tab}
            onClick={() => setTab(i)}
            className={[
              "font-['Inter',system-ui,sans-serif] font-semibold text-[13px] tracking-[0.06em]",
              'rounded-full px-5 py-2.5 border transition-all duration-150',
              i === tab
                ? 'text-[#BEF264] bg-[rgba(190,242,100,0.13)] border-[rgba(190,242,100,0.22)]'
                : 'text-[#8B919C] bg-white/[0.025] border-white/[0.07] hover:text-[#F3F5EF]',
            ].join(' ')}
          >
            {l.label}
          </button>
        ))}
      </div>

      <p className="text-center text-[#8B919C] text-[14.5px] mb-[26px]">{ladder.desc}</p>

      <div className="grid grid-cols-1 min-[980px]:grid-cols-3 gap-4 max-w-[920px] mx-auto">
        {ladder.tiers.map((t, i) => (
          <div
            key={`${ladder.id}-${t.name}`}
            className="lv2-tier-in bg-white/[0.025] border border-white/[0.07] rounded-[18px] p-6 text-center transition-all duration-200 hover:border-[rgba(190,242,100,0.22)] hover:-translate-y-1"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="font-['Manrope',system-ui,sans-serif] font-bold text-[15px] text-[#8B919C]">
              {t.name}
            </div>
            <div className="font-['Manrope',system-ui,sans-serif] font-extrabold text-[42px] mt-2 mb-1">
              {t.price}
            </div>
            <div className="text-[12.5px] text-[#5C6470]">{t.meta}</div>
          </div>
        ))}
      </div>

      <div className="text-center mt-[30px]">
        <V2Button variant="indigo" size="lg" onClick={() => onCta(ladder.id)}>
          {ladder.cta} &rarr;
        </V2Button>
      </div>
    </div>
  );
}
