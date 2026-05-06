import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { trackFunnel } from '../lib/funnelTrack';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchAdaptiveClarify,
  generateSurvey,
  type AdaptiveClarifyQuestion,
} from '../services/aiService';
import {
  MissionAssetUploadError,
  removeMissionAsset,
  uploadMissionAsset,
} from '../lib/missionAssetUpload';
import type { MissionAsset } from '../types/missionAssets';
import { useToast } from '../components/ui/Toast';
import { TopNav } from '../components/ui/TopNav';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { AuthedTopNav } from '../components/layout/AuthedTopNav';
import { GoalGrid } from '../components/setup/GoalGrid';
import {
  ClarifySection,
  CLARIFY_DEFAULTS,
  type ClarifyAnswers,
} from '../components/setup/ClarifySection';
import { DynamicClarifySection } from '../components/setup/DynamicClarifySection';
import {
  BrandLiftSetupSection,
  BRAND_LIFT_DEFAULT_STATE,
  type BrandLiftSetupState,
} from '../components/setup/BrandLiftSetupSection';
// Pass 29 B2 / B4 — universal inputs and methodology collectors.
import {
  UniversalMissionInputs,
  UNIVERSAL_INPUTS_DEFAULT,
  validateUniversalInputs,
  type UniversalInputsState,
} from '../components/setup/UniversalMissionInputs';
import {
  PricingInputs,
  PRICING_DEFAULT_STATE,
  validatePricingInputs,
  type PricingInputsState,
} from '../components/setup/PricingInputs';
import {
  FeatureListCollector,
  validateFeatureList,
  type RoadmapFeature,
} from '../components/setup/FeatureListCollector';
import {
  CSATInputs,
  CSAT_DEFAULT_STATE,
  validateCSATInputs,
  recencyPhrase,
  type CSATInputsState,
} from '../components/setup/CSATInputs';
import {
  ConceptCollector,
  CONCEPT_DEFAULT_STATE,
  validateConceptCollector,
  type ConceptCollectorState,
} from '../components/setup/ConceptCollector';
import {
  ConceptListCollector,
  validateConceptList,
  type CompareConcept,
} from '../components/setup/ConceptListCollector';
import {
  GOALS_WITH_UPLOAD,
  getGoalById,
  getPlaceholderForGoal,
} from '../data/missionGoals';
import {
  BRAND_LIFT_TIERS,
  calculateBrandLiftMissionPrice,
} from '../utils/pricingEngine';

/**
 * Mission Setup — Commit 4 of the redesign (Prompt 3).
 *
 * Flow:
 *   1. Goal picker (GoalGrid).
 *   2. Describe (30-char textarea + optional upload chip).
 *   3. ✦ Generate Survey button reveals ClarifySection (3 chip cards)
 *      inline beneath the CTA — no page navigation.
 *   4. Clarify CTA calls generateSurvey() (Claude) in the background,
 *      writes a mission row to Supabase, and navigates to
 *      /dashboard/:missionId with the AI payload in location.state.
 *
 * ── Why the insert payload changed ──────────────────────────────
 * The Commit 3 insert was referencing 8 columns that do not exist
 * in `public.missions`: context, target, question, estimated_price,
 * role, stage, mission_type, visualization_type.  PostgREST rejected
 * every write with PGRST204 — which is where the "Couldn't generate
 * mission, try again" toast was coming from.  (generateSurvey() itself
 * has a try/catch fallback and never throws, so the AI call wasn't
 * the culprit.)
 *
 * This commit maps every field onto a real column:
 *   - context            → brief                (text)
 *   - mission_type       → goal_type            (text)
 *   - estimated_price    → price_estimated      (numeric)
 *   - target + stage     → target_audience jsonb {stage, market, price}
 *   - question / visualization_type / role → dropped (they were never
 *     reads on the dashboard, and no column backs them)
 *   - status 'DRAFT'     → 'draft'              (matches default + CHECK)
 *
 * `stage` needs a home because the clarify step has to persist it.
 * There is no `stage` column on `missions`, so we stash it inside
 * `target_audience` jsonb alongside market + price.  Adding a dedicated
 * `stage` column is a separate migration we can do later if the
 * dashboard wants to filter by stage — it wasn't in scope for Commit 4.
 *
 * ── localStorage migration ──────────────────────────────────────
 * Old key `missionSetupDraft` is read on mount for back-compat.  New
 * writes use `vett:mission_draft`.  On successful mission creation,
 * both keys are cleared so a stale draft can never resurface.
 *
 * ── Mobile (verified at 375px) ──────────────────────────────────
 *   - Clarify chips wrap inside `flex-wrap gap-[7px]`; no overflow.
 *   - Staggered reveal uses `opacity + y:6` so no horizontal shift.
 *   - Both CTAs are full-width (`w-full`) on all breakpoints.
 *   - The upload chip + char counter share a `flex-wrap` toolbar.
 */

const DRAFT_KEY_NEW = 'vett:mission_draft';
const DRAFT_KEY_OLD = 'missionSetupDraft';
const AI_BACKUP_KEY = 'vettit_ai_result';
const DESCRIPTION_MIN = 30;
const DESCRIPTION_MAX = 500;

interface DraftShape {
  missionGoal?: string;
  missionDescription?: string;
  clarify?: Partial<ClarifyAnswers>;
  timestamp?: number;
}

function readDraft(): DraftShape | null {
  // Prefer new key; fall back to old key; prefer the newer timestamp
  // if both exist (user may have drafts across branches).
  try {
    const rawNew = localStorage.getItem(DRAFT_KEY_NEW);
    const rawOld = localStorage.getItem(DRAFT_KEY_OLD);
    const parsedNew = rawNew ? (JSON.parse(rawNew) as DraftShape) : null;
    const parsedOld = rawOld ? (JSON.parse(rawOld) as DraftShape) : null;

    if (parsedNew && parsedOld) {
      return (parsedNew.timestamp ?? 0) >= (parsedOld.timestamp ?? 0)
        ? parsedNew
        : parsedOld;
    }
    return parsedNew ?? parsedOld;
  } catch {
    return null;
  }
}

function writeDraft(draft: DraftShape) {
  try {
    localStorage.setItem(
      DRAFT_KEY_NEW,
      JSON.stringify({ ...draft, timestamp: Date.now() }),
    );
  } catch {
    /* storage full / disabled — silently skip */
  }
}

function clearAllDrafts() {
  try {
    localStorage.removeItem(DRAFT_KEY_NEW);
    localStorage.removeItem(DRAFT_KEY_OLD);
  } catch {
    /* ignore */
  }
}

/** Short, DB-safe title derived from the first sentence of the brief. */
function deriveTitle(brief: string, goalLabel: string): string {
  const firstSentence = brief.split(/[.!?\n]/)[0]?.trim() ?? '';
  if (firstSentence.length >= 6 && firstSentence.length <= 120) {
    return firstSentence;
  }
  return goalLabel;
}

export const MissionSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const toast = useToast();

  const queryPrefill = searchParams.get('q') || '';

  // Pass 23 Bug 23.54 — goal_type preservation through auth.
  // Priority order:
  //   1. ?goal= URL param (survives the /signin?redirect=/setup round-trip)
  //   2. sessionStorage 'vett_landing_goal' (set by LandingPage CTAs)
  //   3. router state .intent (legacy named-pricing intents)
  //   4. fallback 'validate'
  // sessionStorage is cleared on consumption so a stale value doesn't
  // bleed into the next visit.
  const [missionGoal, setMissionGoal] = useState<string>(() => {
    const fromUrl = searchParams.get('goal');
    if (fromUrl) return fromUrl;
    try {
      const fromSession = sessionStorage.getItem('vett_landing_goal');
      if (fromSession) {
        sessionStorage.removeItem('vett_landing_goal');
        return fromSession;
      }
    } catch { /* private mode — fall through */ }
    const intent = (location.state as { intent?: string } | null)?.intent;
    if (intent) {
      const intentToGoal: Record<string, string> = {
        pricing: 'pricing',
        features: 'roadmap',
        marketing: 'marketing',
        satisfaction: 'satisfaction',
      };
      return intentToGoal[intent] ?? 'validate';
    }
    return 'validate';
  });

  const [missionDescription, setMissionDescription] = useState<string>(() => {
    const state = location.state as
      | { inputText?: string; prefill?: string }
      | null;
    return state?.inputText || state?.prefill || queryPrefill || '';
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  // Upload state — Phase 10.5. The chip swaps between three modes:
  //   - idle (no asset)        → 🖼 Add image / video
  //   - uploading (in-flight)  → spinner + filename
  //   - uploaded (MissionAsset) → purple pill with ✕ to remove
  // Keeping `uploadingName` separate from the final asset means we can
  // show progress without polluting the persisted MissionAsset array.
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<MissionAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clarify state — revealed only after ✦ Generate Survey.
  const [showClarify, setShowClarify] = useState(false);
  const [clarifyAnswers, setClarifyAnswers] = useState<ClarifyAnswers>(
    CLARIFY_DEFAULTS,
  );

  // Pass 28 A — Brand Lift Studies skip the generic clarify flow and
  // render 6 deep pickers (creative / market / channel / wave /
  // competitor / KPI template) inline below the brief textarea.
  const [brandLiftState, setBrandLiftState] = useState<BrandLiftSetupState>(
    BRAND_LIFT_DEFAULT_STATE,
  );
  const isBrandLift = missionGoal === 'brand_lift';

  // Pass 29 B2 / B4 — universal inputs (brand / category / audience /
  // competitors) plus the per-methodology collector. Rendered when
  // goal_type matches a methodology-bound type. brand_lift +
  // creative_attention skip these (their deep pickers already
  // collect equivalents).
  const isPricing = missionGoal === 'pricing';
  const isUniversalShown = !isBrandLift && missionGoal !== 'creative_attention'
    && missionGoal !== 'research';
  const [universalInputs, setUniversalInputs] = useState<UniversalInputsState>(
    UNIVERSAL_INPUTS_DEFAULT,
  );
  const [pricingInputs, setPricingInputs] = useState<PricingInputsState>(
    PRICING_DEFAULT_STATE,
  );

  // Pass 29 B6 — feature roadmap state.
  const isRoadmap = missionGoal === 'roadmap';
  const [roadmapFeatures, setRoadmapFeatures] = useState<RoadmapFeature[]>([]);

  // Pass 29 B8 — customer satisfaction state.
  const isCSAT = missionGoal === 'satisfaction';
  const [csatInputs, setCsatInputs] = useState<CSATInputsState>(CSAT_DEFAULT_STATE);

  // Pass 30 B1 — Validate Product (concept test) state.
  const isValidate = missionGoal === 'validate';
  const [conceptInputs, setConceptInputs] = useState<ConceptCollectorState>(CONCEPT_DEFAULT_STATE);

  // Pass 30 B3 — Compare Concepts (sequential monadic) state.
  const isCompare = missionGoal === 'compare';
  const [compareConcepts, setCompareConcepts] = useState<CompareConcept[]>([]);
  // Adaptive clarify — populated by /api/ai/clarify with ≤15s timeout.
  // null === "fall back to the static Market/Stage/Price cards".
  const [dynamicClarify, setDynamicClarify] = useState<
    AdaptiveClarifyQuestion[] | null
  >(null);
  const [dynamicClarifyAnswers, setDynamicClarifyAnswers] = useState<
    Record<string, string>
  >({});
  const [revealingClarify, setRevealingClarify] = useState(false);

  // Guard against double-fire from enter-key repeats / fast double-clicks.
  const inflightRef = useRef(false);

  // Draft hydration + one-shot ?q= consumption.
  useEffect(() => {
    window.scrollTo(0, 0);
    // Pass 22 Bug 22.4 — pass query-prefill flag so the admin can see whether
    // the setup started from a landing-page query or fresh mission-control nav.
    trackFunnel('mission_setup_started', { source: queryPrefill ? 'landing_query' : 'fresh' });

    if (queryPrefill) {
      const next = new URLSearchParams(searchParams);
      next.delete('q');
      setSearchParams(next, { replace: true });
    }

    const state = location.state as
      | { inputText?: string; prefill?: string; intent?: string }
      | null;
    const hasIncomingPrefill =
      !!state?.inputText || !!state?.prefill || !!queryPrefill;

    if (!hasIncomingPrefill) {
      const draft = readDraft();
      if (draft) {
        // Pass 23 Bug 23.65 v5 — never auto-redirect from draft restore.
        //
        // v4 navigated to /creative-attention/new whenever the saved draft's
        // missionGoal was 'creative_attention'. That created a compounding
        // lockout: any user with an abandoned CA draft (Jamil's failed Nike
        // WebP test 91be5c7b being the canonical example) was permanently
        // redirected away from /setup on every visit — "VETT IT" from
        // /landing, "+ NEW MISSION" from /dashboard, and direct /setup
        // navigation all bounced to /creative-attention/new.
        //
        // The user is now back on /setup; treat the stale CA goal as
        // abandoned. Strip CA from the persisted draft (preserve description
        // and clarify answers, which may still be useful) so subsequent
        // visits don't keep finding the same stale value, and DO NOT call
        // setMissionGoal — let the default 'validate' state stand. The user
        // can re-pick from the goal grid.
        //
        // Doctrine: passive draft restoration must never auto-navigate.
        // Active intent (URL ?goal=, sessionStorage from landing CTA) is
        // handled separately via the useState initializer + useEffect
        // short-circuit.
        if (draft.missionGoal === 'creative_attention') {
          writeDraft({
            missionDescription: draft.missionDescription,
            clarify: draft.clarify,
            // missionGoal omitted — clears the stale CA goal silently
          });
          try { localStorage.removeItem(DRAFT_KEY_OLD); } catch { /* no-op */ }
        } else if (draft.missionGoal && getGoalById(draft.missionGoal)) {
          setMissionGoal(draft.missionGoal);
        }
        if (typeof draft.missionDescription === 'string') {
          setMissionDescription(draft.missionDescription);
        }
        if (draft.clarify) {
          setClarifyAnswers((prev) => ({ ...prev, ...draft.clarify }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft on any relevant change. Skips empty drafts.
  useEffect(() => {
    if (!missionDescription && missionGoal === 'validate') return;
    writeDraft({
      missionGoal,
      missionDescription,
      clarify: clarifyAnswers,
    });
  }, [missionGoal, missionDescription, clarifyAnswers]);

  const charCount = missionDescription.trim().length;
  const isValid = charCount >= DESCRIPTION_MIN;
  const showLengthError = attemptedSubmit && !isValid;

  const selectedGoal = getGoalById(missionGoal);
  const placeholder = useMemo(
    () => getPlaceholderForGoal(missionGoal),
    [missionGoal],
  );
  const showUpload = GOALS_WITH_UPLOAD.has(missionGoal);

  // Collapse clarify if the user edits goal/description after revealing it —
  // forces a fresh ✦ Generate Survey click, which keeps the chip answers
  // aligned with the brief the AI will actually see. Dynamic clarify is
  // cleared so the next reveal re-fetches against the updated brief.
  useEffect(() => {
    if (showClarify && !isSubmitting) {
      setShowClarify(false);
      setDynamicClarify(null);
      setDynamicClarifyAnswers({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionGoal, missionDescription]);

  // When the selected goal no longer supports upload, drop any staged asset.
  // We also best-effort-delete the orphaned storage object so public buckets
  // don't collect cruft from users who change their mind mid-flow.
  useEffect(() => {
    if (!showUpload && (uploadedAsset || uploadingName)) {
      if (uploadedAsset) void removeMissionAsset(uploadedAsset.path);
      setUploadedAsset(null);
      setUploadingName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [showUpload, uploadedAsset, uploadingName]);

  // Pass 23 Bug 23.65 v4 — Creative Attention has its own dedicated flow
  // at /creative-attention/new (upload + brand context + flat-price
  // checkout). MissionSetupPage's textarea + Generate-Survey UI is wrong
  // for it and produces orphan drafts.
  //
  // v4 architecture (post v3 ship-fail): handleGoalChange intercepts CA
  // card clicks at the click site (primary path). This effect is the
  // backup for any path that lands missionGoal in 'creative_attention'
  // without going through handleGoalChange — deep-link via URL ?goal=
  // or sessionStorage from the landing page (legitimate), or in theory
  // any future regression. v3 added a deep-link gate here that excluded
  // the draft-restored case (Jamil's prior CA draft → permanent spinner).
  // v4 removes that gate: ANY state path that produces missionGoal ===
  // 'creative_attention' on a non-CA route should redirect.
  //
  // The defensive guard below still bridges the one-tick window between
  // state landing on CA and this effect navigating away.
  useEffect(() => {
    if (missionGoal !== 'creative_attention') return;
    if (location.pathname.startsWith('/creative-attention')) return;
    try { sessionStorage.removeItem('vett_landing_goal'); } catch { /* no-op */ }
    navigate('/creative-attention/new', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionGoal]);

  // Pass 23 Bug 23.65 v3 — primary CA routing. Intercepts the goal-card
  // click before it lands in component state. Any other goal is just a
  // normal in-page toggle (no redirect, no Bug 23.68 regression).
  const handleGoalChange = (goalId: string) => {
    if (goalId === 'creative_attention') {
      // Belt-and-braces: clear any stale landing-page sessionStorage so
      // a subsequent navigation back to /setup doesn't re-fire the
      // useEffect deep-link branch.
      try { sessionStorage.removeItem('vett_landing_goal'); } catch { /* no-op */ }
      navigate('/creative-attention/new');
      return;
    }
    setMissionGoal(goalId);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast.error('Sign in first so we can save your upload.');
      return;
    }

    // If there's an existing asset, delete it first so we only ever keep
    // the latest file — the UI only shows one chip at a time.
    if (uploadedAsset) {
      void removeMissionAsset(uploadedAsset.path);
    }

    setUploadingName(file.name);
    setUploadedAsset(null);

    try {
      const asset = await uploadMissionAsset(file, user.id);
      setUploadedAsset(asset);
      setUploadingName(null);
      toast.info(
        asset.type === 'video'
          ? 'Video uploaded - the AI will reference it in your survey questions.'
          : 'Image uploaded - the AI will reference it in your survey questions.',
      );
    } catch (err) {
      setUploadingName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      const message =
        err instanceof MissionAssetUploadError
          ? err.message
          : 'Upload failed - please try again.';
      toast.error(message);
    }
  };

  const clearUploadedFile = () => {
    // Fire-and-forget storage cleanup — the UI shouldn't block on it.
    if (uploadedAsset) void removeMissionAsset(uploadedAsset.path);
    setUploadedAsset(null);
    setUploadingName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, DESCRIPTION_MAX);
    setMissionDescription(next);
  };

  /** Step 1 CTA — validates brief and reveals the clarify step. */
  const handleRevealClarify = async () => {
    if (!isValid) {
      setAttemptedSubmit(true);
      toast.error(
        `Add a bit more detail - we need at least ${DESCRIPTION_MIN} characters to brief the AI.`,
      );
      return;
    }

    if (!user) {
      const redirect = encodeURIComponent('/setup');
      navigate(`/signin?redirect=${redirect}`);
      return;
    }

    if (revealingClarify) return;
    setRevealingClarify(true);

    // Pass 6A: race timeout raised from 5 000ms → 15 000ms to match
    // the actual Railway + Claude round-trip time (4.4s warm, 6-8s on
    // cold start). Both this outer race and the AbortController signal
    // inside fetchAdaptiveClarify now use 15s. The "Thinking…" spinner
    // in the button (revealingClarify) covers the wait; the static
    // Market/Stage/Price trio is the fallback if the backend is down.
    const TIMEOUT_FALLBACK_MS = 15_000;
    const timeoutPromise = new Promise<null>((resolve) =>
      window.setTimeout(() => resolve(null), TIMEOUT_FALLBACK_MS),
    );

    let dynamicQs: AdaptiveClarifyQuestion[] | null = null;
    try {
      dynamicQs = await Promise.race([
        fetchAdaptiveClarify(missionGoal, missionDescription.trim()),
        timeoutPromise,
      ]);
    } catch {
      dynamicQs = null;
    }

    if (dynamicQs && dynamicQs.length > 0) {
      // Seed answers with each question's defaultChipId (or first chip)
      // so the user never sees an all-unselected state — matches the
      // static path's CLARIFY_DEFAULTS UX.
      const seeded: Record<string, string> = {};
      for (const q of dynamicQs) {
        seeded[q.id] =
          q.defaultChipId && q.chips.some((c) => c.id === q.defaultChipId)
            ? q.defaultChipId
            : q.chips[0]?.id ?? '';
      }
      setDynamicClarify(dynamicQs);
      setDynamicClarifyAnswers(seeded);
    } else {
      setDynamicClarify(null);
      setDynamicClarifyAnswers({});
    }

    setShowClarify(true);
    setRevealingClarify(false);
  };

  /** Step 2 CTA — kicks off generation + persistence + redirect. */
  const handleGenerate = async () => {
    if (!isValid || !user) {
      // Shouldn't reach here — Step 1 gates this — but belt + braces.
      setShowClarify(false);
      return;
    }

    // Pass 28 A — Brand Lift requires the 6 deep-picker fields before
    // we let the AI call + insert run. The button itself is gated on
    // these in BrandLiftSetupSection; this is a defense-in-depth check.
    if (isBrandLift) {
      const bl = brandLiftState;
      const wavesNeedDates = bl.wave.mode !== 'single_wave';
      const datesValid =
        !wavesNeedDates ||
        (bl.wave.campaignStart &&
          bl.wave.campaignEnd &&
          new Date(bl.wave.campaignEnd) > new Date(bl.wave.campaignStart));
      if (
        !bl.creative ||
        bl.markets.length < 1 ||
        bl.channels.length < 1 ||
        !datesValid ||
        bl.competitors.length < 2 ||
        !bl.kpiTemplate
      ) {
        toast.error('Please complete all required brand-lift fields.');
        return;
      }
    }

    // Pass 29 B4 — Pricing Research methodology validation.
    if (isPricing) {
      const universalMissing = validateUniversalInputs(universalInputs);
      const pricingMissing = validatePricingInputs(pricingInputs);
      if (universalMissing.length || pricingMissing.length) {
        toast.error(
          `Add ${[...universalMissing, ...pricingMissing].join(', ')} to continue.`,
        );
        return;
      }
    }

    // Pass 29 B6 — Feature Roadmap methodology validation.
    if (isRoadmap) {
      const universalMissing = validateUniversalInputs(universalInputs);
      const featureMissing = validateFeatureList(roadmapFeatures);
      if (universalMissing.length || featureMissing.length) {
        toast.error(
          `Add ${[...universalMissing, ...featureMissing].join(', ')} to continue.`,
        );
        return;
      }
    }

    // Pass 29 B8 — Customer Satisfaction methodology validation.
    if (isCSAT) {
      const universalMissing = validateUniversalInputs(universalInputs);
      const csatMissing = validateCSATInputs(csatInputs);
      if (universalMissing.length || csatMissing.length) {
        toast.error(
          `Add ${[...universalMissing, ...csatMissing].join(', ')} to continue.`,
        );
        return;
      }
    }

    // Pass 30 B1 — Validate Product methodology validation.
    if (isValidate) {
      const universalMissing = validateUniversalInputs(universalInputs);
      const conceptMissing = validateConceptCollector(conceptInputs);
      if (universalMissing.length || conceptMissing.length) {
        toast.error(
          `Add ${[...universalMissing, ...conceptMissing].join(', ')} to continue.`,
        );
        return;
      }
    }

    // Pass 30 B3 — Compare Concepts methodology validation.
    if (isCompare) {
      const universalMissing = validateUniversalInputs(universalInputs);
      const conceptMissing = validateConceptList(compareConcepts);
      if (universalMissing.length || conceptMissing.length) {
        toast.error(
          `Add ${[...universalMissing, ...conceptMissing].join(', ')} to continue.`,
        );
        return;
      }
    }

    if (inflightRef.current) return; // double-fire guard
    inflightRef.current = true;
    setIsSubmitting(true);

    // Pass 23 Bug 23.GOAL — Creative Attention has a dedicated setup flow at
    // /creative-attention/new (upload + brand-context + flat-price checkout).
    // The standard MissionSetupPage UI doesn't surface the upload, so finishing
    // here would create a draft mission with no brief_attachment — runMission
    // would reject it ("No creative file attached") on payment. Production
    // forensic showed 2 such orphan drafts. Redirect users picking this goal
    // to the dedicated flow instead of letting them stall.
    if (missionGoal === 'creative_attention') {
      inflightRef.current = false;
      setIsSubmitting(false);
      navigate('/creative-attention/new');
      return;
    }

    const goalLabel = selectedGoal?.label ?? missionGoal;
    const briefText = missionDescription.trim();
    const aiContext = `${goalLabel}: ${briefText}`;

    // If an upload is still in flight, wait for the user to either finish
    // or clear it before letting generation kick off — otherwise the AI
    // prompt won't know about the asset and the row would ship without it.
    if (uploadingName) {
      toast.info('Still uploading - hang on a moment.');
      inflightRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const missionAssets: MissionAsset[] = uploadedAsset ? [uploadedAsset] : [];

    try {
      // 1) Kick off AI generation — has internal try/catch + fallback.
      //    The `assets` array lets goal-aware prompts anchor question text
      //    to the uploaded creative ("After watching this ad…").
      // clarifyAnswers shape depends on which clarify UI we showed:
      //   - dynamic path → flat map keyed by backend-returned question id
      //   - static path  → { market, stage, price } object
      // Both paths forward via the same `clarifyAnswers` param on
      // generateSurvey, which is stringified into the prompt.
      const clarifyForPrompt: Record<string, string> =
        dynamicClarify && dynamicClarify.length > 0
          ? { ...dynamicClarifyAnswers }
          : {
              market: clarifyAnswers.market,
              stage: clarifyAnswers.stage,
              price: clarifyAnswers.price,
            };

      let aiResult: Awaited<ReturnType<typeof generateSurvey>> | null = null;
      try {
        // Pass 28 A — when brand_lift, fold the deep-picker context into
        // clarifyAnswers so the backend brand_lift question-gen branch
        // (Pass 28 B) can read markets / channels / competitors / KPI
        // template / wave structure without a new endpoint contract.
        const brandLiftPromptCtx: Record<string, string> = isBrandLift
          ? {
              brand_lift_template: brandLiftState.kpiTemplate,
              markets: brandLiftState.markets.join(','),
              channel_ids: brandLiftState.channels.map((c) => c.id).join(','),
              channel_count: String(brandLiftState.channels.length),
              competitors: brandLiftState.competitors.join('|'),
              wave_mode: brandLiftState.wave.mode,
              creative_url: brandLiftState.creative?.url ?? '',
              creative_mime: brandLiftState.creative?.mimeType ?? '',
            }
          : {};
        // Pass 29 B4 — pricing context fed to the backend
        // VW + GG generator via the same clarify_answers contract.
        const pricingPromptCtx: Record<string, string> = isPricing
          ? {
              pricing_product_description: pricingInputs.productDescription,
              pricing_currency: pricingInputs.currency,
              pricing_model: pricingInputs.pricingModel,
              pricing_context: pricingInputs.pricingContext,
              pricing_expected_min: pricingInputs.expectedMin,
              pricing_expected_max: pricingInputs.expectedMax,
            }
          : {};
        // Pass 29 B6 — roadmap features serialized into clarify_answers
        // so the backend MaxDiff + Kano generator can pull them off
        // the existing contract.
        const roadmapPromptCtx: Record<string, string> = isRoadmap
          ? {
              roadmap_features: JSON.stringify(roadmapFeatures),
              roadmap_feature_count: String(roadmapFeatures.length),
            }
          : {};
        // Pass 29 B8 — CSAT context fed to the NPS+CSAT+CES generator.
        const csatPromptCtx: Record<string, string> = isCSAT
          ? {
              csat_touchpoint: csatInputs.touchpoint,
              csat_custom_touchpoint: csatInputs.customTouchpoint,
              csat_customer_type: csatInputs.customerType,
              csat_recency_window: recencyPhrase(csatInputs.recencyWindow),
            }
          : {};
        // Pass 30 B1 — concept-test context fed to the validate generator.
        const validatePromptCtx: Record<string, string> = isValidate
          ? {
              concept_description: conceptInputs.description,
              concept_media_type: conceptInputs.mediaType,
              concept_media_url: conceptInputs.mediaUrl || '',
              concept_price_usd: conceptInputs.priceUsd,
              concept_use_occasion: conceptInputs.useOccasion,
            }
          : {};
        // Pass 30 B3 — concepts JSON forwarded to the sequential monadic generator.
        const comparePromptCtx: Record<string, string> = isCompare
          ? {
              concepts: JSON.stringify(
                compareConcepts.map((c) => ({
                  id: c.id,
                  name: c.name,
                  description: c.description,
                  price_usd: c.priceUsd ? Number(c.priceUsd) : undefined,
                })),
              ),
              concept_count: String(compareConcepts.length),
            }
          : {};
        // Pass 29 B2 — universal inputs forwarded for every methodology.
        const universalPromptCtx: Record<string, string> = isUniversalShown
          ? {
              brand_name: universalInputs.brand,
              category: universalInputs.category,
              audience_description: universalInputs.audienceDescription,
              competitors: universalInputs.competitors.join('|'),
            }
          : {};
        aiResult = await generateSurvey({
          goal: missionGoal,
          subject: briefText,
          objective: goalLabel,
          assets: missionAssets,
          clarifyAnswers: {
            ...clarifyForPrompt,
            ...universalPromptCtx,
            ...brandLiftPromptCtx,
            ...pricingPromptCtx,
            ...roadmapPromptCtx,
            ...csatPromptCtx,
            ...validatePromptCtx,
            ...comparePromptCtx,
          },
        });
      } catch (aiErr) {
        // generateSurvey swallows its own errors — catch here is defensive.
        console.warn('AI generation failed — continuing with defaults:', aiErr);
      }

      // 2) Build the insert payload using ONLY columns that exist on
      //    public.missions.  Stage + market + price from clarify live
      //    inside target_audience jsonb (see file header for why).
      const targetAudience = {
        // Static clarify trio — always present. If the user took the
        // dynamic path these still hold the last-seen defaults, which
        // keeps downstream consumers (dashboard targeting panel) stable.
        stage: clarifyAnswers.stage,
        market: clarifyAnswers.market,
        price: clarifyAnswers.price,
        // Dynamic clarify map — only populated when /api/ai/clarify
        // returned questions. Preserves the raw answer map so the
        // dashboard (or an admin debug view) can inspect exactly what
        // the AI asked and the user picked.
        clarify:
          dynamicClarify && dynamicClarify.length > 0
            ? {
                questions: dynamicClarify,
                answers: dynamicClarifyAnswers,
              }
            : null,
        // Carry forward anything the AI suggested so downstream consumers
        // (the dashboard targeting panel) still have something to render.
        suggestions: aiResult?.targetingSuggestions ?? null,
        // Full SuggestedTargeting shape — stored so DashboardPage can seed
        // the targeting panel with AI suggestions when the targeting column
        // is empty (i.e. the user hasn't made any manual targeting edits yet).
        aiTargeting: aiResult?.suggestedTargeting ?? null,
      };

      // Pass 29 B2 — universal inputs persisted on every
      // methodology-bound mission. brand_name + category are required;
      // audience_description optional. competitor_brands JSONB column
      // exists from Pass 28 A; we write the same shape (string array).
      const universalFields: Record<string, unknown> = isUniversalShown
        ? {
            brand_name: universalInputs.brand || null,
            category: universalInputs.category || null,
            audience_description: universalInputs.audienceDescription || null,
            // Don't clobber Brand Lift's competitor_brands which is set
            // separately via brandLiftFields below.
            ...(isBrandLift
              ? {}
              : { competitor_brands: universalInputs.competitors }),
          }
        : {};

      // Pass 29 B6 — roadmap schema columns.
      const roadmapFields: Record<string, unknown> = isRoadmap
        ? {
            roadmap_features: roadmapFeatures,
            roadmap_methodology: 'max_diff_plus_kano',
          }
        : {};

      // Pass 29 B8 — CSAT schema columns.
      const csatFields: Record<string, unknown> = isCSAT
        ? {
            csat_touchpoint: csatInputs.touchpoint,
            csat_custom_touchpoint: csatInputs.touchpoint === 'custom'
              ? csatInputs.customTouchpoint
              : null,
            csat_customer_type: csatInputs.customerType,
            csat_recency_window: csatInputs.recencyWindow,
            csat_methodology: 'nps_csat_ces',
          }
        : {};

      // Pass 30 B1 — Validate Product schema columns.
      const validateFields: Record<string, unknown> = isValidate
        ? {
            concept_description: conceptInputs.description,
            concept_media_url: conceptInputs.mediaUrl || null,
            concept_media_type: conceptInputs.mediaType,
            concept_price_usd: conceptInputs.priceUsd
              ? Number(conceptInputs.priceUsd)
              : null,
            concept_use_occasion: conceptInputs.useOccasion || null,
            validate_methodology: 'concept_test',
          }
        : {};

      // Pass 30 B3 — Compare Concepts schema columns.
      const compareFields: Record<string, unknown> = isCompare
        ? {
            concepts: compareConcepts.map((c) => ({
              id: c.id,
              name: c.name,
              description: c.description,
              price_usd: c.priceUsd ? Number(c.priceUsd) : null,
            })),
            comparison_methodology: 'sequential_monadic',
            rotation_strategy: 'random',
          }
        : {};

      // Pass 29 B4 — pricing schema columns. Methodology fixed to
      // van_westendorp_plus_gabor_granger for now (the Pass 29 prompt
      // generator's only branch).
      const pricingFields: Record<string, unknown> = isPricing
        ? {
            pricing_product_description: pricingInputs.productDescription,
            pricing_currency: pricingInputs.currency,
            pricing_model: pricingInputs.pricingModel,
            pricing_context: pricingInputs.pricingContext || null,
            pricing_expected_min: pricingInputs.expectedMin
              ? Number(pricingInputs.expectedMin)
              : null,
            pricing_expected_max: pricingInputs.expectedMax
              ? Number(pricingInputs.expectedMax)
              : null,
            pricing_methodology: 'van_westendorp_plus_gabor_granger',
          }
        : {};

      // Pass 28 A — brand_lift mission rows must populate the schema
      // columns that have existed since Pass 25 Phase 1A + Pass 27.
      // Compute the uplift-aware price_breakdown so the dashboard can
      // show the same total the user just confirmed on /setup; the
      // backend remains canonical at payment time.
      const brandLiftFields: Record<string, unknown> = isBrandLift
        ? (() => {
            const bl = brandLiftState;
            const respCount = aiResult?.suggestedRespondentCount ?? bl.respondentCount;
            const tier =
              [...BRAND_LIFT_TIERS].find((t) => respCount <= t.maxCount) ??
              BRAND_LIFT_TIERS[BRAND_LIFT_TIERS.length - 1];
            const breakdown = calculateBrandLiftMissionPrice({
              respondentBaseUSD: tier.packagePrice,
              marketCount: bl.markets.length,
              channelCount: bl.channels.length,
            });
            return {
              creative_metadata: bl.creative,
              targeted_markets: bl.markets,
              campaign_channels: bl.channels,
              wave_config: bl.wave,
              competitor_brands: bl.competitors,
              brand_lift_template: bl.kpiTemplate,
              price_breakdown: {
                base_usd: breakdown.base,
                market_uplift_usd: breakdown.marketUplift,
                channel_uplift_usd: breakdown.channelUplift,
                total_usd: breakdown.total,
                market_count: bl.markets.length,
                channel_count: bl.channels.length,
                ladder_version: 'pass_27_v1',
              },
              price_estimated: breakdown.total,
              respondent_count: respCount,
            };
          })()
        : {};

      const insertPayload = {
        user_id: user.id,
        title: deriveTitle(briefText, goalLabel),
        brief: aiContext,
        goal_type: missionGoal,
        status: 'draft',
        // Pass 21 Bug 16: fallback default 100 → 50 (entry-tier alignment).
        respondent_count: aiResult?.suggestedRespondentCount ?? 50,
        price_estimated: 99,
        questions: aiResult?.questions ?? null,
        target_audience: targetAudience,
        // Phase 10.5: persist the uploaded asset so /dashboard/:missionId
        // can render a preview and the future survey renderer can show
        // respondents exactly what they're evaluating.
        mission_assets: missionAssets,
        ...universalFields,
        ...pricingFields,
        ...roadmapFields,
        ...csatFields,
        ...validateFields,
        ...compareFields,
        ...brandLiftFields,
      };

      const { data: missionData, error } = await supabase
        .from('missions')
        .insert([insertPayload])
        .select()
        .single();

      if (error || !missionData) {
        console.error('Mission insert failed:', error);
        toast.error(
          error?.message?.includes('row-level security')
            ? 'Sign-in expired - please sign in again.'
            : 'Could not save mission - try again in a moment.',
        );
        inflightRef.current = false;
        setIsSubmitting(false);
        return;
      }

      clearAllDrafts();
      trackFunnel('mission_setup_completed', { goal_type: missionGoal, mission_id: missionData.id });

      if (aiResult) {
        try {
          localStorage.setItem(
            AI_BACKUP_KEY,
            JSON.stringify({ ...aiResult, timestamp: Date.now() }),
          );
        } catch {
          /* storage full — skip backup */
        }
      }

      navigate(`/dashboard/${missionData.id}`, {
        state: {
          missionData,
          fromSetup: true,
          generatedQuestions: aiResult?.questions ?? null,
          missionObjective: aiResult?.missionObjective ?? '',
          targetingSuggestions: aiResult?.targetingSuggestions ?? null,
          suggestedRespondentCount: aiResult?.suggestedRespondentCount ?? null,
          clarifyAnswers,
          aiParams: {
            goal: missionGoal,
            subject: briefText,
            objective: goalLabel,
          },
        },
      });
    } catch (err) {
      console.error('Unexpected generate error:', err);
      toast.error('Something went wrong. Please try again.');
      inflightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const topNav = user ? (
    <AuthedTopNav />
  ) : (
    <TopNav
      left={
        <Link to="/" aria-label="VETT home">
          <Logo responsive />
        </Link>
      }
      right={
        <Button variant="ghost" size="md" onClick={() => navigate('/signin?redirect=/setup')}>
          Sign in
        </Button>
      }
      mobileMenu={
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => navigate('/signin?redirect=/setup')}
        >
          Sign in
        </Button>
      }
    />
  );

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-bg text-t1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-lime" aria-hidden />
      </div>
    );
  }

  // Pass 23 Bug 23.65 v3 defensive guard. If somehow the missionGoal lands on
  // 'creative_attention' while we're still rendering /setup (deep-link race
  // before the useEffect redirect fires, stale state from a prior session,
  // or any future regression that bypasses handleGoalChange), show a spinner
  // instead of the textarea + Generate-Survey UI. The useEffect above will
  // navigate('/creative-attention/new') on the next tick.
  if (missionGoal === 'creative_attention' && !location.pathname.startsWith('/creative-attention')) {
    return (
      <div className="min-h-[100dvh] bg-bg text-t1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-lime" aria-hidden />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg text-t1 flex flex-col">
      {topNav}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="px-4 md:px-10 pt-8 md:pt-14 pb-6 md:pb-10">
        <div className="max-w-[920px] mx-auto text-center">
          <h1
            className="font-display font-black text-white leading-[1.05] tracking-[-1.2px]"
            style={{ fontSize: 'clamp(30px, 6.5vw, 44px)' }}
          >
            What do you want to <span className="text-lime">VETT?</span>
          </h1>
          <p className="mt-3 font-body text-t2 text-[14px] md:text-[15px] leading-relaxed">
            Just describe your idea in your own words. AI does the rest.
          </p>
        </div>
      </section>

      {/* ── Mission Brief card ───────────────────────────────── */}
      <section className="px-4 md:px-10 pb-10 md:pb-16">
        <div className="max-w-[920px] mx-auto">
          <div
            className={[
              'bg-bg2 border border-b1 rounded-[20px]',
              'p-5 md:p-7',
            ].join(' ')}
          >
            {/* Title */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-lime font-display font-black text-[16px] leading-none"
                aria-hidden
              >
                ✦
              </span>
              <h2 className="font-display font-black text-white text-[15px] tracking-tight-2">
                Mission Brief
              </h2>
            </div>

            {/* Step 1 — goals */}
            <p className="font-body text-[12px] text-t2 mb-3">
              1. Mission Goal (Select One)
            </p>
            <GoalGrid
              value={missionGoal}
              onChange={handleGoalChange}
              disabled={isSubmitting}
            />

            {/* Step 2 — describe */}
            <div className="mt-5">
              <p className="font-body text-[12px] text-t2 mb-2">
                2. Describe what you want to research
              </p>

              <div
                className={[
                  'rounded-xl border bg-bg3',
                  'transition-colors',
                  showLengthError
                    ? 'border-red/60'
                    : 'border-b1 focus-within:border-lime/60',
                ].join(' ')}
              >
                <textarea
                  value={missionDescription}
                  onChange={handleDescriptionChange}
                  onBlur={() => setAttemptedSubmit(true)}
                  placeholder={placeholder}
                  rows={4}
                  maxLength={DESCRIPTION_MAX}
                  disabled={isSubmitting}
                  className={[
                    'block w-full resize-y min-h-[112px]',
                    'bg-transparent px-4 pt-3.5 pb-2',
                    'font-body text-[14px] text-t1',
                    'placeholder:text-t4',
                    'focus:outline-none',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                  ].join(' ')}
                />

                {/* Bottom toolbar — chip(s) + char counter */}
                <div
                  className={[
                    'flex flex-wrap items-center justify-between gap-2',
                    'px-3 pb-3 pt-1',
                  ].join(' ')}
                >
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {showUpload && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileChange}
                          className="hidden"
                          aria-hidden
                        />
                        {uploadingName ? (
                          <span
                            className={[
                              'inline-flex items-center gap-1.5 rounded-pill',
                              'px-2.5 py-1',
                              'bg-pur/10 border border-pur/30',
                              'font-display font-bold text-[10px] text-pur',
                              'max-w-[200px] sm:max-w-[260px]',
                            ].join(' ')}
                            aria-live="polite"
                          >
                            <Loader2 className="w-3 h-3 animate-spin shrink-0" aria-hidden />
                            <span className="truncate">
                              Uploading {uploadingName}…
                            </span>
                          </span>
                        ) : uploadedAsset ? (
                          <span
                            className={[
                              'inline-flex items-center gap-1.5 rounded-pill',
                              'px-2.5 py-1',
                              'bg-pur/15 border border-pur/30',
                              'font-display font-bold text-[10px] text-pur',
                              'max-w-[200px] sm:max-w-[260px]',
                            ].join(' ')}
                          >
                            <span className="truncate">
                              {uploadedAsset.type === 'video' ? '🎬' : '🖼'}{' '}
                              {uploadedAsset.filename}
                            </span>
                            <button
                              type="button"
                              onClick={clearUploadedFile}
                              aria-label="Remove uploaded file"
                              className="shrink-0 text-pur/80 hover:text-pur"
                              disabled={isSubmitting}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting}
                            className={[
                              'inline-flex items-center gap-1.5 rounded-pill',
                              'px-2.5 py-1',
                              'bg-pur/10 border border-pur/30 hover:bg-pur/15',
                              'font-display font-bold text-[10px] text-pur',
                              'transition-colors',
                              'disabled:opacity-60 disabled:cursor-not-allowed',
                            ].join(' ')}
                          >
                            🖼 Add image / video
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <span
                    className={[
                      'shrink-0 font-body text-[10px]',
                      charCount > DESCRIPTION_MAX * 0.9
                        ? 'text-org'
                        : isValid
                          ? 'text-t3'
                          : showLengthError
                            ? 'text-red'
                            : 'text-t4',
                    ].join(' ')}
                    aria-live="polite"
                  >
                    {charCount} / {DESCRIPTION_MAX}
                  </span>
                </div>
              </div>

              {/* Below-field helper / error */}
              <div className="flex items-center justify-between mt-2 gap-2">
                <span className="font-body text-[11px] text-t3">
                  {showLengthError
                    ? `Minimum ${DESCRIPTION_MIN} characters - ${Math.max(0, DESCRIPTION_MIN - charCount)} to go.`
                    : isValid
                      ? `Looks good - ${charCount} characters of detail.`
                      : `Minimum ${DESCRIPTION_MIN} characters.`}
                </span>
              </div>
            </div>

            {/* Pass 28 A — Brand Lift uses the deep picker stack; other
                goals keep the existing clarify reveal. */}
            {isBrandLift ? (
              user ? (
                <BrandLiftSetupSection
                  userId={user.id}
                  state={brandLiftState}
                  onChange={setBrandLiftState}
                  onGenerate={handleGenerate}
                  submitting={isSubmitting}
                  briefValid={isValid}
                />
              ) : (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => navigate('/signin?redirect=/setup?goal=brand_lift')}
                    className="w-full h-12 rounded-xl bg-lime text-black font-display font-black text-[14px] uppercase tracking-widest hover:bg-lime/90"
                  >
                    Sign in to set up your Brand Lift
                  </button>
                </div>
              )
            ) : (
              <>
                {/* Pass 29 B2 / B4 — universal inputs + pricing collector
                    rendered above the Generate Survey CTA when the goal
                    is methodology-bound. brand_lift / creative_attention /
                    research are handled by the surrounding conditionals. */}
                {isUniversalShown && (
                  <div className="mt-5">
                    <UniversalMissionInputs
                      state={universalInputs}
                      onChange={setUniversalInputs}
                    />
                  </div>
                )}
                {isPricing && (
                  <div className="mt-4">
                    <PricingInputs
                      state={pricingInputs}
                      onChange={setPricingInputs}
                    />
                  </div>
                )}
                {isRoadmap && (
                  <div className="mt-4">
                    <FeatureListCollector
                      features={roadmapFeatures}
                      onChange={setRoadmapFeatures}
                    />
                  </div>
                )}
                {isCSAT && (
                  <div className="mt-4">
                    <CSATInputs
                      state={csatInputs}
                      onChange={setCsatInputs}
                    />
                  </div>
                )}
                {isValidate && user && (
                  <div className="mt-4">
                    <ConceptCollector
                      userId={user.id}
                      state={conceptInputs}
                      onChange={setConceptInputs}
                    />
                  </div>
                )}
                {isCompare && (
                  <div className="mt-4">
                    <ConceptListCollector
                      concepts={compareConcepts}
                      onChange={setCompareConcepts}
                    />
                  </div>
                )}

                {/* Primary CTA — reveals clarify. Hidden once clarify is open. */}
                {!showClarify && (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={(isPricing || isRoadmap || isCSAT || isValidate || isCompare) ? handleGenerate : handleRevealClarify}
                      disabled={isSubmitting || revealingClarify}
                      className={[
                        'w-full h-12 rounded-xl',
                        'inline-flex items-center justify-center gap-2',
                        'font-display font-black text-[14px] uppercase tracking-widest',
                        'transition-colors',
                        'disabled:opacity-60 disabled:cursor-not-allowed',
                        isValid
                          ? 'bg-lime text-black hover:bg-lime/90 shadow-lime-soft'
                          : 'bg-lime/20 text-lime/70',
                      ].join(' ')}
                    >
                      {revealingClarify ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                          <span>Thinking…</span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden>✦</span>
                          <span>Generate Survey</span>
                        </>
                      )}
                    </button>
                    <p className="mt-2.5 text-center font-body text-[11px] text-t4">
                      You&apos;ll refine questions + targeting on the next screen before
                      paying anything.
                    </p>
                  </div>
                )}

                {/* Step 3 — Clarify (inline, revealed by Step 1 CTA).
                    Dynamic path renders AI-generated questions from
                    /api/ai/clarify; static path renders Market/Stage/Price.
                    The 15s race in handleRevealClarify decides which. */}
                <AnimatePresence initial={false}>
                  {showClarify &&
                    (dynamicClarify && dynamicClarify.length > 0 ? (
                      <DynamicClarifySection
                        key="clarify-dynamic"
                        questions={dynamicClarify}
                        answers={dynamicClarifyAnswers}
                        onChange={setDynamicClarifyAnswers}
                        onSubmit={handleGenerate}
                        submitting={isSubmitting}
                      />
                    ) : (
                      <ClarifySection
                        key="clarify-static"
                        answers={clarifyAnswers}
                        onChange={setClarifyAnswers}
                        onSubmit={handleGenerate}
                        submitting={isSubmitting}
                      />
                    ))}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MissionSetupPage;
