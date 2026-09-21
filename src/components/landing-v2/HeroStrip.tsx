/**
 * Decorative strip under the hero: a field of cells that ripples left to
 * right. Drawn on canvas after mount (nothing to prerender), paused while
 * off screen, and a single still frame under reduced motion.
 *
 * The cell pattern is seeded, not random, so every visit looks the same.
 */
import { useEffect, useRef } from 'react';
import { lpAlpha } from '../../styles/landingTokens.mjs';

const COLS = 46;
const ROWS = 8;

function seeded(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function HeroStrip() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 1.2;
    let visible = true;

    const cells = Array.from({ length: COLS * ROWS }, (_, i) => ({
      c: i % COLS,
      r: Math.floor(i / COLS),
      on: seeded(i) < 0.78,
    }));

    const size = () => {
      w = cv.width = Math.max(1, cv.offsetWidth * dpr);
      h = cv.height = Math.max(1, cv.offsetHeight * dpr);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const gx = w / COLS;
      const gy = h / ROWS;
      for (const cell of cells) {
        const a = Math.max(0, Math.sin(t - (cell.c * 0.12 + cell.r * 0.2))) * 0.95;
        const s = (2.6 + a * 2.2) * dpr;
        ctx.fillStyle = cell.on ? lpAlpha('lime', 0.07 + a * 0.55) : lpAlpha('chartIndigo', 0.05 + a * 0.4);
        ctx.beginPath();
        ctx.roundRect(gx * (cell.c + 0.5) - s / 2, gy * (cell.r + 0.5) - s / 2, s, s, 2 * dpr);
        ctx.fill();
      }
    };

    const loop = () => {
      if (visible) {
        t += 0.02;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    size();
    draw();
    const io = new IntersectionObserver((e) => { visible = e.some((x) => x.isIntersecting); });
    io.observe(cv);
    if (!reduced) raf = requestAnimationFrame(loop);
    const onResize = () => { size(); draw(); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="block w-full max-w-[820px] mx-auto mt-11 aspect-[1/0.3]"
    />
  );
}
