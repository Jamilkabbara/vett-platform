# Pass 8 Report — Stripe Element "ready event not emitted" Fix

**Branch:** `pass-8-stripe-ready-event`
**Date:** 2026-04-22

---

## (a) Files changed

| File | Change |
|------|--------|
| `src/components/dashboard/VettingPaymentModal.tsx` | 5 targeted changes: ready state variables, onReady callbacks, Pay button disabled/text, handler guard, reset on modal close |

---

## (b) Error being fixed

```
We could not retrieve data from the specified Element.
Please make sure the Element you are attempting to use is mounted
and the ready event has been emitted.
```

This is a Stripe.js internal error, not a VETT error string. It fires from inside `stripe.confirmCardPayment()` when the `CardNumberElement` ref is valid and mounted, but the element hasn't completed its internal iframe initialisation cycle (ready event not yet fired).

---

## (c) Root cause

Pass 7 fixed the element-unmount race: `cardNumberElement` is now captured before `setStage('processing')` and the first `await`. The ref is valid.

But there's a second, independent race: the Stripe iframe needs to fully initialise before it can process a payment. "Initialised" in Stripe's model means:

1. Iframe created and injected ✅ (element is mounted)
2. Stripe.js cross-origin handshake with the iframe complete ✅
3. `ready` event emitted by the element ← **this is the missing gate**

The time between mount and ready is typically 300–800ms depending on network conditions and browser. A fast user who opens the modal and clicks Pay before the iframes finish initialising hits this error even after Pass 7.

The canonical Stripe fix is to track each element's `onReady` prop callback and gate submit behind all three being ready.

---

## (d) Changes

### Change 1 — Three ready-state booleans + computed gate

```tsx
const [cardNumberReady, setCardNumberReady] = useState(false);
const [cardExpiryReady, setCardExpiryReady] = useState(false);
const [cardCvcReady, setCardCvcReady] = useState(false);
const allElementsReady = cardNumberReady && cardExpiryReady && cardCvcReady;
```

`allElementsReady` is false on first render (all iframes initialising) and becomes true only after all three emit `ready`.

### Change 2 — `onReady` wired to each card Element

```tsx
<CardNumberElement
  options={CARD_ELEMENT_STYLE}
  onReady={() => setCardNumberReady(true)}
/>
<CardExpiryElement
  options={CARD_ELEMENT_STYLE}
  onReady={() => setCardExpiryReady(true)}
/>
<CardCvcElement
  options={CARD_ELEMENT_STYLE}
  onReady={() => setCardCvcReady(true)}
/>
```

These callbacks are stable references (inline arrow functions on a component that rarely re-renders while stage='payment'). No memoization needed — `onReady` fires once per mount.

### Change 3 — Pay button disabled until ready

```tsx
disabled={isProcessing || (discountedPrice > 0 && !allElementsReady)}
```

Free-path (`discountedPrice === 0`) is exempt — no card elements are mounted for the promo path, so `allElementsReady` stays false, but the button should be active.

Button text reflects the state:
```tsx
{discountedPrice === 0
  ? 'Launch Mission (Free)'
  : !allElementsReady
  ? 'Loading payment form...'
  : `Pay $${discountedPrice.toFixed(2)}`}
```

Users see "Loading payment form..." for ~0.5–1s, then "Pay $X" when all three elements are ready. This eliminates the race entirely from the user-visible flow — they can't click before the elements are ready.

### Change 4 — Belt-and-suspenders guard in `handleCardPayment`

```tsx
if (!cardNumberReady || !cardExpiryReady || !cardCvcReady) {
  return fail('Payment form is still loading — please wait a moment and try again.');
}
```

Added after the existing `!stripe / !elements / !missionId` checks and before the element ref capture. This catches the theoretical edge case where state is stale but the handler fires.

### Change 5 — Reset on modal close

```tsx
// In the isOpen=false cleanup effect:
setCardNumberReady(false);
setCardExpiryReady(false);
setCardCvcReady(false);
```

Without this, reopening the modal would show "Pay $X" immediately (stale ready=true from previous mount) while the new iframes are still initialising.

---

## (e) Free-path (promo code) not affected

When `VETT100` is applied:
- `discountedPrice` → 0
- Card form conditionally hidden: `{discountedPrice > 0 && (...)}`
- Card elements never mount → never fire `onReady` → `allElementsReady` stays false
- Pay button disabled check: `discountedPrice > 0 && !allElementsReady` → false (exempt)
- Button shows "Launch Mission (Free)" and is clickable ✅
- `handleCardPayment` promo branch returns early before the ready guard ✅

---

## (f) Apple Pay / PaymentRequestButtonElement not affected

`PaymentRequestButtonElement` has its own lifecycle gated by `canMakeExpressPayment && paymentRequestButtonOptions`. That flow doesn't use `CardNumberElement` or the ready state. No change needed.

---

## (g) Before / After

**Before (post Pass 7):**
```
User opens modal → iframes start loading
User fills card immediately (~0.3s after open)
User clicks "Pay $X"
→ stripe.confirmCardPayment() fires before iframes are ready
→ "We could not retrieve data from the specified Element.
   Please make sure the Element you are attempting to use
   is mounted and the ready event has been emitted."
```

**After:**
```
User opens modal
Button: "Loading payment form..." (disabled, ~0.5–1s)
Iframes initialise, all three fire onReady
Button: "Pay $X" (enabled)
User fills card, clicks Pay
→ stripe.confirmCardPayment() fires — all elements ready ✅
→ Payment succeeds
```

---

## (h) Build

```
✓ built in 2.31s
```

No TypeScript errors in modified file.

---

## Test instructions

### Local
1. `npm run dev` → mission → "Launch Mission"
2. Watch the Pay button on the payment stage
3. **Expected:** button shows "Loading payment form..." for ~0.5–1s, then switches to "Pay $X"
4. Enter `4242 4242 4242 4242`, future expiry, any CVC
5. Click Pay
6. **Expected:** no "ready event not emitted" error — payment processes

### Speed test (reproduce the race)
1. Open modal
2. Immediately click "Pay $X" (before it switches text)
3. **Expected:** button is disabled — nothing happens, no error

### Promo code path
1. Enter `VETT100`
2. Button should immediately show "Launch Mission (Free)" (no waiting for card elements)
3. Click → free launch succeeds

### Production (after merge + deploy)
1. vettit.ai → real mission → payment step
2. Wait for "Pay $X" to appear
3. Fill real card → Pay
4. **Expected:** card charged, mission launches
