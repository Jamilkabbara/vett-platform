import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';
// Pass 41 BUG2 — universal renderer fallback when this page can't
// produce its marketing-specific stages (missing aggregated_by_question
// or schema-incompatible row). Same fallback pattern as Pass 41 BUG1
// in BrandLiftResultsPage.
import { ResearchResultsPage } from './ResearchResultsPage';
// Pass 42 C4 — universal chart sections in the rich AdTesting path.
import { UniversalCharts } from '../components/results/UniversalCharts';
// Pass 46 Phase 1 — universal results action bar (back / export / share).
import { ResultsActionBar } from '../components/results/ResultsActionBar';
// Pass 46 Phase 4 — research-grade ad-effectiveness centerpiece (headline +
// funnel), reading the deterministic marketing block from mission.analysis.
import { MarketingCenterpiece } from '../components/results/centerpieces/MarketingCenterpiece';
// Pass 48 Phase 2 — canonical report (one source of truth for web + chat + exports).
import { useCanonicalReport } from '../components/results/report/useCanonicalReport';
import { ReportHeader } from '../components/results/report/ReportHeader';
import { FullSurveySection } from '../components/results/report/FullSurveySection';

/**
 * Pass 31 A1 (closes Pass 30 B6 deferral) — Test Marketing/Ads
 * results page (Ad Effectiveness — Kantar Link tradition).
 *
 * Routed via ResultsRouter when goal_type === 'marketing'. Reads:
 *   mission.questions             — 12 / 13 ad-effectiveness Qs
 *   mission.aggregated_by_question
 *   mission.creative_media_url / type, channel / format / objective,
 *   intended_message, brand_name, category
 *
 * Renders:
 *   - Hero KPI row: branded recall / likeability / persuasion / stopping
 *   - Creative preview card
 *   - Funnel stages chart
 *   - Emotional response bars (12 emotions, valence-coded)
 *   - Likeability + stopping + distinctiveness bars
 *   - Message takeaway themes (with intent drift flag if intended_message)
 *   - Persuasion shift distribution
 *   - Sharing intent stacked bar
 *   - Recommendation card
 */

interface MarketingMission {
  id: string;
  questions: MarketingQuestion[];
  brand_name?: string;
  category?: string;
  creative_media_url?: string;
  creative_media_type?: string;
  campaign_channel?: string;
  campaign_format?: string;
  campaign_objective?: string;
  intended_message?: string;
  // Pass 46 Phase 4 — deterministic analysis block (computeMarketing output)
  // consumed by MarketingCenterpiece. Loosely typed; the centerpiece reads
  // the documented shape defensively.
  analysis?: any;
  // Pass 46 Phase 1 — status gate + action-bar metadata.
  status?: string;
  title?: string | null;
  goal_type?: string | null;
  completed_at?: string | null;
  qualified_respondent_count?: number | null;
}

interface MarketingQuestion {
  id: string;
  text: string;
  type: string;
  methodology?: string;
  funnel_stage?: string;
  options?: string[];
}

interface AggregatedAnswer {
  id: string;
  type: string;
  n: number;
  distribution?: Record<string, number>;
  average?: number;
  verbatims?: string[];
}

interface BandSpec {
  threshold: number;
  label: string;
  color: string;
}

const RECALL_BANDS: BandSpec[] = [
  { threshold: 40, label: 'Strong',   color: '#BEF264' },
  { threshold: 25, label: 'Moderate', color: '#FACC15' },
  { threshold: 0,  label: 'Weak',     color: '#F87171' },
];
const LIKE_BANDS: BandSpec[] = [
  { threshold: 50, label: 'Positive', color: '#BEF264' },
  { threshold: 30, label: 'Mixed',    color: '#FACC15' },
  { threshold: 0,  label: 'Negative', color: '#F87171' },
];
const STOPPING_BANDS: BandSpec[] = [
  { threshold: 40, label: 'Effective', color: '#BEF264' },
  { threshold: 25, label: 'Weak',      color: '#FACC15' },
  { threshold: 0,  label: 'Failing',   color: '#F87171' },
];

function bandOf(score: number, bands: BandSpec[]): BandSpec {
  return bands.find((b) => score >= b.threshold) || bands[bands.length - 1];
}

function persuasionBand(shift: number): BandSpec {
  if (shift >= 0.5) return { threshold: 0.5, label: 'Strong shift', color: '#BEF264' };
  if (shift >= 0.1) return { threshold: 0.1, label: 'Mild shift',   color: '#FACC15' };
  return { threshold: 0, label: 'No shift', color: '#F87171' };
}

function topTwoBoxRating(dist: Record<string, number>, scaleMax: number): number {
  const total = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total === 0) return 0;
  let top = 0;
  for (const [k, v] of Object.entries(dist)) {
    const score = parseInt(k, 10);
    if (Number.isFinite(score) && score >= scaleMax - 1) top += Number(v) || 0;
  }
  return Math.round((top / total) * 100);
}

function mean(dist: Record<string, number>): number {
  let total = 0; let weighted = 0;
  for (const [k, v] of Object.entries(dist)) {
    const score = parseInt(k, 10);
    const n = Number(v) || 0;
    if (Number.isFinite(score)) { total += n; weighted += score * n; }
  }
  return total > 0 ? weighted / total : 0;
}

const POSITIVE_EMOTIONS = ['Amused', 'Inspired', 'Curious', 'Surprised', 'Happy', 'Nostalgic'];
const NEGATIVE_EMOTIONS = ['Annoyed', 'Bored', 'Confused', 'Skeptical'];
const NEUTRAL_EMOTIONS = ['Indifferent', 'Other'];

export function AdTestingResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<MarketingMission | null>(null);
  const [agg, setAgg] = useState<Record<string, AggregatedAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pass 41 BUG2 — also probe `insights` + `status` so we can fall back
  // to ResearchResultsPage for marketing missions that ran through the
  // standard synthesis pipeline (no aggregated_by_question / no funnel-
  // stage-tagged questions). Live audit caught 23389bb1-b30f-4b33-
  // a450-37ded4560307 in this state: goal_type=marketing,
  // status=completed, insights keys populated with the universal
  // shape, but no marketing-specific aggregation — page rendered
  // "Mission not found" because one of the marketing-specific
  // columns failed the SELECT or the required derivations couldn't
  // run.
  const [needsFallback, setNeedsFallback] = useState(false);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      // Two-step fetch: narrow marketing-specific select first; if
      // that errors (e.g. one of the columns is missing on this row's
      // schema variant), retry with a minimal select to determine
      // whether the row exists at all. This makes the fallback path
      // robust against schema drift.
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('id, questions, brand_name, category, creative_media_url, creative_media_type, campaign_channel, campaign_format, campaign_objective, intended_message, aggregated_by_question, analysis, status, insights, title, goal_type, completed_at, qualified_respondent_count')
        .eq('id', missionId)
        .single();

      if (fetchErr || !data) {
        // Probe: does the row exist at all? If yes, the fetch failed
        // on a column issue — delegate to the standard renderer.
        const { data: probe } = await supabase
          .from('missions')
          .select('id, status, insights')
          .eq('id', missionId)
          .maybeSingle();
        if (probe && probe.status === 'completed' && probe.insights) {
          setNeedsFallback(true);
        } else {
          setError('Mission not found');
        }
        setLoading(false);
        return;
      }

      // Row fetched fine — but the marketing-specific aggregation
      // may not be present. If aggregated_by_question is missing or
      // empty AND insights has been synthesized, fall back to the
      // universal renderer rather than showing "still generating"
      // forever.
      const aggData = (data as Record<string, unknown>).aggregated_by_question as Record<string, AggregatedAnswer> | null;
      const aggEmpty = !aggData || Object.keys(aggData).length === 0;
      const status   = (data as Record<string, unknown>).status as string | undefined;
      const insights = (data as Record<string, unknown>).insights;
      const insightsPresent =
        insights != null &&
        typeof insights === 'object' &&
        Object.keys(insights as Record<string, unknown>).length > 0;
      if (aggEmpty && status === 'completed' && insightsPresent) {
        setNeedsFallback(true);
        setLoading(false);
        return;
      }

      setMission(data as MarketingMission);
      setAgg(aggData || {});
      setLoading(false);
    })();
  }, [missionId]);

  // Pass 48 Phase 2 — canonical report (header + full-survey appendix).
  const { report } = useCanonicalReport(missionId);

  const stages = useMemo(() => {
    if (!mission) return null;
    const find = (stage: string) => mission.questions.find((q) => q.funnel_stage === stage);

    const aidedRecallQ = find('recall'); // q4 first 'recall' — but q2 is also 'recall'
    // Disambiguate: q2 is unaided/category recall (text), q4 is aided creative recall (single yes/no).
    const recallQs = mission.questions.filter((q) => q.funnel_stage === 'recall');
    const unaidedQ = recallQs.find((q) => q.type === 'text') || recallQs[0];
    const aidedRecall = recallQs.find((q) => q.type === 'single') || recallQs[1] || aidedRecallQ;

    const attributionQ = find('attribution');
    const messageQ = find('message');
    const likeabilityQ = find('likeability');
    const stoppingQ = find('stopping');
    const distinctivenessQ = find('distinctiveness');
    const emotionalQ = find('emotional');
    const persuasionQ = find('persuasion');
    const messageMatchQ = find('message_match');
    const sharingQ = find('sharing');

    const aidedRecallDist = aidedRecall ? agg[aidedRecall.id]?.distribution || {} : {};
    const aidedRecallTotal = Object.values(aidedRecallDist).reduce((s, v) => s + (Number(v) || 0), 0);
    const aidedRecallYes = Number(aidedRecallDist['Yes']) || 0;
    const aidedRecallPct = aidedRecallTotal > 0 ? Math.round((aidedRecallYes / aidedRecallTotal) * 100) : 0;

    // Branded recall = % who correctly named the brand in attribution open text.
    // Without name-matching, use a proxy: % of attribution responses (each
    // verbatim that includes the brand name). Falls back to 0 when brand
    // unknown.
    const attributionVerbatims = attributionQ ? agg[attributionQ.id]?.verbatims || [] : [];
    const brandLower = (mission.brand_name || '').toLowerCase();
    let brandedRecallPct = 0;
    if (brandLower && attributionVerbatims.length > 0) {
      const correct = attributionVerbatims.filter((v) => v.toLowerCase().includes(brandLower)).length;
      brandedRecallPct = Math.round((correct / attributionVerbatims.length) * 100);
    }

    return {
      unaidedQ,
      aidedRecallPct,
      brandedRecallPct,
      attributionVerbatims,
      messageVerbatims: messageQ ? agg[messageQ.id]?.verbatims || [] : [],
      likeability: likeabilityQ ? topTwoBoxRating(agg[likeabilityQ.id]?.distribution || {}, 7) : 0,
      stopping: stoppingQ ? topTwoBoxRating(agg[stoppingQ.id]?.distribution || {}, 7) : 0,
      distinctiveness: distinctivenessQ ? topTwoBoxRating(agg[distinctivenessQ.id]?.distribution || {}, 7) : 0,
      emotionalDist: emotionalQ ? agg[emotionalQ.id]?.distribution || {} : {},
      emotionalN: emotionalQ ? agg[emotionalQ.id]?.n_respondents ?? agg[emotionalQ.id]?.n ?? 0 : 0,
      persuasionDist: persuasionQ ? agg[persuasionQ.id]?.distribution || {} : {},
      // Persuasion shift on a 1-7 scale where 4 is neutral; subtract 4
      // from the mean so 0 = no shift, +3 max increase, -3 max decrease.
      persuasionShift: persuasionQ ? mean(agg[persuasionQ.id]?.distribution || {}) - 4 : 0,
      messageMatchDist: messageMatchQ ? agg[messageMatchQ.id]?.distribution || {} : {},
      hasMessageMatch: !!messageMatchQ,
      sharingDist: sharingQ ? agg[sharingQ.id]?.distribution || {} : {},
    };
  }, [mission, agg]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--lime)] animate-spin" />
      </div>
    );
  }
  // Pass 41 BUG2 — fallback to the universal renderer for marketing
  // missions that don't have aggregated_by_question or hit a schema
  // mismatch on the marketing-specific column SELECT. Audited mission
  // 23389bb1-b30f-4b33-a450-37ded4560307 in this state.
  if (needsFallback) {
    return <ResearchResultsPage />;
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-bold text-[var(--t1)]">{error}</h2>
        <Link to="/missions" className="text-[var(--lime)] text-sm underline">← Back to missions</Link>
      </div>
    );
  }
  // Pass 46 Phase 1 — gate on mission.status, not derived data (false "still generating" on completed missions, audit P0-3).
  // (`!stages` only happens when the mission row is absent — kept for type narrowing. The agg-empty
  // check mirrors Pass 41 BUG2's aggEmpty; completed missions always render the main content.)
  if (!stages || (mission?.status !== 'completed' && Object.keys(agg).length === 0)) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <ResultsActionBar
          missionId={missionId}
          title={mission?.title}
          goalType={mission?.goal_type}
          completedAt={mission?.completed_at}
          qualified={mission?.qualified_respondent_count}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5 text-center">
          <Logo />
          <p className="text-sm text-[var(--t2)] mt-4">Ad effectiveness analysis still generating.</p>
        </div>
      </div>
    );
  }

  const recallBand = bandOf(stages.brandedRecallPct, RECALL_BANDS);
  const likeBand = bandOf(stages.likeability, LIKE_BANDS);
  const persuasionBnd = persuasionBand(stages.persuasionShift);
  const stoppingBnd = bandOf(stages.stopping, STOPPING_BANDS);

  // Recommendation
  let recommendation: { icon: string; label: string; detail: string };
  if (stages.brandedRecallPct >= 40 && stages.likeability >= 50 && stages.persuasionShift >= 0.5) {
    recommendation = { icon: '🟢', label: 'Launch', detail: 'Branded recall ≥40%, likeability ≥50%, persuasion shift ≥+0.5. Creative clears the launch threshold.' };
  } else if (stages.brandedRecallPct < 25 || stages.persuasionShift <= 0) {
    recommendation = { icon: '🔴', label: 'Rework', detail: `Branded recall ${stages.brandedRecallPct}% or persuasion shift ${stages.persuasionShift.toFixed(1)} signals major rework needed before media spend.` };
  } else {
    recommendation = { icon: '🟡', label: 'Optimize', detail: '1-2 metrics weak. A/B test edits before launch.' };
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <ResultsActionBar
        missionId={missionId}
        title={mission?.title}
        goalType={mission?.goal_type}
        completedAt={mission?.completed_at}
        qualified={mission?.qualified_respondent_count}
      />
      {/* Pass 48 Phase 2 — canonical report header (brief + sample summary). */}
      {report && <ReportHeader report={report} />}
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo />
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)]">
          Test Marketing · Ad Effectiveness
        </span>
      </header>

      {/* Pass 46 Phase 4 — research-grade centerpiece (consumer-first headline
          + ad-effectiveness funnel). Reads the deterministic marketing block
          from mission.analysis; honest null-state when no stage is scorable.
          Sits ABOVE the existing dashboard ("Supporting Detail" layer). */}
      <MarketingCenterpiece analysis={(mission as any).analysis} mission={mission} />

      <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
        {/* Pass 42 C4 — universal chart sections. */}
        <UniversalCharts missionId={missionId} />

        {/* Hero KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Branded Recall" value={`${stages.brandedRecallPct}%`} band={recallBand} sub="Correct brand named" />
          <KPICard label="Likeability"    value={`${stages.likeability}%`}      band={likeBand}   sub="Top-2 box of 7" />
          <KPICard label="Persuasion"     value={`${stages.persuasionShift >= 0 ? '+' : ''}${stages.persuasionShift.toFixed(1)}`} band={persuasionBnd} sub="Shift on 7-pt scale" />
          <KPICard label="Stopping Power" value={`${stages.stopping}%`}         band={stoppingBnd} sub="Top-2 box attention" />
        </div>

        {/* Creative preview */}
        {mission?.creative_media_url && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-[var(--t1)]">Creative Tested</h3>
              <span className="text-[11px] text-[var(--t3)]">
                {mission.brand_name && `${mission.brand_name} · `}
                {mission.campaign_channel} · {mission.campaign_format} · {mission.campaign_objective}
              </span>
            </div>
            {mission.creative_media_type === 'video' ? (
              <video src={mission.creative_media_url} controls className="max-h-64 mx-auto rounded-xl" />
            ) : (
              <img src={mission.creative_media_url} alt="" className="max-h-64 mx-auto rounded-xl" />
            )}
          </section>
        )}

        {/* Funnel stages */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Funnel Stages</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">Conversion narrows from awareness through persuasion.</p>
          </header>
          {[
            { label: 'Aided recall', score: stages.aidedRecallPct, sub: 'Recognized this ad' },
            { label: 'Brand attribution', score: stages.brandedRecallPct, sub: 'Correctly named brand' },
            ...(stages.hasMessageMatch ? [{
              label: 'Message clarity',
              score: (() => {
                const total = Object.values(stages.messageMatchDist).reduce((s, v) => s + (Number(v) || 0), 0);
                const yes = Number(stages.messageMatchDist['Yes']) || 0;
                return total > 0 ? Math.round((yes / total) * 100) : 0;
              })(),
              sub: 'Communicated intended message',
            }] : []),
            { label: 'Likeability', score: stages.likeability, sub: 'Top-2 box on 7-pt' },
            { label: 'Persuasion', score: Math.round(((stages.persuasionShift + 3) / 6) * 100), sub: 'Mean shift mapped to 0-100' },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-[180px_1fr_60px] gap-3 items-center text-xs">
              <div className="flex flex-col">
                <span className="text-[var(--t2)] truncate">{row.label}</span>
                <span className="text-[10px] text-[var(--t4)]">{row.sub}</span>
              </div>
              <div className="relative h-4 bg-[var(--bg3)] rounded">
                <div
                  className={['absolute top-0 left-0 h-full rounded', row.score >= 50 ? 'bg-[var(--lime)]' : row.score >= 30 ? 'bg-amber-400' : 'bg-red-400'].join(' ')}
                  style={{ width: `${Math.max(0, Math.min(100, row.score))}%` }}
                />
              </div>
              <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{row.score}%</span>
            </div>
          ))}
        </section>

        {/* Emotional response */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Emotional Response</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">Multi-select; 12 emotions tagged by valence.</p>
          </header>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[...POSITIVE_EMOTIONS, ...NEGATIVE_EMOTIONS, ...NEUTRAL_EMOTIONS].map((emo) => {
              const n = Number(stages.emotionalDist[emo]) || 0;
              const pct = stages.emotionalN > 0 ? (n / stages.emotionalN) * 100 : 0;
              const isPos = POSITIVE_EMOTIONS.includes(emo);
              const isNeg = NEGATIVE_EMOTIONS.includes(emo);
              return (
                <div key={emo} className="grid grid-cols-[80px_1fr_40px] gap-2 items-center text-[11px]">
                  <span className="text-[var(--t2)] truncate">{emo}</span>
                  <div className="relative h-3 bg-[var(--bg3)] rounded">
                    <div
                      className={['absolute top-0 left-0 h-full rounded', isPos ? 'bg-[var(--lime)]' : isNeg ? 'bg-red-400' : 'bg-[var(--t3)]'].join(' ')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-right tabular-nums text-[var(--t1)]">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Diagnostic bars */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Creative Diagnostics</h3>
          </header>
          {[
            { label: 'Likeability',     score: stages.likeability,     bench: 50 },
            { label: 'Stopping power',  score: stages.stopping,        bench: 40 },
            { label: 'Distinctiveness', score: stages.distinctiveness, bench: 40 },
          ].map((r) => (
            <div key={r.label} className="grid grid-cols-[160px_1fr_50px] gap-3 items-center text-xs">
              <span className="text-[var(--t2)] truncate">{r.label}</span>
              <div className="relative h-4 bg-[var(--bg3)] rounded">
                <div
                  className={['absolute top-0 left-0 h-full rounded', r.score >= r.bench ? 'bg-[var(--lime)]' : r.score >= r.bench * 0.7 ? 'bg-amber-400' : 'bg-red-400'].join(' ')}
                  style={{ width: `${r.score}%` }}
                />
                <span
                  className="absolute top-1/2 -translate-y-1/2 h-3 border-l border-[var(--lime)]/60"
                  style={{ left: `${r.bench}%` }}
                  title={`benchmark ${r.bench}%`}
                />
              </div>
              <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{r.score}%</span>
            </div>
          ))}
        </section>

        {/* Message takeaway themes */}
        {stages.messageVerbatims.length > 0 && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Message Takeaways</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">
                What respondents thought the ad was about (sampled from open text).
                {mission?.intended_message && (
                  <span className="text-amber-400 ml-1">
                    Intent: &ldquo;{mission.intended_message}&rdquo; — flag any drift below.
                  </span>
                )}
              </p>
            </header>
            <ul className="space-y-1.5">
              {stages.messageVerbatims.slice(0, 6).map((v, i) => (
                <li key={i} className="text-[11px] text-[var(--t2)] bg-[var(--bg3)] rounded-lg px-2 py-1.5">
                  &ldquo;{v}&rdquo;
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Persuasion shift distribution */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Persuasion Shift Distribution</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">7-pt scale: 1 much less likely → 7 much more likely. 4 = no change.</p>
          </header>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => {
            const total = Object.values(stages.persuasionDist).reduce((s, v) => s + (Number(v) || 0), 0);
            const count = Number(stages.persuasionDist[String(n)]) || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={n} className="grid grid-cols-[40px_1fr_50px] gap-3 items-center text-[11px]">
                <span className="text-[var(--t3)] tabular-nums">{n}</span>
                <div className="relative h-3 bg-[var(--bg3)] rounded">
                  <div
                    className={['absolute top-0 left-0 h-full rounded', n > 4 ? 'bg-[var(--lime)]' : n < 4 ? 'bg-red-400' : 'bg-[var(--t3)]'].join(' ')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right tabular-nums text-[var(--t1)]">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </section>

        {/* Sharing intent */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Sharing Intent</h3>
          </header>
          {(['Yes', 'Maybe', 'No'] as const).map((label) => {
            const total = Object.values(stages.sharingDist).reduce((s, v) => s + (Number(v) || 0), 0);
            const n = Number(stages.sharingDist[label]) || 0;
            const pct = total > 0 ? (n / total) * 100 : 0;
            return (
              <div key={label} className="grid grid-cols-[80px_1fr_50px] gap-3 items-center text-xs">
                <span className="text-[var(--t2)]">{label}</span>
                <div className="relative h-4 bg-[var(--bg3)] rounded">
                  <div
                    className={['absolute top-0 left-0 h-full rounded', label === 'Yes' ? 'bg-[var(--lime)]' : label === 'Maybe' ? 'bg-amber-400' : 'bg-red-400'].join(' ')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </section>

        {/* Recommendation */}
        <section className="rounded-2xl p-6 border border-[var(--lime)]/40 bg-[var(--lime)]/5">
          <p className="text-[10px] uppercase tracking-widest text-[var(--lime)] font-display font-bold">Recommendation</p>
          <p className="text-2xl font-display font-black mt-1">{recommendation.icon} {recommendation.label}</p>
          <p className="text-[11px] text-[var(--t2)] mt-2">{recommendation.detail}</p>
        </section>

        {/* Industry benchmarks */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--t1)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--lime)]" />
            Industry benchmarks
          </h3>
          <ul className="text-xs text-[var(--t2)] space-y-1.5">
            <li><span className="text-[var(--t1)] font-semibold">Branded recall ≥40%</span> = strong (Kantar Link norm)</li>
            <li><span className="text-[var(--t1)] font-semibold">Top-2 box likeability ≥50%</span> = positive reception</li>
            <li><span className="text-[var(--t1)] font-semibold">Persuasion shift +0.5pt on 7-pt</span> = meaningful behavior change</li>
            <li><span className="text-[var(--t1)] font-semibold">TV stopping power ≥45%</span> / <span className="text-[var(--t1)] font-semibold">Social ≥35%</span> = effective attention</li>
          </ul>
        </section>

        <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
          Ad effectiveness on synthetic respondents calibrated to the audience spec. For high-spend launches, validate against real-customer panels.
        </p>
      </div>

      {/* Pass 48 Phase 2 — "The full survey" appendix (every Q with its correct widget). */}
      {report && <FullSurveySection survey={report.survey} />}

      <ResultsActionBar
        variant="footer"
        missionId={missionId}
        title={mission?.title}
        goalType={mission?.goal_type}
        completedAt={mission?.completed_at}
        qualified={mission?.qualified_respondent_count}
      />
    </div>
  );
}

function KPICard({
  label, value, band, sub,
}: { label: string; value: string; band: BandSpec; sub?: string }) {
  return (
    <div className="rounded-2xl p-5 border bg-[var(--bg2)]" style={{ borderColor: band.color + '88' }}>
      <p className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">{label}</p>
      <p className="text-3xl font-display font-black mt-1 tabular-nums" style={{ color: band.color }}>{value}</p>
      <p className="text-[11px] mt-1 font-semibold" style={{ color: band.color }}>{band.label}</p>
      {sub && <p className="text-[10px] text-[var(--t3)] mt-1">{sub}</p>}
    </div>
  );
}

export default AdTestingResultsPage;
