# Pass 23 — Obsoleted Bugs

Bugs whose targeted code paths no longer exist after the **Bug 23.0e v2
full Stripe Checkout migration** (merged 2026-04-28). All four were
diagnostic / defensive patches against the inline Stripe Elements
iframe lifecycle — a problem space that disappeared the moment we
moved to redirect-based Checkout.

These are documented here (not deleted) so the bug ledger stays
auditable: future archaeology can see the fix history rather than
guessing what `client_element_mount_timeout` was for.

---

## Bug 22.11 — Apple Pay / Google Pay device matrix testing

**Original scope:** verify Apple Pay + Google Pay buttons render and
charge correctly across the iOS / iPadOS / macOS / Android matrix
inside the inline Elements `<PaymentRequestButton>` widget.

**Why obsolete:** Stripe Checkout handles wallet buttons natively on
its own hosted page. Domain verification is a one-time Stripe
Dashboard step (see `docs/APPLE_PAY_VERIFICATION.md`). No JS to
test, no widget to mount, no device matrix to maintain.

**Closure date:** 2026-04-28 (Bug 23.0e v2 merge).

---

## Bug 23.0a — 2-frame rAF defer + 5s timeout + retry

**Original scope:** Safari iframe ready-event Bali forensic fix —
defer mounting `<CardElement>` until 2 RAFs after modal opens, surface
"Try again" button after 5s if ready-event hadn't emitted.

**Why obsolete:** No Elements to mount. `VettingPaymentModal` and
`OverageModal` deleted in 23.0e v2; the entire iframe lifecycle is
gone. Stripe Checkout's hosted page has its own mount path.

**What we keep:** the lesson — defensive patches against fundamentally
fragile architectures eventually compound to a migration.

**Closure date:** 2026-04-28.

---

## Bug 23.0c — `client_element_mount_timeout` logger stage

**Original scope:** dedicated `payment_errors.stage` value for the
"Stripe Element didn't fire ready event within 5s" telemetry that
Bug 23.0a's timeout produced. Anon-friendly so unauthenticated
visitors who hit the failure could still log.

**Why partially obsolete:** the specific stage value
`client_element_mount_timeout` is no longer reachable (no Element
mount path). Still **kept**:
- The `payment_errors` table (forensic for any future failure class).
- The anon-friendly `/api/payments/errors/log` endpoint (still useful
  for `client_checkout_redirect_failed` and `client_checkout_polling_timeout`,
  the new Checkout-flow stages).
- The `paymentErrorLogger.ts` helper.

**What's retired:** just the stage value itself. Historic rows with
that stage stay in the table for audit; future inserts won't use it.

**Closure date:** 2026-04-28.

---

## Bug 23.0e v1 — staged Elements hoist

**Original scope:** lazy-load Stripe.js + Elements only when the
payment modal opened, instead of bundling the 30 KB `vendor-stripe`
chunk on every page load.

**Why obsolete:** No Elements to load. `@stripe/react-stripe-js` and
`@stripe/stripe-js` uninstalled. `vendor-stripe` chunk no longer
emitted by Vite. v1's lazy-load was overtaken by v2's "delete the
whole thing" migration.

**Closure date:** 2026-04-28.

---

## Audit checklist (run anytime)

```bash
# No imports of deleted packages
grep -rn "@stripe/react-stripe-js\|@stripe/stripe-js" \
  vett-platform/src/ vettit-backend/src/ 2>/dev/null
# Should return: nothing.

# No references to deleted components
grep -rn "VettingPaymentModal\|StripeElementsWrapper\|OverageModal" \
  vett-platform/src/ 2>/dev/null
# Should return: nothing functional (only historical comments OK).

# No vendor-stripe chunk in production bundle
curl -sS https://www.vettit.ai/ | grep "vendor-stripe"
# Should return: nothing.
```
