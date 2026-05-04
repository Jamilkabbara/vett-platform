import { CREATIVE_ATTENTION_TIERS, CA_MIN_RESPONDENTS } from '../../utils/pricingEngine';

/**
 * Pass 25 Phase 0.3 — respondent slider for Creative Attention.
 *
 * CA used to charge a flat per-asset price ($19 image / $39 video) for
 * exactly 1 respondent, which gave no statistical signal. This slider
 * snaps to the 5-tier ladder (10/25/50/100/250) and surfaces the package
 * price so the buyer always sees what they're paying. Floor of 10 is
 * enforced by the slider min and by the backend (returns 400 below 10).
 *
 * Visual styling reuses the brand tokens (--bg, --bg2, --lime, --t1/2/3).
 * No new color/typography/spacing tokens.
 */

interface Props {
  respondentCount: number;
  onChange: (n: number) => void;
}

export function CreativeAttentionTierSlider({ respondentCount, onChange }: Props) {
  const anchors = CREATIVE_ATTENTION_TIERS.map(t => t.anchorCount);

  const tier = CREATIVE_ATTENTION_TIERS.find(t => respondentCount <= t.maxCount)
            ?? CREATIVE_ATTENTION_TIERS[CREATIVE_ATTENTION_TIERS.length - 1];

  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--t3)]">Sample size</p>
          <p className="text-2xl font-bold text-[var(--t1)] mt-1">
            {respondentCount} respondent{respondentCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-[var(--t3)]">{tier.name} tier</p>
          <p className="text-2xl font-bold text-[var(--lime)] mt-1">${tier.packagePrice}</p>
          <p className="text-[11px] text-[var(--t3)] mt-0.5">≈ ${tier.ratePerResp.toFixed(2)} per respondent</p>
        </div>
      </div>

      <div>
        <input
          type="range"
          min={CA_MIN_RESPONDENTS}
          max={250}
          step={5}
          value={Math.min(250, Math.max(CA_MIN_RESPONDENTS, respondentCount))}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-[var(--lime)]"
          aria-label="Number of respondents"
        />
        <div className="flex justify-between text-[10px] text-[var(--t3)] mt-1">
          {anchors.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`px-2 py-1 rounded hover:text-[var(--lime)] ${
                respondentCount === n ? 'text-[var(--lime)] font-semibold' : ''
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--t3)] leading-relaxed">
        Minimum 10 respondents — anything less doesn't give a usable signal.
      </p>
    </div>
  );
}

export default CreativeAttentionTierSlider;
