/**
 * Canonical mission-goal catalogue — 14 entries, ordered to match
 * .design-reference/prototype.html lines 1220–1246.
 *
 * ──────────────────────────────────────────────────────────────────
 * Two variants:
 *
 *   - `regular` renders in the 4-column grid: emoji, short label,
 *     sub-hint, optional "NEW" tag.
 *
 *   - `special` spans the full grid width and renders with an inline
 *     description + pill tags. This variant powers Brand Lift and
 *     Creative Attention (purple-accent).
 *
 * Goals flagged `comingSoon` (audience_profiling, market_entry, and — Pass 49
 * — creative_attention while its zero-response pipeline is fixed) are filtered
 * OUT of the setup grid by GoalGrid so a user can't start one.
 *     The `creative_attention` goal opts the textarea into an image
 *     / video upload affordance in Commit 3.
 *
 * The `id` field is the stable key persisted to Supabase
 * `missions.mission_type`. The first 8 IDs are preserved verbatim
 * from the pre-redesign page so existing rows, AI prompts, and
 * placeholder lookups continue to match. The 6 new IDs are the
 * additions this prompt introduces.
 *
 * `placeholder` drives the textarea hint in MissionSetupPage; the
 * pre-redesign page kept these in a separate switch — colocating
 * them here means we only add new goals in one place.
 */

export type GoalVariant = 'regular' | 'special';

export interface MissionGoal {
  /** Stable key persisted to DB / passed to AI service. */
  id: string;
  /** Displayed label (prototype: `.g-lb` or `.bl-name` / `.att-name`). */
  label: string;
  /** Emoji glyph shown in the card (prototype: `.g-em`). */
  emoji: string;
  /** Short hint shown under the label in regular cards (prototype: `.g-ht`). */
  hint: string;
  /** Longer description shown in the special row variants. */
  description?: string;
  /** Pill tags shown on the special-row variants. */
  tags?: string[];
  /** Appends a "NEW" corner badge on regular cards or an inline pill on special rows. */
  isNew?: boolean;
  /**
   * Pass 34 B4 — methodology has no production-ready end-to-end pipeline
   * yet. Cards render with a SOON badge + disabled visual state and
   * surface a toast on click instead of selecting the goal. Source of
   * truth shared with /methodologies page so the two surfaces never
   * disagree (was a Pass 34 audit finding).
   */
  comingSoon?: boolean;
  /** Layout variant. */
  variant: GoalVariant;
  /** Textarea placeholder shown when this goal is selected. */
  placeholder: string;
}

const SHARED_FALLBACK_PLACEHOLDER =
  'Describe your idea, your target audience, and exactly what you want to learn. The AI will extract the details automatically.';

export const MISSION_GOALS: MissionGoal[] = [
  {
    id: 'validate',
    label: 'Validate Product',
    emoji: '🚀',
    hint: 'Concept & PMF',
    variant: 'regular',
    placeholder:
      'e.g., I want to validate a subscription service for premium coffee beans ($25/mo) targeting remote workers. I need to know if they care more about Fair Trade sourcing or Fast Delivery.',
  },
  {
    id: 'compare',
    label: 'Compare Concepts',
    emoji: '⚖️',
    hint: 'A/B testing',
    variant: 'regular',
    placeholder:
      'e.g., I have two logo designs for my fitness app and need to know which one appeals more to Gen Z users and why they prefer it.',
  },
  {
    id: 'marketing',
    label: 'Test Marketing/Ads',
    emoji: '📣',
    hint: 'Creative testing',
    variant: 'regular',
    placeholder:
      'e.g., I want to test a new Instagram ad campaign for sustainable sneakers targeting millennials. I need to understand which messaging resonates better: eco-friendly materials or stylish design.',
  },
  {
    id: 'satisfaction',
    label: 'Customer Satisfaction',
    emoji: '⭐',
    hint: 'CSAT & NPS',
    variant: 'regular',
    placeholder:
      'e.g., I want to measure how satisfied current users are with our mobile app onboarding experience and identify the biggest pain points in the first 3 screens.',
  },
  {
    id: 'pricing',
    label: 'Pricing Research',
    emoji: '💰',
    hint: 'WTP & sensitivity',
    variant: 'regular',
    placeholder:
      'e.g., I want to test pricing tiers for my SaaS platform ($29/$79/$149/mo) with small business owners. I need to know which features justify premium pricing and what price point feels too expensive.',
  },
  {
    id: 'roadmap',
    label: 'Feature Roadmap',
    emoji: '🗺️',
    hint: 'Prioritise building',
    variant: 'regular',
    placeholder:
      'e.g., I want to prioritize features for my fitness app (social sharing, meal plans, or workout videos) by understanding what my target users would pay extra for and what they consider essential.',
  },
  {
    id: 'research',
    label: 'General Research',
    emoji: '🧠',
    hint: 'Custom study',
    variant: 'regular',
    placeholder:
      "e.g., I want to understand remote workers' productivity habits, specifically what time of day they're most focused and what tools they use for deep work sessions.",
  },
  {
    id: 'competitor',
    label: 'Competitor Analysis',
    emoji: '🔍',
    hint: 'Benchmarking',
    variant: 'regular',
    placeholder:
      'e.g., I want to compare my project management tool to Asana and Monday.com. I need to understand what features users value most and where my competitors are falling short for small agencies.',
  },
  {
    id: 'audience_profiling',
    label: 'Audience Profiling',
    emoji: '🎯',
    hint: 'Who is my customer?',
    // Pass 34 B4 — defer in the setup grid to match /methodologies.
    comingSoon: true,
    variant: 'regular',
    placeholder:
      'e.g., I want to understand who actually buys my skincare brand — age, income, habits, the brands they compare us to, and which channels they discover new products on.',
  },
  {
    id: 'naming_messaging',
    label: 'Naming & Messaging',
    emoji: '✍️',
    hint: 'Names, taglines',
    isNew: true,
    variant: 'regular',
    placeholder:
      'e.g., I have three candidate names for a new productivity app — "Focusly", "Deepwork", "Flowstate". Which lands best with solo founders, and which tagline makes them want to try it?',
  },
  {
    id: 'market_entry',
    label: 'Market Entry',
    emoji: '🌍',
    hint: 'New market demand',
    // Pass 34 B4 — defer in the setup grid to match /methodologies.
    comingSoon: true,
    variant: 'regular',
    placeholder:
      "e.g., We're a German meal-kit brand considering expansion into the UAE. I need to know if there's real demand at €9/meal, which cuisines resonate, and what the biggest delivery concerns are.",
  },
  {
    id: 'churn_research',
    label: 'Churn Research',
    emoji: '🔄',
    hint: 'Why customers leave',
    isNew: true,
    variant: 'regular',
    placeholder:
      "e.g., Our SaaS churn jumped from 4% to 7% last quarter. I want to understand why lapsed users left, what almost made them stay, and which competitor they moved to.",
  },
  {
    id: 'brand_lift',
    label: 'Brand Lift Study',
    emoji: '📡',
    hint: 'Brand awareness & recall',
    description:
      'Measure awareness, recall, sentiment & purchase intent before and after campaigns',
    tags: ['Awareness', 'Ad Recall', 'Purchase Intent', 'NPS'],
    isNew: true,
    variant: 'special',
    placeholder:
      "e.g., We're launching a 4-week brand campaign across MENA in May. I want a pre-campaign baseline on awareness, recall, sentiment, and purchase intent so I can re-run it post-campaign and measure the lift.",
  },
  {
    id: 'creative_attention',
    label: 'Creative Attention Analysis',
    emoji: '🎬',
    hint: 'Emotion + attention mapping',
    description:
      'Upload a video or image — AI maps emotion, attention, and engagement frame by frame',
    tags: ['Emotions', 'Attention Heatmap', 'Engagement Score', 'Video + Image'],
    isNew: true,
    // Pass 49 Phase 5 — disabled in setup (SOON treatment): the pipeline
    // persists 0 responses for this methodology, so it produces no report.
    // Pass 50 (P0) must fix the zero-response pipeline before re-enabling.
    comingSoon: true,
    variant: 'special',
    placeholder:
      'e.g., Upload your 30s launch video or key image. I want to see where attention drops, which moments spark joy vs. confusion, and whether the brand reveal at the end lands or feels tacked on.',
  },
];

/** Lookup by id. Returns undefined if the id is unknown. */
export function getGoalById(id: string): MissionGoal | undefined {
  return MISSION_GOALS.find((g) => g.id === id);
}

/*
 * §2.5 — legacy/landing goal aliases → canonical backend goal_type.
 * The landing catalog historically used descriptive ids that don't match the
 * goal_types the backend dispatches generation/analysis on. Without mapping,
 * clicking those cards persisted an invalid goal_type and rendered a generic
 * setup (no type-specific inputs). Applied wherever a goal enters the setup.
 */
const GOAL_ALIASES: Record<string, string> = {
  pricing_research: 'pricing',
  customer_satisfaction: 'satisfaction',
  feature_roadmap: 'roadmap',
  competitor_analysis: 'competitor',
};

/** Normalize any goal alias to a valid canonical goal_type (fallback 'validate'). */
export function normalizeGoalType(goal: string | null | undefined): string {
  if (!goal) return 'validate';
  const canonical = GOAL_ALIASES[goal] || goal;
  return getGoalById(canonical) ? canonical : 'validate';
}

/*
 * §2.4 — recommended minimum sample per method, surfaced at setup so users
 * pick a defensible n (advisory only — we don't force-raise the default, which
 * would change price). Mirrors statGate.js thresholds: segmentation needs 50;
 * everything else 30 for a confident point read.
 */
const RECOMMENDED_N: Record<string, number> = {
  audience_profiling: 50,
};
export function getRecommendedN(goal: string | null | undefined): number {
  return RECOMMENDED_N[normalizeGoalType(goal)] || 30;
}

/** Get the placeholder for a goal id, or a sensible fallback. */
export function getPlaceholderForGoal(id: string): string {
  return getGoalById(id)?.placeholder ?? SHARED_FALLBACK_PLACEHOLDER;
}

/**
 * Goals that opt into a media-upload affordance on the describe step.
 *
 * - `creative_attention` — the upload is the point: AI maps emotion /
 *   attention frame-by-frame over the uploaded video or image.
 * - `brand_lift` — optional campaign reference asset (storyboard,
 *   hero image, draft video) so the AI can anchor pre/post questions
 *   against the specific creative the user is measuring lift on.
 * - `marketing` — optional creative to test (image / video ad) so
 *   question generation can refer to it specifically.
 *
 * Upload remains a render-only stub (see .design-reference/
 * PROMPT_3_STUBS.md) for all three; the file is held in state but
 * never sent to the backend yet.
 */
export const GOALS_WITH_UPLOAD = new Set([
  'creative_attention',
  'brand_lift',
  'marketing',
]);
