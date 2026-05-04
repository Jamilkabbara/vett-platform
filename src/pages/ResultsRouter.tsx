import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ResultsPage } from './ResultsPage';
import { CreativeAttentionResultsPage } from './CreativeAttentionResultsPage';

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
 * TODO Pass 25 Phase 1: route to BrandLiftResultsPage when goal_type === 'brand_lift'.
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

  // brand_lift will route to BrandLiftResultsPage in Phase 1; for now falls
  // through to the generic ResultsPage so existing brand_lift missions
  // stay readable.
  return <ResultsPage />;
}

export default ResultsRouter;
