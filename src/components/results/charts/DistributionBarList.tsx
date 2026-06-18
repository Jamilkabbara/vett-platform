/**
 * §F2 — adaptive distribution renderer for LONG-OPTION questions.
 *
 * A donut + Recharts legend (or the Recharts horizontal bar axis) truncates
 * sentence-length option labels with "…" — and exports have no hover to
 * recover the full text. This renders a plain horizontal bar LIST instead:
 * each row shows the FULL, wrapping label (never ellipsis), a proportional
 * bar, and the percentage. Used when option labels are long or when the
 * distribution is degenerate (e.g. 5 unique reasons each n=1 → 5 equal
 * slices), where readable labels matter more than slice geometry.
 */
import { COLORS } from './chartColors';
import type { QuestionDistribution } from '../../../hooks/useChartData';

interface Props {
  data: QuestionDistribution;
}

export function DistributionBarList({ data }: Props) {
  if (!data || !Array.isArray(data.options) || !Array.isArray(data.counts)) return null;
  const rows = data.options
    .map((label, i) => ({
      label: String(label),
      value: data.counts?.[i] ?? 0,
      pct: data.percentages?.[i] ?? 0,
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  if (rows.length === 0) return null;

  const maxPct = Math.max(...rows.map((r) => r.pct), 1);

  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-5">
      {/* full question — not clamped; this is the data the user needs to read */}
      <p className="text-xs font-display font-bold text-t2 mb-4">{data.question}</p>
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1.5">
            {/* full, wrapping label — never truncated, never ellipsis */}
            <span className="text-xs text-t2 leading-snug break-words">{r.label}</span>
            <span className="text-xs font-bold text-t1 tabular-nums justify-self-end whitespace-nowrap">
              {r.pct}% <span className="text-t3 font-normal">({r.value})</span>
            </span>
            <span className="col-span-2 h-2 rounded-full bg-bg3 overflow-hidden">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(r.pct / maxPct) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
