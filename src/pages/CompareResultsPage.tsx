import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';

/**
 * Pass 30 B4 — Compare Concepts results page (sequential monadic).
 *
 * Routed via ResultsRouter when goal_type === 'compare'. Reads:
 *   mission.questions             — 5N+3 sequential monadic Qs
 *   mission.aggregated_by_question
 *   mission.concepts              — input concept list
 *
 * Renders:
 *   - Winner card (highest composite + win rate from forced choice)
 *   - Per-concept score table (appeal / relevance / uniqueness / intent / composite / win rate)
 *   - Attribute heatmap
 *   - Forced-choice bar
 *   - Best/worst themes per concept
 */

interface CompareMission {
  id: string;
  questions: CompareQuestion[];
  concepts?: Array<{ id: string; name: string; description?: string; price_usd?: number }>;
  brand_name?: string;
  category?: string;
}

interface CompareQuestion {
  id: string;
  text: string;
  type: string;
  methodology?: string;
  concept_id?: string;
  is_final_choice?: boolean;
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

interface ConceptScore {
  id: string;
  name: string;
  appeal: number;
  relevance: number;
  uniqueness: number;
  intent: number;
  composite: number;
  winRate: number;
  bestWorst: string[];
}

function topTwoBox(dist: Record<string, number>, scaleMax: number): number {
  const total = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total === 0) return 0;
  let top = 0;
  for (const [k, v] of Object.entries(dist)) {
    const score = parseInt(k, 10);
    if (Number.isFinite(score) && score >= scaleMax - 1) top += Number(v) || 0;
  }
  return Math.round((top / total) * 100);
}

function intentTopTwo(dist: Record<string, number>): number {
  const total = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total === 0) return 0;
  const top = (Number(dist['Definitely would buy']) || 0)
    + (Number(dist['Probably would buy']) || 0);
  return Math.round((top / total) * 100);
}

export function CompareResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<CompareMission | null>(null);
  const [agg, setAgg] = useState<Record<string, AggregatedAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('id, questions, concepts, brand_name, category, aggregated_by_question')
        .eq('id', missionId)
        .single();
      if (fetchErr || !data) {
        setError('Mission not found');
      } else {
        setMission(data as CompareMission);
        setAgg((data as Record<string, unknown>).aggregated_by_question as Record<string, AggregatedAnswer> || {});
      }
      setLoading(false);
    })();
  }, [missionId]);

  const scores: ConceptScore[] = useMemo(() => {
    if (!mission || !mission.concepts) return [];
    const out: ConceptScore[] = [];
    // Forced-choice distribution for win rate
    const finalQ = mission.questions.find((q) => q.is_final_choice);
    const finalDist = finalQ ? agg[finalQ.id]?.distribution || {} : {};
    const finalTotal = Object.values(finalDist).reduce((s, v) => s + (Number(v) || 0), 0);

    for (const c of mission.concepts) {
      const conceptQs = mission.questions.filter((q) => q.concept_id === c.id);
      const findStage = (stage: string) => conceptQs.find((q) => q.funnel_stage === stage);
      const appealQ = findStage('appeal');
      const relevanceQ = findStage('relevance');
      const uniquenessQ = findStage('uniqueness');
      const intentQ = findStage('intent');
      const qualQ = findStage('qualitative');
      const appeal = appealQ ? topTwoBox(agg[appealQ.id]?.distribution || {}, 10) : 0;
      const relevance = relevanceQ ? topTwoBox(agg[relevanceQ.id]?.distribution || {}, 7) : 0;
      const uniqueness = uniquenessQ ? topTwoBox(agg[uniquenessQ.id]?.distribution || {}, 7) : 0;
      const intent = intentQ ? intentTopTwo(agg[intentQ.id]?.distribution || {}) : 0;
      const composite = Math.round((appeal + relevance + uniqueness + intent) / 4);
      const winN = Number(finalDist[c.name]) || 0;
      const winRate = finalTotal > 0 ? Math.round((winN / finalTotal) * 100) : 0;
      const bestWorst = qualQ ? agg[qualQ.id]?.verbatims || [] : [];
      out.push({ id: c.id, name: c.name, appeal, relevance, uniqueness, intent, composite, winRate, bestWorst });
    }
    return out.sort((a, b) => b.composite - a.composite);
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
  if (scores.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5 text-center">
        <Logo />
        <p className="text-sm text-[var(--t2)] mt-4">Compare Concepts analysis still generating.</p>
      </div>
    );
  }

  const winner = scores[0];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo />
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)]">
          Compare Concepts · Sequential Monadic
        </span>
      </header>

      <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
        {/* Winner */}
        <section className="rounded-2xl p-6 border border-[var(--lime)]/40 bg-[var(--lime)]/5 space-y-2">
          <div className="flex items-center gap-2 text-[var(--lime)]">
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-widest font-display font-bold">Winner</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">{winner.name}</h2>
          <div className="flex items-baseline gap-4 text-xs">
            <span className="text-[var(--t2)]">
              Composite <span className="text-[var(--lime)] font-bold tabular-nums">{winner.composite}</span>
            </span>
            <span className="text-[var(--t2)]">
              Win rate <span className="text-[var(--lime)] font-bold tabular-nums">{winner.winRate}%</span>
            </span>
            <span className="text-[var(--t2)]">
              Intent <span className="text-[var(--lime)] font-bold tabular-nums">{winner.intent}%</span>
            </span>
          </div>
        </section>

        {/* Score table */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Per-Concept Scores</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">Top-2 box %; composite is the average of the four metrics. Win rate = forced-choice share.</p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--t3)] border-b border-[var(--b1)]">
                  <th className="text-left py-2 font-medium">Concept</th>
                  <th className="text-right py-2 font-medium">Appeal</th>
                  <th className="text-right py-2 font-medium">Relevance</th>
                  <th className="text-right py-2 font-medium">Uniqueness</th>
                  <th className="text-right py-2 font-medium">Intent</th>
                  <th className="text-right py-2 font-medium">Composite</th>
                  <th className="text-right py-2 font-medium">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr key={s.id} className={[
                    'border-b border-[var(--b1)]/40',
                    i === 0 ? 'bg-[var(--lime)]/5' : '',
                  ].join(' ')}>
                    <td className="py-2 text-[var(--t1)]">
                      {i === 0 && <span className="text-[var(--lime)] mr-1">★</span>}
                      {s.name}
                    </td>
                    <td className="py-2 text-right tabular-nums">{s.appeal}%</td>
                    <td className="py-2 text-right tabular-nums">{s.relevance}%</td>
                    <td className="py-2 text-right tabular-nums">{s.uniqueness}%</td>
                    <td className="py-2 text-right tabular-nums">{s.intent}%</td>
                    <td className="py-2 text-right tabular-nums font-semibold">{s.composite}</td>
                    <td className="py-2 text-right tabular-nums font-semibold" style={{ color: i === 0 ? '#BEF264' : undefined }}>{s.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Forced-choice bar */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Forced Choice</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">"Which concept did you find most appealing overall?"</p>
          </header>
          {scores.map((s, i) => (
            <div key={s.id} className="grid grid-cols-[180px_1fr_50px] gap-3 items-center text-xs">
              <span className="text-[var(--t2)] truncate">{s.name}</span>
              <div className="relative h-4 bg-[var(--bg3)] rounded">
                <div
                  className={['absolute top-0 left-0 h-full rounded', i === 0 ? 'bg-[var(--lime)]' : 'bg-[var(--t3)]'].join(' ')}
                  style={{ width: `${s.winRate}%` }}
                />
              </div>
              <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{s.winRate}%</span>
            </div>
          ))}
        </section>

        {/* Best/worst themes */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Best / Worst Themes</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">Sampled open-text responses per concept.</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scores.map((s) => (
              <div key={s.id} className="space-y-2">
                <h4 className="text-[12px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
                  {s.name}
                </h4>
                {s.bestWorst.length === 0 ? (
                  <p className="text-[11px] text-[var(--t4)] italic">No responses yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {s.bestWorst.slice(0, 4).map((v, i) => (
                      <li key={i} className="text-[11px] text-[var(--t2)] bg-[var(--bg3)] rounded-lg px-2 py-1.5">
                        &ldquo;{v}&rdquo;
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Industry benchmarks */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--t1)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--lime)]" />
            Industry benchmarks
          </h3>
          <ul className="text-xs text-[var(--t2)] space-y-1.5">
            <li><span className="text-[var(--t1)] font-semibold">Top-2 box intent &gt; 60%</span> on a concept = launch-ready</li>
            <li><span className="text-[var(--t1)] font-semibold">Win rate &gt; 55%</span> over alternatives = clear preference</li>
            <li><span className="text-[var(--t1)] font-semibold">45-55% win rate</span> = no clear winner; pick the higher-intent concept and validate with a follow-up monadic</li>
          </ul>
        </section>

        <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
          Sequential monadic on synthetic respondents calibrated to the audience spec. For high-stakes launches, validate against real-customer panels.
        </p>
      </div>
    </div>
  );
}

export default CompareResultsPage;
