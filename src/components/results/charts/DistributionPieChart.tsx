/**
 * Pass 42 C1 — DistributionPieChart. Extracted from
 * src/pages/ResultsPage.tsx line 1159 block.
 *
 * Renders a Recharts PieChart for single_choice / multi_select
 * questions when the option count is small (≤5). Larger lists
 * delegate to DistributionBarChart.
 *
 * Defensive: if data is missing/malformed, renders an empty state
 * rather than crashing. The legacy ResultsPage inlined the same
 * rendering with looser guards — this version tightens them so
 * schema drift on chart_data can't take the page down.
 */
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { COLORS } from './chartColors';
import { CustomPieTooltip } from './CustomPieTooltip';
import type { QuestionDistribution } from '../../../hooks/useChartData';

interface Props {
  data: QuestionDistribution;
}

export function DistributionPieChart({ data }: Props) {
  if (!data || !Array.isArray(data.options) || !Array.isArray(data.counts)) {
    return null;
  }
  const slices = data.options.map((label, i) => ({
    name: label,
    value: data.counts?.[i] ?? 0,
  }));
  if (slices.length === 0 || slices.every((s) => s.value === 0)) return null;

  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-5">
      <p className="text-xs font-display font-bold text-t2 mb-3 line-clamp-2 min-h-[2.5em]">
        {data.question}
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={2}
          >
            {slices.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
