# Pass 40 CRASH40-3 — InsightErrorBoundary defense + Recharts hunt (2026-05-12)

## What the Pass 40 audit reported

After Pass 39 CRASH-1 fixed `RecommendationList` (page no longer
hard-crashes), the console at 3:23 PM still showed:

```
Minified React error #31; args=[object with keys {goal, title, rationale}]
  at cu (vendor-charts-CIiDHUhl.js:30:6314)
  at b  (vendor-charts-CIiDHUhl.js:30:11369)
  at ht (vendor-charts-CIiDHUhl.js:32:1475)
```

i.e. a Recharts-internal subtree was still trying to render an
object with `{goal, title, rationale}` shape.

## Investigation outcome

I could **not** locate a source-level Recharts consumer of this
shape on the `/results/{research_mission}` code path:

### Bundle layout

`vite.config.ts` manualChunks:
```ts
'vendor-charts': ['recharts'],
'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
```

So a real `vendor-charts-...js` stack trace IS Recharts code, not
React's reconciler. The stack trace is therefore genuine — a chart
component IS rendering an object as a child somewhere.

### Files importing `recharts`

```
src/components/admin/AdminAICosts.tsx
src/components/admin/AdminRevenue.tsx
src/components/creative-attention/AttentionBlock.tsx
src/components/creative-attention/EffectivenessDial.tsx
src/components/creative-attention/EmotionRadar.tsx
src/pages/CreativeAttentionResultsPage.tsx
src/pages/ResultsPage.tsx
```

None of these is on the `goal_type='research'` code path
(`ResultsRouter` → `ResearchResultsPage`). `ResearchResultsPage`
imports zero chart code. None of the components it imports
transitively uses Recharts.

### Goal type confirmation

The Pass 40 audit's screenshot description ("GENERAL RESEARCH ·
MISSION COMPLETE") matches the hardcoded text in
`ResearchResultsPage.tsx:537`:

```tsx
<p>General research · {mission.status === 'completed' ? 'Mission complete' : mission.status}</p>
```

So the rendered page IS `ResearchResultsPage`. Confirmed.

### No source-level grep match for the offending shape in a chart context

```
$ git grep -nE 'dataKey="follow|dataKey="recommendation' src/    → 0
$ git grep -nE 'suggested_follow' src/                            → 0 source matches
$ git grep -nE '<Tooltip|<Label|<LabelList' src/pages/Research*   → 0
```

No Recharts component in or imported by `ResearchResultsPage`
consumes recommendations / follow_ups data.

## Two working theories

1. **Stale console error from a previous tab/navigation.**
   Console errors survive across in-tab navigations. If the user
   visited a non-research mission first (whose `/results/X` did
   throw inside Recharts via `ResultsPage` or
   `CreativeAttentionResultsPage`), then navigated to
   `/results/b2072d69`, the prior error stays in the console even
   after CRASH40-2's render-time guards prevent any new throw.

2. **Transitive Recharts on a non-render path.** A site-wide
   widget (Sentry-like analytics, admin shortcuts) might import
   Recharts and execute setup code without rendering a chart;
   that setup code could itself throw if passed a malformed
   payload. Unlikely but possible.

## What this commit ships (defense-in-depth)

Since we can't deterministically reproduce the stack trace from
current source, we harden the page tree to survive any future
schema drift:

1. **`InsightErrorBoundary` component** (`src/components/shared/`)
   - Class component using `getDerivedStateFromError`
   - Catches any React render error inside its children subtree
   - Renders a styled "Couldn't render <section>" fallback with
     the error message (good for production debugging)
   - Logs via `console.error` for production log search

2. **Wraps every insight section** in `ResearchResultsPage`:
     - Executive Summary
     - Cross-Cut Analysis (segment_breakdowns ?? cross_cut_analysis)
     - Tensions Flagged (contradictions ?? tensions)
     - Per-Question Insights
     - Recommendations
     - Suggested Follow-Ups

   So a render error in any one degrades only that section instead
   of blanking the whole modal.

3. **Pairs with Pass 39 `renderInsightItem`**: that helper handles
   data-level type mismatches by JSON-stringifying unknown shapes
   as a last-resort visible fallback. `InsightErrorBoundary`
   covers React-level throws that slip past the helper.

## Verification

After Vercel auto-deploys:

```
1. Open https://www.vettit.ai/results/b2072d69-26ed-44bd-bd82-84f539a8eb70
   in a fresh incognito tab (no console history)
2. DevTools console should show zero React errors
3. If a section renders the amber "Couldn't render <section>" panel,
   that's the error boundary catching schema drift — page tree
   stays intact, the offending section is named explicitly so
   future debugging is fast.
4. After CRASH40-1 (modal scrollTop) + CRASH40-2 (real shapes)
   land, all six sections should render normal content for the
   demo mission.
```

## If the chart-internal #31 reappears after Pass 40 deploy

The fresh stack trace (with post-CRASH40 SHA) will have different
minified function names and a different chunk hash. Re-audit and
file CRASH40-4 with the new evidence.

Most likely it won't reappear — the audit's stale console theory is
the simplest explanation.

## Forward policy

Any AI-generated insight field that maps to a JSX-rendered list
must go through `renderInsightItem` or its equivalent. All such
sections must be wrapped in `InsightErrorBoundary`. Direct
`{item}` JSX renders against AI-generated payloads remain flagged
in code review.
