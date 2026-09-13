/**
 * Register the installability-only service worker.
 *
 * public/sw.js caches nothing and intercepts nothing; it exists so that
 * Chromium's install-promotion algorithm, which still looks for a registered
 * fetch handler, will fire beforeinstallprompt and surface an install
 * affordance. See the long comment at the top of public/sw.js for why it must
 * stay that way, and scripts/verify-sw-passthrough.mjs for the check that
 * keeps it that way.
 *
 * Three guards, all of them about not interfering with anything:
 *
 *   PROD only. In dev, `vite` serves from memory and a worker in the request
 *   path is a source of confusing stale-module behaviour for no benefit. There
 *   is nothing to install locally either.
 *
 *   Not on *.vercel.app. Preview deployments are production builds, but
 *   src/main.tsx already bounces them to www.vettit.ai, and registering a
 *   worker on a preview origin leaves a registration behind on a hostname
 *   nobody will visit again.
 *
 *   After 'load'. Registration is never on the critical path for first paint.
 *
 * Failures are swallowed on purpose. Not being installable is a missing nicety;
 * it must never be able to take a page down.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (window.location.host.endsWith('.vercel.app')) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* Installability is optional. A registration failure is not an error
         worth surfacing to a visitor, and not worth a console warning that
         would read as a real problem. */
    });
  });
}
