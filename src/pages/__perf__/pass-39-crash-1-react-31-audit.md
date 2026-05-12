# Pass 39 CRASH-1 — React #31 crash on ResearchResultsPage (2026-05-12)

## Symptom

After Pass 38 deployed the new `ResearchResultsPage` to production,
visiting `/results/{any_research_mission_id}` rendered a pure black
page. Console emitted:

```
Minified React error #31; args=[object with keys {goal, title, rationale}]
  at vendor-charts-CIiDHUhl.js:31:160
```

React #31 = "Objects are not valid as a React child." The component
tried to render a plain JS object directly.

## Root cause

`src/pages/ResearchResultsPage.tsx` declared:

```ts
interface ResearchInsights {
  ...
  follow_ups?: string[];
  recommendations?: string[];
  ...
}
```

But production data in `missions.insights.recommendations` is the
rich shape:

```json
[
  {"goal": "increase awareness",
   "title": "Invest in TV/streaming media",
   "rationale": "0 respondents cited TV..."},
  ...
]
```

The Claude prompt that produces these recommendations was upgraded
during Pass 35 / Pass 36 to emit `{goal, title, rationale}` instead
of bare strings — improving fidelity for the research goal — but
the frontend renderer (`RecommendationList`) still treated each
item as a string:

```tsx
<span>{r}</span>   // r is the object, not a string
```

React threw on the first render after the type-coercion failed.
Because the throw happened inside the page render tree (not caught
by an error boundary), the entire page rendered as a blank
component, with the `vendor-charts` stack trace because Recharts
components are siblings in the same render boundary.

## The fact that the stack trace says "vendor-charts"

Red herring: React's production build hashes file names and
component names. The minified stack pointed at `vendor-charts` not
because Recharts itself was rendering an object, but because that
chunk is where the React `createElement` / reconciler code lives in
the user's bundle layout. The real offending site was
`RecommendationList` inside `ResearchResultsPage.tsx`.

This is also why Pass 38's verification gate (the bundle SHA match
check via /version.json) didn't catch it — SHA matched fine, the
deployed code was correct, the type was just wrong about its input.

## The fix

1. Widen `ResearchInsights.recommendations` and `follow_ups` from
   `string[]` to `InsightItem[]` where:

   ```ts
   type InsightItem = string | { goal?: string; title?: string; rationale?: string };
   ```

2. Add a `renderInsightItem` helper that branches on `typeof`:
   - string → render as before
   - object with any of {title, rationale, goal} → render structured
     (title bold, rationale below, goal as a small badge)
   - object with none of those → JSON-stringify as a last-resort
     visible fallback (so future schema drift surfaces visibly
     rather than crashing the page)
   - null/undefined → return null

3. Update `RecommendationList` to call `renderInsightItem(r, i)`
   inside each `<li>` instead of rendering `{r}` directly.

## Why the defensive fallback matters

The schema for AI-generated insights has drifted twice now (Pass 30
added `executive_summary`, Pass 35 changed recommendation shape).
A future schema change is more likely than a crash-free guarantee.
The JSON-stringify fallback is ugly on screen but it is *visible*
and it is *not a page-wide crash*. An error boundary at this layer
would be a stronger fix; that's a Pass 40+ concern.

## Verification

After this commit lands + Vercel auto-deploys:

```
1. curl -s https://www.vettit.ai/version.json | jq .pass
   → must be 39

2. Open https://www.vettit.ai/results/b2072d69-26ed-44bd-bd82-84f539a8eb70
   in a fresh signed-in browser tab
   → must show the hero, KPI strip, executive summary, charts
   → DevTools console must show zero React errors
   → "Recommendations" section must show 3-5 cards with bold titles
     and explanatory rationale text

3. git log -1 --format='%H' on origin/main must match step 1's sha
```

## Forward policy

Any AI-generated insight field (insights.*) that maps to a list
rendered as JSX must go through `renderInsightItem` or an equivalent
type-checked helper. Direct `{item}` JSX renders against
AI-generated payloads are now flagged in code review.

## Related work

- Pass 30: introduced `executive_summary` field
- Pass 35: changed recommendation shape from string to
  {goal, title, rationale}
- Pass 36 A0c: created `ResearchResultsPage.tsx` with the wrong type
- Pass 37 A1: added KPI strip + tightened layout, did not touch
  recommendations rendering
- Pass 38: first time Pass 36 code reached production, surfaced the
  bug immediately
- Pass 39 (this): widens type + adds renderInsightItem + audit doc
