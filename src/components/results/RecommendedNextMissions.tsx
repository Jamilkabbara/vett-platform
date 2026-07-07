/**
 * Recommended next missions: repeat-purchase cards (owner decision "c":
 * rule-based selection + the user's own context pre-filled).
 *
 * Self-contained: fetches its own narrow, OWNER-scoped mission slice (RLS), so
 * it renders nothing for an admin viewing someone else's mission (the nudge
 * targets the buyer), nothing on fetch failure, and nothing when the goal type
 * has no ladder. It can never break its host page.
 *
 * Two render variants for the two design systems it mounts into:
 *  - "premium": section 05 inside PremiumResults (scoped plain-CSS vocab).
 *    No `rv` reveal class on purpose: this section mounts AFTER the report's
 *    IntersectionObserver pass, so `rv` would leave it permanently invisible.
 *  - "cards": Tailwind card row above the MissionsListPage grid.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  buildNextMissions, stageNextMission,
  type MissionContextRow, type NextMission,
} from '../../lib/nextMissions';

const CONTEXT_SELECT =
  'goal_type, title, brief, brand_name, category, audience_description, competitor_brands';

export function RecommendedNextMissions({
  missionId,
  variant,
}: {
  missionId: string;
  variant: 'premium' | 'cards';
}) {
  const navigate = useNavigate();
  const [recs, setRecs] = useState<NextMission[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('missions')
          .select(CONTEXT_SELECT)
          .eq('id', missionId)
          .maybeSingle();
        if (cancelled || !data) return;
        setRecs(buildNextMissions(data as MissionContextRow));
      } catch { /* hide the section on any failure */ }
    })();
    return () => { cancelled = true; };
  }, [missionId]);

  if (recs.length === 0) return null;

  const go = (rec: NextMission) => navigate(stageNextMission(rec));

  if (variant === 'premium') {
    return (
      <>
        <div className="sec-h">
          <span className="n serif">05</span>
          <h2>Recommended next steps</h2>
          <span className="meta mono">pre-filled from this mission</span>
        </div>
        <div className="recs">
          {recs.map((rec, i) => (
            <div
              className="rec"
              key={rec.goal}
              role="button"
              tabIndex={0}
              onClick={() => go(rec)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(rec); } }}
              style={{ cursor: 'pointer' }}
            >
              <span className="ix serif">{i + 1}</span>
              <div style={{ flex: 1 }}>
                <h4>{rec.emoji} {rec.label}</h4>
                <p>{rec.why}</p>
              </div>
              <button type="button" className="btn" onClick={(e) => { e.stopPropagation(); go(rec); }}>
                Set up
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  // "cards": Tailwind row for MissionsListPage.
  return (
    <div className="mb-8">
      <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-3">
        Recommended next missions
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recs.map((rec) => (
          <button
            type="button"
            key={rec.goal}
            onClick={() => go(rec)}
            className="text-left bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-primary/30 transition-all cursor-pointer group backdrop-blur-xl"
          >
            <p className="text-white font-bold text-[15px] mb-1">{rec.emoji} {rec.label}</p>
            <p className="text-white/50 text-sm leading-snug mb-3">{rec.why}</p>
            <span className="flex items-center gap-2 text-primary text-sm font-bold group-hover:translate-x-1 transition-transform">
              Set up in one click <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default RecommendedNextMissions;
