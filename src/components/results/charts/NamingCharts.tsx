/**
 * Pass 42 D3 — Naming/Messaging methodology charts.
 *
 * Head-to-head stacked horizontal bars + per-name sentiment dots.
 * Reads chart_data.methodology_specific.naming:
 *   [
 *     { name: "Versus", love: 4, like: 3, neutral: 2, dislike: 1, top_phrase: "..." },
 *     ...
 *   ]
 */
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, LabelList,
} from 'recharts';
import { useChartData } from '../../../hooks/useChartData';
import { CustomPieTooltip } from './CustomPieTooltip';

interface NameRow {
  name: string;
  love?: number;
  like?: number;
  neutral?: number;
  dislike?: number;
  top_phrase?: string;
}

interface Props {
  missionId: string | undefined;
}

export function NamingCharts({ missionId }: Props) {
  const { data } = useChartData(missionId);
  const naming = (data?.methodology_specific as Record<string, unknown> | undefined)?.naming as
    | NameRow[]
    | undefined;
  if (!Array.isArray(naming) || naming.length === 0) return null;

  // Rank by total positive (love + like) descending.
  const rows = naming
    .map((n) => {
      const love = Number(n.love ?? 0);
      const like = Number(n.like ?? 0);
      const neutral = Number(n.neutral ?? 0);
      const dislike = Number(n.dislike ?? 0);
      return { name: n.name, love, like, neutral, dislike, positive: love + like, top_phrase: n.top_phrase };
    })
    .sort((a, b) => b.positive - a.positive);

  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-6">
      <h3 className="text-xs font-display font-black text-lime uppercase tracking-widest mb-4">
        Head-to-Head Preference
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 50 + 60)}>
        <BarChart
          data={rows}
          layout="vertical"
          stackOffset="expand"
          margin={{ left: 4, right: 16, top: 8, bottom: 8 }}
        >
          <XAxis type="number" hide domain={[0, 1]} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12, fill: '#cbd5e1' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          <Bar dataKey="love"    name="Love"    stackId="a" fill="#A3E635" />
          <Bar dataKey="like"    name="Like"    stackId="a" fill="#65A30D">
            <LabelList position="insideRight" style={{ fill: '#0B0C15', fontSize: 11, fontWeight: 700 }} />
          </Bar>
          <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#6B7280" />
          <Bar dataKey="dislike" name="Dislike" stackId="a" fill="#F59E0B" />
        </BarChart>
      </ResponsiveContainer>
      {rows.some((r) => r.top_phrase) && (
        <ul className="mt-4 grid sm:grid-cols-2 gap-2">
          {rows
            .filter((r) => r.top_phrase)
            .map((r) => (
              <li key={r.name} className="text-xs text-t2 bg-bg3 rounded-lg px-3 py-2">
                <span className="text-t3 font-display font-bold uppercase tracking-widest text-[9px] mr-2">
                  {r.name}
                </span>
                <span className="italic">&ldquo;{r.top_phrase}&rdquo;</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
