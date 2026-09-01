/**
 * results-v2 - the methodology centerpiece, as DATA.
 *
 * The results page is polymorphic across 14 methodologies. Rather than 14
 * layouts, the mock gives one shape - a three-cell headline strip over a list
 * of signal rows with a bar - and every methodology maps onto it. This module
 * does the mapping and returns plain data; the page owns the pixels.
 *
 * WHY THIS FILE EXISTS AT ALL
 * ---------------------------
 * The brief: "where you must display a number, read it from the same analysis
 * object the sections below use, so the two cannot disagree." On the live page
 * the hero tiles come from `report.key_findings` (model-authored prose) while
 * the section under them comes from `report.centerpiece.data` (the
 * deterministic analysis) - two sources, free to contradict each other, and on
 * the audited pricing mission they do.
 *
 * Here `view()` reads `report.centerpiece.data` ONCE and returns both the
 * headline cells and the rows beneath them. The rail's key metrics are the
 * same `cells` array. One read, three renderings, no way to drift.
 *
 * `key_findings` is used only as a last-resort fallback for methodologies with
 * no deterministic centerpiece, and even then every value goes through the
 * scalar guard.
 */
import type { CanonicalReport } from '../results/report/useCanonicalReport';
import type { LensRow } from './hooks';
import { toScalarSlot } from './valueSlot';
import type { ScalarSlot } from './valueSlot';

export type Tone = 'lime' | 'amber' | 'rose' | 'plain';

export interface Cell {
  label: string;
  value: ScalarSlot;
  tone?: Tone;
}

export interface SignalRow {
  key: string;
  /** Short row label, e.g. a market code or a brand name. */
  label: string;
  /** Optional GO / CAUTION pill. */
  signal?: string;
  tone: Exclude<Tone, 'plain'>;
  /** Bar width, 0-100. */
  pct: number;
  /** Right-hand figure, already formatted. */
  value: string;
  lens: LensRow[];
  /** The `.submeta` strip under the bar. */
  sub: Array<{ k: string; v: string }>;
}

export interface CenterpieceView {
  eyebrow: string;
  title: string;
  chip?: string;
  cells: Cell[];
  rows: SignalRow[];
  /** Row-list caption when the rows are not markets. */
  rowsMeta?: string;
}

/* ── helpers ─────────────────────────────────────────────────────────── */

type Any = Record<string, unknown>;
const g = (o: unknown, ...path: string[]): unknown => {
  let cur: unknown = o;
  for (const k of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Any)[k];
  }
  return cur;
};
const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const r0 = (v: unknown) => {
  const n = num(v);
  return n == null ? null : Math.round(n);
};
const r1 = (v: unknown) => {
  const n = num(v);
  return n == null ? null : Math.round(n * 10) / 10;
};
const clamp = (n: number | null) => Math.max(0, Math.min(100, n ?? 0));
const arr = (v: unknown): Any[] => (Array.isArray(v) ? (v as Any[]) : []);
const cell = (label: string, raw: unknown, tone: Tone = 'plain'): Cell => ({
  label,
  value: toScalarSlot(raw),
  tone,
});

const SIGNAL_TONE: Record<string, Exclude<Tone, 'plain'>> = {
  go: 'lime',
  caution: 'amber',
  no_go: 'rose',
  nogo: 'rose',
};

/* ── market_entry ────────────────────────────────────────────────────── */

function marketEntry(a: Any): CenterpieceView {
  const markets = arr(a.markets);
  return {
    eyebrow: 'Market demand',
    title: 'Where the numbers point',
    chip: 'GO · CAUTION · NO-GO',
    cells: [
      cell('Recommended market', a.recommended_market, 'lime'),
      cell('Best demand index', a.best_demand_index != null ? `${a.best_demand_index}/100` : null),
      // top_barrier is a full sentence in production. The guard demotes it to
      // the prose slot instead of setting it at 46px. This is the mock's
      // `.barrier` cell, and it is why that cell exists.
      cell('Top barrier', a.top_barrier),
    ],
    rows: markets.map((m, i) => {
      const signal = String(m.signal ?? '').toLowerCase();
      const di = r0(m.demand_index);
      const intent = r1(m.purchase_intent_pct);
      const barrier = arr(m.barriers)[0];
      return {
        key: `${m.market ?? i}`,
        label: String(m.market ?? '—'),
        signal: signal ? signal.replace('_', '-').toUpperCase() : undefined,
        tone: SIGNAL_TONE[signal] ?? 'lime',
        pct: clamp(di),
        value: di != null ? `${di}/100` : '—',
        lens: [
          { k: 'Demand index', v: di != null ? `${di} / 100` : '—', tone: SIGNAL_TONE[signal] === 'amber' ? 'amber' : 'lime' },
          { k: 'Purchase intent', v: intent != null ? `${intent}%` : '—' },
          { k: 'Appeal', v: m.appeal_mean != null ? `${r1(m.appeal_mean)} / 7` : '—' },
          { k: 'Willingness to pay', v: m.wtp != null ? String(m.wtp) : '—' },
        ],
        sub: [
          intent != null ? { k: 'Intent', v: `${intent}%` } : null,
          m.appeal_mean != null ? { k: 'Appeal', v: `${r1(m.appeal_mean)}/7` } : null,
          m.wtp != null ? { k: 'WTP', v: String(m.wtp) } : null,
          barrier ? { k: 'Barrier', v: `${barrier.label} (${r1(barrier.pct)}%)` } : null,
        ].filter(Boolean) as Array<{ k: string; v: string }>,
      };
    }),
  };
}

/* ── pricing ─────────────────────────────────────────────────────────── */

function pricing(a: Any): CenterpieceView {
  const cur = typeof a.currency === 'string' && a.currency !== 'USD' ? `${a.currency} ` : '$';
  const pts = (g(a, 'van_westendorp', 'points') ?? {}) as Any;
  const opp = pts.opp ?? g(a, 'gabor_granger', 'optimal_price');
  const range = (a.acceptable_range ?? {}) as Any;
  const ladder = arr(g(a, 'gabor_granger', 'ladder'));
  const money = (v: unknown) => (r0(v) == null ? null : `${cur}${r0(v)}`);

  return {
    eyebrow: 'Price sensitivity',
    title: 'What the market will pay',
    chip: 'Van Westendorp',
    cells: [
      cell('Optimal price (OPP)', money(opp), 'lime'),
      cell(
        'Acceptable range',
        range.low != null && range.high != null ? `${cur}${r0(range.low)}-${r0(range.high)}` : null,
      ),
      cell('WTP ceiling (mean)', money(g(a, 'wtp_ceiling', 'mean'))),
    ],
    rowsMeta: ladder.length ? 'Gabor-Granger demand ladder · share who would still buy' : undefined,
    rows: ladder.map((p, i) => {
      const demand = r0(p.demand_pct);
      return {
        key: `p${i}`,
        label: `${cur}${r0(p.price)}`,
        tone: (demand ?? 0) >= 50 ? 'lime' : (demand ?? 0) > 0 ? 'amber' : 'rose',
        pct: clamp(demand),
        value: `${demand ?? 0}%`,
        lens: [
          { k: 'Price point', v: `${cur}${r0(p.price)}`, tone: 'lime' },
          { k: 'Would still buy', v: `${demand ?? 0}%` },
          { k: 'Revenue index', v: String(r1(p.revenue_index) ?? '—') },
        ],
        sub: [
          { k: 'Demand', v: `${demand ?? 0}%` },
          { k: 'Revenue index', v: String(r1(p.revenue_index) ?? '—') },
          { k: 'Base', v: `n = ${p.n ?? '—'}` },
        ],
      };
    }),
  };
}

/* ── satisfaction ────────────────────────────────────────────────────── */

function satisfaction(a: Any): CenterpieceView {
  const seg = (g(a, 'nps', 'segments') ?? {}) as Any;
  const band = (k: string, tone: Exclude<Tone, 'plain'>, label: string): SignalRow | null => {
    const s = seg[k] as Any | undefined;
    if (!s) return null;
    const p = r0(s.pct) ?? 0;
    return {
      key: k,
      label,
      tone,
      pct: clamp(p),
      value: `${p}%`,
      lens: [
        { k: 'Share', v: `${p}%`, tone: tone === 'amber' ? 'amber' : 'lime' },
        { k: 'Respondents', v: String(s.n ?? '—') },
      ],
      sub: [{ k: 'Respondents', v: String(s.n ?? '—') }],
    };
  };
  return {
    eyebrow: 'Satisfaction & loyalty',
    title: 'How the relationship is holding',
    chip: 'NPS · CSAT · CES',
    cells: [
      cell('Net Promoter Score', g(a, 'nps', 'score'), 'lime'),
      cell('CSAT (top-2-box)', r0(g(a, 'csat', 'top2_pct')) != null ? `${r0(g(a, 'csat', 'top2_pct'))}%` : null),
      cell('CES (top-2-box)', r0(g(a, 'ces', 'top2_pct')) != null ? `${r0(g(a, 'ces', 'top2_pct'))}%` : null),
    ],
    rowsMeta: 'NPS breakdown',
    rows: [
      band('promoters', 'lime', 'Promoters'),
      band('passives', 'amber', 'Passives'),
      band('detractors', 'rose', 'Detractors'),
    ].filter(Boolean) as SignalRow[],
  };
}

/* ── churn ───────────────────────────────────────────────────────────── */

function churn(a: Any): CenterpieceView {
  const drivers = arr(g(a, 'drivers', 'ranked'));
  const top = drivers[0];
  const name = (d: Any) => String(d.reason ?? d.option ?? d.label ?? '—');
  return {
    eyebrow: 'Why customers leave',
    title: 'What is driving churn',
    chip: 'Churn drivers',
    cells: [
      cell('Top churn driver', top ? name(top) : null, 'lime'),
      cell('Cite the top driver', top ? `${r0(top.pct_of_respondents) ?? 0}%` : null),
      cell(
        'Winnable (would return)',
        r0(g(a, 'winback', 'winnable_pct')) != null ? `${r0(g(a, 'winback', 'winnable_pct'))}%` : null,
      ),
    ],
    rowsMeta: 'Ranked churn drivers · share of leavers citing each',
    rows: drivers.slice(0, 8).map((d, i) => {
      const p = r0(d.pct_of_respondents) ?? 0;
      return {
        key: `d${i}`,
        label: name(d),
        tone: 'rose' as const,
        pct: clamp(p),
        value: `${p}%`,
        lens: [{ k: 'Cited by', v: `${p}%` }],
        sub: [{ k: 'Cited by', v: `${p}%` }],
      };
    }),
  };
}

/* ── audience_profiling ──────────────────────────────────────────────── */

function audience(a: Any): CenterpieceView {
  const segs = arr(a.segments);
  const primary = segs.find((s) => s.is_primary) ?? segs[0];
  const keyDim =
    (arr(a.dimensions).find((d) => d.key === a.key_dimension)?.label as string | undefined) ??
    (a.key_dimension as string | undefined);

  if (a.posture !== 'segmented' || !segs.length) {
    const attitudes = (g(a, 'aggregate', 'attitudes') ?? {}) as Any;
    return {
      eyebrow: 'Audience profile',
      title: 'Who this audience is',
      chip: 'Aggregate',
      cells: [cell('Respondents profiled', a.n, 'lime')],
      rowsMeta: 'Attitudinal means, 1 to 7',
      rows: arr(a.dimensions)
        .map((d, i) => {
          const att = attitudes[String(d.key)] as Any | undefined;
          const mean = r1(att?.mean);
          if (mean == null) return null;
          return {
            key: `dim${i}`,
            label: String(d.label ?? d.key),
            tone: 'lime' as const,
            pct: clamp((mean / 7) * 100),
            value: `${mean}/7`,
            lens: [{ k: 'Mean', v: `${mean} / 7`, tone: 'lime' as const }],
            sub: [{ k: 'Base', v: `n = ${att?.n ?? a.n ?? '—'}` }],
          };
        })
        .filter(Boolean) as SignalRow[],
    };
  }

  return {
    eyebrow: 'Audience segments',
    title: 'How the audience splits',
    chip: `${a.segment_count ?? segs.length} segments`,
    cells: [
      cell('Segments identified', a.segment_count ?? segs.length, 'lime'),
      cell('Primary segment share', primary ? `${r1(primary.size_pct)}%` : null),
      // A segment name is prose ("Status-seekers, early adopters"); the guard
      // keeps it out of the numeral slot.
      cell('Key differentiator', keyDim),
    ],
    rowsMeta: 'Segment sizes · hover for the attitudinal signature',
    rows: segs.map((s, i) => {
      const p = r1(s.size_pct) ?? 0;
      const sig = arr(s.signature);
      return {
        key: String(s.id ?? i),
        label: String(s.name ?? `Segment ${i + 1}`),
        signal: s.is_primary ? 'PRIMARY' : undefined,
        tone: (s.is_primary ? 'lime' : 'amber') as Exclude<Tone, 'plain'>,
        pct: clamp(p),
        value: `${p}%`,
        lens: [
          { k: 'Share', v: `${p}%`, tone: s.is_primary ? ('lime' as const) : ('amber' as const) },
          { k: 'Respondents', v: String(s.n ?? '—') },
          ...sig.map((sg) => ({ k: String(sg.label), v: `${r1(sg.mean)} / 7` })),
        ],
        sub: [
          { k: 'Base', v: `n = ${s.n ?? '—'}` },
          ...sig.slice(0, 3).map((sg) => ({ k: String(sg.label), v: `${r1(sg.mean)}/7` })),
        ],
      };
    }),
  };
}

/* ── validate ────────────────────────────────────────────────────────── */

function validate(a: Any): CenterpieceView {
  const s = (a.scores ?? {}) as Any;
  const row = (key: string, label: string, scale: number, tone: Exclude<Tone, 'plain'>): SignalRow | null => {
    const mean = r1(g(s, key, 'mean'));
    if (mean == null) return null;
    return {
      key,
      label,
      tone,
      pct: clamp((mean / scale) * 100),
      value: `${mean}/${scale}`,
      lens: [{ k: 'Mean', v: `${mean} / ${scale}`, tone: 'lime' }],
      sub: [{ k: 'Scale', v: `1 to ${scale}` }],
    };
  };
  return {
    eyebrow: 'Concept validation',
    title: 'Whether the idea lands',
    chip: 'Purchase intent',
    cells: [
      cell(
        'Purchase intent (top-2-box)',
        r0(g(a, 'intent', 'top2_pct')) != null ? `${r0(g(a, 'intent', 'top2_pct'))}%` : null,
        'lime',
      ),
      cell('Concept reaction', r1(g(s, 'reaction', 'mean')) != null ? `${r1(g(s, 'reaction', 'mean'))}/10` : null),
      cell('Relevance', r1(g(s, 'relevance', 'mean')) != null ? `${r1(g(s, 'relevance', 'mean'))}/7` : null),
    ],
    rowsMeta: 'Concept scores',
    rows: [
      row('reaction', 'Concept reaction', 10, 'lime'),
      row('relevance', 'Relevance', 7, 'amber'),
      row('uniqueness', 'Uniqueness', 7, 'amber'),
    ].filter(Boolean) as SignalRow[],
  };
}

/* ── compare ─────────────────────────────────────────────────────────── */

function compare(a: Any): CenterpieceView {
  const winnerId = g(a, 'overall_winner', 'concept_id');
  const concepts = arr(a.concepts)
    .filter((c) => c.final_choice_pct)
    .sort((x, y) => (num(g(y, 'final_choice_pct', 'pct')) ?? 0) - (num(g(x, 'final_choice_pct', 'pct')) ?? 0));
  const winner = concepts.find((c) => c.concept_id === winnerId) ?? concepts[0];
  return {
    eyebrow: 'Head to head',
    title: 'Which concept wins',
    chip: 'Forced choice',
    cells: [
      cell('Winning concept', winner ? (winner.label ?? winner.concept_id) : null, 'lime'),
      cell(
        'Forced-choice share',
        winner ? `${r0(g(winner, 'final_choice_pct', 'pct')) ?? 0}%` : null,
      ),
      cell('Appeal (mean)', r1(g(winner ?? {}, 'dimensions', 'appeal', 'mean'))),
    ],
    rowsMeta: 'Forced-choice share',
    rows: concepts.map((c, i) => {
      const p = r0(g(c, 'final_choice_pct', 'pct')) ?? 0;
      return {
        key: String(c.concept_id ?? i),
        label: String(c.label ?? c.concept_id ?? `Concept ${i + 1}`),
        signal: c.concept_id === winnerId ? 'WINNER' : undefined,
        tone: (c.concept_id === winnerId ? 'lime' : 'amber') as Exclude<Tone, 'plain'>,
        pct: clamp(p),
        value: `${p}%`,
        lens: [{ k: 'Chosen by', v: `${p}%`, tone: 'lime' }],
        sub: [{ k: 'Chosen by', v: `${p}%` }],
      };
    }),
  };
}

/* ── naming ──────────────────────────────────────────────────────────── */

function naming(a: Any): CenterpieceView {
  const cands = arr(a.candidates);
  const useWin = cands.some((c) => g(c, 'pairwise_win_rate', 'pct') != null);
  const maxC = Math.max(1, ...cands.map((c) => num(c.composite) ?? 0));
  const winnerId = g(a, 'winner', 'candidate_id');
  const sorted = [...cands].sort(
    (x, y) =>
      (num(g(y, 'pairwise_win_rate', 'pct')) ?? num(y.composite) ?? 0) -
      (num(g(x, 'pairwise_win_rate', 'pct')) ?? num(x.composite) ?? 0),
  );
  const winner = sorted.find((c) => c.candidate_id === winnerId) ?? sorted[0];
  return {
    eyebrow: 'Name & message',
    title: 'Which name carries',
    chip: useWin ? 'Pairwise win rate' : 'Composite appeal',
    cells: [
      cell('Winning name', winner ? (winner.label ?? winner.candidate_id) : null, 'lime'),
      cell(
        useWin ? 'Win rate' : 'Composite appeal',
        useWin
          ? `${r0(g(winner ?? {}, 'pairwise_win_rate', 'pct')) ?? 0}%`
          : r1(winner?.composite),
      ),
      cell('Names tested', cands.length || null),
    ],
    rowsMeta: useWin ? 'Pairwise win rate' : 'Composite appeal',
    rows: sorted.map((c, i) => {
      const w = r0(g(c, 'pairwise_win_rate', 'pct'));
      const p = useWin && w != null ? w : Math.round(((num(c.composite) ?? 0) / maxC) * 100);
      return {
        key: String(c.candidate_id ?? i),
        label: String(c.label ?? c.candidate_id ?? `Name ${i + 1}`),
        signal: c.candidate_id === winnerId ? 'WINNER' : undefined,
        tone: (c.candidate_id === winnerId ? 'lime' : 'amber') as Exclude<Tone, 'plain'>,
        pct: clamp(p),
        value: useWin && w != null ? `${w}%` : String(r1(c.composite) ?? '—'),
        lens: [
          useWin && w != null
            ? { k: 'Win rate', v: `${w}%`, tone: 'lime' as const }
            : { k: 'Composite', v: String(r1(c.composite) ?? '—'), tone: 'lime' as const },
        ],
        sub: [{ k: 'Composite', v: String(r1(c.composite) ?? '—') }],
      };
    }),
  };
}

/* ── competitor ──────────────────────────────────────────────────────── */

function competitor(a: Any): CenterpieceView {
  const brands = arr(a.brands).filter((b) => b.use_pct);
  const focal = brands.find((b) => b.is_focal);
  const sorted = [...brands].sort(
    (x, y) => (num(g(y, 'use_pct', 'pct')) ?? 0) - (num(g(x, 'use_pct', 'pct')) ?? 0),
  );
  return {
    eyebrow: 'Competitive position',
    title: 'Where you stand',
    chip: 'Share of preference',
    cells: [
      cell('Focal brand', a.focal_brand, 'lime'),
      cell(
        'Your share of preference',
        focal ? `${r0(g(focal, 'use_pct', 'pct')) ?? 0}%` : null,
      ),
      cell('Your NPS', g(focal ?? {}, 'nps', 'score')),
    ],
    rowsMeta: 'Share of preference',
    rows: sorted.map((b, i) => {
      const p = r0(g(b, 'use_pct', 'pct')) ?? 0;
      return {
        key: `${b.label ?? i}`,
        label: String(b.label ?? '—'),
        signal: b.is_focal ? 'YOU' : undefined,
        tone: (b.is_focal ? 'lime' : 'amber') as Exclude<Tone, 'plain'>,
        pct: clamp(p),
        value: `${p}%`,
        lens: [{ k: 'Share of preference', v: `${p}%`, tone: 'lime' }],
        sub: [{ k: 'Share', v: `${p}%` }],
      };
    }),
  };
}

/* ── marketing ───────────────────────────────────────────────────────── */

function marketing(a: Any): CenterpieceView {
  const f = (a.funnel ?? {}) as Any;
  const aided = g(f, 'recall_aided', 'correct_rate') ?? g(f, 'recall_aided', 'positive_rate');
  const row = (key: string, label: string, tone: Exclude<Tone, 'plain'>): SignalRow | null => {
    const mean = r1(g(f, key, 'mean'));
    if (mean == null) return null;
    return {
      key,
      label,
      tone,
      pct: clamp((mean / 7) * 100),
      value: `${mean}/7`,
      lens: [{ k: 'Mean', v: `${mean} / 7`, tone: 'lime' }],
      sub: [{ k: 'Scale', v: '1 to 7' }],
    };
  };
  return {
    eyebrow: 'Ad effectiveness',
    title: 'Whether the creative works',
    chip: 'Appeal · persuasion',
    cells: [
      cell('Likeability (mean)', r1(g(f, 'likeability', 'mean')) != null ? `${r1(g(f, 'likeability', 'mean'))}/7` : null, 'lime'),
      cell('Persuasion (mean)', r1(g(f, 'persuasion', 'mean')) != null ? `${r1(g(f, 'persuasion', 'mean'))}/7` : null),
      cell('Aided recall', num(aided) != null ? `${Math.round(num(aided)! * 100)}%` : null),
    ],
    rowsMeta: 'Creative diagnostics',
    rows: [
      row('likeability', 'Likeability', 'lime'),
      row('persuasion', 'Persuasion', 'amber'),
      row('stopping_power', 'Stopping power', 'amber'),
    ].filter(Boolean) as SignalRow[],
  };
}

/* ── roadmap ─────────────────────────────────────────────────────────── */

function roadmap(a: Any): CenterpieceView {
  const feats = arr(g(a, 'maxdiff', 'features')).filter((f) => f.utility != null);
  const maxU = Math.max(1, ...feats.map((f) => Math.abs(num(f.utility) ?? 0)));
  const mustHaves = arr(g(a, 'kano', 'features')).filter((f) => f.classification === 'must_be').length;
  return {
    eyebrow: 'Feature priority',
    title: 'What to build next',
    chip: 'MaxDiff · Kano',
    cells: [
      cell('Top-priority feature', feats[0] ? (feats[0].label ?? feats[0].feature_id) : null, 'lime'),
      cell('Features ranked', feats.length || null),
      cell('Kano must-haves', mustHaves),
    ],
    rowsMeta: 'MaxDiff utility',
    rows: feats.slice(0, 8).map((f, i) => {
      const u = num(f.utility) ?? 0;
      return {
        key: String(f.feature_id ?? i),
        label: String(f.label ?? f.feature_id ?? `Feature ${i + 1}`),
        tone: (u >= 0 ? 'lime' : 'rose') as Exclude<Tone, 'plain'>,
        pct: clamp((Math.abs(u) / maxU) * 100),
        value: String(Math.round(u * 100) / 100),
        lens: [{ k: 'Utility', v: String(Math.round(u * 100) / 100), tone: 'lime' }],
        sub: [{ k: 'Utility', v: String(Math.round(u * 100) / 100) }],
      };
    }),
  };
}

/* ── brand_lift ──────────────────────────────────────────────────────── */

function brandLift(a: Any): CenterpieceView {
  const stages = arr(a.funnel).filter((f) => f.lift_abs != null);
  return {
    eyebrow: 'Campaign lift',
    title: 'What the campaign moved',
    chip: 'Exposed vs control',
    cells: [
      cell('KPIs lifted', g(a, 'summary', 'stages_lifted'), 'lime'),
      cell('Significant at 95%', g(a, 'summary', 'stages_sig95')),
      cell(
        'Exposed / control n',
        g(a, 'cells', 'exposed', 'n') != null
          ? `${g(a, 'cells', 'exposed', 'n')}/${g(a, 'cells', 'control', 'n') ?? '?'}`
          : null,
      ),
    ],
    rowsMeta: 'Absolute lift per funnel stage',
    rows: stages.map((f, i) => {
      const isProp = f.type === 'proportion';
      const raw = num(f.lift_abs) ?? 0;
      const lift = isProp ? Math.round(raw * 100) : Math.round(raw * 10) / 10;
      const rel = r0(f.lift_rel_pct);
      const sig = g(f, 'significance', 'sig95') ? '95%' : g(f, 'significance', 'sig90') ? '90%' : 'directional';
      return {
        key: String(f.funnel_stage ?? i),
        label: String(f.text ?? f.funnel_stage ?? `Stage ${i + 1}`),
        signal: sig === 'directional' ? undefined : sig,
        tone: (lift >= 0 ? 'lime' : 'rose') as Exclude<Tone, 'plain'>,
        pct: clamp(Math.abs(lift) * (isProp ? 2 : 12)),
        value: `${lift >= 0 ? '+' : ''}${lift}${isProp ? ' pp' : ''}`,
        lens: [
          { k: 'Absolute lift', v: `${lift >= 0 ? '+' : ''}${lift}${isProp ? ' pp' : ''}`, tone: 'lime' },
          { k: 'Relative lift', v: rel != null ? `${rel >= 0 ? '+' : ''}${rel}%` : '—' },
          { k: 'Significance', v: sig },
        ],
        sub: [
          { k: 'Relative', v: rel != null ? `${rel >= 0 ? '+' : ''}${rel}%` : '—' },
          { k: 'Significance', v: sig },
        ],
      };
    }),
  };
}

/* ── the generic fallback ────────────────────────────────────────────── */

/**
 * Methodologies with no deterministic centerpiece (research, general_research)
 * fall back to `key_findings`. Every value still goes through the guard, so a
 * prose "finding" lands in the note slot rather than at 46px.
 */
function generic(findings: Array<Record<string, unknown>>): CenterpieceView {
  return {
    eyebrow: 'Headline read',
    title: 'What the study found',
    cells: findings.slice(0, 3).map((k, i) =>
      cell(String(k.label ?? `Finding ${i + 1}`), k.value, i === 0 ? 'lime' : 'plain'),
    ),
    rows: [],
  };
}

/* ── entry point ─────────────────────────────────────────────────────── */

const ADAPTERS: Record<string, (a: Any) => CenterpieceView> = {
  market_entry: marketEntry,
  pricing,
  satisfaction,
  churn,
  churn_research: churn,
  audience_profiling: audience,
  validate,
  compare,
  naming,
  naming_messaging: naming,
  competitor,
  marketing,
  roadmap,
  brand_lift: brandLift,
};

export interface Centerpiece {
  view: CenterpieceView | null;
  /** Set when the sample cannot support a point estimate. */
  withheld: { n: number; threshold: number; note: string | null } | null;
  /** Set when the read is directional but still shown. */
  directionalNote: string | null;
}

export function buildCenterpiece(report: CanonicalReport): Centerpiece {
  const gate = report.centerpiece?.gate;
  const directionalNote =
    gate && gate.posture === 'directional' && gate.note ? gate.note : null;

  // The live page withholds the point estimate below the statistical
  // threshold rather than greying it. Keep that contract exactly.
  if (gate?.suppress_headline) {
    return {
      view: null,
      withheld: { n: gate.n, threshold: gate.threshold, note: gate.note },
      directionalNote,
    };
  }

  const method = report.centerpiece?.methodology || report.header.methodology || '';
  const data = report.centerpiece?.data;
  const adapter = ADAPTERS[method];

  if (adapter && data && typeof data === 'object') {
    return { view: adapter(data as Any), withheld: null, directionalNote };
  }

  const findings = report.key_findings || [];
  if (!findings.length) return { view: null, withheld: null, directionalNote };
  return { view: generic(findings), withheld: null, directionalNote };
}

/**
 * The rail reads the very same cells the headline strip does, so the two can
 * never disagree. It shows only the cells that resolved to a real scalar: a
 * rail stat is a numeral row, and prose that was demoted by the guard belongs
 * in the strip above, where it has the width to be read.
 */
export function railMetrics(view: CenterpieceView | null): Cell[] {
  if (!view) return [];
  return view.cells.filter((c) => c.value.scalar !== null).slice(0, 3);
}
