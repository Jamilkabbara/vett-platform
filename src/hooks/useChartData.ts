import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';

/**
 * Pass 42 B3 — useChartData hook.
 *
 * Fetches chart_data for a mission. Backend (Pass 42 B2) returns the
 * synthesis-emitted chart_data if present, else computes from
 * mission_responses on the fly and caches. Either way the client
 * just calls and renders.
 *
 * No external query lib (project doesn't have @tanstack/react-query
 * installed) — using a small useEffect+useState hook with in-memory
 * cache. The endpoint already caches server-side, so request volume
 * stays low.
 *
 * Shape (see B1/B2):
 *   {
 *     per_question_distributions: Array<{
 *       question_id, question, type: 'single_choice' | 'multi_select' | 'rating' | 'text',
 *       options?, counts?, percentages?, scale_max?, buckets?, mean?, median?
 *     }>,
 *     sentiment_breakdown?: { positive, neutral, negative },
 *     segment_distributions?: Array<{ segment_name, n, key_metric_values }>,
 *     methodology_specific?: { brand_lift?, pricing?, naming?, roadmap? },
 *     _source?: 'cached' | 'computed' | 'empty'
 *   }
 */
export interface QuestionDistribution {
  question_id: string;
  question: string;
  type: 'multi_select' | 'single_choice' | 'rating' | 'text';
  options?: string[];
  counts?: number[];
  percentages?: number[];
  scale_min?: number;
  scale_max?: number;
  buckets?: Record<string, number>;
  mean?: number;
  median?: number;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SegmentDistribution {
  segment_name: string;
  n: number;
  key_metric_values: Record<string, number>;
}

export interface ChartData {
  per_question_distributions?: QuestionDistribution[];
  sentiment_breakdown?: SentimentBreakdown;
  segment_distributions?: SegmentDistribution[];
  methodology_specific?: Record<string, unknown>;
  _source?: 'cached' | 'computed' | 'empty';
}

const cache = new Map<string, ChartData>();

export function useChartData(missionId: string | undefined) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) {
      setData(null);
      return;
    }
    const cached = cache.get(missionId);
    if (cached) {
      setData(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const r = await api.get(`/api/missions/${missionId}/chart_data`);
        const cd = r as ChartData;
        if (cancelled) return;
        cache.set(missionId, cd);
        setData(cd);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'chart_data fetch failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [missionId]);

  return { data, loading, error };
}
