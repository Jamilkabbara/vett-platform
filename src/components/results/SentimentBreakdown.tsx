/**
 * Pass 42 C3 — universal SentimentBreakdown donut.
 *
 * Reads chart_data.sentiment_breakdown via useChartData. Renders
 * only when at least one of positive/neutral/negative has a count
 * > 0. Center label shows dominant sentiment + percentage.
 */
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import { useChartData } from '../../hooks/useChartData';
import { SENTIMENT_COLORS, CustomPieTooltip } from './charts';

interface Props {
  missionId: string | undefined;
}

export function SentimentBreakdown({ missionId }: Props) {
  const { data } = useChartData(missionId);
  const sb = data?.sentiment_breakdown;
  if (!sb) return null;

  const slices = [
    { name: 'Positive', value: sb.positive ?? 0, fill: SENTIMENT_COLORS.positive },
    { name: 'Neutral',  value: sb.neutral  ?? 0, fill: SENTIMENT_COLORS.neutral  },
    { name: 'Negative', value: sb.negative ?? 0, fill: SENTIMENT_COLORS.negative },
  ].filter((s) => s.value > 0);

  if (slices.length === 0) return null;

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const dominant = slices.reduce((max, s) => (s.value > max.value ? s : max), slices[0]);
  const dominantPct = Math.round((dominant.value / total) * 100);

  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-6">
      <h2 className="text-xs font-display font-black text-lime uppercase tracking-widest mb-4">
        Overall Sentiment
      </h2>
      <div className="grid md:grid-cols-2 gap-4 items-center">
        <div className="relative">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={55}
                paddingAngle={2}
              >
                {slices.map((s, i) => <Cell key={i} fill={s.fill} />)}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div
              className="text-2xl font-display font-black"
              style={{ color: dominant.fill }}
            >
              {dominantPct}%
            </div>
            <div className="text-[10px] uppercase tracking-widest text-t3 font-display font-bold">
              {dominant.name}
            </div>
          </div>
        </div>
        <ul className="space-y-2">
          {slices.map((s) => {
            const pct = Math.round((s.value / total) * 100);
            return (
              <li key={s.name} className="flex items-center gap-3 text-sm">
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ background: s.fill }}
                  aria-hidden
                />
                <span className="text-t1 font-display font-bold flex-1">{s.name}</span>
                <span className="text-t2 tabular-nums">{s.value}</span>
                <span className="text-t3 text-xs tabular-nums w-12 text-right">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
