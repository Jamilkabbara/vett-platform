# Prompt 3 — Render-only stubs

Three pieces of UI in the redesigned /setup + /dashboard/:missionId
flow render visuals but intentionally don't touch the backend. Each
is deferred to a later prompt. This file is the single place we
track them so nothing ships to production thinking it's wired.

**Status after Prompt 3 final commit (commit 9):** all three stubs
below are live and visible in the redesigned UI. Each one renders
exactly the behaviour documented here — no more, no less.

**Post-payment flow (Prompt 4):** a successful payment now lands on
`/mission/:missionId/live` (the new `ActiveMissionPage`). The mission
row is flipped from `draft` → `active` (status + paid_at columns)
optimistically on the client; `/api/payments/confirm` remains the
authoritative server-side write. The active page renders a full
hero + progress bar + metrics + realtime ticker, but the response
data is only real when the backend generator endpoint ships (see
"Synthetic response generation" below). Until then, the ticker
shows seed status lines and the counter sits at 0.

## 1. Creative Attention — media upload

**Where:** `MissionSetupPage` describe step, when the `creative_attention`
goal is selected (see `GOALS_WITH_UPLOAD` in `src/data/missionGoals.ts`).

**What renders:**
- `🖼 Add image / video` chip opens a native `<input type="file">`
  with `accept="image/*,video/*"`.
- When a file is selected, the chip swaps to a purple filename pill
  with an ✕ to clear it. A `toast.info` confirms "File captured —
  frame-by-frame analysis coming soon."

**What's NOT wired:**
- The file is held in component state only.
- No upload, no signed URL, no Supabase Storage write, no
  submission to /api/ai.
- Switching goals after uploading clears the stashed file.

**Next step:** a dedicated creative-attention ingestion endpoint
(Prompt 6 or later). Until then the mission proceeds as if no file
were attached — the generated survey is text-only.

---

## 2. NotificationBell dropdown

**Where:** `src/components/ui/NotificationBell.tsx`, mounted by
`AuthedTopNav` on /setup and /dashboard/:missionId.

**What renders:**
- Bell icon with an unread badge whose count reflects local state.
- Dropdown with All / Missions / Billing tabs, 5 seed items,
  "Mark all read" flipping local state, footer CTA "View all
  notifications →".

**What's NOT wired:**
- The 5 items are a seed constant (`SEED` in NotificationBell.tsx).
- No fetch, no websocket, no persistence across reloads.
- "View all notifications →" surfaces `toast.info("Full
  notifications inbox coming soon.")` instead of routing.

**Next step:** a notifications service + `/api/notifications` —
separate prompt once DB schema is defined.

---

## 3. Promo-code input (pricing panel)

**Where:** `src/components/dashboard/MissionControlPricing.tsx`,
mounted in the RIGHT column of `/dashboard/:missionId` as of
Commit 8. **Live** — users can see this input today.

**What renders:**
- Text input (uppercases as you type) + `Apply` button in the
  pricing breakdown, between the line items and the total.
- On Apply: `toast` with "Promo codes coming soon — we'll honour
  '<CODE>' once server-side validation is live."
- Apply button disables while the toast animates to prevent a
  double-fire.

**What's NOT wired:**
- No discount math, client-side or server-side, under any
  circumstance. The displayed total always equals
  `pricingEngine.calculatePricing(...)` exactly, so the Stripe
  charge never drifts from what the user sees.
- A TODO comment at the top of `MissionControlPricing.tsx`
  explicitly reserves the server-side /api/pricing/quote handoff
  so a future commit cannot accidentally introduce drift.

**Next step:** a real promotions service gated by server-side
validation. When that lands, update `pricingEngine.ts` to accept
an optional validated promo-code discount so the client, the
server, and Stripe all agree on the final amount.

---

## DEFERRED AI UPGRADES

Things the redesign flow intentionally does NOT do yet. Tracked
here so nobody spends Commit-N rebuilding a feature that was
explicitly deferred.

### Adaptive clarify questions — FRONTEND READY (Prompt 3.5+ Phase 9)

**Where it lives:** `ClarifySection` in MissionSetupPage, wired
via `fetchAdaptiveClarify()` in `src/services/aiService.ts`.

**Status:** the frontend will POST `{goal, brief}` to
`/api/ai/clarify` with an 800ms abort timeout. A runtime guard
drops any malformed question, and an empty/timeout response
falls back silently to the static market/stage/price cards.
**Backend endpoint is NOT deployed yet** — fallback path is
the user-visible default. Backend can ship anytime without
requiring a frontend change.

### Gibberish / low-quality brief detection

**Where it would live:** MissionSetupPage describe step, before
revealing the clarify section.

**What's missing:** the 30-char minimum only catches length, not
quality — "asdfasdf asdf asdf..." passes. The old DashboardPage
had a local `isGibberish()` heuristic (no spaces + >15 chars);
the redesign should either port that (cheap) or call the AI
(better) to catch low-signal input and prompt the user to
elaborate BEFORE the AI generates questions on nonsense.

### Per-question AI refine endpoint

**Where it lives:** `MissionControlQuestions` "Refine" button →
`aiService.refineQuestion()`.

**What's missing:** the service calls `/api/ai/refine-description`
which does not exist on the server yet. The implementation
gracefully falls back to a local heuristic rewrite so the UI
stays functional — users see "Refined (local)" in a toast when
the fallback fires. A future pass should wire the endpoint so
refines go through the same OpenAI path as initial question
generation.

### Synthetic response generation — FRONTEND READY (Prompt 4 Phase 4)

**Where it lives:** `triggerResponseGenerator()` in
`src/pages/ActiveMissionPage.tsx`.

**Status:** when `/mission/:missionId/live` mounts and the mission
is in an active-collection state, the frontend fires
`POST /api/missions/:missionId/generate-responses` exactly once
(guarded by a ref so poll ticks don't re-spam). **Backend endpoint
is NOT deployed yet** — on 404 the UI shows a neutral "Response
generation queued — results typically ready in 15–30 minutes"
banner instead of letting the counter sit at 0/N forever.

Network / 5xx errors are logged but otherwise swallowed; the user
sees the same UX as 404 so they aren't blocked by a flaky backend.
Ticker + counter still work from `mission_responses` — whatever
ends up in that table shows up in the UI regardless of how it got
there.

When backend lands: the endpoint should enqueue a job that writes
rows to `public.mission_responses` (schema: `id, mission_id,
persona_id, persona_profile jsonb, question_id, answer jsonb,
answered_at`). Supabase Realtime on `mission_responses` will pick
them up automatically; no further frontend change required.

### Server-side pricing quote — FRONTEND READY (Prompt 3.5+ Phase 11)

**Where it lives:** `verifyServerQuote(client, server)` helper
in `src/utils/pricingEngine.ts`, documented in
`.design-reference/PRICING_SPEC.md`.

**Status:** the frontend is wired to call an optional
`/api/pricing/quote` endpoint and reconcile. The helper accepts
the client breakdown plus an untrusted server response; if the
server total diverges by more than $0.02 the authoritative
server breakdown is used, otherwise the client value is kept
(rounding drift). **Backend endpoint is NOT deployed yet** —
no validation path runs today. When backend lands, pass the
response into `verifyServerQuote()` before the Stripe charge.
