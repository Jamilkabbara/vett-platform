/**
 * Pass 46 Phase 4 — Churn (driver tree + win-back) report centerpiece.
 *
 * The research-grade headline + hero visual that sits directly under the
 * page header, ABOVE the existing dashboard ("Supporting Detail" layer).
 *
 * Reads the deterministic block computed by
 *   vettit-backend/src/services/analysis/churn.js → computeChurn()
 * verbatim. We render prose ABOUT that object; we never recompute math.
 *
 * Block shape (quoted from computeChurn):
 *   { methodology:'churn', n,
 *     drivers:{ ranked:[{reason,count,pct_of_respondents}], n, selections } | null,
 *     satisfaction_at_churn | null,
 *     winback:{ winnable_pct, n, distribution } | null,
 *     winback_triggers:{ ranked:[{reason,count,pct_of_respondents}], n, selections } | null,
 *     switching | null, ces_at_exit | null, warning_signs | null, tenure | null,
 *     reason_verbatims:[] }
 *
 * Base discipline: drivers/triggers are % OF RESPONDENTS (personas with ≥1
 * selection), winback is % of scalar answers. Both `n`s are surfaced.
 *
 * CREDIBILITY DOCTRINE (matches BrandLiftCenterpiece):
 *  - every % shows its base n
 *  - small base (n<10) reads as directional, never a confident %
 *  - never fake a chart: honest null-state; any null sub-block is omitted
 */

const SMALL_N = 10;

interface RankedRow { reason: string; count: number; pct_of_respondents: number }
interface Ranked { ranked: RankedRow[]; n: number; selections?: number }
interface Winback { winnable_pct: number; n: number; distribution?: Record<string, number> }

// Pass 46 Phase 4 — honest null-state card. Never a fake chart.
function NullState({ reason }: { reason: string }) {
  return (
    <section className="px-6 pt-2 pb-4 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-b2 bg-bg3 px-5 py-4">
        <h2 className="font-display font-bold text-t1 text-sm">Churn report</h2>
        <p className="text-xs text-t3 mt-1 leading-relaxed">{reason}</p>
      </div>
    </section>
  );
}

export function ChurnCenterpiece({ analysis }: { analysis: any; mission: any }) {
  // ── Honest null-states ────────────────────────────────────────────────
  if (!analysis || typeof analysis !== 'object') {
    return (
      <NullState reason="No deterministic churn analysis is attached to this mission yet. Re-run synthesis to generate a full driver-tree + win-back report." />
    );
  }
  const block = analysis.churn ?? (analysis.methodology === 'churn' ? analysis : null);
  if (!block || block.methodology !== 'churn') {
    return (
      <NullState reason="This mission has analysis, but no churn block. The driver tree + win-back report requires the churn survey instrument captured at run time." />
    );
  }

  const drivers: Ranked | null =
    block.drivers && Array.isArray(block.drivers.ranked) ? block.drivers : null;
  const winback: Winback | null = block.winback ?? null;

  if (!drivers && !winback) {
    return (
      <NullState reason="The churn instrument ran, but neither churn drivers nor win-back potential scored (the reason and win-back questions were empty). Re-run with a larger sample to populate the report." />
    );
  }

  // ── Headline: #1 churn driver + winnable %, n-honest. ──────────────────
  const top = drivers?.ranked?.[0] ?? null;
  let heroNumber = '—';
  const headlineBits: string[] = [];
  if (top) {
    heroNumber = `${Math.round(top.pct_of_respondents)}%`;
    const thin = (drivers?.n ?? 0) < SMALL_N;
    headlineBits.push(
      thin
        ? `${top.reason} is the most-cited churn reason — directional ${heroNumber} of leavers (n=${drivers?.n}); too thin for a confident share.`
        : `${top.reason} is the #1 churn driver — ${heroNumber} of leavers (n=${drivers?.n}).`,
    );
  }
  if (winback) {
    const w = `${Math.round(winback.winnable_pct)}%`;
    if (!top) heroNumber = w;
    const thin = winback.n < SMALL_N;
    headlineBits.push(
      thin
        ? `Directionally, ${w} say they're winnable (n=${winback.n}).`
        : `${w} are winnable with the right incentive (n=${winback.n}).`,
    );
  }
  const headlineSentence = headlineBits.join(' ');

  const baseParts: string[] = [];
  if (drivers) baseParts.push(`drivers base n=${drivers.n} respondents${drivers.selections ? `, ${drivers.selections} selections` : ''}`);
  if (winback) baseParts.push(`win-back base n=${winback.n}`);

  return (
    <section className="px-6 pt-2 pb-6 max-w-6xl mx-auto space-y-5">
      {/* ── (a) HEADLINE ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-pur font-display font-bold">
          Churn · Headline
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
          {baseParts.join(' · ')}
          {' · '}
          driver shares are % of respondents (each leaver may cite several reasons).
        </p>
      </div>

      {/* ── (b) CENTERPIECE — ranked driver bars + win-back gauge ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Ranked churn-driver bars */}
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <h3 className="font-display font-bold text-t1 text-sm">Why customers leave — ranked drivers</h3>
          {drivers ? (
            <DriverBars drivers={drivers} />
          ) : (
            <p className="text-xs text-t3 mt-3 font-body leading-relaxed">
              No churn-reason question scored for this run — the reason-category item was empty.
            </p>
          )}
        </div>

        {/* Win-back potential gauge */}
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <h3 className="font-display font-bold text-t1 text-sm">Win-back potential</h3>
          {winback ? (
            <WinbackGauge winback={winback} />
          ) : (
            <p className="text-xs text-t3 mt-3 font-body leading-relaxed">
              No win-back question scored for this run.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Ranked churn-driver horizontal bars: each "reason — pct% (count/n)".
 * Pure flex/Tailwind bars (no SVG needed — bars are simple proportional
 * fills, matching the established results-page bar idiom).
 */
function DriverBars({ drivers }: { drivers: Ranked }) {
  const rows = drivers.ranked.slice(0, 8);
  const maxPct = Math.max(1, ...rows.map((r) => r.pct_of_respondents));
  const thin = drivers.n < SMALL_N;
  return (
    <div className="mt-3 space-y-2">
      {rows.map((r, i) => {
        const w = Math.max(2, (r.pct_of_respondents / maxPct) * 100);
        const isTop = i === 0;
        return (
          <div key={r.reason} className="grid grid-cols-[120px_1fr_104px] gap-3 items-center text-xs">
            <span className="text-t3 truncate" title={r.reason}>{r.reason}</span>
            <div className="relative h-4 bg-t3/15 rounded">
              <div
                className={`absolute top-0 left-0 h-full rounded ${isTop ? 'bg-lime' : 'bg-lime/55'}`}
                style={{ width: `${w}%` }}
              />
            </div>
            <span className="text-right tabular-nums text-t1 font-semibold">
              {Math.round(r.pct_of_respondents)}%{' '}
              <span className="text-t3 font-normal">({r.count}/{drivers.n})</span>
            </span>
          </div>
        );
      })}
      <p className="text-[10px] text-t3 mt-2 font-body leading-relaxed">
        Bars scaled to the top reason. Shares are % of {drivers.n} respondent{drivers.n === 1 ? '' : 's'}
        {thin ? ' — directional at this base' : ''}; each leaver could pick several reasons.
      </p>
    </div>
  );
}

/**
 * Win-back semicircular arc gauge for winnable_pct. viewBox-driven inline
 * SVG (w-full h-auto). A muted background arc with a lime value arc and the
 * percentage big in the center.
 */
function WinbackGauge({ winback }: { winback: Winback }) {
  const pct = Math.max(0, Math.min(100, winback.winnable_pct));
  const thin = winback.n < SMALL_N;
  // Geometry: semicircle from 180° (left) to 0° (right), radius R about (cx,cy).
  const VB_W = 240;
  const VB_H = 150;
  const cx = VB_W / 2;
  const cy = 120;
  const R = 96;
  const STROKE = 18;

  const polar = (frac: number) => {
    const ang = Math.PI - frac * Math.PI; // 0 → left (180°), 1 → right (0°)
    return { x: cx + R * Math.cos(ang), y: cy - R * Math.sin(ang) };
  };
  const start = polar(0);
  const end = polar(1);
  const valEnd = polar(pct / 100);
  const bigArc = 0; // semicircle, always <180° per half
  const bgPath = `M ${start.x} ${start.y} A ${R} ${R} 0 ${bigArc} 1 ${end.x} ${end.y}`;
  const valPath = `M ${start.x} ${start.y} A ${R} ${R} 0 ${pct > 50 ? 1 : 0} 1 ${valEnd.x} ${valEnd.y}`;

  return (
    <div className="mt-2">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Win-back potential ${Math.round(pct)} percent`}
      >
        <path d={bgPath} className="stroke-t3/20" fill="none" strokeWidth={STROKE} strokeLinecap="round" />
        {pct > 0 && (
          <path d={valPath} className="stroke-lime" fill="none" strokeWidth={STROKE} strokeLinecap="round" />
        )}
        <text x={cx} y={cy - 24} textAnchor="middle" className="fill-lime font-display tabular-nums" style={{ fontSize: '40px', fontWeight: 900 }}>
          {`${Math.round(pct)}%`}
        </text>
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-t3 font-body" style={{ fontSize: '11px' }}>
          {thin ? `winnable · directional, n=${winback.n}` : `winnable · n=${winback.n}`}
        </text>
      </svg>
      <p className="text-[10px] text-t3 mt-1 font-body leading-relaxed text-center">
        Share who answered &ldquo;Yes&rdquo; they&apos;d return with the right incentive. &ldquo;Maybe&rdquo; is held out of this figure.
      </p>
    </div>
  );
}

export default ChurnCenterpiece;
