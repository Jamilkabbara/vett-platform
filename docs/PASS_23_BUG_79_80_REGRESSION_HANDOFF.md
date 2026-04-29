# Pass 23 Bug 23.79 + 23.80 Regression — Handoff Prompt

**Status:** Bug 23.79 + 23.80 reported as `code-shipped` in commit `86751ae` to vettit-backend main, but mission `91be5c7b` failed at 17:46 UTC (1.5 hours after merge) with the **identical** pre-fix Anthropic 400 MIME error. Bug 23.80 auto-refund did NOT fire (`partial_refund_id` = NULL on the failed mission). This is a doctrine ship-fail.

---

## Forensic snapshot

### Mission 91be5c7b-bbdd-40d0-8129-6435f1102c8c (Jamil's WebP test)
- `paid_at`: 2026-04-29 17:46:54 UTC
- `completed_at`: 2026-04-29 17:46:58 UTC (4 seconds after paid → backend failed fast)
- `status`: failed
- `failure_reason`: `400 invalid_request_error: messages.0.content.0.image.source.base64: The image was specified using the image/jpeg media type, but the image appears to be a image/webp image (request_id: req_011CaYUsJQgCWuLwXmWbk4pW)`
- `partial_refund_id`: **NULL** ← Bug 23.80 didn't fire
- `partial_refund_amount_cents`: NULL
- `latest_payment_intent_id`: pi_3TRcCEGvqU3B9kYB1azGyUvU
- `paid_amount_cents`: 1900
- `tier`: image, `media_type`: image, `media_url` present (Bugs 23.61 + 23.75v2 still working)

### Mission dcbc3b6f-127f-4925-b722-9355045ca4ee (the original incident)
- `paid_at`: 2026-04-29 14:56:50 UTC (BEFORE 23.79+23.80 merge)
- `failure_reason`: same exact Anthropic 400 error
- `partial_refund_id`: NULL — predates auto-refund
- `latest_payment_intent_id`: pi_3TRZXeGvqU3B9kYB0s9E0zkk

### Stripe state
- 91be5c7b's PI has **zero refunds** (audit chat verified via list_refunds)
- $19 manual refund pending Jamil's approval

---

## What's verified correct in the code

Source of truth: `/tmp/vettit-backend-23-audit/` at HEAD `19f69b3` (which was `86751ae` + diagnostic /version endpoint).

### Bug 23.79 — code at commit 6210a58 / merge 86751ae
- `src/services/ai/creativeAttention.js:58-82` — `detectImageMime(buffer)` magic-byte sniffer (JPEG FF D8 FF, PNG 89 50 4E 47, GIF 47 49 46 38, WebP RIFF...WEBP)
- `src/services/ai/creativeAttention.js:135` — `analyzeFrame({frame, mission, mediaType = 'image/jpeg'})` accepts mediaType param
- `src/services/ai/creativeAttention.js:172` — Anthropic call uses `media_type: mediaType` (not hardcoded)
- `src/services/ai/creativeAttention.js:339` — image branch: `frameMediaType = detectImageMime(buffer)`
- `src/services/ai/creativeAttention.js:350` — passes detected type: `analyzeFrame({frame, mission, mediaType: frameMediaType})`
- **No other `image/jpeg`-hardcoded media_type call sites exist** (`grep -rn "media_type.*image/jpeg" src/` returns 0 matches)
- **Single Anthropic call site** (`grep -rn "anthropic.messages.create" src/` returns only `creativeAttention.js:161`)
- **Single CA pipeline entry point** — `runMission.js:96` calls `analyzeCreative({mission})`; no other paths

### Bug 23.80 — code at commit 6210a58 / merge 86751ae
- `src/jobs/runMission.js:372` — catch block exists
- `src/jobs/runMission.js:392-431` — auto-refund logic (eligibility, idempotent Stripe call, success/failure capture)
- `src/jobs/runMission.js:433-443` — DB UPDATE with `partial_refund_id` + `partial_refund_amount_cents`
- `src/jobs/runMission.js:447+` — admin_alert + notification + email

The git state is correct: `origin/main HEAD = 86751ae` (now `19f69b3`).

---

## ROOT CAUSE CONFIRMED — Railway auto-deploy is broken

**Verified at 2026-04-29 18:12 UTC, 5+ minutes after push of 19f69b3:**

```
$ curl -s https://vettit-backend-production.up.railway.app/version
{"error":"Route not found"}  ← HTTP 404

$ curl -s https://vettit-backend-production.up.railway.app/health
{"status":"ok","timestamp":"2026-04-29T18:12:29.823Z","version":"1.0.0"}  ← HTTP 200
```

`/health` (existing endpoint) responds → server is running.
`/version` (added in 19f69b3) returns 404 → that commit is NOT deployed.
By transitivity, `86751ae` (Bug 23.79 + 23.80) is also NOT deployed.

GitHub state confirmed correct: `https://api.github.com/repos/Jamilkabbara/vettit-backend/commits/main` returns SHA `19f69b3be1b49576ac23f5197fc3fd1c450a8f8c`.

**Conclusion:** Railway's GitHub auto-deploy hook on the vettit-backend project is either disconnected, paused, failing builds silently, or pointed at the wrong branch. Manual intervention required.

---

## Manual redeploy instructions (Jamil action)

### Option A — Railway Dashboard (fastest)
1. Open https://railway.app
2. Navigate to the `vettit-backend` project
3. Click on the production service
4. Go to **Deployments** tab
5. Find the most recent deployment
6. Click the three-dot menu → **Redeploy**
   - OR: click **"Deploy from main"** if the option exists
7. Watch for the build to start. Should take ~2 min for nixpacks build + deploy.

### Option B — Railway CLI
```bash
cd /tmp/vettit-backend-23-audit  # or wherever your local backend checkout is
npx @railway/cli login            # opens browser for auth
npx @railway/cli link             # link to vettit-backend project
npx @railway/cli up               # triggers immediate deploy from local
```

### Option C — Re-trigger via empty commit
If Options A/B don't work, the auto-deploy hook may need a fresh push to wake up:
```bash
cd /tmp/vettit-backend-23-audit
git commit --allow-empty -m "chore: nudge Railway auto-deploy"
git push origin main
```

### After redeploy completes — verify

```bash
curl -s https://vettit-backend-production.up.railway.app/version | jq
```

Expected:
```json
{
  "sha": "19f69b3be1b49576ac23f5197fc3fd1c450a8f8c",
  "branch": "main",
  "deployedAt": "<recent ISO timestamp>",
  "bug23_79": "magic-byte detection",
  "bug23_80": "auto-refund on pipeline failure"
}
```

Once SHA matches HEAD, both Bug 23.79 + 23.80 are running.

### Then re-test WebP

1. Jamil uploads a fresh WebP file via /creative-attention/new
2. Pays $19
3. Audit chat queries DB:
   ```sql
   SELECT id, status, failure_reason, partial_refund_id
   FROM missions WHERE user_id = (SELECT id FROM auth.users WHERE email = 'kabbarajamil@gmail.com')
   ORDER BY created_at DESC LIMIT 1;
   ```
4. **Expected:** `status='completed'`, `failure_reason=NULL`. WebP analysis should run successfully.

---

## (Original hypothesis — kept for the audit trail)

The hypothesis was: Railway is running stale code.

The code is verifiably correct on `origin/main`. The only explanation for the runtime behavior matching pre-fix is that Railway's runtime was on a commit older than `86751ae` when mission 91be5c7b ran at 17:46 UTC.

### Diagnostic endpoint deployed

Commit `19f69b3` adds `GET /version` to expose `process.env.RAILWAY_GIT_COMMIT_SHA`. Curl pattern:

```bash
curl -s https://vettit-backend-production.up.railway.app/version
```

Expected response shape:
```json
{
  "sha": "<deployed git SHA>",
  "branch": "main",
  "deployedAt": "<ISO timestamp>",
  "bug23_79": "magic-byte detection",
  "bug23_80": "auto-refund on pipeline failure"
}
```

### Outcome interpretation

| Returned SHA | Meaning | Next step |
|---|---|---|
| `19f69b3...` | Railway auto-deploy works — both 86751ae and this commit landed. The WebP failure had another cause. | Re-investigate; pull Railway logs for mission 91be5c7b to see which code path was actually hit |
| `86751ae...` | Railway lagged on the auto-deploy of 86751ae but caught up on 19f69b3. Both fixes are now deployed. | Ask Jamil to re-test WebP; should now succeed |
| Older SHA (e.g. `108d703` or earlier) | **Railway auto-deploy hook is broken.** | Manual redeploy via Railway dashboard or CLI |
| `endpoint not found` (404) | Same as above — Railway never picked up `19f69b3` either | Manual redeploy required |

---

## Tasks remaining (in priority order)

### 1. Verify Railway state (BLOCKER for everything else)
- Curl /version → record SHA
- If SHA != HEAD: trigger manual Railway redeploy
- After redeploy: curl /version again to confirm SHA == 19f69b3

### 2. Verify the actual fix in production
- After SHA confirms latest code is running, ask Jamil for a fresh WebP test mission
- Audit chat queries DB:
  ```sql
  SELECT id, status, failure_reason, partial_refund_id
  FROM missions WHERE user_id = '<jamil>' ORDER BY created_at DESC LIMIT 1;
  ```
- **Expected:** `status='completed'`, `failure_reason=NULL`, `partial_refund_id=NULL` (no refund needed because mission succeeded)

### 3. Synthetic failure test (optional but recommended)
- Force a 400 by sending a corrupt or unsupported image (e.g. .heic, .bmp)
- Confirm `detectImageMime` throws "Unsupported image format" → catch block hits → auto-refund issued → row has `partial_refund_id` populated

### 4. Backfill mission 91be5c7b (and dcbc3b6f if not yet)
After Jamil approves $19 manual Stripe refund, capture refund_id (`re_xxx`):

```sql
UPDATE missions
SET partial_refund_id = '<re_xxx>',
    partial_refund_amount_cents = 1900
WHERE id = '91be5c7b-bbdd-40d0-8129-6435f1102c8c';
```

Same pattern for `dcbc3b6f-127f-4925-b722-9355045ca4ee` if Stripe shows a refund on `pi_3TRZXeGvqU3B9kYB0s9E0zkk` and the mission row hasn't been backfilled yet.

### 5. Update PASS_23_PROGRESS.md ledger
- Mark bugs 23.79 + 23.80 as `ship-failed → re-shipped` with the regression note
- Document the Railway deploy-lag root cause if confirmed
- Add a checklist item to future doctrine: **"backend code-shipped requires probing /version endpoint to confirm runtime SHA matches HEAD"**

### 6. ONLY after 23.79 + 23.80 verified working: dispatch Agents 1, 2, 3
Per audit chat instructions:
- Agent 1: Bug 23.60 results redesign on branch `pass-23-bug-60-results-redesign`
- Agent 2: Bug 23.74 + 23.62 CA exports on branch `pass-23-bug-74-ca-exports`
- Agent 3: Phase B comparison expansion on branch `pass-23-phase-b-comparisons`

---

## Doctrine update: backend ship verification

The "code is in git" / "code is on origin/main" check is necessary but **not sufficient** for backend changes deployed via auto-deploy hooks. Going forward:

> A backend bug is `code-shipped` only after curl-ing a behavior endpoint that proves the new code path is running. For Railway, this is `/version` returning the expected commit SHA. For Vercel, this is the bundle hash on `index.html`. Without this verification, "code-shipped" is "code-pushed-and-hoped".

This sub-rule joins the existing 5-criterion doctrine (PASS_23_PROGRESS.md → Doctrine section) as an explicit pre-flight check for any backend change.

---

## Files to read for context (in order)

1. `docs/PASS_23_PROGRESS.md` — Bug ledger + doctrine
2. `docs/PASS_23_REGRESSION_AUDIT.md` — 5-criterion doctrine origin
3. `/tmp/vettit-backend-23-audit/src/services/ai/creativeAttention.js` — 23.79 fix
4. `/tmp/vettit-backend-23-audit/src/jobs/runMission.js` (lines 372-470) — 23.80 fix
5. `/tmp/vettit-backend-23-audit/src/app.js` (lines 145-160) — diagnostic /version endpoint added in `19f69b3`

---

## Quick re-entry checklist for next session

```bash
# 1. Verify what's deployed
curl -s https://vettit-backend-production.up.railway.app/version | jq

# 2. Pull latest mission state
# (use Supabase MCP execute_sql against project hxuhqtczdzmiujrdcrta)

# 3. Verify code state
cd /tmp/vettit-backend-23-audit
git fetch origin && git log origin/main -5 --oneline
# Should show: 19f69b3 (diagnostic /version) + 86751ae (Bug 23.79+23.80 merge) + 6210a58 (Bug 23.79+23.80)

# 4. If Railway SHA != 19f69b3, trigger redeploy:
#    - Via dashboard: https://railway.app → vettit-backend → Deployments → Redeploy latest
#    - Via CLI: railway up (requires railway login + linked project)
```
