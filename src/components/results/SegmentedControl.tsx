import { useRef, type KeyboardEvent } from 'react';

/**
 * Pass 23 Bug 23.60 Chunk 6 — Segmented control.
 *
 * Replaces the pill-style tabs the prior CrossCutCard used. A
 * segmented control reads as a single unified UI element with
 * internal divisions, not as a row of independent pills — easier
 * to interpret as "pick one of N exclusive options."
 *
 * Visual contract:
 *   - Single rounded container with a subtle border
 *   - Buttons sit flush against each other with no gap
 *   - Active option: filled accent bg, high-contrast text
 *   - Inactive: transparent bg, muted text, hover lifts contrast
 *   - Focus-visible accent ring on the active element for keyboard
 *
 * Keyboard nav (per WAI-ARIA tabs pattern, applied to a radiogroup):
 *   - Left / Right arrows move selection
 *   - Home / End jump to first / last
 *
 * Pass any string keys via `options[]`; selection by index keeps
 * parent reconciliation simple. Variant `purple` matches the
 * Cross-Cut Analysis card's purple accent; `lime` available for
 * future use (Cross-channel benchmarks in Bug 24.01, etc.).
 */

type Variant = 'purple' | 'lime' | 'neutral';

interface SegmentedControlProps {
  options: string[];
  /** Index of the active option. */
  activeIdx: number;
  /** Called when user selects a new option. */
  onChange: (nextIdx: number) => void;
  /** Visual accent. Defaults to 'purple'. */
  variant?: Variant;
  /** Accessible label for the radiogroup. */
  ariaLabel: string;
  /** Optional className for the outer container. */
  className?: string;
}

const ACTIVE_CLASSES: Record<Variant, string> = {
  purple:  'bg-purple-500/25 text-purple-100 ring-1 ring-purple-400/40',
  lime:    'bg-lime/25 text-lime-100 ring-1 ring-lime/40',
  neutral: 'bg-white/15 text-white ring-1 ring-white/30',
};

const FOCUS_CLASSES: Record<Variant, string> = {
  purple:  'focus-visible:ring-2 focus-visible:ring-purple-400',
  lime:    'focus-visible:ring-2 focus-visible:ring-lime',
  neutral: 'focus-visible:ring-2 focus-visible:ring-white/60',
};

export function SegmentedControl({
  options,
  activeIdx,
  onChange,
  variant = 'purple',
  ariaLabel,
  className = '',
}: SegmentedControlProps) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const focusOption = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, options.length - 1));
    onChange(clamped);
    buttonsRef.current[clamped]?.focus();
  };

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        focusOption(idx + 1 >= options.length ? 0 : idx + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusOption(idx - 1 < 0 ? options.length - 1 : idx - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusOption(0);
        break;
      case 'End':
        e.preventDefault();
        focusOption(options.length - 1);
        break;
    }
  };

  if (options.length === 0) return null;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        'inline-flex items-stretch rounded-xl border border-white/10 bg-white/5 p-1',
        'overflow-hidden',
        className,
      ].join(' ')}
    >
      {options.map((opt, i) => {
        const isActive = i === activeIdx;
        return (
          <button
            key={opt + i}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(i)}
            onKeyDown={(e) => handleKey(e, i)}
            className={[
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              'focus-visible:outline-none',
              FOCUS_CLASSES[variant],
              isActive
                ? ACTIVE_CLASSES[variant]
                : 'bg-transparent text-white/60 hover:text-white',
            ].join(' ')}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
