# Pass 21 — Decision Log

This file records the open architectural questions that came up during
Pass 21's forensic remediation and how each was resolved. The Pass 21
doctrine required STOP-AND-REPORT on architectural ambiguity, so each
of these had a deliberate user decision rather than an assumed default.

---

## Bug 3 — funnel `signups` count: 11, not 6

**The ambiguity.** The master prompt for Pass 21 stipulated `signups`
should reconcile to **6**, derived from a count of `profiles` rows
created in the 30-day window. The forensic check ran against
`auth.users` directly and returned **11**.

**Why the discrepancy.** Five users had auth records but no profile
row. The `handle_new_user` trigger that backfills `profiles` from
`auth.users` had been silently failing for those rows (Pass 21 Bug 10
hardened the trigger and backfilled the missing rows so this can no
longer happen).

**Decision.** Keep the truth at **11**. `auth.users` is the source of
identity; profile rows are a denormalised projection. A funnel that
hides users who exist in auth but not in profiles understates real
signup volume.

**Implementation.** `admin_funnel.signups` now reads from
`auth.users.created_at` directly. The backfilled profiles trigger
ensures the projection stays consistent going forward.

---

## Bug 4 — Path 2 `setup_started`: derived from `missions`, not `funnel_events`

**The ambiguity.** Two candidate definitions for "setup started":

  - **Path 1 (event-derived):** `COUNT(*) FROM funnel_events WHERE
    event_type = 'mission_setup_started'` — what the frontend emits
    when a user opens the mission setup wizard.
  - **Path 2 (state-derived):** `COUNT(*) FROM missions WHERE
    created_at >= range_start` — every row in `missions` implies
    a setup was started.

Frontend telemetry was emitting the event for only ~8% of real
setups (forensically measured: 2 events vs 25 mission rows). The
funnel needed to be monotonic — `setup_started >= payment_reached
>= paid >= completed` — but Path 1 had `setup_started < paid`
because of the missing telemetry.

**Decision.** Use Path 2 — derive from `missions`. **Truth = 25,
not 2.** Mission rows are an authoritative side-effect of the
setup flow; the missing telemetry is a separate frontend bug to
chase down (see PASS_21_REPORT.md → Pass 22 followups).

**Implementation.** `admin_funnel.setup_started` now selects from
`missions` instead of `funnel_events`. Comment in the migration
and the route flags the rationale so a future contributor doesn't
"fix" this back to the event-based count.

---

## Bug 6 — Option B (qualification labelling)

**The ambiguity.** When a screening question has multiple qualifying
answers (e.g. a brand-awareness question where "Heard of it" and
"Use it regularly" both qualify), how should the qualified-respondent
count be labelled in results?

  - **Option A (single answer):** label by the primary
    `qualifyingAnswer` only — clean but lossy.
  - **Option B (full set):** label by every answer in
    `qualifying_answers[]` — verbose but lossless.

**Decision.** **Option B.** The pricing engine and the targeting
brief both already key off the full qualifying set, and operators
need to see exactly what counted as "in".

**Implementation.** Results UI joins the labels with " or " when
multiple are qualifying ("Heard of it or Use it regularly").

---

## Bug 16 — Default respondent count: 50, not 100/200

**The ambiguity.** The pricing page advertises "$35 entry tier =
50 respondents" but every default in the codebase was either 100
or 200:

  - `MissionSetupPage.tsx`: `respondent_count: aiResult?.suggested ?? 100`
  - `DashboardPage.tsx`: `useState<number>(100)` and `?? 100`
  - `routes/missions.js`: `respondentCount || 100`
  - `routes/pricing.js`: both branches `|| 100`
  - `claudeAI.js` SURVEY_GEN_SYSTEM: `"suggestedRespondentCount": 200`
  - `claudeAI.js` TARGETING_SUGGEST_SYSTEM: same

A first-time user who didn't change the slider was being charged
$135+ on what we marketed as a $35 tier.

**Decision.** **50 everywhere.** The AI prompts now explicitly
escalate to 100-200 only when the brief calls for multi-segment
or multi-country statistical comparison; for typical
single-market validation, 50 is correct.

---

## Bug 23 — Funnel unit-mixing: Path A (relabel + drop overall %)

**The ambiguity.** The /admin funnel showed
`Signups 3 → Paid 6 → Completed 6 → 200% conversion`. Two paths
to fix:

  - **Path A (relabel):** Add unit suffixes to every stage,
    show stage-to-stage conversion only between same-unit stages,
    drop the misleading overall conversion.
  - **Path B (re-key):** Re-key all funnel stages to a single unit
    (e.g. count distinct user_ids on every stage) so stage-to-stage
    conversion is always defined.

**Decision.** **Path A.** Path B would require expensive subqueries
on `mission_responses` and lose the most useful number on the page
— how many missions actually completed.

**Implementation.** Five stages: Signups (users) → Mission attempts
(missions) → Reached payment (missions) → Paid (missions) →
Completed (missions). Conversion shown only between same-unit
adjacencies. Cross-unit transition rendered as an explicit "unit
changes: users → missions" marker. Overall conversion footer
removed entirely.

---
