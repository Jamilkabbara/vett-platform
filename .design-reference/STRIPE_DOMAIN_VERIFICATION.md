# Stripe Apple Pay — domain verification runbook

Apple Pay requires every domain that renders the Payment Request button to be
registered in the Stripe Dashboard **per environment**. Google Pay has no such
requirement. Without this step, Apple Pay never appears in the modal even
though the code is wired correctly — `canMakePayment()` returns `null` and the
button silently falls back to card entry.

This is a manual action for the operator. Claude cannot do it: it requires
Stripe Dashboard login + hosting a file at a specific URL on the target domain.

## Environments that need verification

| Environment | Domain | Who verifies |
|---|---|---|
| Local dev | `localhost` | not supported — Apple Pay is disabled on localhost |
| Preview | `*.vercel.app` deploy URLs | each preview domain is ephemeral; skip |
| Staging | `vettit-staging.vercel.app` (or equivalent) | operator |
| Production | `vettit.ai` | operator |

## Steps (production flow)

1. Sign in to the Stripe Dashboard. Confirm you are in the correct mode
   (Test / Live) — Apple Pay domain registration is tracked separately per
   mode.
2. Go to **Settings → Payments → Apple Pay**.
3. Click **Add new domain**, type the production domain (no `https://`,
   no trailing slash).
4. Stripe returns a file named
   `apple-developer-merchantid-domain-association`. Download it.
5. Host that file at `https://<your-domain>/.well-known/apple-developer-merchantid-domain-association`
   with `Content-Type: text/plain`, status 200, no redirects.
   - For Vercel: drop the file into `public/.well-known/` (create the dir)
     and redeploy. The static file server serves it as-is.
6. Back in the Dashboard, click **Verify**. Stripe fetches the file and
   flips the domain to "Verified".
7. Test: open the Vettit payment modal on Safari (macOS or iOS) with a
   card in Wallet. You should see the black Apple Pay button above the
   card form.

## Common failures

- **Button doesn't appear in Safari on verified domain**: user has no card
  in Wallet, or their Mac is older than 2012 (no Touch ID / T2 Secure
  Enclave). Nothing to fix.
- **Button doesn't appear in Chrome**: Google Pay needs a saved card in
  the browser's autofill; it's not related to domain verification.
- **"Verification failed" in the Dashboard**: the file is returning the
  wrong `Content-Type`, a redirect, or a 404. Hit the `/.well-known/` URL
  directly with `curl -I` and confirm a 200 + `text/plain`.
- **Preview deploys**: each Vercel preview has a unique subdomain. Not
  worth verifying individually — test Apple Pay on staging / prod only.

## Current status (as of Apr 22, 2026)

| Item | Status |
|------|--------|
| `public/.well-known/apple-developer-merchantid-domain-association` | ✅ Committed (`a02f70e`) — real Stripe blob, 9094 bytes |
| `vercel.json` rewrite for `/.well-known/:path*` | ✅ In place — serves file as static, no redirect |
| Stripe Dashboard domain registration for `vettit.ai` | 🔲 **Pending — Jamil must do this step** |
| Stripe Dashboard "Verify" clicked | 🔲 Pending |
| Apple Pay button visible on Safari iOS with Wallet card | 🔲 Pending |

## HOW TO FINALIZE (the one remaining step)

The domain association file is already deployed at:

```
https://vettit.ai/.well-known/apple-developer-merchantid-domain-association
```

Verify it's live before clicking "Verify" in Stripe:

```bash
curl -sI https://vettit.ai/.well-known/apple-developer-merchantid-domain-association | head -5
# Expect: HTTP/2 200, Content-Type: text/plain (or application/octet-stream)
```

Then in Stripe Dashboard:

1. Go to **Settings → Payments → Apple Pay**
2. Click **Add new domain**, enter: `vettit.ai` (no https://, no trailing slash)
3. Stripe will attempt to fetch the file from the URL above
4. Click **Verify** — should flip to "Verified" within seconds
5. Test on Safari iOS: open the payment modal, you should see the black Apple Pay button

That's it. No code changes needed.

---

## Where the code lives

`src/components/dashboard/VettingPaymentModal.tsx` — see the JSDoc comment
above the `useEffect` that calls `stripe.paymentRequest(...)` for a summary
of the browser-side availability rules.
