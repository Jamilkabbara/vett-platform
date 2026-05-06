# Apple Pay Domain Verification — Finalization Guide

> Status as of May 6, 2026 (Pass 29 A4)

---

## What's already done

| Item | Status |
|------|--------|
| `public/.well-known/apple-developer-merchantid-domain-association` | ✅ Committed (`a02f70e`) — real Stripe blob, 9094 bytes |
| `vercel.json` rewrite rule for `/.well-known/:path*` | ✅ In place — serves as static file, no redirect |
| `scripts/verify-apple-pay-domain.sh` | ✅ Pass 29 A4 — automated pre-Verify check |
| Stripe Dashboard domain registration for `vettit.ai` | 🔲 **Pending — one manual step remaining** |

---

## Pass 29 A4 verification helper

Before clicking **Verify** in the Stripe Dashboard, run:

```bash
./scripts/verify-apple-pay-domain.sh
# or for staging
./scripts/verify-apple-pay-domain.sh staging.vettit.ai
```

The script asserts:
1. HTTP 200 (catches the common case where vercel.json's SPA fallback
   matches `/.well-known/*` first and serves the index instead).
2. `Content-Type` is not `text/html` (catches the same SPA-fallback
   case at the MIME level — Stripe's verifier rejects HTML responses).
3. Response body is at least 9 kB (catches the case where a placeholder
   stub returned 200 but the actual blob isn't deployed).
4. First bytes match the Apple JSON hex signature (`7B227073...`).
5. Production size matches the committed file size.

If any assertion fails the script exits non-zero with a diagnostic. If
all pass, register the domain in Stripe Dashboard and the verification
flips to "Verified" within seconds.

---

## The one remaining step

The domain association file is already live at:

```
https://vettit.ai/.well-known/apple-developer-merchantid-domain-association
```

Before clicking Verify, confirm it responds correctly:

```bash
curl -sI https://vettit.ai/.well-known/apple-developer-merchantid-domain-association | head -5
# Expect: HTTP/2 200
```

Then in Stripe Dashboard:

1. Go to **Settings → Payment methods → Apple Pay**
2. Click **Add new domain**, enter: `vettit.ai` (no `https://`, no trailing slash)
3. Stripe fetches the file automatically
4. Click **Verify** — flips to "Verified" within seconds

No code changes or redeploys needed.

---

## Verify it worked

Open the payment modal on Safari iOS with a card in Wallet. The black Apple Pay button should appear above the card form.

**If button doesn't appear:**
- User has no card in Apple Wallet → nothing to fix
- Checking on localhost → Apple Pay is disabled on localhost, use staging/prod
- Chrome instead of Safari → Google Pay uses a different flow, not affected by this

---

## vercel.json rewrite reference

```json
{
  "rewrites": [
    { "source": "/.well-known/:path*", "destination": "/.well-known/:path*" },
    { "source": "/((?!.*\\.).*)", "destination": "/index.html" }
  ]
}
```

The first rule ensures `/.well-known/` files are served as static files before the catch-all SPA rewrite applies.
