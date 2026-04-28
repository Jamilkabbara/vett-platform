# Pass 23 Bug 23.GOAL — Brand Lift + Creative Attention end-to-end audit

**Audit date:** 2026-04-28
**Author:** Pass 23 audit
**Scope:** Verify Brand Lift + Creative Attention goal types are wired end-to-end
through Mission Setup → payment → runMission → results.

---

## TL;DR

| Goal | Status | Issue | Fix |
|---|---|---|---|
| **Creative Attention** | Pipeline works end-to-end if the user goes through `/creative-attention/new`. The standard MissionSetupPage allows the goal but offers no upload UI, producing orphan drafts that would crash `runMission` at payment time. | Orphan-draft UX gap | **Shipped this PR**: MissionSetupPage redirects to `/creative-attention/new` when this goal is picked. |
| **Brand Lift** | Pipeline runs the standard persona simulation (no special analyzer). The label suggests pre/post measurement, but the product only delivers a single point-in-time survey. | Label/expectation mismatch — not a code bug. | **Documented here**. Needs product/marketing decision: rename to "Brand Awareness Survey" OR build pre/post comparison capability. |

Production forensic (DB query, 2026-04-28):

| Goal type | Total | Completed | Drafts | Failed |
|---|---:|---:|---:|---:|
| validate | 19 | 7 | 7 | 0 |
| brand_lift | 3 | **0** | 3 | 0 |
| creative_attention | 2 | **0** | 2 | 0 |
| marketing | 2 | 1 | 1 | 0 |
| naming_messaging | 1 | 0 | 1 | 0 |

Zero `brand_lift` or `creative_attention` missions have completed in production —
not because of pipeline failures (no `failed` rows) but because users are abandoning
mid-setup. All 5 stuck drafts have `brand_name=NULL` and `brief_attachment=NULL`,
two of the brand_lift titles are keyboard-mash testing (`njkbkjbjkbjkbjkbkbjbjhbjhbjhbmlkm`)
suggesting Jamil exploring the UX rather than real users.

---

## Creative Attention — verified flow

### What's wired

**Frontend**
- `src/pages/CreativeAttentionPage.tsx` (`/creative-attention/new`) — dedicated 3-step flow:
  upload → brand context form → Stripe Checkout redirect.
- `src/data/missionGoals.ts` — `creative_attention` registered in `MISSION_GOALS` and
  `GOALS_WITH_UPLOAD`.
- `src/pages/PaymentSuccessPage.tsx` — recognises `goal_type='creative_attention'`
  and routes to `/creative-results/:missionId` after Stripe webhook lands
  (added in Bug 23.0e v2).

**Backend**
- `src/jobs/runMission.js` short-circuits to `analyzeCreative({mission})` when
  `mission.goal_type === 'creative_attention'`.
- `src/services/ai/creativeAttention.js` — full vision pipeline:
  - Downloads `brief_attachment.path` from `vett-creatives` Supabase Storage bucket.
  - Extracts up to 30 frames (1s interval) for video, single frame for image.
  - Each frame analysed via Claude vision (`analyzeFrame`).
  - Synthesised into a creative-attention summary report.
  - Persisted to mission row + insights.

### What's broken (fixed this PR)

**MissionSetupPage allows picking Creative Attention without enforcing the upload.**

- The standard setup page lists Creative Attention in the goal selector.
- Clicking "Generate Survey" with that goal selected would create a draft mission
  with `goal_type='creative_attention'` but `brief_attachment=NULL`.
- At Stripe payment time → webhook → runMission → `analyzeCreative` would throw
  `Error: No creative file attached to this mission`, marking the mission `failed`.
- We never see `failed` in production for this goal because users abandon at draft
  before paying. Two such orphans exist as of audit date.

**Fix in this PR**: when `missionGoal === 'creative_attention'` on `handleSubmit`,
MissionSetupPage redirects to `/creative-attention/new` instead of inserting the
draft. Users get the right setup flow and runMission only ever sees a complete row.

### Open product question

Should `creative_attention` be removed from the MissionSetupPage goal selector
entirely? Today the `<GoalSelector>` includes it for discoverability ("oh, VETT can
do this!") and the redirect added here recovers the funnel. A more aggressive
choice would be to gate it behind a separate landing CTA. Defer to product call.

---

## Brand Lift — pipeline runs, but label is misleading

### What's wired

- `src/data/missionGoals.ts` — `brand_lift` registered with label "Brand Lift Study",
  description "Measure awareness, recall, sentiment & purchase intent before and
  after campaigns".
- `src/services/aiService.ts:586` — switch case for `brand_lift` in goal-specific
  prompt construction.
- `src/services/ai/insights.js:213` (backend) — listed in the `goal` enum literal
  inside the synthesise-insights prompt, so the LLM knows it's a valid goal type.

### What's NOT wired

- **No dedicated backend analyzer** (unlike `creativeAttention`). `brand_lift`
  flows through the standard `generatePersonas → simulateAllResponses →
  synthesizeInsights` path — same as `validate`, `naming_messaging`, etc.
- **No pre/post comparison logic.** A real brand-lift study compares two
  measurements (pre-campaign baseline vs post-campaign). The product delivers
  a single point-in-time survey. Re-running the same mission ID isn't supported;
  re-running as a new mission means two unconnected datasets the user must
  reconcile manually.
- **No campaign-asset enforcement.** `missionGoals.ts` says brand_lift "optionally"
  takes a campaign reference (storyboard, hero image, draft video) via
  `GOALS_WITH_UPLOAD`. Asset is never required and `brief_attachment` is not
  consumed by any backend code path for this goal.

### Recommendation

This is a label/expectation mismatch, not a code bug. Two options for product:

1. **Rename to "Brand Awareness Survey"** to set proper expectations. Cheap, no
   engineering work. Users get exactly what they're paying for: a single-point
   awareness/recall/sentiment/intent measurement that can be manually re-run later.
2. **Build true pre/post lift measurement.** Bigger lift (pun intended): a
   "campaign window" entity that links two missions, a baseline screen, a
   delta visualisation on the results page, and prompt engineering that
   anchors questions identically across both runs. Material engineering work.

Defer to product call. No code changes shipped for Brand Lift in this PR.

---

## Verification commands

```sql
-- Re-run after the next paid mission to confirm completion
SELECT goal_type, status, COUNT(*) AS n
FROM missions
WHERE goal_type IN ('brand_lift', 'creative_attention')
GROUP BY goal_type, status
ORDER BY goal_type, status;
```

After this PR ships, expect: future creative_attention missions land at
`/creative-attention/new` instead of producing draft orphans. Watch for
the first creative_attention mission to flip to `status='completed'` —
that's the smoke proof the dedicated pipeline runs end-to-end.

---

## Out of scope for this audit

- Marketing goal (1 completed in prod — pipeline works).
- Naming/messaging, churn research, validate, etc. — standard pipeline,
  not part of this audit's scope.
- Mobile UX of Creative Attention upload — separate concern.
