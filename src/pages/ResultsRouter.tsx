import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ResultsPage } from './ResultsPage';
import { CreativeAttentionResultsPage } from './CreativeAttentionResultsPage';
import { BrandLiftResultsPage } from './BrandLiftResultsPage';
// Pass 29 B5 — pricing-research results page (Van Westendorp 4-curve
// + Gabor-Granger demand). Routed when goal_type === 'pricing'.
import { PricingResultsPage } from './PricingResultsPage';

/**
 * Pass 25 Phase 0.2 — central router for /results/:missionId.
 *
 * Probes mission.goal_type (lightweight single-column query) and dispatches
 * to the page that matches the mission family. Without this, every mission
 * type was rendered through the generic ResultsPage which only knows how
 * to display question/insight data — Creative Attention missions sat in
 * "still generating" forever because their data lives elsewhere.
 *
 * Both downstream pages do their own data fetching, so this component
 * stays minimal: probe → dispatch → render.
 *
 * Pass 25 Phase 1E: brand_lift routes to BrandLiftResultsPage.
 */
export function ResultsRouter() {
  const { missionId } = useParams<{ missionId: string }>();
  const [goalType, setGoalType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [probing, setProbing] = useState(true);

  useEffect(() => {
    if (!missionId) {
      setError('No mission ID provided.');
      setProbing(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('goal_type')
        .eq('id', missionId)
        .single();
      if (cancelled) return;
      if (fetchErr || !data) {
        setError('Mission not found.');
      } else {
        setGoalType(data.goal_type || 'general_research');
      }
      setProbing(false);
    })();
    return () => { cancelled = true; };
  }, [missionId]);

  if (probing) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--lime)] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 text-center px-5">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-bold text-[var(--t1)]">{error}</h2>
      </div>
    );
  }

  if (goalType === 'creative_attention') {
    return <CreativeAttentionResultsPage />;
  }
  if (goalType === 'brand_lift') {
    return <BrandLiftResultsPage />;
  }
  if (goalType === 'pricing') {
    return <PricingResultsPage />;
  }
  return <ResultsPage />;
}

export default ResultsRouter;
