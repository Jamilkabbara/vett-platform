import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTypewriterPlaceholderOptions {
  /** Phrases to cycle through, in order. */
  phrases: string[];
  /** Milliseconds between each character typed (default 55). */
  typingSpeed?: number;
  /** Milliseconds between each character deleted (default 28). */
  deletingSpeed?: number;
  /** Milliseconds to pause at the full phrase before deleting (default 1800). */
  pauseAfterType?: number;
  /** Milliseconds to pause after clearing before typing the next phrase (default 380). */
  pauseAfterDelete?: number;
  /**
   * When true the animation freezes in place. Resume resumes from the same
   * position — callers should set this when the input is focused and the
   * user has started typing.
   */
  paused?: boolean;
}

type Phase = 'typing' | 'pause-full' | 'deleting' | 'pause-empty';

/**
 * Drives a character-by-character "typewriter" placeholder string.
 *
 * Returns the current placeholder text. Wire it straight into
 * `<input placeholder={placeholder} />`.
 *
 * @example
 * const placeholder = useTypewriterPlaceholder({ phrases: HERO_PLACEHOLDERS, paused: isFocused });
 */
export function useTypewriterPlaceholder({
  phrases,
  typingSpeed = 55,
  deletingSpeed = 28,
  pauseAfterType = 1800,
  pauseAfterDelete = 380,
  paused = false,
}: UseTypewriterPlaceholderOptions): string {
  const [displayed, setDisplayed] = useState('');
  const phaseRef  = useRef<Phase>('typing');
  const phraseIdx = useRef(0);
  const charIdx   = useRef(0);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback(
    (fn: () => void, delay: number) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(fn, delay);
    },
    [],
  );

  const tick = useCallback(() => {
    const phrase = phrases[phraseIdx.current % phrases.length];

    switch (phaseRef.current) {
      case 'typing': {
        charIdx.current += 1;
        const next = phrase.slice(0, charIdx.current);
        setDisplayed(next);
        if (charIdx.current >= phrase.length) {
          phaseRef.current = 'pause-full';
          schedule(tick, pauseAfterType);
        } else {
          schedule(tick, typingSpeed);
        }
        break;
      }

      case 'pause-full': {
        phaseRef.current = 'deleting';
        schedule(tick, deletingSpeed);
        break;
      }

      case 'deleting': {
        charIdx.current -= 1;
        setDisplayed(phrase.slice(0, charIdx.current));
        if (charIdx.current <= 0) {
          phaseRef.current = 'pause-empty';
          phraseIdx.current = (phraseIdx.current + 1) % phrases.length;
          schedule(tick, pauseAfterDelete);
        } else {
          schedule(tick, deletingSpeed);
        }
        break;
      }

      case 'pause-empty': {
        phaseRef.current = 'typing';
        schedule(tick, typingSpeed);
        break;
      }
    }
  }, [phrases, typingSpeed, deletingSpeed, pauseAfterType, pauseAfterDelete, schedule]);

  // Start the loop on mount; clear on unmount.
  useEffect(() => {
    schedule(tick, typingSpeed);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause / resume: clear the pending timer when paused, restart when unpaused.
  useEffect(() => {
    if (paused) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } else {
      // Re-enter the tick loop from wherever we froze.
      schedule(tick, typingSpeed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return displayed;
}
