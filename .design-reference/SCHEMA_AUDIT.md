# Schema Audit — Prompt 3.5+ pre-fix snapshot

**Date:** 2026-04-21
**Scope:** every `.from('…')` / `.select('…')` / `.insert(…)` / `.update(…)` / `.upsert(…)` call in `src/**/*.{ts,tsx}` and every local `interface` that shapes a row read from `public.*`.

Sourced from a live `list_tables` + `execute_sql` via the Supabase MCP, cross-referenced against a project-wide grep.

---

## 1. Canonical schema (live from Supabase `public`)

### `public.missions`

Columns actually present:

```
id, user_id, title, status, country, target_audience (jsonb),
price_estimated (numeric), created_at, goal_type, brief, respondent_count,
targeting (jsonb), questions (jsonb),
base_cost_usd, targeting_surcharge_usd, extra_questions_cost_usd, total_price_usd,
promo_code, discount_usd,
paid_at, started_at, completed_at,
executive_summary, insights (jsonb),
ai_cost_usd, chat_cost_usd, chat_messages_used, chat_quota_limit,
creative_urls (text[]),
mission_assets (jsonb)   -- added Phase 10.5
```

There is **no** `context`, no `target`, no `estimated_price`, no `targeting_config`, no `result_data`, no `mission_statement`, no `name`.

### `public.profiles`

Columns actually present:

```
id, email, full_name, company_name, created_at,
first_name, last_name, company, user_role, project_stage,
avatar_url, plan, stripe_customer_id,
chat_quota_monthly, chat_quota_used_this_month, chat_quota_reset_at
```

There is **no** `name`, no `vat_tax_id`, no `updated_at`.

---

## 2. Drift inventory (file → line → wrong → correct)

### 2.1 `src/pages/MissionsListPage.tsx`

This page is currently fed by a backend REST endpoint (`api.get('/api/missions')`), but the local `Mission` interface — used for typing + for seeded mock rows — ships column names that don't exist in `public.missions`. Any code path that ever talks to Supabase directly through this interface will 404 the columns.

| Line | Wrong column | Correct column |
|---|---|---|
| 12 | `context: string` | `brief: string` |
| 13 | `target: string` | `target_audience: Json \| null` |
| 16 | `estimated_price: number` | `price_estimated: number` |
| 28, 38, 48 | seeded mock uses `estimated_price:` | `price_estimated:` |
| 127 | `mission.context \|\| 'Untitled Mission'` | `mission.title \|\| mission.brief \|\| 'Untitled Mission'` |
| 258 | `{mission.target \|\| 'General audience'}` | derive from `target_audience` jsonb |
| 279 | `${mission.estimated_price}` | `${mission.price_estimated}` |

### 2.2 `src/pages/ActiveMissionPage.tsx`

| Line | Wrong column | Correct column |
|---|---|---|
| 23 | `targeting_config?: any` (local interface) | `targeting?: Json` |
| 199 | `.update({ …, result_data: mockResults })` | no `result_data` column — write to `insights` jsonb (already exists and semantically correct) |

### 2.3 `src/pages/ResultsPage.tsx`

| Line | Wrong column | Correct column |
|---|---|---|
| 362 | `mission.mission_statement \|\| mission.name \|\| mission.context` | `mission.title \|\| mission.brief` |

(`ResultsPage` never calls `.from()` directly — mission is passed through `navigate` state — but the field names need to match what `MissionSetupPage` / `DashboardPage` actually persist.)

### 2.4 `src/pages/ProfilePage.tsx`

| Line | Wrong column | Correct column |
|---|---|---|
| 77 | `.select('name, company_name, vat_tax_id')` | `.select('first_name, last_name, full_name, company_name')` |
| 84 | `setName(data.name \|\| '')` | `setName([data.first_name, data.last_name].filter(Boolean).join(' ') \|\| data.full_name \|\| '')` |
| 86 | `setVatTaxId(data.vat_tax_id \|\| '')` | remove — column does not exist. If VAT field is required by the UI, add a separate migration; for now keep it as a local-state-only form field with a TODO, since this is an audit-first commit. |
| 100 | upsert `{ id, name, company_name, vat_tax_id, updated_at }` | upsert `{ id, first_name, last_name, full_name, company_name }` — drop `vat_tax_id` and `updated_at` (`updated_at` is not on profiles). Split `name` back into first/last before write. |

### 2.5 `src/pages/MissionSetupPage.tsx`

Insert payload on lines 394–408 uses the **correct** columns (`brief`, `goal_type`, `respondent_count`, `price_estimated`, `questions`, `target_audience`, `mission_assets`). No runtime drift.

Comment lines 47–57 still reference the **old** column names (`context`, `target`, `question`, `estimated_price`). Stale documentation only — clean up in Phase 1.

### 2.6 `src/pages/DashboardPage.tsx`

Verified clean. All three `.from('missions')` calls (lines 238, 297, 332, 374) reference `brief`, `target_audience`, `price_estimated`, `targeting`, `questions`, `mission_assets` — all present in the live schema.

### 2.7 `src/lib/missionAssetUpload.ts`

Three `.from('vettit-uploads')` calls — these are **storage bucket** calls, not table calls. Bucket exists and RLS is in place per Phase 10.5 migration. No drift.

---

## 3. Summary

- **1 table column that doesn't exist and is written to at runtime**: `missions.result_data` (ActiveMissionPage line 199) — will 400 on UPDATE the moment a mission completes.
- **4 profile columns that don't exist and are read / written at runtime**: `profiles.name` (read + write), `profiles.vat_tax_id` (read + write), `profiles.updated_at` (write). Will 400 on every profile save.
- **3 interface / display fields** that shadow real columns with fictional names (`MissionsListPage.Mission.context/target/estimated_price`). These don't crash today because the REST endpoint fills them, but they hide the real columns from anyone reading the type and invite future drift.
- **No `targeting_config` column exists** — the frontend consistently uses `targeting` when writing, but `ActiveMissionPage` locally types the field as `targeting_config`. Cosmetic but misleading.

Everything above is fixable without a migration. Phase 1 will resolve it.
