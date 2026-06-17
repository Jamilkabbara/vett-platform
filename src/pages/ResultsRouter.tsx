import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CreativeAttentionResultsPage } from './CreativeAttentionResultsPage';
// WO — the universal premium results shell. Reads the ONE canonical report and
// leads with the methodology's signature hero (Centerpiece). Every survey
// methodology routes here; the per-type bespoke pages it replaces (CSAT,
// Pricing, Roadmap, Compare, AdTesting, Competitor, Naming, Churn, BrandLift,
// Validate, Research, generic) are superseded by shell + Centerpiece + the
// insight-led question body, so web and the exports can't drift.
import { PremiumResults } from '../components/results/premium/PremiumResults';

/**
 * Central router for /results/:missionId.
 *
 * Probes mission.goal_type, then dispatches:
 *   - creative_attention → its bespoke page (different data model —
 *     creative_analysis frames/emotion, not the survey canonical report;
 *     resurrection track owns its showcase rebuild).
 *   - everything else    → the universal PremiumResults shell.
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
  return <PremiumResults missionId={missionId!} />;
}

export default ResultsRouter;
