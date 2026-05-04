import type { CreativeAnalysis } from '../../types/creativeAnalysis';
import { EmotionRadar } from '../creative-attention/EmotionRadar';
import { AttentionBlock } from '../creative-attention/AttentionBlock';

interface Props {
  analysis: CreativeAnalysis | null;
}

/**
 * Pass 25 Phase 1E — when a creative was uploaded for the brand-lift
 * mission, surface the same Pass 24 Bug 24.01 components used on the
 * /creative-results page so users get likeability + emotion + attention
 * + brand-attribution diagnostics in-line with their lift report.
 *
 * Renders nothing if no creative_analysis is on the mission.
 */
export function CreativeDiagnostic({ analysis }: Props) {
  if (!analysis) return null;
  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-6">
      <header>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Creative Diagnostic</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">From the uploaded campaign creative</p>
      </header>
      {analysis.attention && <AttentionBlock attention={analysis.attention} />}
      {Array.isArray(analysis.frame_analyses) && analysis.frame_analyses.length > 0 && (
        <EmotionRadar frameAnalyses={analysis.frame_analyses} />
      )}
    </section>
  );
}

export default CreativeDiagnostic;
