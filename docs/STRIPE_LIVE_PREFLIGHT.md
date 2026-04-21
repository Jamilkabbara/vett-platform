# Stripe Live Mode Preflight Checklist

> Generated: Apr 22, 2026  
> Purpose: Pre-flight scan before promoting to live checkout. Audit current state so the switch is a 2-minute operation, not a debugging session.  
> **DO NOT use this document to make changes** — only document and verify.

---

## Status Summary

| Area | Status | Notes |
|------|--------|-------|
| Secret key (backend) | ✅ LIVE | `sk_live_*` already set in Railway |
| Publishable key (frontend) | ✅ LIVE | `pk_live_*` already set in Vercel |
| Webhook secret | ✅ Set | `whsec_*` in Railway — verify endpoint ID below |
| Hardcoded test IDs | ✅ None found | Grep of both repos clean |
| Pricing margin | 🟡 Hardcoded | No `VETTIT_MARGIN` env var — rates baked into `pricingEngine.js` |
| Webhook events | ✅ Covers core flows | `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded` |
| Webhook endpoint | 🟡 Verify in Dashboard | Must confirm live endpoint registered, not just test |

---

## 1. Environment Variables

### Backend — Railway (`vettit-backend-production`)

| Variable | Value (format) | Status |
|----------|---------------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_51MD0FG…` | ✅ Live key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_pctGK9…` | ✅ Set — see webhook verification below |

**Action needed:** In Railway dashboard, confirm `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are the production values, not test values copied by mistake.

### Frontend — Vercel (`vettit.ai`)

| Variable | Value (format) | Status |
|----------|---------------|--------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_51MD0FG…` | ✅ Live key |

> Source: `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` consumed in `VettingPaymentModal.tsx` and `OverageModal.tsx`.

### Hardcoded Test IDs — Grep Results

```
grep -rn "pk_test|sk_test|whsec_test|pi_test_" src/ → 0 results ✅
grep -rn "pk_test|sk_test|whsec_test|pi_test_" vettit-backend/src/ → 0 results ✅
```

No test-mode keys or IDs hardcoded in either repo.

---

## 2. Webhook Configuration

### Endpoint

```
POST https://vettit-backend-production.up.railway.app/webhooks/stripe
```

Source: `src/routes/webhooks.js` — route is `router.post('/stripe', ...)`, mounted at `/webhooks` in `app.js`.

### Events Subscribed (as implemented)

| Event | Handler | Effect |
|-------|---------|--------|
| `payment_intent.succeeded` | ✅ Handled | Updates mission `paid_at`, triggers `runMission()` via `setImmediate` |
| `payment_intent.payment_failed` | ✅ Handled | Updates mission status to `failed`, logs failure |
| `charge.refunded` | ✅ Handled | Logs refund — no mission state change currently |

### Verify in Stripe Dashboard

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Confirm a webhook endpoint exists for `https://vettit-backend-production.up.railway.app/webhooks/stripe`
3. Confirm it is the **live mode** endpoint (not a test endpoint — Stripe separates these)
4. Confirm the signing secret shown matches `STRIPE_WEBHOOK_SECRET` in Railway
5. Check "Recent deliveries" — any 4xx responses indicate a mismatch

> 🟡 **If no live webhook endpoint exists:** Add one in Stripe Dashboard (live mode), subscribe to the three events above, copy the new signing secret to Railway's `STRIPE_WEBHOOK_SECRET`, redeploy.

---

## 3. Pricing Mode

### Current implementation

Pricing is **fully hardcoded** in `vettit-backend/src/utils/pricingEngine.js`:

```js
const TIER_RATES = [
  { max: 200,  rate: 0.90 },   // $0.90/respondent ≤200
  { max: 500,  rate: 0.75 },
  { max: 1000, rate: 0.62 },
  { max: 2000, rate: 0.50 },
  { max: 5000, rate: 0.40 },
];
const EXTRA_QUESTION_PRICE = 20;   // $20 per question after the 5th
```

No `VETTIT_MARGIN` env var exists. Rates are baked into source.

**Status:** 🟡 This is fine for launch but means a pricing change requires a code deploy. Consider extracting to env vars before the first price adjustment.

### Quote endpoint

`POST /api/payments/quote` recalculates server-side from `pricingEngine.js`. Client totals are never trusted. ✅

---

## 4. Payment Flow Smoke Tests

Run these **after** confirming live webhook endpoint is registered. Use real cards (small amounts) or Stripe's live test cards if available on the account.

| Test | Expected Result | Status |
|------|----------------|--------|
| Card `4242 4242 4242 4242` | Payment succeeds → mission status → `paid` → `runMission` fires → AI generation starts | 🔲 Not yet tested live |
| Card `4000 0000 0000 0002` (declined) | Error banner in UI, mission stays `draft` | 🔲 Not yet tested live |
| Apple Pay on Safari iOS | Pay sheet appears after domain verification | 🔲 Blocked on domain verification (Task D) |
| Google Pay on Chrome with saved card | Pay button appears in payment modal | 🔲 Not yet tested live |

> **To run smoke tests:** Use a real card with a small-value mission (e.g., 10 respondents ≈ $9). Refund immediately via Stripe Dashboard after confirming the flow works.

---

## 5. Switch Checklist (when ready to go live)

Everything below is already done or confirmed — live keys are already set. The "switch" is mostly verification:

- [ ] Confirm live webhook endpoint registered in Stripe Dashboard (live mode)
- [ ] Confirm `STRIPE_WEBHOOK_SECRET` in Railway matches live endpoint signing secret
- [ ] Run smoke test: successful payment → mission launches
- [ ] Run smoke test: declined card → clean error
- [ ] Apple Pay domain verification complete (Task D)
- [ ] Enable leaked password protection in Supabase Auth dashboard (Task F4)
- [ ] Monitor Railway logs for `/rpc/increment_mission_ai_cost 404` — should be gone after Task B RPC migration

**Estimated time to complete switch:** ~20 minutes (mostly dashboard confirmation + one smoke test transaction).

---

---

## 6. Current Webhook State — Live Audit (Apr 22, 2026)

Queried via `stripe.webhookEndpoints.list()` using the live secret key.

### Registered endpoint

| Field | Value |
|-------|-------|
| ID | `we_1TJsbCGvqU3B9kYBNTAYU3Fq` |
| URL (in Dashboard) | `https://vettit-backend-production.up.railway.app/api/stripe/webhook` |
| Mode | ✅ Live |
| Status | `enabled` |
| Created | 2026-04-08T09:40:38Z |
| Secret prefix | `whsec_pctGK9…` (from Railway env — list() does not return secrets) |

### ❌ CRITICAL — URL mismatch

The URL registered in Stripe Dashboard does **not** match the actual backend route:

| | URL |
|--|-----|
| **Dashboard** | `…/api/stripe/webhook` |
| **Backend** (`app.js` line 58) | `…/api/webhooks/stripe` |

Stripe is sending events to a path that returns 404. **Webhook delivery is currently broken in production.**

**Fix (manual — Jamil):**
1. In Stripe Dashboard → Developers → Webhooks, update the endpoint URL to:
   ```
   https://vettit-backend-production.up.railway.app/api/webhooks/stripe
   ```
2. After saving, the signing secret will be regenerated. Copy the new `whsec_…` value into Railway's `STRIPE_WEBHOOK_SECRET` env var and redeploy.
3. Confirm delivery in Stripe Dashboard → Recent deliveries — should start showing 200s.

### Event subscription gaps

| Event | Subscribed in Dashboard | Handled in `webhooks.js` | Gap |
|-------|------------------------|--------------------------|-----|
| `payment_intent.succeeded` | ✅ | ✅ | — |
| `payment_intent.payment_failed` | ✅ | ✅ | — |
| `charge.refunded` | ❌ | ✅ | **Add to Dashboard subscription** |
| `customer.subscription.created` | ✅ | ❌ (logged, no action) | Low risk — subscription features not live |
| `customer.subscription.deleted` | ✅ | ❌ (logged, no action) | Low risk — subscription features not live |

**Actions needed when fixing the URL above:**
- Add `charge.refunded` to the webhook's event subscriptions in the Dashboard
- Optionally remove `customer.subscription.*` until subscription billing is implemented

---

## 7. What NOT to change this session

- Do not rotate any Stripe keys
- Do not add or remove webhook events without updating the handler in `webhooks.js`
- Do not change `pricingEngine.js` rates without syncing the frontend `pricingEngine.ts` mirror

---

## 8. Payment Path Safety Audit (P7, Apr 22 2026)

> **Scope:** Read-only analysis of `VettingPaymentModal.tsx` and the known backend payment routes. No fixes applied in this pass.

### Finding 1 — `activateMission()`: Client-side DB write 🟡

**File:** `src/components/dashboard/VettingPaymentModal.tsx` lines 30–40

```ts
async function activateMission(missionId: string | undefined): Promise<void> {
  const { error } = await supabase
    .from('missions')
    .update({ status: 'active', paid_at: new Date().toISOString() })
    .eq('id', missionId);
}
```

**What it does:** Runs directly from the browser, using the user's Supabase session token. Any authenticated user who knows a `missionId` can call this in DevTools or via a fetch.

**Why the blast radius is limited:**
- The mission's RLS policy requires `user_id = auth.uid()` on UPDATE — so a user can only flip *their own* missions.
- This DB write does **not** trigger AI generation. The actual `runMission()` call lives inside `/api/payments/confirm` on the backend, which re-fetches the PaymentIntent from Stripe and verifies `status === 'succeeded'` before proceeding.
- A user who manipulates the mission to `status: active` without paying sees the "active" badge in the UI but gets no AI output — no backend cost is incurred.

**Actual risk:** Cosmetic / analytics pollution. A user could mark their own draft as active without paying, cluttering the admin panel's mission list. No financial or data integrity risk under the current architecture.

**Recommended fix (future pass):** Move the `status: active` update to the backend inside `/api/payments/confirm`. Remove `activateMission()` from the frontend. The comment on line 28 already says "The backend confirm endpoint is authoritative" — this is the cleanup to match that intent.

---

### Finding 2 — `/api/payments/confirm`: Safe ✅

The frontend calls `POST /api/payments/confirm` with `{ missionId, paymentIntentId }` only *after* `stripe.confirmCardPayment()` returns `status === 'succeeded'` on the client.

**Backend behaviour (known from prior audit):** Re-fetches the PaymentIntent from Stripe using `sk_live_*`, verifies server-side that `status === 'succeeded'`, then triggers `runMission()`.

**Safety:** A user cannot forge a `paymentIntentId`. Stripe returns the real status when the backend retrieves it. Even if a user crafts a POST request to `/api/payments/confirm` with a random or test PI id, the backend's Stripe retrieval will return a non-succeeded status and refuse to launch the mission.

---

### Finding 3 — Dual activation path: race condition risk 🟡

Two code paths can call `runMission()` for the same mission:

| Path | Status |
|------|--------|
| `POST /api/payments/confirm` (called by frontend card form) | ✅ Working |
| `payment_intent.succeeded` webhook (backend) | ❌ Currently dead — webhook URL mismatch (§6) |

**Current state:** Because the webhook URL is wrong (§6), only path #1 fires. This is actually *safer* than the intended design.

**After the webhook URL is fixed:** Both paths could fire within milliseconds of each other, resulting in `runMission()` being called twice for the same mission. If `runMission()` is not idempotent — i.e., it does not check `mission.status` or `mission.paid_at` before launching — this would trigger duplicate AI synthesis jobs and double the AI cost for that mission.

**What to verify before fixing the webhook URL:**
1. Does `runMission()` begin with a guard like `if (mission.status !== 'draft') return;`?
2. Is there a DB-level unique constraint or `setImmediate` debounce preventing double-fire?
3. If not: add an idempotency check first, then fix the webhook URL.

**Recommended fix (future pass, pre-webhook repair):**
```js
// In runMission(), before any AI call:
const { data: mission } = await supabase.from('missions').select('status').eq('id', missionId).single();
if (mission.status !== 'draft') {
  console.warn('[runMission] already running or completed — skipping duplicate trigger');
  return;
}
```

---

### Finding 4 — Promo code `VETT100`: Bypasses payment AND AI launch 🟡

**File:** `VettingPaymentModal.tsx` lines 339–348

```ts
if (promoApplied && discountedPrice === 0) {
  await activateMission(missionId);   // ← only this runs
  setStage('success');
  navigate(`/mission/${missionId}/live`);
  return;
}
```

When `VETT100` is applied:
- Stripe is never contacted
- `/api/payments/confirm` is **not** called
- `runMission()` is **never triggered**
- The mission flips to `status: active` but no AI synthesis starts

**Effect:** The user sees "Mission Launched!" but the results page never populates. This appears to be an intentional dev shortcut (internal promo during early access), but it's currently broken for actual free-mission grants.

**Recommended fix (future pass):** Either (a) call `/api/payments/confirm` with a `freePass: true` flag that skips Stripe verification but still fires `runMission()`, or (b) add a backend `/api/payments/free-launch` endpoint for promo-code flows.

---

### Finding 5 — Edge case: promo path with missing `missionId` ⚠️ Low

If the modal is opened without a `missionId` prop and the user applies `VETT100`, the flow reaches:
```ts
navigate(`/mission/${missionId}/live`);  // → /mission/undefined/live
```

`activateMission()` short-circuits on line 31 (`if (!missionId) return`), so no DB write fires. But the navigation still happens, landing the user on an invalid URL.

**Recommended fix:** Add `if (!missionId) return fail('No mission ID found...')` before the promo path runs.

---

### Summary Table

| Finding | Severity | Blocks Live Launch? | Recommended Action |
|---------|----------|--------------------|--------------------|
| `activateMission()` client-side write | 🟡 Low-Medium | No | Move to backend post-confirm (future pass) |
| `/api/payments/confirm` | ✅ Safe | — | No action needed |
| Dual-path idempotency | 🟡 Medium | **Yes — must fix before webhook URL repair** | Add `status` guard in `runMission()` before fixing webhook URL |
| `VETT100` bypass | 🟡 Low | No | Wire promo path to backend free-launch endpoint (future) |
| Missing `missionId` on promo | ⚠️ Very Low | No | Guard before navigate |

### Launch gating

**The webhook URL mismatch (§6) must be the last thing fixed.** Fixing it before adding idempotency to `runMission()` risks double-charging AI costs on every successful payment. Sequence:

1. Add idempotency guard to `runMission()` (backend change)
2. Fix webhook URL in Stripe Dashboard + update `STRIPE_WEBHOOK_SECRET`
3. Smoke test: single payment → confirm only one AI job fires
