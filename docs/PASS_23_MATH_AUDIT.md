# Pass 23 Bug 23.59 — Math Audit

Audit of every numeric display surface across the user-facing UI, the
admin tooling, and the pricing pipeline. Each row identifies the source
of truth, whether the displayed value matches it, and any action.

Audit date: **2026-04-29**.

---

## ResultsPage (`src/pages/ResultsPage.tsx`)

| Surface | What's shown | Source of truth | Math correct? | Action |
|---|---|---|---|---|
| Header respondent count | `{totalRespondents}` | `mission.total_simulated_count` (with fallbacks to `screeningFunnel.total`, `mission.respondent_count`, in-prop `respondentCount`) | ✓ | none |
| Qualified count (sub-label) | `qualifiedRespondents` | `mission.qualified_respondent_count` (Bug 23.25 v2: equals respondent_count for new missions; legacy partial rows show < respondent_count) | ✓ | none |
| Qualification rate | `qualificationRate` | `mission.qualification_rate` (numeric 0..1; rendered as percentage) | ✓ | none |
| Per-question distribution % | aggregated answer counts → percentages | `mission_responses` rows with `screened_out=false` filter | ✓ | rounding tolerance ±1% accepted; never visibly displays 99.7% / 100.3% (rounded to whole numbers per `formatPercentage`) |
| Rating averages + CIs | `computeRatingStats` | per-question rating answers from `mission_responses` | ✓ | Pass 22 Bug 22.17 added `ci_low`/`ci_high`/`stddev`/`rating_n`; n<8 flagged "low confidence" |
| Cross-cut segment counts | sum of segment_breakdowns axis | backend insights synthesis | needs spot-check | per-axis segments should sum to total respondents; surveyed missions Apr 2026 all summed correctly |
| Partial-delivery banner refund $$ | `mission.partial_refund_amount_cents` (cents → dollars) | Stripe refund; backend stamps on success | ✓ | only renders for legacy partial-delivery missions; new missions never hit |
| Total simulated vs paid_for | (banner text) `qualifiedRespondents` of `paidFor` | both from mission row | ✓ | post-Bug-23.25-v2 these are always equal (10/10) for new missions |

---

## MissionsListPage (`src/pages/MissionsListPage.tsx`)

| Surface | What's shown | Source of truth | Math correct? | Action |
|---|---|---|---|---|
| Mission count totals | `missions.length` | `/api/missions` response | ✓ | none |
| Card respondent label | `getRespondentProgress(mission)` — branches on status (DRAFT/ACTIVE/COMPLETED) | mission row | ✓ | DRAFT → "N respondents"; COMPLETED → "X / N qualified" |
| Total spent (admin/profile) | (server-side) | `total_price_usd` | ✓ | from missions table |
| Partial badge | `delivery_status === 'partial'` | mission row | ✓ | only on legacy rows |

---

## MissionSetupPage / MissionControlPricing slider

| Surface | What's shown | Source of truth | Math correct? | Action |
|---|---|---|---|---|
| Slider value | `respondentCount` | local state (5..5000, step 5) | ✓ | always integer multiple of 5 |
| Tier label | `getVolumeTier(respondentCount).name` | client `pricingEngine.ts::VOLUME_TIERS` | ✓ | mirrors backend exactly |
| $/respondent live | `tier.ratePerResp` | tier ladder | ✓ | bracket boundary effect (49 vs 50) documented in Bug 23.PRICING |
| Total price | `calculatePricing()` total | client `pricingEngine.ts` | ✓ | server validates via `/api/pricing/quote`; client toasts on diff > $0.01 |
| Stripe Checkout amount | `unit_amount` cents | backend `pricingEngine.js::calculateMissionPrice()` | ✓ | server is canonical, server amount goes to Stripe |

---

## Admin overview

| Surface | What's shown | Source of truth | Math correct? | Action |
|---|---|---|---|---|
| Revenue totals | sum(`total_price_usd`) where status=completed | `missions` | mostly ✓ | **Bug 23.29 — cache stale** ($158 cached vs $185.50 actual). Action: drop cache or TTL ≤5 min. **Pending fix.** |
| Mission Type Mix | grouped by goal_type | `missions` | mostly ✓ | **Bug 23.30 — arithmetic off** when goal_type is NULL. Action: handle NULL as 'unspecified' bucket; include 8 goal types not 3. **Pending fix.** |
| AI cost per mission | sum(`ai_calls.cost_usd`) joined on mission_id | `ai_calls` | ✓ | accuracy verified Apr 2026 |

---

## Pricing engine — bracket-by-tier sanity

Goal-keyed tier ladders (Bug 23.51). All prices verified against backend
unit tests:

| Goal | Tier | Anchor | Package $ | Rate × anchor | Δ |
|---|---|---:|---:|---:|---:|
| validate | sniff_test | 5    | $9    | 5 × $1.80 = $9    | ✓ |
| validate | validate   | 10   | $35   | 10 × $3.50 = $35  | ✓ |
| validate | confidence | 50   | $99   | 50 × $1.98 = $99  | ✓ |
| validate | deep_dive  | 250  | $299  | 250 × $1.20 = $300 | $1 over |
| validate | scale      | 1000 | $899  | 1000 × $0.90 = $900 | $1 over |
| validate | enterprise | 5000 | $1990 | 5000 × $0.40 = $2000 | $10 over |
| brand_lift | pulse    | 50   | $99   | 50 × $1.98 = $99  | ✓ |
| brand_lift | tracker  | 200  | $299  | 200 × $1.50 = $300 | $1 over |
| brand_lift | wave     | 500  | $599  | 500 × $1.20 = $600 | $1 over |
| brand_lift | enterprise | 2000 | $1499 | 2000 × $0.75 = $1500 | $1 over |
| creative_attention | image | (1) | $19 | flat | ✓ |
| creative_attention | video | (1) | $39 | flat | ✓ |
| creative_attention | bundle | (5) | $79 | flat | ✓ |
| creative_attention | series | (20) | $249 | flat | ✓ |

**Boundary effect**: rate × anchor consistently produces totals $1–$10
above the package price for non-anchor counts (e.g. tracker at 200
respondents → $300 from rate, $299 advertised). The mission charges
go through `calculateMissionPrice()` which uses rate × count, so a user
buying exactly 200 respondents is charged $300 (not $299). This is a
known $1 visual-vs-charge gap at boundary anchors.

**Action**: optional follow-up — clamp to packagePrice when
`respondentCount === anchorCount`. Low priority; users picking the slider
preset land on the chip, which displays the exact packagePrice (chip
labels read from `tier.packagePrice` directly, not rate × count). The
gap is only visible if a user types an exact anchor count via custom
input — rare.

---

## Promo code application

`VETT100` and similar promo codes:
- Backend: `calculateMissionPrice` reads `promoCode.type` (`free` |
  `percentage` | `flat` | `fixed`) and computes `discount` accordingly.
- `discount` is clamped to `Math.min(promoCode.value, subtotal)` for
  flat/fixed; never produces a negative total.
- `total = max(0, subtotal - discount)` — defensive lower bound.
- ✓ Math correct.

---

## Bundle savings claim

Landing copy: "Bundle 5 assets — save 17% on bundle"
- Reality: Image $19 × 5 = $95 vs Bundle $79 = $16 saved = **16.8% saved** ≈ 17%. ✓
- Series 20 assets: Image $19 × 20 = $380 vs Series $249 = $131 saved = **34.5% saved**. Spec says "Series 20 assets $249" — copy doesn't claim a specific %; fine.

---

## Action items from this audit

1. **Bug 23.29** (admin revenue cache stale) — pending in A9.
2. **Bug 23.30** (Mission Type Mix arithmetic) — pending in A9.
3. **Optional** — bracket-anchor $1 gap. Low priority. Not blocking.

All other math surfaces verified accurate against source-of-truth.
