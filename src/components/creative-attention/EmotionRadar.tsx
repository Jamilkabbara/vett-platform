import { useState, useMemo } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import {
  EMOTION_TAXONOMY_V2,
  EMOTION_COLORS_V2,
  EMOTION_VALENCE,
  type EmotionV2,
  type FrameAnalysis,
} from '../../types/creativeAnalysis';

/**
 * Pass 24 Bug 24.01 F4 — 24-emotion radar chart.
 *
 * Aggregates emotion scores across all frame analyses (averaging
 * for video, single-frame for static image) and renders them on
 * a Recharts RadarChart.
 *
 * UI behavior:
 *   - By default, top 8 emotions (by average score) are highlighted
 *     on the chart and shown as a legend.
 *   - "Show all 24 emotions" toggle expands to render the full
 *     ring + a small grid of all emotion values below.
 *
 * Component is presentational — parent passes the frame_analyses
 * array and (optionally) emotion_peaks for cross-reference.
 */

interface EmotionRadarProps {
  frameAnalyses: FrameAnalysis[];
}

/**
 * Average each emotion across the frame array. Missing keys default
 * to 0. Returns scores keyed by EmotionV2 name.
 */
function averageEmotions(frames: FrameAnalysis[]): Record<EmotionV2, number> {
  const out = {} as Record<EmotionV2, number>;
  for (const e of EMOTION_TAXONOMY_V2) out[e] = 0;
  if (!frames || frames.length === 0) return out;
  for (const f of frames) {
    for (const e of EMOTION_TAXONOMY_V2) {
      const v = Number(f.emotions?.[e]);
      if (Number.isFinite(v)) out[e] += v;
    }
  }
  for (const e of EMOTION_TAXONOMY_V2) {
    out[e] = Math.round(out[e] / frames.length);
  }
  return out;
}

const VALENCE_LABEL_COLORS = {
  positive: 'text-lime-300',
  neutral:  'text-purple-300',
  negative: 'text-red-300',
} as const;

export function EmotionRadar({ frameAnalyses }: EmotionRadarProps) {
  const [showAll, setShowAll] = useState(false);

  const averaged = useMemo(() => averageEmotions(frameAnalyses), [frameAnalyses]);

  // Top 8 by average score for the default view.
  const top8 = useMemo(() => {
    return [...EMOTION_TAXONOMY_V2]
      .sort((a, b) => averaged[b] - averaged[a])
      .slice(0, 8);
  }, [averaged]);

  const visibleEmotions: readonly EmotionV2[] = showAll ? EMOTION_TAXONOMY_V2 : top8;

  // Recharts-friendly shape.
  const chartData = visibleEmotions.map((e) => ({
    emotion: e,
    score: averaged[e] ?? 0,
  }));

  // Stable color from the v2 palette — use the first visible emotion's
  // color as the radar fill, but with reduced alpha so the grid reads.
  const radarFill = '#A78BFA'; // violet — neutral default
  const radarStroke = '#A78BFA';

  // Detect "no signal" case: all 24 emotions averaged to 0. Skip render
  // (parent decides what to show in its place).
  const hasSignal = Object.values(averaged).some((v) => v > 0);

  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
      <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
            <Heart className="w-5 h-5 text-purple-300" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Emotional Profile</h2>
            <p className="text-white/40 text-xs">
              {showAll
                ? '24 emotions (Plutchik 8 basic + 16 nuanced research-derived)'
                : `Top 8 of 24 emotions ranked by average score`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-purple-200 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 transition-colors"
        >
          {showAll ? (
            <>
              Show top 8 <ChevronUp className="w-3.5 h-3.5" aria-hidden />
            </>
          ) : (
            <>
              Show all 24 emotions <ChevronDown className="w-3.5 h-3.5" aria-hidden />
            </>
          )}
        </button>
      </header>

      {!hasSignal ? (
        <p className="text-sm text-white/40 italic py-12 text-center">
          No emotional signal detected in this creative. The AI scored every
          emotion at 0, suggesting a flat affective read.
        </p>
      ) : (
        <>
          <div className="h-72 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="emotion"
                  tick={({ payload, x, y, textAnchor }) => {
                    const e = payload.value as EmotionV2;
                    const color = EMOTION_COLORS_V2[e] ?? '#FFFFFF';
                    return (
                      <text
                        x={x}
                        y={y}
                        fill={color}
                        textAnchor={textAnchor}
                        fontSize={10}
                        fontWeight={600}
                      >
                        {e}
                      </text>
                    );
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.05)"
                />
                <Radar
                  dataKey="score"
                  stroke={radarStroke}
                  fill={radarFill}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number | undefined) => [`${value ?? 0} / 100`, 'Score'] as [string, string]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 dominant emotions list — always visible */}
          <div className="mt-5 pt-5 border-t border-white/10">
            <h3 className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-3">
              Top 5 dominant emotions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {top8.slice(0, 5).map((e) => {
                const v = averaged[e];
                const color = EMOTION_COLORS_V2[e];
                const valenceClass = VALENCE_LABEL_COLORS[EMOTION_VALENCE[e]];
                return (
                  <div
                    key={e}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className={`text-[10px] uppercase tracking-widest font-bold ${valenceClass}`}>
                      {e}
                    </div>
                    <div className="mt-1 text-lg font-bold tabular-nums" style={{ color }}>
                      {v}
                    </div>
                    <div className="h-1 mt-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${v}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {showAll ? (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
              {EMOTION_TAXONOMY_V2.slice(8).map((e) => {
                const v = averaged[e];
                return (
                  <div
                    key={e}
                    className="flex items-center justify-between gap-1 px-2 py-1 rounded text-[11px]"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className="text-white/60 truncate">{e}</span>
                    <span
                      className="tabular-nums font-semibold"
                      style={{ color: EMOTION_COLORS_V2[e] }}
                    >
                      {v}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export default EmotionRadar;
