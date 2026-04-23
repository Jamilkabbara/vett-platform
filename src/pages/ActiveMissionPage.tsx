import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Users,
  Clock,
  Activity,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  PauseCircle,
  Info,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { AuthedTopNav } from '../components/layout/AuthedTopNav';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Backend generator endpoint. Belt-and-suspenders trigger: the Stripe
// payment_intent.succeeded webhook is the AUTHORITATIVE path — it
// fires runMission() directly on the server. This HTTP fire-and-forget
// is idempotent on the backend (activeRuns Set + DB status check), so
// a double-fire between webhook and frontend never produces duplicate
// personas. We still ping it so users who land here before the webhook
// round-trips don't stare at 0/100 waiting.
const GENERATOR_PATH = (missionId: string) => `/api/missions/${missionId}/generate-responses`;
const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

type GenerateResult = 'ok' | 'not_implemented' | 'failed' | 'skipped';

async function triggerResponseGenerator(missionId: string): Promise<GenerateResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    const res = await fetch(`${API_URL}${GENERATOR_PATH(missionId)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    if (res.status === 404) return 'not_implemented';
    if (!res.ok) {
      console.warn('[active] generator returned non-OK', res.status);
      return 'failed';
    }
    return 'ok';
  } catch (err) {
    console.warn('[active] generator trigger threw', err);
    return 'failed';
  }
}

// ─────────────────────────────────────────────────────────────────────
// ActiveMissionPage — the post-payment landing page.
//
// Phase 2 scaffolded the shell; Phase 3 layers a Supabase Realtime
// subscription on top of the 3s poll so new respondents appear in the
// ticker as they land. Realtime is optimistic — if the channel drops
// or the project's realtime quota is exhausted, the poll picks up the
// slack. The two paths reconcile through a single Set<string> of seen
// persona_ids, so the displayed count never double-counts.
//
// Edge cases:
//   • status === 'paused'      → amber banner, ticker frozen
//   • 0 responses after 30s    → "Taking longer than expected" notice
//   • collected >= target      → flip to completed (hero + CTA)
//   • target == 0              → progress reads as "—"
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

interface LiveEvent {
  personaId: string;
  personaName: string;
  at: number;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; mission: MissionRow; events: LiveEvent[] };

const POLL_INTERVAL_MS = 3000;
const STUCK_THRESHOLD_MS = 30_000;
const MAX_TICKER_EVENTS = 8;

// ─────────────────────────────────────────────────────────────────────
// Persona naming. persona_profile is free-form jsonb — different
// generation pipelines may emit different shapes. We try the obvious
// keys first, then fall back to a deterministic hash of persona_id so
// two runs of the same mission show the same labels.
// ─────────────────────────────────────────────────────────────────────

function personaNameFrom(
  personaId: string,
  profile: unknown,
  legacyFlat?: unknown,
): string {
  const candidates: unknown[] = [profile, legacyFlat];
  for (const c of candidates) {
    if (c && typeof c === 'object') {
      const obj = c as Record<string, unknown>;
      for (const key of ['name', 'display_name', 'displayName', 'synthetic_persona', 'persona']) {
        const v = obj[key];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
    }
  }
  // Deterministic fallback: "Persona A1B2" from the id.
  let hash = 0;
  for (let i = 0; i < personaId.length; i++) {
    hash = (hash * 31 + personaId.charCodeAt(i)) | 0;
  }
  const tag = Math.abs(hash).toString(36).slice(0, 4).toUpperCase();
  return `Persona ${tag}`;
}

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

// ─────────────────────────────────────────────────────────────────────

export const ActiveMissionPage = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [state, setState] = useState<State>({ kind: 'loading' });
  const [mountedAt] = useState<number>(() => Date.now());
  const [generatorStatus, setGeneratorStatus] = useState<GenerateResult>('skipped');
  const generatorFiredRef = useRef(false);

  // Refs for values read inside realtime/poll callbacks that must stay
  // stable (i.e. not force re-subscribe). seenPersonasRef is the source
  // of truth for dedup across both paths.
  const seenPersonasRef = useRef<Set<string>>(new Set());
  const cancelledRef = useRef(false);

  // Merge a new persona event into state. Idempotent: if the persona
  // is already known, returns without changing anything.
  const ingestPersona = useCallback(
    (personaId: string, personaName: string, at: number) => {
      if (!personaId) return;
      if (seenPersonasRef.current.has(personaId)) return;
      seenPersonasRef.current.add(personaId);
      setState((prev) => {
        if (prev.kind !== 'ready') return prev;
        const evt: LiveEvent = { personaId, personaName, at };
        const events = [evt, ...prev.events].slice(0, MAX_TICKER_EVENTS);
        return { ...prev, events };
      });
    },
    [],
  );

  // Fetch mission + reconcile response rollup. Invoked on mount and
  // every POLL_INTERVAL_MS. Only the mission row is replaced wholesale;
  // the event list is merged so the ticker never "forgets" personas.
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

    const { data: rows, error: rErr } = await supabase
      .from('mission_responses')
      .select('persona_id, persona_profile, answered_at')
      .eq('mission_id', mission.id)
      .order('answered_at', { ascending: true });

    if (cancelledRef.current) return;

    // Flip to ready first so ingestPersona can attach events.
    setState((prev) => {
      if (prev.kind === 'ready') return { ...prev, mission };
      return { kind: 'ready', mission, events: [] };
    });

    if (!rErr && rows) {
      type Row = { persona_id: string; persona_profile: unknown; answered_at: string | null };
      for (const r of rows as Row[]) {
        if (!r.persona_id) continue;
        const name = personaNameFrom(r.persona_id, r.persona_profile);
        const at = r.answered_at ? new Date(r.answered_at).getTime() : Date.now();
        ingestPersona(r.persona_id, name, Number.isFinite(at) ? at : Date.now());
      }
    }
  }, [missionId, user, ingestPersona]);

  // Auth guard + initial fetch + 3s poll.
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

  // Supabase Realtime — INSERT on mission_responses. Subscribes only
  // once per missionId; handler reads fresh state via the ingest ref.
  useEffect(() => {
    if (!missionId || !user) return;

    const channel = supabase
      .channel(`mission-responses:${missionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mission_responses',
          filter: `mission_id=eq.${missionId}`,
        },
        (payload) => {
          const row = (payload as { new?: Record<string, unknown> }).new ?? {};
          const personaId = typeof row.persona_id === 'string' ? row.persona_id : '';
          if (!personaId) return;
          const name = personaNameFrom(personaId, row.persona_profile);
          const answeredAtRaw = typeof row.answered_at === 'string' ? row.answered_at : null;
          const at = answeredAtRaw ? new Date(answeredAtRaw).getTime() : Date.now();
          ingestPersona(personaId, name, Number.isFinite(at) ? at : Date.now());
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [missionId, user, ingestPersona]);

  // Fire-and-forget: once the mission row is loaded and it's in an
  // active-collection state, kick the backend generator. Only fires
  // once per component lifetime — we don't want to re-spam the backend
  // on every poll tick.
  useEffect(() => {
    if (state.kind !== 'ready') return;
    if (generatorFiredRef.current) return;
    const { mission } = state;
    // Don't fire for paused / completed missions — the generator has
    // nothing to do.
    if (mission.status === 'paused' || mission.status === 'completed') return;
    generatorFiredRef.current = true;
    void triggerResponseGenerator(mission.id).then((result) => {
      if (cancelledRef.current) return;
      setGeneratorStatus(result);
    });
  }, [state]);

  return (
    <div className="min-h-[100dvh] bg-[#0B0C15] flex flex-col">
      <AuthedTopNav />
      <main className="flex-1 pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto w-full">
          {state.kind === 'loading' && <LoadingShell />}
          {state.kind === 'error' && <ErrorShell message={state.message} />}
          {state.kind === 'ready' && (
            <ActivePanel
              mission={state.mission}
              events={state.events}
              responsesCollected={seenPersonasRef.current.size}
              mountedAt={mountedAt}
              generatorStatus={generatorStatus}
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
  events: LiveEvent[];
  responsesCollected: number;
  mountedAt: number;
  generatorStatus: GenerateResult;
}

const ActivePanel = ({
  mission,
  events,
  responsesCollected,
  mountedAt,
  generatorStatus,
}: ActivePanelProps) => {
  const navigate = useNavigate();
  const target = mission.respondent_count || 0;
  const statusLower = (mission.status || '').toLowerCase();
  const isPaused = statusLower === 'paused';
  const isFailed = statusLower === 'failed';
  const isProcessing = statusLower === 'processing' || statusLower === 'paid';
  const isComplete =
    statusLower === 'completed' || (target > 0 && responsesCollected >= target);

  // Auto-navigate to results once the mission completes. We wait a beat
  // (1.2s) so the user sees the completion state flip before the page
  // transitions, then push to the canonical results route. The guard
  // ref prevents a re-poll from re-navigating if the user came back.
  const autoNavRef = useRef(false);
  useEffect(() => {
    if (!isComplete) return;
    if (autoNavRef.current) return;
    autoNavRef.current = true;
    const t = window.setTimeout(() => {
      navigate(`/results/${mission.id}`);
    }, 1200);
    return () => window.clearTimeout(t);
  }, [isComplete, mission.id, navigate]);

  // Retry handler for the failed state. Re-fires the generator and
  // optimistically flips the banner's disabled/loading state; the poll
  // loop picks up the actual status transition on the next 3s tick.
  const [retrying, setRetrying] = useState(false);
  const handleRetry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      const result = await triggerResponseGenerator(mission.id);
      if (result === 'ok' || result === 'not_implemented') {
        // Webhook + endpoint are both idempotent — this will no-op if
        // the run is already healthy, otherwise it kicks off a fresh
        // pipeline. Either way the poll loop reconciles.
        console.info('[active] retry fired →', result);
      } else {
        console.warn('[active] retry failed →', result);
      }
    } finally {
      // Hold the spinner for a beat so a sub-200ms response doesn't
      // flash — otherwise the button looks broken.
      window.setTimeout(() => setRetrying(false), 800);
    }
  }, [retrying, mission.id]);

  const pct = useMemo(() => {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((responsesCollected / target) * 100));
  }, [responsesCollected, target]);

  const eta = useMemo(
    () => (isComplete ? 'Complete' : formatEta(responsesCollected, target, mission.started_at)),
    [isComplete, responsesCollected, target, mission.started_at],
  );

  // "Stuck at 0" detector — a simple wall-clock check against mount
  // rather than started_at, because started_at may not be set before
  // the backend generator kicks off. We intentionally don't track this
  // via setState; a second-granularity re-render from the poll is
  // enough to flip it in practice.
  const isStuck =
    !isComplete &&
    !isPaused &&
    responsesCollected === 0 &&
    Date.now() - mountedAt > STUCK_THRESHOLD_MS;

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
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <StatusChip
            isComplete={isComplete}
            isPaused={isPaused}
            isFailed={isFailed}
          />
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
              {isComplete
                ? 'All responses collected'
                : isPaused
                  ? 'Mission paused — no responses collected'
                  : 'Collecting responses…'}
            </div>
            <div className="font-display text-xs font-bold text-white tabular-nums">
              {responsesCollected} / {target || '—'} · {pct}%
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className={[
                'h-full',
                isPaused
                  ? 'bg-amber-300/60'
                  : 'bg-gradient-to-r from-lime-300 to-green-300',
              ].join(' ')}
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

      {/* Paused banner */}
      {isPaused && (
        <div className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 flex items-start gap-3">
          <PauseCircle className="w-5 h-5 text-amber-300 mt-0.5" aria-hidden />
          <div className="font-body text-sm text-t2">
            This mission is paused. Contact support to resume collection.
          </div>
        </div>
      )}

      {/* Failed banner with retry. The webhook and endpoint are both
          idempotent, so firing retry never duplicates work. */}
      {isFailed && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/5 p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" aria-hidden />
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="font-body text-sm text-t2 flex-1">
              Something went wrong while generating your responses. You can
              retry below — we'll pick up where we left off.
            </div>
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className={[
                'inline-flex items-center gap-2 rounded-lg px-4 py-2',
                'font-display text-xs font-extrabold uppercase tracking-[0.08em]',
                'bg-lime-300 text-black hover:bg-lime-200 transition-colors',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'shrink-0',
              ].join(' ')}
            >
              {retrying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  <span>Retrying…</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden />
                  <span>Retry mission</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Processing banner — reassurance while the backend runs the
          synthetic-audience pipeline. Suppressed once responses land
          or the mission flips to completed/failed. */}
      {isProcessing && !isFailed && !isComplete && responsesCollected === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
          <Loader2 className="w-5 h-5 text-lime-300 mt-0.5 animate-spin" aria-hidden />
          <div className="font-body text-sm text-t2">
            Warming up the synthetic audience — first responses should appear
            in under a minute.
          </div>
        </div>
      )}

      {/* Completed banner — shown briefly before auto-nav to /results. */}
      {isComplete && (
        <div className="rounded-xl border border-green-400/30 bg-green-400/5 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-300 mt-0.5" aria-hidden />
          <div className="font-body text-sm text-t2">
            All responses collected. Redirecting you to your results…
          </div>
        </div>
      )}

      {/* Stuck banner */}
      {isStuck && !isFailed && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-t3 mt-0.5" aria-hidden />
          <div className="font-body text-sm text-t2">
            Taking longer than expected — no responses yet.{' '}
            <span className="text-t3">
              AI persona generation typically starts within 30 seconds. If nothing
              appears in the next minute, reload the page.
            </span>
          </div>
        </div>
      )}

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
          value={
            isFailed
              ? 'Failed'
              : isComplete
                ? 'Complete'
                : isPaused
                  ? 'Paused'
                  : isProcessing
                    ? 'Processing'
                    : 'In flight'
          }
          sub={
            isFailed
              ? 'Retry available'
              : mission.started_at
                ? 'Launched'
                : 'Queued'
          }
          icon={<Rocket className="w-4 h-4" aria-hidden />}
        />
      </div>

      {/* Live ticker */}
      <div className="rounded-2xl border border-white/10 bg-[#141520] p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.12em] text-lime-300">
            Live activity
          </span>
          {!isPaused && !isComplete && (
            <span className="flex w-1.5 h-1.5 rounded-full bg-lime-300 animate-pulse" aria-hidden />
          )}
        </div>
        <ul className="space-y-2 font-body text-sm text-t2">
          {/* Persona events (newest first). AnimatePresence keeps
              newly-inserted rows subtly fading in. */}
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <motion.li
                key={e.personaId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-2"
              >
                <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-lime-300 shrink-0" aria-hidden />
                <span>
                  <span className="text-white font-medium">{e.personaName}</span>{' '}
                  completed the survey
                </span>
              </motion.li>
            ))}
          </AnimatePresence>

          {/* Seed status lines — shown if we have no persona events yet
              or alongside them as context. */}
          {events.length === 0 && (
            <>
              <TickerRow>Target audience profile constructed</TickerRow>
              <TickerRow>AI personas initialising ({target || '—'})</TickerRow>
              <TickerRow>Survey distributed to respondent pool</TickerRow>
            </>
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

      {/* Footer CTA. Navigates to the canonical results route; this
          button is also the manual-escape hatch for the auto-nav in
          case the user dismisses the page during the 1.2s grace. */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!isComplete}
          onClick={() =>
            isComplete && navigate(`/results/${mission.id}`)
          }
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

const StatusChip = ({
  isComplete,
  isPaused,
  isFailed,
}: {
  isComplete: boolean;
  isPaused: boolean;
  isFailed: boolean;
}) => {
  if (isFailed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-red-400/40 bg-red-400/10 text-red-300 px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-[0.12em]">
        <XCircle className="w-3 h-3" aria-hidden /> Mission Failed
      </span>
    );
  }
  if (isComplete) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-green-400/40 bg-green-400/10 text-green-300 px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-[0.12em]">
        <CheckCircle2 className="w-3 h-3" aria-hidden /> Mission Complete
      </span>
    );
  }
  if (isPaused) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300/40 bg-amber-300/10 text-amber-300 px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-[0.12em]">
        <PauseCircle className="w-3 h-3" aria-hidden /> Mission Paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-lime-400/40 bg-lime-400/10 text-lime-300 px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-[0.12em]">
      <Rocket className="w-3 h-3" aria-hidden /> Mission Active
    </span>
  );
};

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
