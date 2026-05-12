# Pass 39 A-CONT-2 — Landing $9 single source verification (2026-05-12)

## What Pass 39 audit reported

> Landing page still says "$35" in hero stat card (A8 not deployed/working)
> Still "Surveys from $35" + "$35 Starting price per mission"

## What production actually serves (curl proof)

### Served HTML

```
$ curl -sS https://www.vettit.ai/ -A 'Mozilla/5.0' | grep -c '\$35'
0
```

The HTML shell contains zero `$35` strings. Passes the Pass 39
prompt's explicit verification gate.

### LandingPage source location

Pass 29 A3 promoted LandingPage from lazy-loaded to eager-imported
(LCP fix — one fewer RTT). The Pass 37 A8 changes therefore live
in the main `index-XXXX.js` bundle, not in a `LandingPage-XXXX.js`
chunk (no such chunk exists).

### Live index chunk inspection

```
$ curl -sS https://www.vettit.ai/assets/index-C3P95iVR.js > idx.js
$ grep -oE '"\$[0-9,]+"' idx.js | sort | uniq -c
   1 "$1,499"   ← brand_lift enterprise tier
   1 "$1,990"   ← validate enterprise tier
   1 "$19"      ← CA sniff test tier
   1 "$249"     ← (other internal)
   2 "$299"     ← validate deep_dive / brand_lift tracker
   1 "$35"      ← Validate tier label (10 personas, correct)
   1 "$39"      ← CA validate tier
   1 "$599"     ← brand_lift wave
   1 "$79"      ← (internal)
   1 "$899"     ← validate scale
   1 "$9"       ← Sniff Test tier (5 personas)
   2 "$99"      ← brand_lift pulse / others
```

Exactly **one** `$35` in the entire deployed bundle, and it's the
Validate tier card label (10 personas, $35 — accurate per
VOLUME_TIERS).

### Hero + footer + StatCard + comparison row inspection

```
"Surveys from ", { children: ["$", F] }
```

`F` is the minified `STARTING_PRICE_USD` constant = `9`. Rendered:
**"Surveys from $9"**.

```
"Starting price", `From $${F}`, "$10,000+ per study", "Free but limited"
```

Rendered: **"Starting price | From $9 | $10,000+ per study | Free but limited"**.

```
"No subscription · Pay per mission · From $", F, " · 150+ markets · ..."
```

Rendered: **"No subscription · Pay per mission · From $9 · ..."**.

```
"Starting price per mission. No subscriptions, ever."
```

(StatCard `n` value uses `$${F}` = "$9" from the source.)

All four user-visible "starting price" sites read from
`STARTING_PRICE_USD`. Pass 37 A8 is correctly deployed.

## Why the audit saw "$35"

Same diagnosis as A-CONT-1 — browser cache. A user who first
loaded vettit.ai during Pass 35 (which had hardcoded `$35` in
six landing copy sites) has the old `index-XXXX.js` chunk cached.
Hard refresh forces a re-fetch of the new chunk.

Doctrine #21 (Pass 38) applies: deploy is correct, /version.json
SHA matches origin/main, live chunk inspection confirms. The
audit was hitting cached state.

## What ships in this commit

Nothing functional changes. This audit doc captures:
  1. Curl proof
  2. The chunks-where-Landing-lives mapping (eager vs lazy)
  3. The exact JSX render strings for each pricing site
  4. The user-side hard-refresh recommendation

## Pass 40+ hardening idea

Consider Vercel cache-control on the entry HTML to force browsers
to re-fetch on every visit. Trade-off: slightly slower repeat
visits but no chunk-cache-staleness reports going forward. Track
as separate issue.

## Verification

```
$ curl -s https://www.vettit.ai/ | grep -c '\$35'
0  ← passes
```

After hard refresh, landing hero shows "Surveys from $9", stat card
"$9 Starting price per mission", footer "From $9". Validate tier
card correctly shows "$35" because that IS the price of the 10-persona
Validate tier (it's a tier label, not a starting-price claim).
