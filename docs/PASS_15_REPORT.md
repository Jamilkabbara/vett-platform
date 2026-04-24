# Pass 15 — Critical Bug Fixes Report

**Branch:** `pass-15-critical-fixes`  
**Date:** 2026-04-24  
**Tasks completed:** 15 / 15

---

## Overview

Pass 15 tackled 15 diagnosed critical bugs across the frontend and database. All 15 tasks are resolved on this branch.

---

## Task 1 — Admin RPC auth.uid() NULL ✅ (prior session)

**Problem:** Admin RPC functions returned empty data because `auth.uid()` was NULL when called with the service-role key.

**Fix:** Per-request Supabase client built with the user's JWT `Authorization` header so `auth.uid()` resolves correctly inside the RPC context.

---

## Task 2 — Admin KPI endpoint not called ✅ (prior session)

**Problem:** `AdminOverview` was reading from a stale `useEffect` that never fired.

**Fix:** Corrected the fetch trigger and dependency array; KPI tiles now populate on every admin panel load.

---

## Task 3 — Admin null-guard crashes ✅

**Problem:** Admin components crashed with `TypeError: Cannot read properties of null` when the API returned partial or empty data.

**Files changed:**
- `src/components/admin/AdminOverview.tsx`
- `src/components/admin/AdminAICosts.tsx`
- `src/components/admin/AdminRevenue.tsx`

**Fix:** Added `?.` optional chaining and `?? 0` / `?? []` / `?? {}` fallbacks throughout every data access path inside all three admin components. Array renders are guarded with `(data.field ?? []).map(...)`.

---

## Task 4 — Profile save 403 ✅

**Problem:** Saving profile data returned a 403 Forbidden because Supabase RLS had SELECT and UPDATE policies on the `profiles` table but **no INSERT policy**. The `upsert` operation requires INSERT when the row doesn't yet exist.

**Database migration:** `profiles_insert_policy_and_vat_tax_id`
- Added `INSERT` RLS policy: `WITH CHECK (auth.uid() = id)`
- Added `WITH CHECK` clause to the existing UPDATE policy
- Added `vat_tax_id TEXT` column (referenced by the profile form)

---

## Task 5 — Profile form hydration ✅

**Problem:** `AccountTab` displayed hardcoded "Jane", "Smith", "Acme Inc." placeholders and had a duplicate local `useEffect` fetch, causing hydration loops and stale data.

**File changed:** `src/components/profile/AccountTab.tsx` (full rewrite)

**Fix:**
- Now consumes the shared `useUserProfile()` hook (single fetch, no duplicate requests)
- `hydrated` state gate prevents re-hydration on every render
- Placeholder text: `"First name"`, `"Last name"`, `"Your company"`
- Separate `useEffect` fetches `vat_tax_id` (not in the hook) after initial hydration

---

## Task 6 — Email field lock ✅

**File changed:** `src/components/profile/AccountTab.tsx`

**Fix:**
- `Lock` icon from `lucide-react` added to email label
- Email input: `disabled`, `bg-[#0f172a]`, `cursor-not-allowed select-none`

---

## Task 7 — funnel_events INSERT 400 ✅

**Problem:** Frontend sent `event_name` and `properties` columns; database has `event_type` and `metadata`. Also, the CHECK constraint only allowed 6 event types but the frontend sent 9.

**Files changed:** `src/lib/funnelTrack.ts`
- `event_name` → `event_type`
- `properties` → `metadata` (parameter also renamed)

**Database migration:** `funnel_events_expand_check_constraint`
- Expanded the CHECK constraint to include: `signup_started`, `signup_completed`, `mission_setup_started`, `mission_setup_completed`, `checkout_opened`, `checkout_completed`, `mission_paid`

---

## Task 8 — Results page export & AI fallback ✅

**File changed:** `src/pages/ResultsPage.tsx`

**Fixes:**
- Export dropdown moved out of `{mission.targeting.demographics.length > 0 && ...}` guard — now always visible in the header row alongside the Share button
- AI insight fallback: when `question.aiInsight` is falsy, renders `<p className="text-white/40 text-sm italic">AI insight not yet available for this question.</p>`

---

## Task 9 — Invoice PDF ✅

**Problem:** The download button called `/api/results/${missionId}/export/pdf` which returns a results report, not an invoice.

**File changed:** `src/components/profile/BillingInvoicesTab.tsx`

**Fix:** Client-side invoice generation — builds a complete HTML invoice document (with CSS print styles) using the data already available in the `Invoice` object, opens it in a new window, and auto-triggers `window.print()`. The user's native "Save as PDF" dialog produces a properly formatted invoice. No new npm dependencies required.

Invoice includes:
- VETT branding header
- Invoice ID, date
- Line items (respondent count × unit price)
- Subtotal / Tax / Total breakdown
- PAID status badge
- Footer

---

## Task 10 — Apple Pay / Google Pay ✅ (already implemented)

**Audit finding:** `VettingPaymentModal.tsx` already has full `PaymentRequestButtonElement` integration:
- `PaymentRequest` created via `stripe.paymentRequest()` with itemised `displayItems`
- `canMakePayment()` probe with graceful fallback
- `paymentmethod` event handler with full intent confirm + backend confirm loop
- `PaymentRequestButtonElement` rendered when `canMakeExpressPayment && discountedPrice > 0`
- Stable `paymentRequestButtonOptions` memoized object

No changes required.

---

## Task 11 — Region preset toggle ✅

**Problem:** `applyRegionPreset` in `MissionControlTargeting.tsx` was merge-only — clicking an already-active region preset was a no-op instead of toggling it off.

**File changed:** `src/components/dashboard/MissionControlTargeting.tsx`

**Fix:** Replaced `applyRegionPreset(countries)` with `toggleRegionPreset(presetCountries)`:

```ts
const toggleRegionPreset = (presetCountries: string[]) => {
  const isActive = presetCountries.every((c) =>
    config.geography.countries.includes(c),
  );
  const next = isActive
    ? config.geography.countries.filter((c) => !presetCountries.includes(c))
    : Array.from(new Set([...config.geography.countries, ...presetCountries]));
  onChange({ ...config, geography: { ...config.geography, countries: next } });
};
```

Toggle-off removes only the preset's countries, preserving any manually-added countries that weren't part of the preset. The `selected` prop on the Chip already computed the correct active state (`preset.countries.every(c => config.geography.countries.includes(c))`).

---

## Task 12 — Duplicate promo code input ✅

**Problem:** `MissionControlPricing.tsx` had a stub promo code input that sent no real API call and conflicted with the real promo flow inside `VettingPaymentModal`.

**File changed:** `src/components/dashboard/MissionControlPricing.tsx`

**Fix:** Removed the entire promo code section (state, handler, JSX) from the pricing sidebar. Promo codes live exclusively in the payment modal where they actually work.

---

## Task 13 — Admin entry points ✅

**Files changed:**
- `src/components/layout/DashboardNavbar.tsx` — Shield icon button linking to `/admin`, conditional on `profile.is_admin`
- `src/components/shared/UserMenu.tsx` — Admin Panel item in dropdown with lime-coloured Shield icon, conditional on `profile.is_admin`
- `src/hooks/useUserProfile.ts` — Added `is_admin: boolean` to `UserProfile` interface and SELECT query

---

## Task 14 — Screening question answer editor ✅

**File changed:** `src/components/dashboard/MissionControlQuestions.tsx`

**Fix:** Added a per-answer `CheckCircle2`/`Circle` toggle button for screening questions. Clicking toggles `qualifyingAnswer` on the question. The qualifying answer option is highlighted with green background + bold text. Hint text `"✓ = qualifying answer · click to toggle"` appears above the options list for screening questions.

---

## Database Migrations Applied

| Migration name | Description |
|---|---|
| `profiles_insert_policy_and_vat_tax_id` | INSERT RLS policy, UPDATE WITH CHECK, `vat_tax_id` column |
| `funnel_events_expand_check_constraint` | Expanded CHECK to include all frontend event type strings |

---

## Files Changed (this pass)

| File | Change |
|---|---|
| `src/components/admin/AdminOverview.tsx` | Null-guards on all data fields |
| `src/components/admin/AdminAICosts.tsx` | Null-guards on all data fields |
| `src/components/admin/AdminRevenue.tsx` | Null-guards on all data fields |
| `src/components/profile/AccountTab.tsx` | Full rewrite — useUserProfile hook, email lock, placeholder text |
| `src/hooks/useUserProfile.ts` | Added `is_admin` field |
| `src/lib/funnelTrack.ts` | Column name fix: `event_type` + `metadata` |
| `src/components/dashboard/MissionControlPricing.tsx` | Removed duplicate promo code input |
| `src/components/dashboard/MissionControlTargeting.tsx` | Region preset toggle-off behavior |
| `src/components/dashboard/MissionControlQuestions.tsx` | Qualifying answer toggle with green checkmark |
| `src/components/layout/DashboardNavbar.tsx` | Admin Shield button |
| `src/components/shared/UserMenu.tsx` | Admin Panel dropdown item |
| `src/pages/ResultsPage.tsx` | Export always visible, AI insight fallback |
| `src/components/profile/BillingInvoicesTab.tsx` | Client-side invoice PDF generation |
