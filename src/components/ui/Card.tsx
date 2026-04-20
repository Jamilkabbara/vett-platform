import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Surface primitive — mirrors prototype.html's .card:
 *   background: var(--bg2); border: 1px solid var(--b1);
 *   border-radius: 14px; padding: 20px;
 *
 * Padding shrinks to 16px on mobile so cards don't eat narrow screens.
 * Optional `hover` prop lifts the border and bg on pointer-over for
 * interactive cards (dashboard tiles, mission rows, etc.).
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Render a subtle hover state — use on clickable cards. */
  hover?: boolean;
  /** Drop padding to zero when the child owns its own spacing. */
  flush?: boolean;
  /** Extra-large hero card with more padding and a softer glow. */
  elevated?: boolean;
  as?: 'div' | 'article' | 'section' | 'li';
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    hover = false,
    flush = false,
    elevated = false,
    as: Tag = 'div',
    className = '',
    children,
    ...rest
  },
  ref,
) {
  const Component = Tag as 'div';
  return (
    <Component
      ref={ref}
      className={[
        'bg-bg2 border border-b1 rounded-2xl',
        flush ? 'p-0' : 'p-4 md:p-5',
        hover
          ? 'transition-all duration-200 hover:border-b2 hover:bg-bg3 cursor-pointer'
          : '',
        elevated ? 'shadow-float' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </Component>
  );
});

export default Card;
