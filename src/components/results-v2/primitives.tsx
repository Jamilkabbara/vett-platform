/**
 * results-v2 primitives - the repeating shapes in vett-results-redesign.html.
 *
 * Page-scoped on purpose (same reasoning as landing-v2/primitives.tsx): the
 * mock's card/eyebrow/chip geometry disagrees with the shared ui/* primitives
 * and with premium-results.css, and adopting it into either would restyle
 * the live results page. Nothing here mutates a shared component.
 *
 * Mock -> component map
 *   .card                -> <Card>
 *   .eyebrow[.muted]     -> <Eyebrow>
 *   .chip                -> <Chip>
 *   .q-head/.qt/.qmeta   -> <QHead>
 *   .vett-read           -> <VettRead>
 *   .md-hero .cell       -> <StatCell>      (numeral guarded)
 *   .kstat               -> <RailStat>      (numeral guarded)
 *   .hint                -> <Hint>
 *   .nav                 -> <JumpNav>
 *   #lens                -> <Lens>
 */
import type { ReactNode } from 'react';
import { useLensState } from './hooks';
import type { ScalarSlot } from './valueSlot';

/* ══════════════════════════════════════════════════════════════════════
   Card - .card, incl. the 1px top sheen
════════════════════════════════════════════════════════════════════════ */

export function Card({
  children,
  id,
  className = '',
  pad = 'p-[26px]',
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  pad?: string;
}) {
  return (
    <section
      id={id}
      className={[
        'rv2-sheen relative overflow-hidden scroll-mt-[96px]',
        'bg-white/[0.025] border border-white/[0.07] rounded-[22px]',
        pad,
        className,
      ].join(' ')}
    >
      {children}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Eyebrow - .eyebrow / .eyebrow.muted
════════════════════════════════════════════════════════════════════════ */

export function Eyebrow({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]',
        muted ? 'text-[#5C6470]' : 'text-[#BEF264]',
      ].join(' ')}
    >
      <span className="w-[5px] h-[5px] rounded-full bg-current opacity-80" aria-hidden />
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Chip - .chip
════════════════════════════════════════════════════════════════════════ */

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="flex-none self-center whitespace-nowrap rounded-full border border-white/[0.12] px-3 py-[6px] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B919C]">
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   QHead - .q-head + .qt + .qmeta
════════════════════════════════════════════════════════════════════════ */

export function QHead({
  eyebrow,
  title,
  meta,
  chip,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  chip?: ReactNode;
}) {
  return (
    // Under 680px the chip would squeeze the question text into a four-word
    // column, so the head stacks and the chip leads.
    <div className="mb-1 flex items-start justify-between gap-5 max-[680px]:flex-col-reverse max-[680px]:items-start max-[680px]:gap-3">
      <div className="min-w-0">
        <Eyebrow muted>{eyebrow}</Eyebrow>
        <h2 className="mt-3 max-w-[60ch] font-['Manrope',system-ui,sans-serif] text-[21px] font-bold leading-[1.28] tracking-[-0.01em]">
          {title}
        </h2>
        {meta && (
          <div className="mt-[9px] text-[12.5px] tracking-[0.04em] text-[#5C6470]">{meta}</div>
        )}
      </div>
      {chip ? <Chip>{chip}</Chip> : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   VettRead - .vett-read
════════════════════════════════════════════════════════════════════════ */

export function VettRead({ children }: { children: ReactNode }) {
  return (
    <div className="my-[18px] mb-[22px] flex gap-[11px] text-[14.5px] text-[#CBD0CB]">
      <span className="mt-[2px] h-fit flex-none rounded-[6px] bg-[rgba(190,242,100,0.14)] px-2 py-[3px] text-[10.5px] font-bold tracking-[0.14em] text-[#BEF264]">
        VETT READ
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   The guarded numeral.

   `value` is a ScalarSlot, not a string. The 46px element interpolates
   `value.scalar` and nothing else; `value.note` can only reach the 19px
   prose element. See valueSlot.ts for why this is a type and not a
   convention.
════════════════════════════════════════════════════════════════════════ */

const NUMERAL_TONE: Record<NonNullable<StatCellProps['tone']>, string> = {
  lime: 'text-[#BEF264]',
  amber: 'text-[#F2B24A]',
  rose: 'text-[#F2748C]',
  plain: 'text-[#F3F5EF]',
};

export interface StatCellProps {
  label: string;
  value: ScalarSlot;
  tone?: 'lime' | 'amber' | 'rose' | 'plain';
}

/** .md-hero .cell - a numeral over a caption, or prose over a caption. */
export function StatCell({ label, value, tone = 'plain' }: StatCellProps) {
  return (
    <div className="border-b border-white/[0.07] px-[26px] py-6 last:border-b-0 min-[681px]:border-b-0 min-[681px]:border-r min-[681px]:border-white/[0.07] min-[681px]:last:border-r-0">
      {value.scalar !== null ? (
        <div
          className={[
            "font-['Manrope',system-ui,sans-serif] text-[46px] font-extrabold leading-none tabular-nums",
            NUMERAL_TONE[tone],
          ].join(' ')}
        >
          {value.scalar}
        </div>
      ) : value.note !== null ? (
        // Demoted: prose typeset at reading size. It can wrap without
        // wrecking the row, and it is never mistaken for a measurement.
        <div className="font-['Manrope',system-ui,sans-serif] text-[19px] font-bold leading-[1.3] text-[#F3F5EF]">
          {value.note}
        </div>
      ) : (
        <div className="font-['Manrope',system-ui,sans-serif] text-[46px] font-extrabold leading-none text-[#5C6470]">
          &mdash;
        </div>
      )}
      <div className={['text-[13px] text-[#8B919C]', value.scalar !== null ? 'mt-[9px]' : 'mt-3'].join(' ')}>
        {label}
      </div>
    </div>
  );
}

/** .kstat - the sticky rail's key-metric row. Same guard, smaller numeral. */
export function RailStat({ label, value, tone = 'lime' }: StatCellProps) {
  return (
    <div className="flex items-baseline gap-[11px] border-b border-white/[0.07] py-[11px] last:border-b-0 last:pb-0">
      {value.scalar !== null ? (
        <span
          className={[
            "flex-none font-['Manrope',system-ui,sans-serif] text-[30px] font-extrabold leading-none tabular-nums",
            NUMERAL_TONE[tone],
          ].join(' ')}
        >
          {value.scalar}
        </span>
      ) : value.note !== null ? (
        <span className="font-['Manrope',system-ui,sans-serif] text-[15px] font-bold leading-[1.35] text-[#F3F5EF]">
          {value.note}
        </span>
      ) : (
        <span className="flex-none font-['Manrope',system-ui,sans-serif] text-[30px] font-extrabold leading-none text-[#5C6470]">
          &mdash;
        </span>
      )}
      <span className="text-[12.5px] text-[#8B919C]">{label}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Rail furniture - .rail .ttl, .hint, .nav
════════════════════════════════════════════════════════════════════════ */

export function RailTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[14px] text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5C6470]">
      {children}
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-[9px] rounded-[12px] border border-[rgba(190,242,100,0.22)] bg-[rgba(190,242,100,0.14)] px-[13px] py-[11px] text-[12.5px] text-[#8B919C]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-[15px] w-[15px] flex-none text-[#BEF264]"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      {children}
    </div>
  );
}

export function JumpNav({ items }: { items: Array<{ href: string; label: string }> }) {
  return (
    <nav className="flex flex-col">
      {items.map((it) => (
        <a
          key={it.href}
          href={it.href}
          className="group flex items-center gap-[10px] py-2 text-[13.5px] text-[#8B919C] no-underline transition-colors duration-150 hover:text-[#F3F5EF]"
        >
          <span className="h-[6px] w-[6px] rounded-full bg-[#5C6470] transition-all duration-150 group-hover:bg-[#BEF264] group-hover:shadow-[0_0_8px_#BEF264]" />
          {it.label}
        </a>
      ))}
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Lens - #lens. One instance, mounted by the page, fed by the store.
════════════════════════════════════════════════════════════════════════ */

const LENS_BORDER: Record<string, string> = {
  lime: 'border-l-[#BEF264]',
  amber: 'border-l-[#F2B24A]',
  rose: 'border-l-[#F2748C]',
};

export function Lens() {
  const { content, x, y } = useLensState();
  // Kept mounted so the opacity/transform transition has something to run on.
  const shown = content !== null;
  // Flip toward the cursor when the tooltip would leave the viewport. 300px is
  // the mock's max-width; using it (rather than a measured width) keeps this a
  // pure render with no layout read.
  const W = 300;
  const H = 190;
  const vw = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const vh = typeof window === 'undefined' ? 900 : window.innerHeight;
  const left = x + 18 + W + 16 > vw ? Math.max(8, x - W - 18) : x + 18;
  const top = y + 18 + H + 16 > vh ? Math.max(8, y - H - 18) : y + 18;

  return (
    <div
      aria-hidden
      className={[
        'rv2-lens pointer-events-none fixed z-[90] min-w-[180px] max-w-[300px] rounded-[14px]',
        'border border-white/[0.12] border-l-[3px] bg-[rgba(16,18,28,0.94)] px-[15px] py-[13px]',
        'shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-[14px]',
        LENS_BORDER[content?.tone ?? 'lime'],
        shown ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-[6px] scale-[0.98]',
      ].join(' ')}
      style={{ left, top }}
    >
      {content && (
        <>
          <div className="mb-2 font-['Manrope',system-ui,sans-serif] text-[14px] font-bold leading-[1.3]">
            {content.title}
          </div>
          {content.rows.map((r) => (
            <div key={r.k} className="flex items-center justify-between gap-[18px] py-[3px] text-[13px]">
              <span className="text-[#8B919C]">{r.k}</span>
              <span
                className={[
                  "font-['Manrope',system-ui,sans-serif] font-bold tabular-nums",
                  r.tone === 'lime' ? 'text-[#BEF264]' : r.tone === 'amber' ? 'text-[#F2B24A]' : '',
                ].join(' ')}
              >
                {r.v}
              </span>
            </div>
          ))}
          {content.quote && (
            <div className="mt-2 border-t border-white/[0.07] pt-[9px] text-[12.5px] italic leading-[1.45] text-[#C2C7C0]">
              &ldquo;{content.quote}&rdquo;
            </div>
          )}
        </>
      )}
    </div>
  );
}
