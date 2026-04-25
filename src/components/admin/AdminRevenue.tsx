import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Target,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { safeFormatter } from '../../utils/safeFormatter';
import { ErrorBoundary } from '../shared/ErrorBoundary';

// ── Types ──────────────────────────────────────────────────────────────────

interface KpiMetric {
  value: number;
  delta_pct: number;
}

interface DailyBucket {
  day: string;
  revenue_usd: number;
  cost_usd: number;
}

interface RevenueData {
  period_days: number;
  revenue: KpiMetric;
  gross_profit: KpiMetric;
  avg_order: KpiMetric;
  mission_count: number;
  goal_breakdown: Record<string, number>;
  daily_buckets: DailyBucket[];
  last_updated: string;
}

type Range = '30d' | 'month' | 'quarter' | 'all';

const RANGES: Range[] = ['30d', 'month', 'quarter', 'all'];

const RANGE_LABELS: Record<Range, string> = {
  '30d': 'Last 30 Days',
  'month': 'This Month',
  'quarter': 'This Quarter',
  'all': 'All Time',
};

// ── Sub-components ─────────────────────────────────────────────────────────

interface KpiTileProps {
  label: string;
  value: number;
  delta_pct: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
}

const KpiTile = ({ label, value, delta_pct, prefix = '', suffix = '', icon }: KpiTileProps) => {
  // Guard against undefined/NaN — Recharts and admin payloads can omit fields.
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeDelta = Number.isFinite(delta_pct) ? delta_pct : 0;
  const positive = safeDelta >= 0;
  return (
    <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</span>
        <span className="text-gray-600">{icon}</span>
      </div>
      <div className="text-3xl font-black text-white tracking-tight">
        {prefix}
        {safeValue >= 1000
          ? `${safeFormatter(safeValue / 1000, (n) => n.toFixed(1), '0.0')}k`
          : safeFormatter(safeValue, (n) => n.toLocaleString(), '0')}
        {suffix}
      </div>
      <div
        className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full w-fit ${
          positive
            ? 'bg-primary/10 text-primary'
            : 'bg-red-500/10 text-red-400'
        }`}
      >
        {positive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {positive ? '+' : ''}
        {safeFormatter(safeDelta, (n) => n.toFixed(1), '0.0')}%
      </div>
    </div>
  );
};

interface RangeButtonProps {
  value: Range;
  active: Range;
  onClick: (r: Range) => void;
}

const RangeButton = ({ value, active, onClick }: RangeButtonProps) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
      active === value
        ? 'bg-primary text-[#0f172a]'
        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-gray-800'
    }`}
  >
    {value.toUpperCase()}
  </button>
);

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value?: number; color: string }>;
  label?: string;
}

const ChartTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#0f172a] border border-gray-700 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-gray-400 font-bold mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-300 capitalize">{p.name}:</span>
          <span className="text-white font-bold">
            ${safeFormatter(p.value, (n) => n.toLocaleString(), '0')}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

interface AdminRevenueProps {
  apiFetch: (path: string, opts?: RequestInit) => Promise<Response>;
}

export const AdminRevenue = ({ apiFetch }: AdminRevenueProps) => {
  const [range, setRange] = useState<Range>('30d');
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchData = useCallback(
    async (selectedRange: Range, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/admin/revenue?range=${selectedRange}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: RevenueData = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load revenue data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const handleRangeChange = (r: Range) => {
    setRange(r);
    setDropdownOpen(false);
  };

  // ── Skeleton ──
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#0f172a] border border-gray-800 rounded-2xl p-5 h-36" />
          ))}
        </div>
        <div className="bg-[#0f172a] border border-gray-800 rounded-2xl h-72" />
        <div className="bg-[#0f172a] border border-gray-800 rounded-2xl h-48" />
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="bg-[#0f172a] border border-red-500/30 rounded-2xl p-8 text-center">
        <p className="text-red-400 font-bold mb-4">{error}</p>
        <button
          type="button"
          onClick={() => fetchData(range)}
          className="px-4 py-2 bg-primary text-[#0f172a] rounded-xl font-black text-sm hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  // ── Derived data ──
  // Defensive — `b.day` has occasionally been seen undefined for partial
  // buckets returned during range switches. Unguarded `.slice` would crash
  // the chart and unmount the page (Pass 20 Hotfix Round 2 SEV-1 family).
  const chartData = (data.daily_buckets ?? []).map((b) => ({
    day: typeof b.day === 'string' ? b.day.slice(5) : '', // MM-DD
    Revenue: Number.isFinite(b.revenue_usd) ? b.revenue_usd : 0,
    Cost: Number.isFinite(b.cost_usd) ? b.cost_usd : 0,
    Profit:
      (Number.isFinite(b.revenue_usd) ? b.revenue_usd : 0) -
      (Number.isFinite(b.cost_usd) ? b.cost_usd : 0),
  }));

  const goalEntries = Object.entries(data.goal_breakdown ?? {}).sort(([, a], [, b]) => b - a);
  const maxGoal = goalEntries[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Revenue</h1>
          {data.last_updated && (
            <p className="text-gray-500 text-xs mt-1">
              Updated {new Date(data.last_updated).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Range selector — dropdown on mobile, pill row on desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {RANGES.map((r) => (
              <RangeButton key={r} value={r} active={range} onClick={handleRangeChange} />
            ))}
          </div>
          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-gray-800 rounded-xl text-xs font-black text-gray-300 hover:bg-white/10 transition-colors"
            >
              {RANGE_LABELS[range]}
              <ChevronDown className="w-3 h-3" />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 bg-[#0f172a] border border-gray-800 rounded-xl shadow-2xl p-1 min-w-[140px]">
                  {RANGES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRangeChange(r)}
                      className={`w-full text-left px-3 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors ${
                        range === r
                          ? 'bg-primary text-[#0f172a]'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {RANGE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => fetchData(range, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile
          label="Revenue"
          value={data.revenue?.value ?? 0}
          delta_pct={data.revenue?.delta_pct ?? 0}
          prefix="$"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KpiTile
          label="Gross Profit"
          value={data.gross_profit?.value ?? 0}
          delta_pct={data.gross_profit?.delta_pct ?? 0}
          prefix="$"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KpiTile
          label="Avg Order"
          value={data.avg_order?.value ?? 0}
          delta_pct={data.avg_order?.delta_pct ?? 0}
          prefix="$"
          icon={<ShoppingCart className="w-4 h-4" />}
        />
        <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Missions</span>
            <span className="text-gray-600">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {safeFormatter(data.mission_count, (n) => n.toLocaleString(), '0')}
          </div>
          <div className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full w-fit bg-primary/10 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {data.period_days}d period
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">
          Daily Revenue vs Cost
        </h2>
        <div className="h-64">
          <ErrorBoundary label="Daily Revenue chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BEF264" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#BEF264" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v?: number) =>
                  `$${safeFormatter(
                    v,
                    (n) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`),
                    '0',
                  )}`
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="#BEF264"
                strokeWidth={2}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#BEF264' }}
              />
              <Area
                type="monotone"
                dataKey="Cost"
                stroke="#60a5fa"
                strokeWidth={2}
                fill="url(#costGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#60a5fa' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          </ErrorBoundary>
        </div>
        <div className="flex items-center gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
            <span className="w-3 h-0.5 rounded bg-primary" />
            Revenue
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
            <span className="w-3 h-0.5 rounded bg-blue-400" />
            Cost
          </div>
        </div>
      </div>

      {/* Goal Breakdown */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">
          Revenue by Goal Type
        </h2>
        {goalEntries.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No goal data available</p>
        ) : (
          <div className="space-y-4">
            {goalEntries.map(([goal, amount]) => {
              const pct = (amount / maxGoal) * 100;
              return (
                <div key={goal}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-gray-300 capitalize">{goal}</span>
                    <span className="text-sm font-black text-white">
                      ${safeFormatter(amount, (n) => n.toLocaleString(), '0')}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-lime-300 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;
