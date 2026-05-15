/**
 * Pass 36 A0d — Mission processing page.
 *
 * Stripe Checkout success_url now points here instead of /setup
 * (which was the May 11 demo failure UX — customer paid, landed
 * on a fresh setup form). This page polls mission status every
 * 5 seconds and auto-redirects to /results/{id} when status is
 * 'completed'. Shows step-by-step progress so customer knows
 * something's happening.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2, AlertCircle, ArrowLeft, CheckCircle2,
  Sparkles, Users, Brain,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OverlayPage } from '../components/layout/OverlayPage';
// Pass 42 E1 — live recruitment progress widget. Polls
// /api/missions/:id/progress every 5s. Hides itself once the
// recruitment loop has exited (target_hit or ceiling_hit).
import { RecruitmentProgress } from '../components/results/RecruitmentProgress';

interface MissionRow {
  id: string;
  title: string | null;
  status: string;
  goal_type: string | null;
  paid_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
}

type Stage = 'pending' | 'generating' | 'simulating' | 'synthesizing' | 'completed' | 'failed';

function stageFromMission(m: MissionRow | null): Stage {
  if (!m) return 'pending';
  if (m.status === 'completed') return 'completed';
  if (m.status === 'failed') return 'failed';
  const minutes = m.paid_at
    ? (Date.now() - new Date(m.paid_at).getTime()) / 60000
    : 0;
  if (minutes < 2) return 'generating';
  if (minutes < 8) return 'simulating';
  return 'synthesizing';
}

interface Step {
  id: Stage;
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { id: 'generating',   label: 'Generating questions',  icon: <Sparkles className="w-5 h-5" /> },
  { id: 'simulating',   label: 'Personas responding',   icon: <Users className="w-5 h-5" /> },
  { id: 'synthesizing', label: 'Computing insights',    icon: <Brain className="w-5 h-5" /> },
  { id: 'completed',    label: 'Mission complete',      icon: <CheckCircle2 className="w-5 h-5" /> },
];

const STAGE_ORDER: Record<Stage, number> = {
  pending: 0,
  generating: 1,
  simulating: 2,
  synthesizing: 3,
  completed: 4,
  failed: -1,
};

export function ProcessingPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const [mission, setMission] = useState<MissionRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) {
      setError('No mission ID provided.');
      return;
    }
    let cancelled = false;

    const fetchOnce = async () => {
      const { data, error: err } = await supabase
        .from('missions')
        .select('id, title, status, goal_type, paid_at, completed_at, failure_reason')
        .eq('id', missionId)
        .maybeSingle();
      if (cancelled) return;
      if (err || !data) {
        setError(err?.message || 'Mission not found.');
        return;
      }
      const row = data as MissionRow;
      setMission(row);
      if (row.status === 'completed') {
        navigate(`/results/${missionId}`, { replace: true });
      }
    };

    fetchOnce();
    const interval = setInterval(fetchOnce, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [missionId, navigate]);

  if (error) {
    return (
      <OverlayPage>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <h2 className="text-lg font-display font-bold text-t1">{error}</h2>
          <Link to="/missions" className="text-lime text-sm hover:underline mt-2">
            Back to missions
          </Link>
        </div>
      </OverlayPage>
    );
  }

  const stage = stageFromMission(mission);
  const stageIdx = STAGE_ORDER[stage] ?? 0;

  if (stage === 'failed') {
    return (
      <OverlayPage>
        <div className="max-w-xl mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-2xl font-display font-bold text-t1">Mission failed</h2>
          <p className="text-t3 text-sm leading-relaxed">
            {mission?.failure_reason
              ? `Reason: ${mission.failure_reason}`
              : 'An error occurred during processing. If your payment captured, you are automatically refunded within 24 hours.'}
          </p>
          <Link
            to={`/results/${missionId}`}
            className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/15 text-white font-display font-bold text-sm uppercase tracking-widest hover:bg-white/10"
          >
            View mission details
          </Link>
        </div>
      </OverlayPage>
    );
  }

  return (
    <OverlayPage>
      <div className="max-w-2xl mx-auto min-h-[60vh] flex flex-col justify-center space-y-8">
        <Link to="/missions" className="inline-flex items-center gap-1.5 text-t3 hover:text-t1 text-xs self-start">
          <ArrowLeft className="w-3.5 h-3.5" /> All missions
        </Link>

        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-lime font-display font-bold">
            Mission in progress
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter text-t1">
            {mission?.title || 'Processing your mission…'}
          </h1>
          <p className="text-t3 text-sm leading-relaxed">
            We&apos;ll redirect you to your results when this completes — usually 5-15 minutes.
            You can also leave this page; we&apos;ll email you when ready.
          </p>
        </div>

        {/* Pass 42 E1 — live recruitment progress. Hides itself once
            target_hit / ceiling_hit so the step view below takes over
            during the synthesis phase. */}
        {missionId && <RecruitmentProgress missionId={missionId} />}

        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isDone = stageIdx > STAGE_ORDER[step.id];
            const isActive = stageIdx === STAGE_ORDER[step.id];
            return (
              <div
                key={step.id}
                className={[
                  'flex items-center gap-3 p-4 rounded-xl border',
                  isActive ? 'bg-lime/5 border-lime/40' :
                  isDone   ? 'bg-bg2 border-b1' :
                             'bg-bg2 border-b1 opacity-50',
                ].join(' ')}
              >
                <div className={[
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  isActive ? 'bg-lime text-black' :
                  isDone   ? 'bg-lime/20 text-lime' :
                             'bg-bg3 text-t3',
                ].join(' ')}>
                  {isActive ? <Loader2 className="w-5 h-5 animate-spin" /> :
                   isDone   ? <CheckCircle2 className="w-5 h-5" /> :
                              step.icon}
                </div>
                <div className="flex-1">
                  <p className={[
                    'font-display font-bold text-sm',
                    isActive ? 'text-lime' :
                    isDone   ? 'text-t1' :
                               'text-t3',
                  ].join(' ')}>
                    {step.label}
                    {i < STEPS.length - 1 && isActive && ' …'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OverlayPage>
  );
}

export default ProcessingPage;
