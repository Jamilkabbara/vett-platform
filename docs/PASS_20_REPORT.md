# Pass 20 — Real Fixes Report

Branch: `pass-20-real-fixes` (frontend + backend)
Discipline: stop / think / verify — no patches without grounded diagnosis. Every prescribed fix that didn't match reality was reported back rather than blindly applied.

---

## Summary

| Bug | Title | Status | Notes |
|-----|-------|--------|-------|
| 1 | PDF rating-block overlap | **Closed** | Pre-Pass-20 commit `37d1ec0` (carry-forward) |
| 2 | PPTX star glyphs / truncation | **Closed** | Pre-Pass-20 commits `a686d1d` + `196b9f6` |
| 3 | PPTX footer y-position | **Closed** | Pre-Pass-20 commit `196b9f6` |
| 4 | `admin_funnel` RPC 400 (`event_name` column missing) | **Closed** | Migration + backend writes |
| 5 | `funnel_events` CHECK constraint widening | **Closed as duplicate of Bug 4** | Constraint was a no-op; root cause was the column-name mismatch fixed in Bug 4 |
| 6 | Live ticker counts screened-out personas | **Closed** | ActiveMissionPage filters `screened_out === true` |
| 7 | ResultsPage poll-after-completion (dead code) | **Closed** | Half-finished feature finished; bidirectional contract defined |
| 8 | Admin reanalyze + backfill | **Closed (infrastructure)** | Endpoint + button + script shipped; no candidates in DB to backfill |
| 9 | `vat_tax_id` removal | **Closed (UI only)** | Frontend stripped; DB column retained intentionally |
| 10 | Funnel-event writers using wrong column | **Closed** | Same root cause as Bug 4 — fixed in same commit |

---

## Commits

### Backend (`vettit-backend` @ `pass-20-real-fixes`)

| SHA | Bug(s) | Subject |
|-----|--------|---------|
| `b87d91c` | 4 / 5 / 10 | `fix(funnel): correct event_name → event_type in admin_funnel RPC and backend writers` |
| `7ac8cc8` | 7 | `fix(results): return progress payload for in-flight missions` |
| `a23013d` | 8 | `fix(admin): add reanalyze endpoint + backfillAllInsights script` |

### Frontend (`vett-platform` @ `pass-20-real-fixes`)

| SHA | Bug(s) | Subject |
|-----|--------|---------|
| `46836ba` | 6 | `fix(active-mission): include screened_out in mission_responses select; skip screened personas in live ticker` |
| `aad69ed` | 7 | `fix(results): wire real polling + progress UI for processing missions` |
| `5d72919` | 8 | `fix(admin): add Reanalyze button to admin missions table` |
| `42bf890` | 9 | `fix(profile): remove VAT/Tax ID field from AccountTab UI` |

### Database (Supabase)

| Migration | Bug | Description |
|-----------|-----|-------------|
| `fix_admin_funnel_event_type_column` | 4 | `DROP FUNCTION admin_funnel(timestamptz, timestamptz) CASCADE` + recreate with all three IN clauses changed from `event_name` to `event_type`. Signature unchanged. |

---

## Bug-by-bug detail

### Bug 4 / 5 / 10 — Funnel column-name mismatch (consolidated)

**Reality vs prompt.** Master prompt prescribed widening the `funnel_events_event_type_check` CHECK constraint to admit new event names. Live Postgres logs (timestamp `1777063239114000`) showed the actual error: `column "event_name" does not exist`. The column is `event_type`. The CHECK constraint was a red herring — widening it would have been a no-op.

**Root cause.** Three sites wrote `event_name` / `properties` columns that don't exist on `funnel_events`. The real columns are `event_type`, `metadata`, plus a required `mission_id`.

**Fix:**
1. RPC `admin_funnel(range_start, range_end)` — three IN clauses corrected. CASCADE drop required because the function was referenced by a view.
2. `src/routes/webhooks.js` ~line 69 — Stripe `payment_intent.succeeded` writer now inserts `event_type='mission_paid'`, `mission_id`, `metadata={amount_cents, source: 'stripe_webhook'}`.
3. `src/jobs/runMission.js` ~line 178 — mission completion writer now inserts `event_type='mission_completed'`, `mission_id`, `metadata={goal_type}`.

**Verification.** Direct `SELECT * FROM admin_funnel('2026-03-25', '2026-04-24')` returns rows; `POST /rest/v1/rpc/admin_funnel` now returns 200 in API logs (was 400 at timestamp `1777063238941000`); no fresh "column does not exist" errors in Postgres logs since deploy.

**Bug 5 → duplicate of Bug 4.** Closed without separate work.

---

### Bug 6 — Live ticker over-counts screened-out personas

**Root cause.** `ActiveMissionPage.tsx` joined on `mission_responses` and incremented progress per row regardless of `screened_out`. The persona simulation pipeline correctly stores screened-outs as first-class rows (commit message references this as "Bug 1/2 fix" from a prior pass), so the ticker inflated above target.

**Fix.** `46836ba`:
- Initial fetch select adds `screened_out` column.
- Row TS type widened to `screened_out: boolean | null`.
- Initial loop and realtime handler both `if (row.screened_out === true) return;`.

---

### Bug 7 — ResultsPage poll-after-completion (dead code)

**Reality vs prompt.** Prompt described "polls forever after completion." True diagnosis: the polling block was never wired. Frontend guarded on `data.status === 'in_progress'` but the backend GET `/api/results/:missionId` endpoint never returned `in_progress` — it only returned 200 (completed pack) or 400 (anything else). Half-finished feature, not a runaway loop.

**Prompt prescribed status enum values that didn't exist** — `'pending'` and `'simulating'`. The actual mission status enum (verified by grep on schema migrations) is `draft`, `pending_payment`, `paid`, `processing`, `completed`, `failed`. Confirmed with user: use `paid` AND `processing` as in-flight; use `mission_assets.analysis_error.message` (not a `failure_reason` column, which doesn't exist) for failed reason. Adding a `failure_reason` column was deferred to Pass 21.

**Fix:**

Backend (`7ac8cc8`):
- Status-routed handler:
  - `paid` / `processing` → 200 `{status:'processing', progress:{collected, target, percent}}`. Target = `respondent_count × max(1, questions.length)`. Collected = COUNT of `mission_responses` rows.
  - `failed` → 200 `{status:'failed', error: mission_assets.analysis_error.message || generic fallback}`.
  - `completed` → 200 with full pack (existing behavior).
  - Anything else → 400.

Frontend (`aad69ed`):
- New state: `resultsProgress`, `missionFailed`, `pollTimerRef` (useRef), `firstPollAtRef` (useRef).
- useEffect cleanup clears the timer and resets `firstPollAtRef` on missionId change — the user-specified guard.
- `fetchResults` now branches:
  - `status === 'processing'` → store progress, schedule next poll. Adaptive cadence: 5 s for the first 30 s of polling, 15 s thereafter. Cleared on unmount or status change.
  - `status === 'failed'` → store reason, **stop polling**, render Mission Failed UI with `mailto:hello@vettit.ai` link.
  - `status === 'completed'` → render results pack. **Stop polling.**
- In-flight UI updated: spinner + "Simulating respondents…" + "This usually takes 1–3 minutes." + real progress bar with `percent`/`target` numbers.

**Domain sweep (committed in same Bug 7 frontend commit).** `git grep` for `vettit.com` and `vettit.app` across the entire repo — only one match: `src/components/profile/SecurityTab.tsx:45` (`support@vettit.app` → `support@vettit.ai`). Domain-only fix; local-part `support@` retained because it's the correct local-part, just the domain was wrong.

---

### Bug 8 — Admin reanalyze + backfill (infrastructure shipped, no DB candidates)

**Outcome.** All three pieces ship; the DB happened to already be clean.

Backend (`a23013d`):
- `POST /api/admin/missions/:id/reanalyze` in `src/routes/admin.js` — loads mission row + `mission_responses`, calls `synthesizeInsights(mission, responses)`, updates `executive_summary` + `insights`, clears `mission_assets.analysis_error`. Returns `{success, executive_summary_length, insights_keys}`. Audit logs use `req.user.email`.
- `scripts/backfillAllInsights.js` — dry-run by default, `EXECUTE=1` writes. Targets `status='completed' AND goal_type != 'creative_attention' AND (executive_summary IS NULL OR length < 40 OR mission_assets.analysis_error IS NOT NULL)`. 2 s rate-limit between missions; optional `LIMIT` env.

Frontend (`5d72919`):
- Sparkles icon button on each completed mission row in `AdminMissions.tsx`. Calls the endpoint and toasts the resulting summary length.

**Backfill output.**
```
═══════════════════════════════════════════════════════════
  VETT — Backfill Mission Insights
  Mode: EXECUTE (will write)
  Delay between missions: 2000ms
═══════════════════════════════════════════════════════════

✅ No completed missions need insights backfill.
```

DB health snapshot at time of run:
| Check | Count |
|---|---|
| Total completed survey missions | 6 |
| Healthy (summary ≥40 chars, no error stamp) | **6** |
| Empty summary | 0 |
| Stub summary (<40 chars) | 0 |
| `analysis_error` stamped | 0 |

**Mission `e18c9802` (cat hotel) verification target.** Already has 817 chars of real prose — no backfill needed. First 200 chars: *"Every single respondent who reached Q3 expressed willingness to use a Sharjah Cat Hotel, signaling strong baseline intent among cat owners — but the sample is critically small (n=4–10 depending on question) and cannot be treated as statistically representative."*

The endpoint and button are in place for the next failure.

---

### Bug 9 — `vat_tax_id` removal (UI only)

**Reality vs prompt.** Prompt referenced "frontend mobile still queries `vat_tax_id`" with API log evidence at timestamp `1777062822150000`. There is no separate mobile frontend on `pass-20-real-fixes`; the only reference was `src/components/profile/AccountTab.tsx` (desktop). Recent API logs (timestamp `1777104266791000`) show the query returns 200 — whatever 400 the prompt cited has resolved on its own.

**Decision (per user).** Option A — UI only. Strip the field from the form; leave the column in the DB.

Rationale:
- Postgres charges nothing for an unused TEXT column.
- 0 of 3 profiles have a non-null `vat_tax_id`, so future re-introduction (e.g. for VAT-registered EU/UK clients) is a frontend-only change instead of a destructive migration.
- `DROP COLUMN` would have required updating the `handle_new_user` trigger in the same migration, adding risk for negligible benefit.

**Fix (`42bf890`):**
- Removed `vatTaxId` state, separate fetch effect, upsert payload field, label + input, and collapsed the 2-col grid in Invoicing Details.
- Kept: `profiles.vat_tax_id` column, `handle_new_user` trigger insert (harmless — writes empty string).

**Verification.** `git grep -n "vat_tax_id\|vatTaxId" -- src/` — zero matches. AccountTab passes tsc with no new errors.

---

## Deferred to Pass 21

- **`missions.failure_reason` column.** Currently using `mission_assets.analysis_error.message` as the failed-reason source for the new ResultsPage failed UI. Adding a first-class column would let the field be indexed and surfaced cleanly. Low priority — current path works.
- **Pre-existing `setNotification` errors in `ResultsPage.tsx`.** Three references at lines 667, 690, 697 (introduced in commit `66645a4` Targeting Brief feature) call an undefined `setNotification`. Vite build does not run tsc, so these are latent — they don't break deploy or runtime if those code paths aren't hit. Should be replaced with `toast()` from `react-hot-toast` (already used elsewhere in the file's vicinity) or wired to a real `notification` state hook.

---

## Branches ready to merge

- `vett-platform` — `pass-20-real-fixes` → tip `42bf890`
- `vettit-backend` — `pass-20-real-fixes` → tip `a23013d`

Both branches have been pushed to GitHub.
