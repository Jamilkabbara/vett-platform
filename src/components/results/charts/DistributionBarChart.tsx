/**
 * Pass 42 C1 — DistributionBarChart. Extracted from
 * src/pages/ResultsPage.tsx line 1262 block.
 *
 * Horizontal Recharts BarChart for single_choice / multi_select
 * questions with many options (>5). Each option becomes a row,
 * sorted by percentage descending.
 */
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList,
} from 'recharts';
import { COLORS } from './chartColors';
import { CustomPieTooltip } from './CustomPieTooltip';
import type { QuestionDistribution } from '../../../hooks/useChartData';

interface Props {
  data: QuestionDistribution;
}

export function DistributionBarChart({ data }: Props) {
  if (!data || !Array.isArray(data.options) || !Array.isArray(data.counts)) {
    return null;
  }
  // Sort by count descending for readability.
  const rows = data.options
    .map((label, i) => ({
      name: label,
      value: data.counts?.[i] ?? 0,
      pct: data.percentages?.[i] ?? 0,
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  if (rows.length === 0) return null;

  // Dynamic height: ~32px per row, with a sensible floor.
  const chartHeight = Math.max(140, rows.length * 32 + 24);

  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-5">
      <p className="text-xs font-display font-bold text-t2 mb-3 line-clamp-2 min-h-[2.5em]">
        {data.question}
      </p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ left: 4, right: 24, top: 8, bottom: 8 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {rows.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
            <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v}%`} style={{ fill: '#cbd5e1', fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
