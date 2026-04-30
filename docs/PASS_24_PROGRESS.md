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

6. **NEW (Pass 24 launch-readiness bundle) — Marketing/sales/legal asset generation requires Jamil review-and-approval before `shipped` status.** These are external-facing artifacts where hallucinated facts have reputational cost. Audit chat verifies copy accuracy against real DB / real product behavior; Jamil verifies tone + business positioning. Applies to: legal pages (privacy, ToS, refunds), sales decks, LinkedIn templates, marketing strategy docs, founder bios, case studies. Internal-only artifacts (admin dashboards, ops runbooks) follow the existing 5-criterion technical doctrine.

---

## Bug ledger

| Bug | Status | Backend SHA | Frontend SHA | Notes |
|---|---|---|---|---|
| **24.01** Creative Attention v2 (DAIVID + Amplified) | `planned` | — | — | Branch `pass-24-bug-01-creative-attention-v2`. Expand emotion taxonomy 8 → 24, add attention prediction (active vs passive %, predicted seconds, DBA score, decay curve), platform norms, cross-channel benchmarks (TV / social / OOH / CTV / programmatic), Creative Effectiveness Score (0-100 composite). Backwards-compatible JSONB additions only. |
| **24.02** Admin panel infrastructure costs + renewal calendar | `planned` | — | — | Branch `pass-24-bug-02-admin-cost-tracking`. New tables `infrastructure_subscriptions` + `per_unit_costs`. Admin Costs page with KPIs (revenue / AI / infra / true margin), subscriptions table with renewal alerts, runway calculator. **STOP-AND-ASK Jamil before seeding actual costs** — wrong values would silently corrupt the dashboard. |
| **24.03** Legal pages (Privacy, ToS, Refunds, Cookie Banner) | `planned` | — | — | Branch `pass-24-bug-03-legal-pages`. **Launch blocker.** New routes `/privacy`, `/terms`, `/refunds`. Cookie banner component mounted globally with `vett:cookie_consent` localStorage key (only key — don't fight existing draft state). Footer links across LandingPage + DashboardPage. Termly/iubenda template customized for: Supabase ap-south-1 residency, Anthropic processing, Stripe data, Resend email, vett-creatives storage, Vercel analytics, GDPR (EU/MENA), 90d retention, UAE jurisdiction. Stripe will eventually flag accounts without these — GDPR liability before then. **Sub-rule 6 applies — Jamil review before shipped.** |
| **24.04** Sales deck (.pptx, generated from real mission data) | `planned` | — | — | Branch `pass-24-bug-04-sales-deck`. Output: `docs/sales/VETT_Sales_Deck_v1.pptx` via pptxgenjs. 14 slides: Title → Problem → Solution → How It Works (4-step Intelligence Loop) → 14 goal types grid → Creative Attention v2 standout → MENA-first positioning → Real Results (real mission screenshots) → Pricing ladder → Why Now → Comparison matrix (uses Agent 3 Phase B content) → Founder bio + roadmap → Ask → Contact. Generated via `scripts/generate-sales-deck.ts`. Brand kit: bg #0B0C15, lime #BEF264, indigo #6366F1, Manrope/Inter. **Sub-rule 6 applies.** |
| **24.05** LinkedIn package | `planned` | — | — | Branch `pass-24-bug-05-linkedin-package`. Output: `docs/marketing/LINKEDIN_PACKAGE.md` with 4 sections: (1) Jamil personal profile optimization (headline, About, Featured pinned post, location/contact/skills/services), (2) VETT company page setup checklist (logo, banner spec, tagline, About, industry, size, website, HQ Dubai, founded, specialties, initial 5-post launch sequence), (3) Cold outreach templates (4 audience segments × 3 message variants — brand marketers MENA, agency strategists, solo founders, research buyers escaping SurveyMonkey; <200 chars; tokens `{first_name}` `{company}` `{trigger}`), (4) Content calendar (4-week schedule, 3 posts/week, 12 specific drafts, MENA + EU timezone optimization). **Sub-rule 6 applies.** |
| **24.06** 90-day marketing strategy | `planned` | — | — | Branch `pass-24-bug-06-marketing-strategy`. Output: `docs/marketing/MARKETING_STRATEGY_90_DAYS.md`. Three phases: Weeks 1-2 Content Foundation (comparison pages live, 5 LI posts, 3 blog posts, company page setup, profile optimized, 50 strategic connections); Weeks 3-6 Outbound + Organic (50 cold DMs/week, 3 posts/week, agency partnership outreach, first case study, AppSumo/PH/G2/Capterra, GSC + sitemap); Weeks 7-12 Paid + Scale ($500 LinkedIn Ads pilot, paid case study, agency reseller deal, webinar/Loom recording, email nurture drip). KPIs weekly/monthly/quarterly. **Sub-rule 6 applies.** |
| **24.07** Email workspace migration guide (docs only) | `planned` | — | — | Branch `pass-24-bug-07-email-setup`. Output: `docs/ops/EMAIL_WORKSPACE_SETUP.md`. Step-by-step Google Workspace migration from Microsoft 365 (cancel via GoDaddy, sign up Business Starter $6/user/mo, verify domain TXT, update MX, create `jamil@vettit.ai` + `hello@vettit.ai`, configure send-as in Gmail, update Resend From, update Stripe support, update vettit.ai footer). Alternatives section (Cloudflare Email Routing, ProtonMail Custom Domain). Testing checklist (mxtoolbox SPF/DKIM/DMARC). Jamil does the actual setup since it requires GoDaddy login. |
| **B5** Stripe Subscriptions | **DEFERRED to Phase 2** | — | — | Jamil's decision: NO free tier, NO subscription system at current pricing. Revisit in Phase 2 with substantially higher tier pricing (target Pro ~$99-149/mo, Team ~$299-499/mo) AFTER the platform proves recurring usage at one-shot pricing (first 50-100 paying users). No engineering work happens on this in Pass 24. |

---

## Pass 24 execution order

After Agents 1, 2, 3 close out their Pass 23 deferred work:

1. **Lead session takes Bug 24.01** (CA v2) — 8-10h
2. **Then Bug 24.02** (admin costs) — 6-8h. **STOP-AND-ASK Jamil for actual subscription amounts + renewal dates BEFORE committing seed migration. Wrong values silently corrupt his runway dashboard.**
3. **Then Bug 24.03** (legal pages) — 3-4h. Launch blocker.
4. **Then Bug 24.07** (email setup guide) — 1h. Jamil does the actual migration.
5. **Then Bug 24.04 / 24.05 / 24.06** (sales deck / LinkedIn / marketing strategy) — these are document/asset generation; can run in any order. Combined ~7-10h.

Marketing/sales/legal artifacts (Bugs 24.03, 24.04, 24.05, 24.06) all gate on **Jamil review-and-approval per Sub-rule 6** before shipped. Audit chat verifies factual accuracy first; Jamil approves tone + positioning second.

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
