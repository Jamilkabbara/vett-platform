import { ArrowRight } from 'lucide-react';

export interface WaveSnapshot {
  label: string; // e.g. "Pre-launch", "Post-launch"
  values: { kpi: string; value: number }[];
}

interface Props {
  waves: WaveSnapshot[];
  synthesis?: string;
}

/**
 * Pass 25 Phase 1E — pre/post or multi-wave comparison. Delta arrows
 * between adjacent waves; AI synthesis at the bottom.
 */
export function WaveComparison({ waves, synthesis }: Props) {
  if (waves.length < 2) {
    return (
      <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--t1)]">Wave Comparison</h3>
        <p className="text-xs text-[var(--t3)] mt-2">Available once a second wave completes.</p>
      </section>
    );
  }
  const allKpis = Array.from(new Set(waves.flatMap(w => w.values.map(v => v.kpi))));
  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <header>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Wave Comparison</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">{waves.length} waves · pre vs. post deltas</p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--t3)] border-b border-[var(--b1)]">
              <th className="text-left py-2 font-medium">KPI</th>
              {waves.map(w => (
                <th key={w.label} className="text-right py-2 font-medium px-3">{w.label}</th>
              ))}
              <th className="text-right py-2 font-medium pl-3">Δ</th>
            </tr>
          </thead>
          <tbody>
            {allKpis.map(kpi => {
              const series = waves.map(w => w.values.find(v => v.kpi === kpi)?.value ?? 0);
              const first = series[0];
              const last = series[series.length - 1];
              const delta = last - first;
              const positive = delta >= 0;
              return (
                <tr key={kpi} className="border-b border-[var(--b1)]/50">
                  <td className="py-2.5 text-[var(--t1)]">{kpi}</td>
                  {series.map((v, i) => (
                    <td key={i} className="text-right py-2.5 px-3 text-[var(--t2)] tabular-nums">{v.toFixed(1)}%</td>
                  ))}
                  <td className={`text-right py-2.5 pl-3 tabular-nums font-semibold ${positive ? 'text-[var(--lime)]' : 'text-amber-400'}`}>
                    {positive ? '+' : ''}{delta.toFixed(1)}
                    <ArrowRight className="w-3 h-3 inline ml-1" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {synthesis && (
        <p className="text-xs text-[var(--t2)] bg-[var(--bg3)] rounded p-3 leading-relaxed">{synthesis}</p>
      )}
    </section>
  );
}

export default WaveComparison;
