import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateSurvey } from '../services/aiService';
import { useToast } from '../components/ui/Toast';
import { TopNav } from '../components/ui/TopNav';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { AuthedTopNav } from '../components/layout/AuthedTopNav';
import { GoalGrid } from '../components/setup/GoalGrid';
import {
  GOALS_WITH_UPLOAD,
  getGoalById,
  getPlaceholderForGoal,
} from '../data/missionGoals';

/**
 * Mission Setup — authored step 1 of the redesign (Prompt 3 / Commit 3).
 *
 * Renders the prototype's "What do you want to VETT?" hero + Mission
 * Brief card (.design-reference/prototype.html lines 1212–1294):
 *
 *   1. GoalGrid — 14 goals, 2-col on mobile / 4-col on desktop.
 *   2. Describe — 30-char-minimum textarea with 500-char counter.
 *   3. Optional media-upload chip (Creative Attention goal only —
 *      render-only stub tracked in PROMPT_3_STUBS.md).
 *   4. Primary CTA — "✦ Generate Survey".
 *
 * ── What this commit preserves ──────────────────────────────────
 *   - `?q=` prefill from landing (commit 78cfd8a).
 *   - localStorage `missionSetupDraft` autosave / restore.
 *   - generateSurvey() wiring + /api/missions Supabase insert.
 *   - AI-result backup at `vettit_ai_result` for guest recovery.
 *
 * ── Still to come ────────────────────────────────────────────────
 *   - Clarify-card inline step (Commit 4) — "✦ Generate Survey" will
 *     flip to reveal the clarify card before calling handleInitialize.
 *   - localStorage key migration to `vett:mission_draft` (Commit 4).
 *   - Clarify Q2 → `stage` column mapping (Commit 4). Until then, the
 *     insert payload passes `stage: null`; the row was accepting nulls
 *     before, so this doesn't break existing consumers.
 *
 * ── Mobile responsiveness (verified at 375px) ────────────────────
 *   - Hero heading scales via clamp(), text-center stays center.
 *   - Mission Brief card uses 20px padding on mobile (prototype line
 *     614 equivalent) and never exceeds viewport (max-w + px-4 gutter).
 *   - GoalGrid collapses to grid-cols-2; the "NEW" pill sits inside
 *     the card's padding and long labels wrap without overflow.
 *   - Textarea is w-full of its parent, so padding contains it.
 *   - File-upload chip + char counter share a flex-wrap row so they
 *     stack instead of overflowing when the chip is present.
 */

const DRAFT_KEY = 'missionSetupDraft';
const AI_BACKUP_KEY = 'vettit_ai_result';
const DESCRIPTION_MIN = 30;
const DESCRIPTION_MAX = 500;

interface DraftShape {
  missionGoal?: string;
  missionDescription?: string;
  stage?: string;
  timestamp?: number;
}

export const MissionSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const toast = useToast();

  // `?q=` is a one-shot hero handoff. Read it before the draft so an
  // explicit hero submission wins over any previous draft.
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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft hydration + one-shot ?q= consumption.
  useEffect(() => {
    window.scrollTo(0, 0);

    if (queryPrefill) {
      const next = new URLSearchParams(searchParams);
      next.delete('q');
      setSearchParams(next, { replace: true });
    }

    // If nothing was handed in via location.state / ?q=, rehydrate draft.
    const state = location.state as
      | { inputText?: string; prefill?: string; intent?: string }
      | null;
    const hasIncomingPrefill =
      !!state?.inputText || !!state?.prefill || !!queryPrefill;

    if (!hasIncomingPrefill) {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        try {
          const draft = JSON.parse(raw) as DraftShape;
          if (draft.missionGoal && getGoalById(draft.missionGoal)) {
            setMissionGoal(draft.missionGoal);
          }
          if (typeof draft.missionDescription === 'string') {
            setMissionDescription(draft.missionDescription);
          }
        } catch {
          /* ignore malformed drafts */
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft on any relevant change. Skips empty drafts so we
  // don't overwrite a previously-good draft with nothing.
  useEffect(() => {
    if (!missionDescription && missionGoal === 'validate') return;
    const draft: DraftShape = {
      missionGoal,
      missionDescription,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage full / disabled — silently skip */
    }
  }, [missionGoal, missionDescription]);

  const charCount = missionDescription.trim().length;
  const isValid = charCount >= DESCRIPTION_MIN;
  const showLengthError = attemptedSubmit && !isValid;

  const selectedGoal = getGoalById(missionGoal);
  const placeholder = useMemo(
    () => getPlaceholderForGoal(missionGoal),
    [missionGoal],
  );
  const showUpload = GOALS_WITH_UPLOAD.has(missionGoal);

  // Clear the filename if the user switches away from an upload-enabled goal.
  useEffect(() => {
    if (!showUpload && uploadedFileName) {
      setUploadedFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [showUpload, uploadedFileName]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    // Render-only stub. File is held in state but never uploaded. See
    // .design-reference/PROMPT_3_STUBS.md — "Creative Attention upload".
    toast.info('File captured — frame-by-frame analysis coming soon.');
  };

  const clearUploadedFile = () => {
    setUploadedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, DESCRIPTION_MAX);
    setMissionDescription(next);
  };

  const handleGenerate = async () => {
    if (!isValid) {
      setAttemptedSubmit(true);
      toast.error(
        `Add a bit more detail — we need at least ${DESCRIPTION_MIN} characters to brief the AI.`,
      );
      return;
    }

    // Require auth before spending an AI call. Redirect-aware so users
    // return to /setup with their draft intact (localStorage survives).
    if (!user) {
      const redirect = encodeURIComponent('/setup');
      navigate(`/signin?redirect=${redirect}`);
      return;
    }

    setIsSubmitting(true);

    const goalLabel = selectedGoal?.label ?? missionGoal;
    const aiContext = `${goalLabel}: ${missionDescription.trim()}`;
    const subject = missionDescription.trim();
    const objective = goalLabel;

    try {
      // 1) Kick AI generation while we still have the user's context.
      let aiResult: Awaited<ReturnType<typeof generateSurvey>> | null = null;
      try {
        aiResult = await generateSurvey({
          goal: missionGoal,
          subject,
          objective,
        });
      } catch (aiErr) {
        console.warn('AI generation failed — continuing with defaults:', aiErr);
      }

      // 2) Insert mission row. `role` is intentionally NULL (the field
      //    was dropped in the redesign); `stage` is null until the
      //    clarify step lands in Commit 4 and wires Q2 into it.
      const { data: missionData, error } = await supabase
        .from('missions')
        .insert([
          {
            user_id: user.id,
            context: aiContext,
            target: 'General Audience',
            question: objective,
            respondent_count: aiResult?.suggestedRespondentCount || 100,
            estimated_price: 99,
            role: null,
            stage: null,
            status: 'DRAFT',
            mission_type: missionGoal,
            visualization_type: 'RATING',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error || !missionData) {
        console.error('Mission insert failed:', error);
        toast.error('Could not save mission — try again in a moment.');
        setIsSubmitting(false);
        return;
      }

      localStorage.removeItem(DRAFT_KEY);

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
          aiParams: { goal: missionGoal, subject, objective },
        },
      });
    } catch (err) {
      console.error('Unexpected generate error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  // TopNav chooses between authed/unauthed variants.
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
                        {uploadedFileName ? (
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
                              🎬 {uploadedFileName}
                            </span>
                            <button
                              type="button"
                              onClick={clearUploadedFile}
                              aria-label="Remove uploaded file"
                              className="shrink-0 text-pur/80 hover:text-pur"
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

            {/* Primary CTA */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isSubmitting}
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    <span>AI is crafting your mission…</span>
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
          </div>
        </div>
      </section>
    </div>
  );
};

export default MissionSetupPage;
