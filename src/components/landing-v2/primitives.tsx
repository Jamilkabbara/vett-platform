/**
 * landing-v2 primitives.
 *
 * These mirror the four repeating shapes in vett-landing.html (.btn,
 * .eyebrow, .head, .reveal). They are deliberately PAGE-SCOPED rather than
 * added to src/components/ui/*, because the mock disagrees with the shared
 * primitives in ways that would visually change other pages if applied there:
 *
 *   ui/Button  -> pill radius, purple #6d28d9->#4f46e5 gradient, Inter 800/900
 *   mock .btn  -> 11px radius (13px at .lg), indigo #6366F1->#5457E8 gradient,
 *                 Inter 700 at 14px with 0.02em tracking, plus `lime` and
 *                 `outline` variants the shared Button has no equivalent for.
 *
 * See the PR body's "Divergences" section. Nothing here mutates a shared
 * component.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useInView } from './hooks';

/* ══════════════════════════════════════════════════════════════════════
   Button - ports .btn / .btn.indigo / .ghost / .outline / .lime / .lg
════════════════════════════════════════════════════════════════════════ */

export type V2ButtonVariant = 'indigo' | 'ghost' | 'outline' | 'lime';

export interface V2ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: V2ButtonVariant;
  size?: 'md' | 'lg';
}

const V2_VARIANT: Record<V2ButtonVariant, string> = {
  indigo:
    'bg-[linear-gradient(135deg,#6366F1,#5457E8)] text-white ' +
    'shadow-[0_10px_26px_rgba(99,102,241,0.34)] ' +
    'hover:brightness-110 hover:-translate-y-px',
  ghost:
    'text-[#F3F5EF] bg-white/[0.04] border-white/[0.13] ' +
    'hover:bg-white/[0.07]',
  outline:
    'text-[#F3F5EF] bg-white/[0.025] border-white/[0.13] ' +
    'hover:border-[#BEF264] hover:text-[#BEF264]',
  lime:
    'bg-[#BEF264] text-[#0B0C15] shadow-[0_10px_26px_rgba(190,242,100,0.24)] ' +
    'hover:brightness-105 hover:-translate-y-px',
};

export function V2Button({
  variant = 'indigo',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: V2ButtonProps) {
  return (
    <button
      type={type}
      className={[
        // .btn base: Inter 700 / 14px / 0.02em / 11px radius / 10px 18px
        "font-['Inter',system-ui,sans-serif] font-bold tracking-[0.02em] cursor-pointer",
        'inline-flex items-center justify-center gap-2 border border-transparent',
        'transition-all duration-[180ms]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BEF264]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C15]',
        'disabled:opacity-60 disabled:pointer-events-none',
        size === 'lg'
          ? 'text-[15px] rounded-[13px] px-[26px] py-[15px]'
          : 'text-[14px] rounded-[11px] px-[18px] py-[10px]',
        V2_VARIANT[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Eyebrow - ports .eyebrow and .eyebrow.pill
════════════════════════════════════════════════════════════════════════ */

export function Eyebrow({
  children,
  pill = false,
  className = '',
}: {
  children: ReactNode;
  pill?: boolean;
  className?: string;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-[9px]',
        'text-[11px] font-bold tracking-[0.2em] uppercase',
        pill
          ? 'bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.32)] rounded-full px-4 py-2 text-[#C8C9FB]'
          : 'text-[#BEF264]',
        className,
      ].join(' ')}
    >
      <span className="text-[#BEF264]" aria-hidden>
        &#10022;
      </span>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SectionHead - ports .head / .head.center
════════════════════════════════════════════════════════════════════════ */

export function SectionHead({
  eyebrow,
  title,
  body,
  center = false,
  className = '',
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        'max-w-[680px] mb-12',
        center ? 'mx-auto text-center' : '',
        className,
      ].join(' ')}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="font-['Manrope',system-ui,sans-serif] font-extrabold tracking-[-0.025em] text-[clamp(32px,4.4vw,52px)] leading-[1.04] mt-4">
        {title}
      </h2>
      {body && (
        <p
          className={[
            'text-[#8B919C] text-[16.5px] mt-[18px]',
            center ? 'mx-auto' : '',
          ].join(' ')}
        >
          {body}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Reveal - ports .reveal / .reveal.in + the .d1..d5 delay ladder
════════════════════════════════════════════════════════════════════════ */

const DELAY_CLASS = [
  '',
  'delay-[80ms]',
  'delay-[160ms]',
  'delay-[240ms]',
  'delay-[320ms]',
  'delay-[400ms]',
] as const;

export function Reveal({
  children,
  delay = 0,
  className = '',
  as: As = 'div',
}: {
  children: ReactNode;
  /** 0..5, matching the mock's .d1 - .d5 stagger. */
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
  as?: 'div' | 'section';
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <As
      ref={ref}
      className={[
        'lv2-reveal',
        DELAY_CLASS[delay],
        inView ? 'lv2-in' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </As>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Wrap - ports .wrap (max-width 1200px, 16px gutter under 600px)

   Fidelity note: in the mock, `.wrap{padding:0 28px}` is declared BEFORE
   `.hero`, `.logos`, `section.block` and `.final`, each of which sets a
   `padding: <y> 0` shorthand. Those shorthands win, so every content wrap
   on the page actually renders with ZERO horizontal gutter and a full
   1200px content box; only the footer's bare `.wrap` keeps 28px. The
   `@media (max-width:600px)` rule comes last, so the 16px mobile gutter
   does apply. `flush` (the default) reproduces that exactly at >=1200px.

   Deliberate deviation: between 600px and 1256px the mock's cascade leaves
   NO gutter, so copy runs into the viewport bezel. We keep 28px there.
   (Originally 1200px, which still left a 1200-1255 band at zero gutter -
   measured at 1200: section padding 0, content 1200, gutter 0 each side.)
════════════════════════════════════════════════════════════════════════ */

export function Wrap({
  children,
  className = '',
  as: As = 'div',
  flush = true,
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'footer';
  /** Collapse the gutter at >=1200px, matching the mock's rendered geometry. */
  flush?: boolean;
}) {
  return (
    <As
      className={[
        'max-w-[1200px] mx-auto relative z-[2]',
        'px-4 min-[600px]:px-7',
        // Was min-[1200px]. At exactly 1200 the 1200px box fills the viewport,
        // so dropping the padding took the gutter from 28px straight to ZERO
        // and every section touched both bezels - a maximized window on a
        // 1280 display lands in that band. 1200 + 2x28 = 1256, so from 1256 up
        // the natural centring already provides >=28px and removing the
        // padding is invisible. The mock's flush geometry is preserved
        // everywhere it is actually distinguishable; the dead band is gone.
        flush ? 'min-[1256px]:px-0' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </As>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   DemoCard - ports .ca-demo, the recurring "chart in a glass panel" shell
════════════════════════════════════════════════════════════════════════ */

export function DemoCard({
  label,
  children,
  className = '',
  innerRef,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={innerRef}
      className={[
        'bg-[linear-gradient(180deg,rgba(99,102,241,0.08),rgba(255,255,255,0.012))]',
        'border border-white/[0.13] rounded-[22px] p-6',
        className,
      ].join(' ')}
    >
      <div className="text-[10.5px] tracking-[0.16em] uppercase text-[#5C6470] font-semibold mb-[18px]">
        {label}
      </div>
      {children}
    </div>
  );
}
