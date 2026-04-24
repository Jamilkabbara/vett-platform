/**
 * AdminOverview — real-time admin dashboard.
 *
 * Fetches GET /api/admin/overview?range=<range> on mount, auto-refreshes
 * every 60 s, and subscribes to Supabase realtime postgres_changes on the
 * `missions` table so INSERT / UPDATE events trigger an immediate refresh.
 *
 * Sections
 *  · 4 KPI tiles (total_missions, total_revenue, active_users, avg_mission_value)
 *  · Conversion funnel (signups → missions_created → paid → completed)
 *  · User segments bar list
 *  · Activity feed
 *  · Mission type mix
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Users,
  Target,
  DollarSign,
  Activity,
  Layers,
  BarChart2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

type Range = '30d' | 'month' | 'quarter' | 'all';

interface KpiMetric {
  value: number;
  delta_pct: number;
}

interface OverviewData {
  kpis: {
    total_missions:    KpiMetric;
    total_revenue:     KpiMetric;
    active_users:      KpiMetric;
    avg_mission_value: KpiMetric;
  };
  funnel: {
    signups?:          number;
    missions_created?: number;
    paid?:             number;
    completed?:        number;
  };
  segments: Array<{ segment: string; count: number }>;
  activity: Array<{ type: string; description: string; created_at: string }>;
  missionTypeMix: Array<{ type: string; count: number; pct: number }>;
  gross_margin_pct: number;
  last_updated: string;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface AdminOverviewProps {
  apiFetch: (path: string, opts?: RequestInit) => Promise<Response>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const RANGE_LABELS: Record<Range, string> = {
  '30d':     'Last 30 days',
  'month':   'This month',
  'quarter': 'This quarter',
  'all':     'All time',
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60)   return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function cvr(from: number | undefined, to: number | undefined): string {
  if (!from || !to) return '—';
  return `${((to / from) * 100).toFixed(1)}%`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Delta badge: green for positive, red for negative, muted for zero. */
function DeltaBadge({ pct }: { pct: number }) {
  const abs = Math.abs(pct);
  const fmt = abs >= 100 ? `${Math.round(abs)}%` : `${abs.toFixed(1)}%`;

  if (pct > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-grn/10 border border-grn/20 text-grn text-[10px] font-bold leading-none">
        <TrendingUp className="w-2.5 h-2.5" />
        {fmt}
      </span>
    );
  }
  if (pct < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red/10 border border-red/20 text-red text-[10px] font-bold leading-none">
        <TrendingDown className="w-2.5 h-2.5" />
        {fmt}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-b1 text-t3 text-[10px] font-bold leading-none">
      <Minus className="w-2.5 h-2.5" />
      0%
    </span>
  );
}

/** Section card wrapper. */
function Section({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[#0f172a] border border-gray-800 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lime">{icon}</span>
        <h3 className="font-display font-black text-white text-[13px] uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/** Activity type pill. */
function ActivityTypePill({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    mission_created: 'bg-blu/10 text-blu border-blu/20',
    payment:         'bg-grn/10 text-grn border-grn/20',
    completed:       'bg-lime/10 text-lime border-lime/20',
    signup:          'bg-pur/10 text-pur border-pur/20',
    refund:          'bg-red/10 text-red  border-red/20',
  };
  const cls = colorMap[type] ?? 'bg-b1 text-t3 border-b2';
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider shrink-0 ${cls}`}
    >
      {type.replace(/_/g, ' ')}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminOverview({ apiFetch }: AdminOverviewProps) {
  const [range, setRange]   = useState<Range>('30d');
  const [data, setData]     = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastTick, setLastTick] = useState(Date.now());

  const rangeRef = useRef(range);
  rangeRef.current = range;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/admin/overview?range=${rangeRef.current}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: OverviewData = await res.json();
        setData(json);
        setLastTick(Date.now());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load overview');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiFetch],
  );

  // Initial fetch + re-fetch when range changes
  useEffect(() => {
    fetchData();
  }, [fetchData, range]); // include range so ESLint is satisfied; fetchData is memo-stable

  // Auto-refresh every 60 s
  useEffect(() => {
    const id = setInterval(() => {
      fetchData({ silent: true });
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Supabase realtime — react to missions INSERT / UPDATE
  useEffect(() => {
    const channel = supabase
      .channel('admin-overview-missions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'missions' },
        () => {
          fetchData({ silent: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // ── Render: loading skeleton ───────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[90px] bg-[#0f172a] border border-gray-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[160px] bg-[#0f172a] border border-gray-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────────────

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-10 h-10 rounded-full bg-red/10 border border-red/30 flex items-center justify-center">
          <Activity className="w-5 h-5 text-red" />
        </div>
        <div>
          <p className="font-display font-black text-white text-[15px] mb-1">Failed to load overview</p>
          <p className="text-t3 text-[12px] font-mono">{error}</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 px-4 py-2 bg-lime/10 border border-lime/30 rounded-xl text-lime text-[12px] font-bold hover:bg-lime/20 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  // ── Funnel steps config ────────────────────────────────────────────────────

  const funnelSteps = data
    ? [
        { key: 'signups',          label: 'Signups',          value: data.funnel?.signups },
        { key: 'missions_created', label: 'Missions Created', value: data.funnel?.missions_created },
        { key: 'paid',             label: 'Paid',             value: data.funnel?.paid },
        { key: 'completed',        label: 'Completed',        value: data.funnel?.completed },
      ]
    : [];

  const funnelMax = funnelSteps.reduce((m, s) => Math.max(m, s.value ?? 0), 1);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Range selector */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0f172a] border border-gray-800 rounded-xl">
          {(Object.keys(RANGE_LABELS) as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={[
                'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all',
                r === range
                  ? 'bg-lime text-bg font-black'
                  : 'text-t3 hover:text-t1',
              ].join(' ')}
            >
              {r === '30d' ? '30d' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Right cluster: auto-refresh indicator + manual refresh */}
        <div className="flex items-center gap-3">
          {(refreshing || loading) ? (
            <span className="flex items-center gap-1.5 text-t3 text-[11px] font-mono">
              <RefreshCw className="w-3 h-3 animate-spin" />
              refreshing…
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-t4 text-[10px] font-mono">
              <Zap className="w-2.5 h-2.5 text-lime/50" />
              auto-refreshing · updated {fmtRelative(data?.last_updated ?? new Date(lastTick).toISOString())}
            </span>
          )}
          <button
            onClick={() => fetchData({ silent: true })}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f172a] border border-gray-800 rounded-xl text-t2 text-[11px] font-bold hover:border-lime/40 hover:text-lime transition-all disabled:opacity-40"
            title="Refresh now"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI tiles ───────────────────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Total Missions */}
          <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-t3 text-[11px] font-bold uppercase tracking-wider">Total Missions</span>
              <Target className="w-3.5 h-3.5 text-t4 shrink-0" />
            </div>
            <div className="font-display font-black text-white text-[clamp(22px,3.5vw,30px)] leading-none tracking-display-l mb-2">
              {fmtNumber(data.kpis?.total_missions?.value ?? 0)}
            </div>
            <DeltaBadge pct={data.kpis?.total_missions?.delta_pct ?? 0} />
          </div>

          {/* Total Revenue */}
          <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-t3 text-[11px] font-bold uppercase tracking-wider">Total Revenue</span>
              <DollarSign className="w-3.5 h-3.5 text-t4 shrink-0" />
            </div>
            <div className="font-display font-black text-lime text-[clamp(22px,3.5vw,30px)] leading-none tracking-display-l mb-2">
              {fmtMoney(data.kpis?.total_revenue?.value ?? 0)}
            </div>
            <DeltaBadge pct={data.kpis?.total_revenue?.delta_pct ?? 0} />
          </div>

          {/* Active Users */}
          <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-t3 text-[11px] font-bold uppercase tracking-wider">Active Users</span>
              <Users className="w-3.5 h-3.5 text-t4 shrink-0" />
            </div>
            <div className="font-display font-black text-white text-[clamp(22px,3.5vw,30px)] leading-none tracking-display-l mb-2">
              {fmtNumber(data.kpis?.active_users?.value ?? 0)}
            </div>
            <DeltaBadge pct={data.kpis?.active_users?.delta_pct ?? 0} />
          </div>

          {/* Avg Mission Value */}
          <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-t3 text-[11px] font-bold uppercase tracking-wider">Avg Mission Value</span>
              <BarChart2 className="w-3.5 h-3.5 text-t4 shrink-0" />
            </div>
            <div className="font-display font-black text-lime text-[clamp(22px,3.5vw,30px)] leading-none tracking-display-l mb-2">
              {fmtMoney(data.kpis?.avg_mission_value?.value ?? 0)}
            </div>
            <DeltaBadge pct={data.kpis?.avg_mission_value?.delta_pct ?? 0} />
          </div>

        </div>
      )}

      {/* ── Lower grid ──────────────────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Funnel */}
          <Section title="Conversion Funnel" icon={<Target className="w-4 h-4" />}>
            <div className="space-y-3">
              {funnelSteps.map((step, idx) => {
                const val = step.value ?? 0;
                const pct = funnelMax > 0 ? (val / funnelMax) * 100 : 0;
                const prevStep = idx > 0 ? funnelSteps[idx - 1] : null;
                const convLabel = prevStep
                  ? cvr(prevStep.value, val)
                  : null;

                return (
                  <div key={step.key}>
                    {/* Conversion rate connector */}
                    {convLabel && (
                      <div className="flex items-center gap-2 mb-1.5 ml-1">
                        <div className="w-px h-3 bg-gray-700 ml-1" />
                        <span className="text-t4 text-[10px] font-mono">{convLabel} conversion</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-t2 text-[11px] font-bold">{step.label}</span>
                        <span className="text-lime font-mono font-bold text-[11px]">
                          {fmtNumber(val)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-lime transition-all duration-500"
                          style={{ width: `${pct}%`, opacity: 1 - idx * 0.15 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall conversion */}
            {(data.funnel?.signups ?? 0) > 0 && (data.funnel?.completed ?? 0) > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-t3 text-[11px] font-bold">Overall conversion</span>
                <span className="text-lime font-mono font-bold text-[12px]">
                  {cvr(data.funnel?.signups, data.funnel?.completed)}
                </span>
              </div>
            )}
          </Section>

          {/* User Segments */}
          <Section title="User Segments" icon={<Users className="w-4 h-4" />}>
            {(data.segments ?? []).length === 0 ? (
              <p className="text-t4 text-[12px] text-center py-6">No segment data</p>
            ) : (
              <div className="space-y-2.5">
                {(() => {
                  const maxCount = (data.segments ?? []).reduce((m, s) => Math.max(m, s.count), 1);
                  return (data.segments ?? []).map(seg => (
                    <div key={seg.segment}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-t2 text-[11px] font-bold capitalize">
                          {seg.segment.replace(/_/g, ' ')}
                        </span>
                        <span className="text-t3 font-mono text-[11px]">
                          {fmtNumber(seg.count)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-pur transition-all duration-500"
                          style={{ width: `${(seg.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </Section>

          {/* Activity Feed */}
          <Section title="Activity Feed" icon={<Activity className="w-4 h-4" />}>
            {(data.activity ?? []).length === 0 ? (
              <p className="text-t4 text-[12px] text-center py-6">No recent activity</p>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                {(data.activity ?? []).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 py-2 border-b border-gray-800/60 last:border-0"
                  >
                    <ActivityTypePill type={item.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-t1 text-[11px] leading-snug truncate">
                        {item.description}
                      </p>
                      <p className="text-t4 text-[10px] font-mono mt-0.5">
                        {fmtRelative(item.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Mission Type Mix */}
          <Section title="Mission Type Mix" icon={<Layers className="w-4 h-4" />}>
            {(data.missionTypeMix ?? []).length === 0 ? (
              <p className="text-t4 text-[12px] text-center py-6">No mission data</p>
            ) : (
              <div className="space-y-2.5">
                {(data.missionTypeMix ?? []).map(item => (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-t2 text-[11px] font-bold capitalize">
                        {item.type.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-t3 font-mono text-[10px]">
                          {fmtNumber(item.count)}
                        </span>
                        <span className="text-lime font-mono font-bold text-[11px] w-[36px] text-right">
                          {item.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blu transition-all duration-500"
                        style={{ width: `${Math.min(item.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Gross margin callout */}
            {typeof data.gross_margin_pct === 'number' && (
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-t3 text-[11px] font-bold">Gross margin</span>
                <span
                  className={[
                    'font-display font-black text-[13px]',
                    data.gross_margin_pct >= 0 ? 'text-grn' : 'text-red',
                  ].join(' ')}
                >
                  {data.gross_margin_pct.toFixed(1)}%
                </span>
              </div>
            )}
          </Section>

        </div>
      )}

    </div>
  );
}

export default AdminOverview;
