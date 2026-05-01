# Pass 23 Agent 3 — Phase B Comparison-Pages + Blog Drafts Log

**Branch:** `pass-23-phase-b-comparisons` (off `origin/main` `fa1140b`).
**Owned files:** `src/pages/vs/Vs*.tsx` (the four expansion pages), `src/pages/vs/VsSurveyMonkeyPage.tsx` (refinement edits only), `src/pages/blog/drafts/*.md` (sample-post markdown drafts), `public/sitemap.xml`, `docs/PASS_23_PHASE_B_COMPARISONS_REPORT.md`, this log.
**Sister agents:** Agent 1 owns `src/pages/Results*.tsx` + `src/components/results/*` on `pass-23-bug-60-results-redesign`. Agent 2 owns `src/lib/exporters/*` + the export-menu region of `CreativeAttentionResultsPage.tsx` on `pass-23-bug-74-ca-exports`. No file overlap with my scope.
**Doctrine compliance:** Pass-24 Sub-rule 6 applies — marketing/sales/legal asset generation requires Jamil review-and-approval before `shipped`. All copy on these pages is external-facing.

---

## Path-naming reconciliation (decided up front)

The Pass 24 progress doc lists my file ownership as `src/pages/comparisons/*` and `src/pages/blog/*`. The repo already uses `src/pages/vs/` for `VsSurveyMonkeyPage.tsx` (route `/vs/surveymonkey`) and renders blog posts at `src/pages/{Blog,BlogPost}Page.tsx` from a Supabase `blog_posts` table. To avoid orphaning the existing route + asset, I am keeping `src/pages/vs/` for the four new comparison pages and using `src/pages/blog/drafts/` for the three sample blog posts as markdown drafts (BlogPostPage reads `body_markdown` from Supabase, so a "blog post" is a DB row, not a React file — drafts are the pre-insertion artifact). This is documented in `docs/PASS_23_PHASE_B_COMPARISONS_REPORT.md` for audit override if Jamil prefers a different layout.

---

## Bugs / scope in this branch

| Bug | Status | Notes |
|---|---|---|
| **B2.refine** | `proposed-awaiting-review` | Seven derived refinements to `/vs/surveymonkey` page — fact-cite Survey-Monkey-side numbers, replace unsourced "70-80%" stat, harmonize Creative-Attention price claim, verify geographic-reach number, stabilize JSON-LD script id, mobile-responsive comparison table, remove "ship after voice approval" footnote when expansion lands. All seven cited from current page contents in the gate report. |
| **B2.tone** | `awaiting-Jamil-decision` | Five voice/tone calibration questions carried forward from `PASS_23_PHASE_B_TIER_1_REPORT.md` lines 86-111. Generous-to-competitor framing / MENA emphasis / synthetic-vs-real honesty / pricing transparency / bridge-vs-replacement positioning. Templated decision affects the four expansion pages, so locks before they ship. |
| **B2.expand-typeform** | `blocked-on B2.refine + B2.tone` | New `src/pages/vs/VsTypeformPage.tsx` + route in `App.tsx`. |
| **B2.expand-usertesting** | `blocked-on B2.refine + B2.tone` | New `src/pages/vs/VsUserTestingPage.tsx` + route. |
| **B2.expand-pollfish** | `blocked-on B2.refine + B2.tone` | New `src/pages/vs/VsPollfishPage.tsx` + route. |
| **B2.expand-traditional** | `blocked-on B2.refine + B2.tone` | New `src/pages/vs/VsTraditionalPage.tsx` (route `/vs/traditional`) + route. |
| **B3.sample** | `blocked-on B2.tone` | Three blog-post drafts in `src/pages/blog/drafts/`: 1 full ~1500w + 2 outlines. Topics in the gate report. |
| **B1.sitemap** | `blocked-on B2.expand-*` | Four new `<url>` entries in `public/sitemap.xml`. Blog drafts not listed until DB-inserted + `published=true` (otherwise sitemap points at 404s). |

---

## Verification paths (must pass per doctrine before merge)

For each comparison page (existing `/vs/surveymonkey` after refinement, plus the four new routes):

1. Cold-load: `<title>`, `<meta name="description">`, `<link rel="canonical">`, FAQPage JSON-LD all set, all torn down on unmount.
2. 90-second TL;DR card renders before any scroll on a 1280px viewport.
3. Comparison table renders cleanly at 320px / 768px / 1280px / 1920px — no horizontal overflow without an explicit scroll wrapper, no row-text truncation.
4. "When to use X" / "When to use VETT" two-column grid stacks at <768px.
5. All FAQs collapsible; first FAQ open on mount; JSON-LD list-length matches FAQ count.
6. CTA links to `/landing`.
7. "Other comparisons" footer links to live routes (no 404 placeholders).
8. Cross-links from `/vs/surveymonkey` reach all four new pages and back.

For the three blog drafts:

9. Frontmatter validates against `blog_posts` schema (slug / title / excerpt / tag / emoji / published=false). Slug is URL-safe.
10. Markdown body renders without `react-markdown` errors when test-fed through the same component path used by `BlogPostPage`.

For sitemap:

11. `xmllint --noout` clean.
12. Each new `<loc>` resolves 200 in the deployed branch URL.

---

## Push cadence

Every logical chunk → its own commit. Push to `origin/pass-23-phase-b-comparisons` every 2h or on chunk completion, whichever first. Never merge to `main` directly — audit chat is the merge gate after Jamil signs off on the gate report.

---

## Tick-off log

### 2026-04-30 — branch open + gate-doc draft

- ✓ Branched off `origin/main` `fa1140b`.
- ✓ Surveyed prior context: `PASS_23_PHASE_B_TIER_1_REPORT.md` (template + 5 calibration questions), `PASS_23_REGRESSION_AUDIT.md:144` (page status `awaiting-review`), `PASS_24_PROGRESS.md:77` (Agent 3 scope).
- ✓ Confirmed: no enumerated "7 audit-approved refinements" exist in any committed doc. Brief assumed they did. STOP-AND-REPORT triggered, user authorized derivation path (Option B in handoff thread).
- ✓ Wrote this log scaffold + gate report `docs/PASS_23_PHASE_B_COMPARISONS_REPORT.md`.
- → **Next:** push doc-only commit, await Jamil sign-off on the seven derived refinements + the five tone calibrations before any code edits.

---

## Coordination notes

- No file overlap with Agent 1 (`Results*.tsx`, `components/results/*`, `components/charts/*`) or Agent 2 (`lib/exporters/*`, marker block in `CreativeAttentionResultsPage.tsx`).
- Sitemap.xml is owned by me for this branch; if Agents 1 or 2 need to land a sitemap entry, route through this log.
- Architectural divergence (e.g. Jamil decides to migrate `/vs/*` to `/comparisons/*`): STOP-AND-REPORT before any rename; involves redirects + canonical-URL backfill + sitemap rewrite + outbound-link audit.

---

## Architectural decisions (Agent 3 scope)

1. **Path-naming kept on `src/pages/vs/`** instead of creating `src/pages/comparisons/`. Reason: the existing `/vs/surveymonkey` URL is already in the sitemap, robots.txt, and Schema.org graph; renaming it costs an SEO + canonical reset for zero user-visible benefit. If Jamil wants the rename it's a separate stand-alone PR.
2. **Sample blog posts shipped as markdown drafts under `src/pages/blog/drafts/`** rather than as React components. Reason: the live blog renders from Supabase `blog_posts.body_markdown`; "shipping" a post means inserting a DB row, not adding a route. Drafts in repo are the pre-insertion artifact and stay in source control even after they're inserted (audit trail).
