import { Target } from 'lucide-react';
import {
  asPlatformFitObject,
  platformLabel,
  platformRationale,
  type PlatformFitItem,
} from '../../types/creativeAnalysis';

/**
 * Pass 24 Bug 24.01 F6 — Platform Fit upgrade.
 *
 * Replaces the prior small "Best Platform Fit" pill cluster (which
 * lived in the hero metrics row) with a full-section panel showing,
 * per platform:
 *   - platform name + fit_score chip (0-100)
 *   - norm bar vs predicted bar paired (same color encoding as
 *     CrossChannelBenchmarks: lime above norm, indigo at, amber below)
 *   - delta_vs_norm_pct chip
 *   - rationale paragraph (1-2 sentences)
 *
 * For legacy missions (string[] or {platform, rationale}[] without
 * v2 fields), falls back to a compact pill list — same as the prior
 * inline impl. The component handles all three shapes.
 *
 * The fit_score chip color mirrors the band thresholds:
 *   ≥80 → lime (excellent fit)
 *   ≥60 → emerald (strong fit)
 *   ≥40 → indigo (adequate)
 *   <40 → amber (poor fit)
 */

interface PlatformFitPanelProps {
  items: PlatformFitItem[];
}

interface BarColors {
  predicted: string;
  predictedBg: string;
  delta: { bg: string; text: string };
}

function deltaColors(deltaPct: number | undefined): BarColors {
  if (deltaPct == null || !Number.isFinite(deltaPct)) {
    return {
      predicted: '#A78BFA',
      predictedBg: 'rgba(167,139,250,0.15)',
      delta: { bg: 'bg-purple-400/15 border-purple-400/30', text: 'text-purple-300' },
    };
  }
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

function fitScoreClasses(score: number): { bg: string; text: string } {
  if (score >= 80) return { bg: 'bg-lime-400/20 border-lime-400/40', text: 'text-lime-300' };
  if (score >= 60) return { bg: 'bg-emerald-400/15 border-emerald-400/30', text: 'text-emerald-300' };
  if (score >= 40) return { bg: 'bg-purple-400/15 border-purple-400/30', text: 'text-purple-300' };
  return { bg: 'bg-amber-400/15 border-amber-400/30', text: 'text-amber-300' };
}

export function PlatformFitPanel({ items }: PlatformFitPanelProps) {
  if (!items || items.length === 0) return null;

  // Detect v2 mode: at least one item has the upgraded fields. Otherwise
  // fall back to legacy pill list.
  const v2 = items.some((p) => {
    const obj = asPlatformFitObject(p);
    return (
      obj != null &&
      (obj.platform_norm_active_attention_seconds != null ||
        obj.predicted_creative_attention_seconds != null ||
        obj.fit_score != null)
    );
  });

  if (!v2) {
    // Legacy fallback — compact pill cluster identical in spirit to the
    // prior inline render. Renders for old creative_analysis rows.
    return (
      <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
        <header className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
            <Target className="w-5 h-5 text-purple-300" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-white">Best Platform Fit</h2>
        </header>
        <div className="flex flex-wrap gap-2">
          {items.map((p, i) => {
            const name = platformLabel(p);
            const rat = platformRationale(p);
            return (
              <span
                key={`${name}-${i}`}
                title={rat || undefined}
                className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/15 border border-purple-500/30 text-purple-300 cursor-help"
              >
                {name}
              </span>
            );
          })}
        </div>
      </section>
    );
  }

  // V2 panel — one row per platform with norm + predicted + delta + rationale.
  const maxSec = Math.max(
    ...items.flatMap((p) => {
      const obj = asPlatformFitObject(p);
      if (!obj) return [0];
      return [
        Number(obj.platform_norm_active_attention_seconds ?? 0) || 0,
        Number(obj.predicted_creative_attention_seconds ?? 0) || 0,
      ];
    }),
    1,
  );
  const widthPct = (sec: number) => Math.min(100, (sec / maxSec) * 100);

  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
      <header className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
          <Target className="w-5 h-5 text-purple-300" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Best Platform Fit</h2>
          <p className="text-white/40 text-xs">
            Predicted active attention vs platform norm + fit score per platform
          </p>
        </div>
      </header>

      <div className="space-y-5">
        {items.map((p, i) => {
          const obj = asPlatformFitObject(p);
          const name = platformLabel(p);
          const rat = platformRationale(p);
          const norm = Number(obj?.platform_norm_active_attention_seconds ?? 0) || 0;
          const predicted = obj?.predicted_creative_attention_seconds ?? null;
          const delta = obj?.delta_vs_norm_pct;
          const fit = Math.max(0, Math.min(100, Math.round(Number(obj?.fit_score ?? 0))));
          const colors = deltaColors(delta);
          const fitChip = fitScoreClasses(fit);

          return (
            <div key={`${name}-${i}`} className="space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-bold text-white truncate">{name}</span>
                  {obj?.fit_score != null ? (
                    <span
                      className={`shrink-0 inline-flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${fitChip.bg} ${fitChip.text}`}
                    >
                      Fit {fit}/100
                    </span>
                  ) : null}
                </div>
                {delta != null && Number.isFinite(delta) ? (
                  <span
                    className={`shrink-0 inline-flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${colors.delta.bg} ${colors.delta.text}`}
                  >
                    {delta > 0 ? `+${Math.round(delta)}%` : `${Math.round(delta)}%`}
                  </span>
                ) : null}
              </div>

              {norm > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="w-20 text-[10px] uppercase tracking-widest text-white/40 shrink-0 text-right">
                    Norm
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/30"
                      style={{ width: `${widthPct(norm)}%` }}
                    />
                  </div>
                  <span className="w-12 text-xs font-mono text-white/60 tabular-nums text-right shrink-0">
                    {norm.toFixed(1)}s
                  </span>
                </div>
              ) : null}

              {predicted != null ? (
                <div className="flex items-center gap-2">
                  <span className="w-20 text-[10px] uppercase tracking-widest text-white/60 shrink-0 text-right">
                    Predicted
                  </span>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
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
                    className="w-12 text-xs font-mono tabular-nums text-right shrink-0 font-bold"
                    style={{ color: colors.predicted }}
                  >
                    {predicted.toFixed(1)}s
                  </span>
                </div>
              ) : null}

              {rat ? (
                <p className="text-[12px] text-white/65 leading-relaxed">{rat}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default PlatformFitPanel;
