import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AuthedTopNav } from '../components/layout/AuthedTopNav';
import { VettingPaymentModal } from '../components/dashboard/VettingPaymentModal';
import { MissionControlQuestions } from '../components/dashboard/MissionControlQuestions';
import { MissionControlTargeting } from '../components/dashboard/MissionControlTargeting';
import { getGoalById } from '../data/missionGoals';
import type { Question } from '../components/dashboard/QuestionEngine';
import type { TargetingConfig } from '../components/dashboard/TargetingEngine';

/**
 * Mission Control — Commit 5 of the redesign.
 *
 * This is a layout *shell* only — the LEFT column's questions + targeting
 * panels and the RIGHT column's pricing summary all render placeholder
 * cards.  Commits 6–8 fill each one in.
 *
 * Route: /dashboard/:missionId  (also mounted at /mission-control in
 * App.tsx as a legacy alias — that route has no :missionId and therefore
 * always hits the not-found branch; this is intentional, since the only
 * consumer of the old mock-data fallback was the pre-redesign UI).
 *
 * ── Contract ────────────────────────────────────────────────────
 *   - Requires an authed user + a valid :missionId.
 *   - Fetches the mission via Supabase (RLS-scoped to the current user).
 *   - 3 states: loading · error · loaded.
 *   - VettingPaymentModal is mounted-but-closed so Commit 8 can re-skin
 *     the trigger without re-plumbing the modal.
 *
 * ── Mobile (verified at 375px) ──────────────────────────────────
 *   - Grid collapses to single column; RIGHT panel stacks below LEFT.
 *   - Hero + brief bar wrap without horizontal overflow.
 *   - Goal chip truncates its label instead of forcing horizontal scroll.
 */

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; reason: 'not_found' | 'unauthorized' | 'unknown'; detail?: string }
  | { kind: 'loaded'; mission: MissionRow };

/** Snapshot of the real `public.missions` row we care about on this page. */
interface MissionRow {
  id: string;
  user_id: string;
  title: string | null;
  status: string | null;
  goal_type: string | null;
  brief: string | null;
  respondent_count: number | null;
  price_estimated: number | null;
  target_audience: Record<string, unknown> | null;
  targeting: Record<string, unknown> | null;
  questions: unknown[] | null;
  created_at: string | null;
}

const VALID_QUESTION_TYPES = ['single', 'multi', 'rating', 'opinion', 'text'] as const;

/** Light normaliser so jsonb blobs from Supabase land in the Question shape
 *  the rest of the app expects.  Keep in sync with aiService.mapQuestion — we
 *  don't import it to avoid pulling the whole AI module into the dashboard
 *  bundle for a 20-line helper. */
function normaliseQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((input: unknown, i: number): Question | null => {
      if (!input || typeof input !== 'object') return null;
      const q = input as Record<string, unknown>;
      const typeRaw = String(q.type ?? 'rating');
      const type = (VALID_QUESTION_TYPES as readonly string[]).includes(typeRaw)
        ? typeRaw
        : 'rating';
      return {
        id: String(q.id ?? `q${i + 1}`),
        text: String(q.text ?? ''),
        type: type as Question['type'],
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        aiRefined: Boolean(q.aiRefined ?? true),
        isScreening: Boolean(q.isScreening ?? false),
        qualifyingAnswer: q.qualifyingAnswer ?? undefined,
        hasPIIError: false,
      };
    })
    .filter((q): q is Question => q !== null);
}

function firstLine(text: string | null | undefined, max = 140): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

/** Default TargetingConfig for missions that haven't saved one yet.  Kept
 *  in-file because the only consumer is DashboardPage and it must match
 *  the TargetingConfig shape exactly — we don't want a stale default
 *  drifting in a shared util. */
const DEFAULT_TARGETING: TargetingConfig = {
  geography: { countries: [], cities: [], cityEnabled: false },
  demographics: {
    ageRanges: [],
    genders: [],
    education: [],
    marital: [],
    parental: [],
    employment: [],
  },
  professional: { industries: [], roles: [], companySizes: [] },
  financials: { incomeRanges: [] },
  behaviors: [],
  technographics: { devices: [] },
};

/** Shallow hydration of the `targeting` jsonb column from Supabase.  The DB
 *  returns `unknown` (it's a jsonb blob), so we defensively fall back to the
 *  default shape for any missing sub-key.  Never mutates the argument. */
function hydrateTargeting(raw: unknown): TargetingConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_TARGETING;
  const r = raw as Record<string, unknown>;
  const pick = <T,>(path: unknown, fallback: T): T =>
    path !== undefined && path !== null ? (path as T) : fallback;
  const geo = (r.geography as Record<string, unknown> | undefined) ?? {};
  const demo = (r.demographics as Record<string, unknown> | undefined) ?? {};
  const pro = (r.professional as Record<string, unknown> | undefined) ?? {};
  const fin = (r.financials as Record<string, unknown> | undefined) ?? {};
  const tech = (r.technographics as Record<string, unknown> | undefined) ?? {};
  return {
    geography: {
      countries: pick(geo.countries, DEFAULT_TARGETING.geography.countries),
      cities: pick(geo.cities, DEFAULT_TARGETING.geography.cities),
      cityEnabled: pick(geo.cityEnabled, DEFAULT_TARGETING.geography.cityEnabled),
    },
    demographics: {
      ageRanges: pick(demo.ageRanges, DEFAULT_TARGETING.demographics.ageRanges),
      genders: pick(demo.genders, DEFAULT_TARGETING.demographics.genders),
      education: pick(demo.education, DEFAULT_TARGETING.demographics.education),
      marital: pick(demo.marital, DEFAULT_TARGETING.demographics.marital),
      parental: pick(demo.parental, DEFAULT_TARGETING.demographics.parental),
      employment: pick(demo.employment, DEFAULT_TARGETING.demographics.employment),
    },
    professional: {
      industries: pick(pro.industries, DEFAULT_TARGETING.professional.industries),
      roles: pick(pro.roles, DEFAULT_TARGETING.professional.roles),
      companySizes: pick(pro.companySizes, DEFAULT_TARGETING.professional.companySizes),
    },
    financials: {
      incomeRanges: pick(fin.incomeRanges, DEFAULT_TARGETING.financials.incomeRanges),
    },
    behaviors: pick(r.behaviors, DEFAULT_TARGETING.behaviors),
    technographics: {
      devices: pick(tech.devices, DEFAULT_TARGETING.technographics.devices),
    },
    retargeting: r.retargeting as TargetingConfig['retargeting'],
  };
}

export const DashboardPage = () => {
  const { missionId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  // Questions live outside LoadState so inline edits + refines don't have
  // to reshape the discriminated union every time.  Hydrated from the
  // mission row when it loads; pushed back to Supabase on change.
  const [questions, setQuestions] = useState<Question[]>([]);
  const [persisting, setPersisting] = useState(false);

  // Targeting — same pattern as questions: parent owns state, children
  // fire onChange, a 500ms debounce writes back to missions.targeting.
  const [targeting, setTargeting] = useState<TargetingConfig>(DEFAULT_TARGETING);
  const [targetingPersisting, setTargetingPersisting] = useState(false);

  // Mounted-but-closed payment modal.  Commit 8 will wire the trigger.
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Debounce timer for question-list saves — one pending write at a time.
  const persistTimerRef = useRef<number | null>(null);
  const latestQuestionsRef = useRef<Question[]>([]);
  const missionIdRef = useRef<string | null>(null);

  // Separate debounce timer + latest-snapshot ref for targeting so a
  // rapid-fire chip click doesn't burn a round-trip each.
  const targetingTimerRef = useRef<number | null>(null);
  const latestTargetingRef = useRef<TargetingConfig>(DEFAULT_TARGETING);

  useEffect(() => {
    // Wait for auth to resolve before deciding anything.
    if (authLoading) return;

    if (!missionId) {
      setState({ kind: 'error', reason: 'not_found' });
      return;
    }
    if (!user) {
      setState({ kind: 'error', reason: 'unauthorized' });
      return;
    }

    let cancelled = false;
    (async () => {
      setState({ kind: 'loading' });
      try {
        const { data, error } = await supabase
          .from('missions')
          .select(
            'id, user_id, title, status, goal_type, brief, respondent_count, price_estimated, target_audience, targeting, questions, created_at',
          )
          .eq('id', missionId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          setState({ kind: 'error', reason: 'unknown', detail: error.message });
          return;
        }
        if (!data) {
          setState({ kind: 'error', reason: 'not_found' });
          return;
        }

        const mission = data as MissionRow;
        const initialQuestions = normaliseQuestions(mission.questions);
        const initialTargeting = hydrateTargeting(mission.targeting);
        setState({ kind: 'loaded', mission });
        setQuestions(initialQuestions);
        setTargeting(initialTargeting);
        latestQuestionsRef.current = initialQuestions;
        latestTargetingRef.current = initialTargeting;
        missionIdRef.current = mission.id;
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: 'error',
          reason: 'unknown',
          detail: err instanceof Error ? err.message : 'Unexpected error',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [missionId, user, authLoading]);

  // ── Debounced persistence of the questions array ───────────────
  // Parent owns the list; MissionControlQuestions only fires onChange.
  // We optimistically update local state and schedule a 500ms-debounced
  // write back to Supabase so rapid edits don't burn a round-trip each.
  const flushQuestions = useCallback(async () => {
    const missionId = missionIdRef.current;
    if (!missionId) return;
    const payload = latestQuestionsRef.current;
    setPersisting(true);
    try {
      const { error } = await supabase
        .from('missions')
        .update({ questions: payload })
        .eq('id', missionId);
      if (error) throw error;
    } catch (err) {
      console.error('[DashboardPage] failed to save questions', err);
      // Non-fatal — UI already reflects the change; next edit retries.
    } finally {
      setPersisting(false);
    }
  }, []);

  const handleQuestionsChange = useCallback(
    (next: Question[]) => {
      setQuestions(next);
      latestQuestionsRef.current = next;
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = window.setTimeout(() => {
        persistTimerRef.current = null;
        void flushQuestions();
      }, 500);
    },
    [flushQuestions],
  );

  // ── Targeting persistence — mirror of the questions debounce ────
  const flushTargeting = useCallback(async () => {
    const id = missionIdRef.current;
    if (!id) return;
    const payload = latestTargetingRef.current;
    setTargetingPersisting(true);
    try {
      const { error } = await supabase
        .from('missions')
        .update({ targeting: payload })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[DashboardPage] failed to save targeting', err);
    } finally {
      setTargetingPersisting(false);
    }
  }, []);

  const handleTargetingChange = useCallback(
    (next: TargetingConfig) => {
      setTargeting(next);
      latestTargetingRef.current = next;
      if (targetingTimerRef.current !== null) {
        window.clearTimeout(targetingTimerRef.current);
      }
      targetingTimerRef.current = window.setTimeout(() => {
        targetingTimerRef.current = null;
        void flushTargeting();
      }, 500);
    },
    [flushTargeting],
  );

  // Flush on unmount so an in-flight edit isn't lost on route change.
  useEffect(() => {
    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
        void flushQuestions();
      }
      if (targetingTimerRef.current !== null) {
        window.clearTimeout(targetingTimerRef.current);
        targetingTimerRef.current = null;
        void flushTargeting();
      }
    };
  }, [flushQuestions, flushTargeting]);

  // ── Derived header bits ────────────────────────────────────────
  const goal = useMemo(() => {
    if (state.kind !== 'loaded') return null;
    return getGoalById(state.mission.goal_type ?? '') ?? null;
  }, [state]);

  const headerTitle = useMemo(() => {
    if (state.kind !== 'loaded') return '';
    return state.mission.title?.trim() || goal?.label || 'Mission';
  }, [state, goal]);

  return (
    <div className="min-h-[100dvh] bg-bg text-t1 flex flex-col">
      <AuthedTopNav />

      {state.kind === 'loading' && <DashboardLoadingShell />}
      {state.kind === 'error' && <DashboardErrorShell reason={state.reason} />}

      {state.kind === 'loaded' && (
        <>
          {/* ── Hero + brief bar ───────────────────────────────── */}
          <section
            className={[
              'px-4 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6',
              'bg-bg border-b border-b1',
            ].join(' ')}
          >
            <div className="max-w-[1440px] mx-auto">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-t3 font-display font-bold mb-3">
                <span>// MISSION CONTROL</span>
                <span
                  className={[
                    'inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5',
                    'font-display font-black text-[9px]',
                    state.mission.status === 'active'
                      ? 'bg-grn/10 text-grn border border-grn/20'
                      : state.mission.status === 'draft'
                        ? 'bg-lime/10 text-lime border border-lime/20'
                        : 'bg-bg3 text-t3 border border-b1',
                  ].join(' ')}
                >
                  ●{' '}
                  {(state.mission.status ?? 'draft').toUpperCase()}
                </span>
              </div>

              {/* Goal chip + title */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {goal && (
                  <span
                    className={[
                      'inline-flex items-center gap-1.5 rounded-pill',
                      'bg-bg3 border border-b1 px-2.5 py-1',
                      'font-display font-bold text-[11px] text-t2',
                      'max-w-full',
                    ].join(' ')}
                    aria-label={`Goal: ${goal.label}`}
                  >
                    <span aria-hidden className="text-[13px] leading-none">
                      {goal.emoji}
                    </span>
                    <span className="truncate">{goal.label}</span>
                  </span>
                )}
              </div>

              <h1
                className={[
                  'mt-3 font-display font-black text-white',
                  'leading-[1.05] tracking-[-1px]',
                ].join(' ')}
                style={{ fontSize: 'clamp(28px, 4.5vw, 44px)' }}
              >
                {headerTitle}
              </h1>

              {/* Brief bar */}
              {state.mission.brief && (
                <div
                  className={[
                    'mt-4 flex items-start md:items-center gap-3',
                    'bg-bg2/80 border-l-[3px] border-lime rounded-r-lg',
                    'px-3.5 py-3',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-[9px] text-t4 tracking-[0.1em] mb-1">
                      // AI ASSISTANCE READY
                    </div>
                    <div className="font-mono text-[12px] text-t2 leading-[1.4] break-words">
                      {firstLine(state.mission.brief, 260)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── 2-column body ──────────────────────────────────── */}
          <section className="flex-1 px-4 md:px-8 py-5 md:py-7">
            <div
              className={[
                'max-w-[1440px] mx-auto',
                'grid gap-5',
                'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]',
              ].join(' ')}
            >
              {/* LEFT — Questions (real) + Targeting (shell) */}
              <div className="flex flex-col gap-4 min-w-0">
                <MissionControlQuestions
                  questions={questions}
                  onChange={handleQuestionsChange}
                  goalId={state.mission.goal_type}
                  context={state.mission.brief ?? undefined}
                  persisting={persisting}
                />
                <MissionControlTargeting
                  config={targeting}
                  onChange={handleTargetingChange}
                  respondentCount={Number(state.mission.respondent_count ?? 100)}
                  questions={questions}
                  persisting={targetingPersisting}
                />
              </div>

              {/* RIGHT — Pricing summary shell */}
              <aside className="flex flex-col gap-4 min-w-0">
                <ShellCard
                  dataTestId="mc-pricing-shell"
                  title="Pricing Summary"
                  subtitle={`${state.mission.respondent_count ?? 100} respondents · Commit 8 fills this in`}
                />
              </aside>
            </div>
          </section>
        </>
      )}

      {/* Modal stays mounted but closed until Commit 8 wires the trigger. */}
      <VettingPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onComplete={() => setShowPaymentModal(false)}
        totalCost={
          state.kind === 'loaded'
            ? Number(state.mission.price_estimated ?? 0)
            : 0
        }
        respondentCount={
          state.kind === 'loaded'
            ? Number(state.mission.respondent_count ?? 100)
            : 100
        }
        missionId={state.kind === 'loaded' ? state.mission.id : null}
      />
    </div>
  );
};

// ── Sub-views ────────────────────────────────────────────────────────

interface ShellCardProps {
  title: string;
  subtitle?: string;
  dataTestId?: string;
}

/** Placeholder panel used until Commits 6–8 replace each section. */
const ShellCard = ({ title, subtitle, dataTestId }: ShellCardProps) => (
  <div
    data-testid={dataTestId}
    className={[
      'bg-bg2 border border-b1 rounded-xl',
      'p-5 md:p-6',
      'min-h-[180px]',
      'flex flex-col',
    ].join(' ')}
  >
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display font-black text-[13px] text-white">
        {title}
      </h2>
      <span className="font-display font-bold text-[9px] text-t4 uppercase tracking-[0.12em]">
        Shell
      </span>
    </div>
    {subtitle && (
      <p className="font-body text-[12px] text-t3 leading-relaxed">
        {subtitle}
      </p>
    )}
    <div className="flex-1 flex items-center justify-center pt-6">
      <div
        className={[
          'w-full h-full min-h-[96px] rounded-md',
          'border border-dashed border-b1/70',
          'flex items-center justify-center',
          'font-body text-[11px] text-t4',
        ].join(' ')}
        aria-hidden
      >
        Empty shell
      </div>
    </div>
  </div>
);

/** 3-state: loading. */
const DashboardLoadingShell = () => (
  <section className="flex-1 px-4 md:px-8 py-10 md:py-16">
    <div className="max-w-[1440px] mx-auto">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-t3 font-display font-bold mb-3">
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
        <span>// LOADING MISSION</span>
      </div>
      <div className="h-[44px] w-[65%] max-w-[420px] rounded-md bg-bg2 animate-pulse mb-4" />
      <div className="h-[68px] w-full rounded-r-lg bg-bg2/80 border-l-[3px] border-lime animate-pulse" />

      <div
        className={[
          'mt-8 grid gap-5',
          'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]',
        ].join(' ')}
      >
        <div className="flex flex-col gap-4">
          <div className="h-[180px] rounded-xl bg-bg2 animate-pulse" />
          <div className="h-[180px] rounded-xl bg-bg2 animate-pulse" />
        </div>
        <div className="h-[180px] rounded-xl bg-bg2 animate-pulse" />
      </div>
    </div>
  </section>
);

/** 3-state: error. */
const DashboardErrorShell = ({
  reason,
}: {
  reason: 'not_found' | 'unauthorized' | 'unknown';
}) => {
  const copy = (() => {
    switch (reason) {
      case 'unauthorized':
        return {
          title: 'Sign in to see this mission',
          body: "You're not signed in — or your session expired. Sign back in and we'll take you right to it.",
          cta: { href: '/signin', label: 'Sign in' },
        };
      case 'not_found':
        return {
          title: 'Mission not found',
          body: "We couldn't find that mission under your account. It may have been deleted or the link was mistyped.",
          cta: { href: '/missions', label: 'Back to missions' },
        };
      default:
        return {
          title: 'Something went wrong loading this mission',
          body: 'Reload the page. If it keeps happening, try again in a minute — we might be catching our breath.',
          cta: { href: '/missions', label: 'Back to missions' },
        };
    }
  })();

  return (
    <section className="flex-1 px-4 md:px-8 py-14 md:py-24 flex items-start md:items-center">
      <div className="max-w-[560px] mx-auto text-center">
        <div
          className={[
            'w-12 h-12 rounded-full mx-auto mb-5',
            'bg-red/10 border border-red/30 text-red',
            'flex items-center justify-center',
          ].join(' ')}
        >
          <AlertCircle className="w-6 h-6" aria-hidden />
        </div>
        <h1 className="font-display font-black text-white text-[24px] md:text-[28px] tracking-tight-2 mb-3">
          {copy.title}
        </h1>
        <p className="font-body text-[14px] text-t2 leading-relaxed mb-6">
          {copy.body}
        </p>
        <Link
          to={copy.cta.href}
          className={[
            'inline-flex items-center gap-2 rounded-xl',
            'bg-lime text-black font-display font-black text-[13px] uppercase tracking-widest',
            'px-5 h-11 shadow-lime-soft hover:bg-lime/90 transition-colors',
          ].join(' ')}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {copy.cta.label}
        </Link>
      </div>
    </section>
  );
};

export default DashboardPage;
