# Pass 37 A3 — "4-12 hours" ETA audit

Audit ran `git grep -nE "4.?12.?(h|hours?)" src/ public/`. Matches:

```
src/pages/MissionsListPage.tsx:307:    // fell through and showed "12-24h" on completed missions.
src/pages/MissionsListPage.tsx:309:    // Pass 36 A0e — replace static "4-12h" / "12-24h" hardcoded ETAs
src/pages/MissionsListPage.tsx:311:    // "4-12 hours" for 4 hours while DB had status=completed. The
```

All 3 matches are inside `// Pass 36 A0e ...` historical comments
that document WHY the fix was made. Zero matches in JSX / rendered
strings. Pass 36 A0e correctly removed the hardcoded ETA from the
mission card render path.

## Why the Pass 37 audit reported "4-12h" still visible

The audit observed the production site, which is running Pass 35
(Pass 36 never merged — see Pass 37 A0.0 deploy gate). Pass 36 A0e
fix is in git history but not on the live page. Once this Pass 37
PR merges (carrying all Pass 36 commits forward), the rendered
text will be gone in production too.

## Mission card ETA logic (Pass 36 A0e + Pass 37 A4 carryover)

```
status         → label
draft          → "Not launched"
pending_payment → "Awaiting payment"   (Pass 37 A4 fixed CTA)
in_progress    → stage-aware (Generating questions… / Personas
                  responding… / Computing insights… / Almost done…)
completed      → "Completed"
failed         → "Failed"
```

No `Math.max` worst-case "4-12 hours" fallback anywhere. If
needed in future for a non-paid mission with no `paid_at` /
`created_at`, default to "Processing…" (Pass 36 A0e implementation).

## Forward policy

Any PR that adds a hardcoded "X-Y hours" ETA string is reviewed
under Doctrine #17/#18: a stage-aware function must drive the
label, not a fixed worst-case ceiling. Mock missions on
anonymous dashboard get the same treatment (Pass 37 A6 covers
the larger "should anonymous dashboard even exist" question).
