/**
 * Pass 42 C1 — RatingHistogram. Extracted from
 * src/pages/ResultsPage.tsx line 1334 block.
 *
 * Vertical Recharts BarChart for rating-type questions. Rating
 * values on X axis, response counts on Y axis. Mean line overlay
 * via ReferenceLine.
 */
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine,
} from 'recharts';
import { COLORS } from './chartColors';
import { CustomPieTooltip } from './CustomPieTooltip';
import type { QuestionDistribution } from '../../../hooks/useChartData';

interface Props {
  data: QuestionDistribution;
}

export function RatingHistogram({ data }: Props) {
  if (!data || !data.buckets || typeof data.buckets !== 'object') return null;

  const scaleMax = data.scale_max ?? 5;
  // Build ordered rows 1..scaleMax (even for buckets with 0 counts so
  // the X axis is uniform).
  const rows: Array<{ name: string; value: number }> = [];
  for (let r = 1; r <= scaleMax; r += 1) {
    rows.push({ name: String(r), value: data.buckets[String(r)] || 0 });
  }
  if (rows.every((r) => r.value === 0)) return null;

  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-5">
      <p className="text-xs font-display font-bold text-t2 mb-3 line-clamp-2 min-h-[2.5em]">
        {data.question}
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} margin={{ left: 4, right: 16, top: 24, bottom: 8 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          {typeof data.mean === 'number' && (
            <ReferenceLine
              x={Math.round(data.mean)}
              stroke="#A3E635"
              strokeDasharray="3 3"
              label={{ value: `mean ${data.mean}`, fill: '#A3E635', fontSize: 11, position: 'top' }}
            />
          )}
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {rows.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
