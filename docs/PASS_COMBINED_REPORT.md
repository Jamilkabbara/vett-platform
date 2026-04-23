# VETT Pass Combined — Post-Launch Fixes Report

**Branch:** `pass-combined-pricing-and-post-launch`
**Date:** 2026-04-22
**Status:** ✅ All 6 parts complete

---

## Part 1 — Pricing Formula Fix (Backend)

**Problem:** UI showed $35 for a UAE 10-respondent mission; Stripe charged $9.  
Two completely different formula architectures: frontend used country-tier rates ($3.50/resp for Tier 1), backend used volume-based tiers ($0.90/resp ≤200 respondents).

**Fix:** Rewrote `/Users/jamilkabbara/vettit-backend/src/utils/pricingEngine.js` from scratch with the country-tier formula mirroring the frontend exactly.

- **Tier 1** (AE, US, GB, AU, …) → $3.50/respondent  
- **Tier 2** (SA, IN, BR, …) → $2.75/respondent  
- **Tier 3** (frontier/unknown) → $1.90/respondent  
- Extra questions: $20 each beyond the 5th  
- Per-respondent targeting surcharges (city $1.00, professional B2B up to $1.50, etc.)  
- Promo codes applied at subtotal level  

**Regression tests:** 34 tests in `test/pricing.test.js` — all pass.  
**Specific regression:** mission `7f54fb42` (UAE, 10 resp, 5 q, null targeting) → $35.00 / 3500 cents ✓

**Updated call sites:** `payments.js`, `pricing.js`, `missions.js` — all use `extractCountriesFromMission()` + named params.

---

## Part 2 — Stale Column Reference Fix (Backend)

**Problem:** `pricing.js` SELECT queried `targeting_config` (a column that never existed), causing 400 errors from Supabase on every `/api/pricing/quote` call with a `missionId`.

**Fix:** Changed `.select('respondent_count, targeting, targeting_config, …')` → `.select('respondent_count, targeting, target_audience, …')`.

`target_audience` is needed for the `extractCountriesFromMission()` fallback chain when `targeting` is null.

---

## Part 3 — Mission Completion Guarantee (Backend)

**Problem:** If `synthesizeInsights()` threw (AI timeout, context limit, etc.), the mission would never reach `completed` status — stuck in `processing` forever.

**Fix:** Wrapped `synthesizeInsights()` in a try/catch in `runMission.js`. On failure:
- Logs the error with full stack
- Stores `analysis_error` in `mission_assets` JSONB for later inspection/retry
- **Always** calls `updateMission(…, { status: 'completed' })` regardless

Persona responses (the expensive part) are always saved. Summary can be regenerated later from stored `mission_responses`.

---

## Part 4 — ResultsPage Real Data (Frontend)

**Problem:** `ResultsPage.tsx` initialized state from `MOCK_MISSION_DATA` — a hardcoded constant with a fake "Product Market Fit Survey", fake questions, fake verbatims. Every paying customer saw this sample data. The `fetchResults` API call existed but any error silently fell back to mock.

**Fix:**
- **Deleted** `MOCK_MISSION_DATA` constant entirely (116 lines gone)
- Changed `useState<MissionData>(MOCK_MISSION_DATA)` → `useState<MissionData | null>(null)`
- Added `fetchError` state
- Added proper early-return UI states:
  - **Loading** — spinner + "Loading Results…" while fetch is in-flight
  - **Error** — AlertCircle + error message + "Back to Dashboard" if fetch fails
  - `const mission = missionData!` alias used in all JSX after guards guarantee non-null
- Removed hardcoded 3-stat cards (72% satisfaction / $19-49 price / AI = top feature)
- Fixed exec summary fallback: was hardcoded fake text, now shows "Summary is being generated…"
- Replaced hardcoded "Recommended Next Step" copy (referenced "AI features 78%") with generic follow-up CTA
- `applyFilterToData()` now uses `missionData?.questions || []` instead of mock
- The existing `fetchResults` function that calls `GET /api/results/${id}` is kept intact and unchanged

---

## Part 5 — Landing Hero Rotating Placeholder (Frontend)

**Problem:** The hero input had `value={DEFAULT_HERO_PROMPT}` — a hardcoded UAE meal kit question rendered as actual text in the input field, not a placeholder. Every visitor saw it as if they had typed it.

**Fix:**
- Removed `DEFAULT_HERO_PROMPT` constant
- Added `HERO_PLACEHOLDERS` array (8 diverse VETT use cases)
- `idea` state initialises to `''` (or `?q=` URL param if present)
- Added `placeholderIdx` + `heroFocused` state
- `useEffect` cycles `placeholderIdx` every 3 000 ms — pauses when `heroFocused` is true
- Input: `placeholder={HERO_PLACEHOLDERS[placeholderIdx]}`, `onFocus` / `onBlur` handlers
- On blur with empty input: resumes cycling. On blur with content: stays focused (preserves user text)
- `launchMission()` simplified — no longer needs to check `!== DEFAULT_HERO_PROMPT`

---

## Part 6 — Promo Codes (DB + Backend + Admin UI)

### Database
Migration `extend_promo_codes_for_free_type` applied to `hxuhqtczdzmiujrdcrta`:
- Widened `promo_codes_type_check` constraint to include `'free'` (was only `'percentage'` | `'flat'`)
- Added `description text` column for admin notes
- Seeded `VETT100` row: `type='free', value=100, active=true, max_uses=null`

Existing rows untouched: `LAUNCH50` (50% off), `VETT20` (20% off), `FRIEND10` ($10 flat).

### Backend — `payments.js` `/free-launch`
- **Before:** validated against `FREE_LAUNCH_CODE` env var (hardcoded `'VETT100'`)
- **After:** looks up the code in `promo_codes` table, checks `type = 'free'`, checks `active`, checks expiry/max_uses
- Increments `uses_count` on success (best-effort, non-blocking)
- All existing free-launch promo codes now manageable through the admin panel without deploys

### Backend — `admin.js`
Added 4 admin-only routes (gated by `authenticate + adminOnly`):
- `GET  /api/admin/promos` — list all codes
- `POST /api/admin/promos` — create new code
- `PATCH /api/admin/promos/:code` — toggle active, update fields
- `DELETE /api/admin/promos/:code` — remove a code

### Frontend — `PromosPanel.tsx` + `AdminPage.tsx`
- New component at `src/components/admin/PromosPanel.tsx`
- Table: code, discount type/value, description, uses (used/max), expiry, active toggle, delete
- Inline create form: code, type (percentage/flat/free), value, description, max_uses, expires_at
- Active toggle is instant (PATCH call, optimistic update)
- Delete requires confirmation (two-click pattern matching the rest of AdminPage)
- Added as `'promos'` tab in `AdminPage.tsx` (Tab type, tabs array, render block)
- `apiFetch` passed as prop — reuses AdminPage's auth-aware fetch helper

---

## Part 7 — Desktop Card Payment (Verification Only)

Per the brief: Jamil to test manually. Desktop card payment flow uses the same `VettingPaymentModal` fixed in Pass 7 + Pass 8. No code changes required unless testing reveals a regression.

---

## Files Changed

### Frontend (`vett-platform`) — branch `pass-combined-pricing-and-post-launch`

| File | Change |
|------|--------|
| `src/pages/ResultsPage.tsx` | Remove mock data, add loading/error states, wire real API |
| `src/pages/LandingPage.tsx` | Replace prefilled value with rotating placeholder |
| `src/pages/AdminPage.tsx` | Add Promos tab + import |
| `src/components/admin/PromosPanel.tsx` | New — promo CRUD UI |

### Backend (`vettit-backend`) — `main`

| File | Change |
|------|--------|
| `src/utils/pricingEngine.js` | Complete rewrite — country-tier formula |
| `src/routes/payments.js` | DB-backed free-launch, extractCountriesFromMission |
| `src/routes/pricing.js` | Fix stale targeting_config column, new call signature |
| `src/routes/missions.js` | New calculateMissionPrice call signature |
| `src/routes/admin.js` | Promo CRUD endpoints |
| `src/jobs/runMission.js` | synthesizeInsights wrapped in try/catch |
| `test/pricing.test.js` | 34 regression tests (new file) |

### Supabase (`hxuhqtczdzmiujrdcrta`)

| Migration | Change |
|-----------|--------|
| `extend_promo_codes_for_free_type` | Add `description` column, allow `type='free'`, seed VETT100 |

---

## Commits

### Frontend
- `6db9038` feat(combined): ResultsPage real data, landing placeholder, promo codes admin

### Backend
- `a7ff50a` fix(pricing): server is single source of truth — country-tier formula
- `fee8b53` fix(backend): always mark mission completed; store analysis errors separately
- `c0d5395` feat(promos): DB-backed promo CRUD + free-launch validates against promo_codes table
