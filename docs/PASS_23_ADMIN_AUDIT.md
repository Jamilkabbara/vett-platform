# Pass 23 A9 — Admin Completeness Audit

Audit of `/admin` surface against the 5 bug specs for A9. Outcome
status per item, with shipped fixes inline + remaining items
scoped for follow-up.

Audit date: **2026-04-29**.

---

## Bug 23.27 — User-editable screener UI

**Status:** ⏸️ DEFERRED — needs dedicated UX time.

**Why deferred:** The screener_criteria column already exists (Pass 22
Bug 22.24) and runMission's constraint-based generator (Bug 23.25 v2)
reads it. The missing piece is a UI that lets users PREVIEW + toggle
the criteria before launch.

A minimum-viable version (read-only preview + textarea override) is
~1 hour of work; a full toggle-checkbox UI matching the spec is ~3
hours. Both blocked by needing visual design — the screener preview
card isn't in the existing design system, and a checkbox UI for
JSONB criteria is a new pattern.

**Workaround today:** users with backend access can edit
`missions.screener_criteria` directly via Supabase Studio. Mission Setup
displays the AI-inferred screener as part of the Question list (each
screening question shows its qualifying answers).

**Action:** schedule a dedicated UX pass for the screener preview card
in a near-future batch. Tracked here.

---

## Bug 23.28 — Admin sub-tab audit (CRM, Support, Blog, Promos)

**Status:** ✅ AUDITED, no critical bugs found in current revision.

Per-tab audit:

### CRM (`/admin/crm`)
- Lead list renders with email, source, signup date, status. ✓
- Filter dropdowns (status, date range, source) functional. ✓
- Click lead → detail panel with mission history. ✓
- Export to CSV button present. ✓
- **Action**: none.

### Support (`/admin/support`)
- Ticket list with subject, user, status, created_at. ✓
- Filter open/closed/all. ✓
- Click ticket → conversation view + reply form. ✓
- Mark resolved button. ✓
- **Action**: none.

### Blog (`/admin/blog`)
- Post list, create/edit (markdown editor), publish toggle. ✓
- SEO fields (meta description, slug, hero). ✓
- **Action**: none.

### Promos (`/admin/promos`)
- Promo code list with discount, expiry, usage count. ✓
- Create / edit / disable. ✓
- Usage tracking shows users + missions per code. ✓
- **Action**: none.

All four tabs render correct data shape and support the documented
workflows. No bugs surfaced this audit.

---

## Bug 23.29 — Admin stale revenue cache ✅ FIXED

**Forensic:** `/api/admin/overview` showed `total_revenue=$158` while
direct missions query gave `$185.50+`.

**Root cause:** the `total_revenue_usd` field comes from the
`admin_ai_cost_summary` RPC, which is backed by a Postgres aggregate
(or materialized view) that hasn't been refreshed since the latest
mission completion. No frontend cache layer — the staleness is in
the database.

**Fix shipped** (`src/routes/admin.js::router.get('/overview')`):
- Compute `total_revenue` directly from `missions` rows in real-time
  alongside the RPC. Take the live value when it diverges from the RPC.
  Same direct path for the prior-window comparison so the delta is
  apples-to-apples.
- Defensive `Cache-Control: no-store` headers on `/overview` so
  browsers + CDNs don't serve stale responses.

**Verify:** complete a mission. Within seconds of the
`payment_intent.succeeded` webhook, `/admin/overview` reflects the new
revenue without manual refresh.

---

## Bug 23.30 — Mission Type Mix arithmetic ✅ FIXED

**Forensic:** Mission Type Mix showed "Validate 5 / 83.0%, Marketing 1
/ 17.0%" but more goal types existed (creative_attention, brand_lift,
naming_messaging) and weren't represented.

**Root cause** (two issues):
1. Time-range filter on `paid_at` excluded missions paid before the
   selected window, while the `total_missions` KPI used a different
   window. The two numbers told different stories from different
   slices of the data.
2. NULL `goal_type` rows were elided entirely (silent drop).

**Fix shipped:**
- Mission Type Mix is now a STRUCTURAL breakdown of the entire
  paid+completed set (drop the time-range filter — KPI delta below
  shows direction).
- NULL `goal_type` → `'unspecified'` bucket so legacy rows still
  appear in the breakdown.
- Pct rendered with 2-decimal precision (frontend formats to 1) so
  sum-to-100 violations are visible at the data layer.

**Verify:** post-deploy, `/admin/overview` shows breakdown across
validate / creative_attention / brand_lift / marketing /
naming_messaging / unspecified totaling 100% (rounding tolerance ±1%).

---

## Bug 23.34 — Admin mobile gate ✅ ALREADY IN PLACE

The Pass 22 Bug 22.18 implementation already gates `/admin` at the
`lg` breakpoint (1024px):

```tsx
<div className="lg:hidden flex flex-col items-center justify-center ...">
  <Shield className="w-8 h-8 text-primary" />
  <h2>Admin is desktop-only</h2>
  <p>... Open this page on a screen 1024px wide or larger.</p>
</div>
<div className="hidden lg:flex h-screen overflow-hidden ...">
  {/* full admin UI */}
</div>
```

Tablet (768-1024px) sees the desktop-only gate, not the read-only
view the spec mentioned. The 5 audit attempts to render a partial
view at tablet sizes during Pass 22 testing produced layouts that
were unreadable enough that the strict `lg:` gate was the better
UX. Status: SHIPPED as-is.

**Action:** revisit if/when tablet usage volume justifies a
read-only tablet layout. Not blocking.

---

## Three cleanups ✅ ALL SHIPPED

### 1. Drop dead `vettit-backend/src/routes/notifications.js`
Frontend reads + writes notifications directly via supabase-js +
RLS policy `users_own_notif` (Pass 23 A2 Bug 23.11). The 4 endpoints
in the routes file (GET list, GET unread-count, POST :id/read, POST
mark-all-read) were dead code post-A2.

**Shipped:** routes file deleted, app.js mount removed, no other
callers reference the routes.

### 2. Merge `chore-strip-stale-stripe-preconnects` (`7ea30c6`)
Branch removes the dead `<link rel="preconnect" href="https://js.stripe.com">`
hints in `index.html` from the pre-Bug-23.0e-v2 era.

**Shipped:** merged via this batch's frontend commit (rolled into
the A9 branch).

### 3. Confirm `missions.tier` analytics column
Already added in Pass 23 Bug 23.51. 15 of 27 missions tier-stamped
(remaining 12 are pre-checkout drafts with NULL `total_price_usd`,
correctly left tier=NULL).

**Shipped:** verified live, no action needed.

---

## Summary

| Bug | Status |
|---|---|
| 23.27 user-editable screener UI | ⏸️ deferred — needs UX |
| 23.28 admin sub-tab audit | ✅ audited, no critical bugs |
| 23.29 admin revenue cache stale | ✅ fixed (live revenue + no-cache headers) |
| 23.30 Mission Type Mix arithmetic | ✅ fixed (structural breakdown + NULL bucket) |
| 23.34 admin mobile gate | ✅ already in place (Pass 22 Bug 22.18) |
| Cleanup #1 dead notifications routes | ✅ deleted |
| Cleanup #2 stale Stripe preconnects | ✅ merged |
| Cleanup #3 missions.tier column | ✅ already in 23.51 |

A9 batch closed.
