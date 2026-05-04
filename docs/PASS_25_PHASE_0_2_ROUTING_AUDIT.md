# Pass 25 Phase 0.2 — Routing Audit

**Date:** 2026-05-04
**Branch:** `pass-25-phase-1-brand-lift-v2-and-routing`

## Symptom

`/results/:missionId` always renders the generic `ResultsPage`. For
`creative_attention` missions the generic page expects `executive_summary`
and `insights.per_question_insights[]` which are null on CA missions
(their data lives in `mission.creative_analysis`). Result: CA missions
display "Executive summary is being generated…" indefinitely on
`/results/:id` even when complete. The dedicated
`CreativeAttentionResultsPage` only renders at `/creative-results/:id`,
which is not the URL the dashboard links to.

Affected missions (5 in production):
- `3348d47b-…` Balenciaga
- `5e1ea434-…` Nike
- `25343ca8-…` jacquemus
- `a24d3776-…` Jacquemus
- `f64eabcb-…` Al Marai

## Current state

`src/App.tsx` lines 127, 157:
- `/results/:missionId` → `ResultsPage`
- `/creative-results/:missionId` → `CreativeAttentionResultsPage`

`CreativeAttentionResultsPage` (634 lines) does its own Supabase fetch
(`from('missions').select('*').eq('id', missionId)`). It takes no props —
reads `:missionId` via `useParams`.

`ResultsPage` (2379 lines) does its own backend fetch via API.

`BrandLiftResultsPage` does not exist. Phase 1 will build it.

## Plan

Build `src/pages/ResultsRouter.tsx`:
1. Read `missionId` from URL params.
2. Probe-fetch `mission.goal_type` from Supabase (light query — single column).
3. Switch:
   - `creative_attention` → render `<CreativeAttentionResultsPage />`
   - `brand_lift` → render `<ResultsPage />` (Phase 1 swaps to `BrandLiftResultsPage`)
   - default → render `<ResultsPage />`
4. Show a brief loading state during the probe.

Mount `ResultsRouter` at `/results/:missionId` in App.tsx in place of
`ResultsPage`. The `/creative-results/:missionId` route stays for
backwards compatibility with any existing dashboard links.

Both downstream pages do their own data fetching, so the router only
needs to probe `goal_type`. Minimal change, no major refactors.

## Out of scope

- Building `BrandLiftResultsPage` — Phase 1 commit 14.
- Migrating CreativeAttentionResultsPage's direct-Supabase fetch to the
  unified backend API — separate refactor pass.
- Removing the legacy `/creative-results/:id` route — keep for now.

## Verification target

Open `/results/3348d47b-54ac-496e-9e2f-528cf26cb53e` (Balenciaga). Should
show the Creative Attention layout with engagement gauge, attention
arc, frame analyses, etc. — not "Executive summary is being generated…".

## Field-path verification (post-commit 2)

Queried the 5 affected missions in Supabase. All have:
- `creative_analysis.summary` populated
- `creative_analysis.frame_analyses` array (1 frame each — these are
  image creatives, not video)
- `summary.overall_engagement_score` between 65 and 81

`CreativeAttentionResultsPage` already reads from these paths (line
108 reads `data.creative_analysis`, line 194 destructures
`{ summary, frame_analyses }`). Only `3348d47b` (Balenciaga) has the
Pass 24 v2 schema (`schema_version: 'v2'` + `attention` + `channel_benchmarks`
+ `creative_effectiveness`); the other 4 are v1. Page handles both via
the `analysis.schema_version === 'v2'` conditional.

No field-path patches needed. Wiring CA page in commit 2 is sufficient
for all 5 listed missions.

## Status

- Commit 1: audit doc (this file) ✅
- Commit 2: ResultsRouter mounted at /results/:missionId ✅
- Commit 3 (spec): "wire CA + patch field paths" — wiring is in commit 2,
  no field-path patches needed (verified via DB query). Folding into
  this audit-doc update commit.
- Commit 4 (spec): brand_lift TODO marker — already inline in
  ResultsRouter.tsx from commit 2.

