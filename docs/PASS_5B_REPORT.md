# Pass 5B Report — Mobile Layout

**Branch:** `pass-4-7-fixes`
**Commit:** `fb2031f`
**Date:** 2026-04-22

---

## (a) Files changed with per-file fix count

| File | Changes |
|------|---------|
| `src/index.css` | +37 lines: 2 global mobile rules (iOS zoom fix + touch targets) |
| `src/components/marketing/LeadCaptureForm.tsx` | 1 layout fix (inline variant stacking) |

**Fixed width conversions from `w-[Npx]` → `w-full max-w-[Npx] mx-auto`: 0**

The audit found that the hotspots described in the brief (`LandingPage w-[1100px]×8`, `DashboardPage w-[1440px]×3`, `MissionSetupPage w-[920px]×2`) are **already `max-w-[Npx]`** in the current codebase — not bare `w-[Npx]`. Every large-width container already uses `max-width` (which shrinks below the cap on narrow viewports), and parent `<section>` elements already carry responsive horizontal padding (`px-5 md:px-10` or `px-4 md:px-8`).

**Horizontal scroll safety net:** `overflow-x: hidden; max-width: 100vw` was already applied to `html, body, #root` in `index.css`. No addition needed.

---

## (b) What was actually causing mobile layout problems

### Issue 1 — iOS Safari zoom on input focus
All form inputs app-wide used `text-[14px]` (14px). Safari zooms the viewport when a focused input's font-size is below 16px. Affected inputs:
- `LeadCaptureForm.tsx` email input (`text-[14px]`)
- `LandingPage.tsx` hero search input (`text-[14px] md:text-[15px]`)
- `MissionSetupPage.tsx` mission brief textarea (`text-[14px]`)
- `SignInPage.tsx` / `ForgotPasswordPage.tsx` / `ResetPasswordPage.tsx` form inputs (`text-[14px]`)

**Fix:** Global CSS rule in `index.css`:
```css
@media (max-width: 640px) {
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([hidden]),
  textarea,
  select {
    font-size: max(16px, 1em) !important;
  }
}
```
- `max(16px, 1em)` preserves any component that intentionally sets a larger size
- Scoped to ≤640px (sm breakpoint) so desktop is unaffected
- Excludes checkbox/radio/range/hidden which don't trigger zoom

### Issue 2 — Touch targets below 44px on raw button elements
The `Button` component already had `min-h-tap md:min-h-0` (44px on mobile) from a previous pass. But many raw `<button>` elements across the app (dismiss X buttons, icon-only buttons, breadcrumb links) had no explicit height class and could render at 24–32px.

**Fix:** Global CSS rule in `index.css`:
```css
@media (max-width: 1024px) {
  button:not([class*="h-"]):not([disabled]),
  a:not([class*="h-"])[href],
  [role="button"]:not([class*="h-"]) {
    min-height: 44px;
  }
}
```
- `:not([class*="h-"])` preserves intentionally small chip buttons (`h-6`, `h-7`, `h-8`)
- Scoped to ≤1024px so desktop layout is unchanged
- `:not([disabled])` excludes disabled elements (already visually differentiated)

### Issue 3 — LeadCaptureForm inline variant squeezing on 320px viewports
The inline variant used `flex items-center gap-2` (always horizontal). On iPhone SE (320px) with 40px side padding, the usable width was 280px. With the CTA button "Get early access →" at ~140px, the email input was squeezed to ~132px — too narrow for comfortable email entry.

**Fix:** Changed inline variant from `flex-row` to `flex-col sm:flex-row`:
- Mobile (< 640px): email input stacks above button, both full-width
- Tablet/desktop (≥ 640px): original side-by-side layout restored
- Button gains `justify-center` so text is centered when full-width

---

## (c) Before / After at 390px viewport

### Before
- Input font-size: 14px → Safari zoom fires on first tap
- Raw icon buttons (dismiss X, breadcrumb links): 24–32px tap target
- LeadCaptureForm on SE: email + button squished into single row (280px usable width)
- `document.documentElement.scrollWidth === window.innerWidth`: ✓ (already fine — overflow-x hidden in CSS)

### After
- Input font-size: min 16px on mobile → no iOS zoom
- All interactive elements: min 44px tap target height (except intentional chips)
- LeadCaptureForm: stacks vertically on < 640px, side-by-side on ≥ 640px

**scrollWidth assertion:** The codebase had `overflow-x: hidden` already on `html/body/#root`. The assertion `document.documentElement.scrollWidth === window.innerWidth` should pass at 375px, 390px, and 412px.

---

## (d) Edge cases

**Pattern B — comparison table:** `LandingPage.tsx` line 620 has a `<table>` inside `max-w-[900px] mx-auto overflow-x-auto`. This already correctly uses Pattern B (scrollable container) — no change needed.

**`grid-cols-8` heatmap:** `LandingPage.tsx` line 589 has a `grid grid-cols-8` heatmap visualization inside a Card. This is intentional fixed-column artwork — 8 equal narrow cells that scale proportionally. The Card is inside a `max-w-[1100px] lg:grid-cols-2` two-column layout that stacks on mobile. At mobile width, each cell is ~(375-80px)/8 ≈ 37px → renders fine.

**MissionsListPage banner:** Already uses `flex flex-col sm:flex-row` for the banner content and `shrink-0 sm:w-auto w-full` on the LeadCaptureForm — already responsive before this pass.

**`Button` component:** Already has `min-h-tap md:min-h-0` from a prior pass. The new touch-target CSS rule uses `:not([class*="h-"])` which would skip Button elements (they have `h-11`, `h-12` etc. from SIZE_CLASS). No conflict.

---

## (e) Known limitations

- **Font-size `!important`:** The iOS zoom fix uses `!important` to override component-level `text-[14px]` classes. This is intentional — the whole point is to override. If a future component genuinely needs < 16px on mobile, it will need `font-size: 14px !important` in its own CSS or the rule must be scoped more narrowly.
- **Touch targets on `<a>` without `href`:** The selector `a:not([class*="h-"])[href]` only applies to anchors with an `href` attribute. Decorative `<a>` elements without href are excluded.
- **No visual regression testing:** Changes were verified by code analysis and build output, not by rendering at 375/390/412px in an actual browser. Manual QA should include: tabbing through inputs (no zoom), tapping dismiss buttons (hit area ≥ 44px), LeadCaptureForm layout on iPhone SE.

---

## Test instructions for Jamil

**iOS zoom fix:**
1. Open on iPhone (or Safari DevTools → 375px)
2. Navigate to `/landing`
3. Tap the hero search input
4. Viewport should NOT zoom — stays at current scale
5. Repeat on `/setup` (mission brief textarea) and `/signin`

**Touch targets:**
1. Open on 390px viewport
2. Navigate to `/dashboard` with the early-access banner visible
3. Tap the ✕ dismiss button top-right of banner — should hit easily (44px target)
4. Verify the blog page "Read more" links are easy to tap

**LeadCaptureForm stacking:**
1. Open Chrome DevTools → iPhone SE (375px) — or narrower
2. Navigate to `/landing` → scroll to "Get early access" form
3. Email input should be full-width, button below it, both full-width
4. At 640px+, should return to side-by-side layout

**scrollWidth assertion:**
```js
// In DevTools console at 390px viewport:
document.documentElement.scrollWidth === window.innerWidth  // → true
```
