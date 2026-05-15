/**
 * Pass 42 C4 — UniversalCharts wrapper.
 *
 * Bundles the three universal chart sections into one drop-in
 * component so each methodology renderer only needs to add a
 * single import + one JSX line. Each child returns null when its
 * data isn't present, so absent chart_data → wrapper renders
 * nothing visible.
 *
 * Wrapped in InsightErrorBoundary individually inside each so a
 * render failure in one section degrades just that section.
 *
 * Position spec: drop into each renderer's main content area at the
 * end (or after the executive-summary block when reasonable). The
 * order below puts sentiment first (overview), then distribution
 * detail, then segments.
 */
import { InsightErrorBoundary } from '../shared/InsightErrorBoundary';
import { SentimentBreakdown } from './SentimentBreakdown';
import { QuestionDistributions } from './QuestionDistributions';
import { SegmentComparison } from './SegmentComparison';

interface Props {
  missionId: string | undefined;
}

export function UniversalCharts({ missionId }: Props) {
  if (!missionId) return null;
  return (
    <div className="space-y-6">
      <InsightErrorBoundary label="Sentiment Breakdown">
        <SentimentBreakdown missionId={missionId} />
      </InsightErrorBoundary>
      <InsightErrorBoundary label="Response Distributions">
        <QuestionDistributions missionId={missionId} />
      </InsightErrorBoundary>
      <InsightErrorBoundary label="Segment Comparison">
        <SegmentComparison missionId={missionId} />
      </InsightErrorBoundary>
    </div>
  );
}
