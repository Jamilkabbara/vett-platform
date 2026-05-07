import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';

/**
 * Pass 31 B6 — Churn Research results page (Driver Tree + Win-Back).
 *
 * Routed via ResultsRouter when goal_type === 'churn_research'.
 * Reads:
 *   mission.questions             — 11 churn_driver Qs
 *   mission.aggregated_by_question
 *   mission.brand_name, churn_definition, churn_customer_type,
 *   churn_winback_possible
 *
 * Renders:
 *   - Hero: top reason / win-back % / satisfaction at churn / NPS at churn
 *   - Churn driver tree (root → reason categories with %)
 *   - Tenure-at-churn distribution
 *   - Win-back potential stacked bar per reason
 *   - CES at exit distribution
 *   - Warning signs verbatim themes
 *   - Recommendations card
 */

interface ChurnMission {
  id: string;
  questions: ChurnQuestion[];
  brand_name?: string;
  churn_definition?: string;
  churn_customer_type?: string;
  churn_winback_possible?: boolean;
}

interface ChurnQuestion {
  id: string;
  text: string;
  type: string;
  methodology?: string;
  churn_stage?: string;
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

function meanRating(dist: Record<string, number>): number {
  let total = 0; let weighted = 0;
  for (const [k, v] of Object.entries(dist)) {
    const score = parseInt(k, 10);
    const n = Number(v) || 0;
    if (Number.isFinite(score)) { total += n; weighted += score * n; }
  }
  return total > 0 ? weighted / total : 0;
}

function shareInDist(dist: Record<string, number>, key: string, denom: number): number {
  if (denom === 0) return 0;
  return Math.round(((Number(dist[key]) || 0) / denom) * 100);
}

export function ChurnResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<ChurnMission | null>(null);
  const [agg, setAgg] = useState<Record<string, AggregatedAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('id, questions, brand_name, churn_definition, churn_customer_type, churn_winback_possible, aggregated_by_question')
        .eq('id', missionId)
        .single();
      if (fetchErr || !data) {
        setError('Mission not found');
      } else {
        setMission(data as ChurnMission);
        setAgg((data as Record<string, unknown>).aggregated_by_question as Record<string, AggregatedAnswer> || {});
      }
      setLoading(false);
    })();
  }, [missionId]);

  const stages = useMemo(() => {
    if (!mission) return null;
    const find = (stage: string, idx?: number) => {
      const matches = mission.questions.filter((q) => q.churn_stage === stage);
      return idx != null ? matches[idx] : matches[0];
    };
    const reasonQ = find('reason', 0); // q2 multi reason category
    const satisfactionQ = find('satisfaction', 0); // q4 5-pt
    const npsQ = find('satisfaction', 1); // q5 NPS rating
    const winbackQ = find('win_back', 0); // q6 yes/maybe/no
    const triggersQ = find('win_back', 1); // q7 triggers multi
    const cesQ = find('switch', 1); // q9 CES rating
    const warningQ = find('warning'); // q10 open
    const tenureQ = find('tenure'); // q11 tenure single

    const reasonDist = reasonQ ? agg[reasonQ.id]?.distribution || {} : {};
    const reasonN = reasonQ ? agg[reasonQ.id]?.n_respondents || agg[reasonQ.id]?.n || 0 : 0;
    const winbackDist = winbackQ ? agg[winbackQ.id]?.distribution || {} : {};
    const winbackTotal = Object.values(winbackDist).reduce((s, v) => s + (Number(v) || 0), 0);
    const winbackYes = Number(winbackDist['Yes']) || 0;
    const winbackMaybe = Number(winbackDist['Maybe']) || 0;
    const winbackPct = winbackTotal > 0
      ? Math.round(((winbackYes + winbackMaybe) / winbackTotal) * 100)
      : 0;

    // Top reason category
    const sortedReasons = Object.entries(reasonDist)
      .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
    const topReason = sortedReasons[0]?.[0] || '—';
    const topReasonPct = reasonN > 0 ? shareInDist(reasonDist, topReason, reasonN) : 0;

    return {
      reasonDist,
      reasonN,
      sortedReasons,
      topReason,
      topReasonPct,
      satisfactionMean: satisfactionQ ? meanRating(agg[satisfactionQ.id]?.distribution || {}) : 0,
      nps: npsQ ? npsTop2BoxFromDist(agg[npsQ.id]?.distribution || {}) : 0,
      winbackPct,
      winbackDist,
      triggersDist: triggersQ ? agg[triggersQ.id]?.distribution || {} : {},
      triggersN: triggersQ ? agg[triggersQ.id]?.n_respondents || agg[triggersQ.id]?.n || 0 : 0,
      cesDist: cesQ ? agg[cesQ.id]?.distribution || {} : {},
      cesMean: cesQ ? meanRating(agg[cesQ.id]?.distribution || {}) : 0,
      warningVerbatims: warningQ ? agg[warningQ.id]?.verbatims || [] : [],
      tenureDist: tenureQ ? agg[tenureQ.id]?.distribution || {} : {},
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
  if (!stages || stages.reasonN === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5 text-center">
        <Logo />
        <p className="text-sm text-[var(--t2)] mt-4">Churn analysis still generating.</p>
      </div>
    );
  }

  const npsBnd = npsBand(stages.nps);
  const winbackBase = mission?.churn_winback_possible ?? false;

  // Top win-back triggers
  const sortedTriggers = Object.entries(stages.triggersDist)
    .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
    .slice(0, 5);

  // CES at exit — % CES <3 (high effort, vocal detractor risk)
  const cesTotal = Object.values(stages.cesDist).reduce((s, v) => s + (Number(v) || 0), 0);
  let cesHigh = 0;
  for (const [k, v] of Object.entries(stages.cesDist)) {
    if (parseInt(k, 10) < 3) cesHigh += Number(v) || 0;
  }
  const cesHighPct = cesTotal > 0 ? Math.round((cesHigh / cesTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo />
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)]">
          Churn Research · Driver Tree + Win-Back
        </span>
      </header>

      <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
        {/* Hero metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl p-5 border border-[var(--b1)] bg-[var(--bg2)]">
            <p className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">Top Reason</p>
            <p className="text-2xl font-display font-black mt-1 text-white">{stages.topReason}</p>
            <p className="text-[11px] text-[var(--t3)] mt-1">{stages.topReasonPct}% of churned cite this</p>
          </div>
          <div className="rounded-2xl p-5 border border-[var(--lime)]/40 bg-[var(--lime)]/5">
            <p className="text-[10px] uppercase tracking-widest text-[var(--lime)] font-display font-bold">Win-back %</p>
            <p className="text-3xl font-display font-black mt-1 tabular-nums text-[var(--lime)]">{stages.winbackPct}%</p>
            <p className="text-[11px] text-[var(--t3)] mt-1">Yes + Maybe</p>
          </div>
          <div className="rounded-2xl p-5 border border-[var(--b1)] bg-[var(--bg2)]">
            <p className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">Satisfaction at Churn</p>
            <p className="text-3xl font-display font-black mt-1 tabular-nums text-white">{stages.satisfactionMean.toFixed(1)}</p>
            <p className="text-[11px] text-[var(--t3)] mt-1">/ 5 mean rating</p>
          </div>
          <div className="rounded-2xl p-5 border bg-[var(--bg2)]" style={{ borderColor: npsBnd.color + '88' }}>
            <p className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">NPS at Churn</p>
            <p className="text-3xl font-display font-black mt-1 tabular-nums" style={{ color: npsBnd.color }}>{stages.nps}</p>
            <p className="text-[11px] mt-1 font-semibold" style={{ color: npsBnd.color }}>{npsBnd.label}</p>
          </div>
        </div>

        {/* Driver tree (flat list with hierarchy hint via indent / connector) */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Churn Driver Tree</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">Root: total churned. Branches: top-level reason categories (% of churned cite each).</p>
          </header>
          <div className="space-y-1.5">
            {stages.sortedReasons.map(([reason, count]) => {
              const pct = shareInDist(stages.reasonDist, reason, stages.reasonN);
              return (
                <div key={reason} className="grid grid-cols-[140px_1fr_50px] gap-3 items-center text-xs">
                  <span className="text-[var(--t2)] truncate">{reason}</span>
                  <div className="relative h-4 bg-[var(--bg3)] rounded">
                    <div
                      className={['absolute top-0 left-0 h-full rounded', pct >= 30 ? 'bg-red-400' : pct >= 15 ? 'bg-amber-400' : 'bg-[var(--t3)]'].join(' ')}
                      style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                    />
                  </div>
                  <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{pct}%</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tenure distribution */}
        {Object.keys(stages.tenureDist).length > 0 && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Tenure at Churn</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">When customers tend to leave.</p>
            </header>
            {(['Less than 1 month', '1-3 months', '3-12 months', '1-3 years', 'More than 3 years'] as const).map((bucket) => {
              const total = Object.values(stages.tenureDist).reduce((s, v) => s + (Number(v) || 0), 0);
              const pct = shareInDist(stages.tenureDist, bucket, total);
              return (
                <div key={bucket} className="grid grid-cols-[140px_1fr_50px] gap-3 items-center text-xs">
                  <span className="text-[var(--t2)]">{bucket}</span>
                  <div className="relative h-3 bg-[var(--bg3)] rounded">
                    <div
                      className="absolute top-0 left-0 h-full rounded bg-[var(--pur)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-right tabular-nums text-[var(--t1)]">{pct}%</span>
                </div>
              );
            })}
          </section>
        )}

        {/* Win-back potential + triggers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Win-back Probability</h3>
            </header>
            {(['Yes', 'Maybe', 'No'] as const).map((label) => {
              const total = Object.values(stages.winbackDist).reduce((s, v) => s + (Number(v) || 0), 0);
              const pct = shareInDist(stages.winbackDist, label, total);
              return (
                <div key={label} className="grid grid-cols-[80px_1fr_50px] gap-3 items-center text-xs">
                  <span className="text-[var(--t2)]">{label}</span>
                  <div className="relative h-4 bg-[var(--bg3)] rounded">
                    <div
                      className={['absolute top-0 left-0 h-full rounded', label === 'Yes' ? 'bg-[var(--lime)]' : label === 'Maybe' ? 'bg-amber-400' : 'bg-red-400'].join(' ')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{pct}%</span>
                </div>
              );
            })}
          </section>

          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Top Win-back Triggers</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">% who&apos;d respond to each.</p>
            </header>
            {sortedTriggers.length === 0 ? (
              <p className="text-[11px] text-[var(--t4)] italic">No win-back trigger responses yet.</p>
            ) : (
              sortedTriggers.map(([trigger, count]) => {
                const pct = stages.triggersN > 0 ? Math.round(((Number(count) || 0) / stages.triggersN) * 100) : 0;
                return (
                  <div key={trigger} className="grid grid-cols-[1fr_50px] gap-2 items-center text-xs">
                    <div className="relative h-4 bg-[var(--bg3)] rounded">
                      <div
                        className="absolute top-0 left-0 h-full bg-[var(--lime)]/70 rounded"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-0 px-2 flex items-center text-[10px] text-white truncate">
                        {trigger}
                      </span>
                    </div>
                    <span className="text-right tabular-nums text-[var(--t1)] font-semibold">{pct}%</span>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* CES at exit */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <header>
            <h3 className="text-sm font-semibold text-[var(--t1)]">Customer Effort to Exit</h3>
            <p className="text-xs text-[var(--t3)] mt-0.5">7-pt scale: 1 very difficult → 7 very easy. {cesHighPct}% rated &lt;3 = vocal detractor risk.</p>
          </header>
          <div className="text-2xl font-display font-black tabular-nums">
            {stages.cesMean.toFixed(1)} <span className="text-[var(--t3)] text-sm font-body font-normal">/ 7 mean</span>
          </div>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => {
            const total = Object.values(stages.cesDist).reduce((s, v) => s + (Number(v) || 0), 0);
            const pct = shareInDist(stages.cesDist, String(n), total);
            return (
              <div key={n} className="grid grid-cols-[40px_1fr_40px] gap-3 items-center text-[11px]">
                <span className="text-[var(--t3)] tabular-nums">{n}</span>
                <div className="relative h-3 bg-[var(--bg3)] rounded">
                  <div
                    className={['absolute top-0 left-0 h-full rounded', n < 3 ? 'bg-red-400' : n < 5 ? 'bg-amber-400' : 'bg-[var(--lime)]'].join(' ')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right tabular-nums text-[var(--t1)]">{pct}%</span>
              </div>
            );
          })}
        </section>

        {/* Warning signs */}
        {stages.warningVerbatims.length > 0 && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Early Warning Signs</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">First signs respondents recognized they&apos;d leave. Watch for these in current customers.</p>
            </header>
            <ul className="space-y-1.5">
              {stages.warningVerbatims.slice(0, 6).map((v, i) => (
                <li key={i} className="text-[11px] text-[var(--t2)] bg-[var(--bg3)] rounded-lg px-2 py-1.5">
                  &ldquo;{v}&rdquo;
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Recommendations */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--t1)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--lime)]" />
            Recommendations
          </h3>
          <ul className="text-xs text-[var(--t2)] space-y-1.5">
            <li>
              <span className="text-[var(--t1)] font-semibold">Top 3 churn drivers to address:</span>{' '}
              {stages.sortedReasons.slice(0, 3).map(([r]) => r).join(', ')}.
            </li>
            {sortedTriggers.length > 0 && (
              <li>
                <span className="text-[var(--t1)] font-semibold">Top win-back triggers:</span>{' '}
                {sortedTriggers.slice(0, 3).map(([t]) => t).join(', ')}.
              </li>
            )}
            {winbackBase && stages.winbackPct > 0 && (
              <li>
                <span className="text-[var(--t1)] font-semibold">Estimated win-back addressable market:</span>{' '}
                {stages.winbackPct}% of churned base would reconsider with the right trigger.
              </li>
            )}
            {cesHighPct >= 20 && (
              <li className="text-amber-400">
                <span className="font-semibold">⚠ {cesHighPct}% high-effort exits</span> = vocal detractor risk. Reduce friction in the cancellation flow to limit negative WoM.
              </li>
            )}
          </ul>
        </section>

        <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
          Churn driver analysis on synthetic respondents. Sample floor 100; for confident win-back trigger heatmaps consider 200+.
        </p>
      </div>
    </div>
  );
}

export default ChurnResultsPage;
