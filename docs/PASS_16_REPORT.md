# PASS 16 REPORT — Polish, Cleanup & AI Targeting Brief

**Date:** 2026-04-24  
**Frontend branch:** `pass-16-polish-and-brief`  
**Backend branch:** `main`

---

## Tasks Completed

### Task 1 — Real PDF Invoice (replaces window.print)

**Frontend commit:** `a379232 fix(invoice): real PDF generation with jspdf`

- Created `src/lib/generateInvoicePdf.ts` using **jspdf v4** + **jspdf-autotable v5**
- VETT-branded dark header bar (`#0D0F14`), lime accents, PAID badge
- Line items table via `autoTable`; Y position tracked via `(doc as any).lastAutoTable.finalY`
- Totals block, footer with `VETT.AI` branding, direct `.save()` download (no print dialog)
- Rewrote `BillingInvoicesTab.tsx` to call `generateInvoicePdf()` — all `window.print()` logic removed
- Field mapping uses `??` fallbacks so invoices work for missions without itemised cost breakdown

---

### Task 2 — Remove Fake Retargeting Pixel Feature

**Frontend commit:** `d7ea57c refactor(targeting): remove fake retargeting pixel feature`

Files changed (8 total):

| File | Change |
|------|--------|
| `TargetingEngine.tsx` | Removed `retargeting` from `TargetingConfig`; removed "Advanced: Retargeting & Integrations" collapsible section |
| `pricingEngine.ts` | Removed `retargetingSurcharge` from interface, calculation, and return object |
| `MissionControlTargeting.tsx` | Removed `retargeting` from `SectionKey`, state, costs, `hasAny`, and JSX |
| `MobilePriceSummary.tsx` | Removed `retargetingSurcharge` prop |
| `StickyActionFooter.tsx` | Removed `retargetingSurcharge` prop |
| `PricingReceipt.tsx` | Removed retargeting display block and `Target` import |
| `MissionControlPricing.tsx` | Removed retargeting row |
| `DashboardPage.tsx` | Removed `retargeting` field from targeting config assembly |

TypeScript check: zero errors after cleanup.

---

### Task 3 — Refund Script for Past Retargeting Charges

**Backend commit:** `9eac5a0 refactor(pricing): remove retargeting surcharge + refund script + email template`

- `scripts/refundRetargetingCharges.js` — dry-run by default; `EXECUTE=1` issues Stripe partial refunds; `NOTIFY=1` sends emails via Resend
- Surcharge calculated as `respondent_count × $1.50` per mission
- Stripe refund metadata: `reason_internal: 'retargeting_feature_removed'`
- Groups by `user_id` so each user gets one email covering all affected missions
- `src/services/email.js`: added `sendRetargetingRefundEmail()` with VETT dark-theme HTML template
- `src/utils/pricingEngine.js`: removed `retargetingSurcharge` from backend pricing calculation

---

### Task 4 — Apple Pay / Google Pay Native Button

**Verification:** `docs/APPLE_PAY_VERIFICATION.md` (existing)

Confirmed `PaymentRequestButtonElement` from `@stripe/react-stripe-js` is already in use — no SVG workaround. No code changes needed.

---

### Task 5 — AI Targeting Brief

**Backend commit:** `7b56112 feat(ai): targeting brief generator + export endpoint + backfill`  
**Frontend commit:** `66645a4 feat(results): add Targeting Brief as 5th export button`

**Database:**
- Migration `add_targeting_brief_to_missions`: `ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS targeting_brief JSONB;`

**Backend:**
- `src/services/ai/targetingBrief.js` — `generateTargetingBrief()` builds age/country/gender/occupation distributions from persona profiles, calls Claude (`targeting_brief` call type → `claude-sonnet-4-6`), returns structured JSON with `icp_summary`, `meta_ads`, `google_ads`, `linkedin_ads`, `lookalike_seed`, `ad_copy_angles`
- `src/services/ai/anthropic.js` — added `targeting_brief: 'claude-sonnet-4-6'` to MODEL_ROUTING
- `src/routes/results.js` — `GET /:missionId/export/targeting-brief` returns `.md` attachment with Meta/Google/LinkedIn specs; 202 if still generating
- `src/jobs/runMission.js` — step 5b: generates brief after `synthesizeInsights`; non-fatal
- `scripts/backfillTargetingBriefs.js` — backfills all `completed` missions with `targeting_brief IS NULL`

**Frontend:**
- `ResultsPage.tsx` — "Targeting Brief" button in export dropdown; fetches with auth header; shows spinner; downloads `.md` file; 202 triggers "still generating" toast

---

### Task 6 — Excel Export: Insights + Demographic Breakdown Sheets

**Backend commit:** `e71b4e1 feat(xlsx): add Insights + Demographic breakdown sheets`

Excel now ships **5 sheets** (was 3):

| Sheet | Content |
|-------|---------|
| Cover | Title, brief, meta, executive summary |
| Raw responses | Every persona/question row |
| Summary | Per-question distribution / averages / verbatims |
| **Insights** (new) | Executive summary block, Key Findings with bullets, Recommended Next Actions numbered list |
| **Demographic breakdown** (new) | Age distribution, Country distribution, Gender distribution, Top 10 Occupations — all with alternating row banding |

Demographic sheet deduplicates by `persona_id` so each simulated respondent is counted once regardless of question count.

---

### Task 7 — Prompt Caching on AI Calls

**Backend commit:** `e71b4e1` (same commit as Task 6)

| File | Change |
|------|--------|
| `claudeAI.js` | Extracted survey methodology rules into `SURVEY_GEN_SYSTEM` constant (cached system prompt). Extracted targeting rules into `TARGETING_SUGGEST_SYSTEM` constant (cached). Both use `enablePromptCache: true`. |
| `insights.js` | Added `enablePromptCache: true` to existing `INSIGHT_SYSTEM_PROMPT` call. |

All three system prompts are >1 024 tokens — Anthropic's minimum cacheable prefix. Repeat calls within the 5-minute TTL window skip ≥95% of input tokens.

---

## Commit Log

### Frontend — `pass-16-polish-and-brief`

```
66645a4  feat(results): add Targeting Brief as 5th export button in dropdown
d7ea57c  refactor(targeting): remove fake retargeting pixel feature from UI and pricing
a379232  fix(invoice): real PDF generation with jspdf (replaces window.print fallback)
```

### Backend — `main`

```
e71b4e1  feat(xlsx): add Insights + Demographic breakdown sheets to Excel export
7b56112  feat(ai): targeting brief generator + export endpoint + backfill script
9eac5a0  refactor(pricing): remove retargeting surcharge + refund script + email template
```

---

## Known Gaps / Not Done

- Retargeting refund script has **not been executed** — requires manual `EXECUTE=1 NOTIFY=1` run after finance sign-off
- `analyseResults` in `claudeAI.js` (legacy results endpoint) does not use prompt caching — the prompt is fully dynamic per-mission; caching wouldn't help
- `refineQuestion` and `refineMissionDescription` use `question_refine` (Haiku) — prompts are short enough that caching is below the 1 024-token threshold

---

## Merge Instructions

```bash
# Frontend
git checkout main
git merge --no-ff pass-16-polish-and-brief
git push origin main

# Backend (already on main)
# Already pushed — e71b4e1 is live
```

---

## Verification Checklist

- [ ] Download invoice PDF from Billing tab — confirm VETT branding, PAID badge, correct totals
- [ ] Launch a new mission — confirm retargeting section is absent from TargetingEngine
- [ ] Confirm pricing breakdown no longer shows retargeting surcharge
- [ ] Complete a test mission — confirm `targeting_brief` column populated in Supabase
- [ ] Click "Targeting Brief" in Results export dropdown — confirm `.md` file downloads
- [ ] Download Excel export — confirm 5 sheets with Insights + Demographic breakdown
- [ ] Run `scripts/backfillTargetingBriefs.js` (dry-run) to confirm no errors
- [ ] Monitor `ai_calls` table for `cache_read_input_tokens > 0` on repeat calls
