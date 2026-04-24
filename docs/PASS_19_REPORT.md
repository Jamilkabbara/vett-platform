# VETT — Pass 19 Report: Guaranteed Delivery + Payment Hardening

**Branch:** `pass-19-delivery-and-payment-hardening`
**Status:** ✅ Complete — ready to merge

---

## Task 0 — Guaranteed Qualified Delivery ✅

### Problem
Missions with strict screening questions could deliver far fewer respondents than ordered. If 10 of 100 simulated personas passed the screener, the client received 10 results despite paying for 100.

### Solution

**DB migration (Supabase project `hxuhqtczdzmiujrdcrta`):**
```sql
ALTER TABLE public.missions
  ADD COLUMN qualified_respondent_count INT,
  ADD COLUMN total_simulated_count INT,
  ADD COLUMN qualification_rate NUMERIC(5,4),
  ADD COLUMN delivery_status TEXT CHECK (delivery_status IN ('full','partial','screener_too_restrictive'));
```
Past completed missions backfilled with `delivery_status = 'full'`.

**`src/jobs/runMission.js` — oversampling loop:**
- `MAX_OVERSAMPLE_MULTIPLIER = 3` — will simulate up to 3× the ordered count
- Cold start: assumes 50% pass rate → requests `stillNeeded × 2` personas in first batch
- Each subsequent batch adapts to the observed qualification rate (`qualifiedCount / totalSimulated`)
- Batch capped at 500 personas and at the remaining budget
- Loop exits when `qualifiedCount >= orderedCount` or `totalSimulated >= 3× orderedCount`
- `delivery_status` logic:
  - `full` → qualified ≥ ordered
  - `screener_too_restrictive` → qualified < ordered AND qual_rate < 25%
  - `partial` → everything else
- Response insertion: screener responses kept for all personas (honest funnel data); non-screener responses capped to first `orderedCount` qualified personas

**`src/services/ai/personas.js` — idOffset parameter:**
- `generatePersonas(mission, count, idOffset = 0)` — prevents ID collisions (P001, P001…) across oversampling batches

**`src/pages/ResultsPage.tsx` — delivery banners:**
- `MissionData` interface extended with 4 delivery fields
- `fetchResults` populates delivery fields from `data.mission`
- Orange banner for `partial`: "X of Y qualified respondents delivered"
- Red banner for `screener_too_restrictive`: "Only X passed. Consider relaxing screener criteria."
- No banner for `full` or pre-Pass-19 missions (null `delivery_status`)

**`src/components/admin/AdminDeliveryHealth.tsx` — admin panel:**
- Summary cards: total missions, full %, partial count, screener-too-strict count
- Average qualification rate across all screener missions
- Sortable table: mission title, ordered/qualified/simulated counts, qual rate %, status badge, date

**`src/pages/AdminPage.tsx`:**
- New "Delivery Health" tab (Truck icon) under Data group

---

## Task 1 — Payment Test Matrix ✅

Created `docs/PAYMENT_TEST_MATRIX.md` with:
- 7-row device/browser matrix (macOS/Chrome, macOS/Safari, macOS/Firefox, iPhone/Safari, iPhone/Chrome, Android/Chrome, Windows/Edge)
- 4 decline-flow test cards with expected inline error messages
- Apple/Google Pay invariants checklist
- Promo code flow table
- Post-payment verification checklist

---

## Task 2 — VettingPaymentModal Audit ✅ (no code changes)

All 7 payment invariants were already satisfied from prior passes:

| Invariant | Status |
|-----------|--------|
| `stripePromise` at module scope in `StripeElementsWrapper.tsx` | ✅ confirmed |
| `canMakePayment()` result cached in `useMemo` | ✅ confirmed |
| Button height `48px`, theme `dark` | ✅ confirmed |
| `CardNumberElement` ref captured before `setStage('processing')` | ✅ confirmed |
| Inline error surface inside modal | ✅ confirmed |
| All `fail()` paths clear spinner (`setIsProcessing(false)`) | ✅ confirmed |
| `toastId` propagated to every `toast.error()` call | ✅ confirmed |

---

## Task 3 — Stripe Webhook Idempotency ✅

**DB tables created:**
- `stripe_webhook_events(event_id TEXT PK, event_type, processed_at, payload JSONB)` — primary key on `event_id` enforces uniqueness
- `admin_alerts(id UUID PK, alert_type, mission_id, user_id, payload JSONB, resolved BOOL, created_at)` — alerting table for payment failures and stuck missions

**`src/routes/webhooks.js` — `claimWebhookEvent()` function:**
- Inserts `event.id` into `stripe_webhook_events` before any processing
- PostgreSQL error code `23505` (unique violation) = duplicate → return `200 { duplicate: true }` immediately
- Other DB errors: log but continue processing (prevents silent drops)
- `payment_intent.payment_failed` now writes `admin_alerts` row with Stripe error + decline code

---

## Task 4 — Payment Error Telemetry ✅

**DB table created:**
- `payment_errors(id UUID PK, user_id, mission_id, error_code, error_message, decline_code, payment_method, amount_cents, currency, browser, os, created_at)`

**`src/components/dashboard/VettingPaymentModal.tsx` — `logPaymentError()` function:**
- Module-level async function; fire-and-forget (catch swallowed — never surfaces to user)
- Parses `browser` and `os` from `navigator.userAgent` (Chrome/Firefox/Safari/Edge/Opera; macOS/Windows/iOS/Android/Linux)
- Wired into `fail()` in `handleCardPayment` for card errors
- Wired into wallet payment catch block for Apple Pay / Google Pay errors
- `payment_method` field: `'card'` / `'apple_pay'` / `'google_pay'` (derived from `event.walletName`)

**`src/components/admin/AdminPaymentErrors.tsx` — admin panel:**
- Summary bar charts: error codes, decline codes, payment method, browser distribution
- Paginated recent-errors table (50/page, up to 500 rows)
- "X total · Y last 7 days" summary line

**`src/pages/AdminPage.tsx`:**
- New "Payment Errors" tab (AlertTriangle icon) under Data group

---

## Task 5 — Apple/Google Pay Audit ✅ (no code changes)

All sanity checks pass:

| Check | Status |
|-------|--------|
| `stripePromise` is module-level — not re-created per render | ✅ `StripeElementsWrapper.tsx` line 8 |
| `canMakePayment()` result via `useMemo` — not re-called per render | ✅ `paymentRequest` memo in `VettingPaymentModal.tsx` |
| Button height: `48px` | ✅ `style.paymentRequestButton.height` |
| Button theme: `dark` | ✅ `style.paymentRequestButton.theme` |
| Null guard before rendering `<PaymentRequestButtonElement>` | ✅ `paymentRequest && canMakeExpressPayment` condition |

---

## Task 6 — `recoverStuckMissions.js` ✅

**`src/jobs/recoverStuckMissions.js`:**
- Finds missions in `processing` with `started_at < now() - 45 min`
- If `mission_responses` count ≥ 5: resets to `paid` → re-queues via `runMission()` (idempotency guard handles the claim safely)
- If count < 5: marks `failed` + user notification
- Writes `admin_alerts` row for every recovered mission
- Exports `recoverStuckMissions()` — wire into `node-cron` or Railway cron every 15 min:
  ```javascript
  const cron = require('node-cron');
  const { recoverStuckMissions } = require('./src/jobs/recoverStuckMissions');
  cron.schedule('*/15 * * * *', recoverStuckMissions);
  ```

---

## DB Migrations Applied

| Migration | Tables |
|-----------|--------|
| `pass19_delivery_columns` | `missions` — 4 new columns + backfill |
| `pass19_webhook_idempotency_and_payment_errors` | `stripe_webhook_events`, `admin_alerts`, `payment_errors` |

---

## Commits

### Frontend (`vett-platform`)
- `767d5d8` — Pass 19 Tasks 0/3/4/5: delivery banners, admin panels, payment telemetry

### Backend (`vettit-backend`)
- `989e474` — Pass 19 Task 0: oversampling loop + delivery metrics
- `82d3433` — Pass 19 Tasks 3/6: webhook idempotency + stuck mission recovery
