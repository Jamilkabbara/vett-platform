/*
 * VETT service worker. INSTALLABILITY ONLY. It caches nothing, ever.
 *
 * WHY THIS FILE IS THIS SHORT, AND WHY IT MUST STAY THAT SHORT
 *
 * The build is:
 *
 *   write-version -> sitemap -> vite build -> scripts/prerender.mjs
 *
 * prerender.mjs runs AFTER vite build and writes 24 per-route HTML files into
 * dist/, each with its own title, description, canonical, Open Graph tags and
 * a real h1. Anything that generates a precache manifest during `vite build`
 * (vite-plugin-pwa, Workbox, generateSW) would run BEFORE those files exist.
 * It would therefore (a) precache the generic index.html shell and none of the
 * 24 real pages, and (b) with the usual navigateFallback, hand that generic
 * shell to every repeat visitor on /about, /methodologies, /vs/typeform and so
 * on. Every one of those pages would silently go back to claiming it is the
 * homepage. That is the SEO work undone, invisibly, for humans only.
 *
 * On top of that, VETT is a research product: the numbers on /results ARE the
 * product. Serving a cached copy of a results page, or a cached Supabase or
 * API response, would mean showing someone last week's answer and calling it
 * this week's. And /version.json is the deploy-freshness signal the team
 * checks with a single curl; intercepting it would make a stale deploy and a
 * fresh one indistinguishable.
 *
 * So this worker does exactly one thing: it exists, with a fetch handler.
 *
 * WHAT THE FETCH HANDLER IS FOR
 *
 * Chrome dropped the service-worker-with-a-fetch-handler requirement for
 * INSTALLING an app from the browser menu in version 108 on Android and 112 on
 * desktop, so the manifest alone already makes VETT installable. The algorithm
 * that decides whether to PROMOTE the install, which is what fires
 * beforeinstallprompt and what puts the install affordance in front of a user
 * who did not go looking for it, still wants a registered fetch handler. The
 * handler below is what satisfies that, and nothing else.
 *
 * It never calls event.respondWith(). That is the whole safety property: a
 * fetch handler that does not call respondWith() hands the request straight
 * back to the browser's normal network stack, exactly as if no service worker
 * were installed. There is no code path here that can return a cached or
 * fallback document, for a navigation or for anything else, because there is
 * no cache and no response. /version.json, all 24 prerendered routes, every
 * API and Supabase call: all of them go to the network, every time.
 *
 * scripts/verify-sw-passthrough.mjs enforces this in `npm test`. It fails the
 * build if respondWith, the Cache or caches APIs, or anything precache-shaped
 * ever appears in this file. Do not work around it. If VETT ever genuinely
 * wants offline support, that is a separate, deliberate piece of work that has
 * to solve the prerender-ordering problem first.
 */

self.addEventListener('install', () => {
  // Take over immediately rather than waiting for every tab to close. Safe
  // here precisely because this worker changes no behaviour: there is no old
  // cached content for a new version to have to supersede.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Deliberately empty. See the header comment. Not calling respondWith() is
  // the point, not an oversight: the browser fetches every request itself.
});
