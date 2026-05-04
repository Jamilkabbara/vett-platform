export interface CompetitorRow {
  brand: string;
  awareness: number;
  consideration: number;
  intent: number;
  isFocal?: boolean; // the buyer's brand
}

interface Props {
  rows: CompetitorRow[];
}

/**
 * Pass 25 Phase 1E — side-by-side bar charts comparing the focal brand
 * to its competitors on awareness, consideration, intent.
 */
export function CompetitorComparison({ rows }: Props) {
  if (!rows.length) {
    return (
      <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--t1)]">Competitor Comparison</h3>
        <p className="text-xs text-[var(--t3)] mt-2">No competitor data yet.</p>
      </section>
    );
  }
  const metrics = [
    { key: 'awareness' as const,     label: 'Aided awareness' },
    { key: 'consideration' as const, label: 'Consideration' },
    { key: 'intent' as const,        label: 'Purchase intent' },
  ];
  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <header>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Competitor Comparison</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">Your brand vs. competitors across the funnel</p>
      </header>
      <div className="grid sm:grid-cols-3 gap-4">
        {metrics.map(({ key, label }) => {
          const max = Math.max(...rows.map(r => r[key] || 0)) || 1;
          return (
            <div key={key}>
              <div className="text-[11px] text-[var(--t3)] mb-1.5 uppercase tracking-wider">{label}</div>
              <div className="space-y-1.5">
                {rows.map(r => {
                  const w = ((r[key] || 0) / max) * 100;
                  return (
                    <div key={r.brand} className="flex items-center gap-2 text-xs">
                      <span className={`w-20 truncate ${r.isFocal ? 'text-[var(--lime)] font-semibold' : 'text-[var(--t2)]'}`}>
                        {r.brand}
                      </span>
                      <div className="flex-1 h-3 bg-[var(--bg3)] rounded relative">
                        <div
                          className={`absolute top-0 left-0 h-full rounded ${r.isFocal ? 'bg-[var(--lime)]' : 'bg-[var(--t2)]'}`}
                          style={{ width: `${w}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--t2)] tabular-nums w-8 text-right">
                        {(r[key] || 0).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CompetitorComparison;
