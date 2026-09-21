/**
 * The Creative Attention demo panel.
 *
 * Every number in it is INVENTED and the panel says so on screen: it shows the
 * shape of the output, not a measurement. The one real figure is the placement
 * norm the predicted hold time is scored against, which is TikTok's own
 * published Feed benchmark and is labelled as theirs, not ours.
 *
 * The price-sensitivity, NPS and brand-radar panels that used to live here
 * were removed with the sections that showed them.
 */
import { DemoCard } from './primitives';
import { useInView } from './hooks';
import { TIKTOK_FEED_NORM_SECONDS } from './landingStudy';
import { LP_COLORS, lpAlpha } from '../../styles/landingTokens.mjs';

const EMOTIONS: Array<[string, number, string]> = [
  ['Joy', 74, LP_COLORS.lime],
  ['Anticipation', 61, LP_COLORS.chartMint],
  ['Trust', 55, LP_COLORS.chartIndigo],
  ['Surprise', 38, LP_COLORS.chartAmber],
  ['Fear', 8, LP_COLORS.chartPink],
];

const HEAT = [88, 84, 80, 76, 70, 64, 72, 78, 66, 52, 40, 34, 46, 58, 70, 77];

function heatColor(v: number): string {
  if (v > 66) return lpAlpha('chartLime', v / 100);
  if (v > 46) return lpAlpha('chartAmber', v / 100 + 0.2);
  return lpAlpha('chartPink', 0.5 + (50 - v) / 100);
}

export function BarRow({
  label,
  pct,
  color,
  grown,
}: {
  label: string;
  pct: number;
  color: string;
  grown: boolean;
}) {
  return (
    <div className="grid grid-cols-[90px_1fr_44px] items-center gap-3.5 mb-3 text-[13.5px]">
      <span>{label}</span>
      <div className="h-2.5 rounded-md bg-lp-track overflow-hidden">
        <i
          className="block h-full rounded-md"
          style={{
            width: grown ? `${pct}%` : 0,
            background: color,
            transition: 'width 1.1s cubic-bezier(.22,1,.36,1)',
          }}
        />
      </div>
      <span className="font-lp-text font-bold text-right text-lp-body">{pct}%</span>
    </div>
  );
}

export function CreativeAttentionPanel() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);

  return (
    <DemoCard label="Emotion response, meal kit ad (30s)" innerRef={ref}>
      <div className="mb-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]">
        <span className="rounded-full px-2 py-[3px] font-semibold text-lp-chart-amber bg-lp-chart-amber/[0.13] border border-lp-chart-amber/[0.28]">
          Illustrative
        </span>
        <span className="text-lp-body">Example output, not a VETT measurement</span>
      </div>

      {EMOTIONS.map(([label, pct, color]) => (
        <BarRow key={label} label={label} pct={pct} color={color} grown={inView} />
      ))}

      <div className="text-[10.5px] tracking-[0.16em] uppercase text-lp-muted font-semibold mt-5 mb-2.5">
        Attention heatmap
      </div>
      <div className="flex gap-1 mb-2.5">
        {HEAT.map((v, i) => (
          <i key={i} className="flex-1 h-[34px] rounded" style={{ background: heatColor(v) }} />
        ))}
      </div>
      <div className="text-xs text-lp-muted">
        Frame-by-frame attention score (green = high attention &middot; red = low)
      </div>

      <div className="text-[13px] text-lp-body border-t border-white/[0.07] pt-3.5 mt-1.5">
        Predicted hold time is scored against the placement you are buying. The published
        TikTok Feed norm is{' '}
        <b className="font-lp-text text-lp-lime">{TIKTOK_FEED_NORM_SECONDS}s</b>,
        so anything under it is a creative that loses the viewer before the message lands.
      </div>
    </DemoCard>
  );
}
