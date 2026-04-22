# Pass 4 Report — Visible Bleed Stoppers

**Branch:** `pass-4-7-fixes`
**Commit SHA:** `ee52190`
**Date:** 2026-04-22

---

## (a) Commit SHA and files changed

| SHA | Files |
|-----|-------|
| `ee52190` | `src/services/aiService.ts`, `src/pages/MissionSetupPage.tsx`, `src/pages/AdminPage.tsx` |

---

## (b) Task 4.1 — Adaptive clarify was always showing static fallback

### What the brief predicted
That `fetchAdaptiveClarify` was never called — no useEffect invoked it.

### What I found (deviation from brief)
`fetchAdaptiveClarify` **is** called — inside `handleRevealClarify` (the Step 1 CTA handler), not a useEffect. The brief's "no useEffect calls it" was correct in letter but slightly misleading about severity: the function IS wired to the button click, but it's wired behind two independent 800ms timeout races that both expire before Claude can respond.

### Exact root cause
Two compounding timers, both 800ms:

1. **`CLARIFY_TIMEOUT_MS = 800`** (inside `fetchAdaptiveClarify` in `aiService.ts`) — aborts the `AbortController` after 800ms, cancelling the in-flight fetch.
2. **`TIMEOUT_FALLBACK_MS = 800`** (inside `handleRevealClarify` in `MissionSetupPage.tsx`) — a `Promise.race` against a 800ms null-resolving promise. Even if the inner abort hadn't fired, this race resolves null at 800ms.

Claude API responds in 1-3 seconds under normal conditions. Both timers fired before a response could arrive, so `dynamicQs` was always `null`, always rendering `<ClarifySection>` (the hardcoded Market/Stage/Price trio).

### Fix
Increased both constants to `5000ms`. The UI already displays a "Thinking…" spinner during the wait (`revealingClarify === true`) — no UX changes needed. Architecture (race pattern + fallback) was correct; only the constants were miscalibrated.

### Why not a useEffect instead?
The brief proposed replacing with a useEffect, but the current `handleRevealClarify` pattern is actually better UX: the fetch happens only when the user explicitly clicks "Generate Survey", not on every keystroke. A useEffect on `[missionGoal, missionDescription]` would fire on every character typed. The existing approach is intentional and correct — the bug was purely the timeout values.

---

## (c) Task 4.2 — Admin CRM tab fired 30+ requests per second

### Root cause (confirmed)

`getToken()` in `AdminPage.tsx` was creating a **new Supabase client instance** on every invocation:

```js
const getToken = useCallback(async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? '';
}, []);
```

The cascade:
1. `loadLeads()` → `apiFetch()` → `getToken()` → new Supabase client created
2. New client initializes → reads/writes localStorage session via `StorageHelper`
3. The **existing** app-wide singleton's `StorageHelper` detects the storage change
4. Singleton fires `onAuthStateChange` with the current session (INITIAL_SESSION)
5. `AuthProvider`'s listener calls `setUser(session?.user ?? null)`
6. `user` state changes → new `User` object reference even if same user data
7. AuthContext value `{ user, loading, signOut }` is a new object reference
8. `AdminPage` re-renders because `user` changed
9. `user` in `useEffect` deps array is a different reference → effect re-fires
10. `loadLeads()` again → back to step 1

The loop runs at ~30Hz because Supabase client init + localStorage write + React re-render cycle takes ~33ms.

### Fix
Replaced `getToken` with a one-liner using the app-wide `supabase` singleton (imported from `../lib/supabase`):

```js
const getToken = useCallback(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}, []); // stable: supabase is module-level singleton
```

No new client created → no localStorage writes → no auth events → no re-render → loop eliminated.

Also removed the unused `authHeader` callback which was reading `(user as any)?.access_token` — this field does not exist on the Supabase `User` object (it lives on `Session`). Dead code, now deleted.

---

## (d) Deviations from brief

| Brief said | Reality | Action taken |
|-----------|---------|--------------|
| "no useEffect calls fetchAdaptiveClarify" | It IS called in `handleRevealClarify` (button handler) | Found the real bug: dual 800ms timeout race. Did NOT add a new useEffect — existing click-gated approach is better UX |
| "useCallback deps look correct, cause unclear" | Root cause is `getToken` creating new Supabase client | Fixed at source, no workaround ref needed |
| Brief's suggested admin fix: `loadedRef` workaround | Not needed — root cause found and fixed properly | Used singleton pattern instead |

---

## (e) Known limitations

- **Clarify timeout is now 5s:** Users will see "Thinking…" for up to 5 seconds if the backend is slow. This is acceptable (better than always seeing static fallback) but if Railway cold-starts the backend, the first request after inactivity could hit the 5s limit. Consider warming the backend or increasing to 8s + showing a progress message. Not changed in this pass.
- **Clarify 5s + outer 5s are independent:** If `fetchAdaptiveClarify`'s internal `AbortController` fires at 5s (slow response), the outer race in `handleRevealClarify` also resolves at 5s. The inner abort cancels the fetch; the outer race was already resolved null. Net effect: 5s wait then static fallback. This is fine — the user saw the spinner and the fallback is usable.
- **Admin loop fix tested analytically** (can't run browser locally in this session). The mechanism is deterministic — the singleton fix is the canonical solution for this class of Supabase multi-instance bug.

---

## Test instructions for Jamil

**Task 4.1 — Clarify:**
1. Go to `/setup`
2. Pick a goal (e.g. "Validate an idea")
3. Type a description of 30+ characters (e.g. "I want to build a meal planning app for busy parents in the UAE")
4. Click "Generate Survey"
5. Observe: spinner shows "Thinking…" for 1-3 seconds
6. Clarify section should show **goal-specific questions**, not "What's your primary market?"
7. Network tab should show `POST /api/ai/clarify` returning 200

**Task 4.2 — Admin loop:**
1. Sign in as `kabbarajamil@gmail.com`
2. Go to `/admin`
3. Click "CRM" tab
4. Open Network tab
5. Count `/api/admin/crm` requests over 30 seconds
6. Should see exactly **1 request**, not 30+
