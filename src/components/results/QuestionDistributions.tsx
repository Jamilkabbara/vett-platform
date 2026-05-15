/**
 * Pass 42 C2 — universal "Response Distributions" section.
 *
 * Reads chart_data via useChartData (B3 hook). For each
 * per_question_distribution, picks the right chart variant:
 *   - rating   → RatingHistogram (vertical bars with mean line)
 *   - >5 opts  → DistributionBarChart (horizontal bars)
 *   - ≤5 opts  → DistributionPieChart (donut)
 *
 * Loading: skeleton shimmer at full height so layout doesn't jump.
 * Empty:   returns null so the section disappears cleanly when the
 *          mission has no chart_data (very small sample, all-text
 *          questions, or chart_data block deliberately omitted).
 */
import {
  useChartData,
  type QuestionDistribution,
} from '../../hooks/useChartData';
import {
  DistributionBarChart,
  DistributionPieChart,
  RatingHistogram,
} from './charts';

interface Props {
  missionId: string | undefined;
}

function pickChart(q: QuestionDistribution) {
  if (q.type === 'rating') return <RatingHistogram data={q} />;
  if (Array.isArray(q.options) && q.options.length > 5) return <DistributionBarChart data={q} />;
  return <DistributionPieChart data={q} />;
}

export function QuestionDistributions({ missionId }: Props) {
  const { data, loading, error } = useChartData(missionId);

  if (loading) {
    return (
      <div className="rounded-2xl bg-bg2 border border-b1 p-6">
        <div className="h-3 w-32 bg-white/5 rounded animate-pulse mb-4" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-60 bg-white/[0.03] rounded-xl animate-pulse" />
          <div className="h-60 bg-white/[0.03] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }
  if (error) return null;
  const items = data?.per_question_distributions;
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-6">
      <h2 className="text-xs font-display font-black text-lime uppercase tracking-widest mb-4">
        Response Distributions
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((q) => (
          <div key={q.question_id}>{pickChart(q)}</div>
        ))}
      </div>
    </div>
  );
}
