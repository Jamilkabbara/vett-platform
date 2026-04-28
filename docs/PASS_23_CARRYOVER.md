# Pass 23 — Pass 22 Carryover Status

Status of every Pass 22 carryover item as of 2026-04-28.

| # | Item | Status | Reference |
|---|---|---|---|
| 1 | **Bug 22.23** root cause — Stripe Element ready-event error / orphan PIs | ✅ **CLOSED** | Bug 23.0e v2 (Stripe Checkout migration). See `PASS_23_PROGRESS.md` § Pass 22 carryover close-out. |
| 2 | **Obsoleted bug ledger** — 22.11, 23.0a, 23.0c stage, 23.0e v1 | ✅ **DOCUMENTED** | `docs/PASS_23_OBSOLETED_BUGS.md` |
| 3 | **6 historical pending_payment orphans** | 🟡 **QUEUED — Jamil-driven** | Manual Stripe Dashboard reconciliation (search PIs by `metadata.missionId`, decide refund/release/recover per row). Not code-shippable. |
| 4 | **Bug 22.10b** — webhook event reprocess cron Job 3 | ⏸️ **DEFERRED** | 0 stuck webhook events in production telemetry. No signal to ship. Re-evaluate when telemetry surfaces stuck rows. |
| 5 | **Bug 22.12b** — drop unused indexes | ⏸️ **DEFERRED 1–2 weeks** | Production traffic needs to exercise the new FK indexes added in 22.12. Audit chat will re-poll `pg_stat_user_indexes` mid-Pass-23 to identify which indexes still show 0 `idx_scan` and ship the drops then. |

---

## Detail

### #1 — Bug 22.23 closure

The Pass 22 closeout report flagged Bug 22.23 as "telemetry-first deferred to
Pass 23 — pick a targeted fix from actual stage/error_code distribution once
24-48h of failure data accumulates."

The data accumulated. Pattern was: Safari macOS reproducing the
"Element is not mounted and ready event has not emitted" error
across multiple defensive layers (Pass 22 ready-event gating,
Pass 23 v1 2-frame rAF defer + 5s timeout + retry + telemetry).

**Decision:** rather than ship a fourth defensive patch, surrender
the Stripe Elements UX entirely. Migrate to Stripe-hosted Checkout.

**Outcome:** the failure mode is structurally impossible to reproduce
in our app — there's no inline iframe lifecycle to fail. Stripe
Checkout's hosted page has its own mount path that runs on
`checkout.stripe.com`, not on our domain.

The telemetry-first approach held up: the data was the basis for the
architectural call, not the patch.

### #3 — 6 historical pending_payment orphans

These are mission rows in `status='pending_payment'` whose underlying
Stripe PaymentIntent is in `requires_payment_method` (or stale)
state. Pass 22 cron Job 1 alerts on these but does not auto-resolve.

**Why Jamil-driven:** each orphan needs a human decision —
- Was the user successfully charged via a different PI? (Recover the row.)
- Did Stripe mark the PI failed and the row should revert to draft? (Reset.)
- Was the user double-charged? (Refund + reset.)

A blanket auto-resolve would risk double-refunding paid users or
deleting legitimately-paying missions.

**Action:** Jamil reviews each row in Stripe Dashboard, decides per
row, manually executes via the Admin tooling.

### #4 — Bug 22.10b webhook event reprocess

Cron Job 3 was specced to scan `stripe_webhook_events` for rows
where `processed_at IS NULL` past the receive timeout (i.e. the
webhook arrived but the handler crashed mid-processing). Re-runs
the handler for each.

**Why deferred:** 0 stuck rows in production. `claimWebhookEvent` +
the `mode: 'reprocess'` path inside the existing webhook entry
already cover the crash-recovery case at re-arrival time. A separate
cron is only needed if we accumulate orphans (i.e. webhooks that
never re-arrive). The partial index `idx_stripe_webhook_events_unprocessed`
exists; the cron just isn't built. Build when telemetry justifies.

### #5 — Bug 22.12b unused indexes

Bug 22.12 added 9 FK indexes for the join performance fix. Per
PostgreSQL convention, new indexes can take time to be exercised
by production query patterns; dropping any with `0 idx_scan`
prematurely would risk regressing query plans that haven't yet
fired in steady-state.

**Action:** Pass 23 mid-batch (planned for the A9 admin batch) re-poll
`pg_stat_user_indexes`:
```sql
SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE indexrelname LIKE 'idx_missions_%'
   OR indexrelname LIKE 'idx_mission_responses_%'
   OR indexrelname LIKE 'idx_chat_%'
ORDER BY idx_scan;
```
Drops any with `idx_scan = 0` after ≥1 week of production traffic.
