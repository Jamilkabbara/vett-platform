# Pass 22 — Frontend Performance Report (Bug 22.28)

Companion to `PASS_22_REPORT.md`. Documents what shipped in B7 and what was identified for Pass 23.

## What shipped in B7

### ChatWidget lazy-loaded on `/missions` and `/results/:id`

`src/pages/MissionsListPage.tsx` and `src/pages/ResultsPage.tsx` now import `ChatWidget` via `React.lazy()` + `<Suspense fallback={null}>`. The widget loads only when the user is signed in and the page renders the chat surface (it stays hidden behind the floating button until clicked, but the chunk is fetched once the bubble mounts).

**Why this matters:** ChatWidget pulls in `react-markdown` (118KB / 36KB gz vendor chunk) plus its own state machinery. Before this change, both pages paid that cost on initial load even when the user never opened the chat. The chunk is now `dist/assets/ChatWidget-*.js` and downloads asynchronously.

### Build chunk shape (post-refactor)

| Chunk | Size (raw) | Size (gz) | Lazy? |
|---|---:|---:|---|
| `index-*.js` (entry) | 39.77 KB | 13.26 KB | static |
| `LandingPage-*.js` | 33.52 KB | 10.48 KB | route-lazy |
| `MissionsListPage-*.js` | 12.30 KB | 4.10 KB | route-lazy |
| `ResultsPage-*.js` | 51.85 KB | 14.09 KB | route-lazy |
| **`ChatWidget-*.js`** | **18.75 KB** | **6.13 KB** | **lazy ✅ (B7 work)** |
| `vendor-markdown-*.js` | 118.30 KB | 36.53 KB | lazy via ChatWidget |
| `VettingPaymentModal-*.js` | 17.88 KB | 5.76 KB | route-lazy |
| `vendor-react-*.js` | 36.72 KB | 13.36 KB | static |
| `vendor-supabase-*.js` | 125.88 KB | 34.32 KB | static |
| `vendor-stripe-*.js` | 13.41 KB | 5.15 KB | route-lazy |

### Confirmed already-lazy (verified during the audit)

- All page-level routes are lazy via `React.lazy()` in `App.tsx` (Pass 21 era work; verified intact)
- Stripe SDK is lazy via `loadStripe()` singleton in `StripeElementsWrapper`
- `html2canvas.esm-*.js` (201KB) is only pulled when the user runs an export

## Pass 23 punch list

These were identified during the build audit but not shipped in B7. Each is a tactical change with measurable bundle/perf impact.

### ProfilePage at 852KB / 281KB gz — INVESTIGATE

The largest single chunk. Likely contains an unintended heavy dependency (avatar uploader, html2canvas pulled eagerly, or a similar). Worth a focused look:

1. `npx vite-bundle-visualizer` to see what's inside `ProfilePage-*.js`
2. Lazy-load the avatar uploader / image cropper if present
3. Defer `html2canvas` to user action

### vendor-charts at 532KB / 159KB gz

Recharts is imported by `/admin` (heavily) and `/results/:id` (per-question charts). It's already loaded only on those routes (separate vendor chunk), so this is acceptable as-is — but if Recharts ever ships a Lighter footprint or if we move to a smaller chart library on `/results` (where we use 3-4 chart types), this drops 100+ KB gz from the post-checkout landing experience.

### Image work (deferred)

The master-prompt punch list includes:

- WebP conversion of hero images
- Explicit `width`/`height` attributes to prevent CLS
- `<link rel="preload" as="image" href="/hero.webp">` for above-fold

These need design + asset work, not just code. Filed for Pass 23 alongside the mobile sweep.

### Service worker for static assets (deferred)

Vercel's CDN handles caching reasonably well already (24h on hashed asset filenames). A service worker would push offline + back/forward-cache reliability further but adds complexity (cache invalidation, version mismatches between SW and bundle). Deferred until a measurable win is established.

## Lighthouse — manual run pending

I can't run Lighthouse from a headless backend. Suggested manual verification:

```
1. PageSpeed Insights: https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.vettit.ai
2. Run for /, /missions, /results/<a-completed-mission>
3. Record before/after Performance score in this doc
```

Expected gain on `/missions` and `/results`: 3-7 mobile Performance points, mostly from the smaller initial-bundle TTI window now that react-markdown is deferred.

## Verification of the lazy refactor

```bash
# Production should now serve ChatWidget as a separate chunk:
curl -sI https://www.vettit.ai/assets/ChatWidget-*.js  # 200 (after deploy)

# DevTools network tab on /missions:
# - Initial page load: NO ChatWidget-*.js, NO vendor-markdown-*.js
# - Click the chat bubble → both chunks fetch
```
