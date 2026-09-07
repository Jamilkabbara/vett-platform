/**
 * Recommended next missions: repeat-purchase cards (owner decision "c":
 * rule-based selection + the user's own context pre-filled).
 *
 * Self-contained: fetches its own narrow, OWNER-scoped mission slice (RLS), so
 * it renders nothing for an admin viewing someone else's mission (the nudge
 * targets the buyer), nothing on fetch failure, and nothing when the goal type
 * has no ladder. It can never break its host page.
 *
 * Three render variants for the three design systems it mounts into:
 *  - "premium": section 05 inside PremiumResults (scoped plain-CSS vocab).
 *    No `rv` reveal class on purpose: this section mounts AFTER the report's
 *    IntersectionObserver pass, so `rv` would leave it permanently invisible.
 *  - "cards": Tailwind card row above the MissionsListPage grid.
 *  - "rv2": a <Card> inside ResultsV2Page, so the section sits in that page's
 *    vocabulary rather than in a third hand-rolled one. Rows are a single
 *    <button> each (no interactive element nested inside another), and the
 *    text column is minmax(0,1fr) so a long `why` shrinks the column instead
 *    of pushing the row past the card.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, QHead } from '../results-v2/primitives';
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
  variant: 'premium' | 'cards' | 'rv2';
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

  if (variant === 'rv2') {
    return (
      <Card id="next-missions">
        <QHead
          eyebrow="Recommended next steps"
          title="Where to take this next"
          meta="Pre-filled from this mission"
        />
        <div className="mt-2 flex flex-col">
          {recs.map((rec, i) => (
            <button
              type="button"
              key={rec.goal}
              onClick={() => go(rec)}
              className="group grid w-full grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-2 border-b border-white/[0.07] py-[22px] text-left last:border-b-0 max-[680px]:grid-cols-[38px_minmax(0,1fr)]"
            >
              <span className="font-['Manrope',system-ui,sans-serif] text-[34px] font-extrabold leading-none text-[#BEF264] max-[680px]:text-[26px]">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="mb-[6px] block font-['Manrope',system-ui,sans-serif] text-[17px] font-bold text-[#F3F5EF]">
                  {rec.emoji} {rec.label}
                </span>
                <span className="block max-w-[70ch] text-[14px] text-[#8B919C]">{rec.why}</span>
              </span>
              <span className="flex flex-none items-center gap-2 text-[13px] font-semibold tracking-[0.04em] text-[#BEF264] max-[680px]:hidden">
                Set up
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </Card>
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
