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
  DistributionBarList,
  DistributionPieChart,
  RatingHistogram,
} from './charts';

interface Props {
  missionId: string | undefined;
}

/**
 * §F2 — a donut/legend (or Recharts bar axis) truncates sentence-length option
 * labels with "…". When labels are long, OR the split is degenerate (every
 * option tied — e.g. 5 unique reasons each n=1 → 5 equal slices), readable
 * labels beat slice geometry: render the wrapping bar LIST instead.
 */
function hasLongLabels(q: QuestionDistribution): boolean {
  const opts = Array.isArray(q.options) ? q.options : [];
  return opts.some((o) => {
    const s = String(o ?? '').trim();
    return s.length > 24 || s.split(/\s+/).length >= 5;
  });
}
function isDegenerate(q: QuestionDistribution): boolean {
  const c = (Array.isArray(q.counts) ? q.counts : []).filter((n) => n > 0);
  return c.length >= 4 && new Set(c).size === 1; // all tied
}

function pickChart(q: QuestionDistribution) {
  if (q.type === 'rating') return <RatingHistogram data={q} />;
  if (hasLongLabels(q) || isDegenerate(q)) return <DistributionBarList data={q} />;
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
