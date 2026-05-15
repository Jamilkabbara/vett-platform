/**
 * Pass 42 C1 — chart palette extracted from src/pages/ResultsPage.tsx
 * line 266. Same six-color rotation the legacy fallback has used since
 * Pass 18; keeping the palette identical means missions that
 * round-trip between renderers (new component view ↔ legacy
 * fallback view) look visually consistent.
 */
export const COLORS = [
  '#8B5CF6', // violet
  '#10B981', // emerald
  '#F43F5E', // rose
  '#F59E0B', // amber
  '#3B82F6', // blue
  '#6366F1', // indigo
] as const;

/**
 * Sentiment-specific palette for SentimentBreakdown donut.
 * Maps to the brand tokens: lime, neutral gray, amber.
 */
export const SENTIMENT_COLORS = {
  positive: '#A3E635', // lime-400 (brand lime)
  neutral:  '#9CA3AF', // gray-400
  negative: '#F59E0B', // amber-500
} as const;
