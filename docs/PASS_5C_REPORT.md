# Pass 5C Report — AI Targeting Pipeline

**Branch:** `pass-4-7-fixes`
**Date:** 2026-04-22

---

## (a) Files changed with per-file fix count

| File | Change |
|------|--------|
| `src/services/aiService.ts` | +60 lines: new `suggestTargeting` standalone export |
| `src/pages/MissionSetupPage.tsx` | +4 lines: store `aiResult?.suggestedTargeting` as `target_audience.aiTargeting` |
| `src/pages/DashboardPage.tsx` | +60 lines: import `SuggestedTargeting`, add `aiSuggestedTargeting` state, hydrate from `aiTargeting` on load, pass prop, clear badge on manual edit |
| `src/components/dashboard/MissionControlTargeting.tsx` | +7 lines: add `aiSuggestedTargeting` prop, make "· AI Suggested" badge conditional |
| `vettit-backend/src/services/claudeAI.js` | Full rewrite: replace direct `Anthropic` client + deprecated `claude-sonnet-4-5` with `callClaude` abstraction |
| `vettit-backend/src/services/ai/anthropic.js` | +1 line: add `results_analysis` to `MODEL_ROUTING` |

---

## (b) What was broken and what was fixed

### Gap 1 — `suggestedTargeting` was never persisted
**Before:** `generateSurvey()` in `MissionSetupPage.tsx` returned a rich `suggestedTargeting` object (countries, age ranges, genders, employment, industries, etc.) but only the legacy `targetingSuggestions` shape (flat recommendedCountries array) was stored in `target_audience.suggestions`. The full structured shape was silently discarded.

**Fix:** Added `aiTargeting: aiResult?.suggestedTargeting ?? null` to the `target_audience` jsonb payload. The full `SuggestedTargeting` shape now persists to the DB alongside the existing `suggestions` legacy field (kept for backward compatibility).

### Gap 2 — `DashboardPage` never read `aiTargeting`
**Before:** On load, `hydrateTargeting(mission.targeting)` returned `DEFAULT_TARGETING` for new missions (the `targeting` column is null until a user makes a manual change). Phase 4 seeded only the geography.countries from the Clarify `market` answer. Richer AI signals (age ranges, employment, industries) were never applied.

**Fix:** On load, when `initialTargeting.geography.countries.length === 0`, the new logic:
1. Checks `target_audience.aiTargeting` first
2. If it exists and contains at least one country, constructs a full `TargetingConfig` from the AI shape and uses it as `initialTargeting`
3. Sets `aiSuggestedTargeting = true`
4. Persists the seeded targeting to the `targeting` column (fire-and-forget) so subsequent loads are fast and consistent

Phase 4 (market preset) now runs as a **fallback** only when no `aiTargeting` is available.

### Gap 3 — "· AI Suggested" badge was always visible
**Before:** The badge in `MissionControlTargeting.tsx` was hardcoded — it appeared even on missions where no AI targeting was applied, or after the user had made manual changes.

**Fix:**
- Added `aiSuggestedTargeting?: boolean` prop (defaults to `false`)
- Badge now renders only when `aiSuggestedTargeting === true`
- `handleTargetingChange` in `DashboardPage` sets `setAiSuggestedTargeting(false)` on first user edit — badge disappears the moment the user personalises the targeting

### Gap 4 — `claudeAI.js` used deprecated model + bypassed cost tracking
**Before:** `claudeAI.js` created its own `Anthropic` client with `MODEL = 'claude-sonnet-4-5'` (a model ID not in the current valid-model list). All calls bypassed `callClaude()`, so no cost tracking, no latency logging, and no centralised model routing.

**Fix:** Complete rewrite of `claudeAI.js`:
- Removed `new Anthropic({ apiKey: ... })` and the hardcoded `MODEL` constant
- All five functions now call `callClaude({ callType, messages, maxTokens })` from `./ai/anthropic`
- Model routing:

| Function | callType | Model |
|----------|----------|-------|
| `generateSurvey` | `survey_gen` | `claude-sonnet-4-6` |
| `refineQuestion` | `question_refine` | `claude-haiku-4-5` |
| `refineMissionDescription` | `question_refine` | `claude-haiku-4-5` |
| `analyseResults` | `results_analysis` | `claude-sonnet-4-6` |
| `suggestTargeting` | `targeting_suggest` | `claude-sonnet-4-6` |

- Added `results_analysis` to `MODEL_ROUTING` in `anthropic.js` (was the only call type missing)
- All JSON parsing replaced with `extractJSON()` helper (handles code-fenced responses, graceful errors)

---

## (c) Data flow — end-to-end

```
MissionSetupPage
  └─ generateSurvey() → aiResult.suggestedTargeting
       └─ saved to target_audience.aiTargeting (jsonb)

DashboardPage (on load)
  └─ hydrateTargeting(mission.targeting)  ← returns DEFAULT if targeting col is null
  └─ if geography.countries.length === 0
       └─ read target_audience.aiTargeting
           └─ if present → build TargetingConfig → set initialTargeting
                           setAiSuggestedTargeting(true)
                           persist to targeting col
           └─ else        → Phase 4 market preset fallback
  └─ <MissionControlTargeting aiSuggestedTargeting={aiSuggestedTargeting} />

MissionControlTargeting
  └─ {aiSuggestedTargeting && <span>· AI Suggested</span>}
  └─ onChange → DashboardPage.handleTargetingChange
                  └─ setAiSuggestedTargeting(false)  ← badge disappears
```

---

## (d) Build output (unchanged from Pass 5A)

`npm run build` completed successfully. Bundle sizes are unchanged:

| Key chunk | Raw | Gzip |
|-----------|-----|------|
| `index.js` (app shell) | 35.0 kB | 11.7 kB |
| `vendor-react` | 36.7 kB | 13.4 kB |
| `DashboardPage` | 85.0 kB | 24.4 kB (+0.8 kB from Pass 5A) |
| `MissionSetupPage` | 21.2 kB | 6.8 kB |

The +0.8 kB in DashboardPage is the new `aiTargetingToConfig` inline logic and state wiring.

---

## (e) Edge cases

**New mission with no AI result:** If `generateSurvey()` fails (network error, AI timeout), `aiResult` is null and `aiTargeting` is stored as `null`. DashboardPage falls through to Phase 4 market preset. No regression.

**Mission created before Pass 5C:** `target_audience.aiTargeting` will be absent (field never stored). `rawAiTargeting` will be `undefined`, the AI branch skips, Phase 4 runs as before. No regression.

**AI suggests zero countries:** The check `aiConfig.geography.countries.length > 0` guards against this. If the AI returns an empty country list, the AI branch skips and Phase 4 runs as fallback.

**Badge after page refresh:** `aiSuggestedTargeting = true` is only set when the `targeting` column is null AND `aiTargeting` exists. After the first load, the targeting is persisted to the `targeting` column. On the second load, `hydrateTargeting(mission.targeting)` returns a non-empty config (countries.length > 0), the AI branch never runs, and `aiSuggestedTargeting` stays `false`. The badge correctly disappears after the first load persists the targeting.

---

## (f) Known limitations

- **Badge lifetime:** The badge disappears after the first load (because targeting is persisted on first view). This is intentional — once the user has seen the AI suggestion and the targeting panel shows it, the "AI Suggested" label becomes redundant. If the user never visits the dashboard before the targeting is invalidated, they'll never see the badge — acceptable for the current UX.
- **`refineMissionDescription` uses `question_refine` callType:** This function is not a question refinement — it refines a mission description. In a future pass, add a dedicated `mission_describe` callType with a more appropriate model (currently routes to haiku-4-5 which is fine for this short task).
- **Backend `suggestTargeting` response shape:** The backend's `/api/ai/suggest-targeting` returns a nested shape (`geography.recommendedCountries`, `demographics.ageRanges`, etc.) while `aiService.ts` flattens it in `suggestTargeting()`. The backend's `claudeAI.js suggestTargeting` returns the same nested shape. The two shapes are consistent — `aiService.ts` maps `geography.recommendedCountries` → `countries`, `demographics.ageRanges` → `ageRanges`, etc.

---

## Test instructions for Jamil

**AI Targeting seeding:**
1. Create a new mission with a description mentioning a specific market (e.g., "validate a coffee subscription in the UK for millennials")
2. Navigate to `/dashboard/:missionId`
3. The targeting panel should show:
   - Countries pre-filled (e.g., "GB")
   - Age ranges pre-filled (e.g., "25-34", "35-44")
   - "· AI Suggested" badge visible in the Audience Targeting header
4. Open browser DevTools → Network → filter for `missions?id=` — the targeting column should be non-null

**Badge clears on manual edit:**
1. On the same mission, click any country to deselect it (or add a new one)
2. The "· AI Suggested" badge should disappear from the header immediately

**Missions without AI targeting (pre-5C or AI-failed):**
1. Find a mission created before this pass (no `aiTargeting` in `target_audience`)
2. Dashboard should load normally — Phase 4 market preset still applies
3. No "· AI Suggested" badge visible

**Backend model routing:**
1. Trigger a question refine (click the refine button on any question)
2. In Railway logs, the `ai_calls` table should show `call_type = 'question_refine'` and `model = 'claude-haiku-4-5'` (not the deprecated `claude-sonnet-4-5`)
