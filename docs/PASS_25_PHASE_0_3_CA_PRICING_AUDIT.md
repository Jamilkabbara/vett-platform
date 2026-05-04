# Pass 25 Phase 0.3 — CA Pricing Audit

**Date:** 2026-05-04
**Branch:** `pass-25-phase-1-brand-lift-v2-and-routing`

## Symptom

Creative Attention setup currently charges $19 (image) or $39 (video) for
**1 respondent**. 1 respondent provides no statistical signal, and the
mission record stores `respondent_count: 1` (hardcoded) which makes
downstream aggregation meaningless. Confirmed broken in production:
- `3348d47b-…` Balenciaga — $19 / 1
- `5e1ea434-…` Nike — $19 / 1
- `25343ca8-…`, `a24d3776-…` jacquemus — $19 / 1
- `f64eabcb-…` Al Marai — $1.80 / 1 (older floor)

## Where pricing currently lives

Frontend:
- `src/utils/pricingEngine.ts` lines 46-51 — `CREATIVE_ATTENTION_TIERS`
  is a flat per-asset table (Image $19 / Video $39 / Bundle 5 $79 /
  Series 20 $249), NOT a respondent ladder.
- `src/pages/CreativeAttentionPage.tsx` lines 184-194 — `respondent_count: 1`
  hardcoded, tier picked from `mimeType` (image vs video).

Backend:
- `vettit-backend/src/utils/pricingEngine.js` lines 101+ — same flat
  per-asset structure. `case 'creative_attention'` branch at line 116.

Slider components for other mission types:
- `src/components/dashboard/MissionControlPricing.tsx` — owns the
  respondent slider for Validate / Brand Lift / Marketing. Uses
  `getPricingForGoalType()` to load the right tier table. Today the
  CA case returns `CREATIVE_ATTENTION_TIERS` (per-asset), so the slider
  doesn't render meaningfully.

## Plan

Replace the flat per-asset CA tier table with a respondent ladder that
mirrors the validate ladder. Floor is $19 / 10 respondents (10 is the
minimum for any directional signal). Per-respondent cost is higher
than General Research because CA runs frame-by-frame Claude Vision
analysis per respondent.

| Tier name | Respondents | Price | $/respondent |
|---|---|---|---|
| Sniff Test | 10 | $19 | $1.90 |
| Validate | 25 | $39 | $1.56 |
| Confidence | 50 | $69 | $1.38 |
| Deep Dive | 100 | $129 | $1.29 |
| Deep Dive XL | 250 | $299 | $1.20 |

## Why these numbers

Floor stays at $19 to match the existing CA brand promise. Per-respondent
cost ($1.20-$1.90) is in the same range as General Research ($1.20-$1.98)
because the AI cost scaling is roughly comparable: GR runs persona text
generation, CA runs frame-by-frame vision analysis. CA is slightly more
compute-intensive per respondent so the curve is shifted up by ~10%.

## Changes

1. `src/utils/pricingEngine.ts` — replace `CREATIVE_ATTENTION_TIERS`
   with respondent ladder.
2. `src/pages/CreativeAttentionPage.tsx` — drop the `respondent_count: 1`
   hardcode, render the slider, sync state.
3. `vettit-backend/src/utils/pricingEngine.js` — mirror the new tier
   table; keep the rest of the goal-type branching shape intact.
4. `vettit-backend/src/routes/missions.js` — add a `respondent_count >= 10`
   guard for `goal_type === 'creative_attention'`, return 400 with
   `{ error: 'min_respondents' }` on violation.

## Out of scope

- Refunding the 5 broken existing missions (Jamil's call).
- Reprocessing them with more respondents (separate ticket).
- Changing pricing of any other goal type.
