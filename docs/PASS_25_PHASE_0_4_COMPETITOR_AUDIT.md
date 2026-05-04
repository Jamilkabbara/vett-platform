# Pass 25 Phase 0.4 — Competitor Mention Audit

**Date:** 2026-05-04
**Branch:** `pass-25-phase-1-brand-lift-v2-and-routing`

## Scope

VETT's user-facing marketing surfaces should not name competitors.
`/vs/*` comparison pages are the deliberate exception — they are SEO
assets where head-to-head comparison is the point. Internal docs in
`/docs/` are also exempt — those aren't user-facing.

## Findings

### DAIVID

| File | Line | Context | Action |
|---|---|---|---|
| `src/pages/LandingPage.tsx` | 76 | Hero card desc: "Daivid-style emotion mapping." | **REMOVE** — user-facing |
| `src/components/creative-attention/EmotionRadar.tsx` | 107 | Tooltip: "24 emotions (Plutchik 8 + DAIVID 16 nuanced)" | **REPHRASE** — user-facing |
| `src/components/creative-attention/CrossChannelBenchmarks.tsx` | 114 | Subtitle: "Predicted attention seconds vs industry norm (DAIVID/Amplified) across 5 channels" | **REPHRASE** — user-facing |
| `src/types/creativeAnalysis.ts` | 8, 172, 186 | Code comments | Rephrase (drop the proper noun) |
| `docs/PASS_24_*` + `docs/LAUNCH_CHECKLIST.md` | various | Internal pass logs | **LEAVE** — internal |
| `docs/legal/TERMS_OF_SERVICE.md` | 212 | Historical draft, NOT canonical (canonical is `src/content/legal/terms-of-service.md` which has zero matches) | **LEAVE** — internal-only file |

### Happydemics

| File | Line | Context | Action |
|---|---|---|---|
| `public/llms.txt` | 54 | "9-category Happydemics framework" — fed to LLM crawlers | **REPHRASE** — user-facing (LLM SEO) |
| `src/pages/ResultsPage.tsx` | 556, 2062 | Code comments | Rephrase |
| `src/pages/vs/*Page.tsx` | row | "Built-in 9-category Happydemics-style framework" — comparison-page row | **LEAVE** — `/vs/*` is the carve-out |

### SurveyMonkey / Typeform / UserTesting / Pollfish

Outside `/vs/*`:
- All references found are in `docs/PASS_23_AGENT_3_LOG.md` (internal pass log) or blog drafts. **LEAVE** internal.
- `src/pages/blog/drafts/synthetic-vs-panel-research-when-each-wins.md` mentions Kantar / Ipsos / Nielsen as research category context (not direct comparison). Drafts are not auto-published; left as is for Jamil to review when publishing.

### Other vendors (qualtrics / attest / kantar / nielsen / etc.)

No user-facing matches outside `/vs/*` and blog drafts. Nothing to do.

## Cleanup plan (commit 9)

Three files get visible copy edits:
1. `src/pages/LandingPage.tsx:76` — drop the proper noun.
2. `src/components/creative-attention/EmotionRadar.tsx:107` — rephrase the tooltip.
3. `src/components/creative-attention/CrossChannelBenchmarks.tsx:114` — rephrase the subtitle.
4. `public/llms.txt:54` — rephrase the framework name.

Three files get code-comment rephrases (no UI change):
5. `src/types/creativeAnalysis.ts` — three lines.
6. `src/pages/ResultsPage.tsx` — two comment lines.

`/vs/*` pages and `/docs/` folder left alone per the rules.
