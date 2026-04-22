# Pass 6C Report — Mobile Left-Shift Fix

**Branch:** `pass-6-fixes`
**Date:** 2026-04-22

---

## (a) Files changed

| File | Change |
|------|--------|
| `src/pages/LandingPage.tsx` | 3 targeted fixes: hero button, AI Consumer Research section, Creative Attention Analysis section |

---

## (b) Root cause diagnosis

### What was NOT the problem (confirmed by code audit)
- No bare `w-[NNNpx]` fixed widths ≥500px (all are `max-w-[NNNpx]`)
- Overflow-x is already guarded by `html/body/#root { overflow-x: hidden }` from Pass 5B
- Hero section has `flex flex-col items-center text-center` — headings and tagline are correctly centered
- TopNav is `flex items-center justify-between` — correct on mobile
- Logos strip uses `flex flex-col items-center` — correctly centered
- Sections using `SectionCenter` (`max-w-[1100px] mx-auto text-center`) are correctly centered
- Footer grid uses standard 2-col on mobile — intentional layout, not a bug

### What WAS the problem (3 issues found)

---

### Issue 1 — Hero form "VETT IT" button left-aligned on mobile

**Location:** `LandingPage.tsx` lines 290–308, inside the hero search form

The inner form row uses `flex flex-col md:flex-row` on mobile. The button container:
```tsx
<div className="flex items-center gap-2 shrink-0">
  <button ... className="hidden md:inline-flex ...">  // hidden on mobile
  <Button className="shrink-0">VETT IT</Button>      // NOT full-width
</div>
```

On mobile (flex-col parent), the button container div stretches full-width. But the VETT IT Button itself has no `w-full`, so it sits at the **left edge** of the full-width container — visually left-shifted.

This is the "from the first look" issue. The hero input is the first interactive element, and the button beneath it appears left-aligned while the heading and tagline above are centered.

**Fix:**
- Removed `shrink-0` from the container div on mobile (`md:shrink-0`)
- Added `w-full md:w-auto` to the Button — full-width on mobile, natural width on desktop

---

### Issue 2 — "AI Consumer Research" split section: text left-aligned on mobile

**Location:** `LandingPage.tsx` ~line 458, the left column of a 2-column split layout

The section uses `grid grid-cols-1 lg:grid-cols-2`. On mobile (1 column), the left column `<div>` containing SecTag, SecH2, SecSub, and feature items collapses to full-width. None of those elements have explicit centering — they default to `text-left`.

On desktop (≥1024px, 2 columns), left-aligned text is correct (left column of a side-by-side layout). On mobile, it looks like the text has a random left margin while the surrounding sections are centered.

**Fix:**
- Added `text-center lg:text-left` to the left column `<div>` — headings and body text center on mobile, restore left-align at lg+
- Feature items (`flex gap-3 emoji + text`) wrapped in `max-w-fit mx-auto lg:mx-0` so the block itself centers on mobile while keeping `text-left` on individual items (emoji+text rows look better left-aligned)

---

### Issue 3 — "Creative Attention Analysis" split section: same root cause

**Location:** `LandingPage.tsx` ~line 529, same pattern as Issue 2

The Creative Attention section uses `grid grid-cols-1 lg:grid-cols-2 items-start`. Same fix applied:
- `text-center lg:text-left` on the left column `<div>`
- Feature items in `max-w-fit mx-auto lg:mx-0` container
- Individual `flex gap-3` feature rows keep `text-left`

---

## (c) Before / After at 390px viewport

### Before
| Section | Mobile behavior |
|---------|----------------|
| Hero section headings | ✓ Centered (section has `text-center`) |
| Hero "VETT IT" button | ✗ **LEFT-ALIGNED** — appears to hug left edge below the centered input |
| "AI Consumer Research" label + heading | ✗ **LEFT-ALIGNED** — `text-left` default in split section |
| "Creative Attention Analysis" label + heading | ✗ **LEFT-ALIGNED** — same pattern |
| All `SectionCenter`-wrapped sections | ✓ Centered |
| Testimonials, Pricing, Footer | ✓ Intentional layout |

### After
| Section | Mobile behavior |
|---------|----------------|
| Hero "VETT IT" button | ✓ **Full-width** below input, matches centered form layout |
| "AI Consumer Research" headings | ✓ **Centered** on mobile, left-aligned at lg+ |
| "Creative Attention Analysis" headings | ✓ **Centered** on mobile, left-aligned at lg+ |
| Feature item lists (emoji + text) | ✓ Block centered on mobile, items themselves stay left-aligned (correct) |

---

## (d) Sections confirmed as intentionally left-aligned (not changed)

- **Research type cards** — `text-left` is intentional card layout; cards are full-width on mobile
- **Loop steps cards** — card content is left-aligned (standard card UX)
- **Testimonial cards** — quote text is left-aligned (standard blockquote UX)
- **Footer bottom row** — `flex-col items-start` on mobile, copyright left, links left — standard footer pattern
- **Comparison table** — `text-left` is correct for table content

---

## (e) Desktop verification

All changes use `lg:text-left` and `md:w-auto` class gates to restore desktop appearance:
- At ≥1024px: split sections show left-aligned text in the left column ✓ (unchanged from before)
- At ≥768px: hero VETT IT button returns to `w-auto` size in the flex-row form layout ✓
- Build: `✓ built in 2.10s` — no errors, no new warnings

---

## (f) Known limitations

- **Tablet (768px–1023px):** The split sections (`grid-cols-1 lg:grid-cols-2`) remain in 1-column mode on tablet, so text is **centered** at tablet width. This is consistent with the mobile treatment. If a future design wants 2-col at `md` instead of `lg`, the breakpoints would need updating.
- **Feature item centering:** The feature items (`emoji + title + body`) sit inside a `max-w-fit mx-auto` block on mobile. `max-w-fit` uses the intrinsic content width, which means the block is as wide as the longest line. If a feature item has a very long description that wraps, the block could be full-width and the `mx-auto` has no visual effect. This is acceptable — the emoji+text layout still renders correctly.
- **No visual regression testing:** Changes were verified by code analysis. Manual QA at 375/390/412px should confirm the hero button and section headings are centered before shipping.

---

## Test instructions for Jamil

**Hero button (most important, visible "from first look"):**
1. Open on iPhone (or Chrome DevTools → 390px viewport)
2. Navigate to `/` or `/landing`
3. The "VETT IT" button below the search input should be **full-width**, not left-aligned
4. At ≥768px (tablet/desktop), button should return to its natural compact size

**AI Consumer Research and Creative Attention sections:**
1. Scroll down to the "AI Consumer Research" section
2. "✦ AI Consumer Research" tag label, "Consumer signals at scale." heading, and the body paragraph should be **horizontally centered** on mobile
3. Feature item rows (with emoji) should be centered as a block but individually left-aligned
4. At ≥1024px (desktop): all text should be **left-aligned** (left column of 2-col layout) — verify no regression

**scrollWidth assertion:**
```js
// In DevTools console at 390px:
document.documentElement.scrollWidth === window.innerWidth  // → true
```
