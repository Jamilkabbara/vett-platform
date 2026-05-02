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

### 2026-05-01 — gate-doc shipped (a23e073)

- ✓ Discovered `git checkout` race in main worktree: another active session running `pass-24-bug-01-creative-attention-v2` switched HEAD on the shared checkout mid-flight, silently resetting my staged index. Salvage: created dedicated worktree `.claude/worktrees/agent3-comparisons` (matches Agent 2's pattern) and re-ran via `git -C $WT`.
- ✓ Pushed `a23e073` (gate report + this log) to `origin/pass-23-phase-b-comparisons`.
- → **Next:** await Jamil sign-off line on R1-R7 + C1-C5.

### 2026-05-02 — refinement chunks R5 / R3 / R4 / R1 / R2 / R6 (R7 deferred to expansion-pages chunk)

Sign-off received: R1-R7 keep (R4 verify, R6 both steps); C1-C5 keep; §6 yes; blog topics keep.

Workflow note (saved to long-term memory): a Bash permission hook denied my first-batch push because the R4 commit changed a public-facing claim (`150+ countries` -> verified `193`) without the literal new string having been previewed. Sub-rule 6 in action. Re-asked the user with literal new strings for R4 / R1 / R2 / R6 in chat; received explicit acks (R4 ship 193, R1 ship AED-anchored cite, R2 user-supplied softer rewrite, R6 proceed). Then committed.

| # | Commit | Refinement | One-line change |
|---|---|---|---|
| 1 | `126638e` | R5 | JSON-LD script id `pass-23-b2-vs-sm-faq-schema` -> `vs-surveymonkey-faq-schema`. |
| 2 | `c1686e5` | R3 | CA price row: `$19+` -> `$19/asset` to match the "When to use VETT" panel bullet. |
| 3 | `e96b1f1` | R4 | Geographic-reach row: `150+ countries, AI-modelled` -> `193 countries (full ISO list, AI-modelled)`. Verified against `src/data/targetingOptions.ts` COUNTRIES (193 entries). |
| 4 | `c83d8d0` | R1 | FAQ #3 answer: cite-with-date the SurveyMonkey-side numbers, AED-anchored for MENA audience, replace stale `$25/month` + `$300-$800` with linkable surveymonkey.com/pricing reference. |
| 5 | `617f70a` | R2 | FAQ #1 answer: replace unsourced `70-80%` claim with Jamil-supplied directional-alignment framing (em-dashes converted to ` - ` per Bug 23.77 sweep). |
| 6 | `30dee06` | R6 | Mobile-responsive comparison table: `sm:hidden` stacked-card render below 640px + `overflow-x-auto` wrapper with `min-w-[600px]` table at and above 640px. No copy change. |

R7 ("ship after voice approval" footnote removal + activation of the four cross-link routes) deferred to the expansion-pages commit since it depends on those routes existing. Currently the page still shows the four placeholder links + the "ship after voice approval" footnote, which is correct given the four pages haven't shipped yet.

- → **Next:** push the six-commit batch + start the four expansion-page builds.

### 2026-05-02 — expansion pages + R7 + sitemap (Task 5 + Task 7 first half)

After the six-refinement push (`a23e073..ee1376d`), shipped the four expansion pages and closed out the SurveyMonkey page's R7 footnote. Cadence followed Option X agreed with Jamil: full literal-copy preview for typeform (template realization), then much shorter previews for usertesting / pollfish / traditional once the template was acked.

| # | Commit | Scope | One-line |
|---|---|---|---|
| 7 | `0a303c8` | VsTypeformPage + /vs/typeform | First expansion. 12-row table (7 VETT / 5 Typeform), 6 FAQs, "No audience? No problem." CTA. Pricing cite from typeform.com/pricing as of May 2026 (Basic $39 / Plus $79 / Business $129). |
| 8 | `7389a35` | VsUserTesting + VsPollfish + VsTraditional + 3 routes | Three remaining expansion pages bundled. UserTesting framed as "different category" (video usability vs survey research). Pollfish framed as closer head-to-head (mobile real-respondent vs synthetic). Traditional framed as a category piece (Kantar / Ipsos / Nielsen / boutique-MENA), bridge framing - "sharpen the brief before you sign the SOW". |
| 9 | `6d28045` | R7 | Removed `(Other comparison pages ship after the SurveyMonkey template gets voice approval.)` footnote on /vs/surveymonkey. The four cross-link cards above it are now live routes; previously 404. |
| 10 | `38335e0` | sitemap.xml | Added /vs/typeform, /vs/usertesting, /vs/pollfish, /vs/traditional at priority 0.7 / changefreq monthly. xmllint clean. Blog drafts not yet sitemapped (drafts != published rows, would 404). |

Pricing cite policy across the four pages:
- Typeform: precise USD numbers cited with date (typeform.com WebFetch returned USD).
- SurveyMonkey: AED + USD-equivalent cited with date (surveymonkey.com WebFetch returned AED, regional storefront).
- UserTesting: hedged (no published per-session pricing; enterprise-sales-only).
- Pollfish: hedged (pollfish.com returned a TLS cert error on WebFetch; readers pointed at live page for current).
- Traditional: range-anchored ($5K-$50K+ per study, 4-12 weeks) - category piece, not single competitor.

Win-signal balance across the five `/vs/*` pages:
- SurveyMonkey: 8 VETT / 4 SurveyMonkey
- Typeform:     7 VETT / 5 Typeform
- UserTesting:  5 VETT / 7 UserTesting (concedes core video-usability category)
- Pollfish:     6 VETT / 6 Pollfish (most balanced; closest direct competition)
- Traditional:  5 VETT / 7 Agencies (concedes methodology + analyst + polish + supply)

- → **Next:** Task 6 (3 sample blog drafts) + Task 7 closeout (final report + tag).

---

## Coordination notes

- No file overlap with Agent 1 (`Results*.tsx`, `components/results/*`, `components/charts/*`) or Agent 2 (`lib/exporters/*`, marker block in `CreativeAttentionResultsPage.tsx`).
- Sitemap.xml is owned by me for this branch; if Agents 1 or 2 need to land a sitemap entry, route through this log.
- Architectural divergence (e.g. Jamil decides to migrate `/vs/*` to `/comparisons/*`): STOP-AND-REPORT before any rename; involves redirects + canonical-URL backfill + sitemap rewrite + outbound-link audit.

---

## Architectural decisions (Agent 3 scope)

1. **Path-naming kept on `src/pages/vs/`** instead of creating `src/pages/comparisons/`. Reason: the existing `/vs/surveymonkey` URL is already in the sitemap, robots.txt, and Schema.org graph; renaming it costs an SEO + canonical reset for zero user-visible benefit. If Jamil wants the rename it's a separate stand-alone PR.
2. **Sample blog posts shipped as markdown drafts under `src/pages/blog/drafts/`** rather than as React components. Reason: the live blog renders from Supabase `blog_posts.body_markdown`; "shipping" a post means inserting a DB row, not adding a route. Drafts in repo are the pre-insertion artifact and stay in source control even after they're inserted (audit trail).
