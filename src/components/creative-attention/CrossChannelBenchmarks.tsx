import { Tv, Smartphone, Maximize2, Monitor, LayoutGrid } from 'lucide-react';
import type { ChannelBenchmark } from '../../types/creativeAnalysis';

/**
 * Pass 24 Bug 24.01 F5 — Cross-Channel Attention Benchmarks.
 *
 * Renders one row per channel (TV, Social Feed, OOH, CTV,
 * Programmatic Display). Each row shows:
 *   - channel icon + name
 *   - paired horizontal bars: industry norm (slate) vs this
 *     creative's prediction (color-coded above/at/below norm)
 *   - delta percentage chip (e.g. "+33%" / "−14%" / "—")
 *   - 1-2 sentence fit_assessment beneath
 *
 * For channels where the creative format doesn't fit (e.g. static
 * image vs TV — TV requires motion), `predicted_for_this_creative`
 * is null. We render the assessment text only and skip the predicted
 * bar.
 *
 * Visual tokens:
 *   above norm (>10%)  → lime
 *   at norm    (±10%)  → indigo
 *   below norm (<-10%) → amber
 */

interface CrossChannelBenchmarksProps {
  benchmarks: ChannelBenchmark[];
}

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  tv:           Tv,
  social:       Smartphone,
  ooh:          Maximize2,
  ctv:          Monitor,
  programmatic: LayoutGrid,
};

function iconForChannel(channel: string) {
  const c = channel.toLowerCase();
  if (c.includes('tv ')) return CHANNEL_ICONS.tv;
  if (c.includes('ctv')) return CHANNEL_ICONS.ctv;
  if (c.includes('social') || c.includes('feed')) return CHANNEL_ICONS.social;
  if (c.includes('ooh') || c.includes('billboard')) return CHANNEL_ICONS.ooh;
  if (c.includes('programmatic') || c.includes('display')) return CHANNEL_ICONS.programmatic;
  return CHANNEL_ICONS.programmatic;
}

interface BarColors {
  predicted: string;
  predictedBg: string;
  delta: { bg: string; text: string };
}

function barColors(norm: number, predicted: number | null): BarColors {
  if (predicted == null) {
    return {
      predicted: '#94A3B8',
      predictedBg: 'rgba(148,163,184,0.15)',
      delta: { bg: 'bg-white/5', text: 'text-white/40' },
    };
  }
  const deltaPct = norm > 0 ? ((predicted - norm) / norm) * 100 : 0;
  if (deltaPct > 10) {
    return {
      predicted: '#BEF264',
      predictedBg: 'rgba(190,242,100,0.15)',
      delta: { bg: 'bg-lime-400/15 border-lime-400/30', text: 'text-lime-300' },
    };
  }
  if (deltaPct < -10) {
    return {
      predicted: '#F59E0B',
      predictedBg: 'rgba(245,158,11,0.15)',
      delta: { bg: 'bg-amber-400/15 border-amber-400/30', text: 'text-amber-300' },
    };
  }
  return {
    predicted: '#A78BFA',
    predictedBg: 'rgba(167,139,250,0.15)',
    delta: { bg: 'bg-purple-400/15 border-purple-400/30', text: 'text-purple-300' },
  };
}

function formatDelta(norm: number, predicted: number | null): string {
  if (predicted == null) return '—';
  if (norm <= 0) return '—';
  const pct = Math.round(((predicted - norm) / norm) * 100);
  if (pct > 0) return `+${pct}%`;
  if (pct < 0) return `${pct}%`;
  return 'at norm';
}

export function CrossChannelBenchmarks({ benchmarks }: CrossChannelBenchmarksProps) {
  if (!benchmarks || benchmarks.length === 0) return null;

  // Compute the chart x-scale. Anchor at the largest seen seconds so all
  // bars share a common axis (a 12s TV bar shouldn't look the same width
  // as a 1.6s social bar).
  const maxSec = Math.max(
    ...benchmarks.flatMap((b) => [
      Number(b.category_avg_attention_seconds) || 0,
      Number(b.predicted_for_this_creative ?? 0) || 0,
    ]),
    1,
  );

  const widthPct = (sec: number) => Math.min(100, (sec / maxSec) * 100);

  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
      <header className="mb-5">
        <h2 className="text-lg font-bold text-white">Cross-Channel Benchmarks</h2>
        <p className="text-white/40 text-xs mt-1">
          Predicted attention seconds vs industry norm (DAIVID/Amplified) across 5 channels
        </p>
      </header>

      <div className="space-y-5">
        {benchmarks.map((b, i) => {
          const Icon = iconForChannel(b.channel);
          const norm = Number(b.category_avg_attention_seconds) || 0;
          const predicted = b.predicted_for_this_creative;
          const colors = barColors(norm, predicted);
          const deltaLabel = formatDelta(norm, predicted);

          return (
            <div key={`${b.channel}-${i}`} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icon className="w-4 h-4 text-white/50 shrink-0" />
                  <span className="text-sm font-semibold text-white truncate">
                    {b.channel}
                  </span>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${colors.delta.bg} ${colors.delta.text}`}
                >
                  {deltaLabel}
                </span>
              </div>

              {/* Norm bar */}
              <div className="flex items-center gap-2">
                <span className="w-24 text-[10px] uppercase tracking-widest text-white/40 shrink-0 text-right">
                  Norm
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/30"
                    style={{ width: `${widthPct(norm)}%` }}
                  />
                </div>
                <span className="w-14 text-xs font-mono text-white/60 tabular-nums text-right shrink-0">
                  {norm.toFixed(1)}s
                </span>
              </div>

              {/* Predicted bar (only when applicable) */}
              {predicted != null ? (
                <div className="flex items-center gap-2">
                  <span className="w-24 text-[10px] uppercase tracking-widest text-white/60 shrink-0 text-right">
                    Predicted
                  </span>
                  <div
                    className="flex-1 h-2.5 rounded-full overflow-hidden"
                    style={{ background: colors.predictedBg }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${widthPct(predicted)}%`,
                        background: colors.predicted,
                      }}
                    />
                  </div>
                  <span
                    className="w-14 text-xs font-mono tabular-nums text-right shrink-0 font-bold"
                    style={{ color: colors.predicted }}
                  >
                    {predicted.toFixed(1)}s
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-24 text-[10px] uppercase tracking-widest text-white/40 shrink-0 text-right">
                    Predicted
                  </span>
                  <span className="text-[11px] text-white/40 italic">
                    Format mismatch — see assessment below
                  </span>
                </div>
              )}

              <p className="text-[11px] text-white/55 leading-relaxed pl-26">
                {b.fit_assessment}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CrossChannelBenchmarks;
