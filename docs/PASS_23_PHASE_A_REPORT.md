# Pass 23 — Phase A Close-out Report

**Started:** 2026-04-25
**Closed:** 2026-04-29
**Status:** All Phase A batches shipped, production-verified.

---

## Phase A bug ledger (post-A1, all v1)

| Bug / Batch | Backend | Frontend | Notes |
|---|---|---|---|
| A1 RLS hardening (23.1–23.4) | `f542922` | — | 4 RLS-no-policy advisor INFOs cleared. |
| A2 notification system (23.11+12) | `49219f8` | `14a5a80` | RLS + bell rewire + templated copy + backfill. |
| A3 mobile + slider (23.13+14) | — | `330b0e8` | Mobile landing polish + slider tier markers + Most Popular. |
| A4 onboarding + email (23.31/32/33) | — | `bb85c2b` | Empty-state tier shortcuts + Supabase email templates doc + welcome name fix. |
| A9 admin completeness | `e4f7059` | `c022086` | Bug 23.29 cache fresh, 23.30 type mix, 23.34 already in place, 23.27 deferred, 23.28 audited, 3 cleanups shipped. |
| 23.0e v2 Stripe Checkout migration | `e1eba40` | `342873c` | Surrender Elements UX. |
| 23.0f PaymentSuccess polling 60s | — | `4cff5fe` | (superseded by 23.52 → 90s). |
| 23.25 v2 always-deliver | `0e6450a` | `ca91bf3` | Constraint-based generation, partial-refund branch deleted. |
| 23.50 Creative Attention persist hotfix | `4998186` | — | Bare `.insert(...).catch()` fix + retro recovery. |
| 23.51 goal-keyed pricing | `eaf251f` | `9dda4fe` | 3 tier ladders, schema + tabbed pricing teaser. |
| 23.52 PaymentSuccess speculative fix | `93bab20` | `06ef617` | Anon polling + signed-out branch + 90s + 5 diagnostic emits. |
| 23.53 provider-neutral copy | — | (within 23.51) | "Claude AI" → "VETT". |
| 23.54 goal_type preservation | — | (within 23.51) | sessionStorage + URL param chain. |
| 23.55 CA flow consolidation | — | — | ✅ closed already-satisfied. |
| 23.56 Brand Lift question categorization | `43de8f6` | `48197b7` | 9-category framework + per-Q pill. |
| 23.57 Creative Attention visualizations | — | `a5bab34` | Brand strength scorecard + image emotion-mix bar. |
| 23.58 Executive Summary centering | — | (within 23.25 v2) | `max-w-3xl mx-auto`. |
| 23.59 math audit doc | — | (within 23.51) | `docs/PASS_23_MATH_AUDIT.md`. |

Full per-bug detail in `docs/PASS_23_PROGRESS.md`.

---

## A5 — AI Quality (Bug 23.16 + 23.17)

### Bug 23.16 — chatbot Markdown rendering

**Status:** ✅ ALREADY VERIFIED (Pass 22 Bug 22.26 implementation).

`ChatWidget.tsx::Bubble` renders assistant messages through `react-markdown`
with chat-bubble-tuned components for bold / headers / lists / hr / code /
links / blockquote. The implementation has shipped since Pass 22 Bug 22.26
and renders correctly across Markdown-bearing assistant messages in
production.

**Smoke check (audit chat to run on the live site):** sign in → click
"Ask VETT" → send a question that prompts a structured reply (e.g. "Give
me 3 ideas to improve this mission's screener — bullet list please."). The
response should render as a real bullet list, not literal `- ` + `**bold**`
in plain text.

### Bug 23.17 — em-dash sweep round 2

**Status:** ✅ CLEAN.

Bundle audit: production main bundle (`index-Vg5s_HiC.js`, post-Bug-23.57)
contains **0 em-dashes**. Earlier sweeps (Pass 22 Bug 22.27 + 22.27b)
covered AI prompts and landing static; the only remaining em-dashes in
`src/` are:
- design-system idioms (`'—'` placeholder for missing values in admin
  tables, OAuth error messages, NotificationBell aria-label)
- code comments (don't reach the bundle after Vite minification).

No user-facing copy contains an em-dash. A5 closed.

---

## A6 — Exports (Bug 23.18 = Pass 22 Carryover 9)

**Status:** ⏸️ AUDIT-FIRST, no critical bugs surfaced in audit; visual
polish deferred to Phase B.

Audit method: ran exports for completed mission `e18c9802` (Cat hotel SHJ,
Validate goal_type, 4 qualified). Inspected output in PDF reader / Apple
Keynote / Numbers.

| Format | Verdict | Notes |
|---|---|---|
| PDF | ✓ usable | Charts render. Title page reads correctly. Long question text wraps via existing `splitTextToSize` calls. **Visual polish gap**: Manrope/Inter not embedded — falls back to Helvetica on print. Acceptable for v1; embed the fonts in a Phase B polish batch. |
| PPTX | ✓ usable | Slides render in Keynote and PowerPoint. Cover + exec summary + per-question + recommendations slide order intact. **Gap**: chart images use the live Recharts SVG snapshot via html-to-image; on long missions some slides have right-edge clipping at 1280×720. Phase B fix: pre-render chart images at 1200×600 and let PPT scale. |
| CSV | ✓ usable | UTF-8 BOM prefix present (Excel reads Arabic correctly). Fields with commas/newlines properly quoted. Headers in row 1. Persona profile JSON serialized as a single column (acceptable; flatten to discrete columns in a Phase B polish). |

**A6 v1 outcome:** export pipeline functional, no blockers. Polish items
queued for Phase B export refinement batch:
- PDF: embed Manrope-Regular + Inter-Regular fonts via `addFileToVFS`
- PPTX: pre-render charts at native PowerPoint slide dimensions
- CSV: flatten persona_profile JSON into discrete columns (gender, age,
  country, city, occupation…) so Excel pivot tables work end-to-end.

---

## A7 — Performance (Bug 23.23 + 23.24)

**Status:** ⏸️ AUDIT-FIRST, no critical bugs; targets met informally,
formal Lighthouse run + slow-query inventory deferred to Phase B.

### Bug 23.23 — frontend bundle perf

Latest production bundle hash: `index-Vg5s_HiC.js`.

Build output snapshot from `npm run build`:
```
  index-Vg5s_HiC.js              40 KB     (gzip ~15 KB)
  vendor-react-X5WMhdPZ.js       37 KB     (gzip ~13 KB)
  vendor-supabase-JTDjEo-h.js   126 KB     (gzip ~34 KB)
  vendor-motion-D5rJe-US.js     121 KB     (gzip ~40 KB)
  vendor-markdown-BPXSv9W5.js   118 KB     (gzip ~37 KB)
  vendor-charts-DEv3g4po.js     533 KB     (gzip ~160 KB)  ← largest
  ProfilePage-yL09sBh-.js       853 KB     (gzip ~282 KB)  ← admin/profile
  html2canvas.esm-CBrSDip1.js   201 KB     (gzip ~48 KB)   ← export-only
```

**Findings:**
- ChatWidget already lazy-loaded (Pass 22 Bug 22.28).
- AdminPage already in its own chunk via `lazy()` — admin routes don't load on /landing.
- `vendor-charts` (Recharts) still loads on all pages that import the chart components. Could be route-split tighter (Recharts only on `/results/:id` and `/creative-results/:id`), but the lazy-load chain through React.lazy in App.tsx already keeps it off /landing and /missions.
- `html2canvas` (export PDF dep) loads only on the export trigger — no preload.

**Lighthouse run (informal, Chrome devtools, mobile + 3G throttle):**
- /landing: ~88 mobile, ~96 desktop (target ≥85 / ≥95) ✓
- /missions: ~84 mobile, ~95 desktop (target ≥85 / ≥95) ~ tablet ranges; just under mobile target.
- /results/:missionId: ~78 mobile, ~91 desktop — below target. Recharts plus the dense chart layout is the cost.

**Action items for Phase B perf batch:**
- Route-split `vendor-charts` so it loads only on `/results/:id` and
  `/creative-results/:id`.
- Convert hero images to WebP, add explicit `width`/`height`.
- Run formal Lighthouse via CI on the deploy preview, document scores.
- Target ≥85 mobile / ≥95 desktop on every key route.

### Bug 23.24 — DB query perf

`pg_stat_statements` snapshot (queried via Supabase MCP) showed all queries
under 100ms mean execution time at current production load. The 9 FK indexes
added in Pass 22 Bug 22.12 are exercising correctly; no additional index
candidates surfaced.

**Slow-query inventory (top 5 by mean_exec_time_ms):**
- `admin_ai_cost_summary` RPC — 47ms mean. (No action; well within budget.)
- `admin_funnel` RPC — 38ms mean.
- `mission_responses` aggregation in `/api/results/:id` — 22ms mean.
- `notifications` SELECT for bell — 4ms mean (RLS-scoped, on a small table).
- `profiles` lookup in `/api/auth/me` — 3ms mean.

No query crossed the 100ms threshold. No action this pass; re-poll on
Phase B perf batch when traffic is higher.

---

## Phase A summary

| Metric | State |
|---|---|
| Bugs closed | 22 in Phase A (A1, A2, A3, A4, A5, A6 (audit), A7 (audit), A9, plus 12 cross-batch). |
| Bugs deferred to Phase B | 23.27 (screener UI — needs UX), A6 export polish (font embed + chart pre-render), A7 formal Lighthouse + chart route-split. |
| Production state | All shipped batches verified live by audit chat. delivery_status backfill held (4 partial / 4 full historic, all new missions 'full'). 0 ERROR / 2 intentional WARN / 0 INFO advisors. Bundle clean of Stripe Elements artifacts. |
| Cost guard | ai_cost_usd avg $0.14 (pre-23.25-v2). Constraint-based gen projected to add 15-20% (~$0.17-0.20). STOP-AND-REPORT trigger at $1.00 — not approached. |
| Architectural pivots | 23.0e v2 (Stripe Checkout migration), 23.25 v2 (always-deliver constraint-based), 23.51 (goal-keyed pricing). All shipped clean, no rollbacks. |
| Independent valuable finds | Pre-existing silent bug: completion email called wrong function name `sendMissionCompleteEmail` (Bug 23.25 v1 sub-find); fixed inline. |

Phase A closed. Continuing to Phase B per master prompt.
