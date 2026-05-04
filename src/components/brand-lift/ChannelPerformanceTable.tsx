export interface ChannelPerf {
  id: string;
  display_name: string;
  category: string;
  ad_recall: number;
  brand_lift: number;
  insight?: string;
}

interface Props {
  channels: ChannelPerf[];
}

/**
 * Pass 25 Phase 1E — per-channel breakdown with AI insights. Top
 * performers lime, underperformers amber.
 */
export function ChannelPerformanceTable({ channels }: Props) {
  if (!channels.length) {
    return (
      <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--t1)]">Channel Performance</h3>
        <p className="text-xs text-[var(--t3)] mt-2">No channel data yet.</p>
      </section>
    );
  }
  const sorted = [...channels].sort((a, b) => b.brand_lift - a.brand_lift);
  const median = sorted[Math.floor(sorted.length / 2)]?.brand_lift ?? 0;

  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <header>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Channel Performance</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">Brand lift contribution by channel · sorted by lift</p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--t3)] border-b border-[var(--b1)]">
              <th className="text-left py-2 font-medium">Channel</th>
              <th className="text-right py-2 font-medium">Ad recall</th>
              <th className="text-right py-2 font-medium">Brand lift</th>
              <th className="text-left py-2 font-medium pl-3">Insight</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => {
              const top = c.brand_lift > median;
              return (
                <tr key={c.id} className="border-b border-[var(--b1)]/50">
                  <td className="py-2.5 text-[var(--t1)]">{c.display_name}</td>
                  <td className="py-2.5 text-right text-[var(--t2)] tabular-nums">{c.ad_recall.toFixed(0)}%</td>
                  <td className={`py-2.5 text-right font-semibold tabular-nums ${top ? 'text-[var(--lime)]' : 'text-amber-400'}`}>
                    +{c.brand_lift.toFixed(1)}%
                  </td>
                  <td className="py-2.5 pl-3 text-[var(--t3)] text-[11px]">{c.insight || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ChannelPerformanceTable;
