import { Question } from '../components/dashboard/QuestionEngine';
import { api, ApiError } from '../lib/apiClient';
import { supabase } from '../lib/supabase';
import type { MissionAsset } from '../types/missionAssets';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://vettit-backend-production.up.railway.app';

/**
 * Survey generation — Phase 10.5.
 *
 * Two shapes matter here:
 *   1. The outbound request to the backend. We now send:
 *        - goal (legacy, kept for backward compat with the old prompt)
 *        - goal_type (the canonical id from missionGoals.ts — all 14)
 *        - description (brief)
 *        - mission_assets (array of { url, type, filename, ... } when the
 *          user uploaded one on the setup page)
 *      The backend is expected to key its system prompt off `goal_type`
 *      and, when `mission_assets` is non-empty, add an asset-context line
 *      so generated questions reference "this ad / video / image".
 *
 *   2. The local fallback when the backend is unreachable (or returns an
 *      empty shape). The fallback used to cover only 7 goals; Phase 10.5
 *      expands it to all 14 so every goal tile on /setup gets
 *      goal-appropriate questions even with zero backend.
 */

interface GenerateSurveyParams {
  goal: string;
  subject: string;
  objective: string;
  /** Optional: assets uploaded on /setup (image/video) that the questions should reference. */
  assets?: MissionAsset[];
  /**
   * Optional: the user's answers to the clarify step — either the static
   * { market, stage, price } shape OR a dynamic { [questionId]: chipId }
   * map returned by /api/ai/clarify. Forwarded verbatim so the backend
   * survey prompt can condition on whatever the user actually answered.
   */
  clarifyAnswers?: Record<string, string>;
}

/**
 * Phase 10 — Smart-split targeting suggestion.
 *
 * We extend the existing `targetingSuggestions` (kept for backward
 * compat) with a richer `suggestedTargeting` shape that mirrors the
 * frontend's TargetingConfig across every section. Populated from the
 * new generate-survey response field of the same name; falls back to
 * mapping the legacy /api/ai/suggest-targeting response when the
 * generate-survey backend doesn't yet supply it.
 *
 * All fields are optional — the consumer merges whatever's populated
 * into the targeting config and leaves the rest alone. Unknown fields
 * are ignored at runtime, so backend can add slots without breaking.
 */
export interface SuggestedTargeting {
  countries?: string[];
  cities?: string[];
  ageRanges?: string[];
  genders?: string[];
  education?: string[];
  marital?: string[];
  parental?: string[];
  employment?: string[];
  industries?: string[];
  roles?: string[];
  companySizes?: string[];
  incomeRanges?: string[];
  behaviors?: string[];
  devices?: string[];
  /** Free-text explanation shown as a small caption in the panel. */
  reasoning?: string;
}

interface SurveyGenerationResult {
  questions: Question[];
  missionObjective: string;
  suggestedRespondentCount?: number;
  /** Legacy shape — kept so existing callers still compile. */
  targetingSuggestions?: {
    countries: string[];
    ageRanges: string[];
    genders: string[];
    reasoning: string;
  };
  /** Phase 10 — full targeting suggestion across all sections. */
  suggestedTargeting?: SuggestedTargeting;
}

// Map Claude's types to the frontend's supported types
const VALID_TYPES = ['single', 'multi', 'rating', 'opinion', 'text'];
const TYPE_MAP: Record<string, string> = {
  single_choice: 'single',
  multiple_choice: 'multi',
  nps: 'rating',
  yesno: 'single',
  likert: 'opinion',
  open: 'text',
  open_ended: 'text',
};

function mapType(rawType: string): string {
  const mapped = TYPE_MAP[rawType] || rawType;
  return VALID_TYPES.includes(mapped) ? mapped : 'single';
}

function mapQuestion(q: any, i: number): Question {
  const type = mapType(q.type);
  let options = q.options || [];

  // Ensure yesno gets proper options
  if (q.type === 'yesno' && options.length === 0) {
    options = ['Yes', 'No'];
  }
  // Opinion needs at least 3 options
  if (type === 'opinion' && options.length === 0) {
    options = ['Yes', 'No', 'Maybe'];
  }

  return {
    // Preserve the backend's per-question analysis metadata. PR #65 carried
    // `kind` + `dimension` through an explicit spread-conditional pair, because
    // market_entry's per-market demand analysis (computeMarketEntry) groups
    // questions by `kind` with NO fallback, and audience_profiling's segmentation
    // (computeAudienceProfiling) matches attitudinal questions by `dimension` —
    // drop either and those analyses degrade to their null-fallback paths.
    //
    // That two-field allowlist was still dropping the ~19 other methodology tags
    // the generators emit and the results pages read straight off
    // mission.questions: methodology / vw_band / gg_anchor_index (Van Westendorp
    // + Gabor-Granger, PricingResultsPage), feature_set / feature_id / kano_type
    // (RoadmapResultsPage), churn_stage (ChurnResultsPage), concept_id /
    // is_final_choice (CompareResultsPage), is_paired_comparison / is_turf
    // (NamingResultsPage), brand_id (CompetitorAnalysisResultsPage),
    // funnel_stage / kpi_category / is_lift_question (brand lift),
    // qualifying_answers / screening_continue_on (screening gate), category,
    // channel_id, and whatever the next methodology adds.
    //
    // So this is a PASSTHROUGH rather than a longer allowlist: spread the source
    // question first, then overlay the mapped fields. Every unknown key survives
    // by construction, including ones that don't exist yet, while the mapping
    // below still wins for the fields this function owns.
    ...q,
    id: q.id || `q${i + 1}`,
    text: q.text || '',
    type: type as any,
    options,
    isScreening: q.isScreening || false,
    qualifyingAnswer: q.qualifyingAnswer,
    aiRefined: true,
    hasPIIError: false,
  };
}

/**
 * Refine a single question via backend AI.
 *
 * POSTs `{ text, goal, context? }` to /api/ai/refine-description and
 * expects `{ text: string, type?: string, options?: string[] }` back.
 * On any error (network, 404 if the endpoint isn't deployed yet, bad
 * shape) we fall back to a tiny local heuristic — same shape the old
 * QuestionEngine used — so the UI always gets a usable improvement
 * and never ends up stuck on a spinner.
 */
export interface RefineQuestionResult {
  text: string;
  type?: Question['type'];
  options?: string[];
}

export const refineQuestion = async (
  question: Question,
  goal: string | null,
  context?: string,
): Promise<RefineQuestionResult> => {
  try {
    const resp = (await api.post('/api/ai/refine-description', {
      text: question.text,
      type: question.type,
      options: question.options,
      goal,
      context,
    })) as Partial<RefineQuestionResult> | null;

    const refinedText =
      typeof resp?.text === 'string' && resp.text.trim().length > 0
        ? resp.text.trim()
        : null;
    if (refinedText) {
      const mappedType =
        resp?.type && VALID_TYPES.includes(mapType(String(resp.type)))
          ? (mapType(String(resp.type)) as Question['type'])
          : undefined;
      const mappedOptions = Array.isArray(resp?.options)
        ? resp.options.map(String)
        : undefined;
      return { text: refinedText, type: mappedType, options: mappedOptions };
    }
    throw new SurveyGenerationError('empty', null, 'the refiner returned no text');
  } catch (err) {
    // No local rewrite. A heuristic used to reword the question ("How would
    // you describe ...?") and the editor labelled it "AI refined". The caller
    // shows "Couldn't refine that question - try again".
    if (err instanceof SurveyGenerationError) throw err;
    throw new SurveyGenerationError(
      'unavailable',
      err instanceof ApiError ? err.status : null,
      err instanceof Error ? err.message : String(err),
    );
  }
};

/**
 * Phase 10.5 — Standalone targeting suggestion.
 *
 * Calls POST /api/ai/suggest-targeting and maps the backend's legacy response
 * shape to the frontend's SuggestedTargeting interface.
 *
 * Used by:
 *   · MissionSetupPage: stored in target_audience.aiTargeting so the
 *     dashboard can pre-populate the targeting panel on first load.
 *   · Future "Refresh AI targeting" CTA on DashboardPage.
 *
 * Always resolves — never throws. Returns null on any error so callers
 * can treat it as "no suggestions available."
 */
export const suggestTargeting = async (
  description: string,
  goal: string | null,
): Promise<SuggestedTargeting | null> => {
  try {
    const resp = (await api.post('/api/ai/suggest-targeting', {
      description,
      goal,
    })) as Record<string, unknown> | null;
    if (!resp || typeof resp !== 'object') return null;

    // The legacy endpoint returns a nested shape; flatten to SuggestedTargeting.
    const geography = (resp.geography as Record<string, unknown> | undefined) ?? {};
    const demographics = (resp.demographics as Record<string, unknown> | undefined) ?? {};
    const professional = (resp.professional as Record<string, unknown> | undefined) ?? {};

    const strArr = (v: unknown): string[] | undefined => {
      if (!Array.isArray(v)) return undefined;
      const out = v.filter((x): x is string => typeof x === 'string' && x.length > 0);
      return out.length > 0 ? out : undefined;
    };

    const merged: SuggestedTargeting = {
      countries:     strArr(geography.recommendedCountries),
      ageRanges:     strArr(demographics.ageRanges),
      genders:       strArr(demographics.genders),
      education:     strArr(demographics.education),
      employment:    strArr(demographics.employment),
      industries:    strArr(professional.industries),
      roles:         strArr(professional.roles),
      companySizes:  strArr(professional.companySizes),
      reasoning:
        typeof geography.reasoning === 'string' ? geography.reasoning : undefined,
    };

    const hasAny = Object.values(merged).some((v) =>
      Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.length > 0,
    );
    return hasAny ? merged : null;
  } catch (err) {
    console.warn('[suggestTargeting] backend unavailable', err);
    return null;
  }
};

/**
 * Phase 9 — Adaptive clarify (frontend ready, backend optional).
 *
 * The UI always ships with three static clarify cards (Market / Stage /
 * Price) defined in ClarifySection.tsx. Phase 9 makes the frontend
 * **ready** to receive an AI-generated clarify layout from the backend:
 *
 *   POST /api/ai/clarify
 *     body: { goal: string | null, brief: string }
 *     200:  { questions: AdaptiveClarifyQuestion[], category: string | null }
 *     4xx/5xx/absent: treat as "no adaptive, fall back to static"
 *
 * `category` is the benchmark key: a normalised value from the backend's
 * closed taxonomy (services/ai/missionCategory.js), produced by the SAME
 * Claude call that produces the questions — no second request, no extra
 * wait. It is null when the backend could not classify at all, and it is
 * independent of `questions`: a complete brief legitimately returns zero
 * questions AND a category, so the two must be read separately.
 *
 * The frontend **never** blocks on this call — the static cards are
 * always the default. Callers wait up to CLARIFY_TIMEOUT_MS (15s since
 * Pass 6A - the old 800ms note here was stale) and fall back silently if
 * the endpoint isn't deployed or times out.
 *
 * Contract for AdaptiveClarifyQuestion is kept intentionally loose so
 * the backend can ship incremental improvements without requiring
 * frontend type changes. Any question that doesn't validate is
 * dropped — we never render untrusted fields.
 */
export interface AdaptiveClarifyChip {
  id: string;
  label: string;
}

export interface AdaptiveClarifyQuestion {
  id: string;
  question: string;
  chips: AdaptiveClarifyChip[];
  defaultChipId?: string;
}

/** What one /api/ai/clarify round trip yields. `questions: null` keeps the
 *  previous "fall back to the static cards" meaning; `category` is carried
 *  separately so it survives an empty-questions response. */
export interface AdaptiveClarifyResult {
  questions: AdaptiveClarifyQuestion[] | null;
  category: string | null;
}

const NO_CLARIFY: AdaptiveClarifyResult = { questions: null, category: null };

/** Shape check only — deliberately NOT a copy of the backend taxonomy.
 *  Duplicating the key list here would create a second source of truth that
 *  silently rots the first time the owner edits MISSION_CATEGORIES. The
 *  backend already guarantees a valid key or null; this just refuses
 *  anything that isn't a plausible snake_case key. */
function asCategoryKey(value: unknown): string | null {
  return typeof value === 'string' && /^[a-z][a-z0-9_]{1,63}$/.test(value)
    ? value
    : null;
}

// Pass 6A: raised from 5000ms → 15000ms.
// Measured live Railway round-trip is ~4.4s for a warm request.
// Railway cold-start on hobby plan adds 2-4s on top. Claude Haiku
// p95 is ~3-5s for structured JSON. Budget for the p99 tail (≈12s)
// with 3s of margin. Previously the 5s abort fired before the backend
// could return on cold starts, causing consistent static fallback.
const CLARIFY_TIMEOUT_MS = 15_000;

function isAdaptiveClarifyQuestion(
  value: unknown,
): value is AdaptiveClarifyQuestion {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || !v.id) return false;
  if (typeof v.question !== 'string' || !v.question) return false;
  if (!Array.isArray(v.chips)) return false;
  for (const c of v.chips) {
    if (!c || typeof c !== 'object') return false;
    const chip = c as Record<string, unknown>;
    if (typeof chip.id !== 'string' || typeof chip.label !== 'string') {
      return false;
    }
  }
  return true;
}

export const fetchAdaptiveClarify = async (
  goal: string | null,
  brief: string,
): Promise<AdaptiveClarifyResult> => {
  const controller = new AbortController();
  const timer = window.setTimeout(
    () => controller.abort(),
    CLARIFY_TIMEOUT_MS,
  );
  try {
    // Direct fetch (not api.post) because we need AbortSignal support
    // and api.post doesn't take options. Still uses the same auth
    // header pipeline so RLS is respected on the backend.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    const res = await fetch(`${API_URL}/api/ai/clarify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ goal, brief }),
      signal: controller.signal,
    });
    if (!res.ok) return NO_CLARIFY;
    const resp = (await res.json()) as {
      questions?: unknown;
      category?: unknown;
    };
    if (!resp) return NO_CLARIFY;
    const category = asCategoryKey(resp.category);
    if (!Array.isArray(resp.questions)) return { questions: null, category };
    const valid = resp.questions.filter(isAdaptiveClarifyQuestion);
    // Require at least one well-formed question; otherwise fall back so
    // the user always sees usable cards. The category is unaffected — a
    // complete brief returns no questions but is still classifiable.
    return { questions: valid.length > 0 ? valid : null, category };
  } catch (err) {
    // Use warn (not error) so it's visible for debugging without alarming
    // users in prod. Gate on DEV so production consoles stay clean.
    if (import.meta.env.DEV) {
      console.warn(
        '[clarify] backend call failed — falling back to static clarify:',
        err,
      );
    }
    return NO_CLARIFY;
  } finally {
    window.clearTimeout(timer);
  }
};

/**
 * Phase 10 — strip any non-string or non-array values from an untrusted
 * backend response. Keeps the frontend resilient to backend schema
 * drift: extra fields are dropped silently, and malformed ones never
 * reach the targeting panel where they could crash the render.
 */
function sanitiseSuggestedTargeting(
  raw: Record<string, unknown>,
): Partial<SuggestedTargeting> {
  const strArr = (v: unknown): string[] | undefined => {
    if (!Array.isArray(v)) return undefined;
    const out = v.filter((x): x is string => typeof x === 'string' && x.length > 0);
    return out.length > 0 ? out : undefined;
  };
  const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.length > 0 ? v : undefined;
  return {
    countries: strArr(raw.countries),
    cities: strArr(raw.cities),
    ageRanges: strArr(raw.ageRanges),
    genders: strArr(raw.genders),
    education: strArr(raw.education),
    marital: strArr(raw.marital),
    parental: strArr(raw.parental),
    employment: strArr(raw.employment),
    industries: strArr(raw.industries),
    roles: strArr(raw.roles),
    companySizes: strArr(raw.companySizes),
    incomeRanges: strArr(raw.incomeRanges),
    behaviors: strArr(raw.behaviors),
    devices: strArr(raw.devices),
    reasoning: str(raw.reasoning),
  };
}

/**
 * Survey generation failed. There is no fallback: a survey that pretends to
 * be generated is worse than an error, because the customer pays for it.
 */
export class SurveyGenerationError extends Error {
  readonly reason: 'unavailable' | 'empty';
  readonly status: number | null;
  constructor(reason: 'unavailable' | 'empty', status: number | null, detail: string) {
    super(`Survey generation failed (${reason}${status ? `, HTTP ${status}` : ''}): ${detail}`);
    this.name = 'SurveyGenerationError';
    this.reason = reason;
    this.status = status;
  }
}

export const generateSurvey = async (
  params: GenerateSurveyParams
): Promise<SurveyGenerationResult> => {
  const { goal, subject, objective, assets, clarifyAnswers } = params;
  const hasAssets = !!(assets && assets.length > 0);

  // Try real Claude AI via backend first
  try {
    const description = objective
      ? `${subject}. ${objective}`
      : subject;

    // Phase 10.5: send goal_type + mission_assets so the backend prompt
    // can (a) key off the canonical goal id for template selection and
    // (b) anchor questions to the uploaded creative when one is present.
    // Legacy `goal` is retained so older backend versions still match.
    const surveyBody: Record<string, unknown> = {
      goal,
      goal_type: goal,
      description,
    };
    if (hasAssets) {
      surveyBody.mission_assets = assets;
    }
    if (clarifyAnswers && Object.keys(clarifyAnswers).length > 0) {
      // Forward as both keys for backward-compat — older backend prompts
      // look for `clarify`, newer ones for `clarify_answers`. Sending both
      // costs nothing and avoids a coordinated deploy.
      surveyBody.clarify = clarifyAnswers;
      surveyBody.clarify_answers = clarifyAnswers;
    }

    // Run survey generation and targeting suggestions in parallel
    const [surveyResult, targetingResult] = await Promise.allSettled([
      api.post('/api/ai/generate-survey', surveyBody),
      api.post('/api/ai/suggest-targeting', { description, goal }),
    ]);

    const survey = surveyResult.status === 'fulfilled' ? surveyResult.value : null;
    const targeting = targetingResult.status === 'fulfilled' ? targetingResult.value : null;

    if (survey?.questions?.length) {
      // Phase 10 — merge a full targeting suggestion when the backend
      // supplies one. Start from whatever generate-survey returned in
      // `suggestedTargeting`, then fill any missing slots from the
      // legacy /api/ai/suggest-targeting response. Order matters:
      // generate-survey is more contextually aware so its values win.
      const fromSurvey: Partial<SuggestedTargeting> =
        survey.suggestedTargeting && typeof survey.suggestedTargeting === 'object'
          ? sanitiseSuggestedTargeting(survey.suggestedTargeting)
          : {};
      const fromLegacy: Partial<SuggestedTargeting> = targeting
        ? {
            countries: Array.isArray(targeting.geography?.recommendedCountries)
              ? targeting.geography.recommendedCountries
              : undefined,
            ageRanges: Array.isArray(targeting.demographics?.ageRanges)
              ? targeting.demographics.ageRanges
              : undefined,
            genders: Array.isArray(targeting.demographics?.genders)
              ? targeting.demographics.genders
              : undefined,
            reasoning: typeof targeting.geography?.reasoning === 'string'
              ? targeting.geography.reasoning
              : undefined,
          }
        : {};
      const merged: SuggestedTargeting = {
        ...fromLegacy,
        ...fromSurvey, // survey wins
      };
      const hasAnySuggestion =
        Object.values(merged).some((v) =>
          Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.length > 0,
        );

      return {
        questions: survey.questions.map(mapQuestion),
        missionObjective: survey.missionStatement || `To understand ${subject}.`,
        suggestedRespondentCount: survey.suggestedRespondentCount,
        targetingSuggestions: targeting ? {
          countries: targeting.geography?.recommendedCountries || [],
          ageRanges: targeting.demographics?.ageRanges || [],
          genders: targeting.demographics?.genders || [],
          reasoning: targeting.geography?.reasoning || '',
        } : undefined,
        suggestedTargeting: hasAnySuggestion ? merged : undefined,
      };
    }

    // No questions back. Say which: the call failed, or it answered empty.
    if (surveyResult.status === 'rejected') {
      const e = surveyResult.reason;
      throw new SurveyGenerationError(
        'unavailable',
        e instanceof ApiError ? e.status : null,
        e instanceof Error ? e.message : String(e),
      );
    }
    throw new SurveyGenerationError('empty', null, 'the generator returned no questions');
  } catch (err) {
    if (err instanceof SurveyGenerationError) throw err;
    throw new SurveyGenerationError(
      'unavailable',
      err instanceof ApiError ? err.status : null,
      err instanceof Error ? err.message : String(err),
    );
  }
};

// The local question templates that used to live here were removed on
// 2026-09-19. They ran when the backend survey generator failed and pasted the
// customer's brief into fixed questions ("Are you interested in <brief>?"),
// labelled every one "AI refined", and let the mission be created. On
// 2026-09-18 a customer received exactly that during a provider outage. A
// failed generation now throws SurveyGenerationError and nothing is created.

/* ────────────────────────────────────────────────────────────────────
 * AI-drafted extra question (POST /api/ai/draft-question)
 *
 * Drafts ONE ad-hoc question for review. The backend performs no write
 * — the question enters missions.questions only when the user accepts
 * it in Mission Control, through the normal question-persistence path.
 *
 * ── Why this does NOT go through mapQuestion ────────────────────────
 * mapQuestion is a deliberate PASSTHROUGH: it spreads `...q` so every
 * methodology tag the survey generator emits survives into
 * missions.questions (PR #79 — the analyses read those tags straight
 * off the persisted array, and an allowlist there kept silently
 * dropping new ones).
 *
 * A drafted question needs the exact opposite. It is ad-hoc, carries no
 * methodological role, and must never be selected by the analyses —
 * services/analysis/audienceProfiling.js:153 finds attitudinal
 * questions with `q.kind === 'attitudinal' && q.dimension === d`,
 * pricing.js:117 finds Van Westendorp bands by `methodology` +
 * `vw_band`, and so on. A tag on this question would drop it into one
 * of those buckets and corrupt the customer's numbers.
 *
 * So this mapper is a CLOSED LITERAL: it names every field it copies
 * and spreads nothing. The backend already strips tags by the same
 * construction; doing it again here means a tag cannot reach
 * missions.questions even if the endpoint regressed or a response were
 * tampered with in transit. Do not "simplify" this into a spread.
 */
export const USER_DRAFTED_SOURCE = 'user_drafted';

export interface DraftedQuestion {
  text: string;
  type: Question['type'];
  options: string[];
  /** Positive marker — no generated question carries it. */
  source: typeof USER_DRAFTED_SOURCE;
}

export interface DraftQuestionResult {
  question: DraftedQuestion;
  cap: number;
  used: number;
  remaining: number;
}

/** Thrown so the UI can tell "you are out of drafts" from "it broke". */
export class DraftCapReachedError extends Error {
  cap: number;
  used: number;
  constructor(cap: number, used: number) {
    super('draft_cap_reached');
    this.name = 'DraftCapReachedError';
    this.cap = cap;
    this.used = used;
  }
}

/** Closed literal. No spread — see the note above. */
function mapDraftedQuestion(raw: unknown): DraftedQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const q = raw as Record<string, unknown>;
  const text = typeof q.text === 'string' ? q.text.trim() : '';
  if (!text) return null;
  const rawType = typeof q.type === 'string' ? q.type : 'single';
  const type = (VALID_TYPES.includes(rawType) ? rawType : 'single') as Question['type'];
  const options = Array.isArray(q.options)
    ? q.options.filter((o): o is string => typeof o === 'string' && o.trim().length > 0)
    : [];
  return { text, type, options, source: USER_DRAFTED_SOURCE };
}

export const draftQuestion = async (
  missionId: string,
  prompt: string,
  /** Accepted-but-not-yet-flushed drafts. Can only tighten the cap. */
  pendingDrafts = 0,
): Promise<DraftQuestionResult> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('not_authenticated');

  const res = await fetch(`${API_URL}/api/ai/draft-question`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      mission_id: missionId,
      prompt,
      pending_drafts: pendingDrafts,
    }),
  });

  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;

  if (res.status === 409 && body?.error === 'draft_cap_reached') {
    throw new DraftCapReachedError(Number(body.cap) || 0, Number(body.used) || 0);
  }
  if (!res.ok) throw new Error(String(body?.error ?? `draft_failed_${res.status}`));

  const question = mapDraftedQuestion(body?.question);
  if (!question) throw new Error('draft_unusable');

  return {
    question,
    cap: Number(body?.cap) || 0,
    used: Number(body?.used) || 0,
    remaining: Number(body?.remaining) || 0,
  };
};
