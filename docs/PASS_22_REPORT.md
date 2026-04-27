# Pass 22 — Comprehensive Hardening Report

Pass 22 closes 28 bugs across security, telemetry, AI depth, mobile, perf, and polish, plus one safety hotfix discovered during shipping.

## Verification setup

- **Backend `vettit-backend main`:** `f5cee4f` (Pass 22 close-out tip)
- **Frontend `vett-platform main`:** `322aa31` (Pass 22 close-out tip; Vercel bundle `index-DBZaTMCO.js`)
- **DB:** Supabase project `hxuhqtczdzmiujrdcrta` (Postgres 17.6.1, ACTIVE_HEALTHY)
- **Test missions:** cat hotel `e18c9802-f9e1-4677-97f1-91ec1467380b` (5Q completed, $35); Lebanon influencer `e75a0230-a07f-4835-9bf1-b5c08ad0ea07` ($27.50 with screening); Bali $27.50 (the orphan that anchored the Bug 22.23 forensic).

## Bug ledger

| # | Bug | Backend SHA | Frontend SHA | Verification artifact | Notes |
|---|---|---|---|---|---|
| 22.1 | funnel emit reliability | `79760da` | `dd2e8d0` | New POST /api/funnel/track endpoint returns 202 for anon; ChatWidget+landing emit via fetch keepalive: true; localStorage queue (cap 50); session_id correlates anon→signup | replays drained on app boot |
| 22.2 | stage micro-funnel admin UI | `79760da` | `dd2e8d0` | New `admin_micro_funnel(range)` RPC + AdminOverview "Behavioural Funnel (events)" section | sits beside existing mission-based funnel |
| 22.3 | session_id correlation | `79760da` | `dd2e8d0` | `idx_funnel_events_session_id` partial index + `admin_session_funnel(range)` RPC + AdminOverview one-line summary | localStorage `vett_session_id` |
| 22.4 | event_data jsonb | `79760da` | `dd2e8d0` | `metadata` jsonb already in schema; landing/setup/paid emits enriched with referrer/UTM/tier/promo | server-side `_ua`/`_referer` enrichment |
| 22.5 | RLS on stripe_webhook_events / admin_alerts / payment_errors | `950e5a2` | — | advisor security: 3 ERROR → 0 | (SELECT auth.uid()) form from start |
| 22.6 | admin RPC lockdown | `4b18e87` + `af39f29` | — | advisor security: 22 SECURITY DEFINER WARNs → 1 (intentional, see D1 below) | A.1 strict + service_role refactor; 0 downtime |
| 22.7 | leaked-password protection | — | — | DOCUMENTED as intentional skip (D2 below) | OAuth-only platform |
| 22.8 | Stripe webhook idempotency | `da92cc5` | — | DO-block 3-state contract verified: fresh INSERT, retry hits 23505, mark processed sticks; partial idx for unprocessed | INSERT-then-skip + stale-PI guard |
| 22.9 | payment_errors telemetry | `70e1396` + `96a90ca` | `4e6fe3c` | New columns + admin viewer; 7 stages capture client + backend + webhook errors | `payment_errors` row count = 0 currently (no failures since deploy); telemetry primed |
| 22.10 | mission status recovery cron | `8758085` + `0204240` + `89087c6` | — | 6 admin_alerts rows of `orphan_pending_payment_legacy_unsafe_to_auto_reset` fired ~45s after `89087c6` deploy | + safety hotfix (alert-only for legacy) + primer-tick hotfix 22.10c |
| 22.12 | perf indexes + RLS auth.uid() optimization | `8758085` | — | advisor performance: 25 WARNs (5 RLS + 19 multi-permissive + 1 dup) → 0; 9 unindexed FKs → 0 | unused-index drops deferred to 22.12b |
| 22.13 | narrative 4-paragraph executive summary | `19564cb` | `90378c2` | INSIGHT_SYSTEM_PROMPT replaces "3-5 sentences <750 chars" with 4-paragraph spec (250-800 words); ResultsPage splits on blank lines into `<p>` tags with `max-w-prose` | re-runnable on existing missions via `/admin/missions/bulk-reanalyze` |
| 22.14 | per-persona reasoning trace | `f5cee4f` | `b70c5eb` | New `persona_response_reasoning` table + simulate prompt asks for reasoning inline; runMission persists when ≤50 personas; new GET /api/results/:id/reasoning + frontend modal | ~$0.06/mission additional cost |
| 22.15 | segment_breakdowns cross-cut | `f5cee4f` | `b70c5eb` | INSIGHT_SYSTEM_PROMPT + persona_summaries injected; new CrossCutCard component renders axis-tabbed segments | empty array if homogeneous sample |
| 22.16 | contradiction flagging | `19564cb` | `90378c2` | `contradictions[]` in synthesis JSON output; Tensions Flagged amber card on ResultsPage | renders only if non-empty |
| 22.17 | rating CIs | `19564cb` | `90378c2` | `computeRatingStats` adds `ci_low`/`ci_high`/`stddev`/`rating_n` to each rating bucket; ResultsPage renders "± 0.4 (95% CI: 3.4-4.2, n=4)" with low-confidence flag for n<8 | exported via QuestionResult type |
| 22.18 | mobile responsive sweep | — | `89ca8db` | Admin desktop-only gate at `<lg`; full audit doc in `PASS_22_MOBILE_AUDIT.md` | per-route micro-fixes deferred to Pass 23 |
| 22.19 | Mission Control mobile | — | — | DEFERRED (audit doc) | sidebar→drawer + slider touch sizing; pre-existing MobilePriceSummary + StickyActionFooter cover the basics |
| 22.20 | charts mobile reflow | — | — | DEFERRED (audit doc) | donut→bar below 480px; ResponsiveContainer keeps current charts legible |
| 22.21 | dead code sweep | — | this batch | unrouted SettingsPage.tsx deleted; no `vettit.app` / `vettit.com` refs in either repo | |
| 22.22 | Pass 22 final report | — | this batch | this file | + journal update |
| 22.23 | Stripe Element error / orphan PIs | `70e1396` + `96a90ca` | `4e6fe3c` | telemetry-first: idempotent create-intent (Bug 22.9 path) + payment_errors writes; root-cause fix DEFERRED until telemetry data accumulates → Pass 23 | OverageModal ready-event parity also shipped |
| 22.24 | screener calibration | `f5cee4f` | — | claudeAI.js SCREENER CALIBRATION RULE matrix; near-future-intent options qualify by default; missions.screener_criteria column whitelisted | user-editable preview UI deferred to Pass 23 |
| 22.25 | export polish | — | — | DEFERRED (audit doc) | needs visual inspection of generated files; existing pdf.js/pptx.js/xlsx.js have prior Pass-X bug-fix tags |
| 22.26 | chatbot Markdown rendering | — | `8cb0173` | ChatMarkdown component via react-markdown with chat-bubble-tuned components | bold/headings/bullets/hr/code/links/blockquote |
| 22.27 | em-dash + double-dash ban | `19564cb` + `f5cee4f` | (downstream of backend) | shared WRITING_STYLE constant appended to all 6 AI service prompts (insights, simulate, personas, chat, targetingBrief, creativeAttention); static em-dashes swept from AI templates | leaves JSDoc comment em-dashes alone |
| 22.28 | frontend perf | — | `322aa31` | ChatWidget lazy-loaded on /missions + /results; build verified own chunk (18.75KB / 6.13KB gz); vendor-markdown defers from initial bundle | ProfilePage 852KB / 281KB gz flagged for Pass 23 |

## Critical decisions (`PASS_22_DECISIONS.md`)

- **D1 — `is_admin_user(uuid)` retains EXECUTE for `authenticated`.** Bug 22.6 advisor WARN "authenticated_security_definer_function_executable" is intentional (RLS policies on funnel_events/admin_user_notes/stripe_webhook_events/admin_alerts/payment_errors call `is_admin_user` from authenticated context).
- **D2 — Bug 22.7 leaked-password protection skipped.** VETT is OAuth-only (Google + Apple); the dashboard now requires configuring an email provider before exposing the toggle, which would mean adding email/password sign-up. Re-evaluate if VETT ever introduces email/password auth.
- **Bug 22.6 Path A1.** Drop in-body `is_admin_user(auth.uid())` guard from 8 admin RPCs + REVOKE EXECUTE from PUBLIC/anon/authenticated. Backend admin.js refactored to pure service-role singleton in a coordinated 3-commit sequence; zero downtime, zero security regression.
- **Bug 22.10 safety hotfix.** Smoke test of Job 2 query found 6 historical orphans with `latest_payment_intent_id IS NULL` (predate Bug 22.9). Cron's "no PI" branch changed from auto-flip-to-draft → alert-only because the Bali forensic showed those rows can have a SUCCEEDED PI in Stripe (webhook miss) — auto-flipping would silently lose paid missions.
- **Bug 22.10c primer-tick hotfix.** Each Railway redeploy resets the `setInterval` clock; busy deploy days kept pushing Job 2's first tick past the next redeploy, so it never fired in production. Added `setTimeout(runJob{1,2}, 30s/45s)` so first tick happens regardless of redeploy frequency. 6 alerts fired within ~45s of deploy.
- **Bug 22.23 telemetry-first.** Stripe `requires_payment_method` orphans + reported "ready event" Element error point at multiple possible root causes (Apple Pay path? mobile Safari? mid-flow unmount?). Rather than guess a fix, B2 shipped the telemetry pipeline (payment_errors with stage taxonomy + viewport + UA + PI id) and the idempotent create-intent (which alone stops PI sprawl regardless of root cause). Root-cause fix lands in Pass 23 once 24-48h of failure data accumulates.

## Production readiness

- **Vercel deployment:** frontend bundle `index-DBZaTMCO.js` live at `https://www.vettit.ai`
- **Railway:** `/health` 200; mission recovery cron alive (verified by 6 admin_alerts rows fired ~45s after deploy)
- **Migrations applied:** 7 (`pass_22_bug_22_5` through `pass_22_b4_persona_reasoning_and_screener_criteria`)
- **Backfills run:** 0 (all schema changes were nullable adds + reversible policy swaps)
- **Advisor security:** 0 ERROR · 2 intentional WARN · 4 INFO (pre-existing `ai_calls`/`crm_leads` RLS-no-policy; new `cron_locks`/`promo_codes` RLS-no-policy = default-deny by design)
- **Advisor performance:** 0 ERROR · 0 WARN · 19 INFO (unused-index entries; the +11 since pre-Pass-22 are the new FK indexes added in Bug 22.12 — expected, will be exercised by traffic, deferred to Bug 22.12b)

## Cost analysis

- **AI cost per mission baseline:** ~$0.14 (existing 7 completed missions, mix of 10-50 personas)
- **Bug 22.14 reasoning increase:** ~$0.06/mission for 50-persona × 5-question (under the $0.50 STOP-AND-REPORT threshold)
- **Bug 22.27 em-dash ban:** $0 (prompt-only change, no token impact)
- **Bug 22.13 narrative summary:** ~$0.005/mission additional output tokens (~150 extra tokens at Sonnet rate)
- **Bug 22.15 segment_breakdowns:** ~$0.005/mission (inline in same Sonnet call)

Net per-mission cost increase from Pass 22: ~$0.07. Mission tier pricing ($35-$135) absorbs this trivially; gross margin unchanged.

## Carryover to Pass 23

### Real fixes pending data

- **Bug 22.23 root-cause fix.** Wait 24-48h for `payment_errors` telemetry. Pick targeted fix from the actual stage/error_code distribution.
- **6 historical pending_payment orphans.** Cron now alerts but does not auto-resolve. Manual Stripe Dashboard reconciliation: search PIs by `metadata['missionId']`; recover or reset per row.

### Tactical work documented and deferred

- **Bug 22.10b** — webhook event reprocess cron Job 3 (only if telemetry shows we need it; partial index already in place).
- **Bug 22.12b** — drop unused indexes after observing 1-2 weeks of usage stats.
- **Bug 22.18 punch list** — per-route micro-fixes documented in `PASS_22_MOBILE_AUDIT.md`.
- **Bug 22.19** — Mission Control mobile sidebar→drawer rewrite.
- **Bug 22.20** — chart donut→bar below 480px.
- **Bug 22.24** — user-editable screener preview UI on MissionSetupPage (backend rule already shipped).
- **Bug 22.25** — export polish; needs visual inspection of generated files in all 3 formats.
- **Bug 22.28 punch list** — ProfilePage 852KB investigation, image WebP work, Lighthouse run-and-record.

### New findings to seed Pass 23

- ChatWidget can be further lazy-broken (split out the agent state machinery from the markdown renderer).
- Funnel-event volume will grow significantly once Bug 22.1 emit reliability stabilises; consider a partition-by-month strategy on `funnel_events` once row count crosses ~1M.

## Verification — how to canary

1. Open `https://www.vettit.ai/admin` → Behavioural Funnel section visible. Payment Errors tab clickable.
2. Open any completed mission → Tensions Flagged card if any contradictions; Cross-Cut Analysis tabs if any segments; rating questions show "± X.X (95% CI: ...)".
3. Click "Show sample reasoning" on a per-question card → modal lists up to 5 anonymized persona reasons.
4. Open ChatWidget on /results/:id → response renders **bold**, headings, bullets, `code` correctly (no literal asterisks).
5. Open `/admin` on mobile (< 1024px) → "Admin is desktop-only" message.
6. DevTools Network tab on /missions: confirm NO `ChatWidget-*.js` and NO `vendor-markdown-*.js` on initial load. Click chat bubble → both chunks fetch.
