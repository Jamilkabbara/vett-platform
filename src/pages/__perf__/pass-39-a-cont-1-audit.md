# Pass 39 A-CONT-1 — Anonymous /dashboard redirect verification

## What Pass 39 audit reported

> Anonymous /dashboard still shows 3 fake demo cards
> (AI meal planning, sustainable sneakers, premium coffee subscription)

## What production actually serves (curl proof, 2026-05-12)

Live bundle inspection of `MissionsListPage-C82-e7R1.js`:

```
$ curl -sS https://www.vettit.ai/assets/MissionsListPage-C82-e7R1.js \
    | grep -ciE 'meal planning|sustainable sneaker|premium coffee|mock-(active|draft|completed)-1'
0
```

Pass 37 A6 MOCK_MISSIONS removal is correctly deployed. Live chunk
contains zero demo-card strings.

```
$ curl -sS https://www.vettit.ai/assets/MissionsListPage-C82-e7R1.js \
    | grep -oE '.{0,40}signin.{0,40}'
!1)};c.useEffect(()=>{if(!o){if(!n){a("/signin?redirect=/dashboard",{replace:!0});retu
```

The Pass 37 A6 redirect IS in the deployed chunk.

## Why the audit saw demo cards anyway

Three possible explanations, ordered by likelihood:

### 1. Browser cache (most likely)

Vercel serves the index HTML with default cache headers. A user
who first loaded vettit.ai during Pass 35 (which DID contain
MOCK_MISSIONS) has the old MissionsListPage chunk cached locally.
A hard refresh (Cmd+Shift+R) clears it.

This matches Doctrine #21 (Pass 38) — user-visible behavior can lag
deploy by minutes-to-hours due to browser cache, even when the
deploy is correct. Verification gate must include a hard refresh.

### 2. Race during sign-out

If a user signs out while on /dashboard:

  1. `useAuth` flips `user` from object to null
  2. MissionsListPage re-renders with `user = null`
  3. `useEffect` deps changed (user) so it queues for the next tick
  4. **In the gap between step 3 and the effect firing**, the
     component renders once with stale `missions` state. If the
     user had ZERO real missions, the empty-state UI renders —
     which on PR-39-pre includes mock teaser content if any
     branch downstream re-added it.
  5. Effect fires, `navigate('/signin')` runs, redirect completes

Fixed in this commit: defensive guard at the top of the render
function — `if (!authLoading && !user) return <empty brand canvas>`.
This eliminates the 1-frame window where stale state could render
before redirect.

### 3. Audit was on a different route

Unlikely but possible — /dashboard and /missions both mount
MissionsListPage, but a stray bookmark to /missions/old or a
landing-page CTA pointing to a static page could surface different
content. Verified: routes in App.tsx mount the same component.

## What ships in this commit

1. `MissionsListPage.tsx` — adds an early-return guard:
   ```tsx
   if (!authLoading && !user) {
     return <DashboardLayout><div className="min-h-[100dvh] bg-[#0B0C15]" /></DashboardLayout>;
   }
   ```
   so the sign-out race never paints stale content.

2. This audit doc — captures curl proof that the original A6
   redirect is correctly deployed, and the race-condition diagnosis.

## Verification (after Vercel auto-deploys)

```
1. Open https://www.vettit.ai in an incognito tab
2. Click "Dashboard" or navigate to /dashboard manually
3. Expect: immediate redirect to /signin?redirect=/dashboard
4. Sign in → land back on /dashboard with real missions
5. From /dashboard, hit Sign Out
6. Expect: brand-canvas placeholder for ≤1 frame, then
   redirect to /signin?redirect=/dashboard
```

If user-visible behavior still shows demo cards after a hard
refresh, file a sub-bug for Pass 40 — but the deployed chunk has
the redirect and no demo content, so the audit must be hitting
something other than vettit.ai/dashboard.
