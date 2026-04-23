# VETT Pass 12 — Desktop Card Verification + Cleanup

**Branch:** `pass-12-card-verify-cleanup`  
**Date:** 2026-04-23  
**Status:** ✅ Parts B + C complete and pushed. Part A awaits Jamil's test. Part D awaits manual test.

---

## Part A — Desktop Card Payment Verification

**Status: Pending Jamil's test.**

No code shipped for this part. The desktop card path uses the same `VettingPaymentModal.tsx`
fixed in Pass 7 (capture `CardNumberElement` before `setStage('processing')`) and
Pass 8 (wait for all three `onReady` events before enabling Pay button).

**If the test passes:** document the outcome here and close the loop.

**If the test fails:** implement the `StripeElementsWrapper` pattern:

```tsx
// In VettingPaymentModal.tsx outer component:
export const VettingPaymentModal = (props: VettingPaymentModalProps) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    stripePromise.then(s => setStripe(s));
  }, []);

  if (!props.isOpen) return null;
  if (!stripe) return <div>Loading payment system...</div>;

  return (
    <Elements stripe={stripe}>
      <PaymentForm {...props} />
    </Elements>
  );
};
```

This resolves the `loadStripe` promise before rendering `<Elements>`, preventing
the scenario where `<Elements stripe={stripePromise}>` (promise, not instance)
causes a race on older Safari/Chrome builds. See stripe/react-stripe-js#296.

---

## Part B — Fix Stale Column References (`stripe_payment_intent_id` + others)

### Root cause

`GET /api/profile/invoices` (`src/routes/profile.js`) selected 5 columns that
do not exist on `public.missions`:

| Stale column (in query)        | Real column / note                              |
|--------------------------------|-------------------------------------------------|
| `stripe_payment_intent_id`     | Not stored on missions; Stripe is source of truth |
| `mission_statement`            | `brief` or `title`                              |
| `price`                        | `total_price_usd`                               |
| `pricing_breakdown`            | Individual: `base_cost_usd`, `targeting_surcharge_usd`, `extra_questions_cost_usd`, `discount_usd`, `promo_code` |
| `launched_at`                  | `paid_at`                                       |

Also: the filter `.not('launched_at', 'is', null)` was broken (column doesn't exist),
and `.in('status', ['active', 'completed'])` included `'active'` which is not a real
paid status — real paid statuses are `'paid'` and `'completed'`.

### Fix (`profile.js`)

```javascript
.select('id, title, brief, total_price_usd, base_cost_usd, targeting_surcharge_usd,
         extra_questions_cost_usd, discount_usd, promo_code, respondent_count, paid_at, status')
.in('status', ['paid', 'completed'])
.not('paid_at', 'is', null)
.order('paid_at', { ascending: false })
```

Invoice shape now returns:
```javascript
{
  missionStatement: m.brief || m.title || '',
  amount:           Number(m.total_price_usd),
  breakdown:        { base, targetingSurcharge, extraQuestionsCost, discount, promoCode },
  date:             m.paid_at,
  paymentIntentId:  null,   // intentional — not stored on missions
}
```

### Bonus fix: `pricingEngine.js` — `type='free'` promo not handled

The `/api/pricing/quote` endpoint (used by Part C below) passes the promo row
to `calculateMissionPrice`. The engine handled `'percentage'` and `'flat'` but
silently ignored `'free'` — so VETT100 and any future free codes returned the
full price from the quote endpoint instead of $0.

**Fix:** Added `type === 'free' → discount = subtotal` branch. Now `/api/pricing/quote`
with a free code correctly returns `{ total: 0, discount: <full subtotal> }`.

**Tests:** 6 new promo tests in `test/pricing.test.js` (free/percentage/flat/inactive/
capped/totalCents=0). 40 tests total, all passing.

---

## Part C — Server Quote on Payment Modal

### Findings

`VettingPaymentModal.tsx` was **not** calling `/api/pricing/quote`. The Pay button
displayed `discountedPrice`, which was initialized directly from the `totalCost`
prop (client-computed by `pricingEngine.ts`). The promo validation (`handleApplyPromo`)
was **entirely client-side** — it only accepted the hardcoded string `'VETT100'`.
All other codes from the DB (LAUNCH50, VETT20, FRIEND10) always returned "Invalid Code".

### Fix

**1. Server quote on open**

```tsx
useEffect(() => {
  if (!isOpen || !missionId) return;
  api.post('/api/pricing/quote', { missionId })
    .then((data) => {
      if (typeof data?.total === 'number') {
        setServerOriginalPrice(data.total);
        setDiscountedPrice(data.total);   // ← replaces client prop
      }
    })
    .catch(() => { /* keep client totalCost as fallback */ });
}, [isOpen, missionId]);
```

The fetch fires during the 3-second vetting animation, so the server price is
ready before the Pay button is visible. On failure it silently keeps the
client-computed value — Stripe will charge the server-computed amount anyway.

**2. Server promo validation**

`handleApplyPromo` is now `async` and calls:
```tsx
const data = await api.post('/api/pricing/quote', { missionId, promoCode });
```

Server looks up the code in `promo_codes`, applies discount, returns authoritative total.
- `data.total < originalTotal` → promo valid, update price + show discount label from `breakdown`
- `data.total === 0` → free code, hide express payment button
- No discount applied → "❌ Invalid or expired code"

**3. Apply button UX**

```tsx
disabled={!promoCode.trim() || promoLoading}
// text: promoLoading ? 'Checking...' : 'Apply'
```

**Coverage:** VETT100 (free), LAUNCH50 (50% off), VETT20 (20% off), FRIEND10 ($10 flat)
all now work correctly end-to-end from the modal.

---

## Part D — Admin Promos Tab End-to-End Verification

**Status: Awaiting Jamil's manual test.**

Test script:
1. Log in as `kabbarajamil@gmail.com` → Admin → Promos tab  
2. Create `TESTFREE` with type=Free, no expiry  
3. Open a draft mission → Launch → enter `TESTFREE` → Apply → should show "$0 / Free"  
4. Click "Launch Mission (Free)" → confirm mission goes to `paid` status in DB  
5. Back to Admin → Promos → deactivate `TESTFREE` (toggle to Inactive)  
6. Open another draft → apply `TESTFREE` → should get "❌ Invalid or expired code"  
7. Delete `TESTFREE` from Admin UI  

Expected: Steps 4 and 6 validated. Report outcomes here.

---

## Files Changed

### Frontend (`vett-platform`) — `pass-12-card-verify-cleanup`

| File | Change |
|------|--------|
| `src/components/dashboard/VettingPaymentModal.tsx` | Server quote on open; server promo validation; `promoLoading` state on Apply button |

### Backend (`vettit-backend`) — `main`

| File | Change |
|------|--------|
| `src/routes/profile.js` | Fix `/invoices` endpoint — 5 stale columns replaced with real schema |
| `src/utils/pricingEngine.js` | Handle `type='free'` promo → `discount = subtotal` |
| `test/pricing.test.js` | 6 new promo discount tests (40 total) |

---

## Commits

### Frontend
- `38857b1` fix(modal): server-authoritative pricing + server-validated promo codes

### Backend
- `cfe81f8` fix(backend): stale columns in profile/invoices + free promo in pricingEngine
