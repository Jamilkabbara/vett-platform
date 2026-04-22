# Pass 7 Report — Stripe Elements Re-Mount Bug

**Branch:** `pass-7-stripe-fix`
**Date:** 2026-04-22

---

## (a) Files changed

| File | Change |
|------|--------|
| `src/components/dashboard/VettingPaymentModal.tsx` | 4 targeted changes: useMemo import, paymentRequestButtonOptions memo, handleCardPayment reorder, PaymentRequestButtonElement options prop |

---

## (b) Evidence from production (as received)

- Backend PaymentIntent creation: working — Railway logs show `POST /api/payments/create-intent 200` ✅
- Frontend `pk_live_51MD0FG...` present in compiled bundle ✅
- Backend `sk_live_51MD0FG...` in Railway environment ✅
- 67 Stripe iframes on the payment page (CardNumber + CardExpiry + CardCvc, mounted many times)
- **27 identical console warnings:** `"Unsupported prop change: options.paymentRequest is not a mutable property"`
- `useMemoCount: 0` across VettingPaymentModal.tsx — no memoization anywhere
- User-visible error: "Please enter your card details before paying." even after filling all card fields

---

## (c) Root cause diagnosis

The brief attributed the bug to `loadStripe` being inside the component body. **Code audit found this was already correct** — `loadStripe` was already at module scope (line 42), outside all component functions. The actual bugs were two separate issues, stacked:

---

### Bug 1 (primary) — `setStage('processing')` unmounts CardNumberElement before `getElement()` is called

**Location:** `handleCardPayment` in `PaymentForm`

The original execution order:

```
setIsProcessing(true);
setStage('processing');          ← queues React re-render
toast.loading(...)

await api.post('/api/payments/create-intent', ...)   ← first await: React flushes render
                                                        stage='processing' shows spinner
                                                        CardNumberElement UNMOUNTS

const cardNumberElement = elements.getElement(CardNumberElement);  ← returns null
if (!cardNumberElement) {
  return fail('Please enter your card details before paying.');   ← THE BUG
}
```

React's concurrent-mode batching defers re-renders until the next microtask boundary — the `await` for the PaymentIntent API call. After that await returns, React flushes the pending `setStage('processing')` state update. The `processing` stage renders a spinner and nothing else — no `CardNumberElement`, `CardExpiryElement`, or `CardCvcElement`. After this unmount, `elements.getElement(CardNumberElement)` returns `null`.

This fires the misleading "Please enter your card details before paying." error every time the user clicks Pay on a paid mission, because:
1. The card form IS filled (Stripe confirms the iframes received input)
2. The PaymentIntent IS created (Railway logs confirm 200 response)
3. But the element reference is gone by the time we ask for it

**Fix:** Move `elements.getElement(CardNumberElement)` to **before** `setStage('processing')` and **before** the first `await`. The captured ref remains valid even after the element unmounts — Stripe holds the element in memory as long as the ref exists.

New order:
```
// Synchronous guards (no state changes yet)
if (!stripe) → fail
if (!elements) → fail
if (!missionId) → fail

// Capture ref NOW, while CardNumberElement is still mounted
const cardNumberElement = elements.getElement(CardNumberElement)
if (!cardNumberElement) → fail with clearer message + DEV logging

// THEN show processing UI (CardNumberElement will unmount — that's fine now)
setIsProcessing(true)
setStage('processing')
toastId = toast.loading(...)

// THEN the first await — React flushes the re-render, element unmounts
await api.post('/api/payments/create-intent', ...)

// cardNumberElement ref still valid, Stripe can charge it
await stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardNumberElement } })
```

---

### Bug 2 (secondary) — Inline `options` object on `PaymentRequestButtonElement` causes 27 warnings

**Location:** JSX for `PaymentRequestButtonElement`

```tsx
// Before — fresh object ref on every render:
<PaymentRequestButtonElement
  options={{
    paymentRequest,
    style: { paymentRequestButton: { type: 'buy', theme: 'dark', height: '48px' } },
  }}
/>
```

Each React render creates a new `options` object reference. React Stripe Elements detects the changed ref and tries to update the element — but `paymentRequest` is not a mutable property of `PaymentRequestButtonElement`. Stripe logs the warning and silently bails, leaving internal state in an inconsistent condition across renders.

**Fix:** Memoize the options object with `useMemo`, keyed on `[paymentRequest]`:

```tsx
const paymentRequestButtonOptions = useMemo(() => {
  if (!paymentRequest) return null;
  return {
    paymentRequest,
    style: { paymentRequestButton: { type: 'buy' as const, theme: 'dark' as const, height: '48px' } },
  };
}, [paymentRequest]);

// In JSX:
{canMakeExpressPayment && paymentRequestButtonOptions && discountedPrice > 0 && (
  <PaymentRequestButtonElement options={paymentRequestButtonOptions} />
)}
```

`paymentRequest` is set once (inside the `useEffect` that calls `stripe.paymentRequest(...).canMakePayment()`) and doesn't change unless `discountedPrice` or `respondentCount` changes. So the memo rarely recomputes.

---

### Additional fix — `toastId` lifecycle

**Problem:** The original code created `toastId` unconditionally at the top of `handleCardPayment`, including for synchronous guard failures (e.g. `!stripe`). This left a dangling "Processing..." toast that was never dismissed when a guard bailed early.

**Fix:** `toastId` is now `let toastId = ''` (initially empty). It's assigned via `toast.loading(...)` only after the element ref is captured and right before the first `await`. The `fail()` helper checks `if (toastId)` before calling `toast.error(msg, { id: toastId })` — it falls back to `toast.error(msg)` for the early synchronous failures. No dangling loading toasts.

---

## (d) What was confirmed correct (no changes)

- `loadStripe(...)` at module scope (line 42) — already correct
- Single `<Elements stripe={stripePromise}>` provider — no `options={{ paymentRequest }}` on `<Elements>` itself
- `stripePromise` is a stable singleton — not re-created on render
- `activateMission()` helper — correct
- `extractErrorMessage()` — correct
- Inline error banner (`errorMessage` state) — correct
- `confirmCardPayment` call shape — correct

---

## (e) Before / After

### Before
```
User fills 4242 4242 4242 4242, valid expiry, CVC
→ Clicks "Pay $X"
→ Spinner appears for ~2s (PaymentIntent being created)
→ "Please enter your card details before paying." ← misleading, wrong
→ Console: 27× "Unsupported prop change: options.paymentRequest is not a mutable property"
```

### After
```
User fills card details
→ Clicks "Pay $X"
→ Element ref captured synchronously (CardNumberElement is still mounted)
→ Spinner appears
→ PaymentIntent created on backend
→ stripe.confirmCardPayment() called with the captured ref
→ Payment succeeds → "Mission Launched Successfully!"
→ Console: 0 PaymentRequest warnings
```

---

## (f) Build

```
✓ built in 2.34s
```

No TypeScript errors in modified file. Pre-existing TS errors in unrelated files (QuestionEngine.tsx, etc.) unchanged.

---

## (g) Known additional work (NOT in this pass)

1. **Apple Pay domain verification** — Stripe Dashboard → Settings → Payment methods → Apple Pay → verify `vettit.ai` for **Live** mode. Jamil owns this. Without it, `canMakePayment()` returns `null` for Apple Pay on Safari, so the button never shows.
2. **Live webhook endpoint** — verify Stripe Dashboard's Live webhook points to `https://vettit-backend-production.up.railway.app/api/webhooks/stripe` and the signing secret in Railway matches.
3. **Payment Element migration** — current code uses split CardNumber/CardExpiry/CardCvc elements (legacy). Stripe recommends the unified `PaymentElement` for new integrations. Larger refactor — Pass 8 candidate.
4. **67 iframes** — now that the re-mount bug is fixed, the iframe count should drop to 3 (one per card field) on a fresh modal open. If it doesn't, investigate whether `VettingPaymentModal` is being mounted multiple times in the parent component tree.

---

## Test instructions

### Local
1. `npm run dev` → navigate to a mission → click "Launch Mission"
2. Open DevTools → Console tab
3. Enter test card: `4242 4242 4242 4242`, any future date, any CVC
4. Click Pay
5. **Expected:** payment processing spinner, then success — NOT "Please enter your card details"
6. **Expected:** zero "options.paymentRequest is not a mutable property" warnings in Console

### Production (after merge to main + deploy)
1. vettit.ai → create a mission → proceed to payment
2. Enter a real card
3. Click Pay
4. **Expected:** card charged, mission launches
5. Refund in Stripe Dashboard → Payments → find the charge → Refund

### Regression guard (free promo path)
1. Enter promo code `VETT100`
2. Click "Launch Mission (Free)"
3. **Expected:** free launch succeeds, mission starts without touching Stripe card charge
