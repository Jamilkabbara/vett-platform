# There are deliberately no migration files here

This directory held eight `.sql` files from January 2026. They were deleted on
2026-09-11 because they were a loaded gun, not a record.

## What was wrong

None of the eight was recorded in the remote
`supabase_migrations.schema_migrations` history. `supabase db push` applies
every local file whose version is missing from that history, so all eight
counted as unapplied. Anyone running a push would have applied all eight to
production.

Two of them touch RLS on `missions`:

- `20260127122921_optimize_rls_policies_and_function_security.sql`
- `20260128121140_fix_rls_performance_and_security_issues.sql`

They create policies named "Users can insert own missions" and "Users can
update own missions" whose only condition is `(select auth.uid()) = user_id`.

Production's policies are named `missions_insert` and `missions_update` and
carry much stricter conditions: an insert must have `status='draft'` with null
payment columns, and an update is only permitted while the mission is draft or
pending_payment. Those two are what stop a browser forging a paid mission and
taking free compute.

The January files would NOT have replaced them. The policy names do not match,
so the `DROP POLICY IF EXISTS` lines are no-ops. The `CREATE POLICY` lines would
have ADDED a second, permissive policy beside each hardened one. PostgreSQL ORs
permissive policies together, so a row only has to satisfy one of them. Any row
that was merely "mine" would have passed and the hardened policies would have
become decoration.

The risk was therefore not a revert. It was a silent override, which is much
harder to notice.

## Why deleting beat marking them applied

The alternative was to insert the eight versions into the remote history so
`db push` would skip them. That was rejected. It records a claim that the
content of these files is what is live, and it is not: production has moved far
past January. Deleting requires no production write at all, and an empty
directory cannot push anything by construction, which is a stronger guarantee
than any dry run.

The files remain in git history if anyone needs to read them.

## How migrations actually work on this project

They do not go through the Supabase CLI. The CLI is not installed on the
machine, no script or CI job invokes it, and nothing reads this directory.
Schema changes are applied to the remote project directly, and the SQL is
committed for the record in the BACKEND repo under `migrations/pass-NN/`. See
`vettit-backend/migrations/pass-52` for the current convention.

If you are about to add a migration, add it there, not here.
