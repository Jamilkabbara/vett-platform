import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';

/**
 * Pass 30 B2 — Validate Product results page (concept test).
 *
 * Routed via ResultsRouter when goal_type === 'validate'. Reads:
 *   mission.questions             — the 9-10 concept_test instrument
 *   mission.aggregated_by_question
 *   mission.concept_description / concept_media_url / concept_price_usd
 *
 * Renders:
 *   - Hero: top-2-box appeal + intent + recommendation
 *   - Concept media preview
 *   - Per-attribute bars (reaction / relevance / uniqueness /
 *     believability) with benchmark callouts
 *   - Purchase intent funnel
 *   - Word association cloud (open-text themes)
 *   - Concerns themes
 *   - Target audience themes
 *   - Price fairness bar (if price was tested)
 */

interface ValidateMission {
  id: string;
  questions: ValidateQuestion[];
  concept_description?: string;
  concept_media_url?: string;
  concept_media_type?: string;
  concept_price_usd?: number | null;
  brand_name?: string;
  category?: string;
}

interface ValidateQuestion {
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

const APPEAL_BANDS: BandSpec[] = [
  { threshold: 60, label: 'Strong appeal',   color: '#BEF264' },
  { threshold: 40, label: 'Moderate appeal', color: '#FACC15' },
  { threshold: 0,  label: 'Weak appeal',     color: '#F87171' },
];

const INTENT_BANDS: BandSpec[] = [
  { threshold: 60, label: 'Launch-ready',           color: '#BEF264' },
  { threshold: 40, label: 'Iterate before launch',  color: '#FACC15' },
  { threshold: 0,  label: 'Reconsider',             color: '#F87171' },
];

function bandOf(score: number, bands: BandSpec[]): BandSpec {
  return bands.find((b) => score >= b.threshold) || bands[bands.length - 1];
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

function intentTopTwoBox(dist: Record<string, number>): number {
  const total = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total === 0) return 0;
  const top = (Number(dist['Definitely would buy']) || 0)
    + (Number(dist['Probably would buy']) || 0);
  return Math.round((top / total) * 100);
}

export function ValidateResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<ValidateMission | null>(null);
  const [agg, setAgg] = useState<Record<string, AggregatedAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('id, questions, brand_name, category, concept_description, concept_media_url, concept_media_type, concept_price_usd, aggregated_by_question')
        .eq('id', missionId)
        .single();
      if (fetchErr || !data) {
        setError('Mission not found');
      } else {
        setMission(data as ValidateMission);
        setAgg((data as Record<string, unknown>).aggregated_by_question as Record<string, AggregatedAnswer> || {});
      }
      setLoading(false);
    })();
  }, [missionId]);

  const scores = useMemo(() => {
    if (!mission) return null;
    const find = (stage: string) =>
      mission.questions.find((q) => q.funnel_stage === stage);
    const reactionQ = find('reaction');
    const relevanceQ = find('relevance');
    const uniquenessQ = find('uniqueness');
    const believabilityQ = find('believability');
    const intentQ = find('intent');
    const priceQ = find('price_fairness');

    const reactionDist = reactionQ ? agg[reactionQ.id]?.distribution || {} : {};
    const relevanceDist = relevanceQ ? agg[relevanceQ.id]?.distribution || {} : {};
    const uniquenessDist = uniquenessQ ? agg[uniquenessQ.id]?.distribution || {} : {};
    const believabilityDist = believabilityQ ? agg[believabilityQ.id]?.distribution || {} : {};
    const intentDist = intentQ ? agg[intentQ.id]?.distribution || {} : {};
    const priceDist = priceQ ? agg[priceQ.id]?.distribution || {} : {};

    return {
      appeal: topTwoBoxRating(reactionDist, 10),  // scaleMax=10 → top-2 = 9 + 10
      relevance: topTwoBoxRating(relevanceDist, 7),
      uniqueness: topTwoBoxRating(uniquenessDist, 7),
      believability: topTwoBoxRating(believabilityDist, 7),
      intent: intentTopTwoBox(intentDist),
      intentDist,
      priceDist,
      priceN: priceQ ? agg[priceQ.id]?.n || 0 : 0,
    };
  }, [mission, agg]);

  const themes = useMemo(() => {
    if (!mission) return { wordAssoc: [], concerns: [], audience: [] };
    const findVerbatims = (stage: string, idx: number) => {
      const stageQs = mission.questions.filter((q) => q.funnel_stage === stage);
      const q = stageQs[idx];
      return q ? (agg[q.id]?.verbatims || []) : [];
    };
    return {
      wordAssoc: findVerbatims('qualitative', 0),
      concerns: findVerbatims('qualitative', 1),
      audience: findVerbatims('qualitative', 2),
    };
  }, [mission, agg]);

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
  if (!scores || (scores.appeal === 0 && scores.intent === 0 && scores.relevance === 0)) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5 text-center">
        <Logo />
        <p className="text-sm text-[var(--t2)] mt-4">Concept test analysis still generating.</p>
      </div>
    );
  }

  const appealBand = bandOf(scores.appeal, APPEAL_BANDS);
  const intentBand = bandOf(scores.intent, INTENT_BANDS);

  // Recommendation
  let recommendation: { icon: string; label: string; detail: string };
  if (scores.intent >= 60 && scores.appeal >= 50) {
    recommendation = {
      icon: '🟢',
      label: 'Launch-ready',
      detail: 'Top-2 box intent ≥60% AND appeal ≥50%. Concept clears the launch threshold.',
    };
  } else if (scores.intent >= 40) {
    recommendation = {
      icon: '🟡',
      label: 'Iterate',
      detail: 'Concept has potential. Address the top concerns and retest.',
    };
  } else {
    recommendation = {
      icon: '🔴',
      label: 'Reconsider',
      detail: 'Low intent suggests major rework needed before launch.',
    };
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo />
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)]">
          Validate Product · Concept Test
        </span>
      </header>

      <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
        {/* Hero scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl p-5 border bg-[var(--bg2)]" style={{ borderColor: appealBand.color + '88' }}>
            <p className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">Appeal</p>
            <p className="text-4xl font-display font-black mt-1 tabular-nums" style={{ color: appealBand.color }}>{scores.appeal}%</p>
            <p className="text-[11px] mt-1 font-semibold" style={{ color: appealBand.color }}>{appealBand.label}</p>
            <p className="text-[10px] text-[var(--t3)] mt-1">Top-2 box on 1-10 scale</p>
          </div>
          <div className="rounded-2xl p-5 border bg-[var(--bg2)]" style={{ borderColor: intentBand.color + '88' }}>
            <p className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">Purchase Intent</p>
            <p className="text-4xl font-display font-black mt-1 tabular-nums" style={{ color: intentBand.color }}>{scores.intent}%</p>
            <p className="text-[11px] mt-1 font-semibold" style={{ color: intentBand.color }}>{intentBand.label}</p>
            <p className="text-[10px] text-[var(--t3)] mt-1">Definitely + probably would buy</p>
          </div>
          <div className="rounded-2xl p-5 border border-[var(--lime)]/40 bg-[var(--lime)]/5">
            <p className="text-[10px] uppercase tracking-widest text-[var(--lime)] font-display font-bold">Recommendation</p>
            <p className="text-2xl font-display font-black mt-1">
              {recommendation.icon} {recommendation.label}
            </p>
            <p className="text-[11px] text-[var(--t2)] mt-2">{recommendation.detail}</p>
          </div>
        </div>

        {/* Concept preview */}
        {mission && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--t1)]">Concept Tested</h3>
            {mission.concept_media_url && mission.concept_media_type === 'image' && (
              <img src={mission.concept_media_url} alt="" className="max-h-64 rounded-xl mx-auto" />
            )}
            {mission.concept_media_url && mission.concept_media_type === 'video' && (
              <video src={mission.concept_media_url} controls className="max-h-64 rounded-xl w-full" />
            )}
            <p className="text-xs text-[var(--t2)] italic">
              {mission.concept_description}
            </p>
            {mission.concept_price_usd != null && (
              <p className="text-[11px] text-[var(--t3)]">
                Tested at <span className="text-[var(--t1)] font-semibold">${mission.concept_price_usd}</span>
              </p>
            )}
          </section>
        )}

        {/* Attribute bars */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Attribute Diagnostics</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">Top-2 box on 1-7 scales (relevance / uniqueness / believability) and 1-10 scale (reaction).</p>
          </header>
          {[
            { label: 'Reaction (appeal)',     score: scores.appeal,        bench: 50, hint: 'Strong: ≥50% top-2 box on 1-10' },
            { label: 'Relevance to needs',    score: scores.relevance,     bench: 50, hint: 'Strong: ≥50% top-2 box' },
            { label: 'Uniqueness',            score: scores.uniqueness,    bench: 40, hint: 'Differentiated: ≥40% top-2 box' },
            { label: 'Believability',         score: scores.believability, bench: 60, hint: 'Strong: ≥60% top-2 box' },
          ].map((r) => (
            <div key={r.label} className="grid grid-cols-[160px_1fr_70px] gap-3 items-center text-xs">
              <span className="text-[var(--t2)] truncate" title={r.hint}>{r.label}</span>
              <div className="relative h-4 bg-[var(--bg3)] rounded">
                <div
                  className={[
                    'absolute top-0 left-0 h-full rounded',
                    r.score >= r.bench ? 'bg-[var(--lime)]'
                      : r.score >= r.bench * 0.7 ? 'bg-amber-400'
                      : 'bg-red-400',
                  ].join(' ')}
                  style={{ width: `${Math.max(0, Math.min(100, r.score))}%` }}
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

        {/* Purchase intent funnel */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Purchase Intent Distribution</h3>
          </header>
          {(['Definitely would buy', 'Probably would buy', 'Might or might not', 'Probably would NOT buy', 'Definitely would NOT buy'] as const).map((label) => {
            const total = Object.values(scores.intentDist).reduce((s, v) => s + (Number(v) || 0), 0);
            const n = Number(scores.intentDist[label]) || 0;
            const pct = total > 0 ? (n / total) * 100 : 0;
            const isPositive = label.startsWith('Definitely would buy') || label.startsWith('Probably would buy');
            const isNegative = label.includes('NOT');
            return (
              <div key={label} className="grid grid-cols-[200px_1fr_50px] gap-3 items-center text-xs">
                <span className="text-[var(--t2)] truncate">{label}</span>
                <div className="relative h-4 bg-[var(--bg3)] rounded">
                  <div
                    className={[
                      'absolute top-0 left-0 h-full rounded',
                      isPositive ? 'bg-[var(--lime)]'
                        : isNegative ? 'bg-red-400'
                        : 'bg-amber-400',
                    ].join(' ')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </section>

        {/* Verbatim themes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ThemeCard title="Word association" verbatims={themes.wordAssoc} />
          <ThemeCard title="Top concerns" verbatims={themes.concerns} />
          <ThemeCard title="Who it's for" verbatims={themes.audience} />
        </div>

        {/* Price fairness */}
        {mission?.concept_price_usd != null && Object.keys(scores.priceDist).length > 0 && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">
                Price Fairness · ${mission.concept_price_usd}
              </h3>
            </header>
            {(['Too low', 'Fair', 'Too high'] as const).map((label) => {
              const n = Number(scores.priceDist[label]) || 0;
              const pct = scores.priceN > 0 ? (n / scores.priceN) * 100 : 0;
              return (
                <div key={label} className="grid grid-cols-[100px_1fr_50px] gap-3 items-center text-xs">
                  <span className="text-[var(--t2)]">{label}</span>
                  <div className="relative h-4 bg-[var(--bg3)] rounded">
                    <div
                      className={[
                        'absolute top-0 left-0 h-full rounded',
                        label === 'Fair' ? 'bg-[var(--lime)]' : 'bg-amber-400',
                      ].join(' ')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </section>
        )}

        {/* Industry benchmarks */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--t1)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--lime)]" />
            Industry benchmarks
          </h3>
          <ul className="text-xs text-[var(--t2)] space-y-1.5">
            <li>
              <span className="text-[var(--t1)] font-semibold">Top-2 box appeal ≥40%</span> = strong concept signal
            </li>
            <li>
              <span className="text-[var(--t1)] font-semibold">Top-2 box purchase intent ≥60%</span> = launch-ready
            </li>
            <li>
              <span className="text-[var(--t1)] font-semibold">≥50% relevance + ≥40% uniqueness</span> = differentiated and resonant
            </li>
            <li>
              <span className="text-[var(--t1)] font-semibold">Believability ≥60%</span> = claims land credibly; lower means messaging needs work
            </li>
          </ul>
        </section>

        <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
          Concept test on synthetic respondents calibrated to the audience spec. Use as directional pre-launch signal; for high-stakes decisions, validate with real-customer panels.
        </p>
      </div>
    </div>
  );
}

function ThemeCard({ title, verbatims }: { title: string; verbatims: string[] }) {
  return (
    <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-4 space-y-2">
      <h4 className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">{title}</h4>
      {verbatims.length === 0 ? (
        <p className="text-[11px] text-[var(--t4)] italic">No responses yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {verbatims.slice(0, 6).map((v, i) => (
            <li key={i} className="text-[11px] text-[var(--t2)] bg-[var(--bg3)] rounded-lg px-2 py-1.5">
              &ldquo;{v}&rdquo;
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ValidateResultsPage;
