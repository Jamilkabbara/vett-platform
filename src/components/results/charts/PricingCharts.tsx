/**
 * Pass 42 D2 — Pricing methodology-specific charts.
 *
 * WTP distribution + Demand curve. Reads
 * chart_data.methodology_specific.pricing:
 *   {
 *     wtp_buckets: { "5": 2, "9": 5, "15": 8, ... },
 *     demand_at_price: [{ price: 5, demand_pct: 95 }, { price: 9, demand_pct: 80 }, ...],
 *     optimal_price: 19
 *   }
 */
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Cell, CartesianGrid,
} from 'recharts';
import { useChartData } from '../../../hooks/useChartData';
import { CustomPieTooltip } from './CustomPieTooltip';
import { COLORS } from './chartColors';

interface PricingData {
  wtp_buckets?: Record<string, number>;
  demand_at_price?: Array<{ price: number; demand_pct: number }>;
  optimal_price?: number;
}

interface Props {
  missionId: string | undefined;
}

export function PricingCharts({ missionId }: Props) {
  const { data } = useChartData(missionId);
  const p = (data?.methodology_specific as Record<string, unknown> | undefined)?.pricing as
    | PricingData
    | undefined;
  if (!p) return null;

  const wtpRows = p.wtp_buckets
    ? Object.entries(p.wtp_buckets)
        .map(([price, count]) => ({ price: Number(price), count: Number(count) }))
        .filter((r) => Number.isFinite(r.price) && r.count > 0)
        .sort((a, b) => a.price - b.price)
        .map((r) => ({ name: `$${r.price}`, value: r.count, price: r.price }))
    : [];

  const demandRows = Array.isArray(p.demand_at_price)
    ? p.demand_at_price
        .filter((d) => d && Number.isFinite(d.price) && Number.isFinite(d.demand_pct))
        .sort((a, b) => a.price - b.price)
        .map((d) => ({ name: `$${d.price}`, demand: d.demand_pct, price: d.price }))
    : [];

  if (wtpRows.length === 0 && demandRows.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {wtpRows.length > 0 && (
        <div className="rounded-2xl bg-bg2 border border-b1 p-5">
          <h3 className="text-xs font-display font-black text-lime uppercase tracking-widest mb-3">
            Willingness to Pay
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={wtpRows} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              {p.optimal_price != null && (
                <ReferenceLine
                  x={`$${p.optimal_price}`}
                  stroke="#A3E635"
                  strokeDasharray="3 3"
                  label={{ value: `OPP $${p.optimal_price}`, fill: '#A3E635', fontSize: 10, position: 'top' }}
                />
              )}
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {wtpRows.map((r, i) => (
                  <Cell
                    key={i}
                    fill={p.optimal_price != null && r.price === p.optimal_price ? '#A3E635' : COLORS[i % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {demandRows.length > 0 && (
        <div className="rounded-2xl bg-bg2 border border-b1 p-5">
          <h3 className="text-xs font-display font-black text-lime uppercase tracking-widest mb-3">
            Demand Curve
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={demandRows} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomPieTooltip />} />
              <Line type="monotone" dataKey="demand" stroke="#A3E635" strokeWidth={2} dot={{ r: 4, fill: '#A3E635' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
