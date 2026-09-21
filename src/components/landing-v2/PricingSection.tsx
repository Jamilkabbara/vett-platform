/**
 * Pricing - a respondent slider drives the headline price, highlights the
 * matching ladder card, and a bar chart shows the real rate per respondent at
 * each of the seven self-serve tiers.
 *
 * Every number comes from ./landingPrices, which calls the app's own pricing
 * function. The initial render (slider at the Validate anchor) is the same on
 * the server and in the browser, so the prerendered page carries real prices.
 */
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { DemoCard, Label, V2Button } from './primitives';
import {
  BRAND_LIFT_FROM_USD,
  CA_IMAGE_USD,
  CA_VIDEO_USD,
  LADDER,
  SLIDER_DEFAULT,
  SLIDER_MAX,
  SLIDER_MIN,
  SLIDER_STEP,
  quote,
  rungIndexFor,
  usd,
} from './landingPrices';
import { LP_COLORS, lpAlpha } from '../../styles/landingTokens.mjs';

const TICKS = [SLIDER_MIN, 250, 500, 750, SLIDER_MAX];

export function PricingSection({ onCta }: { onCta: (goalId: string) => void }) {
  const [n, setN] = useState<number>(SLIDER_DEFAULT);
  const price = quote(n);
  const hot = rungIndexFor(n);
  const sliderId = useId();

  return (
    <div className="grid grid-cols-1 min-[980px]:grid-cols-2 gap-[34px] min-[980px]:gap-14 items-start">
      <DemoCard>
        <div className="flex justify-between items-baseline gap-4">
          <output
            htmlFor={sliderId}
            data-price-for={n}
            aria-live="polite"
            className="font-lp-head font-extrabold text-[clamp(46px,7vw,76px)] tracking-[-0.035em] leading-none text-lp-lime"
          >
            {usd(price)}
          </output>
          <div className="text-right">
            <div className="font-lp-head font-extrabold text-[26px]">{n.toLocaleString('en-US')}</div>
            <Label className="block mt-1">respondents</Label>
          </div>
        </div>

        <label htmlFor={sliderId} className="sr-only">Respondents</label>
        <input
          id={sliderId}
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-full h-7 mt-[18px] mb-1 accent-lp-lime cursor-pointer"
        />
        <div className="flex justify-between text-[11.5px] text-lp-muted" aria-hidden>
          {TICKS.map((t) => <span key={t}>{t.toLocaleString('en-US')}</span>)}
        </div>

        <RateBars hot={hot} />
        <p className="text-[13.5px] text-lp-body mt-2.5">
          {usd(price)} for {n.toLocaleString('en-US')} respondents, before paid targeting or extra questions.
          The {LADDER[hot].name} rate is {LADDER[hot].rateLabel} per respondent.
        </p>
      </DemoCard>

      <div>
        <Label>Validate ladder</Label>
        <div className="grid grid-cols-2 min-[600px]:grid-cols-4 gap-3.5 mt-[18px]">
          {LADDER.map((r, i) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={i === hot}
              onClick={() => setN(r.anchor)}
              className={[
                'rounded-[18px] border px-[14px] py-[20px] text-center transition-all duration-200 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-lime/60',
                i === hot
                  ? 'border-lp-lime bg-lp-lime/[0.13] shadow-lp-card-on'
                  : 'border-white/[0.07] bg-white/[0.025] hover:border-lp-lime/[0.22] hover:-translate-y-[3px]',
              ].join(' ')}
            >
              <div className={`font-lp-head font-bold text-[14px] ${i === hot ? 'text-lp-lime' : 'text-lp-body'}`}>
                {r.name}
              </div>
              <div data-price-for={r.anchor} className="font-lp-head font-extrabold text-[28px] tracking-[-0.03em] mt-2">{usd(r.price)}</div>
              <div className="text-[11.5px] text-lp-muted mt-1.5">
                {r.anchor.toLocaleString('en-US')} personas
              </div>
            </button>
          ))}
          <Link
            to="/contact"
            className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] px-[14px] py-[20px] text-center transition-all duration-200 hover:border-lp-lime/[0.22] hover:-translate-y-[3px]"
          >
            <div className="font-lp-head font-bold text-[14px] text-lp-body">Managed</div>
            <div className="font-lp-head font-extrabold text-[20px] mt-3.5">Talk to us</div>
            <div className="text-[11.5px] text-lp-muted mt-1.5">
              Beyond {SLIDER_MAX.toLocaleString('en-US')}
            </div>
          </Link>
        </div>

        <div className="mt-6 pt-5 border-t border-white/[0.07] text-[15px]">
          <PriceRow id="ca-image" label="Creative Attention, image" value={usd(CA_IMAGE_USD)} />
          <PriceRow id="ca-video" label="Creative Attention, video" value={usd(CA_VIDEO_USD)} />
          <PriceRow id="brand-lift-from" label="Brand Lift, from" value={usd(BRAND_LIFT_FROM_USD)} />
        </div>

        <V2Button variant="indigo" size="lg" className="mt-6" onClick={() => onCta('validate')}>
          Start a validate mission &rarr;
        </V2Button>
      </div>
    </div>
  );
}

function PriceRow({ label, value, id }: { label: string; value: string; id: string }) {
  return (
    <div className="flex justify-between py-2.5">
      <span className="font-lp-head font-bold">{label}</span>
      <span data-price-row={id} className="font-lp-head font-bold text-lp-lime">{value}</span>
    </div>
  );
}

/**
 * Rate per respondent at each rung. Heights are scaled between the cheapest
 * and dearest rate so the fall is visible; every label is the real rate.
 */
function RateBars({ hot }: { hot: number }) {
  const W = 560;
  const H = 180;
  const base = 158;
  const gap = 10;
  const bw = (W - gap * (LADDER.length - 1)) / LADDER.length;
  const rates = LADDER.map((r) => r.rate);
  const max = Math.max(...rates);
  const min = Math.min(...rates);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto block mt-4"
      role="img"
      aria-label={`Rate per respondent by tier: ${LADDER.map((r) => `${r.name} ${r.rateLabel}`).join(', ')}`}
    >
      {LADDER.map((r, i) => {
        const h = (0.28 + 0.72 * ((r.rate - min) / (max - min || 1))) * (base - 22);
        const x = i * (bw + gap);
        const on = i === hot;
        return (
          <g key={r.id}>
            <rect
              x={x}
              y={base - h}
              width={bw}
              height={h}
              rx={7}
              fill={on ? LP_COLORS.lime : lpAlpha('chartMint', 0.3)}
              style={{ transition: 'fill 0.2s' }}
            />
            <text
              x={x + bw / 2}
              y={base - h - 7}
              textAnchor="middle"
              fontSize={11.5}
              fontWeight={on ? 700 : 400}
              fill={on ? LP_COLORS.lime : LP_COLORS.muted}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {r.rateLabel}
            </text>
            <text
              x={x + bw / 2}
              y={H - 4}
              textAnchor="middle"
              fontSize={11}
              fill={LP_COLORS.muted}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {r.anchor >= 1000 ? `${(r.anchor / 1000).toLocaleString('en-US')}k` : r.anchor}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
