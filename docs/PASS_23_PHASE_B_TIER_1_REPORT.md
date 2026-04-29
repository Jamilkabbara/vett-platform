# Pass 23 Phase B — Tier 1 Report

**Started:** 2026-04-29
**Status:** Tier 1 shipped, awaiting Jamil voice/tone review on the
comparison-page template before Tier 1 expansion.

---

## What shipped

### B1 — SEO infrastructure ✅

(Shipped earlier in this Phase B run as `5c1e579`.)

- `public/robots.txt` — allow-all + disallow authed routes + Sitemap
  pointer + `?session_id=` block.
- `public/sitemap.xml` — 10 public surfaces with priority + changefreq.
- `public/llms.txt` — LLM-friendly summary covering goal types, all
  14 pricing tiers, market coverage, useful URLs.
- `index.html` — upgraded `<title>`, 150-char `<meta name="description">`,
  `<link rel="canonical">`, og + Twitter upgrades, **Schema.org JSON-LD
  graph** (Organization + SoftwareApplication + AggregateOffer
  $9–$1990 across 14 tiers).

### B4 — Directory submissions checklist ✅

`docs/PASS_23_DIRECTORY_SUBMISSIONS.md` — prioritized list:

- **Tier A (ship-day):** AlternativeTo, G2, Capterra, AppSumo, Product Hunt
- **Tier B (week 1):** TheresAnAIForThat, Futurepedia, TopAI.tools, AI Tools
  Directory, Indie Hackers Products, SaaSHub, BetaList, Slant
- **Tier C (MENA):** Wamda, MAGNiTT, Dubai Future Foundation, StepFeed,
  Saudi VC ecosystem listings, Dubai Chamber Innovation Hub
- **Tier D (backlog):** Crunchbase, LinkedIn, Twitter, AngelList, F6S

Per-row submission URL, contact path, expected backlink impact, and a
status field for Jamil to update as submissions land. Includes G2/Capterra
vendor profile template + 5 distinct seed-review angles.

### B10 — Product Hunt launch checklist ✅

`docs/PASS_23_PRODUCT_HUNT_LAUNCH.md` — operational checklist:

- **T-30 to T-7:** hunter following (target 100+), 15-20 commenter list,
  full asset pack (tagline, description, 8-10 gallery images, 30-second
  demo video), schedule (Tuesday 00:01 PST), maker-comment draft.
- **Launch day:** the 4-hour push window, MENA timezone advantage,
  US-wakeup wave, wind-down at 18:00 PST.
- **T+1 to T+14:** recap blog post, BetaList cross-submit, Hacker News
  Show HN as a separate launch, week-2 anti-pattern review.
- Success metrics with concrete targets (Top 5 final, +200 signups,
  +20 paid missions, +30 backlinks).
- 5 anti-patterns explicitly called out.

### B2 sample — VETT vs SurveyMonkey comparison page ✅

`/vs/surveymonkey` route mounted in `App.tsx`. Page lives at
`src/pages/vs/VsSurveyMonkeyPage.tsx`. Sitemap updated.

Structure:
- H1 + 90-second TL;DR card (6 bullets, 4 wins / 2 honest concedes)
- 12-dimension side-by-side comparison table (8 VETT wins, 4 SurveyMonkey
  wins — generous to competitor, factually accurate)
- "When to use SurveyMonkey" + "When to use VETT" honest framing
- 6 FAQs:
  - "Can synthetic respondents really replace real panel research?"
  - "How is this different from just asking ChatGPT?"
  - "How much does VETT cost vs SurveyMonkey?"
  - "What if my screener is so strict that you can't generate matching personas?"
  - "Can I run the same survey on VETT and SurveyMonkey to compare?"
  - "Where does VETT lose to SurveyMonkey?"  (← honesty signal)
- CTA card: "Try VETT before you next pay for a panel"
- Internal links to the other 4 comparison pages (placeholders, copy
  set to "ship after voice approval").

Page-level SEO: dynamic `<title>`, `<meta name="description">`,
`<link rel="canonical">`, and **FAQPage Schema.org JSON-LD** all
injected via React `useEffect` with cleanup on unmount. The schema
makes the FAQs eligible for Google rich results.

Build clean, TypeScript clean.

---

## Tone calibration — what Jamil should review

The comparison page leans on five copywriting choices that need explicit
sign-off because they set the template for the other 4 pages:

1. **Generous-to-competitor framing.** "SurveyMonkey wins" appears 4
   times in the comparison table, twice in the TL;DR, and the sixth FAQ
   leads with "Where does VETT lose to SurveyMonkey?" — direct admission
   of weaknesses (integrations, brand recognition, real-human quotes).
   This is deliberate trust-building. **If Jamil prefers more aggressive
   competitive positioning, flag now and the template adjusts.**
2. **MENA emphasis.** The "When to use VETT" panel calls out emerging-
   market panel quality and MENA specifically. This matches the audience
   strength but may feel limiting on a global comparison page. **If
   Jamil wants this de-emphasized for global SEO, flag now.**
3. **Synthetic-vs-real honesty.** The page is explicit that VETT does
   NOT use real humans. Some founders prefer to soften this; the page
   leans into it as a feature, not a bug. **Confirm.**
4. **Pricing transparency.** Real numbers in the table ($0.40-$3.50 per
   resp; $9-$1990 mission floor). This commits to the public ladder.
   **Confirm Jamil is comfortable having this on a public comparison
   page (not just on /landing).**
5. **"Use VETT for iteration, SurveyMonkey for the launch announcement"
   framing** in the closing FAQ. This positions VETT as a pre-step, not
   a replacement. Strategic question: do we want to be a bridge product
   or a category replacement? **The current framing sets us as a
   bridge.**

---

## Tier 1 deferred / not shipped

- **B2 expansion** (vs Typeform, vs UserTesting, vs Pollfish, vs
  traditional research): held until Jamil approves the SurveyMonkey
  template voice + tone.

---

## Tier 2 — needs Jamil input before shipping

(Documented in this report so Jamil sees them at the same review point.)

### B8 — Sentry + monitoring + status page

**Action item for Jamil:**
1. Sign up at sentry.io (free tier OK)
2. Create new project "vett-platform" (React + TypeScript)
3. Create new project "vettit-backend" (Node.js)
4. Copy both DSNs
5. Paste them in chat → Claude Code wires SDK + source maps + middleware
   + structured logging upgrade + Better Uptime status page

ETA after DSNs received: ~4 hours.

### B5 — Stripe Subscriptions

**Proposed pricing (Jamil to confirm/adjust):**

- **Pro: $39/mo or $390/yr** (saves 17%)
  - 10 missions/month included
  - 100 chat messages/month
  - Standard exports (PDF/PPTX/CSV)
  - Email support
- **Team: $129/mo or $1290/yr** (saves 17%)
  - 40 missions/month included
  - 500 chat messages/month
  - 3 seat licenses (workspace functionality deferred to Phase C)
  - Priority support
  - Custom branding on exports (deferred to Phase C)

Per-mission pricing remains for non-subscribers. Subscriber dashboard
gets a usage meter.

ETA after pricing approved: ~6 hours.

---

## Tier 3 — descoped / deferred per Jamil's directive

- **B3 blog (10 SEO posts):** Descoped to 3 sample posts (1 full draft
  + 2 outlines) for voice/tone review. Held until Jamil signals.
- **B6 referrals + templates:** Sharing-only first; referrals + templates
  deferred to Phase C.
- **B7 digests + scheduling:** Welcome/completion email already shipped
  in A2; digests deferred until B5 ships (need engagement loop signal);
  recurring missions deferred to Phase C.
- **B9 A/B testing:** Deferred to Phase C. 13 funnel events / 24h is too
  little signal to A/B test meaningfully.

---

## Tag

`pass-23-phase-a-complete` is on origin (Phase A close-out).

Tier 1 of Phase B does not get its own tag yet — Phase B isn't closed
until B2 expansion + B8 + B5 + B6 sharing land. Will tag
`pass-23-phase-b-tier-1-complete` when that batch ships.

---

## Next moves

1. **Jamil:** review `/vs/surveymonkey` voice/tone (5 calibration
   questions above). Sign off or course-correct.
2. **Jamil:** sign up at sentry.io, create the two projects, paste DSNs.
3. **Jamil:** approve / adjust the Pro $39 / Team $129 pricing.
4. After all three: Claude Code ships the remaining 4 comparison pages,
   the Sentry/monitoring/status-page scaffold, the Stripe Subscriptions
   tier, the 3 sample blog posts, and the public-share-only B6.
