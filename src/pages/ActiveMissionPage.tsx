import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Users, Clock, Activity, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { AuthedTopNav } from '../components/layout/AuthedTopNav';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─────────────────────────────────────────────────────────────────────
// ActiveMissionPage — the post-payment landing page.
//
// Prompt 4 Phase 2 (this file's baseline): scaffold the shell per
// prototype.html. Shows mission hero, progress bar, 4 metrics cards,
// live ticker placeholder, first 3 questions preview, disabled
// "View Results" CTA.
//
// Polls `public.missions` every 3s for status + response rollup. The
// real ticker (Supabase Realtime on `mission_responses`) lands in
// Prompt 4 Phase 3; this file exposes the hook points so Phase 3 is
// a purely additive diff.
// ─────────────────────────────────────────────────────────────────────

interface MissionQuestion {
  id: string;
  text: string;
  type?: string;
}

interface MissionRow {
  id: string;
  title: string | null;
  status: string;
  brief: string | null;
  goal_type: string | null;
  respondent_count: number;
  questions: MissionQuestion[] | null;
  paid_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'pending'; mission: MissionRow; responsesCollected: number }
  | { kind: 'completed'; mission: MissionRow; responsesCollected: number };

const POLL_INTERVAL_MS = 3000;

const formatEta = (collected: number, target: number, startedAt: string | null): string => {
  if (target <= 0) return '—';
  if (collected >= target) return 'Done';
  if (!startedAt) return 'Calculating…';
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return 'Calculating…';
  const elapsedMs = Date.now() - started;
  if (elapsedMs < 5_000 || collected === 0) return 'Calculating…';
  const perResponseMs = elapsedMs / collected;
  const remainingMs = perResponseMs * (target - collected);
  const mins = Math.max(1, Math.round(remainingMs / 60_000));
  if (mins < 60) return `~${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `~${hrs}h ${rem}m` : `~${hrs}h`;
};

export const ActiveMissionPage = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [state, setState] = useState<State>({ kind: 'loading' });
  const cancelledRef = useRef(false);

  // Fetch mission + current response count. Used by both initial load
  // and the 3s poll. Kept in a ref-stable callback so the effect can
  // invoke it without re-running on every render.
  const fetchMissionSnapshot = useCallback(async () => {
    if (!missionId || !user) return;

    const { data: mission, error: mErr } = await supabase
      .from('missions')
      .select(
        'id, title, status, brief, goal_type, respondent_count, questions, paid_at, started_at, completed_at',
      )
      .eq('id', missionId)
      .eq('user_id', user.id)
      .maybeSingle<MissionRow>();

    if (cancelledRef.current) return;

    if (mErr) {
      setState({ kind: 'error', message: mErr.message || 'Could not load mission.' });
      return;
    }
    if (!mission) {
      setState({ kind: 'error', message: 'Mission not found.' });
      return;
    }

    // Count distinct personas that have submitted answers. Each
    // persona emits one row per question, so a naive COUNT(*) would
    // wildly over-report. We ask Supabase for distinct persona_ids.
    const { data: rows, error: rErr } = await supabase
      .from('mission_responses')
      .select('persona_id')
      .eq('mission_id', mission.id);

    if (cancelledRef.current) return;

    let responsesCollected = 0;
    if (!rErr && rows) {
      const seen = new Set<string>();
      for (const r of rows as Array<{ persona_id: string }>) {
        if (r.persona_id) seen.add(r.persona_id);
      }
      responsesCollected = seen.size;
    }

    const target = mission.respondent_count || 0;
    const isComplete =
      mission.status === 'completed' ||
      (target > 0 && responsesCollected >= target);

    setState({
      kind: isComplete ? 'completed' : 'pending',
      mission,
      responsesCollected,
    });
  }, [missionId, user]);

  useEffect(() => {
    cancelledRef.current = false;
    if (authLoading) return;
    if (!user) {
      navigate('/signin?redirect=' + encodeURIComponent(`/mission/${missionId}/live`));
      return;
    }
    if (!missionId) {
      setState({ kind: 'error', message: 'Missing mission id in URL.' });
      return;
    }

    void fetchMissionSnapshot();
    const intervalId = window.setInterval(() => {
      void fetchMissionSnapshot();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelledRef.current = true;
      window.clearInterval(intervalId);
    };
  }, [authLoading, user, missionId, navigate, fetchMissionSnapshot]);

  return (
    <div className="min-h-[100dvh] bg-[#0B0C15] flex flex-col">
      <AuthedTopNav />
      <main className="flex-1 pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto w-full">
          {state.kind === 'loading' && <LoadingShell />}
          {state.kind === 'error' && <ErrorShell message={state.message} />}
          {(state.kind === 'pending' || state.kind === 'completed') && (
            <ActivePanel
              mission={state.mission}
              responsesCollected={state.responsesCollected}
              isComplete={state.kind === 'completed'}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// Sub-shells
// ─────────────────────────────────────────────────────────────────────

const LoadingShell = () => (
  <div className="flex flex-col items-center justify-center py-24 text-t3 gap-3">
    <Loader2 className="w-6 h-6 animate-spin text-lime-300" aria-hidden />
    <div className="font-body text-sm">Loading mission…</div>
  </div>
);

const ErrorShell = ({ message }: { message: string }) => (
  <div className="mt-12 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" aria-hidden />
      <div>
        <div className="font-display text-sm font-bold text-white mb-1">
          Couldn't load your mission
        </div>
        <div className="font-body text-sm text-t3">{message}</div>
      </div>
    </div>
  </div>
);

interface ActivePanelProps {
  mission: MissionRow;
  responsesCollected: number;
  isComplete: boolean;
}

const ActivePanel = ({ mission, responsesCollected, isComplete }: ActivePanelProps) => {
  const target = mission.respondent_count || 0;
  const pct = useMemo(() => {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((responsesCollected / target) * 100));
  }, [responsesCollected, target]);

  const eta = useMemo(
    () => (isComplete ? 'Complete' : formatEta(responsesCollected, target, mission.started_at)),
    [isComplete, responsesCollected, target, mission.started_at],
  );

  const firstThree = (mission.questions ?? []).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#141520] to-[#0f1018] p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1',
              'font-display text-[10px] font-extrabold uppercase tracking-[0.12em]',
              isComplete
                ? 'border-green-400/40 bg-green-400/10 text-green-300'
                : 'border-lime-400/40 bg-lime-400/10 text-lime-300',
            ].join(' ')}
          >
            {isComplete ? (
              <>
                <CheckCircle2 className="w-3 h-3" aria-hidden /> Mission Complete
              </>
            ) : (
              <>
                <Rocket className="w-3 h-3" aria-hidden /> Mission Active
              </>
            )}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          {mission.title?.trim() || 'Your mission is live'}
        </h1>
        {mission.brief && (
          <p className="mt-2 font-body text-sm text-t3 max-w-3xl leading-relaxed">
            {mission.brief}
          </p>
        )}

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <div className="font-body text-xs text-t3">
              {isComplete ? 'All responses collected' : 'Collecting responses…'}
            </div>
            <div className="font-display text-xs font-bold text-white tabular-nums">
              {responsesCollected} / {target || '—'} · {pct}%
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-lime-300 to-green-300"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-2 font-body text-[11px] text-t4">
            Estimated time remaining: <span className="text-t2 font-medium">{eta}</span>
          </div>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Target"
          value={String(target || '—')}
          sub="respondents"
          icon={<Users className="w-4 h-4" aria-hidden />}
        />
        <MetricCard
          label="Collected"
          value={String(responsesCollected)}
          sub={target ? `${pct}% complete` : '—'}
          icon={<Activity className="w-4 h-4" aria-hidden />}
          accent
        />
        <MetricCard
          label="ETA"
          value={eta}
          sub={isComplete ? 'Results ready' : 'Auto-refresh 3s'}
          icon={<Clock className="w-4 h-4" aria-hidden />}
        />
        <MetricCard
          label="Status"
          value={isComplete ? 'Complete' : 'In flight'}
          sub={mission.started_at ? 'Launched' : 'Queued'}
          icon={<Rocket className="w-4 h-4" aria-hidden />}
        />
      </div>

      {/* Live ticker (placeholder — Realtime wiring in Phase 3) */}
      <div className="rounded-2xl border border-white/10 bg-[#141520] p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.12em] text-lime-300">
            Live activity
          </span>
          <span className="flex w-1.5 h-1.5 rounded-full bg-lime-300 animate-pulse" aria-hidden />
        </div>
        <ul className="space-y-2 font-body text-sm text-t2">
          <TickerRow>Target audience profile constructed</TickerRow>
          <TickerRow>AI personas initialised ({target || '—'})</TickerRow>
          <TickerRow>Survey distributed to respondent pool</TickerRow>
          {responsesCollected > 0 && (
            <TickerRow>Responses streaming in — {responsesCollected} so far</TickerRow>
          )}
          {isComplete && <TickerRow done>All responses validated — results ready</TickerRow>}
        </ul>
      </div>

      {/* Questions preview (read-only) */}
      {firstThree.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#141520] p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-3">
            <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.12em] text-t3">
              Questions in flight
            </span>
            <span className="font-body text-[11px] text-t4">
              Showing {firstThree.length} of {mission.questions?.length ?? 0}
            </span>
          </div>
          <ol className="space-y-3">
            {firstThree.map((q, i) => (
              <li
                key={q.id ?? i}
                className="flex gap-3 rounded-lg border border-white/5 bg-[#0f1018] p-3"
              >
                <span className="shrink-0 w-6 h-6 rounded-md bg-lime-300 text-black font-display text-[11px] font-black flex items-center justify-center">
                  Q{i + 1}
                </span>
                <span className="font-body text-sm text-white leading-relaxed">{q.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Footer CTA */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!isComplete}
          onClick={() => isComplete && navigate(`/dashboard/${mission.id}`)}
          className={[
            'inline-flex items-center gap-2 rounded-xl px-5 py-3',
            'font-display text-sm font-extrabold uppercase tracking-[0.08em]',
            'transition-colors',
            isComplete
              ? 'bg-lime-300 text-black hover:bg-lime-200'
              : 'bg-white/5 text-t4 cursor-not-allowed',
          ].join(' ')}
        >
          View Results
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent?: boolean;
}

const MetricCard = ({ label, value, sub, icon, accent }: MetricCardProps) => (
  <div
    className={[
      'rounded-xl border p-4',
      accent ? 'border-lime-400/30 bg-lime-400/[0.04]' : 'border-white/10 bg-[#141520]',
    ].join(' ')}
  >
    <div className="flex items-center gap-2 mb-2 text-t3">
      {icon}
      <span className="font-body text-[10px] uppercase tracking-[0.08em]">{label}</span>
    </div>
    <div
      className={[
        'font-display text-2xl font-black leading-none tracking-tight tabular-nums',
        accent ? 'text-lime-300' : 'text-white',
      ].join(' ')}
    >
      {value}
    </div>
    <div className="mt-1 font-body text-[11px] text-t4">{sub}</div>
  </div>
);

const TickerRow = ({ children, done }: { children: React.ReactNode; done?: boolean }) => (
  <li className="flex items-start gap-2">
    <span
      className={[
        'mt-[5px] w-1.5 h-1.5 rounded-full shrink-0',
        done ? 'bg-green-300' : 'bg-lime-300',
      ].join(' ')}
      aria-hidden
    />
    <span>{children}</span>
  </li>
);
