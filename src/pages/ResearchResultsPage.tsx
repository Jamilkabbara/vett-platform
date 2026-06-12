/**
 * Pass 36 A0c — Research Results Page (goal_type=research).
 *
 * May 11 2026 demo: customer saw hero + a vast black gap + content
 * far below. Root cause: goal_type='research' was falling through to
 * the generic ResultsPage whose layout assumes a specific insight
 * shape and renders huge empty space when missing.
 *
 * This component is a dedicated renderer for the 7 insight keys that
 * goal_type='research' produces: kpis / follow_ups / contradictions
 * / recommendations / executive_summary / segment_breakdowns /
 * per_question_insights. Order is reader-natural: KPI strip first,
 * then exec summary, then segments, then tensions, then per-Q
 * insights, then recommendations + follow-ups.
 *
 * No huge gaps. Every section gates on the presence of its key.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, AlertCircle, ArrowLeft, Users, Clock,
  Sparkles, TrendingUp, AlertTriangle, MessageCircleQuestion,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OverlayPage } from '../components/layout/OverlayPage';
// Pass 40 CRASH40-3 — wrap each insight section so a render error in
// one (schema drift, unknown object shape, etc.) degrades only that
// section instead of blanking the whole tree. Pairs with the Pass 39
// renderInsightItem helper which JSON-stringifies unknown shapes.
import { InsightErrorBoundary } from '../components/shared/InsightErrorBoundary';
// Pass 42 C4 — universal chart sections. All three components read
// chart_data via useChartData; each returns null gracefully when the
// relevant block is absent so we never render an empty chart frame.
import { QuestionDistributions } from '../components/results/QuestionDistributions';
import { SentimentBreakdown } from '../components/results/SentimentBreakdown';
import { SegmentComparison } from '../components/results/SegmentComparison';
// Pass 46 Phase 1 — universal action bar (back nav + methodology label + export/share).
import { ResultsActionBar, methodologyLabel } from '../components/results/ResultsActionBar';

interface MissionRow {
  id: string;
  title: string | null;
  brief: string | null;
  goal_type: string | null;
  status: string;
  respondent_count: number | null;
  delivered_respondent_count: number | null;
  total_simulated_count: number | null;
  qualified_respondent_count: number | null;
  qualification_rate: number | null;
  completed_at: string | null;
  insights: ResearchInsights | string | null;
  // Pass 42 A4 — partial-delivery signals from the recruit loop.
  // delivery_status='partial' means recruitment hit the 70% margin
  // ceiling before reaching the target. The hero shows honest copy
  // ("N of M qualified — strict screener") instead of the normal
  // "N respondents delivered" suffix. NO REFUND — policy.
  delivery_status: 'full' | 'partial' | 'screener_too_restrictive' | null;
  target_qualified_count: number | null;
  recruitment_status: 'pending' | 'recruiting' | 'ceiling_hit' | 'target_hit' | null;
}

// Pass 39 CRASH-1 — recommendations + follow_ups can ship as either
// plain strings (legacy) OR rich objects with {goal, title, rationale}
// (current Claude prompt output). Both shapes appear in production:
// demo mission b2072d69's insights.recommendations is the rich shape;
// older missions still have string[]. The pre-Pass-39 type erroneously
// declared `string[]` only, and `RecommendationList` rendered `{r}`
// directly — when `r` was an object, React threw error #31 ("Objects
// are not valid as a React child"). The full results page went blank
// because the throw happened inside the render tree.
export type InsightItem =
  | string
  | { goal?: string; title?: string; rationale?: string };

interface ResearchInsights {
  kpis?: Array<{ label: string; value: string | number; note?: string }> | Record<string, unknown>;
  follow_ups?: InsightItem[];
  // Pass 40 CRASH40-2 — widened to handle real production shapes.
  // The AI synthesis prompt evolved and now emits richer objects;
  // earlier types only covered the simplest fields.
  contradictions?: Array<
    | string
    | null
    | {
        topic?: string;
        summary?: string;
        // Alternate field names the synthesis prompt has used over time
        headline?: string;
        body?: string;
        title?: string;
        rationale?: string;
        description?: string;
      }
  >;
  // Alias for contradictions — the synthesis prompt sometimes writes
  // `tensions` (Pass 35-ish migration that didn't update consumers).
  tensions?: ResearchInsights['contradictions'];
  recommendations?: InsightItem[];
  executive_summary?: string;
  segment_breakdowns?: Array<
    | null
    | {
        segment?: string;
        label?: string;
        n?: number;
        findings?: string[];
        summary?: string;
        // Alternate fields seen in production
        headline?: string;
        body?: string;
        title?: string;
      }
  >;
  // Alias for segment_breakdowns — synthesis sometimes writes
  // `cross_cut_analysis` instead.
  cross_cut_analysis?: ResearchInsights['segment_breakdowns'];
  per_question_insights?: Array<
    | null
    | {
        question_id?: string;
        question?: string;
        // Original fields
        insight?: string;
        summary?: string;
        // Current production shape (Pass 35+)
        body?: string;
        headline?: string;
        significance?: 'low' | 'medium' | 'high' | string;
      }
  >;
}

// Pass 40 CRASH40-2 — shared empty-state component for sections
// whose data is null or empty. Prevents the "bare section header with
// no body" or "two ⚠ icons with no text" pattern from the live audit.
function InsightEmptyState({ message }: { message: string }) {
  return (
    <p className="text-t3 text-sm italic">{message}</p>
  );
}

function significanceBadge(sig: string | undefined): React.ReactNode {
  if (!sig) return null;
  const s = sig.toLowerCase();
  const color =
    s === 'high'   ? 'bg-red/15 text-red-300 border-red/30' :
    s === 'medium' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
    s === 'low'    ? 'bg-bg3 text-t3 border-b1' :
                     'bg-bg3 text-t3 border-b1';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-display font-bold uppercase tracking-wider ${color}`}
      aria-label={`Significance: ${sig}`}
    >
      {sig}
    </span>
  );
}

function parseInsights(raw: ResearchInsights | string | null | undefined): ResearchInsights {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as ResearchInsights; } catch { return {}; }
  }
  return raw;
}

function KpiStrip({
  kpis,
  mission,
  perQuestionCount,
  qualifiedRate,
}: {
  kpis: ResearchInsights['kpis'];
  mission: MissionRow;
  perQuestionCount: number;
  qualifiedRate: number | null;
}) {
  // Pass 37 A1 — KPI strip ALWAYS renders. Empty insights.kpis →
  // fall back to mission-level metrics (delivered respondents,
  // question count, qualified rate) so the hero is followed by
  // immediate content instead of a black gap.
  const items: Array<{ label: string; value: string; note?: string }> = [];
  if (Array.isArray(kpis)) {
    for (const k of kpis) {
      items.push({
        label: String(k.label ?? '—'),
        value: String(k.value ?? '—'),
        note: k.note ? String(k.note) : undefined,
      });
    }
  } else if (kpis && typeof kpis === 'object') {
    for (const [k, v] of Object.entries(kpis)) {
      items.push({ label: k.replace(/_/g, ' '), value: String(v ?? '—') });
    }
  }
  if (items.length === 0) {
    // Fallback strip from mission columns — guarantees no black gap.
    items.push(
      {
        label: 'Respondents Delivered',
        value: String(mission.delivered_respondent_count ?? mission.respondent_count ?? '—'),
      },
      {
        label: 'Questions',
        value: String(perQuestionCount || '—'),
      },
      {
        label: 'Qualified Rate',
        value: qualifiedRate != null && Number.isFinite(qualifiedRate)
          ? `${Math.round(qualifiedRate * 100)}%`
          : '100%',
      },
    );
  }
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
      {items.slice(0, 6).map((k, i) => (
        <div key={i} className="rounded-2xl bg-bg2 border border-b1 p-5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-lime" />
          <p className="text-[10px] uppercase tracking-widest text-t3 font-display font-bold mb-1.5">
            {k.label}
          </p>
          <p className="text-2xl font-display font-black text-t1 break-words">{k.value}</p>
          {k.note && <p className="text-xs text-t3 mt-1.5">{k.note}</p>}
        </div>
      ))}
    </div>
  );
}

function ExecutiveSummary({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-6">
      <h2 className="text-xs font-display font-black text-lime uppercase tracking-widest mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" aria-hidden />
        Executive summary
      </h2>
      <p className="text-t1 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function SegmentBreakdowns({ items }: { items: NonNullable<ResearchInsights['segment_breakdowns']> }) {
  // Pass 40 CRASH40-2 — filter null items + render usable content from
  // whatever shape exists (segment/label/title/headline as the heading,
  // summary/body as the body). Live audit showed "Segment 1" / "Segment 2"
  // labels with no body — the rows had no segment/label/summary and the
  // findings array was empty, so the fallback "Segment N" label rendered
  // alone. Now: if a row has no usable content, the row is skipped; if
  // the whole array is null/empty, an empty-state message renders.
  const usable = items.filter((seg): seg is NonNullable<typeof seg> => {
    if (!seg) return false;
    const hasHeading = Boolean(seg.segment || seg.label || seg.title || seg.headline);
    const hasBody    = Boolean(seg.summary || seg.body);
    const hasFindings = Array.isArray(seg.findings) && seg.findings.length > 0;
    return hasHeading || hasBody || hasFindings;
  });
  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-6">
      <h2 className="text-xs font-display font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" aria-hidden />
        Cross-Cut Analysis
      </h2>
      {usable.length === 0 ? (
        <InsightEmptyState message="No cross-cut segment analysis available for this dataset." />
      ) : (
        <div className="space-y-4">
        {usable.map((seg, i) => {
          const findings = Array.isArray(seg.findings) ? seg.findings : [];
          const label   = seg.segment || seg.label || seg.title || seg.headline || `Segment ${i + 1}`;
          const summary = seg.summary || seg.body;
          return (
            <div key={i} className="border-l-2 border-lime/40 pl-4">
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-t1 font-display font-bold text-sm">{label}</h3>
                {seg.n != null && <span className="text-xs text-t3 font-mono">n={seg.n}</span>}
              </div>
              {summary && (
                <p className="text-t2 text-sm mb-2 leading-relaxed">{summary}</p>
              )}
              {findings.length > 0 && (
                <ul className="space-y-1.5">
                  {findings.map((f, j) => (
                    <li key={j} className="text-t2 text-sm leading-relaxed flex gap-2">
                      <span className="text-lime mt-0.5 shrink-0">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}

function TensionsFlagged({ items }: { items: NonNullable<ResearchInsights['contradictions']> }) {
  // Pass 40 CRASH40-2 — filter null items + read whatever heading/body
  // fields exist. Live audit showed "two ⚠ warning icons with no text"
  // — the rows existed but neither `topic` nor `summary` was set; the
  // synthesis prompt had migrated to {headline, body} / {title,
  // rationale} shapes for some missions. Now we accept any of those.
  const usable = items.filter((c): c is NonNullable<typeof c> => {
    if (c == null) return false;
    if (typeof c === 'string') return c.trim().length > 0;
    return Boolean(
      c.topic || c.summary || c.headline || c.body ||
      c.title || c.rationale || c.description,
    );
  });
  return (
    <div className="rounded-2xl bg-bg2 border border-amber-500/30 p-6">
      <h2 className="text-xs font-display font-black text-amber-300 uppercase tracking-widest mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" aria-hidden />
        Tensions Flagged
      </h2>
      {usable.length === 0 ? (
        <InsightEmptyState message="No tensions or contradictions surfaced in this dataset." />
      ) : (
        <ul className="space-y-3">
          {usable.map((c, i) => {
            if (typeof c === 'string') {
              return (
                <li key={i} className="text-t2 text-sm leading-relaxed flex gap-2">
                  <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                  <span>{c}</span>
                </li>
              );
            }
            const heading = c.topic || c.headline || c.title;
            const body    = c.summary || c.body || c.rationale || c.description;
            return (
              <li key={i} className="flex gap-2">
                <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                <div>
                  {heading && (
                    <p className="text-t1 font-display font-bold text-sm mb-1">{heading}</p>
                  )}
                  {body && (
                    <p className="text-t2 text-sm leading-relaxed">{body}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PerQuestionInsights({ items }: { items: NonNullable<ResearchInsights['per_question_insights']> }) {
  // Pass 40 CRASH40-2 — accept current production shape
  // {body, headline, question_id, significance} alongside legacy
  // {insight, summary, question}. Live audit showed 5 placeholder
  // "—" rows because the renderer indexed q.insight || q.summary
  // (neither present on Pass 35+ data shape).
  const usable = items.filter((q): q is NonNullable<typeof q> => {
    if (q == null) return false;
    return Boolean(q.headline || q.body || q.insight || q.summary || q.question);
  });
  return (
    <div className="rounded-2xl bg-bg2 border border-b1 p-6">
      <h2 className="text-xs font-display font-black text-lime uppercase tracking-widest mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" aria-hidden />
        Per-question insights
      </h2>
      {usable.length === 0 ? (
        <InsightEmptyState message="No per-question insights were generated for this mission." />
      ) : (
        <div className="space-y-4">
          {usable.map((q, i) => {
            // Heading priority: headline (Pass 35+ shape) > question (legacy)
            const heading = q.headline || q.question;
            // Body priority: body > insight > summary
            const body = q.body || q.insight || q.summary;
            return (
              <div key={q.question_id || i} className="border-l-2 border-b1 pl-4">
                <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                  {heading && (
                    <p className={
                      q.headline
                        ? 'text-t1 font-display font-bold text-sm'
                        : 'text-t3 text-xs font-mono'
                    }>
                      {heading}
                    </p>
                  )}
                  {significanceBadge(q.significance)}
                </div>
                {body && (
                  <p className="text-t2 text-sm leading-relaxed">{body}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Pass 39 CRASH-1 — render either a string item or a rich
// {goal, title, rationale} object. Falls through safely on null /
// undefined / unexpected shapes so a future schema drift doesn't
// re-crash the whole page.
function renderInsightItem(item: InsightItem | null | undefined, index: number): React.ReactNode {
  if (item == null) return null;
  if (typeof item === 'string') {
    return <span>{item}</span>;
  }
  // Rich object: prefer title as the primary line, rationale as the
  // detail, goal as a label badge. If none of these are present
  // (truly unexpected), JSON-stringify as last-resort fallback so
  // the row is at least visible rather than silently disappearing.
  const { title, rationale, goal } = item;
  const hasAnyField = Boolean(title || rationale || goal);
  if (!hasAnyField) {
    return <span className="opacity-60 font-mono text-xs">{JSON.stringify(item)}</span>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      {title && (
        <span className="font-semibold text-t1">
          {title}
        </span>
      )}
      {rationale && (
        <span className="text-t2 text-sm leading-relaxed">
          {rationale}
        </span>
      )}
      {goal && (
        <span
          className="self-start inline-flex items-center px-2 py-0.5 rounded-md bg-bg3 border border-b1 text-[10px] font-display font-bold uppercase tracking-wider text-t3"
          aria-label={`Goal: ${goal}`}
        >
          {goal}
        </span>
      )}
    </div>
  );
  // index parameter retained for future per-row diagnostics; eslint
  // would warn about unused but the call site uses it on the <li> key.
  void index;
}

function RecommendationList({
  title, icon, items, accent,
}: {
  title: string;
  icon: React.ReactNode;
  items: InsightItem[];
  accent: string;
}) {
  if (!items.length) return null;
  return (
    <div className={`rounded-2xl bg-bg2 border p-6 ${accent}`}>
      <h2 className="text-xs font-display font-black uppercase tracking-widest mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((r, i) => (
          <li key={i} className="text-t2 text-sm leading-relaxed flex gap-2">
            <span className="mt-0.5 shrink-0 opacity-80">{i + 1}.</span>
            <div className="flex-1 min-w-0">{renderInsightItem(r, i)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Pass 46 Phase 1 — when a methodology page (e.g. BrandLiftResultsPage)
// delegates to this generic renderer AND has already mounted its own
// ResultsActionBar above it, it passes barAlreadyMounted so we skip the
// header bar here and avoid doubling. The footer bar always renders.
interface ResearchResultsPageProps {
  barAlreadyMounted?: boolean;
}

export function ResearchResultsPage({ barAlreadyMounted = false }: ResearchResultsPageProps = {}) {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<MissionRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) {
      setError('No mission ID provided.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select(
          // Pass 42 A4 — also fetch delivery_status, target_qualified_count,
          // recruitment_status so the hero can render the partial-
          // delivery copy when applicable.
          'id, title, brief, goal_type, status, respondent_count, delivered_respondent_count, total_simulated_count, qualified_respondent_count, qualification_rate, completed_at, insights, delivery_status, target_qualified_count, recruitment_status',
        )
        .eq('id', missionId)
        .maybeSingle();
      if (cancelled) return;
      if (fetchErr || !data) {
        setError('Mission not found.');
      } else {
        setMission(data as MissionRow);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [missionId]);

  if (loading) {
    return (
      <OverlayPage>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-lime" />
        </div>
      </OverlayPage>
    );
  }

  if (error || !mission) {
    return (
      <OverlayPage>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <h2 className="text-lg font-display font-bold text-t1">{error || 'Mission not found.'}</h2>
          <Link to="/missions" className="text-lime text-sm hover:underline mt-2">
            Back to missions
          </Link>
        </div>
      </OverlayPage>
    );
  }

  const insights = parseInsights(mission.insights);
  const delivered =
    Number(mission.delivered_respondent_count ?? 0) ||
    Number(mission.total_simulated_count ?? 0) ||
    Number(mission.respondent_count ?? 0);
  const rate = mission.qualification_rate != null ? Number(mission.qualification_rate) : null;
  const showRate = rate != null && Number.isFinite(rate) && rate < 0.999;

  return (
    <OverlayPage>
      {/* Pass 37 A1 — space-y-4 (was space-y-6) so hero → KPI strip
          gap is ≤16px. OverlayPage adds py-24 padding outside this. */}
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Pass 46 Phase 1 — sticky action bar: back nav + methodology
            label (from mission.goal_type, so a brand_lift mission that
            lands here via the BrandLift fallback still reads "Brand Lift
            Study") + export/share. Skipped when the delegating page
            already mounted one. */}
        {!barAlreadyMounted && (
          <ResultsActionBar
            missionId={missionId}
            title={mission.title}
            goalType={mission.goal_type}
            completedAt={mission.completed_at}
            qualified={mission.qualified_respondent_count}
          />
        )}
        {/* Hero */}
        <div className="space-y-2">
          <Link to="/missions" className="inline-flex items-center gap-1.5 text-t3 hover:text-t1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> All missions
          </Link>
          {/* Pass 46 Phase 1 — label from the mission's goal_type, not a
              hardcoded "General research": this page is also the fallback
              renderer for brand_lift (audit P0-4) and AdTesting agg-less
              missions, which must keep their methodology identity. */}
          <p className="text-[10px] uppercase tracking-widest text-lime font-display font-bold">
            {methodologyLabel(mission.goal_type)} · {mission.status === 'completed' ? 'Mission complete' : mission.status}
          </p>
          <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-t1">
            {mission.title || mission.brief || 'Your mission'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-t3">
            {/* Pass 42 A4 — partial-delivery honest copy. When the
                recruit loop hit the 70% margin ceiling before
                reaching target_qualified_count, the hero says
                "N of M qualified — strict screener" with a tooltip.
                NO REFUND mention here — that's in the terms page
                (Pass 42 G4). */}
            <span
              className="inline-flex items-center gap-1.5"
              title={
                mission.delivery_status === 'partial'
                  ? 'Your screener was strict, so fewer respondents qualified than requested. All sales are final per VETT terms — but the insights below still surface the signal from those who did qualify.'
                  : undefined
              }
            >
              <Users className="w-3.5 h-3.5" />
              {(() => {
                const target = mission.target_qualified_count ?? mission.respondent_count ?? 0;
                if (mission.delivery_status === 'partial' && target > 0 && delivered < target) {
                  return `${delivered} of ${target} qualified — strict screener`;
                }
                if (showRate) {
                  return `${delivered} respondents delivered · ${Math.round((rate ?? 0) * 100)}% qualified`;
                }
                return `${delivered} respondents delivered`;
              })()}
            </span>
            {mission.completed_at && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Completed {new Date(mission.completed_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Pass 37 A1 — KPI strip ALWAYS renders immediately after hero.
            Fallback to mission-level metrics when insights.kpis is empty
            so there is no black gap. Tight space-y-4 between sections
            (was space-y-6) to keep the page dense. */}
        <KpiStrip
          kpis={insights.kpis}
          mission={mission}
          perQuestionCount={
            Array.isArray(insights.per_question_insights)
              ? insights.per_question_insights.length
              : 0
          }
          qualifiedRate={rate}
        />
        {/* Phase 4 slot: methodology headline + centerpiece render here */}
        {/* Pass 46 Phase 1 — generic charts demoted below the (Phase 4)
            headline + centerpiece slot per the report spec two-layer
            architecture. */}
        <h2 className="font-display font-bold text-t1 text-[15px] mt-8 mb-3">Supporting Detail</h2>
        {/* Pass 42 C4 — Sentiment donut above the executive summary. */}
        <InsightErrorBoundary label="Sentiment Breakdown">
          <SentimentBreakdown missionId={missionId} />
        </InsightErrorBoundary>
        <InsightErrorBoundary label="Executive Summary">
          {insights.executive_summary && <ExecutiveSummary text={insights.executive_summary} />}
        </InsightErrorBoundary>
        {/* Pass 40 CRASH40-2 — also accept `cross_cut_analysis` and
            `tensions` as alternate field names; the synthesis prompt
            has used both naming conventions across passes.
            Pass 40 CRASH40-3 — each section wrapped in InsightErrorBoundary
            so a render error in one degrades only that section. */}
        <InsightErrorBoundary label="Cross-Cut Analysis">
          {(() => {
            const segs = (Array.isArray(insights.segment_breakdowns) && insights.segment_breakdowns.length > 0
              ? insights.segment_breakdowns
              : (Array.isArray(insights.cross_cut_analysis) && insights.cross_cut_analysis.length > 0
                ? insights.cross_cut_analysis
                : null));
            return segs ? <SegmentBreakdowns items={segs} /> : null;
          })()}
        </InsightErrorBoundary>
        {/* Pass 42 C4 — Segment comparison between Cross-Cut and Tensions. */}
        <InsightErrorBoundary label="Segment Comparison">
          <SegmentComparison missionId={missionId} />
        </InsightErrorBoundary>
        <InsightErrorBoundary label="Tensions Flagged">
          {(() => {
            const tens = (Array.isArray(insights.contradictions) && insights.contradictions.length > 0
              ? insights.contradictions
              : (Array.isArray(insights.tensions) && insights.tensions.length > 0
                ? insights.tensions
                : null));
            return tens ? <TensionsFlagged items={tens} /> : null;
          })()}
        </InsightErrorBoundary>
        <InsightErrorBoundary label="Per-Question Insights">
          {Array.isArray(insights.per_question_insights) && insights.per_question_insights.length > 0 && (
            <PerQuestionInsights items={insights.per_question_insights} />
          )}
        </InsightErrorBoundary>
        {/* Pass 42 C4 — Response distribution charts between
            Per-Question Insights (narrative) and Recommendations. */}
        <InsightErrorBoundary label="Response Distributions">
          <QuestionDistributions missionId={missionId} />
        </InsightErrorBoundary>
        <InsightErrorBoundary label="Recommendations">
          {Array.isArray(insights.recommendations) && insights.recommendations.length > 0 && (
            <RecommendationList
              title="Recommendations"
              icon={<CheckCircle2 className="w-4 h-4 text-lime" aria-hidden />}
              items={insights.recommendations}
              accent="border-lime/30"
            />
          )}
        </InsightErrorBoundary>
        <InsightErrorBoundary label="Suggested Follow-Ups">
          {Array.isArray(insights.follow_ups) && insights.follow_ups.length > 0 && (
            <RecommendationList
              title="Suggested follow-ups"
              icon={<MessageCircleQuestion className="w-4 h-4 text-indigo-400" aria-hidden />}
              items={insights.follow_ups}
              accent="border-indigo-500/30"
            />
          )}
        </InsightErrorBoundary>

        {/* Pass 37 A1 — Pass 36 had a no-insights fallback here that
            never fired because KPI strip now always renders. Dropped. */}

        {/* Pass 46 Phase 1 — footer twin of the action bar. Always
            renders, in both the direct and the BrandLift-fallback usage. */}
        <ResultsActionBar
          variant="footer"
          missionId={missionId}
          title={mission.title}
          goalType={mission.goal_type}
          completedAt={mission.completed_at}
          qualified={mission.qualified_respondent_count}
        />
      </div>
    </OverlayPage>
  );
}

export default ResearchResultsPage;
