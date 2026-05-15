/**
 * Pass 42 D1 — BrandLift pre/post comparison + lift delta charts.
 *
 * Reads chart_data.methodology_specific.brand_lift shape:
 *   {
 *     pre:  { recall: 60, awareness: 70, intent: 45 },
 *     post: { recall: 78, awareness: 82, intent: 58 },
 *     lift_pct: { recall: 18, awareness: 12, intent: 13 }
 *   }
 *
 * Pre/post grouped bars + absolute lift delta side-by-side.
 * Renders nothing when the methodology_specific.brand_lift block
 * isn't present.
 */
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Cell, ReferenceLine,
} from 'recharts';
import { useChartData } from '../../../hooks/useChartData';
import { CustomPieTooltip } from './CustomPieTooltip';

interface BrandLiftData {
  pre?: Record<string, number>;
  post?: Record<string, number>;
  lift_pct?: Record<string, number>;
}

interface Props {
  missionId: string | undefined;
}

export function BrandLiftCharts({ missionId }: Props) {
  const { data } = useChartData(missionId);
  const bl = (data?.methodology_specific as Record<string, unknown> | undefined)?.brand_lift as
    | BrandLiftData
    | undefined;
  if (!bl || !bl.pre || !bl.post) return null;

  const dimensions = Array.from(
    new Set([...Object.keys(bl.pre), ...Object.keys(bl.post)]),
  );
  if (dimensions.length === 0) return null;

  const prePostRows = dimensions.map((d) => ({
    name: d.charAt(0).toUpperCase() + d.slice(1).replace(/_/g, ' '),
    pre: bl.pre?.[d] ?? 0,
    post: bl.post?.[d] ?? 0,
  }));

  const liftRows = (bl.lift_pct
    ? Object.entries(bl.lift_pct).map(([d, v]) => ({
        name: d.charAt(0).toUpperCase() + d.slice(1).replace(/_/g, ' '),
        value: Number(v),
      }))
    : dimensions.map((d) => ({
        name: d.charAt(0).toUpperCase() + d.slice(1).replace(/_/g, ' '),
        value: (bl.post?.[d] ?? 0) - (bl.pre?.[d] ?? 0),
      }))).sort((a, b) => b.value - a.value);

  const liftColor = (v: number) => (v > 0 ? '#A3E635' : v < 0 ? '#F87171' : '#F59E0B');

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-2xl bg-bg2 border border-b1 p-5">
        <h3 className="text-xs font-display font-black text-lime uppercase tracking-widest mb-3">
          Pre / Post Exposure
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={prePostRows} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Bar dataKey="pre" name="Pre"  fill="#6366F1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="post" name="Post" fill="#A3E635" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl bg-bg2 border border-b1 p-5">
        <h3 className="text-xs font-display font-black text-lime uppercase tracking-widest mb-3">
          Lift Delta
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={liftRows} layout="vertical" margin={{ left: 4, right: 36, top: 8, bottom: 8 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine x={0} stroke="#475569" />
            <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {liftRows.map((r, i) => (
                <Cell key={i} fill={liftColor(r.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
