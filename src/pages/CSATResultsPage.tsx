import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';

/**
 * Pass 29 B9 — Customer Satisfaction results page.
 *
 * Routed via ResultsRouter when goal_type === 'satisfaction'.
 *
 * Reads:
 *   mission.questions             — the 10-question NPS+CSAT+CES instrument
 *   mission.aggregated_by_question
 *   mission.csat_touchpoint, csat_recency_window
 *
 * Computes:
 *   - NPS = % promoters (9-10) - % detractors (0-6) on the rating distribution
 *   - CSAT = top-2-box % on the 5-pt distribution (Satisfied + Very satisfied)
 *   - CES = top-2-box % on the 7-pt distribution (6 + 7)
 *   - Attribute matrix averages per attribute
 *
 * Renders:
 *   - 3 hero score cards (NPS, CSAT, CES) with industry benchmark bands
 *   - Attribute radar chart
 *   - Driver verbatim themes (raw verbatims sampled — already capped at
 *     30 per the aggregator)
 *   - Retention forecast bar
 *   - Specific issues bar chart
 */

interface CSATMission {
  id: string;
  questions: CSATQuestion[];
  csat_touchpoint?: string;
  csat_recency_window?: string;
  brand_name?: string;
}

interface CSATQuestion {
  id: string;
  text: string;
  type: string;
  methodology?: string;
  options?: string[];
  is_driver?: boolean;
}

interface AggregatedAnswer {
  id: string;
  type: string;
  n: number;
  distribution?: Record<string, number>;
  average?: number;
  verbatims?: string[];
}

const NPS_BANDS = [
  { min: 70,   max: 100, label: 'Excellent', color: '#BEF264' },
  { min: 50,   max: 69,  label: 'Great',     color: '#A3E635' },
  { min: 30,   max: 49,  label: 'Good',      color: '#FACC15' },
  { min: 0,    max: 29,  label: 'Fair',      color: '#FB923C' },
  { min: -10,  max: -1,  label: 'Poor',      color: '#F87171' },
  { min: -100, max: -11, label: 'Crisis',    color: '#EF4444' },
];

const CSAT_BANDS = [
  { min: 90, max: 100, label: 'Excellent', color: '#BEF264' },
  { min: 80, max: 89,  label: 'Great',     color: '#A3E635' },
  { min: 70, max: 79,  label: 'Good',      color: '#FACC15' },
  { min: 60, max: 69,  label: 'Fair',      color: '#FB923C' },
  { min: 0,  max: 59,  label: 'Poor',      color: '#F87171' },
];

const CES_BANDS = [
  { min: 85, max: 100, label: 'Excellent', color: '#BEF264' },
  { min: 75, max: 84,  label: 'Great',     color: '#A3E635' },
  { min: 65, max: 74,  label: 'Good',      color: '#FACC15' },
  { min: 55, max: 64,  label: 'Fair',      color: '#FB923C' },
  { min: 0,  max: 54,  label: 'Poor',      color: '#F87171' },
];

type Band = { min: number; max: number; label: string; color: string };

function bandOf(score: number, bands: Band[]): Band {
  return bands.find((b) => score >= b.min && score <= b.max) || bands[bands.length - 1];
}

function computeNPS(dist: Record<string, number>): number {
  let promoters = 0, detractors = 0, total = 0;
  for (const [k, v] of Object.entries(dist)) {
    const n = Number(v) || 0;
    const score = parseInt(k, 10);
    if (Number.isFinite(score)) {
      total += n;
      if (score >= 9) promoters += n;
      else if (score <= 6) detractors += n;
    }
  }
  if (total === 0) return 0;
  return Math.round(((promoters - detractors) / total) * 100);
}

function computeCSATTop2(dist: Record<string, number>): number {
  const total = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total === 0) return 0;
  const top = (Number(dist['Satisfied']) || 0) + (Number(dist['Very satisfied']) || 0);
  return Math.round((top / total) * 100);
}

function computeCESTop2(dist: Record<string, number>): number {
  const total = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total === 0) return 0;
  // 7-point scale stored as numeric strings; top-2-box = 6 + 7
  let top = 0;
  for (const [k, v] of Object.entries(dist)) {
    const score = parseInt(k, 10);
    if (score >= 6) top += Number(v) || 0;
  }
  return Math.round((top / total) * 100);
}

export function CSATResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<CSATMission | null>(null);
  const [agg, setAgg] = useState<Record<string, AggregatedAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('id, questions, brand_name, csat_touchpoint, csat_recency_window, aggregated_by_question')
        .eq('id', missionId)
        .single();
      if (fetchErr || !data) {
        setError('Mission not found');
      } else {
        setMission(data as CSATMission);
        setAgg((data as Record<string, unknown>).aggregated_by_question as Record<string, AggregatedAnswer> || {});
      }
      setLoading(false);
    })();
  }, [missionId]);

  const scores = useMemo(() => {
    if (!mission) return null;
    const npsQ = mission.questions.find((q) => q.methodology === 'nps');
    const csatQ = mission.questions.find((q) => q.methodology === 'csat');
    const cesQ = mission.questions.find((q) => q.methodology === 'ces');
    const attrQ = mission.questions.find((q) => q.methodology === 'attribute_matrix');
    const retentionQ = mission.questions.find((q) => q.methodology === 'retention');
    const issuesQ = mission.questions.find((q) => q.methodology === 'specific_issues');
    return {
      nps: npsQ ? computeNPS(agg[npsQ.id]?.distribution || {}) : null,
      csat: csatQ ? computeCSATTop2(agg[csatQ.id]?.distribution || {}) : null,
      ces: cesQ ? computeCESTop2(agg[cesQ.id]?.distribution || {}) : null,
      attributes: attrQ ? agg[attrQ.id]?.distribution || {} : {},
      attributeOptions: attrQ?.options || [],
      retention: retentionQ ? agg[retentionQ.id]?.average ?? null : null,
      issues: issuesQ ? agg[issuesQ.id]?.distribution || {} : {},
      issuesN: issuesQ ? agg[issuesQ.id]?.n || 0 : 0,
    };
  }, [mission, agg]);

  const drivers = useMemo(() => {
    if (!mission) return [];
    return mission.questions
      .filter((q) => q.is_driver)
      .map((q) => ({
        id: q.id,
        label:
          q.methodology === 'nps_driver' ? 'NPS reasons'
          : q.methodology === 'csat_driver' ? 'CSAT improvement themes'
          : q.methodology === 'ces_driver' ? 'CES drivers'
          : 'Driver',
        verbatims: agg[q.id]?.verbatims || [],
      }));
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
  if (!scores || (scores.nps == null && scores.csat == null && scores.ces == null)) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5 text-center">
        <Logo />
        <p className="text-sm text-[var(--t2)] mt-4">Customer satisfaction analysis still generating.</p>
        <p className="text-xs text-[var(--t3)] max-w-md">
          NPS, CSAT, and CES scores render here once the simulator finishes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo />
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)]">
          Customer Satisfaction · NPS + CSAT + CES
        </span>
      </header>

      <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
        {/* Hero score row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ScoreCard
            label="NPS"
            value={scores.nps != null ? String(scores.nps) : '—'}
            band={scores.nps != null ? bandOf(scores.nps, NPS_BANDS) : null}
            sub="% Promoters − % Detractors"
            range={[-100, 100]}
          />
          <ScoreCard
            label="CSAT"
            value={scores.csat != null ? `${scores.csat}%` : '—'}
            band={scores.csat != null ? bandOf(scores.csat, CSAT_BANDS) : null}
            sub="Top-2-box satisfaction"
            range={[0, 100]}
          />
          <ScoreCard
            label="CES"
            value={scores.ces != null ? `${scores.ces}%` : '—'}
            band={scores.ces != null ? bandOf(scores.ces, CES_BANDS) : null}
            sub="Top-2-box ease (6+7 of 7)"
            range={[0, 100]}
          />
        </div>

        {/* Industry benchmark callouts */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--t1)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--lime)]" />
            Industry benchmark bands
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <BandList title="NPS" bands={NPS_BANDS} unit="" />
            <BandList title="CSAT (top-2-box)" bands={CSAT_BANDS} unit="%" />
            <BandList title="CES (top-2-box)" bands={CES_BANDS} unit="%" />
          </div>
        </section>

        {/* Attribute matrix */}
        {Object.keys(scores.attributes).length > 0 && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Attribute Ratings</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">
                Average rating (1-5) on each dimension.
              </p>
            </header>
            <div className="space-y-2">
              {scores.attributeOptions.map((attr) => {
                const raw = scores.attributes[attr];
                const score = typeof raw === 'number' ? raw : parseFloat(String(raw)) || 0;
                const pct = (score / 5) * 100;
                return (
                  <div key={attr} className="grid grid-cols-[160px_1fr_50px] gap-3 items-center text-xs">
                    <span className="text-[var(--t2)] truncate">{attr}</span>
                    <div className="relative h-4 bg-[var(--bg3)] rounded">
                      <div
                        className={[
                          'absolute top-0 left-0 h-full rounded',
                          score >= 4 ? 'bg-[var(--lime)]'
                            : score >= 3 ? 'bg-amber-400'
                            : 'bg-red-400',
                        ].join(' ')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-right tabular-nums text-[var(--t1)] font-semibold">
                      {score.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Retention forecast + issues */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {scores.retention != null && (
            <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
              <header>
                <h3 className="text-sm font-semibold text-[var(--t1)]">Retention Intent</h3>
                <p className="text-xs text-[var(--t3)] mt-0.5">
                  Likelihood to keep using over the next 12 months (1-5).
                </p>
              </header>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-display font-black text-[var(--lime)] tabular-nums">
                  {scores.retention.toFixed(1)}
                </span>
                <span className="text-sm text-[var(--t3)]">/ 5</span>
              </div>
              <p className="text-[11px] text-[var(--t3)]">
                {scores.retention >= 4 ? 'Strong retention signal.'
                  : scores.retention >= 3 ? 'Moderate retention signal — investigate churn drivers.'
                  : 'Weak retention signal — high churn risk.'}
              </p>
            </section>
          )}

          {Object.keys(scores.issues).length > 0 && (
            <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
              <header>
                <h3 className="text-sm font-semibold text-[var(--t1)]">Top Issues Reported</h3>
                <p className="text-xs text-[var(--t3)] mt-0.5">
                  % of respondents experiencing each in the past {mission?.csat_recency_window?.replace(/_/g, ' ') || 'window'}.
                </p>
              </header>
              <div className="space-y-2">
                {Object.entries(scores.issues)
                  .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
                  .slice(0, 5)
                  .map(([issue, n]) => {
                    const pct = scores.issuesN > 0 ? ((Number(n) || 0) / scores.issuesN) * 100 : 0;
                    return (
                      <div key={issue} className="grid grid-cols-[1fr_50px] gap-2 items-center text-xs">
                        <div className="relative h-4 bg-[var(--bg3)] rounded">
                          <div
                            className="absolute top-0 left-0 h-full bg-[var(--pur)] rounded"
                            style={{ width: `${pct}%` }}
                          />
                          <span className="absolute inset-0 px-2 flex items-center text-[10px] text-white truncate">
                            {issue}
                          </span>
                        </div>
                        <span className="text-right tabular-nums text-[var(--t1)] font-semibold">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}
        </div>

        {/* Driver verbatims */}
        {drivers.some((d) => d.verbatims.length > 0) && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Driver Verbatims</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">
                Sampled open-text responses from each scoring follow-up.
              </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {drivers.map((d) => (
                <div key={d.id} className="space-y-2">
                  <h4 className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">
                    {d.label}
                  </h4>
                  <ul className="space-y-1.5">
                    {d.verbatims.slice(0, 6).map((v, i) => (
                      <li key={i} className="text-[11px] text-[var(--t2)] bg-[var(--bg3)] rounded-lg px-2 py-1.5">
                        &ldquo;{v}&rdquo;
                      </li>
                    ))}
                    {d.verbatims.length === 0 && (
                      <li className="text-[11px] text-[var(--t4)] italic">No responses yet.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
          NPS / CSAT / CES on synthetic respondents calibrated to the audience spec. Industry bands shown for orientation; combine with real-customer panel readings for absolute claims.
        </p>
      </div>
    </div>
  );
}

function ScoreCard({
  label, value, band, sub,
}: {
  label: string;
  value: string;
  band: Band | null;
  sub?: string;
  range: [number, number];
}) {
  return (
    <div
      className="rounded-2xl p-5 border bg-[var(--bg2)]"
      style={{ borderColor: band ? band.color + '88' : 'var(--b1)' }}
    >
      <p className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">{label}</p>
      <p className="text-4xl font-display font-black mt-1 tabular-nums" style={{ color: band?.color || '#FFFFFF' }}>
        {value}
      </p>
      {band && (
        <p className="text-[11px] mt-1 font-semibold" style={{ color: band.color }}>
          {band.label}
        </p>
      )}
      {sub && <p className="text-[10px] text-[var(--t3)] mt-1">{sub}</p>}
    </div>
  );
}

function BandList({ title, bands, unit }: { title: string; bands: Band[]; unit: string }) {
  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-widest text-[var(--t3)] font-display font-bold mb-2">{title}</h4>
      <ul className="space-y-1">
        {bands.map((b) => (
          <li key={b.label} className="flex items-center gap-2 text-[11px]">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: b.color }} aria-hidden />
            <span className="text-[var(--t2)] flex-1">{b.label}</span>
            <span className="text-[var(--t3)] tabular-nums">
              {b.min === bands[bands.length - 1].min && b.min < 0 ? '<' : ''}{b.min === b.max ? b.min : `${b.min}–${b.max}`}{unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CSATResultsPage;
