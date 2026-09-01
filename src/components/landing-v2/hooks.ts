/**
 * Shared hooks for the /landing-v2 port.
 *
 * Kept in their own module (rather than alongside the components) so every
 * .tsx file in this folder exports components only, which is what the
 * react-refresh lint rule wants for reliable HMR.
 *
 * PASS 49 - BOTH HOOKS NOW FAIL SAFE.
 * The previous versions had the same shape of defect: their unhappy path left
 * the page WORSE than no animation at all. `.lv2-reveal` is `opacity: 0` until
 * a class is added, so an observer that never fires leaves whole sections
 * invisible; and useCountUp starts at 0, so an animation frame that never
 * arrives leaves "$0", "0min", "0+" on screen next to real copy. Both were
 * reported from a real browser.
 *
 * The exact trigger was not reproducible in a headless preview (its
 * IntersectionObserver does not fire at all - a plain control probe confirmed
 * that), so rather than guess at a browser-specific cause these are hardened
 * so that EVERY failure path ends with the content visible and the number
 * correct. An animation that does not play is a cosmetic loss; content that
 * never appears is a broken page.
 */
import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Ports the mock's reveal-on-scroll observer: flips to `true` the first time
 * the element is sufficiently visible, then stops watching.
 *
 * Three independent triggers, any of which reveals:
 *   1. a synchronous geometry check on mount, so anything already on screen
 *      never waits for a callback;
 *   2. the IntersectionObserver;
 *   3. a passive scroll listener using the same geometry test.
 * Plus a timeout backstop so content can never be stranded at opacity 0.
 */
export function useInView<T extends HTMLElement>(threshold = 0.14) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Reduced motion: show the end state immediately, no transition to miss.
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }

    // Denominator is min(height, viewport): a section TALLER than the viewport
    // can never reach a ratio of `threshold` against its own full height, so
    // measuring against the raw element height would make tall sections
    // permanently unrevealable.
    const visibleEnough = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (r.height <= 0 || vh <= 0) return false;
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      return visible / Math.min(r.height, vh) >= threshold;
    };

    let settled = false;
    let io: IntersectionObserver | null = null;
    let timer = 0;

    const onScroll = () => { if (visibleEnough()) reveal(); };

    function reveal() {
      if (settled) return;
      settled = true;
      setInView(true);
      if (io) io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (timer) window.clearTimeout(timer);
    }

    if (visibleEnough()) { reveal(); return undefined; }

    io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) reveal(); },
      { threshold },
    );
    io.observe(el);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Backstop. If none of the above ever fires, show the content anyway.
    timer = window.setTimeout(reveal, 2500);

    return () => {
      if (io) io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (timer) window.clearTimeout(timer);
    };
  }, [threshold]);

  return { ref, inView };
}

/**
 * The mock's count-up: cubic ease-out over `duration`, starting when `start`.
 * Always ENDS on `target`, whatever happens to the animation frames - a
 * throttled or backgrounded tab must not leave a 0 on the page.
 */
export function useCountUp(target: number, start: boolean, duration = 1100) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return undefined;

    if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
      setValue(target);
      return undefined;
    }

    let raf = 0;
    let t0: number | null = null;
    let cancelled = false;

    const step = (ts: number) => {
      if (cancelled) return;
      if (t0 === null) t0 = ts;
      const k = Math.min((ts - t0) / duration, 1);
      if (k >= 1) { setValue(target); return; }   // land exactly on target
      setValue(Math.round(target * (1 - (1 - k) ** 3)));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // Backstop: rAF is throttled in background tabs and on some low-power
    // modes. Settle on the real number rather than leaving a partial count
    // (the reported symptom was "7+" where 150+ was expected).
    const settle = window.setTimeout(() => { if (!cancelled) setValue(target); }, duration + 500);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [target, start, duration]);

  return value;
}
