# Pass 5A Report — Performance / Bundle

**Branch:** `pass-4-7-fixes`
**Date:** 2026-04-22

---

## (a) Files changed

| File | Change |
|------|--------|
| `src/App.tsx` | All 22 page imports converted to `React.lazy` + `<Suspense fallback={<PageLoader />}>` |
| `src/components/shared/PageLoader.tsx` | New — full-screen spinner used as Suspense fallback |
| `vite.config.ts` | Added `build.rollupOptions.output.manualChunks` (6 vendor chunks) |
| `index.html` | Added `<meta name="theme-color">` + Stripe preconnect/dns-prefetch hints |

---

## (b) Before / After

### Before (estimated — single monolithic JS bundle)
All 22 pages + all vendor libs compiled into one chunk. Reported as ~1.3 MB raw / ~350–400 kB gzip. Every user downloaded recharts and framer-motion even if they only visited the landing page.

### After — actual `npm run build` output (2026-04-22)

**Entry point (critical path — every user downloads this):**
| Chunk | Raw | Gzip |
|-------|-----|------|
| `index.js` (app shell + router) | 35.0 kB | 11.7 kB |
| `vendor-react` (react + react-dom + react-router) | 36.7 kB | 13.4 kB |
| **Initial load total** | **~71.7 kB** | **~25.1 kB** |

**Vendor chunks (lazy — downloaded only when the relevant page is first visited):**
| Chunk | Raw | Gzip | Loaded by |
|-------|-----|------|-----------|
| `vendor-supabase` | 125.9 kB | 34.3 kB | Any page requiring auth |
| `vendor-motion` | 121.3 kB | 40.3 kB | Pages with Framer Motion animations |
| `vendor-markdown` | 118.3 kB | 36.5 kB | Blog pages only |
| `vendor-stripe` | 13.4 kB | 5.1 kB | Payment flow only |
| `vendor-charts` | 505.9 kB | 154.0 kB | `/results` only |

**Page chunks (loaded on first navigation to each route):**
| Page | Raw | Gzip |
|------|-----|------|
| `DashboardPage` | 84.2 kB | 24.2 kB |
| `ResultsPage` | 42.1 kB | 12.2 kB |
| `LandingPage` | 29.8 kB | 9.2 kB |
| `MissionSetupPage` | 21.2 kB | 6.8 kB |
| `missionGoals` (data) | 26.9 kB | 8.2 kB |
| `AdminPage` | 16.8 kB | 4.3 kB |
| `ActiveMissionPage` | 16.8 kB | 5.5 kB |
| `ProfilePage` | 15.9 kB | 4.0 kB |
| All static/auth pages | 3–11 kB each | — |

---

## (c) Impact

### Critical-path improvement
- **Landing page first visit:** user downloads ~71.7 kB JS (entry + react vendor). Previously: ~1.3 MB.
- **Recharts (505 kB)** is completely deferred until `/results` — users who never visit Results never download it.
- **Framer-motion (121 kB)** deferred — loads on first animated page visit, then cached.

### Vite warning
`vendor-charts` triggers the >500 kB chunk warning. This is expected and acceptable — recharts is a large library and can't be meaningfully split further. It is already isolated to a single chunk that only loads on the Results page. The warning is suppressible via `build.chunkSizeWarningLimit` but left as-is to remain visible for future audits.

### Lucide icon micro-chunks
Rollup extracted individual icon files (`check.js`, `chevron-down.js`, etc.) as tiny 0.3–0.9 kB chunks. This is correct tree-shaking behavior — each icon is bundled with the page that uses it; the individual files are transitive deps not standalone chunks.

---

## (d) Architecture notes

- **Named export pattern:** All 22 pages use named exports. Lazy imports use `.then(m => ({ default: m.PageName }))` to re-export as default — this is the standard React.lazy requirement.
- **`DashboardLayout` kept eager:** `DashboardLayout` wraps lazy-loaded pages in `<Route>` JSX. It's a layout shell (~0 byte content) so there's no benefit to lazying it, and it keeps the wrapping JSX readable.
- **Single `<Suspense>` wrapper:** One Suspense at the `<Routes>` level covers all page transitions. The `<PageLoader />` fallback matches the app background color (`#0B0C15`) so there's no flash of white while chunks load.

---

## (e) Known limitations

- **`vendor-supabase` loads early** because auth state is checked on nearly every page. This 125 kB chunk will typically load within 1-2 route transitions from landing. Acceptable — authentication is a core dependency.
- **`DashboardPage` is 84 kB** — largest page chunk. Likely due to the full chart/analytics panel. Could be further split in a future pass if it becomes a bottleneck.
- **No service worker / precaching.** Chunks are cached by the browser after first visit via content-hash filenames (`vendor-charts-iIl9KtVy.js`). A service worker could pre-cache critical chunks, but this is out of scope for this pass.

---

## Test instructions for Jamil

1. Deploy or run `npm run preview` after `npm run build`
2. Open DevTools → Network → JS filter
3. Navigate to `/landing` — should see only `index-*.js` + `vendor-react-*.js` download (~71 kB)
4. Navigate to `/results` — should then see `vendor-charts-*.js` (505 kB) download for the first time
5. Navigate back to `/landing` — `vendor-charts` should NOT re-download (cached)
6. Verify the "Thinking…" spinner appears between route transitions (the Suspense fallback)
