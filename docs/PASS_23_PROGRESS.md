# Pass 23 — Progress

**Started:** 2026-04-25
**Status:** in flight
**Pass plan:** 71 bugs across Phase A (Stabilize) → Phase B (Grow) → Phase C (Expand)

---

## Bug ledger

| Bug | Backend SHA | Frontend SHA | Notes |
|---|---|---|---|
| 23.1–23.4 (A1 RLS) | `f542922` | — | RLS hardening on 4 tables (Path A: deny-all on `promo_codes` + admin lookups; user-own + admin-all on `ai_calls` to preserve realtime ticker — pushback that caught Bug 23.3 architectural issue). |
| 23.0a (Safari rAF) | `0927b8c` | `2c0c471` | Safari Element mount fix (2-frame rAF defer + 5s timeout + retry + mount-failure logger). **OBSOLETED by 23.0e v2** — see `docs/PASS_23_OBSOLETED_BUGS.md`. |
| 23.0c (anon errors logger) | `0927b8c` | `2c0c471` | Anon-friendly `/api/payments/errors/log` endpoint + `client_element_mount_timeout` stage. **STAGE OBSOLETED** by 23.0e v2; logger lib + endpoint retained. |
| 23.0d (PI metadata salvage) | `0927b8c` | — | Stripe metadata search for orphan PIs in /create-intent. Kept for Phase B API users; not used by Checkout flow. |
| 23.0e v1 (staged Elements hoist) | — | — | Never shipped. Superseded by 23.0e v2 full Checkout migration. |
| **23.0e v2** (full Stripe Checkout migration) | `f8caf10` + `8e4e3c6` (sanity guard) → merged `e1eba40` | `2312aa8` + `dde260b` (vendor-stripe manualChunk hotfix) → merged `342873c`/`5a6060b` | Backend: new `/create-checkout-session` + `/checkout-session/:id` routes, webhook handlers for `checkout.session.completed/expired/async_payment_failed`, `/buy-overage` rewritten as Checkout Session, `/create-intent` deleted. PI succeeded handler short-circuits on already-paid status (sanity guard). Frontend: deleted VettingPaymentModal/StripeElementsWrapper/OverageModal, new PayButton primitive, /payment-success polling page, /payment-cancel page, npm uninstall @stripe/react-stripe-js + @stripe/stripe-js, vendor-stripe chunk gone. Net −1488 lines on frontend. |
| **23.0f** (PaymentSuccess polling) | — | `4cff5fe` | 30s → 60s polling window; clarified delayed-state copy. |
| **23.25** (over-recruit + auto-refund) | `022d581` → merged `af0271c` | `34456cc` → merged `5a6060b` | New `overRecruit.js` helper (5× cap), runMission rewritten to over-recruit until qualified target hit, partial-delivery branch issues idempotent Stripe refund (key=`partial_refund:${missionId}`) + admin alert + email. Schema migration `pass_23_b25_delivery_status` adds 4 columns + backfills 4 historical underdelivered missions to `partial`. `paid_amount_cents` + `latest_payment_intent_id` re-stamped in PI succeeded handler. ResultsPage banner + MissionsListPage badge + landing copy rewrite. **Sub-find**: pre-existing silent bug — `runMission` was calling `sendMissionCompleteEmail` (no 'd'); function doesn't exist; optional chaining made the call silently no-op. **Users have not been receiving completion emails.** Fixed inline. |
| **23.PRICING** (4-tier volume ladder) | `c5b5cc6` | `656a964` | Backend + frontend pricingEngine swapped from country-tier to volume-tier (Sniff Test 5/$9, Validate 10/$35, Confidence 50/$99, Deep Dive 250/$299). Country-tier helpers retained for analytics. LandingPage tiers + Mission Setup PRESETS updated. |
| **23.GOAL** (audit + Creative Attention redirect) | — | `c9ecea7` | Audit doc `docs/PASS_23_GOAL_AUDIT.md`. Code fix: MissionSetupPage redirects `creative_attention` goal selection to `/creative-attention/new` (eliminates orphan-draft failure mode). Brand Lift label/expectation mismatch documented; no code change. |
| **A2 (23.11+23.12)** notification system | `49219f8` | `14a5a80` | RLS policy `users_own_notif`, NotificationBell rewrite (real data + realtime + per-type icons + 99+ badge), templated notification copy across 5 types, backfill of 9 historical rows. |
| **A3 (23.13+23.14)** mobile + slider | — | `330b0e8` | Mobile landing polish (`>_` prompt restored, tier-card stacking, "From $9" pre-footer); Mission Setup slider tier markers + Most Popular badge + live $/resp. |
| **A4 (23.31+23.32+23.33)** onboarding + email | — | `bb85c2b` | /missions empty-state tier shortcuts; Supabase auth email templates doc (`SUPABASE_EMAIL_TEMPLATES.md`); welcome email name fix. |
| **23.50** Creative Attention persist hotfix | `4998186` | — | Bare `.insert(...).catch()` → canonical `await + destructure`. Mission `f64eabcb` retroactively recovered. |
| **23.25 v2** constraint-based always-deliver | `0e6450a` | `ca91bf3` | Replaces over-recruit with constraint-based generation. delivery_status='full' always. Partial-refund branch deleted. Landing copy rewrite. |
| **23.58** Executive Summary centering | — | (within `ca91bf3`) | `max-w-3xl mx-auto`. |
| **23.51** goal-type-aware tier ladders | `eaf251f` | `9dda4fe` | Schema migration adds tier+media_type+media_url columns; backend per-goal ladders (VOLUME/BRAND_LIFT/CREATIVE_ATTENTION); frontend tabbed pricing teaser. |
| **23.53** provider-neutral copy | — | (within `9dda4fe`) | "Claude AI" → "VETT" / "Our AI". |
| **23.54** goal_type preservation through auth | — | (within `9dda4fe`) | sessionStorage + ?goal= URL param chain. |
| **23.59** math audit doc | — | (within `9dda4fe`) | `docs/PASS_23_MATH_AUDIT.md`. |
| **23.52** PaymentSuccess speculative fix + diagnostic emits | `93bab20` | `06ef617` | Anon-friendly polling endpoint + signed-out branch + 90s window + 5 diagnostic funnel emits. |
| **A9** admin completeness | `e4f7059` | `c022086` | Bug 23.29 admin revenue cache fresh; 23.30 Mission Type Mix arithmetic; 23.34 already in place; 23.27 deferred (UX); 23.28 audited clean; 3 cleanups shipped (notifications routes deleted, preconnect strip merged, missions.tier confirmed). |
| **23.55** collapse Creative Attention flow | — | — | ✅ **CLOSED — already-satisfied.** Existing `/creative-attention/new` is already a single-page upload + brand-context + flat-price form. Spec was based on misobservation of the live UX. Keep dedicated route (different pricing model — per-asset vs per-respondent). No code change. |

---

## Pass 22 carryover close-out

### ✅ Bug 22.23 — Stripe Element ready-event error / orphan PI sprawl

**CLOSED.** Root cause was Stripe Elements' iframe ready-event fragility on
Safari, particularly the macOS device matrix that reproduced "Element is not
mounted and ready event has not emitted" repeatedly across multiple defensive
layers (Pass 22 ready-event gating, Pass 23 v1 2-frame rAF defer + 5s timeout
+ retry + telemetry).

**Resolution date:** 2026-04-28
**Resolution mechanism:** Bug 23.0e v2 — full migration to Stripe-hosted
Checkout (redirect). Eliminates inline iframe lifecycle entirely. Stripe
Checkout's hosted page has its own battle-tested mount path that doesn't
rely on our DOM, so the fragility class is structurally impossible to
reproduce in our app.

**Telemetry-first decision held up:** the data we collected during Pass 22
(`payment_errors` rows by stage / viewport / UA) was the basis for the
"surrender Elements UX" call rather than yet another defensive patch. The
Bali Safari failure that wouldn't yield to any of three stacked defences
was the signal that the architectural choice was wrong, not the patches.

### 📁 Other carryover items

See `docs/PASS_23_CARRYOVER.md` — covers the deferred (22.10b, 22.12b),
the Jamil-driven (6 historical orphans), and the obsoleted set.

---

## Architectural decisions (this pass)

| # | Decision | Rationale |
|---|---|---|
| D1 | Path A on Bug 23.1 — deny-all on `promo_codes` (vs permissive read) | Permissive read leaked VETT100 + future free-launch codes via anon REST scrape. Architectural pushback caught pre-merge. |
| D2 | Bug 23.3 `ai_calls` user-own + admin-all (vs deny-all) | Realtime channels respect RLS; deny-all would silence the AdminAICosts realtime ticker. Architectural pushback caught the dependency. |
| D3 | Bug 23.0e v2 full migration over UA-detect Safari fallback | Surrender Elements UX entirely. Better to have one paying flow that works for everyone than a Safari fallback to maintain in parallel. |
| D4 | Bug 23.25 `qualified_respondent_count` capped at target for reporting | Prevents "12/10 over-delivered" weirdness on dashboards; extras still in `mission_responses`. |
| D5 | Bug 23.25 `paid_amount_cents` cached at PI succeed (not lookup at refund time) | Avoids extra Stripe round-trip in critical path; handles Stripe-side promo redemption. |
| D6 | Bug 23.PRICING accept boundary non-monotonicity (49 vs 50 personas) | Known consequence of value-based packaging; preset chips nudge to anchors. |
| D7 | Bug 23.GOAL — fix Creative Attention orphan UX, document Brand Lift, no code change | Brand Lift requires product call (rename vs build pre/post pipeline). |

---

## Production telemetry (as of 2026-04-28)

- **Mission ledger:** 8 completed (4 full, 4 partial). 3 brand_lift drafts (0 completed). 2 creative_attention drafts (0 completed — fix shipped).
- **AI cost average:** $0.1383 / mission. Cost guard armed at $0.75 (over-recruit cap = 3× scope-down trigger).
- **Backfill held:** 4 partial / 4 full post-merge — no regression.
- **Bundle hash (post 23.GOAL):** `index-DYhD72Cd.js`.
- **Notifications table:** 9 unread `mission_complete` rows (1 added since latest completion). All for Jamil's user. **A2 urgency confirmed** — bell either not mounted or badge logic broken.

---

## Open observations (logged for future batches)

1. **`missions.tier` analytics column** — add `ALTER TABLE missions ADD COLUMN
   tier text` + backfill from `volumeTier.id` so admin can answer "tier
   revenue mix". Schedule for A9 admin batch.
2. **Stale Stripe preconnect hints** in `index.html` — branch
   `chore-strip-stale-stripe-preconnects` (`7ea30c6`) ready to merge whenever
   convenient; no functional impact, just dead DNS hints.
