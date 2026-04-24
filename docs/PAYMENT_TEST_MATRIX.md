# VETT — Payment Test Matrix

Covers the 7-cell device/browser grid required before each payment-related release.
Run all rows with both a **card** and **Apple/Google Pay** (where available).

Use Stripe test card **4242 4242 4242 4242** (any future expiry, any CVC) for positive flows
and **4000 0000 0000 9995** for decline-flow tests.

---

## Test Matrix

| # | Device / OS | Browser | Card payment | Apple / Google Pay | Expected |
|---|-------------|---------|-------------|-------------------|----------|
| 1 | MacOS       | Chrome  | ✅ | Google Pay (test mode) | Succeeds → `/mission/:id/live` |
| 2 | MacOS       | Safari  | ✅ | Apple Pay (test mode)  | Succeeds → `/mission/:id/live` |
| 3 | MacOS       | Firefox | ✅ | N/A                    | Succeeds → `/mission/:id/live` |
| 4 | iPhone (iOS) | Safari | ✅ | Apple Pay (test mode)  | Succeeds → `/mission/:id/live` |
| 5 | iPhone (iOS) | Chrome  | ✅ | Google Pay (test mode) | Succeeds → `/mission/:id/live` |
| 6 | Android     | Chrome  | ✅ | Google Pay (test mode) | Succeeds → `/mission/:id/live` |
| 7 | Windows     | Edge    | ✅ | N/A                    | Succeeds → `/mission/:id/live` |

---

## Decline Flow Tests (run on row 1 as representative)

| Test card | Expected inline error |
|-----------|----------------------|
| 4000 0000 0000 9995 | "Card declined (insufficient_funds). Try a different card." |
| 4100 0000 0000 0019 | "Card declined (fraudulent). Try a different card." |
| 4000 0000 0000 0069 | "Your card has expired." |
| 4000 0000 0000 0127 | "Your card's security code is incorrect." |

All decline errors must:
- Appear **inline** inside the modal (not behind the backdrop)
- Reset the Pay button to enabled (not stuck in spinner)
- Log a row to `payment_errors` (verify in Admin → Payment Errors)

---

## Apple Pay / Google Pay Invariants

Before testing wallets, verify these invariants are met:

| Invariant | Where to check |
|-----------|----------------|
| `stripePromise` is module-level (never re-created per render) | `StripeElementsWrapper.tsx` top of file |
| `canMakePayment()` result cached in `useMemo` | `VettingPaymentModal.tsx` — `paymentRequest` memo |
| Button height exactly `48px` | `paymentRequest.style.paymentRequestButton.height` |
| Theme set to `dark` | `paymentRequest.style.paymentRequestButton.theme` |
| Button renders only when `canMakeExpressPayment === true` | JSX condition before `<PaymentRequestButtonElement>` |
| Null-safe check before rendering button | `paymentRequest && canMakeExpressPayment` guard |
| `walletName` telemetry correct in `payment_errors` | `logPaymentError({ paymentMethod: walletType })` |

---

## Promo Code Flow

| Scenario | Expected |
|----------|---------|
| Valid 100% promo (e.g. `VETT100`) | Price → $0, wallet button hidden, "Mission Launched!" |
| Invalid promo | "❌ Invalid or expired code" (auto-clears after 3 s) |
| 50% promo | Price halved, stripe Elements stay active |

---

## Post-Payment Checks

After a successful payment:
1. `missions.status` = `completed` (or `processing` if still running)
2. `stripe_webhook_events` row inserted with the event ID
3. `funnel_events` row with `event_name = 'mission_paid'`
4. User notification appears in notification bell
5. `qualified_respondent_count` / `delivery_status` populated on completion
