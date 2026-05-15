/**
 * Pass 42 C3 — universal SegmentComparison grouped bars.
 *
 * Reads chart_data.segment_distributions. Renders only when there
 * are 2+ segments AND each segment has at least one entry in
 * key_metric_values. If segments exist but key_metric_values is
 * empty across all of them, falls back to a sample-size table
 * (segment_name + n) so the section still has informational value.
 */
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Cell,
} from 'recharts';
import { useChartData } from '../../hooks/useChartData';
import { COLORS, CustomPieTooltip } from './charts';

interface Props {
  missionId: string | undefined;
}

export function SegmentComparison({ missionId }: Props) {
  const { data } = useChartData(missionId);
  const segments = data?.segment_distributions;
  if (!Array.isArray(segments) || segments.length < 2) return null;

  // Collect all metric keys across segments. If empty, render as a
  // simple sample-size strip instead of an empty grouped chart.
  const metricKeys = new Set<string>();
  for (const s of segments) {
    if (s.key_metric_values && typeof s.key_metric_values === 'object') {
      for (const k of Object.keys(s.key_metric_values)) metricKeys.add(k);
    }
  }
  const metrics = Array.from(metricKeys);

  if (metrics.length === 0) {
    // Sample-size-only fallback (chart_data.segment_distributions from
    // the B2 compute path that didn't derive a key metric).
    return (
      <div className="rounded-2xl bg-bg2 border border-b1 p-6">
        <h2 className="text-xs font-display font-black text-indigo-400 uppercase tracking-widest mb-4">
          Segment Distribution
        </h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {segments.map((s) => (
            <li key={s.segment_name} className="flex items-center justify-between rounded-xl bg-bg3 border border-b1 px-4 py-2.5">
              <span className="text-t1 text-sm font-display font-bold">{s.segment_name}</span>
              <span className="text-t3 text-xs font-mono tabular-nums">n={s.n}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Grouped chart: each row is a segment, each color is a metric.
  const rows = segments.map((s) => {
    const row: Record<string, number | string> = { name: s.segment_name };
    for (const m of metrics) {
      row[m] = Number(s.key_metric_values?.[m] ?? 0);
    }
    return row;
  });

  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-6">
      <h2 className="text-xs font-display font-black text-indigo-400 uppercase tracking-widest mb-4">
        Segment Comparison
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          {metrics.map((m, i) => (
            <Bar key={m} dataKey={m} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]}>
              {rows.map((_, j) => (
                <Cell key={j} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
