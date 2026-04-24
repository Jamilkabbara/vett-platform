import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { supabase } from '../../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Range = '30d' | 'month' | 'quarter' | 'all';

interface DeltaStat {
  value: number;
  delta_pct: number;
}

interface Summary {
  total_cost_usd: DeltaStat;
  total_revenue_usd: DeltaStat;
  gross_margin_pct: DeltaStat;
  total_calls: DeltaStat;
  avg_cost_per_mission: DeltaStat;
  tiering_savings_usd: number;
}

interface ByOperation {
  call_type: string;
  total_calls: number;
  total_cost_usd: number;
  avg_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
}

interface ModelMix {
  model: string;
  calls: number;
  cost_usd: number;
  pct_of_cost: number;
}

interface MissionMargin {
  mission_id: string;
  revenue_usd: number;
  cost_usd: number;
  margin_usd: number;
  margin_pct: number;
}

interface DailyBucket {
  day: string;
  revenue_usd: number;
  cost_usd: number;
}

interface AICostsData {
  summary: Summary;
  by_operation: ByOperation[];
  model_mix: ModelMix[];
  mission_margins: MissionMargin[];
  daily_buckets: DailyBucket[];
  last_updated: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdminAICostsProps {
  apiFetch: (path: string, opts?: RequestInit) => Promise<Response>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = {
  usd: (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }),
  usd2: (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }),
  pct: (n: number) => `${n.toFixed(1)}%`,
  num: (n: number) => n.toLocaleString('en-US'),
  day: (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
};

function DeltaBadge({ delta_pct }: { delta_pct: number }) {
  if (delta_pct === undefined || delta_pct === null) return null;
  const positive = delta_pct >= 0;
  const label = `${positive ? '+' : ''}${delta_pct.toFixed(1)}%`;
  return (
    <span
      className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${
        positive
          ? 'bg-emerald-900/60 text-emerald-400'
          : 'bg-red-900/60 text-red-400'
      }`}
    >
      {label}
    </span>
  );
}

// Model color palette (cycles for unknown models)
const MODEL_COLORS = [
  '#ccff00',
  '#38bdf8',
  '#fb923c',
  '#a78bfa',
  '#34d399',
  '#f472b6',
  '#facc15',
];

function modelColor(idx: number) {
  return MODEL_COLORS[idx % MODEL_COLORS.length];
}

// ---------------------------------------------------------------------------
// Custom Recharts tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
          {entry.name === 'cost_usd' ? 'Cost' : 'Revenue'}: {fmt.usd2(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AdminAICosts({ apiFetch }: AdminAICostsProps) {
  const [range, setRange] = useState<Range>('30d');
  const [data, setData] = useState<AICostsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(
    async (currentRange: Range) => {
      try {
        const res = await apiFetch(`/api/admin/ai-costs?range=${currentRange}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: AICostsData = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    },
    [apiFetch]
  );

  // Initial fetch + polling
  useEffect(() => {
    setLoading(true);
    fetchData(range);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchData(range), 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [range, fetchData]);

  // Supabase realtime subscription on ai_calls (INSERT)
  useEffect(() => {
    const channel = supabase
      .channel('admin-ai-costs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_calls' },
        () => {
          fetchData(range);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsLive(false);
    };
  }, [range, fetchData]);

  // -------------------------------------------------------------------------
  // Render states
  // -------------------------------------------------------------------------

  const RANGES: { label: string; value: Range }[] = [
    { label: '30d', value: '30d' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">AI Cost Dashboard</h1>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`}
            />
            <span
              className={`text-xs font-semibold ${isLive ? 'text-emerald-400' : 'text-gray-500'}`}
            >
              {isLive ? 'Live' : 'Connecting…'}
            </span>
          </div>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 bg-[#0f172a] border border-gray-800 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                range === r.value
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Last updated */}
      {data?.last_updated && (
        <p className="text-[11px] text-gray-600 -mt-3">
          Last updated: {new Date(data.last_updated).toLocaleString()}
        </p>
      )}

      {/* Loading / Error */}
      {loading && !data && (
        <div className="flex items-center justify-center h-40 text-gray-500 text-sm animate-pulse">
          Loading AI cost data…
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* 1. KPI Tiles                                                     */}
          {/* ---------------------------------------------------------------- */}
          {data.summary && (
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Total AI Cost */}
              <KpiTile
                label="Total AI Cost"
                value={fmt.usd2(data.summary.total_cost_usd?.value ?? 0)}
                delta={data.summary.total_cost_usd?.delta_pct ?? 0}
                invertDelta
              />
              {/* Gross Margin */}
              <KpiTile
                label="Gross Margin"
                value={fmt.pct(data.summary.gross_margin_pct?.value ?? 0)}
                delta={data.summary.gross_margin_pct?.delta_pct ?? 0}
              />
              {/* Total Calls */}
              <KpiTile
                label="Total Calls"
                value={fmt.num(data.summary.total_calls?.value ?? 0)}
                delta={data.summary.total_calls?.delta_pct ?? 0}
              />
              {/* Avg Cost / Mission */}
              <KpiTile
                label="Avg Cost / Mission"
                value={fmt.usd(data.summary.avg_cost_per_mission?.value ?? 0)}
                delta={data.summary.avg_cost_per_mission?.delta_pct ?? 0}
                invertDelta
              />
              {/* Tiering Savings */}
              <KpiTile
                label="Tiering Savings"
                value={fmt.usd2(data.summary.tiering_savings_usd ?? 0)}
                accent
              />
            </div>
          </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* 2. Daily Cost vs Revenue Chart                                   */}
          {/* ---------------------------------------------------------------- */}
          {(data.daily_buckets ?? []).length > 0 && (
            <section className="bg-[#0f172a] border border-gray-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Daily Cost vs Revenue</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={data.daily_buckets}
                  margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ccff00" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ccff00" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={fmt.day}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    formatter={(value: string) =>
                      value === 'revenue_usd' ? 'Revenue' : 'Cost'
                    }
                    wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue_usd"
                    stroke="#ccff00"
                    strokeWidth={2}
                    fill="url(#gradRevenue)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost_usd"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="url(#gradCost)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* 3. Operations Breakdown Table                                    */}
          {/* ---------------------------------------------------------------- */}
          {(data.by_operation ?? []).length > 0 && (
            <section className="bg-[#0f172a] border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="text-sm font-semibold text-gray-300">Operations Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left px-4 py-3 font-semibold">Operation</th>
                      <th className="text-right px-4 py-3 font-semibold">Calls</th>
                      <th className="text-right px-4 py-3 font-semibold">Total Cost</th>
                      <th className="text-right px-4 py-3 font-semibold">Avg Cost</th>
                      <th className="text-right px-4 py-3 font-semibold">Input Tokens</th>
                      <th className="text-right px-4 py-3 font-semibold">Output Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(data.by_operation ?? [])]
                      .sort((a, b) => b.total_cost_usd - a.total_cost_usd)
                      .map((op, i) => (
                        <tr
                          key={op.call_type}
                          className={`border-b border-gray-800/60 transition-colors hover:bg-white/[0.02] ${
                            i % 2 === 0 ? '' : 'bg-white/[0.01]'
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-200">
                            <span className="font-mono text-[11px] bg-gray-800/60 px-2 py-0.5 rounded text-primary">
                              {op.call_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {fmt.num(op.total_calls)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-200 font-semibold">
                            {fmt.usd2(op.total_cost_usd)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400">
                            {fmt.usd(op.avg_cost_usd)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400">
                            {fmt.num(op.total_input_tokens)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400">
                            {fmt.num(op.total_output_tokens)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* 4. Model Mix                                                     */}
          {/* ---------------------------------------------------------------- */}
          {(data.model_mix ?? []).length > 0 && (
            <section className="bg-[#0f172a] border border-gray-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Model Mix</h2>
              <div className="space-y-3">
                {[...(data.model_mix ?? [])]
                  .sort((a, b) => b.pct_of_cost - a.pct_of_cost)
                  .map((m, idx) => {
                    const color = modelColor(idx);
                    return (
                      <div key={m.model}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-medium text-gray-200 font-mono">
                              {m.model}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400">
                            <span>{fmt.num(m.calls)} calls</span>
                            <span className="font-semibold text-gray-200">
                              {fmt.usd2(m.cost_usd)}
                            </span>
                            <span
                              className="font-bold w-10 text-right"
                              style={{ color }}
                            >
                              {fmt.pct(m.pct_of_cost)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(m.pct_of_cost, 100)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Tile sub-component
// ---------------------------------------------------------------------------

interface KpiTileProps {
  label: string;
  value: string;
  delta?: number;
  /** When true, a positive delta is bad (cost went up) */
  invertDelta?: boolean;
  /** Highlight tile with primary accent */
  accent?: boolean;
}

function KpiTile({ label, value, delta, invertDelta, accent }: KpiTileProps) {
  // For inverted metrics (cost), positive delta is bad → show red
  const effectiveDelta =
    delta !== undefined && invertDelta ? delta * -1 : delta;

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-2 ${
        accent
          ? 'bg-primary/10 border-primary/30'
          : 'bg-[#0f172a] border-gray-800'
      }`}
    >
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-lg font-bold leading-none ${
          accent ? 'text-primary' : 'text-white'
        }`}
      >
        {value}
      </span>
      {effectiveDelta !== undefined && (
        <DeltaBadge delta_pct={effectiveDelta} />
      )}
    </div>
  );
}
