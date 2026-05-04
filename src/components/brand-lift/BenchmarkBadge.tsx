import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface Props {
  actual: number;
  benchmark: number;
  unit?: string;
  source?: string;
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Pass 25 Phase 1E — actual-vs-benchmark badge with delta + tooltip.
 */
export function BenchmarkBadge({ actual, benchmark, unit = '%', source, confidence = 'medium' }: Props) {
  const delta = actual - benchmark;
  const positive = delta >= 0;
  const Icon = delta === 0 ? Minus : positive ? TrendingUp : TrendingDown;
  const color = delta === 0 ? 'text-[var(--t2)]' : positive ? 'text-[var(--lime)]' : 'text-amber-400';
  const tooltip = `Benchmark: ${benchmark.toFixed(1)}${unit}${source ? ' · ' + source : ''}${confidence ? ' · confidence: ' + confidence : ''}`;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${color}`}
      title={tooltip}
    >
      <Icon className="w-3 h-3" />
      {positive ? '+' : ''}{delta.toFixed(1)}{unit}
      <Info className="w-3 h-3 opacity-50 ml-0.5" />
    </span>
  );
}

export default BenchmarkBadge;
