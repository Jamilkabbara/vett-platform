export interface GeoRow {
  region: string;
  brand_lift: number;
  n: number;
}

interface Props {
  rows: GeoRow[];
}

/**
 * Pass 25 Phase 1E — geographic breakdown. Bar list (no map; full map
 * widget deferred to a follow-up). Highlights top + bottom regions.
 */
export function GeographicBreakdown({ rows }: Props) {
  if (!rows.length) {
    return (
      <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--t1)]">Geographic Breakdown</h3>
        <p className="text-xs text-[var(--t3)] mt-2">Single-market mission — geographic breakdown skipped.</p>
      </section>
    );
  }
  const sorted = [...rows].sort((a, b) => b.brand_lift - a.brand_lift);
  const max = Math.max(...sorted.map(r => Math.abs(r.brand_lift))) || 1;
  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <header>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Geographic Breakdown</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">Brand lift by region · {sorted.length} markets</p>
      </header>
      <div className="space-y-1.5">
        {sorted.map((r, i) => {
          const isTop = i === 0;
          const isBottom = i === sorted.length - 1 && sorted.length > 1;
          const accent = isTop ? 'text-[var(--lime)]' : isBottom ? 'text-amber-400' : 'text-[var(--t1)]';
          return (
            <div key={r.region} className="grid grid-cols-[100px_1fr_auto_auto] gap-3 items-center text-xs">
              <span className="text-[var(--t2)]">{r.region}</span>
              <div className="relative h-4 bg-[var(--bg3)] rounded">
                <div
                  className={`absolute top-0 left-0 h-full rounded ${isTop ? 'bg-[var(--lime)]' : isBottom ? 'bg-amber-400' : 'bg-[var(--t2)]'}`}
                  style={{ width: `${(Math.abs(r.brand_lift) / max) * 100}%` }}
                />
              </div>
              <span className={`text-[11px] tabular-nums font-semibold w-12 text-right ${accent}`}>
                +{r.brand_lift.toFixed(1)}%
              </span>
              <span className="text-[10px] text-[var(--t3)] w-12 text-right">n={r.n}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default GeographicBreakdown;
