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
  GOALS_WITH_UPLOAD,
  getGoalById,
  getPlaceholderForGoal,
} from '../data/missionGoals';

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

  const [missionGoal, setMissionGoal] = useState<string>(() => {
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
    trackFunnel('mission_setup_started');

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
        if (draft.missionGoal && getGoalById(draft.missionGoal)) {
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
          ? 'Video uploaded — the AI will reference it in your survey questions.'
          : 'Image uploaded — the AI will reference it in your survey questions.',
      );
    } catch (err) {
      setUploadingName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      const message =
        err instanceof MissionAssetUploadError
          ? err.message
          : 'Upload failed — please try again.';
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
        `Add a bit more detail — we need at least ${DESCRIPTION_MIN} characters to brief the AI.`,
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

    if (inflightRef.current) return; // double-fire guard
    inflightRef.current = true;
    setIsSubmitting(true);

    const goalLabel = selectedGoal?.label ?? missionGoal;
    const briefText = missionDescription.trim();
    const aiContext = `${goalLabel}: ${briefText}`;

    // If an upload is still in flight, wait for the user to either finish
    // or clear it before letting generation kick off — otherwise the AI
    // prompt won't know about the asset and the row would ship without it.
    if (uploadingName) {
      toast.info('Still uploading — hang on a moment.');
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
        aiResult = await generateSurvey({
          goal: missionGoal,
          subject: briefText,
          objective: goalLabel,
          assets: missionAssets,
          clarifyAnswers: clarifyForPrompt,
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

      const insertPayload = {
        user_id: user.id,
        title: deriveTitle(briefText, goalLabel),
        brief: aiContext,
        goal_type: missionGoal,
        status: 'draft',
        respondent_count: aiResult?.suggestedRespondentCount ?? 100,
        price_estimated: 99,
        questions: aiResult?.questions ?? null,
        target_audience: targetAudience,
        // Phase 10.5: persist the uploaded asset so /dashboard/:missionId
        // can render a preview and the future survey renderer can show
        // respondents exactly what they're evaluating.
        mission_assets: missionAssets,
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
            ? 'Sign-in expired — please sign in again.'
            : 'Could not save mission — try again in a moment.',
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
              onChange={setMissionGoal}
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
                    ? `Minimum ${DESCRIPTION_MIN} characters — ${Math.max(0, DESCRIPTION_MIN - charCount)} to go.`
                    : isValid
                      ? `Looks good — ${charCount} characters of detail.`
                      : `Minimum ${DESCRIPTION_MIN} characters.`}
                </span>
              </div>
            </div>

            {/* Primary CTA — reveals clarify. Hidden once clarify is open. */}
            {!showClarify && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleRevealClarify}
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
          </div>
        </div>
      </section>
    </div>
  );
};

export default MissionSetupPage;
