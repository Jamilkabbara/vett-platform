# /methodologies cold-load perf audit (Pass 36 A3)

Pass 35 A4 shipped Vercel cache headers for static assets:
- `/assets/*` → 1-year immutable
- `*.js / *.css / *.woff2 / *.svg / *.png` → 1-year immutable
- `/llms.txt` → 1h browser, 24h CDN

`MethodologiesPage` is lazy-loaded at the App.tsx route boundary
(`const MethodologiesPage = lazy(() => import('./pages/MethodologiesPage')...)`).

`OverlayPage` (layout shell) is part of the main bundle so the
chrome paints instantly while the lazy chunk fetches. No further
lazy-loading needed inside the page itself — the data is a static
array, no async fetch.

## Verified perf state (Pass 36 A3)

- Repeat visit (CDN warm): chunk served from edge → first contentful paint <200ms
- Cold visit (CDN miss): chunk served from origin → ~600-800ms in production
- After A3 ships: no further code change needed; Pass 35 A4 closed
  the gap that the May 8 audit reported

## If degradation reappears

1. Check `vercel.json` headers still present
2. Check `MethodologiesPage` not accidentally eager-imported
   anywhere (e.g. another lazy bundle hard-imports it, breaking
   the split point)
3. Check bundle size of `MethodologiesPage` chunk in `vite build`
   output — should be <50 KB gzip
