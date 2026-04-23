# Pass 14 — Profile, Admin Dashboard & Real-Time AI Cost Tracking

**Branch:** `pass-14-profile-admin`  
**Date:** 2026-04-23  
**Commits (frontend):** 5 | **Commits (backend):** 2

---

## Summary

Pass 14 delivers three major capability areas: a rebuilt Profile page, a full admin dashboard with real-time analytics, and funnel tracking instrumentation across the product.

---

## Tasks Completed

### Task 1 — Fix hardcoded "John Maverick" ✓
- Created `src/hooks/useUserProfile.ts` — fetches `profiles` table, computes `displayName`, `initials`, `memberSince`
- Rewrote `UserMenu.tsx` to self-fetch via `useUserProfile()` (no props required)
- Updated `SettingsPage.tsx` to use `profile?.displayName` and `profile?.email` instead of hardcoded defaults
- **Commit:** `b81bf76`

### Task 2 — DB Migrations ✓ (applied in Supabase)
- Added `role TEXT`, `project_stage TEXT` columns to `profiles`
- Added `is_admin BOOLEAN NOT NULL DEFAULT false` to `profiles`
- Created `funnel_events` table (`user_id`, `event_name`, `properties JSONB`, `created_at`)
- Created `admin_user_notes` table (`user_id`, `admin_id`, `content`, `created_at`)
- Set `is_admin = true` for Jamil's profile (ID `82405ff9-0437-4537-9718-e56113213453`)

### Task 3 — Rebuild ProfilePage with 4 tabs ✓
**Commit:** `e0ac8e1`

New file structure:
- `src/pages/ProfilePage.tsx` — tabbed shell with pill nav (Account / Billing / Payment Methods / Security)
- `src/components/profile/AccountTab.tsx` — first/last name, email (readonly), role pills (6 options), project stage pills (5 options), company + VAT save via Supabase upsert
- `src/components/profile/BillingInvoicesTab.tsx` — KPI row (total spent, mission count, avg order) + invoice table + mobile card view + PDF download
- `src/components/profile/PaymentMethodsTab.tsx` — saved card list, Apple Pay row, add card CTA
- `src/components/profile/SecurityTab.tsx` — real Supabase password update, 2FA coming-soon stub, DELETE confirmation danger zone

### Task 5 — 8 Admin RPC Functions ✓ (applied in Supabase)
Functions: `admin_ai_cost_summary`, `admin_ai_cost_by_operation`, `admin_ai_model_mix`, `admin_mission_margins`, `admin_activity_feed`, `admin_funnel`, `admin_user_segments`, `daily_revenue_buckets`

### Task 6 — Backend Admin API Endpoints ✓
**Commit (backend):** `2e9888d`

Enhanced/new endpoints in `src/routes/admin.js`:
- `GET /api/admin/overview` — RPC-based KPIs with period deltas, funnel, segments, activity feed, mission type mix
- `GET /api/admin/revenue` — daily buckets, goal breakdown, period comparison
- `GET /api/admin/ai-costs` — full RPC breakdown (summary, by_operation, model_mix, margins, daily buckets) with deltas
- `GET /api/admin/missions` — paginated, searchable, user-enriched with margin_usd
- `GET /api/admin/users` — paginated with per-user mission stats
- `GET /api/admin/users/:id` — full profile + missions + notes + totals
- `POST /api/admin/users/:id/notes` — CRM note creation
- `GET /api/admin/insights` — Claude-generated insights with 6h in-process cache
- `POST /api/admin/insights/refresh` — force regenerate insights

### Tasks 7-12 — Admin Dashboard Components ✓
**Commit:** `fb8f05f`

`src/pages/AdminPage.tsx` rebuilt as sidebar layout (Analytics / Data / Growth / Content groups).

New components:
- `AdminOverview` — 4 KPI tiles, conversion funnel, user segments, activity feed, mission type mix; 60s auto-refresh + Supabase realtime on `missions`
- `AdminRevenue` — daily area chart (revenue vs cost), goal breakdown bars, 4 KPIs with deltas
- `AdminAICosts` — operations table, model mix bars, daily chart, 30s poll + realtime on `ai_calls`, tiering savings
- `AdminUsers` — paginated/searchable table + `UserDetailDrawer` (profile, missions, notes, POST note)
- `AdminMissions` — paginated/filterable table (search + status filter), force-complete, delete
- `AdminCRM` — lead table + new lead form + CSV export
- `AdminBlog` — post table + new post form + AI generation trigger + publish toggle
- `AdminSupport` — coming-soon stub

### Task 13 — Funnel Tracking Instrumentation ✓
**Commits:** `fd1de29` (frontend), `56cfa2c` (backend)

- `src/lib/funnelTrack.ts` — fire-and-forget Supabase insert into `funnel_events`
- `LandingPage.tsx` — `landing_view` on mount
- `MissionSetupPage.tsx` — `mission_setup_started` on mount, `mission_setup_completed` on insert
- `VettingPaymentModal.tsx` — `mission_paid` on card and wallet payment success
- `webhooks.js` — `mission_paid` on `payment_intent.succeeded` (server-authoritative)
- `runMission.js` — `mission_completed` when mission finishes processing

### Task 14 — Set is_admin ✓
Jamil's profile (`82405ff9-0437-4537-9718-e56113213453`) has `is_admin = true`.

### Task 15 — Remove vett-user-journey-mock.html ✓
**Commit:** `6be8881` — deleted 4669-line prototype file

---

## Architecture Notes

### Funnel Events Schema
```
funnel_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  event_name  TEXT NOT NULL,
  properties  JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
)
```

### Admin Insights Cache
In-process `Map`-style object (`_insightsCache`) with 6h TTL. Claude Opus 4.6 generates a JSON blob with `headline`, `insights[]`, `opportunities[]`, `risks[]`. No Redis required.

### Realtime Subscriptions
- `AdminOverview` → `postgres_changes` on `missions` (INSERT/UPDATE) → debounced re-fetch
- `AdminAICosts` → `postgres_changes` on `ai_calls` (INSERT) → re-fetch + set `isLive = true`

---

## Files Changed

**Frontend (pass-14-profile-admin branch):**
```
src/hooks/useUserProfile.ts                      (new)
src/lib/funnelTrack.ts                           (new)
src/pages/ProfilePage.tsx                        (rebuilt)
src/pages/AdminPage.tsx                          (rebuilt with sidebar)
src/pages/LandingPage.tsx                        (tracking added)
src/pages/MissionSetupPage.tsx                   (tracking added)
src/components/shared/UserMenu.tsx               (real user data)
src/components/profile/AccountTab.tsx            (new)
src/components/profile/BillingInvoicesTab.tsx    (new)
src/components/profile/PaymentMethodsTab.tsx     (new)
src/components/profile/SecurityTab.tsx           (new)
src/components/admin/AdminOverview.tsx           (new)
src/components/admin/AdminRevenue.tsx            (new)
src/components/admin/AdminAICosts.tsx            (new)
src/components/admin/AdminUsers.tsx              (new)
src/components/admin/AdminMissions.tsx           (new)
src/components/admin/AdminCRM.tsx                (new)
src/components/admin/AdminBlog.tsx               (new)
src/components/admin/AdminSupport.tsx            (new)
src/components/dashboard/VettingPaymentModal.tsx (tracking added)
vett-user-journey-mock.html                      (deleted)
```

**Backend (main branch):**
```
src/routes/admin.js       (enhanced: +7 endpoints, RPC-based, insights cache)
src/routes/webhooks.js    (funnel event on payment)
src/jobs/runMission.js    (funnel event on completion)
```
