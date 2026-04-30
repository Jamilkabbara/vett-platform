# VETT Public Launch Checklist

**Status:** in progress (Pass 24 Phase 1 in flight)
**Owner:** Jamil + audit chat (verification gate) + Claude Code (implementation)
**Update cadence:** after each Pass 24 bug ships

All items in the **Critical** section must be green before public-facing launch (paid ads, press outreach, cold outbound). Quality and Marketing sections can ship in parallel and don't block legal launch but improve first-impression conversion.

---

## Critical (legal / operational)

| # | Item | Owner | Status | Verification |
|---|---|---|---|---|
| 1 | Bug 24.03 legal pages live (`/privacy`, `/terms`, `/refunds`, Cookie Banner) | Claude Code → Jamil approval | ⬜ planned | Audit chat factual review + Jamil tone/positioning approval (Sub-rule 6) |
| 2 | Bug 24.07 email working (`hello@vettit.ai` sending + receiving via Google Workspace) | Jamil (manual GoDaddy/Workspace work) | ⬜ planned | mxtoolbox SPF/DKIM/DMARC pass + send/receive test |
| 3 | Refunds processed for missions `dcbc3b6f` + `91be5c7b` | Jamil (Stripe Dashboard) | ⬜ pending | Capture `re_xxx` IDs and backfill mission rows per `PASS_23_PROGRESS.md` SQL |
| 4 | Pass 23 deferred work complete (Bug 23.60, 23.74, 23.62, Phase B) | Agents 1, 2, 3 | 🟡 in-flight | Audit chat Chrome verification on production for each agent's PR |

## Quality (first-impression)

| # | Item | Owner | Status | Verification |
|---|---|---|---|---|
| 5 | Bug 24.01 Creative Attention v2 (DAIVID/Amplified depth: 24 emotions, attention prediction, cross-channel benchmarks, Creative Effectiveness Score) | Lead session | ⬜ planned | Run fresh CA mission (image + video) on prod; DB row populated with new fields; audit chat Chrome verification on results page |
| 6 | Bug 24.02 admin panel costs tracking + renewal calendar | Lead session | ⬜ planned | Jamil verifies all seed values match actual billing portals; renewal alert fires on test subscription set 5d out |
| 7 | All Pass 23 deferred verified shipped (audit chat Chrome cold-load each user-journey path) | Audit chat | 🟡 in-flight | Bug 23.60: 17 paths in `PASS_23_AGENT_1_LOG.md`; Bug 23.74: export each format and open in native app; Phase B: each comparison page renders + sitemap.xml indexed |

## Marketing (drives launch impact)

| # | Item | Owner | Status | Verification |
|---|---|---|---|---|
| 8 | Bug 24.04 sales deck generated (.pptx) | Claude Code → Jamil approval | ⬜ planned | Generate from real mission screenshots; Jamil reviews 14 slides; Sub-rule 6 |
| 9 | Bug 24.05 LinkedIn package documented | Claude Code → Jamil approval | ⬜ planned | 4 sections (profile / company page / outreach templates / content calendar); Sub-rule 6 |
| 10 | Bug 24.06 90-day marketing strategy documented | Claude Code → Jamil approval | ⬜ planned | 3 phases (Weeks 1-2 / 3-6 / 7-12) + KPIs; Sub-rule 6 |

## Optional (drives growth, not blocking launch)

| # | Item | Owner | Status | Verification |
|---|---|---|---|---|
| 11 | Sentry monitoring | Awaiting Jamil DSN | ⬜ blocked on input | DSN provisioned + first error captured |
| 12 | Demo recording (Loom 15 min) | Jamil | ⬜ optional | Recording linked from /landing + sales deck slide |
| 13 | B5 Subscriptions | **DEFERRED to Phase 2** | — | Revisit with revised pricing (Pro ~$99-149/mo, Team ~$299-499/mo) after first 50-100 paying users at one-shot pricing |

---

## Verification methods (per item)

### Critical / Quality items — technical doctrine (5-criterion + 5 sub-rules)
1. Code pushed + deploy succeeded
2. End-to-end user-journey reproduced
3. Original symptom verifiably absent
4. Screenshot / recording / `funnel_events` trace as proof
5. Regression-of-shipped escalated to higher severity

### Marketing items — Sub-rule 6
- Audit chat verifies factual accuracy against real DB / real product behavior (no hallucinated numbers, no claimed features that don't exist)
- Jamil verifies tone + business positioning (founder voice, MENA framing, defensible claims)
- Both must approve before status flips to `shipped`

---

## Risks identified (not blocking launch but track)

| Risk | Mitigation | Owner |
|---|---|---|
| Stripe flags account without legal pages | Bug 24.03 ships before any cold-outreach campaign | Claude Code |
| Email migration leaves `hello@vettit.ai` broken for hours | Bug 24.07 testing checklist requires send/receive test before cutting over | Jamil |
| Sales deck contains stale pricing (Phase 2 subscription numbers leak in) | Sub-rule 6 review process; Bug 24.04 slide 9 explicitly says "no subscription required" | Both |
| Agent 1/2 conflict on `CreativeAttentionResultsPage.tsx` | `// {Agent2-EXPORTS-START}` / END markers; agents check each other's logs before merge | Audit chat |
| Pass 23 refund backfill SQL run with wrong IDs | SQL pattern in `PASS_23_PROGRESS.md` includes sanity check (PI match, paid_amount cross-check) before execution | Jamil |

---

## Launch decision criteria

**"Public launch" defined as:** any of (a) paid LinkedIn Ads pilot live, (b) cold outbound DM campaign at >10 sends/day, (c) press release or PR pitch sent, (d) Product Hunt scheduled launch.

**Required before any of the above:**
- All Critical items (1-4) green
- Items 5 and 7 green (Quality minimum)
- Item 8 OR item 9 green (one external-facing artifact ready for warm intros)

Items 6, 10, 11, 12 nice-to-have but don't block.

---

## Update protocol

After each Pass 24 bug ships:
1. Update the relevant row's status (⬜ → 🟡 → ✅)
2. Capture verification evidence (screenshot link, audit chat confirmation, mission ID, prod URL)
3. If a previously-✅ item regresses, flip to 🚨 with severity note (per doctrine: regression-of-shipped is higher severity than original)
4. Commit with `docs(launch-checklist): update item N status` so the history is greppable

Status legend:
- ⬜ planned (not started)
- 🟡 in-flight (work in progress)
- ✅ shipped (audit chat verified + Jamil approved if Sub-rule 6 applies)
- 🚨 regression (was ✅, now broken — escalated severity)
- ⬛ blocked on external input
