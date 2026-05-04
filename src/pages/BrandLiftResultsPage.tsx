import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';
import {
  BrandLiftScoreDial,
  FunnelVisualization,
  ChannelPerformanceTable,
  ChannelFilterDropdown,
  GeographicBreakdown,
  CreativeDiagnostic,
  CompetitorComparison,
  AIRecommendationCard,
  WaveComparison,
} from '../components/brand-lift/results';

/**
 * Pass 25 Phase 1E — Brand Lift Study v2 results page.
 *
 * Wired into ResultsRouter for goal_type === 'brand_lift'. Renders the
 * 10 Phase 1E components on a single dashboard. Channel filter is lifted
 * here so all sub-sections re-render when the user filters.
 *
 * Data shape (read directly from the missions row + downstream
 * aggregator) is documented inline. Heavy aggregation lives on the
 * server; this page treats the mission record as the source of truth
 * for shape and reads `mission.brand_lift_results` (jsonb) for the
 * pre-aggregated score / funnel / channel / geo / competitor / waves /
 * recommendations payload. Older brand_lift missions without that
 * payload fall through to a friendly "results pending" state.
 */
export function BrandLiftResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('*')
        .eq('id', missionId)
        .single();
      if (fetchErr || !data) {
        setError('Mission not found');
      } else {
        setMission(data);
      }
      setLoading(false);
    })();
  }, [missionId]);

  const blr = useMemo(() => {
    const r = (mission?.brand_lift_results || null) as null | {
      score?: number;
      band_explanation?: string;
      funnel?: Array<{ id: string; label: string; value: number; benchmark?: number }>;
      pre_funnel?: Array<{ id: string; label: string; value: number; benchmark?: number }>;
      channels?: Array<{ id: string; display_name: string; category: string; ad_recall: number; brand_lift: number; insight?: string }>;
      geography?: Array<{ region: string; brand_lift: number; n: number }>;
      competitors?: Array<{ brand: string; awareness: number; consideration: number; intent: number; isFocal?: boolean }>;
      waves?: Array<{ label: string; values: Array<{ kpi: string; value: number }> }>;
      wave_synthesis?: string;
      recommendations?: Array<{ title: string; body: string; confidence: 'high' | 'medium' | 'low'; explanation?: string }>;
    };
    return r;
  }, [mission]);

  const filteredChannels = useMemo(() => {
    const all = blr?.channels || [];
    if (!channelFilter) return all;
    return all.filter(c => c.id === channelFilter);
  }, [blr, channelFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--lime)] animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-bold text-[var(--t1)]">{error}</h2>
      </div>
    );
  }
  if (!blr) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5 text-center">
        <Logo />
        <p className="text-sm text-[var(--t2)] mt-4">Brand Lift report still generating.</p>
        <p className="text-xs text-[var(--t3)] max-w-md">
          This page updates automatically when the synthesis pipeline finishes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo />
        <ChannelFilterDropdown
          channels={(blr.channels || []).map(c => ({ id: c.id, display_name: c.display_name }))}
          value={channelFilter}
          onChange={setChannelFilter}
        />
      </header>
      <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
        <BrandLiftScoreDial score={blr.score || 0} bandExplanation={blr.band_explanation} />
        {blr.funnel && (
          <FunnelVisualization stages={blr.funnel} preStages={blr.pre_funnel} />
        )}
        <ChannelPerformanceTable channels={filteredChannels} />
        <GeographicBreakdown rows={blr.geography || []} />
        <CreativeDiagnostic analysis={(mission?.creative_analysis || null) as never} />
        {blr.competitors && <CompetitorComparison rows={blr.competitors} />}
        {blr.waves && blr.waves.length >= 2 && (
          <WaveComparison waves={blr.waves} synthesis={blr.wave_synthesis} />
        )}
        {blr.recommendations && blr.recommendations.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--t1)] px-1">AI Recommendations</h3>
            {blr.recommendations.slice(0, 5).map((r, i) => (
              <AIRecommendationCard key={i} rec={r} index={i} />
            ))}
          </section>
        )}

        <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
          Benchmarks are AI-estimated based on category norms. They are directional, not validated panel data. Use for orientation, not absolute claims.
        </p>
      </div>
    </div>
  );
}

export default BrandLiftResultsPage;
