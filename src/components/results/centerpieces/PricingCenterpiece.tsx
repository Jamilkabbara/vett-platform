/**
 * Pass 46 Phase 4 — Pricing report centerpiece.
 *
 * The research-grade headline + hero visual that sits directly under the
 * page header, ABOVE the existing pricing dashboard ("Supporting Detail"
 * layer). This is the most research-grade-looking methodology in the suite,
 * so the Van Westendorp 4-line chart is the centerpiece — clean and legible.
 *
 * Reads the deterministic block computed by
 *   vettit-backend/src/services/analysis/pricing.js → computePricing()
 * verbatim. We render prose + plots ABOUT that object; we never recompute
 * the methodology math (the page's own legacy charts do their own thing —
 * this centerpiece is a faithful view of the deterministic analysis).
 *
 * Block shape (quoted from computePricing):
 *   { methodology:'pricing', currency, n,
 *     van_westendorp:{
 *       curves:{ too_cheap:[{x,y}], bargain, expensive, too_expensive },
 *       points:{ pmc, pme, opp, ipp } }|null,        // x=price, y=percent 0–100
 *     van_westendorp_degenerate_reason?,
 *     gabor_granger:{
 *       ladder:[{ price, n, demand_pct, revenue_index }],
 *       optimal_price }|null,
 *     gabor_granger_degenerate_reason?,
 *     wtp_ceiling:ratingStats|null,                  // {mean,stddev,n,ci_low,ci_high}
 *     acceptable_range:{ low, high }|null }           // = [PMC, PME]
 *
 * CREDIBILITY DOCTRINE (mandatory):
 *  - the base n is always on screen; small samples (n<10) read as
 *    "directional", never a confident price
 *  - VW curve y-values are already percent (0–100); GG demand_pct likewise
 *  - revenue_index is in currency units (price × demand share) — a relative
 *    revenue signal, not absolute revenue; we label it as such
 *  - plain language; honest null-state instead of a faked chart
 *  - if VW is null but GG exists we render GG alone (and vice-versa)
 */

// Pass 46 Phase 4 — directional-signal floor: below this the sample is too
// thin to quote a confident price, matching the pricing.js n-guard philosophy.
const SMALL_N = 10;

// Currency symbol map (mirrors PricingResultsPage). Falls back to the ISO
// code + space when unknown so "AED 40" still reads correctly.
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', BRL: 'R$',
  AED: 'AED ', SAR: 'SAR ', CAD: 'C$', AUD: 'A$',
};

interface CurvePoint { x: number; y: number } // x = price, y = percent 0–100
interface VWBlock {
  curves: {
    too_cheap: CurvePoint[];
    bargain: CurvePoint[];
    expensive: CurvePoint[];
    too_expensive: CurvePoint[];
  };
  points: { pmc: number | null; pme: number | null; opp: number | null; ipp: number | null };
  n?: number;
}
interface GGRung { price: number; n: number; demand_pct: number; revenue_index: number }
interface GGBlock { ladder: GGRung[]; optimal_price: number }

// Pass 46 Phase 4 — honest null-state card. Never a faked chart.
function NullState({ reason }: { reason: string }) {
  return (
    <section className="px-6 pt-2 pb-4 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-b2 bg-bg3 px-5 py-4">
        <h2 className="font-display font-bold text-t1 text-sm">Pricing report</h2>
        <p className="text-xs text-t3 mt-1 leading-relaxed">{reason}</p>
      </div>
    </section>
  );
}

/** Plain-language gloss on a backend degenerate_reason string. */
function reasonGloss(reason: string | null | undefined, fallback: string): string {
  if (!reason) return fallback;
  return `${fallback} (${reason})`;
}

export function PricingCenterpiece({ analysis }: { analysis: any; mission: any }) {
  // ── Honest null-states ────────────────────────────────────────────────
  if (!analysis || typeof analysis !== 'object') {
    return (
      <NullState reason="No deterministic pricing analysis is attached to this mission yet. Re-run synthesis to generate a full Van Westendorp + Gabor-Granger report." />
    );
  }
  const block = analysis.methodology === 'pricing' ? analysis : (analysis.pricing ?? null);
  if (!block || block.methodology !== 'pricing') {
    return (
      <NullState reason="This mission has analysis, but no pricing block. Pricing requires a Van Westendorp or Gabor-Granger instrument captured at run time." />
    );
  }

  const vw: VWBlock | null = block.van_westendorp ?? null;
  const gg: GGBlock | null = block.gabor_granger ?? null;

  // Both methodology blocks null → there is genuinely nothing to plot.
  if (!vw && !gg) {
    const vwReason = reasonGloss(block.van_westendorp_degenerate_reason, 'Van Westendorp could not be computed');
    const ggReason = reasonGloss(block.gabor_granger_degenerate_reason, 'Gabor-Granger could not be computed');
    return (
      <NullState reason={`Neither pricing model produced a result. ${vwReason}; ${ggReason}. The survey likely lacked enough clean numeric price answers to draw a curve.`} />
    );
  }

  const currency = typeof block.currency === 'string' && block.currency.length > 0 ? block.currency : 'USD';
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const fmt = (n: number | null | undefined) =>
    n == null || !Number.isFinite(n) ? '—' : `${symbol}${Number(n).toFixed(2)}`;

  // Per-model base n (honest): VW carries its own complete-case n; GG's base
  // is the thinnest rung (the floor of confidence across the ladder).
  const vwN = vw?.n ?? block.n ?? 0;
  const ggMinN = gg && gg.ladder.length ? Math.min(...gg.ladder.map((r) => r.n)) : 0;

  const range: { low: number; high: number } | null = block.acceptable_range ?? null;
  const opp = vw?.points?.opp ?? null;
  const ggOptimal = gg?.optimal_price ?? null;

  // ── (a) CONSUMER-FIRST HEADLINE ───────────────────────────────────────
  // Hero number = the optimal price the buyer should anchor on. Prefer the
  // Van Westendorp OPP (price of minimum resistance); if VW is degenerate
  // but GG ran, fall back to the revenue-maximizing GG anchor.
  let heroNumber = '—';
  let headlineSentence = '';
  let headlineN = vwN;

  if (opp != null && Number.isFinite(opp)) {
    heroNumber = fmt(opp);
    headlineN = vwN;
    const rangeText = range
      ? ` Acceptable range spans ${fmt(range.low)}–${fmt(range.high)}.`
      : '';
    headlineSentence = vwN < SMALL_N
      ? `Directional: the price of least resistance lands near ${fmt(opp)}, but with only n=${vwN} complete price profiles this is an early signal, not a confident number.${rangeText}`
      : `The price of least resistance is ${fmt(opp)} — where the fewest people call it either too cheap or too expensive (n=${vwN}).${rangeText}`;
  } else if (ggOptimal != null && Number.isFinite(ggOptimal)) {
    heroNumber = fmt(ggOptimal);
    headlineN = ggMinN;
    headlineSentence = ggMinN < SMALL_N
      ? `Directional: revenue peaks around ${fmt(ggOptimal)} on the demand ladder, but the thinnest price rung has only n=${ggMinN} — treat as an early signal. Van Westendorp did not converge, so there is no separate optimal-price read.`
      : `Revenue is maximized at ${fmt(ggOptimal)} on the Gabor-Granger demand ladder (thinnest rung n=${ggMinN}). Van Westendorp did not converge, so the demand curve carries the pricing read.`;
  } else {
    // Both ran but neither yielded a usable optimal price (e.g. VW curves
    // never intersect). Be honest rather than invent a number.
    heroNumber = range ? `${fmt(range?.low)}–${fmt(range?.high)}` : '—';
    headlineSentence = range
      ? `The acceptable price band runs ${fmt(range.low)}–${fmt(range.high)}, but the curves never cross at a single optimal point — read the band, not a single price.`
      : 'The pricing models ran but did not converge on an optimal price or an acceptable band. Read the curves below as directional shape only.';
  }

  return (
    <section className="px-6 pt-2 pb-6 max-w-6xl mx-auto space-y-5">
      {/* ── (a) CONSUMER-FIRST HEADLINE ─────────────────────────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-pur font-display font-bold">
          Pricing · Headline
        </p>
        <div className="mt-2 flex flex-col md:flex-row md:items-end gap-3 md:gap-6">
          <span
            className="font-display font-black tabular-nums leading-none text-lime"
            style={{ fontSize: '3.25rem' }}
          >
            {heroNumber}
          </span>
          <p className="font-body text-t1 text-base md:text-lg leading-snug md:pb-1">
            {headlineSentence}
          </p>
        </div>
        <p className="text-xs text-t3 mt-3 font-body">
          {vw ? `Van Westendorp: ${vwN} complete price profile${vwN === 1 ? '' : 's'}` : 'Van Westendorp: not computed'}
          {' · '}
          {gg ? `Gabor-Granger: ${gg.ladder.length} price rung${gg.ladder.length === 1 ? '' : 's'}` : 'Gabor-Granger: not computed'}
          {' · '}
          currency {currency}
          {headlineN < SMALL_N ? ' · directional (small sample)' : ''}
        </p>
      </div>

      {/* ── (b) CENTERPIECE — Van Westendorp 4-line chart ─────────────────── */}
      {vw ? (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h3 className="font-display font-bold text-t1 text-sm">Van Westendorp price sensitivity</h3>
            <div className="flex items-center gap-3 text-[10px] text-t3 flex-wrap">
              <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-[2px] bg-indigo" /> Too cheap</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-[2px] bg-lime" /> Bargain</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-[2px] bg-org" /> Expensive</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-[2px] bg-red" /> Too expensive</span>
            </div>
          </div>
          <VanWestendorpChart vw={vw} symbol={symbol} />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            <PointCard label="PMC" sub="floor — below = cheap" value={fmt(vw.points.pmc)} symbol={symbol} />
            <PointCard label="OPP" sub="optimal price point" value={fmt(vw.points.opp)} symbol={symbol} highlight />
            <PointCard label="IPP" sub="indifference point" value={fmt(vw.points.ipp)} symbol={symbol} />
            <PointCard label="PME" sub="ceiling — above = costly" value={fmt(vw.points.pme)} symbol={symbol} />
          </div>
          <p className="text-[10px] text-t3 mt-3 font-body leading-relaxed">
            Four cumulative curves built from {vwN} respondent{vwN === 1 ? '' : 's'} who answered all four price
            questions. PMC = too-cheap × expensive; PME = bargain × too-expensive; OPP = too-cheap × too-expensive;
            IPP = bargain × expensive. The acceptable band is [PMC, PME].
            {vwN < SMALL_N ? ' Small sample — read direction, not exact crossings.' : ''}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-4">
          <h3 className="font-display font-bold text-t1 text-sm">Van Westendorp price sensitivity</h3>
          <p className="text-xs text-t3 mt-1 leading-relaxed">
            {reasonGloss(block.van_westendorp_degenerate_reason, 'Not enough clean four-band price profiles to draw the sensitivity curves')}.
            {gg ? ' The Gabor-Granger demand ladder below carries the pricing read.' : ''}
          </p>
        </div>
      )}

      {/* ── (b cont.) Gabor-Granger demand + revenue ──────────────────────── */}
      {gg ? (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h3 className="font-display font-bold text-t1 text-sm">Gabor-Granger demand &amp; revenue</h3>
            <div className="flex items-center gap-3 text-[10px] text-t3">
              <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-[2px] bg-lime" /> Demand %</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-pur/50" /> Revenue index</span>
            </div>
          </div>
          <GaborGrangerChart gg={gg} symbol={symbol} />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-xs font-body border-collapse">
              <thead>
                <tr className="text-t3 border-b border-b2 text-left">
                  <th className="py-2 pr-3 font-medium">Price</th>
                  <th className="py-2 px-2 font-medium text-right">Demand</th>
                  <th className="py-2 px-2 font-medium text-right">Revenue index</th>
                  <th className="py-2 pl-2 font-medium text-right">Base n</th>
                </tr>
              </thead>
              <tbody>
                {gg.ladder.map((r) => {
                  const optimal = r.price === gg.optimal_price;
                  const thin = r.n < SMALL_N;
                  return (
                    <tr key={r.price} className={`border-b border-b2/40 ${optimal ? 'bg-lime-10' : ''}`}>
                      <td className="py-2 pr-3 text-t1 tabular-nums">
                        {fmt(r.price)}
                        {optimal && <span className="ml-1 text-[10px] text-lime font-semibold">revenue-max</span>}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-t1">{r.demand_pct.toFixed(1)}%</td>
                      <td className="py-2 px-2 text-right tabular-nums font-semibold text-t1">{r.revenue_index.toFixed(2)}</td>
                      <td className="py-2 pl-2 text-right tabular-nums text-t3">
                        {r.n}{thin ? <span className="ml-1 text-[10px]">(directional)</span> : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-t3 mt-3 font-body leading-relaxed">
            Demand = share answering "definitely/probably would buy" at each anchor price. Revenue index = price ×
            demand share (relative revenue signal in {currency}, not absolute revenue). Revenue peaks at{' '}
            {fmt(gg.optimal_price)}{ggMinN < SMALL_N ? ' — directional, thinnest rung n=' + ggMinN : ''}.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-4">
          <h3 className="font-display font-bold text-t1 text-sm">Gabor-Granger demand &amp; revenue</h3>
          <p className="text-xs text-t3 mt-1 leading-relaxed">
            {reasonGloss(block.gabor_granger_degenerate_reason, 'No price rung produced a usable demand reading')}.
            {vw ? ' The Van Westendorp chart above carries the pricing read.' : ''}
          </p>
        </div>
      )}
    </section>
  );
}

/** A single Van Westendorp intersection point, surfaced as a credibility card. */
function PointCard({
  label, sub, value, symbol, highlight,
}: { label: string; sub: string; value: string; symbol: string; highlight?: boolean }) {
  void symbol; // symbol already baked into `value` via fmt(); kept for call-site clarity
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${highlight ? 'border-lime/50 bg-lime-10' : 'border-b2 bg-bg'}`}>
      <p className="text-[10px] uppercase tracking-widest font-display font-bold text-t3">{label}</p>
      <p className={`text-lg font-display font-black tabular-nums mt-0.5 ${highlight ? 'text-lime' : 'text-t1'}`}>{value}</p>
      <p className="text-[9px] text-t3 mt-0.5 leading-tight">{sub}</p>
    </div>
  );
}

/**
 * The Van Westendorp 4-line chart. viewBox-driven so it scales fluidly
 * (className="w-full h-auto"). Price on the x-axis, cumulative % (0–100) on
 * the y-axis; the four curves and the four intersection points (PMC/PME/
 * OPP/IPP) are plotted on one plane. Curve y-values come straight from the
 * backend (already percent), so this is a faithful plot, not a recompute.
 */
function VanWestendorpChart({ vw, symbol }: { vw: VWBlock; symbol: string }) {
  const VB_W = 760, VB_H = 320;
  const PAD_L = 44, PAD_R = 16, PAD_T = 16, PAD_B = 40;
  const plotW = VB_W - PAD_L - PAD_R;
  const plotH = VB_H - PAD_T - PAD_B;

  const all = [
    ...vw.curves.too_cheap, ...vw.curves.bargain,
    ...vw.curves.expensive, ...vw.curves.too_expensive,
  ];
  const xs = all.map((p) => p.x).filter((n) => Number.isFinite(n));
  // Fold the intersection x-values into the domain so off-grid crossings stay on-canvas.
  for (const k of ['pmc', 'pme', 'opp', 'ipp'] as const) {
    const v = vw.points[k];
    if (v != null && Number.isFinite(v)) xs.push(v);
  }
  const xMin = xs.length ? Math.min(...xs) : 0;
  const xMaxRaw = xs.length ? Math.max(...xs) : 1;
  const xMax = xMaxRaw === xMin ? xMin + 1 : xMaxRaw;
  const xRange = xMax - xMin;

  const x = (price: number) => PAD_L + ((price - xMin) / xRange) * plotW;
  const y = (pct: number) => PAD_T + (1 - Math.max(0, Math.min(100, pct)) / 100) * plotH;

  const path = (curve: CurvePoint[]) =>
    curve
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.x).toFixed(1)} ${y(p.y).toFixed(1)}`)
      .join(' ');

  const yGrid = [0, 25, 50, 75, 100];
  // Up to 5 evenly spaced price ticks across the domain.
  const xTicks = Array.from({ length: 5 }, (_, i) => xMin + (xRange * i) / 4);

  // Intersection markers, stacked vertically in label rows so they don't collide.
  const POINTS: { key: 'pmc' | 'opp' | 'ipp' | 'pme'; label: string }[] = [
    { key: 'pmc', label: 'PMC' },
    { key: 'opp', label: 'OPP' },
    { key: 'ipp', label: 'IPP' },
    { key: 'pme', label: 'PME' },
  ];

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="w-full h-auto mt-4"
      role="img"
      aria-label="Van Westendorp four-curve price sensitivity chart"
    >
      {/* y grid + labels */}
      {yGrid.map((p) => (
        <g key={`y${p}`}>
          <line x1={PAD_L} x2={VB_W - PAD_R} y1={y(p)} y2={y(p)} className="stroke-b1" strokeWidth={0.5} />
          <text x={PAD_L - 6} y={y(p) + 3} textAnchor="end" className="fill-t3 font-body" style={{ fontSize: '9px' }}>{p}%</text>
        </g>
      ))}
      {/* x ticks + labels */}
      {xTicks.map((p, i) => (
        <text key={`x${i}`} x={x(p)} y={VB_H - PAD_B + 14} textAnchor="middle" className="fill-t3 font-body" style={{ fontSize: '9px' }}>
          {symbol}{p >= 100 ? Math.round(p) : p.toFixed(p < 10 ? 1 : 0)}
        </text>
      ))}
      {/* curves */}
      <path d={path(vw.curves.too_cheap)} className="stroke-indigo" strokeWidth={2} fill="none" />
      <path d={path(vw.curves.bargain)} className="stroke-lime" strokeWidth={2} fill="none" />
      <path d={path(vw.curves.expensive)} className="stroke-org" strokeWidth={2} fill="none" />
      <path d={path(vw.curves.too_expensive)} className="stroke-red" strokeWidth={2} fill="none" />
      {/* intersection markers */}
      {POINTS.map((pt, i) => {
        const v = vw.points[pt.key];
        if (v == null || !Number.isFinite(v)) return null;
        const xc = x(v);
        const labelY = PAD_T + 12 + i * 13;
        const flip = xc > VB_W - 110; // keep labels on-canvas near the right edge
        return (
          <g key={pt.key}>
            <line x1={xc} x2={xc} y1={PAD_T} y2={VB_H - PAD_B} className="stroke-lime/40" strokeWidth={0.75} strokeDasharray="3 3" />
            <circle cx={xc} cy={VB_H - PAD_B} r={3} className="fill-lime" />
            <text
              x={flip ? xc - 5 : xc + 5}
              y={labelY}
              textAnchor={flip ? 'end' : 'start'}
              className="fill-lime font-display tabular-nums"
              style={{ fontSize: '10px', fontWeight: 700 }}
            >
              {pt.label} {symbol}{Number(v).toFixed(2)}
            </text>
          </g>
        );
      })}
      {/* axis label */}
      <text x={PAD_L + plotW / 2} y={VB_H - 4} textAnchor="middle" className="fill-t3 font-body" style={{ fontSize: '10px' }}>
        Price ({symbol.trim() || currencyLabel}) →
      </text>
    </svg>
  );
}

// Fallback x-axis word when the symbol is empty (defensive — symbol always set here).
const currencyLabel = 'price';

/**
 * Gabor-Granger demand-and-revenue chart. viewBox-driven. Revenue index is
 * drawn as bars (left→right by price), demand % as a line overlay sharing
 * the same price x-axis; each axis has its own scale. The revenue-maximizing
 * anchor is flagged.
 */
function GaborGrangerChart({ gg, symbol }: { gg: GGBlock; symbol: string }) {
  const VB_W = 760, VB_H = 280;
  const PAD_L = 44, PAD_R = 44, PAD_T = 16, PAD_B = 40;
  const plotW = VB_W - PAD_L - PAD_R;
  const plotH = VB_H - PAD_T - PAD_B;

  const ladder = [...gg.ladder].sort((a, b) => a.price - b.price);
  const n = ladder.length;
  const maxRev = Math.max(...ladder.map((r) => r.revenue_index), 1);

  // Bars get evenly spaced slots; the demand line samples each slot center.
  const slotW = plotW / Math.max(1, n);
  const barW = Math.min(slotW * 0.55, 48);
  const slotCenter = (i: number) => PAD_L + slotW * i + slotW / 2;

  const yDemand = (pct: number) => PAD_T + (1 - Math.max(0, Math.min(100, pct)) / 100) * plotH;
  const yRevTop = (rev: number) => PAD_T + (1 - rev / maxRev) * plotH;

  const demandPath = ladder
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${slotCenter(i).toFixed(1)} ${yDemand(r.demand_pct).toFixed(1)}`)
    .join(' ');

  const yGrid = [0, 25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="w-full h-auto mt-4"
      role="img"
      aria-label="Gabor-Granger demand and revenue chart"
    >
      {/* y grid (demand %, left axis) */}
      {yGrid.map((p) => (
        <g key={`y${p}`}>
          <line x1={PAD_L} x2={VB_W - PAD_R} y1={yDemand(p)} y2={yDemand(p)} className="stroke-b1" strokeWidth={0.5} />
          <text x={PAD_L - 6} y={yDemand(p) + 3} textAnchor="end" className="fill-t3 font-body" style={{ fontSize: '9px' }}>{p}%</text>
        </g>
      ))}
      {/* revenue bars */}
      {ladder.map((r, i) => {
        const cx = slotCenter(i);
        const top = yRevTop(r.revenue_index);
        const h = (VB_H - PAD_B) - top;
        const optimal = r.price === gg.optimal_price;
        return (
          <g key={`bar${r.price}`}>
            <rect
              x={cx - barW / 2}
              y={top}
              width={barW}
              height={Math.max(0, h)}
              rx={2}
              className={optimal ? 'fill-pur' : 'fill-pur/40'}
            />
            {optimal && (
              <text x={cx} y={top - 4} textAnchor="middle" className="fill-pur font-display" style={{ fontSize: '9px', fontWeight: 700 }}>
                rev-max
              </text>
            )}
            {/* price tick */}
            <text x={cx} y={VB_H - PAD_B + 14} textAnchor="middle" className={`font-body ${optimal ? 'fill-lime' : 'fill-t3'}`} style={{ fontSize: '9px', fontWeight: optimal ? 700 : 400 }}>
              {symbol}{r.price >= 100 ? Math.round(r.price) : r.price.toFixed(r.price < 10 ? 1 : 0)}
            </text>
          </g>
        );
      })}
      {/* demand line + dots */}
      <path d={demandPath} className="stroke-lime" strokeWidth={2} fill="none" />
      {ladder.map((r, i) => (
        <circle key={`dot${r.price}`} cx={slotCenter(i)} cy={yDemand(r.demand_pct)} r={r.price === gg.optimal_price ? 4 : 3} className="fill-lime" />
      ))}
      {/* axis labels */}
      <text x={PAD_L + plotW / 2} y={VB_H - 4} textAnchor="middle" className="fill-t3 font-body" style={{ fontSize: '10px' }}>
        Anchor price ({symbol.trim() || currencyLabel}) →
      </text>
      <text x={VB_W - PAD_R + 8} y={PAD_T + 4} className="fill-pur font-body" style={{ fontSize: '9px' }}>rev →</text>
    </svg>
  );
}

export default PricingCenterpiece;
