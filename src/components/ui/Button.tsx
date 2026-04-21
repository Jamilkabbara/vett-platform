import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Pill-shaped button primitive mirroring prototype.html's .btn-lime /
 * .btn-vi / .btn-si variants.
 *
 *   primary   → lime fill, black text, Inter 800 (.btn-lime)
 *   gradient  → purple 135deg #6d28d9 → #4f46e5, white Inter 900 (.btn-vi)
 *   ghost     → translucent white bg, subtle border, Inter 700 (.btn-si)
 *   danger    → red-tinted fill for destructive actions
 *
 * `rounded` defaults to `pill` (9999px, matches prototype). Set
 * `rounded="lg"` for a 10px radius when pills feel wrong in context.
 *
 * Mobile tap target: `min-h-tap` (44px) is applied below md so the button
 * always meets Apple HIG on phones without forcing extra padding on desktop.
 */
export type ButtonVariant = 'primary' | 'gradient' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonRounded = 'pill' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-lime text-black font-display font-extrabold ' +
    'hover:brightness-105 active:brightness-95 ' +
    'shadow-lime-soft',
  gradient:
    'bg-gradient-vett text-white font-display font-black ' +
    'hover:brightness-110 active:brightness-95 ' +
    'shadow-purple-glow',
  ghost:
    'bg-white/5 text-white/80 border border-white/10 ' +
    'font-display font-bold ' +
    'hover:bg-white/10 hover:text-white active:bg-white/5',
  danger:
    'bg-red/90 text-white font-display font-bold ' +
    'hover:bg-red active:brightness-95',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'text-[12px] px-4 py-2 gap-1.5',
  md: 'text-[13px] px-6 py-2.5 gap-1.5',
  lg: 'text-[15px] px-7 py-3.5 gap-2',
};

const ROUNDED_CLASS: Record<ButtonRounded, string> = {
  pill: 'rounded-pill',
  lg: 'rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    rounded = 'pill',
    leftIcon,
    rightIcon,
    loading = false,
    fullWidth = false,
    disabled,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center whitespace-nowrap',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100',
        'min-h-tap md:min-h-0', // 44px Apple HIG target on mobile, auto on desktop
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        ROUNDED_CLASS[rounded],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden
        />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
});

export default Button;
