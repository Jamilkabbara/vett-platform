# Pricing Spec — single source of truth

All numbers flow through **`src/utils/pricingEngine.ts#calculatePricing()`**.
Frontend display, payment modal, and eventual server-side validation all
MUST agree. If they disagree, pricingEngine is right; fix the caller.

This document is generated from the live pricingEngine — update both in
the same commit when the rates change.

---

## Inputs

```ts
calculatePricing(
  respondentCount: number,       // ≥ MIN_RESPONDENTS (10); UI step 10
  questions: Question[],         // total count — first 5 are free
  targeting: TargetingConfig,    // geography + demographics + ...
  isScreeningActive = false,     // Q1 screening per Phase 6
): PricingBreakdown
```

`PricingBreakdown` shape:

```ts
{
  base: number;               // respondents × tier rate, rounded
  questionSurcharge: number;  // extra questions × flat fee
  targetingSurcharge: number; // paid filters × respondents, rounded
  screeningSurcharge: number; // screening fee × respondents, rounded
  retargetingSurcharge: number; // pixel × respondents, rounded
  total: number;              // sum, rounded
  filterCount: number;        // count of paid filters (for UI chips)
}
```

---

## Tiered per-respondent base rate

Driven by the **highest-priced country** in `targeting.geography.countries`.
If no country is selected we default to tier 3 pricing.

| Tier | Countries | Per-respondent |
|------|-----------|----------------|
| 1    | Premium (US, CA, GB, DE, FR, …)                       | **$3.50** |
| 2    | Emerging OECD / Gulf                                  | **$2.75** |
| 3    | Default (rest of world)                               | **$1.90** |

Base = `respondents × tier_rate`.

## Question surcharge

```
additional = max(0, questions.length - 5)
questionSurcharge = additional × $20  (flat per extra question)
```

Q1 screening is counted in `questions.length`; the spec doesn't special-case it.

## Targeting surcharges

Per-respondent filter cost, then multiplied by respondents.

| Section          | Per-filter | Per-category cap |
|------------------|------------|------------------|
| Professional B2B (industries + roles + company sizes) | $0.50 | **$1.50** |
| Technographics (devices − "No Preference" + behaviors) | $0.50 | **$1.00** |
| Financial (income ranges) | $0.50 | **$1.00** |
| Cities (any count)         | flat   | **$1.00** |

Demographics are always **free** (ageRanges, genders, education, marital,
parental, employment).

## Screening

```
screeningSurcharge = isScreeningActive ? respondents × $0.50 : 0
```

Phase 6 makes Q1 always the screener when a question list exists, so this
flag is effectively `questions.length > 0 && questions[0].isScreening === true`.

## Retargeting (pixel)

```
retargetingSurcharge = hasPixel ? respondents × $1.50 : 0
```

`hasPixel = !!targeting.retargeting?.pixelId?.trim()`.

## Grand total

```
total = base
      + questionSurcharge
      + targetingSurcharge
      + screeningSurcharge
      + retargetingSurcharge
```

All components are `Math.round()`-ed on the way out so the displayed total
equals the sum of displayed components — no penny drift between the UI
and the payment modal.

---

## Invariants

1. **Display total ≡ Modal total ≡ Server quote**. `VettingPaymentModal`
   receives `totalCost` from the same `calculatePricing()` call that
   feeds the sticky footer — never a separate math path.
2. **Single call site** — every place that needs pricing imports
   `calculatePricing` from `src/utils/pricingEngine.ts`. No inline math.
3. **Filter count drives the chip** in the sticky footer; it's the sum
   of paid filters plus a 1-or-0 flag for cities.
4. **Rounding is output-only** — `basePerRespondent`, `perRespondentFilterCost`
   etc. stay as floats internally so multiple calls sum identically.

---

## Server-quote validation (Phase 11 — frontend ready)

The frontend is wired to *optionally* accept a server-side quote before
charging. Contract:

```
POST /api/pricing/quote
  body: { respondentCount, questions, targeting, isScreeningActive }
  200 : PricingBreakdown
```

Validation rule: if the server `total` diverges from the client `total`
by more than **$0.02** we log a warning and **use the server total** so
Stripe gets the authoritative number. Within $0.02 is considered rounding
drift and the UI value is kept so the user doesn't see the number tick
by a penny between click and charge.

See `verifyServerQuote()` in `src/utils/pricingEngine.ts` (Phase 11).

When the backend endpoint is absent, the frontend silently falls back
to the client-side quote — same UX as today.
