/**
 * results-v2 charts - one component per renderer in the canonical report.
 *
 * The results page is polymorphic across 14 methodologies, but every one of
 * them describes its questions with the same four shapes, so these four
 * cover all of them:
 *
 *   scale_* / rating        -> <Histogram>     (mock .hist)
 *   single choice           -> <DonutLegend>   (mock .donut-wrap)
 *   multi_select / battery  -> <HBars>         (mock .hbars)
 *   open_text_verbatims     -> <Themes>        (mock .themes)
 *   screener                -> <ScreenerBase>  (mock .md-hero, one cell)
 *
 * Every one animates in from zero on first scroll into view, exactly as the
 * mock does, but NO NUMBER animates: the mock count-ups only the rail stats,
 * and doing that to a value string is what produces "9 / 9-235 / 9" on the
 * live page. Bars grow; figures are printed once and stay put.
 */
import { useState } from 'react';
import { useDrawIn, lensHandlers } from './hooks';

const DONUT_PALETTE = ['#BEF264', '#6366F1', '#F2748C', '#F2B24A', '#7C83F3', '#A6E0CF'];

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

/* ══════════════════════════════════════════════════════════════════════
   Histogram - .hist
════════════════════════════════════════════════════════════════════════ */

export function Histogram({
  buckets,
  total,
}: {
  buckets: Array<{ label: string; count: number }>;
  total: number;
}) {
  const drawn = useDrawIn();
  if (!buckets.length) return <Empty>No ratings recorded.</Empty>;
  const peak = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <>
      <div
        className="mt-[6px] grid h-[300px] items-end gap-[10px] max-[680px]:h-[220px] max-[680px]:gap-[5px]"
        style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0,1fr))` }}
      >
        {buckets.map((b) => {
          const h = drawn ? `${(b.count / peak) * 100}%` : '0%';
          const isPeak = b.count === peak && peak > 0;
          return (
            <div
              key={b.label}
              className="group flex h-full cursor-pointer flex-col items-center justify-end"
              {...lensHandlers(() => ({
                title: `Rated it ${b.label}`,
                rows: [
                  { k: 'Respondents', v: String(b.count), tone: 'lime' as const },
                  { k: 'Share', v: `${pct(b.count, total)}%` },
                ],
              }))}
            >
              <div
                className={[
                  'rv2-grow-h w-full max-w-[54px] rounded-t-[8px] rounded-b-[3px]',
                  'transition-[filter] group-hover:brightness-[1.15] group-hover:saturate-[1.1]',
                  isPeak
                    ? 'bg-[linear-gradient(180deg,#D2FF7A,#BEF264)]'
                    : 'bg-[linear-gradient(180deg,#BEF264,rgba(190,242,100,0.35))]',
                ].join(' ')}
                style={{ height: h }}
              />
              <span className="mt-[10px] font-['Manrope',system-ui,sans-serif] text-[12px] font-semibold text-[#5C6470] group-hover:text-[#F3F5EF]">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-3 border-t border-white/[0.07] pt-3 text-[12px] text-[#5C6470]">
        <span>Lower</span>
        <span className="max-[680px]:hidden">Each column is one point on the scale</span>
        <span>Higher</span>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Donut + legend - .donut-wrap
════════════════════════════════════════════════════════════════════════ */

export function DonutLegend({ entries }: { entries: Array<[string, number]> }) {
  const drawn = useDrawIn();
  const [active, setActive] = useState<number | null>(null);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!entries.length || total === 0) return <Empty>No responses recorded.</Empty>;

  const R = 45;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = entries.map(([label, count], i) => {
    const len = (count / total) * C;
    const arc = { label, count, i, len, offset, colour: DONUT_PALETTE[i % DONUT_PALETTE.length] };
    offset += len;
    return arc;
  });

  const shown = active != null ? arcs[active] : arcs[0];

  return (
    <div
      className="mt-[6px] grid items-center gap-[34px] max-[1080px]:grid-cols-1 max-[1080px]:justify-items-center min-[1081px]:grid-cols-[300px_1fr]"
    >
      {/* 300px in the mock. Below ~380px the card is narrower than that, so the
          ring is capped to the available width and the viewBox does the rest. */}
      <div className="relative aspect-square w-full max-w-[300px]">
        <svg viewBox="0 0 120 120" width="100%" height="100%" className="-rotate-90">
          {arcs.map((a) => (
            <circle
              key={a.label}
              className="rv2-seg cursor-pointer"
              cx={60}
              cy={60}
              r={R}
              stroke={a.colour}
              strokeWidth={active === a.i ? 38 : 30}
              strokeDasharray={drawn ? `${a.len} ${C - a.len}` : `0 ${C}`}
              strokeDashoffset={-a.offset}
              opacity={active == null || active === a.i ? 1 : 0.32}
              onMouseEnter={() => setActive(a.i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="font-['Manrope',system-ui,sans-serif] text-[46px] font-extrabold leading-none tabular-nums">
            {pct(shown.count, total)}%
          </div>
          {/* The hole is 150px wide. Option labels can be a full price band, so
              clamp the echo to three lines: the full string is right there in
              the legend, so nothing is lost by not spilling it over the ring. */}
          <div
            className="mt-1 max-w-[148px] overflow-hidden text-[12px] leading-[1.3] text-[#8B919C]"
            style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
          >
            {shown.label}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-[2px]">
        {arcs.map((a) => (
          <div
            key={a.label}
            role="presentation"
            onMouseEnter={() => setActive(a.i)}
            onMouseLeave={() => setActive(null)}
            className={[
              'grid cursor-pointer grid-cols-[14px_1fr_auto_auto] items-center gap-[14px] rounded-[10px]',
              'border px-3 py-[13px] transition-colors duration-150',
              active === a.i
                ? 'border-white/[0.07] bg-white/[0.045]'
                : 'border-transparent hover:border-white/[0.07] hover:bg-white/[0.045]',
            ].join(' ')}
          >
            <span className="h-3 w-3 rounded-[4px]" style={{ background: a.colour }} />
            <span className="min-w-0 break-words text-[14.5px] leading-[1.35]">{a.label}</span>
            <span className="font-['Manrope',system-ui,sans-serif] text-[15px] font-bold tabular-nums text-[#8B919C]">
              {a.count}
            </span>
            <span
              className="min-w-[48px] text-right font-['Manrope',system-ui,sans-serif] text-[15px] font-bold tabular-nums"
              style={{ color: a.colour }}
            >
              {pct(a.count, total)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Horizontal bars - .hbars
════════════════════════════════════════════════════════════════════════ */

export function HBars({
  rows,
  base,
  unit = '%',
}: {
  rows: Array<{ label: string; count: number; pct: number }>;
  base: number;
  /** Suffix on the right-hand figure. '%' for shares, '' for means. */
  unit?: string;
}) {
  const drawn = useDrawIn();
  if (!rows.length) return <Empty>No selections recorded.</Empty>;

  return (
    <div className="mt-[6px] flex flex-col gap-[3px]">
      {rows.map((r) => (
        <div
          key={r.label}
          className={[
            'group grid cursor-pointer items-center gap-[18px] rounded-[10px] border border-transparent px-[10px] py-[11px]',
            'transition-colors duration-150 hover:border-white/[0.07] hover:bg-white/[0.045]',
            'max-[680px]:grid-cols-1 max-[680px]:gap-[6px]',
            'min-[681px]:grid-cols-[minmax(220px,360px)_1fr_78px]',
          ].join(' ')}
          {...lensHandlers(() => ({
            title: r.label,
            rows: [
              { k: 'Respondents', v: String(r.count), tone: 'lime' as const },
              { k: `Share of ${base}`, v: `${r.pct}${unit}` },
            ],
          }))}
        >
          <div className="text-[14px] leading-[1.35] text-[#D7DBD5]">{r.label}</div>
          <div className="relative h-[14px] overflow-hidden rounded-[7px] bg-[#1B1E2B] max-[680px]:order-3">
            <i
              className="rv2-grow-w absolute inset-y-0 left-0 block rounded-[7px] bg-[linear-gradient(90deg,rgba(190,242,100,0.5),#BEF264)] group-hover:brightness-[1.14]"
              style={{ width: drawn ? `${Math.max(0, Math.min(100, r.pct))}%` : '0%' }}
            />
          </div>
          <div className="text-right font-['Manrope',system-ui,sans-serif] text-[15px] font-bold tabular-nums text-[#8B919C] group-hover:text-[#F3F5EF]">
            {r.count} &middot; {r.pct}
            {unit}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Themes - .themes
════════════════════════════════════════════════════════════════════════ */

type Sentiment = 'positive' | 'neutral' | 'negative';

const SENT_CHIP: Record<Sentiment, string> = {
  neutral: 'text-[#8B919C] bg-white/[0.045] border-white/[0.07]',
  negative: 'text-[#F2748C] bg-[rgba(242,116,140,0.12)] border-[rgba(242,116,140,0.3)]',
  positive: 'text-[#BEF264] bg-[rgba(190,242,100,0.14)] border-[rgba(190,242,100,0.22)]',
};
const SENT_BAR: Record<Sentiment, string> = {
  neutral: 'bg-[linear-gradient(90deg,rgba(139,145,156,0.4),#aeb4bf)]',
  negative: 'bg-[linear-gradient(90deg,rgba(242,116,140,0.4),#F2748C)]',
  positive: 'bg-[linear-gradient(90deg,rgba(190,242,100,0.4),#BEF264)]',
};
const SENT_LENS: Record<Sentiment, 'lime' | 'amber' | 'rose'> = {
  neutral: 'amber',
  negative: 'rose',
  positive: 'lime',
};

export function Themes({
  themes,
  n,
  verbatims,
}: {
  themes: Array<{ label: string; count: number; pct: number; sentiment: string; quotes?: string[] }>;
  n: number;
  verbatims?: string[];
}) {
  const drawn = useDrawIn();

  if (!themes.length) {
    if (!verbatims || !verbatims.length) return <Empty>No open-text responses.</Empty>;
    return (
      <div className="mt-[6px] flex flex-col gap-3">
        {verbatims.slice(0, 6).map((v, i) => (
          <p key={i} className="text-[14px] italic leading-[1.5] text-[#C2C7C0]">
            &ldquo;{v}&rdquo;
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-[6px] flex flex-col gap-[6px]">
      {themes.map((t) => {
        const s: Sentiment =
          t.sentiment === 'positive' || t.sentiment === 'negative' ? t.sentiment : 'neutral';
        return (
          <div
            key={t.label}
            className="cursor-pointer rounded-[12px] border border-transparent px-3 py-[14px] transition-colors duration-150 hover:border-white/[0.07] hover:bg-white/[0.045]"
            {...lensHandlers(() => ({
              title: t.label,
              tone: SENT_LENS[s],
              rows: [
                { k: 'Mentions', v: `${t.count} of ${n}` },
                { k: 'Share', v: `${t.pct}%` },
                { k: 'Sentiment', v: s },
              ],
              quote: t.quotes?.[0],
            }))}
          >
            <div className="mb-[10px] flex items-center gap-[11px]">
              <span className="font-['Manrope',system-ui,sans-serif] text-[15.5px] font-semibold">
                {t.label}
              </span>
              <span
                className={[
                  'rounded-[6px] border px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.1em]',
                  SENT_CHIP[s],
                ].join(' ')}
              >
                {s}
              </span>
              <span className="ml-auto font-['Manrope',system-ui,sans-serif] text-[14px] font-bold tabular-nums text-[#8B919C]">
                {t.count} / {n}
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-[6px] bg-[#1B1E2B]">
              <i
                className={['rv2-grow-w absolute inset-y-0 left-0 block rounded-[6px]', SENT_BAR[s]].join(' ')}
                style={{ width: drawn ? `${Math.max(0, Math.min(100, t.pct))}%` : '0%' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Screener base - the qualified-base statement
════════════════════════════════════════════════════════════════════════ */

export function ScreenerBase({
  qualified,
  conditions,
}: {
  qualified: number;
  conditions: string[];
}) {
  return (
    <div className="mt-[18px] flex flex-wrap items-baseline gap-x-4 gap-y-2 rounded-[16px] border border-white/[0.07] px-[26px] py-6">
      <span className="font-['Manrope',system-ui,sans-serif] text-[46px] font-extrabold leading-none tabular-nums text-[#BEF264]">
        {qualified}
      </span>
      <span className="max-w-[62ch] text-[13px] leading-[1.6] text-[#8B919C]">
        qualified respondents set the base for every figure below.
        {conditions.length > 0 && (
          <>
            {' '}
            Screened on: <span className="text-[#F3F5EF]">{conditions.join(' · ')}</span>.
          </>
        )}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[13px] text-[#5C6470]">{children}</p>;
}
