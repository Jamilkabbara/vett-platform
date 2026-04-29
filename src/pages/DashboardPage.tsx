import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AuthedTopNav } from '../components/layout/AuthedTopNav';
import { api } from '../lib/apiClient';
import { logPaymentError } from '../lib/paymentErrorLogger';
import { MissionControlQuestions } from '../components/dashboard/MissionControlQuestions';
import { MissionControlTargeting } from '../components/dashboard/MissionControlTargeting';
import {
  MissionControlPricing,
  MissionControlPricingMobileBar,
} from '../components/dashboard/MissionControlPricing';
import { MissionControlAssetPreview } from '../components/dashboard/MissionControlAssetPreview';
import { getGoalById } from '../data/missionGoals';
import {
  calculatePricing,
  fetchServerQuote,
  SERVER_QUOTE_TOAST_TOLERANCE_USD,
} from '../utils/pricingEngine';
import toast from 'react-hot-toast';
import type { Question } from '../components/dashboard/QuestionEngine';
import type { TargetingConfig } from '../components/dashboard/TargetingEngine';
import {
  normaliseMissionAssets,
  type MissionAsset,
} from '../types/missionAssets';
import type { SuggestedTargeting } from '../services/aiService';

/**
 * Mission Control — /dashboard/:missionId.
 *
 * The redesigned, wired-up version: LEFT column owns the Question Engine
 * + Targeting accordion; RIGHT column is the sticky Pricing panel.
 *
 * Pass 23 Bug 23.0e v2 — checkout is now a redirect to Stripe-hosted
 * Checkout instead of an inline Elements modal. The Launch CTA POSTs to
 * /api/payments/create-checkout-session and bounces the user to
 * checkout.stripe.com; the user lands back on /payment-success or
 * /payment-cancel which finishes the flow. No more inline iframe race
 * conditions (Bali Safari forensic).
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
 *   - Questions, targeting, and respondent_count all persist with a 500ms
 *     debounce to the same `missions` row the landing flow created.
 *   - The displayed total ≡ what Stripe charges — both read from the
 *     same pricingEngine.calculatePricing() output.
 *
 * ── Mobile (verified at 375px) ──────────────────────────────────
 *   - Grid collapses to single column; pricing stacks below targeting.
 *   - A sticky bottom CTA bar shows the live total + VETT IT launcher.
 *   - The body reserves bottom padding equal to the sticky bar height so
 *     the last card never sits behind the CTA.
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
  /** Phase 10.5 — uploaded creative(s). Jsonb on the DB; normalised on load. */
  mission_assets: unknown;
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

/**
 * Phase 4 — Clarify market → country preset.
 *
 * When a mission lands on the dashboard for the first time and the user
 * hasn't hand-picked any countries yet, seed the targeting geography from
 * whatever market the user chose during Clarify. This means the
 * researcher immediately sees the countries implied by "UAE & Gulf" and
 * can edit from there, instead of staring at an empty picker.
 *
 * Rules (match the Phase 4 spec verbatim):
 *   - uae_gulf       → AE, SA, KW, QA, BH, OM
 *   - mena           → EG, JO, LB, AE, SA, MA
 *   - north_america  → US, CA
 *   - europe         → GB, DE, FR, IT, ES  (EU5)
 *   - us_europe      → US, CA, GB, DE, FR, IT, ES  (legacy chip, superset)
 *   - global / other → []
 */
const MARKET_COUNTRY_PRESETS: Record<string, string[]> = {
  uae_gulf: ['AE', 'SA', 'KW', 'QA', 'BH', 'OM'],
  mena: ['EG', 'JO', 'LB', 'AE', 'SA', 'MA'],
  north_america: ['US', 'CA'],
  europe: ['GB', 'DE', 'FR', 'IT', 'ES'],
  us_europe: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES'],
  global: [],
  other: [],
};

function countriesForMarket(market: string | null | undefined): string[] {
  if (!market) return [];
  return MARKET_COUNTRY_PRESETS[market] ?? [];
}

/**
 * Phase 4 — Clarify price → human label.
 *
 * Rendered as an informational banner at the top of the pricing panel.
 * Purely cosmetic: it does NOT affect the computed total. The AI
 * generation step already uses this value when phrasing questions.
 */
function priceTierLabel(priceId: string | null | undefined): string | null {
  switch (priceId) {
    case 'under_20':
      return 'Under $20';
    case '20_50':
      return '$20 – $50';
    case '50_150':
      return '$50 – $150';
    case '150_plus':
      return '$150+';
    case 'not_relevant':
    default:
      return null;
  }
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
  };
}

export const DashboardPage = () => {
  const { missionId } = useParams();
  const navigate = useNavigate();
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
  // Pass 5C: true when the initial targeting was seeded from the AI's
  // suggestTargeting output (stored in target_audience.aiTargeting).
  // Drives the "· AI Suggested" badge in MissionControlTargeting.
  // Cleared to false the first time the user saves a manual targeting change.
  const [aiSuggestedTargeting, setAiSuggestedTargeting] = useState(false);

  // Respondent count — pricing panel owns the UI but parent owns the value
  // so every component reads the same number.  Hydrated from mission.row.
  // Pass 21 Bug 16: initial state 100 → 50 to match the new entry-tier
  // default. Note this is just the local-state seed; the real value gets
  // hydrated from the mission row a few lines later (see useEffect that
  // reads state.mission.respondent_count). The seed only matters for the
  // brief flash before hydration completes.
  const [respondentCount, setRespondentCount] = useState<number>(50);

  // Uploaded assets — hydrated once from the mission row and read-only on
  // the dashboard. Editing assets post-creation would invalidate AI-generated
  // questions that reference them, so we keep add/remove on the setup page.
  const [missionAssets, setMissionAssets] = useState<MissionAsset[]>([]);

  // Pass 23 Bug 23.0e v2 — VETT IT CTA now creates a Stripe Checkout
  // Session and redirects to checkout.stripe.com. We still gate the click
  // with a "verifying" flag so a double-click doesn't spawn two sessions.
  const [verifyingQuote, setVerifyingQuote] = useState(false);

  // Debounce timer for question-list saves — one pending write at a time.
  const persistTimerRef = useRef<number | null>(null);
  const latestQuestionsRef = useRef<Question[]>([]);
  const missionIdRef = useRef<string | null>(null);

  // Separate debounce timer + latest-snapshot ref for targeting so a
  // rapid-fire chip click doesn't burn a round-trip each.
  const targetingTimerRef = useRef<number | null>(null);
  const latestTargetingRef = useRef<TargetingConfig>(DEFAULT_TARGETING);

  // Respondent count debounce — same pattern as the other two, scoped to
  // `missions.respondent_count`.
  const respondentTimerRef = useRef<number | null>(null);
  const latestRespondentRef = useRef<number>(100);

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
            'id, user_id, title, status, goal_type, brief, respondent_count, price_estimated, target_audience, targeting, questions, mission_assets, created_at',
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
        let initialTargeting = hydrateTargeting(mission.targeting);
        // Pass 21 Bug 16: hydration fallback 100 → 50 to match new default.
        const initialRespondents = Number(mission.respondent_count ?? 50) || 50;
        const initialAssets = normaliseMissionAssets(mission.mission_assets);

        // Pass 5C + Phase 4: if the user hasn't picked any countries yet,
        // try to seed the targeting from the AI's suggestions first (stored
        // in target_audience.aiTargeting during mission creation). If that
        // isn't available, fall back to the simple market-preset (Phase 4).
        // Whichever path runs persists the seeded targeting so subsequent
        // loads skip this branch and the pricingEngine always sees a
        // consistent state.
        let aiWasApplied = false;
        if (initialTargeting.geography.countries.length === 0) {
          const ta = (mission.target_audience ?? {}) as Record<string, unknown>;
          const rawAiTargeting = ta.aiTargeting as SuggestedTargeting | null | undefined;

          if (rawAiTargeting && typeof rawAiTargeting === 'object') {
            // Build a full TargetingConfig from the AI suggestion shape.
            const ai = rawAiTargeting;
            const strArr = (v: unknown): string[] =>
              Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
            const aiConfig: TargetingConfig = {
              ...DEFAULT_TARGETING,
              geography: {
                ...DEFAULT_TARGETING.geography,
                countries: strArr(ai.countries),
                cities:    strArr(ai.cities),
              },
              demographics: {
                ...DEFAULT_TARGETING.demographics,
                ageRanges:  strArr(ai.ageRanges),
                genders:    strArr(ai.genders),
                education:  strArr(ai.education),
                marital:    strArr(ai.marital),
                parental:   strArr(ai.parental),
                employment: strArr(ai.employment),
              },
              professional: {
                ...DEFAULT_TARGETING.professional,
                industries:   strArr(ai.industries),
                roles:        strArr(ai.roles),
                companySizes: strArr(ai.companySizes),
              },
              financials: {
                incomeRanges: strArr(ai.incomeRanges),
              },
              behaviors:      strArr(ai.behaviors),
              technographics: {
                devices: strArr(ai.devices),
              },
            };
            if (aiConfig.geography.countries.length > 0) {
              initialTargeting = aiConfig;
              aiWasApplied = true;
              // Fire-and-forget persistence — if it fails, the UI still works.
              void supabase
                .from('missions')
                .update({ targeting: initialTargeting })
                .eq('id', mission.id);
            }
          }

          if (!aiWasApplied) {
            // Phase 4 fallback: seed country from the Clarify market answer.
            const clarifyMarket =
              typeof ta.market === 'string' ? (ta.market as string) : null;
            const preset = countriesForMarket(clarifyMarket);
            if (preset.length > 0) {
              initialTargeting = {
                ...initialTargeting,
                geography: {
                  ...initialTargeting.geography,
                  countries: preset,
                },
              };
              void supabase
                .from('missions')
                .update({ targeting: initialTargeting })
                .eq('id', mission.id);
            }
          }
        }

        // A completed mission belongs on the results page, not the setup page.
        // Redirect immediately so the user lands in the right place whether
        // they navigated here via a bookmark or an old link.
        if (mission.status === 'completed' || mission.status === 'COMPLETED') {
          navigate(`/results/${mission.id}`, { replace: true });
          return;
        }

        // Pass 23 Bug 23.80: failed missions belong on the results page where
        // the failure card + auto-refund messaging lives. Redirect so users
        // who navigated back to /dashboard/:id after payment fail see it.
        if (mission.status === 'failed') {
          navigate(`/results/${mission.id}`, { replace: true });
          return;
        }

        setState({ kind: 'loaded', mission });
        setQuestions(initialQuestions);
        setTargeting(initialTargeting);
        setAiSuggestedTargeting(aiWasApplied);
        setRespondentCount(initialRespondents);
        setMissionAssets(initialAssets);
        latestQuestionsRef.current = initialQuestions;
        latestTargetingRef.current = initialTargeting;
        latestRespondentRef.current = initialRespondents;
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
      // Once the user makes their first manual change, drop the AI badge.
      setAiSuggestedTargeting(false);
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

  // ── Respondent count persistence ─────────────────────────────────
  // We also re-snapshot the price estimate so the legacy MissionsList
  // + /api/start-mission flow sees the right number when it reads back
  // the row.  Re-uses pricingEngine to stay aligned with the UI.
  const flushRespondentCount = useCallback(async () => {
    const id = missionIdRef.current;
    if (!id) return;
    const payload = latestRespondentRef.current;
    const estimate = calculatePricing(
      payload,
      latestQuestionsRef.current,
      latestTargetingRef.current,
      false,
    ).total;
    try {
      const { error } = await supabase
        .from('missions')
        .update({
          respondent_count: payload,
          price_estimated: estimate,
        })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[DashboardPage] failed to save respondent_count', err);
    }
  }, []);

  const handleRespondentChange = useCallback(
    (next: number) => {
      setRespondentCount(next);
      latestRespondentRef.current = next;
      if (respondentTimerRef.current !== null) {
        window.clearTimeout(respondentTimerRef.current);
      }
      respondentTimerRef.current = window.setTimeout(() => {
        respondentTimerRef.current = null;
        void flushRespondentCount();
      }, 500);
    },
    [flushRespondentCount],
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
      if (respondentTimerRef.current !== null) {
        window.clearTimeout(respondentTimerRef.current);
        respondentTimerRef.current = null;
        void flushRespondentCount();
      }
    };
  }, [flushQuestions, flushTargeting, flushRespondentCount]);

  // Live total — single source of truth shared with the modal on launch.
  const pricing = useMemo(
    () =>
      state.kind === 'loaded'
        ? calculatePricing(respondentCount, questions, targeting, false)
        : null,
    [state, respondentCount, questions, targeting],
  );

  /**
   * Pass 23 Bug 23.0e v2 — Launch flow:
   *   1) Verify the quote with /api/pricing/quote so we can toast if the
   *      server total has drifted (e.g. promo expired, targeting changed).
   *      This is unchanged from Phase 12 — surprise-free pricing matters.
   *   2) POST /api/payments/create-checkout-session and redirect to
   *      session.url. The server picks the authoritative total off the
   *      mission row at session-creation time, so we don't pass a total
   *      from the client — the user pays whatever the server says.
   *   3) On any error before the redirect, log to payment_errors with
   *      stage='client_checkout_redirect_failed' so we can see Stripe
   *      outages in the same telemetry as backend errors.
   *
   * Network failures on the quote verify silently fall through to the
   * checkout call — a Railway hiccup must not hold a paying user hostage.
   */
  const handleLaunch = useCallback(async () => {
    if (state.kind !== 'loaded' || !pricing) return;
    if (verifyingQuote) return;

    setVerifyingQuote(true);
    const missionIdForCheckout = state.mission.id;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const API_URL =
        import.meta.env.VITE_API_URL ||
        'https://vettit-backend-production.up.railway.app';

      const quote = await fetchServerQuote({
        apiUrl: API_URL,
        missionId: missionIdForCheckout,
        respondentCount,
        questions,
        targeting,
        accessToken: session?.access_token ?? null,
      });

      if (quote) {
        const diff = Math.abs(quote.total - pricing.total);
        if (diff > SERVER_QUOTE_TOAST_TOLERANCE_USD) {
          toast(
            `Price updated to $${quote.total.toFixed(2)} — our server recalculated your quote.`,
            { icon: '🔄', duration: 4000 },
          );
        }
      }

      // Create the Stripe Checkout Session and redirect.
      const result = (await api.post('/api/payments/create-checkout-session', {
        missionId: missionIdForCheckout,
      })) as { url?: string };

      if (!result?.url) {
        throw new Error('Server did not return a checkout URL');
      }

      window.location.href = result.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not start checkout.';
      toast.error(message);
      setVerifyingQuote(false);
      logPaymentError({
        stage:        'client_checkout_redirect_failed',
        missionId:    missionIdForCheckout,
        errorCode:    'create_session_failed',
        errorMessage: message,
      });
    }
  }, [
    state,
    pricing,
    verifyingQuote,
    respondentCount,
    questions,
    targeting,
  ]);

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
          {/* Bottom padding reserves space for the sticky mobile CTA bar
              so the last card isn't covered.  Desktop removes the pad. */}
          <section className="flex-1 px-4 md:px-8 py-5 md:py-7 pb-[var(--mc-mobile-bar-h,96px)] md:pb-7">
            <div
              className={[
                'max-w-[1440px] mx-auto',
                'grid gap-5',
                'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]',
              ].join(' ')}
            >
              {/* LEFT — Uploaded asset preview (Phase 10.5, only when present)
                  + Questions + Targeting accordion. */}
              <div className="flex flex-col gap-4 min-w-0">
                {missionAssets.length > 0 && (
                  <MissionControlAssetPreview
                    assets={missionAssets}
                    goalType={state.mission.goal_type}
                  />
                )}
                <MissionControlQuestions
                  questions={questions}
                  onChange={handleQuestionsChange}
                  goalId={state.mission.goal_type}
                  context={state.mission.brief ?? undefined}
                  persisting={persisting}
                />
                {/* Section divider — orients the user that scrolling
                    past the Question Engine lands them on Audience
                    Targeting. Purely visual; no state. */}
                <div
                  className="flex items-center justify-center py-2"
                  aria-hidden
                >
                  <span
                    className={[
                      'font-display font-bold text-[11px] uppercase tracking-[0.12em]',
                      'text-t3',
                      'inline-flex items-center gap-1.5',
                    ].join(' ')}
                  >
                    <span aria-hidden>↓</span>
                    <span>Who should answer these?</span>
                  </span>
                </div>
                <MissionControlTargeting
                  config={targeting}
                  onChange={handleTargetingChange}
                  respondentCount={Number(state.mission.respondent_count ?? 50)}
                  questions={questions}
                  persisting={targetingPersisting}
                  aiSuggestedTargeting={aiSuggestedTargeting}
                />
              </div>

              {/* RIGHT — Pricing panel (desktop: sticky; mobile: stacks). */}
              <aside
                className={[
                  'flex flex-col gap-4 min-w-0',
                  // On desktop keep the pricing card pinned above the fold
                  // so the user never has to scroll to check the total.
                  'lg:sticky lg:top-4 lg:self-start',
                ].join(' ')}
              >
                <MissionControlPricing
                  respondentCount={respondentCount}
                  onRespondentChange={handleRespondentChange}
                  questions={questions}
                  targeting={targeting}
                  onLaunch={handleLaunch}
                  missionId={state.kind === 'loaded' ? state.mission.id : null}
                  priceTierLabel={priceTierLabel(
                    (() => {
                      const ta = (state.mission.target_audience ??
                        {}) as Record<string, unknown>;
                      return typeof ta.price === 'string'
                        ? (ta.price as string)
                        : null;
                    })(),
                  )}
                />
              </aside>
            </div>
          </section>
        </>
      )}

      {/* Sticky mobile CTA — only rendered once the mission has loaded so
          we don't flash a bogus $0 total on the loading screen. */}
      {state.kind === 'loaded' && pricing && (
        <MissionControlPricingMobileBar
          total={pricing.total}
          respondentCount={respondentCount}
          onLaunch={handleLaunch}
        />
      )}

      {/* Pass 23 Bug 23.0e v2 — checkout is now a redirect to Stripe Checkout,
          so there's no inline modal to mount. handleLaunch above is the
          full flow. */}
    </div>
  );
};

// ── Sub-views ────────────────────────────────────────────────────────

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
