/**
 * Pass 24 Bug 24.01 — Creative Attention v2 schema.
 *
 * The `creative_analysis` JSONB column on `missions` rows is the
 * AI-pipeline output for Creative Attention missions. v1 (shipped
 * through Pass 23) carried frame analyses + a summary. v2 adds:
 *
 *   - 24 emotion taxonomy (Plutchik 8 + 16 nuanced DAIVID-style)
 *   - Attention prediction block (active vs passive split, DBA
 *     score, decay curve)
 *   - Cross-channel benchmarks (TV / Social / OOH / CTV /
 *     Programmatic with norm vs predicted comparison)
 *   - Creative Effectiveness Score (composite 0-100 with weighted
 *     components + band)
 *   - Platform Fit upgrade (per-platform norm + predicted + delta)
 *
 * All v2 fields are OPTIONAL on the type so older missions parse
 * cleanly. Frontend renders v2 sections only when the corresponding
 * field is present (gracefully hides for legacy rows).
 *
 * The backend `creativeAttention.js` writes to this exact shape;
 * the type is the source-of-truth contract.
 */

// ── V1 building blocks (preserved exactly so legacy rows still parse) ──────────

export interface FrameAnalysis {
  timestamp: number;
  /** v2 expansion: up to 24 keys (Plutchik 8 + 16 nuanced). v1 had 8. */
  emotions: Record<string, number>;
  attention_hotspots: string[];
  message_clarity: number;
  audience_resonance: number;
  engagement_score: number;
  brief_description: string;
}

export interface EmotionPeak {
  emotion: string;
  peak_timestamp: number;
  peak_value: number;
  interpretation: string;
}

/**
 * Best Platform Fit — v1 was `string[]`, Bug 23.73 introduced
 * `{platform, rationale}[]`. Bug 24.01 adds optional norm + predicted
 * + delta + fit_score per platform. Frontend handles all three shapes
 * via narrowing helpers.
 */
export type PlatformFitItem =
  | string
  | {
      platform: string;
      rationale: string;
      /** Bug 24.01 v2 additions — all optional. */
      platform_norm_active_attention_seconds?: number;
      predicted_creative_attention_seconds?: number;
      delta_vs_norm_pct?: number;
      fit_score?: number;
    };

export interface CreativeSummary {
  overall_engagement_score: number;
  emotion_peaks: EmotionPeak[];
  attention_arc: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  vs_benchmark: string;
  best_platform_fit: PlatformFitItem[];
}

// ── V2 additions ──────────────────────────────────────────────────────────────

/**
 * Single point on the attention decay curve.
 *  - For static images: array has one entry at second=0.
 *  - For video: bucketed every 1s up to mission duration (cap 30 entries
 *    so a 30s spot or longer still renders cleanly).
 */
export interface AttentionDecayPoint {
  second: number;
  active_pct: number;
}

export interface AttentionPrediction {
  /** Predicted active-attention dwell time. */
  predicted_active_attention_seconds: number;
  /** Predicted passive-attention dwell time. */
  predicted_passive_attention_seconds: number;
  /**
   * Population split, 0-100. The three percentages sum to 100.
   *   active_pct: viewers who actively attend (eyes-on, focused)
   *   passive_pct: viewers aware of the ad but not actively viewing
   *   non_attention_pct: viewers who scroll past or ignore
   */
  active_attention_pct: number;
  passive_attention_pct: number;
  non_attention_pct: number;
  /** "1.5 second rule" — distinctive brand asset score, 0-100. */
  distinctive_brand_asset_score: number;
  /** How fast (in seconds) the brand becomes identifiable. */
  dba_read_seconds: number;
  /** Time-bucketed active-attention curve. */
  attention_decay_curve: AttentionDecayPoint[];
}

export interface ChannelBenchmark {
  /** Channel label, e.g. "TV (30s spot)" / "Social Feed (paid)" / "OOH (billboard)". */
  channel: string;
  /** Industry-typical active-attention seconds for the channel/format. */
  category_avg_attention_seconds: number;
  /**
   * Predicted seconds for THIS creative on this channel.
   * `null` when the creative shape doesn't fit the channel
   * (e.g. static image vs TV — TV requires motion).
   */
  predicted_for_this_creative: number | null;
  /** 1-2 sentence assessment + recommendation. */
  fit_assessment: string;
}

export type EffectivenessBand = 'elite' | 'strong' | 'average' | 'weak' | 'poor';

export interface EffectivenessComponents {
  attention: number;
  emotion_intensity: number;
  brand_clarity: number;
  audience_resonance: number;
  platform_fit: number;
}

export interface EffectivenessScore {
  /** Composite 0-100 score. */
  score: number;
  /** Per-component sub-scores (0-100 each). */
  components: EffectivenessComponents;
  /** Component weights used in the composite (sum to 1.0). */
  weights: EffectivenessComponents;
  band: EffectivenessBand;
  band_explanation: string;
}

// ── Top-level shape ───────────────────────────────────────────────────────────

export interface CreativeAnalysisV1 {
  frame_analyses: FrameAnalysis[];
  summary: CreativeSummary;
  total_frames: number;
  is_video: boolean;
  generated_at: string;
}

export interface CreativeAnalysisV2 extends CreativeAnalysisV1 {
  /** Set on rows generated by the v2 pipeline. Older rows omit. */
  schema_version?: 'v2';
  attention?: AttentionPrediction;
  channel_benchmarks?: ChannelBenchmark[];
  creative_effectiveness?: EffectivenessScore;
}

/**
 * Use this as the runtime type — components narrow by `schema_version`
 * or by checking for individual v2 fields. Old rows just don't carry them.
 */
export type CreativeAnalysis = CreativeAnalysisV2;

// ── Constants the frontend needs to render ────────────────────────────────────

/**
 * Plutchik 8 + DAIVID-style 16 nuanced. The backend prompt instructs
 * the model to score every emotion 0-100; missing keys default to 0
 * for rendering.
 */
export const EMOTION_TAXONOMY_V2 = [
  // Plutchik 8 (preserved from v1)
  'joy',
  'trust',
  'fear',
  'surprise',
  'sadness',
  'disgust',
  'anger',
  'anticipation',
  // DAIVID-style nuanced 16
  'amusement',
  'awe',
  'contentment',
  'pride',
  'curiosity',
  'nostalgia',
  'romance',
  'hope',
  'calm',
  'confusion',
  'boredom',
  'disappointment',
  'contempt',
  'embarrassment',
  'guilt',
  'irritation',
] as const;

export type EmotionV2 = (typeof EMOTION_TAXONOMY_V2)[number];

/**
 * Color tokens per emotion. Lime for positive, indigo for neutral,
 * amber for ambivalent, red for negative. Used by the radar chart
 * + per-emotion bar chart.
 */
export const EMOTION_COLORS_V2: Record<EmotionV2, string> = {
  // Positive
  joy: '#BEF264',
  trust: '#60A5FA',
  amusement: '#A3E635',
  awe: '#7DD3FC',
  contentment: '#84CC16',
  pride: '#FBBF24',
  curiosity: '#A78BFA',
  hope: '#34D399',
  calm: '#67E8F9',
  romance: '#F472B6',
  // Neutral / mixed
  surprise: '#F59E0B',
  anticipation: '#A78BFA',
  nostalgia: '#C084FC',
  // Negative
  fear: '#F87171',
  sadness: '#6B7280',
  disgust: '#10B981',
  anger: '#EF4444',
  confusion: '#94A3B8',
  boredom: '#71717A',
  disappointment: '#9CA3AF',
  contempt: '#525252',
  embarrassment: '#FB7185',
  guilt: '#A1A1AA',
  irritation: '#F97316',
};

export const EMOTION_VALENCE: Record<EmotionV2, 'positive' | 'neutral' | 'negative'> = {
  joy: 'positive',
  trust: 'positive',
  amusement: 'positive',
  awe: 'positive',
  contentment: 'positive',
  pride: 'positive',
  curiosity: 'positive',
  hope: 'positive',
  calm: 'positive',
  romance: 'positive',
  surprise: 'neutral',
  anticipation: 'neutral',
  nostalgia: 'neutral',
  fear: 'negative',
  sadness: 'negative',
  disgust: 'negative',
  anger: 'negative',
  confusion: 'negative',
  boredom: 'negative',
  disappointment: 'negative',
  contempt: 'negative',
  embarrassment: 'negative',
  guilt: 'negative',
  irritation: 'negative',
};

/**
 * Channel norms baked in for the backend prompt + frontend tooltip
 * fallback. Single source of truth.
 */
export const CHANNEL_NORMS = [
  { channel: 'TV (30s spot)',           category_avg_attention_seconds: 12.0 },
  { channel: 'Social Feed (paid)',      category_avg_attention_seconds: 1.2 },
  { channel: 'OOH (digital billboard)', category_avg_attention_seconds: 0.8 },
  { channel: 'CTV (15s)',               category_avg_attention_seconds: 4.5 },
  { channel: 'Programmatic Display',    category_avg_attention_seconds: 0.4 },
] as const;

/**
 * Composite score weights — also baked into the backend post-processing
 * so the score is deterministic regardless of model variance.
 */
export const EFFECTIVENESS_WEIGHTS: EffectivenessComponents = {
  attention: 0.25,
  emotion_intensity: 0.25,
  brand_clarity: 0.20,
  audience_resonance: 0.15,
  platform_fit: 0.15,
};

export function bandForScore(score: number): EffectivenessBand {
  if (score >= 85) return 'elite';
  if (score >= 70) return 'strong';
  if (score >= 50) return 'average';
  if (score >= 30) return 'weak';
  return 'poor';
}

// ── Type-narrowing helpers ────────────────────────────────────────────────────

/** Narrows a PlatformFitItem to its object shape (Bug 23.73 / 24.01). */
export function asPlatformFitObject(p: PlatformFitItem): {
  platform: string;
  rationale: string;
  platform_norm_active_attention_seconds?: number;
  predicted_creative_attention_seconds?: number;
  delta_vs_norm_pct?: number;
  fit_score?: number;
} | null {
  if (typeof p === 'string' || !p) return null;
  return p;
}

export function platformLabel(p: PlatformFitItem): string {
  if (typeof p === 'string') return p;
  return p?.platform ?? '';
}

export function platformRationale(p: PlatformFitItem): string {
  if (typeof p === 'string') return '';
  return p?.rationale ?? '';
}
