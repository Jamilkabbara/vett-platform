/**
 * Dev-only horizontal-overflow detector.
 *
 * `overflow-x: hidden` used to sit on html, body and #root. It made page
 * overflow measure ZERO at every width while suppressing it, so a real layout
 * regression was silently clipped rather than visible. It had already hidden a
 * 29px overflow on /methodology at 320 - a grid child with the default
 * min-width:auto - which surfaced only when element geometry was measured
 * directly instead of the page's.
 *
 * Removing the suppression makes overflow real again. This makes it LOUD in
 * development, so the next one is caught by whoever introduces it rather than
 * by an audit months later.
 *
 * Dev only: the whole module is behind `import.meta.env.DEV`, so Rollup folds
 * the call away and nothing ships to production.
 */

/** Elements inside a genuine scroll container are allowed to be wider. */
function insideScroller(el: Element): boolean {
  let p = el.parentElement;
  while (p) {
    const o = getComputedStyle(p).overflowX;
    if (o === 'auto' || o === 'scroll') return true;
    p = p.parentElement;
  }
  return false;
}

function check(): void {
  const d = document.documentElement;
  const over = d.scrollWidth - d.clientWidth;
  if (over <= 0) return;

  const offenders = Array.from(document.querySelectorAll<HTMLElement>('*'))
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.right > window.innerWidth + 1)
    .filter(({ el }) => !insideScroller(el))
    .sort((a, b) => b.rect.right - a.rect.right)
    .slice(0, 5)
    .map(({ el, rect }) => ({
      element: el,
      selector: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 3).join('.') : ''),
      widthPx: Math.round(rect.width),
      overflowsByPx: Math.round(rect.right - window.innerWidth),
    }));

  // eslint-disable-next-line no-console
  console.warn(
    `[overflow] page scrolls horizontally by ${over}px at ${window.innerWidth}px wide.`,
    offenders.length ? offenders : '(no unclipped offender found - check a fixed/absolute child)',
  );
}

let scheduled = 0;
function schedule(): void {
  window.clearTimeout(scheduled);
  scheduled = window.setTimeout(check, 400);
}

export function installOverflowGuard(): void {
  if (typeof window === 'undefined') return;
  schedule();
  window.addEventListener('resize', schedule);
  // Catch overflow introduced by a route change or late-loading content.
  const mo = new MutationObserver(schedule);
  mo.observe(document.body, { childList: true, subtree: true });
}
