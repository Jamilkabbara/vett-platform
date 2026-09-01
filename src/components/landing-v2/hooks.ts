/**
 * Shared hooks for the /landing-v2 port.
 *
 * Kept in their own module (rather than alongside the components) so every
 * .tsx file in this folder exports components only, which is what the
 * react-refresh lint rule wants for reliable HMR.
 */
import { useEffect, useRef, useState } from 'react';

/**
 * Ports the mock's reveal-on-scroll observer: flips to `true` the first time
 * the element crosses `threshold` visibility, then stops observing.
 */
export function useInView<T extends HTMLElement>(threshold = 0.14) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/** The mock's count-up: cubic ease-out over `duration`, starting when `start`. */
export function useCountUp(target: number, start: boolean, duration = 1100) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const k = Math.min((ts - t0) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, start, duration]);

  return value;
}
