# Pass 21 — Data Integrity & Forensic Remediation Report

**Branch (frontend):** `pass-21-data-integrity` (vett-platform)
**Branch (backend):** `pass-21-data-integrity` (vettit-backend)
**Doctrine:** one bug per commit, push between commits, verify with
PROOF (SQL output, curl trace, typecheck delta, forensic data),
STOP-AND-REPORT on architectural ambiguity.

---

## Bug index

| #  | Surface     | Title                                              | Path                                       | Status   |
|---:|-------------|----------------------------------------------------|--------------------------------------------|----------|
| 1  | Backend     | `kpis.active_users` counted mission rows, not users | admin.js distinct-Set                      | Done\*   |
| 2  | DB (RPC)    | `admin_funnel` signups read profiles, not auth      | RPC migration                              | Live     |
| 3  | DB (RPC)    | `signups` reconciliation: 11 (not 6)                | See DECISIONS.md                           | Live     |
| 4  | DB (RPC)    | `setup_started` derived from missions, not events   | RPC migration + DECISIONS.md               | Live     |
| 5  | DB          | Backfill qualification aggregates on missions       | Migration + RPC + columns                  | Live     |
| 6  | Frontend    | Option B qualification labelling                    | results UI                                 | Done     |
| 7  | (skipped — superseded by Bug 23)                                                                       | —        |
| 8  | Frontend    | Pricing display alignment                           | Setup pricing                              | Done     |
| 9  | Frontend    | Single-option screening callout                     | Question editor                            | Done     |
| 10 | DB + Backend | `handle_new_user` trigger hardening + backfill     | Migration + auth route                     | Live     |
| 11 | Frontend    | Remove dead "Payment Methods" tab                   | Profile page                               | Done     |
| 12 | Backend + Frontend | DELETE `/api/auth/account` end-to-end          | New endpoint + Security tab wiring         | Done\*   |
| 13 | Frontend    | Landing-page header reflects auth state             | Navbar                                     | Done     |
| 14 | Frontend    | Hero input flexbox overlap on narrow viewports      | Landing input `min-w-0`                    | Done     |
| 15 | Frontend    | Skeleton card grid on initial load                  | MissionsListPage                           | Done     |
| 16 | Backend + Frontend | Default respondent count 100/200 → 50          | claudeAI prompts + missions/pricing/Setup  | Done\*   |
| 17 | Frontend    | Chatbot reset window clarity                        | ChatWidget scopeMeta                       | Done     |
| 18 | Frontend    | Dead `setNotification` refs in ResultsPage          | setToast rewire                            | Done     |
| 19 | DB + Backend | `missions.failure_reason` column + persistence     | Migration + runMission + results route     | Live + Done\* |
| 20 | Backend + Frontend | Bulk reanalyze stale missions                  | New /admin endpoint + UI button            | Done\*   |
| 21 | Backend     | Polling runtime verification                        | Manual smoke test                          | **Deferred** |
| 22 | Backend     | Active-mission ticker verification                  | Manual smoke test                          | **Deferred** |
| 23 | Frontend    | Funnel unit-mixing (relabel + drop overall %)       | AdminOverview funnel section               | Done     |
| —  | Frontend    | Activity Feed UNKNOWN (audit-finding)               | AdminOverview field-name fix               | Done     |

\* "Done" with backend and/or JS-route changes — **not yet live in
production** because Railway and Vercel both deploy from `main` and
the branch is unmerged.

---

## Deployment topology — what's live, what isn't

The forensic audit caught a class of bug that's easy to miss:
which "fix" is live depends on whether the change is a SQL RPC or a JS
route.

  - **DB / RPC migrations** — applied directly to Supabase via
    `apply_migration`. **Live the moment they ran.** Bugs 2, 3, 4, 5,
    10 (trigger), 19 (column) are all live in production today.
  - **JS route changes** — deploy when Railway picks up `main`.
    Bug 1, Bug 12 backend, Bug 16 backend, Bug 19 backend, Bug 20
    backend are all sitting on the branch waiting for merge.
  - **Frontend changes** — deploy when Vercel picks up `main`. All
    of Bugs 6, 8, 9, 11-18, 20 frontend, 23, and Activity Feed are
    queued behind the merge.

This is why the live `/api/admin/overview` still reports
`active_users: 25` (Bug 1's fix exists at admin.js:89-95 in commit
`ab545f6` but Railway hasn't seen it). The fix is correct; the
deployment gap is the only thing between branch and live truth.

---

## Pass 22 followups (out of scope)

The Pass 21 forensic process surfaced four issues that aren't bugs in
the strict sense — they're separate work that warrants its own pass.

  1. **Frontend funnel logging fires for ~8% of expected events.**
     Bug 4 worked around this by deriving `setup_started` from the
     `missions` table directly (Path 2). The underlying telemetry gap
     remains: `mission_setup_started`, `payment_reached`, and probably
     other lifecycle events are emitted by only ~1 in 12 sessions.
     Likely culprits: ad-blockers, conditional load order, or
     useEffect-based emit tied to a state that doesn't always settle.

  2. **Toast styling has no error variant.** ResultsPage's `toast`
     state distinguishes only `isGenerating` (blue) from default
     (green). Errors render green. Bug 18 fixed the runtime crash but
     not this — Pass 22 should extend `ToastState` to a tone enum and
     apply a red variant.

  3. **Bug 1 read path consistency.** `kpis.active_users` was the
     specific KPI in Bug 1's master spec. The `funnel.signups` count
     uses a different code path (the RPC). They reconcile correctly
     today, but the dual code paths are fragile — Pass 22 could
     consolidate them on a single `admin_active_users(range)` RPC.

  4. **`mission_assets.analysis_error` legacy path.** Bug 19 added the
     top-level `failure_reason` column but kept the legacy JSON read
     path in /results so old failed rows don't regress. A migration
     to backfill failure_reason from mission_assets.analysis_error
     (where present) would let us drop the legacy fallback.

---

## Verification protocol — how each bug was proved

  - **DB / RPC bugs (2-5, 10, 19 column):** `pg_get_functiondef` to
    inspect the new function, then a SELECT to compute the live value
    matched against the master-prompt expected number.
  - **Backend route bugs (1, 12, 16 backend, 19 persistence, 20):**
    `node -c` syntax check, then code-review against the existing
    handler patterns. Live curl deferred to post-merge audit.
  - **Frontend bugs (6, 8, 9, 11-18, 20 frontend, 23, Activity Feed):**
    `npm run typecheck` with delta-against-baseline confirmation
    (zero new errors per commit). Visual verification deferred to
    post-merge audit.

The full PROOF for each bug lives in the commit body; the truth-table
for Bugs 3 and 4 lives in `PASS_21_DECISIONS.md`.

---

## Merge plan

  1. Close Bug 17, 18, 19, 20, 23 (done — this report).
  2. User runs full live audit on `pass-21-data-integrity` deploy.
  3. Merge `pass-21-data-integrity` → `main` on both repos.
  4. Confirm Vercel `target: production` deploy of `main` reaches READY.
  5. Confirm Railway pulls `main` for vettit-backend.
  6. Hit `/api/admin/overview` and confirm `active_users` returns 2,
     not 25 — the canary that proves Bug 1's fix is live.
  7. Live audit covers Bugs 1, 12, 16, 19, 20 (the JS-route fixes
     that were code-correct but unshipped before merge).
  8. Bugs 21 + 22 — manual runtime smoke test paid by Jamil.
