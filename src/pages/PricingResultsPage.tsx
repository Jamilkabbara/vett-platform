import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';

/**
 * Pass 29 B5 — Pricing Research results page.
 *
 * Routed via ResultsRouter when goal_type === 'pricing'. Reads:
 *   mission.questions       — the 13-question VW+GG instrument
 *   mission.aggregatedByQuestion — per-Q distributions
 *   mission.pricing_currency / pricing_expected_min/max
 *
 * Renders:
 *   1. Hero KPI row: OPP, Acceptable Range, Revenue-Max Price, elasticity
 *   2. Van Westendorp 4-curve plot with PMC/PME/IPP/OPP intersections
 *   3. Gabor-Granger demand curve + revenue overlay
 *   4. Industry benchmark callouts
 *
 * Heavy compute (intersection finding, revenue overlay) lives here
 * client-side so /results/:id payload stays small. Reuses the existing
 * GET /api/results/:id endpoint shape — no new endpoint needed.
 */

// Currency symbol map. Falls back to the ISO code when unknown.
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', BRL: 'R$',
  AED: 'AED ', SAR: 'SAR ',
};

interface PricingMission {
  id: string;
  questions: PricingQuestion[];
  pricing_currency?: string;
  pricing_expected_min?: number | null;
  pricing_expected_max?: number | null;
  brand_name?: string;
}

interface PricingQuestion {
  id: string;
  text: string;
  type: string;
  methodology?: string;
  vw_band?: 'too_expensive' | 'expensive' | 'bargain' | 'too_cheap';
  gg_anchor_index?: number;
  options?: string[];
  currency?: string;
}

interface AggregatedAnswer {
  id: string;
  type: string;
  n: number;
  verbatims?: string[];
  distribution?: Record<string, number>;
  average?: number;
}

interface CurvePoint {
  price: number;
  pct: number;
}

interface VWAnalysis {
  pmc: number | null;
  pme: number | null;
  ipp: number | null;
  opp: number | null;
  curves: {
    too_cheap: CurvePoint[];
    bargain: CurvePoint[];
    expensive: CurvePoint[];
    too_expensive: CurvePoint[];
  };
}

/** Parse a free-text price answer into a number. Strips currency
 *  symbols, commas, and whitespace; returns NaN on garbage. */
function parsePrice(raw: string): number {
  if (!raw) return NaN;
  const cleaned = raw.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned);
}

/** Build a cumulative curve from a list of price answers.
 *  direction='above' (cumulative %  saying ≥ price) for "too expensive"
 *  and "expensive" bands. direction='below' (cumulative % ≤ price)
 *  for "too cheap" and "bargain" bands. */
function cumulativeCurve(
  prices: number[],
  axis: number[],
  direction: 'above' | 'below',
): CurvePoint[] {
  const n = prices.length || 1;
  return axis.map((p) => {
    const count = direction === 'above'
      ? prices.filter((x) => x <= p).length  // % who'd say "too expensive at this point or lower"
      : prices.filter((x) => x >= p).length; // % who'd say "too cheap at this point or higher"
    return { price: p, pct: (count / n) * 100 };
  });
}

/** Find the price where two cumulative curves cross. Returns null if no
 *  crossing exists in the supplied axis range. Linear interpolation
 *  between the two adjacent samples that bracket the cross. */
function findIntersection(a: CurvePoint[], b: CurvePoint[]): number | null {
  for (let i = 0; i < a.length - 1; i++) {
    const ax1 = a[i].pct, ax2 = a[i + 1].pct;
    const bx1 = b[i].pct, bx2 = b[i + 1].pct;
    const d1 = ax1 - bx1;
    const d2 = ax2 - bx2;
    if (d1 === 0) return a[i].price;
    if ((d1 < 0 && d2 > 0) || (d1 > 0 && d2 < 0)) {
      // Linear interpolate the price at the crossover.
      const t = d1 / (d1 - d2);
      return a[i].price + t * (a[i + 1].price - a[i].price);
    }
  }
  return null;
}

function analyzeVW(
  mission: PricingMission,
  agg: Record<string, AggregatedAnswer>,
): VWAnalysis | null {
  const vwQs = mission.questions.filter((q) => q.methodology === 'van_westendorp');
  if (vwQs.length < 4) return null;

  const collect = (band: PricingQuestion['vw_band']): number[] => {
    const q = vwQs.find((x) => x.vw_band === band);
    if (!q) return [];
    const v = agg[q.id]?.verbatims || [];
    return v.map(parsePrice).filter((n) => Number.isFinite(n) && n > 0);
  };

  const tooCheap   = collect('too_cheap');
  const bargain    = collect('bargain');
  const expensive  = collect('expensive');
  const tooExp     = collect('too_expensive');
  if (tooCheap.length === 0 && tooExp.length === 0) return null;

  const all = [...tooCheap, ...bargain, ...expensive, ...tooExp];
  const min = Math.max(0.01, Math.min(...all));
  const max = Math.max(...all);
  const STEPS = 40;
  const axis: number[] = [];
  for (let i = 0; i < STEPS; i++) {
    axis.push(min + ((max - min) * i) / (STEPS - 1));
  }

  const curveCheap     = cumulativeCurve(tooCheap,  axis, 'below');
  const curveBargain   = cumulativeCurve(bargain,   axis, 'below');
  const curveExpensive = cumulativeCurve(expensive, axis, 'above');
  const curveTooExp    = cumulativeCurve(tooExp,    axis, 'above');

  // Standard Van Westendorp intersections
  // PMC: too_cheap × expensive → lowest acceptable price
  // PME: too_expensive × bargain → highest acceptable price
  // IPP: bargain × expensive → indifference price
  // OPP: too_cheap × too_expensive → optimal price
  const pmc = findIntersection(curveCheap, curveExpensive);
  const pme = findIntersection(curveTooExp, curveBargain);
  const ipp = findIntersection(curveBargain, curveExpensive);
  const opp = findIntersection(curveCheap, curveTooExp);

  return {
    pmc, pme, ipp, opp,
    curves: {
      too_cheap: curveCheap,
      bargain: curveBargain,
      expensive: curveExpensive,
      too_expensive: curveTooExp,
    },
  };
}

interface GGPoint {
  anchorIndex: number;
  price: number;
  acceptanceRate: number; // % "definitely + probably buy"
  revenue: number;        // price × acceptanceRate (relative units)
}

function analyzeGG(
  mission: PricingMission,
  agg: Record<string, AggregatedAnswer>,
): GGPoint[] | null {
  const ggQs = mission.questions
    .filter((q) => q.methodology === 'gabor_granger')
    .sort((a, b) => (a.gg_anchor_index ?? 0) - (b.gg_anchor_index ?? 0));
  if (ggQs.length === 0) return null;

  return ggQs.map((q) => {
    const dist = agg[q.id]?.distribution || {};
    const total = Object.values(dist).reduce((s, n) => s + (Number(n) || 0), 0);
    const accept =
      (Number(dist['Definitely would buy']) || 0) +
      (Number(dist['Probably would buy']) || 0);
    const acceptanceRate = total > 0 ? (accept / total) * 100 : 0;
    // Extract the price from the question text — the prompt put it in
    // a "$X" or "AED X" form. Falls back to 0 if no number found.
    const priceMatch = q.text.match(/[\d]+[.,]?[\d]*/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;
    return {
      anchorIndex: q.gg_anchor_index ?? 0,
      price,
      acceptanceRate,
      revenue: price * (acceptanceRate / 100),
    };
  });
}

export function PricingResultsPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<PricingMission | null>(null);
  const [agg, setAgg] = useState<Record<string, AggregatedAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('missions')
        .select('id, questions, pricing_currency, pricing_expected_min, pricing_expected_max, brand_name, aggregated_by_question')
        .eq('id', missionId)
        .single();
      if (fetchErr || !data) {
        setError('Mission not found');
      } else {
        setMission(data as PricingMission);
        setAgg((data as Record<string, unknown>).aggregated_by_question as Record<string, AggregatedAnswer> || {});
      }
      setLoading(false);
    })();
  }, [missionId]);

  const vw = useMemo(() => mission ? analyzeVW(mission, agg) : null, [mission, agg]);
  const gg = useMemo(() => mission ? analyzeGG(mission, agg) : null, [mission, agg]);

  const symbol = mission?.pricing_currency
    ? (CURRENCY_SYMBOLS[mission.pricing_currency] || `${mission.pricing_currency} `)
    : '$';

  const fmt = (n: number | null | undefined) =>
    n == null || !Number.isFinite(n) ? '—' : `${symbol}${n.toFixed(2)}`;

  // Revenue-maximizing GG anchor.
  const ggMax = useMemo(() => {
    if (!gg || gg.length === 0) return null;
    return gg.reduce((best, p) => (p.revenue > best.revenue ? p : best), gg[0]);
  }, [gg]);

  // Acceptable range width vs OPP — used in the elasticity callout.
  const acceptableRangeWidth = vw && vw.pmc != null && vw.pme != null
    ? vw.pme - vw.pmc
    : null;
  const oppRangePct = vw && vw.opp && acceptableRangeWidth != null && vw.opp > 0
    ? (acceptableRangeWidth / vw.opp) * 100
    : null;

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

  if (!vw && !gg) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-3 px-5 text-center">
        <Logo />
        <p className="text-sm text-[var(--t2)] mt-4">Pricing analysis still generating.</p>
        <p className="text-xs text-[var(--t3)] max-w-md">
          The 4 Van Westendorp + 5 Gabor-Granger curves render here once the simulator finishes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo />
        <span className="text-[11px] uppercase tracking-widest text-[var(--t3)]">
          Pricing Research · Van Westendorp + Gabor-Granger
        </span>
      </header>

      <div className="px-6 pb-12 space-y-5 max-w-6xl mx-auto">
        {/* KPI hero row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            label="Optimal Price (OPP)"
            value={fmt(vw?.opp)}
            sub="Min resistance"
            highlight
          />
          <KPICard
            label="Acceptable Range"
            value={vw && vw.pmc != null && vw.pme != null
              ? `${fmt(vw.pmc)} – ${fmt(vw.pme)}`
              : '—'}
            sub="PMC → PME"
          />
          <KPICard
            label="Revenue Max"
            value={fmt(ggMax?.price)}
            sub={ggMax ? `${ggMax.acceptanceRate.toFixed(0)}% accept` : ''}
          />
          <KPICard
            label="Elasticity"
            value={oppRangePct != null ? `${oppRangePct.toFixed(0)}%` : '—'}
            sub="Range / OPP"
          />
        </div>

        {/* Van Westendorp 4-curve plot */}
        {vw && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Van Westendorp Price Sensitivity</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">
                4 cumulative curves crossing at PMC, PME, IPP, OPP.
              </p>
            </header>
            <VWChart vw={vw} symbol={symbol} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[11px]">
              <Legend swatch="#F87171" label="Too expensive" />
              <Legend swatch="#FB923C" label="Expensive" />
              <Legend swatch="#BEF264" label="Bargain" />
              <Legend swatch="#6366F1" label="Too cheap" />
            </div>
          </section>
        )}

        {/* Gabor-Granger demand + revenue */}
        {gg && gg.length > 0 && (
          <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
            <header>
              <h3 className="text-sm font-semibold text-[var(--t1)]">Gabor-Granger Demand Curve</h3>
              <p className="text-xs text-[var(--t3)] mt-0.5">
                Acceptance rate at 5 anchored prices. Revenue = price × acceptance.
              </p>
            </header>
            <GGChart points={gg} symbol={symbol} highlight={ggMax?.price} />
            <table className="w-full text-xs mt-3">
              <thead>
                <tr className="text-[var(--t3)] border-b border-[var(--b1)]">
                  <th className="text-left py-2 font-medium">Price</th>
                  <th className="text-right py-2 font-medium">Acceptance %</th>
                  <th className="text-right py-2 font-medium">Revenue index</th>
                </tr>
              </thead>
              <tbody>
                {gg.map((p) => (
                  <tr
                    key={p.anchorIndex}
                    className={[
                      'border-b border-[var(--b1)]/40',
                      p.price === ggMax?.price ? 'bg-[var(--lime)]/5' : '',
                    ].join(' ')}
                  >
                    <td className="py-2 tabular-nums">{fmt(p.price)}</td>
                    <td className="py-2 text-right tabular-nums">{p.acceptanceRate.toFixed(1)}%</td>
                    <td className="py-2 text-right tabular-nums font-semibold">{p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Industry benchmark callouts */}
        <section className="bg-[var(--bg2)] border border-[var(--b1)] rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--t1)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--lime)]" />
            Industry benchmark callouts
          </h3>
          <ul className="space-y-2 text-xs text-[var(--t2)]">
            <li>
              <span className="text-[var(--t1)] font-semibold">Acceptable range typically spans 30–50% of OPP.</span>{' '}
              Wider = price-insensitive category. Narrower = highly price-elastic.{' '}
              {oppRangePct != null && (
                <span className="text-[var(--lime)]">
                  Your study: {oppRangePct.toFixed(0)}% — {oppRangePct >= 50 ? 'price-insensitive' : oppRangePct >= 30 ? 'normal elasticity' : 'price-elastic'}.
                </span>
              )}
            </li>
            <li>
              <span className="text-[var(--t1)] font-semibold">Revenue-maximizing price is often 10–20% below OPP.</span>{' '}
              Tradeoff between price and volume.
            </li>
            <li>
              <span className="text-[var(--t1)] font-semibold">PMC (Point of Marginal Cheapness)</span> = floor; below this, perceived quality drops.
            </li>
            <li>
              <span className="text-[var(--t1)] font-semibold">PME (Point of Marginal Expensiveness)</span> = ceiling; above this, demand collapses.
            </li>
          </ul>
        </section>

        <p className="text-[11px] text-[var(--t3)] text-center pt-6 max-w-2xl mx-auto">
          Curves derived from synthetic respondents calibrated to the audience spec. Use as directional pricing signal; for high-stakes launches, validate against real-customer panels.
        </p>
      </div>
    </div>
  );
}

function KPICard({
  label, value, sub, highlight,
}: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div
      className={[
        'rounded-2xl p-4 border',
        highlight ? 'border-[var(--lime)]/50 bg-[var(--lime)]/5' : 'border-[var(--b1)] bg-[var(--bg2)]',
      ].join(' ')}
    >
      <p className="text-[10px] uppercase tracking-widest text-[var(--t3)] font-display font-bold">{label}</p>
      <p className={[
        'text-2xl font-display font-black mt-1 tabular-nums',
        highlight ? 'text-[var(--lime)]' : 'text-white',
      ].join(' ')}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-[var(--t3)] mt-1">{sub}</p>}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--t3)]">
      <span className="w-3 h-3 rounded-sm" style={{ background: swatch }} aria-hidden />
      {label}
    </span>
  );
}

function VWChart({ vw, symbol }: { vw: VWAnalysis; symbol: string }) {
  const W = 720, H = 280, PAD_L = 50, PAD_R = 16, PAD_T = 16, PAD_B = 36;
  const all = [
    ...vw.curves.too_cheap, ...vw.curves.bargain,
    ...vw.curves.expensive, ...vw.curves.too_expensive,
  ];
  const xMin = Math.min(...all.map((p) => p.price));
  const xMax = Math.max(...all.map((p) => p.price));
  const xRange = xMax - xMin || 1;
  const x = (price: number) => PAD_L + ((price - xMin) / xRange) * (W - PAD_L - PAD_R);
  const y = (pct: number) => PAD_T + (1 - pct / 100) * (H - PAD_T - PAD_B);
  const path = (curve: CurvePoint[]) =>
    curve
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.price).toFixed(1)} ${y(p.pct).toFixed(1)}`)
      .join(' ');
  const gridPcts = [0, 25, 50, 75, 100];
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Van Westendorp 4-curve plot">
        {/* grid */}
        {gridPcts.map((p) => (
          <line key={p} x1={PAD_L} x2={W - PAD_R} y1={y(p)} y2={y(p)} stroke="#1F2937" strokeWidth={0.5} />
        ))}
        {gridPcts.map((p) => (
          <text key={`l${p}`} x={PAD_L - 6} y={y(p) + 3} textAnchor="end" fontSize="9" fill="#6B7280">{p}%</text>
        ))}
        {/* curves */}
        <path d={path(vw.curves.too_expensive)} stroke="#F87171" strokeWidth={2} fill="none" />
        <path d={path(vw.curves.expensive)}    stroke="#FB923C" strokeWidth={2} fill="none" />
        <path d={path(vw.curves.bargain)}      stroke="#BEF264" strokeWidth={2} fill="none" />
        <path d={path(vw.curves.too_cheap)}    stroke="#6366F1" strokeWidth={2} fill="none" />
        {/* intersection markers */}
        {(['pmc','pme','ipp','opp'] as const).map((k, i) => {
          const v = vw[k];
          if (v == null || !Number.isFinite(v)) return null;
          const xc = x(v);
          const yc = H - PAD_B - 10 - i * 10;
          return (
            <g key={k}>
              <line x1={xc} x2={xc} y1={PAD_T} y2={H - PAD_B} stroke="#BEF264" strokeWidth={0.5} strokeDasharray="3 3" />
              <text x={xc + 4} y={yc} fontSize="10" fill="#BEF264" fontWeight="600">
                {k.toUpperCase()} {symbol}{v.toFixed(2)}
              </text>
            </g>
          );
        })}
        {/* x-axis label */}
        <text x={(W - PAD_R + PAD_L) / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#6B7280">
          Price ({symbol.trim() || 'price'}) →
        </text>
      </svg>
    </div>
  );
}

function GGChart({
  points, symbol, highlight,
}: {
  points: GGPoint[];
  symbol: string;
  highlight?: number;
}) {
  const W = 720, H = 240, PAD_L = 50, PAD_R = 16, PAD_T = 16, PAD_B = 32;
  const xMin = Math.min(...points.map((p) => p.price));
  const xMax = Math.max(...points.map((p) => p.price));
  const xRange = xMax - xMin || 1;
  const x = (price: number) => PAD_L + ((price - xMin) / xRange) * (W - PAD_L - PAD_R);
  const yAccept = (pct: number) => PAD_T + (1 - pct / 100) * (H - PAD_T - PAD_B);
  const maxRev = Math.max(...points.map((p) => p.revenue), 1);
  const yRev = (rev: number) => PAD_T + (1 - rev / maxRev) * (H - PAD_T - PAD_B);
  const acceptPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.price).toFixed(1)} ${yAccept(p.acceptanceRate).toFixed(1)}`)
    .join(' ');
  const revPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.price).toFixed(1)} ${yRev(p.revenue).toFixed(1)}`)
    .join(' ');
  const gridPcts = [0, 25, 50, 75, 100];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Gabor-Granger demand and revenue curves">
        {gridPcts.map((p) => (
          <line key={p} x1={PAD_L} x2={W - PAD_R} y1={yAccept(p)} y2={yAccept(p)} stroke="#1F2937" strokeWidth={0.5} />
        ))}
        {gridPcts.map((p) => (
          <text key={`l${p}`} x={PAD_L - 6} y={yAccept(p) + 3} textAnchor="end" fontSize="9" fill="#6B7280">{p}%</text>
        ))}
        {/* acceptance curve (lime) */}
        <path d={acceptPath} stroke="#BEF264" strokeWidth={2} fill="none" />
        {/* revenue curve (purple, dashed) */}
        <path d={revPath} stroke="#6366F1" strokeWidth={2} strokeDasharray="4 4" fill="none" />
        {/* anchor markers */}
        {points.map((p) => {
          const isHighlight = highlight != null && p.price === highlight;
          return (
            <g key={p.anchorIndex}>
              <circle cx={x(p.price)} cy={yAccept(p.acceptanceRate)} r={isHighlight ? 5 : 3} fill={isHighlight ? '#BEF264' : '#9CA3AF'} />
              <text x={x(p.price)} y={H - PAD_B + 14} textAnchor="middle" fontSize="9" fill={isHighlight ? '#BEF264' : '#6B7280'} fontWeight={isHighlight ? '700' : '400'}>
                {symbol}{p.price.toFixed(2)}
              </text>
              {isHighlight && (
                <text x={x(p.price)} y={yAccept(p.acceptanceRate) - 8} textAnchor="middle" fontSize="9" fill="#BEF264" fontWeight="700">
                  Revenue max
                </text>
              )}
            </g>
          );
        })}
        {/* legend */}
        <g transform={`translate(${PAD_L} ${H - 8})`}>
          <line x1={0} x2={14} y1={0} y2={0} stroke="#BEF264" strokeWidth={2} />
          <text x={18} y={3} fontSize="9" fill="#6B7280">Acceptance</text>
          <line x1={90} x2={104} y1={0} y2={0} stroke="#6366F1" strokeWidth={2} strokeDasharray="3 3" />
          <text x={108} y={3} fontSize="9" fill="#6B7280">Revenue (rel.)</text>
        </g>
      </svg>
    </div>
  );
}

export default PricingResultsPage;
// Suppress unused-import — DollarSign is exported for future affordances.
void DollarSign;
