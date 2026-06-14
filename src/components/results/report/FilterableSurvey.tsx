import { useEffect, useState } from 'react';
import { api } from '../../../lib/apiClient';
import type { CanonicalReport, SegmentOption } from './useCanonicalReport';
import { FullSurveySection } from './FullSurveySection';

/**
 * Pass 49 Phase 4 — response/segment filter around the full-survey section.
 *
 * Scoped to the survey DISTRIBUTIONS (the spec's "visible distributions"): the
 * whole-sample centerpiece/headline/exec above stay correct and untouched. When
 * a segment is chosen, the page re-fetches GET /report?segment= — the backend
 * rebuilds the canonical report over the matching respondents (one builder, no
 * fork) — and renders the recomputed distributions with an honest n label.
 * Segments are response-based only (NPS band, campaign cell, answered-X); thin
 * synthetic demographics are deliberately NOT offered.
 */
export function FilterableSurvey({ missionId, report }: { missionId: string | undefined; report: CanonicalReport }) {
  const segments: SegmentOption[] = report.segments || [];
  const [segKey, setSegKey] = useState<string | null>(null);
  const [segReport, setSegReport] = useState<CanonicalReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!missionId || !segKey) { setSegReport(null); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(`/api/results/${missionId}/report?segment=${encodeURIComponent(segKey)}`);
        if (!cancelled) setSegReport(res.report || null);
      } catch {
        if (!cancelled) setSegReport(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [missionId, segKey]);

  if (!report.survey || report.survey.length === 0) return null;

  const showingSegment = !!(segKey && segReport);
  const active = showingSegment ? segments.find((s) => s.key === segKey) || report.active_segment : null;
  const survey = showingSegment && segReport ? segReport.survey : report.survey;

  const groups: Record<string, SegmentOption[]> = {};
  for (const s of segments) (groups[s.group] ||= []).push(s);

  return (
    <>
      {segments.length > 0 && (
        <div className="px-6 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3 flex-wrap rounded-xl border border-b2 bg-bg2/40 px-4 py-3">
            <span className="font-display font-bold text-t2 text-[12px]">Filter responses</span>
            <select
              aria-label="Filter survey responses by segment"
              value={segKey || ''}
              onChange={(e) => setSegKey(e.target.value || null)}
              className="bg-bg3 border border-b2 rounded-lg text-t1 text-[12px] px-2.5 py-1.5 font-body focus:outline-none focus:border-lime max-w-[18rem]"
            >
              <option value="">All respondents (n={report.header.sample.n ?? '—'})</option>
              {Object.entries(groups).map(([g, opts]) => (
                <optgroup key={g} label={g}>
                  {opts.map((o) => (
                    <option key={o.key} value={o.key}>{o.label} · n={o.n}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {loading && <span className="font-body text-[11px] text-t3">updating…</span>}
            {active && !loading && (
              <>
                <span className="font-body text-[12px] text-t3">
                  Showing <span className="text-lime font-semibold">{active.label}</span> · n={active.n}
                  {active.n < 30 && <span> · directional</span>}
                </span>
                <button
                  type="button"
                  onClick={() => setSegKey(null)}
                  className="font-body text-[11px] text-t3 hover:text-t1 underline underline-offset-2"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {active && (
        <div className="px-6 max-w-6xl mx-auto w-full">
          <div className="mt-3 rounded-lg bg-lime/10 border border-lime/25 px-3 py-2">
            <p className="font-body text-[12px] text-t2">
              Survey distributions below are recomputed for{' '}
              <span className="font-semibold text-t1">{active.label}</span> only (n={active.n}
              {active.n < 30 ? ' — directional, treat as signal not verdict' : ''}). Clear the filter to see all respondents.
            </p>
          </div>
        </div>
      )}

      <FullSurveySection survey={survey} />
    </>
  );
}

export default FilterableSurvey;
