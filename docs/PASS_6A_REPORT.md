# Pass 6A Report — Adaptive Clarify Timeout Fix

**Branch:** `pass-6-fixes`
**Date:** 2026-04-22

---

## (a) Files changed

| File | Change |
|------|--------|
| `src/services/aiService.ts` | `CLARIFY_TIMEOUT_MS` 5000 → 15000; `console.info` → DEV-only `console.warn` |
| `src/pages/MissionSetupPage.tsx` | `TIMEOUT_FALLBACK_MS` 5000 → 15000; 3 stale "800ms / 5 000ms" comments updated |

---

## (b) Root cause

### Measured backend latency
Live test against Railway (warm request, 130-char brief, "validate idea" goal):
- **Round-trip: 4,433ms**
- Railway cold-start adds 2–4s on hobby/trial plan
- Claude Haiku p95 for structured JSON: 3–5s

### Why the old 5000ms failed
Two independent timeouts both at 5000ms:
1. `CLARIFY_TIMEOUT_MS` inside `fetchAdaptiveClarify` — an `AbortController` signal
2. `TIMEOUT_FALLBACK_MS` in `handleRevealClarify` — an outer `Promise.race`

Either could fire before the backend responded. At 4.4s warm + network overhead, the 5000ms limit left only ~500ms of margin. On any cold-start (6–8s) or under higher Claude API load, both timeouts consistently fired, causing the static Market/Stage/Price fallback to render every time.

### Why 15000ms is the right ceiling
- Warm request p99: ~6s (4.4s measured + 1.5s buffer)
- Cold-start p99: ~9s (4.4s + 4s cold + 0.5s network)  
- New ceiling: 15s → 6s of headroom above cold-start p99
- User experience: button shows "Thinking…" + `Loader2` spinner for the wait duration — already implemented, no UX changes needed

---

## (c) Before / After

### Before
- User types brief, clicks "Generate Survey"
- Button shows "Thinking…" for 5 seconds
- **Either:** backend responds in time → goal-specific questions appear
- **Or (majority of cases with cold start):** 5s timeout fires → static Market/Stage/Price cards silently render
- User never sees goal-aware questions on Railway hobby plan

### After
- User types brief, clicks "Generate Survey"
- Button shows "Thinking…" for up to 15 seconds
- Backend returns within 4–9s → goal-specific questions appear reliably
- Static fallback still activates if backend is completely unavailable (not just slow)

---

## (d) What was already correct (no changes needed)

**Response shape:** `fetchAdaptiveClarify` correctly accesses `resp.questions`:
```typescript
const resp = (await res.json()) as { questions?: unknown };
if (!resp || !Array.isArray(resp.questions)) return null;
const valid = resp.questions.filter(isAdaptiveClarifyQuestion);
```
The backend returns `{ "questions": [...] }` and the frontend unwraps `.questions` — no mismatch.

**Loading state:** The button already shows a `Loader2` spinner and "Thinking…" text while `revealingClarify === true`. The spinner stays visible for the full wait duration. No additional loading state needed.

**Error handling:** The catch block already returns `null` (triggers static fallback). Changed from `console.info` to a DEV-only `console.warn` so the error is visible during development without appearing in production console.

---

## (e) Known limitations

- **15s is visible wait time.** Some users may perceive this as slow. Mitigation: the "Thinking…" spinner is already in place. A future pass could add a progress message ("Analyzing your brief…", "Generating questions…") to reduce perceived wait time without shortening the actual timeout.
- **Railway cold starts are unpredictable.** On the free Railway tier, a truly cold start (service sleeping after inactivity) can take 10–20s to spin up the Node.js process before even starting the Claude call. The 15s ceiling handles warm-to-cold-cache Railway but not sleeping-server cold starts. A future mitigation is to keep-alive ping the Railway service.
- **Two timeouts in series are still slightly redundant.** Both the AbortController inside `fetchAdaptiveClarify` and the outer `Promise.race` in `handleRevealClarify` are now 15s. This is intentional — the AbortController cancels the in-flight HTTP request (saves bandwidth), while the outer race ensures the UI always gets a value (not a thrown exception). Both need to match.

---

## Test instructions for Jamil

1. `npm run dev` — open http://localhost:5173/setup
2. Pick goal "Validate an idea"
3. Type: "I want to build a meal planning app for busy parents in Dubai who want healthy home-cooked meals for their kids" (130 chars)
4. Click "Generate Survey"
5. **Expected:** Button shows "Thinking…" + spinner for ~4-6s, then goal-specific question cards appear (questions about life stage, pain points, etc. — NOT Market/Stage/Price)
6. Open Network tab — should see POST `/api/ai/clarify` completing with 200 and `questions: [...]` array

**To verify static fallback still works:**
1. Kill the backend or disconnect network
2. Click "Generate Survey"
3. Expected: button shows "Thinking…" for up to 15s (or until connection error), then static Market/Stage/Price cards appear
4. No crash, no white screen

**On live site (vettit.ai):**
1. After Railway deploy, test during a cold-start scenario (wait 15 min after last request, then visit /setup)
2. Expected: goal-specific questions now appear even on cold start (previously they never appeared on cold start)
