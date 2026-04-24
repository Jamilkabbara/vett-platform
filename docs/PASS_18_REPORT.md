# PASS 18 REPORT — Export Data Integrity

**Date:** 2026-04-24  
**Frontend branch:** `pass-18-export-integrity`  
**Backend branch:** `pass-18-export-integrity`

---

## DB Migrations Applied

| Migration | Change |
|-----------|--------|
| `add_screened_out_to_mission_responses` | `screened_out BOOLEAN DEFAULT FALSE` on `mission_responses`, backfilled from `persona_profile` JSONB, composite index added |

**Verification query:** `e18c9802` mission → 26 total rows, 6 screened out ✅ (matches 10 respondents: 4 qualified × 5 Qs + 6 screened × 1 Q = 26)

---

## Bug Fixes

### Bug 1 + 2 — Screener qualifying-answer + aggregation

**Root cause:** `qualifyingAnswer` was a single string — screeners with multiple affirmative options (e.g. "one cat" AND "multiple cats" both target cat owners) couldn't mark both as qualifying. Aggregation excluded screened-out personas from the screening question itself, hiding the 60/40 split entirely.

**Fixes:**
- **DB migration:** `mission_responses.screened_out BOOLEAN` — backfilled, indexed
- **`simulate.js`:** `passesScreening()` now checks `qualifying_answers[]` → `screening_continue_on[]` → `qualifyingAnswer` (in priority order)
- **`runMission.js`:** inserts `screened_out` as first-class column on response rows
- **`claudeAI.js`:** `generateSurvey` prompt emits `qualifying_answers: [...]` array containing ALL affirmative options; `qualifyingAnswer` kept for legacy compat
- **`shared.js`:** `aggregateWithScreeningAware()` uses `allResponses` for screening questions and `qualifiedResponses` for non-screening questions
- **`QuestionEngine.tsx`:** `Question` interface gains `qualifying_answers?: string[]` and `screening_continue_on?: string[]`
- **`MissionControlQuestions.tsx`:** `handleToggleQualifying` toggles within an array; `isPass` checks `qualifying_answers[]` with `qualifyingAnswer` fallback

**Commit backend:** `8ac970f`  
**Commit frontend:** `febc5c8`

---

### Bug 3 — Multi-select percentages

**Root cause:** All three renderers computed `pct = count / sum(all_option_counts)` instead of `count / n_respondents`. This produced 31%/31%/23%/15% instead of 100%/100%/75%/50%.

**Fix:** `aggregate()` in `insights.js` now stores `n_respondents` on multi-type questions. PDF, PPTX, and XLSX all use `n_respondents` as denominator for multi questions, with a contextual note "(multi-select — totals may exceed 100%)".

**Commit backend:** `a686d1d`

---

### Bugs 4 + 5 — Exec summary drop-off hallucination

**Root cause:** `synthesizeInsights` prompt passed only `Actual responses collected: N` where N=26 (response rows), which the model misread as 26 human participants with 16 dropping off. No guardrail against this.

**Fix:** Prompt now passes structured `SAMPLE METRICS` block:
```json
{
  "total_respondents": 10,
  "screened_out": 6,
  "completed": 4,
  "response_records_total": 26
}
```
With explicit rule: "response_records_total is NOT a headcount. Never use it as a dropout metric." Plus screener design guardrail: if `screened_out > 30%`, assess screener quality rather than praising it.

**Commit backend:** `a686d1d`

---

### Bug 6 — PPTX recommendations lose paragraph breaks

**Root cause:** pptxgenjs text runs in an array share a single paragraph unless `breakLine: true` is set. Items were rendered inline, producing "01. ...decisions.02. Prioritize...".

**Fix:** Recommendations: each number prefix (bold lime 12pt) + body text (14pt) with `{ text: '', options: { breakLine: true } }` between items. Follow-ups: title + breakLine + rationale per follow-up block.

**Commit backend:** `a686d1d`

---

### Bug 7 — Chart labels and verbatims pre-truncated

**Root cause:** `.slice(0, 30)` in `pdf.js barRow`, `.slice(0, 28)` in `pptx.js` chart labels, `.slice(0, 220)` / `.slice(0, 200)` on verbatims, `.slice(0, 250)` / `.slice(0, 80)` in XLSX.

**Fix:** All truncation removed. PDF relies on PDFKit's native `{ ellipsis: true, width: N }` for graceful overflow. PPTX and XLSX pass full strings. CSV/XLSX never truncated.

**Commit backend:** `a686d1d`

---

### Bug 8 — PPTX KPI slide shows only 3 of 5

**Root cause:** Claude returned up to 5 KPIs; `.slice(0, 3)` silently dropped 2 without the prompt knowing.

**Fix:** Insights prompt now instructs "Return EXACTLY 3 KPIs — no more, no fewer." The `.slice(0, 3)` safety cap remains in PPTX as a rendering guard.

**Commit backend:** `a686d1d`

---

### Bug 9 — Results PDF uses invoice filename prefix

**Status: NOT REPRODUCIBLE.** Grep across entire backend source found zero occurrences of `vett_invoice_`. Results PDF filename is already `vett-report-{slug}.pdf` in `pdf.js:100`. PPTX uses `vett-report-{slug}.pptx`, XLSX uses `vett-report-{slug}.xlsx`. This bug may have existed in a much earlier version and was already corrected.

---

### Bug 10 — PDF star glyph renders as `&\x05`

**Root cause:** PDFKit's bundled Helvetica lacks U+2605 (★). The character was passed as-is in the rating row label.

**Fix:** `drawStar(doc, x, y, size, color)` path primitive added to `pdf.js`. Uses 10-point star polygon (5 outer + 5 inner vertices). Called per rating level instead of using the `★` character. All `★` references removed from PDF generator.

**Commit backend:** `a686d1d`

---

### Bug 11 — PPTX exec summary clips at page edge

**Root cause:** Fixed-height text frame `h: 4.5` with no overflow handling. Long summaries clipped silently.

**Fix:** `autoFit: true` added to exec summary `addText()` call. Insights prompt also soft-caps summary at 750 characters. Both defenses in place.

**Commit backend:** `a686d1d`

---

## Commit Log

### Backend — `pass-18-export-integrity`

```
a686d1d  fix(exports): multi-select %, truncation removal, star paths, PPTX paragraphs, insights guardrails
8ac970f  fix(screening): multi-qualifying-answer model + correct aggregation for screener questions
```

### Frontend — `pass-18-export-integrity`

```
febc5c8  fix(screening): multi-qualifying-answer toggle in MissionControlQuestions
```

---

## Manual Verification Steps (Jamil)

After merging both branches:

1. **Screening aggregation** — Cat hotel mission PPTX/PDF Q1 should show `one cat (4)` + `multiple cats (6)` = 100% of 10 respondents
2. **Multi-select** — Cat hotel Q5 (if multi-type) should show percentages out of 10, not out of total clicks
3. **Insights** — Re-run insights on cat hotel via admin panel. Exec summary must NOT claim 16/26 dropout. Must flag that 60% screened-out warrants screener redesign
4. **PPTX paragraph breaks** — Recommendations slide: each numbered item on its own line. Follow-ups slide: title and rationale visually separated
5. **Labels** — Luggage Q4 options show full text in PDF and PPTX
6. **KPI count** — Exactly 3 KPI cards on slide 3 for both test missions
7. **Star ratings** — Luggage rating question PDF shows lime star glyphs, not `&\x05`
8. **Exec summary** — Cat hotel PPTX slide 2 shows full text without clipping
9. **Filename** — PDF download = `vett-report-cat-hotel-...pdf` (confirmed already correct)

---

## Known Remaining Gaps

- Insights re-generation for EXISTING missions: old missions stored `insights` JSONB before the guardrail was added. To fix their exports, trigger re-analysis from admin panel → "Re-run insights" button (feature gap for a future pass).
- Rating stars in PPTX still use `★ 1` / `★ 2` text labels in chart categories — those render via PowerPoint's font stack (usually fine with Calibri), not via PDFKit, so no fix needed there.
