import { BenchmarkBadge } from './BenchmarkBadge';

export interface FunnelStage {
  id: string;
  label: string;
  value: number;
  benchmark?: number;
}

interface Props {
  stages: FunnelStage[];
  preStages?: FunnelStage[]; // for pre_post comparison
}

/**
 * Pass 25 Phase 1E — horizontal funnel bars with benchmark deltas.
 * Single-wave: just one row of bars. pre_post: pre/post side-by-side.
 */
export function FunnelVisualization({ stages, preStages }: Props) {
  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <header>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Funnel Performance</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">Brand-lift signal at every stage of the funnel</p>
      </header>
      <div className="space-y-2">
        {stages.map((s, i) => {
          const pre = preStages?.[i];
          return (
            <div key={s.id} className="grid grid-cols-[160px_1fr_auto] gap-3 items-center text-xs">
              <span className="text-[var(--t2)] truncate">{s.label}</span>
              <div className="relative h-5 bg-[var(--bg3)] rounded">
                {pre && (
                  <div
                    className="absolute top-0 left-0 h-full bg-[var(--t3)]/30 rounded-l"
                    style={{ width: `${Math.max(0, Math.min(100, pre.value))}%` }}
                  />
                )}
                <div
                  className="absolute top-0 left-0 h-full bg-[var(--lime)] rounded"
                  style={{ width: `${Math.max(0, Math.min(100, s.value))}%` }}
                />
              </div>
              <div className="flex items-center gap-2 justify-end min-w-[110px]">
                <span className="text-[var(--t1)] font-semibold tabular-nums">{s.value.toFixed(0)}%</span>
                {s.benchmark != null && (
                  <BenchmarkBadge actual={s.value} benchmark={s.benchmark} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {preStages && (
        <p className="text-[11px] text-[var(--t3)]">Pre-launch values shown as ghost bars.</p>
      )}
    </section>
  );
}

export default FunnelVisualization;
