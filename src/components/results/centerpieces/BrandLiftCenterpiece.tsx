/**
 * Pass 46 Phase 4 — Brand Lift report centerpiece.
 *
 * The research-grade headline + hero visual that sits directly under the
 * page header, ABOVE the existing dashboard ("Supporting Detail" layer).
 *
 * Reads the deterministic block computed by
 *   vettit-backend/src/services/analysis/brandLift.js → computeBrandLift()
 * verbatim. We render prose ABOUT that object; we never recompute math.
 *
 * Block shape (quoted from computeBrandLift):
 *   { methodology:'brand_lift',
 *     cells:{exposed:{n}, control:{n}, not_applicable:{n}},
 *     funnel:[{ question_id, text, funnel_stage, kpi_category,
 *               type:'proportion'|'mean'|null,
 *               exposed:{n,positive?,rate?}|ratingStats,
 *               control:{n,positive?,rate?}|ratingStats,
 *               lift_abs, lift_rel_pct, significance:{z,p,sig90,sig95}|null,
 *               reason? }],
 *     summary:{stages_lifted, stages_sig95, biggest_lift:{question_id,lift_abs}|null}|null,
 *     degenerate_reason?:'no_exposure_cells' }
 *
 * CREDIBILITY DOCTRINE (mandatory):
 *  - every % shows its base n  ("52% (n=50)")
 *  - small cells (n<10) read as a directional signal, never a confident %
 *  - proportions are 0-1 fractions; abs lift ×100 = points
 *  - 'mean' type lift is a raw mean delta (no ×100)
 *  - plain-language stage labels, never the raw funnel_stage enum
 *  - never fake a chart: honest null-state instead
 */

// Pass 46 Phase 4 — directional-signal floor. Below this a cell is too thin
// to quote a confident %, matching the brandLift.js n=0 guard philosophy.
const SMALL_N = 10;

// Pass 46 Phase 4 — the brand-lift survey's funnel_stage enum (quoted in
// brandLift.js lines 12-15) collapsed onto the 5-position consumer funnel
// the report tells its story through: awareness → ad recall → consideration
// → purchase intent → brand preference. `order` drives top-to-bottom layout;
// `label` is the plain-language name shown to the reader.
const STAGE_MAP: Record<string, { order: number; label: string }> = {
  // 1 — Awareness
  unaided_brand_awareness: { order: 1, label: 'Brand Awareness' },
  aided_brand_awareness: { order: 1, label: 'Brand Awareness' },
  brand_familiarity: { order: 1, label: 'Brand Familiarity' },
  // 2 — Ad recall
  unaided_ad_recall: { order: 2, label: 'Ad Recall' },
  aided_ad_recall: { order: 2, label: 'Ad Recall' },
  channel_specific_recall: { order: 2, label: 'Channel Recall' },
  message_association: { order: 2, label: 'Message Association' },
  // 3 — Consideration
  brand_consideration: { order: 3, label: 'Consideration' },
  brand_favorability: { order: 3, label: 'Favorability' },
  // 4 — Purchase intent
  purchase_intent: { order: 4, label: 'Purchase Intent' },
  // 5 — Brand preference / advocacy
  nps: { order: 5, label: 'Recommendation (NPS)' },
};

type Sig = { z: number; p: number; sig90: boolean; sig95: boolean } | null;
interface Cell { n: number; positive?: number; rate?: number | null; mean?: number | null }
interface FunnelRow {
  question_id: string | null;
  text: string | null;
  funnel_stage: string | null;
  kpi_category: string | null;
  type: 'proportion' | 'mean' | null;
  exposed: Cell;
  control: Cell;
  lift_abs: number | null;
  lift_rel_pct: number | null;
  significance: Sig;
  reason?: string;
}

function stageMeta(stage: string | null): { order: number; label: string } {
  if (stage && STAGE_MAP[stage]) return STAGE_MAP[stage];
  // Unknown / legacy stage: keep it, but sort to the end and humanize the enum.
  const label = (stage || 'Stage')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { order: 99, label };
}

/** Significance marker per the report spec: ▲ sig95, △ sig90, "ns" otherwise. */
function sigMarker(sig: Sig): { glyph: string; cls: string; title: string } {
  if (sig?.sig95) return { glyph: '▲', cls: 'text-lime', title: 'Significant at 95%' };
  if (sig?.sig90) return { glyph: '△', cls: 'text-lime/70', title: 'Significant at 90%' };
  return { glyph: 'ns', cls: 'text-t3', title: 'Not statistically significant' };
}

/**
 * Normalize a cell to a 0-1 "rate" for bar widths and a display value.
 * proportion → its rate (already 0-1); mean → mean/scaleMax (we read the
 * stat's own max when present, else assume a 1-7 rating per the brand-lift
 * battery). Returns null when the cell can't be drawn.
 */
function cellDisplay(row: FunnelRow, cell: Cell): {
  rate: number | null;      // 0-1 for bar width
  text: string;             // human display: "52%" or "5.2"
  n: number;
} {
  const n = cell?.n ?? 0;
  if (row.type === 'proportion') {
    const rate = typeof cell?.rate === 'number' ? cell.rate : null;
    return { rate, text: rate === null ? '—' : `${Math.round(rate * 100)}%`, n };
  }
  if (row.type === 'mean') {
    const mean = typeof cell?.mean === 'number' ? cell.mean : null;
    // ratingStats carries a max when available; brand-lift ratings are 1-7.
    const scaleMax = typeof (cell as { max?: number })?.max === 'number'
      ? (cell as { max?: number }).max as number
      : 7;
    const rate = mean === null || scaleMax <= 0 ? null : Math.max(0, Math.min(1, mean / scaleMax));
    return { rate, text: mean === null ? '—' : mean.toFixed(1), n };
  }
  return { rate: null, text: '—', n };
}

/** Format an absolute lift honestly: proportions → "+N pts", means → "+N.N". */
function liftText(row: FunnelRow): string {
  if (row.lift_abs === null) return '—';
  const v = row.lift_abs;
  if (row.type === 'proportion') {
    const pts = Math.round(v * 100);
    return `${pts >= 0 ? '+' : ''}${pts} pts`;
  }
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
}

function relText(row: FunnelRow): string {
  if (row.lift_rel_pct === null) return '—';
  const v = Math.round(row.lift_rel_pct);
  return `${v >= 0 ? '+' : ''}${v}%`;
}

// Pass 46 Phase 4 — honest null-state card. Never a fake chart.
function NullState({ reason }: { reason: string }) {
  return (
    <section className="px-6 pt-2 pb-4 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-b2 bg-bg3 px-5 py-4">
        <h2 className="font-display font-bold text-t1 text-sm">Brand lift report</h2>
        <p className="text-xs text-t3 mt-1 leading-relaxed">{reason}</p>
      </div>
    </section>
  );
}

export function BrandLiftCenterpiece({ analysis }: { analysis: any; mission: any }) {
  // ── Honest null-states ────────────────────────────────────────────────
  if (!analysis || typeof analysis !== 'object') {
    return (
      <NullState reason="No deterministic lift analysis is attached to this mission yet. Re-run synthesis to generate a full brand-lift report." />
    );
  }
  const block = analysis.brand_lift ?? (analysis.methodology === 'brand_lift' ? analysis : null);
  if (!block || block.methodology !== 'brand_lift') {
    return (
      <NullState reason="This mission has analysis, but no brand-lift block. Brand lift requires exposed vs control cells captured at run time." />
    );
  }
  if (block.degenerate_reason === 'no_exposure_cells') {
    return (
      <NullState reason="This mission ran before exposed/control cells were captured, so lift can't be computed. Re-run to get a full lift report." />
    );
  }
  const funnel: FunnelRow[] = Array.isArray(block.funnel) ? block.funnel : [];
  const computable = funnel.filter((f) => f.lift_abs !== null);
  if (computable.length === 0) {
    return (
      <NullState reason="Exposed and control cells were captured, but no funnel stage produced a computable lift (every stage had an empty cell or an unsupported question type)." />
    );
  }

  // ── Order the funnel by consumer-funnel position ──────────────────────
  const ordered = [...funnel].sort(
    (a, b) => stageMeta(a.funnel_stage).order - stageMeta(b.funnel_stage).order,
  );

  // ── Headline: lead with the biggest lift (summary.biggest_lift), else
  //    the largest computable abs lift we can see. ─────────────────────────
  const biggestId: string | null = block.summary?.biggest_lift?.question_id ?? null;
  const headlineRow =
    (biggestId && computable.find((f) => f.question_id === biggestId)) ||
    [...computable].sort((a, b) => (b.lift_abs ?? 0) - (a.lift_abs ?? 0))[0];

  const hMeta = stageMeta(headlineRow.funnel_stage);
  const hExp = cellDisplay(headlineRow, headlineRow.exposed);
  const hCtl = cellDisplay(headlineRow, headlineRow.control);
  const perCellN = Math.min(hExp.n, hCtl.n);
  const smallN = perCellN < SMALL_N;
  const hSig = headlineRow.significance;
  const sigPhrase = hSig?.sig95
    ? 'significant at 95%'
    : hSig?.sig90
      ? 'significant at 90%'
      : 'not statistically significant';

  const liftPretty = liftText(headlineRow); // "+14 pts" / "+0.6"
  // Headline number = the lift itself (the thing that matters in a lift study).
  const heroNumber = liftPretty;

  // One-sentence interpretation, n-honest.
  const headlineSentence = smallN
    ? `Directional signal: exposure moved ${hMeta.label} ${liftPretty} (${hCtl.text}→${hExp.text}) — but with only n=${perCellN} per cell this is not yet a confident read.`
    : `Exposure lifted ${hMeta.label} ${liftPretty} (${hCtl.text}→${hExp.text}) — ${sigPhrase} (n=${perCellN}/cell).`;

  const stagesLifted = block.summary?.stages_lifted ?? computable.filter((f) => (f.lift_abs ?? 0) > 0).length;
  const stagesSig = block.summary?.stages_sig95
    ?? funnel.filter((f) => f.significance?.sig95).length;

  return (
    <section className="px-6 pt-2 pb-6 max-w-6xl mx-auto space-y-5">
      {/* ── (a) CONSUMER-FIRST HEADLINE ─────────────────────────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-pur font-display font-bold">
          Brand Lift · Headline
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
          {stagesLifted} of {computable.length} measured stage{computable.length === 1 ? '' : 's'} moved up
          {' · '}
          {stagesSig} significant at 95%
          {' · '}
          base: exposed n={block.cells?.exposed?.n ?? 0}, control n={block.cells?.control?.n ?? 0}
          {block.cells?.not_applicable?.n
            ? ` (n=${block.cells.not_applicable.n} excluded — no exposure cell)`
            : ''}
        </p>
      </div>

      {/* ── (b) CENTERPIECE VISUAL — horizontal brand funnel ─────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h3 className="font-display font-bold text-t1 text-sm">Brand funnel — exposed vs control</h3>
          <div className="flex items-center gap-3 text-[10px] text-t3">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm bg-t3/40" /> Control
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm bg-lime" /> Exposed
            </span>
            <span><span className="text-lime">▲</span> 95% · <span className="text-lime/70">△</span> 90% · ns n.s.</span>
          </div>
        </div>

        {/* SVG funnel: one row per stage, two stacked bars (control / exposed). */}
        <BrandFunnelSvg rows={ordered} />

        {/* Compact lift table — the auditable layer under the picture. */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-xs font-body border-collapse">
            <thead>
              <tr className="text-t3 border-b border-b2 text-left">
                <th className="py-2 pr-3 font-medium">Stage</th>
                <th className="py-2 px-2 font-medium text-right">Control</th>
                <th className="py-2 px-2 font-medium text-right">Exposed</th>
                <th className="py-2 px-2 font-medium text-right">Abs lift</th>
                <th className="py-2 px-2 font-medium text-right">Rel %</th>
                <th className="py-2 px-2 font-medium text-center">Sig</th>
                <th className="py-2 pl-2 font-medium text-right">n/cell</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((row) => {
                const exp = cellDisplay(row, row.exposed);
                const ctl = cellDisplay(row, row.control);
                const meta = stageMeta(row.funnel_stage);
                const cellN = Math.min(exp.n, ctl.n);
                const mark = sigMarker(row.significance);
                const thin = cellN < SMALL_N;
                const noLift = row.lift_abs === null;
                return (
                  <tr key={`${row.question_id}-${meta.label}`} className="border-b border-b2/40">
                    <td className="py-2 pr-3 text-t1">
                      {meta.label}
                      {thin && !noLift && (
                        <span className="ml-1 text-[10px] text-t3">(directional, n={cellN})</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums text-t2">{ctl.text}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-t1">{exp.text}</td>
                    <td className="py-2 px-2 text-right tabular-nums font-semibold text-t1">
                      {liftText(row)}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums text-t2">{relText(row)}</td>
                    <td className={`py-2 px-2 text-center ${mark.cls}`} title={mark.title}>
                      {noLift ? '—' : mark.glyph}
                    </td>
                    <td className="py-2 pl-2 text-right tabular-nums text-t3">{cellN || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-t3 mt-3 font-body leading-relaxed">
          Bars are scaled to each stage's rate (proportions) or mean-on-scale (ratings). Lift is exposed minus
          control: positive = the campaign moved the metric above an unexposed baseline.
          {funnel.length > computable.length
            ? ` ${funnel.length - computable.length} survey stage${funnel.length - computable.length === 1 ? '' : 's'} could not be scored and are omitted from the lift counts.`
            : ''}
        </p>
      </div>
    </section>
  );
}

/**
 * The horizontal funnel itself. viewBox-driven so it scales fluidly
 * (className="w-full h-auto"). Each stage = a label, two bars, and the
 * delta + sig marker in the trailing gap.
 */
function BrandFunnelSvg({ rows }: { rows: FunnelRow[] }) {
  const ROW_H = 56;          // vertical space per stage
  const BAR_H = 13;          // height of each of the two bars
  const LABEL_W = 168;       // left gutter for stage labels
  const TRACK_X = LABEL_W + 8;
  const VB_W = 760;
  const TRACK_W = VB_W - TRACK_X - 132; // leave room for the value/delta column
  const PAD_TOP = 8;
  const height = PAD_TOP + rows.length * ROW_H + 8;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${height}`}
      className="w-full h-auto mt-4"
      role="img"
      aria-label="Brand funnel: control versus exposed by stage"
    >
      {rows.map((row, i) => {
        const y = PAD_TOP + i * ROW_H;
        const exp = cellDisplay(row, row.exposed);
        const ctl = cellDisplay(row, row.control);
        const meta = stageMeta(row.funnel_stage);
        const cellN = Math.min(exp.n, ctl.n);
        const mark = sigMarker(row.significance);
        const expW = exp.rate === null ? 0 : Math.max(2, exp.rate * TRACK_W);
        const ctlW = ctl.rate === null ? 0 : Math.max(2, ctl.rate * TRACK_W);
        const noLift = row.lift_abs === null;
        const thin = cellN < SMALL_N;
        return (
          <g key={`${row.question_id}-${meta.label}-svg`}>
            {/* Stage label + per-cell n */}
            <text
              x={0}
              y={y + BAR_H + 4}
              className="fill-t1 font-display"
              style={{ fontSize: '12px', fontWeight: 700 }}
            >
              {meta.label}
            </text>
            <text x={0} y={y + 2 * BAR_H + 12} className="fill-t3 font-body" style={{ fontSize: '10px' }}>
              {cellN ? `n=${cellN}/cell${thin ? ' · directional' : ''}` : 'no data'}
            </text>

            {/* Control bar (muted) */}
            <rect x={TRACK_X} y={y} width={TRACK_W} height={BAR_H} rx={3} className="fill-t3/15" />
            <rect x={TRACK_X} y={y} width={ctlW} height={BAR_H} rx={3} className="fill-t3/40" />

            {/* Exposed bar (lime) */}
            <rect x={TRACK_X} y={y + BAR_H + 4} width={TRACK_W} height={BAR_H} rx={3} className="fill-t3/15" />
            <rect x={TRACK_X} y={y + BAR_H + 4} width={expW} height={BAR_H} rx={3} className="fill-lime" />

            {/* Trailing value + delta + sig */}
            <text
              x={TRACK_X + TRACK_W + 10}
              y={y + BAR_H - 1}
              className="fill-t2 font-body tabular-nums"
              style={{ fontSize: '11px' }}
            >
              {ctl.text}
            </text>
            <text
              x={TRACK_X + TRACK_W + 10}
              y={y + 2 * BAR_H + 6}
              className="fill-t1 font-body tabular-nums"
              style={{ fontSize: '11px', fontWeight: 700 }}
            >
              {exp.text}
            </text>
            <text
              x={VB_W - 4}
              y={y + BAR_H + 4}
              textAnchor="end"
              className={`font-display tabular-nums ${noLift ? 'fill-t3' : (row.lift_abs ?? 0) >= 0 ? 'fill-lime' : 'fill-red'}`}
              style={{ fontSize: '13px', fontWeight: 800 }}
            >
              {noLift ? '—' : `${liftText(row)} ${mark.glyph}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default BrandLiftCenterpiece;
