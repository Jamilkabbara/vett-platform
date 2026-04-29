# Pass 23 Bug 23.62 — Export Audit V2

**Status:** code-level fixes shipped; visual screenshot verification pending Jamil
**Doctrine:** per `PASS_23_REGRESSION_AUDIT.md`, this bug is `partial-fix`
until items 1–4 below are validated end-to-end on real exports of mission
`e75a0230` (Lebanon influencer — longest content, Arabic verbatims).

---

## Shipped this batch

### CSV (frontend `ResultsPage::handleCsvExport`)

- **UTF-8 BOM prefix (`﻿`)** prepended to the file. Excel for Mac
  and Windows both auto-detect encoding from the BOM. Without it,
  Arabic / accented characters (Lebanese mission verbatims, French/Spanish
  persona names) open as mojibake. The BOM is invisible to RFC-4180
  parsers and standard tooling.
- **RFC-4180 `\r\n` line endings** (was `\n`). Excel for Windows
  tolerates `\n`; Excel for Mac and legacy parsers break on it. `\r\n`
  is universally safe.
- Quote escaping was already correct (existing `replace(/"/g, '""')`).
- Quotes around any field containing commas/newlines/quotes already in
  place.

### PDF (backend `services/exports/pdf.js`)

- **Orphan-header guard tightened.** The page-break threshold for each
  question section was 200pt below page-bottom, which produced
  stranded headers on page N with distribution rows on page N+1.
  Bumped to 280pt — header (50) + question text (40) + first 4–6
  distribution rows (24×) all fit on the same page; further rows
  spill cleanly via pdfkit's automatic wrap.

---

## Deferred — needs Jamil action or visual verification

### 1. PDF Unicode font embedding

**Symptom:** Lebanese mission's Arabic verbatims render as missing-glyph
boxes. pdfkit ships with Helvetica which is Latin-1 only.

**Fix:** embed a Unicode-supporting TTF (Inter for body, Manrope for
headlines). Required:
- Add `vettit-backend/src/services/exports/fonts/Inter-Regular.ttf`,
  `Inter-Bold.ttf`, `Manrope-Bold.ttf` to the repo (totaling ~1MB).
- In `pdf.js`, register fonts via `doc.registerFont('Inter',
  path.join(__dirname, 'fonts/Inter-Regular.ttf'))` etc.
- Replace every `doc.font('Helvetica')` and `doc.font('Helvetica-Bold')`
  with the registered names.
- Test against `e75a0230` Lebanese mission — verify Arabic verbatims
  render correctly.

**Why deferred:** TTF assets need to be committed to the repo, and the
visual output needs Jamil's review on Mac Preview + Adobe Acrobat to
confirm the fix actually fixes the symptom. Per the new doctrine, code
changes without visual proof aren't shipped.

### 2. PPTX one-question-per-slide + chart-as-image

**Spec from Bug 23.62:** each question gets its own slide; charts
pre-rendered via `html-to-image` and embedded as PNG (avoids the
broken `pptxgenjs` chart support in current version).

**Why deferred:** the existing pptx.js renders multiple questions per
slide and uses pptxgenjs's native chart objects. Refactor is
non-trivial; needs a generated PPTX opened in PowerPoint Mac AND
Google Slides as the verification gate. Without that visual proof the
fix is just unverified speculation.

### 3. Real exports for mission e75a0230 + screenshot capture

**Per spec:** generate PDF / PPTX / XLSX for `e75a0230` (Lebanon
influencer; full delivery; Arabic verbatims). Open each in target
apps:
- PDF in Mac Preview AND Adobe Acrobat
- PPTX in PowerPoint Mac AND Google Slides
- XLSX in Excel Mac AND Google Sheets

Document specific failures with screenshots in this file. For each
failure: section / symptom / cause-in-code / fix.

**Why deferred:** screenshot capture is a Jamil-side action. The fixes
in items 1+2 land conditional on what the screenshots actually show.

---

## Verification queries

### Confirm CSV BOM is on the deployed bundle

```bash
# After Vercel rebuild, fetch the production ResultsPage chunk and
# grep for the BOM sequence (\xEF\xBB\xBF prepended to a CSV string).
curl -sS https://vett-platform.vercel.app/ -A "Mozilla/5.0" |
  grep -oE 'assets/index-[^"]+\.js' | head -1 |
  xargs -I{} curl -sS "https://vett-platform.vercel.app/{}" |
  grep -c "ResultsPage"

# Then fetch the ResultsPage chunk + grep for the BOM character:
# (Bug 23.62: BOM literal in source as ﻿ — minified to ﻿)
```

### Confirm PDF orphan-header threshold

```bash
# After Railway redeploy, generate a PDF for e75a0230:
curl -sS -o /tmp/e75a0230.pdf \
  -H "Authorization: Bearer ${SUPABASE_JWT}" \
  https://vettit-backend-production.up.railway.app/api/results/e75a0230-a07f-4835-9bf1-b5c08ad0ea07/export/pdf
# Open in Preview + scan for any "QUESTION N" header at the bottom of a
# page with no distribution rows underneath. None should be visible.
```

---

## Bug 23.62 status per doctrine

| Criterion | Status |
|---|---|
| 1. Code pushed + deploy succeeded | ✅ shipping in this batch |
| 2. End-to-end user-journey reproduced | ⏸️ pending Jamil running real exports |
| 3. Symptom verifiably absent | ⏸️ pending screenshot capture |
| 4. Visual proof attached | ⏸️ pending |
| 5. Regression escalation | n/a (first time addressing the real symptom; previously audit-only) |

**`partial-fix`** — not shipped per doctrine until items 2–4 close.
