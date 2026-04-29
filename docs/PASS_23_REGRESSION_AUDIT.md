# Pass 23 Regression Audit + Shipped-Verification Doctrine

**Triggered:** 2026-04-29 production audit by Jamil
**Severity:** five regressions found; three previously declared "shipped" hadn't actually fixed the user-facing symptom.

This document codifies the doctrine that prevents the failure mode and audits each regression.

---

## The new doctrine — `shipped` defined

A bug is `shipped` only when **all** of these hold:

1. **Code change pushed to `main` and the corresponding deploy succeeded.**
   - For `vett-platform`: Vercel build green, new bundle hash visible on production.
   - For `vettit-backend`: Railway deploy green, latest commit reflected in `/health` or a route-level probe.
2. **End-to-end user journey reproduced** that exercises the original failure path. Not a unit test, not a bundle grep, not "the PR diff looks right".
3. **The exact user-facing symptom that motivated the bug is gone**, verified on production by walking the user flow.
4. **Screenshot, recording, or `funnel_events` trace attached to the bug ledger as proof.**
   - Visual: screenshot/screen-recording showing the symptom is absent and the happy path lands.
   - Telemetry: a SQL query against `funnel_events` / `payment_errors` / `notifications` showing the success path emit pattern.
5. **Regression of a previously-shipped bug is escalated** to higher severity than the original. Three regressions in one batch (this audit) is the trigger event for codifying this doctrine.

If a bug doesn't meet all 5, the ledger keeps it `in-flight` (or `partial-fix`) until they do. Code-only progress is not shipped.

---

## The five regressions audited

### Bug 23.61 — Creative Attention pricing engine disconnect

**Symptom:** mission `a24d3776` (today, 2026-04-29 05:56 UTC) was charged **$1.80** for a Creative Attention image analysis that should have been **$19**. Same with mission `f64eabcb` yesterday. Two completed CA missions, both at Sniff Test rate × 1 respondent, instead of the Image tier flat $19.

**Why it was declared shipped (Bug 23.51):** because `CREATIVE_ATTENTION_TIERS` was added to `pricingEngine.js` and the **landing page tabbed pricing display** rendered the new tiers correctly. The display was right; the **charge** was wrong.

**What broke through:**
- The `arguments[0]?.goalType` hack in `calculateMissionPrice` was a *latent* dependency on every caller knowing to pass `goalType`. The shipper (me) only audited the `payments.js` route at a glance and missed that the call site (line 89 in the route) was using the named-args object form WITHOUT passing `goalType` or `mediaType`.
- No end-to-end user-journey test was performed before declaring shipped. A real Stripe Checkout test mission would have surfaced the $1.80 vs $19 immediately.

**Real fix shipped (this batch, backend `5b53efd`, frontend `0a69e16`):**
- `calculateMissionPrice` switched from `arguments[0]?` hack to proper destructured `goalType` + `mediaType` named params (defaults preserved).
- `validateMissionPricing` helper added; route layer fail-closes the request when `creative_attention` is missing `media_type` or `brand_lift` is below 50 respondents.
- `payments.js::create-checkout-session` now passes `goalType: mission.goal_type` and `mediaType: mission.media_type` to the engine + stamps `tier` + `media_type` on the mission UPDATE.
- `CreativeAttentionPage` INSERT now includes `tier` (`image` or `video`) and `media_type`, derived from the uploaded asset's MIME.
- Retroactive migration `pass_23_b61_creative_attention_retroactive_tier` stamped `tier='image'` + `media_type='image'` on the two historical missions for audit-trail accuracy. Per spec, the $1.80 charges are left as-is (no charge correction).

**End-to-end verification still required:** Jamil runs a fresh Creative Attention mission. Confirm:
- Stripe Checkout shows $19 (or $39 for video), not $1.80.
- New `missions` row has `tier='image'` (or `'video'`) AND `media_type` matching.
- The fail-closed validator rejects an artificially-bad payload (e.g. `goal_type=creative_attention` with no `media_type`) with 400.

### Bug 23.64 — post-payment redirect (third regression)

**Symptom:** user paid for mission `a24d3776`, expected to land on `/creative-results/a24d3776`, ended up on `/setup`. Reported repeatedly across Bug 23.0f → 23.52 → 23.64 cycles.

**Why three speculative fixes failed:**
- Bug 23.0f bumped polling 30s → 60s. Fine, but didn't fix the symptom.
- Bug 23.52 added anon polling + signed-out branch + 90s + **5 diagnostic funnel_events emits** to trace the actual exit path.
- The diagnostic emits never arrived in `funnel_events`. Three speculative iterations because the data we needed to confirm vs. misdiagnose was being silently sinkholed.

**Root cause (found this batch via diagnostic-first method):**
- `vettit-backend/src/routes/funnel.js::ALLOWED_EVENT_TYPES` set was last updated in Pass 22 Bug 22.1.
- Six event types added in Pass 23 (`checkout_canceled`, `payment_success_page_loaded`, `_poll_attempt`, `_redirect`, `_session_expired`, `_timeout`) were never added to the allowlist.
- Every emit returned HTTP 202 with `{accepted:false, reason:'unknown_event_type'}`. Frontend `trackFunnel` never sees the rejection (silent UX).
- ~7 days of `checkout_canceled` emits silently dropped. All 5 Bug 23.52 diagnostic emits dropped.

**Real fix shipped (backend `1d37e82`):**
- `ALLOWED_EVENT_TYPES` extended with the 6 missing event types.
- Smoke probe verified live: `POST /api/funnel/track` with `event_type=checkout_canceled` no longer returns `unknown_event_type` (now passes through to the DB layer).

**End-to-end verification still required:** Jamil runs a fresh Stripe Checkout test mission. Confirm:
- All 5 `payment_success_*` emits land in `funnel_events` (SQL query attached below).
- The redirect destination matches `goal_type` (CA → `/creative-results/:id`, others → `/dashboard/:id`).
- If the destination is still wrong despite the diagnostic trace being clean, the targeted fix from real telemetry can be applied — no more guessing.

```sql
-- Verification query for Bug 23.64 — pull every payment_success_* emit
-- from a recent test mission so we can see the exact path:
SELECT created_at, event_type, mission_id, metadata
FROM funnel_events
WHERE event_type LIKE 'payment_success%'
  AND created_at > now() - INTERVAL '1 hour'
ORDER BY created_at;
```

### Bug 23.63 — goal_type preservation through auth (regression of Bug 23.54)

**Symptom:** user clicks "Try Brand Lift" on landing → unauth → signs up → lands on `/setup` with goal **unselected** (defaults to `validate`).

**Why it was declared shipped (Bug 23.54):** `goWithGoal(goalId)` helper was added to `LandingPage`. `MissionSetupPage`'s init effect was extended to read `?goal=` URL param + `sessionStorage`. Both files compiled clean.

**What broke through:**
- The helper was added but **never bound to any actual CTA**. The line `void goWithGoal;` was added explicitly to suppress the unused-variable lint with the comment "wired through ... landing-side adoption ships in a follow-up" — that follow-up never landed.
- Every CTA (the 12 RESEARCH_TYPES goal cards, the PricingTabbed tier-tab buttons) called `goVettIt` which routes to plain `/setup` with no goal preservation.

**Real fix shipped (frontend `0a69e16`):**
- `RESEARCH_TYPES` array extended with `goalId` field on every entry (matching the canonical `mission_goals` ids).
- Card `onClick` rebound from `goVettIt` to `() => goWithGoal(rt.goalId)`.
- `PricingTabbed` extended with goal-keyed CTA below the tier grid: "Start a Validate mission" / "Start a Brand Lift study" / "Start a Creative Attention analysis", all calling `goWithGoal(active.id)`.
- `goWithGoal` extended to handle Creative Attention specially — routes to `/creative-attention/new` (with sign-in wrap if unauth) instead of `/setup?goal=creative_attention` (which would now be rejected by Bug 23.61 fail-closed validation due to missing `media_type`).
- `void goWithGoal;` line removed (the helper is now actually wired).

**End-to-end verification still required:** Jamil tests all three goal CTA paths in incognito:
1. Click "Try Validate" tier card → expect `/signin?redirect=%2Fsetup%3Fgoal%3Dvalidate` → after sign-up, `MissionSetupPage` opens with `validate` pre-selected.
2. Click "Try Brand Lift" → same shape with `goal=brand_lift`.
3. Click "Try Creative Attention" or the dedicated tab CTA → routes to `/signin?redirect=%2Fcreative-attention%2Fnew` → after sign-up, lands on the dedicated upload flow.

### Bug 23.18 — exports never got real fixes (regression as audit-only)

**Symptom:** PDF/PPTX/CSV exports broken — blank pages, fonts not embedded, sentence overlap.

**Why it was declared shipped:** Pass 22 Bug 22.21 audit doc was written. No code changes shipped.

**What broke through:** "doc is shipped" treated as equivalent to "fix is shipped". Audit-only batches need explicit `audit-doc` status separate from `shipped`. An audit doc that surfaces real broken UX is `audit-complete`, not `shipped`.

**Real fix queued in this batch (Bug 23.62 — pending):** PDF `splitTextToSize`, font embedding, page-break math; PPTX one-slide-per-question + chart-as-image; CSV UTF-8 BOM + RFC-4180 escape. Code work pending.

### Bug 23.55 — Creative Attention flow simplification (reopen)

**Symptom:** still 3-step flow with intermediate AI clarify + survey-question generation that don't apply to Creative Attention (no respondents to survey).

**Why it was declared shipped:** I read the code, saw `/creative-attention/new` was a single-page form, and concluded the spec was based on a misobservation. **Wrong**: there's a separate path through `/setup` → AI clarify → AI survey-gen → eventually redirected to `/creative-attention/new` (added in Bug 23.GOAL) that retains the 3 intermediate steps for goal_type='creative_attention'.

**What broke through:** I verified the destination page but not the journey through it. New doctrine #2 catches this: "end-to-end user journey reproduced".

**Real fix queued in this batch (Bug 23.65 — pending):** intercept `creative_attention` goal selection BEFORE survey-gen; redirect to `/creative-attention/new` immediately on goal change; have `runMission.js` skip the question-gen/persona phases for CA missions.

---

## Process changes adopted in this batch

1. **Pre-merge end-to-end verification mandatory** for any bug whose symptom is user-facing.
2. **Audit-doc bugs get explicit `audit-complete` status**, not `shipped`. The bug stays in-flight until code or process changes resolve the user-facing symptom.
3. **Frontend FunnelEvent union and backend ALLOWED_EVENT_TYPES set must stay in sync.** Future event additions land in BOTH; mid-term consider extracting into a shared schema package. Caught Bug 23.64 the hard way.
4. **Diagnostic-first when speculative fixes fail.** Bug 23.0f → 23.52 burned three iterations on speculation. Bug 23.64 fixed in one iteration by pulling `funnel_events` first. Diagnostic data trumps theory.
5. **Lint-suppressing comments (`void X;`, `// eslint-disable`) are an immediate code-review flag.** The Bug 23.63 regression was hidden behind a `void goWithGoal;` line the original PR explicitly added with a "wired in a follow-up" comment that became permanent.

---

## Acknowledgement

Three regressions in one production audit is not a typical batch — it's a process failure. The doctrine + process changes above are the response. Going forward every Pass-23-or-later bug carries the 5-criterion verification before it gets `shipped` in `PASS_23_PROGRESS.md`.

The Tier-1 Phase B work (`/vs/surveymonkey`, `B4` directory, `B10` Product Hunt) is voice-tone-pending for Jamil and is correctly listed `awaiting-review`, not `shipped`. That category is fine.
