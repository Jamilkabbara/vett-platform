# Pass 22 — Design Decisions Log

Companion to `PASS_22_REPORT.md` (final ledger). This file captures decisions that diverge from the master prompt or that future advisor reviews / engineers might otherwise flag as regressions. Each decision is an explicit, documented choice — not an oversight.

---

## Decision 22.D1 — `is_admin_user(uuid)` retains EXECUTE for `authenticated`

**Master-prompt expectation:** Bug 22.6 calls for revoking EXECUTE on all 11 admin SECURITY DEFINER functions from PUBLIC, anon, and authenticated.

**What we did instead:** Revoked from PUBLIC and anon only on `is_admin_user(uuid)`. Authenticated retains EXECUTE.

**Why:** `is_admin_user` is referenced from RLS policy expressions on:
- `stripe_webhook_events`, `admin_alerts`, `payment_errors` (added in Pass 22 Bug 22.5)
- `funnel_events`, `admin_user_notes` (pre-existing)

PostgREST evaluates RLS policies as the calling role. Revoking from authenticated would break those policies with `permission denied for function is_admin_user` on every authenticated client read of the affected tables.

**Risk assessment:** The function returns only a boolean (`is uuid X the admin?`). Exposure to authenticated callers leaks at most one bit per probe — no admin data, no row contents, no PII. Acceptable.

**Advisor signal:** `authenticated_security_definer_function_executable` for `public.is_admin_user(uuid)` will remain on the WARN list. **This is intentional.** Documented in:
- `migrations/pass-22/02_bug_22_6_admin_rpc_lockdown.sql` (header comment + COMMENT ON FUNCTION)
- This decisions log

---

## Decision 22.D2 — Skip Bug 22.7 (leaked-password protection) — VETT is OAuth-only

**Master-prompt expectation:** Toggle `Authentication → Settings → Password Security → Prevent use of leaked passwords` in the Supabase dashboard to drop the `auth_leaked_password_protection` advisor WARN.

**What we did instead:** Did not enable. Documented as non-applicable.

**Why:** VETT uses Google OAuth (and Apple OAuth) exclusively. There is no email/password sign-up flow. Supabase moved leaked-password protection to `Authentication → Attack Protection → Prevent use of leaked passwords`, and the dashboard now requires configuring an email provider before the toggle is exposed. Enabling would mean:
1. Configuring an email provider VETT does not currently use.
2. Opening a new auth surface (email/password sign-up) that VETT has deliberately avoided.

That is the opposite of security hardening.

**Re-evaluation trigger:** If VETT ever introduces an email/password sign-up path, revisit this decision and enable the protection at that time.

**Advisor signal:** `auth_leaked_password_protection` will remain on the WARN list. **This is intentional.** Documented in this decisions log.

---

## Standing advisor end-state (post Pass 22)

| Level | Count | Items |
|---|---|---|
| ERROR | 0 | — |
| WARN  | 2 | `is_admin_user` authenticated EXECUTE (D1) · `auth_leaked_password_protection` (D2) |
| INFO  | 2 | `ai_calls` RLS-no-policy (pre-existing) · `crm_leads` RLS-no-policy (pre-existing) |

Both WARNs are intentional design decisions. Future advisor reviews should match this matrix. Any deviation is a real regression to investigate.
