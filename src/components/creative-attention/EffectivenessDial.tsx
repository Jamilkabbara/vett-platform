import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import type { EffectivenessScore } from '../../types/creativeAnalysis';

/**
 * Pass 24 Bug 24.01 F2 — Creative Effectiveness Score dial.
 *
 * Renders a 0-100 radial bar (Recharts RadialBarChart) with the score
 * in the center, the band label below ("ELITE", "STRONG", etc.), and
 * a 1-2 sentence band explanation underneath.
 *
 * Color coded by band:
 *   elite   → lime
 *   strong  → emerald
 *   average → amber
 *   weak    → orange
 *   poor    → red
 *
 * The dial is a presentational component — parent passes the
 * EffectivenessScore object verbatim from creative_analysis.
 */

interface EffectivenessDialProps {
  effectiveness: EffectivenessScore;
}

const BAND_COLORS = {
  elite:   { fg: '#BEF264', bg: 'bg-lime-400/15',  border: 'border-lime-400/30',  label: 'text-lime-300' },
  strong:  { fg: '#34D399', bg: 'bg-emerald-400/15', border: 'border-emerald-400/30', label: 'text-emerald-300' },
  average: { fg: '#F59E0B', bg: 'bg-amber-400/15', border: 'border-amber-400/30', label: 'text-amber-300' },
  weak:    { fg: '#FB923C', bg: 'bg-orange-400/15', border: 'border-orange-400/30', label: 'text-orange-300' },
  poor:    { fg: '#EF4444', bg: 'bg-red-400/15',   border: 'border-red-400/30',   label: 'text-red-300' },
} as const;

const BAND_LABEL = {
  elite:   'Elite (top 10%)',
  strong:  'Strong',
  average: 'Average',
  weak:    'Weak',
  poor:    'Poor',
} as const;

export function EffectivenessDial({ effectiveness }: EffectivenessDialProps) {
  const score = Math.max(0, Math.min(100, Math.round(effectiveness.score)));
  const palette = BAND_COLORS[effectiveness.band] ?? BAND_COLORS.average;
  const data = [{ name: 'score', value: score, fill: palette.fg }];

  return (
    <div className={`rounded-2xl border ${palette.border} ${palette.bg} backdrop-blur-xl p-6`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Dial */}
        <div className="relative w-44 h-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="75%"
              outerRadius="100%"
              barSize={14}
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                background={{ fill: 'rgba(255,255,255,0.06)' }}
                dataKey="value"
                cornerRadius={8}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-5xl font-black tabular-nums" style={{ color: palette.fg }}>
              {score}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
              / 100
            </span>
          </div>
        </div>

        {/* Band + explanation */}
        <div className="flex-1 min-w-0 text-center md:text-left">
          <div className={`inline-block text-[11px] font-black uppercase tracking-[0.2em] ${palette.label}`}>
            {BAND_LABEL[effectiveness.band] ?? effectiveness.band}
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white mt-1.5 mb-2">
            Creative Effectiveness Score
          </h3>
          <p className="text-white/70 text-sm leading-relaxed">
            {effectiveness.band_explanation}
          </p>
        </div>
      </div>

      {/* Component breakdown — small bars under the dial */}
      <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 md:grid-cols-5 gap-3">
        {(
          [
            { key: 'attention',          label: 'Attention' },
            { key: 'emotion_intensity',  label: 'Emotion' },
            { key: 'brand_clarity',      label: 'Clarity' },
            { key: 'audience_resonance', label: 'Resonance' },
            { key: 'platform_fit',       label: 'Platform fit' },
          ] as const
        ).map(({ key, label }) => {
          const v = Math.max(0, Math.min(100, Math.round(effectiveness.components?.[key] ?? 0)));
          const w = Math.round((effectiveness.weights?.[key] ?? 0) * 100);
          return (
            <div key={key} className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-white/40 truncate">
                {label}
                <span className="ml-1 text-white/25 normal-case tracking-normal">({w}%)</span>
              </div>
              <div className="text-lg font-bold text-white tabular-nums mt-0.5">{v}</div>
              <div className="h-1 mt-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${v}%`, background: palette.fg }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EffectivenessDial;
