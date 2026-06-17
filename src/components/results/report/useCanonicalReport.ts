import { useEffect, useState } from 'react';
import { api } from '../../../lib/apiClient';

/**
 * Pass 48 — fetch the canonical report (GET /api/results/:id/report).
 * One source of truth the web page + chat both consume, so they can't
 * disagree with each other or with the exports.
 */
export interface CanonicalSurveyQuestion {
  number: number;
  id: string;
  text: string;
  type: string | null;
  renderer: string;
  renderer_label: string;
  options: string[];
  isScreening: boolean;
  insight?: string | null;
  data: Record<string, unknown>;
}
/** §2.4 — statistical-integrity verdict attached to the centerpiece. */
export interface StatGate {
  posture: 'authoritative' | 'directional';
  note: string | null;
  suppress_headline: boolean;
  threshold: number;
  n: number;
  reason: string | null;
}

export interface CanonicalReport {
  schema_version: number;
  header: {
    title: string;
    brief: string;
    methodology: string | null;
    methodology_label: string;
    sample: {
      n: number | null; qualified: number | null; delivered: number | null;
      posture: string; completed_at: string | null; mission_id: string;
    };
  };
  headline: { metric: string; value: string; all: Array<{ label: string; value: string }> } | null;
  centerpiece: {
    methodology: string;
    data: Record<string, unknown>;
    // §2.4 — statistical-integrity gate (set by buildReport.js/statGate.js).
    gate?: StatGate;
  } | null;
  key_findings: Array<Record<string, unknown>>;
  recommendations?: string[];
  exec_summary: string | null;
  // §3 — premium content beats (one canonical source for web + exports).
  finding?: string | null;
  synthesis?: string | null;
  screening?: { question_id: string; question: string; qualified: number | null; distribution: Record<string, number> } | null;
  personas?: Array<{ name: string; role?: string; description?: string; share?: string | number }>;
  survey: CanonicalSurveyQuestion[];
  data_quality_notes: Array<{ question_number: number; question_id: string; note: string }>;
  methodology_disclaimer: string;
  // Pass 49 Phase 4 — response/segment filter (set by GET /report).
  segments?: SegmentOption[];
  active_segment?: { key: string; label: string; n: number } | null;
}

export interface CanonicalTheme {
  label: string;
  count: number;
  pct: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  quotes: string[];
}

export interface SegmentOption {
  key: string;
  label: string;
  group: string;
  n: number;
}

export function useCanonicalReport(missionId: string | undefined) {
  const [report, setReport] = useState<CanonicalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(`/api/results/${missionId}/report`);
        if (!cancelled) { setReport(res.report || null); setError(null); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load report');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [missionId]);

  return { report, loading, error };
}
