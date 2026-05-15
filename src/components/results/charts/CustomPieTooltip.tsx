/**
 * Pass 42 C1 — extracted from src/pages/ResultsPage.tsx line 1113.
 * Recharts custom tooltip used by DistributionPieChart and
 * SentimentBreakdown donut. Renders the slice name + value in a
 * brand-styled card.
 */
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

export function CustomPieTooltip({
  active,
  payload,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  return (
    <div className="bg-[#1e293b]/90 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-3">
      <p className="text-white font-bold text-sm mb-1">{String(data.name ?? '')}</p>
      <p className="text-primary font-bold text-lg">{String(data.value ?? '')}</p>
    </div>
  );
}
