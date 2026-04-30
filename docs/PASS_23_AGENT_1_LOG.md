# Pass 23 Agent 1 — Results Redesign Log

**Branch:** `pass-23-bug-60-results-redesign`
**Owner files:** `src/pages/ResultsPage.tsx`, `src/pages/CreativeAttentionResultsPage.tsx` (LAYOUT only — coordinate with Agent 2 export menu via `// {Agent2-EXPORTS-START} ... // {Agent2-EXPORTS-END}` markers), `src/components/charts/*`, `src/components/results/*` (NEW directory).
**Doctrine compliance:** code-shipped requires (1) push, (2) Vercel deploy READY for the SHA, (3) bundle hash change confirmed on prod, (4) audit chat Chrome verification on the user-journey paths below before merge.

---

## Bugs in scope

| Bug | Status | Notes |
|---|---|---|
| **23.60** Results page redesign | `planned → in-progress` | Spec from Pass 23 prompt history. Exec summary lead-sentence treatment, AI Insight typography, section hierarchy, void-gap elimination, share/export buttons, Brand Lift category-grouped layout. Applies to both `/results/:missionId` and `/creative-results/:missionId`. |
| **23.66** chart row-height polish | `extension of 23.60` | Verify multi-line labels never overlap bars at any viewport. Custom `YAxisTick` wraps cleanly at 20 chars/line. Dynamic chart height per data-point count. |

---

## Verification paths (must pass per doctrine before merge)

For `/results/:missionId` (default missions):

1. Cold-load with no filters: exec summary + tensions + cross-cut + screening funnel + per-question + recommended next step all render in correct hierarchy with no void gaps.
2. Tensions Flagged amber accent + severity pills + question-link backreferences clickable and scroll to anchor.
3. Cross-cut analysis segmented control switches dimensions cleanly.
4. Screening funnel hidden when `qualified_respondent_count === respondent_count`.
5. Per-question analysis: lead-sentence bold + supporting paragraph; no repeated "AI INSIGHT" label.
6. Brand Lift mission: questions grouped by category (purchase_intent / awareness / recall / sentiment) using `mission.questions[i].category` (Bug 23.56 storage).
7. Recommended Next Step prominent CTA visible without scrolling past; AI disclaimer footer-style.
8. Share + Export buttons on header, copy-exec-summary-as-markdown + anchor links per section.
9. Multi-line chart labels never overlap bars at 320px / 768px / 1280px / 1920px viewports.

For `/creative-results/:missionId` (CA missions):

10. Hero image preserved (Bug 23.75v2 verified) above brand strength.
11. Brand Strength Scorecard: 4 cards with above/at/below industry-typical indicators.
12. Emotion bar chart: top emotion lime accent.
13. Strengths / Concerns / Recommendations: section header + lime / amber / indigo accents per column.
14. Best Platform Fit: pill + tooltip with rationale (uses Bug 23.73 `{platform, rationale}` shape).
15. Frame-by-Frame: hidden for images, shown for video only.

For shareability (cross-cut):

16. "Copy executive summary" button → markdown copied to clipboard.
17. Anchor links work for `#tensions`, `#cross-cut`, `#per-question`, `#next-step`.

---

## Tick-off log

*(populate as work progresses)*

### 2026-04-30 — branch created

- ✓ Branched off main at `d7bd20d` (Pass 23 close-out + Pass 24 init docs).
- ✓ Created this log file per coordination rules.
- → Next: audit current ResultsPage.tsx structure (1737+ lines per earlier survey) + draft a section-by-section migration plan that I can verify incrementally rather than ship a single 6-8h diff.

---

## Coordination notes

- Agent 2 (`pass-23-bug-74-ca-exports`) will touch `CreativeAttentionResultsPage.tsx` in the export menu region only. I leave that intact and add `// {Agent2-EXPORTS-START}` / `// {Agent2-EXPORTS-END}` markers around the existing export-menu JSX block when I get there, so Agent 2's diff slots in cleanly.
- Agent 3 (`pass-23-phase-b-comparisons`) does not overlap with my files.
- If I discover ResultsPage shares helpers / types with another page Agent 2 needs, I'll factor them into `src/lib/` / `src/types/` and mark the file in this log.

---

## Architectural decisions (Agent 1 scope)

*(populate as work progresses)*
