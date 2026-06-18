/**
 * Pass 46 Phase 4 — Compare Concepts report centerpiece.
 *
 * The research-grade headline + hero visual that sits directly under the
 * page header, ABOVE the existing dashboard ("Supporting Detail" layer).
 *
 * Reads the deterministic block computed by
 *   vettit-backend/src/services/analysis/compare.js → computeCompare()
 * verbatim. We render prose ABOUT that object; we never recompute math.
 *
 * Block shape (quoted from computeCompare):
 *   { methodology:'compare', n,
 *     concepts:[{ concept_id, label,
 *       dimensions:{
 *         appeal:ratingStats|null,        // 1-10 scale
 *         relevance:ratingStats|null,     // 1-7 scale
 *         uniqueness:ratingStats|null,    // 1-7 scale
 *         intent:{ base, distribution, top2:{pct,count,base}|null, options } | null },
 *       final_choice_pct:{ pct, count, base } | null }],
 *     head_to_head:[{ dimension, winner_concept_id, runner_up_concept_id,
 *                     delta, metric:'mean_diff'|'top2_pp_diff' }],
 *     final_choice:{ question_id, base, options } | null,
 *     overall_winner:{ concept_id, by:'final_choice' } | null }
 *
 * CREDIBILITY DOCTRINE (mandatory, mirrors BrandLiftCenterpiece):
 *  - every % shows its base n
 *  - small n (<10) reads as a directional signal, never a confident %
 *  - rating dims are means on their own scale (no ×100); intent top-2 box
 *    is a proportion shown as %
 *  - plain-language dimension labels
 *  - never fake a chart: honest null-state instead
 */

import { HeroBarList } from './HeroBarList';

const SMALL_N = 10;

// Pass 46 Phase 4 — each rating dimension's scale max (compare.js header:
// appeal 1-10, relevance/uniqueness 1-7) so bars normalize honestly.
const DIM_META: Record<string, { label: string; max: number }> = {
  appeal: { label: 'Appeal', max: 10 },
  relevance: { label: 'Relevance', max: 7 },
  uniqueness: { label: 'Uniqueness', max: 7 },
};
const RATING_DIMS = ['appeal', 'relevance', 'uniqueness'] as const;

interface RatingStats { mean: number; stddev?: number; n: number; ci_low?: number; ci_high?: number }
interface Intent {
  base: number;
  distribution: Record<string, number>;
  top2: { pct: number; count: number; base: number } | null;
  options: string[];
}
interface Concept {
  concept_id: string;
  label: string;
  dimensions: {
    appeal: RatingStats | null;
    relevance: RatingStats | null;
    uniqueness: RatingStats | null;
    intent: Intent | null;
  };
  final_choice_pct: { pct: number; count: number; base: number } | null;
}
interface H2H {
  dimension: string;
  winner_concept_id: string;
  runner_up_concept_id: string;
  delta: number;
  metric: string;
}
interface CompareBlock {
  methodology: string;
  n: number;
  concepts: Concept[];
  head_to_head: H2H[];
  final_choice: { question_id: string; base: number; options: Record<string, { count: number; pct: number }> } | null;
  overall_winner: { concept_id: string; by: string } | null;
}

const dimLabel = (slug: string) => DIM_META[slug]?.label
  || (slug === 'intent' ? 'Purchase intent' : slug.replace(/\b\w/g, (c) => c.toUpperCase()));

// Pass 46 Phase 4 — honest null-state card. Never a fake chart.
function NullState({ reason }: { reason: string }) {
  return (
    <section className="px-6 pt-2 pb-4 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-b2 bg-bg3 px-5 py-4">
        <h2 className="font-display font-bold text-t1 text-sm">Compare concepts report</h2>
        <p className="text-xs text-t3 mt-1 leading-relaxed">{reason}</p>
      </div>
    </section>
  );
}

export function CompareCenterpiece({ analysis }: { analysis: any; mission: any }) {
  // ── Honest null-states ────────────────────────────────────────────────
  if (!analysis || typeof analysis !== 'object') {
    return (
      <NullState reason="No deterministic compare analysis is attached to this mission yet. Re-run synthesis to generate a full concept-comparison report." />
    );
  }
  const block: CompareBlock | null = analysis.compare
    ?? (analysis.methodology === 'compare' ? analysis : null);
  if (!block || block.methodology !== 'compare') {
    return (
      <NullState reason="This mission has analysis, but no compare block. Concept comparison requires the sequential-monadic battery captured at run time." />
    );
  }
  const concepts: Concept[] = Array.isArray(block.concepts) ? block.concepts : [];
  if (concepts.length === 0) {
    return (
      <NullState reason="No concepts produced computable dimensions (every concept had empty rating cells and no final-choice votes)." />
    );
  }

  // ── Winner + headline ─────────────────────────────────────────────────
  const winnerId = block.overall_winner?.concept_id ?? null;
  // When no final choice exists, rank by intent top-2 box, then appeal mean.
  const byIntent = [...concepts].sort((a, b) => {
    const av = a.dimensions.intent?.top2?.pct ?? a.dimensions.appeal?.mean ?? -Infinity;
    const bv = b.dimensions.intent?.top2?.pct ?? b.dimensions.appeal?.mean ?? -Infinity;
    return bv - av;
  });
  const winner = concepts.find((c) => c.concept_id === winnerId) ?? byIntent[0];
  const runnerUp = byIntent.find((c) => c.concept_id !== winner.concept_id) ?? null;

  const winnerLabel = winner.label || winner.concept_id;
  const runnerLabel = runnerUp ? (runnerUp.label || runnerUp.concept_id) : null;

  // Headline metric: prefer final-choice share, else intent top-2 box.
  const wFinal = winner.final_choice_pct;
  const wIntent = winner.dimensions.intent?.top2 ?? null;
  const heroIsFinal = wFinal !== null;
  const heroIsIntent = !heroIsFinal && wIntent !== null;
  const heroNumber = heroIsFinal
    ? `${Math.round(wFinal!.pct)}%`
    : heroIsIntent ? `${Math.round(wIntent!.pct)}%`
      : winner.dimensions.appeal?.mean !== undefined && winner.dimensions.appeal
        ? winner.dimensions.appeal.mean.toFixed(1) : '—';
  const heroN = heroIsFinal ? wFinal!.base
    : heroIsIntent ? wIntent!.base
      : winner.dimensions.appeal?.n ?? 0;
  const smallN = heroN > 0 && heroN < SMALL_N;

  // A dimension the runner-up wins, for the honest "but" clause: scan H2H
  // for the first row the winner does NOT win.
  const loseRow = block.head_to_head.find((h) => h.winner_concept_id !== winner.concept_id) ?? null;
  const loseDimLabel = loseRow ? dimLabel(loseRow.dimension) : null;
  const loseWinner = loseRow
    ? concepts.find((c) => c.concept_id === loseRow.winner_concept_id) ?? null
    : null;

  // Headline sentence — n-honest.
  let headlineSentence: string;
  if (heroIsFinal && runnerUp && runnerUp.final_choice_pct) {
    const lead = smallN
      ? `Directional signal: '${winnerLabel}' takes ${Math.round(wFinal!.pct)}% of the forced choice vs ${Math.round(runnerUp.final_choice_pct.pct)}% for '${runnerLabel}', but with only n=${heroN} this is a lean, not a verdict`
      : `'${winnerLabel}' wins the forced choice — ${Math.round(wFinal!.pct)}% vs ${Math.round(runnerUp.final_choice_pct.pct)}% for '${runnerLabel}' (n=${heroN})`;
    const but = loseRow && loseWinner && loseWinner.concept_id !== winner.concept_id
      ? `, but '${loseWinner.label || loseWinner.concept_id}' wins on ${loseDimLabel}`
      : '';
    headlineSentence = `${lead}${but}.`;
  } else if (heroIsIntent) {
    const lead = smallN
      ? `Directional signal: '${winnerLabel}' has the strongest purchase intent at ${Math.round(wIntent!.pct)}% top-2 box, but with only n=${heroN} treat this as directional`
      : `'${winnerLabel}' leads on purchase intent — ${Math.round(wIntent!.pct)}% top-2 box (n=${heroN})`;
    const but = loseRow && loseWinner && loseWinner.concept_id !== winner.concept_id
      ? `, though '${loseWinner.label || loseWinner.concept_id}' wins on ${loseDimLabel}`
      : '';
    headlineSentence = `${lead}${but}. No forced choice was run, so this ranks on intent.`;
  } else {
    headlineSentence = `'${winnerLabel}' leads on appeal, but neither a forced choice nor a purchase-intent scale was captured — treat the dimensions below as directional.`;
  }

  // Dimensions present across at least one concept (for the matrix rows).
  const dimsPresent = [...RATING_DIMS, 'intent'].filter((d) => concepts.some((c) => (
    d === 'intent' ? c.dimensions.intent?.top2 != null : c.dimensions[d as typeof RATING_DIMS[number]] != null
  )));

  // H2H lookup by dimension for delta labels on the winning bar.
  const h2hByDim = new Map(block.head_to_head.map((h) => [h.dimension, h]));

  const hasFinal = block.final_choice !== null
    && concepts.some((c) => c.final_choice_pct !== null);

  return (
    <section className="px-6 pt-2 pb-6 max-w-6xl mx-auto space-y-5">
      {/* ── (a) HEADLINE ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-pur font-display font-bold">
          Compare Concepts · Headline
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
          {concepts.length} concept{concepts.length === 1 ? '' : 's'} compared
          {' · '}
          {dimsPresent.length} dimension{dimsPresent.length === 1 ? '' : 's'} scored
          {' · '}
          {hasFinal ? 'ranked by forced choice' : 'ranked by purchase intent'}
          {' · '}
          base: n={block.n} respondents
        </p>
      </div>

      {/* ── (b) FINAL-CHOICE SHARE (top) ─────────────────────────────────── */}
      {hasFinal && (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h3 className="font-display font-bold text-t1 text-sm">Forced-choice share</h3>
            <span className="text-[10px] text-t3 inline-flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm bg-lime" /> winner
            </span>
          </div>
          <FinalChoiceBars concepts={concepts} winnerId={winner.concept_id} base={block.final_choice?.base ?? 0} />
        </div>
      )}

      {/* ── (b) HEAD-TO-HEAD MATRIX — dimensions × concepts ──────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <h3 className="font-display font-bold text-t1 text-sm">
          Head-to-head — every dimension, every concept
        </h3>
        <p className="text-[10px] text-t3 mt-0.5 font-body">
          Rating dims show the mean on their own scale (appeal 1-10; relevance &amp; uniqueness 1-7); intent shows the top-2-box %. The winning concept&apos;s bar is lime and its margin over the runner-up is labelled.
        </p>
        {dimsPresent.length > 0 ? (
          <HeadToHead
            concepts={concepts}
            dims={dimsPresent}
            h2hByDim={h2hByDim}
          />
        ) : (
          <p className="text-[11px] text-t3 font-body italic mt-3">
            No concept produced a computable dimension, so the head-to-head matrix is omitted.
          </p>
        )}
      </div>
    </section>
  );
}

/** Forced-choice share bars: one per concept, winner in lime, n-honest. */
function FinalChoiceBars({
  concepts, winnerId, base,
}: { concepts: Concept[]; winnerId: string; base: number }) {
  const ROW_H = 40;
  const BAR_H = 16;
  const LABEL_W = 150;
  const TRACK_X = LABEL_W + 8;
  const VB_W = 760;
  const TRACK_W = VB_W - TRACK_X - 92;
  const PAD = 8;
  const ranked = [...concepts].sort(
    (a, b) => (b.final_choice_pct?.pct ?? -1) - (a.final_choice_pct?.pct ?? -1),
  );
  const height = PAD + ranked.length * ROW_H + 4;
  const smallBase = base > 0 && base < SMALL_N;

  // §F2 — concept labels can be full sentences; the SVG axis can't wrap, so for
  // long labels render the wrapping HTML bar list (full labels, never sliced).
  if (ranked.some((c) => (c.label || c.concept_id).length > 24)) {
    return (
      <HeroBarList
        rows={ranked.map((c) => ({
          label: c.label || c.concept_id,
          pct: c.final_choice_pct?.pct ?? null,
          sub: c.final_choice_pct
            ? `${c.final_choice_pct.count}/${c.final_choice_pct.base} chose${smallBase ? ' · directional' : ''}`
            : 'no vote',
          isWinner: c.concept_id === winnerId,
        }))}
      />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${height}`}
      className="w-full h-auto mt-3"
      role="img"
      aria-label="Forced-choice share by concept"
    >
      {ranked.map((c, i) => {
        const y = PAD + i * ROW_H;
        const fc = c.final_choice_pct;
        const isWinner = c.concept_id === winnerId;
        const w = fc ? Math.max(2, (fc.pct / 100) * TRACK_W) : 0;
        return (
          <g key={c.concept_id}>
            <text
              x={0}
              y={y + BAR_H - 2}
              className="fill-t1 font-display"
              style={{ fontSize: '12px', fontWeight: isWinner ? 800 : 600 }}
            >
              {(c.label || c.concept_id).slice(0, 24)}
            </text>
            <text x={0} y={y + BAR_H + 12} className="fill-t3 font-body" style={{ fontSize: '9px' }}>
              {fc ? `${fc.count}/${fc.base} chose${smallBase ? ' · directional' : ''}` : 'no vote'}
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
              {fc ? `${Math.round(fc.pct)}%` : '—'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Head-to-head matrix. One band per dimension; within a band, one bar per
 * concept normalized to the dimension's scale (rating max, or 100 for the
 * intent top-2 %). The dimension winner's bar is lime; its delta over the
 * runner-up (from the deterministic head_to_head array) is labelled.
 */
function HeadToHead({
  concepts, dims, h2hByDim,
}: { concepts: Concept[]; dims: string[]; h2hByDim: Map<string, H2H> }) {
  const BAND_H = 30 + concepts.length * 22; // title + one row per concept
  const BAR_H = 13;
  const ROW_H = 22;
  const LABEL_W = 150;
  const TRACK_X = LABEL_W + 8;
  const VB_W = 760;
  const TRACK_W = VB_W - TRACK_X - 120;
  const PAD = 6;
  const height = PAD + dims.length * BAND_H + 4;

  const dimValue = (c: Concept, dim: string): { val: number | null; max: number; text: string; n: number } => {
    if (dim === 'intent') {
      const t2 = c.dimensions.intent?.top2 ?? null;
      return {
        val: t2 ? t2.pct : null,
        max: 100,
        text: t2 ? `${Math.round(t2.pct)}%` : '—',
        n: t2 ? t2.base : (c.dimensions.intent?.base ?? 0),
      };
    }
    const stats = c.dimensions[dim as typeof RATING_DIMS[number]] ?? null;
    const max = DIM_META[dim]?.max ?? 7;
    return {
      val: stats ? stats.mean : null,
      max,
      text: stats ? stats.mean.toFixed(1) : '—',
      n: stats ? stats.n : 0,
    };
  };

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${height}`}
      className="w-full h-auto mt-3"
      role="img"
      aria-label="Head-to-head: each dimension across concepts"
    >
      {dims.map((dim, di) => {
        const bandY = PAD + di * BAND_H;
        const h2h = h2hByDim.get(dim) ?? null;
        const winnerCid = h2h?.winner_concept_id ?? null;
        // Order concepts within the band by this dimension's value, desc.
        const ordered = [...concepts].sort(
          (a, b) => (dimValue(b, dim).val ?? -Infinity) - (dimValue(a, dim).val ?? -Infinity),
        );
        // Delta text honoring the metric (mean_diff vs top2_pp_diff).
        const deltaText = h2h
          ? h2h.metric === 'top2_pp_diff'
            ? `+${Math.round(h2h.delta)} pts vs runner-up`
            : `+${h2h.delta.toFixed(1)} vs runner-up`
          : null;
        return (
          <g key={dim}>
            <text
              x={0}
              y={bandY + 14}
              className="fill-t1 font-display"
              style={{ fontSize: '12px', fontWeight: 700 }}
            >
              {dimLabel(dim)}
            </text>
            {deltaText && (
              <text
                x={VB_W - 4}
                y={bandY + 14}
                textAnchor="end"
                className="fill-lime font-display tabular-nums"
                style={{ fontSize: '11px', fontWeight: 800 }}
              >
                {deltaText}
              </text>
            )}
            {ordered.map((c, ri) => {
              const y = bandY + 24 + ri * ROW_H;
              const dv = dimValue(c, dim);
              const isWinner = c.concept_id === winnerCid;
              const thin = dv.n > 0 && dv.n < SMALL_N;
              const w = dv.val === null ? 0 : Math.max(2, (dv.val / dv.max) * TRACK_W);
              return (
                <g key={`${dim}-${c.concept_id}`}>
                  <text
                    x={LABEL_W}
                    y={y + BAR_H - 2}
                    textAnchor="end"
                    className={isWinner ? 'fill-lime font-body' : 'fill-t3 font-body'}
                    style={{ fontSize: '10px', fontWeight: isWinner ? 700 : 400 }}
                  >
                    <title>{c.label || c.concept_id}</title>
                    {(c.label || c.concept_id).slice(0, 18)}
                  </text>
                  <rect x={TRACK_X} y={y} width={TRACK_W} height={BAR_H} rx={2} className="fill-t3/12" />
                  <rect
                    x={TRACK_X}
                    y={y}
                    width={w}
                    height={BAR_H}
                    rx={2}
                    className={isWinner ? 'fill-lime' : 'fill-t3/45'}
                  />
                  <text
                    x={TRACK_X + TRACK_W + 8}
                    y={y + BAR_H - 2}
                    className={`font-body tabular-nums ${isWinner ? 'fill-lime' : 'fill-t1'}`}
                    style={{ fontSize: '11px', fontWeight: 700 }}
                  >
                    {dv.text}{dv.n > 0 ? <tspan className="fill-t3" style={{ fontSize: '8px' }}>{` n=${dv.n}${thin ? '·dir' : ''}`}</tspan> : null}
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

export default CompareCenterpiece;
