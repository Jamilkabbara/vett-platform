/**
 * Pass 46 Phase 4 — Competitor Analysis report centerpiece.
 *
 * The research-grade headline + hero visual that sits directly under the
 * page header, ABOVE the existing dashboard ("Supporting Detail" layer).
 *
 * Reads the deterministic block computed by
 *   vettit-backend/src/services/analysis/competitor.js → computeCompetitor()
 * verbatim. We render prose ABOUT that object; we never recompute math.
 *
 * Block shape (quoted from computeCompetitor):
 *   { methodology:'competitor', n, focal_brand,
 *     brands:[{ brand_id, label, is_focal,
 *       awareness_pct, consideration_pct, preference_pct, use_pct
 *         (each {pct,count,base} | null),
 *       nps:{score,...}|null,
 *       attributes:{ <attr>: pct } | null,
 *       attributes_base: number | null }],
 *     share_of_preference:{ question_id, base, shares } | null,
 *     switching | null, wom | null,
 *     gaps:[{ attribute, focal_mean, best_competitor, best_competitor_mean,
 *             gap }] | null }   // gap = focal − best competitor (NEGATIVE = focal trails)
 *
 * CREDIBILITY DOCTRINE (mandatory, mirrors BrandLiftCenterpiece):
 *  - every % shows its base n
 *  - small n (<10) reads as a directional signal, never a confident %
 *  - attribute endorsement is a 0-100 % of the question's answer base
 *  - gap is in percentage points (attribute endorsement deltas)
 *  - radar needs ≥3 shared axes to be meaningful → grouped bars below that
 *  - never fake a chart: honest null-state instead
 */

const SMALL_N = 10;
// Pass 46 Phase 4 — a 2-axis radar is geometrically degenerate; below this
// many shared attributes we fall back to grouped bars (per the spec).
const MIN_RADAR_AXES = 3;
// Cap the radar's axis count so labels stay legible; we keep the attributes
// with the widest focal-vs-field spread (most informative).
const MAX_RADAR_AXES = 8;

interface Pct { pct: number; count: number; base: number }
interface Brand {
  brand_id: string;
  label: string;
  is_focal: boolean;
  awareness_pct: Pct | null;
  consideration_pct: Pct | null;
  preference_pct: Pct | null;
  use_pct: Pct | null;
  nps: { score: number } | null;
  attributes: Record<string, number> | null;
  attributes_base?: number | null;
}
interface Gap {
  attribute: string;
  focal_mean: number;
  best_competitor: string;
  best_competitor_mean: number;
  gap: number;
}
interface CompetitorBlock {
  methodology: string;
  n: number;
  focal_brand: string | null;
  brands: Brand[];
  share_of_preference: { question_id: string; base: number; shares: Record<string, { count: number; pct: number }> } | null;
  switching: unknown | null;
  wom: unknown | null;
  gaps: Gap[] | null;
}

const prettyAttr = (a: string) => a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Pass 46 Phase 4 — honest null-state card. Never a fake chart.
function NullState({ reason }: { reason: string }) {
  return (
    <section className="px-6 pt-2 pb-4 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-b2 bg-bg3 px-5 py-4">
        <h2 className="font-display font-bold text-t1 text-sm">Competitor analysis report</h2>
        <p className="text-xs text-t3 mt-1 leading-relaxed">{reason}</p>
      </div>
    </section>
  );
}

export function CompetitorCenterpiece({ analysis }: { analysis: any; mission: any }) {
  // ── Honest null-states ────────────────────────────────────────────────
  if (!analysis || typeof analysis !== 'object') {
    return (
      <NullState reason="No deterministic competitor analysis is attached to this mission yet. Re-run synthesis to generate a full brand-health report." />
    );
  }
  const block: CompetitorBlock | null = analysis.competitor
    ?? (analysis.methodology === 'competitor' ? analysis : null);
  if (!block || block.methodology !== 'competitor') {
    return (
      <NullState reason="This mission has analysis, but no competitor block. Competitor analysis requires the brand-health funnel captured at run time." />
    );
  }
  const brands: Brand[] = Array.isArray(block.brands) ? block.brands : [];
  if (brands.length === 0) {
    return (
      <NullState reason="No brands were resolved from the survey, so there is nothing to compare. Re-run with a focal brand and competitor list." />
    );
  }

  const focal = brands.find((b) => b.is_focal) ?? null;
  const competitors = brands.filter((b) => !b.is_focal);

  // ── Shared attribute axes: attributes the focal brand AND at least one
  //    competitor both have. These power the radar. ──
  const focalAttrs = focal?.attributes ?? null;
  const sharedAxes: string[] = focalAttrs
    ? Object.keys(focalAttrs).filter((a) => competitors.some((c) => c.attributes && c.attributes[a] !== undefined))
    : [];
  // Keep the most discriminating axes (widest focal-vs-best-competitor gap).
  const gapByAttr = new Map((block.gaps ?? []).map((g) => [g.attribute, Math.abs(g.gap)]));
  const radarAxes = [...sharedAxes]
    .sort((a, b) => (gapByAttr.get(b) ?? 0) - (gapByAttr.get(a) ?? 0))
    .slice(0, MAX_RADAR_AXES);
  const useRadar = radarAxes.length >= MIN_RADAR_AXES;

  // Top competitor for the radar's purple polygon: highest preference,
  // else highest mean attribute endorsement.
  const topCompetitor = [...competitors].sort((a, b) => {
    const ap = a.preference_pct?.pct ?? meanAttr(a);
    const bp = b.preference_pct?.pct ?? meanAttr(b);
    return bp - ap;
  })[0] ?? null;

  // ── Gap callouts: gaps[] is sorted ascending (focal's worst deficit
  //    first). Biggest deficit = first negative; biggest lead = max gap. ──
  const gaps = Array.isArray(block.gaps) ? block.gaps : [];
  const worstGap = gaps.find((g) => g.gap < 0) ?? null; // focal trails most
  const bestGap = gaps.length
    ? gaps.reduce((m, g) => (g.gap > m.gap ? g : m), gaps[0])
    : null; // focal leads most (or least-bad)

  // ── Headline ──────────────────────────────────────────────────────────
  const focalLabel = focal?.label || block.focal_brand || 'Your brand';
  const attrBase = focal?.attributes_base ?? null;
  const smallAttrN = attrBase != null && attrBase > 0 && attrBase < SMALL_N;

  let heroNumber = '—';
  let headlineSentence: string;
  if (focal && bestGap && bestGap.gap > 0) {
    heroNumber = `+${Math.round(bestGap.gap)}`;
    const leadClause = `${focalLabel} leads on ${prettyAttr(bestGap.attribute)} (+${Math.round(bestGap.gap)} pts vs ${bestGap.best_competitor})`;
    const trailClause = worstGap
      ? ` but trails ${worstGap.best_competitor} on ${prettyAttr(worstGap.attribute)} by ${Math.abs(Math.round(worstGap.gap))} pts`
      : '';
    const nClause = smallAttrN ? ` — directional, n=${attrBase}` : attrBase != null ? ` (n=${attrBase})` : '';
    headlineSentence = `${leadClause}${trailClause}${nClause}.`;
  } else if (focal && worstGap) {
    // Focal leads on nothing measured; lead with the biggest deficit.
    heroNumber = `${Math.round(worstGap.gap)}`;
    const nClause = smallAttrN ? ` — directional, n=${attrBase}` : attrBase != null ? ` (n=${attrBase})` : '';
    headlineSentence = `${focalLabel} trails the field — its biggest deficit is ${prettyAttr(worstGap.attribute)}, ${Math.abs(Math.round(worstGap.gap))} pts behind ${worstGap.best_competitor}${nClause}. No attribute shows a lead.`;
  } else if (focal?.preference_pct) {
    // No attribute data — fall back to a preference-led headline.
    heroNumber = `${Math.round(focal.preference_pct.pct)}%`;
    const base = focal.preference_pct.base;
    const small = base > 0 && base < SMALL_N;
    headlineSentence = small
      ? `Directional signal: ${focalLabel} holds ${Math.round(focal.preference_pct.pct)}% share of preference, but with only n=${base} treat this as a lean.`
      : `${focalLabel} holds ${Math.round(focal.preference_pct.pct)}% share of preference (n=${base}). No attribute battery was captured, so positioning gaps are unavailable.`;
  } else {
    headlineSentence = `${focalLabel} is the focal brand, but neither an attribute battery nor a preference question produced computable numbers — treat everything below as directional.`;
  }

  // Share-of-preference present?
  const hasPreference = brands.some((b) => b.preference_pct !== null);

  return (
    <section className="px-6 pt-2 pb-6 max-w-6xl mx-auto space-y-5">
      {/* ── (a) HEADLINE ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
        <p className="text-[11px] uppercase tracking-widest text-pur font-display font-bold">
          Competitor Analysis · Headline
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
          {brands.length} brand{brands.length === 1 ? '' : 's'} ({competitors.length} competitor{competitors.length === 1 ? '' : 's'} vs {focalLabel})
          {' · '}
          {sharedAxes.length} shared attribute{sharedAxes.length === 1 ? '' : 's'}
          {' · '}
          base: n={block.n} respondents
        </p>
      </div>

      {/* ── (b) COMPETITIVE ATTRIBUTE PROFILE — radar or grouped bars ────── */}
      {radarAxes.length > 0 ? (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h3 className="font-display font-bold text-t1 text-sm">
              Competitive attribute profile
            </h3>
            <div className="flex items-center gap-3 text-[10px] text-t3">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-2 rounded-sm bg-lime" /> {focalLabel.slice(0, 18)}
              </span>
              {topCompetitor && (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-3 h-2 rounded-sm bg-pur" /> {(topCompetitor.label).slice(0, 18)}
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-t3 mt-0.5 font-body">
            % of respondents endorsing each attribute (0-100). {useRadar ? 'Each axis is one attribute; further from centre = stronger.' : 'Too few shared attributes for a radar — shown as grouped bars.'}
            {worstGap ? ` Biggest gap: ${prettyAttr(worstGap.attribute)}, ${focalLabel} ${Math.abs(Math.round(worstGap.gap))} pts behind ${worstGap.best_competitor}.` : ''}
          </p>
          {useRadar ? (
            <AttributeRadar
              axes={radarAxes}
              focal={focal}
              topCompetitor={topCompetitor}
              others={competitors.filter((c) => c !== topCompetitor)}
            />
          ) : (
            <GroupedAttrBars
              axes={radarAxes}
              focal={focal}
              competitors={competitors}
              focalLabel={focalLabel}
            />
          )}
          {smallAttrN && (
            <p className="text-[10px] text-t3 mt-2 font-body italic">
              Attribute endorsement is from n={attrBase} respondents — directional only.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <h3 className="font-display font-bold text-t1 text-sm">Competitive attribute profile</h3>
          <p className="text-xs text-t3 mt-1 font-body">
            No attribute is shared between {focalLabel} and a competitor, so a competitive profile can&apos;t be drawn. The funnel and preference detail below still apply.
          </p>
        </div>
      )}

      {/* ── (b) SHARE OF PREFERENCE — bars, focal highlighted ────────────── */}
      {hasPreference ? (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h3 className="font-display font-bold text-t1 text-sm">Share of preference</h3>
            <span className="text-[10px] text-t3 inline-flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm bg-lime" /> {focalLabel.slice(0, 18)}
            </span>
          </div>
          <PreferenceBars brands={brands} base={block.share_of_preference?.base ?? 0} />
        </div>
      ) : (
        <div className="rounded-2xl border border-b2 bg-bg3 px-6 py-5">
          <h3 className="font-display font-bold text-t1 text-sm">Share of preference</h3>
          <p className="text-xs text-t3 mt-1 font-body">
            No preference question was captured, so brand preference share is unavailable.
          </p>
        </div>
      )}
    </section>
  );
}

/** Mean attribute endorsement across a brand's attribute map (0 when none). */
function meanAttr(b: Brand): number {
  if (!b.attributes) return 0;
  const vals = Object.values(b.attributes);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
}

/**
 * Attribute radar/spider. Axes are the shared attributes; each brand is a
 * polygon whose vertices sit at (endorsement %/100) along each axis. Focal
 * is lime, top competitor purple, the rest faint. Grid rings at 25/50/75/100.
 */
function AttributeRadar({
  axes, focal, topCompetitor, others,
}: { axes: string[]; focal: Brand | null; topCompetitor: Brand | null; others: Brand[] }) {
  const VB = 520;
  const cx = VB / 2;
  const cy = VB / 2 + 6;
  const R = 168;
  const N = axes.length;

  // Angle for axis i (start at top, go clockwise).
  const angle = (i: number) => (-Math.PI / 2) + (i * 2 * Math.PI) / N;
  const point = (i: number, frac: number) => {
    const a = angle(i);
    const r = Math.max(0, Math.min(1, frac)) * R;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const polygon = (b: Brand | null) => {
    if (!b || !b.attributes) return '';
    return axes
      .map((attr, i) => {
        const v = b.attributes![attr];
        const [x, y] = point(i, (typeof v === 'number' ? v : 0) / 100);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      className="w-full h-auto mt-3"
      style={{ maxWidth: 520, margin: '0 auto', display: 'block' }}
      role="img"
      aria-label="Competitive attribute radar"
    >
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={axes.map((_, i) => { const [x, y] = point(i, f); return `${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ')}
          className="fill-none stroke-t3/20"
          strokeWidth={1}
        />
      ))}
      {/* Spokes + axis labels */}
      {axes.map((attr, i) => {
        const [ex, ey] = point(i, 1);
        const [lx, ly] = point(i, 1.16);
        const anchor = Math.abs(lx - cx) < 6 ? 'middle' : lx > cx ? 'start' : 'end';
        return (
          <g key={attr}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} className="stroke-t3/20" strokeWidth={1} />
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              className="fill-t3 font-body"
              style={{ fontSize: '10px', fontWeight: 600 }}
            >
              {prettyAttr(attr).slice(0, 16)}
            </text>
          </g>
        );
      })}
      {/* Other competitors — faint, drawn first (behind). */}
      {others.map((b) => (
        <polygon
          key={b.brand_id}
          points={polygon(b)}
          className="fill-t3/5 stroke-t3/30"
          strokeWidth={1}
        />
      ))}
      {/* Top competitor — purple. */}
      {topCompetitor && (
        <polygon
          points={polygon(topCompetitor)}
          className="fill-pur/15 stroke-pur"
          strokeWidth={2}
        />
      )}
      {/* Focal — lime, on top. */}
      {focal && (
        <polygon
          points={polygon(focal)}
          className="fill-lime/20 stroke-lime"
          strokeWidth={2.5}
        />
      )}
      {/* Focal vertex dots */}
      {focal && focal.attributes && axes.map((attr, i) => {
        const [x, y] = point(i, (focal.attributes![attr] ?? 0) / 100);
        return <circle key={`d-${attr}`} cx={x} cy={y} r={3} className="fill-lime" />;
      })}
    </svg>
  );
}

/**
 * Grouped attribute bars — the <3-axis fallback. One band per attribute,
 * one bar per brand (focal lime, competitors muted), each labelled with %.
 */
function GroupedAttrBars({
  axes, focal, competitors, focalLabel,
}: { axes: string[]; focal: Brand | null; competitors: Brand[]; focalLabel: string }) {
  const orderedBrands = [focal, ...competitors].filter((b): b is Brand => b != null);
  const BAR_H = 14;
  const ROW_H = 20;
  const BAND_H = 26 + orderedBrands.length * ROW_H;
  const LABEL_W = 150;
  const TRACK_X = LABEL_W + 8;
  const VB_W = 760;
  const TRACK_W = VB_W - TRACK_X - 60;
  const PAD = 6;
  const height = PAD + axes.length * BAND_H + 4;

  return (
    <svg viewBox={`0 0 ${VB_W} ${height}`} className="w-full h-auto mt-3" role="img" aria-label="Attribute endorsement by brand">
      {axes.map((attr, ai) => {
        const bandY = PAD + ai * BAND_H;
        return (
          <g key={attr}>
            <text x={0} y={bandY + 14} className="fill-t1 font-display" style={{ fontSize: '12px', fontWeight: 700 }}>
              {prettyAttr(attr)}
            </text>
            {orderedBrands.map((b, ri) => {
              const y = bandY + 22 + ri * ROW_H;
              const isFocal = b.is_focal;
              const v = b.attributes?.[attr];
              const has = typeof v === 'number';
              const w = has ? Math.max(2, (v / 100) * TRACK_W) : 0;
              return (
                <g key={`${attr}-${b.brand_id}`}>
                  <text x={LABEL_W} y={y + BAR_H - 3} textAnchor="end" className={isFocal ? 'fill-lime font-body' : 'fill-t3 font-body'} style={{ fontSize: '9px', fontWeight: isFocal ? 700 : 400 }}>
                    {(b.label).slice(0, 16)}
                  </text>
                  <rect x={TRACK_X} y={y} width={TRACK_W} height={BAR_H} rx={2} className="fill-t3/12" />
                  <rect x={TRACK_X} y={y} width={w} height={BAR_H} rx={2} className={isFocal ? 'fill-lime' : 'fill-t3/45'} />
                  <text x={TRACK_X + TRACK_W + 6} y={y + BAR_H - 3} className={`font-body tabular-nums ${isFocal ? 'fill-lime' : 'fill-t1'}`} style={{ fontSize: '10px', fontWeight: 700 }}>
                    {has ? `${Math.round(v)}%` : '—'}
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

/**
 * Share-of-preference bars: one per brand, sorted desc, focal highlighted
 * lime. Each bar shows its % and the count/base behind it (n-honest).
 */
function PreferenceBars({ brands, base }: { brands: Brand[]; base: number }) {
  const ROW_H = 38;
  const BAR_H = 15;
  const LABEL_W = 150;
  const TRACK_X = LABEL_W + 8;
  const VB_W = 760;
  const TRACK_W = VB_W - TRACK_X - 92;
  const PAD = 8;
  const ranked = [...brands].sort((a, b) => (b.preference_pct?.pct ?? -1) - (a.preference_pct?.pct ?? -1));
  const height = PAD + ranked.length * ROW_H + 4;
  const smallBase = base > 0 && base < SMALL_N;

  return (
    <svg viewBox={`0 0 ${VB_W} ${height}`} className="w-full h-auto mt-3" role="img" aria-label="Share of preference by brand">
      {ranked.map((b, i) => {
        const y = PAD + i * ROW_H;
        const pref = b.preference_pct;
        const isFocal = b.is_focal;
        const w = pref ? Math.max(2, (pref.pct / 100) * TRACK_W) : 0;
        return (
          <g key={b.brand_id}>
            <text x={0} y={y + BAR_H - 1} className="fill-t1 font-display" style={{ fontSize: '12px', fontWeight: isFocal ? 800 : 600 }}>
              {(b.label).slice(0, 22)}
            </text>
            <text x={0} y={y + BAR_H + 12} className="fill-t3 font-body" style={{ fontSize: '9px' }}>
              {pref ? `${pref.count}/${pref.base} prefer${smallBase ? ' · directional' : ''}` : 'no data'}
            </text>
            <rect x={TRACK_X} y={y} width={TRACK_W} height={BAR_H} rx={3} className="fill-t3/15" />
            <rect x={TRACK_X} y={y} width={w} height={BAR_H} rx={3} className={isFocal ? 'fill-lime' : 'fill-t3/45'} />
            <text x={TRACK_X + TRACK_W + 8} y={y + BAR_H - 1} className={`font-display tabular-nums ${isFocal ? 'fill-lime' : 'fill-t1'}`} style={{ fontSize: '13px', fontWeight: 800 }}>
              {pref ? `${Math.round(pref.pct)}%` : '—'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default CompetitorCenterpiece;
