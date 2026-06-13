/**
 * Pass 46 Phase 4 — Satisfaction (NPS + CSAT + CES) report centerpiece.
 *
 * The research-grade headline + hero visual that sits directly under the
 * page header, ABOVE the existing dashboard ("Supporting Detail" layer).
 *
 * Reads the deterministic block computed by
 *   vettit-backend/src/services/analysis/satisfaction.js → computeSatisfaction()
 * verbatim. We render prose ABOUT that object; we never recompute math.
 *
 * Block shape (quoted from computeSatisfaction):
 *   { methodology:'satisfaction', n,
 *     nps:{ score, n, segments:{ promoters:{count,pct}, passives:{count,pct},
 *           detractors:{count,pct} } } | null,
 *     csat:{ top2_pct, n, distribution } | null,
 *     ces:{ top2_pct, n, distribution } | null,
 *     attributes:[{ label, stats:{ mean, n, ... } }] | null,
 *     retention:{ stats:{mean,n,...}, distribution, n } | null,
 *     issues:{ ranked:[{option,count,pct_of_respondents}], n, selections } | null,
 *     drivers:[{ kind, question_id, n, verbatims:[] }] }
 *
 * CREDIBILITY DOCTRINE (mandatory, matches BrandLiftCenterpiece):
 *  - every % shows its base n  ("52% (n=50)")
 *  - small cells (n<10) read as a directional signal, never a confident %
 *  - the NPS benchmark band is a STATED rule-of-thumb for orientation, not a
 *    reading of this panel — labelled as such, never presented as a result
 *  - plain language, never the raw methodology enum
 *  - never fake a chart: honest null-state, and any sub-block that is null is
 *    simply omitted (NPS present but CES null → show NPS, omit CES)
 */

// Pass 46 Phase 4 — directional-signal floor. Below this a base is too thin
// to quote a confident %, matching the satisfaction.js honesty rules.
const SMALL_N = 10;

interface Seg { count: number; pct: number }
interface Nps {
  score: number;
  n: number;
  segments: { promoters: Seg; passives: Seg; detractors: Seg };
}
interface TopBox { top2_pct: number; n: number; distribution?: Record<string, number> }
interface RatingStat { mean?: number | null; n?: number | null }
interface Attribute { label: string; stats: RatingStat | null }
interface Driver { kind?: string; question_id?: string; n?: number; verbatims?: string[] }

// Pass 46 Phase 4 — NPS orientation bands (services rule-of-thumb). These are
// a STATED reference, never a reading of this mission's panel. The headline
// names the band only to orient the reader, with that caveat in the copy.
const NPS_BANDS: { min: number; label: string }[] = [
  { min: 70, label: 'world-class' },
  { min: 50, label: 'excellent' },
  { min: 20, label: 'strong (above the +20 services rule-of-thumb)' },
  { min: 0, label: 'positive but below the +20 services rule-of-thumb' },
  { min: -100, label: 'net-negative — detractors outweigh promoters' },
];
function npsBand(score: number): string {
  return (NPS_BANDS.find((b) => score >= b.min) || NPS_BANDS[NPS_BANDS.length - 1]).label;
}

/** A driver verbatim theme, if any driver carried verbatims. First non-empty. */
function firstDriverVerbatim(drivers: Driver[] | undefined): string | null {
  for (const d of drivers || []) {
    const v = (d.verbatims || []).find((s) => typeof s === 'string' && s.trim() !== '');
    if (v) return v.trim();
  }
  return null;
}

// Pass 46 Phase 4 — honest null-state card. Never a fake chart. (Mirrors
// BrandLiftCenterpiece.NullState exactly.)
function NullState({ reason }: { reason: string }) {
  return (
    <section className="px-6 pt-2 pb-4 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-b2 bg-bg3 px-5 py-4">
        <h2 className="font-display font-bold text-t1 text-sm">Satisfaction report</h2>
        <p className="text-xs text-t3 mt-1 leading-relaxed">{reason}</p>
      </div>
    </section>
  );
}

export function SatisfactionCenterpiece({ analysis }: { analysis: any; mission: any }) {
  // ── Honest null-states ────────────────────────────────────────────────
  if (!analysis || typeof analysis !== 'object') {
    return (
      <NullState reason="No deterministic satisfaction analysis is attached to this mission yet. Re-run synthesis to generate a full NPS / CSAT / CES report." />
    );
  }
  const block = analysis.satisfaction ?? (analysis.methodology === 'satisfaction' ? analysis : null);
  if (!block || block.methodology !== 'satisfaction') {
    return (
      <NullState reason="This mission has analysis, but no satisfaction block. NPS / CSAT / CES require the satisfaction survey instrument captured at run time." />
    );
  }

  const nps: Nps | null = block.nps ?? null;
  const csat: TopBox | null = block.csat ?? null;
  const ces: TopBox | null = block.ces ?? null;
  const attributes: Attribute[] = Array.isArray(block.attributes) ? block.attributes : [];
  const drivers: Driver[] = Array.isArray(block.drivers) ? block.drivers : [];

  // If literally nothing scored, say so honestly rather than render an empty shell.
  if (!nps && !csat && !ces && attributes.length === 0) {
    return (
      <NullState reason="The satisfaction instrument ran, but no scoreable answers came back (every NPS / CSAT / CES / attribute question was empty or off-scale). Re-run with a larger sample to populate the report." />
    );
  }

  // ── Headline: lead with NPS when present (the satisfaction north star),
  //    else CSAT, else CES. n-honest throughout. ───────────────────────────
  const driverTheme = firstDriverVerbatim(drivers);
  let heroNumber = '—';
  let headlineSentence = '';
  if (nps) {
    const smallN = nps.n < SMALL_N;
    heroNumber = `${nps.score >= 0 ? '+' : ''}${nps.score}`;
    headlineSentence = smallN
      ? `Directional NPS ${heroNumber} (n=${nps.n}) — too thin to read as a confident score; treat as an early signal, not a benchmark.`
      : `NPS ${heroNumber} (n=${nps.n}) — ${npsBand(nps.score)}.${driverTheme ? ` Top detractor/driver theme: "${driverTheme}".` : ''}`;
  } else if (csat) {
    const smallN = csat.n < SMALL_N;
    heroNumber = `${Math.round(csat.top2_pct)}%`;
    headlineSentence = smallN
      ? `Directional CSAT ${heroNumber} top-2-box (n=${csat.n}) — too thin for a confident read.`
      : `${heroNumber} top-2-box satisfied (n=${csat.n}).${driverTheme ? ` Theme: "${driverTheme}".` : ''}`;
  } else if (ces) {
    const smallN = ces.n < SMALL_N;
    heroNumber = `${Math.round(ces.top2_pct)}%`;
    headlineSentence = smallN
      ? `Directional CES ${heroNumber} top-2-box ease (n=${ces.n}) — too thin for a confident read.`
      : `${heroNumber} found it easy to do business (CES top-2-box, n=${ces.n}).`;
  } else {
    heroNumber = `${attributes.length}`;
    headlineSentence = `Attribute ratings captured; headline score (NPS / CSAT / CES) not available for this run.`;
  }

  // Footnote base summary — every base stated.
  const baseParts: string[] = [];
  if (nps) baseParts.push(`NPS n=${nps.n}`);
  if (csat) baseParts.push(`CSAT n=${csat.n}`);
  if (ces) baseParts.push(`CES n=${ces.n}`);

  return (
    <section className="px-6 pt-2 pb-6 max-w-6xl mx-auto space-y-5">
      {/* ── (a) HEADLINE ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-pur font-display font-bold">
          Satisfaction · Headline
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
          {baseParts.length ? baseParts.join(' · ') : `attribute dimensions: ${attributes.length}`}
          {' · '}
          NPS bands are a stated services rule-of-thumb for orientation, not a panel reading.
        </p>
      </div>

      {/* ── (b) CENTERPIECE — NPS gauge + CSAT/CES tiles + attribute bars ──── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5 space-y-6">
        {/* NPS segment bar with score in the center */}
        {nps ? (
          <div>
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h3 className="font-display font-bold text-t1 text-sm">Net Promoter Score</h3>
              <div className="flex items-center gap-3 text-[10px] text-t3">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-3 h-2 rounded-sm bg-red" /> Detractors (0-6)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-3 h-2 rounded-sm bg-t3/40" /> Passives (7-8)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-3 h-2 rounded-sm bg-lime" /> Promoters (9-10)
                </span>
              </div>
            </div>
            <NpsBar nps={nps} />
          </div>
        ) : (
          <SubNull label="Net Promoter Score" reason="No NPS question scored for this run — the 0-10 recommend item was empty or off-scale." />
        )}

        {/* CSAT + CES stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {csat ? (
            <StatTile
              label="CSAT — top-2-box satisfied"
              value={`${Math.round(csat.top2_pct)}%`}
              n={csat.n}
              hint='"Satisfied" + "Very satisfied" of the 5-point scale'
            />
          ) : (
            <SubNull label="CSAT" reason="No CSAT question scored for this run." compact />
          )}
          {ces ? (
            <StatTile
              label="CES — top-2-box ease"
              value={`${Math.round(ces.top2_pct)}%`}
              n={ces.n}
              hint="6 + 7 of the 7-point effort scale (7 = very easy)"
            />
          ) : (
            <SubNull label="CES" reason="No CES question scored for this run." compact />
          )}
        </div>

        {/* Attribute means as small bars */}
        {attributes.length > 0 && attributes.some((a) => a.stats && typeof a.stats.mean === 'number') && (
          <div>
            <h3 className="font-display font-bold text-t1 text-sm mb-3">Attribute ratings — mean on a 1-5 scale</h3>
            <AttributeBars attributes={attributes} />
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * NPS as a 3-segment stacked bar (detractors red / passives muted /
 * promoters lime) with the score big in the center. viewBox-driven so it
 * scales fluidly (w-full h-auto).
 */
function NpsBar({ nps }: { nps: Nps }) {
  const VB_W = 760;
  const VB_H = 150;
  const BAR_Y = 96;
  const BAR_H = 34;
  const PAD_X = 8;
  const TRACK_W = VB_W - PAD_X * 2;
  const total = Math.max(1, nps.n);
  const det = nps.segments.detractors.count / total;
  const pas = nps.segments.passives.count / total;
  const pro = nps.segments.promoters.count / total;
  const detW = det * TRACK_W;
  const pasW = pas * TRACK_W;
  const proW = pro * TRACK_W;
  const thin = nps.n < SMALL_N;

  const segLabel = (seg: Seg) => `${seg.count} · ${Math.round(seg.pct)}%`;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="w-full h-auto mt-3"
      role="img"
      aria-label="NPS composition: detractors, passives, promoters"
    >
      {/* Big score, centered above the bar */}
      <text
        x={VB_W / 2}
        y={56}
        textAnchor="middle"
        className="fill-lime font-display tabular-nums"
        style={{ fontSize: '48px', fontWeight: 900 }}
      >
        {`${nps.score >= 0 ? '+' : ''}${nps.score}`}
      </text>
      <text
        x={VB_W / 2}
        y={78}
        textAnchor="middle"
        className="fill-t3 font-body"
        style={{ fontSize: '12px' }}
      >
        {thin ? `NPS · directional, n=${nps.n}` : `NPS · n=${nps.n}`}
      </text>

      {/* Track + 3 segments */}
      <rect x={PAD_X} y={BAR_Y} width={TRACK_W} height={BAR_H} rx={6} className="fill-t3/15" />
      {detW > 0 && (
        <rect x={PAD_X} y={BAR_Y} width={detW} height={BAR_H} rx={0} className="fill-red" />
      )}
      {pasW > 0 && (
        <rect x={PAD_X + detW} y={BAR_Y} width={pasW} height={BAR_H} className="fill-t3/40" />
      )}
      {proW > 0 && (
        <rect x={PAD_X + detW + pasW} y={BAR_Y} width={proW} height={BAR_H} className="fill-lime" />
      )}

      {/* Per-segment counts under the bar */}
      <text x={PAD_X} y={BAR_Y + BAR_H + 16} className="fill-red font-body tabular-nums" style={{ fontSize: '11px' }}>
        Detractors {segLabel(nps.segments.detractors)}
      </text>
      <text x={VB_W / 2} y={BAR_Y + BAR_H + 16} textAnchor="middle" className="fill-t2 font-body tabular-nums" style={{ fontSize: '11px' }}>
        Passives {segLabel(nps.segments.passives)}
      </text>
      <text x={VB_W - PAD_X} y={BAR_Y + BAR_H + 16} textAnchor="end" className="fill-lime font-body tabular-nums" style={{ fontSize: '11px' }}>
        Promoters {segLabel(nps.segments.promoters)}
      </text>
    </svg>
  );
}

/** Labeled stat tile for CSAT / CES top-2-box, n-honest. */
function StatTile({ label, value, n, hint }: { label: string; value: string; n: number; hint: string }) {
  const thin = n < SMALL_N;
  return (
    <div className="rounded-xl border border-b2 bg-black/20 px-4 py-4">
      <p className="text-[10px] uppercase tracking-widest text-t3 font-display font-bold">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-display font-black tabular-nums text-lime" style={{ fontSize: '2rem' }}>{value}</span>
        <span className="text-xs text-t3 tabular-nums">{thin ? `directional, n=${n}` : `n=${n}`}</span>
      </div>
      <p className="text-[10px] text-t3 mt-1 font-body leading-relaxed">{hint}</p>
    </div>
  );
}

/** Attribute means as small horizontal bars on a 1-5 scale. */
function AttributeBars({ attributes }: { attributes: Attribute[] }) {
  const scored = attributes.filter((a) => a.stats && typeof a.stats.mean === 'number');
  return (
    <div className="space-y-2">
      {scored.map((a) => {
        const mean = a.stats!.mean as number;
        const n = typeof a.stats!.n === 'number' ? (a.stats!.n as number) : 0;
        const pct = Math.max(0, Math.min(100, (mean / 5) * 100));
        const thin = n > 0 && n < SMALL_N;
        return (
          <div key={a.label} className="grid grid-cols-[150px_1fr_92px] gap-3 items-center text-xs">
            <span className="text-t3 truncate" title={a.label}>{a.label}</span>
            <div className="relative h-3 bg-t3/15 rounded">
              <div className="absolute top-0 left-0 h-full rounded bg-lime" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-right tabular-nums text-t1 font-semibold">
              {mean.toFixed(1)}/5
              {thin ? <span className="text-t3 font-normal"> (n={n})</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** A sub-block null notice (honest "this slice didn't compute"). */
function SubNull({ label, reason, compact }: { label: string; reason: string; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-b2 bg-black/20 ${compact ? 'px-4 py-4' : 'px-4 py-5'}`}>
      <p className="text-[10px] uppercase tracking-widest text-t3 font-display font-bold">{label}</p>
      <p className="text-xs text-t3 mt-1 font-body leading-relaxed">{reason}</p>
    </div>
  );
}

export default SatisfactionCenterpiece;
