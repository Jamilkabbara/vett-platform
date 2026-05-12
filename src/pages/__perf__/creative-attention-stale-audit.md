# Pass 37 A5 — Creative Attention stale-mission audit

## Failure mode

A `goal_type='creative_attention'` mission can land in a state where:

  - `creative_analysis` JSONB is NULL
  - `status` is `'paid'` or `'processing'` (not `'failed'`)
  - Mission row hasn't been touched in >30 min

The CA pipeline timed out or crashed, but the backend never flipped
the row to `status='failed'`. The frontend used to poll forever on
this — May audit caught mission `91be5c7b` "processing" for 36 hours.

## Frontend fix (this pass)

`CreativeAttentionResultsPage` now:

1. **Staleness check on initial fetch** — if `created_at` is more
   than `CA_STALE_AFTER_MINUTES` (30) ago and no `creative_analysis`,
   short-circuit straight to the failure UI even when `status` is
   not `'failed'`. The `staleDetected` flag drives a softer copy
   that admits the pipeline got stuck rather than reporting an
   explicit failure (which would be a lie if the backend never
   flagged it).

2. **Poll timeout** — `CA_POLL_TIMEOUT_MINUTES` (5). Browsers
   that landed on a still-running mission used to camp the page
   indefinitely; now they get the failure UI after 5 min.

3. **Actionable failure UI** — adds a "Try a new analysis" CTA
   that routes to `/setup?goal=creative_attention` plus a refund
   notice. Old UI was a "contact support" dead end.

## Backend backfill (separate vettit-backend commit)

```sql
-- Pass 37 A5 — flip stale CA missions to status='failed' so the
-- frontend's explicit-failure path takes precedence over the
-- staleness heuristic. Conservative: only rows older than 1 hour
-- with NULL creative_analysis AND status not already 'completed'/
-- 'failed' are touched.
UPDATE public.missions
   SET status         = 'failed',
       failure_reason = COALESCE(failure_reason,
         'Creative analysis pipeline timed out (Pass 37 A5 backfill)')
 WHERE goal_type = 'creative_attention'
   AND creative_analysis IS NULL
   AND status NOT IN ('completed', 'failed')
   AND created_at < NOW() - INTERVAL '1 hour';
```

Audit query that should return 0 rows after backfill:

```sql
SELECT id, status, created_at
  FROM public.missions
 WHERE goal_type   = 'creative_attention'
   AND creative_analysis IS NULL
   AND status NOT IN ('completed', 'failed')
   AND created_at < NOW() - INTERVAL '1 hour';
```

## Forward policy

`services/ai/creativeAttention.js` should set `status='failed'` +
`failure_reason='<error message>'` on any catch path so the staleness
heuristic in the frontend is purely a safety net, not the primary
signal. A backend ticket tracks that hardening (Pass 37 E1 followup).
