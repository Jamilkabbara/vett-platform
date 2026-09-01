/**
 * results-v2 hooks + the data-lens store.
 *
 * Components-only modules keep react-refresh happy, so everything that is not
 * a component lives here (same split as src/components/landing-v2/hooks.ts).
 *
 * The lens is a module-level store rather than a context so that any chart,
 * at any depth, can raise the tooltip without threading a prop through six
 * layers. It is read with useSyncExternalStore, so there is exactly one
 * subscriber (the <Lens/> element) and hovering a bar does not re-render the
 * page.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';

/* ══════════════════════════════════════════════════════════════════════
   useDrawIn - the mock's draw-on trigger
════════════════════════════════════════════════════════════════════════ */

/**
 * The mock draws every bar, stem and donut arc from zero 120ms after load,
 * in one orchestrated pass, and never gates on scroll. This reproduces that.
 *
 * It is deliberately NOT an IntersectionObserver. A scroll-gated chart that
 * misses its observer callback renders as an empty track with no way back,
 * which is exactly the failure mode a results page cannot afford: a chart that
 * silently shows nothing reads as "no data", not as "not scrolled to yet".
 * Drawing on mount cannot get stuck.
 *
 * Under `prefers-reduced-motion: reduce` it returns true on the first render,
 * so the final state is painted with no transition at all.
 */
export function useDrawIn(delay = 120) {
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [drawn, setDrawn] = useState(reduced);

  useEffect(() => {
    if (drawn) return;
    const t = window.setTimeout(() => setDrawn(true), delay);
    return () => window.clearTimeout(t);
  }, [drawn, delay]);

  return drawn;
}

/* ══════════════════════════════════════════════════════════════════════
   Data lens - the mock's #lens floating tooltip
════════════════════════════════════════════════════════════════════════ */

export type LensTone = 'lime' | 'amber' | 'rose';

export interface LensRow {
  k: string;
  v: string;
  tone?: 'lime' | 'amber';
}

export interface LensContent {
  title: string;
  rows: LensRow[];
  /** Optional verbatim, rendered italic under a hairline. */
  quote?: string;
  tone?: LensTone;
}

export interface LensState {
  content: LensContent | null;
  x: number;
  y: number;
}

const EMPTY: LensState = { content: null, x: 0, y: 0 };

let state: LensState = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function snapshot() {
  return state;
}

export function showLens(content: LensContent, x: number, y: number) {
  state = { content, x, y };
  emit();
}

export function moveLens(x: number, y: number) {
  if (!state.content) return;
  state = { ...state, x, y };
  emit();
}

export function hideLens() {
  if (state === EMPTY) return;
  state = EMPTY;
  emit();
}

export function useLensState(): LensState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/**
 * Handlers for any element that should raise the lens. Pointer-driven only:
 * touch devices get no tooltip and lose nothing, because every figure the
 * lens shows is also printed in the row itself.
 */
export function lensHandlers(build: () => LensContent) {
  return {
    onMouseEnter: (e: React.MouseEvent) => showLens(build(), e.clientX, e.clientY),
    onMouseMove: (e: React.MouseEvent) => moveLens(e.clientX, e.clientY),
    onMouseLeave: () => hideLens(),
  };
}
