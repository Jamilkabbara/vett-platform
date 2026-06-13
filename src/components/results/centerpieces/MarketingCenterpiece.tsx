/**
 * Pass 46 Phase 4 — Marketing (Ad Effectiveness) report centerpiece.
 *
 * Research-grade headline + hero visual under the page header, ABOVE the
 * existing AdTesting dashboard ("Supporting Detail" layer).
 *
 * Reads the deterministic block computed by
 *   vettit-backend/src/services/analysis/marketing.js → computeMarketing()
 * verbatim. We render prose ABOUT that object; we never recompute math.
 *
 * Block shape (quoted from computeMarketing):
 *   { methodology:'marketing',
 *     funnel:{
 *       recall_aided:{n,positive_rate}|null,
 *       attribution:{n,correct_rate}|null,
 *       likeability:ratingStats|null,        // {mean,stddev,n,ci_low,ci_high}
 *       stopping_power:ratingStats|null,
 *       distinctiveness:ratingStats|null,
 *       persuasion:ratingStats|null,
 *       emotional:{n,distribution}|null,
 *       message_match:{n,positive_rate}|null,
 *       sharing:{n,positive_rate}|null },
 *     norms:null,                            // no benchmark DB yet
 *     openEnded:{recall_unaided_verbatims:[], message_verbatims:[]} }
 *
 * CREDIBILITY DOCTRINE (mandatory):
 *  - every % / mean shows its base n  ("62% (n=50)", "5.2/7 (n=48)")
 *  - small bases (n<10) read as a directional signal, never a confident number
 *  - rates are 0-1 fractions; rating means are on their 1-7 scale
 *  - norms are null → "vs category norm: not yet benchmarked" (never invent one)
 *  - plain-language stage labels; honest null-state instead of a fake chart
 */

const SMALL_N = 10;
const RATING_MAX = 7; // ad-effectiveness rating batteries are 1-7 (marketing.js header)

type RatingStat = { mean: number; stddev?: number; n: number; ci_low?: number; ci_high?: number } | null;
type RateBlock = { n: number; positive_rate?: number; correct_rate?: number } | null;

interface MarketingFunnel {
  recall_aided?: RateBlock;
  attribution?: RateBlock;
  likeability?: RatingStat;
  stopping_power?: RatingStat;
  distinctiveness?: RatingStat;
  persuasion?: RatingStat;
  emotional?: { n: number; distribution: Record<string, number> } | null;
  message_match?: RateBlock;
  sharing?: RateBlock;
}

// Pass 46 Phase 4 — the ad-effectiveness funnel, top to bottom, mapping the
// computeMarketing keys onto the classic attention → comprehension →
// persuasion → brand-linkage arc. `kind` drives how we read + draw the value.
type StageKind = 'rating' | 'rate';
interface StageDef {
  key: keyof MarketingFunnel;
  label: string;
  kind: StageKind;
  rateField?: 'positive_rate' | 'correct_rate';
  blurb: string; // plain-language "what this measures"
}
const STAGES: StageDef[] = [
  { key: 'stopping_power', label: 'Attention (Stopping Power)', kind: 'rating', blurb: 'Did the ad stop the scroll?' },
  { key: 'recall_aided', label: 'Ad Recall', kind: 'rate', rateField: 'positive_rate', blurb: 'Recognized having seen it' },
  { key: 'likeability', label: 'Likeability', kind: 'rating', blurb: 'How much people liked it' },
  { key: 'distinctiveness', label: 'Distinctiveness', kind: 'rating', blurb: 'Felt different from the category' },
  { key: 'persuasion', label: 'Persuasion', kind: 'rating', blurb: 'Moved purchase intent' },
  { key: 'message_match', label: 'Message Clarity', kind: 'rate', rateField: 'positive_rate', blurb: 'Got the intended message' },
  { key: 'attribution', label: 'Brand Linkage', kind: 'rate', rateField: 'correct_rate', blurb: 'Correctly named the brand' },
  { key: 'sharing', label: 'Sharing Intent', kind: 'rate', rateField: 'positive_rate', blurb: 'Would share it' },
];

interface Resolved {
  def: StageDef;
  present: boolean;
  n: number;
  rate: number | null;   // 0-1, for bar width
  display: string;       // "62%" or "5.2/7"
  scoreText: string;     // n-honest score for prose: "62% (n=50)" / "directional, n=4"
}

function resolveStage(def: StageDef, funnel: MarketingFunnel): Resolved {
  const raw = funnel[def.key] as RatingStat | RateBlock | { n: number } | undefined;
  if (!raw || typeof raw !== 'object') {
    return { def, present: false, n: 0, rate: null, display: '—', scoreText: 'not measured' };
  }
  const n = (raw as { n?: number }).n ?? 0;
  if (def.kind === 'rating') {
    const mean = (raw as RatingStat)?.mean;
    if (typeof mean !== 'number') {
      return { def, present: false, n, rate: null, display: '—', scoreText: 'not measured' };
    }
    const rate = Math.max(0, Math.min(1, mean / RATING_MAX));
    const display = `${mean.toFixed(1)}/${RATING_MAX}`;
    const scoreText = n < SMALL_N ? `${display} (directional, n=${n})` : `${display} (n=${n})`;
    return { def, present: true, n, rate, display, scoreText };
  }
  // rate stage
  const field = def.rateField || 'positive_rate';
  const r = (raw as RateBlock)?.[field];
  if (typeof r !== 'number' || n === 0) {
    return { def, present: false, n, rate: null, display: '—', scoreText: 'not measured' };
  }
  const pct = Math.round(r * 100);
  const display = `${pct}%`;
  const scoreText = n < SMALL_N ? `directional signal, n=${n}` : `${pct}% (n=${n})`;
  return { def, present: true, n, rate: r, display, scoreText };
}

// Pass 46 Phase 4 — honest null-state card. Never a fake chart.
function NullState({ reason }: { reason: string }) {
  return (
    <section className="px-6 pt-2 pb-4 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-b2 bg-bg3 px-5 py-4">
        <h2 className="font-display font-bold text-t1 text-sm">Ad effectiveness report</h2>
        <p className="text-xs text-t3 mt-1 leading-relaxed">{reason}</p>
      </div>
    </section>
  );
}

export function MarketingCenterpiece({ analysis }: { analysis: any; mission: any }) {
  // ── Honest null-states ────────────────────────────────────────────────
  if (!analysis || typeof analysis !== 'object') {
    return (
      <NullState reason="No deterministic ad-effectiveness analysis is attached to this mission yet. Re-run synthesis to generate a full report." />
    );
  }
  const block = analysis.marketing ?? (analysis.methodology === 'marketing' ? analysis : null);
  if (!block || block.methodology !== 'marketing' || !block.funnel || typeof block.funnel !== 'object') {
    return (
      <NullState reason="This mission has analysis, but no ad-effectiveness block was computed (the survey may not carry funnel-stage tags)." />
    );
  }

  const funnel: MarketingFunnel = block.funnel;
  const resolved = STAGES.map((def) => resolveStage(def, funnel));
  const measured = resolved.filter((r) => r.present);
  if (measured.length === 0) {
    return (
      <NullState reason="The ad-effectiveness block is present, but no funnel stage produced a usable score (every stage had an empty base)." />
    );
  }

  // ── Headline: contrast strongest vs weakest stage (by normalized rate) ──
  const sorted = [...measured].sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const single = strongest === weakest || measured.length === 1;

  // Hero number = the strongest stage's display value.
  const heroNumber = strongest.display;

  const headlineSentence = single
    ? `${strongest.def.label} is the clearest read at ${strongest.scoreText}. Other funnel stages did not produce a comparable score.`
    : `Strongest signal: ${strongest.def.label} at ${strongest.scoreText}. Weakest: ${weakest.def.label} at ${weakest.scoreText} — that gap is where the creative is leaking.`;

  return (
    <section className="px-6 pt-2 pb-6 max-w-6xl mx-auto space-y-5">
      {/* ── (a) CONSUMER-FIRST HEADLINE ─────────────────────────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-pur font-display font-bold">
          Ad Effectiveness · Headline
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
          {measured.length} of {STAGES.length} funnel stages measured
          {' · '}
          vs category norm: not yet benchmarked
        </p>
      </div>

      {/* ── (b) CENTERPIECE VISUAL — ad-effectiveness funnel ─────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h3 className="font-display font-bold text-t1 text-sm">Ad-effectiveness funnel</h3>
          <span className="text-[10px] text-t3">
            Ratings shown on a 1–{RATING_MAX} scale · rates as % of base
          </span>
        </div>

        <MarketingFunnelSvg rows={resolved} />

        {/* Compact score table — auditable layer under the picture. */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-xs font-body border-collapse">
            <thead>
              <tr className="text-t3 border-b border-b2 text-left">
                <th className="py-2 pr-3 font-medium">Stage</th>
                <th className="py-2 px-2 font-medium">What it measures</th>
                <th className="py-2 px-2 font-medium text-right">Score</th>
                <th className="py-2 px-2 font-medium text-right">Base n</th>
                <th className="py-2 pl-2 font-medium text-right">vs norm</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map((r) => (
                <tr key={r.def.key} className="border-b border-b2/40">
                  <td className="py-2 pr-3 text-t1">
                    {r.def.label}
                    {r.present && r.n < SMALL_N && (
                      <span className="ml-1 text-[10px] text-t3">(directional)</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-t3">{r.def.blurb}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-semibold text-t1">{r.display}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-t3">{r.n || '—'}</td>
                  <td className="py-2 pl-2 text-right text-t3 italic">not benchmarked</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-t3 mt-3 font-body leading-relaxed">
          Bars are scaled to each stage's rating mean (out of {RATING_MAX}) or positive rate. There is no
          validated category-norm database yet, so no benchmark line is drawn — comparisons are within this
          creative only, not against industry baselines.
        </p>
      </div>
    </section>
  );
}

/**
 * The ad-effectiveness funnel itself. viewBox-driven so it scales fluidly.
 * One row per stage: label + a single lime bar (∝ rate) + the value, with
 * "not measured" rendered honestly for absent stages.
 */
function MarketingFunnelSvg({ rows }: { rows: Resolved[] }) {
  const ROW_H = 38;
  const BAR_H = 14;
  const LABEL_W = 196;
  const TRACK_X = LABEL_W + 8;
  const VB_W = 760;
  const TRACK_W = VB_W - TRACK_X - 96;
  const PAD_TOP = 8;
  const height = PAD_TOP + rows.length * ROW_H + 8;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${height}`}
      className="w-full h-auto mt-4"
      role="img"
      aria-label="Ad-effectiveness funnel by stage"
    >
      {rows.map((r, i) => {
        const y = PAD_TOP + i * ROW_H;
        const w = r.rate === null ? 0 : Math.max(2, r.rate * TRACK_W);
        const thin = r.present && r.n < SMALL_N;
        return (
          <g key={r.def.key}>
            {/* Label */}
            <text
              x={0}
              y={y + BAR_H - 1}
              className="fill-t1 font-display"
              style={{ fontSize: '12px', fontWeight: 700 }}
            >
              {r.def.label}
            </text>
            {/* Track + value bar */}
            <rect x={TRACK_X} y={y} width={TRACK_W} height={BAR_H} rx={3} className="fill-t3/15" />
            {r.present ? (
              <rect x={TRACK_X} y={y} width={w} height={BAR_H} rx={3} className="fill-lime" />
            ) : null}
            {/* Trailing value */}
            <text
              x={VB_W - 4}
              y={y + BAR_H - 1}
              textAnchor="end"
              className={`font-display tabular-nums ${r.present ? 'fill-t1' : 'fill-t3'}`}
              style={{ fontSize: '12px', fontWeight: 800 }}
            >
              {r.present ? `${r.display}${thin ? ` (n=${r.n})` : ''}` : 'not measured'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default MarketingCenterpiece;
