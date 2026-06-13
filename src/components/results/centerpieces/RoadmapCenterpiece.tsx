/**
 * Pass 46 Phase 4 — Feature Roadmap report centerpiece.
 *
 * The research-grade headline + hero visual that sits directly under the
 * page header, ABOVE the existing roadmap dashboard ("Supporting Detail"
 * layer). Two centerpiece charts: a Kano quadrant scatter and a MaxDiff
 * diverging priority bar chart.
 *
 * Reads the deterministic block computed by
 *   vettit-backend/src/services/analysis/roadmap.js → computeRoadmap()
 * verbatim. We render prose + plots ABOUT that object; we never recompute
 * the methodology math.
 *
 * Block shape (quoted from computeRoadmap):
 *   { methodology:'roadmap', n,
 *     maxdiff:{
 *       n,
 *       features:[{ feature_id, label, utility, best, worst, appearances }],
 *       ranking:[id...] }|null,                     // utility=(best−worst)/appearances, CAN be negative
 *     maxdiff_degenerate_reason?,
 *     kano:{
 *       features:[{ feature_id, label, classification, n,
 *                   counts:{attractive,must_be,performance,indifferent,reverse,questionable} }] }|null,
 *     kano_degenerate_reason? }
 *
 * KANO QUADRANT COORDINATES (derived from counts — the standard Better/Worse
 * CS-coefficient placement, Berger et al. 1993):
 *   x = dysfunctional-sensitivity = (must_be + performance) / answered
 *       → how much its ABSENCE hurts  (the "Worse" / dissatisfaction axis)
 *   y = functional-delight          = (attractive + performance) / answered
 *       → how much its PRESENCE delights (the "Better" / satisfaction axis)
 *   Zones (split at 0.5 on each axis): must-have = high x / low y;
 *   delighter = low x / high y; performance = high both; indifferent = low both.
 *   The backend's modal `classification` drives the dot COLOUR; the counts
 *   drive the POSITION — they agree by construction.
 *
 * CREDIBILITY DOCTRINE (mandatory):
 *  - per-feature base n always on screen; small bases (n<10) read as
 *    "directional", never a confident classification
 *  - utility is a signed best-worst score (can be negative) — diverging bars
 *  - plain language; honest null-state instead of a faked chart
 *  - if MaxDiff is null but Kano exists we render Kano alone (and vice-versa)
 */

// Pass 46 Phase 4 — directional-signal floor: below this a feature's base is
// too thin to quote a confident classification (matches roadmap.js philosophy).
const SMALL_N = 10;

interface MaxDiffFeature {
  feature_id: string;
  label: string | null;
  utility: number | null; // (best−worst)/appearances; CAN be negative
  best: number;
  worst: number;
  appearances: number;
}
interface MaxDiffBlock { n: number; features: MaxDiffFeature[]; ranking: string[] }

type KanoClass =
  | 'attractive' | 'must_be' | 'performance' | 'indifferent' | 'reverse' | 'questionable';
interface KanoCounts {
  attractive: number; must_be: number; performance: number;
  indifferent: number; reverse: number; questionable: number;
}
interface KanoFeature {
  feature_id: string;
  label: string | null;
  classification: KanoClass | null;
  n: number;
  counts: KanoCounts;
}
interface KanoBlock { features: KanoFeature[] }

// Plain-language Kano labels + dot colours (tokens only).
const KANO_LABEL: Record<KanoClass, string> = {
  attractive: 'Delighter',
  must_be: 'Must-have',
  performance: 'Performance',
  indifferent: 'Indifferent',
  reverse: 'Reverse',
  questionable: 'Questionable',
};
const KANO_FILL: Record<KanoClass, string> = {
  attractive: 'fill-pur',
  must_be: 'fill-red',
  performance: 'fill-lime',
  indifferent: 'fill-t3',
  reverse: 'fill-org',
  questionable: 'fill-blu',
};
const KANO_TEXT: Record<KanoClass, string> = {
  attractive: 'text-pur',
  must_be: 'text-red',
  performance: 'text-lime',
  indifferent: 'text-t3',
  reverse: 'text-org',
  questionable: 'text-blu',
};

/** Feature display name with an id fallback. */
function featLabel(f: { label: string | null; feature_id: string }): string {
  return f.label && f.label.trim().length > 0 ? f.label : f.feature_id;
}

/**
 * Kano Better/Worse coordinates from counts.
 *   x (worse / dysfunctional-sensitivity) = (must_be + performance) / answered
 *   y (better / functional-delight)        = (attractive + performance) / answered
 * "answered" excludes reverse + questionable (the pathological responses that
 * don't speak to satisfaction), matching the standard CS-coefficient base.
 * Returns null when there's no clean satisfaction base to place against.
 */
function kanoCoords(c: KanoCounts): { x: number; y: number } | null {
  const answered = c.attractive + c.must_be + c.performance + c.indifferent;
  if (answered <= 0) return null;
  return {
    x: (c.must_be + c.performance) / answered,
    y: (c.attractive + c.performance) / answered,
  };
}

// Pass 46 Phase 4 — honest null-state card. Never a faked chart.
function NullState({ reason }: { reason: string }) {
  return (
    <section className="px-6 pt-2 pb-4 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-b2 bg-bg3 px-5 py-4">
        <h2 className="font-display font-bold text-t1 text-sm">Roadmap report</h2>
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

export function RoadmapCenterpiece({ analysis }: { analysis: any; mission: any }) {
  // ── Honest null-states ────────────────────────────────────────────────
  if (!analysis || typeof analysis !== 'object') {
    return (
      <NullState reason="No deterministic roadmap analysis is attached to this mission yet. Re-run synthesis to generate a full MaxDiff + Kano report." />
    );
  }
  const block = analysis.methodology === 'roadmap' ? analysis : (analysis.roadmap ?? null);
  if (!block || block.methodology !== 'roadmap') {
    return (
      <NullState reason="This mission has analysis, but no roadmap block. Roadmap requires a MaxDiff or Kano instrument captured at run time." />
    );
  }

  const maxdiff: MaxDiffBlock | null = block.maxdiff ?? null;
  const kano: KanoBlock | null = block.kano ?? null;

  if (!maxdiff && !kano) {
    const mdReason = reasonGloss(block.maxdiff_degenerate_reason, 'MaxDiff could not be computed');
    const kReason = reasonGloss(block.kano_degenerate_reason, 'Kano could not be computed');
    return (
      <NullState reason={`Neither prioritization model produced a result. ${mdReason}; ${kReason}. The survey likely lacked clean best/worst or functional/dysfunctional answers.`} />
    );
  }

  // Features sorted by utility (desc), nulls last — the backend already
  // ranks this way, but we re-sort defensively so the bar chart is correct.
  const mdFeatures = maxdiff
    ? [...maxdiff.features].sort((a, b) => {
        if (a.utility == null && b.utility == null) return 0;
        if (a.utility == null) return 1;
        if (b.utility == null) return -1;
        return b.utility - a.utility;
      })
    : [];

  const kanoFeatures = kano?.features ?? [];
  const kanoById = new Map(kanoFeatures.map((f) => [String(f.feature_id), f]));

  // ── (a) CONSUMER-FIRST HEADLINE ───────────────────────────────────────
  // Hero = the top MaxDiff feature (highest utility). If MaxDiff is absent,
  // fall back to the strongest must-have / highest-base Kano feature.
  let heroNumber = '—';
  let headlineSentence = '';
  let headlineN = maxdiff?.n ?? block.n ?? 0;

  const topMd = mdFeatures.find((f) => f.utility != null) ?? null;

  if (topMd) {
    const u = topMd.utility as number;
    heroNumber = (u >= 0 ? '+' : '') + u.toFixed(2);
    headlineN = maxdiff?.n ?? 0;
    const kClass = kanoById.get(String(topMd.feature_id))?.classification ?? null;
    const kPhrase = kClass ? ` Kano classifies it as a ${KANO_LABEL[kClass].toLowerCase()}.` : '';
    headlineSentence = headlineN < SMALL_N
      ? `Directional: "${featLabel(topMd)}" tops the priority list (MaxDiff utility ${heroNumber}), but with only n=${headlineN} respondents this is an early signal, not a verdict.${kPhrase}`
      : `"${featLabel(topMd)}" is the top priority — the highest MaxDiff utility (${heroNumber}) across ${headlineN} respondents.${kPhrase}`;
  } else if (kanoFeatures.length > 0) {
    // No MaxDiff utility — lead with the clearest must-have, else the
    // highest-base classified feature.
    const mustHaves = kanoFeatures.filter((f) => f.classification === 'must_be');
    const lead = (mustHaves.length
      ? [...mustHaves].sort((a, b) => b.n - a.n)[0]
      : [...kanoFeatures].sort((a, b) => b.n - a.n)[0]);
    const lClass = lead.classification ?? 'indifferent';
    heroNumber = KANO_LABEL[lClass];
    headlineN = lead.n;
    headlineSentence = lead.n < SMALL_N
      ? `Directional: "${featLabel(lead)}" reads as a ${KANO_LABEL[lClass].toLowerCase()} in the Kano model, but only n=${lead.n} gave a complete pair — treat as an early signal. MaxDiff did not converge, so there is no utility ranking.`
      : `"${featLabel(lead)}" is the clearest read — a ${KANO_LABEL[lClass].toLowerCase()} feature in the Kano model (n=${lead.n}). MaxDiff did not converge, so Kano carries the roadmap read.`;
  } else {
    headlineSentence = 'The prioritization models ran but produced no rankable feature. Read the detail below as directional shape only.';
  }

  return (
    <section className="px-6 pt-2 pb-6 max-w-6xl mx-auto space-y-5">
      {/* ── (a) CONSUMER-FIRST HEADLINE ─────────────────────────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-pur font-display font-bold">
          Roadmap · Headline
        </p>
        <div className="mt-2 flex flex-col md:flex-row md:items-end gap-3 md:gap-6">
          <span
            className="font-display font-black tabular-nums leading-none text-lime"
            style={{ fontSize: heroNumber.length > 6 ? '2rem' : '3.25rem' }}
          >
            {heroNumber}
          </span>
          <p className="font-body text-t1 text-base md:text-lg leading-snug md:pb-1">
            {headlineSentence}
          </p>
        </div>
        <p className="text-xs text-t3 mt-3 font-body">
          {maxdiff ? `MaxDiff: ${mdFeatures.length} feature${mdFeatures.length === 1 ? '' : 's'}, n=${maxdiff.n}` : 'MaxDiff: not computed'}
          {' · '}
          {kano ? `Kano: ${kanoFeatures.length} feature${kanoFeatures.length === 1 ? '' : 's'} classified` : 'Kano: not computed'}
          {headlineN < SMALL_N ? ' · directional (small sample)' : ''}
        </p>
      </div>

      {/* ── (b) CENTERPIECE — Kano quadrant scatter ───────────────────────── */}
      {kano && kanoFeatures.length > 0 ? (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h3 className="font-display font-bold text-t1 text-sm">Kano quadrant</h3>
            <div className="flex items-center gap-3 text-[10px] text-t3 flex-wrap">
              {(['must_be', 'performance', 'attractive', 'indifferent'] as KanoClass[]).map((c) => (
                <span key={c} className="inline-flex items-center gap-1">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${KANO_FILL[c].replace('fill-', 'bg-')}`} />
                  {KANO_LABEL[c]}
                </span>
              ))}
            </div>
          </div>
          <KanoQuadrant features={kanoFeatures} />
          <p className="text-[10px] text-t3 mt-3 font-body leading-relaxed">
            Each feature is placed by how much its absence hurts (x, →) versus how much its presence delights (y, ↑),
            derived from the Kano response counts. Top-left = must-have (pain if missing, little delight);
            top-right = performance (more is better); bottom-right = delighter (pure upside); bottom-left = indifferent.
            Dot colour is the modal classification; base n is labelled.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-4">
          <h3 className="font-display font-bold text-t1 text-sm">Kano quadrant</h3>
          <p className="text-xs text-t3 mt-1 leading-relaxed">
            {reasonGloss(block.kano_degenerate_reason, 'No feature had enough paired functional/dysfunctional answers to classify')}.
            {maxdiff ? ' The MaxDiff priority chart below carries the roadmap read.' : ''}
          </p>
        </div>
      )}

      {/* ── (b cont.) MaxDiff diverging priority bars ─────────────────────── */}
      {maxdiff && mdFeatures.length > 0 ? (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h3 className="font-display font-bold text-t1 text-sm">MaxDiff priority</h3>
            <span className="text-[10px] text-t3">
              Utility = (best − worst) / appearances · positive = wanted, negative = rejected
            </span>
          </div>
          <MaxDiffBars features={mdFeatures} kanoById={kanoById} />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-xs font-body border-collapse">
              <thead>
                <tr className="text-t3 border-b border-b2 text-left">
                  <th className="py-2 pr-3 font-medium">Feature</th>
                  <th className="py-2 px-2 font-medium text-right">Utility</th>
                  <th className="py-2 px-2 font-medium text-right">Best</th>
                  <th className="py-2 px-2 font-medium text-right">Worst</th>
                  <th className="py-2 px-2 font-medium text-right">Shown</th>
                  <th className="py-2 pl-2 font-medium">Kano</th>
                </tr>
              </thead>
              <tbody>
                {mdFeatures.map((f, i) => {
                  const k = kanoById.get(String(f.feature_id));
                  const kClass = k?.classification ?? null;
                  return (
                    <tr key={f.feature_id} className={`border-b border-b2/40 ${i === 0 && f.utility != null ? 'bg-lime-10' : ''}`}>
                      <td className="py-2 pr-3 text-t1">
                        {featLabel(f)}
                        {i === 0 && f.utility != null && <span className="ml-1 text-[10px] text-lime font-semibold">top</span>}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums font-semibold text-t1">
                        {f.utility == null ? '—' : (f.utility >= 0 ? '+' : '') + f.utility.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-t2">{f.best}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-t2">{f.worst}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-t3">{f.appearances}</td>
                      <td className="py-2 pl-2">
                        {kClass ? <span className={KANO_TEXT[kClass]}>{KANO_LABEL[kClass]}</span> : <span className="text-t3">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-t3 mt-3 font-body leading-relaxed">
            Utility is the count-based best-worst score: each feature's best votes minus worst votes, divided by how
            many MaxDiff sets it appeared in. Bars diverge from zero — positive means respondents picked it as a "best"
            more than a "worst"; negative means the reverse.
            {(maxdiff.n < SMALL_N)
              ? ` Small sample (n=${maxdiff.n}) — read the ranking order, not the exact utilities.`
              : ''}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-4">
          <h3 className="font-display font-bold text-t1 text-sm">MaxDiff priority</h3>
          <p className="text-xs text-t3 mt-1 leading-relaxed">
            {reasonGloss(block.maxdiff_degenerate_reason, 'No parseable best/worst answers to rank features')}.
            {kano ? ' The Kano quadrant above carries the roadmap read.' : ''}
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * Kano quadrant scatter. viewBox-driven (className="w-full h-auto"). Plots
 * each feature by its Better/Worse coordinates (see kanoCoords). The plane
 * is split at 0.5 on each axis into the four zones; dot colour is the modal
 * classification. Labels are nudged to reduce overlap but stay simple.
 */
function KanoQuadrant({ features }: { features: KanoFeature[] }) {
  const VB_W = 760, VB_H = 420;
  const PAD = 56;
  const plotW = VB_W - 2 * PAD;
  const plotH = VB_H - 2 * PAD;

  const xOf = (v: number) => PAD + Math.max(0, Math.min(1, v)) * plotW;
  const yOf = (v: number) => VB_H - PAD - Math.max(0, Math.min(1, v)) * plotH; // y up

  const placed = features
    .map((f) => ({ f, c: kanoCoords(f.counts) }))
    .filter((p): p is { f: KanoFeature; c: { x: number; y: number } } => p.c !== null);

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="w-full h-auto mt-4"
      role="img"
      aria-label="Kano quadrant scatter of features"
    >
      {/* plot border + midlines */}
      <rect x={PAD} y={PAD} width={plotW} height={plotH} className="fill-none stroke-b1" strokeWidth={0.5} />
      <line x1={xOf(0.5)} x2={xOf(0.5)} y1={PAD} y2={VB_H - PAD} className="stroke-b2" strokeWidth={0.75} strokeDasharray="3 3" />
      <line x1={PAD} x2={VB_W - PAD} y1={yOf(0.5)} y2={yOf(0.5)} className="stroke-b2" strokeWidth={0.75} strokeDasharray="3 3" />

      {/* zone labels (corners) */}
      <text x={PAD + 6} y={PAD + 14} className="fill-red/70 font-display" style={{ fontSize: '10px', fontWeight: 700 }}>Must-have</text>
      <text x={VB_W - PAD - 6} y={PAD + 14} textAnchor="end" className="fill-lime/70 font-display" style={{ fontSize: '10px', fontWeight: 700 }}>Performance</text>
      <text x={VB_W - PAD - 6} y={VB_H - PAD - 8} textAnchor="end" className="fill-pur/70 font-display" style={{ fontSize: '10px', fontWeight: 700 }}>Delighter</text>
      <text x={PAD + 6} y={VB_H - PAD - 8} className="fill-t3 font-display" style={{ fontSize: '10px', fontWeight: 700 }}>Indifferent</text>

      {/* axis labels */}
      <text x={PAD + plotW / 2} y={VB_H - 16} textAnchor="middle" className="fill-t3 font-body" style={{ fontSize: '10px' }}>
        Dysfunctional sensitivity — pain if missing →
      </text>
      <text
        x={18}
        y={PAD + plotH / 2}
        textAnchor="middle"
        transform={`rotate(-90 18 ${PAD + plotH / 2})`}
        className="fill-t3 font-body"
        style={{ fontSize: '10px' }}
      >
        Functional delight — joy if present ↑
      </text>

      {/* feature dots + labels */}
      {placed.map(({ f, c }) => {
        const cx = xOf(c.x);
        const cy = yOf(c.y);
        const cls = (f.classification ?? 'indifferent') as KanoClass;
        const thin = f.n < SMALL_N;
        const flip = cx > VB_W - 140; // keep labels on-canvas at the right edge
        return (
          <g key={f.feature_id}>
            <circle cx={cx} cy={cy} r={5} className={KANO_FILL[cls]} stroke="#0B0C15" strokeWidth={1} />
            <text
              x={flip ? cx - 8 : cx + 8}
              y={cy + 3}
              textAnchor={flip ? 'end' : 'start'}
              className="fill-t1 font-body"
              style={{ fontSize: '10px' }}
            >
              {featLabel(f)}
              <tspan className="fill-t3"> (n={f.n}{thin ? ', dir.' : ''})</tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * MaxDiff diverging priority bars. viewBox-driven. Utility can be negative,
 * so bars diverge left/right from a centred zero line. The strongest |utility|
 * sets the symmetric scale. Each row shows the feature, its bar, and the
 * signed utility; best/worst/appearances live in the table beside the chart.
 */
function MaxDiffBars({
  features, kanoById,
}: { features: MaxDiffFeature[]; kanoById: Map<string, KanoFeature> }) {
  const rows = features.filter((f) => f.utility != null) as (MaxDiffFeature & { utility: number })[];
  const nulls = features.filter((f) => f.utility == null);
  // Symmetric domain so the zero line is centred; floor at 0.1 so flat data still draws.
  const maxAbs = Math.max(0.1, ...rows.map((f) => Math.abs(f.utility)));

  const ROW_H = 30;
  const LABEL_W = 188;
  const VAL_W = 64;
  const VB_W = 760;
  const TRACK_X = LABEL_W + 8;
  const TRACK_W = VB_W - TRACK_X - VAL_W - 8;
  const ZERO_X = TRACK_X + TRACK_W / 2;
  const halfTrack = TRACK_W / 2;
  const PAD_TOP = 8;
  const height = PAD_TOP + rows.length * ROW_H + 12;

  return (
    <>
      <svg
        viewBox={`0 0 ${VB_W} ${height}`}
        className="w-full h-auto mt-4"
        role="img"
        aria-label="MaxDiff diverging utility bars by feature"
      >
        {/* zero baseline */}
        <line x1={ZERO_X} x2={ZERO_X} y1={PAD_TOP - 2} y2={PAD_TOP + rows.length * ROW_H} className="stroke-b2" strokeWidth={1} />
        {rows.map((f, i) => {
          const y = PAD_TOP + i * ROW_H;
          const w = (Math.abs(f.utility) / maxAbs) * halfTrack;
          const pos = f.utility >= 0;
          const kClass = kanoById.get(String(f.feature_id))?.classification ?? null;
          const barCls = kClass ? KANO_FILL[kClass] : (pos ? 'fill-lime' : 'fill-red');
          return (
            <g key={f.feature_id}>
              {/* label */}
              <text x={0} y={y + ROW_H / 2 + 3} className="fill-t1 font-body" style={{ fontSize: '11px', fontWeight: i === 0 ? 700 : 500 }}>
                {truncate(featLabel(f), 26)}
              </text>
              {/* diverging bar */}
              <rect
                x={pos ? ZERO_X : ZERO_X - w}
                y={y + 6}
                width={Math.max(1, w)}
                height={ROW_H - 12}
                rx={2}
                className={barCls}
              />
              {/* signed value */}
              <text
                x={VB_W - 4}
                y={y + ROW_H / 2 + 3}
                textAnchor="end"
                className="fill-t1 font-display tabular-nums"
                style={{ fontSize: '11px', fontWeight: 700 }}
              >
                {(f.utility >= 0 ? '+' : '') + f.utility.toFixed(2)}
              </text>
            </g>
          );
        })}
      </svg>
      {nulls.length > 0 && (
        <p className="text-[10px] text-t3 mt-2 font-body">
          {nulls.length} feature{nulls.length === 1 ? '' : 's'} never appeared in a scored MaxDiff set and carr
          {nulls.length === 1 ? 'ies' : 'y'} no utility: {nulls.map((f) => featLabel(f)).join(', ')}.
        </p>
      )}
    </>
  );
}

/** Trim long labels for the bar axis (the table shows the full name). */
function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export default RoadmapCenterpiece;
