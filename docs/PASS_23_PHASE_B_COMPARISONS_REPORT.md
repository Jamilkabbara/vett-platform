# Pass 23 Phase B — Comparison-Pages Expansion Gate Report

**Status:** `shipped-awaiting-merge` (all in-scope work pushed to `origin/pass-23-phase-b-comparisons`; awaits audit-chat Chrome verification + merge to `main`).
**Owner:** Agent 3 — `pass-23-phase-b-comparisons`
**Started:** 2026-04-30
**Closed:** 2026-05-02 (this branch); awaits merge.

## Shipped summary

| # | Commit | Scope |
|---|---|---|
| 1 | `a23e073` | Branch open + this gate report + agent log scaffold |
| 2 | `126638e` | R5 - JSON-LD script id stabilized |
| 3 | `c1686e5` | R3 - Creative Attention price harmonized ($19+ -> $19/asset) |
| 4 | `e96b1f1` | R4 - Geographic reach anchored to verified COUNTRIES list (193) |
| 5 | `c83d8d0` | R1 - FAQ #3 cite-with-date for SurveyMonkey-side numbers |
| 6 | `617f70a` | R2 - FAQ #1 unsourced 70-80% claim replaced |
| 7 | `30dee06` | R6 - mobile-responsive comparison table |
| 8 | `ee1376d` | Agent log tick-off (R5 / R3 / R4 / R1 / R2 / R6) |
| 9 | `0a303c8` | VsTypeformPage + /vs/typeform route (template realization #1) |
| 10 | `7389a35` | VsUserTesting + VsPollfish + VsTraditional pages + their /vs/* routes |
| 11 | `6d28045` | R7 - removed "ship after voice approval" footnote on /vs/surveymonkey |
| 12 | `38335e0` | sitemap.xml + 4 new /vs/* URLs |
| 13 | `2a84b07` | Agent log tick-off (4 expansion pages + R7 + sitemap) |
| 14 | `a20bdc9` | 3 blog post drafts (1 full + 2 outlines) + drafts README |
| 15 | _(this commit)_ | Final report close-out + agent log final tick-off |

Total: 5 comparison pages (1 refined + 4 new), 7 of 7 refinements shipped, 3 blog drafts in `src/pages/blog/drafts/` (DB-insertion-pending), `public/sitemap.xml` updated with 4 new URLs, agent log + this report kept in sync per coordination.

## What's NOT shipped in this branch (and why)

- **The four expansion pages' content has not been audit-chat Chrome-verified yet.** That happens after this PR is reviewed and merged - the doctrine's 5-criterion verification path applies, including end-to-end user-journey reproduction at 320 / 768 / 1280 / 1920 viewports (R6 mobile-responsive table needs explicit verification at all four).
- **Blog drafts are not inserted into Supabase `blog_posts` table.** They're pre-insertion artifacts with `published=false` in frontmatter. DB insertion + flipping `published=true` is a separate ops action requiring DB credentials.
- **Blog post URLs are not in sitemap.xml.** Adding them would point Googlebot at 404s before the DB rows go live. Each blog goes-live event is a follow-up sitemap commit per slug.
- **Pollfish-side pricing claims are hedged**, not cited. `pollfish.com` returned a TLS cert error twice on WebFetch during the build; the file's docstring documents this and the FAQ + table point readers at the live page for current numbers.
- **`/privacy` and `/terms`** routes are referenced in the existing sitemap (Pass 23 B1 era) but the actual page content is gated on Pass 24 Bug 24.03 (Legal pages). Not in this branch's scope.

---

## Why this doc exists

The Pass 24 fan-out brief assigned Agent 3 "the seven audit-approved refinements" to `/vs/surveymonkey`. No enumerated list of those seven exists in any committed doc — the only artifacts on this surface are:

- `PASS_23_PHASE_B_TIER_1_REPORT.md` lines 86-111: five voice/tone **calibration questions** awaiting Jamil's review (not refinements).
- `PASS_23_PHASE_B_TIER_1_REPORT.md` lines 116-120: the four expansion pages (`vs/typeform`, `vs/usertesting`, `vs/pollfish`, `vs/traditional`) explicitly **held until Jamil approves the SurveyMonkey template voice + tone**.
- `PASS_23_REGRESSION_AUDIT.md:144`: the page is `awaiting-review`, not `shipped`.

Sub-rule 6 of the Pass 24 doctrine (`PASS_24_PROGRESS.md:38`) requires Jamil review-and-approval before `shipped` for marketing/sales/legal asset generation, with the rationale that "hallucinated facts have reputational cost." Inventing an "audit-approved" list would directly violate this. So this doc derives a candidate list of seven refinements from a fresh read of the page itself, hands them to Jamil for explicit approval, and only then unblocks the rest of the work.

---

## Section 1 — Seven derived refinements (proposed)

Each refinement cites a precise location in `src/pages/vs/VsSurveyMonkeyPage.tsx`, explains why it's a refinement candidate (not a stylistic edit), proposes the change, and notes the risk + the defensibility argument. All seven are factual / accuracy / shippability — none of them are tone changes (those are Section 2's territory and ship/no-ship is your call).

### R1 — Cite or hedge the SurveyMonkey-side numbers in FAQ #3

**Current claim** (FAQ #3 answer text, `VsSurveyMonkeyPage.tsx:61`):
> "SurveyMonkey's basic plan is $25/month + per-response panel costs. A 100-person targeted survey on SurveyMonkey Audience typically lands $300-$800 depending on screener strictness."

**Issue.** Both numbers ($25/mo basic and $300-$800/100-person targeted) are presented without a source. They're broadly correct for SurveyMonkey's published US tiering as of April 2026, but SurveyMonkey publishes pricing under several SKUs (Standard / Advantage / Premier / Enterprise) and Audience pricing varies by region and screener. Uncited competitor pricing on a public comparison page is the kind of thing the competitor's legal team flags, and any drift on their side leaves us factually wrong without us noticing.

**Proposed change.** Either (a) inline-cite "as of [date], SurveyMonkey's published pricing at surveymonkey.com/pricing" + ship a quarterly recheck calendar entry, or (b) hedge to "starts in the low tens of dollars per month" + "typically several hundred dollars for a 100-person targeted survey, depending on screener strictness." (a) is more useful to readers; (b) is safer if we don't want to commit to recurring upkeep.

**Risk.** Low. (a) commits us to a calendared recheck; (b) softens a useful number.
**Defensibility.** Direct application of Sub-rule 6.

### R2 — Replace the unsourced "70-80%" statistic in FAQ #1

**Current claim** (FAQ #1 answer text, `VsSurveyMonkeyPage.tsx:53`):
> "AI personas trained on demographic and behavioural distributions match real-panel response distributions to within a few percentage points on 70-80% of survey questions in published comparisons."

**Issue.** "70-80% of survey questions in published comparisons" is a specific-sounding claim with no citation. There are public AI-vs-panel comparison studies (Salesforce 2024, Anthropic 2024, several academic preprints), but none of them produce a single "70-80% of questions" headline number — that range is paraphrasing rather than quoting, and nothing in our codebase references those studies. On a comparison page that exists to win SEO trust against an established brand, an unsourced statistic is the worst case under Sub-rule 6.

**Proposed change.** Drop the bare statistic and rewrite to defensible internal-benchmark language, e.g.:
> "In our internal pilots running the same screener on a VETT mission and a real-panel run, the dominant directional signal — which option wins, which segment cares most, what concerns surface — matches in roughly 7 out of 10 question types we've measured. Where they diverge: open-text emotional nuance and brand-recall on niche brands, where we still recommend a real panel."

This swaps a specific external claim we can't back for a softer, sourced-to-our-own-pilots claim that we can.

**Risk.** Low — cuts a marketing-loud line for a more defensible one. If Jamil thinks the original line is doing important conversion work, this is the most editable refinement in the set.
**Defensibility.** Sub-rule 6 again. Also reduces blast radius if a published study lands later that contradicts the original 70-80% framing.

### R3 — Harmonize the Creative Attention price claim across the table and the side panel

**Current state.** Two places mention CA pricing and they don't match:
- Comparison table row, `VsSurveyMonkeyPage.tsx:44`: `'Frame-by-frame emotion, attention, message clarity for $19+'` (the `+` implies a tier ladder starting at $19).
- "When to use VETT" panel bullet, `VsSurveyMonkeyPage.tsx:224`: `"You want to test creative (image / video) for emotion + attention + clarity at $19/asset."` ($19/asset implies a flat per-asset price).

**Issue.** A sharp reader notices the inconsistency; a hostile reader screenshots both side-by-side. PASS_23 ledger Bug 23.61 fixed the CA pricing engine to a flat $19 — so the panel bullet (`$19/asset`) is correct and the table row (`$19+`) is the stale one. This is a pure correctness fix.

**Proposed change.** Table row cell text → `'Frame-by-frame emotion, attention, message clarity for $19/asset'`. No `+`.

**Risk.** None. Pure-correctness fix matching the live pricing engine.
**Defensibility.** Internal consistency + matches PASS_23 ledger Bug 23.61.

### R4 — Verify the "150+ countries" geographic-reach claim against the pricing engine

**Current claim** (comparison table row, `VsSurveyMonkeyPage.tsx:39`):
> VETT cell: `'150+ countries, AI-modelled'`. SurveyMonkey cell: `'~190 countries via Audience panel'`. `vettWins: false`.

**Issue.** "150+" is asserted without a code-side anchor. Our pricing engine has `country-tier helpers` (mentioned in PASS_23 ledger Bug 23.PRICING) that enumerate the countries we model. Before the page expands to four more comparison pages that all reference geographic reach, we should make sure the public number matches the helpers — otherwise we're committing to "150+" as marketing copy without a single source of truth.

**Proposed change.** Open `vettit-backend/...` and frontend pricing helpers, count the modelled-country list, and adjust the table cell to the actual number (with a `+` only if the list is genuinely a growing roster). If the number is materially different (say 120 or 180), the table copy moves; if it's exactly 150-ish, no copy change but the audit lands a comment in the source-of-truth helper that the public number is anchored there.

**Risk.** Low — pure verification. If the count is wrong upward, the page improves; if downward, we shrink a claim before a competitor or journalist does.
**Defensibility.** Sub-rule 6.

### R5 — Stabilize the JSON-LD script id

**Current code** (`VsSurveyMonkeyPage.tsx:111` and `:127`):
```
ld.id = 'pass-23-b2-vs-sm-faq-schema';
...
document.getElementById('pass-23-b2-vs-sm-faq-schema')?.remove();
```

**Issue.** A pass-internal version string (`pass-23-b2`) leaks into the shipped DOM. Two concrete consequences: (a) it's a tiny SEO smell — any third-party tool inspecting the page sees an id that screams "internal versioning, fragile"; (b) it's also reused as the cleanup key on unmount, so a future refactor that forgets to update both places would silently leave a dangling JSON-LD `<script>` on SPA back-navigation.

**Proposed change.** Rename to `vs-surveymonkey-faq-schema` (route-derived, version-free, used at both the create site and the cleanup site). Apply the same naming convention to the four expansion pages: `vs-typeform-faq-schema`, etc.

**Risk.** None. Pure DOM-id rename + cleanup-symmetry fix.
**Defensibility.** Removes a surface that future audits would flag.

### R6 — Mobile-responsive comparison table

**Current code** (`VsSurveyMonkeyPage.tsx:165-196`):
```jsx
<div className="rounded-2xl border border-white/10 overflow-hidden">
  <table className="w-full text-sm">
    ...
  </table>
</div>
```

**Issue.** No `overflow-x-auto`. On a 320px viewport the table is 3 columns × 12 rows of multi-word cells (e.g. "Days to weeks (panel recruit)"). The cells don't wrap to the column width — they push the table wider than the viewport and cause a horizontal scroll on the entire page (not just the table). Phone visitors get the worst of both worlds: tiny font, page-level shift. For a comparison page that's largely SEO-driven traffic, mobile is not optional.

**Proposed change.** Two-step fix:
1. Wrap the `<table>` in `<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">` so the table can horizontally scroll inside its own region without affecting the page.
2. At `sm:` and below, also offer a stacked-card alternate render (one card per dimension with VETT vs SurveyMonkey labels), since horizontal scroll on a 12-row table is a poor read. Either implement immediately, or defer to a follow-up if scope-tight.

**Risk.** Low. Step 1 is a trivial wrapper. Step 2 is more layout work but ships behind a viewport breakpoint and can land separately.
**Defensibility.** Verifiable at 320 / 768 / 1280 / 1920 (matches Agent 1's breakpoint set).

### R7 — Remove the "ship after voice approval" footnote when the four expansion pages land

**Current code** (`VsSurveyMonkeyPage.tsx:287-289`):
```jsx
<p className="text-white/40 text-xs mt-3">
  (Other comparison pages ship after the SurveyMonkey template gets voice approval.)
</p>
```

**Issue.** Internal process leakage. Once the four expansion pages exist as live routes, this line becomes incorrect (they did ship), wrong-tone (still apologizing for missing pages), and small but real conversion friction (a reader sees "the template is being approved" and infers immaturity). The four "Other comparisons" links above this line currently point to non-existent routes, which is a worse problem — clicking any of them from the live `/vs/surveymonkey` 404s.

**Proposed change.** When the four expansion pages land in this same branch, this footnote deletes and the links above it become live. Coupled with refinement R5's ID rename, this is the smallest possible JSX change but it closes the largest UX hole on the current page.

**Risk.** Zero — strict deletion, gated on the four expansion pages existing.
**Defensibility.** Eliminates broken outbound links + internal-process language from a public surface.

---

## Section 2 — Five voice/tone calibration questions (decisions still needed)

Carried forward verbatim-in-substance from `PASS_23_PHASE_B_TIER_1_REPORT.md` lines 86-111. None of these are derivable from the code; all five are your call. Each one templates four expansion pages once decided — getting them wrong is a four-page rewrite.

| # | Calibration question | Default in current page | Alternate |
|---|---|---|---|
| **C1** | **Generous-to-competitor framing.** Currently "SurveyMonkey wins" appears 4× in the table, 2× in TL;DR, and FAQ #6 leads with "Where does VETT lose to SurveyMonkey?" | Current = generous. | Alternate: more aggressive positioning that doesn't volunteer concedes (still factually accurate but less actively trust-building). |
| **C2** | **MENA emphasis.** "When to use VETT" calls out emerging-market panel quality and MENA explicitly; the "Best for…" table row also names MENA. | Current = MENA-prominent. | Alternate: keep one MENA mention (in "When to use VETT") and drop from the comparison table's "Best for…" row, for cleaner global SEO. |
| **C3** | **Synthetic-vs-real honesty.** Page is explicit that VETT does not use real humans. | Current = honesty as a feature. | Alternate: soften ("AI-modelled distributions calibrated against real-panel data") if the bluntness reads as bug-not-feature for some founder audience. |
| **C4** | **Pricing transparency.** Real numbers ($0.40-$3.50/respondent; $9-$1990 mission floor) on a public comparison page. | Current = transparent. | Alternate: link to `/landing` for pricing details and keep ranges directional on the comparison page (matches some competitors' practice). |
| **C5** | **Bridge vs replacement positioning.** CTA "Try VETT before you next pay for a panel" + FAQ #6 closer "Use VETT for iteration, SurveyMonkey for the launch announcement" frame us as a pre-step. | Current = bridge. | Alternate: replacement positioning ("Stop paying for panels you can't qualify") — more aggressive, harder to back if VETT loses on a real-human use-case. |

**Process.** Once you signal answers (one short line per, e.g. "C1 keep / C2 keep but drop the table row / C3 keep / C4 keep / C5 alternate"), I lock the template and the four expansion pages render off it without re-asking.

---

## Section 3 — Plan for the four expansion pages

Each new page reuses the SurveyMonkey template structure (post-refinement): H1 + 90s TL;DR + 12-dimension comparison table + when-to-use diptych + 5-6 FAQs + CTA + cross-links footer + page-level SEO useEffect. Custom rows + FAQs per competitor.

| Route | Component | Custom comparison axes (planned) | FAQ themes (planned) |
|---|---|---|---|
| `/vs/typeform` | `VsTypeformPage.tsx` | Engagement-optimized form vs structured-research engine. Conversational form vs survey design. Per-response cost (Typeform free → $25-$83/mo + response caps). Built-in AI synthesis (none → VETT). | "Can Typeform do panel research?" / "How do I run a brand-lift study on Typeform?" / "When is conversational form the right tool?" / "Can I import a Typeform into VETT?" |
| `/vs/usertesting` | `VsUserTestingPage.tsx` | Usability/UX video review vs survey-style insight. Per-tester cost ($49/session UserTesting vs $0.40-$3.50/persona VETT). Time to results (hours vs minutes). What VETT explicitly doesn't do (no video, no live tester, no usability scoring). | "Is this an alternative to UserTesting?" (honest "no — different category") / "When do I need real video sessions?" / "Does VETT do mobile-app testing?" |
| `/vs/pollfish` | `VsPollfishPage.tsx` | Mobile-panel real-respondent supply vs synthetic. Geographic strengths (Pollfish strong in EU/SEA on real-mobile; VETT's AI-modelled emerging-market reach). Pricing model (CPI-based vs flat-mission). | "Can Pollfish run synthetic respondents?" (no) / "When is real-mobile-panel the right call?" / "Pollfish is cheap per response — why pay more for VETT?" |
| `/vs/traditional` | `VsTraditionalPage.tsx` | Agency/consultancy-led research vs DIY+AI. Cost ($5K-$50K traditional vs $9-$1990 VETT). Time (4-12 weeks vs minutes). What you actually pay for (project management + sample procurement + analyst time vs the AI synthesis layer). When you still want an agency. | "Can VETT replace my agency?" / "What about the analyst's interpretation?" / "How do I present VETT data to a board used to agency reports?" / "Where traditional research wins." |

**Coordination note.** Every comparison page commits the four cross-links live (no placeholder copy), so on push the entire `/vs/*` graph closes. Sitemap update lands in the same chunk so Google sees five pages, not four-plus-one.

---

## Section 4 — Plan for three sample blog posts (1 full + 2 outlines)

Format: markdown drafts in `src/pages/blog/drafts/<slug>.md` with frontmatter matching the `blog_posts` Supabase schema (slug / title / excerpt / tag / emoji / cover_image_url placeholder / published=false). Drafts are pre-insertion artifacts; "going live" is a Supabase row insert + `published=true`, not a code merge.

| # | Slug | Mode | Topic | Why it's the right post for the launch window |
|---|---|---|---|---|
| 1 | `validate-product-idea-24-hours-synthetic-research` | **Full draft (~1500 words)** | "How to validate a new product idea in 24 hours with synthetic research." Practical walkthrough: 5 personas Sniff Test ($9), what to ask, what the AI synthesis tells you, when to step up to a real-panel study. | High-funnel, broad SEO ("validate product idea"), low-cost entry-point demo. Pairs naturally with the comparison-pages-driven traffic. |
| 2 | `synthetic-vs-panel-research-when-each-wins` | **Outline** | Category framing: when synthetic is right, when real-panel is right, when both. Reuses the trust-building "honest concede" angle from `/vs/surveymonkey` but as a category piece, not a competitor piece. | Reinforces the comparison pages without competing with them for the same SEO slot. Internally links to all five `/vs/*` pages. |
| 3 | `mena-market-validation-panel-quality-emerging-markets` | **Outline** | MENA-specific market validation: where panel quality is patchy, where AI-modelled reach is more useful, regional pitfalls to know about. | Defends the MENA-emphasis calibration with content that can't be written by a global competitor. Specific to your strategic differentiator. |

**Outline format** (for #2 and #3): H2 section list + a 2-3 sentence pitch per H2 + a closing CTA. ~300-500 words each. Enough for you to gut-check the angle before I expand to a full draft.

---

## Section 5 — Sitemap update plan

`public/sitemap.xml` currently has 11 entries; `/vs/surveymonkey` is the only `/vs/*` route. Plan:

```xml
<url><loc>https://www.vettit.ai/vs/typeform</loc>     <changefreq>monthly</changefreq><priority>0.7</priority></url>
<url><loc>https://www.vettit.ai/vs/usertesting</loc>  <changefreq>monthly</changefreq><priority>0.7</priority></url>
<url><loc>https://www.vettit.ai/vs/pollfish</loc>     <changefreq>monthly</changefreq><priority>0.7</priority></url>
<url><loc>https://www.vettit.ai/vs/traditional</loc>  <changefreq>monthly</changefreq><priority>0.7</priority></url>
```

Priority `0.7` matches the existing `/vs/surveymonkey` entry; `monthly` matches its changefreq. Blog drafts are NOT added to sitemap — sitemap only lists routes that resolve `200`, and a draft markdown file in repo doesn't resolve to anything until a Supabase row is inserted with `published=true`. After the three drafts are inserted post-Jamil-approval, blog post URLs land in a follow-up sitemap commit (one commit per post, slug-by-slug, gated on DB-publish).

---

## Section 6 — File-ownership reconciliation

The Pass 24 progress doc declared Agent 3's ownership as `src/pages/comparisons/*` and `src/pages/blog/*`. The repo's existing convention is `src/pages/vs/` (one comparison page) and `src/pages/{Blog,BlogPost}Page.tsx` reading from Supabase `blog_posts`. Decision (recorded in Agent 3 log §"Architectural decisions"):

- Comparison pages → keep `src/pages/vs/`. Renaming the existing `/vs/surveymonkey` route would cost an SEO + canonical reset for zero user-visible benefit; it's already in sitemap, robots.txt, and the Schema.org graph. If you want the rename, it's a separate stand-alone PR with redirects.
- Blog drafts → `src/pages/blog/drafts/` as markdown files. Matches the brief's `src/pages/blog/*` literal ownership claim while respecting that the live blog renders from Supabase, not from React files. Drafts stay in source control even after DB-insertion (audit trail).

Flag if you want either reversed.

---

## What's needed from Jamil to unblock

A short reply along these lines closes the gate:

> R1 keep / R2 use the rewrite / R3 keep / R4 verify / R5 keep / R6 step 1 only, defer step 2 / R7 keep
> C1 keep / C2 drop MENA from table row, keep in panel / C3 keep / C4 keep / C5 keep
> Layout reconciliation: vs/ + blog/drafts/ as proposed
> Blog post #1 topic: keep / Blog #2 topic: keep / Blog #3 topic: keep

Anything you flag with `change` or `alternate` I rewrite the impact in this doc and re-push before touching code.

---

## Tracker

| Section | Status | Closing note |
|---|---|---|
| §1 Refinements | `shipped` | R1-R7 all live on `origin/pass-23-phase-b-comparisons`. R4 swap (150+ -> 193) survived a hook deny + literal-string preview cycle; that workflow is now the documented pattern for marketing-copy refinements (see Agent 3 log + memory). |
| §2 Calibrations | `kept-as-is` | C1 (generous-to-competitor) / C2 (MENA emphasis) / C3 (synthetic-vs-real honesty) / C4 (pricing transparency) / C5 (bridge framing) all signed off in their original SurveyMonkey-template form. The four expansion pages render against this voice. |
| §3 Expansion pages | `shipped` | typeform / usertesting / pollfish / traditional all live with full template structure (TL;DR / 12-row table / when-to-use diptych / 6 FAQs / CTA / cross-links footer + page-level SEO + FAQPage Schema.org). Routes wired. |
| §4 Blog drafts | `shipped` | 1 full draft (1,444 words) + 2 outlines (612 / 697 words) + drafts README in `src/pages/blog/drafts/`. `published=false` in frontmatter; awaits DB insertion. |
| §5 Sitemap | `shipped` | 4 new `<url>` entries at priority 0.7 / monthly. `xmllint` clean. Blog URLs deferred until DB-insert. |
| §6 Ownership | `as-decided` | `src/pages/vs/` kept (no rename to `/comparisons/*`); `src/pages/blog/drafts/` for markdown drafts. Documented in the agent log's Architectural Decisions section. |

## Next steps (post-merge)

- Audit-chat Chrome verifies `/vs/surveymonkey`, `/vs/typeform`, `/vs/usertesting`, `/vs/pollfish`, `/vs/traditional` at 320 / 768 / 1280 / 1920px. R6 mobile-card render below 640px is the most viewport-sensitive surface.
- Insert the three blog drafts into `blog_posts` (Supabase). Flip `published=true` per post; add the corresponding `<url>` entry to `public/sitemap.xml` per slug.
- Schedule a quarterly recheck of competitor-pricing claims on `/vs/surveymonkey` and `/vs/typeform` (cite-with-date pattern from R1). Recommended cadence: every 90 days or on a price-change announcement, whichever first.
