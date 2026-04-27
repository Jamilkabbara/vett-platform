# Pass 22 — Export Audit (Bug 22.25)

Companion to `PASS_22_REPORT.md`. Documents the state of PDF / PPTX / XLSX export pipelines and what shipped vs deferred in B6.

## Repo state (read-only audit; no fixes applied)

Backend exports live at `vettit-backend/src/services/exports/`:

- `pdf.js` — uses **pdfkit** (NOT jsPDF as master prompt B6 assumed).
- `pptx.js` — uses pptxgenjs.
- `xlsx.js` — uses exceljs (5-sheet workbook with native UTF-8 cell values).
- `shared.js` — common helpers.

## Findings vs master prompt's expected issues

The master prompt assumed jsPDF + raw-CSV implementations and prescribed fixes accordingly. Re-checking against the actual stack:

| Master-prompt concern | Actual state | Action |
|---|---|---|
| jsPDF `text()` without `splitTextToSize()` → overflow | pdfkit handles wrapping natively; existing code uses `width: ..., ellipsis: true` everywhere | Already covered (pre-Pass-22 fix per `// Bug 7 fix:` comments in the file) |
| Embedded fonts (Manrope/Inter) | pdfkit ships with Helvetica; star glyph U+2605 was rendered as a path primitive (`drawStar`) per `// Bug 10 fix` | Functional, no embedded-font work needed |
| Page breaks mid-chart | Each section calls `doc.addPage()` explicitly | Audit confirms no orphan-section issue in code; visual verification deferred |
| PPTX text-box overflow | pptxgenjs has built-in `valign` + `shrinkText` | Verify visually (deferred) |
| CSV escape | We export XLSX, not CSV; exceljs handles cell values natively | N/A |
| UTF-8 BOM | XLSX is binary, BOM doesn't apply | N/A |

## What shipped in B6

### Bug 22.26 — chatbot Markdown rendering ✅

`src/components/chat/ChatWidget.tsx` Bubble component now renders assistant messages through `react-markdown` (already a dependency) with chat-bubble-tuned components:

- `**bold**` → `<strong>` with `font-semibold text-white`
- `## H2` → `<h3 className="text-base font-semibold first:mt-0 mt-3 mb-1">`
- `---` → `<hr className="my-3 border-t border-white/15">`
- `- bullet` → `<ul className="list-disc pl-5 space-y-0.5 my-2">`
- `1. numbered` → `<ol className="list-decimal pl-5 space-y-0.5 my-2">`
- `inline code` → `<code className="px-1 py-0.5 rounded bg-black/30 ...">`
- `[link](url)` → `<a target="_blank">` with primary color
- `> blockquote` → left-border italic muted style

User messages still render as plain text (no Markdown re-interpretation of user input). `first:mt-0` on every block keeps the first child flush with the bubble's top padding.

### Bug 22.25 — export polish DEFERRED

The existing pipelines (pdf.js, pptx.js, xlsx.js) have prior bug-fix tags from previous passes. Without an actual visual inspection of generated files (cat hotel mission `e18c9802` exported in all 3 formats), I can't confidently identify which "blanks + font overlap" issues from the original Bug 22.25 report are still real vs already fixed.

**Action:** Pass 23 manual test session.

## Pass 23 punch list — manual export test

When you have time:

1. Generate Cat Hotel mission (`e18c9802`) exports in all three formats:
   - `GET /api/results/e18c9802/export/pdf`
   - `GET /api/results/e18c9802/export/pptx`
   - `GET /api/results/e18c9802/export/xlsx`
2. Open each and document **specific** issues (page numbers, slide numbers, sheet+cell references) in `docs/PASS_23_EXPORT_FINDINGS.md`.
3. Repeat for at least one screening mission (e.g. Lebanon influencer) and one creative-attention mission to cover all goal_types.
4. Hand the findings doc back; Pass 23 can then ship targeted fixes per actual evidence rather than speculative pre-emptive code changes.

## Why deferred

Per Pass 22 master-prompt discretion clause:
> STOP-AND-REPORT discipline still applies for ARCHITECTURAL divergence only. Cosmetic/copy decisions ship at your discretion.

Speculative export "fixes" carry regression risk against working pipelines. Manual visual verification is the right next step. The chatbot Markdown fix (Bug 22.26) ships now because it's an unambiguous user-facing win with no regression risk.
