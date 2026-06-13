/**
 * Pass 46 Phase 4 — Validate (concept test) report centerpiece.
 *
 * The research-grade headline + hero visual that sits directly under the
 * page header, ABOVE the existing dashboard ("Supporting Detail" layer).
 *
 * Reads the deterministic block computed by
 *   vettit-backend/src/services/analysis/validate.js → computeValidate()
 * verbatim. We render prose ABOUT that object; we never recompute math.
 *
 * Block shape (quoted from computeValidate):
 *   { methodology:'validate', n,
 *     scores:{ reaction, relevance, uniqueness, believability }  // each
 *              ratingStats{ mean, n, ... } | null
 *     intent:{ top2_pct, n, distribution } | null,
 *     price_fairness:{ distribution, n } | null,
 *     verbatims:{ [question_id]:{ question, n, items:[] } },
 *     norms: null }   // ← ALWAYS null; there is NO benchmark DB. Never invent.
 *
 * Scales (pinned by the survey generator): reaction is 1-10; relevance,
 * uniqueness, believability are 1-7. Bars are drawn on each score's own
 * scale.
 *
 * CREDIBILITY DOCTRINE (matches BrandLiftCenterpiece):
 *  - every % / mean shows its base n
 *  - small base (n<10) reads as directional, never a confident figure
 *  - norms === null → label every score "category norm: not yet benchmarked".
 *    NEVER fabricate a benchmark line.
 *  - never fake a chart: honest null-state; any null sub-block is omitted
 */

const SMALL_N = 10;

interface RatingStat { mean?: number | null; n?: number | null }
interface Scores {
  reaction: RatingStat | null;
  relevance: RatingStat | null;
  uniqueness: RatingStat | null;
  believability: RatingStat | null;
}
interface Intent { top2_pct: number; n: number; distribution?: Record<string, number> }
interface PriceFairness { distribution?: Record<string, number>; n: number }
interface VerbatimGroup { question?: string; n?: number; items?: string[] }

// Each dimension with its label and scale max (reaction 1-10, rest 1-7).
const DIMS: { key: keyof Scores; label: string; max: number }[] = [
  { key: 'reaction', label: 'Reaction (appeal)', max: 10 },
  { key: 'relevance', label: 'Relevance to needs', max: 7 },
  { key: 'uniqueness', label: 'Uniqueness', max: 7 },
  { key: 'believability', label: 'Believability', max: 7 },
];

function stat(s: RatingStat | null): { mean: number; n: number } | null {
  if (!s || typeof s.mean !== 'number') return null;
  return { mean: s.mean, n: typeof s.n === 'number' ? s.n : 0 };
}

// Pass 46 Phase 4 — honest null-state card. Never a fake chart.
function NullState({ reason }: { reason: string }) {
  return (
    <section className="px-6 pt-2 pb-4 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-b2 bg-bg3 px-5 py-4">
        <h2 className="font-display font-bold text-t1 text-sm">Concept-test report</h2>
        <p className="text-xs text-t3 mt-1 leading-relaxed">{reason}</p>
      </div>
    </section>
  );
}

export function ValidateCenterpiece({ analysis }: { analysis: any; mission: any }) {
  // ── Honest null-states ────────────────────────────────────────────────
  if (!analysis || typeof analysis !== 'object') {
    return (
      <NullState reason="No deterministic concept-test analysis is attached to this mission yet. Re-run synthesis to generate a full appeal / intent report." />
    );
  }
  const block = analysis.validate ?? (analysis.methodology === 'validate' ? analysis : null);
  if (!block || block.methodology !== 'validate') {
    return (
      <NullState reason="This mission has analysis, but no concept-test block. The appeal / intent report requires the validate survey instrument captured at run time." />
    );
  }

  const scores: Scores = block.scores ?? { reaction: null, relevance: null, uniqueness: null, believability: null };
  const intent: Intent | null = block.intent ?? null;
  const priceFairness: PriceFairness | null = block.price_fairness ?? null;
  const verbatims: Record<string, VerbatimGroup> =
    block.verbatims && typeof block.verbatims === 'object' ? block.verbatims : {};

  const scoredDims = DIMS.map((d) => ({ ...d, s: stat(scores[d.key]) })).filter((d) => d.s);
  if (scoredDims.length === 0 && !intent) {
    return (
      <NullState reason="The concept-test instrument ran, but no diagnostic scored (reaction / relevance / uniqueness / believability were empty or off-scale) and purchase intent did not compute. Re-run with a larger sample to populate the report." />
    );
  }

  const reaction = stat(scores.reaction);

  // ── Headline: reaction mean + intent top-2-box, n-honest. ──────────────
  let heroNumber = '—';
  const bits: string[] = [];
  if (reaction) {
    heroNumber = `${reaction.mean.toFixed(1)}`;
    const thin = reaction.n < SMALL_N;
    bits.push(
      thin
        ? `Concept scores a directional ${reaction.mean.toFixed(1)}/10 on reaction (n=${reaction.n}).`
        : `Concept scores ${reaction.mean.toFixed(1)}/10 on reaction (n=${reaction.n}).`,
    );
  }
  if (intent) {
    const i = `${Math.round(intent.top2_pct)}%`;
    if (!reaction) heroNumber = i;
    const thin = intent.n < SMALL_N;
    bits.push(
      thin
        ? `Directionally, ${i} top-2-box purchase intent (n=${intent.n}).`
        : `${i} top-2-box purchase intent (n=${intent.n}).`,
    );
  }
  const headlineSentence = bits.join(' ');

  // ── Barrier signal: the weakest-scoring diagnostic (as a fraction of its
  //    own scale) + a "concerns" verbatim if present. Honest, not a norm. ──
  const weakest = [...scoredDims].sort((a, b) => (a.s!.mean / a.max) - (b.s!.mean / b.max))[0] || null;
  // Concerns are the SECOND qualitative question (audience is 3rd); take the
  // first qualitative group that carries verbatim items as the barrier voice.
  const concernVerbatim = (() => {
    for (const g of Object.values(verbatims)) {
      const item = (g.items || []).find((s) => typeof s === 'string' && s.trim() !== '');
      if (item) return item.trim();
    }
    return null;
  })();

  return (
    <section className="px-6 pt-2 pb-6 max-w-6xl mx-auto space-y-5">
      {/* ── (a) HEADLINE ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-pur font-display font-bold">
          Concept Test · Headline
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
          {/* norms === null — state honestly, never fabricate a benchmark. */}
          No category norms are available yet, so these scores are not benchmarked — read them on their own scales below.
        </p>
      </div>

      {/* ── (b) CENTERPIECE — diagnostic bars + intent tile + barrier ─────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5 space-y-6">
        {/* Diagnostic score bars, each on its own scale */}
        {scoredDims.length > 0 ? (
          <div>
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h3 className="font-display font-bold text-t1 text-sm">Concept diagnostics</h3>
              <span className="text-[10px] text-t3">category norm: not yet benchmarked</span>
            </div>
            <DiagnosticBars dims={scoredDims} />
          </div>
        ) : (
          <p className="text-xs text-t3 font-body leading-relaxed">
            No diagnostic dimension scored for this run.
          </p>
        )}

        {/* Intent tile + barrier breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {intent ? (
            <div className="rounded-xl border border-b2 bg-black/20 px-4 py-4">
              <p className="text-[10px] uppercase tracking-widest text-t3 font-display font-bold">
                Purchase intent — top-2-box
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display font-black tabular-nums text-lime" style={{ fontSize: '2rem' }}>
                  {Math.round(intent.top2_pct)}%
                </span>
                <span className="text-xs text-t3 tabular-nums">
                  {intent.n < SMALL_N ? `directional, n=${intent.n}` : `n=${intent.n}`}
                </span>
              </div>
              <p className="text-[10px] text-t3 mt-1 font-body leading-relaxed">
                &ldquo;Definitely&rdquo; + &ldquo;Probably would buy&rdquo; of the 5-point intent scale.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-b2 bg-black/20 px-4 py-4">
              <p className="text-[10px] uppercase tracking-widest text-t3 font-display font-bold">Purchase intent</p>
              <p className="text-xs text-t3 mt-1 font-body leading-relaxed">Intent question did not score for this run.</p>
            </div>
          )}

          {/* Barrier: weakest diagnostic + a concern verbatim, if any. */}
          <div className="rounded-xl border border-b2 bg-black/20 px-4 py-4">
            <p className="text-[10px] uppercase tracking-widest text-t3 font-display font-bold">Top barrier signal</p>
            {weakest ? (
              <>
                <p className="text-sm text-t1 mt-1 font-body">
                  Weakest diagnostic: <span className="font-semibold">{weakest.label}</span>{' '}
                  <span className="tabular-nums">{weakest.s!.mean.toFixed(1)}/{weakest.max}</span>
                  <span className="text-t3"> (n={weakest.s!.n})</span>
                </p>
                {concernVerbatim && (
                  <p className="text-[11px] text-t3 mt-2 font-body leading-relaxed">
                    Representative concern: &ldquo;{concernVerbatim}&rdquo;
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-t3 mt-1 font-body leading-relaxed">
                No diagnostic scored, so no barrier can be ranked yet.
              </p>
            )}
          </div>
        </div>

        {/* Price fairness, only if it was tested (price supplied). */}
        {priceFairness && priceFairness.distribution && Object.keys(priceFairness.distribution).length > 0 && (
          <PriceFairnessRow pf={priceFairness} />
        )}
      </div>
    </section>
  );
}

/**
 * Diagnostic score bars — each drawn as a fraction of ITS OWN scale (reaction
 * /10, the three diagnostics /7). No benchmark marker: norms are null.
 */
function DiagnosticBars({ dims }: { dims: { label: string; max: number; s: { mean: number; n: number } | null }[] }) {
  return (
    <div className="mt-3 space-y-2">
      {dims.map((d) => {
        const mean = d.s!.mean;
        const n = d.s!.n;
        const pct = Math.max(0, Math.min(100, (mean / d.max) * 100));
        const thin = n > 0 && n < SMALL_N;
        return (
          <div key={d.label} className="grid grid-cols-[150px_1fr_104px] gap-3 items-center text-xs">
            <span className="text-t3 truncate" title={d.label}>{d.label}</span>
            <div className="relative h-3 bg-t3/15 rounded">
              <div className="absolute top-0 left-0 h-full rounded bg-lime" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-right tabular-nums text-t1 font-semibold">
              {mean.toFixed(1)}/{d.max}
              {thin ? <span className="text-t3 font-normal"> (n={n})</span> : null}
            </span>
          </div>
        );
      })}
      <p className="text-[10px] text-t3 mt-2 font-body leading-relaxed">
        Each bar is the mean as a share of its own scale (reaction is 1-10; relevance, uniqueness and
        believability are 1-7). No category norm line — none exists yet.
      </p>
    </div>
  );
}

/** Price-fairness mini distribution (Too low / Fair / Too high), n-honest. */
function PriceFairnessRow({ pf }: { pf: PriceFairness }) {
  const dist = pf.distribution || {};
  const order = ['Too low', 'Fair', 'Too high'];
  const keys = [...order.filter((k) => k in dist), ...Object.keys(dist).filter((k) => !order.includes(k))];
  const total = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const thin = pf.n < SMALL_N;
  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h3 className="font-display font-bold text-t1 text-sm">Price fairness</h3>
        <span className="text-[10px] text-t3">{thin ? `directional, n=${pf.n}` : `n=${pf.n}`}</span>
      </div>
      <div className="mt-3 space-y-2">
        {keys.map((k) => {
          const v = Number(dist[k]) || 0;
          const pct = (v / total) * 100;
          return (
            <div key={k} className="grid grid-cols-[100px_1fr_64px] gap-3 items-center text-xs">
              <span className="text-t3">{k}</span>
              <div className="relative h-3 bg-t3/15 rounded">
                <div
                  className={`absolute top-0 left-0 h-full rounded ${k === 'Fair' ? 'bg-lime' : 'bg-lime/55'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-right tabular-nums text-t1 font-semibold">{Math.round(pct)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ValidateCenterpiece;
