/**
 * PricingLadders - ports the mock's `.ptabs` / `.pladder` / `.pcta` block.
 *
 * PRICING COPY IS **NOT** TAKEN FROM THE MOCK. The mock's ladders are stale
 * on all three tabs (see the PR body's "Mock vs live pricing" table); the
 * numbers below are the corrected live ladders, mirroring the same constant
 * that the current LandingPage renders:
 *
 *   Validate           $9 / $35 / $99 / $300 / $900 / custom  (per respondent)
 *   Brand Lift         $99 / $300 / $600 / $1,500             (statistical n)
 *   Creative Attention respondent BRACKETS charged flat per bracket:
 *                      10 -> $19, 11-25 -> $39, 26-50 -> $69,
 *                      51-100 -> $129, 101+ -> $299
 */
import { useState } from 'react';
import { V2Button } from './primitives';

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

const LADDERS: Ladder[] = [
  {
    id: 'validate',
    label: 'VALIDATE',
    desc: 'Product, naming, and message validation. Pay per respondent, up to 1,250 per mission.',
    cta: 'START A VALIDATE MISSION',
    tiers: [
      { name: 'Sniff Test',  price: '$9',     meta: '5 personas · $1.80/resp' },
      { name: 'Validate',    price: '$35',    meta: '10 personas · $3.50/resp' },
      { name: 'Confidence',  price: '$99',    meta: '50 personas · $1.98/resp' },
      { name: 'Deep Dive',   price: '$300',   meta: '250 personas · $1.20/resp' },
      { name: 'Scale',       price: '$900',   meta: '1,000 personas · $0.90/resp' },
      { name: 'Enterprise',  price: 'Talk to us', meta: 'Beyond 1,250 personas · custom quote' },
    ],
  },
  {
    id: 'brand_lift',
    label: 'BRAND LIFT',
    desc: 'Awareness, recall, sentiment, and intent. Statistical sample sizes only.',
    cta: 'START A BRAND LIFT STUDY',
    tiers: [
      { name: 'Pulse',      price: '$99',    meta: '50 personas · $1.98/resp' },
      { name: 'Tracker',    price: '$300',   meta: '200 personas · $1.50/resp' },
      { name: 'Wave',       price: '$600',   meta: '500 personas · $1.20/resp' },
      { name: 'Enterprise', price: '$1,500', meta: '2,000 personas · $0.75/resp' },
    ],
  },
  {
    id: 'creative_attention',
    label: 'CREATIVE ATTENTION',
    // The mock says "Per-asset" here. It is not: Creative Attention is a
    // respondent-bracket ladder charged flat per bracket.
    desc: 'Frame-by-frame attention, emotion, and message clarity. Charged flat per respondent bracket.',
    cta: 'START A CREATIVE ATTENTION ANALYSIS',
    tiers: [
      { name: 'Sniff Test',   price: '$19',  meta: '10 personas' },
      { name: 'Validate',     price: '$39',  meta: '11-25 personas' },
      { name: 'Confidence',   price: '$69',  meta: '26-50 personas' },
      { name: 'Deep Dive',    price: '$129', meta: '51-100 personas' },
      { name: 'Deep Dive XL', price: '$299', meta: '101+ personas' },
    ],
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
