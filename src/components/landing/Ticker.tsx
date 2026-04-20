import { useEffect, useState } from 'react';

/**
 * Horizontally scrolling marquee — mirrors prototype's .ticker / .ticker-inner.
 *
 * Behaviour:
 *   - 40s linear infinite translateX(-50%) loop (items are duplicated so the
 *     seam is invisible).
 *   - Hover to pause (cognitive-accessibility nicety).
 *   - Honours `prefers-reduced-motion: reduce` — the ticker renders static,
 *     showing the first set of items without movement.
 *
 * Styling reads from Tailwind design tokens exclusively.
 */
export interface TickerProps {
  items: string[];
  /** Override scroll duration in seconds. Default 40. */
  durationSeconds?: number;
  className?: string;
}

export function Ticker({
  items,
  durationSeconds = 40,
  className = '',
}: TickerProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Duplicate the list so translateX(-50%) lands on an identical frame.
  const doubled = reducedMotion ? items : [...items, ...items];

  return (
    <div
      className={[
        'relative overflow-hidden',
        'bg-bg2/60 border-y border-b1',
        'py-2.5',
        'group',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Recent missions ticker"
    >
      <div
        className={[
          'flex whitespace-nowrap gap-12',
          reducedMotion ? '' : 'animate-ticker',
          // Pause on hover (cognitive accessibility)
          reducedMotion ? '' : 'group-hover:[animation-play-state:paused]',
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          reducedMotion
            ? undefined
            : { animationDuration: `${durationSeconds}s` }
        }
      >
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="shrink-0 font-display text-[10px] md:text-[11px] font-bold text-lime uppercase tracking-[0.12em]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default Ticker;
