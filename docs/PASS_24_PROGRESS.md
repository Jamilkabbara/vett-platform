# Pass 24 — In Progress

**Pass 23 closed out 2026-04-30.** All blocker bugs (23.65 v5, 23.79, 23.80, 23.75v2, 23.61, 23.77) verified live on production. Doctrine validated 3 ship-fail catches: Railway stale deploy, v3 production-spinner, v4 stale-localStorage-lockout. See `docs/PASS_23_PROGRESS.md` final close-out for details.

---

## Doctrine (carry-forward from Pass 23)

The full shipped-verification doctrine lives in `docs/PASS_23_REGRESSION_AUDIT.md`. Five rules:

1. Code pushed + deploy succeeded.
2. End-to-end user-journey reproduced.
3. Original symptom verifiably absent.
4. Screenshot / recording / `funnel_events` trace as proof.
5. Regression-of-shipped escalated to higher severity than the original.

### Calibration rule — diagnostic-first supersedes speculation

**When the same symptom resurfaces after 2+ targeted fixes, STOP patching and instrument first.** Pass 23 demonstrated this with the Bug 23.0f → 23.52 → 23.64 chain (funnel allowlist), the Bug 23.65 v3 → v4 → v5 chain (defensive guard → draft redirect → passive-restore strip), and the Bug 23.79 Railway stale-deploy diagnostic (`/version` endpoint vs guessing).

Operationally:
- **Iteration 1:** ship the most-likely targeted fix.
- **Iteration 2:** if symptom returns, ship a second targeted fix *plus* the diagnostic instrumentation (`funnel_events`, structured logs, version endpoint) needed to confirm the next iteration.
- **Iteration 3:** mandatory data pull before any code change.

### Sub-rules

1. **Audit-doc bugs get `audit-complete` status, not `shipped`.** A closed audit doc is not a fix. The user-facing symptom stays `in-flight` until code or process changes resolve it. (Pass 23 Bug 23.18 origin.)

2. **Cross-stack enums must stay synced.** Frontend TS union ↔ backend Set ↔ DB CHECK constraint. Future event-type / enum additions land in all three layers. (Pass 23 Bug 23.64 origin.)

3. **Lint-suppressing `void X;` / `eslint-disable` lines are an immediate code-review flag.** Helpers with "wired in a follow-up" comments need the follow-up to land in the same PR or be tracked as an explicit todo. (Pass 23 Bug 23.63 origin.)

4. **NEW (Pass 23 Bug 23.65 v5) — Passive state restoration must never auto-navigate.** Active intent (URL deep-link, sessionStorage carry-over from explicit CTA) is a separate path with separate navigation semantics. Mount-time draft hydration / Redux rehydration / context restoration should restore in-place or clear stale state silently — never bounce the user away from the page they navigated to.

5. **NEW (Pass 23 Bug 23.79) — Backend code-shipped requires probing a behavior endpoint to confirm runtime SHA matches HEAD.** "Code is pushed to origin/main" is not the same as "code is running in production." For Railway: curl `/version` (returns `process.env.RAILWAY_GIT_COMMIT_SHA`). For Vercel: read the bundle hash on `index.html`. Without this verification, "code-shipped" is "code-pushed-and-hoped." A push that doesn't trigger an auto-deploy looks identical from git's side.

---

## Bug ledger

| Bug | Status | Backend SHA | Frontend SHA | Notes |
|---|---|---|---|---|
| **24.01** Creative Attention v2 (DAIVID + Amplified) | `planned` | — | — | Branch `pass-24-bug-01-creative-attention-v2`. Expand emotion taxonomy 8 → 24, add attention prediction (active vs passive %, predicted seconds, DBA score, decay curve), platform norms, cross-channel benchmarks (TV / social / OOH / CTV / programmatic), Creative Effectiveness Score (0-100 composite). Backwards-compatible JSONB additions only. |
| **24.02** Admin panel infrastructure costs + renewal calendar | `planned` | — | — | Branch `pass-24-bug-02-admin-cost-tracking`. New tables `infrastructure_subscriptions` + `per_unit_costs`. Admin Costs page with KPIs (revenue / AI / infra / true margin), subscriptions table with renewal alerts, runway calculator. **STOP-AND-ASK Jamil before seeding actual costs** — wrong values would silently corrupt the dashboard. |

---

## Pass 23 deferred work (rolled forward — Agent fan-out)

| Agent | Branch | Scope | File ownership | Estimate |
|---|---|---|---|---|
| **Agent 1** | `pass-23-bug-60-results-redesign` | Bug 23.60 results page redesign — exec summary lead-sentence treatment, AI Insight typography, section hierarchy, void-gap elimination, share/export buttons, Brand Lift category-grouped layout | `src/pages/ResultsPage.tsx`, `src/pages/CreativeAttentionResultsPage.tsx` (LAYOUT only — see split with Agent 2), `src/components/charts/*`, `src/components/results/*` (NEW dir) | 6-8h |
| **Agent 2** | `pass-23-bug-74-ca-exports` | Bug 23.74 CA-shape PDF/PPTX/XLSX/CSV/JSON exports + Bug 23.62 HTML-to-PDF Option B (html2canvas + jsPDF) | `src/lib/exporters/*`, `vettit-backend/src/services/exports/*`, `CreativeAttentionResultsPage.tsx` EXPORT MENU only (use `// {Agent2-EXPORTS-START} / END` markers) | 5-6h |
| **Agent 3** | `pass-23-phase-b-comparisons` | /vs/surveymonkey 7 audit-approved refinements + 4 new comparison pages (typeform, usertesting, pollfish, traditional-research) + 3 sample blog posts (1 full, 2 outlines) + sitemap.xml update | `src/pages/comparisons/*`, `src/pages/blog/*`, `public/sitemap.xml`, `docs/PASS_23_PHASE_B_COMPARISONS_REPORT.md` | 3-4h |

Coordination:
- File ownership matrix is disjoint by design.
- Inline markers on shared `CreativeAttentionResultsPage.tsx` prevent Agent 1/2 conflict: Agent 1 owns sections, Agent 2 owns the `// {Agent2-EXPORTS-START} ... // {Agent2-EXPORTS-END}` block.
- Each agent maintains `docs/PASS_23_AGENT_{N}_LOG.md` ticking off doctrine criteria per bug.
- Audit chat is the single merge gate — Chrome verification before any merge to main.
- Agents push feature branches every 2h or on logical chunk; never merge to main directly.
- Architectural divergence: STOP-AND-REPORT.

---

## Standing items (no Claude Code action — Jamil's side)

- Sentry DSN provisioning (optional, unlocks Agent 4 monitoring).
- Stripe Subscriptions pricing approval (optional, unlocks Agent 5 billing).
- Refunds for `dcbc3b6f` + `91be5c7b` (Jamil handles his own end; backfill SQL in `PASS_23_PROGRESS.md`).
- Verify infrastructure subscription seed values when Bug 24.02 proposes them.
- Provide `next_renewal_date` for each vendor (Vercel, Supabase, Resend, GoDaddy, Railway) from billing portals.

---

## Architectural decisions (this pass)

*(none yet — populate as Pass 24 progresses)*

---

## Production telemetry (live as of 2026-04-30 close-out of Pass 23)

- **Mission ledger:** mission `5e1ea434` (Jamil's WebP retry) completed clean, `creative_analysis` populated, $19 charged. Bug 23.79 + 23.80 verified end-to-end.
- **Bundle hash (Pass 23 close):** `index-Uv4IDFq1.js` (commit `c444026` — Bug 23.65 v5).
- **Backend SHA (Pass 23 close):** `19f69b3` (Bug 23.79 + 23.80 + diagnostic `/version`).
- **AI cost average:** $0.1383/mission across 13 paid+completed missions. ~99.8% gross margin on AI alone.
- **Stale CA drafts (post-v5):** auto-stripped on next /setup mount; no manual cleanup required.

---

## Open observations (logged for future passes)

1. **`useState` initializer side effects.** Pass 23 Bug 23.65 v3-v5 surfaced a code smell: the initializer for `missionGoal` reads + clears `sessionStorage`. Under React StrictMode (dev), this double-invokes and consumes the value twice. Production runs initializers once so the bug doesn't manifest, but the pattern is fragile. Future: move side effects to `useEffect` or a `useMemo` with stable deps.
2. **Backend deploy hooks need self-test.** Railway's GitHub auto-deploy silently failed twice during Pass 23. The `/version` endpoint (Bug 23.79 diagnostic) made the next case observable in seconds. Consider adding an automated smoke test that polls `/version` after every push.
3. **Draft persistence across goal types.** The `vett:mission_draft` localStorage entry is shared across all mission goals. Pass 23 Bug 23.65 v5 papers over this with silent stripping, but a fuller fix would either namespace drafts per-goal or auto-expire abandoned drafts.

---

## Pass 24 plan (initial — to be revised as work progresses)

**Phase 1 — Pass 23 deferred work (parallel agent fan-out):**
- Agent 1 (this Claude Code session): Bug 23.60 results redesign
- Agent 2 (separate session): Bug 23.74 + 23.62 exports
- Agent 3 (separate session): Phase B marketing pages

**Phase 2 — Pass 24 product work (sequential or new agents):**
- Bug 24.01 Creative Attention v2 (DAIVID + Amplified): expand emotion taxonomy, attention prediction, cross-channel benchmarks, Creative Effectiveness Score
- Bug 24.02 Admin panel infrastructure costs + renewal calendar (STOP-AND-ASK before seeding)

**Phase 3 — gated on Jamil:**
- Sentry monitoring (Agent 4) — needs Sentry DSN
- Subscription billing (Agent 5) — needs Stripe pricing approval
