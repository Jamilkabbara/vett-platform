import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Eye, EyeOff, Zap, Clock } from 'lucide-react';
import type { AttentionPrediction } from '../../types/creativeAnalysis';

/**
 * Pass 24 Bug 24.01 F3 — Attention block.
 *
 * Renders three things in a single section:
 *   1. **Active vs Passive split** — three stacked horizontal bars
 *      showing the population breakdown (active / passive /
 *      non-attention %, summing to 100).
 *   2. **DBA score callout** — "Brand identifiable in X.Xs" with the
 *      0-100 distinctive_brand_asset_score and dba_read_seconds.
 *   3. **Attention decay curve** — line chart of active_pct over
 *      time. For static images this is a single point at second=0;
 *      for video it's bucketed every 1s.
 *
 * Visual contract:
 *   - Lime accent for "active" (the metric advertisers want).
 *   - Indigo for "passive" (peripheral awareness).
 *   - Slate for "non-attention" (scrolled past).
 */

interface AttentionBlockProps {
  attention: AttentionPrediction;
}

const COLORS = {
  active:        '#BEF264', // lime
  passive:       '#A78BFA', // indigo
  nonAttention:  '#64748B', // slate
} as const;

export function AttentionBlock({ attention }: AttentionBlockProps) {
  const {
    predicted_active_attention_seconds: activeSec,
    predicted_passive_attention_seconds: passiveSec,
    active_attention_pct: activePct,
    passive_attention_pct: passivePct,
    non_attention_pct: nonPct,
    distinctive_brand_asset_score: dbaScore,
    dba_read_seconds: dbaSec,
    attention_decay_curve: curve,
  } = attention;

  // Clamp + sanitize numbers so a partial AI response can't render NaN.
  const num = (v: unknown, fallback = 0) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  const fmtSec = (v: number) => `${num(v).toFixed(1)}s`;

  const isStatic = (curve?.length ?? 0) <= 1;

  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime/10">
          <Eye className="w-5 h-5 text-lime" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Attention</h2>
          <p className="text-white/40 text-xs">
            Predicted dwell time + active vs passive split + brand identifiability
          </p>
        </div>
      </header>

      {/* Top row — three stat callouts: active sec / passive sec / DBA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCallout
          icon={<Eye className="w-4 h-4" aria-hidden />}
          label="Active attention"
          value={fmtSec(activeSec)}
          sub={`${num(activePct)}% of viewers`}
          color={COLORS.active}
        />
        <StatCallout
          icon={<EyeOff className="w-4 h-4" aria-hidden />}
          label="Passive attention"
          value={fmtSec(passiveSec)}
          sub={`${num(passivePct)}% of viewers`}
          color={COLORS.passive}
        />
        <StatCallout
          icon={<Zap className="w-4 h-4" aria-hidden />}
          label="Brand read"
          value={fmtSec(dbaSec)}
          sub={`DBA score ${num(dbaScore)}/100`}
          color={dbaScore >= 70 ? COLORS.active : dbaScore >= 40 ? '#F59E0B' : '#F87171'}
        />
      </div>

      {/* Population split bar — active / passive / non */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-widest text-white/50 font-bold">
            Audience split
          </span>
          <span className="text-[10px] text-white/30">100% of impressions</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex bg-white/5">
          <div
            style={{ width: `${num(activePct)}%`, background: COLORS.active }}
            title={`Active ${num(activePct)}%`}
            className="transition-all"
          />
          <div
            style={{ width: `${num(passivePct)}%`, background: COLORS.passive }}
            title={`Passive ${num(passivePct)}%`}
            className="transition-all"
          />
          <div
            style={{ width: `${num(nonPct)}%`, background: COLORS.nonAttention }}
            title={`Non-attention ${num(nonPct)}%`}
            className="transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-[11px]">
          <Legend dot={COLORS.active} label="Active" pct={activePct} />
          <Legend dot={COLORS.passive} label="Passive" pct={passivePct} />
          <Legend dot={COLORS.nonAttention} label="Non-attention" pct={nonPct} />
        </div>
      </div>

      {/* Decay curve — only for video missions */}
      {!isStatic ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-white/40" aria-hidden />
            <span className="text-xs uppercase tracking-widest text-white/50 font-bold">
              Active attention decay
            </span>
          </div>
          <div className="h-44 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="second"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickFormatter={(v) => `${v}s`}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Active attention'] as [string, string]}
                  labelFormatter={(v) => `${v}s into the creative`}
                />
                <Line
                  type="monotone"
                  dataKey="active_pct"
                  stroke={COLORS.active}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.active }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-white/40 italic">
          Static image — single first-contact prediction at second 0. Video
          creatives surface a per-second decay curve in this slot.
        </p>
      )}
    </section>
  );
}

function StatCallout({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50 font-bold">
        <span style={{ color }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-black tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] text-white/50 mt-0.5">{sub}</div>
    </div>
  );
}

function Legend({ dot, label, pct }: { dot: string; label: string; pct: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-white/60">
      <span className="w-2 h-2 rounded-full" style={{ background: dot }} aria-hidden />
      <span className="font-semibold">{label}</span>
      <span className="text-white/40 tabular-nums">
        {Math.round(pct)}%
      </span>
    </span>
  );
}

export default AttentionBlock;
