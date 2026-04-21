import { Zap } from 'lucide-react';

/**
 * VETT brand mark — lime square with black Zap glyph + "VETT" wordmark.
 *
 * Mirrors .logo-icon / .logo-text from .design-reference/prototype.html:
 *   - md (default):   46x46 square, 24px icon, 24px wordmark
 *   - sm:             36x36 square, 20px icon, 18px wordmark
 *   - lg:             56x56 square, 28px icon, 28px wordmark
 *   - responsive:     shrinks to `sm` on mobile (<768px), `md` at md+.
 */
export type LogoSize = 'sm' | 'md' | 'lg';

export interface LogoProps {
  size?: LogoSize;
  /** When true, use `sm` on mobile and `md` on desktop (overrides `size`). */
  responsive?: boolean;
  /** Hide the "VETT" wordmark and show only the icon. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Literal class maps — Tailwind's JIT needs un-interpolated strings to
 * include these in the final stylesheet, so we don't template them.
 */
const BOX_CLASS: Record<LogoSize, string> = {
  sm: 'w-9 h-9',
  md: 'w-[46px] h-[46px]',
  lg: 'w-14 h-14',
};

const ICON_CLASS: Record<LogoSize, string> = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
};

const TEXT_CLASS: Record<LogoSize, string> = {
  sm: 'text-[18px]',
  md: 'text-[24px]',
  lg: 'text-[28px]',
};

export function Logo({
  size = 'md',
  responsive = false,
  iconOnly = false,
  className = '',
}: LogoProps) {
  // For `responsive`, combine sm base classes with md:* overrides. Every
  // permutation we need is listed literally below so Tailwind's JIT sees it.
  const boxClasses = responsive
    ? 'w-9 h-9 md:w-[46px] md:h-[46px]'
    : BOX_CLASS[size];
  const iconClasses = responsive
    ? 'w-5 h-5 md:w-6 md:h-6'
    : ICON_CLASS[size];
  const textClasses = responsive
    ? 'text-[18px] md:text-[24px]'
    : TEXT_CLASS[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${boxClasses} bg-lime rounded-xl flex items-center justify-center shadow-lime-glow shrink-0`}
      >
        <Zap className={`${iconClasses} text-black`} fill="currentColor" strokeWidth={0} />
      </div>
      {!iconOnly && (
        <span
          className={`${textClasses} font-display font-black text-white tracking-tight-2 leading-none`}
        >
          VETT
        </span>
      )}
    </div>
  );
}

export default Logo;
