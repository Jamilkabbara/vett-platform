import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';

/**
 * Pass 29 B7 — Feature Roadmap results page.
 *
 * Routed via ResultsRouter when goal_type === 'roadmap'. Reads:
 *   mission.questions             — the screener + 12 MaxDiff sets +
 *                                    Kano pairs from Pass 29 B6 generator
 *   mission.aggregated_by_question — per-Q distributions
 *   mission.roadmap_features      — the input feature list (id, name)
 *
 * Computes:
 *   - MaxDiff utility per feature: count_best - count_worst
 *     normalized 0-100. 95% confidence band derived from binomial
 *     stderr on the best/worst ratio.
 *   - Kano classification per feature using the Kano matrix on the
 *     functional/dysfunctional pair.
 *
 * Renders:
 *   1. Hero: top 3 to build first
 *   2. MaxDiff utility bars (sorted, 95% CI brackets)
 *   3. Kano 2D quadrant (functional X, dysfunctional Y) with feature
 *      labels, quadrant region labels
 *   4. Combined recommendation table
 *   5. Industry benchmark callouts
 */

interface RoadmapMission {
  id: string;
  questions: RoadmapQuestion[];
  roadmap_features?: Array<{ id: string; name: string; description?: string }>;
  brand_name?: string;
}

interface RoadmapQuestion {
  id: string;
  text: string;
  type: string;
  methodology?: 'screener' | 'max_diff' | 'kano';
  feature_set?: string[];
  feature_id?: string;
  kano_type?: 'functional' | 'dysfunctional';
  options?: string[];
}

interface AggregatedAnswer {
  id: string;
  type: string;
  n: number;
  distribution?: Record<string, number>;
}

type KanoCategory =
  | 'must_have'
  | 'performance'
  | 'delighter'
  | 'indifferent'
  | 'reverse'
  | 'questionable';

interface UtilityRow {
  featureId: string;
  name: string;
  utility: number;       // normalized 0-100
  bestPct: number;
  worstPct: number;
  ci: number;            // half-width of 95% CI on utility
  appearedIn: number;    // how many MaxDiff sets the feature was in
  rank: number;
}

interface KanoRow {
  featureId: string;
  name: string;
  // Functional response shares (5 options).
  functional: Record<string, number>;
  dysfunctional: Record<string, number>;
  category: KanoCategory;
  confidence: number; // 0-100, top-category share
}

const KANO_OPTIONS = [
  'I like it',
  'I expect it',
  'Neutral',
  'I can live with it',
  'I dislike it',
] as const;

// Standard Kano matrix on (functional answer, dysfunctional answer)
// → category. Uses the Kano evaluation rubric from CQM literature.
const KANO_MATRIX: Record<string, KanoCategory> = {
  // Functional × Dysfunctional pair → category
  'I like it|I dislike it':              'performance',
  'I like it|I can live with it':        'delighter',
  'I like it|Neutral':                   'delighter',
  'I like it|I expect it':               'delighter',
  'I like it|I like it':                 'questionable',
  'I expect it|I dislike it':            'must_have',
  'I expect it|I can live with it':      'indifferent',
  'I expect it|Neutral':                 'indifferent',
  'I expect it|I expect it':             'indifferent',
  'I expect it|I like it':               'reverse',
  'Neutral|I dislike it':                'must_have',
  'Neutral|I can live with it':          'indifferent',
  'Neutral|Neutral':                     'indifferent',
  'Neutral|I expect it':                 'indifferent',
  'Neutral|I like it':                   'reverse',
  'I can live with it|I dislike it':     'must_have',
  'I can live with it|I can live with it':'indifferent',
  'I can live with it|Neutral':          'indifferent',
  'I can live with it|I expect it':      'indifferent',
  'I can live with it|I like it':        'reverse',
  'I dislike it|I dislike it':           'questionable',
  'I dislike it|I can live with it':     'reverse',
  'I dislike it|Neutral':                'reverse',
  'I dislike it|I expect it':            'reverse',
  'I dislike it|I like it':              'reverse',
};

const KANO_LABEL: Record<KanoCategory, string> = {
  must_have:    'Must-Have',
  performance:  'Performance',
  delighter:    'Delighter',
  indifferent:  'Indifferent',
  reverse:      'Reverse',
  questionable: 'Questionable',
};

const KANO_COLOR: Record<KanoCategory, string> = {
  must_have:    '#F87171',
  performance:  '#BEF264',
  delighter:    '#6366F1',
  indifferent:  '#6B7280',
  reverse:      '#FB923C',
  questionable: '#9CA3AF',
};

function computeUtility(
  mission: RoadmapMission,
  agg: Record<string, AggregatedAnswer>,
): UtilityRow[] {
  const features = mission.roadmap_features || [];
  if (features.length === 0) return [];

  const counts: Record<string, { best: number; worst: number; appeared: number }> = {};
  for (const f of features) counts[f.id] = { best: 0, worst: 0, appeared: 0 };

  const maxDiffs = mission.questions.filter((q) => q.methodology === 'max_diff');
  let totalRespondentChoices = 0;
  for (const q of maxDiffs) {
    const dist = agg[q.id]?.distribution || {};
    const set = q.feature_set || [];
    for (const fid of set) counts[fid] = counts[fid] || { best: 0, worst: 0, appeared: 0 };
    for (const fid of set) counts[fid].appeared += 1;

    // Distribution keys for MaxDiff sets are the feature names; the
    // simulator stores best/worst as separate "best:<name>" / "worst:<name>"
    // entries OR as plain feature names with the simulator picking both.
    // To keep this resilient we accept either form: a key shaped
    // "best:<feature>" => best, "worst:<feature>" => worst, plain
    // <feature> name with respondent count => count toward best (the
    // dominant interpretation).
    for (const [key, n] of Object.entries(dist)) {
      const num = Number(n) || 0;
      if (key.startsWith('best:')) {
        const name = key.slice(5);
        const f = features.find((x) => x.name === name);
        if (f) counts[f.id].best += num;
      } else if (key.startsWith('worst:')) {
        const name = key.slice(6);
        const f = features.find((x) => x.name === name);
        if (f) counts[f.id].worst += num;
      } else {
        // Plain key — interpret as best vote (single-pick fallback).
        const f = features.find((x) => x.name === key);
        if (f) counts[f.id].best += num;
      }
      totalRespondentChoices += num;
    }
  }

  // Utility = (best - worst) / totalChoicesForFeature, normalized to
  // 0-100 across the feature set. Clamp to [0, 100].
  const rawScores = features.map((f) => {
    const c = counts[f.id];
    const denom = Math.max(1, c.best + c.worst);
    return { id: f.id, raw: (c.best - c.worst) / denom, c };
  });
  const minRaw = Math.min(...rawScores.map((x) => x.raw));
  const maxRaw = Math.max(...rawScores.map((x) => x.raw));
  const span = maxRaw - minRaw || 1;

  const rows: UtilityRow[] = rawScores
    .map((r) => {
      const utility = ((r.raw - minRaw) / span) * 100;
      const denom = Math.max(1, r.c.best + r.c.worst);
      const p = r.c.best / denom;
      // Binomial standard error on the best/worst ratio mapped to a
      // utility CI half-width. 1.96 = 95% z. Min n=10 to avoid massive
      // bands at low coverage.
      const stderr = Math.sqrt((p * (1 - p)) / Math.max(10, denom));
      return {
        featureId: r.id,
        name: features.find((f) => f.id === r.id)?.name || r.id,
        utility: Math.round(utility * 10) / 10,
        bestPct: Math.round((r.c.best / Math.max(1, totalRespondentChoices)) * 1000) / 10,
        worstPct: Math.round((r.c.worst / Math.max(1, totalRespondentChoices)) * 1000) / 10,
        ci: Math.round(1.96 * stderr * 100 * 10) / 10,
        appearedIn: r.c.appeared,
        rank: 0,
      };
    })
    .sort((a, b) => b.utility - a.utility)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  return rows;
}

function classifyKano(
  mission: RoadmapMission,
  agg: Record<string, AggregatedAnswer>,
): KanoRow[] {
  const features = mission.roadmap_features || [];
  const kanoQs = mission.questions.filter((q) => q.methodology === 'kano');
  const byFeature: Record<string, { functional?: Record<string, number>; dysfunctional?: Record<string, number> }> = {};

  for (const q of kanoQs) {
    if (!q.feature_id || !q.kano_type) continue;
    const dist = agg[q.id]?.distribution || {};
    byFeature[q.feature_id] = byFeature[q.feature_id] || {};
    byFeature[q.feature_id][q.kano_type] = dist;
  }

  const rows: KanoRow[] = [];
  for (const [fid, pair] of Object.entries(byFeature)) {
    const f = features.find((x) => x.id === fid);
    if (!f || !pair.functional || !pair.dysfunctional) continue;
    // Per-respondent classification: pick the modal func + dysfunc
    // answers from the distribution. (A more rigorous approach would
    // pair on a per-respondent basis using the response rows; that
    // requires the responses array which the page doesn't fetch.
    // Modal-pair classification is the standard simplification when
    // only aggregates are available — see Lee & Newcomb 1997.)
    const funcTop = topOption(pair.functional);
    const dysTop = topOption(pair.dysfunctional);
    const key = `${funcTop.option}|${dysTop.option}`;
    const category = KANO_MATRIX[key] || 'indifferent';
    const total = Object.values(pair.functional).reduce((s, n) => s + (Number(n) || 0), 0);
    const confidence = total > 0
      ? Math.round((funcTop.count / total) * 100)
      : 0;
    rows.push({
      featureId: fid,
      name: f.name,
      functional: pair.functional,
      dysfunctional: pair.dysfunctional,
      category,
      confidence,
    });
  }
  return rows;
}

function topOption(dist: Record<string, number>): { option: string; count: number } {
  let topOpt = '';
  let topN = -1;
  for (const [opt, n] of Object.entries(dist)) {
    if ((Number(n) || 0) > topN) { topOpt = opt; topN = Number(n) || 0; }
  }
  return { option: topOpt, count: topN < 0 ? 0 : topN };
}

export function RoadmapResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<RoadmapMission | null>(null);
  const [agg, setAgg] = useState<Record<string, AggregatedAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('id, questions, roadmap_features, brand_name, aggregated_by_question')
        .eq('id', missionId)
        .single();
      if (fetchErr || !data) {
        setError('Mission not found');
      } else {
        setMission(data as RoadmapMission);
        setAgg((data as Record<string, unknown>).aggregated_by_question as Record<string, AggregatedAnswer> || {});
      }
      setLoading(false);
    })();
  }, [missionId]);

  const utility = useMemo(() => mission ? computeUtility(mission, agg) : [], [mission, agg]);
  const kano = useMemo(() => mission ? classifyKano(mission, agg) : [], [mission, agg]);

  const top3 = utility.slice(0, 3);

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

  if (utility.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5 text-center">
        <Logo />
        <p className="text-sm text-[var(--t2)] mt-4">Roadmap analysis still generating.</p>
        <p className="text-xs text-[var(--t3)] max-w-md">
          MaxDiff utilities + Kano classification render here once the simulator finishes.
        </p>
      </div>
    );
  }

  const kanoByFeature = new Map(kano.map((k) => [k.featureId, k]));
  const recommendations = utility.map((u) => {
    const k = kanoByFeature.get(u.featureId);
    return { ...u, kano: k };
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo />
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)]">
          Feature Roadmap · MaxDiff + Kano
        </span>
      </header>

      <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
        {/* Hero — top 3 to build */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--t1)]">
            Top 3 to build first
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {top3.map((u) => {
              const k = kanoByFeature.get(u.featureId);
              return (
                <div
                  key={u.featureId}
                  className="rounded-xl border border-[var(--lime)]/40 bg-[var(--lime)]/5 p-4"
                >
                  <p className="text-[10px] uppercase tracking-widest text-[var(--lime)] font-display font-bold">
                    Rank #{u.rank}
                  </p>
                  <p className="text-base font-display font-bold text-white mt-1">
                    {u.name}
                  </p>
                  <p className="text-[11px] text-[var(--t2)] mt-2">
                    Utility {u.utility.toFixed(1)}
                    {u.ci > 0 && ` ± ${u.ci.toFixed(1)}`}
                    {k && (
                      <>
                        {' · '}
                        <span style={{ color: KANO_COLOR[k.category] }}>{KANO_LABEL[k.category]}</span>
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* MaxDiff utility bars */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">MaxDiff Utility</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">
              Normalized 0-100 best-worst preference. Bars sorted by utility; brackets are 95% confidence intervals.
            </p>
          </header>
          <div className="space-y-2">
            {utility.map((u) => (
              <div key={u.featureId} className="grid grid-cols-[180px_1fr_70px] gap-3 items-center text-xs">
                <span className="text-[var(--t2)] truncate" title={u.name}>{u.name}</span>
                <div className="relative h-5 bg-[var(--bg3)] rounded">
                  <div
                    className={[
                      'absolute top-0 left-0 h-full rounded',
                      u.utility >= 65 ? 'bg-[var(--lime)]'
                        : u.utility >= 35 ? 'bg-amber-400'
                        : 'bg-[var(--t3)]',
                    ].join(' ')}
                    style={{ width: `${Math.max(0, Math.min(100, u.utility))}%` }}
                  />
                  {/* CI bracket */}
                  {u.ci > 0 && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 h-3 border-l border-r border-[var(--t3)]"
                      style={{
                        left: `${Math.max(0, u.utility - u.ci)}%`,
                        width: `${u.ci * 2}%`,
                      }}
                    />
                  )}
                </div>
                <span className="text-right tabular-nums text-[var(--t1)] font-semibold">
                  {u.utility.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Kano 2D quadrant */}
        {kano.length > 0 && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Kano Classification</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">
                Functional response (X) vs Dysfunctional response (Y). Top-5 features by MaxDiff utility.
              </p>
            </header>
            <KanoQuadrant rows={kano} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 text-[11px]">
              {(['must_have', 'performance', 'delighter', 'indifferent', 'reverse', 'questionable'] as KanoCategory[])
                .map((cat) => (
                  <span key={cat} className="inline-flex items-center gap-1.5 text-[var(--t3)]">
                    <span className="w-3 h-3 rounded-sm" style={{ background: KANO_COLOR[cat] }} aria-hidden />
                    {KANO_LABEL[cat]}
                  </span>
                ))}
            </div>
          </section>
        )}

        {/* Combined recommendation table */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Build Recommendation</h3>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--t3)] border-b border-[var(--b1)]">
                  <th className="text-left py-2 font-medium">Feature</th>
                  <th className="text-right py-2 font-medium">Utility</th>
                  <th className="text-right py-2 font-medium">Rank</th>
                  <th className="text-left py-2 font-medium">Kano</th>
                  <th className="text-left py-2 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((r) => {
                  const cat = r.kano?.category;
                  let rec = '🟢 Build';
                  if (r.utility < 15 && (cat === 'indifferent' || cat === 'questionable' || !cat)) {
                    rec = '⏸️ Deprioritize';
                  } else if (cat === 'must_have') {
                    rec = '🔴 Build first — risky to ship without';
                  } else if (cat === 'delighter') {
                    rec = '🟢 Build for differentiation';
                  } else if (cat === 'reverse') {
                    rec = '⚠️ Cut — users prefer this NOT to exist';
                  } else if (r.rank <= 5) {
                    rec = '🟢 Build first';
                  }
                  return (
                    <tr key={r.featureId} className="border-b border-[var(--b1)]/40">
                      <td className="py-2 text-[var(--t1)]">{r.name}</td>
                      <td className="py-2 text-right tabular-nums">{r.utility.toFixed(1)}</td>
                      <td className="py-2 text-right tabular-nums">#{r.rank}</td>
                      <td className="py-2">
                        {cat ? (
                          <span style={{ color: KANO_COLOR[cat] }}>{KANO_LABEL[cat]}</span>
                        ) : (
                          <span className="text-[var(--t4)]">—</span>
                        )}
                      </td>
                      <td className="py-2 text-[var(--t2)]">{rec}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Industry benchmarks */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--t1)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--lime)]" />
            Industry benchmark callouts
          </h3>
          <ul className="text-xs text-[var(--t2)] space-y-1.5">
            <li>
              <span className="text-[var(--t1)] font-semibold">Utility &gt; 65</span> = strongly preferred. <span className="text-[var(--t1)] font-semibold">&gt; 80</span> = clear winner.
            </li>
            <li>
              <span className="text-[var(--t1)] font-semibold">Utility &lt; 15</span> = noise; usually safe to deprioritize.
            </li>
            <li>
              <span className="text-[var(--t1)] font-semibold">Must-Have features can have low utility</span> but presence is mandatory — users assume they&apos;re there.
            </li>
            <li>
              <span className="text-[var(--t1)] font-semibold">Delighters skew utility high but not extreme</span> — ship as differentiation, but don&apos;t treat them as table stakes.
            </li>
          </ul>
        </section>

        <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
          MaxDiff + Kano on synthetic respondents. Use as directional signal for roadmap prioritization; for high-risk launches, validate with real-customer interviews.
        </p>
      </div>
    </div>
  );
}

function KanoQuadrant({ rows }: { rows: KanoRow[] }) {
  const W = 480, H = 360, PAD = 36;
  // Map functional / dysfunctional modal answers to a 0-1 axis.
  // Functional axis: I like it (1) → I dislike it (0).
  // Dysfunctional axis: I dislike it (1) → I like it (0).
  const FUNC_AXIS: Record<string, number> = {
    'I like it': 1, 'I expect it': 0.75, 'Neutral': 0.5,
    'I can live with it': 0.25, 'I dislike it': 0,
  };
  const DYS_AXIS: Record<string, number> = {
    'I dislike it': 1, 'I can live with it': 0.75, 'Neutral': 0.5,
    'I expect it': 0.25, 'I like it': 0,
  };

  const xOf = (v: number) => PAD + v * (W - 2 * PAD);
  const yOf = (v: number) => H - PAD - v * (H - 2 * PAD);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Kano 2D quadrant">
        {/* Quadrant divider lines at axis 0.5 */}
        <line x1={xOf(0.5)} x2={xOf(0.5)} y1={PAD} y2={H - PAD} stroke="#1F2937" strokeWidth={0.5} />
        <line x1={PAD} x2={W - PAD} y1={yOf(0.5)} y2={yOf(0.5)} stroke="#1F2937" strokeWidth={0.5} />
        {/* Quadrant labels */}
        <text x={PAD + 4} y={PAD + 12} fontSize="10" fill={KANO_COLOR.must_have} fontWeight="600">Must-Have</text>
        <text x={W - PAD - 80} y={PAD + 12} fontSize="10" fill={KANO_COLOR.performance} fontWeight="600">Performance</text>
        <text x={W - PAD - 70} y={H - PAD - 6} fontSize="10" fill={KANO_COLOR.delighter} fontWeight="600">Delighter</text>
        <text x={PAD + 4} y={H - PAD - 6} fontSize="10" fill={KANO_COLOR.indifferent} fontWeight="600">Indifferent</text>
        {/* Axis labels */}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#6B7280">
          Functional: dislike → like
        </text>
        <text
          x={12}
          y={H / 2}
          fontSize="10"
          fill="#6B7280"
          transform={`rotate(-90 12 ${H / 2})`}
          textAnchor="middle"
        >
          Dysfunctional: like → dislike
        </text>
        {/* Feature dots */}
        {rows.map((r) => {
          const fx = topOption(r.functional).option;
          const dx = topOption(r.dysfunctional).option;
          const x = xOf(FUNC_AXIS[fx] ?? 0.5);
          const y = yOf(DYS_AXIS[dx] ?? 0.5);
          return (
            <g key={r.featureId}>
              <circle cx={x} cy={y} r={5} fill={KANO_COLOR[r.category]} stroke="#0B0C15" strokeWidth={1} />
              <text x={x + 8} y={y + 3} fontSize="9" fill="#9CA3AF">
                {r.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default RoadmapResultsPage;
