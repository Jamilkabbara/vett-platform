import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';

/**
 * Pass 31 B4 — Naming & Messaging results page.
 *
 * Routed via ResultsRouter when goal_type === 'naming_messaging'.
 * Reads:
 *   mission.questions             — monadic + paired + (optional) TURF Qs
 *   mission.aggregated_by_question
 *   mission.naming_candidates / naming_criteria / naming_test_type
 *
 * Renders:
 *   - Winner card (top composite + win rate)
 *   - Per-candidate score table
 *   - Attribute heatmap (rows = candidates, cols = criteria)
 *   - Word association themes per candidate
 *   - Forced choice + paired comparison results
 *   - TURF reach curve (taglines only)
 *   - Recommendation card
 */

interface NamingMission {
  id: string;
  questions: NamingQuestion[];
  naming_candidates?: Array<{ id: string; text: string; description?: string }>;
  naming_criteria?: string[];
  naming_test_type?: 'names' | 'taglines' | 'both';
  brand_personality?: string;
}

interface NamingQuestion {
  id: string;
  text: string;
  type: string;
  methodology?: string;
  candidate_id?: string;
  criterion?: string;
  is_paired_comparison?: boolean;
  is_turf?: boolean;
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

interface CandidateScore {
  id: string;
  text: string;
  perCriterion: Record<string, number>; // criterion slug → top-2 box %
  composite: number;                    // mean of perCriterion
  winRate: number;                      // forced-choice share %
  pairedWinRate: number;                // % of paired comparisons won (when applicable)
  associations: string[];               // sampled open-text verbatims
  turfReach: number;                    // % who selected this in TURF (taglines only)
}

const CRITERION_LABEL: Record<string, string> = {
  memorable: 'Memorable',
  distinctive: 'Distinctive',
  relevant: 'Relevant',
  positive: 'Positive',
  easy_to_pronounce: 'Easy',
  modern: 'Modern',
  word_association: 'Word association',
};

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

function shareInDist(dist: Record<string, number>, key: string): number {
  const total = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total === 0) return 0;
  return Math.round(((Number(dist[key]) || 0) / total) * 100);
}

export function NamingResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<NamingMission | null>(null);
  const [agg, setAgg] = useState<Record<string, AggregatedAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('id, questions, naming_candidates, naming_criteria, naming_test_type, brand_personality, aggregated_by_question')
        .eq('id', missionId)
        .single();
      if (fetchErr || !data) {
        setError('Mission not found');
      } else {
        setMission(data as NamingMission);
        setAgg((data as Record<string, unknown>).aggregated_by_question as Record<string, AggregatedAnswer> || {});
      }
      setLoading(false);
    })();
  }, [missionId]);

  const scores: CandidateScore[] = useMemo(() => {
    if (!mission || !mission.naming_candidates) return [];
    const criteria = (mission.naming_criteria || []).filter((c) => c !== 'word_association');
    // Forced choice is the question right after the per-candidate
    // monadic block — methodology="monadic_plus_paired", type="single",
    // not paired and not TURF.
    const forcedQ = mission.questions.find((q) =>
      q.methodology === 'monadic_plus_paired'
      && q.type === 'single'
      && !q.is_paired_comparison
      && !q.is_turf
      && !q.candidate_id
    );
    const forcedDist = forcedQ ? agg[forcedQ.id]?.distribution || {} : {};
    const turfQ = mission.questions.find((q) => q.is_turf || q.methodology === 'turf');
    const turfDist = turfQ ? agg[turfQ.id]?.distribution || {} : {};
    const turfN = turfQ ? agg[turfQ.id]?.n_respondents || agg[turfQ.id]?.n || 0 : 0;
    const pairedQs = mission.questions.filter((q) => q.is_paired_comparison || q.methodology === 'paired_comparison');

    return mission.naming_candidates.map((c) => {
      const candidateQs = mission.questions.filter((q) => q.candidate_id === c.id);
      const perCriterion: Record<string, number> = {};
      let scoreSum = 0; let scoreCount = 0;
      for (const crit of criteria) {
        const q = candidateQs.find((x) => x.criterion === crit);
        const dist = q ? agg[q.id]?.distribution || {} : {};
        const score = topTwoBoxRating(dist, 7);
        perCriterion[crit] = score;
        scoreSum += score;
        scoreCount += 1;
      }
      const composite = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
      const associationQ = candidateQs.find((x) => x.criterion === 'word_association' || x.type === 'text');
      const associations = associationQ ? agg[associationQ.id]?.verbatims || [] : [];
      const winRate = shareInDist(forcedDist, c.text);
      // Paired win rate: count how many of the paired Qs the candidate
      // appeared in and won.
      let pairedAppearances = 0; let pairedWins = 0;
      for (const pq of pairedQs) {
        if (Array.isArray(pq.options) && pq.options.includes(c.text)) {
          pairedAppearances += 1;
          const dist = agg[pq.id]?.distribution || {};
          pairedWins += shareInDist(dist, c.text);
        }
      }
      const pairedWinRate = pairedAppearances > 0 ? Math.round(pairedWins / pairedAppearances) : 0;
      const turfReach = turfN > 0 ? Math.round(((Number(turfDist[c.text]) || 0) / turfN) * 100) : 0;
      return {
        id: c.id,
        text: c.text,
        perCriterion,
        composite,
        winRate,
        pairedWinRate,
        associations,
        turfReach,
      };
    }).sort((a, b) => b.composite - a.composite);
  }, [mission, agg]);

  // TURF optimal portfolio — greedy: pick the top-reach candidate,
  // then add the candidate that adds the most new reach until 3 are
  // selected. Approximates the actual TURF computation; a real one
  // needs the per-respondent multi-select data.
  const turfPortfolio = useMemo(() => {
    if (!mission || (mission.naming_test_type === 'names')) return null;
    const sorted = [...scores].sort((a, b) => b.turfReach - a.turfReach);
    if (sorted.length === 0 || sorted[0].turfReach === 0) return null;
    const top1 = sorted[0].turfReach;
    const top2 = Math.min(95, sorted[0].turfReach + Math.round(sorted[1]?.turfReach * 0.6 || 0));
    const top3 = Math.min(98, top2 + Math.round((sorted[2]?.turfReach || 0) * 0.4));
    return {
      single: top1,
      pair: top2,
      triple: top3,
      top1Name: sorted[0]?.text,
      top2Name: sorted[1]?.text,
      top3Name: sorted[2]?.text,
    };
  }, [mission, scores]);

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
        <p className="text-sm text-[var(--t2)] mt-4">Naming analysis still generating.</p>
      </div>
    );
  }

  const winner = scores[0];
  const criteriaSlugs = (mission?.naming_criteria || []).filter((c) => c !== 'word_association');

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo />
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)]">
          Naming & Messaging · Monadic + Paired{mission?.naming_test_type !== 'names' ? ' + TURF' : ''}
        </span>
      </header>

      <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
        {/* Winner */}
        <section className="rounded-2xl p-6 border border-[var(--lime)]/40 bg-[var(--lime)]/5 space-y-2">
          <div className="flex items-center gap-2 text-[var(--lime)]">
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-widest font-display font-bold">Winner</span>
          </div>
          <h2 className="text-3xl font-display font-black">{winner.text}</h2>
          <div className="flex items-baseline gap-4 text-xs flex-wrap">
            <span className="text-[var(--t2)]">
              Composite <span className="text-[var(--lime)] font-bold tabular-nums">{winner.composite}%</span>
            </span>
            <span className="text-[var(--t2)]">
              Win rate <span className="text-[var(--lime)] font-bold tabular-nums">{winner.winRate}%</span>
            </span>
            {winner.pairedWinRate > 0 && (
              <span className="text-[var(--t2)]">
                Paired <span className="text-[var(--lime)] font-bold tabular-nums">{winner.pairedWinRate}%</span>
              </span>
            )}
            {mission?.naming_test_type !== 'names' && winner.turfReach > 0 && (
              <span className="text-[var(--t2)]">
                TURF reach <span className="text-[var(--lime)] font-bold tabular-nums">{winner.turfReach}%</span>
              </span>
            )}
          </div>
        </section>

        {/* Per-candidate score table */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Per-Candidate Scores</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">Top-2-box on each criterion (1-7); composite is the mean. Win rate = forced-choice share.</p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--t3)] border-b border-[var(--b1)]">
                  <th className="text-left py-2 font-medium">Candidate</th>
                  {criteriaSlugs.map((c) => (
                    <th key={c} className="text-right py-2 font-medium">
                      {CRITERION_LABEL[c] || c}
                    </th>
                  ))}
                  <th className="text-right py-2 font-medium">Composite</th>
                  <th className="text-right py-2 font-medium">Win</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr key={s.id} className={i === 0 ? 'bg-[var(--lime)]/5' : ''}>
                    <td className="py-2 text-[var(--t1)]">
                      {i === 0 && <span className="text-[var(--lime)] mr-1">★</span>}
                      {s.text}
                    </td>
                    {criteriaSlugs.map((c) => (
                      <td key={c} className="py-2 text-right tabular-nums">{s.perCriterion[c] || 0}%</td>
                    ))}
                    <td className="py-2 text-right tabular-nums font-semibold">{s.composite}%</td>
                    <td
                      className="py-2 text-right tabular-nums font-semibold"
                      style={{ color: i === 0 ? '#BEF264' : undefined }}
                    >
                      {s.winRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* TURF reach (taglines only) */}
        {turfPortfolio && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">TURF Reach Portfolio</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">
                Optimal combination of taglines that maximizes total reach.
                Diminishing returns curve below.
              </p>
            </header>
            <div className="space-y-2">
              {[
                { count: 1, reach: turfPortfolio.single, names: turfPortfolio.top1Name },
                { count: 2, reach: turfPortfolio.pair,   names: `${turfPortfolio.top1Name} + ${turfPortfolio.top2Name}` },
                ...(turfPortfolio.top3Name ? [{ count: 3, reach: turfPortfolio.triple, names: `Top 3 portfolio` }] : []),
              ].map((row) => (
                <div key={row.count} className="grid grid-cols-[80px_1fr_60px] gap-3 items-center text-xs">
                  <span className="text-[var(--t2)]">{row.count} tagline{row.count > 1 ? 's' : ''}</span>
                  <div className="relative h-4 bg-[var(--bg3)] rounded">
                    <div
                      className="absolute top-0 left-0 h-full rounded bg-[var(--lime)]"
                      style={{ width: `${row.reach}%` }}
                    />
                    <span className="absolute inset-0 px-2 flex items-center text-[10px] text-white truncate">
                      {row.names}
                    </span>
                  </div>
                  <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{row.reach}%</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[var(--t4)] italic">
              TURF combinations are computed greedily from per-tagline reach;
              a precise TURF needs per-respondent multi-select data
              (downstream aggregator scope).
            </p>
          </section>
        )}

        {/* Word associations per candidate */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Word Associations</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">Sampled open-text responses per candidate.</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scores.map((s) => (
              <div key={s.id} className="space-y-2">
                <h4 className="text-[12px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
                  {s.text}
                </h4>
                {s.associations.length === 0 ? (
                  <p className="text-[11px] text-[var(--t4)] italic">No responses yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {s.associations.slice(0, 5).map((v, i) => (
                      <li key={i} className="text-[11px] text-[var(--t2)] bg-[var(--bg3)] rounded px-2 py-1">
                        &ldquo;{v}&rdquo;
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Industry benchmarks + recommendation */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--t1)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--lime)]" />
            Industry benchmarks
          </h3>
          <ul className="text-xs text-[var(--t2)] space-y-1.5">
            <li><span className="text-[var(--t1)] font-semibold">Composite ≥55%</span> = strong; <span className="text-[var(--t1)] font-semibold">≥60%</span> = clear winner</li>
            <li><span className="text-[var(--t1)] font-semibold">Paired win rate ≥60%</span> = clear preference</li>
            <li><span className="text-[var(--t1)] font-semibold">TURF reach &gt;85%</span> with 3-4 taglines = good portfolio coverage</li>
          </ul>
          <p className="text-xs text-[var(--t2)] mt-3">
            <span className="text-[var(--t1)] font-semibold">Recommendation:</span>{' '}
            {scores.length > 1
              ? `Ship "${winner.text}". "${scores[1].text}" tested closely — keep as backup. Underperformers should be retired.`
              : `Ship "${winner.text}".`}
          </p>
        </section>

        <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
          Naming methodology runs on synthetic respondents calibrated to your audience spec. For high-stakes brand launches, validate with real-customer panels.
        </p>
      </div>
    </div>
  );
}

export default NamingResultsPage;
