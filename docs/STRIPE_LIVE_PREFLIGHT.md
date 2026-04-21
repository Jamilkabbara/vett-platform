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

## 6. What NOT to change this session

- Do not rotate any Stripe keys
- Do not add or remove webhook events without updating the handler in `webhooks.js`
- Do not change `pricingEngine.js` rates without syncing the frontend `pricingEngine.ts` mirror
