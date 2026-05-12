# Pass 38 DEPLOY-2 — Frontend deploy pipeline diagnostic (2026-05-12)

## TL;DR

Same root cause as backend DEPLOY-1: `git push` was never executed.

- Local HEAD = `331fde7` (Pass 37 A10 — Frontend deploy verification CI)
- `origin/main` = `9913cff` (Pass 35 final-mile merge)
- 31 commits ahead of `origin/main`, zero pushed in Pass 37
- `origin/pass-36-demo-recovery` exists at `b2a9c2e` (Pass 36 was
  partially pushed but never merged to main)
- `origin/pass-37-verification-and-closure` does **not exist**
  (Pass 37 frontend commits were never pushed at all)

Vercel is correctly serving the most recent thing it has ever been
told about (`9913cff`, Pass 35). The May 11 demo bug, the empty
results gap, the "4-12h" cards, the PENDING_PAYMENT "View Results",
the landing `$35`, the anonymous-dashboard mock cards — all of
these are still present in production because the fixes for them
exist only as locally-committed branches.

## Diagnostic commands

```
$ cd /Users/jamilkabbara/Documents/GitHub/vett-platform  # NOT a worktree
$ git rev-parse HEAD
331fde7933bcde2046cd2f2e4107c9cb507ddd26   ← Pass 37 A10

$ git rev-parse origin/main
9913cffefd247a2bce8093437105e42c00c6beda   ← Pass 35

$ git rev-parse origin/pass-36-demo-recovery
b2a9c2e6a6dc1de4a73da9e44a75084c2c0da195   ← Pass 36 (orphan branch on origin)

$ git rev-parse origin/pass-37-verification-and-closure
fatal: unknown revision   ← Pass 37 never pushed

$ git log --oneline origin/main..HEAD | wc -l
31
```

The 31 unpushed commits include the 14 Pass 36 commits AND the 10
Pass 37 Track A commits AND auxiliary docs + workflow files.

## Why this kept happening

Identical to backend: prior Claude Code sessions made commits and
saw `[branch-name sha] commit-message` confirmations, which look
exactly like push confirmations but are not. The actual
`git push origin <branch>` step was never invoked. Two consecutive
close-outs claimed shipped status without running the verification
curl.

The Pass 37 close-out audit even documented the curl as the
verification gate, but the audit author never ran the curl
themselves. The doctrine ("shipped = deployed") existed but was
never enforced.

## Multi-worktree wrinkle

This frontend repo has 5 worktrees:

```
/Users/jamilkabbara/Documents/GitHub/vett-platform                                     pass-37-verification-and-closure (real commits)
/Users/jamilkabbara/Documents/GitHub/vett-platform/.claude/worktrees/agent2-ca-exports pass-23-bug-74-ca-exports
/Users/jamilkabbara/Documents/GitHub/vett-platform/.claude/worktrees/agent3-comparisons pass-23-phase-b-comparisons
/Users/jamilkabbara/Documents/GitHub/vett-platform/.claude/worktrees/objective-chatterjee  claude/objective-chatterjee (stale Pass 23)
/Users/jamilkabbara/Documents/GitHub/vett-platform/.claude/worktrees/serene-franklin  claude/serene-franklin (prunable)
```

The Claude Code session that ran Pass 37 had its working directory
sometimes reset to the `objective-chatterjee` worktree (a leftover
from Pass 23). Commands run there had no effect on the real Pass 37
branch. This contributed to the impression that pushes "worked" —
commands ran without errors, but they were operating on the wrong
branch in a wrong worktree.

DEPLOY-2 commits land on the main repo at
`/Users/jamilkabbara/Documents/GitHub/vett-platform`, not in any
`.claude/worktrees/*` subdirectory.

## What DEPLOY-2 ships

1. This diagnostic doc.
2. The actual `git push origin pass-38-deploy-first` step is left to
   the user to run after committing, because the embedded GitHub
   token in `git remote -v` should not be programmatically logged
   from inside a session that may share that output.

## Push instructions for the user

```bash
cd /Users/jamilkabbara/Documents/GitHub/vett-platform   # NOT a worktree
git branch --show-current                                # expect pass-38-deploy-first
git push origin pass-38-deploy-first
```

Then on GitHub:
- Open PR: `pass-38-deploy-first` → `main`
- Title: `Pass 38 — Deploy Pipeline Recovery + Re-ship Pass 36/37 with Production Proof`
- Merge with "Create a merge commit" so the 32+ commit history is preserved
- Watch Vercel auto-deploy (~3 min)
- Verify with: `curl -s https://www.vettit.ai/version.json` (after DEPLOY-3 ships this endpoint)

## Cleanup recommendation (post-merge)

After PR merges, the stale worktrees can be pruned to prevent the
same multi-worktree confusion in future passes:

```bash
cd /Users/jamilkabbara/Documents/GitHub/vett-platform
git worktree remove .claude/worktrees/objective-chatterjee
git worktree remove .claude/worktrees/serene-franklin
git worktree remove .claude/worktrees/agent2-ca-exports
git worktree remove .claude/worktrees/agent3-comparisons
git worktree prune
```

(Or keep them but don't `cd` into them from Pass 38 onward.)

## Verification (after push + merge + Vercel deploy)

```bash
# DEPLOY-3 ships /version.json which makes this verifiable
curl -s https://www.vettit.ai/version.json | jq .
# Expected: pass == 38, sha == merge SHA on main

# Smoke-test that Pass 37 A8 actually landed
curl -sL https://www.vettit.ai/ | grep -o '\$35\|\$9' | sort | uniq -c
# Expected: many $9 occurrences (the new starting price),
#           zero or few $35 (only the Validate tier label)
```

If the SHA matches and the smoke-test passes, DEPLOY-2 verified.
