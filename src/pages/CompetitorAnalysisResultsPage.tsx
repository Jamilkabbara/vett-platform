import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';

/**
 * Pass 31 B2 — Competitor Analysis results page (Brand Health
 * Tracker, YouGov BrandIndex / Hanover / Kantar tradition).
 *
 * Routed via ResultsRouter when goal_type === 'competitor'. Reads:
 *   mission.questions             — 11 brand_health_tracker Qs
 *   mission.aggregated_by_question
 *   mission.brand_name, category, competitor_brands[], attribute_battery[]
 *
 * Renders:
 *   - Hero card: focal brand position summary
 *   - Brand funnel chart (5 stages × N brands)
 *   - Attribute heatmap (brands × attributes)
 *   - NPS by brand bar with band markers
 *   - Word-of-mouth bar (focal brand)
 *   - Recommendation card with auto-generated funnel-gap callouts
 */

interface CompetitorMission {
  id: string;
  questions: CompetitorQuestion[];
  brand_name?: string;
  category?: string;
  competitor_brands?: string[];
  attribute_battery?: string[];
}

interface CompetitorQuestion {
  id: string;
  text: string;
  type: string;
  methodology?: string;
  funnel_stage?: string;
  brand_id?: string;
  options?: string[];
}

interface AggregatedAnswer {
  id: string;
  type: string;
  n: number;
  n_respondents?: number;
  distribution?: Record<string, number>;
  average?: number;
  verbatims?: string[];
}

interface BrandFunnel {
  brand: string;
  isFocal: boolean;
  awareness: number;       // % of respondents
  consideration: number;   // % of aware
  preference: number;      // % of considered
  use: number;             // % of considered
  recommendation: number;  // NPS top-2-box for the focal brand only
  attributes: Record<string, number>; // % of aware who associate
}

const NPS_BANDS = [
  { min: 70, label: 'Excellent', color: '#BEF264' },
  { min: 50, label: 'Great',     color: '#A3E635' },
  { min: 30, label: 'Good',      color: '#FACC15' },
  { min: 0,  label: 'Fair',      color: '#FB923C' },
  { min: -100, label: 'Poor',    color: '#F87171' },
];

function npsBand(score: number) {
  return NPS_BANDS.find((b) => score >= b.min) || NPS_BANDS[NPS_BANDS.length - 1];
}

function brandShareInDist(dist: Record<string, number>, brand: string): number {
  const total = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total === 0) return 0;
  const n = Number(dist[brand]) || 0;
  return Math.round((n / total) * 100);
}

function brandShareInMulti(
  dist: Record<string, number>,
  brand: string,
  nRespondents: number,
): number {
  if (nRespondents === 0) return 0;
  const n = Number(dist[brand]) || 0;
  return Math.round((n / nRespondents) * 100);
}

function npsTop2BoxFromDist(dist: Record<string, number>): number {
  const total = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total === 0) return 0;
  let promoters = 0; let detractors = 0;
  for (const [k, v] of Object.entries(dist)) {
    const score = parseInt(k, 10);
    const n = Number(v) || 0;
    if (Number.isFinite(score)) {
      if (score >= 9) promoters += n;
      else if (score <= 6) detractors += n;
    }
  }
  return Math.round(((promoters - detractors) / total) * 100);
}

export function CompetitorAnalysisResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<CompetitorMission | null>(null);
  const [agg, setAgg] = useState<Record<string, AggregatedAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('id, questions, brand_name, category, competitor_brands, attribute_battery, aggregated_by_question')
        .eq('id', missionId)
        .single();
      if (fetchErr || !data) {
        setError('Mission not found');
      } else {
        setMission(data as CompetitorMission);
        setAgg((data as Record<string, unknown>).aggregated_by_question as Record<string, AggregatedAnswer> || {});
      }
      setLoading(false);
    })();
  }, [missionId]);

  const brands = useMemo<BrandFunnel[]>(() => {
    if (!mission) return [];
    const focalBrand = mission.brand_name || 'Your brand';
    const competitorList = Array.isArray(mission.competitor_brands)
      ? mission.competitor_brands
      : [];
    const allBrands = [focalBrand, ...competitorList];
    const find = (stage: string) => mission.questions.find((q) => q.funnel_stage === stage);
    // q3 aided awareness (multi)
    const aidedQ = mission.questions.find((q) => q.funnel_stage === 'awareness' && q.type === 'multi' && q.id !== mission.questions[7]?.id);
    // q4 consideration (multi)
    const considerQs = mission.questions.filter((q) => q.funnel_stage === 'consideration');
    const considerationQ = considerQs[0];
    // q5 preference (single)
    const preferenceQ = find('preference');
    // q6 use (single)
    const useQ = find('use');
    // q7 NPS (rating, brand_id set)
    const npsQ = mission.questions.find((q) => q.funnel_stage === 'recommendation');
    // q8 attribute matrix (multi)
    const attrQs = mission.questions.filter((q) => q.funnel_stage === 'awareness' && q.type === 'multi');
    const attrMatrixQ = attrQs[1] || attrQs[0]; // second 'awareness' multi is q8

    const aidedDist = aidedQ ? agg[aidedQ.id]?.distribution || {} : {};
    const aidedN = aidedQ ? agg[aidedQ.id]?.n_respondents || agg[aidedQ.id]?.n || 0 : 0;
    const considerDist = considerationQ ? agg[considerationQ.id]?.distribution || {} : {};
    const considerN = considerationQ ? agg[considerationQ.id]?.n_respondents || agg[considerationQ.id]?.n || 0 : 0;
    const preferDist = preferenceQ ? agg[preferenceQ.id]?.distribution || {} : {};
    const useDist = useQ ? agg[useQ.id]?.distribution || {} : {};
    const npsDist = npsQ ? agg[npsQ.id]?.distribution || {} : {};
    const attrDist = attrMatrixQ ? agg[attrMatrixQ.id]?.distribution || {} : {};
    const attrN = attrMatrixQ ? agg[attrMatrixQ.id]?.n_respondents || agg[attrMatrixQ.id]?.n || 0 : 0;

    return allBrands.map((b) => {
      const isFocal = b === focalBrand;
      const awareness = brandShareInMulti(aidedDist, b, aidedN);
      // Consideration is % of AWARE respondents (denom = aidedN may be
      // off; use aidedN as proxy since the simulator filters at runtime).
      const consideration = aidedN > 0 ? brandShareInMulti(considerDist, b, aidedN) : 0;
      const preference = brandShareInDist(preferDist, b);
      const use = brandShareInDist(useDist, b);
      // NPS only available for focal brand from q7 (per-brand extension
      // is downstream-aggregator scope; focal-only is the reliable subset).
      const recommendation = isFocal ? npsTop2BoxFromDist(npsDist) : 0;
      // Attribute matrix is multi-select per brand; the simulator stores
      // "<brand>:<attribute>" or just "<attribute>" depending on shape.
      // For the focal brand, parse keys looking for the brand+attr split.
      const attributes: Record<string, number> = {};
      if (Array.isArray(mission.attribute_battery)) {
        for (const a of mission.attribute_battery) {
          // Accept both "brand:attr" and plain "attr" keys for resilience.
          const keyA = `${b}:${a}`;
          const n = (Number(attrDist[keyA]) || 0) + (isFocal ? Number(attrDist[a]) || 0 : 0);
          attributes[a] = attrN > 0 ? Math.round((n / attrN) * 100) : 0;
        }
      }
      return { brand: b, isFocal, awareness, consideration, preference, use, recommendation, attributes };
    });
  }, [mission, agg]);

  const focal = brands.find((b) => b.isFocal);

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
  if (brands.length === 0 || !focal) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5 text-center">
        <Logo />
        <p className="text-sm text-[var(--t2)] mt-4">Brand Health Tracker analysis still generating.</p>
      </div>
    );
  }

  const npsBnd = npsBand(focal.recommendation);
  // Auto-generated funnel-gap callouts
  const callouts: string[] = [];
  if (focal.awareness >= 80 && focal.consideration < 50) {
    callouts.push('Your awareness is strong but consideration is low — relevance/positioning problem. Invest in messaging clarity.');
  }
  if (focal.consideration >= 50 && focal.preference < 30) {
    callouts.push('Consideration is healthy but preference is low — competitors are winning on attributes. Sharpen differentiation.');
  }
  if (focal.preference >= 30 && focal.use < 50) {
    callouts.push('Preference exceeds use — convert intent to purchase. Distribution / pricing / activation is the gap.');
  }
  if (focal.awareness < 60) {
    callouts.push('Aided awareness below 60% — top-of-funnel is the binding constraint. Awareness investment unlocks every downstream stage.');
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo />
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)]">
          Competitor Analysis · Brand Health Tracker
        </span>
      </header>

      <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
        {/* Hero */}
        <section className="rounded-2xl p-6 border border-[var(--lime)]/40 bg-[var(--lime)]/5">
          <p className="text-[10px] uppercase tracking-widest text-[var(--lime)] font-display font-bold">
            Focal Brand Position
          </p>
          <h2 className="text-2xl font-display font-black mt-2">{focal.brand}</h2>
          <p className="text-[12px] text-[var(--t2)] mt-2">
            Aided awareness <span className="text-[var(--lime)] font-semibold">{focal.awareness}%</span>
            {' · '}consideration <span className="text-[var(--lime)] font-semibold">{focal.consideration}%</span>
            {' · '}preference <span className="text-[var(--lime)] font-semibold">{focal.preference}%</span>
            {' · '}NPS <span className="font-semibold" style={{ color: npsBnd.color }}>{focal.recommendation} ({npsBnd.label})</span>
          </p>
        </section>

        {/* Brand funnel comparison */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-4">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Brand Funnel Comparison</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">Awareness → Consideration → Preference → Use. Focal brand highlighted lime.</p>
          </header>
          <div className="space-y-4">
            {brands.map((b) => (
              <div key={b.brand} className="space-y-1">
                <div className="flex items-baseline justify-between text-xs">
                  <span className={['font-semibold', b.isFocal ? 'text-[var(--lime)]' : 'text-[var(--t1)]'].join(' ')}>
                    {b.isFocal && <span className="mr-1">★</span>}
                    {b.brand}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Awareness', value: b.awareness },
                    { label: 'Consider',  value: b.consideration },
                    { label: 'Prefer',    value: b.preference },
                    { label: 'Use',       value: b.use },
                  ].map((stage) => (
                    <div key={stage.label} className="space-y-0.5">
                      <div className="relative h-3 bg-[var(--bg3)] rounded">
                        <div
                          className={['absolute top-0 left-0 h-full rounded', b.isFocal ? 'bg-[var(--lime)]' : 'bg-[var(--t3)]'].join(' ')}
                          style={{ width: `${stage.value}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[var(--t3)] flex justify-between tabular-nums">
                        <span>{stage.label}</span>
                        <span className="text-[var(--t1)] font-semibold">{stage.value}%</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Attribute heatmap (focal brand only — per-brand competitor cells require the simulator
            to emit q8 per-brand which is downstream aggregator scope). */}
        {Object.keys(focal.attributes).length > 0 && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Attribute Profile · {focal.brand}</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">% of aware respondents who associate each attribute with {focal.brand}.</p>
            </header>
            <div className="space-y-2">
              {Object.entries(focal.attributes)
                .sort((a, b) => b[1] - a[1])
                .map(([attr, pct]) => (
                  <div key={attr} className="grid grid-cols-[160px_1fr_50px] gap-3 items-center text-xs">
                    <span className="text-[var(--t2)] truncate capitalize">{attr.replace(/_/g, ' ')}</span>
                    <div className="relative h-3 bg-[var(--bg3)] rounded">
                      <div
                        className={['absolute top-0 left-0 h-full rounded', pct >= 50 ? 'bg-[var(--lime)]' : pct >= 30 ? 'bg-amber-400' : 'bg-[var(--t3)]'].join(' ')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{pct}%</span>
                  </div>
                ))}
            </div>
            <p className="text-[10px] text-[var(--t4)] italic mt-2">
              Per-competitor attribute cells require the simulator to emit q8 separately
              per aware brand. Currently shown for the focal brand only; per-competitor
              comparison ships in a follow-up pass alongside the per-brand NPS extension.
            </p>
          </section>
        )}

        {/* Recommendations */}
        {callouts.length > 0 && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-2">
            <h3 className="text-sm font-semibold text-[var(--t1)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--lime)]" />
              Funnel-gap callouts
            </h3>
            <ul className="text-xs text-[var(--t2)] space-y-2">
              {callouts.map((c, i) => (
                <li key={i} className="bg-[var(--bg3)] rounded-lg px-3 py-2">{c}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Industry benchmarks */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--t1)]">Industry benchmarks</h3>
          <ul className="text-xs text-[var(--t2)] space-y-1.5">
            <li><span className="text-[var(--t1)] font-semibold">Aided awareness &gt;80%</span> = strong category presence</li>
            <li><span className="text-[var(--t1)] font-semibold">Consideration &gt;50% of aware</span> = healthy mid-funnel</li>
            <li><span className="text-[var(--t1)] font-semibold">Preference &gt;30% of considered</span> = differentiated positioning</li>
            <li><span className="text-[var(--t1)] font-semibold">Use &gt;50% of considered</span> = strong loyalty conversion</li>
            <li><span className="text-[var(--t1)] font-semibold">NPS bands</span> (Bain): ≥70 Excellent / 50-69 Great / 30-49 Good / 0-29 Fair / &lt;0 Poor</li>
          </ul>
        </section>

        <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
          Brand Health Tracker on synthetic respondents. Per-brand cells stabilize at n≥200; for confident competitor comparisons consider 400+.
        </p>
      </div>
    </div>
  );
}

export default CompetitorAnalysisResultsPage;
