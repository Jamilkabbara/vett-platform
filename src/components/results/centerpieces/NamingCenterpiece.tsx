/**
 * Pass 46 Phase 4 — Naming & Messaging report centerpiece.
 *
 * The research-grade headline + hero visual that sits directly under the
 * page header, ABOVE the existing dashboard ("Supporting Detail" layer).
 *
 * Reads the deterministic block computed by
 *   vettit-backend/src/services/analysis/naming.js → computeNaming()
 * verbatim. We render prose ABOUT that object; we never recompute math.
 *
 * Block shape (quoted from computeNaming):
 *   { methodology:'naming', n,
 *     candidates:[{ candidate_id, label, composite,
 *       criteria:{ <criterion>: ratingStats{mean,stddev,n,ci_low,ci_high} },
 *       pairwise_win_rate:{ pct, wins, appearances } | null }],
 *     pairwise:{ comparisons } | null,
 *     turf:{ question_id, base, ladder:[{option,candidate_id,
 *            incremental_reach_pct,cumulative_reach_pct}] } | null,
 *     winner:{ candidate_id, by:'pairwise_win_rate'|'composite' } | null }
 *
 * CREDIBILITY DOCTRINE (mandatory, mirrors BrandLiftCenterpiece):
 *  - every % shows its base n  ("62% (n=50)")
 *  - small n (<10) reads as a directional signal, never a confident %
 *  - composite is an unweighted mean of criterion means on a 1-7 rating;
 *    we render it as the raw mean (no ×100) and shade heatmap cells by it
 *  - plain-language criterion labels, never the raw slug
 *  - never fake a chart: honest null-state instead
 */

// Pass 46 Phase 4 — directional-signal floor, matching brandLift philosophy.
const SMALL_N = 10;
// Pass 46 Phase 4 — monadic ratings are a 1-7 scale (claudeAI.js:1572);
// heatmap cells shade mean→0-1 against this max.
const RATING_MAX = 7;

// Pass 46 Phase 4 — slug→label map quoted from naming.js header
// (claudeAI.js:1585-1591). word_association is excluded from rating math
// upstream, so it never reaches a candidate's `criteria`.
const CRITERION_LABEL: Record<string, string> = {
  memorable: 'Memorable',
  distinctive: 'Distinctive',
  relevant: 'Relevant',
  positive: 'Positive',
  easy_to_pronounce: 'Easy to say',
  modern: 'Modern',
};

import { HeroBarList } from './HeroBarList';

interface RatingStats { mean: number; stddev?: number; n: number; ci_low?: number; ci_high?: number }
interface PairwiseWinRate { pct: number; wins: number; appearances: number }
interface Candidate {
  candidate_id: string;
  label: string;
  composite: number | null;
  criteria: Record<string, RatingStats | null>;
  pairwise_win_rate: PairwiseWinRate | null;
}
interface NamingBlock {
  methodology: string;
  n: number;
  candidates: Candidate[];
  pairwise: { comparisons: unknown[] } | null;
  turf: unknown | null;
  winner: { candidate_id: string; by: string } | null;
}

function critLabel(slug: string): string {
  return CRITERION_LABEL[slug]
    || slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * A candidate's preference share for the bar chart: pairwise win rate when
 * pairwise data exists for it, else its composite rescaled to a 0-100
 * "score" (mean/7×100) so every candidate is comparable on one axis. The
 * `kind` tells the headline/legend which axis it is.
 */
function shareValue(c: Candidate, mode: 'pairwise' | 'composite'): number | null {
  if (mode === 'pairwise') return c.pairwise_win_rate ? c.pairwise_win_rate.pct : null;
  return c.composite === null ? null : (c.composite / RATING_MAX) * 100;
}

// Pass 46 Phase 4 — honest null-state card. Never a fake chart.
function NullState({ reason }: { reason: string }) {
  return (
    <section className="px-6 pt-2 pb-4 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-b2 bg-bg3 px-5 py-4">
        <h2 className="font-display font-bold text-t1 text-sm">Naming &amp; messaging report</h2>
        <p className="text-xs text-t3 mt-1 leading-relaxed">{reason}</p>
      </div>
    </section>
  );
}

export function NamingCenterpiece({ analysis }: { analysis: any; mission: any }) {
  // ── Honest null-states ────────────────────────────────────────────────
  if (!analysis || typeof analysis !== 'object') {
    return (
      <NullState reason="No deterministic naming analysis is attached to this mission yet. Re-run synthesis to generate a full naming report." />
    );
  }
  const block: NamingBlock | null = analysis.naming
    ?? (analysis.methodology === 'naming' ? analysis : null);
  if (!block || block.methodology !== 'naming') {
    return (
      <NullState reason="This mission has analysis, but no naming block. Naming requires monadic ratings and/or paired comparisons captured at run time." />
    );
  }
  const candidates: Candidate[] = Array.isArray(block.candidates) ? block.candidates : [];
  if (candidates.length === 0) {
    return (
      <NullState reason="No candidates produced a computable score (every candidate had empty rating cells and no valid paired comparisons)." />
    );
  }

  // ── Decide the preference axis: pairwise when ANY candidate has it,
  //    matching the winner-selection logic in naming.js. ──
  const anyPairwise = candidates.some((c) => c.pairwise_win_rate !== null);
  const mode: 'pairwise' | 'composite' = anyPairwise ? 'pairwise' : 'composite';

  // Rank candidates by the chosen axis (desc); incomputable sink to the end.
  const ranked = [...candidates].sort((a, b) => {
    const av = shareValue(a, mode);
    const bv = shareValue(b, mode);
    return (bv ?? -Infinity) - (av ?? -Infinity);
  });

  // ── Winner + headline data ────────────────────────────────────────────
  const winnerId = block.winner?.candidate_id ?? ranked[0]?.candidate_id ?? null;
  const winner = candidates.find((c) => c.candidate_id === winnerId) ?? ranked[0];

  // Winner's strongest criterion (highest mean) for the headline.
  let topCriterion: { slug: string; mean: number } | null = null;
  for (const [slug, stats] of Object.entries(winner.criteria || {})) {
    if (stats && (!topCriterion || stats.mean > topCriterion.mean)) {
      topCriterion = { slug, mean: stats.mean };
    }
  }

  // Hero number + n behind it.
  const winnerPairwise = winner.pairwise_win_rate;
  const heroIsPairwise = mode === 'pairwise' && winnerPairwise !== null;
  const heroNumber = heroIsPairwise
    ? `${Math.round(winnerPairwise!.pct)}%`
    : winner.composite !== null ? winner.composite.toFixed(1) : '—';
  const heroN = heroIsPairwise
    ? winnerPairwise!.appearances
    : (winner.criteria ? Math.max(0, ...Object.values(winner.criteria).map((s) => s?.n ?? 0)) : 0);
  const smallN = heroN < SMALL_N;

  // Runner-up for the comparative clause.
  const runnerUp = ranked.find((c) => c.candidate_id !== winner.candidate_id) ?? null;
  const runnerVal = runnerUp ? shareValue(runnerUp, mode) : null;

  // ── Headline sentence — n-honest, plain language. ──
  const winnerLabel = winner.label || winner.candidate_id;
  let headlineSentence: string;
  if (heroIsPairwise) {
    const base = smallN
      ? `Directional signal: '${winnerLabel}' leads with a ${Math.round(winnerPairwise!.pct)}% pairwise win rate, but with only n=${heroN} comparisons this is not yet a confident read`
      : `'${winnerLabel}' wins — ${Math.round(winnerPairwise!.pct)}% pairwise win rate (n=${heroN})`;
    const critClause = topCriterion ? `, strongest on ${critLabel(topCriterion.slug)}` : '';
    const vsClause = runnerUp && runnerVal !== null
      ? `, ahead of '${runnerUp.label || runnerUp.candidate_id}' at ${Math.round(runnerVal)}%`
      : '';
    headlineSentence = `${base}${critClause}${vsClause}.`;
  } else if (winner.composite !== null) {
    const base = smallN
      ? `Directional signal: '${winnerLabel}' scores highest at ${winner.composite.toFixed(1)}/7 composite, but with only n=${heroN} ratings/criterion treat this as a lean, not a verdict`
      : `'${winnerLabel}' scores highest — ${winner.composite.toFixed(1)}/7 composite across criteria (n=${heroN}/criterion)`;
    const critClause = topCriterion ? `, strongest on ${critLabel(topCriterion.slug)}` : '';
    headlineSentence = `${base}${critClause}. No paired comparisons were run, so this ranks on monadic ratings alone.`;
  } else {
    headlineSentence = `'${winnerLabel}' leads, but no candidate produced a computable composite or win rate — treat every number below as directional.`;
  }

  // Criteria axes for the heatmap = union of criteria present across
  // candidates, in the canonical slug order, then any extras.
  const seen = new Set<string>();
  for (const c of candidates) for (const k of Object.keys(c.criteria || {})) seen.add(k);
  const orderedSlugs = [
    ...Object.keys(CRITERION_LABEL).filter((s) => seen.has(s)),
    ...[...seen].filter((s) => !(s in CRITERION_LABEL)),
  ];

  const comparisonCount = block.pairwise?.comparisons?.length ?? 0;

  return (
    <section className="px-6 pt-2 pb-6 max-w-6xl mx-auto space-y-5">
      {/* ── (a) HEADLINE ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-pur font-display font-bold">
          Naming &amp; Messaging · Headline
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
          {candidates.length} candidate{candidates.length === 1 ? '' : 's'} tested
          {' · '}
          {anyPairwise
            ? `${comparisonCount} paired comparison${comparisonCount === 1 ? '' : 's'}`
            : 'monadic ratings only'}
          {' · '}
          ranked by {mode === 'pairwise' ? 'head-to-head win rate' : 'composite rating'}
          {' · '}
          base: n={block.n} respondents
        </p>
      </div>

      {/* ── (b) CENTERPIECE — preference-share bars + attribute heatmap ───── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5 space-y-6">
        {/* Preference share */}
        <div>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h3 className="font-display font-bold text-t1 text-sm">
              Preference share — {mode === 'pairwise' ? 'pairwise win rate' : 'composite rating (mean/7)'}
            </h3>
            <span className="text-[10px] text-t3 inline-flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm bg-lime" /> winner
            </span>
          </div>
          <PreferenceBars ranked={ranked} winnerId={winner.candidate_id} mode={mode} />
        </div>

        {/* Attribute heatmap */}
        {orderedSlugs.length > 0 ? (
          <div>
            <h3 className="font-display font-bold text-t1 text-sm">
              Attribute heatmap — candidate × criterion
            </h3>
            <p className="text-[10px] text-t3 mt-0.5 font-body">
              Each cell is the mean rating on a 1-7 scale; darker lime = stronger. The number under each candidate is its n on that criterion.
            </p>
            <AttributeHeatmap
              candidates={ranked}
              slugs={orderedSlugs}
              winnerId={winner.candidate_id}
            />
          </div>
        ) : (
          <p className="text-[11px] text-t3 font-body italic">
            No monadic criterion ratings were captured, so the attribute heatmap is omitted. Preference above is from paired comparisons only.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Horizontal preference-share bars, one per candidate, sorted desc by the
 * active axis. Winner highlighted in lime; others muted. Each bar labels
 * its value + the n behind it (and "directional" when thin).
 */
function PreferenceBars({
  ranked, winnerId, mode,
}: { ranked: Candidate[]; winnerId: string; mode: 'pairwise' | 'composite' }) {
  const ROW_H = 40;
  const BAR_H = 16;
  const LABEL_W = 150;
  const TRACK_X = LABEL_W + 8;
  const VB_W = 760;
  const TRACK_W = VB_W - TRACK_X - 92;
  const PAD = 8;
  const height = PAD + ranked.length * ROW_H + 4;
  // Scale: pairwise/composite share are both 0-100 → full track = 100.
  const maxVal = 100;

  // §F2 — name labels can be long; the SVG axis can't wrap, so for long labels
  // render the wrapping HTML bar list (full labels, never sliced).
  if (ranked.some((c) => (c.label || c.candidate_id).length > 24)) {
    return (
      <HeroBarList
        rows={ranked.map((c) => {
          const val = shareValue(c, mode);
          const n = mode === 'pairwise'
            ? (c.pairwise_win_rate?.appearances ?? 0)
            : (c.criteria ? Math.max(0, ...Object.values(c.criteria).map((s) => s?.n ?? 0)) : 0);
          const thin = n > 0 && n < SMALL_N;
          return {
            label: c.label || c.candidate_id,
            pct: val,
            valueText: val === null ? '—' : mode === 'pairwise' ? `${Math.round(val)}%` : (c.composite ?? 0).toFixed(1),
            sub: `n=${n}${thin ? ' · directional' : ''}`,
            isWinner: c.candidate_id === winnerId,
          };
        })}
      />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${height}`}
      className="w-full h-auto mt-3"
      role="img"
      aria-label="Candidate preference share"
    >
      {ranked.map((c, i) => {
        const y = PAD + i * ROW_H;
        const val = shareValue(c, mode);
        const isWinner = c.candidate_id === winnerId;
        const n = mode === 'pairwise'
          ? (c.pairwise_win_rate?.appearances ?? 0)
          : (c.criteria ? Math.max(0, ...Object.values(c.criteria).map((s) => s?.n ?? 0)) : 0);
        const thin = n > 0 && n < SMALL_N;
        const w = val === null ? 0 : Math.max(2, (val / maxVal) * TRACK_W);
        const display = val === null
          ? '—'
          : mode === 'pairwise' ? `${Math.round(val)}%` : (c.composite ?? 0).toFixed(1);
        return (
          <g key={c.candidate_id}>
            <text
              x={0}
              y={y + BAR_H - 2}
              className="fill-t1 font-display"
              style={{ fontSize: '12px', fontWeight: isWinner ? 800 : 600 }}
            >
              {(c.label || c.candidate_id).slice(0, 24)}
            </text>
            <text x={0} y={y + BAR_H + 12} className="fill-t3 font-body" style={{ fontSize: '9px' }}>
              {n > 0 ? `n=${n}${thin ? ' · directional' : ''}` : 'no data'}
            </text>
            <rect x={TRACK_X} y={y} width={TRACK_W} height={BAR_H} rx={3} className="fill-t3/15" />
            <rect
              x={TRACK_X}
              y={y}
              width={w}
              height={BAR_H}
              rx={3}
              className={isWinner ? 'fill-lime' : 'fill-t3/45'}
            />
            <text
              x={TRACK_X + TRACK_W + 8}
              y={y + BAR_H - 2}
              className={`font-display tabular-nums ${isWinner ? 'fill-lime' : 'fill-t1'}`}
              style={{ fontSize: '13px', fontWeight: 800 }}
            >
              {display}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Candidates × criteria heatmap. Rows = candidates (ranked order),
 * columns = criteria. Cell shade = mean/7. Winner row gets a lime label.
 * Cells with no rating render as an empty muted tile (never a fake value).
 */
function AttributeHeatmap({
  candidates, slugs, winnerId,
}: { candidates: Candidate[]; slugs: string[]; winnerId: string }) {
  const ROW_H = 34;
  const HEAD_H = 26;
  const LABEL_W = 150;
  const VB_W = 760;
  const GRID_W = VB_W - LABEL_W;
  const cellW = GRID_W / slugs.length;
  const height = HEAD_H + candidates.length * ROW_H + 4;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${height}`}
      className="w-full h-auto mt-3"
      role="img"
      aria-label="Attribute heatmap of candidates by criterion"
    >
      {/* Column headers */}
      {slugs.map((slug, j) => (
        <text
          key={`h-${slug}`}
          x={LABEL_W + j * cellW + cellW / 2}
          y={HEAD_H - 10}
          textAnchor="middle"
          className="fill-t3 font-display"
          style={{ fontSize: '10px', fontWeight: 700 }}
        >
          {critLabel(slug)}
        </text>
      ))}
      {candidates.map((c, i) => {
        const y = HEAD_H + i * ROW_H;
        const isWinner = c.candidate_id === winnerId;
        return (
          <g key={c.candidate_id}>
            <text
              x={0}
              y={y + ROW_H / 2 + 3}
              className={isWinner ? 'fill-lime font-display' : 'fill-t1 font-display'}
              style={{ fontSize: '11px', fontWeight: isWinner ? 800 : 600 }}
            >
              <title>{c.label || c.candidate_id}</title>
              {(c.label || c.candidate_id).slice(0, 20)}
            </text>
            {slugs.map((slug, j) => {
              const stats = c.criteria?.[slug] ?? null;
              const x = LABEL_W + j * cellW;
              const intensity = stats ? Math.max(0, Math.min(1, stats.mean / RATING_MAX)) : null;
              // Shade via opacity on the lime fill so the token stays the
              // source of truth; empty cells get a faint neutral tile.
              return (
                <g key={`${c.candidate_id}-${slug}`}>
                  <rect
                    x={x + 2}
                    y={y + 3}
                    width={cellW - 4}
                    height={ROW_H - 6}
                    rx={4}
                    className={intensity === null ? 'fill-t3/10' : 'fill-lime'}
                    style={intensity === null ? undefined : { opacity: 0.18 + intensity * 0.82 }}
                  />
                  <text
                    x={x + cellW / 2}
                    y={y + ROW_H / 2 + 1}
                    textAnchor="middle"
                    className={intensity !== null && intensity > 0.62 ? 'fill-black font-body' : 'fill-t1 font-body'}
                    style={{ fontSize: '11px', fontWeight: 700 }}
                  >
                    {stats ? stats.mean.toFixed(1) : '—'}
                  </text>
                  <text
                    x={x + cellW / 2}
                    y={y + ROW_H - 4}
                    textAnchor="middle"
                    className={intensity !== null && intensity > 0.62 ? 'fill-black/70 font-body' : 'fill-t3 font-body'}
                    style={{ fontSize: '8px' }}
                  >
                    {stats ? `n=${stats.n}` : ''}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export default NamingCenterpiece;
