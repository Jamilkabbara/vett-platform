# Pass 6B Report — World-Complete Country List

**Branch:** `pass-6-fixes`
**Date:** 2026-04-22

---

## (a) Files changed

| File | Change |
|------|--------|
| `src/data/targetingOptions.ts` | COUNTRIES: 58 → 193 entries. CITIES: 22 → 57 keys. REGIONS: MENA expanded. IL removed, PS/SY/IR/IQ/YE added. |

---

## (b) What changed and why

### COUNTRIES — 58 → 193 entries

Previous list covered ~30% of world countries. Users targeting Syria, Iran, Palestine, or most of Africa/Central Asia could not find those markets in the targeting panel.

**Specific geopolitical changes (per Jamil's instructions):**
- **Removed:** `IL` (Israel) — hard cutover, not soft migration
- **Added:** `PS` (Palestine) — `tier: 3`, `region: 'Middle East'`
- **Added:** `SY` (Syria) — `tier: 3`, `region: 'Middle East'`
- **Added:** `IR` (Iran) — `tier: 3`, `region: 'Middle East'`
- **Added:** `IQ` (Iraq) — `tier: 3`, `region: 'Middle East'`
- **Added:** `YE` (Yemen) — `tier: 3`, `region: 'Middle East'`

**Regions added (Africa):** DZ, AO, BJ, BW, BF, BI, CV, CM, CF, TD, KM, CG, CD, DJ, GQ, ER, SZ, ET, GA, GM, GH, GN, GW, CI, LS, LR, LY, MG, MW, ML, MR, MU, MZ, NA, NR, NE, RW, ST, SC, SL, SO, SS, SD, TZ, TG, UG, ZM, ZW

**Regions added (Americas):** AG, BS, BB, BZ, BO, CR, CU, DM, DO, EC, SV, GD, GT, GY, HT, HN, JM, NI, PA, PY, PE, KN, LC, VC, SR, TT, UY, VE

**Regions added (Asia):** AF, AM, AZ, BN, KH, CN, GE, KZ, KG, LA, MV, MN, MM, NP, LK, TJ, TL, TM, UZ

**Regions added (Europe):** AL, AD, BA, BY, MC, MD, ME, MK, RU, SM, XK→not added (not UN-recognized)

**Regions added (Oceania):** FJ, KI, MH, FM, PW, PG, WS, SB, TO, TV, VU

### Tier assignment
| Tier | Countries |
|------|-----------|
| 1 (major markets) | AE, AU, CA, CH, DE, DK, FR, GB, IE, JP, KR, NL, NO, NZ, SE, SG, US |
| 2 (secondary + major emerging) | AR, AT, BD, BE, BG, BH, BR, CL, CN, CO, CY, CZ, EE, ES, FI, GR, HK, HR, HU, ID, IN, IS, IT, JO, KW, LB, LK, LT, LU, LV, MT, MX, MY, NG, OM, PH, PK, PL, PT, QA, RO, RS, RU, SA, SK, SI, TH, TR, TW, UA, VN, ZA |
| 3 (emerging/frontier) | Everything else |

### CITIES — 22 → 57 keys

Added cities for all tier-1 and tier-2 countries plus key tier-3 markets:

New entries: AR, AT, BD, BE, BG, BR, BY, CH, CL, CN, CO, CZ, DK, EE, ET, FI, GH, GR, HK, HR, HU, ID, IE (updated), IN (updated), IQ, IR, KE (updated), KR, KZ, LK, LT, LU, LV, MK, MM, MN, MT, MX, MY, NL, NO, NZ, PH (updated), PK, PL, PS, PT, RS, RU, SE, SI, SK, SY, TH, TR, TW, UA, UZ, VN, ZA

**Palestine cities:** Ramallah, Gaza, Hebron, Bethlehem, Nablus, East Jerusalem

**Syria cities:** Damascus, Aleppo, Homs, Hama, Latakia

**Iran cities:** Tehran, Mashhad, Isfahan, Shiraz, Tabriz, Karaj

Minimum 3 cities per entry. Capitals always included.

### REGIONS — MENA expanded

Added PS, SY, IQ, YE, DZ, LY to the MENA preset:
```ts
// Before: AE, SA, KW, QA, BH, OM, EG, JO, LB, MA, TN (11 countries)
// After:  AE, SA, KW, QA, BH, OM, EG, JO, LB, MA, TN, PS, SY, IQ, YE, DZ, LY (17 countries)
```

GCC preset unchanged: AE, SA, KW, QA, BH, OM.

---

## (c) Migration strategy for existing data

**Hard cutover chosen (not soft migration).** Existing missions with `targeting.geography.countries: ['IL']` stored in Supabase will silently not render `IL` as a selected country (UI ignores unknown/removed codes). Affected users can re-select `PS` (Palestine). No DB migration needed.

No backend changes needed — the `suggestTargeting` and `generateSurvey` prompts in `claudeAI.js` had no Israel references.

---

## (d) Build output

```
✓ built in 2.29s
```

TypeScript build clean. The `targetingOptions.ts` file went from ~220 lines to ~350 lines. `missionGoals` data chunk unchanged.

---

## (e) Known limitations

- **Tier assignments are opinionated.** Russia, China classified as tier-2 (active research markets despite geopolitical complexity). Panel providers may have different coverage levels for tier-3 markets — this affects actual respondent availability, not the targeting UI.
- **Existing IL missions:** users who had Israel selected won't see their selection highlighted. They'll need to manually select Palestine if that was their intended market.
- **No North Korea (KP):** excluded as not a viable consumer research market.
- **Kosovo (XK):** excluded — not UN-recognized. Add if needed.
- **Cities are not exhaustive.** For new tier-3 entries, only capitals and 1-2 major cities are listed. Expand in a future pass if users request additional cities.

---

## Test instructions for Jamil

**Country picker — new markets:**
1. Open `/dashboard/:missionId` → Audience Targeting → Geography
2. Search or scroll to "Palestine" → should appear (not "Israel")
3. Search for "Syria" → should appear
4. Search for "Iran" → should appear
5. Search for "Iraq" → should appear
6. Search for "Yemen" → should appear
7. Search for "Israel" → should NOT appear

**MENA region preset:**
1. In the Geography section, click the "MENA" region chip
2. Should now pre-select: AE, SA, KW, QA, BH, OM, EG, JO, LB, MA, TN, PS, SY, IQ, YE, DZ, LY

**Cities for Palestine:**
1. Select Palestine (PS) as a country
2. Enable city targeting
3. Cities dropdown should show: Ramallah, Gaza, Hebron, Bethlehem, Nablus, East Jerusalem

**Cities for Syria:**
1. Select Syria (SY)
2. Cities: Damascus, Aleppo, Homs, Hama, Latakia

**Verify count:**
```js
// In browser console on any page that imports targetingOptions:
import('/src/data/targetingOptions.ts').then(m => console.log(m.COUNTRIES.length))
// Expected: 193
```
