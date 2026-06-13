import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';
// Pass 41 BUG1 — when a brand_lift mission has status='completed' but
// no aggregated `brand_lift_results` column (e.g. synthesis ran the
// standard insights pipeline rather than the brand-lift-specific
// aggregator from Pass 27/28), we fall back to the standard insights
// view. ResearchResultsPage handles the universal {kpis,
// executive_summary, per_question_insights, recommendations,
// follow_ups, contradictions, segment_breakdowns} shape correctly
// after Pass 40 CRASH40-2.
import { ResearchResultsPage } from './ResearchResultsPage';
// Pass 42 C4 — universal chart sections wrapper for the rich-path
// (mission with brand_lift_results JSONB populated). The fallback
// path delegates to ResearchResultsPage which already mounts these.
import { UniversalCharts } from '../components/results/UniversalCharts';
// Pass 42 D1 — methodology-specific BrandLift charts (pre/post + lift delta).
import { BrandLiftCharts } from '../components/results/charts/BrandLiftCharts';
// Pass 46 Phase 1 — universal action bar (back nav + methodology label + export/share).
import { ResultsActionBar } from '../components/results/ResultsActionBar';
// Pass 46 Phase 4 — research-grade lift report centerpiece (headline + funnel),
// reading the deterministic brand_lift block from mission.analysis.
import { BrandLiftCenterpiece } from '../components/results/centerpieces/BrandLiftCenterpiece';
// Pass 48 Phase 2 — canonical report (one source of truth for web + chat + exports).
import { useCanonicalReport } from '../components/results/report/useCanonicalReport';
import { ReportHeader } from '../components/results/report/ReportHeader';
import { FullSurveySection } from '../components/results/report/FullSurveySection';
import {
  BrandLiftScoreDial,
  FunnelVisualization,
  ChannelPerformanceTable,
  ChannelFilterDropdown,
  GeographicBreakdown,
  CreativeDiagnostic,
  CompetitorComparison,
  AIRecommendationCard,
  WaveComparison,
} from '../components/brand-lift/results';
import {
  MarketFilterDropdown,
  ChannelCategoryFilterDropdown,
  GenderFilterDropdown,
  AgeFilterDropdown,
  IncrementalityFilterDropdown,
  WaveFilterDropdown,
} from '../components/brand-lift/filters/FilterDropdowns';
import type { ExposureMode } from '../components/brand-lift/filters/FilterDropdowns';

// Pass 27 F20 — multi-dim filter state lifted to the page.
interface BrandLiftFilters {
  markets: string[];
  channels: string[];
  channelCategories: string[];
  genders: string | null;
  ageGroups: string[];
  exposureMode: ExposureMode;
  wave: string | null;
}

const DEFAULT_FILTERS: BrandLiftFilters = {
  markets: [], channels: [], channelCategories: [],
  genders: null, ageGroups: [], exposureMode: 'all', wave: null,
};

const AGE_BUCKETS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const CHANNEL_CATEGORIES = [
  { value: 'tv', label: 'TV (Linear)' },
  { value: 'ctv', label: 'CTV / Streaming' },
  { value: 'cinema', label: 'Cinema' },
  { value: 'digital_video', label: 'Digital Video' },
  { value: 'social', label: 'Social Ads' },
  { value: 'display', label: 'Display' },
  { value: 'audio', label: 'Digital Audio' },
  { value: 'radio', label: 'Radio' },
  { value: 'ooh', label: 'OOH' },
  { value: 'dooh', label: 'DOOH' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'press', label: 'Press' },
  { value: 'retail_media', label: 'Retail Media' },
  { value: 'in_game', label: 'In-Game' },
];

/**
 * Pass 25 Phase 1E — Brand Lift Study v2 results page.
 *
 * Wired into ResultsRouter for goal_type === 'brand_lift'. Renders the
 * 10 Phase 1E components on a single dashboard. Channel filter is lifted
 * here so all sub-sections re-render when the user filters.
 *
 * Data shape (read directly from the missions row + downstream
 * aggregator) is documented inline. Heavy aggregation lives on the
 * server; this page treats the mission record as the source of truth
 * for shape and reads `mission.brand_lift_results` (jsonb) for the
 * pre-aggregated score / funnel / channel / geo / competitor / waves /
 * recommendations payload. Older brand_lift missions without that
 * payload fall through to a friendly "results pending" state.
 */
const API_URL = import.meta.env.VITE_API_URL || 'https://vettit-backend-production.up.railway.app';

interface FunnelStageWithLift {
  id: string;
  label: string;
  value: number;
  benchmark?: number;
  control?: number;
  delta_pp?: number;
}

interface BrandLiftResultsShape {
  score?: number;
  band_explanation?: string;
  funnel?: FunnelStageWithLift[];
  pre_funnel?: FunnelStageWithLift[];
  channels?: Array<{ id: string; display_name: string; category: string; ad_recall: number; brand_lift: number; insight?: string }>;
  geography?: Array<{ region: string; brand_lift: number; n: number }>;
  competitors?: Array<{ brand: string; awareness: number; consideration: number; intent: number; isFocal?: boolean }>;
  waves?: Array<{ label: string; values: Array<{ kpi: string; value: number }> }>;
  wave_synthesis?: string;
  recommendations?: Array<{ title: string; body: string; confidence: 'high' | 'medium' | 'low'; explanation?: string }>;
  lift_mode?: boolean;
}

interface FilterAPIResult {
  filtered_respondent_count: number;
  total_respondent_count: number;
  lift_mode: boolean;
  filters_applied: BrandLiftFilters & { applied?: boolean };
  brand_lift_results: BrandLiftResultsShape | null;
}

// Pass 46 Phase 1 — typed mission fields this page consumes (status gate,
// action bar props). The select('*') row keeps every other column typed
// as unknown via the index signature, same as the old Record type.
interface BrandLiftMissionRow extends Record<string, unknown> {
  status?: string;
  title?: string | null;
  goal_type?: string | null;
  completed_at?: string | null;
  qualified_respondent_count?: number | null;
}

// Pass 28 C — URL <-> filter state serialization. Keeps shareable links
// carrying filter context and survives a full page reload.
function filtersToParams(f: BrandLiftFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.markets.length) p.set('markets', f.markets.join(','));
  if (f.channels.length) p.set('channels', f.channels.join(','));
  if (f.channelCategories.length) p.set('categories', f.channelCategories.join(','));
  if (f.genders) p.set('genders', f.genders);
  if (f.ageGroups.length) p.set('ages', f.ageGroups.join(','));
  if (f.exposureMode !== 'all') p.set('exposure', f.exposureMode);
  if (f.wave !== null) p.set('wave', String(f.wave));
  return p;
}

function paramsToFilters(p: URLSearchParams): BrandLiftFilters {
  const split = (k: string) => (p.get(k) || '').split(',').filter(Boolean);
  const exposure = (p.get('exposure') || 'all') as ExposureMode;
  const validExp: ExposureMode[] = ['all', 'exposed', 'control', 'lift'];
  return {
    markets: split('markets'),
    channels: split('channels'),
    channelCategories: split('categories'),
    genders: p.get('genders') || null,
    ageGroups: split('ages'),
    exposureMode: validExp.includes(exposure) ? exposure : 'all',
    wave: p.get('wave'),
  };
}

// Pass 47 — minimal shape of the computed brand_lift analysis block we
// gate the bespoke render on (full shape consumed by BrandLiftCenterpiece).
type BlAnalysisShape = {
  cells?: { exposed?: { n?: number }; control?: { n?: number } };
  funnel?: unknown[];
};

export function BrandLiftResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<BrandLiftMissionRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  // Pass 28 C — initial filter state hydrated from URL query params so
  // shareable links and reloads carry filter context.
  const [filters, setFilters] = useState<BrandLiftFilters>(() => {
    if (typeof window === 'undefined') return DEFAULT_FILTERS;
    return paramsToFilters(new URLSearchParams(window.location.search));
  });
  // Pass 27.5 D — filter result metadata fetched from /api/results/:id.
  // Surfaces filtered_respondent_count + total_respondent_count + lift_mode
  // so the filter row badge reflects what the backend actually computed.
  const [filterResult, setFilterResult] = useState<FilterAPIResult | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  // Pass 48 Phase 2 — canonical report (header + full-survey appendix).
  const { report } = useCanonicalReport(missionId);
  const filtersActive = filters.markets.length > 0 || filters.channels.length > 0
    || filters.channelCategories.length > 0 || filters.genders !== null
    || filters.ageGroups.length > 0 || filters.exposureMode !== 'all'
    || filters.wave !== null;

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('*')
        .eq('id', missionId)
        .single();
      if (fetchErr || !data) {
        setError('Mission not found');
      } else {
        setMission(data);
      }
      setLoading(false);
    })();
  }, [missionId]);

  // Pass 28 C — refetch /api/results/:id on filter change (200ms debounce).
  // Backend now returns brand_lift_results recomputed for the filtered
  // slice (Pass 28 C aggregator), so the score dial / funnel / channel
  // table all re-render with the slice. URL query params stay in sync
  // for shareable links.
  useEffect(() => {
    if (!missionId) return;
    if (typeof window !== 'undefined') {
      const next = filtersToParams(filters).toString();
      const url = `${window.location.pathname}${next ? `?${next}` : ''}`;
      window.history.replaceState({}, '', url);
    }
    if (!filtersActive) {
      setFilterResult(null);
      return;
    }
    let cancelled = false;
    setFilterLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        const params = filtersToParams(filters);
        const res = await fetch(`${API_URL}/api/results/${missionId}?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (cancelled) return;
        setFilterResult({
          filtered_respondent_count: body.filtered_respondent_count ?? 0,
          total_respondent_count: body.total_respondent_count ?? 0,
          lift_mode: body.lift_mode ?? false,
          filters_applied: body.filters_applied ?? filters,
          brand_lift_results: body.brand_lift_results ?? null,
        });
      } catch (_e) {
        if (!cancelled) setFilterResult(null);
      } finally {
        if (!cancelled) setFilterLoading(false);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, JSON.stringify(filters), filtersActive]);

  const baseBlr = useMemo<BrandLiftResultsShape | null>(() => {
    return (mission?.brand_lift_results || null) as BrandLiftResultsShape | null;
  }, [mission]);

  // Pass 28 C — when filters are active and the API returned a recomputed
  // brand_lift_results slice, use that. Otherwise fall back to the
  // canonical pre-aggregated mission.brand_lift_results.
  const blr = useMemo<BrandLiftResultsShape | null>(() => {
    if (filtersActive && filterResult?.brand_lift_results) {
      return filterResult.brand_lift_results;
    }
    return baseBlr;
  }, [baseBlr, filterResult, filtersActive]);

  const liftMode = !!(filtersActive && filterResult?.lift_mode);
  const filterEmpty = !!(filtersActive && filterResult && filterResult.filtered_respondent_count === 0);
  const refetching = filtersActive && filterLoading;

  const filteredChannels = useMemo(() => {
    const all = blr?.channels || [];
    if (!channelFilter) return all;
    return all.filter(c => c.id === channelFilter);
  }, [blr, channelFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--lime)] animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-bold text-[var(--t1)]">{error}</h2>
      </div>
    );
  }
  // Pass 41 BUG1 — fallback when the rich `brand_lift_results` JSONB is
  // absent but the standard `insights` JSONB and `status='completed'`
  // are present. Live audit caught af36a36d-401d-48e6-b94b-257e215613e2
  // in this state: status=completed, insights populated, brand_lift_results
  // NULL → page stuck on "still generating" indefinitely.
  //
  // The brand-lift-specific aggregator (Pass 27/28) doesn't always
  // populate `brand_lift_results` — newer missions go through the
  // standard insights pipeline. The universal renderer in
  // ResearchResultsPage handles the standard {kpis, executive_summary,
  // per_question_insights, recommendations, follow_ups,
  // contradictions, segment_breakdowns} shape since Pass 40 CRASH40-2.
  //
  // This delegation does cost a second mission fetch (ResearchResultsPage
  // re-reads via useParams), but that's a single Supabase call (~50ms)
  // and avoids duplicating the renderer.
  // Pass 47 — render the bespoke brand-lift report from the COMPUTED
  // analysis object (deterministic exposed-vs-control funnel) whenever
  // it's present, regardless of the legacy `brand_lift_results` column.
  // Before this, the page always fell through to ResearchResultsPage
  // because brand_lift_results is a dead/never-populated column — so the
  // Phase-4 BrandLiftCenterpiece never mounted and the page showed the
  // generic research view (with the narrator's "contact support"
  // summary). Gate on analysis.cells + funnel, not the dead column.
  const blAnalysis = (mission as unknown as { analysis?: BlAnalysisShape })?.analysis;
  const hasComputedLift = !!(
    blAnalysis &&
    typeof blAnalysis === 'object' &&
    blAnalysis.cells &&
    Array.isArray(blAnalysis.funnel) &&
    blAnalysis.funnel.length > 0
  );
  if (!blr && hasComputedLift) {
    const execSummary = (mission as unknown as { insights?: { executive_summary?: string } })
      ?.insights?.executive_summary;
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
        <ResultsActionBar
          missionId={missionId}
          title={mission?.title}
          goalType="brand_lift"
          completedAt={mission?.completed_at}
          qualified={mission?.qualified_respondent_count}
        />
        {/* Pass 48 Phase 2 — canonical report header (brief + sample summary). */}
        {report && <ReportHeader report={report} />}
        <header className="px-6 pt-6 pb-2 flex items-center justify-between">
          <Logo />
          <span className="text-[11px] uppercase tracking-widest text-[var(--t3)]">
            Brand Lift Study · Exposed vs Control
          </span>
        </header>
        <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
          {/* The methodology centerpiece: exposed-vs-control funnel + lift table. */}
          <BrandLiftCenterpiece analysis={blAnalysis} mission={mission} />

          {execSummary && (
            <section className="rounded-2xl border border-[var(--b1)] bg-[var(--bg2)] p-5">
              <h2 className="font-display font-bold text-[var(--t1)] text-[15px] mb-2">Executive summary</h2>
              <p className="font-body text-[13px] text-[var(--t2)] whitespace-pre-line leading-relaxed">{execSummary}</p>
            </section>
          )}

          {/* Pass 48 Phase 2 — "The full survey" appendix (every Q with its correct widget). */}
          {report && <FullSurveySection survey={report.survey} />}

          {/* Supporting detail — universal distribution / sentiment charts. */}
          <h2 className="font-display font-bold text-[var(--t1)] text-[15px] mt-8">Supporting Detail</h2>
          <UniversalCharts missionId={missionId} />
        </div>
        <ResultsActionBar
          variant="footer"
          missionId={missionId}
          title={mission?.title}
          goalType="brand_lift"
          completedAt={mission?.completed_at}
          qualified={mission?.qualified_respondent_count}
        />
      </div>
    );
  }

  if (!blr) {
    const status = mission?.status as string | undefined;
    const insights = mission?.insights;
    const insightsPresent =
      insights != null &&
      typeof insights === 'object' &&
      Object.keys(insights as Record<string, unknown>).length > 0;
    if (status === 'completed' && insightsPresent) {
      // Pass 46 Phase 1 — honest labeling: brand_lift missions keep their
      // methodology identity even on the generic fallback (audit P0-4).
      // Bespoke lift report lands in Phase 4.
      //
      // The bar is NOT mounted out here: ResearchResultsPage renders
      // inside OverlayPage (fixed inset-0 z-50 backdrop), which would
      // cover any sibling mounted above it. Instead the delegate mounts
      // ResultsActionBar itself (barAlreadyMounted defaults to false)
      // from the SAME mission row, whose goal_type='brand_lift' makes
      // methodologyLabel() read "Brand Lift Study" — never "General
      // Research".
      return <ResearchResultsPage />;
    }
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Pass 46 Phase 1 — bar mounts in the still-generating state too,
            so back-nav + raw export never disappear. */}
        <ResultsActionBar
          missionId={missionId}
          title={mission?.title}
          goalType="brand_lift"
          completedAt={mission?.completed_at}
          qualified={mission?.qualified_respondent_count}
        />
        <div className="flex flex-col items-center justify-center gap-3 px-5 text-center min-h-[80vh]">
          <Logo />
          <p className="text-sm text-[var(--t2)] mt-4">Brand Lift report still generating.</p>
          <p className="text-xs text-[var(--t3)] max-w-md">
            This page updates automatically when the synthesis pipeline finishes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      {/* Pass 46 Phase 1 — sticky action bar: back nav + label + export/share. */}
      <ResultsActionBar
        missionId={missionId}
        title={mission?.title}
        goalType="brand_lift"
        completedAt={mission?.completed_at}
        qualified={mission?.qualified_respondent_count}
      />
      <header className="px-6 pt-6 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <Logo />
          <ChannelFilterDropdown
            channels={(blr.channels || []).map(c => ({ id: c.id, display_name: c.display_name }))}
            value={channelFilter}
            onChange={setChannelFilter}
          />
        </div>
        {/* Pass 27 F20 — multi-dim filter row. AND composition. */}
        <div className="flex items-center gap-3 flex-wrap text-xs bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl px-4 py-2">
          <span className="text-[var(--t3)] font-semibold">Filters:</span>
          <MarketFilterDropdown
            label="Markets"
            options={(blr.geography || []).map(g => ({ value: g.region, label: g.region }))}
            value={filters.markets}
            onChange={(v) => setFilters({ ...filters, markets: v })}
            disabled={!(blr.geography && blr.geography.length > 1)}
            disabledHint="single-market"
          />
          <ChannelCategoryFilterDropdown
            label="Categories"
            options={CHANNEL_CATEGORIES}
            value={filters.channelCategories}
            onChange={(v) => setFilters({ ...filters, channelCategories: v })}
          />
          <GenderFilterDropdown
            label="Gender"
            options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'non_binary', label: 'Non-binary' }]}
            value={filters.genders}
            onChange={(v) => setFilters({ ...filters, genders: v })}
          />
          <AgeFilterDropdown
            label="Age"
            options={AGE_BUCKETS.map(b => ({ value: b, label: b }))}
            value={filters.ageGroups}
            onChange={(v) => setFilters({ ...filters, ageGroups: v })}
          />
          <IncrementalityFilterDropdown
            value={filters.exposureMode}
            onChange={(v) => setFilters({ ...filters, exposureMode: v })}
          />
          <WaveFilterDropdown
            label="Wave"
            options={(blr.waves || []).map(w => ({ value: w.label, label: w.label }))}
            value={filters.wave}
            onChange={(v) => setFilters({ ...filters, wave: v })}
            disabled={!(blr.waves && blr.waves.length > 1)}
            disabledHint="single-wave"
          />
          {filtersActive && (
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="ml-auto inline-flex items-center gap-1 text-[var(--lime)] hover:opacity-70"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset filters
            </button>
          )}
        </div>
        {/* Pass 27.5 D — filter result metadata badge. */}
        {filtersActive && (
          <div className="flex items-center gap-2 text-[11px] px-1">
            {filterLoading ? (
              <span className="text-[var(--t3)] italic">Filtering…</span>
            ) : filterResult ? (
              filterResult.filtered_respondent_count === 0 ? (
                <span className="text-amber-400">
                  No respondents match the current filters. Try removing some filters.
                </span>
              ) : (
                <span className="text-[var(--t2)]">
                  Filters active: <span className="text-[var(--lime)] font-semibold">{filterResult.filtered_respondent_count}</span> of {filterResult.total_respondent_count} respondents
                  {filterResult.lift_mode && <span className="ml-2 text-[var(--lime)]">· lift mode</span>}
                </span>
              )
            ) : (
              <span className="text-[var(--t3)] italic">Filter result pending…</span>
            )}
          </div>
        )}
        {filters.exposureMode === 'lift' && (
          <p className="text-[11px] text-[var(--t3)] italic px-1">
            ⓘ Lift mode active — every metric below shows Exposed − Control deltas instead of absolute values. Positive = the campaign drove the outcome above baseline.
          </p>
        )}
      </header>
      {/* Pass 46 Phase 4 — research-grade centerpiece (consumer-first headline
          + exposed/control brand funnel). Reads the deterministic brand_lift
          block from mission.analysis; renders an honest null-state when lift
          can't be computed. Sits ABOVE the existing dashboard, which is now
          the "Supporting Detail" layer. */}
      <BrandLiftCenterpiece analysis={(mission as any).analysis} mission={mission} />
      {filterEmpty ? (
        <div className="px-6 pb-12 max-w-6xl mx-auto">
          <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-8 text-center space-y-3">
            <h3 className="text-sm font-semibold text-amber-400">No respondents match the current filters</h3>
            <p className="text-xs text-[var(--t2)]">
              Try removing one or more filters to see the underlying data.
            </p>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--lime)] text-black font-display font-bold text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset filters
            </button>
          </div>
        </div>
      ) : (
        <div
          className={[
            'px-6 pb-12 space-y-5 max-w-6xl mx-auto transition-opacity duration-150',
            refetching ? 'opacity-60' : 'opacity-100',
          ].join(' ')}
        >
          {/* Pass 42 C4 — universal chart sections on top of the rich
              brand-lift specific layout. Renders nothing when chart_data
              isn't present so older brand_lift missions look unchanged. */}
          <UniversalCharts missionId={missionId} />
          {/* Pass 42 D1 — methodology-specific pre/post + lift delta. */}
          <BrandLiftCharts missionId={missionId} />
          {liftMode ? (
            <LiftScoreCard funnel={blr.funnel} fallbackScore={blr.score} />
          ) : (
            <BrandLiftScoreDial score={blr.score || 0} bandExplanation={blr.band_explanation} />
          )}
          {blr.funnel && (
            liftMode ? (
              <LiftFunnelTable stages={blr.funnel} />
            ) : (
              <FunnelVisualization stages={blr.funnel} preStages={blr.pre_funnel} />
            )
          )}
          <ChannelPerformanceTable channels={filteredChannels} />
          <GeographicBreakdown rows={blr.geography || []} />
          <CreativeDiagnostic analysis={(mission?.creative_analysis || null) as never} />
          {blr.competitors && <CompetitorComparison rows={blr.competitors} />}
          {blr.waves && blr.waves.length >= 2 && (
            <WaveComparison waves={blr.waves} synthesis={blr.wave_synthesis} />
          )}
          {blr.recommendations && blr.recommendations.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--t1)] px-1">AI Recommendations</h3>
              {blr.recommendations.slice(0, 5).map((r, i) => (
                <AIRecommendationCard key={i} rec={r} index={i} />
              ))}
            </section>
          )}

          <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
            Benchmarks are AI-estimated based on category norms. They are directional, not validated panel data. Use for orientation, not absolute claims.
          </p>
        </div>
      )}

      {/* Pass 46 Phase 1 — footer twin of the action bar. */}
      <ResultsActionBar
        variant="footer"
        missionId={missionId}
        title={mission?.title}
        goalType="brand_lift"
        completedAt={mission?.completed_at}
        qualified={mission?.qualified_respondent_count}
      />
    </div>
  );
}

// Pass 28 C — lift-mode score card. The standard radial dial doesn't
// communicate {exposed, control, delta_pp}; this card surfaces the
// delta + arrow so the user sees the lift directly.
function LiftScoreCard({
  funnel,
  fallbackScore,
}: {
  funnel?: FunnelStageWithLift[];
  fallbackScore?: number;
}) {
  const stages = funnel || [];
  const exposedAvg = stages.length > 0
    ? Math.round(stages.reduce((s, x) => s + (x.value || 0), 0) / stages.length)
    : (fallbackScore || 0);
  const controlAvg = stages.length > 0
    ? Math.round(stages.reduce((s, x) => s + (x.control || 0), 0) / stages.length)
    : 0;
  const delta = exposedAvg - controlAvg;
  const positive = delta >= 0;
  return (
    <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-8 flex flex-col items-center gap-2">
      <p className="text-xs uppercase tracking-widest text-[var(--t3)]">Brand Lift Score</p>
      <p
        className="text-5xl font-black tabular-nums"
        style={{ color: positive ? '#BEF264' : '#F87171' }}
      >
        {positive ? '+' : ''}{delta}pp
      </p>
      <p className="text-[11px] text-[var(--t2)] mt-1">
        Exposed <span className="text-[var(--t1)] font-semibold">{exposedAvg}</span>{' '}
        − Control <span className="text-[var(--t1)] font-semibold">{controlAvg}</span> = {delta}pp
      </p>
      <p className="text-[10px] text-[var(--t3)] mt-1 text-center max-w-md">
        Lift values reflect Exposed minus Control across the funnel stages. Positive = the campaign moved the metric above baseline.
      </p>
    </div>
  );
}

// Pass 28 C — lift-mode funnel table. Side-by-side exposed vs control
// values with a delta column. Replaces the standard FunnelVisualization
// when exposure=lift filter is active.
function LiftFunnelTable({ stages }: { stages: FunnelStageWithLift[] }) {
  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
      <header>
        <h3 className="text-sm font-semibold text-[var(--t1)]">Funnel Performance · Lift</h3>
        <p className="text-xs text-[var(--t3)] mt-0.5">Exposed vs Control per stage</p>
      </header>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[var(--t3)] border-b border-[var(--b1)]">
            <th className="text-left py-2 font-medium">Stage</th>
            <th className="text-right py-2 font-medium">Exposed</th>
            <th className="text-right py-2 font-medium">Control</th>
            <th className="text-right py-2 font-medium">Lift (pp)</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((s) => {
            const delta = typeof s.delta_pp === 'number' ? s.delta_pp : (s.value || 0) - (s.control || 0);
            const positive = delta >= 0;
            return (
              <tr key={s.id} className="border-b border-[var(--b1)]/40">
                <td className="py-2 text-[var(--t1)]">{s.label}</td>
                <td className="py-2 text-right tabular-nums">{(s.value || 0).toFixed(0)}%</td>
                <td className="py-2 text-right tabular-nums">{(s.control || 0).toFixed(0)}%</td>
                <td
                  className="py-2 text-right font-semibold tabular-nums"
                  style={{ color: positive ? '#BEF264' : '#F87171' }}
                >
                  {positive ? '+' : ''}{delta}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default BrandLiftResultsPage;
